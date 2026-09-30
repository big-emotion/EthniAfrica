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
