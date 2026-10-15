/* 1.4.1-proposition: a series map card drawn on satellite imagery, with the
   satellite video's own shader and overlay grammar (social/video/page.mjs,
   Vidéo carte 0.2.0 to 0.4.0). A design board, not the engine.
   window.SeriesSat.draw(layerEl, spec, view, opts) -> report. */
(function () {
  var INK = { a: "#e8b96a", b: "#6cc3b5", c: "#e3876a" };
  var NOTE = "#a8977f";
  var SVGNS = "http://www.w3.org/2000/svg";
  // The satellite video's shader (page.mjs, board 1), flat style, recede grade;
  // no vignette and no ending dim: the series frame darkens nothing.
  var VERT =
    "#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
  var FRAG =
    "#version 300 es\nprecision highp float;\n" +
    "uniform vec2 centre; uniform float radius; uniform vec2 view; uniform sampler2D world; uniform sampler2D region; uniform vec4 bounds; uniform float grade;\n" +
    "out vec4 colour; const vec3 SPACE = vec3(7.0,6.0,5.0)/255.0; const vec3 ATMOS = vec3(143.0,184.0,204.0)/255.0; const vec3 WARM = vec3(255.0,238.0,221.0)/255.0;\n" +
    "vec3 graded(vec3 c){ float sat = mix(0.85,0.70,grade), expo = mix(0.90,0.76,grade); float con = mix(1.06,0.96,grade), warm = mix(0.35,0.45,grade);" +
    " float lum = dot(c, vec3(0.2126,0.7152,0.0722)); c = vec3(lum) + sat*(c-vec3(lum)); c = (c*expo-0.5)*con+0.5; return clamp(c*(1.0-warm+warm*WARM),0.0,1.0); }\n" +
    "void main(){ vec2 px = vec2(gl_FragCoord.x, 1920.0 - gl_FragCoord.y); float x = (px.x-centre.x)/radius, y = -(px.y-centre.y)/radius; float rho = length(vec2(x,y));" +
    " vec3 c = SPACE; if (rho < 1.0) { float cc = sqrt(1.0-rho*rho); float lat0 = view.y, lon0 = view.x;" +
    " float lat = rho > 0.0 ? asin(clamp(cc*sin(lat0) + y*rho*cos(lat0)/rho, -1.0, 1.0)) : lat0;" +
    " float lon = lon0 + (rho > 0.0 ? atan(x*rho, rho*cc*cos(lat0) - y*rho*sin(lat0)) : 0.0);" +
    " float lonD = mod(degrees(lon)+180.0, 360.0)-180.0, latD = degrees(lat); vec3 t;" +
    " if (lonD >= bounds.x && lonD <= bounds.y && latD >= bounds.z && latD <= bounds.w) t = texture(region, vec2((lonD-bounds.x)/(bounds.y-bounds.x), (bounds.w-latD)/(bounds.w-bounds.z))).rgb;" +
    " else t = texture(world, vec2((lonD+180.0)/360.0, (90.0-latD)/180.0)).rgb;" +
    " c = graded(t) * (0.62 + 0.38*sqrt(cc)); float haze = 0.28*pow(1.0-cc,3.0); c = c*(1.0-haze) + ATMOS*haze*mix(0.55,0.4,grade); }" +
    " colour = vec4(c, 1.0); }";

  function loadImage(src) {
    return new Promise(function (ok, ko) {
      var i = new Image();
      i.onload = function () {
        ok(i);
      };
      i.onerror = ko;
      i.src = src;
    });
  }
  function texture(gl, img, unit) {
    var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function shader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  // Card base-map units -> lon/lat (the base map's meta projection) -> frame.
  function projector(view, zoom) {
    var p0 = (view.camera.lat * Math.PI) / 180,
      l0 = view.camera.lon,
      R = view.camera.radius * zoom,
      cy = view.camera.centreY;
    var pr = view.projection;
    function ll(x, y) {
      return [pr.lon0 + x / pr.k, pr.lat0 - y / pr.k];
    }
    function frame(lon, lat) {
      var l = ((lon - l0) * Math.PI) / 180,
        p = (lat * Math.PI) / 180;
      return [
        540 + R * Math.cos(p) * Math.sin(l),
        cy -
          R *
            (Math.cos(p0) * Math.sin(p) -
              Math.sin(p0) * Math.cos(p) * Math.cos(l)),
      ];
    }
    function path(d) {
      var tokens = d.match(/[MLCZmlcz]|-?\d+(?:\.\d+)?/g) || [],
        out = [],
        nums = [];
      function flush() {
        for (var i = 0; i + 1 < nums.length; i += 2) {
          var q = frame.apply(null, ll(nums[i], nums[i + 1]));
          out.push(q[0].toFixed(1) + "," + q[1].toFixed(1));
        }
        nums = [];
      }
      tokens.forEach(function (t) {
        if (/[A-Za-z]/.test(t)) {
          flush();
          out.push(t.toUpperCase());
        } else nums.push(parseFloat(t));
      });
      flush();
      return out.join(" ").replace(/ ([\d-])/g, " $1");
    }
    // Lon/lat rings or lines (Natural Earth) -> an SVG path.
    function lines(list, closed) {
      return list
        .map(function (line) {
          return (
            "M" +
            line
              .map(function (p) {
                var q = frame(p[0], p[1]);
                return q[0].toFixed(1) + "," + q[1].toFixed(1);
              })
              .join("L") +
            (closed ? "Z" : "")
          );
        })
        .join(" ");
    }
    return {
      ll: ll,
      frame: frame,
      path: path,
      lines: lines,
      point: function (x, y) {
        return frame.apply(null, ll(x, y));
      },
    };
  }

  function el(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function inkOf(tone) {
    return (tone || "area-a").replace("area-", "");
  }

  async function draw(layer, spec, view, opts) {
    opts = opts || {};
    var zoom = opts.zoom || 1;
    var data = spec.map.data;
    var pj = projector(view, zoom);
    var box = document.createElement("div");
    box.className = "sat";
    box.style.cssText = "position:absolute;inset:0;overflow:hidden";
    layer.appendChild(box);
    var canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    canvas.style.cssText =
      "position:absolute;left:0;top:0;width:1080px;height:1920px";
    box.appendChild(canvas);
    var gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
    var prog = gl.createProgram();
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var imgs = await Promise.all([
      loadImage(opts.satBase + "world.jpg"),
      loadImage(opts.satBase + spec.id + ".jpg"),
    ]);
    texture(gl, imgs[0], 0);
    texture(gl, imgs[1], 1);
    gl.uniform1i(gl.getUniformLocation(prog, "world"), 0);
    gl.uniform1i(gl.getUniformLocation(prog, "region"), 1);
    gl.uniform2f(
      gl.getUniformLocation(prog, "centre"),
      540,
      view.camera.centreY
    );
    gl.uniform1f(
      gl.getUniformLocation(prog, "radius"),
      view.camera.radius * zoom
    );
    gl.uniform2f(
      gl.getUniformLocation(prog, "view"),
      (view.camera.lon * Math.PI) / 180,
      (view.camera.lat * Math.PI) / 180
    );
    var b = view.bounds;
    gl.uniform4f(gl.getUniformLocation(prog, "bounds"), b[0], b[1], b[2], b[3]);
    gl.uniform1f(gl.getUniformLocation(prog, "grade"), 1.0); // recede
    gl.viewport(0, 0, 1080, 1920);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Overlays in the satellite design's layer order: fills, borders, edges.
    var svg = el("svg", {
      width: 1080,
      height: 1920,
      viewBox: "0 0 1080 1920",
    });
    svg.style.cssText = "position:absolute;left:0;top:0";
    var defs = el("defs", {});
    Object.keys(INK).forEach(function (k) {
      [45, 135].forEach(function (a) {
        var pat = el("pattern", {
          id: "sat-hatch-" + k + "-" + a,
          patternUnits: "userSpaceOnUse",
          width: 18,
          height: 18,
          patternTransform: "rotate(" + a + ")",
        });
        pat.appendChild(
          el("rect", {
            width: 18,
            height: 18,
            fill: INK[k],
            "fill-opacity": 0.1,
          })
        );
        pat.appendChild(
          el("line", {
            x1: 9,
            y1: 0,
            x2: 9,
            y2: 18,
            stroke: "#0b0806",
            "stroke-opacity": 0.45,
            "stroke-width": 8,
          })
        );
        pat.appendChild(
          el("line", {
            x1: 9,
            y1: 0,
            x2: 9,
            y2: 18,
            stroke: INK[k],
            "stroke-width": 4,
          })
        );
        defs.appendChild(pat);
      });
    });
    svg.appendChild(defs);
    var fills = el("g", {}),
      borders = el("g", {
        fill: "none",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
      edges = el("g", {
        fill: "none",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
    svg.appendChild(fills);
    svg.appendChild(borders);
    svg.appendChild(edges);
    var areas = [];
    // A highlighted country: its Natural Earth 1:50m outline (view.highlight),
    // drawn as a certain area in the card's ink.
    if (spec.map.highlight)
      areas.push({
        d: view.highlight
          .map(function (rings) {
            return pj.lines(rings, true);
          })
          .join(" "),
        ink: inkOf(spec.map.highlight.tone),
        uncertain: false,
        legend: spec.map.highlight.legend,
      });
    (spec.map.areas || []).forEach(function (a) {
      areas.push({
        d: a.paths.map(pj.path).join(" "),
        ink: inkOf(a.tone),
        uncertain: a.kind !== "certain",
        legend: a.legend || a.label,
      });
    });
    areas.forEach(function (a) {
      fills.appendChild(
        el(
          "path",
          a.uncertain
            ? {
                d: a.d,
                fill: "url(#sat-hatch-" + a.ink + "-45)",
                "fill-rule": "evenodd",
              }
            : {
                d: a.d,
                fill: INK[a.ink],
                "fill-opacity": 0.3,
                "fill-rule": "evenodd",
              }
        )
      );
      var dash = a.uncertain ? { "stroke-dasharray": "16 10" } : {};
      edges.appendChild(
        el(
          "path",
          Object.assign(
            {
              d: a.d,
              stroke: "#0b0806",
              "stroke-opacity": 0.55,
              "stroke-width": 8,
            },
            dash
          )
        )
      );
      edges.appendChild(
        el(
          "path",
          Object.assign({ d: a.d, stroke: INK[a.ink], "stroke-width": 4 }, dash)
        )
      );
    });
    var bstyle = spec.map.borders || "none";
    // Land borders shared by two countries (Natural Earth, view.borders): the
    // card's base map stops short of a 9:16 satellite frame. No coastline.
    if (bstyle !== "none" && view.borders && view.borders.length) {
      var bd = pj.lines(view.borders, false);
      if (bstyle === "strong") {
        borders.appendChild(
          el("path", {
            d: bd,
            stroke: "#0b0806",
            "stroke-opacity": 0.55,
            "stroke-width": 8,
          })
        );
        borders.appendChild(
          el("path", {
            d: bd,
            stroke: "#f3e9da",
            "stroke-opacity": 0.92,
            "stroke-width": 3.5,
          })
        );
      } else {
        borders.appendChild(
          el("path", {
            d: bd,
            stroke: "#0b0806",
            "stroke-opacity": 0.35,
            "stroke-width": 5,
          })
        );
        borders.appendChild(
          el("path", {
            d: bd,
            stroke: "#f3e9da",
            "stroke-opacity": 0.7,
            "stroke-width": 2,
            "stroke-dasharray": "9 7",
          })
        );
      }
    }
    box.appendChild(svg);

    // Names, on their halo, at most six, inside the map band (y 724 to 1296).
    var names = [];
    if (
      spec.map.countryLabels === "highlight" &&
      spec.map.highlight &&
      view.highlightName
    )
      names.push({
        text: view.highlightName,
        at: pj.frame(view.labelAt[0], view.labelAt[1]),
        style: "region",
      });
    else if (spec.map.countryLabels === true)
      (data.labels.countries || []).forEach(function (l) {
        names.push({ text: l.text, at: pj.point(l.x, l.y), style: "region" });
      });
    (spec.map.labels || []).forEach(function (l) {
      names.push({
        text: l.text,
        at: pj.point(l.x, l.y),
        style: "area",
        ink: inkOf(l.tone),
      });
    });
    (spec.map.places || []).forEach(function (p) {
      names.push({ text: p.name, at: pj.point(p.x, p.y), style: "place" });
    });
    var nameBoxes = [];
    names.slice(0, 6).forEach(function (n) {
      var d = document.createElement("div");
      d.className = "sat-name sat-" + n.style;
      if (n.ink) d.style.color = INK[n.ink];
      d.textContent = n.text;
      d.style.cssText +=
        ";position:absolute;left:" +
        n.at[0] +
        "px;top:" +
        n.at[1] +
        "px;transform:translate(-50%,-50%)";
      box.appendChild(d);
      nameBoxes.push(d);
    });
    // The subject's box on the frame.
    var sb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    fills.querySelectorAll("path").forEach(function (p) {
      var r = p.getBBox();
      sb.x0 = Math.min(sb.x0, r.x);
      sb.y0 = Math.min(sb.y0, r.y);
      sb.x1 = Math.max(sb.x1, r.x + r.width);
      sb.y1 = Math.max(sb.y1, r.y + r.height);
    });
    return {
      canvas: canvas,
      svg: svg,
      names: nameBoxes,
      areas: areas,
      subject: sb,
      spanKm: view.spanKm,
      capped: view.capped,
      count: names.length,
    };
  }
  window.SeriesSat = { draw: draw, INK: INK, NOTE: NOTE };
})();
