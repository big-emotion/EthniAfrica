/* EthniAfrica Cartes 1.3.0-proposition: series band prototype.
   EthniSeriesBand.apply(card, { name, episode }) adds the band to a card
   already mounted by EthniCards.mount and returns its geometry in export
   pixels, plus every map element the band would hide. */
(function () {
  var LINE = 34;

  function frenchSpacing(s) {
    return String(s).replace(/\s+([;:!?»])/g, " $1");
  }

  function span(cls, text) {
    var el = document.createElement("span");
    el.className = cls;
    el.textContent = text;
    return el;
  }

  function apply(card, band) {
    var scale = card._scale || 1;
    var root = document.createElement("div");
    root.className = "ec-series";
    var text = document.createElement("div");
    text.className = "ec-series-text";
    text.appendChild(span("ec-series-name", frenchSpacing(band.name)));
    text.appendChild(span("ec-series-sep", " · "));
    text.appendChild(span("ec-series-episode", "n° " + band.episode));
    root.appendChild(text);
    card.classList.add("ec-has-series");
    card.insertBefore(root, card.firstChild);

    var cardBox = card.getBoundingClientRect();
    function box(el) {
      var r = el.getBoundingClientRect();
      return {
        top: (r.top - cardBox.top) / scale,
        bottom: (r.bottom - cardBox.top) / scale,
        left: (r.left - cardBox.left) / scale,
        right: (r.right - cardBox.left) / scale,
      };
    }
    var bandBox = box(root);
    var textBox = box(text);
    var hidden = [];
    var under = card.querySelectorAll(
      ".ec-map text, .ec-key, .ec-callout, .ec-map-inset, .ec-inset"
    );
    Array.prototype.forEach.call(under, function (el) {
      var b = box(el);
      if (b.bottom > b.top && b.top < bandBox.bottom + 12)
        hidden.push(el.textContent.trim() || el.className);
    });
    return {
      top: bandBox.top,
      bottom: bandBox.bottom,
      height: bandBox.bottom - bandBox.top,
      right: textBox.right,
      lines: Math.round((textBox.bottom - textBox.top) / LINE),
      hidden: hidden,
    };
  }

  window.EthniSeriesBand = { apply: apply, frenchSpacing: frenchSpacing };
})();
