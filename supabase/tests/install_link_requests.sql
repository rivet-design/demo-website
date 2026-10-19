-- Run against an empty disposable Postgres database, never production.
create role anon;
create role authenticated;
create role service_role bypassrls;

\ir ../migrations/202610190001_install_link_requests.sql

begin;
set local role service_role;
do $$
declare
  first_claim jsonb;
  next_claim jsonb;
  i integer;
begin
  first_claim := public.claim_install_link('person@example.com', 'ip-a', 'r_aZ09bY18');
  if first_claim->>'outcome' <> 'send' then raise exception 'First request must send'; end if;
  if first_claim->>'install_ref' <> 'r_aZ09bY18' then raise exception 'Must retain ref'; end if;
  next_claim := public.claim_install_link('person@example.com', 'ip-b', 'r_12345678');
  if next_claim->>'outcome' <> 'in_flight' then raise exception 'Concurrent send must not succeed'; end if;

  perform public.finish_install_link((first_claim->>'id')::uuid, 'failed', null);
  next_claim := public.claim_install_link('person@example.com', 'ip-b', 'r_12345678');
  if next_claim <> first_claim then raise exception 'Failed send must reuse request id and ref'; end if;
  perform public.finish_install_link((first_claim->>'id')::uuid, 'sent', 'resend-1');
  next_claim := public.claim_install_link('person@example.com', 'ip-c', 'r_12345678');
  if next_claim->>'outcome' <> 'duplicate' then raise exception '24h duplicate must be suppressed'; end if;
  if (select count(*) from public.install_link_requests where status = 'suppressed_duplicate') <> 1 then
    raise exception 'Must record suppression';
  end if;

  -- The 24-hour window starts at send time, including a delayed retry.
  update public.install_link_requests set created_at = now() - interval '25 hours'
    where id = (first_claim->>'id')::uuid;
  next_claim := public.claim_install_link('person@example.com', 'ip-c', 'r_12345678');
  if next_claim->>'outcome' <> 'duplicate' then raise exception 'Send time must define suppression window'; end if;
  update public.install_link_requests set updated_at = now() - interval '25 hours'
    where id = (first_claim->>'id')::uuid;
  next_claim := public.claim_install_link('person@example.com', 'ip-c', 'r_12345678');
  if next_claim->>'outcome' <> 'send' or next_claim->>'id' = first_claim->>'id' then
    raise exception 'A new day must get a new request';
  end if;

  first_claim := public.claim_install_link('lease@example.com', 'ip-lease', 'r_aZ09bY18');
  update public.install_link_requests set updated_at = now() - interval '2 minutes'
    where id = (first_claim->>'id')::uuid;
  next_claim := public.claim_install_link('lease@example.com', 'ip-lease', 'r_12345678');
  if next_claim <> first_claim then raise exception 'Expired lease must retain idempotency'; end if;

  for i in 1..5 loop
    next_claim := public.claim_install_link('rate-' || i || '@example.com', 'ip-rate', 'r_aZ09bY18');
    if next_claim->>'outcome' <> 'send' then raise exception 'First five requests must pass'; end if;
  end loop;
  next_claim := public.claim_install_link('rate-6@example.com', 'ip-rate', 'r_aZ09bY18');
  if next_claim->>'outcome' <> 'rate_limited' then raise exception 'Sixth request must be blocked'; end if;
  update public.install_link_rate_limits set created_at = now() - interval '61 minutes' where ip_hash = 'ip-rate';
  next_claim := public.claim_install_link('rate-6@example.com', 'ip-rate', 'r_aZ09bY18');
  if next_claim->>'outcome' <> 'send' then raise exception 'Rolling hour must expire'; end if;
end;
$$;
reset role;

do $$
begin
  if has_table_privilege('anon', 'public.install_link_requests', 'INSERT')
    or has_table_privilege('authenticated', 'public.install_link_requests', 'SELECT')
    or has_table_privilege('anon', 'public.install_link_rate_limits', 'INSERT')
    or has_function_privilege('anon', 'public.claim_install_link(text,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.finish_install_link(uuid,text,text)', 'EXECUTE') then
    raise exception 'Only service_role may access requests and RPCs';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.install_link_requests'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.install_link_rate_limits'::regclass) then
    raise exception 'RLS must be enabled';
  end if;
end;
$$;
rollback;
