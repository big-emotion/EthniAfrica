import type { Language } from "@/types/shared";

// French is the source language of every entry below; English is its
// translation. A caption states only what the publication's cited sources
// state (`src/lib/discoveries/generatedImageSources.json`). A description and
// an alt text describe the picture, so they name what is drawn without
// asserting it: an object no source vouches for is described, never named.

const enCredit =
  "Image generated for EthniAfrica with Higgsfield · CC BY-SA 4.0";
const enDescription =
  "A generated image, an interpretation rather than a record:";

const en = {
  images: {
    basotho: {
      title: "Basotho",
      description: `${enDescription} a Mosotho man wearing the mokorotlo and a Basotho blanket, before mountains.`,
      alt: "Portrait painted inside a circle on cream paper: a young man in a woven conical straw hat, wrapped in a red blanket patterned with maize cobs, before green mountains.",
      caption:
        "The mokorotlo, the Basotho hat, adorns the national flag of Lesotho. The blanket carries Basotho identity.",
      credit: enCredit,
    },
    amazigh: {
      title: "Imazighen",
      description: `${enDescription} an Amazigh woman wearing silver jewellery, before an earthen village and snow-capped peaks.`,
      alt: "Portrait painted inside a circle on cream paper: a woman in a woven shawl of red and ochre diamonds, wearing a silver necklace and brooch, before earthen houses and snow-capped mountains.",
      caption:
        "Amazigh silver jewellery is worked with simple geometric figures.",
      credit: enCredit,
    },
    ewe: {
      title: "Eʋe",
      description: `${enDescription} an Ewe woman with a striped woven cloth over her shoulder, before a palm-lined shore.`,
      alt: "Portrait painted inside a circle on cream paper: a woman with braided hair, blue-and-white striped cloth over her shoulder, before a lagoon, a beach and palm trees.",
      caption: "Ewe kente is a woven prestige cloth.",
      credit: enCredit,
    },
    swahili: {
      title: "Waswahili",
      description: `${enDescription} a Mswahili man before a carved wooden door, by the sea.`,
      alt: "Portrait painted inside a circle on cream paper: a man in an embroidered white cap, striped cloth over his white tunic, before a carved wooden door and a sailing boat at sea.",
      caption:
        "In Stone Town, on Zanzibar, the wooden doors are elaborately carved.",
      credit: enCredit,
    },
    kongo: {
      title: "Bakongo of both banks",
      description: `${enDescription} two cities facing each other across a river, with the same markets and canoes on either bank.`,
      alt: "Miniature model seen from above: a wide river separates two cities of tall buildings; on each bank, a cloth market, canoes, and two women waving to each other across the water.",
      caption:
        "Kinshasa and Brazzaville, the two closest capitals in the world, face each other across the Congo River. The Kongo live in DR Congo, the Republic of the Congo and Angola.",
      credit: enCredit,
    },
    somali: {
      title: "Soomaali on both sides",
      description: `${enDescription} two herding camps mirroring each other, each with its well and its camels.`,
      alt: "Mirrored miniature model on red earth: on each side, rounded woven huts, a well where camels drink, herders in checked wraps, and in the middle two women greeting each other.",
      caption:
        "Somalis live in Somalia, Djibouti, Ethiopia and Kenya, where the camel is a measure of wealth.",
      credit: enCredit,
    },
    hausa: {
      title: "Hausawa on both sides",
      description: `${enDescription} two earthen towns mirroring each other around one market.`,
      alt: "Miniature model seen from above: crenellated earthen houses with white-patterned façades frame a central market; riders in blue, motorbikes, a donkey, and cultivated fields beyond.",
      caption:
        "Hausa is the majority language of northern Nigeria and of Niger. On both sides, Hausa architecture is built in earth.",
      credit: enCredit,
    },
    swazi: {
      title: "Emaswati on both sides",
      description: `${enDescription} two hamlets mirroring each other, with their huts, cattle pens and maize fields, joined by one path.`,
      alt: "Miniature model on green hills dotted with round boulders: on each side, thatched huts, a cattle pen and a maize field; women walk along the path between them.",
      caption:
        "siSwati is spoken on both sides of the border between Eswatini and South Africa.",
      credit: enCredit,
    },
    njinga: {
      title: "Njinga Mbande",
      description: `${enDescription} Queen Njinga Mbande standing on a rock at dusk, facing her people.`,
      alt: "Illustration: a woman in a woven wrap with red patterns, holding a staff, stands on a large black rock at dusk; below, men and women look up at her.",
      caption:
        "Njinga Mbande, queen of Ndongo and Matamba in the 17th century, resisted Portuguese colonial expansion. Tradition attributes to her the footprints carved into the rocks of Pungo Andongo.",
      credit: enCredit,
    },
    "mansa-musa": {
      title: "Mansa Musa, 1324",
      description: `${enDescription} Mansa Musa on horseback, amid a caravan crossing the desert.`,
      alt: "Illustration: a man in an embroidered tunic and white turban, on horseback, at the heart of a long caravan of camels laden with bales and chests, stretching across the desert to the horizon.",
      caption:
        "In 1324, Mansa Musa, ruler of Mali, set out on pilgrimage to Mecca.",
      credit: enCredit,
    },
    "grand-zimbabwe": {
      title: "Great Zimbabwe",
      description: `${enDescription} builders raising the dry-stone walls of Great Zimbabwe.`,
      alt: "Illustration at sunset: men and women carry and lay granite blocks on a tall curved wall, before a conical tower and pillars topped with carved birds.",
      caption:
        "Great Zimbabwe is a city of stone, built between the 11th and 15th centuries.",
      credit: enCredit,
    },
    marrakech: {
      title: "Almoravid Marrakesh",
      description: `${enDescription} an earthen wall rising before snow-capped mountains.`,
      alt: "Illustration: builders veiled in blue pour and tamp red earth into a wooden frame to raise a wall; an older man unrolls a plan, before camels, a palm grove and snow-capped mountains.",
      caption: "Marrakesh was founded in 1070–1072 by the Almoravids.",
      credit: enCredit,
    },
  },
  entities: {
    PPL_SOTHO: "Sotho",
    PPL_AMAZIGH_MACRO: "Amazigh",
    PPL_EWE: "Ewe",
    PPL_SWAHILI: "Swahili",
    PPL_KONGO: "Kongo",
    PPL_SOMALI: "Somali",
    PPL_HAUSA: "Hausa",
    PPL_SWAZI: "Swazi",
    PPL_MALINKE: "Malinke",
    AGO: "Angola",
    MLI: "Mali",
    ZWE: "Zimbabwe",
    MAR: "Morocco",
  },
};

