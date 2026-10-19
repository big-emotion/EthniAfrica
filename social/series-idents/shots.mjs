// The storyboard as data, shared by the compositions, the board and the
// tests. Times are seconds from the clip's first frame at 30 fps. The clips
// are mute (operator, 19 October 2026): the reel's voice is laid over them,
// so `say` and `at` are scratch timing at about 16 characters a second, to
// re-time on the real voice track.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// The feed safe zone and button column measured for the series engine
// (social/video/sequence.mjs). Essential text stays inside the first and
// out of the second.
export const SAFE_ZONE = { x: 120, y: 270, w: 840, h: 978 };
export const BUTTON_COLUMN = { x: 780, y: 840, w: 180, h: 408 };

// 12 px read in a 430 px wide feed is 30.14 px in the 1080 px frame.
export const MIN_TEXT_PX = (12 * WIDTH) / 430;
export const MIN_CONTRAST = 4.5;

export const INTRO = {
  id: "intro",
  file: "ident.html",
  duration: 6.0,
  voice:
    "Avec EthniAfrica, on part des noms qu'on emploie en français pour mieux comprendre l'Afrique et ses peuples.",
  shots: [
    {
      id: "i1-brand",
      t: 0.8,
      at: 0.0,
      say: "Avec EthniAfrica,",
      does: "Le logo et le mot EthniAfrica se posent sur le parchemin.",
    },
    {
      id: "i2-devices",
      t: 2.2,
      at: 0.95,
      say: "on part des noms qu'on emploie en français",
      does: "Le site sur ordinateur, tablette et téléphone : la même page d'accueil, « D'où vient ce nom ? ».",
    },
    {
      id: "i3-tap",
      t: 3.55,
      at: 2.9,
      say: "pour mieux comprendre",
      does: "On entre dans le téléphone ; un doigt touche le champ de recherche.",
    },
    {
      id: "i4-typed",
      t: 4.5,
      at: 3.9,
      say: "l'Afrique",
      does: "Le nom de l'épisode se tape lettre à lettre.",
    },
    {
      id: "i5-search",
      t: 5.8,
      at: 4.95,
      say: "et ses peuples.",
      does: "Le doigt appuie sur Rechercher ; la page commence à s'ouvrir. La réponse, c'est l'épisode.",
    },
  ],
};

export const OUTRO = {
  id: "outro",
  file: "endcard.html",
  duration: 8.0,
  voice:
    "L'importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil.",
  shots: [
    {
      id: "o1-line",
      t: 1.6,
      at: 0.0,
      say: "L'importance de connaître nos noms.",
      does: "La phrase du projet, seule, pendant que la voix la dit.",
    },
    {
      id: "o2-search",
      t: 3.3,
      at: 2.35,
      say: "Vous pouvez continuer la recherche",
      does: "La phrase monte ; le téléphone revient avec le nom déjà tapé, et le doigt appuie sur Rechercher.",
    },
    {
      id: "o3-result",
      t: 4.9,
      at: 4.0,
      say: "sur EthniAfrica,",
      does: "La réponse se construit : « Vous avez cherché… », puis le nom que le peuple se donne.",
    },
    {
      id: "o4-forms",
      t: 6.2,
      at: 4.95,
      say: "lien en profil.",
      does: "Les appellations arrivent une à une, côte à côte.",
    },
    {
      id: "o5-end",
      t: 7.6,
      at: 6.0,
      say: "(la voix est finie)",
      does: "La phrase, l'invitation, le logo, ethniafrica.com et le repère vers le nom du compte.",
    },
  ],
};

export const CLIPS = [INTRO, OUTRO];
