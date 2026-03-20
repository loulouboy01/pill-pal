import { useLocation, useNavigate } from "react-router-dom";
import { Pill, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Médicaments", icon: Pill },
  { path: "/consultations", label: "Consultations", icon: Stethoscope },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = tabs.find((t) => {
    if (t.path === "/") {
      return (
        location.pathname === "/" ||
        location.pathname.startsWith("/ajouter") ||
        location.pathname.startsWith("/scanner") ||
        location.pathname.startsWith("/medicament")
      );
    }
    return location.pathname.startsWith(t.path);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive = activeTab?.path === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
