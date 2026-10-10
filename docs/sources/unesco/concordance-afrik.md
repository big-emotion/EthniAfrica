# UNESCO collection × AFRIK corpus — concordance

What each volume of the [UNESCO reference collection](README.md) holds for
the AFRIK corpus, chapter by chapter. It is a **finding aid, not a citation**:
it tells a curator where to open the book, and changes nothing in the corpus.

## How it was built, and what it does not claim

- Titles and page numbers come from each volume's printed table of contents.
  Pages are the **book's printed page** where the chapter starts, unless a PDF
  page is given in parentheses; the two drift apart inside a volume (plates,
  maps), so a printed page is the one to cite.
- The **AFRIK entities** column (country ISO3, `FLG_`, `PPL_`) maps a chapter
  to fiches by its title and scope. Chapter bodies were not read. Treat each
  link as a place to look, and read the chapter before resting a claim on it.
  Every identifier was checked against `dataset/source/afrik/` on 2026-10-03.
- A people is linked only where the chapter clearly treats it. The corpus has
  no fiche for some peoples these books discuss at length (the Makoa of
  Madagascar, the Agudá of Benin), nor a country file for Western Sahara,
  Zanzibar or Réunion; those chapters show `—` or the region in words.
- The printed tables of contents carry their own errors, kept as printed and
  flagged where they occur (HGA V ch. 18's page, HGA VI ch. 16's dates).
- Some author names are garbled in the PDFs' text layer (« Contension » for
  Contenson, « Anfary » for Anfray). Check a name on the page before citing it.

## Where to look first — the naming question

The chapters that speak most directly to where the names of Africa's peoples
come from:

| Question                                                        | Where                                                                                                                            |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| The name « Africa » itself                                      | GHA IX I.8 « The Word Africa », p. 143                                                                                           |
| Naming oneself, against an imposed name                         | GHA XI I.26 « Naming Oneself », p. 313 · GHA X I.4 « What's in a Name? », p. 77                                                  |
| Language classification behind the families                     | HGA I ch. 12 (Greenberg, Dalby), p. 321 · GHA IX III.3 (Blench), p. 531 · HGA I ch. 10 (linguistics and « race »), p. 259        |
| Migrations and ethnic differentiation                           | HGA I ch. 11, p. 301 · HGA III ch. 6 (Bantu expansion), p. 165 · HGA V ch. 3 (population movements), p. 67                       |
| Ethnonyms carried into the diaspora (Nago, Mina, Congo, Angola) | GHA X II.24 (African « nations » in Afro-Brazilian religions), p. 633 · GHA X II.26 (African languages in Latin America), p. 655 |
| Creoles and creolisation                                        | GHA XI I.19, p. 199                                                                                                              |
| Colonial partition and naming by administration                 | HGA VII ch. 2 (partition), p. 39 · HGA VII ch. 13 (methods of European rule), p. 339                                             |
| Countries taking historic names at independence (Ghana, Mali)   | _Histoire et diversité des cultures_ (1984), Niane, p. 225                                                                       |
| The peopling of Egypt and the Meroitic script                   | HGA II ch. 1 and the 1974 Cairo colloquium report annexed to it, p. 795 — cite both together, divergences included               |

## Madagascar and the Indian Ocean (MDG, COM, MUS, SYC)

