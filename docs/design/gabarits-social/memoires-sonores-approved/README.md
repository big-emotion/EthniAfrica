# Approved Mémoires sonores visual references

The operator approved these six mockups on **2026-09-25**, with the instruction
“japprouve les maquettes”. These are the exact reviewed PNGs, retained as visual
references rather than regenerated from the new implementation. The production
profile records this decision under `visual.id: memoires-sonores-v1`.

| Reference | Reusable layout |
| --- | --- |
| [01](carte-01.png) | Portrait cover with the headline on the left |
| [02](carte-02.png) | Context and date |
| [03](carte-03.png) | Story and its consequence |
| [04](carte-04.png) | One musical word or detail |
| [05](carte-05.png) | Photograph, track and listening direction |
| [06](carte-06.png) | References and provenance |

The approval covers presentation only. Kassav copy, the reported 2008 account,
the selected recording and per-platform audio permissions remain separate
editorial work. No post was approved, registered, scheduled or published by
this decision. Three subjects every other Sunday remains the agreed cadence.

The production implementation reads card data, not these example stories.
It omits the top `MAQUETTE` banner on passing exports and retains the ordinary
proof stamp on failed exports. `test_memoires_layout.py` compares all six text
compositions pixel-for-pixel with these references, excluding the review banner
and variable photographs. It also checks photograph geometry, text overflow
and actual command delivery.

## Sources and image credits

- Story: [Nioni Masela, ADIAC, 2021-08-02](https://www.adiac-congo.com/content/musique-la-chanson-mwen-malad-aw-dediee-secretement-tshala-muana-129277).
  An attributed recollection, not independent corroboration of the scene.
- Cover photograph: [Jacob Desvarieux in Béziers, 2012, by Geehair](https://commons.wikimedia.org/wiki/File:Jacob_DESVARIEUX_2012.jpg),
  [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Resized and
  incorporated into card 01; that derivative card is shared under CC BY-SA 3.0.
- Listening photograph: [Kassav at the Vodun Days, Ouidah, 2025, by Borisghost](https://commons.wikimedia.org/wiki/File:Kassav%27_1.jpg),
  [CC0](https://creativecommons.org/publicdomain/zero/1.0/). Cropped and resized.
  It illustrates a 2025 performance, not the reported 2008 event.

The operator's approval concerns the composition, not a change to the rights
on these photographs. Their original provenance remains attached here.
