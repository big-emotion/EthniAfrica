# Generated imagery — the three launch collections

The style bible for the stylised, text-free images the Découvertes feed and its
gallery dossier will carry. It records what was decided, what each collection
locks, and what the proof series taught — so the next image is generated from a
rule rather than from taste.

It governs **generation**. It does not yet govern publication: the catalog in
`src/lib/discoveries/catalog.ts` cannot accept a generated image until image
provenance is separated from the subject's source (see _What the code still
refuses_). No image described here is published.

## Decisions this rests on (2026-09-13)

| Question       | Decision                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------- |
| Status         | Declared fiction, tied to one or two atlas fiches                                             |
| Realism        | Stylised only — no photorealistic people                                                      |
| Figures        | Anonymous today, anonymous past, named historical figures, myths                              |
| Style          | Several collections, one locked style each                                                    |
| Surfaces       | Feed and gallery dossier, together                                                            |
| Reader actions | Download per format (9:16, 4:5, 1:1) and share the link                                       |
| Burned-in mark | Small signature and an "image générée" mark, stamped per derived format                       |
| Licence        | CC BY-SA 4.0, stated as covering the human part (selection, composition, retouch, caption)    |
| Photographed   | Figures with a surviving photographic record are excluded — a likeness, not an interpretation |
| Training       | Higgsfield's training licence accepted: key frames must stay on the platform to be referenced |
| Myths (Récits) | Held out of the launch until a second reader exists                                           |
| Approval       | The operator, alone                                                                           |

The licence line is worded that way on purpose. French law recognises only human
authors, so a wholly generated image most likely carries no copyright; a notice
implying otherwise would be the one untrue sentence on a page whose product is
provenance.

## What every image obeys

The purpose doctrine — _older, larger, still alive; never gentler, never lost,
never a story about the one who drew the line_ — carried into composition:

- **The people are the subject of the frame.** Centred, active, looking out.
- **Continuity is shown, not captioned.** A present-day figure beside the long
  past; a teenager with a phone at the griot's fire.
- **Every prompt names a people, a place and a period**, and draws dress,
  adornment and landscape from that people's fiche (`content.culture.symbols`
  is where the emblems live).
- **Never** a golden-age idyll, ruins or chains, the coloniser in focus, or
  pan-African costume averaged from several peoples.
- **Never lighter skin for the powerful.** The first Mansa Musa came back as a
  pale, white-bearded man in a caravan of dark-skinned Mande travellers. That is
  colourism the model supplies by default; the prompt has to forbid it by name.

## Engine

| Setting    | Value                                                                                   |
| ---------- | --------------------------------------------------------------------------------------- |
| Tool       | Higgsfield, Plus plan                                                                   |
| Model      | `nano_banana_pro`, `resolution: 2k` — jobs report `nano_banana_2` as the served model   |
| Cost       | 2 credits per image, measured on the balance before and after                           |
| Output     | ~2k (2048², 1856×2304, 1536×2752) — below the 2160×3840 master; upscale before deriving |
| References | a collection's key frame, passed by Higgsfield job ID as `image_references`             |

Every prompt ends with the negative tail `No text, no letters, no watermark, no
logo`. Two ways letters still got in: a script glyph requested as a symbol (the
Aza sign is a Tifinagh letter, so it was dropped) and embroidery the model draws
as pseudo-writing (the Swahili _kofia_). Check both on every portrait.

### What fixed weak drafts

**Specificity, not references.** The first Basotho blanket was a generic
geometric pattern. Describing the real one motif by motif — maize cobs, leaves,
spade and heart emblems, white pinstripes, a chequered border, pinned at the
shoulder — produced a recognisable _kobo_. The first Traversées was a pleasant
river anywhere; naming Kinshasa facing Brazzaville made the argument visible.

**What was not used, and why.**

- Third-party photographs, even openly licensed, are never uploaded: Higgsfield
  may train on inputs, and ShareAlike on the output is unsettled. Commons holds no
  public-domain Basotho blanket photograph.
- The public-domain portraits of Njinga are European. The BnF file titled
  _XVIIe s._ is a nineteenth-century Paris lithograph with a romantic,
  off-shoulder gaze; the 1687 Cavazzi engraving shows her kneeling at her
  baptism. Either as a reference would carry that gaze into the image.
- `flux_kontext` for a face-only edit: the expression barely moved and the output
  fell to 880×1184, with the aspect ratio forced from 4:5 to 3:4.
- `soul_2`: photoreal by design.

## The collections

### Autonymes

A present-day invented person of one named people, in one named place, wearing
that people's emblem. Built to be worn as a profile picture: the wearer takes on
the name the people give themselves first.

- **Format** 1:1. **Key frame** `191bbcaf-3793-4b5a-9b53-b7ccfdee0037`.
- **Scaffold** — "Keep the exact painterly gouache style, hand-painted gold
  circle on cream paper, head-and-shoulders framing, brush texture and palette
  approach of the reference image, with a different person and place: …" then
  the person, the emblem described object by object, the landscape, and "Face
  centred inside the circle, calm confident gaze towards the viewer, mature adult
  facial structure, dignified and contemporary, clearly illustrated and not
  photorealistic."

