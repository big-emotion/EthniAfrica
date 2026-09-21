---
name: ethniafrica-produire
description: Rendre les carrousels et les reels EthniAfrica depuis un cards.json et un SOURCES.md validés, conformément à GABARITS-SOCIAL.md — dispositions A/B/C, résolution ≤ ×2, zone d'interface 9:16, licence de sortie calculée. Dernière étape de la chaîne idee → structure → produire ; rien ne vient après, la publication est un acte humain. Lance d'abord l'audit du message (ethniafrica-message). Utiliser pour « rends », « génère les images », « fais la vidéo », « sors le carrousel », ou /ethniafrica-produire. Rend toujours, en épreuve si les portes ne passent pas.
---

# produire — rendre carrousels et reels

Dernière étape de la chaîne. **Rien ne vient après.** La publication est un acte
humain : l'opérateur poste, puis renseigne la date et les réseaux dans la section
Diffusion du `post.md`, ce qui fait passer le sujet en ✅. Tu ne publies pas, tu
ne programmes pas, tu ne proposes pas de le faire.

Si `cards.json` ou `SOURCES.md` manquent, dis-le et propose `structure`. Ne saute
pas l'étape.

## La porte qui précède les cinq autres : le texte validé

Décidé le 2026-09-14, après qu'une vidéo a été rendue — deux fois — sur un
texte que l'opérateur n'avait jamais vu en entier avant de la regarder rendue.
**Si `post.md` ne porte pas la ligne `**Texte validé** : oui, le AAAA-MM-JJ,
par l'opérateur.`, ou si elle est plus ancienne que `cards.json`, `cartes.json`
ou `narration.fr.txt`, ne rends rien — ni épreuve, ni bon à publier.** Dis-le,
affiche le texte actuel toi-même si `structure` ne l'a pas fait, et attends la
validation avant de continuer. Cette porte est la seule exception à « tu rends
toujours » ci-dessous : elle protège un coût réel (la voix se paie en crédits)
et une lecture réelle (personne ne devrait découvrir un script en le voyant
monté).

## Tu rends toujours

Une épreuve se regarde, même imparfaite : c'est en la voyant qu'on décide. Ce qui
est verrouillé, ce n'est pas le rendu, c'est le passage en 🟢.

**Ne demande jamais l'autorisation de rendre.** Rends, dis dans quel dossier, et
dis pourquoi.

## Les deux sorties

| Sortie            | Dossier, dans le dossier du post                                    | Condition               | État atteint          |
| ----------------- | ------------------------------------------------------------------- | ----------------------- | --------------------- |
| **Épreuve**       | `_epreuves/`                                                        | toujours                | 🟡 En traitement      |
| **Bon à publier** | un dossier par format, nommé d'après ses réseaux (§1 bis), `video/` | les cinq portes passées | 🟢 Validé, en attente |

Le dossier du post est celui de la bibliothèque, pas celui de l'atelier — voir
« Où ça s'écrit ».

### Les cinq portes

1. Toute licence d'image est nommée, et la licence de sortie est calculée.
2. Chaque crédit nomme le document réellement affiché sur la carte.
3. Aucun champ imprimé ne contient de note interne (« à nommer », « à
   confirmer », « à compléter »).
4. Aucune image n'est agrandie au-delà de ×2, ou un repli de disposition l'a
   évité.
5. **Le message passe.** Avant tout rendu, lance `ethniafrica-message` sur le
   sujet. Il écrit son verdict dans `message.md`, à côté du `cards.json`. La
   porte est franchie si ce verdict dit **passe** et s'il est plus récent que
   `cards.json`, `narration.fr.txt` et `post.md` : un verdict rendu sur une
   version précédente du texte ne juge pas celle qu'on rend. Lance aussi
   `ethniafrica-mythe` : un `mythe.md` qui dit **ne passe pas**, ou plus ancien
   que ces fichiers, ferme cette porte de la même façon.

La cinquième porte n'empêche pas de rendre, comme les quatre autres : un message
qui ne passe pas fait sortir le lot **en épreuve**, et l'encart de l'épreuve
reprend les critères non tenus. Elle existe parce que l'audit du 2026-09-13 a
trouvé la doctrine dans deux productions sur vingt-sept, alors que toutes
avaient franchi les quatre premières portes.

**Le moteur la tient lui-même depuis le 2026-09-16** (`porte_message`) : il lit
`message.md` et `mythe.md` à côté du deck, et refuse le lot si le verdict dit
« ne passe pas », s'il est plus ancien que le texte qu'il juge, ou — pour
`message.md` seul — s'il n'existe pas. Jusque-là cette porte ne vivait que dans
ce skill, et un lot qui franchissait les quatre portes mécaniques partait en
dossier-réseau quel qu'ait été le verdict du message. **Lancer l'audit reste ton
travail** : le moteur lit un verdict, il ne sait pas en rendre un.

