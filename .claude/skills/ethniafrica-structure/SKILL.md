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

| Fichier            | Ce qu'il porte                                                                |
| ------------------ | ----------------------------------------------------------------------------- |
| `cards.json`       | le schéma de `docs/design/gabarits-social/GABARITS-SOCIAL.md` §10, sans écart |
| `narration.fr.txt` | le script, si le sujet vise un reel                                           |
| `SOURCES.md`       | une entrée par image : auteur, dépôt, URL, licence lue                        |
| `post.md`          | la note de travail : titre, intention, À savoir, ligne **Texte validé**       |

Dans `$ETHNIAFRICA_SOCIAL_PROJECTS/_legendes/` : **`<id>.md`**, les descriptions
par réseau, le commentaire à épingler et la story — un fichier par post.

Et dans la bibliothèque, **une fois le texte validé** (voir « Pour finir ») :
une entrée par post dans le registre de la bibliothèque, et son dossier
`$ETHNIAFRICA_SOCIAL_POSTS/Brouillon/<Prefixe-Sujet>/<id>/`, dont le `post.md`
est généré. Aucun dossier ne se crée ni ne se déplace à la main.

Et dans le dépôt, **au même moment** que l'entrée de la bibliothèque ci-dessus,
jamais dans un appel séparé qu'une session interrompue pourrait laisser à
moitié fait : `docs/productions/<typologie>/<NNN>-<slug>.json` — voir « Le
carnet de production » ci-dessous.

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
- **Une scène vidéo de plus de quatre secondes porte `images`, une liste**, et non
  `image` seul : aucune image ne tient plus de quatre secondes (§9 bis). Compte
  `ceil(durée / 4)` images par scène ; **la première présente le sujet de la scène**
  (un personnage, un lieu, un document). Chaque entrée a la forme d'`image`, et peut
  porter un `surtitre` affiché sans être dit — « Pendant ce temps, en France : … ».
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

## Le carnet de production

`docs/plans/production-history-plan.md` en porte le schéma complet et sa
justification ; cette section dit seulement ce que `structure` en fait.

Écris `docs/productions/<typologie>/<NNN>-<slug>.json`, `<typologie>` et
`<NNN>` recopiés tels que le rapport de sujet les a proposés (idée les lit
dans `docs/productions/<typologie>/` avant de proposer) :

```json
{
  "campaign": "<le même id que --id sur register-post.mjs>",
  "typologie": "<celle du rapport de sujet>",
  "episode": <celui du rapport de sujet>,
  "question": { "fr": "D'où vient le nom <X> ?" },
  "myth": { "fr": "<le mythe attesté, reformulé en question, jamais affirmé>" },
  "narrativePattern": "<la ligne de §7 ter que la clôture a prise>",
  "subjects": [
    { "kind": "people|country|family|language|patronyme", "id": "<PPL_…|ISO 3166-1|FLG_…|ISO 639-3|PAT_…>", "label": { "fr": "<nom affiché>" } }
  ],
  "sitePath": "<la route française de la fiche>",
  "publications": []
}
```

- **`subjects[]` et `sitePath` viennent de la même résolution corpus** que
  celle qui a choisi la fiche et les images du lot — ne les redérive pas
  séparément, c'est la même identité, écrite une seule fois.
- **`question.fr` et `myth.fr` doivent se terminer par « ? »** — jamais une
  affirmation, même hedgée par « aurait ». Le gate le refuse sinon.
- **`publications` part vide.** Ce carnet ne connaît un lien qu'une fois publié ;
  c'est `produire`, puis l'opérateur, qui les ajoutent au fur et à mesure —
  jamais `structure`, qui écrit avant tout rendu.
