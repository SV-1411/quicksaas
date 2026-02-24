-- Open access script for Gigzs
-- Run this in Supabase SQL Editor to remove all restrictions

-- 1. Disable RLS on all tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 2. Drop all existing policies to be clean
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. Grant full permissions to all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Ensure types are usable
GRANT USAGE ON TYPE public.user_role TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.project_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.module_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.session_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.assignment_role TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.shift_status TO anon, authenticated, service_role;
GRANT USAGE ON TYPE public.snapshot_type TO anon, authenticated, service_role;
