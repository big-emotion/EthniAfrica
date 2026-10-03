# Render CLI — contract

`render_cli.py` renders one piece under any brand kit, from files handed to it. It is the door
for a caller with no access to the EthniAfrica workshop (the portal's runner). It runs no
publication gate (licences, enlargement, layout quota, message audit): the caller verifies those
itself. It never touches the network, and two runs on the same input write the same bytes.

```bash
social/harness/venv/bin/python social/harness/render_cli.py \
    --kind carousel|image|reel \
    --input  <dir holding cards.json | image.json | scenes.json> \
    --assets <dir holding the pictures the cards name> \
    --kit    <brand-kit.json>        # optional; default is the repository's brand-kit.json
    --out    <output dir>
```

## Exit codes

| Code | Meaning                                            | stderr                                                                                |
| ---- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 0    | Rendered; `manifest.json` lists the files          | empty                                                                                 |
| 2    | The input is wrong; nothing is rendered or written | `{"errors": [{"path": "cartes[1].titre", "message": "…"}]}` — every fault in one pass |
| 3    | The input was valid and the render failed          | last line `{"error": "ExceptionType: message"}`                                       |

Exit 2 covers: a missing or malformed input file, an unknown pillar, accent or `fond`, a card
without `rang` / `titre` / `image.fichier`, a picture absent from `--assets` or not decodable, a
bad `duree`, and a brand kit that is missing, unreadable or incomplete (`path: "kit"`).

## Input

All three kinds share one deck object. Fields not listed are optional and follow
`docs/design/gabarits-social/GABARITS-SOCIAL.md` §10.

```json
{
  "campagne": "my-piece",
  "pilier": "Atelier",
  "accent": "teal",
  "fond": "nuit",
  "cartes": [
    {
      "rang": 1,
      "titre": "A title",
      "corps": "Body text",
      "composition": "cover",
      "image": {
        "fichier": "photo.png",
        "credit": "Author",
        "depot": "Wikimedia Commons",
        "licence": "CC BY 4.0"
      }
    }
  ]
}
```

- `pilier` must be a key of the kit's `pillar_accent` (or of `retired_pillars`); `accent` one of
  `ocre`, `teal`, `terre`, `perv`; `fond` is `nuit` or `parchemin`.
- `image.fichier` is a file name inside `--assets`. `rang` is a unique integer.
- **carousel** — `cards.json`, one or more cards.
- **image** — `image.json`, exactly one card.
- **reel** — `scenes.json`; each card adds `duree` (seconds, above 0 and at most 60) and an
  optional `narration` string, burned in as a caption. The deck may add `"audio": "<file in
--assets>"`.

## Output

| Kind     | Files under `--out`                                                                |
| -------- | ---------------------------------------------------------------------------------- |
| carousel | `4x5/card-NN.png` (1080 × 1350) and `9x16/card-NN.png` (1080 × 1920), one per card |
| image    | `image-4x5.png` (1080 × 1350) and `image-1x1.png` (1080 × 1080)                    |
| reel     | `reel.mp4` (1080 × 1920, 25 fps, H.264 + AAC)                                      |
| all      | `manifest.json`: `{"kind", "kit", "files": [sorted relative paths]}`               |

The reel holds each card's frame for its `duree`. With no `audio` it carries a silent AAC track
(platforms reject a video with no audio stream) and the captions stay burned in. With `audio`,
the track is padded or cut to the video's length.

## Brand kit

`--kit` selects a `brand-kit.json` (name, tagline, logo, wordmark face, the two card faces, exit
address, footer line, pillar and accent maps). Paths inside a kit are relative to the kit's own
folder, so a kit travels as a directory. An incomplete kit is refused rather than completed with
EthniAfrica's values. The kit is read once per process.

## Requirements

- The engine's pinned virtualenv (`requirements.txt`: Pillow and NumPy are exact versions, which
  is what makes the pixels reproducible). Stills need nothing else.
- `ffmpeg` on the `PATH` for `--kind reel`. Without it the reel exits 3.
- The repository's `docs/design/gabarits-social/` folder, which carries the design tokens and the
  type scale the engine reads. Ship it beside `social/harness/`.
