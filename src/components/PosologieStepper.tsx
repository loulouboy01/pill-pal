import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PosologieStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function PosologieStepper({ label, value, onChange }: PosologieStepperProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-6 text-center text-base font-semibold tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
