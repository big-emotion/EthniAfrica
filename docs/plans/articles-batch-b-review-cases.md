# Articles batch B — semantic review cases (P5)

Written 2026-09-30 as the test-first step of P5 in [the plan](articles-refonte-2026-09-30.md),
one case per article, each written **before** that article's body. Same doctrine as
[the pilot cases](articles-pilots-review-cases.md): these are review cases for a human reader,
not assertions a unit test can make. `src/lib/articles/__tests__/pilots.test.ts` holds only the
mechanical floor. Passing it is not prose approval; operator review is required.

Evidence base for every case: the approved narration or card text, the publication copy, the
workshop `SOURCES.md`, `post.md`, `mythe.md` and `message.md` of the subject, and the source pages
listed as "opened" in the case. "Workshop reading" means the claim rests on the workshop's own
record of a source it read; it was not re-opened for the article. A claim that rests only on a
Wikipedia page, or on a work nobody read, is dropped or flagged.

## Case B1 — `ghana-qui-a-choisi-le-nom`

- **Reader's question.** Does today's Ghana take its name from the old empire of Ghana? And who
  chose the name?
- **Primary reader need.** P1 (a clear answer that separates name from place) and P2 (readers who
  hold a version of who chose the name, or an Akan descent account, must see it named, not mocked).
- **Claims and support.**
  | Claim                                                                                                                                                                                                      | Record source                                                                      |
  | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
  | Pacheco Pereira (c. 1505, English translation 1937): Shama was then called Mina; first gold obtained there in January 1471                                                                                 | s7 (workshop reading, raw OCR)                                                     |
  | De Marees 1602: the coast is called "Gout-Custe de Mina"                                                                                                                                                   | s7 (workshop reading, title)                                                       |
  | Oldest English text read using "Gold Coast": the 1705 translation of Bosman; an 1874 charter creates the Gold Coast Colony; the 1911 Britannica ties the name to gold in river sand                        | s6 (Bosman: workshop reading; charter and Britannica: delegated report)            |
  | 11 December 1956, Lord John Hope: the name was conferred "in accordance with local wishes"; it was the name of an ancient kingdom "in what is now French territory south of the Sahara"                    | s1 (opened)                                                                        |
  | The motion for independence passed 72 to none, the opposition absent                                                                                                                                       | s1 (opened; the day of the vote was not seen in what was opened)                   |
  | The 1957 Independence Act: "under the name of Ghana"                                                                                                                                                       | s2 (workshop reading)                                                              |
  | Three versions of who chose: Danquah suggested it (Encyclopaedia Africana); Nkrumah's "decisive role" (Citi Newsroom 2026); the minister names nobody. A 2023 partisan contestation of the Danquah version | s5 (EA opened), s4/s5 (Citi: workshop reading), s1 (opened), s8 (workshop reading) |
  | al-Mas'udi (mid-10th c.) quotes al-Fazari mentioning Ghana                                                                                                                                                 | s2 Levtzion (workshop reading, first page only)                                    |
  | al-Bakri: "Ghana est le titre que portent les rois de ce peuple ; le nom de leur pays est Awkar"                                                                                                           | s3 (opened)                                                                        |
  | Meaning: "war chief" in a 2026 press article; "king of gold" is a chronicle's gloss of another title, Kaya Maghan (Hunwick); al-Bakri gives no meaning                                                     | s4 (workshop reading)                                                              |
  | The empire lay between the Sahara and the headwaters of the Senegal and Niger; the Akan-descent claim is "doubtful"                                                                                        | s1, s5 (opened)                                                                    |
- **Uncertainty that must stay in the sentence.** Who chose the name is not settled; the word's
  meaning is not established; "empire" is the modern scholarly word, the sources say kingdom.
