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
