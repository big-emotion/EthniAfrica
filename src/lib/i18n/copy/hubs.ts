import { ACCESS_MODE_LABELS } from "@/lib/hubs/moduleRegistry";
import type { Language } from "@/types/shared";

// `blurb` opens the hub page — it says what the axis holds, in the
// register of the page it opens. `menuBlurb` opens the header panel,
// directly above the tiles of that axis, and lists what those tiles are.
// Two surfaces, so two sentences; both copied from docs/design/mockups,
// which is the reference when code and mockup disagree
// (docs/design/README.md).
//
// The panel sentence used to name the occasion instead of the contents —
// « Quand on sait ce qu'on cherche », « Quand on veut se tester » — which
// asks a reader looking straight at five unexplained tiles to work out
// for themselves what those tiles hold. It now names the modules, and
// `modulesNamedIn` keeps it honest as the registry changes.
//
// Each blurb used to open on the reader's own trajectory — « Il arrive
// avec un nom, il repart avec une page » — before naming the contents.
// It read as a figure of speech where a hub page owes a description,
// and it was the first sentence of three pages and their three meta
// descriptions. The clause is gone; what the axis actually holds, which
// was already the back half of every one of these, is now the whole of
// it. The home's cards (AccessAxes) carry the same change.
//
// What replaced it still opened on « L'axe des… », and that went too
// (2026-09-18). The reader meets this triptych as « Trois chemins » in the
// header panel and « Trois manières d'entrer » on the About page; a third
// name for it, and the only one taken from the inside, is the same failing
// recorded just above against « le corpus » and « une entité ». The
// sentences now start on the contents, which is what was left once the
// filing word came off the front of them.
const fr = {
  atlas: {
    title: ACCESS_MODE_LABELS.atlas,
    // `title` keeps the short reader-facing label available to legacy
    // translation consumers. The band has a different job: it names the
    // page and what it leads into, so `pageTitle` remains descriptive.
    pageTitle: "Explorer les peuples d'Afrique",
    // « Le corpus » and « une entité » are the team's words for the
    // collection and for what it holds. Both name the thing from the
    // inside, and neither is glossed anywhere a reader passes through
    // (ETNI-857) — so the menu that is supposed to say where a click
    // lands was written in the vocabulary of the people who built it.
    // Ordered by the atlas's own hierarchy — famille → langue → peuple →
    // pays — then the axis that names rather than places. Both sentences once
    // listed four of six classes, each omitting a different pair, so a
    // reader met a different atlas depending on whether they read the menu
    // or the page under it.
    //
    // They now name five, not six: appellations left the menu on 7 September
    // 2026 (atlas-charter.md §3), and a sentence that promises what the row
    // below it does not offer is the same defect in the other direction.
    blurb:
      "Une page par famille de langues, par langue, par peuple, par pays et par nom.",
    menuBlurb:
      "Les pages de familles linguistiques, langues, peuples, pays et noms, plus la recherche.",
    hubEntryName: "Le hub d'exploration",
  },
  dossiers: {
    title: ACCESS_MODE_LABELS.dossiers,
    pageTitle: "Comprendre les peuples d'Afrique",
    blurb:
      "D'où vient un nom, par où sont passés les peuples, et sur quelles sources nous nous appuyons.",
    menuBlurb:
      "Les sujets de nos vidéos et de nos carrousels, à lire en entier.",
    hubEntryName: "Le hub de lecture",
    pager: {
      label: "Pages de dossiers",
      previous: "Précédent",
      next: "Suivant",
      position: (page: number, count: number) => `Page ${page} sur ${count}`,
    },
  },
  jeux: {
    title: ACCESS_MODE_LABELS.jeux,
    pageTitle: "Jouer avec les peuples d'Afrique",
    blurb:
      "Des jeux et des quiz tirés des pages, dont chaque réponse renvoie à la sienne.",
    menuBlurb:
      "Un quiz tiré des pages, et la projection de Mercator remise à sa juste taille.",
    hubEntryName: "Le hub des jeux",
  },
  unavailableLabel: "Bientôt",
  plateLicenceLabel: "Licence",
  menuLabel: "Trois chemins",
  // Names the row of facet links under the hub entry. The facets are
  // states of one page, so the menu says so rather than listing them
  // beside the hub as if they were three more destinations — which is
  // exactly how the three directories read before they were merged.
  facetsLabel: "Ses facettes",
  moduleNames: {
    pays: "Les pays d'Afrique",
    peuples: "Les peuples d'Afrique",
    familles: "Les familles linguistiques",
    langues: "Les langues d'Afrique",
    // Kept although the header no longer renders it: the entry is unlisted,
    // not retired, and a label deleted here would fall back to the registry's
    // — which is the same string, but by accident rather than by decision.
    noms: "Appellations",
    patronymes: "Les noms d'Afrique",
    recherche: "Recherche libre",
    articles: "Tous les articles",
    nommer: "Qui a donné ce nom ?",
    anecdotes: "Anecdotes",
    proverbes: "Proverbes",
    frise: "Premiers repères de migrations",
    "regards-colonisation": "Regards : colonisation et résistances",
    quiz: "Le quiz",
    mercator: "La projection de Mercator",
  },
  moduleGroupNames: {
    "dossiers-noms": "Noms",
    "dossiers-organisation": "Organisation",
    "dossiers-religions": "Religions",
    "dossiers-territoires": "Territoires",
    "dossiers-populations": "Populations",
    "dossiers-economie": "Économie",
    "jeux-pays": "Les pays",
    "jeux-quiz": "Le quiz",
  },
  moreInRubric: (count: number) =>
    count === 1 ? "+ 1 autre" : `+ ${count} autres`,
  seeMoreInRubric: "Voir plus",
};

type HubsCopy = typeof fr;

// @req REQ-145
export const hubsCopy: Record<Language, HubsCopy> = { fr };
