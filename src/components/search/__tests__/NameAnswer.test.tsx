import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NameAnswer } from "@/components/search/NameAnswer";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { getPeopleRoute } from "@/lib/routing";
import type { NamingProjection } from "@/lib/search/naming";
import type { SearchResult } from "@/types/afrik-frontend";

const fr = nameAnswerCopy.fr;

function subject(
  name: string,
  naming: Partial<NamingProjection> = {}
): SearchResult {
  return {
    type: "people",
    id: `PPL_${name.toUpperCase()}`,
    name,
    naming: { forms: [], eras: [], ...naming },
  };
}

/**
 * The page's promise is a refusal: it shows every name and crowns none. These
 * assert the refusal, and the three things the atlas owes whatever the corpus
 * holds — because those are the half of the grammar that does not depend on
 * the data, and so the half a thin fiche would otherwise quietly drop.
 */

describe("the answer a result page gives to a name", () => {
  // @req REQ-178
  it("draws every form at the same weight, in the corpus's order", () => {
    render(
      <NameAnswer
        language="fr"
        query="pahouin"
        subjects={[
          subject("Fang", {
            selfGiven: "Fang",
            forms: [{ form: "Pahouin" }, { form: "Pangwe" }, { form: "Pamue" }],
          }),
        ]}
      />
    );

    const forms = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "");

    expect(forms[1]).toContain("Pahouin");
    expect(forms[2]).toContain("Pangwe");
    expect(forms[3]).toContain("Pamue");
  });

  // The searched form is marked so the reader knows where they are — which is
  // not the same as being told which name is right.
  // @req REQ-178
  it("marks the searched form without promoting it", () => {
    render(
      <NameAnswer
        language="fr"
        query="pahouin"
        subjects={[
          subject("Fang", { forms: [{ form: "Pahouin" }, { form: "Pangwe" }] }),
        ]}
      />
    );

    expect(screen.getByText(fr.yourSearch)).toBeInTheDocument();
    expect(screen.queryByText(/dominant/i)).not.toBeInTheDocument();
  });

  // 75.4 % of the corpus's exonyms are bare. A qualifier appears only where a
  // field carries one, and is never derived from characters inside the form.
  // @req REQ-178
  it("shows a qualifier only where the corpus carries one", () => {
    render(
      <NameAnswer
        language="fr"
        query="fang"
        subjects={[
          subject("Fang", {
            forms: [
              { form: "Mandingue (français colonial)" },
              { form: "Pangwe", qualifier: "allemand" },
            ],
          }),
        ]}
      />
    );

    // The parenthetical stays inside the form: nothing split it out.
    expect(
      screen.getByText("Mandingue (français colonial)")
    ).toBeInTheDocument();
    expect(screen.getByText("allemand")).toBeInTheDocument();
  });

  // @req REQ-178
  it("owes a silence, a conviction and an invitation even when the corpus is thin", () => {
    render(
      <NameAnswer language="fr" query="ekpeye" subjects={[subject("Ekpeye")]} />
    );

    expect(screen.getByText(fr.silences)).toBeInTheDocument();
    expect(screen.getByText(fr.conviction)).toBeInTheDocument();
    expect(screen.getByText(fr.invitation)).toBeInTheDocument();
  });

  // A block never renders to say it is empty: the temporal silence moves into
  // the gathered silences, and the block itself disappears.
  // @req REQ-178
  it("declares the dating silence instead of drawing an empty temporal block", () => {
    render(
      <NameAnswer language="fr" query="fang" subjects={[subject("Fang")]} />
    );

    expect(screen.queryByText(fr.throughTime)).not.toBeInTheDocument();
    expect(screen.getByText(fr.noDatedAttestation)).toBeInTheDocument();
  });

  // Countries are the only class that dates its names, so they are the only
  // one where the block appears — the condition is per class, not global.
  // @req REQ-178
  it("draws the temporal block for a class that dates its names", () => {
    render(
      <NameAnswer
        language="fr"
        query="gabon"
        subjects={[
          subject("Gabon", {
            eras: [{ era: "colonization", text: "Colonie du Gabon" }],
          }),
        ]}
      />
    );

    expect(screen.getByText(fr.throughTime)).toBeInTheDocument();
    expect(screen.queryByText(fr.noDatedAttestation)).not.toBeInTheDocument();
  });

  // Bassa: three unrelated peoples. The page shows all three and chooses none.
  // @req REQ-178
  it("asks which one, rather than picking, when several answer to the name", () => {
    render(
      <NameAnswer
        language="fr"
        query="bassa"
        subjects={[subject("Bassa"), subject("Basaa"), subject("Bassa Nge")]}
      />
    );

    expect(screen.getByText(fr.disambiguation)).toBeInTheDocument();
    expect(screen.getByText(fr.conviction)).toBeInTheDocument();
  });

  // The question « Lequel cherchez-vous ? » is only honest if the reader can
  // answer it. Each entry used to be plain text, which was survivable while
  // two of three Bassa still sat in the result list below as cards; once all
  // three are subjects the list is empty, and the page asked the reader to
  // choose with nothing to click.
  // @req REQ-178
  it("lets the reader answer the question it asks, one link per entity", () => {
    render(
      <NameAnswer
        language="fr"
        query="bassa"
        subjects={[subject("Bassa"), subject("Bassa du Cameroun")]}
      />
    );

    const links = screen.getAllByRole("link", { name: /^Bassa/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      getPeopleRoute("fr", "PPL_BASSA"),
      getPeopleRoute("fr", "PPL_BASSA DU CAMEROUN"),
    ]);
  });

  // @req REQ-178
  it("admits an unknown name and offers a way to tell the atlas about it", () => {
    render(<NameAnswer language="fr" query="kirdi-nassarao" subjects={[]} />);

    expect(screen.getByText(fr.unknownName)).toBeInTheDocument();
    expect(screen.getByText(fr.invitation)).toBeInTheDocument();
  });
});
