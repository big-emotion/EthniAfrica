import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FlagPublicStatus } from "../FlagPublicStatus";
import { FlagRemediationRecord } from "../FlagRemediationRecord";
import { publicFlagsCopy } from "@/lib/i18n/copy/publicFlags";
import { LOCALES } from "@/lib/locale";

/**
 * Contract for docs/design/moderation-charter.md §5 — two axes, never one
 * label.
 *
 * Flag 00EZK83QDV was accepted on 2026-09-16 at 08:02 UTC and its public page
 * announced « acceptée · page mise à jour » while the map it contested still
 * drew Western Sahara inside Morocco: the fix was merged into the integration
 * branch and deployed nowhere. The label was hard-coded per status, so
 * accepting asserted a correction nobody had published.
 */

/**
 * Words a disposition label may not carry. A disposition says what the atlas
 * thinks of a remark; the moment it names the corpus it makes a claim only a
 * published correction can honour.
 */
const CORPUS_CLAIMS = [
  "mise à jour",
  "mise a jour",
  "page updated",
  "corrigé",
  "corrigee",
  "corrigée",
  "fixed",
  "updated",
  "corrected",
];

const TERMINAL_STATES = ["accepted", "rejected", "duplicate"] as const;

describe("the disposition axis carries no claim about the corpus", () => {
  // @req REQ-014
  it("keeps corpus vocabulary out of every status label, in both locales", () => {
    for (const locale of LOCALES) {
      const labels = publicFlagsCopy[locale].statusDescriptions;
      for (const [status, label] of Object.entries(labels)) {
        for (const claim of CORPUS_CLAIMS) {
          expect(label.toLowerCase(), `${locale}.${status}`).not.toContain(
            claim
          );
        }
      }
    }
  });

  // @req REQ-014
  it("draws the disposition as a pill, the shape of one value among several", () => {
    render(<FlagPublicStatus status="accepted" />);

    expect(screen.getByTestId("flag-status-badge").className).toContain(
      "rounded-full"
    );
  });
});

describe("a terminal decision shows the moderator's answer", () => {
  // @req REQ-042
  it.each(TERMINAL_STATES)(
    "renders the note, its label and its signature on %s",
    (status) => {
      render(
        <FlagPublicStatus
          status={status}
          moderatorNotes="Le tracé retenu suit la ligne de cessez-le-feu de 1991."
          resolvedAt="2026-09-16T08:02:00.000Z"
        />
      );

      const response = screen.getByTestId("moderation-response");
      expect(response).toHaveTextContent("Réponse de la modération");
      expect(response).toHaveTextContent(
        "Le tracé retenu suit la ligne de cessez-le-feu de 1991."
      );
      expect(response).toHaveTextContent("Modération");
    }
  );

  // @req REQ-042
  it("shows nothing when the decision carries no note", () => {
    render(<FlagPublicStatus status="accepted" moderatorNotes={null} />);

    expect(screen.queryByTestId("moderation-response")).toBeNull();
  });
});

describe("the remediation axis is a record, not an opinion", () => {
  // @req REQ-042
  it("says the page has not changed while the correction is unpublished", () => {
    render(
      <FlagRemediationRecord
        state="not_started"
        decidedAt="2026-09-16T08:02:00.000Z"
      />
    );

    const record = screen.getByTestId("flag-remediation-record");
    expect(record).toHaveTextContent("État du corpus");
    expect(record).toHaveTextContent("Correction non encore publiée");
    expect(record).toHaveTextContent("n'a pas changé à ce jour");
  });

  // @req REQ-042
  it("takes the sharp corner the source apparatus wears", () => {
    render(<FlagRemediationRecord state="not_started" />);

    const record = screen.getByTestId("flag-remediation-record");
    expect(record.className).toContain("rounded-none");
    expect(record.className).not.toContain("rounded-full");
  });

  // @req REQ-042
  it("dates a published correction and quotes its summary", () => {
    render(
      <FlagRemediationRecord
        state="published"
        publishedAt="2026-09-20T09:00:00.000Z"
        summary="La carte distingue désormais le Sahara occidental du Maroc."
      />
    );

    const record = screen.getByTestId("flag-remediation-record");
    expect(record).toHaveTextContent("Corrigée le");
    expect(record).toHaveTextContent(
      "La carte distingue désormais le Sahara occidental du Maroc."
    );
  });

  // A `published` row without a date is refused by Postgres
  // (`flags_remediation_published_check`, migration 092). A payload carrying
  // one anyway is a claim with no record behind it, and the reader is shown
  // nothing rather than an undated correction.
  // @req REQ-042
  it("states no published correction without the date it was published", () => {
    render(
      <FlagRemediationRecord state="published" summary="Carte reprise." />
    );

    expect(screen.queryByTestId("flag-remediation-record")).toBeNull();
  });

  // @req REQ-042
  it("offers the change link only when one exists", () => {
    const { rerender } = render(
      <FlagRemediationRecord
        state="published"
        publishedAt="2026-09-20T09:00:00.000Z"
      />
    );
    expect(screen.queryByText("Voir ce qui a changé")).toBeNull();

    rerender(
      <FlagRemediationRecord
        state="published"
        publishedAt="2026-09-20T09:00:00.000Z"
        changeHref="#correction"
      />
    );
    expect(screen.getByText("Voir ce qui a changé")).toBeInTheDocument();
  });

  // On a rejected report the absence is the information: nothing was corrected
  // because nothing was accepted, and printing « sans objet » would put the
  // workshop's bookkeeping on the reader's page.
  // @req REQ-042
  it("renders nothing at all when remediation does not apply", () => {
    render(<FlagRemediationRecord state="not_applicable" />);

    expect(screen.queryByTestId("flag-remediation-record")).toBeNull();
  });

  // @req REQ-042
  it("renders nothing when the flag carries no remediation state", () => {
    render(<FlagRemediationRecord state={null} />);

    expect(screen.queryByTestId("flag-remediation-record")).toBeNull();
  });

  // @req REQ-042
  it("names both axes in English too", () => {
    render(
      <FlagRemediationRecord
        state="not_started"
        decidedAt="2026-09-16T08:02:00.000Z"
        language="en"
      />
    );

    const record = screen.getByTestId("flag-remediation-record");
    expect(record).toHaveTextContent("Corpus state");
    expect(record).toHaveTextContent("Correction not yet published");
  });
});
