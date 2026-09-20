import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchFeedContributionAction } from "@/components/search/feed/SearchFeedContributionAction";

const { openFlagTarget, recordFlagTargetProps } = vi.hoisted(() => ({
  openFlagTarget: vi.fn(),
  recordFlagTargetProps: vi.fn(),
}));

vi.mock("@/components/flags/FlagTarget", () => ({
  FlagTarget: (props: {
    renderTrigger?: (open: () => void) => React.ReactNode;
  }) => {
    recordFlagTargetProps(props);
    return props.renderTrigger?.(openFlagTarget) ?? null;
  },
}));

describe("SearchFeedContributionAction", () => {
  beforeEach(() => {
    openFlagTarget.mockClear();
    recordFlagTargetProps.mockClear();
  });

  // @req REQ-180
  it("opens FlagTarget as a contribution for a meaningful target", () => {
    const target = {
      type: "languageFamily",
      id: "FLG_MANDE",
      name: "Mandé",
      fieldPath: "content.appellations",
    };

    render(
      <SearchFeedContributionAction
        language="fr"
        target={target}
        label="Proposer une source"
        variant="accent"
      />
    );

    const trigger = screen.getByRole("button", {
      name: "Proposer une source",
    });
    expect(trigger).toBeEnabled();
    expect(trigger).toHaveClass("min-h-11");
    expect(trigger).toHaveAttribute("data-flag-kind", "contribution");
    fireEvent.click(trigger);

    expect(openFlagTarget).toHaveBeenCalledOnce();
    expect(recordFlagTargetProps).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "fr",
        target,
        preferredKind: "contribution",
      })
    );
  });

  // @req REQ-180
  it("renders no enabled action when the target type or id is blank", () => {
    const { rerender } = render(
      <SearchFeedContributionAction
        language="fr"
        target={{ type: " ", id: "FLG_MANDE" }}
        label="Proposer une source"
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(recordFlagTargetProps).not.toHaveBeenCalled();

    rerender(
      <SearchFeedContributionAction
        language="fr"
        target={{ type: "languageFamily", id: " " }}
        label="Proposer une source"
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(recordFlagTargetProps).not.toHaveBeenCalled();
  });
});
