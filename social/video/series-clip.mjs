// The clip and montage phases of the series video (EthniAfrica Cartes
// 1.15.0-proposition, §1 to §6): the rules a phase made of external footage
// must pass before any frame is drawn. The renderer refuses on `errors` and
// only logs `warnings`, as the spec's validation list says.
//
// The source file's facts come from an injected `probe(src)` so these checks
// stay pure: the caller runs ffprobe once per file and tests pass plain objects.

export const FRAME_SECONDS = 1 / 30;

// Times sit on the 30 fps grid so a cut never falls between two frames.
export const snapToFrame = (seconds) =>
  Math.round(seconds / FRAME_SECONDS) * FRAME_SECONDS;

// Share of a 16:9 source that survives when it fills a taller frame: the
// source is scaled to the frame's height, so the window is the frame's
// aspect over the source's (9/16 ÷ 16/9 = 0.316, 4/5 ÷ 16/9 = 0.45).
const WINDOW_WIDTH = { tiktok: 0.316, instagram: 0.316, facebook: 0.45 };

export function cropWindow(fx, network) {
  const width = WINDOW_WIDTH[network];
  if (width === undefined) throw new Error(`Réseau inconnu : ${network}`);
  const left = Math.min(Math.max(fx - width / 2, 0), 1 - width);
  return { left, width };
}

// Speech in a source is never played before it is transcribed and attributed
// (spec §1): ask for sound without both and the clip falls back to silence.
export function resolveAudio(audio = {}) {
  const mode = audio.mode ?? "off";
  const needsProof = mode !== "off" && audio.speech === true;
  if (needsProof && !(audio.transcript && audio.speaker))
    return {
      mode: "off",
      warning:
        "Son source coupé : la parole doit être transcrite et attribuée (transcript et speaker) avant d'être entendue",
    };
  return { mode, warning: null };
}

const CODECS = new Set(["h264", "hevc", "h265"]);
const MIN_PHASE = 6;
const MIN_SHOT = 2;
const MIN_LAST_SHOT = 2.5;
const MAX_SHOTS = 3;
const onGrid = (t) => Math.abs(t - snapToFrame(t)) < 1e-6;

function checkSource(id, clip, probe, { errors, warnings }, proof) {
  const info = probe(clip.src);
  if (!info) {
    errors.push(`Phase ${id}: Source introuvable : ${clip.src}`);
    return;
  }
  if (!CODECS.has(info.codec))
    errors.push(
      `Phase ${id}: ${clip.src} : le codec doit être H.264 ou H.265 (reçu ${info.codec})`
    );
  if (info.width < 1920 || info.height < 1080) {
    // The frame is 1920 px tall, so a 720p source is magnified by 1920 ÷ 720
    // when it fills it. A proof may show that; a final video may not.
    const magnification = (1920 / info.height).toFixed(1).replace(".", ",");
    const found = `${clip.src} : la source doit faire au moins 1920×1080 (reçu ${info.width}×${info.height})`;
    if (proof)
      warnings.push(
        `Phase ${id}: ${found} ; agrandie ${magnification} fois pour remplir l'image, acceptable pour une preuve, refusée dans un export final`
      );
    else errors.push(`Phase ${id}: ${found}`);
  }
  if (!(clip.in >= 0 && clip.in < clip.out))
    errors.push(
      `Phase ${id}: ${clip.src} : in et out doivent respecter 0 ≤ in < out`
    );
  else if (clip.out > info.duration + 1e-6)
    errors.push(
      `Phase ${id}: ${clip.src} : out (${clip.out} s) dépasse la durée de la source (${info.duration} s)`
    );
}

function checkClipFields(id, clip, errors, warnings) {
  const rights = clip.rights ?? {};
  if (!rights.author)
    errors.push(
      `Phase ${id}: ${clip.src} : rights.author (auteur) est obligatoire`
    );
  if (!rights.licence)
    errors.push(
      `Phase ${id}: ${clip.src} : rights.licence (licence) est obligatoire`
    );
  const crop = clip.crop ?? {};
  for (const axis of ["fx", "fy"])
    if (crop[axis] !== undefined && !(crop[axis] >= 0 && crop[axis] <= 1))
      errors.push(
        `Phase ${id}: ${clip.src} : fx et fy sont compris entre 0 et 1`
      );
  const { warning } = resolveAudio(clip.audio);
  if (warning) warnings.push(`Phase ${id}: ${clip.src} : ${warning}`);
  const overlay = clip.overlay;
  if (overlay?.type === "date" && overlay.present !== true)
    errors.push(
      `Phase ${id}: une date en surimpression est une date du jour (present: true) ; une date historique va sur une carte date`
    );
}

export function checkClipPhase(phase, probe, { proof = false } = {}) {
  const errors = [];
  const warnings = [];
  const id = phase.id;
  const clips = phase.kind === "montage" ? (phase.clips ?? []) : [phase];
  const minHold = phase.minHold ?? MIN_PHASE;

  if (
    phase.kind === "montage" &&
    (clips.length < 2 || clips.length > MAX_SHOTS)
  )
    errors.push(
      clips.length > MAX_SHOTS
        ? `Phase ${id}: un montage compte au plus ${MAX_SHOTS} plans ; un 4e plan ouvre une nouvelle phase`
        : `Phase ${id}: un montage compte 2 ou 3 plans`
    );

  for (const clip of clips) {
    checkSource(id, clip, probe, { errors, warnings }, proof);
    checkClipFields(id, clip, errors, warnings);
    for (const t of [clip.in, clip.out])
      if (!onGrid(t))
        warnings.push(
          `Phase ${id}: ${clip.src} : ${t} s recalé sur la grille de 30 i/s`
        );
  }

  if (phase.kind === "montage") {
    clips.forEach((clip, i) => {
      const length = clip.out - clip.in;
      const last = i === clips.length - 1;
      if (length < MIN_SHOT - 1e-6)
        errors.push(`Phase ${id}: le plan ${i + 1} dure moins de 2 s`);
      else if (last && length < MIN_LAST_SHOT - 1e-6)
        errors.push(`Phase ${id}: le dernier plan dure moins de 2,5 s`);
    });
  }

  const total = clips.reduce((sum, c) => sum + (c.out - c.in), 0);
  if (total < minHold - 1e-6)
    errors.push(
      `Phase ${id}: une phase image dure moins de 6 s (${total.toFixed(1)} s) ; une phase plan seule de moins de 6 s doit devenir un montage`
    );

  return { errors, warnings };
}
