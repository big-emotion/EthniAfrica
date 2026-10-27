# River files

The river paths of the series video's drawn marks (EthniAfrica Cartes 1.13.0, `social/design-system/series.md`, « 7. Drawn marks »): a river the voice names is drawn from its source to its mouth, so each file is one GeoJSON `LineString` ordered that way.

| File                    | River         | Natural Earth features                                  |
| ----------------------- | ------------- | ------------------------------------------------------- |
| `niger.geojson`         | Niger         | « Niger », river and lake pieces                        |
| `volta-noire.geojson`   | Volta Noire   | « Mouhoun » (Black Volta)                               |
| `volta-blanche.geojson` | Volta Blanche | « Nakanbé » (White Volta)                               |
| `volta.geojson`         | Volta         | « Volta », from the confluence                          |
| `congo.geojson`         | Congo         | « Lualaba » then « Congo », from Katanga to the estuary |

The Red Volta (Nazinon) is not in the source file, so it has no path.

**Source and licence.** Natural Earth 1:10m Physical Vectors, Rivers + lake centerlines, version 5.1.2, public domain, pinned by SHA-256 in `social/video/areas.mjs` (`DOWNLOADS.rivers`). Each file's properties record the source, citation, derivation, licence and date, as the area files do.

**How they are built.** `ETHNIAFRICA_VIDEO_ASSETS=PATH node social/video/rivers.mjs` reads the verified download and, for each river of `RIVERS`, joins its segments end to end (ends closer than 0.01° are one point) into the longest chain of whole segments that starts at the end nearest the source. Natural Earth gives segments in no reliable direction and with branches (the inner delta, the mouths of the Niger), so the longest chain is the main stem. The line is simplified by Douglas–Peucker at 0.02° and rounded to 0.001°.

**Checks.** `social/video/rivers.test.mjs` (in `npm run test:social-video`) loads every file and checks its ends against the source and mouth of `RIVERS`, and refuses an unknown river. `social/video/rivers.acceptance.test.mjs` rebuilds the files from the download and compares bytes.
