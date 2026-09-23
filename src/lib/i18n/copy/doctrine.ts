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

const en = {
  title: "How we work",
  intro:
    "EthniAfrica starts from names to explore histories. This page explains how we use sources, present disagreements and correct our answers.",
  methodStepLabel: "Method",
  method: [
    {
      heading: "Three questions to distinguish",
      paragraphs: [
        "How is this name used today? Where and when do we find traces of its use? What explanations are proposed for its origin?",
        "A testimony can document a usage. A document can attest that a name was written down by a certain date. Explaining its origin calls for a separate inquiry. We specify which question each element answers.",
      ],
    },
    {
      heading: "Respecting people, examining claims",
      paragraphs: [
        "We document the ways people name themselves and the ways they are named. These usages can vary within a single population.",
        "A shared name is not enough to establish a common origin, a kinship or a single identity. A family name alone cannot determine someone's personal history.",
      ],
    },
    {
      heading: "What a source lets us say",
      paragraphs: [
        "We give the author or institution, the document and its date when they are known. We try to link every important claim to the source that supports it.",
        "A source's provenance and the strength of a claim are two separate questions. A source can be useful for a usage without establishing an origin. A document can repeat information without verifying it.",
      ],
    },
    {
      heading: "Oral traditions and their context",
      paragraphs: [
        "An orally transmitted account is presented with its context: who transmits it, where and when it was collected, and what variants are known, when that information is available.",
        "We seek to work with the people who carry these traditions. We publish a testimony entrusted to the project only with an agreement on its use and attribution.",
        "An account absent from the archives we consulted is not thereby non-existent. A transmitted account and a chronological claim can call for different readings and different checks.",
      ],
    },
    {
      heading: "Unevenly accessible sources",
      paragraphs: [
        "The sources easiest to find do not necessarily represent every voice. We state when our documentation rests mainly on outside perspectives, and we look for the local accounts available.",
        "What we do not yet document describes a limit of our work, not an absence of history.",
      ],
    },
    {
      heading: "Showing what is established and what remains debated",
      paragraphs: [
        "We distinguish well-supported facts, explanations attributed to their authors, and unresolved questions. Where several hypotheses exist, we explain what they rest on and what limits are known.",
        "Presenting a disagreement does not require giving every explanation the same weight. When the sources do not allow a conclusion, we say so.",
      ],
    },
    {
      heading: "A trace is not always a beginning",
      paragraphs: [
        "The oldest trace we have found attests a usage on that date. It does not prove the name was created that day, nor that it was not used earlier, orally or in another document.",
      ],
    },
    {
      heading: "Explaining without ranking populations",
      paragraphs: [
        "We do not infer from a name's history that one population would be more authentic, more legitimate or superior to another. We avoid conflating people, language, occupation, territory and administrative category.",
        "We name historical actors when their role is documented. We do not attribute that role to an entire population today.",
      ],
    },
    {
      heading: "Four sentences we do not write",
      paragraphs: [],
      refusals: [
        {
          sentence: "“Before, people lived in harmony with the continent.”",
          reason:
            "A golden age does not need to be true to be attacked: Africa before Berlin also had empires, conquests and internal slave trades. The argument’s strength comes from duration and scale, not from how gentle the past was.",
        },
        {
          sentence: "“The borders are arbitrary.”",
          reason:
            "Half false: some follow rivers. They were mostly drawn without reference to who lived there, and we show it people by people.",
        },
        {
          sentence: "“Reconnecting with the past.”",
          reason:
            "Reconnecting assumes the break is complete — yet these peoples are counted in 2025 and live in France. This is not about reconnecting, but recognising what never stopped.",
        },
        {
          sentence: "“Before the borders, peoples were united.”",
          reason:
            "Kinship of language and culture sometimes crossed ruptures older than the colonial map — a split, a migration, a disputed succession. The border did not always create the separation: it often locked one in.",
        },
      ],
    },
    {
      heading: "A presentation proportionate to the sources",
      paragraphs: [
        "A title asks a question the content actually examines. A question mark does not turn a fragile claim into an established fact.",
        "Images carry their provenance and a caption stating what they show. An illustration alone is not proof of a historical claim.",
      ],
    },
    {
      heading: "Correcting, and keeping a record",
      paragraphs: [
        "You can report an error or propose a source. We review the passage concerned and the evidence submitted before changing an answer.",
      ],
    },
    {
      heading: "A project under construction",
      paragraphs: [
        "Our project does not cover every population, every name or every source. The subjects we feature answer readers' questions and reflect the documentation available.",
        "Our wish to help populations understand each other better is a conviction. We keep it distinct from the conclusions the sources actually allow us to draw.",
      ],
    },
  ] satisfies MethodSectionCopy[],
  classificationSection: {
    heading: "Understanding our indications",
    intro:
      "Some pages indicate whether a classification commands broad agreement, remains debated, carries the trace of a colonial history, or rests on a reconstruction. These indications describe the classification presented, not the worth or legitimacy of the people concerned.",
  },
  stepLabel: "Editorial status",
  descriptions: {
    consensual:
      "A classification is said to be consensual when it commands broad agreement in the contemporary scholarly literature, including historical linguistics, anthropology and archaeology. Primary and secondary sources converge, and academic debate over the classification is closed or marginal.",
    contested:
      "A classification is contested when scholars actively debate its internal subdivisions, its boundaries with a neighbouring family, or documented competing hypotheses. We retain the current classification while making the controversy visible.",
    "colonial-legacy":
      "A colonial-legacy classification is a category created or fixed during the colonial period, usually by administrators, missionaries or linguists working for the administration. We retain these categories for historical traceability, explain why they are problematic, and favour self-designations.",
    reconstructive:
      "A reconstructive classification is established from fragmentary evidence, such as oral traditions, archaeology, genetics or glottochronology. It remains provisional, is revised as new evidence emerges, and is explicitly presented as a reconstruction.",
  } satisfies Record<ClassificationStatus, string>,
  closingActions: {
    sources: "See the sources",
    reportError: "Report an error",
    search: "Search a name",
  } satisfies ClosingActionsCopy,
  article: {
    sectionName: "Editorial doctrine",
    changelog: "View change history",
    fallback:
      "This archived version has no matching English translation. The French original follows.",
  },
};

type DoctrineCopy = typeof en;

const fr: DoctrineCopy = {
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
  ],
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
  },
  closingActions: {
    sources: "Consulter les sources",
    reportError: "Signaler une erreur",
    search: "Chercher un nom",
  },
  article: {
    sectionName: "Doctrine éditoriale",
    changelog: "Voir l'historique des modifications",
    fallback: "",
  },
};

// @req REQ-141
export const doctrineCopy: Record<Language, DoctrineCopy> = { en, fr };
