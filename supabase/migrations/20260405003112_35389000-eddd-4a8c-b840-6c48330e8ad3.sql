CREATE POLICY "Authenticated users can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);