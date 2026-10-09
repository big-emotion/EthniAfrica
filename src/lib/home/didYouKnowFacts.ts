/**
 * The "Saviez-vous" bank.
 *
 * Every fact here is onomastic: it is about a *name* — who gave it, when,
 * and what it was hiding. That is the constraint that keeps the band from
 * drifting into trivia. A fact that could be printed on a placemat does not
 * belong; a fact that changes how a reader hears a word they already knew
 * does.
 *
 * Each fact carries the entities it concerns, so the band is an exit into
 * the atlas rather than a cul-de-sac. Ids are corpus ids, checked against
 * the fiches — a chip pointing at a people the corpus does not hold is a
 * 404 the reader finds before we do.
 *
 * The home draws two facts per request (REQ-115's reasoning applies: the
 * draw runs server-side, so it never re-runs during hydration and cannot
 * desynchronise the client tree). With a bank this small, a curious reader
 * exhausts it in one sitting — growing it is the band's real maintenance
 * cost, not its integration.
 */

import type { SourceKind } from "@/types/sources";

export type DidYouKnowEntityKind = "people" | "country" | "family";

export interface DidYouKnowEntity {
  kind: DidYouKnowEntityKind;
  id: string;
  label: string;
}

/** Mirrors the fiche source tiers: official | referenced | unverified. */
export type DidYouKnowTier = "official" | "referenced" | "unverified";

/**
 * Where a fact comes from, in the shape the fiches already use.
 *
 * The bank asserted a tier without ever naming a source. When the band showed
 * one fact per visit that was survivable; on a page that lists the whole
 * bank and invites a reader to cite it, printing « Source référencée » over
 * nothing is claiming an authority we cannot produce — the exact thing the
 * tier policy exists to prevent.
 */
export interface DidYouKnowSource {
  title: string;
  /**
   * Absent for a work that has no address — a 1937 monograph, a journal issue
   * that never went online. Inventing a plausible URL for one would be worse
   * than omitting it: a reader clicks it, lands nowhere, and learns that the
   * citations on this page are decorative.
   */
  url?: string;
  tier: DidYouKnowTier;
  /**
   * What kind of work the citation is — the type a card shows beside the
   * title, never the tier. Same vocabulary as a fiche's `source_kind`.
   */
  source_kind: SourceKind;
  /** What the citation actually supports, or what it deliberately leaves open. */
  notes?: string;
}

export interface DidYouKnowFact {
  id: string;
  /** The claim, stated as a sentence the reader can carry away. */
  headline: string;
  /** Two paragraphs at most — the band is read standing up. */
  body: string[];
  entities: DidYouKnowEntity[];
  tier: DidYouKnowTier;
  /**
   * Optional only because six facts predate the field. Every fact added
   * from now on carries its provenance; `sourcedFactsCiteTheirClaim` in the
   * bank's tests holds that line.
   */
  sources?: DidYouKnowSource[];
}

