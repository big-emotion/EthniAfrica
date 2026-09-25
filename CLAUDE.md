# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is, and the one question it answers

**EthniAfrica** is a Next.js 16 App Router app publishing an open, sourced atlas of African peoples, languages, linguistic families and countries, organised by the **AFRIK methodology** in a decolonial editorial posture.

Since the reorientation of 17 September 2026 it answers **one question — where the names of Africa's peoples come from.** That is a change of centre, not a tagline, and the plan that carried it is `docs/editorial/refonte-plan-2026-09-18.md`. The corpus did not move. What moved is **which surface is the product**: the search result page, not the fiche and not the home (REQ-178, DEC-057, ARCH-024). A reader arrives with the name they know, and the page shows every form the entry is known by, at the same weight, crowning none. The atlas, the dossiers and the games are what that answer rests on.

Four consequences, before anything below makes sense:

- **No form is promoted, anywhere.** DEC-057 retired the "pivot" — a head result promoted because its relevance doubled the runner-up's. A page that crowns a name contradicts the doctrine it exists to publish. `selectNameSubject` returns _every_ entity answering to the name, and several means a disambiguation rather than a choice made for the reader. **The name a people gives itself is listed first** (operator ruling, 2026-09-22), then the filed name and the others, on every surface that shows a people's names — an order, not a promotion: every form keeps the same weight.
- **A reader arrives with an exonym, not with the filed name.** The Fula entry is filed `Fula (Fulbe / Peul)`; « peul » is what gets typed. Matching the filed name alone made the most-searched African ethnonym in French reach no subject at all.
- **Five classes answer this question in five storage shapes**, and exactly one module reads all five. See below.
- **Listing what the corpus contains is the retired register.** Sentences that enumerate the six classes read as an encyclopaedia without using the word, which is what the reorientation moved away from. The copy modules were passed for this on 18 September 2026; `docs/editorial/refonte-plan-2026-09-18.md` records what was found and what was deliberately left.

The codebase is **bilingual — English and French — while publication fails closed to French-only** (ARCH-021, REQ-140). `Language = "en" | "fr"` is derived from `LOCALES` in `src/lib/locale.ts`, and `[lang]` resolves to either only when `SITE_LOCALE_MODE` publishes both. Missing or invalid configuration means `fr-only`; `bilingual-fr-default` publishes both while keeping `/` on French, and `bilingual-en-default` is the later explicit English-default launch. A reader's explicit choice is remembered in the `ethni-locale` cookie; only the language switcher writes that cookie. `/fr/*` resolves unchanged. English URLs carry **English slugs** (`/en/atlas/peoples/...`) that `src/middleware.ts` rewrites onto the French route folders under `src/app/[lang]/` (DEC-049), so a route rename is two slug entries in `src/lib/routing.ts`, never a second folder tree. There is no third locale: `es`/`pt` and any other two-letter segment 308 to the configured default. An `en` branch is expected wherever a locale is switched on; a `["fr"].includes(lang)` guard is the retired shape.

The public REST API is **v2 only** (`/api/v2/*`). V1 (regions/ethnicities) was removed; anything referring to `regions` or `ethnicities` as entities is stale.

## Commands

```bash
npm run dev                 # dev server on :3000
npm run build               # production build
make check                  # full local gate: lint + typecheck + format:check + all tests (must stay < 5 min)

npm run lint                # eslint over src + scripts, content-cached (flat config; `next lint` is deliberately NOT used — see eslint.config.mjs)
npm run typecheck           # tsc --noEmit
npm run format              # prettier --write .

npm run test                # vitest run (happy-dom)
npm run test:watch
npm run test:coverage       # enforced thresholds: 70% statements/functions/lines, 60% branches
npm run unit-tests          # src/lib only
npm run integration-tests   # src/app/api
npm run api-tests           # src/app/api/v2

npx vitest run path/to/file.test.ts   # single file
npx vitest run -t "test name"         # single test by name

npm run e2e                 # Playwright; intentionally outside `make check`
npm run storybook           # :6006
```

### Repo-specific gates

**Two lists, because the difference is what matters.** This was one list headed
"all CI-blocking on every PR", and four of the gates named under it ran nowhere
— measured 2026-09-18 by grepping `.github/workflows` for every `check:` and
`test:` script in `package.json`. A gate believed to block, protecting only
whoever remembers to type it, is the worst shape a check can take. Three were
wired into CI in the same change; the fourth is listed below for what it is.

Run the same measurement before adding a line here.

**CI-blocking on every PR:**

```bash
npm run lint:req                    # @req annotation traceability (see below)
npm run check:jira-template         # docs/templates/jira-ticket-template.md must exist and match
npm run check:action-pins           # every third-party GitHub Action must be SHA-pinned
npm run check:workflow-shell        # every workflow `run:` block must parse under `bash -n`
npm run check:env-example           # .env.example and the code agree, both directions
npm run check:local-paths           # no local filesystem path in a public repo
npm run check:infra-disclosure      # no server address, SSH port, provider or datacenter name
npm run check:copy-literals         # French literals in components (survey; --staged blocks)
npm run check:orphan-docs           # a document nothing links to (ceiling 0)
npm run check:asset-weight          # tracked weight of public/ (total + per-file ceilings)
npm run check:glossary              # the bilingual glossary (REQ-144) — still blocks under REQ-171
npm run check:skill-parity          # a skill's canonical copy and its Codex entry point agree
npm run check:pagination-contract   # perPage default and maximum match every documented endpoint
npm run check:afrik-loader          # the loaders against the strict models
npm run check:rls-coverage          # every table reachable by PostgREST has a policy
npm run check:migration-files       # no duplicate version or name, no hole in the sequence
npm run check:production-ledger      # docs/productions/ — the publishing-cadence ledger validates
npm run check:dead                  # knip: unreferenced files, exports, dependencies (ratcheted ceilings)
npm run test:social-tools           # the social/ Node utilities (node --test, not vitest)
npm run test:charter-contracts      # aggregated design-charter contract suite
npx tsx scripts/validateAfrikData.ts        # AFRIK data integrity (FR26–FR52) — data-integrity.yml
npx tsx scripts/ci/checkEditorialRules.ts   # decolonial editorial rules — editorial-rules.yml
```

**Not per pull request, and measured the same way.** `check:migration-state` runs after the merge
(`migrate-recette.yml`, `recette-data-sync.yml`) and nightly (`data-integrity.yml`);
`check:migration-state:production` runs in the Release's deploy job; `check:embed-availability`
runs nightly in `embed-availability.yml` and only reports. None of them can block a PR.

**Local only — nothing fails if you skip it:**

```bash
npm run test:social-engine          # the render engine's test_*.py suites
```

It stays out of CI because it needs `python3`, the three exactly-pinned wheels
and `ffmpeg` on the runner. That is a cost, not an oversight — but it does mean
the engine drifts silently until somebody runs `make social-engine`, so run it
in any change that touches `social/harness`.

`npm run check:translation-parity` runs in CI and **cannot** fail the job
(`continue-on-error`, and the script exits 0 on findings). It is a report; see
the bilingual-content rule below.

## Architecture

### The result page — the surface everything else feeds

`/{lang}/atlas/recherche` is the product. Its contract is **REQ-178**, its
reviewed rendering is `docs/design/mockups/search/` (six cases × mobile,
desktop, and both at night), and its written grammar is
`docs/design/search-result-charter.md`.

```
src/lib/search/nameSubject.ts     # which entities the query is *about*
src/lib/search/naming.ts          # one projection over five storage shapes
src/components/search/NameAnswer.tsx   # the three movements, in order
src/lib/i18n/copy/nameAnswer.ts   # every word the page says, fr + en
```

Three movements. The first and third are **unconditional**; only the second
varies with what the corpus holds:

