# Atlas redesign — the work left, in sessions

Date: 2026-10-18. This plan finishes the redesign of the Atlas pages started on
2026-10-14 (briefs in [`../design/mockups/briefs/`](../design/mockups/briefs/README.md),
procedure in [`../design/mockup-first-workflow.md`](../design/mockup-first-workflow.md)).
It lists what is left, groups it into work sessions, and gives each session one
Jira ticket that a session can take with `/ethniafrica-ticket`.

## 1. Where the redesign stands

| Brief    | Surface                                                                                      | Boards                         | Code                                          |
| -------- | -------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| 1 to 5   | Result page, people, language, family, country fiches                                        | approved, recorded             | done (other sessions, PRs #1748 to #1783)     |
| 10 to 12 | Fiche folds and story link, self-name hand-off, unknown name, « Fiches » lens, consent strip | approved, recorded             | done (ETNI-2060 to ETNI-2063)                 |
| —        | Plain labels, no figure of style (operator rule, 2026-10-17)                                 | applied to the boards          | done (PR #1830), in recette, not yet released |
| 9        | « Notre démarche » page and footer B                                                         | approved 2026-10-16            | **to do**, session A                          |
| 6        | Family-name fiche                                                                            | approved 2026-10-18 (PR #1839) | **to do**, session B                          |
| 13       | One search component and the search page                                                     | approved 2026-10-18 (PR #1841) | **to do**, sessions D1 and D2                 |
| 14       | Atlas page « Les noms d'Afrique »                                                            | approved 2026-10-18 (PR #1844) | **to do**, session E                          |
| 15       | Result page, each account told once                                                          | approved 2026-10-18            | **to do**, session F                          |
| 7 and 8  | Place fiche, free-word page                                                                  | stale first drafts             | **to rewrite and draw**, session G            |

The last release, v5.6.0 (2026-10-17), predates PR #1830: nothing of this
redesign since then is on the production site yet.

## 2. The sessions

Each session is one ticket, one branch from `recette`, one pull request. Tests
first; every visible change is compared to its recorded boards at 430, 768 and
1440 px, and the board wins.

| Session | Ticket                                                          | What it delivers                                                                                                            | Depends on                                                            | Touches                                                                                  |
| ------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A       | [ETNI-2112](https://big-emotion.atlassian.net/browse/ETNI-2112) | Page `/fr/notre-demarche`, footer B on every page, link from « À propos »                                                   | nothing                                                               | `SiteFooter.tsx`, `AboutPageContent.tsx`, new page                                       |
| B       | [ETNI-2113](https://big-emotion.atlassian.net/browse/ETNI-2113) | Family-name fiche: title in the history's spelling, sources block, closing band, allied next names, folds, equivalents line | nothing; the two model questions are answered (comment on the ticket) | `src/components/patronymes/`, `NameClosing.tsx`, `nameClosing.ts`, `ficheNameClosing.ts` |
| C       | [ETNI-2104](https://big-emotion.atlassian.net/browse/ETNI-2104) | Griot accounts counted as oral traditions in name histories (94 candidate sources, 44 fiches)                               | nothing                                                               | corpus only, `dataset/source/afrik/`                                                     |
| D1      | [ETNI-2114](https://big-emotion.atlassian.net/browse/ETNI-2114) | `GET /api/v2/names/suggest` by first letters with the self-name; `src/data/searchedThisWeek.json` and its script            | nothing                                                               | `src/app/api/v2/names/suggest/`, handlers, services, `openapiV2.ts`, `scripts/`          |
| D2      | [ETNI-2115](https://big-emotion.atlassian.net/browse/ETNI-2115) | One search component on home, header and search page; header full screen below 768 px; the search page                      | D1                                                                    | `HomeHeroSearch.tsx`, `SearchModalV2.tsx`, `RecherchePageContent.tsx`                    |
| E       | [ETNI-2116](https://big-emotion.atlassian.net/browse/ETNI-2116) | `/fr/atlas` as « Les noms d'Afrique »                                                                                       | D1, D2                                                                | `atlas/(hub)/page.tsx`, hub components, `hubs.ts`                                        |
| F       | [ETNI-2117](https://big-emotion.atlassian.net/browse/ETNI-2117) | Result page: sources that link back, three accounts open, one row of controls, lens bar under the verdict                   | brief 15 boards recorded; B merged                                    | `NameClosing.tsx`, `NameTimeline.tsx`, `SearchFeed.tsx`                                  |
| G       | [ETNI-2118](https://big-emotion.atlassian.net/browse/ETNI-2118) | Briefs 7 and 8 rewritten, drawn and approved (design only)                                                                  | brief 15 boards recorded                                              | `docs/design/mockups/`                                                                   |
| H       | [ETNI-2105](https://big-emotion.atlassian.net/browse/ETNI-2105) | Origin accounts told inside the name history, with their claim status                                                       | B merged; a board pass first                                          | model, corpus, patronyme fiche                                                           |

## 3. Order

Three lanes can run side by side because they touch different files:

1. **Now, in parallel:** A, B, C and D1.
2. **Then:** D2 after D1; E after D2.
3. **Once the brief 15 boards are recorded:** F (after B, which shares
   `NameClosing.tsx`), and G on the canvas.
4. **Later:** H, after B and a board pass on `name-traore`.

```
A ─────────────────────────────┐
B ──────────────┬──── F ───────┤
C ──────────────┤     H (later)├── release
D1 ── D2 ── E ──┘              │
brief 15 boards ── F, G ───────┘
```

Conflict to watch: B and F both edit `src/components/search/timeline/NameClosing.tsx`
and `src/lib/i18n/copy/nameClosing.ts`; merge B first.

## 4. What only the operator can do

Done on 2026-10-18:

- The brief 15 boards are approved, with the tile of competing hypotheses
  always open; Claude Design is recording them.
- The two model questions of B are answered: follow the ticket's proposals
  (`nameHistory.originExplained`, an optional `equivalents` list), recorded as a
  comment on ETNI-2113.
- The nightly demand routine runs `scripts/buildSearchedThisWeek.ts` once it
  exists (D1) and commits the file; until then it skips the step.

Still to do:

- **Fix the thesis wording** and the doctrine §1.1 amendment; it unblocks the
  dossiers brief, which is not in this plan.
- **Publish a release** (`/ethniafrica-release`) once A, B, D2, E and F are
  merged, so the redesign reaches the production site.

## 5. Done when

- Sessions A to G are merged into `recette` and released.
- Every Atlas surface has approved boards and code that matches them at 430,
  768 and 1440 px.
- The next audience audit measures the effect: the result page's bounce under
  20 %, fewer than two searches per searcher, more than 0.3 result clicks per
  search (2026-10-13 values: 34 %, 3.8 and 0.09).
