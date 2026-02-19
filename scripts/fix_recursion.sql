-- Reset Policies on organization_members

-- 1. Drop ALL policies dynamically to ensure clean slate
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_members') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.organization_members'; 
    END LOOP; 
END $$;

-- 2. Create Simple Policy (No Recursion possible)
CREATE POLICY "Simple View Own" ON public.organization_members FOR
SELECT TO authenticated USING (user_id = auth.uid ());

-- 3. Verify
SELECT policyname, cmd, qual
FROM pg_policies
WHERE
    tablename = 'organization_members';