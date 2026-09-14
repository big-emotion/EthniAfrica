/**
 * A picture for each anecdote, and the credit that makes it citable.
 *
 * This is deliberately not a field on `DidYouKnowFact`. An illustration is
 * something a reading surface adds, the way `didYouKnowPresentation` adds
 * labels and accents, not something the fact carries. Keeping it here means
 * the bank stays a bank while the anecdote page, home previews and loading
 * surfaces each own their own dress.
 *
 * Every file is a real picture under a free licence (operator ruling,
 * 2026-09-13; brand charter §9). The first choice is a document the anecdote
 * is *about* — a map that makes the mistake, the object that was traded, the
 * person who did the naming. Where none exists, the picture is a neighbour:
 * the people's own place or material culture, then the country, then the
 * region, and its alt and credit say which. An anecdote about a slur shows a
 * place or an object, never a face.
 *
 * Provenance in full — file page, author, date, why this one — lives in
 * `public/images/anecdotes/CREDITS.md`. What is printed under the picture is
 * `credit`, because CC BY and CC BY-SA are only satisfied by an attribution
 * the reader can see, not by one filed in the repository.
 */

export interface DidYouKnowPicture {
  kind: "picture";
  /** Path under `public/`, so `next/image` can size and re-encode it. */
  src: string;
  /** What the picture shows. Never a restatement of the headline. */
  alt: string;
  /** The visible attribution line: work, author, source, licence. */
  credit: string;
  /**
   * The licence's own address, and the file's.
   *
   * §4(a) of CC BY-SA asks for "a copy of, or the Uniform Resource Identifier
   * for, this License", and the brand charter §9 turns that into a house
   * rule: a licence is published, not named. Naming « CC BY-SA 4.0 » in a
   * caption is not a notice the reader can reach. Absent for a public-domain
   * file, which asks for no licence notice at all.
   */
  licenceUrl?: string;
  filePage?: string;
}

export type DidYouKnowIllustration = DidYouKnowPicture;

// @req REQ-113
export const DID_YOU_KNOW_ILLUSTRATIONS: Record<
  string,
  DidYouKnowIllustration
