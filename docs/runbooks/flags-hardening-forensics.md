# Flags hardening forensics

Read-only queries to run on recette and on production **before** and **after** the release that
applies migration 116 (`116_flags_public_column_grants.sql`). They answer one question: did anybody
use the paths that migration closes while they were open?

## Why this is needed

GoTrue sign-up is enabled (`enable_signup = true` in `supabase/config.toml`). The moderator magic
link needs it to create the user, and the moderator allowlist is only checked by the site's own
server code. So anyone with the public anon key could get an `authenticated` session by calling
the auth endpoints directly. Every policy written `TO authenticated` was therefore open to anyone,
not just to moderators. Migration 116 closes those paths. It cannot tell you whether somebody used
them, and these queries can.

## How to run them

- Use a read-only SQL session as the database owner. RLS must not filter what you see: the SQL
  editor of the self-hosted dashboard, or `psql`, both work.
- Every query here is a `SELECT`. None of them changes anything.
- Save each result with the date and the environment. Run them once before the release and once
  after it.
- **Expected result:** every query returns no rows, except where the query says otherwise. A row is
  not proof of abuse. It is something to explain, row by row, before closing the review.

`allowlisted(uid)` below means "the user's confirmed address is in `admin_allowlist`". It is
written out in each query so the query can be pasted as it is.

## 1. Profiles holding a moderation role

Migration 074 measured 0 rows in `contributor_profiles` on recette. Migration 116 resets every
role to `'none'`, so run this query **before** the release: afterwards it shows nothing.

```sql
SELECT cp.id, cp.user_id, cp.moderator_role, cp.display_name, cp.created_at,
       u.email, u.email_confirmed_at, u.created_at AS user_created_at,
       EXISTS (SELECT 1 FROM admin_allowlist a WHERE a.email = u.email) AS allowlisted
FROM contributor_profiles cp
LEFT JOIN auth.users u ON u.id = cp.user_id OR u.id = cp.id
WHERE cp.moderator_role <> 'none'
ORDER BY cp.created_at;
```

## 2. Every revision draft

No code writes `revision_drafts`. Any row at all came from a client.

```sql
SELECT d.id, d.entity_type, d.entity_id, d.moderator_id, d.created_at, d.updated_at,
       u.email,
       EXISTS (SELECT 1 FROM admin_allowlist a WHERE a.email = u.email) AS allowlisted
FROM revision_drafts d
LEFT JOIN auth.users u ON u.id = d.moderator_id
ORDER BY d.created_at;
```

## 3. Revisions and audit entries whose actor is not a moderator

`publish_revision()` could be run by any session that held a raised role. It writes a `revisions`
row and an `audit_log` row stamped with the caller.

```sql
SELECT r.id, r.entity_type, r.entity_id, r.version, r.published_at, r.moderator_id, u.email
FROM revisions r
LEFT JOIN auth.users u ON u.id = r.moderator_id
WHERE r.moderator_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM admin_allowlist a
    WHERE a.email = u.email AND u.email_confirmed_at IS NOT NULL
  )
ORDER BY r.published_at;

SELECT l.id, l.action, l.entity_type, l.entity_id, l.actor_id, l.created_at, u.email
FROM audit_log l
LEFT JOIN auth.users u ON u.id = l.actor_id
WHERE l.actor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM admin_allowlist a
    WHERE a.email = u.email AND u.email_confirmed_at IS NOT NULL
  )
ORDER BY l.created_at;
```

Rows written by system jobs carry `actor_id` NULL and do not appear here.

## 4. Working assets and their stored objects

The site uploads only through the service-role client, after the allowlist check. Compare the two
lists. An object with no row, or a row owned by someone outside the allowlist, came from a client.

```sql
SELECT w.id, w.source_id, w.owner_id, w.object_path, w.byte_size, w.created_at, u.email,
       EXISTS (SELECT 1 FROM admin_allowlist a WHERE a.email = u.email) AS allowlisted
FROM source_working_assets w
LEFT JOIN auth.users u ON u.id = w.owner_id
ORDER BY w.created_at;

SELECT o.id, o.name, o.owner, o.created_at, (o.metadata ->> 'size')::bigint AS bytes,
       EXISTS (SELECT 1 FROM source_working_assets w WHERE w.object_path = o.name) AS has_row
FROM storage.objects o
WHERE o.bucket_id = 'source-working-assets'
ORDER BY o.created_at;
```

## 5. API keys owned by someone outside the allowlist

Self-service keys were open to any session. Keys issued anonymously by `/api/v2/keys/issue` carry
no `user_id` and are expected here: they are left out.

```sql
SELECT k.id, k.name, k.tier, k.active, k.created_at, k.revoked_at, k.user_id, u.email
FROM api_keys k
LEFT JOIN auth.users u ON u.id = k.user_id
WHERE k.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM admin_allowlist a
    WHERE a.email = u.email AND u.email_confirmed_at IS NOT NULL
  )
ORDER BY k.created_at;
```

## 6. Flags a session may have written directly

There is no audit entry for the creation of a flag, so a flag inserted by a session through
`flags_contributor_insert` cannot be told apart by a missing entry: the handler also sets
`human_verified = true` on every report. The direct path had one constraint, though:
`contributor_id = auth.uid()`. So list the verified flags that carry a contributor, and check each
one against what the site actually received (contribution form, reporter contact, moderation
history).

```sql
SELECT f.id, f.public_slug, f.flag_kind, f.status, f.created_at, f.contributor_id, u.email,
       u.created_at AS user_created_at,
       EXISTS (SELECT 1 FROM flag_reporter_contacts c WHERE c.flag_id = f.id) AS has_contact,
       EXISTS (SELECT 1 FROM audit_log l
               WHERE l.entity_type = 'flag' AND l.entity_id IN (f.id::text, f.public_slug))
         AS has_moderation_entry
FROM flags f
LEFT JOIN auth.users u ON u.id = f.contributor_id
WHERE f.human_verified = true
  AND f.contributor_id IS NOT NULL
ORDER BY f.created_at;
```

## 7. Who could have done it

These are users who signed up but were never on the allowlist. Every row in sections 1 to 6 should
trace back to one of them or to a moderator.

```sql
SELECT u.id, u.email, u.created_at, u.email_confirmed_at, u.last_sign_in_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM admin_allowlist a WHERE a.email = u.email)
ORDER BY u.created_at;
```

## If a query returns rows

Do not delete anything from this runbook's queries. Write down each row and the explanation, and
open an ETNI ticket for anything that has no explanation. Then decide with the operator whether to
revoke the key, remove the object or revert the revision. Reverting a published revision follows
`docs/runbooks/revisions-dba-bypass.md`.
