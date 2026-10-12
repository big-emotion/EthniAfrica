---
title: "Colonial periods: the reference table behind a name-history account's era"
status: "proposed 2026-10-09; the cases below marked « ruled 2026-10-10 » are operator rulings (Sudan 1821–1885, South Africa 1959–1994, the 1877 Alur letter, the rulings on waves 1 and 2 of the long tail, ETNI-2011, and the era of a hypothesis's publication); those marked « ruled 2026-10-11 » are the operator's rulings on wave 3 of the long tail (the Transvaal and the Orange Free State 1852–1902, Kenya 1902, Accra 1858, Lacerda 1798, Ogilby 1670, and the Rwenzori, Mukenge and Bogos accounts left without an era), and the rulings on waves 4 and 5 of the long tail, also « ruled 2026-10-11 » (Ovamboland, Kilimanjaro, Mount Kenya, the Wolof kingdoms, Koelle, Adamawa, German East Africa before occupation, Ijwi → `polity`; Grebo 1850, Fort-Dauphin 1658, the Toro treaty 1891 → `colonial`; the Bertat country split by Egyptian taxation), and the rulings on waves 6 and 7, also « ruled 2026-10-11 » (Réunion; the interior before occupation, Samori's lands 1887, Hausaland 1876–1888, the Dahra 1838 → `polity`; the Oil Rivers Protectorate, Fort-Dauphin's hinterland 1658, the Haute-Gambie 1891–1892, Molinie's French Sudan 1959 → `colonial`), and the rulings on waves 8 and 9, also « ruled 2026-10-11 » (Ginga 1626, Tremearne's Tripoli, Taiwo 1884, Seeruttun 1857–1858, Payet at Bourbon 1674, Dida 1904, Krobo 1858 and 1871 → `colonial`; Koelle's Kányōp 1854, Pakhalla 1889, Braulot 1893, Guillain on the Antakarana 1845, Richardson 1885 → `polity`; a list of accounts left without an era), and the rulings on waves 12 and 13, « ruled 2026-10-12 » (Petherick's Moru 1862, Grigriqua 1693, Ka-Shongwe 1856–1865, the Phiri from about 1400, the Mzab before 1853 → `polity`; Le Vaillant 1790, Sparrman 1786, Sakala 1958–1961, Savimbi 1902, the Mzab from 1853 → `colonial`; the Bahr el-Ghazal zariba country 1858–1874 and Mayotte after 1975 left without an era)"
related:
  - docs/editorial/strategy/name-history-timeline-2026-10-08.md
  - docs/editorial/strategy/name-history-priority-core.md
  - src/lib/afrik/parsers/nameHistoryParser.ts
  - src/lib/search/nameTimeline.ts
  - docs/editorial/strategy/self-names-to-verify-orally.md
---

# Colonial periods

Each `nameHistory` account may declare an `era`: `polity` (before colonial
rule), `colonial` (under it) or `modern` (since independence). The timeline
inks a tile with it. Without it, the timeline falls back to a date cut —
colonial from 1885, modern from 1960 — which is wrong wherever colonial rule
came earlier (Saint-Louis, the Cape, the Gold Coast forts' hinterland under
the 1874 colony), later (the Bété country, conquered 1907–1912), or never
(Ethiopia, Liberia), and wherever independence came before or after 1960
(Ghana 1957, Guinea 1958, Sudan 1956, Burundi 1962).

This file is what a contributor reads to decide an account's era. The era
names come from the timeline (`TimelineRegime` in
`src/lib/search/nameTimeline.ts`) and the v4 mockup, so the fiche and the UI
use one vocabulary.

## How to decide an account's era

1. **Where.** The territory the account is about: the place where the name is
   used, given or written down, as the statement says it — not where the
   author later published. A wordlist printed in Berlin about the Nyakyusa is
   about the Nyakyusa country.
2. **When.** The account's `period`. A period that ends on the day of
   independence belongs to the colonial era (« Jusqu'au 1er juillet 1962 »).
   A period that starts on it belongs to the modern era (« Depuis le
   6 mars 1957 »).
3. **Read the table below** for that territory at that date.
4. **The founding act counts as colonial.** A treaty of protectorate, a decree
   creating a colony or a post of the colonizing state opens the colonial era
   at that place: the 1884 Douala treaty, the 1842–1843 Grand-Bassam and
   Assinie treaties and Bangala Station (1884) are `colonial`.
5. **A trading fort is not colonial rule over a coast.** Elmina, or the
   Dutch on the « Côte des Dents », do not make the coast colonial: Boahen
   counts only a handful of pockets under direct European rule by 1880 (HGA
   VII, p. 1).
6. **Undated accounts.** Set the era only when the label or the statement
   settles it: « Usage contemporain », « Aujourd'hui », a usage the author
   describes in the present → `modern`; « Époque coloniale » → `colonial`;
   « Avant la naissance de Soundiata, selon l'épopée » → `polity`.
   An undated origin hypothesis (« Origine non datée ») or a meaning with no
   date gets no era.
7. **A hypothesis carries the era of its publication**, ruled 2026-10-10:
   the era of the territory it is about, at the date it was published or
   proposed. This holds everywhere, also when the period only reads
   « Proposée en … » or « Rapporté en … ». When the period gives a first
   proposal and a later reprise (« Proposée en 1887, reprise en 1994 »), the
   first proposal decides. The account is still left without an era when the
   territory is unclear, spans territories in different eras at that date,
   or lies outside Africa (see « Europe » below), and when the period dates
   the event the hypothesis describes rather than its publication.
8. **A period that crosses eras gets no era**: « Depuis 1821 »,
   « XIXe siècle à aujourd'hui ». A hypothesis follows rule 7 instead.
9. **When in doubt, leave it out** and list the account for the operator.
   `npx tsx scripts/validateAfrikData.ts` reports every account without an era
   as a warning, never an error, so a new account is seen without failing CI.

## Africa-wide reference points

- **By 1880**, only a few areas were under direct European rule: in West
  Africa the island and coastal areas of Senegal, Freetown and its environs,
  the southern Gold Coast, the coastal areas of Abidjan in Ivory Coast,
  Porto-Novo in Dahomey and the island of Lagos; in North Africa, Algeria; in
  Central Africa, the coastal stretches of Mozambique and Angola; in Southern
  Africa, the white colonies extended well inland. Not one part of East
  Africa was under European control. About 80 % of the continent was still
  ruled by its own polities. — A. Adu Boahen, HGA VII, ch. 1, p. 1.
- **1890–1910** saw the conquest and occupation of virtually the whole
  continent. — HGA VII, ch. 1, p. 1.
- **By 1914**, only Ethiopia and Liberia had escaped European rule. — HGA VII,
  ch. 1, p. 1; ch. 2, p. 38 (« at least nominally »).
- **Independence dates**: HGA VIII, ch. 5, table 5.1 « Chronologie de
  l'indépendance africaine », pp. 128–132 in the French edition (pp. 107–110
  in the English edition, « Chronology of African independence »), unless a
  fiche cites a closer source.

## Territories the current fiches need

Dates in the « colonial from » column are the reference points for accounts
that fall near them; accounts far from any boundary do not depend on their
precision. « by 1880 » means HGA VII, p. 1.

