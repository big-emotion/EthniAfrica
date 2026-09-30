# Articles redesign — execution evidence

Companion to [the plan](articles-refonte-2026-09-30.md). The plan says what to do; this file
records what was measured or done, phase by phase, and what stays open. A phase is closed
here only with evidence. Nothing in this file certifies the historical accuracy of a post, the
liveness of a social URL or the licence of a media file unless the row says it was checked.

## P0 — baseline (measured 2026-09-30, recette `1bd03eb36`)

Private roots were reachable through `ETHNIAFRICA_SOCIAL_PROJECTS` and
`ETHNIAFRICA_SOCIAL_POSTS`; the index is the posts root's sibling `00-Index/publications.json`.

| Measure                                                                     |    Value | Reading                                                                  |
| --------------------------------------------------------------------------- | -------: | ------------------------------------------------------------------------ |
| Private library records                                                     |      128 | All statuses (publie 74, a-produire 29, pret 12, brouillon 10, bloque 3) |
| Private records `publie`                                                    |       74 | Declared, not rechecked on the platforms                                 |
| Site ledger campaign files (`docs/productions/**`)                          |       56 | Matches the plan's 56                                                    |
| Published private records whose id or `links.campaign` is a ledger campaign | 18 of 74 | The two registries do not share identifiers for the rest                 |
| Ledger campaigns with no published private record of that id                |       39 | Aliases or renamed subjects: mapping is P3 work, not an assumption       |
| Published private records with no URL in either registry                    | 35 of 74 | Publication date recorded, no verifiable post: not counted as live posts |

The 35 without a URL in either registry are: bantu, cameroun, corriger-la-carte, ghana, senegal,
sanankuya, krou-klao, nzebi-clans, noms-de-metier, alliances-maliennes, noms-refuses-ameriques,
peul-fula-fulani, noms-imposes, benin-royaume, noms-de-commerce, villes-ville,
bantou-cent-soixante-dix, akan-quatre-noms, sawa-douala, vodun-esprit, mami-wata, zombie-bantou,
dioula-cinq-pays, amazigh-neuf-pays, appel-corrections, appolo-nzema, creole-ne-dans-la-colonie,
senoufo-caste-sculpteurs, bouet-willaumez-a-t-il-invente-la-cote-divoire,
cabinda-yombe-trois-lignes, mungo-park-a-t-il-decouvert-le-fleuve-niger, mande-nest-pas-un-peuple,
bouet-willaumez-a-t-il-invente-la-cote-divoire-carrousel, diallo-djallo,
qui-a-nomme-le-liberia-carrousel.
Some may match a ledger campaign under another name that does carry a URL; the P3 mapping
decides. Until then none of them is an article candidate with a playable original.

### Copy pointers

