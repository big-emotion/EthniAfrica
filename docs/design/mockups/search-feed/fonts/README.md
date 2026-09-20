# Search-feed font bundle

These WOFF2 files are the exact Google Fonts subsets requested by
`src/app/layout.tsx` through `next/font` on 2026-09-19:

- Fraunces 300, 500, 700 and 900, normal and italic;
- Nunito Sans 300, 400, 500, 600, 700 and 800, normal.

Google serves one variable subset file for all requested weights of each style.
The local stylesheet preserves the same Unicode ranges while removing network
timing from board capture. Fraunces is requested without its optional `opsz`
axis, matching the application configuration.

Both families are distributed under the SIL Open Font License. The repository
keeps the upstream licence texts in
`src/app/[lang]/comparer/_fonts/OFL-Fraunces.txt` and
`src/app/[lang]/comparer/_fonts/OFL-NunitoSans.txt`.
