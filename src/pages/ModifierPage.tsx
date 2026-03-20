import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMedicamentById, updateMedicament } from "@/lib/medicaments-storage";
import { Medicament } from "@/types/medicament";
import AjouterPage from "./AjouterPage";
import { toast } from "sonner";

export default function ModifierPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [med, setMed] = useState<Medicament | null>(null);

  useEffect(() => {
    if (id) {
      const found = getMedicamentById(id);
      if (found) setMed(found);
      else navigate("/");
    }
  }, [id, navigate]);

  if (!med) return null;

  function handleSave(updated: Medicament) {
    updateMedicament(updated);
    toast.success("Médicament modifié");
    navigate(`/medicament/${updated.id}`);
  }

  return (
    <AjouterPage
      initialData={med}
      onSave={handleSave}
      title="Modifier le médicament"
    />
  );
}
