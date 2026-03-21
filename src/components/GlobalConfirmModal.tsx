import { useProfileNotification } from "@/contexts/ProfileNotificationContext";
import { MedicationConfirmModal } from "@/components/MedicationConfirmModal";

export function GlobalConfirmModal() {
  const { profile, notifications, updateNotificationStatus, showConfirmModal, setShowConfirmModal } = useProfileNotification();

  const handleConfirm = () => {
    const pending = notifications.find((n) => n.status === "pending");
    if (pending) updateNotificationStatus(pending.id, "confirmed");
    setShowConfirmModal(false);
  };

  const handlePostpone = () => {
    const pending = notifications.find((n) => n.status === "pending");
    if (pending) updateNotificationStatus(pending.id, "postponed");
    setShowConfirmModal(false);
  };

  return (
    <MedicationConfirmModal
      open={showConfirmModal}
      prenom={profile.prenom}
      onConfirm={handleConfirm}
      onPostpone={handlePostpone}
      onClose={() => setShowConfirmModal(false)}
    />
  );
}
