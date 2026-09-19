# Family restoration tracking

The `archive/famille_linguistique/*.txt` → `famille_linguistique/*.json`
conversion lost content on more than half the twenty-four families. This
directory is the control surface for putting it back: one ledger per family that
somebody has started restoring, named with the family id.

The tooling is `scripts/afrik/diffFamilyArchive.ts`, over the pure
`scripts/lib/familyArchiveDiff.ts`.

```bash
npx tsx scripts/afrik/diffFamilyArchive.ts                 # all 24, summary
npx tsx scripts/afrik/diffFamilyArchive.ts FLG_BERBERE     # one, in detail
npx tsx scripts/afrik/diffFamilyArchive.ts FLG_BERBERE --write
npx prettier --write docs/editorial/family-restoration/FLG_BERBERE.json
```

`--write` emits `JSON.stringify` indentation, which Prettier then collapses for
short arrays; the pre-commit hook does it anyway, but running it yourself keeps
`format:check` green in the meantime.

## A character ratio is a hint, not a measurement

The archive is markdown prose; the fiche is structured JSON. Part of any gap is
markup, so the ratio alone cannot say what was lost. FLG_BERBERE kept 17 % of
its archive's characters and had two entirely empty sections; FLG_KROU kept 45 %
and had none. The same kind of number meant two different things.

The diff therefore reports **named anchors** — the tokens a restoration has to
carry over or visibly decide to drop:

| Signal               | What it says                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `emptyTarget`        | the archive section is substantial and its JSON target is `{}`, `[]`, `null` or `""`              |
| `missingAnchors`     | years, proper-name pairs and author-year citations present in the archive, absent from the target |
| `missingSubheadings` | the `## 4.x` titles of a section that vanished whole                                              |
| `charRatio`          | kept for continuity with the first measurement; never the deciding number                         |

Comparison folds accents and case, so a section that rewords its prose keeps its
anchors and is not reported. `missingSubheadings` is listed **only** for a
section whose target is empty: once a section carries prose again, restored
content rewords its subject, and a title-word search would report
"Événements historiques majeurs" as missing while every event it covers is
present. A signal that stays red on correct work teaches people to ignore it.

## The ledger is a descending ratchet

`anchorBudget` records the anchors a family still does not carry, at the moment
its restoration was recorded. `scripts/__tests__/familyRestorationRatchet.test.ts`
recomputes the diff on every run and fails if a family drifts back above its own
budget. Each restoration pass lowers the number in the same change.

A family nobody has started has **no ledger**, and therefore nothing to fail.
That is deliberate: twenty-four ledgers written at once would be twenty-four
identical complaints, and this directory would stop being a record of work and
become a record of intent.

## What a restoration owes

- Every claim brought back carries a source with an explicit `tier`. A
  restoration that reintroduces untiered sources raises the count
  `scripts/ci/checkSourceTierCoverage.ts` holds down, and fails.
- Competing theories come back **with their divergence points**. The berber
  §4.2 that had disappeared held three theories of Berber origins — Camps and
  the Capsian, Ehret and the eastern Sahara, Diop and Obenga on
  Egyptian-Berber unity — the 1974 UNESCO colloquium in Cairo, the reception in
  African universities, and an explicit statement of where each departs from
  the comparative consensus. Restoring the thesis without the divergence would
  turn an exposed debate into an asserted position, which is the opposite of
  what the corpus does.
- The directives forbid Markdown in these fields, so archive bullet lists come
  back as prose.
- If a restoration reintroduces a `whyProblematic`, the fiche then **must**
  declare a `classificationStatus` and gain an entry in
  `docs/editorial/classification-status-ledger.json` — the contract in
  `scripts/__tests__/classificationStatusCorpus.test.ts` is symmetric.

## Order of work

By anchors lost, not by ratio. As measured 2026-09-18, after the Khoe pass:

| Family                  | anchors | empty sections |
| ----------------------- | ------- | -------------- |
| `FLG_BENOUECONGO`       | 119     |                |
| `FLG_SONGHAY`           | 111     |                |
| `FLG_CREOLE`            | 101     |                |
| `FLG_TCHADIQUE`         | 90      |                |
| `FLG_NILOTIQUE`         | 69      |                |
| `FLG_KXA`               | 68      |                |
| `FLG_SOUDANIQUECENTRAL` | 61      |                |
| `FLG_COUCHITIQUE`       | 58      |                |
| `FLG_AUSTRONESIENNE`    | 54      |                |
| `FLG_TUU`               | 46      |                |
| `FLG_OMOTIQUE`          | 45      |                |
| `FLG_KROU`              | 45      |                |
| `FLG_BERBERE`           | 44      | (restored)     |
| `FLG_KHOE`              | 40      | (restored)     |

**No family has an empty section any more.** `FLG_KHOE` was the last one; its
`historyAndOrigins` came back whole on 18 September 2026 and carries all of its
archive's anchors. From here the remaining work is uniformly the thinned kind,
so the order is simply the count — `FLG_BENOUECONGO` next.

`FLG_AFROASIATIQUE` is not on this list and is its own problem — its JSON is
larger than its archive. That fiche states the Obenga position without a
contradictor and leaves five of its sources unruled; it needs the state of the
debate added, not content restored.

## What a pass cannot fix from the archive, measured 2026-09-18

Restoring Khoe surfaced a defect that no amount of restoration reaches, because
it is not a loss: **twenty-four of the twenty-five families store
`decolonialHeader.historicalAppellations` as a string where the strict model
declares an array, and the string is the family's own English name** —
`"Afroasiatic"`, `"Bantu"`, `"Cushitic"`, `"Nilotic"`. Only `FLG_KWA` stores a
list.

Two consequences, and the second is the one a reader meets:

- It is the wrong content. A family's own name is not a historical appellation
  of itself — the same error `competing-appellations` refuses on a people's
  `exonyms`.
- `readNaming`'s `strings()` accepts an array and nothing else, so **24 of the
  25 families deliver zero forms** to the result page's appellations block. The
  surface that exists to show every name a thing is known by shows none of them,
  for this entire class.

Wrapping the strings in arrays would make it worse, not better: it would publish
"Afroasiatic" to a reader as a historical appellation of the Afroasiatic family.
Splitting `"Berber / Amazigh"` on the slash is not available either — deriving
forms out of a string is the rule the result page is built against. Each family
needs its real historical appellations read out of its archive header, which is
editorial work per family and not a conversion.

`competing-appellations` did not catch it: the rule returned early on a
non-array value, so a string read to it as a declared silence.

**Resolved 2026-09-19.** The rule now refuses a non-list value. Twenty-two
families were rewritten from their archives the same day (#1161); Khoe (#1164)
and Berber followed once their headers could be written from sources their
fiches cite — Berber after a new source was added, Yves Modéran (2003), because
its archive stated the Greek etymology flat where Modéran, read at the passage,
refines its path through spoken Latin. The named debt that held the last two was
deleted when it reached zero. Measured through the projection, 21 of 25 families
delivered forms to the result page after the first pass; with these two, 23.
