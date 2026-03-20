import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getConsultations } from "@/lib/consultations-storage";
import { Consultation } from "@/types/consultation";
import { Stethoscope, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  en_cours: "En cours",
  transcrit: "Transcrit",
  analyse: "Analyse...",
  termine: "Terminé",
};

const statusColors: Record<string, string> = {
  en_cours: "bg-orange-100 text-orange-700",
  transcrit: "bg-blue-100 text-blue-700",
  analyse: "bg-purple-100 text-purple-700",
  termine: "bg-emerald-100 text-emerald-700",
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setConsultations(getConsultations());
  }, []);

  const isEmpty = consultations.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold leading-none tracking-tight text-foreground">
              Consultations
            </h1>
            {!isEmpty && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {consultations.length} consultation{consultations.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-32">
        {isEmpty ? (
          <div className="flex flex-col items-center pt-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Stethoscope className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-lg font-semibold text-foreground">
              Aucune consultation
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Enregistrez une conversation avec votre médecin pour obtenir un compte-rendu structuré.
            </p>
            <Button
              onClick={() => navigate("/consultations/nouvelle")}
              className="mt-8 h-12 rounded-2xl px-8 text-sm font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle consultation
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            {consultations.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/consultations/${c.id}`)}
                className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-left transition-shadow hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {format(new Date(c.date), "d MMMM yyyy", { locale: fr })}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[c.statut] || ""
                    }`}
                  >
                    {statusLabels[c.statut] || c.statut}
                  </span>
                </div>
                {c.compteRendu && (
                  <div className="space-y-0.5">
                    {c.compteRendu.medecin !== "Non identifié" && (
                      <p className="text-sm text-muted-foreground">
                        {c.compteRendu.medecin}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {c.compteRendu.motifConsultation}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {!isEmpty && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2">
          <Button
            onClick={() => navigate("/consultations/nouvelle")}
            className="h-12 rounded-2xl px-6 shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle consultation
          </Button>
        </div>
      )}
    </div>
  );
}
