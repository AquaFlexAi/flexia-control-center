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

\echo 'Loading 98-seed-data.sql...'
\i /docker-entrypoint-initdb.d/init/98-seed-data.sql

\echo 'Loading 99-seed-users.sql...'
\i /docker-entrypoint-initdb.d/init/99-seed-users.sql