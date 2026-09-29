# Reader-facing register

## Position and promise

Operator clarification, 2026-09-30; governing rule in `CLAUDE.md`.

EthniAfrica is a project of popular education. The operator uses research methods
and seeks sources, without claiming to be a scientist, linguist or historian.
Specialists may help the project. The writing makes knowledge accessible and
invites readers to investigate, compare and contribute.

Write first for the African diaspora, without assuming that a reader shares one
country, language, family history or wish to “return”. Readers living on the
continent also encounter this work. The [editorial personas](audience-personas.md)
describe needs rather than invented biographies; the [audience report](../audience/audit-2026-09-30.md)
separates those intentions from observed behaviour.

A reader should understand the point before meeting the bibliography. Use familiar
words, concrete verbs and one idea at a time. Define necessary specialist terms
where they occur. Prefer “the name they use for themselves” to “autonym” unless
the term is itself useful. Simple language must not erase a disagreement, a place,
a date or a distinction necessary to understand the subject.

The research notes record how the project was made. Published prose explains the
subject, what supports it and what remains unsettled. Keep those registers apart.

## The three fields published verbatim

| Field             | Rendered by                                              |
| ----------------- | -------------------------------------------------------- |
| `gaps[].reason`   | `FieldProvenanceMarker` — the chapter's declared silence |
| `sources[].title` | the Sources chapter                                      |
| `sources[].notes` | the Sources chapter                                      |

Name fiches nest the last two one level deeper, under `names[].sources[]`.

Whatever the corpus holds in these three is what a visitor reads, word for word.
There is no sanitising layer, and adding one would be the wrong fix: the corpus
should hold prose fit to publish, not prose a renderer has to launder.

Authoring metadata such as `_meta.directives` stays internal. This list concerns
three provenance fields; it does not exempt other published fiche prose from the
reader-facing rules.

## What a published field may not contain

- **Repository paths.** `dataset/source/afrik/peuples/FLG_MANDE/PPL_DIOULA.json`,
  `docs/runbooks/…`, any `*.json` filename.
- **JSON field paths.** `#content.organization.clanOrganization`,
  `content.sources`, `verificationLead`, `targetPatronymeId`, `sourceRefs`,
  `fieldPath`.
- **Raw corpus identifiers.** `PPL_DIOULA`, `FLG_MANDE`, `PAT_KEITA`. Name the
  people, not the row.
- **Curation vocabulary.** _file d'attente_, _la passe_ / _cette passe_ / _lors
  de la passe_, _protocole de recherche_, _le protocole exclut_ / _interdit_ /
  _conformément au protocole_, _revue claim-level_, _tier hérité_, _hors
  corpus_, _plan de couverture_, _vague N_. This is the subtle one: it carries no path and no identifier, so it
  reads as ordinary French and survives review — while telling a visitor about a
  work queue and a research backlog that describe the workshop, not the subject.
- **Internal corpus labels.** `Corpus AFRIK — …` as a source title.
- **Tier provenance.** _Tier resolved from the domain ruling for…_, _Tier
  inferred from published-citation shape_, _the tier awaits editorial review_,
  _authorized source catalogue entry_, _resolved from the prior needs_review
  standing_, _tier resolved as…_; in French _tier inféré de la forme
  éditoriale_, _tier résolu depuis le catalogue_, _tier fondé sur la nature
  académique_, _non listée au catalogue de domaines officiels_, _doctrine des
  sources du corpus_ — accented or not. How a source's tier was decided is the
  workshop's reasoning; the tier badge already tells the reader how far to trust
  the source. A tiering codemod wrote one such sentence into more than 5 000
  notes, in English, into French fiches too, and the gate read neither
  `content.sources`, nor the sources a chapter keeps for itself
  (`content.historicalAffiliation.sources`), nor French fiches against the
  English list — so all of them reached the reader. What the source _is_ stays:
  _encyclopédie adossée à l'Institute for Southern Studies_, _vérifié au
  catalogue de la BnF_.
- **Ticket identifiers.** `ETNI-1388`. A ticket number tells the reader which
  work queue produced a sentence.
