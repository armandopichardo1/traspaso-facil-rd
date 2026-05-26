// Genera un resumen corto en español dominicano del estado de un traspaso
// usando Lovable AI (sin requerir API key del usuario).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface TimelineEntry {
  status: string;
  nota?: string | null;
  createdAt: string;
}

interface RequestBody {
  status: string;
  codigo?: string;
  vehiculo?: string;
  timeline?: TimelineEntry[];
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body: RequestBody = await req.json();
    if (!body?.status) {
      return new Response(JSON.stringify({ error: "status requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timelineText = (body.timeline ?? [])
      .slice(-6)
      .map((e) => `- ${e.createdAt}: ${e.status}${e.nota ? ` (${e.nota})` : ""}`)
      .join("\n");

    const prompt = `Eres asesor de traspasos vehiculares en RD. Escribe UNA sola frase corta (máx 18 palabras) en español dominicano, tono cercano y claro, resumiendo dónde va el expediente y qué falta. No saludes, no uses emojis.

Vehículo: ${body.vehiculo ?? "N/D"}
Código: ${body.codigo ?? "N/D"}
Estado actual: ${body.status}
Últimos eventos:
${timelineText || "(sin eventos previos)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: "AI error", detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    const summary: string = data?.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