- **Dropped or flagged.** Founder's Day dedication (not about the name); the 1953 "pride in the
  name" speech (date conflict 1953 vs 1956 between two transcriptions, unresolved); Danquah's
  earlier proposals Akanland / "New Ghana" 1934 (one press article, not in the record's sources);
  the list of peoples living in the territory (corpus fiche only). Carousel flags unchanged:
  credit-check on cards 1, 4, 12, 13; cards 1 and 12 reuse one image; no YouTube edition; video
  soundtrack not cleared; video media credits not recovered.
- **Improvement over the posts.** Separates the three names by date and by who gave them,
  separates name from territory, and keeps the three versions of the choice side by side.

## Case B2 — `griot-d-ou-vient-le-nom`

- **Reader's question.** Where does the word "griot" come from, and what do the people it names
  call themselves?
- **Primary reader need.** P2 (readers who say jeli, jali, gewel, gawlo, gesere at home) and P3.
- **Claims and support.**
  | Claim                                                                                                                                                                                                                                                                                                                            | Record source                                                                                         |
  | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
  | Societies have their own words: guewel (Wolof), mabo or gawlo (Fulbe), jali (Mandinka), jeli (Maninka, Bamana), geseré or jaaré (Soninke), also iggio (Moor), jeseré (Songhay), marok'i (Hausa)                                                                                                                                  | s4 Hale p. 251 (opened)                                                                               |
  | Oldest written traces we read: 1746 "Jelliki" (Mandingo vocabulary), 1826 "Guéwal" (Dard), 1875 "gaoulo" (Faidherbe), 1971 gesere (Pollet and Winter, cited by Hale)                                                                                                                                                             | s1 (workshop OCR), s2 (workshop, page image), s3 (workshop OCR), s5 (workshop reading of Hale p. 262) |
  | "Guiriots" in Saint-Lô, 1637, p. 71; Saint-Lô a Capuchin who travelled the Senegambian coast in 1634-35                                                                                                                                                                                                                          | s6 (workshop, page image), s7 Hale p. 251 (opened)                                                    |
  | Nobody has clearly documented the origin of "griot" in an African language; theories: Wolof gueroual (Bérenger-Féraud 1882), Fulbe gawlo (Watta 1985), Portuguese criado (Labouret 1951), Arabic qawal via Wolof guewel (Charry 1992), a Mande form (Bird 1971, contested by Conrad); Hale's own preferred path through "guinea" | s7 Hale pp. 251-256 (opened)                                                                          |
- **Uncertainty.** The origin of "griot" is not established; Hale's own path is one more
  hypothesis. The dates are those of the writings read, not the age of the names.
- **Dropped or flagged.** Tamari's c. 1300 date for the status (abstract only, not in the record's
  sources); Ibn Battuta (no year in Hale); "maabo" spelling (a private community testimony, not
  cited; the article uses Hale's "mabo"). Cards 1 and 7 reuse one image. Prévost 1746 and
  Faidherbe 1875 rest on OCR, page images not opened by the workshop.
- **Improvement over the carousel.** Gives the reader the competing explanations of "griot" with
  their authors and dates, which the carousel reduced to "origin not established".

## Case B3 — `guinee-vingt-neuf-peuples`

- **Reader's question.** Where does the name Guinée come from, and is Guinea the place the peoples
  of the region "come from"?
- **Primary reader need.** P2 (Guinean and Fulɓe readers for whom the Fouta Djallon is central;
  readers who hold that the northern Ivorian peoples "come from Guinea") and P1.
- **Claims and support.** Most support is our own corpus fiches, which rest on sources of uneven
  standing; the article says so.
  | Claim                                                                                                                                                                                                                                                                                             | Record source                                                                      |
  | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
  | Three unsettled readings of "Guinée": Soussou guinè "woman" (commonly cited), Amazigh akal n ignawen (Delafosse 1924 via Agrour 2012, agnaw from gnu "to sew"), Portuguese "Guiné" written from the 15th century for the coast south of Senegal                                                   | s1 (Soussou fiche, read), s2 (Agrour: workshop opened it), s3 (Guinea fiche, read) |
  | French Guinea 1891-1958; independence 2 October 1958 under the same name                                                                                                                                                                                                                          | s3 (fiche, read)                                                                   |
  | Fouta (Fulfulde, a region inhabited by Fulɓe) + Djallon ("mountain" in Yalunka); formerly Jallonkadu                                                                                                                                                                                              | s3 (fiche, read, citing N'Daou 1999), s4 (not opened), s5                          |
  | Fouta Djallon theocracy, 18th-19th c., one of the major Fulɓe states                                                                                                                                                                                                                              | s3 (fiche, read)                                                                   |
  | Yalunka traces on the plateau from the 11th c., first inhabitants of Jallonkadu per the fiche; Kissi tradition of a Haut-Niger origin, pushed west by the Yalunka from 1600; Soussou origin disputed, one reading from Wagadu; Soussou expansion to the coast in the 18th c. after the Fulɓe wars | s5, s7, s6 (fiches, read)                                                          |
- **Uncertainty.** The origin of "Guinée" is not established; the peoples' origins are reported
  traditions or disputed readings; the fiches rest on sources of uneven standing.
- **Dropped or flagged.** Card 1's "et aucun n'a commencé ici" (stronger than the fiches, which
  make the Yalunka the first inhabitants of Jallonkadu); card 2's sailors-and-women anecdote (not
  found in the Soussou fiche); card 7's "XIIIe siècle" second wave (the fiche gives the 11th
  century only); card 8's Timbo, Karamokho Alfa and Ibrahima Sori (not found in the fiche read);
  "vingt-neuf peuples" (a count of our own fiches on 2026-09-16, not a census); Conakry and French
  as colonial legacies (card only). Registry status `pret` vs live post, and date conflict
  (ledger 2026-09-17, TikTok id 2026-09-16); credit-check on cards 1, 2, 3, 5, 6, 8, 11; card 2
  image (a boy alone) does not match its subject (workshop reserve).