- **The project called "atlas".** « L'atlas ne documente pas encore… », « une
  source de l'atlas ». Since 2026-09-22 the project speaks in the first person:
  « nous », « notre projet », EthniAfrica. The titles of real works (UNESCO's
  _Atlas des langues africaines_, WorldAtlas) and the Atlas mountains are not a
  self-reference and stay.

The governing sentence: **the reader is owed the silence itself, never the reason
the workshop has not filled it yet.**

## How to say it instead

| Curator register                                                                                                                                                                    | Reader register                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Fiche générée depuis la file d'attente des candidats : le champ n'a pas été renseigné faute de recherche, et attend le protocole de recherche par fiche.                            | Nous ne documentons pas encore ce point pour ce nom : aucune source dédiée n'a été consultée à ce jour.             |
| Le système « clan_name » ne détermine pas à lui seul le mode de transmission : …                                                                                                    | Le nom de clan ne détermine pas à lui seul le mode de transmission : nous ne le documentons pas encore pour ce nom. |
| Corpus AFRIK — PPL_DIOULA, organisation clanique                                                                                                                                    | EthniAfrica — fiche du peuple Dioula, organisation clanique                                                         |
| Passage source : dataset/…/PPL_DIOULA.json#content.organization.clanOrganization. Le tier hérité n'est pas résolu ; la revue claim-level reste requise.                             | Reprise du chapitre « Organisation clanique » de la fiche du peuple Dioula.                                         |
| Aucun porteur décédé n'a été rattaché au jamu par les sources de cette passe.                                                                                                       | Aucun porteur n'a été rattaché au jamu par les sources consultées.                                                  |
| Les recherches exactes n'ont pas fourni, dans cette passe, un porteur décédé rattaché au patronyme.                                                                                 | Les recherches exactes n'ont pas fourni de porteur décédé rattaché au patronyme.                                    |
| Personne vivante, donc exclue par le protocole.                                                                                                                                     | Aucun porteur décédé n'est documenté dans les sources consultées.                                                   |
| Tier resolved from the domain ruling for jstor.org.                                                                                                                                 | _(no note — the tier badge says it)_                                                                                |
| No URL and no recognisable citation shape; the tier awaits editorial review.                                                                                                        | _(no note — the Non vérifiée badge says it)_                                                                        |
| Tier resolved from the domain ruling for unesco.org (sous-domaine ich.unesco.org). Fiche d'inscription sur la Liste représentative du patrimoine culturel immatériel de l'humanité. | Fiche d'inscription sur la Liste représentative du patrimoine culturel immatériel de l'humanité.                    |

A note that only explained the tier is removed, not replaced: an empty or
absent `notes` renders nothing, which is the silence the reader is owed.
`scripts/afrik/stripTierProvenanceNotes.ts` removes the generated sentences and
keeps whatever a curator wrote around them.

That last row is its own lesson. DEC-040 lets a fiche name only public figures,
the deceased, or the self-identified, so a curator searching for eligible bearers
naturally wrote the silence in those terms — and a section that simply lists who
bears a name came out reading as a search through the dead. The eligibility rule
is real and stays; it is a curation constraint, not something the reader needs in
order to understand that no bearer is documented.

## The gate

`checkEditorialRules.ts` enforces this as the `reader-facing-register` rule, at
`error` severity, on every fiche in `dataset/source/afrik/` and every English
sidecar in `dataset/translations/en/`. It walks the fiche and reads every
`sources[]` array wherever it sits — `sources[]`, `names[].sources[]`,
`content.sources[]`, `content.historicalAffiliation.sources[]` — rather than a
list of locations, which missed a new one each time a chapter gained sources.
`_`-prefixed keys are skipped. It reads a French fiche against the English list
as well, because a French fiche's source notes are often English. It runs in CI
through
`.github/workflows/editorial-rules.yml`:

```bash
npx tsx scripts/ci/checkEditorialRules.ts
```

`_`-prefixed files under the corpus — `_candidates-by-country.json`,
`_coverage-findings.json`, `_manifest.json` — are the curator's own worksheets.
Nothing loads them and no surface renders them, so the rule leaves them alone.

