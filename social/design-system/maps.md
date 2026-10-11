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

## What a map may and may not say

- Keep language families, languages and their speakers, peoples, historical polities and present-day states apart. One map shows one of them, and its caption says which.
- Do not infer identity from language or from citizenship. When that needs saying (« La carte montre où l'on parle une langue. Elle ne dit pas à quel peuple appartiennent ceux qui la parlent. »), say it in the title or on the next card, not in a paragraph under the map.
- A distribution is not a partition. Showing a people on both sides of a border does not show how or when the border divided them; that is another card, with its own sources.
- Presence is not ownership. Areas overlap, have holes and fade; never draw a homogeneous block where the evidence does not.
- **Geometry comes from documented material only**: a published map, a dataset, a survey sheet, cited in the caption. When no geometry exists, place a name without a boundary, as the Uganda carousel did for Buganda. The fictive areas in the `MapCard` examples are drawn for the demonstration and carry a yellow tape; they must never be published.

## Legend and caption

The legend sits in the panel right under the title, at 24 px: one swatch and one label per area, plus « Présence incertaine » for hatched areas and « Frontières actuelles » when a border layer shows. Up to four items.

The caption is mandatory and has three parts, printed in one small line (20 px):

- **Carte** : what is represented, in words (« aire où l'on parle le … aujourd'hui », « frontières actuelles ; le Buganda est situé par son nom, sans limites tracées »);
- **Période** : the date or period of the data, not of the publication;
- **Source** : the dataset or map, and the base map (Natural Earth, public domain).

## Base map

`assets/Cartes/grands-lacs.json` is the base map used by the examples: Natural Earth 1:50m countries and 1:10m lakes (public domain), projected at 140 px per degree from 28.45° E, 4.42° N, with country paths, shared borders, lakes, Kampala and label positions in French. Other regions follow the same shape: `land`, `countries`, `borders`, `lakes`, `places`, `labels`, and a `meta` block naming the source and projection. Animated geography, 3D and video stay out of this system (roadmap step 9).
