# Runbook — reading Facebook and Instagram audience data (read-only)

`scripts/meta/read.ts` reads the comments and the audience metrics of the
Facebook Page and of the Instagram account it is linked to, through Meta's Graph
API. It replaces collecting them by hand for `/ethniafrica-audience-audit`, which
needs per-post figures and the comments a post drew.

**It only reads.** The client it is built on (`scripts/lib/metaGraph.ts`) exposes
`get` and `getAll` and nothing else. There is no publish, reply, hide or delete
command, and adding one means writing a second module with its own token — not
flipping a flag here.

## Why the Meta MCP servers are not used

The two official Meta MCP servers cover app management and WhatsApp. Neither
reads Page or Instagram comments, insights or media, so this goes to the Graph API
directly.

## Running it

```bash
npx tsx scripts/meta/read.ts comments facebook  --post <id>  --out <dir>
npx tsx scripts/meta/read.ts comments instagram --media <id> --out <dir>
npx tsx scripts/meta/read.ts insights facebook  --out <dir>
npx tsx scripts/meta/read.ts insights instagram --out <dir> [--recent <n>]
```

- `<id>` for a Facebook post or reel is the number in its URL. It is accepted as
  is; a Page post can also be addressed as `<page id>_<post id>`.
- Instagram media ids come from `insights instagram`, which lists the recent posts.
- Each run writes one timestamped JSON file and prints only counts. It never
  prints a comment.

### Configuration

Three variables, documented in `.env.example`. **Load them from a file kept outside
any git checkout**, not from `.env.local`: the token is a credential, and the
output holds people's words.

| Variable          | What it is                                      |
| ----------------- | ----------------------------------------------- |
| `META_PAGE_TOKEN` | A Page access token (see below). Secret.        |
| `META_PAGE_ID`    | The Facebook Page id. Needed for Page insights. |
| `META_IG_USER_ID` | The Instagram professional account id.          |

`--out` is required and is refused when it sits inside a git checkout, worktrees
included. Facebook returns comment authors only for the Page itself, so a
Facebook file names almost nobody; an Instagram file carries usernames. Treat
both as personal data and do not commit, paste or publish them.

## The token, and what it costs to keep

Reading comments and insights needed a Page access token derived from a
long-lived user token, obtained through an app in the same business portfolio as
the Page. Facts worth knowing before touching any of it:

- **The Page lives in a business portfolio**, so listing it through `me/accounts`
  needs `business_management` as well as `pages_show_list`. Without it the list is
  empty, which reads as "no access" and is easy to misdiagnose.
- **Do not remove the app's authorization** in the account's business-integrations
  settings to "start again": it invalidates the Page token. Adding a permission
  and generating a new token reopens Facebook's consent dialog without doing so.
- Permissions granted: `pages_show_list`, `pages_read_engagement`,
  `pages_read_user_content`, `read_insights`, `business_management`,
  `instagram_basic`, `instagram_manage_insights`, `instagram_manage_comments`.
- **`instagram_manage_comments` can also write** — reply, hide, delete. Meta offers
  no read-only variant for reading Instagram comments. Nothing in this repository
  uses that, but the token can, so it is as sensitive as a publishing token.
- The token itself does not expire, but Meta's `data_access_expires_at` falls 90
  days after issue. Past that date reads fail until the account owner
  re-authorizes. Re-check with `debug_token` rather than trusting a date written
  here.
- Never paste a token or the app secret into a chat, a ticket or a screenshot.

## Failure modes

| Symptom                                       | Meaning                                                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The run stops with a Graph error, code `190`  | The token is expired or revoked. Not a missing metric — the run fails on purpose rather than write nothing.                                                                           |
| A metric appears with `ok: false`, code `100` | Meta does not offer that metric here. Some Page metrics were retired (`page_impressions`); some Instagram metrics do not exist for every post type. The other metrics are unaffected. |
| A listing stops with "more than N pages"      | A guard against paging forever. Narrow the request or raise the limit in code.                                                                                                        |
| `Refusing to write into …`                    | `--out` is inside a git checkout. Point it somewhere else.                                                                                                                            |

## Two things the Graph API does that are easy to get wrong

- **Asking a Facebook comment listing for `from` loses comments.** On a reel with 71
  comments, requesting `from{id,name}` returned 68: the three dropped had no author
  Facebook would resolve for this token, and no text. The listing therefore never asks
  for `from`; authors are read in a second pass and merged. A count that does not match
  the count shown on Facebook is the symptom.
- **A Facebook listing without `filter=stream` returns only top-level comments** (40 of
  the same 71). Replies are in the stream, flat, each carrying its `parent`.

Replies nested under an Instagram comment are read through the `replies` edge; that path
is covered by a test but was not exercised against a live post, none of the recent
ones having a reply.

## Not covered

- **Publishing and replying.** Human validation is the rule; it needs its own token,
  kept apart from this one, and is not built.
- Audience breakdowns (age, country) and story insights: not read yet.
- The default metric lists are a snapshot. Re-check them against the Graph API
  version in force before relying on a figure.
