# Le gabarit de narration d'un reel « D'où vient le nom X ? »

Décidé par l'opérateur le 2026-09-21. **Un reel suit ce gabarit et rien d'autre :
pas une scène de plus, pas une de moins, pas une phrase fixe reformulée.** Le
même parcours, le même niveau d'information, pour chaque sujet d'une des cinq
catégories : **peuple, pays, patronyme, lieu, langue**.

`node social/tools/narration/check-gabarit.mjs <narration.fr.txt> --type <catégorie>`
le vérifie. Un écart se corrige dans le texte, pas dans le contrôleur. La
catégorie est la `typologie` du carnet de production. Ce gabarit ne couvre pas la
typologie `mot` (« ethnie ») : voir « Ce que le gabarit ne couvre pas ».

Le **carrousel n'est pas concerné** : il a son propre gabarit, traité à part.

## Le squelette : sept temps, un paragraphe chacun, dans cet ordre

Un paragraphe de `narration.fr.txt` est une scène, donc une carte. Dix scènes au
plus.

| #   | Temps                                             | Ce qu'il fait                                                                                                               | Pourquoi ici                                                                                                                                                                    |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Ouverture**                                     | Une question, puis trois phrases fixes : plusieurs noms, celui de l'intérieur (l'endonyme), ceux d'ailleurs (les exonymes). | La question ouvre la boucle. Le mot « endonyme » est défini une fois, dans la phrase où il apparaît, parce que beaucoup d'auditeurs n'ont pas le français pour première langue. |
| 2   | **Inventaire**                                    | Les noms retenus, dits une fois chacun, **le nom de l'intérieur en premier**. Deux à quatre.                                | Chaque nom d'ailleurs se mesure ensuite au nom de l'intérieur : l'auditeur doit le connaître avant de comparer.                                                                 |
| 3   | **Variantes** (facultatif)                        | Seulement les écritures qui posent un vrai problème. Un paragraphe, quatre phrases au plus.                                 | Une variante d'orthographe n'est pas un nom de plus. Elle ne prend une scène que si elle crée une confusion ou une offense. Sans problème, la scène n'existe pas.               |
| 4   | **Un bloc par nom**, dans l'ordre de l'inventaire | Le nom de l'intérieur d'abord, les noms d'ailleurs ensuite.                                                                 | Même parcours pour chaque nom : l'auditeur compare sans réapprendre la forme.                                                                                                   |
| 5   | **Classement**                                    | Qui a donné quel nom, et lequel est évité.                                                                                  | La boucle de l'ouverture se referme ici.                                                                                                                                        |
| 6   | **Synthèse**                                      | Trois phrases au plus : ce que les blocs ont montré, puis la morale.                                                        | Une suite de faits ne dit pas ce qu'il faut retenir. Elle se propose à l'opérateur avant d'être écrite (voir `SKILL.md`, « Le registre »).                                      |
| 7   | **Clôture**                                       | Le texte unique décidé, mot pour mot.                                                                                       | Une seule signature pour tous les reels.                                                                                                                                        |

## Les phrases fixes

Le contrôleur les cherche mot pour mot. Les crochets sont les seuls mots qui
changent.

### Ouverture (peuple, pays, lieu, langue)

1. Une question : « Comment ce peuple s'appelle-t-il lui-même ? »
2. « Un même [peuple] porte toujours plusieurs noms. »
3. Un seul endonyme : « Un seul vient de [lui et de sa langue] : c'est l'endonyme, le nom de l'intérieur. »
   Plusieurs endonymes : « Ici, il en emploie [deux], selon [son dialecte] : ce sont des endonymes, les noms de l'intérieur. »
4. « Les autres viennent d'ailleurs : ce sont des exonymes, et certains sont plus connus que [le sien]. »

`[peuple]` devient pays, langue, ville, lieu ou région selon la catégorie.

### Inventaire

