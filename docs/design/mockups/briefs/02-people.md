# Brief 2 — The people fiche

Read [`README.md`](README.md) first. Brief 1 is approved and implemented; this
brief reuses its three components instead of redrawing them (see "Approved
boards" at the end of [`01-result-page-timeline.md`](01-result-page-timeline.md)).

**Boards to change** (each at `-430`, `-768`, `-1440`): `people-fula`,
`people-bassa`, `people-thin-alaba`. `Main` changes only if a shared component
does.

**Surface.** `/fr/atlas/peuples/[slug]`, built by
`src/components/people/PeopleDetailViewV2.tsx`.

## What is on the boards today (checked 2026-10-14)

Chapters, in order, on `people-fula` (the same on `people-bassa` and
`people-thin-alaba`, which add « Identifiants externes » when the fiche has
them):

1. Hero plate: the self-name and the name searched, a one-line description,
   population and countries, the « Voir la carte » button, the trail.
2. **D'où vient le nom ?** — the self-name, how it is said, tags (« Leur nom »,
   « Origine débattue », « En peul »), and « Les pistes sur le sens ».
3. **Les autres noms** — one card per other name, each with its tags
   (« Donné de l'extérieur », « En français », « Où il a été écrit »).
4. Où vit ce peuple (map grammar, colonial fragmentation), Peuples liés, Langue,
   Histoire, Noms de personnes rattachés à ce peuple, Culture et société.
5. **Poursuivre** — links to the language family, language, country, a people
   and a family name.
6. Sources, with the list folded.

Two things in the first draft of this brief were wrong and are corrected here.
The « Histoire » chapter is the people's history, not a second telling of the
name's origin, so nothing is told twice. And the first screen at 430 px already
shows the name and the start of « D'où vient le nom ? »; the map is a button,
not the opening.

What the boards do **not** have, and brief 1 added to the result page: the
sources regrouped by type, the closing band with the silences, the conviction
and the invitation to correct (today the fiche only has the « Signaler » and
« Contribuer » buttons of the chapter bar and the footer link « Signaler une
erreur », no invitation in the page itself), and a next step that gives a
reason.

## What to change

1. **Add « Les sources parlent »** after « Les autres noms », reusing the
   approved component of `Main`: accounts of the name grouped by the seven
   source-diamond families in the code's fixed order, oral first, the precise
   kind beside each title. On a fiche the block covers all the names of the
   people; the first name's group is open and the others are folded, as on a
   result page with several subjects.
2. **Add the closing band** « Ce que nous ne savons pas encore » (silences
   deduced from the data, the « Notre conviction » sentence of the About page,
   the invitation to correct with « Signaler une erreur » and « Proposer une
   source »), before « Poursuivre ». The thesis line stays
   `[THÈSE — texte à fixer]` and is not shown until its text is fixed.
3. **Turn « Poursuivre » into « Poursuivre avec un autre nom »**, reusing the
   approved component: each target with a reason, the first sentence of the
   target fiche's summary. The current links include « Langue : Fulfulde », for
   which the corpus holds no fiche (the language is only a text field of
   `PPL_FULA`); drop any link whose target does not exist, and say which in
   the report.
4. **Length.** `people-fula` is about 10,455 px tall at 430 px (11 screens),
   `people-bassa` 8,179, `people-thin-alaba` 7,465. Report which chapters are
   open or folded today, and **propose** (do not decide) folding the long
   chapters (Histoire, Culture et société, Langue) behind a one-line summary.
   This is a proposal for the operator to accept or reject; keep the current
   state on the boards until then.

Do not touch the hero, « D'où vient le nom ? », « Les autres noms », the map,
or the chapter order above the added blocks.

## Real subjects

- **Rich: `PPL_FULA`.** 8 names, accounts: Fulɓe 10, Haalpulaar'en 4,
  Futankooɓe 1, Peul 4, Fula 8, Fulani 8, Fellata 8, Toucouleur 13. Source
  kinds across them: academic, intergovernmental, archive, press, encyclopedia,
  linguistic reference. No oral source. Family: Atlantique. 14 countries.
- **Oral voice present: `PPL_BASSA`.** One name, 4 accounts: 2 oral tradition,
  2 linguistic reference, 1 academic. The oral source is « How the Bassa Got
  Their Name » (Heath Vogel, 2013), the account carried by Abba Karnga, Liberia,
  « Comment les Bassa ont reçu leur nom ». Show it identified by carrier and
  place, first in its group, on equal footing with the written ones. Real
  summary: « On ne sait pas avec certitude quand le nom a été écrit pour la
  première fois. Son origine est racontée dans un récit oral que nous
  présentons plus bas. » Family: Krou. Countries: Liberia, Côte d'Ivoire,
  Sierra Leone.
- **Thin: `PPL_ALABA`.** Two names, 3 accounts: Halaba 2 (archive,
  intergovernmental), Alaba 1 (archive). No oral voice. Real summary: a name
  close to it appears in chants of the 15th century; « On ne sait pas avec
  certitude d'où vient ce nom ». Family: Couchitique. One country: Ethiopia.
  Its silences come from this data, including the absence of an oral account.

## States to draw (430 first, then 768 and 1440)

- `people-fula`: the three added blocks, first name's group open.
- `people-bassa`: the oral account in the sources block, and the closing band
  without the « aucun récit transmis oralement » silence, since one exists.
- `people-thin-alaba`: a short sources block, the silence for the missing oral
  voice, and a next step with one or two targets only.
- The entry from a social post to a name the reader did not search (the
  `PPL_ZARMA` case): the first screen repeats the promise of the link. Report
  whether the current hero already does; do not redesign it unprompted.

## Do not

- Show a tier, a score or a « most reliable » label on any source.
- Redraw the three approved components: reuse them from `Main`.
- Put the thesis anywhere but the closing band.
