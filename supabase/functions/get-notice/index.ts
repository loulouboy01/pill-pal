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
    const { cis } = await req.json();
    if (!cis) {
      return new Response(
        JSON.stringify({ error: "Code CIS requis" }),
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

    // Fetch the RCP page from the official French medication database
    const pageUrl = `https://base-donnees-publique.medicaments.gouv.fr/medicament/${cis}/extrait#tab-rcp`;
    console.log("Fetching notice from:", pageUrl);

    const pageResponse = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MedApp/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    });

    if (!pageResponse.ok) {
      console.error("Failed to fetch page:", pageResponse.status);
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer la notice du médicament" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await pageResponse.text();

    // Truncate HTML to avoid token limits — keep meaningful content
    const truncatedHtml = html.length > 80000 ? html.substring(0, 80000) : html;

    const systemPrompt = `Tu es un assistant médical spécialisé dans l'extraction d'informations depuis les notices de médicaments (RCP) françaises.

À partir du HTML de la page de la base de données publique des médicaments, extrais les informations suivantes de manière structurée et concise :

Réponds UNIQUEMENT avec un objet JSON valide (sans backticks, sans texte avant ou après) avec ces clés :
{
  "contreIndications": "texte des contre-indications principales",
  "posologie": "posologie recommandée",
  "delaiMinimumEntrePrises": "délai minimum entre 2 prises",
  "modeAdministration": "mode et voie d'administration",
  "effetsIndesirables": "principaux effets indésirables",
  "dureeMaxTraitement": "durée maximale de traitement recommandée",
  "momentPrise": "moment de la journée recommandé pour la prise"
}

Si une information n'est pas disponible dans la page, mets "Non renseigné" comme valeur.
Sois concis mais précis. Utilise des phrases courtes et claires.`;

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
            content: `Voici le HTML de la page RCP du médicament (code CIS: ${cis}). Extrais les informations demandées :\n\n${truncatedHtml}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'analyse de la notice" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";

    let notice;
    try {
      notice = JSON.parse(text);
    } catch {
      console.error("Failed to parse Claude response:", text);
      return new Response(
        JSON.stringify({ error: "Réponse illisible de l'IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ notice }),
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
