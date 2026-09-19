import type {
  SearchEvidence,
  SearchSourceStanding,
} from "@/lib/search/evidence";
import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";

export interface FeedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export type FeedCompanionMatch =
  SearchCompanionsData["shorts"]["items"][number]["match"];

export type FeedCompanionSource =
  SearchCompanionsData["anecdotes"]["items"][number]["sources"][number];

export type FeedMovementZone = "primary" | "secondary";

export interface FeedEvidenceProps {
  evidence?: SearchEvidence;
  standing?: SearchSourceStanding;
}
