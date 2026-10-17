---
title: "Name-history priority core: the subjects enriched before the timeline ships"
status: "proposed — awaiting operator review, 2026-10-09"
related:
  - docs/editorial/strategy/name-history-timeline-2026-10-08.md
  - docs/audience/audit-2026-10-08.md
  - docs/editorial/doctrine.md
  - docs/editorial/strategy/name-history-long-tail-waves.md
---

# Name-history priority core

The [timeline decision](name-history-timeline-2026-10-08.md) makes the
priority core its release gate: the timeline ships once these subjects carry a
complete `nameHistory` block. This file is that list. The operator sets the
final number; the list below proposes 53 subjects.

## Where the evidence comes from, and how thin it is

Read this before trusting the order of the list.

- **Plausible search queries (Q).** `search:submit` carries the typed text as a
  `query` property on the result page since 2026-09-29
  (`src/lib/analytics/searchQueryProp.ts`). Read on 2026-10-09 from the public
  stats API, so the window is about ten days. **The search modal sends no
  query** — a deliberate choice recorded in
  `src/components/search/SearchModalV2.tsx` — and most `search:submit` events
  carry none: 307 of the 396 events since June have no query. Every query
  below comes from one to seven visitors. A query shows interest, not a ranking.
- **Plausible fiche visits (P).** Unique visitors to the fiche page, 2026-06-01
  to 2026-10-09. The busiest fiche, `PPL_FULA`, has 11. These are consented
  sessions only (the audit's floor, not the audience).
- **TikTok search queries (T).** The five queries the
  [2026-10-08 audit](../../audience/audit-2026-10-08.md) recorded, each 0.7 % of
  seven days of TikTok traffic.
- **Social posts (S).** Posts and `utm_campaign` rows named in the same audit.
- **Operator (O).** The eight examples the operator gave on 2026-10-08.

**Not read:** Search Console. No access from the session that wrote this
list; it is the largest missing signal, since search engines and AI answers
bring most visitors. Re-rank the list once it is read, and again when a month
of query text has accumulated.

Queries that point to no clear subject are left out: « mamba » (3 events from
one visitor), « lakiss », « ketika », and the family-name searches « les de
familles birifor » (counted under Birifor).

## The list

Status: `pilot` = written in full in the phase-1 pull request for the operator
to judge the format; `done` = written in full in the priority-core pull request; `todo` = not yet written; `partial` = carries a
`nameHistory` folded from an old name record, to complete.

| #   | Subject (as searched) | Type        | Fiche                                      | Evidence                                                                                                               | Status |
| --- | --------------------- | ----------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Peul                  | people      | `PPL_FULA`                                 | O; Q « peul » 7 visitors, plus « puel », « fulbe », « fulbé », « gulbe »; P 11, the busiest fiche; S YouTube « Fulbe » | pilot  |
| 2   | Lingala               | language    | `lin`                                      | O; Q 7 visitors; T « origine du lingala et son ascension »; S YouTube « Lingala : un nom, plusieurs lectures »         | pilot  |
| 3   | Mali                  | country     | `MLI`                                      | O; P 5. No « mali » query recorded                                                                                     | pilot  |
| 4   | Côte d'Ivoire         | country     | `CIV`                                      | O; Q 2; P 7, a dead end in the audit; S campaign `bouet-willaumez-a-t-il-invente-la-cote-divoire` (4 visits)           | done   |
| 5   | Traoré                | family name | `PAT_TRAORE`                               | O; Q « traore » 2, « traoré » 1, « tarawele » 1; P 8; S campaign `traore-diop`                                         | done   |
| 6   | Coulibaly             | family name | `PAT_COULIBALY`                            | O; P 4; S Instagram « Keïta et Coulibaly » (16.9K views)                                                               | done   |
| 7   | Gagnoa                | place       | `LOC_GAGNOA`                               | O only                                                                                                                 | done   |
| 8   | Daloa                 | place       | `LOC_DALOA`                                | O; Q 1                                                                                                                 | done   |
| 9   | Mandé, Manden         | family      | `FLG_MANDE`                                | P 10, a dead end in the audit; T « mandingue et diola »; S campaign `manden-mande-mandingue-trois-mots`                | done   |
| 10  | Bantou                | family      | `FLG_BANTU`                                | Q 3; P 6                                                                                                               | done   |
| 11  | Guinée                | country     | `GIN`                                      | Q « guinée » 3, « guinee » 1; P 4; S Instagram « La Guinée, c'est vingt-neuf peuples » (25.2K), YouTube « première »   | done   |
| 12  | Soninké               | people      | `PPL_SONINKE`                              | T « dou viens les soninke »; P 5, the longest reading on a fiche                                                       | done   |
| 13  | Nzebi                 | people      | `PPL_NZEBI`                                | T « nzibi gabon »; Q 1; P 5                                                                                            | done   |
| 14  | Mandingue, Malinké    | people      | `PPL_MALINKE` (see also `PPL_MANDE_MACRO`) | T « mandingue et diola »; P `PPL_MANDE_MACRO` 3                                                                        | done   |
| 15  | Diola                 | people      | `PPL_DIOLA` (`PPL_JOLA` folded in)         | T « mandingue et diola »                                                                                               | done   |
| 16  | Mot « race »          | free word   | `WRD_RACE`                                 | Q 1; S Instagram « D'où vient le mot race ? » (104K views, the top post)                                               | done   |
| 17  | Swahili               | language    | `swh`                                      | S Instagram « D'où vient le nom swahili ? » (9.6K views)                                                               | done   |
| 18  | Soudan                | country     | `SDN`                                      | S YouTube « Soudan : un nom, plusieurs pays »                                                                          | done   |
| 19  | Soudan du Sud         | country     | `SSD`                                      | Q 1                                                                                                                    | done   |
| 20  | Bété                  | people      | `PPL_BETE`                                 | Q 1; P 7                                                                                                               | done   |
| 21  | Diallo                | family name | `PAT_DIALLO`                               | P 5                                                                                                                    | done   |
| 22  | Diarra                | family name | `PAT_DIARRA`                               | P 5                                                                                                                    | done   |
| 23  | Keïta                 | family name | `PAT_KEITA`                                | Q 1; P 2; S Instagram « Keïta et Coulibaly »                                                                           | done   |
| 24  | Congo                 | country     | `COG`                                      | Q 1; P 7                                                                                                               | done   |
| 25  | RD Congo              | country     | `COD`                                      | P 5                                                                                                                    | done   |
| 26  | Cameroun              | country     | `CMR`                                      | Q 1; P 5                                                                                                               | done   |
| 27  | Kenya                 | country     | `KEN`                                      | P 6                                                                                                                    | done   |
| 28  | Sénégal               | country     | `SEN`                                      | Q 1 visitor, 3 events                                                                                                  | done   |
| 29  | Bénin                 | country     | `BEN`                                      | Q 1; P 3                                                                                                               | done   |
| 30  | Burundi               | country     | `BDI`                                      | Q 1; P 3                                                                                                               | done   |
| 31  | Ghana                 | country     | `GHA`                                      | P 3; told beside Mali, which took an empire's name the same way                                                        | done   |
| 32  | Alur                  | people      | `PPL_ALUR`                                 | P 6                                                                                                                    | done   |
| 33  | Birifor               | people      | `PPL_LOBI_BIRIFOR`                         | Q 4 searches by 1 visitor (« les nom de familles birifor »…); P 5                                                      | done   |
| 34  | Manja                 | people      | `PPL_MANJA`                                | P 5                                                                                                                    | done   |
| 35  | Basaa (Cameroun)      | people      | `PPL_BASSA_CAM`                            | Q « basaa », « baasa », « bassa du cameroun », 1 visitor each. P 4 went to `PPL_BASSA`, the Liberian Bassa             | done   |
| 36  | Dogon                 | people      | `PPL_DOGON`                                | Q 1                                                                                                                    | done   |
| 37  | Igbo                  | people      | `PPL_IGBO`                                 | Q 1                                                                                                                    | done   |
| 38  | Kongo                 | people      | `PPL_KONGO`                                | Q 1                                                                                                                    | done   |
| 39  | Luba                  | people      | `PPL_LUBA`                                 | Q 1                                                                                                                    | done   |
| 40  | Songhaï               | people      | `PPL_SONGHAI`                              | Q 1                                                                                                                    | done   |
| 41  | Zarma                 | people      | `PPL_ZARMA`                                | Q « zarma (ou zerma) » 1; P 4                                                                                          | done   |
| 42  | Nyakyusa              | people      | `PPL_NYAKYUSA`                             | Q « wanyakyusa » 1                                                                                                     | done   |
| 43  | Bambara               | people      | `PPL_BAMBARA`                              | P 4                                                                                                                    | done   |
| 44  | Dioula                | people      | `PPL_DIOULA`                               | P 3                                                                                                                    | done   |
| 45  | Ouédraogo             | family name | `PAT_OUEDRAOGO`                            | Q 1                                                                                                                    | done   |
| 46  | Sawadogo              | family name | `PAT_SAWADOGO`                             | Q 1                                                                                                                    | done   |
| 47  | Kouassi               | family name | `PAT_KOUASSI`                              | Q 1                                                                                                                    | done   |
| 48  | Lawson                | family name | `PAT_LAWSON`                               | Q 1                                                                                                                    | done   |
| 49  | Camara                | family name | `PAT_CAMARA`                               | P 3                                                                                                                    | done   |
| 50  | Touré                 | family name | `PAT_TOURE`                                | P 3                                                                                                                    | done   |
| 51  | Dramé                 | family name | `PAT_DRAME`                                | Q « drame », « dramé », 1 visitor, 4 events                                                                            | done   |
| 52  | Essono                | family name | to create                                  | Q « esono », « essono », 1 visitor; no source found                                                                    | todo   |
| 53  | Sacko                 | family name | `PAT_SACKO`                                | Q 1                                                                                                                    | done   |

## What the pilots settle, and what they leave to the operator

The three pilots (Peul, lingala, Mali) are written to the
[register's tile patterns](../reader-facing-register.md) so the operator can
judge the format before the other 50 are written. Points left open for that
review:

- **Italics — ruled 2026-10-09.** Names cited in a tile are set in italics by
  the timeline UI; the fiche text stays plain, because the surfaces that show
  it today parse no markup. The rule is in the register's tile section.
- **Second-hand traces.** Several births rest on a trace an author reports
  rather than on a document the project has read (for Peul, D'Eichtal in 1842
  through Tauxier). The source note says so each time. The operator decides
  whether a reported trace may be a birth.
- **Wave 3 of the long tail — ruled 2026-10-11, to upgrade.** Kept as
  written, each to be replaced when a better source is read:
  - the two Gusii hypotheses (`PPL_KISII`) rest on Jens Finke's site, which
    cites William R. Ochieng' (1986): read Ochieng' and cite him directly;
  - the Danakil birth (`PPL_AFAR`) rests on an undated encyclopedia (Gale's
    _Encyclopedia of World Cultures_), kept as a second-hand trace: replace
    it with the Arab geographers it reports;
  - births on an inferred close form or a second-hand bibliography, each
    said as such on its tile: Wamia/« Omia » (`PPL_ITESO`), Wayao
    (`PPL_YAO`), Burton's « Watosi » (`PPL_RWANDAIS_TUTSI`,
    `PPL_TUTSI_BURUNDI`), Bowdich's Gooroosie and Goorooma
    (`PPL_GOUROUNSI`, `PPL_GOURMANTCHE`);
  - unofficial archive.org uploads, marked « copie non officielle »: Kuper
    (`PPL_SWAZI`), Hart (`PPL_RIFAIN`) and Greene (`PPL_ANLO`): replace
    each with a publisher's or a library's copy.

  The self-names kept on a language or genealogical name are on
  [the oral verification list](self-names-to-verify-orally.md).

- **Waves 4 and 5 of the long tail — ruled 2026-10-11, to upgrade.** Kept as
  written, each to be replaced when a better source is read:
  - the Frafra hypothesis (`PPL_FRAFRA`) rests on a single opinion piece in
    the _Daily Graphic_ (Tijani Ndanyenbah, 2025): find a linguist or
    historian who states it;
  - Lovejoy and Ojo (2015) on Lucumí (`PPL_ANAGO`) are cited from the free
    abstract only: read the article;
  - the official spelling Ebira or Egbira (`PPL_EBIRA`): the 2020 and 2022
    gazettes have not been read; correct the spelling only once they are;
  - Bastos names the 1862 diarist « Edward Livingstone » (`PPL_MAKONDE`):
    his wording is kept, flagged on the tile, until the diary itself is read;
  - Braukämper's hypotheses on the Hadiya (`PPL_HADIYA`, and
    `PPL_SEBATBET`) are dated to the 2014 English edition, read in an
    unofficial copy: keep 2014, and replace the copy with a publisher's or a
    library's.

