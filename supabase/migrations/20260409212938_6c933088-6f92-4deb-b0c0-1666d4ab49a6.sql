
-- Create messages table
CREATE TABLE public.traspaso_mensajes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  traspaso_id UUID NOT NULL REFERENCES public.traspasos(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.traspaso_mensajes ENABLE ROW LEVEL SECURITY;

-- Customers can read messages on their own traspasos
CREATE POLICY "Customers see own traspaso messages"
ON public.traspaso_mensajes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM traspasos t WHERE t.id = traspaso_mensajes.traspaso_id AND t.customer_id = auth.uid()
));

-- Customers can send messages on their own traspasos
CREATE POLICY "Customers can send messages"
ON public.traspaso_mensajes FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM traspasos t WHERE t.id = traspaso_mensajes.traspaso_id AND t.customer_id = auth.uid()
  )
);

-- Gestores can read messages on their assigned traspasos
CREATE POLICY "Gestores see own traspaso messages"
ON public.traspaso_mensajes FOR SELECT
USING (
  get_user_role(auth.uid()) = 'gestor'
  AND EXISTS (
    SELECT 1 FROM traspasos t WHERE t.id = traspaso_mensajes.traspaso_id AND t.gestor_id = auth.uid()
  )
);

-- Gestores can send messages on their assigned traspasos
CREATE POLICY "Gestores can send messages"
ON public.traspaso_mensajes FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND get_user_role(auth.uid()) = 'gestor'
  AND EXISTS (
    SELECT 1 FROM traspasos t WHERE t.id = traspaso_mensajes.traspaso_id AND t.gestor_id = auth.uid()
  )
);

-- Admins see all
CREATE POLICY "Admins see all messages"
ON public.traspaso_mensajes FOR SELECT
USING (get_user_role(auth.uid()) = 'admin');

-- Admins can send
CREATE POLICY "Admins can send messages"
ON public.traspaso_mensajes FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'admin' AND auth.uid() = sender_id);

-- Mark as read (gestores on their traspasos)
CREATE POLICY "Gestores can mark messages read"
ON public.traspaso_mensajes FOR UPDATE
USING (
  get_user_role(auth.uid()) = 'gestor'
  AND EXISTS (
    SELECT 1 FROM traspasos t WHERE t.id = traspaso_mensajes.traspaso_id AND t.gestor_id = auth.uid()
  )
);

-- Mark as read (customers on their traspasos)
CREATE POLICY "Customers can mark messages read"
ON public.traspaso_mensajes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM traspasos t WHERE t.id = traspaso_mensajes.traspaso_id AND t.customer_id = auth.uid()
  )
);

-- Index for fast lookups
CREATE INDEX idx_traspaso_mensajes_traspaso ON public.traspaso_mensajes(traspaso_id, created_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.traspaso_mensajes;
