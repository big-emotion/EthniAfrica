# Audit — where the publication rules live

Run on 2026-09-17, read-only, on the integration branch. This audit deleted and
modified nothing.

**The question.** Where in the project is a rule defined — functional,
documentary or technical — that governs **how information is published**, on the
site and on social networks: caution in wording, the obligation to source, and
the refusal to settle an appellation that is not unanimous.

**What it covers.** Four surfaces, one section each: the written doctrine (§2),
reader-facing display on the site (§3), word choice for social publications
(§4), and the technical gates that fail a rule automatically (§5). The gaps are
§6.

---

## 1. Six findings

**1. The autonym is required; competing appellations are required nowhere.**
`scripts/ci/checkEditorialRules.ts` carries exactly six rules —
`autonym-required`, `sources-count`, `doctrine-link-card-snapshot`,
`source-ref-resolves`, `reader-facing-register`, `chronology-symmetry`. The word
`exonyms` appears in **no gate anywhere in the repository**. The field does
exist (`public/modele-peuple.json` → `appellations.exonyms[]`, and
`public/modele-langue.json` → `alternateNames[]`), the display component exists
(`AutonymExonymHeading`), but nothing obliges a fiche to surface the competing
names the corpus already holds. This is exactly the Mandé / Mandingue / Malinké
/ Bambara / Dioula gap.

**2. The closest rule is new and only covers prose.** "Assertion tracks
certainty" (CLAUDE.md, 2026-09-16) says how to **write a sentence** about a
contested fact — three registers according to what the sources do. It does not
say that an entity must **surface its appellations** on first mention. It is a
rule of style, not a rule of structure.

**3. None of these rules reaches social copy.** The six editorial rules run over
the corpus JSON fiches. Cards (`cards.json`), narration, titles and captions
pass through **none** of them. The only gate on that path is
`ethniafrica-message` — an agent scoring a production, not a deterministic gate.

**4. The three canonical production prompts cannot be found from this
repository.** `social/tools/prompt-builder/build-prompts.mjs` contains no prompt
text by design: it reads `Guides/prompts-production-2026-09-09.md` and
specialises it. That path resolves to `social/Guides/`, **which does not
exist**, and `Guides/` is tracked by no commit. The doctrine governing the
production agent's word choices therefore lives in the private library, outside
review and outside history. Sections 15 and 16 of that file are cited in the
builder as "carrying the doctrine". Same for `narrations-six-2026-09-10.md`,
`direction-image-six-2026-09-10.md`, `legendes-six-2026-09-10.md`,
`bantou-2026-09-09.md`, `description-template-2026-09-09.md`.

**5. An interrogative title is treated as a hook, never as a risk.**
`GABARITS-SOCIAL.md` §1 ter fixes the cover title (eight words, the punch on the
last) and `attention-architect` encourages the open loop. Nothing anywhere says
that a question in a title will be read as an assertion. The Lingala post is the
measured demonstration.

**6. The doctrine is written in six places that do not all cite each other.**
The central thesis (`purpose-doctrine.md`), the essays (`essais/`), the reader
register (`reader-facing-register.md`), the source policy (CLAUDE.md), the
closing doctrine (`GABARITS-SOCIAL.md` §7 ter) and the "Notre propos" page
(`src/lib/i18n/copy/homePurpose.ts`, `about.ts`). No file indexes them.

---

## 2. The written doctrine — the "why"