- **Improvement over the carousel.** Presents the three readings of the name side by side, tells
  the reader what our migration claims rest on, and removes the flat "no people began here".

## Case B4 — `igbo-enwe-eze-sans-roi`

- **Reader's question.** "Igbo enwe eze", the Igbo have no king: is it true, and what did the
  colonial administration do with it?
- **Primary reader need.** P2 (Igbo readers, including those whose town has an Eze or an Obi) and
  P3 (a reader who met the novel).
- **Claims and support.**
  | Claim                                                                                                                                                                                                             | Record source                                                             |
  | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
  | Ndi Igbo is the name they give themselves                                                                                                                                                                         | s10 (our fiche, read; workshop read it only on Wikipedia)                 |
  | A 2000 Ahiajoku lecture is titled "Igbo Enwe Eze: The Igbo Have No Kings"                                                                                                                                         | s1 (lecture not read; title attested by academic relays per the workshop) |
  | Noo Udala, Umuaga, 1973: "Before the white man came we had no chief that saw to the affairs of the town. But we had several institutions…"; village heads, lineage heads, age grades, women's groups, masquerades | s2 (excerpt opened, AHA page)                                             |
  | Political power diffuse, no one could command others; Van Allen's scope is the Owerri and Calabar provinces                                                                                                       | s7 (authorised Spanish translation opened)                                |
  | Warrant chiefs: one "representative" per village, contrary to Igbo conceptions; some were lineage heads, many young opportunists                                                                                  | s7 (opened)                                                               |
  | 23 November 1929, Oloko: warrant chief Okugo tells Nwanyeruwa to count her goats and sheep; she asks whether his mother was counted; the Women's War follows                                                      | s7 (opened, citing Perham 1937)                                           |
  | 1933 reforms replace the warrant chiefs with benches of judges                                                                                                                                                    | s7 (opened)                                                               |
  | Things Fall Apart (1958), translated into more than 50 languages                                                                                                                                                  | s9 (workshop reading, not opened)                                         |
- **Uncertainty.** "Most" communities, not all; Van Allen describes the southern provinces; the
  exceptions (Nri, Onitsha) are named but not checked by us.
- **Dropped or flagged.** Ethnologue's 30 million speakers (read only through Wikipedia); the
  1952-53 census figure (tangential); Nri "ritual, not military" (Ogot read only through Wikipedia)
  and Onitsha's Obi chosen from royal lineages (Wikipedia only): named as exceptions, marked as
  not yet checked; Furniss & Gunner on warrant chiefs made Eze (Wikipedia only; Van Allen used
  instead); "Ogu Umunwanyi" (Wikipedia only); **date conflict**: the carousel says the system was
  abolished "the following year" (1930, Wikipedia), Van Allen dates the replacement to the 1933
  reforms; Umuofia inspired by Ogidi and Onitsha (Appiah, read only through Wikipedia).
  Credit-check on cards 1, 2, 5, 6.
