# The six narrative families — briefs and structures

A family says **how a story establishes and answers its question**. It is not a
visual profile (S4's `profile`), not a format (`carrousel | video | texte`) and not
a destination. Meanings: `docs/design/gabarits-social/EDITORIAL-CONTRACT.md`. The
machine form of a brief is checked by
`node social/tools/narration/check-family-brief.mjs <brief.json>`; six synthetic
examples, one per family, sit in `social/tools/narration/families/fixtures/`.

Everything below is a **scaffold with a purpose**, not a set of sentences to
reproduce. The one exception is a piece of `series: name-origin`, which keeps its
fixed title, its category template and its closing (`gabarit-reel-nom.md`,
`gabarit-carrousel-nom.md`); nothing in this file loosens that.

## What every brief carries

| Section          | Content                                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Question         | One bounded question the piece answers. It is the angle. Two questions are two angles, hence two editions.                                                                                                                                             |
| Claim map        | Each claim the piece will state, its `kind` (`name-origin`, `place`, `route`, `map`, `music`, `event`, `person`, `artifact`, `comparison`, `language`, `correction`), and at least one source with a tier. A claim with no source is not in the piece. |
| Beats            | The useful moves, each citing the claims it rests on. A beat exists to carry a claim or a limit, never to fill a slot.                                                                                                                                 |
| Uncertainties    | What the sources do not settle, in the sentence that would carry it. An empty list is a declaration; a missing list is an unanswered question.                                                                                                         |
| Carousel reading | The order a reader moves through the cards, at their own pace. Required when the edition is a carousel.                                                                                                                                                |
| Video sequence   | The directed order in time. Required when the edition is a video. Where a scene profile exists, its stages are the skeleton.                                                                                                                           |
| Strategy basis   | `dated-evidence` (a report of the last 30 days) or `exploratory` with the reason no comparator exists. Never neither.                                                                                                                                  |

Voice, for every family: peoples and places speak first, the source arrives on a
source card or a caption line, never as the subject of the sentence. Assertion
tracks certainty: agreed → flat; divergent or single-tier → « une lecture y voit… »;
unsettled → « n'est pas établi », each path attributed to **who holds it**, none
crowned.

Reviews follow the claims present. A portrait that says where a name comes from
owes the onomastic review; a comparison with a map owes the geography one; none of
this depends on the family. The five universal reviews (provenance, uncertainty,
attribution, intelligibility, non-essentialising) are owed by all six, always.

---

## 1. Name investigation — `name-investigation`

Scene profile `name-origin` (stages: question, usages, evidence, limits, answer,
closing). Requires at least one `name-origin` claim.

- **Question.** Where does a name come from, or which forms does an entry answer
  to and who gave each one? Only the `series: name-origin` productions are held to
  « D'où vient le nom {X} ? » verbatim.
- **Claim map.** `name-origin` claims first: form, language, giver, earliest
  attestation. `place` claims where the name is tied to a location.
- **Beats.** The form the reader arrives with → the form a people gives itself,
  listed first → the other forms, each with its giver and date → what changed the
  name or kept it → what stays open.
- **Uncertainties.** Competing origins, named by who holds them; an attestation
  that rests on one source; a qualifier that is shown, never derived.
- **Carousel reading.** searched name → self-name → other forms one card each →
  what stays open → invitation to correct.
- **Video sequence.** question → usages → evidence → limits → answer (the
  synthesis) → closing.
- **Reviews it usually triggers.** name, and myth when a held belief is really
  being corrected. A name investigation with no myth is valid.

## 2. Historical portrait — `historical-portrait`

Scene profile `history-geography`.

- **Question.** How did a documented person, group or moment come to matter, and
  to whom? Narrow enough to answer in one piece; a life is not one question.
- **Claim map.** `person` and `event` claims, dated. Social-only evidence is
  admissible at its own tier (`unverified`, `oral_tradition`) and is labelled, not
  hidden and not upgraded.
- **Beats.** Who, in one dated sentence → the situation they acted in → the act →
  the response, attributed to who held it → what the record leaves, and what it
  does not.
- **Uncertainties.** What the record does not document (reach, motive, private
  words). A quoted line is a claim: it needs its source or it is not quoted.
- **Carousel reading.** cover (figure + question) → context → the act → the
  response → what remains.
- **Video sequence.** question → context → evidence → evolution → limits → closing.
- **Reviews it usually triggers.** geography if places are located; name if the
  piece states a name origin; myth **only** if a held belief is truly corrected.
  Never invent a myth to have something to defeat.

## 3. Circulation and connections — `circulation-connections`

Scene profile `history-geography`.

- **Question.** What travelled between two places, who carried it, and how do the
  sources locate the route?
- **Claim map.** `route` and `map` claims, `artifact` or `language` claims for
  what travelled, `event` claims for stages. Each stage its own source.
- **Beats.** The thing, named by those who carried it → the route as far as it is
  attested → what changed in transit → what it became at the other end.
- **Uncertainties.** The unattested stretch is drawn and said as unattested; a
  route inferred from two points is a hypothesis.
- **Carousel reading.** cover (two places) → map → one card per documented stage →
  at arrival → what is not known.
- **Video sequence.** question → context → evidence → evolution → limits → closing.
- **Reviews it usually triggers.** geography (always, in practice).

## 4. Guided listening — `guided-listening`

Scene profile `free` (the piece sets its own beats). `free` is a rendering fact:
it waives no review. The approved **Mémoires sonores** presentation
(`MEMOIRES-SONORES.md`) is a series of this family with its own profile
`memoires-sonores` and its six-card layout — untouched, and its card count is not a
rule for the others.

- **Question.** What should the listener hear in this passage, and why does it
  matter?
- **Claim map.** `music` claims: recording, artist, year, rights holder — each
  sourced. What the passage "carries" is a claim attributed to who says so.
- **Beats.** Name the recording and the passage → one thing to hear at a stated
  timecode → what it carries → the credit.
- **Uncertainties.** Catalogues that disagree on a year; an interpretation held by
  one commentator.
- **Carousel reading.** cover → what to hear (one detail per card, timecoded) →
  what it carries → reference and credit. The native-platform music selection is
  not embedded in carousel images.
- **Video sequence.** before (one sentence) → listen (the excerpt, at its stated
  length) → after → credit.
- **Reviews it usually triggers.** music (the recorded audio review), attribution
  for the excerpt. No name inventory, no fixed closing, no myth is required.

## 5. Comparison — `comparison`

Scene profile `thematic-analysis` (stages: question, definitions, case, evidence,
limits, position, closing).

- **Question.** What do two or more documented cases share, and where do they
  differ? The comparison must be explanatory, not a ranking of peoples.
- **Claim map.** `comparison` claims — one per case per criterion — each sourced,
  plus the term used to compare, defined the way the sources use it.
- **Beats.** The shared term as each source uses it → case A and case B asked the
  same questions → the difference the sources support and no more.
- **Uncertainties.** A case documented by one source; a criterion that fits one
  case better than the other. Never a hierarchy between groups.
- **Carousel reading.** cover → shared term → side by side (one criterion per card,
  every case on it) → the difference → what is not compared.
- **Video sequence.** question → definitions → case → evidence → limits → position
  → closing.
- **Reviews it usually triggers.** non-essentialising carries the weight here. No
  fixed name-origin wording applies.

## 6. Material biography — `material-biography`

Scene profile `thematic-analysis`.

- **Question.** Where was an object, cloth, instrument or food made, who used it,
  and what became of it?
- **Claim map.** `artifact` claims (making, materials), `event` and `place` claims
  (uses, journey, holding institution), each sourced; an image's credit is its own
  provenance line.
- **Beats.** The object, named as its makers name it → how and by whom it was made
  → where it went and what for → where it is now.
- **Uncertainties.** A date that is a holding institution's estimate; a use known
  from one account.
- **Carousel reading.** cover (object, full frame) → making → use → journey → now
  and credit.
- **Video sequence.** question → definitions (what it is made of) → case (one use,
  shown) → evidence (the journey) → limits → position → closing.
- **Reviews it usually triggers.** geography for the journey, attribution for every
  image; name only if the object's name origin is itself a claim.

---

## Choosing, and changing your mind

Pick the family by the shape of the **question**, not by the subject's category. If
the question changes, the family may change, and the brief is rewritten, not
patched. An unknown family value fails the checker on purpose: there is no `free`
family, and a missing family is never guessed.

Adapting a published carousel to a video (or the reverse) on the **same angle** is a
legitimate edition (`adapts`); it does not need a new angle. A different question is
a new edition with its own angle. Republishing is an occurrence, not an edition.
