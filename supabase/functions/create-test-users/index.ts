import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const users = [
    { email: "cliente@test.com", role: "customer", nombre: "Cliente Test" },
    { email: "gestor@test.com", role: "gestor", nombre: "Gestor Test" },
    { email: "admin@traspasa.do", role: "admin", nombre: "Admin Test" },
    { email: "testnotario@traspasa.do", role: "notario", nombre: "Notario Test" },
  ];

  const results = [];
  
  // First list all users to find existing ones
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existingUsers = listData?.users || [];

  for (const u of users) {
    const existing = existingUsers.find((x: any) => x.email === u.email);
    
    if (existing) {
      // Delete existing user first
      await supabase.auth.admin.deleteUser(existing.id);
    }
    
    // Create fresh user
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "Test1234!",
      email_confirm: true,
    });
    
    if (error) {
      results.push({ email: u.email, status: "error", msg: error.message });
    } else if (data?.user) {
      // Profile is auto-created by trigger, just update role and nombre
      await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", data.user.id);
      results.push({ email: u.email, status: "created", id: data.user.id });
    }
  }

  return new Response(JSON.stringify(results, null, 2), { headers: { "Content-Type": "application/json" } });
});
