---
name: ethniafrica-idee
description: Brainstormer un sujet de publication EthniAfrica et en sortir un rapport de sujet — angle, pilier, promesse en une phrase, ce que le sujet ne dira pas, sources pressenties, formats visés, réserves. Première étape de la chaîne idee → structure → produire. Porte aussi les cinq étapes de conception narrative d'un reel ou d'un carrousel (cadrer, rechercher, proposer des trames avec critères de réussite, enregistrer le choix réel de l'opérateur, montrer le plan détaillé avant toute rédaction). Utiliser pour « j'ai une idée de… », « on pourrait parler de… », « trouve-moi un sujet », « qu'est-ce qu'on pourrait publier sur… », « quels récits possibles pour ce sujet », ou /ethniafrica-idee. N'écrit aucune carte, ne choisit aucune image, ne touche à aucun gabarit.
---

# idee — brainstormer un sujet

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

Choose the **family** first, by the shape of the question the subject can honestly
answer: `name-investigation`, `historical-portrait`, `circulation-connections`,
`guided-listening`, `comparison` or `material-biography`
(`.claude/skills/ethniafrica-structure/references/narrative-families.md` — question,
claim map, beats, uncertainties, carousel reading, video sequence for each). A subject
may carry several angles; each angle is its own brief and its own editions. Family,
visual profile, format and destination are four separate choices.

- **The subject report carries a family, an angle, and a machine brief**
  (`$ETHNIAFRICA_SOCIAL_PROJECTS/_idees/{slug}.brief.json`, the shape of the fixtures in
  `social/tools/narration/families/fixtures/`). Validate it:
  `node social/tools/narration/check-family-brief.mjs <brief.json>`. The output is the
  list of reviews the piece owes; copy it into the report's « Réserves ».
- **The name-origin apparatus — the fixed question « D'où vient le nom {X} ? », the
  typologie, the numbered episode, the myth in question form, the site route — belongs
  to `series: name-origin` only.** A `name-investigation` outside that series, and every
  other family, states its own question. A sourced social-only piece needs no fiche, no
  site record, no episode and no myth, and none is invented for it.
- **Strategy basis.** The brief says `dated-evidence` (the audit report of the last 30
  days, cited) or `exploratory` with the reason no comparator exists. An exploratory
  subject is legitimate and labelled as such; it is never dressed up as measured.
- **No weekday, no date is required.** A subject can be ready with no planned date.
  A topical opportunity (an anniversary, a news event) is a reason to bring a subject
  forward, said in « Réserves ».

## Conception narrative guidée par la recherche — cinq étapes (2026-09-30)

**Quand elle s'applique.** Pour un reel **ou un carrousel** dont le sujet a de la matière
de recherche et plusieurs récits possibles (le cas fondateur : Lingala). Le brief porte
alors une section `narrativeDesign` (version 1) ; **c'est ce qui aiguille**, jamais une
phrase, une famille ou une série. Sans `format`, la section décrit un reel ; un carrousel
écrit `"format": "carrousel"` (voir « Le carrousel » plus bas). Sans cette section, le brief suit son chemin habituel : un brief ou une
narration déjà approuvés ne reçoivent ni recherche ni choix rétroactifs.

Avant : recherche → un angle choisi par l'assistant → narration complète. Après :
recherche → propositions fondées sur les preuves, chacune avec sa disposition des blocs
et son critère de réussite → **choix réel de l'opérateur** → plan détaillé montré →
narration. Les **cinq étapes appartiennent toutes à `idee`** ; `structure` n'en possède
aucune et n'écrit qu'après l'étape 5.

| Étape                   | Ce que tu fais                                                                                                   | Ce que l'opérateur voit                                                                                                     | Tu t'arrêtes quand                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1. Cadrer               | Sujet, public, matière fournie, travaux antérieurs (`bilan-sujets.mjs`), durée voulue.                           | Le cadre et l'inventaire de la matière.                                                                                     | Le sujet et la tâche sont sans ambiguïté ; on ne relance pas une recherche déjà faite.                                  |
| 2. Rechercher           | Réutilise la recherche valide, comble les vrais trous avec les outils disponibles, accepte la recherche externe. | Affirmations, sources (lue, indirecte, indisponible), lectures concurrentes, inconnues.                                     | Assez de preuves pour juger les récits, ou les manques nommés précisément. Pas de demande d'approbation par source.     |
| 3. Proposer             | Examine **les dix trames** (`references/narrative-patterns.md`) contre les preuves.                              | Une carte complète par trame proposée ; pour chaque autre trame, sa disposition et sa raison ; une recommandation.          | L'opérateur peut comparer ce que chaque proposition promet, comment elle se déroule et ce qu'elle ne peut pas affirmer. |
| 4. Enregistrer le choix | Reçois le choix de l'opérateur, dans ses mots.                                                                   | La proposition retenue.                                                                                                     | Une proposition précise est nommée. Une recommandation, un fichier ou un « oui » sans objet ne suffisent pas.           |
| 5. Développer           | Étends la proposition choisie en plan détaillé.                                                                  | Tableau minuté, transitions, preuves, incertitudes, acquis, durée totale, pourquoi cet ordre, phrases de réussite remplies. | Le plan complet est **montré** avant toute rédaction complète.                                                          |

**La carte d'une proposition** porte cinq champs nommés, chacun substantiel et propre à
la proposition : **Question · Trame · Application au sujet · Acquis · Critère de
réussite**, plus la recherche, les limites, un exemple de référence (réel avec son
localisateur, ou **explicitement hypothétique** — jamais présenté comme un succès publié),
la durée et la raison de la choisir. Le critère de réussite est un objectif
d'apprentissage borné par les preuves (« Les documents établissent … ; ils n'établissent
pas … »), pas une mesure d'audience : rien ici ne prétend qu'un public a été testé.