type GeneratedImagesCopy = typeof en;
export type GeneratedImageSlug = keyof GeneratedImagesCopy["images"];
export type GeneratedImageEntityId = keyof GeneratedImagesCopy["entities"];

const frCredit =
  "Image générée pour EthniAfrica avec Higgsfield · CC BY-SA 4.0";
const frDescription = "Une image générée, qui interprète et ne documente pas :";

const fr: GeneratedImagesCopy = {
  images: {
    basotho: {
      title: "Basotho",
      description: `${frDescription} un Mosotho coiffé du mokorotlo et drapé dans une couverture basotho, devant des montagnes.`,
      alt: "Portrait peint dans un cercle sur papier crème : un jeune homme coiffé d’un chapeau conique en paille tressée, drapé dans une couverture rouge à motifs d’épis de maïs, devant des montagnes vertes.",
      caption:
        "Le mokorotlo, le chapeau des Basotho, orne le drapeau national du Lesotho. La couverture porte l’identité basotho.",
      credit: frCredit,
    },
    amazigh: {
      title: "Imazighen",
      description: `${frDescription} une femme amazighe parée de bijoux d’argent, devant un village de terre et des sommets enneigés.`,
      alt: "Portrait peint dans un cercle sur papier crème : une femme au voile tissé de losanges rouges et ocre, parée d’un collier et d’une fibule d’argent, devant des maisons de terre et des montagnes enneigées.",
      caption:
        "Les bijoux d’argent amazighs portent des figures géométriques simples.",
      credit: frCredit,
    },
    ewe: {
      title: "Eʋe",
      description: `${frDescription} une femme ewe, une étoffe tissée à rayures sur l’épaule, devant une côte bordée de palmiers.`,
      alt: "Portrait peint dans un cercle sur papier crème : une femme aux cheveux tressés, un tissu rayé bleu et blanc sur l’épaule, devant une lagune, une plage et des palmiers.",
      caption: "Le kente ewe est une étoffe de prestige tissée.",
      credit: frCredit,
    },
    swahili: {
      title: "Waswahili",
      description: `${frDescription} un Mswahili devant une porte de bois sculptée, face à la mer.`,
      alt: "Portrait peint dans un cercle sur papier crème : un homme coiffé d’un bonnet blanc brodé, une étoffe rayée sur sa tunique blanche, devant une porte de bois sculptée et un voilier sur la mer.",
      caption:
        "À Stone Town, sur l’île de Zanzibar, les portes de bois sont richement sculptées.",
      credit: frCredit,
    },
    kongo: {
      title: "Bakongo des deux rives",
      description: `${frDescription} deux villes face à face sur un fleuve, les mêmes marchés et les mêmes pirogues sur chaque rive.`,
      alt: "Maquette miniature vue d’en haut : un large fleuve sépare deux villes d’immeubles ; sur chaque rive, un marché de tissus, des pirogues, et deux femmes qui se saluent de la main par-dessus l’eau.",
      caption:
        "Kinshasa et Brazzaville, les deux capitales les plus proches du monde, se font face de part et d’autre du fleuve Congo. Les Kongo vivent en RD Congo, en république du Congo et en Angola.",
      credit: frCredit,
    },
    somali: {
      title: "Soomaali des deux côtés",
      description: `${frDescription} deux campements pastoraux en miroir, chacun avec son puits et ses chameaux.`,
      alt: "Maquette miniature en miroir sur une terre rouge : de chaque côté, des huttes de nattes arrondies, un puits où boivent des chameaux, des bergers en pagne à carreaux, et au centre deux femmes qui se saluent.",
      caption:
        "Les Somali vivent en Somalie, à Djibouti, en Éthiopie et au Kenya ; le chameau y est une mesure de la richesse.",
      credit: frCredit,
    },
    hausa: {
      title: "Hausawa des deux côtés",
      description: `${frDescription} deux villes de terre en miroir autour d’un même marché.`,
      alt: "Maquette miniature vue d’en haut : des maisons de terre crénelées aux façades ornées de motifs blancs encadrent un marché central ; des cavaliers en bleu, des motos, un âne et, au loin, des champs cultivés.",
      caption:
        "Le haoussa est la langue majoritaire du nord du Nigeria et du Niger. De part et d’autre, l’architecture haoussa est une architecture de terre.",
      credit: frCredit,
    },
    swazi: {
      title: "Emaswati des deux côtés",
      description: `${frDescription} deux hameaux en miroir, leurs cases, leurs enclos et leurs champs de maïs, reliés par un même chemin.`,
      alt: "Maquette miniature sur des collines vertes semées de rochers ronds : de chaque côté, des cases au toit de chaume, un enclos à bétail et un champ de maïs ; des femmes marchent sur le chemin qui les relie.",
      caption:
        "Le siSwati se parle des deux côtés de la frontière entre l’Eswatini et l’Afrique du Sud.",
      credit: frCredit,
    },
    njinga: {
      title: "Njinga Mbande",
      description: `${frDescription} la reine Njinga Mbande, debout sur un rocher au crépuscule, face aux siens.`,
      alt: "Illustration : une femme en pagne tissé à motifs rouges, un bâton à la main, se tient debout sur un grand rocher noir au crépuscule ; en contrebas, des hommes et des femmes la regardent.",
      caption:
        "Njinga Mbande, reine du Ndongo et du Matamba au XVIIe siècle, résista à l’expansion coloniale portugaise. Selon la tradition, les empreintes gravées dans les rochers de Pungo Andongo sont les siennes.",
      credit: frCredit,
    },
    "mansa-musa": {
      title: "Mansa Musa, 1324",
      description: `${frDescription} Mansa Musa à cheval, au milieu d’une caravane qui traverse le désert.`,
      alt: "Illustration : un homme en tunique brodée et turban blanc, à cheval, au cœur d’une longue caravane de chameaux chargés de ballots et de coffres, qui s’étire dans le désert jusqu’à l’horizon.",
      caption:
        "En 1324, Mansa Musa, souverain du Mali, part en pèlerinage vers La Mecque.",
      credit: frCredit,
    },
    "grand-zimbabwe": {
      title: "Grand Zimbabwe",
      description: `${frDescription} des bâtisseurs élèvent les murs de pierre sèche du Grand Zimbabwe.`,
      alt: "Illustration au couchant : des hommes et des femmes portent et posent des blocs de granit sur une haute enceinte courbe, devant une tour conique et des piliers surmontés d’oiseaux sculptés.",
      caption:
        "Le Grand Zimbabwe est une cité de pierre, bâtie entre le XIe et le XVe siècle.",
      credit: frCredit,
    },
    marrakech: {
      title: "Marrakech almoravide",
      description: `${frDescription} une muraille de terre s’élève devant des montagnes enneigées.`,
      alt: "Illustration : des bâtisseurs voilés de bleu versent et damment de la terre rouge dans un coffrage de bois pour élever un mur ; un homme âgé déroule un plan, devant des chameaux, une palmeraie et des montagnes enneigées.",
      caption: "Marrakech fut fondée en 1070-1072 par les Almoravides.",
      credit: frCredit,
    },
  },
  entities: {
    PPL_SOTHO: "Sotho",
    PPL_AMAZIGH_MACRO: "Amazigh",
    PPL_EWE: "Ewe",
    PPL_SWAHILI: "Swahili",
    PPL_KONGO: "Kongo",
    PPL_SOMALI: "Somali",
    PPL_HAUSA: "Hausa",
    PPL_SWAZI: "Swazi",
    PPL_MALINKE: "Malinké",
    AGO: "Angola",
    MLI: "Mali",
    ZWE: "Zimbabwe",
    MAR: "Maroc",
  },
};

// @req REQ-145
export const generatedImagesCopy: Record<Language, GeneratedImagesCopy> = {
  en,
  fr,
};
