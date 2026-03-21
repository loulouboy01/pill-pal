import { Medicament, pluralizeUnite } from "@/types/medicament";
import { useNavigate } from "react-router-dom";
import { Pill } from "lucide-react";

interface MedicamentCardProps {
  medicament: Medicament;
}

function formatPosologie(p: Medicament["posologie"]): string {
  if (!Array.isArray(p) || p.length === 0) return "Aucune prise";
  return p.map((prise) =>
    `${prise.quantite} ${pluralizeUnite(prise.unite, prise.quantite)}`
  ).join(", ");
}

export function MedicamentCard({ medicament }: MedicamentCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/medicament/${medicament.id}`)}
      className="w-full text-left rounded-2xl bg-card p-4 shadow-[0_1px_3px_hsl(30_10%_15%/0.06),0_1px_2px_hsl(30_10%_15%/0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_hsl(30_10%_15%/0.08),0_2px_4px_hsl(30_10%_15%/0.04)] active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Pill className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold leading-tight text-foreground">
            {medicament.nom}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {medicament.dosage}{medicament.forme ? ` · ${medicament.forme}` : ""}
          </p>
          <p className="mt-1.5 inline-flex items-center rounded-lg bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {formatPosologie(medicament.posologie)}
          </p>
        </div>
      </div>
    </button>
  );
}
