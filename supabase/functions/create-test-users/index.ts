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
  for (const u of users) {
    // Try to create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "Test1234!",
      email_confirm: true,
    });
    
    if (error) {
      if (error.message.includes("already been registered")) {
        // Find existing user and update password + role
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((x: any) => x.email === u.email);
        if (existing) {
          await supabase.auth.admin.updateUser(existing.id, { password: "Test1234!" });
          await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", existing.id);
          results.push({ email: u.email, status: "updated", id: existing.id });
        } else {
          results.push({ email: u.email, status: "not_found" });
        }
      } else {
        results.push({ email: u.email, status: "error", msg: error.message });
      }
    } else if (data?.user) {
      await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", data.user.id);
      results.push({ email: u.email, status: "created", id: data.user.id });
    }
  }

  return new Response(JSON.stringify(results, null, 2), { headers: { "Content-Type": "application/json" } });
});
