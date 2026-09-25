# Mémoires sonores — editorial carousel reference

Approved by the operator on 2026-09-25. This reference records the series and
its six-card structure. The operator subsequently approved the six visual
mockups on the same date. This approves their reusable presentation, not the
individual episode text, recordings or publication readiness.

## Scope and identity

- **Brand:** EthniAfrica. This is a recurring musical feature within the existing
  project, not a new account or an independent brand.
- **Public series name:** `Mémoires sonores`. The operator's “hors-d'œuvre”
  describes its place alongside the main editorial programme, not a second title.
- **Platforms:** TikTok and Instagram only. Do not inherit the general
  all-network distribution rule from GABARITS-SOCIAL §1 bis.
- **Format:** a swipeable carousel accompanied by music relevant to its subject.
  A companion reel is optional, never a mandatory second deliverable.
- **Subjects:** artists, songs, musical styles and instruments connected to
  Africa and its diasporas, including their encounters and circulation.
- **Relationship to the site:** the social accounts may explore subjects beyond
  the website's name-focused remit. A music post needs neither a matching site
  article nor a fabricated corpus entity or etymological angle. The site and
  its positioning are not changed by this reference.

## Cadence and opening selection

**Three distinct publications every other Sunday**, each intended for both TikTok
and Instagram. This means three editorial subjects, not six different subjects
because there are two platforms. This recurring Sunday feature sits alongside
the existing name-focused programme. The operator revised the initial weekly
cadence on 2026-09-25: allow two weeks between batches. The production profile
records `day: sunday`, `intervalWeeks: 2` and `subjects: 3`; preparation tools
must read this cadence rather than assuming a weekly schedule.

The operator selected the following opening subjects:

| Order | Subject | Research boundary |
| --- | --- | --- |
| 1 | Kassav, Jacob Desvarieux and Tshala Muana | Start from “Mwen malad aw”; verify the reported on-stage account and the linguistic detail before approving copy. |
| 2 | Docteur Nico | Explain his music and guitar playing. A reported Hendrix encounter must remain attributed; do not invent a reaction or treat it as established fact. |
| 3 | Origins of rap **or** jazz | The choice remains open. Research the chosen genre's specific history, including African American and diasporic contributions; avoid a single-instrument or single-origin claim. |

These are selected subjects, not researched or approved posts. No launch date,
publication hour, automation or scheduled upload has been set.

## The six-card structure

The implemented profile uses six cards, with one main idea per card. Adapt the
depth of the copy to the subject while preserving these six steps. A different
card count requires an explicit profile revision rather than dropping a step.

| Card | Editorial role | What the reader receives |
| --- | --- | --- |
| 1 | Hook — `L’accroche` | A short, accurate discovery promise; the artist, instrument or subject is immediately identifiable. The series label supports the headline. |
| 2 | Context — `La rencontre` | The people, place and period needed to understand the story. For an instrument or genre, establish its practitioners and setting rather than inventing a personal encounter. |
| 3 | Story — `L’histoire` | The sourced event or development, with uncertainty and attributed testimony retained where relevant. |
| 4 | Musical detail — `Le détail musical` | A word, instrument, technique or musical feature that makes the story concrete. |
| 5 | Listening — `L’écoute` | What to notice when listening again, tied to the featured recording; no invented lyric, translation or timestamp. |
| 6 | References — `Les références` | The recording and artist identification, readable sources and asset credits; fuller references may continue in the caption. |

The question or promise on card 1 must be answered within the carousel. A myth
is optional: this series may explain or tell a documented story without
debunking anything. Do not force the name-origin inventory, mandatory myth
question or name-focused closing paragraph onto these six cards. The final card
identifies EthniAfrica and the series; an invitation to contribute can concern
musical memories or sources and must not imply a nonexistent page on the site.

## Approved visual direction — 2026-09-25

The operator approved the [six visual references](memoires-sonores-approved/README.md)
after reviewing the Kassav design study. The production engine selects
`memoires-sonores-v1` from the profile automatically. Do not recreate the
experimental preview script or fall back to the ordinary A/B/C templates.

Review first at **320–430 px**, then tablet (768–1199 px), then desktop
(1200 px and above). The exported cards remain **1080 × 1350** at every
viewing width; this is a carousel, not a responsive image composition.

