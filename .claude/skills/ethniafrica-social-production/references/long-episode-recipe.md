# Long series episode: the recipe

The steps that produced the long Burkina Faso episode (series 1, episode 19, 19 October 2026),
drawn from every change the operator asked for on the way. Follow them in order, so the next
episode runs straight through with one render. [Script lessons](script-lessons.md) holds the
writing lessons in detail; this file is the whole path from research to approval 3.

**Why it exists.** That episode took four full renders for one video: a leftover demo marker, a
decision taken mid-way, a path bug in the new parallel join (fixed by PR #1904), and a design
label the package refused. Each one cost about 50 minutes. Steps 17 to 19 exist so that the
render runs once.

## 1. Research before writing

1. Research the name to primary sources, in rounds, each saved in the piece's `sources/` with
   quotes, URLs and [page]/[extract] marks. Verify every uncertain claim before it reaches the
   script ([research and corpus](research-and-corpus.md)).
2. Climb from the name to the peoples behind its words (where they came from, when, datings
   attributed to their historian), then back in time from the present name to the kingdoms: who
   held each place, which colony, where the borders came from, who led the independent state.
3. Compare every sentence of the script with the fiches (a gap report in `corpus-checks/`). Fix
   the fiches in a PR, test first, before publication. The release that puts them online is a
   separate session's task and must be live before posting.

## 2. Script

4. Fixed opening and introduction from `docs/editorial/strategy/social-series.md`, « Opening,
   closing and length of every video »: « Aujourd'hui, nous allons parler de l'origine du nom X. »,
   then the intro sentence, voiced by the intro beat.
5. Write long first. Show the whole text at every round, keep every version
   (`narration-long-vN.md`), and reduce with the operator round by round (7 min 30 became about
   4 min). Never cut an idea; details go to the fiche.
6. Write in **map phases** (sentences that situate something) and **picture phases** (whole
   sentences with nothing to situate). The picture plan follows from this split.
7. Name colonies as colonies (« la colonie de Côte d'Ivoire », « le Soudan français, l'actuel
   Mali »); give both forms of a contested name (« l'empire du Mali, aussi appelé Manden »);
   attribute debated dates; say who each person is.
8. Accuracy beats the dictated wording: propose the correction in one line and apply it once
   accepted (« le nom du pays et celui de ses habitants réunissent trois langues »).
9. End with a short summary of the name's origin, the reframe sentence, the signed « Nous
   pensons » paragraph, then the fixed closing « L'importance de connaître nos noms. Vous pouvez
   continuer la recherche sur EthniAfrica, lien en profil. ».
10. Run `npm run check:publication` on every version.

## 3. Picture plan: the animatic first

11. Publish an animatic artifact before any render: the cut shot by shot, timed on the voice's
    estimated rate, with a « sans le son » line under each shot saying what the screen shows.
12. The animated satellite map carries the video (Cartes 1.11.0, `social/design-system/series.md`):
    the 3D satellite globe opens and dives onto the country, then the flat satellite map; areas
    light up, recede, change ink and fade; thin route arrows never outweigh a people's area; real
    illustrations (gold nugget, kola nuts, horsemen, cattle, traders, war, colonial column,
    workers); words and dates on the map. Every fact said has a mark on screen.
13. Pictures only as held phases of whole sentences (6 s at least), never a 2 to 3 s insert
    between maps. Only free-licence images with a rights record; no identifiable face or recent
    public artwork without the operator's decision.
14. Historical areas come from sourced data in the piece's `map-data/`; approximate areas are
    hatched.

## 4. Voice

15. Paul K (`MBIQRZjHPU6xEjGuB3b8`), `eleven_multilingual_v2`, normal speed. Spoken forms:
    « Faso » as « Fasso », « EthniAfrica » as « Ethni Africa », years in words.
16. Subtitles read at 21 characters a second at most. Put the pauses that buy reading time at
    sentence ends: mid-sentence pauses break the rhythm. A chapter card needs about 2.5 s of
    silence; the globe opening holds at least 5.5 s.

## 5. Pre-flight, before the render

17. Load the sequence with the engine (`loadSeriesVideo`, seconds): subtitle speed, chapter
    silences, globe length, the map bands, and the silent viewing check (every fact passes).
18. Make a preview at one frame per second with the real voice (`series-render.mjs --frames`,
    then FFmpeg with the voice; a few minutes) and show it to the operator.
19. Run every check the package will run: the sequence's `design` reads exactly `name version` of
    `social/design-system/version.json`; no `demo` marker; the series idents (intro beat, end-card
    layer copied word for word from the live answer page, next episode); `research.mjs check`
    passes with the name address as destination and the current invitation; every photograph has
    an `images[]` rights record ([publication package](publication-package.md)).

## 6. One render

20. `series-render.mjs --workers 3` with absolute paths: about 50 minutes for 4 min 15 on the
    operator's machine. Check the frame count, 30/1 and the audio track with FFprobe, look at a
    strip of frames, and show the video for approval 2.

## 7. Thumbnail

21. Every video ships one composed thumbnail for every network, 1080 × 1920, the essentials
    inside the 3:4 grid crop: the series band, the kicker, the title in the Cartes faces, the
    country in its flag's colours on the series' satellite imagery, the imagery credit and the
    EthniAfrica signature. No personality photographs. The operator publishes it; the package
    cannot carry a composed image, so it is delivered next to the package.

## 8. Captions and package

22. Instagram and Facebook share the long caption with its sources and the fixed closing. TikTok
    takes the short caption. YouTube takes the title and the long description plus the episode's
    tagged link (the channel has advanced features, so description links are clickable).
    Facebook carries the tagged link in a first comment. Instagram gets an alternative text. The
    story carries a link sticker to the name address with the campaign tags, and a question.
23. The same duration on every network when the operator decides so; record the account evidence
    and what is still to check in the app (TikTok's upload length).
24. `npm run social:package -- create` then `verify`; present `post.md`, the video and the
    thumbnail for approval 3. Never post.

## 9. Checkpoint

25. Record each operator decision in the piece's checkpoint with the operator's own words
    ([checkpoint operations](checkpoint-operations.md)).
