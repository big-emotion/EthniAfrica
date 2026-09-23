---
name: ethniafrica-message
description: Auditer si une production EthniAfrica — carrousel, vidéo, ou page du site — fait passer le message de l'atlas à quelqu'un qui ne connaît pas le compte comme à un abonné. Note la production sur une grille (la question de l'accroche reçoit sa réponse ; le nom qu'il se donne d'abord ; ce qui est resté ; des dates exactes ; aucun groupe rendu plus chez lui qu'un autre), écrit le verdict dans message.md et propose les réécritures. Aucune phrase de doctrine n'est exigée. Porte de la chaîne idee → structure → produire, lancée par produire avant tout rendu. Utiliser pour « est-ce que le message passe », « audit du message », « cette page porte-t-elle le propos », ou /ethniafrica-message. Ne réécrit aucun fichier, ne rend rien, ne publie rien.
---

# message — le message passe-t-il ?

Une seule question : **quelqu'un qui voit cette production pour la première
fois repart-il avec le message, et un abonné le reconnaît-il ?**

Ce n'est pas la question des vues. Mesuré le 2026-09-13 : les vidéos les plus
vues parlaient du nom d'un pays et portaient à peine le message, les deux
productions qui le portaient le mieux avaient à peine été vues. Les réseaux
montrent presque tout à des gens qui ne suivent pas le compte : chaque
production est une première rencontre, et elle doit redonner le cadre elle-même.

## Ce que la grille lit, relu à chaque passage

Ne note jamais de mémoire. Ouvre les sources avant chaque audit :

