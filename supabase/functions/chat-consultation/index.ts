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
    const { messages, transcription, compteRendu } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Tu es un assistant médical qui aide les patients à comprendre leur consultation médicale. Tu as accès à la transcription complète de la consultation et, si disponible, au compte-rendu structuré.

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT sur la base de la transcription et du compte-rendu fournis. Ne donne jamais d'information qui ne provient pas de ces documents.
- Utilise un langage simple et accessible, évite le jargon médical quand c'est possible, ou explique-le.
- Si l'utilisateur pose une question dont la réponse n'est pas dans la transcription, dis-le clairement et recommande de consulter son médecin.
- Rappelle systématiquement que tu ne remplaces pas un avis médical professionnel.
- Sois concis mais complet dans tes réponses.
- Réponds en français.
- Ne fais JAMAIS de diagnostic ni de recommandation de traitement.
- Si l'utilisateur décrit des symptômes inquiétants, encourage-le à contacter un professionnel de santé ou le 15 (SAMU) en cas d'urgence.

TRANSCRIPTION DE LA CONSULTATION :
---
${transcription}
---
${compteRendu ? `\nCOMPTE-RENDU STRUCTURÉ :\n---\n${JSON.stringify(compteRendu, null, 2)}\n---` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-consultation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
