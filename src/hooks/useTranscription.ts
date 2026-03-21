import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  words: Array<{
    text: string;
    start: number;
    end: number;
    speaker: string;
    confidence: number;
  }>;
}

export interface TranscriptionResult {
  text: string;
  utterances: Utterance[];
  audioDuration: number;
}

export type TranscriptionStatus =
  | "idle"
  | "recording"
  | "uploading"
  | "transcribing"
  | "completed"
  | "error";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useTranscription(options?: {
  language?: string;
  speakersExpected?: number;
}) {
  const { language = "fr" } = options || {};

  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setStatus("transcribing");
      setStatusMessage("Transcription en cours avec Whisper...");

      const base64 = await blobToBase64(audioBlob);

      const { data, error: fnError } =
        await supabase.functions.invoke("transcribe-audio", {
          body: { action: "transcribe", audioData: base64, language },
        });

      if (fnError) {
        throw new Error(fnError.message || "Transcription failed");
      }

      if (data?.status === "completed") {
        setResult({
          text: data.text,
          utterances: data.utterances || [],
          audioDuration: data.audio_duration || 0,
        });
        setStatus("completed");
        setStatusMessage("Transcription terminée !");
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Réponse inattendue du serveur");
      }
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
      setStatusMessage("");
    }
  }, [language]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setStatus("recording");
      setStatusMessage("Enregistrement en cours...");

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
      setStatus("error");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve();
        return;
      }

      mediaRecorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        await processAudio(audioBlob);
        resolve();
      };

      mediaRecorder.stop();
    });
  }, [processAudio]);

  const reset = useCallback(() => {
    setStatus("idle");
    setStatusMessage("");
    setResult(null);
    setError(null);
    setDuration(0);
  }, []);

  return {
    status,
    statusMessage,
    result,
    error,
    isRecording,
    duration,
    startRecording,
    stopRecording,
    reset,
  };
}
