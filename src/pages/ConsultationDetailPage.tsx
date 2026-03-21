import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getConsultationById, deleteConsultation } from "@/lib/consultations-storage";
import { Consultation } from "@/types/consultation";
import { CompteRenduView } from "@/components/CompteRenduView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import ExpliqueMoiConsultationButton from "@/components/ExpliqueMoiConsultationButton";

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    if (id) {
      const c = getConsultationById(id);
      if (c) setConsultation(c);
      else navigate("/consultations");
    }
  }, [id, navigate]);

  const handleDelete = () => {
    if (id) {
      deleteConsultation(id);
      toast.success("Consultation supprimée");
      navigate("/consultations");
    }
  };

  if (!consultation) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/consultations")}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-accent active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Consultation</h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(consultation.date), "d MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-destructive transition-colors hover:bg-destructive/10 active:scale-95">
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette consultation ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-32">
        <div className="pt-4 pb-3">
          <ExpliqueMoiConsultationButton
            transcription={consultation.transcription}
            compteRendu={consultation.compteRendu}
            dateLabel={format(new Date(consultation.date), "d MMMM yyyy", { locale: fr })}
          />
        </div>

        <Tabs defaultValue="compte-rendu" className="pt-2">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="compte-rendu" className="rounded-lg text-xs">
              Compte-rendu
            </TabsTrigger>
            <TabsTrigger value="transcription" className="rounded-lg text-xs">
              Transcription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compte-rendu" className="mt-4">
            {consultation.compteRendu ? (
              <CompteRenduView compteRendu={consultation.compteRendu} />
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun compte-rendu généré pour cette consultation.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transcription" className="mt-4">
            <div className="rounded-2xl border bg-card p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {consultation.transcription || "Aucune transcription disponible."}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