The banned vocabulary lives in two exported constants in
`src/lib/editorial/readerRegister.ts` — `INTERNAL_REGISTER_PATTERNS` (French)
and `INTERNAL_REGISTER_PATTERNS_EN` (English) — so this document and the gate
cannot drift apart.

## Narration, cards, captions and pages: the subject before the reference

Say what is being explained, then make its provenance accessible. Do not begin
with an author, institution or study as a substitute for explaining the subject.
This applies equally to local, African and external scholars: the issue is the
sentence's function, not the author's origin.

A book, historical actor or quoted speaker may be the actual subject. A reading
list must name authors; a direct quotation must identify its speaker. Do not erase
those names to satisfy a mechanical rule. The narration checker identifies lexical
patterns (`attribution-en-tete`); it cannot determine truth, community provenance
or whether an author is the subject. `ethniafrica-message` performs that review.

### Preserve what the evidence actually supports

- A documented usage is limited to the speakers, place and period documented.
- An interpretation remains an interpretation, even after moving its reference.
- A publication date identifies a document; it does not date the event described.
- An outside author's explanation is not automatically an oral tradition or the
  belief of the people described. Do not turn one speaker into an entire people.
- A quotation, a summary and the project's synthesis remain distinguishable.
- Never imply interviews, visits or collaboration that did not take place.

### Oral and written sources

An oral account can be the most relevant source for a practice, pronunciation or
transmitted memory. Lack of academic validation does not exclude it. It can
establish that this account is transmitted without independently proving every
historical event within it. A written or institutional source has limits too.

Record who carries the account (or an agreed public description), where and when
it was collected, its language, whether it was heard directly or through a
collector, and the permission to quote or share it. Unknown details stay unknown;
respect anonymity and reuse restrictions. Do not invent a griot, interview or
“local source” to make a reference list look balanced. Existing source tiers,
rights checks and `oral_tradition` provenance remain applicable; oral form alone
neither disqualifies nor proves an assertion.

Present different accounts side by side when available. Explain what differs:
a pronunciation, a meaning, a chronology or an interpretation. Several books
repeating the same account are not several independent confirmations. If only
external accounts were consulted, say that when it matters and invite local
contributions without presenting their absence as a defect in local knowledge.

### Where the references go

| Surface            | Explanation                                                                               | Traceable reference                                                                         | Invitation to investigate                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Site page or fiche | Answer in ordinary words; keep the necessary uncertainty nearby                           | Reference beside or after the claim, then a source section identifying each account         | Link to the relevant source, related account or contribution route             |
| Carousel           | One intelligible point per card; no provocative certainty corrected only on the last card | Short reference on the relevant card and readable source details on the source card/caption | A concrete question or source to explore                                       |
| Reel narration     | Explain the subject at listening pace; keep disputed claims qualified in the spoken text  | Corresponding source card and caption; identify any quoted voice                            | One relevant next step, when useful                                            |
| Social caption     | Explain or extend the piece; avoid an academic abstract                                   | A source line after the explanation, with distinct claims mapped to their references        | Ask about an actual usage, account or question rather than demanding agreement |

A source line is not a licence to hide uncertainty until the end. Internal claim
maps keep precise locators; public references remain identifiable and usable.

### Before / after examples

These are **writing patterns, not factual claims about named peoples**. Replace
placeholders only with information verified for the actual piece. References in
brackets are required slots, not invented citations. French reader examples carry
English counterparts; documentation itself remains in English.

