/**
 * Kinds ruled page by page, for hosts whose kind depends on the work they
 * carry (archive.org, Wikisource, Google Books, Gallica, the Library of
 * Congress, the Smithsonian…). Each entry was typed by reading the cited
 * title, author and year (ETNI-2007), keyed by the exact URL the fiches cite.
 *
 * The reading rules, so a new entry is decided the same way:
 * - a dictionary, grammar or vocabulary → `linguistic_reference`;
 * - a scholarly monograph, a critical edition or translation of an old text,
 *   a university-press book → `academic`;
 * - a travel account, an eyewitness narrative, a period record or map, a
 *   field recording → `archive`;
 * - a government report or a country study → `government`;
 * - an encyclopedia entry (Britannica 1911 on Wikisource) → `encyclopedia`;
 * - a museum object page follows the corpus precedent for museums
 *   (metmuseum.org is `academic`);
 * - a social-media post or video takes the kind of who published it: a state
 *   agency → `government`, a newsroom → `press`, a community group, a page
 *   run by enthusiasts or a private person's profile → `community`.
 *
 * A page whose work cannot be identified (an anonymous Scribd upload) is
 * left out on purpose: it stays held for a person in the review file.
 */
import type { SourceKind } from "@/types/sources";

export const WORK_RULINGS: Readonly<Record<string, SourceKind>> = {
  // ── Dictionaries, grammars, vocabularies ──
  "https://archive.org/details/dictionnaire-butaye": "linguistic_reference",
  "https://archive.org/details/ensaiodediccion00mattgoog":
    "linguistic_reference",
  "https://archive.org/details/krapf-outline-of-the-elements-of-the-kisuaheli-language":
    "linguistic_reference",
  "https://archive.org/details/secwanadictionar00brow": "linguistic_reference",
  "https://archive.org/details/grammarofbechuan00arch": "linguistic_reference",
  "https://archive.org/details/acyclopdicdicti00commgoog":
    "linguistic_reference",
  "https://archive.org/details/africannativelit00koel": "linguistic_reference",
  "https://archive.org/details/essaidemanuelde00delagoog":
    "linguistic_reference",
  "https://archive.org/details/grammairewolofe00dardgoog":
    "linguistic_reference",
  "https://archive.org/details/essaisurlalangue00faid": "linguistic_reference",
  "https://gallica.bnf.fr/ark:/12148/bpt6k3412996f": "linguistic_reference",
  "https://github.com/lexibank/polyglottaafricana": "linguistic_reference",
  "https://github.com/commoncrawl/web-languages/blob/main/living/chokwe.md":
    "linguistic_reference",
  "https://tile.loc.gov/storage-services/service/gdc/gdclccn/44/01/76/16/44017616/44017616.pdf":
    "linguistic_reference",

  // ── Scholarly monographs and editions ──
  "https://archive.org/details/travelsofibnbatt02harg": "academic",
  "https://archive.org/details/politicalhistory0000kimb": "academic",
  "https://archive.org/details/in.ernet.dli.2015.280017": "academic",
  "https://archive.org/details/the-history-of-the-yorubas-from-the-earliest-times-to-the-beginning-of-the-british-protectorate":
    "academic",
  "https://archive.org/details/diepangwevlkerku01tess": "academic",
  "https://archive.org/details/kingsclansijwiis0000newb": "academic",
  "https://archive.org/details/numtchaitheceremonialdanceofthekungbushmen":
    "academic",
  "https://archive.org/stream/lesbangalatatin00jonggoog/lesbangalatatin00jonggoog_djvu.txt":
    "academic",
  "https://archive.org/": "academic",
  "https://archive.org/details/lifeofsouthafric02junouoft": "academic",
  "https://archive.org/details/lugbaraofuganda00midd": "academic",
  "https://archive.org/details/historyofmozambi00newi": "academic",
  "https://archive.org/details/kupilikulagovern0000west": "academic",
  "https://archive.org/details/zuluaftermath0000unse": "academic",
  "https://archive.org/details/houseofphalohist0000peir": "academic",
  "https://www.scribd.com/document/352703674/156167417-The-Ait-Atta-of-Southern-Morocco-Daily-Life-and-Recent-History-David-Hart-pdf":
    "academic",
  "https://books.google.com/books/about/The_Early_Political_Development_of_Jamai.html?id=6Ot0PgAACAAJ":
    "academic",
  "https://books.google.com/books/about/The_Hadza.html?id=8p-AG8cqCJwC":
    "academic",
  "https://books.google.com/books/about/Vodun.html?id=zdFwDwAAQBAJ": "academic",
  "https://books.google.com/books/about/African_Vodun.html?id=8t3uCXojiDcC":
    "academic",
  "https://gallica.bnf.fr/ark:/12148/bpt6k209284r": "academic",
  "https://www.si.edu/object/nmafa_91-21-1": "academic",
  "https://www.si.edu/object/nmafa_78-14-12": "academic",
  "https://www.si.edu/object/face-mask:nmafa_90-6-1": "academic",
  "https://www.si.edu/exhibitions/rising-new-moon-century-tabwa-art:event-exhib-1208":
    "academic",
  "https://humanorigins.si.edu/evidence/human-fossils/fossils/knm-wt-15000":
    "academic",

  // ── Travel accounts, period records, maps, field recordings ──
  "https://archive.org/details/tratadobrevedosr00alma": "archive",
  "https://archive.org/details/journaldunvoyage01cail": "archive",
  "https://archive.org/details/historydahomyan00dalzgoog": "archive",
  "https://archive.org/details/amissiontogelel00burtgoog": "archive",
  "https://archive.org/details/missionarytravel03livi": "archive",
  "https://archive.org/details/beschryvingheend00mare": "archive",
  "https://archive.org/details/newaccuratedescr00bosm": "archive",
  "https://archive.org/details/lesbassoutosouvi00casa": "archive",
  "https://archive.org/details/basutolandrecor00theagoog": "archive",
  "https://archive.org/details/narrativeofexpe00livi": "archive",
  "https://archive.org/details/travelsininteri00park": "archive",
  "https://archive.org/details/narrativetravel00browgoog": "archive",
  "https://archive.org/details/gabonaispahouins00comp": "archive",
  "https://archive.org/details/magicisland00seab": "archive",
  "https://archive.org/details/histoiredelarv00dalm": "archive",
  "https://archive.org/details/histoiregenerale03prev": "archive",
  "https://gallica.bnf.fr/ark:/12148/btv1b53053165w": "archive",
  "https://gallica.bnf.fr/ark:/12148/bpt6k103361c": "archive",
  "https://folkways.si.edu/music-from-mozambique-vol-2-chopi-timbila-two-orchestral-performances/world/album/smithsonian":
    "archive",
  "https://folkways.si.edu/music-from-an-equatorial-microcosm-fang-bwiti-from-gabon-republic-africa-with-mbiri-selections/world/album/smithsonian":
    "archive",
  "https://folkways.si.edu/dance-songs-with-drums-from-the-valley-tonga-people-of-zambia/world/music/album/smithsonian":
    "archive",
  "https://folkways.si.edu/music-of-the-kpelle-of-liberia/world/album/smithsonian":
    "archive",
  "https://folkways.si.edu/ceremonial-dance-and-story-songs-from-the-yao-people-of-malawi/world/music/album/smithsonian":
    "archive",

  // ── Government reports, country studies, official journals ──
  "https://archive.org/details/b31415994": "government",
  "https://archive.org/details/chadcountrystudy00coll": "government",
  "https://mjp.univ-perp.fr/constit/cg1880.htm": "government",
  "https://web.archive.org/web/20260120134255/https://www.cia.gov/the-world-factbook/page-data/countries/angola/page-data.json":
    "government",
  "https://web.archive.org/web/20251025152124/https://www.cia.gov/the-world-factbook/page-data/countries/gabon/page-data.json":
    "government",
  "http://web.archive.org/web/20260118103813/https://www.cia.gov/the-world-factbook/countries/ghana/":
    "government",
  "https://web.archive.org/web/20251226162048/https://www.cia.gov/the-world-factbook/countries/liberia/":
    "government",
  "https://web.archive.org/web/20260115233241/https://www.cia.gov/the-world-factbook/countries/niger":
    "government",
  "https://web.archive.org/web/20260106203520/https://www.cia.gov/the-world-factbook/page-data/countries/south-sudan/page-data.json":
    "government",
  "https://web.archive.org/web/20260115/https://www.cia.gov/the-world-factbook/countries/chad/":
    "government",
  "https://web.archive.org/web/20260115/https://www.cia.gov/the-world-factbook/countries/uganda/":
    "government",
  "https://web.archive.org/web/20260115/https://www.cia.gov/the-world-factbook/countries/zambia/":
    "government",

  // ── UNESCO General History of Africa ──
  "https://archive.org/details/unescogeneralhis00jfad": "intergovernmental",
  "https://archive.org/details/unesco_general_history_africa_iii":
    "intergovernmental",

  // ── Encyclopedia entries ──
  "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Krumen":
    "encyclopedia",
  "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Mandingo":
    "encyclopedia",
  "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Fula":
    "encyclopedia",
  "https://en.wikisource.org/wiki/1911_Encyclop%C3%A6dia_Britannica/Tukulor":
    "encyclopedia",

  // ── A library catalogue, community pages ──
  "https://www.sil.si.edu/silpublications/modernafricanart/maadetail.cfm?subCategory=Tanzania+--+Makonde+Sculpture":
    "repository",
  "https://archive.org/download/enwiki-Hamer_language-20200726.pdf/enwiki-Hamer_language-20200726.pdf":
    "community",
  "https://web.archive.org/web/20170430212955/http://www.litenlibassa.com/index.php/culture/hist/636-lhistoire-des-origines-du-peuple-bassa-du-cameroun.html":
    "community",
  "https://www.calameo.com/books/005916510ee1bd9d9abeb": "community",

  // ── Pages on hosts that carry other people's pages, channels or documents,
  //    typed by who published each one (ETNI-2007). Unidentified ones stay held. ──
  // State tourism agencies; the US Marine Corps Intelligence Activity
  // handbooks rehosted on publicintelligence.net; Immigration and Refugee
  // Board of Canada responses republished on ecoi.net.
  "https://www.facebook.com/TanzaniaTouristBoard/posts/811743427661675/":
    "government",
  "https://www.facebook.com/NamibiaTourismBoard/posts/the-smallest-cultural-group-in-namibia":
    "government",
  "https://www.facebook.com/NamibiaTourismBoard/posts/1000733048753092/":
    "government",
  "https://www.facebook.com/tourismecotedivoire.ci/posts/5252704381496923/":
    "government",
  "https://info.publicintelligence.net/MCIA-SenegalCultureGuide.pdf":
    "government",
  "https://info.publicintelligence.net/MCIA-MozambiqueHandbook.pdf":
    "government",
  "https://www.ecoi.net/en/document/1060343.html": "government",
  "https://www.ecoi.net/en/document/1297530.html": "government",
  "https://www.ecoi.net/en/document/1292401.html": "government",
  "https://www.ecoi.net/de/dokument/2041625.html": "government",
  "https://www.ecoi.net/en/document/2110281.html": "government",
  "https://www.ecoi.net/en/document/1209225.html": "government",
  "https://www.ecoi.net/de/dokument/2021474.html": "government",
  // Newspapers, radio and TV newsrooms, press agencies (RTI, France 24, 3FM, IGIHE).
  "https://www.facebook.com/Barotsenetwork/posts/the-history-of-the-kwangwa-peoplethe-kwangwas-are-an-offshoot-of-the-luyi-people/4009618459076922/":
    "press",
  "https://www.facebook.com/Barotsenetwork/posts/4986331461405612/": "press",
  "https://www.facebook.com/qfmzambia/videos/chief-chitina-of-the-lala-swaka-people-of-mkushi-district-central-province-has-p/2234345853678729/":
    "press",
  "https://www.facebook.com/dailynationews/posts/book-review-a-history-of-the-unga-people-of-the-bangweulu-swamps/2212642275532412/":
    "press",
  "https://www.facebook.com/EveAfriqueNews/posts/ancient-bille-kingdom-is-agog":
    "press",
  "https://www.facebook.com/culturebotswana/posts/788683589930727/": "press",
  "https://www.facebook.com/APRNEWS1/posts/connais-tu-les-kroumen": "press",
  "https://www.facebook.com/RTIOfficiel/videos/2mn-pour-comprendre-les-toura/452107626511263/":
    "press",
  "https://www.youtube.com/watch?v=SYLpywVLMOE": "press",
  "https://www.youtube.com/watch?v=Qpqx8Biibg4": "press",
  "https://www.youtube.com/watch?v=TJc4NjTFGiw": "press",
  "https://www.youtube.com/watch?v=zl5Z7JNW19Y": "press",
  "https://www.youtube.com/watch?v=h6GcSiCZkMA": "press",
  // Community groups and pages, personal profiles and channels, and the
  // ethnographer Müller-Kosack's personal site (operator ruling: personal
  // sites and blogs read as community).
  "https://www.facebook.com/groups/759153900821468/posts/10082861068450658/":
    "community",
  "https://www.facebook.com/groups/759153900821468/posts/8230979013638882/":
    "community",
  "https://www.facebook.com/groups/batonga/posts/10161294996454258/":
    "community",
  "https://www.facebook.com/HistoricalNigeria/posts/the-bassa-nge-people-are-an-ethnic-group-in-nigeria":
    "community",
  "https://www.facebook.com/100090158294667/posts/terroir-the-complete-history-of-the-koulango-peopleby-francis-kofi-mensahfebruar/598624119819526/":
    "community",
  "https://www.facebook.com/mamprusiPeople/posts/the-nangodi-traditional-area":
    "community",
  "https://www.facebook.com/ethniesdeCI/posts/3360851760603000/": "community",
  "https://www.facebook.com/ethniesdeCI/posts/jacquevillela-commune-de-jacqueville":
    "community",
  "https://www.facebook.com/ethniesdeCI/posts/2083382538349935/": "community",
  "https://www.facebook.com/Akanfo/posts/the-akye-attie-are-a-separate-akan-people/":
    "community",
  "https://www.facebook.com/groups/924725521287406/posts/2143468266079786/":
    "community",
  "https://www.facebook.com/groups/369358884478832/posts/1388990782515632/":
    "community",
  "https://www.facebook.com/engrkogwuonyepatrick.patsallyonyeka/videos/949872800427144/":
    "community",
  "https://www.facebook.com/EmmanuelMotelin/posts/estimated-population-ethnic-groups-in-uganda-2025":
    "community",
  "https://www.facebook.com/groups/kambaculturalcenter/posts/10152471646389977/":
    "community",
  "https://www.facebook.com/groups/1055261108291845/posts/2305889616562315/":
    "community",
  "https://www.facebook.com/groups/275114380263865/posts/701811924260773/":
    "community",
  "https://www.facebook.com/NewdawuroMedia/posts/": "community",
  "https://www.facebook.com/ZarmaSonghai/posts/the-kurtey-peoplethe-kurtey-were-formed/":
    "community",
  "https://www.facebook.com/groups/toknamassana.officiel/": "community",
  "https://www.facebook.com/TheAfricanHistoryChannelFB/posts/the-tolekakay-of-the-musgum-traditional-architecture-between-the-lower-logone-an/394568216210204/":
    "community",
  "https://www.youtube.com/watch?v=4IZ1VmvZDBc": "community",
  "https://www.youtube.com/watch?v=gHxC89k7V-c": "community",
  "https://www.youtube.com/watch?v=aHPMWp8wE6w": "community",
  "https://www.youtube.com/watch?v=JsYP_8AIsxw": "community",
  "https://www.mandaras.info/MofuGroups.html": "community",
  "https://www.mandaras.info/Podokwa.html": "community",
  "https://www.mandaras.info/bull-festival/bull-festival-slides.htm":
    "community",
  // UNESCO's channel, a researchers' network webinar, Wikitongues, and the
  // Singing Wells field-recording archive.
  "https://www.youtube.com/watch?v=IgZV9nR-m2o": "intergovernmental",
  "https://www.youtube.com/watch?v=YBw5KY7LNoc": "academic",
  "https://www.youtube.com/watch?v=D7FgPZhheZ0": "ngo",
  "https://www.youtube.com/watch?v=mAW1JIIufgE": "archive",
  // Google Arts & Culture stories, typed by the institution that wrote them.
  "https://artsandculture.google.com/story/burji-farmers-of-the-desert-the-story-of-the-expert-agriculturalist-national-museums-of-kenya/GwWxLDJUezlLIA":
    "academic",
  "https://artsandculture.google.com/story/bunce-island-and-the-quot-gullah-connection-quot-world-monuments-fund/GAXhbi_DSY0Yvg?hl=en":
    "ngo",
};
