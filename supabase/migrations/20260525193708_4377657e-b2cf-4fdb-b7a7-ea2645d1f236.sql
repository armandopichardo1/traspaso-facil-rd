-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
-- get_user_role remains callable by authenticated users (needed for role checks in app)
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;