# Playing the productions on the site — decision

Date: 2026-09-20. Status: **analysis complete; §6 measured 2026-09-20; stage 1
implemented.** This
document authorises the work; it is not the work. No code, CSP, consent
category or legal page was touched in the pass that produced it.

Its charge is `docs/plans/embedded-media-brief.md`, which states what was
already measured (§1), what the operator asked for (§2), and the questions
below (§3).

## 0. What could not be tested here, and why it matters

The brief is explicit: _never infer a platform's behaviour from its
documentation alone when a two-minute test in a private window can settle it._
That test could not be run in the environment this analysis was produced in.
Outbound HTTPS is filtered by an egress proxy that answered **403 to CONNECT**
for `youtube.com`, `youtube-nocookie.com`, `tiktok.com`, `instagram.com`,
`facebook.com` and `cnil.fr` alike, and page fetching was blocked for every
domain tried. Only keyword search reached outside.

So this document carries an **evidence mark on every external claim**, in the
spirit of the project's own source-tier policy — a claim is published with its
provenance rather than suppressed or dressed up:

| Mark           | What it means                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **measured**   | Run against this repository, on the branch named. Reproducible here.                                             |
| **documented** | The platform's own developer documentation, reached through search result summaries rather than the page itself. |
| **reported**   | Secondary technical reporting or a consent-tooling vendor. Useful, interested, not authoritative.                |
| **observed**   | Run 2026-09-20 in a clean, signed-out browser context against the project's own public posts. See §6.            |
| **untested**   | The browser observation the brief asked for. Not performed.                                                      |

The brief's §3.1 q2 (login wall) and q3 (what is written to the device) were
**untested** when this document was drafted. **They were measured on
2026-09-20**, on a machine with ordinary outbound access, and §6 now carries the
numbers, the controls and the screenshots instead of a protocol. Two of this
document's own claims did not survive that pass — the cookies YouTube was
reported to set on play, and TikTok's rank among the alternatives — and both are
corrected at §6.3 rather than quietly edited out of the table.

What the measurement could **not** settle stays marked: whether a hand-built
facade over a Meta embed is permitted is a terms question, and no browser
answers it. **No recommendation below depends on an untested claim**; where one
would have, the recommendation is to not ship that platform, which is the safe
direction to be wrong in.

## 1. Re-verification, and one correction to the brief

Every measurement in the brief's §1 was re-checked. All of them hold. Two
notes on where they hold, because it changes what a reader of this file should
check out:

- **The shorts shelf and the video record are not on `main`.** They live on
  `codex/search-feed-implementation`. On `main`, `src/lib/discoveries/videos.ts`
  does not exist, and `DiscoveryPublication.kind` admits
  `anecdote | proverb | carousel | image` with **no `video` member** — the
  `video` kind the brief describes is the codex branch's. Every claim below
  about the feed, the shelf and the video record is measured on that branch;
  everything about the CSP, consent, legal pages and Découvertes reader is
  measured on `main`, where they agree.
- **`public/images/discoveries` is 11 MB over 36 files** — also on the codex
  branch. `main`'s `public/` is 36 MB without it.
- **The brief's line number for the `frame-src` assertion is off by nine.**
  `expect(frameSrc).toBe("frame-src 'self'")` is at
  `src/__tests__/middleware.test.ts:767`, not `:758`, on `main` and on
  `recette` alike. The assertion itself is exactly as the brief describes it;
  only the line moved. Cited as `:767` throughout this document.

Confirmed verbatim, for the record: `FRAME_SRC_HOSTS` is `[]` in
`src/middleware.ts:78`; `src/__tests__/middleware.test.ts:767` asserts
`expect(frameSrc).toBe("frame-src 'self'")`; `src/types/consent.ts` declares
three categories and no more; `.lighthouserc.gate.js` asserts
`categories:best-practices ≥ 0.95` as an **error** over four routes including
`/fr/atlas/recherche`; `.lighthouserc.js` asserts `performance ≥ 0.73` as an
error in the nightly matrix; `next.config.ts` declares **no `images` block at
all**; there is no `.gitattributes`; `DISCOVERY_VIDEOS` is `[]`; and
`ShortsBlock.tsx:112,150` sizes the poster `w-[130px] h-[231px]`,
`min-[1200px]:w-[160px] min-[1200px]:h-[284px]`.

One thing the brief does not say, and it turns out to matter more than anything
else in the brief's §3.3: **130 ÷ 231 = 0.5628 and 160 ÷ 284 = 0.5634. The
reviewed poster geometry is already 9:16** (0.5625) to within a third of a
percent. Whatever is decided, the shelf's box does not have to move.

Two budgets exist in the shape the brief's §3.3 asks a new one to take, and
both are real scripts rather than prose: `QUIZ_BUNDLE_BUDGET_BYTES = 15 * 1024` and
`QUIZ_PICKER_BUNDLE_BUDGET_BYTES = 4 * 1024` in `scripts/quiz-bundle-size.ts`,
`HOME_GLOBE_BUNDLE_BUDGET_BYTES = 170 * 1024` in
`scripts/home-globe-bundle-size.ts`.

And one finding adjacent to the brief's §3.2 q8, outside this analysis's scope
but owed to whoever opens `src/lib/legal-pages.ts` next: the published data
policy says _« Vercel assure l'hébergement et la distribution de
l'application »_, while `vercel.json` sets `git.deploymentEnabled: false` and
production is a self-hosted stack rebuilt from the repository's `Dockerfile` on
a Release. The sub-processor list is already describing a deployment the project
left. That is a correction owed to the reader independently of embeds, and
stage 3 below is the natural moment to make it, since it opens that file anyway.

## 2. The platform table

One row per platform, answering the brief's §3.1. Every cell carries its mark.
Tested on — nothing: see §0.

