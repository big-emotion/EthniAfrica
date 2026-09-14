---
name: ethniafrica-structure
description: Écrire le contenu d'une publication EthniAfrica à partir d'un rapport de sujet — cards.json au schéma de GABARITS-SOCIAL.md §10, script de narration, titre, descriptions par réseau, SOURCES.md avec licences vérifiées image par image, et liens UTM. Deuxième étape de la chaîne idee → structure → produire. Utiliser pour « écris les cartes », « rédige », « écris la narration », « prépare les sources », ou /ethniafrica-structure. Ne rend aucune image et ne choisit aucune disposition.
---

# structure — écrire le contenu

Deuxième étape. `idee` vient avant, `produire` vient après.

Si aucun rapport de sujet n'existe dans `$ETHNIAFRICA_SOCIAL_PROJECTS/_idees/`, dis-le et
propose de lancer `idee`. Ne saute pas l'étape.

## Entrée

Le rapport de sujet écrit par `idee`.

## Sorties

Dans `$ETHNIAFRICA_SOCIAL_PROJECTS/{Sujet}/` :

| Fichier            | Ce qu'il porte                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| `cards.json`       | le schéma de `docs/design/gabarits-social/GABARITS-SOCIAL.md` §10, sans écart  |
| `narration.fr.txt` | le script, si le sujet vise un reel                                            |
| `SOURCES.md`       | une entrée par image : auteur, dépôt, URL, licence lue                         |
| `post.md`          | titre, descriptions par réseau, commentaire à épingler, story, liens UTM, état |

## La règle qui prime

**Chaque affirmation porte son ancrage. Une licence non lue bloque la carte.**

« Non lue » veut dire : tu n'as pas ouvert la page du dépôt et vu la mention de
licence de tes propres yeux. Une licence supposée d'après le nom du fichier, la
réputation du dépôt ou une autre carte de la même série n'est pas une licence
lue. Dans le doute, la carte ne sort pas — elle change d'image.

`SOURCES.md` porte, pour chaque image, l'URL exacte où la licence a été lue.

## Le schéma, sans écart

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

- **`pivot` est obligatoire sur toute scène vidéo.** C'est le mot que la scène
  retourne, celui qui passe en accent dans la plaque de sous-titre — **un seul**.
  Le moteur ne le déduit jamais : aucune règle ne dit quel mot d'une phrase
  porte son basculement. `null` est une réponse valide et veut dire « aucun
  accent sur cette scène », pas « à décider plus tard ».
- `coupe` reste `null`. Ne force les retours à la ligne d'un titre que là où la
  coupe **porte du sens** — une énumération dont les groupes ne doivent pas se
  mélanger. Une coupe posée pour l'esthétique se périme au premier changement de
  format.
- `licence_sortie` n'est pas recopiée d'une carte : c'est la licence la plus
  contraignante du lot, et `produire` la recalcule. Écris ce que tu crois, elle
  sera vérifiée.

## La clôture, et la fin parlée

Le titre et le corps de la clôture **varient avec le type de contenu** : ils
sont fixes dans un type — c'est la signature — et changent d'un type à l'autre.
Seule la ligne de vision est la même partout. Ils se prennent **dans la table
par type de contenu de §7 ter** (`docs/design/gabarits-social/GABARITS-SOCIAL.md`),
mot pour mot et en texte brut, au moment d'écrire : `cards.json` ne porte jamais
`**`, le moteur passe lui-même le dernier mot du titre de clôture en accent. Ce skill n'en garde aucune copie : une
deuxième copie de la doctrine est celle qui dérive.

Un lot dont le type n'a pas de ligne dans la table, ou dont la case est encore
marquée « à fixer » ou « à valider », s'arrête et le dit. Une clôture ne
s'invente pas dans une carte.

La carte de clôture porte :

- `titre` — le titre de clôture du type ;
- `corps` — le corps de clôture du type, c'est-à-dire la seconde moitié du
  renversement. Ce n'est plus une datation ;
- `source` — la ligne de vision de §7 ter ;
- `pivot` — le membre de phrase que la plaque de vision passe en accent ;
- `appel` — `{n} peuples · ethniafrica.com`.

Le compte de `appel` se **mesure sur le corpus**, il ne se recopie ni d'une
vidéo précédente ni d'un exemple du gabarit.

**Aucune clôture n'écrit « Berlin » comme celui qui a tracé les lignes, ni
« mille ans » comme un fait**, tant que la session de doctrine n'a pas tranché
(§7 ter, audit du message du 2026-09-13, constat 9).

**Le dernier paragraphe de `narration.fr.txt` dit la doctrine, pas une adresse**,
et il est court : le renversement du type, son titre puis son corps, et ensuite
la sortie. Rien d'autre. Pour un lot sur un peuple réparti sur plusieurs pays :

