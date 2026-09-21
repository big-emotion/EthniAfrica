import { z } from "zod";

// @req REQ-091
export const revalidatePayloadSchema = z.object({
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
  slug: z.string().min(1),
});
