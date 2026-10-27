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
      id: "i1-profile",
      t: 1.2,
      at: 0.0,
      say: "Avec EthniAfrica,",
      does: "Le profil EthniAfrica sur un réseau social ; la pastille passe de TikTok à Instagram, puis à Facebook.",
    },
    {
      id: "i2-follow",
      t: 2.3,
      at: 0.95,
      say: "on part des noms qu'on emploie",
      does: "Un doigt touche « S'abonner », qui devient « Abonné ».",
    },
    {
      id: "i3-link",
      t: 2.7,
      at: 2.2,
      say: "en français",
      does: "Le doigt touche le lien du profil, ethniafrica.com.",
    },
    {
      id: "i4-browser",
      t: 3.7,
      at: 2.9,
      say: "pour mieux comprendre",
      does: "Le navigateur s'ouvre : ethniafrica.com dans la barre d'adresse, la page se charge.",
    },
    {
      id: "i5-site",
      t: 5.6,
      at: 4.0,
      say: "l'Afrique et ses peuples.",
      does: "La page d'accueil du site : « D'où vient ce nom ? ». La recherche, c'est l'épisode qui la fait.",
    },
  ],
};

export const OUTRO = {
  id: "outro",
  file: "endcard.html",
  duration: 8.0,
  // The operator's closing of 27 October 2026, on screen as in the voice:
  // the invitation first, then the line. Said at 16 characters a second it
  // lasts about 9.8 s, longer than the 8 s card, which holds its last frame
  // (social/video/series.mjs) until the voice ends. The pictures follow this
  // scratch timing; re-timing them on a real voice is step 3b of the README.
  voice:
    "Vous pouvez continuer la recherche sur EthniAfrica et vous abonner pour découvrir de nouvelles publications. EthniAfrica : l'importance de connaître nos noms.",
  shots: [
    {
      id: "o1-invite",
      t: 1.6,
      at: 0.0,
      say: "Vous pouvez continuer la recherche",
      does: "L'invitation, seule, pendant que la voix la commence.",
    },
    {
      id: "o2-search",
      t: 3.3,
      at: 2.15,
      say: "sur EthniAfrica et vous abonner",
      does: "L'invitation monte ; le téléphone revient avec le nom déjà tapé, et le doigt appuie sur Rechercher.",
    },
    {
      id: "o3-result",
      t: 4.9,
      at: 4.1,
      say: "pour découvrir de nouvelles publications.",
      does: "La réponse se construit : « Vous avez cherché… », puis le nom que le peuple se donne.",
    },
    {
      id: "o4-forms",
      t: 6.2,
      at: 6.2,
      say: "(la voix finit l'invitation)",
      does: "Les appellations arrivent une à une, côte à côte.",
    },
    {
      id: "o5-end",
      t: 7.6,
      at: 6.7,
      say: "EthniAfrica : l'importance de connaître nos noms.",
      does: "La phrase du projet arrive sous l'invitation, puis le logo, ethniafrica.com et le repère vers le nom du compte ; la voix finit la phrase sur l'image tenue.",
    },
  ],
};

export const CLIPS = [INTRO, OUTRO];
