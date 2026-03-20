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
    const { transcription } = await req.json();
    if (!transcription) {
      return new Response(
        JSON.stringify({ error: "Transcription requise" }),
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

    const systemPrompt = `Tu es un assistant médical spécialisé dans la rédaction de comptes-rendus de consultations médicales.
À partir de la transcription d'une conversation entre un patient et un médecin, génère un compte-rendu structuré.

Extrais et structure les informations suivantes :
- medecin : le nom du médecin (si mentionné dans la conversation, sinon "Non identifié")
- motifConsultation : le motif principal de la consultation
- symptomes : un tableau listant tous les symptômes évoqués par le patient
- diagnostic : le diagnostic posé par le médecin (si mentionné, sinon "Non précisé")
- traitements : un tableau d'objets, chacun avec nom (nom du médicament/traitement), posologie (ex: "1 comprimé matin et soir"), duree (ex: "7 jours")
- examensPrescrits : un tableau listant les examens complémentaires prescrits (prise de sang, radio, etc.). Tableau vide si aucun.
- prochainRdv : la date ou le délai du prochain rendez-vous (si mentionné, sinon "Non précisé")
- resume : un paragraphe de 3-5 phrases résumant la consultation de manière claire et professionnelle
- notesComplementaires : toute autre information pertinente mentionnée durant la consultation (conseils hygiéno-diététiques, arrêt de travail, etc.). Chaîne vide si rien de notable.

Réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans texte avant ou après.`;

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
            content: `Voici la transcription de la consultation :\n\n${transcription}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du compte-rendu" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";

    let compteRendu;
    try {
      compteRendu = JSON.parse(text);
    } catch {
      console.error("Failed to parse Claude response:", text);
      return new Response(
        JSON.stringify({ error: "Réponse illisible de l'IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ compteRendu }),
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
