/**
 * The English alt texts of the anecdote illustrations — the sidecar of
 * `didYouKnowIllustrations.ts`.
 *
 * A sidecar carries the leaves it translates and nothing else, so an entry
 * here is only what an English reader hears: the alt. Everything else on an
 * illustration is invariant — the file path, the credit line a licence
 * requires verbatim, the licence and file URLs — and lives once, in the
 * French module.
 *
 * Every entry is an agent-produced translation and says so (`provenance:
 * "machine"`, DEC-048). Nothing here is wired into a component yet; the
 * bilingual foundation PR mounts it.
 */

import type { TranslationKind } from "@/lib/i18n/translationSidecarRules";

// @req REQ-145
export type DidYouKnowIllustrationTranslation = {
  kind: "picture";
  alt: string;
  provenance: TranslationKind;
};

function picture(alt: string): DidYouKnowIllustrationTranslation {
  return { kind: "picture", alt, provenance: "machine" };
}

// @req REQ-145
export const DID_YOU_KNOW_ILLUSTRATIONS_EN: Record<
  string,
  DidYouKnowIllustrationTranslation
> = {
  monrovia: picture(
    "Hand-drawn map of Liberia made around 1870, annotated in ink to add place names."
  ),
  bantou: picture(
    "Map of Guthrie's Bantu zones: the linguistic area carved into letters and numbers."
  ),
  "cote-ivoire": picture(
    "Elephant tusk carved with figures along its whole length."
  ),
  amazigh: picture("Tifinagh inscriptions carved into rock, in Algeria."),
  lingala: picture(
    "The paddle steamer “Livingstone” moored at Baringa, in the Congo basin, between 1900 and 1915."
  ),
  "personne-relationnelle": picture(
    "Annual assembly of the men of the village of Ribina, seated in front of their huts, in Nigeria."
  ),
  afrique: picture("Ruins of the Baths of Antoninus at Carthage, in Tunisia."),
  "burkina-faso": picture(
    "Aerial view of Ouagadougou photographed from an aeroplane in the winter of 1930–1931."
  ),
  cameroun: picture(
    "Dugout canoes lined up on the waters of the Wouri, at Douala."
  ),
  "benin-dahomey": picture(
    "Cast brass plaque from the Kingdom of Benin, sixteenth century, held at the British Museum."
  ),
  "nigeria-flora-shaw": picture(
    "Flora Shaw and Frederick Lugard photographed together in 1908."
  ),
  "zimbabwe-grand-zimbabwe": picture(
    "Outer dry-stone walls of Great Zimbabwe."
  ),
  "prefixes-bantous": picture(
    "Village clinging to the Maloti mountains, in Lesotho."
  ),
  "peul-dix-noms": picture(
    "In front of a railway station in Dakar, a man wearing the pointed Fula straw hat."
  ),
  "khoikhoi-hottentot": picture(
    "French engraving of 1797 entitled “Hottentote”, a plate from a collection of costumes of the world."
  ),
  "pygmee-homere": picture(
    "Greek red-figure vase modelled in the shape of a pygmy carrying a slain crane."
  ),
  "lac-lac": picture(
    "Map of Africa drawn by Victor Levasseur around 1847, framed with engraved vignettes."
  ),
  tombouctou: picture(
    "The Djingareyber mosque of Timbuktu, in mud brick, bristling with supporting beams."
  ),
  "fleuve-niger": picture(
    "Boatmen steering a laden pinnace on the Niger river."
  ),
  ethiopie: picture(
    "Illuminated page from an Ethiopian gospel on parchment, fourteenth to fifteenth century."
  ),
  guinee: picture(
    "Wall map of Africa published by Boulton in 1794 after d'Anville."
  ),
  tanzanie: picture("Portrait of Julius Nyerere photographed in 1975."),
  mozambique: picture(
    "The church of São Sebastião, inside the fort of the same name, on the Island of Mozambique."
  ),
  "sierra-leone": picture(
    "Nautical chart of Freetown bay engraved for an 1884 sailing guide."
  ),
  "iteso-bakedi": picture(
    "A raised, thatched grain store in a compound in the Teso country, black-and-white photograph from 1909"
  ),
  "datoga-mangati": picture(
    "Cattle and goats lying in a thorn-branch enclosure beneath acacias, in Tanzania"
  ),
  "azande-niamniam": picture(
    "Red and yellow flowers of Impatiens niamniamensis, grown under glass at the Berlin botanical garden."
  ),
  "wonnin-godie": picture(
    "Painted wooden bovine mask in ochre, blue and white with upright horns, displayed on a stand at the Musée africain de Lyon"
  ),
  "murle-moden": picture(
    "Aerial view of a flooded plain near Pibor, with green thickets rising out of the water as far as the eye can see"
  ),
  "kirdi-paien": picture(
    "Rocky hills and scrub of the Mandara Mountains, in Cameroon's Far North Region"
  ),
  "bambara-refus": picture(
    "Bamana chi wara dance crest, in openwork wood, depicting an antelope with raised horns."
  ),
  "dogon-habe": picture(
    "Stone and mud-brick houses and granaries packed against the sandstone wall of the Bandiagara escarpment"
  ),
  "le-nom-est-une-reponse": picture(
    "Low wall painted with red, black and white figures and chevrons in front of the round thatched huts of SWOPA at Sirigu"
  ),
  "guere-wobe": picture(
    "Wè ritual mask from Côte d'Ivoire, with a protruding face ringed with fibres."
  ),
  "bamileke-cent-royaumes": picture(
    "Red earth avenue lined with conical thatched houses leading to the palace of the Bandjoun chiefdom"
  ),
  "sara-douzaine": picture(
    "Elevated view over the rooftops and trees of Moundou, Logone Occidental, Chad"
  ),
  "bete-plantation": picture(
    "Cocoa beans spread out to dry on a wide yard in front of a thatched mud-brick house in Ziplignan"
  ),
  "bassa-nge-distinction": picture(
    "Lokoja and the broad river seen from the top of Mount Patti, Kogi State, Nigeria"
  ),
  "tswa-recensement": picture(
    "Round thatched houses under coconut palms, with firewood for sale beside a sandy road"
  ),
  "hutu-cartes-identite": picture(
    "Green hills and a cultivated valley under a cloudy sky in southern Burundi"
  ),
  "kasem-gurunsi": picture(
    "Mud house covered in hand-painted black and white geometric patterns, in the royal court of Tiébélé"
  ),
  "dioula-metier": picture(
    "The Grand Mosque of Bobo-Dioulasso, built in mud brick and bristling with supporting beams."
  ),
  "teke-vendre": picture(
    "Coiled, interlinked rings of copper-coloured metal displayed on a museum stand"
  ),
  "tetela-watetera": picture(
    "Detail of a German map of the Sankuru, with the word “BATETELA” lettered by a watercourse below the place name Londo"
  ),
  "tabwa-attache": picture(
    "Tabwa male figure in carved wood, the torso covered in chevron scarifications."
  ),
  "angolar-naufrage": picture(
    "Dugout fishing canoes resting on a black-sand beach in the shade of trees"
  ),
  "crioulo-cap-vert": picture(
    "A low blue-walled house with brown shutters on a cobbled street, a hill and palms behind"
  ),
  "kavango-riviere": picture(
    "A bend of the Okavango River in dry savanna with golden grass"
  ),
  "kaonde-riviere": picture(
    "The wooded bank of the Kabompo River at dusk, its trees mirrored in the water, in Zambia's North-Western Province"
  ),
  "manianga-marche": picture(
    "Engraving of the Congo River seen from the plateau at Manyanga, above wooded slopes"
  ),
  "gorowa-village-voisin": picture(
    "Lake Babati below a wooded hill, with maize fields in the foreground, in Tanzania's Manyara Region"
  ),
  "kalabari-calabar": picture(
    "1867 map in three panels and an inset of the course of the « Nouveau Calebar », the European name for the Kalabari river, and the Niger mouths"
  ),
  "omotique-fleuve-omo": picture(
    "The wide, muddy Omo winding between wooded banks under a clear sky, seen from a dry earth bluff"
  ),
  "gur-mabia": picture(
    "Trees reflected on the surface of the Volta, in Ghana."
  ),
  "ronga-junod": picture(
    "Map of the Tsonga groups and their location, drawn by Henri-Alexandre Junod for his study."
  ),
  "fulbe-quatre-noms": picture(
    "Large cream wool blanket woven in strips, with brown and black geometric motifs and two red borders"
  ),
  "malinke-manden": picture(
    "Conical thatched roofs in the foreground before red sandstone cliffs and wooded slopes near Siby"
  ),
  "fang-reputation": picture(
    "Eyema byeri reliquary guardian, a Fang sculpture from Gabon, with metal-inlaid eyes."
  ),
  "beti-cranes": picture(
    "Bust-length photographic portrait of the explorer Paul Belloni Du Chaillu."
  ),
  "khwe-penduka": picture(
    "The setting sun reflected on the Okavango River, lined by a wooded bank in silhouette, in Bwabwata National Park"
  ),
  "west-taa-masarwa": picture(
    "Aerial view of Aminuis, a settlement of lined-up houses beside a salt pan in the red sands of the Namibian Kalahari"
  ),
  "antambahoaka-surnom": picture(
    "The reed- and palm-lined Pangalanes canal at Mananjary, with a distant dugout canoe"
  ),
  "masa-banana": picture(
    "Two conical earthen houses on sandy ground beside a row of palms, at Yagoua"
  ),
  "rendille-baton": picture(
    "A domed Rendille house covered with mats, hides and pieces of cloth, under a stormy sky in northern Kenya"
  ),
  "kaffa-cafe": picture(
    "Silver crown with white feather plumes in a display case, labelled “Heritage from Kaffa Kingdom”"
  ),
  "bono-brong-ahafo": picture(
    "A huge banded sandstone boulder above a grassy valley at Tanoboase, with three tiny walkers at its foot"
  ),
  "toura-wen": picture(
    "A forested hill rising above the houses of Biankouma, over green fields crossed by a road"
  ),
};
