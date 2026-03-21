import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";

interface Props {
  open: boolean;
  prenom: string;
  onConfirm: () => void;
  onPostpone: () => void;
  onClose: () => void;
}

export function MedicationConfirmModal({ open, prenom, onConfirm, onPostpone, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col items-center justify-center gap-6 border-0 bg-[hsl(220_40%_13%)] text-white sm:rounded-none [&>button]:text-white/60 [&>button]:hover:text-white">
        <p className="text-sm font-medium uppercase tracking-widest text-white/60">Il est l'heure de prendre</p>

        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
          <span className="text-5xl">💊</span>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold">Doliprane 1000</h2>
          <p className="mt-1 text-base text-white/70">1 comprimé</p>
        </div>

        <Button
          onClick={onConfirm}
          className="mt-4 h-14 w-full max-w-xs rounded-2xl bg-green-600 text-base font-semibold text-white shadow-lg shadow-green-600/30 hover:bg-green-700"
        >
          <Check className="mr-2 h-5 w-5" />
          Je l'ai pris
        </Button>

        <button onClick={onPostpone} className="text-sm text-white/50 underline underline-offset-4 transition-colors hover:text-white/80">
          <Clock className="mr-1 inline h-3.5 w-3.5" />
          Rappeler dans 15 minutes
        </button>

        <p className="absolute bottom-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">Rappel dédié</p>
      </DialogContent>
    </Dialog>
  );
}