- **Waves 6 and 7 of the long tail — ruled 2026-10-11, to upgrade.** Kept
  as written, each to be replaced when a better source is read:
  - births read only through a catalogue or bibliography record: Gamst
    (1969) for the Qemant (`PPL_QEMANT`), Welch (1934) for the Isoko
    (`PPL_ISOKO`) and Hrbek (1984) for the Kabiyè (`PPL_KABYE`): read the
    works themselves;
  - community sources kept for a hypothesis, as carriers from inside the
    community: the Tembo Bible-translation manual (`PPL_TEMBO`) and the
    Mbunda community's own history (`PPL_MBUNDA`);
  - « Youssouf is a form of Yusuf », from Behind the Name with the
    _Dictionary of American Family Names_ (`PAT_YUSUF`, which now holds Youssouf): replace it if a
    scholarly source turns up; the Wikipedia-only Diouf list for the usage
    of Baradji and Maréga (`PAT_BARADJI`, `PAT_MAREGA`): replace it once
    Diouf (1998) is read;
  - Balogun as a family name (`PAT_BALOGUN`): find a source before adding a
    usage account;
  - Kollo (`PAT_KOLLO`) stays without a name history: the only material is
    a family testimony. It waits for an oral account recorded properly, or
    for a source we can open.

- **Waves 8 and 9 of the long tail — ruled 2026-10-11.** Source rulings:
  - community name dictionaries, such as Wikinames, YorubaNames or a
    similar lexicon made for one language's names, may support a hypothesis,
    always attributed to them in the text. Wikinames never supports a
    hypothesis alone;
  - « serviteur de Michel » for Ghebremichael (`PAT_GHEBREMICHAEL_PATRONYMIC`)
    is accepted as a conditional hypothesis: Leslau's dictionary gives the
    word gabr, « servant », not the name itself;
  - « Aliyu is the Hausa form of Ali » (`PAT_ALIYU`) rests on Behind the Name
    alone: kept, attributed, to replace if a scholarly source turns up;
  - births kept: Yaméogo in the American intelligence bulletin of 1960
    (`PAT_YAMEOGO`), Gnahore without its accent in 1969 (`PAT_GNAHORE`),
    the close form Kwate in Zimmermann's grammar of 1858 (`PAT_QUARTEY`),
    Niggli's list of 2008 for Tapsoba (`PAT_TAPSOBA`, not Delobsom 1932) and
    Hamilton's history of 1912 for the Safwa (`PPL_SAFWA`);
  - one title, one locator: when two printings of one work are cited at
    different addresses, the title carries the printing, as « (édition de
    Boston) » or « (édition de New York) »;
  - the Afizere community's own site is kept for now for the 1914 Jarawa
    birth: replace it with a published source.

  To upgrade or follow up:
  - Berta stays the current name of the people (`PPL_BERTA`). Wave 8
    reports that Benishangul officially replaced it in 2022: read the text
    of that decision before changing the fiche;
  - the language fiches `grb` and `wti` give later births than the new
    people fiches of the Grebo and the Berta: align them;
  - the self-names Ekid (`PPL_EKET`) and Ngbanya (`PPL_GONJA`) are on
    [the oral verification list](self-names-to-verify-orally.md).

