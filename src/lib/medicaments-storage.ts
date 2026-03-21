import { Medicament, createEmptyPrise } from "@/types/medicament";

const STORAGE_KEY = "medicaments";

/** Migrate old posologie format {matin,midi,soir,coucher} to new PriseMoment[] */
function migrateMedicament(m: any): Medicament {
  if (m.posologie && !Array.isArray(m.posologie) && typeof m.posologie === "object" && "matin" in m.posologie) {
    const p = m.posologie;
    const prises: Medicament["posologie"] = [];
    if (p.matin > 0) prises.push({ moment: "Pendant le petit-déjeuner", quantite: p.matin, unite: "comprimé", heureNotification: "07:30" });
    if (p.midi > 0) prises.push({ moment: "Pendant le déjeuner", quantite: p.midi, unite: "comprimé", heureNotification: "12:30" });
    if (p.soir > 0) prises.push({ moment: "Pendant le dîner", quantite: p.soir, unite: "comprimé", heureNotification: "19:30" });
    if (p.coucher > 0) prises.push({ moment: "Au coucher", quantite: p.coucher, unite: "comprimé", heureNotification: "22:00" });
    return { ...m, posologie: prises.length > 0 ? prises : [createEmptyPrise()] };
  }
  return m;
}

export function getMedicaments(): Medicament[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data).map(migrateMedicament) : [];
  } catch {
    return [];
  }
}

export function saveMedicament(medicament: Medicament): void {
  const list = getMedicaments();
  list.push(medicament);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function saveMedicaments(medicaments: Medicament[]): void {
  const list = getMedicaments();
  list.push(...medicaments);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function updateMedicament(updated: Medicament): void {
  const list = getMedicaments().map((m) => m.id === updated.id ? updated : m);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function deleteMedicament(id: string): void {
  const list = getMedicaments().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getMedicamentById(id: string): Medicament | undefined {
  return getMedicaments().find((m) => m.id === id);
}
