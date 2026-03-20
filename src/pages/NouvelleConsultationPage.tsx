import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transcribeAudio, generateConsultationReport } from "@/lib/api";
import { saveConsultation, updateConsultation } from "@/lib/consultations-storage";
import { Consultation, CompteRendu } from "@/types/consultation";
import { CompteRenduView } from "@/components/CompteRenduView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function NouvelleConsultationPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [duration, setDuration] = useState(0);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sendChunk = useCallback(async (blob: Blob) => {
    if (blob.size < 100) return;
    try {
      const text = await transcribeAudio(blob);
      if (text) {
        setTranscription((prev) => (prev ? prev + " " + text : text));
      }
    } catch {
      console.error("Erreur de transcription d'un chunk");
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(500); // Collect data every 500ms
      setIsRecording(true);
      setDuration(0);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      // Send chunks every 15 seconds
      intervalRef.current = setInterval(() => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
          chunksRef.current = [];
          sendChunk(blob);
        }
      }, 15000);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
      } else {
        toast.error("Impossible d'accéder au microphone");
      }
    }
  }, [sendChunk]);

  const stopRecording = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    // Send remaining chunks
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      await sendChunk(blob);
    }

    // Stop stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setIsRecording(false);

    // Save consultation
    const newConsultation: Consultation = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      transcription: "",
      compteRendu: null,
      statut: "transcrit",
    };
    setConsultation(newConsultation);
  }, [sendChunk]);

  // Keep consultation transcription in sync
  useEffect(() => {
    if (consultation) {
      setConsultation((prev) =>
        prev ? { ...prev, transcription } : prev
      );
    }
  }, [transcription]);

  const handleGenerateReport = useCallback(async () => {
    if (!consultation || !transcription.trim()) {
      toast.error("Aucune transcription à analyser");
      return;
    }

    setGeneratingReport(true);
    const updated = { ...consultation, transcription, statut: "analyse" as const };
    setConsultation(updated);

    try {
      const compteRendu: CompteRendu = await generateConsultationReport(transcription);
      const final: Consultation = {
        ...updated,
        compteRendu,
        statut: "termine",
      };
      setConsultation(final);
      saveConsultation(final);
      toast.success("Compte-rendu généré avec succès");
    } catch {
      toast.error("Erreur lors de la génération du compte-rendu");
      setConsultation({ ...updated, statut: "transcrit" });
    } finally {
      setGeneratingReport(false);
    }
  }, [consultation, transcription]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
          <button
            onClick={() => navigate("/consultations")}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-accent active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Nouvelle consultation</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-32">
        {/* Compte-rendu final */}
        {consultation?.statut === "termine" && consultation.compteRendu && (
          <div className="space-y-6 pt-2">
            <CompteRenduView compteRendu={consultation.compteRendu} />
            <Button
              onClick={() => navigate("/consultations")}
              variant="outline"
              className="h-12 w-full rounded-2xl text-sm font-medium"
            >
              Retour aux consultations
            </Button>
          </div>
        )}

        {/* Generating report */}
        {generatingReport && (
          <div className="flex flex-col items-center pt-24 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-6 text-lg font-semibold text-foreground">
              Analyse de la consultation...
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Génération du compte-rendu structuré
            </p>
          </div>
        )}

        {/* Recording / transcription view */}
        {!generatingReport && consultation?.statut !== "termine" && (
          <div className="flex flex-col items-center pt-8">
            {/* Mic button */}
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all active:scale-95 ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </button>
            </div>

            {/* Status */}
            <div className="mt-6 flex items-center gap-2">
              {isRecording && (
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {isRecording
                  ? "Enregistrement en cours..."
                  : consultation
                  ? "Enregistrement terminé"
                  : "Appuyez pour enregistrer"}
              </span>
            </div>

            {/* Timer */}
            {(isRecording || duration > 0) && (
              <span className="mt-1 font-mono text-2xl font-light tabular-nums text-foreground">
                {formatDuration(duration)}
              </span>
            )}

            {/* Transcription */}
            {transcription && (
              <div className="mt-8 w-full rounded-2xl border bg-card p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Transcription
                </p>
                <div className="max-h-60 overflow-y-auto">
                  <p className="text-sm leading-relaxed text-foreground">
                    {transcription}
                  </p>
                </div>
              </div>
            )}

            {/* Generate report button */}
            {consultation && !isRecording && transcription.trim() && (
              <Button
                onClick={handleGenerateReport}
                className="mt-8 h-12 w-full rounded-2xl text-sm font-medium"
              >
                <FileText className="mr-2 h-4 w-4" />
                Générer le compte-rendu
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
