---
name: ethniafrica-message
description: Auditer si une production EthniAfrica — carrousel, vidéo, ou page du site — fait passer le message de l'atlas à quelqu'un qui ne connaît pas le compte comme à un abonné. Note la production sur une grille tirée de la doctrine publiée (le peuple n'a pas été divisé, la carte a été dessinée par-dessus ; le nom qu'il se donne d'abord ; ce qui est resté), écrit le verdict dans message.md et propose les réécritures. Porte de la chaîne idee → structure → produire, lancée par produire avant tout rendu. Utiliser pour « est-ce que le message passe », « audit du message », « vérifie la doctrine », « cette page porte-t-elle le propos », ou /ethniafrica-message. Ne réécrit aucun fichier, ne rend rien, ne publie rien.
---

# message — le message passe-t-il ?

Une seule question : **quelqu'un qui voit cette production pour la première
fois repart-il avec le message, et un abonné le reconnaît-il ?**

Ce n'est pas la question des vues. Mesuré le 2026-09-13 : les vidéos les plus
vues parlaient du nom d'un pays et portaient à peine le message, les deux
productions qui le portaient le mieux avaient à peine été vues. Les réseaux
montrent presque tout à des gens qui ne suivent pas le compte : chaque
production est une première rencontre, et elle doit redonner le cadre elle-même.

## La doctrine, relue à chaque passage

Ne note jamais de mémoire. Ouvre les trois sources avant chaque audit :

| Source                                           | Ce qu'elle porte                                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/editorial/purpose-doctrine.md`             | l'échange d'origine, mot pour mot, et les corrections qui font la doctrine                                                                |
| `src/lib/i18n/copy/about.ts`                     | la déclaration publiée au lecteur (`purposeChapter`) — la formulation de référence                                                        |
| `docs/design/gabarits-social/GABARITS-SOCIAL.md` | §3 bis le bloc de paire, §7 ter la table des formulations et la table par type de contenu (ouverture et clôture), §9 bis la clôture vidéo |

Ce que la doctrine dit, en bref — la source l'emporte si elle a changé depuis :

- **La thèse, présentée comme une position :** « Ce peuple n'a pas été divisé.
  C'est la carte qui a été dessinée par-dessus. »
- **Les noms sont plus vieux que les frontières.** Une frontière ne contient pas
  un peuple, elle le traverse.
- **L'ordre apparent est inversé** : les nations sont la couche récente, les
  peuples la couche continue. Chaque peuple a une histoire, et son nom la retrace.
- **Ce qui est resté, pas ce qui a été pris.** Le registre de la réparation garde
  le colonisateur sujet du verbe.
- **Pour un peuple : il porte d'abord le nom qu'il se donne. Celui que les autres
  lui donnent vient après.**
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

| #   | Critère                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Bloquant | Pour qui        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- |
| 1   | **Le cadre est dit dans la pièce elle-même.** Pour le type « un peuple réparti sur plusieurs pays » : un peuple nommé, et ce que la frontière lui fait ou ce qui est plus vieux qu'elle. Pour tout autre type que §7 ter reconnaît sous son propre mécanisme (§7 ter, « la table par type de contenu ») : ce mécanisme propre au type, pas la doctrine frontière/nom recopiée hors sujet — voir la note après cette grille. Un sujet qui n'est pas un peuple (un pays, une ville, un mot) relie son nom aux peuples qu'il désigne ; sans ce lien, 0. | oui      | le nouveau venu |
| 2   | **Le nom qu'il se donne, d'abord.** Dès qu'un peuple est le sujet déclaré du lot, la paire est visible tôt — carte 2 au plus tard en carrousel, première scène après l'accroche en vidéo, premier écran sur une page — dans l'ordre nom qu'il se donne → nom qu'on lui donne, sous la forme de §3 bis. **Sauf sous-cas « qui a nommé ce pays » — voir la note sous la grille — et ne s'applique pas à un peuple cité en passant dans un lot d'un autre sujet, voir « Le critère 2, lu par sujet déclaré » ci-dessous.**                              | oui      | les deux        |
| 3   | **Le peuple est sujet de la phrase.** Le renversement d'agent de §7 ter ; le colonisateur n'est pas le sujet des phrases qui concluent.                                                                                                                                                                                                                                                                                                                                                                                                              | oui      | les deux        |
| 4   | **Aucune phrase refusée.** Ni les trois de la doctrine, ni « les frontières sont arbitraires ».                                                                                                                                                                                                                                                                                                                                                                                                                                                      | oui      | les deux        |
| 5   | **Les dates sont exactes, et aucune ne nomme Berlin.** « Moins de cent quarante ans » pour les frontières ; la date d'attestation propre au nom quand un nom est daté. Une clôture qui cite « Berlin » ou « 1884 », qui en fait l'auteur des lignes, ou qui pose « mille ans » comme un fait daté : 0.                                                                                                                                                                                                                                               | oui      | les deux        |
| 6   | **La fin va vers ce qui est resté** — l'origine, les liens, les pays où le peuple vit aujourd'hui — pas vers la blessure.                                                                                                                                                                                                                                                                                                                                                                                                                            | non      | les deux        |
| 7   | **Une idée, une boucle fermée.** Une pièce qui ouvre trois sujets n'en fait passer aucun ; une question ouverte à l'accroche trouve sa réponse dans la pièce ou derrière son lien.                                                                                                                                                                                                                                                                                                                                                                   | non      | le nouveau venu |
| 8   | **La clôture de son type.** La ligne de vision mot pour mot — « Nommer un peuple aussi facilement qu'un pays. » — et le titre et le corps de clôture du type du lot, pris mot pour mot dans la table par type de contenu de §7 ter : un lot sur un pays ne se clôt pas sur « Ce peuple n'a pas été divisé ». Un type absent de la table : 0. Sur une page du site : le propos est atteignable (« Notre propos », la page About).                                                                                                                     | oui      | l'abonné        |

Les critères 1 et 7 servent le nouveau venu : il n'a que cette pièce. Le 2 et
le 8 servent l'abonné : c'est la répétition du même bloc, à la même place, dans
les mêmes mots, qui fait reconnaître la marque.

### Le critère 1, lu par type de contenu

Ajouté le 2026-09-14 (audit `adioukrou-generations`, opérateur) : ce critère
mesurait un seul mécanisme, frontière/nom, alors que §7 ter en reconnaît
plusieurs depuis la même session. Un sujet du type « un peuple réparti sur
plusieurs pays » continue de devoir dire ce que la frontière lui fait ou ce
qui est plus vieux qu'elle — c'est le mécanisme que ce type porte. Un sujet
d'un autre type dit **son** mécanisme, tel que §7 ter le nomme pour ce
type-là : pour « un système politique sans souverain unique », c'est l'écart
avec l'attente par défaut — un roi, un chef héréditaire, un État — pas une
phrase sur une frontière plaquée hors sujet. Une pièce qui forcerait la
phrase frontière/nom sur un sujet dont le type n'en porte pas invente un fait
plutôt que d'en manquer un ; le critère se lit donc **par le mécanisme que le
type du lot porte réellement**, jamais par un mécanisme par défaut.

Un type absent de §7 ter n'a pas de mécanisme défini : le critère 1 reste à 0
jusqu'à ce que §7 ter en porte un, exactement comme le critère 8.

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

C'est la même lecture que le critère 1 : un critère qui mesure un mécanisme
de peuple ne s'applique qu'aux types dont le peuple est le sujet réel, jamais
à un type qui se contente d'en nommer un. Un lot du type « un personnage
historique », « une projection, une carte » ou tout autre type sans peuple
pour sujet déclaré passe donc le critère 2 par défaut (2, sans paire à
produire), sauf s'il relève du sous-cas ci-dessous.

### Sous-cas du critère 2 : un lot centré sur qui a nommé le pays

Un lot dont le sujet déclaré est **qui a nommé ce pays** (pas un peuple — voir
`GABARITS-SOCIAL.md` §7 ter, sous-cas de la ligne « un pays et les peuples qui y
vivent ») lit le critère 2 **à la clôture, pas à la carte 2**. Décidé le
2026-09-14 après un premier passage sur « qui-a-nomme-la-cote-divoire » : une
version qui avançait la paire nom-qu'il-se-donne/nom-qu'on-lui-donne en carte 2
avait vidé le corps du lot de tout acteur historique nommé (Bouët-Willaumez,
Treich-Laplène, Binger n'existaient nulle part) — le critère 2 passait, mais la
pièce ne répondait plus à la question de son propre sujet.

Pour ce sous-cas :

- **Le critère 1 seul garantit le cadre pour le nouveau venu.** Le critère 2 se
  vérifie sur la clôture : la paire y apparaît comme le renversement (« voilà
  qui a nommé ce pays ; ce peuple, lui, portait déjà son propre nom »), pas
  comme l'ouverture.
- **80 % du corps répond à « qui, comment, ce qui en reste »** — des acteurs
  nommés, des traités, la toponymie qui en témoigne. Une pièce de ce sous-cas
  qui n'atteint ce budget que par du vocabulaire abstrait (« un décret », « les
  autorités ») sans jamais nommer qui a agi ne sert le critère 1 qu'en apparence
  : signale-le sous le critère 1, pas sous le 2.
- Ce sous-cas ne change rien aux critères 3 à 8 : le peuple reste sujet de la
  phrase de clôture, aucune phrase refusée n'apparaît, et ainsi de suite.

> > > > > > > origin/recette

### Le vocabulaire

Un même geste a eu au moins sept formulations dans les productions publiées. Un
lecteur qui rencontre la marque cinq fois ne doit pas apprendre cinq mots.

| Écrire                                                            | Signaler                                                                            | Pourquoi                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| « le nom qu'il se donne » / « le nom qu'ils se donnent »          | « auto-désignation », « appellation propre », « autonyme » dans un texte au lecteur | c'est la formulation que le site publie                 |
| « le nom qu'on lui donne », « le nom que les autres lui donnent » | « étiquette » sans dire qui l'a posée                                               | un exonyme a un auteur ; le taire efface le mécanisme   |
| « Le vrai nom », comme nom de pilier                              | « le vrai nom » dans la glose d'une paire                                           | l'autre nom n'est pas faux, il vient d'ailleurs         |
| l'orthographe du nom de la fiche                                  | trois graphies du même peuple dans une pièce                                        | Duala, Duàlá et Douala se sont croisés dans un seul lot |

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
