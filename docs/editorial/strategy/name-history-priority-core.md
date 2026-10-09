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
to judge the format; `todo` = not yet written; `partial` = carries a
`nameHistory` folded from an old name record, to complete.

| #   | Subject (as searched) | Type        | Fiche                                        | Evidence                                                                                                               | Status  |
| --- | --------------------- | ----------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Peul                  | people      | `PPL_FULA`                                   | O; Q « peul » 7 visitors, plus « puel », « fulbe », « fulbé », « gulbe »; P 11, the busiest fiche; S YouTube « Fulbe » | pilot   |
| 2   | Lingala               | language    | `lin`                                        | O; Q 7 visitors; T « origine du lingala et son ascension »; S YouTube « Lingala : un nom, plusieurs lectures »         | pilot   |
| 3   | Mali                  | country     | `MLI`                                        | O; P 5. No « mali » query recorded                                                                                     | pilot   |
| 4   | Côte d'Ivoire         | country     | `CIV`                                        | O; Q 2; P 7, a dead end in the audit; S campaign `bouet-willaumez-a-t-il-invente-la-cote-divoire` (4 visits)           | todo    |
| 5   | Traoré                | family name | `PAT_TRAORE`                                 | O; Q « traore » 2, « traoré » 1, « tarawele » 1; P 8; S campaign `traore-diop`                                         | todo    |
| 6   | Coulibaly             | family name | `PAT_COULIBALY`                              | O; P 4; S Instagram « Keïta et Coulibaly » (16.9K views)                                                               | todo    |
| 7   | Gagnoa                | place       | to create (`public/modele-lieu.json`)        | O only                                                                                                                 | todo    |
| 8   | Daloa                 | place       | to create (`public/modele-lieu.json`)        | O; Q 1                                                                                                                 | todo    |
| 9   | Mandé, Manden         | family      | `FLG_MANDE`                                  | P 10, a dead end in the audit; T « mandingue et diola »; S campaign `manden-mande-mandingue-trois-mots`                | todo    |
| 10  | Bantou                | family      | `FLG_BANTU`                                  | Q 3; P 6                                                                                                               | todo    |
| 11  | Guinée                | country     | `GIN`                                        | Q « guinée » 3, « guinee » 1; P 4; S Instagram « La Guinée, c'est vingt-neuf peuples » (25.2K), YouTube « première »   | todo    |
| 12  | Soninké               | people      | `PPL_SONINKE`                                | T « dou viens les soninke »; P 5, the longest reading on a fiche                                                       | todo    |
| 13  | Nzebi                 | people      | `PPL_NZEBI`                                  | T « nzibi gabon »; Q 1; P 5                                                                                            | todo    |
| 14  | Mandingue, Malinké    | people      | `PPL_MALINKE` (see also `PPL_MANDE_MACRO`)   | T « mandingue et diola »; P `PPL_MANDE_MACRO` 3                                                                        | todo    |
| 15  | Diola                 | people      | `PPL_DIOLA` (a `PPL_JOLA` fiche also exists) | T « mandingue et diola »                                                                                               | todo    |
| 16  | Mot « race »          | free word   | to create                                    | Q 1; S Instagram « D'où vient le mot race ? » (104K views, the top post)                                               | todo    |
| 17  | Swahili               | language    | `swh`                                        | S Instagram « D'où vient le nom swahili ? » (9.6K views)                                                               | todo    |
| 18  | Soudan                | country     | `SDN`                                        | S YouTube « Soudan : un nom, plusieurs pays »                                                                          | todo    |
| 19  | Soudan du Sud         | country     | `SSD`                                        | Q 1                                                                                                                    | todo    |
| 20  | Bété                  | people      | `PPL_BETE`                                   | Q 1; P 7                                                                                                               | todo    |
| 21  | Diallo                | family name | `PAT_DIALLO`                                 | P 5                                                                                                                    | todo    |
| 22  | Diarra                | family name | `PAT_DIARRA`                                 | P 5                                                                                                                    | todo    |
| 23  | Keïta                 | family name | `PAT_KEITA`                                  | Q 1; P 2; S Instagram « Keïta et Coulibaly »                                                                           | todo    |
| 24  | Congo                 | country     | `COG`                                        | Q 1; P 7                                                                                                               | todo    |
| 25  | RD Congo              | country     | `COD`                                        | P 5                                                                                                                    | todo    |
| 26  | Cameroun              | country     | `CMR`                                        | Q 1; P 5                                                                                                               | todo    |
| 27  | Kenya                 | country     | `KEN`                                        | P 6                                                                                                                    | todo    |
| 28  | Sénégal               | country     | `SEN`                                        | Q 1 visitor, 3 events                                                                                                  | todo    |
| 29  | Bénin                 | country     | `BEN`                                        | Q 1; P 3                                                                                                               | todo    |
| 30  | Burundi               | country     | `BDI`                                        | Q 1; P 3                                                                                                               | todo    |
| 31  | Ghana                 | country     | `GHA`                                        | P 3; told beside Mali, which took an empire's name the same way                                                        | todo    |
| 32  | Alur                  | people      | `PPL_ALUR`                                   | P 6                                                                                                                    | todo    |
| 33  | Birifor               | people      | `PPL_LOBI_BIRIFOR`                           | Q 4 searches by 1 visitor (« les nom de familles birifor »…); P 5                                                      | todo    |
| 34  | Manja                 | people      | `PPL_MANJA`                                  | P 5                                                                                                                    | todo    |
| 35  | Basaa (Cameroun)      | people      | `PPL_BASSA_CAM`                              | Q « basaa », « baasa », « bassa du cameroun », 1 visitor each. P 4 went to `PPL_BASSA`, the Liberian Bassa             | todo    |
| 36  | Dogon                 | people      | `PPL_DOGON`                                  | Q 1                                                                                                                    | partial |
| 37  | Igbo                  | people      | `PPL_IGBO`                                   | Q 1                                                                                                                    | partial |
| 38  | Kongo                 | people      | `PPL_KONGO`                                  | Q 1                                                                                                                    | todo    |
| 39  | Luba                  | people      | `PPL_LUBA`                                   | Q 1                                                                                                                    | todo    |
| 40  | Songhaï               | people      | `PPL_SONGHAI`                                | Q 1                                                                                                                    | todo    |
| 41  | Zarma                 | people      | `PPL_ZARMA`                                  | Q « zarma (ou zerma) » 1; P 4                                                                                          | todo    |
| 42  | Nyakyusa              | people      | `PPL_NYAKYUSA`                               | Q « wanyakyusa » 1                                                                                                     | todo    |
| 43  | Bambara               | people      | `PPL_BAMBARA`                                | P 4                                                                                                                    | todo    |
| 44  | Dioula                | people      | `PPL_DIOULA`                                 | P 3                                                                                                                    | todo    |
| 45  | Ouédraogo             | family name | `PAT_OUEDRAOGO`                              | Q 1                                                                                                                    | todo    |
| 46  | Sawadogo              | family name | `PAT_SAWADOGO`                               | Q 1                                                                                                                    | todo    |
| 47  | Kouassi               | family name | `PAT_KOUASSI`                                | Q 1                                                                                                                    | todo    |
| 48  | Lawson                | family name | `PAT_LAWSON`                                 | Q 1                                                                                                                    | todo    |
| 49  | Camara                | family name | `PAT_CAMARA`                                 | P 3                                                                                                                    | todo    |
| 50  | Touré                 | family name | `PAT_TOURE`                                  | P 3                                                                                                                    | todo    |
| 51  | Dramé                 | family name | to create                                    | Q « drame », « dramé », 1 visitor, 4 events                                                                            | todo    |
| 52  | Essono                | family name | to create                                    | Q « esono », « essono », 1 visitor                                                                                     | todo    |
| 53  | Sacko                 | family name | to create                                    | Q 1                                                                                                                    | todo    |

## What the pilots settle, and what they leave to the operator

The three pilots (Peul, lingala, Mali) are written to the
[register's tile patterns](../reader-facing-register.md) so the operator can
judge the format before the other 50 are written. Points left open for that
review:

- **Italics.** The register sets the name in italics the first time. The
  corpus has no italics convention for `nameHistory` text, so the pilots carry
  plain text and leave the emphasis to the renderer, which knows each
  `nameText`.
- **Second-hand traces.** Several births rest on a trace an author reports
  rather than on a document the project has read (for Peul, D'Eichtal in 1842
  through Tauxier). The source note says so each time. The operator decides
  whether a reported trace may be a birth.
- **Summary account and hypothesis tiles.** On `PPL_FULA`, the old meaning
  account that listed every hypothesis is kept for the answer card, and each
  hypothesis is now also its own tile. The two say the same thing in two
  places; the operator decides whether the meaning account should shrink.
