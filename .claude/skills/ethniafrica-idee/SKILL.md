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

## Réserves

Ce qui pourrait faire échouer le sujet.
```

## Les règles

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

Puis dis à l'opérateur, en une ligne, que le sujet est en ⚪️ Brouillon et que
l'étape suivante est `structure`. Ne la lance pas de toi-même.