Of 74 declared `copy` paths, 66 resolve under the workshop root. The eight that do not:
`afrique`, `lingala`, `nigeria`, `bantu`, `cameroun`, `corriger-la-carte`, `ghana`, `senegal`.
A basename search of the library and the 2026-09-09 reset archive found **no original file** for
any of them (the archive hits are unrelated subjects' `SOCIAL.md`, and are not substitutes).
Status: **unresolved**; captions must come from the publication itself or the operator.
(`lingala` and `nigeria` belong to the earlier Nigeria-Lingala batch, not to the pilot
`lingala-invente-par-les-belges`.)

### Media-empty folders

`creole-ne-dans-la-colonie` and `senoufo-caste-sculpteurs` hold only `post.md`; their index
records list no `videos` and no channel URL. No playable original is recorded for either.
Status: **unresolved** — no media recoverable from the examined tree.

### Pilots

| Pilot   | Private record                                                                      | Site ledger campaign                                                                                                                      | Finding                                                                                                                                                                                                                                                                                                                       |
| ------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mali    | `mali-quelle-histoire`, 2026-09-25, release-01 video + thumbnail + publication copy | `pays/002-mali-quelle-histoire`                                                                                                           | Consistent. YouTube `A99ETtxdxiU`, TikTok, Instagram and Facebook URLs match across both. LinkedIn and X rows have no URL.                                                                                                                                                                                                    |
| Lingala | `lingala-invente-par-les-belges`, carousel dated 2026-09-16, **no URL recorded**    | `langue/001-lingala` (campaign `lingala`): video 2026-09-05 (TikTok, YouTube `kzzDsZQlprI`), carousels 2026-09-07 and 2026-09-17 (TikTok) | **Edition mapping unresolved.** The private carousel (Sept 16; TikTok, Instagram, LinkedIn, no URL) cannot be equated with either ledger carousel (Sept 7, Sept 17) without evidence. The private record `lingala` (2026-09-05) is the video edition. Not conflated.                                                          |
| Mandé   | `manden-mande-mandingue-trois-mots`, 2026-09-25 video                               | `langue/003-manden-mande-mandingue-trois-mots`                                                                                            | Newer edition `bqpj5UiwGJ8` in the private record. The earlier 2026-09-16 video (`vESK91smqxQ`, private `mande-nest-pas-un-peuple`, no URL there) is a superseded edition; the article must show the later one and a correction note. Pronunciations of Camara Laille and Soundiata were never checked by ear (private note). |

## Route and navigation dispositions (code survey, 2026-09-30)

Today the Dossiers menu is the union of six registry modules (`moduleRegistry.ts`) and the seven
corpus dossiers (`src/lib/dossiers/menu.ts`), filed by rubric. All seven `DOS_*` records are
`readiness: draft`, so they render as Bientôt. `ENABLED_EMBED_PROVIDERS` is `["youtube"]`.
`content/` and `src/lib/articles/` do not exist yet; no articles primitive exists to reuse.

| Entry / route                                   | Today                          | Disposition                                                                                              |
| ----------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `/fr/dossiers` hub                              | Section chooser, archive image | Becomes the Articles listing (label Articles; URL kept)                                                  |
| `anecdotes`, `proverbes`, `galerie`             | Ready, active                  | Kept unchanged, shown as the three retained collections                                                  |
| `nommer` (+ 5 chapters)                         | Module draft, Bientôt          | Removed from the section menu; routes stay withheld (no revival)                                         |
| `migrations` (`frise`)                          | Draft, Bientôt                 | Removed from the menu; route stays withheld                                                              |
| `regards/colonisation-et-resistances`           | Draft, Bientôt                 | Removed from the menu; route stays withheld                                                              |
| `themes/[theme]`                                | Published themes via siteTree  | Removed from the section menu; per-theme disposition recorded in P4                                      |
| `[dossier]` for the 7 `DOS_*`                   | Draft, Bientôt                 | Removed from the menu; slugs reserved so no article can take them; data and `/api/v2/dossiers` untouched |
| Header, footer and sitemap label "Les dossiers" | —                              | Renamed Articles in fr and en (P4)                                                                       |

Reserved slugs for new articles: `anecdotes`, `proverbes`, `galerie`, `themes`, `nommer`,
`migrations`, `regards`, plus every `DOS_*` slug.

Existing tests to extend rather than duplicate: `moduleRegistry`, `axisRoutes`, `SiteHeader`,
`SiteFooter`, `navigationCharter`, `siteTrailCoverage`, `dossiersFreezeReach`, `frozenRoutes`,
`siteTree`, `sitemap`, `menu`, `DossierDirectoryPaging`, `EmbedFacade`, `DiscoveryReader`.
Pagination pattern to reuse: `HUB_PAGE_SIZE` and `pageOf` in `src/lib/dossiers/paging.ts`.

## Open from P0

- Confluence contract check: not done. No Confluence access was exercised in this session, so no
  REQ/DEC amendment has been checked or recorded; the article contract is recorded in this file only.
- Mapping of the 74 private records to ledger campaigns, and the Lingala carousel edition: P3.
- Publication cut-off for the migration batch: 2026-09-30 (recette `1bd03eb36`).

## P1 — contract, fixtures, media delivery (2026-09-30)

**Contract (frozen for P2/P3 workers).** `src/lib/articles/schema.ts` (zod) is the single
shape: identity, `status` draft/published, own `publishedAt` and `modifiedAt`, author, `fr`
(required) and `en` (optional, or a non-empty `_translation.deferred.en`), `sources` with tier
and kind kept as separate axes, `media.edition` with `supersedes` + `correctionNote`,
`media.formats` (video or carousel, media paths relative to a media root), `media.originals`
(per network URL and date), `relatedArticleIds`, `entities`. `src/lib/articles/corpus.ts` loads
`content/articles/*.json`, reports every invalid record (an unreadable bank is never an empty
catalogue), refuses duplicate ids/slugs, reserved segments and legacy dossier slugs, unknown
source or related references, a published article lacking a date, media, sources or a playable
video, and a superseding edition without a correction note. `publishedArticleSummaries` is
the one projection (id, slug, title, excerpt, publishedAt, poster, formats), ordered by
`publishedAt` descending with an id tie-break, unaffected by `modifiedAt`.

**Tests:** 24 in `src/lib/articles/__tests__` (corpus + media), written before the code.
`tsc`, `eslint`, `lint:req` green. `@req` uses the existing REQ-114 (dossier corpus reading);
no new requirement was allocated because Confluence was not consulted (see open items).

**Media-delivery decision (measured).**

- `public/` has 0.76 MiB of headroom (40.24 of 41 MiB); one nine-slide carousel at web quality
  would consume most of it. Not viable.
- The self-hosted Supabase stack is documented as started without its storage service, so
  there is no bucket to use. No other durable media host exists in the repository.
- Pilot masters measured: Mali video 21 MB and Mandé video 55 MB (both have YouTube editions,
  so the existing facade plays them without hosting); Lingala carousel PNG masters 14 MB
  (9 × 1080×1350) and a second export 18 MB (9 × 1080×1920).
- **Decision:** videos with a YouTube edition use the existing click-to-load facade; carousel
  slides and posters are exported as WebP derivatives into a `media/articles/` tree served
  through one constant, `ARTICLE_MEDIA_BASE_URL` (default same-origin `/media/articles`, in
  `src/lib/articles/media.ts`). Moving to a durable host is a one-line reviewed change. It is a
  source constant, not an env var, following `ENABLED_EMBED_PROVIDERS`.
- **Not decided, needs the operator:** which durable host actually serves those files in
  production (VPS volume behind the reverse proxy vs. an object store) and its upload/backup
  procedure. Nothing here claims that host exists. Until it does, derivatives can be
  exported and verified locally but not shipped.

`check:dead` reports 6 unreferenced production files against a ceiling of 3: the three new
`src/lib/articles` modules have no importer until the P2 route lands; re-measure at P2.

## P2 — listing and article UI (worker A, merged 2026-09-30)

Built test-first on branch `articles-ui` from the frozen contract and merged without
conflicts: `src/components/articles/*` (listing, article view, media switch, carousel),
`/fr/dossiers` as the Articles listing (paged with `pageOf`), `/fr/dossiers/<slug>` serving a
published article first and otherwise falling through unchanged to the old dossier logic
(drafts and `DOS_*` slugs still answer 404), bilingual copy in `src/lib/i18n/copy/articles.ts`.

- Read on the rendered pages by the worker at 320, 390, 768 and 1200 px with 15 temporary
  fixture records (deleted afterwards, none committed): no horizontal overflow, one h1, draft
  title never shown, error state for an invalid bank, YouTube facade loads nothing until
  clicked, carousel buttons/count/enlargement (focus returns to its button). Corrections made
  after looking: baked-in poster text was cropped, pager overflowed at 320, trail/title edges.
- **Not seen** (open): English pages, night theme, keyboard walkthrough in a real browser,
  axe and Lighthouse, touch swipe (checked visually only), the native-video (`nativeSrc`) path
  (untested, not rendered).
- One existing test was changed on purpose: `axisHubCharter.test.ts` no longer expects the
  dossiers axis to render the spread hub (brand charter §8.6 superseded for this section
  only); a new test asserts it serves the listing. `frozenRoutes.test.tsx` is unchanged and green.
- Brand charter §8.6 prose itself was **not edited**; the inline-facade CSS change (parchment
  inks) is unreviewed by the operator.
- Contract requests from the worker, dispositions: (1) per-locale summary: deferred, English
  is unpublished; (2) no `intro` field: `excerpt` serves as the lead, accepted; (3) citations
  are per section, not per paragraph: accepted for the first release, a limitation on the
  "claim-adjacent" goal; (4) caption language: not needed until captions exist.
- Any bank error shows only the error state on the listing, so a bad draft file would hide
  every published article; `src/lib/articles/__tests__/bank.test.ts` holds the committed bank
  to zero errors in the suite every PR runs.

Gates on the merged tree: 1,033 files / 10,591 tests pass except one route-literal test that
my own new tests broke and that is fixed (hardcoded `/fr/dossiers/...` literals replaced by
route helpers); `typecheck`, `lint` (0 errors, 35 pre-existing warnings), `lint:req`,
`check:dead` (3/3), `test:charter-contracts` green.

## P4 — navigation, SEO, discovery (coordinator; in progress)

Done and tested:

- Axis label Articles in fr and en (header, tray, footer, trail, site tree, About copy).
  `articles` module first; `nommer`, `frise`, `regards-colonisation` marked `unlisted`, so no
  Bientôt row remains; their routes are untouched and withheld. The rubric-filing tests of the
  header (13) described a retired presentation and were replaced by tests for the flat
  four-destination menu; the availability tests that used the withdrawn drafts now read
  `getModuleAvailabilityMap()`. The tile-accent pin moved one step (insertion cost, documented
  in the test). The rubric mechanism in `SiteHeader` is now dormant (`RUBRIC_FILED_AXES` empty):
  removal is a follow-up, not done here.
- Site tree: section Articles = listing + Anecdotes + Proverbes + Galerie; Designations moved
  under Parcourir and the doctrine under the site section (URLs unchanged).
- XML sitemap lists every published article once, French only, through the same predicate;
  no English article URL while articles have no English text.
- Article JSON-LD with the article's own dates and author; metadata/hreflang come from the route.
- Découvertes: a publication whose production campaign an article declares (`campaigns`)
  shows **Lire l'article** in its detail sheet.

Not done: search-companion destinations (they reach articles through Découvertes),
old-URL disposition beyond "withheld routes stay 404", brand charter §8.6 text.

## P3 — recovery and import (worker B, merged; recovery is PARTIAL)

Tool: `social/tools/articles-import/` (dry run by default, `--write`, required `--out` outside
the repository, no default path, roots read from the two environment variables). 36 tests on
isolated fixtures cover: dry run writes nothing, byte-identical re-run, refusal on a source
changed since the snapshot / hash mismatch / two undecided editions / reserved, legacy or
duplicate slug, slide order kept, cross-posts collapsed into one edition, a corrected edition
shown with its verbatim correction note and never the older URL, hand-edited drafts never
overwritten, missing media raised as an exception, private roots and production notes never
reaching public output. `npm run test:social-tools`: 381 pass, 0 fail.

Private outputs (not committed): `manifest.json`, `report.md`, `curation.json` and
`derivatives/` under the workshop's `_articles-recovery` folder (checksums, per-candidate
evidence and next actions). A re-run after the last change left all 321 files byte-identical.
The committed result is 60 draft records in `content/articles/` (all `status: draft`, no body
text, nothing published); all 60 load through `readArticleCorpus()` with zero errors and no
local path appears in them (`check:local-paths` green).

