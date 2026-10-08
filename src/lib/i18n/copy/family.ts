import type { Language } from "@/types/shared";

const fr = {
  title: {
    eyebrow: "Famille linguistique",
    reconstructedArea: "une aire à reconstruire",
    sharedSelfAndEnglish: (name: string) =>
      `Auto-appellation et nom anglais : ${name}. Le français seul francise.`,
    distinctNames: (selfName: string, englishName: string) =>
      `Auto-appellation : ${selfName}. Nom anglais : ${englishName}.`,
    notRecorded: "non renseigné",
  },
  targetFacts: {
    description: (id: string, family: string) =>
      `${id} · part de l'empreinte ${family}`,
    present: (family: string) => `Peuples ${family} présents`,
    total: (count: number) => `Sur les ${count} de la famille`,
    widespread: "Parmi les plus répandus",
    derived: "Dérivé — la famille ne le donne pas",
    readFull: "Lire la page complète",
    readFullFor: (family: string) => `Lire la page complète de ${family}`,
  },
  parchment: {
    undeclaredDistribution: "Distribution non déclarée",
    figures: "La famille en chiffres",
    languages: "Langues",
    speakers: "Locuteurs",
    branches: "Branches",
    distribution: "Distribution",
    empty: "vide",
    footprint: "L'empreinte, et d'où elle vient",
    nameOrigin: "D'où vient le nom de la famille",
    attachedPeoples: "Peuples rattachés",
    sources: "Sources",
    countryCount: (count: number) => `${count} pays`,
    attachedNote: (shown: number, total: number) =>
      `${shown} des ${total} peuples rattachés, classés par étendue`,
    omitted: (count: number) =>
      `${count} autres peuples rattachés ne sont pas listés ici.`,
    missingDistribution:
      "Cette page ne donne ni ses branches ni les pays où elle est présente. L'aire dessinée plus haut est donc reconstruite à partir des peuples rattachés à la famille, et c'est écrit.",
    footprintMemberPeoples: (peopleCount: number, countryCount: number) =>
      `L'aire dessinée plus haut n'est pas lue dans la page de la famille : elle est calculée. Chaque peuple donne sa famille de langues et les pays où il se trouve aujourd'hui ; l'union de ces pays sur les ${peopleCount} peuples rattachés à cette famille donne les ${countryCount} pays teintés, l'intensité suivant le nombre de peuples présents.`,
    footprintDeclaredPeoples: (peopleCount: number, countryCount: number) =>
      `L'aire dessinée plus haut n'est pas lue dans la page de la famille : elle est calculée. Aucun peuple n'est rattaché directement à cette famille : ils relèvent de ses sous-familles. Plutôt que d'additionner celles-ci — ce qui ferait affirmer à la carte une unité que la page elle-même conteste — l'aire suit la seule liste que la page assume, les peuples que la page nomme : l'union des pays où ces ${peopleCount} peuples se trouvent aujourd'hui donne les ${countryCount} pays teintés. La carte ne dit donc rien de plus que le texte.`,
    borderNote:
      "Le bord reste tireté partout : une famille linguistique n'a pas de frontière, et cet agrégat encore moins que le reste.",
    declaredArea: "Aire donnée ici :",
  },
  decolonial: {
    title: "Appellations et décolonisation",
    historicalDesignations: "Appellations historiques",
    frenchName: "Nom français",
    familyLink: "Lien avec la famille",
    problematic: "Pourquoi ce terme est problématique",
    selfDesignation: "Auto-appellation",
    contemporaryUsage: "Usage contemporain",
  },
  linguistic: {
    title: "Caractéristiques linguistiques",
    typology: "Typologie",
    phonology: "Traits phonologiques",
    neighbours: "Relations avec les voisins",
    innovations: "Innovations majeures",
  },
  history: {
    title: "Histoire et origines",
    probableOrigin: "Origine probable",
    emergencePeriod: "Période d'émergence",
    diffusion: "Diffusion",
    historicalBreaks: "Ruptures historiques",
    contactZones: "Zones de contact",
    majorEvents: "Événements majeurs",
    report: "Signaler cette section",
  },
  atlas: {
    missingFootprint: (name: string) =>
      `Empreinte géographique non disponible pour ${name}`,
  },
};

type FamilyCopy = typeof fr;

// @req REQ-145
export const familyCopy: Record<Language, FamilyCopy> = { fr };
