---
name: ethniafrica-reseaux-help
description: Dire à l'opérateur où il en est dans la production des réseaux sociaux EthniAfrica, et quel est le prochain geste. État des lieux de la bibliothèque — publié, validé, en atelier, brouillon —, bilan d'un sujet (ce qui a été fait, dans quel format, sur quels réseaux), doublons prêts à partir sur un sujet déjà publié dans le même format, formats jamais publiés. Utiliser pour « où j'en suis », « état des lieux », « qu'est-ce que je fais maintenant », « prochain move », « où en est le sujet X », « c'est déjà publié ? », « réseaux help », ou /ethniafrica-reseaux-help. Ne publie rien, ne déplace rien, n'édite aucun post.md.
---

# reseaux-help — où j'en suis, et quoi faire ensuite

Tu oriente, tu ne produis pas. À la fin, l'opérateur sait **où il en est**,
**quel est le prochain geste**, **quel skill le fait** — et tu proposes de le
lancer tout de suite quand un seul geste s'impose.

Toujours en français. Une recommandation, pas un menu. Montre seulement ce qui
compte maintenant : le catalogue entier n'aide personne à décider.

## La chaîne

| Étape                | Skill                             | Ce qu'elle laisse                                           | État atteint                |
| -------------------- | --------------------------------- | ----------------------------------------------------------- | --------------------------- |
| Mesurer              | `/ethniafrica-audience-audit`     | `docs/audience/audit-AAAA-MM-JJ.md` (site et réseaux)       | —                           |
| Décider quoi publier | `/ethniafrica-content-strategist` | un plan dans la conversation                                | —                           |
| Trouver le sujet     | `/ethniafrica-idee`               | `_idees/{slug}.md` dans l'atelier                           | ⚪️ Brouillon                |
| Écrire               | `/ethniafrica-structure`          | le texte dans l'atelier ; le post inscrit dans `Brouillon/` | 🟡 En traitement            |
| Vérifier le message  | `/ethniafrica-message`            | `message.md`                                                | —                           |
| Rendre               | `/ethniafrica-produire`           | une épreuve ou le bon à publier, dans le dossier du post    | 🟡 ou 🟢 Validé, en attente |
| Publier              | l'opérateur, à la main            | la section Diffusion du `post.md`                           | ✅ Publié                   |

`produire` lance `message` avant de rendre. Les deux premières étapes sont
facultatives ; un plan écrit sans la mesure est un plan écrit au goût — ou un
sujet explicitement **exploratoire**, dit tel. Chaque sujet passe par une des six
familles narratives (`idee` la choisit) et ne demande ni date, ni jour de la
semaine, ni format compagnon. « ✅ Publié » est une **occurrence** : elle ne ferme ni
le sujet, ni l'angle, ni l'édition.

**Les quatre états sont ceux de `social/tools/etat-pipeline/etat.mjs`, et il n'y
en a pas de cinquième.** « En atelier » est 🟡 En traitement : le post est inscrit
dans `Brouillon/`, le rendu n'est pas bon à publier.

**Un dossier d'atelier sans post dans la bibliothèque n'est compté nulle part.**
`build-etat.mjs` ne lit que les `post.md` de la bibliothèque. Quand
`bilan-sujets.mjs <sujet>` montre un dossier d'atelier et aucun post, le sujet a
sauté l'inscription de fin de `structure` : c'est ce geste-là qu'il faut
recommander, pas `produire`.

## Ce que tu lis — jamais ce dont tu te souviens

```
node social/tools/etat-pipeline/build-etat.mjs            # recalcule etat-du-pipeline.md, puis lis-le
node social/tools/etat-pipeline/bilan-sujets.mjs          # doublons et formats jamais publiés
node social/tools/etat-pipeline/bilan-sujets.mjs <sujet>  # un sujet : ses posts, l'atelier, les idées, message.md
```

Et la date du rapport le plus récent de `docs/audience/` : au-delà de 30 jours,
les skills qui planifient refusent de travailler dessus.

Si `ETHNIAFRICA_SOCIAL_POSTS` n'est pas posée, les deux outils le disent et
s'arrêtent. Répète-le à l'opérateur : une bibliothèque qu'on n'a pas trouvée
n'est pas une bibliothèque vide.

## Sans argument : l'état des lieux

Dans cet ordre, parce que c'est l'ordre dans lequel on agit :

