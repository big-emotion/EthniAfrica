# Research-led narrative design for reels

Status: implemented, first version (2026-09-30). Scope: reels. Carousels are unchanged.

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

## Older work

An approved package keeps its approvals, bound to its version; nothing here rewrites an approved
narration, moves an approval to a new script, or forces the five-stage intake on it. The
shared contract module is untouched, so `CONTRACT_VERSION` does not change: `narrativeDesign` is
an additive, optional brief section read only by the modules in `social/tools/narration/`.
