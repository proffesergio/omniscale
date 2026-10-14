begin;
-- Paged availability: page forward through upcoming open slots with a keyset
-- cursor instead of truncating silently at a fixed limit. The default call
-- shape (no arguments) is preserved so existing clients keep working.
drop function if exists public.available_slots();
create function public.available_slots(p_after timestamptz default null, p_limit integer default 200)
returns table(id uuid, starts_at timestamptz, ends_at timestamptz)
language sql security definer set search_path = public as $$
  select s.id, s.starts_at, s.ends_at from public.slots s
  where s.is_open
    and s.starts_at > now() + interval '2 hours'
    and s.starts_at < now() + interval '90 days'
    and (p_after is null or s.starts_at > p_after)
    and not exists(select 1 from public.bookings b where b.slot_id = s.id and b.status <> 'cancelled')
  order by s.starts_at
  limit least(greatest(coalesce(p_limit, 200), 1), 200);
$$;
revoke execute on function public.available_slots(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.available_slots(timestamptz, integer) to service_role;
commit;
