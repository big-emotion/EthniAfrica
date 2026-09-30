---
name: ethniafrica-produire
description: Render EthniAfrica scene videos from an approved scene plan, or render independent carousel decks. Verify narration, assets, timing and reviews; deliver proofs or reviewed clean publication packages. Final stage of idee → structure → produire. Does not publish or schedule.
---

# produire — rendre carrousels et reels

## Family-scoped reviews (2026-09-29)

Before any render, read the edition's plan:
`node social/tools/narration/check-family-brief.mjs <brief.json>`. The five universal
reviews (provenance, uncertainty, attribution, intelligibility, non-essentialising) are
owed by every family and no scene profile — `free` included — waives one. `name`,
`myth`, `geography`, `music` and `name-origin-gabarit` are owed only where the plan says
`required`; each `not-applicable` is recorded with its reason in `message.md` (« Revues
appliquées ») and cancels nothing else.

- **`mythe.md` exists only when the `myth` review is `required`.** No myth, no
  `mythe.md`, and gate 5 is not blocked by its absence; the engine's `porte_message`
  already treats it as optional. A `mythe.md` that exists and says « ne passe pas » still
  blocks.
- **`check-gabarit.mjs` and the production ledger are for `series: name-origin`.** A
  social-only piece is never stamped in `docs/productions/` (see « Pour finir »).
- **Geography and music** reviews follow the claims and media present: a map or route
  claim is checked against its sources; a music claim or audio excerpt needs the recorded
  audio review and the excerpt's attribution.
- **Each edition is independent.** A carousel does not wait for a video, and a video
  adapted from an approved carousel reuses that text approval for unchanged copy. Only
  the checks whose inputs changed (a claim, an asset, the audio, a layout, a destination)
  are rerun. No weekday and no date is required to render or to mark an edition ready.

## Mémoires sonores delivery scope (2026-09-25)

Read `docs/design/gabarits-social/MEMOIRES-SONORES.md` first for this feature.
Since 2026-09-27 the profile uses the standard carousel gabarit (the Lingala
format): a full-frame photograph on every card and the generic A/B/C quota.
Layout approval never approves episode copy or audio; compare the render with
the Lingala reference before delivery.
Its sequence and TikTok/Instagram-only delivery replace the generic
name-carousel and all-network requirements for this series. Full-text approval,
source/asset checks, message review and proof review still apply. The normal
`ethni_carrousel2.py <Sujet>` command reads `profil: memoires-sonores` and exports
only six 4:5 cards for TikTok/Instagram; it refuses incomplete profile data.
Use the private-library registration with `--profile memoires-sonores` and its
`--where` output, following the reference. No public name-origin ledger entry
is required. Deliver `RENDU.md` with its sound-selection notes: the operator adds
the documented music natively on each platform; PNGs contain no audio.
Archive clips require their own platform-specific review.

## Scene-video dispatch and execution

For every new video, use `scene-plan.json`, this section and
`social/harness/SCENE-PRODUCTION.md` before the deck-only workflow below.
`social/harness/SCENE-CATALOGUE.md` lists working controls; the three recipes and
execution prompt live under `social/harness/templates/`. This is not a carousel
migration. Narration organizes ideas; visual cuts follow meaning and reading comfort.
A map can span several paragraphs with evolving camera, dates, regions and routes.
Use a new shot for a useful change of place, period, evidence or idea. Do not
require a carousel deck or impose image timers on video production.
For name-origin narration only, read
`.claude/skills/ethniafrica-structure/references/gabarit-reel-nom.md` and run
`node social/tools/narration/check-gabarit.mjs narration.fr.txt --type <category>`.
Other profiles do not run this category checker. A name-origin brief that carries a
`narrativeDesign` is checked with `--brief <brief.json>` instead (its plan was chosen
and shown upstream; the legacy scene list and two-explanation ceiling do not apply).

Require the genuine text-approval record, approved recording, matching alignment,
filled plan, relative asset bundle and source/licence register. Review the brief,
message and myth judgments including the new visual meaning. An explanatory
subject may have no myth. Do not fabricate passing verdicts, sources or registration.
The scene renderer checks the text marker/hashes; it does not itself certify these
editorial audits or infer licensing compatibility. Final delivery checks explicit,
version-bound review records rather than fabricating those judgments.

### Pending rights do not block a private render

Publication clearance is not a prerequisite for `prepare`, `render` or private
proof delivery. Once the text, recording and visual plan are approved and the
technical inputs are ready, render the video even when voice publication rights
or permission for an incorporated image, page or excerpt are still pending.
Recording approval means approval of the performance; it does not assert rights
clearance. Do not ask for clearance or a separate waiver before rendering.

Record each unresolved permission in the source/licence register and leave the
corresponding release-review checks pending. For example, pending publication
rights for the Marie-Victoire voice or an unanswered request to Présence Africaine
for page 46 must not stop the private proof. These examples do not establish the
actual status of either request. Deliver the proof with its existing proof badge
and a concise list of outstanding rights; never invent permission or mark it passed.

Pending rights still prevent `finalize`, ready-to-publish status and publication.
Ask any clearance question at the release-review stage, after delivering the proof,
only when needed to proceed to the publication package. Existing text, visual-plan,
recording and paid-generation approval requirements continue to apply.

For a new prepared package, run `ethni_scene_pipeline.py prepare` with its plan,
new named lock and private proof output. Inspect the cue preview index at phone
size, including route reveals, each timeline date and the final overview. The lock
records technical identity and sampled pixels; it is not editorial approval.
If the brief authorizes production and the unchanged script/voice are approved,
continue without another generic permission request.

