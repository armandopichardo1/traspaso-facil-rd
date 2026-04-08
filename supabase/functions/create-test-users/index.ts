import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "cliente@test.com", role: "customer", nombre: "Cliente Test" },
    { email: "gestor@test.com", role: "gestor", nombre: "Gestor Test" },
    { email: "admin@traspasa.do", role: "admin", nombre: "Admin Test" },
    { email: "testnotario@traspasa.do", role: "notario", nombre: "Notario Test" },
  ];

  const results = [];
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "Test1234!",
      email_confirm: true,
    });
    if (error && error.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((x: any) => x.email === u.email);
      if (existing) {
        await supabase.auth.admin.updateUser(existing.id, { password: "Test1234!" });
        await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", existing.id);
        results.push({ email: u.email, status: "updated" });
      }
    } else if (data?.user) {
      await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", data.user.id);
      results.push({ email: u.email, status: "created" });
    } else {
      results.push({ email: u.email, status: "error", error: error?.message });
    }
  }

  return new Response(JSON.stringify(results, null, 2), { headers: { "Content-Type": "application/json" } });
});
