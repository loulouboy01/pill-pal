import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMedicaments } from "@/lib/medicaments-storage";
import { Medicament, pluralizeUnite } from "@/types/medicament";
import { Pill, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfileNotification } from "@/contexts/ProfileNotificationContext";

interface TodayPrise {
  medicament: Medicament;
  prise: Medicament["posologie"][number];
  confirmed: boolean;
  notificationId?: string;
}

function getTimeEmoji(heure: string): string {
  const h = parseInt(heure.split(":")[0], 10);
  if (h < 10) return "🌅";
  if (h < 14) return "☀️";
  if (h < 18) return "🌇";
  return "🌙";
}

function parseTime(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function Index() {
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const navigate = useNavigate();
  const {
    profile,
    notifications,
    addNotification,
    setShowConfirmModal,
  } = useProfileNotification();

  useEffect(() => {
    setMedicaments(getMedicaments());
  }, []);

  // Build today's prises from all medicaments
  const todayStr = new Date().toDateString();

  const todayPrises = useMemo<TodayPrise[]>(() => {
    const prises: TodayPrise[] = [];
    for (const med of medicaments) {
      for (const prise of med.posologie) {
        if (!prise.moment || !prise.heureNotification) continue;
        // Check if this prise was confirmed today
        const matchingNotif = notifications.find(
          (n) =>
            n.medicament === med.nom &&
            new Date(n.timestamp).toDateString() === todayStr &&
            n.dosage === `${prise.quantite} ${pluralizeUnite(prise.unite, prise.quantite)}` &&
            n.status === "confirmed"
        );
        prises.push({
          medicament: med,
          prise,
          confirmed: !!matchingNotif,
          notificationId: matchingNotif?.id,
        });
      }
    }
    // Sort by time
    prises.sort((a, b) => parseTime(a.prise.heureNotification) - parseTime(b.prise.heureNotification));
    return prises;
  }, [medicaments, notifications, todayStr]);

  const confirmedCount = todayPrises.filter((p) => p.confirmed).length;
  const totalCount = todayPrises.length;
  const progressPercent = totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0;

  // Next reminder: first unconfirmed prise closest to now
  const nextPrise = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const unconfirmed = todayPrises.filter((p) => !p.confirmed);
    if (unconfirmed.length === 0) return null;
    // Find closest to now (prefer future, then past)
    const future = unconfirmed.filter((p) => parseTime(p.prise.heureNotification) >= nowMinutes);
    if (future.length > 0) return future[0];
    return unconfirmed[unconfirmed.length - 1];
  }, [todayPrises]);

  // Slider logic for next reminder card
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const startXRef = useRef(0);
  const trackWidth = 280;
  const thumbSize = 52;
  const maxDrag = trackWidth - thumbSize - 8;

  const handleStart = useCallback((clientX: number) => {
    startXRef.current = clientX;
    setIsDragging(true);
  }, []);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const delta = clientX - startXRef.current;
      setDragX(Math.max(0, Math.min(delta, maxDrag)));
    },
    [isDragging, maxDrag]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > maxDrag * 0.75 && nextPrise) {
      setConfirmed(true);
      setDragX(maxDrag);
      setTimeout(() => {
        // Add notification as pending, then trigger confirm modal
        addNotification({
          timestamp: new Date(),
          status: "pending",
          medicament: nextPrise.medicament.nom,
          dosage: `${nextPrise.prise.quantite} ${pluralizeUnite(nextPrise.prise.unite, nextPrise.prise.quantite)}`,
          forme: nextPrise.medicament.forme,
        });
        setShowConfirmModal(true);
        setDragX(0);
        setConfirmed(false);
      }, 350);
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, maxDrag, nextPrise, addNotification, setShowConfirmModal]);

  const progress = dragX / maxDrag;

  const handlePriseClick = (tp: TodayPrise) => {
    if (tp.confirmed) {
      navigate(`/medicament/${tp.medicament.id}`);
    } else {
      // Trigger confirm flow
      addNotification({
        timestamp: new Date(),
        status: "pending",
        medicament: tp.medicament.nom,
        dosage: `${tp.prise.quantite} ${pluralizeUnite(tp.prise.unite, tp.prise.quantite)}`,
        forme: tp.medicament.forme,
      });
      setShowConfirmModal(true);
    }
  };

  const isEmpty = medicaments.length === 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-2 mx-auto max-w-lg">
        <p className="text-sm font-medium text-primary">Bonjour,</p>
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {profile.prenom || "Utilisateur"}
        </h1>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-32">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center pt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <Pill className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-lg font-semibold text-foreground">
              Aucun médicament enregistré
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Ajoutez vos médicaments dans l'onglet Médicaments pour voir votre tableau de bord quotidien.
            </p>
            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
              <Button
                onClick={() => navigate("/medicaments")}
                className="h-12 rounded-2xl text-sm font-medium"
              >
                <Pill className="mr-2 h-4 w-4" />
                Aller aux médicaments
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 pt-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Médicaments du jour</span>
                <span className="text-sm font-semibold text-primary">
                  {confirmedCount} / {totalCount} pris
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5 rounded-full bg-secondary" />
            </div>

            {/* Next reminder card */}
            <div
              className="rounded-3xl p-5 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(170deg, hsl(195 50% 16%) 0%, hsl(210 45% 12%) 50%, hsl(220 40% 10%) 100%)",
              }}
            >
              {nextPrise ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                    Prochain rappel
                  </p>
                  <p className="text-3xl font-bold text-white leading-none">
                    {nextPrise.prise.heureNotification}
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {nextPrise.medicament.nom}
                    {nextPrise.medicament.dosage ? ` ${nextPrise.medicament.dosage}` : ""}
                  </p>
                  <p className="text-sm text-white/50 mt-0.5">
                    {nextPrise.prise.quantite}{" "}
                    {pluralizeUnite(nextPrise.prise.unite, nextPrise.prise.quantite)} ·{" "}
                    {nextPrise.prise.moment.toLowerCase()}
                  </p>

                  {/* Slider */}
                  <div
                    className="relative mt-5 flex h-14 items-center rounded-2xl px-1 mx-auto"
                    style={{
                      width: trackWidth,
                      background: `linear-gradient(90deg, hsl(150 50% 30% / ${0.3 + progress * 0.5}) 0%, hsl(150 40% 20% / 0.25) 100%)`,
                      border: "1px solid hsl(150 30% 30% / 0.3)",
                    }}
                    onMouseMove={(e) => handleMove(e.clientX)}
                    onMouseUp={handleEnd}
                    onMouseLeave={() => isDragging && handleEnd()}
                    onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                    onTouchEnd={handleEnd}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wide text-white/50 transition-opacity"
                      style={{ opacity: 1 - progress * 1.5, paddingLeft: thumbSize }}
                    >
                      👉 Glisser pour confirmer
                    </span>
                    <div
                      className="relative z-10 flex h-11 w-11 cursor-grab items-center justify-center rounded-xl shadow-lg active:cursor-grabbing"
                      style={{
                        transform: `translateX(${dragX}px)`,
                        transition: isDragging
                          ? "none"
                          : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        background: confirmed
                          ? "hsl(150 60% 40%)"
                          : `hsl(150 ${45 + progress * 20}% ${35 + progress * 15}%)`,
                        boxShadow: `0 4px 20px hsl(150 50% 30% / ${0.3 + progress * 0.3})`,
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleStart(e.clientX);
                      }}
                      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {confirmed ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <polyline points="9 18 15 12 9 6" />
                        )}
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <span className="text-3xl mb-2">✅</span>
                  <p className="text-base font-semibold text-white text-center">
                    Toutes vos prises du jour sont confirmées
                  </p>
                </div>
              )}
            </div>

            {/* Today's medication list */}
            {todayPrises.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Aujourd'hui
                </p>
                <div className="flex flex-col gap-2.5">
                  {todayPrises.map((tp, i) => (
                    <button
                      key={`${tp.medicament.id}-${tp.prise.heureNotification}-${i}`}
                      onClick={() => handlePriseClick(tp)}
                      className="w-full flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-[0_1px_3px_hsl(30_10%_15%/0.06)] transition-all hover:shadow-[0_4px_12px_hsl(30_10%_15%/0.08)] active:scale-[0.98]"
                    >
                      {/* Time emoji */}
                      <span className="text-2xl">{getTimeEmoji(tp.prise.heureNotification)}</span>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {tp.medicament.nom}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {tp.prise.quantite}{" "}
                          {pluralizeUnite(tp.prise.unite, tp.prise.quantite)} ·{" "}
                          {tp.prise.moment.toLowerCase()}
                        </p>
                      </div>

                      {/* Time + status */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-sm font-medium ${
                            tp.confirmed ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {tp.prise.heureNotification}
                        </span>
                        {tp.confirmed ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
