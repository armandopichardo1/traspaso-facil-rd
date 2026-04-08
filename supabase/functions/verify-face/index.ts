import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selfie_url, cedula_url } = await req.json();
    if (!selfie_url || !cedula_url) {
      return new Response(
        JSON.stringify({ error: "selfie_url and cedula_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un verificador antifraude experto. Comparas una selfie con la foto de una cédula dominicana para determinar si es la MISMA persona. Analiza rasgos faciales: estructura ósea, forma de ojos, nariz, boca, orejas, línea de cabello. Considera que la iluminación, ángulo y calidad pueden variar. Sé estricto pero justo.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Compara estas dos imágenes. La primera es una selfie tomada por la persona. La segunda es la foto de su cédula de identidad dominicana. ¿Son la misma persona? Analiza los rasgos faciales y da tu veredicto.",
              },
              {
                type: "image_url",
                image_url: { url: selfie_url },
              },
              {
                type: "image_url",
                image_url: { url: cedula_url },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "face_verification_result",
              description: "Resultado de la comparación facial entre selfie y cédula",
              parameters: {
                type: "object",
                properties: {
                  match: {
                    type: "boolean",
                    description: "true si las imágenes muestran la misma persona, false si no",
                  },
                  confidence: {
                    type: "string",
                    enum: ["alta", "media", "baja"],
                    description: "Nivel de confianza en la comparación",
                  },
                  rasgos_coincidentes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de rasgos faciales que coinciden (ej: forma de ojos, nariz, estructura facial)",
                  },
                  rasgos_diferentes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de rasgos que no coinciden o generan duda",
                  },
                  notas: {
                    type: "string",
                    description: "Observaciones adicionales sobre la calidad de imagen, ángulo, etc.",
                  },
                },
                required: ["match", "confidence", "rasgos_coincidentes", "rasgos_diferentes", "notas"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "face_verification_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error al procesar las imágenes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No se pudo comparar las imágenes" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-face error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