| Territory                                                | Colonial from                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Modern from                                                                                                                                                                                                 | Sources (opened)                                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Senegal                                                  | coastal and island areas by 1880; conquest from 1854; Walo and northern Cayor annexed by 1880, upper Senegal states a protectorate from 1860; the Haute-Gambie of Rançon's journey, 1891–1892, is `colonial`, a French protectorate (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                               | 20 June 1960 (Mali Federation), 20 Aug. 1960                                                                                                                                                                | HGA VII pp. 1, 117; HGA VIII table 5.1                                                                                                                                                       |
| Mali (French Soudan)                                     | conquest of the 1880s–1890s: Gallieni commandant-supérieur 1886–1888, Koundian 1889, Ségou 1890, Samori captured 1898; Samori's lands in 1887 are `polity`; Molinie's accounts of 1959 about places in French Sudan are `colonial`, independence coming in June 1960 (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                              | 20 June 1960, Republic 22 Sept. 1960                                                                                                                                                                        | HGA VII pp. 36, 313; HGA VIII table 5.1; MLI fiche                                                                                                                                           |
| Guinea                                                   | Guinée française organised by the decree of 10 March 1893; Samori captured 1898                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 2 Oct. 1958                                                                                                                                                                                                 | CIV fiche (decree of 10 March 1893); HGA VII p. 36; HGA VIII table 5.1                                                                                                                       |
| Côte d'Ivoire                                            | Grand-Bassam and Assinie posts from the 1842–1843 treaties; colony by the decree of 10 March 1893; Baule country occupied after 1898; Bété country conquered 1907–1912; Eysséric's Gouro country of 1897, before occupation, is `polity` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                          | 7 Aug. 1960                                                                                                                                                                                                 | CIV fiche; HGA VII pp. 1, 130; PPL_BETE fiche (Dozon)                                                                                                                                        |
| Burkina Faso (Upper Volta)                               | after 1895: the Mogho Naba still dealt with France as a sovereign in 1895; the region Volta from 1899; colony of Haute-Volta by the decree of 1 March 1919 (abolished 1932, restored 1947)                                                                                                                                                                                                                                                                                                                                                                                                                                           | 5 Aug. 1960                                                                                                                                                                                                 | HGA VII pp. 3, 5; Digithèque MJP, Haute-Volta 1919 (decree of 1 March 1919); HGA VIII table 5.1                                                                                              |
| Ghana (Gold Coast)                                       | southern Gold Coast by 1880; Accra in 1858 is `colonial`, under British oversight since the Bond of 1844 (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 6 March 1957                                                                                                                                                                                                | HGA VII pp. 1, 131; HGA VIII table 5.1; GHA fiche                                                                                                                                            |
| Krobo country (Gold Coast)                               | the Krobo mountain between the Akwapim hills and the Volta, in the southern Gold Coast: Zimmermann's dictionary of 1858 and his « Kro » of 1871 are `colonial`, as Accra in 1858 (ruled 2026-10-11); the colonial government expelled the Krobo from the mountain in 1892                                                                                                                                                                                                                                                                                                                                                            | 6 March 1957                                                                                                                                                                                                | HGA VII p. 1; PPL_KROBO fiche (Arlt, Zimmermann); HGA VIII table 5.1                                                                                                                         |
| Togo                                                     | 5 July 1884 on the coast: the protectorate agreement over « the territory of the King of Togo » (Lomé, Bagida); the interior conquered later (Kabre 1890, Konkomba 1897–1898); British and French parts from 1914–1919                                                                                                                                                                                                                                                                                                                                                                                                               | 27 April 1960; British Togoland joined Ghana on 6 March 1957                                                                                                                                                | Hertslet, Map of Africa by Treaty, 3rd ed., vol. II p. 693; HGA VII pp. 1, 58, 289; HGA VIII p. 202 and table 5.1                                                                            |
| Benin (Dahomey)                                          | Porto-Novo by 1880; the kingdom of Abomey fought France in the 1890s                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 1 Aug. 1960                                                                                                                                                                                                 | HGA VII pp. 1, 127; HGA VIII table 5.1                                                                                                                                                       |
| Nigeria                                                  | Lagos occupied 1851, then a British colony; most of Yorubaland a protectorate by 1893; Niger Coast Protectorate 1894; Southern and Northern Nigeria protectorates from 1 Jan. 1900, southern rule « practically assured » in 1900; amalgamated 1914; the north conquered to 1903–1914; Hausaland under the Sokoto caliphate in 1876–1888 is `polity` (ruled 2026-10-11)                                                                                                                                                                                                                                                              | 1 Oct. 1960                                                                                                                                                                                                 | HGA VII pp. 1, 36, 134 (English edition); NGA fiche (HGA VII fr. pp. 57, 510; Lugard's 1900–1901 reports); HGA VIII table 5.1; Office of the Historian, Nigeria                              |
| Nigeria: Oil Rivers Protectorate (Old Calabar)           | 1884: treaties by Consul Hewett place the chiefs of the Niger Districts under British protection; 5 June 1885: the British Protectorate over the Niger Districts is notified in the London Gazette, its coast known as the Oil Rivers Protectorate (Old Calabar and the Cross River are among the Oil Rivers); Niger Coast Protectorate from 13 May 1893. Calabar in 1890 is `colonial` (ruled 2026-10-11)                                                                                                                                                                                                                           | 1 Oct. 1960                                                                                                                                                                                                 | Hertslet, _Map of Africa by Treaty_, 3rd ed., 1909, vol. I pp. 115–116 and 153–154, read on archive.org (mapofafricabytr01hert); HGA VIII table 5.1                                          |
| Niger                                                    | « 3e territoire militaire » by the decree of 20 Dec. 1900; territoire du Niger from 1 Jan. 1921 by the decree of 4 Dec. 1920 (ruled 2026-10-10: 1920, with the caveat that the Digithèque MJP chronology dates a territory decree to 22 June 1910); colonie du Niger by the decree of 13 Oct. 1922                                                                                                                                                                                                                                                                                                                                   | 3 Aug. 1960                                                                                                                                                                                                 | NER fiche (decrees of 1900, 1920, 1922 as printed in the Journal officiel); Digithèque MJP, Niger chronology; HGA VIII table 5.1; Office of the Historian, Niger                             |
| Cameroon                                                 | German protectorate from the Douala treaty of 12 July 1884; French and British mandates after 1916                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 1 Jan. 1960 (French part)                                                                                                                                                                                   | CMR fiche; HGA VII p. 309; HGA VIII table 5.1                                                                                                                                                |
| Central African Republic (Ubangi-Shari)                  | French post at Bangui 1889; annexation 1894 (« établissements de l'Oubanghi », decree of 13 July 1894); territoire de l'Oubangui-Chari by the decree of 29 Dec. 1903                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 13 Aug. 1960                                                                                                                                                                                                | Digithèque MJP, Centrafrique chronology and Oubangui-Chari 1894; HGA VIII table 5.1                                                                                                          |
| Chad                                                     | decree of 5 Sept. 1900 creating the « territoire militaire des pays et protectorats du Tchad » (the 1890 Franco-British convention only left the region to France)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 11 Aug. 1960                                                                                                                                                                                                | Digithèque MJP, Tchad, decree of 5 Sept. 1900; HGA VIII table 5.1                                                                                                                            |
| Congo (Brazzaville)                                      | Congo français, decree of 27 April 1886; Moyen-Congo 1903                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 15 Aug. 1960                                                                                                                                                                                                | COG fiche; HGA VIII table 5.1                                                                                                                                                                |
| DR Congo                                                 | Congo Free State 2 May 1885; Belgian Congo 18 Nov. 1908                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 30 June 1960                                                                                                                                                                                                | HGA VIII table 5.1; COD fiche                                                                                                                                                                |
| Gabon                                                    | French station on the estuary from the convention of 9 Feb. 1839 with Kowé Rapontchombo (« Roi Denis »); Libreville an enclave by 1880; colony separate from the Moyen-Congo 1903. The interior stays `polity` after 1839 (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                         | 17 Aug. 1960                                                                                                                                                                                                | HGA VIII table 5.1; HGA VII fr. p. 495; Digithèque MJP, Gabon 1839                                                                                                                           |
| Kenya                                                    | none by 1880; East Africa Protectorate, then Kenya Colony 1920. The Kisii accounts of 1902, before the occupation of 1907, are `polity` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 12 Dec. 1963                                                                                                                                                                                                | HGA VII pp. 1, 659; HGA VIII table 5.1                                                                                                                                                       |
| Tanzania (Tanganyika)                                    | none by 1880; German annexations from 1883 (German East Africa), then British territory under the Tanganyika Order in Council 1920; the Rangi hills around Kondoa, 1885–1894, are `polity`, before German rule reached them (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                                       | 9 Dec. 1961                                                                                                                                                                                                 | HGA VII pp. 1, 49, 309; HGA VIII table 5.1; Tanganyika Independence Act 1961 s. 1                                                                                                            |
| Zanzibar                                                 | British protectorate from Nov. 1890; the Omani sultanate before it is `polity` (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 10 Dec. 1963; part of Tanzania from 26–27 April 1964                                                                                                                                                        | HGA VII p. 57; HGA VIII table 5.1; Zanzibar Act 1963 s. 1                                                                                                                                    |
| Uganda                                                   | none by 1880; protectorate proclaimed over Buganda in 1894                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 9 Oct. 1962                                                                                                                                                                                                 | HGA VII pp. 1, 57, 182; HGA VIII table 5.1; Uganda Independence Act 1962 s. 1                                                                                                                |
| Malawi (Nyasaland)                                       | none by 1880; British protectorate proclaimed over the Shire province 21 Sept. 1889; British Central Africa 1891, later Nyasaland                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 6 July 1964                                                                                                                                                                                                 | HGA VII p. 1; H. H. Johnston, _British Central Africa_, 1897, p. 86 n. 1; HGA VIII table 5.1; Office of the Historian, Malawi                                                                |
| Burundi                                                  | none by 1880; German colonisation from 1890, protectorate treaty 6 June 1903 (1903 is `colonial`, ruled 2026-10-10); Belgian mandate 1919, then Ruanda-Urundi                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 1 July 1962                                                                                                                                                                                                 | HGA VII pp. 1, 309; Digithèque MJP, Burundi chronology; HGA VIII table 5.1; BDI fiche                                                                                                        |
| Sudan                                                    | Turco-Egyptian rule 1821–1885, colonial by operator ruling (see below); Mahdist state 1881–1898, « national independence »; Anglo-Egyptian condominium 1899                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 1 Jan. 1956                                                                                                                                                                                                 | HGA VII pp. 77, 453–454; HGA VIII table 5.1; SDN fiche                                                                                                                                       |
| South Sudan                                              | as Sudan to 1956                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 9 July 2011                                                                                                                                                                                                 | SSD fiche                                                                                                                                                                                    |
| South Africa                                             | the Cape Colony and Natal well before 1880                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Union, 31 May 1910                                                                                                                                                                                          | HGA VII pp. 1, 194; HGA VIII table 5.1                                                                                                                                                       |
| South African Republic (Transvaal) and Orange Free State | Boer republics, `colonial` from 1852 to 1902 (ruled 2026-10-11): settler states ruling over African peoples. Britain recognises the Transvaal emigrants' self-government by the Sand River Convention, 17 Jan. 1852, and the Orange Free State by the convention of 23 Feb. 1854; the Transvaal constitution tolerates « no equality of coloured people with the white inhabitants ». British annexation of the Transvaal 12 April 1877 to the Pretoria convention of 1881; « South African Republic » from the London convention of 27 Feb. 1884; both republics annexed after the war, peace of 31 May 1902, then British colonies | Union, 31 May 1910                                                                                                                                                                                          | Digithèque MJP, Afrique du Sud chronology (1852, 1854, 1858, 1877, 1881, 1902); _Encyclopaedia Britannica_ 1911, vol. 27, « Transvaal » (F. R. Cana), read on Wikisource; HGA VIII table 5.1 |
| Eswatini (Swaziland)                                     | 1894 convention placing it under the Transvaal, resident commissioner 1895; British protectorate by the ordinance of 25 June 1903; the 1881 and 1884 conventions recognise its independence, so `polity` before 1894                                                                                                                                                                                                                                                                                                                                                                                                                 | 6 Sept. 1968                                                                                                                                                                                                | HGA VII p. 237; Hertslet vol. II pp. 856, 903; Swaziland Independence Act 1968 s. 1; HGA VIII table 5.1                                                                                      |
| Zambia (Northern Rhodesia)                               | British South Africa Company treaties north of the Zambezi, 1889–1891; « Rhodesia » proclaimed 3 May 1895; Northern Rhodesia 17 Aug. 1911                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 24 Oct. 1964                                                                                                                                                                                                | Encyclopaedia Britannica 1911, vol. 23 p. 266; National Assembly of Zambia debates, 24 June 2011; Zambia Independence Act 1964 s. 1; HGA VIII table 5.1                                      |
| Zimbabwe (Southern Rhodesia)                             | Mashonaland colony 12 Sept. 1890; Southern Rhodesia Order in Council 20 Oct. 1898; settler self-government 1923; UDI 11 Nov. 1965 – 12 Dec. 1979 stays `colonial`, with Ian Smith's white minority regime named in the text (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                       | 18 April 1980                                                                                                                                                                                               | HGA VII p. 218; HGA VIII pp. 95, 295, 297 and table 5.1; Zimbabwe Act 1979 s. 1; UK National Archives CO 879/54/6                                                                            |
| Liberia                                                  | « private colony » 1822–1847 (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 26 July 1847                                                                                                                                                                                                | HGA VIII table 5.1; Office of the Historian, Liberia                                                                                                                                         |
| Ethiopia                                                 | Italian occupation 1936–1941 only (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | independent since antiquity; `modern` from 1941 (ruled 2026-10-10)                                                                                                                                          | HGA VIII table 5.1; Office of the Historian, Ethiopia (Addis Ababa occupied 6 May 1936)                                                                                                      |
| Tunisia                                                  | Bardo treaty, 12 May 1881 (protectorate); not under European rule by 1880; `polity` from about 670 to 1880 (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 20 March 1956                                                                                                                                                                                               | Digithèque MJP, Tunisie (1881, 1956); HGA VII p. 1; HGA VIII table 5.1                                                                                                                       |
| Seychelles                                               | French stone of possession, 1 Nov. 1756 (founding act, rule 4); British from the treaty of 30 May 1814, a dependency of Mauritius; uninhabited before 1756, so no era before it (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                   | 29 June 1976 (ruled 2026-10-10; HGA VIII table 5.1 prints 26 June, and the fiche says so; the Seychelles Act 1976 and the Office of the Historian give 29 June)                                             | Seychelles Nation 2020; Seychelles News Agency 2019; Hertslet vol. II p. 714; Seychelles Act 1976 s. 1; Office of the Historian, Seychelles; HGA VIII table 5.1 (English edition p. 110)     |
| Gambia                                                   | an enclave by 1880                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 18 Feb. 1965                                                                                                                                                                                                | HGA VII fr. p. 495; HGA VIII table 5.1                                                                                                                                                       |
| Guinea-Bissau (Portuguese Guinea)                        | colony separate from Cape Verde 1879, overseas province 1951; the republic proclaimed in the liberated zones on 24 Sept. 1973 is `colonial` (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 10 Sept. 1974                                                                                                                                                                                               | HGA VIII table 5.1; Digithèque MJP, Guinea-Bissau                                                                                                                                            |
| Equatorial Guinea (Spanish Guinea)                       | Fernando Poo ceded to Spain 1777; Río Muni ceded by France 1900; Spanish provinces 1959                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 12 Oct. 1968                                                                                                                                                                                                | HGA VIII table 5.1; Digithèque MJP, Equatorial Guinea                                                                                                                                        |
| Lesotho (Basutoland)                                     | annexed as a Crown colony 12 March 1868                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 4 Oct. 1966                                                                                                                                                                                                 | HGA VI fr. ch. 7, pp. 194–195; HGA VIII table 5.1; Lesotho Independence Act 1966                                                                                                             |
| Libya                                                    | Italian colony from the Treaty of Ouchy, 18 Oct. 1912, to 1947; British and French administration 1943–1951                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 24 Dec. 1951                                                                                                                                                                                                | HGA VIII table 5.1; Office of the Historian, Libya                                                                                                                                           |
| Morocco                                                  | French protectorate from the Treaty of Fez, 30 March 1912; Spanish zones from 27 Nov. 1912; the province of al-Maghrib al-Aqṣā before 710 is `polity` (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 2 March 1956 (Spanish zones 1956–1969)                                                                                                                                                                      | HGA VIII table 5.1; Digithèque MJP, Morocco 1912 and 1956; HGA III fr. pp. 268–269                                                                                                           |
| Madagascar                                               | French protectorate treaty 17 Dec. 1885; colony by the law of 6 Aug. 1896; the Fort-Dauphin hinterland (Anosy) in 1658 is `colonial`, and only that hinterland (ruled 2026-10-11); Guillain on the Ankara in 1845 and Richardson's dictionary, prefaced 1 May 1885, are `polity` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                  | 26 June 1960                                                                                                                                                                                                | HGA VIII table 5.1; Digithèque MJP, Madagascar 1896 and 1960                                                                                                                                 |
| Mozambique                                               | Portuguese coastal strips by 1880; the Yao country, unconquered when Lacerda wrote from Tete in 1798, is `polity` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 25 June 1975                                                                                                                                                                                                | HGA VII fr. p. 21; HGA VIII table 5.1                                                                                                                                                        |
| Algeria                                                  | the Regency of Algiers, under Ottoman suzerainty from about 1519, is `polity` to 1830 (ruled 2026-10-10); French conquest from the capture of Algiers, 5 July 1830; « possessions françaises dans le nord de l'Afrique » 22 July 1834; the Dahra under Abd el-Kader in 1838 is `polity` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                           | 3 July 1962                                                                                                                                                                                                 | Digithèque MJP, Algeria chronology and Algérie coloniale 1830–1902; HGA VII p. 1; HGA VIII table 5.1                                                                                         |
| Mzab (Algeria)                                           | the confederation of the seven Ibadi towns of the Mzab, self-governing: `polity` before the protectorate treaty of 29 April 1853 with General Randon, `colonial` from it (ruled 2026-10-12); annexed by the proclamation of 30 Nov. 1882                                                                                                                                                                                                                                                                                                                                                                                             | 3 July 1962                                                                                                                                                                                                 | Digithèque MJP, Algérie coloniale 1830–1902 (treaty of 29 April 1853, proclamation of 30 Nov. 1882); PPL_MOZABITE fiche                                                                      |
| Egypt                                                    | British intervention June 1882, a protectorate in fact; formal protectorate 18 Dec. 1914; 1882–1922 is `colonial` (ruled 2026-10-10). Antiquity is `polity` (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 28 Feb. 1922 (end of the protectorate); constitution of 19 April 1923                                                                                                                                       | Digithèque MJP, Egypt chronology; HGA VIII table 5.1                                                                                                                                         |
| Eritrea                                                  | Assab bought 1869, under Italian government control by the decree of 5 July 1882; colonia Eritrea 1 Jan. 1890; British administration 1941–1952. Federation with Ethiopia 1952, full union 14 Nov. 1962: 1952–1993 carries no era until ruled (2026-10-10)                                                                                                                                                                                                                                                                                                                                                                           | 24 May 1993                                                                                                                                                                                                 | Digithèque MJP, Eritrea; HGA VIII table 5.1 (Eritrea line)                                                                                                                                   |
| Djibouti                                                 | Obock bought 11 March 1862; Djibouti founded 1888; Côte française des Somalis by the decree of 20 May 1896                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 27 June 1977 (ruled 2026-10-10: the loi constitutionnelle n° 1, the Digithèque MJP and the English table 5.1 give 27 June; the wave-1 batch reported 26 June, which no source opened for this table prints) | Digithèque MJP, Djibouti chronology and dj1859; HGA VIII table 5.1 (English edition p. 110)                                                                                                  |
| Somalia (British Somaliland)                             | British at Berbera 1884; protectorate on the coast east of Djibouti from 1887                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 26 June 1960; union with the former Italian territory 1 July 1960                                                                                                                                           | Digithèque MJP, Somalia; SOM fiche (HGA VII fr. pp. 105–106); HGA VIII table 5.1                                                                                                             |
| Somalia (Italian Somaliland)                             | Italian protectorates over the Benadir sultanates from 1888–1889 (Hobyo 8 Feb. 1889, Majerteen 7 April 1889); colony by the law of 7 April 1908; British administration 1941–1950; UN trust under Italy from 1 April 1950                                                                                                                                                                                                                                                                                                                                                                                                            | 1 July 1960                                                                                                                                                                                                 | Digithèque MJP, Somalia; HGA VIII table 5.1                                                                                                                                                  |
| Mauritania                                               | French « Mauritanie occidentale » by a ministerial decision of 30 Dec. 1899; protectorate of the « pays mauritaniens du bas Sénégal » by the decree of 12 March 1903; territoire civil 1904; colony by the decree of 4 Dec. 1920. Roman Mauretania, a different territory to the north, carries no era (ruled 2026-10-10)                                                                                                                                                                                                                                                                                                            | 28 Nov. 1960                                                                                                                                                                                                | Digithèque MJP, Mauritania chronology and Colonie de Mauritanie 1821–1920; MRT fiche (Ould Mohamed Baba 2019); HGA VIII table 5.1                                                            |
| Sierra Leone                                             | Freetown and its peninsula colonial from 1787, a Crown colony from 1808; the interior `polity` until the hinterland was annexed and the Protectorate Ordinance of 1896 applied                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 27 April 1961                                                                                                                                                                                               | SLE fiche (HGA VI fr. pp. 105, 697); HGA VII pp. 141, 263 (English edition); HGA VIII table 5.1; Sierra Leone Independence Act 1961                                                          |
| Angola                                                   | the colony of Angola founded 1575, Luanda 1576; the interior conquered later, an occupation begun in the 1880s and completed well into the 20th century; the Mussurongo coast north of Ambriz in 1875 is `polity` (ruled 2026-10-11); the governor of Luanda writing of « dona Anna Ginga » in 1626 is `colonial` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                 | 11 Nov. 1975                                                                                                                                                                                                | HGA V p. 558 and HGA VII p. 37 (English edition); HGA VIII table 5.1; Office of the Historian, Angola                                                                                        |
| Cabo Verde                                               | uninhabited before settlement (no era); settled by the Portuguese from 1462, Santiago the capital                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 5 July 1975                                                                                                                                                                                                 | HGA IV p. 319 (English edition); Digithèque MJP, Cap-Vert; HGA VIII table 5.1                                                                                                                |
| São Tomé and Príncipe                                    | uninhabited before settlement: the 1483 chart and the 1471–1480 landing carry no era (ruled 2026-10-10); Portuguese colonisation of São Tomé from 1485                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 12 July 1975                                                                                                                                                                                                | STP fiche (Caldeira, _Anais de História de Além-Mar_ XI, p. 177); HGA VIII table 5.1                                                                                                         |
| Mauritius                                                | uninhabited before settlement: the 1598 naming and the 1505 Portuguese name carry no era (ruled 2026-10-10); Dutch settlement 1638–1710; French possession 20 Sept. 1715; taken by Britain 1810, ceded 1814; the emigration registers of 1857–1858 are `colonial` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                 | 12 March 1968                                                                                                                                                                                               | Digithèque MJP, Maurice chronology; MUS fiche (HGA V fr. pp. 936, 939); HGA VIII table 5.1                                                                                                   |
| Comoros                                                  | Mayotte French by the treaty of 25 April 1841; protectorates over Grande Comore, Anjouan and Mohéli 1886; colony attached to Madagascar by the law of 25 July 1912; overseas territory 1946                                                                                                                                                                                                                                                                                                                                                                                                                                          | 6 July 1975 (Mayotte stays French); Mayotte after 1975 carries no era, like Réunion (ruled 2026-10-12)                                                                                                      | Digithèque MJP, Comores chronology; HGA VIII table 5.1                                                                                                                                       |
| Réunion                                                  | French possession, settled from the 1660s: `colonial` before 1946 (ruled 2026-10-11); Antoine Payet at Bourbon about 1674 is `colonial` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | none: the law of 19 March 1946 made the colony a French department, and it was never independent, so an account after 1946 carries no era (ruled 2026-10-11)                                                | Loi n° 46-451 du 19 mars 1946, art. 1, quoted in Sénat, proposition de loi n° 400 (2015–2016), P. Vergès; PPL_CREOLE_REUNION fiche                                                           |
| Botswana (Bechuanaland)                                  | southern Bechuanaland a British colony 1884–1885; protectorate over northern Bechuanaland 1885                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 30 Sept. 1966                                                                                                                                                                                               | HGA VII p. 211 (English edition); HGA VIII table 5.1; Botswana Independence Act 1966; Office of the Historian, Botswana                                                                      |
| Namibia (South West Africa)                              | German annexation of South West Africa from the end of 1883; South African conquest 1914–1915, then mandate; renamed Namibia by the UN on 12 June 1968; Ovamboland, Kwanyama included, stays `polity` until occupied: Tönjes in 1911 is `polity` (ruled 2026-10-11)                                                                                                                                                                                                                                                                                                                                                                  | 21 March 1990                                                                                                                                                                                               | HGA VII p. 28 (English edition); NAM fiche (HGA VII fr. pp. 312–313; UN resolution 2372); HGA VIII table 5.1; Office of the Historian, Namibia                                               |
| Rwanda                                                   | German colonisation from 1890; the 1903 accounts are `colonial` (ruled 2026-10-10); Belgian mandate 1919, then Ruanda-Urundi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 1 July 1962                                                                                                                                                                                                 | Digithèque MJP, Rwanda chronology and Ruanda-Urundi 1919; HGA VIII table 5.1; Office of the Historian, Rwanda                                                                                |

Sources opened for this table:

- _UNESCO General History of Africa, VII: Africa under Colonial Domination
  1880–1935_, ed. A. Adu Boahen, 1985 (1991 printing), read from the PDF that
  South African History Online hosts
  (sahistory.org.za/archive/general-history-africa-volume-vii-africa-under-colonial-domination-1880-1935).
  Pages cited « English edition » are its printed pages.
- _UNESCO General History of Africa, VIII: Africa since 1935_, ed. A. A. Mazrui,
  1993, same host, table 5.1 (pp. 107–110). The French edition prints the
  same table on pp. 128–132; the fiches cite it there. On 2026-10-10 its
  unesdoc record offered no full text, so the rows added that day were
  checked against the English table.
- _UNESCO General History of Africa_, IV (1984) and V (1992), English
  editions on the same host: IV p. 319 (Cape Verde, 1462); V p. 558 (Angola,
  1575).
- US Department of State, Office of the Historian, country pages for Liberia,
  Ethiopia, Nigeria, Niger, Tanzania, Malawi, Botswana, Angola, Namibia and
  Rwanda (history.state.gov/countries/…).
- _Histoire générale de l'Afrique_, French edition (unesdoc): VI, ch. 7
  (Ngwabi Bhebe), pp. 194–195; VII, ch. 1 (A. Adu Boahen), p. 21, the French
  page of Boahen's 1880 list; VII, ch. 18 (John Charles Caldwell), p. 495.
- Digithèque MJP (Université de Perpignan), country pages and chronologies
  for Algeria (and Algérie coloniale 1830–1902), Burkina Faso (Haute-Volta
  1919), Burundi, the Central African Republic (and Oubangui-Chari 1894),
  Cabo Verde, the Comoros, Djibouti (and dj1859), Egypt, Equatorial Guinea,
  Eritrea, Gabon, Guinea-Bissau, Libya, Madagascar, Mauritania (and Colonie
  de Mauritanie 1821–1920), Mauritius, Morocco, Niger, Rwanda (and
  Ruanda-Urundi 1919) and Somalia.
- H. H. Johnston, _British Central Africa_, London, Methuen, 1897, p. 86
  n. 1, read on archive.org (britishafrica00johnuoft).
- The decrees, treaties and constitutions the pays fiches already cite (CIV,
  CMR, COD, COG, MLI, SDN, BDI, NER), and, where a row says « fiche », the
  page the fiche records.

## The cases a date cannot settle

Each case says whether it is ruled. A ruled case is applied in the fiches; an
open one leaves its accounts without an era, and the validator lists them.

- **Ethiopia — ruled 2026-10-10.** No colonial era except the Italian
  occupation, 1936–1941. An Ethiopian account is `polity` before 1936,
  `colonial` during the occupation and `modern` from 1941. The three Galla
  accounts are undated and span four centuries, so they carry no era.
- **Liberia — ruled 2026-10-10.** A « private colony » of the American
  Colonization Society from 1822, a republic from 26 July 1847 (HGA VIII):
  `polity` before 1822, `colonial` 1822–1847, `modern` from 1847. The Kamana
  account (1899) stays without an era, since the Vai live in Liberia and in
  Sierra Leone, a British protectorate at that date.
- **South Africa — ruled 2026-10-10.** HGA VIII dates independence to the
  Union, 31 May 1910, and notes white minority rule. An account about
  apartheid South Africa (Bantou, 1959–1994) stays `modern`, as the table
  reads; the operator asks that its text name apartheid, which it does.
- **Transvaal (South African Republic) and the Orange Free State, 1852–1902
  — ruled 2026-10-11.** HGA VIII notes that the two republics were
  independent until 31 May 1902. The operator ruled that they count as
  `colonial`: settler states ruling over African peoples, as the Rhodesia
  ruling treats a white minority regime. The Transvaal constitution said it
  would tolerate « no equality of coloured people with the white
  inhabitants » (_Encyclopaedia Britannica_ 1911, « Transvaal »). The
  British annexation of 1877–1881 and the Transvaal Colony from 1902 are
  `colonial` too. Applied to six accounts: Magwamba in 1892 (Distant) and
  1900 (Keane) on `PPL_TSONGA`; on `PPL_PEDI`, Baperi in 1857 (Livingstone),
  Merensky's two accounts of 1899 and the Pedi kingdom attacked in 1876 and
  conquered in 1879. No account is set in the Orange Free State.
- **Kenya, 1902 — ruled 2026-10-11.** Hobley and Johnston wrote about the
  Kisii country in 1902, before the British occupied it in 1907: the three
  Kisii accounts are `polity`, as the Gabon interior after 1839.
- **Accra 1858, the Yao in 1798, the Namaqua in 1670 — ruled 2026-10-11.**
  Zimmermann's « langue akra ou gã » of 1858 is `colonial`: Accra was under
  British oversight since the Bond of 1844. Lacerda's letter of 1798 about
  the Mujao, a people no one had conquered, is `polity`. Ogilby's
  « Namaqua's » of 1670 is `polity`.
- **Rwenzori 1889, Mukenge 1883–1885, the Bogos country 1872–1884 — ruled
  2026-10-11: no era.** Stanley's Wakonju, met on the slopes of the
  Rwenzori in 1889 (`PPL_NANDE`); the accounts of Wissmann and his
  companions written at Kalamba's court in Mukenge, 1883–1885 (`PPL_LULUA`,
  and the Kioko account of `PPL_CHOKWE` from the same expedition); and
  Reinisch's Bilin of 1883, collected in the Bogos country that Egypt held
  from 1872 to 1884 (`PPL_BILEN`). Each stays without an era.
- **Sudan before 1885 — ruled 2026-10-10.** Turco-Egyptian rule was a
  conquest, but not by a European power, and HGA VII calls the Mahdist state
  that ended it a period of « national independence ». The operator ruled
  that 1821–1885 counts as `colonial`, wherever the Egyptian province
  reached. South Sudan 1821–1880 is `colonial`, and so are Emin Pasha's two
  Alur accounts of November–December 1879: Mahagi was already « our
  station », and at Wadelai he obtained the chief's « permission to form a
  station » on that excursion (_Emin Pasha in Central Africa_, 1888,
  pp. 143, 147). His letter of 20 August 1877 is `polity`, ruled
  2026-10-10: it places the Lur south of Wadelai, « subject to Kabréga »,
  the king of Bunyoro, outside the Egyptian province (p. 11). The 1821–1885
  ruling covers only where the province reached, so it does not reach this
  letter.
- **North Africa before European rule — ruled 2026-10-10.** Ifrīqiya, the
  Hafsid and Ottoman-era « royaume » and « Régence de Tunis » (about
  670–1880), the Regency of Algiers (1519–1830), the province of al-Maghrib
  al-Aqṣā before 710 and Egyptian antiquity were not European conquests:
  they are `polity`.
- **Egypt, 1882–1922 — ruled 2026-10-10.** British occupation from 1882,
  formal protectorate from 1914, ended on 28 February 1922: `colonial`.
- **Zanzibar before 1890 — ruled 2026-10-10.** The Omani sultanate was not
  European rule, and Boahen counts no part of East Africa under European
  control in 1880 (HGA VII, p. 1): `polity`, as the Zanzibar accounts read.
- **Rhodesia, 1965–1979 — ruled 2026-10-10.** The unilateral declaration of
  independence by Ian Smith's white minority government was recognised by no
  state; HGA VIII dates independence to 18 April 1980. The period is
  `colonial`, with the minority regime named in the text, as the South Africa
  ruling asks for apartheid. The Rhodésie account does.
- **Guinea-Bissau, 24 September 1973 — ruled 2026-10-10.** The PAIGC
  proclaimed the Republic of Guinea-Bissau in the zones it held, while
  Portugal still ruled Bissau until 10 September 1974 (preamble of the 1984
  Constitution; HGA VIII table 5.1). The proclamation is `colonial`.
- **Eritrea, 1952–1993 — not ruled.** Federated with Ethiopia in 1952, fully
  united in 1962, independent in 1993. Its accounts in that span carry no era
  until the operator rules.
- **Islands uninhabited before settlement, and Roman Mauretania — ruled
  2026-10-10.** Mauritius (named 1598), São Tomé (charted 1483, reached
  1471–1480) and the Seychelles before 1756 had no people to be ruled or to
  rule: no era. Roman Mauretania lay north of today's Mauritania, a different
  territory: no era.
- **Burundi and Rwanda, 1903 — ruled 2026-10-10.** Both are under German
  East Africa: `colonial`.
- **Gabon's interior after 1839 — ruled 2026-10-10.** The 1839 convention
  gave France two leagues on the estuary, not the interior: an account about
  the Fang inland stays `polity` until the later occupation.
- **Hypotheses — ruled 2026-10-10.** A hypothesis carries the era of its
  publication, everywhere (rule 7): Livingstone in 1857 on the Tswana is
  `polity`, Brown in 1895 `colonial`, a hypothesis published in 2014 about
  Aného `modern`. This includes accounts dated only by their proposal,
  « Proposée en … ». The earlier rule, that such an account stays without an
  era, is withdrawn. An undated hypothesis still carries none (rule 6).
- **Christaller, 1881 — ruled 2026-10-10.** His dictionary covers the whole
  Akan and Ewe area, coast and interior, colony and kingdoms: an account
  about that whole area carries no era. An account about one territory
  (Asante, the Fante coast) keeps the era of that territory.
- **Réunion — ruled 2026-10-11.** A French colony that the law of 19 March
  1946 made a French department; it was never independent. An account about
  Réunion before 1946 is `colonial`; an account after 1946 carries no era.
- **Europe.** The word _race_ was coined in Europe; its accounts set there
  (1290–1684, and an Italian etymology proposed in 1959) are about no African
  territory and carry no era.

## What the fiches carry on 2026-10-09

595 accounts in 62 fiches: 158 `polity`, 110 `colonial`, 214 `modern`, 113
without an era. 16 accounts get an era the date cut would have got wrong
(Bleek at the Cape in 1858 and 1862, the 1842–1843 Côte d'Ivoire treaties,
the 1884 Douala treaty, Ghana and Guinea's independence, Sudan's
independence, the Belgian Congo, Urundi to 1962, the Bété country before its
conquest…). The undecided accounts and the reason for each are listed in the
pull request that added the field.

## What the fiches carry on 2026-10-10

After waves 1 and 2 of the long tail and the rulings above: 1,769 accounts in
185 fiches, 446 `polity`, 370 `colonial`, 514 `modern`, 439 without an era.
The rulings set an era on 20 accounts (Tunisia 7, Algiers 1, Morocco 1,
Egyptian antiquity 2, Guinea-Bissau 1973, Wolaitta after 1974, Rwanda and
Burundi in 1903, the Fang interior of Gabon 4). Most of the 439 are undated
origin hypotheses or meanings, which take no era by rule 6. The ones a ruling
leaves open are listed above: the Transvaal before 1902 (ruled since, on
2026-10-11), Eritrea 1952–1993,
and accounts that span several territories or eras.

## The hypothesis ruling, 2026-10-10

Applying rule 7 set an era on 24 hypothesis accounts: 4 `polity`,
7 `colonial`, 13 `modern`. The fiches now carry 1,769 accounts in 185
fiches: 450 `polity`, 377 `colonial`, 527 `modern`, 415 without an era.

Sixteen dated hypotheses stay without an era, for the operator:

- **The area is in two eras at the date.** West Atlantic in 1965 and from the
  late 1960s (Dalby, Sapir): Portuguese Guinea was still a colony.
  Benue-Congo in 1962 and 1963 (Guthrie, Greenberg): the Bantu area reached
  Angola, Mozambique and Rhodesia. Nilo-Saharan and Nilotic in 1963
  (Greenberg): Kenya became independent only in December 1963. Berber in
  1892 (Schirmer): Algeria and Tunisia were French, Morocco and Tripolitania
  were not. Khoisan in 1928 (Schultze, reported by Schapera in 1930): South
  Africa, South-West Africa and Bechuanaland. Camara and Diarra, reported by
  Molinie in 1959: the Manden lies in Guinea, independent since 1958, and in
  French Sudan, independent in 1960. Senegal in 1853 (Boilat): the river ran
  through Saint-Louis and through the kingdoms upstream.
- **The Christaller ruling.** Kwasi in 1881: a day name of the whole Akan
  area.
- **Transvaal before 1902, ruled 2026-10-11.** Magwamba in 1900 (Keane),
  now `colonial` (see the Transvaal case above).
- **The period dates the event, not the publication.** Lingala, « Avant
  1901, selon cette lecture » (Mpoke Mimpongo, read in 2024); Shona,
  « XIXe siècle » (the Zimbabwe government, undated).
- **Europe.** _Race_, the Italian etymology proposed in 1959.

## The wave-3 rulings, 2026-10-11

The operator ruled on the accounts that wave 3 of the long tail left without
an era. The rulings set an era on 11 accounts: 4 `polity` (Kisii 1902 three
times, Lacerda 1798) and 7 `colonial` (Accra 1858, and the six Transvaal
accounts: Magwamba 1892 and 1900, Baperi 1857, Merensky 1899 twice, the Pedi
kingdom 1876–1879). Ogilby's Namaqua of 1670 already read `polity`. The
Rwenzori, Mukenge and Bogos accounts stay without an era, as ruled. The
fiches now carry 2,218 accounts in 238 fiches: 630 `polity`, 487 `colonial`,
637 `modern`, 464 without an era.

## The rulings on waves 4 and 5, ruled 2026-10-11

The operator followed every recommendation that waves 4 and 5 of the long
tail left open. The rulings set an era on 22 accounts.

- **`polity`: the interior before colonial rule.** Schinz and Hahn on
  Ovamboland in 1891, and Brincker's hypothesis of 1894: German rule did not
  reach Ovamboland before 1913. Johnston on the Kilimanjaro in 1884. Gregory's
  porters naming Mount Kenya in 1893. Dard's Wolof grammar of 1826, about the
  kingdoms of Jolof, Walo, Cayor, Baol, Sine and Saloum. Koelle in 1854 on the
  interior: Jolof, Yoruba, Gio and the Mende Nongoba. Passarge in Adamawa,
  1893–1894. The Nyaturu at the edge of Mirambo's state, 1870–1884. Baumann's
  journey of 1893 in the interior of German East Africa (Iramba, Nyiramba,
  Iraqw, Mbulu), which German rule did not yet administer. Götzen at Ijwi in
  June 1894.
- **`colonial`: under the colonising state.** The Grebo Genesis of 1850: the
  Grebo lived in the Maryland colony, as Liberia 1822–1847 reads. The
  Madagascar dictionary of 1658, written at Fort-Dauphin, the French post.
  Lugard's treaty with Toro in 1891, a founding act of the protectorate. The
  Hutu accounts of 1894–1895 in Rwanda stay `colonial`, as the table reads
  from 1890.
- **The Bertat country, 1869–1874.** Marno writes that Egypt conquered it in
  February 1822 and that, in his day, its northern part, as far as Beni
  Shangul, paid tax to Egypt, while the hill chiefs of the south kept away
  from Egypt's subjects (_Reisen im Gebiete des blauen und weissen Nil_, 1874,
  pp. 68–70). An account about the northern part is `colonial`, under the
  Sudan ruling. An account about the southern hill chiefs, or one that does
  not say which part it is about, carries no era. None of Marno's accounts
  on `wti` says which part, so all four stay without an era.
- **No era.** Binger in the Anno, 1887–1889. The Portuguese posts on the
  Zambezi (Sena, 1531 and 1858). Periods that cross eras. Greenberg's labels
  over several territories. Accounts written in Rome, Greece or Arabia. The
  Quilombola accounts set in Brazil. The Malagasy book of 1852. Gevrey on
  the Comoros, 1870. Mushunguli in 1610. Goshaland, 1840–1899. The Birom,
  1880–1935. The combined Agaw account. Undated hypotheses (rule 6).
- **Births and traces.** Ibn Khaldûn's « Suso » (1376) and Dapper's
  « Mendi » (1668) stay uncertain older traces, not births. Gregory's
  « Meru », the Kitara and Kitabanyoro traditions, and the Quilombola trace
  of 1764 stay births, each tile saying what it rests on.

The fiches now carry 3,113 accounts in 382 fiches: 908 `polity`,
697 `colonial`, 877 `modern`, 631 without an era.

## The rulings on waves 6 and 7, ruled 2026-10-11

The operator followed every recommendation that waves 6 (peoples) and 7
(family names) of the long tail left open. The rulings set an era on 19
accounts; six more already carried the era ruled.

- **`polity`: the interior before occupation.** The Rangi country around
  Kondoa in German East Africa: Fischer in 1885 and Baumann in 1894
  (`PPL_RANGI`). Eysséric's Gouro country of 1897 (`PPL_GOURO`). Tönjes on
  the Kwanyama in 1911, three accounts (`PPL_KWANYAMA`). Delafosse's
  « Nguéré » of 1904 (`PPL_GUERE`, already `polity`). Monteiro's Mussurongo
  coast in 1875, two accounts (`PPL_SOLONGO`). Samori's lands in 1887: the
  Sidibé birth and Sanancoro (`PAT_SIDIBE`, `PAT_DEMBELE`, both already
  `polity`). Hausaland under the Sokoto caliphate: Schön in 1876 and 1888
  (`PAT_YUSUF`, `PAT_ABUBAKAR`). The Dahra under Abd el-Kader in 1838
  (`PAT_ZEROUAL`).
- **`colonial`: under the colonising state.** The 1877 Sefwi spelling book,
  an administrative act (`PPL_SEFWI`, already `colonial`). Goldie on Calabar
  in 1890, in the Oil Rivers Protectorate (`PPL_EFIK`; the row above).
  Flacourt on the Anosy province in 1658, the Fort-Dauphin hinterland only
  (`PPL_TANOSY`). Rançon in the Haute-Gambie, 1891–1892, a French
  protectorate (`PAT_SIDIBE`, `PAT_SISSOKO`). Molinie in 1959 on places in
  French Sudan: Sikasso, Bougouni and the Wassoulou, the Siendougou
  (`PAT_BERETE`, `PAT_DIAKITE`, `PAT_DOUMBIA`, `PAT_SISSOKO`).
- **`modern`.** The Liberian interior in 1868 and 1906 (Buzi, `PPL_TOMA_LOMA`)
  follows the Liberia ruling; both accounts already read `modern`.
- **No era.** Gouro, Kweni and Lo in 1904. Periods that cross eras or
  territories: Cabinda « depuis 1963 », Crioulo « depuis 1935 », Rodney's
  lançados, Mina « Popo » from 1680, Koelle's Toma and Buse of 1854. Molinie's
  accounts that name no place (Bamba, Camara, Diabaté, Diarra, Dembélé).
  Binger's lists over all the Mande, Fofana at Dogofili 1887, Le Châtelier
  through Arcin 1907, Kazimirski 1860, Cherbonneau 1852, Bleek and Bryant on
  the Nguni clans, Bentley 1887, Geingob 1967 in London, Witbooi « depuis
  1863 », Idrissi 2008 and the undated Leslau readings. Littré's « créole »
  of 1873, on `PPL_CREOLE_REUNION`, is a French dictionary's definition for
  all the colonies, not an account about Réunion: it stays without an era.
- **Births.** The Quran is a birth only for Ahmed, where nothing older is
  known; for Adam and Yusuf it is a source of meaning only. The « Dâo » kings
  of the Tarikh es-Soudan stay an uncertain trace of Dao, not its birth.

The fiches now carry 3,859 accounts in 495 fiches: 1,101 `polity`,
872 `colonial`, 1,156 `modern`, 730 without an era.

## The rulings on waves 8 and 9, ruled 2026-10-11

The operator followed the recommendations that waves 8 (peoples) and 9
(family names) of the long tail left open. The rulings set an era on 10
accounts and removed it from 2; the others already read as ruled.

- **`colonial`: under the colonising state.** The governor of Luanda writing
  of « dona Anna Ginga » in 1626 (`PAT_NZINGA`). Tremearne's Dan Juma, a bori
  adept in Tripoli whose story is set about 1907 and printed in 1914
  (`PAT_DANJUMA`, already `colonial`). The letter of 1884 to D. C. Taiwo in
  Lagos (`PAT_TAIWO`, already `colonial`). The Becoming Coolies registers of
  1857 and 1858, emigrants leaving for British Mauritius (`PAT_SEERUTTUN`).
  Antoine Payet at Bourbon about 1674: Réunion before 1946 is `colonial`
  (`PAT_PAYET`). Delafosse's « Dyida ou Dida » of 1904, as the Bété precedent
  (`PPL_DIDA`, already `colonial`). Zimmermann's Krobo of 1858 and his « Kro »
  of 1871 (`PPL_KROBO`, already `colonial`), now with a Krobo row in the table.
- **`polity`: before colonial rule.** Koelle's « Kányōp » of 1854
  (`PPL_MANJAK`): the Portuguese trading post at Cacheu does not make the
  coast colonial (rule 5). Binger's Pakhalla of 1889 and Braulot's report of
  1893 on Bouna (`PPL_KOULANGO`; Braulot already `polity`). Guillain on the
  Antakarana in 1845, both accounts (`PPL_ANTAKARANA`). Richardson's
  Malagasy dictionary (`PAT_ZAFY`, both accounts): its preface is signed at
  Antananarivo on 1 May 1885, before the protectorate treaty of 17 December 1885.
- **No era.** Trovoada, filmed in Lisbon in 1975. Salifou in the
  Fouta-Djalon, reported by Noirot about 1885. Koelle's Grebo of 1854, a
  boundary year for the Maryland colony. Delafosse's Manon of 1904, whose
  sense moves between peoples. Harford at Eket, 1881–1887. Noël on the Vezo,
  1843–1844. Cailliaud's Bertât, 1821–1826. The Gofa mission school about 1935. The Guadeloupe accounts, outside Africa. The Seligmans' Murle of 1932. Wahb ibn Munabbih's Kurān, written in Arabia before 728: its era is
  removed on `PPL_DAZA` and `PPL_TOUBOU`, as for the accounts written in
  Arabia in waves 4 and 5. Undated hypotheses (rule 6).

Counted over every fiche with a name history, the fiches now carry 4,428
accounts in 607 fiches: 1,220 `polity`, 998 `colonial`, 1,403 `modern`, 807
without an era.

## The rulings on waves 12 and 13, ruled 2026-10-12

The operator followed the recommendations that waves 12 (peoples) and 13
(family names) of the long tail left open. The rulings set an era on 9
accounts; the others already read as ruled.

- **`polity`: before colonial rule.** John and Katherine Petherick's Moru of
  1862, both accounts (`PPL_MORU`): Egyptian rule had not yet reached the
  Moru country. The « Grigriqua » of the Cape register of 1693
  (`PPL_KHOISAN_CREOLE`), a people beyond the colony, as Ogilby's Namaqua of 1670. Von Höhnel's Lake Rudolf accounts of 1888–1894 (`PPL_EL_MOLO`, already
  `polity`, as the Samburu, Turkana and Karamojong accounts). Ka-Shongwe,
  between 1856 and 1865, under the Swazi king (`PAT_SHONGWE`). The Phiri clan
  holding the Kalonga title from about 1400, a before-the-name tile
  (`PAT_PHIRI`). Shenoute's Egypt, Roman and Byzantine, about 400 and from the
  late sixth to the eighth century (`PAT_SHENOUDA`, already `polity`, under
  the ruling on Egyptian antiquity).
- **`colonial`: under the colonising state.** Le Vaillant's « Baster » of
  1790 and Sparrman's « bastards » of 1786, at the Cape
  (`PPL_KHOISAN_CREOLE`). The Sakala birth in the Petauke record
  (`PAT_SAKALA`): the place and date of the fieldwork, Northern Rhodesia in 1958–1961, decide, not the year
  of publication, 1965. Sakaita Savimbi in the Bailundo uprising of 1902
  (`PAT_SAVIMBI`); the 1987 meaning tile, which spans 1902 to the 1980s,
  stays without an era (rule 8).
- **The Mzab**, now a row of the table: `polity` before the protectorate
  treaty of 29 April 1853, `colonial` from it; annexed on 30 November 1882
  (Digithèque MJP, Algérie coloniale 1830–1902). The `PPL_MOZABITE` accounts
  already read so: Daumas 1845 and the cheikh Baba 1851 `polity`, the
  Mzab scholars reported in 1856 `colonial`.
- **No era.** The Bahr el-Ghazal zariba country of 1858–1874, ruled as one
  zone: the 13 accounts of `PPL_BELANDA`, `PPL_BONGO` and `PPL_KRESH`
  (Petherick, Heuglin, Schweinfurth), as the Zande accounts of 1874. The Vai
  and Gola accounts that span Liberia and Sierra Leone. Raffenel's legend of
  Diavandou (`PPL_DIAWAMBE`), set in a mythical Foulhadou. Duncan's Owoosoo
  of 1845–1846, an Akuapem chief at Danish Accra (`PAT_OWUSU`). Malagasy
  publications printed outside Madagascar. Mayotte after 1975, which stayed
  French and was never independent, like Réunion after 1946: the
  `PAT_SOILIHI` accounts of 1999 and 2022 carry no era.

Counted over every fiche with a name history, the fiches now carry 4,997
accounts in 724 fiches: 1,350 `polity`, 1,121 `colonial`, 1,604 `modern`, 922
without an era.
