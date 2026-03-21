import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ─── TRANSCRIBE : reçoit le blob audio en base64, envoie à Whisper ───
    if (action === "transcribe") {
      const { audioData, language } = body;

      // Décoder le base64 en bytes
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Créer le FormData pour l'API Whisper
      const formData = new FormData();
      const audioBlob = new Blob([bytes], { type: "audio/webm" });
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", language || "fr");
      formData.append("response_format", "verbose_json");
      formData.append("timestamp_granularities[]", "segment");

      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!whisperRes.ok) {
        const err = await whisperRes.text();
        return jsonResponse({ error: `Transcription failed: ${err}` }, 500);
      }

      const result = await whisperRes.json();

      // Mapper les segments Whisper vers le format utterances attendu par le front
      const utterances = (result.segments || []).map((seg: any, idx: number) => ({
        speaker: `Speaker A`, // Whisper ne fait pas de diarisation
        text: seg.text.trim(),
        start: Math.round(seg.start * 1000),
        end: Math.round(seg.end * 1000),
        confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.9,
        words: [],
      }));

      return jsonResponse({
        status: "completed",
        text: result.text,
        utterances,
        audio_duration: result.duration || 0,
      });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
