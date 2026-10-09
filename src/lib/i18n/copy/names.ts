import { NAME_TYPE_LABELS } from "@/lib/glossaire/vocabularies";
import type { Language } from "@/types/shared";

/**
 * The ethnonym index — how a *people* is called. Distinct from
 * `patronymes.ts`, which covers the naming system a *person* is named under.
 */
const fr = {
  pageTitle: "Appellations",
  // The deck says what the page is; `purpose` below says why it exists.
  // They used to be one sentence printed twice — once in the head band and
  // again as the first paragraph under it — which read as a stutter and
  // still left unsaid what a reader comes here to do.
  pageSubtitle:
    "Les noms sous lesquels chaque peuple d'Afrique est désigné : ceux qu'il se donne, et ceux qu'on lui a donnés.",
  /**
   * Why the page exists, in the reader's terms.
   *
   * Naming a people is contested, and the atlas takes no side: it records
   * every attested form and says where each came from. Without this said
   * plainly, a reader meets three thousand forms and no reason for them —
   * and the page reads as a duplicate of the people pages, which name one
   * autonym each and cannot be entered from a name heard elsewhere.
   */
  purpose:
    "Un peuple peut porter plusieurs noms. Certains sont employés par ses habitants, d’autres viennent de ses voisins ou d’une administration coloniale. Certains noms sont jugés méprisants. Cette page rassemble les noms que nous avons retrouvés pour vous aider à identifier le peuple dont on parle et à comprendre leur histoire.",
  // The note used to say the genealogy of personal names was "not covered
  // yet". It is: the patronyme pages exist and now have their own route
  // (DEC-038), so the note points there instead of closing the door.
  genealogyNote:
    "Cette page présente les noms de peuples. Pour chercher l’origine d’un nom de famille, consultez la rubrique consacrée aux noms des personnes.",
  searchLabel: "Rechercher un nom",
  searchPlaceholder: "Rechercher un nom, actuel ou ancien…",
  searchSubmit: "Rechercher",
  filtersLabel: "Filtrer par type de nom",
  // The four chips are the page's own vocabulary and were glossed nowhere
  // a reader passes through — « endonyme » and « exonyme » least of all,
  // and they are the two that carry the page's whole argument.
  filtersLegend:
    "Les filtres distinguent les noms employés par un peuple pour se nommer, ceux que d’autres lui donnent et les anciennes façons de les écrire. Un nom donné de l’extérieur n’a pas nécessairement été imposé.",
  filters: {
    all: "tous",
    endonym: NAME_TYPE_LABELS.fr.endonym,
    exonym: NAME_TYPE_LABELS.fr.exonym,
    historical_spelling: NAME_TYPE_LABELS.fr.historical_spelling,
    // Kept for `NameTypeBadge`, which labels a record of that type. The
    // filter chip it once fed is now rendered only when the atlas holds
    // such a record, and it holds none — see migration 071.
    surname: NAME_TYPE_LABELS.fr.surname,
    imposed: "noms imposés",
  },
  activeFiltersLabel: "Filtres actifs",
  clearFilter: "Supprimer le filtre",
  resultCountSingular: "résultat",
  resultCountPlural: "résultats",
  // The listing names a range, not just a total: the page used to print
  // "3679 résultats" above 100 rendered rows.
  range: {
    none: "Aucune forme",
    of: "sur",
    formsSingular: "forme",
    formsPlural: "formes",
  },
  alsoWritten: "Aussi écrit :",
  bornBy: "Porté par",
  bornByOne: "Porté par un peuple",
  peoplesPlural: "peuples",
  problematicLabel: "Pourquoi ce nom pose problème :",
  pagination: {
    label: "Pages de résultats",
    previous: "Précédent",
    next: "Suivant",
    page: "Page",
  },
  emptyState: {
    spellingGuidance:
      "Essayez une autre orthographe : un nom peut s’écrire différemment selon la langue ou l’époque.",
    browseByTypeLabel: "Parcourir par type de nom :",
    clearFilters: "Retirer les filtres",
    reportMissing: "Signaler une donnée manquante",
  },
};

type NamesCopy = typeof fr;

// @req REQ-145
export const namesCopy: Record<Language, NamesCopy> = { fr };
