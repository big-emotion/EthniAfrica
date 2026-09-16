# Gabarits sociaux EthniAfrica — spécification de reproduction

Version 1 · 2026-09-10
Cible : `ethni_carrousel2.py` → `ethni_compose.py` (images) et `ethni_audio.py` →
`ethni_montage.py` (vidéo), sous `social/harness/`.
Ce document suffit à reproduire les gabarits au pixel près sans lire le HTML.

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

**Chaque réseau reçoit le format qui y marche, et seulement lui.** Décision de
l'opérateur du 16 septembre 2026, sur la mesure du 15. La règle vaut pour toute
production à venir : un post ne part pas sur un réseau que sa ligne ne lui donne
pas.

| Réseau | Reçoit | Ne reçoit pas | Mesure du 15 septembre 2026 |
| --- | --- | --- | --- |
| TikTok | carrousel | reel | carrousels : Daloa 2 076 vues et 12 commentaires, Sénoufo 1 018, Krio 927 · vidéos : Côte d'Ivoire 785, Nzema 375, Peul 326 |
| Instagram | reel et carrousel | — | reels : Nzema 1 977 vues, Côte d'Ivoire 1 469 · carrousels : Daloa 241, Krio 179 — moins de portée, autant d'interactions par vue (Daloa 10,8 %, Côte d'Ivoire 11,7 %) |
| Facebook | reel | carrousel | reel Côte d'Ivoire : 21 211 vues, 191 partages · carrousels : Daloa 13, Sénoufo 14, Krio 9 |
| YouTube | reel (Shorts) | carrousel | un Short est une vidéo · Keïta–Coulibaly 1 388 vues, Nzema 1 176 en un jour |
| LinkedIn | texte avec lien, depuis le profil personnel | reel, carrousel | profil personnel : 31 visites de lien en 28 jours · vidéos de la page : 0 à 2 impressions, 0 clic (7 et 14 septembre) |
| X (Twitter) | reel, et le texte avec lien | carrousel | aucune mesure — le compte a ouvert le 16 septembre 2026 avec zéro post. Contrainte de plateforme, pas mesure : **X n'a pas de carrousel**, un post multi-images y est une grille d'au plus quatre vignettes rognées, jamais un balayage. |

- **Un sujet destiné aux six réseaux se produit dans les deux formats**, plus le
  texte LinkedIn. Un sujet produit dans un seul format ne part que sur les
  réseaux de sa colonne : un reel seul ne va pas sur TikTok, un carrousel seul ne
  va ni sur Facebook, ni sur YouTube, ni sur X.
- **La sortie LinkedIn 1080 × 1080 du §1 n'est plus rendue**, puisque LinkedIn
  ne reçoit plus d'image. Retiré du moteur le 16 septembre 2026 ; §1 garde la
  ligne pour mémoire du format, mais `ethni_carrousel2.py` ne l'appelle plus.
- **Un lot qui passe part dans un dossier par format, nommé d'après les
  réseaux qui le reçoivent** — `TikTok-Instagram/` pour le carrousel,
  `Instagram-Facebook-YouTube-X/` pour le reel — et non plus dans un `images/`
  à plat que l'opérateur devait trier réseau par réseau avant de publier. Le
  nom se lit dans la colonne « Reçoit » ci-dessus, dans son propre ordre : une
  ligne révisée change le rangement sans un second edit dans le moteur.
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
§7 ter ne donne que quatre blocs à une ouverture — bandeau et rang, titre, ligne
de vision, indication de défilement —, donc un corps, une punchline ou une
précision posés là sont déjà hors gabarit, et ce sont eux que le moteur retire, en
nommant la faute. Mesuré le 16 septembre : six ouvertures sur seize dépassaient,
et toutes les six portaient un de ces blocs en trop.

**Ce qu'une miniature ne fait pas** : promettre ce que la production ne paie pas.
Une accroche dont la pièce ne referme pas la question n'est pas une accroche,
c'est un appât — et sur un atlas sourcé, c'est aussi un mensonge sur le corpus.
La chute du §7 ter reste la règle : la miniature dit la chute du sujet, elle ne
l'annonce pas.

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

**Mapping accent ↔ pilier :** L'atlas → ocre · Les dossiers → teal · Jouer → pervenche.
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
en lettres, comme toute la doctrine des titres le veut déjà (§7 ter : « la Tanzanie,
c'est quatre-vingt-seize peuples »). La distinction est celle-là : une date se lit sur
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
en A — elle porte la ligne de vision de 118 signes, qui dépasse le seuil de B par
construction. Tant que `choisir()` proposait B aux ouvertures, aucune carte ne
qualifiait et le plafond de deux se tenait à zéro : une exception que la règle rendait
impossible. **La ligne de vision n'est pas l'argument de la carte**, c'est du mobilier
constant ; elle ne devrait pas décider d'une disposition, et la restriction de B à la
bascule est ce qui l'en empêche.

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

**Toute série s'ouvre et se ferme sur un couple de cartes.** Elles ne sont pas
décoratives : elles portent la vision du projet, et c'est la seule chose que le lecteur
emporte s'il ne lit rien d'autre.

### Doctrine éditoriale — elle prime sur toute formulation locale

| Ce qu'on écrit | Ce qu'on n'écrit plus | Pourquoi |
| --- | --- | --- |
| « La plupart des frontières ont moins de 140 ans. Les noms en ont plus de mille. » | « Avant, on vivait en accord avec le continent. » | La force de l'argument vient de la **durée et de l'échelle**, pas de la douceur du passé. Un âge d'or n'a pas besoin d'être vrai pour être attaquable — et l'Afrique d'avant Berlin avait des empires, des conquêtes, des traites internes. |
| « Reconnaître ce qui n'a jamais cessé. » | « Renouer avec le passé. » | Renouer met le sujet au passé et suppose la rupture consommée. |
| « Ce peuple n'a pas été divisé. C'est la carte qui a été dessinée par-dessus. » | « Ce peuple a été divisé par les colons. » | Le registre de la réparation garde le colonisateur au centre de la phrase. Le renversement d'agent rend le peuple sujet. |
| « Tracées sans référence à qui habitait là. » | « Les frontières sont arbitraires. » | À demi faux, donc attaquable — et l'atlas peut le montrer peuple par peuple. |
| « Ce qui est resté. » | « Ce qui a été pris. » | Le contenu ne dénonce pas, il agrandit la carte. |
| « Certaines ruptures sont plus vieilles que la carte coloniale. » | « Avant les frontières, les peuples étaient unis. » | Des parentés de langue et de culture ont parfois traversé des ruptures — une scission, une migration, une querelle de succession — bien plus anciennes que le tracé colonial. La carte n'a pas toujours créé la séparation, elle l'a souvent verrouillée. |

**Aucune conférence, aucune date unique n'est citée comme l'origine des frontières**
(décidé par l'opérateur le 2026-09-14) : la conférence de Berlin a fixé des règles de
revendication, elle n'a tracé presque aucune ligne elle-même, et une production qui la
cite comme l'autrice du tracé répète une erreur déjà relevée par l'audit du message.
La formule qui tient est celle de la table ci-dessus — « moins de 140 ans » — jamais un
lieu et une date uniques. Une frontière ne contient pas un peuple, elle le traverse.

### Une deuxième position, distincte de la ligne de vision

Décidée par l'opérateur le 2026-09-14, échange complet dans
`docs/editorial/purpose-doctrine.md` §5 :

> « Ce qui relie les peuples d'Afrique a survécu à leurs propres ruptures
> autant qu'aux frontières qu'on leur a imposées. C'est là que commence une
> unité plus forte. »

**Ce n'est pas la ligne de vision.** Elle n'est pas obligatoire dans chaque
clôture et ne remplace rien de ce qui précède. Elle peut inspirer le ton d'une
clôture sans y être imprimée mot pour mot, ou apparaître comme sa propre
carte — toujours étiquetée comme une position, jamais comme un fait que
l'atlas démontre, au même titre que « Ce peuple n'a pas été divisé » sur la
page À propos (`purposeChapter.unityClaim` / `.unityClaimStatus`).

### Ce qui change avec le type de contenu, et ce qui ne change jamais

Décidé par l'opérateur le 2026-09-13 : **le titre et le corps d'une production varient
avec le type de contenu publié ; seule la ligne de vision est constante partout.**

| | Titre | Corps | Image | Ligne de vision |
| --- | --- | --- | --- | --- |
| **Ouverture** | propre au sujet, sur le patron de son type quand la table en fixe un | — | propre au sujet | **constante partout** |
| **Clôture** | fixe dans un type, variable entre les types | fixe dans un type, variable entre les types | propre au sujet | **constante partout** |

**La constante du projet est la ligne de vision, et elle seule.** Ni l'image, ni le
titre : une image de clôture unique obligerait à réécrire neuf crédits et neuf licences
de sortie pour ne rien gagner, et un titre unique ment dès que le sujet n'est pas un
peuple réparti sur plusieurs pays — « Ce peuple n'a pas été divisé » sur un carrousel
de villes, de projection, de nom de pays, ou sur un pays et les peuples qui y vivent.

**L'ouverture est la vignette**, et une vignette décide si quelqu'un regarde. Dix séries
qui ouvrent sur la même phrase et la même image donnent dix fois la même vignette dans
le fil : le lecteur qui a fait défiler la première croit avoir déjà vu les neuf autres.
Une ouverture figée est donc une erreur de diffusion, pas une économie de production.

**La clôture est constante dans un type, variable entre les types.** Dans un type, son
titre et son corps sont fixes : c'est la signature, et c'est en retrouvant la même
phrase épisode après épisode qu'on finit par l'associer au projet. D'un type à l'autre
ils changent, parce qu'un renversement d'agent n'est juste que si son sujet est le bon.
Ce qui ne varie jamais, tous types confondus, c'est la ligne de vision.

### La table par type de contenu

**Une seule table, lue par l'ouverture comme par la clôture.** Les skills de la chaîne
y renvoient et n'en gardent aucune copie. Un lot dont le type n'a pas de ligne ici, ou
dont la case est encore « à fixer » ou « à valider », n'a pas de clôture : la ligne
s'écrit ici d'abord, jamais dans une carte.

| Le lot parle de | Patron de titre d'ouverture | Mot en accent à l'ouverture | Titre de clôture | Mot en accent à la clôture | Corps de clôture |
| --- | --- | --- | --- | --- | --- |
| un peuple réparti sur plusieurs pays | « Du {pays} au {pays}, les frontières traversent les {peuple}. » | « {peuple}. » | « Ce peuple n'a pas été divisé. » | « divisé. » | « C'est la carte qui a été dessinée par-dessus. » |
| un pays et les peuples qui y vivent — *validée le 2026-09-14* | « {Pays}, c'est {n} peuples. » — *sauf sous-cas « qui a nommé ce pays » ou « le mythe du surnom », voir ci-dessous* | « peuples. » | « Ces peuples n'ont pas été rassemblés. » | « rassemblés. » | « C'est la carte qui a été dessinée autour d'eux. » |
| des villes, des lieux | un registre de la banque ci-dessous | celui du registre | « Cette ville n'a pas changé de nom. » | « nom. » | « On l'a rebaptisée. » |
| une projection, une carte | un registre de la banque ci-dessous | celui du registre | « La carte ne mentait pas. Elle ne disait pas tout. » | « tout. » | « On l'a redessinée. » |
| le nom d'un pays | un registre de la banque ci-dessous | celui du registre | « Ce pays ne s'est pas renommé. » | « renommé. » | « On l'a rebaptisé. » — *dérivé de la ligne des villes le 2026-09-13, à valider* |
| une langue, une famille | un registre de la banque ci-dessous | celui du registre | « Cette langue n'a pas disparu. » | « disparu. » | « C'est la case qu'on lui avait donnée qui a disparu. » — *fixé le 2026-09-14 par l'opérateur, à l'écriture de « famille-linguistique-quatre-familles »* |
| une langue accusée d'invention coloniale — le mythe porte sur la langue elle-même, jamais sur son nom, qui peut rester un débat sourcé — *décidé par l'opérateur le 2026-09-16, pour le sujet `lingala-invente-par-les-belges`* | un registre de la banque ci-dessous | celui du registre | « Cette langue n'a pas été inventée. » | « inventée. » | « Elle existait déjà — on lui a seulement donné un nom écrit. » — *distinct de la ligne « une langue, une famille » ci-dessus : celle-ci porte la légitimité d'une classification qui ne disparaît pas, celle-là un mythe d'invention coloniale que l'existence antérieure de la langue dément, indépendamment de tout débat sur son nom écrit* |
| une famille de langues, regroupant plusieurs peuples sous un seul nom | un registre de la banque ci-dessous | celui du registre | « Cette famille n'est pas un peuple. » | « peuple. » | « On lui a donné un nom, par-dessus des peuples qui avaient déjà le leur. » — *décidé par l'opérateur le 2026-09-14, pour le sujet Mandé — distinct de la ligne « une langue, une famille » ci-dessus : celle-ci porte la légitimité d'une classification, celle-là la confusion entre un nom de famille et un nom de peuple* |
| un système politique sans souverain unique — un peuple qui gouverne autrement qu'avec un roi ou un chef héréditaire — *validé par l'opérateur le 2026-09-14* | un registre de la banque ci-dessous | celui du registre | « Ce peuple n'a jamais eu de roi. » | « roi. » | « Le pouvoir s'y prête, il ne s'y transmet pas. » |
| un système politique sans souverain unique, où une exception documentée interdit le mot « jamais » — *décidé par l'opérateur le 2026-09-16, pour le sujet `igbo-enwe-eze-sans-roi` — distinct de la ligne ci-dessus : celle-là porte un peuple sans aucune exception connue, celle-ci un peuple dont une minorité de communautés avait bien un roi (Eze Nri, Obi d'Onitsha) et où des titres pouvaient s'hériter autant que se mériter, ce qui rend « jamais » et « ne se transmet pas » faux pour ce sujet précis* | un registre de la banque ci-dessous | celui du registre | « Ce peuple n'a pas eu de roi unique. » | « unique. » | « La plupart de ses villages se gouvernaient sans roi. » |
| un nom partagé, repris par plusieurs peuples distincts | un registre de la banque ci-dessous | celui du registre | « Ce nom n'a pas été subi. » | « subi. » | « On se l'est approprié. » — *décidé par l'opérateur le 2026-09-14, pour le sujet `creole-ne-dans-la-colonie` — distinct de la ligne « une famille de langues » ci-dessus : celle-là porte un nom imposé qui écrase des peuples ayant déjà le leur, celle-ci un nom d'abord extérieur que plusieurs peuples, sans parenté entre eux, ont chacun fait leur propre nom* |
| un personnage historique — une figure individuelle, jamais un peuple ou un pays — *validé par l'opérateur le 2026-09-14* | un registre de la banque ci-dessous | celui du registre | « Il n'a pas eu qu'une ligne dans l'Histoire. » | « Histoire. » | « C'est pourtant tout ce qu'on lui avait laissé. » — *décidé pour le sujet `zokou-gbeuly-resistance-bete` : le corpus AFRIK et les histoires générales ne portent ces figures qu'en clause noyée dans la fiche d'un peuple entier — la clôture porte cet effacement documentaire, pas un mécanisme colonial spécifique, ce qui la distingue de toutes les lignes ci-dessus* |
| un peuple né d'un départ — une migration fondatrice, plus vieille que toute frontière actuelle — *décidé par l'opérateur le 2026-09-14, pour le sujet `baoule-ashanti`* | un registre de la banque ci-dessous | « départ. » | « Ce nom n'a pas attendu la frontière. » | « frontière. » | « Il est né d'un départ, un royaume plus tôt. » — *distinct de la ligne « un peuple réparti sur plusieurs pays » ci-dessus : celle-là porte un même peuple resté des deux côtés d'une frontière, celle-ci un peuple qui est parti et s'est distingué du sien avant qu'aucune frontière actuelle n'existe — le nouveau venu, comme l'abonné, doivent lire un départ, jamais une division* |
| un peuple connu sous plusieurs noms extérieurs, dont aucun n'est le sien | un registre de la banque ci-dessous | celui du registre | « Ce peuple n'a jamais manqué de nom. » | « nom. » | « Ce sont ses voisins qui, chacun dans sa langue, lui en ont donné d'autres. » — *décidé par l'opérateur le 2026-09-14, pour le sujet `peul-fula-fulani` — distinct de la ligne « un nom partagé, repris par plusieurs peuples distincts » ci-dessus : celle-là porte un même nom que plusieurs peuples sans parenté se sont chacun approprié, celle-ci plusieurs noms différents que des voisins ont donnés, chacun dans sa langue, à un seul peuple qui n'en a demandé aucun* |
| un mot d'usage courant, qui reprend le nom et le titre d'une personne | un registre de la banque ci-dessous | celui du registre | « Ce mot n'était pas anonyme. » | « anonyme. » | « C'est un nom d'homme, titre après titre. » — *validé par l'opérateur le 2026-09-16, pour le sujet `rastafari-ras-tafari` — distinct de la ligne « un personnage historique » ci-dessus : celle-là porte l'effacement documentaire d'une figure que le corpus ne retient qu'en clause noyée dans la fiche d'un peuple entier, celle-ci un mot déjà connu d'un très large public dont l'origine — le nom et la titulature d'un homme précis, identifiable — n'a simplement jamais été lue ; distinct aussi de « un nom partagé, repris par plusieurs peuples distincts » : celle-là porte l'appropriation d'un même nom par plusieurs peuples sans parenté entre eux, celle-ci la décomposition d'un seul mot en la titulature d'un seul homme* |
| un lieu prétendument découvert — l'atteinte d'un lieu par un explorateur, présentée comme sa découverte alors qu'il était déjà habité, nommé et parcouru — *validé par l'opérateur le 2026-09-16* | un registre de la banque ci-dessous | celui du registre | « Ce lieu n'a pas été découvert. » | « découvert. » | « Il a été montré. » — *décidé pour le sujet `mungo-park-a-t-il-decouvert-le-fleuve-niger` : distinct de « des villes, des lieux » ci-dessus, qui porte un lieu déjà nommé qu'on a rebaptisé — celui-ci porte un lieu qu'on prétend avoir trouvé, alors que ceux qui y vivaient le connaissaient déjà et l'ont montré à qui le cherchait* |

**`cards.json` ne porte jamais `**`** : les titres s'y recopient en texte brut depuis
cette table, le moteur accentue de lui-même le dernier mot d'une clôture avec sa
ponctuation, et sur l'ouverture seul `titre_camps` (§10) nomme un mot en accent.

**Un peuple réparti sur plusieurs pays.** Le titre obéit à la doctrine des titres comme
tout titre : un nom propre que le lecteur reconnaît, au moins un pays, une assertion
plate, aucun mot qui l'envoie chercher. Le peuple y est donc nommé **par le nom que le
lecteur reconnaît** ; le nom qu'il se donne arrive à la carte 2, dans la paire de §3 bis
— c'est la boucle que le titre ouvre. Quand les deux noms coïncident, il n'y a rien à
arbitrer. **Le titre inscrit au registre et le titre de la couverture sont la même
phrase.** Exemples :

> Au Sénégal, la frontière de la Gambie traverse le pays **wolof**.
>
> Du Sénégal au Soudan, les frontières de douze pays traversent les **Peul**.

**Un pays et les peuples qui y vivent.** C'est l'épisode à densité inversée : le sujet
est un pays, et ce qu'il faut renverser n'est pas une division mais un rassemblement.
« Ce peuple n'a pas été divisé » y serait faux. `{n}` se **mesure sur le corpus le jour
où le titre s'écrit**, il ne se recopie pas. Exemple, pour un lot où le pays lui-même
reste le sujet du corps :

> La Tanzanie, c'est quatre-vingt-seize **peuples**.

Cette ligne est **validée par l'opérateur (2026-09-14)**, après un premier passage sur
« qui-a-nomme-la-cote-divoire » qui l'avait déjà appliquée sur cette base.

**Sous-cas : un lot centré sur qui a nommé le pays — l'ordre s'inverse, et le patron
d'ouverture ci-dessus ne s'applique pas.** Mesuré le 2026-09-14 sur ce même sujet : une
première version ouvrait sur le compte de peuples et reléguait l'acte de nommer à un
« décret », sans jamais dire qui l'a signé, négocié ou exploré — Bouët-Willaumez,
Treich-Laplène, Binger n'existaient nulle part dans le montage. L'opérateur a jugé la
pièce vide de sens : elle ne répondait à aucune question, parce que le reste du corpus
parle déjà des peuples en permanence, et que **c'est cette parenthèse-ci qui doit parler
du pays**.

- **80 % du corps du lot répond à « qui, comment, ce qui en reste »** : les acteurs
  nommés (explorateurs, négociants, résidents, gouverneurs, leurs rivaux), les traités,
  les comptoirs, la résistance, et la toponymie qui en témoigne aujourd'hui — une ville,
  un quartier qui porte encore leur nom. Nommer un acteur historique n'est pas la même
  chose que d'en faire le sujet moral de la pièce : on dit qui a agi et ce qui est resté
  de son passage, pas un jugement sur lui. C'est la même distinction qui tient
  « le registre de la réparation garde le colonisateur au centre de la phrase » —
  la toponymie qui reste **est** ce qui est resté, elle ne bascule pas dans ce registre.
- **Les peuples n'ouvrent pas le lot et n'ont pas à apparaître en carte 2.** Ils forment
  la parenthèse de clôture, le renversement : voilà qui a nommé ce pays ; les peuples,
  eux, étaient déjà là sous leur propre nom, indépendamment de cette histoire. La clôture
  du type ci-dessus (« Ces peuples n'ont pas été rassemblés. ») reste inchangée — c'est
  l'ordre du corps qui s'inverse, pas la clôture.
- **L'ouverture** n'utilise donc pas le patron « {Pays}, c'est {n} peuples. » pour ce
  sous-cas : elle assertit la chose surprenante du nom lui-même (qui l'a donné, à partir
  de quoi), dans un des registres de la banque de patrons ci-dessous — jamais le compte
  de peuples, qui appartient à la clôture.
- **`ethniafrica-message`, critère 2** lit ce sous-cas différemment : voir ce skill.

**Second sous-cas : un lot qui défait un mythe porté par le surnom du pays lui-même —
l'ouverture assertit le surnom, pas le compte.** Décidé par l'opérateur le 2026-09-16,
pour le sujet `cameroun-afrique-en-miniature` : le mythe n'est pas « ce pays est trop peu
connu », c'est une revendication déjà répandue — « on y retrouve tous les peuples
d'Afrique », d'où le surnom « le Continent » — que le compte de peuples vient justement
mesurer et contredire. Ouvrir sur « {Pays}, c'est {n} peuples. » énoncerait la conclusion
avant la question et viderait la suite de sa tension : le lecteur doit d'abord reconnaître
la croyance, avant que la pièce ne la mesure.

- **L'ouverture assertit le surnom lui-même**, dans un des registres de la banque de
  patrons ci-dessous — jamais le compte de peuples, qui reste réservé au corps du lot, là
  où il contredit la revendication.
- **Le compte de peuples migre au corps**, comme démonstration plutôt que comme titre : il
  y assume sa source (un chiffre publié, jamais recopié du corpus sans le dire) et sa
  limite (ce que l'atlas documente lui-même, s'il est moindre).
- **La clôture du type ci-dessus (« Ces peuples n'ont pas été rassemblés. ») reste
  inchangée** — comme pour le sous-cas « qui a nommé le pays », c'est l'ouverture qui
  s'écarte du patron, jamais la clôture.
- **Distinct du sous-cas « qui a nommé le pays » ci-dessus** : celui-là renverse l'ordre
  du corps parce que le sujet est un acte (nommer) ; celui-ci renverse l'ouverture parce
  que le sujet est une croyance (un surnom) que le compte vient réfuter — une pièce qui
  ouvre sur le compte n'a encore fait reconnaître à personne la croyance qu'elle va
  démonter.

**Ce qu'aucune clôture n'écrit, quel que soit le type**, tant que la session de doctrine
n'a pas tranché : « Berlin » comme celui qui a tracé les lignes — la conférence de
Berlin a fixé des règles pour revendiquer un territoire, elle n'a tracé aucune ligne —
et « mille ans » posé comme un fait, que rien ne date. L'audit du message du 2026-09-13
(constat 9) a trouvé les deux sur une clôture publiée sur cinq réseaux.

### La carte d'ouverture

Disposition **A**, image plein cadre. Quatre blocs :

1. **Bandeau et rang**, première rangée de la colonne.
2. **Le titre du sujet**, et il n'est pas libre : il suit le patron de son type quand la
   table par type de contenu en fixe un, et s'écrit sinon dans l'un des registres de la
   doctrine ci-dessus. La banque de patrons est ce qui fait que dix ouvertures
   différentes sonnent comme la même série :

   | Registre | Patron |
   | --- | --- |
   | Durée et échelle | « Moins de 140 ans de frontières. Plus de mille ans de **noms**. » |
   | Renversement d'agent | « Ce peuple n'a pas été **divisé**. » |
   | Ce qui n'a jamais cessé | « Ils écrivaient **déjà**. » |
   | Le nom imposé | « Personne ne s'est jamais appelé **comme ça**. » |
   | Le chiffre absent | « Personne ne sait **combien** ils sont. » |

   Un seul mot en accent, le dernier de préférence — c'est la chute.

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
3. **La ligne de vision**, au corps, tenant sur une ligne, et **reprise mot pour mot
   partout** — ouverture comme clôture, carrousel comme vidéo :

   > Nommer un peuple aussi facilement qu'un pays.

   Une phrase dont le seul rôle est la répétition ne supporte aucune variante : « cet
   atlas nomme un peuple aussi facilement qu'un pays » est déjà une autre phrase. Elle
   se répète à chaque épisode — c'est ce qui la rend mémorable, donc elle est courte et
   elle est figée.
4. **L'indication de défilement** de §8 — carrousel uniquement.

Pas de chiffre, pas de paire, pas de source : une ouverture n'a rien à prouver encore.

> **Les ouvertures existantes sont périmées.** Elles annonçaient le sujet en le nommant
> (« Les Peul vivent dans douze pays ») ; elles doivent porter la **chute** du sujet
> dans un des registres. Le développement commence à la deuxième carte.

### La carte de clôture

Disposition **A** ou **B**. Le renversement d'agent, puis la vision, puis la sortie :

1. **Le renversement**, au titre, le dernier mot en accent. Il se prend **mot pour mot
   dans la table par type de contenu** ci-dessus, colonne « Titre de clôture » : un
   renversement d'agent n'est juste que si son sujet est le bon.

   La seconde moitié du renversement descend au corps, prise dans la même ligne,
   colonne « Corps de clôture ». Le corps n'est pas une datation.

   **Un panneau de cartouche est une boîte à hauteur fixe** : `top` et `bottom` posés,
   rien à comprimre. Deux phrases d'affichage y font cinq lignes, soit 572 px sur les
   747 disponibles, et le pied sort du cadre avec l'attribution. Le titre d'une clôture
   en cartouche tient donc dans le budget mesuré de deux lignes composées — celui de la
   projection, en deux phrases, se **mesure** avant d'accepter un cartouche.

   > `flex:1; min-height:0` sur un intercalaire **ne comprime rien** : un élément vide
   > mesure 0 et ne peut que pousser vers le bas. Pour épingler un pied dans une boîte
   > à hauteur fixe, c'est `margin-top:auto` **sur le pied lui-même**.
2. **La vision**, sous le corps, et c'est la seule phrase du lot qui parle du projet
   plutôt que du sujet : nommer un peuple aussi facilement qu'un pays.

   **Le corps ne redit jamais le titre.** Une clôture dont le titre énonce le
   renversement et dont le corps le reformule — « une frontière ne contient pas un
   peuple, elle le traverse » sous « c'est la carte qui a été dessinée par-dessus » —
   a dépensé sa seule phrase de vision à répéter. Un énoncé du renversement par carte.
3. **La pastille** de §8.

**Ce qui est interdit sur une clôture :** un appel à l'action seul. Une clôture qui ne
dit que « ethniafrica.com » a laissé le lecteur sans la raison d'y aller. Et, tant que
la session de doctrine n'a pas tranché, « Berlin » comme celui qui a tracé les lignes
ou « mille ans » posé comme un fait — voir la table par type de contenu.

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

### La clôture porte la doctrine, jamais un lien seul

« Vous pouvez trouver les peuples sur EthniAfrica » n'est pas une clôture, c'est une
adresse. La clôture dit, dans cet ordre : le titre de clôture de son type, le corps de
clôture de son type, la ligne de vision, puis le lien. Titre et corps se prennent dans
la table par type de contenu de §7 ter ; pour un lot sur un peuple réparti sur plusieurs
pays :

> **Ce peuple n'a pas été divisé.**
> C'est la carte qui a été dessinée par-dessus.
> Nommer un peuple aussi facilement qu'un pays.
> {n} peuples · ethniafrica.com

`{n}` se mesure sur le corpus le jour du rendu.

**Le dernier mot du titre passe en accent, et lui seul** — c'est la chute, comme sur
toutes les lignes de la table. L'ancienne clôture vidéo mettait les deux phrases d'un
renversement au titre et une datation au corps ; elle est retirée, parce que cette
datation écrivait « Berlin » comme auteur des lignes et « mille ans » comme un fait
(§7 ter). **Aucune datation sur une clôture** tant que la session de doctrine n'a pas
tranché.

**Budget de la clôture :** titre Anton 80 px sur trois lignes (259 px) + corps deux
lignes (96 px) = 375 px, emplacement à `top: 890` sur 380. La rampe du voile se recale
d'autant — `top: 590`.

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
> §7 ter fixe la ligne de vision mot pour mot. C'est accepté parce que la carte arrive
> **après** que la doctrine a été dite et montrée : elle signe, elle n'argumente plus.
> Une version en thème de nuit reste le bon objectif.

### La voix finit où l'image finit

**Le script de narration se termine sur la doctrine, pas sur une adresse.** « Sur
EthniAfrica on documente d'où viennent les noms » est une adresse ; un montage dont
l'image dit la doctrine et dont la voix dit l'adresse se contredit sur sa dernière
seconde.

La fin parlée dit **le renversement du type — son titre puis son corps de clôture —,
puis la sortie**. Rien d'autre. Le renversement n'est pas universel : il est celui de la
ligne du lot dans la table par type de contenu de §7 ter. Pour un lot sur un peuple
réparti sur plusieurs pays :

> Ce peuple n'a pas été divisé. C'est la carte qui a été dessinée par-dessus.
> Retrouvez l'histoire du nom des peuples sur EthniAfrica. Et bientôt, celle des lieux.

**Ce qui n'est écrit que sur la carte ne se dit pas à la voix.** La ligne de vision
est composée sur la clôture, mot pour mot ; la prononcer en plus, c'est publier deux
fois la même phrase et immobiliser l'image le temps de le faire.

| Fin parlée | Mots | Carte de clôture à l'écran |
| --- | --- | --- |
| renversement · datation · vision · sortie | 58 | **21,4 s** |
| renversement · sortie | 23 | **7 s** |

Mesuré sur l'ancienne clôture, dont le renversement faisait dix mots. La fin parlée
d'un lot sur un peuple en fait vingt-sept, du même ordre que la seconde ligne : la
durée se mesure sur le lot, elle ne se recopie pas de ce tableau.

Vingt secondes sur une image fixe, c'est une image qu'on quitte. La clôture doit
être aussi brève que l'ouverture.

**La clôture ne porte pas de légende, et c'est pour cette raison.** L'image dit déjà
mot pour mot ce que la voix dit : une légende par-dessus serait la troisième copie de
la même phrase. Partout ailleurs la légende est due, parce que l'image ne dit pas ce
qui se dit.

**Une scène commence où son paragraphe se dit.** `scene-starts.json` porte la mesure,
un point par bloc séparé par une ligne vide ; le moteur la lit et ne la devine pas.
Répartis à parts égales sur les légendes, les huit plans de Libreville affichaient la
clôture à 44,10 s quand sa première phrase se dit à 50,88 s — six secondes de doctrine
posées sur un récit qui n'avait pas fini.

### Aucune image ne tient plus de quatre secondes

**Une image change au moins toutes les quatre secondes.** Passé ce seuil, l'œil a
fini de lire le cadre et attend la suite ; au-delà, la vidéo se voit à l'arrêt même
quand la voix continue. La Côte d'Ivoire et le Mandé ont été renvoyés en production
pour cette raison précise : trop peu de changements d'image sur toute la durée.

Seul un **passage important** — un moment que le montage doit laisser respirer, décidé
au cas par cas et non par défaut — peut dépasser les quatre secondes. Ce n'est pas une
dérogation tacite : le motif se justifie au même titre qu'une exception à toute autre
règle de ce gabarit, jamais par une image qu'on n'a pas eu le temps de découper.

**Le moteur l'applique (2026-09-14).** Une scène peut porter plusieurs images, dans
`images` (§10). La durée de la scène se découpe en créneaux égaux d'au plus quatre
secondes, au moins un par image ; le premier créneau est la première image, **qui
présente le sujet de la scène** — un personnage, un lieu, un document. Une scène plus
longue que ses images ne peut couvrir **reprend la liste depuis la première** plutôt que
de figer une image : une reprise se lit comme un rythme, un cadre figé comme un arrêt.
Le crédit affiché est toujours **celui de l'image à l'écran**, et les portes 1 à 3
lisent chaque image de la scène, pas seulement la première.

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
qui en porte plusieurs (§9 bis, « Aucune image ne tient plus de quatre secondes »).
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
- [ ] **Titre et image d'ouverture propres au sujet ; titre et corps de clôture fixés
      par le type de contenu** (table de §7 ter) ; image de clôture propre au sujet ;
      ligne de vision constante, mot pour mot.
- [ ] **Le titre de clôture renverse le bon sujet** — pas « ce peuple » sur un lot de
      villes ou de projection.
- [ ] **B n'est jamais une ouverture.**
- [ ] **La clôture porte le renversement d'agent et la ligne de vision**, pas un appel
      à l'action seul.
- [ ] **Vidéo : la dernière image EST la clôture.** Aucune carte d'outro, aucun mur
      d'icônes, aucun fond parchemin après elle.
