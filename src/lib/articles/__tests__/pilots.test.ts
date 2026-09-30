import { describe, expect, it } from "vitest";

import { violatesReaderRegister } from "@/lib/editorial/readerRegister";

import { readArticleCorpus } from "../corpus";

// The mechanical floor under every written article (the three pilots first). Whether the prose is right is
// judged against docs/plans/articles-pilots-review-cases.md by a person; this
// only refuses the shapes that are wrong whatever the prose says.

// A paragraph that opens on its authority instead of its subject.
const AUTHORITY_OPENER = /^\s*(Selon |D['’]après |According to )/i;

const { articles } = readArticleCorpus();

// Every article that has a written body, so a batch is held to the floor the
// moment it lands, with no list to keep up to date.
const PILOT_IDS = articles
  .filter((a) => a.fr.sections.length > 0)
  .map((a) => a.id);

describe.each(PILOT_IDS)("written article %s", (id) => {
  const article = articles.find((a) => a.id === id);

  // @req REQ-114
  it("loads and stays a draft without a publication date", () => {
    expect(article).toBeDefined();
    expect(article.status).toBe("draft");
    expect(article.publishedAt).toBeUndefined();
  });

  // @req REQ-114
  it("has a written body whose every reference resolves", () => {
    const sourceIds = new Set(article.sources.map((s) => s.id));
    expect(article.fr.sections.length).toBeGreaterThan(0);
    const refs = article.fr.sections.flatMap((s) => s.sourceRefs);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.filter((ref) => !sourceIds.has(ref))).toEqual([]);
  });

  // @req REQ-114
  it("never opens a paragraph on an authority", () => {
    const openers = article.fr.sections
      .flatMap((s) => s.paragraphs)
      .filter((p) => AUTHORITY_OPENER.test(p));
    expect(openers).toEqual([]);
  });

  // @req REQ-114
  it("keeps workshop vocabulary out of what the reader sees", () => {
    const readerText = [
      article.fr.excerpt,
      ...article.fr.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
      ...article.sources.flatMap((s) => [s.title, s.notes ?? ""]),
    ];
    expect(readerText.filter(violatesReaderRegister)).toEqual([]);
  });

  // @req REQ-114
  it("has an excerpt that is not the title, a hashtag or a call to share", () => {
    const excerpt = article.fr.excerpt.trim();
    expect(excerpt).not.toBe(article.fr.title.trim());
    expect(excerpt.startsWith(article.fr.title.trim())).toBe(false);
    expect(excerpt).not.toMatch(/#\p{L}|partagez|lien en bio/iu);
  });

  // @req REQ-114
  it("defers English with a stated reason and carries no English text", () => {
    expect(article.en).toBeUndefined();
    expect(article._translation?.deferred?.en?.trim()).toBeTruthy();
  });
});
