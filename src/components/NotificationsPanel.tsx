import { useProfileNotification, NotificationEntry } from "@/contexts/ProfileNotificationContext";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Bell, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function timeLabel(date: Date): string {
  const now = new Date();
  const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "À L'INSTANT";
  if (diffMin < 60) return `IL Y A ${diffMin} MIN`;
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function NotificationCard({ entry, onConfirm, onPostpone }: { entry: NotificationEntry; onConfirm: () => void; onPostpone: () => void }) {
  const borderColor = entry.status === "confirmed" ? "border-l-green-500" : entry.status === "postponed" ? "border-l-orange-400" : "border-l-red-400";
  const statusLabel = entry.status === "confirmed" ? "PRISE CONFIRMÉE" : entry.status === "postponed" ? "REPORTÉ" : "RAPPEL MANQUÉ";

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 border-l-4 animate-fade-in", borderColor)}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {statusLabel} · {timeLabel(entry.timestamp)}
      </p>
      <p className="mt-1 text-sm font-bold text-foreground">💊 Il est l'heure{entry.medicament ? "" : ""}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {entry.medicament} · {entry.forme}
      </p>

      {entry.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="h-8 rounded-lg bg-green-600 text-white hover:bg-green-700" onClick={onConfirm}>
            <Check className="mr-1 h-3.5 w-3.5" /> Je l'ai pris
          </Button>
          <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={onPostpone}>
            <Clock className="mr-1 h-3.5 w-3.5" /> Reporter 15 min
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationsPanel() {
  const { notifications, updateNotificationStatus } = useProfileNotification();

  return (
    <div className="flex flex-col gap-4 p-1">
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>Historique de vos rappels</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Aucune notification pour le moment</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Utilisez « Simuler une notification » dans les réglages</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              entry={n}
              onConfirm={() => updateNotificationStatus(n.id, "confirmed")}
              onPostpone={() => updateNotificationStatus(n.id, "postponed")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
