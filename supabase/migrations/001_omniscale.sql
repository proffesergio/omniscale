begin;
create extension if not exists btree_gist;

create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
create policy own_admin_record on public.admins for select to authenticated using (user_id = auth.uid());

create table public.audit_submissions (
  id uuid primary key, payload jsonb not null, created_at timestamptz not null default now()
);
create table public.slots (
  id uuid primary key default gen_random_uuid(), starts_at timestamptz not null,
  ends_at timestamptz not null, is_open boolean not null default true,
  check (ends_at = starts_at + interval '30 minutes'),
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
);
create table public.bookings (
  id uuid primary key, slot_id uuid not null references public.slots(id),
  name text not null, email text not null, website text not null, timezone text not null,
  notes text not null default '', status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  token_hash text not null unique, request_payload jsonb not null, created_at timestamptz not null default now()
);
create unique index one_booking_per_slot on public.bookings(slot_id) where status <> 'cancelled';
create table public.rate_limits (key text primary key, hits integer not null, expires_at timestamptz not null);
create table public.outbox (
  id uuid primary key default gen_random_uuid(), kind text not null, payload jsonb not null,
  attempts integer not null default 0, available_at timestamptz not null default now(),
  delivered_at timestamptz, last_error text, created_at timestamptz not null default now()
);
create index pending_outbox on public.outbox(available_at) where delivered_at is null;

alter table public.audit_submissions enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;
alter table public.rate_limits enable row level security;
alter table public.outbox enable row level security;
create policy admin_audits on public.audit_submissions for select to authenticated using (exists(select 1 from public.admins where user_id=auth.uid()));
create policy admin_slots on public.slots for select to authenticated using (exists(select 1 from public.admins where user_id=auth.uid()));
create policy admin_bookings on public.bookings for select to authenticated using (exists(select 1 from public.admins where user_id=auth.uid()));

