# Funding presentation — October 2026

The two-page presentation of EthniAfrica, in French and English, sent on
2026-10-08 to a prospective partner for funders. It asks for €52,700 over 12
months in patronage, grants and partnerships. Its positions are the
[doctrine](../../doctrine.md); this folder only holds the document.

On 2026-10-08, after sending, two lines were corrected to match doctrine §1.1
and §2: readers see a source's type, never a tier, and places are in scope
now. The PDFs were regenerated; the version as sent is in git history.

| File                          | What it is                            |
| ----------------------------- | ------------------------------------- |
| `ethniafrica-onepager-fr.pdf` | The French document, current          |
| `ethniafrica-onepager-en.pdf` | The English document, current         |
| `ethniafrica-onepager-*.html` | The sources the PDFs are printed from |

The audience figures come from `docs/audience/audit-2026-10-08.md` and are
dated in the document; refresh them before sending it again. The budget lines
are estimates, not quotes.

## Regenerating the PDFs

The HTML loads the brand faces from `social/brand/fonts/` and the logo from
`social/brand/ethniafrica-logo.png` by relative path. From this folder:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for l in fr en; do
  "$CHROME" --headless=new --no-pdf-header-footer --allow-file-access-from-files \
    --print-to-pdf="ethniafrica-onepager-$l.pdf" "file://$PWD/ethniafrica-onepager-$l.html"
done
```

The type scale is the site's (`src/styles/tokens/type.css`) at its mobile
floor times 0.75, so every role keeps its ratio on A4. Fraunces has no `ɓ`
(U+0253); that one glyph is set in Nunito Sans.