// @req REQ-113
export const DID_YOU_KNOW_FACTS: DidYouKnowFact[] = [
  {
    id: "monrovia",
    headline: "La capitale du Liberia porte le nom d'un président américain.",
    body: [
      "Monrovia vient de James Monroe, cinquième président des États-Unis. C'est l'une des deux seules capitales au monde à porter le nom d'un président américain — l'autre est Washington.",
      "Le comptoir fondé en 1822 s'appelait Christopolis. Il fut rebaptisé en l'honneur de Monroe, dont le soutien avait permis à l'American Colonization Society d'acquérir le territoire où s'installèrent des Afro-Américains affranchis.",
    ],
    entities: [
      { kind: "country", id: "LBR", label: "Liberia" },
      {
        kind: "people",
        id: "PPL_AMERICANO_LIBERIENS",
        label: "Américano-Libériens",
      },
    ],
    tier: "referenced",
  },
  {
    id: "bantou",
    headline:
      "« Bantou » a été proposé au XIXe siècle pour nommer un groupe de langues.",
    body: [
      "Les historiens de la linguistique retrouvent ce mot chez Wilhelm Bleek dans un manuscrit de 1857. Il est imprimé en 1858, puis diffusé dans son ouvrage Comparative Grammar of South African Languages, publié en 1862. Le mot reprend ba-, qui indique plusieurs personnes, et -ntu, qui renvoie à la personne. Ba-ntu signifie ainsi « les gens ».",
      "Bleek regroupait des langues apparentées. Le mot a ensuite été appliqué à des peuples par les travaux coloniaux, puis utilisé sous l’apartheid. Le Bantu Education Act de 1953 l’emploie notamment pour organiser des écoles séparées. Ces usages dépassent la comparaison entre les langues.",
    ],
    entities: [
      { kind: "family", id: "FLG_BANTU", label: "Langues bantoues" },
      { kind: "people", id: "PPL_ZULU", label: "Zoulou" },
      { kind: "people", id: "PPL_XHOSA", label: "Xhosa" },
      { kind: "country", id: "ZAF", label: "Afrique du Sud" },
    ],
    tier: "referenced",
  },
  {
    id: "cote-ivoire",
    headline:
      "Le nom Côte d’Ivoire est lié au commerce de l’ivoire sur le littoral.",
    body: [
      "Les navigateurs portugais employaient Costa do Marfim, « la côte de l’ivoire », pour désigner ce littoral. À l’est, vers Assinie, on rencontrait aussi le nom Côte de l’Or, associé à l’actuel Ghana.",
      "En 1839, l’officier français Bouët-Willaumez reprend le nom en français et le rend officiel. L’appellation circulait donc avant son adoption administrative. Elle renvoyait aux marchandises échangées sur la côte, sans décrire les peuples qui y vivaient.",
    ],
    entities: [
      { kind: "country", id: "CIV", label: "Côte d'Ivoire" },
      { kind: "country", id: "GHA", label: "Ghana" },
    ],
    tier: "referenced",
  },
  {
    id: "amazigh",
    headline:
      "Le nom « Berbère » est rapproché d’un mot grec pour les personnes dont on ne comprenait pas la langue.",
    body: [
      "L’explication présentée ici fait passer le mot grec barbaros par le latin barbarus, puis par les auteurs arabes du Moyen Âge. L’administration coloniale française a ensuite repris « Berbère » pour classer des populations. Certaines personnes jugent aujourd’hui ce nom méprisant, notamment en raison de son rapprochement avec « barbare ».",
      "Amazigh, au pluriel Imazighen, est le nom employé par les personnes concernées. Il est souvent interprété comme « homme libre ». Kabyles, Chaouis, Rifains, Chleuhs, Mozabites et Touaregs sont regroupés sous ce nom, tout en ayant chacun leur région et leur histoire.",
    ],
    entities: [
      { kind: "people", id: "PPL_AMAZIGH_MACRO", label: "Amazigh" },
      { kind: "country", id: "MAR", label: "Maroc" },
      { kind: "country", id: "DZA", label: "Algérie" },
    ],
    tier: "referenced",
  },
  {
    id: "lingala",
    headline:
      "Le nom Lingala est lié à l’histoire coloniale et missionnaire du fleuve Congo.",
    body: [
      "Le bobangi, une langue employée dans le commerce sur le fleuve Congo avant l’arrivée des Européens, a joué un rôle important dans la formation du lingala. L’histoire du nom et celle de la langue ne commencent donc pas au même moment.",
      "Au XIXe siècle, l’administration coloniale regroupe des populations du fleuve sous le nom Bangala. Les travaux administratifs et missionnaires contribuent ensuite à fixer une orthographe et une forme commune appelée lingala. L’estimation rapportée ici attribue au bobangi environ 60 à 70 % de la structure du lingala moderne.",
    ],
    entities: [
      { kind: "country", id: "COD", label: "RDC" },
      { kind: "people", id: "PPL_NGALA", label: "Ngala (Bangala)" },
    ],
    tier: "referenced",
  },
  {
    id: "personne-relationnelle",
    // Trimmed to the items that can be checked word by word. « amăghar » was
    // listed as the amazigh word for "person" — it names an elder or a chief —
    // and one of the proverbs could not be traced to any attested form. The
    // unverified tier labels a claim's authority; it does not license a
    // mistranslation.
    headline:
      "Dans plusieurs langues africaines, une même formule définit la personne par les autres.",
    body: [
      "Muntu chez les Kongo et les Luba, umuntu en zoulou, motho en tswana, mɔgɔ en bambara, onipa en akan, qof en somali : le mot « personne » se répond d'une langue à l'autre, et se retrouve pris dans la même construction.",
      "« Umuntu ngumuntu ngabantu » en zoulou — une personne est une personne par les autres ; « Onipa nyɛ onipa nkoara » en akan ; « Qof waa qof dad awgiis » en somali. Ces formules définissent la personne par ses relations plutôt que par elle-même.",
    ],
    entities: [
      { kind: "family", id: "FLG_BANTU", label: "Langues bantoues" },
      { kind: "people", id: "PPL_AKAN", label: "Akan" },
      { kind: "people", id: "PPL_SOMALI", label: "Somali" },
    ],
    tier: "unverified",
  },
  {
    id: "afrique",
    headline:
      "Le nom Afrique aurait d’abord désigné une région autour de Carthage.",
    body: [
      "Les Romains appelaient Afri les habitants de la région de Carthage. Le nom est rapproché des Ifren et du mot berbère ifri, « grotte », sans que cette explication suffise à établir son origine. Africa désignait alors une province correspondant à la Tunisie actuelle et à l’est de l’Algérie.",
      "Le nom arabe Ifrīqiya a désigné une région proche. Au Moyen Âge, l’usage d’Afrique s’est progressivement étendu à des terres plus vastes au sud de la Méditerranée. Le même nom désigne aujourd’hui le continent.",
    ],
    entities: [
      { kind: "country", id: "TUN", label: "Tunisie" },
      { kind: "country", id: "DZA", label: "Algérie" },
      { kind: "family", id: "FLG_BERBERE", label: "Langues berbères" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Jeune Afrique — Quelle est l'origine du mot « Afrique » ?",
        url: "https://www.jeuneafrique.com/115118/archives-thematique/quelle-est-l-origine-du-mot-afrique/",
        tier: "referenced",
        source_kind: "unknown",
        notes:
          "Plusieurs étymologies coexistent (Ifren, ifri « grotte », punique faraqa). La fiche retient l'extension du périmètre, qui n'est pas contestée, pas l'étymon.",
      },
    ],
  },
  {
    id: "burkina-faso",
    headline:
      "Le nom du Burkina Faso réunit des mots de plusieurs langues du pays.",
    body: [
      "Burkina vient du mooré et renvoie à l’intégrité et à l’honneur. Faso vient du dioula et désigne le pays ou la patrie. L’ensemble est traduit par « la patrie des hommes intègres ». Pour burkinabè, qui désigne les habitants, le géographe Alain Maharaux décrit un nom formé à partir des trois principales langues du pays.",
      "Une ordonnance du 2 août 1984 remplace Haute-Volta par Burkina Faso, avec effet au 4 août. Cette date marque le premier anniversaire de l’arrivée au pouvoir de Thomas Sankara. Le nouveau nom réunit plusieurs langues, tandis que Haute-Volta venait de l’administration coloniale.",
    ],
    entities: [
      { kind: "country", id: "BFA", label: "Burkina Faso" },
      { kind: "people", id: "PPL_MOSSI", label: "Mossi" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Jeune Afrique — Le 4 août 1984, Thomas Sankara rebaptisait la Haute-Volta en Burkina Faso",
        url: "https://www.jeuneafrique.com/48652/politique/le-4-ao-t-1984-thomas-sankara-rebaptisait-la-haute-volta-en-burkina-faso/",
        tier: "referenced",
        source_kind: "unknown",
      },
      {
        title:
          "Alain Maharaux — La Haute-Volta devient Burkina Faso : un territoire qui se crée, se défait et s'affirme au rythme des enjeux, 1995",
        url: "https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers08-09/010014865-32.pdf",
        tier: "referenced",
        source_kind: "academic",
      },
    ],
  },
  {
    id: "cameroun",
    headline: "Le nom Cameroun serait lié aux crevettes du fleuve Wouri.",
    body: [
      "Selon le récit présenté ici, le navigateur portugais Fernão do Pó remonte l’estuaire du Wouri en 1472 et le nomme Rio dos Camarões, « la rivière des crevettes », en référence aux crustacés qu’il y observe.",
      "Le nom du fleuve est ensuite appliqué au territoire. Il prend plusieurs formes selon les langues et les administrations : Camarões en portugais, Kamerun en allemand, Cameroon en anglais et Cameroun en français.",
    ],
    entities: [
      { kind: "country", id: "CMR", label: "Cameroun" },
      { kind: "people", id: "PPL_DUALA", label: "Duala" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Ministère des Relations extérieures du Cameroun — Histoire",
        url: "https://www.diplocam.cm/histoire/",
        tier: "official",
        source_kind: "government",
      },
    ],
  },
  {
    id: "benin-dahomey",
    headline: "Le Bénin a choisi un nom qui ne désignait aucun peuple du pays.",
    body: [
      "Jusqu’en 1975, le pays s’appelait Dahomey, en référence au royaume fon d’Abomey. Le gouvernement de Mathieu Kérékou a retenu Bénin, d’après la baie qui borde sa côte. Ce choix permettait d’employer un nom qui ne soit pas celui d’un seul des peuples du pays.",
      "La baie tient toutefois son nom du royaume du Bénin, situé dans l’actuel Nigeria. Le territoire du Bénin actuel n’en faisait pas partie. Un même nom peut ainsi relier des lieux qui ont des histoires politiques différentes.",
    ],
    entities: [
      { kind: "country", id: "BEN", label: "Bénin" },
      { kind: "country", id: "NGA", label: "Nigeria" },
      { kind: "people", id: "PPL_FON", label: "Fon" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Why was Dahomey renamed Benin in 1975? — Visit Abomey",
        url: "https://visitabomey.com/en/pillars/why-dahomey-renamed-benin",
        tier: "referenced",
        source_kind: "community",
      },
    ],
  },
  {
    id: "nigeria-flora-shaw",
    headline: "Une journaliste a proposé le nom Nigeria dans le Times en 1897.",
    body: [
      "Le 8 janvier 1897, Flora Shaw propose d’appeler Nigeria les territoires administrés par la Royal Niger Company. Elle cherche un nom plus court que « Royal Niger Company Territories ». Elle est alors chargée des sujets coloniaux au Times.",
      "En 1902, elle épouse Frederick Lugard. Devenu gouverneur général, il reprend le nom en 1914 lors de l’unification des protectorats du Nord et du Sud. La proposition dans le journal et le choix officiel du nom sont donc deux étapes distinctes.",
    ],
    entities: [{ kind: "country", id: "NGA", label: "Nigeria" }],
    tier: "referenced",
    sources: [
      {
        title:
          "Dubawa — How true is the claim that Flora Shaw coined the name Nigeria?",
        url: "https://dubawa.org/nigeria60-how-true-is-claim-that-flora-shaw-british-journalist-coined-the-name-nigeria/",
        tier: "referenced",
        source_kind: "unknown",
        notes:
          "Vérification de presse citant l'article du Times du 8 janvier 1897 ; l'adoption officielle par Lugard date de 1914.",
      },
    ],
  },
  {
    id: "zimbabwe-grand-zimbabwe",
    headline:
      "Le Zimbabwe a choisi le nom d’un site dont l’origine africaine avait été niée.",
    body: [
      "Le nom est rapproché du shona dzimba dza mabwe, « maisons de pierre ». En 1902, Cecil Rhodes finance des fouilles au Grand Zimbabwe avec la volonté de lui attribuer une origine non africaine. Des récits évoquent alors les Phéniciens ou la reine de Saba.",
      "En 1970, le gouvernement rhodésien interdit aux publications officielles de présenter le site comme une création africaine. L’archéologue Peter Garlake, qui défend cette origine, est emprisonné puis expulsé. En 1980, le pays indépendant adopte Zimbabwe comme nom, en référence au site.",
    ],
    entities: [
      { kind: "country", id: "ZWE", label: "Zimbabwe" },
      { kind: "people", id: "PPL_SHONA", label: "Shona" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "The British Academy — Reclaiming Great Zimbabwe's past",
        url: "https://www.thebritishacademy.ac.uk/blog/reclaiming-great-zimbabwes-past-to-learn-lessons-for-the-future/",
        tier: "referenced",
        source_kind: "academic",
      },
      {
        title: "Scientific American — Great Zimbabwe",
        url: "https://www.scientificamerican.com/article/great-zimbabwe-2005-01/",
        tier: "referenced",
        source_kind: "unknown",
        notes:
          "Documente la commande de fouille de 1902 et la censure rhodésienne de 1970.",
      },
    ],
  },
  {
    id: "prefixes-bantous",
    headline:
      "Les mots Lesotho et Botswana indiquent le lien entre un pays et un peuple.",
    body: [
      "En sesotho, Mosotho désigne une personne, Basotho le peuple, Sesotho la langue et Lesotho le pays. Une même base revient dans ces mots, mais leur début change. On retrouve ce fonctionnement avec Motswana, Batswana, Setswana et Botswana.",
      "Cette partie placée au début du mot s’appelle un préfixe. Dans ces exemples, elle permet de distinguer le pays, le peuple, une personne et la langue. La comprendre aide donc à savoir de quoi l’on parle.",
    ],
    entities: [
      { kind: "country", id: "LSO", label: "Lesotho" },
      { kind: "country", id: "BWA", label: "Botswana" },
      { kind: "people", id: "PPL_SOTHO", label: "Sotho" },
      { kind: "people", id: "PPL_TSWANA", label: "Tswana" },
    ],
    tier: "official",
    sources: [
      {
        title: "SIL Ethnologue — Sesotho (sot)",
        url: "https://www.ethnologue.com/language/sot/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
      {
        title: "SIL Ethnologue — Setswana (tsn)",
        url: "https://www.ethnologue.com/language/tsn/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "peul-dix-noms",
    headline: "Peul, Fulani et Fulɓe désignent le même peuple.",
    body: [
      "Les personnes concernées emploient Fulɓe pour plusieurs personnes et Pullo pour une seule. Le nom Peul, courant en français, viendrait du wolof. Fulani, courant en anglais, serait passé par le haoussa. On rencontre aussi Fula, ainsi que Fellata au Tchad et au Soudan. Leur langue est appelée pulaar à l’ouest et fulfulde à l’est.",
      "Présents du Sénégal au Soudan, les Fulɓe ont été désignés dans plusieurs langues, par leurs voisins et par des administrations coloniales. Ces contacts aident à comprendre pourquoi plusieurs noms continuent à circuler.",
    ],
    entities: [
      { kind: "people", id: "PPL_FULA", label: "Fulɓe (Peul)" },
      { kind: "country", id: "SEN", label: "Sénégal" },
      { kind: "country", id: "MLI", label: "Mali" },
      { kind: "country", id: "NER", label: "Niger" },
    ],
    tier: "official",
    sources: [
      {
        title: "SIL Ethnologue — Pulaar (fuc)",
        url: "https://www.ethnologue.com/language/fuc/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "khoikhoi-hottentot",
    headline:
      "« Hottentot » aurait été créé pour se moquer des sons d’une langue.",
    body: [
      "Le Dictionary of South African English rapporte une explication courante : les colons néerlandais arrivés au Cap dans les années 1650 auraient créé le mot en imitant les sons à clics du khoekhoe, avec un sens proche de « bègue ». Le dictionnaire signale toutefois qu’aucun usage écrit plus ancien ne vient appuyer cette piste. Une autre explication le rattache à une formule répétée dans un chant nama.",
      "Quelle que soit son origine, le mot est aujourd’hui considéré comme profondément offensant en Afrique du Sud. Les personnes concernées emploient notamment Khoekhoen, traduit par « les hommes des hommes ».",
    ],
    entities: [
      { kind: "people", id: "PPL_KHOIKHOI", label: "Khoikhoi" },
      { kind: "country", id: "ZAF", label: "Afrique du Sud" },
      { kind: "country", id: "NAM", label: "Namibie" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Dictionary of South African English — Hottentot",
        url: "https://dsae.co.za/entry/hottentot/e03109",
        tier: "referenced",
        source_kind: "linguistic_reference",
        notes:
          "Le dictionnaire donne l'hypothèse des clics comme la plus répandue tout en notant l'absence d'attestation antérieure.",
      },
    ],
  },
  {
    id: "pygmee-homere",
    headline:
      "Le mot « Pygmée » vient d’un récit grec et a été appliqué à plusieurs peuples d’Afrique.",
    body: [
      "Le grec pygmē désigne une ancienne mesure allant du coude à l’articulation des doigts, soit environ trente-cinq centimètres. Les Pygmaioi sont un peuple légendaire de très petite taille mentionné par Homère et Hérodote. Dans l’Iliade, ils combattent des grues. Des Européens ont ensuite repris ce nom pour des populations d’Afrique centrale.",
      "Les Baka, Bagyeli, Aka, Twa et Mbuti ont chacun leurs noms, leurs langues et leurs territoires. Le terme commun ne signifie donc pas qu’ils forment un peuple unique ou qu’ils se désignent eux-mêmes ainsi.",
    ],
    entities: [
      {
        kind: "people",
        id: "PPL_PYGMEES_AUTOCHTONES",
        label: "Peuples autochtones des forêts d'Afrique centrale",
      },
      { kind: "people", id: "PPL_TWA", label: "Twa" },
      { kind: "country", id: "CMR", label: "Cameroun" },
      { kind: "country", id: "COD", label: "RDC" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Online Etymology Dictionary — pygmy",
        url: "https://www.etymonline.com/word/pygmy",
        tier: "referenced",
        source_kind: "linguistic_reference",
        notes:
          "Établit pygmē « coudée » et l'usage homérique ; l'absence de terme collectif de remplacement est documentée par les organisations de défense des peuples concernés.",
      },
    ],
  },
  {
    id: "lac-lac",
    headline:
      "Certains noms de lacs reprennent simplement le mot « lac » dans une langue locale.",
    body: [
      "Nyasa signifie « lac » en yao et en chichewa. L’expression « lac Nyasa » répète donc cette idée, et Nyassaland désignait le « pays du Lac ». Tchad est rapproché de tsade, « lac » en kanouri. De même, l’arabe ṣaḥrāʾ signifie « désert », ce qui explique le nom Sahara.",
      "Un mot qui décrit un lieu dans une langue peut devenir son nom propre dans une autre. Les récits présentés ici évoquent notamment des voyageurs qui auraient pris une description pour le nom du lieu.",
    ],
    entities: [
      { kind: "country", id: "MWI", label: "Malawi" },
      { kind: "country", id: "TCD", label: "Tchad" },
      { kind: "people", id: "PPL_YAO", label: "Yao" },
      { kind: "people", id: "PPL_KANURI", label: "Kanuri" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "WorldAtlas — What is a tautological place name?",
        url: "https://www.worldatlas.com/articles/what-is-a-tautological-place.html",
        tier: "referenced",
        source_kind: "discovery",
      },
    ],
  },
  {
    id: "tombouctou",
    headline: "Plusieurs explications sont proposées pour le nom Tombouctou.",
    body: [
      "Un récit courant le rapproche de Tin Buktu, « le lieu de Bouctou ». Bouctou aurait été une femme touarègue à qui des nomades confiaient leurs biens près d’un puits. L’historien malien Sékéné Cissoko propose plutôt tin, « le lieu », et bouctou, « une petite dune ».",
      "L’explorateur Heinrich Barth écartait l’explication du puits et proposait le songhaï tùmbutu, un creux dans le sable, en lien avec la position de la ville dans une cuvette. Ces propositions donnent des sens différents au nom ; les sources réunies ici ne permettent pas de choisir entre elles.",
    ],
    entities: [
      { kind: "country", id: "MLI", label: "Mali" },
      { kind: "people", id: "PPL_TUAREG", label: "Touareg" },
      { kind: "people", id: "PPL_SONGHAI", label: "Songhaï" },
    ],
    tier: "unverified",
    sources: [
      {
        title: "World History Encyclopedia — Timbuktu",
        url: "https://www.worldhistory.org/Timbuktu/",
        tier: "referenced",
        source_kind: "discovery",
        notes:
          "Le fait publié est le désaccord lui-même. Les étymologies concurrentes relèvent de la tradition orale et d'hypothèses d'auteurs : aucune n'est attestée.",
      },
    ],
  },
  {
    id: "fleuve-niger",
    headline: "Le nom Niger pourrait venir d’une expression touarègue.",
    body: [
      "L’Online Etymology Dictionary propose comme origine probable egerew n-igerewen, « le fleuve des fleuves », une expression touarègue employée autour de Tombouctou. Elle aurait été raccourcie au fil des échanges commerciaux à travers le Sahara. La ressemblance avec le latin niger, « noir », aurait ensuite influencé l’orthographe.",
      "Le fleuve porte aussi plusieurs noms dans les langues riveraines, notamment Joliba en mandingue, Isa Ber en songhaï, Orimili en igbo, Kwara en haoussa et Oya en yoruba. Niger est aujourd’hui repris dans le nom de deux États, le Niger et le Nigeria.",
    ],
    entities: [
      { kind: "country", id: "NER", label: "Niger" },
      { kind: "country", id: "NGA", label: "Nigeria" },
      { kind: "country", id: "MLI", label: "Mali" },
      { kind: "people", id: "PPL_SONGHAI", label: "Songhaï" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Online Etymology Dictionary — Niger",
        url: "https://www.etymonline.com/word/Niger",
        tier: "referenced",
        source_kind: "linguistic_reference",
        notes:
          "Donne l'altération du touareg egerew n-igerewen sous l'influence du latin niger comme hypothèse la plus probable, non comme certitude.",
      },
    ],
  },
  {
    id: "ethiopie",
    headline:
      "Éthiopie et Abyssinie racontent plusieurs usages du nom du pays.",
    body: [
      "Éthiopie est rattaché au grec Aithiopía, interprété comme « visage brûlé ». Abyssinie serait passé par l’arabe habasha, qui désignait des populations de la Corne de l’Afrique. Ces explications renvoient aux noms employés par des peuples voisins.",
      "La forme ʾĪtyōṗṗyā se retrouve dans les textes guèzes et dans le nom officiel de l’État. Abyssinie est devenu un nom ancien. Un nom venu d’une autre langue peut donc être adopté par les personnes qu’il désigne.",
    ],
    entities: [
      { kind: "country", id: "ETH", label: "Éthiopie" },
      { kind: "people", id: "PPL_AMHARA", label: "Amhara" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Ethiopia",
        url: "https://www.ethnologue.com/country/ET/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "guinee",
    headline: "L’origine du nom Guinée reste discutée.",
    body: [
      "Une explication le rapproche du berbère aginaw, « homme noir », et d’akal n-iguinawen, « le pays des hommes noirs ». Le nom apparaît sur des cartes européennes à partir du XIVe siècle. En 1526, le géographe Léon l’Africain propose plutôt un lien avec Djenné, une ville marchande du Niger.",
      "Ces deux pistes restent à vérifier. Le nom a été employé pour des parties de la côte, puis repris par la Guinée, la Guinée-Bissau et la Guinée équatoriale. Il se retrouve aussi dans Nouvelle-Guinée : un navigateur aurait choisi ce nom en rapprochant l’apparence de ses habitants de celle des populations de Guinée.",
    ],
    entities: [
      { kind: "country", id: "GIN", label: "Guinée" },
      { kind: "country", id: "GNB", label: "Guinée-Bissau" },
      { kind: "country", id: "GNQ", label: "Guinée équatoriale" },
    ],
    tier: "unverified",
    sources: [
      {
        title: "WorldAtlas — Why are so many countries called Guinea?",
        url: "https://www.worldatlas.com/geography/why-are-so-many-countries-called-guinea-56865.html",
        tier: "unverified",
        source_kind: "discovery",
        notes:
          "Les deux étymologies concurrentes (aginaw berbère, Djenné) sont des conjectures d'auteurs ; aucune n'est démontrée.",
      },
    ],
  },
  {
    id: "tanzanie",
    headline: "Le nom Tanzanie réunit Tanganyika et Zanzibar.",
    body: [
      "Le Tanganyika devient indépendant en 1961 et Zanzibar en 1963. Les deux s’unissent en avril 1964. Le nouvel État adopte Tanzanie, en assemblant le début de chacun des deux noms.",
      "Le nom garde ainsi la trace de cette union politique. Son explication passe par l’histoire des deux territoires qui ont formé le pays.",
    ],
    entities: [
      { kind: "country", id: "TZA", label: "Tanzanie" },
      { kind: "people", id: "PPL_SWAHILI", label: "Swahili" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Tanzania",
        url: "https://www.ethnologue.com/country/TZ/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "mozambique",
    headline:
      "Le nom Mozambique serait lié à un marchand appelé Mussa Bin Bique.",
    body: [
      "Selon le récit présenté ici, Mussa Bin Bique était un cheikh et marchand installé sur l’île. Lorsque l’expédition de Vasco de Gama y arrive en 1498, les Portugais auraient pris son nom pour celui du lieu et l’auraient écrit Moçambique.",
      "L’île devient une capitale coloniale au XVIe siècle. Son nom est ensuite étendu à un territoire plus vaste. Cette explication relie donc le nom d’une personne, celui d’une île et celui du pays.",
    ],
    entities: [
      { kind: "country", id: "MOZ", label: "Mozambique" },
      { kind: "people", id: "PPL_MAKUA", label: "Makua" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "UNESCO — Island of Mozambique",
        url: "https://whc.unesco.org/en/list/599/",
        tier: "official",
        source_kind: "intergovernmental",
        notes:
          "Atteste le rôle de l'île comme comptoir puis capitale coloniale ; l'attribution du nom au cheikh Mussa Bin Bique est la lecture courante des chroniques portugaises.",
      },
    ],
  },
  {
    id: "sierra-leone",
    headline:
      "Les sources ne donnent pas toutes la même origine au nom Sierra Leone.",
    body: [
      "Un récit courant attribue Serra Lyoa, « montagnes du Lion », au Portugais Pedro de Sintra vers 1462. L’historien sierra-léonais C. Magbaily Fyle conteste cette attribution : il relève le nom avant cette date et propose qu’une erreur de lecture ait été recopiée par plusieurs historiens.",
      "Le sens est lui aussi expliqué de plusieurs façons. Le relief aurait évoqué des dents de lion, ou le tonnerre au-dessus des collines aurait rappelé un rugissement. Les marins anglais emploient Sierra Leoa au XVIe siècle, puis Sierra Leone, rendu officiel par les Britanniques en 1787.",
    ],
    entities: [
      { kind: "country", id: "SLE", label: "Sierra Leone" },
      { kind: "people", id: "PPL_TEMNE", label: "Temne" },
      { kind: "people", id: "PPL_MENDE", label: "Mende" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Mission permanente de la Sierra Leone — Country history",
        url: "https://missionsierraleone.ch/411-412-country-history-of-sierra-leone",
        tier: "official",
        source_kind: "government",
      },
      {
        title: "Sierra Leone: Why the Name? — African Heritage",
        url: "https://afrolegends.com/2012/11/14/sierra-leone-why-the-name/",
        tier: "unverified",
        source_kind: "community",
        notes:
          "Rapporte la contestation de C. Magbaily Fyle sur l'attribution à Pedro de Sintra.",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms que les voisins donnent
  //
  // The bank opened country-heavy: Monrovia, la Côte d'Ivoire, le Cameroun.
  // Those are the names a reader already half-knows. The corpus's real
  // holding is the other side of the ledger — the eight hundred fiches whose
  // `appellations` chapter records who named the people, in what language,
  // and what the word meant before it became an ethnonym. What follows is
  // drawn from there, one naming mechanism per anecdote.
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "iteso-bakedi",
    headline: "Bakedi est un nom donné aux Iteso par leurs voisins.",
    body: [
      "Les Baganda emploient Bakedi, aussi écrit Bakidi, au XIXe siècle. La fiche l’interprète comme « les nus », en référence à un jugement porté sur la façon de se vêtir. Ce nom est aujourd’hui considéré comme insultant.",
      "Iteso désigne le peuple, Teso son territoire et Ateso sa langue. Ces noms proches peuvent être confondus. La frontière coloniale de 1902 a aussi séparé les Iteso entre l’Ouganda et le Kenya.",
    ],
    entities: [
      { kind: "people", id: "PPL_ITESO", label: "Iteso" },
      { kind: "country", id: "UGA", label: "Ouganda" },
      { kind: "country", id: "KEN", label: "Kenya" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Ateso (teo)",
        url: "https://www.ethnologue.com/language/teo/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste les appellations Teso, Bakedi et Wamia et la répartition Ouganda-Kenya. Le sens de Bakedi et son caractère péjoratif sont rapportés par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "datoga-mangati",
    headline:
      "Les Datooga sont aussi appelés Mang’ati, un nom interprété comme « les ennemis ».",
    body: [
      "Les Maasai et plusieurs peuples voisins de langue bantoue emploient Mang’ati pour désigner les Datooga. Le sens rapporté pour ce nom évoque les relations entre ces peuples.",
      "Barabaig, un autre nom courant, désigne le plus grand de leurs sous-groupes. Les Datooga en comptent au moins dix. Employer le nom d’un seul sous-groupe pour l’ensemble peut donc créer une confusion.",
    ],
    entities: [
      { kind: "people", id: "PPL_DATOGA", label: "Datooga" },
      { kind: "country", id: "TZA", label: "Tanzanie" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Datooga (tcc)",
        url: "https://www.ethnologue.com/language/tcc/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne Datooga, Tatog et Barabaig, et précise les liens entre le peuple et ses sous-groupes.",
      },
      {
        title: "Glottolog — Datooga (dato1239)",
        url: "https://glottolog.org/resource/languoid/id/dato1239",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "azande-niamniam",
    headline:
      "Un nom méprisant donné aux Azande se retrouve dans le nom d’une plante.",
    body: [
      "Azande est interprété comme « ceux qui possèdent beaucoup de terre ». Au XIXe siècle, des explorateurs européens ont repris Niam-Niam, un nom employé par des voisins arabes. Il aurait imité le bruit d’une bouche qui mange et associait les Azande à une accusation de cannibalisme.",
      "Le nom a ensuite circulé dans d’autres usages. Le mot turc yamyam en serait issu, et une plante porte encore le nom scientifique Impatiens niamniamensis. Ces mots gardent ainsi la trace d’une réputation attribuée aux Azande.",
    ],
    entities: [
      { kind: "people", id: "PPL_AZANDE_SUD", label: "Azande" },
      { kind: "country", id: "SSD", label: "Soudan du Sud" },
      { kind: "country", id: "COD", label: "République démocratique du Congo" },
      { kind: "country", id: "CAF", label: "République centrafricaine" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Evans-Pritchard, E. E. — Witchcraft, Oracles and Magic Among the Azande. Oxford University Press, 1937",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "L'ethnographie de référence sur les Azande, et la source de la distinction entre le peuple et la réputation qu'on lui a faite.",
      },
      {
        title: "SIL Ethnologue — Zande (zne)",
        url: "https://www.ethnologue.com/language/zne/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne le nom du peuple et ses variantes, dont Niam-Niam, présenté comme un nom méprisant.",
      },
    ],
  },
  {
    id: "wonnin-godie",
    headline:
      "Le nom Godié viendrait d’un surnom donné par les voisins des Wonnin.",
    body: [
      "La fiche des Wonnin rapproche Godié du mot néyo Gwèdji, qui associerait « chimpanzé » et « panthère » pour évoquer un caractère jugé combatif. Selon cette explication, les Néyo auraient donné ce surnom à leurs voisins. La forme française Godié est employée sur les cartes, dans les recensements et pour identifier la langue.",
      "Wonnin est le nom que le groupe emploie pour se désigner. Les deux noms coexistent donc, mais ils n’occupent pas la même place dans les documents officiels et les usages des personnes concernées.",
    ],
    entities: [
      { kind: "people", id: "PPL_WONNIN", label: "Wonnin (Godié)" },
      { kind: "country", id: "CIV", label: "Côte d'Ivoire" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Godié (god)",
        url: "https://www.ethnologue.com/language/god/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste l'appellation Godié et ses variantes. L'étymologie néyo Gwèdji est rapportée par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "murle-moden",
    headline: "Les voisins des Murle les appellent par plusieurs noms.",
    body: [
      "Les documents coloniaux britanniques relèvent Beir chez les Dinka, Jebe chez les Luo et les Nuer, et Ajibba chez les Anuak. Murle est le nom employé par les personnes concernées pour se désigner.",
      "La fiche rapporte qu’en murle, moden désigne les personnes qui ne sont pas murle, avec les sens d’étranger et d’ennemi. Les noms employés de part et d’autre peuvent ainsi exprimer la manière dont chacun perçoit ses voisins.",
    ],
    entities: [
      { kind: "people", id: "PPL_MURLE", label: "Murle" },
      { kind: "country", id: "SSD", label: "Soudan du Sud" },
      { kind: "country", id: "ETH", label: "Éthiopie" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "WALS Online — Murle (ISO 639-3 : mur)",
        url: "https://wals.info/languoid/lect/wals_code_mrl",
        tier: "official",
        source_kind: "linguistic_reference",
      },
      {
        title: "Glottolog — Murle (murl1244)",
        url: "https://glottolog.org/resource/languoid/id/murl1244",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne le nom du peuple et les noms employés par ses voisins. Le sens de moden est rapporté par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "kirdi-paien",
    headline:
      "Kirdi a été employé pour regrouper plus de quarante peuples non musulmans.",
    body: [
      "Le nom est rattaché au kanouri-haoussa et interprété comme « païen ». Des populations musulmanes du nord du Cameroun et du Tchad, dont les Peuls, les Mandaras et les Kotokos, l’emploient pour des voisins non musulmans. Le récit de voyage du major Denham, publié en 1826, mentionne la forme Kerdies.",
      "Le regroupement réunit des peuples aux langues et aux cultures différentes. Depuis les années 1990, un mouvement politique reprend le nom dans « Kirditude » pour affirmer une identité commune. Un mot donné de l’extérieur peut ainsi être réutilisé par des personnes qu’il désignait.",
    ],
    entities: [
      { kind: "people", id: "PPL_KIRDI", label: "Kirdi" },
      { kind: "country", id: "CMR", label: "Cameroun" },
      { kind: "country", id: "TCD", label: "Tchad" },
      { kind: "country", id: "NGA", label: "Nigeria" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Mafa (maf)",
        url: "https://www.ethnologue.com/language/maf/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste l'une des langues rassemblées sous l'étiquette. L'étymologie et la mention de Denham en 1826 sont rapportées par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "bambara-refus",
    headline: "Une explication rapproche Bambara de « ceux qui refusent ».",
    body: [
      "L’origine est discutée : le nom a été rapproché de l’arabe et du mandingue. Les sources du XVIIIe siècle citées dans la fiche lui donnent des sens comme « infidèle » ou « mécréant ». Des Mandingues musulmans l’employaient pour désigner les Bamana restés attachés à d’autres croyances.",
      "Bamana est le nom employé par les personnes concernées. Bambara désigne aujourd’hui aussi une langue parlée par des millions de personnes et utilisée dans les échanges entre peuples. Ces usages actuels ne portent pas toujours le jugement religieux rapporté dans les textes anciens.",
    ],
    entities: [
      { kind: "people", id: "PPL_BAMBARA", label: "Bambara (Bamana)" },
      { kind: "country", id: "MLI", label: "Mali" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Bambara (bam)",
        url: "https://www.ethnologue.com/language/bam/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne les formes Bambara et Bamana et l’usage de la langue dans les échanges entre peuples. Notre fiche rapporte une explication méprisante de l’origine du nom, tout en précisant qu’elle est discutée.",
      },
    ],
  },
  {
    id: "dogon-habe",
    headline: "Des textes anciens désignent les Dogon par le nom peul Habe.",
    body: [
      "La fiche rapporte que des Peuls emploient Habe pour des populations ayant refusé l’islamisation, avec des sens liés à l’étranger et au paysan. Le nom est décrit comme méprisant. Il apparaît régulièrement à la place de Dogon dans des références anciennes.",
      "Dogon s’est ensuite largement répandu, y compris chez les personnes concernées. Ce nom commun recouvre pourtant une douzaine de langues et une cinquantaine de variantes, dont beaucoup ne permettent pas de se comprendre. Les liens entre les Dogon sont donc aussi culturels et territoriaux.",
    ],
    entities: [
      { kind: "people", id: "PPL_DOGON", label: "Dogon" },
      { kind: "country", id: "MLI", label: "Mali" },
      { kind: "country", id: "BFA", label: "Burkina Faso" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "UNESCO — Falaises de Bandiagara, pays dogon",
        url: "https://whc.unesco.org/fr/list/516/",
        tier: "official",
        source_kind: "intergovernmental",
        notes:
          "Décrit le territoire et emploie le nom Dogon. Le nom peul Habe et son sens sont rapportés par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "le-nom-est-une-reponse",
    headline:
      "Trois récits expliquent des noms de peuples par une réponse mal comprise.",
    body: [
      "Un récit rapproche Frafra, employé sous l’administration britannique pour les Nankana du Ghana, de la salutation en gurune Ya fara fara ?, « comment va ton travail, ta peine ? ». Une formule de politesse aurait ainsi été prise pour un nom de peuple.",
      "Un autre récit rapproche Busanga, nom donné aux Bissa, de bisag gua, « homme bissa », une réponse à des Européens qui demandaient qui ils étaient. Les Ma'di du Nil rapportent une histoire semblable avec madi, « une personne ». Les fiches présentent ces explications comme des récits transmis, dont les détails restent à vérifier.",
    ],
    entities: [
      { kind: "people", id: "PPL_NANKANA", label: "Nankana (Frafra)" },
      { kind: "people", id: "PPL_BISSA", label: "Bissa" },
      { kind: "people", id: "PPL_MADI", label: "Ma'di" },
      { kind: "country", id: "GHA", label: "Ghana" },
      { kind: "country", id: "BFA", label: "Burkina Faso" },
      { kind: "country", id: "UGA", label: "Ouganda" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Farefare (gur)",
        url: "https://www.ethnologue.com/language/gur/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes: "Atteste l'appellation Frafra et ses variantes.",
      },
      {
        title: "SIL Ethnologue — Bisa (bib)",
        url: "https://www.ethnologue.com/language/bib/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes: "Atteste les formes Bissa, Busansi et Busanga.",
      },
      {
        title: "SIL Ethnologue — Ma'di (mhi)",
        url: "https://www.ethnologue.com/language/mhi/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne le nom du peuple. Les trois récits d’origine sont rapportés par nos fiches sur les peuples concernés, qui les présentent comme des récits transmis.",
      },
    ],
  },
  {
    id: "guere-wobe",
    headline: "Wè, Guéré, Wobé et Krahn sont liés à une même histoire de noms.",
    body: [
      "Wè est le nom employé par les personnes concernées. Les sources citées l’interprètent comme « les hommes qui pardonnent facilement ». Guéré aurait été introduit par un administrateur colonial français. L’administration a ensuite distingué Guéré au sud et Wobé au nord, sans que cette séparation corresponde aux limites culturelles et linguistiques décrites dans ces sources.",
      "Au Liberia, les voisins kru emploient Krahn. Ces noms montrent comment des populations proches ont été désignées différemment de part et d’autre de la frontière coloniale. Les catégories administratives ont ensuite influencé la façon de les présenter.",
    ],
    entities: [
      { kind: "people", id: "PPL_GUERE", label: "Guéré" },
      { kind: "people", id: "PPL_WE", label: "Wè" },
      { kind: "country", id: "CIV", label: "Côte d'Ivoire" },
      { kind: "country", id: "LBR", label: "Liberia" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Holsoe, S. E. & Lauer, J. — « Who Are the Kran/Guere and the Gio/Yacouba? », African Studies Review 19(1), 1976",
        url: "https://www.cambridge.org/core/journals/african-studies-review/article/who-are-the-kranguere-and-the-gioyacouba-ethnic-identifications-along-the-liberiaivory-coast-border/4E33CA4D6CDC5962A21AEE535A3E10AD",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "L'article qui pose la question de l'identité de ce groupe de part et d'autre de la frontière Liberia-Côte d'Ivoire.",
      },
      {
        title: "SIL Ethnologue — Wè Southern (gxx)",
        url: "https://www.ethnologue.com/language/gxx/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes: "Atteste les appellations Wè, Guéré, Wobé et Krahn.",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms que l'administration a créés
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "bamileke-cent-royaumes",
    headline:
      "Le nom Bamiléké a été employé pour regrouper une centaine de royaumes.",
    body: [
      "L’administration coloniale du Kamerun utilise ce nom à partir de 1884 pour des populations des hauts plateaux de l’Ouest. Son origine reste discutée. Une explication propose « les gens du bas », en lien avec la position d’arrivants venus des plaines du nord.",
      "Ces populations comptent une centaine de royaumes, appelés fondoms, avec leurs langues, leurs chefs et leurs histoires. Les habitants peuvent se désigner par le nom de leur fondom. Le regroupement sous « Bamiléké » rend cette diversité moins visible et a aussi été utilisé dans les tensions politiques après l’indépendance.",
    ],
    entities: [
      { kind: "people", id: "PPL_BAMILEKE", label: "Bamiléké" },
      { kind: "country", id: "CMR", label: "Cameroun" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — sous-groupe bamiléké",
        url: "https://www.ethnologue.com/subgroup/589/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste la pluralité des langues rassemblées sous l'étiquette. L'origine administrative allemande et l'étymologie débattue sont rapportées par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "sara-douzaine",
    headline:
      "Le nom Sara regroupe plusieurs peuples qui ont leurs propres noms.",
    body: [
      "Sara a été employé de l’extérieur pour des peuples non musulmans du sud du Tchad parlant des langues proches. Les noms Ngambay, Sar et Mbay, entre autres, permettent de distinguer les groupes concernés.",
      "L’administration coloniale française a étendu l’usage du nom commun. Après l’indépendance, il a aussi pris une place dans la vie politique. Un regroupement administratif peut ainsi influencer la manière dont les populations sont ensuite présentées.",
    ],
    entities: [
      { kind: "people", id: "PPL_SARA", label: "Sara" },
      { kind: "country", id: "TCD", label: "Tchad" },
      { kind: "country", id: "CAF", label: "République centrafricaine" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Ngambay (sba)",
        url: "https://www.ethnologue.com/language/sba/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste l'une des langues rassemblées sous l'étiquette et le nom que ce groupe se donne.",
      },
      {
        title: "Glottolog — Ngambay (ngam1268)",
        url: "https://glottolog.org/resource/languoid/id/ngam1268",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "bete-plantation",
    headline:
      "L’administration coloniale a regroupé 93 sous-groupes sous le nom Bété.",
    body: [
      "Jean-Pierre Dozon rapporte deux explications recueillies à Gagnoa. Le nom viendrait de « bete o bete o », « paix » ou « pardon », une expression que les Français auraient prise pour un nom de peuple pendant la conquête. Il pourrait aussi avoir été diffusé depuis les premiers postes coloniaux de l’ouest. Ces deux récits ne s’excluent pas nécessairement.",
      "Les 93 sous-groupes réunis sous ce nom ne formaient pas un ensemble politique unique avant la colonisation. Dozon présente aussi la proposition Magwé de Louhoy Téty Gauze, qui décrit une origine commune à plusieurs peuples du sud-ouest. Aucune des personnes interrogées par Dozon à Gagnoa n’avait toutefois cité ce nom.",
    ],
    entities: [
      { kind: "people", id: "PPL_BETE", label: "Bété" },
      { kind: "country", id: "CIV", label: "Côte d'Ivoire" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Dozon, Jean-Pierre — La société bété : histoires d'une ethnie de Côte d'Ivoire. Karthala / ORSTOM, 1985",
        url: "https://www.documentation.ird.fr/hor/fdi:17296",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Étudie comment le regroupement bété s’est formé au fil de l’histoire. Rapporte les explications recueillies à Gagnoa et la proposition Magwé de Téty Gauze.",
      },
      {
        title: "Ethnologue — Bété, Daloa (bev)",
        url: "https://www.ethnologue.com/language/bev/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste que trois langues distinctes portent aujourd'hui le nom bété.",
      },
    ],
  },
  {
    id: "bassa-nge-distinction",
    headline:
      "Le nom Bassa Nge a servi à distinguer deux peuples appelés Bassa.",
    body: [
      "Les Bassa Nge, d’origine nupe, et les Bassa Komu, dont la langue appartient au groupe benue-congo, ont migré à des périodes proches vers la province coloniale britannique de Bassa. Employer Bassa seul pouvait créer une confusion entre eux.",
      "Les administrateurs ont ajouté Nge, un mot nupe, pour les distinguer. Ce nom est resté en usage. Cet exemple montre qu’un nom administratif peut aussi servir à différencier des groupes.",
    ],
    entities: [
      { kind: "people", id: "PPL_BASSA_NIGERIA", label: "Bassa Nge" },
      { kind: "country", id: "NGA", label: "Nigeria" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Glottolog — langues nupoïdes (nupo1239)",
        url: "https://glottolog.org/resource/languoid/id/nupo1239",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste le rattachement nupe des Bassa Nge, et donc leur distance d'avec les Bassa Komu.",
      },
      {
        title: "SIL Ethnologue — Nupe-Nupe-Tako (nup)",
        url: "https://www.ethnologue.com/language/nup/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "tswa-recensement",
    headline:
      "Les Vatswa peuvent être regroupés avec les Tsonga dans les recensements.",
    body: [
      "La fiche rapporte que les recensements mozambicains comptent les Vatswa avec les Tsonga. Shangaan, un nom tiré de celui du chef Soshangane, leur a aussi été appliqué, bien qu’ils soient présents avant son empire.",
      "Ces regroupements rendent les Vatswa moins visibles dans les chiffres publiés. La fiche rattache cette confusion aux usages de l’administration coloniale portugaise, qui écrivait Tshwa. Il faut donc regarder les catégories du recensement avant d’interpréter ses nombres.",
    ],
    entities: [
      { kind: "people", id: "PPL_TSWA_MOZ", label: "Vatswa" },
      { kind: "people", id: "PPL_RONGA", label: "Ronga" },
      { kind: "country", id: "MOZ", label: "Mozambique" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Tswa (tsc)",
        url: "https://www.ethnologue.com/language/tsc/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste le xitswa comme langue distincte et ses appellations concurrentes.",
      },
      {
        title: "CLEAR Global — Language data for Mozambique (2024)",
        url: "https://clearglobal.org/language-data-for-mozambique/",
        tier: "referenced",
        source_kind: "linguistic_reference",
        notes:
          "Documente l'écart entre les langues effectivement parlées et les catégories du recensement.",
      },
    ],
  },
  {
    id: "hutu-cartes-identite",
    headline:
      "L’origine du nom Hutu reste discutée, malgré son usage dans les classements coloniaux.",
    body: [
      "Ernest Viaene propose en 1910 le sens d’« esclave ». René Bourgeois conteste cette explication et propose « seigneurs », en rapprochant le nom de Bahoto et Bawoto, employés pour des dirigeants chez les Mongo du Congo. Les personnes concernées utilisent Abahutu.",
      "L’administration coloniale belge a ensuite inscrit la distinction Hutu-Tutsi dans les cartes d’identité et l’a traitée comme une hiérarchie fixe. La fiche mentionne notamment le nombre de vaches possédées parmi les critères utilisés. L’origine discutée du mot et son emploi administratif sont deux questions distinctes.",
    ],
    entities: [
      { kind: "people", id: "PPL_KIRUNDI_HUTU", label: "Hutu" },
      { kind: "country", id: "RWA", label: "Rwanda" },
      { kind: "country", id: "BDI", label: "Burundi" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "United States Holocaust Memorial Museum — Divided by Ethnicity: Rwanda",
        url: "https://www.ushmm.org/genocide-prevention/countries/rwanda/divided-by-ethnicity",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Atteste l'institution des cartes d'identité ethniques par l'administration coloniale belge et ses critères.",
      },
      {
        title: "SIL Ethnologue — Kirundi (run)",
        url: "https://www.ethnologue.com/language/run",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste la langue commune aux trois catégories. Les deux étymologies concurrentes sont rapportées par notre fiche sur ce peuple, qui les donne pour débattues.",
      },
    ],
  },
  {
    id: "kasem-gurunsi",
    headline:
      "Un récit rapproche Gurunsi d’une formule de protection employée pour des soldats.",
    body: [
      "Selon l’explication rapportée ici, le mot viendrait du djerma et signifierait « le fer ne pénètre pas ». Il aurait désigné des soldats recrutés par le chef de guerre Babatu dans les années 1890. La formule évoquerait leur réputation de résistance aux armes.",
      "Les administrations européennes ont repris Gurunsi pour regrouper des populations. Les Kasena en font partie, sans partager une langue et une culture proches avec tous les groupes ainsi nommés. La frontière franco-britannique de 1898 les a aussi répartis entre les territoires devenus le Ghana et le Burkina Faso.",
    ],
    entities: [
      { kind: "people", id: "PPL_KASENA", label: "Kasena" },
      { kind: "country", id: "GHA", label: "Ghana" },
      { kind: "country", id: "BFA", label: "Burkina Faso" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Kasem (xsm)",
        url: "https://www.ethnologue.com/language/xsm/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Décrit la langue, le nom Kasena employé par les personnes concernées et leur présence des deux côtés de la frontière.",
      },
      {
        title: "WALS Online — Kasem",
        url: "https://wals.info/languoid/lect/wals_code_ksm",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms que le commerce a laissés
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "dioula-metier",
    headline: "Le nom Dioula serait lié au commerce.",
    body: [
      "Dioula est rapproché d’un mot mandingue qui signifie « marchand » ou « commerçant itinérant ». Il aurait été appliqué à des communautés mandé musulmanes spécialisées dans le commerce à longue distance, puis serait devenu un nom de peuple. Wangara apparaît aussi dans les récits sur ces réseaux, mais les deux noms ne désignent pas toujours exactement les mêmes groupes.",
      "Jula et Dyula sont d’autres façons d’écrire le nom. Julakan désigne la langue, et non « les gens du commerce » : kan signifie ici « langue ». Il faut aussi distinguer Dioula de Diola, employé en Casamance pour un autre peuple et une autre langue.",
    ],
    entities: [
      { kind: "people", id: "PPL_DIOULA", label: "Dioula" },
      { kind: "country", id: "CIV", label: "Côte d'Ivoire" },
      { kind: "country", id: "BFA", label: "Burkina Faso" },
      { kind: "country", id: "MLI", label: "Mali" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Jula (dyu)",
        url: "https://www.ethnologue.com/language/dyu/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste les graphies Dioula, Jula, Dyula et l'aire des réseaux marchands.",
      },
      {
        title:
          "Chikouna Cissé, Entre descriptions (pré)coloniales et descriptions de soi. La fabrique de l'identité jula au fil des enquêtes en Afrique de l'Ouest (XVIe–XIXe siècles), À propos 1, 2025",
        url: "https://www.ouvroir.fr/apropos/index.php?id=100",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Cite François-Xavier Fauvelle et Jean Bazin sur le glissement sémantique de Wangara vers Jula, du nom d'un groupe vers celui d'une spécialisation professionnelle.",
      },
      {
        title:
          "Yaya Konaté, Le dioula véhiculaire : situation sociolinguistique en Côte d'Ivoire, Corela 14-1, 2016",
        url: "https://doi.org/10.4000/corela.4586",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Article fondé sur des enquêtes de terrain : les interlocuteurs de l'auteur traduisent jula par « commerçant ».",
      },
      {
        title:
          "Paul E. Lovejoy, The Role of the Wangara in the Economic Transformation of the Central Sudan in the Fifteenth and Sixteenth Centuries, The Journal of African History 19(2), 1978, pp. 173-193",
        url: "https://www.cambridge.org/core/journals/journal-of-african-history/article/abs/role-of-the-wangara-in-the-economic-transformation-of-the-central-sudan-in-the-fifteenth-and-sixteenth-centuries/1DB11290A76E4158CE5E60EB0CB0E4B9",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Conteste, pour le Soudan central et le pays haoussa, l'équivalence courante entre Wangara et Jula : y décrit les Wangara comme une diaspora commerciale distincte, liée à l'empire Songhaï. Résumé consulté, texte intégral non lu.",
      },
    ],
  },
  {
    id: "teke-vendre",
    headline: "Le nom Teke est rapproché d’un verbe qui signifie « vendre ».",
    body: [
      "Cette explication rattache le nom aux activités commerciales du peuple. Les formes BaTeke et MuTeke désignent respectivement plusieurs personnes et une seule. Leur sens est présenté comme « ceux du commerce ».",
      "Comme pour le nom Dioula, l’explication proposée fait un lien entre un nom de peuple et le commerce. La ressemblance entre ces récits ne signifie pas que les deux noms ont une origine commune.",
    ],
    entities: [
      { kind: "people", id: "PPL_TEKE_NORD", label: "Teke" },
      { kind: "country", id: "COG", label: "Congo" },
      { kind: "country", id: "GAB", label: "Gabon" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Teke-Tege (teg)",
        url: "https://www.ethnologue.com/language/teg/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne le nom du peuple et les formes qui changent selon qu’il s’agit d’une ou de plusieurs personnes. L’explication du sens est rapportée par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "tetela-watetera",
    headline:
      "« Batetela » apparaît dans des revues européennes entre 1885 et 1887.",
    body: [
      "La fiche rattache ce mot à Watetera, un terme arabe employé pour des populations du Maniema à l’époque du commerce esclavagiste. Des explorateurs l’auraient fait entrer dans les publications européennes. Cette origine demande encore une source consacrée au nom lui-même.",
      "La fiche propose une autre explication pour Motetela, employé par les personnes concernées. Il serait lié à une divinité locale et signifierait « celui qui ne rit pas » ou « celui dont on ne peut se moquer ». Les deux noms renvoient ainsi à des récits différents.",
    ],
    entities: [
      { kind: "people", id: "PPL_TETELA", label: "Tetela" },
      { kind: "country", id: "COD", label: "République démocratique du Congo" },
    ],
    tier: "unverified",
    sources: [
      {
        title: "Tangaza University — A Collection of 100 Tetela Proverbs",
        url: "https://afriprov.tangaza.ac.ke/wp-content/uploads/2008/11/ebooks_tetela.pdf",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Ce recueil de proverbes présente la langue tetela. Il ne donne pas l’origine du nom du peuple. Les deux explications viennent de notre fiche et demandent encore une source consacrée à cette question.",
      },
    ],
  },
  {
    id: "tabwa-attache",
    headline: "Le nom Tabwa viendrait d’un verbe signifiant « être attaché ».",
    body: [
      "Cette explication renvoie à la période où les Tabwa ont subi la traite esclavagiste. La fiche la présente comme une origine possible du nom, qui demande encore à être vérifiée.",
      "Elle décrit aussi plusieurs villages aux histoires différentes, regroupés sous un même nom par l’administration belge. Les Tabwa et les Lungu voisins sont parfois confondus dans les sources. Leur regroupement et l’origine de leur nom doivent donc être examinés séparément.",
    ],
    entities: [
      { kind: "people", id: "PPL_TABWA", label: "Tabwa" },
      { kind: "country", id: "COD", label: "République démocratique du Congo" },
      { kind: "country", id: "ZMB", label: "Zambie" },
    ],
    tier: "unverified",
    sources: [
      {
        title:
          "Roberts, Allen F. — The Rising of a New Moon: A Century of Tabwa Art. University of Michigan Museum of Art, 1985",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Étude sur les Tabwa et le rôle de la colonisation dans la formation de leur identité. Notre fiche présente « être attaché » comme une origine possible du nom, qui reste à vérifier.",
      },
      {
        title: "SIL Ethnologue — Taabwa (tap)",
        url: "https://www.ethnologue.com/language/tap/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "angolar-naufrage",
    headline:
      "Un récit relie les Angolares de São Tomé au naufrage d’un navire venu d’Angola.",
    body: [
      "La tradition rapporte qu’un navire négrier aurait fait naufrage près des côtes sud de l’île vers 1540. Les survivants auraient fondé dans les forêts une communauté de personnes ayant échappé à l’esclavage. Le nom Angolares est rapproché de l’Angola, présenté dans ce récit comme la région d’origine de leurs ancêtres.",
      "Ce nom désigne une communauté précise et ne s’applique pas à toutes les personnes qui parlent une langue créole sur l’île. La fiche rappelle aussi que les Angolares ont longtemps été dévalorisés dans la société de São Tomé.",
    ],
    entities: [
      { kind: "people", id: "PPL_ANGOLAR", label: "Angolares" },
      { kind: "country", id: "STP", label: "São Tomé-et-Príncipe" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Bouyer et al. — The Genes of Freedom: Genome-Wide Insights into Marronage (2021)",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8229774/",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Étude génomique de la communauté angolar, qui discute le récit du naufrage et l'origine angolaise des ancêtres.",
      },
      {
        title: "SIL Ethnologue — Angolar (aoa)",
        url: "https://www.ethnologue.com/language/aoa/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "crioulo-cap-vert",
    headline: "Au Cap-Vert, le sens de crioulo a changé au fil de l’histoire.",
    body: [
      "En portugais, crioulo désignait d’abord les esclaves africains nés dans les colonies, puis les personnes d’ascendance mixte. Le mot était donc lié aux catégories de la société coloniale.",
      "Au Cap-Vert, son usage s’est étendu à l’ensemble de la population. Il sert à exprimer une identité nationale commune et à nommer la langue parlée dans l’archipel. Le sens actuel ne se limite donc plus à l’ancien statut colonial.",
    ],
    entities: [
      { kind: "people", id: "PPL_CREOLE_CABOVERDIEN", label: "Cap-Verdiens" },
      { kind: "country", id: "CPV", label: "Cap-Vert" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Cape Verdean Creole (kea)",
        url: "https://www.ethnologue.com/language/kea/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste le kabuverdianu comme langue de l'archipel et ses appellations.",
      },
      {
        title: "JSTOR Daily — Cape Verde's Dilemma(s)",
        url: "https://daily.jstor.org/cape-verdes-dilemmas/",
        tier: "referenced",
        source_kind: "unknown",
        notes:
          "Revient sur l'enjeu politique du rattachement identitaire au moment de l'indépendance.",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms que le lieu a donnés
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "kavango-riviere",
    headline: "Le nom vaKavango est lié au fleuve Okavango.",
    body: [
      "Dans cette région, l’Okavango marque la frontière entre la Namibie et l’Angola. Le nom vaKavango est rattaché à ce fleuve. La région administrative namibienne de Kavango, divisée en Kavango Est et Kavango Ouest en 2013, reprend également ce nom.",
      "Le même nom sert ainsi à parler du fleuve, des populations riveraines et de régions administratives. Le contexte permet de savoir lequel de ces sens est employé.",
    ],
    entities: [
      { kind: "people", id: "PPL_KAVANGO", label: "vaKavango" },
      { kind: "country", id: "NAM", label: "Namibie" },
      { kind: "country", id: "AGO", label: "Angola" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Kwangali (kwn)",
        url: "https://www.ethnologue.com/language/kwn/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste la langue et la localisation riveraine. Le rapport de nom entre la rivière, le peuple et la région est rapporté par notre fiche sur ce peuple.",
      },
    ],
  },
  {
    id: "kaonde-riviere",
    headline: "Deux récits relient le nom Kaonde à une défaite militaire.",
    body: [
      "La tradition rapporte que le chef lunda Musokantanda aurait vaincu le chef Mushima et l’aurait surnommé Mushima wa Kaonde, « Mushima de la rivière Kaonde ». Le nom viendrait ainsi d’un affluent de la Mukwizhi, près duquel Mushima se trouvait.",
      "Une autre explication propose « le mince » ou « le petit nombre », en référence à la même défaite. Les deux récits donnent un rôle au vainqueur dans le choix du nom, mais ne lui attribuent pas le même sens.",
    ],
    entities: [
      { kind: "people", id: "PPL_KAONDE", label: "Kaonde" },
      { kind: "country", id: "ZMB", label: "Zambie" },
      { kind: "country", id: "COD", label: "République démocratique du Congo" },
    ],
    tier: "unverified",
    sources: [
      {
        title: "Kaonde — DICE Database, University of Missouri",
        url: "https://dice.missouri.edu/assets/docs/niger-congo/Kaonde.pdf",
        tier: "referenced",
        source_kind: "linguistic_reference",
        notes:
          "Fiche sur la langue kaonde. Notre fiche du peuple rapporte deux récits d’origine transmis par la tradition. Les sources réunies ici ne permettent pas de choisir entre eux.",
      },
    ],
  },
  {
    id: "manianga-marche",
    headline: "Le nom Manianga est expliqué par deux récits différents.",
    body: [
      "Van Bulck le rapproche d’un marché fondé près de Kimbanza par l’ancêtre Volumina. Ce marché aurait été le seul de la région à subsister à l’époque coloniale. Monnier et Wiliame rapportent plutôt un surnom employé par Stanley et ses compagnons en 1881 près des chutes de Mpioka, pour des personnes appelées Sundi.",
      "Dans ces deux explications, Manianga n’aurait donc pas été à l’origine un nom de peuple. Ba-sundi reste un nom employé pour le groupe ; ba- indique le pluriel des personnes. Les récits ne donnent toutefois pas la même origine à Manianga.",
    ],
    entities: [
      { kind: "people", id: "PPL_MANIANGA", label: "Manianga (Ba-sundi)" },
      { kind: "country", id: "COD", label: "République démocratique du Congo" },
      { kind: "country", id: "COG", label: "Congo" },
    ],
    tier: "unverified",
    sources: [
      {
        title: "SIL Ethnologue — Kikongo (kon)",
        url: "https://www.ethnologue.com/language/kon",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste la langue et le rattachement kongo. Les deux hypothèses sur l'origine du nom sont rapportées par notre fiche sur ce peuple d'après Van Bulck d'une part, Monnier et Wiliame d'autre part, sans arbitrage.",
      },
    ],
  },
  {
    id: "gorowa-village-voisin",
    headline: "Les Gorwaa portent aussi des noms donnés par leurs voisins.",
    body: [
      "Kimbulu, ou Mbulu, serait emprunté au nom du principal village iraqw. Fiome et Ufiomi sont employés en swahili. Les Datooga, des éleveurs voisins, utilisent Gobreik pour les anciens groupes d’agriculteurs de langue couchitique auxquels la fiche rattache les Gorwaa et les Iraqw.",
      "La fiche rapporte qu’en ville, de jeunes Gorwaa se présentent eux-mêmes comme Mbulu. Un nom venu des voisins peut donc être adopté par les personnes concernées, tout en rendant moins visible la distinction entre les groupes.",
    ],
    entities: [
      { kind: "people", id: "PPL_GOROWA", label: "Gorwaa" },
      { kind: "country", id: "TZA", label: "Tanzanie" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Harvey, Andrew — Gorwaa (Tanzania), Language Documentation and Description",
        url: "https://www.lddjournal.org/article/1200/galley/2445/download/",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Documentation de terrain qui relève les appellations concurrentes et le glissement urbain vers Mbulu.",
      },
      {
        title: "SIL Ethnologue — Gorwaa (gow)",
        url: "https://www.ethnologue.com/language/gow/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "kalabari-calabar",
    headline:
      "La ressemblance entre Kalabari et Calabar a créé des confusions.",
    body: [
      "La fiche rapproche Kalabari d’un ancêtre nommé Perebo Kalabari, fils de Meinowei. Calabar est un nom efik qui désigne une ville du Cross River. Elle rapporte que les Portugais ont écrit Calabari et que les Britanniques ont employé Calabar, en rapprochant les deux noms.",
      "Les personnes concernées emploient aussi Awome. Elem Kalabari, le nom du principal lieu d’installation, est interprété comme « nouveau port d’expédition ». Ces explications distinguent le nom du peuple de ceux des lieux.",
    ],
    entities: [
      { kind: "people", id: "PPL_KALAIBARI", label: "Kalabari" },
      { kind: "country", id: "NGA", label: "Nigeria" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Alagoa, E. J. — A History of the Niger Delta. Onyoma Research Publications, 2009",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "L'histoire de référence du delta du Niger, et la source de la distinction entre Kalabari et Calabar.",
      },
      {
        title: "SIL Ethnologue — Kalabari (ijn)",
        url: "https://www.ethnologue.com/language/ijn/",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms que les savants ont donnés
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "omotique-fleuve-omo",
    headline: "Le nom des langues omotiques vient du fleuve Omo.",
    body: [
      "En 1963, Greenberg classe encore ces langues du sud-ouest de l’Éthiopie dans le groupe couchitique occidental. En 1969, Harold C. Fleming propose de les regrouper séparément au sein de l’ensemble afro-asiatique et de les appeler « omotiques », d’après le fleuve Omo. Les travaux de Bender, en 1971, contribuent à faire connaître ce classement.",
      "Ce nom de famille de langues ne signifie pas que les Bench, Dizi, Kafa, Wolaita, Gamo et Hamer se considèrent comme un seul peuple. Le classement reste aussi discuté : certains linguistes placent les langues mao et sud-omotiques en dehors de l’ensemble afro-asiatique.",
    ],
    entities: [
      {
        kind: "people",
        id: "PPL_OMOTIQUE_MACRO",
        label: "Peuples omotiques",
      },
      { kind: "family", id: "FLG_OMOTIQUE", label: "Langues omotiques" },
      { kind: "country", id: "ETH", label: "Éthiopie" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Bender, M. Lionel — Omotic: A New Afroasiatic Language Family. Southern Illinois University, 1975",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "L'ouvrage qui installe la famille omotique comme branche indépendante, après la proposition de Fleming.",
      },
      {
        title:
          "The Cambridge Handbook of Linguistic Typology — The Omotic Language Family",
        url: "https://www.cambridge.org/core/books/cambridge-handbook-of-linguistic-typology/omotic-language-family/376C86AD112F0E4C5F5677AE4F3DB5FA",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "État de la question, y compris les contestations de l'unité interne de la famille.",
      },
    ],
  },
  {
    id: "gur-mabia",
    headline: "Mabia est un nom proposé pour une partie des langues gur.",
    body: [
      "Koelle regroupe ces langues en 1854 sous le nom « North-Eastern High Sudan ». Elles sont ensuite appelées voltaïques, en référence au fleuve Volta, puis gur. Ces classements viennent des chercheurs et ne décrivent pas nécessairement une appartenance commune ressentie par les peuples concernés.",
      "En 2017, le linguiste Adams Bodomo propose Mabia pour le gur central. Il rapproche ce nom de ma-, « mère », et bia, « enfant », dans une forme ancienne de la langue reconstituée par les linguistes. Sa proposition emploie ainsi des mots de la famille de langues qu’il étudie et à laquelle appartient sa propre langue.",
    ],
    entities: [
      { kind: "people", id: "PPL_GUR_MACRO", label: "Peuples gur" },
      { kind: "family", id: "FLG_GUR", label: "Langues gur" },
      { kind: "country", id: "BFA", label: "Burkina Faso" },
      { kind: "country", id: "GHA", label: "Ghana" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Bodomo, Adams — Mabia: its etymological genesis, geographical spread, and some salient genetic features, 2017",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "La proposition de renommer Mabia le gur central, et l'argument étymologique ma- + bia.",
      },
      {
        title:
          "Kleinewillinghöfer, Ulrich — Gur-Adamawa relationship, Journal of West African Languages, 2014",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Situe la famille gur et la fragilité de ses contours, dont l'appellation dépend.",
      },
    ],
  },
  {
    id: "ronga-junod",
    headline:
      "Les travaux d’un chercheur suisse ont diffusé le nom Ronga en Europe.",
    body: [
      "Henri-Alexandre Junod, missionnaire et linguiste, étudie la langue à la fin du XIXe siècle. Ses travaux contribuent à installer Ronga dans les publications européennes. Il n’a pas inventé le mot : des sources portugaises du XVIe siècle mentionnaient déjà des chefferies rhonga autour de la baie de Delagoa, aujourd’hui baie de Maputo.",
      "Les recensements mozambicains et sud-africains ont ensuite regroupé les Ronga sous les noms Tsonga ou Shangaan. La place du xironga reste discutée : selon les classements, il est présenté comme une langue ou comme une variante du xitsonga.",
    ],
    entities: [
      { kind: "people", id: "PPL_RONGA", label: "Ronga" },
      { kind: "country", id: "MOZ", label: "Mozambique" },
    ],
    tier: "referenced",
    sources: [
      {
        title:
          "Junod, Henri-Alexandre — The Life of a South African Tribe, 1912-1913",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "L'ethnographie qui installe le vocabulaire dont la littérature ultérieure hérite.",
      },
      {
        title: "SIL Ethnologue — Ronga (rng)",
        url: "https://www.ethnologue.com/language/rng/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes: "Atteste le xironga comme langue et ses appellations voisines.",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms réfractés par les langues d'Europe
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "fulbe-quatre-noms",
    headline:
      "Peul, Fula, Fulani et Fellata sont des noms venus de plusieurs langues.",
    body: [
      "Peul viendrait du wolof Pel, repris en français. Fula serait passé par un terme mandingue, puis par l’anglais. Fulani est rattaché au haoussa et reste courant au Nigeria et en anglais. Fellata est employé en arabe au Soudan et au Tchad, notamment pour des personnes installées sur les routes du pèlerinage. Ce dernier nom peut véhiculer des stéréotypes négatifs.",
      "Les personnes concernées emploient Fulbe au pluriel et Pullo au singulier. Les autres noms racontent les contacts avec leurs voisins et les langues dans lesquelles leur histoire a été écrite.",
    ],
    entities: [
      {
        kind: "people",
        id: "PPL_FULANI_MASSINA",
        label: "Fulbe du Massina",
      },
      { kind: "country", id: "MLI", label: "Mali" },
      { kind: "country", id: "BFA", label: "Burkina Faso" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Fulfulde, Maasina (ffm)",
        url: "https://www.ethnologue.com/language/ffm/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste les appellations Peul, Fula, Fulani et Fulbe pour la même langue.",
      },
      {
        title: "Seydou, Christiane — La poésie pastorale peule. Karthala, 1977",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Travail de référence sur la langue et la tradition orale peules, et sur ce que le peuple nomme lui-même.",
      },
    ],
  },
  {
    id: "malinke-manden",
    headline:
      "Malinké, Mandinka, Mandingo et Maninka sont des noms liés au Manden.",
    body: [
      "Ces noms sont rattachés au Manden, région historique associée à l’empire du Mali. Malinké est la forme française. Maninka est employé en Guinée et au Mali ; Mandinka au Sénégal, en Gambie et en Guinée-Bissau. Mandingo est une forme anglaise héritée de la période coloniale, encore employée en Gambie et en Sierra Leone.",
      "Les usages varient donc selon les régions et les langues. La fiche évoque environ quinze millions de personnes et plusieurs langues distinctes dans le classement ISO 639-3. La ressemblance entre les noms ne suffit pas à décrire les liens entre toutes ces langues.",
    ],
    entities: [
      { kind: "people", id: "PPL_MALINKE", label: "Malinké" },
      { kind: "country", id: "MLI", label: "Mali" },
      { kind: "country", id: "GIN", label: "Guinée" },
      { kind: "country", id: "SEN", label: "Sénégal" },
      { kind: "country", id: "GMB", label: "Gambie" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — macrolangue mandingue (man)",
        url: "https://www.ethnologue.com/language/man/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste les formes concurrentes et le découpage en langues distinctes par l'ISO 639-3.",
      },
    ],
  },
  {
    id: "fang-reputation",
    headline:
      "La réputation attribuée aux Fang demande à être examinée avec prudence.",
    body: [
      "Les administrations française, allemande et espagnole ont employé les formes Pahouin, Pangwe et Pamue pour des personnes qui se nomment Fang. Pahouin est aujourd’hui jugé méprisant, notamment en raison des accusations de cannibalisme qui lui ont été associées.",
      "La fiche rapporte que des Fang auraient entretenu cette réputation pour tenir les visiteurs à distance. Elle ne cite toutefois pas de source consacrée à cette affirmation. Ce récit demande donc une vérification avant de pouvoir être retenu.",
    ],
    entities: [
      { kind: "people", id: "PPL_FANG_GABON", label: "Fang" },
      { kind: "country", id: "GAB", label: "Gabon" },
      { kind: "country", id: "GNQ", label: "Guinée équatoriale" },
      { kind: "country", id: "CMR", label: "Cameroun" },
    ],
    tier: "unverified",
    sources: [
      {
        title: "SIL Ethnologue — Fang (fan)",
        url: "https://www.ethnologue.com/language/fan/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne le nom du peuple et les différents noms employés pendant la colonisation.",
      },
      {
        title: "Smarthistory — Fang reliquary guardian figure",
        url: "https://smarthistory.org/fang-reliquary-figure/",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Présente les Fang et leur art. Notre fiche rapporte que cette réputation aurait été entretenue pour éloigner les visiteurs, mais ne cite pas de source consacrée à cette affirmation.",
      },
    ],
  },
  {
    id: "beti-cranes",
    headline:
      "Des crânes d’ancêtres ont été interprétés comme un signe de cannibalisme chez les Béti.",
    body: [
      "La fiche rapporte qu’en 1856, Paul Du Chaillu observe des crânes près des villages et y voit une preuve de cannibalisme. Elle les décrit comme des crânes d’ancêtres conservés dans un autre but. L’accusation a ensuite été reprise dans des textes et utilisée pour justifier la violence coloniale.",
      "Ces récits emploient Pahouin, une forme française rapprochée de Pangwe en allemand. Ce nom administratif regroupait Ewondo, Bulu, Fang, Eton et Bane. Il faut donc examiner à la fois les populations visées par le nom et les preuves avancées par les auteurs.",
    ],
    entities: [
      { kind: "people", id: "PPL_BETI", label: "Béti" },
      { kind: "country", id: "CMR", label: "Cameroun" },
      { kind: "country", id: "GNQ", label: "Guinée équatoriale" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Ewondo (ewo)",
        url: "https://www.ethnologue.com/language/ewo/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste l'une des langues rassemblées sous l'étiquette Beti-Pahouin.",
      },
      {
        title: "SIL Ethnologue — Fang (fan)",
        url: "https://www.ethnologue.com/language/fan/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste l'autre. L'épisode Du Chaillu et la nature des crânes sont rapportés par notre fiche sur ce peuple.",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms que ceux qui les portent ont repris
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "khwe-penduka",
    headline:
      "La déclaration de Penduka recommande l’orthographe Khwe depuis 2000.",
    body: [
      "Les sources emploient plusieurs noms pour les Khwe du Kalahari et de l’Okavango, notamment Kxoe, Hukwe, Xun, Barakwena et Mbarakwena. Les documents coloniaux utilisaient aussi « Water Bushmen », en référence à leur vie près des cours d’eau. Plusieurs de ces noms sont jugés méprisants, et Bushmen est largement rejeté.",
      "En 2000, la déclaration de Penduka recommande une orthographe commune : Khwe. Cet exemple montre que les personnes concernées peuvent se réunir pour faire reconnaître la manière dont elles souhaitent écrire leur nom.",
    ],
    entities: [
      { kind: "people", id: "PPL_KXOE", label: "Khwe" },
      { kind: "country", id: "BWA", label: "Botswana" },
      { kind: "country", id: "NAM", label: "Namibie" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Glottolog — Kxoe (kxoe1243, ISO 639-3 : xuu)",
        url: "https://glottolog.org/resource/languoid/id/kxoe1243",
        tier: "official",
        source_kind: "linguistic_reference",
        notes: "Atteste la langue et les appellations concurrentes.",
      },
      {
        title:
          "Kilian-Hatz, Christa — Khwe Dictionary. Rüdiger Köppe Verlag, 2003",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Le dictionnaire de référence, publié sous l'orthographe recommandée par la déclaration de Penduka.",
      },
    ],
  },
  {
    id: "west-taa-masarwa",
    headline:
      "Les !Xoon sont connus sous des noms qui n’ont pas tous le même sens.",
    body: [
      "En taa, ǃama ʘʔâni est interprété comme « les gens de l’ouest ». Les voisins tswana emploient Masarwa, généralement jugé méprisant, ainsi que la variante régionale Magong. Les linguistes utilisent West Taa pour distinguer cette langue du !Xoon oriental étudié par Anthony Traill.",
      "Ces noms correspondent à des usages différents : celui des personnes concernées, celui de leurs voisins et celui des chercheurs. Les catalogues de langues reprennent surtout ce dernier.",
    ],
    entities: [
      { kind: "people", id: "PPL_WEST_TAA", label: "!Xoon occidental" },
      { kind: "country", id: "BWA", label: "Botswana" },
      { kind: "country", id: "NAM", label: "Namibie" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Taa (nmn)",
        url: "https://www.ethnologue.com/language/nmn/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Décrit la langue et mentionne !Xoon, employé par les personnes concernées, ainsi que Masarwa, donné par leurs voisins.",
      },
      {
        title: "Glottolog — West !Xoon (xooo1239)",
        url: "https://glottolog.org/resource/languoid/id/xooo1239",
        tier: "official",
        source_kind: "linguistic_reference",
      },
    ],
  },
  {
    id: "antambahoaka-surnom",
    headline: "Un récit relie Antambahoaka au surnom « aimé de son peuple ».",
    body: [
      "La tradition rapporte que Ravalarivo, présenté comme le fondateur, portait le surnom Ratiambahoaka. Le groupe constitué autour de lui aurait repris ce surnom, dont la forme aurait changé avec l’usage.",
      "La fiche mentionne aussi Zafiraminia, interprété comme « fils de Raminia ». Ce nom serait réservé aux membres initiés après la circoncision, lors du sambatra. Les deux noms ne s’appliqueraient donc pas exactement aux mêmes personnes ni aux mêmes circonstances.",
    ],
    entities: [
      { kind: "people", id: "PPL_ANTAMBAHOAKA", label: "Antambahoaka" },
      { kind: "country", id: "MDG", label: "Madagascar" },
    ],
    tier: "unverified",
    sources: [
      {
        title: "SIL Ethnologue — malgache (mlg)",
        url: "https://www.ethnologue.com/language/mlg/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Présente la langue et ses variantes. Notre fiche rapporte un récit transmis sur l’origine du nom, sans citer de source qui permette de le vérifier.",
      },
    ],
  },
  {
    id: "masa-banana",
    headline: "Le nom Banana donné aux Masa serait lié à leur hospitalité.",
    body: [
      "La fiche des Masa interprète Banana, employé dans plusieurs langues voisines, comme « amical ». Elle relie ce nom à leur réputation d’hospitalité. Yagoua, une autre appellation, vient du nom de leur ville principale au Cameroun.",
      "Les Masa sont aussi appelés Kirdi, un mot interprété comme « païen » et qu’ils rejettent. Les noms donnés à un même peuple peuvent donc exprimer des regards très différents.",
    ],
    entities: [
      { kind: "people", id: "PPL_MASA", label: "Masa" },
      { kind: "country", id: "TCD", label: "Tchad" },
      { kind: "country", id: "CMR", label: "Cameroun" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Masana (mcn)",
        url: "https://www.ethnologue.com/language/mcn/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Mentionne Masana, employé par les personnes concernées, ainsi que les noms Massa, Banana et Yagoua.",
      },
    ],
  },
  {
    id: "rendille-baton",
    headline:
      "Deux explications des noms des Rendille racontent des histoires différentes.",
    body: [
      "Le nom Rendille est interprété comme « porteurs du bâton de Dieu », en référence à un bâton sacré de chef. Le nom somali Rertit, rapproché de Reer Til, « les rejetés », évoquerait plutôt des personnes qui auraient refusé le territoire somali pour rester à Marsabit.",
      "La fiche rapporte aussi une distinction faite en somali entre les Rendille dits asil, ou « vrais » Rendille, et ceux qui parlent samburu. Ce classement exprime le regard de leurs voisins ; il ne permet pas de décider de l’identité des personnes concernées.",
    ],
    entities: [
      { kind: "people", id: "PPL_RENDILLE", label: "Rendille" },
      { kind: "country", id: "KEN", label: "Kenya" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Rendille (rel)",
        url: "https://www.ethnologue.com/language/rel/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes: "Atteste la langue et les appellations voisines.",
      },
      {
        title:
          "Schlee, Günther — Identities on the Move: Clanship and Pastoralism in Northern Kenya. Manchester University Press, 1989",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "L'étude de référence sur les identités et les appartenances claniques dans le nord du Kenya.",
      },
    ],
  },
  // ——————————————————————————————————————————————————————————————————————
  // Les noms dont l'étymologie célèbre ne tient pas
  // ——————————————————————————————————————————————————————————————————————
  {
    id: "kaffa-cafe",
    headline:
      "Le lien entre Kaffa et le mot « café » reste une hypothèse peu probable.",
    body: [
      "Le caféier pousse dans cette région d’Éthiopie, ce qui peut faire penser que le mot « café » vient du nom Kaffa. Les linguistes cités jugent toutefois ce rapprochement peu probable. La ressemblance entre un lieu et un mot ne suffit pas à établir leur lien.",
      "Kaffa désigne un peuple qui se nomme Kafficho, un ancien royaume et une zone administrative éthiopienne. Keffa est une façon de transcrire le nom amharique. Ces différents usages doivent être distingués de l’hypothèse sur le mot « café ».",
    ],
    entities: [
      { kind: "people", id: "PPL_KAFA", label: "Kafficho" },
      { kind: "country", id: "ETH", label: "Éthiopie" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Glottolog — Kafa (kafa1242)",
        url: "https://glottolog.org/resource/languoid/id/kafa1242",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Décrit la langue et le nom employé par les personnes concernées. Notre fiche rapporte les travaux de linguistes qui jugent peu probable le lien entre Kaffa et le mot « café ».",
      },
      {
        title: "Pankhurst, Richard — The Ethiopian Borderlands, 1997",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Histoire des marches éthiopiennes, dont le royaume de Kaffa et son incorporation.",
      },
    ],
  },
  {
    id: "bono-brong-ahafo",
    headline: "Brong est devenu le nom d’une région du Ghana en 1959.",
    body: [
      "Les personnes concernées se nomment Bono ou Bonofoɔ, interprété comme « les pionniers » ou « les premiers-nés de la terre ». Brong était employé par les Asante et les Gonja pour des populations situées entre les Asante et le Volta. L’administration britannique l’a repris. En Côte d’Ivoire, on rencontre aussi Abron.",
      "En 1959, le Ghana crée la région Brong-Ahafo, qui réunit des peuples d’origines différentes. Environ soixante ans plus tard, elle est divisée en Bono, Bono Est et Ahafo. Le nom Bono apparaît ainsi dans le nom officiel de deux régions.",
    ],
    entities: [
      { kind: "people", id: "PPL_BONO", label: "Bono" },
      { kind: "people", id: "PPL_BRONG", label: "Brong (Abron)" },
      { kind: "country", id: "GHA", label: "Ghana" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "SIL Ethnologue — Abron (abr)",
        url: "https://www.ethnologue.com/language/abr/",
        tier: "official",
        source_kind: "linguistic_reference",
        notes: "Atteste les formes Bono, Brong et Abron pour la même langue.",
      },
      {
        title:
          "Stahl, Ann Brower — Making History in Banda: Anthropological Visions of Africa's Past. Cambridge University Press, 2001",
        tier: "referenced",
        source_kind: "academic",
        notes:
          "Archéologie et histoire de la zone, et de ce que les découpages régionaux y ont recouvert.",
      },
    ],
  },
  {
    id: "toura-wen",
    headline:
      "Toura est employé officiellement, tandis que Wen reste utilisé au sein du peuple.",
    body: [
      "Toura est la forme adoptée par l’administration coloniale française et toujours employée officiellement en Côte d’Ivoire. Tura en est la variante en anglais. Les personnes concernées se nomment Wen ou Wenmebo.",
      "La fiche relève aussi une douzaine d’autres noms, dont Gwane, Nebou et Yaramassa, qui désignent des sous-groupes. Le nom officiel ne rend donc pas compte à lui seul de cette diversité.",
    ],
    entities: [
      { kind: "people", id: "PPL_TOURA", label: "Toura (Wen)" },
      { kind: "country", id: "CIV", label: "Côte d'Ivoire" },
      { kind: "country", id: "GIN", label: "Guinée" },
    ],
    tier: "referenced",
    sources: [
      {
        title: "Glottolog — Dan-Toura (dant1235)",
        url: "https://glottolog.org/resource/languoid/id/dant1235",
        tier: "official",
        source_kind: "linguistic_reference",
        notes:
          "Atteste le rattachement de la langue et les appellations concurrentes.",
      },
    ],
  },
];

function hasOfficialSource(fact: DidYouKnowFact): boolean {
  return fact.sources?.some((source) => source.tier === "official") ?? false;
}

/**
 * Draw one fact for this request.
 *
 * The home only publishes entries that name an official source. A bank with
 * no such entry renders no fact rather than silently widening the evidence
 * boundary. `random` is injected so tests stay deterministic without the
 * band losing its variation in production.
 */
// @req REQ-113
export function pickDidYouKnowFact(
  random: () => number = Math.random,
  facts: DidYouKnowFact[] = DID_YOU_KNOW_FACTS
): DidYouKnowFact | null {
  const eligible = facts.filter(hasOfficialSource);
  if (eligible.length === 0) return null;
  const index = Math.min(
    eligible.length - 1,
    Math.floor(random() * eligible.length)
  );
  return eligible[index];
}

/**
 * The fact a shared URL names, or null when it names one the bank dropped.
 *
 * A link a reader posted last month has to survive the anecdote being
 * renamed or retired; the page falls back to a fresh draw rather than to a
 * 404, because the address still points at a page that has something to say.
 */
// @req REQ-113
export function findDidYouKnowFact(
  factId: string | null | undefined,
  facts: DidYouKnowFact[] = DID_YOU_KNOW_FACTS
): DidYouKnowFact | null {
  if (!factId) return null;
  return facts.find((fact) => fact.id === factId) ?? null;
}

/**
 * The draw the loading interstitial uses: it knows what it showed last time.
 *
 * The loader is seen on every navigation, and a uniform draw over a bank this
 * small hands the reader the same fact twice in a row often enough to read as
 * broken — one navigation in six, and the reader concludes the loader is a
 * fixed image rather than a rotation. Excluding the previous fact costs one
 * parameter and removes the only failure a reader can actually notice.
 *
 * A single-fact bank repeats regardless: at that point showing it again beats
 * showing an empty wait.
 */
// @req REQ-104
export function pickNextDidYouKnowFact(
  previousId: string | null,
  random: () => number = Math.random,
  facts: DidYouKnowFact[] = DID_YOU_KNOW_FACTS
): DidYouKnowFact | null {
  const eligible = facts.filter(
    (entry) => entry.id !== previousId && hasOfficialSource(entry)
  );
  return pickDidYouKnowFact(random, eligible.length > 0 ? eligible : facts);
}
