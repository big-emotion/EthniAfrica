# Gabarits sociaux EthniAfrica — spécification de reproduction

Version 1 · 2026-09-10
Cible : `ethni_carrousel2.py` → `ethni_compose.py` (images) et `ethni_audio.py` →
`ethni_montage.py` (vidéo), sous `social/harness/`.
Ce document suffit à reproduire les gabarits au pixel près sans lire le HTML.

**Scoped editorial extension, 2026-09-25:**
[Mémoires sonores](MEMOIRES-SONORES.md) defines the approved six-card musical
series for TikTok and Instagram only. For this series, its narrative, closing
and platform scope take precedence over the name-origin, mandatory-myth and
all-network rules below. Source-quality rules still apply. The six visual mockups were approved on
2026-09-25: the linked reference now specifies the musical layout exception
(two photographs, four text cards, fixed larger type and a dedicated footer).
The opt-in `profil: memoires-sonores` is implemented in the carousel renderer
and private-library registration. Its shared JSON profile overrides delivery
only for this series; the general machine-readable format matrix is unchanged.

---

## 0. Principes non négociables

1. **Une seule police d'affichage.** Anton, pour le titre *et* pour la punchline. Deux
   condensées sur une même carte est le défaut le plus visible du gabarit précédent.
2. **Le texte occupe le cadre.** Colonne de contenu centrée optiquement, pied épinglé
   en bas. Jamais de bloc flottant dans le tiers haut suivi d'un trou.
3. **Un mot d'accent par carte**, jamais deux.
4. **Le doré de texte n'est pas le doré du logo.** `#f2ba36` est une couleur de marque ;
   le texte d'affichage prend `--afh-night-ocre-soft` `#e8b96a`.
5. **Le crédit et la licence sont dans le cadre visible**, jamais sous l'interface
   de la plateforme.
6. **Aucune image agrandie plus de ×2.** Au-delà, on change de gabarit (§7).

---

## 1. Formats

