-- Load all initialization scripts in order
-- This file is mounted as z99-loader.sql to ensure it runs after Supabase migrations


\echo 'Loading 00-setup.sql...'
\i /docker-entrypoint-initdb.d/init/00-setup.sql

\echo 'Loading 01-auth-helpers.sql...'
\i /docker-entrypoint-initdb.d/init/01-auth-helpers.sql

\echo 'Loading 02-branding.sql...'
\i /docker-entrypoint-initdb.d/init/02-branding.sql

\echo 'Loading 03-services.sql...'
\i /docker-entrypoint-initdb.d/init/03-services.sql

\echo 'Loading 04-organization.sql...'
\i /docker-entrypoint-initdb.d/init/04-organization.sql

\echo 'Loading 05-system.sql...'
\i /docker-entrypoint-initdb.d/init/05-system.sql

\echo 'Loading 06-rbac.sql...'
\i /docker-entrypoint-initdb.d/init/06-rbac.sql

\echo 'Loading 07-instances.sql...'
\i /docker-entrypoint-initdb.d/init/07-instances.sql

\echo 'Loading 98-seed-data.sql...'
\i /docker-entrypoint-initdb.d/init/98-seed-data.sql

\echo 'Loading 99-seed-users.sql...'
\i /docker-entrypoint-initdb.d/init/99-seed-users.sql

-- Load Migrations (dynamically if possible, or manual list)
-- Since psql doesn't support wildcards easily in \i, we might need a shell script wrapper.
-- BUT, since we are using loader.sql as an orchestrated list, let's add the known migrations.
-- Ideally, we'd use a real migration tool, but for now:

\echo 'Loading Migrations...'
\i /docker-entrypoint-initdb.d/migrations/20260210003000_decentralized_router_init.sql
\i /docker-entrypoint-initdb.d/migrations/20260210043000_resource_based_mining.sql
\i /docker-entrypoint-initdb.d/migrations/20260210044000_saas_billing.sql
\i /docker-entrypoint-initdb.d/migrations/20260210050000_crypto_staking_billing.sql
\i /docker-entrypoint-initdb.d/migrations/20260210060000_clickup_connections.sql
\i /docker-entrypoint-initdb.d/migrations/20260210070000_clickup_system_instances.sql
\i /docker-entrypoint-initdb.d/migrations/20260210080000_hosting_providers.sql
\i /docker-entrypoint-initdb.d/migrations/20260210090000_fix_hosting_api_url.sql
\i /docker-entrypoint-initdb.d/migrations/20260211013700_add_service_archival.sql
\i /docker-entrypoint-initdb.d/migrations/20260213000001_fix_deployed_instances_schema.sql
\i /docker-entrypoint-initdb.d/migrations/20260216090000_enterprise_plane_multitenancy.sql
\i /docker-entrypoint-initdb.d/migrations/20260213_sovereign_vouchers.sql
