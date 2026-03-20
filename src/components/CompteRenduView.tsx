import { CompteRendu } from "@/types/consultation";
import { User, Stethoscope, Activity, ClipboardList, TestTube, CalendarClock, FileText, StickyNote } from "lucide-react";

interface Props {
  compteRendu: CompteRendu;
}

export function CompteRenduView({ compteRendu }: Props) {
  return (
    <div className="space-y-4">
      {/* Médecin & motif */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{compteRendu.medecin}</span>
        </div>
        {compteRendu.motifConsultation && (
          <p className="mt-1.5 text-sm text-muted-foreground">{compteRendu.motifConsultation}</p>
        )}
      </div>

      {/* Symptômes */}
      {compteRendu.symptomes.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Symptômes</span>
          </div>
          <ul className="space-y-1">
            {compteRendu.symptomes.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diagnostic */}
      {compteRendu.diagnostic && compteRendu.diagnostic !== "Non précisé" && (
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Diagnostic</span>
          </div>
          <p className="text-sm font-medium text-foreground">{compteRendu.diagnostic}</p>
        </div>
      )}

      {/* Traitements */}
      {compteRendu.traitements.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Traitements</span>
          </div>
          <div className="space-y-3">
            {compteRendu.traitements.map((t, i) => (
              <div key={i} className="rounded-xl bg-background p-3">
                <p className="text-sm font-medium text-foreground">{t.nom}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.posologie}</p>
                <p className="text-xs text-muted-foreground">Durée : {t.duree}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examens */}
      {compteRendu.examensPrescrits.length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <TestTube className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examens prescrits</span>
          </div>
          <ul className="space-y-1">
            {compteRendu.examensPrescrits.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prochain RDV */}
      {compteRendu.prochainRdv && compteRendu.prochainRdv !== "Non précisé" && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prochain rendez-vous</span>
          </div>
          <p className="mt-1.5 text-sm text-foreground">{compteRendu.prochainRdv}</p>
        </div>
      )}

      {/* Résumé */}
      {compteRendu.resume && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Résumé</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{compteRendu.resume}</p>
        </div>
      )}

      {/* Notes */}
      {compteRendu.notesComplementaires && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{compteRendu.notesComplementaires}</p>
        </div>
      )}
    </div>
  );
}
