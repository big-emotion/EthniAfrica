import type { GlossaryFamily } from "@/lib/glossaire/types";
import type { Language } from "@/types/shared";

const fr = {
  title: "Glossaire",
  subtitle: (count: number) =>
    `Les mots avec lesquels nous nommons. ${count} termes, chacun avec un exemple pris dans nos fiches — ou avec la raison pour laquelle nous n'en avons pas.`,
  familiesLabel: "Les trois familles",
  familyCount: (count: number) => `${count} termes`,
  families: [
    { id: "origine", step: "Famille 01", heading: "D'où vient le nom" },
    { id: "objet", step: "Famille 02", heading: "Ce qui est nommé" },
    { id: "effet", step: "Famille 03", heading: "Ce que nommer produit" },
  ] satisfies Array<{ id: GlossaryFamily; step: string; heading: string }>,
  seenIn: "Vu dans",
  fallback: "",
};

type GlossaryPageCopy = typeof fr;

// @req REQ-145
export const glossaryPageCopy: Record<Language, GlossaryPageCopy> = { fr };
