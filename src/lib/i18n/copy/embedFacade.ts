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
const en = {
  play: "Watch here",
  playLabel: "Watch here: {name} — loads YouTube's player",
  notice:
    "Playing loads YouTube’s player, which writes trackers to your device and receives your IP address. Your choice is kept and can be withdrawn in “{settings}”.",
  watchOnPlatform: "Watch on YouTube",
  close: "Close the player",
};

type EmbedFacadeCopy = typeof en;

const fr: EmbedFacadeCopy = {
  play: "Regarder sur place",
  playLabel: "Regarder sur place : {name} — charge le lecteur de YouTube",
  notice:
    "La lecture charge le lecteur de YouTube, qui dépose des traceurs sur votre appareil et reçoit votre adresse IP. Votre choix est gardé et révocable dans « {settings} ».",
  watchOnPlatform: "Regarder sur YouTube",
  close: "Fermer le lecteur",
};

// @req REQ-181
export const embedFacadeCopy: Record<Language, EmbedFacadeCopy> = { en, fr };
