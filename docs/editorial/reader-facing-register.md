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

| Curator register                                                                                                                                                                    | Reader register                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Fiche générée depuis la file d'attente des candidats : le champ n'a pas été renseigné faute de recherche, et attend le protocole de recherche par fiche.                            | Nous ne documentons pas encore ce point pour ce nom : aucune source dédiée n'a été consultée à ce jour.                            |
| Le système « clan_name » ne détermine pas à lui seul le mode de transmission : …                                                                                                    | Le nom de clan ne détermine pas à lui seul le mode de transmission : nous ne le documentons pas encore pour ce nom.                |
| Corpus AFRIK — PPL_DIOULA, organisation clanique                                                                                                                                    | EthniAfrica — fiche du peuple Dioula, organisation clanique                                                                        |
| Passage source : dataset/…/PPL_DIOULA.json#content.organization.clanOrganization. Le tier hérité n'est pas résolu ; la revue claim-level reste requise.                             | Reprise du chapitre « Organisation clanique » de la fiche du peuple Dioula.                                                        |
| Aucun porteur décédé n'a été rattaché au jamu par les sources de cette passe.                                                                                                       | Nous ne présentons pas encore de porteur de ce jamu : les sources consultées n'en rattachent aucun que nous puissions nommer.      |
| Les recherches exactes n'ont pas fourni, dans cette passe, un porteur décédé rattaché au patronyme.                                                                                 | Nous ne présentons pas encore de porteur de ce patronyme : les recherches exactes n'en ont fourni aucun que nous puissions nommer. |
| Personne vivante, donc exclue par le protocole.                                                                                                                                     | Nous ne présentons pas encore de porteur de ce nom : les sources consultées n'en rattachent aucun que nous puissions nommer.       |
| Tier resolved from the domain ruling for jstor.org.                                                                                                                                 | _(no note — the tier badge says it)_                                                                                               |
| No URL and no recognisable citation shape; the tier awaits editorial review.                                                                                                        | _(no note — the Non vérifiée badge says it)_                                                                                       |
| Tier resolved from the domain ruling for unesco.org (sous-domaine ich.unesco.org). Fiche d'inscription sur la Liste représentative du patrimoine culturel immatériel de l'humanité. | Fiche d'inscription sur la Liste représentative du patrimoine culturel immatériel de l'humanité.                                   |

A note that only explained the tier is removed, not replaced: an empty or
absent `notes` renders nothing, which is the silence the reader is owed.
`scripts/afrik/stripTierProvenanceNotes.ts` removes the generated sentences and
keeps whatever a curator wrote around them.

That last row is its own lesson. DEC-040 lets a fiche name only public figures,
the deceased, or the self-identified, so a curator searching for eligible bearers
naturally wrote the silence in those terms — and a section that simply lists who
bears a name came out reading as a search through the dead. The eligibility rule
is real and stays; it is a curation constraint, not something the reader needs to
be told. The reader sentence keeps the scope that was actually searched — what we
can name here — and never says that no bearer exists: a search limited by who may
be named cannot support that broader claim.

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

Since the audit of 2026-09-30 (finding C23) the rule also reads the narrative
fields a fiche renders, not only those three. For a people, country, family,
language or surname fiche, a leaf is narrative when the translation-class table
(`src/lib/i18n/translationClasses.ts`) marks it `translatable` or
`review_required` — the table is the field list, so no second list can drift.
Names, labels and citation titles are not vetted for vocabulary, but a raw corpus
identifier **inside** one (« Yoruba (PPL_YORUBA) - Nigeria ») is refused; a value
that _is_ an identifier (`languageFamilyId`, `linguisticFamily`) is what its field
is for. A numbered wave followed by its own period (« Vague 1 (3000-2000 av.
J.-C.) ») is chronology, not a research batch. Leaks in these extended fields are
warnings held by `UNGUARDED_PROSE_CEILING` in `checkEditorialRules.ts`, a ratchet
that fails in both directions: each correction lowers it in the same change, and at
zero the findings become errors like the original three. Fiche classes without a
model in that table, and the English sidecars, still get only the three original
fields — a stated limit, not a claim of coverage.

`_`-prefixed files under the corpus — `_candidates-by-country.json`,
`_coverage-findings.json`, `_manifest.json` — are the curator's own worksheets.
Nothing loads them and no surface renders them, so the rule leaves them alone.

The banned vocabulary lives in two exported constants in
`src/lib/editorial/readerRegister.ts` — `INTERNAL_REGISTER_PATTERNS` (French)
and `INTERNAL_REGISTER_PATTERNS_EN` (English) — so this document and the gate
cannot drift apart.

