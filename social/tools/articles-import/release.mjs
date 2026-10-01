/**
 * Picking the files that went out from a published folder.
 *
 * A published folder also keeps what did not go out: replaced renders, proofs,
 * the LinkedIn square nobody posted. The library marks those with a leading
 * underscore, so they are never candidates. What remains must name exactly one
 * release per format; when it names two, the choice belongs to the operator,
 * and guessing the newer file is how a corrected post gets silently swapped.
 */

const CAROUSEL_SLIDE = /_(\d{2})_[a-z]+_1080x1350\.png$/;
const ALTERNATE_CUT = /_\d+x\d+\.mp4$/;

function isCandidate(rel) {
  return !rel
    .split("/")
    .some((part) => part.startsWith("_") || part.startsWith("."));
}

/**
 * `files` are paths relative to the folder; `post` is the ledger record, of
 * which only `selected` is read. Returns the chosen files and every reason the
 * folder does not resolve to one release.
 */
export function selectRelease(files, post) {
  const problems = [];
  const candidates = files.filter(isCandidate).sort();

  const slideDirs = new Map();
  for (const rel of candidates) {
    const [top, ...rest] = rel.split("/");
    if (rest.length !== 1 || !top.startsWith("TikTok-Instagram")) continue;
    if (!CAROUSEL_SLIDE.test(rel)) continue;
    if (!slideDirs.has(top)) slideDirs.set(top, []);
    slideDirs.get(top).push(rel);
  }
  let slides = [];
  if (slideDirs.size > 1) {
    problems.push(`ambiguous carousel: ${[...slideDirs.keys()].join(", ")}`);
  } else if (slideDirs.size === 1) {
    slides = [...slideDirs.values()][0].sort(
      (a, b) =>
        Number(a.match(CAROUSEL_SLIDE)[1]) - Number(b.match(CAROUSEL_SLIDE)[1])
    );
    slides.forEach((rel, i) => {
      const expected = String(i + 1).padStart(2, "0");
      if (rel.match(CAROUSEL_SLIDE)[1] !== expected) {
        problems.push(`slide ${expected} missing or duplicated`);
      }
    });
  }

  const cuts = candidates.filter(
    (rel) =>
      rel.startsWith("video/") &&
      rel.endsWith(".mp4") &&
      !ALTERNATE_CUT.test(rel)
  );
  let video = null;
  if (cuts.length === 1) video = cuts[0];
  else if (cuts.length > 1) {
    const named = post.selected
      ? cuts.find((rel) => rel === `video/${post.selected}`)
      : null;
    if (named) video = named;
    else
      problems.push(`ambiguous video: ${cuts.join(", ")} and no selected cut`);
  }

  let poster = null;
  if (video || cuts.length) {
    if (candidates.includes("video/thumbnail.png"))
      poster = "video/thumbnail.png";
    else {
      const covers = candidates.filter((rel) =>
        /^images\/[^/]+_1080x1920\.png$/.test(rel)
      );
      if (covers.length === 1) poster = covers[0];
    }
  }

  if (!video && cuts.length === 0 && slides.length === 0) {
    problems.push("no media in the published folder");
  }
  return { video, poster, slides, problems };
}
