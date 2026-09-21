# Moderation access

How somebody gets into the moderation console, and the pieces of configuration that are not
in this repository and will silently break the whole thing if they are wrong. Use `/fr/admin`
during the French-only rollout; `/en/admin` becomes reachable only after a bilingual
`SITE_LOCALE_MODE` is explicitly enabled.

## The model, in one paragraph

There are no public accounts. Reporting costs none (moderation charter §2), and
the console authorizes an **e-mail address** against the `admin_allowlist` table
— not a role, not a profile row. The published sign-in page (`/fr/admin/connexion` in
`fr-only`; `/en/admin/connexion` is also served in a bilingual mode) is the only sign-in
surface in the product; it sends a magic link to an address on the list and
answers a stranger with the identical sentence, so the form cannot be used to
enumerate moderators.

That identical sentence is also given when **no mail leaves at all**: the action
swallows every refusal from Supabase on purpose. Nothing on the page tells a working
sign-in from a broken one — read the Auth logs (§2) before concluding anything.

## 1. Auth redirect allow-lists — do this first

**No test can catch this.** The application asks Supabase for a link back to its
own origin; GoTrue checks that origin against the redirect allow-list and, when
it does not match, **silently substitutes the Site URL**. No error, no warning.
That is how magic links ended up pointing at `ethniafrica-big-emotion.vercel.app`
— a stale preview deployment — from every environment including localhost, while
the code asked for exactly the right URL.

**Every entry must carry the callback path.** `http://localhost:3000` does not
match `http://localhost:3000/api/auth/callback`; it is a non-match like any
other, and it fails the same silent way.

Both databases are self-hosted Supabase stacks (ETNI-1958), so neither has a dashboard, and
`supabase config push` reaches neither: it drives the Management API of a hosted project. The
hosted project `shmrjtnfbqzceovroqjj`, which backed recette before the move, was configured that
way and is now only a rollback path until ETNI-1962 — an allow-list pushed there changes nothing
a reader of recette sees.

### Recette — self-hosted at `https://supabase-recette.ethniafrica.com`

Recette's stack sits on the same Supabase host as production's, in its own compose project
(`/home/ubuntu/supabase-recette/docker/`, see
[`migration-state.md`](./migration-state.md)). GoTrue there reads `GOTRUE_SITE_URL` and
`GOTRUE_URI_ALLOW_LIST` from `SITE_URL` and `ADDITIONAL_REDIRECT_URLS` in that directory's
`.env`, exactly as production's does, so the procedure below applies unchanged with recette's
directory and recette's callback. The values it must hold: Site URL `http://localhost:3000` is
fine for a recette used from a developer machine; the redirect list must carry
`http://localhost:3000/api/auth/callback` and
`https://recette.africatlas.com/api/auth/callback`. Nothing in this repository records what the
running recette container holds — read `GOTRUE_URI_ALLOW_LIST` from it, as for production,
rather than trusting the file. `supabase/config.toml` declares the same values for the local
`supabase start` stack only.

### Production — self-hosted, not a dashboard

Production is **not** `jajggbeimfudpzcxytbb`. It is a self-hosted stack at
`https://supabase.ethniafrica.com`, on the Supabase host, with
its compose project in `/home/ubuntu/supabase/docker/`. There is no Supabase
dashboard for it: GoTrue reads `GOTRUE_SITE_URL` and `GOTRUE_URI_ALLOW_LIST`
from `SITE_URL` and `ADDITIONAL_REDIRECT_URLS` in that directory's `.env`.

This was the production failure, and it is now fixed. `SITE_URL` was already
correct; `ADDITIONAL_REDIRECT_URLS` was **empty**, so a production magic link
landed on the home page rather than the callback and established no session at
all. Applied 2026-09-01 — the running `supabase-auth` container reports
`GOTRUE_URI_ALLOW_LIST=https://ethniafrica.com/api/auth/callback`, which is the
check worth making: the file and the process can disagree until the container is
recreated.

The procedure is kept because it is how the value is changed again, and because
`.env` is not in version control — nothing else records what production holds.

```bash
ssh <user>@<supabase-host>
cd /home/ubuntu/supabase/docker
cp .env .env.bak-$(date +%Y%m%d)
# ADDITIONAL_REDIRECT_URLS=https://ethniafrica.com/api/auth/callback
nano .env
docker compose up -d --force-recreate auth
```

**Only the production callback belongs in this list.** Adding localhost or
recette would let a _production_ magic link redirect a session to a developer's
machine, which is the classic magic-link phishing vector. The environments do not
share a database and must not share an allow-list.

**Proof it worked.** Request a link and read the URL in the e-mail: `redirect_to`
must carry the `/api/auth/callback` of the environment you asked from. Anything
else means the entry did not match and GoTrue fell back to the Site URL.

## 2. The sign-in mail — Auth hands it to Microsoft Graph

**Production Auth sends no mail of its own.** Measured 2026-09-15: the stack's
`.env` still held the self-hosted placeholders (`SMTP_HOST=supabase-mail`,
`SMTP_USER=fake_mail_user`, `SMTP_ADMIN_EMAIL=admin@example.com`), no `supabase-mail`
container exists, and every request failed in the Auth logs with
`dial tcp: lookup supabase-mail … server misbehaving` while the page gave its
neutral answer.

