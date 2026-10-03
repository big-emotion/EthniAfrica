# Frozen review cases — editorial remediation

Frozen on 2026-09-30, **before any correction** (plan P0). Every later phase is
reviewed against these twelve cases: a change that makes one of them fail, or that
satisfies it by erasing the nuance it protects, is rejected.

These are **semantic cases**. A green automated check is never the verdict: a
script can refuse a leak or an obvious pattern, but it cannot tell whether a
rewrite kept the claim's scope, its carrier or its uncertainty. Each row therefore
states the expected reading, and the phase that turns the deterministic part into
a test says which part that is. Reviewer notes and before/after pairs go in the
closure ledger, not here: this file does not change once frozen. A new case is
appended with its date, never edited in place.

The cases are writing patterns, not factual claims about named peoples. Where a
case needs an example, it uses a placeholder; a real passage is only ever quoted
from the audit's own CSV appendices.

| #   | Situation                                                                       | Required result                                                                                          | Failure signature                                                                                     | Findings exercised | Deterministic part (test)  | Human part (review)                                            |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------ | -------------------------- | -------------------------------------------------------------- |
| 1   | An explanation opens on an author, including an African author                  | The subject leads; the reference stays identifiable beside or after it; the uncertainty is unchanged     | Author moved to a footnote and the claim now reads as settled; or an author's origin changes the rule | C13, C18, C19      | P4 checker fixture         | Is the disagreement still attributed to the right party?       |
| 2   | A book or its author is the actual subject; a speaker is quoted directly        | The attribution stays and the checker permits it                                                         | The checker rejects « Ce livre raconte la vie de son auteur. » (reproduced in the audit)              | C13                | P4 checker fixture         | Is the author really the subject, not a borrowed authority?    |
| 3   | A book published in 1912 describes an undated event                             | The publication year identifies the document only; no event date is inferred                             | « In 1912 people used it » is written from a 1912 reference                                           | C18, C22           | none                       | Does any sentence date the event from the document?            |
| 4   | A speaker describes present usage; a collector relays an older account          | Carrier, collector, period and limits remain distinguishable                                             | One voice is merged into « the people say » or the collector disappears                               | C10, T02           | P3 round-trip test         | Who said it, to whom, when, directly or through whom?          |
| 5   | An oral account with no griot and no full transcript; protected identity        | The actual provenance fits the record; missing details stay missing; permission conditions stay enforced | A griot, a transcript or a name is invented to satisfy a schema; or withdrawal stops being honoured   | C06, C10           | P3 schema test             | Is anything present that nobody supplied?                      |
| 6   | Two publications repeat one account; two independent accounts disagree          | Reference count is not corroboration; the disagreement stays visible                                     | Three books quoting one source read as three confirmations; or disagreement is smoothed away          | T02, C18           | P3 count/independence test | Are dependent citations shown as dependent when known?         |
| 7   | Only deceased eligible bearers were investigated                                | The text states the scope actually searched                                                              | « No bearer exists » or « no bearer is documented » from a search restricted by eligibility           | C16                | none                       | Does the negative claim keep the exact scope investigated?     |
| 8   | One recorded name, several endonyms, uncertain original spelling                | No forced universal claim, no invented exonym, no single « original » form                               | « Always several names » or a civil-register explanation is written without a source                  | C11, C12           | P4 template fixture        | Is every asserted variant supported by the researched case?    |
| 9   | A source title contains a technical word; a prose field contains `PPL_*`        | The citation is preserved; the internal identifier in reader prose is rejected                           | A real bibliography title is flagged; or a leaked identifier passes because the field is unguarded    | C23                | P4 field-coverage test     | Is a structural identifier mistaken for prose, or the reverse? |
| 10  | Readers with different knowledge in Mali, Guinea, Côte d'Ivoire or the diaspora | Same supported claims; useful context; no assumed ignorance and no assumed expertise                     | An invented « local French », a national stereotype, or location read as language proficiency         | G01, T06           | none                       | Would each reader restate the point and where to check it?     |
| 11  | A current request to write a page without naming any skill                      | The same guide and persona requirements apply as on the specialised writing path                         | The plain request skips the guide because no skill was invoked                                        | G02                | P6 route trial             | Was the primary reader need recorded in the brief?             |
| 12  | A unique local skill customisation next to a stale copied rule                  | The unique work is preserved for reconciliation; the obsolete rule cannot stay active                    | The local copy is overwritten wholesale, or the stale rule survives behind a link that looks fine     | C04                | P2 parity fixture          | Was every unique local line accounted for before replacement?  |

## How a case is used

1. **Before a change**: run the case against the current text and record what
   goes wrong in the ledger row. That is the failing test, in the register that
   suits prose.
2. **After the smallest change**: run the same case again. Record the
   before/after pair and who read it.
3. **Where a deterministic part exists**, the owning phase adds a behavioural test
   from the fixture named above. The test asserts the rule, not the presence of a
   sentence copied into several files.

## What this file does not claim

- No community, contributor or reader was consulted to write these cases.
- No case certifies a historical claim; each protects how a claim is stated.
- Passing all twelve does not show the corpus is free of other contradictions —
  the audit itself states that its coverage is bounded.
