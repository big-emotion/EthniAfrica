# Language alternate names — the pass of 18 September 2026

## Why

The result page shows every form a thing is known by (REQ-178). It reads them
through one projection, `src/lib/search/naming.ts`, which for a language reads
the root `alternateNames[]`. Twenty-eight of the thirty-nine language fiches
carried that field as an empty list, so a reader searching a language met the
block's heading and nothing under it.

The empty lists were not decisions. Glottolog publishes alternative names for
most of these languoids; the field had simply never been filled. That matters,
because on this corpus an empty list is supposed to be a **declared silence** —
the same distinction `competing-appellations` draws for a people's exonyms.
Twenty-eight fields claiming a silence nobody had established is the failure
this pass corrects.

## Source

**Glottolog 5.3**, at `official` tier — and already cited by all twenty-eight
fiches. Nothing new was introduced: the field is filled from the source the
fiche already rests on, by its own languoid URL.

## The selection rule

Glottolog groups its "Alternative Names" by cataloguing source. Applied to each:

- **Keep** the forms from `multitree`, `elcat`, `moseley & asher` and
  `wals other` — names the language is known by.
- **Drop `lexvo`**, which is the label _translated_ into other languages
  (« Język bambara », « バンバラ語 »). Publishing those would fill the block
  with Polish and Japanese. **Exception:** where a `lexvo` entry is the
  language's own autonym — Eʋegbe, Kiswahili, Taqbaylit, Af-Soomaali — it is a
  name and not a translation, and it is kept.
- **Drop** anything equal to the fiche's own `nameFr` or `nameEn`.
- **Drop** forms that exist only with a parenthetical qualifier
  (« Mandinka (Gambian) », « Wolof (Dakar) »). A qualifier is never split out
  of a form — the rule the result page is built on — so a form that only exists
  qualified is not carried.
- **Drop** catalogue artefacts: inverted headwords (« Maninkakan, Eastern »),
  bare adjectives (« Eastern », « Standard »), grouping labels (« Hausa Group »,
  « Somali Languages »).
- **Drop** the names of _neighbouring_ languages a catalogue lists under the
  entry — the Ometo languages under Wolaytta, the clan names under Somali.
  Those are not names of this language.
- **Drop** any form Glottolog itself prints in quotation marks, which is how
  that catalogue marks a deprecated or disparaging label. Using the source's own
  marking rather than a judgement about which African-language exonym offends is
  deliberate: the second is not this corpus's call to make from the outside.

## Result

24 fiches filled, **206 forms written**. Coverage in the fiches went from 11/39
to 35/39.

**Correction, 2026-09-19: none of them reached the result page.** That coverage
was measured by running the projection over the fiche JSON, where
`alternateNames` sits at the root. The loader stores it inside `content`, the
search RPC returns `content` whole, and the projection read the root only — so
every language, the 11 filled before this pass included, reached the page with
no names at all. Its unit test passed a fiche-shaped root and stayed green. The
projection now reads `content` first, and the test that proves it passes a row
shaped the way the RPC returns one. Measuring through the fiche shape rather
than the API shape is the error; the numbers above are true of the fiches and
were never true of the page.

## The four not filled, and why

| Code  | Language        | Reason                                                                                          |
| ----- | --------------- | ----------------------------------------------------------------------------------------------- |
| `din` | Dinka           | Glottolog publishes no such section. The empty list is now measured.                            |
| `grb` | Grebo           | Same.                                                                                           |
| `egy` | Égyptien ancien | The section holds translations and a language _stage_ (« Middle Egyptian »), no alternate name. |
| `naq` | Nama            | **A model gap, not a data gap — see below.**                                                    |

The first three are now genuine declared silences: somebody looked, and the
source has nothing. That is the state the field was pretending to be in.

## `naq` (Nama) — the open decision

Glottolog attests a long list for this languoid and it is dominated by
colonial-era terms: _Hottentot_, _Nama Hottentot_, _Hottentottisch_,
_Klipkaffer_, _Klipkaffern_, _Kupkaffer_, _Kakuya Bushman Nasie_. One of those
carries a racial slur that is still actionable in Southern Africa.

They are attested, and the corpus's doctrine is that nothing is forbidden and
everything is labelled — keep the colonial name, explain why it is problematic,
surface the autonym. **The language model cannot do the second half.**
`public/modele-langue.json` gives `alternateNames[]` as « Nom attesté » and
offers no field for what a name raises: no `whyProblematic`, no
`originOfNames`, nothing. The people model has one; the language model does not.

So these forms could only be published bare, in a block whose own copy reads
« Aucun de ces noms n'est faux. Ils ne viennent simplement pas du même
endroit. » Applied to a slur, that sentence is indefensible.

Filling the field anyway would be the failure `checkEditorialRules.ts` exists to
prevent, one class over. Leaving it empty is also wrong — it claims a silence
the source contradicts. **Neither option is available until the model has a
field**, which is a model decision and not a data pass.

What it takes, when someone rules on it: a `whyProblematic` (or equivalent) on
`modele-langue.json`, the loader and the projection carrying it, and the result
page drawing it the way it draws a people's — which it already can, since
`NamingProjection` has a `problem` slot that only the people and family classes
currently fill.

**Ruled 2026-09-19: add the field.** `modele-langue.json` gains a root
`whyProblematic`, classed `review_required` like its people and family
counterparts; all thirty-nine records carry it, at `null` unless something is
said. The loader stores it in `content` and the projection reads it into
`problem`.

`naq` then takes 28 forms under the rule above, with one refinement the field
makes possible: the three Hottentot forms are **kept**, because the fiche now
says what they are in the same block, on François-Xavier Fauvelle-Aymar (2002) —
the same entry FLG_KHOE cites, copied verbatim so the work keeps one locator.
Every other form Glottolog quotes anywhere stays out, which is the rule that
covers « Klipkaffer », « Kupkaffer » and « Cape Hottentot ». The autonym
Khoekhoegowab is kept although one catalogue quotes it, as the `lexvo` autonyms
were; « Khoeknoegowap » is dropped as a misprint of Khoekhoegowap and « Khoekhoe
du Cap » as a qualified variant.

## Related

- `docs/design/search-result-data-shape.md` — where each class keeps its names
- `docs/editorial/refonte-plan-2026-09-18.md` — the reorientation this serves
