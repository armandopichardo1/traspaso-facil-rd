
CREATE TABLE public.role_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  old_role TEXT NOT NULL,
  new_role TEXT NOT NULL,
  changed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.role_audit_log
FOR SELECT
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert audit log"
ON public.role_audit_log
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) = 'admin');
