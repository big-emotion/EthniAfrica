# Social production handoff — 11 October 2026

This is an implementation handoff and dated evidence report, not a second specification.
The [canonical operator specification](https://big-emotion.atlassian.net/wiki/spaces/ETHNIAFRIC/pages/212795394) owns requirements and the ordered roadmap.

## Start here

The operator requested transfer to another agent, a complete onboarding prompt, and pushing/merging this session's changes including all files reported as untracked by Git. Work in the existing local project so the ignored production evidence remains available. Do not start a fresh checkout and assume the evidence is present there.

Read in this order:

1. `CLAUDE.md`, the shared reader-facing charter, doctrine and plain-language checks.
2. `.claude/skills/ethniafrica-social-production/SKILL.md` and the canonical specification linked above.
3. This handoff, then `.local/productions/2026-10-10-congo-kongo/suivi.md` through the checkpoint helper.
4. `.local/productions/2026-10-10-congo-kongo/published-reconciliation.md`, `release-readiness.json`, `live-corpus-verification.json` and `published-observation/tiktok-credit.json`.
5. `.local/research/social-production-2026-10-09/geographic-animation-acceptance.md` and `geographic-proof/proof-report.json` before any geographic-video work.
6. `social/design-system/README.md`, `handoff.md`, `content-fit.md`, `maps.md`, `version.json` and `social/renderer/README.md` when rendering is needed; `social/video/README.md` for satellite geographic videos.

The local evidence folders are intentionally ignored, not lost or cleaned. They include roughly 148 MB of active production and 83 MB of programme research at transfer. They must be transferred separately if another computer is used. Never force-add credentials, local runtime state, restricted source documents or the whole `.local` directory to the public repository.

## Ordered programme status

| Step                         | Status at handoff                           | Result or remaining work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Consolidate specification | Complete                                    | Canonical Confluence specification replaces old workflow rules.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2. Inspect Uganda pilot      | Complete                                    | Reusable technical production inspected; seven exports reproduced, eight original tests passed. Its tone/progression are references, not mandatory anniversary structure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 3. Shared production skill   | Complete                                    | Canonical Claude skill and Codex mirror; durable per-piece state and three approvals.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4. Card design and renderer  | Complete                                    | Accepted EthniAfrica Cartes 1.1.0-proposition, six card types, two themes, 1080 × 1350. All 31 visual references passed after the operator retained the engine and reconciled two map references.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5. Research/corpus alignment | Implemented                                 | Evidence-bound proposals, required comparison at proof review, separately evidenced progress. Real pilot exposes a rebased-proposal reconciliation gap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 6. Publication package       | Implemented                                 | Exact media, selected-network copy, credits and image descriptions; verification at approval 3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 7. History/cleanup           | Implemented for normal approved path        | Actual publication snapshots and conservative cleanup. Historical import without approval 3 remains unsupported.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 8. Congo/Kongo pilot         | Published; closure incomplete               | Three posts and TikTok credit confirmed; five corrections live. Exact media reconciliation and supported historical archival path remain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 9. Geographic animation      | Design accepted; renderer passes acceptance | Claude Design « EthniAfrica Vidéo carte 0.2.0-proposition » accepted by the operator on 11 October 2026: 1080 × 1920, satellite flat by default, relief as an option. Margins (Meta Ads Guide, TikTok template) and imagery licences checked. `social/video/` renders and encodes the Congo river and three-area test sequences, with areas, hatching, borders, water and region names, and the relief option on NOAA ETOPO 2022 (32 tests). The operator accepted the Congo and areas proof videos. Design « 0.3.0-proposition » (chaptered videos of 45 to 60 s, subtitle band, historical map, two endings) accepted on 12 October 2026, not yet implemented; see below. Pending: 0.3.0 in `social/video/`, Sentinel-2, the PPL_FULA Gabon correction, the Confluence update. |
| 10. Voice/video              | Not started                                 | Voice, pronunciation, subtitles, rough cut and final encoded export after step 9.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 11. Results                  | Not started                                 | Dated platform/site observations, without inventing attribution of untracked visits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## Settled operator decisions

- Converse in simple French; documentation, comments, commits and PRs are English. Public copy is ordinary accessible French, using DITP principles and Vale. A mechanical pass is not FALC certification.
- Do not use BMAD for this programme. Legacy `_bmad` and `_bmad-output` files are only being preserved under the explicit all-untracked-files request; their presence does not change the production workflow.
- One working folder per publication. A session is convenient, not required: disk checkpoints must support a fresh session after shutdown.
- Three routine human approvals: brief, proof including corpus proposals, final package. Never fabricate historical approval, infer it from a test, or equate approval with posting authorization.
- Name history distinguishes coinage, earliest located attestation, adoption and diffusion. Identify the naming actor only when supported; an attesting author is not automatically the inventor. Explain antecedents separately from the birth of the studied name. Say where the documented trace ends.
- Research must compare relevant corpus records every time, retaining contradictions, gaps and uncertainty. Prepared, integrated and verified-live are different states.
- The static Claude Design system is the visual authority. Never use the old social gabarits or impose website styling. New video design needs an operator-mediated Claude Design handoff.
- Maps may represent regions, languages, peoples and cross-border distributions. Do not confuse speakers with identity or citizenship, or invent precise exclusive territories. Dated-name cards must not turn parallel entities into a false renaming chain.
- Mobile first: 320–430 px, then tablet 768–1199, desktop from 1200.
- Congo/Kongo networks: Instagram, Facebook, TikTok. Mobile applications chosen; captions accepted; supplied logo authorized. Do not ask these again.
- Keep all active evidence until actual outcomes and corpus work are reconciled. Do not force cleanup to make the roadmap look complete.

## What the current system can do

It can carry a new static carousel from brief through research, corpus proposals, proof, final numbered PNGs, checked copy, network packaging and three approvals. It can record actual publication outcomes and retain an approved publication's history. It does not autonomously post by virtue of package approval, does not yet produce accepted geographic video, and cannot honestly close this exceptional already-published pilot without additional reconciliation support.

The shared helper supports `publication-report`: attributed external reports with network, URL, date and fingerprinted evidence. This preserves a real publication without inventing a ready package, approval 3 or verified media snapshot. Reports block cleanup until reconciled and cannot be relabelled cancelled. Latest implementation before transfer: c7929203f; all 55 coordinator/research/package/history tests passed. Renderer tests and full repository checks must be recorded separately.

Useful commands, from the project root with Node 22:

```sh
node .claude/skills/ethniafrica-social-production/scripts/workflow.mjs status 2026-10-10-congo-kongo
npm run test:social-production
npm run test:social-renderer
npm run check:editorial
npm run check:publication -- PATH_TO_ACTUAL_PUBLICATION_FILES
```

Use helper events with the latest `expectedRevision`; never edit embedded approval JSON to force progress. `.claude/skills/` is canonical; `.agents/skills/` is the ignored Codex mirror. The social skill passed parity, but global parity previously reported unrelated incomplete legacy skill resources.

## Published Congo/Kongo evidence

The operator reported all three posts published on 10 October 2026. Authenticated browser observation subsequently confirmed presence:

- [TikTok](https://www.tiktok.com/@ethniafrica/photo/7695140784483355926)
- [Instagram](https://www.instagram.com/p/DeU81skCEwY/?img_index=1)
- [Facebook](https://www.facebook.com/photo/?fbid=122123140143465536&set=pcb.122123140239465536)

Nine 1080 × 1350 PNGs in `mobile-review-v1` were delivered, matching `exports-v1` and the accepted `proof-v2`. Instagram's nine cards were visually observed; eight downloaded JPEGs matched cards 02–09 with recompression differences. The cover download failed. One TikTok cover was downloaded and matched card 01; other attempts timed out. Full Facebook/TikTok media reconciliation remains incomplete.

Instagram/Facebook observed captions contain 997 characters and four added hashtags. TikTok has the accepted 133-character short caption and the same hashtags. Hashtags: `#ethniafrica #congo #kongo #histoiredafrique`. Facebook/TikTok also show platform-added music, Racine 2 by Extra Musica. Per-card prepared alternative text was not verified as published: Instagram attributes were empty, Facebook descriptions generic, TikTok repeated caption. Preserve actual observations and their limits.

The missing TikTok credit was explicitly authorized, posted once under EthniAfrica and visibly verified with the creator label. It credits André Semeador (2019), notes the adaptation and links the Wikimedia source and CC BY-SA 4.0. Evidence is in `published-observation/tiktok-credit.json`. Do not post it again.

The outstanding factual question is whether the same nine delivered images were uploaded in the same order without modification on all three networks. No answer was received. The latest video feedback does not answer it. Operator confirmation can be recorded as attributed evidence, not independent media verification or retrospective approval 3.

Approval 3 was not recorded before manual publication. Keep original approvals and evidence immutable. The helper currently cannot import a reconciled historical publication without approval 3; do not bypass this normal-path safeguard.

## Corpus release and final synchronization result

PRs [#1644](https://github.com/big-emotion/EthniAfrica/pull/1644), [#1645](https://github.com/big-emotion/EthniAfrica/pull/1645) and [#1647](https://github.com/big-emotion/EthniAfrica/pull/1647) were integrated in the explicitly approved combined release. Protected synchronization used [#1649](https://github.com/big-emotion/EthniAfrica/pull/1649); [#1648](https://github.com/big-emotion/EthniAfrica/pull/1648) merged recette into main.

[Release v5.0.1](https://github.com/big-emotion/EthniAfrica/releases/tag/v5.0.1), main commit `f7cae872206f6cbb6c947f111348d013eff2f4c0`, is published. [Deployment and schema check](https://github.com/big-emotion/EthniAfrica/actions/runs/38093813391) succeeded. Local release gates passed: lint, typecheck, format, 10,472 tests (21 skipped), production build. Required PR checks, full Playwright and broader Lighthouse mobile audit passed. These are release-candidate results, not proof of the new coordinator branch's final checks.

Five Kongo correction fields were independently verified against the released fiche through the public API: capital location, sources, Bakongo period label, Bentley account and attributed origin accounts. The pre-release baseline matched none; the post-release response matched all five. Preserve `live-corpus-verification.json` and `live-kongo-verified.json`.

The final [global corpus synchronization](https://github.com/big-emotion/EthniAfrica/actions/runs/38094039820) **failed** at database equality verification, although loading, cache invalidation and quiz-bank generation succeeded. Final measured counts:

| Table                  | Database | Git  |
| ---------------------- | -------- | ---- |
| afrik_peoples          | 755      | 740  |
| afrik_people_languages | 1155     | 1136 |
| afrik_people_countries | 1432     | 1402 |

Other reported tables and sampled hashes passed. Do not claim full database alignment. No pruning was performed by this session; deletion of retired rows needs a measured, separately scoped operation through the repository's normal workflow. Do not run an ad hoc production migration or use direct database access to hide the failure.

The corpus proposal in the original reviewed workspace predates intervening additions from #1645. The merged version preserves those additions and normalizes one UNESCO URL. The helper's strict pointer-value equality cannot simply advance the original proposal as though every prepared byte was integrated. It needs an evidenced rebase/reconciliation path that preserves both the approved original and the actual integrated result; do not rewrite historical hashes.

## Video feedback and remaining acceptance

Latest operator feedback: “le format du design video ne convient pas”. It has not been clarified whether this means dimensions, layout, visual treatment, animation or several of these. Do not assume 9:16, invalidate the accepted static cards, or implement another video look immediately.

The local preview is a 12-second silent WebGL experiment: globe (0–3 s), west-central Africa zoom (3–6), whole Congo River line opacity emphasis (6–10), reading hold (10–12). Canvas is 1080 × 1350, with a 1080 × 900 map. It is a technical study, not an accepted video design or encoded video. Whole-line emphasis must not imply a historical migration or travel direction.

Source: Natural Earth 110m contemporary generalized river geometry, retained from the maintainer's GeoJSON mirror after the official download failed; the mirror's exact correspondence to the advertised 5.0.0 release was not independently established. Source URLs, checksum and limits are retained in the local proof manifest. Three frame-state/source-coordinate tests passed test-first; this does not establish pixel determinism. Public proof copy passed strict checks.

Browser automation rejected the local-file URL. No alternate server/browser route was used to evade that denial. Agent visual inspection at mobile/tablet/desktop, repeated-frame pixel checks and encoded export remain unperformed. The user manually viewed the preview. Do not claim the visual checks passed or try a prohibited workaround.

Existing WebGL is a reuse candidate; D3 and MapLibre are alternatives to consider only when a concrete requirement justifies them. No engine is selected. A compositor such as Remotion does not by itself solve cartographic rendering. First clarify feedback and prepare a focused Claude Design brief for the operator; wait for the returned visual direction before changing it.

## Video design 0.3.0, accepted 12 October 2026

The operator accepted the Claude Design « EthniAfrica Vidéo carte 0.3.0-proposition » (same canvas as 0.2.0) and answered its open questions by following the designer's recommendations. It extends 0.2.0 only where it adds rules; 0.2.0 stays in force everywhere else. The package is local and ignored: `.local/research/social-production-2026-10-09/claude-design-video-0.3.0-proposition/` (`version.json` with the rulings and acceptance, `rules.md`, `timing.md`, `timeline.json`, `tokens.json`, `open-questions.md` with the answers, the canvas source). The brief is `claude-design-video-0.3.0-brief.md` in the same research folder.

- Chapters: four or five per video of 45 to 60 s; the opening plays once; no camera move within a region; a 1,800 ms travel between two grade changes for a new place, never a cut; the subtitle leaves first and enters last; one bar per chapter from three chapters, under a one-line title.
- Subtitle band (y 944 to 1054, x 120 to 780): Nunito Sans 700 36/54 on one box per line at 82 %, at least 7:1; 32 characters per line, two lines; 200 ms fades; full opacity max(1.5 s, characters ÷ 15 + 0.3 s), at most 7 s, 200 ms gap; Arabic script once, for the word under discussion, after its transcription.
- Historical map: documented elevation contour only, dotted, labelled « contour reconstitué »; period ribbon without a drying date; the imagery line ends « l'imagerie montre le paysage actuel ». For Mega-Chad: the 325 m contour (Leblanc et al. 2006) on ETOPO 2022; the design's contour is a mockup and must not be published.
- Endings: A with one sentence and the bare domain when the subject's page is online; B signature only; never a call to follow.
- Sahara example (59.7 s): relief for all five chapters; chapter 3 and 4 sources and the wording « pays des Noirs » must be checked before rendering for publication.

Next: write the failing tests for chapter chaining and subtitle timing from `timeline.json` and `timing.md`, then extend `social/video/`. Add Noto Sans Arabic SemiBold (SIL OFL 1.1) to `social/design-system/fonts/`.

## Video design 0.4.0, accepted 12 October 2026

After the first real 0.3.0 proof the operator asked for three changes: shorter, larger, centred subtitles; the spoken word highlighted; areas that enter with the words naming them. He then chose a full-screen layout and accepted 0.4.0 with his own answers to two open questions and the designer's recommendations for the rest. 0.4.0 replaces 0.3.0 only for the layout, the subtitles, the highlight and the entry of areas; chapters, camera, outline treatment, chapter marker, endings and caption content of 0.3.0 stay in force. The package is local and ignored: `.local/research/social-production-2026-10-09/claude-design-video-0.4.0-proposition/` (`version.json` with `rulings` and `acceptance`, `rules.md`, `timing.md`, `timeline.json`, `tokens.json`, `open-questions.md` with the answers, `data/cameras-fullscreen.json`, the canvas source and the scripts that rebuild it). The brief is `claude-design-video-0.4.0-brief.md` and the designer's log is `claude-design-video-result.md`, both in the same research folder. The reference frames are `Sahara6-*`, board « 11 · Full screen » and boards 12 to 14; `Sahara4-*` and `Sahara5-*` are history.

- Full-screen layout, at 1080 × 1920: signature, title (Anton 80/84) and chapter marker from y 100 to about 270; map names and focus from 290 to 1290, the image in the clear to 1540; subtitle from 1316 to 1452, centred on x 540; legend then credits at the very bottom, 1652 to 1884, under a veil that starts at 1540. The feed safe zone is now a guide, not a limit: the operator accepted that subtitle and credits are hidden by the apps in the feed until the video is opened or downloaded. New relief cameras (pitch 70°, 40° field; a closer view of the Chad basin for chapter 5) make the globe fill the frame.
- Subtitles on the image: Nunito Sans 800 56/68, #fffaf2, a 9 px dark stroke under the letters and a soft shadow, no band. Chunks of 3 to 6 words, 26 characters per line, two lines at most. Full opacity: characters ÷ 15 plus a 0.3 s lead after an empty band only, between 1.2 and 4 s. Chunks of one sentence replace each other by a cut; 300 ms of empty band between sentences.
- Spoken-word highlight, with a voice only: an accent box (#e8b96a, text #1a120a) that never changes a word's width and moves by a cut. No highlight on a silent video. Word times come from forced alignment of the recorded voice on its script, as JSON words with start and end; the tool is chosen at step 10.
- Areas that follow the text: an area enters with the chunk (or, voiced, the phrase) that names it, fading in whole in 600 ms; its name follows at 300 ms. Earlier areas of the chapter step down smoothly to 55 % in 600 ms, ease-in-out, never by a jump. Reconstructions are hatched with a dashed edge; names are placed by one deterministic rule; at most six names and four legend items.
- Before rendering for publication: every Sahara area is a hand-drawn placeholder and must be sourced or replaced; the coordinator decides the chapter 4 text; the renderer needs a font carrying ʾ (U+02BE), Noto Sans as fallback; relief is rendered on ETOPO 2022 with the cameras in the package.

Next: write the failing tests for the layout, chunking, highlight timing and area entry from the 0.4.0 `timeline.json` and `timing.md`, then extend `social/video/` and re-render the Sahara proof for approval 2.

## Next agent's work, in order

1. Read the handoff and durable checkpoint; show a short recovered status and keep an explicit task list. Ask what part of the video format needs to change. Do not repeat settled questions.
2. Finish step 8 reconciliation: obtain or inspect exact published-media evidence, preserve actual copy/credits/music/alt limits, and document the failed global sync separately from the five live Kongo fixes.
3. Test-first, implement only the missing historical-import and rebased-corpus reconciliation cases. Start with failures for invented approval, stale evidence, changed media, unsupported closure and lost original history; add the smallest supported path. Keep normal three-approval rules unchanged. No archive cleanup until retained output has been inspected and all prerequisites truly hold.
4. Finish the video clarification/Claude Design brief, then integrate only the returned accepted design. Test geographic and encoded-video acceptance separately, inspecting phone before tablet and desktop.
5. Add voice, pronunciation and rough-video review; then dated results measurement. Keep steps 9, 10 and 11 distinct.

The operator authorized pushing and merging this session's changes. This is not blanket authorization for additional social posts, destructive database pruning or another production release. Follow protected branches and required checks; never bypass them. No Co-Authored-By trailers. Preserve other agents' work.

## Transfer mechanics

This report is versioned. The executable onboarding prompt is retained alongside the local programme evidence as `onboarding-prompt.md`; it points back here and to the canonical specification. A fresh local chat can recover all context without importing the full conversation. The transferring agent will report actual PR outcomes and final checks separately; a queued or blocked merge is not a completed merge.