SMTP is not the repair. `contact@ethniafrica.com` is a **shared mailbox** in the
Microsoft 365 tenant that also serves big-emotion.com — no licence, sign-in blocked —
so it has no password for SMTP to log in with, and Microsoft retires password SMTP
for Exchange Online anyway. The site already sends every other mail through
Microsoft Graph (`src/lib/email/graph.ts`), which can send as a shared mailbox. So
Auth is configured with a **send-email hook**: instead of speaking SMTP it POSTs
each mail, signed, to `POST /api/auth/send-email`, which writes the sign-in mail
(`src/lib/email/signInLink.ts`) and sends it through Graph. With the hook enabled,
the `SMTP_*` values are no longer read.

Order matters: **the application first, then Auth.** A hook pointing at a route the
running release does not have turns every sign-in into a 404.

### 2a. The Graph app registration

Entra admin center → **App registrations** → the application whose client ID is
`GRAPH_CLIENT_ID` → **API permissions**: **Microsoft Graph · Mail.Send ·
Application**, with admin consent granted. If an Exchange application access
policy scopes that app to some mailboxes, `contact@ethniafrica.com` must be in
scope — Graph answers 403 otherwise, and the hook reports it as a 502.

### 2b. The application host

Generate one secret, used on both hosts:

```bash
echo "v1,whsec_$(openssl rand -base64 32)"
```

In the application's production environment (the `.env` the container reads):

```bash
SEND_EMAIL_HOOK_SECRET=v1,whsec_…
GRAPH_TENANT_ID=…
GRAPH_CLIENT_ID=…
GRAPH_CLIENT_SECRET=…
MAIL_SENDER=contact@ethniafrica.com
MAIL_FROM_NAME=EthniAfrica
```

The four Graph credentials are a set (`graphConfigured()`); with one missing the
hook answers 503 and Auth reports the send as failed. Deploy the release that
carries `/api/auth/send-email` with these values in place.

### 2c. Auth on the Supabase host

The stack's `docker-compose.yml` passes no hook variable to Auth — its hook lines
are commented examples — so they are added to the `auth` service's `environment:`
block, and the secret to `.env`:

```bash
# Connection details: the SUPABASE_SSH_* GitHub secrets and the operator's private notes.
ssh <user>@<supabase-host>
cd /home/ubuntu/supabase/docker
cp .env .env.bak-$(date +%Y%m%d)
cp docker-compose.yml docker-compose.yml.bak-$(date +%Y%m%d)
nano .env                 # SEND_EMAIL_HOOK_SECRET=v1,whsec_…  (the same value as 2b)
nano docker-compose.yml   # under services → auth → environment:
#   GOTRUE_HOOK_SEND_EMAIL_ENABLED: "true"
#   GOTRUE_HOOK_SEND_EMAIL_URI: https://ethniafrica.com/api/auth/send-email
#   GOTRUE_HOOK_SEND_EMAIL_SECRETS: ${SEND_EMAIL_HOOK_SECRET}
docker compose up -d --force-recreate auth
docker exec supabase-auth env | grep GOTRUE_HOOK_SEND_EMAIL_ENABLED
```

The compose file is not in version control either; this block is the only record
of what was added to it.

### Proof it worked

Request a link on `/fr/admin/connexion`, then:

- the mail arrives in the `contact@ethniafrica.com` shared mailbox;
- the application logs `Sign-in mail sent through Microsoft Graph`;
- `docker logs --since 5m supabase-auth 2>&1 | grep -i -E 'hook|mail'` shows no error.

Open the link **in the browser that asked for it**: the sign-in is PKCE, and the
code the link brings back is only redeemable next to that browser's verifier cookie.

## 3. Add a moderator

Nobody can open the console until an address is on the list, and there is no
screen for adding one because adding one would need the console. The first entry
is written with the service-role key:

```bash
NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
  npx tsx scripts/seedAdminAllowlist.ts moderation@example.org "Responsable éditorial de la modération"
```

On the self-hosted production stack, the database container is reachable over SSH
without the service-role key:

```bash
ssh <user>@<supabase-host> "docker exec supabase-db psql -U postgres -c \"insert into admin_allowlist (email, note) values ('moderation@example.org', 'Responsable éditorial de la modération') on conflict (email) do nothing;\""
```

The address does not need a Supabase account first: `signInWithOtp` is called
with `shouldCreateUser: true`, because the allowlist is the gate and an
authorized person should not additionally have to have registered.

Recette carries one entry as of 2026-09-01. Production carries one as of
2026-09-15: `contact@ethniafrica.com`.

## 4. Remove a moderator

Delete the row. The next request for a session — and every page load, since
`getModeratorSession()` consults the list on each one — refuses. There is no
cached role to expire.

```sql
delete from admin_allowlist where email = 'moderation@example.org';
```

## What breaks quietly

- **Graph not configured on the application.** The console works, reports arrive,
  decisions get made — and no reader is ever told, because the verification link and
  the decision skip with a warning. The sign-in hook answers 503, Auth reports the
  send as failed, and the sign-in page still gives its neutral answer. The build
  stays green.
- **The hook secret differs between the two hosts.** The route answers 401 to every
  mail (`Send-email hook refused: missing or invalid signature` in the application
  logs), and nobody can sign in.
- **A redirect URL missing from Supabase.** Sign-in appears to work right up to
  the click, then lands on a stale deployment. See §1.
- **`admin_allowlist` unreadable.** `isEmailAllowlisted` fails closed: an outage
  locks moderators out rather than letting anyone in. This is deliberate; the
  symptom is everyone being bounced to the sign-in page.
