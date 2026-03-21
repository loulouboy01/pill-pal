export interface PriseMoment {
  moment: string;
  quantite: number;
  unite: string;
  heureNotification: string;
}

export type Posologie = PriseMoment[];

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

// Constants
export const MOMENTS_PRISE = [
  "Au réveil",
  "Pendant le petit-déjeuner",
  "Après le petit-déjeuner",
  "Dans la matinée",
  "Avant le déjeuner",
  "Pendant le déjeuner",
  "Après le déjeuner",
  "Dans l'après-midi",
  "Avant le dîner",
  "Pendant le dîner",
  "Après le dîner",
  "Au coucher",
] as const;

export const HEURES_DEFAUT: Record<string, string> = {
  "Au réveil": "07:00",
  "Pendant le petit-déjeuner": "07:30",
  "Après le petit-déjeuner": "08:00",
  "Dans la matinée": "10:00",
  "Avant le déjeuner": "11:45",
  "Pendant le déjeuner": "12:30",
  "Après le déjeuner": "13:00",
  "Dans l'après-midi": "15:00",
  "Avant le dîner": "19:00",
  "Pendant le dîner": "19:30",
  "Après le dîner": "20:00",
  "Au coucher": "22:00",
};

export const UNITES = [
  "comprimé",
  "gélule",
  "mL",
  "goutte",
  "sachet",
  "cuillère-mesure",
] as const;

export function pluralizeUnite(unite: string, quantite: number): string {
  if (quantite <= 1) return unite;
  if (unite === "mL") return "mL";
  return unite + "s";
}

export function createEmptyPrise(): PriseMoment {
  return { moment: "", quantite: 1, unite: "comprimé", heureNotification: "08:00" };
}
