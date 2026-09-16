import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditTimeline } from "@/components/admin/AuditTimeline";
import type { FlagAuditEntry } from "@/api/v2/services/auditLog";

const received: FlagAuditEntry = {
  event: "received",
  occurredAt: "2026-09-08T14:22:00.000Z",
  actorRole: "reader",
  authorisationLevel: null,
};

const accepted: FlagAuditEntry = {
  event: "accepted",
  occurredAt: "2026-09-16T08:02:00.000Z",
  actorRole: "moderator",
  authorisationLevel: "admin",
};

describe("AuditTimeline", () => {
  /**
   * The rule the screen is built to keep. A register that names the person
   * who decided turns an accountability record into a target; the role and the
   * level it was authorised at are what a reader of the register needs.
   */
  // @req REQ-041
  it("names the role and its authorisation level, and no person", () => {
    render(<AuditTimeline language="fr" entries={[received, accepted]} />);

    const rows = screen.getAllByRole("listitem");
    expect(within(rows[1]).getByText(/modérateur/)).toBeInTheDocument();
    expect(within(rows[1]).getByText(/rôle admin/)).toBeInTheDocument();
    expect(within(rows[0]).getByText(/lecteur/)).toBeInTheDocument();
    expect(within(rows[0]).queryByText(/rôle/)).toBeNull();
  });

  /**
   * A timeline that reads 09:02 in Paris and 08:02 in Abidjan cannot be
   * compared with the public register, which is stamped UTC.
   */
  // @req REQ-041
  it("stamps every row in UTC, whatever the reader's zone", () => {
    render(<AuditTimeline language="fr" entries={[accepted]} />);

    const stamp = screen.getByRole("listitem").querySelector("time");
    expect(stamp?.getAttribute("dateTime")).toBe("2026-09-16T08:02:00.000Z");
    expect(stamp?.textContent).toMatch(/08:02/);
    expect(stamp?.textContent).toMatch(/UTC/);
  });

  /**
   * The row the whole screen exists for: the step that has not happened. It is
   * listed rather than omitted, because a trail that stops at "accepted" reads
   * as a correction that shipped.
   */
  // @req REQ-041
  it("lists a pending step as pending, with no stamp and a hollow marker", () => {
    render(
      <AuditTimeline
        language="fr"
        entries={[accepted]}
        pendingEvent="publication"
      />
    );

    const rows = screen.getAllByRole("listitem");
    const pending = rows[rows.length - 1];
    expect(
      within(pending).getByText(/Publication en production/)
    ).toBeInTheDocument();
    expect(
      within(pending).getByText(/n'a pas encore eu lieu/i)
    ).toBeInTheDocument();
    expect(pending.querySelector("time")).toBeNull();
    expect(pending).toHaveAttribute("data-pending", "true");
  });

  // @req REQ-041
  it("says the register could not be read rather than show an empty trail", () => {
    render(<AuditTimeline language="fr" entries={[]} state="unreadable" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /rien ici ne dit qu'aucune décision n'a été prise/i
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  // @req REQ-140
  // @req REQ-145
  it("renders the trail in English", () => {
    render(
      <AuditTimeline
        language="en"
        entries={[received, accepted]}
        pendingEvent="publication"
      />
    );

    expect(screen.getByText("Report received")).toBeInTheDocument();
    expect(screen.getByText(/authorisation admin/)).toBeInTheDocument();
    expect(screen.getByText(/Has not occurred yet/)).toBeInTheDocument();
  });
});