- **Improvement over the carousel.** Gives the 1973 testimony its institutions, dates the colonial
  reform from a source actually read, and keeps "most" instead of "never".

## Case B5 — `krio-quatre-vagues-freetown`

- **Reader's question.** Where does the name Krio come from, and what did "créole" first mean?
- **Primary reader need.** P1 and P3; P2 for Sierra Leonean and Saro readers. **Short article**:
  the evidence is one dictionary entry, one UNESCO listing and our own fiche.
- **Claims and support.**
  | Claim                                                                                                                                                                                                                                        | Record source                                                                           |
  | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
  | Spanish criollo / Portuguese crioulo: born in the colony, not arrived from Europe; from Latin creare                                                                                                                                         | s1 CNRTL (workshop reading; page did not render when we tried)                          |
  | UNESCO inscribed Cidade Velha in 2009 and presents it as the cradle of the first creole society in Africa                                                                                                                                    | s2 (workshop reading; page refused automated access)                                    |
  | Four waves at Freetown: 1787 (London), 1792 (Nova Scotia), 1800 (Jamaica), liberated Africans from slave ships until 1860; distinct identities until the 1870s, then a common one; self-name Krio pipul; "Krio" is the Krio form of "Creole" | s3 (our fiche, read; its own sources are mostly `referenced` press and reference works) |
  | Saro: Krio settled in Lagos and Abeokuta in the 19th century; "Saro" from "Sierra Leone"                                                                                                                                                     | s3 (fiche, read)                                                                        |
- **Uncertainty.** When the four groups began to use one name is given only as a period (fusion
  up to the 1870s-1880s); the carousel's "ces quatre vagues se donnent un seul nom" compresses it.
- **Dropped or flagged.** The list of other creole peoples (card 5, cites a corpus map not in the
  record's sources); "Ce nom n'a pas été subi. On se l'est approprié." (rhetoric, not repeated as a
  finding); population figures (not in the carousel). Card 5 calls the project "l'atlas" on screen
  (a published slide, not edited). Slides recovered from the workshop render folder, **not proven to
  be the files posted**; post.md records no URL for any network; the ledger links the campaign.
- **Improvement over the carousel.** Separates the word's colonial meaning from the self-name, and
  says that the four groups became one people over decades, not on arrival.

## Case B6 — `liberia-nom-latin-libre`

- **Reader's question.** Who named Liberia?
- **Primary reader need.** P1 and P3; P2 for Liberian readers who met the official "bicentenary of
  the name".
- **Claims and support.**
  | Claim                                                                                                                        | Record source                                                     |
  | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
  | ACS founded 1816 by a group of white Americans, to resettle free Black Americans in Africa                                   | s1 (opened)                                                       |
  | 1821: Lieutenant Robert Stockton "coerced a local ruler to sell a strip of land"                                             | s1 (opened)                                                       |
  | Monrovia named after James Monroe, who procured more US government money; the State Department page dates the naming to 1824 | s1 (opened)                                                       |
  | The name Liberia already existed in 1822, not 1824 "as is the official version"                                              | s2 (abstract opened)                                              |
  | Harper "proposed" the name at the February 1824 meeting; van der Kraaij finds no identified author who fits                  | s2 (workshop reading of the book; not opened beyond the abstract) |
  | The town of Harper is named for him; the archive does not attach the country's name to him                                   | s4 Maryland State Archives (opened)                               |
  | County seats Monrovia, Buchanan, Harper, Greenville, Robertsport                                                             | s3 (workshop reading)                                             |
  | Formed on Latin liber; Ducor, the cape's earlier name used by the Dei and Bassa; Vai script; independence 26 July 1847       | s5 (our fiche, read)                                              |
- **Uncertainty.** The first user of the word is not identified; 1822 vs 1824 is a disagreement
  between an official US page and a 2026 study, stated as such.
- **Dropped or flagged.** "Ces peuples n'ont pas été rassemblés…" (closing rhetoric, not repeated
  as a finding). The Latin etymology is only in our fiche (unsourced there) and in the reel
  narration, not on the carousel. Card 9 cites the census for the Vai script (the census does not
  carry it). Credit-check on cards 1, 4, 6, 9; cards 1/6/10 and 2/4 reuse images.
