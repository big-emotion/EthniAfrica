# Mande corpus correction for S2

Date: 2026-09-23. Scope: `FLG_MANDE` and `PPL_MANDE_MACRO`.

## Editorial decision

Distinguish historical geography, language classification and situated collective
identifications. A language family neither assigns nor invalidates an identity.
Preserve both record IDs, their links and the absence of a documented autonym for
the entire macro-group. A null autonym is not evidence that shared identities do
not exist.

The Facebook discussion informed the questions. Its historical claims and personal
testimonies have not been converted into unsourced corpus facts.

## Evidence and affected passages

| Source                                                                              | Evidence used                                                                                                                              | Application                                                                                                                                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Niane, 1985, _Histoire generale de l'Afrique_, IV, chapter 6, pp. 141, 153–154      | Mande/Manden in the upper Niger between Kangaba and Siguiri; Mandenka as a people name; traditions concerning Do and Kiri before Soundiata | Locate the historical country with a dated attribution; distinguish it from the language family's range and modern Mali.                                                                  |
| Koelle, 1854, _Polyglotta Africana_, variety remarks II-1-a, Lexibank transcription | Names reported from interlocutors and criticism of European Mandingo spelling                                                              | Remove the claim that 1854 introduced a colonial word; attribute the spelling judgment to Koelle rather than treating it as a modern prohibition.                                         |
| Vydrin, 2009, p. 107                                                                | Manding is one of several low-level Mande groups; Soninke-Bozo, Soso-Jalonke and Southwestern Mande are distinct                           | Replace the exhaustive four-language presentation; distinguish language groups from dialects; remove N'ko from the dialect list and the incorrect placement of Bozo there.                |
| Donaldson, 2019, _Signs and Society_ 7(2), pp. 156–185, DOI 10.1086/702554          | Fieldwork in 2012–2017; N'ko teaching in Bobo-Dioulasso and Bamako; language and civic practices among participants                        | Replace the categorical denial of a collective self-appellation with a bounded example. Scope the N'ko discussion to Manding and the observed actors. Retain the separate 2017 reference. |

The cited chapter of Niane is added separately from the existing whole-volume
reference because its accessible reproduction does not contain Person's chapter 12.
New sources retain explicit `official` or `referenced` tiers. English translation
is explicitly deferred pending review of the revised French passages.

## Read-only production comparison

On 2026-09-23 the public API returned both records. The family header and the
macro-group appellations matched the pre-edit source records exactly. Production
still contained the colonial-introduction wording and the categorical denial of
a collective self-appellation. It did not contain these corrections.

Checked endpoints:

- https://ethniafrica.com/api/v2/language-families/FLG_MANDE
- https://ethniafrica.com/api/v2/peoples/PPL_MANDE_MACRO

No database write, production synchronization, deployment, render, publication or
scheduling was performed. Merging this source correction does not itself verify
what production subsequently serves.

## Validation and limits

The existing corpus validator and editorial rules were run before and after the
edit. Baseline: 57/57 validation checks, zero errors and 5,700 warnings; editorial
rules: zero errors and 95 warnings. No new prose-matching test was added.

After the edit: 57/57 validation checks, zero errors and 5,706 warnings;
editorial rules remain at zero errors and 95 warnings. The six additional
warnings come from the URL catalogue not recognizing the added citation URLs;
all added entries carry explicit source tiers. Translation parity checked both
staged records: zero findings and two explicit deferrals. Record keys and
immutable identifiers were compared with the baseline and preserved. The source
identity check also required the Vydrin URL to use HTTPS consistently in both
records. The new source texts were accessible through the cited URLs during review.

This is an appellation and classification correction, not a complete factual audit
of either record. Existing demographic estimates, prehistoric migrations, genetic
inferences, generalized cultural practices and polity chronologies still require
their own source review. They must not be treated as newly verified by this change.
The original etymology, first naming event and a universal collective self-name
remain unestablished. The N'ko case cannot stand for all Manding or Mande speakers.
