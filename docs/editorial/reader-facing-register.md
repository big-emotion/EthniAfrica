# Reader-facing register

## Position and promise

Operator clarification, 2026-09-30.

EthniAfrica is a project of popular education. The operator uses research methods
and seeks sources, without claiming to be a scientist, linguist or historian.
Specialists may help the project. The writing makes knowledge accessible and
invites readers to investigate, compare and contribute.

Write first for the African diaspora, without assuming that a reader shares one
country, language, family history or wish to “return”. Readers living on the
continent also encounter this work. The [editorial personas](audience-personas.md)
describe needs rather than invented biographies.

A reader should understand the point before meeting the bibliography. Use familiar
words, concrete verbs and one idea at a time. Define necessary specialist terms
where they occur. Prefer “the name they use for themselves” to “autonym” unless
the term is itself useful. Simple language must not erase a disagreement, a place,
a date or a distinction necessary to understand the subject.

The research notes record how the project was made. Published prose explains the
subject, what supports it and what remains unsettled. Keep those registers apart.

## Plain language is the default for every surface

Operator decision, 2026-10-08. Use the DITP's plain-language methods as the main
reference. See [references and automated checks](plain-language-checks.md).
Selected FALC recommendations help with familiar words and readable presentation;
this project does not claim FALC certification or ISO conformity. FALC means
“facile à lire et à comprendre” and includes participation by its intended readers.
A checklist alone does not establish that a text is FALC.

This charter applies to site copy, public database fields, search answers, buttons,
errors, accessibility labels, game explanations, captions, cards, scripts and
subtitles. Its audience does not need scientific training. A specialist reader
is no reason to make a sentence harder.

- Explain one point at a time, using familiar words and concrete verbs. Prefer
  complete sentences connected naturally. Read paragraphs aloud before delivery.
- Avoid strings of noun fragments, artificial slogans and dramatic contrasts.
  “Un nom. Des peuples. Une histoire.” is not the default voice. Short labels,
  headings, proper names and source references need not become full sentences.
- Use “les sources”, “les fiches” or “les textes étudiés” according to what is
  actually meant, instead of the internal term “corpus”. Never replace words
  mechanically without checking their meaning.
- Explain a necessary term on first use: “le nom qu'ils se donnent” before
  “autonyme”, “un nom donné par leurs voisins” before “exonyme”. Keep African
  names, spelling, letters such as ɓ and ɗ, and distinctions between languages.
- State what each explanation proposes and who reports it. Use “viendrait de”,
  “selon l'explication rapportée par…” or “cet auteur propose…” for an origin
  hypothesis. Attribution can sit naturally at the end of the sentence.
- Name a real uncertainty: “Le document ne précise pas la date.” Avoid the
  repeated formulas “nous ne tranchons pas”, “fait non établi” and “nous n'en
  retenons aucune”. Do not invent agreement, disagreement or certainty to avoid
  those phrases. A documented usage and a proposed origin have different status.
- Keep actual quotations and bibliographic titles exact, clearly marked and
  attributed. Explain difficult source language in our own words beside it.
  Author-written source notes are public prose and follow this charter.
- Shorten a sentence when it mixes several ideas; length is a review cue, not
  a target score. Do not split a clear sentence into meaningless fragments to
  satisfy a number. No readability score proves that a reader understands.

### Three tones, one language standard

| Use                   | Tone                      | Pattern                                                                  |
| --------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Site and fiches       | Explanatory, calm         | Answer the question, then explain the useful detail and its source.      |
| Social discussion     | Conversational, welcoming | Give a sourced explanation and ask a concrete, optional question.        |
| Stories and narration | Narrative, concrete       | Connect steps in a story without inventing scenes, voices or chronology. |

