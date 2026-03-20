import { Medicament } from "@/types/medicament";

const STORAGE_KEY = "medicaments";

export function getMedicaments(): Medicament[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
  const list = getMedicaments().map((m) =>
    m.id === updated.id ? updated : m
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function deleteMedicament(id: string): void {
  const list = getMedicaments().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getMedicamentById(id: string): Medicament | undefined {
  return getMedicaments().find((m) => m.id === id);
}