| Source                                                                     | Ce qu'elle porte                                                                                      |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `docs/design/gabarits-social/GABARITS-SOCIAL.md`                           | §3 bis le bloc de paire, §7 ter le gabarit du carrousel et la clôture unique, §9 bis la clôture vidéo |
| `.claude/skills/ethniafrica-structure/references/gabarit-carrousel-nom.md` | le gabarit de narration du carrousel : l'ordre des cartes, la fiche d'une appellation, la morale      |
| `docs/editorial/purpose-doctrine.md`                                       | les corrections qui fondent les phrases refusées (critère 4) et les dates (critère 5)                 |
| `src/lib/i18n/copy/doctrine.ts`                                            | la méthode publiée au lecteur, dont les quatre phrases refusées (retirées d'À propos le 2026-09-22)   |

**Aucune phrase de doctrine n'est exigée.** Une production qui n'écrit pas « Ce
peuple n'a pas été divisé » n'a pas 0 pour autant, et ne sort pas en épreuve pour
cette raison (décidé par l'opérateur le 2026-09-21). Ce que la grille attend, en
bref — la source l'emporte si elle a changé :

- **La pièce répond à sa question d'accroche**, sans jugement.
- **Pour un peuple : il porte d'abord le nom qu'il se donne. Celui que les autres
  lui donnent vient après.**
- **Ce qui est resté, pas ce qui a été pris.** Le registre de la réparation garde
  le colonisateur sujet du verbe.
- **Trois phrases qu'on n'écrit pas** : « Avant, on vivait en accord avec le
  continent », « Les frontières sont arbitraires », « Renouer avec le passé ».
- **Les dates :** plus de « Berlin, 1884 » nulle part, dans aucune production —
  décidé par l'opérateur le 2026-09-14, qui tranche le point resté ouvert
  depuis le constat 9 de l'audit du message du 2026-09-13. La conférence a fixé
  des règles pour revendiquer un territoire, elle n'a tracé presque aucune
  ligne elle-même ; la citer comme la date d'origine des frontières répète
  l'erreur déjà relevée. La formule qui tient est celle de la doctrine :
  « la plupart des frontières ont moins de cent quarante ans » — jamais un lieu
  et une date uniques. « Mille ans » pour les noms reste une position, non une
  mesure datée : voir `docs/editorial/purpose-doctrine.md`. Une production qui
  date un nom précis donne la date d'attestation de ce nom, pas « mille ans ».

## Trois modes

| Mode                    | Entrée               | Ce qui est lu                                                                                                                                                                   | Où va le verdict                                                      |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **production** (défaut) | `<Sujet>`            | `cards.json`, `narration.fr.txt` sous `$ETHNIAFRICA_SOCIAL_PROJECTS/<Sujet>/`, et les légendes de `_legendes/<id>.md` (ou de `post.md` pour un sujet écrit avant le 2026-09-14) | `message.md` dans ce dossier                                          |
| **page**                | une route du site    | la page rendue à 430 px, premier écran d'abord, puis la page entière                                                                                                            | la conversation ; un rapport daté seulement si l'opérateur le demande |
| **publié**              | rien, ou une période | les productions déjà en ligne                                                                                                                                                   | `docs/audience/message/message-audit-AAAA-MM-JJ.md`                   |

Le mode **page** juge le site comme une production : une fiche peuple est la
page où arrivent les clics des vidéos, et son premier écran doit tenir la
promesse que la vidéo a faite. Il ne réécrit ni le texte ni le design — ces
décisions vont à `/afrik-art-director` et `/ethniafrica-experience-optimizer`.

## La grille

Chaque critère se note **0, 1 ou 2**, avec la phrase citée qui justifie la note.

| #   | Critère                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Bloquant | Pour qui        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| 1   | **Le cadre est dit dans la pièce elle-même.** La question de l'accroche reçoit sa réponse dans la pièce, et la pièce dit qu'un nom porte plusieurs appellations et laquelle est celle que le sujet se donne — ou, quand les sources ne l'établissent pas avec certitude, le dit honnêtement. Voir « Les critères 1 et 2, lus selon la certitude de l'endonyme » ci-dessous.                                                                                                                                                                                                                                                                 | oui      | le nouveau venu |
| 2   | **Le nom qu'il se donne, d'abord — ou l'absence de certitude, dite d'abord.** Dès qu'un peuple est le sujet déclaré du lot, son nom propre ouvre l'inventaire et sa fiche vient la première — en carrousel ; première scène après l'accroche en vidéo ; premier écran sur une page — puis les noms qu'on lui donne, chacun avec son auteur. Ne s'applique pas à un peuple cité en passant dans un lot d'un autre sujet, voir « Le critère 2, lu par sujet déclaré » ci-dessous ; ne se force pas non plus sur un sujet dont le degré de certitude est autre, voir « Les critères 1 et 2, lus selon la certitude de l'endonyme » ci-dessous. | oui      | les deux        |
| 3   | **Le peuple est sujet de la phrase.** Ni le colonisateur ni l'administration ne sont le sujet des phrases qui concluent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | oui      | les deux        |
| 4   | **Aucune phrase refusée.** Ni les trois de la doctrine, ni « les frontières sont arbitraires ».                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | oui      | les deux        |
| 5   | **Les dates sont exactes, et aucune ne nomme Berlin.** « Moins de cent quarante ans » pour les frontières ; la date d'attestation propre au nom quand un nom est daté. Une clôture qui cite « Berlin » ou « 1884 », qui en fait l'auteur des lignes, ou qui pose « mille ans » comme un fait daté : 0.                                                                                                                                                                                                                                                                                                                                      | oui      | les deux        |
| 6   | **La fin va vers ce qui est resté** — l'origine, les liens, les pays où le peuple vit aujourd'hui — pas vers la blessure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | non      | les deux        |
| 7   | **Une idée, une boucle fermée.** Une pièce qui ouvre trois sujets n'en fait passer aucun ; une question ouverte à l'accroche trouve sa réponse dans la pièce ou derrière son lien.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | non      | le nouveau venu |
| 8   | **La clôture.** Carrousel et reel : la clôture unique de §7 ter, mot pour mot — « Notre objectif : raconter l'origine des noms, avec des sources. Vous avez une histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica. » Sur une page du site : le propos est atteignable (« Notre propos », la page About).                                                                                                                                                                                                                                                                                                                | oui      | l'abonné        |

| 9 | **Aucun groupe n'est rendu plus chez lui qu'un autre.** Ni en le disant, ni en le laissant entendre. Nommer les peuples qui sont « entiers », « chez eux », « là depuis toujours », « les premiers » fabrique un dehors pour tous ceux qu'on ne nomme pas. La mesure se publie ; le classement, jamais. Un lot qui hiérarchise l'appartenance, même par omission : 0. | oui | les deux |

Les critères 1 et 7 servent le nouveau venu : il n'a que cette pièce. Le 2 et
le 8 servent l'abonné : c'est la répétition du même bloc, à la même place, dans
les mêmes mots, qui fait reconnaître la marque. Le 9 sert tout le monde, et il
sert d'abord le compte.

### Les critères 3 et 8, lus par format

Depuis le 2026-09-21, un **reel** et un **carrousel** se ferment sur la même
clôture, celle de §7 ter (« Le reel a un couple unique »), mot pour mot : l'objectif
du projet et l'invitation à partager. Elle n'est plus un renversement du type du
sujet. Une grille lue à l'ancienne noterait 0 chaque pièce qui la porte, et
`produire` ne rendrait plus que des épreuves.

- **Critère 8, carrousel et reel :** la clôture unique, mot pour mot. Un carrousel
  la porte en dernière carte, après la morale. Aucune phrase de doctrine, aucune
  ligne de vision n'est exigée : leur absence ne vaut pas 0.
- **Critère 8, reel sans carte de clôture :** rare, mais possible (§7 ter). Le critère
  ne juge alors que l'ouverture ; l'absence de clôture ne vaut pas 0.
- **Critère 3 :** la clôture n'est pas un renversement d'agent, donc le critère
  juge les phrases du corps de la pièce et de la morale : le peuple y reste le
  sujet de la phrase, et le colonisateur n'est jamais celui des phrases qui
  concluent.

### Un reel au gabarit : les critères 1, 2, 3 et le vocabulaire

Depuis le 2026-09-21, la narration d'un reel suit le gabarit de sa catégorie
(`.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md`). Lue avec
la grille ci-dessus seule, elle noterait 0 au critère 1 un pays, un lieu, une langue
ou un patronyme sans lien vers ses peuples : le reel resterait une épreuve, alors
qu'il suit exactement ce que l'opérateur a décidé.

- **Préalable, avant toute note.** Lance
  `node social/tools/narration/check-gabarit.mjs narration.fr.txt --type <typologie>`,
  la `typologie` étant celle du carnet de production. Un écart : ne note pas, renvoie
  à `structure`. Le gabarit est une porte de structure, pas un critère de la grille.
- **Critère 1.** _Décidé par l'opérateur le 2026-09-21._ Le mécanisme du type est
  celui du gabarit : le nom de l'intérieur contre les noms d'ailleurs, dit par
  l'ouverture fixe et refermé par le classement. Un reel au gabarit note 2 sans
  autre lien vers les peuples : le gabarit n'a pas de scène pour cela, et en ajouter
  une casserait « ni plus ni moins ».
- **Critère 2.** _Lecture proposée, à confirmer par l'opérateur._ L'ordre nom qu'il
  se donne → noms qu'on lui donne est tenu par construction : l'inventaire nomme le
  nom de l'intérieur en premier, et son bloc passe avant les autres. La forme
  visuelle de §3 bis n'est pas exigée d'un reel au gabarit.
- **Critère 3.** _Lecture proposée, à confirmer par l'opérateur._ Il juge le
  classement, la synthèse et la clôture, où le groupe reste le sujet. Dans les
  blocs, le sujet de la phrase est celui qui a nommé (« L'administration française
  crée ce nom… ») : c'est le contenu du gabarit, pas un défaut.
- **Critère 9, vigilance.** « Les autres viennent d'ailleurs » qualifie des **noms**.
  Une phrase qui l'appliquerait à des gens serait un 0.
- **Vocabulaire.** « Endonyme » et « exonyme » sont permis dans un reel au gabarit,
  définis dans la phrase d'ouverture (décidé par l'opérateur le 2026-09-21). Hors
  gabarit, ils restent des mots à signaler dans un texte au lecteur.

### Le critère 9, et pourquoi il a fallu une production ratée pour l'écrire

Ajouté le 2026-09-16, sur le carrousel `cote-divoire-le-renversement`, rendu et
passé en 🟢 avant que l'opérateur ne le rejette. Verdict de l'audit : **passe**,
huit critères sur huit tenus. La carte 8 disait :

> Trente et un ne vivent qu'ici : les Baoulé, les Bété, les Ébrié sont entiers,
> chez eux.

Aucun critère de la grille ne s'en émeut. La phrase est vraie, sourcée, le
peuple est sujet, la clôture est la bonne, aucune phrase refusée n'apparaît.
**Et elle fabrique une hiérarchie d'appartenance** : si ces trois-là sont
entiers et chez eux, les autres sont implicitement des invités. Mot de
l'opérateur : « ça va créer la division de l'attention ».

Le mécanisme, en clair : **sur un sujet ethnique, toute phrase qui distingue un
sous-ensemble de peuples par leur enracinement est lue comme un classement**,
quelle que soit l'intention. Le lecteur ne se demande pas si la mesure est
juste, il se demande de quel côté il est. C'est précisément l'attention que le
projet ne veut pas capter.

La règle qui en sort, dictée par l'opérateur : **on désescalade, et chaque
groupe est chez lui.** Une nation d'aujourd'hui rassemble des groupes venus de
plusieurs horizons — certains installés depuis très longtemps, d'autres arrivés
plus tard, tous chez eux. Une pièce qui compte peut dire ses chiffres ; elle les
dit pour tous, ou elle ne les dit pour personne.

Trois formes à refuser, toutes rencontrées dans la même production :

| La phrase                                                       | Ce qu'elle fait entendre                        | La forme qui tient                                                                                                                |
| --------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| « les Baoulé, les Bété, les Ébrié sont entiers, chez eux »      | les autres sont des morceaux, ou des invités    | « Les uns comme les autres sont chez eux. »                                                                                       |
| « certains sont là depuis très longtemps » suivi de trois noms  | les non-nommés sont arrivés après               | « À l'ouest, l'atlas date plus loin qu'ailleurs. Ailleurs, on date moins bien : ça ne veut pas dire qu'on est arrivé plus tard. » |
| « 31 sur 70 ne vivent qu'en Côte d'Ivoire » en chiffre d'accent | le chiffre qui compte est celui des vrais d'ici | « 70 peuples vivent en Côte d'Ivoire » — le compte du pays, pas celui d'un sous-groupe                                            |

**Une absence de date n'est jamais une preuve d'arrivée tardive.** Le corpus
date inégalement, et le dire fait partie du critère : sans cette phrase, le
silence de l'atlas se lit comme un jugement.

### Le critère 1, lu par le gabarit

Depuis le 2026-09-21, il n'y a plus de mécanisme propre à chaque type de contenu
: la pièce se lit contre le gabarit de son format. Pour un carrousel, c'est
`references/gabarit-carrousel-nom.md` du skill `structure` : la question de
l'accroche reçoit sa réponse à la deuxième carte, et la troisième dit qu'un nom
porte plusieurs appellations et cherche celle que le sujet se donne. Une pièce
qui force une phrase sur les frontières dans un sujet qui n'en parle pas invente
un fait plutôt que d'en manquer un.
Un reel se lit contre le gabarit de sa catégorie, décrit dans « Un reel au
gabarit » ci-dessous.

### Le critère 2, lu par sujet déclaré

Décidé par l'opérateur le 2026-09-14, sur l'audit `zokou-gbeuly` — premier
lot du type « un personnage historique » : **le critère 2 ne s'applique
qu'aux lots dont le sujet déclaré est un peuple**, pas à un lot d'un autre
type qui nomme un peuple en passant. `zokou-gbeuly` cite le peuple bété une
fois, pour situer qui était Zokou Gbeuly ; le sujet du lot est l'homme, pas
le nom du peuple bété, et aucune source lue ne documentait de toute façon une
dualité autonyme/exonyme pertinente pour ce nom précis. Exiger une paire
aurait forcé une seconde idée, hors sujet, dans un lot que le critère 7
tient déjà à une seule boucle.

Un critère qui mesure le nom d'un peuple ne s'applique qu'aux lots dont le
peuple est le sujet réel, jamais à un lot qui se contente d'en nommer un. Un lot
sur un personnage historique, une carte ou tout autre sujet sans peuple déclaré
passe donc le critère 2 par défaut (2, sans paire à produire).

### Les critères 1 et 2, lus selon la certitude de l'endonyme

Décidé par l'opérateur le 2026-09-23, sur l'audit `dioula-un-metier-une-langue-une-identite` :
**on ne pourra pas toujours affirmer l'endonyme et l'exonyme d'un peuple,
comme pour Fulbe et Peul — et certains peuples n'en sont un que dans l'œil
des étrangers.** Les critères 1 et 2 lisent depuis toujours « le nom qu'il
se donne, d'abord » comme s'il existait toujours un nom que le sujet se
donne, univoque, à mettre en tête. Ce n'est pas toujours le cas, et l'exiger
quand même revient à faire dire aux sources une certitude qu'elles n'ont
pas — exactement ce que la Source Tier Policy de `CLAUDE.md` interdit déjà
pour toute affirmation (« Assertion tracks certainty »), maintenant étendu à
cette grille plutôt que réservé au texte des fiches.

Trois degrés de certitude, pas un seul cas binaire :

1. **Établi.** Les sources s'accordent sur un nom que le sujet se donne, et
   les noms donnés par d'autres sont documentés avec leur auteur. Les
   critères se lisent comme écrit : le nom propre ouvre l'inventaire, les
   autres suivent, chacun attribué.
2. **Contesté mais existant** — le cas Fulbe/Peul. Une forme d'auto-désignation
   est documentée (Fulɓe, Pulaar) et une forme externe aussi (Peul, du
   wolof), mais leur rapport exact, leur ancienneté relative ou leur
   étendue réelle restent débattus. La pièce ouvre alors sur la forme
   dominante tout en disant l'incertitude qui reste — comme une source
   tiendrait une hypothèse pour probable sans la clore. Un critère qui
   noterait 0 pour ce doute assumé confondrait l'honnêteté sur l'incertitude
   avec son absence.
3. **Catégorie devenue identité** — le cas Dioula. Le nom ne vient pas
   d'abord d'un peuple qui se serait nommé lui-même : c'est un mot
   désignant d'abord un métier, un statut ou une fonction (« jula » =
   commerçant), devenu au fil du temps une identité pour certains de ceux
   qui l'exerçaient ou s'y reconnaissaient. La plupart des personnes ainsi
   nommées appartiennent en réalité, d'abord, à un autre clan, une autre
   famille ou un autre peuple — l'étiquette collective est en partie, ou en
   grande partie, un regard porté de l'extérieur ou une fonction devenue
   nom. Chercher ici « le » nom que « le » peuple se donne invente une
   auto-désignation univoque que les sources ne fournissent pas : voir
   `.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md`,
   « Ce que le gabarit ne couvre pas », qui nomme maintenant ce cas.

