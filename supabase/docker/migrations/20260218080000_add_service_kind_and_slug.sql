begin;

alter table public.services
  add column if not exists service_kind text,
  add column if not exists slug text;

update public.services
set service_kind = case
  when lower(name) like '%router%' then 'ai_router'
  when lower(name) like '%agent zero%' then 'agent_zero'
  when lower(name) like '%opencode%' then 'opencode'
  when lower(name) like '%blockchain%' then 'blockchain'
  else 'custom'
end
where service_kind is null;

update public.services
set slug = case service_kind
  when 'ai_router' then 'flexia-ai-router'
  when 'agent_zero' then 'flexia-agent-zero'
  when 'opencode' then 'flexia-opencode'
  when 'blockchain' then 'flexia-blockchain'
  else regexp_replace(lower(name), '\s+', '-', 'g')
end
where slug is null;

create index if not exists idx_services_service_kind on public.services(service_kind);
create index if not exists idx_services_slug on public.services(slug);

commit;
