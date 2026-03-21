import { useState } from "react";
import { User, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ProfilePanel } from "@/components/ProfilePanel";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useProfileNotification } from "@/contexts/ProfileNotificationContext";

type PanelType = "profile" | "notifications" | "settings" | null;

const icons = [
  { id: "profile" as const, Icon: User, label: "Profil" },
  { id: "notifications" as const, Icon: Bell, label: "Notifications" },
  { id: "settings" as const, Icon: Settings, label: "Réglages" },
];

export function RightSidebar() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const { notifications } = useProfileNotification();
  const pendingCount = notifications.filter((n) => n.status === "pending").length;

  const handleClick = (panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <>
      {/* Icon strip */}
      <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
        <div className="flex flex-col gap-1 rounded-l-2xl border border-r-0 border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md">
          {icons.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => handleClick(id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                activePanel === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={label}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              {id === "notifications" && pendingCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sheet panel */}
      <Sheet open={activePanel !== null} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-[340px] overflow-y-auto sm:w-[380px]">
          {activePanel === "profile" && <ProfilePanel />}
          {activePanel === "notifications" && <NotificationsPanel />}
          {activePanel === "settings" && <SettingsPanel />}
        </SheetContent>
      </Sheet>
    </>
  );
}
