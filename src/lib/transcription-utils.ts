import type { Utterance } from "@/hooks/useTranscription";

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function getUniqueSpeakers(utterances: Utterance[]): string[] {
  return [...new Set(utterances.map((u) => u.speaker))].sort();
}

export function formatTranscript(
  utterances: Utterance[],
  speakerNames?: Record<string, string>
): string {
  return utterances
    .map((u) => {
      const name = speakerNames?.[u.speaker] || `Locuteur ${u.speaker}`;
      return `[${formatTime(u.start)}] ${name} :\n${u.text}`;
    })
    .join("\n\n");
}

export function getSpeakerColor(speaker: string): string {
  const colors: Record<string, string> = {
    A: "hsl(217, 91%, 60%)",
    B: "hsl(160, 84%, 39%)",
    C: "hsl(38, 92%, 50%)",
    D: "hsl(0, 84%, 60%)",
    E: "hsl(258, 90%, 66%)",
    F: "hsl(330, 81%, 60%)",
  };
  return colors[speaker] || "hsl(220, 9%, 46%)";
}