Cut-off 2026-09-30. 72 candidates: 74 published private records, 2 records the site ledger
shows live but the library does not, and all 56 ledger campaigns are accounted for.

| Disposition    | Count | Items                                                                                                                                                                                                                                                                                 |
| -------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft imported |    60 | all in the manifest                                                                                                                                                                                                                                                                   |
| Needs recovery |     2 | `senegal-notre-pirogue` (two cuts, none selected); `bantou-ntu-ba-prefixe` (live on the ledger, no library record matches; `bantou-cent-soixante-dix` looks similar but its content does not match, not linked)                                                                       |
| Not published  |     4 | `bangala-un-nom-plusieurs-referents`, `lingala-langue-des-grands-marches`, `macina-diina-pouvoir`, `traore-jamu-transmission`                                                                                                                                                         |
| Excluded       |     6 | `appel-corrections`, `prochains-sujets-appel` (calls to the audience); `kassav`, `docteur-nico`, `francis-bebey` (Mémoires sonores: no site article owed, music not cleared); `zanu-airplane-analogy` (third-party video, rights unverified). The operator can reverse any exclusion. |

Mapping between the two registries: 22 groups match automatically, 33 by curated link with
written evidence in `curation.json`; one is only probable (`corriger-la-carte` ↔
`mercator-afrique-petite`). Recovered from workshop `rendus/images`, **not proven to be the
exact posted files**: `creole-ne-dans-la-colonie` (6 slides), `senoufo-caste-sculpteurs` (7),
`zokou-gbeuly`. The 8 unresolved copy pointers stay unresolved (`post.md` says the copy was not
found; the workshop folders hold only subject notes).

