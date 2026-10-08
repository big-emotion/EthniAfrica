# Funding presentation — October 2026

A two-page presentation of EthniAfrica, in French and English, written on
2026-10-08 for a prospective partner to pass on to funders. It asks for
**€52,700 over 12 months** in patronage, grants and partnerships, not equity:
the project stays free, open and ad-free.

| File                          | What it is                            |
| ----------------------------- | ------------------------------------- |
| `ethniafrica-onepager-fr.pdf` | The French document, as sent          |
| `ethniafrica-onepager-en.pdf` | The English document, as sent         |
| `ethniafrica-onepager-*.html` | The sources the PDFs are printed from |

## Why it is kept in the repository

It is the shortest statement of the project the operator has approved: what
EthniAfrica covers, the problem it answers, how it differs, who it serves and
what the next twelve months cost. The product brief
(`../product-brief-2026-10.md`) holds the reasoning; this holds the
positions, compressed to what a stranger reads in two minutes. Where the two
disagree, this document is the more recent operator decision.

Positions it fixes, approved by the operator on 2026-10-08:

- **Scope.** Names of peoples, countries, languages, language families and
  family names now; places, customs and words next. Onomastics combined with
  etymology. Diaspora (English- and Spanish-speaking) and Creoles later.
- **The problem.** No unified digital source to search Africa's history through
  its names, and nothing that shows the links between peoples; Africa read
  only inside borders under 140 years old.
- **The stance.** Transmitters, not researchers: carry on the work of
  historians and linguists, add oral tradition, following the method of
  UNESCO's _General History of Africa_, vol. I. Adjacent services (DNA tests
  included) are named, never criticised.
- **The team.** Incubated by the Big Emotion agency. Paid: a developer in West
  Africa. Expenses covered: social media moderation. Trained volunteers:
  source and data checks, research for publications
  (`../../volunteers/`).

## Where the figures come from

- Audience: `docs/audience/audit-2026-10-08.md`, plus TikTok's 28-day view
  read the same day. Dated in the document; refresh before reuse.
- Corpus counts: `dataset/source/afrik/`, 2026-10-08.
- Running costs: the agency's invoices (Claude, OpenAI, OVH, ElevenLabs,
  Vercel domains) and the operator's Wispr Flow plan, read 2026-10-08.
  Claude and ChatGPT count at 100% since September, on the operator's word.

## Budget assumptions to verify

The amounts are estimates, not quotes.

| Line                      |  Amount | Assumption                                                                     |
| ------------------------- | ------: | ------------------------------------------------------------------------------ |
| Developer, West Africa    | €15,000 | full time, about €1,000–1,500 a month                                          |
| 200 records               |  €9,000 | €45 each, worked by region (one people and its neighbours)                     |
| Field trip, 6 weeks       | €10,000 | one person, Dakar → Abidjan → Accra; flights, Ghana visa, insurance unverified |
| Tools, two seats, hosting |  €7,600 | €365/month for the operator, €266/month for a second seat                      |
| 30 oral accounts          |  €2,400 | €80 each: interview, transcription, documentation, small allowance             |
| Social media moderation   |  €1,800 | €150/month allowance                                                           |
| Contingency               |  €6,900 | 15%                                                                            |

Open checks before the next send: whether Mali and Guinea lead the network
audiences (the site audit shows Côte d'Ivoire, then the DRC); the Ghana visa
fee on the official portal; whether funds go through an association, which
French tax relief for patrons requires.

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
