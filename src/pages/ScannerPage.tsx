import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { analyzePrescription } from "@/lib/api";
import { searchMedicament } from "@/lib/api";
import { compressImage } from "@/lib/image-compression";
import { saveMedicaments } from "@/lib/medicaments-storage";
import { Medicament, Posologie, createEmptyPrise } from "@/types/medicament";
import { PosologiePrises } from "@/components/PosologiePrises";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ExtractedMed {
  nom: string;
  dosage: string;
  forme: string;
  posologie: Posologie;
  dureeTraitement: string;
  codeCIS: string | null;
  loadingCIS: boolean;
}

/** Convert old {matin,midi,soir,coucher} format to new PriseMoment[] format */
function migratePosologie(p: any): Posologie {
  if (Array.isArray(p)) return p;
  if (p && typeof p === "object" && "matin" in p) {
    const prises: Posologie = [];
    if (p.matin > 0) prises.push({ moment: "Pendant le petit-déjeuner", quantite: p.matin, unite: "comprimé", heureNotification: "07:30" });
    if (p.midi > 0) prises.push({ moment: "Pendant le déjeuner", quantite: p.midi, unite: "comprimé", heureNotification: "12:30" });
    if (p.soir > 0) prises.push({ moment: "Pendant le dîner", quantite: p.soir, unite: "comprimé", heureNotification: "19:30" });
    if (p.coucher > 0) prises.push({ moment: "Au coucher", quantite: p.coucher, unite: "comprimé", heureNotification: "22:00" });
    return prises.length > 0 ? prises : [createEmptyPrise()];
  }
  return [createEmptyPrise()];
}

export default function ScannerPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "loading" | "results">("upload");
  const [extracted, setExtracted] = useState<ExtractedMed[]>([]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep("loading");
    try {
      const base64 = await compressImage(file);
      const meds = await analyzePrescription(base64);

      if (!meds || meds.length === 0) {
        toast.error("Aucun médicament détecté dans l'ordonnance");
        setStep("upload");
        return;
      }

      const mapped: ExtractedMed[] = meds.map((m: any) => ({
        nom: m.nom || "",
        dosage: m.dosage || "",
        forme: m.forme || "",
        posologie: migratePosologie(m.posologie),
        dureeTraitement: m.dureeTraitement || "Non précisé",
        codeCIS: null,
        loadingCIS: true,
      }));

      setExtracted(mapped);
      setStep("results");

      mapped.forEach(async (med, i) => {
        try {
          const results = await searchMedicament(med.nom);
          if (results.length > 0) {
            setExtracted((prev) => prev.map((m, j) => j === i ? { ...m, codeCIS: results[0].cis, loadingCIS: false } : m));
          } else {
            setExtracted((prev) => prev.map((m, j) => j === i ? { ...m, loadingCIS: false } : m));
          }
        } catch {
          setExtracted((prev) => prev.map((m, j) => j === i ? { ...m, loadingCIS: false } : m));
        }
      });
    } catch {
      toast.error("Erreur lors de l'analyse de l'ordonnance");
      setStep("upload");
    }
  }

  function updateExtracted(index: number, field: string, value: any) {
    setExtracted((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  }

  function handleSaveAll() {
    const meds: Medicament[] = extracted.map((m) => ({
      id: crypto.randomUUID(),
      nom: m.nom,
      dosage: m.dosage,
      forme: m.forme,
      codeCIS: m.codeCIS,
      posologie: m.posologie,
      dureeTraitement: m.dureeTraitement || "Non précisé",
      dateAjout: new Date().toISOString(),
    }));

    saveMedicaments(meds);
    toast.success(`${meds.length} médicament${meds.length > 1 ? "s" : ""} ajouté${meds.length > 1 ? "s" : ""}`);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
          <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-accent active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Scanner une ordonnance</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-12">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

        {step === "upload" && (
          <div className="flex flex-col items-center pt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Camera className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-lg font-semibold text-foreground">Photographiez votre ordonnance</h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Prenez en photo votre ordonnance ou sélectionnez une image depuis votre galerie.
            </p>
            <Button onClick={() => fileRef.current?.click()} className="mt-8 h-12 rounded-2xl px-8 text-sm font-medium">
              <Camera className="mr-2 h-4 w-4" />Prendre une photo
            </Button>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center pt-24 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-6 text-lg font-semibold text-foreground">Analyse en cours...</h2>
            <p className="mt-2 text-sm text-muted-foreground">Extraction des médicaments de l'ordonnance</p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-primary">
                {extracted.length} médicament{extracted.length > 1 ? "s" : ""} détecté{extracted.length > 1 ? "s" : ""}
              </p>
            </div>

            {extracted.map((med, index) => (
              <div key={index} className="rounded-2xl border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Médicament {index + 1}</h3>
                  {med.loadingCIS ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : med.codeCIS ? (
                    <span className="text-xs text-primary font-medium">CIS trouvé</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" /> CIS non trouvé
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nom</Label>
                    <Input value={med.nom} onChange={(e) => updateExtracted(index, "nom", e.target.value)} className="rounded-xl bg-background text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Dosage</Label>
                      <Input value={med.dosage} onChange={(e) => updateExtracted(index, "dosage", e.target.value)} className="rounded-xl bg-background text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Forme</Label>
                      <Input value={med.forme} onChange={(e) => updateExtracted(index, "forme", e.target.value)} className="rounded-xl bg-background text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Posologie</Label>
                    <PosologiePrises value={med.posologie} onChange={(v) => updateExtracted(index, "posologie", v)} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Durée du traitement</Label>
                    <Input value={med.dureeTraitement} onChange={(e) => updateExtracted(index, "dureeTraitement", e.target.value)} className="rounded-xl bg-background text-sm" />
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={handleSaveAll} className="h-12 w-full rounded-2xl text-sm font-medium">
              Tout enregistrer
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
