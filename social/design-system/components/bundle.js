/* EthniAfrica Cartes 1.1.0-proposition. Deterministic card builder: one JSON card spec in, one 1080 x 1350 element out.
   No network, no framework. Images are resolved by the caller (opts.resolve). */
(function () {
  'use strict';
  var W = 1080, H = 1350, MARGIN = 72, PANEL_MAX = 900, SCRIM = 300, MAP_SCRIM = 90;
  var VERSION = '1.1.0-proposition';
  var TAGLINE = 'L’Afrique à travers ses noms';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* French typesetting: narrow no-break space before ; : ! ? and inside guillemets.
     *word* marks the single accent word; {area-a:words} colours words like a map area. */
  function fr(s) {
    s = esc(s);
    s = s.replace(/\s+([;:!?»])/g, ' $1').replace(/«\s+/g, '« ');
    s = s.replace(/\{(area-[abc]):([^}]+)\}/g, '<em class="ec-area-word" style="color:var(--$1-ink)">$2</em>');
    return s.replace(/\*([^*]+)\*/g, '<em class="ec-accent">$1</em>');
  }
  function plain(s) { return String(s == null ? '' : s).replace(/\*/g, '').replace(/\{area-[abc]:([^}]+)\}/g, '$1'); }

  var GLYPH = {
    usage: '<circle cx="13" cy="13" r="9" fill="none" stroke="currentColor" stroke-width="3"/>',
    independance: '<path d="M6 22V4M6 5h13l-3 4 3 4H6" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
    adoption: '<rect x="4" y="4" width="18" height="18" fill="currentColor"/>',
    attestation: '<path d="M13 3l10 19H3z" fill="currentColor"/>',
    premiere: '<path d="M13 3l10 19H3z" fill="currentColor"/><path d="M2 24h22" stroke="currentColor" stroke-width="3"/>',
    origine: '<path d="M13 1l12 12-12 12L1 13z" fill="currentColor"/>',
    contexte: '<circle cx="13" cy="13" r="9" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="3 4"/>',
    parallele: '<path d="M8 3v20M18 3v20" stroke="currentColor" stroke-width="4"/>',
    hypothese: '<path d="M13 2l11 11-11 11L2 13z" fill="none" stroke="currentColor" stroke-width="3"/>',
    incertain: '<rect x="3" y="3" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M3 15L15 3M3 23L23 3M11 23L23 11" stroke="currentColor" stroke-width="2.5"/>'
  };
  var STATUS_LABEL = {
    usage: 'Usage actuel', independance: 'Indépendance', adoption: 'Adoption officielle', attestation: 'Attestation datée',
    premiere: 'Plus ancienne attestation repérée', origine: 'Origine la plus ancienne connue', contexte: 'Avant ce nom',
    parallele: 'Usage parallèle', hypothese: 'Hypothèse', incertain: 'Incertain'
  };
  /* Only these kinds draw a mark on the card; the others only name the kicker. */
  var MARKED = { origine: 1, contexte: 1, hypothese: 1, incertain: 1 };
  var BAND = {
    origine: 'Jusqu’ici, les sources remontent à ce point.',
    contexte: 'Ce qui suit est plus ancien que le nom : ce n’est pas l’histoire du mot.'
  };
  function glyph(kind) { return '<svg viewBox="0 0 26 26" aria-hidden="true">' + (GLYPH[kind] || GLYPH.usage) + '</svg>'; }
  function kindOf(st) { return typeof st === 'string' ? st : st && st.kind; }
  function labelOf(st) { return (typeof st === 'object' && st.label) || STATUS_LABEL[kindOf(st)] || ''; }

  function statusMark(st) {
    if (!st) return null;
    return el('div', 'ec-status ec-status--' + kindOf(st), glyph(kindOf(st)) + '<span>' + esc(labelOf(st)) + '</span>');
  }

  /* Recap timeline for the closing card of a dated sequence: today on the left, older on the right. */
  function recap(items) {
    var box = el('div', 'ec-recap');
    var n = items.length;
    box.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';
    items.forEach(function (it, i) {
      var c = el('div', 'ec-recap-step' + (it.kind === 'origine' ? ' is-origin' : ''));
      c.innerHTML = '<span class="ec-recap-date">' + fr(it.date) + '</span>' + glyph(it.kind || 'usage') + '<span class="ec-recap-name">' + fr(it.name) + '</span>';
      box.appendChild(c);
    });
    return box;
  }

  function forms(f) {
    if (f.layout === 'pair') {
      var p = el('div', 'ec-pair');
      p.appendChild(el('div', 'ec-label', esc(f.searchedLabel || 'Vous avez cherché')));
      p.appendChild(el('div', 'ec-pair-name', fr(f.searched)));
      p.appendChild(el('div', 'ec-label', esc(f.selfLabel || 'Nom qu’ils se donnent')));
      p.appendChild(el('div', 'ec-pair-name ec-pair-name--self', fr(f.self)));
      return p;
    }
    var t = el('div', 'ec-forms');
    (f.rows || []).forEach(function (r) {
      t.appendChild(el('div', '', '<span class="ec-term">' + fr(r[0]) + '</span>'));
      t.appendChild(el('div', '', '<span class="ec-gloss">' + fr(r[1]) + '</span>'));
    });
    return t;
  }

  function quote(q) {
    var f = el('figure', 'ec-quote');
    var html = '';
    if (q.original) html += '<q lang="' + esc(q.lang || 'fr') + '">' + esc(q.original) + '</q>';
    if (q.translation) html += '<div class="ec-translation">' + esc(q.translationLabel || 'Traduction') + ' : ' + fr(q.translation) + '</div>';
    if (q.attribution) html += '<figcaption>' + fr(q.attribution) + '</figcaption>';
    f.innerHTML = html;
    return f;
  }

  function body(text, cls) {
    var b = el('div', 'ec-body' + (cls ? ' ' + cls : ''));
    (Array.isArray(text) ? text : [text]).forEach(function (t) { b.appendChild(el('p', '', fr(t))); });
    return b;
  }

  function sign(opts, centered) {
    var s = el('div', 'ec-sign' + (centered ? ' ec-sign--center' : ''));
    var brand = el('div', 'ec-sign-brand');
    if (opts.logo) { var i = new Image(); i.src = opts.logo; i.alt = ''; brand.appendChild(i); }
    var words = el('div', 'ec-sign-words');
    words.appendChild(el('span', 'ec-wordmark', 'EthniAfrica'));
    if (centered) words.appendChild(el('span', 'ec-tagline', esc(TAGLINE)));
    brand.appendChild(words);
    s.appendChild(brand);
    if (!centered) s.appendChild(el('span', 'ec-sign-url', esc(opts.footer || 'ethniafrica.com · @ethniafrica')));
    return s;
  }

  function sourceLines(panel, spec) {
    if (spec.source) panel.appendChild(el('div', 'ec-source', 'Source : ' + fr(spec.source)));
    if (spec.credit) panel.appendChild(el('div', 'ec-credit', fr(spec.credit)));
  }

  /* ---------- map ---------- */
  function hatch(id, tone) {
    return '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)">' +
      '<rect width="18" height="18" fill="var(--' + tone + ')" fill-opacity=".14"/><rect width="6" height="18" fill="var(--' + tone + ')" fill-opacity=".9"/></pattern>';
  }
  function classOf(ch, iso) {
    var v = (ch.values || {})[iso];
    if (v == null) return null;
    for (var i = 0; i < ch.classes.length; i++) {
      var c = ch.classes[i];
      if ((c.min == null || v >= c.min) && (c.max == null || v < c.max)) return c;
    }
    return null;
  }
  function mapSvg(m, uid) {
    var d = m.data, vb = (m.view || (d.meta && d.meta.viewBox ? d.meta.viewBox.split(' ').map(Number) : [0, 0, W, H]));
    var k = W / vb[2], borders = m.borders || 'none';
    var defs = '';
    ['area-a', 'area-b', 'area-c'].forEach(function (t) { defs += hatch(uid + '-' + t, t); });
    var s = '<svg class="ec-map" viewBox="' + vb.join(' ') + '" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>';
    s += '<rect class="ec-m-water" x="' + (vb[0] - 50) + '" y="' + (vb[1] - 50) + '" width="' + (vb[2] + 100) + '" height="' + (vb[3] + 100) + '"/>';
    s += '<path class="ec-m-land" d="' + d.land + '"/>';
    if (m.choropleth) {
      (d.countries || []).forEach(function (c) {
        var cl = classOf(m.choropleth, c.iso);
        if (cl) s += '<path class="ec-m-ch" d="' + c.d + '" fill="var(--' + cl.tone + ')" stroke="var(--map-ink-muted)" style="stroke-width:' + (1.5 / k) + 'px"/>';
      });
    }
    if (m.highlight) {
      var hset = {}; (m.highlight.isos || []).forEach(function (x) { hset[x] = 1; });
      var ht = m.highlight.tone || 'area-a';
      (d.countries || []).forEach(function (c) {
        if (hset[c.iso]) s += '<path class="ec-m-hl" d="' + c.d + '" fill="var(--' + ht + ')" fill-opacity=".55" stroke="var(--' + ht + '-deep)" style="stroke-width:' + (2 / k) + 'px"/>';
      });
    }
    (m.areas || []).forEach(function (a) {
      var tone = a.tone || 'area-a', unc = a.kind === 'uncertain';
      var fill = unc ? 'url(#' + uid + '-' + tone + ')' : 'var(--' + tone + ')';
      (a.paths || []).forEach(function (p) {
        s += '<path class="ec-m-area' + (unc ? ' ec-m-area--uncertain' : '') + '" d="' + p + '" fill="' + fill + '" fill-opacity="' + (unc ? 1 : 0.6) + '" stroke="var(--' + tone + ')" style="stroke-width:' + (4 / k) + 'px;stroke-dasharray:' + (unc ? (14 / k) + ' ' + (10 / k) : 'none') + '"/>';
      });
    });
    (d.lakes || []).forEach(function (l) { s += '<path class="ec-m-lake" d="' + l.d + '"/>'; });
    s += '<path class="ec-m-coast" d="' + d.land + '" style="stroke-width:' + (1.5 / k) + 'px"/>';
    if (borders !== 'none') {
      if (borders === 'strong') s += '<path class="ec-m-border ec-m-border--halo" d="' + d.borders + '" style="stroke-width:' + (10 / k) + 'px"/>';
      s += '<path class="ec-m-border ec-m-border--' + borders + '" d="' + d.borders + '" style="stroke-width:' + ((borders === 'strong' ? 4 : 2.5) / k) + 'px;stroke-dasharray:' + (borders === 'quiet' ? (10 / k) + ' ' + (7 / k) : 'none') + '"/>';
    }
    function txt(cls, x, y, t, anchor, size, fill, halo) {
      return '<text class="' + cls + '" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" style="font-size:' + size / k + 'px;stroke-width:' + 8 / k + 'px' + (fill ? ';fill:' + fill : '') + (halo ? ';stroke:' + halo : '') + '">' + esc(t) + '</text>';
    }
    if (m.countryLabels === 'highlight' && (m.highlight || m.choropleth) && d.labels && d.labels.countries) {
      var keep = m.highlight ? (m.highlight.isos || []) : Object.keys(m.choropleth.values || {});
      d.labels.countries.forEach(function (c) {
        if (keep.indexOf(c.iso) < 0) return;
        var o = (m.labelOffsets || {})[c.iso] || [0, 0];
        var x = c.x + o[0] / k, y = c.y + o[1] / k;
        s += txt('ec-m-lbl-hl', x, y, c.text, 'middle', 24);
        var vt = m.choropleth && m.choropleth.labels && m.choropleth.labels[c.iso];
        if (vt) s += txt('ec-m-lbl-val', x, y + 30 / k, vt, 'middle', 26);
      });
    }
    (m.places || []).forEach(function (p) {
      s += '<circle class="ec-m-dot" cx="' + p.x + '" cy="' + p.y + '" r="' + 9 / k + '" style="stroke-width:' + 4 / k + 'px"/>';
      s += txt('ec-m-lbl-place', p.x + (p.dx == null ? 18 : p.dx) / k, p.y + (p.dy == null ? 10 : p.dy) / k, p.name, p.anchor || 'start', 30);
    });
    (m.labels || []).forEach(function (l) {
      if (l.kind === 'country' && borders === 'none') return;
      var cls = { area: 'ec-m-lbl-area', country: 'ec-m-lbl-country' + (borders === 'strong' ? ' ec-m-lbl-country--strong' : ''), water: 'ec-m-lbl-water' }[l.kind] || 'ec-m-lbl-name';
      var size = { area: 34, country: borders === 'strong' ? 30 : 24, water: 24 }[l.kind] || 40;
      s += txt(cls, l.x, l.y, l.text, l.anchor || 'middle', size, l.tone ? 'var(--' + l.tone + '-deep)' : null, l.kind === 'water' ? 'var(--map-water)' : null);
    });
    s += '</svg>';
    return { svg: s, k: k, vb: vb };
  }
  function legendSwatch(kind, tone) {
    var ground = '<rect width="44" height="30" rx="3" fill="var(--map-land)"/>';
    if (kind === 'border-quiet') return '<svg viewBox="0 0 44 30">' + ground + '<path d="M4 15h36" stroke="var(--map-border-quiet)" stroke-width="3" stroke-dasharray="7 4"/></svg>';
    if (kind === 'border-strong') return '<svg viewBox="0 0 44 30">' + ground + '<path d="M4 15h36" stroke="var(--map-border-strong)" stroke-width="4"/></svg>';
    if (kind === 'place') return '<svg viewBox="0 0 44 30">' + ground + '<circle cx="22" cy="15" r="7" fill="var(--map-ink)"/></svg>';
    if (kind === 'uncertain') return '<svg viewBox="0 0 44 30"><defs><pattern id="lg-' + tone + '" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)"><rect width="9" height="9" fill="var(--' + tone + ')" fill-opacity=".14"/><rect width="3.5" height="9" fill="var(--' + tone + ')" fill-opacity=".9"/></pattern></defs>' + ground + '<rect x="3" y="3" width="38" height="24" fill="url(#lg-' + tone + ')" stroke="var(--' + tone + ')" stroke-width="2.5" stroke-dasharray="6 4"/></svg>';
    return '<svg viewBox="0 0 44 30">' + ground + '<rect x="3" y="3" width="38" height="24" fill="var(--' + tone + ')" fill-opacity=".6" stroke="var(--' + tone + ')" stroke-width="2.5"/></svg>';
  }
  function legend(m) {
    if (m.choropleth) {
      var sc = el('div', 'ec-scale');
      if (m.choropleth.legendTitle) sc.appendChild(el('div', 'ec-scale-title', fr(m.choropleth.legendTitle)));
      var row = el('div', 'ec-scale-row');
      m.choropleth.classes.forEach(function (c) {
        row.appendChild(el('div', 'ec-scale-step', '<span class="ec-scale-swatch" style="background:var(--' + c.tone + ')"></span><span class="ec-scale-label">' + fr(c.label) + '</span>'));
      });
      sc.appendChild(row);
      return sc;
    }
    var items = (m.legend || []).slice();
    if (!m.legend) {
      var seen = {};
      (m.areas || []).forEach(function (a) {
        var key = (a.legend || a.label) + a.kind;
        if (seen[key]) return; seen[key] = 1;
        items.push({ kind: a.kind === 'uncertain' ? 'uncertain' : 'area', tone: a.tone || 'area-a', text: a.legend || a.label });
      });
      if (m.highlight && m.highlight.legend) items.unshift({ kind: 'area', tone: m.highlight.tone || 'area-a', text: m.highlight.legend });
      if (m.borders === 'quiet') items.push({ kind: 'border-quiet', text: 'Frontières actuelles' });
      if (m.borders === 'strong') items.push({ kind: 'border-strong', text: 'Frontières actuelles' });
    }
    if (!items.length) return null;
    var lg = el('div', 'ec-legend');
    items.forEach(function (it) { lg.appendChild(el('span', 'ec-legend-item', legendSwatch(it.kind, it.tone || 'area-a') + '<span>' + fr(it.text) + '</span>')); });
    return lg;
  }
  function mapCaption(c) {
    var box = el('p', 'ec-mapcap');
    box.innerHTML = [['Carte', c.what], ['Période', c.when], ['Source', c.source]].map(function (r) {
      return '<span><b>' + esc(r[0]) + ' :</b> ' + fr(r[1] || 'à indiquer') + '</span>';
    }).join('<span class="ec-mapcap-sep"> · </span>');
    return box;
  }

  /* ---------- card ---------- */
  function render(spec, opts) {
    opts = opts || {};
    var resolve = opts.resolve || function (x) { return x; };
    var type = spec.type || 'explanation';
    var card = el('article', 'ec-card ec-card--' + type);
    card.setAttribute('data-theme', spec.theme || opts.theme || 'nuit');
    card.setAttribute('lang', 'fr');
    if (spec.density === 'dense') card.classList.add('ec-dense');
    if (opts.diagnose) card.classList.add('ec-diagnose');
    card._spec = spec;

    var media = el('div', 'ec-media');
    card.appendChild(media);
    if (spec.map && spec.map.data) {
      var ms = mapSvg(spec.map, 'm' + Math.abs(hash(String(spec.id || spec.title || ''))));
      media.innerHTML = ms.svg;
      card._map = ms;
    } else if (spec.image) {
      var img = new Image();
      img.className = 'ec-photo'; img.alt = ''; img.decoding = 'sync';
      img.src = resolve(spec.image.src);
      media.appendChild(img);
      card._img = img;
    }
    (spec.insets || []).forEach(function (s) {
      var f = el('figure', 'ec-inset');
      f.style.left = s.x + 'px'; f.style.top = s.y + 'px'; f.style.width = s.width + 'px'; f.style.margin = '0';
      var i = new Image(); i.src = resolve(s.src); i.alt = '';
      f.appendChild(i);
      if (s.label) f.appendChild(el('figcaption', '', fr(s.label)));
      card.appendChild(f);
    });
    if (spec.map && spec.map.inset && spec.map.data && spec.map.data.inset) {
      var ins = spec.map.data.inset, io = spec.map.inset, iw = io.width || 170, ik = iw / ins.w;
      var box = el('div', 'ec-map-inset');
      box.style.left = (io.x == null ? W - MARGIN - iw - 20 : io.x) + 'px'; box.style.top = (io.y == null ? 48 : io.y) + 'px';
      box.innerHTML = '<svg width="' + iw + '" height="' + Math.round(ins.h * ik) + '" viewBox="0 0 ' + ins.w + ' ' + ins.h + '"><path d="' + ins.d + '" class="ec-inset-land"/><rect class="ec-inset-frame" x="' + ins.frame[0] + '" y="' + ins.frame[1] + '" width="' + ins.frame[2] + '" height="' + ins.frame[3] + '"/></svg>' + (io.label ? '<span>' + fr(io.label) + '</span>' : '');
      card.appendChild(box);
    }
    if (spec.map && spec.map.callout) {
      var co = spec.map.callout, cb = el('div', 'ec-callout');
      cb.style.left = co.x + 'px'; cb.style.top = co.y + 'px'; cb.style.width = co.width + 'px';
      if (co.fontSize) cb.style.setProperty('--callout-size', co.fontSize + 'px');
      var hl = (co.title ? '<div class="ec-callout-title">' + fr(co.title) + '</div>' : '') + '<ul style="column-count:' + (co.columns || 2) + '">';
      (co.items || []).forEach(function (it) {
        if (typeof it === 'string') { hl += '<li>' + fr(it) + '</li>'; return; }
        var tone = it.tone || (spec.map.choropleth && classOf(spec.map.choropleth, it.iso) || {}).tone;
        hl += '<li' + (tone ? ' style="--sw:var(--' + tone + ')"' : '') + '><span class="ec-callout-name">' + fr(it.name) + '</span>' + (it.value ? '<b>' + fr(it.value) + '</b>' : '') + '</li>';
      });
      cb.innerHTML = hl + '</ul>';
      card.appendChild(cb);
      card._callout = cb;
    }
    var scrim = el('div', 'ec-scrim' + (card._map ? ' ec-scrim--map' : (spec.veil === 'strong' ? ' ec-scrim--strong' : '')));
    card.appendChild(scrim);

    var p = el('div', 'ec-panel' + (type === 'closing' ? ' ec-panel--center' : ''));
    var st = spec.status || (spec.date && spec.date.marker);
    var kicker = spec.kicker || (spec.date && st && !MARKED[kindOf(st)] ? labelOf(st) : '');
    if (kicker || spec.folio) {
      var head = el('div', 'ec-head');
      head.appendChild(el('span', 'ec-kicker', fr(kicker || '')));
      if (spec.folio) head.appendChild(el('span', 'ec-folio', esc(spec.folio)));
      p.appendChild(head);
    }
    if (st && (MARKED[kindOf(st)] || !spec.date)) {
      var srow = el('div', 'ec-status-row');
      srow.appendChild(statusMark(st));
      if (BAND[kindOf(st)] && !(typeof st === 'object' && st.band === false)) srow.appendChild(el('div', 'ec-band ec-band--' + kindOf(st), fr((typeof st === 'object' && st.band) || BAND[kindOf(st)])));
      p.appendChild(srow);
    }
    if (spec.date) {
      var dk = spec.date.kind || 'year';
      var dcls = 'ec-date' + (dk === 'unknown' ? ' ec-date--unknown' : (plain(spec.date.display).length > 6 ? ' ec-date--long' : ''));
      p.appendChild(el('div', dcls, fr(spec.date.display)));
    }
    if (spec.recap) p.appendChild(recap(spec.recap));
    if (spec.title) p.appendChild(el('h2', 'ec-title' + (type === 'opener' ? ' ec-title--xl' : (type === 'map' ? ' ec-title--m' : '')), fr(spec.title)));
    if (spec.date && spec.date.branches) {
      var br = el('div', 'ec-branches');
      spec.date.branches.forEach(function (b, i) {
        var c = el('div', 'ec-branch ec-branch--' + (i === 0 ? 'a' : 'b'));
        c.appendChild(el('div', 'ec-label', esc(b.label || 'Nom employé')));
        c.appendChild(el('div', 'ec-field-name', fr(b.name)));
        if (b.designated) c.appendChild(el('div', 'ec-field-text', fr(b.designated)));
        if (b.usedBy) c.appendChild(el('div', 'ec-field-text ec-field-text--muted', fr(b.usedBy)));
        br.appendChild(c);
      });
      p.appendChild(br);
    } else if (spec.date) {
      if (spec.date.name) {
        var nm = el('div', 'ec-field');
        nm.appendChild(el('div', 'ec-label', 'Nom employé'));
        nm.appendChild(el('div', 'ec-field-name', fr(spec.date.name)));
        p.appendChild(nm);
      }
      var cols = el('div', 'ec-field-cols');
      if (spec.date.designated) { var a = el('div', 'ec-field'); a.appendChild(el('div', 'ec-label', 'Ce qu’il désigne')); a.appendChild(el('div', 'ec-field-text', fr(spec.date.designated))); cols.appendChild(a); }
      if (spec.date.usedBy) { var b2 = el('div', 'ec-field'); b2.appendChild(el('div', 'ec-label', spec.date.usedByLabel ? esc(spec.date.usedByLabel) : 'Qui l’emploie')); b2.appendChild(el('div', 'ec-field-text', fr(spec.date.usedBy))); cols.appendChild(b2); }
      if (cols.children.length) p.appendChild(cols);
    }
    if (spec.map) { var lg = legend(spec.map); if (lg) p.appendChild(lg); }
    if (spec.body) p.appendChild(body(spec.body, type === 'closing' ? 'ec-body--center' : (spec.date || spec.map ? 'ec-body--after' : '')));
    if (spec.forms) { var fm = forms(spec.forms); fm.classList.add('ec-block'); p.appendChild(fm); }
    if (spec.note) { var nb = body(spec.note); nb.classList.add('ec-block'); p.appendChild(nb); }
    if (spec.quote) { var q = quote(spec.quote); q.classList.add('ec-block'); p.appendChild(q); }
    if (spec.map && spec.map.caption) p.appendChild(mapCaption(spec.map.caption));
    if (spec.cue) p.appendChild(el('div', 'ec-cue', esc(spec.cue) + ' ›››'));
    if (spec.cta) {
      var cta = el('div', 'ec-cta');
      cta.appendChild(el('span', 'ec-cta-pill', esc(spec.cta.domain || 'ethniafrica.com')));
      p.appendChild(cta);
    }
    sourceLines(p, spec);
    p.appendChild(sign({ logo: opts.logo ? resolve(opts.logo) : null, footer: spec.footer }, type === 'closing'));
    card.appendChild(p);
    card._panel = p; card._scrim = scrim;

    if (spec.demo && opts.demo !== false) card.appendChild(el('div', 'ec-demo', esc(spec.demo)));
    return card;
  }

  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return h; }

  /* Place a photo so that it covers the whole card and its focal point lands on the anchor of the image window. */
  function placeImage(card, panelTop) {
    var spec = card._spec.image, img = card._img;
    if (!spec || !img) return null;
    var w = spec.w || img.naturalWidth, h = spec.h || img.naturalHeight;
    var s = Math.max(W / w, H / h) * (spec.zoom || 1);
    var f = spec.focus || [0.5, 0.5], a = spec.anchor || [0.5, 0.5];
    var tx = a[0] * W - f[0] * w * s, ty = a[1] * panelTop - f[1] * h * s;
    tx = Math.min(0, Math.max(W - w * s, tx));
    ty = Math.min(0, Math.max(H - h * s, ty));
    img.style.width = (w * s) + 'px'; img.style.height = (h * s) + 'px';
    img.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
    var fy = f[1] * h * s + ty, fx = f[0] * w * s + tx;
    return { scale: s, focus: [Math.round(fx), Math.round(fy)], focusInWindow: fy < panelTop - 40 };
  }

  /* Measure, then place the panel, veil and media. Returns the fit report used by acceptance checks. */
  function layout(card) {
    var spec = card._spec, p = card._panel, sc = card._scale || 1;
    var report = { id: spec.id || null, type: spec.type, theme: card.getAttribute('data-theme'), warnings: [] };
    function measure() { return Math.ceil(p.getBoundingClientRect().height / sc); }
    var title = p.querySelector('.ec-title');
    if (title && spec.type !== 'closing' && !title.classList.contains('ec-title--xl') && !title.classList.contains('ec-title--m')) {
      var lh = parseFloat(getComputedStyle(title).lineHeight);
      if (Math.round(title.getBoundingClientRect().height / sc / lh) > 2) { title.classList.add('ec-title--m'); report.titleStep = 'm'; }
    }
    if (title && Math.round(title.getBoundingClientRect().height / sc / parseFloat(getComputedStyle(title).lineHeight)) > 3) report.warnings.push('Titre sur plus de trois lignes : le raccourcir.');
    var hgt = measure();
    if (hgt > PANEL_MAX && spec.density !== 'dense' && spec.density !== 'normal') {
      card.classList.add('ec-dense'); report.autoDense = true; hgt = measure();
    }
    report.dense = card.classList.contains('ec-dense');
    report.panelHeight = hgt;
    var top = H - hgt;
    report.panelTop = top;
    report.overflow = hgt > PANEL_MAX;
    if (report.overflow) { report.warnings.push('Panneau de ' + hgt + ' px (maximum ' + PANEL_MAX + ') : couper la carte en deux ou raccourcir.'); card.classList.add('ec-overflow'); }
    if (spec.type === 'map' && spec.body) report.warnings.push('Carte géographique avec texte courant : la carte, le titre et la légende doivent suffire.');
    var scrimH = card._map ? MAP_SCRIM : SCRIM;
    card._scrim.style.top = Math.max(0, top - scrimH) + 'px';
    var pl = placeImage(card, top);
    if (pl) { report.image = pl; if (!pl.focusInWindow) report.warnings.push('Le point focal de l’image tombe sous le texte : déplacer focus ou anchor.'); }
    if (card._map) {
      var m = spec.map, k = card._map.k, vb = card._map.vb, low = [];
      (m.places || []).concat(m.labels || []).forEach(function (l) {
        if (l.kind === 'country' && (m.borders || 'none') === 'none') return;
        if ((l.y - vb[1]) * k > top - MAP_SCRIM) low.push(l.text || l.name);
      });
      if (low.length) report.warnings.push('Étiquettes de carte sous le panneau : ' + low.join(', ') + '. Recadrer (map.view).');
    }
    if (card._callout) {
      var cbot = parseFloat(card._callout.style.top) + card._callout.getBoundingClientRect().height / sc;
      if (cbot > top - MAP_SCRIM) report.warnings.push('L\u2019encadré de la carte chevauche le panneau : le remonter ou raccourcir la liste.');
    }
    Array.prototype.forEach.call(card.querySelectorAll('.ec-inset'), function (f) {
      var b = parseFloat(f.style.top) + f.getBoundingClientRect().height / sc;
      if (b > top - 16) report.warnings.push('Un agrandissement chevauche le panneau.');
    });
    if (card.classList.contains('ec-diagnose')) {
      var g = el('div', 'ec-guide'); g.style.top = (H - PANEL_MAX) + 'px'; card.appendChild(g);
    }
    report.ok = !report.overflow && report.warnings.length === 0;
    card._report = report;
    return report;
  }

  function whenReady(card) {
    var imgs = Array.prototype.slice.call(card.querySelectorAll('img'));
    var waits = imgs.map(function (i) { return i.complete ? Promise.resolve() : new Promise(function (r) { i.onload = i.onerror = function () { r(); }; }); });
    var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return Promise.all(waits.concat([fonts]));
  }

  /* Mount a card into a container at a given on-screen width (430 = phone feed). */
  function mount(container, spec, opts) {
    opts = opts || {};
    var width = opts.width || W, scale = width / W;
    var frame = el('div', 'ec-frame');
    frame.style.width = width + 'px'; frame.style.height = (H * scale) + 'px';
    var card = render(spec, opts);
    card.style.transform = scale === 1 ? '' : 'scale(' + scale + ')';
    card._scale = scale;
    frame.appendChild(card);
    container.appendChild(frame);
    return whenReady(card).then(function () { var r = layout(card); if (opts.onReport) opts.onReport(r, card); return { card: card, frame: frame, report: r }; });
  }

  /* Compile tokens.json into CSS custom properties and @font-face, for pages and renderers without tokens.css. */
  function tokensToCss(t, base) {
    base = base || '';
    var themes = t.color.themes.map(function (x) { return x.id; }), first = themes[0];
    var blocks = {};
    themes.forEach(function (id) { blocks[id] = []; });
    t.color.tokens.forEach(function (tok) {
      themes.forEach(function (id) {
        var v = typeof tok.value === 'string' ? tok.value : (tok.value[id] || tok.value[first]);
        if (/^\{.+\}$/.test(v)) v = 'var(--' + v.slice(1, -1) + ')';
        blocks[id].push('--' + tok.name + ':' + v);
      });
    });
    var css = ':root,[data-theme="' + first + '"]{' + blocks[first].join(';') + '}\n';
    themes.slice(1).forEach(function (id) { css += '[data-theme="' + id + '"]{' + blocks[id].join(';') + '}\n'; });
    var root = [];
    ['spacing', 'radius', 'size'].forEach(function (fam) { (t[fam] && t[fam].tokens || []).forEach(function (x) { root.push('--' + x.name + ':' + (typeof x.value === 'number' ? x.value + 'px' : x.value)); }); });
    Object.keys(t.type.families).forEach(function (k) { root.push('--font-' + k + ':' + t.type.families[k]); });
    css += ':root{' + root.join(';') + '}\n';
    t.type.fonts.forEach(function (f) {
      css += '@font-face{font-family:"' + f.family + '";src:url("' + base + f.file + '");font-weight:' + f.weight + ';font-style:' + (f.style || 'normal') + ';font-display:block}\n';
    });
    return css;
  }
  function installTokens(t, base) {
    var s = document.getElementById('ec-tokens') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'ec-tokens' }));
    s.textContent = tokensToCss(t, base);
    var loads = t.type.fonts.map(function (f) { return document.fonts ? document.fonts.load((f.weight.split(' ')[0]) + ' 40px "' + f.family + '"', 'Aɓɛɔŋ') : null; });
    return Promise.all(loads);
  }

  /* Alternative text for an export: description of the image, then every word printed on the card, in reading order. */
  function altText(spec) {
    if (spec.alt) return spec.alt;
    var parts = [];
    if (spec.imageAlt) parts.push(spec.imageAlt);
    ['kicker', 'title'].forEach(function (k) { if (spec[k]) parts.push(plain(spec[k])); });
    if (spec.date) {
      parts.push(plain(spec.date.display));
      if (spec.date.name) parts.push('Nom employé : ' + plain(spec.date.name));
      if (spec.date.designated) parts.push('Ce qu’il désigne : ' + plain(spec.date.designated));
      if (spec.date.usedBy) parts.push('Qui l’emploie : ' + plain(spec.date.usedBy));
      (spec.date.branches || []).forEach(function (b) { parts.push(plain(b.label) + ' : ' + plain(b.name) + ', ' + plain(b.designated || '')); });
    }
    if (spec.map && spec.map.areas) parts.push('Légende : ' + spec.map.areas.map(function (a) { return plain(a.legend || a.label); }).join(', '));
    if (spec.body) parts.push(plain([].concat(spec.body).join(' ')));
    if (spec.forms && spec.forms.rows) parts.push(spec.forms.rows.map(function (r) { return plain(r[0]) + ', ' + plain(r[1]); }).join(' ; '));
    if (spec.forms && spec.forms.layout === 'pair') parts.push(plain(spec.forms.searchedLabel) + ' ' + plain(spec.forms.searched) + '. ' + plain(spec.forms.selfLabel) + ' ' + plain(spec.forms.self));
    if (spec.note) parts.push(plain(spec.note));
    if (spec.recap) parts.push(spec.recap.map(function (r) { return plain(r.date) + ' : ' + plain(r.name); }).join(' ; '));
    if (spec.cta) parts.push(plain(spec.cta.domain || 'ethniafrica.com'));
    return parts.join('. ').replace(/\.\s*\./g, '.');
  }

  window.EthniCards = {
    version: VERSION, W: W, H: H, PANEL_MAX: PANEL_MAX,
    render: render, layout: layout, mount: mount,
    tokensToCss: tokensToCss, installTokens: installTokens, altText: altText,
    statusLabels: STATUS_LABEL, statusMark: statusMark, recap: recap
  };
})();
