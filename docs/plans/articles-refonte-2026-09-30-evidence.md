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
