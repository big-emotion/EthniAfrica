---
name: ethniafrica-idee
description: Brainstormer un sujet de publication EthniAfrica et en sortir un rapport de sujet — angle, pilier, promesse en une phrase, ce que le sujet ne dira pas, sources pressenties, formats visés, réserves. Première étape de la chaîne idee → structure → produire. Utiliser pour « j'ai une idée de… », « on pourrait parler de… », « trouve-moi un sujet », « qu'est-ce qu'on pourrait publier sur… », ou /ethniafrica-idee. N'écrit aucune carte, ne choisit aucune image, ne touche à aucun gabarit.
---

# idee — brainstormer un sujet

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
`node social/tools/etat-pipeline/bilan-sujets.mjs <sujet>`. Un sujet déjà publié
dans le format visé ne se repropose pas sans un angle nouveau, dit dans le
rapport. Un sujet publié dans un seul format est une bonne idée à bas coût :
propose l'autre format, les sources sont déjà vérifiées.

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

|               |                                                                |
| ------------- | -------------------------------------------------------------- |
| Typologie     | {peuple · pays · patronyme · lieu · langue}                    |
| Épisode       | {le prochain numéro libre de cette typologie, voir ci-dessous} |
| Pilier        | {un seul}                                                      |
| Formats visés | {carrousel · reel · les deux}                                  |
| Réseaux       | {ceux que GABARITS-SOCIAL.md §1 bis donne à ces formats}       |

## La question

« D'où vient le nom {X} ? » — la seule formule, jamais une variante. {X} est le
nom de travail du sujet dans sa Typologie ci-dessus.

## L'angle

Une phrase. Ce que ce sujet dit que personne ne dit ailleurs.

## La promesse

Une phrase, au futur du lecteur : ce qu'il saura après.

## Le mythe

Les trois lignes et le verdict d'`ethniafrica-mythe` : le mythe attesté, la
correction sourcée, et « défait un mythe », « explique » ou « ne passe pas ».
**Le mythe attesté se pose comme une question, jamais comme une affirmation**
(même hedgée par « aurait ») — c'est ce que `structure` reformulera dans
`docs/productions/`, et le gate le refuse sinon (`docs/productions/README.md`,
« Never an assertion »).

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

- **Le nom est toujours le centre.** L'information principale d'un sujet est
  l'origine du nom, remontée le plus haut et le plus longuement possible. Le
  contexte historique, politique, culturel ou socio-économique se dit pour
  comprendre ce qui a fait bouger le nom, et s'arrête là : un rapport dont la
  moitié parle d'histoire générale sans que le nom y change a perdu son sujet.
  Décidé par l'opérateur le 2026-09-20, pour tous les sujets de la chaîne et
  pas seulement celui-ci.
- **Une seule typologie, parmi cinq : peuple, pays, patronyme, lieu, langue.**
  Un sujet répond toujours à « D'où vient le nom {X} ? » pour l'une de ces
  cinq — jamais une sixième. `lieu` ne nomme aucune table du corpus à part :
  un lieu se rattache toujours à un pays ou à un peuple existant.
- **L'épisode se lit dans `docs/productions/<typologie>/`, jamais deviné.**
  Le numéro le plus haut déjà présent dans ce dossier plus un — un sujet dont
  la typologie est neuve dans ce dossier commence à 1. `structure` écrira ce
  numéro dans le carnet ; le rapport ne fait que le proposer.
- **Chaque sujet présente le projet et invite à la contribution**, et explique
  pourquoi les appellations sont difficiles et pourquoi le mot « ethnie » ne
  convient pas. Dis dans le rapport où cet élément prend place (une carte, la
  légende, le commentaire épinglé) — « dans chaque pièce » sans emplacement
  précis est comment il disparaît.
- **Un sujet, un pilier, un angle.** Deux angles sont deux sujets.
- **Les formats visés décident des réseaux, par la table de
  `docs/design/gabarits-social/GABARITS-SOCIAL.md` §1 bis.** Un sujet qui vise
  les six réseaux vise les deux formats, plus le texte LinkedIn ; un sujet à un
  seul format ne part que sur les réseaux de sa colonne, et le rapport les
  nomme. X reçoit le reel — il n'a pas de carrousel —, donc un sujet produit en
  carrousel seul n'y va pas.
- **Lance `ethniafrica-mythe` avant d'écrire la promesse.** Un sujet dont le
  verdict est « ne passe pas » meurt ici ; « explique » est un sujet valable, dit
  comme tel.
- **Une accroche dont le corpus ne peut pas payer la dette n'est pas une
  accroche, c'est un appât.** Sur un atlas sourcé c'est aussi un mensonge sur le
  corpus. Si la promesse n'est pas tenable, le rapport le dit et le sujet meurt
  ici, où il ne coûte rien.
- **La rhétorique reste étiquetée rhétorique.** Une phrase d'emphase éditoriale
  ne devient jamais un constat historique en descendant la chaîne.
- **N'invente ni une source, ni une licence, ni un chiffre.** Un chiffre non
  vérifié se note comme non vérifié.
- **Un sujet centré sur qui a nommé un pays suit le sous-cas de
  `GABARITS-SOCIAL.md` §7 ter** (ligne « un pays et les peuples qui y vivent »),
  pas le patron par défaut de ce type : 80 % du rapport porte sur les acteurs
  nommés de l'histoire du nom (explorateurs, négociants, traités, ce qui en
  reste en toponymie), les peuples n'arrivent qu'en clôture, comme le
  renversement. Décidé le 2026-09-14 après un premier passage sur
  « qui-a-nomme-la-cote-divoire » qui avait ouvert sur le compte de peuples et
  laissé les acteurs de côté — l'opérateur a jugé la pièce vide de sens. Ne
  recopie pas cette règle ici épisode après épisode : le rapport de sujet la
  cite et renvoie à la source.

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
