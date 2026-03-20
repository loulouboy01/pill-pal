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
    const { image } = await req.json();
    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image base64 requise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Clé API Anthropic non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es un assistant spécialisé dans l'analyse d'ordonnances médicales françaises.
Analyse l'image de cette ordonnance et extrais tous les médicaments prescrits.

Pour chaque médicament, extrais :
- nom : le nom du médicament tel qu'il apparaît sur l'ordonnance
- dosage : le dosage (ex: "500mg", "1000mg", "20mg/ml")
- forme : la forme pharmaceutique si mentionnée (ex: "comprimé", "gélule", "sirop"). Si non mentionnée, laisse une chaîne vide.
- posologie : un objet avec matin, midi, soir, coucher (nombre de prises, 0 si non concerné)
- dureeTraitement : la durée du traitement si mentionnée (ex: "7 jours", "1 mois"). Si non mentionnée, mettre "Non précisé".

Réponds UNIQUEMENT avec un tableau JSON valide, sans backticks, sans texte avant ou après. Exemple de format :
[
  {
    "nom": "Doliprane",
    "dosage": "1000mg",
    "forme": "comprimé",
    "posologie": { "matin": 1, "midi": 0, "soir": 1, "coucher": 0 },
    "dureeTraitement": "5 jours"
  }
]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: image,
                },
              },
              {
                type: "text",
                text: "Analyse cette ordonnance et extrais les médicaments prescrits.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'analyse de l'ordonnance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";

    let medicaments;
    try {
      medicaments = JSON.parse(text);
    } catch {
      console.error("Failed to parse Claude response:", text);
      return new Response(
        JSON.stringify({ error: "Réponse illisible de l'IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ medicaments }),
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
