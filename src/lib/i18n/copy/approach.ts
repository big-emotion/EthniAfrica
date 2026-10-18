import type { Language } from "@/types/shared";

export interface ApproachCopy {
  title: string;
  signature: string;
  intro: string;
  sections: { title: string; body: string }[];
  kouassiLink: string;
  yaoLink: string;
  nameLinksLabel: string;
  positionTitle: string;
  position: string[];
  sources: Record<
    string,
    {
      title: string;
      hrefLabels?: string[];
      italicSegments?: string[];
      type: string;
    }
  >;
  sourcesTitle: string;
  sourcesLabel: string;
  sourcesPreview: string;
  moreSources: string;
  fewerSources: string;
  closeLabel: string;
  close: { search: string; method: string; reportError: string };
}

// @req REQ-132
export const approachCopy: Record<Language, ApproachCopy> = {
  fr: {
    title: "Notre démarche",
    signature:
      "Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes.",
    intro:
      "Cette phrase termine chacune de nos vidéos et chacun de nos carrousels. Cette page explique d’où elle vient et ce qu’elle veut dire.",
    sections: [
      {
        title: "L’Afrique n’est pas un seul bloc",
        body: "L’Afrique est d’abord un continent immense : elle couvre environ 30 millions de kilomètres carrés. Elle mesure environ 8 000 kilomètres du nord au sud et 7 400 kilomètres d’ouest en est. Les États-Unis, la Chine et l’Inde réunis y tiendraient, et il resterait de la place. Le continent compte 54 États membres des Nations unies, et l’Union africaine réunit 55 membres. Plus d’un milliard et demi de personnes y vivent. On y parle plus de 2 100 langues, soit près d’un tiers des langues parlées dans le monde.",
      },
      {
        title: "Chaque peuple a son nom",
        body: "Chaque peuple a son nom, sa langue, son histoire et sa culture. Beaucoup de peuples sont pourtant connus sous un nom qu’ils ne se donnaient pas : un nom venu d’un voisin, d’un commerçant, d’un administrateur ou d’un savant. Le mot « Afrique » lui-même vient du latin. Son origine reste discutée : il viendrait d’un peuple appelé Afri, près de Carthage, ou d’un mot latin ou grec. Ce n’est qu’une des explications proposées.",
      },
      {
        title: "Tous les noms ne sont pas venus de l’extérieur",
        body: "Kouassi et Yao, par exemple, sont des noms que les Baoulé et les Agni de Côte d’Ivoire donnent à un garçon selon son jour de naissance. Au Ghana, en twi, on les écrit Kwasi et Yaw. En 1964, une loi ivoirienne a obligé chaque personne à porter un nom de famille, transmis par le père. Nous pensons que c’est ainsi que des noms de jour comme Kouassi et Yao sont devenus des noms de famille. La loi ne les cite pas, et elle a été remplacée en 2020.",
      },
      {
        title: "Décoloniser leur emploi",
        body: "Un nom n’a pas seulement une origine. Il a aussi un emploi, et cet emploi peut changer. Certains noms ont déjà été repris par les peuples qu’ils désignent, ou remplacés. D’autres gardent un emploi hérité de l’époque coloniale. D’autres sont péjoratifs, ou racialisants, c’est-à-dire qu’ils classent les personnes par race, sans venir de la colonisation. D’autres encore sont devenus un enjeu politique. Pour chaque nom et chaque mot, nous montrons dans quel cas il se trouve, avec ses sources. Nous ne reprochons à personne d’employer aujourd’hui un nom venu d’ailleurs.",
      },
    ],
    kouassiLink: "Le nom Kouassi",
    yaoLink: "Le nom Yao",
    nameLinksLabel: "Noms cités",
    positionTitle: "Notre position",
    position: [
      "Notre travail montre cette diversité, nom après nom. Il commence par l’histoire : comprendre d’où vient chaque nom, qui l’a donné et quand. Cela permet d’apprendre à nous nommer comme les peuples se nomment eux-mêmes. Cela permet aussi de voir ce que certains noms d’aujourd’hui gardent de l’époque coloniale.",
      "Nous pensons aussi que l’Afrique a beaucoup à gagner à être unie dans le monde d’aujourd’hui. C’est une position d’EthniAfrica, pas un fait établi par une source. Connaître la diversité des peuples n’empêche pas de choisir l’union.",
    ],
    sources: {
      "britannica-africa": {
        title: "Encyclopædia Britannica, « Africa »",
        italicSegments: ["Encyclopædia Britannica"],
        type: "Encyclopédie",
      },
      "un-demographic-yearbook-2023": {
        title: "Nations unies, Demographic Yearbook 2023",
        hrefLabels: [
          "Nations unies, Demographic Yearbook 2023, tableau 1",
          "tableau 3",
        ],
        italicSegments: ["Demographic Yearbook 2023"],
        type: "Statistiques officielles",
      },
      "un-regional-groups": {
        title: "Nations unies, groupes régionaux",
        type: "Site officiel",
      },
      "african-union-member-states": {
        title: "Union africaine, États membres",
        type: "Site officiel",
      },
      "un-world-population-prospects-2024": {
        title: "Nations unies, World Population Prospects 2024",
        italicSegments: ["World Population Prospects 2024"],
        type: "Statistiques officielles",
      },
      "ethnologue-africa": {
        title: "Ethnologue",
        hrefLabels: [
          "Ethnologue, région Afrique",
          "How many languages are there in the world?",
        ],
        type: "Ouvrage de référence linguistique",
      },
      "kotula-afri": {
        title: "T. Kotula, « Afri », Encyclopédie berbère",
        italicSegments: ["Encyclopédie berbère"],
        type: "Encyclopédie",
      },
      "ivorian-name-laws": {
        title:
          "Loi ivoirienne n° 64-373 du 7 octobre 1964 et loi n° 2020-490 du 29 mai 2020",
        hrefLabels: [
          "Loi ivoirienne n° 64-373 du 7 octobre 1964",
          "loi n° 2020-490 du 29 mai 2020",
        ],
        type: "Textes de loi",
      },
      "barre-mettre-son-nom": {
        title: "L. Barré, « Mettre son nom », Genèses, 2018",
        italicSegments: ["Genèses"],
        type: "Article",
      },
      "thiero-meman-patronymic-name": {
        title:
          "A. Thiero-Meman, Le nom patronymique en République de Côte d’Ivoire, 1999",
        italicSegments: ["Le nom patronymique en République de Côte d’Ivoire"],
        type: "Thèse",
      },
    },
    sourcesTitle: "Sources",
    sourcesLabel: "La liste",
    sourcesPreview:
      "Encyclopædia Britannica, « Africa » · Nations unies, Demographic Yearbook 2023 · Nations unies, groupes régionaux · +7",
    moreSources: "+ en savoir plus",
    fewerSources: "− replier",
    closeLabel: "Poursuivre",
    close: {
      search: "Chercher un nom",
      method: "Comment nous travaillons",
      reportError: "Signaler une erreur",
    },
  },
};
