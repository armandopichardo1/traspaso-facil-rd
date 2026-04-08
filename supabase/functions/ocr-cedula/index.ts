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
              "Eres un experto en lectura de cédulas de identidad de República Dominicana. Analiza la imagen de la cédula (frente o reverso) y extrae toda la información visible. Si un campo no es legible o no aplica para el lado mostrado, devuelve una cadena vacía. El número de cédula tiene formato XXX-XXXXXXX-X (3 dígitos, guión, 7 dígitos, guión, 1 dígito).",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza esta imagen de cédula dominicana y extrae los datos del titular. Determina si es el frente o reverso de la cédula.",
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
              name: "extraer_cedula",
              description: "Extrae los datos estructurados de una cédula de identidad dominicana",
              parameters: {
                type: "object",
                properties: {
                  nombre_completo: { type: "string", description: "Nombre completo del titular tal como aparece en la cédula" },
                  cedula: { type: "string", description: "Número de cédula en formato XXX-XXXXXXX-X" },
                  fecha_nacimiento: { type: "string", description: "Fecha de nacimiento (formato DD/MM/AAAA si visible)" },
                  nacionalidad: { type: "string", description: "Nacionalidad del titular" },
                  sexo: { type: "string", enum: ["M", "F", ""], description: "Sexo del titular (M o F)" },
                  lado: { type: "string", enum: ["frente", "reverso"], description: "Lado de la cédula mostrado en la imagen" },
                },
                required: ["nombre_completo", "cedula", "fecha_nacimiento", "nacionalidad", "sexo", "lado"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extraer_cedula" } },
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
      return new Response(JSON.stringify({ error: "No se pudo extraer información de la cédula" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-cedula error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