Une épreuve porte un **bandeau diagonal « ÉPREUVE — NE PAS PUBLIER »** et un
encart listant les portes non franchies, en clair, avec ce qu'il faut pour les
franchir. Elle ne va jamais dans un dossier-réseau, et son nom de fichier porte
le suffixe `-epreuve`.

## Ce que tu appliques

Tout vient de `docs/design/gabarits-social/GABARITS-SOCIAL.md` :

- **§6, la règle de choix de disposition.** `auto` mesure et choisit. Le repli sur
  résolution est la règle la plus importante du lot : une image de 900 px en
  plein cadre 1080 × 1920 est agrandie ×3,6, le document devient une texture et
  l'argument de la carte disparaît avec lui.
- **La résolution se lit sur le fichier décodé**, jamais sur son nom.
- **La zone d'interface 9:16** : rien de lisible sous y = 1620.
- **§7, la licence de sortie** : la plus virale du lot, calculée et non recopiée.
- **§11, la liste de contrôle**, avant chaque rendu.

Le contraste se **mesure sur les pixels réels sous le voile**, pas s'estime. Le
halo de texte aide la perception et ne compte pas dans le calcul.

## Où sont les valeurs

Nulle part dans ta tête, et nulle part dans les scripts :

- couleurs et familles → `docs/design/gabarits-social/tokens/*.css`, lues par
  `ethni_tokens.py`
- tailles, marges, formats, voiles → `GABARITS-SOCIAL.md`

**N'invente jamais une valeur de couleur, une taille ou une licence.** Si une
valeur manque, dis laquelle et arrête-toi sur ce point : c'est une décision
d'opérateur, pas un trou à combler. Le défaut que ce dispositif corrige est
précisément une valeur inventée — un doré de logo employé comme couleur de texte,
illisible sur les fonds clairs.

## Où ça s'écrit

`<Sujet>` est un nom nu, et il se résout sous `ETHNIAFRICA_SOCIAL_PROJECTS` —
l'atelier, hors dépôt, où vivent le `cards.json`, les `assets/` vérifiés et le
`work/`. **Si la variable n'est pas posée, le sujet est cherché dans
`output/social/` du dépôt**, qui est ignoré par git et disparaît avec la copie de
travail. C'est un dépannage, pas une adresse : dis-le à l'opérateur plutôt que de
livrer un lot qui sera perdu.

**Ce n'est pas là que partent les images finies.** Elles partent dans le dossier
du post, dans la bibliothèque, que `structure` a inscrit. Avant chaque rendu de
carrousel :

```
node social/tools/library/register-post.mjs --where <id>
```

imprime le dossier où le post se trouve — le bac lu sur le disque, sinon celui
que son statut dérive par la règle de la bibliothèque. **Écris dans `cards.json`
`"outDir": "<ce chemin>/images"`, à chaque rendu**, jamais retapé ni gardé d'un
rendu précédent : un post classé dans un autre bac laisse un `outDir` périmé, et
le moteur recrée en silence un dossier sans `post.md` — mesuré le 2026-09-12,
165 PNG rendus pour rien. Vérifie que ce dossier contient un `post.md` avant de
lancer le moteur. Si `--where` ne connaît pas le post, il n'a pas été inscrit :
arrête-toi et renvoie à la fin de `structure`.

**La vidéo** reste rendue dans l'atelier (`<Sujet>/video/`, par
`ethni_montage.py`), puis se livre par le registre, jamais par une copie à la
main. Pour un montage qui franchit les portes :

```
node social/tools/library/register-post.mjs --id <id> \
  --video <fichier>.mp4=<Sujet>/video/<fichier>.mp4 --write
node <00-Index>/sync-deliverables.mjs --write
```

`sync-deliverables.mjs` copie ce que `renderedFrom` nomme dans le `video/` du
post, et le recopie à chaque nouveau rendu. Une épreuve ne s'inscrit pas.

Le bac d'un post se déduit de son `status` dans le registre, jamais de son
dossier. Ne déplace jamais un dossier à la main pour changer son bac.

Le moteur refuse toute autre écriture sous un dépôt git. Ce n'est pas une
précaution théorique : 1,2 Go de masters ont fini une fois dans un `output/`
ignoré par git, sauvegardé par rien.

## Les commandes

```
# Le schéma d'abord, si le deck vient de l'ancien gabarit :
node social/tools/migrate-cards/migrate-cards.mjs <Sujet> --essai
node social/tools/migrate-cards/migrate-cards.mjs <Sujet>

cd social/harness
./venv/bin/python ethni_carrousel2.py <Sujet>   # le carrousel, les deux formats
./venv/bin/python test_ethni_tokens.py          # la porte anti-littéral
./venv/bin/python test_ethni_compose.py         # le contrat de composition
./venv/bin/python test_corpus_compose.py        # les mêmes règles sur tout le corpus
./venv/bin/python test_gabarit_video.py         # le contrat de §9 bis
```

