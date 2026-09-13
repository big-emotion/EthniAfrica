import type { GalleryCollection } from "@/lib/discoveries/gallery";
import type { Language } from "@/types/shared";

// Provisional wording: the gallery's final name and rubric are content design
// for the art direction pass, decided before the module opens.
const en = {
  pageTitle: "Gallery",
  pageSubtitle:
    "The generated images from Discoveries, filed by collection. Each one is an interpretation, not a document.",
  collections: {
    autonymes: "Autonyms",
    traversees: "Crossings",
    "figures-et-moments": "Figures and moments",
  } satisfies Record<GalleryCollection, string>,
  empty: "No generated image is published yet.",
};

type GalleryCopy = typeof en;

const fr: GalleryCopy = {
  pageTitle: "Galerie",
  pageSubtitle:
    "Les images générées de Découvertes, rangées par collection. Chacune est une interprétation, pas un document.",
  collections: {
    autonymes: "Autonymes",
    traversees: "Traversées",
    "figures-et-moments": "Figures et moments",
  },
  empty: "Aucune image générée n’est encore publiée.",
};

// @req REQ-145
export const galleryCopy: Record<Language, GalleryCopy> = { en, fr };
