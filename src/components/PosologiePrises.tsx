import { PriseMoment, MOMENTS_PRISE, HEURES_DEFAUT, UNITES, pluralizeUnite, createEmptyPrise } from "@/types/medicament";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface PosologiePrisesProps {
  value: PriseMoment[];
  onChange: (value: PriseMoment[]) => void;
}

export function PosologiePrises({ value, onChange }: PosologiePrisesProps) {
  function updatePrise(index: number, field: keyof PriseMoment, val: string | number) {
    const updated = value.map((p, i) => {
      if (i !== index) return p;
      const newPrise = { ...p, [field]: val };
      // Auto-fill default time when moment changes
      if (field === "moment" && typeof val === "string" && HEURES_DEFAUT[val]) {
        newPrise.heureNotification = HEURES_DEFAUT[val];
      }
      return newPrise;
    });
    onChange(updated);
  }

  function addPrise() {
    onChange([...value, createEmptyPrise()]);
  }

  function removePrise(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {value.map((prise, index) => (
        <div
          key={index}
          className="rounded-xl bg-muted/50 p-3 space-y-3 md:space-y-0 md:flex md:items-start md:gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Moment */}
          <div className="flex-1 min-w-0">
            <Select
              value={prise.moment}
              onValueChange={(v) => updatePrise(index, "moment", v)}
            >
              <SelectTrigger className="rounded-lg bg-background text-sm h-9">
                <SelectValue placeholder="Moment de la prise" />
              </SelectTrigger>
              <SelectContent>
                {MOMENTS_PRISE.map((m) => (
                  <SelectItem key={m} value={m} className="text-sm">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantité + Unité */}
          <div className="flex gap-2">
            <Input
              type="number"
              min={0.5}
              step={0.5}
              value={prise.quantite}
              onChange={(e) => updatePrise(index, "quantite", parseFloat(e.target.value) || 0.5)}
              className="w-20 rounded-lg bg-background text-sm h-9 text-center"
            />
            <Select
              value={prise.unite}
              onValueChange={(v) => updatePrise(index, "unite", v)}
            >
              <SelectTrigger className="w-[140px] rounded-lg bg-background text-sm h-9">
                <SelectValue>{pluralizeUnite(prise.unite, prise.quantite)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {UNITES.map((u) => (
                  <SelectItem key={u} value={u} className="text-sm">
                    {pluralizeUnite(u, prise.quantite)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Heure */}
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={prise.heureNotification}
              onChange={(e) => updatePrise(index, "heureNotification", e.target.value)}
              step={300}
              className="w-[100px] rounded-lg bg-background text-sm h-9"
            />
            {value.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removePrise(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-sm text-primary hover:text-primary/80"
        onClick={addPrise}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Ajouter un autre moment de prise
      </Button>
    </div>
  );
}
