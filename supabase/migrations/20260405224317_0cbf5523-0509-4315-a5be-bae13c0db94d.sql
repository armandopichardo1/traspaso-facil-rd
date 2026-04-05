
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can read traspasos by code" ON public.traspasos;

-- Recreate it restricted to anon role only
CREATE POLICY "Anon can read traspasos by code"
ON public.traspasos
FOR SELECT
TO anon
USING (codigo IS NOT NULL);
