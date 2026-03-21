import { useProfileNotification } from "@/contexts/ProfileNotificationContext";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Zap } from "lucide-react";
import { toast } from "sonner";

export function SettingsPanel() {
  const { profile, addNotification, setShowConfirmModal, onClosePanel } = useProfileNotification();

  const simulateNotification = () => {
    const prenom = profile.prenom || "";
    const title = prenom ? `Il est l'heure, ${prenom}` : "Il est l'heure";

    // Close the sheet first so the toast is accessible
    onClosePanel?.();

    // Small delay to let sheet close before showing toast
    setTimeout(() => {
      toast(title, {
        description: "Cliquez pour indiquer que vous avez pris votre médicament",
        duration: 10000,
        action: {
          label: "Ouvrir",
          onClick: () => setShowConfirmModal(true),
        },
      });
    }, 300);

    addNotification({
      timestamp: new Date(),
      status: "pending",
      medicament: "Doliprane 1000 mg",
      dosage: "1000 mg",
      forme: "1 comprimé",
    });
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <SheetTitle>Réglages</SheetTitle>
            <SheetDescription>Configuration et tests</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Simulation</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Déclenche une notification de rappel factice pour tester le flux complet.
        </p>
        <Button onClick={simulateNotification} className="mt-4 h-11 w-full rounded-xl" variant="default">
          <Zap className="mr-2 h-4 w-4" />
          Simuler une notification
        </Button>
      </div>
    </div>
  );
}
