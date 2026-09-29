# Research-led narrative design for reels and carousels

Status: implemented (2026-09-30). Reels: first version. Carousels: added the same day as a
`format` branch of the same model; see [Carousels](#carousels).

## What changed, in one sentence

Before: research → an angle picked by the assistant → full narration. Now: research →
evidence-based proposals, each with its own arrangement and success criterion → the
operator's **real choice** → a detailed outline **shown** → narration. The point is that the
operator makes an informed editorial choice before paying for a script, visual preparation
or production.

All five stages belong to `ethniafrica-idee` (`.claude/skills/ethniafrica-idee/SKILL.md`).
`ethniafrica-structure` writes only after stage 5; `ethniafrica-production` resumes at the real
missing stage and never selects on the operator's behalf. No new skill exists.

## The five stages

| Stage | Work                                                           | Completion                                                       |
| ----- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1     | Frame the subject, audience, material, prior work, duration    | Subject and task unambiguous                                     |
| 2     | Research and assess evidence; reuse valid research             | Enough to judge narratives, or the gaps named                    |
| 3     | Examine the ten patterns; full cards for the suitable ones     | The operator can compare promise, mechanism and limits           |
| 4     | Record the operator's actual choice (or explicit delegation)   | A named proposal; a recommendation or a file is not a choice     |
| 5     | Develop the chosen proposal into a timed, evidenced outline    | The complete plan has been shown before any full writing         |

## Vocabulary (kept separate on purpose)

| Term            | Meaning                                       | Where it lives                                |
| --------------- | --------------------------------------------- | --------------------------------------------- |
| Family          | The kind of investigation (six, unchanged)    | `social/tools/contract/contract.mjs`          |
| Pattern         | How an argument unfolds (ten)                 | `social/tools/narration/narrative-design.mjs` |
| Common function | A job the reel must do, B1–B6                 | same module                                   |
| Block           | A unit of explanation in the outline          | the brief's `narrativeDesign.outline`         |
| Scene / shot    | A unit of visual production                   | scene plan, untouched here                    |

The ten patterns are a working editorial repertoire, not a claim that narratology knows ten
universal forms. `references/narrative-patterns.md` in the idee skill is the catalogue rendered
from the module (`check-narrative-design.mjs --catalogue`), and a test holds the two equal.

## Where it is stored

The private `_idees/<design-id>.md` report and `<design-id>.brief.json` pair. The brief gains a
`narrativeDesign` section (`version: 1`); the JSON is the authority for ids, the choice and the
outline, and the Markdown is its presentation. **The section is the explicit switch of the
route**: not inferred from a sentence, a family or a series, and never a way around the series'
safeguards. A brief without it follows its established path, and an approved older narration
gets no retroactive research or selection requirement.

Sections: `research` (sources with tier and `read|indirect|unavailable`, claims with
`sourced|qualified|gap` and a declared uncertainty, explicit `unknowns`), `patternAssessment`
(exactly one entry per catalogue pattern), `proposals`, `recommendation`, `selection`
(`kind: operator|delegated|synthetic`, statement, locator, date), `outline` (blocks with
functions, role, content, evidence and limits, transition, supported takeaways and criteria,
seconds; rationale; filled viewer statements) and `presentation` (what was shown, where, when,
with a digest of it). Block start and end times are derived from `seconds`; no timing is stored
twice.

## Commands

```bash
CLI=social/tools/narration/check-narrative-design.mjs
node $CLI <brief.json> --mode draft        # stages 1–3
node $CLI <brief.json> --render proposals  # what the operator reads at stage 3
node $CLI <brief.json> --record-shown proposals --where "conversation"
node $CLI <brief.json> --mode selected     # choice recorded; outline coherent if present
node $CLI <brief.json> --render plan       # what the operator reads at stage 5
node $CLI <brief.json> --record-shown outline --where "conversation"
node $CLI <brief.json> --mode handoff      # all five stages accounted for
node $CLI <brief.json> --resume            # the real missing step
node $CLI --catalogue                      # the pattern reference, rendered
node social/tools/narration/check-family-brief.mjs <brief.json>          # refuses a design that is not at handoff
node social/tools/narration/check-gabarit.mjs narration.fr.txt --brief <brief.json>   # narration check of this route
```

`--record-shown` digests what was shown into the brief. Editing the proposals or the outline
afterwards makes that presentation stale, so it has to be shown again; the choice must be dated
no earlier than the proposals were shown, and the outline shown no earlier than the choice.

## What the code checks, and what it cannot

Checked: all ten patterns assessed once each, with a reason for every unproposed one; the five
named fields and their links resolve; every takeaway has a criterion and every criterion a
supporting block; B1–B6 accounted for (only B2–B4 may be omitted, with a reason; B1 first, B5
before B6, B6 last; an off-family proposal states how it adapts the name wording); block content
not generic or pasted; no `gap` claim under the chosen plan; timings positive and summed, with a
visible reason above 180 s; viewer statements filled, never a formula; the choice is not
synthetic; both presentations recorded and current; the edition (question, family, claims,
`videoSequence` steps) is a snapshot of the design. The legacy gabarit is unchanged; this
route drops its scene list, name count and two-explanation ceiling and keeps the series'
closing word for word. The name, myth, geography, music and five universal reviews still follow
the claims and media (`family-routing.mjs`).

Not checked, and never claimed: that a human statement is genuine, that a historical claim is
true, that a story is compelling. Success criteria are learning goals, not evidence that an
audience was tested.

### Manual editorial checklist (the part a test cannot do)

1. Does each success criterion's expected answer come from the cited claims, with the limit
   stated, rather than sound plausible?
2. Are the accounts attributed to who holds them, without crowning one that only one source
   carries, and is a local account named beside an outside one where it exists?
3. Does any block turn an attestation date into a creation date, or a resemblance into an
   etymology?
4. Is a reference example honestly `real` (with a locator) or `hypothetical`?
5. Would the outline's order teach the takeaways to someone who has never heard of the subject?

## Demonstration

[`NARRATIVE-DESIGN-LINGALA-DEMO.md`](NARRATIVE-DESIGN-LINGALA-DEMO.md) is generated from
`social/tools/narration/narrative-design/fixtures/lingala-demo.brief.json` (a test holds them
equal). It shows the operator's view of stage 3 (three proposals, L1 competing explanations, L2
historical actor, L3 clarifying comparison, plus the disposition of all ten patterns) and of
stage 5 for L1. It reports what the operator's Lingala synthesis contains and its limits: it is
not an approved episode, not a verified source register, and **its selection is synthetic**
(`kind: synthetic` can never open a handoff). The Boundji 1938 claim is deliberately a `gap`, so
the outline cannot lean on it. A second fixture, `single-origin.brief.json`, is a clearly
synthetic single-origin case with one proposal and no invented competitor.