| File                                                                   | What it defines                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `docs/editorial/purpose-doctrine.md`                                   | The central thesis, verbatim: nations are the recent layer, peoples the continuous one.              |
| `docs/editorial/essais/README.md`                                      | What an essay is and is not; the index of essays.                                                    |
| `docs/editorial/essais/pouvoir-de-nommer-2026-09-14.md`                | Why the "Qui a nommé ce pays ?" series exists — a diagnosis, never an accusation.                    |
| `docs/editorial/essais/peuples-carrefours-2026-09-16.md`               | Peoples before the line; unity predates the border.                                                  |
| `docs/editorial/essais/saluer-l-autre-comme-il-se-nomme-2026-09-17.md` | Onomastics is the method, not the subject; a volatile name means a volatile border.                  |
| `docs/editorial/reader-facing-register.md`                             | The three fields published word for word, and the workshop vocabulary banned from them.              |
| `docs/editorial/glossary.md`                                           | `peuple` → _people_, never _tribe_ nor _ethnic group_.                                               |
| `docs/editorial/classification-status.md` + `-ledger.json`             | The epistemic standing of a classification and its register.                                         |
| `docs/editorial/translation-classes.md`                                | Which fields may be translated, which stay verbatim.                                                 |
| `docs/editorial/ui-copy.md`                                            | Where reader-facing copy lives and which gate holds it.                                              |
| `docs/editorial/locale-indexing.md`                                    | How locales are indexed.                                                                             |
| `docs/editorial/source-review/README.md`                               | Why the tier ledger lives in git, one citation at a time.                                            |
| `docs/editorial/source-review/source-tier-rulings.json`                | The ledger itself: rulings on citations still marked `needs_review`.                                 |
| `docs/editorial/congo-dossier-publication-notes.md`                    | A worked example of publication wording decisions.                                                   |
| `docs/editorial/congo-dossier-translation-classification.md`           | Translation classification for the same dossier.                                                     |
| `docs/editorial/dossiers-realites/README.md`                           | Dossier doctrine.                                                                                    |
| `docs/editorial/family-restoration/README.md`                          | A restored theory comes back with its divergence points.                                             |
| `docs/editorial/demography-cleanup/README.md`                          | Demographic cleanup doctrine.                                                                        |
| `docs/editorial/country-enrichment/README.md`                          | The country-by-country pass and its source ledger.                                                   |
| `docs/audience/message/message-audit-2026-09-13.md`                    | Measured: the doctrine reached 2 productions out of 27.                                              |
| `CLAUDE.md` (root)                                                     | Source Tier Policy, assertion/certainty, reader register, the lopsided corpus, colonial terminology. |

**Reader-facing copy that publishes the doctrine:**
`src/lib/i18n/copy/homePurpose.ts` ("Notre propos", and the cut unity claim),
`src/lib/i18n/copy/about.ts` + `src/components/pages/AboutPageContent.tsx`
(`purposeChapter`, `unityClaim` — inline, grandfathered from the copy-literals
gate), `src/lib/dossiers/nommer/chapters/*.ts` (the "Nommer" dossier, chapter by
chapter), `src/lib/doctrine/doctrineContent.en.ts` and
`src/components/pages/DoctrinePageContent.tsx` (the page defining each status).

---

## 3. Site surface — reader-facing display

### 3.1 Vocabulary and policy (non-components)