- **Identity:** the fixed EthniAfrica wordmark, `MÉMOIRES SONORES` label,
  stage label, 01–06 pagination, horizontal rules and the approved footer
  `MUSIQUES · HISTOIRES · TRANSMISSIONS` repeat across the series.
- **Colour and type:** the existing night ground, warm inks and soft ocre;
  Anton headings and Nunito Sans body. The approved profile uses `fond: nuit`
  and `accent: ocre`. No other series or website theme changes.
- **Cover:** a left-aligned title and a whole portrait in the right-hand box.
  The subject's face must not be cropped away. `sujet` identifies the featured
  artist or topic in the cover label; it defaults to the recording's artist.
- **Interior:** four text-led cards with readable paragraphs on the night
  ground. They do not require placeholder photographs.
- **Listening:** a wide, dated and credited photograph above the track title,
  performer and listening instruction. The asset's focal point is respected.
- **References:** readable attribution and a provenance note. There is no
  name-origin closing or automatic link to a nonexistent site article.

These approved layouts are a **scoped exception** to GABARITS-SOCIAL's
full-frame photograph requirement, A/B/C quota, ordinary 32 px body,
120 px cover heading, watermark placement and ordinary footer margins.
All coordinates below are at 1080 × 1350. The font is never shrunk to fit;
measured overflow, including a long unbreakable word or credit, blocks delivery
and produces a marked proof. Image enlargement remains limited to ×2, measured
against the actual photograph box rather than the whole card.

### Preparation fields and measured slots

The existing card fields are reused. Each `titre` may use `coupe` for explicit
line breaks, provided it contains the same words. Body and supporting copy
preserve paragraph breaks. Empty optional fields remain empty; they do not
trigger invented text. The listening performer defaults to `musique.artiste`.

| Stage | Title / `precision` | `corps` | `punchline` |
| --- | --- | --- | --- |
| `accroche` | Title at (68, 300), 490 px wide, Anton 103 / 128; ends above y=950 | Short attribution at (68, 970), Nunito 31, ocre | Continuation at (68, 1014), Nunito 31, secondary ink |
| `contexte` | Title at (68, 286), Anton 110; optional date or setting in `precision` at (68, 433), Anton 146, ocre | At (68, 675), 915 px wide, Nunito 57 | Attribution at (68, 1028), Nunito 30 |
| `histoire` | Title at (68, 279), Anton 96 / 120 | At (68, 602), 914 px wide, Nunito 59 | At (68, 850), Nunito 53, ocre |
| `detail-musical` | Word or short detail at (68, 319), Anton 157, ocre | At (68, 612), 920 px wide, Nunito 60 | At (68, 869), Nunito 53, secondary ink |
| `ecoute` | Track at (68, 738), Anton 83; performer in `precision` at (68, 855), Nunito 36, ocre | At (68, 931), 924 px wide, Nunito 42 | Unused; do not supply |
| `references` | Title at (68, 282), Anton 105 / 128 | At (68, 629), 920 px wide, Nunito 52 | Provenance note at (68, 904), Nunito 43 |

Only the context and listening stages accept `precision`. Pairs, tables,
`chiffre` and multiple-image scenes are outside this presentation. Do not use
them as a workaround for long text. An explicit A/B/C override is rejected.

The cover portrait is contained within (577, 270, 435, 844). The listening photo
fills (68, 270, 944, 432). Credits on those two cards sit at y=1123 in 23 px;
`source` sits at y=1160 in 22 px. On the text cards, `source` sits at y=1138
in 26 px. Credit text is `image.credit` followed by `image.licence`; keep the
full source and licence URLs in the accompanying publication caption.

The top brand/rank row is at y=74, the series at y=158, and the section at
y=207. Rules sit at y=129 and y=1198; the footer brand is at y=1228 and its
qualifier at y=1272. The arrow is drawn, avoiding a missing font glyph. The
reference's `MAQUETTE` banner is review furniture, not part of a clean export.
Failed production gates still receive the ordinary visible proof stamp.

## Research, audio and review

Each claim needs an identifiable source. Separate established findings,
attributed recollections and unresolved stories; a repeated anecdote is not
automatically independent corroboration. Apply the project's source-tier
policy, including attributed oral and local accounts.

Present artists through their work. Recognition by a famous Western musician
may be contextual evidence, not the measure of an African artist's value.
Diasporic histories include local invention and exchange; do not reduce them
to a one-way African ancestry claim.

