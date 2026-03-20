import { supabase } from "@/integrations/supabase/client";
import { MedicamentSearchResult } from "@/types/medicament";

export async function searchMedicament(query: string): Promise<MedicamentSearchResult[]> {
  const { data, error } = await supabase.functions.invoke("search-medicament", {
    body: { q: query },
  });
  if (error) throw new Error("Erreur lors de la recherche de médicaments");
  return data?.results ?? [];
}

export async function analyzePrescription(imageBase64: string): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke("analyze-prescription", {
    body: { image: imageBase64 },
  });
  if (error) throw new Error("Erreur lors de l'analyse de l'ordonnance");
  return data?.medicaments ?? [];
}

export interface NoticeInfo {
  contreIndications: string;
  posologie: string;
  delaiMinimumEntrePrises: string;
  modeAdministration: string;
  effetsIndesirables: string;
  dureeMaxTraitement: string;
  momentPrise: string;
}

export async function getNotice(cis: string): Promise<NoticeInfo> {
  const { data, error } = await supabase.functions.invoke("get-notice", {
    body: { cis },
  });
  if (error) throw new Error("Erreur lors de la récupération de la notice");
  return data?.notice;
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/transcribe-audio`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: formData,
    }
  );

  if (!response.ok) throw new Error("Erreur lors de la transcription");
  const data = await response.json();
  return data?.text ?? "";
}

export async function generateConsultationReport(transcription: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("generate-consultation-report", {
    body: { transcription },
  });
  if (error) throw new Error("Erreur lors de la génération du compte-rendu");
  return data?.compteRendu;
}
