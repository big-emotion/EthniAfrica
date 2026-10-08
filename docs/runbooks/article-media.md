# Runbook — article media on the application host

Posters and carousel slides of the articles are served by the application itself at
`/media/articles/<path>`, from a directory on the host. This is the interim media host: a
dedicated storage space is planned, and moving to it is a change of one constant
(`ARTICLE_MEDIA_BASE_URL` in `src/lib/articles/media.ts`), not an edit to any article.

## How it works

- Article records store paths relative to a media root, for example
  `mali-quelle-histoire/mali-quelle-histoire/poster-47cf59469f83.webp`. File names carry a
  content hash, so a URL never changes meaning and responses are cached as immutable.
- `docker-compose.yml` mounts the host directory `/srv/ethniafrica-media/articles`
  read-only at `/app/article-media`. The directory lives beside the deploy directory, not
  inside it: that one is a checkout at the released tag, and media is not versioned in git.
- `src/lib/articles/mediaFiles.ts` serves only images (`.webp`, `.jpg`, `.png`) whose path
  segments match a strict alphabet. A missing file or an unmounted directory answers 404, never 500. `public/` is not used: its total is capped by `check:asset-weight`, and the derivatives
  are far above the headroom.

## Publishing order — media first, release second

An article is visible as soon as the release that carries its record is live. Its images are
not, until the files are on the host. So:

1. Copy the derivatives to the host **before** publishing the Release.
2. Check them.
3. Publish the Release.

## Copying the files

The derivatives are produced outside this repository (private, never committed), under a
`derivatives/` directory. Copy that tree, keeping its relative
structure, into the host directory:

```bash
rsync -av --ignore-existing <out-dir>/derivatives/ <host>:/srv/ethniafrica-media/articles/
```

`--ignore-existing` is deliberate: a published name carries a hash, so an existing file is
never overwritten by a different edition. Files must be world-readable (the container user is
not the owner): `chmod -R a+rX /srv/ethniafrica-media/articles`.

The connection details for `<host>` are in the operator's private notes, not in this
repository.

## Checking

For any published article, request one of its images through the public address and expect
`200` with `content-type: image/webp` and `cache-control: public, max-age=31536000, immutable`:

```bash
curl -sI https://<site>/media/articles/<path-from-the-article-record>
```

A `404` means the file is not on the host or the volume is not mounted (`docker compose config`
on the host shows the mount).

## Rollback

Withdrawing an article is a change to its record (`status: draft`), released the usual way.
Media files can stay: they are inert without an article. Never replace a file under an existing
published name.

## Moving to a dedicated storage space

Upload the same tree there, then change `ARTICLE_MEDIA_BASE_URL` to its public base URL in a
reviewed commit. The `/media/articles` route and the volume can then be removed.
