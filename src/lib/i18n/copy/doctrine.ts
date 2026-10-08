import type { ClassificationStatus } from "@/types/afrik";
import type { Language } from "@/types/shared";

interface RefusedSentenceCopy {
  sentence: string;
  reason: string;
}

interface MethodSectionCopy {
  heading: string;
  paragraphs: string[];
  /**
   * Sentences we refuse to write, each published with its reason: a refusal
   * printed without why reads as a taboo, and a reason without the sentence
   * it answers reads as a lecture. Moved here from the About page on
   * 22 September 2026 — what we do not write is method, not a presentation.
   */
  refusals?: RefusedSentenceCopy[];
}

interface ClosingActionsCopy {
  sources: string;
  reportError: string;
  search: string;
}

const fr = {
  title: "Comment nous travaillons",
  intro:
    "EthniAfrica part des noms pour explorer des histoires. Cette page explique comment nous utilisons les sources, présentons les désaccords et corrigeons nos réponses.",
  methodStepLabel: "Méthode",
  method: [
    {
      heading: "Trois questions à distinguer",
      paragraphs: [
        "Comment ce nom est-il employé aujourd’hui ? Où et quand retrouve-t-on des traces de son usage ? Quelles explications sont proposées pour son origine ?",
        "Un témoignage peut documenter un usage. Un document peut attester qu’un nom était écrit à une certaine date. Expliquer son origine demande une enquête distincte. Nous précisons à quelle question chaque élément répond.",
      ],
    },
    {
      heading: "Respecter les personnes, examiner les affirmations",
      paragraphs: [
        "Nous documentons les façons dont les personnes se nomment et celles dont elles sont nommées. Ces usages peuvent varier au sein d’une même population.",
        "Un nom partagé ne suffit pas à établir une origine commune, une parenté ou une identité unique. Un nom de famille ne permet pas, à lui seul, de déterminer l’histoire personnelle de quelqu’un.",
      ],
    },
    {
      heading: "Ce qu’une source permet de dire",
      paragraphs: [
        "Nous indiquons l’auteur ou l’institution, le document et sa date lorsqu’ils sont connus. Nous cherchons à relier chaque affirmation importante à la source qui la soutient.",
        "La provenance d’une source et la solidité d’une affirmation sont deux questions distinctes. Une source peut être utile pour un usage, sans établir une origine. Un document peut reprendre une information sans la vérifier.",
      ],
    },
    {
      heading: "Les traditions orales et leur contexte",
      paragraphs: [
        "Un récit transmis oralement est présenté avec son contexte : qui le transmet, où et quand il a été recueilli, et quelles variantes sont connues, lorsque ces informations sont disponibles.",
        "Nous cherchons à travailler avec les personnes qui portent ces traditions. Nous ne publions un témoignage confié au projet qu’avec un accord sur son utilisation et son attribution.",
        "Un récit absent des archives consultées n’est pas pour autant inexistant. Un récit transmis et une affirmation chronologique peuvent demander des lectures et des vérifications différentes.",
      ],
    },
    {
      heading: "Des sources inégalement accessibles",
      paragraphs: [
        "Les sources les plus faciles à retrouver ne représentent pas nécessairement toutes les voix. Nous précisons lorsque notre documentation repose surtout sur des regards extérieurs et recherchons les récits locaux disponibles.",
        "Ce que nous ne documentons pas encore décrit une limite de notre travail, pas une absence d’histoire.",
      ],
    },
    {
      heading: "Montrer ce qui est établi et ce qui reste discuté",
      paragraphs: [
        "Nous distinguons les faits étayés, les explications attribuées à leurs auteurs et les questions non résolues. Lorsqu’il existe plusieurs hypothèses, nous expliquons sur quoi elles reposent et quelles limites sont connues.",
        "Présenter un désaccord n’oblige pas à donner la même solidité à toutes les explications. Si les sources ne permettent pas de conclure, nous le disons.",
      ],
    },
    {
      heading: "Une trace n’est pas toujours un commencement",
      paragraphs: [
        "La plus ancienne trace que nous avons retrouvée atteste un usage à cette date. Elle ne prouve pas que le nom a été créé ce jour-là, ni qu’il n’était pas employé auparavant à l’oral ou dans un autre document.",
      ],
    },
    {
      heading: "Expliquer sans classer les populations",
      paragraphs: [
        "Nous ne déduisons pas de l’histoire d’un nom qu’une population serait plus authentique, plus légitime ou supérieure à une autre. Nous évitons de confondre peuple, langue, métier, territoire et catégorie administrative.",
        "Nous nommons les acteurs historiques lorsque leur rôle est documenté. Nous n’attribuons pas ce rôle à l’ensemble d’une population actuelle.",
      ],
    },
    {
      heading: "Quatre phrases que nous n’écrivons pas",
      paragraphs: [],
      refusals: [
        {
          sentence: "« Avant, on vivait en accord avec le continent. »",
          reason:
            "Un âge d’or n’a pas besoin d’être vrai pour être attaquable : l’Afrique d’avant Berlin avait aussi des empires, des conquêtes, des traites internes. La force de l’argument vient de sa durée et de son échelle, pas de la douceur du passé.",
        },
        {
          sentence: "« Les frontières sont arbitraires. »",
          reason:
            "À demi faux : certaines suivent des fleuves. Elles ont surtout été tracées sans référence à qui habitait là, et nous le montrons peuple par peuple.",
        },
        {
          sentence: "« Renouer avec le passé. »",
          reason:
            "Renouer suppose la rupture consommée — or ces peuples sont comptés en 2025 et présents en France. Il ne s’agit pas de renouer, mais de reconnaître ce qui n’a jamais cessé : c’est plus vrai, et moins triste.",
        },
        {
          sentence: "« Avant les frontières, les peuples étaient unis. »",
          reason:
            "Des parentés de langue et de culture ont parfois traversé des ruptures plus anciennes que la carte coloniale — une scission, une migration, une querelle de succession. La frontière n’a pas toujours créé la séparation : elle l’a souvent verrouillée.",
        },
      ],
    },
    {
      heading: "Une présentation à la mesure des sources",
      paragraphs: [
        "Un titre pose une question que le contenu examine réellement. Une formule interrogative ne transforme pas une affirmation fragile en fait établi.",
        "Les images sont accompagnées de leur provenance et d’une légende qui précise ce qu’elles montrent. Une illustration ne constitue pas, à elle seule, la preuve d’une affirmation historique.",
      ],
    },
    {
      heading: "Corriger et garder une trace",
      paragraphs: [
        "Vous pouvez signaler une erreur ou proposer une source. Nous examinons le passage concerné et les éléments transmis avant de modifier une réponse.",
      ],
    },
    {
      heading: "Un projet en construction",
      paragraphs: [
        "Notre projet ne couvre pas toutes les populations, tous les noms ni toutes les sources. Les sujets mis en avant répondent à des questions de lecteurs et à la documentation disponible.",
        "Notre souhait de contribuer à la compréhension entre les populations est une conviction. Nous le distinguons des conclusions que les sources permettent d’établir.",
      ],
    },
  ] satisfies MethodSectionCopy[],
  classificationSection: {
    heading: "Comprendre nos indications",
    intro:
      "Certaines pages indiquent si une classification fait l’objet d’un large accord, reste discutée, porte la trace d’une histoire coloniale ou repose sur une reconstruction. Ces indications décrivent la classification présentée, pas la valeur ni la légitimité des personnes concernées.",
  },
  stepLabel: "Statut éditorial",
  descriptions: {
    consensual:
      "Une classification est dite consensuelle lorsqu'elle fait l'objet d'un large accord dans la littérature scientifique contemporaine (linguistique historique, anthropologie, archéologie). Les sources primaires et secondaires convergent et le débat académique sur le rattachement est clos ou marginal.",
    contested:
      "Une classification est contestée lorsqu'elle fait l'objet de débats actifs entre chercheurs : sous-classification interne discutée, frontières floues avec une famille voisine, hypothèses concurrentes documentées. Nous conservons la classification courante tout en signalant la controverse.",
    "colonial-legacy":
      "Une classification d'héritage colonial est une catégorie produite (ou figée) durant la période coloniale, généralement par des administrateurs, des missionnaires ou des linguistes au service de l'administration. Nous conservons ces catégories pour respecter la traçabilité historique, mais nous expliquons pourquoi elles sont problématiques et privilégions les auto-appellations.",
    reconstructive:
      "Une classification reconstructive est une catégorisation établie à partir de sources fragmentaires (traditions orales, archéologie, génétique, glottochronologie). Elle reste provisoire, sujette à révision à mesure que de nouvelles données émergent, et explicitement présentée comme une reconstruction.",
  } satisfies Record<ClassificationStatus, string>,
  closingActions: {
    sources: "Consulter les sources",
    reportError: "Signaler une erreur",
    search: "Chercher un nom",
  } satisfies ClosingActionsCopy,
  article: {
    sectionName: "Doctrine éditoriale",
    changelog: "Voir l'historique des modifications",
    fallback: "",
  },
};

type DoctrineCopy = typeof fr;

// @req REQ-141
export const doctrineCopy: Record<Language, DoctrineCopy> = { fr };
