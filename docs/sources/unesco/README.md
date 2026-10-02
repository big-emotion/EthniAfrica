# UNESCO reference collection — catalogue

The nineteen UNESCO works the project keeps on hand as reference sources: the
eleven volumes of the _General History of Africa_ (HGA / GHA), four volumes of
_Histoire de l'humanité_, and three short documents on history and the
Caribbean. What each volume holds for the AFRIK corpus, chapter by chapter, is
in [concordance-afrik.md](concordance-afrik.md).

## Why the PDFs are not in git

The files live in `docs/sources/unesco/pdf/`, which is gitignored. Two reasons,
either of which would be enough:

- **Licence.** HGA I–VIII are `© UNESCO` and _Histoire de l'humanité_ states
  « Tous droits de traduction et d'adaptation réservés ». UNESDOC lets anyone
  download them; that is not a licence to republish them, and this repository
  is public. Only GHA IX–XI (2025) are open access, under CC BY-SA 3.0 IGO —
  and even there, images marked with an asterisk are excluded from the licence.
- **Weight.** The set is about 400 MB. Committed once, it stays in every
  clone's history for good.

Each entry below carries its UNESDOC permalink, so a fresh clone can rebuild
the folder, and a fiche cites the work by that permalink, never by a local file.
UNESDOC sometimes answers 403 to automated clients (a fiche note records it);
the local copy is what lets curation work go on when it does.

## How to cite

The tier is `official` (UNESCO is on the Source Tier Policy's official list).
Cite the **chapter and its author**, not only the volume: each HGA chapter is
signed, and the volume's editor did not write it. A divergence between
chapters of the same volume is common and is itself worth recording. The
1980–1999 volumes predate much of current scholarship; GHA IX was written to
revisit them, so check it before resting a contested claim on volumes I–VIII
alone.

## Catalogue

Local file names are the shelf mark (`cote`); the UNESDOC id is the number in
the publisher's file name and permalink
(`https://unesdoc.unesco.org/ark:/48223/pf0000<id>`).

### Histoire générale de l'Afrique — full edition, French (1980–1999)

| Shelf mark           | UNESDOC | Vol. | Title                                                | Editor                  | Year | Pages |
| -------------------- | ------- | ---- | ---------------------------------------------------- | ----------------------- | ---- | ----- |
| `HGA-01-fr-1980.pdf` | 184341  | I    | Méthodologie et préhistoire africaine                | J. Ki-Zerbo             | 1980 | 847   |
| `HGA-02-fr-1980.pdf` | 184311  | II   | Afrique ancienne                                     | G. Mokhtar              | 1980 | 887   |
| `HGA-03-fr-1990.pdf` | 184312  | III  | L'Afrique du VIIe au XIe siècle                      | M. El Fasi, I. Hrbek    | 1990 | 932   |
| `HGA-04-fr-1985.pdf` | 184313  | IV   | L'Afrique du XIIe au XVIe siècle                     | D. T. Niane             | 1985 | 797   |
| `HGA-05-fr-1999.pdf` | 184292  | V    | L'Afrique du XVIe au XVIIIe siècle                   | B. A. Ogot              | 1999 | 1089  |
| `HGA-06-fr-1996.pdf` | 184314  | VI   | L'Afrique du XIXe siècle jusque vers les années 1880 | J. F. A. Ajayi          | 1996 | 915   |
| `HGA-07-fr-1987.pdf` | 184322  | VII  | L'Afrique sous domination coloniale, 1880-1935       | A. A. Boahen            | 1987 | 916   |
| `HGA-08-fr-1998.pdf` | 184344  | VIII | L'Afrique depuis 1935                                | A. A. Mazrui, C. Wondji | 1998 | 1070  |

### General History of Africa — new volumes, English (2025, CC BY-SA 3.0 IGO)

| Shelf mark           | UNESDOC | Vol. | Title                               | Editor                 | ISBN              | Pages |
| -------------------- | ------- | ---- | ----------------------------------- | ---------------------- | ----------------- | ----- |
| `GHA-09-en-2025.pdf` | 396045  | IX   | General History of Africa Revisited | Augustin F. C. Holl    | 978-92-3-100809-2 | 1060  |
| `GHA-10-en-2025.pdf` | 396047  | X    | Africa and its Diasporas            | Vanicléia Silva Santos | 978-92-3-100637-1 | 1094  |
| `GHA-11-en-2025.pdf` | 397466  | XI   | Global Africa Today                 | Hilary Beckles         | 978-92-3-100811-5 | 1054  |

### Histoire de l'humanité

| Shelf mark           | UNESDOC | Vol. | Title                                           | Language | Year | Pages |
| -------------------- | ------- | ---- | ----------------------------------------------- | -------- | ---- | ----- |
| `HUM-01-fr-2000.pdf` | 121055  | I    | De la préhistoire aux débuts de la civilisation | fr       | 2000 | 1611  |
| `HUM-04-fr-2008.pdf` | 158431  | IV   | 600-1492                                        | fr       | 2008 | 1690  |
| `HUM-04-en-2003.pdf` | 119152  | IV   | From the seventh to the sixteenth century       | en       | 2003 | 1848  |
| `HUM-05-fr-2008.pdf` | 158954  | V    | 1492-1789                                       | fr       | 2008 | 1299  |
| `HUM-06-fr-2008.pdf` | 178113  | VI   | 1789-1914                                       | fr       | 2008 | 1610  |

`HUM-04-fr` and `HUM-04-en` are the same volume in two languages; their page
numbers differ.

### Other documents

| Shelf mark                        | UNESDOC | Title                                                                                             | Language | Year | Pages |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------- | -------- | ---- | ----- |
| `DOC-histoire-diversite-1984.pdf` | 058850  | Histoire et diversité des cultures — réunion d'experts sur la nature et la fonction de l'histoire | fr       | 1984 | 338   |
| `DOC-traite-caraibes-1977.pdf`    | 027738  | La Traite des esclaves dans les Caraïbes et en Amérique latine du XVe au XIXe siècle              | fr       | 1977 | 11    |
| `DOC-hg-caribe-02-plan-1985.pdf`  | 065939  | Historia general del Caribe, vol. II : formación de nuevas sociedades — anteproyecto de plan      | es       | 1985 | 7     |

The last one is a draft plan for a volume of the _General History of the
Caribbean_, not the volume itself.

## Gaps in the collection

- **_Histoire de l'humanité_ II and III** (third millennium BC to seventh century
  AD: pharaonic Egypt, Kush, Meroë, Aksum) are missing. HGA II covers the same
  period from the African side.
- **_Histoire de l'humanité_ VII** (the twentieth century) is missing.
- **The _General History of the Caribbean_ itself** (six volumes) is missing;
  only the 1985 plan above is here.
- **HGA in English** (1981–1993) is missing. Several fiches cite the English
  edition, whose page numbers do not match the French.
