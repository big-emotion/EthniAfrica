# Forged idea: name-history timeline as the default search lens

Outcome: **HARDENED**, 2026-10-08. Mockups: `mockups-timeline-430-v4.html` (layout), `-v5.html` (palette).

## Locked

- **Content before form.** Fiches are enriched with name history before the lens ships.
- **Timeline = new default lens** of the search feed (`FeedLensId`), always, with no per-subject fallback. `Tout`, Shorts, Récits, Jeux and Fiches stay as secondary lenses.
- **Release gate = priority core:** the top searched names (Plausible) plus the operator's examples (Peul, lingala, Mali, Côte d'Ivoire, Traoré, Coulibaly, Gagnoa, Daloa). All other subjects get a minimal timeline.
- **Scope = every model:** people, language, family, country, family name, **place (now, not "next")**, and the free word type (racisme, État, nation, esclavage).
- **Start from today's names and go back.** Ancient names are rows inside the current name's history. Convergence (bangala, bobangi → lingala) is narrated, not drawn.
- **Every origin is a hypothesis.** Several competing origins are the norm, shown side by side and unranked.
- **The site never affirms.** No "X named Y". Any question raised is answered on the page by the sources. The operator may override this deliberately for an editorial piece.
- **Sources:** the reader sees the source's _type_ (oral tradition, book, article, research report) behind a click/icon, **never a tier**. The tier stays an internal audit field and is not removed.
- **No gate ever blocks a source** for not being written or online. Oral accounts are first-class.
- **Common model** (generalised from `LOC_YAMOUSSOUKRO`): `summary`; `names[]` (current + former); `accounts[]` = one tile each, with period (`from`/`to` + reader label), a statement that **starts with the name**, typed `sources[]`, optional `actors[]` (context, not attribution), and `birth` / `before` flags. Type-specific fields stay alongside.
- **Name birth:** each name marks its _earliest origin known to the project_ ("known to the project", never "in the world"). Tiles below it are "before the name": the thing exists, its name does not yet.
- **Summary under the searched name:** it opens with "Le nom X…", gives the self-name, says whether there are several names and contested origins, and says they are shown below.
- **Searched name first** in chips and on arrival. A visible, inviting link leads to the self-name ("Vous avez cherché Peul. Ce peuple se nomme lui-même Fulɓe →").
- **Layout (v4):** reuse `FicheChronologyChapter` with these rules:
  - mobile-first, one name at a time;
  - left thread with a regime colour, tiles stacked along it, the period in large type;
  - a highlighted birth tile, then a dashed thread and dashed tiles for "before the name";
  - a "↓ on remonte le temps" hint;
  - "Pendant ce temps, ailleurs" behind a button;
  - closing line: "Fin de ce que nos recherches retracent pour le nom X."
- **Birth tile palette:** terre cuite (`#fbe9dc` / `#8a3d1c`). Final tokens through the charter / `afrik-art-director`.
- **"Elsewhere" anchors:** a fixed list of 20–30 sourced events outside Africa, taken from French and Belgian school history (anglophone rarely). The African name is always the subject; the event is only a time anchor.

## Rejected

- **A grid with one column per name:** unreadable at 430 px.
- **The interleaved single timeline (layout B):** too dense.
- **A lineage graph for converging names:** too costly to render, so convergence is narrated instead.
- **Category-first rollout:** it reintroduces a per-subject default.
- **Vertical period labels and alternating cream bands:** disruptive.
- **The dark birth tile:** poor accessibility.
- **Showing the tier to readers:** it ranks the griot below the linguist.
- **Dropping the tier from the model:** a hidden second rewrite, with no reader benefit.

## Known gaps (what enrichment must fix)

- Only **13 subjects** carry `names[]` history, out of about 1,700. `periodLabel` is free text and cannot be sorted.
- The **largest source kind is `ai_generated`, with 1,343 entries**. These must be replaced before the timeline can show them as a voice.
- **Existing etymology tiles assert a single origin** (Cameroun ← "Rio dos Camarões"). They must be rewritten as hypotheses.
- **`modele-nom.json` `entityType`** has no language, family, country or word type.
- **`docs/editorial/doctrine.md` and the funding one-pager** still say sources are shown "with their tier", and the doctrine lists places as "next". Both need correcting.
- **`CLAUDE.md`** says "the autonym is listed first". It needs updating to match the searched-first decision.

## Open, out of this forge

- The **writing voice**: tone and rhythm of the tile sentences. It hurt previous versions; give it a dedicated pass.
- **AI-content verification:** hooks/CI that look for a web source backing each `ai_generated` claim, then ask for one by hand. Statuses: generated, auto-validated, team-validated.
- **Source display:** the exact form of the icon or selection behind which sources appear.
- **The minimal timeline for non-core subjects:** check at 430 px that it does not read as a void.