1. **⚠ Les vrais doublons, et les couvertures répétées.** Deux choses différentes
   (`docs/design/gabarits-social/EDITORIAL-CONTRACT.md` §3).
   - **Un doublon**, c'est _une même publication de plateforme_ enregistrée deux fois
     (même réseau, même identifiant ou même lien) — ou une édition prête à repartir sur
     un réseau où _cette même édition_ est déjà en ligne, sans que l'opérateur l'ait
     décidé. Mesuré le 2026-09-13 : `build-etat` proposait de publier deux vidéos
     validées, Nzebi et le zombie, alors qu'une vidéo sur chacun des deux sujets était
     déjà sur cinq réseaux. Ne recommande pas de republier une édition **sans le
     dire** : nomme-la comme republication, et laisse l'opérateur décider.
   - **Une couverture répétée** — même sujet et même angle dans l'autre format, ou un
     angle plus profond, ou une nouvelle édition — est légitime et n'est jamais un
     doublon. Propose-la comme **adapter**, **approfondir** ou **republier**, trois gestes
     distincts, sans exiger un angle nouveau ni un second format.

   **L'outil compare le champ `Sujet` des `post.md`, et rien d'autre**, et il range
   encore une couverture répétée parmi les doublons tant que le registre n'a pas la
   règle de plateforme (S2). Lis son « doublon » comme un signal à vérifier, pas comme un
   verdict. Le zombie lui échappait : publié sous « Mot · zombie », validé sous
   « Peuple · Kongo ». Avant de recommander de publier un 🟢, relis les titres des posts
   publiés sur le même peuple ou le même mot.

2. **🟢 Prêt à publier**, hors doublons.
3. **🟡 En atelier**, avec ce qui bloque.
4. **⚪️ Brouillons.**
5. **Les sujets publiés dans un seul format.** Un sujet sorti en vidéo seulement
   peut sortir en carrousel, et l'inverse — c'est souvent le prochain geste le
   moins coûteux, puisque les sources sont déjà vérifiées. C'est une **option**, jamais
   un manque : l'absence de l'autre format n'est ni un défaut ni un blocage.
6. **L'âge du rapport d'audience.**

Puis **le prochain geste** : un seul, le skill qui le fait, et propose de le
lancer. For a video, recommend `/ethniafrica-production` in Claude or
`$ethniafrica-production` in Codex to coordinate the remaining stages in the
current session. A fresh session can resume from its private `production-state.md`;
it does not need to restart the upstream skills. See
`.claude/skills/ethniafrica-production/SKILL.md`. This help skill remains read-only.

## Avec un sujet : le bilan

`bilan-sujets.mjs <sujet>` donne chaque post du sujet — état, format, date,
réseaux —, ce qui est déjà publié, les doublons, le format jamais publié, le
dossier d'atelier, le rapport d'idée et l'audit du message s'ils existent.

**Complète, pour la série name-origin, avec
`docs/productions/<typologie>/<NNN>-<slug>.json`** (un sujet social seul n'y figure
pas : son registre est la bibliothèque, et l'absence d'un fichier ici n'est pas un
défaut), cherché par
`campaign` égal au sujet demandé (le même id que `--id` dans la bibliothèque) —
c'est là, et non dans `bilan-sujets.mjs`, que la question exacte de l'opérateur
se répond : ce sujet est-il sorti en carrousel sur tel réseau et en vidéo sur
tel autre, avec quel lien pour chacun. Un fichier trouvé sans réponse à
`bilan-sujets.mjs` (ou l'inverse) est un signe que l'un des deux registres a
manqué une écriture — dis-le plutôt que de trancher.

Raconte-le simplement : ce qui a été fait, ce qui est en cours, ce qui manque,
et le prochain geste. Si le sujet n'existe nulle part, dis-le et propose
`/ethniafrica-idee`.

## À venir : anecdotes et proverbes

Deux types de contenu arrivent : les **anecdotes** et les **proverbes**. Ils ne
sont pas encore sur le site et la chaîne n'a pas leur gabarit. Quand l'opérateur
en parle, dis-le, et note le sujet comme idée plutôt que de le pousser dans un
gabarit qui n'a pas été pensé pour lui.

## Ce que tu ne fais pas

Publier, programmer, déplacer un dossier, éditer un `post.md` ou changer un état.
Tu lis, tu résumes, tu recommandes.