> Ce peuple n'a pas été divisé. C'est la carte qui a été dessinée par-dessus.
> Retrouvez l'histoire du nom des peuples sur EthniAfrica. Et bientôt, celle des lieux.

La vision est **écrite sur la carte**, mot pour mot : la dire aussi à la voix
publie la même phrase deux fois et immobilise l'image le temps de le faire.
Mesuré sur l'ancienne clôture : quatre temps parlés tenaient la carte 21,4 s,
deux temps la tenaient 7,2 s. Le montage contrôle ce paragraphe contre les mots
de la carte et le remarque quand il dérive.

**Un paragraphe de narration est une scène.** Le nombre de blocs séparés d'une
ligne vide doit égaler le nombre de cartes, sinon le montage ne peut pas caler
les scènes et le dit.

## Le registre

- Les trois champs publiés verbatim au lecteur ne portent **aucune mention
  interne** : ni « à nommer », ni « à confirmer », ni « à compléter ». Ce sont
  des messages à l'opérateur, et ils bloquent la publication au lieu de
  s'imprimer.
- Le crédit nomme **le document réellement affiché sur la carte**, pas la série
  dont il provient ni la campagne qui l'héberge.

Trois guides restent dans la bibliothèque de production, avec les sujets qu'ils
servent. Ils portent de la doctrine éditoriale datée, pas du code :

- Registre de langue : `plain-language-doctrine-2026-09-09.md`.
- Descriptions par réseau : `description-template-2026-09-09.md`.
- Sourcing et personnes reconnaissables : `sourcing-et-licences-2026-09-07.md`.

## Le post.md, réseau par réseau

Le gabarit des descriptions fait foi. Ces règles-ci sont celles qui se perdent
quand on ne l'ouvre pas.

- **TikTok parle au « tu », en phrases courtes.** Une idée par phrase :
  l'accroche, deux à quatre phrases de preuve, **la ligne source avec son
  auteur, toujours**, une ligne qui demande un commentaire — jamais un tag, un
  like ou un partage —, « lien en bio », quatre à six hashtags. Instagram,
  Facebook et YouTube restent au « vous », LinkedIn dans son registre complet.
- **Sous TikTok, `post.md` porte un « Commentaire à épingler ».** Une question au
  « tu », liée au sujet, à laquelle n'importe qui sait répondre depuis sa propre
  vie (« Quel est ton peuple ? »). Ni la copie de la dernière ligne de la
  description, ni un lien. Un post TikTok sans elle n'est pas prêt.
- **Sous Instagram, `post.md` porte la story : « Story — question » et « Story —
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

1. **Affiche le texte complet dans la conversation**, pas un lien vers le
   fichier : le `narration.fr.txt` scène par scène (chaque paragraphe
   identifié à sa carte), puis chaque `titre`/`corps`/`source` de
   `cards.json` (et de `cartes.json` s'il existe), dans l'ordre du rang.
   Un opérateur qui doit ouvrir un fichier pour vérifier n'a pas reçu la
   validation qu'on lui doit.
2. **Demande la validation explicitement** — pas « dis-moi si ça te va »
   noyé dans un paragraphe, une question qui appelle une réponse claire.
3. **N'écris `post.md`, ne le passe pas en 🟡, et ne dis pas que l'étape
   suivante est `produire`, avant d'avoir reçu cette validation.** Si
   l'opérateur corrige, réécris et raffiche — la porte ne s'ouvre qu'une
   fois, sur le texte qu'il a réellement vu.

Une fois validé, pose dans `post.md` :

```markdown
**Texte validé** : oui, le AAAA-MM-JJ, par l'opérateur.
```

`produire` refuse de rendre quoi que ce soit — même une épreuve — tant que
cette ligne est absente ou plus ancienne que `cards.json`, `cartes.json` ou
`narration.fr.txt`. Une réécriture après validation efface la ligne : le
texte doit repasser par cette porte, pas seulement par le rendu.

## Ce que tu ne fais pas

Rendre les images. Choisir les dispositions. Ouvrir `ethni_carrousel2.py`,
`ethni_compose.py` ou `ethni_montage.py`. Décider une couleur, une taille ou une marge — elles sont dans
`docs/design/gabarits-social/GABARITS-SOCIAL.md` et dans `docs/design/gabarits-social/tokens/`, et nulle part
ailleurs.

## Pour finir

Affiche le texte et obtiens la validation (voir ci-dessus). Une fois validé,
passe le sujet en **🟡 En traitement** dans l'en-tête de son `post.md`, pose la
ligne **Texte validé**, recalcule l'état
(`node social/tools/etat-pipeline/build-etat.mjs`), et dis en une ligne que
l'étape suivante est `produire`, qui lance d'abord l'audit du message
(`ethniafrica-message`). Ne la lance pas de toi-même.
