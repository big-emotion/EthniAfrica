# Maps

A map card answers one question about where: where a language is spoken, where a people lives, where a kingdom stood. **The map is the message.** The panel holds a title, a legend and a one-line caption, and no running text; any explanation goes on the next card. When the demonstration needs several maps (the partition of a region across twelve states, say), make one map card per state or per step rather than one crowded map.

## Framing

- **The area decides the frame, not the country.** Set `map.view` (x, y, width, height in the map data's coordinates) so that the area in question sits in the image window, above the panel. A country outline is not the default container.
- **Keep labels above the scrim.** The fit report lists any label or place that falls under the panel or its 90 px gradient; move the view or the label.
- **Simplify before shrinking.** Leave out lakes, rivers or country names that do not serve the question. Labels never go below 24 px.

## Palette

Maps stay light in both themes, like a printed map above a title band: `map-water`, `map-land`, `map-ink` for labels. Areas use `area-a`, `area-b`, `area-c` on the map, `area-*-deep` for labels placed on the map, and `area-*-ink` for the same words in the panel. A title can colour the words that name an area (`{area-a:langue A}`), so the title, the legend and the map speak with the same colours.

## Layers, from bottom to top

1. Water (`map-water`) and land (`map-land`).
2. Areas (`area-a`, `area-b`, `area-c`): certain areas filled at 60 % with a solid edge; **uncertain areas hatched with a dashed edge**. Several paths can share one area, so a discontinuous distribution stays one area. Overlaps stay visible because fills are translucent.
3. Lakes on top of areas, and a fine coastline.
4. **Border layer**, one of three settings:
   - `none`: no national borders, and no country names. Use it when states are beside the point.
   - `quiet`: dashed `map-border-quiet` lines, small grey country names. Orientation only.
   - `strong`: solid `map-border-strong` lines with a land-coloured halo, country names in ink. Use it when the question is how a people or a language spreads across states.
5. Labels: area names in their area colour, place dots with names, a name placed without a boundary (for instance « Buganda ») in large ink.

## A people across several states

When the question is « in how many states does this people live? », the map works at the scale of the continent or of a region, never of one country:

- **Borders stay quiet** on these maps (`borders: "quiet"`), at continent and region scale alike: the coloured states already show the borders that matter, and thick lines add nothing (operator ruling, 10 October 2026). Keep `strong` for area maps whose question is a border itself.
- `map.highlight: {isos, tone, legend}` fills whole countries. It shows presence in a state, as the corpus records it (`currentCountries` of the people's fiche), and its caption says so: the colour covers the whole country, not where people live in it.
- `map.callout: {title, items, x, y, width, columns}` lists the states in a box placed over the sea, when the map is too small for names (continent scale). The fit report warns if the box reaches the panel.
- `map.countryLabels: "highlight"` writes the names of the highlighted states on the map instead, at region scale; `labelOffsets` moves a crowded name.
- `map.inset: {label, width, x, y}` adds a small locator of Africa with the frame of the regional map, so the reader sees where the region sits on the continent.

### Graded map (choropleth)

When the corpus gives a figure per state (`content.demography.distributionByCountry`), shade each state by class instead of a single colour:

- `map.choropleth: {values: {ISO: number}, classes: [{min, max, label, tone}], legendTitle, labels: {ISO: text}}`. Classes use `seq-1` to `seq-4`, one ochre from light to dark; four classes at most, written in words (« Moins de 1 million », « 3 à 5 millions »). Round figures and say « environ » or « estimé ».
- The legend becomes a stepped scale under the title. At continent scale the callout lists each state with its figure; at region scale `countryLabels: "highlight"` writes the figure under each name.
- Two readings of the same figures tell different stories: **the number** of people (Nigeria first) and **the share** of the state's population (Guinea first). Choose the one that answers the card's question, and say which in the title and the caption. A share is computed by EthniAfrica from two sources (the people's estimate and the state's population); the caption names both.
- Figures are estimates of a people's size, which vary widely between sources; keep the reference year in « Période ».

Base maps for these cards: `assets/Cartes/afrique.json` (the continent, 12 px per degree) and `assets/Cartes/afrique-ouest.json` (West and Central Africa, 19 px per degree, with the locator outline). When the actual areas where a people lives are documented, use areas instead, on the same base maps.

## Historical atlas map (1.2.0)

Added in 1.2.0-proposition for the series « L'Afrique à travers le temps »: nine maps of the whole continent going back in time (independence dates, 1914, 1880, around 1750, 1550, 1350, the year 1000, the year 0, 1500 BCE). Everything above still holds: one map shows one kind of thing; no running text; labels never below 24 px.

There are two kinds of atlas map:

- **Zone maps** (1880 back to 1500 BCE): the states, societies and archaeological cultures of one moment, each as an **approximate zone** (`map.atlas`).
- **Filled maps** (1914, independence): present-day states filled by a category (`map.categorical`) or a graded class (`map.choropleth`), with present-day borders **dotted**, and for 1914 the territories of the period outlined and named.

On both, `map.dimOutside: true` (automatic with `atlas` or `categorical`) greys the land outside Africa (`map-land-outside`) so the continent stands out and the keys can sit on Arabia or Europe as well as on the sea.

### Approximate zones (operator ruling, 12 October 2026, afternoon)

Numbered points read as towns, not as states. Each entry is therefore drawn as an **approximate zone at one moment**: where the polity, the society or the culture was, roughly, at the map's date. This refines the rule « no boundary for a historical state »: a zone is not a boundary.

- **How a zone is built.** From an approximate extent only: an ellipse `zone: {cx, cy, rx, ry, rot}` around the documented centre, sized from the extent the sources give (« from the Niger bend to Lake Chad »), or a few points `zone: {points: [[x, y]…]}` along a documented feature (the Nile valley). The engine draws a smooth, slightly irregular outline (a deterministic wobble seeded by the name, so the shape never reads as a drawn oval or a surveyed line) and clips it to the coast. **Never trace a zone from a published map** (the UNESCO maps are copyrighted), and never sharpen it beyond what the sources say.
- **How a zone looks.** Fill in the kind's colour at 42 %, a dashed edge (2 px, 8 on 6) in the deep tone at 70 %. Zones may overlap; the overlap stays visible, as on area maps. An entry whose extent or date is uncertain (`uncertain: true`) is **hatched** instead of filled, as uncertain areas are in 1.1, and carries « ° ».
- **Captions** say « zones approximatives » and the legend adds one note, « Zones approximatives ».

### Names on the map, then numbers

For each zone, largest first, the engine writes the name (Nunito Sans 800, 26 px, the kind's deep tone, land-coloured halo):

1. **inside the zone** when the name fits (at most 10 % of it may overhang the coast or the edge);
2. otherwise **just outside it**, above, below, right or left, on a spot that no other zone covers;
3. otherwise the zone gets a **numbered marker** on it, and the name goes in the key of its region.

On the 1880 sample, 23 of the 40 entries are named on the map and 17 are numbered (the small states of West Africa and the Great Lakes).

An entry without `zone` stays a point (a site known as one place, or the capacity test): a 16 px marker of its kind with its name beside it when there is room, else a numbered marker at the point.

### Numbered markers

- A **numbered marker of 38 px** (diameter on the 1080 canvas) with its number in Nunito Sans 800 at **24 px**, in `atlas-number`. At 430 px of feed width that is a 15 px marker with a 9.6 px number; at 320 px, 11 px and 7 px, the same floor as every map label (zoom to read).
- **Minimum distance between two markers: 44 px** centre to centre. Markers too close are pushed apart, deterministically. A zone's marker needs no leader while it still sits on its zone; a marker pushed off its zone, or away from its point, is tied back by a 2.5 px ink **leader**. A leader never exceeds **72 px**; past that, give the entry a fixed `offset: [dx, dy]` (card px).
- Numbers follow the keys: Nord, Ouest, Centre, Est, Sud, then the order of the entries inside each region. Numbers restart at 1 on each map.

### Keys by region

- A key is a light box (`map-key-ground`, 95 %, 2 px `map-ink-muted` border, 6 px radius) holding a heading in capitals (22 px, the region's name) and one row per numbered entry: the marker's shape at 18 px, the number right aligned, then the name, Nunito Sans 700, **24 px on 30 px**. Text is `map-ink` (14:1 on the box).
- `map.atlas.keys: [{region, x, y, width, columns}]` places each box in card pixels. One box per region that has numbered entries; `columns: 2` splits a short list in two.
- **Capacity**: up to 45 entries per map, 15 under one heading. With zones most entries are named on the map, so the keys stay short (four boxes in one column on the 1880 sample). The worst case, 45 points with no zone (`atlas-capacite-45`), still fits with `keyRows: "compact"` (27 px rows).
- **Placement rules, checked by the renderer**: inside the margins; never on Africa (sampled every 10 px against the continent's outline; Arabia, Europe and the sea are allowed); never under the panel's gradient; never over a marker; never over another key or the tape. Names written on the map avoid the keys.

### Two names

When the self name and the common French name differ, the entry is written « nom endogène (nom courant) »: « Danxomè (Dahomey) », « Wagadu (Ghana) », « Manden (Mali) ». Both parts are set in the same face, weight, size and colour; the parenthesis is the only difference, so neither name ranks above the other beyond reading order. In a key the second name may wrap to a second line. The `name` field holds the whole string.

### Kinds of entry

| Kind                           | `kind`    | Zone                 | Marker                          | Legend wording                    |
| ------------------------------ | --------- | -------------------- | ------------------------------- | --------------------------------- |
| State                          | `state`   | `area-a` (ochre)     | disc, `atlas-state`             | « État »                          |
| Society without a king         | `society` | `area-b` (teal)      | rounded square, `atlas-society` | « Société sans roi »              |
| Archaeological site or culture | `site`    | `area-c` (red earth) | diamond, `atlas-site`           | « Site ou culture archéologique » |

- A society without a king has a zone of the same weight as a state's, in its own hue: not an outline, not a paler tint, not a smaller mark. The marker's shape keeps the difference legible without colour.
- Sites and cultures (Igbo-Ukwu, Kisalian culture, Dhar Tichitt, Nok) get the third colour and the diamond: they are not polities.
- The legend lists only the kinds present, with a zone swatch, then the note line. Wording can change at proof through `map.atlas.labels: {state, society, site}`.

### Dates and uncertainty (Q5)

The caption is not enough on its own: it says that dates come from oral tradition or archaeology, but not which entry is uncertain. **Decision**: an entry whose date or location is uncertain carries `uncertain: true`; the engine prints « ° » after its name, on the map and in the key, hatches its zone, and adds « ° date incertaine (tradition orale ou archéologie) » to the legend note. The caption still names the kinds of sources for the period.

### A sparse map

A map with few entries (1500 BCE has five in the sample) keeps the series frame and names every zone on the map. It looks intended because it is the same map as its neighbours with fewer zones, not a zoom on the few. Do not enlarge the names, do not add filler, do not move the frame. Blank land means « not documented here », as the caption says.

### Frames

- **One frame for every zone map of a carousel**, so the continent does not jump while the reader goes back in time: Africa set to the right of the image window, the Atlantic free on the left for the keys. The sample uses `view: [-168.1, -15.1, 1136.8, 1421.1]` on `afrique.json` (0.95 card px per map px).
- **Filled maps** use the centred continent frame (`view: [-60, -16.2, 1200, 1500]`, 0.9 px per map px): their legends are taller and the whole of Southern Africa must stay above the gradient.

### Present-day borders on filled maps

`borders: "dotted"` (new in 1.2.0) draws present-day borders as round ink dots (3.4 px every 11 px, 80 %), and the states lose their solid outline. It is used on the 1914 and independence maps, where present-day states carry the colour but are not the subject. The dots follow `bordersMerged` in `afrique.json`, the same line as `borders` merged into continuous strokes, so the rhythm stays regular. The 1.1 settings (`none`, `quiet`, `strong`) are unchanged.

### Colonial partition (1914)

- `map.categorical: {values: {ISO: classId}, classes: [{id, label, tone}], split: {ISO: [classId, classId]}, splitLabel, columns, zones}` fills present-day states by the power that held them in **July 1914, before the war** (Allied troops entered Togo and Kamerun in August 1914, South West Africa in September).
- Eight categorical colours from the Okabe and Ito palette, chosen to stay distinct for readers with colour-vision deficiencies: `col-gbr` (vermilion), `col-fra` (blue), `col-deu` (rose purple), `col-bel` (yellow), `col-prt` (bluish green), `col-ita` (sky blue), `col-esp` (orange), `col-ind` (dark brown, « Indépendant »). Simulated deuteranopia, protanopia and tritanopia keep every pair at least ΔE 16 apart.
- **Territories of the period** (`categorical.zones: [{name, isos, at, anchor, leader, size, label, outline}]`): AOF, AEF, Congo belge, Afrique orientale allemande, Union sud-africaine… Each territory is the union of the present-day states listed in `isos`; the engine draws its outline as a 2 px ink line on each side of the edge (4 px where two territories meet), seen only outside the territory, so no line is drawn that the base map does not have. Inside a territory, present-day borders stay dotted (the colonies of the AOF, for instance).
- **Territory names**: Nunito Sans 800, 24 px (28 px for the federations AOF and AEF), ink with a land-coloured halo, at `at` (map coordinates) or at the state's centre; a name may break over two or three lines (`\n`). A territory too small for its name gets it over the sea with a short leader (`leader: [x, y]`): Gambie, Guinée portugaise, Sierra Leone, Liberia, Gold Coast, Togo, Guinée espagnole, Tunisie. Inland territories too small for any name (Ouganda, Nyassaland, Bechuanaland, Basutoland, Swaziland, Côte française des Somalis) are outlined and coloured but not named (`label: false`).
- **A state split between two powers** (Morocco between France and Spain) is filled with 45° stripes of both colours, 12 px each, and no line inside it. The legend adds « Partagé entre deux puissances ».
- **Legend**: the eight powers and the split swatch in the panel, on three columns. The territory names are on the map, so they do not repeat in the legend.

### Independence dates

- `map.choropleth` with four classes `seq-1` to `seq-4`, written in words (« Avant 1950 », « 1950 à 1959 », « 1960 à 1969 », « 1970 à 2011 »), as in 1.1, with `borders: "dotted"`.
- `map.marks: [{iso, kind, name, legend}]` adds two marks, drawn after the borders:
  - `not-decolonised` (Western Sahara): ink hatching at 45° on land colour, with a dashed outline; never filled as a state, never named as one. Legend: « Sahara occidental, non décolonisé ».
  - `never-colonised` (Ethiopia, Liberia): a ring with a centre dot (34 px) at the state's representative point (`centers` in `afrique.json`). Ethiopia stays land-coloured under its ring; Liberia keeps its class (1847) under the ring. Legend: « Jamais colonisé ».
- **Dates need a stated convention** before publication (see Handoff, « what is not solved »): South Africa (1910, 1931 or 1961), Guinea-Bissau (1973 or 1974), Eritrea (1993), Somaliland and Somalia (1960).

### Period marker

- `spec.timeline: {steps, current, from, to}` replaces the folio in the panel head of every map of the series: a row of nine dots on a hairline, today on the left, the oldest step on the right, with the two end labels in words (« 1960 », « 1500 av. J.-C. »). The current step is a 24 px accent disc; steps already seen are lighter, steps to come are faint.
- It sits on the kicker's line, right aligned, where the folio was, so the title band keeps its height. At 320 px of feed width the row reads as a progress bar; the end labels are for zooming.
- All nine cards carry the same steps and the same end labels; only `current` changes.

### Checks the renderer adds

Each is a warning in the fit report, and a card with a warning is refused:

- every entry inside the frame and above the gradient (`top − 90 px`);
- markers at least 44 px apart; leaders at most 72 px;
- keys inside the margins, not on Africa, not under the gradient, not over a marker;
- **collision check** (missing in 1.1): every map text, marker and overlay box (keys, callout, inset, tape) is compared with every other; two items collide when their boxes overlap by more than 4 px in both directions. Text boxes are reduced to their ink (the line box minus 22 % at the top and 10 % at the bottom) and a country's name and figure count as one label. Markers among themselves are left to the distance rule;
- any map text cut by the card's edge.

The 1880 prototype of 12 October, rendered unchanged, now fails with 25 collisions (sample card `atlas-proto-collisions`).

## A map under the series band (1.3.0)

A series card keeps its map full bleed, under the 72 px band. The band hides the top of the map, so the frame (`map.view`) leaves it clear:

- no map text, marker, key, callout or inset within 12 px of the band (y 84); the renderer lists anything closer and counts the band as a box in `report.collisions`;
- on an atlas map, names are written on the map only below y 84, and a key that starts above y 84 is refused;
- move the view down or zoom out slightly rather than moving names: `serie-atlas-1880` moves the 1880 frame down and makes it 3 % smaller (0.92 card px per map px), with its keys on the Atlantic below the Cape Verde islands; `serie-atlas-1914-parchemin` moves the 1914 frame down by 80 px.

## What a map may and may not say

- Keep language families, languages and their speakers, peoples, historical polities and present-day states apart. One map shows one of them, and its caption says which.
- Do not infer identity from language or from citizenship. When that needs saying (« La carte montre où l'on parle une langue. Elle ne dit pas à quel peuple appartiennent ceux qui la parlent. »), say it in the title or on the next card, not in a paragraph under the map.
- A distribution is not a partition. Showing a people on both sides of a border does not show how or when the border divided them; that is another card, with its own sources.
- Presence is not ownership. Areas overlap, have holes and fade; never draw a homogeneous block where the evidence does not.
- **Geometry comes from documented material only**: a published map, a dataset, a survey sheet, cited in the caption. When no geometry exists, place a name without a boundary, as the Uganda carousel did for Buganda, or, on a historical atlas map, an approximate zone built from the documented extent (see « Approximate zones »). The fictive areas in the `MapCard` examples are drawn for the demonstration and carry a yellow tape; they must never be published.

## Legend and caption

The legend sits in the panel right under the title, at 24 px: one swatch and one label per area, plus « Présence incertaine » for hatched areas and « Frontières actuelles » when a border layer shows. Up to four items.

The caption is mandatory and has three parts, printed in one small line (20 px):

- **Carte** : what is represented, in words (« aire où l'on parle le … aujourd'hui », « frontières actuelles ; le Buganda est situé par son nom, sans limites tracées »);
- **Période** : the date or period of the data, not of the publication;
- **Source** : the dataset or map, and the base map (Natural Earth, public domain).

## Base map

`assets/Cartes/grands-lacs.json` is the base map used by the examples: Natural Earth 1:50m countries and 1:10m lakes (public domain), projected at 140 px per degree from 28.45° E, 4.42° N, with country paths, shared borders, lakes, Kampala and label positions in French. Other regions follow the same shape: `land`, `countries`, `borders`, `lakes`, `places`, `labels`, and a `meta` block naming the source and projection. Animated geography, 3D and video stay out of this system (roadmap step 9).
