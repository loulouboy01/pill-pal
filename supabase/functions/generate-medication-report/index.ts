import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicament, prises } = await req.json();
    if (!medicament || !prises) {
      return new Response(
        JSON.stringify({ error: "Données requises" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Clé API non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es un assistant médical spécialisé dans la génération de rapports d'observance médicamenteuse.
Génère un rapport clair, structuré et professionnel en français, destiné à être partagé avec un médecin.

Le rapport doit contenir :
1. Résumé global : taux d'observance (prises confirmées vs total), tendance générale des ressentis
2. Tendances détectées : effets indésirables récurrents, amélioration progressive ou détérioration, patterns remarquables
3. Détail par prise : pour chaque prise, date, statut, et ressentis associés

IMPORTANT : N'utilise JAMAIS de mise en forme markdown. Pas de gras (**texte**), pas d'italique (*texte*), pas d'astérisques, pas de titres (#), pas de listes à puces avec des tirets. Écris uniquement du texte brut simple et lisible, avec des retours à la ligne pour structurer.
Sois précis et factuel. Ne fais pas de diagnostic.`;

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
          {
            role: "user",
            content: `Médicament : ${medicament}\n\nDonnées des prises :\n${JSON.stringify(prises, null, 2)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", status, await response.text());
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du rapport" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "Rapport non disponible.";

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});