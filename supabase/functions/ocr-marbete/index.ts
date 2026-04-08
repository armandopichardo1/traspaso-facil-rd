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
    const { image_base64 } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            content:
              "Eres un experto en lectura de marbetes vehiculares de República Dominicana. El marbete es una calcomanía/sticker que se coloca en el parabrisas del vehículo y contiene información fiscal. Extrae toda la información visible. Si un campo no es legible, devuelve una cadena vacía. Para la vigencia, determina si la fecha de vencimiento es futura (vigente=true) o pasada (vigente=false) comparando con la fecha actual.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza esta imagen de un marbete vehicular dominicano y extrae: número de placa, fecha de vencimiento, año fiscal, tipo de vehículo, y si está vigente.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image_base64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extraer_marbete",
              description: "Extrae los datos estructurados de un marbete vehicular dominicano",
              parameters: {
                type: "object",
                properties: {
                  placa: { type: "string", description: "Número de placa del vehículo (ej: A123456)" },
                  fecha_vencimiento: { type: "string", description: "Fecha de vencimiento del marbete (formato DD/MM/YYYY)" },
                  ano_fiscal: { type: "string", description: "Año fiscal del marbete (ej: 2024, 2025)" },
                  tipo_vehiculo: { type: "string", description: "Tipo de vehículo indicado en el marbete (ej: AUTOMOVIL, JEEPETA, CAMIONETA, MOTOCICLETA)" },
                  vigente: { type: "boolean", description: "Si el marbete está vigente (fecha de vencimiento es futura)" },
                },
                required: ["placa", "fecha_vencimiento", "ano_fiscal", "tipo_vehiculo", "vigente"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extraer_marbete" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error al procesar la imagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No se pudo extraer información del marbete" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-marbete error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
