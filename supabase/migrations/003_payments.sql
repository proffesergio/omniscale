begin;
-- Manual mobile-bank payments (bKash/Nagad/Rocket/bank): the team publishes
-- personal receiving accounts + QR artwork from the admin panel, visitors
-- submit the provider transaction ID, and the team verifies it by hand.
-- No gateway keys or automatic charge capture are involved.
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('bkash','nagad','rocket','bank','card','other')),
  label text not null, account_name text not null default '',
  account_number text not null, qr_image_url text not null default '',
  instructions text not null default '',
  is_active boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.manual_payments (
  id uuid primary key, method_id uuid not null references public.payment_methods(id),
  plan text not null, amount_text text not null,
  sender_number text not null, trxid text not null,
  payer_name text not null, payer_email text not null, note text not null default '',
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);
create unique index one_trxid_per_method on public.manual_payments(method_id, trxid);
alter table public.payment_methods enable row level security;
alter table public.manual_payments enable row level security;
create policy admin_payment_methods on public.payment_methods for select to authenticated using (exists(select 1 from public.admins where user_id=auth.uid()));
create policy admin_manual_payments on public.manual_payments for select to authenticated using (exists(select 1 from public.admins where user_id=auth.uid()));

create function public.submit_manual_payment(p_data jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare existing jsonb; payment_id uuid := (p_data->>'requestId')::uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(payment_id::text,0));
  select to_jsonb(m.*) into existing from public.manual_payments m where m.id=payment_id;
  if found then
    if existing->>'trxid' <> p_data->>'trxid' or existing->>'sender_number' <> p_data->>'senderNumber' then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return payment_id;
  end if;
  if not exists(select 1 from public.payment_methods where id=(p_data->>'methodId')::uuid and is_active) then raise exception 'METHOD_UNAVAILABLE'; end if;
  insert into public.manual_payments(id,method_id,plan,amount_text,sender_number,trxid,payer_name,payer_email,note)
  values(payment_id,(p_data->>'methodId')::uuid,p_data->>'plan',p_data->>'amountText',p_data->>'senderNumber',p_data->>'trxid',p_data->>'payerName',p_data->>'payerEmail',coalesce(p_data->>'note',''));
  insert into public.outbox(kind,payload) values('payment',p_data);
  return payment_id;
end $$;

revoke all on public.payment_methods, public.manual_payments from anon, authenticated;
grant select on public.payment_methods, public.manual_payments to authenticated;
grant all on public.payment_methods, public.manual_payments to service_role;
revoke execute on function public.submit_manual_payment(jsonb) from public, anon, authenticated;
grant execute on function public.submit_manual_payment(jsonb) to service_role;
commit;
