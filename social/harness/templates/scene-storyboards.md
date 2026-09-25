# Three reusable production storyboards

Use with the [production workflow](../SCENE-PRODUCTION.md), [brief](scene-production-brief.md),
[feature catalogue](../SCENE-CATALOGUE.md) and [execution prompt](scene-execution-prompt.md).
These are complete preparation recipes, not pre-approved historical scripts. Bracketed content
must be researched and approved. Do not send a placeholder JSON starter to the execution model.

## Shared settings and decisions

Output: portrait 1080×1920, 25 fps, `progress: true`, existing brand tokens and safe areas.
Prefer current borders in quiet dashed lines, clear region fills, city points, and explicitly
schematic routes when exact paths are not established. Avoid halos by default. A visual change
should follow a change in the argument, not a four-second image timer.

Choose the desired length in the brief before writing. A short social excerpt may aim around
30–45 seconds as a planning preference, not a platform performance claim. Time the actual voice.
If a complete explanation needs longer, reduce scope or split the subject instead of speeding
up approved audio. Name-origin fixed copy may require a longer episode; its checker takes precedence.

Each recipe passes through the same stages:

1. **Idea:** audience, question, evidence available, one intended takeaway.
2. **Narrative:** complete speech and separately listed visible context; source each claim.
3. **Approval:** full text plus concise visual storyboard shown together; voice reviewed when available.
4. **Assets:** actual image identity/licence, map geometry/uncertainty, coordinates and credits.
5. **Timing:** map words in `aligned-words.json` to scene boundaries and local cue seconds.
6. **Assembly:** fill the JSON starter with the chosen scene types; validate and inspect cue previews.
7. **Handoff:** prepare a named lock; execute the render command; inspect/listen to the proof.

No recipe automatically sources a picture or reconstructs a historical border. Reuse the
composition, never a previous subject's geometry, dates or attribution merely because it looks good.

## A. Where does this name come from?

**Choose for:** an ethnonym, language name, country name, place name or patronymic question.
**JSON starter:** [name-origin.json](name-origin.json).
**Editorial authority:** [category narration template](../../../.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md).
Keep its prescribed wording/order and category checks. Visual cuts need not equal its paragraphs.

### Planning inputs

- Corpus identity, category, endonym and two to four relevant names/usages.
- Source for each proposed origin, attestation, language/gloss and contemporary use.
- A distinction between the first written trace found and the origin of the spoken name.
- Current locators and any historical/presence region whose period and uncertainty are supportable.
- One relevant document or photograph; do not substitute a decorative travel image for a naming source.

### Narrative-to-image plan

| Editorial step                        | Speech content from the prescribed template                | Suggested screen and cue                                                                                          | Assets/evidence                                   | Engine beat                           |
| ------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| Opening                               | Exact category opening about [name]                        | Wide map, then slow focus on the relevant area                                                                    | Basemap + verified locator                        | `question`                            |
| Inventory                             | Endonym first, then the attested other names               | `comparison` labels revealed when spoken; brief image/map if comparison is crowded                                | Names/glosses with independent sources            | `usages`                              |
| Optional variants and each name block | Who used [form], where, when, what its proposed meaning is | Relevant archive as `document`, or sustained map with dated points; chronological sequence only when dates matter | Actual title page/portrait identity; attestations | `evidence` (may repeat across scenes) |
| Classification and uncertainty        | Who named whom; what the sources cannot establish          | Map of usage/presence or concise comparison; no invented ethnic border                                            | Period/status for every claim                     | `limits`                              |
| Synthesis                             | Operator-selected approved synthesis answering the opening | 2–3-item focus timeline or a wider map; no new spoken fact                                                        | Reuse only established events                     | `answer`                              |
| Closing                               | Existing unique closing, verbatim                          | Quiet closing text/image scene; avoid additional optional context                                                 | Editorial evidence, existing approved copy        | `closing`                             |

**Timing:** keep the introductory zoom within the opening voice. Reveal each name at its aligned
word. Hold the document long enough to see what it is; a rapid montage of unrelated images is not
an explanation. The synthesis may become the chronology before closing if the subject has dates.
Do not force a timeline into a purely linguistic comparison.

**Transitions:** cuts between factual blocks, a short dissolve when moving from map to document,
and a continuous camera across contiguous map scenes with matching boundary frames.

**Ready for execution when:** the category narration checker passes, the full script is approved,
voice/alignment are complete, all asset identities/licences are recorded, and the plan includes
all required beats. Unsupported name-origin cases return to planning instead of fabricating a category.

## B. History, journeys and changing geography

**Choose for:** Mandén chronology, an individual's journey, an empire's changing extent or a
source-supported population/language movement.
**JSON starter:** [history-geography.json](history-geography.json).

### Planning inputs

- One question, two or three pivotal dates and a bounded geographic scope.
- For each period: sources, political/population/linguistic meaning, known uncertainty.
- For each path: endpoints, whether intervening stops are attested, journey vs migration distinction.
- Separate features for separate historical states; no automatic territory morph.
- Optional regional and world context chosen for the intended audience, not compulsory filler.

### Narrative-to-image plan