- **Waves 10 and 11 of the long tail — ruled 2026-10-12.** Validator and
  self-names:
  - a people whose self-name no source gives: the block carries
    `selfNameUnknown: true` and its summary says plainly « On ne sait pas
    comment ce peuple se nomme lui-même ». The validator then accepts a
    people with no self-given name, and refuses `selfNameUnknown` beside a
    self-given name. Applied to `PPL_SHUA` (Shwakhwe, a name of the
    language, is no longer marked self-given) and to `PPL_HOA`, whose
    history is now written (ǂHoan, ǂHua, ǂ'Amkoe);
  - Basundi on `PPL_MANIANGA` is no longer self-given: Laman's dictionary
    (1936) and Van Bulck (1948), both read, do not say the Manianga call
    themselves so; Van Bulck counts them among the eastern Basundi.
    BaManianga stays self-given, on Mfuka's usage (1981);
  - Bakwé stays self-given on Delafosse (`PPL_BAKWE`). Srigbe,
    « devins-guérisseurs », is added as a self-name on Schwartz (1993,
    p. 88), the first scholarly source found for it.

  Classification (pre-wave fields), following `PAT_NYOBE` and
  `PAT_RAMGOOLAM`:
  - personal and birth names filed as clan names are now
    `non_hereditary_patronymic`, unit `individual`, each with a `nameSystem`
    gap saying the class is the closest one: `PAT_ZINSOU`, `PAT_TADROS`,
    `PAT_WANI`, `PAT_TSHISEKEDI`. `PAT_YAO` and `PAT_YOHANNES` already were;
  - `PAT_VIEIRA`, a family name of Portuguese origin, keeps `clan_name`, the
    closest class the model offers for a hereditary family name, with the
    lineage as its unit and a `nameSystem` gap saying it is not a Pepel clan;
  - `PAT_YALINGA` and `PAT_YAKITE` stay as they are: no source shows either
    as a family name. Review both for removal later.

  Sources:
  - a hypothesis that rests only on our own reading of a dictionary is
    dropped when a sourced reading exists (Leslau, on `PAT_WOLDE` and
    `PAT_TESHOME`, where the _Dictionary of American Family Names_ gives the
    sense), and kept, labelled as our reading, when it is the only origin
    (`PAT_WABERI`);
  - Yohannes gets a birth in Dillmann's _Lexicon linguae aethiopicae_
    (1865, col. 1421), written as a close form in Ge'ez script;
  - Vieira's account that rested on our own Papel fiche now cites Minority
    Rights Group (2007) for its use among the Pepel, and the _Dictionary of
    American Family Names_ adds a place-name origin;
  - Soumanou: the Benin ministry list (2024) no longer opens at its address,
    and it lists private applicants; the Islam West Africa Collection record
    replaces it;
  - Roscoe 1911 is cited at one locator, the corpus form, also on
    `PAT_MUKASA` (pp. 70 and 291 checked on that scan).

  Accepted as they are: Bajuni's birth in 1678, known second-hand through
  Nurse; BaManianga as self-given; a village as the birth of Tshibangu; the
  Vilakazi accounts of 1947 not restored until the Pretoria manuscript is
  read; Noirot's two editions kept apart (`PAT_SALIFOU`, `PAT_SOUMARE`);
  births read in a catalogue title, as for Kahn.

- **Waves 12 and 13 of the long tail — ruled 2026-10-12.** Source rulings:
  - one title, one locator for _Edhina Ekogidho_ (Saarelma-Maunumaa): the
    Helda handle 10138/151197 holds no file, so every fiche cites the open
    UNAM PDF that `PAT_IIPUMBU` already used (`PAT_POHAMBA`, `PAT_RIRUAKO`,
    `PAT_SHIKONGO`), with its pages;
  - _Basutoland Records_: the archive.org scan `basutolandrecor00theagoog`
    is vol. II (1853-1861), its title page says so, and `basutolandrecord01basu`
    is vol. I (1833-1852). `LSO` now cites vol. II, introduction p. v, for
    « Lesuto … changed into Basutoland »; `PAT_SEKHONYANA` cites vol. I. Each
    volume has one title;
  - Ibn Battûta, _Voyages_, tome II (`ldpd_5998008_001`): the title page reads
    « deuxième tirage », M DCCC LXXVII. `PAT_HASSAN` and `PAT_MOHAMED` now
    date it 1877, as tome IV is dated by its own second printing (1879);
  - `PPL_KAKWA` moves to the Nilotic family (`FLG_NILOTIQUE`): its sources
    place the Kakwa among the Bari, in Eastern Nilotic;
  - `PAT_OWUSU` is a personal name, as Christaller (1881) describes it:
    `non_hereditary_patronymic`, unit `individual`, following `PAT_NYOBE`
    and `PAT_RAMGOOLAM`. The model needs no `nameSystem` gap for it.
    `PAT_SANKARA` stays as it is until a second source turns up;
  - accepted as they are: the Ndyuka birth on Kahn's catalogue title of 1931
    (« Djuka », `PPL_OKANISI`); the Bugakhoe birth on a publisher's page
    (`PPL_BUGAKWE`); mandaras.info as a `community` source for Marva
    (`PPL_GIZIGA`) and Margyi (`PPL_MARGI`), second-hand and named; Saleh's
    usage on Behind the Name, attributed (`PAT_SALEH`); Hanks's Seidi
    hypothesis (`PAT_SEIDI`); the Diokoramé birth through Pageard, with the
    Tarikh's Zoghrâni as an uncertain trace (`PPL_DIAWAMBE`); the At Mẓab
    birth of 1985, second-hand (`PPL_MOZABITE`); the Garifuna birth of 1764,
    quoted by Young (`PPL_GARIFUNA`); Seselwa first on
    `PPL_FRANCO_SEYCHELLOIS`, with its caveat; Gran'bla not restored without
    a second source.

  To upgrade or follow up:
  - `PPL_JIE_SUD` stays unwritten until Verswijver (2015) is read;
  - the Polyglotta Africana URL sits under two titles and two kinds across
    the corpus: give it one;
  - Malagasy name meanings: look for a Malagasy anthroponymy source rather
    than build meanings from dictionary words;
  - `PPL_KAKWA` keeps a pre-wave note calling its classification contested
    (`whyProblematic`) and its `classificationStatus` « contested »: review
    them against the sources;
  - the self-names Tajuasohn (`PPL_TAIZI`), Marva (`PPL_GIZIGA`) and Margyi
    (`PPL_MARGI`) are on
    [the oral verification list](self-names-to-verify-orally.md).

- **What may be a birth — ruled 2026-10-10.** A close form may be a birth
  when the tile says so (« a une forme proche », Coulibaly and Koorabarri). A
  press article (Soudan du Sud, 2011), a form a chronicler gives as the
  local name (Enzaze for Zaïre) and a dated archive photo caption (Basaa,
  1902–1905) may be births too. For Sénégal the birth moves to Zurara's
  Çanaga (1453), read in facsimile; al-Bakrī's Sanghāna, known only through
  Delafosse, stays as an earlier, uncertain trace.
- **Summary account and hypothesis tiles — ruled 2026-10-09.** On
  `PPL_FULA`, the meaning account no longer retells the hypotheses that have
  their own tiles: it keeps what only it says and all its sources.

## Rulings of 2026-10-14: Fang naming and hereditary Maghreb family names

PR #1734 and #1742 left two classification questions open because the model
has five values (`clan_name`, `non_hereditary_patronymic`, `nisba`,
`praise_name`, `totemic_clan`) and no ruling said which one a Fang name or a
Ben/Bou/Aït family name belongs to. The rulings below stay inside the five
values and the unit field (`individual | lineage | clan | caste | age_set |
settlement | other`). The text of REQ-133, REQ-134 and DEC-040 lives on
Confluence and was not reread for this ruling; the contract used is
`public/modele-nom-patronyme.json`, the parser enum
`PATRONYME_NAME_SYSTEMS`, and the comment of migration 053, which describes
`non_hereditary_patronymic` by Ethiopian, Eritrean and eastern Fulɓe naming
and `nisba` in the « Arabo-Berber tribal sense ».

### A. Fang naming

**Rule.** A Fang name such as Esono, Mba, Nguema or Ondo is a personal name,
not a clan name. The father gives his child a name of its own and adds his
own name to it; the clan (the kin group) has a separate name that a Fang
gives to a stranger. File it `non_hereditary_patronymic`, unit `individual`,
with the usual `nameSystem` gap (« the model has no box for a personal name
that became a family name »), and `transmissionMode` `patrilineal` when the
fiche's own history says the father's name is passed on.

**Evidence, opened for this ruling.** Günter Tessmann, _Die Pangwe_, vol. 2
(Berlin, 1913), p. 285, in the Internet Archive scan
(`diepangwevlkerku02tess`):

- « Dem eigenen, vom Vater gegebenen Namen wird der des Vaters selbst
  angefügt. Heißt z. B. der Vater Essun, der Sohn Boka, so ist der
  vollständige Name des Boka Boka-Essun » (the child's own name, given by
  the father, takes the father's name after it; Tessmann's example is
  Boka-Essun);
- « Familiennamen in unserem Sinne kennen die Pangwe nicht. Fremden
  gegenüber vertritt ihn der Name der Sippe » (the Pangwe, his word for the
  Fang and their neighbours, have no family names in our sense; before a
  stranger the name of the kin group stands for it), to which the name of
  the mother's group is added (his example: Ayong-Boka, of the Essauong,
  child of a daughter of the Essatop);
