import { pageSizeSchema } from "@/api/v2/schemas/pagination";
import { z } from "zod";

const mediaEntityTypeSchema = z.enum([
  "language_family",
  "language",
  "people",
  "country",
]);

// @req REQ-128
export const listMediaQuerySchema = z.object({
  entityType: mediaEntityTypeSchema,
  entityId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  perPage: pageSizeSchema,
});

export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;
