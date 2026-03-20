import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_API_URL = "https://bdpmgf.vedielaute.fr";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let q = "";

    // Support both GET with query params and POST with body
    if (req.method === "GET") {
      const url = new URL(req.url);
      q = url.searchParams.get("q") || "";
    } else {
      const body = await req.json();
      q = body.q || "";
    }

    if (!q || q.length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = Deno.env.get("MEDICAMENTS_API_URL") || DEFAULT_API_URL;
    const searchUrl = `${apiUrl}/api/medicaments/search?q=${encodeURIComponent(q)}`;

    const response = await fetch(searchUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("BDPM API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Map results to keep only useful fields
    const results = (Array.isArray(data) ? data : data.results || []).map((item: any) => ({
      cis: item.codeCIS || item.cis || item.code_cis || "",
      denomination: item.denomination || item.nom || "",
      forme: item.formePharmaceutique || item.forme || "",
      voie: item.voieAdministration || item.voie || "",
      statut_amm: item.statutAMM || item.statut_amm || "",
    })).slice(0, 10);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ results: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
