import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeStories } from "@/components/home/HomeStories";
import { resolveHomeStories } from "@/lib/home/homeStories";
import { homeStoriesCopy } from "@/lib/i18n/copy/homeStories";

describe("HomeStories — three stories that start from a familiar word", () => {
  // @req REQ-115
  it("titles the section, introduces it, and lists every story", () => {
    const stories = resolveHomeStories("fr");
    render(<HomeStories language="fr" stories={stories} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: homeStoriesCopy.fr.title,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(homeStoriesCopy.fr.intro)).toBeInTheDocument();

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(stories.length);
    stories.forEach((story, index) => {
      expect(
        within(items[index]).getByRole("heading", {
          level: 3,
          name: story.title,
        })
      ).toBeInTheDocument();
    });
  });

  // Three links reading « Lire l'histoire » are told apart by the card title
  // they describe, so a screen-reader's link list is not three identical rows.
  // @req REQ-115
  it("points each card's link at its discovery and describes it by the title", () => {
    const stories = resolveHomeStories("fr");
    render(<HomeStories language="fr" stories={stories} />);

    const links = screen.getAllByRole("link", {
      name: homeStoriesCopy.fr.linkLabel,
    });
    expect(links).toHaveLength(stories.length);
    stories.forEach((story, index) => {
      expect(links[index]).toHaveAttribute("href", story.href);
      expect(links[index]).toHaveAccessibleDescription(story.title);
    });
  });

  // @req REQ-145
  it("speaks English on the English home", () => {
    render(<HomeStories language="en" stories={resolveHomeStories("en")} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Stories to discover" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Read the story" })
    ).toHaveLength(3);
  });

  // A titled section with nothing under it would announce stories it does
  // not have.
  // @req REQ-115
  it("renders nothing when the list is empty", () => {
    const { container } = render(<HomeStories language="fr" stories={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
