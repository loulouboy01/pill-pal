import { useState } from "react";
import { NotificationEntry, Ressenti } from "@/contexts/ProfileNotificationContext";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ClipboardList, Loader2, ChevronDown, Copy, X } from "lucide-react";
import { toast } from "sonner";

const ETAT_EMOJI: Record<string, string> = { bien: "😊", moyen: "😐", mal: "😞" };

function statusInfo(status: string) {
  if (status === "confirmed") return { label: "Confirmé", icon: "✅" };
  if (status === "postponed") return { label: "Reporté", icon: "🔄" };
  return { label: "Manqué", icon: "❌" };
}

function RessentiDetail({ ressenti }: { ressenti?: Ressenti }) {
  if (!ressenti || (!ressenti.amelioration && !ressenti.effetsIndesirables && !ressenti.etatGlobal)) {
    return <p className="text-xs text-muted-foreground italic">Aucun ressenti enregistré pour cette prise</p>;
  }
  return (
    <div className="space-y-2 text-sm">
      {ressenti.amelioration && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Amélioration</p>
          <p className="text-foreground">{ressenti.amelioration}</p>
        </div>
      )}
      {ressenti.effetsIndesirables && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Effets indésirables</p>
          <p className="text-foreground">{ressenti.effetsIndesirables}</p>
        </div>
      )}
      {ressenti.etatGlobal && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground">État global</p>
          <p className="text-lg">{ETAT_EMOJI[ressenti.etatGlobal] || ""}</p>
        </div>
      )}
    </div>
  );
}

interface Props {
  medicamentName: string;
  entries: NotificationEntry[];
}

export function MedicationHistoryTab({ medicamentName, entries }: Props) {
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const data = entries.map((e) => ({
        date: new Date(e.timestamp).toISOString(),
        status: e.status,
        ressenti: e.ressenti || null,
      }));

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-medication-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ medicament: medicamentName, prises: data }),
        }
      );

      if (!resp.ok) throw new Error("Erreur serveur");
      const result = await resp.json();
      setReport(result.report);
    } catch {
      toast.error("Impossible de générer le rapport. Réessayez plus tard.");
    } finally {
      setReportLoading(false);
    }
  };

  const copyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      toast.success("Rapport copié dans le presse-papier");
    }
  };

  if (report) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Rapport médical</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={copyReport}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copier
            </Button>
            <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => setReport(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div
          className="prose prose-sm max-w-none rounded-2xl bg-card p-5 shadow-sm dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(report) }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={generateReport}
        disabled={reportLoading || entries.length === 0}
        className="w-full h-11 rounded-2xl"
      >
        {reportLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération du rapport en cours…
          </>
        ) : (
          <>
            <ClipboardList className="mr-2 h-4 w-4" /> 📋 Générer un rapport pour mon médecin
          </>
        )}
      </Button>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm text-muted-foreground">Aucune prise enregistrée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const { label, icon } = statusInfo(entry.status);
            const date = new Date(entry.timestamp);
            return (
              <Collapsible key={entry.id}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl bg-card p-4 shadow-sm text-left hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.ressenti?.etatGlobal && (
                      <span className="text-lg">{ETAT_EMOJI[entry.ressenti.etatGlobal]}</span>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mx-4 mb-2 rounded-xl bg-muted/50 p-4">
                    <RessentiDetail ressenti={entry.ressenti} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple markdown-to-HTML converter
function formatMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}