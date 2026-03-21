import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { generateConsultationReport } from "@/lib/api";
import { saveConsultation } from "@/lib/consultations-storage";
import { Consultation, CompteRendu } from "@/types/consultation";
import { CompteRenduView } from "@/components/CompteRenduView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTranscription } from "@/hooks/useTranscription";
import { formatTranscript, getUniqueSpeakers, getSpeakerColor } from "@/lib/transcription-utils";

export default function NouvelleConsultationPage() {
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const {
    status,
    statusMessage,
    result,
    error: transcriptionError,
    isRecording,
    duration,
    startRecording: startRec,
    stopRecording: stopRec,
  } = useTranscription({ language: "fr" });

  const transcriptionText = result?.text || "";

  const handleStartRecording = useCallback(async () => {
    try {
      await startRec();
    } catch {
      toast.error("Impossible d'accéder au microphone");
    }
  }, [startRec]);

  const handleStopRecording = useCallback(async () => {
    await stopRec();
    const newConsultation: Consultation = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      transcription: "",
      compteRendu: null,
      statut: "transcrit",
    };
    setConsultation(newConsultation);
  }, [stopRec]);

  const handleGenerateReport = useCallback(async () => {
    if (!consultation || !transcriptionText.trim()) {
      toast.error("Aucune transcription à analyser");
      return;
    }

    setGeneratingReport(true);
    const updated = { ...consultation, transcription: transcriptionText, statut: "analyse" as const };
    setConsultation(updated);

    try {
      const compteRendu: CompteRendu = await generateConsultationReport(transcriptionText);
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
  }, [consultation, transcriptionText]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isProcessing = status === "uploading" || status === "transcribing";

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
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50 ${
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
              {isProcessing && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {statusMessage || (consultation ? "Enregistrement terminé" : "Appuyez pour enregistrer")}
              </span>
            </div>

            {/* Timer */}
            {(isRecording || duration > 0) && (
              <span className="mt-1 font-mono text-2xl font-light tabular-nums text-foreground">
                {formatDuration(duration)}
              </span>
            )}

            {/* Error */}
            {transcriptionError && (
              <div className="mt-4 w-full rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive">
                {transcriptionError}
              </div>
            )}

            {/* Transcription with diarization */}
            {result?.utterances && result.utterances.length > 0 && (
              <div className="mt-8 w-full rounded-2xl border bg-card p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Transcription — {getUniqueSpeakers(result.utterances).length} locuteur(s)
                </p>
                <div className="max-h-60 space-y-3 overflow-y-auto">
                  {result.utterances.map((utterance, i) => (
                    <div key={i} className="flex gap-3">
                      <div
                        className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: getSpeakerColor(utterance.speaker) }}
                      >
                        {utterance.speaker}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Locuteur {utterance.speaker}
                        </span>
                        <p className="text-sm leading-relaxed text-foreground">
                          {utterance.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: plain text if no utterances */}
            {result?.text && (!result.utterances || result.utterances.length === 0) && (
              <div className="mt-8 w-full rounded-2xl border bg-card p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Transcription
                </p>
                <div className="max-h-60 overflow-y-auto">
                  <p className="text-sm leading-relaxed text-foreground">
                    {result.text}
                  </p>
                </div>
              </div>
            )}

            {/* Generate report button */}
            {consultation && !isRecording && !isProcessing && transcriptionText.trim() && (
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
