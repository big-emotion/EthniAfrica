# Atlas mockups — the visual oracle

The four contractual mockups behind the Atlas design system and the globe fiches.
`src/lib/atlas/assets/README.md` has referenced `docs/design/mockups/pages/famille.html`
since the atlas assets landed; this directory is what that reference points at.

| Page                | Artefact                                                       |
| ------------------- | -------------------------------------------------------------- |
| `pages/ds.html`     | https://claude.ai/code/artifact/64ae133e-6eb4-4ecd-ba4a-9ae07771e0b7 |
| `pages/pays.html`   | https://claude.ai/code/artifact/268e5091-253c-44f5-ada1-bb640f94a776 |
| `pages/peuple.html` | https://claude.ai/code/artifact/3451bec8-9ad7-48df-9bf3-5f8b96d2acd3 |
| `pages/famille.html`| https://claude.ai/code/artifact/8e7ff804-95e2-4bb1-a793-fe26612f5ff8 |

## Why the source, and not the published file

The published artefacts are ~1.4 MB each, of which ~1.33 MB is one inlined copy
of three.js r169 — the same bytes four times over. Committing them would put
5 MB of vendored engine into a repository whose own globe deliberately depends
on no 3D library at all (`src/lib/atlas/sphereLayer.ts` is raw WebGL, written to
stay under the budget that protects the Lighthouse mobile gate, FR78).

What is committed here is the hand-editable source: four page files of ~20 KB
each plus the shared parts they slot together. This is the form a reviewer can
actually read a diff of.

## Rebuilding

`parts/three.inline.js` is deliberately absent — see above. Restore it, then
assemble:

```sh
# 1. three.js r169, as an ES module, under the name build.js expects.
npm pack three@0.169.0                       # or fetch it any other way
tar -xzOf three-0.169.0.tgz package/build/three.module.js \
  > docs/design/mockups/parts/three.inline.js

# 2. Assemble
node docs/design/mockups/build.js            # → dist/{ds,pays,peuple,famille}.html
```

`build.js` substitutes seven markers per page: `/*@THREE@*/`, `/*@GEO@*/`,
`/*@CORPUS@*/`, `/*@AFRICA_PATH@*/`, `/*@SHELLCSS@*/`, `/*@NAVCORE@*/`,
`/*@GLOBECORE@*/`.

Both `parts/three.inline.js` and `dist/` are git-ignored: the first is vendored
weight, the second is reproducible output.

## Where the data comes from

- `parts/africa-admin0.json` — Natural Earth admin-0 110 m filtered to
  `CONTINENT == "Africa"`, coordinates rounded to the hundredth of a degree,
  enriched with `a2` (ISO 3166-1 alpha-2) and `fr` (French name).
- `parts/corpus.json` — real extracts from `dataset/source/afrik/`: `pays/NGA.json`,
  `peuples/FLG_BENOUECONGO/PPL_YORUBA.json`,
  `famille_linguistique/FLG_BENOUECONGO.json`, plus two aggregates computed over
  the 789 people fiches (peoples per country, derived footprint per family).
- `parts/africa-path.txt` — continent silhouette in the 800×758 frame keyed to
  lon −25→52 / lat 38→−35, the same frame as the Home mockup.

## Reading a mockup against this repository

A mockup is an oracle for **composition, geometry and motion**, not for
vocabulary or data. Three places where following it literally would regress the
product, and what the implementation does instead:

1. **Accent.** `pages/famille.html` scopes the family fiche to `--afh-cat-terre`.
   `FicheSequence.tsx` (REQ-091) excludes terre from every fiche on purpose:
   `IdentityPanel` reserves it for the imposed-exonym colonial marker, and a
   terre-accented page would paint that marker in the page's own accent until it
   stopped reading as a marker. The mockup can afford terre only because it
   renders no panels. The family fiche stays pervenche.
2. **Source tiers.** The mockup labels every source “Tier 1”. The project retired
   the Tier 1/2/3 scale for Officielle / Référencée / Non vérifiée, with
   `source_kind` orthogonal for AI provenance. Take the chip's shape, not its
   wording.
3. **The two empty cards (atlas).** The mockup hard-codes “vide” for `generalInfo.branches`
   and `distribution.distributionByCountry`. That is true of the recette database
   and false of this repository's corpus, where all 24 family fiches declare
   branches and a distribution. The implementation drives both cards from
   `classifyFieldProvenance()` so the page reads identically today and stays
   honest the day the corpus is loaded.

## Découvertes — `discoveries/discoveries-mobile.html`

The mobile reader reviewed before the feed was rebuilt as a full-screen reading
(2026-09-14). It is committed as the page Codex rendered, minus the sandbox
shim that wrapped it; the one photograph it embeds is the public-domain
Ouagadougou view the anecdote already publishes. Open it over HTTP — browsers
block the Lucide script under `file://`.

It was the reference the first implementation did **not** follow: that one was
built from an earlier "photo-mobile" handoff (see
`docs/tasks/discoveries-implementation.md`), which is why recette looked like
neither. What the rebuild takes from it, and what it deliberately does not:

- **Taken — the grammar of the reading.** A top bar of back, title and one
  control; the actions kept on the frame rather than under it (Garder,
  Partager, En savoir plus); the bottom sheet with a handle and a kicker
  naming what it holds (_Sources et contexte_); the _Parcourir_ sheet listing
  the site's destinations, because the full-screen reading hides the masthead.
- **Not taken — the parchment ground.** The operator asked for the behaviour of
  a Reel or a TikTok: black, edge to edge, over the site chrome. The night
  ground is licensed for this stage by name in `brand-charter.md` §5.1.
- **Not taken — the bottom action bar.** The actions stand on a rail at the
  right edge instead, the shape shared by TikTok and Instagram: a bar across
  the foot costs the photograph about 110 px on a phone, and the caption keeps
  the full width under a rail.
- **Not taken — Fraunces headlines in sentence case.** The card keeps the
  condensed uppercase face of the published shorts, so a reader arriving from a
  Reel lands on the same object.
- **Not built — the carousel story.** The mockup labels it a demonstration;
  no carousel is cleared for publication yet.
