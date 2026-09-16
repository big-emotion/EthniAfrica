import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The visual register of the figures inside "En bref", asserted on the
 * declarations. happy-dom computes no container query and no grid, so a DOM
 * assertion would pass on the layout this charter exists to refuse.
 */
const STYLES = join(process.cwd(), "src/styles");

/** Comments strip first: a selector scan otherwise swallows the prose above a rule. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const PARCHMENT_CSS = stripComments(
  readFileSync(join(STYLES, "fiche-parchment.css"), "utf8")
);
const COLOR_CSS = readFileSync(join(STYLES, "tokens", "color.css"), "utf8");

const PANEL = ".fiche-summary-brief__counted";
const CARD = `${PANEL} > .afh-stat-card`;
const FIGURE = `${CARD} .afh-stat-card-n`;
const LEAD_INK = "--afh-figure-lead-ink";

/** Selector as a pattern, tolerant of the whitespace a formatter chooses. */
function selectorPattern(selector: string): string {
  return selector
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.[\]="^$*+?()|{}\\:>]/g, "\\$&"))
    .join("\\s+");
}

/** The body of the first rule for exactly this selector. */
function ruleBody(css: string, selector: string): string {
  const match = css.match(
    new RegExp(`(?:^|\\n)\\s*${selectorPattern(selector)}\\s*\\{([^}]*)\\}`)
  );
  if (!match) throw new Error(`No rule for ${selector}`);
  return match[1];
}

/** Every rule declared inside the parchment's own wide-layout breakpoint. */
function wideLayout(css: string): string {
  const blocks: string[] = [];
  const opener = "@container (min-width: 760px)";
  let from = 0;
  for (;;) {
    const start = css.indexOf(opener, from);
    if (start === -1) break;
    const open = css.indexOf("{", start);
    let depth = 0;
    let end = open;
    for (; end < css.length; end += 1) {
      if (css[end] === "{") depth += 1;
      else if (css[end] === "}" && (depth -= 1) === 0) break;
    }
    blocks.push(css.slice(open + 1, end));
    from = end;
  }
  if (blocks.length === 0) throw new Error("No wide-layout breakpoint");
  return blocks.join("\n");
}

/** The rules scoped to the counted grid, selector and body. */
function panelRules(css: string): { selector: string; body: string }[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((rule) => ({
      selector: rule[1].trim().replace(/\s+/g, " "),
      body: rule[2],
    }))
    .filter((rule) => rule.selector.includes(PANEL));
}

/** A colour declaration, never `border-color` or `background-color`. */
const declaresInk = (body: string) => /(?:^|;|\s)color:/.test(body);

