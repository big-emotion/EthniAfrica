The map card lets one geographic question fill the card, with a title, a legend, a one-line caption and a border layer that can be off, quiet or strong.

**Provide:** `type: "map"`, `kicker`, `title` (words may take an area's colour: `{area-a:langue A}`), and `map: {dataRef, view, borders: "none" | "quiet" | "strong", areas: [{label, legend, tone, kind: "certain" | "uncertain", paths}], labels, places, caption: {what, when, source}}`. No `body`. For a people across several states, keep `borders: "quiet"` and use `highlight`, then `callout` (continent) or `countryLabels: "highlight"` with `inset` (region). To show how many live in each state, use `choropleth` (graded classes) instead of `highlight`; see the Maps section.

**Do:** frame on the area in question; label areas directly; hatch what is uncertain; say in the caption what is shown, for when, from which source; use several map cards when the demonstration has several steps or several states.

**Don't:** add a paragraph under the map; use a country outline as the default frame; turn a population into a homogeneous block; infer identity from language or citizenship; draw a boundary the sources do not document. See the Maps section.
