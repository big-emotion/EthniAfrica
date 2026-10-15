# Brief 9 — « Notre démarche », the project's message on the site

Read [`README.md`](README.md) and
[`../../mockup-first-workflow.md`](../../mockup-first-workflow.md) first.
Written 2026-10-15. Status: **boards approved 2026-10-16.**

**Boards to create** (new page, so three new boards): `approach-430`,
`approach-768`, `approach-1440`. Add them to the « 4 · Other pages » group,
beside `about`, and add their entry to `canvas.json`.

**Boards to touch lightly:**

- `about-430`, `about-768`, `about-1440`: one link in « Notre conviction »;
- the footer on `Main`, then on every board that shows it once the operator
  has chosen (see « The footer »).

**Not to touch:**

- `name-traore`, and every `PAT_*` board: another piece of work is changing
  the family-name template;
- the search, people, language, family and country boards.

## Why this page

On 15 October 2026 the operator made one message the background of every
publication and of the site
([essay, section 5](../../../editorial/essais/afrique-nest-pas-un-tout-2026-10-13.md)).
The networks carry it as one line at the end of every reel and carousel (essay
5.6). The site must carry the same message in full, in a page a reader can
reach from the footer and from « À propos ». The page also gives the networks'
signature line its explanation: a reader who sees the line in a reel and taps
the profile link should find what it means.

**What the page is not.** It is not a second « À propos » or a second
« Comment nous travaillons »:

- « À propos » (`/fr/about`) presents the project;
- « Comment nous travaillons » (`/fr/doctrine`) explains the method;
- « Notre démarche » says **why** the project names things the way it does,
  and what EthniAfrica thinks.

Route proposed: `/fr/notre-demarche`, in line with the site's French route
folders.

## The page's copy

The copy is final. It is taken from the essay's synthesis (5.3 and 5.6), and
it passed `npm run check:publication` with no error or warning on 2026-10-15.
Draw it as written; change nothing without saying so.

```text
Notre démarche

Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes.

Cette phrase termine chacune de nos vidéos et chacun de nos carrousels. Cette page explique d'où elle vient et ce qu'elle veut dire.

L'Afrique n'est pas un seul bloc
L'Afrique est d'abord un continent immense : elle couvre environ 30 millions de kilomètres carrés. Elle mesure environ 8 000 kilomètres du nord au sud et 7 400 kilomètres d'ouest en est. Les États-Unis, la Chine et l'Inde réunis y tiendraient, et il resterait de la place. Le continent compte 54 États membres des Nations unies, et l'Union africaine réunit 55 membres. Plus d'un milliard et demi de personnes y vivent. On y parle plus de 2 100 langues, soit près d'un tiers des langues parlées dans le monde.

Chaque peuple a son nom
Chaque peuple a son nom, sa langue, son histoire et sa culture. Beaucoup de peuples sont pourtant connus sous un nom qu'ils ne se donnaient pas : un nom venu d'un voisin, d'un commerçant, d'un administrateur ou d'un savant. Le mot « Afrique » lui-même vient du latin. Son origine reste discutée : il viendrait d'un peuple appelé Afri, près de Carthage, ou d'un mot latin ou grec. Ce n'est qu'une des explications proposées.

Tous les noms ne sont pas venus de l'extérieur
Kouassi et Yao, par exemple, sont des noms que les Baoulé et les Agni de Côte d'Ivoire donnent à un garçon selon son jour de naissance. Au Ghana, en twi, on les écrit Kwasi et Yaw. En 1964, une loi ivoirienne a obligé chaque personne à porter un nom de famille, transmis par le père. Nous pensons que c'est ainsi que des noms de jour comme Kouassi et Yao sont devenus des noms de famille. La loi ne les cite pas, et elle a été remplacée en 2020.
[links] Le nom Kouassi · Le nom Yao

Décoloniser leur emploi
Un nom n'a pas seulement une origine. Il a aussi un emploi, et cet emploi peut changer. Certains noms ont déjà été repris par les peuples qu'ils désignent, ou remplacés. D'autres gardent un emploi hérité de l'époque coloniale. D'autres sont péjoratifs, ou racialisants, c'est-à-dire qu'ils classent les personnes par race, sans venir de la colonisation. D'autres encore sont devenus un enjeu politique. Pour chaque nom et chaque mot, nous montrons dans quel cas il se trouve, avec ses sources. Nous ne reprochons à personne d'employer aujourd'hui un nom venu d'ailleurs.

Notre position
Notre travail montre cette diversité, nom après nom. Il commence par l'histoire : comprendre d'où vient chaque nom, qui l'a donné et quand. Cela permet d'apprendre à nous nommer comme les peuples se nomment eux-mêmes. Cela permet aussi de voir ce que certains noms d'aujourd'hui gardent de l'époque coloniale.
Nous pensons aussi que l'Afrique a beaucoup à gagner à être unie dans le monde d'aujourd'hui. C'est une position d'EthniAfrica, pas un fait établi par une source. Connaître la diversité des peuples n'empêche pas de choisir l'union.

Sources
[the sources block, see below]

[closing] Chercher un nom · Comment nous travaillons · Signaler une erreur
```

