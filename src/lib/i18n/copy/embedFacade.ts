import type { Language } from "@/types/shared";

/**
 * The words around a third-party player, before and after the click.
 *
 * The accessible name of the play button opens with its visible text, so a
 * reader who speaks what they see can activate it, and it names both the piece
 * and what the click does: the transfer is heard before it is made. `{name}`
 * and `{settings}` are filled by the component; the settings label is the
 * consent panel's own title, never retyped here.
 */
const fr = {
  play: "Regarder sur place",
  playLabel: "Regarder sur place : {name} — charge le lecteur de YouTube",
  notice:
    "La lecture charge le lecteur de YouTube, qui dépose des traceurs sur votre appareil et reçoit votre adresse IP. Votre choix est gardé et révocable dans « {settings} ».",
  watchOnPlatform: "Regarder sur YouTube",
  close: "Fermer le lecteur",
};

type EmbedFacadeCopy = typeof fr;

// @req REQ-181
export const embedFacadeCopy: Record<Language, EmbedFacadeCopy> = { fr };
