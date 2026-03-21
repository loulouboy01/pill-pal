import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMedicamentById, deleteMedicament } from "@/lib/medicaments-storage";
import { Medicament, pluralizeUnite } from "@/types/medicament";
import { useProfileNotification } from "@/contexts/ProfileNotificationContext";
import ExpliqueMoiButton from "@/components/ExpliqueMoiButton";
import { MedicationHistoryTab } from "@/components/MedicationHistoryTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Calendar, Hash, Pencil, Trash2, FileText, Loader2, AlertCircle, History } from "lucide-react";
import { toast } from "sonner";

interface NoticeInfo {
  posologie: string;
  modeAdministration: string;
  momentPrise: string;
  contreIndications: string;
  effetsIndesirables: string;
  precautions: string;
  interactions: string;
  conservation: string;
}

const noticeFields: { key: keyof NoticeInfo; label: string; icon: typeof Pill }[] = [
  { key: "posologie", label: "Posologie recommandée", icon: Clock },
  { key: "modeAdministration", label: "Mode et voie d'administration", icon: Pill },
  { key: "momentPrise", label: "Moment de prise", icon: Calendar },
  { key: "contreIndications", label: "Contre-indications", icon: AlertCircle },
  { key: "effetsIndesirables", label: "Effets indésirables", icon: AlertCircle },
  { key: "precautions", label: "Précautions d'emploi", icon: AlertCircle },
  { key: "interactions", label: "Interactions", icon: AlertCircle },
  { key: "conservation", label: "Conservation", icon: AlertCircle },
];

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notifications } = useProfileNotification();
  const [med, setMed] = useState<Medicament | null>(null);
  const [notice, setNotice] = useState<NoticeInfo | null>(null);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [noticeFetched, setNoticeFetched] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getMedicamentById(id);
      if (found) setMed(found);
      else navigate("/");
    }
  }, [id, navigate]);

  function handleFetchNotice() {
    if (noticeFetched || !med?.codeCIS) return;
    setNoticeFetched(true);
    setNoticeLoading(true);
    setNoticeError(null);

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-notice`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ cis: med.codeCIS }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.notice) setNotice(data.notice); else setNoticeError("Notice non trouvée"); })
      .catch(() => { setNoticeError("Impossible de charger la notice. Réessayez plus tard."); })
      .finally(() => setNoticeLoading(false));
  }

  if (!med) return null;

  function handleDelete() {
    deleteMedicament(med!.id);
    toast.success("Médicament supprimé");
    navigate("/");
  }

  const posologie = Array.isArray(med.posologie) ? med.posologie : [];

  // Filter notifications for this medication
  const medHistory = notifications
    .filter((n) => n.medicament === med.nom || n.medicament === `${med.nom} ${med.dosage}`.trim())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-accent active:scale-95">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Détail</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/medicament/${med.id}/modifier`)} className="rounded-xl">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-5 pb-12 pt-2">
        {/* Header card */}
        <div className="flex items-start gap-4 rounded-2xl bg-primary p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/20">
            <Pill className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-snug text-primary-foreground">{med.nom}</h2>
            <p className="mt-1 text-sm text-primary-foreground/80">
              {med.dosage}{med.forme ? ` · ${med.forme}` : ""}
            </p>
          </div>
        </div>

        {/* Explique-moi button */}
        {med.codeCIS && (
          <ExpliqueMoiButton cis={med.codeCIS} nomMedicament={med.nom} />
        )}

        {/* Tabs */}
        <Tabs defaultValue="infos" onValueChange={(v) => v === "notice" && handleFetchNotice()}>
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted p-1 h-11">
            <TabsTrigger value="infos" className="rounded-xl text-xs font-medium">Informations</TabsTrigger>
            <TabsTrigger value="notice" className="rounded-xl text-xs font-medium" disabled={!med.codeCIS}>
              <FileText className="mr-1 h-3 w-3" />Notice
            </TabsTrigger>
            <TabsTrigger value="historique" className="rounded-xl text-xs font-medium">
              <History className="mr-1 h-3 w-3" />Historique
            </TabsTrigger>
          </TabsList>

          {/* Tab: Infos */}
          <TabsContent value="infos" className="space-y-6 mt-4">
            <div className="rounded-2xl bg-card p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Posologie
              </h3>
              {posologie.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune prise définie</p>
              ) : (
                <div className="space-y-2">
                  {posologie.map((prise, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-background p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{prise.moment || "Non précisé"}</p>
                        <p className="text-xs text-muted-foreground">
                          {prise.quantite} {pluralizeUnite(prise.unite, prise.quantite)}
                        </p>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-primary">{prise.heureNotification}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Durée du traitement</p>
                  <p className="text-sm font-medium text-foreground">{med.dureeTraitement}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Code CIS</p>
                  <p className="text-sm font-medium text-foreground">{med.codeCIS || "Non renseigné"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date d'ajout</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(med.dateAjout).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            <Button variant="destructive" className="w-full rounded-2xl h-11" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ce médicament
            </Button>
          </TabsContent>

          {/* Tab: Notice */}
          <TabsContent value="notice" className="space-y-4 mt-4">
            {noticeLoading && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Chargement de la notice…</p>
              </div>
            )}
            {noticeError && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {noticeError}
              </div>
            )}
            {notice && (
              <div className="space-y-4">
                {noticeFields.map(({ key, label, icon: Icon }) => {
                  const value = notice[key];
                  if (!value) return null;
                  return (
                    <div key={key} className="rounded-2xl bg-card p-4 shadow-sm">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                        <Icon className="h-4 w-4 text-primary" />{label}
                      </h4>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{value}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {med.codeCIS && (
              <a
                href={`https://base-donnees-publique.medicaments.gouv.fr/medicament/${med.codeCIS}/extrait#tab-rcp`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-card p-4 shadow-sm text-sm font-medium text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                Consulter la notice complète sur la Base de données du médicament
              </a>
            )}
          </TabsContent>

          {/* Tab: Historique */}
          <TabsContent value="historique" className="mt-4">
            <MedicationHistoryTab
              medicamentName={med.nom}
              entries={medHistory}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}