
-- Allow admins to update historial_consultas (to enter results)
CREATE POLICY "Admins can update historiales"
  ON public.historial_consultas FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');