- **Valide avant de continuer** : `npm run check:production-ledger`. Une
  erreur ici (id de corpus inconnu, épisode déjà pris, `sitePath` qui ne
  correspond à aucun sujet, réseau/format que §1 bis n'autorise pas) se
  corrige avant d'aller plus loin — ne la reporte pas à `produire`.

## Un lot sur un pays : ce que l'audience doit repartir avec

Décidé par l'opérateur le 2026-09-16, sur un premier jet Guinée dont le flux
était juste et dont on ne retenait que trois choses : le nom vient de la mer, il
y a eu un État, un autre peuple était là aussi. C'est un décor, pas un savoir.
La trame de référence est `cote-divoire-le-renversement`, dont la carte 5 fait
à elle seule ce que ce jet entier avait manqué.

**Le nom remonte, puis les peuples remontent.** Le lot monte du nom actuel vers
le moment le plus ancien qui représente ce pays — puis, arrivé là, il redescend
sur les gens : d'où vient chacun de ceux qui l'habitent. Quatre choses doivent
être acquises à la fin, et elles se vérifient carte par carte.

### 1. Les interprétations du nom sont le contenu, pas une liste à expédier

Quand un nom a plusieurs origines proposées, **chacune se raconte** : de quelle
langue elle vient, ce que le mot y veut dire, qui la porte. « L'origine est
incertaine, voici trois pistes » en une carte ne laisse rien au lecteur — il
retient « on ne sait pas », ce qui est le contraire d'un savoir.

Une piste qui vaut d'être citée vaut d'être expliquée. Si le lot n'a pas la
place de le faire pour les trois, il en prend une ou deux et le dit, plutôt que
de toutes les mentionner sans en éclairer aucune. **Ce sont ces interprétations
que l'audience vient chercher** — pas l'arbitrage entre elles, qui d'ailleurs
ne nous appartient pas (`CLAUDE.md`, Source Tier Policy ; cinquième question
d'`ethniafrica-onomastique`).

### 2. D'où vient chaque peuple, nommé un par un

C'est la carte qui manque le plus souvent, et c'est celle qui porte le propos
du projet. Pas « les peuples ont migré » : **quel peuple, depuis où**.

> Les Akan, de l'est, du Ghana d'aujourd'hui. Les Mandé, du Manden, à cheval sur
> le Mali et la Guinée. Les Sénoufo, du Mali. Les Krou ont quitté la savane pour
> la forêt. — `cote-divoire-le-renversement`, carte 5

Un lot sur un pays répond à cette question pour **chacun de ses grands groupes**,
y compris le majoritaire — surtout le majoritaire, puisque c'est lui qu'on croit
autochtone. Une origine que le corpus ne porte pas se dit comme telle ; elle ne
se remplace pas par un silence qui laisse croire que ce peuple a toujours été là.

### 3. Pourquoi le nom est resté, et ce que celui qui l'a donné a laissé

Un pays qui garde son nom colonial, ou un nom venu du dehors, **a une raison de
l'avoir gardé**, et cette raison est un contenu. Le lot dit qui l'a donné, et ce
qu'il en reste aujourd'hui autrement que le nom : une ville, un quartier, une
langue officielle, une frontière, une institution. C'est la quatrième question
d'`ethniafrica-onomastique` appliquée au pays, et elle est rarement posée parce
que le nom semble aller de soi une fois son étymologie donnée.

Quand un pays s'est renommé, la question s'inverse et reste la même : qui a
choisi le nouveau nom, et qu'est-il resté de l'ancien.

### 4. L'endonyme, y compris dans les mots de la pièce

La règle « l'endonyme d'abord » (`docs/editorial/purpose-doctrine.md`, 2026-09-14)
ne vaut pas que pour les peuples dont le lot parle : **elle vaut pour les mots
que le lot emploie en passant.** Écrire « le berbère _akal n-iguinawen_ » dans une
pièce qui explique que les exonymes ont été imposés se contredit dans sa propre
phrase — c'est **amazigh**, pluriel **imazighen**. De même **Fulɓe** plutôt que
« peul » dès que la pièce a la place de le poser.

Relis le lot en cherchant les exonymes que tu as employés sans t'en apercevoir,
comme s'ils étaient des mots neutres : ce sont ceux-là qui passent.

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

- **Le texte parlé suit la règle de lecture simple, et un outil la vérifie.** Chaque
  phrase de `narration.fr.txt` commence par le sujet, puis le verbe, puis le
  complément — **sauf une question**. Phrases courtes (vingt mots au plus), voix
  active, aucune inversion (« écrit-elle », « dit le Trésor »), pas d'ordre de la
  forme « Aidez-nous » sans sujet. Un mot difficile (eugénisme, péjoratif) se
  explique dans la phrase qui suit. Le public est large et beaucoup ne parlent pas
  le français comme première langue : un texte simple se comprend mieux et se
  comprend moins de travers. Règle de l'opérateur du 2026-09-09
  (`plain-language-doctrine-2026-09-09.md`), rappelée le 2026-09-21 après une
  narration qui ne l'appliquait pas. **`node social/tools/narration/check-narration.mjs
<narration.fr.txt>` la vérifie** (ouvertures refusées, verbes de parole inversés,
  plus de vingt mots) ; il ne voit pas si une phrase est simple, cela reste à
  l'auteur et à la validation de l'opérateur.
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

## Les légendes, réseau par réseau

Elles s'écrivent dans `_legendes/<id>.md`, pas dans le `post.md` de l'atelier :
c'est ce fichier que le `post.md` de la bibliothèque recopie sous « Légendes par
réseau », et c'est ce `post.md`-là que l'opérateur ouvre pour publier.

Le gabarit des descriptions fait foi. Ces règles-ci sont celles qui se perdent
quand on ne l'ouvre pas.

- **Le titre de la carte d'ouverture est la miniature : huit mots au plus, la
  chute sur le dernier** (`GABARITS-SOCIAL.md` §1 ter). C'est la seule image que
  la plupart des gens verront ; le moteur ne la rapetisse plus pour faire tenir
  une phrase, il refuse et le dit. Le développement commence à la carte suivante.
- **Un post n'a de légende que pour les réseaux que `GABARITS-SOCIAL.md` §1 bis
  donne à son format.** Un réseau absent de sa ligne ne reçoit ni légende ni
  lien balisé. Le texte LinkedIn, sans média, s'écrit une fois par sujet : dans
  les légendes du reel quand il existe, sinon dans celles du carrousel.
- **Chaque titre de réseau porte son format entre parenthèses** — `## TikTok
(carrousel)`, `## TikTok (reel)`, `## LinkedIn (texte, sans média)`. Depuis la
  révision du 2026-09-21 de §1 bis, un réseau reçoit les deux formats (X n'a pas
  de carrousel) : un sujet sans mythe n'a pas de carrousel, donc pas de titre
  `(carrousel)`. Le moteur range les rendus par dossier-réseau, nommé d'après
  la colonne « Reçoit » de §1 bis, et c'est cette parenthèse qui dit à
  l'opérateur, sujet par sujet, quel dossier ouvrir sans redescendre à
  `GABARITS-SOCIAL.md` §1 bis pour le retrouver.
- **TikTok parle au « tu », en phrases courtes.** Une idée par phrase :
  l'accroche, deux à quatre phrases de preuve, **la ligne source avec son
  auteur, toujours**, une ligne qui demande un commentaire — jamais un tag, un
  like ou un partage —, « lien en bio », quatre à six hashtags. Instagram,
  Facebook et YouTube restent au « vous », LinkedIn dans son registre complet.
- **X s'écrit au « vous », sans hashtag, et le lien va dans le post.** Deux
  différences de plateforme, pas de goût : le lien y est cliquable — donc jamais
  « lien en bio » —, et les hashtags y sont pénalisés au lieu d'y aider. 280
  caractères par post, une URL comptant pour 23 quelle que soit sa longueur.
  **X est le seul réseau de la table où le texte nu est un format natif** : quand
  le sujet ne tient pas en un post, il s'écrit en fil, la vidéo jointe au premier
  et à lui seul, le lien balisé au dernier. Un fil n'est pas un post découpé —
  seul le premier paraît dans le fil d'actualité, les suivants sont derrière
  « Afficher ce fil », donc le premier porte l'accroche entière.
- **Sous TikTok, les légendes portent un « Commentaire à épingler ».** Une question au
  « tu », liée au sujet, à laquelle n'importe qui sait répondre depuis sa propre
  vie (« Quel est ton peuple ? »). Ni la copie de la dernière ligne de la
  description, ni un lien. Un post TikTok sans elle n'est pas prêt.
- **Sous Instagram, les légendes portent la story : « Story — question » et « Story —
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

0. **Lance `node social/tools/narration/check-narration.mjs` sur `narration.fr.txt`.**
   Un texte qui échoue se réécrit avant d'être affiché : l'opérateur n'a pas à
   valider une phrase que l'outil sait déjà refuser.
1. **Lance `ethniafrica-mythe` sur les cartes écrites**, et affiche son verdict
   avec le texte : la correction que le rapport de sujet avait vérifiée a pu
   glisser en devenant une carte.
2. **Affiche le texte complet dans la conversation**, pas un lien vers le
   fichier : le `narration.fr.txt` scène par scène (chaque paragraphe
   identifié à sa carte), puis chaque `titre`/`corps`/`source` de
   `cards.json` (et de `cartes.json` s'il existe), dans l'ordre du rang.
   Un opérateur qui doit ouvrir un fichier pour vérifier n'a pas reçu la
   validation qu'on lui doit.
3. **Demande la validation explicitement** — pas « dis-moi si ça te va »
   noyé dans un paragraphe, une question qui appelle une réponse claire.
4. **N'écris pas la ligne Texte validé, n'inscris pas le post dans la
   bibliothèque, et ne dis pas que l'étape suivante est `produire`, avant
   d'avoir reçu cette validation.** Si l'opérateur corrige, réécris et
   raffiche — la porte ne s'ouvre qu'une fois, sur le texte qu'il a réellement
   vu.

Une fois validé, pose dans le `post.md` de l'atelier :

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

Affiche le texte et obtiens la validation (voir ci-dessus). Une fois validé :

1. **Pose la ligne Texte validé** dans le `post.md` de l'atelier.
2. **Inscris chaque post dans la bibliothèque.** Sans cette entrée, le sujet
   reste dans l'atelier, où `build-etat.mjs` ne regarde pas : il n'existe pour
   aucun état du pipeline.

   ```
   node social/tools/library/register-post.mjs \
     --id <id> --dir <Prefixe-Sujet>/<id> \
     --title "<titre de la carte 1>" --subject "Peuple · <nom>" --pillar "<pilier>" \
     --status a-produire --copy _legendes/<id>.md \
     --link-path /fr/atlas/<…> --content carrousel      # ou video
   ```

   Lis la simulation, puis relance avec `--write`. L'outil crée le dossier du
   post dans `Brouillon/` et imprime les commandes suivantes, chemins compris.

   - **Un post par format.** Carrousel seul : `<id>` = la campagne. Reel et
     carrousel : le reel est `<campagne>`, le carrousel `<campagne>-carrousel`,
     comme `appolo-nzema`. Un post porte un seul jeu de liens balisés, et
     `bilan-sujets.mjs` repère les doublons format par format.
   - **`--status a-produire`**, parce que `build-index.mjs` l'écrit
     « ⚪️ À produire », qu'`etat.mjs` lit comme 🟡 En traitement : le texte est
     écrit, le rendu attendu. `brouillon` se lirait ⚪️ et `a-programmer` ne se
     lit pas du tout. Les deux restent dans `Brouillon/`.
   - **`--dir`** reprend le dossier de sujet existant s'il y en a un
     (`bilan-sujets.mjs <nom>` le montre), sinon un préfixe existant :
     `Pays-`, `Peuples-`, `Langues-`, `Familles-`, `Noms-`, `Villes-`,
     `Dossiers-`, `Continent-`.
   - **`--copy _legendes/<id>.md`**, jamais le `post.md` de l'atelier.
     `build-index.mjs` recopie le fichier nommé tel quel sous « Légendes par
     réseau » : pointé sur la note de travail, il collerait un second en-tête
     d'état, les notes internes et la ligne Texte validé dans le `post.md` de la
     bibliothèque — dont `build-etat.mjs` lit le premier marqueur et où il
     cherche les mentions internes.

3. **Écris le carnet de production** (voir « Le carnet de production »
   ci-dessus), `campaign` égal au `--id` juste posé, puis valide :
   `npm run check:production-ledger`. Une erreur bloque — corrige le fichier,
   ne la reporte pas à `produire`.
4. **Régénère les vues** : `node <00-Index>/build-index.mjs`, au chemin que
   l'outil a imprimé. C'est lui qui écrit le `post.md` du nouveau dossier ;
   `migrate-library.mjs --write` ne régénère rien quand il n'a rien déplacé. Un
   « Copie introuvable » dans ce `post.md` veut dire que `_legendes/<id>.md`
   n'est pas écrit.
5. **Recalcule l'état** (`node social/tools/etat-pipeline/build-etat.mjs`) et
   vérifie que le post y figure en 🟡.

Puis dis en une ligne que l'étape suivante est `produire`, qui lance d'abord
l'audit du message (`ethniafrica-message`). Ne la lance pas de toi-même.