For an existing handoff, execute the `render` command in
`social/harness/templates/scene-execution-prompt.md`. It verifies inputs/runtime,
compares sampled pixels, renders, checks streams and fully decodes the video.
Do not regenerate voice, rewrite the plan or replace a mismatching lock to force
success. Report the exact changed input or missing decision. Routine authorized
technical fixes do not require reopening the whole narrative discussion.

Return the proof and execution report. Complete its generated `release-review.json`
from real evidence and existing operator decisions. Review the composition at
320–430px, transitions, captions, credits, actual listening, historical meaning,
message/myth, voice rights, each asset and output licensing compatibility. An
excerpt must be explicitly approved as an excerpt, including its closing.
Never mark a check passed simply because the file exists or a render succeeded.

When the exact proof is accepted and the checks pass, run `finalize` with that
review and a fresh private `video/<version>` destination. It verifies the sealed
inputs and proof, removes only the proof badge, checks the full encode, and delivers
`video.mp4`, `captions.srt`, `CREDITS.md`, a mobile preview and `delivery.json`.
Use `social/harness/SCENE-RELEASE.md` for the command and library handoff. Reuse
already granted approvals; do not ask again for unchanged speech or visuals.
Then assemble the mandatory full-resolution cover and approved publication Markdown
using `.claude/skills/ethniafrica-production/references/publication-delivery.md`.
The mobile preview does not satisfy the cover requirement. Inspect the cover, record
real approval evidence and deliver explicit links to both files. A registered post
receives verified library copies of all three: video, cover and Markdown.
Complete the filing event described in `docs/social-workshop-cleanup.md` after
those copies are verified: register the top-level workshop with `--workshop`,
complete its `production-record.md`, then run
`node social/tools/library/register-post.mjs --id <id> --filed --write`.
This automatically checks the ledger, delivery and record before removing proven
scratch. A failure remains visible; do not report housekeeping complete or fall
back to recursive deletion. Retain the sealed release, review evidence, approved
voice/timing, source assets and operational plans. They are replay dependencies.
Missing rights or editorial decisions are reported together; retain the proof
while they are unresolved. Do not publish or schedule automatically.

## Independent carousel route

Everything below governs carousel production. Video production uses the scene
workflow above, including its review and delivery gates. Do not run the legacy
image-deck montage for a new video. Existing old exports remain reproducible with
their archived renderer version; they do not define current production rules.

Dernière étape de la chaîne. **Rien ne vient après.** La publication est un acte
humain : l'opérateur poste, puis renseigne la date et les réseaux dans la section
Diffusion du `post.md`. Chaque publication est une **occurrence** de l'édition, pas
un état final : elle ne ferme ni le sujet, ni l'angle, ni l'édition, et une nouvelle
édition, une adaptation ou une republication restent légitimes. Tu ne publies pas,
tu ne programmes pas, tu ne proposes pas de le faire.

Si `cards.json` ou `SOURCES.md` manquent, dis-le et propose `structure`. Ne saute
pas l'étape.

**Un carrousel dont le brief porte une `narrativeDesign` (`format: "carrousel"`)** ne
change rien au rendu : mêmes cinq portes, même moteur, même profil. Vérifie seulement
que `check-family-brief.mjs` accepte le brief (un plan non montré, un choix synthétique
ou un brouillon n'est pas un feu vert) et que le texte complet des cartes est validé ;
un choix de plan n'est pas cette validation. Le plan ne dit rien du confort de lecture :
regarde le rendu à 320, 390 et 430 px d'abord, et ne réduis jamais la typographie pour
faire tenir une carte.

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
   `ethniafrica-mythe` **quand la revue `myth` est `required`** : un `mythe.md` qui
   dit **ne passe pas**, ou plus ancien que ces fichiers, ferme cette porte de la
   même façon. Quand elle est `not-applicable`, il n'y a pas de `mythe.md` à écrire.

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
l'atelier, hors dépôt, où vivent le `cards.json`, les fichiers médias vérifiés et le
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
```

**`ethni_carrousel2.py` refuse d'écrire dans un dossier-réseau (nommé d'après
la colonne « Reçoit » de §1 bis) qui porte déjà des rendus** et bascule le lot en épreuve. Deux jeux de rendus côte à côte sont
indiscernables dans un sélecteur de fichiers. `--remplacer` lève le refus.

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

For a carousel, when all five gates pass, set its ready status through the
registry rather than editing the generated header:

```
node social/tools/library/register-post.mjs --id <id> --workshop <Subject> --status pret --write
node <00-Index>/migrate-library.mjs --write     # Brouillon → Valide, dossier et rendus compris
node <00-Index>/build-index.mjs
node <00-Index>/sync-deliverables.mjs --write  # après le déplacement : il compare au bac du statut
node social/tools/library/register-post.mjs --id <id> --filed --write
```

Before this sequence, complete `production-record.md` using
`docs/social-workshop-cleanup.md`: actual angle/family, decisions, cuts, sources,
review evidence, selected take and all associated editions. The final command is
the required filing completion event and automatically cleans disposable scratch.
It never moves or deletes library products. A missing record, unfinished associated
edition or incomplete filing blocks cleanup. Report that blocker and retain the
workshop. Historical backlog cleanup still requires the operator's separate consent;
use a dry run when inspecting previously filed productions.

**Série name-origin seulement : stampe le carnet de production** — une pièce d'une
autre famille, ou sociale seulement, n'y est jamais inscrite et n'y reçoit aucun
chemin de site fabriqué. `docs/productions/<typologie>/<NNN>-
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
Si l'édition est en 🟢, rappelle qu'il ne manque que l'acte de publier — et que
c'est l'opérateur qui le fait, quand et où il le décide : aucun jour ni aucun réseau
n'est imposé.
