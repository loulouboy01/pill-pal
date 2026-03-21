import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMedicamentById, deleteMedicament } from "@/lib/medicaments-storage";
import { getNotice, NoticeInfo } from "@/lib/api";
import { Medicament } from "@/types/medicament";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, Pencil, Pill, Calendar, Clock, Hash, FileText, AlertTriangle, Loader2 } from "lucide-react";
import ExpliqueMoiButton from "@/components/ExpliqueMoiButton";
import { toast } from "sonner";
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

const noticeFields: { key: keyof NoticeInfo; label: string; icon: typeof Pill }[] = [
  { key: "posologie", label: "Posologie recommandée", icon: Clock },
  { key: "modeAdministration", label: "Mode et voie d'administration", icon: Pill },
  { key: "momentPrise", label: "Moment de prise", icon: Calendar },
  { key: "delaiMinimumEntrePrises", label: "Délai minimum entre 2 prises", icon: Clock },
  { key: "dureeMaxTraitement", label: "Durée maximale de traitement", icon: Calendar },
  { key: "contreIndications", label: "Contre-indications", icon: AlertTriangle },
  { key: "effetsIndesirables", label: "Effets indésirables", icon: AlertTriangle },
];

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    if (!med?.codeCIS || noticeFetched) return;
    setNoticeLoading(true);
    setNoticeError(null);
    setNoticeFetched(true);

    getNotice(med.codeCIS)
      .then((data) => setNotice(data))
      .catch((err) => {
        console.error(err);
        setNoticeError("Impossible de charger la notice. Réessayez plus tard.");
      })
      .finally(() => setNoticeLoading(false));
  }

  if (!med) return null;

  function handleDelete() {
    deleteMedicament(med!.id);
    toast.success("Médicament supprimé");
    navigate("/");
  }

  const posLabels = [
    { key: "matin" as const, label: "Matin" },
    { key: "midi" as const, label: "Midi" },
    { key: "soir" as const, label: "Soir" },
    { key: "coucher" as const, label: "Coucher" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-accent active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Détail</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/medicament/${med.id}/modifier`)}
            className="rounded-xl"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-5 pb-12 pt-2">
        {/* Header card */}
        <div className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Pill className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-snug text-foreground">{med.nom}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {med.dosage}{med.forme ? ` · ${med.forme}` : ""}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="infos" onValueChange={(v) => v === "notice" && handleFetchNotice()}>
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted p-1 h-11">
            <TabsTrigger value="infos" className="rounded-xl text-sm font-medium">
              Informations
            </TabsTrigger>
            <TabsTrigger
              value="notice"
              className="rounded-xl text-sm font-medium"
              disabled={!med.codeCIS}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Notice
            </TabsTrigger>
          </TabsList>

          {/* Tab: Infos */}
          <TabsContent value="infos" className="space-y-6 mt-4">
            {/* Posologie */}
            <div className="rounded-2xl bg-card p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Posologie
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {posLabels.map(({ key, label }) => (
                  <div key={key} className="flex flex-col items-center rounded-xl bg-background p-3">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                      {med.posologie[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
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
                  <p className="text-xs text-muted-foreground">Ajouté le</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(med.dateAjout).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Chatbot */}
            {med.codeCIS && (
              <ExpliqueMoiButton cis={med.codeCIS} nomMedicament={med.nom} />
            )}

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer ce médicament
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce médicament ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le médicament sera supprimé de votre liste.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Tab: Notice */}
          <TabsContent value="notice" className="mt-4">
            {!med.codeCIS && (
              <div className="rounded-2xl bg-card p-6 shadow-sm text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun code CIS associé à ce médicament. La notice n'est pas disponible.
                </p>
              </div>
            )}

            {noticeLoading && (
              <div className="rounded-2xl bg-card p-8 shadow-sm flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement de la notice…</p>
              </div>
            )}

            {noticeError && (
              <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-5 space-y-3">
                <p className="text-sm text-destructive font-medium">{noticeError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => { setNoticeFetched(false); handleFetchNotice(); }}
                >
                  Réessayer
                </Button>
              </div>
            )}

            {notice && (
              <div className="space-y-3">
                {noticeFields.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="rounded-2xl bg-card p-4 shadow-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {label}
                      </h4>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {notice[key]}
                    </p>
                  </div>
                ))}
                <a
                  href={`https://base-donnees-publique.medicaments.gouv.fr/medicament/${med.codeCIS}/extrait#tab-rcp`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-card p-4 shadow-sm text-sm font-medium text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Consulter la notice complète sur la Base de données du médicament
                </a>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
