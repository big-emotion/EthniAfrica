/**
 * The atlas's vocabulary, defined once.
 *
 * Three surfaces publish onomastics — Appellations, Patronymes, the anecdotes
 * bank — and until this file none of them defined a single term. The word
 * *endonyme* was shown to a reader with nowhere to learn what it meant.
 *
 * Every entry carries an example the corpus actually holds, or declares that
 * it does not and says why (atlas charter §4). Nothing here is defined into
 * the void without admitting it.
 */

import { formatNommerFigure } from "@/lib/dossiers/nommer/figures";
import type { GlossaryEntry } from "./types";

// @req REQ-144
export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // ── D'où vient le nom ───────────────────────────────────────────────────
  {
    id: "autonyme",
    fr: "Autonyme",
    en: "Autonym",
    family: "origine",
    definition:
      "Le nom qu’un groupe emploie et revendique pour se désigner lui-même. Le fait qu’un nom soit utilisé au sein d’un groupe ne signifie pas toujours que ses membres y sont attachés.",
    corpusExample:
      "Les personnes appelées Dinka à l’international emploient aussi Jieng pour se nommer.",
    corpusPresence: "instantiated",
    seeAlso: ["endonyme", "exonyme"],
    chapterRef: "le-peuple",
    sourceRefs: ["afrik-ppl-dinka"],
  },
  {
    id: "emique-etique",
    fr: "Émique / étique",
    en: "Emic / etic",
    family: "origine",
    definition:
      "Une description est dite « émique » lorsqu’elle reprend les mots et les distinctions des personnes concernées. Elle est dite « étique » lorsqu’elle utilise ceux de la personne qui les étudie. Nous cherchons à présenter le point de vue des personnes concernées et précisons quand nous employons un classement extérieur.",
    corpusExample:
      "Un chercheur peut regrouper plusieurs peuples selon la famille de langues qu’ils parlent. Ce classement ne correspond pas forcément à la manière dont ces peuples se définissent.",
    corpusPresence: "instantiated",
    seeAlso: ["reification-ethnique"],
    chapterRef: "la-langue",
  },
  {
    id: "endonyme",
    fr: "Endonyme",
    en: "Endonym",
    family: "origine",
    definition: "Un nom utilisé pour un groupe dans sa propre langue.",
    corpusExample: "Ovaherero, « les possesseurs de bétail » en otjiherero.",
    corpusPresence: "instantiated",
    seeAlso: ["autonyme", "exonyme"],
    chapterRef: "le-peuple",
    sourceRefs: ["afrik-ppl-herero"],
  },
  {
    id: "etymologie-populaire",
    fr: "Étymologie populaire",
    en: "Folk etymology",
    family: "origine",
    definition:
      "Une explication de l’origine d’un mot fondée sur sa ressemblance avec un autre mot. Cette ressemblance ne suffit pas à établir leur lien historique.",
    corpusExample:
      "La source citée juge peu probable le rapprochement entre Kaffa et « café ». Elle propose plutôt de suivre le mot arabe qahwa, passé par le turc kahve.",
    corpusPresence: "instantiated",
    chapterRef: "la-chose",
    sourceRefs: ["coffee-qahwa"],
  },
  {
    id: "exonyme",
    fr: "Exonyme",
    en: "Exonym",
    family: "origine",
    definition:
      "Un nom donné à un groupe par d’autres personnes, par exemple des voisins, des marchands ou une administration. Il peut être accepté par les personnes concernées et n’est pas toujours lié à la colonisation.",
    corpusExample:
      "La fiche des Jieng rapporte que le nom Dinka vient de marchands arabes et a été repris par l’administration anglo-égyptienne.",
    sourceRefs: ["afrik-ppl-dinka"],
    corpusPresence: "instantiated",
    seeAlso: ["endonyme", "exonyme-depreciatif"],
    chapterRef: "le-peuple",
  },
  {
    id: "exonyme-depreciatif",
    fr: "Exonyme dépréciatif",
    en: "Pejorative exonym",
    family: "origine",
    definition:
      "Un nom donné de l’extérieur qui exprime du mépris, par exemple une moquerie ou une insulte devenue un nom courant.",
    corpusExample:
      "Selon la source citée, des colons néerlandais auraient créé « Hottentot » pour se moquer des sons à clics du khoekhoe.",
    corpusPresence: "instantiated",
    seeAlso: ["exonyme"],
    chapterRef: "le-peuple",
    sourceRefs: ["britannica-khoekhoe"],
  },
  {
    id: "graphie-historique",
    fr: "Graphie historique",
    en: "Historical spelling",
    family: "origine",
    definition:
      "Une façon d’écrire un nom que l’on retrouve dans des documents anciens. La conserver aide à retrouver les textes qui l’emploient.",
    corpusExample: "« Denka » pour Dinka, dans la littérature coloniale.",
    corpusPresence: "instantiated",
    seeAlso: ["exonyme"],
    chapterRef: "le-peuple",
  },
  {
    id: "onomastique",
    fr: "Onomastique",
    en: "Onomastics",
    family: "origine",
    definition:
      "L’étude des noms propres. Elle cherche notamment à comprendre qui a donné un nom, quand et dans quelles circonstances. Ces questions guident notre projet.",
    corpusExample:
      "Le dossier explore les noms des peuples, des pays, des personnes, des langues et des choses.",
    corpusPresence: "instantiated",
    seeAlso: ["ethnonyme", "toponyme", "anthroponyme"],
  },

  // ── Ce qui est nommé ────────────────────────────────────────────────────
  {
    id: "anthroponyme",
    fr: "Anthroponyme",
    en: "Anthroponym",
    family: "objet",
    definition:
      "Le nom d’une personne, qu’il s’agisse d’un prénom, d’un nom de clan, d’un nom de louange ou d’un autre type de nom. Le mot couvre davantage d’usages que le seul nom transmis par le père.",
    corpusExample: "Les trente fiches de nom du relevé présenté ici.",
    corpusPresence: "instantiated",
    seeAlso: ["patronyme-matronyme", "jamu", "oriki", "nisba"],
    chapterRef: "la-personne",
    sourceRefs: ["afrik-naming-taxonomy"],
  },
  {
    id: "chaine-patronymique",
    fr: "Chaîne patronymique",
    en: "Patronymic chain",
    family: "objet",
    definition:
      "Une suite de noms qui indique les liens entre une personne et ses parents. Par exemple, le prénom du père devient le second nom de l’enfant. La suite change donc d’une génération à l’autre.",
    corpusExample:
      "Quatre fiches du premier relevé utilisé pour ce glossaire décrivaient cette façon de nommer les personnes.",
    corpusPresence: "instantiated",
    absenceReason: undefined,
    seeAlso: ["patronyme-matronyme", "fixation-patronymique"],
    chapterRef: "la-personne",
    sourceRefs: ["afrik-naming-taxonomy"],
  },
  {
    id: "choronyme",
    fr: "Choronyme",
    en: "Choronym",
    family: "objet",
    definition:
      "Le nom d'une région ou d'un territoire, par opposition à un point sur une carte.",
    corpusExample:
      "Bilād as-sūdān, « le pays des Noirs », employé par les géographes arabes, devenu le Soudan.",
    corpusPresence: "instantiated",
    seeAlso: ["toponyme", "hydronyme", "oronyme"],
    chapterRef: "le-pays",
  },
  {
    id: "ethnonyme",
    fr: "Ethnonyme",
    en: "Name of a people",
    family: "objet",
    definition:
      "Le nom d’un peuple. Un même peuple peut en porter plusieurs, dont certains sont contestés ou hérités de la colonisation.",
    corpusExample:
      "Dinka et Jieng désignent le même peuple, mais ces noms ont des origines et des usages différents.",
    corpusPresence: "instantiated",
    seeAlso: ["exonyme", "endonyme", "tribu"],
    chapterRef: "le-peuple",
  },
  {
    id: "glossonyme",
    fr: "Glossonyme",
    en: "Glossonym",
    family: "objet",
    definition:
      "Le nom d’une langue. Il faut le distinguer du nom d’un peuple : plusieurs peuples peuvent parler une même langue ou des langues apparentées.",
    corpusExample:
      "Le mot « bantou » a été proposé au XIXe siècle pour regrouper des langues. Il ne désigne pas un peuple unique.",
    corpusPresence: "instantiated",
    seeAlso: ["ethnonyme", "reification-ethnique"],
    chapterRef: "la-langue",
    sourceRefs: ["bleek-1862"],
  },
  {
    id: "hydronyme",
    fr: "Hydronyme",
    en: "Hydronym",
    family: "objet",
    definition: "Le nom d'un cours ou d'une étendue d'eau.",
    corpusExample:
      "Le fleuve Niger a donné son nom à deux pays, et le lac Tchad à un troisième.",
    corpusPresence: "instantiated",
    seeAlso: ["toponyme", "choronyme", "oronyme"],
    chapterRef: "le-pays",
  },
  {
    id: "jamu",
    fr: "Jamu",
    en: "Jamu (Mande clan name)",
    family: "objet",
    definition:
      "Un nom de clan mandingue. Il indique une appartenance qui peut se transmettre à la naissance ou être acquise par une alliance, une relation de protection ou la captivité.",
    corpusExample:
      "Dix-huit fiches du relevé présenté ici décrivent un nom de clan.",
    corpusPresence: "instantiated",
    seeAlso: ["anthroponyme", "oriki"],
    chapterRef: "la-personne",
    sourceRefs: ["dec-040"],
  },
  {
    id: "nisba",
    fr: "Nisba",
    en: "Nisba",
    family: "objet",
    definition:
      "Un nom formé à partir d’un lieu, d’un groupe d’origine ou d’un métier dans le monde arabo-berbère.",
    corpusExample:
      "Deux fiches du relevé présenté ici décrivent cette manière de nommer les personnes.",
    corpusPresence: "instantiated",
    seeAlso: ["anthroponyme"],
    chapterRef: "la-personne",
    sourceRefs: ["afrik-naming-taxonomy"],
  },
  {
    id: "nom-totemique",
    fr: "Nom totémique clanique",
    en: "Totemic clan name",
    family: "objet",
    definition:
      "Nom de clan attaché à un animal ou à une plante, souvent avec un interdit alimentaire et une liste fermée de prénoms permis.",
    corpusExample:
      "Quatre fiches du relevé présenté ici décrivent cette manière de nommer les personnes.",
    corpusPresence: "instantiated",
    seeAlso: ["jamu", "anthroponyme"],
    chapterRef: "la-personne",
    sourceRefs: ["afrik-naming-taxonomy"],
  },
  {
    id: "oriki",
    fr: "Oríkì",
    en: "Oríkì",
    family: "objet",
    definition:
      "Un nom de louange yoruba. Il célèbre une famille, ses qualités et ses actions. Il est généralement récité plutôt qu’inscrit dans un registre.",
    corpusExample:
      "Deux fiches du relevé présenté ici décrivent un nom de louange.",
    corpusPresence: "instantiated",
    seeAlso: ["jamu", "anthroponyme"],
    chapterRef: "la-personne",
    sourceRefs: ["afrik-naming-taxonomy"],
  },
  {
    id: "oronyme",
    fr: "Oronyme",
    en: "Oronym",
    family: "objet",
    definition: "Le nom d’un relief, comme une montagne ou un massif.",
    corpusExample:
      "Selon l’explication présentée dans le dossier, Kenya viendrait de Kirinyaga, interprété en kikuyu comme « la montagne de blancheur ».",
    corpusPresence: "instantiated",
    seeAlso: ["toponyme", "hydronyme", "choronyme"],
    chapterRef: "le-pays",
  },
  {
    id: "patronyme-matronyme",
    fr: "Patronyme / matronyme",
    en: "Patronym / matronym",
    family: "objet",
    definition:
      "Un nom reçu du père est un patronyme ; un nom reçu de la mère est un matronyme. Ces façons de transmettre les noms ne sont pas les seules.",
    corpusExample:
      "Dans le premier relevé de trente fiches présenté ici, treize indiquaient une transmission par le père, treize une autre transmission et quatre ne précisaient pas ce point.",
    corpusPresence: "instantiated",
    seeAlso: ["anthroponyme", "fixation-patronymique", "chaine-patronymique"],
    chapterRef: "la-personne",
    sourceRefs: ["afrik-naming-taxonomy"],
  },
  {
    id: "postnom",
    fr: "Postnom",
    en: "Postname",
    family: "objet",
    definition:
      "Nom porté après le prénom, institué en République du Zaïre le 12 janvier 1972 en remplacement des prénoms chrétiens, et conservé après la chute du régime qui l'avait décrété.",
    corpusPresence: "defined_only",
    absenceReason:
      "Le relevé utilisé pour ce glossaire ne comprend pas de fiche sur le postnom. Ce terme est expliqué parce que le chapitre l'emploie.",
    seeAlso: ["anthroponyme", "tradition-inventee"],
    chapterRef: "la-personne",
    sourceRefs: ["zaire-authenticite-1972"],
  },
  {
    id: "theonyme",
    fr: "Théonyme",
    en: "Theonym",
    family: "objet",
    definition: "Le nom d'une divinité.",
    corpusExample:
      "Mami Wata est un nom commun qui aurait été adopté pour des divinités des eaux auparavant connues sous plusieurs noms.",
    corpusPresence: "defined_only",
    absenceReason:
      "Nous ne tenons pas de fiches de divinités. Le terme est défini parce que le chapitre « La chose » en a besoin.",
    seeAlso: ["transculturation"],
    chapterRef: "la-chose",
    sourceRefs: ["mami-wata-pidgin"],
  },
  {
    id: "toponyme",
    fr: "Toponyme",
    en: "Toponym",
    family: "objet",
    definition:
      "Le nom d’un lieu, qu’il soit petit ou vaste. Il peut désigner une ville, une région ou un pays.",
    corpusExample:
      "Lors du relevé utilisé pour le dossier, les 54 fiches de pays proposaient une explication de leur nom sans l’accompagner d’une source. Le dossier précise les références ajoutées depuis.",
    corpusPresence: "instantiated",
    seeAlso: ["choronyme", "hydronyme", "oronyme"],
    chapterRef: "le-pays",
  },

  // ── Ce que nommer produit ───────────────────────────────────────────────
  {
    id: "asymetrie-documentaire",
    fr: "Asymétrie documentaire",
    en: "Documentary asymmetry",
    family: "effet",
    definition:
      "Le déséquilibre entre les textes écrits sur un groupe par des personnes extérieures et ceux que ses membres ont produits. Cet écart décrit les documents disponibles, pas la valeur des histoires racontées.",
    corpusExample: `Nos fiches recensent ${formatNommerFigure({ figureKey: "corpus-exonyms" })} noms donnés de l’extérieur et ${formatNommerFigure({ figureKey: "corpus-autonyms" })} noms employés par les peuples eux-mêmes. ${formatNommerFigure({ figureKey: "status-undeclared" })} fiches sur ${formatNommerFigure({ figureKey: "corpus-peoples" })} ne précisent pas si le nom est contesté ou hérité de la colonisation.`,
    corpusPresence: "instantiated",
    seeAlso: ["exonyme", "endonyme"],
    chapterRef: "le-peuple",
  },
  {
    id: "fixation-patronymique",
    fr: "Fixation patronymique",
    en: "Surname fixation",
    family: "effet",
    definition:
      "Le passage à un nom stable, inscrit dans les registres et transmis d’une génération à l’autre. Les règles de l’état civil peuvent modifier des usages où les noms changeaient auparavant.",
    corpusExample:
      "L'état civil colonial exigeait un nom de forme européenne ; là où il n'en existait pas, l'agent en inscrivait un.",
    corpusPresence: "instantiated",
    seeAlso: ["patronyme-matronyme", "reification-ethnique"],
    chapterRef: "la-personne",
    sourceRefs: ["civil-registration-surnames"],
  },
  {
    id: "indigenisation",
    fr: "Indigénisation",
    en: "Indigenisation",
    family: "effet",
    definition:
      "Le processus par lequel des personnes adoptent un objet ou une pratique venus d’ailleurs et leur donnent une place dans la vie locale. Le nom ou l’usage peuvent changer.",
    corpusExample:
      "Dans l’exemple étudié ici, des acheteuses ouest-africaines donnent des noms aux motifs de wax fabriqués aux Pays-Bas.",
    corpusPresence: "instantiated",
    seeAlso: ["transculturation", "tradition-inventee"],
    chapterRef: "la-chose",
    sourceRefs: ["trc-leiden-vlisco"],
  },
  {
    id: "reification-ethnique",
    fr: "Réification ethnique",
    en: "Ethnic reification",
    family: "effet",
    definition:
      "Le fait de traiter un groupe créé pour classer des personnes comme s’il formait une population bien distincte, avec des limites fixes.",
    corpusExample:
      "« Bantou » a d’abord désigné une famille de langues, puis a été appliqué à des peuples et utilisé dans une loi organisant des écoles séparées en 1953.",
    corpusPresence: "instantiated",
    seeAlso: ["tribu", "glossonyme", "emique-etique"],
    chapterRef: "la-langue",
    sourceRefs: ["bantu-education-act-1953"],
  },
  {
    id: "sanankuya",
    fr: "Sanankuya",
    en: "Sanankuya (Mande joking kinship)",
    family: "effet",
    definition:
      "Une relation de parenté à plaisanterie entre des clans mandingues. Cécile Canut décrit un pacte transmis aux descendants : les familles doivent s’entraider, ne peuvent pas se marier entre elles et échangent des moqueries selon des règles reconnues. Porter le nom d’un des clans signifie aussi hériter de ces engagements.",
    corpusExample:
      "Keïta et Coulibaly, dont la tradition fait remonter le pacte à Soundiata.",
    corpusPresence: "instantiated",
    seeAlso: ["jamu"],
    chapterRef: "la-personne",
    sourceRefs: [
      "canut-2002-senankuya",
      "canut-2006-mali-senankuya",
      "canut-smith-2006-pactes",
      "unesco-charte-manden-00290",
    ],
  },
  {
    id: "tradition-inventee",
    fr: "Tradition inventée",
    en: "Invented tradition",
    family: "effet",
    definition:
      "Une pratique récente présentée comme très ancienne. Ce terme invite à étudier quand une pratique est apparue et comment elle a été transmise.",
    corpusExample:
      "Le postnom, décrété en 1972, se porte aujourd'hui comme un héritage.",
    corpusPresence: "instantiated",
    seeAlso: ["postnom", "indigenisation"],
    chapterRef: "la-personne",
    sourceRefs: ["zaire-authenticite-1972"],
  },
  {
    id: "transculturation",
    fr: "Transculturation",
    en: "Transculturation",
    family: "effet",
    definition:
      "Les changements qui se produisent lorsque des cultures se rencontrent. Les personnes reprennent et transforment des éléments venus d’ailleurs pour créer de nouveaux usages.",
    corpusExample:
      "La représentation de Mami Wata en femme au serpent est rapprochée d’une affiche imprimée en couleurs à Hambourg dans les années 1880.",
    corpusPresence: "instantiated",
    seeAlso: ["indigenisation", "theonyme"],
    chapterRef: "la-chose",
    sourceRefs: ["drewal-2012"],
  },
  {
    id: "tribu",
    fr: "Tribu",
    en: "Tribe",
    family: "effet",
    definition:
      "Un mot employé notamment par les administrations coloniales pour classer des populations. Nous préférons « peuple » dans nos présentations et expliquons le contexte lorsque les sources utilisent « tribu ».",
    corpusExample:
      "Nos fiches présentent les groupes comme des peuples. Lorsqu’une source ancienne emploie « tribu », nous conservons le mot dans la citation.",
    corpusPresence: "defined_only",
    absenceReason:
      "Ce terme est expliqué pour aider à comprendre les textes qui l'utilisent. Nous préférons le mot « peuple » pour présenter les groupes.",
    seeAlso: ["ethnonyme", "reification-ethnique"],
    chapterRef: "le-peuple",
  },
  {
    id: "type-de-source",
    fr: "Type de source",
    en: "Source type",
    family: "effet",
    definition:
      "Une indication sur la nature d’une source : récit oral, travail de recherche, archive, statistiques publiques ou présentation d’ensemble. Elle aide à comprendre d’où vient l’information, sans classer les sources selon le métier de leur auteur.",
    corpusExample:
      "Les références du dossier indiquent par exemple « Tradition orale » ou « Publication académique ».",
    corpusPresence: "instantiated",
    seeAlso: ["asymetrie-documentaire"],
  },
];
