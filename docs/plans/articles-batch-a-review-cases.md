# Articles batch A — semantic review cases (P5)

Written 2026-09-30 by content worker A, one case **before** each body was drafted, following
[the pilot review cases](articles-pilots-review-cases.md) and P5 of
[the plan](articles-refonte-2026-09-30.md). Batch A owns eleven article ids:
`agni-anyi-meme-peuple`, `amazigh-berbere-deux-noms`, `cabinda-yombe-trois-conventions`,
`cameroun-le-continent`, `carnaval-caraibe-fete-d-europe`, `comprendre-afrique-noms`,
`daloa-zokou-gbeuly`, `diallo-djallo-jallow`, `dioula-un-metier-une-langue-une-identite`,
`ethnie-d-ou-vient-le-mot`, `garvey-arbre-sans-racines`.

These are review cases for a human reader. `src/lib/articles/__tests__/pilots.test.ts` holds
only the mechanical floor (draft, body, resolving references, no authority opener, real
excerpt, English deferral). Passing it is not prose approval; operator review is required.

Evidence base for every case: the approved card text or narration, the publication copy in
the private library (`post.md`), `SOURCES.md` and the subject's notes in the private
workshop, and the recovery report. "Opened" means the source page was read in this session;
"workshop reading" means the claim rests on the workshop's record of a source that was not
reopened here. Nothing is taken from memory. A claim resting only on an encyclopedia, or on a
work nobody read, is dropped or left flagged.

## Case A1 — `agni-anyi-meme-peuple`

- **Reader's question.** Agni in Côte d'Ivoire, Anyi in Ghana: two peoples or one? Where do
  the two spellings come from?
- **Primary reader need.** P1 (a reader who meets both spellings) and P2 (readers on either
  side of the border, who must not be told a single story about their origin).
- **Claims and support.**
  | Claim                                                                                                        | Record source                                                 |
  | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
  | One language code (`any`) for the language on both sides of the border                                       | s1 (workshop reading; not opened — Ethnologue refused access) |
  | Côte d'Ivoire side: the royal court of the Indénié in Abengourou; Ghana side: the Aowin district             | s1, s2 (workshop reading; not opened)                         |
  | Anyi and Baoulé sit in the same small group, Bia, and pass into each other village by village                | s3 (workshop reading; not opened)                             |
  | Anyi is the form the people use; Agni is the French spelling; each administration wrote the name its own way | s1, s2 (workshop reading)                                     |
  | Asante / Ashanti: the same pattern next door; Rattray (1923) gives "people of war" and c. 1670               | s4 (workshop reading, 1923 outside author, not opened)        |
- **Uncertainty that must stay in the sentence.** No date or act for the border line (the
  workshop found none it could cite); when and by whom "Agni" was first written is not
  documented; Rattray's meaning and date are one outside author's reading, not a settled
  origin.
- **Dropped or flagged.** The working title "un seul peuple d'origine" for Ashanti, Baoulé,
  Agni and Fante (no source; the workshop itself retired it); population figures (the corpus
  sources them to Wikipedia and double-counts); the Berlin conference; the Baoulé migration.
  Flags: the library notes record the render as not publishable (capital accents colliding
  with the line above on five of six cards) and the title as not approved, yet the post is
  filed as published; no image of the Ghana side; all four source tiers `needs_review`.
- **Improvement over the carousel.** Separates the language, the people and the spelling;
  says what the carousel's "même peuple" rests on (one language code and two place names), and
  keeps the Asante meaning as an attributed outside reading.

## Case A2 — `amazigh-berbere-deux-noms`

- **Reader's question.** Does Amazigh mean "free men"? Where does "Berbère" come from?
- **Primary reader need.** P2 (readers who call themselves Amazigh and may hold the "free men"
  reading as their own) and P1.
