import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/fr",
  useRouter: () => ({ push: vi.fn() }),
}));

import { RelationsListWithSourceSheet } from "../RelationsListWithSourceSheet";
import type { RelationListItem } from "@/lib/relationsDataTransformer";

const CENTER = { id: "PPL_YORUBA", nameMain: "Yoruba" };

const FON_ITEM: RelationListItem = {
  id: "REL_YORUBA_FON_MIGRATION",
  type: "migratory",
  derived: false,
  neighbor: { id: "PPL_FON", nameMain: "Fon", languageFamilyId: "FLG_KWA" },
  period: { startYear: 1600, endYear: 1700, label: "XVIIe siècle" },
  description: "Migration conjointe vers le golfe du Bénin.",
  confidence: { score: 82, sourceCount: 3 },
};

describe("RelationsListWithSourceSheet", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // @req REQ-097 FR72
  it("renders the relations list", () => {
    render(<RelationsListWithSourceSheet items={[FON_ITEM]} center={CENTER} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Fon")).toBeInTheDocument();
  });

  // @req REQ-097 UX-DR48
  it("opens the SourceChainSheet with the relation's statement when its chip is activated", async () => {
    render(<RelationsListWithSourceSheet items={[FON_ITEM]} center={CENTER} />);
    fireEvent.click(screen.getByText("voir les sources"));
    expect(
      await screen.findByText("Migration conjointe vers le golfe du Bénin.")
    ).toBeInTheDocument();
  });

  // @req REQ-097
  it("renders the calm empty state when there are no relations", () => {
    render(<RelationsListWithSourceSheet items={[]} center={CENTER} />);
    expect(screen.getByText(/aucune relation documentée/i)).toBeInTheDocument();
  });

  // @req REQ-097 FR75 NFR1
  it("waits until the graph itself enters the viewport before loading it", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const observer = vi.fn();
    class MockIntersectionObserver {
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds: number[] = [];

      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) {
        observer(callback, options);
      }

      observe = observe;
      disconnect = disconnect;
      takeRecords = () => [];
      unobserve = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    render(<RelationsListWithSourceSheet items={[FON_ITEM]} center={CENTER} />);

    expect(observer).toHaveBeenCalledWith(expect.any(Function), {
      rootMargin: "0px",
      threshold: 0.25,
    });
    expect(observe).toHaveBeenCalledWith(
      screen.getByTestId("ego-network-graph-container")
    );
  });
});
