
-- Gestores can see traspasos assigned to them
CREATE POLICY "Gestores see own traspasos"
  ON public.traspasos FOR SELECT
  USING (gestor_id = auth.uid() AND get_user_role(auth.uid()) = 'gestor');

-- Gestores can create traspasos for customers
CREATE POLICY "Gestores can create traspasos"
  ON public.traspasos FOR INSERT
  WITH CHECK (gestor_id = auth.uid() AND get_user_role(auth.uid()) = 'gestor');

-- Gestores can update their assigned traspasos
CREATE POLICY "Gestores can update own traspasos"
  ON public.traspasos FOR UPDATE
  USING (gestor_id = auth.uid() AND get_user_role(auth.uid()) = 'gestor');

-- Gestores can see timeline for their traspasos
CREATE POLICY "Gestores see own timeline"
  ON public.traspaso_timeline FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_timeline.traspaso_id AND t.gestor_id = auth.uid()
  ) AND get_user_role(auth.uid()) = 'gestor');

-- Gestores can add timeline entries
CREATE POLICY "Gestores can add timeline entries"
  ON public.traspaso_timeline FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'gestor');

-- Gestores can see docs for their traspasos
CREATE POLICY "Gestores see own docs"
  ON public.traspaso_documentos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_documentos.traspaso_id AND t.gestor_id = auth.uid()
  ) AND get_user_role(auth.uid()) = 'gestor');

-- Gestores can upload docs
CREATE POLICY "Gestores can upload docs"
  ON public.traspaso_documentos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM traspasos t
    WHERE t.id = traspaso_documentos.traspaso_id AND t.gestor_id = auth.uid()
  ) AND get_user_role(auth.uid()) = 'gestor');

-- Gestores can view profiles (to see customer info)
CREATE POLICY "Gestores can view profiles"
  ON public.profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'gestor');
