# Series idents

The intro bumper and the end card shared by every EthniAfrica series video. Both are mute 1080 × 1920 clips at 30 fps: the reel's own voice is laid over them (operator, 19 October 2026). They carry the fixed opening and closing sentences decided the same day (`docs/editorial/strategy/social-series.md`, « Opening, closing and length of every video »).

## Status

- [x] Step 1: storyboard and style frames at 430 px (`boards/storyboard.html`). Revision 2 follows the operator's review of 19 October 2026; awaiting validation.
- [ ] Step 2: animatic, timed on the reel's real voice track.
- [ ] Step 3: final animation and H.264 masters.

## Files

| File                         | Role                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shots.mjs`                  | The storyboard as data: shots, scratch voice timing, the feed safe zone and button column (from `social/video/sequence.mjs`), the 12 px floor and the 4.5:1 contrast floor.                                                                                                                          |
| `ident.html`, `endcard.html` | The two compositions. Each exposes `render(t)`; `?shot=<id>` or `?t=<s>` draws one time, `?guides=1` draws the safe zone, `?name=` and `?layers=` set the episode's name.                                                                                                                            |
| `idents.css`, `idents.mjs`   | The parchment ground, the phone with the site's search redrawn in it, the easing and the ready signal. Colours are the site's own tokens, linked from `src/styles/tokens/color.css`.                                                                                                                 |
| `layers/<name>.json`         | One per episode name: the answer page's lead and forms, copied from the live page. `peul.json` is the default.                                                                                                                                                                                       |
| `assets/grain.png`           | The parchment grain of the support film of 10 October 2026.                                                                                                                                                                                                                                          |
| `idents.test.mjs`            | Every text at 12 px or more in a 430 px feed and at 4.5:1 against what is behind it, essential text inside the safe zone and out of the button column, Fraunces only on the wordmark, the project's sentence and the site's interface, the name layer, and the name searched never struck or dimmed. |
| `frames.mjs`                 | Exports every shot as a review still to `boards/frames/`.                                                                                                                                                                                                                                            |
| `serve.mjs`                  | A static server at the repository root: the compositions load ES modules and the layer files, which `file://` refuses.                                                                                                                                                                               |

```sh
node --test social/series-idents/idents.test.mjs
node social/series-idents/frames.mjs
node social/series-idents/serve.mjs   # prints the board's local address
```

## Decisions and their reasons

- **One ground for both clips, never the episode's picture** (operator, 19 October 2026): the parchment world of the support film (`ethniafrica-cherche-des-partenaires`, from 15 s), a lit ground, a glow drifting slowly and a grain moving every frame. The series is recognised before a word is read.
- **The site is redrawn, not captured.** The search form, the answer's lead and the forms are rebuilt with the site's tokens and faces, as in the support film, so they read at 12 px in the feed; a capture of the 430 px page cannot be both legible and inside the safe zone (revision 1).
- **Desktop, tablet, then the phone.** The three devices say the site is open everywhere; the camera then enters the phone, the device the viewer is holding, and a finger searches the episode's name.
- **The intro leaves the answer empty; the end card shows it.** The search is launched but the answer box stays empty: the episode answers. The end card brings the same phone back and shows the answer the profile link leads to, so it promises nothing the site does not hold. A layer file is needed for each name, and its page must be online before publication.
- **The phone is centred, its text ends at x 764,** left of the apps' button column.
- **The old end card is retired:** `social/brand/outro-reseaux-sociaux.mp4` says « Le vrai nom de chaque peuple », which crowns one name over the others, against the doctrine (§1).
- **No music** until the operator agrees to it.