The [Peul examples](examples/peul-tones.md) apply all three tones to the same
record. Tone changes neither the source nor the status of a hypothesis.

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
  workshop's reasoning, and the tier itself never reaches the reader: the
  reader sees the source's type — oral tradition, book, archive… — which says
  who speaks, not whether a claim is true (`doctrine.md` §1.1). A tiering codemod wrote one such sentence into more than 5 000
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
| Fiche générée depuis la file d'attente des candidats : le champ n'a pas été renseigné faute de recherche, et attend le protocole de recherche par fiche.                            | Nous n'avons pas encore étudié ce point pour ce nom.                                                                               |
| Le système « clan_name » ne détermine pas à lui seul le mode de transmission : …                                                                                                    | Le nom de clan ne détermine pas à lui seul le mode de transmission : nous ne savons pas encore comment il se transmet dans ce cas. |
| Corpus AFRIK — PPL_DIOULA, organisation clanique                                                                                                                                    | EthniAfrica — fiche du peuple Dioula, organisation clanique                                                                        |
| Passage source : dataset/…/PPL_DIOULA.json#content.organization.clanOrganization. Le tier hérité n'est pas résolu ; la revue claim-level reste requise.                             | Reprise du chapitre « Organisation clanique » de la fiche du peuple Dioula.                                                        |
| Aucun porteur décédé n'a été rattaché au jamu par les sources de cette passe.                                                                                                       | Nous n'avons pas encore d'exemple à présenter pour ce jamu.                                                                        |
| Les recherches exactes n'ont pas fourni, dans cette passe, un porteur décédé rattaché au patronyme.                                                                                 | Nous n'avons pas encore d'exemple à présenter pour ce nom.                                                                         |
| Personne vivante, donc exclue par le protocole.                                                                                                                                     | Nous n'avons pas encore d'exemple à présenter pour ce nom.                                                                         |
| Tier resolved from the domain ruling for jstor.org.                                                                                                                                 | _(no note — the source's type says it)_                                                                                            |
| No URL and no recognisable citation shape; the tier awaits editorial review.                                                                                                        | _(no note — the tier is internal; the source's type says what it is)_                                                              |
| Tier resolved from the domain ruling for unesco.org (sous-domaine ich.unesco.org). Fiche d'inscription sur la Liste représentative du patrimoine culturel immatériel de l'humanité. | Fiche d'inscription sur la Liste représentative du patrimoine culturel immatériel de l'humanité.                                   |

A note that only explained the tier is removed, not replaced: an empty or
absent `notes` renders nothing, which is the silence the reader is owed.
A one-off pass removed the generated sentences and kept whatever a curator
wrote around them.

That last row is its own lesson. DEC-040 lets a fiche name only public figures,
the deceased, or the self-identified, so a curator searching for eligible bearers
naturally wrote the silence in those terms — and a section that simply lists who
bears a name came out reading as a search through the dead. The eligibility rule
is real and stays; it is a curation constraint, not something the reader needs to
be told. The reader sentence keeps the scope that was actually searched — what we
can name here — and never says that no bearer exists: a search limited by who may
be named cannot support that broader claim.

## The gate

The former `checkEditorialRules.ts` gate was retired on 2026-10-08. The new
`npm run check:editorial` uses local Vale rules to check public prose across
fiches, interface code and publication records. It supplements the existing
internal-register checks in `scripts/validateAfrikData.ts`.

Run `npm run check:publication -- <final-text-files>` before delivering a new or
rewritten publication. It checks the actual final files without legacy allowances.
The [operating guide](plain-language-checks.md) lists coverage, exclusions and
remaining manual checks. A passing command is not approval of the meaning.

`_`-prefixed files and metadata remain internal research material. Do not move
public prose there merely to bypass a check.

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

The research behind steps 3–4 was a dated desk-research record (retired from the
repository on 2026-10-08). It was desk research on a handful of mostly West African and general-purpose
sources; no community was consulted, and it is not a survey of African practice.
Adopt from it only what it supports, and read its open questions before treating
any rule below as settled for a specific community.

## Using sources

This section owns the rule; skills and the curator references point
here instead of restating it (remediation ledger, C01/C02/C07).

- **Admission is traceability, not category.** A source the project consulted is
  cited for what it is, with its type, an internal tier and enough to find it
  again. The reader sees the type, never the tier (`doctrine.md` §1.1). A weak
  source is cited, never hidden, and a source is never described as more than it is.
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
  rationale belongs in the internal ruling ledger; the reader sees the source's
  type, never its tier.
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
those names to satisfy a mechanical rule: whether an author is the subject is an
editorial judgement, not a lexical pattern.

### Preserve what the evidence actually supports

- A documented usage is limited to the speakers, place and period documented.
- An interpretation remains an interpretation, even after moving its reference.
- A publication date identifies a document; it does not date the event described.
- An outside author's explanation is not automatically an oral tradition or the
  belief of the people described. Do not turn one speaker into an entire people.
- A quotation, a summary and the project's synthesis remain distinguishable.
- Never imply interviews, visits or collaboration that did not take place.

### Words of an outside gaze

A word the project reports as pejorative is not used in a fiche's own voice
to describe the people it names. The fiches record _Kirdi_ as a pejorative term
meaning « païen »; they do not call a people's religion pagan, nor its early
inhabitants « primitifs ». Where such a word is the subject, it stays, quoted
and attributed.

**« Fétiche » and « féticheur »** (operator ruling, 2026-10-03). Both come from
missionary and colonial usage. They stay in one case only: as the gloss of a
term of the people's own language that the same field names (« _Komian_
(féticheurs) », « _nkisi_ (objets-fétiches) », or the sense a dictionary gives a
word, as for _zumbi_). Where a fiche describes a people from outside and names
no local term, it says what the source describes: « objet rituel »,
« talisman », « officiant ».

| Instead of                                                   | Write                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Les Lobi convertis brûlent ou vendent leurs fétiches rituels | Les Lobi convertis brûlent ou vendent leurs objets rituels   |
| Les marabouts utilisent le Coran comme fétiches protecteurs  | Les marabouts utilisent le Coran comme talismans protecteurs |
| _Komian_ (féticheurs), spécialistes du savoir occulte        | unchanged: the local title comes first, the word glosses it  |

`scripts/__tests__/fetishVocabulary.test.ts` holds the list of fiches that keep
the word and the local term each must name. A new use elsewhere fails it, and the
choice is made then.

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
| A transmitted account                       | “This oral story has no scientific proof, so we cannot use it.”     | « Ce récit transmis à [lieu] relie le nom à [explication]. Le récit ne précise pas la date de cet épisode. »        | “This account transmitted in [place] links the name to [explanation]. We have not established when that episode happened.” | Carrier or agreed description, collection context and permission; specify indirect transmission when applicable |
| Two explanations                            | “The accepted origin is A.”                                         | « Deux explications sont proposées : [A], selon [source A], et [B], selon [source B]. »                             | “Two explanations are documented: [A] and [B]. The sources consulted do not settle the question.”                          | Separate references for A and B; do not invent equal support or consensus                                       |
| Invitation to research                      | “Research is needed.”                                               | « Quel récit avez-vous entendu autour de ce nom ? Vous pouvez nous en indiquer la provenance. »                     | “What account have you heard about this name? You can tell us where it comes from.”                                        | Link to the project's contribution route when available; no demand to disclose private family details           |

### Name-history timeline tiles

The timeline (REQ-198, DEC-073) tells one name's history in short tiles read from
today backwards. Everything above applies; these patterns cover what tiles add.
They follow [doctrine §1.1](doctrine.md) and the
[timeline decision](strategy/name-history-timeline-2026-10-08.md). As in the
table above, they are writing patterns with slots, not facts.

- **The sentence opens on the name**: « Le nom _[nom]_… », « _[nom]_
  désigne… ». Never a subjectless fragment.
- **Names cited in a tile are set in italics** (operator ruling, 2026-10-09):
  every name or written form a tile, a name line or the summary cites. The
  italics are the timeline's job, not the fiche's: the surfaces that show
  `nameHistory` text today print it as plain text and parse no markup, so the
  fiche keeps it plain. Never write `*…*`, `_…_` or `<em>` into the data. The
  requirement on the timeline UI is in the
  [timeline decision](strategy/name-history-timeline-2026-10-08.md).
- **One tile, one idea**, in one or two complete sentences.
- **The period is already printed at the top of the tile.** Do not repeat it as
  an opener (« À cette période… », « Vers [date]… »).
- **A hypothesis is conditional and attributed**, the attribution at the end:
  « … viendrait de [explication], selon [source] ». Competing hypotheses are
  separate tiles of one group; none is written as the answer.
- **The birth tile** ends with one plain sentence that tells the name apart from
  what it names, without drama.
- **A “before the name” tile** says what existed then; it does not repeat « le nom
  n'existe pas encore » on every tile.
- **“Meanwhile, elsewhere”** is two sentences: the first about the African name,
  the second, shorter, about the outside anchor with its date. No sentence opens
  with « Ailleurs, ». The anchor names its place first: France or Belgium, or
  another region of Africa than the subject's (« Au Maroc, », « En Éthiopie, »).

| Tile                     | Before                                                         | After — French                                                                                                     |
| ------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Today                    | « Langue véhiculaire de [villes]. »                            | « Le _[nom]_ est la langue que partagent [villes], dans [usages documentés]. »                                     |
| Birth                    | « [Date] : des missionnaires fixent le nom. »                  | « Le nom _[nom]_ apparaît par écrit dans [document], selon [source]. »                                             |
| Birth, closing sentence  | « Le nom naît ici. »                                           | « C'est la plus ancienne trace de ce nom que le projet connaît. [La langue / le peuple] existait déjà avant lui. » |
| Before the name          | « Le nom [nom] n'existe pas encore. On parle de [ancien]. »    | « On parle alors de _[ancien nom]_ pour désigner [ce qu'il désigne], selon [source]. »                             |
| Convergence              | « Ce sont des sources de ce qu'on appelle aujourd'hui [nom]. » | « Ces [parlers / groupes] donneront plus tard ce qu'on appelle _[nom]_, selon [source]. »                          |
| Competing hypothesis     | « Hypothèse 1 : prononciation de [forme]. »                    | « Le nom _[nom]_ viendrait de [forme], telle que la prononçaient [voisins], selon [source]. »                      |
| Oldest trace, uncertain  | « [Forme] est la plus ancienne mention. Est-ce le même nom ? » | « _[Forme]_ figure chez [auteur] au [siècle]. Les sources ne disent pas s'il s'agit du même [royaume / peuple]. »  |
| Meanwhile, elsewhere     | « À cette période, [nom] est en usage. Ailleurs, Rome tombe. » | « Le nom _[nom]_ est alors employé par [qui]. En France, [repère], en [date]. »                                    |
| Actor, never attribution | « [Personne] a nommé [lieu]. »                                 | « Le nom _[nom]_ apparaît dans [récit / archive] où figure [personne], selon [source]. »                           |