1. **What was searched** — the entry, or an admission that the atlas holds no
   such name, or a disambiguation when several answer to it.
2. **What the corpus has** — the forms, where they come from, what they raise,
   who says what today, and the eras, each block drawn only if a field fills it.
   A block never renders to announce that it is empty.
3. **What is owed regardless** — the declared silences, the conviction, and the
   invitation to correct. This is the half that does not depend on the data, and
   therefore the half a thin fiche would otherwise quietly drop.

Four rules, each of which was a defect first:

- **The confession belongs to the empty state alone.** « Nous ne connaissons pas
  ce nom » is a claim about the corpus. Drawing it while results are listed, or
  on a request that never reached the corpus, publishes a claim the corpus never
  made. `SearchStatus` carries `failed` separately from `loaded` for exactly
  this — the loader degrades every failure to an empty envelope and reports the
  difference through `answered`.
- **A qualifier is shown, never derived.** Three quarters of the corpus's
  exonyms are bare forms; the rest carry the qualifier inside the string, in 677
  distinct free-text values across 759 uses. Splitting on the parenthesis would
  publish those as if they were a vocabulary.
- **The searched form is marked, not promoted.** It tells the reader where they
  are without telling them which name is right.
- **A corpus field is never copied onto this page, it is translated.** No
  scholarly word reaches this surface — not _exonyme_, not _endonyme_, not
  _corpus_. A reader who wants the vocabulary meets it on a fiche or in the
  glossary.

**This surface cannot be judged from its tests.** Its suite was green on 9 563
tests while four of its states never reached a reader — the unknown-name state
unreachable, an outage drawing the confession, « peul » confessing ignorance
above a 40-million-person entry, and the head counting « 0 résultat » above the
confession. Render the page and look at each case; the capture harness is in
`/afrik-art-director`'s `references/capture.md`.

### Five storage shapes, one projection

The five classes all answer "where does this name come from" and each stores the
answer under a different key:

| Class     | Where the names live                                                      |
| --------- | ------------------------------------------------------------------------- |
| people    | `content.appellations`                                                    |
| country   | root `etymology` / `nameOriginActor` + `content.historicalNames`          |
| family    | `content.decolonialHeader`                                                |
| patronyme | root `spellings[]` + `origin`                                             |
| language  | root `alternateNames[]` + `whyProblematic` — inside `content` once loaded |

**`src/lib/search/naming.ts` is the only module that reads all five**, and
`readNaming(type, content, root)` returns one `NamingProjection` whatever it was
handed. Counts and the measurement behind the table:
`docs/design/search-result-data-shape.md`.

Before it, the search envelope surfaced naming for **peoples only**, so three of
the five classes delivered none of their names to the page that exists to show
them. Reading five shapes inside the component is how a block ends up rendering
on one class and silently missing on another; reading them here turns the
grammar's conditions into field checks.

The corpus's own patronyme model already has the shape the other four are
converging toward — one record per form, with its attestations and its sources.
That convergence is corpus work, tracked in the reorientation plan's chantier C,
and until it lands `readNaming` is what hides the difference.

### API: three layers, never two

Every `/api/v2` endpoint splits into route → handler → service. Adding an endpoint means touching all four of these:

```
src/app/api/v2/{resource}/route.ts   # HTTP: parsing, CORS, cache headers
src/api/v2/handlers/{resource}.ts    # business logic, serialization
src/api/v2/services/{resource}.ts    # Supabase queries — the only layer that talks to the DB
src/lib/api/openapiV2.ts             # OpenAPI spec (openapi:diff gates breaking changes)
```

Shared: `src/api/v2/utils/{validation,response}.ts`, `src/api/v2/schemas/` (zod), `src/api/v2/serializers/`, `src/lib/api/cors.ts`.

