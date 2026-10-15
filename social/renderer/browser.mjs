// Runs inside the isolated rendering page; keep this function self-contained.
export function inspectCard() {
  const card = document.querySelector(".ec-card");
  const panel = card.querySelector(".ec-panel");
  const spec = card._spec;
  const normal = (s) =>
    String(s || "")
      .normalize("NFC")
      .replace(/[\u00a0\u202f\s]+/g, " ")
      .trim();
  const collect = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    const value = [...node.childNodes].map(collect).join("");
    return /^(DIV|P|H2|FIGURE|FIGCAPTION|LI|UL|SPAN|text)$/.test(node.nodeName)
      ? " " + value + " "
      : value;
  };
  const text = (node) => normal(collect(node));
  const errors = [];
  for (const img of card.querySelectorAll("img")) {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight)
      errors.push("Image failed to decode");
  }
  if (spec.image) {
    const img = card.querySelector(".ec-photo");
    if (img.naturalWidth !== spec.image.w || img.naturalHeight !== spec.image.h)
      errors.push("Image dimensions differ from input");
  }
  const fonts = [...document.fonts].map((f) => ({
    family: f.family,
    status: f.status,
  }));
  if (!fonts.length || fonts.some((f) => f.status !== "loaded"))
    errors.push("A required font is not loaded");
  const bounds = card.getBoundingClientRect();
  for (const node of card.querySelectorAll(
    ".ec-body,.ec-field-text,.ec-gloss"
  )) {
    if (parseFloat(getComputedStyle(node).fontSize) < 28)
      errors.push("Essential text below 28 px");
  }
  // DOM checks detect clipping, not glyph recognition in the final PNG.
  for (const node of panel.querySelectorAll("*")) {
    if (node.closest("svg") || !node.textContent.trim()) continue;
    if (
      node.scrollWidth > node.clientWidth + 2 &&
      getComputedStyle(node).display !== "inline"
    )
      errors.push("Horizontal text overflow");
  }
  for (const node of card.querySelectorAll(
    ".ec-map text,.ec-callout,.ec-inset,.ec-map-inset"
  )) {
    const rect = node.getBoundingClientRect();
    const ceiling =
      panel.getBoundingClientRect().top - (node.closest(".ec-map") ? 90 : 0);
    if (
      rect.left < bounds.left - 1 ||
      rect.right > bounds.right + 1 ||
      rect.top < bounds.top - 1 ||
      rect.bottom > ceiling + 1
    )
      errors.push(
        "Map label or inset outside its visible window: " + text(node)
      );
  }
  const mapText = [
    ...card.querySelectorAll(
      ".ec-map text,.ec-callout,.ec-inset figcaption,.ec-map-inset span"
    ),
  ]
    .map(text)
    // Atlas markers print bare numbers; the keys and the map description name them.
    .filter((s) => s && !/^\d+$/.test(s));
  // The design system's own words for keys, territories, marks and the period (1.2.0).
  const mapDescription =
    spec.map && window.EthniCards?.altText
      ? window.EthniCards.altText({ map: spec.map, timeline: spec.timeline })
      : "";
  const blocks = [...panel.children].filter(
    (node) => !node.matches(".ec-source,.ec-credit,.ec-sign,.ec-sigline")
  );
  const reading = blocks.map((node) => {
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".ec-folio,svg").forEach((n) => n.remove());
    // Include direct text around accents and labels, preserving field boundaries.
    return text(copy);
  });
  // 1.3.0: a series card's alternative text opens with its band, in the design
  // system's wording (« D'où vient le nom de mon pays ?, n° 1 »).
  const series = spec.series ? window.EthniCards.seriesOf(spec) : null;
  const band = series ? `${series.name}, n° ${series.episode}` : "";
  // 1.6.0: on a closing card the alternative text ends with the signature
  // line, word for word, although the card prints it above the invitation.
  const signature =
    spec.type === "closing" ? window.EthniCards.signatureLine : "";
  const alt =
    spec.alt ||
    [band, spec.imageAlt, mapDescription, ...mapText, ...reading, signature]
      .filter(Boolean)
      .join(". ");
  return {
    fit: card._report,
    errors: [...new Set(errors)],
    fonts,
    visibleText: [text(panel), ...mapText].join(" "),
    alt,
    demo: Boolean(card.querySelector(".ec-demo")),
  };
}