| File                                                                             | What it defines                                                                    |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/types/sources.ts`                                                           | `SOURCE_TIERS` — the one tier vocabulary; tier and `source_kind` kept separate.    |
| `src/lib/glossaire/vocabularies.ts`                                              | The only place tier and classification labels are spelled.                         |
| `src/lib/glossaire/terms.ts` / `entries*.ts`                                     | The bilingual glossary: endonym, exonym and friends.                               |
| `src/lib/afrik/ficheSourceLabel.ts`                                              | The display text of a fiche source and its `readerFacingNote`.                     |
| `src/lib/fiche/ficheSourceRegister.ts`                                           | Numbers a fiche's bibliography.                                                    |
| `src/lib/afrik/parsers/ficheSourceTier.ts`                                       | Normalises legacy numeric tiers at parse time.                                     |
| `src/lib/sources/authorized-source-catalog.ts`                                   | The authorised-domain catalogue backing tier attribution.                          |
| `src/lib/fiche/provenanceCensus.ts`                                              | The provenance census; a failure renders nothing, never an error.                  |
| `src/lib/fieldProvenance.ts`                                                     | The declared / derived / missing model.                                            |
| `src/lib/editorial/readerRegister.ts`                                            | `INTERNAL_REGISTER_PATTERNS` — workshop vocabulary banned from reader text.        |
| `src/lib/afrik/parsers/appellationGrammar.ts`                                    | The grammar deciding what counts as a name; keeps unread segments verbatim.        |
| `src/lib/languageTag.ts`                                                         | `bcp47LanguageTag` — the only source of the `lang` attribute.                      |
| `src/lib/i18n/translationClasses.ts`                                             | Autonyms and citations are `invariant`; claims about a word are `review_required`. |
| `src/api/v2/services/confidence.ts`                                              | Confidence records feeding chips and the banner.                                   |
| `src/api/v2/services/sourceMapper.ts` · `sourcesFacet.ts` · `sourceCitations.ts` | Shape sources for reader surfaces.                                                 |
| `src/api/v2/schemas/sources.ts`                                                  | The public source envelope, with `locator`, author, year.                          |

### 3.2 Source and confidence display

`src/components/source-transparency/ConfidenceChip.tsx` (the `X % · N sources · vérifié date` pill) ·
`ProvenanceBanner.tsx` (a census, deliberately never a score) ·
`SourceChainSheet.tsx` + `.lazy.tsx` · `SourceNoteCall.tsx` (the numbered note call, with a contested variant) ·
`UnauditedDisclaimer.tsx` (no human audit in 18 months) · `PinnedVersionBanner.tsx` ·
`DoctrineLinkCard.tsx` (links a contested badge to its doctrine) ·
`src/components/sources/SourceStandingBadge.tsx` (the tier badge) · `SourceCitation.tsx` · `SourceRow.tsx` ·
`src/components/ui/source-verify-badge.tsx` · `src/components/fiche/FicheSources.tsx` ·
`src/components/patronymes/PatronymeSourcesSection.tsx` · `PatronymeSourceCitation.tsx` ·
`PatronymeFicheTitle.tsx` ("N sources, dont N écrites par une machine") ·
`src/components/dossiers/DossierCitations.tsx` · `DossierReadings.tsx` ("La lecture officielle" vs "La contre-lecture") ·
`src/components/people/ProseWithChip.tsx` · `peopleFicheNotes.ts` ·
`src/components/relations/RelationsListWithSourceSheet.tsx` · `RelationsList.tsx` ·
`src/components/fiche/FicheSnapshotView.tsx` · `src/components/ReferenceLibraryFlow.tsx` ·
`src/components/compare/CompareEntityHeader.tsx` · `ComparisonView.tsx` ·
`src/components/colonization/FragmentationView.tsx` ·
`src/components/migrations/MigrationEventCard.tsx` · `MigrationDetailSheet.tsx` · `MigrationNarrative.tsx` ·
`src/components/play/GameAnswerReveal.tsx` · `src/components/quiz/QuizAnswerReveal.tsx` ·
`src/components/system/DidYouKnowLoader.tsx` ·
`src/app/[lang]/sources/page.tsx` · `[id]/page.tsx` · `src/components/pages/SourcesPageContent.tsx` ·
`src/components/admin/SourceReviewQueue.tsx` (curator side).

### 3.3 Name display — the heart of the subject

| File                                                                    | What it defines                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/components/ui/AutonymExonymHeading.tsx`                            | **The canonical autonym-first heading**, eight variants, `lang` from ISO 639-3. |
| `src/components/country/AutonymExonymHeading.tsx`                       | The country-surface endonym/exonym pair, endonym primacy (UX-DR49 rule 1).      |
| `src/components/people/PeopleNamingTiles.tsx`                           | The naming chapter: self-appellation, exonyms, origin, why problematic.         |
| `src/components/people/PeopleFicheHead.tsx`                             | The people fiche head: autonym, exonyms, ISO tag, chips.                        |
| `src/components/people/PeopleFieldExplainer.tsx`                        | Explains the naming grammar in the reader's terms.                              |
| `src/components/fiche/FicheNamesChapter.tsx` + `src/lib/fiche/names.ts` | The names chapter and its alphabet-index threshold.                             |
| `src/components/names/NameNomenclature.tsx`                             | The appellations nomenclature: one entry per name.                              |
| `src/components/names/NameTypeBadge.tsx`                                | "nom imposé" in colonial tokens, never error red.                               |
| `src/components/names/NameOriginCard.tsx`                               | One name record, `lang` from `languageOfOrigin`, imposition context.            |
| `src/components/names/NameSpellingHistory.tsx`                          | The ordered list of historical spellings.                                       |
| `src/components/patronymes/*`                                           | The name fiche chapters: system, origin, homonyms, bearers.                     |
| `src/components/family/FamilyDecolonialHeader.tsx`                      | A family's colonial-naming header.                                              |
| `src/components/dossiers/nommer/NamePairGrid.tsx`                       | The "Nommer" dossier's name pairs.                                              |
| `src/lib/afrik/parsers/nameRecordParser.ts`                             | Parses ethnonym records.                                                        |
| `src/lib/afrik/loaders/peopleAppellationLoader.ts`                      | Loads a people's appellations; writes `needs_review` as `NULL`.                 |
| `eslint/rules/no-bare-people-name.js`                                   | **Gate**: a people's name reaches the page through the heading, or not at all.  |