- **Les dix trames sont examinées, pas dix vidéos proposées.** Une trame que les preuves
  ne portent pas est signalée avec sa raison (`unsupported`, `inapplicable`,
  `conditional`). Un seul récit viable est acceptable : ne fabrique pas de concurrent.
  Le tier d'une source ne décide jamais seul de cette disposition.
- **Chaque proposition montre sa propre disposition de B1–B6** : fusionnées, répétées ou
  adaptées avec une phrase qui l'explique (« B2 devient la situation avant l'intervention
  d'un acteur », pas une étymologie inventée). Jamais six plans obligatoires ; jamais la
  même disposition collée sur toutes les trames.
- **Une inconnue est un contenu valide.** Pas d'inventeur, de date ni de route inventés
  pour remplir un bloc. Une affirmation `gap` ne peut pas porter le plan choisi.
- **Une recommandation n'est pas un choix.** Après l'étape 3, attends. Si l'opérateur a
  clairement délégué le choix, enregistre la délégation (`kind: "delegated"`) ; sinon le
  choix est le sien. Plusieurs propositions retenues restent des éditions séparées :
  demande laquelle développer d'abord.
- **Durée (reel seulement ; un carrousel n'en a aucune).** Trois minutes est la cible ; une cible plus longue porte sa raison visible
  (`durationReason`). N'accélère jamais la voix et ne retire jamais une incertitude pour
  cacher un texte trop long : dis la décision de périmètre.
- **Si seule l'idée était demandée, arrête-toi à l'étape 5 montrée.** Si l'écriture de
  bout en bout est déjà autorisée, continue vers `structure` sans redemander une
  approbation générique, sauf question de fond ouverte ou demande de relecture.

Les commandes (`social/tools/narration/check-narrative-design.mjs`) :

```bash
node …/check-narrative-design.mjs <brief.json> --mode draft      # étapes 1–3
node …/check-narrative-design.mjs <brief.json> --render proposals # ce que tu montres à l'étape 3
node …/check-narrative-design.mjs <brief.json> --record-shown proposals --where "<où>"
node …/check-narrative-design.mjs <brief.json> --mode selected   # après le choix, plan présent
node …/check-narrative-design.mjs <brief.json> --render plan     # ce que tu montres à l'étape 5
node …/check-narrative-design.mjs <brief.json> --record-shown outline --where "<où>"
node …/check-narrative-design.mjs <brief.json> --mode handoff    # tout est prêt pour structure
node …/check-narrative-design.mjs <brief.json> --resume          # où en est-on vraiment
```

**Enregistre la présentation seulement après avoir réellement montré** les propositions
puis le plan dans la conversation : `--record-shown` en empreint le contenu, et une
modification ultérieure rend la présentation périmée (à remontrer). Le programme
vérifie des traces et une structure ; il ne prouve ni qu'une parole est authentique, ni
qu'une affirmation historique est vraie, ni qu'un récit est bon — cela reste la revue
éditoriale (liste dans `docs/design/gabarits-social/NARRATIVE-DESIGN.md`).

**Au passage à `structure`**, le brief reprend la forme ordinaire (`edition`, `question`,
`claims`, `beats`, `videoSequence` — `carouselSequence` pour un carrousel) **dérivée du choix** : la question et la famille de
l'édition sont celles de la proposition retenue, les affirmations viennent de la
recherche, et les étapes de `videoSequence` sont les blocs du plan. Aucune édition n'est
créée pour une proposition non retenue. Le brouillon de conception (sans choix ni plan)
n'est **pas** un brief prêt : `check-family-brief.mjs` le refuse.

Le brouillon et le brief vivent dans la paire existante
`_idees/{slug}.md` + `{slug}.brief.json`, sous un identifiant neuf : n'écrase ni la
synthèse d'origine ni une édition approuvée. Le Markdown est la présentation, le JSON
fait autorité pour les identifiants, le choix et le plan.

**Reprise.** Sujet seul : étapes 1–2. Recherche existante : évalue-la et comble les
trous, puis étape 3 sans audit d'audience automatique. Propositions montrées sans choix :
attends l'étape 4, n'écris pas le script recommandé. Choix réel sans plan : étape 5.
Plan montré : `structure` peut écrire. Preuves qui changent avant le choix : rafraîchis
les propositions touchées. Preuves qui changent la question choisie : explique et
tranche à nouveau, ne garde pas une approbation périmée. Un recadrage, un dossier de
sortie ou un détail technique ne rouvrent pas un choix inchangé.

**Un sujet déjà produit** (par exemple le paquet Lingala de 210,6 s) garde ses
approbations, liées à sa version : ne les réécris pas et n'en transfère aucune à un
nouveau script.

### Le carrousel (2026-09-30)

Les cinq étapes, les dix trames (`references/narrative-patterns.md`, qui donne aussi la
lecture carrousel de chacune) et les fonctions B1–B6 sont **les mêmes** ; le carrousel
n'a ni skill, ni catalogue à lui. Ce qui change, parce que le lecteur tient le rythme,
revient en arrière, compare des cartes et peut partager une carte sans ses voisines :

- **Aucune durée.** Ni secondes, ni cible de trois minutes, ni reel d'accompagnement
  obligatoire. Le nombre de cartes est celui du **profil**, lu dans
  `social/harness/carousel-profiles/*.json` (`reading-story` 4–9, `reading-comparison`
  4–7, `reading-listening` 3–8) : ne le recopie jamais. Un argument qui dépasse le
  maximum resserre la question ou devient une série de pièces complètes, montrée
  comme telle ; ne réduis jamais la typographie, n'ôte jamais une incertitude, ne
  change jamais un profil en silence. `memoires-sonores` et `lectures-afrique` gardent
  leur propre route : ne les planifie pas ici.
- **Chaque proposition déclare sa route** : `series` (`null` = enquête sociale sans
  mythe, dite telle ; `name-origin` = le carrousel historique des noms, sans profil de
  lecture, avec son mythe posé en question — `myth.claimRef` —, sa clôture unique et son
  carnet), `profile`, `cardCount`, `countReason` (pourquoi ce nombre suffit) et
  `particularity` (ce que cette trame accentue, répète ou déplace). Une enquête sociale
  n'est jamais un moyen de sortir un épisode d'une série existante.
- **La carte d'une proposition** ajoute aux champs du reel : **Recherche**, **Exemple de
  référence** (réel avec localisateur, ou hypothétique), **Agencement** (l'aperçu carte
  par carte, chaque carte avec ses fonctions B1–B6), **Profil et nombre**,
  **Particularité** et **Statut**. Six fonctions ne sont pas six cartes : une carte peut
  en porter plusieurs, une fonction peut en occuper plusieurs (B2+B3 répétés par
  explication). Une réponse ou une orientation utile arrive normalement dès la carte 2 ;
  le payoff complet ne dépend jamais d'un second carrousel.
- **Après le choix, le tableau des cartes** (`--render plan`) : identifiant stable,
  fonctions, titre de travail, sa nature (`headingKind` : `question`, `label`,
  `qualified-claim` ou `claim`), message, preuves et limites, **qualification et source
  affichées sur la carte**, composition et intention visuelle, transition, acquis. Il
  se ferme sur le nombre de cartes expliqué, les phrases de réussite remplies et
  `unresolved` (ce qu'il reste à établir avant d'écrire).
- **Règles de carte.** Un titre factuel reste honnête isolé : `claim` est refusé sur une
  affirmation qualifiée, l'incertitude voyage avec l'affirmation et pas seulement dans la
  légende. Toute carte après la couverture porte une source courte identifiable.
  Aucune notation d'atelier (« B3 », « claim ID », « livre C manquant ») ne s'imprime
  sur une carte : ces manques restent dans le rapport. La couverture ouvre, `credits`
  ferme (et peut porter la synthèse sourcée plus tôt) ; une comparaison porte
  `relation: "comparaison"`, jamais la flèche de dérivation ; une frise exige 2 à 4 dates
  réellement étayées ; une carte géographique, un lieu ou un trajet étayé.
- **Ce que ce plan ne garantit pas.** Il ne règle ni le confort de lecture sur téléphone
  ni le cadrage : la typographie, le recadrage et les portes d'image restent ceux du
  moteur de rendu, à regarder d'abord à 320, 390 et 430 px. Ne dis jamais le contraire.
- **Au passage à `structure`**, le brief porte `edition.format: "carrousel"`,
  `carouselProfile` (le profil de la proposition, ou absent pour `name-origin`),
  `carouselSequence` (les identifiants des cartes du plan), et `edition.series` égal à
  la série de la proposition. Aucun `videoSequence` n'est requis. Les revues suivent les
  affirmations et les médias réels : la revue du nom reste due pour toute affirmation
  d'origine, même hors série ; le mythe seulement si `edition.myth` existe.
- **Un choix de reel n'approuve pas le carrousel.** Un « adapte cet angle en carrousel »
  suffit à l'autoriser : réutilise la recherche et le choix d'angle, montre le plan
  carrousel, sans redemander le même choix. Les approbations de texte ne passent que sur
  des entrées inchangées.

Mêmes commandes que pour le reel (`check-narrative-design.mjs`) ; `check-gabarit.mjs`
ne s'applique pas à un carrousel. La démonstration lisible :
`docs/design/gabarits-social/NARRATIVE-DESIGN-CAROUSEL-LINGALA-DEMO.md`.

## Mémoires sonores scope (2026-09-25)

Read `docs/design/gabarits-social/MEMOIRES-SONORES.md` first for this feature.
Use its musical question, six-card format, TikTok/Instagram scope and selected
opening subjects. A name-origin question, attested myth or corpus fiche is not
required. Research and source attribution remain required. Do not assign a
name typology, episode number or site route merely to fit the existing ledger;
the reference supplies its private-library registration and renderer profile.
Hand off `profil: memoires-sonores`, the subject research and the selected
recording to `structure`; the engine's `--brief memoires-sonores` command reads
the current instructions and supplies the empty six-card scaffold.

Première étape. Rien ne vient avant. `structure` vient après.

Tu produis **un rapport de sujet**, pas un contenu. Un rapport de sujet est le
document qui permet à une session `structure` d'écrire les cartes sans te
reposer une question.

## Entrée

Une intuition, un thème, une actualité — ou rien. Sans entrée, propose depuis le
corpus : lis `etat-du-pipeline.md`, qui vit dans la bibliothèque de production,
pour ne pas reproposer un sujet déjà en cours, puis cherche dans le corpus ce qui
est richement documenté et jamais publié.

Avant de proposer un sujet, lance
`node social/tools/etat-pipeline/bilan-sujets.mjs <sujet>` : il montre ce qui existe
déjà. Un sujet déjà couvert n'est pas exclu pour autant. Dis dans le rapport lequel
des trois gestes distincts tu proposes : **adapter** (même angle, autre format — les
sources sont déjà vérifiées, c'est un coût bas), **approfondir** (un angle plus
étroit ou plus profond) ou **republier** (même édition, nouvelle occurrence). Un angle
nouveau n'est exigé pour aucun des trois, et aucun format n'est le préalable d'un
autre.

**Une actualité fait passer un sujet devant la file.** Un événement qui remet un
nom au centre de l'attention (l'exemple de l'opérateur : Goma) est une raison
suffisante de le proposer maintenant plutôt qu'au tour du prochain sujet du
même pilier — dis-le dans le rapport, à la ligne « Réserves », plutôt que de le
glisser sans le nommer.

Deux types de contenu arrivent, **les anecdotes et les proverbes**. Ils ne sont
pas encore sur le site et la chaîne n'a pas leur gabarit : un sujet de ce type se
note comme idée, avec cette réserve écrite.

## Sortie

Un fichier unique : `$ETHNIAFRICA_SOCIAL_PROJECTS/_idees/{slug}.md`.

```markdown
# {titre de travail}

Écrit le {AAAA-MM-JJ}.

|               |                                                                                    |
| ------------- | ---------------------------------------------------------------------------------- |
| Famille       | {name-investigation · historical-portrait · circulation-connections · …}           |
| Angle         | {l'identifiant et la question bornée}                                              |
| Série         | {name-origin · memoires-sonores · aucune}                                          |
| Typologie     | {série name-origin seulement : peuple · pays · patronyme · lieu · langue · mot}    |
| Épisode       | {série name-origin seulement : le prochain numéro libre de cette typologie}        |
| Pilier        | {un seul}                                                                          |
| Formats visés | {carrousel · reel · texte · plusieurs — chacun est une édition indépendante}       |
| Réseaux       | {ceux que GABARITS-SOCIAL.md §1 bis donne à ces formats, et seulement ceux visés}  |
| Base          | {dated-evidence (rapport du AAAA-MM-JJ) · exploratory (pourquoi aucun comparable)} |

## La question

**Série name-origin :** « D'où vient le nom {X} ? » — la seule formule, jamais une
variante. {X} est le nom de travail du sujet dans sa Typologie ci-dessus. C'est aussi
le titre de tout reel de cette série, écrit dans `GABARITS-SOCIAL.md` §1 ter (« Le
titre d'un reel est une loi ») : le rapport le propose tel quel, et le carrousel a son
accroche propre, le mythe posé en question.

**Toute autre famille :** une question bornée, à laquelle les sources permettent de
répondre honnêtement, dans les mots du sujet. Elle n'a aucune formule imposée.

## L'angle

Une phrase. Ce que ce sujet dit que personne ne dit ailleurs.

## La promesse

Une phrase, au futur du lecteur : ce qu'il saura après.

## Le mythe

**Seulement si la pièce défait une idée reçue attestée** — série name-origin, ou toute
autre famille dont le sujet en corrige une. Sinon écris « sans objet : aucune idée
reçue attestée n'est corrigée » : c'est un verdict valable, et on n'invente pas un mythe
pour avoir quelque chose à défaire.

Quand il y en a une : les trois lignes et le verdict d'`ethniafrica-mythe` : le mythe
attesté, la correction sourcée, et « défait un mythe », « explique » ou « ne passe
pas ». **Le mythe attesté se pose comme une question, jamais comme une affirmation**
(même hedgée par « aurait ») — c'est ce que `structure` reformulera dans
`docs/productions/` pour la série name-origin, et le gate le refuse sinon
(`docs/productions/README.md`, « Never an assertion »).

## Ce que le sujet ne dira pas

La liste des choses que le corpus ne permet pas d'affirmer. C'est la section
la plus importante du rapport : elle empêche `structure` d'écrire une phrase
que les sources ne portent pas.

## Sources pressenties

Une ligne par source, avec son tier et pourquoi on pense qu'elle tient.
Aucune licence n'est vérifiée à cette étape — c'est le travail de `structure`.

## Recherche externe

Le prompt autonome décrit dans « La recherche externe » ci-dessous, prêt à
copier, rempli pour ce sujet précis.

## Réserves

Ce qui pourrait faire échouer le sujet.
```

## La recherche externe

Le gabarit de prompt ci-dessous est celui d'une **enquête sur un nom** (famille
`name-investigation`). Pour une autre famille, garde sa structure — ce que l'agent est,
la citation d'une source par affirmation, les concurrentes toutes rapportées, ce qui
n'est pas trouvé dit comme tel — et remplace le point 1 et le point 2 par la question
et la carte des affirmations du brief (le parcours d'une personne, la route d'un objet,
le passage d'un enregistrement…). Ne demande jamais à l'agent l'origine d'un nom que le
sujet n'interroge pas.

Chaque sujet appelle deux travaux : **la curation des données du site** (ce que
le corpus dit déjà de ce nom) et **un sourcing profond hors du corpus** (ce que
la recherche publiée dit de son origine). Le second, l'opérateur le confie à un
autre agent, connecté à Internet (Google, Grok ou équivalent) : produis donc, en
plus du rapport, **un prompt autonome qu'il envoie lui-même à cet agent**. Il
figure dans la section « Recherche externe » du rapport, et **s'affiche aussi en
clair dans la conversation**, pour qu'il puisse le copier sans ouvrir de
fichier.

**Le prompt tient debout seul** : l'agent qui le reçoit ne sait rien du projet,
du corpus ni de cette conversation. Remplace chaque `{…}` du gabarit ci-dessous
par les valeurs du sujet, sans rien laisser entre accolades :

> Tu es un agent de recherche connecté à Internet. Ta tâche : remonter l'origine
> du nom « {nom exact} » ({typologie : peuple, pays, patronyme, lieu ou langue}),
> le plus loin possible dans l'histoire, en citant une source (titre et URL)
> pour chaque affirmation.
>
> 1. Pars de la forme actuelle du nom, puis remonte vers chaque forme antérieure
>    attestée : quel nom portait-il avant, dans quelle langue, donné par qui,
>    vers quelle date. Distingue le nom que le peuple, le lieu ou la langue se
>    donne lui-même (endonyme) de celui que d'autres lui ont donné (exonyme).
> 2. Le contexte historique, politique, culturel ou socio-économique ne
>    t'intéresse que pour expliquer pourquoi le nom a changé, est resté ou a été
>    imposé. Ne le développe jamais pour lui-même : la réponse est l'origine du
>    nom, pas l'histoire qui l'entoure.
> 3. Quand plusieurs origines concurrentes existent, rapporte-les toutes avec
>    leur source, sans en privilégier une. Une source européenne, africaine,
>    orale ou non officielle vaut chacune d'être rapportée : nous assignons le
>    niveau de confiance ensuite, ce n'est pas à toi de trancher.
> 4. Rends une liste, du plus récent au plus ancien : {affirmation} — {source
>    et URL} — {ce que la source dit exactement, en une phrase}.
> 5. Dis explicitement ce que tu n'as pas trouvé plutôt que de le déduire, et ne
>    présente jamais une hypothèse comme un fait établi.

**Ce que l'agent te rendra n'entre pas dans le rapport tout seul.** L'opérateur
te le rapporte, et tu le passes au crible comme n'importe quelle source : un tier
par ligne (`official`, `referenced`, `unverified`), jamais un classement par
l'origine de la source. Tant qu'il ne l'a pas fait, la section « Sources
pressenties » reste ce qu'elle est — des pressentiments, pas des vérifications.

## Les règles

- **Dans une enquête sur un nom, le nom est le centre.** L'information principale
  d'un sujet de la famille `name-investigation` est l'origine du nom, remontée le plus
  haut et le plus longuement possible. Le contexte historique, politique, culturel ou
  socio-économique se dit pour comprendre ce qui a fait bouger le nom, et s'arrête là :
  un rapport dont la moitié parle d'histoire générale sans que le nom y change a perdu
  son sujet. Décidé par l'opérateur le 2026-09-20 pour les sujets de la série name-origin.
  Un portrait, une circulation, une écoute, une comparaison ou une biographie matérielle
  a son propre centre, dit par sa question ; on ne lui en impose pas un autre, mais si
  une affirmation sur l'origine d'un nom y figure, elle passe la revue onomastique.
- **Série name-origin : une seule typologie, parmi cinq : peuple, pays, patronyme,
  lieu, langue.** Un sujet de cette série répond toujours à « D'où vient le nom {X} ? »
  pour l'une de ces cinq — jamais une sixième. `lieu` ne nomme aucune table du corpus à part :
  un lieu se rattache toujours à un pays ou à un peuple existant.
  **Une seule exception, `mot`**, accordée par l'opérateur le 2026-09-21 pour
  « ethnie » : un mot du vocabulaire que le projet ne peut éviter et
  qu'aucune fiche ne porte. Elle ne s'étend pas d'elle-même — un nouveau `mot`
  demande l'accord de l'opérateur — et elle n'a pas de fiche à résoudre
  (`subjects[]` vide dans le carnet).
- **Série name-origin : l'épisode se lit dans `docs/productions/<typologie>/`, jamais
  deviné.**
  Le numéro le plus haut déjà présent dans ce dossier plus un — un sujet dont
  la typologie est neuve dans ce dossier commence à 1. `structure` écrira ce
  numéro dans le carnet ; le rapport ne fait que le proposer.
- **Chaque sujet présente le projet et invite à la contribution.** Dans la série
  name-origin il explique en plus pourquoi les appellations sont difficiles et pourquoi
  le mot « ethnie » ne convient pas ; une autre famille n'a pas à faire cette
  explication si son sujet ne la porte pas. Dis dans le rapport où cet élément prend
  place (une carte, la légende, le commentaire épinglé) — « dans chaque pièce » sans
  emplacement précis est comment il disparaît.
- **Un sujet, un pilier ; un angle par brief.** Un sujet peut porter plusieurs
  angles : chacun a son brief et ses éditions, sans que le premier ferme les autres.
  Le pilier reste unique par édition.
- **Les formats visés décident des réseaux, par la table de
  `docs/design/gabarits-social/GABARITS-SOCIAL.md` §1 bis.** Un sujet à un seul
  format ne part que sur les réseaux de sa colonne, et le rapport les nomme. X reçoit
  le reel — il n'a pas de carrousel —, donc un sujet produit en carrousel seul n'y va
  pas. Aucun format n'est obligatoire en complément de l'autre, et aucun réseau n'est
  obligatoire : le rapport nomme ceux qu'il vise, pas les six par défaut.
- **Lance `ethniafrica-mythe` avant d'écrire la promesse — quand la pièce défait une
  idée reçue.** Un sujet dont le verdict est « ne passe pas » meurt ici ; « explique »
  est un sujet valable, dit comme tel. Sans idée reçue en jeu, la revue est
  `not-applicable` et le rapport l'écrit avec sa raison.
- **Une accroche dont le corpus ne peut pas payer la dette n'est pas une
  accroche, c'est un appât.** Sur un atlas sourcé c'est aussi un mensonge sur le
  corpus. Si la promesse n'est pas tenable, le rapport le dit et le sujet meurt
  ici, où il ne coûte rien.
- **La rhétorique reste étiquetée rhétorique.** Une phrase d'emphase éditoriale
  ne devient jamais un constat historique en descendant la chaîne.
- **N'invente ni une source, ni une licence, ni un chiffre.** Un chiffre non
  vérifié se note comme non vérifié.
- **Un sujet centré sur qui a nommé un pays nomme ses acteurs.** Explorateurs,
  négociants, traités, ce qui en reste en toponymie : ils vivent dans le champ
  « qui l'a donnée » de chaque fiche du gabarit du carrousel
  (`ethniafrica-structure`, `.claude/skills/ethniafrica-structure/references/gabarit-carrousel-nom.md`). Décidé le
  2026-09-14 après un premier passage sur « qui-a-nomme-la-cote-divoire » qui
  avait ouvert sur le compte de peuples et laissé les acteurs de côté : l'opérateur
  a jugé la pièce vide de sens. La table par type de contenu de §7 ter et son
  sous-cas « qui a nommé le pays » sont supprimés (2026-09-21) ; le rapport de
  sujet renvoie au gabarit, il ne recopie rien.

## Ce que tu ne fais pas

Écrire les cartes. Choisir les images. Ouvrir un gabarit. Rendre quoi que ce soit.
Créer un dossier dans `02-Reseaux-sociaux/`.

## Pour finir

Recalcule l'état : `node social/tools/etat-pipeline/build-etat.mjs`.

Affiche le prompt de recherche externe **en clair dans la conversation**, pas
seulement dans le fichier, et dis à l'opérateur de l'envoyer à l'agent connecté
avant `structure` : ce que cet agent rapporte peut changer les sources, voire
l'angle.

Puis dis à l'opérateur, en une ligne, que le sujet est en ⚪️ Brouillon et que
l'étape suivante est `structure`. Ne la lance pas de toi-même.
