import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RemediationPanel } from "@/components/admin/RemediationPanel";
import { readRemediation } from "@/components/admin/remediation";

describe("RemediationPanel", () => {
  /**
   * The load-bearing test of this change.
   *
   * A "page updated" control here would let a moderator declare a correction
   * that has not happened — which is the defect this whole lot repairs on the
   * public surface, with a layer of human intention on top to make it
   * credible. Only the publication of the corpus closes a remediation, so the
   * panel offers no control that writes one.
   */
  // @req REQ-042
  it("offers no control that could declare a correction done", () => {
    render(
      <RemediationPanel
        language="fr"
        remediation={readRemediation({ remediationState: "in_progress" })}
      />
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  // @req REQ-042
  it("carries a visible read-only marker and says why it is read-only", () => {
    render(
      <RemediationPanel
        language="fr"
        remediation={readRemediation({ remediationState: "in_progress" })}
      />
    );

    expect(screen.getByText("Lecture seule")).toBeInTheDocument();
    expect(
      screen.getByText(/seule la publication du corpus clôt une remédiation/i)
    ).toBeInTheDocument();
  });

  /**
   * The columns arrive with their own migration. A queue row written before it
   * must render the panel, not take the case file down with it.
   */
  // @req REQ-042
  it("renders an untracked remediation rather than crash on the absent field", () => {
    render(
      <RemediationPanel language="fr" remediation={readRemediation({})} />
    );

    expect(
      screen.getByText(/pas encore suivie pour ce signalement/i)
    ).toBeInTheDocument();
  });

  // @req REQ-042
  it("states the four tracked states, the publication stamp and the linked revision", () => {
    render(
      <RemediationPanel
        language="fr"
        remediation={readRemediation({
          remediationState: "published",
          remediationPublishedAt: "2026-09-16T09:36:00.000Z",
          remediationSummary: "Sahara occidental coupé au 27°40′N.",
          revisionDraftId: "7b1d2a8e-0000-4000-8000-00000000abcd",
        })}
      />
    );

    expect(screen.getByText("Publiée en production")).toBeInTheDocument();
    expect(screen.getByText(/16 septembre 2026/)).toBeInTheDocument();
    expect(
      screen.getByText("Sahara occidental coupé au 27°40′N.")
    ).toBeInTheDocument();
    expect(screen.getByText(/7b1d2a8e/)).toBeInTheDocument();
  });

  // @req REQ-140
  // @req REQ-145
  it("renders the panel in English", () => {
    render(
      <RemediationPanel
        language="en"
        remediation={readRemediation({ remediationState: "not_started" })}
      />
    );

    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(
      screen.getByText(
        /only the publication of the corpus closes a remediation/i
      )
    ).toBeInTheDocument();
  });
});
