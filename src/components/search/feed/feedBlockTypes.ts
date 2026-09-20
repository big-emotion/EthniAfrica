import type {
  SearchEvidence,
  SearchSourceStanding,
} from "@/lib/search/evidence";
import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";

export type FeedCompanionMatch =
  SearchCompanionsData["shorts"]["items"][number]["match"];

export type FeedMovementZone = "primary" | "secondary";

export interface FeedEvidenceProps {
  evidence?: SearchEvidence;
  standing?: SearchSourceStanding;
}