- the child learns the names of his father, grandfather and great-grandfather
  on the paternal side (Ndungo, son of Essun, of the family Abai; Essun,
  son of Nsema): a chain of fathers' names, which is what the model's
  `patronymicChainDepth` field exists for.

Tessmann's photograph captions keep the two names apart: « Essun (Fam.
Omwang) » (vol. 1, p. 9), « Ondo aus Angönneuai (Fam. Omwang) » (vol. 1,
p. 11). The first word is the man's name, the family is the kin group. The
fiches `PAT_ESONO` and `PAT_ONDO` already cite both pages.

Bonifacio Nguema Obiang-Mikue, _La cultura para el reconocimiento de la
identidad: caso de la cultura fang de Guinea Ecuatorial_ (Revista Cátedra
6(1), 2023, pp. 178-179, DOI 10.29166/catedra.v6i1.4282), as the fiches
record it (read by the wave author, not reread here): the father's name
becomes the common name of all his children and is repeated from generation
to generation; Esono, Mba and Nguema are listed among Fang men's names that
Rosendo Ela Nsue Mibui (2005, pp. 92 and 102, not read) finds « netamente
originales », with no derivation. So today the father's name works as a
surname, which is why the gap says « personal name that became a family
name » and does not claim the name never passes on.

Fabrice Agyune Ndone, table n° 1 (`PAT_ONDO`): Ona, Ondo, Oyane and Sima are
listed as Fang personal names of Gabon. He also notes that family names
circulate almost always in a closed circuit from ascendant to descendant.
That is the only support for `PAT_ONDO`, and it does not say how the name is
passed: its `transmissionMode` stays `other`.

