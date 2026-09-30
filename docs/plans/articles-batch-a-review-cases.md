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
