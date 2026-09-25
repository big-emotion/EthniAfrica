# Mémoires sonores — editorial carousel reference

Approved by the operator on 2026-09-25. This reference records the series and
its six-card structure; it does not approve individual scripts or renderings.

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

**Three distinct publications every Sunday**, each intended for both TikTok
and Instagram. This means three editorial subjects, not six different subjects
because there are two platforms. This recurring Sunday feature sits alongside
the existing name-focused programme.

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

## Visual direction

Review the design first at **320–430 px**, then tablet (768–1199 px), then
desktop (1200 px and above). A desktop profile grid is not proof of mobile
readability.

- Keep the EthniAfrica signature and the existing social typography. The
  surface rules in [GABARITS-SOCIAL](GABARITS-SOCIAL.md) govern typography,
  contrast, source credits, image quality and platform-safe areas.
- Give the series a recurring, secondary `Mémoires sonores` label and a
  consistent accent drawn from the existing brand palette. The exact accent
  remains to be selected on the first proof; no new colour token is approved.
- Give artists, instruments and documented archives more visual space. Images
  must depict what the text describes and carry their actual provenance.
- Start with a dedicated cover and one reusable interior treatment, using the
  existing components. No wholesale redesign is required to start the series.
- Preserve readable text and credits: shorten copy rather than shrink it to
  fit. Validate the actual swipeable post and profile thumbnail separately.

The renderer reuses the existing card layouts and prints the series label on
every card. The exact accent and the first episode's visual proof remain to be
reviewed; technical support is not visual approval of an actual publication.

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
require body text and a source, and every card requires a title.

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

The remaining editorial choices are the third opening subject (rap or jazz),
the exact visual accent, and the new TikTok/Instagram display names and bios.
The operator approved broadening those profiles, but did not approve final
replacement strings. Keep the existing account handles and EthniAfrica brand;
do not apply the older name-only profile proposals as the new musical brief.

This reference does not create accounts, alter live profiles, generate posts
or schedule publication.
