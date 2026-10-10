---
title: "Colonial periods: the reference table behind a name-history account's era"
status: "proposed — awaiting operator review, 2026-10-09; Sudan 1821–1885, South Africa 1959–1994 and the 1877 Alur letter ruled 2026-10-10"
related:
  - docs/editorial/strategy/name-history-timeline-2026-10-08.md
  - docs/editorial/strategy/name-history-priority-core.md
  - src/lib/afrik/parsers/nameHistoryParser.ts
  - src/lib/search/nameTimeline.ts
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
7. **A period that crosses eras gets no era**: « Depuis 1821 »,
   « Proposée en 1887, reprise en 1994 », « XIXe siècle à aujourd'hui ».
8. **When in doubt, leave it out** and list the account for the operator.
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
- **Independence dates**: HGA VIII, ch. 5, table 5.1 « Chronology of African
  independence », pp. 108–110, unless a fiche cites a closer source.

## Territories the current fiches need

Dates in the « colonial from » column are the reference points for accounts
that fall near them; accounts far from any boundary do not depend on their
precision. « by 1880 » means HGA VII, p. 1.

| Territory                               | Colonial from                                                                                                                                                                     | Modern from                                                                         | Sources (opened)                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Senegal                                 | coastal and island areas by 1880; conquest from 1854; Walo and northern Cayor annexed by 1880, upper Senegal states a protectorate from 1860                                      | 20 June 1960 (Mali Federation), 20 Aug. 1960                                        | HGA VII pp. 1, 117; HGA VIII table 5.1                                                  |
| Mali (French Soudan)                    | conquest of the 1880s–1890s: Gallieni commandant-supérieur 1886–1888, Koundian 1889, Ségou 1890, Samori captured 1898                                                             | 20 June 1960, Republic 22 Sept. 1960                                                | HGA VII pp. 36, 313; HGA VIII table 5.1; MLI fiche                                      |
| Guinea                                  | Guinée française organised by the decree of 10 March 1893; Samori captured 1898                                                                                                   | 2 Oct. 1958                                                                         | CIV fiche (decree of 10 March 1893); HGA VII p. 36; HGA VIII table 5.1                  |
| Côte d'Ivoire                           | Grand-Bassam and Assinie posts from the 1842–1843 treaties; colony by the decree of 10 March 1893; Baule country occupied after 1898; Bété country conquered 1907–1912            | 7 Aug. 1960                                                                         | CIV fiche; HGA VII pp. 1, 130; PPL_BETE fiche (Dozon)                                   |
| Burkina Faso (Upper Volta)              | after 1895: the Mogho Naba still dealt with France as a sovereign in 1895                                                                                                         | 5 Aug. 1960                                                                         | HGA VII pp. 3, 5; HGA VIII table 5.1                                                    |
| Ghana (Gold Coast)                      | southern Gold Coast by 1880                                                                                                                                                       | 6 March 1957                                                                        | HGA VII pp. 1, 131; HGA VIII table 5.1; GHA fiche                                       |
| Togo                                    | not before 1880 (absent from Boahen's list); German colony                                                                                                                        | 27 April 1960                                                                       | HGA VII pp. 1, 289; HGA VIII table 5.1                                                  |
| Benin (Dahomey)                         | Porto-Novo by 1880; the kingdom of Abomey fought France in the 1890s                                                                                                              | 1 Aug. 1960                                                                         | HGA VII pp. 1, 127; HGA VIII table 5.1                                                  |
| Nigeria                                 | Lagos island by 1880; the rest conquered 1890–1914                                                                                                                                | 1 Oct. 1960                                                                         | HGA VII p. 1; HGA VIII table 5.1                                                        |
| Niger                                   | French rule (no account sits near its start)                                                                                                                                      | 3 Aug. 1960                                                                         | HGA VIII table 5.1; Office of the Historian, Niger                                      |
| Cameroon                                | German protectorate from the Douala treaty of 12 July 1884; French and British mandates after 1916                                                                                | 1 Jan. 1960 (French part)                                                           | CMR fiche; HGA VII p. 309; HGA VIII table 5.1                                           |
| Central African Republic (Ubangi-Shari) | French rule, effective date not settled here                                                                                                                                      | 13 Aug. 1960                                                                        | HGA VIII table 5.1                                                                      |
| Congo (Brazzaville)                     | Congo français, decree of 27 April 1886; Moyen-Congo 1903                                                                                                                         | 15 Aug. 1960                                                                        | COG fiche; HGA VIII table 5.1                                                           |
| DR Congo                                | Congo Free State 2 May 1885; Belgian Congo 18 Nov. 1908                                                                                                                           | 30 June 1960                                                                        | HGA VIII table 5.1; COD fiche                                                           |
| Gabon                                   | French station on the estuary from the convention of 9 Feb. 1839 with Kowé Rapontchombo (« Roi Denis »); Libreville an enclave by 1880; colony separate from the Moyen-Congo 1903 | 17 Aug. 1960                                                                        | HGA VIII table 5.1; HGA VII fr. p. 495; Digithèque MJP, Gabon 1839                      |
| Kenya                                   | none by 1880; East Africa Protectorate, then Kenya Colony 1920                                                                                                                    | 12 Dec. 1963                                                                        | HGA VII pp. 1, 659; HGA VIII table 5.1                                                  |
| Tanzania (Tanganyika)                   | none by 1880; German East Africa, then British mandate                                                                                                                            | 9 Dec. 1961                                                                         | HGA VII pp. 1, 309; HGA VIII table 5.1                                                  |
| Malawi (Nyasaland)                      | none by 1880; British                                                                                                                                                             | 6 July 1964                                                                         | HGA VII p. 1; HGA VIII table 5.1                                                        |
| Burundi                                 | none by 1880; German East Africa, then Belgian Ruanda-Urundi                                                                                                                      | 1 July 1962                                                                         | HGA VII pp. 1, 309; HGA VIII table 5.1; BDI fiche                                       |
| Sudan                                   | Turco-Egyptian rule 1821–1885, colonial by operator ruling (see below); Mahdist state 1881–1898, « national independence »; Anglo-Egyptian condominium 1899                       | 1 Jan. 1956                                                                         | HGA VII pp. 77, 453–454; HGA VIII table 5.1; SDN fiche                                  |
| South Sudan                             | as Sudan to 1956                                                                                                                                                                  | 9 July 2011                                                                         | SSD fiche                                                                               |
| South Africa                            | the Cape Colony and Natal well before 1880                                                                                                                                        | Union, 31 May 1910                                                                  | HGA VII pp. 1, 194; HGA VIII table 5.1                                                  |
| Liberia                                 | « private colony » 1822–1847                                                                                                                                                      | 26 July 1847                                                                        | HGA VIII table 5.1; Office of the Historian, Liberia                                    |
| Gambia                                  | an enclave by 1880                                                                                                                                                                | 18 Feb. 1965                                                                        | HGA VII fr. p. 495; HGA VIII table 5.1                                                  |
| Guinea-Bissau (Portuguese Guinea)       | colony separate from Cape Verde 1879, overseas province 1951                                                                                                                      | 10 Sept. 1974 (republic proclaimed in the liberated zones 24 Sept. 1973: see below) | HGA VIII table 5.1; Digithèque MJP, Guinea-Bissau                                       |
| Equatorial Guinea (Spanish Guinea)      | Fernando Poo ceded to Spain 1777; Río Muni ceded by France 1900; Spanish provinces 1959                                                                                           | 12 Oct. 1968                                                                        | HGA VIII table 5.1; Digithèque MJP, Equatorial Guinea                                   |
| Lesotho (Basutoland)                    | annexed as a Crown colony 12 March 1868                                                                                                                                           | 4 Oct. 1966                                                                         | HGA VI fr. ch. 7, pp. 194–195; HGA VIII table 5.1; Lesotho Independence Act 1966        |
| Libya                                   | Italian colony from the Treaty of Ouchy, 18 Oct. 1912, to 1947; British and French administration 1943–1951                                                                       | 24 Dec. 1951                                                                        | HGA VIII table 5.1; Office of the Historian, Libya                                      |
| Morocco                                 | French protectorate from the Treaty of Fez, 30 March 1912; Spanish zones from 27 Nov. 1912                                                                                        | 2 March 1956 (Spanish zones 1956–1969)                                              | HGA VIII table 5.1; Digithèque MJP, Morocco 1912 and 1956                               |
| Madagascar                              | French protectorate treaty 17 Dec. 1885; colony by the law of 6 Aug. 1896                                                                                                         | 26 June 1960                                                                        | HGA VIII table 5.1; Digithèque MJP, Madagascar 1896 and 1960                            |
| Mozambique                              | Portuguese coastal strips by 1880                                                                                                                                                 | 25 June 1975                                                                        | HGA VII fr. p. 21; HGA VIII table 5.1                                                   |
| Ethiopia                                | Italian occupation 1936–1941 only                                                                                                                                                 | independent since antiquity                                                         | HGA VIII table 5.1; Office of the Historian, Ethiopia (Addis Ababa occupied 6 May 1936) |

Sources opened for this table:

- _UNESCO General History of Africa, VII: Africa under Colonial Domination
  1880–1935_, ed. A. Adu Boahen, 1985 (1991 printing), read from the PDF that
  South African History Online hosts
  (sahistory.org.za/archive/general-history-africa-volume-vii-africa-under-colonial-domination-1880-1935).
- _UNESCO General History of Africa, VIII: Africa since 1935_, ed. A. A. Mazrui,
  1993, same host, table 5.1.
- US Department of State, Office of the Historian, country pages for Liberia,
  Ethiopia, Nigeria, Niger and Tanzania (history.state.gov/countries/…).
- _Histoire générale de l'Afrique_, French edition (unesdoc): VI, ch. 7
  (Ngwabi Bhebe), pp. 194–195; VII, ch. 1 (A. Adu Boahen), p. 21, the French
  page of Boahen's 1880 list; VII, ch. 18 (John Charles Caldwell), p. 495.
- Digithèque MJP (Université de Perpignan), country pages for Gabon,
  Guinea-Bissau, Equatorial Guinea, Libya, Morocco and Madagascar.
- The decrees, treaties and constitutions the pays fiches already cite (CIV,
  CMR, COD, COG, MLI, SDN, BDI).

## The cases a date cannot settle

- **Ethiopia.** No colonial era except the Italian occupation, 1936–1941. An
  Ethiopian account is `polity` before 1936 and `colonial` during the
  occupation. Proposed: `modern` from 1941; the operator confirms. No current
  account depends on it: the three Galla accounts are undated and span four
  centuries, so they carry no era.
- **Liberia.** A « private colony » of the American Colonization Society from
  1822, a republic from 26 July 1847 (HGA VIII). Proposed: `polity` before
  1822, `colonial` 1822–1847, `modern` from 1847. One account touches it
  (Kamana, 1899) and stays undecided, since the Vai live in Liberia and in
  Sierra Leone, a British protectorate at that date.
- **South Africa — ruled 2026-10-10.** HGA VIII dates independence to the
  Union, 31 May 1910, and notes white minority rule. An account about
  apartheid South Africa (Bantou, 1959–1994) stays `modern`, as the table
  reads; the operator asks that its text name apartheid, which it does.
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
- **Guinea-Bissau, 24 September 1973.** The PAIGC proclaimed the Republic
  of Guinea-Bissau in the zones it held, while Portugal still ruled Bissau
  until 10 September 1974 (preamble of the 1984 Constitution; HGA VIII table
  5.1). The account of that proclamation is left without an era for the
  operator.
- **Morocco before 710.** Hussain Monès dates the province of al-Maghrib
  al-Aqṣā to the Arab conquest, before 710 (HGA III fr., pp. 268–269). The
  table has no ruling on the Arab conquest of North Africa, so the account
  is left without an era for the operator.
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
