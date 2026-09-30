---
name: ethniafrica-structure
description: Prepare EthniAfrica narration, visual storyboards, sourced assets and scene plans, or independently prepare carousel cards. Second stage of idee → structure → produire. Use for writing narration, planning a video, preparing sources or carousel copy. Does not render; preserves approved text and existing approvals.
---

# structure — écrire le contenu

## Editorial voice and reader needs (2026-09-30)

Before writing or reviewing reader-facing copy, read
`docs/editorial/reader-facing-register.md` and `docs/editorial/audience-personas.md`.
EthniAfrica speaks as a popular educator using research methods, without claiming
scientific, linguistic or historical qualifications for its operator. Explain the
subject in ordinary language, keep uncertainty in the sentence, and put traceable
sources after it. Oral and local accounts are sources in their own right; preserve
their actual context and never invent interviews or community consensus.
State the primary reader need in the existing working report; personas are
provisional, and geography or platform demographics never establish diaspora identity.

## Narrative family routing (2026-09-29)

Every piece belongs to one of six narrative families — `name-investigation`,
`historical-portrait`, `circulation-connections`, `guided-listening`, `comparison`,
`material-biography` — chosen by the shape of its question. The briefs, claim maps
and the carousel and video sequences of each are in
`.claude/skills/ethniafrica-structure/references/narrative-families.md`; the
meanings (family ≠ visual profile ≠ format) are in
`docs/design/gabarits-social/EDITORIAL-CONTRACT.md`.

1. **Read the subject report and its brief** (`idee` writes both). Before writing
   any text, run
   `node social/tools/narration/check-family-brief.mjs <brief.json>`. It refuses an
   unknown family, a claim with no source, a misspelled claim kind, a brief with no
   declared uncertainties, and a stale or missing strategy basis; on success it prints
   which reviews are `required` (with the skill that answers each) and which are
   `not-applicable` with the reason.
2. **Run the reviews the plan lists, and only those** beyond the five universal ones
   (provenance, uncertainty, attribution, intelligibility, non-essentialising —
   owed by every family, never waived). `name` → `ethniafrica-onomastique`, `myth` →
   `ethniafrica-mythe`, `geography` and `music` → the source and audio checks below.
   A `not-applicable` line is written into the verdict with its reason; it does not
   cancel a universal review.
3. **The name-origin machinery is for `series: name-origin` alone**: the fixed title
   « D'où vient le nom X ? », the category template, `check-gabarit.mjs`, the single
   fixed closing, the myth-ending-in-`?` ledger record in `docs/productions/`, and the
   rule that a subject with no sourced myth has no carousel. A production that
   predates briefs and whose subject the ledger holds is that series: no brief is
   demanded, nothing changes for it. A social-only piece is never filed in
   `docs/productions/` and never gets an invented site path, typologie, episode or
   myth.
