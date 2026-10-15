# Claude Design prompt, step 3 — brief 3, the language fiche

Text to paste in the **same Claude Design conversation** as briefs 1 and 2, on
the site canvas "EthniAfrica, relevé des pages en production"
(<https://claude.ai/artifact/TFD4syHT5UygK4WnxGA5Rd>), with the EthniAfrica
Design System selected. Briefs 1 and 2 are approved and implemented; this
message starts brief 3 ([`03-language.md`](03-language.md)). Procedure:
`docs/design/mockup-first-workflow.md`.

Nothing needs attaching. Do not start before the operator has read this text.

## Text to paste

```text
We start brief 3, the language fiche. Briefs 1 and 2 are approved and implemented: do not touch the search boards, the search-state boards or the people boards. The same rules as before apply: mockups first, 430 px then 768 then 1440, real French copy, existing tokens only, a source shows its type and never a tier, no name is crowned, the site never affirms, the thesis only in the closing band as [THÈSE — texte à fixer] and not shown until its text is fixed. Work in the same canvas and edit the existing board.

STEP 0 — before changing anything, reply in 8 lines: which board you can see (language-lingala at 430, 768 and 1440); its chapters in order; its height at 430; whether the three components approved in briefs 1 and 2 are on Main so you can reuse them, including the fiche variant of « Les sources parlent » (« Qui raconte les noms de ce peuple ? »); what « Rôle véhiculaire » and « Vitalité » show today; and whether the chips of « L'histoire des noms » open anything. Change nothing yet.

BOARD TO CHANGE, at -430, -768 and -1440: language-lingala. Main changes only if a shared component does.

WHAT IS ON THE BOARD TODAY — do NOT redraw: the hero plate and the chapter bar; « L'histoire des noms » with its chips (Bangala, Kinshasa, Lingala, Losengo, Mangala, Ngala); « Identifiants » (ISO 639-3 lin, Glottocode ling1263, the review chip); « Famille linguistique » (Bantou); « Personnes qui parlent cette langue » (Ngala (Bangala), Lingala (locuteurs)); « Dialectes »; « Poursuivre »; « Sources ».

FOUR THINGS TO REPORT AND FIX
a. « Rôle véhiculaire » prints the raw value regional_lingua_franca, an English code. Show a French label; propose one and mark it as a proposal.
b. « Vitalité » says « Information manquante »: a block that renders to say it is empty. Remove the block; the silence moves into the closing band.
c. The two readings of the name's origin are not on the board as text. They exist in the data (below). Show them as competing accounts side by side, « Hypothèse 1 » and « Hypothèse 2 » in neutral order, each with its sources, using the same grammar as the search-state-competing board. Tell me where you put them and why.
d. The chips list six names but the history holds three (Lingala, Bangala, Mangala): Kinshasa, Losengo and Ngala come from the list of alternate names and have no account. Report it; do not invent accounts for them.

WHAT TO CHANGE
1. Add « Les sources parlent » after the name history, using the fiche variant approved in brief 2: accounts grouped by name first, then by the seven source-diamond families, oral first, only the first name open. Title it for a language (propose « Qui raconte les noms de cette langue ? » and mark it as a proposal).
2. Add the closing band « Ce que nous ne savons pas encore » before « Poursuivre », reusing the approved component: silences deduced from the data one per line (including the vitality and the missing oral account), the « Notre conviction » sentence of the About page, the invitation to correct with « Signaler une erreur » and « Proposer une source », the thesis line hidden.
3. Turn « Poursuivre » into « Poursuivre avec un autre nom », reusing the approved component: each target with a reason, the first sentence of the target fiche's summary. Remove any target without a fiche.
4. Fix a and b above, and draw c.
Do not touch the hero, the identifiers, the dialects, the family, the chapter order above the added blocks, or the sources list.

REAL DATA FOR THE BOARD (language lin, Lingala)
- Summary: « Le nom lingala désigne une langue du bassin du Congo, que beaucoup de ses locuteurs appellent aussi mangala. Elle a porté d'autres noms : Bangala, et avant lui bobangi et kibangi. Les sources ne s'accordent pas toujours sur leur origine ; nous les présentons plus bas. »
- Accounts per name: Lingala 11 (academic 9, archive 2, government 1), Bangala 4 (academic 4, archive 1), Mangala 3 (academic 3). No oral source recorded. Periods seen: Lingala « Depuis 2006 », « 1904 », « 1902 »; Bangala « Aujourd'hui », « 1884-1885 », « Avant l'arrivée des Européens »; Mangala « Aujourd'hui », « Sens en bobangi », « Vers 1882 ».
- Reading 1, Meeuwis: Europeans arriving on the Congo river in 1881-1882 learned Bobangi, the riverside trade language, imperfectly and simplified it a great deal. That speech was carried in 1884-1885 to Bangala Station, a State post, and received the name « Bangala ». In 1901-1902 the Scheut missionaries at Nouvelle-Anvers renamed it « Lingala », a name that no source before 1902 mentions; in several Bantu languages of the region the prefix ba- names peoples, not languages.
- Reading 2, Mimpongo (2024): he disputes that the name is a missionary creation. Lingála and Mangála are short forms of Bobangi expressions meaning « la langue des marchés », so a name of Bobangi origin.
- The two readings rest on different sources and are not ranked here. They diverge on how old Mangala and Lingala are as names of the language. The name Bangala was first given by Europeans to the inhabitants of the Mankanza region, then to their post and their speech, according to both authors; it remains in use in the north-east for a local variety.
- Family: Bantou. People listed in the data: Lingala (locuteurs); the board also lists Ngala (Bangala).
- Speakers: Congo (RDC) 34,000,000, « langue maternelle et langue commune d'échange confondues », a figure from the project's own earlier compilation that no source read could back. If you show it, show it as a declared estimate with that caveat, never as a headline figure. Vitality: absent from the data.
- Next-step targets that have a fiche and a summary: Bantou (« Le nom bantou désigne une famille de langues d'Afrique centrale, orientale et australe, et non un peuple. »), Lingala (locuteurs) (« Le nom Lingala désigne ici l'ensemble des gens qui parlent le lingala, une langue du fleuve Congo devenue langue commune de millions de personnes. Ce n'est pas le nom d'un peuple au sens strict. »), Ngala (« Le nom Ngala, ou Bangala, désigne des peuples riverains du fleuve Congo, autour de Mankanza, dans le nord-ouest de la République démocratique du Congo. »).
Invent nothing beyond this. Where a value is missing, say so in your report.

STATES TO DRAW (as states of the language-lingala board, 430 first, then 768 and 1440)
- Rich: lin with the added blocks, the first name open, the two readings side by side.
- A language and a people sharing a name: lin with Lingala (locuteurs), whose own summary says it is not a people in the strict sense. Draw the sentence that a language and a people are different things, and that the confusion is part of the name's history.
- Thin: Havu (kihavu, code hav). One name, Kihavu, one account (sources: Glottolog, a linguistic reference, and an academic atlas). Summary: « Le nom kihavu désigne une langue bantoue de la République démocratique du Congo. Il est formé du nom du peuple Havu et du préfixe ki-, qui sert à nommer les langues. Nous n'avons pas trouvé de source qui explique le nom Havu, ni sa plus ancienne trace. » That last sentence is a real silence of the data: declare it in the closing band. Family: Bantou. People: Havu. Vitality: Vigorous (EGIDS, Ethnologue, 2025). Vehicular role: the raw value non_vehicular, another code to show as a French label. No debated origin, no dialects. A short sources block, a next step with one or two targets only. Use only what its fiche holds; mark anything else as missing.

Do not: present a speaker count as a precise figure; crown one of the two readings or order them by authority; show a tier, a score or a « most reliable » label; redraw the approved components; put the thesis anywhere but the closing band.

Deliver: the changed boards, labelled, in the canvas. After them, list in 5 lines every choice you made that I did not specify, so I can reject any of them. Then wait for my approval.
```

## After approval

Per `docs/design/mockup-first-workflow.md`, step 4: copy `project/*.dc.html`,
`canvas.json`, `ea-live.css` and `assets/` into `docs/design/mockups/site/`,
add an « Approved boards » section to `03-language.md` as briefs 1 and 2 have,
and update the verbatim part of `ea-live.css` in the same commit if
`src/styles/` is touched. Only then does implementation start.
