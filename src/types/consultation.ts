export interface ConsultationTraitement {
  nom: string;
  posologie: string;
  duree: string;
}

export interface CompteRendu {
  resume: string;
  medecin: string;
  motifConsultation: string;
  symptomes: string[];
  diagnostic: string;
  traitements: ConsultationTraitement[];
  examensPrescrits: string[];
  prochainRdv: string;
  notesComplementaires: string;
}

export type ConsultationStatut = "en_cours" | "transcrit" | "analyse" | "termine";

export interface Consultation {
  id: string;
  date: string;
  transcription: string;
  compteRendu: CompteRendu | null;
  statut: ConsultationStatut;
}
