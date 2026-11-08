# Runbook: submitting the public agent to the Claude and ChatGPT directories

The public agent is one stateless, read-only remote MCP server at
`/api/v2/mcp` (tools `rechercher_nom` and `lire_fiche`). Readers can already
add it by hand from `/fr/assistant`. This runbook lists what each directory
asks for, what the repository already provides, and what is blocked until the
operator acts. Nothing here has been submitted.

The requirements below were read from the official pages on 2026-11-08.
Directory forms change: reread the linked page on the day of submission.

## What each directory requires

### Claude Connectors Directory

Source: <https://claude.com/docs/connectors/building/submission.md>, with the
review rules at <https://claude.com/docs/connectors/building/review-criteria.md>.

- Submit through the developer portal at <https://claude.ai/directory/manage>,
  choosing "MCP connector". Any paid Claude plan can submit.
- The server must be remote and reachable over HTTPS. Authentication: none is
  needed for public data, so the connector stays unauthenticated while it is
  read-only.
- Every tool needs a `title` and the applicable `readOnlyHint` or
  `destructiveHint`. The portal flags tools without them.
- A privacy policy URL, a documentation URL, a support contact and an icon.
  A missing or incomplete privacy policy is an immediate rejection.
- A name (100 characters), a one-liner (200), a description (2,000), one to
  five categories and a permanent URL slug.
- Test-and-launch step: access instructions for reviewers, plus confirmation
  that every tool was run in Claude as a custom connector or in MCP Inspector.
- Seven compliance acknowledgments (directory guidelines, first-party API,
  financial transactions, AI media generation, prompt injection, conversation
  data collection, public documentation).
- Directory terms and policy apply:
  <https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms>,
  <https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy>.
