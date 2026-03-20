import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "crypto";
import { saveMedicament } from "@/lib/medicaments-storage";
import { Medicament, MedicamentSearchResult, Posologie } from "@/types/medicament";
import { MedicamentSearchInput } from "@/components/MedicamentSearchInput";
import { PosologieStepper } from "@/components/PosologieStepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface AjouterPageProps {
  initialData?: Partial<Medicament>;
  onSave?: (med: Medicament) => void;
  title?: string;
}

export default function AjouterPage({ initialData, onSave, title = "Ajouter un médicament" }: AjouterPageProps) {
  const navigate = useNavigate();
  const [nom, setNom] = useState(initialData?.nom ?? "");
  const [dosage, setDosage] = useState(initialData?.dosage ?? "");
  const [forme, setForme] = useState(initialData?.forme ?? "");
  const [codeCIS, setCodeCIS] = useState<string | null>(initialData?.codeCIS ?? null);
  const [posologie, setPosologie] = useState<Posologie>(
    initialData?.posologie ?? { matin: 0, midi: 0, soir: 0, coucher: 0 }
  );
  const [dureeTraitement, setDureeTraitement] = useState(initialData?.dureeTraitement ?? "");

  function handleSelectMedicament(result: MedicamentSearchResult) {
    setNom(result.denomination);
    setCodeCIS(result.cis);
    // Try to extract dosage and forme from denomination
    setForme(result.forme || "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Veuillez saisir le nom du médicament");
      return;
    }

    const med: Medicament = {
      id: initialData?.id ?? crypto.randomUUID(),
      nom: nom.trim(),
      dosage: dosage.trim(),
      forme: forme.trim(),
      codeCIS,
      posologie,
      dureeTraitement: dureeTraitement.trim() || "Non précisé",
      dateAjout: initialData?.dateAjout ?? new Date().toISOString(),
    };

    if (onSave) {
      onSave(med);
    } else {
      saveMedicament(med);
      toast.success("Médicament ajouté");
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-accent active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 px-5 pb-12 pt-2">
        {/* Nom */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Nom du médicament</Label>
          <MedicamentSearchInput
            value={nom}
            onChange={setNom}
            onSelect={handleSelectMedicament}
          />
        </div>

        {/* Dosage */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Dosage</Label>
          <Input
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="Ex: 1000mg"
            className="rounded-xl bg-card"
          />
        </div>

        {/* Forme */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Forme</Label>
          <Input
            value={forme}
            onChange={(e) => setForme(e.target.value)}
            placeholder="Ex: comprimé, gélule, sirop"
            className="rounded-xl bg-card"
          />
        </div>

        {/* Posologie */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Posologie</Label>
          <div className="space-y-2">
            <PosologieStepper label="Matin" value={posologie.matin} onChange={(v) => setPosologie({ ...posologie, matin: v })} />
            <PosologieStepper label="Midi" value={posologie.midi} onChange={(v) => setPosologie({ ...posologie, midi: v })} />
            <PosologieStepper label="Soir" value={posologie.soir} onChange={(v) => setPosologie({ ...posologie, soir: v })} />
            <PosologieStepper label="Coucher" value={posologie.coucher} onChange={(v) => setPosologie({ ...posologie, coucher: v })} />
          </div>
        </div>

        {/* Durée */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Durée du traitement</Label>
          <Input
            value={dureeTraitement}
            onChange={(e) => setDureeTraitement(e.target.value)}
            placeholder="Ex: 7 jours, 1 mois, continu"
            className="rounded-xl bg-card"
          />
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl text-sm font-medium">
          Enregistrer
        </Button>
      </form>
    </div>
  );
}
