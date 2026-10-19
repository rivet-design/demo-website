begin;

create table public.install_link_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and length(email) <= 254),
  install_ref text not null check (install_ref ~ '^r_[0-9A-Za-z]{8}$'),
  placement text not null default 'hero' check (placement = 'hero'),
  resend_message_id text,
  status text not null check (status in ('pending', 'sent', 'failed', 'suppressed_duplicate')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index install_link_requests_email_created_at on public.install_link_requests (email, created_at desc);
alter table public.install_link_requests enable row level security;
revoke all on public.install_link_requests from public, anon, authenticated;
grant all on public.install_link_requests to service_role;

create table public.install_link_rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index install_link_rate_limits_ip_created_at on public.install_link_rate_limits (ip_hash, created_at);
create index install_link_rate_limits_created_at on public.install_link_rate_limits (created_at);
alter table public.install_link_rate_limits enable row level security;
revoke all on public.install_link_rate_limits from public, anon, authenticated;
grant all on public.install_link_rate_limits to service_role;

-- Locks serialize concurrent claims across Worker instances, IPs, and addresses.
create function public.claim_install_link(p_email text, p_ip_hash text, p_install_ref text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous public.install_link_requests;
  request_id uuid;
begin
  if p_email <> lower(p_email) or length(p_email) > 254 or p_install_ref !~ '^r_[0-9A-Za-z]{8}$' then
    raise exception 'Invalid install request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('install-ip:' || p_ip_hash, 0));
  delete from public.install_link_rate_limits where created_at <= now() - interval '1 hour';
  if (select count(*) from public.install_link_rate_limits where ip_hash = p_ip_hash) >= 5 then
    return jsonb_build_object('outcome', 'rate_limited');
  end if;
  insert into public.install_link_rate_limits (ip_hash) values (p_ip_hash);

  perform pg_advisory_xact_lock(hashtextextended('install-email:' || p_email, 0));
  select * into previous from public.install_link_requests
    where email = p_email
      and (case when status = 'sent' then updated_at else created_at end) > now() - interval '24 hours'
      and status <> 'suppressed_duplicate'
    order by created_at desc limit 1;
  if found then
    if previous.status = 'sent' then
      insert into public.install_link_requests (email, install_ref, status)
        values (p_email, previous.install_ref, 'suppressed_duplicate');
      return jsonb_build_object('outcome', 'duplicate');
    end if;
    -- An active send is not yet a success. Let the visitor retry in a minute.
    if previous.status = 'pending' and previous.updated_at > now() - interval '1 minute' then
      return jsonb_build_object('outcome', 'in_flight');
    end if;
    -- Retain the id and ref so Resend deduplicates a retry after an uncertain send.
    update public.install_link_requests set status = 'pending', updated_at = now()
      where id = previous.id;
    return jsonb_build_object('outcome', 'send', 'id', previous.id, 'install_ref', previous.install_ref);
  end if;

  insert into public.install_link_requests (email, install_ref, status)
    values (p_email, p_install_ref, 'pending') returning id into request_id;
  return jsonb_build_object('outcome', 'send', 'id', request_id, 'install_ref', p_install_ref);
end;
$$;

create function public.finish_install_link(p_id uuid, p_status text, p_message_id text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_status not in ('sent', 'failed') then raise exception 'Invalid send status'; end if;
  update public.install_link_requests
    set status = p_status, resend_message_id = p_message_id, updated_at = now()
    where id = p_id and status = 'pending';
  if not found then raise exception 'No pending request'; end if;
end;
$$;

revoke all on function public.claim_install_link(text, text, text) from public, anon, authenticated;
revoke all on function public.finish_install_link(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_install_link(text, text, text) to service_role;
grant execute on function public.finish_install_link(uuid, text, text) to service_role;

commit;
