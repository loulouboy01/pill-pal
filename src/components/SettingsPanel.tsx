import { useState } from "react";
import { useProfileNotification } from "@/contexts/ProfileNotificationContext";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import { MedicationConfirmModal } from "@/components/MedicationConfirmModal";

export function SettingsPanel() {
  const { profile, addNotification } = useProfileNotification();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const simulateNotification = () => {
    const prenom = profile.prenom || "";
    const title = prenom ? `Il est l'heure, ${prenom}` : "Il est l'heure";

    toast(title, {
      description: "Cliquez pour indiquer que vous avez pris votre médicament",
      duration: 5000,
      action: {
        label: "Ouvrir",
        onClick: () => setShowConfirm(true),
      },
      onClick: () => setShowConfirm(true),
    });

    // Add pending notification
    const id = crypto.randomUUID();
    setPendingId(id);
    addNotification({
      timestamp: new Date(),
      status: "pending",
      medicament: "Doliprane 1000 mg",
      dosage: "1000 mg",
      forme: "1 comprimé",
    });
  };

  const { notifications, updateNotificationStatus } = useProfileNotification();

  const handleConfirm = () => {
    // Update the most recent pending notification
    const pending = notifications.find((n) => n.status === "pending");
    if (pending) updateNotificationStatus(pending.id, "confirmed");
    setShowConfirm(false);
  };

  const handlePostpone = () => {
    const pending = notifications.find((n) => n.status === "pending");
    if (pending) updateNotificationStatus(pending.id, "postponed");
    setShowConfirm(false);
  };

  return (
    <>
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

      <MedicationConfirmModal
        open={showConfirm}
        prenom={profile.prenom}
        onConfirm={handleConfirm}
        onPostpone={handlePostpone}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}
