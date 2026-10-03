# The publishing format, and a production history the site can read — brief

Date: 2026-09-20. Status: **not started**. This file states what exists, what the
operator decided, and what a follow-up session must produce. It changes no skill
and no code.

Two things are asked for, and they are one piece of work because the second is
what makes the first legible a year later:

1. a **fixed publishing format** — five subjects per production day, Monday,
   Wednesday and Friday, one question (« D'où vient le nom X »), five typologies,
   a video and a carousel per subject, numbered by episode;
2. a **versioned production history inside the repository**, holding for every
   subject its links per network and per format, simple enough to fill by hand,
   and readable by the site — the Découvertes scroll and the search feed's shorts
   shelf.

## 1. What exists today — measured 2026-09-20, do not re-measure

### 1.1 The chain writes nine places, none of them versioned

| Skill                            | Reads                                          | Writes                                                                                                                                           |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ethniafrica-idee`               | nothing structured                             | `$ETHNIAFRICA_SOCIAL_PROJECTS/_idees/{slug}.md`                                                                                                  |
| `ethniafrica-structure`          | the subject report                             | `{Sujet}/cards.json`, `narration.fr.txt`, `SOURCES.md`, `post.md`, `_legendes/<id>.md`, **one ledger entry** + `Brouillon/<Prefixe-Sujet>/<id>/` |
| `ethniafrica-message`            | cards, narration, captions                     | `message.md` beside `cards.json`                                                                                                                 |
| `ethniafrica-mythe`              | subject or cards                               | the report's « Le mythe » section, or `mythe.md`                                                                                                 |
| `ethniafrica-onomastique`        | anything                                       | **nothing** — verdict in conversation                                                                                                            |
| `ethniafrica-produire`           | validated cards + sources                      | PNGs into `<post folder>/images` via `outDir`, video into `<Sujet>/video/`                                                                       |
| `ethniafrica-reseaux-help`       | pipeline state, `docs/audience/`               | **nothing**                                                                                                                                      |
| `ethniafrica-content-strategist` | the dated audit + its three `reference/` files | **nothing** — a plan in conversation                                                                                                             |
| `ethniafrica-audience-audit`     | Plausible + the studios                        | `docs/audience/audit-YYYY-MM-DD.md`                                                                                                              |

Every path above except the audits is **outside the repository**, under
`ETHNIAFRICA_SOCIAL_PROJECTS` (the workshop) and `ETHNIAFRICA_SOCIAL_POSTS` (the
library). `CLAUDE.md` and `social/harness/README.md` state the rule: "The code is
versioned; the productions are not", "productions are large, and git is not a
media store." **That rule is about media, and this brief does not touch it.**
What it does touch is the two hundred bytes of metadata per post that today live
only in a hand-edited file on one machine.

### 1.2 The ledger, and what it cannot answer

`social/tools/library/register-post.mjs` reads and writes
`<library>/00-Index/publications.json` — **83 posts**, outside git, and the tool
says so itself: "The ledger is edited by hand with targeted replacements and has
no version history." A new entry:

```js
{ id, dir, title, subject, pillar, status,
  date: "", dateKind: "", videos: [], channels: {}, views: "", notes: "" }
```

plus `links: { path, campaign, content }` (`campaign` defaults to `post.id`,
`content` to `"video"` or `"carrousel"`), `copy`, `renderedFrom`.

Statuses in the file: `publie` 42, `a-produire` 22, `brouillon` 10, `pret` 6,
`bloque` 3. The chain writes only four — `publie` is the operator's act, filed
only once `date`, `dateKind` and `channels` are filled together.

**`channels` is one URL per network and carries no format**:
`{ youtube: "<url>", instagram: "publié le 2026-09-05, URL non enregistrée", … }`.
The format is carried by `links.content` and by the convention that a post _is_
one format. So the exact question the operator asks — _the Lingala subject went
out as a carousel on Facebook and as a video on Instagram; give me both links_ —
is answerable today only by knowing which of two post entries to open.

### 1.3 What the repository already versions about productions

- A dated prose audit of the published videos (since deleted), with no
  reusable identifier, explicitly "not a publication manifest".
- `docs/audience/audit-2026-09-{07,12,14,17}.md` — per-post metrics keyed by
  **human titles** (`| Keïta et Coulibaly | YouTube | 09-12 | 1 433 | 55.7 % |`),
  with no `post.id` and no campaign slug. Joining an audit to a production is
  manual today.
- `social/tools/link-builder/productions.mjs` — **the only in-repo table binding
  a production to a page of the site**, twenty entries:
  `{ id, kind: "video"|"carrousel", title, subject, pillar, path: "/fr/atlas/noms/PAT_TRAORE" }`.
  No network URL, no date, no status. Its README: "reduced to the two things a
  tagged link needs: where it points, and under what campaign name."
- The UTM scheme, the one identifier already shared end to end:
  `utm_source=<youtube|tiktok|instagram|facebook|linkedin|x>`,
  `utm_medium=social`, `utm_campaign=<subject slug, identical on all six>`,
  `utm_content=<video|carrousel|image|story|commentaire-epingle|bio>`.

### 1.4 What the format doctrine already fixes

`docs/design/gabarits-social/GABARITS-SOCIAL.md`:

- **§1** — 1080×1350 (carousel), 1080×1920 (reel/short, nothing legible below
  y = 1620), 1080×1080 retired.
- **§1 bis, one format per network**, operator's decision of 2026-09-16:
  TikTok → carousel; Instagram → reel **and** carousel; Facebook → reel;
  YouTube → reel; LinkedIn → text + link; X → reel + text. "The table is revised,
  it is not broken." **A batch that passes goes into one folder per format, named
  after the networks that receive it.**
- **§1 ter** — the cover title is the thumbnail: ≤ 8 words, never compressed.
- **§7 ter** — fifteen content types, each with its opening pattern, its accent
  word and its closing title and body. "The closing line is constant within a
  type and varies between types […] it is by finding the same sentence episode
  after episode that a reader comes to associate it with the project."
- **§10** — the `cards.json` schema: `campagne`, `pilier`, `accent`, `fond`,
  `licence_sortie`, `cartes[]`. The engine also reads `serie` (defaulting to
  `pilier`) and `outDir`.

### 1.5 The three gaps this brief exists to close

1. **No cadence is written in the repository.** The only one is in the
   strategist's `reference/launch-plan.md` — _three videos a week, Monday /
   Wednesday / Friday, fixed slots, Sunday batch_ — and `published-state.md`
   records that it was abandoned for "two concentrated waves".
2. **No episode number exists anywhere.** `rang` is the card's ordinal inside its
   batch (`01/07`); `serie` is a display string. The ledger has no counter, no
   season, no per-typology index.
3. **No identity bridge.** `cards.json` and the ledger carry no `PPL_*`, ISO
   3166-1, ISO 639-3 or `PAT_*` identifier — only a `path` that happens to be a
   site URL. But the site's own filter,
   `publicationsForSubjects(records, subjects)`, matches on
   `detail.entities[{kind, id}]`. **That missing pair is why no production can be
   attached to a fiche automatically**, and it is the single most valuable field
   this work adds.

And on the site: `DISCOVERY_VIDEOS` is empty, so the shorts shelf renders its
empty slot in production; `kind: "carousel"` exists in the type union and in no
record, no renderer and no test; `DiscoveryReader` draws a photo or a typographic
proverb card and has neither a player nor a gallery.

## 2. What the operator decided

In his words, to be honoured unless a measured constraint contradicts one — in
which case the contradiction is reported, not silently resolved.

- **Publication days: Monday, Wednesday, Friday.** **Five publications per
  publication day.**
- **One formula, five typologies**: « D'où vient le nom X », where X is a
  **peuple, a pays, a patronyme, a lieu or a langue**.
- **Per subject: one video and one carousel.** The video walks the appellations —
  exonyms and endonyms — back up their history. The carousel starts from a **myth
  to take apart**, ten images maximum.
- **Numbering by typology and by episode**, so a reader can follow a series.
- **Every piece presents the project** and invites contribution, and explains why
  appellations are hard and why the word « ethnie » does not fit.
- **Length**: under three minutes, and the platforms' format constraints
  respected.
- **Current events are a reason to schedule a subject** (his example: Goma).
- **The social bios and channel descriptions are updated** to match.
- **The skills change** — `idee` and `structure` first.

Two tensions to resolve explicitly rather than paper over:

- Five subjects × (a video + a carousel) is **ten renders per publication day,
  thirty a week**. The measured library holds 83 posts in total. The plan must
  either stage the ramp or say plainly what is deferred.
- **§1 bis already assigns one format per network.** « Une vidéo et un carrousel
  par sujet » is compatible with it — the video goes to Instagram, Facebook,
  YouTube and X; the carousel to TikTok and Instagram — but that mapping must be
  written down once, in §1 bis's own table, not re-derived per subject.

## 3. What the follow-up session must produce

### 3.1 The ledger — `docs/productions/`

One **JSON file per subject**, not one big index: git history then reads per
subject, and two sessions filing two different subjects never conflict.

Proposed path and shape — the session may change it, but must justify any change
against the requirements below:

```
docs/productions/<typologie>/<NNN>-<slug>.json
```

```jsonc
{
  "campaign": "lingala", // = utm_campaign = post.id in the private ledger
  "typologie": "langue", // peuple | pays | patronyme | lieu | langue
  "episode": 7, // unique within its typologie, never reused
  "question": { "fr": "D'où vient le nom lingala ?", "en": "…" },
  "myth": { "fr": "…", "en": "…" }, // what the carousel takes apart
  "subjects": [
    // THE IDENTITY BRIDGE — what the site joins on
    {
      "kind": "language",
      "id": "lin",
      "label": { "fr": "Lingala", "en": "Lingala" },
    },
  ],
  "sitePath": "/fr/atlas/langues/lin",
  "publications": [
    {
      "network": "youtube",
      "format": "video",
      "url": "https://…",
      "publishedAt": "2026-09-05",
    },
    {
      "network": "instagram",
      "format": "carrousel",
      "url": "https://…",
      "publishedAt": "2026-09-05",
    },
    { "network": "facebook", "format": "video", "publishedAt": "2026-09-05" }, // url unknown, stated
  ],
  "poster": {
    "src": "/images/productions/lingala.jpg",
    "width": 1080,
    "height": 1920,
  },
  "durationSeconds": 74,
  "sources": [{ "title": "…", "url": "…", "tier": "referenced" }],
}
```

Requirements, each of which must survive into whatever shape is chosen:

- **One row per network × format.** This is the operator's exact question and the
  one thing the private ledger's flat `channels` cannot answer.
- **A publication with no URL is recorded, not omitted** — the private ledger
  already carries « publié le …, URL non enregistrée », and losing that fact
  loses the publication.
- **`campaign` is the same slug as `utm_campaign` and as the private ledger's
  `id`**, so the audits, the tagged links and this file join without a lookup
  table.
- **`subjects[]` uses the site's own `{kind, id}`** so `publicationsForSubjects`
  matches without translation. Ids are corpus ids — `PPL_*`, ISO 3166-1 alpha-3,
  ISO 639-3, `PAT_*`, `FLG_*` — and must exist.
- **No media.** Posters are the one exception, because the site already hosts 36
  files of them under `public/images/discoveries` and a facade needs one; state
  their weight budget.
- **Bilingual text follows the repository's own rule**: French is the source,
  English may be deferred, and `check:translation-parity` reports rather than
  blocks.

### 3.2 The gate

`scripts/ci/checkProductionLedger.ts`, wired into CI like its neighbours, with a
`--selftest` holding fixtures. It must fail on: a schema violation; a duplicate
or missing episode number within a typology; a `subjects[].id` no corpus record
carries; two files claiming the same `campaign`; a `publications[]` row whose
network × format pair contradicts §1 bis; a `sitePath` that is not a route. It
must **not** fail on a missing URL, a missing English field or a subject with no
publication yet — those are states, not errors.

### 3.3 The import, once

`scripts/productions/importLedger.ts`, run by hand against
`$ETHNIAFRICA_SOCIAL_POSTS`: read the 83 entries, emit one file per **subject**
(merging the video post and the carousel post of the same subject into one file),
and **report** every entry it cannot map — a missing entity id, an ambiguous
subject, a post with no `campaign`. The report is the work list. This runs once
to bootstrap; afterwards the git file is the source and the private ledger keeps
only what is large.

### 3.4 What the site does with it

- `src/lib/productions/` reads the files and projects them into the existing
  `DiscoveryPublication` shape, filling `DISCOVERY_VIDEOS` — which is how the
  search feed's shorts shelf stops rendering its empty slot in production.
- A production with `format: "carrousel"` gives the `carousel` kind its first
  record; **whether it renders as self-hosted images or as an embed is decided by
  `embedded-media-brief.md`, not here.** This brief supplies the data; that one
  supplies the player.
- `links.path` and `productions.mjs`'s twenty entries are superseded by
  `sitePath` — say so, and retire the duplicate rather than keeping two.

### 3.5 The format doctrine

- **§1 bis** gains the network × format mapping for a subject that ships as both
  a video and a carousel, written once.
- **§7 ter** is reconciled with the five typologies: it holds fifteen content
  types today, the operator names five. State the relation — the five are the
  _question's_ typologies and the fifteen are _closing patterns_ — and say which
  closing each typology takes, or that a typology spans several.
- The **episode number** gets a place in `cards.json` (a `serie`/`episode` pair
  rather than a new top-level key if the engine allows it) and a place on the
  cover, subject to §1 ter's eight-word ceiling.
- The **project presentation** and the « ethnie » explanation become a required
  element, with the surface that carries it named — a card, the caption, or the
  pinned comment — because « in every piece » with no slot is how it gets
  dropped.

### 3.6 The skills

- `ethniafrica-idee` — the five typologies, the episode counter read from
  `docs/productions/`, the current-events rule.
- `ethniafrica-structure` — write the ledger file at the same moment it writes
  the private entry, so the two cannot diverge; carry `subjects[]` into
  `cards.json` so the identity bridge is authored once.
- `ethniafrica-produire` — nothing changes in rendering; it only stamps the
  render into the ledger file.
- `ethniafrica-reseaux-help` — read `docs/productions/` and answer « where is
  this subject published, in which format ».
- `ethniafrica-audience-audit` — key its tables by `campaign` as well as by
  title, so a metric joins a production without a human reading both.
- The cadence itself: **write it in the repository**, not in a skill's reference
  file that no gate reads.

### 3.7 The bios

Out of the code path, still part of the ask: one file holding each network's bio,
description and link, in French and English, so a change is reviewable. Propose
where it lives and say plainly that nothing publishes it — the operator pastes
it, as with everything else on the networks.

## 4. The deliverable

`docs/plans/production-history-plan.md`, holding: the schema with its rationale,
the gate's rules, the import's reporting, the site projection, the diffs to
GABARITS §1 bis and §7 ter, the skill-by-skill changes, and a **staged rollout**
whose first stage is one real subject filed by hand end to end. Test-first
throughout, as the repository requires: the gate's `--selftest` fixtures before
the gate, the projection's unit tests before the projection.

## 5. The prompt to run this

> You are specifying two things for EthniAfrica: the fixed publishing format the
> operator decided on (five subjects per publication day, Monday / Wednesday /
> Friday, one question « D'où vient le nom X » across five typologies — peuple,
> pays, patronyme, lieu, langue — a video and a carousel per subject, numbered by
> episode), and a versioned in-repo production history that records, per subject,
> the link of every publication by network and by format.
>
> Read `docs/plans/production-history-brief.md` first. §1 is measured and must
> not be re-measured: the private ledger's shape and its 83 entries, what each
> skill writes, what the repository already versions, what GABARITS §1 / §1 bis /
> §1 ter / §7 ter / §10 already fix, and the three gaps — no cadence in the repo,
> no episode number anywhere, and no identity bridge between a production and a
> corpus entity. §2 is the operator's decision, including two tensions you must
> resolve out loud rather than paper over. §3 is what to produce.
>
> Produce `docs/plans/production-history-plan.md` as §4 describes. Do not write
> the ledger files, the gate or the skill edits in this pass — this is the plan
> that authorises them. Do not decide how a video or a carousel plays on the
> site; that is `docs/plans/embedded-media-brief.md`. Do not propose versioning
> any rendered media: the repository rule that productions live outside git
> stands, and this work versions only their metadata. English, as every document
> here.

## 6. What this brief leaves out

How a piece already published is watched on the site — that is
`embedded-media-brief.md`. And the editorial substance of any single subject,
which is the chain's own work.
