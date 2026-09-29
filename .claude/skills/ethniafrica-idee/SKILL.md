---
name: ethniafrica-idee
description: Brainstormer un sujet de publication EthniAfrica et en sortir un rapport de sujet — angle, pilier, promesse en une phrase, ce que le sujet ne dira pas, sources pressenties, formats visés, réserves. Première étape de la chaîne idee → structure → produire. Utiliser pour « j'ai une idée de… », « on pourrait parler de… », « trouve-moi un sujet », « qu'est-ce qu'on pourrait publier sur… », ou /ethniafrica-idee. N'écrit aucune carte, ne choisit aucune image, ne touche à aucun gabarit.
---

# idee — brainstormer un sujet

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