## Carousels

A carousel is not a reel transcript cut into boxes: the reader sets the pace, goes back,
compares cards and can share one card without its neighbours. So the same five stages, the
same ten patterns (each with a carousel reading in the catalogue) and the same B1–B6 apply,
and what differs is what a plan has to prove.

The design says `"format": "carrousel"`. **A design without `format` is a reel**, so every
existing brief validates as it did; an unknown format fails, and a design and an edition that
disagree on the format fail (a choice made for a reel never approves a carousel).

| Reel | Carousel |
| ---- | -------- |
| `durationSeconds`, blocks with `seconds`, three-minute target | none; `seconds`, `durationSeconds` and `durationReason` are refused |
| `videoSequence` = outline blocks | `carouselSequence` = outline card ids; no video sequence required |
| arrangement = ordered moves | arrangement = a card preview, one step per card, `steps.length == cardCount` |
| scene profile untouched | `profile` (a reading profile) or the name-origin series' own template, with `cardCount` and `countReason` |
| outline `blocks` | outline `cards`, plus `countReason` and `unresolved` |

**Route, kept separate.** A carousel proposal declares `series`: `null` (a social-only edition,
stated as such) or `name-origin` (the historical name carousel: no reading profile, 8–14 cards
from its template, its attested myth as `myth.claimRef`, its closing and ledger). It can never
turn an existing series edition into a social-only one to pass a check: at handoff the edition's
series must equal the proposal's. `memoires-sonores` and `lectures-afrique` keep their contract
and are refused as plan targets. Family, pattern, series, profile, format and destination stay
six separate choices.

**Counts and compositions come from the renderer.** The validator reads
`social/harness/carousel-profiles/*.json` (`reading-story` 4–9, `reading-comparison` 4–7,
`reading-listening` 3–8, which also owes a music claim so the music review stays required).
It holds the first card to `cover`, the last to `credits`, every other card to the profile's
compositions, a `timeline` to 2–4 dated entries, a `comparison` to `relation: "comparaison"`
(never the derivation arrow) and a `map` to a place or route claim. The one copied range,
the name template's 8–14, is held to its source sentence by a test.

**A card carries its claim locally.** Each card owes a working heading and its `headingKind`
(`question`, `label`, `qualified-claim`, `claim`), a message, evidence with limits, a
`qualification` shown on the card, a short `sourceLine` (every card after the cover), a
composition and a visual intention (what must be recognised, not an image prompt), a
transition and the takeaways or criteria it serves. A `claim` heading over a qualified claim
fails, so a caveat cannot live only in the caption, and no workshop notation (`B3`, `claim ID`,
`livre C`, `k2`) may reach a heading, qualification or source line.

**What the code cannot check** (an editorial pass, as for reels): that a `qualified-claim`
heading is honest when the card is read alone, that a source line truly identifies the source,
that a card's message does not turn an attestation date into a creation date, and that
`qualification` says something a reader understands. It also says nothing about phone reading
comfort: the standard body is about 9.5 px equivalent at 320 px, a limit of the renderer that a
narrative plan neither fixes nor excuses. Type is never shrunk to make a card fit, and the
renderer's own fit, crop and subject checks stay the gate, viewed at 320, 390 and 430 px first.

**Reuse.** One brief can hold a shared subject and research; selection and outline belong to
one format. A reel's chosen pattern is not a carousel approval, and an explicit instruction to
adapt the angle is enough to authorise showing the carousel plan without asking again.

Demonstration: [`NARRATIVE-DESIGN-CAROUSEL-LINGALA-DEMO.md`](NARRATIVE-DESIGN-CAROUSEL-LINGALA-DEMO.md),
rendered from `lingala-carousel-demo.brief.json` (a test holds them equal), with the reel demo's
research copied verbatim (a test holds that too). Three proposals with three different
questions, learning goals and card sequences (C1 competing explanations, `reading-story`, 9
cards; C2 historical actor, `reading-story`, 6; C3 clarifying comparison, `reading-comparison`,
7) and a nine-card plan for C1. **The selection of C1 is synthetic**, the research is the
provisional Lingala synthesis, and nothing in it is an approved episode.
`single-origin-carousel.brief.json` is the synthetic full brief used to exercise a handoff.

## Older work

An approved package keeps its approvals, bound to its version; nothing here rewrites an approved
narration, moves an approval to a new script, or forces the five-stage intake on it. The
shared contract module is untouched, so `CONTRACT_VERSION` does not change: `narrativeDesign` is
an additive, optional brief section read only by the modules in `social/tools/narration/`.
