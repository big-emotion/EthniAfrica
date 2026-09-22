import { describe, expect, it } from "vitest";

import {
  discoveryPath,
  type DiscoveryPublication,
} from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import { HOME_STORY_IDS, resolveHomeStories } from "@/lib/home/homeStories";

describe("the home's reviewed stories", () => {
  // A listed story that no longer resolves would be a card linking nowhere;
  // resolving it through the discoveries catalog is what proves it is still
  // published, in both locales, at the path the reader will land on.
  // @req REQ-115
  it.each(["fr", "en"] as const)(
    "resolves every listed story to a published discovery in %s",
    (language) => {
      const published = getDiscoveryPublications();
      const stories = resolveHomeStories(language);

      expect(stories.map((story) => story.id)).toEqual([...HOME_STORY_IDS]);
      for (const story of stories) {
        const entry = published.find((record) => record.id === story.id)!;
        expect(story.title).toBe(entry.title[language]);
        expect(story.href).toBe(discoveryPath(language, entry));
      }
    }
  );

  // @req REQ-115
  it("lists the two anecdotes and the Mandé video", () => {
    expect(HOME_STORY_IDS).toEqual([
      "anecdote:burkina-faso",
      "anecdote:guere-wobe",
      "video:origine-du-nom-mande",
    ]);
  });

  // A draft or a withdrawn record drops out rather than rendering a card to a
  // page that answers 404.
  // @req REQ-115
  it("drops an id that is not a published discovery", () => {
    const published = getDiscoveryPublications();
    const draft: DiscoveryPublication = {
      ...published.find((record) => record.id === "anecdote:guere-wobe")!,
      id: "anecdote:draft",
      status: "draft",
      slug: { fr: "brouillon", en: "draft" },
    };

    const stories = resolveHomeStories(
      "fr",
      ["anecdote:draft", "anecdote:unknown", "anecdote:burkina-faso"],
      [...published, draft]
    );

    expect(stories.map((story) => story.id)).toEqual(["anecdote:burkina-faso"]);
  });
});
