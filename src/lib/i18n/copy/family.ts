import type { Language } from "@/types/shared";

/** « le seul pays où » or « les 13 pays où »: some footprints hold one country. */
const countriesWhere = (count: number) =>
  count === 1 ? "le seul pays où" : `les ${count} pays où`;

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
    speakers: "Personnes qui parlent ces langues",
    branches: "Branches",
    distribution: "Distribution",
    empty: "vide",
    /**
     * The classification status said in a sentence above the figures, not
     * worn as a badge (brief 4, boards family-*.dc.html). Only the status the
     * boards draw has a sentence; the others wait for theirs.
     */
    classification: {
      "colonial-legacy":
        "Ce regroupement de langues est une catégorie héritée de la période coloniale. Nous la conservons et nous expliquons pourquoi plus bas, dans « Appellations et décolonisation ».",
    } as Partial<Record<string, string>>,
    unsourcedFigure:
      "Une estimation que la fiche ne rattache pas encore à une source",
    /** The closing band's line on a declared distribution (brief 4). */
    distributionOnly: (countries: readonly string[]) => {
      const count =
        ["", "un seul", "deux", "trois", "quatre", "cinq"][countries.length] ??
        String(countries.length);
      const list =
        countries.length < 2
          ? (countries[0] ?? "")
          : `${countries.slice(0, -1).join(", ")} et ${countries[countries.length - 1]}`;
      return `Pays par pays, le nombre de personnes qui parlent ces langues n’est donné que pour ${count} pays : ${list}.`;
    },
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
    // The fill grows more opaque with each people, which reads darker on a
    // light page and brighter on a dark one, hence « marquée ».
    footprintMemberPeoples: (peopleCount: number, countryCount: number) =>
      `La zone colorée sur la carte plus haut ne vient pas de la page de la famille : nous l'avons construite à partir des ${peopleCount} peuples rattachés à cette famille de langues. Elle couvre ${countriesWhere(countryCount)} vivent aujourd'hui ces peuples. Plus un pays compte de ces peuples, plus sa couleur est marquée.`,
    footprintDeclaredPeoples: (peopleCount: number, countryCount: number) =>
      `La zone colorée sur la carte plus haut ne vient pas de la page de la famille : nous l'avons construite à partir des peuples que cette page nomme. Aucun peuple n'est rattaché directement à cette famille : chacun appartient à l'une de ses sous-familles. Additionner ses sous-familles ferait croire qu'elle forme un ensemble uni, ce que la page elle-même conteste. La carte couvre donc seulement ${countriesWhere(countryCount)} vivent aujourd'hui les ${peopleCount} peuples nommés par la page : elle ne dit rien de plus que le texte.`,
    borderNote:
      "Le bord de cette zone est dessiné en tirets, parce qu'une famille de langues n'a pas de frontière.",
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
