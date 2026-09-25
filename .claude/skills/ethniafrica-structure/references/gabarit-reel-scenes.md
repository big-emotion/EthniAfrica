# Editorial structures for scene-based videos

Use with `social/harness/SCENES.md`, the executable plan validator and the
existing source-tier/editorial rules. These structures govern the argument;
the same paragraph can be illustrated by a map, a document or a photograph.
Do not equate a change of shot with a change of subject.

## Name-origin

Keep `gabarit-reel-nom.md` and its category-specific controls, including the
patronymic/institution case. Locate the place or use, distinguish attestation
from proposed origin, show the relevant document, compare usages, state limits
and answer the opening question. Use the engine's `name-origin` beat tags to
describe the visual sequence, not to rewrite its prescribed narration.

## History and geography

Question → context → dated evidence → evolution → limits → closing.
Give each geographic state its own period and source. Distinguish political
control, settlement, linguistic diffusion and circulation of a name. Today's
borders can orient the viewer; they need not remain visible. Never turn a
modern country polygon into an ancient kingdom or an exclusive ethnic boundary.
If sources only support two places, show two places, not a fabricated route.

## Thematic analysis

Question → definitions → situated case → evidence → limits → position → closing.
Define the terms before making a comparison. State what the cited study actually
observed and the scale of that observation. A political position belongs in
an explicitly editorial scene; it must not masquerade as a measured result.
The operator can take a position without inventing a myth to refute.

The four community briefs illustrate different uses of this same structure:

| Topic                     | Necessary distinction                                                                  | Useful scenes                                                           |
| ------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Names and mutual aid      | Naming practices, affiliation and voluntary associations are not a proven causal chain | Terms comparison, situated cases, source document                       |
| Cooperation across groups | A bounded political comparison is not a collective psychology of entire peoples        | Located comparison, mechanisms, competing explanation                   |
| Shared communication      | First language, lingua franca, official status and actual use differ                   | Use comparison, dated diffusion if sourced, limits                      |
| National belonging        | State formation, national identification and public-service outcomes differ            | Current borders as context, dated political evidence, explicit argument |

These are planning examples, not production-ready scripts, new calendar slots or
approval of unverified claims. Read the reviewed briefs before filling them.

## Free structured sequence

Use `free` when a fixed argument would distort the material. Explain the opening
question, the role of each scene and what resolves it. Every scene still needs
sources, period/status, a purpose and valid timing. Freedom in structure is not
freedom to omit uncertainty or to turn unsupported geography into a picture.

## Preparation and delivery

### Reusable visual choices

The maintained recipes are in `social/harness/templates/scene-storyboards.md`;
use `social/harness/SCENE-PRODUCTION.md` for the preparation/execution boundary.

Use `timeline.layout: focus` with `context_layout: corner` for the operator's
preferred chronology: one dominant date, a quiet upper-right note and an optional
final overview before closing. Use two or three primary dates per scene. Each
context item has its own period, which need not equal the main event's exact year.
Regional neighbours and familiar world events should fit the subject and audience;
never manufacture a causal connection or force the same country into every sequence.

`timeline.background` now accepts sourced points, routes and regions, with explicit
reveal/expiry cues. Keep the visible uncertainty and schematic qualifiers. The map
sits below the rail; contextual cards must not cover it. Geographic scenes can also
use a small point annotation with leader line, or a separate wider contextual shot.

Prefer visible region fills and simple location points. Halos remain supported for
older plans but are not the preferred default. Current dashed borders orient the
viewer without becoming historical or exclusive population boundaries. Reuse a
camera/scene pattern, never another subject's geometry without evidence.

A sustained historical explanation should carry a relevant document or image.
Use `document` for an attributed portrait, title page or other archival object
beside concise copy. Keep `text` for a brief intentional pause or statement,
not as the automatic replacement for a missing source image.

For schematic geographic presence, `presence-zone` gives a feathered coloured
area and requires an explicit uncertainty status and visible `geometry_note`.
Modern borders can remain behind it with `border_style: dashed`. The soft edge
does not measure population density, exclusivity or a political boundary.

1. Complete the subject/source work and obtain the existing explicit approval
   for the full narration. Do not use rendering to introduce unseen speech.
2. Prepare the audio and measured alignment through the existing workflow.
3. Choose the profile; write the visual storyboard with explicit source links,
   asset licenses and geographic uncertainty. Label an excerpt as an excerpt.
4. Run the scene validator, inspect the mobile previews and then render a proof.
5. Run message/myth review on the new composition. An earlier script audit does
   not approve new historical geography or image associations.

Handoff roles: the strong model chooses and substantiates; the execution model
fills the accepted plan and resolves assets; the engine checks and renders;
the operator listens, reviews and approves. When information is missing, the
execution model reports it instead of changing the engine or inventing a fact.

The engine validates required beat presence for a `complete` profile; it cannot
judge whether the argument is fair, whether a study supports a causal claim,
or whether the closing actually answers the question. Those remain editorial
review tasks. The registered publication workflow and website routes remain
separate; this video extension does not create a generic dossier entity type.
