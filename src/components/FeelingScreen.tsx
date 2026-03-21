import { useState } from "react";
import { Ressenti } from "@/contexts/ProfileNotificationContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AMELIORATION_TAGS = [
  "Moins de douleur",
  "Meilleur sommeil",
  "Plus d'énergie",
  "Pas de changement",
  "Légère amélioration",
];

const EFFETS_TAGS = [
  "Nausées",
  "Maux de tête",
  "Fatigue",
  "Vertiges",
  "Troubles digestifs",
  "Aucun effet indésirable",
];

const EMOJIS: { value: Ressenti["etatGlobal"]; emoji: string; label: string }[] = [
  { value: "bien", emoji: "😊", label: "Bien" },
  { value: "moyen", emoji: "😐", label: "Moyen" },
  { value: "mal", emoji: "😞", label: "Mal" },
];

interface Props {
  onSubmit: (ressenti: Ressenti) => void;
  onSkip: () => void;
}

export function FeelingScreen({ onSubmit, onSkip }: Props) {
  const [amelioration, setAmelioration] = useState("");
  const [effets, setEffets] = useState("");
  const [etat, setEtat] = useState<Ressenti["etatGlobal"]>("");

  const insertTag = (setter: React.Dispatch<React.SetStateAction<string>>, tag: string) => {
    setter((prev) => {
      if (prev.includes(tag)) return prev;
      return prev ? `${prev}, ${tag}` : tag;
    });
  };

  return (
    <div
      className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-y-auto px-6 py-8"
      style={{
        background: "linear-gradient(170deg, hsl(195 50% 16%) 0%, hsl(210 45% 12%) 50%, hsl(220 40% 10%) 100%)",
        color: "white",
      }}
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
          Prise confirmée ✓
        </p>
        <h2 className="mt-3 text-xl font-bold">Comment vous sentez-vous ?</h2>
      </div>

      <div className="flex flex-1 flex-col gap-6">
        {/* Question 1 */}
        <div>
          <label className="text-sm font-semibold text-white/80">
            Avez-vous ressenti une amélioration depuis la dernière prise ?
          </label>
          <Textarea
            value={amelioration}
            onChange={(e) => setAmelioration(e.target.value)}
            placeholder="Décrivez brièvement..."
            className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            rows={2}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {AMELIORATION_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertTag(setAmelioration, tag)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  amelioration.includes(tag)
                    ? "bg-white/20 text-white"
                    : "bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/70"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Question 2 */}
        <div>
          <label className="text-sm font-semibold text-white/80">
            Avez-vous ressenti des effets indésirables ?
          </label>
          <Textarea
            value={effets}
            onChange={(e) => setEffets(e.target.value)}
            placeholder="Décrivez brièvement..."
            className="mt-2 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-white/20"
            rows={2}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {EFFETS_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertTag(setEffets, tag)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  effets.includes(tag)
                    ? "bg-white/20 text-white"
                    : "bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/70"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Global state */}
        <div>
          <label className="text-sm font-semibold text-white/80">
            Comment vous sentez-vous globalement ?
          </label>
          <div className="mt-3 flex justify-center gap-6">
            {EMOJIS.map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setEtat(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3 transition-all",
                  etat === value
                    ? "bg-white/15 scale-110 shadow-lg"
                    : "bg-white/5 hover:bg-white/10"
                )}
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs font-medium text-white/60">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          onClick={() => onSubmit({ amelioration, effetsIndesirables: effets, etatGlobal: etat })}
          className="h-12 rounded-2xl bg-white/15 text-white font-semibold hover:bg-white/25 border border-white/10"
        >
          Enregistrer mon ressenti
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-white/35 underline underline-offset-4 transition-colors hover:text-white/60"
        >
          Passer
        </button>
      </div>
    </div>
  );
}