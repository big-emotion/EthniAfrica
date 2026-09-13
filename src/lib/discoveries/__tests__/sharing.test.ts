import { describe, expect, it } from "vitest";

import { discoveryShareChoices, linkDestination } from "../sharing";

const payload = {
  id: "anecdote:burkina-faso",
  title: "Burkina & Faso",
  description: "Three languages",
  url: "https://ethniafrica.com/fr/decouvertes/burkina-faso-trois-langues",
};

describe("Découvertes share capabilities", () => {
  // @req REQ-160
  it("names all ten approved destinations without promising a media upload", () => {
    expect(discoveryShareChoices.map((choice) => choice.id)).toEqual([
      "youtube",
      "youtube-shorts",
      "instagram",
      "instagram-reels",
      "whatsapp",
      "facebook",
      "facebook-reels",
      "tiktok-story",
      "linkedin",
      "system",
    ]);
    expect(
      discoveryShareChoices.filter((choice) => choice.mode === "link")
    ).toHaveLength(3);
    expect(
      discoveryShareChoices.filter(
        (choice) => choice.mode === "video-unavailable"
      )
    ).toHaveLength(4);
    expect(
      discoveryShareChoices.filter(
        (choice) => choice.mode === "media-unavailable"
      )
    ).toHaveLength(2);
  });

  // @req REQ-160
  it("encodes the selected publication's exact URL in supported link intents", () => {
    for (const choice of ["whatsapp", "facebook", "linkedin"] as const) {
      const destination = linkDestination(choice, payload);
      expect(destination).toContain(encodeURIComponent(payload.url));
      expect(destination).not.toContain("guere-krahn-we");
    }
  });
});