describe("fiche summary figures charter (REQ-151)", () => {
  /**
   * Four nested white slabs for four one-digit numbers made the container
   * weigh more than the content it held: on a desktop parchment a "5" sat in
   * 600px of white. Inside the panel the card is a figure over a rule, and
   * the chrome stays on the stat card everywhere else it is used.
   */
  // @req REQ-151
  it("drops the card chrome for a single rule under each figure", () => {
    const card = ruleBody(PARCHMENT_CSS, CARD);
    expect(card).toMatch(/(?:^|;|\s)background:\s*(?:none|transparent)/);
    expect(card).toMatch(/(?:^|;|\s)border:\s*(?:0|none)/);
    expect(card).toMatch(/border-radius:\s*0/);
    expect(card).toMatch(/border-bottom:\s*1px\s+solid\s+var\(--afh-border\)/);

    const standalone = ruleBody(PARCHMENT_CSS, ".afh-stat-card");
    expect(standalone).toMatch(/background:\s*var\(--afh-surface\)/);
    expect(standalone).toMatch(/border:\s*1px\s+solid\s+var\(--afh-border\)/);
  });

  /**
   * The typography charter earns the monospace on one condition: it aligns
   * figures in a column. 5, 7, 2 and 79 are four unrelated magnitudes in a
   * 2x2 grid, so there is no column to align and nothing for tabular figures
   * to pay for — only the teletype register they carry with them.
   */
  // @req REQ-151
  it("sets the figures in the display face and drops the tabular column", () => {
    const figure = ruleBody(PARCHMENT_CSS, FIGURE);
    expect(figure).toMatch(/font-family:\s*var\(--afh-font-display\)/);
    expect(figure).toMatch(/font-variant-numeric:\s*normal/);
    expect(figure).not.toMatch(/tabular-nums/);
  });

  /**
   * One accent, one meaning. The lead figure counts the country or the
   * people itself; the four beside it count what the atlas holds. Inking all
   * five would make the hue say "number" instead of "population", and a hue
   * that says "number" teaches nothing. The four counts therefore keep the
   * default text ink, and no rule may reach them through their `tile`
   * emphasis.
   */
  // @req REQ-151
  it("inks only the lead figure, through a named token", () => {
    expect(COLOR_CSS).toMatch(new RegExp(`${LEAD_INK}:\\s*[^;]+;`));

    const inked = panelRules(PARCHMENT_CSS).filter(
      (rule) =>
        rule.selector.includes(".afh-stat-card-n") && declaresInk(rule.body)
    );
    expect(inked.length).toBeGreaterThan(0);
    for (const rule of inked) {
      expect(rule.selector).toContain('[data-emphasis="lead"]');
      expect(rule.selector).not.toContain('[data-emphasis="tile"]');
      // An ink is a token here, never a literal: the night ramp lifts it.
      expect(rule.body).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }

    const leadInk = ruleBody(
      PARCHMENT_CSS,
      `${PANEL} > .afh-stat-card[data-emphasis="lead"] .afh-stat-card-n`
    );
    expect(leadInk).toMatch(new RegExp(`color:\\s*var\\(${LEAD_INK}\\)`));

    // The case that forced the exception: dropping the card also dropped the
    // colonial ground that marked an unfilled figure. An unsourced
    // population must not come back painted like a measured one.
    const missingLead = ruleBody(
      PARCHMENT_CSS,
      `${PANEL} > .afh-stat-card[data-emphasis="lead"][data-provenance="missing"] .afh-stat-card-n`
    );
    expect(missingLead).toMatch(/color:\s*var\(--afh-color-colonial\)/);
  });

  /**
   * Two columns gave a desktop reader two fat half-screen slabs. Four makes
   * the row a strip of figures — and the lead keeps the whole row, because a
   * count of the subject read as the equal of a count of the atlas.
   */
  // @req REQ-151
  it("goes to four columns once the parchment has room, lead still full width", () => {
    expect(ruleBody(wideLayout(PARCHMENT_CSS), PANEL)).toMatch(
      /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/
    );

    const spans = panelRules(PARCHMENT_CSS)
      .filter(
        (rule) =>
          rule.selector.includes('[data-emphasis="lead"]') &&
          /grid-column:/.test(rule.body)
      )
      .map((rule) => rule.body.match(/grid-column:\s*([^;]+)/)![1].trim());
    expect(spans.length).toBeGreaterThan(0);
    for (const span of spans) expect(span).toBe("1 / -1");
  });

  /**
   * Two columns on a phone are deliberate here, and they are the exact
   * opposite decision from the one `.afh-tiles` takes one screen below. The
   * brand charter admits a two-column phone grid only for atomic cells: a
   * number and a date fit in 140px, the tiles' prose did not — 61 characters
   * of Moroccan religious practice fell on five lines of twelve.
   */
  // @req REQ-151
  it("keeps two columns on a phone, where the tiles of prose linearise", () => {
    expect(ruleBody(PARCHMENT_CSS, PANEL)).toMatch(
      /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
    );
    expect(ruleBody(PARCHMENT_CSS, ".afh-tiles")).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\);/
    );
  });
});
