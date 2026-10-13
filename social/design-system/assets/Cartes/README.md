Base maps as data. `grands-lacs.json` covers the Great Lakes region from Natural Earth (1:50m countries, 1:10m lakes, public domain): land, country paths, shared borders, lakes, Kampala and French label positions, projected at 140 px per degree. It holds no people or language area; areas come from documented sources per piece.

`afrique.json` covers the whole continent (12 px per degree) and `afrique-ouest.json` West and Central Africa (19 px per degree, with an outline of Africa for the locator inset); both from the same Natural Earth sources, with French label positions for the twelve states of the Fulɓe example.

Since 1.2.0, `afrique.json` also carries `africa` (the union of African states, to grey other land and check that a key does not cover the continent), `centers` (one interior point per state, for marks) and `bordersMerged` (the same line as `borders`, merged into continuous strokes for a regular dotted border).
