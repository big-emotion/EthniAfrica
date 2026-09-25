# Proverb background photographs — provenance and licences

One photograph per proverb listed in `src/lib/proverbs/proverbImages.ts`, drawn
full-frame behind white text on a dark scrim. Each follows the brand charter's
cascade (§9): the thing the proverb speaks of first, then the people's own place
or material culture, then the country. The « Rung » column says which one it is,
and `alt` and `credit` in the code say the same.

None is generated. Licences were read from the Wikimedia Commons API
(`extmetadata.LicenseShortName`), not assumed, on 2026-09-25. The attribution
that CC BY and CC BY-SA require is printed with the picture, not only filed here.

Files were fetched at Commons' 1000 px thumbnail and resized to 900 px on the
long edge, JPEG quality 70, by `scripts/proverbs/sourceProverbImages.ts`.

| Proverb                                          | File                                                 | File page                                                                                                                                               | Author               | Licence       | Checked    | Rung and why                                                                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `une-parole-douce-lie-les-coeurs`                | `une-parole-douce-lie-les-coeurs.jpg`                | https://commons.wikimedia.org/wiki/File:Kabylievillage.jpg                                                                                              | diebmx               | CC BY 2.0     | 2026-09-25 | People's place. The proverb is about ties between people; a Kabyle hill village is the place where such ties are kept. Landscape of Kabylie (wilaya of Sétif), Algeria.      |
| `peu-a-peu-l-oeuf-marchera`                      | `peu-a-peu-l-oeuf-marchera.jpg`                      | https://commons.wikimedia.org/wiki/File:Egg_Basket,_Ethiopia_(15221836391).jpg                                                                          | Rod Waddington       | CC BY-SA 2.0  | 2026-09-25 | The thing itself. A basket of hen eggs, no face in frame. Shot in Jimma (Oromia), not in Amhara land: the alt text says « Éthiopie » and no more.                            |
| `l-homme-est-le-remede-de-l-homme`               | `l-homme-est-le-remede-de-l-homme.jpg`               | https://commons.wikimedia.org/wiki/File:Saint-Louis-du-S%C3%A9n%C3%A9gal.JPG                                                                            | Ji-Elle              | Public domain | 2026-09-25 | Country. The maxim is Wolof and no object embodies it; a shared harbour of pirogues at Saint-Louis, Senegal, is the closest honest setting. Figures are tiny and incidental. |
| `hate-hate-n-a-pas-de-benediction`               | `hate-hate-n-a-pas-de-benediction.jpg`               | https://commons.wikimedia.org/wiki/File:Lamu_dhow_3.JPG                                                                                                 | Karl Ragnar Gjertsen | CC BY-SA 3.0  | 2026-09-25 | People's material culture. A sailing dhow off Lamu, Kenya, on the Swahili coast: a craft that moves at the pace of the wind, not the pace of its crew.                       |
| `la-grenouille-fait-tomber-la-pluie-sur-sa-tete` | `la-grenouille-fait-tomber-la-pluie-sur-sa-tete.jpg` | https://commons.wikimedia.org/wiki/File:Christy%27s_Tree_Frog,_Walikale,_Democratic_Republic_of_the_Congo_imported_from_iNaturalist_photo_184075766.jpg | Mahomed Desai        | CC BY 4.0     | 2026-09-25 | The thing itself. A Christy's tree frog (Leptopelis christyi) photographed in the Democratic Republic of the Congo, one of the countries where the Azande live.              |
| `un-pouce-seul-n-ecrase-pas-un-pou`              | `un-pouce-seul-n-ecrase-pas-un-pou.jpg`              | https://commons.wikimedia.org/wiki/File:Gr_Zimb_Shona_Dorf.jpg                                                                                          | Thomas Wozniak       | CC BY 3.0     | 2026-09-25 | People's place. A Karanga (Shona) village in the valley of Great Zimbabwe, a homestead built by many hands; no photograph of a louse or a thumb would serve as a background. |

## Notes

- Proverbs with no entry in `PROVERB_IMAGES` stay typographic cards.
