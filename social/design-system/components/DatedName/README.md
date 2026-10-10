The dated-name card shows one date or period in large type, the name used then, what it designates and who uses it, in a sequence that moves from today towards older evidence.

**Provide:** `type: "dated"`, `date: {display, kind, marker, name, designated, usedBy}`, `source`, `credit`, `image` (preferably the dated document itself). No running text, except one short sentence on the origin card.

* `display`: « 1962 », « 9 octobre 1962 », « 1894 à 1896 », « vers 1850 », or « Date inconnue » with `kind: "unknown"`.
* `marker`: what kind of event this is; it becomes the kicker (« Indépendance », « Attestation datée », or a custom label). Independence, official adoption and attestation are different kinds. The earliest supported point takes `origine`, which draws the accent mark and the sentence « Jusqu'ici, les sources remontent à ce point. ». Anything older than the name takes `contexte`.
* Concurrent forms, or different entities at the same date: `date.branches` with two columns, each with its own colour, instead of two successive cards.
* The path of the name is summed up once, at the end, by the `recap` timeline of the closing card.

**Do:** mark the origin explicitly and stop the history of the word there; tell older context as what existed before the name.

**Don't:** put a timeline on each card; chain names that concern different entities or extents as if they were renamings; invent a date, an author or an inventor; call an attestation a creation.