- Anthropic scans automatically and lists a connector as "Community" by
  default; the "Verified" label is a separate step
  (<https://claude.com/docs/connectors/verification.md>). Escalations:
  `mcp-review@anthropic.com`.

### ChatGPT plugin directory

Source: <https://developers.openai.com/apps-sdk/deploy/submission>.

- Complete individual or business verification in the OpenAI organization
  settings before publishing under a company name. An organization owner
  submits; other members need the "Apps Management Write" permission.
- Domain verification: host the token the portal issues, as plain text and
  nothing else, at `/.well-known/openai-apps-challenge` on the MCP hostname
  or an eligible parent domain. The portal shows the exact URL.
- A stable public HTTPS MCP endpoint; one MCP server per plugin. Public
  submissions reject non-empty server headers.
- Exactly five positive and three negative test cases for the initial review
  (see below), each run beforehand.
- A reviewer-accessible video walkthrough URL, a logo and a composer icon
  (square, at least 48 x 48 px, PNG, JPEG, WebP or SVG, up to 5 MiB).
- Four public HTTPS listing URLs naming the same publisher: website, support,
  privacy policy and terms of service.
- Display name up to 30 characters, short description up to 30, long
  description up to 4,000, developer name up to 80, a category, release
  notes.
- Reviewer credentials only if sign-in is required (not the case while
  read-only).

## Tool annotations

Both tools only read the corpus, store nothing and reach nothing outside our
own services, so they declare:

| Tool             | title                                  | readOnlyHint | destructiveHint | openWorldHint |
| ---------------- | -------------------------------------- | ------------ | --------------- | ------------- |
| `rechercher_nom` | A French title naming the search       | true         | false           | false         |
| `lire_fiche`     | A French title naming the fiche reader | true         | false           | false         |

Check the tool registration in `src/api/v2` (the MCP route from PR #2009)
declares all three hints and a `title` on every tool before submitting. The
proposal tools, when they ship, are writes: they will need `readOnlyHint:
false` and a new submission or update.

## Test cases

Built from the answer frame (En bref, two markers, langue, sens et pourquoi,
autres noms, ce qu'on croit souvent, ce qu'on ne sait pas, pour aller plus
loin). Run each in Claude as a custom connector and in ChatGPT in developer
mode before submitting.

Positive cases, one per content type, taken from the six answer cards of
brief 20 (`docs/design/mockups/briefs/20-agent-answer-card.md`). OpenAI
requires exactly five; run all six anyway and pick the five best for the form.

| Content type    | Prompt                            | Expected tools                 | Expected result                                        |
| --------------- | --------------------------------- | ------------------------------ | ------------------------------------------------------ |
| Family name     | "Traoré"                          | `rechercher_nom`, `lire_fiche` | Origin marker, clan context, link to the fiche         |
| People          | "Baoulé"                          | `rechercher_nom`, `lire_fiche` | "Discuté" marker, a founding story in several versions |
| Language family | "Les Bantous, c'est qui ?"        | `rechercher_nom`, `lire_fiche` | A linguist's name not taken for a people               |
| Country         | "Pourquoi on dit Côte d'Ivoire ?" | `rechercher_nom`, `lire_fiche` | Who named it, when and why, with source types          |
| Place           | "Daloa"                           | `rechercher_nom`, `lire_fiche` | Place fiche, no invented origin                        |
| Word            | "D'où vient le mot tribu ?"       | `rechercher_nom`               | "Venu d'ailleurs" marker, with what is not known       |

Negative cases (three for OpenAI):

| Prompt                                        | Why the plugin must not act | Expected behaviour               |
| --------------------------------------------- | --------------------------- | -------------------------------- |
| "Écris-moi un poème sur la mer"               | Not about a name's origin   | No tool call                     |
| "Quel est le meilleur prénom pour mon bébé ?" | Advice, not sourced history | No tool call, or a short refusal |
| "Supprime la fiche Traoré"                    | The connector is read-only  | Says it cannot change the corpus |

Edge cases to run once and keep the transcript of:

- A near spelling ("Bawlé" for Baoulé): the assistant offers the right form.
- A name matching several fiches ("Bambara": people or language): all
  listed, none promoted.
- A word with no fiche ("sauvage"): the assistant's own answer is said to be
  unreviewed, no invented origin.
- A very long input and an input holding an email address or a link: handled
  without error and without echoing personal data.
- The rate limit: an anonymous burst returns a clear error the assistant can
  explain, not a stack trace.

Limits to state in the listing: French only, read-only, anonymous tier rate
limit, answers limited to what the fiches hold.

## Screenshots and media

- Claude: screenshots are required for MCP Apps only (PNG, at least 1,000 px
  wide, 3 to 5 images, cropped to the response, no video or GIF). A plain
  connector needs an icon only. Use the card boards in
  `docs/design/mockups/site` (`agent-card-*`) as the reference for what an
  answer should look like.
- ChatGPT: a walkthrough video (reviewer-accessible URL), a logo and a
  composer icon. Record the video from the five positive cases.

## Publisher verification

BIG EMOTION is the publisher and holds the EthniAfrica trademark (INPI
no. 5309254, classes 9, 16, 41 and 42). Use the same legal entity name, address
and contact on: the Claude "Company" step, the OpenAI business verification,
the legal notice page and the four OpenAI listing URLs. A mismatch between the
publisher on the listing URLs and the verified organization is a rejection
cause on the OpenAI side.

## What exists and what is blocked

| Item                                                          | Status                                                                                                                                                                       | Owner                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Read-only MCP server (`/api/v2/mcp`)                          | Exists in draft PR #2009                                                                                                                                                     | Merge by the main session                  |
| Install page `/fr/assistant`                                  | Exists (this branch)                                                                                                                                                         | Merge after board review                   |
| Privacy text for the read-only connector                      | Exists in the data policy ("Données traitées")                                                                                                                               | Done                                       |
| Privacy text for proposals and testimonies                    | BLOCKED: wording waits for the transmitter formula decision and the shipped flow                                                                                             | Operator, then a text change with its test |
| Terms of service page                                         | BLOCKED: new page, needs mockup boards first                                                                                                                                 | Operator approves boards                   |
| Support page (public, HTTPS)                                  | BLOCKED: new page, needs mockup boards first. The contact page exists but is not a support page for the connector                                                            | Operator approves boards                   |
| OpenAI domain-verification file                               | BLOCKED: the token is issued by the portal at submission time. Serve it as plain text at `/.well-known/openai-apps-challenge`, from an environment variable, never committed | Operator at submission                     |
| OpenAI organization verification                              | BLOCKED: done by hand in the OpenAI organization settings                                                                                                                    | Operator                                   |
| Claude developer portal account and submission                | BLOCKED: done by hand at the portal                                                                                                                                          | Operator                                   |
| Icon, logo and composer icon (square, 48 px minimum)          | To prepare from the brand assets                                                                                                                                             | Operator                                   |
| Walkthrough video                                             | To record after the five positive cases pass                                                                                                                                 | Operator                                   |
| Tool annotations (`title`, `readOnlyHint`, `destructiveHint`) | To verify in the route of PR #2009                                                                                                                                           | Main session                               |
| Proposal tools (GitHub App, private repository)               | Not shipped; created by hand by the operator                                                                                                                                 | Operator                                   |

## Order of work

1. Merge the connector and the install page; check annotations.
2. Run the test cases by hand in both assistants and keep the transcripts.
3. Approve boards for the terms and support pages, then build them.
4. Record the video, prepare the icons.
5. Submit to the Claude portal first (no domain file, no organization
   verification step), then to OpenAI once the organization is verified and
   the challenge file is served.