**`ethni_carrousel2.py` refuse d'écrire dans un dossier-réseau (nommé d'après
la colonne « Reçoit » de §1 bis) qui porte déjà des rendus** et bascule le lot en épreuve. Deux jeux de rendus côte à côte sont
indiscernables dans un sélecteur de fichiers. `--remplacer` lève le refus.

**La vidéo se rend par `ethni_montage.py`**, pas par `ethni_render.py` :

```
node social/tools/migrate-scenes/migrate-scenes.mjs <Sujet>
cd social/harness
./venv/bin/python ethni_montage.py <Sujet>              # le montage
./venv/bin/python ethni_montage.py <Sujet> --controle   # mouvement réduit
```

**La passe audio d'abord, et elle doit rendre la main.**

```
./venv/bin/python ethni_audio.py <Sujet>     # pauses, légendes, repères de scène
./venv/bin/python ethni_montage.py <Sujet>   # seulement après
```

Tout ce qui suit est calé sur `work/aligned-words.json`. Lancé pendant que la
passe écrit, le montage lit l'alignement de la version précédente et rend des
durées de scène d'une version avec les légendes d'une autre — mesuré une fois :
19 s de carte de clôture sur 8,6 s de voix, sans que rien ne se plaigne. **Le
montage refuse désormais de partir** si les lettres de l'alignement ne
reconstituent pas le script, et il nomme le signe où ça diverge. Ce refus est
bloquant, pas une remarque : un alignement périmé ne dégrade pas le montage, il
l'invente.

Les deux variantes d'un même sujet se ressemblent trop pour qu'on les distingue à
l'œil dans `work/` : seul le dernier bloc change, donc les débuts de scène sont
presque identiques et c'est la **fin** de la narration qui diffère.

**Une scène est un paragraphe de narration, et sa durée est mesurée.**
`ethni_audio.py` écrit `work/scene-starts.json`, un point par bloc séparé d'une
ligne vide ; `ethni_montage.py` le lit. Il ne répartit plus les légendes à parts
égales — sur Libreville ce partage affichait la carte de clôture à 44,10 s quand
sa première phrase se dit à 50,88 s. Si le nombre de paragraphes ne correspond
pas au deck, le montage le **dit** et retombe sur l'ancien calcul, plutôt que de
décaler toutes les scènes en silence. Relance la passe audio après toute édition
du deck ou du script.

Le contrôle en mouvement réduit est la version dont on juge une composition.

### La fin d'un montage

