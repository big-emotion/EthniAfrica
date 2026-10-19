# Series idents

The intro bumper and the end card shared by every EthniAfrica series video. Both are mute 1080 × 1920 clips at 30 fps: the reel's own voice is laid over them (operator, 19 October 2026). They carry the fixed opening and closing sentences decided the same day (`docs/editorial/strategy/social-series.md`, « Opening, closing and length of every video »).

## Status

- [x] Step 1: storyboard and style frames, mounted at 430 px (`boards/storyboard.html`), awaiting the operator's validation.
- [ ] Step 2: animatic, timed on the reel's real voice track.
- [ ] Step 3: final animation, H.264 masters and the ProRes 4444 alpha master of the intro.

## Files

| File                         | Role                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shots.mjs`                  | The storyboard as data: shots, scratch voice timing, the feed safe zone and button column (from `social/video/sequence.mjs`), the 12 px floor and the site scale.                                                                                                                           |
| `ident.html`, `endcard.html` | The two compositions, one state per shot (`?shot=`). Optional: `ground=image\|none`, `theme=parchemin`, `guides=1`; on the end card the replaceable layers `name`, `result`, `forms`.                                                                                                       |
| `idents.css`, `idents.mjs`   | Cartes 1.9.0 tokens and fonts, the 1.9.0 double outline (the same SVG filter as `social/video/series-page.mjs`), guides, the ready signal.                                                                                                                                                  |
| `idents.test.mjs`            | Every text at 12 px or more in a 430 px feed, essential text in the safe zone and out of the button column, Fraunces only on the wordmark and the project's sentence, the site at a 430 px phone's scale, the name layer, and the name employed in French never struck, dimmed or outsized. |
| `frames.mjs`                 | Exports every shot as a review still to `boards/frames/`.                                                                                                                                                                                                                                   |
| `serve.mjs`                  | A static server at the repository root: the end card types into the site mockups inside an iframe, which `file://` forbids.                                                                                                                                                                 |

```sh
node --test social/series-idents/idents.test.mjs
node social/series-idents/frames.mjs
node social/series-idents/serve.mjs   # prints the board's local address
```

## Decisions and their reasons

- **The site is drawn at a 430 px phone's scale (× 2.512).** Its smallest text, 13 CSS px, then reads at 13 px in the feed; inside the 840 px safe zone it would read at 10 px. The cost: the site's long lines run under the apps' button column. Only the vertical band and the button column bind the site's essential text (title, label, typed name, forms); its own 12 to 24 px gutter keeps it off the feed's 120 px left margin, which no app covers. Open question 1 on the board.
- **The end card embeds the real mockup HTML** (`docs/design/mockups/site/`), not a redrawing, so it shows only screens that exist. In production, `result` should be a capture of the live answer page of the episode's name, taken on the day of the render, so the profile link keeps the end card's promise.
- **The intro never strikes, dims or replaces « Peul ».** Starting from the name used in French does not mean that name is French, colonial or wrong (`social-series.md`); the other forms come in beside it, never larger. A test holds this.
- **The ending sits where the series ending sits** (y 318 to 820), so it is recognised by repetition; the arrow points to the bottom left, where Instagram, TikTok and YouTube Shorts print the account name.
- **The old end card is retired:** `social/brand/outro-reseaux-sociaux.mp4` says « Le vrai nom de chaque peuple », which crowns one name over the others, against the doctrine (§1).
- **No music** until the operator agrees to it.
