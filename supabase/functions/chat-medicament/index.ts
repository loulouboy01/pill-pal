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
    const { messages, noticeText, nomMedicament, cis } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Tu es un assistant spécialisé qui aide les patients à comprendre leur médicament. Tu as accès à la notice complète du médicament "${nomMedicament}" (CIS: ${cis}).

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT sur la base de la notice fournie ci-dessous. Ne donne jamais d'information médicale qui ne provient pas de cette notice.
- Utilise un langage simple et accessible, évite le jargon médical quand c'est possible, ou explique-le.
- Si l'utilisateur pose une question dont la réponse n'est pas dans la notice, dis-le clairement et recommande de consulter un médecin ou pharmacien.
- Rappelle systématiquement que tu ne remplaces pas un avis médical professionnel.
- Sois concis mais complet dans tes réponses.
- Réponds en français.
- Ne fais JAMAIS de diagnostic ni de recommandation de traitement.
- Si l'utilisateur décrit des symptômes inquiétants, encourage-le à contacter un professionnel de santé ou le 15 (SAMU) en cas d'urgence.

NOTICE COMPLÈTE DU MÉDICAMENT :
---
${noticeText}
---`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-medicament error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