Every period is covered; HGA I and HGA VIII have no dedicated chapter
(VIII treats the island under ch. 9 « L'Afrique orientale », p. 243).

| Volume  | Chapter                                                                                                                                 | p.                    |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| HGA II  | ch. 28 « Madagascar » (P. Vérin)                                                                                                        | 751                   |
| HGA III | ch. 25 « Madagascar » (Domenichini-Ramiaramanana)                                                                                       | 727                   |
| HGA IV  | ch. 24 « Madagascar et les îles avoisinantes du XIIe au XVIe siècle » (Esoavelomandroso)                                                | 647                   |
| HGA V   | ch. 28 « Madagascar et les îles de l'océan Indien »                                                                                     | 921                   |
| HGA VI  | ch. 16 « Madagascar, 1800-1880 » (P. M. Mutibwa; the table of contents misprints « 1880-1880 »)                                         | 453                   |
| HGA VII | ch. 10 « Madagascar de 1880 à 1939 : initiatives et réactions africaines… »                                                             | 245                   |
| GHA IX  | I.11 _Tantara_ · III.20 East Africa and Indian Ocean networks · IV.2 political constructions in Madagascar · IV.6 slavery in Madagascar | 185 · 833 · 899 · 973 |
| GHA X   | I.6 the Indian Ocean as a diasporic field · II.5 Makoa / Masombika in Madagascar · II.6 Mauritius · II.14 resistance of Malagasy slaves | 123 · 347 · 357 · 493 |
| GHA XI  | I.18 Madagascar, insularity and borders · III.5 Comoros generations · III.8 Malagasy military elites                                    | 191 · 805 · 833       |
| HUM IV  | ch. 35.4 « Le brassage culturel à Madagascar et dans les autres îles »                                                                  | 1256                  |
| HUM V   | ch. 27.2 « Madagascar et les îles environnantes »                                                                                       | 1084                  |
| HUM VI  | ch. 15.7 « Les pays de l'océan Indien »                                                                                                 | 1375                  |

GHA X II.5 is the strongest lead on a name **imposed on enslaved people**
(_Makoa_), which the corpus has no fiche for.

## Histoire générale de l'Afrique I–IV (French, 1980–1990)

_Method note for this part:_ Method notes. Titles and page numbers are read from the printed table of contents of each PDF (`pdftotext -layout`, first 30 pages). Page numbers are the book's printed page where the chapter starts. The OCR layer garbles some author names (e.g. "Contension" for Contenson, "Anfary" for Anfray); titles are kept as printed. Entity assignments are by chapter scope inferred from the title and from the known content of the volume (chapter bodies were not read), so the entities column is a pointer for a researcher to verify, not a verified claim. Every FLG_/PPL_/ISO3 id below was checked against the corpus file names in `dataset/source/afrik/`. Western Sahara and Zanzibar have no AFRIK country file, so nothing is listed for them. Volume I has no chapter on Madagascar.

### HGA I — Méthodologie et préhistoire africaine (1980)

Editor: Joseph Ki-Zerbo (volume director). Covers sources, methods and the prehistory of the continent, from hominisation to the end of the Stone Age and the first metals (up to the 5th century BCE).

| Ch.   | Title (as printed)                                                                                                    | p.        | AFRIK entities                                                                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intro | Introduction générale (J. Ki-Zerbo)                                                                                   | 21        | —                                                                                                                                                                                                                        |
| 1     | Evolution de l'historiographie de l'Afrique                                                                           | 45        | —                                                                                                                                                                                                                        |
| 2     | Place de l'histoire dans la société africaine                                                                         | 65        | —                                                                                                                                                                                                                        |
| 3     | Tendances récentes des recherches historiques africaines et contribution à l'histoire en général                      | 77        | —                                                                                                                                                                                                                        |
| 4     | Sources et techniques spécifiques de l'histoire africaine : Aperçu général                                            | 97        | —                                                                                                                                                                                                                        |
| 5     | Les sources écrites antérieures au XVe siècle                                                                         | 113       | —                                                                                                                                                                                                                        |
| 6     | Les sources écrites à partir du XVe siècle                                                                            | 137       | —                                                                                                                                                                                                                        |
| 7     | La tradition orale et sa méthodologie                                                                                 | 167       | —                                                                                                                                                                                                                        |
| 8     | La tradition vivante                                                                                                  | 191       | —                                                                                                                                                                                                                        |
| 9     | L'archéologie africaine et ses techniques : Procédés de datation                                                      | 231       | —                                                                                                                                                                                                                        |
| 10    | I. Histoire et linguistique (P. Diagne) / II. Théories relatives aux « races » et histoire de l'Afrique (J. Ki-Zerbo) | 259 / 291 | —                                                                                                                                                                                                                        |
| 11    | Migrations et différenciations ethniques et linguistiques                                                             | 301       | FLG_BANTU, FLG_NIGERCONGO, FLG_AFROASIATIQUE, FLG_NILOSAHARIENNE, FLG_KHOISAN, PPL_BANTU                                                                                                                                 |
| 12    | I. Classification des langues d'Afrique (J.H. Greenberg) / II. Carte linguistique de l'Afrique (D. Dalby)             | 321 / 339 | FLG_AFROASIATIQUE, FLG_NIGERCONGO, FLG_NILOSAHARIENNE, FLG_KHOISAN, FLG_BANTU, FLG_BERBERE, FLG_SEMITIQUE, FLG_COUCHITIQUE, FLG_OMOTIQUE, FLG_TCHADIQUE, FLG_MANDE, FLG_ATLANTIQUE, FLG_KWA, FLG_GUR, FLG_AUSTRONESIENNE |
| 13    | Géographie historique : aspects physiques                                                                             | 347       | —                                                                                                                                                                                                                        |
| 14    | Géographie historique : aspects économiques                                                                           | 365       | —                                                                                                                                                                                                                        |
| 15    | Les méthodes interdisciplinaires utilisées dans cet ouvrage                                                           | 383       | —                                                                                                                                                                                                                        |
| 16    | Le cadre chronologique des phases pluviales et glaciaires de l'Afrique (I. R. Said; II. H. Faure)                     | 395 / 409 | —                                                                                                                                                                                                                        |
| 17    | L'hominisation : problèmes généraux (I. Y. Coppens; II. L. Balout)                                                    | 435 / 457 | —                                                                                                                                                                                                                        |
| 18    | Les hommes fossiles africains                                                                                         | 471       | —                                                                                                                                                                                                                        |
| 19    | Préhistoire de l'Afrique orientale                                                                                    | 489       | KEN, TZA, UGA, ETH, SOM, DJI, ERI                                                                                                                                                                                        |
| 20    | Préhistoire de l'Afrique australe                                                                                     | 525       | ZAF, NAM, BWA, ZWE, ZMB, MWI, MOZ, LSO, SWZ, AGO                                                                                                                                                                         |
| 21    | Préhistoire de l'Afrique centrale (I. R. de Bayle des Hermens; II. F. Van Noten et al.)                               | 561 / 581 | COD, CAF, COG, GAB, CMR, RWA, BDI                                                                                                                                                                                        |
| 22    | Préhistoire de l'Afrique du Nord                                                                                      | 601       | MAR, DZA, TUN, LBY                                                                                                                                                                                                       |
| 23    | Préhistoire du Sahara                                                                                                 | 619       | DZA, LBY, NER, TCD, MLI, MRT                                                                                                                                                                                             |
| 24    | Préhistoire de l'Afrique occidentale                                                                                  | 643       | NGA, GHA, SEN, MLI, NER, BFA, CIV, GIN                                                                                                                                                                                   |
| 25    | Préhistoire de la vallée du Nil                                                                                       | 669       | EGY, SDN                                                                                                                                                                                                                 |
| 26    | L'art préhistorique africain                                                                                          | 693       | —                                                                                                                                                                                                                        |
| 27    | Débuts, développement et expansion des techniques agricoles                                                           | 725       | —                                                                                                                                                                                                                        |
| 28    | Invention et diffusion des métaux et développement des systèmes sociaux jusqu'au Ve siècle avant notre ère            | 745       | —                                                                                                                                                                                                                        |

Strongest for the corpus: Ch. 12 (Greenberg's classification and Dalby's linguistic map, the root of the families in `famille_linguistique/`); Ch. 11 (Olderogge, migrations and ethnic and linguistic differentiation); Ch. 10 (Diagne on linguistics and history, Ki-Zerbo on « race » theories, the ground for the colonial-legacy classifications); Ch. 7 and 8 (oral tradition, the method for taking local accounts of names seriously).

### HGA II — Afrique ancienne (1980)

Editor: Gamal Mokhtar (volume director). Covers Africa from the end of prehistory to about the 7th century CE: Egypt, Nubia, Kush, Axum, North Africa and the Sahara, then sub-Saharan regions before the 7th century.

| Ch.    | Title (as printed)                                                                                                           | p.        | AFRIK entities                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| Intro  | Introduction générale (G. Mokhtar, avec le concours de J. Vercoutter)                                                        | 9         | —                                                                                             |
| 1      | Origine des anciens Egyptiens                                                                                                | 39        | EGY, FLG_AFROASIATIQUE                                                                        |
| 2      | L'Égypte pharaonique                                                                                                         | 73        | EGY                                                                                           |
| 3      | L'Egypte pharaonique : société, économie et culture                                                                          | 107       | EGY                                                                                           |
| 4      | Relations de l'Egypte avec le reste de l'Afrique                                                                             | 133       | EGY, SDN, ETH                                                                                 |
| 5      | Le legs de l'Egypte pharaonique                                                                                              | 153       | EGY                                                                                           |
| 6      | L'Egypte à l'époque hellénistique                                                                                            | 191       | EGY, PPL_COPTES                                                                               |
| 7      | L'Egypte sous la domination romaine                                                                                          | 217       | EGY, PPL_COPTES                                                                               |
| 8      | La Nubie : trait d'union entre l'Afrique centrale et la Méditerranée, facteur géographique de civilisation                   | 235       | SDN, EGY, PPL_NUBIENS                                                                         |
| 9      | La Nubie avant Napata (3100 à 750 avant notre ère)                                                                           | 259       | SDN, EGY, PPL_NUBIENS                                                                         |
| 10     | L'empire de Koush : Napata et Meroé                                                                                          | 295       | SDN, PPL_NUBIENS                                                                              |
| 11     | La civilisation de Napata et de Meroé                                                                                        | 315       | SDN, PPL_NUBIENS                                                                              |
| 12     | La christianisation de la Nubie                                                                                              | 347       | SDN, EGY, PPL_NUBIENS                                                                         |
| 13     | La culture pré-axoumite                                                                                                      | 363       | ETH, ERI, FLG_SEMITIQUE                                                                       |
| 14     | La civilisation d'Axoum du Ier au VIIe siècle                                                                                | 385       | ETH, ERI, FLG_SEMITIQUE, PPL_TIGRAY, PPL_AMHARA                                               |
| 15     | Axoum : du Ier au IVe siècle, Economie-système politique, culture                                                            | 407       | ETH, ERI, FLG_SEMITIQUE, PPL_TIGRAY                                                           |
| 16     | Axoum chrétienne                                                                                                             | 429       | ETH, ERI, FLG_SEMITIQUE, PPL_TIGRAY, PPL_AMHARA                                               |
| 17     | Les protoberbères                                                                                                            | 453       | FLG_BERBERE, PPL_AMAZIGH_MACRO, DZA, MAR, TUN, LBY                                            |
| 18     | La période carthaginoise                                                                                                     | 475       | TUN, DZA, LBY, FLG_BERBERE                                                                    |
| 19     | La période romaine et post-romaine en Afrique du Nord (I. La période romaine, A. Mahjoubi; II. De Rome à l'Islam, P. Salama) | 501 / 539 | TUN, DZA, MAR, LBY, FLG_BERBERE, PPL_AMAZIGH_MACRO                                            |
| 20     | Le Sahara pendant l'Antiquité classique                                                                                      | 553       | FLG_BERBERE, PPL_TUAREG, PPL_TEDA, DZA, LBY, NER, TCD, MLI, MRT                               |
| 21     | Introduction à la fin de la préhistoire en Afrique subsaharienne                                                             | 575       | —                                                                                             |
| 22     | La côte d'Afrique orientale et son rôle dans le commerce maritime                                                            | 595       | KEN, TZA, SOM, MOZ, FLG_BANTU                                                                 |
| 23     | L'Afrique orientale avant le VIIe siècle                                                                                     | 613       | KEN, TZA, UGA, ETH, FLG_BANTU, FLG_COUCHITIQUE, FLG_NILOTIQUE, FLG_KHOISAN                    |
| 24     | L'Afrique de l'Ouest avant le VIIe siècle                                                                                    | 641       | NGA, GHA, MLI, SEN, NER, FLG_NIGERCONGO, FLG_MANDE                                            |
| 25     | L'Afrique centrale                                                                                                           | 673       | COD, CAF, COG, GAB, CMR, FLG_BANTU                                                            |
| 26     | L'Afrique méridionale : chasseurs et cueilleurs                                                                              | 695       | ZAF, NAM, BWA, FLG_KHOISAN, FLG_KHOE, FLG_TUU, FLG_KXA                                        |
| 27     | Les débuts de l'Age du fer en Afrique méridionale                                                                            | 729       | ZAF, ZWE, ZMB, MWI, MOZ, BWA, FLG_BANTU                                                       |
| 28     | Madagascar                                                                                                                   | 751       | MDG, FLG_AUSTRONESIENNE, PPL_MERINA, PPL_BETSIMISARAKA, PPL_SAKALAVA, PPL_ANTANDROY, PPL_VEZO |
| 29     | Les sociétés de l'Afrique sub-saharienne au premier Age du fer                                                               | 779       | FLG_BANTU, FLG_NIGERCONGO, PPL_BANTU                                                          |
| Annex  | Rapport de synthèse du colloque « le peuplement de l'Egypte ancienne et le déchiffrement de l'écriture méroïtique »          | 795       | EGY, SDN, PPL_NUBIENS                                                                         |
| Concl. | Conclusion (G. Mokhtar)                                                                                                      | 825       | —                                                                                             |

Strongest for the corpus: Ch. 17 (Les protoberbères, Desanges; the name « Berbère » and its antecedents); Ch. 1 and the Cairo 1974 colloquium report (Origine des anciens Egyptiens; peopling of Egypt, a contested origin account with its divergence points); Ch. 28 (Madagascar, Vérin; Austronesian and African settlement); Ch. 22-25 (regional peoples before the 7th century, the ground for Bantu and Nilotic ethnonym history); Ch. 8-12 (Nubia and Kush, for the names Nubiens, Koush, Meroé).

### HGA III — L'Afrique du VIIe au XIe siècle (1990)

Editors: Mohammed El Fasi (volume director) and Ivan Hrbek (co-director). Covers Africa from the Arab conquest and the spread of Islam to the 11th century: North Africa, the Sahara and Sudan, the Guinea zone, the Horn, the East African coast and the Comoros, central and southern Africa, Madagascar and the African diaspora in Asia.

| Ch. | Title (as printed)                                                            | p.  | AFRIK entities                                                                                                                              |
| --- | ----------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | L'Afrique dans le contexte de l'histoire mondiale                             | 21  | —                                                                                                                                           |
| 2   | L'avènement de l'Islam et l'essor de l'Empire musulman                        | 53  | —                                                                                                                                           |
| 3   | Étapes du développement de l'Islam et de sa diffusion en Afrique              | 81  | EGY, LBY, TUN, DZA, MAR, SDN, SEN, MLI                                                                                                      |
| 4   | L'Islam en tant que système social en Afrique depuis le VIIe siècle           | 117 | —                                                                                                                                           |
| 5   | Les peuples du Soudan : mouvements de populations                             | 143 | MLI, NER, SEN, MRT, FLG_MANDE, FLG_ATLANTIQUE, FLG_SONGHAY, PPL_SONINKE, PPL_FULA, PPL_SONGHAI, PPL_WOLOF, PPL_SERER, PPL_HAUSA, PPL_KANURI |
| 6   | Les peuples bantuphones et leur expansion                                     | 165 | FLG_BANTU, PPL_BANTU                                                                                                                        |
| 7   | L'Égypte depuis la conquête arabe jusqu'à la fin de l'Empire fatimide (1171)  | 189 | EGY, PPL_COPTES                                                                                                                             |
| 8   | La Nubie chrétienne à l'apogée de sa civilisation                             | 221 | SDN, EGY, PPL_NUBIENS                                                                                                                       |
| 9   | La conquête de l'Afrique du Nord et la résistance berbère                     | 251 | DZA, TUN, MAR, LBY, FLG_BERBERE, PPL_AMAZIGH_MACRO                                                                                          |
| 10  | L'indépendance du Maghreb                                                     | 273 | DZA, TUN, MAR, LBY, FLG_BERBERE, PPL_AMAZIGH_MACRO                                                                                          |
| 11  | Le rôle du Sahara et des Sahariens dans les relations entre le Nord et le Sud | 303 | DZA, LBY, NER, MLI, MRT, TCD, FLG_BERBERE, PPL_TUAREG, PPL_TEDA, PPL_TOUBOU                                                                 |
| 12  | L'avènement des Fatimides                                                     | 341 | EGY, TUN, DZA, MAR                                                                                                                          |
| 13  | Les Almoravides                                                               | 365 | MAR, MRT, SEN, MLI, FLG_BERBERE, PPL_AMAZIGH_MACRO                                                                                          |
| 14  | Commerce et routes du trafic en Afrique occidentale                           | 397 | MLI, MRT, SEN, NER, GHA, FLG_MANDE, PPL_SONINKE                                                                                             |
| 15  | La région du Tchad en tant que carrefour                                      | 465 | TCD, NER, NGA, CMR, FLG_SAHARIEN, FLG_TCHADIQUE, PPL_KANURI, PPL_KANEMBU, PPL_TOUBOU                                                        |
| 16  | La zone guinéenne : situation générale                                        | 489 | NGA, GHA, BEN, TGO, CIV, CMR, FLG_NIGERCONGO                                                                                                |
| 17  | La zone guinéenne : les peuples entre le mont Cameroun et la Côte d'Ivoire    | 521 | CMR, NGA, BEN, TGO, GHA, CIV, FLG_NIGERCONGO, FLG_KWA, PPL_AKAN, PPL_YORUBA, PPL_IGBO, PPL_EDO, PPL_EWE, PPL_FON                            |
| 18  | Les peuples de la Guinée supérieure (entre la Côte d'Ivoire et la Casamance)  | 565 | SEN, GMB, GNB, GIN, SLE, LBR, CIV, FLG_ATLANTIQUE, FLG_MANDE, FLG_KROU, PPL_DIOLA, PPL_TEMNE, PPL_KRU                                       |
| 19  | La corne de l'Afrique                                                         | 595 | ETH, ERI, SOM, DJI, FLG_COUCHITIQUE, FLG_SEMITIQUE, PPL_OROMO, PPL_SOMALI, PPL_AFAR, PPL_AMHARA, PPL_TIGRAY, PPL_AGAW                       |
| 20  | Relations de l'Éthiopie avec le monde musulman                                | 613 | ETH, ERI, EGY, SOM, DJI                                                                                                                     |
| 21  | La côte d'Afrique orientale et les Comores                                    | 625 | KEN, TZA, MOZ, SOM, COM, MDG, PPL_SWAHILI, PPL_COMORIEN, PPL_SHIRAZI, FLG_BANTU                                                             |
| 22  | L'intérieur de l'Afrique orientale                                            | 657 | KEN, TZA, UGA, FLG_BANTU, FLG_COUCHITIQUE, FLG_NILOTIQUE                                                                                    |
| 23  | L'Afrique centrale au nord du Zambèze                                         | 685 | COD, ZMB, MWI, AGO, COG, FLG_BANTU, PPL_LUBA, PPL_BEMBA                                                                                     |
| 24  | L'Afrique méridionale au sud du Zambèze                                       | 709 | ZAF, ZWE, BWA, MOZ, NAM, FLG_BANTU, FLG_KHOISAN                                                                                             |
| 25  | Madagascar                                                                    | 727 | MDG, FLG_AUSTRONESIENNE, PPL_MERINA, PPL_BETSIMISARAKA, PPL_SAKALAVA, PPL_ANTANDROY, PPL_VEZO                                               |
| 26  | La diaspora africaine en Asie                                                 | 749 | —                                                                                                                                           |
| 27  | Relations entre les différentes régions de l'Afrique                          | 779 | —                                                                                                                                           |
| 28  | L'Afrique du VIIe au XIe siècle : cinq siècles formateurs                     | 797 | —                                                                                                                                           |

Strongest for the corpus: Ch. 6 (Les peuples bantuphones et leur expansion; the Bantu name and its migration story); Ch. 5 (Les peuples du Soudan; mouvements de populations, Soninké, Peul, Songhay); Ch. 17 and 18 (peoples of the Guinea zone, source of many ethnonyms of the Akan, Yoruba and Atlantic groups); Ch. 21 (East African coast and the Comoros, Swahili names); Ch. 25 (Madagascar). The volume also has a "Glossaire de termes étrangers" (p. 921) useful for exonym and autonym checks.

### HGA IV — L'Afrique du XIIe au XVIe siècle (1985)

Editor: D. T. Niane (volume director). Covers the 12th to 16th centuries: the Maghreb after the Almohads, the Mali, Songhay and Hausa states, the coastal peoples and first Portuguese contacts, Egypt, Nubia, the Horn, the Swahili coast, the Great Lakes, central, southern and Madagascar, and intercontinental relations.

| Ch. | Title (as printed)                                                                                   | p.  | AFRIK entities                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Introduction                                                                                         | 21  | —                                                                                                                                                                     |
| 2   | Le Maghreb : l'unification sous les Almohades                                                        | 35  | MAR, DZA, TUN, LBY, FLG_BERBERE                                                                                                                                       |
| 3   | Rayonnement de la civilisation maghrébine ; son impact sur la civilisation occidentale               | 79  | MAR, DZA, TUN                                                                                                                                                         |
| 4   | La désintégration de l'unité politique du Maghreb                                                    | 101 | MAR, DZA, TUN, LBY, FLG_BERBERE                                                                                                                                       |
| 5   | La société au Maghreb après la disparition des Almohades                                             | 125 | MAR, DZA, TUN, LBY                                                                                                                                                    |
| 6   | Le Mali et la deuxième expansion manden                                                              | 141 | MLI, GIN, SEN, GMB, MRT, FLG_MANDE, PPL_MALINKE, PPL_BAMBARA, PPL_SONINKE, PPL_DIOULA, PPL_MANDE_MACRO                                                                |
| 7   | Le déclin de l'empire du Mali                                                                        | 197 | MLI, GIN, SEN, GMB, FLG_MANDE, PPL_MALINKE                                                                                                                            |
| 8   | Les Songhay du XIIe au XVIe siècle                                                                   | 213 | MLI, NER, FLG_SONGHAY, PPL_SONGHAI, PPL_SONGHAY_MACRO, PPL_ZARMA                                                                                                      |
| 9   | Les peuples et les royaumes de la boucle du Niger et du bassin des Volta du XIIe au XVIe siècle      | 237 | BFA, MLI, GHA, NER, FLG_GUR, FLG_MANDE, PPL_MOSSI, PPL_DOGON, PPL_SENUFO, PPL_BOBO, PPL_GURMA, PPL_DAGOMBA, PPL_MAMPRUSI                                              |
| 10  | Royaumes et peuples du Tchad                                                                         | 265 | TCD, NER, NGA, CMR, FLG_SAHARIEN, FLG_TCHADIQUE, FLG_SOUDANIQUECENTRAL, PPL_KANURI, PPL_KANEMBU, PPL_TOUBOU, PPL_SARA                                                 |
| 11  | Les Hawsa et leurs voisins du Soudan Central                                                         | 293 | NGA, NER, FLG_TCHADIQUE, PPL_HAUSA, PPL_KANURI                                                                                                                        |
| 12  | Les peuples côtiers - premiers contacts avec les Portugais - de la Casamance aux lagunes ivoiriennes | 329 | SEN, GMB, GNB, GIN, SLE, LBR, CIV, FLG_ATLANTIQUE, FLG_MANDE, FLG_KROU, PPL_DIOLA, PPL_WOLOF, PPL_SERER, PPL_TEMNE, PPL_KRU, PPL_MENDE                                |
| 13  | Des lagunes ivoiriennes à la Volta                                                                   | 353 | CIV, GHA, TGO, FLG_KWA, PPL_AKAN, PPL_ASANTE, PPL_BAOULE, PPL_AGNI, PPL_ANYI, PPL_EBRIE                                                                               |
| 14  | De la Volta au Cameroun                                                                              | 369 | GHA, TGO, BEN, NGA, CMR, FLG_KWA, FLG_BENOUECONGO, PPL_EWE, PPL_FON, PPL_YORUBA, PPL_EDO, PPL_IGBO, PPL_IJAW                                                          |
| 15  | L'Égypte dans le monde musulman (du XIIe siècle au début du XVIe siècle)                             | 403 | EGY, PPL_COPTES                                                                                                                                                       |
| 16  | La Nubie de la fin du XIIe siècle à la conquête par les Funj au début du XVIe siècle                 | 429 | SDN, EGY, PPL_NUBIENS                                                                                                                                                 |
| 17  | La Corne de l'Afrique : les Salomonides en Éthiopie et les États de la Corne de l'Afrique            | 457 | ETH, ERI, SOM, DJI, FLG_SEMITIQUE, FLG_COUCHITIQUE, PPL_AMHARA, PPL_TIGRAY, PPL_OROMO, PPL_SOMALI, PPL_AFAR, PPL_AGAW                                                 |
| 18  | L'essor de la civilisation swahili                                                                   | 491 | KEN, TZA, MOZ, SOM, COM, PPL_SWAHILI, PPL_SHIRAZI, FLG_BANTU                                                                                                          |
| 19  | Entre la côte et les Grands Lacs                                                                     | 519 | KEN, TZA, UGA, FLG_BANTU, PPL_KIKUYU, PPL_MIJIKENDA, PPL_KAMBA, PPL_CHAGA                                                                                             |
| 20  | La région des Grands Lacs                                                                            | 539 | UGA, RWA, BDI, TZA, COD, KEN, FLG_BANTU, FLG_NILOTIQUE, PPL_BAGANDA, PPL_BANYORO, PPL_LUO, PPL_TUTSI_BURUNDI, PPL_KIRUNDI_HUTU, PPL_RWANDAIS_TUTSI, PPL_RWANDAIS_HUTU |
| 21  | Les bassins du Zambèze et du Limpopo (+ 1100 / + 1500)                                               | 567 | ZWE, ZMB, MOZ, MWI, ZAF, BWA, FLG_BANTU, PPL_SHONA, PPL_KARANGA_ZIM                                                                                                   |
| 22  | L'Afrique équatoriale et l'Angola : les migrations et l'apparition des premiers États                | 597 | COD, COG, GAB, AGO, CMR, FLG_BANTU, PPL_KONGO, PPL_LUBA, PPL_LUNDA, PPL_KUBA, PPL_TEKE                                                                                |
| 23  | L'Afrique méridionale : les peuples et les formations sociales                                       | 625 | ZAF, BWA, LSO, SWZ, NAM, FLG_BANTU, FLG_KHOISAN, PPL_TSWANA, PPL_SOTHO, PPL_ZULU, PPL_XHOSA, PPL_VENDA, PPL_KHOIKHOI                                                  |
| 24  | Madagascar et les îles avoisinantes du XIIe au XVIe siècle                                           | 647 | MDG, COM, MUS, SYC, FLG_AUSTRONESIENNE, PPL_MERINA, PPL_BETSIMISARAKA, PPL_SAKALAVA, PPL_ANTANDROY, PPL_VEZO, PPL_COMORIEN                                            |
| 25  | Les relations entre les différentes régions : Échanges entre les régions                             | 665 | —                                                                                                                                                                     |
| 26  | L'Afrique dans les relations intercontinentales                                                      | 689 | —                                                                                                                                                                     |
| 27  | Conclusion                                                                                           | 727 | —                                                                                                                                                                     |

Strongest for the corpus: Ch. 6 (Le Mali et la deuxième expansion manden; Malinké, Bambara, Soninké and the Mande names); Ch. 9 (peoples and kingdoms of the Niger bend and Volta basin: Mossi, Dogon, Gurma); Ch. 13 and 14 (lagoons to the Volta, Volta to Cameroon: Akan, Ewe, Fon, Yoruba, Igbo); Ch. 20 and 22 (Great Lakes, equatorial Africa and Angola, with the Bantu migration reading and the Kongo, Luba, Lunda names); Ch. 12 (coastal peoples and the first Portuguese contact, a source on exonyms given by the Portuguese).

---

Caveats. Diop's chapter 1 (origin of the ancient Egyptians) and the Cairo 1974 colloquium report record a divergence of positions; cite them with that divergence, not as settled. Every FLG_, PPL_ and ISO3 id above was checked against the corpus file names (no Fanti entry exists, so none is cited).

## Histoire générale de l'Afrique V–VIII (French, 1987–1999)

_Method note for this part:_ Pages are the book's printed pages as given in each table of contents. Entity IDs were checked against `dataset/source/afrik/` (pays, famille_linguistique, peuples). A PPL_ id is cited only where the chapter title clearly names that people; a country ISO3 or an FLG_ family is cited where the chapter's region or subject maps to it. `—` means no clear single mapping (continental or thematic chapter). Note on printed errors in the TOCs: HGA V ch. 18 is printed at p. 457, which is out of sequence (between p. 541 and p. 601 it must start near p. 557); HGA VI ch. 16 is printed "Madagascar, 1880 -1880" (the period is evidently 1800-1880). Both are reproduced as printed.

### HGA V — L'Afrique du XVIe au XVIIIe siècle (1999)

Editor: Bethwell A. Ogot. Period: c. 1500-1800 (slave trade, Atlantic order, state formation, regional surveys).

| Ch. | Title (as printed)                                                                                                                       | p.               | AFRIK entities                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------- |
| 1   | La lutte pour le commerce international et ses implications pour l'Afrique                                                               | 19               | —                                            |
| 2   | Les structures politiques, économiques et sociales africaines durant la période considérée                                               | 43               | —                                            |
| 3   | Les mouvements de population et l'émergence de nouvelles formes sociopolitiques en Afrique                                               | 67               | FLG_BANTU                                    |
| 4   | L'Afrique dans l'histoire du monde : la traite des esclaves à partir de l'Afrique et l'émergence d'un ordre économique dans l'Atlantique | 99               | —                                            |
| 5   | La diaspora africaine dans l'Ancien et le Nouveau Monde                                                                                  | 139              | —                                            |
| 6   | L'Égypte sous l'Empire ottoman                                                                                                           | 167              | EGY                                          |
| 7   | Le Soudan de 1500 à 1800                                                                                                                 | 205              | SDN                                          |
| 8   | Le Maroc                                                                                                                                 | 237              | MAR                                          |
| 9   | Algérie, Tunisie et Libye: les Ottomans et leurs héritiers                                                                               | 271              | DZA, TUN, LBY                                |
| 10  | La Sénégambie du XVIe aux XVIIIe siècle : évolution des Wolof, des Seereer et des Tukuloor                                               | 301              | SEN, GMB, PPL_WOLOF, PPL_SERER, PPL_FULA     |
| 11  | La fin de l'Empire songhay                                                                                                               | 341              | MLI, NER, FLG_SONGHAY, PPL_SONGHAY_MACRO     |
| 12  | Du Niger à la Volta                                                                                                                      | 369              | BFA, GHA, PPL_MOSSI                          |
| 13  | Les États et les cultures de la côte de haute Guinée                                                                                     | 411              | GIN, SLE, LBR, CIV                           |
| 14  | Les États et les cultures de la côte de la Guinée inférieure                                                                             | 443              | GHA, TGO, BEN, PPL_AKAN, PPL_ASANTE          |
| 15  | Les Fon et les Yoruba, du delta du Niger au Cameroun                                                                                     | 483              | NGA, BEN, CMR, PPL_FON, PPL_YORUBA           |
| 16  | Les États hawsa                                                                                                                          | 503              | NGA, NER, PPL_HAUSA                          |
| 17  | Le Kānem-Borno : ses relations avec la Méditerranée, le Baguirmi et les autres États du bassin du Tchad                                  | 541              | TCD, NGA, PPL_KANURI                         |
| 18  | Des savanes du Cameroun au haut Nil                                                                                                      | 457 (as printed) | CMR, CAF, SSD, COD                           |
| 19  | Le Royaume du Kongo et ses voisins                                                                                                       | 601              | COD, AGO, COG, PPL_KONGO                     |
| 20  | Le système politique luba et lunda: émergence et expansion                                                                               | 643              | COD, PPL_LUBA, PPL_LUNDA                     |
| 21  | La Zambézie du Nord : la région du lac Malawi                                                                                            | 665              | MWI, ZMB                                     |
| 22  | La région au sud du Zambèze                                                                                                              | 697              | ZWE, MOZ                                     |
| 23  | L'Afrique australe                                                                                                                       | 743              | ZAF, NAM, BWA                                |
| 24  | La corne de l'Afrique                                                                                                                    | 765              | ETH, SOM, ERI, DJI                           |
| 25  | La côte orientale de l'Afrique                                                                                                           | 815              | KEN, TZA, MOZ, PPL_SWAHILI                   |
| 26  | La région des Grands Lacs, de 1500 à 1800                                                                                                | 843              | UGA, RWA, BDI                                |
| 27  | L'intérieur de l'Afrique de l'Est : les peuples du Kenya et de la Tanzanie (1500 -1800)                                                  | 897              | KEN, TZA                                     |
| 28  | Madagascar et les îles de l'océan Indien                                                                                                 | 921              | MDG, COM, MUS, SYC, PPL_MERINA, PPL_SAKALAVA |
| 29  | L'histoire des sociétés africaines de 1500 à 1800 : conclusion                                                                           | 969              | —                                            |

Strongest for the corpus:

- Ch. 3 (p. 67) — population movements and the emergence of new sociopolitical forms: migrations behind the spread of ethnic labels (Bantu expansion, etc.).
- Ch. 10 (p. 301) — Wolof, Seereer and Tukuloor: the names of three Senegambian peoples and their ethnogenesis, directly tied to the Fula/Tukuloor naming question.
- Ch. 28 (p. 921) — Madagascar and the Indian Ocean islands: origin and peopling of Malagasy groups, Comoros, Mascarenes.
- Ch. 12 (p. 369) and ch. 15 (p. 483) — Niger-Volta and Fon/Yoruba: formation of peoples and polities whose later ethnonyms were fixed by outsiders.
- Ch. 25 (p. 815) — the East African coast: Swahili/Shirazi naming and Indian Ocean contacts.

### HGA VI — L'Afrique au XIXe siècle jusque vers les années 1880 (1996)

Editor: J. F. Ade Ajayi. Period: c. 1800-1880 (abolition, Mfecane, Islamic revolutions, Egypt's renaissance, Madagascar, on the eve of the conquest).

| Ch. | Title (as printed)                                                         | p.  | AFRIK entities                                             |
| --- | -------------------------------------------------------------------------- | --- | ---------------------------------------------------------- |
| 1   | L'Afrique au début du XIXe siècle : problèmes et perspectives              | 23  | —                                                          |
| 2   | L'Afrique et l'économie-monde                                              | 47  | —                                                          |
| 3   | Tendances et processus nouveaux dans l'Afrique du XIXe siècle              | 65  | —                                                          |
| 4   | L'abolition de la traite des esclaves                                      | 91  | —                                                          |
| 5   | Le Mfecane et l'émergence de nouveaux États africains                      | 117 | ZAF, LSO, SWZ, PPL_ZULU, PPL_NDEBELE, PPL_SOTHO, PPL_SWAZI |
| 6   | L'impact du Mfecane sur la colonie du Cap                                  | 153 | ZAF, PPL_XHOSA                                             |
| 7   | Les Britanniques, les Boers et les Africains en Afrique du Sud, 1850 -1880 | 173 | ZAF                                                        |
| 8   | Les pays du bassin du Zambèze                                              | 211 | ZMB, ZWE, MWI, MOZ                                         |
| 9   | La côte et l'hinterland de l'Afrique orientale de 1800 à 1845              | 245 | KEN, TZA                                                   |
| 10  | La côte et l'hinterland de l'Afrique orientale de 1845 à 1880              | 269 | KEN, TZA                                                   |
| 11  | Peuples et États de la région des Grands Lacs                              | 307 | UGA, RWA, BDI                                              |
| 12  | Le bassin du Congo et l'Angola                                             | 331 | COD, AGO                                                   |
| 13  | La renaissance de l'Égypte (1805 -1881)                                    | 363 | EGY                                                        |
| 14  | Le Soudan au XIXe siècle                                                   | 393 | SDN                                                        |
| 15  | L'Éthiopie et la Somalie                                                   | 415 | ETH, SOM                                                   |
| 16  | Madagascar, 1880 -1880 (as printed)                                        | 453 | MDG, PPL_MERINA                                            |
| 17  | Nouveaux développements au Maghreb : l'Algérie, la Tunisie et la Libye     | 489 | DZA, TUN, LBY                                              |
| 18  | Le Maroc du début du XIXe siècle à 1880                                    | 517 | MAR                                                        |
| 19  | Nouvelles formes d'intervention européenne au Maghreb                      | 537 | DZA, TUN, MAR                                              |
| 20  | Le Sahara au XIXe siècle                                                   | 555 | FLG_BERBERE, PPL_TUAREG                                    |
| 21  | Les révolutions islamiques du XIXe siècle en Afrique de l'Ouest            | 579 | —                                                          |
| 22  | Le califat de Sokoto et le Borno                                           | 599 | NGA, PPL_HAUSA, PPL_KANURI, PPL_FULA                       |
| 23  | Le Macina et l'Empire torodbe (tukuloor) jusqu'en 1878                     | 647 | MLI, PPL_FULANI_MASSINA                                    |
| 24  | États et peuples de Sénégambie et de haute Guinée                          | 683 | SEN, GIN, GMB, GNB                                         |
| 25  | États et peuples de la boucle du Niger et de la Volta                      | 709 | MLI, BFA, GHA                                              |
| 26  | Dahomey, pays yoruba, Borgu (Borgou) et Bénin au XIXe siècle               | 745 | BEN, NGA, PPL_FON, PPL_YORUBA                              |
| 27  | Le delta du Niger et le Cameroun                                           | 771 | NGA, CMR, PPL_IJAW                                         |
| 28  | La diaspora africaine                                                      | 799 | —                                                          |
| 29  | Conclusion : l'Afrique à la veille de la conquête européenne               | 825 | —                                                          |

Strongest for the corpus:

- Ch. 5 (p. 117) — Mfecane: how Zulu, Ndebele, Sotho, Swazi and others were formed or renamed in the 1820s-30s.
- Ch. 16 (p. 453) — Madagascar before 1880: Merina kingdom and unification, the island's political naming.
- Ch. 22-24 (pp. 599, 647, 683) — Sokoto, Macina/Torodbe, Senegambia: the Fulani/Tukuloor/Torodbe label family and its jihad-era ethnogenesis.
- Ch. 25 and 26 (pp. 709, 745) — Niger-Volta and Dahomey/Yoruba/Borgu/Benin: peoples and states on the eve of conquest.
- Ch. 29 (p. 825) — closing synthesis on the state of African polities and identities before the partition.

### HGA VII — L'Afrique sous domination coloniale, 1880-1935 (1987)

Editor: Albert Adu Boahen. Period: 1880-1935 (partition, resistance, colonial economy and society, nationalism).

| Ch. | Title (as printed)                                                                                          | p.  | AFRIK entities                    |
| --- | ----------------------------------------------------------------------------------------------------------- | --- | --------------------------------- |
| 1   | L'Afrique face au défi colonial                                                                             | 21  | —                                 |
| 2   | Partage européen et conquête de l'Afrique : aperçu général                                                  | 39  | —                                 |
| 3   | Initiatives et résistances africaines face au partage et à la conquête                                      | 67  | —                                 |
| 4   | Initiatives et résistances africaines en Afrique du Nord-Est                                                | 87  | EGY, SDN, ETH, ERI, SOM, DJI      |
| 5   | Initiatives et résistances africaines en Afrique du Nord et au Sahara                                       | 111 | DZA, MAR, TUN, LBY                |
| 6   | Initiatives et résistances africaines en Afrique occidentale de 1880 à 1914                                 | 137 | SEN, MLI, GIN, CIV, GHA, NGA, BEN |
| 7   | Initiatives et résistances africaines en Afrique orientale de 1880 à 1914                                   | 171 | KEN, TZA, UGA                     |
| 8   | Initiatives et résistances africaines en Afrique centrale de 1880 à 1914                                    | 191 | COD, COG, GAB, CAF, AGO           |
| 9   | Initiatives et résistances africaines en Afrique méridionale                                                | 217 | ZAF, ZWE, ZMB, MWI, MOZ, NAM      |
| 10  | Madagascar de 1880 à 1939 : initiatives et réactions africaines à la conquête et à la domination coloniales | 245 | MDG, PPL_MERINA                   |
| 11  | Le Libéria et l'Éthiopie, 1880 -1914 : la survie de deux États africains                                    | 273 | LBR, ETH                          |
| 12  | La première guerre mondiale et ses conséquences                                                             | 307 | —                                 |
| 13  | La domination européenne : méthodes et institutions                                                         | 339 | —                                 |
| 14  | L'économie coloniale                                                                                        | 361 | —                                 |
| 15  | L'économie coloniale des anciennes zones françaises, belges et portugaises (1914 -1935)                     | 381 | —                                 |
| 16  | L'économie coloniale : les anciennes zones britanniques                                                     | 413 | —                                 |
| 17  | L'économie coloniale : l'Afrique du Nord                                                                    | 455 | DZA, EGY, LBY, MAR, TUN           |
| 18  | Les répercussions sociales de la domination coloniale : aspects démographiques                              | 495 | —                                 |
| 19  | Les répercussions sociales de la domination coloniale : les nouvelles structures sociales                   | 527 | —                                 |
| 20  | La religion en Afrique pendant l'époque coloniale                                                           | 549 | —                                 |
| 21  | Les arts en Afrique à l'époque de la domination coloniale                                                   | 581 | —                                 |
| 22  | La politique africaine et le nationalisme africain 1919 -1935                                               | 609 | —                                 |
| 23  | La politique et le nationalisme en Afrique du Nord-Est, 1919 -1935                                          | 625 | EGY, SDN, ETH                     |
| 24  | La politique et le nationalisme au Maghreb et au Sahara, 1919 -1935                                         | 649 | DZA, MAR, TUN                     |
| 25  | La politique et le nationalisme en Afrique occidentale, 1919 -1935                                          | 669 | —                                 |
| 26  | La politique et le nationalisme en Afrique orientale, 1919 -1935                                            | 695 | KEN, TZA, UGA                     |
| 27  | La politique et le nationalisme en Afrique centrale et méridionale, 1919 -1935                              | 721 | COD, ZAF, ZWE, ZMB                |
| 28  | L'éthiopie et le Libéria, 1914 -1935 : deux États africains indépendants à l'ère coloniale                  | 761 | ETH, LBR                          |
| 29  | L'Afrique et le nouveau monde                                                                               | 797 | —                                 |
| 30  | Le colonialisme en Afrique : impact et signification                                                        | 837 | —                                 |

Strongest for the corpus:

- Ch. 2 (p. 39) — European partition and conquest: the Berlin-era frontiers and the colonial naming of territories.
- Ch. 13 (p. 339) — methods and institutions of European rule: administrative categories (circles, "tribes", indirect rule) that fixed exonyms.
- Ch. 10 (p. 245) — Madagascar 1880-1939: conquest and colonial rule on the island.
- Ch. 18 (p. 495) and ch. 19 (p. 527) — demographic effects and new social structures: censuses, ethnic classification and the "tribe" as a colonial category.
- Ch. 11 and 28 (pp. 273, 761) — Liberia and Ethiopia: the two states that kept their own names; useful counter-cases.

### HGA VIII — L'Afrique depuis 1935 (1998)

Editor: Ali A. Mazrui (assistant editor: C. Wondji). Period: 1935 to the 1990s (war decade, decolonisation, development, nation-building, culture, pan-Africanism, international relations).

| Ch. | Title (as printed)                                                                                 | p.  | AFRIK entities                         |
| --- | -------------------------------------------------------------------------------------------------- | --- | -------------------------------------- |
| 1   | Introduction                                                                                       | 19  | —                                      |
| 2   | La corne de l'Afrique et l'Afrique septentrionale                                                  | 49  | ETH, SOM, ERI, EGY, LBY, TUN, DZA, MAR |
| 3   | L'Afrique tropicale et l'Afrique équatoriale sous la domination française, espagnole et portugaise | 77  | —                                      |
| 4   | L'Afrique sous domination britannique et belge                                                     | 95  | —                                      |
| 5   | « Cherchez d'abord le royaume politique.. »                                                        | 125 | —                                      |
| 6   | L'Afrique septentrionale et la corne de l'Afrique                                                  | 149 | DZA, MAR, TUN, LBY, EGY, ETH, SOM      |
| 7   | L'Afrique occidentale                                                                              | 183 | SEN, MLI, GIN, CIV, GHA, NGA           |
| 8   | L'Afrique équatoriale de l'Ouest                                                                   | 215 | CMR, GAB, COG, CAF, COD                |
| 9   | L'Afrique orientale                                                                                | 243 | KEN, TZA, UGA, MDG                     |
| 10  | L'Afrique australe                                                                                 | 273 | ZAF, ZWE, NAM, AGO, MOZ                |
| 11  | Les changements économiques en Afrique dans le contexte mondial (1935 -1980)                       | 309 | —                                      |
| 12  | L'agriculture et le développement rural                                                            | 341 | —                                      |
| 13  | Le développement industriel et la croissance urbaine                                               | 385 | —                                      |
| 14  | Stratégies comparées de la décolonisation économique                                               | 419 | —                                      |
| 15  | Construction de la nation et évolution des structures politiques                                   | 461 | —                                      |
| 16  | Construction de la nation et évolution des valeurs politiques                                      | 499 | —                                      |
| 17  | Religion et évolution sociale                                                                      | 533 | —                                      |
| 18  | Langue et évolution sociale                                                                        | 555 | —                                      |
| 19  | Le développement de la littérature moderne                                                         | 581 | —                                      |
| 20  | Les arts et la société depuis 1935                                                                 | 609 | —                                      |
| 21  | Tendances de la philosophie et de la science en Afrique                                            | 663 | —                                      |
| 22  | Éducation et changement social                                                                     | 709 | —                                      |
| 23  | L'Afrique et la diaspora noire                                                                     | 737 | —                                      |
| 24  | Le panafricanisme et l'intégration régionale                                                       | 757 | —                                      |
| 25  | Panafricanisme et libération                                                                       | 779 | —                                      |
| 26  | L'Afrique et les pays capitalistes                                                                 | 805 | —                                      |
| 27  | L'Afrique et les pays socialistes                                                                  | 837 | —                                      |
| 28  | L'Afrique et les régions en développement                                                          | 869 | —                                      |
| 29  | L'Afrique et l'Organisation des Nations Unies                                                      | 911 | —                                      |
| 30  | L'horizon 2000                                                                                     | 947 | —                                      |
| —   | Postface : chronologie de l'actualité de l'Afrique des années 90 (C. Wondji)                       | 979 | —                                      |

Strongest for the corpus:

- Ch. 16 (p. 499) — nation-building and political values: ethnicity versus the nation-state, re-naming of states.
- Ch. 15 (p. 461) — nation-building and political structures: inherited colonial borders and their consequences.
- Ch. 18 (p. 555) — language and social change: language policy, lingua francas and the status of African languages.
- Ch. 7-10 (pp. 183, 215, 243, 273) — regional decolonisation chapters: independence-era renaming of countries (Gold Coast to Ghana, etc.); ch. 9 includes Madagascar (Lucile Rabearimanana).
- Ch. 24 (p. 757) — pan-Africanism and regional integration: border doctrine (OAU, uti possidetis).

Madagascar / Indian Ocean chapters across the four volumes: HGA V ch. 28 "Madagascar et les îles de l'océan Indien" (p. 921); HGA VI ch. 16 "Madagascar, 1880 -1880" (p. 453); HGA VII ch. 10 "Madagascar de 1880 à 1939 : initiatives et réactions africaines à la conquête et à la domination coloniales" (p. 245); HGA VIII has no dedicated chapter (Madagascar is treated within ch. 9 "L'Afrique orientale", p. 243).

## General History of Africa IX–XI (English, 2025)

_Method note for this part:_ Source: printed tables of contents (page = the book's printed page number). Volumes: English, 2025, CC BY-SA 3.0 IGO. Mapping basis: chapter titles and the TOC only; chapter texts were not read in full, so entity links are indicative and every claim must be re-checked against the chapter before citing. IDs verified to exist in `dataset/source/afrik/`. No people ID is given for Makoa (Madagascar) or Agudá (Benin): no matching fiche exists.

### GHA IX — General History of Africa Revisited (2025)

Editor Augustin F. C. Holl (UNESCO, ISBN 978-92-3-100809-2). A 1,000-page critical review of the 1964-1999 eight-volume series plus new research from prehistory to the 19th century; it matters here for its epistemology section (who names Africa, oral tradition, African-language history), the Blench language classification and its Madagascar and Indian Ocean chapters.

| Ch.       | Title                                                                                                                | p.    | AFRIK entities                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| Intro     | General Introduction: Reconceptualizing the History of Africa and its Diasporas (Holl)                               | XXIII | —                                                                                                                          |
| Intro     | General History of Africa Revisited: An Introduction (Holl)                                                          | XLVII | —                                                                                                                          |
| I intro   | Writing History of Africans and their Diasporas Today (Yai, Ze Belinga)                                              | 3     | —                                                                                                                          |
| I.1       | Decolonizing History: Epistemology of a Creative Destruction (Ze Belinga)                                            | 13    | —                                                                                                                          |
| I.2       | The History of Africa in the Diaspora: Epistemological and Ideological Barriers (Somet)                              | 49    | _African diaspora, general_                                                                                                |
| I.3       | The Concept of Africa and History of Africa (Abdelmadjid)                                                            | 65    | —                                                                                                                          |
| I.4       | Afro-China Relations Before 1500 (Li)                                                                                | 89    | _China_                                                                                                                    |
| I.5       | Japanese Epistemology and African History (Kitagawa)                                                                 | 101   | _Japan_                                                                                                                    |
| I.6       | Speaking of History in African Languages (Yai)                                                                       | 117   | —                                                                                                                          |
| I.7       | Nouns and Verbs of History in Ancient Egyptian (Anselin)                                                             | 137   | EGY                                                                                                                        |
| I.8       | The Word Africa and its Strategic Challenges: from Heteronomous Assignation to Endogenous Assumption (Binam Bikoi)   | 143   | —                                                                                                                          |
| I.9       | Orality and the Writing of African History (Mve Ondo)                                                                | 163   | —                                                                                                                          |
| I.10      | Oral Traditions - Sources of an Updated African Historiography (Gayibor)                                             | 177   | —                                                                                                                          |
| I.11      | Tantara: Madagascar's African Historical Tradition (Esoavelomandroso)                                                | 185   | MDG                                                                                                                        |
| I.12      | Cosmogonies, Visions of the World, Ancient Imaginaries (Ba)                                                          | 193   | —                                                                                                                          |
| I.13      | Symbolic African Dances, Drumming, Songs and Language, and the Preservation of the Past (Anyidoho)                   | 199   | —                                                                                                                          |
| I.14      | Denominations and Disciplinary Status of African Literatures in European Languages (Kandjimbo)                       | 211   | —                                                                                                                          |
| I.15      | Ìsèse L'Àgbà: Apotheosis of Initiates in Afro-Brazilian and Afro-Latin American Yorùbá Diaspora Traditions (Omidire) | 223   | PPL_YORUBA; _Brazil, Latin America_                                                                                        |
| I.16      | Concepts in African Religious and Philosophical Traditions (Osha)                                                    | 245   | —                                                                                                                          |
| I.17      | African Written Forms (Condro)                                                                                       | 255   | —                                                                                                                          |
| I.18      | Epigraphy and the Understanding of the African Past (Moraes Farias)                                                  | 267   | —                                                                                                                          |
| I.19      | Tangible and Intangible Heritage and New Approaches of African History (Kiriama)                                     | 279   | —                                                                                                                          |
| I.20      | Afro America: Africa and the Arts (Wood)                                                                             | 289   | _Americas_                                                                                                                 |
| I.21      | Historical Sciences and the Multidisciplinary Imperative (Holl)                                                      | 297   | —                                                                                                                          |
| II intro  | Review of the General History of Africa: Volumes I-VIII (Konaté)                                                     | 307   | —                                                                                                                          |
| II.1      | Review of Vol. I, Methodology and African Prehistory (Holl)                                                          | 331   | —                                                                                                                          |
| II.2      | Review of Vol. II, Ancient Civilizations of Africa (Anselin)                                                         | 355   | EGY                                                                                                                        |
| II.3      | Review of Vol. III, 7th-11th Century (Bâ)                                                                            | 375   | —                                                                                                                          |
| II.4      | Review of Vol. IV, 12th-16th Century (Adandé)                                                                        | 389   | —                                                                                                                          |
| II.5      | Review of Vol. V, 16th-18th Century (Mota)                                                                           | 407   | —                                                                                                                          |
| II.6      | Review of Vol. VI, 19th Century until the 1880s (Coquery-Vidrovitch)                                                 | 415   | —                                                                                                                          |
| II.7      | Review of Vol. VII, Africa under Colonial Domination (Rajaonah)                                                      | 429   | —                                                                                                                          |
| II.8      | Review of Vol. VIII, Africa since 1935 (Barbosa)                                                                     | 447   | —                                                                                                                          |
| III intro | The Initial History of Africa: An Update (Holl)                                                                      | 459   | —                                                                                                                          |
| III.1     | Paleoclimatic and Paleoenvironmental Research in Africa (Lezine)                                                     | 483   | —                                                                                                                          |
| III.2     | The Genealogical Connections of Africa's Regions: Y Chromosome Evidence (Keita)                                      | 511   | _Africa and Madagascar (haplogroups)_                                                                                      |
| III.3     | Linguistic Map and Classification of African Languages (Blench)                                                      | 531   | FLG_NILOSAHARIENNE, FLG_NIGERCONGO, FLG_BENOUECONGO, FLG_BANTU, FLG_AFROASIATIQUE, FLG_KHOISAN, FLG_KHOE, FLG_TUU, FLG_KXA |
| III.4     | West of the Rift Valley in Chad: The First Two Mio-Pliocene Hominids (Brunet et al.)                                 | 551   | TCD                                                                                                                        |
| III.5     | Gathering, Scavenging and Hunting (Lewis)                                                                            | 565   | —                                                                                                                          |
| III.6     | The First Cutting Tools and Stone Tool Cultures (Roche)                                                              | 577   | —                                                                                                                          |
| III.7     | The First Lithic Assemblages and Cultural Complexes (Bagodo)                                                         | 593   | —                                                                                                                          |
| III.8     | Adaptations of Societies from the Late Pleistocene to the Early Holocene (Sari)                                      | 619   | —                                                                                                                          |
| III.9     | The Emergence and Development of Food-Producing Economies (Holl)                                                     | 637   | MRT                                                                                                                        |
| III.10    | Genesis and Development of Pastoralism in Sahara and North Africa (Di Lernia)                                        | 655   | _Sahara_                                                                                                                   |
| III.11    | The Advent of Domestication in Eastern and Southern Africa (Chami)                                                   | 669   | —                                                                                                                          |
| III.12    | African Foundations of Ancient Egypt (Wengrow)                                                                       | 687   | EGY                                                                                                                        |
| III.13    | Megaliths of Nabta Playa (Ibrahim)                                                                                   | 705   | EGY                                                                                                                        |
| III.14    | Populations of Pharaonic Egypt: Ancient DNA (Gourdine)                                                               | 723   | EGY                                                                                                                        |
| III.15    | Kinship and Social Structure in Kemet (Nehusi)                                                                       | 741   | EGY                                                                                                                        |
| III.16    | The Invention of Pottery in Africa (Huysecom)                                                                        | 759   | —                                                                                                                          |
| III.17    | African Metallurgies (Bocoum)                                                                                        | 771   | —                                                                                                                          |
| III.18    | The Emergence of Complex Societies and Urbanization in Africa (Connah)                                               | 789   | —                                                                                                                          |
| III.19    | Socio-political Complexity in the Northern Horn of Africa (Curtis, Schmidt)                                          | 801   | ETH, ERI                                                                                                                   |
| III.20    | East Africa and the Indian Ocean Networks, 1st-15th Century (Beaujard)                                               | 833   | MDG; _East Africa, Indian Ocean_                                                                                           |
| III.21    | Social Complexity in the Great Lakes Region (Robertshaw)                                                             | 849   | UGA, RWA, BDI, TZA                                                                                                         |
| IV intro  | Ancient and Modern History of Africa: An Update (Holl)                                                               | 861   | —                                                                                                                          |
| IV.1      | Population Growth in the Inner Niger Delta (Mali) Prior to the Great Empires (Dembélé)                               | 889   | MLI                                                                                                                        |
| IV.2      | Political Constructions in Madagascar: From Their Origins to the 19th Century (Esoavelomandroso)                     | 899   | MDG, FLG_AUSTRONESIENNE, PPL_MERINA                                                                                        |
| IV.3      | Modalities of Enslavement in South Central Africa, 18th-19th Century (Castro Henriques)                              | 911   | AGO                                                                                                                        |
| IV.4      | Slave Trade and Resistance in Senegambia (Ciss)                                                                      | 925   | SEN, GMB                                                                                                                   |
| IV.5      | Confrontation, Collaboration and Rebellion: Resistance and Enslavement in Central Africa (Idrissou, Sehou)           | 949   | _Central Africa_                                                                                                           |
| IV.6      | Slavery in Madagascar: Former Servitude and Current Inequality (Razafindralambo)                                     | 973   | MDG                                                                                                                        |
| IV.7      | The Long-Term Jewish Diaspora of Africa (Bâ)                                                                         | 981   | —                                                                                                                          |
| IV.8      | Asian Diasporas in East Africa and the Islands, 1st-15th Century (Beaujard)                                          | 989   | _East Africa, Indian Ocean islands_                                                                                        |
| IV.9      | Gujaratis of the Western Indian Ocean (Gandelot)                                                                     | 995   | _Western Indian Ocean_                                                                                                     |
| IV.10     | Settlement and Identity Construction in West Africa: The Jula Trading Diaspora (Cissé)                               | 999   | PPL_DIOULA, FLG_MANDE                                                                                                      |
| IV.11     | Zanzibar's Commercial Empire (Glassman)                                                                              | 1007  | TZA, PPL_SWAHILI                                                                                                           |
| IV.12     | Culinary and Food Heritage (de Alencastro)                                                                           | 1015  | —                                                                                                                          |

Strongest for the corpus:

- I.8 (p. 143), "The Word Africa": exonym-to-endonym assignation of the continent's own name, the project's question at continental scale.
- I.6 (p. 117) and I.9-I.10 (pp. 163, 177): history spoken in African languages and oral tradition as source, the register for local accounts beside external ones.
- III.3 (p. 531), Blench: current classification of families, to cross-check every FLG_ fiche.
- I.11 (p. 185) and IV.2 (p. 899), Esoavelomandroso: Malagasy tantara and political formations (MDG, Merina).
- IV.10 (p. 999), Jula diaspora: how a trade name becomes an identity (PPL_DIOULA).

### GHA X — Africa and its Diasporas (2025)

Editor Vanicléia Silva Santos (sections coordinated by Boyce-Davies, Silva Santos, Lovejoy). The newest UNESCO reference on the diasporas: Atlantic, Indian Ocean, Asia, Europe, Middle East; essential for Caribbean, Brazil and diaspora audiences, and for how "nations" such as Nagô, Jeje, Mina, Angola and Congo were named and kept in the Americas.

| Ch.       | Title                                                                                                                                            | p.   | AFRIK entities                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ------------------------------------------------------ |
| Intro     | General introduction (Holl)                                                                                                                      | XXV  | —                                                      |
| Intro     | Introduction: History of Africa and its Diasporas (Silva Santos)                                                                                 | XLIX | —                                                      |
| I intro   | The Epistemological Basis for Claiming Black Identities (Boyce-Davies)                                                                           | 3    | _African diaspora, general_                            |
| I.1       | Blackness Beyond the United States: New Diasporic Definitions (Wright)                                                                           | 29   | _Global diaspora_                                      |
| I.2       | Conceptualising Colour Representation in Antiquity (Saakana)                                                                                     | 45   | EGY                                                    |
| I.3       | North Africa and the Origins of Epistemic Blackness (Benjamin)                                                                                   | 61   | _North Africa_                                         |
| I.4       | What's in a Name? Blackness and Afrodescendant Definitions in Latin America and the Spanish-Speaking Caribbean (Laó-Montes)                      | 77   | _Latin America, Spanish-speaking Caribbean_            |
| I.5       | Becoming Black: Brazil's Long Search for Racial Identity (Rocha)                                                                                 | 101  | _Brazil_                                               |
| I.6       | The Indian Ocean as Diasporic Field (Vergès)                                                                                                     | 123  | _Indian Ocean_                                         |
| I.7       | African Diaspora in South Asia (De Silva Jayasuriya)                                                                                             | 133  | _South Asia_                                           |
| I.8       | Blacks/Africans in China (Li)                                                                                                                    | 143  | _China_                                                |
| I.9       | Being Black in Australia (Smith, Sonn, Cooper)                                                                                                   | 161  | _Australia_                                            |
| I.10      | Transnationalism, Diasporas and the African Diaspora (Goulbourne)                                                                                | 177  | _Global diaspora_                                      |
| I.11      | Economics of the Transatlantic African Diaspora (Inikori)                                                                                        | 189  | _Atlantic_                                             |
| I.12      | Indigeneity and African Belonging in the Caribbean and the Americas (Jackson)                                                                    | 203  | _Caribbean, Americas_                                  |
| I.13      | Black Studies Epistemologies in the USA (Burden-Stelly)                                                                                          | 217  | _United States_                                        |
| I.14      | Transnational Feminism for Global Africa (Mama)                                                                                                  | 235  | —                                                      |
| I.15      | Intellectual Genealogies of Black/Queer/Diaspora (Allen)                                                                                         | 247  | _Americas_                                             |
| I.16      | Genealogy of a Discriminatory Rhetoric in the Classical Arab-Muslim World (Trabelsi)                                                             | 263  | _Arab-Muslim world_                                    |
| II intro  | Mapping the African Diasporas (Silva Santos)                                                                                                     | 281  | —                                                      |
| II.1      | Africans in Ancient China (900-1600 CE) (Wyatt)                                                                                                  | 305  | _China_                                                |
| II.2      | The Afro-Indian Diaspora and the Rise of European Influence, 1500-1700 (Jasdanwalla)                                                             | 313  | _India_                                                |
| II.3      | Iranian People of African Descent (Mirzai)                                                                                                       | 325  | _Iran_                                                 |
| II.4      | The African Diaspora in Oceania, 1700-1800 (Pybus)                                                                                               | 333  | _Oceania_                                              |
| II.5      | The 'Masombika' or 'Makoa' in Madagascar (Boyer-Rossol)                                                                                          | 347  | MDG                                                    |
| II.6      | Mauritius, between Community Compartmentalisation and Cultural Melting Pots (Servan-Schreiber)                                                   | 357  | MUS                                                    |
| II.7      | Africans in Portugal, 15th-19th Centuries (Castro Henriques)                                                                                     | 367  | _Portugal_                                             |
| II.8      | Afro-Atlantic Communities in the Atlantic World (Ferreira, da Silva Jr)                                                                          | 381  | AGO; _Atlantic_                                        |
| II.9      | Creolization in Early Modern West Africa and African Diaspora: Lowcountry Creola' and the Making of Gullah Geechee, ca. 1500-1860 (Fields-Black) | 401  | PPL_GULLAH, FLG_CREOLE; _US Lowcountry_                |
| II.10     | Communities of African Descent in Canada (Johnson)                                                                                               | 417  | _Canada_                                               |
| II.11     | African-Mexican Communities (Ramsay)                                                                                                             | 439  | _Mexico_                                               |
| II.12     | African Communities in Costa Rica and Central America (Cáceres)                                                                                  | 457  | _Central America_                                      |
| II.13     | Blackness Across Borders: Jamaican Diasporas (Thomas)                                                                                            | 471  | _Jamaica_                                              |
| II.14     | Resistance of Malagasy Slaves to Enslavement, 17th-18th Centuries (Thiébaut)                                                                     | 493  | MDG                                                    |
| II.15     | Slave Revolt in Brazil (Reis)                                                                                                                    | 521  | _Brazil_                                               |
| II.16     | Enslaved Resistance in North America (Diouf)                                                                                                     | 533  | _North America_                                        |
| II.17     | Berber, Nubian and Sudanese Soldiers in the Muslim Conquest of Iberia, 8th-12th C. (Trabelsi)                                                    | 541  | FLG_BERBERE, SDN; _Iberia_                             |
| II.18     | Haiti and Global Africa (Smith)                                                                                                                  | 555  | _Haiti_                                                |
| II.19     | Maroonism and Resistance in the Afro-Columban Pacific (Díaz Díaz)                                                                                | 567  | _Colombian Pacific_                                    |
| II.20     | African Brazil: Geographies, Cartographies and Invisibilities (Sanzio Araújo dos Anjos)                                                          | 579  | _Brazil_                                               |
| II.21     | Comparative Perspectives of Abolition in the Americas and Africa (Araújo)                                                                        | 595  | _Americas_                                             |
| II.22     | Muslims' Resistance in the Americas (Diouf)                                                                                                      | 609  | _Americas_                                             |
| II.23     | Lady of the Rosary, Mameto Kalunga: Black Brotherhoods and Devotions in the Luso-African Atlantic (Reginaldo)                                    | 617  | AGO; _Brazil_                                          |
| II.24     | African Nations in Afro-Brazilian Religions (Parés)                                                                                              | 633  | PPL_YORUBA, PPL_FON, PPL_EWE, PPL_KONGO, AGO; _Brazil_ |
| II.25     | The Invisible Linguistic Ties Between Africa and the Other Side (Anselin)                                                                        | 645  | _Caribbean, Americas_                                  |
| II.26     | The Presence of African Languages in Latin America (Petter)                                                                                      | 655  | FLG_BANTU, FLG_NIGERCONGO, FLG_CREOLE; _Latin America_ |
| II.27     | African Oral Traditions in Brazil (Queiroz)                                                                                                      | 671  | _Brazil_                                               |
| II.28     | Slavery and Gender in the Americas and Africa (Candido)                                                                                          | 687  | _Americas_                                             |
| II.29     | The Origins of African Foodways in the Americas (Carney)                                                                                         | 703  | _Americas_                                             |
| II.30     | Ceramics, Metallurgy and Quilombos (Symanski, Gomes)                                                                                             | 723  | _Brazil_                                               |
| II.31     | Africans in the Diaspora and the Experience of Navigation (Rodrigues)                                                                            | 749  | _Atlantic_                                             |
| II.32     | Returnee Africans of the Indian Ocean: The Bombay Africans (Pereira)                                                                             | 765  | _India (Bombay)_                                       |
| II.33     | African Diaspora, Sierra Leone and Protestant Christianity, c. 1780-1860 (Schwarz)                                                               | 777  | SLE                                                    |
| II.34     | The Krios People of Sierra Leone: A Rooted Errance (Kandé)                                                                                       | 789  | SLE, PPL_KRIO, FLG_CREOLE                              |
| II.35     | Agudás - the 'Brazilians' of Benin (Guran)                                                                                                       | 801  | BEN; _Brazil_                                          |
| II.36     | Back to Africa: The Return of Slaves Freed in Brazil (Lima e Souza)                                                                              | 815  | BEN; _Brazil_                                          |
| III intro | Life Stories and Freedom Narratives of Global Africa (Lovejoy)                                                                                   | 829  | —                                                      |
| III.1     | Children in the Indian Ocean (Alpers)                                                                                                            | 841  | _Indian Ocean_                                         |
| III.2     | Juan Correa, a Baroque Painter of African Descent (Velázquez)                                                                                    | 849  | _New Spain (Mexico)_                                   |
| III.3     | Biographies of Africans in Diaspora (Rosa Bezerra)                                                                                               | 855  | _Atlantic_                                             |
| III.4     | Joseph Bologne de Saint-Georges, 1745-1799 (Crosby-Arnold)                                                                                       | 867  | _Guadeloupe, France_                                   |
| III.5     | Notices for Fugitive Slaves in the Atlantic World (Le Glaunec)                                                                                   | 885  | _Atlantic_                                             |
| III.6     | 'I am not a Slave': Liberated Africans in 19th-century Rio de Janeiro (Carvalho Cavalheiro)                                                      | 903  | _Brazil_                                               |
| III.7     | Biography, History, and Diaspora: The Bight of Benin and Bahia (Mann, Castillo)                                                                  | 913  | BEN, NGA; _Brazil (Bahia)_                             |
| III.8     | Dona Ana Joaquina dos Santos Silva: A Woman Merchant of Luanda (Oliveira)                                                                        | 925  | AGO                                                    |
| III.9     | Testimonies of Slavery & Freedom: North American Slave Narratives (Mitchell)                                                                     | 937  | _United States_                                        |
| III.10    | Osifekunde of Ijebu (Yorubaland) (Ojo)                                                                                                           | 945  | NGA, PPL_YORUBA                                        |
| III.11    | Nadir Agha: A Black Eunuch from Abyssinia to the Ottoman Palace (Özdemir)                                                                        | 971  | ETH; _Ottoman Empire_                                  |
| III.12    | Nicholas Said of Borno (Salau)                                                                                                                   | 981  | NGA, PPL_KANURI                                        |
| III.13    | The Interesting Narrative of Gustavus Vassa (Olaudah Equiano) (Unigwe)                                                                           | 991  | NGA, PPL_IGBO                                          |
| III.14    | Fragments of the Life History of Fuseng-Be: A Temne Woman Sold in Freetown (Schwarz)                                                             | 999  | SLE, PPL_TEMNE                                         |
| III.15    | From Captives to Heroes: Liberated Africans in Calabar, 1850-1920 (Imbua)                                                                        | 1009 | NGA, PPL_EFIK                                          |
| III.16    | The Whitney Plantation (Habitation Haydel), Louisiana (Seck)                                                                                     | 1019 | _Louisiana_                                            |
| III.17    | Catherine Mulgrave-Zimmermann (Warner-Lewis)                                                                                                     | 1037 | _Trinidad, Caribbean_                                  |
| III.18    | Slavery and Freedom Narrative of Mahommah Gardo Baquaqua (Véras)                                                                                 | 1049 | _Brazil, Atlantic_                                     |

Strongest for the corpus:

- II.24 (p. 633), African Nations in Afro-Brazilian Religions: the Nagô, Jeje, Mina, Angola and Congo labels as diaspora ethnonyms, their African referents and what they kept.
- I.4 (p. 77), "What's in a Name?": naming Afrodescendants in Spanish-speaking Latin America and the Caribbean.
- II.26 (p. 655) with II.25 (p. 645): African languages in Latin America and linguistic survivals, for creole and loanword fiches.
- II.9 (p. 401), Gullah Geechee, and II.34 (p. 789), Krios of Sierra Leone: creole identities and how their names arose (PPL_GULLAH, PPL_KRIO, FLG_CREOLE).
- II.35 (p. 801) Agudás, plus III.7 (p. 913) Bight of Benin and Bahia: return-migrant names and the African-Brazilian naming loop.
- Also II.5 (p. 347), Makoa in Madagascar: an ethnonym given to enslaved Africans (Madagascar).

### GHA XI — Global Africa Today (2025)

Editor Hilary Beckles (sections coordinated by Coquery-Vidrovitch, Chenntouf, Rajaonah). The contemporary and 20th-century volume: identity, creolization, pan-Africanism, Africa-diaspora relations; useful for how Africans and Afrodescendants name themselves now, and for Madagascar and Comoros today.

| Ch.       | Title                                                                                     | p.   | AFRIK entities         |
| --------- | ----------------------------------------------------------------------------------------- | ---- | ---------------------- |
| Intro     | General Introduction (Holl)                                                               | XXI  | —                      |
| Intro     | Global Africa Today: An Introduction (Beckles)                                            | XLV  | —                      |
| I intro   | Global Africa Today (Coquery-Vidrovitch)                                                  | 3    | —                      |
| I.1       | The Cultural Foundations of Global Africa (Diagne)                                        | 15   | —                      |
| I.2       | African History and Memory (Jewsiewicki Koss)                                             | 27   | —                      |
| I.3       | The Creative Centres of African Thought (Kipré)                                           | 33   | —                      |
| I.4       | African Cultures Under the Ordeal of the Atlantic Slave Trade (Thioub)                    | 47   | _Atlantic_             |
| I.5       | A Global Africa Seen Through the Memory of Slavery (Cottias)                              | 59   | _French Caribbean_     |
| I.6       | Colonialism (Cooper)                                                                      | 75   | —                      |
| I.7       | Rethinking the History of Poverty in Africa (Bonnecase)                                   | 81   | —                      |
| I.8       | Food Insecurity in the Sahel: the Case of Niger (Gado)                                    | 87   | NER                    |
| I.9       | Feminism in Africa (Sow)                                                                  | 101  | —                      |
| I.10      | The Woman's Africa in Her Own Words (Sutherland-Addy)                                     | 119  | —                      |
| I.11      | Christianity and Black Churches (MacGaffey)                                               | 125  | —                      |
| I.12      | New Religions, New Diasporas (Morakinyo)                                                  | 131  | —                      |
| I.13      | Black Imperialism: A Magic Conception of Social and Political Facts (Tonda)               | 139  | —                      |
| I.14      | From Terroir and Ethnicity to the Idea of Territorial State (Fall)                        | 149  | —                      |
| I.15      | Nationalism/Nationalities (Kipré)                                                         | 157  | —                      |
| I.16      | Traditional Institutions and Birth of the State in Nigeria, 20th C. (Martineau)           | 165  | NGA                    |
| I.17      | The Formation of the State and the Conflicting Genesis of a Nation: Kenya (Charton)       | 183  | KEN                    |
| I.18      | Space, Insularity and Borders: The Case of Madagascar (Rakotondrabe)                      | 191  | MDG                    |
| I.19      | The Concepts of Creolization/Hybridation/Métissage (Thomas)                               | 199  | FLG_CREOLE             |
| I.20      | Afro-Caribbean Seamen in the Black Atlantic World 1880-1950 (Cobley)                      | 205  | _Caribbean_            |
| I.21      | Walter Rodney, Sylvia Wynter and Africana Studies in the Anglophone Caribbean (Kamugisha) | 223  | _Anglophone Caribbean_ |
| I.22      | Identity and 'Indigenous Knowledge' in the Sixth Region of Africa (Cobley)                | 241  | _Caribbean_            |
| I.23      | Changing Consciousness of Africa in Caribbean Pan-Africanism (Wariboko)                   | 259  | _Caribbean_            |
| I.24      | New Economic Indicators: Globalization in African Words (Amin)                            | 281  | —                      |
| I.25      | Global African Modernisms (Russell)                                                       | 291  | —                      |
| I.26      | Identity: Developing One's Own Image and Naming Oneself (Lauer)                           | 313  | —                      |
| II intro  | Africa in the Contemporary World (Chenntouf)                                              | 329  | —                      |
| II.1      | Changes and Continuity of Pan-Africanism (Boukari-Yabara)                                 | 339  | —                      |
| II.2      | The Pan-African Movement for Transnational Liberation and Human Rights (Zuberi)           | 351  | —                      |
| II.3      | Social Movements Claiming an African Identity (Silvério)                                  | 363  | _Brazil_               |
| II.4      | Contemporary Views of Africanness (Boukari-Yabara)                                        | 379  | —                      |
| II.5      | Relationships between Africa and the Diasporas (Bonacci)                                  | 393  | _Global diaspora_      |
| II.6      | Entering into History (Chenntouf)                                                         | 409  | —                      |
| II.7      | Africa in the Media (Jackson, Mandé)                                                      | 421  | —                      |
| II.8      | North Africa: from Classical Orientalism to Neo-Orientalism (Chadili)                     | 433  | _North Africa_         |
| II.9      | Africanism (Yorke)                                                                        | 445  | —                      |
| II.10     | Why Research on the Global Black Middle Class is Essential (Marsh)                        | 459  | _United States_        |
| II.11     | Islam in Africa (Diagne)                                                                  | 469  | —                      |
| II.12     | Europe in Algerian History Textbooks (Chenntouf)                                          | 479  | DZA                    |
| II.13     | Africa's Place in School Curricula in Brazil (Silvério, Gomes)                            | 491  | _Brazil_               |
| II.14     | Global Africanity and Education (Bentabet)                                                | 507  | —                      |
| II.15     | 'Marxist-Leninist' States in Tropical Africa (Balezin)                                    | 515  | —                      |
| II.16     | The Marxist Experience: The Case of the Congo and Angola (Mabeko-Tali)                    | 525  | COG, AGO               |
| II.17     | Political Coups and One-Party Regimes (Jackson, Mandé)                                    | 533  | —                      |
| II.18     | The Role of Moscow in the Decolonization of Namibia and the End of Apartheid (Shubin)     | 543  | NAM, ZAF               |
| II.19     | Globalization (Bantenga)                                                                  | 557  | —                      |
| II.20     | New World Geopolitics (Jackson)                                                           | 571  | —                      |
| II.21     | Towards a Multipolar World (Jackson)                                                      | 591  | —                      |
| II.22     | Africa's Relations With Emerging Countries: China (Li)                                    | 607  | _China_                |
| II.23     | African Immigrants and Citizens in the United States (Showers)                            | 621  | _United States_        |
| II.24     | Africa's Relations With Europe (Gahama)                                                   | 645  | —                      |
| II.25     | Legacy of Apartheid (Harries)                                                             | 665  | ZAF                    |
| II.26     | Africanity and Globalization (Dozon)                                                      | 671  | —                      |
| II.27     | What Africa Can Contribute to the World (Metz)                                            | 681  | —                      |
| II.28     | The Role of African Intellectuals and Artists (Kandjimbo)                                 | 697  | —                      |
| II.29     | Issues Associated With the Dissemination of African Thought (Kipré)                       | 715  | —                      |
| III intro | Africa at the Turn of the Third Millennium (Rajaonah)                                     | 733  | —                      |
| III.1     | Population Growth in Africa (Zoungrana, Klissou)                                          | 755  | —                      |
| III.2     | Epidemics in Africa at the Turn of the 21st Century (Darnycka Bélizaire, Zombre)          | 765  | —                      |
| III.3     | Kinshasa: An African Metropolis and a Singular City (Tshimanga)                           | 777  | COD                    |
| III.4     | Mid-Sized Cities in the Maghreb (Safar Zitoun)                                            | 793  | DZA, MAR, TUN          |
| III.5     | Age and Generation in the Comoros: Initiation, Solidarity and Change (Blanchy)            | 805  | COM, PPL_COMORIEN      |
| III.6     | Between Generation and Nation: Cultures and the Youth in Mozambique (Nativel)             | 813  | MOZ                    |
| III.7     | Trajectories of African Graduates in Post-Soviet Russia (Smirnova)                        | 823  | _Russia_               |
| III.8     | The Social Rise and Power of Generations of Military Elites in Madagascar (Rakotondrabe)  | 833  | MDG                    |
| III.9     | Women's Education in West Africa Since 1990 (Adeboye)                                     | 841  | —                      |
| III.10    | Towards Visibility and Equal Opportunities for Women (Coquery-Vidrovitch)                 | 857  | —                      |
| III.11    | The Dynamics of Senegalese Female Migrations (Cissé)                                      | 869  | SEN                    |
| III.12    | African Regional Integration, Globalization and Dependency (Jackson)                      | 879  | —                      |
| III.13    | Africa-BRICS (Korendyasov)                                                                | 897  | —                      |
| III.14    | Africa in the Face of Land Rush Challenges (Dembélé)                                      | 913  | —                      |
| III.15    | Migration and Development: African Perspectives (Mandé)                                   | 929  | —                      |
| III.16    | Africa as the New Financial Hub (Gumede)                                                  | 941  | —                      |
| III.17    | The Age of Salafism in West African Societies (Sounaye)                                   | 949  | _West Africa_          |
| III.18    | New Christianities in sub-Saharan Africa (MacGaffey)                                      | 957  | —                      |
| III.19    | Rap and Hip Hop in African Popular Music (Omojola)                                        | 965  | —                      |
| III.20    | Historicizing Contemporary African Cinema (Sanogo)                                        | 979  | —                      |
| III.21    | Reading Leso: African Fabric as a Gateway to the World (Mwangola)                         | 1001 | _East Africa_          |
| III.22    | Contemporary Circulation of African Art in Cuba and Haiti (Wood)                          | 1017 | _Cuba, Haiti_          |

Strongest for the corpus:

- I.26 (p. 313), "Identity: Developing One's Own Image and Naming Oneself": the self-name doctrine, in a UNESCO register.
- I.19 (p. 199), Creolization/Hybridation/Métissage: the concepts behind FLG_CREOLE and the Caribbean/Gullah/Krio fiches.
- I.14 (p. 149), From Terroir and Ethnicity to the Territorial State: how ethnic labels met the state.
- I.18 (p. 191) and III.8 (p. 833): Madagascar (insularity and borders; military elites); III.5 (p. 805): Comoros.
- II.3 (p. 363) and I.22-I.23 (pp. 241, 259): social movements claiming an African identity, Brazil and the Caribbean.

## Histoire de l'humanité and the short documents

_Method note for this part:_ Method note. Chapter titles and printed page numbers are taken from each volume's own "Sommaire". Where a PDF page is given it was checked against the extracted text. Printed-to-PDF offsets are not constant inside the large volumes (colour plates and maps are inserted), so each table gives the printed page first and the PDF page in parentheses where verified. Entities are matched by keyword counts in the chapter text (country names, ethnonyms) and are indicative, not an index; only IDs that exist in `dataset/source/afrik/` are cited. `—` means no corpus entity (for example the Caribbean and Brazil, which are outside the 54 countries).

### `HUM-01-fr` — Histoire de l'humanité I: De la préhistoire aux débuts de la civilisation (2000, 1611 p.)

Scope: prehistory to the first states; Africa appears only as archaeology (Palaeolithic to food production), with no ethnonym, language-family or naming material. The "Sommaire" is at PDF pp. 4–6; chapter openers sit at printed page + 10 to + 14.

| Part/Ch.          | Title                                                                                                                    | p.             | AFRIK entities                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------- |
| Part 1, A, ch. 1  | L'anthropogenèse : une vision globale (Coppens, Geraads)                                                                 | 85 (PDF ≈99)   | ETH, KEN, TZA (hominid sites)                                       |
| Part 1, A, ch. 3  | Le paléolithique inférieur et les premiers habitats en Afrique (Chavaillon)                                              | 117 (PDF 131)  | ETH, KEN, TZA, DJI, DZA, MAR, ZAF                                   |
| Part 1, B, ch. 11 | L'Afrique (Wendorf, Close, Schild)                                                                                       | 300 (PDF 313)  | EGY, SDN, ETH, DZA, MAR, TUN, ZAF, KEN, TZA, ZWE, ZMB, MWI, NAM     |
| Part 1, C, ch. 20 | L'Afrique (J. Desmond Clark)                                                                                             | 478 (PDF 490)  | EGY, SDN, ETH, KEN, NAM, ZWE, ZMB (Sahara and Late Stone Age sites) |
| Part 2, ch. 37    | La domestication des plantes : une vision globale (Harlan)                                                               | 913 (PDF ≈924) | — (origins of African crops; no single country)                     |
| Part 2, ch. 39    | La période finale de la préhistoire en Égypte (Krzyzaniak)                                                               | 964 (PDF 974)  | EGY                                                                 |
| Part 2, ch. 40    | L'Afrique (sauf l'Égypte) depuis les débuts de la production de nourriture jusqu'à il y a environ 5 000 ans (Phillipson) | 993 (PDF 1003) | SDN, ETH, NER, MLI, TCD, GHA, NGA, KEN                              |

Use for the corpus: deep-time background only (Sahara as a green Holocene landscape, the Nile Valley, the origin of African farming). Ch. 40 and ch. 20 contain no occurrence of "bantou", "nilo-saharien", "khoïsan" or "Niger-Congo", so they cannot source a family or people fiche; use them for country-level "prehistory" context, not for name origins.

### `HUM-04-fr` — Histoire de l'humanité IV: 600-1492 (2008, 1690 p.)

Scope: the richest of the set for the corpus. Part V "Le monde africain" (pp. 1143–1296) is a full regional section, and the Islamic-world chapters cover North Africa and the Sahel. The "Sommaire" is at PDF pp. 4–6, the chronological table at printed p. 1473 and the index at p. 1550. Printed-to-PDF offset: +16 inside Part V (ch. 32–36), about +19/+20 for ch. 14–20, +24 for ch. 3.

| Part/Ch.          | Title                                                                                                                           | p.                  | AFRIK entities                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B, ch. 3.6        | L'État et le droit — L'Afrique (Ndaywel è Nziem)                                                                                | 141 (PDF 165)       | — (continental overview)                                                                                                                                                                                                                                        |
| C-II, ch. 14      | L'expansion de l'influence européenne (Martín Rodríguez); the passage on expeditions along the African coasts is at PDF 595–599 | 562 (PDF 582)       | — (Atlantic coast, general)                                                                                                                                                                                                                                     |
| C-III, ch. 17.5.1 | Le Maghreb, l'Espagne et la Sicile (Shanwan)                                                                                    | 674 (PDF 693)       | DZA, MAR, TUN, FLG_BERBERE, FLG_AFROASIATIQUE                                                                                                                                                                                                                   |
| C-III, ch. 17.5.2 | Le Soudan et les pays subsahariens (Niane)                                                                                      | 680 (PDF 699)       | MLI, GHA, MRT, EGY, SDN, PPL_SONINKE, PPL_MALINKE, PPL_MOSSI, PPL_BAMBARA, FLG_MANDE                                                                                                                                                                            |
| C-III, ch. 20.1   | L'Égypte (Miṣr) (Sayyid)                                                                                                        | 785 (PDF 804)       | EGY, PPL_COPTES                                                                                                                                                                                                                                                 |
| C-III, ch. 20.2   | Le Maghreb (Al-Maghrib) (Benaboud)                                                                                              | 800 (PDF 819)       | MAR, DZA, TUN, FLG_BERBERE, PPL_AMAZIGH_MACRO, PPL_ZENATA                                                                                                                                                                                                       |
| C-V, intro        | Le monde africain — Introduction (Cissoko)                                                                                      | 1145                | —                                                                                                                                                                                                                                                               |
| C-V, ch. 32.1     | L'Afrique de l'Ouest — Les peuples, with "Les peuples blancs" and "Les peuples noirs" (Cissoko)                                 | 1152 (PDF 1168)     | MLI, NER, GHA, NGA, SEN, GIN, BEN, TCD, FLG_MANDE, FLG_SONGHAY, FLG_ATLANTIQUE, FLG_KWA, FLG_BENOUECONGO, PPL_SONINKE, PPL_MALINKE, PPL_SONGHAY_MACRO, PPL_YORUBA, PPL_AKAN, PPL_EDO, PPL_FON, PPL_IGBO, PPL_MOSSI, PPL_TUAREG, PPL_WOLOF, PPL_SERER, PPL_DIOLA |
| C-V, ch. 32.2     | L'Afrique de l'Ouest — L'économie (Cissoko)                                                                                     | 1158                | MLI, GHA, NER, NGA                                                                                                                                                                                                                                              |
| C-V, ch. 32.3     | L'Afrique de l'Ouest — Les structures sociales et politiques (Cissoko)                                                          | 1168                | MLI, GHA, NGA, BEN, PPL_YORUBA, PPL_EDO, PPL_FON                                                                                                                                                                                                                |
| C-V, ch. 32.4.1   | Les religions africaines traditionnelles (Akinjogbin)                                                                           | 1176 (PDF 1192)     | NGA, BEN, PPL_YORUBA                                                                                                                                                                                                                                            |
| C-V, ch. 32.4.2   | L'islam et le christianisme (Cissoko)                                                                                           | 1182                | MLI, SEN, PPL_SONGHAY_MACRO                                                                                                                                                                                                                                     |
| C-V, ch. 32.5     | Les arts et les sciences (Akinjogbin)                                                                                           | 1185 (PDF 1201)     | NGA, BEN, PPL_YORUBA, PPL_EDO                                                                                                                                                                                                                                   |
| C-V, ch. 33       | La Nubie et le Soudan nilotique (Ḥasan)                                                                                         | 1193 (PDF 1209)     | SDN, EGY, PPL_NUBIENS, PPL_BEJA                                                                                                                                                                                                                                 |
| C-V, ch. 34       | L'Éthiopie (Van Donzel)                                                                                                         | 1216 (PDF 1232)     | ETH, ERI, EGY, PPL_AMHARA, PPL_TIGRAY, PPL_AGAW, PPL_BEJA, FLG_SEMITIQUE, FLG_COUCHITIQUE                                                                                                                                                                       |
| C-V, ch. 35.1     | La côte orientale et les îles de l'océan Indien — L'environnement et les techniques (Alpers)                                    | 1238 (PDF 1254)     | KEN, TZA, MOZ, SOM                                                                                                                                                                                                                                              |
| C-V, ch. 35.2     | Le développement commercial et urbain (Alpers)                                                                                  | 1244 (PDF 1260)     | KEN, TZA, MOZ, PPL_SWAHILI                                                                                                                                                                                                                                      |
| C-V, ch. 35.3     | Les cultures arabo-musulmanes et locales sur la côte orientale de l'Afrique et dans les îles de l'océan Indien (Matveyev)       | 1250 (PDF 1266)     | KEN, TZA, COM, PPL_SWAHILI                                                                                                                                                                                                                                      |
| C-V, ch. 35.4     | **Le brassage culturel à Madagascar et dans les autres îles** (Rafolo Andrianaivoarivony)                                       | **1256 (PDF 1272)** | **MDG, COM, MUS, PPL_MERINA, PPL_BETSILEO, PPL_SAKALAVA, PPL_ANTANDROY, PPL_COMORIEN, FLG_AUSTRONESIENNE, FLG_BANTU**                                                                                                                                           |
| C-V, ch. 35.5     | L'importance internationale de la région (Alpers)                                                                               | 1267 (PDF 1283)     | KEN, TZA, COM, PPL_SWAHILI                                                                                                                                                                                                                                      |
| C-V, ch. 36       | L'Afrique centrale et méridionale — "Les grandes migrations" at p. 1276 (Ndaywel è Nziem)                                       | 1274 (PDF 1290)     | COD, ZWE, RWA, BDI, FLG_BANTU, PPL_KONGO, PPL_LUBA, PPL_LUNDA, PPL_SHONA, PPL_KHOIKHOI                                                                                                                                                                          |

Madagascar chapter (35.4), printed pp. 1256–1265 (PDF 1272–1282): it describes the peopling of Madagascar in the mid-first millennium CE and of the Comoros in the 8th–9th centuries, by sailors and merchants from the Indonesian archipelago, South-East Asia, southern India, the Persian Gulf and the Red Sea, and a mixing of Austronesian, West African (Bantu) and, to a lesser degree, Arab-Islamic cultures. Sub-headings include "Les modes de vie et les techniques" (p. 1260), "L'évolution des formes de gouvernement" (p. 1264) and "La religion et les croyances" (p. 1264); a map of Comoros and northern Madagascar sites is at PDF 1275. The Comoros are named about thirty times in the chapter. The Mascarenes, Seychelles and Réunion are described as settled only from the 17th century.

Use for the corpus: the best single UNESCO source for MDG and COM peopling and name layers (Austronesian, Bantu, Arab), for the Mali, Ghana and Songhay historical vocabulary (ch. 32 and 17.5.2), for Nubia and Ethiopia, and for the Bantu-migration chapter (36). Pair with the corpus's Austronesian and Bantu family fiches. The volume is an editorial synthesis, so cite the sub-chapter author and keep each claim at its register (interpretation, not settled fact).

### `HUM-04-en` — History of humanity IV: From the seventh to the sixteenth century (2003, English, 1848 p.)

Scope: the same volume as 158431fre.pdf, in English, with the same chapters, authors and Part V "The African Continent". Differences are limited to pagination. The English contents list is printed at PDF pp. 2–16 with the book's own page numbers: Part V "The African Continent" 1116; ch. 32 "West Africa" 1122; ch. 33 "Nubia and the Nilotic Sudan" 1156; ch. 34 "Ethiopia" 1176; ch. 35 "The East Coast and the Indian Ocean Islands" 1195; 35.4 "Mixed Cultures of Madagascar and the Other Islands" 1210; ch. 36 "Central and Southern Africa" 1225; ch. 20 "North and North-East Africa" 770; ch. 17 "Expansion of Islam and Aspects of Diversity in Asia, Africa and Europe" 644, with "The Sudan and Countries South of the Sahara" at 685. The PDF is a chapter-split file whose page index is not a constant offset from those numbers: ch. 32 opens at PDF 1188, ch. 33 at PDF 1222, ch. 34 at PDF 1243, ch. 35 at PDF 1262, 35.4 at PDF 1277 and ch. 36 at PDF 1292. The same entities as in the French table apply.

Use for the corpus: the French pagination above; this edition only where an English spelling or diacritic of a name is the point.

### `HUM-05-fr` — Histoire de l'humanité V: 1492-1789 (2008, 1299 p.)

Scope: the early modern world. Africa is covered in ch. 27 with a regional sub-section on political structures; the Atlantic slave trade runs through ch. 3, 6, 26 and 27, and the Caribbean is ch. 26.2. The "Sommaire" is at PDF pp. 4–5; the printed-to-PDF offset is +13 in the late chapters and +14 in 6.3; the chronological table is at p. 1151 and the index at p. 1215. The list of maps (PDF 7) includes "La traite transatlantique des esclaves" (map 7), "L'Afrique subsaharienne au XVIe siècle : les principaux peuples et groupes ethniques" (map 32) and "Groupes ethniques de Madagascar et emplacement des îles voisines" (map 37).

| Part/Ch.                                                                                                                                                | Title                                                                                                                                                                                                                                         | p.                  | AFRIK entities                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| B, ch. 1                                                                                                                                                | La population et l'environnement (Dupâquier); slave-trade demography                                                                                                                                                                          | 15 (PDF 29)         | —                                                                                                                            |
| B, ch. 3                                                                                                                                                | Le changement économique et social (Habib); slave-trade passages at pp. 62–86                                                                                                                                                                 | 55 (PDF 69)         | —                                                                                                                            |
| B, ch. 5                                                                                                                                                | Les contacts et les échanges culturels (Céspedes del Castillo)                                                                                                                                                                                | 115 (PDF 129)       | —                                                                                                                            |
| B, ch. 6.3                                                                                                                                              | Les Européens en Afrique (Boulègue)                                                                                                                                                                                                           | 158 (PDF 172)       | COD, AGO, PPL_KONGO                                                                                                          |
| C, ch. 17.3                                                                                                                                             | L'Égypte ottomane (1517-1798 apr. J.-C.)                                                                                                                                                                                                      | 588 (PDF 601)       | EGY                                                                                                                          |
| C, ch. 17.4                                                                                                                                             | L'Afrique du Nord (Temimi)                                                                                                                                                                                                                    | 608 (PDF 621)       | DZA, MAR, TUN, LBY                                                                                                           |
| C, ch. 26.1.3                                                                                                                                           | Le Brésil (Mello e Souza); heavy slavery content                                                                                                                                                                                              | 984 (PDF 997)       | — (diaspora; origin groups PPL_YORUBA, PPL_KONGO, FLG_BANTU)                                                                 |
| C, ch. 26.2                                                                                                                                             | Les Caraïbes (Bryan), including "La société et l'économie antillaises" at p. 1024                                                                                                                                                             | 1007 (PDF 1020)     | — (diaspora; FLG_CREOLE)                                                                                                     |
| C, ch. 27.1                                                                                                                                             | L'économie et la société en Afrique subsaharienne (Iroko), including "La traite négrière" at p. 1050                                                                                                                                          | 1032 (PDF 1045)     | NGA, COD, ETH, SDN, PPL_YORUBA, PPL_KONGO, PPL_FON, PPL_EDO                                                                  |
| C, ch. 27.2                                                                                                                                             | Les structures et les courants politiques (Adediran, Ndaywel è Nziem, Itandala, Bhila; Akinjogbin, Soumonni coord.)                                                                                                                           | 1057 (PDF 1070)     | by sub-section below                                                                                                         |
| 27.2, L'Afrique occidentale                                                                                                                             | (sub-section)                                                                                                                                                                                                                                 | 1058                | GHA, NGA, BEN, MLI, FLG_KWA, FLG_MANDE, FLG_SONGHAY, PPL_ASANTE, PPL_FON, PPL_YORUBA, PPL_IGBO, PPL_MOSSI, PPL_SONGHAY_MACRO |
| 27.2, L'Afrique équatoriale                                                                                                                             | (sub-section)                                                                                                                                                                                                                                 | 1065                | COD, AGO, COG, GAB, PPL_KONGO, PPL_LUBA, PPL_LUNDA, FLG_BANTU                                                                |
| 27.2, L'Afrique orientale (with "Les États musulmans et leurs relations avec l'Éthiopie" 1076, "La région interlacustre" 1079, "La côte swahilie" 1082) | (sub-section)                                                                                                                                                                                                                                 | 1073                | ETH, SOM, KEN, TZA, UGA, RWA, BDI, PPL_OROMO, PPL_SOMALI, PPL_AMHARA, PPL_SWAHILI                                            |
| 27.2, **Madagascar et les îles environnantes** (with "La Réunion")                                                                                      | (sub-section)                                                                                                                                                                                                                                 | **1084 (PDF 1097)** | **MDG, MUS, PPL_MERINA**                                                                                                     |
| 27.2, L'Afrique australe (Shonas, Ndébélés, Zoulous, "Les sociétés sud-africaines")                                                                     | (sub-section)                                                                                                                                                                                                                                 | 1086                | ZWE, ZAF, PPL_SHONA, PPL_NDEBELE, PPL_ZULU, FLG_BANTU                                                                        |
| C, ch. 27.3                                                                                                                                             | La culture (Memel-Fotê), including "La formation de nouvelles identités" p. 1113, "L'Église catholique nationale kongolaise" p. 1114, "Le dynamisme des identités religieuses autochtones" p. 1117, "Cas du judaïsme des Beta Israël" p. 1119 | 1103 (PDF 1116)     | COD, AGO, ETH, SDN, PPL_KONGO, PPL_AGAW, PPL_AMHARA, PPL_WOLOF, PPL_BAMBARA                                                  |

Madagascar / Indian Ocean (vol. V): the sub-section "Madagascar et les îles environnantes" in 27.2 is at printed p. 1084 (PDF 1097); Madagascar also appears at pp. 1085, 1100, 1101, 1105 and 1109 (27.2–27.3). Map 37 shows Malagasy ethnic groups, and illustration 9 is Flacourt's 1658 plate of Madagascar fauna.

Use for the corpus: the Atlantic slave-trade framing (ch. 27.1 "La traite négrière", ch. 3, ch. 26.2 for the Caribbean); the political vocabulary of the Asante, Dahomey (Fon), Kongo, Luba, Lunda, Oromo and Zulu states; and the identity-formation material in 27.3. For a name-origin angle, 27.3 treats identities formed under colonial and religious pressure (the Kongo national Church, the Beta Israel), which fits the "who named whom" question.

### `HUM-06-fr` — Histoire de l'humanité VI: 1789-1914 (2008, 1610 p.)

Scope: the long nineteenth century. Africa is split between a thematic strand (ch. 2.1, 8.5, 9.4, 9.8) and a full regional section (ch. 14.2 and 15). The "Sommaire" is at PDF pp. 6–8; the printed-to-PDF offset is about +27 in ch. 14–15 and +28/+29 in ch. 8–9; the chronological table is at p. 1443 and the index at p. 1525.

| Part/Ch.    | Title                                                                                                                                                                                           | p.                  | AFRIK entities                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| B, ch. 2.1  | L'Europe, l'Amérique et l'Afrique (Blomme); slave trade, abolition, Congo, South Africa                                                                                                         | 123 (PDF 152)       | ZAF, COD, SLE, LBR, EGY, DZA, MAR, SDN                                                                                            |
| B, ch. 8.2  | L'Amérique latine et les Caraïbes (Collard); culture                                                                                                                                            | 555 (PDF 584)       | —                                                                                                                                 |
| B, ch. 8.5  | L'Afrique subsaharienne (Somé); culture and arts                                                                                                                                                | 641 (PDF 669)       | GHA, BEN, BFA, COD, SLE, MDG                                                                                                      |
| B, ch. 9.4  | L'Afrique profonde (religion)                                                                                                                                                                   | 676 (PDF 705)       | — (continental)                                                                                                                   |
| B, ch. 9.8  | L'islam africain (Diallo)                                                                                                                                                                       | 706 (PDF 735)       | MLI, SEN, GIN, PPL_HALPULAAR, PPL_FULA, PPL_SONINKE, PPL_SONGHAY_MACRO, PPL_HAUSA                                                 |
| C, ch. 12.1 | L'Amérique latine et les Caraïbes — Vue d'ensemble (Carrera Damas)                                                                                                                              | 956 (PDF 983)       | — (diaspora; slavery)                                                                                                             |
| C, ch. 12.3 | Le Brésil (Iglesias)                                                                                                                                                                            | 1003 (PDF 1030)     | — (diaspora; slavery and abolition)                                                                                               |
| C, ch. 14.1 | Le Moyen-Orient, la Turquie et la Perse (Rafeq); Egypt content                                                                                                                                  | 1185 (PDF 1212)     | EGY                                                                                                                               |
| C, ch. 14.2 | Le Maghreb (Guellouz)                                                                                                                                                                           | 1207 (PDF 1234)     | DZA, MAR, TUN, LBY, MRT                                                                                                           |
| C, ch. 15.1 | L'Afrique sous domination française: 15.1.1 "L'évolution historique avant le choc colonial" p. 1234; 15.1.2 "Le choc colonial" p. 1252; 15.1.3 "La culture, la science et la technique" p. 1266 | 1232 (PDF 1259)     | SEN, MLI, GIN, CIV, BFA, NER, BEN, TCD, GAB, COG, CMR, FLG_MANDE, PPL_BAMBARA, PPL_FON, PPL_FULA, PPL_WOLOF, PPL_MOSSI, PPL_DOGON |
| C, ch. 15.2 | L'Afrique occidentale et centrale sous domination britannique et allemande (Agbodeka)                                                                                                           | 1285 (PDF 1312)     | GHA, NGA, SLE, BEN, NER, TGO, CMR, PPL_ASANTE, PPL_IGBO, PPL_YORUBA                                                               |
| C, ch. 15.3 | L'intégration de l'Afrique centrale et orientale dans le système capitaliste international (Mworoha)                                                                                            | 1304 (PDF 1331)     | COD, RWA, BDI                                                                                                                     |
| C, ch. 15.4 | L'Afrique orientale (Itandala)                                                                                                                                                                  | 1321 (PDF 1348)     | ETH, SDN, SOM, KEN, TZA, UGA, MWI, PPL_SOMALI, PPL_AMHARA, PPL_TIGRAY, PPL_SWAHILI                                                |
| C, ch. 15.5 | Les pays de l'Afrique d'expression portugaise (Madeira Santos)                                                                                                                                  | 1338 (PDF 1365)     | AGO, MOZ, GNB, CPV, STP                                                                                                           |
| C, ch. 15.6 | L'Afrique australe (Bhebe)                                                                                                                                                                      | 1354 (PDF 1381)     | ZAF, ZWE, ZMB, MWI, MOZ, BWA, LSO, PPL_ZULU, PPL_SHONA, PPL_NDEBELE, PPL_KHOIKHOI, FLG_BANTU                                      |
| C, ch. 15.7 | **Les pays de l'océan Indien** (Rajaonah, Wondji)                                                                                                                                               | **1375 (PDF 1402)** | **MDG, MUS, PPL_MERINA**                                                                                                          |
| C, ch. 15.8 | Conclusion (Coulibaly)                                                                                                                                                                          | 1383 (PDF 1410)     | —                                                                                                                                 |

Madagascar / Indian Ocean (vol. VI): ch. 15.7, printed pp. 1375–1383 (PDF 1402–1410), covers the 1815 Vienna treaties, Britain intercepting the slave trade from Mauritius, the 1817 Anglo-Malagasy treaty abolishing the slave trade under Radama I (1810–1828), the Mascarene plantation economy, modernisation, and the colonial conquest of Madagascar (sub-heading "La conquête et l'occupation de…" at p. 1379). The Comoros are not discussed there.

Use for the corpus: the colonial administrative geography (which entity belonged to which colonial bloc) for the "colonial names" angle, ch. 15.1–15.7 for names imposed or adopted at the colonial break, and ch. 9.8 for the Islamic vocabulary of West Africa. The 12.x Latin America chapters pair with the Caribbean slave-trade documents below.

### `DOC-histoire-diversite` — Histoire et diversité des cultures / Au carrefour des cultures (1984, 338 p.)

Scope: studies prepared for the September 1978 Dakar meeting of experts on "Nature et fonction de l'histoire en relation avec la diversité des cultures", closing the "Au carrefour des cultures" series. It is a collection of essays on the philosophy and method of history, not a reference history. The table of contents is at PDF 7–8; the printed-to-PDF offset is about −11 to −12 (printed p. 225 is at PDF 214). Only Part IV, part of Part III and the Dakar documents bear on Africa.

| Part/Ch. | Title                                                                                                                                                                                                               | p.            | AFRIK entities                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------- |
| III      | W. R. Jones, "Conflits d'interprétation : histoire et tradition, dialogue ou assimilation"                                                                                                                          | 167           | — (Black diaspora thought)                  |
| IV       | Djibril Tamsir Niane, "La reconquête de l'identité historique : « décoloniser l'histoire ou la défalsifier ? »", which discusses the adoption of the names Ghana and Mali by the former Gold Coast and French Sudan | 225 (PDF 214) | GHA, MLI, GIN, FLG_MANDE                    |
| IV       | Dan O'Meara, "Problèmes posés par la « décolonisation » de l'histoire de l'Afrique"                                                                                                                                 | 233 (PDF 221) | — (Africa in general; Dar es Salaam school) |
| IV       | Marianne Cornevin, "Histoire et pouvoir : l'exemple des Afrikaners" (the ten myths of apartheid)                                                                                                                    | 249 (PDF 237) | ZAF                                         |
| IV       | Alexis Kagame, "L'histoire et le phénomène de la colonisation" (Kinyarwanda noun classes)                                                                                                                           | 297 (PDF 285) | RWA, FLG_BANTU                              |
| IV       | Oruno D. Lara, "L'histoire et l'élaboration de l'identité culturelle" (Caribbean identities under the slave system: Arawak, Taíno, Caribs)                                                                          | 309 (PDF 297) | — (Caribbean diaspora; FLG_CREOLE)          |
| Dakar    | Mohammed Allal Sinaceur, "Problématique philosophique de l'histoire"; "Document de travail de la réunion"; list of participants                                                                                     | 329, 337, 341 | SEN (meeting held in Dakar)                 |

Use for the corpus: Niane (p. 225) is directly on the project's question: African states that took the names of historic empires at independence (Ghana, Mali), and "reconquering historical identity". Cornevin and O'Meara serve the "colonial myth" and "whose history" posture; Kagame is a primary-voice source on Bantu noun classes. The other essays (Jaspers, Dumézil, Yoshida and so on) have no corpus link.

### `DOC-traite-caraibes` — La Traite des esclaves dans les Caraïbes et en Amérique latine du XVe au XIXe siècle (1977, 11 p.)

A scanned typescript (UNESCO document CC-77/WS/11, José Luciano Franco, Havana, 20 December 1976; no text layer, read from page images). Sections: "Les débuts du commerce des esclaves africains", "Le commerce négrier du XVIe au XVIIIe siècle" (asientos, Portuguese, Dutch, English and French trading companies, the Royal African Company), the nineteenth-century clandestine trade and Cuba, and "Impact de la traite sur la société cubaine" (p. 8); sources and bibliography on pp. 10–11. It names the Wolof ("ouolofs ... gelofs") and the Mande/Mandingue as groups the Spanish crown restricted (p. 1), cites forts on the Guinea coast (Sama 1526, São Jorge da Mina) and Gorée, and states that captives came mostly from well-defined points in West Africa but also from the east, "voire de Madagascar" (p. 5), with Angolan captives still reaching Cuba in 1873 (p. 8).
AFRIK entities: SEN, GHA, AGO, MDG (one mention), PPL_WOLOF, PPL_MALINKE, FLG_MANDE, FLG_ATLANTIQUE.
Use for the corpus: a short, sourced note that early Spanish authorities already classed West African captives by ethnonym (Wolof, Mande), useful for "who named whom" on the Wolof and Mandinka fiches, and context for the Atlantic slave trade. It carries no Africa-side naming material.

### `DOC-hg-caribe-02-plan` — Historia general del Caribe, vol. II: formación de nuevas sociedades, anteproyecto de plan (1985, 7 p., Spanish draft plan)

A scanned typescript (no text layer, read from page images) by Germán Carrera Damas setting the criteria for volume II of UNESCO's General History of the Caribbean: the span 1492 to about 1650, a "history of societies" rather than of metropoles, treating the indigenous societies, "el poblamiento forzado africano" (the forced African settlement, including the emergence of autonomous African settlement, pp. 5–6), and the legal-social and legal-political systems. It is a plan, with no chapter list for Africa and no page-level content to cite.
AFRIK entities: —.
Use for the corpus: only as an editorial framing note for Caribbean diaspora items (the African contribution seen as participation in forming new societies, not only as slavery); not a source for any fiche.

---

Madagascar / Indian Ocean chapters: Vol. IV ch. 35.4 "Le brassage culturel à Madagascar et dans les autres îles", p. 1256 (PDF 1272); Vol. V ch. 27.2 sub-section "Madagascar et les îles environnantes", p. 1084 (PDF 1097); Vol. VI ch. 15.7 "Les pays de l'océan Indien", p. 1375 (PDF 1402). Vol. I has none. The English edition of Vol. IV has the same chapter as "Mixed Cultures of Madagascar and the Other Islands" (PDF 1277).
