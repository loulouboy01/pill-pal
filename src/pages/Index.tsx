import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMedicaments } from "@/lib/medicaments-storage";
import { Medicament } from "@/types/medicament";
import { MedicamentCard } from "@/components/MedicamentCard";
import { Plus, ScanLine, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileNotification } from "@/contexts/ProfileNotificationContext";

export default function Index() {
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const navigate = useNavigate();
  const { profile } = useProfileNotification();

  useEffect(() => {
    setMedicaments(getMedicaments());
  }, []);

  const isEmpty = medicaments.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold leading-none tracking-tight text-foreground">
              Mes traitements
            </h1>
            {!isEmpty && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {medicaments.length} médicament{medicaments.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-32">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center pt-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Pill className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-lg font-semibold text-foreground">
              Aucun traitement enregistré
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Ajoutez vos médicaments manuellement ou scannez une ordonnance pour commencer.
            </p>
            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
              <Button
                onClick={() => navigate("/ajouter")}
                className="h-12 rounded-2xl text-sm font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter manuellement
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/scanner")}
                className="h-12 rounded-2xl text-sm font-medium"
              >
                <ScanLine className="mr-2 h-4 w-4" />
                Scanner une ordonnance
              </Button>
            </div>
          </div>
        ) : (
          /* Medication list */
          <div className="flex flex-col gap-3 pt-2">
            {medicaments.map((med) => (
              <MedicamentCard key={med.id} medicament={med} />
            ))}
          </div>
        )}
      </main>

      {/* FAB - only visible when list is not empty */}
      {!isEmpty && (
        <div className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 gap-3">
          <Button
            onClick={() => navigate("/ajouter")}
            className="h-12 rounded-2xl px-5 shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/scanner")}
            className="h-12 rounded-2xl bg-card px-5 shadow-lg shadow-black/5"
          >
            <ScanLine className="mr-2 h-4 w-4" />
            Scanner
          </Button>
        </div>
      )}
    </div>
  );
}
