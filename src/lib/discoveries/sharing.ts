export interface DiscoverySharePayload {
  id: string;
  title: string;
  description: string;
  url: string;
}

// @req REQ-160
export const discoveryShareChoices = [
  { id: "youtube", label: "YouTube", mode: "video-unavailable" },
  { id: "youtube-shorts", label: "YouTube Shorts", mode: "video-unavailable" },
  { id: "instagram", label: "Instagram", mode: "media-unavailable" },
  {
    id: "instagram-reels",
    label: "Instagram Reels",
    mode: "video-unavailable",
  },
  { id: "whatsapp", label: "WhatsApp", mode: "link" },
  { id: "facebook", label: "Facebook", mode: "link" },
  { id: "facebook-reels", label: "Facebook Reels", mode: "video-unavailable" },
  { id: "tiktok-story", label: "TikTok Story", mode: "media-unavailable" },
  { id: "linkedin", label: "LinkedIn", mode: "link" },
  { id: "system", label: "Other apps", mode: "system" },
] as const;

export type LinkShareChoice = "whatsapp" | "facebook" | "linkedin";

// @req REQ-160
export function linkDestination(
  choice: LinkShareChoice,
  payload: DiscoverySharePayload
): string {
  const url = encodeURIComponent(payload.url);
  if (choice === "whatsapp") {
    return `https://wa.me/?text=${encodeURIComponent(payload.title)}%20${url}`;
  }
  if (choice === "facebook") {
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}
