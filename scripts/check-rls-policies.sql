-- Check if RLS is enabled and what policies exist for visitor_consent_preferences
-- Run this in Supabase SQL Editor or via psql

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'visitor_consent_preferences';

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'visitor_consent_preferences'
ORDER BY policyname;