**Comment noter 1 et 2 dans les degrés 2 et 3 :** ils passent (2) quand la
pièce dit explicitement, dans son propre registre, ce que les sources
établissent réellement sur la nature du nom — une forme dominante avec son
incertitude assumée (degré 2), ou une catégorie devenue identité dont la
plupart des personnes nommées s'identifient d'abord ailleurs (degré 3) — sans
jamais le taire ni inventer une certitude plus grande que celle des sources.
Un 0 reste mérité si la pièce invente une paire endonyme/exonyme non
établie, ou si elle passe la question sous silence alors que le sujet déclaré
est un peuple. **Le degré se lit dans les sources vérifiées du sujet
(`SOURCES.md` ou équivalent), jamais deviné par la grille elle-même** — un
audit qui hésite entre deux degrés le dit et propose, il ne tranche pas à la
place de `afrik-curator` ou de l'opérateur.

### Ce qui a été retiré, le 2026-09-21

La table par type de contenu de §7 ter n'existe plus, et avec elle le sous-cas
« un lot centré sur qui a nommé le pays » qui en dépendait. Le gabarit du
carrousel demande, pour chaque appellation, **qui l'a donnée** : un acteur
historique se nomme dans cette fiche, pas dans une clôture propre au sujet.

### Le vocabulaire

