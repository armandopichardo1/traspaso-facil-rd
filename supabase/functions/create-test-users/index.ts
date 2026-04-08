import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const users = [
    { email: "cliente@test.com", role: "customer", nombre: "Cliente Test" },
    { email: "gestor@test.com", role: "gestor", nombre: "Gestor Test" },
    { email: "admin@traspasa.do", role: "admin", nombre: "Admin Test" },
    { email: "testnotario@traspasa.do", role: "notario", nombre: "Notario Test" },
    { email: "mensajero@test.com", role: "mensajero", nombre: "Mensajero Test" },
  ];

  const results = [];
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const existingUsers = listData?.users || [];

  for (const u of users) {
    const existing = existingUsers.find((x: any) => x.email === u.email);
    if (existing) {
      const res = await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "apikey": key },
        body: JSON.stringify({ password: "Test1234!" }),
      });
      await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", existing.id);
      results.push({ email: u.email, status: "updated", httpStatus: res.status });
    } else {
      const { data, error } = await supabase.auth.admin.createUser({ email: u.email, password: "Test1234!", email_confirm: true });
      if (error) {
        results.push({ email: u.email, status: "create_error", msg: error.message });
      } else {
        await new Promise(r => setTimeout(r, 500));
        await supabase.from("profiles").update({ role: u.role, nombre: u.nombre }).eq("id", data.user.id);
        results.push({ email: u.email, status: "created", id: data.user.id });
      }
    }
  }

  return new Response(JSON.stringify(results, null, 2), { headers: { "Content-Type": "application/json" } });
});