## Working method

One sequence for every writing route — page, fiche, card, caption, narration,
translation, game reveal. It is a way of working, not a form to fill: the primary
reader need, the question answered and what stays uncertain go in the existing
working brief, and no new mandatory schema is added.

1. **Start from the reader's question**, in their words, and pick the primary need
   from the [personas](audience-personas.md). Every piece stays intelligible to a
   newcomer.
2. **Name who can speak to it**: which people, place, period and language the
   question really concerns. A usage documented in one place is not a usage of a
   whole people.
3. **Look for evidence that fits the question.** Oral, local, written, material and
   scholarly sources answer different questions; none is admitted or dismissed for
   its category alone. Scientific and linguistic tools stay useful to ask « is this
   attested, by whom, when » — they are not the only framework, and neither a single
   « African method » nor a single « European method » is assumed.
4. **Record how each account reached us**: heard directly or through a collector,
   by whom, where, when and in which language, and what permission covers it.
5. **Compare the accounts** before choosing words. A difference is content: say
   whether it concerns a pronunciation, a meaning, a chronology or an
   interpretation. Repeating one account is not corroborating it.
6. **Write the explanation** in ordinary words, the subject first.
7. **Attach the reference where a reader can use it**, beside or after the claim,
   mapped to the claim it supports.
8. **State what remains uncertain and invite a next step** — a source to check, a
   related account, a way to correct us.

The research behind steps 3–4 is in
[the dated research record](remediation-2026-09-30/research-african-methods.md).
It was desk research on a handful of mostly West African and general-purpose
sources; no community was consulted, and it is not a survey of African practice.
Adopt from it only what it supports, and read its open questions before treating
any rule below as settled for a specific community.

## Using sources

This section owns the rule; skills, the curator references and `CLAUDE.md` point
here instead of restating it (remediation ledger, C01/C02/C07).

- **Admission is traceability, not category.** A source the project consulted is
  cited for what it is, with a tier and enough to find it again. A weak source is
  labelled, never hidden, and a source is never described as more than it is.
  The one true gap is a citation that identifies nothing (« internet », « un
  site »): that is a missing source, and the reader is told the point is not yet
  documented.
- **Wikipedia and other tertiary encyclopedias** are read first, and what they
  cite is read next. When the article was consulted and supports the statement, it
  may be cited directly as what it is — a tertiary encyclopedia, at `unverified`,
  with its language, title and consultation date; the gate reports it and does not
  refuse it (DEC-055). Prefer the primary source it points to, cited at its own
  standing and address, with the language versions crossed noted in `notes`. Do
  not pretend a consulted source was not used, and do not present the article as
  the authority for a contested claim. This governs the site and the corpus, where
  a source list is labelled. **Social publications keep the operator's ruling of
  2026-09-21**: Wikipedia never appears on screen or in a caption as a source (no
  capture, credit or spoken « selon Wikipédia »), because showing it lends an
  authority the project does not give it. That is a rule about what is displayed,
  not a licence to hide what was consulted: the workshop record of the piece keeps
  the consultation, dated, for traceability.
- **`notes` says what the source is**, never why it received its tier. The tier
  rationale belongs in the internal ruling ledger; the badge already speaks.
- **A partial estimate is shown as partial.** Population shares that do not sum to
  100 % raise a warning, not an omission: keep the dated estimates and let the page
  say that the breakdown is incomplete. Never complete a figure to make it total.

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

What the research record supports adding (each traced there, none a claim about a
particular community):

- **Give the chain as the carrier gave it** — who taught whom, where, in which
  language — and never infer it. Name a carrier's role only when the source states
  it; do not assume a griot, or any famous elder, speaks for a whole people.
- **Keep a carrier's own additions or opinions labelled** as such when the carrier
  marks them, rather than merging them into the inherited account.
- **Attribute an oral account to its place, language and carrier**, never to « the
  African tradition » or « what Africans believe ».
- **« Not stated » is a valid value** for a carrier, a date, a language or a
  permission. Never guess one to complete a record, and never fill a gap left by a
  carrier's reserve from another source.
- **Record consent and its scope before publishing** — who gave it, for what use
  (quotation, online, teaching), and how it can be withdrawn. When an account was
  collected by someone else and no consent is recorded, use only what the carrier
  or community already made public, and say so. When a protocol is unknown, do not
  publish, and ask.
- **Credit the carrier and community in the source line**, and never publish a
  restricted item because a copy is technically available.
- **Keep competing accounts as separate records**, each with its own carrier.

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