« Ce [peuple] porte [quatre] noms : A, B, C et D. » — de deux à quatre noms, pas
un de plus. **Si le sujet en a davantage**, on garde, dans cet ordre : tous les
noms de l'intérieur attestés, puis le nom d'ailleurs le plus répandu, puis un nom
évité s'il existe, puis un nom ancien. On dit ensuite, dans le classement ou la
synthèse, qu'il en existe d'autres. _(Règle proposée le 2026-09-21, à confirmer
par l'opérateur.)_

### Bloc du nom de l'intérieur

1. « X est l'endonyme. » Si plusieurs : « X est un endonyme. » puis « Y est aussi un endonyme. »
2. « Ce nom vient de la langue des [X]. » (ou « leur langue », « sa langue »)
3. **L'explication de ceux qui le portent, en premier** : « Les anciens l'expliquent ainsi : … ».
   Si le corpus ne la porte pas : « Nous n'avons pas encore leur explication. » — la
   lacune se dit, elle ne se comble pas avec l'explication d'un autre.
4. Puis, si elle diffère, **une** explication venue de l'extérieur, attribuée
   (« Ce missionnaire y voit … »), et la première attestation écrite.

Un endonyme se reconnaît à ces trois marques : le nom vient du groupe, dans sa
langue, et le groupe l'explique lui-même. Un nom seulement _écrit_ par un
missionnaire n'est pas un endonyme pour cela.

Plusieurs endonymes (dialectes) : on les range **par première attestation**,
jamais par importance ni par nombre de locuteurs — classer un dialecte en premier
serait en couronner un. Le second et les suivants portent une phrase de raccord
avec le premier : « Ce nom dit autre chose que Tsélé, mais il désigne le même
peuple. »

### Bloc d'un nom d'ailleurs

1. « X est un exonyme. »
2. Qui l'a donné, dans quelle langue, ce que le mot y veut dire, quand il est écrit
   pour la première fois.
3. **Une phrase d'écart, exactement une, parmi trois** — c'est elle qui dit si ce
   nom raconte la même chose que le nom de l'intérieur :
   - « Ce nom dit la même chose que … » ;
   - « Ce nom dit autre chose que … » ;
   - « Nous ne savons pas si ce nom dit la même chose que … ».
     Il n'y a pas de quatrième formule : « n'a aucun rapport avec », « proche de » ne
     passent pas.
4. Ce qu'il en reste aujourd'hui.

**Deux explications par nom, pas trois.** La plus citée d'abord, puis une autre,
chacune attribuée : « La piste la plus citée est… », « Une autre piste y voit… ».
Quand les sources ne tranchent pas : « L'origine de X n'est pas établie. » puis
les deux pistes, aucune couronnée. Un récit local se nomme à côté du récit
extérieur, dans la même phrase.

Huit phrases au plus par bloc.

### Classement

- Un endonyme : « L'endonyme de [ce peuple] est X : il vient de sa langue et de l'explication de ses anciens. »
- Plusieurs : « Les endonymes de [ce peuple] sont X et Y : chaque dialecte a le sien. »
- Puis : « Les exonymes A et B viennent d'ailleurs. »
- Si un nom est évité : « Le nom C est évité, parce qu'il … » (une phrase). Le bloc
  n'existe pas quand aucun nom n'est évité : il ne s'écrit pas pour annoncer qu'il
  est vide.

Chaque nom de l'inventaire y figure. Deux à trois phrases.

### Synthèse

Trois phrases au plus. Exemple de forme : « Un seul de ces quatre noms vient des
Ndoumba. Les trois autres viennent d'ailleurs, et disent parfois autre chose. »
Un constat, jamais un jugement (« a longtemps remplacé le sien » est un jugement).

### Clôture

Le texte de `GABARITS-SOCIAL.md` §7 ter, « Le reel a un couple unique », mot pour
mot : la voix dit les deux phrases, la carte porte la première en titre et la
seconde en corps. « Partagez-la » est un impératif voulu par l'opérateur : le
contrôle de lecture ne s'applique pas à cette scène.

## Ce qui change selon la catégorie

| Catégorie                | Le nom de l'intérieur est                                    | Les noms d'ailleurs sont                                          | « Variantes » désigne                          | L'historique remonte à                                     |
| ------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| **Peuple**               | le nom qu'il se donne                                        | les noms des voisins, de l'administration, des savants            | les écritures françaises, anglaises et locales | la première mention écrite, ou la tradition orale attestée |
| **Pays**                 | le nom officiel dans la langue du pays                       | les noms coloniaux ou européens                                   | les graphies et accents                        | le nom qui a précédé la frontière                          |
| **Patronyme**            | _la forme d'origine_ — le mot « endonyme » n'est pas employé | _les formes transformées_ par l'état civil                        | les graphies d'une même forme                  | la langue et le registre d'origine                         |
| **Lieu** (ville, région) | le nom d'usage des habitants                                 | les noms administratifs, coloniaux ou des voisins                 | les cartes et leurs graphies                   | les renommages, racontés dans les blocs d'ailleurs         |
| **Langue**               | le nom que ses locuteurs lui donnent                         | les noms donnés par les voisins, les linguistes, l'administration | les préfixes et suffixes ajoutés ou retirés    | la première mention écrite                                 |

Le **patronyme**, dans ce premier cas — la comparaison de formes — a son
vocabulaire : ouverture « Un même nom de famille prend toujours plusieurs
formes. Nous cherchons la forme de la langue d'origine. L'état civil en a créé
d'autres, et certaines sont devenues plus courantes. » ; blocs « X est la forme
d'origine. » puis « Y est une forme transformée. » ; classement « La forme
d'origine est X. Les formes Y et Z s'en éloignent. » Une seule forme d'origine.
**Un patronyme qui ne compare aucune forme suit le second cas, plus bas** («
Le patronyme a deux cas »).

Le **piège propre à la langue** est de confondre la langue et son peuple ; le
piège propre au **lieu** est de croire que le nom officiel est le nom des
habitants.

## Le patronyme a deux cas

Décidé par l'opérateur le 2026-09-23, sur le sujet Traoré (S4, `PAT_TRAORE`).
Le squelette ci-dessus ne raconte qu'**une** histoire de patronyme : laquelle,
entre plusieurs formes d'un même nom, est l'origine et laquelle en est issue.
Un patronyme ouest-africain en raconte souvent une seconde, qu'aucune
comparaison de graphies ne couvre : ce qu'un nom de clan — un jamu ou une
institution comparable — transmet socialement, à travers des récits fondateurs,
un mode de transmission et des relations reconnues entre groupes, **sans jamais
en déduire une généalogie individuelle**. Le sujet Traoré ne comparait aucune
forme ; le forcer dans le squelette « forme d'origine / forme transformée »
aurait exigé d'inventer une étymologie ou une forme que les sources ne
donnaient pas — refusé par l'opérateur, qui a demandé un second cas plutôt
qu'une réécriture de l'argument approuvé.

**Le squelette de ce second cas, un paragraphe par scène, dans cet ordre :**

| #       | Temps                             | Ce qu'il fait                                                                                                                                                                                                                        |
| ------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1       | **Ouverture**                     | Une transition et une question ; rien de plus n'est fixé, parce que le pont vers le chapitre précédent varie d'un sujet à l'autre.                                                                                                   |
| 2       | **Cadrage**                       | Nomme l'institution (jamu, nisba…), son mode de transmission et ce qu'elle peut porter (récits, relations).                                                                                                                          |
| 3…n     | **Cas documentés**                | Deux au moins. Chacun nomme sa source ; **au moins un**, dans le lot, porte une réserve épistémique explicite (ce que la source ne permet pas d'établir). Une scène de discussion méthodologique peut s'y glisser, sans phrase fixe. |
| n+1     | **Synthèse des quatre questions** | **Fixe, mot pour mot** — voir ci-dessous. C'est le garde-fou que ce cas existe pour tenir : il vaut pour tout sujet qui l'emploie, pas seulement celui qui l'a motivé.                                                               |
| n+2     | **Synthèse**                      | Libre, trois phrases au plus — la même règle que pour tout reel (voir « Le registre » dans `SKILL.md`).                                                                                                                              |
| n+3     | _(optionnelle)_ **Transition**    | Vers le chapitre suivant de la série, si le sujet en ouvre un.                                                                                                                                                                       |
| dernier | **Clôture**                       | Le texte unique décidé, mot pour mot — inchangé, commun à tout reel.                                                                                                                                                                 |

**Douze scènes au plus** (contre dix pour la comparaison de formes) : le nombre
de cas documentés varie plus que le nombre de formes d'un nom, et le sujet qui
a motivé ce cas en emploie douze.

**La phrase fixe, à recopier mot pour mot :**

> « Nous devons donc distinguer quatre questions. L'étymologie cherche l'origine
> du mot. Le récit fondateur raconte une origine et des liens reconnus par ceux
> qui le transmettent. La transmission du nom concerne la manière de le
> recevoir, de le porter et de le transmettre. La généalogie cherche à établir
> les filiations entre des personnes précises. Un patronyme seul ne démontre ni
> leur ascendance ni leur appartenance à un peuple. »

Elle est fixe parce qu'elle porte exactement la mise en garde qui justifie ce
second cas — aucune date, aucun surnom, aucun mot du sujet précis ne s'y glisse,
donc rien n'empêche de la reprendre telle quelle sur un futur sujet de la même
famille (le prochain est Keïta/Coulibaly, S5).

**Le contrôleur choisit ce cas automatiquement**, à la présence de cette phrase
(son ancre, la première phrase seule, suffit à déclencher la lecture — le reste
du paragraphe est ensuite vérifié mot pour mot séparément, pour qu'une coquille
tombe sur son propre écart plutôt que sur les erreurs, sans rapport, de l'autre
gabarit). Rien ne se déclare en ligne de commande : `--type patronyme` reste le
même argument pour les deux cas, et c'est le texte qui dit lequel il suit.

**Ce que ce cas ne vérifie pas**, volontairement : si un cas documenté est bien
attribué, si sa réserve épistémique est la bonne pour ce qu'il affirme. Le
nombre et la forme des cas varient trop d'un sujet à l'autre pour une phrase
fixe par cas, à la différence des formes d'un nom (deux à quatre, toujours).
Cela reste à l'auteur et à la validation de l'opérateur, comme le reste du
gabarit.

Exemple fictif, modèle à reproduire :
`social/tools/narration/exemples/patronyme-transmission.fr.txt`.

## Ce que le gabarit ne couvre pas

Dans chacun de ces cas, **arrête-toi et dis-le à l'opérateur** ; n'invente pas une
variante :

- la typologie **`mot`** (« ethnie ») ;
- un sujet dont le groupe n'a **aucun** nom pour lui-même dans les sources ;
- un sujet avec **plus de quatre** noms de l'intérieur ;
- un sujet à **un seul nom** (rien à comparer).

## Corriger une narration existante, non publiée

Lance le contrôleur, lis chaque écart, réécris **dans le gabarit** et relance
jusqu'à ✔. Ne corrige que la structure : les faits, les sources et les licences
restent ceux de la narration. Le texte repasse ensuite par la validation de
l'opérateur, mot pour mot (`SKILL.md`, « La validation du texte »).

## Ce que le contrôleur ne voit pas

Si un sens est juste, si une source tient, si une phrase est simple, si un
« endonyme » en est bien un. Cela reste à l'auteur, au contrôle de lecture
(`check-narration.mjs`, que le contrôleur rejoue sur chaque scène sauf la clôture)
et à la validation de l'opérateur.

## Un exemple par catégorie

Fictifs — noms, dates et sens inventés, à ne jamais publier :
`social/tools/narration/exemples/peuple.fr.txt`, `peuple-dialectes.fr.txt`
(plusieurs endonymes), `pays.fr.txt`, `patronyme.fr.txt` (comparaison de
formes), `patronyme-transmission.fr.txt` (second cas patronyme, ci-dessus),
`lieu.fr.txt`, `langue.fr.txt`. Ils servent aussi de cas de test au contrôleur :
une phrase fixe modifiée ici fait échouer la suite.
