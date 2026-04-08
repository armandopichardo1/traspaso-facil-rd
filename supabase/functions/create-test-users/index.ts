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
  
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const existingUsers = listData?.users || [];

  for (const u of users) {
    const existing = existingUsers.find((x: any) => x.email === u.email);
    
    if (existing) {
      // Delete profile first (to avoid FK issues), then delete auth user
      await supabase.from("profiles").delete().eq("id", existing.id);
      const { error: delErr } = await supabase.auth.admin.deleteUser(existing.id);
      if (delErr) {
        results.push({ email: u.email, status: "delete_error", msg: delErr.message });
        continue;
      }
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "Test1234!",
      email_confirm: true,
    });
    
    if (error) {
      results.push({ email: u.email, status: "create_error", msg: error.message });
    } else if (data?.user) {
      // Wait briefly for trigger
      await new Promise(r => setTimeout(r, 500));
      const { error: upErr } = await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", data.user.id);
      results.push({ email: u.email, status: "created", id: data.user.id, updateErr: upErr?.message });
    }
  }

  return new Response(JSON.stringify(results, null, 2), { headers: { "Content-Type": "application/json" } });
});
