---
title: "Colonial periods: the reference table behind a name-history account's era"
status: "proposed 2026-10-09; the cases below marked « ruled 2026-10-10 » are operator rulings (Sudan 1821–1885, South Africa 1959–1994, the 1877 Alur letter, the rulings on waves 1 and 2 of the long tail, ETNI-2011, and the era of a hypothesis's publication)"
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

| Territory                               | Colonial from                                                                                                                                                                                                                                                                                                             | Modern from                                                                                                                                                                                                 | Sources (opened)                                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Senegal                                 | coastal and island areas by 1880; conquest from 1854; Walo and northern Cayor annexed by 1880, upper Senegal states a protectorate from 1860                                                                                                                                                                              | 20 June 1960 (Mali Federation), 20 Aug. 1960                                                                                                                                                                | HGA VII pp. 1, 117; HGA VIII table 5.1                                                                                                                                                   |
| Mali (French Soudan)                    | conquest of the 1880s–1890s: Gallieni commandant-supérieur 1886–1888, Koundian 1889, Ségou 1890, Samori captured 1898                                                                                                                                                                                                     | 20 June 1960, Republic 22 Sept. 1960                                                                                                                                                                        | HGA VII pp. 36, 313; HGA VIII table 5.1; MLI fiche                                                                                                                                       |
| Guinea                                  | Guinée française organised by the decree of 10 March 1893; Samori captured 1898                                                                                                                                                                                                                                           | 2 Oct. 1958                                                                                                                                                                                                 | CIV fiche (decree of 10 March 1893); HGA VII p. 36; HGA VIII table 5.1                                                                                                                   |
| Côte d'Ivoire                           | Grand-Bassam and Assinie posts from the 1842–1843 treaties; colony by the decree of 10 March 1893; Baule country occupied after 1898; Bété country conquered 1907–1912                                                                                                                                                    | 7 Aug. 1960                                                                                                                                                                                                 | CIV fiche; HGA VII pp. 1, 130; PPL_BETE fiche (Dozon)                                                                                                                                    |
| Burkina Faso (Upper Volta)              | after 1895: the Mogho Naba still dealt with France as a sovereign in 1895; the region Volta from 1899; colony of Haute-Volta by the decree of 1 March 1919 (abolished 1932, restored 1947)                                                                                                                                | 5 Aug. 1960                                                                                                                                                                                                 | HGA VII pp. 3, 5; Digithèque MJP, Haute-Volta 1919 (decree of 1 March 1919); HGA VIII table 5.1                                                                                          |
| Ghana (Gold Coast)                      | southern Gold Coast by 1880                                                                                                                                                                                                                                                                                               | 6 March 1957                                                                                                                                                                                                | HGA VII pp. 1, 131; HGA VIII table 5.1; GHA fiche                                                                                                                                        |
| Togo                                    | 5 July 1884 on the coast: the protectorate agreement over « the territory of the King of Togo » (Lomé, Bagida); the interior conquered later (Kabre 1890, Konkomba 1897–1898); British and French parts from 1914–1919                                                                                                    | 27 April 1960; British Togoland joined Ghana on 6 March 1957                                                                                                                                                | Hertslet, Map of Africa by Treaty, 3rd ed., vol. II p. 693; HGA VII pp. 1, 58, 289; HGA VIII p. 202 and table 5.1                                                                        |
| Benin (Dahomey)                         | Porto-Novo by 1880; the kingdom of Abomey fought France in the 1890s                                                                                                                                                                                                                                                      | 1 Aug. 1960                                                                                                                                                                                                 | HGA VII pp. 1, 127; HGA VIII table 5.1                                                                                                                                                   |
| Nigeria                                 | Lagos occupied 1851, then a British colony; most of Yorubaland a protectorate by 1893; Niger Coast Protectorate 1894; Southern and Northern Nigeria protectorates from 1 Jan. 1900, southern rule « practically assured » in 1900; amalgamated 1914; the north conquered to 1903–1914                                     | 1 Oct. 1960                                                                                                                                                                                                 | HGA VII pp. 1, 36, 134 (English edition); NGA fiche (HGA VII fr. pp. 57, 510; Lugard's 1900–1901 reports); HGA VIII table 5.1; Office of the Historian, Nigeria                          |
| Niger                                   | « 3e territoire militaire » by the decree of 20 Dec. 1900; territoire du Niger from 1 Jan. 1921 by the decree of 4 Dec. 1920 (ruled 2026-10-10: 1920, with the caveat that the Digithèque MJP chronology dates a territory decree to 22 June 1910); colonie du Niger by the decree of 13 Oct. 1922                        | 3 Aug. 1960                                                                                                                                                                                                 | NER fiche (decrees of 1900, 1920, 1922 as printed in the Journal officiel); Digithèque MJP, Niger chronology; HGA VIII table 5.1; Office of the Historian, Niger                         |
| Cameroon                                | German protectorate from the Douala treaty of 12 July 1884; French and British mandates after 1916                                                                                                                                                                                                                        | 1 Jan. 1960 (French part)                                                                                                                                                                                   | CMR fiche; HGA VII p. 309; HGA VIII table 5.1                                                                                                                                            |
| Central African Republic (Ubangi-Shari) | French post at Bangui 1889; annexation 1894 (« établissements de l'Oubanghi », decree of 13 July 1894); territoire de l'Oubangui-Chari by the decree of 29 Dec. 1903                                                                                                                                                      | 13 Aug. 1960                                                                                                                                                                                                | Digithèque MJP, Centrafrique chronology and Oubangui-Chari 1894; HGA VIII table 5.1                                                                                                      |
| Chad                                    | decree of 5 Sept. 1900 creating the « territoire militaire des pays et protectorats du Tchad » (the 1890 Franco-British convention only left the region to France)                                                                                                                                                        | 11 Aug. 1960                                                                                                                                                                                                | Digithèque MJP, Tchad, decree of 5 Sept. 1900; HGA VIII table 5.1                                                                                                                        |
| Congo (Brazzaville)                     | Congo français, decree of 27 April 1886; Moyen-Congo 1903                                                                                                                                                                                                                                                                 | 15 Aug. 1960                                                                                                                                                                                                | COG fiche; HGA VIII table 5.1                                                                                                                                                            |
| DR Congo                                | Congo Free State 2 May 1885; Belgian Congo 18 Nov. 1908                                                                                                                                                                                                                                                                   | 30 June 1960                                                                                                                                                                                                | HGA VIII table 5.1; COD fiche                                                                                                                                                            |
| Gabon                                   | French station on the estuary from the convention of 9 Feb. 1839 with Kowé Rapontchombo (« Roi Denis »); Libreville an enclave by 1880; colony separate from the Moyen-Congo 1903. The interior stays `polity` after 1839 (ruled 2026-10-10)                                                                              | 17 Aug. 1960                                                                                                                                                                                                | HGA VIII table 5.1; HGA VII fr. p. 495; Digithèque MJP, Gabon 1839                                                                                                                       |
| Kenya                                   | none by 1880; East Africa Protectorate, then Kenya Colony 1920                                                                                                                                                                                                                                                            | 12 Dec. 1963                                                                                                                                                                                                | HGA VII pp. 1, 659; HGA VIII table 5.1                                                                                                                                                   |
| Tanzania (Tanganyika)                   | none by 1880; German annexations from 1883 (German East Africa), then British territory under the Tanganyika Order in Council 1920                                                                                                                                                                                        | 9 Dec. 1961                                                                                                                                                                                                 | HGA VII pp. 1, 49, 309; HGA VIII table 5.1; Tanganyika Independence Act 1961 s. 1                                                                                                        |
| Zanzibar                                | British protectorate from Nov. 1890; the Omani sultanate before it is `polity` (ruled 2026-10-10)                                                                                                                                                                                                                         | 10 Dec. 1963; part of Tanzania from 26–27 April 1964                                                                                                                                                        | HGA VII p. 57; HGA VIII table 5.1; Zanzibar Act 1963 s. 1                                                                                                                                |
| Uganda                                  | none by 1880; protectorate proclaimed over Buganda in 1894                                                                                                                                                                                                                                                                | 9 Oct. 1962                                                                                                                                                                                                 | HGA VII pp. 1, 57, 182; HGA VIII table 5.1; Uganda Independence Act 1962 s. 1                                                                                                            |
| Malawi (Nyasaland)                      | none by 1880; British protectorate proclaimed over the Shire province 21 Sept. 1889; British Central Africa 1891, later Nyasaland                                                                                                                                                                                         | 6 July 1964                                                                                                                                                                                                 | HGA VII p. 1; H. H. Johnston, _British Central Africa_, 1897, p. 86 n. 1; HGA VIII table 5.1; Office of the Historian, Malawi                                                            |
| Burundi                                 | none by 1880; German colonisation from 1890, protectorate treaty 6 June 1903 (1903 is `colonial`, ruled 2026-10-10); Belgian mandate 1919, then Ruanda-Urundi                                                                                                                                                             | 1 July 1962                                                                                                                                                                                                 | HGA VII pp. 1, 309; Digithèque MJP, Burundi chronology; HGA VIII table 5.1; BDI fiche                                                                                                    |
| Sudan                                   | Turco-Egyptian rule 1821–1885, colonial by operator ruling (see below); Mahdist state 1881–1898, « national independence »; Anglo-Egyptian condominium 1899                                                                                                                                                               | 1 Jan. 1956                                                                                                                                                                                                 | HGA VII pp. 77, 453–454; HGA VIII table 5.1; SDN fiche                                                                                                                                   |
| South Sudan                             | as Sudan to 1956                                                                                                                                                                                                                                                                                                          | 9 July 2011                                                                                                                                                                                                 | SSD fiche                                                                                                                                                                                |
| South Africa                            | the Cape Colony and Natal well before 1880                                                                                                                                                                                                                                                                                | Union, 31 May 1910                                                                                                                                                                                          | HGA VII pp. 1, 194; HGA VIII table 5.1                                                                                                                                                   |
| Eswatini (Swaziland)                    | 1894 convention placing it under the Transvaal, resident commissioner 1895; British protectorate by the ordinance of 25 June 1903; the 1881 and 1884 conventions recognise its independence, so `polity` before 1894                                                                                                      | 6 Sept. 1968                                                                                                                                                                                                | HGA VII p. 237; Hertslet vol. II pp. 856, 903; Swaziland Independence Act 1968 s. 1; HGA VIII table 5.1                                                                                  |
| Zambia (Northern Rhodesia)              | British South Africa Company treaties north of the Zambezi, 1889–1891; « Rhodesia » proclaimed 3 May 1895; Northern Rhodesia 17 Aug. 1911                                                                                                                                                                                 | 24 Oct. 1964                                                                                                                                                                                                | Encyclopaedia Britannica 1911, vol. 23 p. 266; National Assembly of Zambia debates, 24 June 2011; Zambia Independence Act 1964 s. 1; HGA VIII table 5.1                                  |
| Zimbabwe (Southern Rhodesia)            | Mashonaland colony 12 Sept. 1890; Southern Rhodesia Order in Council 20 Oct. 1898; settler self-government 1923; UDI 11 Nov. 1965 – 12 Dec. 1979 stays `colonial`, with Ian Smith's white minority regime named in the text (ruled 2026-10-10)                                                                            | 18 April 1980                                                                                                                                                                                               | HGA VII p. 218; HGA VIII pp. 95, 295, 297 and table 5.1; Zimbabwe Act 1979 s. 1; UK National Archives CO 879/54/6                                                                        |
| Liberia                                 | « private colony » 1822–1847 (ruled 2026-10-10)                                                                                                                                                                                                                                                                           | 26 July 1847                                                                                                                                                                                                | HGA VIII table 5.1; Office of the Historian, Liberia                                                                                                                                     |
| Ethiopia                                | Italian occupation 1936–1941 only (ruled 2026-10-10)                                                                                                                                                                                                                                                                      | independent since antiquity; `modern` from 1941 (ruled 2026-10-10)                                                                                                                                          | HGA VIII table 5.1; Office of the Historian, Ethiopia (Addis Ababa occupied 6 May 1936)                                                                                                  |
| Tunisia                                 | Bardo treaty, 12 May 1881 (protectorate); not under European rule by 1880; `polity` from about 670 to 1880 (ruled 2026-10-10)                                                                                                                                                                                             | 20 March 1956                                                                                                                                                                                               | Digithèque MJP, Tunisie (1881, 1956); HGA VII p. 1; HGA VIII table 5.1                                                                                                                   |
| Seychelles                              | French stone of possession, 1 Nov. 1756 (founding act, rule 4); British from the treaty of 30 May 1814, a dependency of Mauritius; uninhabited before 1756, so no era before it (ruled 2026-10-10)                                                                                                                        | 29 June 1976 (ruled 2026-10-10; HGA VIII table 5.1 prints 26 June, and the fiche says so; the Seychelles Act 1976 and the Office of the Historian give 29 June)                                             | Seychelles Nation 2020; Seychelles News Agency 2019; Hertslet vol. II p. 714; Seychelles Act 1976 s. 1; Office of the Historian, Seychelles; HGA VIII table 5.1 (English edition p. 110) |
| Gambia                                  | an enclave by 1880                                                                                                                                                                                                                                                                                                        | 18 Feb. 1965                                                                                                                                                                                                | HGA VII fr. p. 495; HGA VIII table 5.1                                                                                                                                                   |
| Guinea-Bissau (Portuguese Guinea)       | colony separate from Cape Verde 1879, overseas province 1951; the republic proclaimed in the liberated zones on 24 Sept. 1973 is `colonial` (ruled 2026-10-10)                                                                                                                                                            | 10 Sept. 1974                                                                                                                                                                                               | HGA VIII table 5.1; Digithèque MJP, Guinea-Bissau                                                                                                                                        |
| Equatorial Guinea (Spanish Guinea)      | Fernando Poo ceded to Spain 1777; Río Muni ceded by France 1900; Spanish provinces 1959                                                                                                                                                                                                                                   | 12 Oct. 1968                                                                                                                                                                                                | HGA VIII table 5.1; Digithèque MJP, Equatorial Guinea                                                                                                                                    |
| Lesotho (Basutoland)                    | annexed as a Crown colony 12 March 1868                                                                                                                                                                                                                                                                                   | 4 Oct. 1966                                                                                                                                                                                                 | HGA VI fr. ch. 7, pp. 194–195; HGA VIII table 5.1; Lesotho Independence Act 1966                                                                                                         |
| Libya                                   | Italian colony from the Treaty of Ouchy, 18 Oct. 1912, to 1947; British and French administration 1943–1951                                                                                                                                                                                                               | 24 Dec. 1951                                                                                                                                                                                                | HGA VIII table 5.1; Office of the Historian, Libya                                                                                                                                       |
| Morocco                                 | French protectorate from the Treaty of Fez, 30 March 1912; Spanish zones from 27 Nov. 1912; the province of al-Maghrib al-Aqṣā before 710 is `polity` (ruled 2026-10-10)                                                                                                                                                  | 2 March 1956 (Spanish zones 1956–1969)                                                                                                                                                                      | HGA VIII table 5.1; Digithèque MJP, Morocco 1912 and 1956; HGA III fr. pp. 268–269                                                                                                       |
| Madagascar                              | French protectorate treaty 17 Dec. 1885; colony by the law of 6 Aug. 1896                                                                                                                                                                                                                                                 | 26 June 1960                                                                                                                                                                                                | HGA VIII table 5.1; Digithèque MJP, Madagascar 1896 and 1960                                                                                                                             |
| Mozambique                              | Portuguese coastal strips by 1880                                                                                                                                                                                                                                                                                         | 25 June 1975                                                                                                                                                                                                | HGA VII fr. p. 21; HGA VIII table 5.1                                                                                                                                                    |
| Algeria                                 | the Regency of Algiers, under Ottoman suzerainty from about 1519, is `polity` to 1830 (ruled 2026-10-10); French conquest from the capture of Algiers, 5 July 1830; « possessions françaises dans le nord de l'Afrique » 22 July 1834                                                                                     | 3 July 1962                                                                                                                                                                                                 | Digithèque MJP, Algeria chronology and Algérie coloniale 1830–1902; HGA VII p. 1; HGA VIII table 5.1                                                                                     |
| Egypt                                   | British intervention June 1882, a protectorate in fact; formal protectorate 18 Dec. 1914; 1882–1922 is `colonial` (ruled 2026-10-10). Antiquity is `polity` (ruled 2026-10-10)                                                                                                                                            | 28 Feb. 1922 (end of the protectorate); constitution of 19 April 1923                                                                                                                                       | Digithèque MJP, Egypt chronology; HGA VIII table 5.1                                                                                                                                     |
| Eritrea                                 | Assab bought 1869, under Italian government control by the decree of 5 July 1882; colonia Eritrea 1 Jan. 1890; British administration 1941–1952. Federation with Ethiopia 1952, full union 14 Nov. 1962: 1952–1993 carries no era until ruled (2026-10-10)                                                                | 24 May 1993                                                                                                                                                                                                 | Digithèque MJP, Eritrea; HGA VIII table 5.1 (Eritrea line)                                                                                                                               |
| Djibouti                                | Obock bought 11 March 1862; Djibouti founded 1888; Côte française des Somalis by the decree of 20 May 1896                                                                                                                                                                                                                | 27 June 1977 (ruled 2026-10-10: the loi constitutionnelle n° 1, the Digithèque MJP and the English table 5.1 give 27 June; the wave-1 batch reported 26 June, which no source opened for this table prints) | Digithèque MJP, Djibouti chronology and dj1859; HGA VIII table 5.1 (English edition p. 110)                                                                                              |
| Somalia (British Somaliland)            | British at Berbera 1884; protectorate on the coast east of Djibouti from 1887                                                                                                                                                                                                                                             | 26 June 1960; union with the former Italian territory 1 July 1960                                                                                                                                           | Digithèque MJP, Somalia; SOM fiche (HGA VII fr. pp. 105–106); HGA VIII table 5.1                                                                                                         |
| Somalia (Italian Somaliland)            | Italian protectorates over the Benadir sultanates from 1888–1889 (Hobyo 8 Feb. 1889, Majerteen 7 April 1889); colony by the law of 7 April 1908; British administration 1941–1950; UN trust under Italy from 1 April 1950                                                                                                 | 1 July 1960                                                                                                                                                                                                 | Digithèque MJP, Somalia; HGA VIII table 5.1                                                                                                                                              |
| Mauritania                              | French « Mauritanie occidentale » by a ministerial decision of 30 Dec. 1899; protectorate of the « pays mauritaniens du bas Sénégal » by the decree of 12 March 1903; territoire civil 1904; colony by the decree of 4 Dec. 1920. Roman Mauretania, a different territory to the north, carries no era (ruled 2026-10-10) | 28 Nov. 1960                                                                                                                                                                                                | Digithèque MJP, Mauritania chronology and Colonie de Mauritanie 1821–1920; MRT fiche (Ould Mohamed Baba 2019); HGA VIII table 5.1                                                        |
| Sierra Leone                            | Freetown and its peninsula colonial from 1787, a Crown colony from 1808; the interior `polity` until the hinterland was annexed and the Protectorate Ordinance of 1896 applied                                                                                                                                            | 27 April 1961                                                                                                                                                                                               | SLE fiche (HGA VI fr. pp. 105, 697); HGA VII pp. 141, 263 (English edition); HGA VIII table 5.1; Sierra Leone Independence Act 1961                                                      |
| Angola                                  | the colony of Angola founded 1575, Luanda 1576; the interior conquered later, an occupation begun in the 1880s and completed well into the 20th century                                                                                                                                                                   | 11 Nov. 1975                                                                                                                                                                                                | HGA V p. 558 and HGA VII p. 37 (English edition); HGA VIII table 5.1; Office of the Historian, Angola                                                                                    |
| Cabo Verde                              | uninhabited before settlement (no era); settled by the Portuguese from 1462, Santiago the capital                                                                                                                                                                                                                         | 5 July 1975                                                                                                                                                                                                 | HGA IV p. 319 (English edition); Digithèque MJP, Cap-Vert; HGA VIII table 5.1                                                                                                            |
| São Tomé and Príncipe                   | uninhabited before settlement: the 1483 chart and the 1471–1480 landing carry no era (ruled 2026-10-10); Portuguese colonisation of São Tomé from 1485                                                                                                                                                                    | 12 July 1975                                                                                                                                                                                                | STP fiche (Caldeira, _Anais de História de Além-Mar_ XI, p. 177); HGA VIII table 5.1                                                                                                     |
| Mauritius                               | uninhabited before settlement: the 1598 naming and the 1505 Portuguese name carry no era (ruled 2026-10-10); Dutch settlement 1638–1710; French possession 20 Sept. 1715; taken by Britain 1810, ceded 1814                                                                                                               | 12 March 1968                                                                                                                                                                                               | Digithèque MJP, Maurice chronology; MUS fiche (HGA V fr. pp. 936, 939); HGA VIII table 5.1                                                                                               |
| Comoros                                 | Mayotte French by the treaty of 25 April 1841; protectorates over Grande Comore, Anjouan and Mohéli 1886; colony attached to Madagascar by the law of 25 July 1912; overseas territory 1946                                                                                                                               | 6 July 1975 (Mayotte stays French)                                                                                                                                                                          | Digithèque MJP, Comores chronology; HGA VIII table 5.1                                                                                                                                   |
| Botswana (Bechuanaland)                 | southern Bechuanaland a British colony 1884–1885; protectorate over northern Bechuanaland 1885                                                                                                                                                                                                                            | 30 Sept. 1966                                                                                                                                                                                               | HGA VII p. 211 (English edition); HGA VIII table 5.1; Botswana Independence Act 1966; Office of the Historian, Botswana                                                                  |
| Namibia (South West Africa)             | German annexation of South West Africa from the end of 1883; South African conquest 1914–1915, then mandate; renamed Namibia by the UN on 12 June 1968                                                                                                                                                                    | 21 March 1990                                                                                                                                                                                               | HGA VII p. 28 (English edition); NAM fiche (HGA VII fr. pp. 312–313; UN resolution 2372); HGA VIII table 5.1; Office of the Historian, Namibia                                           |
| Rwanda                                  | German colonisation from 1890; the 1903 accounts are `colonial` (ruled 2026-10-10); Belgian mandate 1919, then Ruanda-Urundi                                                                                                                                                                                              | 1 July 1962                                                                                                                                                                                                 | Digithèque MJP, Rwanda chronology and Ruanda-Urundi 1919; HGA VIII table 5.1; Office of the Historian, Rwanda                                                                            |

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
- **Transvaal (South African Republic) before 1902 — not ruled.** HGA VIII
  notes that the Transvaal and the Orange Free State were independent
  republics until 31 May 1902. Whether an account set there is `polity` or
  `colonial` is open; the Magwamba account of 1892 (`PPL_TSONGA`) stays
  without an era until the operator rules.
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
leaves open are listed above: the Transvaal before 1902, Eritrea 1952–1993,
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
- **Transvaal before 1902, not ruled.** Magwamba in 1900 (Keane).
- **The period dates the event, not the publication.** Lingala, « Avant
  1901, selon cette lecture » (Mpoke Mimpongo, read in 2024); Shona,
  « XIXe siècle » (the Zimbabwe government, undated).
- **Europe.** _Race_, the Italian etymology proposed in 1959.