| Image   | Job                                    | Fiche               | Emblem in the fiche               | Note                                   |
| ------- | -------------------------------------- | ------------------- | --------------------------------- | -------------------------------------- |
| Basotho | `191bbcaf-3793-4b5a-9b53-b7ccfdee0037` | `PPL_SOTHO`         | _mokorotlo_, _kobo ya Basotho_    | Key frame                              |
| Amazigh | `b7825c4c-e4e3-4b30-8ffc-3f7fbcf23d05` | `PPL_AMAZIGH_MACRO` | geometric silver jewellery        | Aza sign dropped: it is a letter       |
| Ewe     | `b51b3abb-070c-4d78-b7bd-b35e6df0be38` | `PPL_EWE`           | strip-weave cloth, blue and white |                                        |
| Swahili | `7e1a6b61-7d6d-4a43-9f24-793ae734cca5` | `PPL_SWAHILI`       | _kikoi_, carved door, dhow        | Cap embroidery reads as pseudo-writing |

### Traversées

One people living across a border, shown as a single mirrored landscape: the
same scene on both halves, a greeting across the middle, and no line anywhere.
It makes visible the doctrine's strongest proposition — a border does not
contain a people, it crosses it.

- **Format** 4:5. **Key frame** `e202acdc-5dde-4e91-b612-1180ab3e1ebf`.
- **Scaffold** — "Keep the stylised 3D miniature diorama style, clay-and-wood
  toy aesthetic, tilt-shift focus, warm golden light and the mirrored two-sided
  composition of the reference image, in a new place: …" then the mirrored scene,
  "The land is one piece. No borders, no lines, no fences, no flags, no
  checkpoints."
- **Captions carry their own source** where the place is not in the corpus.
  `PPL_KONGO` places the Kongo in western Kinshasa and in the Pool department,
  but no fiche names the two capitals as one shared place.

| Image       | Job                                    | Fiche        | Distribution in the fiche | Note                                                |
| ----------- | -------------------------------------- | ------------ | ------------------------- | --------------------------------------------------- |
| Kongo, Pool | `e202acdc-5dde-4e91-b612-1180ab3e1ebf` | `PPL_KONGO`  | COD, COG, AGO, GAB        | Key frame; caption needs a source for the pairing   |
| Somali      | `6fc21bda-f5cd-4a17-ab31-5a51c169289a` | `PPL_SOMALI` | SOM, ETH, KEN, DJI        | Exact symmetry reads as a digital mirror            |
| Hausa       | `c6ceaab5-9ac0-4317-b62e-d3a19070921d` | `PPL_HAUSA`  | NGA, NER and six more     | First job hung, then failed; the resubmission holds |
| Swazi       | `c20893da-9abb-4a14-be79-a62d1bb03d21` | `PPL_SWAZI`  | ZAF 2.3 M, SWZ 1.2 M      | Houses are generic rondavels, not beehive huts      |

### Figures & moments

Named rulers with no photographic record, and dated moments from polities the
corpus already dates, drawn as interpretations and declared as such.

- **Format** 4:5. **Key frame** `39d2285e-7b27-4530-b0c7-78e5455dfc1e`.
- **Scaffold** — "Keep the clean cel-shaded 2D animated key-visual style, crisp
  linework, painterly sky and palette of the reference image, with a new
  historical moment: …" then the scene, "calm composed faces", and the
  skin-tone clause wherever a ruler appears.
- **Excluded on purpose:** Sultan Njoya (photographed), Usman dan Fodio (a
  religious figure whose depiction the tradition may refuse), Queen Amina (her
  historicity is debated; an image would harden a debate into a portrait).

| Image          | Job                                    | Fiche                | Anchor in the fiche                      | Note                                                           |
| -------------- | -------------------------------------- | -------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Njinga Mbande  | `39d2285e-7b27-4530-b0c7-78e5455dfc1e` | `AGO`                | Ndongo and Matamba, 1583–1663            | Key frame; stern expression kept; Pungo Andongo needs a source |
| Mansa Musa     | `ea62249c-d35a-4a2d-8c0f-952004ade48f` | `MLI`, `PPL_MALINKE` | pilgrimage of 1324                       | Redone: the first draft lightened his skin                     |
| Great Zimbabwe | `110479d5-f931-4d51-a55b-d0d959028891` | `ZWE`                | stone houses, 11th–15th centuries        |                                                                |
| Marrakech      | `8f124cd8-4b92-4643-bd2f-fe27733b01ac` | `MAR`                | Almoravid dynasty, founding of Marrakech | Corpus gives no founding year; caption says 11th century       |

### Récits (held back)

A living teller carrying a story, never the myth illustrated as fact. Ink and
gouache with paper-cut shadow-play silhouettes, 9:16. Proof: the griot reciting
Sundiata (`777b04ca-39e2-4e9d-8202-6a1f6d1adbef`, `PPL_MALINKE`); its lowest
figures fall inside the Reels interface zone and would need reframing.

## What the code still refuses

`eligiblePublications` rejects a publication whose `source.tier` is
`unverified`, whose image has no `filePage`, or whose licence is `unknown`, and
the `kind` union has no `image`. AI content is tiered `unverified`, so a
generated image is excluded silently. The fix is a separation, not a loosening:
the subject's source stays the fiche's own, with its tier; the image gets its own
provenance (tool, model, job, date, `source_kind: ai_generated`) and its own
permalink as file page.

## Where the files are

Masters and derived formats are productions, not code, and are never committed.
Higgsfield holds every generation under the job IDs above. The approved masters
are filed under `decouvertes-images/<collection>/<subject>_<job prefix>.png` in
the social projects root — the checkout's gitignored `output/social/` while
`ETHNIAFRICA_SOCIAL_PROJECTS` is unset, which is the engine's own fallback and is
lost with a worktree, so they belong in the private workspace once it is set.