Also: `LanguageFicheTitle.tsx`, `CountryFicheTitle.tsx`, `FamilyFicheTitle.tsx`,
`SearchPivotCard.tsx`, `SearchResultCard.tsx`, `EgoNetworkGraph.tsx`,
`ProverbCard.tsx`, and the `atlas/appellations`, `atlas/noms`, `atlas/peuples` routes.

### 3.4 Uncertainty and declared silence

`src/components/fiche/FieldProvenanceMarker.tsx` (publishes `gaps[].reason` verbatim) ·
`TranslationProvenanceMarker.tsx` · `FicheTileChapter.tsx` · `FicheStatCard.tsx` ·
`src/components/country/PeoplesSection.tsx` ("Répartition estimée ou incomplète") ·
`src/lib/i18n/copy/country.ts` (which holds that wording) ·
`src/components/ui/classification-badge.tsx` (no red; `consensual` renders nothing) ·
`src/components/migrations/MigrationNarrative.tsx` (`datingNote`, debate text) ·
`src/lib/afrik/parsers/migrationParser.ts` · `src/components/compare/CompareValueCell.tsx` ·
`src/components/atlas/AtlasGlobe.tsx` + `src/lib/atlas/overlays.ts` (disputed territories) ·
`src/components/flags/*` (public reports and their remediation) ·
`src/lib/familyFootprintSource.ts` · `src/lib/i18n/copy/fieldProvenance.ts`
("Donnée manquante" / "L'atlas ne renseigne pas ce champ" / "Valeur dérivée de…").

### 3.5 The copy dictionaries

`src/lib/translations.ts` (the assembly) and `src/lib/i18n/copy/`: `provenance.ts`,
`sourceTransparency.ts`, `fieldProvenance.ts`, `sourcesBibliography.ts`
("Wikipédia n'est pas une source…"), `sourcesDirectory.ts`, `fiche.ts`,
`classification.ts`, `doctrine.ts`, `names.ts`, `patronymes.ts`, `people.ts`,
`country.ts`, `about.ts`, `homePurpose.ts`, `nommer.ts`, `glossaryPage.ts`,
plus the ~30 remaining surface dictionaries (`compare`, `relations`,
`migrations`, `colonization`, `family`, `languages`, `atlas`, `facets`,
`discoveries`, `anecdotes`, `proverbs`, `games`, `quiz`, `hubs`, `chrome`,
`footer`, `contribute`, `reports`, `publicFlags`, `moderationConsole`, `admin`,
`ficheMetadata`…).

---

## 4. Social surface — how words are chosen

### 4.1 The prompts — where the agent chooses words

| File                                                                                                                                       | The word choice it governs                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `.claude/skills/ethniafrica-idee/SKILL.md`                                                                                                 | The angle, the one-sentence promise, the myth, what the subject will not say.        |
| `.claude/skills/ethniafrica-structure/SKILL.md`                                                                                            | **Writes every word**: §10 cards, narration, titles, per-network captions, closing.  |
| `.claude/skills/ethniafrica-produire/SKILL.md`                                                                                             | Renders only; five gates (licence, credit, internal notes, enlargement, message).    |
| `.claude/skills/ethniafrica-message/SKILL.md`                                                                                              | Scores a production on a 9-criterion grid, including flat claims on contested names. |
| `.claude/skills/ethniafrica-mythe/SKILL.md`                                                                                                | The myth, the correction, the proof; forbids swapping one myth for another.          |
| `.claude/skills/ethniafrica-onomastique/SKILL.md`                                                                                          | The four naming questions + closing tone (love and unity, not reversal alone).       |
| `.claude/skills/ethniafrica-essai/SKILL.md`                                                                                                | Captures the ideological basis feeding later word choices.                           |
| `.claude/skills/ethniafrica-reseaux-help/SKILL.md`                                                                                         | Chooses no words; bars duplicates per format.                                        |
| `.claude/skills/ethniafrica-content-strategist/SKILL.md`                                                                                   | What to publish, where, how often.                                                   |
| └ `reference/launch-plan.md` · `reference/platforms.md` · `reference/published-state.md`                                                   | The plan, the per-platform doctrine, the published record.                           |
| `.claude/skills/ethniafrica-audience-audit/SKILL.md`                                                                                       | Writes the dated report both downstream skills consume.                              |
| `.claude/skills/ethniafrica-experience-optimizer/SKILL.md`                                                                                 | On-page copy priorities.                                                             |
| `.claude/skills/afrik-translator/SKILL.md` + `reference/register.md`, `glossary.md`, `field-classes.md`, `review-rules.md`                 | The voice register; `peuple` → _people_.                                             |
| `.claude/skills/afrik-curator/SKILL.md` + `reference/source-tiers.md`, `directives.md`, `entities.md`, `tools.md`, `country-enrichment.md` | The tiers deciding what a caption may assert.                                        |

