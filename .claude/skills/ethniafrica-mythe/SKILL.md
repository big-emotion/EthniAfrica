---
name: ethniafrica-mythe
description: Vérifier si un sujet EthniAfrica défait une idée reçue que son public tient réellement — diaspora d'abord — et si la correction est sourcée dans le corpus, sans remplacer un mythe par un autre. Trois lignes (le mythe, la correction, la preuve dans la pièce) et un verdict. Appelé par idee, structure et produire ; se lance aussi seul. Utiliser pour « quel mythe ce sujet défait », « déconstruction de mythe », « est-ce que ça casse une idée reçue », « idée reçue », ou /ethniafrica-mythe. N'écrit aucune carte, ne rend rien, ne publie rien.
---

# mythe — ce sujet défait-il une idée reçue ?

## Mémoires sonores scope (2026-09-25)

Read `docs/design/gabarits-social/MEMOIRES-SONORES.md` first for this feature.
A documented musical story may receive `explique` and remain a carousel;
an attested myth is optional. Evaluate any actual correction against its
identified sources, without requiring a nonexistent site fiche. Do not invent
a myth to admit the subject. Attribution and uncertainty remain mandatory.

Une question, trois lignes, un verdict. C'est tout le skill.

Il est appelé par `ethniafrica-idee` (le sujet), `ethniafrica-structure` (les
cartes) et `ethniafrica-produire` (avant le rendu). Lancé seul, il juge ce qu'on
lui donne : une idée, un `cards.json`, une page.

## Pourquoi il existe

Hypothèse de l'opérateur (2026-09-14) : les pièces qui marchent défont une
croyance, celles qui expliquent seulement marchent moins. Les chiffres de
`docs/audience/audit-2026-09-14.md` vont dans ce sens sans le prouver — aucune
comparaison n'a isolé ce seul facteur :

- en tête sur YouTube, « Ghana — l'empire qui n'était pas là » (1 508 vues,
  96,5 % regardé) et « Nigeria — Flora Shaw » (942, 73,6 %) ;
- sur TikTok, « Dioula n'est pas un nom de peuple » est le carrousel le plus vu
  (chiffre à relire, le studio affiche deux valeurs incompatibles) et « Peul,
  Fula, Fulani, Fellata » fait 1,9 K ;
- « Douala », vidéo, 591 vues et 57,4 % sur YouTube : dans la moyenne, pas en
  tête sur ce réseau.

Et le prix : le carrousel Dioula est **contesté en public sur sa correction**.
Une pièce qui défait un mythe attire la contradiction. Elle doit donc tenir.

## Les trois lignes

| Ligne                       | Ce qu'elle dit                                          | Ce qui la rend valide                                                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Le mythe**                | ce que le public visé croit, dans ses mots à lui        | **attesté** : où on l'a entendu (un commentaire publié, un usage courant, un manuel, un discours). Un mythe qu'on invente pour le défaire est un homme de paille — un appât.                                                              |
| **La correction**           | ce que l'atlas montre à la place, en une phrase         | une fiche sous `dataset/source/afrik/` et ses sources, chacune avec son tier. Wikipédia se lit d'abord, pour ce qu'il cite, jamais comme source. Une correction que le corpus ne porte pas va à `/afrik-curator` avant d'aller plus loin. |
| **La preuve dans la pièce** | la carte, la scène ou l'écran où la correction est dite | nommée par son rang. Une correction dite seulement dans la légende n'est pas dans la pièce.                                                                                                                                               |

## Le verdict

- **défait un mythe** — les trois lignes tiennent.
- **explique** — aucun mythe attesté ; la pièce apprend quelque chose (le nom
  qu'un peuple se donne, l'histoire d'un mot). Ce n'est pas un défaut : c'est
  dit, et rien ne bloque.
- **ne passe pas** — le mythe est inventé, la correction n'est pas sourcée, ou
  la correction fabrique un nouveau mythe (voir ci-dessous). Bloquant :
  `produire` rend en épreuve.

## Le piège : remplacer un mythe par un autre

Relis la correction contre ces cinq glissements avant de rendre le verdict.

1. **Qui a nommé ≠ qui a écrit, officialisé ou répandu le nom.** Exemple mesuré
   sur la Côte d'Ivoire : Bouët-Willaumez signe des traités sur la côte en
   1843–1844 et Port-Bouët porte son nom, mais _Costa do Marfim_ est portugais et
   bien antérieur. « Il a nommé la Côte d'Ivoire » serait un nouveau mythe.
2. **Une date ou un lieu unique pour un processus.** Berlin est déjà refusé par
   `GABARITS-SOCIAL.md` §7 ter ; la même prudence vaut pour tout « né en telle
   année ».
3. **Les mots qui effacent** : « tous », « jamais », « personne », « sans
   résistance ». Une généralisation défaite par un seul contre-exemple défait la
   pièce avec elle.
4. **La rhétorique devenue fait.** Une phrase d'emphase reste étiquetée comme
   telle.
5. **Corriger la carte, pas le lecteur.** On ne se moque pas de celui qui y
   croyait : il est le public, et souvent la personne dont on raconte le peuple.

## Où ça s'écrit

- Appelé par `idee` : la section « Le mythe » du rapport de sujet.
- Appelé par `structure` ou `produire` : `mythe.md`, à côté du `cards.json`,
  dans `$ETHNIAFRICA_SOCIAL_PROJECTS/<Sujet>/`. Un `mythe.md` plus ancien que
  `cards.json` ou `narration.fr.txt` ne juge plus le texte : relance.

```markdown
# Mythe — {Sujet}

Écrit le {AAAA-MM-JJ} · verdict : **défait un mythe** | **explique** | **ne passe pas**

| Ligne                   | Contenu | Appui                 |
| ----------------------- | ------- | --------------------- |
| Le mythe                |         | où il est attesté     |
| La correction           |         | fiche · source · tier |
| La preuve dans la pièce |         | carte / scène n°      |

## Glissements relevés

Un par ligne : la phrase, le glissement (1 à 5), la réécriture proposée.
```

## Ce que tu ne fais pas

- Juger si la doctrine passe → `ethniafrica-message`.
- Écrire ou sourcer une fiche → `/afrik-curator`.
- Juger si l'accroche retient → `attention-architect`.
- Réécrire les cartes, rendre, publier.

## Pour finir

Une ligne : le verdict, le mythe en quelques mots, et le glissement bloquant
s'il y en a un.
