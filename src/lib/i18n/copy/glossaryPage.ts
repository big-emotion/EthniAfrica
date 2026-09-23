import type { GlossaryFamily } from "@/lib/glossaire/types";
import type { Language } from "@/types/shared";

const en = {
  title: "Glossary",
  subtitle: (count: number) =>
    `The words we use to name. ${count} terms, each with an example from our entries — or the reason why we have none.`,
  familiesLabel: "The three families",
  familyCount: (count: number) => `${count} terms`,
  families: [
    { id: "origine", step: "Family 01", heading: "Where the name comes from" },
    { id: "objet", step: "Family 02", heading: "What is named" },
    { id: "effet", step: "Family 03", heading: "What naming produces" },
  ] satisfies Array<{ id: GlossaryFamily; step: string; heading: string }>,
  seenIn: "Seen in",
  fallback:
    "English definitions are awaiting editorial review. The French originals follow.",
};

type GlossaryPageCopy = typeof en;

const fr: GlossaryPageCopy = {
  title: "Glossaire",
  subtitle: (count) =>
    `Les mots avec lesquels nous nommons. ${count} termes, chacun avec un exemple pris dans nos fiches — ou avec la raison pour laquelle nous n'en avons pas.`,
  familiesLabel: "Les trois familles",
  familyCount: (count) => `${count} termes`,
  families: [
    { id: "origine", step: "Famille 01", heading: "D'où vient le nom" },
    { id: "objet", step: "Famille 02", heading: "Ce qui est nommé" },
    { id: "effet", step: "Famille 03", heading: "Ce que nommer produit" },
  ],
  seenIn: "Vu dans",
  fallback: "",
};

// @req REQ-145
export const glossaryPageCopy: Record<Language, GlossaryPageCopy> = { en, fr };