- **Improvement over the carousel.** Shows the two dates side by side with who holds each, and
  gives the reader the earlier name of the cape.

## Case B7 — `pourquoi-la-meconnaissance-freine-l-afrique`

- **Reader's question.** Why does EthniAfrica say that not knowing the history of our names holds
  Africa back?
- **Primary reader need.** P1 and P3. This is a **position piece**, outside the name series by
  operator decision (post.md). The article must keep the project's convictions visibly separate
  from the few sourced facts. **Short article.**
- **Claims and support.**
  | Claim                                                                                                                               | Record source                                                                      |
  | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
  | "Ethnie" proposed in 1896, in Europe, to classify Europeans                                                                         | s1 Lapouge 1896 p. 10 (workshop reading; not opened here)                          |
  | In Senegal, the colonial administration classified mostly under "race" and "tribu", sometimes "ethnie"                              | s2 Glasman 2004 (workshop reading; its scope is Senegal, which the article states) |
  | OAU founded May 1963, African Union launched July 2002                                                                              | s3 (workshop reading of au.int)                                                    |
  | Seventeen African countries became independent in 1960                                                                              | s4 (workshop reading)                                                              |
  | Borders not drawn for the peoples already there; "ethnic" tensions with mixed causes; union as the way out; education about peoples | **no source**: stated as the project's thesis and convictions, not as findings     |
- **Uncertainty.** The border thesis is not demonstrated in the piece; the article says so.
- **Dropped or flagged.** The comparison with the United States, the EU and the UAE (reel only,
  not on the carousel); "Beaucoup connaissent mieux l'histoire de l'ancien pays colonisateur…"
  (a generalisation with no source, kept only as a conviction). **Cloned voices of named real
  people** (Marie-victoire, issa sagna): usage rights never settled in the workshop (post.md,
  open question); the video soundtrack is not cleared for the site either. Credit-check on cards
  1, 2, 4-7, 9-11, 13, 14; cards 1/10 and 2/4/6 reuse images; the video's media credits are in
  the workshop's CREDITS-PUBLICATION.md, not yet in the record.
- **Improvement over the posts.** Separates what is sourced from what is believed, and gives the
  sourced facts their scope (Senegal for Glasman).

## Case B8 — `pygmee-d-ou-vient-le-nom`

- **Reader's question.** Where does the word "pygmée" come from, and what do the peoples it is
  applied to call themselves?
- **Primary reader need.** P2 and P3; the peoples named are subjects, not a category.
- **Claims and support.**
  | Claim                                                                                                                                                                          | Record source                                  |
  | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
  | Greek pygmaios, from pygmē, fist, then the measure from elbow to knuckles; Europeans applied the ancient word to equatorial African peoples in the 19th century                | s9 Etymonline (opened; it gives "from 1863")   |
  | Homer, Iliad III, 3-6: Pygmies fighting the cranes at the edges of the world                                                                                                   | s3 (workshop reading on Perseus)               |
  | We found no Greek text naming a present-day Central African people                                                                                                             | workshop external research, bounded as "found" |
  | Baka (SE Cameroon, N Gabon, N Congo), unequal exchange with farming neighbours; Bagyeli/Bakola around Kribi, sources differ on the preferred name; Bedzan/Medzan in the centre | s6 (fiche, read), s1 (Kribi location)          |
  | Aka/BaAka (SW Central African Republic, N Congo), also Bayaka; elephant hunting for ivory in the 19th c.; 1930s French pressure to settle them along roads, refused by most    | s7 (fiche, read)                               |
  | Twa/Batwa (Mutwa), Great Lakes; expulsions from forests for national parks since the 1970s                                                                                     | s8 (fiche, read)                               |
  | Mbuti in Ituri, a name grouping several communities including Efe and Sua; we do not yet document them                                                                         | workshop external research (not reopened)      |
  | Du Chaillu 1872: "the Dwarfs of Equatorial Africa—the Dwarfs of Homer, Herodotus…", said on seeing a terrified old woman                                                       | s4 (workshop reading, Gutenberg)               |
  | Republic of Congo, Act No. 5-2011, art. 1: use of the term prohibited, an insult                                                                                               | s5 (workshop reading of the IWGIA PDF)         |
  | IWGIA/IFAD note: DRC representatives chose "peuple autochtone pygmée" as a common name                                                                                         | s2 (not reopened; 403)                         |