**What cannot be sourced.** No source opened here gives the list of Fang clan
names (ayong) to compare with the fiches. Whether Esono, Mba, Nguema or Ondo
is also, somewhere, the name of a clan is not established either way. The
ruling therefore rests on how the sources say Fang naming works, not on a
clan list.

**Applies to** (own `nameHistory`, no account tells a clan):

| Fiche        | Before             | After                                 | Own-history support                                     |
| ------------ | ------------------ | ------------------------------------- | ------------------------------------------------------- |
| `PAT_ESONO`  | clan_name, lineage | non_hereditary_patronymic, individual | « nom de personne fang », Tessmann p. 285, Obiang-Mikue |
| `PAT_MBA`    | clan_name, clan    | same, transmission patrilineal        | « nom de personne fang », father's name as second name  |
| `PAT_NGUEMA` | clan_name, clan    | same, transmission patrilineal        | « nom d'homme fang », Nguema Nsue example               |
| `PAT_ONDO`   | clan_name, clan    | same, transmission stays other        | Ndone's table of Fang personal names                    |

**Not changed.** `PAT_OVONO` (its history says nothing of Fang naming and
shows a Gabonese name carried alone or after another name); `PAT_ESSOMBA`
(Ewondo: the history tells a lineage name and a founder of lineages);
`PAT_MVONDO` (Eton: a clan and a lineage, with a founder, Onana 2015); and
the Fang or Beti fiches that have no `nameHistory` yet (`PAT_ATEBA`,
`PAT_BINDANG`, `PAT_ELA`, `PAT_MBASOGO`, `PAT_MENGUE`, `PAT_MINTSA`,
`PAT_NCHAMA`, `PAT_NDONG`, `PAT_NDONGO`, `PAT_NKOULOU`, `PAT_NSUE`,
`PAT_NZUE`, `PAT_OBAME`, `PAT_OBIANG`, `PAT_ONANA`). The rule needs a fiche's
own history; the ruling gives the default for their next pass: a Fang name
is read as a personal name unless a source calls it a clan.

