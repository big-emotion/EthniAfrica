import type { Language } from "@/types/shared";

// @req REQ-037
export const apiVersioningCopy = {
  fr: {
    responseHeadersErrorSuffix:
      ", y compris les erreurs — une 401 sur une clé refusée et une 429 de limitation de débit les portent aussi.",
  },
} satisfies Record<Language, { responseHeadersErrorSuffix: string }>;