- **Claims and support.**
  | Claim                                                                                                                                                | Record source                       |
  | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
  | Amazigh (one person), Imazighen (plural), tamazight (feminine; also the language)                                                                    | s1 (opened)                         |
  | "Free men / noble" comes from Leo Africanus ("langage noble"), then Gsell; Chaker: "certainement pas fondée", an ethnonym, not a status              | s1 (opened)                         |
  | No sure etymology can be established                                                                                                                 | s1 (opened)                         |
  | The "free / noble" sense is real locally, where society was strongly stratified (southern Tuareg; south Morocco and Sahara per the workshop reading) | s1 (opened for the Tuareg sentence) |
  | Ancient forms: Maxyes (Herodotus), Mazyes (Hecataeus), Mazices, Mazax (Latin authors)                                                                | s1 (opened)                         |
  | The term was unknown in traditional Kabylie, Mzab and Aurès; its general use starts from Kabylie and is dated 1945–50                                | s1 (opened)                         |
  | "Berbère": generic term forged by the Arabs on arrival, probably from Latin _Barbari_; genealogists later invented an eponym Berr/Berber             | s2 (opened, p. 5165)                |
- **Uncertainty.** The origin of Amazigh is not established; "Berbère" < _Barbari_ carries the
  source's "probablement".
- **Dropped or flagged.** "Tamazight official in Morocco since 2011" (card 2 credits Chaker 1986,
  which cannot carry a 2011 fact: no source in the record); "jusqu'au Burkina Faso" (card 1, no
  source); "VIIe siècle" and "barbari = étranger" (card 6 wording, not in the Modéran passage
  opened); the Egyptian _Barabara_ inscriptions and population figures (already refused by the
  workshop). Flag: the workshop `post.md` still reads "Validé, en attente — pas encore publié"
  while the library files it as published 2026-09-12 with one TikTok URL; the subject's
  working title states both etymologies as facts (the workshop kept it internal).
- **Improvement over the carousel.** Keeps the Tuareg nuance and the unsettled etymology in the
  same place as the correction, and gives the source and page for each point.

## Case A3 — `cabinda-yombe-trois-conventions`

- **Reader's question.** Where does the name Cabinda come from, and who drew the line that
  runs through the Yombe's country? Was it the Berlin conference?
- **Primary reader need.** P2 (Yombe/Kongo readers in three states) and P3.
- **Claims and support.**
  | Claim                                                                                                                                                                                                                                        | Record source                                                                                      |
  | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
  | Bayombe (plural), Muyombe (singular), Kiyombe (the language); the name barely changes between French, Portuguese and neighbouring languages                                                                                                  | s1 (our own people record, read; its own sources are weak)                                         |
  | Cabinda: Angola's exclave north of the Congo river, between Zaire (DRC) and the Republic of the Congo; its eastern and southern limits run about 140 miles (≈ 225 km)                                                                        | s3 (opened: IBS 144, p. 1)                                                                         |
  | 14 Feb 1885 Portugal – International Association of the Congo convention: recognises Portugal's claim to Cabinda, guarantees the Association a narrow corridor to the coast                                                                  | s3 (opened, pp. 1–2)                                                                               |
  | 12 May 1886 France–Portugal convention (French Congo / Cabinda); 25 May 1891 Brussels convention names villages on each side and follows the Luculla to the Chiloango; demarcation 1900; protocol of 5 July 1913 gives the present alignment | s3/s4 (opened, pp. 2–3, 5)                                                                         |
  | The Kiyombe language is attested in Angola, DRC and the Republic of the Congo; the Mayombe forest                                                                                                                                            | s5 (Glottolog opened for the three countries; Vansina not read) ; s3 names the "Forest of Maiombe" |
- **Uncertainty.** The origin of the name Cabinda is not established by any source we read; the
  Berlin conference recognised Leopold's Association but did not draw this line; population
  figures are contradictory and left out.
- **Dropped or flagged.** The carousel's three Kikongo etymologies and "jamais au portugais"
  (card 3) rest only on Portuguese Wikipedia citing a historian nobody read: dropped from the
  body, and s2 is described as what it is. The unity sentence of card 8 is a project conviction,
  not a finding, and is not repeated as fact. Signature place of the 1885 convention not written
  (operator decision). Flags: source titles s1/s5 carried a raw corpus identifier (rewritten);
  our Yombe people record cites a DICE page about a different (Zambian) Yombe group — for
  `/afrik-curator`, not fixed here; image reuse on cards 1/9, 2/8, 6/7 and credit-check on
  1, 6, 7, 9; the carved figures are credited "Kongo" by their museums, not "Yombe"; Leganet.cd
  (in s4) was not opened.
- **Improvement over the carousel.** Removes an etymology the carousel stated on encyclopedia
  support alone, and gives each boundary act its date and parties from the boundary study.

## Case A4 — `cameroun-le-continent`