4. **A brief with a `narrativeDesign` section is the research-led route
   (2026-09-30).** `idee` has already framed, researched, proposed, recorded the
   operator's choice and shown the detailed plan; `check-family-brief.mjs` refuses the
   brief until all of that is recorded and shown (a draft, an unshown plan or a
   synthetic choice is not a handoff). **Consume the selected plan; do not choose a
   fresh argument.** Write the narration from the outline's blocks, in their order,
   keeping each block's evidence and limits, its transition and the viewer-success
   statements it must earn; a block that cannot be written from its cited claims goes
   back to `idee`, it is not filled with an invented source, date or creator. The
   old gabarit (`--type`, fixed scenes, two-explanation ceiling) does not apply on
   this route; the check is
   `node social/tools/narration/check-gabarit.mjs narration.fr.txt --brief <brief.json>`
   (the series' closing stays word for word). The reviews from step 2 still apply.
   Narration approval, voice and rendering remain later steps. Briefs without the
   section, and any narration already approved, follow their established path.
5. **A `narrativeDesign` with `format: "carrousel"` is the same route for cards
   (2026-09-30).** The design is a handoff only when `check-family-brief.mjs` accepts
   it: `carouselSequence` is the outline's card ids, `carouselProfile` and
   `edition.series` are the selected proposal's. **Write each card from its row of the
   shown outline, in order**: the row's evidence and limits become the card's
   qualification and its short `source`; its `headingKind` decides how flat the title
   may be (a `claim` title over a qualified claim is a rewrite, and no uncertainty
   hides only in the caption); its composition and intention are what you ask the
   assets for. A card that cannot be written from its cited claims, or whose
   composition the assets cannot fill (a timeline with fewer than two real dates, a
   map with no documented route), goes back to `idee` and the plan is revised and
   shown again; it is never padded with an invented source, date or image. Stay inside
   the profile's card range and typography: never shrink type, split within the range
   or narrow the question. `check-gabarit.mjs` does not apply to a carousel; the
   renderer's own fit, crop and subject checks do, and the checks run at 320, 390 and
   430 px first. Show the **complete card copy and the caption** for the existing text
   approval: choosing a plan is not approving its copy. The reviews from step 2 follow
   the claims and media actually present, and a social-only name investigation still
   gets the name review. A reel's chosen pattern approves nothing here.
6. **Carousel and video are independent editions.** Adapting a published carousel to
   a video on the same angle needs no new angle; the sourced claims and approved
   copy carry over, and only what a change touches is re-reviewed. Neither format is
   a prerequisite of the other, and no date or weekday is required.

## Mémoires sonores carousel route (2026-09-25)

Read `docs/design/gabarits-social/MEMOIRES-SONORES.md` first for this feature.
Since 2026-09-27 the profile draws nothing of its own: its cards use the standard
carousel gabarit (the Lingala format), so **every card needs a licensed full-frame
photograph**, and the words sit in the standard slots (`titre`, `precision`,
`punchline`, `corps`, in that reading order). The generic A/B/C quota applies.
Layout approval never approves episode copy or audio.
Its six-card sequence replaces the name-origin sequence and closing.
Prepare TikTok/Instagram copy only; no mandatory myth, reel or site article.
Read the guide and scaffold through
`social/harness/venv/bin/python social/harness/ethni_carrousel2.py --brief memoires-sonores`.
Populate its `deck`, preserving `profil` and the six `etape` values; add the
`musique` recording and per-platform usage notes. Research and full-text approval
still apply. Follow the reference's registration command with `--profile
memoires-sonores`: register in the private library only. The public name-origin
ledger step below does not apply to this social-only feature; no site route or
name typology is invented.

Deuxième étape. `idee` vient avant, `produire` vient après.

## Scene-video dispatch and handoff

For every new video, use the scene engine. Carousel instructions below apply only
to a requested carousel; an existing deck is optional reference material.
Read `social/harness/SCENE-PRODUCTION.md`,
`social/harness/SCENE-CATALOGUE.md`, `social/harness/templates/scene-storyboards.md`
and `references/gabarit-reel-scenes.md`. Choose name-origin, history-geography,
thematic-analysis or an explained free structure. Keep carousels on their own route.

The source report, explicit full-text approval, source-tier rules, plain-language
review, message/myth review, synthesis and approved project closing still apply.
Reuse approvals already given for unchanged inputs. For **name-origin only**, retain
the category narration template, fixed title and `check-gabarit.mjs`. Thematic and
historical subjects do not inherit that title or need an invented myth, corpus
entity, numbered episode or publication category. Missing registration classification
is recorded separately; it does not prevent a private technical proof.

For scene-only work, `cards.json` and `cartes.json` are optional.
Narration organizes ideas; paragraphs do not dictate cuts. A scene lasts as long
as the explanation and reading comfort require. A sustained map may span several
sentences while its camera, regions, points, routes and dates evolve. Start a new
scene when it clarifies a change of place, period, evidence or idea. There is no
fixed image-turnover timer. A shot can span or subdivide narration paragraphs.
The name-origin editorial paragraph order still
applies; it does not dictate visual cut points. A scene plan does not override brand
fonts, inks or safe areas.

Prepare the private `production-brief.md` using the versioned brief template. Show
the complete narration and a concise visual storyboard together: asset choices,
camera intentions, dates, locators, schematic paths, uncertainty and silent context.
Include the cover scene/title and network-specific publication Markdown in that
combined review. Use `.claude/skills/ethniafrica-production/references/publication-delivery.md`
for the video kit contract. Reuse approved network copy; otherwise prepare it for
the intended networks. Record a measured cover timestamp relative to the exported
video after alignment, not an arbitrary first frame.
Do not require the operator to approve every technical coordinate or repeat approval
of unchanged speech. Resolve material editorial choices before execution.

Before voice approval, the storyboard is a proposal, not an executable timed plan.
After the approved recording and exact alignment exist, bind the storyboard to
measured words, fill `scene-plan.json`, calculate actual hashes and complete the
source/licence register. The preparation owner must supply geometry and images;
a smaller execution model must not infer them from the narration.

Deliver the filled plan, source bundle and explicit execution instructions from
`social/harness/templates/scene-execution-prompt.md`. When production is already
authorized, continue into the scene route of `produire`; otherwise identify that
next step. Missing inputs are reported together, not one prompt at a time. Do not
claim a placeholder JSON starter is ready. Registration remains a separate,
appropriately typed editorial operation; scene proofs never promote publication status.

If no subject report exists in `$ETHNIAFRICA_SOCIAL_PROJECTS/_idees/` or the supplied
private package, report the gap and use `idee` to recover the missing evidence.
Preserve an existing approved narration; missing report storage is not a reason
to restart audience research or rewrite that narration. For coordinated video
resumption, use `.claude/skills/ethniafrica-production/SKILL.md`.

## Entrée

Le rapport de sujet écrit par `idee`.

## Sorties

Dans `$ETHNIAFRICA_SOCIAL_PROJECTS/{Sujet}/` :

| Fichier            | Ce qu'il porte                                                             |
| ------------------ | -------------------------------------------------------------------------- |
| `cards.json`       | Carousel only: follow `docs/design/gabarits-social/GABARITS-SOCIAL.md` §10 |
| `narration.fr.txt` | le script, si le sujet vise un reel                                        |
| `SOURCES.md`       | une entrée par image : auteur, dépôt, URL, licence lue                     |
| `post.md`          | la note de travail : titre, intention, À savoir, ligne **Texte validé**    |

Dans `$ETHNIAFRICA_SOCIAL_PROJECTS/_legendes/` : **`<id>.md`**, les descriptions
par réseau, le commentaire à épingler et la story — un fichier par post.

Et dans la bibliothèque, **une fois le texte validé** (voir « Pour finir ») :
une entrée par post dans le registre de la bibliothèque, et son dossier
`$ETHNIAFRICA_SOCIAL_POSTS/Brouillon/<Prefixe-Sujet>/<id>/`, dont le `post.md`
est généré. Aucun dossier ne se crée ni ne se déplace à la main.

Et dans le dépôt, **au même moment** que l'entrée de la bibliothèque ci-dessus,
jamais dans un appel séparé qu'une session interrompue pourrait laisser à
moitié fait : `docs/productions/<typologie>/<NNN>-<slug>.json` — voir « Le
carnet de production » ci-dessous.

## La règle qui prime

**Chaque affirmation porte son ancrage. Une licence non lue bloque la carte.**

« Non lue » veut dire : tu n'as pas ouvert la page du dépôt et vu la mention de
licence de tes propres yeux. Une licence supposée d'après le nom du fichier, la
réputation du dépôt ou une autre carte de la même série n'est pas une licence
lue. Dans le doute, la carte ne sort pas — elle change d'image.

`SOURCES.md` porte, pour chaque image, l'URL exacte où la licence a été lue.

## Carousel schema

`cards.json` suit §10 : `campagne`, `pilier`, `accent`, `fond`, `licence_sortie`,
puis `cartes[]` avec `rang`, `role`, `titre`, `chiffre`, `precision`,
`punchline`, `corps`, `source`, `coupe`,
`image{fichier,w,h,cadrage,identite,verifie_le,credit,depot,licence}` et
`disposition`.

- `disposition` reste `auto` sauf raison écrite. §6 choisit mieux qu'une
  intuition, parce qu'il mesure la résolution.
- `image.w` et `image.h` sont les **pixels réels du fichier décodé**, jamais une
  estimation ni une lecture du nom. C'est sur eux que repose le repli de §6.
- **`image.identite` est obligatoire.** Une phrase décrivant ce que l'image
  montre, écrite **en la regardant**, sans nommer son auteur ni sa licence. C'est
  ce que la porte 2 oppose au crédit ; recopiée du crédit, elle ne garde rien.
  Pose `image.verifie_le` à la date du jour une fois les deux relus côte à côte.
- **`paires` porte une liste de couples** — `[{"terme": "Mosotho", "glose": "une
personne"}, {"terme": "Basotho", "glose": "le peuple"}, …]`. Le parallèle
  vertical **est** le contenu : c'est lui qui fait voir que Mosotho et Basotho
  sont le même mot à deux nombres. **Deux à quatre paires**, au-delà la scène se
  coupe en deux. N'emploie pas `coupe` pour ça : une structure ne se déclare pas
  par un retour à la ligne.

  **Le champ s'appelle `paires`, et une carte porte `corps` et `paires`
  ensemble** — c'est la forme normale : la paire montre l'équivalence, le corps
  dit d'où elle vient. Un `corps_paires` qui _remplace_ le corps était la
  contrainte de la vidéo, où le tableau prend toute la place ; en image fixe il y
  a la place. Écrit sous l'ancien nom, le bloc de paires **disparaît de la carte
  sans un mot** : le moteur ne trouve pas le champ et rien ne se plaint.

  Un terme ne porte **pas** de champ `accent` : la couleur est positionnelle,
  premier terme en encre 1, second en accent.

- `coupe` reste `null`. Ne force les retours à la ligne d'un titre que là où la
  coupe **porte du sens** — une énumération dont les groupes ne doivent pas se
  mélanger. Une coupe posée pour l'esthétique se périme au premier changement de
  format.
- `licence_sortie` n'est pas recopiée d'une carte : c'est la licence la plus
  contraignante du lot, et `produire` la recalcule. Écris ce que tu crois, elle
  sera vérifiée.

## Le carnet de production

**Name-origin series only.** This ledger (`docs/productions/`) is the name series'
record. A piece of any other family, or a social-only piece, is registered in the
private library alone and never written here: no fabricated `sitePath`, typologie,
episode or myth. Skip this whole section for it.

### Approved project introduction

For an explicitly approved project-intention introduction, use the dedicated
record in `docs/productions/README.md`, “The introduction record”: save
`docs/productions/introduction/<campaign>.json` with `typologie: introduction`,
`episode: null`, `myth: null`, `subjects: []` and `sitePath: /fr/about`.
Keep a genuine bilingual opening question in `question`. Register the private
library and this public record together after complete text approval.
Do not classify the introduction as `mot`, invent a numbered episode, or
manufacture a myth. The numbered-episode instructions below apply to historical
subjects. This registration exception does not create a narration template or
turn a failed template check into a pass; disclose that limitation at handoff.

`docs/plans/production-history-plan.md` en porte le schéma complet et sa
justification ; cette section dit seulement ce que `structure` en fait.

Écris `docs/productions/<typologie>/<NNN>-<slug>.json`, `<typologie>` et
`<NNN>` recopiés tels que le rapport de sujet les a proposés (idée les lit
dans `docs/productions/<typologie>/` avant de proposer) :

```json
{
  "campaign": "<le même id que --id sur register-post.mjs>",
  "typologie": "<celle du rapport de sujet>",
  "episode": <celui du rapport de sujet>,
  "question": { "fr": "D'où vient le nom <X> ?" },
  "myth": { "fr": "<le mythe attesté, reformulé en question, jamais affirmé>" },
  "subjects": [
    { "kind": "people|country|family|language|patronyme", "id": "<PPL_…|ISO 3166-1|FLG_…|ISO 639-3|PAT_…>", "label": { "fr": "<nom affiché>" } }
  ],
  "sitePath": "<la route française de la fiche>",
  "publications": []
}
```

- **`subjects[]` et `sitePath` viennent de la même résolution corpus** que
  celle qui a choisi la fiche et les images du lot — ne les redérive pas
  séparément, c'est la même identité, écrite une seule fois.
- **Exception : la typologie `mot`** (« ethnie »). Aucune fiche ne porte un
  mot : `"subjects": []`, et `sitePath` est la route française où la pièce
  envoie le lecteur (par exemple la page « À propos »). N'invente ni un id de
  corpus ni une fiche pour remplir `subjects[]`.
- **`question.fr` et `myth.fr` doivent se terminer par « ? »** — jamais une
  affirmation, même hedgée par « aurait ». Le gate le refuse sinon.
- **`narrativePattern` n'existe plus pour un nouveau lot** (2026-09-21) : la table par
  type de contenu de §7 ter qu'il nommait est retirée, pour le carrousel comme pour le
  reel. Laisse la clé absente. Les entrées déjà écrites la gardent, et le gate ne la
  contrôle pas (clé facultative, valeur non contrôlée).
- **`publications` part vide.** Ce carnet ne connaît un lien qu'une fois publié ;
  c'est `produire`, puis l'opérateur, qui les ajoutent au fur et à mesure —
  jamais `structure`, qui écrit avant tout rendu.
- **Valide avant de continuer** : `npm run check:production-ledger`. Une
  erreur ici (id de corpus inconnu, épisode déjà pris, `sitePath` qui ne
  correspond à aucun sujet, réseau/format que §1 bis n'autorise pas) se
  corrige avant d'aller plus loin — ne la reporte pas à `produire`.

## Name-origin narration only

For a name-origin reel only, use the category template (people, country, patronymic,
place or language) in
`.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md`.
Keep its editorial blocks and prescribed speech. Block counts never constrain
visual cuts or shot counts. The reference is authoritative for that profile;
other video profiles follow their own structure in the scene reference.

- **La catégorie est la `typologie` du rapport de sujet et du carnet.** Elle
  détermine le gabarit ; ne la déduis pas du contenu.
- **`node social/tools/narration/check-gabarit.mjs narration.fr.txt --type <catégorie>`
  la vérifie**, et se lance avant `check-narration.mjs` : un texte hors gabarit se
  réécrit avant d'être affiché à l'opérateur.
- **Un cas hors gabarit — typologie `mot`, groupe sans nom pour lui-même, plus de
  quatre noms de l'intérieur, un seul nom — s'arrête et se dit à l'opérateur.** Ne
  fabrique pas une variante.
- **Corriger une narration déjà écrite, non publiée** : lance le contrôleur, réécris
  dans le gabarit, relance jusqu'à ✔, puis repasse par la validation du texte. Ne
  touche ni aux faits, ni aux sources, ni aux licences.
- **Les anciennes trames de reel n'existent plus** : le renversement du type, la
  clôture par type, la trame « le nom remonte, puis les peuples remontent ». Le
  carrousel garde la sienne (section suivante) et son gabarit propre, traité à part.

## Un carrousel sur un pays : ce que l'audience doit repartir avec

**Cette section vaut pour un carrousel.** Video planning uses its chosen scene profile independently.

Décidé par l'opérateur le 2026-09-16, sur un premier jet Guinée dont le flux
était juste et dont on ne retenait que trois choses : le nom vient de la mer, il
y a eu un État, un autre peuple était là aussi. C'est un décor, pas un savoir.
La trame de référence est `cote-divoire-le-renversement`, dont la carte 5 fait
à elle seule ce que ce jet entier avait manqué.

**Le nom remonte, puis les peuples remontent.** Le lot monte du nom actuel vers
le moment le plus ancien qui représente ce pays — puis, arrivé là, il redescend
sur les gens : d'où vient chacun de ceux qui l'habitent. Quatre choses doivent
être acquises à la fin, et elles se vérifient carte par carte.

### 1. Les interprétations du nom sont le contenu, pas une liste à expédier

Quand un nom a plusieurs origines proposées, **chacune se raconte** : de quelle
langue elle vient, ce que le mot y veut dire, qui la porte. « L'origine est
incertaine, voici trois pistes » en une carte ne laisse rien au lecteur — il
retient « on ne sait pas », ce qui est le contraire d'un savoir.

Une piste qui vaut d'être citée vaut d'être expliquée. Si le lot n'a pas la
place de le faire pour les trois, il en prend une ou deux et le dit, plutôt que
de toutes les mentionner sans en éclairer aucune. **Ce sont ces interprétations
que l'audience vient chercher** — pas l'arbitrage entre elles, qui d'ailleurs
ne nous appartient pas (`CLAUDE.md`, Source Tier Policy ; cinquième question
d'`ethniafrica-onomastique`).

### 2. D'où vient chaque peuple, nommé un par un

C'est la carte qui manque le plus souvent, et c'est celle qui porte le propos
du projet. Pas « les peuples ont migré » : **quel peuple, depuis où**.

> Les Akan, de l'est, du Ghana d'aujourd'hui. Les Mandé, du Manden, à cheval sur
> le Mali et la Guinée. Les Sénoufo, du Mali. Les Krou ont quitté la savane pour
> la forêt. — `cote-divoire-le-renversement`, carte 5

Un lot sur un pays répond à cette question pour **chacun de ses grands groupes**,
y compris le majoritaire — surtout le majoritaire, puisque c'est lui qu'on croit
autochtone. Une origine que le corpus ne porte pas se dit comme telle ; elle ne
se remplace pas par un silence qui laisse croire que ce peuple a toujours été là.

### 3. Pourquoi le nom est resté, et ce que celui qui l'a donné a laissé

Un pays qui garde son nom colonial, ou un nom venu du dehors, **a une raison de
l'avoir gardé**, et cette raison est un contenu. Le lot dit qui l'a donné, et ce
qu'il en reste aujourd'hui autrement que le nom : une ville, un quartier, une
langue officielle, une frontière, une institution. C'est la quatrième question
d'`ethniafrica-onomastique` appliquée au pays, et elle est rarement posée parce
que le nom semble aller de soi une fois son étymologie donnée.

Quand un pays s'est renommé, la question s'inverse et reste la même : qui a
choisi le nouveau nom, et qu'est-il resté de l'ancien.

### 4. L'endonyme, y compris dans les mots de la pièce

La règle « l'endonyme d'abord » (`docs/editorial/purpose-doctrine.md`, 2026-09-14)
ne vaut pas que pour les peuples dont le lot parle : **elle vaut pour les mots
que le lot emploie en passant.** Écrire « le berbère _akal n-iguinawen_ » dans une
pièce qui explique que les exonymes ont été imposés se contredit dans sa propre
phrase — c'est **amazigh**, pluriel **imazighen**. De même **Fulɓe** plutôt que
« peul » dès que la pièce a la place de le poser.

Relis le lot en cherchant les exonymes que tu as employés sans t'en apercevoir,
comme s'ils étaient des mots neutres : ce sont ceux-là qui passent.

## Name-origin reel title only

**A name-origin reel uses the title « D'où vient le nom « X » ? »**
(`docs/design/gabarits-social/GABARITS-SOCIAL.md` §1 ter, « Le titre d'un reel est
une loi »). C'est le titre de la carte d'ouverture, donc la miniature, et celui du
post sur chaque réseau : les légendes ne le reformulent pas, et aucun titre-chute
ne le remplace. Le **carrousel** a son accroche propre — le mythe posé au lecteur,
en question. Le plafond de huit mots de §1 ter est une décision ouverte pour cette
accroche : signale-la à l'opérateur, ne la tranche pas.

## Le carrousel : un seul gabarit

Cette section vaut pour le carrousel de la **série name-origin**. Un carrousel d'une
autre famille suit la lecture de sa famille
(`references/narrative-families.md`) : pas de mythe exigé, pas de clôture fixe, et
le nombre de cartes vient de son profil visuel, pas de cette liste.

Un carrousel « nom de X » suit `references/gabarit-carrousel-nom.md`, dans cet ordre et
pour les cinq typologies : accroche (la question du mythe) → réponse au mythe →
cadrage → inventaire → une fiche par appellation → classement → morale → clôture
unique. Le fichier porte la fiche d'une appellation, les trois statuts, ce qui change
d'une typologie à l'autre, les règles de rédaction et cinq exemples fictifs, qui sont le
modèle à reproduire. Un sujet sans mythe sourcé n'a pas de carrousel : arrête-toi et
dis-le, n'invente pas de mythe pour remplir l'accroche.

## La clôture, et la fin parlée

**Un reel a une clôture unique**, quel que soit le type du sujet, patronyme compris
(`GABARITS-SOCIAL.md` §7 ter, « Le reel a un couple unique »). Elle dit l'objectif du
projet et invite l'auditeur à partager ce qu'il sait. Son texte — carte et voix — est
décidé par l'opérateur ; il se prend **dans cette section, mot pour mot et en texte
brut**, au moment d'écrire. Ce skill n'en garde aucune copie : une deuxième copie de la
doctrine est celle qui dérive. « Partagez-la » est un impératif que le contrôle de
lecture de la narration relèvera : c'est une exception voulue, pas une faute à réécrire.

Un **carrousel** se ferme sur **la même clôture unique**, mot pour mot, en dernière
carte, après la morale (décidé par l'opérateur le 2026-09-21). La table par type de
contenu de §7 ter n'existe plus : il n'y a plus ni titre de clôture propre au type, ni
ligne de vision, ni renversement d'agent, ni compte chiffré. `cards.json` ne porte
jamais `**` ; le moteur passe lui-même le dernier mot du titre en accent.

La carte de clôture, pour un reel comme pour un carrousel, porte `titre` (la première
phrase de la clôture unique) et `corps` (la seconde), et **rien d'autre** : ni
`source`, ni `pivot`, ni `appel`. Sans `source` le moteur ne pose pas de plaque de
vision ; sans `appel` la pastille est l'adresse par défaut. Un compte chiffré recopié
dans `appel` serait un nombre en dur que la production ne relit pas.

**Aucune clôture n'écrit « Berlin » comme celui qui a tracé les lignes, ni
« mille ans » comme un fait**, tant que la session de doctrine n'a pas tranché
(§7 ter, audit du message du 2026-09-13, constat 9).

The final narration block carries the approved closing. For a complete episode,
use the approved project closing; an explicitly approved excerpt may use its own
reviewed ending. Closing speech does not require a carousel card or a separate shot.
Retain measured speech timing and caption readability throughout.

Visual boundaries belong to `scene-plan.json` and follow the recorded words and
reading comfort. Paragraph boundaries carry editorial structure, not cut points.

## Le registre

- **Le texte parlé suit la règle de lecture simple, et un outil la vérifie.** Chaque
  phrase de `narration.fr.txt` commence par le sujet, puis le verbe, puis le
  complément — **sauf une question**. Phrases courtes (vingt mots au plus), voix
  active, aucune inversion (« écrit-elle », « dit le Trésor »), pas d'ordre de la
  forme « Aidez-nous » sans sujet. Un mot difficile (eugénisme, péjoratif) se
  explique dans la phrase qui suit. Le public est large et beaucoup ne parlent pas
  le français comme première langue : un texte simple se comprend mieux et se
  comprend moins de travers. Règle de l'opérateur du 2026-09-09
  (`plain-language-doctrine-2026-09-09.md`), rappelée le 2026-09-21 après une
  narration qui ne l'appliquait pas. **`node social/tools/narration/check-narration.mjs
<narration.fr.txt>` la vérifie** (ouvertures refusées, verbes de parole inversés,
  plus de vingt mots, **linguiste, auteur ou livre en tête de phrase**) ; il ne
  voit pas si une phrase est simple, cela reste à l'auteur et à la validation de
  l'opérateur.
- **The subject comes first; its reference follows.** Narration, cards and captions
  explain the subject without leading on a scholar or book as borrowed authority.
  Keep contested explanations qualified. A publication year is not an event date,
  and a past tense alone does not express uncertainty. A cited book does not imply
  either the presence or absence of fieldwork; claim direct consultation only when
  it happened. Oral provenance stays identifiable, with its actual carrier and
  context. Follow `docs/editorial/reader-facing-register.md`, including its exception
  for an author, book or quoted speaker that is the actual subject. The lexical
  `attribution-en-tete` check cannot replace this semantic review.
- Les trois champs publiés verbatim au lecteur ne portent **aucune mention
  interne** : ni « à nommer », ni « à confirmer », ni « à compléter ». Ce sont
  des messages à l'opérateur, et ils bloquent la publication au lieu de
  s'imprimer.
- Le crédit nomme **le document réellement affiché sur la carte**, pas la série
  dont il provient ni la campagne qui l'héberge.
- **Every complete video has a synthesis before its closing.** Summarize the
  established argument in at most three simple sentences, without adding facts.
  This editorial beat may share a sustained map or timeline; it need not add a shot.
  Offer two or three alternatives with the full narrative and visual brief when
  planning a new synthesis. Reuse an existing selection and full-text approval
  for unchanged copy; do not reopen the same decision at execution.
- **Un carrousel a la sienne : la morale.** Elle répond à la question de l'accroche
  et à rien d'autre, sans jugement (`references/gabarit-carrousel-nom.md`). Elle se
  propose à l'opérateur de la même façon avant d'être écrite.

Trois guides restent dans la bibliothèque de production, avec les sujets qu'ils
servent. Ils portent de la doctrine éditoriale datée, pas du code :

- Registre de langue : `plain-language-doctrine-2026-09-09.md`.
- Descriptions par réseau : `description-template-2026-09-09.md`.
- Sourcing et personnes reconnaissables : `sourcing-et-licences-2026-09-07.md`.

## Les légendes, réseau par réseau

Elles s'écrivent dans `_legendes/<id>.md`, pas dans le `post.md` de l'atelier :
c'est ce fichier que le `post.md` de la bibliothèque recopie sous « Légendes par
réseau », et c'est ce `post.md`-là que l'opérateur ouvre pour publier.

Le gabarit des descriptions fait foi. Ces règles-ci sont celles qui se perdent
quand on ne l'ouvre pas.

- **Le titre de la carte d'ouverture est la miniature : huit mots au plus, la
  chute sur le dernier** (`GABARITS-SOCIAL.md` §1 ter). C'est la seule image que
  la plupart des gens verront ; le moteur ne la rapetisse plus pour faire tenir
  une phrase, il refuse et le dit. Le développement commence à la carte suivante.
- **Un post n'a de légende que pour les réseaux que `GABARITS-SOCIAL.md` §1 bis
  donne à son format.** Un réseau absent de sa ligne ne reçoit ni légende ni
  lien balisé. Le texte LinkedIn, sans média, s'écrit une fois par sujet : dans
  les légendes du reel quand il existe, sinon dans celles du carrousel.
- **Chaque titre de réseau porte son format entre parenthèses** — `## TikTok
(carrousel)`, `## TikTok (reel)`, `## LinkedIn (texte, sans média)`. Depuis la
  révision du 2026-09-21 de §1 bis, un réseau reçoit les deux formats (X n'a pas
  de carrousel) : dans la série name-origin, un sujet sans mythe n'a pas de
  carrousel, donc pas de titre `(carrousel)` ; les autres familles n'ont pas cette
  contrainte. Le moteur range les rendus par dossier-réseau, nommé d'après
  la colonne « Reçoit » de §1 bis, et c'est cette parenthèse qui dit à
  l'opérateur, sujet par sujet, quel dossier ouvrir sans redescendre à
  `GABARITS-SOCIAL.md` §1 bis pour le retrouver.
- **TikTok parle au « tu », en phrases courtes.** Une idée par phrase :
  l'accroche, deux à quatre phrases de preuve, **la ligne source avec son
  auteur, toujours**, une ligne qui demande un commentaire — jamais un tag, un
  like ou un partage —, « lien en bio », quatre à six hashtags. Instagram,
  Facebook et YouTube restent au « vous », LinkedIn dans son registre complet.
- **X s'écrit au « vous », sans hashtag, et le lien va dans le post.** Deux
  différences de plateforme, pas de goût : le lien y est cliquable — donc jamais
  « lien en bio » —, et les hashtags y sont pénalisés au lieu d'y aider. 280
  caractères par post, une URL comptant pour 23 quelle que soit sa longueur.
  **X est le seul réseau de la table où le texte nu est un format natif** : quand
  le sujet ne tient pas en un post, il s'écrit en fil, la vidéo jointe au premier
  et à lui seul, le lien balisé au dernier. Un fil n'est pas un post découpé —
  seul le premier paraît dans le fil d'actualité, les suivants sont derrière
  « Afficher ce fil », donc le premier porte l'accroche entière.
- **Sous TikTok, les légendes portent un « Commentaire à épingler ».** Une question au
  « tu », liée au sujet, à laquelle n'importe qui sait répondre depuis sa propre
  vie (« Quel est ton peuple ? »). Ni la copie de la dernière ligne de la
  description, ni un lien. Un post TikTok sans elle n'est pas prêt.
- **Sous Instagram, les légendes portent la story : « Story — question » et « Story —
  lien ».** La question de l'autocollant « Questions » est celle du commentaire
  épinglé, réécrite au « vous » ; le lien est celui balisé `utm_content=story`.
  La légende Instagram ne change pas : longue, sourcée, au « vous ».
- **Une question posée est une dette.** Rappelle-le en une ligne à l'opérateur :
  les réponses se lisent et se répondent dans les 48 heures, sinon la question
  ne s'épingle pas.

Règle du 2026-09-13, décidée par l'opérateur et **non mesurée** : elle remplace
la description TikTok longue du 2026-09-12. La revue de phase 1 (3–4 octobre)
compare les commentaires et les vues des deux formes, et garde celle qui gagne.

## La validation du texte, obligatoire

Décidé le 2026-09-14, après que l'opérateur a vu une vidéo rendue sur un texte
qu'il n'avait jamais lu en entier : **aucun texte n'atteint `produire` sans
être passé, mot pour mot, sous les yeux de l'opérateur, et sans qu'il l'ait
validé explicitement.** Ce n'est pas une remarque, c'est une porte — et elle
précède les cinq portes de `produire`, elle ne s'y ajoute pas.

Avant de dire que `structure` est fini :

0. **Check narration before presenting it.** For name-origin only, run
   `node social/tools/narration/check-gabarit.mjs narration.fr.txt --type <category>`
   (or `--brief <brief.json>` when the brief carries a `narrativeDesign`).
   For every profile, run `node social/tools/narration/check-narration.mjs narration.fr.txt`
   and review plain language. Correct failures before full-text approval.
1. **Lance les revues que `check-family-brief.mjs` marque `required`** sur le texte
   écrit, et affiche leurs verdicts avec le texte : ce que le rapport avait vérifié a
   pu glisser en devenant une carte. `ethniafrica-mythe` seulement si `myth` est
   `required` (une pièce qui défait une idée reçue attestée) ; `ethniafrica-onomastique`
   seulement si `name` l'est. Écris pour chaque revue `not-applicable` sa raison.
   Une pièce sans mythe n'en reçoit pas un pour passer : c'est un verdict valable.
2. **Show the complete text in the conversation.** For videos, show full
   `narration.fr.txt` and a separate visual storyboard. For a requested carousel,
   show every title, body and source in deck order. A file link alone is not
   full-text presentation. Narrative paragraphs do not need associated cards.
3. **Demande la validation explicitement** — pas « dis-moi si ça te va »
   noyé dans un paragraphe, une question qui appelle une réponse claire.
4. **N'écris pas la ligne Texte validé, n'inscris pas le post dans la
   bibliothèque, et ne dis pas que l'étape suivante est `produire`, avant
   d'avoir reçu cette validation.** Si l'opérateur corrige, réécris et
   raffiche — la porte ne s'ouvre qu'une fois, sur le texte qu'il a réellement
   vu.

Une fois validé, pose dans le `post.md` de l'atelier :

```markdown
**Texte validé** : oui, le AAAA-MM-JJ, par l'opérateur.
```

Production requires genuine approval of the relevant text: `narration.fr.txt`
for a scene video, deck copy for a carousel. Editing one format does not revoke
approval of unchanged copy in the other. Changed narration must be reviewed again;
never refresh an approval marker merely to bypass a stale-input check.

## Ce que tu ne fais pas

Do not render during preparation or redesign carousel layouts. Video planning
chooses supported scene types, camera cues and existing colour tokens through
`SCENE-CATALOGUE.md`. Fonts, safe areas and palette remain governed by the charter;
do not invent brand values or alter the renderer to complete a subject.

## Pour finir

Affiche le texte et obtiens la validation (voir ci-dessus). Une fois validé :

1. **Pose la ligne Texte validé** dans le `post.md` de l'atelier.
2. **Inscris chaque post dans la bibliothèque.** Sans cette entrée, le sujet
   reste dans l'atelier, où `build-etat.mjs` ne regarde pas : il n'existe pour
   aucun état du pipeline.

   ```
   node social/tools/library/register-post.mjs \
     --id <id> --dir <Prefixe-Sujet>/<id> \
     --title "<titre de la carte 1>" --subject "Peuple · <nom>" --pillar "<pilier>" \
     --status a-produire --copy _legendes/<id>.md \
     --link-path /fr/atlas/<…> --content carrousel      # ou video
   ```

   `--link-path` is optional: a social-only piece with no site page omits it and
   never gets a fabricated route.

   Lis la simulation, puis relance avec `--write`. L'outil crée le dossier du
   post dans `Brouillon/` et imprime les commandes suivantes, chemins compris.

   - **Un post par format.** Carrousel seul : `<id>` = la campagne. Reel et
     carrousel : le reel est `<campagne>`, le carrousel `<campagne>-carrousel`,
     comme `appolo-nzema`. Un post porte un seul jeu de liens balisés, et
     `bilan-sujets.mjs` repère les doublons format par format.
   - **`--status a-produire`**, parce que `build-index.mjs` l'écrit
     « ⚪️ À produire », qu'`etat.mjs` lit comme 🟡 En traitement : le texte est
     écrit, le rendu attendu. `brouillon` se lirait ⚪️ et `a-programmer` ne se
     lit pas du tout. Les deux restent dans `Brouillon/`.
   - **`--dir`** reprend le dossier de sujet existant s'il y en a un
     (`bilan-sujets.mjs <nom>` le montre), sinon un préfixe existant :
     `Pays-`, `Peuples-`, `Langues-`, `Familles-`, `Noms-`, `Villes-`,
     `Dossiers-`, `Continent-`.
   - **`--copy _legendes/<id>.md`**, jamais le `post.md` de l'atelier.
     `build-index.mjs` recopie le fichier nommé tel quel sous « Légendes par
     réseau » : pointé sur la note de travail, il collerait un second en-tête
     d'état, les notes internes et la ligne Texte validé dans le `post.md` de la
     bibliothèque — dont `build-etat.mjs` lit le premier marqueur et où il
     cherche les mentions internes.

3. **Série name-origin seulement : écris le carnet de production** (voir « Le
   carnet de production » ci-dessus), `campaign` égal au `--id` juste posé, puis
   valide : `npm run check:production-ledger`. Une erreur bloque — corrige le
   fichier, ne la reporte pas à `produire`. Une pièce d'une autre famille ne
   s'écrit pas ici : son entrée de bibliothèque suffit. Passe-lui `--family`,
   `--angle` et `--format` dès que `register-post.mjs` (S2) les accepte ; d'ici là
   la famille et l'angle restent dans le brief, à côté du `cards.json`.
4. **Régénère les vues** : `node <00-Index>/build-index.mjs`, au chemin que
   l'outil a imprimé. C'est lui qui écrit le `post.md` du nouveau dossier ;
   `migrate-library.mjs --write` ne régénère rien quand il n'a rien déplacé. Un
   « Copie introuvable » dans ce `post.md` veut dire que `_legendes/<id>.md`
   n'est pas écrit.
5. **Recalcule l'état** (`node social/tools/etat-pipeline/build-etat.mjs`) et
   vérifie que le post y figure en 🟡.

Report the prepared package and next step in one line. `produire` includes
`ethniafrica-message` review. Continue when the operator already authorized
production; otherwise identify the next step without repeating past approvals.
