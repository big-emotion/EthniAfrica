# Public agent (MCP server)

EthniAfrica serves one read-only Model Context Protocol server, so that an
assistant (Claude, ChatGPT) can answer "where does the name X come from?" from
our fiches. It is part of the Next.js app, stateless, and stores nothing about
the person asking.

- Endpoint: `POST https://ethniafrica.com/api/v2/mcp` (JSON-RPC 2.0, one JSON answer per
  POST, no session, no event stream).
- Tools: `rechercher_nom` (search a name) and `lire_fiche` (read one fiche).
  Answers are in French and follow the approved frame (in brief, two markers,
  language, meaning and reason, other names, what people often believe, what is
  not known, where to read further). A source is shown by its type, never its
  tier.
- Authentication: none. Anonymous calls are metered per address in their own
  bucket, `MCP_RATE_LIMIT_IP_RPM` (default 600 a minute), because assistants
  call from a few shared egress addresses. A Bearer key is optional and, when
  sent, must be valid: an invalid key is a 401, never a silent downgrade.

The production address is `https://ethniafrica.com/api/v2/mcp`. It answers only
after a published Release carries this route: before that, production answers 404. Merging into `recette` deploys recette, whose address is in the deployment
settings; replace `ethniafrica.com` with that host to try the connector before
the Release.

## Check the endpoint first

```bash
npm run mcp:check -- https://ethniafrica.com/api/v2/mcp
```

It runs `initialize`, `tools/list` and `tools/call rechercher_nom` with the
name Traoré, and prints `PASS` or `FAIL` with the reason for each step. The
exit code is 1 if any step fails. Run it before connecting any assistant.

## Connect

### Claude Code

```bash
claude mcp add --transport http ethniafrica https://ethniafrica.com/api/v2/mcp
claude mcp list
```

`claude mcp list` should show `ethniafrica` as connected. Add `--scope user` to
make it available in every project.

### claude.ai and Claude Desktop (custom connector)

1. Open Settings, then Connectors, then Add custom connector.
2. Name: `EthniAfrica`. URL: `https://ethniafrica.com/api/v2/mcp`. Leave the
   authentication fields empty.
3. Plans: custom connectors need a Pro or Max plan. On a Team or Enterprise
   plan an owner adds the connector for the organization first, then members
   enable it. A free account can add one custom connector.
4. In a conversation, enable the connector from the tools menu.

### ChatGPT

1. Open Settings, then Connectors (or Plugins, depending on the version), and
   add a custom MCP server with the URL `https://ethniafrica.com/api/v2/mcp`, no
   authentication.
2. Some plans require developer mode (Settings, Connectors, Advanced) before a
   custom MCP server can be added. Availability depends on the plan and on
   workspace rules; an administrator may have to allow it.
3. Enable the server in the conversation before asking.

The menu names above move often in both products. If a label differs, look for
"custom connector" or "MCP server".

## What to type to try it

- `D'où vient le nom Traoré ?`
- `Que veut dire Peul ?`
- `Lis la fiche du peuple Bambara.`

The answer should open with "En bref", show the two markers, and end with the
link to the fiche. It must never show a source tier.

## Troubleshooting

| Symptom                                                    | Likely cause and fix                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `mcp:check` fails on every step with `429`                 | The shared address spent its bucket. Raise `MCP_RATE_LIMIT_IP_RPM` or wait one minute; `Retry-After` says how long.                 |
| `401 invalid_key`                                          | The client sends a Bearer header. Remove it, or use a valid key; an invalid key is refused on purpose.                              |
| `tools/call` returns "Nous ne pouvons pas lire nos fiches" | The corpus database is unreachable from that deployment. Check the Supabase variables and the `afrik_*` tables on that environment. |
| The assistant says it cannot reach the server              | The host is not public, or a proxy strips `POST` bodies. Run `mcp:check` from outside the network.                                  |
| The assistant connects but never calls a tool              | The connector is not enabled in the conversation, or the plan does not allow custom connectors.                                     |
| Browser preflight fails                                    | `OPTIONS /api/v2/mcp` must answer with CORS headers; see `src/lib/api/cors.ts`.                                                     |

## From recette to production

Merging into `recette` deploys recette only. Only a published GitHub Release
deploys production (`/ethniafrica-release`).

1. The pull request is merged into `recette` and the recette deployment is
   green.
2. `npm run mcp:check -- https://<recette-host>/api/v2/mcp` passes all steps.
3. Connect Claude Code to recette and ask the three sample questions; read the
   answers as a reader would (frame order, markers, no tier, French register).
4. `MCP_RATE_LIMIT_IP_RPM` is set where it should differ from 600, and Upstash
   is configured (production answers 500 without it).
5. Open the connector in claude.ai and ChatGPT against recette once.
6. Prepare the release, publish it, then run `mcp:check` against the production
   host and connect one real assistant to it.
7. Roll back by publishing the previous Release; the endpoint holds no data, so
   there is nothing to migrate back.

Not in scope here: proposals from readers (private issue queue and the daily
routine) are documented with that feature.
