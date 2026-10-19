// The storyboard as data: one entry per shot, shared by the compositions,
// the board and the tests. Times are in seconds from the clip's first frame
// at 30 fps. The voice is not in the clips (operator, 19 October 2026): the
// reel's own voice is laid over them, so `say` and `at` are the scratch
// timing to cut against, estimated at 16 characters a second and to be
// re-timed on the reel's real voice track.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// The feed safe zone and button column measured for the series engine
// (social/video/sequence.mjs). Essential text stays inside the first and out
// of the second.
export const SAFE_ZONE = { x: 120, y: 270, w: 840, h: 978 };
export const BUTTON_COLUMN = { x: 780, y: 840, w: 180, h: 408 };

// 12 px read in a 430 px wide feed is 30.14 px in the 1080 px frame.
export const MIN_TEXT_PX = (12 * WIDTH) / 430;

// The site is drawn at the scale of a 430 px phone filling the frame's width:
// its smallest text (13 CSS px) is then read at 13 px in the feed. A window
// inside the 840 px safe zone would read it at 10 px.
export const SITE_SCALE = WIDTH / 430;

export const INTRO = {
  id: "intro",
  file: "ident.html",
  duration: 6.0,
  voice:
    "Avec EthniAfrica, on part des noms qu'on emploie en français pour mieux comprendre l'Afrique et ses peuples.",
  shots: [
    {
      id: "i1-brand",
      t: 0.6,
      say: "Avec EthniAfrica,",
      at: 0.0,
      does: "The logo and the word EthniAfrica settle at the top of the stage.",
    },
    {
      id: "i2-name",
      t: 2.6,
      say: "on part des noms qu'on emploie en français",
      at: 0.95,
      does: "« Peul » rises letter by letter under the label « Le nom employé en français ».",
    },
    {
      id: "i3-forms",
      t: 4.2,
      say: "pour mieux comprendre l'Afrique",
      at: 3.25,
      does: "Peul stays whole; its other names come in beside it, Fulɓe first, none larger than the others.",
    },
    {
      id: "i4-peoples",
      t: 5.6,
      say: "et ses peuples.",
      at: 4.95,
      does: "The view widens: Peul is one name among six, a people, a language, a country, a family, a family name, a place.",
    },
  ],
};

export const OUTRO = {
  id: "outro",
  file: "endcard.html",
  duration: 7.0,
  voice:
    "L'importance de connaître nos noms. Vous pouvez continuer la recherche sur EthniAfrica, lien en profil.",
  shots: [
    {
      id: "o1-line",
      t: 1.2,
      say: "L'importance de connaître nos noms.",
      at: 0.0,
      does: "The project's sentence, alone, in Fraunces, while the voice says it.",
    },
    {
      id: "o2-typing",
      t: 3.3,
      say: "Vous pouvez continuer la recherche",
      at: 2.35,
      does: "The site's search page; the name is typed into the field, letter by letter.",
    },
    {
      id: "o3-result",
      t: 4.3,
      say: "sur EthniAfrica,",
      at: 4.0,
      does: "The answer page opens on the name: where it comes from.",
    },
    {
      id: "o4-history",
      t: 5.3,
      say: "lien en profil.",
      at: 4.95,
      does: "A slow scroll to the name's forms and the history of each, with its sources.",
    },
    {
      id: "o5-end",
      t: 6.5,
      say: "(the voice has ended)",
      at: 6.0,
      does: "The sentence, the invitation, the site pill and the cue towards the profile name hold to the end.",
    },
  ],
};

export const CLIPS = [INTRO, OUTRO];
