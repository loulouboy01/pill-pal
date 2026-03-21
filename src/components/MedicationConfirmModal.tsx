import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clock } from "lucide-react";

interface Props {
  open: boolean;
  prenom: string;
  onConfirm: () => void;
  onPostpone: () => void;
  onClose: () => void;
}

export function MedicationConfirmModal({ open, prenom, onConfirm, onPostpone, onClose }: Props) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const trackWidth = 260;
  const thumbSize = 56;
  const maxDrag = trackWidth - thumbSize - 8; // padding

  const handleStart = useCallback((clientX: number) => {
    startXRef.current = clientX;
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - startXRef.current;
    setDragX(Math.max(0, Math.min(delta, maxDrag)));
  }, [isDragging, maxDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > maxDrag * 0.75) {
      setConfirmed(true);
      setDragX(maxDrag);
      setTimeout(() => {
        onConfirm();
        setDragX(0);
        setConfirmed(false);
      }, 400);
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, maxDrag, onConfirm]);

  const handleClose = () => {
    setDragX(0);
    setConfirmed(false);
    onClose();
  };

  const progress = dragX / maxDrag;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col items-center justify-center gap-8 border-0 p-6 sm:rounded-none [&>button]:text-white/40 [&>button]:hover:text-white/70"
        style={{
          background: "linear-gradient(170deg, hsl(195 50% 16%) 0%, hsl(210 45% 12%) 50%, hsl(220 40% 10%) 100%)",
          color: "white",
        }}
      >
        {/* Subtitle */}
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
          Il est l'heure de prendre
        </p>

        {/* Pill icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/8 shadow-inner">
          <span className="text-5xl drop-shadow-lg">💊</span>
        </div>

        {/* Medication info */}
        <div className="text-center">
          <h2 className="text-[1.7rem] font-bold leading-tight tracking-tight">Doliprane 1000</h2>
          <p className="mt-2 text-sm text-white/50">1 comprimé · avec le repas</p>
        </div>

        {/* Slide to confirm */}
        <div
          ref={trackRef}
          className="relative mt-4 flex h-16 items-center rounded-2xl px-1"
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
          {/* Label */}
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold tracking-wide text-white/50 transition-opacity"
            style={{ opacity: 1 - progress * 1.5, paddingLeft: thumbSize }}
          >
            Glisser · Je l'ai pris
          </span>

          {/* Thumb */}
          <div
            className="relative z-10 flex h-12 w-12 cursor-grab items-center justify-center rounded-xl shadow-lg transition-shadow active:cursor-grabbing"
            style={{
              transform: `translateX(${dragX}px)`,
              transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              background: confirmed
                ? "hsl(150 60% 40%)"
                : `hsl(150 ${45 + progress * 20}% ${35 + progress * 15}%)`,
              boxShadow: `0 4px 20px hsl(150 50% 30% / ${0.3 + progress * 0.3})`,
            }}
            onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{
                transform: `scale(${confirmed ? 1.2 : 1}) rotate(${confirmed ? 0 : 0}deg)`,
                transition: "transform 0.3s",
              }}
            >
              {confirmed ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <>
                  <polyline points="9 18 15 12 9 6" />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Postpone link */}
        <button
          onClick={() => { setDragX(0); setConfirmed(false); onPostpone(); }}
          className="mt-2 text-sm text-white/35 underline underline-offset-4 transition-colors hover:text-white/60"
        >
          <Clock className="mr-1 inline h-3.5 w-3.5" />
          Rappeler dans 15 minutes
        </button>

        {/* Bottom label */}
        <p className="absolute bottom-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/15">
          Rappel dédié
        </p>
      </DialogContent>
    </Dialog>
  );
}
