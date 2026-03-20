import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_URL = "https://medicaments-api.giygas.dev";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let q = "";

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

    const searchUrl = `${API_URL}/v1/medicaments?search=${encodeURIComponent(q)}`;

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

    const results = (Array.isArray(data) ? data : []).map((item: any) => ({
      cis: String(item.cis || ""),
      denomination: item.elementPharmaceutique || "",
      forme: item.formePharmaceutique || "",
      voie: Array.isArray(item.voiesAdministration) ? item.voiesAdministration.join(", ") : "",
      statut_amm: item.statusAutorisation || "",
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
