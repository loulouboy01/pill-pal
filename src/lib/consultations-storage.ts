import { Consultation } from "@/types/consultation";

const STORAGE_KEY = "consultations";

export function getConsultations(): Consultation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const list: Consultation[] = data ? JSON.parse(data) : [];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

export function saveConsultation(consultation: Consultation): void {
  const list = getConsultations();
  list.push(consultation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function updateConsultation(updated: Consultation): void {
  const list = getConsultations().map((c) =>
    c.id === updated.id ? updated : c
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function deleteConsultation(id: string): void {
  const list = getConsultations().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getConsultationById(id: string): Consultation | undefined {
  return getConsultations().find((c) => c.id === id);
}
