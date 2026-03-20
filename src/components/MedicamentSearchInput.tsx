import { useState, useEffect, useRef } from "react";
import { searchMedicament } from "@/lib/api";
import { MedicamentSearchResult } from "@/types/medicament";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface MedicamentSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: MedicamentSearchResult) => void;
}

export function MedicamentSearchInput({ value, onChange, onSelect }: MedicamentSearchInputProps) {
  const [results, setResults] = useState<MedicamentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchMedicament(value);
        setResults(data);
        setShowResults(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Ex: Doliprane, Amoxicilline..."
          className="rounded-xl bg-card pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {showResults && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-popover shadow-lg">
          {results.map((r) => (
            <button
              key={r.cis}
              type="button"
              className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-accent active:scale-[0.99]"
              onClick={() => {
                onSelect(r);
                setShowResults(false);
              }}
            >
              <p className="font-medium text-foreground leading-snug">{r.denomination}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.forme} · {r.voie}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