**And the missing prompt**: `social/tools/prompt-builder/build-prompts.mjs` — see
§1, finding 4.

### 4.2 The template spec — `docs/design/gabarits-social/GABARITS-SOCIAL.md`

Sections governing **text** (as opposed to layout):

| §                                           | What it fixes                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| §0 Principes non négociables (l. 10)        | The rules no local wording may override.                                                                |
| §1 bis Un format par réseau (l. 40)         | Which networks, therefore which captions exist.                                                         |
| §1 ter La miniature (l. 88)                 | **The cover title: eight words max, the punch on the last.**                                            |
| §3 Cinq rangs (l. 168)                      | The five editorial objects a text can be.                                                               |
| §3 Les dates en chiffres (l. 267)           | Date wording.                                                                                           |
| §3 bis Le bloc de paire (l. 282)            | `{terme, glose}` couples, 2 to 4.                                                                       |
| §6 Règle de choix automatique (l. 572)      | Text length decides the layout.                                                                         |
| §7 Crédits et licences (l. 662 ff.)         | The exact credit and licence strings; a generated image declares itself.                                |
| §7 ter Ouverture et clôture (l. 742)        | **The message doctrine — it overrides any local wording.**                                              |
| └ l. 748 · 766 · 782 · 809 · 935 · 1009     | The doctrine, the second position, variation by content type, the table, the opening and closing cards. |
| §8 Repères d'interface (l. 1045)            | The scroll cue wording.                                                                                 |
| §9 / §9 bis Sous-titres (l. 1068 ff.)       | The subtitle; the closing carries the doctrine, never a link alone.                                     |
| §10 Schéma `cards.json` (l. 1342)           | **The normative text-field contract** — there is no JSON Schema file.                                   |
| §11 Liste de contrôle avant rendu (l. 1437) | The last gate before rendering.                                                                         |

Rationale notes: `notes/_gabarit-video-2026-09-11.md`,
`_video-cloture-2026-09-11.md`, `_video-fin-2026-09-11.md`,
`_gabarit-mesure-2026-09-11.md`, `_gabarit-revision-2026-09-11.md`.

### 4.3 The engine — what handles text

`social/harness/ethni_compose.py` (the engine + `portes()`, `porte_message()`) ·
`ethni_type.py` (the typographic grammar: wrapping, casing, accent budget) ·
`ethni_tokens.py` (`licence_sortie()`, `note_interne()`, `date_en_lettres()` — the
only place a licence string is computed) ·
`ethni_plaque.py` (the plaque: imposed name, engraved rule, **the name the people gives itself**) ·
`ethni_soustitre.py` (cuts narration into captions, `LIGNES_MAX = 2`, `SIGNES_PAR_LIGNE = 42`) ·
`ethni_montage.py` (`doctrine_en_dernier_paragraphe()`, `fin_debut()`) ·
`ethni_carrousel2.py` · `ethni_audio.py` · `ethni_pauses.py` · `ethni_brand.py` ·
`ethni_render.py` (`resolve_cue()`) · `ethni_compose_v1.py` (retired, keeps `derived_licence()`) ·
`gold_burn.py` · `hf-workflows/subtitles/scripts/audio_to_captions.py` ·
`subtitle_paper_burn.py`.

Tests encoding text rules: `test_porte_message.py`, `test_ethni_soustitre.py`,
`test_video_corpus.py`, `test_gabarit_video.py`, `test_ethni_tokens.py`,
`test_ethni_compose.py`, `test_corpus_compose.py`, `test_ethni_cadence.py`,
`test_miniature.py`.

