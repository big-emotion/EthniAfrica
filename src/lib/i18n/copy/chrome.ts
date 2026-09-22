import { PRODUCT_TAGLINE } from "@/lib/brand";
import type { Language } from "@/types/shared";

const en = {
  headerTagline: "Africa through its names",
  mainNavigation: "Main navigation",
  entryPoints: "Entry points",
  search: "Search",
  openMenu: "Open menu",
  breadcrumb: "Breadcrumb",
  backToTop: "Back to top",
  allDossiers: "All dossiers",
  theme: {
    switchToParchment: "Switch to parchment mode",
    switchToNight: "Switch to night mode",
    parchment: "Parchment mode",
    night: "Night mode",
  },
  shortcuts: {
    title: "Keyboard shortcuts",
    openSearch: "Open search",
    searchPage: "Go to the search page (⌘K on Mac)",
    peoples: "Go to peoples",
    families: "Go to language families",
    show: "Show keyboard shortcuts",
    closePanel: "Close the open panel",
  },
};

type ChromeCopy = typeof en;

const fr: ChromeCopy = {
  // Reads from PRODUCT_TAGLINE rather than repeating it: since C1 the
  // masthead carries the slogan in full (brandQualifierCharter.test.ts), so a
  // second literal here would be the exact duplication brand charter §1
  // forbids.
  headerTagline: PRODUCT_TAGLINE,
  mainNavigation: "Navigation principale",
  entryPoints: "Points d'entrée",
  search: "Rechercher",
  openMenu: "Ouvrir le menu",
  breadcrumb: "Fil d'ariane",
  backToTop: "Revenir en haut de la page",
  allDossiers: "Tous les dossiers",
  theme: {
    switchToParchment: "Passer en mode parchemin",
    switchToNight: "Passer en mode nuit",
    parchment: "Mode parchemin",
    night: "Mode nuit",
  },
  shortcuts: {
    title: "Raccourcis clavier",
    openSearch: "Ouvrir la recherche",
    searchPage: "Aller à la page recherche (⌘K sur Mac)",
    peoples: "Aller aux peuples",
    families: "Aller aux familles linguistiques",
    show: "Afficher les raccourcis clavier",
    closePanel: "Fermer le panneau ouvert",
  },
};

// @req REQ-145
export const chromeCopy: Record<Language, ChromeCopy> = { en, fr };