Exceptions raised, by type (counts are per item, several per candidate): credit-check 94 (credit
and image description share no word), sources-empty 35, audio-not-cleared 28 (one per video; no
soundtrack exported), credits-missing 26, excerpt-placeholder 18 (excerpt repeats the title),
image-reused 15, unattributed-occurrence 13 (ledger URLs with no filed edition, e.g. the Lingala
2026-09-07 TikTok carousel), slide-text-missing 11 (the cards.json of the 2026-09-11 batch were
destroyed by the workshop reset; 8 drafts have slides exported and hashed but no displayable
media), copy-unresolved 8, date-conflict 7 (ledger date one day after the TikTok id day),
wikipedia-source 6, rights-restricted 5 (book covers marked © publisher), registry-status 4
(`zokou-gbeuly` and the Guinée carousel are `pret` in the library but live on the site ledger;
neither ledger was edited), no-url 2, no-youtube 1 (`ghana-qui-a-choisi-le-nom`).

Pilots, as inspected by the worker on rendered slides and frames: Mali video hash matches its
delivery record, YouTube `A99ETtxdxiU` plus three networks, 13 factual sources parsed from the
credits (two point at Wikipedia, flagged), poster 1080×1920 49 KB. Lingala: nine 1080×1350
slides, 1.10 MB of WebP; credit/image mismatches on cards 6 and 8, card 9 reuses card 2's image,
a Wikipédia FR reference; the ledger's 2026-09-17 carousel URL has a TikTok id created
2026-09-16 about an hour after the slides were rendered and was attached to this edition on
that evidence with a date-conflict exception; the 2026-09-07 carousel stays unattributed; the
2026-09-05 video `kzzDsZQlprI` is a separate edition, not shown. Mandé: library video matches the
workshop render by hash, YouTube `bqpj5UiwGJ8`, supersedes `mande-nest-pas-un-peuple`
(`vESK91smqxQ`), correction note quoted verbatim from the approved narration, 5 sources
(Camara Laye tiered `needs_review`), media credits not parsed.

