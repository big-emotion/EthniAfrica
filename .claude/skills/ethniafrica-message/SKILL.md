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

| Source                                           | Ce qu'elle porte                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `docs/editorial/purpose-doctrine.md`             | l'échange d'origine, mot pour mot, et les corrections qui font la doctrine         |
| `src/lib/i18n/copy/about.ts`                     | la déclaration publiée au lecteur (`purposeChapter`) — la formulation de référence |
| `docs/design/gabarits-social/GABARITS-SOCIAL.md` | §3 bis le bloc de paire, §7 ter la table des formulations, §9 bis la clôture       |

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
- **Les dates :** la conférence de Berlin, 1884 — jamais « Berlin » seul, la
  ville n'a rien tracé ; les indépendances, 1960. « Mille ans » est une
  approximation assumée, affichée comme une position : une production qui date
  un nom précis donne la date d'attestation de ce nom.

## Trois modes

| Mode                    | Entrée               | Ce qui est lu                                                                                                 | Où va le verdict                                                      |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **production** (défaut) | `<Sujet>`            | `cards.json`, `narration.fr.txt`, les descriptions de `post.md`, sous `$ETHNIAFRICA_SOCIAL_PROJECTS/<Sujet>/` | `message.md` dans ce dossier                                          |
| **page**                | une route du site    | la page rendue à 430 px, premier écran d'abord, puis la page entière                                          | la conversation ; un rapport daté seulement si l'opérateur le demande |
| **publié**              | rien, ou une période | les productions déjà en ligne                                                                                 | `docs/audience/message/message-audit-AAAA-MM-JJ.md`                   |

Le mode **page** juge le site comme une production : une fiche peuple est la
page où arrivent les clics des vidéos, et son premier écran doit tenir la
promesse que la vidéo a faite. Il ne réécrit ni le texte ni le design — ces
décisions vont à `/afrik-art-director` et `/ethniafrica-experience-optimizer`.

## La grille

Chaque critère se note **0, 1 ou 2**, avec la phrase citée qui justifie la note.

| #   | Critère                                                                                                                                                                                                                                                                              | Bloquant | Pour qui        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | --------------- |
| 1   | **Le cadre est dit dans la pièce elle-même.** Un peuple nommé, et ce que la frontière lui fait ou ce qui est plus vieux qu'elle. Un sujet qui n'est pas un peuple (un pays, une ville, un mot) relie son nom aux peuples qu'il désigne ; sans ce lien, 0.                            | oui      | le nouveau venu |
| 2   | **Le nom qu'il se donne, d'abord.** Dès qu'un peuple est nommé, la paire est visible tôt — carte 2 au plus tard en carrousel, première scène après l'accroche en vidéo, premier écran sur une page — dans l'ordre nom qu'il se donne → nom qu'on lui donne, sous la forme de §3 bis. | oui      | les deux        |
| 3   | **Le peuple est sujet de la phrase.** Le renversement d'agent de §7 ter ; le colonisateur n'est pas le sujet des phrases qui concluent.                                                                                                                                              | oui      | les deux        |
| 4   | **Aucune phrase refusée.** Ni les trois de la doctrine, ni « les frontières sont arbitraires ».                                                                                                                                                                                      | oui      | les deux        |
| 5   | **Les dates sont exactes.** « La conférence de Berlin », 1884, 1960 ; « mille ans » posé comme une position ; la date d'attestation propre au nom quand un nom est daté.                                                                                                             | oui      | les deux        |
| 6   | **La fin va vers ce qui est resté** — l'origine, les liens, les pays où le peuple vit aujourd'hui — pas vers la blessure.                                                                                                                                                            | non      | les deux        |
| 7   | **Une idée, une boucle fermée.** Une pièce qui ouvre trois sujets n'en fait passer aucun ; une question ouverte à l'accroche trouve sa réponse dans la pièce ou derrière son lien.                                                                                                   | non      | le nouveau venu |
| 8   | **La clôture constante.** La ligne de vision mot pour mot — « Nommer un peuple aussi facilement qu'un pays. » — et la clôture de §9 bis. Sur une page du site : le propos est atteignable (« Notre propos », la page About).                                                         | oui      | l'abonné        |

Les critères 1 et 7 servent le nouveau venu : il n'a que cette pièce. Le 2 et
le 8 servent l'abonné : c'est la répétition du même bloc, à la même place, dans
les mêmes mots, qui fait reconnaître la marque.

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
