export interface Posologie {
  matin: number;
  midi: number;
  soir: number;
  coucher: number;
}

export interface Medicament {
  id: string;
  nom: string;
  dosage: string;
  forme: string;
  codeCIS: string | null;
  posologie: Posologie;
  dureeTraitement: string;
  dateAjout: string;
}

export interface MedicamentSearchResult {
  cis: string;
  denomination: string;
  forme: string;
  voie: string;
  statut_amm: string;
}