`src/middleware.ts` is load-bearing and does four unrelated jobs: CSP/security headers with a per-request nonce, locale resolution (`SITE_LOCALE_MODE` failing closed to `fr-only`, the `ethni-locale` cookie for an explicit choice, English slugs rewritten onto the French route folders, the resolved locale passed down as the `x-locale` request header so the root layout can declare `<html lang>`), API-key metering for `/api/v2/*` (a keyless request is served on the anonymous tier, 60 requests a minute per IP — the address always comes from `clientIp()` in `src/lib/api/clientIp.ts`, which counts `X-Forwarded-For` from the right (`TRUSTED_PROXY_HOPS`, default 1), never the client-writable left-most entry; a valid Bearer key, PBKDF2-hashed in `api_keys`, selects its tier's quota; a present but invalid key is refused with 401 rather than downgraded; `Origin` and `Referer` authorise nothing, because any client can forge them — so the frontend embeds no key and is metered like any anonymous reader), and Upstash rate limiting.

### AFRIK data pipeline

The corpus lives as JSON files in git, **not** only in the database:

```
dataset/source/afrik/           # the .json fiches — the editorial source of truth (count: git ls-files)
  famille_linguistique/FLG_*.json
  peuples/FLG_*/PPL_*.json
  pays/*.json
  {relations,noms,migrations}/
        ↓ src/lib/afrik/loaders/*JsonLoader.ts
Supabase tables: afrik_language_families, afrik_languages, afrik_peoples,
                 afrik_countries, afrik_people_countries
        ↓ src/api/v2/services/*
```

Fiche shape is fixed by the 17 strict models in `public/modele-*.json`: dossier, peuple, pays, linguistique, langue, media, relation, source, migration, recit-oral, frontiere-coloniale, and the six name models — nom and its five sub-models nom-jamu, nom-nisba, nom-patronyme, nom-patronymique, nom-totemique. Count the directory before quoting the number: this sentence once listed nine while sixteen were on disk, and `src/__tests__/agentInstructionsBilingual.test.ts` now holds it to the directory. Never skip, rename, or invent a section.

Hierarchy: **linguistic family → language → people → country.** IDs: families `FLG_*`, languages ISO 639-3, peoples `PPL_*`, countries ISO 3166-1 alpha-3.

Editorial work on fiches has a dedicated project skill: `.claude/skills/afrik-curator/`.

Loading the corpus is `scripts/migrateAfrikToDatabase.ts --target=recette|production` (`--target=staging` is retired and throws). `scripts/lib/afrikSyncTarget.ts` checks in the recette ref only; production comes from `AFRIK_PRODUCTION_SUPABASE_URL` with **no default**, because the default used to hold the recette ref and every production deploy loaded the corpus into recette. Runbook: `docs/runbooks/afrik-data-sync.md`.

### Supabase: two data clients, never interchangeable

- `src/lib/supabase/server.ts` — SSR / server components
- `src/lib/supabase/admin.ts` — service-role key, **server-only**

**The browser never reads the corpus from Supabase.** There used to be a third client — `client.ts`, anon key, browser — and this file described it for months after its last caller went away. Every read now goes through `/api/v2`, which is the better architecture, but it was only ever true in the code. The dead chain (`client.ts` ← `flags-client.ts` ← nobody) was removed rather than documented. `src/lib/supabase/auth-client.ts` is a separate, living thing: the browser authenticates directly, it just does not query.

Migrations are numbered and sequential in `supabase/migrations/` — the directory is the count, and `check:migration-files` keeps it free of holes and duplicates, so no number is quoted here. A merge into `recette` applies the pending ones there automatically (`migrate-recette.yml`), and publishing a Release applies production's the same way (`deploy-production.yml`'s `migrate` job). **That DDL runs through an SSH tunnel, and there is no DB URL secret** — `RECETTE_SUPABASE_DB_URL` survives in the repository secrets, unused. Both databases are self-hosted and neither publishes its Postgres port — measured 2026-09-03 for production, the host answers on 443 and refuses 5432 — so the `migrate` job forwards to the **`supabase-db` container** (`recette-db` for recette, same host, same key) over SSH (`SUPABASE_SSH_*`, five secrets, pointing at the **Supabase** VPS, a different machine from the app's), reads `POSTGRES_PASSWORD` from the stack's own `.env`, and runs `db push` on the runner against the loopback. Host port 5432 is **Supavisor**, not Postgres — a pooler a migration does not need, and which cost two deploys (it wants a tenant in the username, and authenticates with a password copy that `--force-recreate` does not refresh). A stored connection string was removed because it disagreed with the machine five times running. Production used to be manual on purpose; it stopped being so once the ledger became measurable, because a step performed by hand before every deploy is a step that gets skipped. `npm run migrations:diff` shows what a database is missing, `npm run check:migration-state` fails on anything pending, orphaned or edited-after-applying. Which of them are live on which project is tracked in `docs/runbooks/migration-state.md` — the ledger records some under timestamp versions rather than filenames, so a tool comparing version strings reports applied migrations as pending. **Production and recette are both self-hosted Supabase stacks on the Supabase VPS**, the first at `https://supabase.ethniafrica.com`, the second at `https://supabase-recette.ethniafrica.com` (ETNI-1958, DEC-056; `AFRIK_RECETTE_SUPABASE_URL` in `scripts/lib/afrikSyncTarget.ts`). That is why the Supabase MCP cannot see either: this repo's token lists exactly one project, and it is neither. That project, `shmrjtnfbqzceovroqjj`, is the **hosted** project that backed recette until ETNI-1958; it is kept **only as a rollback path** until ETNI-1962 decommissions it, so any statement that it "serves recette" is stale. A hosted Supabase project has exactly one environment and Supabase names it "production", so a dashboard label never identifies the application environment: read it off the `--target` value. `jajggbeimfudpzcxytbb` is the **retired** hosted project that once held production, still alive enough to answer and therefore still able to mislead — this file named it as production for weeks, and a secret left pointing at it is what blocked the v4.1.1 deploy. Its **ledger** is readable all the same: migration `042` exposes `applied_migrations()` to `service_role`, so `npm run check:migration-state:production` measures it over PostgREST. Only **DDL** needs the direct Postgres connection. Conflating the two is what kept production's schema state a claim in a runbook for thirty-two migrations. Every migration is a two-step rollout: recette first, prod second. Applying one and calling it done has already left a corpus loaded on one and missing on the other.

### Frontend

- **Anything about the brand, the look of a page, or whether an assembly of blocks holds together — invoke `/afrik-art-director` first, every time.** It loads `docs/design/brand-charter.md`, which sits above the four surface charters and settles what none of them does: the product's one name and where it comes from, the licence the footer owes the reader, the single token spine (`--afh-*`; shadcn HSL variables are aliases confined to `ui/`), one accent per page, the two display weights that are actually loaded, vertical rhythm, one alignment per block, and the imagery doctrine. It also carries the capture harness — this surface cannot be judged from the code, and recette sits behind Vercel SSO so it has to be served locally.
- **The result page has its own charter — `docs/design/search-result-charter.md`.** It is listed first because that surface is the product (see the architecture section above), and because it is the one charter whose rules are refusals: no form promoted, no qualifier derived, no block rendered to say it is empty, no confession outside the empty state. Its reviewed rendering is `docs/design/mockups/search/` and the shape of the data under it is `docs/design/search-result-data-shape.md`.
- **Start at `docs/design/atlas-charter.md`.** It is what the atlas surface asserts: the three cartographic encodings and the hard rule that a people never receives a closed line, the per-surface accent scope, the three entry points, the doctrine for showing a field the corpus does not fill, the panel's two anchorings, and the motion tokens. The reviewed rendering is `docs/design/mockups/` (four pages, `node build.js`); the engine decision and what actually shipped instead is `docs/adr/0007-atlas-globe-engine.md`. A charter-named test file is picked up by `test:charter-contracts` automatically.
- **A face, a size, a weight or an ink — read `docs/design/typography-charter.md` before choosing one.** §1 is the nine roles and §2 why editorial roles are fluid and controls fixed. §8 is the home element by element: which face, step and ink each element takes and why that one and not another. The principle it rules: the display face names, the body face explains and operates, the monospace only aligns figures in a column; an ink states a status, never a decoration. A new element on the home takes a row of that table — `homeTypographyCharter.test.ts` holds it — and one that fits no row is a design decision, not a new dress in its component.
- **Anything about the games — invoke `/afrik-game-designer` first, every time.** Inventing, critiquing, scoping or killing a game; writing or repairing quiz items; auditing the _Jouer_ hub; or just an offhand "ce jeu est nul" — the skill loads `docs/design/games-charter.md`, which is the contract that surface owes. The charter records why the hub cuts from eleven games to three, the item doctrine (stimulus → stem → options: a round that never names its subject is a coin flip), the near-pool rule for distractors, and the interface rules. Reasoning about a game without it re-derives conclusions that are already written down, usually wrongly.
- Tailwind + shadcn/ui in `src/components/ui/`; feature components grouped by domain (`country/`, `people/`, `family/`, `fiche/`, `home/`, `quiz/`, `search/`, …).
- Design tokens are CSS custom properties in `src/styles/tokens/*.css` plus per-surface `country-tokens.css` / `people-tokens.css`. Colours belong in tokens, not literals — `src/styles/__tests__/colorTokens.test.ts` and the charter contract suite assert this.
- Storybook uses **`@storybook/react-vite`, not `@storybook/nextjs`** — Next 16 dropped `next/config`, which `@storybook/nextjs` requires. Installs need `--legacy-peer-deps`.
- Mobile-first is mandatory. Breakpoints: mobile 430px · tablet `md` 720px · desktop `xl` 800px (country container max-width).

### `social/` — the render engine, and where its output is not

Every carousel and short the project publishes is drawn by Python under
`social/harness`, with Node utilities beside it in `social/tools`. The spec they
obey is `docs/design/gabarits-social/GABARITS-SOCIAL.md`, versioned here with the
tokens it reads, and **this file is the source — edit it here**, in the same
change as the engine code it constrains. It used to be a derived copy of a file
in the private workspace, marked "do not edit here", and it was a section behind
its source within a day; when the engine moved in (#976) the copy became the
source and the workspace's sync tool was deleted. No sync script exists, so
nothing will overwrite an edit made here.

**The code is versioned; the productions are not, and two variables draw the
line.** Both name a directory outright, because deriving either one is what tied
the engine to a layout this repository is not allowed to describe.

- **`ETHNIAFRICA_SOCIAL_PROJECTS`** — one subdirectory per subject _in the
  workshop_: its `cards.json`, its verified `assets/`, its narration, its scratch
  `work/`. A bare subject name on a render command resolves here. Unset, it falls
  back to the checkout's gitignored `output/social/`, so a fresh clone renders
  with nothing configured and loses the files with the worktree.
- **`ETHNIAFRICA_SOCIAL_POSTS`** — the finished posts, filed by status. No
  fallback, on purpose: `build-etat.mjs` exits rather than report an
  unconfigured library as one with zero subjects.

**A render is not aimed by either of them.** Each `cards.json` carries its own
`outDir`, which `produire` rewrites before every render from
`social/tools/library/register-post.mjs --where` — the folder of a post the
library ledger knows. Which status bucket that folder sits in is derived from the
post's `status` in that ledger, which `structure` and `produire` write through
the same tool, and the library's filing tool moves the folder to match — never
chosen by the engine, and never by moving a folder in the Finder. A subject left
unregistered stays in the workshop, where the pipeline state does not look.

**Any other destination inside a git checkout is refused** (`ethni_paths.py`,
`assert_writable`). Not hypothetical: 1,2 Go of masters were once rendered into a
site checkout's gitignored `output/`, backed up by nothing, because one command
line was wrong. The engine now lives in a checkout itself, so the guard carries
exactly one exemption — its own fallback.

Nothing derives a root from its own file location any more, in either language.
Seven Python files and four Node tools each did, which worked only while the code
sat beside the productions, and failed **silently** once it did not: a walk over a
directory that does not exist reports zero subjects, not an error.

```bash
make social-tools     # node --test, cheap, part of `make check`
make social-engine    # the Python suites, needs the venv; corpus suites need the workshop
```

The engine's virtualenv is gitignored and rebuilt from
`social/harness/requirements.txt`, which pins its three direct dependencies
**exact** — Pillow decides glyph rasterisation and NumPy the compositing maths, so
a minor bump silently re-renders the back catalogue. `ffmpeg` and `ffprobe` are
called as binaries and installed separately.

`src/styles/__tests__/gabaritsSocialTokenParity.test.ts` holds the engine's token
copy to the design system, value by value. A font stack the site opens with the
Next loader's `var(--font-*)` is compared with that entry dropped: Python
rasterises from the `.ttf` files it ships and would resolve the loader variable to
nothing.

What stays in the private library: the renders, the per-subject `cards.json` and
`SOURCES.md`, the render-verification shelves, the dated editorial guides, and the
one tool that files folders onto the library's own shelves.

### Publishing — the audience, the plan, the video

**Mémoires sonores (operator direction, 2026-09-25)** is a recurring musical
feature within EthniAfrica, for TikTok and Instagram only. Its approved
six-card editorial reference is `docs/design/gabarits-social/MEMOIRES-SONORES.md`:
three distinct subjects every Sunday, without a mandatory myth, name-origin
angle, companion reel or site article. For this feature, read that reference
before applying the general production-chain rules below. The carousel engine
reads `profil: memoires-sonores`; `ethni_carrousel2.py --brief memoires-sonores`
returns the current guide and six-card scaffold. Register with `--profile
memoires-sonores` in the private library only, without a fabricated site record.
The website's remit is unchanged; broader display names and bios for
these two accounts are approved in principle, with exact copy still pending.

The publishing chain runs in one order, and **all ten of its skills live here**,
under their `ethniafrica-` names. They left for the private workspace on
2026-09-10, on the rule that a public repository carries no production skills, and
came back on 2026-09-11 when that rule was reversed: an engine and a chain whose
history nobody can read are an engine and a chain nobody can repair. What did not
come back is the **output** — see `social/` below.

```
audience-audit → content-strategist → idee → structure → produire → (fin)
 site + réseaux     quoi publier                  porte : message ↑     ↓
                                                    publication : acte humain

reseaux-help — à tout moment : où j'en suis, doublons, prochain geste
```

- **Measure before planning — `/ethniafrica-audience-audit`.** It writes one
  dated report to `docs/audience/`, and the downstream skills refuse a report
  older than 30 days. Every figure counts **consented sessions only**: Plausible
  loads after the banner, so the number is a floor of unknown depth, never the
  audience.
- **Decide what ships — `/ethniafrica-content-strategist`.** Reads that report
  and never proposes a subject without the comparable's numbers attached.
- **Convert what already lands — `/ethniafrica-experience-optimizer`.** A page
  the report marks a dead end already has the audience a new page would have to
  earn.
- **Then the three that make it — `/ethniafrica-idee`, `/ethniafrica-structure`,
  `/ethniafrica-produire`.** A subject report, then the cards and their sources,
  then the render. **Nothing comes after `produire`**: the operator posts, then
  fills the Diffusion section of the subject's `post.md`. No skill publishes and
  no skill schedules — do not invent a fourth step.
- **The message gate — `/ethniafrica-message`.** Not a fourth step: `produire`
  launches it before rendering, and a production whose message does not pass
  renders as a proof only. It scores videos, carousels and site pages on a grid
  (the hook's question answered, the self-name first, exact dates, no group made
  more at home than another) and, since 2026-09-21, **requires no doctrine
  phrase**: a production that does not write « Ce peuple n'a pas été divisé » is
  not sent to proof for that. The gate exists because the 2026-09-13 message
  audit (`docs/audience/message/`) found the project's message in two productions
  out of twenty-seven while all of them had passed the four render gates.
- **The myth check — `/ethniafrica-mythe`.** Not a step either: `idee`,
  `structure` and `produire` each call it. It asks whether the subject undoes a
  belief its audience actually holds, and whether the correction is sourced in
  a fiche — because a correction written from memory swaps one myth for another
  (the first Côte d'Ivoire draft credited Bouët-Willaumez with a name the
  Portuguese navigators used centuries before him). « explique » is a valid
  verdict; only an invented myth or an unsourced correction blocks.
- **The onomastic challenge — `/ethniafrica-onomastique`.** Also not a step:
  invoked on demand, at any point, to check that a piece actually engages the
  project's own subject rather than the history around it — who named this
  people or place, since when, why it sits here on the map, and what the
  namers' heritage left behind, on the people's name and on the land's,
  separately. Born 2026-09-16 on `cabinda-yombe-trois-lignes`, whose first
  draft documented three border conventions with precision and never asked
  who named anything.
- **Where am I — `/ethniafrica-reseaux-help`.** Reads the pipeline state and
  `social/tools/etat-pipeline/bilan-sujets.mjs`, flags a validated post whose
  subject is already published in the same format, and names one next move.
- **Anecdotes and proverbs are coming** as content types. Neither is on the site
  nor has a template yet; the chain notes such a subject as an idea until one
  exists.

The first two are optional and upstream; `idee` can start without them. But a
plan written without the measurement is a plan written to taste.

`scripts/lib/audienceSkillContract.ts` guards the whole handoff: that the
producer writes the dated report, and that each consumer still opens it and names
its producer. A consumer edited until it no longer reads the report keeps running
and silently reverts to guessing, which is the failure the indirection exists to
prevent.

- **Anything about why a video or a post holds attention — invoke
  `attention-architect` first, every time.** Writing a hook, judging a script
  that explains well and still flattens, or filing a persuasion principle
  somebody sent you. It ships in the `agent-comms` plugin
  (`/plugin install agent-comms@big-emotion` from `big-emotion/agent-atelier`)
  alongside `video-director`, `audience-audit` and `content-strategist` — the
  generic counterparts of the three above, for use on any project.

Its doctrine is measured on this project's own shorts, and two of its findings
bind editorial copy here: **a video that opens no loop has no retention floor**
(13 views against 632–861 on the same channel in the same week), and **every
approved script carries exactly one reframe sentence** — the one that restates
the hook's absurdity as a meaning, and the one readers quote.

The ethical line is not optional on this surface. The mechanism that captivates
is the mechanism that manipulates; only a paid debt separates them. **A hook whose
question the corpus cannot answer is not a hook, it is bait** — and on a sourced
atlas it is also a lie about the corpus. Rhetoric stays labelled as rhetoric: the
most quoted sentence in the Bantu short is editorial emphasis, not a historical
finding, and carrying it forward as fact is how the atlas loses what it sells.

Social copy obeys the reader-facing register and the source-tier policy exactly
as fiche text does.

## Non-obvious rules

### `@req` traceability (`npm run lint:req`, CI-blocking)

Every `test()`/`it()` call needs `// @req REQ-NNN` within the 3 lines above it, and any exported symbol annotated `@req REQ-NNN` must have a test annotated with the same ID. IDs are validated against `docs/confluence-spec/req-catalog.json`. Pre-existing tests are grandfathered by diffing against the previous file content, so _new or renamed_ tests are the ones that fail.

**Never delete `docs/confluence-spec/*.json` or `docs/templates/jira-ticket-template.md`.** With the catalog missing, `lintReqAnnotations.ts` returns early and reports OK while checking nothing — a silently disarmed gate, which is worse than a red one.

### No local paths (`npm run check:local-paths`, CI-blocking)

This repository is public, so an absolute workstation path publishes the author's
machine and usually the private production workspace sitting beside the checkout.
Three such lines were already committed before the gate existed: an absolute
memory path in `ethniafrica-audit`, a private-workspace shelf listing in a
demography note, and an agent-config path in a lint helper. A fourth was sitting
uncommitted in a working copy, which is what the pre-commit half of this gate is
for.

Six patterns are refused: two absolute home prefixes, the tilde shortcut, and the
three directory names that identify the private workspace and the local checkout.
**The exact list lives in `scripts/ci/checkLocalPaths.ts` and nowhere else** —
this section deliberately does not restate it, because a gate that greps every
tracked file greps its own documentation too, and a second copy of the list would
fail the build for describing it.

**Server paths are not local paths.** Production's Supabase stack really does live
under a deploy user's home on the VPS and the runbooks have to say so, so that one
prefix is allowed by name, as are the SSH and cache paths in workflow `run:`
blocks.

The Linux pattern is anchored to the start of a path token on purpose. The first
version was not, matched every `src/lib/home/...` import in the codebase, and
buried the three real leaks under 84 files of noise. `--selftest` holds ten
fixture lines, half of them the false positives that made that version unusable.

### Dead code (`npm run check:dead`, CI-blocking)

`knip` (config in `knip.json`) tallies unreferenced files, exports, types and
dependencies; `scripts/ci/checkDeadCode.ts` compares each tally against a
recorded ceiling. **The ceiling is a ratchet, not a budget** — a count above it
fails, and so does a count _below_ it, with the line to change. A ceiling left
standing above the real number is a licence to climb back to it.

Six categories are held at zero (files, dependencies, devDependencies, unlisted,
binaries, duplicates); `exports` and `types` sit where they were measured and
can only go down. `ADVISORY_CATEGORIES` softens a category the way
`SOFT_CHECK_NAMES` does in `validateAfrikData.ts` — a visible line in a source
file, never a flag in a config. It is currently empty.

A hand-run script or a config-loaded module is **declared in `knip.json`, not
deleted**: `scripts/**`, `e2e/**`, the `src/lib/atlas/assets/generate-*.mjs`
asset generators, `src/test/server-only-stub.ts` (a vitest alias) and the edge
functions are all entry points nothing imports on purpose. Three dependencies
are in `ignoreDependencies` because knip cannot see their use: `sharp` (Next's
production image optimizer), `puppeteer` (`@lhci/utils` does not depend on it —
`.lighthouserc.js`'s `puppeteerScript` resolves it from the project) and
`@storybook/blocks` (imported by `.mdx` stories knip does not parse).

`ignoreBinaries` holds one entry, `python3`: the render engine is Python and
`test:social-engine` has to invoke an interpreter knip has no package for. That
script names `python3` rather than the venv's own path on purpose — spelling
`social/harness/venv/bin/python` out made the gate report an unlisted binary
_and_ failed with a bare "no such file" on a machine that had never built the
venv. The runner re-execs itself under the venv when one exists, and prints the
two commands to create it when one does not.

### Custom ESLint rules (`eslint/rules/`, plugin `afh`)

- `afh/no-bare-people-name` — people/language names in `components/people/**` and `components/country/**` must render through `<AutonymExonymHeading>` so autonyms keep their exonyms and `lang` attribute.
- `afh/afh-error-misuse` — the `--afh-error` token is reserved for error/invalid contexts.
- `no-console` is an **error** in `src/api/**`, `src/app/api/**`, `src/lib/{api,afrik,auth,supabase}/**`. Use `import { logger } from "@/lib/api/logger"`.
- `@typescript-eslint/no-explicit-any` is an error in `src/`, a warning in tests (Supabase builder mocks are deep chained objects).

The rules' own tests are `.js` under `eslint/__tests__/` and are explicitly listed in `vitest.config.ts` — they once fell outside the glob and never ran, which is how a broken rule shipped.

### Source Tier Policy (enforced by `validateAfrikData.ts`)

**Nothing is forbidden. Everything is labelled.** A source is never rejected for being weak; it is
tiered, and the fiche's confidence follows from the tiers it rests on. Excluding oral, community and
amateur knowledge would itself be a colonial filter — the decolonial posture is to publish the claim
_and_ its provenance, not to suppress the claim.

The gate is therefore not "reject weak sources" but **"every source carries an explicit tier"**. A
`sources` entry with no tier is a blocking error.

**A source's standing never fails a gate** (DEC-055, REQ-169). A name record, a relation, a colonial
border, a colonial event or a migration resting only on `unverified` sources passes
`validateAfrikData.ts` with a warning naming the record and its standing (`FR57-source`, `REL-5`,
`CR1`, `CR4`, `FR80`); so do a Wikipedia URL cited directly, a contested migration without
`datingNote` or `debate`, and a non-official source without notes. What still fails is not a
judgement of authority: a source with no tier or an invalid one, a record citing no source at all,
an invalid ISO 639-3 or ISO 3166-1 code, a country without admin-0 geometry, a `contested` or
`colonial-legacy` record with fewer than two sources, and a reader-facing register violation.

One three-value scale is used everywhere — code identifier, DB value, API payload and user-facing
label all say the same thing:

| Identifier (code + DB) | Label (UI)       | Confidence weight | What it covers                                                                                  |
| ---------------------- | ---------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `official`             | **Officielle**   | 1.0               | UN, UNFPA, SIL Ethnologue, Glottolog, UNESCO, IWGIA, national statistics institutes             |
| `referenced`           | **Référencée**   | 0.7               | Published, identifiable, verifiable work — academic, press, books. Not necessarily official     |
| `unverified`           | **Non vérifiée** | 0.4               | Aggregators, tertiary encyclopedias, blogs, social media, community accounts, AI-generated text |

**The CIA World Factbook was sunset on 2026-02-04** (<https://www.cia.gov/the-world-factbook/>);
its country URLs now redirect to that farewell page. An existing citation keeps its tier — an edition
is still an official, dated publication — but its locator must become a dated Wayback Machine
snapshot taken before that day, or the claim is re-sourced (UN, UNFPA, a national statistics
institute). A mirror such as OpenFactbook is an aggregator, at `unverified`. A live
`cia.gov/the-world-factbook` URL is never added as a new source: `RETIRED_CIA_FACTBOOK_URL_CEILING`
in `validateAfrikData.ts` holds the ones still standing, and fails in both directions. Prior art:
`AUDIT-CIA-FACTBOOK-RETIREMENT-2026` in `docs/editorial/country-enrichment/COD-source-review.json`.

This supersedes the earlier Tier 1/2/3 policy, under which Tier 3 was forbidden and an uncitable
claim was deleted. It also settles the aggregator question (Joshua Project, 101lasttribes,
peoplegroups): they are cited, at `unverified`.

Wikipedia is not a source. A primary source _discovered through_ Wikipedia is cited at its own tier,
by its own URL, and its `notes` field may record which Wikipedia language versions were crossed. No
gate requires that path, and a Wikipedia URL cited directly is reported, not refused.

**Wikipedia is a first-pass verification tool, and this applies to every action, not only citing a
claim** — curation, production, an audit, a rewrite. Decided 2026-09-14, after a video script asserted
a claim from memory that no source backed and dropped a real, footnoted naming theory the corpus had
not yet surfaced. Before asserting a claim (a date, a name, an origin, a figure), open the relevant
Wikipedia article and read what it says and — more importantly — what it cites. A discrepancy between
a draft and Wikipedia's own footnoted sources is a signal to re-check, not proof either side is wrong:
Wikipedia's citations are themselves tiered like any other source, never taken as true because
Wikipedia states them. Sourcing has no bottom rung reached by insisting harder — even an `official`
source ultimately rests on someone's report, record or analysis — so the discipline is to cite at the
right tier, not to chase an unsourced certainty that does not exist.

#### `needs_review` is a transitional marker, not a tier

A corpus citation nobody has ruled on yet says `tier: "needs_review"`. It is a marker at the corpus
boundary, never a fourth tier, and it exists to disappear:

- **Stored as `NULL`** in `sources.tier` by the loaders of the three directories that carry it —
  `peuples/`, `pays/`, `famille_linguistique/` (`provenanceWriter.ts`, `peopleAppellationLoader.ts`).
  Folding it onto `unverified` would publish a ruling nobody made. The name, patronyme, relation,
  migration and person loaders pass `source.tier` through unchanged, which holds only while their
  directories carry no `needs_review`. Migration `088` admits the literal.
- **Labelled "En attente d'examen"** / "Awaiting review" (`SOURCE_PENDING_REVIEW_LABEL`), visually
  distinct from the three tiers.
- **Weighted 0.4** by `recompute_confidence()` (migration `088`): not yet judged cannot claim more
  than judged weak.
- **Held by a two-way ratchet**, `NEEDS_REVIEW_RATCHET` in `scripts/ci/checkSourceTierCoverage.ts`. Read
  the constant for the current count.
- **Resolved one citation at a time**, never by domain bulk: a moderator decides in the admin queue
  (`/fr/admin/sources`), the decision is pulled into the git ledger
  `docs/editorial/source-review/source-tier-rulings.json`, and `scripts/afrik/applySourceTierRulings.ts`
  writes it into the fiches. A database-only edit is overwritten by the next sync, so a ruling that
  does not reach git has not happened. The moderator's rationale lives in the ledger and never in
  `sources[].notes`, which readers see verbatim.

When the ratchet reaches zero, `needs_review` is removed everywhere it is spelled: `SourceTierState`
and its zod, OpenAPI, badge and facet branches, and the value admitted by `sources_tier_check`.

#### Tier is authority; `source_kind` is provenance

They are orthogonal axes and must not be collapsed:

- `tier` — how much authority the source carries.
- `source_kind` — what kind of thing the source is (`sources.source_kind`, migration `031`).

AI-generated text is the worked example. It is not a level of authority — it is unverified content
whose _origin_ happens to matter. So it is `tier: "unverified"` + `source_kind: "ai_generated"`, and
`recompute_confidence()` multiplies rather than branches:

```sql
CASE s.tier
  WHEN 'official'   THEN 1.0
  WHEN 'referenced' THEN 0.7
  WHEN 'unverified' THEN 0.4
END
* CASE WHEN s.source_kind = 'ai_generated' THEN 0.5 ELSE 1.0 END   -- 0.4 × 0.5 = 0.2
```

which reproduces the retired `ai-enriched` weight of 0.2 exactly. The UI keeps the distinction
visible: the **Non vérifiée** badge plus an AI provenance marker driven by `source_kind`, never by
the tier.

DEC-052 makes a narrow exception for people names. `oral_tradition` and
`ethniafrica_synthesis` both retain `tier: "unverified"`, but their source-quality
weights are fixed by provenance at 0.6 and 0.3 respectively. These values **replace**
the tier weight; they are not coefficients. An oral source qualifies a people name
only through an approved, rights-cleared narrative linked to that people, and one
such narrative is sufficient. The synthesis may qualify a people name on its own.
Narratives with the same opaque `carrier_ref` count once in the source-count part
of confidence. Patronyme and other name gates remain unchanged. This is a scoped
exception to REQ-095 for the provenance of a people's name, not a change to how
oral accounts support other assertions.

A fiche sourced only at `unverified` is published and visibly marked low-confidence through
`ConfidenceChip`. That is the intended outcome, not a defect to fix.

#### Assertion tracks certainty, in the sentence itself

**The more a claim is disputed, the less assertive the sentence that carries it.** A tier
labels a source; this rule governs the prose that rests on it, everywhere the project
writes — fiche text, dossier chapters, card copy, narration, captions. It is not a style
preference. A flat assertion over a contested claim is a factual error about the state of
knowledge, and on a sourced atlas it is also a claim about the corpus that the corpus does
not support.

The register has three steps, and the right one is chosen by what the sources actually do:

| What the sources do                             | How the sentence reads                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| They agree, at `official` or `referenced`       | « X est Y. »                                                                          |
| They diverge, or a single tier carries it alone | « Selon X, … », « une lecture y voit… », « la piste la plus citée est… »              |
| They do not settle it                           | « L'origine de X n'est pas établie. » — then the paths, each attributed, none crowned |

Where several explanations compete, **the piece names more than one or names none**.
Picking one and stating it flat is the failure this rule exists to stop: it was measured
on 2026-09-16, when a Guinea card asserted « Guinée est un mot portugais » while the
corpus held three unsettled accounts of that name and the subject report had already
recorded that none could be preferred.

Note the asymmetry this creates with the tier scale, and keep it: an `official` source
still carries a contested claim when other sources contradict it. **Tier measures who is
speaking, not whether the question is closed.**

#### Whose account gets told, when the corpus is lopsided

The AFRIK corpus is built overwhelmingly on European scholarship — colonial
administrators, missionary linguists, metropolitan academies — because that is what was
written down, catalogued and digitised. African oral, community and vernacular accounts of
the same names are thinner in it, and often absent. That imbalance is a property of the
archive, **not a verdict on which account is true.**

So defaulting to the European explanation because it is the one the corpus carries is not
neutrality. It reproduces the archive's bias and publishes it as rigour, to an audience
that is largely African and reads that choice immediately. The discipline that follows:

- **Where a local account exists, it is named alongside the external one**, at its own
  tier, in the same breath — not relegated to a footnote or dropped for being weaker.
  Excluding it would be the colonial filter the Source Tier Policy exists to refuse.
- **Scientific and linguistic method stays the frame for verifying sources, never the
  arbiter of whose account deserves to be heard.** It answers « is this attested, by whom,
  when » — it does not answer « which people's explanation of their own name counts ».
- **Silence about the imbalance is itself a choice.** Where the corpus can only offer
  outside sources on a name, the piece may say so.

The operative version for productions, with the questions to run and what to do when a
local account and an outside one disagree, is in `.claude/skills/ethniafrica-onomastique/`.
It is written once, there; this section states the rule and does not restate the procedure.

### Demographics

2025 reference year. Per-country `percentageInCountry` is meant to sum to 100%. The validator reports a wide band [95, 105] (FR28), the target band [99, 101] (FR28-strict) and a country declaring no split at all (FR28-declared) — **as warnings naming the country and the sum, never as failures** (DEC-055, REQ-170). The bands failed the build for a while after the ~30-country re-sourcing reached zero offenders; that lock was lifted because a partial figure that says it is partial serves a reader better than no figure. The reader is told instead: `PeoplesSection` labels the breakdown « Répartition estimée ou incomplète » whenever its declared shares do not round to 100 %. Which checks are advisory as a whole is one exported constant, `SOFT_CHECK_NAMES` in `scripts/validateAfrikData.ts`; only `FR52-coverage` is in it — the FR28 checks emit warnings themselves.

### Colonial terminology

Keep colonial-era names but explain why they are problematic, and always surface the autonym. `checkEditorialRules.ts` enforces: an autonym is required at `confidence >= medium`, and ≥2 sources when `classification_status` is `contested` or `colonial-legacy`.

**And that the fiche has decided about the names it is known by** —
`competing-appellations`, added 2026-09-18 with the reorientation. The autonym
was required and the competing forms were required nowhere, which left the
result page promising every name a people is known by while resting on a field
nothing filled. The rule does **not** demand an exonym: an empty list is a
declared silence and passes, an absent key is an unanswered question and fails.
Countries are exempt — they carry their names under a different key. Three
fiches failed it on the day it landed and were corrected from their own sourced
prose rather than from new research; the corpus half of the work, filling the
competing forms where the fiche is silent, is the reorientation plan's
chantier E.

### Chronological symmetry (REQ-148)

A `content.kingdoms[]` entry carries `entryType` (`polity | colonial | modern`) and, where the corpus can state them, machine bounds in `timeRange` — the same shape the migration model validates. **`period` stays the reader-facing label and is never derived from the bounds**: it holds nuance ("apogée", "déclin progressif") that integers do not.

Two gates. `REQ-148 Kingdom time ranges` in `validateAfrikData.ts` holds the shape and refuses a range sharing no time with its own label. `chronology-symmetry` in `checkEditorialRules.ts` refuses the asymmetry that made this necessary: **a country that dates its colonial administrations must date its precolonial polities**, because the atlas was showing "1894 - 1962" for the protectorate and "Précolonial" for the five kingdoms above it. It is not a completeness check — a country that dates nothing passes.

The entries that still violate it are held by `UNDATED_POLITY_CEILING` in `scripts/ci/checkEditorialRules.ts` — read the constant for the current number; a copy of it here is the kind that drifts — a ratchet that fails in both directions like `DEAD_CODE_CEILINGS`. Each editorial pass lowers it in the same change; at zero the ratchet is deleted and the findings become errors. `scripts/afrik/backfillKingdomTimeRange.ts` (dry-run by default) prints the queue by country and **never invents a bound** — an entry whose label names an era rather than a date stays undated and visible to the gate.

### Archive → JSON restoration

The conversion of `dataset/source/afrik/archive/famille_linguistique/*.txt` into the live `famille_linguistique/*.json` **lost content on more than half the twenty-four families**. `FLG_BERBERE` had two entirely empty sections and no longer contained the word "Diop"; the sub-part carrying the three competing theories of Berber origins, the 1974 UNESCO colloquium in Cairo and the explicit divergence points had simply gone.

A character ratio is a hint, not a measurement — the archive is markdown, the fiche is structured, and part of any gap is markup. `npx tsx scripts/afrik/diffFamilyArchive.ts` reports **named anchors** instead: years, proper-name pairs and author-year citations the archive holds and the fiche does not. `docs/editorial/family-restoration/` records one ledger per family somebody has started, and its `anchorBudget` is a descending ratchet — a family nobody has begun has no ledger and nothing to fail. Doctrine and running order: that directory's `README.md`.

**A restored theory comes back with its divergence points.** Publishing Diop and Obenga without the reasons comparative linguistics does not follow them would turn an exposed debate into an asserted position — the failure `FLG_AFROASIATIQUE` currently exhibits in the other direction, stating the Obenga position with no contradictor.

### Reader-facing register

Three fiche fields are published to the reader **verbatim**, with no sanitising layer: `gaps[].reason`, `sources[].title` and `sources[].notes` (nested under `names[].sources[]` on name fiches). Everything else, `_meta.directives` included, is authoring metadata nothing renders.

So those three may carry no repository path, no JSON field path, no raw `PPL_`/`FLG_`/`PAT_` identifier, and none of the pipeline's own vocabulary — _file d'attente_, _la passe_, _protocole de recherche_, _revue claim-level_, _tier hérité_. That last class is the one that got through: it carries no path and no identifier, so it reads as ordinary French, and 774 name fiches told their visitors which queue they came from and which research protocol they awaited. **The reader is owed the silence itself, never the reason the workshop has not filled it yet.**

`checkEditorialRules.ts` enforces this as `reader-facing-register` at error severity; the banned vocabulary is one exported constant, `INTERNAL_REGISTER_PATTERNS`. Doctrine, rewrite table and a paste-able prompt block for curation sessions: `docs/editorial/reader-facing-register.md`.

**No reader-facing text calls the project an "atlas"** (operator ruling, 2026-09-22). An object that "documents", "holds" or "does not say" is replaced by a project that speaks: « nous », « notre projet », EthniAfrica; the section a reader browses is « Parcourir ». URLs (`/atlas/…`), identifiers, comments, the titles of real works (UNESCO's _Atlas des langues africaines_…) and the Atlas mountains are not self-references and stay. `src/lib/__tests__/noAtlasInReaderCopy.test.ts` scans the site's string literals and JSX text for it.

### Bilingual content (`npm run check:translation-parity`, reported — never blocking)

Content added or changed in either language should carry its counterpart in the other, or an explicit deferral with a reason — a fiche field, a home fact, a UI string, a quiz template. The report is symmetric: French without English is listed exactly as English without French is, and a source field edited after its translation was produced is reported as drifted (REQ-145).

**Parity is reported, never blocking (REQ-171, DEC-055).** It runs in no pre-commit hook, and its CI step in `build` prints warning annotations and cannot fail the job (`continue-on-error`, and the script exits 0 on findings in every mode). Publication is French-only by `SITE_LOCALE_MODE`, so a missing English field holds back nothing a reader sees — while blocking on it held French back. The accepted cost is that English may drift; read the report before switching a locale on. This is "for now" in DEC-055's words: it is a posture tied to French-only publication, not a retired contract. Only a malformed invocation (`--base` with no ref) exits non-zero.

For a French corpus record, the only deferral form is a non-empty reason at
`_translation.deferred.en` in the source record. The report lists that reason
as a notice, and an empty reason as a finding. UI dictionary keys cannot be deferred.

Two kinds of content, two homes. **UI copy** lives in locale-keyed dictionaries — `src/lib/translations.ts` today, the `src/lib/i18n` modules as they land — and a keys-parity test (`src/lib/i18n/__tests__/copyParity.test.ts`) holds `en` and `fr` to the same key set, so a string added under one locale fails the suite until the other has it. That test **still fails the build**: interface copy is written in both languages at once, and REQ-171 does not relax it (a DEC-055 open question). **Corpus translations** never edit the French fiche: they are records under `dataset/translations/<lang>/`, produced by `npm run translate:record`, and carry their own provenance.

The rules themselves — which fields are never translated, the glossary, the English register — live in `.claude/skills/afrik-translator/` and are reported by `scripts/ci/checkTranslationParity.ts`. The glossary is the exception to "reported": `npm run check:glossary` (REQ-144) is its own CI step and **still fails the build**, since REQ-171 relaxes counterparts, not terminology. This file does not restate them, because three copies of one doctrine are how it drifts: invoke the skill before translating anything and let the report name what is missing.

The parity report describes content readiness, not publication. It never changes
`SITE_LOCALE_MODE`; unfinished English therefore remains silent while the
deployment stays on the default `fr-only` mode.

### TypeScript

`strict: false`, `strictNullChecks: false`, `noImplicitAny: false`. The compiler will not catch nullability here — tests are the real gate. `@/` aliases `src/`.

## Workflow

### Git

- **One worktree per agent session.** Any agent task that writes to the repo — a background job, a Ferry run, `/ethniafrica-ticket`, a hand-launched sub-agent — must first isolate itself in its own git worktree (`EnterWorktree`, or `git worktree add .claude/worktrees/<name>`), never edit in the shared checkout. Parallel sessions sharing one working copy overwrite each other's edits and switch branches under each other. Read-only work — search, audit, answering a question — stays in place. Commit and push before the session ends: the worktree can be deleted with it.
- **A fresh worktree is not a working environment until it is provisioned.** `npm run worktree:setup` (i.e. `scripts/setup-worktree.sh`) clones `node_modules` from the main checkout, copies `.env.local`, and points `core.hooksPath` back at husky. A `PostToolUse` hook on `EnterWorktree` runs it automatically and `.worktreeinclude` carries the env files, so a Claude-created worktree needs nothing; **a worktree created by hand with `git worktree add` must run it explicitly.** Skipping it does not fail loudly: `vitest`, `tsc` and `eslint` resolve upward into the main checkout and pass — including on a dependency the worktree never installs, which is how a local green ships a CI red. `next dev` and `next build` are the ones that refuse outright, because `turbopack.root` is the worktree and a symlinked `node_modules` still resolves outside it.
- `recette` is the integration branch; `main` is the base. **`recette` is protected** — always branch and open a PR, never push directly.
- **A new clone branches worktrees off `main`, which is the wrong base here.** `EnterWorktree` and agent isolation resolve their base from `refs/remotes/origin/HEAD`, which a fresh `git clone` sets to GitHub's default branch. Point it at the integration branch once per clone:

  ```bash
  git remote set-head origin recette
  ```

  It is local git state, so it cannot be committed and every new clone needs it again. Without it a worktree starts dozens of commits behind and its PR carries the whole `main → recette` delta. Verify with `git symbolic-ref --short refs/remotes/origin/HEAD`; the `worktree.baseRef` setting only chooses between that ref (`fresh`, the default) and the local HEAD (`head`) — it cannot name a branch.

- **A PR is never merged over a red required check**, whatever the cause. When an environment outage turns every gate red, wait for it or fix the environment, then re-run. A red check that is "probably environmental" is unproven until it goes green: on 2026-09-14 six merges (#1037–#1041 into `recette`, #1031 into `main`) went through red `axe-core (Storybook)` and `Playwright smoke` during a recette egress-quota outage, and `main` then held code no green run had seen.
- `recette ↔ main` sync PRs must use a **merge commit**, not a squash; squashing has broken the ancestry before.
- Conventional commits (commitlint on `commit-msg`). Pre-commit runs `type-check` + `lint-staged`.
- Never add `Co-Authored-By` trailers.
- SHA-pin every third-party GitHub Action (`uses: org/action@<40-char-sha>  # <semver>`); `check:action-pins` enforces it and Dependabot bumps the pins weekly.

### Deploying

**Publishing a GitHub Release is the only thing that deploys production.** Not a push, not a tag. `deploy-production.yml` listens on `release: published`, SSHes to the production host (connection details in the `PRODUCTION_SSH_*` secrets and the operator's private notes), and rebuilds the container from the repository's `Dockerfile` + `docker-compose.yml` in `/srv/ethniafrica`. Use `/ethniafrica-release`; rollback is host-side and lives in `docs/runbooks/production-deploy.md`.

Vercel no longer auto-deploys anything — `vercel.json` sets `git.deploymentEnabled: false`, because per-push preview builds from parallel agent sessions exhausted the Hobby plan's quota. The recette preview is built on demand by running `deploy-preview-recette.yml` from the Actions tab.

Two couplings that fail silently: `production-data-sync.yml` chains off the deploy with `workflow_run`, which **only fires for workflow files on the default branch** — both files must be on `main`. And `UPSTASH_REDIS_REST_URL`/`_TOKEN` are mandatory in production despite reading as optional: rate limiting fails _closed_, so without them every `/api/v2/*` answers 500 while the pages render fine.

### Spec and tickets

**Confluence is the source of truth** for Requirements / Decisions / Architecture — not the repo. The in-repo copies were deliberately deleted (commit `0e753c07`) because they had drifted into a competing spec; don't recreate them. Page IDs and the Jira project (`ETNI`) are in `docs/confluence-spec/config.json`. Requirements live in twelve sub-pages under the Requirements parent — reading the parent alone will make you re-allocate an existing REQ number.

Project skills wrap the loop: `/ethniafrica-spec` (investigate → draft Pending REQ/DEC/ARCH + Jira tickets), `/ethniafrica-ticket` (take a Jira ticket end-to-end in an isolated worktree), `/ethniafrica-audit`, `/ethniafrica-release`.

Ferry (`ferry.config.yaml`) drives agent automation off Jira status transitions on ETNI — Refinement → READY FOR DEV → In Review → Changes Requested → TO MERGE — branching `ferry/*` off `recette`. One workflow, `ferry-router.yml`, handles every transition: a single Jira rule dispatches `ferry-transition` with the new status, and the router picks the agent from `trigger_column`. **It reviews and merges any PR whose ticket enters IN REVIEW or TO MERGE, not only `ferry/*` branches** — a `feat/*` or `fix/*` PR opened by `/ethniafrica-ticket` is reviewed and merged the same way once its ticket moves. The five per-agent workflows (`ferry-dev`, `-refine`, `-review`, `-iterate`, `-merge`) were superseded by the router and removed; the Jira setup and the legacy rules to keep disabled are in `ferry-jira-automation-setup.md`.

### Skills and agents — one source, two runtimes

Every skill lives once, under `.claude/skills/<name>/`. Codex reads the gitignored mirror `.agents/skills/`, which `npm run skills:link` fills with one symlink per skill — enumerated from the directory, so a new skill is linked and checked without editing a list. `check:skill-parity` holds each skill's resources to what its `SKILL.md` references; a resource of _another_ skill is written as its full `.claude/skills/...` path, or the checker looks for it in the wrong place. A sub-agent is declared twice because the two runtimes read different formats: `.claude/agents/<name>.md` and `.codex/agents/<name>.toml` carry the same instruction text.

### Test placement

Colocated `__tests__/` next to the code: `src/lib/**`, `src/api/v2/**`, `src/app/api/v2/__tests__/`, `src/components/**`, `eslint/__tests__/`. Known-failing tests are quarantined under any `__tests__/known-failing/` directory (excluded in `vitest.config.ts`) rather than deleted, so the gate cannot mask new regressions.

### Development principles

TDD (failing test first) and KISS. Tests exercise the public interface — no reflection into internals, no mock-everything suites that assert nothing. Comments justify non-obvious decisions; they never narrate what the code already says. All docs, comments, commit messages and PR descriptions in **English**, even when the conversation is in French.

### Environment

Copy `.env.example` → `.env.local`. Required to run: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only). Required for reporting to work at all: `ANTIBOT_HMAC_SECRET` (server-only, any long random string) — **not** inert when unset, `GET /api/v2/antibot/challenge` answers 503 and every report dialog dies on "la vérification n'a pas abouti" while the build stays green. It replaced `CLOUDFLARE_TURNSTILE_SECRET_KEY`, which no longer exists. Required in production: `NEXT_PUBLIC_SITE_URL` — `src/lib/siteUrl.ts` throws on a production server without it, so every page answers 500 and the container `HEALTHCHECK` fails, while `next build` is exempt and stays green; check the VPS `.env` before a Release. Optional subsystems: `UPSTASH_REDIS_REST_*` (rate limiting), `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `ANTIBOT_DIFFICULTY_BITS`, `ANTIBOT_TTL_MS`, `REVALIDATE_SECRET`, `SUPABASE_WEBHOOK_SECRET`. `NEXT_PUBLIC_FEATURE_QUIZ` is dead: nothing reads it since the quiz stopped hanging from a flag (the workflows that still set it are inert), so it is not in `.env.example` and is not an optional subsystem. The CI build passes placeholder Supabase values so fork and Dependabot PRs still gate.

Admin auth is a Supabase Auth magic link to an address on `admin_allowlist` (migration `074`, checked by `src/lib/supabase/moderator.ts`), and nothing else: GitHub and Google are disabled in `supabase/config.toml`, because the atlas has no public accounts for a provider to federate. First moderator: `npx tsx scripts/seedAdminAllowlist.ts <email> "<note>"` with the target project's service-role key — nobody can open the console to add the first address, so whoever holds that key writes it. Procedure: `docs/runbooks/moderation-access.md`. `user_roles` and `scripts/seedAdmin.ts` are **legacy**: the role opens no door in the moderation console; the table's one remaining reader is `src/lib/rights/protected-asset-access.ts`, which no route calls.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
