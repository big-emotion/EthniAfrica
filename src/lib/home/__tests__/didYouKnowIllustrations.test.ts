import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DID_YOU_KNOW_FACTS } from "@/lib/home/didYouKnowFacts";
import {
  DID_YOU_KNOW_ILLUSTRATIONS,
  illustrationFor,
} from "@/lib/home/didYouKnowIllustrations";

const PUBLIC_DIR = join(process.cwd(), "public");

/**
 * The pictures are held to the same standard as the sources.
 *
 * An illustration is a citation with a frame around it: it asserts « this is
 * what that was », and a reader who cannot see who made it, when, and under
 * what licence has no way to check the assertion. These tests hold the three
 * things that would otherwise rot silently — a file that stopped existing, a
 * credit that never named a licence, and an alt that only repeats the
 * headline a screen reader has already been read.
 */
describe("Anecdote illustrations — a picture that cites itself (REQ-113)", () => {
  // @req REQ-113
  it("gives every fact in the bank a picture", () => {
    const missing = DID_YOU_KNOW_FACTS.filter(
      (fact) => !illustrationFor(fact.id)
    ).map((fact) => fact.id);

    expect(missing).toEqual([]);
  });

  // @req REQ-113
  it("points every picture at a file the repo actually ships", () => {
    const absent = Object.entries(DID_YOU_KNOW_ILLUSTRATIONS)
      .filter(
        ([, picture]) =>
          picture.kind === "picture" &&
          !existsSync(join(PUBLIC_DIR, picture.src))
      )
      .map(([id]) => id);

    expect(absent).toEqual([]);
  });

  // CC BY-SA is only satisfied when the credit is visible in the page, so a
  // credit that names no licence is a licence breach, not a typo.
  // @req REQ-113
  it("names a licence in every credit line", () => {
    const uncredited = Object.entries(DID_YOU_KNOW_ILLUSTRATIONS)
      .filter(
        ([, picture]) =>
          picture.kind === "picture" &&
          !/CC |domaine public|CC0/.test(picture.credit)
      )
      .map(([id]) => id);

    expect(uncredited).toEqual([]);
  });

  // @req REQ-113
  it("describes what the picture shows rather than repeating the headline", () => {
    const echoes = DID_YOU_KNOW_FACTS.filter((fact) => {
      const picture = illustrationFor(fact.id);
      return picture ? picture.alt === fact.headline : false;
    }).map((fact) => fact.id);

    expect(echoes).toEqual([]);
    for (const picture of Object.values(DID_YOU_KNOW_ILLUSTRATIONS)) {
      expect(picture.alt.length).toBeGreaterThan(20);
    }
  });

  // Operator ruling, 2026-09-13: the site carries real images. An anecdote
  // with no exact document takes a neighbouring one — the people's place,
  // the country, the region — rather than a typographic plate.
  // @req REQ-113
  it("illustrates every fact with a real picture, never a drawn plate", () => {
    const drawn = Object.entries(DID_YOU_KNOW_ILLUSTRATIONS)
      .filter(([, illustration]) => illustration.kind !== "picture")
      .map(([id]) => id);

    expect(drawn).toEqual([]);
  });

  // Brand charter §9: a licence is published, not named. The file page is
  // what lets a reader check the credit; the licence URI is what CC BY and
  // CC BY-SA §4(a) actually ask for. Public domain asks for neither URI.
  // @req REQ-113
  it("links the file page and, unless public domain, the licence of every picture", () => {
    const unpublished = Object.entries(DID_YOU_KNOW_ILLUSTRATIONS)
      .filter(
        ([, picture]) =>
          !/^https:\/\//.test(picture.filePage ?? "") ||
          (!/domaine public/.test(picture.credit) &&
            !/^https?:\/\//.test(picture.licenceUrl ?? ""))
      )
      .map(([id]) => id);

    expect(unpublished).toEqual([]);
  });

  // pxfuel re-hosts photographs under a blanket CC0 it cannot grant; a
  // licence the uploader had no right to give is no licence at all.
  // @req REQ-113
  it("credits no re-hosting aggregator in place of an author", () => {
    const rehosted = Object.entries(DID_YOU_KNOW_ILLUSTRATIONS)
      .filter(([, picture]) => /pxfuel|pixabay|pxhere/i.test(picture.credit))
      .map(([id]) => id);

    expect(rehosted).toEqual([]);
  });

  // @req REQ-113
  it("has no picture left over from a fact the bank no longer holds", () => {
    const known = new Set(DID_YOU_KNOW_FACTS.map((fact) => fact.id));
    const orphans = Object.keys(DID_YOU_KNOW_ILLUSTRATIONS).filter(
      (id) => !known.has(id)
    );

    expect(orphans).toEqual([]);
  });
});