|                                                 | **YouTube**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **TikTok**                                                                                                                                                                                                                                                                                              | **Instagram**                                                                                                                                                                                                                                                                                            | **Facebook**                                                                                                                                                                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Official mechanism**                       | Pure `<iframe>`. `https://www.youtube-nocookie.com/embed/{id}` is the privacy-enhanced host. No script required unless the IFrame Player API is wanted. **documented**                                                                                                                                                                                                                                                                                                                                                                                                             | Pure `<iframe>`: `https://www.tiktok.com/player/v1/{id}`, with `postMessage` control. The Share → Embed snippet is the _other_ mechanism: `<blockquote class="tiktok-embed">` plus `https://www.tiktok.com/embed.js`. **documented**                                                                    | Meta's oEmbed API returns a `<blockquote class="instagram-media">` plus `instagram.com/embed.js`. Since **15 June 2026** oEmbed is callable **tokenless**, reversing the October 2020 token requirement. The legacy `/p/{code}/embed/` iframe is undocumented and unconfirmed. **documented / reported** | `<iframe>` via the Embedded Video Player plugin (`facebook.com/plugins/video.php`), or the SDK plus a `<div class="fb-video">`. **documented**                                                                                |
| **2. Login to watch?**                          | No. Public videos play signed-out; this is the operator's stated reason for preferring it. Measured: the project's own short plays in a 360 × 640 frame, signed out, no wall. **observed**                                                                                                                                                                                                                                                                                                                                                                                         | No login wall — but the player draws **TikTok's own cookie banner, in English, over the video**, which must be dismissed before the piece can be watched. **observed**                                                                                                                                  | No wall: `/p/{code}/embed/` and `/reel/{code}/embed/` both render a public post signed out, inside Instagram's own card chrome. **observed**                                                                                                                                                             | Only public Page/profile posts embed. A post restricted to friends **does not play unless the viewer is logged in**. For a public Page video, measured: `plugins/video.php` renders and offers Play, signed out. **observed** |
| **3. Written to the device before interaction** | With **no facade**: `youtube-nocookie.com` sets no cookie on load but writes a device identifier `yt-remote-device-id` to `localStorage`; on **play** Google sets cookies including `VISITOR_INFO1_LIVE`, `YSC`, `GPS` and receives IP, browser characteristics and viewing context. With a **facade**: nothing — 0 requests, 0 cookies, 0 storage keys, measured. Corrected at §6.1: on `youtube-nocookie.com` play sets **no cookie**, and both YouTube hosts write **2 `localStorage` keys before any interaction**, which is what Article 5(3) actually turns on. **observed** | Measured on the official `player/v1` iframe, untouched: **4 cookies** (`ttwid`, `msToken` × 2, `tt_chain_token`), **18 `localStorage` + 6 `sessionStorage` keys**, and **86 requests across 12 hosts**, four of them named telemetry endpoints. The dirtiest of the four by a wide margin. **observed** | The **script** mechanism runs first-party-to-Meta code in the page, so its exposure is strictly larger than an iframe's. The undocumented **iframe** route, measured untouched: **0 cookies, 0 storage**, 57 requests to CDN hosts. **observed**                                                         | As Instagram when the SDK is used. The `plugins/video.php` **iframe**, measured untouched: **0 cookies, 0 storage**, 47 requests to `fbcdn.net` hosts. **observed**                                                           |
| **4. ToS: self-hosted poster + click-to-load?** | Permitted in substance, with a floor: a thumbnail that initiates playback must be **≥ 120 × 70 px** (the shelf's 130 × 231 clears it), YouTube attribution must not be obscured, and **no overlay, frame or visual element may sit in front of any part of the player, including its controls.** A facade _before_ the player mounts is not an overlay over it; anything drawn over the mounted frame is. **documented**                                                                                                                                                           | No prohibition found. The official player exists precisely to be framed. **documented**                                                                                                                                                                                                                 | oEmbed no longer needs an app token (June 2026), so that is **not** a blocker any more. Whether a hand-built facade over the canonical embed is permitted was not established. **documented / untested**                                                                                                 | Not established. **untested**                                                                                                                                                                                                 |
| **5. What breaks, and how the site sees it**    | Deletion, going private or a geoblock leaves the frame rendering YouTube's own error. The embedding page **cannot** read that: the frame is cross-origin and the site would need the JS API to hear it. Detectable out of band — the oEmbed endpoint 404s for a removed video. **documented**                                                                                                                                                                                                                                                                                      | Same structural answer: cross-origin, invisible to the page, detectable out of band via oEmbed. **documented**                                                                                                                                                                                          | Same. Additionally exposed to Meta changing the contract unilaterally — it did exactly that in October 2020 and again in June 2026. **reported**                                                                                                                                                         | Same, plus: changing a post's audience from Public after embedding kills the embed. **documented**                                                                                                                            |
| **6. Aspect and chrome**                        | Fills the box given; a 9:16 short in a 9:16 frame fills it. `rel=0` has **not** disabled related videos since 25 September 2018 — it restricts the end screen to the same channel. Branding and the title bar are not removable. **documented**                                                                                                                                                                                                                                                                                                                                    | Default aspect **9:16**. `controls` can hide the controls, `description` and `music_info` add chrome. **documented**                                                                                                                                                                                    | Blockquote chrome is Instagram's: header, caption, actions. Not a bare player. **documented**                                                                                                                                                                                                            | Plugin chrome, configurable width. **documented**                                                                                                                                                                             |

### What the table decides on its own

Three conclusions follow from cells that are **documented**, not from any
untested cell, which is why they can be acted on now:

**YouTube is the only platform that is a plain iframe on a privacy-enhanced
host with no third-party script.** That is not a preference, it is the whole
difference between a CSP delta of one directive and a CSP delta that admits
executable third-party code into the page.

**TikTok is closer than expected and still second.** `player/v1` is a real
official iframe — the operator's mental model of TikTok as blockquote-plus-
script is out of date. But there is no `nocookie` equivalent, the storage
written before play is reported as non-trivial, and the brief's §3.2 q10 points
at the same company.

**Instagram and Facebook are the weak pair, and June 2026 changed less than it
sounds.** The tokenless reversal removes an operational blocker from a
mechanism that was never the right shape: the canonical Meta embed is a script
in the page, not a frame beside it. `script-src` is the one directive this
project should be least willing to open.

**And the shelf cannot host a player at all, on ToS grounds rather than taste.**
At 130 px wide, YouTube's controls are unusable and the honest fix — drawing
the site's own control over the frame — is the specific thing the developer
policies forbid. The brief's §3.3 q14 is therefore answered by its own §3.1 q4:
**Découvertes owns playback, the shelf navigates.**

## 3. Law and consent

### 3.1 Is consent required before the click, with a facade in place? (brief §3.2 q7)

**Before the click: no. At the click: yes, and the click must say so.**

Article 5(3) of the ePrivacy Directive governs _the storing of information, or
the gaining of access to information already stored, in the terminal equipment_
— and the EDPB's Guidelines 2/2023 on its technical scope are the reference for
what counts (**documented**,
<https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf>,
consulted 2026-09-20). A facade that makes **no request at all** stores nothing
and accesses nothing, so it is outside Article 5(3) entirely. There is nothing
to consent to, and a banner that asked would be asking about nothing.

The click is where it turns, and the trap is precisely here. The CNIL's
position, as reported by consent tooling that implements it, is that **media
controls and tracking consent are distinct acts: pressing play is not consent
to data processing** (**reported**). A button reading _« Lire »_ collects a
decision about watching and then performs a decision about tracking that the
reader never made.

So the click must be labelled as what it is, and — because withdrawal must be as
easy as giving — the choice must be revocable from the panel the footer already
opens. Which answers question 9 before it is asked.

Two honest caveats, kept rather than smoothed:

- The CNIL's own pages could not be fetched (**egress-blocked**). The
  proposition above is reported by implementers, is consistent with the EDPB
  guidelines that _were_ located, and is the conservative reading. Stage 3's
  gate is a lawyer's or the CNIL's own text confirming it, not this paragraph.
- Copyright is a non-issue and should not be confused with privacy: the CJEU
  held in **BestWater (C-348/13, 21 October 2014)** that framing freely
  available content is not a communication to a new public. The project embeds
  its own productions in any case.

### 3.2 What the click must say

Not _« Lire la vidéo »_. Something closer to:

> **Regarder sur place** — la lecture charge le lecteur de YouTube, qui dépose
> des traceurs et reçoit votre adresse IP. Votre choix est gardé et révocable
> dans « Gestion des cookies ». **Ou regarder sur YouTube** →

Three things, in that order: what is about to happen, who receives what, and
the way back. The second link is not decoration — a reader who declines must
still be able to watch the piece, or the "consent" is a toll gate, which is the
failure mode the CNIL calls a lack of free choice.

### 3.3 A fourth category, or per-click consent? (brief §3.2 q9)

**Both, and they are not alternatives.** The category is where the decision is
_stored and withdrawn_; the click is where it is _taken_.

Per-click alone fails withdrawal: a reader who consented on one piece has no
surface that lists the choice or takes it back. A category alone fails
granularity and, worse, would push the decision into the banner — a fourth
switch presented to a reader on arrival, about content they have not reached,
which is exactly the consent-theatre the three-category design has so far
avoided.

The shape:

```
src/types/consent.ts        ConsentCategory gains "embeds"; ConsentPreferences
                            gains embeds: boolean
src/lib/consent.ts          DEFAULT_PREFERENCES gains embeds: false
src/lib/i18n/copy/consent.ts   embeds + embedsDescription, fr and en, added in
                            the same change (copyParity.test.ts still fails the
                            build under REQ-171 — interface copy is bilingual
                            at once)
```

The banner does not grow a fourth toggle it collects on arrival; the **panel**
lists `embeds` so it can be switched off, and the facade writes it on. A reader
who has it on gets the player on one click thereafter; a reader who has it off
gets the facade again. `CONSENT_EXPIRY_MONTHS = 12` already covers expiry.

### 3.4 The legal paragraphs, drafted (brief §3.2 q8)

To be inserted under _« Services et sous-traitants »_ / _"Services and
processors"_ — `src/lib/legal-pages.ts` and `src/lib/legal-pages.en.ts` — **only
when a provider is actually switched on.** Publishing a sub-processor the site
does not contact is a false statement about the site in the direction that
looks prudent.

French, `legal-pages.ts`:

> « Lorsque vous demandez la lecture d'une production sur le site, le lecteur de
> YouTube est chargé depuis `youtube-nocookie.com`, fourni par Google Ireland
> Limited. Cette lecture n'a lieu qu'après une action explicite de votre part :
> aucune requête n'est adressée à Google tant que vous ne l'avez pas demandée.
> Google reçoit alors votre adresse IP, les caractéristiques de votre navigateur
> et le contexte de lecture, et dépose des traceurs sur votre appareil selon sa
> propre politique. Ce traitement relève de Google en tant que responsable
> distinct ; ses durées de conservation sont les siennes et ne sont pas fixées
> par EthniAfrica. Il implique un transfert hors de l'Union européenne, encadré
> par les clauses contractuelles types et le cadre de protection des données
> UE–États-Unis. Votre choix est conservé douze mois et révocable à tout moment
> depuis « Gestion des cookies ». Chaque production reste accessible
> directement sur la plateforme où elle est publiée, sans passer par le
> lecteur. »

English, `legal-pages.en.ts`:

> "When you ask for a production to play on the site, the YouTube player is
> loaded from `youtube-nocookie.com`, provided by Google Ireland Limited.
> Playback happens only after an explicit action on your part: no request is
> made to Google until you ask for one. Google then receives your IP address,
> your browser's characteristics and the playback context, and writes trackers
> to your device under its own policy. That processing is Google's, as a
> separate controller; its retention periods are Google's and are not set by
> EthniAfrica. It involves a transfer outside the European Union, framed by the
> standard contractual clauses and the EU–US Data Privacy Framework. Your choice
> is kept for twelve months and can be withdrawn at any time from "Cookie
> settings". Every production remains reachable directly on the platform that
> publishes it, without going through the player."

The _« Finalités et bases légales »_ section gains one sentence in each
language, since it is the section that names each basis:

> « La lecture d'une production tierce sur le site repose sur votre
> consentement, recueilli au moment où vous la demandez. »

> "Playing a third-party production on the site rests on your consent,
> collected at the moment you ask for it."

Retention is deliberately **not** stated as a number. The brief asks for "the
retention the platform applies", and the honest answer is that the platform sets
it, the project cannot verify it, and printing a figure copied from a vendor
page would be the project asserting something it does not know — the same
failure the assertion-tracks-certainty rule governs everywhere else it writes.

### 3.5 Minors, autoplay and the DSA (brief §3.2 q10)

On **6 February 2026** the European Commission made preliminary findings that
TikTok's design breaches the DSA, naming **infinite scroll, autoplay, push
notifications and a highly personalised recommender** as features that may
foster compulsive use, and faulting the risk assessment for minors and
vulnerable adults specifically (**documented**,
<https://digital-strategy.ec.europa.eu/en/news/commission-preliminarily-finds-tiktoks-addictive-design-breach-digital-services-act>,
consulted 2026-09-20).

Two of those four are things this site could accidentally build. The Découvertes
reader is already a full-screen vertical scroll; adding autoplaying video to it
would reproduce the mechanism in miniature, on an atlas whose own doctrine says
the mechanism that captivates is the mechanism that manipulates.

**The rule the site adopts, and publishes:**

1. **No media ever starts without a deliberate act.** No autoplay, muted or
   otherwise; no play on scroll-into-view; no play on hover.
2. **No chaining.** One piece plays; when it ends, nothing else starts. The
   scroll does not advance for the reader.
3. **No recommender surface.** `rel=0` is set knowing it only narrows the end
   screen to the same channel — it has not removed related videos since 25
   September 2018 (**documented**) — so the frame is unmounted when playback
   ends and the reader is returned to the site's own surface rather than left
   on a third party's suggestion grid.
4. **The facade is the default state, every time**, for a reader who has not
   stored the `embeds` choice.

Rule 3 is the one that costs something and the one most worth keeping. It is
also the reason the mounted frame must be unmountable, which is a component
requirement rather than a policy: see §4.2.

The site is not a VLOP and none of this is a DSA obligation on it. It is the
project declining to build the thing it criticises.

## 4. Technical

### 4.1 The CSP delta, host by host (brief §3.3 q11)

**One directive changes, and only one.** This is the finding that makes the
whole thing cheap, and it is worth stating precisely because it is easy to get
wrong in the expensive direction.

A Content-Security-Policy governs **its own document**. The embedding page's
policy decides whether this document may create a frame pointing at a given URL
(`frame-src`) — it does **not** govern what the framed document then loads. The
player's own scripts, images, fonts and XHR are under YouTube's policy, in
YouTube's document. So the long lists of `script-src https://www.youtube.com`
and `img-src https://i.ytimg.com` that circulate (**reported**) are for two
cases this design does not have: using the IFrame Player **API** (a script in
_our_ page), and loading YouTube's **thumbnails** (an image in _our_ page). The
project self-hosts its posters and needs no JS API.

Which leaves:

```diff
-const FRAME_SRC_HOSTS: string[] = [];
+// src/lib/embeds/providers.ts decides; empty until a provider is switched on.
+const FRAME_SRC_HOSTS = embedFrameSrcHosts();
```

with, per provider:

| Provider                                     | `frame-src` hosts                                                    | Other directives                                                                                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `youtube`                                    | `https://www.youtube-nocookie.com` **and** `https://www.youtube.com` | none                                                                                                                                                     |
| `tiktok` _(not recommended)_                 | `https://www.tiktok.com`                                             | none, **if** `player/v1` is used; the blockquote route additionally needs `script-src https://www.tiktok.com`, which is the reason it is not recommended |
| `instagram` / `facebook` _(not recommended)_ | `https://www.instagram.com` / `https://www.facebook.com`             | the canonical Meta mechanism needs `script-src`, same objection                                                                                          |

**Why YouTube needs both hosts and not just the nocookie one.** `frame-src`
governs _navigations_ of the frame, not only its initial URL. The player's own
chrome navigates to `youtube.com` — the logo, the channel link, the end screen
— so a policy naming only `youtube-nocookie.com` blocks those navigations. That
is both a broken affordance and, under YouTube's developer policies, arguably
interference with the attribution they require not be obscured. Two named hosts,
never a wildcard, consistent with `MEDIA_SRC_HOSTS`' existing rule.

**The allowlist stays empty until a provider is switched on**, as the brief
asks:

```ts
// src/lib/embeds/providers.ts
export type EmbedProvider = "youtube" | "tiktok" | "instagram" | "facebook";

/** frame-src hosts per provider. Declared for all four; granted for none. */
export const EMBED_PROVIDER_FRAME_HOSTS: Record<
  EmbedProvider,
  readonly string[]
> = {
  youtube: ["https://www.youtube-nocookie.com", "https://www.youtube.com"],
  tiktok: ["https://www.tiktok.com"],
  instagram: ["https://www.instagram.com"],
  facebook: ["https://www.facebook.com"],
};

/** The only line that opens the policy. Empty is the shipped default. */
export const ENABLED_EMBED_PROVIDERS: readonly EmbedProvider[] = [];
```

A source constant, not an environment variable — for the same reason
`SOFT_CHECK_NAMES` and `ADVISORY_CATEGORIES` are source constants: a visible
line in a file somebody reviews, never a flag somebody sets on one deployment
and forgets on another. A per-environment CSP is a CSP nobody can reason about.

One mechanical consequence: `FRAME_SRC_HOSTS` is currently evaluated at module
scope, so a test cannot vary it. It must become a call inside
`applySecurityHeaders`, exactly as `supabaseOrigin()` and `sentryIngestOrigin()`
already are.

**The test diff**, which is question 11's second half:

`src/__tests__/middleware.test.ts:767` asserts
`expect(frameSrc).toBe("frame-src 'self'")` by strict equality, and the brief is
right that adding a host fails it by design. It should not be loosened — it
should be **split in two**, so both directions are held:

```ts
// unchanged in substance: with no provider enabled, the policy stays closed
it("declares frame-src restricted to 'self' when no provider is enabled", …)
  expect(frameSrc).toBe("frame-src 'self'");

// new: an enabled provider opens exactly its own hosts and nothing else
it("declares exactly the enabled provider's frame hosts", …)
  expect(frameSrc).toBe(
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com"
  );
```

Strict equality in both, because the value of the original test is that it
cannot be satisfied by accident. The sibling test — _"does not declare an
undeclared media/embed host"_ — survives unchanged and becomes more useful, not
less: it is what stops the allowlist growing a host no provider claims.

### 4.2 The facade component (brief §3.3 q12)

**Where it lives.** `src/components/media/EmbedFacade.tsx`, with its copy in
`src/lib/i18n/copy/embedFacade.ts` (fr + en, written together —
`copyParity.test.ts` still fails the build) and its URL construction in
`src/lib/embeds/providers.ts`. Not under `search/` and not under
`discoveries/`: under the recommendation only Découvertes mounts it, but the
component belongs to neither surface and putting it in one is how the other
grows a second copy.

**Before the click** it renders the poster the site already hosts — the same
`poster {src,width,height}` the record already carries, through `next/image`,
no remote host, no `images` block in `next.config.ts` — inside a single
`<button>`. Not a `div` with a handler, not a link: a button, because that is
what it is. The button's accessible name carries the piece's name _and_ what
the click does, so a screen-reader user hears the transfer before making it and
not after:

> « Regarder « Pourquoi les Peuls s'appellent-ils Fulɓe ? » sur place — charge
> le lecteur de YouTube »

Beside it, never inside it, the sentence from §3.2 above and the link out to the
platform. The link-out is a plain `<a>` and is reachable by keyboard before the
button, so declining costs nothing.

**After the click** it writes `embeds: true` through the existing
`saveConsent`, then mounts

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0&playsinline=1&modestbranding=1"
  title="{piece name}"
  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
/>
```

`autoplay=1` here is **not** the autoplay §3.5 rule 1 forbids, and the
distinction is the whole design: the reader has just pressed a button that says
it will play. A frame that mounts and then waits for a _second_ click inside
YouTube's chrome would be worse for everyone and would teach the reader that
the site's own control means nothing. What rule 1 forbids is a frame that plays
without that act — on mount, on scroll, on hover.

`allow` grants only what the page itself has: `Permissions-Policy` already
denies accelerometer, camera, microphone, geolocation and the rest to the page
_and to every frame it embeds_, so nothing in that list can be re-granted here
even by mistake. That existing header is doing real work and should be left
exactly as it is.

**Unmount, per §3.5 rule 3.** A visible control closes the player and returns to
the poster, and the frame is removed from the DOM rather than hidden — a hidden
iframe is a running iframe. When playback ends the site does not know (see the
table's row 5), so the close control is the reader's, always present, and the
reader who reaches the end screen is one click from the site's own surface.

**Reduced motion.** There is nothing to reduce and that is the point: the swap
is instant, with no crossfade, no scale, no skeleton shimmer, under any
preference. `prefers-reduced-motion` therefore needs no branch, and the
component must not grow one — a transition added later is what would make the
branch necessary.

**Focus and announcement.** On mount, focus moves to the iframe, which is
focusable and carries a `title`. On unmount, focus returns to the button that
opened it. The button is `aria-expanded`-free — it is not a disclosure, it
replaces itself — and the state change is carried by focus movement rather than
a live region, which is the quieter of the two and the one that does not
double-announce.

**The budget** (brief §3.3 q13, second half). In the shape of the two that exist:

```ts
// scripts/embed-facade-bundle-size.ts
export const EMBED_FACADE_BUNDLE_BUDGET_BYTES = 8 * 1024; // 8 KB gzipped
```

Eight, between the quiz picker's 4 KB and the quiz's 15 KB. What it has to pay
for: reading and writing consent, one piece of state, the URL builder, focus
management and the copy. What it must not pay for: a player abstraction, a
provider registry with runtime dispatch, an intersection observer. If it does
not fit in 8 KB it has grown something it should not have, which is what a
budget is for.

### 4.3 Performance, against the 0.95 error threshold (brief §3.3 q13)

**With the facade, the measured delta on `/fr/atlas/recherche` is zero** — and
under the recommendation it is zero twice over.

Once, because Lighthouse loads a page and audits it; it does not click. The
third-party-cookie audit and the console-error audit that move
`categories:best-practices` see a self-hosted image and no third-party request,
because with a facade there is none. Twice, because the shelf does not carry a
facade at all (§4.4): `/fr/atlas/recherche` gains nothing whatsoever.

This is a real and load-bearing conclusion, and it has a sharp edge that must be
written down rather than enjoyed quietly:

**The gate does not protect the post-click state.** Lighthouse never clicks, so
no CI assertion will ever see the mounted iframe. `categories:best-practices`
after a click would drop — third-party cookies are exactly what that category
scores — and nothing in `.lighthouserc.gate.js` or the nightly matrix will
report it. Claiming the gate covers embeds because it stays green would be
claiming a measurement nobody took.

Two consequences for the rollout:

- **`/fr/decouvertes` is not among the four routes** the required gate visits
  (`/fr`, `/fr/atlas/pays/SEN`, `/fr/atlas/peuples/PPL_WOLOF`,
  `/fr/atlas/recherche`). If Découvertes is to own playback it should be added
  to `.lighthouserc.gate.js` — which measures the facade state, the one CI can
  see, and is worth having for the full-screen scroll regardless of embeds.
  Note `lighthouseAxeCoverage.test.ts` holds the precondition that axe-core
  audits every route this gate visits, so adding a route means adding it in
  `a11y.yml` too.
- **The post-click state is measured by hand, once per provider, and the figures
  are written into this file** as part of stage 3's gate. A number in a document
  somebody took is worth more than a threshold nobody's tooling evaluates.

  **Measured 2026-09-20 (ETNI-1980), YouTube, on the production build.** A
  Lighthouse 12.6.1 user flow on `/fr/decouvertes/origine-du-nom-mande`, mobile
  emulation, Chrome for Testing on a developer machine, consent seeded the way
  the gate seeds it. Best practices: **1.00** on a navigation with the facade
  only (the gate's own measurement); **0.95** on a timespan covering the click,
  the frame mounting and eight seconds of playback; **1.00** on a snapshot with
  the player mounted. Three runs, the same figures. The frame mounted, so
  `frame-src` admits it in a real browser; no console error or warning; no
  cookie kept for the YouTube hosts. The one failing audit is `inspector-issues`,
  a single _Cookie_ issue, which is the finding amended at §6.1. **The click
  state sits exactly on the 0.95 threshold**, so a second issue would put it
  under. A timespan is scored over fewer audits than a navigation, so its figure
  is not comparable one to one with the gate's.

  **Reproduced the same day by a second session (PR #1198), with other
  tooling:** Lighthouse 12.8.2 through its user-flow API, Chrome for Testing 152,
  430 x 932 at a device pixel ratio of 2, the consent banner already answered,
  one run. The same three figures, 1.00, 0.95 and 1.00. It counted what the
  first measurement did not, and **I have not re-run these three points**:
  - **Third-party requests.** None before the click; **38, to eight hosts**,
    across the click and six seconds of playback: `www.youtube-nocookie.com`,
    `www.google.com`, `m.youtube.com`, `i.ytimg.com`, `yt3.ggpht.com`,
    `fonts.gstatic.com`, `jnn-pa.googleapis.com` and a `googlevideo.com` media
    node (its name varies). This is §4.1 seen from the other side: `frame-src`
    governs the frame's navigation, not what the framed document loads, and
    nothing in our policy could or should restrict it.
  - **A snapshot is blind to the click state.** It reads 1.00 because a snapshot
    audits the DOM and has no console or Issues log to read; only the timespan
    sees the `inspector-issues` finding. Someone who ran only that mode would
    conclude the post-click state is clean.
  - **Nothing here is enforced.** No CI job clicks, so the figure can move with no
    change on our side, because it depends on what YouTube ships that day. The
    availability watch asks whether a piece still plays, not what the player
    logs. Re-measure by hand when the provider list changes.

### 4.4 Which surface owns playback (brief §3.3 q14)

**Découvertes owns playback. The shelf navigates.** One player, one consent
surface, one component.

The shelf keeps exactly what it does today — a self-hosted poster inside a
`next/link` — and the destination becomes the piece's Découvertes entry rather
than the section head. `watchUrl`, which the brief correctly notes travels in
the API payload and is never used, stays the link of last resort and the
platform link inside the facade; it does not become the shelf's `href`, because
sending a reader off-site from a result page is the opposite of what the shelf
is for.

Three reasons, in descending order of how much they bind:

1. **The ToS forbids the shelf's version.** At 130 px the player's controls are
   unusable and drawing the site's own over them is the specific prohibition in
   YouTube's developer policies (§2, row 4). There is no compliant small player.
2. **The result page is the product.** Its charter's rules are refusals, and its
   required Lighthouse gate is the one that errors at 0.95. Mounting third-party
   frames on the atlas's most load-bearing surface, to answer a question that is
   about names, buys a risk the surface has no reason to carry.
3. **Two players is the maintenance trap the brief names.** It is also how a
   consent bug ships on one surface and not the other.

The cost, stated plainly: a reader on the result page needs two clicks to watch
— one to Découvertes, one to consent. That is the right number. The first is
navigation, the second is a data-protection decision, and collapsing them is
precisely the conflation §3.1 above says the CNIL refuses.

### 4.5 Carousels (brief §3.3 q15)

**Self-hosted images. No embed, no provider, no consent, no CSP change.**

The `carousel` kind has existed in `DiscoveryPublication` on both branches and
renders nowhere; no record has ever used it. Deciding it now is the cheapest
win in this document, because the brief already contains the argument:
self-hosting a carousel avoids every question in the brief's §3.1 and §3.2,
entirely.

It also happens to be the only option that is _better_, not merely cheaper:

- The frames are rendered by `social/harness` from the project's own
  `cards.json`. The source files exist before the platform does. Embedding an
  Instagram post to show images the site generated would route the site's own
  output through a third party to get it back.
- The licence discipline is already paid: the brand charter's "a licence is
  published, not named", the `image.licence` / `licenceUrl` fields on the
  publication, `afrik_media.licence_uri` `NOT NULL` in the database. An
  Instagram embed publishes a licence the site cannot state.
- `public/images/discoveries` already carries 36 files at 11 MB on the feed
  branch, licence-checked, with no CDN and no complaint.

Shape, mirroring the `image` kind rather than inventing beside it:

```ts
carousel?: {
  frames: ReadonlyArray<{
    src: string; width: number; height: number;
    alt: Record<Language, string>;
  }>;
};
```

Rendered in the reader as a horizontal snap track inside the existing
full-screen card — the same mechanic `ShortsBlock` already uses for the shelf
(`snap-start`), turned ninety degrees and one card at a time, with the frame
index announced and arrow keys bound. `DiscoveryReader` branches on `image` and
`proverb` today and falls through to the photo fallback otherwise; `carousel`
becomes the third branch, and `video` the fourth.

**Weight is the one thing to watch, and it needs a gate before it needs a
policy.** There is no `.gitattributes`, no LFS and no CI size check, so nothing
stops a carousel pass from adding 40 MB to `public/`. Stage 1 below adds a
tracked-file size ceiling in the shape the repository already uses for
everything else — a ratchet that fails in both directions — rather than a rule
nobody measures.

## 5. The alternative to embedding

### 5.1 Self-hosted playback (brief §3.4 q16)

Arithmetic from stated assumptions, so the assumptions can be argued with
instead of the conclusion.

**Storage.** A 60-second 1080 × 1920 short at a web bitrate of 2–3 Mbps is
15–22 MB; call it **20 MB** for a delivered file, and 60–80 MB for the master
the workshop keeps. At the operator's stated cadence of **30 pieces a month**:

|                                      | Per month | Per year  |
| ------------------------------------ | --------- | --------- |
| Delivered files (one rendition)      | ~0.6 GB   | **~7 GB** |
| With three renditions (1080/720/480) | ~1.3 GB   | ~16 GB    |
| Masters, if they were versioned      | ~2.1 GB   | ~25 GB    |

**Seven gigabytes a year of delivered video is not the problem.** Even three
renditions at sixteen is a rounding error against any disk.

**Bandwidth is the problem, and it scales with success rather than with
cadence.** Egress is views × bytes, and it is unbounded by anything the project
controls:

| Video views / month | Egress / month (20 MB each) |
| ------------------- | --------------------------- |
| 1 000               | 20 GB                       |
| 5 000               | 100 GB                      |
| 50 000              | 1 TB                        |

Production's Supabase is **self-hosted on a VPS**, which changes the shape of
the bill entirely: Storage there is that machine's disk and that machine's
transfer allowance, not a metered per-GB product, so the marginal euro cost of
the first terabyte is plausibly zero. What it costs instead is **contention** —
the same machine serving the database that every `/api/v2` read goes through —
and there is no CDN in front of anything today (`public/` is 36 MB served
direct). A hosted Supabase project's egress _is_ metered; the retired hosted
project is not where production lives, so its pricing does not apply and is not
quoted here.

Prices found by search and **not verified against a vendor page** (**reported**,
consulted 2026-09-20): CDN delivery around **$0.01/GB** at the cheap end of the
storage-plus-CDN market, and roughly **$0.12 to encode a ten-minute 1080p
video** on a per-use streaming product. At 100 GB/month that is order **$1/month
of delivery** — which is to say the money is not the argument in either
direction.

**The real cost is operational, and it is not small:** an encoding ladder, HLS
packaging so a 3G reader on a phone is not handed a 20 MB progressive file, a
player (captions, keyboard, full-screen, reduced motion — all the work
`EmbedFacade` gets free from the platform), poster generation, and a place to
put the files that is not git. The repository rule that **renders are never
versioned** is not an obstacle here so much as a signpost: self-hosting needs an
object store and a publish step, which is a pipeline, which is the thing
`social/` deliberately kept outside this repository.

It is the right **second** choice precisely because it removes the third party
entirely — no consent category, no sub-processor, no CSP host, no platform that
can delete the piece. It is not the first choice because it is the only option
whose cost is a system to maintain rather than a component to write.

### 5.2 Doing nothing but linking out (brief §3.4 q17)

The current design, stated at its strongest, because it is the baseline every
stage below has to beat.

**What the site gains:** zero third-party contact, so no consent category, no
banner copy, no sub-processor paragraph, no transfer outside the EU to declare.
`frame-src 'self'` stays literally true and the test at `middleware.test.ts:767`
stays as written. No JS. No bytes. Nothing to maintain and nothing that breaks
when a platform changes its contract — which Meta did twice in six years.

**What the reader loses:** the piece. A link out of a full-screen reader on a
phone is not a soft ask — it is an app switch, a platform's own recommender on
arrival, and in practice the end of the session. The site publishes thirty
pieces a month and shows none of them, while drawing a shelf for shorts whose
catalog is empty and a reader can never fill by scrolling.

**And the site loses the argument it makes.** An atlas whose productions are
only watchable on the four platforms is an atlas that has outsourced its own
work to them. That is a doctrine cost, not a UX one, and it is why "do nothing"
is the baseline rather than the recommendation.

## 6. The test the analysis owed, and what it returned

**Run 2026-09-20.** One clean Chromium context per platform — a fresh profile,
no account, no prior cookies — against the project's **own public posts**, with
the frame mounted on a local scratch page and every request, cookie and storage
key recorded from outside the frame. Each figure below is first-hand; the
protocol is at the end of this section so it can be repeated.

### 6.1 What each platform writes before it is touched

Frame mounted, nothing clicked. Cookies are read from the browser's own jar, so
the frame's third-party cookies are counted; storage is read **inside** the
frame, at its own origin.

| Embed, untouched                        | Requests / hosts | Cookies | localStorage | sessionStorage |
| --------------------------------------- | ---------------: | ------: | -----------: | -------------: |
| `youtube-nocookie.com/embed/{id}`       |     14 / 6 hosts |   **0** |            2 |              0 |
| `youtube.com/embed/{id}`                |                — |   **5** |            2 |              0 |
| `tiktok.com/player/v1/{id}`             |    86 / 12 hosts |   **4** |       **18** |          **6** |
| `instagram.com/{p\|reel}/{code}/embed/` |     57 / 3 hosts |   **0** |            0 |              0 |
| `facebook.com/plugins/video.php?href=…` |     47 / 8 hosts |   **0** |            0 |              0 |
| **Any of them behind the facade**       |        **0 / 0** |   **0** |        **0** |          **0** |

**The facade line is the one that matters, and it is exact.** With a poster and
a button in front, the page makes no request to any platform host, sets no
cookie and writes nothing to the device. The claim §3.1 rests on is not an
inference from "a facade makes no request" — it was measured, three times.

**Zero cookies is the host's doing, not the browser's**, and that needed its own
control or the whole row would be worthless. Loaded top-level, `youtube.com`
sets five (`VISITOR_INFO1_LIVE`, `YSC`, `__Secure-YNID`, `__Secure-ROLLOUT_TOKEN`,
`VISITOR_PRIVACY_METADATA`) and `youtube-nocookie.com` sets none; framed and
untouched, `youtube.com` sets the same five. So third-party cookies are neither
blocked nor partitioned away in this context, the jar works, and the
privacy-enhanced host genuinely does what its name says.

**But no cookie is not no storage, and that decides the consent question.**
Both YouTube hosts write two `localStorage` keys before any interaction
(`yt-icons-last-purged`, `ytidb::LAST_RESULT_ENTRY_KEY`), and pressing play adds
a third (`yt-player-caption-persistence`). Article 5(3) covers _storing
information on the device_, not cookies specifically, so a bare frame needs
consent on this evidence even on the no-cookie host. That is an argument **for**
the facade, not against it — and it is the one a reviewer should check first,
because it is the point where "nocookie" invites a wrong conclusion.

On play, `youtube-nocookie.com` adds exactly one host — a `googlevideo.com`
media CDN — and **still sets no cookie**. The secondary reporting in §11 says
play sets `VISITOR_INFO1_LIVE`, `YSC` and `GPS`; on this measurement, on this
host, it does not. That reporting predates the behaviour and is now corrected
here rather than carried forward.

**Amended 2026-09-20 (ETNI-1980): no cookie _kept_ is not no cookie
_attempted_.** The measurement above reads the browser's cookie jar, which shows
what was kept. A Lighthouse flow through the click also reads DevTools' own
issue log for the frame, and it records four `SetCookie` operations from
`www.youtube-nocookie.com` on play: `TESTCOOKIESENABLED` (a probe for cookie
support, repeated) and `LAST_RESULT_ENTRY_KEY` on `.www.youtube-nocookie.com`,
the same name as the `ytidb::LAST_RESULT_ENTRY_KEY` storage key above, so a
cookie fallback for it. None carries a `SameSite` attribute, and Chrome excludes
such a cookie in a cross-site frame (`ExcludeSameSiteUnspecifiedTreatedAsLax`),
which is why the jar stayed empty. **The host tries to write cookies on play;
whether they are kept is the browser's decision**, and a browser that does not
apply that default would keep them. Read every "sets no cookie on play" in this
document as "kept no cookie in Chrome". The decision does not move: the facade
and the click are what stand between the reader and this, the drafted legal
paragraph (§3.4) already says Google writes trackers to the device on play, and
neither sentence claimed otherwise.

### 6.2 What a signed-out reader actually sees

Screenshots, per the brief, in `docs/plans/embedded-media-captures/`.

- **YouTube** (`youtube-after.png`) — the project's own short plays, signed
  out, no wall, filling a 360 × 640 box edge to edge. §1's arithmetic holds in
  pixels: a 9:16 short in a 9:16 frame fills it.
- **TikTok** (`tiktok-before.png`) — **the official player draws TikTok's own
  cookie banner inside the frame, in English, over the video.** "Allow cookies
  from TikTok on this browser?", with _Decline optional cookies_ and _Allow
  all_. This is the finding the documentation could not have given, and it is
  disqualifying on its own: embedding TikTok puts a second consent dialog, from
  a second party, in a second language, on top of the project's own production —
  after the reader has already answered the site's banner. The piece cannot be
  watched until someone else's consent interface has been dismissed.
- **Instagram** (`instagram-reel.png`) — the reel renders signed out, but
  inside a white card carrying Instagram's header, profile button, like,
  comment, share and save controls and a _Voir plus sur Instagram_ link. §2's
  row 6 said the blockquote is "not a bare player"; the iframe is not either.
  On the Découvertes night stage that is a white panel of another product's
  interface.
- **Facebook** (`facebook-before.png`) — `plugins/video.php` renders the video
  signed out with a Play control and a "Cliquez pour regarder sur Facebook"
  overlay. No wall for a public Page video.

### 6.3 One ranking this overturns

§7 called TikTok "closer than expected and still second". **On measurement it
is the worst of the four**, by a wide margin and on every axis: 86 requests
across 12 hosts including four named telemetry endpoints
(`mon16-normal-*.tiktokv.eu`, `mcs-ie2.tiktokw.eu`, `mcs16-normal-*.tiktokw.eu`,
`mon.tiktokv.com`), 4 cookies and 24 storage keys before anything is touched,
and its own consent banner over the piece.

And the pair the analysis called weak is, on this one axis, clean: both Meta
**iframe** routes set no cookie and write no storage before interaction. That
does not promote them. The objection to Meta was never this axis — it is that
the _canonical, documented_ mechanism is a script in the page, that the iframe
route for Instagram is undocumented and has been broken twice, and that the
chrome is another product's. But it is recorded here because the analysis
argued Meta was worse than TikTok on privacy, and on the numbers that is the
wrong way round.

**None of this changes the first choice.** YouTube remains the only route that
is documented, cookie-free on a named privacy host, free of third-party script,
free of a foreign consent dialog, and already where the operator publishes.

### 6.4 The protocol, to repeat it

Fifteen minutes. A clean profile, no account, devtools on Application and
Network. One public piece per platform, framed on a local scratch page:

1. Load with the frame present and **do not touch it**. Record every cookie,
   `localStorage` and `sessionStorage` key written, and every request with its
   host. Read storage from inside the frame; the parent cannot see it.
2. Press play. Record the same three lists and the delta.
3. Screenshot what is on screen, signed out: the piece, a wall, or a banner.
4. Repeat with the facade in place and confirm the first list is empty.
5. **Run the first-party control**: load the same embed document top-level. If
   cookies appear there and not in the frame, the browser is blocking or
   partitioning third-party cookies and every framed zero is an artefact.

Step 5 is the one this pass added, and it is not optional. Without it the
headline result — "the privacy host sets no cookie" — is indistinguishable from
"this browser refuses third-party cookies", and the analysis would have
published a property of the test bench as a property of Google.

### 6.5 Carousels re-tested, against TikTok's specific photo/carousel player (2026-09-23)

**Run for ETNI-1985 / DEC-064**, after the operator asked whether §4.5's
self-hosted-only decision for carousels should be reopened specifically for
TikTok's carousel (photo) embed — a materially different mechanism from the
video player §6.1 measured, since a photo post carries no video stream. The
operator's own conditional ruling, recorded on `DEC-064` before this test ran:
enable TikTok for carousels only if it measures **comparable to
`youtube-nocookie.com`**, not merely "better than TikTok's own video embed".

**Method.** `docs/productions/langue/001-lingala.json`'s real published
carousel (`https://www.tiktok.com/@ethniafrica/photo/7685962182923767062`),
framed untouched on a local scratch page via TikTok's documented
`https://www.tiktok.com/player/v1/{post_id}` syntax, one clean browser context,
no prior TikTok visit. Requests and cookies were captured through Chrome's
DevTools Protocol (Playwright), which — unlike a page-level network listener —
does see cross-origin iframe subresources; a same-harness YouTube control
(§6.1's own embed) reproduced 15 requests across 6 hosts, confirming the
method sees what §6.1 saw. **Not reproduced**: §6.1's `localStorage`/
`sessionStorage` read "from inside the frame" — that requires access this
session's tooling could not obtain across the cross-origin boundary. Every
figure below is cookies-and-requests only; the storage-key comparison is left
to whoever next runs this with real DevTools Application-panel access.

| Embed, untouched (carousel-specific)                            |  Requests / hosts |                                   Cookies |
| --------------------------------------------------------------- | ----------------: | ----------------------------------------: |
| `tiktok.com/player/v1/{photo_id}` (this run)                    | **73 / 12 hosts** | **5** (4 `.tiktok.com` + 1 `.tiktokw.eu`) |
| `tiktok.com/player/v1/{video_id}` (§6.1, video, for comparison) |     86 / 12 hosts |                                         4 |
| `youtube-nocookie.com/embed/{id}` (§6.1, the bar to clear)      |      14 / 6 hosts |                                         0 |

**The hypothesis this test was run to check — that a photo/carousel embed,
carrying no video stream, might be materially lighter than TikTok's video
embed — does not hold.** 73 requests to 12 hosts is the same order of
magnitude as the video embed's 86/12, not a fraction of it: the same
telemetry, consent and playback-framework bundle loads for a still-image
carousel as for a video. It initialized the same cookie-banner SDK
(`cookie_banner_tea_sdk`), generated the same kind of persistent
`user_unique_id`/`web_id` before any interaction, called a personalised
`api/related/item_list` recommendation endpoint, and attempted a device
`getInstalledRelatedApps()` / `accelerometer` read (blocked by permissions
policy in this frame, but attempted) — none of which a still-image carousel
has any functional need for.

**The screenshot answers §6.2's question the same way for the carousel as for
the video.** TikTok's own English-language cookie banner — "Allow cookies from
TikTok on this browser?", _Decline optional cookies_ / _Allow all_ — draws
directly over the carousel's first frame, untouched, exactly as §6.2 recorded
for the video embed. The disqualifying finding of §6.2 is not video-specific.

**Against the operator's own threshold, this does not clear it.** 73/12/5 is
not "comparable to `youtube-nocookie.com`"'s 14/6/0 by any reading; it is
closer to — arguably worse in cookie count than — the video embed §6.1 already
measured and §7 already rejected. Per the conditional ruling recorded on
`DEC-064`: **`DEC-059`'s self-hosted-only default stands for carousels.** This
also confirms, empirically, the architectural case §4.5 already made on
licensing and reuse grounds alone: self-hosting was already the better choice
before any privacy number existed, and this test finds no privacy number that
would change that.

**What was not re-tested.** Instagram's carousel embed: no equivalent public
`/p/{code}/embed/` render could be confirmed reachable for a private-workspace
post within this session's scope, and inventing a number for it would be worse
than reporting none. If Instagram's carousel embed is measured later, it
belongs in this same table, not a new one.

**First choice — self-host the carousels, and play the videos through a
click-to-load facade over `youtube-nocookie.com`, YouTube alone.** TikTok,
Instagram and Facebook keep linking out.

It is the only route where every load-bearing claim is now **observed** rather
than argued: a plain iframe, a privacy-enhanced host that sets **no cookie** on
load or on play (§6.1, with the first-party control that makes the zero mean
something), no third-party script, no login wall and no foreign consent dialog
(§6.2), a thumbnail floor (120 × 70) the reviewed geometry already clears, and a
CSP delta of exactly one directive. It answers the operator's actual request — the pieces become
watchable on the site, in Découvertes, with the shelf pointing at them — and its
kill switch is one constant: `ENABLED_EMBED_PROVIDERS = []` closes the policy
and the facade stops rendering. One commit, though not one line — §9's stage 3
notes what has to come out with it.

**What it costs.** A fourth consent category and the panel work to withdraw it.
A sub-processor paragraph in four places (two sections × two languages). Two
named hosts in `frame-src`, forever, including the one the player navigates to.
A component with a real accessibility contract. And the honest admission that
after the click, a reader's IP and device reach Google, under Google's retention
and not the project's.

**What it forecloses.** Nothing structural. The facade is provider-shaped from
day one; adding TikTok later is a constant and a URL builder, once the test in
§6 has been run. Self-hosting later reuses the same component with a different
inner element. The one thing it does foreclose is the claim that the site
contacts no third party, and that claim should be given up deliberately, in the
data policy, in the reader's own words — not quietly.

**Second choice — self-hosted playback from the project's own storage**, per
§5.1. Chosen if the §6 test shows YouTube writing to the device _before_ the
click (which would make the facade insufficient rather than merely a courtesy),
or if the operator judges the doctrine cost of naming Google a sub-processor
higher than the cost of running an encoding pipeline. It is strictly better on
every axis this project usually cares about — sovereignty, permanence, no
consent to collect — and strictly worse on the one that decides whether things
ship: it is a system, not a component. Seven gigabytes a year, order a euro a
month of delivery, and an encoding ladder, a player and a publish step to
build and keep.

**One correction the measurement forced, kept in view.** The paragraph below
called TikTok "closer than expected" and ranked Meta last on exposure. On the
numbers that is the wrong way round: TikTok is the dirtiest of the four before
any interaction, and both Meta iframe routes set nothing at all. The conclusion
does not move — Meta's _documented_ mechanism is still a script in the page and
Instagram's iframe is still undocumented and twice-broken — but the reason has
changed, and §6.3 carries it.

**Not recommended, and why, so it does not get re-litigated quarterly.**
Instagram and Facebook: their canonical mechanism puts a Meta script in the
page, and `script-src` is the directive this project should be least willing to
open. TikTok: `player/v1` is a real iframe, and that is the end of the good news.
Measured untouched it sets 4 cookies and 24 storage keys over 86 requests to 12
hosts, four of them telemetry endpoints — and it **draws its own cookie banner,
in English, over the video** (§6.2), so a French reader who has already answered
this site's banner is asked again, by someone else, before seeing the piece.
§3.5's Commission findings are about that company's design. All
three keep linking out, which is what they do today.

## 8. Spec of the chosen route

Everything below is the first choice, written so the implementation has nothing
left to invent. The CSP delta is §4.1, the component is §4.2, the consent delta
is §3.3 above, the legal paragraphs are §3.4 above and the budget is §4.2; this
section carries what those do not: the data model, the identifier, and the
failure mode.

### 8.1 The data model delta

On `DiscoveryVideoRecord` (`src/lib/discoveries/videos.ts`, codex branch), one
optional field:

```ts
  /**
   * Where the piece can be played in place, when it can. Absent means the
   * record links out and nothing else — which stays a valid, shipped state.
   */
  embed?: {
    provider: EmbedProvider;
    /** The platform's own identifier. Never a URL: see below. */
    id: string;
  };
```

carried into `DiscoveryPublication["video"]` by `videoPublications()` beside
`watchUrl`, which keeps its job.

**`platform` and `embedUrl` are both deliberately absent**, against the brief's
own guess at the shape, and for the same reason in both cases.

`platform` would duplicate `embed.provider`, and a record whose `platform` says
one thing and whose `embed.provider` says another is a bug with no single place
to fix it. One field, and it is the one the CSP and the URL builder both read.

`embedUrl` is worse than redundant. A stored URL is an unvalidated string that
ends up as an `iframe src` — which is the one place in this codebase where a
string becomes a navigable origin, and `strict: false` means the compiler will
not help. Derive it instead, in `src/lib/embeds/providers.ts`, from a validated
identifier:

```ts
const ID_SHAPE: Record<EmbedProvider, RegExp> = {
  youtube: /^[A-Za-z0-9_-]{11}$/,
  tiktok: /^\d{5,25}$/,
  instagram: /^[A-Za-z0-9_-]{5,20}$/,
  facebook: /^\d{5,25}$/,
};
```

An identifier failing its shape is not rendered and is reported by the
validator, exactly as a malformed ISO 639-3 code is. The gain is not only
safety: when a provider changes its URL form — which is the thing platforms
reliably do — it is one function, not a migration over every record.

REQ-128 applies unchanged and is worth naming, since it is the requirement the
middleware comment defers to: any video attached to an entity carries its
author, a licence URI and the source page it came from. These are the project's
own productions, so the author is the project and the licence is the one
`social/harness` computes at render; the field is filled, not waived.

### 8.2 When the piece goes away (brief §3.1 q5)

The page cannot see it — the frame is cross-origin — so the site finds out the
way it finds out about anything else it cannot observe: by asking, out of band,
on a schedule, and reporting rather than blocking.

`scripts/checkEmbedAvailability.ts` calls each published record's provider
oEmbed endpoint and lists the ones that 404. It runs nightly, **cannot fail the
job**, and exits 0 on findings — the shape `check:translation-parity` already
has, and for the same reason: a network round-trip to a third party is not a
thing a pull request should be able to be blocked by.

The fix is a hand edit to `DISCOVERY_VIDEOS`, which is a source array in git.
A record whose piece is gone drops its `embed` field and keeps its `watchUrl`,
degrading to the link-out that is the shipped default — no status change, no
disappearing card, and the reader still learns the piece exists. That
degradation path is the reason `embed` is optional rather than required.

## 9. Staged rollout

Four stages. Each ships on its own and each reverses in one commit.

### Stage 1 — Carousels, self-hosted · **done 2026-09-20**

The `carousel` branch in `DiscoveryReader`, the `carousel` field per §4.5, and a
tracked-file weight ceiling before the first pass lands rather than after it.

**Two deviations from this section as written, both deliberate.**

_The weight gate is a one-way ceiling, not a two-way ratchet._
`scripts/ci/checkPublicAssetWeight.ts` fails above 36 MiB total or 2 MiB for any
single file, and prints the headroom on every run; it does not fail when the
number goes down. The ratchet shape in `checkDeadCode.ts` works on a count of
findings, which moves only when somebody decides it should. A byte total moves
whenever an image is re-encoded, and a gate that fails the build because a
picture got _smaller_ is a gate that gets routed around within a week — which is
the failure the ratchet doctrine exists to prevent. Measured at landing: 146
tracked files, 35.29 MiB, 0.71 MiB of headroom.

_No first record ships with it._ A published carousel needs real frames from the
render library, licence-checked, and that library is outside this repository.
Inventing frames to fill the branch would publish files the project cannot state
a licence for — so the branch, the contract and the gate land here, and the
first record is content work that follows. The eligibility rule refuses a
carousel of fewer than two frames, or one whose frames are not described in both
languages, so an under-specified record cannot reach a reader by accident.

No third party, no consent, no CSP, no legal change. It is first because it
delivers a working half of the operator's request while stage 2 is still a
browser window nobody has opened, and because it is the stage that is right
whatever the rest of this document turns out to be wrong about.

**Reverses by** removing the branch; the records degrade to the existing photo
fallback.

### Stage 2 — The measurement · **done 2026-09-20**

Run §6, write the result into §2's table and amend §7 if it contradicts the
recommendation. No code.

**Run, and the gate is open.** §2's YouTube column carries no **untested** mark:
the frame is cookie-free on load and on play, the facade makes no request at
all, and the first-party control proves both numbers are the platform's
behaviour rather than the test bench's. §6.3 records the two claims that did not
survive — YouTube's cookies on play, and TikTok's rank — and neither moves the
first choice.

It was a stage rather than a footnote because it was a **gate**: had the test
shown `youtube-nocookie.com` writing to the device from behind a facade, the
second choice in §7 would have taken over and stage 3 would be a different
stage. It did not. What it did show is that a **bare** frame writes two
`localStorage` keys before any interaction, which is the strongest argument in
this document for the facade being required rather than courteous.

### Stage 3 — The switch-on

`src/lib/embeds/providers.ts` with `ENABLED_EMBED_PROVIDERS = ["youtube"]`;
`FRAME_SRC_HOSTS` derived inside `applySecurityHeaders`; the split middleware
test; the `embeds` consent category, its copy and its row in the panel;
`EmbedFacade` and its copy module; the `embed` field and its validation; the
`video` branch in `DiscoveryReader`; the legal paragraphs in all four places;
the budget script; and **one** published record.

**This stage does not subdivide, and that is a finding rather than an
oversight.** Each smaller slice is dishonest on its own: the component without
a consumer is dead code, which `check:dead` holds at zero for files and would
refuse; the consent category without a provider collects a decision about
nothing; the legal paragraph without a provider publishes a sub-processor the
site does not contact; and the CSP host without any of it opens the policy for
no reason. The stage is large because the honest unit is large.

One record, not the catalog. The first one proves the contract end to end —
consent written, frame mounted, focus moved, close control returning — and a
catalog pass is content work that follows a working surface.

**Reverses by** setting `ENABLED_EMBED_PROVIDERS = []` and dropping the
record's `embed` field: the CSP closes, the facade never renders, the reader
gets the link-out. The consent category and the legal paragraphs then have to
come out too, or they describe a site that no longer exists — so the revert is
one commit, not one line, and it is worth writing that down before it is needed.

### Stage 4 — The shelf, and the watch

The shelf's `href` moves from the section head to the piece's Découvertes entry.
`/fr/decouvertes` joins the four routes in `.lighthouserc.gate.js` and, in the
same change, `a11y.yml` — `lighthouseAxeCoverage.test.ts` holds the precondition
that axe-core covers every route the gate visits. `checkEmbedAvailability.ts`
starts running nightly. The hand-measured post-click Lighthouse figures from
§4.3 are written back into this file.

**Reverses by** reverting the `href`; the rest is measurement and removing it
only removes information.

**Status, 2026-09-20 (ETNI-1970, ETNI-1980): done.**
Reading the code and measuring moved four things away from the text above:

- **The shelf's `href` was already the piece's Découvertes entry**
  (`discoveryPath` in the companions handler), so nothing moved. A handler test
  now holds it, in both languages, against the section head and against
  `watchUrl`.
- **The gate visits the entry that carries the facade, not `/fr/decouvertes`.**
  The index answers a 307 to the deck's first entry
  (`burkina-faso-trois-langues`), so auditing it would have audited an unrelated
  entry and moved with the catalogue's order. The axe route list is
  `scripts/a11yRoutes.ts`, composed from the slug table, not `a11y.yml`. The
  required check is now named _Lighthouse gate_, without a route count. It kept
  its old name, _(4 routes)_, for a short while though it visited five, because branch
  protection on `recette` matches required checks by name and a rename without
  the protection rule leaves the check unreported and blocks every pull request;
  it was renamed in three steps with a temporary alias job (#1202), and the alias
  is gone.
- **axe found a real violation the plan did not expect.** `valid-lang` failed on
  the Amharic and Shona proverbs (`lang="amh"`, `lang="sna"`), which the gate's
  ISO 639-3 allowance in `scripts/a11y-test.ts` did not name. Adding the route
  as planned would have turned axe red on every pull request; both codes are
  added and the route audits clean in `fr` and `en`.
- **Measured on the production build, facade state, on a developer machine**,
  with the repository's own gate configuration (`@lhci/cli` 0.15.1): best
  practices **1.00** on the entry, against **0.96** on the control route
  `/fr/atlas/recherche`. Performance is a warning by design and read 0.77 on the
  entry. This is the state CI can see, which is the one the gate covers.

The nightly check is `scripts/checkEmbedAvailability.ts`
(`npm run check:embed-availability`), scheduled in its own workflow. Measured
against YouTube's oEmbed endpoint: the real record answers 200 and an unknown
identifier 404. A 401 for a private piece is reported behaviour, not measured.

**The post-click figures (ETNI-1980) were measured on 2026-09-20 and are at
§4.3:** 1.00 with the facade, 0.95 across the click and eight seconds of
playback, 1.00 with the player mounted. Taking them surfaced the cookie attempt
amended at §6.1.

## 10. Gates, and the tests each stage breaks on purpose

Run `make check` at every stage; the lines below are what is specific to each,
and every "breaks" is a test whose current assertion is _correct today_ and must
change with the behaviour rather than be loosened to accommodate it.

| Stage | Must pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Breaks on purpose                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | `check:dead`, `test:charter-contracts`, `copyParity.test.ts`, `check:copy-literals` (the carousel's copy goes through `i18n/copy/discoveries.ts`, never a literal in the component), the new `check:asset-weight`, `check:orphan-docs`                                                                                                                                                                                                                                                   | Predicted, and **did not happen**: no test on `recette` asserted that a non-`image`, non-`proverb` kind falls through to the photo fallback. The prediction was made against the codex branch's reader. Nothing had to be loosened, and the suite went green on the new branch without touching an existing assertion.                                                                                                |
| **2** | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | —                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **3** | `lint:req` (every new test annotated; REQ-128 owns the media-and-embeds decision, and the consent category needs a REQ drafted through `/ethniafrica-spec` before the tests that cite it are written), `copyParity.test.ts` (the `embeds` strings land in `fr` and `en` together — REQ-171 does not relax interface copy), `check:copy-literals`, `check:dead`, `.lighthouserc.gate.js` at `best-practices ≥ 0.95` on all four routes, the new `embed-facade-bundle-size` budget at 8 KB | **`src/__tests__/middleware.test.ts:767`**, `expect(frameSrc).toBe("frame-src 'self'")` — split into the two strict-equality tests in §4.1, never loosened to `toContain`. Any consent test enumerating exactly three categories: `src/lib/__tests__/consent.test.ts`, `src/hooks/__tests__/use-consent.test.tsx`, `src/components/consent/__tests__/ConsentBanner.test.tsx`, `src/app/__tests__/providers.test.tsx`. |
| **4** | `lighthouseAxeCoverage.test.ts` (the new route covered in both configs), `.lighthouserc.gate.js` on five routes, `ShortsBlock` tests updated for the new destination                                                                                                                                                                                                                                                                                                                     | `ShortsBlock` tests asserting the shelf links to the section head.                                                                                                                                                                                                                                                                                                                                                    |

Two gates that hold across all four and are easy to forget because neither is
about embeds: `check:local-paths` and `check:infra-disclosure` grep every
tracked file, this document included. And `check:translation-parity` will report
the French legal paragraph before its English twin lands if they are committed
apart — it cannot fail the job, which is precisely why it is worth reading
rather than trusting the build.

## 11. Sources

All consulted 2026-09-20. Marked per §0. Page bodies could not be fetched from
this environment (every domain egress-blocked); entries marked **documented**
were reached through search-result summaries of the linked official page, and a
reviewer should open them directly before stage 3.

**Official documentation**

- YouTube, _Embedded Players and Player Parameters_ — <https://developers.google.com/youtube/player_parameters>
- YouTube, _API Services Developer Policies_ (overlays, attribution, the 120 × 70 thumbnail floor) — <https://developers.google.com/youtube/terms/developer-policies>
- YouTube, _API Services Terms of Service (EMEA)_ — <https://developers.google.com/youtube/terms/api-services-terms-of-service-emea>
- TikTok for Developers, _Embed Player_ (`player/v1`, `postMessage`, 9:16 default) — <https://developers.tiktok.com/docs/en/embed-player>
- TikTok for Developers, _Embed Videos_ (blockquote + `embed.js`) — <https://developers.tiktok.com/docs/en/embed-videos>
- Meta, _Instagram oEmbed Endpoint_ — <https://developers.facebook.com/docs/instagram-platform/oembed/>
- Meta, _Embedded Video Player_ — <https://developers.facebook.com/docs/plugins/embedded-video-player/>
- EDPB, _Guidelines 2/2023 on the Technical Scope of Art. 5(3) of the ePrivacy Directive_ — <https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf>
- European Commission, _Commission preliminarily finds TikTok's addictive design in breach of the Digital Services Act_, 6 February 2026 — <https://digital-strategy.ec.europa.eu/en/news/commission-preliminarily-finds-tiktoks-addictive-design-breach-digital-services-act>
- CJEU, _BestWater International_ (C-348/13), 21 October 2014, on framing and communication to a new public — <https://edri.org/cjeu-embedding-copyright-infringement/>

**Secondary reporting** — interested parties, useful for behaviour nobody
documents officially, never load-bearing on its own

- Cloud Four, _YouTube No Cookies Adds Cookies_ (`yt-remote-device-id` in `localStorage` on load; `VISITOR_INFO1_LIVE`, `YSC`, `GPS` on play) — <https://cloudfour.com/thinks/youtube-no-cookies-adds-cookies/>
- tarteaucitron, _TikTok Video: GDPR, cookies and installation_ — <https://tarteaucitron.io/en/service-details/tiktokvideo/>
- cookiedatabase.org, `__tt_embed__mounting` — <https://cookiedatabase.org/cookie/tiktok/__tt_embed__mounting/>
- WP Mayor, _Meta Just Quietly Undid the Change That Broke Instagram Embeds_ (tokenless oEmbed from 15 June 2026) — <https://wpmayor.com/meta-tokenless-oembed-wordpress/>
- Jim Nielsen / James Loh, _YouTube Content Security Policy_ (why both YouTube hosts belong in `frame-src`) — <https://jloh.co/posts/youtube-csp/>
- FreshySites, _How to use YouTube parameters_ (`rel=0` narrowed rather than disabled, effective 25 September 2018) — <https://freshysites.com/blog/how-to-use-youtube-parameters-and-recent-changes/>
- Consently, _Are YouTube Embeds GDPR Compliant?_ and Kukie, _YouTube Embeds and Cookie Consent_ (the CNIL reading that a play click is not consent to processing) — <https://consently.net/blog/is-youtube-embed-gdpr-compliant>, <https://kukie.io/blog/youtube-embeds-cookie-consent>
- Storage and delivery pricing, unverified against vendor pages — <https://swarmify.com/blog/bunny-stream-review/>, <https://www.buildmvpfast.com/api-costs/cloud-storage>

**Measured in this repository**, 2026-09-20 — `main` at `ba2314aa` and
`origin/codex/search-feed-implementation`: `src/middleware.ts`,
`src/__tests__/middleware.test.ts`, `src/lib/consent.ts`,
`src/types/consent.ts`, `src/lib/i18n/copy/consent.ts`,
`src/lib/legal-pages.ts`, `src/lib/legal-pages.en.ts`, `next.config.ts`,
`.lighthouserc.gate.js`, `.lighthouserc.js`, `scripts/quiz-bundle-size.ts`,
`scripts/home-globe-bundle-size.ts`, `scripts/ci/checkOrphanDocs.ts`,
`src/lib/discoveries/catalog.ts`, `src/lib/discoveries/videos.ts`,
`src/components/discoveries/DiscoveryReader.tsx`,
`src/components/search/feed/ShortsBlock.tsx`,
`src/lib/search/companionCatalogs.ts`, `docs/confluence-spec/req-catalog.json`.