Node tools: `social/tools/prompt-builder/build-prompts.mjs` ·
`link-builder/links.mjs`, `productions.mjs`, `link-builder.mjs`, `check-anchors.mjs` ·
`library/register-post.mjs` · `etat-pipeline/etat.mjs`, `build-etat.mjs`,
`sujets.mjs`, `bilan-sujets.mjs`, `rendu-reseaux.mjs` ·
`migrate-cards/migrate-cards.mjs` · `migrate-scenes/migrate-scenes.mjs` · `deck-migration.mjs`.

---

## 5. The technical gates — what fails automatically

### 5.1 Validators and CI gates

| File                                                                                                              | The editorial rule it enforces                                                    |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `scripts/validateAfrikData.ts`                                                                                    | The master validator (5 793 lines): IDs, tiers, strict models, FR26–FR52.         |
| `scripts/ci/checkEditorialRules.ts`                                                                               | **The six decolonial-posture rules** (see §1, finding 1).                         |
| `scripts/ci/checkSourceTierCoverage.ts`                                                                           | Refuses any source cited without an explicit tier; holds the `needs_review` tail. |
| `scripts/ci/checkAfrikLoaderPreflight.ts`                                                                         | Dangling references; one work cited under two tiers.                              |
| `scripts/ci/checkCopyLiterals.ts`                                                                                 | Refuses reader-facing French typed straight into a component.                     |
| `scripts/ci/checkGlossary.ts`                                                                                     | The single bilingual vocabulary (REQ-144, blocking).                              |
| `scripts/ci/checkTranslationParity.ts`                                                                            | FR/EN parity — **reported, never blocking** (REQ-171).                            |
| `scripts/ci/checkLocalPaths.ts`                                                                                   | No author-machine path in a public repository.                                    |
| `scripts/ci/checkSkillParity.ts`                                                                                  | A skill's canonical copy and its mirror stay the same skill.                      |
| `scripts/ci/checkDeadCode.ts`                                                                                     | The dead-code ratchet.                                                            |
| `scripts/ci/checkMigrationState.ts` · `adjudicatedDrift.ts` · `checkRlsCoverage.ts` · `countPlannedMigrations.ts` | Infrastructure gates.                                                             |

**The ratchets — the tolerances that encode editorial debt:**

| Constant                                 | File                                    | What it holds                                        |
| ---------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| `NEEDS_REVIEW_RATCHET = 915`             | `scripts/ci/checkSourceTierCoverage.ts` | Citations nobody has ruled on. Exact match.          |
| `UNDATED_POLITY_CEILING = 95`            | `scripts/ci/checkEditorialRules.ts`     | Polities with no time bounds. Two-edged.             |
| `RETIRED_CIA_FACTBOOK_URL_CEILING = 132` | `scripts/validateAfrikData.ts`          | Live CIA Factbook URLs still cited.                  |
| `STRICT_MODEL_DRIFT_CEILINGS`            | `scripts/validateAfrikData.ts`          | peuple 7 063 · famille 108 · pays 13 off-model keys. |
| `COUNTRY_PEOPLE_MEMBERSHIP_CEILING = 8`  | `scripts/validateAfrikData.ts`          | Country↔people mismatches awaiting judgement.        |
| `SOFT_CHECK_NAMES`                       | `scripts/validateAfrikData.ts`          | One member: `FR52-coverage`.                         |
| `INTERNAL_REGISTER_PATTERNS`             | `src/lib/editorial/readerRegister.ts`   | Workshop vocabulary banned from reader text.         |
| `DEAD_CODE_CEILINGS`                     | `scripts/ci/checkDeadCode.ts`           | Six categories at zero, `exports`/`types` frozen.    |

### 5.2 ESLint rules

`eslint/rules/no-bare-people-name.js` — **editorial**: a people's name goes
through `AutonymExonymHeading` or nowhere. · `eslint/rules/no-raw-font-size.js` —
typography charter. · `eslint/rules/afh-error-misuse.js` — the error token is reserved.

### 5.3 The 17 strict models — `public/modele-*.json`

