# S1 Mali — continuation handoff, 23 September 2026

## Resume here

The operator approved the complete French text below, then said it was too long
and chose to continue in another session. Preserve this approval as the content
baseline; it is not approval of an unwritten shorter version or a render.

**Next action: shorten the 492-word, ten-paragraph narration and present the full
revised text for review before rendering.** No target duration was specified.
A 250–300-word draft is a possible editorial starting point, not an approved
word or duration requirement. Keep the full source ledger below as supporting
material rather than reading every bibliographic detail aloud.

### What the next agent should do

1. Read this handoff, the [roadmap](roadmap-2026-q4.md), its
   [alignment plan](alignment-plan-2026-09-22.md), and the existing
   [research note](research-mali-dioula-traore-2026-09-22.md). The correction to
   the research note’s overly broad reading of Labouret is recorded below.
2. Use `ethniafrica-reseaux-help` to locate the existing campaign and idea
   `mali-quelle-histoire`. Continue with `afrik-curator`, `ethniafrica-idee` and
   `ethniafrica-structure` as needed; reuse the completed research and drafts.
3. Shorten without conflating the medieval polity/capital with the Federation
   or Republic, turning an etymological proposal into fact, or giving a modern
   country exclusive ownership of the medieval history. Keep an acknowledgement
   of the Page’s earlier overstatement and the transition to Manden/Mandé/mandingue.
4. Present the complete shorter text for approval. Do not split the same answer
   into a redundant S1 bis. S2’s territory/language/identity question is distinct.
5. Only after that review, align narration, cards, captions, image licences and
   the message audit. The old seven-scene files and their 22 September approval
   describe a different text; they cannot validate the ten-paragraph version or
   an upcoming shorter one. No render, publication or schedule is authorised by
   this handoff.

### Where the work is saved

This repository document is the portable handoff and contains the full text and
source/uncertainty ledger. The private workshop retains the existing campaign
under `$ETHNIAFRICA_SOCIAL_PROJECTS/mali-quelle-histoire/`, its idea under
`$ETHNIAFRICA_SOCIAL_PROJECTS/_idees/mali-quelle-histoire.md`, and the working
copy `script-review-2026-09-23.md`. Use the configured workshop variables rather
than guessing a machine-specific path. Media and old production assets remain
in that private workshop; they are not copied into Git.