Un même geste a eu au moins sept formulations dans les productions publiées. Un
lecteur qui rencontre la marque cinq fois ne doit pas apprendre cinq mots.

| Écrire                                                            | Signaler                                                                            | Pourquoi                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| « le nom qu'il se donne » / « le nom qu'ils se donnent »          | « auto-désignation », « appellation propre », « autonyme » dans un texte au lecteur | c'est la formulation que le site publie                 |
| « le nom qu'on lui donne », « le nom que les autres lui donnent » | « étiquette » sans dire qui l'a posée                                               | un exonyme a un auteur ; le taire efface le mécanisme   |
| « Le vrai nom », comme nom de pilier                              | « le vrai nom » dans la glose d'une paire                                           | l'autre nom n'est pas faux, il vient d'ailleurs         |
| l'orthographe du nom de la fiche                                  | trois graphies du même peuple dans une pièce                                        | Duala, Duàlá et Douala se sont croisés dans un seul lot |
| « endonyme » / « exonyme », dans un reel au gabarit               | les mêmes mots hors gabarit, ou sans la définition de l'ouverture                   | décidé par l'opérateur le 2026-09-21, pour la vidéo     |

### Une affirmation plate sur un nom contesté

Quand la pièce explique l'origine d'un nom, vérifie que le lecteur puisse deviner
si cette origine est établie ou débattue. Une explication contestée énoncée à plat
— « X est un mot portugais » là où le corpus porte trois récits concurrents — est
un défaut de message, pas seulement de sourcing : elle affirme au lecteur que la
question est close, et elle tranche presque toujours en faveur de la source que
l'archive a le mieux conservée, c'est-à-dire européenne.

