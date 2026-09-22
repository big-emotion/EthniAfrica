# Architecture decision records

**ADRs are not kept in this repository. They live on Confluence as `DEC` pages.**

Eight ADRs used to sit in this directory as `0001-*.md` … `0008-*.md`. Commit `0e753c07`
removed all of them (0007 was later restored, see below), along with the rest of the in-repo spec, because they had become a second source
of truth competing with Confluence — and the two had drifted. Restoring them here would
recreate exactly the problem that commit solved.

Do not add new files to this directory. Record a decision on Confluence, in the Decisions tree,
and reference it by its `DEC-NNN` identifier from code comments, tickets and pull requests.

**One exception stands: [`0007-atlas-globe-engine.md`](./0007-atlas-globe-engine.md).** It is not a
new ADR and it does not reuse a freed number — it is the original 0007, the same decision of
2026-08-25, which came back with ETNI-1360 (commit `8ede9bf86`) carrying an amendment log. The
decision as written (adopt three.js) is not what shipped (hand-written WebGL 1), and the atlas
charter and its mockups cite this file by path, so a reader tracing why the globe looks the way it
does needs the decision and its divergence in one place they can open from the repository. It
stays put; anything new still goes to Confluence.

## Where the decisions live

|                          |                                                                     |
| ------------------------ | ------------------------------------------------------------------- |
| Confluence site          | `https://big-emotion.atlassian.net`                                 |
| Space                    | `ETHNIAFRIC` (space id `174948357`)                                 |
| Decisions parent page    | `178388993`                                                         |
| Requirements parent page | `178356225` — an **index**; the REQ bodies live in twelve sub-pages |
| Architecture parent page | `177963033`                                                         |
| Jira project             | `ETNI`                                                              |

These identifiers are the machine-readable copy in
[`../confluence-spec/config.json`](../confluence-spec/config.json), which the project tooling
reads. That file is authoritative for the IDs; this table is a convenience.

The `/ethniafrica-spec` project skill drafts new `REQ` / `DEC` / `ARCH` sections against those
pages.

## The eight removed ADRs

Listed so that nothing is lost track of. Each is recoverable in full with
`git show 0e753c07^:docs/adr/<filename>`. **Whether their content has been migrated to
Confluence `DEC` pages is unverified** — treat every row below as a candidate for migration
until someone confirms the corresponding `DEC` page exists.

| #    | Title                                                                 | Date       | Subject                                                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0001 | FR28 demographic tolerance band — transition plan                     | 2026-05-14 | Doctrine said per-country `percentageInCountry` must sum to exactly 100%; the validator gated at `[95,105]`. Sets the transition to a strict `[99,101]` target band.                                             |
| 0002 | Confluence as the engineering intent source of truth                  | 2026-07-24 | The decision this directory now enforces: one identifier system for requirements, decisions and architecture, hosted in the `ETHNIAFRIC` space rather than in the repo.                                          |
| 0003 | Supabase and Prismic content ownership                                | 2026-07-24 | Where a fact is allowed to live. AFRIK facts belong to Supabase; Prismic carries optional editorial presentation only, so the site, database and public API cannot disagree.                                     |
| 0004 | Colonial partition boundaries — no compatible dataset found (descope) | 2026-07-29 | Story 13.3 required a redistributable, adequately sourced colonial-boundary layer. None was found. Records the descope and what was already built against it.                                                    |
| 0005 | Scoped style CSP exceptions                                           | 2026-07-29 | Limits `style-src`/`style-src-attr` `'unsafe-inline'` to public `/fr` pages; API and admin routes keep the nonce-only policy and allow Next.js runtime styles by exact hash. Implemented in `src/middleware.ts`. |
| 0006 | Sourced anthroponym (surname) corpus — feasibility spike              | 2026-08-25 | Qualified go, scoped to wave 1, for the Names Atlas surname corpus (`DEC-019`, ETNI-1197).                                                                                                                       |
| 0007 | One textured-sphere globe for the whole atlas                         | 2026-08-25 | Replaces the bespoke point-cloud `HomeGlobe` with a single globe engine shared by the home hero and the three entity fiches. **Restored in this directory by ETNI-1360**, with its amendment log.                |
| 0008 | `nameFr` redefined as the country's name of usage                     | 2026-08-25 | `nameFr` had been documented as the official name, duplicating `nameOfficial` on 46 of 54 country fiches. Redefines it as the common name (ETNI-1290).                                                           |

`0001` and `0002` are the two that other files used to cite by path: the
Confluence bootstrap catalog and the `ethniafrica-bootstrap-confluence` skill now point at
`git show 0e753c07^:docs/adr/<filename>` instead of at a file that no longer exists. `0001`'s
demographic doctrine is superseded by DEC-055 and REQ-170: `CLAUDE.md` ("Demographics") is the
current statement.

Of these, **0002 and 0005 are still load-bearing today**: 0002 is why this file exists, and
0005 is the rationale behind the CSP scoping in `src/middleware.ts` — that rationale is now
stated inline in the middleware itself, so the code no longer depends on a document that was
deleted.
