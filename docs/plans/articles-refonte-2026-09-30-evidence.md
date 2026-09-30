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

## P5 — pilot articles (in progress, 2026-09-30)

The three pilots (Mali, Lingala, Mandé) are written test-first against the
[semantic review cases](articles-pilots-review-cases.md), frozen before drafting. All three stay
`draft` with no `publishedAt`: publication needs operator review and a durable media host.
A green mechanical test is not prose approval.