| Editorial step       | Spoken purpose                                              | Suggested screen and cue                                                        | Assets/evidence                                                  | Engine beat                                       |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| Question             | State what changed in [place/people/period]                 | Africa or relevant wide region; progress starts                                 | Basemap, current borders                                         | `question`                                        |
| Orientation          | Locate [region] without equating it with a modern nation    | Smooth zoom; regional fill appears, then city points                            | Reviewed area and locators                                       | `context`                                         |
| Dated turning point  | Explain [event/date] and what is actually known             | Kirina-style point or one dated political snapshot                              | Event + coordinates separately sourced                           | `evidence`                                        |
| Movement             | Describe [individual journey / sourced collective movement] | Route draws while words name the movement; flags only as dated orientation aids | Authored path and explicit schematic note where needed           | `evolution`                                       |
| Limits and synthesis | Explain what changed and what the map cannot establish      | Focused timeline with corner note and map layers, then overview before closing  | Reuse previous dated facts; independent dates for silent context | `limits`; add another `evolution` scene if useful |
| Closing              | Approved project closing                                    | Calm final shot, no new historical claim                                        | Approved wording                                                 | `closing`                                         |

**Reusable Mandén arrangement:** early region + Kirina point → Mansa Musa route with Cairo and
Mecca → later dated visit with a regional locator rather than a falsely exact capital → timeline
recap. This describes the established demonstration, not an instruction to reuse its facts for
another people. The first full geographic shot can precede the timeline so the latter serves as summary.

**Timing:** start the route on the movement phrase; reach a named city near its spoken cue.
Use explicit `at`, `until`, `draw_seconds` and camera keyframes. A wider-context shot may continue
briefly after speech, but do not pad a short test into a long empty sequence. Context notes are silent.

**Transitions:** preserve map continuity with matching outgoing/incoming camera bounds and a cut.
Use `overview_at` for the recap, not a hard replacement of all dates. Nearby territories stay behind
the subject and retain their own periods. Current borders remain distinguishable from historical outlines.

**Ready for execution when:** every geometry has provenance/status, the direction of travel is
supported, the exact-vs-schematic distinction is visible, the chosen dates fit the narration,
and city/route labels stay readable at the checked camera states.

## C. A thematic question, dossier or argued position

**Choose for:** names and mutual aid, cooperation across groups, shared communication, national
belonging, or the meaning and use of “ethnie”. A myth is not required.
**JSON starter:** [thematic-analysis.json](thematic-analysis.json).

### Planning inputs

- One precise question, intended audience and a claim that can be examined.
- Defined terms; the scale of the available evidence (one town, one study, several countries).
- At least one situated case and a relevant source, document or photograph for it.
- A competing explanation/limit and a clearly identified editorial position if one is taken.
- A distinction between group labels, language, citizenship, affiliation and institutions.

### Narrative-to-image plan

| Editorial step         | Spoken purpose                                                              | Suggested screen and cue                                                                | Assets/evidence                           | Engine beat   |
| ---------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- | ------------- |
| Question               | Ask [bounded question] without assigning a trait to a whole people          | Relevant image with gentle motion or a located map                                      | Actual case, not a generic symbolic crowd | `question`    |
| Definitions            | Explain two terms in ordinary language                                      | `comparison`, one term at a time                                                        | Terminological sources                    | `definitions` |
| Situated case          | Describe what happened in [place/context]                                   | Map point/region, then a relevant photograph                                            | Place + event + image licence             | `case`        |
| Evidence               | Say what [source/study/document] observes                                   | `document` or image with concise explanatory copy                                       | Actual document and limited claim         | `evidence`    |
| Limits                 | State what the evidence does not prove; acknowledge alternative explanation | Comparison or wider contextual map; no visual causal arrow unless justified             | Scope and competing account               | `limits`      |
| Position and synthesis | Express the approved argument, distinguishing it from measurement           | Calm image or concise spoken synthesis; timeline only for a genuinely temporal argument | `editorial` status for the position       | `position`    |
| Closing                | Existing approved project closing                                           | Stable final scene                                                                      | Approved wording                          | `closing`     |

**Image selection:** prefer an image that shows the institution, activity, document or specific
case being discussed. An image of people is not evidence of their psychology. A country outline
is not evidence of one homogeneous identity. Archive portraits illustrate a person, not an unseen event.

**Timing:** avoid cutting away before the audience identifies the image. Let a single useful
image or map carry several sentences. Silent comparisons should not compete with a dense spoken
explanation. A local example and a wider-context image may be two views of one argument, not two subjects.

**Ready for execution when:** the case is located, the evidence scale is explicit, the image fits
the spoken claim, the opinion is labelled, and no invented myth/corpus entry/ledger category is needed.
Keep an unregistered thematic proof in the workshop until its publication classification is resolved.

## Applying these recipes to the existing idea queue

| Existing idea                           | Recipe                                  | Decisions still required before writing/rendering                                              |
| --------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Names, belonging and mutual aid         | C                                       | Which naming practice and association, which source, what causal claim is actually supportable |
| Different peoples and cooperation       | C                                       | A situated comparison; do not infer collective psychology from names                           |
| Different languages and shared speech   | C, with B for sourced dated diffusion   | First language vs lingua franca vs official status; verified case and geography                |
| Inherited states and national belonging | C, with B for dated territorial context | Which institutions/territories/periods and what is an explicit political position              |
| Origin of a particular name             | A                                       | Category, endonym/usages, documented interpretations and source image                          |

These mappings neither approve a script nor add calendar entries. Read the existing source reports
and audience work before filling a brief. For material that does not fit a recipe, use the
[free starter](free.json) with a complete authored argument; all evidence and validation rules remain.