Sizes: 334 WebP files, 36.41 MiB, of which 31.26 MiB are referenced by the drafts; the largest
file is 390 KB. That is about 48 times the 0.76 MiB of `public/` headroom, so **nothing is in
`public/`, no limit was raised, and the drafts' media cannot be served until a durable host
exists.** The 30 selected video masters (470 MiB) were not exported.

Not verified by anyone in this phase: that any platform URL is live; any licence or
website-reuse right including audio; historical accuracy; slide text against images except
about a dozen slides and frames the worker viewed; that the Mandé narration matches the audio;
that TikTok id days (inferred from the id format) are the platform's dates.

Worker B's contract requests (empty excerpt and absent author on drafts, per-format edition
and `originals`, per-slide credits) are not adopted; drafts load with placeholders today.

## P5 — pilot articles (in progress, 2026-09-30)

The three pilots (Mali, Lingala, Mandé) are written test-first against the
[semantic review cases](articles-pilots-review-cases.md), frozen before drafting. All three stay
`draft` with no `publishedAt`: publication needs operator review and a durable media host.
A green mechanical test is not prose approval.

**Written:** all three bodies (Mali 8 sections, Lingala 9, Mandé 9), real excerpts, an
English deferral on each, Mali ↔ Mandé cross-linked. `src/lib/articles/__tests__/pilots.test.ts`
holds the mechanical floor (18 cases, green).

