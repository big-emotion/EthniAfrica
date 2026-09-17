# The search-result charter — what a name page owes its reader

Settled 2026-09-18, on the reorientation recorded in
`docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md`.

**The reviewed rendering is the reference.** Fourteen artboards, approved by the
operator, at both review widths and in both themes:

<https://claude.ai/artifact/CVh7QHVzJUJ5PSUamn5rwu>

As with `docs/design/mockups/`, **the mockup — not the code — is the reference
when the two disagree.** A result page that departs from it is the page that is
wrong, until this file says otherwise.

---

## 1. What the page is

The search-result page is **not an index**. It does not hand the reader a list of
links to fiches; it answers the one question the atlas now exists to answer:
**where does this name come from.**

The detailed fiches of every entity class stay where they are. They stop being
the default destination.

## 2. The five states, and why each exists

| State                            | Reference artboard | What it settles                                                  |
| -------------------------------- | ------------------ | ---------------------------------------------------------------- |
| A name given from outside        | `Mande`            | The searched form is not the one the peoples use                 |
| Many outside names, none its own | `Peul`             | Including one the corpus declares pejorative                     |
| Almost nothing known             | `Ekpeye`           | One name, no origin, no date — declared, not hidden              |
| Misspelt, then unknown           | `Introuvable`      | A typo reaches the right page; an unknown name gets an admission |
| One name, several peoples        | `Bassa`            | Three peoples, three language families, no established link      |

## 3. The rules the page obeys

**No scholarly word reaches this page.** Not _exonyme_, not _endonyme_, not
_autonyme_, not _étymologie_, not _corpus_. A reader who wants the vocabulary
meets it on a fiche or in the glossary, never here. This is the rule the first
draft broke, in a sentence lifted straight out of `whyProblematic` — which is
how the rule below came to be written.

**A corpus field is never copied onto this page; it is translated.** The corpus
speaks to the curator, the page speaks to the visitor. The three fields where a
retired word is legitimately discussed (`whyProblematic`, `originOfExonyms`,
`contemporaryUsage`) are curator prose, and quoting them verbatim is how the
jargon gets in.

**No appellation is crowned.** Every form the corpus holds is shown, **the most
common first**, each with its origin attributed to its source. The component
named `DominantAnswerPanel` is contrary to this rule by its premise and does not
survive the reorientation.

**A shared name is not kinship, and the page never says otherwise.** On `Bassa`
the page states that the atlas files the three in three different language
families and that no source it holds links them — a fact about the corpus, never
a fact about the world.

**A pejorative form is shown, not hidden**, in its own visual treatment, with the
reason. Hiding it would be settling.

**A silence is declared, never left blank.** `Ekpeye` carries three: no other
appellation, no documented origin, no dated attestation. Each is a statement, and
each is followed by what the atlas does hold and by an invitation to correct it.

**The page admits when it does not know a name.** « Nous ne connaissons pas ce
nom. Ce n'est pas une réponse : c'est un aveu. »

## 4. What the layout settles

**Mobile is the reference width**, 430 px, as everywhere in this project. Desktop
is 1280.

**A rich page goes to two columns on desktop** — the forms and their origins on
the left, what the peoples call themselves and the silences on the right.

**Disambiguation is what desktop serves best**: the three Bassa cards side by
side, which mobile can only stack.

**A thin page does not spread.** `EkpeyeDesktop` keeps a 720 px measure at 1280
and lets the whitespace say there is no more to say. Inflating a sparse page to
fill the viewport is the failure this rule exists to prevent.

**The night variants are derived by token substitution, never rewritten.** The
two versions have to stay the same mockup, or comparing them proves nothing about
the theme. Every value comes from the `--afh-night-*` group of
`src/styles/tokens/color.css`.

## 5. What the page cannot deliver yet

Two blockers measured 2026-09-17, both visible as an empty band on every artboard:

- **The corpus dates almost no attestation.** The « À travers le temps » block —
  migrations and changes through time — has no data behind it. The mockups show
  the declared silence rather than an empty section.
- **No gate guards the competing appellations.** `checkEditorialRules.ts` requires
  the self-given name and nothing requires the others
  (`docs/editorial/audit-doctrine-publication-2026-09-17.md`, finding 1). A page
  that promises to show them all rests on a field nothing fills.

Neither invalidates the charter. They say where the work starts.
