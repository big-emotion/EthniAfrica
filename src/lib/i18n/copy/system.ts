import type { Language } from "@/types/shared";

const fr = {
  loadingRequestedPage: "Chargement de la page demandée",
  didYouKnow: "Saviez-vous que",
  year: "Année",
  didYouKnowEntity: {
    people: "Peuple",
    country: "Pays",
    family: "Famille linguistique",
  },
  sourceTier: {
    official: "Source officielle",
    referenced: "Source référencée",
    unverified: "Source non vérifiée",
  },
};

type SystemCopy = typeof fr;

// @req REQ-145
export const systemCopy: Record<Language, SystemCopy> = { fr };