**Source pages opened for this pass** (the claim was checked on the page): Office of the
Historian, Mali; FRUS 1958–60 vol. XIV doc. 75; IBS No. 23 (pp. 1–3); ICJ case 69 summary;
Niane 1985 chapter pp. 141–143, 148–154; Fauvelle 2024 (Medievalista); ORIAS, Ibn Battuta;
Fauvelle-Aymar 2012 abstract; Bamadaba, letter m; Core Knowledge PDF p. 150; Meeuwis, APiCS
survey 60; Mimpongo, lingbuzz 008154 (abstract); Koelle variety notes (Lexibank); Vydrin 2009
p. 107; Donaldson 2019 (publisher page summary). **Not opened:** Collet 2013, Foltz 1965,
Harms 1981, Mbulamoko 1991, Burssens 1954, Castillo 2024, IPS 2004, Prunier 2009, Camara
Laye 1978. Claims from those rest on the workshop's own reading and are marked in the notes.

**Left out of the bodies, with reasons:** Senghor's role and the December 1958 Bamako congress
(Foltz, read only through English Wikipedia; the Mali text names the Senghor point as unverified
instead of asserting it); the party name "Union soudanaise-RDA" (absent from both official pages
opened); the 1959 federation date (no opened source); Lingala artist names (Wikipédia FR only);
the 1876 "Bangala" label, the list of peoples and the Nouvelle-Anvers/Makanza renamings (works
not read); "one of four national languages" (caption only); Almada, Park, Caillié and Delafosse
as users of the words (not page-verified, not in the record's sources); "Mali attested only from
the fourteenth century" (contradicted by Niane p. 150 on al-Bakri).

**Still open for the operator:** prose review of all three; the Lingala source tiers remain
`needs_review` (the workshop proposes `referenced` for most, `unverified` for the encyclopedia);
Lingala card 6/8 credit mismatch and the card 2/9 image reuse are unchanged; the Lingala
edition-date conflict (Sept 16 vs 17) is unchanged; the Mandé media credits come from the
workshop register, including an iNaturalist licence whose version is still to confirm; the Mali
record's Foltz and coordinates entries still cite English Wikipedia in their titles.

### P5 — backlog batches A and B (2026-09-30)

Review cases, frozen before each body was drafted: [batch A](articles-batch-a-review-cases.md)
(A1–A11) and [batch B](articles-batch-b-review-cases.md) (B1–B11). The eligible set was measured
first: of the 57 drafts without a body, **22 had parsed sources and displayable media**, so
those 22 were assigned in two disjoint batches; the other 35 have no parsed source and are
listed below. `pilots.test.ts` now covers every article that has a body (169 tests in
`src/lib/articles`, all green). All written articles stay `draft`, no `publishedAt`, author
unchanged, no English text, a stated English deferral on each, no tier ruling made (every
added source is `needs_review`). **Passing the mechanical floor is not prose approval; every
body still needs the operator's and a semantic review.**

**Written (23 of 60 drafts have a body: 3 pilots + 20 of the 22 eligible; none of the other 35).**
Batch A, all 11: `agni-anyi-meme-peuple`, `amazigh-berbere-deux-noms`,
`cabinda-yombe-trois-conventions`, `cameroun-le-continent`, `carnaval-caraibe-fete-d-europe`,
`comprendre-afrique-noms` (short by design: a project introduction), `daloa-zokou-gbeuly`
(retitled: no source read explains the name Daloa), `diallo-djallo-jallow`,
`dioula-un-metier-une-langue-une-identite`, `ethnie-d-ou-vient-le-mot`,
`garvey-arbre-sans-racines` (short). Batch B, 9 of 11: `ghana-qui-a-choisi-le-nom`,
`griot-d-ou-vient-le-nom`, `guinee-vingt-neuf-peuples`, `igbo-enwe-eze-sans-roi`,
`krio-quatre-vagues-freetown` (short), `liberia-nom-latin-libre`,
`pourquoi-la-meconnaissance-freine-l-afrique` (short position piece), `pygmee-d-ou-vient-le-nom`,
`swahili-le-nom-de-la-cote`.

**Not written although eligible by the mechanical test, because the evidence does not support a
body:** `rastafari-ras-tafari` (every claim rests on books our Amhara fiche cites only "via
Wikipedia"; Britannica and the Gleaner were unreachable; the negus date differs between the card
and the fiche); `senoufo-syenambele` (none of the central claims is anchored in a source anyone
read; card 7 contradicts card 6). What would unblock each is in the batch B report and cases.

**Blocked, not attempted (35 drafts with no parsed source):** afrique-depuis-les-independances,
afrique-province-romaine, bantou-cent-soixante-dix, bantou-mot-de-linguiste-allemand,
benin-royaume-jamais-au-benin, cameroun-crevette, cote-divoire-bouet-willaumez,
diaspora-noms-repris-saamaka, duala-peuple-avant-la-ville, exonymes-hottentot-kirdi-dogon,
frontieres-appartenance, fulbe-personne-appele-comme-ca, fulbe-sept-noms-un-sens-ouvert,
ghana-empire-jamais-sur-son-territoire, goma-un-nom-sans-source,
keita-coulibaly-obligations-alliance, kouyate-jeli, krou-pas-lequipage, lectures-avant-recit,
lectures-independances, lectures-regard-exterieur, lectures-se-penser-noir,
lectures-traite-colonie, mami-wata-nom-anglais, mbappe-d-ou-vient-le-nom,
mercator-afrique-petite, mungo-park-fleuve-joliba, nigeria-flora-shaw,
noms-de-metier-dioula-teke, nzebi-muyambili-memoire, nzema-appolo-frontiere,
retour-ou-decouverte, toponymie-villes-montagnes-fantomes, vodun-mot-fon-esprit,
zombie-mot-bantou. Each needs its workshop SOURCES material extracted and read before a body
can honestly be written; the recovery report lists the per-item next action. Plus the 2 needing
recovery, 4 not published and 6 excluded in P3, and 8 drafts whose slides are not displayable.

**Decisions the operator needs to see**

- Two records gained sources the import had not parsed: Dioula (four) and Garvey (four), because
  the two original entries could not support the approved claims; Zokou Gbeuly was retitled.
- **Dioula:** the carousel shown with the article (12 September edition) still displays on cards
  1 and 2 the two claims the project retracted on 2026-09-23; the corrected video is still a
  proof, so no newer edition exists to show instead. The article uses what the opened chapter
  says and drops a quotation the approved narration attributes to Niane p. 142 that is not in
  the online chapter.
- **Agni-Anyi:** the library notes the render was not publishable (capital accents collide on
  5 of 6 cards) and the title was not approved, yet the post is filed as published.
- Card credit/image mismatches, reused images, date conflicts and registry-status conflicts
  (`pret` in the library vs live on the ledger) are unchanged in every article; none was
  resolved by guessing.
- **Pygmée:** a recognisable minor appears with no documented consent (marked to re-read);
  **Méconnaissance:** the reel uses cloned voices of named people whose usage rights the
  workshop never settled; soundtrack clearance for website reuse is recorded for no video.
- `PPL_YOMBE` cites a page about a different, Zambian Yombe group (needs `/afrik-curator`).

**Sources.** Each report separates pages opened this pass from pages the workshop recorded as
read. Where a fetch tool's summary looked implausible, only the workshop-recorded part was used.
The Wikipedia rule was applied: claims resting only on Wikipedia or on an unread work were dropped
or marked. That is the extent of source verification; nothing beyond the pages named in the
reports was checked.
