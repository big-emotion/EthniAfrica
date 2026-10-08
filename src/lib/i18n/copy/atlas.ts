import type { Language } from "@/types/shared";

const fr = {
  surface: {
    autoRotating:
      "Globe EthniAfrica. Interagissez avec le globe pour arrêter la rotation.",
    globe: "Globe EthniAfrica. Glissez ou utilisez les flèches pour tourner.",
    flatMap:
      "Carte EthniAfrica. Glissez ou utilisez les flèches pour déplacer.",
  },
  projectionNames: {
    globe: "Globe",
    flatMap: "Carte plate",
    intermediate: "Projection intermédiaire",
  },
  projectionReadout: {
    globe:
      "Globe — chaque pastille retrouve sa surface réelle. L'Afrique fait 30,4 M km².",
    flatMap:
      "Carte plate — Mercator gonfle les surfaces de sec²(latitude) : ×4 à 60°, ×9 à 70°.",
    intermediate:
      "En cours de repli — regardez les pastilles reprendre la même taille.",
  },
  gesture: {
    rotate: "Glissez pour tourner",
    move: "Glissez pour déplacer",
    autoRotating: "Interagissez avec le globe pour arrêter la rotation.",
    rotateShort: "Glissez pour tourner.",
    moveShort: "Glissez pour déplacer.",
  },
  legendStart: "Afrique à sa surface réelle.",
  openCountry: "appuyez sur un point pour ouvrir le pays.",
  flatMap: "Carte plate",
  globe: "Globe",
  morphLabel: "Morphing de la carte plate vers le globe",
  returnToGlobe: "Revenir au globe",
  showFlatMap: "Ce que la carte plate en fait",
  indicatrices: "Pastilles",
  zoomOut: "Dézoomer",
  zoomIn: "Zoomer",
  recentreAfrica: "Recentrer sur l’Afrique",
  recentre: "Recentrer",
  activateInteractiveMap: "Activer la carte interactive",
  wholeArea: "Toute l'empreinte",
  areaNoun: "l'empreinte",
  close: "Fermer",
  chooseCountry: (areaNoun: string) => `Choisir un pays de ${areaNoun}`,
  countries: (areaNoun: string) => `Pays de ${areaNoun}`,
};

type AtlasCopy = typeof fr;

// @req REQ-145
export const atlasCopy: Record<Language, AtlasCopy> = { fr };
