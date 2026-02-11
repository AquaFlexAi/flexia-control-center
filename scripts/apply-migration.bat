@echo off
docker exec -i flexia-supabase-db psql -U postgres -d postgres < supabase/docker/migrations/20260210080000_hosting_providers.sql