The corpus correction and this handoff are on branch
`codex/mali-etymology-correction`, in
[PR #1306](https://github.com/big-emotion/EthniAfrica/pull/1306), targeting
`recette`. The PR was open and no longer a draft at the handoff check. Check its
current state before continuing; a later session must use this branch or the
integrated commit rather than assume an older checkout already contains it.
No merge or database load was performed in this task.

### Publication sequence and access

The operator reports that the introduction video “Comprendre l’Afrique à travers
les noms” was published on 23 September. Its carousel is the next planned
publication, then Mali opens the thematic sequence, followed by
Manden/Mandé/mandingue. Roadmap dates are planning slots, not scheduled posts.

Facebook reading is complete for the visible 52 comments and 38 replies.
The signed-in browser worked; token renewal is not a prerequisite for resuming
this writing task. The discussion findings are preserved below. Do not post a
reply or perform moderation while continuing the research.

## Scope and existing work

Continue the existing `mali-quelle-histoire` campaign and its idea report, narration, source inventory and message audit. Read the Q4 roadmap, alignment plan, 22 September research note and the fresh audience audit. The operator reports that the introduction video was published on 23 September; its carousel is next, then Mali opens the thematic sequence. The roadmap's older S0 planning date is not publication evidence.

Keep the title “D'où vient le nom Mali ?”. The spoken opening carries the requested editorial question and the project intention without prescribing a new visual layout. Keep the previously authorised country-script exception documented in `post.md` and `message.md`; do not restore the country-as-self-naming-agent template.

## Corpus verification

The initial check found the hippopotamus interpretation stated as fact in `dataset/source/afrik/pays/MLI.json`, with an unattributed royal-residence explanation. Following the operator’s explicit request to correct the corpus, a sourced correction was committed and pushed on `codex/mali-etymology-correction`, with PR https://github.com/big-emotion/EthniAfrica/pull/1306 targeting `recette`. It changes the etymology, modern naming actor and contemporary naming chronology, and adds six tiered sources. The existing English deferral remains.

Validation: 57/57 integrity checks, zero editorial errors, zero translation-parity findings with one existing deferral, and clean formatting. Four new source URLs receive advisory off-catalogue warnings despite their explicit citation tiers. The database projection read returned Unauthorized. The correction is implemented on the review branch, not merged or loaded into a database; do not describe the public site or the shared checkout as already corrected.

The earlier research note overstates Labouret: his rejection specifically addresses a derivation of _Malinké_ as “hippopotamus man”. It is evidence of a criticism, not a modern consensus ruling out every hippopotamus-related account of _Mali_. His 1934 colonial-era text must also be treated critically; its racial classifications are not retained.

The old idea report and myth audit contain assertions not carried forward: “first witnesses”, “always/never replaced”, and coexistence “from the beginning”. Medieval attestation establishes contemporary use, not the first naming event, an exclusive self-name, or an unbroken state. The old audit refers to sentences absent from the current narration and cannot validate this revision.

## Approved long French narration — shorten before production

Scene numbers below follow paragraph order. The final paragraph is the canonical closing. Source references are editorial notes, not spoken words.

```text
Quand on dit Mali, de quelle histoire parle-t-on ? Vos commentaires sous notre vidéo sur le Mandé nous invitent à préciser les noms que nous employons. Comprendre l’Afrique à travers les noms demande aussi de distinguer les époques.

La République du Mali porte ce nom depuis le 22 septembre 1960. L’Assemblée de la République soudanaise adopte alors cette appellation. Le nom existait déjà dans la Fédération du Mali, qui réunissait le Sénégal et la République soudanaise. Cette fédération devient indépendante le 20 juin 1960. Le Sénégal s’en retire le 20 août. Ces dates désignent trois étapes différentes.

Le choix de Mali renvoie à l’empire médiéval associé à Soundiata Keïta. Cet empire s’affirme au treizième siècle. L’historien Djibril Tamsir Niane emploie les expressions « empire du Mali » et « empire manden ». Ses travaux croisent les textes et les traditions orales. Les traditions qu’il étudie évoquent des rois du Manden avant Soundiata. L’essor de l’empire ne marque donc pas le début de toute cette histoire. Les territoires de cet empire ne se confondent pas avec les frontières actuelles.

Les textes médiévaux emploient aussi Mali pour parler d’une ville : la capitale. Ibn Battuta la visite en 1352. L’historien François-Xavier Fauvelle analyse ce récit et l’Atlas catalan de 1375, qui représente une ville de Melly. La localisation de cette capitale reste discutée. Niani a longtemps été proposée. Cette identification reste contestée, notamment par l’archéologie. Ces documents attestent un usage ancien du nom, sans expliquer son origine.

Que veut donc dire Mali ? Une explication rapproche ce nom de l’hippopotame. Le dictionnaire bambara Bamadaba donne bien ce sens au mot màli. Cette ressemblance ne suffit pas à prouver l’origine du nom du pays.

Une autre explication propose « le lieu où vit le roi ». Un document pédagogique de Core Knowledge reprend cette formule. Ce passage ne fournit pas de démonstration linguistique. Nous pouvons signaler cette interprétation, mais nous ne pouvons pas la présenter comme une traduction établie.

Une troisième piste relie Mali à Manden. Niane propose que Mali provienne d’une transformation de Manden chez les Fulɓe, aussi appelés Peuls en français. Il situe le pays appelé Mande ou Manden dans le haut bassin du Niger, entre Kangaba et Siguiri. Cette proposition concerne la circulation du nom entre des langues. Elle ne donne pas une traduction certaine de son sens premier.

Notre première vidéo réduisait Mandé à une famille de langues. Nous avons aussi écrit que les habitants n’employaient jamais Mali. Cette affirmation dépassait nos sources. Nous devons distinguer les noms attestés, les usages locaux et les identités actuelles.

Mali désigne donc, selon l’époque et la source, un empire, une capitale, une fédération ou une république. Son histoire politique est mieux documentée que son sens premier. Manden, Mandé, mandingue : quand parle-t-on d’un territoire, de langues ou d’une appartenance ?

Notre objectif : raconter l'origine des noms, avec des sources. Vous avez une histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica.
```

## Source and uncertainty map

All links consulted on 23 September 2026. A tier identifies the source's standing, not certainty of every proposition.

| Scenes              | Source                                                                                                                                                                                                                                      | Tier                 | Exact support and limits                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2                   | Office of the Historian, _Mali_, https://history.state.gov/countries/mali ; memorandum of 23 September 1960, _FRUS 1958–1960_, vol. XIV, document 75, https://history.state.gov/historicaldocuments/frus1958-60v14/d75                      | official             | Federation independence on 20 June; Senegal withdrawal on 20 August; Assembly's adoption of Republic of Mali on 22 September. The memorandum is contemporary evidence. Do not collapse all three events into one independence date.                                                                                                                                                                                                                         |
| 3                   | _L’homme du 22 septembre_, Site Modibo Keita, https://modibo-keita.site/lhomme-du-22-septembre/                                                                                                                                             | unverified           | Commemorative account explicitly links the September choice to the medieval empire. It supports a reported historical reference, not a verified personal genealogy of Modibo Keïta. Read alongside the dated official records; no descent claim retained.                                                                                                                                                                                                   |
| 3–4                 | François-Xavier Fauvelle, _The imperial capital of Mâli (14th century): A new hypothesis_, Medievalista 35 (2024), https://scielo.pt/scielo.php?pid=S1646-740X2024000100055&script=sci_arttext                                              | referenced           | Opening sections distinguish medieval polity and modern Republic; describes Catalan Atlas, Arabic accounts and Sunjata. Capital section and note 43 reproduce the city passage through Levtzion/Hopkins 2000, pp. 287–288. The original Arabic manuscript was NOT inspected. The article's proposed capital location remains a hypothesis, not adopted here.                                                                                                |
| 4                   | François-Xavier Fauvelle-Aymar, _Niani redux_, 2012, abstract and bibliographic record, https://blogs.univ-tlse2.fr/palethnologie/en/2012-10-fauvelle-aymar/                                                                                | referenced           | Existing corpus source; archaeological objection to identifying Niani as the fourteenth-century capital. Does not license naming another site as certain.                                                                                                                                                                                                                                                                                                   |
| 5                   | _Bamadaba — Dictionnaire bambara_, entries Màli and màli, https://bamadaba.coastsystems.net/lexicon/m/                                                                                                                                      | referenced           | Separate lexical entries for the country and the animal. Confirms a word meaning hippopotamus; establishes no historical derivation of the toponym. No unsupported first-attestation date.                                                                                                                                                                                                                                                                  |
| Research background | Henri Labouret, _Les Manding et leur langue_, Bulletin du Comité d’études historiques et scientifiques de l’AOF XVII(1), 1934, chapter I, “Le Pays” and “Les Hommes”, transcription at https://webmande.net/langue/labouret_1934/chap1.html | referenced           | Lists regional forms and critiques the Malinké/hippopotamus derivation. Transcription read, original print pagination not checked. Colonial-era account, not contemporary identity guidance or a consensus etymology. No dated transmission chain established.                                                                                                                                                                                              |
| 6                   | Core Knowledge, _Mali_, teaching background PDF, first PDF page, https://www.coreknowledge.org/wp-content/uploads/2017/03/CKHG-G4-U5-about-Mali.pdf                                                                                         | referenced           | Direct evidence that the royal-residence explanation circulates. The passage calls it Arabic but provides no lexical derivation; the script does NOT endorse that language attribution. This is a pedagogical source, not specialist linguistic confirmation.                                                                                                                                                                                               |
| 3, 7–8              | Djibril Tamsir Niane, _Le Mali et la deuxième expansion manden_, in _Histoire générale de l’Afrique_, IV, UNESCO/NEA, 1985, pp. 141–196; consulted chapter reproduction: https://bokundoli.org/wp-content/uploads/2021/12/T4-10.pdf         | official             | Page 141 locates Mande/Manden between Kangaba and Siguiri; page 143 uses empire manden; page 153, note 28, explicitly proposes a Fulbe-mediated alteration from Manden to Mali. The latter passage supplies an attributed explanation, not a dated naming event or a demonstrated original lexical meaning. Pages 151–154 discuss oral traditions and their variants. The narration does not endorse every historical reconstruction in this older chapter. |
| 1, 8                | Published Mandé reel, https://www.facebook.com/reel/28380478968279095/ ; Page’s pinned reply, https://www.facebook.com/reel/28380478968279095/?comment_id=2223519001828629                                                                  | observed publication | The visible reel caption excludes a people-name and presents Mandé as a language-family name. The pinned Page reply acknowledges historical and territorial usages, reviews etymological uncertainty, and promises a sourced Mali video. These establish what the Page said, not independent historical truth.                                                                                                                                              |
| 9                   | Editorial synthesis of the sources above; roadmap S2                                                                                                                                                                                        | —                    | Referent list summarises the piece. The forward question proposes investigation, not equivalence of Manden, Mandé and mandingue.                                                                                                                                                                                                                                                                                                                            |

Wikipedia was used only to locate competing explanations and their citations. The Davidson and Creissels PDF leads could not be opened successfully and are not claimed as page-verified authorities. Collet 2013 was blocked by an anti-bot page. No access failure is converted into a claim that the source contains nothing.

## Explicit uncertainties and exclusions

- No winning etymology, first naming actor or first-ever use has been established.
- The hippopotamus lexical fact and the toponym's origin are different propositions.
- The royal-residence account is documented as a circulating explanation, not linguistically demonstrated by the passage read.
- Niane explicitly proposes a direction from Manden through Fulbe usage; the inspected passage does not supply dates or a demonstrated sound-change chain. Report this as his proposal rather than treating it as a settled linguistic derivation.
- Malal in al-Bakri is not silently equated with Mali; that disputed earlier identification is outside this narration.
- No fixed imperial border map, certain Niani/Kangaba capital or personal ancestry inference is proposed.

## Myth review

Framing: **explains**. Scene 4 establishes medieval use while avoiding an unsupported exclusive self-name. The Page’s pinned response independently confirms that the Mali/Manden naming dispute informed the promised follow-up, but it is not independent historical evidence. The individual denial and its 13-reply thread were now read in full. The misconception is therefore attested, but this task does not create a redundant companion carousel; the main narration already addresses the pre-1960 name. The corpus correction is implemented in PR #1306; integration and database synchronisation remain outstanding.

## Facebook review and access limits

Completed through the operator’s signed-in browser session on 23 September 2026 after explicit authorisation. The supplied share link resolves to https://www.facebook.com/reel/28380478968279095/. The “all comments” view loaded 52 top-level comment containers and 38 reply containers, matching the displayed total of 90. All available comment/reply “see more” controls were expanded. This describes the UI-visible discussion; it is not an API export or an assertion about hidden/deleted comments. Images without text were not transcribed. No reply, reaction, moderation action, credential change, publication or scheduling action was performed.

The previous token failure no longer blocks this editorial review. Browser access was sufficient. No token was read or extracted. One browser-control timeout required reconnecting; the already expanded page was recovered and the reading completed.

The full 21 September pinned Page response and the 17 September Page response were read. The latter explicitly promised to revisit the territorial, linguistic and identity uses of Mandé. The discussion also contains repeated denials of a pre-1960 Mali name, a hippopotamus naming narrative attributed by readers to Soundiata, objections to treating Soundiata as the beginning of Manden, Sosso-related objections, and first-person identity and family accounts. These accounts establish questions and self-descriptions, not independent proof of their historical or linguistic explanations. No private commenter is named or quoted in the proposed publication.

Two earlier Page replies were directly verified and require care:

- 16 September, 12:56: the Page stated that inhabitants never called the territory Mali, and suggested a transmission order. https://www.facebook.com/reel/28380478968279095/?comment_id=28319088241088379&reply_comment_id=2009414293099164 . The absolute exclusion is unsupported by the consulted sources. Scene 8 now explicitly acknowledges that overstatement.
- 16 September, 12:57: the Page treated Niani’s identification as the capital as certain. https://www.facebook.com/reel/28380478968279095/?comment_id=1075108501809064&reply_comment_id=4551954355124086 . The newer pinned response already qualifies this; scene 4 now explicitly names the contested identification.

Editorial decisions from this reading:

- Keep medieval attestation separate from the modern adoption of a state name. Do not treat present-day borders as medieval limits or give a modern country exclusive ownership of the history.
- Distinguish imperial expansion under Soundiata from the earlier kingdoms recalled by the oral traditions discussed by Niane (pp. 153–154). Do not turn the sixteen-predecessor list into an independently dated succession or verify a reader’s personal genealogy from it.
- Acknowledge our earlier overstatement, rather than casting the publication as a correction aimed only at readers.
- Reserve the classification/identity distinction for S2. A linguistic relationship does not prescribe an individual or collective self-identification. The claimed Manden derivation from a term for union is a lead from a reader; it lacks independently checked linguistic evidence and is not adopted.
- Keep the hippopotamus narrative attributed and uncertain. A prior Page reply calling it an oral-tradition version is not a substitute for an identified tradition-bearer, collection or publication.
- No additional S1 bis is needed: the script already answers the naming-history question; S2 addresses a distinct question about territorial, linguistic and identity usages.

## Synthesis for operator selection

The recommended synthesis is scene 9 above. A shorter alternative to its first two sentences is: “Les sources attestent plusieurs usages historiques de Mali. Elles ne suffisent pas à établir le sens premier du nom.” Keep the same S2 transition after either choice. Option A is the scene 9 wording and was included in the full text approved on 23 September. Option B remains an alternative. The operator also found the approved text too long; the shortened whole must be presented again. Neither version has replaced the existing production narration.

## Continuation decision

Do not split this answer into an S1 bis: the current script already distinguishes naming events, attestations and etymological uncertainty. Continue to the distinct S2 question about territorial, linguistic and identity uses of Manden/Mandé/mandingue. No date is booked or scheduled.

## Readability verification

The French narration has been checked with the existing plain-language checker. The canonical closing contains an imperative (Partagez-la) required by the current social charter; this is disclosed rather than silently changing the closing. The generic country-template checker is not a passing gate for the already authorised Mali exception. The long text is approved, but the requested shortening and production alignment remain unfinished. This document is not a render-ready production bundle.

## Review and production boundary

This is the complete approved long spoken text. Screen cards, asset-to-scene mapping and captions are not revised in this task; old cards and old approvals describe the prior version. The operator must review the shortened text before it replaces the canonical production files. A changed narration requires matching cards, a fresh message audit and explicit text approval before any rendering. No output licence is inferred for new scenes.