create function public.consume_rate(p_key text, p_limit integer, p_seconds integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.rate_limits(key,hits,expires_at) values (p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set hits=case when rate_limits.expires_at < now() then 1 else rate_limits.hits+1 end,
    expires_at=case when rate_limits.expires_at < now() then now()+make_interval(secs=>p_seconds) else rate_limits.expires_at end
  returning hits into n;
  return n <= p_limit;
end $$;

create function public.submit_audit(p_data jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare existing jsonb; submission_id uuid := (p_data->>'requestId')::uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(submission_id::text,0));
  select payload into existing from public.audit_submissions where id=submission_id;
  if found then
    if existing <> p_data then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return submission_id;
  end if;
  insert into public.audit_submissions(id,payload) values(submission_id,p_data);
  insert into public.outbox(kind,payload) values('audit',p_data);
  return submission_id;
end $$;

create function public.available_slots() returns table(id uuid, starts_at timestamptz, ends_at timestamptz)
language sql security definer set search_path = public as $$
  select s.id,s.starts_at,s.ends_at from public.slots s
  where s.is_open and s.starts_at > now()+interval '2 hours' and s.starts_at < now()+interval '90 days'
  and not exists(select 1 from public.bookings b where b.slot_id=s.id and b.status <> 'cancelled')
  order by s.starts_at limit 200;
$$;

create function public.reserve_booking(p_data jsonb, p_token_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.slots; existing public.bookings; booking_id uuid := (p_data->>'requestId')::uuid; result jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(booking_id::text,0));
  select * into existing from public.bookings where id=booking_id;
  if found then
    if existing.request_payload <> p_data then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    select * into s from public.slots where id=existing.slot_id;
    return jsonb_build_object('id',existing.id,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',existing.status);
  end if;
  select * into s from public.slots where id=(p_data->>'slotId')::uuid for update;
  if not found or not s.is_open or s.starts_at <= now()+interval '2 hours' or s.starts_at >= now()+interval '90 days' then raise exception 'SLOT_UNAVAILABLE'; end if;
  if exists(select 1 from public.bookings where slot_id=s.id and status <> 'cancelled') then raise exception 'SLOT_UNAVAILABLE'; end if;
  insert into public.bookings(id,slot_id,name,email,website,timezone,notes,token_hash,request_payload)
  values(booking_id,s.id,p_data->>'name',p_data->>'email',p_data->>'website',p_data->>'timezone',p_data->>'notes',p_token_hash,p_data);
  result := jsonb_build_object('id',booking_id,'starts_at',s.starts_at,'ends_at',s.ends_at,'status','confirmed');
  insert into public.outbox(kind,payload) values('booking',result || jsonb_build_object('email',p_data->>'email','name',p_data->>'name','timezone',p_data->>'timezone'));
  return result;
end $$;

create function public.manage_booking(p_token_hash text, p_cancel boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b public.bookings; s public.slots; result jsonb;
begin
  select * into b from public.bookings where token_hash=p_token_hash for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  select * into s from public.slots where id=b.slot_id;
  if p_cancel and b.status='confirmed' then
    if s.starts_at <= now() then raise exception 'BOOKING_STARTED'; end if;
    update public.bookings set status='cancelled' where id=b.id;
    b.status := 'cancelled';
    insert into public.outbox(kind,payload) values('booking',jsonb_build_object('id',b.id,'email',b.email,'name',b.name,'timezone',b.timezone,'status','cancelled','starts_at',s.starts_at,'ends_at',s.ends_at));
  end if;
  result := jsonb_build_object('id',b.id,'name',b.name,'status',b.status,'starts_at',s.starts_at,'ends_at',s.ends_at);
  return result;
end $$;

create function public.admin_update_booking(p_id uuid, p_status text, p_slot_id uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bookings; s public.slots;
begin
  if p_status not in ('confirmed','cancelled','completed') then raise exception 'INVALID_STATUS'; end if;
  select * into b from public.bookings where id=p_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  select * into s from public.slots where id=coalesce(p_slot_id,b.slot_id) for update;
  if p_slot_id is not null then
    if not s.is_open or s.starts_at <= now()+interval '2 hours' then raise exception 'SLOT_UNAVAILABLE'; end if;
    if exists(select 1 from public.bookings where slot_id=s.id and id<>b.id and status<>'cancelled') then raise exception 'SLOT_UNAVAILABLE'; end if;
  end if;
  if p_status='confirmed' and s.starts_at <= now() then raise exception 'BOOKING_STARTED'; end if;
  if p_status='completed' and s.ends_at > now() then raise exception 'BOOKING_NOT_ENDED'; end if;
  update public.bookings set status=p_status, slot_id=s.id where id=b.id;
  insert into public.outbox(kind,payload) values('booking',jsonb_build_object('id',b.id,'email',b.email,'name',b.name,'timezone',b.timezone,'status',p_status,'starts_at',s.starts_at,'ends_at',s.ends_at));
end $$;

create function public.claim_notifications() returns setof public.outbox
language plpgsql security definer set search_path = public as $$
begin
  delete from public.rate_limits where expires_at < now()-interval '1 day';
  return query update public.outbox set attempts=attempts+1,available_at=now()+interval '5 minutes'
  where id in (select id from public.outbox where delivered_at is null and available_at <= now() and attempts<8 order by created_at limit 20 for update skip locked)
  returning *;
end $$;

revoke all on public.audit_submissions, public.bookings, public.slots, public.rate_limits, public.outbox, public.admins from anon, authenticated;
grant select on public.admins, public.audit_submissions, public.bookings, public.slots to authenticated;
grant all on public.audit_submissions, public.bookings, public.slots, public.rate_limits, public.outbox, public.admins to service_role;
revoke execute on function public.consume_rate(text,integer,integer), public.submit_audit(jsonb), public.available_slots(), public.reserve_booking(jsonb,text), public.manage_booking(text,boolean), public.admin_update_booking(uuid,text,uuid), public.claim_notifications() from public, anon, authenticated;
grant execute on function public.consume_rate(text,integer,integer), public.submit_audit(jsonb), public.available_slots(), public.reserve_booking(jsonb,text), public.manage_booking(text,boolean), public.admin_update_booking(uuid,text,uuid), public.claim_notifications() to service_role;
commit;