> = {
  monrovia: {
    kind: "picture",
    src: "/images/anecdotes/monrovia.jpg",
    alt: "Carte manuscrite du Liberia dressée vers 1870, annotée à l'encre pour y ajouter des noms de lieux.",
    credit:
      "Carte du Liberia, American Colonization Society, v. 1870 — Library of Congress via Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Map_of_Liberia_LOC_96684991.jpg",
  },
  bantou: {
    kind: "picture",
    src: "/images/anecdotes/bantou.jpg",
    alt: "Carte des zones bantoues de Guthrie : le domaine linguistique découpé en lettres et en chiffres.",
    credit:
      "Zones bantoues de Guthrie — Edricson, Wikimedia Commons, CC BY-SA 3.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Bantu_zones.png",
    licenceUrl: "http://creativecommons.org/licenses/by-sa/3.0/",
  },
  "cote-ivoire": {
    kind: "picture",
    src: "/images/anecdotes/cote-ivoire.jpg",
    alt: "Défense d'éléphant sculptée de personnages sur toute sa longueur.",
    credit:
      "Défense sculptée, XIXᵉ siècle, Brooklyn Museum (1992.136.14) — Wikimedia Commons, CC BY 3.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Brooklyn_Museum_1992.136.14_Tusk_Carving_with_Figures.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
  },
  amazigh: {
    kind: "picture",
    // The home already ships this file for the same argument; a second copy
    // would be the same picture at a second path.
    src: "/images/home/tifinagh-algeria.jpg",
    alt: "Inscriptions tifinagh gravées dans la roche, en Algérie.",
    credit:
      "Inscriptions tifinagh, Algérie — Patrick Gruban, Wikimedia Commons, CC BY-SA 2.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Tifinagh_Algeria.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
  },
  lingala: {
    kind: "picture",
    src: "/images/anecdotes/lingala.jpg",
    alt: "Le vapeur à aubes « Livingstone » amarré à Baringa, sur le bassin du Congo, entre 1900 et 1915.",
    credit:
      "Le vapeur « Livingstone » à Baringa, Congo, v. 1900-1915 — Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Livingstone_at_Baringa,_Congo,_ca._1900-1915_(IMP-CSCNWW33-OS12-2).jpg",
  },
  "personne-relationnelle": {
    kind: "picture",
    src: "/images/anecdotes/personne-relationnelle.jpg",
    alt: "Assemblée annuelle des hommes du village de Ribina, assis devant leurs cases, au Nigeria.",
    credit:
      "Assemblée du village de Ribina, Nigeria, 1970-1973 — Aart Rietveld, ASC Leiden via Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:ASC_Leiden_-_Rietveld_Collection_-_Nigeria_1970_-_1973_-_01_-_021_%22Sarkin_Ribina%22,_village_head_of_the_village_of_Ribina._Annual_meeting_of_the_men_in_front_of_their_huts_-_Ribina_near_Toro.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  afrique: {
    kind: "picture",
    src: "/images/anecdotes/afrique.jpg",
    alt: "Ruines des thermes d'Antonin à Carthage, en Tunisie.",
    credit:
      "Thermes d'Antonin, Carthage — Institute for the Study of the Ancient World, Wikimedia Commons, CC BY 2.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Antonine_Baths_at_Carthage.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "burkina-faso": {
    kind: "picture",
    src: "/images/anecdotes/burkina-faso.jpg",
    alt: "Vue aérienne de Ouagadougou photographiée depuis un avion à l'hiver 1930-1931.",
    credit:
      "Ouagadougou vue d'avion, 1930-1931 — Walter Mittelholzer, Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Mittelholzer-ouagadougou.jpg",
  },
  cameroun: {
    kind: "picture",
    src: "/images/anecdotes/cameroun.jpg",
    alt: "Pirogues alignées sur les eaux du Wouri, à Douala.",
    credit:
      "Pirogues sur le Wouri, Douala — Kondah, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Pirogues_sur_les_eaux_du_Wouri_08.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "benin-dahomey": {
    kind: "picture",
    src: "/images/anecdotes/benin-dahomey.jpg",
    alt: "Plaque de laiton coulée du royaume du Bénin, XVIᵉ siècle, conservée au British Museum.",
    credit:
      "Plaque de laiton de Benin City, XVIᵉ siècle, British Museum — Vassil, Wikimedia Commons, CC0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:British_Museum_Room_25_Cast_brass_plaque_from_Benin_City_17022019_5063.jpg",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
  },
  "nigeria-flora-shaw": {
    kind: "picture",
    src: "/images/anecdotes/nigeria-flora-shaw.jpg",
    alt: "Flora Shaw et Frederick Lugard photographiés ensemble en 1908.",
    credit:
      "Flora Shaw et Frederick Lugard, 1908 — Arnold Wright, Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Tcitp_d012_frederick_john_dealtry_lugard_and_wife.jpg",
  },
  "zimbabwe-grand-zimbabwe": {
    kind: "picture",
    src: "/images/anecdotes/zimbabwe-grand-zimbabwe.jpg",
    alt: "Murailles extérieures en pierre sèche du Grand Zimbabwe.",
    credit: "Ruines du Grand Zimbabwe — Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Great-Zimbabwe-ruins-outer-walls-3-1200.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "prefixes-bantous": {
    kind: "picture",
    src: "/images/anecdotes/prefixes-bantous.jpg",
    alt: "Village accroché aux montagnes du Maloti, au Lesotho.",
    credit:
      "Village des monts Maloti, Lesotho — SkyPixels, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Maloti_Mountains_Village.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "peul-dix-noms": {
    kind: "picture",
    src: "/images/anecdotes/peul-dix-noms.jpg",
    alt: "Devant une gare de Dakar, un homme coiffé du chapeau de paille pointu peul.",
    credit:
      "Gare de Dakar, Sénégal, 1972 — Fred van der Kraaij, ASC Leiden via Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:ASC_Leiden_-_F._van_der_Kraaij_Collection_-_01_-_030_-_Hommes_et_femmes_devant_une_gare._Un_homme_dans_un_chapeau_de_paille_Peul_pointu_du_peuple_peul._-_Dakar,_Senegal_-_1972.tiff",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "khoikhoi-hottentot": {
    kind: "picture",
    src: "/images/anecdotes/khoikhoi-hottentot.jpg",
    alt: "Gravure française de 1797 intitulée « Hottentote », planche d'un recueil de costumes du monde.",
    credit:
      "« Hottentote », Jacques Grasset de Saint-Sauveur, v. 1797, LACMA — Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Costumes_de_Differents_Pays,_%27Hottentote%27_LACMA_M.83.190.325.jpg",
  },
  "pygmee-homere": {
    kind: "picture",
    src: "/images/anecdotes/pygmee-homere.jpg",
    alt: "Vase grec à figures rouges modelé en forme de pygmée portant une grue abattue.",
    credit:
      "Vase attique, manière du peintre de Sotadès — ArchaiOptix, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Manner_of_the_Sotades_Painter_ARV_766_3_pygmy_carrying_killed_crane_-_warrior_and_woman_(01).jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "lac-lac": {
    kind: "picture",
    src: "/images/anecdotes/lac-lac.jpg",
    alt: "Carte de l'Afrique dressée par Victor Levasseur vers 1847, encadrée de vignettes gravées.",
    credit:
      "Carte de l'Afrique, Victor Levasseur, v. 1847 — Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:1847_Levasseur_Map_of_Africa_-_Geographicus_-_Africa-levasseur-1847.jpg",
  },
  tombouctou: {
    kind: "picture",
    src: "/images/anecdotes/tombouctou.jpg",
    alt: "La mosquée Djingareyber de Tombouctou, en banco, hérissée de poutres de soutien.",
    credit:
      "Mosquée Djingareyber, Tombouctou — Ondřej Havelka, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Djinguereber_Mosque,_Timbuktu,_Mali.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "fleuve-niger": {
    kind: "picture",
    src: "/images/anecdotes/fleuve-niger.jpg",
    alt: "Piroguiers manœuvrant une pinasse chargée sur le fleuve Niger.",
    credit: "Piroguiers sur le Niger — PGskot, Wikimedia Commons, CC BY-SA 4.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Pinasse_boatmen.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  ethiopie: {
    kind: "picture",
    src: "/images/anecdotes/ethiopie.jpg",
    alt: "Page enluminée d'un évangile éthiopien sur parchemin, XIVᵉ-XVᵉ siècle.",
    credit:
      "Évangile enluminé, Éthiopie, XIVᵉ-XVᵉ s., Metropolitan Museum of Art — CC0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Illuminated_Gospel_MET_DP109449.jpg",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
  },
  guinee: {
    kind: "picture",
    src: "/images/anecdotes/guinee.jpg",
    alt: "Carte murale de l'Afrique publiée par Boulton en 1794 d'après d'Anville.",
    credit:
      "Carte de l'Afrique, Boulton d'après d'Anville, 1794 — Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:1794_Boulton_and_Anville_Wall_Map_of_Africa_(most_important_18th_cntry_map_of_Africa)_-_Geographicus_-_Africa2-boulton-1794.jpg",
  },
  tanzanie: {
    kind: "picture",
    src: "/images/anecdotes/tanzanie.jpg",
    alt: "Portrait de Julius Nyerere photographié en 1975.",
    credit:
      "Julius Nyerere, 1975 — Rob Mieremet / Anefo, Nationaal Archief via Wikimedia Commons, CC0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:President_Nyerere_van_Tanzania,_koppen,_Bestanddeelnr_928-2879_(cropped).jpg",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
  },
  mozambique: {
    kind: "picture",
    src: "/images/anecdotes/mozambique.jpg",
    alt: "L'église São Sebastião, dans le fort du même nom, sur l'île de Mozambique.",
    credit:
      "Église São Sebastião, île de Mozambique — Erik Cleves Kristensen, Wikimedia Commons, CC BY 2.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Igreja_de_S%C3%A3o_Sebasti%C3%A3o-03.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "sierra-leone": {
    kind: "picture",
    src: "/images/anecdotes/sierra-leone.jpg",
    alt: "Carte marine de la baie de Freetown gravée pour un guide nautique de 1884.",
    credit:
      "Baie de Freetown, Imray, 1884 — British Library via Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:IMRAY(1884)_p0558_BAY_OF_FREE_TOWN,_SIERRA_LEONE.jpg",
  },
  "iteso-bakedi": {
    kind: "picture",
    src: "/images/anecdotes/iteso-bakedi.jpg",
    alt: "Un grenier à grain surélevé, coiffé de chaume, dans une cour du pays teso, photographie en noir et blanc de 1909",
    credit:
      "Grenier à grain dans le pays teso, Ouganda, 1909 — photographe inconnu, publié par J. B. Purvis (Through Uganda to Mount Elgon), Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Grain_Store_in_teh_Teso_Country.jpg",
  },
  "datoga-mangati": {
    kind: "picture",
    src: "/images/anecdotes/datoga-mangati.jpg",
    alt: "Des vaches et des chèvres couchées dans un enclos de branches épineuses, au pied d'acacias, en Tanzanie",
    credit:
      "Enclos à bétail (boma) datooga, Tanzanie, 2022 — Erasmus Kamugisha, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:A_Datoga%27s_tribe_livestock_Boma.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "azande-niamniam": {
    kind: "picture",
    src: "/images/anecdotes/azande-niamniam.jpg",
    alt: "Fleurs rouges et jaunes d'Impatiens niamniamensis, cultivée sous serre au jardin botanique de Berlin.",
    credit:
      "Impatiens niamniamensis, jardin botanique de Berlin-Dahlem — Krzysztof Ziarnek (Kenraiz), Wikimedia Commons, CC BY 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Impatiens_niamniamensis_kz04.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0",
  },
  "wonnin-godie": {
    kind: "picture",
    src: "/images/anecdotes/wonnin-godie.jpg",
    alt: "Masque de bovin en bois peint en ocre, bleu et blanc, cornes dressées, exposé sur un socle au Musée africain de Lyon",
    credit:
      "Masque bovin wonnin, catalogué « godié », Côte d'Ivoire, vers 1900, Musée africain de Lyon — Ji-Elle, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Masque_bovin-Godi%C3%A9-Mus%C3%A9e_africain_de_Lyon.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "murle-moden": {
    kind: "picture",
    src: "/images/anecdotes/murle-moden.jpg",
    alt: "Vue aérienne d'une plaine inondée près de Pibor : des bosquets verts émergent de l'eau à perte de vue",
    credit:
      "Plaine inondée près de Pibor, Soudan du Sud, 2012 — Олег Сокол, Wikimedia Commons, CC BY-SA 3.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Pibor,_South_Sudan_-_panoramio_(4).jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "kirdi-paien": {
    kind: "picture",
    src: "/images/anecdotes/kirdi-paien.jpg",
    alt: "Collines rocheuses et arbustes des monts Mandara, dans l'Extrême-Nord du Cameroun",
    credit:
      "Monts Mandara, Extrême-Nord, Cameroun — Serieminou, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Massif_de_Mora_-_Mont_Mandara.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "bambara-refus": {
    kind: "picture",
    src: "/images/anecdotes/bambara-refus.jpg",
    alt: "Cimier de danse chi wara bamana, en bois ajouré, figurant une antilope aux cornes dressées.",
    credit:
      "Cimier chi wara, Bamana, Mali, Huntington Museum of Art — Daderot, Wikimedia Commons, CC0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Chi_Wara_Headdress,_Bamana_people,_Mali,_20th_century,_wood_-_Huntington_Museum_of_Art_-_DSC05130.JPG",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
  },
  "dogon-habe": {
    kind: "picture",
    src: "/images/anecdotes/dogon-habe.jpg",
    alt: "Maisons et greniers en pierre et en banco serrés contre la paroi de grès de la falaise de Bandiagara",
    credit:
      "Village dogon au pied de la falaise de Bandiagara, Mali — Kirua, Wikimedia Commons, CC BY-SA 3.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Villagedogon.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "le-nom-est-une-reponse": {
    kind: "picture",
    src: "/images/anecdotes/le-nom-est-une-reponse.jpg",
    alt: "Muret peint de personnages et de chevrons rouges, noirs et blancs devant les cases rondes à toit de chaume de la SWOPA, à Sirigu",
    credit:
      "Cases peintes de la SWOPA, Sirigu, village nankana, Ghana — Sucram Yef, Flickr, CC BY 2.0",
    filePage: "https://www.flickr.com/photos/146200755@N02/46832138824",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "guere-wobe": {
    kind: "picture",
    src: "/images/anecdotes/guere-wobe.jpg",
    alt: "Masque rituel wè de Côte d'Ivoire, au visage saillant cerné de fibres.",
    credit:
      "Masque rituel wè, Côte d'Ivoire — Mickey Mystique, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Ritual_mask,_Gere_people,_Ivory_Coast_01.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "bamileke-cent-royaumes": {
    kind: "picture",
    src: "/images/anecdotes/bamileke-cent-royaumes.jpg",
    alt: "Allée de terre rouge bordée de cases à toit de chaume conique menant au palais de la chefferie de Bandjoun",
    credit:
      "Cour du palais de la chefferie de Bandjoun, Cameroun — Tokankh, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Cour_du_Palais_de_Bandjoun.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "sara-douzaine": {
    kind: "picture",
    src: "/images/anecdotes/sara-douzaine.jpg",
    alt: "Vue en hauteur sur les toits et les arbres de Moundou, dans le Logone occidental, au Tchad",
    credit:
      "Vue sur Moundou, Logone occidental, Tchad — Korom10, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:La_ville_de_Moundou_2.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "bete-plantation": {
    kind: "picture",
    src: "/images/anecdotes/bete-plantation.jpg",
    alt: "Fèves de cacao étalées au soleil sur une grande aire devant une maison en banco au toit de chaume, à Ziplignan",
    credit:
      "Fèves de cacao au séchage à Ziplignan, près de Gagnoa, Côte d'Ivoire — arno B, Wikimedia Commons, CC BY 3.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Ziplignan_Cacao_-_panoramio.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
  },
  "bassa-nge-distinction": {
    kind: "picture",
    src: "/images/anecdotes/bassa-nge-distinction.jpg",
    alt: "Lokoja et le large fleuve vus du sommet du mont Patti, dans l'État de Kogi, au Nigeria",
    credit:
      "Lokoja vue du mont Patti, État de Kogi, Nigeria — Dotun55, Wikimedia Commons, CC BY-SA 4.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Confluence_state.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "tswa-recensement": {
    kind: "picture",
    src: "/images/anecdotes/tswa-recensement.jpg",
    alt: "Cases rondes au toit de chaume sous les cocotiers, bois de chauffe à vendre au bord d'un chemin de sable",
    credit:
      "Habitations à Vilankulo, province d'Inhambane, Mozambique — Brian Dell, Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Typical_Vilankulo_homes.JPG",
  },
  "hutu-cartes-identite": {
    kind: "picture",
    src: "/images/anecdotes/hutu-cartes-identite.jpg",
    alt: "Collines verdoyantes et vallée cultivée sous un ciel nuageux, dans le sud du Burundi",
    credit:
      "Collines du sud du Burundi, 2007 — Dave Proffer, Wikimedia Commons, CC BY 2.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Burundi_landscape.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "kasem-gurunsi": {
    kind: "picture",
    src: "/images/anecdotes/kasem-gurunsi.jpg",
    alt: "Maison en banco couverte de motifs géométriques noirs et blancs peints à la main, dans la cour royale de Tiébélé",
    credit:
      "Cour royale de Tiébélé, pays kasena, Burkina Faso — Alexander Leisser, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Tiebele_village_in_Burkina_Faso_04.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "dioula-metier": {
    kind: "picture",
    src: "/images/anecdotes/dioula-metier.jpg",
    alt: "La Grande Mosquée de Bobo-Dioulasso, bâtie en banco et hérissée de poutres de soutien.",
    credit:
      "Grande Mosquée de Bobo-Dioulasso, Burkina Faso — Angeline A. van Achterberg, ASC Leiden via Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:ASC_Leiden_-_van_Achterberg_Collection_-_5_-_005_-_La_Grande_Mosqu%C3%A9e_de_Bobo-Dioulasso,_avec_21_niveaux_de_protub%C3%A9rances_en_bois_-_Bobo-Dioulasso,_Burkina_Faso,_19-26_ao%C3%BBt_2001.tif",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "teke-vendre": {
    kind: "picture",
    src: "/images/anecdotes/teke-vendre.jpg",
    alt: "Anneaux de métal cuivreux enroulés et entrelacés, présentés sur un socle de musée",
    credit:
      "Mitako, monnaie-bracelet en laiton ou en cuivre attribuée aux Teke du Congo, Museo Casa de la Moneda, Madrid — Ángel M. Felicísimo, Wikimedia Commons, CC BY 2.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Mitako_(52386097369).jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
  },
  "tetela-watetera": {
    kind: "picture",
    src: "/images/anecdotes/tetela-watetera.jpg",
    alt: "Détail d'une carte allemande du Sankuru, où le mot « BATETELA » est inscrit près d'un cours d'eau, sous le nom de lieu Londo",
    credit:
      "Carte du Sankuru d'après les relevés de Ludwig Wolf en 1886 (détail), Petermanns Geographische Mitteilungen, 1888 — Bruno Hassenstein, Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Originalkarte_des_Sankuru-Stromes_und_seiner_Nebenfl%C3%BCsse.png",
  },
  "tabwa-attache": {
    kind: "picture",
    src: "/images/anecdotes/tabwa-attache.jpg",
    alt: "Figure masculine tabwa en bois sculpté, le torse couvert de scarifications en chevrons.",
    credit:
      "Figure masculine, Tabwa, Metropolitan Museum of Art (1978.412.592) — Wikimedia Commons, CC0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Figure-_Male_MET_1978.412.592_a.jpeg",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
  },
  "angolar-naufrage": {
    kind: "picture",
    src: "/images/anecdotes/angolar-naufrage.jpg",
    alt: "Pirogues de pêche creusées dans un tronc, posées sur une plage de sable noir à l'ombre des arbres",
    credit:
      "Pirogues à São João dos Angolares, São Tomé — Ji-Elle, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Pirogues_sur_la_plage_de_S%C3%A3o_Jo%C3%A3o_dos_Angolares_(S%C3%A3o_Tom%C3%A9)_(2).jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "crioulo-cap-vert": {
    kind: "picture",
    src: "/images/anecdotes/crioulo-cap-vert.jpg",
    alt: "Maison basse aux murs bleus et volets bruns dans une rue pavée, une colline et des palmiers derrière",
    credit:
      "Maison de la rua Banana, Cidade Velha, Cap-Vert — Cayambe, Wikimedia Commons, CC BY-SA 3.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Cape_Verde_Cidade_Velha_rua_Banana_01.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "kavango-riviere": {
    kind: "picture",
    src: "/images/anecdotes/kavango-riviere.jpg",
    alt: "Un méandre du fleuve Okavango au milieu d'une savane sèche aux herbes dorées",
    credit:
      "L'Okavango près de Rundu, Namibie — Peter Stenglein, Wikimedia Commons, CC BY-SA 2.5",
    filePage: "https://commons.wikimedia.org/wiki/File:Okavango_bei_Rundu.JPG",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.5",
  },
  "kaonde-riviere": {
    kind: "picture",
    src: "/images/anecdotes/kaonde-riviere.jpg",
    alt: "Rive boisée de la rivière Kabompo au crépuscule, les arbres se reflétant dans l'eau, dans la province Nord-Ouest de la Zambie",
    credit:
      "La rivière Kabompo, parc national de West Lunga, Zambie — MarkTownsendZambia, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:West_Lunga_National_Park.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "manianga-marche": {
    kind: "picture",
    src: "/images/anecdotes/manianga-marche.jpg",
    alt: "Gravure du fleuve Congo vu depuis le plateau de Manyanga, au-dessus de pentes boisées",
    credit:
      "Le fleuve Congo vu depuis le plateau de Manyanga, gravure publiée en 1895 — Harry H. Johnston, Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:The_River_Congo_from_its_mouth_to_B%C3%B3lob%C3%B3;_with_a_general_description_of_the_natural_history_and_anthropology_of_its_western_basin_(1895)_(14741012296).jpg",
  },
  "gorowa-village-voisin": {
    kind: "picture",
    src: "/images/anecdotes/gorowa-village-voisin.jpg",
    alt: "Le lac Babati au pied d'une colline boisée, avec des champs de maïs au premier plan, dans la région de Manyara",
    credit:
      "Lac Babati, région de Manyara, Tanzanie, 2009 — Daniel Thomas, Wikimedia Commons, CC BY-SA 2.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Lake_Babati-1.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
  },
  "kalabari-calabar": {
    kind: "picture",
    src: "/images/anecdotes/kalabari-calabar.jpg",
    alt: "Carte de 1867 en trois panneaux et un carton du cours du « Nouveau Calebar », nom européen du fleuve des Kalabari, et des bouches du Niger",
    credit:
      "Cours du Nouveau Calebar, delta du Niger, 1867 — Charles Girard, Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Cours_du_Nouveau_Calebar_lev_par_Charles_Girard_-_DPLA_-_f87cbabca6ca78b0de53d8b42432764e.jpg",
  },
  "omotique-fleuve-omo": {
    kind: "picture",
    src: "/images/anecdotes/omotique-fleuve-omo.jpg",
    alt: "L'Omo, large et boueux, serpente entre des rives boisées sous un ciel clair, vu depuis un talus de terre sèche",
    credit:
      "L'Omo vu du village karo de Doose, Éthiopie, 2012 — Bernard Gagnon, Wikimedia Commons, CC BY-SA 3.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Omo_River_02.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "gur-mabia": {
    kind: "picture",
    src: "/images/anecdotes/gur-mabia.jpg",
    alt: "Des arbres se reflétant à la surface de la Volta, au Ghana.",
    credit: "La Volta, Ghana — ARchIvlst07, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Trees_reflecting_on_the_Volta_River.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "ronga-junod": {
    kind: "picture",
    src: "/images/anecdotes/ronga-junod.jpg",
    alt: "Carte des groupes tsonga et de leur localisation, dressée par Henri-Alexandre Junod pour son étude.",
    credit:
      "Carte des groupes tsonga, Henri-Alexandre Junod — Wikimedia Commons, domaine public",
    filePage: "https://commons.wikimedia.org/wiki/File:HJ-1-P16.png",
  },
  "fulbe-quatre-noms": {
    kind: "picture",
    src: "/images/anecdotes/fulbe-quatre-noms.jpg",
    alt: "Grande couverture de laine écrue tissée en bandes, ornée de motifs géométriques bruns et noirs et de deux lisérés rouges",
    credit:
      "Couverture kaasa de style fulbe, Mali, Niger ou Burkina Faso, années 1930 ou avant — Cleveland Museum of Art, CC0",
    filePage: "https://clevelandart.org/art/2024.72",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "malinke-manden": {
    kind: "picture",
    src: "/images/anecdotes/malinke-manden.jpg",
    alt: "Toits de chaume coniques au premier plan devant des falaises de grès rouge et des pentes boisées, près de Siby",
    credit:
      "Case et falaises près de Siby, Mali — Ralf Steinberger, Flickr, CC BY 2.0",
    filePage: "https://www.flickr.com/photos/145472109@N04/34880635756",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  "fang-reputation": {
    kind: "picture",
    src: "/images/anecdotes/fang-reputation.jpg",
    alt: "Gardien de reliquaire eyema byeri, sculpture fang du Gabon, aux yeux incrustés de métal.",
    credit:
      "Eyema byeri, gardien de reliquaire fang, Gabon — Metropolitan Museum of Art, CC0",
    filePage: "https://www.metmuseum.org/art/collection/search/310870",
    licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "beti-cranes": {
    kind: "picture",
    src: "/images/anecdotes/beti-cranes.jpg",
    alt: "Portrait photographique en buste de l'explorateur Paul Belloni Du Chaillu.",
    credit:
      "Portrait de Paul Belloni Du Chaillu — Elliott & Fry, Wikimedia Commons, domaine public",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Portrait_of_Paul_Belloni_Du_Chaillu.jpg",
  },
  "khwe-penduka": {
    kind: "picture",
    src: "/images/anecdotes/khwe-penduka.jpg",
    alt: "Le soleil couchant se reflète sur l'Okavango, bordé d'une rive boisée en silhouette, dans le parc national de Bwabwata",
    credit:
      "Coucher de soleil sur l'Okavango, parc national de Bwabwata, Namibie — Jedesto, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Okavango_Sunset_Bwabwata.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "west-taa-masarwa": {
    kind: "picture",
    src: "/images/anecdotes/west-taa-masarwa.jpg",
    alt: "Vue aérienne d'Aminuis, bourg de maisons alignées au bord d'un pan salé, dans les terres rouges du Kalahari namibien",
    credit:
      "Aminuis vu d'avion, Kalahari namibien, 2017 — Hp.Baumeler, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Aminuis_bird_eye_view.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "antambahoaka-surnom": {
    kind: "picture",
    src: "/images/anecdotes/antambahoaka-surnom.jpg",
    alt: "Le canal des Pangalanes bordé de roseaux et de palmiers à Mananjary, une pirogue au loin",
    credit:
      "Canal des Pangalanes à Mananjary, Madagascar — Privatemajory, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Canal_des_Pangalanes_%C3%A0_Mananjary.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "masa-banana": {
    kind: "picture",
    src: "/images/anecdotes/masa-banana.jpg",
    alt: "Deux cases coniques en terre crue sur un sol sablonneux, près d'une rangée de rôniers, à Yagoua",
    credit:
      "Cases masa à Yagoua, Cameroun — Bile rene, Wikimedia Commons, CC BY-SA 4.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Cases_Massa_Yagoua.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "rendille-baton": {
    kind: "picture",
    src: "/images/anecdotes/rendille-baton.jpg",
    alt: "Une maison rendille en dôme, couverte de nattes, de peaux et de pièces de tissu, sous un ciel d'orage au nord du Kenya",
    credit:
      "Maison traditionnelle rendille, nord du Kenya, 2012 — Redemption93, Wikimedia Commons, CC BY-SA 4.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Rendille_traditional_house.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  },
  "kaffa-cafe": {
    kind: "picture",
    src: "/images/anecdotes/kaffa-cafe.jpg",
    alt: "Couronne d'argent ornée de plumes blanches, présentée sous vitrine avec l'étiquette « Heritage from Kaffa Kingdom »",
    credit:
      "Couronne d'argent du royaume de Kaffa, Musée ethnologique d'Addis-Abeba — Sailko, Wikimedia Commons, CC BY 3.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Corona_d%27argento_con_cimiero,_dal_regno_di_kaffa.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
  },
  "bono-brong-ahafo": {
    kind: "picture",
    src: "/images/anecdotes/bono-brong-ahafo.jpg",
    alt: "Énorme bloc de grès strié dominant une vallée herbeuse à Tanoboase, avec trois promeneurs minuscules à son pied",
    credit:
      "Vallée rocheuse de Tanoboase, près de Techiman, Ghana — Kelsdark, Wikimedia Commons, CC BY-SA 3.0",
    filePage:
      "https://commons.wikimedia.org/wiki/File:Tanoboase_rock_valley.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
  "toura-wen": {
    kind: "picture",
    src: "/images/anecdotes/toura-wen.jpg",
    alt: "Colline boisée dominant les maisons de Biankouma, au-dessus de champs verts traversés par une route",
    credit:
      "Biankouma et ses collines, Côte d'Ivoire — Zenman, Wikimedia Commons, CC BY-SA 3.0",
    filePage: "https://commons.wikimedia.org/wiki/File:Biankouma1.jpg",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
  },
};

// @req REQ-113
export function illustrationFor(
  factId: string
): DidYouKnowIllustration | undefined {
  return DID_YOU_KNOW_ILLUSTRATIONS[factId];
}

/**
 * Give a single-fact surface a stable side from the bank's editorial order.
 * Consecutive facts therefore alternate without a client-side draw that could
 * flip the layout after hydration.
 */
// @req REQ-104
// @req REQ-113
export function illustrationSideFor(factId: string): "start" | "end" {
  const index = Object.keys(DID_YOU_KNOW_ILLUSTRATIONS).indexOf(factId);
  return index < 0 || index % 2 === 0 ? "start" : "end";
}