`modele-source.json` (the source contract and its tier directive) ·
`modele-peuple.json` (**`appellations.selfAppellation` required + `exonyms[]`**) ·
`modele-pays.json` · `modele-linguistique.json` · `modele-langue.json`
(**`alternateNames[]`**) · `modele-nom.json` and its five sub-models
(`nom-patronyme`, `nom-patronymique`, `nom-jamu`, `nom-nisba`, `nom-totemique`) ·
`modele-relation.json` · `modele-migration.json` ·
`modele-frontiere-coloniale.json` (forbids a border without a Tier 1/2 source) ·
`modele-dossier.json` (every prose block cited; uncertainty goes in `gaps`) ·
`modele-recit-oral.json` (an attributed account, never an assertion) · `modele-media.json`.

### 5.4 Doctrine in the database — `supabase/migrations/`

`010` (`classification_status` enum) · `017` + `018` (editorial doctrine locked
and seeded) · `029` (`name_records` + the tier trigger on ethnonyms) · `031`
(`source_kind`) · **`041`** (one tier scale: 1.0 / 0.7 / 0.4) · `053`
(`afrik_patronymes`) · `067` (`PAT_*` accept all three tiers, `PPL_*` keep the
gate) · `081` (a report is decided, never auto-applied) · **`088`**
(`needs_review` admitted and weighed) · **`089`** (DEC-052: oral and synthesis,
weights by provenance) · `090` (a moderator decision is a draft) · `091`
(DEC-055) · `093`.

### 5.5 The tier ruling ledger

`docs/editorial/source-review/README.md` + `source-tier-rulings.json` ·
`scripts/afrik/sourceTierRulings.ts` · `applySourceTierRulings.ts` ·
`pullSourceTierRulings.ts` · `stripTierProvenanceNotes.ts` ·
`src/app/api/v2/admin/source-tier-rulings/route.ts` ·
`src/api/v2/handlers/` + `services/` + `schemas/sourceTierRulings.ts` ·
`src/app/[lang]/admin/sources/page.tsx` · `src/components/admin/SourceReviewQueue.tsx`.

### 5.6 The tests that hold the doctrine

Machinery: `scripts/charterContractManifest.ts`, `runCharterContracts.ts`,
`scripts/__tests__/charterContractManifest.test.ts` (13 known files).

Editorial doctrine: `checkEditorialRules.test.ts`,
`checkReaderFacingRegister.test.ts`, `checkSourceTierCoverage.test.ts`,
`checkEditorialRules.patronymes.test.ts`, `afrikEditorialCorrections.test.ts`,
`readerRegister.test.ts`, `sourceNoteRegister.test.ts`,
`ficheSourceRegister.test.ts`, `ficheMetadataCharter.test.ts`.

Naming: `ficheNamesCharter.test.tsx`, `nameFicheCharter.test.tsx`,
`nomPublicLabelCharter.test.ts`, `nommerCharter.test.tsx`,
`AutonymExonymHeading.test.tsx`.

Parity and copy: `agentInstructionsBilingual.test.ts`, `copyParity.test.ts`
(blocking), `checkGlossary.test.ts`, `checkCopyLiterals.test.ts`,
`translatorSkillCharter.test.ts`, `skillParity.test.ts`.

Surface charters: ~60 `*Charter.test.*` files under `src/components/`,
`src/styles/`, `src/lib/` — including `gabaritsSocialTokenParity.test.ts`, which
holds the Python engine's token copy to the design system.

---

## 6. The gaps

| #   | The gap                                                                                                                                    | Where it should live                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | **No rule requires competing appellations.** `exonyms` is guarded nowhere.                                                                 | A 7th rule in `checkEditorialRules.ts` + a line in CLAUDE.md.    |
| 2   | **Nothing covers social copy.** The six rules only see corpus JSON.                                                                        | A gate over `cards.json` (§10 is prose today).                   |
| 3   | **The canonical prompts are outside the repo and unreachable** (`social/Guides/` does not exist).                                          | Bring `prompts-production-2026-09-09.md` into `docs/editorial/`. |
| 4   | **The question-title is treated as a risk nowhere.**                                                                                       | `GABARITS-SOCIAL.md` §1 ter + the `ethniafrica-message` grid.    |
| 5   | **No index of the doctrine.** Six places that do not all cite each other.                                                                  | A `docs/editorial/README.md`, which does not exist.              |
| 6   | **Openness to correction is stated nowhere to the reader.**                                                                                | `homePurpose.ts` or `about.ts`.                                  |
| 7   | **No gate measures the distance between an assertion and its sources.** "Assertion tracks certainty" is written doctrine with no executor. | A check inside `ethniafrica-message`, failing anything better.   |
