# Claude Design brief: EthniAfrica Cartes 1.6.0-proposition, the signature line at the end of every reel and carousel

**Renumbered on 15 October 2026.** This brief was first numbered 1.5.0. The map sequence of the series video took 1.5.0 the same day, proposed and accepted first ([its brief](../1.5.0-proposition/claude-design-brief.md)), so the signature line is 1.6.0 and builds on 1.5.0.

For the operator to paste into the Claude Design conversation of EthniAfrica Cartes (https://claude.ai/artifact/FMuUA1zKTU9P8qwdrmmQML, 1.5.0-proposition accepted on 15 October 2026).

The accepted files are in the public repository, branch `recette`: https://github.com/big-emotion/EthniAfrica/tree/recette/social/design-system. Read:

- `README.md`: the signature row, and the `closing` type;
- `series.md`: « The series band », and in « Vidéo de série » the bands table, the legibility rule and « Cover, card change, ending »;
- `handoff.md`: « Choices left to the operator », choice 2, the closing slogan.

The editorial source is `docs/editorial/essais/afrique-nest-pas-un-tout-2026-10-13.md`, section 5.6. The rule for the networks is `docs/editorial/strategy/social-series.md`, « Leading readers to the site ».

**Two words, two things.** The **signature row** is the design system's logo row: the logo and « EthniAfrica » in Fraunces. The **signature line** is the project's sentence, the subject of this brief. They are different things and keep their names.

---

## Assignment

Add **one rule** to 1.5.0: the signature line at the end of every carousel and every series video. Everything else stays as accepted:

- the cards and their 89 references;
- the series band, on the cards and at y 250 in the video;
- the full-screen frame and its legibility rule;
- map cards on satellite imagery, and map sequences (1.5.0);
- the card change and the cover.

The result is **1.6.0-proposition**; only the operator accepts it.

## The operator's decision (15 October 2026)

The signature line is:

> Connaître nos noms, décoloniser leur emploi, nous nommer nous-mêmes.

Settled, not to reopen:

1. **Word for word, every time.** The same sentence ends every reel and every carousel of every series, and sits in every account's bio. No card, series or episode changes, shortens or translates it.
2. **After the series' fixed closing, never in its place.** Each series keeps its own fixed closing (`social-series.md`, « The series »). The signature line comes after it. In series 6, the closing line « L'Afrique n'est pas un seul peuple. Elle peut choisir d'être un seul camp. » speaks of unity and the signature line of names: the two follow each other and must never merge.
3. **The same look, in the same place, every time.** Its use is recognition through repetition: the reader learns to expect it at the end. A look that changes from series to series defeats that.
4. **No panel, no veil, no band added to carry it.** In the video it follows the 1.4.0 legibility rule, light letters on a dark outline, like every other text on the image.
5. **It contains no African name**, so capitals are allowed, under the README's rule on uppercase.

Why this sentence, and its limits, are in the essay (5.6). For the design, three of those limits matter. It is an invitation, not a judgement. It speaks of the **use** of names. It never replaces a series' closing.

## What to design

1. **The order of the ending.** On the carousel's closing card and on the video ending « série », place, top to bottom: the series band; the series' fixed closing, when the series has one as a line; the signature line; the invitation sentence « Cherchez [nom] sur EthniAfrica, lien en profil. »; the site pill; the signature row. Show the three kinds of series closing:
   1. **A line**: series 5 « La ligne a été tracée par-dessus des gens qui étaient déjà là. »; series 6 « L'Afrique n'est pas un seul peuple. Elle peut choisir d'être un seul camp. »; the series 1 season finale « Un nom change-t-il l'identité d'un peuple ? ».
   2. **A question to readers**: series 2 « Et chez vous, comment dit-on ? ».
   3. **No line of its own**: series 3, whose next episode comes from readers' comments; series 4, which ends on the word people use for themselves; series 7.
2. **The signature line's own look.** One type, size and position, the same on every closing card and every video ending, in Nuit and in Parchemin. It must read as the project's voice, distinct from the series' closing, which is the episode's last word. Measure it: the sentence is 66 characters. Say on how many lines it sits and how it breaks. Recommendation: break after each comma, into three balanced parts, so each line carries one idea.
3. **What it replaces.** Two texts already speak for the project at the end:
   1. the closing slogan « Notre objectif : raconter l'origine des noms, avec des sources. », in the title of every series closing card (`handoff.md`, choice 2, left open);
   2. « L'Afrique à travers ses noms », under the word EthniAfrica in the closing card's signature row.

   Recommendation: the signature line takes the closing slogan's place, and the closing slogan is retired. « L'Afrique à travers ses noms » leaves the closing card, so the ending carries one sentence for the project, not three. Show the closing card with and without « L'Afrique à travers ses noms », and say which reads better.

4. **Space.**
   1. **Carousel.** The closing card's panel stops at 828 px on a series card. If the fixed closing, the signature line, the invitation sentence and the pill do not fit together, say how the content is split. Recommendation: the fixed closing gets its own card just before the closing card, and the closing card keeps the signature line, the invitation and the pill.
   2. **Video.** The 1.4.0 ending block runs from y 318 to 820 at most. If everything does not fit, the fixed closing gets its own last content card, entered by the 300 ms change, before the ending. In either case, never shrink a text below its accepted size: split instead.
5. **Time, in the video.** The ending holds 2.5 s, or until the voice ends plus 0.5 s. The operator decides whether the voice says the signature line. Recommendation: it does, because hearing and reading the same sentence together makes it easier to remember. When it is spoken, the subtitle band stays empty while the line is on screen, so the same words never show twice. Draw the frame at the moment the line is said.
6. **The feed.** The band sits at y 250 so that the profile grid reads as a series. The ending is not the cover, so nothing changes there. Show the ending at 430 px in the feed, where the apps cover part of the frame, as 1.4.0 already does. Nothing is fitted to the apps' interface (1.4.0 rule).
7. **Alternative text.** The closing card's alternative text ends with the signature line, word for word.
8. **No break inside « nous-mêmes ».** The line never breaks at its hyphen; if the browser would break there, the renderer uses a non-breaking hyphen (U+2011) and says so in the handoff.

## Deliverables

1. `series.md`: a section « The signature line », with the order of the ending, the line's look, its place in the carousel and the video, and what it replaces.
2. `README.md`, « Closing »: the closing card's description updated to match.
3. A handoff section « Renderer integration of 1.6.0 ». The signature line is **one constant** in the renderer, not a card field, so no card can change it. Say what the renderer checks: the line present on every closing card and video ending, identical to the constant, after the fixed closing, inside its band, with no text overlapping it.
4. Boards, at full size and at 430 px, in Nuit and Parchemin:
   1. closing cards for series 6 (a line), series 2 (a question) and series 3 (no line);
   2. a fixed closing given its own card, if item 4 needs one;
   3. the video endings for series 6 and series 2, including the frame where the voice says the line;
   4. the ending in the feed at 430 px.

   The texts other than the signature line and the fixed closings are demonstration text.

## Out of scope

- The content cards and their 89 references;
- the series band;
- map cards;
- the cover;
- every episode's text;
- the accounts' bios, whose text is fixed by `social-series.md`;
- the site;
- publication.
