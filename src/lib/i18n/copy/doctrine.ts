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
        "Un témoignage peut montrer comment un nom est employé. Un document peut prouver que ce nom était écrit à une certaine date. Comprendre son origine demande d’autres recherches. Nous précisons ce que chaque source permet de dire.",
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
        "Connaître l’auteur d’une source ne suffit pas à savoir si une information est exacte. Un texte peut montrer comment un nom est employé sans expliquer son origine. Il peut aussi reprendre une information sans la vérifier.",
      ],
    },
    {
      heading: "Les traditions orales et leur contexte",
      paragraphs: [
        "Un récit transmis oralement est présenté avec son contexte : qui le transmet, où et quand il a été recueilli, et quelles variantes sont connues, lorsque ces informations sont disponibles.",
        "Nous cherchons à travailler avec les personnes qui portent ces traditions. Nous ne publions un témoignage confié au projet qu’avec un accord sur son utilisation et son attribution.",
        "Un récit peut exister sans apparaître dans les archives que nous avons consultées. Pour comprendre ce récit ou vérifier la date d’un événement, nous pouvons avoir besoin de sources différentes.",
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
        "Nous distinguons les faits appuyés par des sources, les explications attribuées à leurs auteurs et les questions non résolues. Lorsqu’il existe plusieurs hypothèses, nous expliquons sur quoi elles reposent et quelles limites sont connues.",
        "Présenter un désaccord n’oblige pas à donner la même solidité à toutes les explications. Si les sources ne permettent pas de conclure, nous le disons.",
      ],
    },
    {
      heading: "Une trace n’est pas toujours un commencement",
      paragraphs: [
        "La plus ancienne trace que nous avons retrouvée montre que le nom était employé à cette date. Elle ne prouve pas que le nom a été créé ce jour-là, ni qu’il n’était pas employé auparavant à l’oral ou dans un autre document.",
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
            "Avant la conférence de Berlin, l’Afrique connaissait aussi des empires, des conquêtes et des commerces d’esclaves. Nous cherchons à raconter cette histoire sans présenter le passé comme une époque où tout le monde vivait en paix.",
        },
        {
          sentence: "« Les frontières sont arbitraires. »",
          reason:
            "Certaines frontières suivent des fleuves ou d’autres repères géographiques. La question est aussi de savoir comment leur tracé a tenu compte des populations qui vivaient sur place. Nous examinons cette question pour chaque cas.",
        },
        {
          sentence: "« Renouer avec le passé. »",
          reason:
            "Cette formule peut laisser croire que ces histoires ont disparu. Les populations et leurs descendants sont toujours présents, en Afrique et dans les diasporas. Leurs histoires continuent et se transmettent.",
        },
        {
          sentence: "« Avant les frontières, les peuples étaient unis. »",
          reason:
            "Des populations proches par la langue ou la culture ont parfois été séparées avant la colonisation, à la suite de migrations, de divisions ou de conflits de succession. Certaines frontières ont renforcé des séparations déjà présentes.",
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
      "Certaines pages précisent comment les chercheurs regroupent les peuples ou les langues. Nous indiquons si ce regroupement est largement accepté, discuté, hérité de la colonisation ou proposé à partir d’informations incomplètes. Ces indications portent sur le classement, pas sur la valeur des personnes concernées.",
  },
  stepLabel: "À propos de ce classement",
  descriptions: {
    consensual:
      "Ce regroupement fait l’objet d’un large accord dans les travaux de recherche actuels. Les sources consultées proposent des rapprochements semblables et peu de chercheurs les contestent.",
    contested:
      "Les chercheurs proposent plusieurs façons de regrouper ces peuples ou ces langues. Ils peuvent notamment ne pas être d’accord sur les liens avec un groupe voisin. Nous présentons le classement courant et expliquons les désaccords.",
    "colonial-legacy":
      "Ce regroupement a été créé ou rendu officiel pendant la colonisation, souvent par une administration, des missionnaires ou des chercheurs à son service. Nous le conservons pour permettre de retrouver les sources anciennes. Nous expliquons les questions qu’il pose et privilégions les noms employés par les personnes concernées.",
    reconstructive:
      "Ce regroupement est une proposition fondée sur des informations incomplètes. Elles peuvent venir de récits oraux, de fouilles, d’études génétiques ou de comparaisons entre les langues. Il peut changer avec de nouvelles recherches.",
  } satisfies Record<ClassificationStatus, string>,
  closingActions: {
    sources: "Consulter les sources",
    reportError: "Signaler une erreur",
    search: "Chercher un nom",
  } satisfies ClosingActionsCopy,
  article: {
    sectionName: "Notre méthode",
    changelog: "Voir l'historique des modifications",
    fallback: "",
  },
};

type DoctrineCopy = typeof fr;

// @req REQ-141
export const doctrineCopy: Record<Language, DoctrineCopy> = { fr };