- **Reader's question.** Is Cameroon really "Africa in miniature", "le Continent"? How far does
  the comparison hold?
- **Primary reader need.** P2 (Cameroonian readers who use or hear the nickname) and P3.
- **Claims and support.**
  | Claim                                                                                                                                               | Record source                                            |
  | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
  | "Afrique en miniature" is a slogan repeated above all by tourism marketing; its origin is not identified; one researcher (Bruneau 1999) defended it | s5 (opened)                                              |
  | Its justifications: Cameroon sits between plain/plateau, forest/savanna, Christian/Muslim, anglophone/francophone Africa                            | s5 (opened, abstract)                                    |
  | Of Greenberg's major African language families, only Khoisan and Austronesian are not represented                                                   | s5 (opened)                                              |
  | Tchawa's conclusion: founded, yet scientifically excessive                                                                                          | s5 (opened)                                              |
  | A 1979 "Que sais-je ?" compared its ethnic configuration to Africa's ("à l'image de celle de l'Afrique")                                            | s2 (second hand through an IRD document; neither opened) |
  | Fulfulde, Chadic, Adamawa-Ubangian and Bantu languages side by side (the map shown in the carousel, after Le Fur)                                   | s4 (map read by the workshop; the two books not read)    |
- **Uncertainty.** Who coined the nickname and when is not known; no source says what
  Cameroonians themselves mean by it.
- **Dropped or flagged.** The name's etymology (1472, Fernão do Pó, the ghost shrimp, "Kamerun"
  on 5 July 1884): English Wikipedia plus an unread book — dropped; the article points to the
  separate shrimp article instead. "278 groups" (Yakan, read only via French Wikipedia) and "49
  fiches" (an internal count that changes) — dropped. No count of families present (a doctrine
  conflict the workshop recorded). Flags: s1 is Wikipedia-only; "le Continent" as the exact
  nickname is attested in the workshop's subject report (France 24, Présidence 2024), not in
  the record's sources; credit-check on card 2; an Instagram occurrence is unattributed.
- **Improvement over the carousel.** Replaces a count resting on Wikipedia with the one
  scholarly assessment of the slogan that was read, including its verdict and its reasons.

## Case A5 — `carnaval-caraibe-fete-d-europe`

- **Reader's question.** Is the Caribbean carnival a festival that came from Europe? What do
  its local names say?
- **Primary reader need.** P1 (diaspora readers from the Antilles, Trinidad or Brazil) and P2.
- **Claims and support.**
  | Claim                                                                                                                                                                                                                                                             | Record source                                            |
  | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
  | The word _carnaval_ comes from Italian and is attested in the thirteenth century                                                                                                                                                                                  | s1 (workshop reading; CNRTL did not serve the page here) |
  | Martinique: "Nations" (groups of enslaved people of the same origin) excluded from the Corpus Christi procession in the mid-eighteenth century; a 1765 order bans masquerades armed with iron-tipped sticks; after 1848 the Saint-Pierre carnival becomes popular | s2 (workshop reading, "lu")                              |
  | The _bois-bois_: a straw effigy caricaturing the year's most unpopular incident, buried or thrown into the sea at Saint-Pierre; an 1890 book already describes it in the past tense and does not write "Vaval"                                                    | s3, s4 (workshop reading)                                |
  | Vaval, king of the carnival, burned on Ash Wednesday; one published explanation sees a Creole diminutive of _carnaval_; no date found for the name                                                                                                                | s2 (workshop reading)                                    |
  | Canboulay: from French "cannes brûlées" in Creole form; after emancipation, former slaves organise night processions; one reading sees a mocking re-enactment of cane fires                                                                                       | s7 (workshop reading)                                    |
  | Recife: Black confraternities crowned a king and queen of Congo in the colonial period; maracatu-nação registered as heritage in 2014 ("création, résistance et foi")                                                                                             | s11 (workshop reading)                                   |
  | The guide reads the Nations as a reconstruction of African societies and attributes the Moko Zombi to the Efik of Old Calabar, in the conditional                                                                                                                 | s2                                                       |
  | An opinion column (2024) says the French brought carnival to Trinidad, while recalling a pan-African thesis                                                                                                                                                       | s13 (workshop reading)                                   |
- **Uncertainty.** Who brought the festival and where its forms come from are two distinct
  questions on which authors diverge; the origin of "maracatu" is not established; no date for
  "Vaval".