| Sortie | Dimensions | k (facteur d'échelle) | Marge basse |
| --- | --- | --- | --- |
| Carrousel Instagram / Facebook | 1080 × 1350 | 1,00 | 84 px |
| LinkedIn | 1080 × 1080 | 0,86 | 72 px |
| Reel / Story / Shorts | 1080 × 1920 | 1,08 | **391 px** (91 + 300) |

Marges latérales et haute : `84 × k`. En 9:16 la marge haute reçoit +40 px.

**Zone d'interface 9:16 :** les 300 px du bas et les 180 px de droite sont recouverts
par l'interface TikTok / Reels. Rien de lisible ne descend sous **y = 1620**.

---

## 1 bis. Un format par réseau

**Les deux formats partent sur chaque réseau ; seule la plateforme peut en
refuser un.** Décision de l'opérateur du **21 septembre 2026**, qui remplace
celle du 16 septembre (« chaque réseau reçoit le format qui y marche, et
seulement lui »). L'opérateur ne trie plus par réseau : une vidéo et un
carrousel par sujet, publiés partout où la plateforme les accepte. La règle vaut
pour toute production à venir : un post ne part pas sur un réseau que sa ligne ne
lui donne pas.

**Cette révision est une décision, pas une mesure.** La règle du 16 septembre se
fondait sur la mesure du 15 ; la colonne de droite la garde telle quelle, comme le
coût connu du choix, et non comme sa justification. La revue de phase 1 des 3 et
4 octobre relit ces chiffres en premier.

| Réseau | Reçoit | Ne reçoit pas | Mesure du 15 septembre 2026 (avant la révision) |
| --- | --- | --- | --- |
| TikTok | reel et carrousel | — | carrousels : Daloa 2 076 vues et 12 commentaires, Sénoufo 1 018, Krio 927 · vidéos : Côte d'Ivoire 785, Nzema 375, Peul 326 |
| Instagram | reel et carrousel | — | reels : Nzema 1 977 vues, Côte d'Ivoire 1 469 · carrousels : Daloa 241, Krio 179 — moins de portée, autant d'interactions par vue (Daloa 10,8 %, Côte d'Ivoire 11,7 %) |
| Facebook | reel et carrousel | — | reel Côte d'Ivoire : 21 211 vues, 191 partages · carrousels : Daloa 13, Sénoufo 14, Krio 9 |
| YouTube | reel (Shorts) et carrousel | — | un Short est une vidéo · Keïta–Coulibaly 1 388 vues, Nzema 1 176 en un jour · aucun carrousel mesuré |
| LinkedIn | reel, carrousel, et le texte avec lien depuis le profil personnel | — | profil personnel : 31 visites de lien en 28 jours · vidéos de la page : 0 à 2 impressions, 0 clic (7 et 14 septembre) |
| X (Twitter) | reel, et le texte avec lien | carrousel | aucune mesure — le compte a ouvert le 16 septembre 2026 avec zéro post. Contrainte de plateforme, pas mesure : **X n'a pas de carrousel**, un post multi-images y est une grille d'au plus quatre vignettes rognées, jamais un balayage. |

- **Un sujet se produit dans les deux formats, plus le texte LinkedIn.** Un
  carrousel n'existe que si le sujet défait un mythe attesté et sourcé
  (`ethniafrica-mythe`) ; un sujet sans mythe part en vidéo seule, sur tous les
  réseaux qui reçoivent le reel. Le carrousel ne va jamais sur X.
- **LinkedIn reçoit le carrousel dans la même sortie 4:5 que les autres réseaux.**
  La sortie LinkedIn 1080 × 1080 du §1 reste retirée du moteur (16 septembre
  2026) : `ethni_carrousel2.py` ne l'appelle pas, et la réintroduire est un
  chantier du moteur, pas de cette règle.
- **Un lot qui passe part dans un dossier par format, nommé d'après les
  réseaux qui le reçoivent** — `TikTok-Instagram-Facebook-YouTube-LinkedIn/`
  pour le carrousel, `TikTok-Instagram-Facebook-YouTube-LinkedIn-X/` pour le
  reel — et non plus dans un `images/` à plat que l'opérateur devait trier
  réseau par réseau avant de publier. Le nom se lit dans la colonne « Reçoit »
  ci-dessus, dans son propre ordre : une ligne révisée change le rangement sans
  un second edit dans le moteur. **Les lots déjà rangés sous l'ancien nom
  (`TikTok-Instagram/`, `Instagram-Facebook-YouTube-X/`) ne sont pas déplacés** :
  un rendu de remplacement s'écrit sous le nouveau nom, à côté.
- **La table se révise, elle ne s'enfreint pas.** Une ligne ne change que sur une
  mesure de `ethniafrica-content-strategist`, écrite ici avec sa date. Une seule
  semaine de mesure la fonde : la revue de phase 1 des 3 et 4 octobre la relit
  en premier.
- **La ligne X est la seule que rien ne mesure, et elle le dit.** Les cinq autres
  reposent sur le 15 septembre ; X a ouvert le 16 avec zéro post, donc il n'y a
  rien à lire. Ce qui la fonde est vérifiable sans mesure — la plateforme ne
  propose pas de carrousel — et rien d'autre n'y est affirmé : ni portée
  attendue, ni cadence, ni public. **Une ligne fondée sur une contrainte ne se
  cite pas comme une ligne fondée sur une mesure.** Elle est la première que la
  revue de phase 1 doit remplacer par des chiffres.
- **Le reel part sur X avec sa marge d'interface, et c'est une dette assumée.**
  Le 1080 × 1920 du §1 réserve 391 px en bas pour l'interface TikTok / Reels ;
  sur X cette bande ne recouvre rien et reste vide. Rendre une sortie propre pour
  X est un chantier du moteur, pas de cette règle — on mesure d'abord que X vaut
  le rendu, on l'optimise ensuite.

---

## 1 ter. La miniature

**La première image est une miniature avant d'être une carte.** Elle circule dans
le fil bien plus longtemps qu'elle ne dure à l'écran, à peu près au sixième de sa
largeur, et c'est elle qui décide qui regarde. Décidé le 16 septembre 2026, en
comparant la grille TikTok du compte : les vidéos ouvraient sur un titre de 76 px
au tiers bas, doublé par la plaque de narration — deux fois la même phrase, et
aucune des deux lisible en vignette.

Quatre règles, carrousel et vidéo ensemble.

1. **Le titre d'ouverture prend le rang couverture du §3**, quelle que soit sa
   disposition : 120 px en 4:5, 130 px en 9:16. Le rang « Titre de série » est
   celui des cartes de développement.
2. **Il ne se comprime jamais.** Mesuré sur l'atelier le 16 septembre : six
   ouvertures sur seize étaient descendues à 106 ou 88 px pour tenir dans leur
   bandeau, sans que rien ne le dise. C'est la copie qui cède désormais, et le
   moteur nomme la faute plutôt que de rapetisser en silence.
3. **Huit mots au plus, et le dernier porte l'accent** — c'est la chute. Les deux
   productions qui tenaient à la mesure en faisaient exactement huit ; celles qui
   ne tenaient pas en faisaient onze, treize et quinze. Au-delà, `portes` le
   signale : le développement commence à la carte suivante.
4. **Rien d'autre ne la charge.** En vidéo, l'emplacement de narration reste vide
   pendant les 1,5 premières secondes : une légende y répéterait, en petit, la
   phrase que le titre porte déjà en grand. Le montage dépose cette première
   image à côté de lui en PNG — chaque réseau propose une couverture, aucun ne
   choisit celle-là tout seul.

**Ce qui cède quand elle ne tient pas.** Le titre, jamais : ce qui l'entoure. Le
§7 ter ne donne à une ouverture que des blocs nommés — bandeau et rang, titre,
indication de défilement, et pour un reel la ligne de vision qu'il porte encore —, donc un corps, une punchline ou une
précision posés là sont déjà hors gabarit, et ce sont eux que le moteur retire, en
nommant la faute. Mesuré le 16 septembre : six ouvertures sur seize dépassaient,
et toutes les six portaient un de ces blocs en trop.

**Ce qu'une miniature ne fait pas** : promettre ce que la production ne paie pas.
Une accroche dont la pièce ne referme pas la question n'est pas une accroche,
c'est un appât — et sur un atlas sourcé, c'est aussi un mensonge sur le corpus.
Une accroche pose la question du sujet, et la pièce y répond. Un reel, lui, a sa propre
loi, juste ci-dessous.

### Le titre d'un reel est une loi

**Un reel s'intitule « D'où vient le nom « X » ? », et rien d'autre** — `{X}` est le
nom de travail du sujet : « D'où vient le nom « Ghana » ? ». C'est le titre de la
carte d'ouverture, donc la miniature, **et** le titre du post sur chaque réseau. Pas
de variante, pas de chute inventée : « Trois versions disent qui a nommé le Ghana »
n'est pas un titre de reel.

La loi vient de l'essai du 2026-09-17
(`docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md`, « le format social se
réduit à un seul »), elle est écrite dans `ethniafrica-idee`, et l'opérateur l'a
rappelée le 2026-09-21. Elle n'était pas écrite ici, et `structure` lit cette
section : c'est pour cela qu'un lot a été titré autrement. Elle satisfait les quatre
règles ci-dessus — cinq mots, le dernier, le nom, porte l'accent. La miniature ne
promet que ce que la pièce paie : elle pose la question du sujet, et la pièce y
répond.

**Le carrousel n'a pas cette loi.** Son accroche est le mythe posé au lecteur, en
question — pour le Ghana : « Le nom du Ghana actuel vient-il de l'ancien empire du
Ghana ? ».

> **Décision ouverte — à trancher par l'opérateur.** Cette accroche fait onze mots,
> et la règle 3 en plafonne huit : le moteur la refuserait comme titre d'ouverture.
> Trois issues, aucune n'est choisie ici : raccourcir l'accroche ; faire porter la
> loi du reel à la carte 1 du carrousel et la question du mythe à la carte 2 ; ou
> écrire ici une exception à la règle 3 pour cette carte.

---

## 2. Couleurs — jetons de la charte, jamais de littéral

### Thème nuit (défaut)

| Rôle | Jeton | Valeur |
| --- | --- | --- |
| Fond | `--afh-night-ground` | `#120e0a` |
| Encre principale | `--afh-night-ink` | `#f1e7d8` |
| Encre secondaire (corps) | `--afh-night-ink-2` | `#c9b99f` |
| Encre tertiaire (crédits) | `--afh-night-ink-3` | `#8f7f66` |
| Accent ocre | `--afh-night-ocre-soft` | `#e8b96a` |
| Accent teal | `--afh-cat-teal` | `#33a390` |
| Accent terre | `--afh-cat-terre-ink-night` | `#cd725e` |
| Accent pervenche | `--afh-cat-perv` | `#7a8ce8` |

### Thème parchemin

| Rôle | Jeton | Valeur |
| --- | --- | --- |
| Fond | `--afh-color-bg` | `#fbf7f2` |
| Encre principale | `--afh-color-text` | `#2c2018` |
| Encres 2 et 3 | `--afh-color-text-soft` | `#746557` |
| Accents | `--afh-cat-*-ink` | ocre `#835514` · teal `#226d60` · terre `#974331` · perv `#535f9e` |

> `--afh-color-text-muted` `#9b8b7d` échoue AA en corps 19 px. Ne jamais l'utiliser
> pour un crédit.

**Mapping accent ↔ pilier :** EthniAfrica → ocre · Les dossiers → teal · Jouer → pervenche.
L'ancien pilier « L'atlas » se lit « EthniAfrica » (2026-09-22) : aucune carte n'imprime plus « L'ATLAS ».
Une carte a un seul accent.

---

## 3. Typographie

Anton (affichage, social uniquement) et Nunito Sans (tout le reste).
Toutes les valeurs sont en pixels à k = 1 ; multiplier par k.

### Cinq rangs, et l'ordre ne se négocie pas

Une carte porte deux choses que le lecteur doit emporter, et trois qui ne servent qu'à
les créditer. Le rang décide de la taille, du contraste et de la place ; il ne se
déduit pas de la longueur du texte.

| Rang | Ce qui y vit | Taille | Encre |
| --- | --- | --- | --- |
| **1 · le message** | chiffre, mot d'accent | 96–216 | accent |
| **1 · le message** | titre de carte | 96–126 | **encre 1**, un mot en accent |
| **2 · la preuve** | la paire de noms, la précision | 34–56 | encre 1 |
| **3 · l'explication** | le corps | 32 | encre 2 |
| **4 · le repère** | pilier, rang, appel à l'action | 22–27 | encre 1 / accent |
| **5 · l'annexe** | source, crédit, licence | 18–20 | **encre 2**, opacité .88 |

**Invariant :** le corps est au moins **1,6 fois** le crédit. Une explication plus
petite que sa mention légale inverse la hiérarchie — le lecteur lit d'abord ce qui
compte le moins. C'est un test, pas une intention.

**Le rang 5 est une annexe, pas un pied de page décoratif.** Il doit être lisible pour
qui le cherche et discret pour qui ne le cherche pas — mais **sa discrétion vient de sa
taille et de sa place, jamais d'un contraste raté.**

> **Plafond mesuré : `--afh-night-ink-3` #8f7f66 plafonne à 4,94:1 sur le fond de nuit
> #120e0a, à alpha 1,0.** C'est l'asymptote : aucun renforcement de voile ne peut
> l'amener au-dessus. Dès qu'une luminance d'image survit au voile, la ligne
> d'attribution tombe à 4,2–4,3:1 — sous le seuil, sur le seul bloc que tout
> l'appareil de portes existe pour protéger. L'annexe prend donc **l'encre 2**
> `#c9b99f` (10:1 sur le fond), à opacité 0,88–0,92 et à 18–20 px. Même famille de
> faute que `--afh-color-text-muted` en §2, sur le thème de nuit au lieu du parchemin.
> L'encre 3 reste pour ce qui n'est pas du texte : filets, filigrane, séparateurs.

| Rôle | Police | Corps | Interligne | Graisse | Casse | Couleur |
| --- | --- | --- | --- | --- | --- | --- |
| Bandeau (pilier) | Nunito | 25 | — | 700 | maj., interlettre .20em | encre 1 |
| Rang « 01/05 » | Nunito | 22 | — | 700 | interlettre .14em | accent |
| Chiffre / mot d'accent | Anton | 216 | 0,84 | — | — | accent |
| Titre de couverture | Anton | 120–126 | 1,08 | — | maj. | encre 1 |
| Titre de série | Anton | 96–118 | 1,08 | — | maj. | encre 1 |
| Paire — terme | Anton | 56 | 1,0 | — | — | encre 1 / accent |
| Paire — glose | Nunito | 28 | 1,35 | 400 | — | encre 2 |
| Précision (sous le chiffre) | Nunito | 36 | 1,32 | 600 | — | encre 1 |
| Punchline | Anton | 60–64 | 1,06 | — | maj. | encre 1 |
| **Corps** | Nunito | **32** | 1,55 | 400 | — | encre 2 |
| Source | Nunito | 20 | — | 700 | maj., interlettre .09em | encre 2, op. .92 |
| **Crédit** | Nunito | **18** | 1,5 | 400 | — | encre 2, op. .88 |

**L'interligne de ce tableau gouverne l'espacement entre les lignes d'un même
bloc, jamais la hauteur qu'une seule ligne réserve.** Le corps d'une police
(le nombre passé au moteur — 216, 96, 32…) n'est pas la hauteur visuelle
d'une ligne : mesuré sur les deux polices du gabarit, une ligne réelle
occupe **1,4 à 1,5×** son corps — Anton à 216 px mesure 255 + 72 = 327 px
d'ascendant et de descendant, Nunito à 32 px mesure 33 + 12 = 45 px. Un
rôle à interligne ≤ 1 sur une seule ligne — ici seulement « Chiffre / mot
d'accent », 0,84, calibré pour l'écart *entre* deux lignes d'un mot
d'accent, jamais pour la boîte d'une ligne seule — réservait donc une
boîte plus petite que ses propres lettres. `ethni_compose._hauteur()`
plancher désormais chaque bloc à 1,5× son corps ; ce n'est pas une valeur
à recopier ailleurs, c'est une garantie de moteur, pas un choix de charte.
Mesuré le 2026-09-14 sur `zokou-gbeuly` : un « 1835 » nu chevauchait sa
légende avant, puis ne lui laissait que 5 px d'air après un premier
correctif trop étroit — l'écart maintenant se compare à celui d'une
production déjà publiée (« Sénoufo », pilier Mythe déconstruit).
| Sous-titre narration | Nunito | 44–46 | 1,30 | 800 | — | encre 1 |

**Mesures maximales** (rag maîtrisé) : précision 800 px · punchline 880 px ·
corps 740 px · crédit 760 px.

**Filet séparateur** entre le bloc chiffre et la punchline : 76 × 3 px, accent,
opacité 0,55, marge verticale 48. **Il est horizontal et autonome** — jamais un filet
vertical qui longe une colonne : un filet de pleine hauteur touche le titre dès que la
colonne grandit, et il ne dit rien que la gouttière ne dise déjà.

**Interligne des titres d'affichage : 1,08 minimum.** À 0,96–0,98 les accents d'une
ligne touchent les jambages de la précédente — « Brésilien » sur « angolais ». Anton
n'a aucune réserve verticale ; c'est l'interligne qui la fournit.

**L'interligne de ce tableau gouverne l'espacement entre les lignes d'un même
bloc, jamais la hauteur qu'une seule ligne réserve.** Le corps d'une police
(le nombre passé au moteur — 216, 96, 32…) n'est pas la hauteur visuelle
d'une ligne : mesuré sur les deux polices du gabarit, une ligne réelle
occupe **1,4 à 1,5×** son corps — Anton à 216 px mesure 255 + 72 = 327 px
d'ascendant et de descendant, Nunito à 32 px mesure 33 + 12 = 45 px. Un
rôle à interligne ≤ 1 sur une seule ligne — ici seulement « Chiffre / mot
d'accent », 0,84, calibré pour l'écart *entre* deux lignes d'un mot
d'accent, jamais pour la boîte d'une ligne seule — réservait donc une
boîte plus petite que ses propres lettres. `ethni_compose._hauteur()`
plancher désormais chaque bloc à 1,5× son corps ; ce n'est pas une valeur
à recopier ailleurs, c'est une garantie de moteur, pas un choix de charte.
Mesuré le 2026-09-14 sur `zokou-gbeuly` : un « 1835 » nu chevauchait sa
légende avant, puis ne lui laissait que 5 px d'air après un premier
correctif trop étroit — l'écart maintenant se compare à celui d'une
production déjà publiée (« Sénoufo », pilier Mythe déconstruit).

**Halo sur tout texte d'affichage posé sur une image :**
`text-shadow: 0 2px 20px rgba(18,14,10,.85), 0 0 6px rgba(18,14,10,.6)`. Il ne compte
pas dans la mesure de contraste — c'est le voile qui doit atteindre le seuil — mais il
sauve le détail d'un glyphe qui tombe sur une zone claire du document.

### Les dates s'écrivent en chiffres, jamais en lettres

Décidé le 2026-09-14. Une date affichée à l'écran — année, siècle, décennie — porte
toujours ses chiffres : `1891`, pas « mille huit cent quatre-vingt-onze » ; `XVIIe
siècle` ou `17e siècle`, jamais « dix-septième siècle ». Vaut pour `titre`, `corps`,
`precision`, `punchline`, et pour les sous-titres de la vidéo, qui reprennent le texte
de `narration.fr.txt` : une date épelée dans le script s'affiche épelée au sous-titre.

Ne s'applique pas à un compte qui n'est pas une date — « soixante-cinq peuples » reste
en lettres. La distinction est celle-là : une date se lit sur
une frise chronologique, un compte se dit à voix haute.

---

## 3 bis. Le bloc de paire

Deux noms pour une même chose — l'autonyme et l'exonyme, le mot d'origine et le mot
repris — sont **le sujet de l'atlas**. Le bloc doit faire voir l'équivalence, pas
empiler deux mots.

**Une seule forme : l'horizontale.**

**Horizontale** — deux colonnes côte à côte, **chaque terme au-dessus de
sa propre glose**, la flèche `→` en accent dans la gouttière :

```
kilombo              →     Quilombolas
un campement de            au Brésil
guerre, en Angola
```

L'équivalence se lit d'un coup : deux objets de même nature, posés au même niveau.
Mesure de chaque colonne : 330 px. Dans une disposition centrée, le couple entier est
centré et chaque colonne reste alignée à gauche — c'est l'alignement interne qui fait
lire la paire, pas le centrage.

**L'horizontale coûte 170 px, la verticale 279.** Sur un aplat où rien ne peut se
comprimer, ces 109 px sont la différence entre un crédit visible et un crédit hors du
cadre. C'est la raison principale pour laquelle l'horizontale est la forme unique.

**Verticale centrée** — repli, et repli seulement, quand un terme ne tient pas dans sa
colonne. Terme et glose empilés et centrés, la flèche `↓` entre les deux groupes :

```
        kilombo
  un campement de guerre,
        en Angola
           ↓
      Quilombolas
       au Brésil
```

**La glose est centrée sous son terme, jamais étalée sur toute la largeur.** Une glose
qui occupe la mesure complète pendant que son terme fait trois centimètres donne à
l'annexe le poids du sujet.

**Dans les deux formes :**

- **La flèche est obligatoire**, en accent, Anton 50–56 — `→` à l'horizontale, `↓` à
  la verticale. Elle dit la dérivation : ce mot est devenu cet autre. Sans elle, deux
  mots posés ne sont que deux mots posés.
- **Le premier terme porte l'encre 1, le second l'accent.** Et le titre nomme les deux
  camps dans le même ordre — « un mot **angolais** devenu **brésilien** », angolais en
  encre 1, brésilien en accent. La couleur devient une clé de lecture au lieu d'une
  décoration.
- **Chaque glose appartient à son terme.** Jamais deux gloses fondues sur une ligne
  séparées d'un middot : « un campement de guerre, en Angola · au Brésil » demande au
  lecteur de redistribuer lui-même ce que la grille peut montrer.
- Deux à quatre rangs. Au-delà, la carte se coupe en deux.

---

## 4. Voiles (scrims)

Trois couches, dans cet ordre, au-dessus de l'image :

**En carrousel, une carte plein cadre porte UN voile, jamais deux.** La plaque de bandeau
et le voile de colonne, écrits séparément, s'éteignent tous deux à 0 dans l'intervalle
qui les sépare : leurs alphas s'annulent et l'image reparaît en pleine lumière sur toute
la largeur.

> **Exception vidéo, et elle est délibérée.** §9 bis porte deux voiles : une plaque de
> `0 → 340` pour le nom de série et un voile de `840 → 1920` pour le texte. Le profil
> n'est donc pas monotone — 0,95 en haut, 0 au milieu, 0,93 en bas. C'est licite **parce
> qu'aucun texte ne vit dans l'intervalle** : la bande claire y est l'image, qui est le
> sujet. Le contrôle de monotonie de §11 ne s'applique qu'au carrousel ; en vidéo, le
> contrôle est qu'aucun bloc de texte ne tombe dans l'intervalle. Mesuré sur l'ouverture 9:16 — alpha 0,95 à y = 0, **0,00 à y = 400**, 0,78
à y = 700 ; la luminance de ligne monte à 225 puis retombe à 46. Une excursion de
200 niveaux et retour n'est pas un dégradé, c'est une bande.

### Le voile unique — et il s'ancre sur la colonne, pas sur une ordonnée

**Aucune cote de voile ne se calcule à la main.** Le voile est **un enfant de la
colonne de contenu**, ce qui le rend exact par construction quelle que soit la hauteur
du contenu :

```html
<!-- la colonne : aplat de lisibilité, plein bord à bord -->
<div style="position:absolute;left:0;right:0;bottom:0;padding:0 96px 84px;
            background:linear-gradient(180deg,rgba(18,14,10,.92) 0%,
                       rgba(18,14,10,.94) 40%,rgba(18,14,10,.95) 100%);
            display:flex;flex-direction:column;gap:34px">

  <!-- la rampe : toujours 300 px AU-DESSUS du contenu réel -->
  <div style="position:absolute;left:0;right:0;bottom:100%;height:300px;
              background:linear-gradient(180deg,rgba(18,14,10,0) 0%,
                         rgba(18,14,10,.06) 20%,rgba(18,14,10,.20) 55%,
                         rgba(18,14,10,.50) 78%,rgba(18,14,10,.92) 100%)"></div>
  …
</div>
```

`bottom:100%` place la rampe juste au-dessus de la boîte de contenu. Elle suit donc la
colonne quand celle-ci grandit — ce qu'une valeur estimée ne fait pas.

> **L'erreur mesurée, deux fois de suite.** J'ai d'abord ancré l'alpha utile sur la
> **mi-hauteur** du premier bloc : correct pour un bloc d'une ligne, faux pour un titre
> de trois à cinq lignes, dont la première ligne se retrouve 290 px plus haut, à alpha
> ≈ 0,07 — 46 % de l'aire du titre sous 3:1. J'ai ensuite ancré sur un `contentTop`
> **sommé à la main**, que la même édition a invalidé en ajoutant une rangée à la
> colonne : erreur de 130 px en 4:5 et 278 px en 9:16, bandeau à 1,09:1. Les deux fois,
> la faute était de décrire en ordonnées ce qui doit être décrit en relations.

**L'alpha ne redescend jamais**, et l'aplat de colonne commence à 0,92 — donc le
premier bloc est couvert quoi qu'il soit, bandeau comme titre. C'est ce qui rend la
règle indépendante de l'ordre des blocs.

**Vérification :** le profil de luminance de ligne doit être monotone décroissant, ou
son excursion rester sous 25 niveaux. **Ce contrôle ne porte que sur A.**

> **L'image va au plein cadre sur les trois dispositions.** Le cartouche et le mot plein
> cadre recadraient l'image en bande et posaient leur texte sur le fond de la carte.
> Mesuré sur la carte de clôture du carrousel Dioula : à partir de 36 % de la hauteur,
> **la variation horizontale du fond est de 0,00** sur tout le reste de la carte. Un
> aplat pur. Aucune opacité n'aurait pu y révéler une photographie qui n'y était pas
> dessinée — c'est la correction demandée par l'opérateur le 12 septembre 2026, et sa
> forme littérale, « baisser l'opacité », n'aurait rien changé sur la carte qu'il
> montrait.
>
> Ces deux dispositions gardent leur plaque de bandeau, parce que le bandeau vit en haut
> de carte, loin de la colonne, et qu'il lui faut un fond. La trouée claire entre la
> plaque et la colonne est licite **pour la raison exacte qui la rend licite en vidéo**
> (§9 bis) : aucun texte n'y vit, et ce qu'on y voit est la photographie, qui est le
> sujet. Le contrôle qui remplace la monotonie est donc celui de la vidéo — **aucun
> bloc de texte ne tombe dans la trouée**.

### Le voile se résout, il ne se règle pas

**L'alpha n'est plus une constante, et la table ci-dessous est devenu son plafond.**

La table est calibrée sur le document le plus pâle du corpus. Appliquée telle quelle à
une photographie sombre, elle dépense du contraste qu'aucun texte ne réclame : mesuré
sur le carrousel Dioula du 12 septembre 2026, **9,26:1 là où la règle en demande 4,5**,
et la photographie disparue derrière sa propre légende pour rien.

Le moteur mesure donc l'image **réellement dessinée**, bloc par bloc, et résout le plus
petit alpha qui porte chaque texte à son seuil :

| | |
| --- | --- |
| Cible | le seuil du bloc × **1,12** — la marge absorbe le bruit JPEG et l'anticrénelage |
| Échantillon | le **92ᵉ centile** de la zone, jamais sa moyenne |
| Plancher | **0,55** |
| Plafond | **0,95**, la valeur de la table |

**L'échantillon est un centile haut et c'est le cœur de la règle.** Une légende qui
traverse une seule branche ensoleillée échoue sur cette branche, et une moyenne la
cache. Sur une gravure pâle la résolution remonte d'elle-même vers le plafond, sans que
personne ait à y penser.

**Le prédicat est une conjonction, et il faut qu'il le reste :** « le fond est plus
sombre que l'encre **et** le rapport franchit le seuil ». Sans sa première moitié le
rapport redescend à 1:1 quand le fond croise l'encre puis remonte, la fonction n'est
plus monotone, et une dichotomie s'arrête du mauvais côté du creux en rendant un voile
trop léger.

**La rampe se met à l'échelle du même facteur, elle ne se résout pas à part.** Elle doit
finir exactement là où l'aplat commence ; résolues séparément, les deux se rejoindraient
à deux alphas différents et dessineraient un trait de coupe en travers de la carte.

**Les alphas utiles, mesurés sur le document le plus pâle du corpus** (luminance 0,985 ;
Ogilby monte à 0,999) — **plafonds, désormais, et non réglages** :

| Texte | Luminance | Seuil | Alpha nécessaire |
| --- | --- | --- | --- |
| Affichage en **encre 1** `#f1e7d8` | 0,818 | 3:1 | **0,80** |
| Affichage en **accent** `#e8b96a` | **0,527** | 3:1 | **0,84** |
| Corps, source, crédit (encre 1 ou 2) | 0,818 / 0,53 | 4,5:1 | **0,88** |
| Bandeau et rang sur gravure pâle | 0,818 | 3:1 | **0,92** |

**La table est indexée sur la LUMINANCE du texte, pas sur sa taille.** C'est l'erreur qui
a produit trois fois le même défaut : un chiffre doré de 150 px tombait à 2,15:1 là où le
même chiffre en encre 1 tenait 5,8:1 au même alpha. Le doré est une couleur de **fill**
dans la charte, pas une couleur de texte sur photographie ; il vaut 0,527 contre 0,818
pour l'encre 1, soit un tiers de luminance en moins à compenser par le voile.

**Corollaire pour un voile allégé :** quand l'alpha descend sous 0,84, **le texte
d'affichage passe en encre 1 et l'accent se réfugie dans la plaque**, qui a son propre
fond opaque. On n'épaissit pas le voile pour garder un doré : on déplace le doré.

**Le bandeau est une ligne unique, et le libellé ne se raccourcit jamais.**
`white-space: nowrap`. Le libellé est la signature de la série : il se lit **mot pour
mot identique sur toutes les cartes**, qualificatif inclus. Quand il ne tient pas, on
règle le **corps et l'interlettre**, pas la chaîne — mesuré : « EthniAfrica · Atlas des
peuples d'Afrique » fait 759 px à 25 px / 0,16em (785 disponibles en 4:5, il tient) et
820 px à 27 px / 0,16em (766 disponibles en 9:16, il ne tient pas) ; à 24 px / 0,12em
il tient. Raccourcir la chaîne avait produit deux libellés différents dans le même jeu.

3. **Dégradé vertical**
   `linear-gradient(180deg, .90 0%, .30 10%, .06 22%, .10 40%, .82 62%, .96 78%, #120e0a 100%)`

Thème parchemin : mêmes formes, base `251,247,242`, alphas divisés par ~1,4
(radial .64 / .42 / .10 ; vertical .58 / .04 / .74 / .90). Au-delà, la photographie disparaît.

**Piège à éviter :** un voile posé `inset:0` *dans une bande d'image* calcule ses arrêts
en pourcentage de la bande, pas de la carte. Le bandeau tombe alors dans une zone déjà
dégradée. C'est pourquoi le voile de bandeau est une couche séparée.

**Halo de texte** sur le bandeau et le rang :
`text-shadow: 0 2px 16px rgba(18,14,10,.95), 0 0 5px rgba(18,14,10,.85)`
(inversé en clair sur parchemin). Le halo aide la perception mais **ne compte pas**
dans le calcul de contraste : c'est le voile qui doit atteindre 4,5:1.

---

## 5. Les trois dispositions

### A — Tiers bas ancré
*Carte de série. Image pleine, texte groupé en bas à gauche.*

- Image plein cadre, `object-fit: cover`.
- **Bandeau et rang dans la colonne de contenu**, première rangée, `space-between` :
  pilier à gauche en encre 1, rang à droite en accent. Pas de plaque en haut de carte
  (§4 : un seul voile, monotone).
- Bloc bas : `left/right = 96`, `bottom = 84` (4:5) / `330` (9:16),
  colonne alignée à gauche, gouttière 30–34.
  Ordre : bandeau + rang → titre Anton 96–118 → paire ou précision → corps → source →
  crédit + filigrane.
- **Aucune plaque, aucune boîte.** Le texte se pose sur l'image, tenu par le voile
  local de §4 et rien d'autre. Un aplat arrondi sur une photographie déjà voilée
  assombrit deux fois et se lit comme une fenêtre collée sur l'image : la charte dit
  que les apartés sont des filets, pas des boîtes. Si le texte n'est pas lisible sans
  plaque, c'est le voile qui est mal réglé — ou l'image qui ne convient pas.
- **Le crédit est dans la même colonne flex** que le corps, gouttière 20 —
  jamais deux ancrages absolus indépendants (ils se télescopent).
- **A est la disposition par défaut**, et celle qui doit dominer une série : c'est celle
  où l'image reste le plus visible. Elle n'est plus la seule à porter l'image au plein
  cadre — les trois le font depuis que la bande a disparu — mais c'est la seule où le
  texte se groupe en bas et laisse la photographie respirer sur les deux tiers hauts.
  Un carrousel où le texte couvre la moitié de la carte fiche après fiche n'est plus un
  carrousel d'images, et c'est ce que le quota de §6 protège.

### B — Mot plein cadre
*Ouverture et bascule. Le mot frappe, la ligne explique.*

- **Image plein cadre**, comme partout. Le contenu s'accroche à **37 % de la hauteur**
  (502 px en 4:5, 714 px en 9:16) : c'est une ligne d'ancrage, plus une ligne où la
  photographie s'arrête. Le voile adaptatif de §4 la couvre à partir de là.
- Colonne centrée entre l'ancre et le pied : mot Anton 170–186 (`text-shadow:
  0 6px 40px rgba(18,14,10,.85)`) → précision 34–38 maj. interlettre .06em encre 2 →
  filet → corps 40–44 / 800.
- Crédit + logo épinglés en bas.

### C — Cartouche
*Chiffre, ou corps de plus de 110 signes. Le haut de l'image ne porte aucun texte.*

- **Image plein cadre.** Le contenu s'accroche à **49 % de la hauteur de la carte**,
  dans les deux formats. Au-dessus de cette ligne, aucun texte hormis le bandeau. Elle
  descend à **42 %** quand la carte porte un bloc de paire, et à **30 %** quand la bande
  de sous-titre est active en 9:16 : **le texte prime sur l'image, jamais l'inverse.**

> **La bande est la seule variable d'ajustement de C.** Dans un aplat, aucun enfant ne
> peut se comprimer : tout est `flex: 0 1 auto` avec `min-height: auto`, et l'espaceur
> `flex:1` est déjà à zéro dès que le contenu remplit. Un bloc sur-souscrit ne se
> serre pas, il déborde — et ce qui tombe du cadre est le bloc de crédit, qui est en
> dernier. La hauteur de bande se calcule donc **sur la hauteur du contenu**, pas sur
> une proportion choisie à l'avance.
>
> **Test manquant le plus coûteux :** vérifier que le contenu tient entre le bas de la
> bande et le pied épinglé, pour chaque disposition × format × forme de paire. Une
> assertion sur le pied ne suffit pas : le bloc peut être correctement épinglé à 1266
> tandis que ses enfants débordent à 1436 sans que rien ne le signale.
- Aplat de fond en dessous, texte dedans : titre Anton 110–124 → précision 34–38 →
  filet supérieur 2 px `rgba(232,185,106,.35)` → corps 42–46 / 800.
- Crédit + logo épinglés en bas.
- **C absorbe la différence de hauteur entre 4:5 et 9:16** : l'ancre garde sa
  proportion, et tout le surplus de hauteur va au texte, qui n'a aucune contrainte
  de composition. Le cadrage de l'image est identique dans les deux formats — c'est
  la carte qui s'allonge, pas la photographie qui se recompose. C'est la disposition
  la plus stable entre formats.

> **Une ancre se mesure en pourcentage de la carte, jamais en pixels fixes.** Une
> hauteur fixe donnerait 42 % en 4:5 et 29 % en 9:16 : la même carte ne se
> reconnaîtrait pas d'un format à l'autre, ce qui annule la raison d'être d'un
> système unique. B tient 37 % pour le même motif.
>
> **Elle se lit sur `plan.ancre`, plus sur la hauteur du bloc image.** Tant que
> l'image s'arrêtait à l'ancre, les deux se confondaient. L'image couvrant désormais
> la carte sur les trois dispositions, un test qui mesurerait encore le bloc image
> comparerait 100 % à 100 % et vaudrait pour n'importe quelle ancre — c'est exactement
> ce qu'il a fait pendant le temps d'une exécution, avant d'être redirigé.

---

## 6. Règle de choix automatique

```python
SUR_ECH_MAX = 2.0   # agrandissement maximal en plein cadre
CORPS_COURT = 90    # signes — au-delà, le mot ne porte plus seul

def choisir(carte, image):
    sur_ech = max(1080 / image.w, hauteur_cadre / image.h)

    # B : le mot porte, une ligne l'explique. Bascule seulement, pas de paire.
    if carte.role == "bascule" \
       and not carte.paires \
       and len(carte.corps or "") <= CORPS_COURT:
        return "B"

    # C : repli. L'image ne supporte pas le plein cadre,
    #     ou la colonne composée ne tient pas au-dessus du crédit.
    if sur_ech > SUR_ECH_MAX:
        return "C"
    if not colonne_A_tient(carte, image):
        return "C"

    return "A"
```

**`colonne_A_tient()` mesure, elle ne compte pas.** Elle compose la colonne A —
titre, paire, corps, source, crédit, filigrane — avec la police qui va la dessiner, et
vérifie que le tout tient entre le voile et la marge basse **et** que chaque bloc garde
son seuil de contraste. Un compte de signes est une approximation de cette mesure, et
une mauvaise : 199 signes en deux lignes courtes tiennent là où 185 signes en quatre
lignes ne tiennent pas. Même famille de faute que le plafond de sous-titre compté en
caractères au lieu d'être mesuré en pixels.


**A est le défaut, C est le repli, B est l'exception.** Un chiffre ne justifie pas C à
lui seul : un chiffre se pose très bien sur une image, et c'est même là qu'il frappe le
plus.

**B est la disposition de la bascule, jamais de l'ouverture.** §7 ter fixe l'ouverture
en A. Tant que `choisir()` proposait B aux ouvertures, aucune carte ne qualifiait et le
plafond de deux se tenait à zéro : une exception que la règle rendait impossible. La
restriction de B à la bascule est ce qui l'en empêche.

B accepte une ligne d'explication jusqu'à 90 signes. Ce qu'il refuse, c'est la paire :
un mot plein cadre et un tableau de deux termes se disputent le même centre.

### Quota de disposition, à l'échelle du lot

**Un carrousel est un carrousel d'images.** La règle ci-dessus se choisit carte par
carte, mais elle se vérifie sur le lot :

**Le quota porte sur les cartes de série**, pas sur le lot entier : une ouverture et une
bascule sont structurellement B ou A, les compter dans le dénominateur fait qu'un deck
de six cartes ne peut satisfaire « 60 % en A » et « au plus 2 en B » à la fois dès
qu'une seule carte tombe en C.

| | Part des cartes **de série** |
| --- | --- |
| **A — tiers bas ancré** | **au moins 60 %**, et la majorité dans tous les cas |
| C — cartouche | au plus 40 % |

B ne compte pas dans ce calcul : il est **réservé à la bascule**, donc **au plus 2 par
deck** et jamais sur une carte de série ni sur une ouverture.

> Cette ligne disait « réservé à l'ouverture et à la bascule » jusqu'au 2026-09-16,
> contre les deux énoncés normatifs qui l'encadrent — « B est la disposition de la
> bascule, jamais de l'ouverture » ci-dessus, et la ligne de §11. `choisir()` suivait
> la moitié périmée. Corrigé dans les deux, moteur et charte, le jour où le carrousel
> `diallo-djallo` a vu son ouverture partir en B et son titre de huit mots déborder
> la fente plus étroite de B — 600 px demandés pour 507 — ce que §1 ter interdit de
> résoudre en rapetissant le titre.

Un lot hors quota **sort en épreuve** avec le motif, et le rapport de rendu nomme les
cartes tombées en C et pourquoi. Ce n'est jamais une faute de composition : c'est le
signe que les images du lot sont trop petites pour du plein cadre, ou que les textes
sont trop longs. Les deux se corrigent dans `structure`, pas dans le moteur.

**Le repli sur résolution est la règle la plus importante du lot.** Une image de
900 px de large en plein cadre 1080 × 1920 est agrandie ×3,6 : le document devient une
texture, et l'argument de la carte disparaît avec lui. Vérifier `naturalWidth` /
`naturalHeight` sur le fichier, jamais une dimension déclarée dans le JSON.

**Corollaire pour `structure` :** une carte destinée à A demande une image d'au moins
**2160 × 2700** (4:5) ou **2160 × 3840** (9:16). En deçà, la carte tombera en cartouche
quoi qu'en dise le `cards.json` — et le quota se dégradera à l'échelle du lot. Le choix
d'image est donc éditorial avant d'être technique.

## 7. Crédits et licences

Bloc de trois lignes, corps 18, encre 3, centré (dispositions centrées) ou aligné à
gauche (A) :

```
{description de l'œuvre} · {auteur} · {année}
{dépôt} · {licence de l'image} · {licence du carrousel ou de la vidéo}
ethniafrica.com · @ethniafrica
```

- La licence de sortie est la **licence virale la plus contraignante du lot**.
  Un lot mêlant domaine public et CC BY-SA 2.0 se diffuse en CC BY-SA 2.0 ;
  un lot mêlant 3.0 et 4.0 se diffuse en 4.0.
- **Aucune note interne sur l'image finie.** « licence à nommer », « série à confirmer »,
  « crédit à compléter » sont des messages à l'opérateur : ils bloquent la publication,
  ils ne s'impriment pas. Si la licence n'est pas connue, la carte ne sort pas.
- En 9:16 le bloc est au-dessus de y = 1620, sinon l'obligation d'attribution
  est masquée par l'interface.

### Quand le document exact n'existe pas — le voisin le plus proche

**Décidé par l'opérateur le 2026-09-16**, en cherchant une photographie des
fourneaux de Douroula pour le sujet Burkina Faso. Commons n'en porte aucune, et
cinq échelons sont revenus vides l'un après l'autre : le site, la commune, la
région, le fleuve, les forgerons du pays.

La règle : **on descend d'échelon en échelon vers le voisin le plus proche du
sujet, et on s'arrête au premier document réellement disponible, qu'on crédite
pour ce qu'il est.** Le voisinage se mesure sur le sujet — le lieu, le peuple, la
langue, la matière — jamais sur la ressemblance de l'image. Un fourneau camerounais
dans une scène sur Douroula reste un fourneau camerounais : le crédit le dira,
et la scène se videra au lieu d'être servie. Un substitut qui ressemble n'est pas
un voisin.

Quand tous les échelons sont vides, deux issues, jamais l'approximation : une carte
sans photographie — disposition B, mot plein cadre (§5) — ou une image générée,
ci-dessous.

### Une image générée est admise, et elle se déclare

**Décidé par l'opérateur le 2026-09-16**, pour une scène dont aucun document libre
n'existe. Elle suit la doctrine déjà écrite pour les Découvertes,
`docs/design/imagery-collections.md`, qui gouverne la génération et **n'est pas
recopiée ici** : stylisée, jamais photoréaliste, **jamais de personne
photoréaliste**, et portant la marque « image générée ».

Sur une carte sociale, le bloc de crédit nomme la génération à la place de
l'auteur et du dépôt, et la licence de l'image est CC BY-SA 4.0, limitée à la part
humaine. Elle entre dans le calcul de la licence de sortie comme toute autre.

**Une image générée ne remplace jamais un document qui existe.** Elle est le
dernier échelon du voisinage, pas un raccourci pour éviter la recherche : une
scène rendue en image générée alors qu'une photographie libre existait est une
scène qui a menti par confort.

---

## 7 bis. Le filigrane

**C'est un filigrane, pas une signature.** Il sert à reconnaître la marque quand la
carte circule hors contexte, et à rien d'autre. Il n'a aucun rôle de composition.

| | |
| --- | --- |
| Hauteur | **30 px** à k = 1 (la moitié de l'ancienne) |
| Couleur | **monochrome**, encre 3 — jamais le lockup en couleurs |
| Opacité | 0,55 |
| Place | **sous** le bloc de crédit, **toujours centré sur la largeur du bloc**, gouttière 16 |

**Il n'est jamais à côté du crédit.** Un lockup posé en regard force le crédit à se
serrer sur la moitié gauche du cadre, et la marque — rang 5 — se retrouve au rang 1
par la seule taille. Sous le crédit, le bloc d'annexe retrouve toute la largeur, se
recentre, et le filigrane ferme la carte au lieu de la disputer.

Le lockup en couleurs de marque est réservé à la bannière de chaîne et aux outros
vidéo, là où la marque **est** le sujet.

---

## 7 ter. L'ouverture et la clôture de série

**Un carrousel et un reel s'ouvrent sur une question et se ferment sur une clôture
unique.** L'ouverture est la vignette : elle décide si quelqu'un regarde. La clôture est
la même pour tous les sujets : c'est la signature, et c'est en la retrouvant à chaque
épisode qu'on finit par l'associer au projet.

### Ce qu'aucune production n'écrit

Ces refus sont des questions d'exactitude, pas de doctrine. Ils valent pour tous les
formats, et la porte du message les vérifie (critères 4 et 5).

- **Trois phrases.** « Avant, on vivait en accord avec le continent » : un âge d'or n'a
  pas besoin d'être vrai pour être attaquable, et l'Afrique d'avant Berlin avait des
  empires, des conquêtes, des traites internes. « Les frontières sont arbitraires » : à
  demi faux, donc attaquable. « Renouer avec le passé » : le sujet passe au passé et la
  rupture est supposée consommée.
- **Aucune conférence, aucune date unique n'est citée comme l'origine des frontières**
  (décidé par l'opérateur le 2026-09-14). La conférence de Berlin a fixé des règles de
  revendication, elle n'a tracé presque aucune ligne elle-même. La formule qui tient est
  « moins de 140 ans » pour les frontières, jamais un lieu et une date uniques.
- **« Mille ans » n'est pas un fait daté.** Une production qui date un nom donne la date
  d'attestation de ce nom.

**Aucune phrase de doctrine n'est exigée**, décidé par l'opérateur le 2026-09-21 : ni
« Ce peuple n'a pas été divisé », ni ligne de vision, ni renversement d'agent. Ces
formules restent celles de la page « À propos » (`purposeChapter`, dans
`src/lib/i18n/copy/about.ts`) ; une production qui ne les écrit pas ne sort pas en
épreuve.

### La typologie du sujet

Le carnet de production fixe cinq **typologies** — peuple, pays, patronyme, lieu,
langue — qui nomment ce que le sujet *est*, l'entité du corpus que « D'où vient le nom
{X} ? » interroge (`docs/plans/production-history-plan.md`). Une sixième, **`mot`**, a
été accordée par l'opérateur le 2026-09-21 pour « ethnie » — un mot du vocabulaire
qu'aucune fiche du corpus ne porte : elle n'a pas de `subjects[]` à résoudre
(`docs/productions/README.md`, « The mot exception »). **La typologie ne choisit plus
aucune clôture** : toutes se ferment sur la même.

### Le reel a un couple unique : sa question et sa clôture

Décidé par l'opérateur le 2026-09-21, en donnant suite à l'essai du 2026-09-17 : « une
question unique remplace les clôtures » de la table par type, supprimée depuis. **Pour un
reel**, quel que soit le type du sujet, patronyme compris :

- **L'ouverture** est la question de §1 ter, « D'où vient le nom « X » ? ». Il n'y a plus
  de patron de titre d'ouverture par type.
- **La clôture est unique.** Elle dit l'objectif du projet et invite l'auditeur à
  partager ce qu'il sait. Texte décidé, **pour la voix et pour la carte** :

> « Notre objectif : raconter l'origine des noms, avec des sources. Vous avez une
> histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica. »

| Élément | Texte |
| --- | --- |
| Carte, titre — le dernier mot en accent | « Notre objectif : raconter l'origine des noms, avec des sources. » |
| Carte, corps | « Vous avez une histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica. » |
| Voix (24 mots) | les deux phrases, mot pour mot |
| Ligne de vision (`source`) | **aucune** |
| Pastille (`appel`) | **aucune valeur posée** : le moteur affiche l'appel par défaut, « ETHNIAFRICA.COM » |

**La carte et la voix disent la même chose**, c'est le principe de §9 bis : l'image dit
déjà mot pour mot ce que la voix dit, donc la clôture ne porte pas de légende.

**Ce que cette clôture ne porte plus.** Le renversement propre au type n'y est plus, et
la phrase de doctrine de la page « À propos » (`purposeChapter.claim`, dans
`src/lib/i18n/copy/about.ts`) n'y est plus non plus : la doctrine reste portée par la
page « À propos ». Deux champs sont retirés de la carte de clôture d'un reel :

- **`source`**, la ligne de vision. Sans `source` le moteur ne pose ni la ligne ni sa
  plaque (`if vision is not None`, `ethni_compose.py`).
- **`appel`**, le compte chiffré « {n} peuples · ethniafrica.com ». Le nombre était
  écrit en dur dans la carte et n'est pas relu en production. Sans `appel`, la
  pastille est l'adresse par défaut (`APPEL_DEFAUT`).

Les deux comportements existaient déjà ; la clôture unique en dépend, donc ils sont
tenus par des tests (`test_the_reel_closing_draws_no_vision_plate_and_the_default_call`,
`test_the_reel_closing_passes_the_gates_without_vision_or_call`). Mesurée composée,
la clôture remplit exactement son budget de §9 bis : trois lignes de titre et deux de
corps, 375 px sur 380. Une phrase de plus ferait déborder le corps.

**« Partagez-la » est un impératif**, et le contrôle de lecture de la narration
(`social/tools/narration/check-narration.mjs`, PR #1221) le relèvera : c'est une
exception voulue par l'opérateur, pas un défaut à corriger dans la carte.

**Ce qui est retiré, pour tous les formats** : la table par type de contenu, ses colonnes
de titre et de corps de clôture, et son patron de titre d'ouverture. Elle a été supprimée
le 2026-09-21 ; l'historique de ses décisions se lit dans l'historique git de ce
fichier. **La clôture du carrousel est celle du reel.** Les interdits ne bougent pas :
aucune datation, ni « Berlin » comme auteur des lignes, ni « mille ans » comme un fait —
la clôture ci-dessus n'en porte aucun.

**La loi du titre (§1 ter) et la clôture unique valent pour tous les reels.** Un reel de
patronyme les prend comme les autres. Un reel **sans carte de
clôture** — dont la dernière carte n'est pas une `bascule` — peut encore exister : le
montage ne juge alors pas la narration contre une clôture qui n'existe pas
(`carte_de_cloture`, `ethni_montage.py`), et pose la carte de fin après la dernière
légende.

**La carte de fin n'entre qu'après la dernière phrase parlée.** Elle était calée sur la
ligne de vision, retrouvée dans la narration ; sans ligne de vision — la clôture unique,
ou un reel sans clôture — le repli la posait au *début* de la dernière légende, donc
par-dessus la phrase que la clôture existe pour dire. Elle attend désormais la fin de
cette légende (`fin_debut`, `ethni_montage.py`). Une clôture qui porte une ligne de
vision que la voix ne dit pas garde l'ancien repli : c'est un lot à reprendre dans
`structure`.

> **Décisions ouvertes — à trancher par l'opérateur.**
> 1. La ligne de vision n'est plus exigée sur la clôture d'aucun format ni sur l'ouverture
>    d'un carrousel. L'ouverture d'un reel la porte encore quand la carte la porte : la
>    retire-t-on aussi ?
> 2. La carte de fin d'un reel sans carte de clôture : elle entre après la dernière
>    légende. À garder ou à retirer ?
> 3. La durée de la carte fixe sous la clôture unique n'est pas mesurée : 24 mots
>    dictés, environ 7 s d'après la mesure de l'ancienne clôture.

### La narration du reel : un gabarit par catégorie

Décidé par l'opérateur le 2026-09-21. Entre la question d'ouverture et la clôture
unique ci-dessus, **la narration d'un reel suit le gabarit de sa catégorie** —
peuple, pays, patronyme, lieu ou langue — sans une scène de plus ni de moins :
ouverture, inventaire de deux à quatre noms, un bloc par nom (le nom de
l'intérieur d'abord), classement, synthèse, clôture. Le gabarit, ses phrases fixes
et ce qui change d'une catégorie à l'autre sont écrits une seule fois, dans
`.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md` ; le
contrôleur est `social/tools/narration/check-gabarit.mjs`, et le carrousel n'est
pas concerné. Cette spécification ne recopie pas le gabarit : une deuxième copie
est celle qui dérive.

### Le carrousel a un seul gabarit

Décidé par l'opérateur le 2026-09-21. **Un carrousel « nom de X » suit le même ordre pour
les cinq typologies** et se ferme sur la clôture unique du reel :

1. **Accroche** : la question du mythe que le public tient. Pour le Ghana : « Le nom du
   Ghana actuel vient-il de l'ancien empire du Ghana ? »
2. **Réponse au mythe** : le verdict, puis ses limites.
3. **Cadrage** : un nom porte plusieurs appellations ; on cherche celle que le sujet se
   donne.
4. **Inventaire** : trois ou quatre appellations au plus.
5. **Une fiche par appellation** : formes et variantes, qui l'a donnée, première
   attestation, version principale, seconde version, statut.
6. **Classement** : les appellations rangées en trois statuts.
7. **Morale** : elle répond à la question de l'accroche, sans jugement, dit qu'il y a eu
   plusieurs appellations, puis la nuance.
8. **Clôture** : la clôture unique de la section précédente, mot pour mot.

Le détail — la fiche, les statuts, ce qui change selon la typologie, les règles de
rédaction et cinq exemples fictifs qui sont le modèle à reproduire — vit une seule fois,
dans `.claude/skills/ethniafrica-structure/references/gabarit-carrousel-nom.md`.

**La table par type de contenu est supprimée** (2026-09-21), pour tous les formats : ses
colonnes de titre et de corps de clôture, son patron de titre d'ouverture et ses sous-cas.
« Ce peuple n'a pas été divisé » et les autres lignes de renversement ne servent plus à
aucune production. L'historique de ces décisions se lit dans l'historique git de ce
fichier.

**Un sujet sans mythe sourcé n'a pas de carrousel.** N'en invente pas un pour remplir
l'accroche : une question dont la pièce ne paie pas la réponse est un appât.

### La carte d'ouverture

Disposition **A**, image plein cadre. Trois blocs pour un carrousel, quatre pour un reel
qui porte encore la ligne de vision :

1. **Bandeau et rang**, première rangée de la colonne.
2. **Le titre du sujet.** Carrousel : la question du mythe, pas une chute annoncée. Reel :
   « D'où vient le nom « X » ? » (§1 ter). Un seul mot en accent, le dernier de
   préférence.

   **Budget : deux lignes composées, mesurées — jamais un compte de caractères.** Le
   nombre de caractères tenant sur une ligne dépend du corps et de la mesure : 18 à
   106 px sur 888 px, 22 à 88 px. L'ancien patron « 140 ans de frontières. Mille ans de
   noms. » faisait 41 caractères et tenait en deux lignes à 88 px ; un budget de 36
   signes l'aurait refusé à tort. Sa forme corrigée (2026-09-14), « Moins de 140 ans
   de frontières. Plus de mille ans de noms. », fait 58 caractères : à 22 par ligne
   elle en demande trois, et le moteur la rendra au rapport. Un titre de ce registre
   se raccourcit avant le rendu, jamais en revenant à la forme non qualifiée. Le moteur compose le titre et **compte les lignes rendues** ; s'il en
   fait plus de deux, il descend d'un cran de corps jusqu'à 80 px, puis rend le titre
   au rapport plutôt que de le dessiner sur quatre lignes.

   Pourquoi deux lignes et pas trois : l'aplat de lisibilité couvre toute la colonne,
   donc chaque ligne de titre en trop couvre une tranche de gravure. À quatre lignes, la
   colonne remplit 74 % de la carte et A montre moins d'image que le repli en cartouche,
   ce qui vide §6 de son objet. C'est la même leçon que `colonne_A_tient()` et que le
   plafond de sous-titre : **on mesure le composé, on ne compte pas les signes.**

   **Invariant mesurable — et il se mesure sur la partie VISIBLE de la carte.** La
   colonne d'une carte A doit couvrir une fraction plus faible que la bande d'une
   cartouche du même format, les deux rapportées à la **hauteur visible** : toute la
   carte en 4:5, et **0 → 1620 en 9:16**. En deçà de cette ligne vit l'interface de la
   plateforme : l'aplat qui s'y étend n'assombrit aucune surface de composition, et le
   compter fait échouer un rendu approuvé.

   **Corollaire de construction, en 9:16 : la colonne s'arrête à 1529**, pas à la base
   de la carte. Un aplat plat `rgba(18,14,10,.95)` la prolonge de 1529 à 1920 pour
   garder le profil monotone. Sans cela l'aplat de lisibilité se peint sur les 391 px
   d'interface où aucun texte ne vit, et l'invariant ne garde plus qu'un point de
   marge : une ligne de crédit de plus fait basculer l'ouverture en cartouche, ce qui
   érode le quota que la règle existe pour protéger.

   Mesuré sur les rendus de référence, base 1350 en 4:5 et **1620** en 9:16 :

   | | Colonne A | Bande cartouche | Marge |
   | --- | --- | --- | --- |
   | 4:5 | 631 px · 46,7 % | 662 px · 49,0 % | 2,3 pts |
   | 9:16 | 601 px · 37,1 % | 710 px · 43,8 % | 6,7 pts |
3. **Aucune ligne de vision sur l'ouverture d'un carrousel** (2026-09-21). Sur
   l'ouverture d'un reel, le moteur la pose encore quand la carte la porte : la retirer
   est une décision ouverte (voir plus haut).
4. **L'indication de défilement** de §8 — carrousel uniquement.

Pas de chiffre, pas de paire, pas de source : une ouverture n'a rien à prouver encore.

> **Les ouvertures qui annonçaient le sujet en le nommant sont périmées** (« Les Peul
> vivent dans douze pays ») : elles posent la question du mythe. Le développement
> commence à la deuxième carte.

### La carte de clôture

**Un carrousel et un reel prennent la même clôture unique** (« Le reel a un couple
unique » ci-dessus), mot pour mot : le titre est la première phrase, dont le dernier mot
passe en accent, et le corps est la seconde. Ni ligne de vision, ni `appel`, ni `pivot`,
ni renversement d'agent.

Disposition **A** ou **B**. Le titre, puis le corps, puis la pastille de §8.

**Un panneau de cartouche est une boîte à hauteur fixe** : `top` et `bottom` posés,
rien à comprimer. Deux phrases d'affichage y font cinq lignes, soit 572 px sur les
747 disponibles, et le pied sort du cadre avec l'attribution. Le titre d'une clôture
en cartouche tient donc dans le budget mesuré de deux lignes composées : il se
**mesure** avant d'accepter un cartouche.

> `flex:1; min-height:0` sur un intercalaire **ne comprime rien** : un élément vide
> mesure 0 et ne peut que pousser vers le bas. Pour épingler un pied dans une boîte
> à hauteur fixe, c'est `margin-top:auto` **sur le pied lui-même**.

**Ce qui est interdit sur une clôture :** un appel à l'action seul. Une clôture qui ne
dit que « ethniafrica.com » a laissé le lecteur sans la raison d'y aller. Et
« Berlin » comme celui qui a tracé les lignes, ou « mille ans » posé comme un fait
(voir « Ce qu'aucune production n'écrit »).

---

## 8. Repères d'interface

- **Indication de défilement**, couverture de carrousel uniquement : libellé
  « Fais défiler » (26 / 800 / maj. / interlettre .12em, accent) suivi de trois
  chevrons `›` Anton 40 px, opacités 0,35 / 0,65 / 1. Le dégradé donne le sens
  sans animation, donc il survit à l'export image.
- **Appel à l'action**, dernière carte uniquement : pastille cerclée, bordure 2 px
  accent, rayon 999, padding 20/38, texte 27 / 800 / maj.
- Les deux repères sont volontairement distincts : l'un dit *continue*, l'autre *sors*.
- **Rang** `01/05`, accent, **sur toutes les cartes quelle que soit leur disposition.**
  Une carte A le porte dans la première rangée de sa colonne ; une carte en bande le
  porte dans son en-tête, qui a la **même forme** : `display:flex;
  justify-content:space-between` à l'**encart de la colonne** (96 px en 4:5, 104 px en
  9:16), libellé **ferré à gauche**, rang à droite. Un en-tête qui n'est qu'un libellé
  centré n'a pas d'emplacement pour le rang, et la série se termine sans son `04/04`.

  **Ni grille `1fr auto 1fr`, ni libellé centré.** La grille centre le libellé sur une
  carte dont tout le reste est ferré à gauche : deux alignements sur une carte, ce que
  la charte interdit — et elle laissait 8 px entre le libellé et le rang là où le
  `space-between` en laisse 67.

---

## 9. Sous-titres vidéo

- Deux lignes maximum, **coupées sur les groupes de souffle**, jamais tous les N mots.
  « Onze villes du Congo / portaient le nom d'un Belge » — pas « Congo portaient le ».
- Nunito Sans 800, corps 44–46, encre 1, **sur plaque opaque** —
  pas de contour noir sur une police d'affichage.
- Bande réservée entre la colonne de contenu et le pied. Le pied remonte d'autant.
- Le mot pivot de la phrase peut passer en accent dans la plaque : un seul par carte.

---

## 9 bis. Le gabarit vidéo — une seule disposition

The fixed layout below documents the legacy image-deck renderer. New videos use
[scene composition](../../../social/harness/SCENES.md); its scene-specific layouts
share the typography, palette and safety constraints without inheriting the old
montage's image slots or paragraph cuts.

**La vidéo n'est pas un carrousel qui bouge.** Un carrousel est du contenu à lire, une
vidéo est du contenu visuel avec une narration parlée. Le gabarit carrousel, porté tel
quel en 9:16, produit neuf défauts recensés sur un montage réel : pagination inutile,
crédit au milieu du cadre, nom de série sur chaque image, tout centré, voile écrasant,
texte qui monte et descend selon le sous-titre, chiffre chevauchant sa légende, grands
vides noirs, cartouche à séparation franche.

### Ce que la vidéo retire

| | Carrousel | Vidéo |
| --- | --- | --- |
| Dispositions | A · B · C | **A seule**, tiers bas ancré |
| Rang `03/08` | sur chaque carte | **aucun** — on ne feuillette pas une vidéo |
| Nom de série | sur chaque carte | **ouverture et clôture seulement** |
| Alignement | ferré à gauche ou centré | **ferré à gauche**, toujours |
| Crédit | dans la colonne | **épinglé au bas du cadre**, une ligne, 17 px |
| Indication de défilement | oui | aucune |

**Ni cartouche, ni mot plein cadre.** Une bande d'image avec un aplat sous elle crée une
séparation franche qui, en mouvement, se lit comme une coupure de montage. L'image
occupe tout le cadre sur toutes les images clés.

### Les quatre emplacements, et ils sont fixes

C'est la règle la plus importante du gabarit vidéo : **une position ne change jamais
parce qu'un autre bloc apparaît ou disparaît.** Un titre qui descend quand le sous-titre
s'efface se lit comme un défaut de rendu.

| Emplacement | Ordonnée | Contenu |
| --- | --- | --- |
| Nom de série | `top: 131` | ouverture et clôture seulement |
| Titre | `top: 1050`, hauteur **220**, ancré en bas | chiffre + précision, ou titre Anton **76 px** sur deux lignes |
| Narration | `top: 1300`, hauteur **190** | la plaque de sous-titre, **réservé même vide** |
| Crédit + filigrane | `bottom: 44` | 17 px, **une ou deux lignes**, filigrane à droite, opacité 0,72 |

La clôture est la première exception : titre à `top: 890` sur 380 px, et son emplacement
bas fait 270 px pour porter la plaque **et** la pastille.

**L'ouverture est la seconde**, et c'est le §1 ter qui la fixe : titre à `top: 560` sur
720 px, au rang couverture (130 px en 9:16), la rampe du voile remontée de 840 à 520
pour venir sous lui, et l'emplacement de narration laissé vide pendant 1,5 s. Rien ne
bouge pour autant : les deux emplacements sont fixes pour toute la scène, et la légende
qui arrive ensuite se pose dans une bande déjà réservée.

> Le filigrane est à **0,72**, non à 0,55 comme en carrousel : posé sur un aplat de nuit
> à 0,93 plutôt que sur une image, il s'éteint à l'opacité du carrousel.

**L'emplacement de narration est réservé quand le sous-titre est absent.** Le moteur ne
le supprime pas : il le laisse vide. Un emplacement vide ne coûte rien et garantit que
rien ne bouge.

**Un emplacement à hauteur fixe déborde vers le HAUT.** `justify-content: flex-end` plus
un enfant à `min-height: auto` : rien ne se comprime, et le dépassement sort par le
haut, dans la partie où le voile est encore en rampe. Mesuré : onze signes ajoutés à un
titre d'ouverture l'ont fait passer de deux lignes composées à trois — 285 px dans un
emplacement de 220 — et sa première ligne s'est retrouvée 65 px au-dessus, à alpha 0,43
et 2,63:1. **Toute édition de copie se remesure**, et le contrôle est
`slot.scrollHeight <= slot.clientHeight` **et** `titre.top >= slot.top`.

> Le crédit peut courir sur **deux lignes**. Une attribution complète vaut mieux qu'une
> ligne unique obtenue en coupant le dépôt ou la licence : à 17 px, deux lignes font
> 49 px et restent du mobilier.

### Le voile, et ce que « très allégé » veut dire

Un voile allégé ne se fabrique pas en diluant l'alpha **sous** le texte — c'est la faute
mesurée sur le premier mock : à alpha 0,22, le « 1670 » doré sur parchemin tombait à
0,70:1, soit invisible. L'allègement vient de **la position de la rampe** : elle démarre
à `y = 810`, donc **les 42 % hauts du cadre ne portent aucun voile du tout**.

**Les alphas de la vidéo, et ce sont des planchers.** Ils sont sous ceux du carrousel
parce que le texte y est plus gros et que l'image est le sujet — mais ils restent
dérivés d'une mesure, pas d'un goût :

| Ordonnée | Alpha | Ce qu'il tient |
| --- | --- | --- |
| 840 → 1050 | 0 → **0,72** | rien ; c'est la rampe |
| 1050 | **0,72** | titre Anton ≥ 76 px, **en encre 1** |
| 1198 | **0,82** | précision 34 px, en encre 1 |
| 1450 | 0,88 | plaque de narration (qui a son propre fond) |
| 1920 | **0,93** | crédit 17 px en encre 2 |

Le 0,72 tient parce que la **luminance réelle** sous le bloc de titre est de 0,23 et non
0,985 : le pire cas du corpus n'est pas le pire cas de chaque carte. C'est pourquoi cet
alpha se vérifie **carte par carte, sur les pixels composés**, et non par une table.

**À 0,72, tout le texte d'affichage de la vidéo est en encre 1** — chiffre inclus. Le
doré ne survit pas sous 0,84 (§4) : il se réfugie dans la plaque de narration, où il
marque un mot sur un fond opaque. La plaque du haut, elle, monte à **0,95 / 0,93 sur ses
52 premiers pour cent**, parce que le nom de série est du texte de corps sur gravure pâle
et qu'il lui faut 0,92.

**Le 0,93 du bas n'est pas négociable** : le crédit est en encre 2 à 17 px, et à 0,90 il
tombe à 3,78:1. C'est le bloc que tout l'appareil de portes existe pour protéger.

**Ordre des couches en haut de carte : la plaque d'abord, le nom de série ensuite.** Une
plaque déclarée après le libellé le peint par-dessus, et le libellé s'assombrit d'autant
— défaut invisible à la relecture du code, évident à l'écran. Mais l'ordre ne règle que
la couche : **le plateau de la plaque doit couvrir l'ordonnée du libellé**, 131 → 164,
sinon c'est le fond sous lui qui manque de voile, et aucun z-index n'y change rien.

### Le sous-titre

§9 s'applique, avec deux ajouts :

- **52 px**, gras 800, sur plaque `rgba(18,14,10,.9)`, rayon 16, deux lignes maximum.
  À 44 px le sous-titre se lit mal sur un téléphone tenu à bout de bras.
- **Un mot ou un membre de phrase passe en accent dans la plaque** — un seul par image
  clé. C'est ce qui fait qu'un sous-titre parlé porte aussi une hiérarchie visuelle.

### La clôture dit l'objectif, jamais un lien seul

« Vous pouvez trouver les peuples sur EthniAfrica » n'est pas une clôture, c'est une
adresse. La clôture dit, dans cet ordre : son titre, son corps, puis le lien.
**Un reel et un carrousel prennent la clôture unique de §7 ter** (2026-09-21), qui n'a ni
ligne de vision ni compte chiffré : le lien y est la pastille par défaut.

> **Notre objectif : raconter l'origine des noms, avec des sources.**
> Vous avez une histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica.
> ETHNIAFRICA.COM

Un carrousel prend la même clôture unique, en dernière carte, après la morale (§7 ter).
Il n'y a plus de titre de clôture propre au type de contenu, plus de ligne de vision et
plus de compte chiffré.

**Le dernier mot du titre passe en accent, et lui seul.** L'ancienne clôture vidéo mettait
les deux phrases d'un renversement au titre et une datation au corps ; elle est retirée,
parce que cette datation écrivait « Berlin » comme auteur des lignes et « mille ans »
comme un fait. **Aucune datation sur une clôture.**

**Budget de la clôture :** titre Anton 80 px sur trois lignes (259 px) + corps deux
lignes (96 px) = 375 px, emplacement à `top: 890` sur 380. La rampe du voile se recale
d'autant — `top: 590`. La clôture unique du reel, mesurée le 2026-09-21, remplit ce
budget **exactement** : trois lignes de titre, deux de corps, 375 px sur 380
(`test_the_reel_closing_wording_fits_the_closing_slots`). Une phrase de plus déborde.

### La carte de fin suit la clôture, et n'arrive que sur la phrase qui l'appelle

La carte de fin — logo animé, identifiants de réseaux — a été **retirée une fois, et
c'était l'ordre qui était faux, pas la carte.** Elle était placée sur un dégagement
calculé contre la bande de légende, donc elle tombait sur la clôture : elle ne s'y
ajoutait pas, **elle la remplaçait**, et un montage se terminait sur une adresse.

Remise dans le bon ordre, elle a sa place. Ce qui la gouverne tient en trois règles :

1. **Elle suit la clôture.** Jamais pendant, jamais à sa place. L'argument passe en
   entier avant elle. Une garde le vérifie : son repère ne peut pas précéder le début
   de la scène de clôture.
2. **Son repère est une phrase, pas un calcul.** Elle entre sur la **dernière phrase
   parlée** — celle qui dit où aller. Le dégagement calculé n'a plus d'objet : une
   clôture ne réserve aucune bande de légende, elle porte sa vision composée.
3. **Elle dure ce que son animation demande**, et rien de plus. C'est le seul endroit
   du gabarit où le logo est en couleurs de marque et où les identifiants de réseaux
   paraissent.

**Les identifiants restent aussi dans la description de la publication**, où ils sont
cliquables. Gravés dans l'image ils ne le sont pas : la carte de fin dit qu'il y a un
ailleurs, elle n'y emmène personne.

> **Réserve consignée.** L'actif approuvé est sur fond parchemin, quand le film est en
> thème de nuit, et il porte « Le vrai nom de chaque peuple », qui est un slogan là où
> la clôture est une phrase décidée par l'opérateur. C'est accepté parce que la carte arrive
> **après** que la clôture a été dite et montrée : elle signe, elle n'argumente plus.
> Une version en thème de nuit reste le bon objectif.

### La voix finit où l'image finit

**Le script de narration se termine sur la clôture, pas sur une adresse.** « Sur
EthniAfrica on documente d'où viennent les noms » est une adresse ; un montage dont
l'image dit la clôture et dont la voix dit l'adresse se contredit sur sa dernière
seconde.

**Pour un reel, la fin parlée est la clôture unique, mot pour mot** — depuis le
2026-09-21 (§7 ter). La voix dit le titre puis le corps de la carte, et rien d'autre :

> Notre objectif : raconter l'origine des noms, avec des sources. Vous avez une
> histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica.

Avant cette date, la fin parlée disait le renversement propre au type de contenu, puis
la sortie. Ce renversement n'existe plus, pour aucun format.

**Ce qui n'est écrit que sur la carte ne se dit pas à la voix.** Il n'y a plus de ligne de
vision sur une clôture : ce que la voix dit, c'est le titre et le corps de la carte, et la
carte de fin n'entre qu'après le dernier mot.

| Fin parlée | Mots | Carte de clôture à l'écran |
| --- | --- | --- |
| renversement · datation · vision · sortie | 58 | **21,4 s** |
| renversement · sortie | 23 | **7 s** |
| objectif · invitation (clôture unique du reel) | 24 | **≈ 7 s — estimé** au débit de la ligne précédente, pas encore mesuré |

Les deux premières lignes sont mesurées sur l'ancienne clôture, dont le renversement
faisait dix mots. La fin parlée d'un lot sur un peuple en fait vingt-sept, du même
ordre que la seconde ligne : la durée se mesure sur le lot, elle ne se recopie pas de
ce tableau. La troisième reste à mesurer sur le premier reel rendu avec la clôture
unique.

Vingt secondes sur une image fixe, c'est une image qu'on quitte. La clôture doit
être aussi brève que l'ouverture.

**La clôture ne porte pas de légende, et c'est pour cette raison.** L'image dit déjà
mot pour mot ce que la voix dit : une légende par-dessus serait la troisième copie de
la même phrase. Partout ailleurs la légende est due, parce que l'image ne dit pas ce
qui se dit.

### Scene timing follows meaning and reading comfort

For every new video, use the [scene workflow](../../../social/harness/SCENE-PRODUCTION.md).
Narration organizes ideas; paragraphs do not command cuts. A scene lasts as long as
its explanation and reading comfort require. One map can span several sentences
while camera, regions, points, routes and dates evolve. A new scene clarifies a
change of place, period, evidence or idea. There is no fixed four-second turnover,
image count derived from duration, or mandatory paragraph-to-scene mapping.
Carousel rules remain independent.

The older image-deck renderer retains its historical timing implementation only
for replaying archived work. Its slots and paragraph markers are not authoring
instructions for new videos. Scene plans preserve the palette, type roles, safe
areas, credits, captions and visible uncertainty; publication uses the reviewed
[clean-delivery workflow](../../../social/harness/SCENE-RELEASE.md).

**Un parallèle se montre, il ne se dit pas.** Une image peut porter un `surtitre` —
« Pendant ce temps, en France : 1889, la tour Eiffel est inaugurée » — affiché tant que
cette image est à l'écran, dans l'emplacement du nom de série (`top: 131`), qu'aucune
scène entre l'ouverture et la clôture n'occupe. Il n'entre pas dans `narration.fr.txt`
et ne change donc ni la voix, ni l'alignement, ni le début des scènes. La porte 3 le lit
comme tout champ imprimé.

**Le rythme des pauses se règle par sujet.** La passe audio complète chaque silence
jusqu'à une pause minimale — virgule 0,20 s, phrase 0,40 s, paragraphe 0,48 s, question
en fin de paragraphe 0,64 s, atterrissage de l'accroche 0,76 s, en secondes finales.
Un sujet coupé pour un rythme plus rapide les resserre dans `production.json` →
`"pauses": {"virgule": …, "phrase": …, "paragraphe": …, "question": …, "accroche": …}` ;
une clé absente garde sa valeur. Sans ce réglage, la passe rallongeait les silences
qu'on venait de resserrer à l'écoute.

---

### Réserve assumée sur le crédit

Le crédit est épinglé à `bottom: 44`, donc **sous l'interface de TikTok et de Reels**.
C'est un choix de l'éditeur : le crédit est du mobilier légal, pas de la lecture, et le
sortir de la composition vaut mieux que de l'y voir. L'attribution reste dans le
fichier, dans la description de la publication, et visible sur les plateformes dont
l'interface est plus basse. **Cette réserve est consignée pour ne pas être redécouverte
comme un défaut.**

### Ce qui reste à faire

Les animations. Le mock ne fixe que les positions : entrée du titre, entrée du
sous-titre, transitions entre séquences. §9 et le brief vidéo portent la cadence.

---

## 10. Schéma `cards.json` attendu

**Optional musical profile:** `profil: "memoires-sonores"` adds the six ordered
`etape` values and `musique` production notes described in
[MEMOIRES-SONORES](MEMOIRES-SONORES.md#production-handoff). The renderer reads
that profile for validation, series identity and TikTok/Instagram-only delivery.
Use `ethni_carrousel2.py --brief memoires-sonores` to read the current guide and
obtain the empty six-card scaffold. Decks without `profil` keep this schema's
existing behaviour.

```json
{
  "campagne": "mercator-taille",
  "pilier": "La carte cachée",
  "accent": "ocre",
  "fond": "nuit",
  "licence_sortie": "CC BY-SA 2.0",
  "cartes": [
    {
      "rang": 1,
      "role": "ouverture",
      "titre": "L'Afrique n'a pas sa vraie taille",
      "chiffre": false,
      "precision": "sur la carte de ta salle de classe",
      "punchline": "Trois chiffres, et une carte qui te trompe sans mentir",
      "corps": "",
      "source": "",
      "image": {
        "fichier": "01-couverture-carte-murale-bacon-recadree.jpg",
        "w": 3200, "h": 4000,
        "cadrage": "50% 40%",
        "identite": "une carte murale du monde en projection de Mercator, édition scolaire britannique",
        "credit": "G. W. Bacon, Londres, v. 1906",
        "depot": "Bibliothèque nationale du pays de Galles",
        "licence": "domaine public"
      },
      "paires": null,
      "pivot": null,
      "titre_camps": null,
      "coupe": null,
      "disposition": "auto"
    }
  ]
}
```

`disposition` accepte `auto`, `A`, `B`, `C`. `auto` applique §6.

`images` — **vidéo seulement, facultatif** — liste, dans l'ordre, les images d'une scène
qui en porte plusieurs (§9 bis, legacy image-deck replay).
Chaque entrée a exactement la forme de `image` : `fichier`, `w`, `h`, `cadrage`,
`identite`, `verifie`, `credit`, `depot`, `licence`, plus un `surtitre` facultatif,
affiché avec cette image et jamais dit. **La première présente le sujet de la scène.** Sans `images`, la scène garde son `image` unique : tous les decks écrits
avant le 2026-09-14 se rendent sans changement. La licence de sortie se calcule sur
toutes les images du lot.

`image.identite` **décrit ce que l'image montre**, en une phrase, sans nommer son
auteur ni sa licence. C'est ce que la porte 2 compare au crédit : sans lui, la porte
la plus utile du lot s'abstient. Champ obligatoire pour tout nouveau sujet.

`paires` porte le bloc de §3 bis : une liste de couples `{terme, glose}`, deux à quatre.
`null` quand la carte n'en a pas. **Le champ `accent` d'un terme n'existe pas** : la
couleur est positionnelle — premier terme en encre 1, second en accent.

**Une carte porte `corps` et `paires` ensemble, et c'est la forme normale** : la paire
montre l'équivalence, le corps dit d'où elle vient. Les 41 cartes à paire en portent
les deux. L'exclusion mutuelle écrite plus haut était une erreur de ma part, reprise de
la contrainte `corps_paires` de la vidéo, où le tableau *remplace* le corps parce qu'il
n'y a pas la place pour les deux. En image fixe, il y a la place.

`pivot` est le mot — ou le membre de phrase — qu'une plaque passe en accent : la
plaque de sous-titre sur une scène vidéo, la plaque de vision sur une clôture.
**Un seul par carte.** Le moteur ne le déduit jamais : aucune règle ne dit quel
mot d'une phrase porte son basculement. `null` est une réponse valide et veut dire
« aucun accent sur cette carte », pas « à décider plus tard ». Obligatoire sur
toute scène vidéo.

`titre_camps` nomme les deux camps du titre pour les colorer comme la paire —
`{"un": "angolais", "deux": "brésilien"}`. Les mots ne se déduisent pas du titre : ils
sont écrits dans `structure`. **Champ facultatif, jamais bloquant** : sans lui le titre
reste en encre 1, ce qui est correct, seulement moins parlant. Il se remplit deck par
deck au moment de rendre, comme `image.identite`.

`coupe` force les retours à la ligne d'un titre. `null` laisse le moteur couper sur la
mesure. Ne l'employer que là où la coupe **porte du sens** — une énumération dont les
groupes ne doivent pas se mélanger. Une coupe posée pour l'esthétique se périme au
premier changement de format.

**Quand `chiffre` est `true`, `titre` n'est plus un titre : c'est le contenu du
rôle « Chiffre / mot d'accent »** (§3, Anton 216 px, **interligne 0,84**, aucune
majuscule forcée — voir le tableau des rôles). Cet interligne est calibré pour
une seule ligne courte, un nombre ou un mot d'accent (« 776 », « Nzema ») ; posé
sur une phrase entière, il enchaîne un titre sur trois lignes qui se chevauchent
lettre sur lettre — mesuré le 2026-09-14 sur `zokou-gbeuly`, où `titre` portait
« Il naît en 1835, à l'ouest. » à la place d'un simple « 1835 ». La phrase
descriptive va dans `precision` (Nunito 36 px, casse libre) ou dans `corps`,
jamais dans `titre` d'une carte à chiffre. `qui-a-nomme-la-cote-divoire` porte
le même défaut sur plusieurs cartes (`titre` y est une phrase complète malgré
`chiffre: true`) et n'a jamais été rendu en image pour le révéler — à corriger
avant son premier rendu.

---

## 11. Liste de contrôle avant rendu

- [ ] Une seule police d'affichage sur la carte.
- [ ] Un seul élément en accent.
- [ ] **Le corps est au moins 1,6 fois le crédit.**
- [ ] **Le filigrane est monochrome, à 30 px, sous le crédit — pas à côté.**
- [ ] **Aucune plaque ni boîte sur une image** : le voile tient le texte, ou l'image
      ne convient pas.
- [ ] **Aucun voile visible comme une forme** — halo, disque, tache.
- [ ] **Le voile est un enfant de la colonne** (`bottom:100%`), jamais une ordonnée
      estimée. Aucune cote de voile codée en dur.
- [ ] **Une carte plein cadre porte un seul voile, et son alpha ne redescend jamais.**
- [ ] **La colonne d'une carte A couvre moins que la bande d'une cartouche**, les deux
      rapportées à la hauteur **visible** (toute la carte en 4:5, 0–1620 en 9:16).
- [ ] **Titre d'ouverture : deux lignes composées**, comptées au rendu et non en signes.
- [ ] **Le rang est présent sur chaque carte**, A comme cartouche comme B.
- [ ] **Un seul alignement par carte** — bandeau, titre, corps, action et crédit
      obéissent au même choix, ferré à gauche ou centré, jamais les deux.
- [ ] **Profil de luminance de ligne monotone**, ou excursion sous 25 niveaux.
- [ ] **Aucun filet vertical de pleine hauteur** le long d'une colonne.
- [ ] **Une paire porte son `→` et une glose par terme.**
- [ ] **Au moins 60 % des cartes de série en A**, au plus 40 % en C ; B au plus 2 par
      deck et jamais sur une carte de série.
- [ ] **Le choix de A repose sur une colonne mesurée**, pas sur un compte de signes.
- [ ] **Le contenu tient entre le bas de la bande et le pied** — mesuré sur les
      enfants, pas sur le bloc (§5C).
- [ ] Le contenu occupe le cadre ; le pied est épinglé.
- [ ] Aucune image agrandie plus de ×2 ; sinon repli sur C.
- [ ] Contraste ≥ 4,5:1 mesuré **sur les pixels réels** sous le voile, pas estimé —
      **y compris sur la ligne de crédit**, qui est celle qui passe le moins.
- [ ] **L'annexe est en encre 2, pas en encre 3** (plafond 4,94:1, voir §3).
- [ ] En 9:16, rien de lisible sous y = 1620.
- [ ] **La miniature est au rang couverture, jamais comprimée, huit mots au plus,
      l'accent sur le dernier** (§1 ter).
- [ ] **Le post ne part que sur les réseaux que §1 bis donne à son format.**
- [ ] La licence de sortie est celle du lot, calculée et non recopiée.
- [ ] Aucune note interne visible sur l'image.
- [ ] Le crédit nomme le document réellement affiché.
- [ ] **Reel : le titre d'ouverture est « D'où vient le nom « X » ? »** (§1 ter) et la
      clôture est la clôture unique de §7 ter ; image de clôture propre au sujet ; ni
      ligne de vision ni compte chiffré sur cette clôture.
- [ ] **Carrousel : l'accroche est la question du mythe, et la deuxième carte y
      répond** ; les cartes suivent l'ordre du gabarit (§7 ter, « Le carrousel a un
      seul gabarit »).
- [ ] **B n'est jamais une ouverture.**
- [ ] **Carrousel : la morale répond à la question de l'accroche, sans jugement, puis
      la dernière carte est la clôture unique de §7 ter**, mot pour mot, sans ligne de
      vision ni compte chiffré. Une clôture n'est jamais un appel à l'action seul.
- [ ] **Vidéo : la dernière image EST la clôture** (un reel sans carte de clôture
      finit sur sa dernière carte). Aucune carte d'outro, aucun mur
      d'icônes, aucun fond parchemin après elle.
