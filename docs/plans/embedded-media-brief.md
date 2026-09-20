# Playing the productions on the site — analysis brief

Date: 2026-09-20. Status: **analysis not started**. This file is the brief; it
decides nothing.

The atlas publishes videos and carousels on YouTube, TikTok, Instagram and
Facebook. The site shows none of them. The search-result feed draws a shelf of
shorts whose production catalog is empty, and the Découvertes reader scrolls
images and proverbs full-screen with no player at all. The operator wants the
published pieces to be watchable on the site — embedded where that is possible,
and reachable where it is not — in **both** surfaces.

This brief exists because the answer is not a component: it is a chain of
decisions across security policy, consent, privacy law, performance budgets and
platform terms, each of which can veto the others. What follows is what is
already measured, then the questions an analysis must answer, then the shape of
the deliverable.

## 1. What is already established — do not re-measure

Measured 2026-09-20 on `codex/search-feed-implementation` and `recette`.

**The site cannot embed anything today.**

- `src/middleware.ts` builds one enforcing CSP, no report-only mode. It declares
  `frame-src 'self'` with `const FRAME_SRC_HOSTS: string[] = []`, `img-src 'self'
data:` with no remote host, and `media-src 'self' https://images.prismic.io`.
  The file says why: _"No embed provider is confirmed yet — REQ-128 ('Media and
  external links on the fiche') owns that decision. Left empty rather than
  guessed."_
- `src/__tests__/middleware.test.ts:758` asserts `expect(frameSrc).toBe("frame-src
'self'")` — strict equality. Adding a host fails that test by design.
- A third-party embed has already died here: `ReportErrorPageClient.tsx` records
  a Typeform embed whose _"script was never executed: no iframe, no form, no
  console message the reader would ever see — a promise over blank paper."_

**Consent has three categories and no notion of third-party content.**

- `src/lib/consent.ts`: key `ethni-consent`, twelve-month expiry, categories
  `essential`, `analytics`, `functional`, the last two defaulting to false.
- Exactly two consumers gate on it: `PlausibleScript` and Sentry's user context.
- There is no click-to-load pattern anywhere in `src`, and no `<iframe>` at all.

**The privacy page names three sub-processors** — Supabase, Vercel, Plausible
(`src/lib/legal-pages.ts`, §"Services et sous-traitants") — and no video
platform. There is no separate cookies page; cookies are a section of the data
policy.

**A blocking CI gate audits the search route itself.** `.lighthouserc.gate.js`
runs on every PR into `main`/`recette` over four routes including
`/fr/atlas/recherche`, and asserts `categories:best-practices ≥ 0.95` **as an
error** — the category that scores third-party cookies and console errors.
Performance is a warning there, an error in the nightly matrix (`≥ 0.73` off the
fiches, LCP ≤ 5500 ms, TBT ≤ 300 ms).

**The data model is ready for a link, not for a player.**
`src/lib/discoveries/videos.ts` defines `DiscoveryVideoRecord` — id, status,
bilingual slug/name/description, `publishedAt`, `durationSeconds`, self-hosted
`poster {src,width,height}`, `watchUrl`, tiered `source`, typed `subjects[]`,
optional `transcript`. There is **no** `platform`, `videoId` or `embedUrl`.
`DISCOVERY_VIDEOS` is an empty array. `SEARCH_SHORTS` reads it, so the shelf is
empty in production. `ShortsBlock` renders a poster inside a `next/link` to the
Découvertes page; `watchUrl` travels in the API payload and is never used.

**Découvertes cannot render a video or a carousel.** `DiscoveryPublication.kind`
admits `anecdote | proverb | carousel | image | video`, but `DiscoveryReader`
branches on `image` and `proverb` only; a `video` falls through to the photo
fallback, and no record has ever used `carousel`.

**Weight, today.** `public/` is 36 MB served with no CDN;
`public/images/discoveries` is 11 MB over 36 files. There is no `.gitattributes`,
no Git LFS and no CI size gate — nothing would stop a video file entering git,
which is the argument against doing it. `next.config.ts` declares no `images`
block at all, so any remote thumbnail host needs one.

**Media licence discipline applies to anything played.** Brand charter §9: _"a
licence is published, not named"_ — author, licence URI, link to the file. In the
database, `afrik_media.licence_uri` is `NOT NULL` with a non-empty check.

## 2. What the operator wants

In his words, reformulated and to be confirmed with him if an answer here would
change the recommendation:

- The pieces published on the networks should be **watchable on the site**, in
  the result page's shorts shelf and inside the Découvertes scroll.
- **YouTube looks simplest** because watching does not require an account.
- **TikTok and Instagram embeds may require the viewer to be logged in** to see
  anything — this is the operator's suspicion and it must be verified, not
  assumed.
- Carousels cannot live on YouTube, so a carousel's embed, if any, comes from
  Instagram, Facebook or TikTok.
- He expects a **click-to-load** shape rather than an autoplaying iframe.

## 3. The questions the analysis must answer

### 3.1 Per platform — YouTube, TikTok, Instagram, Facebook

For each, in a table:

1. The **official embed mechanism**: pure `<iframe>` URL, or a blockquote plus a
   third-party script? Name the exact domains the browser contacts, for the
   frame, the images, the fonts and any XHR.
2. **Does watching require the viewer to be signed in?** Test it, do not reason
   about it: a private browsing window, no account, one public post per platform.
   Record what renders: the piece, a login wall, or a blank frame.
