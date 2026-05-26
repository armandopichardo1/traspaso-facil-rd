import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface PrecheckResult {
  valid: boolean;
  formatted: string;
  province: string;
  vehicleType: string;
  message: string;
}

function normalize(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatPlaca(clean: string): string {
  // DR plate common pattern: 1 letter + 6 digits (e.g. A123456) or 3 letters + 4 digits
  const m1 = clean.match(/^([A-Z])(\d{6})$/);
  if (m1) return `${m1[1]}${m1[2]}`;
  const m2 = clean.match(/^([A-Z]{3})(\d{3,4})$/);
  if (m2) return `${m2[1]}-${m2[2]}`;
  return clean;
}

function validateFormat(clean: string): boolean {
  return /^[A-Z]\d{6}$/.test(clean) || /^[A-Z]{3}\d{3,4}$/.test(clean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { placa } = await req.json();
    if (typeof placa !== "string" || placa.trim().length === 0) {
      return new Response(
        JSON.stringify({ valid: false, message: "Placa requerida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const clean = normalize(placa);
    const formatted = formatPlaca(clean);
    const validFormat = validateFormat(clean);

    if (!validFormat) {
      const result: PrecheckResult = {
        valid: false,
        formatted,
        province: "",
        vehicleType: "",
        message: "Formato de placa no reconocido (ej: A123456 o ABC-1234).",
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask Lovable AI for vehicle type + likely province (Dominican Republic plates).
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let province = "República Dominicana";
    let vehicleType = "Vehículo";

    if (apiKey) {
      const prompt = `Para la placa dominicana "${formatted}", responde SOLO un JSON con dos campos:
{"vehicleType": "<tipo de vehículo según la letra inicial: A=Automóvil privado, L=Autobús/Transporte público, G=Motocicleta, I=Carga pesada, K=Carga liviana, X=Especial, P=Alquiler, EX/EI/EP=Exoneración>", "province": "<provincia probable de matriculación; si no hay forma de saber, usa 'Distrito Nacional'>"}
No agregues texto adicional, solo el JSON.`;

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Eres un experto en placas vehiculares de República Dominicana. Responde solo con JSON válido." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (aiResp.ok) {
          const data = await aiResp.json();
          const content = data?.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content);
          if (parsed.vehicleType) vehicleType = String(parsed.vehicleType);
          if (parsed.province) province = String(parsed.province);
        }
      } catch (_e) {
        // fall through with defaults
      }
    }

    const result: PrecheckResult = {
      valid: true,
      formatted,
      province,
      vehicleType,
      message: `✓ Placa ${formatted} · ${province}`,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, message: "Error procesando la placa" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
