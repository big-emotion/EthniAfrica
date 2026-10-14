# Mockups first — how a visible change is made

Every change a reader can see starts on the mockups and only then reaches the
code. This holds for the team, for an agency, for a contractor and for every
agent (Claude, Codex or other). The reference is the site canvas, recorded in
[`mockups/site/`](mockups/site/README.md) and published at
<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>.

## Why

Without a shared reference, every redesign is re-derived from the code by
whoever touches it, and each one drifts a little further from the last. The
boards give one picture of the site that a reviewer, an operator and an agency
can all open, comment on and approve before a line of code is written. The
code then has one job: reproduce the approved boards.

## What counts as a visible change

Anything that changes what a reader sees or touches: a token, a colour, a
size, a spacing, a layout, a component, a new block, a removed block, a page,
a breakpoint behaviour, an icon, a state (empty, error, loading, open).

Not concerned: data and copy inside an existing block (the corpus and the
editorial charters govern them), a non-visual fix, and a bug fix that brings
the page back to what a board already shows. For that last case, cite the
board in the pull request.

## The five steps

1. **Change the boards.** Open the site canvas and edit the boards the change
   touches, at 430 px first, then 768, then 1440. A new page gets three new
   boards. A change to a token or a shared component is made on the
   design-system board (`Main`) and on every page board it shows on. Keep the
   real French copy; illustrative text is marked as such.
   An agency or contractor without edit rights on the canvas duplicates it,
   makes the change on the copy and sends its link for review.
2. **Get the boards approved.** The operator reviews the boards in the canvas
   and approves them, or asks for changes. Nothing is implemented from boards
   that are not approved. The art-direction review (`/afrik-art-director`)
   can be asked for at this step; it judges against the charters.
3. **Record the approved boards in the repository.** Copy the canvas files
   (`project/*.dc.html`, `canvas.json`, `ea-live.css`, `assets/`) into
   `docs/design/mockups/site/`, in the same pull request as the implementation
   or in one before it. When the change touches `src/styles/`, update the
   verbatim part of `ea-live.css` in the same commit:
   `src/styles/__tests__/siteMockupCharter.test.ts` fails otherwise.
4. **Implement to the boards.** Build the change in the code with the
   project's tokens and conventions (`CLAUDE.md`, the charters). Where the
   code cannot reproduce a board exactly, stop and raise it: either the board
   is adjusted and approved again, or the reason is written in the pull
   request. A silent difference is a defect.
5. **Compare before merging.** Render the changed pages at 430, 768 and
   1440 px and set them beside the boards. The pull request carries the
   comparison (screenshots side by side, or the result of a visual test) and
   ticks the mockup checklist of the template.

## When the code and a board disagree

The board is the reference, and the page is the bug. The exception is a board
that contradicts a charter rule: then the operator decides which one is
wrong, and the fix lands on the boards first.

## For agents

An agent asked to change the look of the site does not edit components first.
It checks whether approved boards exist for the change in
`docs/design/mockups/site/` (or a link given in the task). If they do not, it
proposes the board change and stops for approval. If they do, it implements
to them and reports the comparison at the three widths.
