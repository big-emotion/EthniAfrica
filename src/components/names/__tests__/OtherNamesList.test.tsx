import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OtherNamesList } from "../NameAnswerCard";
import type { AnsweredName } from "@/lib/fiche/nameAnswer";

const names: AnsweredName[] = [
  "Mianka",
  "Minianka",
  "Mamara",
  "Miniyanka",
  "Minya",
  "Myanka",
  "Tupiire",
].map((form) => ({
  form,
  line: `Explanation of ${form}.`,
  badges: [],
  attestations: [],
}));

describe("other names — approved long-list disclosure", () => {
  afterEach(cleanup);

  // @req REQ-153 REQ-190
  it("starts a long list closed and keeps every name with its explanation", () => {
    const { container } = render(
      <OtherNamesList names={names} language="fr" />
    );
    const disclosure = container.querySelector<HTMLDetailsElement>("details");
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute("open");
    expect(disclosure!.querySelector("summary")).toHaveTextContent(
      "Afficher les 7 noms"
    );
    for (const name of names) {
      const row = disclosure!.querySelector(`[data-name-row="${name.form}"]`);
      expect(row).toHaveTextContent(name.form);
      expect(row).toHaveTextContent(name.line!);
    }
  });

  // @req REQ-153 REQ-190
  it("leaves a short list visible without an extra interaction", () => {
    const { container } = render(
      <OtherNamesList names={names.slice(0, 2)} language="fr" />
    );
    expect(container.querySelector("details")).toBeNull();
    expect(container.querySelectorAll("[data-name-row]")).toHaveLength(2);
  });
});
