import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Cache-Control": "public, max-age=86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cis } = await req.json();
    if (!cis) {
      return new Response(JSON.stringify({ error: "Missing cis parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://base-donnees-publique.medicaments.gouv.fr/medicament/${cis}/extrait#tab-notice`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MedBot/1.0)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch notice: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      return new Response(
        JSON.stringify({ error: "Failed to parse HTML" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove unwanted elements
    const removeSelectors = ["script", "style", "nav", "header", "footer", "iframe", "noscript"];
    for (const sel of removeSelectors) {
      const els = doc.querySelectorAll(sel);
      for (const el of els) el.remove();
    }

    // Try to find notice content specifically
    let noticeText = "";
    const noticeSelectors = ["#notice", ".notice-content", '[data-tab="notice"]', "#tab-notice"];
    for (const sel of noticeSelectors) {
      const el = doc.querySelector(sel);
      if (el && el.textContent?.trim()) {
        noticeText = el.textContent.trim();
        break;
      }
    }

    // Fallback to body
    if (!noticeText) {
      noticeText = doc.body?.textContent?.trim() || "";
    }

    // Clean up whitespace
    noticeText = noticeText
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Truncate to 50k chars
    if (noticeText.length > 50000) {
      noticeText = noticeText.substring(0, 50000);
    }

    return new Response(JSON.stringify({ noticeText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-notice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
