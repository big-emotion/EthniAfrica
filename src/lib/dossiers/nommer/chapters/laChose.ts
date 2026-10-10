import type { DossierChapter } from "../types";

/**
 * Chapter five — the thing.
 *
 * The chapter that stops the dossier from being read as a list of grievances.
 * Five objects called African, five different trajectories, and none of the
 * five cells is called "inauthentic" — which is the point, because
 * "authentic" and "fake" is the colonial pair the whole dossier is trying to
 * get out from under.
 *
 * The kente entered this chapter by reversing the brief's own hypothesis. It
 * was proposed as a foreign object mistaken for an African one; it is the
 * opposite — an African cloth carrying a francophone exonym — which makes it
 * the mirror of the wax and completes the matrix rather than repeating it.
 */
// @req REQ-113
export const CHAPITRE_LA_CHOSE: DossierChapter = {
  key: "la-chose",
  ordinal: "05",
  title: "La chose",
  question:
    "Le wax, le café, le cacao, Mami Wata : lesquels sont africains, et en quel sens ?",
  standfirst: {
    id: "standfirst",
    text: "Le wax, le kente, le café, le cacao et Mami Wata ont des liens avec l’Afrique, mais leurs noms et leur histoire ont suivi des chemins différents. Ces exemples montrent comment des objets et des pratiques changent en passant d’un pays à l’autre.",
    sourceRefs: [],
    figureRefs: [],
  },
  measure: {
    value: "Cinq histoires",
    unit: "des liens différents avec l’Afrique",
    sourceRefs: [],
    figureRefs: [],
  },
  sections: [
    {
      id: "deux-questions-pas-une",
      stepLabel: "05 · La chose",
      heading: "D’où vient la chose et d’où vient son nom ?",
      blocks: [
        {
          id: "deux-questions",
          text: "Pour comprendre ces histoires, nous distinguons deux questions : d’où vient l’objet ou la pratique, et d’où vient son nom ? Les réponses peuvent être différentes. Elles aident à comprendre la place que ces objets et ces pratiques ont prise en Afrique.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
      table: {
        caption:
          "Cinq objets, et ce que chacun répond aux deux questions séparément",
        columns: ["Objet", "La chose vient de", "Le nom vient de"],
        rows: [
          {
            cells: [
              "Le wax",
              "Des Pays-Bas — imitation industrielle du batik javanais",
              "D'Afrique de l'Ouest : ce sont les acheteuses qui nomment les motifs",
            ],
            sourceRefs: ["vlisco-helmond", "trc-leiden-vlisco"],
            figureRefs: [],
          },
          {
            cells: [
              "Le kente, dit « pagne kita »",
              "Du Ghana et du Togo — tissé à la bande sur métier akan et éwé",
              "Du français d'Afrique de l'Ouest : « kita » recouvre nwentoma et kete",
            ],
            sourceRefs: ["conversation-kente", "kente-nwentoma"],
            figureRefs: [],
          },
          {
            cells: [
              "Le café",
              "D’Éthiopie, où Coffea arabica pousse dans la région de Kaffa",
              "De l'arabe qahwa, par le turc et l'italien, revenu sous forme européenne",
            ],
            sourceRefs: ["coffee-qahwa"],
            figureRefs: [],
          },
          {
            cells: [
              "Le cacao",
              "De Mésoamérique ; Tetteh Quarshie a contribué à sa diffusion en Gold Coast",
              "Du nahuatl, par l'espagnol",
            ],
            sourceRefs: ["cocobod-cocoa-story"],
            figureRefs: [],
          },
          {
            cells: [
              "Mami Wata",
              "D'Afrique — des divinités des eaux anciennes et multiples",
              "Peut-être d’une langue d’échange commercial ; l’image est liée à une affiche allemande",
            ],
            sourceRefs: ["mami-wata-pidgin", "drewal-2012"],
            figureRefs: [],
          },
        ],
      },
    },
    {
      id: "le-wax-et-le-kita",
      stepLabel: "05 · La chose",
      heading: "Le wax et le kita ont suivi des chemins différents",
      blocks: [
        {
          id: "le-wax-vient-de-helmond",
          text: "Les sources citées présentent le wax comme une imitation industrielle du batik javanais, mise au point à Helmond, aux Pays-Bas, à partir de 1846. L’impression au rouleau remplace le procédé qui protège certaines parties du tissu avec de la cire avant la teinture. Selon ces sources, les soldats revenus des Indes néerlandaises ont contribué à faire connaître ces tissus sur les côtes ouest-africaines.",
          sourceRefs: ["vlisco-helmond", "trc-leiden-vlisco"],
          figureRefs: [],
        },
        {
          id: "les-noms-donnes-sur-place",
          text: "Dans l’histoire rapportée ici, les motifs sont dessinés aux Pays-Bas, puis les femmes qui achètent et revendent les tissus en Afrique de l’Ouest leur donnent des noms. Ces noms contribuent au sens que les tissus prennent dans la vie locale. Leur fabrication et leur usage racontent donc deux parties de cette histoire.",
          sourceRefs: ["trc-leiden-vlisco"],
          figureRefs: [],
        },
        {
          id: "le-kente-et-ses-deux-noms",
          text: "Le kente est tissé en bandes sur des métiers akan et éwé, au Ghana et au Togo. Selon les explications citées, nwentoma signifie « tissu tissé » en akan, tandis que kente serait lié à kɛntɛn, « panier », en raison du motif. En éwé, kete serait formé à partir de ke, « ouvrir », et te, « presser », qui rappellent les gestes du tissage.",
          sourceRefs: ["conversation-kente", "kente-nwentoma"],
          figureRefs: [],
        },
        {
          id: "kita-ne-dit-rien",
          text: "Dans une partie de l’Afrique de l’Ouest francophone, ces tissus sont appelés « pagne kita ». Ce nom ne reprend pas directement les explications proposées pour les noms akan et éwé. Il montre comment un même tissu peut être connu sous plusieurs noms selon la langue employée.",
          sourceRefs: ["kente-nwentoma"],
          figureRefs: [],
        },
        {
          id: "deux-scandales-qui-nen-sont-pas",
          text: "Le wax a reçu des noms locaux après son arrivée en Afrique de l’Ouest. Le kente, tissé au Ghana et au Togo, est aussi connu sous un nom employé en français. Dans les deux cas, l’objet et ses noms ont circulé de façons différentes.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "le-cafe-et-le-cacao",
      stepLabel: "05 · La chose",
      heading:
        "Le café revient sous un autre nom, le cacao arrive par un Africain",
      blocks: [
        {
          id: "le-cafeier-ethiopien",
          text: "Coffea arabica pousse notamment dans la région éthiopienne de Kaffa. Selon la source citée, le mot « café » vient de l’arabe qahwa, passé par le turc kahve et les langues européennes avant de revenir en Afrique. En amharique, la même boisson porte le nom buna.",
          sourceRefs: ["coffee-qahwa"],
          figureRefs: [],
        },
        {
          id: "la-reserve-sur-kaffa",
          text: "Une autre explication rapproche « café » de Kaffa. La ressemblance entre les deux mots ne suffit toutefois pas à établir ce lien. La source citée juge cette origine peu probable : qahwa désignait déjà un vin en arabe plus d’un demi-millénaire avant l’existence du royaume de Kaffa.",
          sourceRefs: ["coffee-qahwa"],
          figureRefs: [],
        },
        {
          id: "ce-qui-reste-vrai",
          text: "L’origine géographique d’une plante ne donne donc pas nécessairement celle du mot qui la désigne. Pour « café », la source citée propose de suivre les échanges commerciaux et les langues par lesquelles le mot est passé.",
          sourceRefs: ["coffee-qahwa"],
          figureRefs: [],
        },
        {
          id: "le-cacao-et-tetteh-quarshie",
          text: "Le cacao vient de Mésoamérique et son nom serait passé du nahuatl à l’espagnol. Pour son arrivée en Gold Coast, les sources citées décrivent plusieurs étapes. Les missions de Bâle avaient essayé d’en cultiver à Aburi dès 1857. En 1879, le forgeron ghanéen Tetteh Quarshie rapporte des cabosses de Fernando Po et plante à Akuapim-Mampong. À partir de 1886, l’administration coloniale en diffuse à grande échelle depuis São Tomé.",
          sourceRefs: ["cocobod-cocoa-story", "basel-mission-cocoa"],
          figureRefs: [],
        },
        {
          id: "lattribution-se-discute",
          text: "Les historiens cités ne donnent pas tous le même rôle à ces personnes. L’un attribue l’introduction au révérend Hass. Un autre estime que Quarshie a surtout popularisé la culture du cacao. Quarshie avait lui-même été formé dans un atelier de la mission de Bâle. Les initiatives des missionnaires et des cultivateurs africains sont donc liées dans cette histoire.",
          sourceRefs: ["basel-mission-cocoa"],
          figureRefs: [],
        },
        {
          id: "trois-reponses-independantes",
          text: "Le cacao et son nom viennent d’ailleurs, mais des Africains ont joué un rôle dans sa diffusion. Savoir d’où vient la plante ne suffit pas à identifier la première personne qui l’a introduite dans chaque région.",
          sourceRefs: [],
          figureRefs: [],
        },
      ],
    },
    {
      id: "mami-wata",
      stepLabel: "05 · La chose",
      heading: "Mami Wata, ou la divinité au visage emprunté",
      blocks: [
        {
          id: "un-nom-de-pidgin",
          text: "Les divinités des eaux étaient connues sous différents noms selon les langues. Selon l’explication présentée ici, le nom commun Mami Wata se serait diffusé vers la fin du XIXe siècle. Il pourrait venir de « mother water », dans une langue d’échange issue des contacts commerciaux. Cette origine reste discutée.",
          sourceRefs: ["mami-wata-pidgin"],
          figureRefs: [],
        },
        {
          id: "laffiche-de-cirque",
          text: "La représentation de Mami Wata en femme au serpent est rapprochée d’une affiche de cirque imprimée en couleurs à Hambourg par la maison Adolph Friedländer vers 1885. Elle représentait une charmeuse de serpents connue sous le nom de Nala Damajanti.",
          sourceRefs: ["drewal-2012", "nala-damajanti"],
          figureRefs: [],
        },
        {
          id: "mathilde-poupon",
          text: "Selon la source citée, Nala Damajanti était le nom de scène de Mathilde Poupon, née en 1861 dans le Jura. Elle se produisait chez Barnum puis aux Folies Bergère et se présentait comme indienne ou originaire de Pondichéry. L’affiche aurait ensuite circulé sur les côtes africaines, où elle a été associée à l’esprit des eaux.",
          sourceRefs: ["nala-damajanti"],
          figureRefs: [],
        },
        {
          id: "trois-emprunts-empiles",
          text: "Cette histoire relie des divinités africaines, une artiste française, un imprimeur allemand et un nom peut-être issu des échanges commerciaux. Elle montre comment une représentation venue d’ailleurs peut prendre un sens local, puis être transformée par les personnes qui l’adoptent.",
          sourceRefs: ["drewal-2012", "mami-wata-pidgin"],
          figureRefs: [],
        },
      ],
    },
    {
      id: "ce-que-la-source-ne-dit-pas-chose",
      stepLabel: "05 · La chose",
      heading: "Ce que la source ne dit pas",
      blocks: [
        {
          id: "le-couple-authentique-faux",
          text: "Ces exemples ne permettent pas de séparer simplement ce qui serait « authentique » de ce qui serait « faux ». Les objets, les pratiques et les noms changent au fil des échanges. Comprendre ces changements aide à raconter leur histoire sans supposer qu’une culture serait restée identique depuis son origine.",
          sourceRefs: [],
          figureRefs: [],
        },
        {
          id: "deux-affirmations-sans-source",
          text: "Deux points demandent encore une vérification dans les documents d’origine. La date à laquelle plusieurs divinités auraient été réunies sous le nom Mami Wata est une proposition d’historien. Pour le wax, nous n’avons pas consulté directement les archives de l’entreprise qui permettraient de vérifier la date de 1846 et le nom du fabricant.",
          sourceRefs: ["mami-wata-pidgin", "vlisco-helmond"],
          figureRefs: [],
        },
      ],
    },
  ],
  entities: [
    { kind: "country", id: "GHA", label: "Ghana" },
    { kind: "country", id: "ETH", label: "Éthiopie" },
    { kind: "country", id: "TGO", label: "Togo" },
  ],
};