## Blocks, mobile 430 px first

1. **Head.**
   - The title « Notre démarche ».
   - The signature line, set as the page's lead. It is the page's one
     display sentence, in the site's display face, not in capitals. On the
     site it is a sentence, not a slogan. The README's uppercase rule
     belongs to the cards.
   - The one-sentence intro.
   - No image unless the operator asks for one.
2. **Five sections**, in the order of the copy. Plain reading measure, the
   « À propos » rhythm.
   - « Tous les noms ne sont pas venus de l'extérieur » ends on two links to
     the Kouassi and Yao name pages. They link to the pages as they are;
     their template is not touched.
3. **« Notre position » is visibly a signed position.** Set it apart the way
   « À propos » sets « Notre conviction » apart, so a reader sees where the
   sourced facts end and EthniAfrica's opinion begins. Doctrine §1.1 says the
   site never affirms; this section is the signed exception the essay
   records, and its look must say so. Do not style it as a sourced finding.
4. **Sources.** One entry per source, each showing its **type, never a tier**:
   - *Encyclopædia Britannica*, « Africa », encyclopédie;
   - Nations unies, *Demographic Yearbook 2023*, statistiques officielles;
   - Nations unies, groupes régionaux, site officiel;
   - Union africaine, États membres, site officiel;
   - Nations unies, *World Population Prospects 2024*, statistiques
     officielles;
   - Ethnologue, ouvrage de référence linguistique;
   - T. Kotula, « Afri », *Encyclopédie berbère*, encyclopédie;
   - loi ivoirienne n° 64-373 du 7 octobre 1964 et loi n° 2020-490 du
     29 mai 2020, textes de loi;
   - L. Barré, « Mettre son nom », *Genèses*, 2018, article;
   - A. Thiero-Meman, *Le nom patronymique en République de Côte d'Ivoire*,
     1999, thèse.

   Each with its link. The URLs are in the essay, 5.4. Folded behind one line
   at 430 px, like the source chapters of the fiches.
5. **Closing.** « Chercher un nom » (search), « Comment nous travaillons »
   (`/fr/doctrine`) and « Signaler une erreur ». No silences block: this page
   is not a fiche.

At 768 and 1440 the page keeps the same order and the reading measure. Wider
screens add margin, not columns.

## « À propos »

In « Notre conviction » (`about` boards), after its two paragraphs, add one
link: « Lire notre démarche ». The conviction's text does not change.
« Notre conviction » speaks of knowing the links between peoples;
« Notre démarche » carries the full message and the signed position on
unity. The link joins the two without repeating them.

## The footer

Draw two states on `Main` and on the three new boards. The operator picks
one, and the chosen state then goes on every board that shows the footer.

- **A.** One more link, « Notre démarche », in the « Le projet » column,
  after « À propos ».