| Situation                                   | Before                                                              | After — French                                                                                                      | After — English                                                                                                            | Provenance to attach                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| One disputed origin                         | “According to author X, this name comes from Y.”                    | « Une explication relie ce nom à [Y]. Son origine reste discutée. »                                                 | “One explanation links this name to [Y]. Its origin remains disputed.”                                                     | Author, work, date and locator; other documented explanations if available                                      |
| Malinké example: an external interpretation | « Selon le livre de Delafosse, les Malinkés sont… »                 | « Une explication du nom « Malinké » propose [interprétation vérifiée]. Elle ne suffit pas à établir son origine. » | “One explanation of the name ‘Malinké’ proposes [verified interpretation]. It does not settle its origin.”                 | The exact consulted passage; do not attribute the theory to a people without evidence                           |
| A book's year mistaken for an event date    | “A book from 1912 describes this usage, so people used it in 1912.” | « Cet usage est rapporté dans [lieu documenté]. Nous ne savons pas quand il a commencé. »                           | “This usage is reported in [documented place]. We do not know when it began.”                                              | Publication year stays in the reference; use only if the source supports that locality and report               |
| A transmitted account                       | “This oral story has no scientific proof, so we cannot use it.”     | « Ce récit transmis à [lieu] relie le nom à [explication]. Nous n'avons pas établi la date de cet épisode. »        | “This account transmitted in [place] links the name to [explanation]. We have not established when that episode happened.” | Carrier or agreed description, collection context and permission; specify indirect transmission when applicable |
| Two explanations                            | “The accepted origin is A.”                                         | « Deux explications sont documentées : [A] et [B]. Les sources consultées ne permettent pas de trancher. »          | “Two explanations are documented: [A] and [B]. The sources consulted do not settle the question.”                          | Separate references for A and B; do not invent equal support or consensus                                       |
| Invitation to research                      | “Research is needed.”                                               | « Quel récit avez-vous entendu autour de ce nom ? Vous pouvez nous en indiquer la provenance. »                     | “What account have you heard about this name? You can tell us where it comes from.”                                        | Link to the project's contribution route when available; no demand to disclose private family details           |

### Review before handing over copy

1. Can a first-time reader explain the main point in ordinary words?
2. Does each claim retain its status: documented usage, interpretation, account or unknown?
3. Can the reader find which source supports which explanation?
4. Have we invented any date, community consensus, fieldwork or qualification?
5. Are oral voices represented in their actual context, with permission?
6. Does the chosen next step help the reader explore or contribute?

These are semantic checks, not a requirement to print six statements in every
piece. Reach, saves and agreement in comments do not establish historical truth.

## Prompt block for curation sessions

Paste this into any agent session that writes or edits fiches.

---

**Register rule — mandatory.**

Three fields of an AFRIK fiche are published to the reader word for word:
`gaps[].reason`, `sources[].title`, `sources[].notes` — wherever a fiche nests a
`sources` array (`names[].sources[]`, `content.sources[]`,
`content.historicalAffiliation.sources[]`). There is no sanitising layer between
what you write in them and what a visitor reads on the site.

In those three fields you must never write:

- a repository path or a filename (`dataset/source/afrik/...`, `*.json`);
- a JSON field path (`#content.organization.clanOrganization`, `content.sources`,
  `verificationLead`, `targetPatronymeId`, `sourceRefs`, `fieldPath`);
- a raw corpus identifier (`PPL_*`, `FLG_*`, `PAT_*`) — name the people, the
  country or the name in words;
- the vocabulary of your own working process — _file d'attente_, _la passe_,
  _cette passe_, _protocole de recherche_, _revue claim-level_, _tier hérité_,
  _hors corpus_, _plan de couverture_, _vague N_, _Piste :_, _Recherche :_;
- how a source's tier was decided — _domain ruling_, _citation shape_,
  _authorized source catalogue_, _awaits editorial review_, _needs_review_,
  _tier inféré_, _tier résolu_, _tier fondé sur…_, _catalogue de domaines
  officiels_ — in any language, accented or not: set `tier`, and let the badge
  speak; keep what the source is (publisher, edition, institution, what was read
  or cross-checked, the Wikipedia language chain);
- a ticket number (`ETNI-…`);
- `Corpus AFRIK — …` as a source title.

Write instead what the project knows or does not know, in French, addressed to a
reader who has never seen the repository:

- a gap: « Nous ne documentons pas encore ce point pour ce nom : aucune source
  dédiée n'a été consultée à ce jour. »
- a source drawn from another fiche: title « EthniAfrica — fiche du peuple
  Dioula, organisation clanique », notes « Reprise du chapitre « Organisation
  clanique » de la fiche du peuple Dioula. »

Keep your working notes — they are valuable — in `_meta.directives` or in the
`_`-prefixed worksheets, which no surface renders.

Before you finish, run `npx tsx scripts/ci/checkEditorialRules.ts` and fix every
`reader-facing-register` finding. It is a blocking CI gate.

---