The summary under the searched name follows one shape: « Le nom _[nom]_ est
[ce qu'il désigne], qui se nomme lui-même _[autonyme]_. [D'autres noms existent :
…]. Les sources ne s'accordent pas toujours sur leur origine ; nous les présentons
plus bas. »

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
  officiels_ — in any language, accented or not: set `tier` (an internal field
  the reader never sees) and let the source's type speak; keep what the source is (publisher, edition, institution, what was read
  or cross-checked, the Wikipedia language chain);
- a ticket number (`ETNI-…`);
- `Corpus AFRIK — …` as a source title.

Write instead what the project knows or does not know, in French, addressed to a
reader who has never seen the repository:

- a gap: « Nous n'avons pas encore étudié ce point pour ce nom. »
- a source drawn from another fiche: title « EthniAfrica — fiche du peuple
  Dioula, organisation clanique », notes « Reprise du chapitre « Organisation
  clanique » de la fiche du peuple Dioula. »

Keep your working notes — they are valuable — in `_meta.directives` or in the
`_`-prefixed worksheets, which no surface renders.

Before finishing, review every public field against this charter and run the
plain-language checks. Keep original source titles exact. Use the existing BMAD
prose review with this file as `style_guide`, and structure review with
`reader_type=humans` when restructuring a longer piece.

---
