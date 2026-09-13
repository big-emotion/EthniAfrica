import type { Language } from "@/types/shared";

// @req REQ-158
export const DISCOVERY_SLUGS = {
  "burkina-faso": {
    fr: "burkina-faso-trois-langues",
    en: "burkina-faso-three-languages",
  },
  "guere-wobe": {
    fr: "guere-krahn-we",
    en: "guere-krahn-we-names",
  },
} satisfies Record<string, Record<Language, string>>;
