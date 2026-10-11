---
title: "Name-history priority core: the subjects enriched before the timeline ships"
status: "proposed — awaiting operator review, 2026-10-09"
related:
  - docs/editorial/strategy/name-history-timeline-2026-10-08.md
  - docs/audience/audit-2026-10-08.md
  - docs/editorial/doctrine.md
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
