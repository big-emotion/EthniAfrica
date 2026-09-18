# The result-page mockups — twenty boards, and what parity means

The reviewed rendering the search-result page answers to. The contract itself is
`docs/design/search-result-charter.md`; this directory is the rendering, and
`src/lib/search/resultGrammar.ts` is the part of the charter a test can read.

Source artefact: <https://claude.ai/artifact/CVh7QHVzJUJ5PSUamn5rwu>

## Why the source lives here

**An agent implementing the page cannot open a `claude.ai` link.** That is the
same reason `docs/design/mockups/README.md` vendors the four atlas pages, and
the charter pointing at an artefact and nothing else was a regression against a
practice this repository had already settled.

The boards are kept in their canvas form (`.dc.html`) rather than converted:
they are the editable source, the artefact serves the same bytes, and a
conversion would be a second thing to keep in step. `<x-dc>` and the
`support.js` line are the canvas runtime's; a browser ignores both and renders
the board.

`canvas.json` is the index — each board's frame on the canvas, and the notes
beside them. It is here so the layout survives the artefact, not because
anything reads it.

## The grid

Five cases, four variants each. Every case exists at both review widths and in
both themes; `resultGrammarCharter.test.ts` fails if one goes missing.

| Case          | What it settles                                                  |
| ------------- | ---------------------------------------------------------------- |
| `Mande`       | The searched form is not the one the peoples use                 |
| `Peul`        | Many outside names, none its own, one declared pejorative        |
| `Ekpeye`      | Almost nothing known — declared, not hidden                      |
| `Introuvable` | A typo reaches the right page; an unknown name gets an admission |
| `Bassa`       | One name, three peoples, three language families, no link        |

Mobile is 430, desktop 1280. The night variants are **derived by token
substitution, never rewritten** — the two versions have to stay the same
mockup, or comparing them proves nothing about the theme.

## What parity is, and what it is not

**Not pixels.** The boards carry fixed text; the page renders a corpus whose
strings are any length. A page matching Mandé pixel for pixel and breaking on a
name twice as long has matched the wrong thing.

Parity is three things, in this order:

1. **The block grammar** — which blocks are drawn, in what order, under which
   condition. That is `RESULT_BLOCKS` in `src/lib/search/resultGrammar.ts`, and
   `resultGrammarCharter.test.ts` measures every board against it.
2. **The tokens** — every colour from the `--afh-*` spine, the type scale from
   `typography-charter.md`, the spacing steps. No literal a board happens to
   carry is a value the page may hard-code.
3. **The three things the atlas owes** — the gathered silences, the closing
   conviction, the invitation to correct. They do not depend on the corpus and
   a page that drops one has dropped half the charter.

## The gate earns its keep

It was written after the grammar it enforces, and it immediately found two
defects that had already shipped into the artefact:

- **`Peul` drew « Ce que ces noms posent problème » after its silences.** An
  insertion script had anchored on a nested `<div>` and moved the block without
  splitting it, so nothing about the markup looked wrong.
- **`EkpeyeDesktop` drew its silences before « Ce que l'atlas tient »**, the
  opposite of what the mobile board does since the grammar pass.

Neither was visible in a diff and neither was visible in a render, because both
boards looked perfectly reasonable on their own. The gate compares them to each
other, which is the thing no reader does.
