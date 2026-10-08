import type { Language } from "@/types/shared";

const fr = {
  eyebrow: "Se repérer",
  title: "Plan du site",
  introduction:
    "Les rubriques du site et les chemins qui y mènent. Les pages elles-mêmes ne sont pas listées ici : on y arrive par Parcourir ou par la recherche. Cette page suit l'ordre de notre projet — famille linguistique, puis langue, peuple et pays — plutôt que l'ordre du menu.",
};

type SitemapPageCopy = typeof fr;

// @req REQ-145
export const sitemapPageCopy: Record<Language, SitemapPageCopy> = { fr };
