// @req REQ-178
import { describe, expect, it } from "vitest";

import examples from "../../fixtures/plain-language.json";
import {
  extractCopy,
  lintCopy,
  findingKey,
  classifyFindings,
} from "../../lib/plainLanguage";

describe("plain-language editorial contract", () => {
  // @req REQ-178
  it("preserves official reference titles without permitting ordinary corpus wording", () => {
    const texts = [
      "Dictionnaire du Corpus bambara de référence.",
      "Le Botswana Names Corpus.",
      "Vers une lexicographie mandingue sur la base de grands corpus annotés",
      "Notre corpus cite le Corpus bambara de référence.",
    ];
    const units = texts.map((text, i) => ({
      file: "notes.txt",
      location: String(i),
      text,
    }));
    const errors = lintCopy(units).filter((f) => f.severity === "error");
    expect(errors.map((f) => f.unit.location)).toEqual(["3"]);
  });

  // @req REQ-178
  it("ignores JSX styles/scripts and figure references while checking their surrounding public text", () => {
    const units = extractCopy(
      "src/lib/dossiers/example.tsx",
      `const data = { figureKey: "corpus-peoples", figureRefs: ["corpus-countries"], title: "Notre corpus." }; const x = <div><p>Bonjour.</p><style jsx>{\`/* corpus */ .x {display: block;}\`}</style><script>{"corpus"}</script></div>;`
    );
    expect(
      units.some(
        (u) =>
          u.text.includes("display") ||
          u.text.includes("corpus-peoples") ||
          u.text.includes("corpus-countries")
      )
    ).toBe(false);
    expect(lintCopy(units).filter((f) => f.severity === "error")).toHaveLength(
      1
    );
  });
  // @req REQ-178
  it("checks large batches and keeps findings mapped across batch boundaries", () => {
    const units = Array.from({ length: 2100 }, (_, i) => ({
      file: "large.txt",
      location: String(i),
      text: "Notre corpus. " + "Une phrase claire. ".repeat(50),
    }));
    expect(lintCopy(units).filter((f) => f.severity === "error")).toHaveLength(
      2100
    );
  }, 30_000);

  // @req REQ-178
  it("accepts the approved French and rejects the operator's unwanted phrases with the real Vale engine", () => {
    const units = [
      ...examples.accepted,
      ...examples.rejected,
      ...examples.review,
    ].map((text, i) => ({ file: "sample.txt", location: String(i), text }));
    const findings = lintCopy(units);
    for (let i = 0; i < examples.accepted.length; i++) {
      expect(findings.filter((f) => f.unit.location === String(i))).toEqual([]);
    }
    for (
      let i = examples.accepted.length;
      i < examples.accepted.length + examples.rejected.length;
      i++
    ) {
      expect(
        findings.some(
          (f) => f.unit.location === String(i) && f.severity === "error"
        )
      ).toBe(true);
    }
    for (
      let i = examples.accepted.length + examples.rejected.length;
      i < units.length;
      i++
    ) {
      expect(
        findings.some(
          (f) => f.unit.location === String(i) && f.severity === "warning"
        )
      ).toBe(true);
    }
  });

  // @req REQ-178
  it("checks nested public JSON prose while preserving bibliography, quotes, language names and internal notes", () => {
    const units = extractCopy(
      "fiche.json",
      JSON.stringify({
        id: "PPL_FULA",
        _meta: { notes: "corpus" },
        content: {
          meaning: "Notre corpus.",
          gaps: [{ reason: "Son sens n'est pas établi." }],
          sources: [
            {
              title: "Un corpus de noms",
              author: "Corpus",
              url: "https://example.org/corpus",
              notes: "Nous ne tranchons pas.",
            },
          ],
          quote: "Un corpus de noms",
          nameText: "Fulɓe",
          rawText: "corpus",
          researchNotes: "corpus",
          card: {
            fr: "Nous n'en retenons aucune.",
            en: "Internal English version",
          },
        },
      })
    );
    expect(units.map((u) => u.text)).toContain("Nous ne tranchons pas.");
    expect(units.map((u) => u.text)).toContain("Nous n'en retenons aucune.");
    expect(units.map((u) => u.text)).not.toContain("Un corpus de noms");
    expect(units.map((u) => u.text)).not.toContain("corpus");
    expect(units.map((u) => u.text)).not.toContain("Internal English version");
    expect(lintCopy(units).filter((f) => f.severity === "error")).toHaveLength(
      4
    );
  });

  // @req REQ-178
  it("reads unaccented JSX, accessibility attributes, dictionaries and assembled static fragments", () => {
    const source = `import { corpus } from './corpus';
      // Notre corpus.
      const fr = { title: 'Notre corpus.', label: 'Corpus' };
      const x = <p title="Notre corpus.">Nous ne <strong>tranchons</strong> pas.</p>;
      const y = <img alt="Notre corpus." />;
      const z = 'Nous ne ' + 'tranchons pas.';
      const citation = <blockquote>Son sens n'est pas établi.</blockquote>;`;
    const units = extractCopy("src/components/example.tsx", source);
    expect(units.some((u) => u.text === "Notre corpus.")).toBe(true);
    expect(units.some((u) => u.text === "Corpus")).toBe(true);
    expect(
      units.filter((u) => u.text === "Nous ne tranchons pas.")
    ).toHaveLength(2);
    expect(units.some((u) => u.text.includes("./corpus"))).toBe(false);
    expect(units.some((u) => u.text.includes("Son sens"))).toBe(false);
  });

  // @req REQ-178
  it("parses TypeScript generics without treating the rest of the file as JSX text", () => {
    const units = extractCopy(
      "src/copy.ts",
      `const identity = <T>(value: T) => value; const copy = { label: "Notre corpus." }; // corpus`
    );
    expect(units.map((unit) => unit.text)).toEqual(["Notre corpus."]);
  });

  // @req REQ-178
  it("reads final social prose and subtitles without auditing quoted source material", () => {
    const markdown =
      "# Notre corpus\n\nNous ne tranchons pas.\n\n> Son sens n'est pas établi.\n\n```js\nconst corpus = 1;\n```";
    expect(
      lintCopy(extractCopy("caption.md", markdown)).filter(
        (f) => f.severity === "error"
      )
    ).toHaveLength(2);
    const subtitles =
      "1\n00:00:01,000 --> 00:00:03,000\nNous ne\ntranchons pas.\n";
    expect(
      lintCopy(extractCopy("clip.srt", subtitles)).some(
        (f) => f.severity === "error"
      )
    ).toBe(true);
  });

  // @req REQ-178
  it("checks authored pronunciation guidance and conditional accessibility copy", () => {
    const units = extractCopy(
      "name.json",
      JSON.stringify({ pronunciation: { respelling: "Notre corpus." } })
    );
    expect(lintCopy(units).filter((f) => f.severity === "error")).toHaveLength(
      1
    );
    const code = extractCopy(
      "src/card.tsx",
      `const x = <img alt={ready ? "Notre corpus." : "Nos fiches."} />;`
    );
    expect(lintCopy(code).filter((f) => f.severity === "error")).toHaveLength(
      1
    );
  });

  // @req REQ-178
  it("checks dynamic JSX alternatives while leaving nested quotations intact", () => {
    const units = extractCopy(
      "src/card.tsx",
      `const x = <section><p>{ready ? "Notre corpus." : "Nous ne tranchons pas."}</p><blockquote>Son sens n'est pas établi.</blockquote></section>;`
    );
    expect(lintCopy(units).filter((f) => f.severity === "error")).toHaveLength(
      2
    );
    expect(units.some((u) => u.text.includes("Son sens"))).toBe(false);
  });

  // @req REQ-178
  it("reads rendered HTML text but not scripts, styles or citations", () => {
    const html = `<style>.corpus {color: red}</style><script>const corpus=1</script><p>Nous ne <b>tranchons</b> pas.</p><blockquote>Un corpus.</blockquote>`;
    expect(
      lintCopy(extractCopy("page.html", html)).filter(
        (f) => f.severity === "error"
      )
    ).toHaveLength(1);
  });

  // @req REQ-178
  it("fails closed when Vale is unavailable or a format cannot be inspected", () => {
    expect(() =>
      lintCopy(
        [{ file: "x.txt", location: "1", text: "Bonjour." }],
        "/nonexistent/vale"
      )
    ).toThrow(/Vale/);
    expect(() => extractCopy("card.png", "pixels")).toThrow(/Unsupported/);
    expect(() => extractCopy("broken.json", "{")).toThrow();
  });

  // @req REQ-178
  it("grandfathers only the exact existing text and never a changed or relocated version", () => {
    const [finding] = lintCopy([
      { file: "old.json", location: "content.text", text: "Notre corpus." },
    ]);
    const baseline = [findingKey(finding)];
    expect(classifyFindings([finding], baseline).errors).toHaveLength(0);
    expect(
      classifyFindings(
        [
          {
            ...finding,
            unit: { ...finding.unit, text: "Notre corpus de noms." },
          },
        ],
        baseline
      ).errors
    ).toHaveLength(1);
    expect(
      classifyFindings(
        [{ ...finding, unit: { ...finding.unit, file: "new.json" } }],
        baseline
      ).errors
    ).toHaveLength(1);
    expect(classifyFindings([finding], []).errors).toHaveLength(1);
  });
});
