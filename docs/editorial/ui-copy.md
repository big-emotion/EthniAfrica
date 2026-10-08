# Interface copy

The site publishes French alone (REQ-140); the English locale was retired in
October 2026 and no English launch is planned. Every string a reader sees in
the chrome — a label, a hint, an empty state, a pager — lives in one place
per surface rather than inline in a component. This page says where the copy
lives, what guards it, and how a directory of inline French moves across.

Read the shared [plain-language charter](reader-facing-register.md) for wording.
The [editorial check](plain-language-checks.md) also reads unaccented strings and
static JSX; keeping text in a dictionary does not exempt it from review.

## Where copy lives

One file per surface under `src/lib/i18n/copy/`: `footer.ts`, `quiz.ts`,
`patronymes.ts`, `hubs.ts`, `trail.ts` and so on. Each is written the same
way:

```ts
const fr = { pageTitle: "Noms", … };
type NamesCopy = typeof fr;
export const namesCopy: Record<Language, NamesCopy> = { fr };
```

The `Record<Language, …>` shape is kept on purpose: `Language` is the
one-member union `"fr"`, every caller already reads `<surface>Copy[language]`,
and an unknown key fails to compile instead of returning `undefined`.

`src/lib/translations.ts` is a façade that composes the modules into the
`getTranslation(lang)` shape the older importers read. A budgeted client
island — the quiz play island, held under 15 KB gzipped — imports its own
module (`quizCopy`) instead of the façade, so its bundle carries one surface
and not fourteen.

Locale-dependent formatting is not copy and has its own helpers in
`src/lib/languageTag.ts`: `localeTag`, `formatNumber`, `formatDate`,
`displayCountryName`. A component never spells `"fr-FR"` itself. It formats
in the locale it was handed (`language` prop, route params) or, deep in a
tree where no caller has it, through `useRouteLanguage()`.

## The copy-literal guard

`npm run check:copy-literals` (`scripts/ci/checkCopyLiterals.ts`) fails on a
string literal, template part or JSX text carrying a French accented
character in a changed `.ts`/`.tsx` file under `src/`. It reads the syntax
tree, so comments are free to quote the label they explain.

It is diff-scoped like `lint:req`: `--staged` in the pre-commit hook, `--base
<ref>` in CI, and only the literals the change _adds_ are reported — a
literal already present in the previous version of the file is
grandfathered. A bare run or `--all` surveys the tree and exits 0; that
output is the backlog.

Exempt, in one exported list in the script: the dictionaries themselves,
tests, stories, fixtures, `src/test/`, the code-authored prose banks
(`lib/home`, `lib/dossiers`, `lib/legal-pages*`, `lib/games`,
`lib/glossaire`, `lib/doctrine`, `lib/email`) and the generated atlas assets.

## Migrating one directory

Each wave takes one directory of `src/components` or `src/app/[lang]`, and
nothing outside it but the dictionary.

1. Add `src/lib/i18n/copy/<surface>.ts` with the directory's strings, and
   wire it into the façade if older importers should reach it.
2. Replace each inline literal with a read from the module. A server
   component reads `<surface>Copy[language]` from the `language` it already
   receives; a client component takes `language` as a prop where a caller has
   it, and `useRouteLanguage()` where none does.
3. Replace `new Intl.NumberFormat("fr-FR")` and its siblings with the
   `languageTag` helpers.
4. In the directory's tests, put the component on a route before asserting
   its copy: `src/test/mockRouteLanguage.ts` documents the two lines.
5. Run `npm run check:copy-literals -- --base origin/recette`: the directory
   should report nothing, and the survey count should drop by what it held.
