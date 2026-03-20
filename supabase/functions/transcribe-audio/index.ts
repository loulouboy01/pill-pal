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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Clé API OpenAI non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: "Fichier audio requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Re-create the file with explicit type to ensure Whisper recognizes the format
    const audioBytes = await audioFile.arrayBuffer();
    const properFile = new File([audioBytes], "audio.webm", { type: "audio/webm" });

    const whisperForm = new FormData();
    whisperForm.append("file", properFile);
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "fr");
    whisperForm.append("response_format", "text");
    whisperForm.append(
      "prompt",
      "Transcription d'une consultation médicale en français. Termes médicaux courants : ordonnance, posologie, comprimé, gélule, milligrammes, tension, glycémie, cholestérol."
    );

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Whisper error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la transcription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = await response.text();

    return new Response(
      JSON.stringify({ text: text.trim() }),
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