### B. Hereditary Maghreb family names

**Rule.** Three different things are built on Ben, Bou, Ould or Aït and must
not be filed together:

1. **A patronymic chain.** In Mauritania, Ould + the father's name says whose
   son a person is, not which family: the fiche's sources are René Basset
   (_Mission au Sénégal_, tome I, fasc. II, p. 360: « ould » = « fils,
   enfant ») and Jeune Afrique (16 October 2005: a mark of filiation, the
   equivalent of Ben). That is `non_hereditary_patronymic`, unit `individual`,
   with no `nameSystem` gap. Applied to `PAT_OULD_CHEIKH` and
   `PAT_OULD_MOHAMED`. `PAT_OULD_ABDALLAHI` and `PAT_OULD_AHMED` have no
   history yet and follow the same default.
2. **A hereditary family name built on a given name or a title** (Ben Ali,
   Bou Zid, Ben Youcef, Ben Badis, Belkacem, Boumediene, Amara, Amrani,
   Cherif). The fiches' own histories call them « nom de famille »: Benali
   became a one-word name when the Tunisian civil register removed the
   space after independence, Benyoucef is « un prénom devenu nom de
   famille » in the Mostaganem registers, Bouzid is written in 1864 as the
   name of a Kabyle family, Ben Badis appears on a tombstone of 1382. They
   are not a `nisba`: a nisba is a relational name taken from a place, a
   tribe or a trade (the model's `nisbaSubtype` is `geographic | tribal |
occupational | other`). They are not a `non_hereditary_patronymic`: they
   are hereditary. They are not a `clan_name`: no source calls them a clan.
   **None of the five values fits.**
3. **A name that names a tribe** (`PAT_AIT_AHMED`: the accounts name a Kabyle
   tribe). It stays `clan_name`, unit `clan`, until a source says otherwise.

**Interim value for case 2.** Keep `nisba`, and make the fiche say so: every
such fiche carries a `nameSystem` gap that names what the sources see (a
family name built on ben, bou or a title) and says the nisba class is
provisional. The unit stays `other`: the histories do not say that the
families who bear the name share an ancestor (Bouzid's history says the sources do not tell), and
`lineage` would claim it. Cherif keeps its claim of prophetic descent as
Daumas' account of 1855, and the fiche says that its sources do not say whether the families who bear the name
have it. Three fiches had no such gap and receive it:
`PAT_BENALI`, `PAT_BOUZID`, `PAT_BENYOUCEF`. The others already had one.

**Recommendation to the operator (not implemented).** A sixth value,
`hereditary_family_name`, would let these fiches say what they are. The same
box is wanted elsewhere: 84 fiches already carry a `nameSystem` gap that
says the model has no box for a (personal or other) name that became a
family name (69 `non_hereditary_patronymic` and 15 `clan_name`, counted by
script), plus the Maghreb family names typed `nisba` (the nine above and a
further group, such as Benjelloun, Benkirane and Bennani, to be read one by
one). The pull request body lists the change set.

**Implemented on 2026-10-14 (ETNI-2011).** The sixth value
`hereditary_family_name` is in the parser, the model file, the API and the
OpenAPI enums, migration 107, the glossary and the label dictionary. It
means a surname that is hereditary and is neither a clan or lineage name, a
nisba, a praise name, a totemic clan nor a non-hereditary patronymic: a given
name, a title or a patronymic element that became a family name. A fiche takes
it only when its own `nameHistory` shows the name borne as a family name, from
an opened source, and tells no clan. Where it does not, the fiche keeps its
nearest box and its `nameSystem` gap now says that the box exists but that no
source read shows the transmission. The unit is `other`, or `lineage` where an
account shows a family line (Akhannouch, Ben Badis, Eyoum). 28 fiches moved.

**Third pass, 2026-10-16 (waves 21 to 23).** The same rule moved 13 Portuguese
family names (Monteiro, Bandeira, Menezes, Fernandes, Lopes, Duarte, Costa,
Lima, Neves, Carvalho, Ferreira, Nascimento, Neto) to
`hereditary_family_name`, unit `other`: each history, written from Leite de
Vasconcelos (1928) and the Dictionary of American Family Names, shows the name
borne as a family name and tells no clan. Five fiches whose histories tell a
personal name and no transmission as a surname (Amadhila, Hamutenya, Iipumbu,
Kgosi, Mothibi) took `non_hereditary_patronymic`, unit `individual`. Ngcobo,
Madiba, Khama, Mahlangu and Gbaguidi stay `clan_name`; the pull request lists
why. Counts by script: `hereditary_family_name` 28 to 41,
`non_hereditary_patronymic` 277 to 282, `clan_name` 390 to 370 (two of them
folded away).

# The long tail: wave order

The priority core above is a short list picked by hand. The rest of the corpus
is written in waves of 60 subjects, each wave six batches of ten and one pull
request, reviewed by the operator before it merges (ETNI-2011). Waves 4 to 13
took the long tail in the order the corpus offered it. This section fixes the
order of what is left, from wave 14.

## Coverage at 2026-10-12

A subject is **complete** when its fiche carries a `nameHistory` block that the
shared schema accepts (`parseNameHistory`, the check
`checkNameHistoryBlocks` in `scripts/validateAfrikData.ts` runs on every
fiche). The schema asks for a summary, names with their accounts, a source on
every account and the self-given name of a people; it does not judge the
quality of the sources, which the operator reviews in each wave. The count
skips the `V1` archive and the `_`-prefixed helper files.

| Folder                 | Fiches | Complete | Without |
| ---------------------- | -----: | -------: | ------: |
| `peuples`              |    687 |      465 |     222 |
| `patronymes`           |    790 |      247 |     543 |
| `langues`              |     39 |       39 |       0 |
| `famille_linguistique` |     25 |       25 |       0 |
| `pays`                 |     54 |       54 |       0 |
| `lieux`                |      4 |        4 |       0 |
| `mots`                 |      2 |        2 |       0 |

Every wave pull request runs `npm run report:name-history-waves` and pastes
the new coverage table. The same command prints the summary of the next waves.

## What demand data exists

- **Fiche visits (P): readable, and used.** The site's Plausible instance
  answers its stats API without credentials, as the audience-audit skill
  describes. On 2026-10-12 the pages breakdown was read for 2026-06-01 to
  2026-10-12 and the people and family-name pages were committed as
  `scripts/data/ficheVisits-2026-10-12.json`, so the order can be rebuilt
  offline. These are unique visitors who accepted the consent banner, the same
  floor as in the first section. Of the 222 peoples and 543 family names
  left, 35 peoples and 28 family names have at least one visitor; the busiest
  have two to four.
- **Search queries (Q): not read for the tail.** The first section lists the
  queries read on 2026-10-09. A fresh read of the `search:submit` query
  property was not done: it was not authorised for this work, and the first
  read showed that 307 of 396 events carry no query anyway. No query count
  is invented here.
- **Search Console and AI answers: no access**, as in the first section.
- **TikTok and social posts (T, S):** they name the subjects of the core list
  only. They say nothing of the tail.

So for most of the tail there is no measured demand at all, only a handful of
visits. The order below is **an editorial proxy, not a ranking by readers**.
Revise it when Search Console or a month of query text is available.

## The proxies, and their limits

1. **Visited fiche** (tier 1): at least one visitor in the snapshot. A single
   visitor is a weak signal, but it is the only measured one.
2. **Stated population** (peoples, tiers 2 to 4): the total on the people's
   own fiche, in bands of 1 million and 100,000. A large people is more
   likely to be searched, but population is size, not curiosity; 2 peoples
   state none and fall in the last band.
3. **Countries spanned** (family names, tiers 2 and 3): a name found in two
   or more countries goes before a name found in one. This favours wide
   names over local ones that may be searched just as much.

Not used: the number of sources on a fiche (it measures how easy the work
is, not demand), inbound references and retired-identifier redirects (too few
to separate subjects).

| Kind        | Tier 1 visited | Tier 2            | Tier 3          | Tier 4 |
| ----------- | -------------: | ----------------- | --------------- | ------ |
| people      |             35 | 11 (>= 1M)        | 74 (>= 100k)    | 102    |
| family name |             28 | 34 (2+ countries) | 481 (1 country) | none   |

## The method

1. List every people and family-name fiche without a complete `nameHistory`.
2. Put each in its demand tier (above).
3. Inside a tier, group peoples by linguistic family and family names by their
   first country, so the neighbours of one wave share sources. A group ranks
   by its visitors, then its population, then its spread; inside a group the
   same keys order the subjects, then the id.
4. Cut the sequence into waves of 60, peoples and family names alternating
   from wave 14 as waves 10 and 11 did. When one kind runs out the other
   continues; the last wave of each kind is short (42 peoples, 3 family
   names).

The script is deterministic: same corpus and same snapshot, same order.
Finished subjects leave the list, so the groups re-rank slightly from one
wave to the next: regenerate the list at the start of each wave rather than
reading an old one.

Known limits of the result:

- Tier 1 mixes many families, so waves 14 and 16 are less cohesive than the
  later ones. Visits come before shared sources.
- Several tier 1 peoples are aggregates (for example `PPL_BANTU`,
  `PPL_MANDE_MACRO`, `PPL_AUTRES_PEUPLES_BANTOUS`). Whether a macro or
  catch-all fiche deserves a name history is for the operator to rule when
  wave 14 is reviewed.
- Family names are grouped by the first country the fiche lists, which is an
  editorial order, not a ranking.

## The next waves

Summary by wave. The ids, grouped by family or country, are in
[the generated list](name-history-long-tail-waves.md).

| Wave | Kind        | Subjects | Family or country mix                                                          | First id             | Last id         |
| ---- | ----------- | -------- | ------------------------------------------------------------------------------ | -------------------- | --------------- |
| 14   | people      | 60       | `FLG_BANTU` 18, `FLG_NIGERCONGO` 6, `FLG_KWA` 5, `FLG_MANDE` 5, 16 more        | `PPL_EBRIE`          | `PPL_SENGA`     |
| 15   | family-name | 60       | `EGY` 6, `CMR` 4, `DZA` 4, `GNB` 4, 25 more                                    | `PAT_ABAZA`          | `PAT_BA`        |
| 16   | people      | 60       | `FLG_BANTU` 15, `FLG_NIGERCONGO` 11, `FLG_COUCHITIQUE` 8, `FLG_KWA` 8, 11 more | `PPL_LAMBYA`         | `PPL_BASKETO`   |
| 17   | family-name | 60       | `COD` 27, `ETH` 19, `NGA` 12, `TGO` 1, 1 more                                  | `PAT_JOHNSON`        | `PAT_GYANG`     |
| 18   | people      | 60       | `FLG_BANTU` 31, `FLG_COUCHITIQUE` 16, `FLG_KWA` 11, `FLG_KROU` 2               | `PPL_VIDUNDA`        | `PPL_WONNIN`    |
| 19   | family-name | 60       | `UGA` 19, `KEN` 18, `MOZ` 16, `NGA` 7                                          | `PAT_KEHINDE`        | `PAT_NYUSI`     |
| 20   | people      | 42       | `FLG_CREOLE` 7, `FLG_KROU` 6, `FLG_TCHADIQUE` 5, `FLG_NIGERCONGO` 4, 11 more   | `PPL_AIZI`           | `PPL_COPTES`    |
| 21   | family-name | 60       | `CMR` 15, `EGY` 15, `MAR` 15, `DZA` 14, 1 more                                 | `PAT_ATEBA`          | `PAT_ABDULAI`   |
| 22   | family-name | 60       | `TZA` 14, `AGO` 13, `GHA` 13, `LBY` 11, 1 more                                 | `PAT_ADDO`           | `PAT_NSABIMANA` |
| 23   | family-name | 60       | `BEN` 9, `BWA` 9, `COG` 9, `RWA` 9, 4 more                                     | `PAT_NTIBANTUNGANYA` | `PAT_KOLINGBA`  |
| 24   | family-name | 60       | `CIV` 8, `GAB` 8, `MUS` 8, `SLE` 8, 5 more                                     | `PAT_MOKOM`          | `PAT_BINDANG`   |
| 25   | family-name | 60       | `LSO` 7, `MWI` 7, `SSD` 7, `STP` 7, 6 more                                     | `PAT_BORICO`         | `PAT_BATIONO`   |
| 26   | family-name | 60       | `CPV` 5, `DJI` 5, `GMB` 5, `LBR` 5, 10 more                                    | `PAT_ILBOUDO`        | `PAT_NHASSE`    |
| 27   | family-name | 3        | `NER` 2, `MLI` 1                                                               | `PAT_ISSAKA`         | `PAT_GUINDO`    |

Command: `npm run report:name-history-waves` (coverage and this summary);
`npx tsx scripts/afrik/nameHistoryWaveOrder.ts --list` (the full list).
No wave is launched by this section.