3. **What is written to the viewer's device before any interaction**, with a
   facade in place and without one: cookies, `localStorage`, fingerprinting
   requests. YouTube's `youtube-nocookie.com` is the documented variant; verify
   what it actually sets on load and on play.
4. **Terms of service**: is a self-hosted poster with a click-to-load frame
   permitted? Is an oEmbed call required to display a piece (Instagram's oEmbed
   needs an app token — say whether that is a blocker)?
5. **Stability of the identifier**: what breaks when a piece is deleted, made
   private or geoblocked, and how the site detects it.
6. **Aspect and chrome**: what the frame imposes (9:16 support, branding,
   suggested-videos overlay), and whether it can be made to sit inside the
   reviewed poster geometry (130 × 231 and 160 × 284 in the feed, full-screen in
   Découvertes).

### 3.2 Law and consent

7. With a **facade** (poster hosted here, no third-party request until the
   reader clicks), is consent required before the click? Cite the CNIL and the
   EDPB rather than a blog, and say what the click itself must say.
8. What exactly changes in `src/lib/legal-pages.ts` and its English twin: a new
   sub-processor paragraph, the transfer outside the EU, the retention the
   platform applies. Draft the paragraphs.
9. Does a **fourth consent category** belong in `src/types/consent.ts`
   (`embeds`), or is per-click consent enough? Whichever, the banner copy in
   `src/lib/i18n/copy/consent.ts` must follow.
10. Minors, and the DSA/Digital Fairness angle already noted in the project's
    own doctrine: an embedded feed that autoplays is exactly what the Commission
    faulted TikTok for. State the rule the site adopts.

### 3.3 Technical

11. The **exact CSP delta** per platform, host by host, and the diff to
    `src/__tests__/middleware.test.ts`. Prefer a per-provider allowlist that is
    empty until a provider is switched on, so the default stays closed.
12. The **facade component**: where it lives, what it renders before the click
    (the poster the site already hosts), what it mounts after, how it behaves
    under `prefers-reduced-motion`, and its keyboard and screen-reader contract.
13. **Performance**: measure the best-practices and performance scores of
    `/fr/atlas/recherche` with a facade present and after a click, against the
    0.95 error threshold. Propose the JS budget the facade should carry, in the
    shape of the existing island budgets (quiz 15 KB, globe 170 KB).
14. **Both surfaces**: what the feed's shelf does (open in place? navigate to
    Découvertes?) and what Découvertes does (full-screen player inside the
    scroll, with the rail it already has). Say which one owns playback, because
    two players is a maintenance trap.
15. **Carousels in Découvertes**: the `carousel` kind exists and renders
    nowhere. Decide whether a carousel is self-hosted images (the site already
    hosts 11 MB of them, licence-checked) or an Instagram embed, and note that
    self-hosting a carousel avoids every question in §3.1 and §3.2.

### 3.4 The alternative to embedding

16. **Self-hosted playback**: what it would cost. The project already runs a
    self-hosted Supabase, so its Storage is an option; compare with a streaming
    provider on price, bandwidth, and the repository rule that renders are never
    versioned. Say what a thirty-videos-a-month cadence means in gigabytes a
    year.
17. **Do nothing but link out**: the current design. State plainly what the
    reader loses, and what the site gains in weight, law and maintenance.

## 4. The deliverable

One document, `docs/plans/embedded-media-decision.md`, holding:

- a **platform table** answering §3.1, one row per platform, with the tested
  evidence and the date of the test;
- a **recommendation** with a first choice and a named second choice, each with
  what it costs and what it forecloses;
- the **spec of the chosen route**: the data model delta (`platform`,
  `embedUrl`, whatever §3.1 proves necessary), the component, the CSP delta, the
  consent delta, the legal paragraphs drafted in French and English, the budget;
- a **staged rollout**, each stage shippable on its own and reversible;
- the **gates** each stage must pass, and which existing tests it breaks on
  purpose.

Write it in English, as every document here. Quote sources with their URL and
the date consulted. Where a claim cannot be tested, say so rather than assert it.

## 5. The prompt to run this analysis

> You are analysing whether and how EthniAfrica can play its published
> productions — YouTube, TikTok, Instagram and Facebook videos and carousels —
> inside two surfaces of the site: the search-result feed's shorts shelf and the
> full-screen Découvertes scroll. Read
> `docs/plans/embedded-media-brief.md` first: §1 lists what is already measured
> and must not be re-measured, §2 what the operator asked for, §3 the questions
> to answer, §4 the document to produce.
>
> Work from the repository for anything internal (CSP, consent, legal pages,
> data model, budgets), and from the platforms' own documentation and a real
> browser test for anything external — in particular whether watching a TikTok
> or an Instagram embed requires the viewer to be signed in, and what each
> embed writes to the device before and after a click. Never infer a platform's
> behaviour from its documentation alone when a two-minute test in a private
> window can settle it.
>
> Produce `docs/plans/embedded-media-decision.md` exactly as §4 describes.
> Recommend one route and name the second. Change no code, and do not touch the
> CSP, the consent categories or the legal pages in this pass: this is the
> analysis that authorises that work, not the work.

## 6. What this brief deliberately leaves out

Which pieces get published, when, and in what format — that is
[`production-history-brief.md`](production-history-brief.md). This brief only
asks how a piece that exists can be watched on the site.
