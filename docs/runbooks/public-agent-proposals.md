# Public agent proposals

The public agent (`POST /api/v2/mcp`) has one write tool, `proposer_nom`. A reader
proposes a missing name, a correction or a family testimony; the tool files it in a
**private GitHub repository**, one issue per name, one comment per proposal. Nothing
is stored on our side. A daily routine reads ripe issues and opens one pull request
per name; merging stays human.

The code is in `src/api/v2/handlers/publicAgentProposal.ts`,
`src/lib/publicAgent/` and the French words in `src/lib/i18n/copy/publicAgent.ts`.

## Issue contract

- Repository: env `GITHUB_PROPOSALS_REPO` (`owner/name`).
- Issue title: the name's normalized key (lowercase, accents stripped, spaces
  collapsed, 120 characters at most). Case and accent variants share one issue.
- Labels: `proposition` always, plus `kind:new-name`, `kind:correction` or
  `kind:testimony` for each kind seen. The routine adds `pr-open`, then `processed`.
- Issue body (first proposal only): `<!-- ethniafrica-proposal v1 -->`, `Name:`, `Key:`.
- Each proposal is a comment starting with
  `<!-- proposal v1 kind=<kind> consent=<true|false> -->`, then `Details:`,
  `Sources:` (one per line, five at most), `Fiche:`, `Element:`, `Withdrawal:`
  (sha256 of the withdrawal code) and, for a testimony only, `Transmitter:` and
  `Testimony:`.
- Limits: details 2000 characters, testimony 2000, five sources of 300. A testimony
  without consent is refused. Free text is folded onto one line so it cannot forge a
  field or a marker, and `@` is defused so nobody is notified.

## Set up (operator, by hand)

1. Create the **private** repository `ethniafrica-propositions`. Create the labels
   `proposition`, `kind:new-name`, `kind:correction`, `kind:testimony`, `pr-open`,
   `processed`.
2. Create a GitHub App (Settings, Developer settings, GitHub Apps). Permissions:
   **Issues: read and write** and nothing else. No webhook. Generate a private key
   (PEM).
3. Install the app on **that repository only**. Note the app id and the
   installation id (the number at the end of the installation settings URL).
4. Set the variables, all server-side secrets:

   | Variable                           | Value                                       |
   | ---------------------------------- | ------------------------------------------- |
   | `GITHUB_PROPOSALS_REPO`            | `owner/ethniafrica-propositions`            |
   | `GITHUB_APP_ID`                    | the app id                                  |
   | `GITHUB_APP_INSTALLATION_ID`       | the installation id                         |
   | `GITHUB_APP_PRIVATE_KEY`           | the PEM; line breaks may be written as `\n` |
   | `PUBLIC_AGENT_PROPOSALS`           | empty, or `off` to close the tool           |
   | `PUBLIC_AGENT_PROPOSALS_DAILY_CAP` | new issues per key per day, default 10      |

   Locally they go in `.env.local` (documented in `.env.example`). For recette and
   production they go in the hosting environment's secret store, then the app is
   redeployed. The daily cap needs the same Upstash variables as the rate limiter;
   in production the tool refuses to open an issue without them.

Until the four GitHub values are set, the tool is absent from `tools/list` and a call
returns a tool error.

## Test on recette

Use a **separate private test repository** (for example `ethniafrica-propositions-test`)
with its own app installation, never the real one. Point the recette variables at it,
then call the tool through any MCP client:

1. `proposer_nom` with a new name and a source: one issue, one comment.
2. The same name with other case or accents: still one issue, a second comment.
3. A testimony without `consentement: true`: refused, nothing filed.
4. Set `PUBLIC_AGENT_PROPOSALS=off`, redeploy: the tool disappears from `tools/list`.

Check the comment holds no IP, user agent or key id. Then swap the variables to the
real repository for production.

## Kill switch

Set `PUBLIC_AGENT_PROPOSALS=off` and redeploy: the tool is hidden and any call returns
a French tool error. Emptying any GitHub variable has the same effect. The two read
tools are untouched.

## Rate limits

`/api/v2/mcp` is metered by `src/proxy.ts` like every `/api/v2` route. On top of that,
`PUBLIC_AGENT_PROPOSALS_DAILY_CAP` bounds **new issues** per API key per day. Callers
without a key share one anonymous bucket, so a flood from anonymous callers closes
the door for all of them until the next day (comments on existing issues still pass).
The counter is a digest of the key id under a day-stamped name that expires on its own.

## Privacy and what is not automated

- The tool receives only the arguments above. The caller's address, headers, user
  agent and conversation are not read.
- The transmitter of a testimony is never named: the comment carries one constant,
  `PENDING_TRANSMITTER_FORMULA` in `src/lib/publicAgent/proposal.ts`. **The wording is
  pending an operator decision.**
- **Person names and residence places are not redacted by code.** A heuristic would
  miss names and cut the origin places a story rightly names. The controls are the
  tool description (the agent is told not to write them), the consent step, and the
  human review of every issue and every pull request. Strip them by hand when
  drafting a fiche.
- Two simultaneous first proposals for a new name can open two issues (GitHub search
  is not transactional). Close the duplicate and keep its comments in the other.

## Answer a withdrawal request

The person was given a code once; we hold only its sha256.

1. Compute the digest: `printf '%s' '<code>' | shasum -a 256`.
2. Search the private repository for that digest (search box, or
   `gh search issues --repo owner/name '<digest>'`; comments are indexed).
3. Delete the matching comment (the issue's menu, "Delete"). If it was the only
   comment, close the issue with the label `processed` and a note "withdrawn".
4. If a pull request is already open for the name, remove the person's material from
   it before merging. If it was merged, a correction is a normal editorial change.
5. Answer the person without quoting the code back.