- **B.** A, plus the signature line under the footer's tagline
  « L'Afrique à travers ses noms », set smaller than the tagline.

**Recommendation: B.** The footer is the site's equivalent of an account's
bio, and the bio carries the line (essay 5.6). The tagline says what the
project does, and the line says why. They are two sentences with two jobs,
set at two sizes. Leaving the line off the footer makes sense only if the
two sentences read as competing slogans at 430 px; draw both states so the
operator can judge.

## Rules this page obeys

All the rules of [`README.md`](README.md) that apply to a page that is not a
fiche:

- mobile first;
- French only, in a plain register;
- tokens only, no literals;
- a source shows its type, never its tier;
- the site's affirmations stay within the signed section.

The thesis slot of the fiche briefs (`[THÈSE — texte à fixer]`) is **not**
filled here. Whether the signature line fills it is the operator's decision.
That decision touches the fiche templates, and a separate piece of work owns
the `PAT_*` template.

## Approved boards (2026-10-16)

Recorded in `docs/design/mockups/site/`. The implementation reproduces them.
The operator accepted the brief's recommendations: footer state B, the
signature line as the page's one display sentence, and « Notre position »
set apart in the treatment of the fiches' conviction line.

- `approach`, at 430, 768 and 1440 (new). The breadcrumb « Accueil › Notre
  démarche », the title, the signature line (`.ea-signature`: display face
  700 at the h2 size, sentence case, ink colour), the intro. The four sourced
  sections keep the « À propos » head (ocre rule, number 01 to 04, display
  title) and its soft body text. « Notre position » has no number and no ocre
  rule: a neutral rule above, its two paragraphs in the display face 700 at
  the body size, in ink (`.ea-position`). Then « Sources »: the ten entries,
  each a link followed by its type, in the fiches' tile « La liste », folded
  at 430 and open at 768 and 1440. Then the three closing links under a rule.
  The column is held to the prose measure (`--afh-measure-prose`) and stays
  left-aligned with the breadcrumb, so wider screens add margin on the right.
- `about`, at 430, 768 and 1440: « Lire notre démarche » after the two
  paragraphs of « Notre conviction ». The text does not change.
- The footer, state B, on every board that shows it (except `name-traore`,
  owned by another piece of work) and in a new component section on `Main`:
  « Notre démarche » after « À propos » in « Le projet », and the signature
  line under the tagline, in the body face at the caption size, soft colour
  (`.ea-footer-signature`). The line takes the tagline's width
  (`contain: inline-size`), so the footer's columns do not move at 768.
- `ea-live.css` gains `.ea-approach`, `.ea-signature`, `.ea-position`,
  `.ea-approach-sources`, `.ea-approach-source`, `.ea-approach-close`,
  `.ea-footer-signature`, and the `Main`-only phone footer overrides.

Choices made while drawing, accepted with the boards:

1. No eyebrow above the title: it would have added copy the brief does not
   give.
2. « Notre position » keeps the conviction treatment at the body size, not
   the h3 size: two paragraphs at h3 bold read too heavy at 430.
3. The column is left-aligned at the prose measure rather than centred.
4. Source types are capitalised after « · », as on the fiches; the two laws
   are two links in one entry; the tile reuses « La liste », « + en savoir
   plus » and « − replier ».
5. Apostrophes are typographic, as in the site's copy dictionaries; the
   closing links have no heading.

Found while drawing, left to the operator: the sentence « Nous pensons que
c'est ainsi que des noms de jour comme Kouassi et Yao sont devenus des noms
de famille » is an opinion of EthniAfrica inside a sourced section (03), not
inside « Notre position ». It is drawn as written.

## Implementation

Decided by the operator on 2026-10-16, before any code:

1. Not now. The boards are the recorded target; the page is built in a later
   piece of work.
2. The route is `/fr/notre-demarche`.
3. The opinion in section 03 stays as written: « Nous pensons » already signs
   it, and the copy passed review.
4. The footer in state B ships in the same pull request as the page, so the
   link « Notre démarche » never points to a missing page.
