# Integration acceptance of the social workshop (S7)

Measured on `recette` at `fe9c33480`, 2026-09-29, the first revision holding S0 through S6 together (#1402, #1404, #1405, #1406, #1407, #1410, #1411). This is the acceptance of the **system**. It is not the approval of any episode, and nothing here was published, scheduled or merged.

Three states are kept apart on purpose, because the programme's failure mode was reading one as another:

| Question | Answered by | Status |
| --- | --- | --- |
| Does the workshop do what the contract says? | this document | **accepted, with the risks below** |
| Is an episode's text, voice and imagery approved? | the operator, per episode, at the exact approval points | none approved by this programme |
| Is anything distributed? | an occurrence with evidence (`EDITION-DELIVERY.md`) | none filed |

## What was checked, and how

| Requirement | Proof | Result |
| --- | --- | --- |
| Legacy name-origin flow unchanged | `legacy-name-origin` brief through `check-family-brief`: name, myth, geography and the fixed gabarit stay `required`; the series' tests untouched | pass |
| Six families routed | all six fixture briefs validated; each shows the same five universal reviews and only the conditional ones its claims trigger | pass |
| No compulsory date, myth or site fiche | non-name briefs carry none; myth and name report `not-applicable` with a reason; an `exploratory` strategy needs a reason, not a report | pass |
| Carousel and video are independent routes | one brief, two editions (`format`), separate packages; carousel needs no video artefact | pass |
| Per-destination delivery | a music review is bound to its network; content reviews are not (`family-delivery.acceptance.test.mjs`, new) | pass |
| Partial publication | packaged for one network, cold `status` names what remains; a fixture posting is not live and closes nothing (S6 end-to-end) | pass |
| Exact approval reuse | a crop change stales only the intelligibility review, in both networks; adding a missing review asks for nothing else (S6 end-to-end) | pass |
| Every family reaches "review complete" through delivery with exactly the reviews its plan lists | new acceptance test over the seven fixtures, both halves: nothing approved gives the full list, the listed approvals give `complete` | pass |
| Source fidelity | a claim with no source fails, also under scene profile `free`; an unknown family or claim kind fails and names the valid ones | pass |
| Readable mobile covers | S4's boards at 160/320/390/430/768, and real pilot copy on the same compositions at 320/390/430, viewed by eye and by `readability_problems` / `thumbnail_problems` | pass, two remarks below |
| Audible excerpts | engine suites for clips, audio timeline and release: 22 + 6 + 8 tests, plus pipeline 8 | pass. **Nobody listened**: see risks |

Suites run on this revision: social tools 240 (+1 new) pass; engine suites for scene clips, audio, release, pipeline, carousel layouts (41), profiles, Mémoires sonores layout, Lectures, word captions all pass; `lint:req` passes.

## Findings, each routed to its owner

1. **Research drafts do not pass the plain-language gate.** Two independent research drafts failed `check-narration` (2 and 11 findings) although both were written with the register in mind. The gate runs in `structure`, before a text is shown; it does not run on a research handoff. *Owner: research prompt template.* Pilot texts were rewritten for shape only, and one of the rewrites that changed a claim was caught and reverted.
2. **Fact review found errors a gate cannot.** A draft counted the words of an English catalogue phrase wrongly and said a group had « entered » a room where the source only says it was in it. *Owner: `ethniafrica-message`; a factual pass on numbers in a quoted phrase and on motion verbs.*
3. **Three private-corpus engine suites fail** (`test_corpus_compose`, `test_gabarit_video`, `test_video_corpus`, `KeyError 'image'`). The cause is workshop decks whose cards have no single `image` (some carry `images`, some none): seven of 59 decks, dated 16–27 September. S4 recorded the same failure on a pristine HEAD, and a copy taken before the programme fails these suites too. Not attributable to S0–S6, but it means **the engine's corpus regression is currently red for everyone**. *Owner: engine tests; skip or adapt for decks without a single image.*
4. **S4 layout.** A two-line title sits almost on the body line on `credits` and `comparison` cards; no overlap. The credit and footer lines are very small at native phone size; S4 already lists the body at 9.5 px at 320. *Owner: S4.*
5. **Spelling split.** `meta-combined` (contract, catalogue) and `combined_meta` (observations). The importer accepts both. *Owner: S0/S1, pick one.*
6. **Closing wording for a non-name family is undecided.** The release review reads `closing: not-applicable` meanwhile. A person must decide the wording per family or confirm none.
7. **Platform limits.** Only YouTube Shorts (180 s) is verified from an official page. Instagram, TikTok, Facebook, LinkedIn and X limits are listed as unverified in every package.

## Risks that remain

- No audio was listened to and no video exported in this session. Decoding and timing are tested; whether an excerpt is intelligible and correctly credited is a human judgement per episode.
- The three family briefs used for the pilots are declared by the person writing them: routing follows declared claim kinds. A missing `name-origin` declaration silently drops the name review, mitigated by refusing unknown kinds, not by detecting undeclared ones.
- Fixtures are synthetic. The pilots are the first real briefs; one is blocked (below).

## Operating the workshop

    node social/tools/narration/check-family-brief.mjs <brief.json>
    node social/tools/narration/check-narration.mjs <narration.fr.txt>
    node social/tools/production/edition-cli.mjs status <package dir> --edition edition.json --approvals approvals.json --inputs inputs.json --networks tiktok,instagram

Run them in that order before a text is shown to the operator. Approvals and posting evidence come from a person; no tool produces them.

## The pilots

Three pilots exercise a portrait, a comparison and a guided listening. Two have text and storyboard drafted and machine-checked; the real package for each waits on approvals only the operator can give, and on open source checks. The third is blocked on a single input, its source recording, which no research handoff has supplied. The system's acceptance does not depend on it. The pilot material is in the private workspace.
