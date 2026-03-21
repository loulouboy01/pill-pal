import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ASSEMBLYAI_API_KEY = Deno.env.get("ASSEMBLYAI_API_KEY")!;
const BASE_URL = "https://api.assemblyai.com/v2";
const LLM_GATEWAY_URL = "https://llm-gateway.assemblyai.com/v1/understanding";

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

    // ─── UPLOAD : reçoit le blob audio en base64, l'envoie à AssemblyAI ───
    if (action === "upload") {
      const { audioData } = body;
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
        },
        body: bytes,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        return jsonResponse({ error: `Upload failed: ${err}` }, 500);
      }

      const { upload_url } = await uploadRes.json();
      return jsonResponse({ upload_url });
    }

    // ─── TRANSCRIBE : lance la transcription avec diarisation ───
    // Accepte optionnellement des speakers pour le Speaker Identification
    if (action === "transcribe") {
      const { audioUrl, language, speakersExpected, speakerNames, speakerRoles } = body;

      const transcribeBody: Record<string, unknown> = {
        audio_url: audioUrl,
        speaker_labels: true,
        language_code: language || "fr",
        speech_models: ["universal-3-pro", "universal-2"], // ← Corrigé : tableau
      };

      if (speakersExpected && speakersExpected > 0) {
        transcribeBody.speakers_expected = speakersExpected;
      }

      // ── Speaker Identification intégré à la transcription ──
      // Si on a des noms ou des rôles, on les passe directement
      if (speakerNames && speakerNames.length > 0) {
        transcribeBody.speech_understanding = {
          request: {
            speaker_identification: {
              speaker_type: "name",
              known_values: speakerNames, // ex: ["Jean Dupont", "Marie Martin"]
            },
          },
        };
      } else if (speakerRoles && speakerRoles.length > 0) {
        transcribeBody.speech_understanding = {
          request: {
            speaker_identification: {
              speaker_type: "role",
              known_values: speakerRoles, // ex: ["Avocat", "Client"]
            },
          },
        };
      }

      const transcribeRes = await fetch(`${BASE_URL}/transcript`, {
        method: "POST",
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transcribeBody),
      });

      if (!transcribeRes.ok) {
        const err = await transcribeRes.text();
        return jsonResponse({ error: `Transcription failed: ${err}` }, 500);
      }

      const transcript = await transcribeRes.json();
      return jsonResponse({ id: transcript.id, status: transcript.status });
    }

    // ─── POLL : vérifie le statut et récupère le résultat ───
    if (action === "poll") {
      const { transcriptId } = body;

      const pollRes = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
        headers: { authorization: ASSEMBLYAI_API_KEY },
      });

      const result = await pollRes.json();

      if (result.status === "completed") {
        return jsonResponse({
          status: "completed",
          text: result.text,
          utterances: result.utterances,
          words: result.words,
          audio_duration: result.audio_duration,
        });
      }

      if (result.status === "error") {
        return jsonResponse({ status: "error", error: result.error }, 500);
      }

      return jsonResponse({ status: result.status });
    }

    // ─── IDENTIFY : ajoute le Speaker Identification à un transcript existant ───
    // Utile si tu veux d'abord transcrire, puis identifier après coup
    if (action === "identify") {
      const { transcriptId, speakerNames, speakerRoles } = body;

      // Construire le body pour le LLM Gateway
      const identificationConfig: Record<string, unknown> = {};

      if (speakerNames && speakerNames.length > 0) {
        identificationConfig.speaker_type = "name";
        identificationConfig.known_values = speakerNames;
      } else if (speakerRoles && speakerRoles.length > 0) {
        identificationConfig.speaker_type = "role";
        identificationConfig.known_values = speakerRoles;
      } else {
        return jsonResponse({ error: "speakerNames ou speakerRoles requis" }, 400);
      }

      const identifyRes = await fetch(LLM_GATEWAY_URL, {
        method: "POST",
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript_id: transcriptId,
          speech_understanding: {
            request: {
              speaker_identification: identificationConfig,
            },
          },
        }),
      });

      if (!identifyRes.ok) {
        const err = await identifyRes.text();
        return jsonResponse({ error: `Identification failed: ${err}` }, 500);
      }

      const identifyResult = await identifyRes.json();

      return jsonResponse({
        status: "completed",
        utterances: identifyResult.utterances,
      });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