- **Dropped or flagged.** Everything the workshop itself marked "to re-read at the source before
  publication": the 1880/1881/1884 Trinidad police measures and the Jouvay replacement (read
  through Wikipedia's references: s8, s9, s10), the 1861 Olinda law (s12, summaries only),
  Liverpool's attributions (s14), the two competing stories about Vaval (1902 / 1964). The
  1840 first written use of "maracatu" (support unclear between s11 and s12 summaries). The
  three maracatu etymologies (card 10 names Lima, Andrade and Gonçalves Fernandes, none of whom
  is in the record's sources). Flags: images that do not match their card (card 4 shows
  Dominica, cards 7–8 a plantation dance not the Canboulay, card 10 Minas Gerais), weak card 11
  image, credit-check on eight cards; source titles are too short to find the works again
  (s2 completed from the workshop; others left for the operator).
- **Improvement over the carousel.** Keeps the word and the festival apart, and keeps only the
  local histories whose sources were read.

## Case A6 — `comprendre-afrique-noms` (short by design)

- **Reader's question.** What does EthniAfrica do, and why start from names?
- **Primary reader need.** P3 (a newcomer meeting the project through its introduction reel)
  and P1.
- **Claims and support.** This is a project introduction, not a historical piece: the approved
  narration asks questions and states a method. The workshop's myth review found no myth and
  no factual claim.
  | Claim                                                                                                                 | Record source                                              |
  | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
  | Four kinds of names (countries, languages, peoples, personal names), with the approved examples                       | approved narration and cards; s2 (the project's own essay) |
  | "Dioula" can be heard as a language, a trade or an identity — a question, not a classification                        | s1 (workshop reading; not opened)                          |
  | The method: confront written sources, oral traditions and research; say where they disagree and what is still unknown | approved narration; s2                                     |
- **Uncertainty.** None asserted; the article must not turn any question into an answer (no
  etymology of "Mali", no ranking of names, no answer to the Comoros question).
- **Dropped or flagged.** The Comoros question is kept as a question without its card reference
  (Sophie Blanchy is not in the record's sources). The closing call "Partagez-la" is not
  reproduced; an invitation to contribute is. Flags: TikTok date conflict (ledger 2026-09-23,
  id day 2026-09-22); soundtrack/voice not cleared for website reuse; the voice's pronunciation
  of several names was never checked by ear (workshop note); credit-check on all nine cards.
- **Why short.** The evidence is a statement of intent. Padding it with facts about the named
  examples would be writing a different article; the article links to the ones that exist.

## Case A7 — `daloa-zokou-gbeuly`

- **Reader's question.** Who was Zokou Gbeuly, the man Daloa remembers as its founder? (The
  imported title asked where the name Daloa comes from; no source consulted answers that.)
- **Primary reader need.** P2 (Bété and Daloa readers) and P1.
- **Claims and support.**
  | Claim                                                                                                                                               | Record source                                    |
  | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
  | Zokou Gbeuly, 1835–1912                                                                                                                             | s4 (opened: IdRef authority record)              |
  | A 2020 collective book presents him as a resistance figure and "fondateur de la Cité de Daloa"; deported in 1911, died in exile at Zuénoula in 1912 | s1 (publisher page opened, not the book)         |
  | About a thousand fighters from Sabwa, Galebha and Labéa burned the Daloa post; arrested 1911, deported to Zuénoula, died 1912                       | s3 (opened)                                      |
  | Born 1835 at Daloa; welcomed the colonists, then turned against them; 26 September 1906 revolt; second uprising in 1907; deported 4 October 1911    | s2 (opened; a blog, tier to be ruled)            |
  | His name is written Zokou Gbeuly, Gbeuli, Zoku'o Gbëli; our own people record writes Gbéouli                                                        | s1, s2, s3, s4 (opened) ; our Bété people record |
- **Uncertainty.** The origin of the name Daloa is not documented in any source read. The name
  of the colonial agent killed in 1906 differs between sources and is not written. "Founder"
  is the book's description, not an independently documented fact.
- **Dropped or flagged.** 1893 as the date of colonisation (taken from an earlier project post,
  not from these sources); "no Wikipedia page" (s5 is a workshop observation, not a source —
  its title is left as imported, flagged for the operator); the one-line-in-our-corpus framing
  (internal, and the count changes). Flags: **title changed** from "D'où vient le nom Daloa ?"
  to a question the evidence answers (operator may revert); registry status (library `pret`,
  site ledger live); slides recovered from the workshop, not proven to be the posted files;
  cards 1/2 and 3–6 reuse images; no portrait exists.
- **Improvement over the carousel.** Names which source says what, including the book's own
  "founder" framing, and shows the name's several spellings instead of fixing one.

## Case A8 — `diallo-djallo-jallow`

- **Reader's question.** Diallo, Djaló, Jallow, Jalloh: one name or several? What does it mean?
- **Primary reader need.** P1 (bearers of the name; the subject came from a reader's request)
  and P2.
- **Claims and support.**
  | Claim                                                                                                                                                                                           | Record source                                                         |
  | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
  | Diallo, Djaló and Jaló are spellings used by one Fula group in Guinea-Bissau                                                                                                                    | s1 (workshop reading, pp. 19–20; not opened, no URL)                  |
  | Jallow (Gambia) and Jalloh (Sierra Leone) are forms of the same name                                                                                                                            | s2 (workshop reading; not opened)                                     |
  | The spelling follows the language of each territory's administration — an observation of distribution, not an explained mechanism                                                               | cards 3; s1, s2                                                       |
  | 1734: Ayuba Suleiman Diallo's account, written by Thomas Bluett in London, separates his filiation (son of Suleiman, son of Ibrahim) from his family name: "The Surname of his Family is Jallo" | s3 (workshop reading, verbatim; primary host refused connection here) |
  | The 1734 text describes a family name already inherited, so the name is older than that mention                                                                                                 | s3                                                                    |
- **Uncertainty.** The meaning of the name is not established; no source consulted explains it.
  Why each language spells it that way is not explained by any source.
- **Dropped or flagged.** "8 pays" and the Peul/Fula exonym origins (card 2, card 4): they rest on
  our own name and people records, which are not among this article's sources — dropped; the
  article links to the Fulbe articles instead. The four-clan division (Diallo, Bâ, Barry, Sow)
  was already refused by the workshop (community blog only). Flags: DAFN is tiered
  `unverified` by the workshop; credit-check on card 3; an Instagram occurrence
  (2026-09-17) is unattributed; the card 2 portrait shows an identifiable adult (the workshop
  reviewed and kept it).
- **Improvement over the carousel.** States plainly that the meaning is unknown and that 1734 is
  the oldest written mention found, not the birth of the name.

## Case A9 — `dioula-un-metier-une-langue-une-identite` (carries a correction)

- **Reader's question.** Where does the name Dioula come from? Is it a trade, a language or a
  people?
- **Primary reader need.** P2 (readers who call themselves Dioula — the 12 September carousel
  denied that belonging, and readers corrected it in comments) and P1.
- **Evidence base.** The selected edition is the 12 September carousel, whose first two cards
  carry two claims the project has since retracted: "Dioula n'est pas un nom de peuple" and
  "Eux se nomment Julakan : les gens du commerce". The operator approved a correction text on
  2026-09-23 (`correction.fr.md`) together with a revised narration for a video that exists only
  as a proof. The article is written from that approved correction and revised narration and
  their sources, not from the retracted cards.
- **Claims and support.**
  | Claim                                                                                                                                                                                                                                                          | Record source                              |
  | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
  | Correction, quoted from the approved text                                                                                                                                                                                                                      | approved correction; s3, s4, s6            |
  | Speakers translate _jula_ as "commerçant"; the name comes from the Manding _jùla_, "marchand"                                                                                                                                                                  | s4 (opened, §22, 24, 29)                   |
  | Niane (1985): in the Ivorian forest the Manden are called by the Maninka term Jula, "commerçant"; Wangara and Jula designate especially the Manden engaged in trade; in the fourteenth century Mandenka merchants went south into the forest for cola and gold | s5 (opened, p. 141 n. 1, p. 142)           |
  | First written mention of _jula_: Richard Jobson, 1623 (Bathily, cited by Cissé)                                                                                                                                                                                | s3 (opened)                                |
  | The ultimate origin is not settled: Cissé proposes Arabic _jawla_ ("tournée") as his hypothesis; Bathily reports a Soninke sense of an activity carried from one place to another                                                                              | s3 (opened)                                |
  | Local variation: "ethnie" at Kong, "commerçant" at Odienné                                                                                                                                                                                                     | s3 (opened)                                |
  | Julakan = jula + kan ("langue"): the language name                                                                                                                                                                                                             | s6 (workshop reading; not opened)          |
  | The 1889 Binger map names Pays de Kong, États de Samori, Mossi, Gondja and draws no inland border                                                                                                                                                              | s1 (map read on the image by the workshop) |
- **Uncertainty.** The deeper etymology is open (Arabic and Soninke proposals attributed, none
  crowned); Kong's founding date is contested and not given; speaking the language, trading and
  identifying as Dioula are not interchangeable tests.
- **Dropped or flagged.** The narration's quote attributed to Niane p. 142 ("Le nom de 'Dioula'
  … à partir du XIVe siècle", relayed from photographs, "l'événement historique capital de la
  dispersion des Mandé") was **not found** in the online chapter opened; the article uses what
  that chapter does say. Kong's 1710 founding and the Asante-pressure retreat (uncited in our
  record / unnamed atlas), Samory's 1897 destruction (rests on s2, not read), Bobo-Dioulasso and
  _faso_ (our records only), population figures, the colonial-borders conclusion of the video
  script (an ethical statement, not a sourced finding). **Contract note:** four sources (s3–s6)
  were added to the record because the record's two sources cannot support the approved
  correction. **Media flag, for the operator:** the carousel shown with this article still
  displays the retracted claims on cards 1 and 2; the corrected video is unpublished, so no
  superseding edition exists to point to.
- **Improvement over the carousel.** The article corrects the carousel openly, in the approved
  words, and separates the trade word, the language name and a lived identity.

## Case A10 — `ethnie-d-ou-vient-le-mot`

- **Reader's question.** Where does the word "ethnie" come from? Was it invented by
  colonisation?
- **Primary reader need.** P1 and P3; P4 for the references.
- **Claims and support.**
  | Claim                                                                                                                                                                                                   | Record source                                                      |
  | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
  | The TLFi derives the word from Greek _ethnos_ and dates it to 1896, in Vacher de Lapouge's _Les Sélections sociales_                                                                                    | s1 (workshop reading, verbatim; CNRTL did not serve the page here) |
  | Lapouge seeks a word distinct from "peuple", "nation", "nationalité" and proposes "ethne" or "ethnie" (p. 10); the book is a course taught 1888–1889, published 1896, and deals with races and eugenics | s2, s3 (workshop reading of the scan and OCR)                      |
  | Amselle (1987, p. 465): the notion has been used with reference to a racial problematic ("toujours"; the narration softens it to "longtemps")                                                           | s5 (workshop reading)                                              |
  | No older use found — a bounded negative                                                                                                                                                                 | workshop search record                                             |
  | Around 1950 "tribu" becomes increasingly pejorative for Africa; anthropologists take up "ethnie", linked to the idea that these peoples had a history like others                                       | s4 (workshop reading, paywall-truncated)                           |
  | Mamdani (2012): groups with a common language existed before colonialism; the tribe as an administrative entity did not                                                                                 | s6 (opened)                                                        |
  | Coquery-Vidrovitch (1994): "ethnie" and "ethnicité" risk serving for everything, hence for nothing                                                                                                      | s4 (workshop reading, first sentence)                              |
- **Uncertainty.** 1896 is the TLFi's date, not a proven first use; the anthropologists'
  intention is not stated by the truncated source (the article keeps "lié à l'idée que", not
  "ils veulent rappeler"); "à manier avec prudence" is the project's position.
- **Dropped or flagged.** 1787/Chavannes, "naturel et factice", Hecht 2000, the Académie 1935
  entry (removed from the voice by the operator); "inventé", "colonial", "pour justifier
  l'eugénisme" (no source says it of the word). "Chaque peuple porte d'abord le nom qu'il se
  donne" is kept only as the project's position. Flags: the carousel's opening question poses a
  myth the workshop did not find attested (operator's choice, noted in the myth review);
  reused images (1/9, 2/10, 3/4/7/8); soundtrack/voice not cleared for website reuse; s2 and s3
  are the same book (duplicate entries left as imported).
- **Improvement over the reel.** Restores the source's own wording where the narration had
  attributed an intention, and keeps the dating limit next to the date.