**La question complète, et quoi faire quand un récit local contredit un récit
extérieur, vivent dans `ethniafrica-onomastique`, cinquième question.** La règle
de langue qui en découle est dans `CLAUDE.md`. Ce skill les signale ici et n'en
garde aucune copie : renvoie l'opérateur à `/ethniafrica-onomastique` dès qu'une
pièce explique un nom.

## Le verdict

- **passe** : aucun critère bloquant à 0.
- **ne passe pas** : au moins un critère bloquant à 0.

Pour chaque critère sous 2 : la phrase telle qu'elle est, pourquoi elle ne
porte pas le message — le mécanisme, en français simple —, et une réécriture
proposée. **Tu proposes, tu n'écris pas dans les fichiers** : la réécriture est
le travail de `structure`, et l'opérateur décide.

`message.md`, en mode production :

```markdown
# Audit du message — {Sujet}

Écrit le {AAAA-MM-JJ} · verdict : **passe** | **ne passe pas**

Lus : `cards.json`, `narration.fr.txt`, `post.md`

| #   | Critère | Note | Bloquant | La phrase | Pourquoi |
| --- | ------- | ---- | -------- | --------- | -------- |

## À réécrire

Une entrée par critère sous 2 : la phrase, le mécanisme, la réécriture proposée.
```

`produire` lit ce fichier : il franchit sa cinquième porte sur **passe**, à
condition que `message.md` soit plus récent que les trois fichiers lus.

## À venir : anecdotes et proverbes

Deux types de contenu vont arriver — les anecdotes et les proverbes. Ils ne sont
pas encore sur le site et la chaîne n'a pas leur gabarit. La grille s'y
appliquera : une anecdote ou un proverbe nomme encore son peuple par le nom
qu'il se donne, et sa langue ; les critères 1 et 8 seront précisés quand le
premier gabarit existera. D'ici là, dis-le plutôt que d'improviser une grille.

## Ce que tu ne fais pas

- Juger si une affirmation est vraie ou bien sourcée → `/afrik-curator`.
- Juger si l'accroche retient → `attention-architect`. Tu juges ce qui reste
  une fois la pièce vue, pas si elle est vue.
- Réécrire les cartes, rendre, publier, changer l'état d'un `post.md`.

## Pour finir

Dis en une ligne : le verdict, les critères bloquants sous 2 s'il y en a, et
l'étape suivante — `produire` si le message passe, `structure` s'il faut
réécrire.