Record the featured track, performer, version and intended excerpt in the
subject's working notes. Verify the audio's availability and permitted use
separately on TikTok and Instagram. A platform music selection does not grant
permission to reuse a third party's video. Archive excerpts are optional and
need their own source, rights and format review. Do not assume a mixed
photo/video carousel behaves identically on both platforms.

The reference does not approve any episode's text. Research, full-text approval,
asset verification and proof review still precede publication. Apply message
review to the actual musical promise and this six-card sequence; mark
name-specific criteria inapplicable with a reason rather than inventing an
endonym, myth, corpus entry or name-focused conclusion.

## Production handoff

`idee`, `structure` and `produire` should read this reference before applying
their general name-origin instructions to a Mémoires sonores subject.

The machine-readable profile is
[`social/harness/carousel-profiles/memoires-sonores.json`](../../../social/harness/carousel-profiles/memoires-sonores.json).
Preparation, rendering and private-library registration read that same profile.

Before writing an episode, retrieve the current instructions and an empty deck:

```bash
social/harness/venv/bin/python social/harness/ethni_carrousel2.py --brief memoires-sonores
```

This read-only command returns JSON with `instructions` read from this file,
`profile` (including cadence and networks), and `deck`, a six-card scaffold.
Write the populated `deck` to the subject's workshop `cards.json`; do not save
the entire brief as a deck. The scaffold deliberately has no invented title,
claim, source, image verification or audio authorization and cannot pass gates.

The deck declares `"profil": "memoires-sonores"`. Each card keeps the existing
§10 fields and adds `etape`: `accroche`, `contexte`, `histoire`,
`detail-musical`, `ecoute`, `references`, in that order. Its ranks are 1–6;
its rendering roles are `ouverture`, then five `serie` cards. The last card is
not `bascule`: it must not trigger the name-focused exit treatment. Cards 2–6
require body text and a source, and every card requires a title. Only cards 1
and 5 require an `image` object and asset review; the other four are text cards.
The scaffold reflects that distinction. A legacy image field on a text card
is not drawn or loaded and does not contribute a licence to the output.

`musique` identifies `titre`, `artiste`, `version` and `extrait`. Under
`musique.plateformes`, both `tiktok` and `instagram` require a `reference`
(the exact sound identifier or source), `usage` (the recorded usage review),
and `verifie: true` only after that review. The scaffold starts with
`verifie: false`; an unresolved review blocks delivery. These are an author's
attestation and notes, not automatic evidence that a licence exists.

After complete text approval, register only in the private library:

```bash
node social/tools/library/register-post.mjs \
  --id <slug> --dir Musique-<Sujet>/<slug> \
  --title "<approved title>" --subject "Musique · <Sujet>" \
  --pillar EthniAfrica --profile memoires-sonores --status a-produire \
  --copy _legendes/<slug>.md --write
node social/tools/library/register-post.mjs --where <slug>
```

Set `cards.json.outDir` to the library location returned by `--where` and use
the existing library index tools to generate its `post.md`. The registration
stores `profile` and `intendedChannels`, separately from actual `channels` and
publication dates. It does not schedule or publish anything. Do not pass a
fictional `--link-path`, and do not create a name-origin JSON record under
`docs/productions/` for this social-only series.

After source, asset and message reviews, render with the normal command:

```bash
social/harness/venv/bin/python social/harness/ethni_carrousel2.py <Sujet>
```

The engine validates the profile, stages and music notes before reading assets.
It renders **six 1080 × 1350 PNGs**, with `Mémoires sonores` as their series
label, into `TikTok-Instagram/` when the ordinary review and visual gates pass.
Failed ordinary gates still produce marked proofs in `_epreuves/`; an unknown
or malformed profile is refused rather than silently routed to every network.
It generates no reel or other-network package for this profile. `RENDU.md`
records the guide, featured recording, excerpt and per-platform audio notes.

PNG files do not contain audio: select the documented sound in each platform
when uploading the swipeable carousel. No audio is downloaded or embedded by
this renderer. Existing decks without `profil` retain their existing behaviour.

## Remaining choices

The remaining editorial choices are the third opening subject (rap or jazz)
and the new TikTok/Instagram display names and bios. The visual accent and
six-card presentation are approved and implemented.
The operator approved broadening those profiles, but did not approve final
replacement strings. Keep the existing account handles and EthniAfrica brand;
do not apply the older name-only profile proposals as the new musical brief.

This reference does not create accounts, alter live profiles, generate posts
or schedule publication.
