# Subject keys

One file per subject that several episodes of a series video cover, a country or a people (EthniAfrica Cartes 1.13.0, `social/design-system/series.md`, « 11. One subject over many episodes »). Every episode on the subject looks the same: the same base view, the same ink and the same kicker, so the profile grid reads as one subject. Only the title, the areas lit, the era and the pictures change from one episode to the next.

A piece names its subject and its episode number: `"subject": { "id": "BFA", "episode": 2 }`. The engine (`social/video/series.mjs`) then:

- lands the opening globe on the subject's `view` (`lon`, `lat`, `r` the globe's radius in frame pixels);
- composes the opener's kicker from `formula`, `{n}` standing for the episode number;
- gives the subject's `ink` to the subject's own areas, when the piece's `inks` name the subject;
- leaves the series band as it is: the episode number goes in the kicker, never in the band, since two numbers in one band read as a score.

| Field     | Meaning                                                                  |
| --------- | ------------------------------------------------------------------------ |
| `id`      | the subject's id, the file's name: an ISO 3166-1 alpha-3 code or `PPL_…` |
| `ink`     | the area ink of the subject, `a` to `d`                                  |
| `view`    | the base view, `{ lon, lat, r }`, framed for a 10 s card's push          |
| `formula` | the kicker, with `{n}` for the episode number                            |

`BFA.json` is the boards' example, the Burkina Faso of series 1: its view frames a 10 s card at the imagery's limit divided by the push (5157 ÷ 1.06 = 4865).
