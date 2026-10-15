/* EthniAfrica Cartes 1.3.0-proposition. Deterministic card builder: one JSON card spec in, one 1080 x 1350 element out.
   No network, no framework. Images are resolved by the caller (opts.resolve). */
(function () {
  'use strict';
  var W = 1080, H = 1350, MARGIN = 72, PANEL_MAX = 900, SCRIM = 300, MAP_SCRIM = 90;
  /* 1.3.0: the series band. 72 px at the top of a series card (70 px of band and its 2 px rule); the image window
     starts under it and keeps its 450 px, so a series card's panel stops at 828 px. */
  var BAND_H = 72, BAND_CLEAR = 12, PANEL_MAX_SERIES = PANEL_MAX - BAND_H;
  var SERIES = {
    'pays': "D'où vient le nom de mon pays ?",
    'nom-recu': "Le nom qu'on leur a donné",
    'nom-famille': 'Mon nom, mon histoire',
    'mots': "Les mots qu'on nous a collés",
    'frontieres': 'Un peuple, plusieurs pays',
    'afrique-tout': "L'Afrique n'est pas un tout",
    'villes': 'Ce que les villes racontent'
  };
  function seriesOf(spec) {
    var s = spec && spec.series;
    if (!s) return null;
    var name = s.name || SERIES[s.id];
    if (!name) throw new Error('Série inconnue : ' + s.id);
    return { name: name, episode: s.episode };
  }
  function seriesBand(sr) {
    var band = el('div', 'ec-series');
    band.innerHTML = '<div class="ec-series-text"><span class="ec-series-name">' + fr(sr.name) + '</span><span class="ec-series-sep"> · </span><span class="ec-series-episode">n° ' + esc(String(sr.episode)) + '</span></div>';
    return band;
  }
  var VERSION = '1.6.0-proposition';
  /* 1.6.0: the project's signature line, one constant, never a card field.
     Three lines, broken after each comma; « nous-mêmes » keeps the ordinary
     hyphen U+002D inside a no-wrap line (none of the three faces draws U+2011). */
  var SIGNATURE_LINE = ['Connaître nos noms,', 'décoloniser leur emploi,', 'nous nommer nous-mêmes.'];
  var SIGNATURE_TEXT = SIGNATURE_LINE.join(' ');
  var SIGLINE_Y = 760; /* top of the line's first line box on every closing card */
  function sigLine() {
    var d = el('div', 'ec-sigline');
    d.setAttribute('lang', 'fr');
    SIGNATURE_LINE.forEach(function (t) { d.appendChild(el('span', '', esc(t))); });
    return d;
  }

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
  /* ---------- atlas (1.2.0): numbered points, regional keys, three point styles ---------- */
  var REGIONS = ['nord', 'ouest', 'centre', 'est', 'sud'];
  var REGION_LABEL = { nord: 'Nord', ouest: 'Ouest', centre: 'Centre', est: 'Est', sud: 'Sud' };
  var MARK_D = 38, MARK_GAP = 44, LEADER_MAX = 72, INLINE_MAX = 12;
  var KIND_LABEL = { state: 'État', society: 'Société sans roi', site: 'Site ou culture archéologique' };
  function shapeSvg(kind, cx, cy, size, extra) {
    var r = size / 2, cls = 'ec-at-mark ec-at-mark--' + (kind || 'state');
    if (kind === 'society') return '<rect class="' + cls + '" x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + size + '" height="' + size + '" rx="' + size * 0.22 + '"' + (extra || '') + '/>';
    if (kind === 'site') { var q = r * 1.18; return '<path class="' + cls + '" d="M' + cx + ',' + (cy - q) + 'L' + (cx + q) + ',' + cy + 'L' + cx + ',' + (cy + q) + 'L' + (cx - q) + ',' + cy + 'Z"' + (extra || '') + '/>'; }
    return '<circle class="' + cls + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + (extra || '') + '/>';
  }
  function approxWidth(t, size) { return String(t).length * size * 0.56; }
  function rectsHit(a, b, pad) { pad = pad || 0; return a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad; }
  function circleRectHit(c, r, b) { var nx = Math.max(b.x, Math.min(c[0], b.x + b.w)), ny = Math.max(b.y, Math.min(c[1], b.y + b.h)); var dx = c[0] - nx, dy = c[1] - ny; return dx * dx + dy * dy < r * r; }

  /* Approximate zones (1.2.0, revised): a schematic shape around the entry, never traced from a map, clipped to land. */
  var ZONE_TONE = { state: 'area-a', society: 'area-b', site: 'area-c' };
  var ZONE_LABEL = 26, ZONE_PAD = 0;
  function ringsOf(path) {
    var rings = [], cur = null;
    String(path || '').replace(/([MLZ])([^MLZ]*)/g, function (_, c, a) {
      if (c === 'M') { cur = []; rings.push(cur); }
      if (c === 'Z' || !cur) return '';
      var n = a.trim().split(/[\s,]+/).map(Number);
      for (var i = 0; i + 1 < n.length; i += 2) cur.push([n[i], n[i + 1]]);
      return '';
    });
    return rings;
  }
  function inRings(rings, x, y) { /* nonzero winding, as SVG fills by default */
    var wn = 0;
    for (var r = 0; r < rings.length; r++) {
      var R = rings[r];
      for (var i = 0, j = R.length - 1; i < R.length; j = i++) {
        var a = R[j], b = R[i];
        if (a[1] <= y) { if (b[1] > y && (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]) > 0) wn++; }
        else if (b[1] <= y && (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]) < 0) wn--;
      }
    }
    return wn !== 0;
  }
  function smoothClosed(p, steps) {
    var out = [], n = p.length;
    for (var i = 0; i < n; i++) {
      var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      for (var s = 0; s < steps; s++) {
        var t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    return out;
  }
  /* Zone outline in map coordinates: zone.points (smoothed), or an ellipse {cx, cy, rx, ry, rot}. */
  function zonePoly(e) {
    var z = e.zone;
    if (z.points) return smoothClosed(z.points, 8);
    var cx = z.cx != null ? z.cx : e.x, cy = z.cy != null ? z.cy : e.y, rx = z.rx, ry = z.ry || z.rx, a = (z.rot || 0) * Math.PI / 180, pts = [];
    /* a deterministic wobble (seeded by the name) keeps the shape from reading as a drawn oval or a border */
    var seed = 0; String(e.name).split('').forEach(function (ch) { seed = (seed * 31 + ch.charCodeAt(0)) % 9973; });
    var f1 = seed % 628 / 100, f2 = seed % 377 / 60, wob = z.wobble != null ? z.wobble : 0.08;
    for (var i = 0; i < 72; i++) {
      var t = i / 72 * 2 * Math.PI, rr = 1 + wob * Math.sin(3 * t + f1) + wob * 0.6 * Math.sin(5 * t + f2), px = rx * rr * Math.cos(t), py = ry * rr * Math.sin(t);
      pts.push([cx + px * Math.cos(a) - py * Math.sin(a), cy + px * Math.sin(a) + py * Math.cos(a)]);
    }
    return pts;
  }
  function polyD(p) { return 'M' + p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('L') + 'Z'; }

  /* Pure layout in card pixels: zones, names written on the map, numbers, and where each marker sits. */
  function atlasLayout(m, k, vb, d, topMin) {
    topMin = topMin || 8; /* under a series band, nothing is written within 12 px of it */
    var A = m.atlas;
    if (d && d.africa && !d._africaRings) d._africaRings = ringsOf(d.africa);
    var land = d && d._africaRings;
    function toCard(q) { return [(q[0] - vb[0]) * k, (q[1] - vb[1]) * k]; }
    var entries = (A.entries || []).map(function (e, i) {
      var o = { i: i, e: e, region: e.region || 'ouest', kind: e.kind || 'state', px: (e.x - vb[0]) * k, py: (e.y - vb[1]) * k };
      if (e.zone) {
        o.poly = zonePoly(e);
        o.cpoly = [o.poly.map(toCard)];
        var xs = o.cpoly[0].map(function (q) { return q[0]; }), ys = o.cpoly[0].map(function (q) { return q[1]; });
        o.zb = { x: Math.min.apply(null, xs), y: Math.min.apply(null, ys) };
        o.zb.w = Math.max.apply(null, xs) - o.zb.x; o.zb.h = Math.max.apply(null, ys) - o.zb.y;
        o.area = o.zb.w * o.zb.h;
      }
      return o;
    });
    function onLand(x, y) { return !land || inRings(land, x / k + vb[0], y / k + vb[1]); }
    function inZone(o, x, y) { return inRings(o.cpoly, x, y) && onLand(x, y); }
    /* the zone's pole: its centre if on land, else the point of the zone on land nearest to the centre */
    entries.forEach(function (o) {
      if (!o.poly) return;
      var z = o.e.zone, c = toCard([z.cx != null ? z.cx : o.e.x, z.cy != null ? z.cy : o.e.y]);
      if (z.labelAt) c = toCard(z.labelAt);
      if (inZone(o, c[0], c[1])) { o.pole = c; return; }
      var best = null, bd = Infinity;
      for (var x = o.zb.x; x <= o.zb.x + o.zb.w; x += 4) for (var y = o.zb.y; y <= o.zb.y + o.zb.h; y += 4) {
        if (!inZone(o, x, y)) continue;
        var dd = (x - c[0]) * (x - c[0]) + (y - c[1]) * (y - c[1]);
        if (dd < bd) { bd = dd; best = [x, y]; }
      }
      o.pole = best || c;
    });
    var keys = (A.keys || []).map(function (kb) {
      var cnt = entries.filter(function (o) { return o.region === kb.region; }).length;
      return { region: kb.region, x: kb.x, y: kb.y, w: kb.width, h: kb.height || (52 + 30 * Math.ceil(cnt / (kb.columns || 1))) };
    });
    var inlineMode = A.inline || 'auto';
    var allInline = inlineMode === 'all' || (inlineMode === 'auto' && entries.length <= INLINE_MAX && !A.keys);
    var boxes = [];
    function rectFree(b, self) {
      if (b.x < 8 || b.x + b.w > W - 8 || b.y < topMin) return false;
      if (boxes.some(function (q) { return rectsHit(q, b, 6); })) return false;
      if (keys.some(function (q) { return q.h && rectsHit(q, b, 6); })) return false;
      return !entries.some(function (q) { return q !== self && !q.poly && circleRectHit([q.px, q.py], 12, b); });
    }
    function samples(b) {
      var pts = [];
      for (var x = b.x; x <= b.x + b.w + 0.1; x += Math.max(6, b.w / 12)) for (var y = b.y; y <= b.y + b.h + 0.1; y += b.h / 3) pts.push([x, y]);
      return pts;
    }
    /* 1. zone names: inside the zone when they fit, else just outside it on land free of other zones */
    var zoned = entries.filter(function (o) { return o.poly && inlineMode !== 'none' && o.e.label !== false; })
      .sort(function (a, b) { return b.area - a.area; });
    zoned.forEach(function (o) {
      var w = approxWidth(displayName(o.e), ZONE_LABEL) + 4, h = ZONE_LABEL * 1.15, p = o.pole;
      var inside = { x: p[0] - w / 2, y: p[1] - h / 2, w: w, h: h };
      var pad = { x: inside.x - ZONE_PAD, y: inside.y - ZONE_PAD, w: w + 2 * ZONE_PAD, h: h + 2 * ZONE_PAD };
      var core = [];
      for (var sx = pad.x; sx <= pad.x + pad.w + 0.1; sx += pad.w / 10) [0.3, 0.5, 0.7].forEach(function (f) { core.push([sx, pad.y + pad.h * f]); });
      /* up to 10 % of the name may overhang the coast or the zone's edge */
      if (rectFree(inside, o) && core.filter(function (q) { return !inZone(o, q[0], q[1]); }).length <= core.length * 0.1) { o.inline = true; o.box = inside; o.where = 'in'; boxes.push(inside); return; }
    });
    zoned.forEach(function (o) {
      if (o.inline || (A.outside === false)) return;
      var w = approxWidth(displayName(o.e), ZONE_LABEL) + 4, h = ZONE_LABEL * 1.15, zb = o.zb, p = o.pole;
      var cand = [[p[0] - w / 2, zb.y - h - 2], [p[0] - w / 2, zb.y + zb.h + 2], [zb.x + zb.w + 4, p[1] - h / 2], [zb.x - w - 4, p[1] - h / 2]];
      for (var c = 0; c < cand.length; c++) {
        var b = { x: cand[c][0], y: cand[c][1], w: w, h: h };
        if (!rectFree(b, o)) continue;
        if (samples(b).some(function (q) { return entries.some(function (z) { return z !== o && z.poly && inZone(z, q[0], q[1]); }); })) continue;
        o.inline = true; o.box = b; o.where = 'out'; boxes.push(b); return;
      }
    });
    /* 2. point entries written on the map (inline rule) */
    entries.forEach(function (o) {
      if (o.poly) return;
      o.inline = false;
      var want = allInline || o.e.inline === true;
      if (!want || inlineMode === 'none') return;
      var size = 26, w = approxWidth(displayName(o.e), size) + 4, h = size * 1.15;
      var cand = [[o.px + 14, o.py - h / 2], [o.px - 14 - w, o.py - h / 2], [o.px - w / 2, o.py - 14 - h], [o.px - w / 2, o.py + 14]];
      for (var c = 0; c < cand.length; c++) {
        var b = { x: cand[c][0], y: cand[c][1], w: w, h: h };
        if (rectFree(b, o)) { o.inline = true; o.box = b; o.anchor = c; boxes.push(b); return; }
      }
    });
    /* 3. numbers, in key order */
    var n = 0;
    REGIONS.forEach(function (r) { entries.forEach(function (o) { if (o.region === r && !o.inline) o.n = ++n; }); });
    entries.forEach(function (o) { if (!o.inline && o.n == null) o.n = ++n; });
    var nums = entries.filter(function (o) { return !o.inline; });
    nums.forEach(function (o) {
      var off = o.e.offset, base = o.poly ? o.pole : [o.px, o.py];
      o.ax = base[0]; o.ay = base[1]; o.fixed = !!off;
      o.mx = base[0] + (off ? off[0] : 0); o.my = base[1] + (off ? off[1] : 0);
    });
    for (var it = 0; it < 120; it++) {
      for (var a = 0; a < nums.length; a++) {
        for (var b2 = a + 1; b2 < nums.length; b2++) {
          var A1 = nums[a], B1 = nums[b2], dx = B1.mx - A1.mx, dy = B1.my - A1.my, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= MARK_GAP) continue;
          if (dist < 0.01) { var ang = (a * 2.399963) % (2 * Math.PI); dx = Math.cos(ang); dy = Math.sin(ang); dist = 1; }
          var push = (MARK_GAP - dist) + 0.01, ux = dx / dist, uy = dy / dist;
          if (A1.fixed && B1.fixed) continue;
          if (A1.fixed) { B1.mx += ux * push; B1.my += uy * push; }
          else if (B1.fixed) { A1.mx -= ux * push; A1.my -= uy * push; }
          else { A1.mx -= ux * push / 2; A1.my -= uy * push / 2; B1.mx += ux * push / 2; B1.my += uy * push / 2; }
        }
        boxes.forEach(function (bx) {
          var o = nums[a]; if (o.fixed || !circleRectHit([o.mx, o.my], MARK_D / 2 + 3, bx)) return;
          var cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2, ddx = o.mx - cx, ddy = o.my - cy;
          if (Math.abs(ddx) / bx.w > Math.abs(ddy) / bx.h) o.mx = ddx > 0 ? bx.x + bx.w + MARK_D / 2 + 3 : bx.x - MARK_D / 2 - 3;
          else o.my = ddy > 0 ? bx.y + bx.h + MARK_D / 2 + 3 : bx.y - MARK_D / 2 - 3;
        });
      }
      nums.forEach(function (o) {
        if (o.fixed) return;
        var lx = o.mx - o.ax, ly = o.my - o.ay, l = Math.sqrt(lx * lx + ly * ly);
        if (l > LEADER_MAX) { o.mx = o.ax + lx / l * LEADER_MAX; o.my = o.ay + ly / l * LEADER_MAX; }
      });
    }
    var minGap = Infinity, maxLeader = 0;
    nums.forEach(function (o, a) {
      o.leader = Math.sqrt(Math.pow(o.mx - o.ax, 2) + Math.pow(o.my - o.ay, 2));
      /* a numbered zone needs no leader while its marker still sits on the zone */
      o.showLeader = o.poly ? !inZone(o, o.mx, o.my) : o.leader > 4;
      if (o.showLeader) maxLeader = Math.max(maxLeader, o.leader);
      for (var b3 = a + 1; b3 < nums.length; b3++) minGap = Math.min(minGap, Math.sqrt(Math.pow(nums[b3].mx - o.mx, 2) + Math.pow(nums[b3].my - o.my, 2)));
    });
    return { entries: entries, numbered: nums, zones: entries.filter(function (o) { return o.poly; }), minGap: nums.length > 1 ? Math.round(minGap) : null, maxLeader: Math.round(maxLeader) };
  }
  function displayName(e) { return e.name + (e.uncertain ? '°' : ''); }

  function atlasSvg(L, k, vb, uid, d) {
    function X(v) { return v / k + vb[0]; } function Y(v) { return v / k + vb[1]; }
    var s = '<g class="ec-atlas">';
    if (L.zones.length) {
      if (d && d.africa) s += '<clipPath id="' + uid + '-landclip"><path d="' + d.africa + '"/></clipPath>';
      s += '<g class="ec-at-zones"' + (d && d.africa ? ' clip-path="url(#' + uid + '-landclip)"' : '') + '>';
      L.zones.forEach(function (o) {
        var tone = ZONE_TONE[o.kind] || 'area-a', unc = o.e.uncertain || o.e.zone.uncertain;
        s += '<path class="ec-at-zone ec-at-zone--' + o.kind + (unc ? ' ec-at-zone--uncertain' : '') + '" d="' + polyD(o.poly) + '" fill="' + (unc ? 'url(#' + uid + '-' + tone + ')' : 'var(--' + tone + ')') + '" fill-opacity="' + (unc ? 1 : 0.42) + '" stroke="var(--' + tone + '-deep)" stroke-opacity=".7" style="stroke-width:' + 2 / k + 'px;stroke-dasharray:' + 8 / k + ' ' + 6 / k + '"/>';
      });
      s += '</g>';
    }
    L.numbered.forEach(function (o) {
      if (!o.showLeader) return;
      s += '<line class="ec-at-leader" x1="' + X(o.ax) + '" y1="' + Y(o.ay) + '" x2="' + X(o.mx) + '" y2="' + Y(o.my) + '" style="stroke-width:' + 2.5 / k + 'px"/>';
      if (!o.poly) s += shapeSvg(o.kind, X(o.ax), Y(o.ay), 10 / k, ' style="stroke-width:' + 2 / k + 'px"');
    });
    L.entries.forEach(function (o) {
      if (!o.inline) return;
      var b = o.box;
      if (o.poly) {
        var tone = ZONE_TONE[o.kind] || 'area-a';
        s += '<text class="ec-m-lbl-place ec-at-inline ec-at-zone-name" data-label="' + esc(o.e.name) + '" x="' + X(b.x + b.w / 2) + '" y="' + Y(b.y + b.h * 0.8) + '" text-anchor="middle" style="font-size:' + ZONE_LABEL / k + 'px;stroke-width:' + 8 / k + 'px;fill:var(--' + tone + '-deep)">' + esc(displayName(o.e)) + '</text>';
        return;
      }
      s += shapeSvg(o.kind, X(o.px), Y(o.py), 16 / k, ' style="stroke-width:' + 3 / k + 'px"');
      s += '<text class="ec-m-lbl-place ec-at-inline" data-label="' + esc(o.e.name) + '" x="' + X(b.x + 2) + '" y="' + Y(b.y + b.h * 0.8) + '" style="font-size:' + 26 / k + 'px;stroke-width:' + 8 / k + 'px">' + esc(displayName(o.e)) + '</text>';
    });
    L.numbered.forEach(function (o) {
      s += '<g class="ec-at-pt" data-n="' + o.n + '" data-label="' + esc(o.e.name) + '">' + shapeSvg(o.kind, X(o.mx), Y(o.my), MARK_D / k, ' style="stroke-width:' + 3 / k + 'px"');
      s += '<text class="ec-at-num" x="' + X(o.mx) + '" y="' + Y(o.my + 8.5) + '" text-anchor="middle" style="font-size:' + 24 / k + 'px">' + o.n + '</text></g>';
    });
    return s + '</g>';
  }

  function atlasKeys(card, m, L) {
    var keys = m.atlas.keys || [];
    card._keys = [];
    keys.forEach(function (kb) {
      var list = L.numbered.filter(function (o) { return o.region === kb.region; });
      if (!list.length) return;
      var box = el('div', 'ec-key' + (m.atlas.keyRows === 'compact' ? ' ec-key--compact' : ''));
      box.style.left = kb.x + 'px'; box.style.top = kb.y + 'px'; box.style.width = kb.width + 'px';
      var html = '<div class="ec-key-title">' + esc(kb.title || REGION_LABEL[kb.region] || kb.region) + '</div><ol style="column-count:' + (kb.columns || 1) + '">';
      list.forEach(function (o) {
        html += '<li class="ec-key-row ec-key-row--' + o.kind + '"><span class="ec-key-badge"><svg viewBox="0 0 20 20" aria-hidden="true">' + shapeSvg(o.kind, 10, 10, 14) + '</svg><b>' + o.n + '</b></span><span class="ec-key-name">' + fr(displayName(o.e)) + '</span></li>';
      });
      box.innerHTML = html + '</ol>';
      card.appendChild(box);
      card._keys.push(box);
    });
  }

  /* Period marker shared by a series: today on the left, the oldest step on the right. */
  function timeline(t) {
    var box = el('div', 'ec-timeline');
    var steps = t.steps || [];
    var html = '<span class="ec-tl-end">' + esc(t.from || steps[0] || '') + '</span><span class="ec-tl-track">';
    steps.forEach(function (s, i) { html += '<span class="ec-tl-step' + (i === t.current ? ' is-current' : (i < t.current ? ' is-past' : '')) + '" title="' + esc(s) + '"></span>'; });
    html += '</span><span class="ec-tl-end">' + esc(t.to || steps[steps.length - 1] || '') + '</span>';
    box.innerHTML = html;
    return box;
  }

  /* Categorical fills (1914) and marks (independence). */
  function categoricalSvg(m, d, k, uid) {
    var c = m.categorical, s = '', defs = '';
    var tone = {}; (c.classes || []).forEach(function (cl) { tone[cl.id] = cl.tone; });
    Object.keys(c.split || {}).forEach(function (iso) {
      var pair = c.split[iso], id = uid + '-split-' + iso, w = 12 / k;
      defs += '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="' + 2 * w + '" height="' + 2 * w + '" patternTransform="rotate(45)"><rect width="' + w + '" height="' + 2 * w + '" fill="var(--' + tone[pair[0]] + ')"/><rect x="' + w + '" width="' + w + '" height="' + 2 * w + '" fill="var(--' + tone[pair[1]] + ')"/></pattern>';
    });
    (d.countries || []).forEach(function (ct) {
      var fill = null;
      if (c.split && c.split[ct.iso]) fill = 'url(#' + uid + '-split-' + ct.iso + ')';
      else if (c.values && c.values[ct.iso] && tone[c.values[ct.iso]]) fill = 'var(--' + tone[c.values[ct.iso]] + ')';
      if (fill) s += '<path class="ec-m-cat" d="' + ct.d + '" fill="' + fill + '"' + (m.borders === 'dotted' ? '' : ' stroke="var(--map-ink-muted)" style="stroke-width:' + (1.5 / k) + 'px"') + '/>';
    });
    /* Territories of the period (AOF, AEF, Congo belge…): unions of present-day states. Each outline is the members'
       stroke seen only outside the territory (a mask hides the inner half and the shared inner borders), so no line is
       invented: it follows present-day borders where the territory's edge ran along them. */
    var names = '';
    (c.zones || []).forEach(function (z, i) {
      var mem = (d.countries || []).filter(function (ct) { return z.isos.indexOf(ct.iso) >= 0; });
      if (!mem.length) return;
      var mid = uid + '-tz' + i;
      defs += '<mask id="' + mid + '" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><rect x="-2000" y="-2000" width="6000" height="6000" fill="#fff"/>' + mem.map(function (ct) { return '<path d="' + ct.d + '" fill="#000"/>'; }).join('') + '</mask>';
      if (z.outline !== false) s += '<g class="ec-m-terr" mask="url(#' + mid + ')">' + mem.map(function (ct) { return '<path d="' + ct.d + '"/>'; }).join('') + '</g>';
      if (z.name && z.label !== false) {
        var at = z.at || (d.centers && d.centers[z.isos[0]]) || [0, 0], lines = String(z.name).split('\n'), size = z.size || 24;
        if (z.leader) names += '<line class="ec-at-leader" x1="' + at[0] + '" y1="' + at[1] + '" x2="' + z.leader[0] + '" y2="' + z.leader[1] + '" style="stroke-width:' + 2 / k + 'px"/><circle class="ec-m-dot" cx="' + z.leader[0] + '" cy="' + z.leader[1] + '" r="' + 4 / k + '"/>';
        names += '<text class="ec-m-lbl-place ec-m-lbl-terr" data-label="' + esc(lines.join(' ')) + '" x="' + at[0] + '" y="' + at[1] + '" text-anchor="' + (z.anchor || 'middle') + '" style="font-size:' + size / k + 'px;stroke-width:' + 7 / k + 'px">' +
          lines.map(function (ln, j) { return '<tspan x="' + at[0] + '" dy="' + (j ? size * 1.05 / k : (lines.length > 1 ? -(lines.length - 1) * size * 0.52 / k : 0)) + '">' + esc(ln) + '</tspan>'; }).join('') + '</text>';
      }
    });
    if (c.zones) s = s.replace(/<g class="ec-m-terr"/g, '<g class="ec-m-terr" style="stroke-width:' + 4 / k + 'px"');
    return { defs: defs, svg: s, names: names };
  }
  function marksSvg(m, d, k, uid) {
    var s = '', defs = '<pattern id="' + uid + '-inkhatch" patternUnits="userSpaceOnUse" width="' + 12 / k + '" height="' + 12 / k + '" patternTransform="rotate(45)"><rect width="' + 12 / k + '" height="' + 12 / k + '" fill="var(--map-land)"/><rect width="' + 4 / k + '" height="' + 12 / k + '" fill="var(--map-ink-muted)"/></pattern>';
    (m.marks || []).forEach(function (mk) {
      if (mk.kind === 'not-decolonised') {
        (d.countries || []).forEach(function (ct) { if (ct.iso === mk.iso) s += '<path class="ec-m-nd" d="' + ct.d + '" fill="url(#' + uid + '-inkhatch)" stroke="var(--map-ink)" style="stroke-width:' + 2 / k + 'px;stroke-dasharray:' + 8 / k + ' ' + 6 / k + '"/>'; });
      }
    });
    (m.marks || []).forEach(function (mk) {
      if (mk.kind === 'never-colonised' && d.centers && d.centers[mk.iso]) {
        var p = d.centers[mk.iso], o = mk.offset || [0, 0];
        var x = p[0] + o[0] / k, y = p[1] + o[1] / k;
        s += '<circle class="ec-m-ring" cx="' + x + '" cy="' + y + '" r="' + 15 / k + '" style="stroke-width:' + 4 / k + 'px"/><circle class="ec-m-ring-dot" cx="' + x + '" cy="' + y + '" r="' + 5 / k + '"/>';
      }
    });
    return { defs: defs, svg: s };
  }

  function mapSvg(m, uid, bandTop) {
    var d = m.data, vb = (m.view || (d.meta && d.meta.viewBox ? d.meta.viewBox.split(' ').map(Number) : [0, 0, W, H]));
    var k = W / vb[2], borders = m.borders || 'none';
    var defs = '';
    ['area-a', 'area-b', 'area-c'].forEach(function (t) { defs += hatch(uid + '-' + t, t); });
    var cat = m.categorical ? categoricalSvg(m, d, k, uid) : null, mk = m.marks ? marksSvg(m, d, k, uid) : null;
    if (cat) defs += cat.defs; if (mk) defs += mk.defs;
    var L = m.atlas ? atlasLayout(m, k, vb, d, bandTop) : null;
    var s = '<svg class="ec-map" viewBox="' + vb.join(' ') + '" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>';
    s += '<rect class="ec-m-water" x="' + (vb[0] - 50) + '" y="' + (vb[1] - 50) + '" width="' + (vb[2] + 100) + '" height="' + (vb[3] + 100) + '"/>';
    if (d.africa && (m.atlas || m.categorical || m.dimOutside)) {
      s += '<path class="ec-m-land ec-m-land--out" d="' + d.land + '"/>';
      s += '<path class="ec-m-land ec-m-africa" d="' + d.africa + '"/>';
    } else s += '<path class="ec-m-land" d="' + d.land + '"/>';
    if (cat) s += cat.svg;
    if (m.choropleth) {
      (d.countries || []).forEach(function (c) {
        var cl = classOf(m.choropleth, c.iso);
        if (cl) s += '<path class="ec-m-ch" d="' + c.d + '" fill="var(--' + cl.tone + ')"' + (borders === 'dotted' ? '' : ' stroke="var(--map-ink-muted)" style="stroke-width:' + (1.5 / k) + 'px"') + '/>';
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
      if (borders === 'dotted') s += '<path class="ec-m-border ec-m-border--dotted" d="' + (d.bordersMerged || d.borders) + '" style="stroke-width:' + 3.4 / k + 'px;stroke-dasharray:0 ' + 11 / k + '"/>';
      else s += '<path class="ec-m-border ec-m-border--' + borders + '" d="' + d.borders + '" style="stroke-width:' + ((borders === 'strong' ? 4 : 2.5) / k) + 'px;stroke-dasharray:' + (borders === 'quiet' ? (10 / k) + ' ' + (7 / k) : 'none') + '"/>';
    }
    if (mk) s += mk.svg;
    if (cat && cat.names) s += cat.names;
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
    if (L) s += atlasSvg(L, k, vb, uid, d);
    s += '</svg>';
    return { svg: s, k: k, vb: vb, L: L };
  }
  function legendSwatch(kind, tone) {
    var ground = '<rect width="44" height="30" rx="3" fill="var(--map-land)"/>';
    if (kind && kind.indexOf('zone-') === 0) { var zt = ZONE_TONE[kind.slice(5)] || 'area-a'; return '<svg viewBox="0 0 44 30">' + ground + '<path d="M6 8 C 12 2, 30 3, 38 8 S 41 24, 30 26 S 4 26, 6 8 Z" fill="var(--' + zt + ')" fill-opacity=".42" stroke="var(--' + zt + '-deep)" stroke-width="2" stroke-dasharray="5 3"/></svg>'; }
    if (kind && kind.indexOf('at-') === 0) return '<svg viewBox="0 0 44 30">' + ground + shapeSvg(kind.slice(3), 22, 15, 20, ' style="stroke-width:2px"') + '</svg>';
    if (kind === 'solid') return '<svg viewBox="0 0 44 30">' + ground + '<rect x="3" y="3" width="38" height="24" rx="2" fill="var(--' + tone + ')"/></svg>';
    if (kind === 'split') return '<svg viewBox="0 0 44 30"><defs><pattern id="lg-split" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)"><rect width="5" height="10" fill="var(--col-fra)"/><rect x="5" width="5" height="10" fill="var(--col-esp)"/></pattern></defs>' + ground + '<rect x="3" y="3" width="38" height="24" rx="2" fill="url(#lg-split)"/></svg>';
    if (kind === 'ring') return '<svg viewBox="0 0 44 30">' + ground + '<circle cx="22" cy="15" r="9" fill="none" stroke="var(--map-ink)" stroke-width="3"/><circle cx="22" cy="15" r="3" fill="var(--map-ink)"/></svg>';
    if (kind === 'inkhatch') return '<svg viewBox="0 0 44 30"><defs><pattern id="lg-ink" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--map-land)"/><rect width="3" height="8" fill="var(--map-ink-muted)"/></pattern></defs><rect x="3" y="3" width="38" height="24" rx="2" fill="url(#lg-ink)" stroke="var(--map-ink)" stroke-width="2" stroke-dasharray="5 3"/></svg>';
    if (kind === 'border-quiet') return '<svg viewBox="0 0 44 30">' + ground + '<path d="M4 15h36" stroke="var(--map-border-quiet)" stroke-width="3" stroke-dasharray="7 4"/></svg>';
    if (kind === 'border-strong') return '<svg viewBox="0 0 44 30">' + ground + '<path d="M4 15h36" stroke="var(--map-border-strong)" stroke-width="4"/></svg>';
    if (kind === 'place') return '<svg viewBox="0 0 44 30">' + ground + '<circle cx="22" cy="15" r="7" fill="var(--map-ink)"/></svg>';
    if (kind === 'uncertain') return '<svg viewBox="0 0 44 30"><defs><pattern id="lg-' + tone + '" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)"><rect width="9" height="9" fill="var(--' + tone + ')" fill-opacity=".14"/><rect width="3.5" height="9" fill="var(--' + tone + ')" fill-opacity=".9"/></pattern></defs>' + ground + '<rect x="3" y="3" width="38" height="24" fill="url(#lg-' + tone + ')" stroke="var(--' + tone + ')" stroke-width="2.5" stroke-dasharray="6 4"/></svg>';
    return '<svg viewBox="0 0 44 30">' + ground + '<rect x="3" y="3" width="38" height="24" fill="var(--' + tone + ')" fill-opacity=".6" stroke="var(--' + tone + ')" stroke-width="2.5"/></svg>';
  }
  function legend(m) {
    var extra = [];
    (m.marks || []).forEach(function (x) {
      if (x.kind === 'never-colonised' && !extra.some(function (e) { return e.kind === 'ring'; })) extra.push({ kind: 'ring', text: x.legend || 'Jamais colonisé' });
      if (x.kind === 'not-decolonised' && !extra.some(function (e) { return e.kind === 'inkhatch'; })) extra.push({ kind: 'inkhatch', text: x.legend || 'Non décolonisé' });
    });
    function extraRow(into) {
      if (!extra.length) return into;
      var r = el('div', 'ec-legend ec-legend--after');
      extra.forEach(function (it) { r.appendChild(el('span', 'ec-legend-item', legendSwatch(it.kind) + '<span>' + fr(it.text) + '</span>')); });
      var wrap = el('div', ''); wrap.appendChild(into); wrap.appendChild(r); return wrap;
    }
    if (m.categorical) {
      var g = el('div', 'ec-legend ec-legend--grid');
      g.style.gridTemplateColumns = 'repeat(' + (m.categorical.columns || 2) + ', max-content)';
      m.categorical.classes.forEach(function (cl) { g.appendChild(el('span', 'ec-legend-item', legendSwatch('solid', cl.tone) + '<span>' + fr(cl.label) + '</span>')); });
      if (m.categorical.split && Object.keys(m.categorical.split).length) g.appendChild(el('span', 'ec-legend-item', legendSwatch('split') + '<span>' + fr(m.categorical.splitLabel || 'Partagé entre deux puissances') + '</span>'));
      return extraRow(g);
    }
    if (m.atlas && !m.legend) {
      var kinds = {}, unc = false;
      (m.atlas.entries || []).forEach(function (e) { kinds[e.kind || 'state'] = 1; if (e.uncertain) unc = true; });
      var lg2 = el('div', 'ec-legend');
      var zoned = (m.atlas.entries || []).some(function (e) { return e.zone; });
      ['state', 'society', 'site'].forEach(function (kd) { if (kinds[kd]) lg2.appendChild(el('span', 'ec-legend-item', legendSwatch((zoned ? 'zone-' : 'at-') + kd) + '<span>' + esc((m.atlas.labels || {})[kd] || KIND_LABEL[kd]) + '</span>')); });
      var notes = [];
      if (zoned) notes.push(m.atlas.zoneLabel || 'Zones approximatives');
      if (unc) notes.push(m.atlas.uncertainLabel || '° date incertaine (tradition orale ou archéologie)');
      if (notes.length) lg2.appendChild(el('span', 'ec-legend-item ec-legend-item--note', '<span>' + fr(notes.join(' · ')) + '</span>'));
      return extraRow(lg2);
    }
    if (m.choropleth) {
      var sc = el('div', 'ec-scale');
      if (m.choropleth.legendTitle) sc.appendChild(el('div', 'ec-scale-title', fr(m.choropleth.legendTitle)));
      var row = el('div', 'ec-scale-row');
      m.choropleth.classes.forEach(function (c) {
        row.appendChild(el('div', 'ec-scale-step', '<span class="ec-scale-swatch" style="background:var(--' + c.tone + ')"></span><span class="ec-scale-label">' + fr(c.label) + '</span>'));
      });
      sc.appendChild(row);
      return extraRow(sc);
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
    var sr = seriesOf(spec);
    card._bandH = sr ? BAND_H : 0;
    if (sr) card.classList.add('ec-has-series');
    if (opts.context === 'video') card.classList.add('ec-in-video');

    var media = el('div', 'ec-media');
    card.appendChild(media);
    if (spec.map && spec.map.data) {
      var ms = mapSvg(spec.map, 'm' + Math.abs(hash(String(spec.id || spec.title || ''))), card._bandH ? card._bandH + BAND_CLEAR : 0);
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
    if (card._map && card._map.L) atlasKeys(card, spec.map, card._map.L);
    var scrim = el('div', 'ec-scrim' + (card._map ? ' ec-scrim--map' : (spec.veil === 'strong' ? ' ec-scrim--strong' : '')));
    card.appendChild(scrim);

    var p = el('div', 'ec-panel' + (type === 'closing' ? ' ec-panel--center' : ''));
    var st = spec.status || (spec.date && spec.date.marker);
    var kicker = spec.kicker || (spec.date && st && !MARKED[kindOf(st)] ? labelOf(st) : '');
    if (kicker || spec.folio || spec.timeline) {
      var head = el('div', 'ec-head');
      head.appendChild(el('span', 'ec-kicker', fr(kicker || '')));
      if (spec.timeline) head.appendChild(timeline(spec.timeline));
      else if (spec.folio) head.appendChild(el('span', 'ec-folio', esc(spec.folio)));
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
    if (type === 'closing') p.appendChild(sigLine());
    else if (spec.title) p.appendChild(el('h2', 'ec-title' + (type === 'opener' ? ' ec-title--xl' : (type === 'map' ? ' ec-title--m' : '')), fr(spec.title)));
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
    if (spec.cue && opts.context !== 'video') p.appendChild(el('div', 'ec-cue', esc(spec.cue) + ' ›››')); /* a video never asks to scroll */
    if (spec.cta) {
      var cta = el('div', 'ec-cta');
      cta.appendChild(el('span', 'ec-cta-pill', esc(spec.cta.domain || 'ethniafrica.com')));
      p.appendChild(cta);
    }
    if (type === 'closing') { card._gap = el('div', 'ec-close-gap'); p.appendChild(card._gap); }
    sourceLines(p, spec);
    p.appendChild(sign({ logo: opts.logo ? resolve(opts.logo) : null, footer: spec.footer }, type === 'closing'));
    card.appendChild(p);
    card._panel = p; card._scrim = scrim;

    if (sr) { card._band = seriesBand(sr); card.appendChild(card._band); }
    if (spec.demo && opts.demo !== false) card.appendChild(el('div', 'ec-demo', esc(spec.demo)));
    return card;
  }

  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return h; }

  /* Place a photo so that it covers the whole card and its focal point lands on the anchor of the image window. */
  function placeImage(card, panelTop) {
    var spec = card._spec.image, img = card._img;
    if (!spec || !img) return null;
    var w = spec.w || img.naturalWidth, h = spec.h || img.naturalHeight;
    var top0 = card._bandH || 0; /* the image window starts under the series band */
    var s = Math.max(W / w, (H - top0) / h) * (spec.zoom || 1);
    var f = spec.focus || [0.5, 0.5], a = spec.anchor || [0.5, 0.5];
    var tx = a[0] * W - f[0] * w * s, ty = top0 + a[1] * (panelTop - top0) - f[1] * h * s;
    tx = Math.min(0, Math.max(W - w * s, tx));
    ty = Math.min(top0, Math.max(H - h * s, ty));
    img.style.width = (w * s) + 'px'; img.style.height = (h * s) + 'px';
    img.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
    var fy = f[1] * h * s + ty, fx = f[0] * w * s + tx;
    return { scale: s, focus: [Math.round(fx), Math.round(fy)], focusInWindow: fy < panelTop - 40 && fy > top0 + 20 };
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
    var pmax = card._bandH ? PANEL_MAX_SERIES : PANEL_MAX;
    report.panelMax = pmax;
    var sl = spec.type === 'closing' ? p.querySelector('.ec-sigline') : null;
    if (sl) {
      /* 1.6.0: the line's top sits at SIGLINE_Y on every closing card. The gap
         between the pill and the credit takes up what the invitation and the
         credit leave; the kicker and the recap grow the panel upwards. The
         panel is bottom-anchored, so the line's top is H - panel + offset. */
      var lineTop = function () { return H - measure() + (sl.getBoundingClientRect().top - p.getBoundingClientRect().top) / sc; };
      var natural = lineTop(), gap = Math.round(natural - SIGLINE_Y);
      if (gap < 0) report.warnings.push('Ligne de signature poussée hors de sa place (' + Math.round(natural) + ' px au lieu de ' + SIGLINE_Y + ') : l’invitation ou le crédit est trop long.');
      card._gap.style.height = Math.max(0, gap) + 'px';
      /* Panel heights are rounded up to whole pixels: settle the last pixel. */
      for (var it = 0; it < 2 && gap > 0; it++) {
        gap = Math.max(0, gap + Math.round(lineTop() - SIGLINE_Y));
        card._gap.style.height = gap + 'px';
      }
      report.sigline = { naturalY: Math.round(natural), gap: gap };
    }
    var hgt = measure();
    if (hgt > pmax && spec.density !== 'dense' && spec.density !== 'normal') {
      card.classList.add('ec-dense'); report.autoDense = true; hgt = measure();
    }
    report.dense = card.classList.contains('ec-dense');
    report.panelHeight = hgt;
    var top = H - hgt;
    report.panelTop = top;
    report.overflow = hgt > pmax;
    if (report.overflow) { report.warnings.push('Panneau de ' + hgt + ' px (maximum ' + pmax + (card._bandH ? ', bandeau de série compris' : '') + ') : couper la carte en deux ou raccourcir.'); card.classList.add('ec-overflow'); }
    if (card._band) {
      var bt = card._band.querySelector('.ec-series-text');
      report.series = { text: bt.textContent, lines: Math.round(bt.getBoundingClientRect().height / sc / 34), right: Math.round((bt.getBoundingClientRect().right - card.getBoundingClientRect().left) / sc) };
      if (report.series.lines > 1) report.warnings.push('Bandeau de série sur deux lignes : raccourcir le nom de la série, jamais le caractère.');
    }
    if (spec.type === 'map' && spec.body) report.warnings.push('Carte géographique avec texte courant : la carte, le titre et la légende doivent suffire.');
    var scrimH = card._map ? MAP_SCRIM : SCRIM;
    card._scrim.style.top = Math.max(0, top - scrimH) + 'px';
    var pl = placeImage(card, top);
    if (pl) { report.image = pl; if (!pl.focusInWindow) report.warnings.push('Le point focal de l’image tombe sous le texte : déplacer focus ou anchor.'); }
    if (card._map && card._bandH) {
      var hi = [];
      (spec.map.places || []).concat(spec.map.labels || []).forEach(function (l) {
        if ((l.y - card._map.vb[1]) * card._map.k < card._bandH + BAND_CLEAR + 20) hi.push(l.text || l.name);
      });
      if (hi.length) report.warnings.push('Étiquettes de carte sous le bandeau de série : ' + hi.join(', ') + '. Recadrer (map.view).');
    }
    if (card._map) {
      var m = spec.map, k = card._map.k, vb = card._map.vb, low = [];
      (m.places || []).concat(m.labels || []).forEach(function (l) {
        if (l.kind === 'country' && (m.borders || 'none') === 'none') return;
        if ((l.y - vb[1]) * k > top - MAP_SCRIM) low.push(l.text || l.name);
      });
      if (low.length) report.warnings.push('Étiquettes de carte sous le panneau : ' + low.join(', ') + '. Recadrer (map.view).');
    }
    if (card._map && card._map.L) atlasCheck(card, report, top, sc);
    if (card._map) collisionCheck(card, report, sc);
    if (card._callout) {
      var cbot = parseFloat(card._callout.style.top) + card._callout.getBoundingClientRect().height / sc;
      if (cbot > top - MAP_SCRIM) report.warnings.push('L\u2019encadré de la carte chevauche le panneau : le remonter ou raccourcir la liste.');
    }
    Array.prototype.forEach.call(card.querySelectorAll('.ec-inset'), function (f) {
      var b = parseFloat(f.style.top) + f.getBoundingClientRect().height / sc;
      if (b > top - 16) report.warnings.push('Un agrandissement chevauche le panneau.');
    });
    if (card.classList.contains('ec-diagnose')) {
      var g = el('div', 'ec-guide'); g.style.top = (H - pmax) + 'px'; card.appendChild(g);
    }
    if (sl) {
      /* Measured after the panel is placed, so a late dense step cannot hide a
         moved line. Boxes are card pixels; a kicker or recap must end above it. */
      var cr = card.getBoundingClientRect();
      var box = function (n) { var r = n.getBoundingClientRect(); return { top: (r.top - cr.top) / sc, bottom: (r.bottom - cr.top) / sc, left: (r.left - cr.left) / sc, right: (r.right - cr.left) / sc }; };
      var lb = box(sl), spans = sl.querySelectorAll('span'), overlaps = 0;
      Array.prototype.forEach.call(p.querySelectorAll('.ec-kicker,.ec-recap,.ec-body--center,.ec-cta,.ec-credit,.ec-sign'), function (n) {
        var b = box(n);
        if (b.bottom > lb.top + 0.5 && b.top < lb.bottom - 0.5) overlaps++;
      });
      report.sigline.top = Math.round(lb.top * 10) / 10;
      report.sigline.left = Math.round(lb.left);
      report.sigline.right = Math.round(lb.right);
      report.sigline.text = Array.prototype.map.call(spans, function (s) { return s.textContent; }).join(' ');
      report.sigline.lines = Math.round((lb.bottom - lb.top) / 64);
      report.sigline.overlaps = overlaps;
      if (Math.abs(lb.top - SIGLINE_Y) > 0.5 && report.sigline.gap >= 0 && report.warnings.every(function (w) { return w.indexOf('Ligne de signature') < 0; })) report.warnings.push('Ligne de signature hors de sa place (' + report.sigline.top + ' px au lieu de ' + SIGLINE_Y + ').');
      if (report.sigline.lines !== 3) report.warnings.push('Ligne de signature sur ' + report.sigline.lines + ' lignes au lieu de trois.');
      if (overlaps) report.warnings.push('Un texte chevauche la ligne de signature.');
    }
    report.ok = !report.overflow && report.warnings.length === 0;
    card._report = report;
    return report;
  }

  function cardRect(card, node, sc) {
    var c = card.getBoundingClientRect(), r = node.getBoundingClientRect();
    return { x: (r.left - c.left) / sc, y: (r.top - c.top) / sc, w: r.width / sc, h: r.height / sc };
  }
  function atlasCheck(card, report, top, sc) {
    var L = card._map.L, k = card._map.k, vb = card._map.vb, limit = top - MAP_SCRIM;
    report.atlas = { entries: L.entries.length, numbered: L.numbered.length, inline: L.entries.length - L.numbered.length, minGap: L.minGap, maxLeader: L.maxLeader };
    var out = L.entries.filter(function (o) { return o.px < 0 || o.px > W || o.py < 0 || o.py > limit; }).map(function (o) { return o.e.name; });
    if (out.length) report.warnings.push('Hors du cadre de la carte : ' + out.join(', ') + '. Recadrer (map.view).');
    if (L.minGap != null && L.minGap < MARK_GAP - 1) report.warnings.push('Deux points numérotés à ' + L.minGap + ' px (minimum ' + MARK_GAP + ') : ajouter un offset.');
    var low = L.numbered.filter(function (o) { return o.my + MARK_D / 2 > limit; }).map(function (o) { return o.n; });
    if (low.length) report.warnings.push('Points sous le dégradé du panneau : ' + low.join(', ') + '.');
    var africa = card.querySelector('.ec-m-africa');
    (card._keys || []).forEach(function (kb) {
      var r = cardRect(card, kb, sc), name = kb.querySelector('.ec-key-title').textContent;
      if (r.y + r.h > limit) report.warnings.push('Liste « ' + name + ' » sous le dégradé du panneau.');
      if (r.x < 8 || r.x + r.w > W - 8 || r.y < Math.max(8, (card._bandH || 0) + BAND_CLEAR)) report.warnings.push('Liste « ' + name + ' » hors des marges' + (card._bandH ? ' ou à moins de 12 px du bandeau' : '') + '.');
      if (africa && africa.isPointInFill) {
        var hit = false;
        for (var x = r.x + 4; x < r.x + r.w && !hit; x += 10) for (var y = r.y + 4; y < r.y + r.h && !hit; y += 10) {
          if (africa.isPointInFill(new DOMPoint(x / k + vb[0], y / k + vb[1]))) hit = true;
        }
        if (hit) report.warnings.push('Liste « ' + name + ' » posée sur le continent : la déplacer sur la mer.');
      }
      L.numbered.forEach(function (o) { if (circleRectHit([o.mx, o.my], MARK_D / 2, r)) report.warnings.push('Liste « ' + name + ' » couvre le point ' + o.n + '.'); });
    });
  }
  /* Every text and marker on the map, plus overlays: no two may overlap (the check 1.1 lacked). */
  var COLLIDE = 4; /* px of overlap tolerated in each direction, for anti-aliasing and halos */
  function collisionCheck(card, report, sc) {
    var items = [];
    /* Text boxes are reduced to their ink: the line box minus 22 % at the top (above capitals) and 10 % at the bottom. */
    function ink(t) { var r = cardRect(card, t, sc); return { x: r.x, y: r.y + r.h * .22, w: r.w, h: r.h * .68 }; }
    Array.prototype.forEach.call(card.querySelectorAll('.ec-map text:not(.ec-at-num):not(.ec-m-lbl-val)'), function (t) {
      var r = ink(t), v = t.nextElementSibling;
      if (v && v.classList && v.classList.contains('ec-m-lbl-val')) { /* a name and its figure form one label */
        var q = ink(v), x0 = Math.min(r.x, q.x), y0 = Math.min(r.y, q.y);
        r = { x: x0, y: y0, w: Math.max(r.x + r.w, q.x + q.w) - x0, h: Math.max(r.y + r.h, q.y + q.h) - y0 };
      }
      items.push({ name: t.getAttribute('data-label') || t.textContent, r: r });
    });
    Array.prototype.forEach.call(card.querySelectorAll('.ec-at-pt'), function (g) { items.push({ name: 'point ' + g.getAttribute('data-n'), r: cardRect(card, g, sc), pt: true }); });
    Array.prototype.forEach.call(card.querySelectorAll('.ec-key, .ec-callout, .ec-map-inset, .ec-demo'), function (b) { var t = b.querySelector('.ec-key-title'); items.push({ name: t ? 'liste ' + t.textContent : 'encadré', r: cardRect(card, b, sc), box: true }); });
    if (card._band) {
      var bandBox = { x: 0, y: 0, w: W, h: card._bandH + BAND_CLEAR };
      var under = items.filter(function (it) { return it.r.y < bandBox.h && it.r.y + it.r.h > 0; }).map(function (it) { return it.name; });
      if (under.length) report.warnings.push('À moins de 12 px du bandeau de série : ' + under.join(', ') + '.');
    }
    var hits = [];
    for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
      var a = items[i], b = items[j];
      if (a.pt && b.pt) continue;
      var ox = Math.min(a.r.x + a.r.w, b.r.x + b.r.w) - Math.max(a.r.x, b.r.x), oy = Math.min(a.r.y + a.r.h, b.r.y + b.r.h) - Math.max(a.r.y, b.r.y);
      if (ox > COLLIDE && oy > COLLIDE) hits.push(a.name + ' / ' + b.name);
    }
    var cut = items.filter(function (it) { return !it.box && (it.r.x < 0 || it.r.y < 0 || it.r.x + it.r.w > W); }).map(function (it) { return it.name; });
    if (cut.length) report.warnings.push('Coupé par le bord de la carte : ' + cut.join(', ') + '. Recadrer (map.view) ou déplacer.');
    report.collisions = hits.length;
    if (hits.length) report.warnings.push('Chevauchements sur la carte (' + hits.length + ') : ' + hits.slice(0, 6).join(' ; ') + (hits.length > 6 ? ' ; …' : '') + '.');
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

  /* What a map shows, in words, for the alternative text: atlas entries by region, categories, classes, marks. */
  function mapAlt(m) {
    var out = [];
    if (m.atlas) {
      var KW = { society: 'société sans roi', site: 'site archéologique' };
      REGIONS.forEach(function (r) {
        var list = (m.atlas.entries || []).filter(function (e) { return (e.region || 'ouest') === r; });
        if (list.length) out.push(REGION_LABEL[r] + ' : ' + list.map(function (e) { return plain(displayName(e)) + (KW[e.kind] ? ' (' + KW[e.kind] + ')' : ''); }).join(', '));
      });
      if ((m.atlas.entries || []).some(function (e) { return e.uncertain; })) out.push('° : date incertaine');
    }
    if (m.categorical) out.push('Légende : ' + m.categorical.classes.map(function (c) { return plain(c.label); }).concat(m.categorical.split ? [plain(m.categorical.splitLabel || 'Partagé entre deux puissances')] : []).join(', '));
    if (m.choropleth) out.push((m.choropleth.legendTitle ? plain(m.choropleth.legendTitle) + ' : ' : 'Classes : ') + m.choropleth.classes.map(function (c) { return plain(c.label); }).join(', '));
    (m.marks || []).forEach(function (mk) { if (mk.legend) out.push(plain(mk.legend)); });
    if ((m.marks || []).some(function (mk) { return mk.kind === 'never-colonised'; })) out.push('Jamais colonisé : ' + m.marks.filter(function (mk) { return mk.kind === 'never-colonised'; }).map(function (mk) { return mk.name || mk.iso; }).join(', '));
    return out;
  }

  /* Alternative text for an export: description of the image, then every word printed on the card, in reading order. */
  function altText(spec) {
    if (spec.alt) return spec.alt;
    var parts = [], sr = seriesOf(spec);
    if (sr) parts.push(plain(sr.name) + ', n° ' + sr.episode);
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
    if (spec.timeline && spec.timeline.steps) parts.push('Repère de période : ' + spec.timeline.steps[spec.timeline.current] + ', étape ' + (spec.timeline.current + 1) + ' sur ' + spec.timeline.steps.length + ', de ' + (spec.timeline.from || spec.timeline.steps[0]) + ' à ' + (spec.timeline.to || spec.timeline.steps[spec.timeline.steps.length - 1]));
    if (spec.map) parts = parts.concat(mapAlt(spec.map));
    if (spec.body) parts.push(plain([].concat(spec.body).join(' ')));
    if (spec.forms && spec.forms.rows) parts.push(spec.forms.rows.map(function (r) { return plain(r[0]) + ', ' + plain(r[1]); }).join(' ; '));
    if (spec.forms && spec.forms.layout === 'pair') parts.push(plain(spec.forms.searchedLabel) + ' ' + plain(spec.forms.searched) + '. ' + plain(spec.forms.selfLabel) + ' ' + plain(spec.forms.self));
    if (spec.note) parts.push(plain(spec.note));
    if (spec.recap) parts.push(spec.recap.map(function (r) { return plain(r.date) + ' : ' + plain(r.name); }).join(' ; '));
    if (spec.cta) parts.push(plain(spec.cta.domain || 'ethniafrica.com'));
    if (spec.type === 'closing') parts.push(SIGNATURE_TEXT); /* 1.6.0: the alternative text ends with the line, word for word */
    return parts.join('. ').replace(/\.\s*\./g, '.');
  }

  window.EthniCards = {
    version: VERSION, W: W, H: H, PANEL_MAX: PANEL_MAX, PANEL_MAX_SERIES: PANEL_MAX_SERIES, BAND_H: BAND_H, SERIES: SERIES, seriesOf: seriesOf,
    render: render, layout: layout, mount: mount,
    tokensToCss: tokensToCss, installTokens: installTokens, altText: altText, signatureLine: SIGNATURE_TEXT, signatureLines: SIGNATURE_LINE, SIGLINE_Y: SIGLINE_Y,
    statusLabels: STATUS_LABEL, statusMark: statusMark, recap: recap, timeline: timeline, atlasLayout: atlasLayout
  };
})();
