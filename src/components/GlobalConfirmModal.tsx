import { useState } from "react";
import { useProfileNotification, Ressenti } from "@/contexts/ProfileNotificationContext";
import { MedicationConfirmModal } from "@/components/MedicationConfirmModal";
import { FeelingScreen } from "@/components/FeelingScreen";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function GlobalConfirmModal() {
  const { profile, notifications, updateNotificationStatus, updateNotificationRessenti, showConfirmModal, setShowConfirmModal } = useProfileNotification();
  const [showFeeling, setShowFeeling] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const handleConfirm = () => {
    const pending = notifications.find((n) => n.status === "pending");
    if (pending) {
      updateNotificationStatus(pending.id, "confirmed");
      setConfirmedId(pending.id);
    }
    // Transition to feeling screen instead of closing
    setShowFeeling(true);
  };

  const handlePostpone = () => {
    const pending = notifications.find((n) => n.status === "pending");
    if (pending) updateNotificationStatus(pending.id, "postponed");
    setShowConfirmModal(false);
  };

  const handleFeelingSubmit = (ressenti: Ressenti) => {
    if (confirmedId) {
      updateNotificationRessenti(confirmedId, ressenti);
    }
    closeAll();
  };

  const handleFeelingSkip = () => {
    closeAll();
  };

  const closeAll = () => {
    setShowFeeling(false);
    setConfirmedId(null);
    setShowConfirmModal(false);
  };

  if (showFeeling) {
    return (
      <Dialog open onOpenChange={() => closeAll()}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full border-0 p-0 sm:rounded-none [&>button]:text-white/40 [&>button]:hover:text-white/70 [&>button]:z-50">
          <FeelingScreen onSubmit={handleFeelingSubmit} onSkip={handleFeelingSkip} />
        </DialogContent>
      </Dialog>
    );
  }

  const pendingNotif = notifications.find((n) => n.status === "pending");

  return (
    <MedicationConfirmModal
      open={showConfirmModal}
      prenom={profile.prenom}
      medicamentNom={pendingNotif?.medicament}
      medicamentDosage={pendingNotif ? `${pendingNotif.dosage} · ${pendingNotif.forme}` : undefined}
      onConfirm={handleConfirm}
      onPostpone={handlePostpone}
      onClose={() => setShowConfirmModal(false)}
    />
  );
}