import type { Language } from "@/types/shared";

/**
 * The words of the productions the Découvertes reader plays, by record.
 *
 * The description states what the fiche states and no more: the Mandé short's
 * own thesis drew sustained objection on the substance, and a sentence that
 * repeated it flat would publish a contested claim as settled. It carries no
 * figure either: the short says sixty languages and the fiche seventy-five.
 */
const en = {
  mande: {
    name: "Mandé",
    description:
      "“Mandé” is the name of a family of languages in West Africa. It was the German linguist Sigismund Wilhelm Koelle who made it the name of a classification, in 1854; the Manden region itself is attested long before, in Mandinka tradition.",
    sourceTitle: "Mandé — language family",
  },
};

type DiscoveryVideosCopy = typeof en;

const fr: DiscoveryVideosCopy = {
  mande: {
    name: "Mandé",
    description:
      "« Mandé » est le nom d’une famille de langues d’Afrique de l’Ouest. C’est le linguiste allemand Sigismund Wilhelm Koelle qui en a fait, en 1854, le nom d’une classification ; la région du Manden, elle, est attestée bien avant par la tradition mandingue.",
    sourceTitle: "Mandé — famille linguistique",
  },
};

// @req REQ-181
export const discoveryVideosCopy: Record<Language, DiscoveryVideosCopy> = {
  en,
  fr,
};