- **Uncertainty.** Opinions among the people concerned diverge; the first application to Central
  Africa is not established (a 1625 note is reported but not found).
- **Dropped or flagged.** Herodotus and Aristotle attestations (not re-read); Purchas 1625 (note
  not found); genetics figures; stature. Flags: the Baka image shows a recognisable **minor** with
  no documented consent (operator's explicit choice, "à relire avant publication"); no consent is
  documented for any photographed person; the Twa date "1970-1980" should be re-listened (a
  transcription heard "1950"); the video soundtrack is not cleared for the site; the licence of the
  law text image is not established; the Tom Patterson map credit on an earlier TikTok (2023,
  CC BY-SA 4.0) vs the 2025 public-domain file is unresolved.
- **Improvement over the video.** Puts each people's own name before the word, and gives the
  word's history and the 2011 law with their sources and limits.

## Case B9 — `rastafari-ras-tafari` — **left unwritten**

- **Reader's question.** Where does the word Rastafari come from?
- **Why no body was written.** Every factual claim of the carousel rests on works nobody on the
  project has read: our Amhara fiche, which the workshop used as its anchor, cites Marcus 1994,
  Witakowski & Balicka-Witakowska 2013 and Murrell et al. 1998 with the note that each was
  "cited by Wikipedia" and "not consulted directly". Leslau 1987 and the SBS Cultural Atlas are
  not recorded as opened either. Attempts to reach a non-Wikipedia source for this article failed
  (Britannica: HTTP 403; Jamaica Gleaner: redirect then HTTP 503). Writing the body would publish
  Wikipedia's reading under the names of books.
- **Unresolved flag.** Date conflict on the negus coronation: the carousel says 5 November 1928
  (card 3, also the date of the coronation photograph's caption), while the fiche's note on Marcus
  gives 7 October 1928 (via Wikipedia). Cards 1 and 7 reuse one image.
- **What would unblock it.** Open Marcus 1994 (or another dated history) for 1917, 1928 and
  2 November 1930; the 1955 Constitution text for article 2; one Rastafari history (Murrell et al.
  or equivalent) for the 1933 start in Jamaica. The claims could then be written as a short
  article: Tafari son of Makonnen, ras, negus, Negusa Nagast as Haile Selassie, the claimed
  Solomonic line as a claim, and the Jamaican movement taking the pre-1930 name.

## Case B10 — `senoufo-syenambele` — **left unwritten**

- **Reader's question.** Where does the name Sénoufo come from, and what does Syénambélé mean?
- **Why no body was written.** The workshop's own `SOURCES.md` records that the carousel's central
  claims are not anchored in anything read: the self-name Syénambélé and its meaning come from our
  Senufo fiche, where no source carries them; the caste hierarchy rests on tertiary sources
  labelled unverified; the Picasso / Trocadéro / 1907 context is written "as context rather than
  as a separately sourced claim"; the "Senufo Unbound" link to Picasso and Léger was read only
  through a radio review we could not find again; nothing records that Richter 1980 or Diakité &
  Sissoko 2014 were opened. We could not open Richter or a museum text on Senufo art in this pass
  (Met Museum: HTTP 429, then no readable text). The name part, which the article title promises,
  would have rested on one unsourced fiche sentence.
- **Unresolved flags.** Card 7, « Ce peuple n'a jamais eu de roi », contradicts card 6, which
  names the Kénédougou, a Senufo kingdom over part of the group (the workshop rule forbids
  "jamais" where an exception is documented). The slides were recovered from the workshop render
  folder and are **not proven to be the files posted**; no URL is recorded in the library. The
  message audit's criterion 7 (two unrelated threads, caste/Picasso vs governance) was never
  resolved.
- **What would unblock it.** A read source for Syénambélé and its meaning; Richter 1980 opened
  for the caste nuance; Diakité & Sissoko for the Kénédougou and 1898; the exhibition catalogue
  for the Picasso link. Then a short article on the name first, the caste debate second.