**La voix finit où l'image finit.** Le dernier paragraphe de narration dit ce que
dit la clôture — jamais une adresse seule. Le montage le contrôle contre les mots de
la carte de clôture elle-même et le remarque sans bloquer. Un reel sans carte de
clôture (dont la dernière carte n'est pas une `bascule`) n'est contrôlé contre rien.

**La clôture parlée est courte.** Pour un reel, c'est la clôture unique de §7 ter
(« Le reel a un couple unique »), mot pour mot : le titre puis le corps de la carte,
que la voix dit tous les deux. Elle n'a ni ligne de vision ni compte chiffré, et
n'est plus un renversement du type du sujet. Mesuré sur l'ancienne clôture : 58 mots
dictés donnaient 21,4 s de carte fixe, 23 mots en donnaient 7 ; la clôture unique
(24 mots) est estimée à 7 s, à mesurer sur le premier reel rendu.

**La carte de fin entre sur la phrase de sortie**, jamais avant, et joue une fois
avant de tenir sa dernière image. Le montage l'annonce dans son journal avec la
phrase sur laquelle elle entre : lis cette ligne, c'est elle qui dit si le repère
est juste. Il n'y a plus de ligne de vision à retrouver dans la narration — ni sur la
clôture unique, ni sur un reel sans clôture : la carte attend la fin de la dernière
légende, et ne joue jamais par-dessus la dernière phrase parlée.

### La voix

La paire voix/réglages d'un sujet est dans son `SOURCES.md` et **se copie, ne
s'invente pas**. Deux choses s'apprennent à la prise :

- **Un bloc court isolé se lit environ 40 % plus lentement qu'un long bloc
  continu.** Même voix, mêmes réglages : le corps de Libreville sort à 3,96 mots
  par seconde et une clôture de 23 mots à 2,25. Une clôture regénérée seule
  demande donc `speech_rate` autour de **35** pour rejoindre le rythme du corps.
- **`pauses` dans `production.json` fixe les silences minimaux** que la passe audio
  complète (virgule, phrase, paragraphe, question, accroche — §9 bis). Un sujet choisi à
  l'écoute sur un rythme resserré les baisse ici, sinon la passe les rallonge.
- **`tempo` dans `production.json` étire la prise** : plus il est bas, plus le
  film est lent _et_ plus la voix souffre. **0,85 est le plancher** — en dessous,
  un humain doit écouter avant publication. Libreville était à 0,79 et y est
  remontée.

**Refaire une prise ne se fait que sur le bloc qui change.** Le crochet est
`work/tts-corrected.wav`, que la passe audio préfère à `tts-original.wav` : on y
raccorde le corps approuvé, coupé au milieu du silence qui précède le bloc refait,
et la nouvelle queue. Le texte et la voix changent **ensemble**, sinon les
légendes se calent sur des mots que la voix ne dit pas.

La transcription est mise en cache dans `work/raw-whisper.json` et **porte
l'empreinte de la prise** qu'elle décrit. Sans clé, elle a déjà rendu les mots de
l'ancienne prise à la nouvelle.

**Un montage rendu par `ethni_montage.py` est conforme à §9 bis**, et se
présente comme tel. `ethni_render.py` survit pour les montages de l'ancien
gabarit, passe par `ethni_compose_v1.py` et lit `scenes.json`, un schéma distinct
de §10 — une vidéo qu'il produit n'est **pas** conforme, et ne se présente pas
comme telle. Ne le lance pas pour un deck migré.

Ce qui reste au gabarit vidéo : **les animations**. Le mock ne fixe que les
positions, et la cadence n'a aucun entrant, donc le montage et son contrôle
sortent identiques. C'est cohérent et ce n'est pas un défaut à signaler comme
tel. Détail : `docs/design/gabarits-social/notes/_gabarit-video-2026-09-11.md` et
`docs/design/gabarits-social/notes/_video-fin-2026-09-11.md`.

**Les sous-titres se coupent sur le souffle, jamais tous les N mots.**
`ethni_soustitre.segmenter()` travaille sur le texte de narration **avant**
l'alignement ; l'aligneur n'est interrogé que sur le _quand_. Couper les mots
alignés produit « Congo portaient le ».

**La porte 2 bloque sur l'absence de contrôle, pas sur le vocabulaire.** Elle
refuse une carte sans `image.identite`, et une carte dont personne n'a consigné
`image.verifie_le`. Elle **remarque** sans bloquer quand le crédit et l'identité
ne partagent aucun mot — un crédit est une légende, une identité une description,
et ils divergent légitimement. Ne présente pas une remarque comme un refus.

**`image.identite` s'écrit en regardant l'image**, jamais depuis le crédit.
Dérivée du crédit, elle ferait comparer une chaîne à sa propre copie et la porte
passerait partout, y compris sur la carte dont l'image a changé.

**`--remplacer` remplace vraiment** : les rendus précédents partent dans
`_rendus-remplaces/`. Sans lui, un dossier-réseau déjà peuplé bascule le lot
en épreuve.

## Pour finir

Si les cinq portes sont franchies, le post passe en 🟢 par le registre, pas par
son en-tête :

```
node social/tools/library/register-post.mjs --id <id> --status pret --write
node <00-Index>/migrate-library.mjs --write     # Brouillon → Valide, dossier et rendus compris
node <00-Index>/build-index.mjs
node <00-Index>/sync-deliverables.mjs --write  # après le déplacement : il compare au bac du statut
```

**Stampe le carnet de production** — `docs/productions/<typologie>/<NNN>-
<slug>.json` (`docs/plans/production-history-plan.md` §6, `campaign` égal au
`--id` ci-dessus). Pour chaque réseau que le dossier-réseau tout juste peuplé
dessert (le nom du dossier le dit, §1 bis), ajoute une ligne à `publications[]` :
`{ "network": "<réseau>", "format": "<video ou carrousel selon le dossier>" }`,
`url` et `publishedAt` absents. Tu ne les connais pas encore — c'est l'acte de
publier, celui de l'opérateur, qui les remplit après coup. Une épreuve
(`_epreuves/`) ne stampe rien : elle n'a franchi aucune porte. Revalide ensuite
avec `npm run check:production-ledger`.

`migrate-library.mjs --write` peut afficher une pile d'appels et sortir en
erreur **après** avoir déplacé le dossier et régénéré les vues. Ne relance rien :
vérifie le bac et le `post.md`, pas le code de sortie. Plusieurs montages sans
`selected` restent dans `Brouillon/`, c'est voulu.

Recalcule l'état : `node social/tools/etat-pipeline/build-etat.mjs`.

Puis dis, en une ligne : ce qui a été rendu, dans quel dossier, et l'état atteint.
Si le sujet est en 🟢, rappelle qu'il ne manque que l'acte de publier — et que
c'est l'opérateur qui le fait.
