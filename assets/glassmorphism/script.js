/*
 * Diapason 02 — Glassmorphism
 * Living light (WebGL caustics), liquid glass (SVG displacement generated per element),
 * a droplet lens on the hero, spring physics for everything that moves.
 */
(function () {
  'use strict';

  var D = window.DIAPASON;
  if (!D) return;

  var root = document.documentElement;
  var isPreview = D.isPreview;
  var reduced = D.reducedMotion;
  var previewActive = false;
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var mqCoarse = matchMedia('(hover: none), (pointer: coarse)');
  var mqMobile = matchMedia('(max-width: 699px)');
  var mqNarrow = matchMedia('(max-width: 899px)');
  var NS = 'http://www.w3.org/2000/svg';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function animated() { return !reduced && (!isPreview || previewActive); }
  function interactive() { return !reduced && !isPreview; }

  /* ---------- liquid glass support (Chromium renders SVG filters in backdrop-filter) ---------- */
  var ua = navigator.userAgent;
  var brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  var isChromium = brands.some(function (b) { return /Chromium|Google Chrome|Microsoft Edge|Opera/i.test(b.brand); }) ||
    (/Chrome\/\d+/.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS/.test(ua) && !!window.chrome);
  var LIQUID = isChromium && window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'url(#a) blur(1px)');
  if (LIQUID) root.classList.add('lg-liquid');

  /* ---------- springs + one shared frame loop ---------- */
  function Spring(v, k, c, eps) {
    this.x = v; this.t = v; this.v = 0;
    this.k = k || 170; this.c = c || 26; this.eps = eps || 0.02;
  }
  Spring.prototype.step = function (dt) {
    var n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    for (var i = 0; i < n; i++) {
      var a = -this.k * (this.x - this.t) - this.c * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    if (Math.abs(this.v) < this.eps && Math.abs(this.x - this.t) < this.eps) { this.x = this.t; this.v = 0; return false; }
    return true;
  };
  Spring.prototype.snap = function (v) { this.x = this.t = v; this.v = 0; };

  var tickers = [];
  var rafId = 0;
  var lastT = 0;
  function frame(now) {
    rafId = 0;
    var dt = clamp((now - lastT) / 1000, 0.001, 0.05);
    lastT = now;
    var keep = false;
    for (var i = 0; i < tickers.length; i++) {
      try { if (tickers[i](dt, now)) keep = true; } catch (e) { console.error(e); }
    }
    if (keep && !document.hidden) rafId = requestAnimationFrame(frame);
  }
  function wake() {
    if (rafId || document.hidden) return;
    lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });

  /* ---------- pointer ---------- */
  var P = { x: innerWidth * 0.72, y: innerHeight * 0.3, seen: false, last: 0, inside: false };
  window.addEventListener('pointermove', function (e) {
    P.x = e.clientX; P.y = e.clientY; P.last = performance.now(); P.inside = true;
    if (e.pointerType === 'mouse') P.seen = true;
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { P.inside = false; wake(); });
  document.documentElement.addEventListener('mouseleave', function () { P.inside = false; wake(); });

  /* ---------- grain (kills banding in gradients and glass) ---------- */
  (function grain() {
    try {
      var c = document.createElement('canvas');
      c.width = c.height = 128;
      var x = c.getContext('2d', { willReadFrequently: true }); // CPU canvas: no GPU readback to encode
      var img = x.createImageData(128, 128);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      root.style.setProperty('--grain', 'url(' + c.toDataURL('image/png') + ')');
    } catch (e) { /* decorative */ }
  })();

  /* =========================================================================
   * Liquid glass: displacement maps drawn on a small canvas (the fields are
   * smooth, so a ¼–½ resolution map upscaled by feImage looks the same),
   * encoded off the main thread (toBlob → object URL), built in idle time and
   * cached by quantised size, so hover and resize never re-encode a map.
   * ========================================================================= */
  var defs = document.getElementById('lg-defs');
  var liquids = [];
  var filterSeq = 0;

  function mapCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d', { willReadFrequently: true }); // CPU canvas: no GPU readback to encode
    return { c: c, ctx: ctx, img: ctx.createImageData(w, h) };
  }
  function put(d, i, dx, dy) {
    d[i] = 128 + 127 * clamp(dx, -1, 1);
    d[i + 1] = 128 + 127 * clamp(dy, -1, 1);
    d[i + 2] = 128;
    d[i + 3] = 255;
  }
  // rounded-rect bezel: displacement along the outward normal near the rim (+ a mask of the rim).
  // w, h, r and bezel are in map texels (the caller has already scaled them down).
  function edgeCanvases(w, h, r, bezel, strength, withMask) {
    var m = mapCanvas(w, h), d = m.img.data;
    var mk = withMask ? mapCanvas(w, h) : null, md = mk && mk.img.data;
    var hw = w / 2, hh = h / 2, ir = Math.max(0.001, Math.min(r, hw, hh));
    for (var y = 0; y < h; y++) {
      var py = y + 0.5 - hh, ay = Math.abs(py), qy = ay - (hh - ir), sy = py < 0 ? -1 : 1;
      for (var x = 0; x < w; x++) {
        var px = x + 0.5 - hw, ax = Math.abs(px), qx = ax - (hw - ir), sx = px < 0 ? -1 : 1;
        var dist, nx, ny;
        if (qx > 0 && qy > 0) {
          var L = Math.sqrt(qx * qx + qy * qy) || 1;
          dist = ir - L; nx = qx / L * sx; ny = qy / L * sy;
        } else if (qx > qy) { dist = hw - ax; nx = sx; ny = 0; }
        else { dist = hh - ay; nx = 0; ny = sy; }
        var k = 0, t = 0;
        if (dist >= 0 && dist < bezel) {
          t = 1 - dist / bezel;
          k = t * t * (0.3 + 0.7 * t) * strength;
        }
        var i = (y * w + x) * 4;
        put(d, i, nx * k, ny * k);
        if (md) {
          var a = clamp(t * 1.6, 0, 1);
          md[i] = md[i + 1] = md[i + 2] = 255;
          md[i + 3] = Math.round(a * a * (3 - 2 * a) * 255);
        }
      }
    }
    m.ctx.putImageData(m.img, 0, 0);
    if (mk) mk.ctx.putImageData(mk.img, 0, 0);
    return { map: m.c, mask: mk && mk.c };
  }
  // round lens: gentle magnification in the middle, light bent outward at the rim
  function lensCanvas(size, mag, rim) {
    var m = mapCanvas(size, size), d = m.img.data, R = size / 2;
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var dx = (x + 0.5 - R) / R, dy = (y + 0.5 - R) / R, r = Math.sqrt(dx * dx + dy * dy);
        var fx = 0, fy = 0;
        if (r < 1 && r > 0.0001) {
          var s = clamp((r - 0.6) / 0.4, 0, 1);
          s = s * s * (3 - 2 * s);
          var f = -mag * r + rim * Math.pow(s, 2.2);
          fx = dx / r * f; fy = dy / r * f;
        }
        put(d, (y * size + x) * 4, fx, fy);
      }
    }
    m.ctx.putImageData(m.img, 0, 0);
    return m.c;
  }
  // async encode + decode, so a filter never samples a half-loaded (transparent) map
  function encode(canvas) {
    return new Promise(function (res) {
      function fallback() { try { res(canvas.toDataURL('image/png')); } catch (e) { res(''); } }
      if (!canvas.toBlob || !window.URL || !URL.createObjectURL) { fallback(); return; }
      canvas.toBlob(function (b) { if (b) res(URL.createObjectURL(b)); else fallback(); }, 'image/png');
    }).then(function (url) {
      if (!url) return url;
      var img = new Image();
      img.src = url;
      return (img.decode ? img.decode() : Promise.resolve()).then(function () { return url; }, function () { return url; });
    });
  }
  var mapCache = new Map();
  function inUse(url) {
    for (var i = 0; i < liquids.length; i++) if (liquids[i].urls.indexOf(url) > -1) return true;
    return false;
  }
  function cached(key, build) {
    var hit = mapCache.get(key);
    if (hit) { mapCache.delete(key); mapCache.set(key, hit); return hit; }
    var p = build();
    mapCache.set(key, p);
    if (mapCache.size > 48) {
      var k0 = mapCache.keys().next().value, old = mapCache.get(k0);
      mapCache.delete(k0);
      old.then(function (m) {
        [m.map, m.mask].forEach(function (u) { if (u && u.indexOf('blob:') === 0 && !inUse(u)) URL.revokeObjectURL(u); });
      });
    }
    return p;
  }
  function q8(v) { return Math.max(8, Math.round(v / 8) * 8); }
  function edgeMapFor(w, h, r, o) {
    var qw = q8(w), qh = q8(h);
    var key = 'e' + qw + 'x' + qh + ':' + Math.round(r) + ':' + o.bezel + ':' + o.strength + ':' + (o.frost ? 1 : 0);
    return cached(key, function () {
      // keep ≥ 6 texels across the bezel; the rest of the field is flat
      var f = clamp(Math.floor(o.bezel / 6), 1, 4);
      var tw = Math.max(4, Math.round(qw / f)), th = Math.max(4, Math.round(qh / f));
      var cv = edgeCanvases(tw, th, r / f, o.bezel / f, o.strength, !!o.frost);
      return Promise.all([encode(cv.map), cv.mask ? encode(cv.mask) : Promise.resolve('')]).then(function (u) {
        return { map: u[0], mask: u[1] };
      });
    });
  }
  function lensMapFor(size, o) {
    var qs = Math.max(8, Math.round(size / 4) * 4);
    var key = 'l' + qs + ':' + o.mag + ':' + o.rim;
    return cached(key, function () {
      var f = clamp(Math.floor(qs / 48), 1, 4);
      return encode(lensCanvas(Math.max(8, Math.round(qs / f)), o.mag, o.rim)).then(function (u) { return { map: u, mask: '' }; });
    });
  }
  // sharp refracting rim over a frosted core — the liquid-glass recipe
  function frostMarkup(w, h, map, mask, scale, frost) {
    return '<feImage href="' + map + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="map"/>' +
      '<feImage href="' + mask + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="mask"/>' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="' + frost + '" edgeMode="duplicate" result="frost"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + scale.toFixed(2) + '" xChannelSelector="R" yChannelSelector="G" result="bent"/>' +
      '<feGaussianBlur in="bent" stdDeviation="0.8" result="bentSoft"/>' +
      '<feComposite in="bentSoft" in2="mask" operator="in" result="rim"/>' +
      '<feComposite in="frost" in2="mask" operator="out" result="core"/>' +
      '<feComposite in="rim" in2="core" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>';
  }
  function filterMarkup(w, h, href, scale, chroma, soften) {
    var s = '<feImage href="' + href + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="map"/>';
    if (chroma) {
      var mats = ['1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0'];
      for (var i = 0; i < 3; i++) {
        s += '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (scale * (1 + chroma * i)).toFixed(2) + '" xChannelSelector="R" yChannelSelector="G" result="d' + i + '"/>' +
          '<feColorMatrix in="d' + i + '" type="matrix" values="' + mats[i] + '" result="c' + i + '"/>';
      }
      s += '<feBlend in="c0" in2="c1" mode="screen" result="c01"/><feBlend in="c01" in2="c2" mode="screen" result="out"/>';
    } else {
      s += '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + scale.toFixed(2) + '" xChannelSelector="R" yChannelSelector="G" result="out"/>';
    }
    s += '<feGaussianBlur in="out" stdDeviation="' + (soften || 0.45) + '"/>';
    return s;
  }

  // build queue: idle slices, the most visible surfaces first (priority 0 = first)
  var lqQueue = [], lqPumping = false;
  var onIdle = window.requestIdleCallback
    ? function (fn) { requestIdleCallback(fn, { timeout: 500 }); }
    : function (fn) { setTimeout(function () { fn(null); }, 40); };
  function pumpLiquid() {
    if (lqPumping || !lqQueue.length) return;
    lqPumping = true;
    onIdle(function (deadline) {
      lqPumping = false;
      var n = 0;
      while (lqQueue.length && (n === 0 || !deadline || deadline.timeRemaining() > 4)) { refreshLiquid(lqQueue.shift()); n++; }
      pumpLiquid();
    });
  }
  var liquidRO = LIQUID && 'ResizeObserver' in window ? new ResizeObserver(function (entries) {
    entries.forEach(function (e) {
      for (var i = 0; i < liquids.length; i++) if (liquids[i].el === e.target) scheduleLiquid(liquids[i]);
    });
  }) : null;
  function scheduleLiquid(item) {
    clearTimeout(item.timer);
    item.timer = setTimeout(function () {
      if (lqQueue.indexOf(item) < 0) lqQueue.push(item);
      lqQueue.sort(function (a, b) { return a.o.priority - b.o.priority; });
      pumpLiquid();
    }, item.w ? 160 : 0);
  }
  function refreshLiquid(item) {
    var el = item.el, o = item.o;
    var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h || !el.isConnected) return;
    if (w === item.w && h === item.h) return;
    if (w * h > 1600000) return; // never build giant filters
    item.w = w; item.h = h;
    var seq = ++item.seq;
    var r = o.kind === 'lens' ? 0 : parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    var job = o.kind === 'lens' ? lensMapFor(w, o) : edgeMapFor(w, h, r, o);
    job.then(function (m) {
      if (seq !== item.seq || !m.map) return; // a newer size won the race
      var markup;
      if (o.kind === 'lens') markup = filterMarkup(w, h, m.map, w * (o.scale || 0.5), o.chroma, o.soften);
      else if (o.frost) markup = frostMarkup(w, h, m.map, m.mask, o.scale, o.frost);
      else markup = filterMarkup(w, h, m.map, o.scale, o.chroma, o.soften);
      var id = 'lg-f' + (++filterSeq);
      var f = document.createElementNS(NS, 'filter');
      f.setAttribute('id', id);
      f.setAttribute('x', '0'); f.setAttribute('y', '0');
      f.setAttribute('width', String(w)); f.setAttribute('height', String(h));
      f.setAttribute('filterUnits', 'userSpaceOnUse');
      f.setAttribute('primitiveUnits', 'userSpaceOnUse');
      f.setAttribute('color-interpolation-filters', 'sRGB');
      f.innerHTML = markup;
      defs.appendChild(f);
      el.style.backdropFilter = 'url(#' + id + ') ' + o.css;
      el.classList.add('is-liquid');
      item.urls = [m.map, m.mask].filter(Boolean);
      var old = item.filter;
      item.filter = f;
      if (old) setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 120);
    });
  }
  function liquid(el, o) {
    if (!LIQUID || !el || !defs) return null;
    if (o.priority == null) o.priority = 5;
    var item = { el: el, o: o, w: 0, h: 0, timer: 0, filter: null, seq: 0, urls: [] };
    liquids.push(item);
    if (liquidRO) liquidRO.observe(el); else scheduleLiquid(item);
    return item;
  }

  /* =========================================================================
   * Living light — a low-resolution WebGL field of deep sea, lagoon currents,
   * a low sun and water caustics; the light under the cursor follows on a spring.
   * ========================================================================= */
  var BG = null;
  function createBG() {
    var wrap = $('.bg');
    var canvas = wrap && $('.bg__gl', wrap);
    if (!canvas) return null;
    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    } catch (e) { gl = null; }
    if (!gl) return null;

    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
    var FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH',
      'precision highp float;',
      '#else',
      'precision mediump float;',
      '#endif',
      'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uMouseOn;uniform float uScroll;uniform float uPar;',
      'vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.0+2.0*fract(sin(p)*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
      ' return mix(mix(dot(hash(i),f),dot(hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);}',
      'float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+17.1;a*=0.5;}return s;}',
      'float caustic(vec2 p,float t){vec2 i=p;float c=1.0;float inten=0.005;',
      ' for(int n=0;n<4;n++){float tt=t*(1.0-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));',
      '  c+=1.0/length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));}',
      ' c/=4.0;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.0),0.0,1.0);}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;',
      ' vec2 s=vec2(uv.x*asp,uv.y);',
      ' vec2 p=vec2(s.x,s.y+uPar);float t=uTime;',
      ' vec2 q=vec2(fbm(p*0.9+vec2(0.0,t*0.035)),fbm(p*0.9+vec2(5.2,1.3)-t*0.03));',
      ' vec2 r=vec2(fbm(p*1.1+1.8*q+vec2(1.7,9.2)+t*0.025),fbm(p*1.1+1.8*q+vec2(8.3,2.8)-t*0.02));',
      ' float f=fbm(p*1.3+2.0*r);',
      ' vec3 abyss=vec3(0.006,0.045,0.058);vec3 deep=vec3(0.030,0.180,0.222);',
      ' vec3 lagoon=vec3(0.180,0.769,0.714);vec3 sunset=vec3(1.0,0.478,0.271);vec3 sun=vec3(1.0,0.784,0.341);',
      /* deep water, darker towards the bottom of the screen */
      ' vec3 col=mix(abyss,deep*1.12,clamp(0.36+f*1.3+uv.y*0.3,0.0,1.0));',
      /* the low sun lives in the top-right corner of the screen and dims as you dive */
      ' vec2 sp=vec2(asp*0.92,1.08);float sd=length((s-sp)*vec2(0.7,1.0));',
      ' float dive=1.0-0.4*uScroll;float nar=1.0+2.2*max(0.0,1.0-asp);',
      ' float halo=exp(-sd*sd*5.0*nar)*dive;float core=exp(-sd*sd*22.0*nar)*dive;',
      ' float veil=smoothstep(0.15,0.75,q.y+0.45*r.y)*exp(-sd*sd*2.6*nar)*dive;',
      /* lagoon currents: domain-warped ribbons, kept away from the sun so colours never go muddy */
      ' float cur=smoothstep(-0.06,0.42,r.x+0.1*sin(t*0.07))*smoothstep(1.0,0.08,abs(f)*1.6);',
      ' cur*=1.0-0.85*smoothstep(0.0,0.5,halo+veil*0.6);',
      ' col+=lagoon*cur*0.46;',
      ' vec2 lq=(s-vec2(asp*0.08,0.1))*vec2(0.62,1.0);',
      ' col+=lagoon*0.2*exp(-dot(lq,lq)*2.4)*(0.6+0.4*cur);',
      /* a dark band separates warm from cool, then warm light on top */
      ' col*=1.0-0.5*smoothstep(0.02,0.3,halo+veil*0.5);',
      ' col+=sunset*(halo*0.62+veil*0.34)+sun*core*0.85;',
      ' float c=caustic(p*4.0+r*1.3-250.0,t*0.3+23.0);',
      ' col+=(lagoon*0.65+sun*0.2)*c*(0.05+0.32*cur)+sun*c*halo*0.35;',
      ' vec2 m=vec2(uMouse.x*asp,1.0-uMouse.y);float md=length(s-m);',
      ' float ml=exp(-md*md*9.0)*uMouseOn;',
      ' col+=mix(lagoon,sun,0.5)*ml*0.24+sun*c*ml*0.75;',
      ' vec2 vv=uv-vec2(0.45,0.55);col*=1.0-dot(vv,vv)*0.9;',
      ' col=1.0-exp(-col*1.25);',
      ' gl_FragColor=vec4(col,1.0);}'
    ].join('\n');

    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[glass] shader', gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uTime', 'uMouse', 'uMouseOn', 'uScroll', 'uPar'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var W = 0, H = 0, lost = false, shown = false;
    function resize() {
      var s = mqMobile.matches ? 0.2 : 0.3;
      var w = Math.max(8, Math.round(innerWidth * s)), h = Math.max(8, Math.round(innerHeight * s));
      if (w === W && h === H) return;
      W = w; H = h;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    function render(t, mx, my, on, scroll, par) {
      if (lost) return;
      gl.uniform2f(U.uRes, W, H);
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uMouse, mx, my);
      gl.uniform1f(U.uMouseOn, on);
      gl.uniform1f(U.uScroll, scroll);
      gl.uniform1f(U.uPar, par);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) { shown = true; wrap.classList.add('is-ready'); }
    }
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; wrap.classList.remove('is-ready'); });
    canvas.addEventListener('webglcontextrestored', function () { location.reload(); });
    resize();
    return { resize: resize, render: render, get lost() { return lost; } };
  }
  // the CSS gradients underneath carry the first paint; the living light fades in over them
  var bgTried = false, bgWaiters = [];
  function startBG() {
    if (bgTried) return;
    bgTried = true;
    BG = createBG();
    if (BG) { if (animated()) wake(); else bgStatic(); }
    bgWaiters.splice(0).forEach(function (fn) { setTimeout(fn, 60); });
  }
  function afterBG(fn) { if (bgTried) fn(); else bgWaiters.push(fn); }
  requestAnimationFrame(function () { setTimeout(startBG, 0); });

  var light = { x: new Spring(0.7, 22, 8.5, 0.0005), y: new Spring(0.32, 22, 8.5, 0.0005), on: new Spring(0.5, 18, 8, 0.001) };
  var bgTime = 14;
  var bgFrame = 0;
  var docH = 1;
  function measureDoc() { docH = Math.max(1, document.documentElement.scrollHeight - innerHeight); }
  function scrollProg() { return clamp(window.scrollY / docH, 0, 1); }
  function parallax() { return reduced ? 0 : window.scrollY / Math.max(1, innerHeight) * 0.1; }
  function bgStatic() { if (BG) { BG.resize(); BG.render(bgTime, light.x.x, light.y.x, light.on.x, scrollProg(), parallax()); } }

  var floaters = $$('.floater');
  var heroInView = true;
  tickers.push(function (dt, now) {
    if (!BG || BG.lost || !animated()) return false;
    bgTime += dt;
    var active = mqFine.matches && P.seen && P.inside && now - P.last < 4000;
    if (active) {
      light.x.t = P.x / innerWidth; light.y.t = P.y / innerHeight; light.on.t = 1;
    } else if (!lens.dragging) {
      light.x.t = 0.55 + 0.26 * Math.sin(bgTime * 0.11);
      light.y.t = 0.36 + 0.18 * Math.cos(bgTime * 0.083);
      light.on.t = 0.55;
    }
    light.x.step(dt); light.y.step(dt); light.on.step(dt);
    bgFrame++;
    var idle = now - P.last > 1600 && !lens.dragging;
    if (!idle || bgFrame % 2 === 0) BG.render(bgTime, light.x.x, light.y.x, light.on.x, scrollProg(), parallax());
    if (heroInView && floaters.length && !isPreview) {
      for (var i = 0; i < floaters.length; i++) {
        var depth = (i + 1) * 14;
        floaters[i].style.setProperty('--fx', ((0.5 - light.x.x) * depth).toFixed(2) + 'px');
        floaters[i].style.setProperty('--fy', ((0.4 - light.y.x) * depth).toFixed(2) + 'px');
      }
    }
    return true;
  });

  /* ---------- hanging prepositions (RU typography) ---------- */
  var WJ = '⁠'; // word joiner: invisible, forbids a line break on either side
  function glue(scope) {
    var ru = D.lang === 'ru';
    $$('[data-i18n]', scope || document.body).forEach(function (el) {
      if (el.children.length || el.closest('.dz-dock')) return;
      var s = el.textContent, o = s;
      if (ru) {
        s = s.replace(/(^|[\s («])([а-яёА-ЯЁ]{1,2}) (?=\S)/g, '$1$2 ');
        s = s.replace(/( )([а-яёА-ЯЁ]{1,2}) (?=\S)/g, '$1$2 ');
        s = s.replace(/ ([—–])/g, ' $1');
      }
      // short hyphenated words never split at the hyphen ("дизайн-|системы", "веб-|приложения")
      s = s.replace(/([A-Za-zА-яЁё]{2,})-(?!⁠)([A-Za-zА-яЁё]{2,})/g, function (m, a, b) {
        return (a + b).length <= 14 ? a + '-' + WJ + b : m;
      });
      // numeric ranges stay whole ("1–5", "2–6"), and a range at the very end keeps its word
      s = s.replace(/(\d)⁠?([–-])⁠?(\d)/g, '$1' + WJ + '$2' + WJ + '$3');
      s = s.replace(/ (\d+⁠[–-]⁠\d+)$/, ' $1');
      if (s !== o) el.textContent = s;
    });
  }

  /* ---------- in-page anchors glide (no CSS smooth-scroll: focus jumps stay instant) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var id = a.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target || a.classList.contains('dz-skip')) return;
    e.preventDefault();
    var margin = (parseFloat(getComputedStyle(target).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0);
    var top = id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - margin;
    window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    try { history.pushState(null, '', '#' + id); } catch (err) { /* file:// */ }
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- keyboard focus never ends up under the header or the style dock ----------
   * (scroll-padding covers most cases; Chrome skips the scroll for partly visible elements) */
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el || !el.matches || isPreview || el.closest('.site-header, .dz-dock')) return;
    try { if (!el.matches(':focus-visible')) return; } catch (err) { return; }
    var box = el.closest('.chip') || el;
    var y0 = window.scrollY;
    requestAnimationFrame(function () {
      if (document.activeElement !== el || Math.abs(window.scrollY - y0) > 240) return; // someone else scrolled: leave it
      var r = box.getBoundingClientRect();
      var dock = parseFloat(getComputedStyle(root).getPropertyValue('--dz-dock-space')) || 96;
      var top = 92, bottom = innerHeight - dock - 16;
      if (r.height > bottom - top || r.bottom < 0 || r.top > innerHeight) return; // only nudge what is on screen
      var dy = r.bottom > bottom ? r.bottom - bottom : r.top < top ? r.top - top : 0;
      if (Math.abs(dy) > 1 && Math.abs(dy) <= r.height + 40) window.scrollBy({ top: dy, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  function hideEmptyBadges() {
    $$('.plan__badge').forEach(function (b) { b.hidden = !b.textContent.trim(); });
  }
  function updateEngine() {
    var el = $('.engine__text');
    if (!el) return;
    var key = 'x.glassmorphism.engine.' + (LIQUID ? 'liquid' : 'frosted');
    el.setAttribute('data-i18n', key);
    el.textContent = D.t(key);
  }

  /* =========================================================================
   * Hero droplet lens
   * Desktop: rests on the last word of the personality line (never on line 1,
   * never on the buttons) and follows the cursor. Touch: drops onto the word,
   * holds so the bend is visible, then glides to the word's end; drag it
   * sideways or after a short press — vertical swipes still scroll the page.
   * ========================================================================= */
  var lens = (function () {
    var hero = document.getElementById('top');
    var el = hero && $('.lens', hero);
    var api = { dragging: false, measure: function () {} };
    if (!el) return api;
    var caustic = $('.lens-caustic', hero);
    var h1 = $('.hero__title', hero);
    var line1 = $('.hero__line', hero);
    var title = $('.hero__this', hero);
    var actions = $('.hero__actions', hero);
    var x = new Spring(0, 125, 15, 0.05), y = new Spring(0, 125, 15, 0.05);
    var sc = new Spring(0, 85, 8.5, 0.002);
    var size = 0, cw = 0, ch = 0, heroW = 0, heroH = 0, restScale = 1;
    var onWord = { x: 0, y: 0 }, beside = { x: 0, y: 0 }, rest = onWord;
    var glided = false;            // touch: moved from the word to its end
    var free = null;               // where a thrown droplet came to rest
    var mode = 'rest';             // rest | follow | drag
    var started = false, interacted = false;
    var dragOff = { x: 0, y: 0 };
    var touch = mqCoarse.matches;

    function lastWordRect() {
      var node = title && title.firstChild;
      if (!node || node.nodeType !== 3) return title ? title.getBoundingClientRect() : null;
      var txt = node.nodeValue.replace(/[\s.!?…]+$/, '');
      var start = Math.max(txt.lastIndexOf(' '), txt.lastIndexOf(' ')) + 1;
      try {
        var rg = document.createRange();
        rg.setStart(node, start);
        rg.setEnd(node, txt.length);
        var rects = rg.getClientRects();
        if (rects.length) return rects[rects.length - 1];
      } catch (e) { /* fall through */ }
      return title.getBoundingClientRect();
    }
    function measure() {
      var hr = hero.getBoundingClientRect();
      heroW = hr.width; heroH = hr.height;
      // desktop: the droplet is sized from the type (≈1.3× the personality line's cap height)
      if (!touch && h1) {
        var fs = parseFloat(getComputedStyle(h1).fontSize) || 100;
        hero.style.setProperty('--size', Math.round(clamp(fs * 1.28, 112, 176)) + 'px');
      } else hero.style.removeProperty('--size');
      size = el.offsetWidth;
      if (caustic) { cw = caustic.offsetWidth; ch = caustic.offsetHeight; }
      var R = size / 2;
      var w = lastWordRect();
      if (!w) { onWord = { x: heroW * 0.66, y: heroH * 0.5 }; beside = onWord; }
      else {
        var wl = w.left - hr.left, wr = w.right - hr.left, wt = w.top - hr.top, wh = w.height;
        var cx = wl + w.width * 0.5, cy = wt + wh * 0.54;
        // never straddle line 1: at most 10% of the lens may rise above the personality line
        var l1 = line1 ? line1.getBoundingClientRect() : null;
        var lo = l1 ? l1.bottom - hr.top + size * 0.4 : -1e9;
        cy = Math.max(cy, lo);
        restScale = 1;
        // never rest on the buttons: slide left along the line, then lift, then shrink a little
        var ca = actions && actions.getBoundingClientRect();
        if (ca && ca.width) {
          var pad = 14, al = ca.left - hr.left - pad, ar = ca.right - hr.left + pad, at = ca.top - hr.top - pad, ab = ca.bottom - hr.top + pad;
          var hits = function (px, py, rr) { return px + rr > al && px - rr < ar && py + rr > at && py - rr < ab; };
          if (hits(cx, cy, R)) {
            var nx = al - R;
            if (nx >= wl - R * 0.35) cx = nx;
            else {
              var ny = at - R;
              var floor = l1 ? l1.bottom - hr.top + size * 0.25 : -1e9;
              if (ny >= floor) cy = ny;
              else { cy = floor; restScale = clamp((at - floor) / R, 0.72, 1); }
            }
          }
        }
        onWord = { x: clamp(cx, R, heroW - R), y: clamp(cy, R, heroH - R) };
        // touch: after the hold, glide to the end of the word (≈30% of the lens over the letters)
        var bx = Math.min(wr + size * 0.2, heroW - R - 6);
        beside = { x: clamp(bx, R, heroW - R), y: onWord.y };
      }
      rest = touch && glided ? beside : onWord;
      if (!started || !animated()) { x.snap(rest.x); y.snap(rest.y); }
      if (started && !animated()) sc.snap(restScale);
      else if (started && mode !== 'drag') sc.t = restScale;
      if (free) { free.x = clamp(free.x, R, heroW - R); free.y = clamp(free.y, R, heroH - R); }
      paint();
    }
    api.measure = measure;

    function paint() {
      var s = sc.x;
      var vx = x.v, vy = y.v, speed = Math.sqrt(vx * vx + vy * vy);
      var st = Math.min(speed / 2800, 0.22);
      var ang = Math.atan2(vy, vx) * 57.2958;
      el.style.transform = 'translate3d(' + (x.x - size / 2).toFixed(2) + 'px,' + (y.x - size / 2).toFixed(2) + 'px,0) rotate(' + ang.toFixed(2) + 'deg) scale(' + (s * (1 + st)).toFixed(4) + ',' + (s * (1 - st * 0.55)).toFixed(4) + ') rotate(' + (-ang).toFixed(2) + 'deg)';
      if (caustic) caustic.style.transform = 'translate3d(' + (x.x - cw / 2 + size * 0.16).toFixed(2) + 'px,' + (y.x + size * 0.46 - ch / 2).toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
    }
    function heroPoint(cx, cy) {
      var hr = hero.getBoundingClientRect();
      return { x: cx - hr.left, y: cy - hr.top };
    }

    // desktop: the droplet follows the cursor across the hero
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !interactive() || mode === 'drag') return;
      var p = heroPoint(e.clientX, e.clientY);
      mode = 'follow';
      x.t = clamp(p.x, size * 0.2, heroW - size * 0.2);
      y.t = clamp(p.y, size * 0.2, heroH - size * 0.2);
      sc.t = 1;
      wake();
    });
    hero.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || mode === 'drag') return;
      mode = 'rest';
      sc.t = restScale;
      wake();
    });
    window.addEventListener('scroll', function () {
      if (mode === 'follow' && P.inside) {
        var p = heroPoint(P.x, P.y);
        x.t = clamp(p.x, size * 0.2, heroW - size * 0.2);
        y.t = clamp(p.y, size * 0.2, heroH - size * 0.2);
        wake();
      }
    }, { passive: true });

    // touch: drag sideways at once, or after a short press in any direction;
    // a vertical swipe is left to the browser (touch-action: pan-y) and scrolls the page
    var lastMove = { x: 0, y: 0, t: 0, vx: 0, vy: 0 };
    var press = null;
    function beginDrag(cx, cy, id) {
      if (press) { clearTimeout(press.timer); press = null; }
      try { el.setPointerCapture(id); } catch (err) { /* noop */ }
      var p = heroPoint(cx, cy);
      mode = 'drag'; api.dragging = true; interacted = true;
      dragOff.x = p.x - x.x; dragOff.y = p.y - y.x;
      x.k = y.k = 420; x.c = y.c = 38;
      sc.t = 1.06;
      lastMove = { x: p.x, y: p.y, t: performance.now(), vx: 0, vy: 0 };
      el.classList.add('is-dragging');
      wake();
    }
    el.addEventListener('pointerdown', function (e) {
      if (!touch || isPreview) return;
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') { e.preventDefault(); beginDrag(e.clientX, e.clientY, e.pointerId); return; }
      press = { id: e.pointerId, x: e.clientX, y: e.clientY };
      press.timer = setTimeout(function () { if (press) beginDrag(press.x, press.y, press.id); }, 240);
    });
    el.addEventListener('pointermove', function (e) {
      if (mode !== 'drag') {
        if (!press || e.pointerId !== press.id) return;
        var dx = e.clientX - press.x, dy = e.clientY - press.y;
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.2) beginDrag(press.x, press.y, press.id);
        else if (Math.abs(dy) > 10) { clearTimeout(press.timer); press = null; }
        if (mode !== 'drag') return;
      }
      var p = heroPoint(e.clientX, e.clientY), now = performance.now(), dt = Math.max(1, now - lastMove.t);
      lastMove.vx = lastMove.vx * 0.6 + (p.x - lastMove.x) / dt * 0.4;
      lastMove.vy = lastMove.vy * 0.6 + (p.y - lastMove.y) / dt * 0.4;
      lastMove.x = p.x; lastMove.y = p.y; lastMove.t = now;
      x.t = clamp(p.x - dragOff.x, size / 2, heroW - size / 2);
      y.t = clamp(p.y - dragOff.y, size / 2, heroH - size / 2);
      light.x.t = (x.t + hero.getBoundingClientRect().left) / innerWidth;
      light.y.t = (y.t + hero.getBoundingClientRect().top) / innerHeight;
      light.on.t = 1;
      wake();
    });
    // once a drag has begun, keep the page still under the finger
    el.addEventListener('touchmove', function (e) { if (mode === 'drag' && e.cancelable) e.preventDefault(); }, { passive: false });
    el.addEventListener('contextmenu', function (e) { if (touch) e.preventDefault(); });
    function release() {
      if (press) { clearTimeout(press.timer); press = null; }
      if (mode !== 'drag') return;
      mode = 'rest'; api.dragging = false;
      x.k = y.k = 125; x.c = y.c = 15;
      sc.t = 1;
      var throwX = reduced ? 0 : clamp(lastMove.vx, -3, 3) * 260, throwY = reduced ? 0 : clamp(lastMove.vy, -3, 3) * 260;
      free = { x: clamp(x.t + throwX, size / 2, heroW - size / 2), y: clamp(y.t + throwY, size / 2, heroH - size / 2) };
      // never park the droplet on top of the buttons: a tap there should press them, not grab glass
      var cta = $('.hero__cta', hero);
      if (cta) {
        var hr = hero.getBoundingClientRect(), cr = cta.getBoundingClientRect();
        var top = cr.top - hr.top, bottom = cr.bottom - hr.top;
        if (free.y + size * 0.42 > top && free.y - size * 0.42 < bottom) free.y = Math.max(size / 2, top - size * 0.5 - 10);
      }
      el.classList.remove('is-dragging');
      wake();
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);

    tickers.push(function (dt, now) {
      if (!started) return false;
      var anim = animated();
      if (mode === 'rest') {
        var base = free || rest;
        var wob = anim && !free ? 1 : anim ? 0.6 : 0;
        x.t = base.x + Math.sin(now / 1000 * 0.62) * 11 * wob;
        y.t = base.y + Math.cos(now / 1000 * 0.47) * 8 * wob;
      }
      var m = x.step(dt);
      m = y.step(dt) || m;
      m = sc.step(dt) || m;
      paint();
      return (m || (anim && heroInView && mode === 'rest')) && heroInView;
    });

    function start() {
      if (started) return;
      started = true;
      if (touch) el.classList.add('is-touch');
      if (touch && !animated()) glided = true; // no hold-and-glide without motion: rest at the word's end
      measure();
      el.classList.add('is-ready');
      if (caustic) caustic.classList.add('is-ready');
      if (!animated()) { sc.snap(restScale); x.snap(rest.x); y.snap(rest.y); paint(); return; }
      x.snap(rest.x + size * 0.1); y.snap(rest.y - size * 0.9);
      x.t = rest.x; y.t = rest.y;
      sc.snap(0.2); sc.t = restScale;
      wake();
      if (touch) {
        // hold on the word long enough to see it bend, then slide aside so it reads again
        setTimeout(function () {
          if (interacted || free) return;
          glided = true; rest = beside;
          x.k = y.k = 60; x.c = y.c = 12;
          setTimeout(function () { if (mode !== 'drag') { x.k = y.k = 125; x.c = y.c = 15; } }, 1600);
          wake();
        }, 3300);
      }
    }
    api.start = start;
    api.el = el;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        heroInView = es[0].isIntersecting;
        hero.classList.toggle('is-paused', !heroInView);
        if (heroInView) wake();
      }).observe(hero);
    }
    return api;
  })();

  /* =========================================================================
   * Pointer-following specular highlight on every visible glass surface
   * ========================================================================= */
  function initSpecular() {
    if (!mqFine.matches || !interactive()) return;
    var els = $$('.glass:not(.tilt), .site-header');
    var visible = [];
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = visible.indexOf(e.target);
        if (e.isIntersecting && i < 0) visible.push(e.target);
        if (!e.isIntersecting && i > -1) visible.splice(i, 1);
      });
    });
    els.forEach(function (el) { io.observe(el); });
    var pending = false;
    function update() {
      pending = false;
      var rects = visible.map(function (el) { return el.getBoundingClientRect(); });
      for (var i = 0; i < visible.length; i++) {
        var r = rects[i];
        if (!r.width) continue;
        visible[i].style.setProperty('--lx', clamp((P.x - r.left) / r.width * 100, -25, 125).toFixed(1) + '%');
        visible[i].style.setProperty('--ly', clamp((P.y - r.top) / r.height * 100, -35, 135).toFixed(1) + '%');
      }
    }
    function ask() { if (!pending) { pending = true; requestAnimationFrame(update); } }
    window.addEventListener('pointermove', ask, { passive: true });
    window.addEventListener('scroll', function () { if (P.seen) ask(); }, { passive: true });
  }

  /* =========================================================================
   * 3D tilt toward the pointer (≤ 6°) on springs
   * ========================================================================= */
  function initTilt() {
    if (!mqFine.matches || !interactive()) return;
    var MAX = 6;
    var active = [];
    $$('.tilt').forEach(function (el) {
      var s = { el: el, rx: new Spring(0, 140, 15, 0.01), ry: new Spring(0, 140, 15, 0.01) };
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
        s.ry.t = (px - 0.5) * 2 * MAX;
        s.rx.t = -(py - 0.5) * 2 * MAX;
        el.style.setProperty('--lx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--ly', (py * 100).toFixed(1) + '%');
        if (active.indexOf(s) < 0) active.push(s);
        wake();
      });
      el.addEventListener('pointerleave', function () { s.rx.t = 0; s.ry.t = 0; wake(); });
    });
    tickers.push(function (dt) {
      for (var i = active.length - 1; i >= 0; i--) {
        var s = active[i];
        var m = s.rx.step(dt);
        m = s.ry.step(dt) || m;
        s.el.style.transform = 'perspective(1100px) rotateX(' + s.rx.x.toFixed(3) + 'deg) rotateY(' + s.ry.x.toFixed(3) + 'deg)';
        s.el.style.setProperty('--tx', (s.rx.x / MAX).toFixed(3));
        s.el.style.setProperty('--ty', (s.ry.x / MAX).toFixed(3));
        if (!m && s.rx.t === 0 && s.ry.t === 0) {
          s.el.style.transform = '';
          active.splice(i, 1);
        }
      }
      return active.length > 0;
    });
  }

  /* =========================================================================
   * Morphing liquid capsules: services list + nav scrollspy
   * ========================================================================= */
  function capsule(cap, axis) {
    var pos = new Spring(0, 230, 25, 0.05), len = new Spring(0, 230, 25, 0.05);
    var shown = false;
    var api = {
      to: function (p, l) {
        if (!shown || !animated()) { pos.snap(p); len.snap(l); }
        pos.t = p; len.t = l;
        if (!shown) { shown = true; cap.classList.add('is-on'); }
        paint();
        wake();
      },
      hide: function () { shown = false; cap.classList.remove('is-on'); },
      tick: function (dt) {
        var m = pos.step(dt);
        m = len.step(dt) || m;
        paint();
        return m;
      }
    };
    function paint() {
      var stretch = 1 + Math.min(Math.abs(pos.v) / 5000, 0.06);
      if (axis === 'y') {
        cap.style.height = len.x.toFixed(2) + 'px';
        cap.style.transform = 'translate3d(0,' + pos.x.toFixed(2) + 'px,0) scale(' + (2 - stretch).toFixed(4) + ',' + stretch.toFixed(4) + ')';
      } else {
        cap.style.width = len.x.toFixed(2) + 'px';
        cap.style.transform = 'translate3d(' + pos.x.toFixed(2) + 'px,0,0) scale(' + stretch.toFixed(4) + ',' + (2 - stretch).toFixed(4) + ')';
      }
    }
    tickers.push(function (dt) { return api.tick(dt); });
    return api;
  }

  var services = (function () {
    var panel = $('.services-panel');
    var cap = panel && $('.svc-capsule', panel);
    var rows = panel ? $$('.service', panel) : [];
    var api = { refresh: function () {} };
    if (!cap || !rows.length) return api;
    var c = capsule(cap, 'y');
    var current = null;
    function target(row) {
      if (current && current !== row) current.classList.remove('is-active');
      current = row;
      if (!row) { c.hide(); return; }
      row.classList.add('is-active');
      var pr = panel.getBoundingClientRect(), rr = row.getBoundingClientRect();
      c.to(rr.top - pr.top, rr.height);
    }
    api.refresh = function () { if (current) target(current); };
    if (mqFine.matches && !isPreview) {
      rows.forEach(function (row) { row.addEventListener('pointerenter', function () { target(row); }); });
      panel.addEventListener('pointerleave', function () { target(null); });
    } else if ('IntersectionObserver' in window && !isPreview) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) target(e.target); });
      }, { rootMargin: '-44% 0px -44% 0px' });
      rows.forEach(function (row) { io.observe(row); });
    }
    liquid(cap, { kind: 'edge', bezel: 18, strength: 1, scale: 34, css: 'brightness(1.06) saturate(1.25)', priority: 3 });
    return api;
  })();

  var nav = (function () {
    var header = $('.site-header');
    var navEl = header && $('.site-nav', header);
    var cap = navEl && $('.nav-capsule', navEl);
    var links = navEl ? $$('a', navEl) : [];
    var btn = header && $('.menu-btn', header);
    var api = { refresh: function () {}, close: function () {} };
    if (!header) return api;
    var c = cap ? capsule(cap, 'x') : null;
    var activeId = null;

    function setActive(id) {
      if (id === activeId) return;
      activeId = id;
      var link = null;
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) { a.setAttribute('aria-current', 'location'); link = a; } else a.removeAttribute('aria-current');
      });
      place(link);
    }
    function place(link) {
      if (!c) return;
      if (!link || mqNarrow.matches) { c.hide(); return; }
      var nr = navEl.getBoundingClientRect(), lr = link.getBoundingClientRect();
      c.to(lr.left - nr.left, lr.width);
    }
    api.refresh = function () {
      var id = activeId; activeId = null;
      setActive(id);
    };
    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      var id = D.currentSection();
      setActive(id === 'top' ? null : id);
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; onScroll(); });
    }, { passive: true });
    onScroll();

    // mobile: the pill morphs into a sheet
    var open = false;
    function setOpen(v, focusBtn) {
      open = v;
      header.classList.toggle('is-open', v);
      if (btn) {
        btn.setAttribute('aria-expanded', v ? 'true' : 'false');
        var key = v ? 'a11y.close' : 'a11y.menu';
        btn.setAttribute('data-i18n-attr', 'aria-label:' + key);
        btn.setAttribute('aria-label', D.t(key));
        if (focusBtn) btn.focus();
      }
      // the sheet sits before the button in the DOM: take focus into it, so Tab walks the links
      if (v && links[0]) links[0].focus({ preventScroll: true });
    }
    api.close = function () { if (open) setOpen(false); };
    if (btn) btn.addEventListener('click', function () { setOpen(!open); });
    // Tab out of the header (past the button) closes the sheet instead of leaving it over the page
    header.addEventListener('focusout', function (e) {
      if (open && e.relatedTarget && !header.contains(e.relatedTarget)) setOpen(false);
    });
    $$('a', header).forEach(function (a) {
      if (a.classList.contains('brand')) return;
      a.addEventListener('click', function () { if (open) setOpen(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false, true); });
    document.addEventListener('click', function (e) { if (open && !header.contains(e.target)) setOpen(false); });
    mqNarrow.addEventListener && mqNarrow.addEventListener('change', function () { if (!mqNarrow.matches) setOpen(false); api.refresh(); });

    if (cap) liquid(cap, { kind: 'edge', bezel: 14, strength: 1, scale: 26, css: 'brightness(1.08) saturate(1.25)', priority: 2 });
    liquid(header, { kind: 'edge', bezel: 20, strength: 1, scale: 52, frost: 7, css: 'saturate(1.7)', priority: 0 });
    return api;
  })();

  /* =========================================================================
   * Case art — glowing motifs under glass lenses
   * ========================================================================= */
  var C = { L: '#2EC4B6', LH: '#8CE8DF', S: '#FF7A45', SH: '#FFB18F', U: '#FFC857', W: '#F3FAF8', D: '#0B3C49' };
  function glowFilter(id, sd) {
    return '<filter id="' + id + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="' + (sd || 5) + '" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  }
  function svgOpen(id) {
    return '<svg class="art" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" xmlns="' + NS + '" focusable="false" aria-hidden="true"><defs>' + glowFilter(id + 'g', 5) + glowFilter(id + 'G', 11);
  }
  function stars(list, cls) {
    return list.map(function (s) { return '<circle class="' + (cls || 'twinkle') + '" cx="' + s[0] + '" cy="' + s[1] + '" r="' + (s[2] || 1.3) + '" fill="#fff"/>'; }).join('');
  }
  var ART = {
    latte: function (id) {
      return svgOpen(id) +
        '<radialGradient id="' + id + 'day" cx="16%" cy="18%" r="75%"><stop offset="0" stop-color="' + C.U + '" stop-opacity=".62"/><stop offset=".4" stop-color="' + C.S + '" stop-opacity=".25"/><stop offset="1" stop-color="' + C.S + '" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + id + 'night" x1="0" y1="0" x2="1" y2="0"><stop offset=".38" stop-color="#03171D" stop-opacity="0"/><stop offset=".8" stop-color="#03171D" stop-opacity=".88"/></linearGradient>' +
        '<radialGradient id="' + id + 'cof" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#FFB27A"/><stop offset=".45" stop-color="' + C.S + '"/><stop offset="1" stop-color="#7A2E14"/></radialGradient>' +
        '<radialGradient id="' + id + 'cream" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFE4C0"/></radialGradient>' +
        '</defs>' +
        '<rect width="400" height="320" fill="url(#' + id + 'day)"/>' +
        '<rect width="400" height="320" fill="url(#' + id + 'night)"/>' +
        '<circle cx="62" cy="58" r="17" fill="' + C.U + '" filter="url(#' + id + 'G)"/>' +
        '<path d="M348 36a24 24 0 1 0 18 40a19 19 0 1 1-18-40z" fill="' + C.W + '" opacity=".92" filter="url(#' + id + 'g)"/>' +
        stars([[302, 34], [372, 112, 1.6], [320, 98], [356, 164], [290, 70, 1]]) +
        '<circle cx="200" cy="170" r="120" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.3)" stroke-width="1.2"/>' +
        '<circle cx="200" cy="170" r="104" fill="none" stroke="rgba(255,255,255,.1)"/>' +
        '<rect x="280" y="155" width="58" height="30" rx="15" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.5)" stroke-width="1.5"/>' +
        '<circle cx="200" cy="170" r="86" fill="#08303A" stroke="#FFE2B0" stroke-opacity=".75" stroke-width="3" filter="url(#' + id + 'g)"/>' +
        '<circle cx="200" cy="170" r="74" fill="url(#' + id + 'cof)"/>' +
        '<circle cx="200" cy="170" r="74" fill="none" stroke="' + C.U + '" stroke-opacity=".45" stroke-width="5" filter="url(#' + id + 'g)"/>' +
        '<path d="M200 216C163 192 149 165 165 146c12-14 30-9 35 6c5-15 23-20 35-6c16 19 2 46-35 70z" fill="url(#' + id + 'cream)"/>' +
        '<path d="M200 199c-23-15-29-31-19-41c8-8 16-3 19 5c3-8 11-13 19-5c10 10 4 26-19 41z" fill="none" stroke="#E7A06E" stroke-width="2.2" opacity=".75"/>' +
        '<path d="M200 184c-11-8-14-15-9-20c4-4 8-1 9 2c1-3 5-6 9-2c5 5 2 12-9 20z" fill="none" stroke="#E7A06E" stroke-width="2" opacity=".6"/>' +
        '<path d="M200 128v92" stroke="#C9703E" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>' +
        '<path class="flow flow--slow" d="M136 170a64 64 0 1 1 128 0a64 64 0 1 1-128 0" fill="none" stroke="' + C.W + '" stroke-width="2.4" stroke-linecap="round" opacity=".85" filter="url(#' + id + 'g)"/>' +
        '</svg>';
    },
    pulse: function (id) {
      var ecg = 'M-10 196H104L118 196L128 178L138 196L156 196L176 84L196 252L212 150L224 196L262 196L273 182L285 196H410';
      return svgOpen(id) +
        '<radialGradient id="' + id + 'glow" cx="44%" cy="30%" r="60%"><stop offset="0" stop-color="' + C.S + '" stop-opacity=".45"/><stop offset="1" stop-color="' + C.S + '" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + id + 'line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.L + '"/><stop offset=".45" stop-color="' + C.U + '"/><stop offset=".7" stop-color="' + C.S + '"/><stop offset="1" stop-color="' + C.L + '"/></linearGradient>' +
        '<pattern id="' + id + 'dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(255,255,255,.13)"/></pattern>' +
        '</defs>' +
        '<rect width="400" height="320" fill="url(#' + id + 'dots)"/>' +
        '<rect width="400" height="320" fill="url(#' + id + 'glow)"/>' +
        '<circle cx="176" cy="150" r="46" fill="none" stroke="' + C.L + '" stroke-opacity=".3"/>' +
        '<circle cx="176" cy="150" r="80" fill="none" stroke="' + C.L + '" stroke-opacity=".18"/>' +
        '<circle cx="176" cy="150" r="116" fill="none" stroke="' + C.L + '" stroke-opacity=".1"/>' +
        '<circle class="ring-out" cx="176" cy="84" r="30" fill="none" stroke="' + C.U + '" stroke-width="2"/>' +
        '<path d="' + ecg + '" fill="none" stroke="url(#' + id + 'line)" stroke-width="9" stroke-linejoin="round" opacity=".35" filter="url(#' + id + 'G)"/>' +
        '<path d="' + ecg + '" fill="none" stroke="url(#' + id + 'line)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path class="flow" d="' + ecg + '" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" filter="url(#' + id + 'g)"/>' +
        '<circle cx="176" cy="84" r="6.5" fill="' + C.U + '" filter="url(#' + id + 'G)"/><circle cx="176" cy="84" r="3" fill="#fff"/>' +
        '<rect x="28" y="266" width="64" height="9" rx="4.5" fill="' + C.L + '" opacity=".85"/>' +
        '<rect x="98" y="266" width="44" height="9" rx="4.5" fill="' + C.U + '" opacity=".85"/>' +
        '<rect x="148" y="266" width="26" height="9" rx="4.5" fill="' + C.S + '" filter="url(#' + id + 'g)"/>' +
        '</svg>';
    },
    route: function (id) {
      var streets = '';
      for (var gx = -80; gx <= 480; gx += 40) streets += '<path d="M' + gx + ' -80V400" stroke="rgba(255,255,255,' + (gx % 160 === 0 ? '.14' : '.06') + ')" stroke-width="' + (gx % 160 === 0 ? 3 : 1.2) + '"/>';
      for (var gy = -80; gy <= 400; gy += 40) streets += '<path d="M-80 ' + gy + 'H480" stroke="rgba(255,255,255,' + (gy % 120 === 0 ? '.14' : '.06') + ')" stroke-width="' + (gy % 120 === 0 ? 3 : 1.2) + '"/>';
      var blocks = [[4, 4], [5, 2], [1, 5], [7, 6], [2, 1], [8, 3]].map(function (b) { return '<rect x="' + (b[0] * 40 + 6) + '" y="' + (b[1] * 40 + 6) + '" width="28" height="28" rx="6" fill="rgba(255,255,255,.05)"/>'; }).join('');
      var route = 'M40 80H160V160H240V240H320';
      var stops = [[40, 80], [160, 160], [240, 240], [320, 240]];
      return svgOpen(id) +
        '<radialGradient id="' + id + 'glow" cx="60%" cy="45%" r="60%"><stop offset="0" stop-color="' + C.L + '" stop-opacity=".22"/><stop offset="1" stop-color="' + C.L + '" stop-opacity="0"/></radialGradient>' +
        '</defs>' +
        '<rect width="400" height="320" fill="url(#' + id + 'glow)"/>' +
        '<g transform="rotate(-14 200 160) translate(8 -12)">' + streets + blocks +
        '<path d="M-60 300C40 250 100 330 200 280S340 200 470 250" fill="none" stroke="' + C.L + '" stroke-opacity=".28" stroke-width="26" stroke-linecap="round"/>' +
        '<path d="M-60 300C40 250 100 330 200 280S340 200 470 250" fill="none" stroke="' + C.LH + '" stroke-opacity=".55" stroke-width="1.6" filter="url(#' + id + 'g)"/>' +
        '<path d="' + route + '" fill="none" stroke="' + C.S + '" stroke-width="10" stroke-linejoin="round" opacity=".4" filter="url(#' + id + 'G)"/>' +
        '<path d="' + route + '" fill="none" stroke="' + C.S + '" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path class="flow" d="' + route + '" fill="none" stroke="' + C.U + '" stroke-width="4" stroke-linecap="round" filter="url(#' + id + 'g)"/>' +
        stops.map(function (s, i) {
          return (i === 1 ? '<circle class="ring-out" cx="' + s[0] + '" cy="' + s[1] + '" r="16" fill="none" stroke="' + C.U + '" stroke-width="2"/>' : '') +
            '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + (i === 0 ? 8 : 6.5) + '" fill="' + (i === 0 ? C.L : C.U) + '" filter="url(#' + id + 'g)"/>' +
            '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="2.6" fill="#fff"/>';
        }).join('') +
        '<circle cx="200" cy="160" r="9" fill="#fff" stroke="' + C.S + '" stroke-width="3" filter="url(#' + id + 'g)"/>' +
        '</g>' +
        '</svg>';
    },
    sneaker: function (id) {
      // side profile, heel left: padded collar that dips at the ankle, tongue, lace throat,
      // a toe box that rises with the sole's toe spring, heel counter, cushioned midsole
      var upper = 'M72 206C63 184 63 158 73 136C79 124 93 117 107 121C119 125 127 137 139 139C151 141 157 130 161 117C164 105 171 96 181 96C191 96 196 103 198 111L262 155C292 164 324 172 346 182C360 188 368 195 369 200L306 206Z';
      var sole = 'M64 214C60 225 65 237 81 238H316C345 238 366 228 377 212C381 205 377 198 369 199C352 204 331 206 306 206H84C73 206 67 208 64 214Z';
      var eyelets = [[204, 124], [218, 134], [233, 144], [248, 154]];
      return svgOpen(id) +
        '<radialGradient id="' + id + 'spot" cx="52%" cy="52%" r="55%"><stop offset="0" stop-color="' + C.U + '" stop-opacity=".5"/><stop offset=".45" stop-color="' + C.S + '" stop-opacity=".25"/><stop offset="1" stop-color="' + C.S + '" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + id + 'sole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.U + '"/><stop offset="1" stop-color="' + C.S + '"/></linearGradient>' +
        '<linearGradient id="' + id + 'up" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.22)"/><stop offset="1" stop-color="rgba(255,255,255,.05)"/></linearGradient>' +
        '</defs>' +
        '<rect width="400" height="320" fill="url(#' + id + 'spot)"/>' +
        '<ellipse cx="220" cy="250" rx="160" ry="11" fill="#01090C" opacity=".55"/>' +
        '<path d="M40 250H372" stroke="rgba(255,255,255,.12)"/>' +
        // upper, then its panels: heel counter, tongue, toe cap
        '<path d="' + upper + '" fill="url(#' + id + 'up)" stroke="' + C.LH + '" stroke-width="2.4" stroke-linejoin="round" filter="url(#' + id + 'g)"/>' +
        '<path d="M72 206C63 184 63 158 73 136C77 129 83 124 90 122C94 150 99 180 112 206Z" fill="rgba(255,255,255,.1)" stroke="' + C.LH + '" stroke-opacity=".55" stroke-width="1.4"/>' +
        '<path d="M161 117C164 105 171 96 181 96C191 96 196 103 198 111L188 121C180 116 170 115 161 117Z" fill="rgba(255,255,255,.16)"/>' +
        '<path d="M296 166C289 180 290 195 298 206" fill="none" stroke="' + C.LH + '" stroke-opacity=".6" stroke-width="1.6"/>' +
        '<path d="M300 170C326 176 350 186 364 197" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.4" stroke-linecap="round"/>' +
        '<path d="M84 196C80 176 81 156 90 140" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.3" stroke-dasharray="4 5"/>' +
        // side stripe
        '<path d="M116 192C156 188 198 172 236 146" fill="none" stroke="' + C.S + '" stroke-width="9" stroke-linecap="round" opacity=".45" filter="url(#' + id + 'G)"/>' +
        '<path d="M116 192C156 188 198 172 236 146" fill="none" stroke="' + C.S + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path class="flow flow--slow" d="M116 192C156 188 198 172 236 146" fill="none" stroke="' + C.U + '" stroke-width="4" stroke-linecap="round"/>' +
        // laces over the throat
        eyelets.map(function (e) { return '<path d="M' + e[0] + ' ' + e[1] + 'L' + (e[0] + 9) + ' ' + (e[1] - 10) + '" stroke="' + C.W + '" stroke-width="2.2" stroke-linecap="round" opacity=".9"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="3.2" fill="#03171D" stroke="' + C.W + '" stroke-width="1.4"/>'; }).join('') +
        // cushioned sole with a glowing air window and tread
        '<path d="' + sole + '" fill="url(#' + id + 'sole)" filter="url(#' + id + 'g)"/>' +
        '<rect x="98" y="213" width="62" height="15" rx="7.5" fill="rgba(3,23,29,.35)" stroke="' + C.LH + '" stroke-width="1.4"/>' +
        '<rect x="104" y="217" width="50" height="7" rx="3.5" fill="' + C.L + '" opacity=".85" filter="url(#' + id + 'g)"/>' +
        '<path d="M80 233H318" stroke="rgba(3,23,29,.45)" stroke-width="1.6" stroke-dasharray="7 6"/>' +
        '<path d="M84 207H306C328 206 348 203 366 199" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.4" stroke-linecap="round"/>' +
        '</svg>';
    },
    orbit: function (id) {
      var starList = [[24, 30], [70, 18, 1], [120, 44, 1.6], [300, 28], [352, 60, 1], [380, 130, 1.5], [340, 290], [30, 280, 1.6], [90, 300, 1], [250, 300], [388, 220, 1], [12, 150], [220, 22, 1]];
      return svgOpen(id) +
        '<radialGradient id="' + id + 'neb" cx="80%" cy="15%" r="60%"><stop offset="0" stop-color="' + C.S + '" stop-opacity=".38"/><stop offset="1" stop-color="' + C.S + '" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + id + 'pl" cx="34%" cy="30%" r="75%"><stop offset="0" stop-color="' + C.LH + '"/><stop offset=".35" stop-color="' + C.L + '"/><stop offset=".75" stop-color="#0B3C49"/><stop offset="1" stop-color="#03171D"/></radialGradient>' +
        '<linearGradient id="' + id + 'orb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.U + '" stop-opacity=".2"/><stop offset=".5" stop-color="' + C.U + '"/><stop offset="1" stop-color="' + C.S + '"/></linearGradient>' +
        '</defs>' +
        '<rect width="400" height="320" fill="url(#' + id + 'neb)"/>' +
        stars(starList) +
        '<circle cx="330" cy="72" r="11" fill="' + C.U + '" filter="url(#' + id + 'g)"/>' +
        '<g transform="rotate(-16 190 176)">' +
        '<path d="M30 176A160 46 0 0 1 350 176" fill="none" stroke="url(#' + id + 'orb)" stroke-width="2" opacity=".45"/>' +
        '</g>' +
        '<circle cx="178" cy="176" r="80" fill="none" stroke="' + C.L + '" stroke-width="8" opacity=".3" filter="url(#' + id + 'G)"/>' +
        '<circle cx="178" cy="176" r="74" fill="url(#' + id + 'pl)"/>' +
        '<path d="M120 150C150 140 200 146 240 160M112 184C150 176 206 182 250 196" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="6" stroke-linecap="round"/>' +
        '<g transform="rotate(-16 190 176)">' +
        '<path d="M30 176A160 46 0 0 0 350 176" fill="none" stroke="url(#' + id + 'orb)" stroke-width="7" opacity=".4" filter="url(#' + id + 'G)"/>' +
        '<path d="M30 176A160 46 0 0 0 350 176" fill="none" stroke="url(#' + id + 'orb)" stroke-width="2.6"/>' +
        '<path class="flow" d="M30 176A160 46 0 0 0 350 176" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" filter="url(#' + id + 'g)"/>' +
        '<g transform="translate(316 204) rotate(-12) scale(1.6)"><path d="M-14 0H-34" stroke="' + C.U + '" stroke-width="4" stroke-linecap="round" opacity=".55" filter="url(#' + id + 'G)"/><path d="M-14 0H-30" stroke="' + C.U + '" stroke-width="2.6" stroke-linecap="round" filter="url(#' + id + 'g)"/><path d="M-14 0L10 -6Q18 0 10 6Z" fill="' + C.W + '" filter="url(#' + id + 'g)"/><path d="M-6 -3.6L-11 -9L-2 -4.6ZM-6 3.6L-11 9L-2 4.6Z" fill="' + C.LH + '"/><circle cx="6" cy="0" r="1.8" fill="' + C.D + '"/></g>' +
        '</g>' +
        '</svg>';
    },
    ring: function (id) {
      var ticks = '';
      for (var i = 0; i < 60; i++) {
        var a = i / 60 * Math.PI * 2, r1 = 122, r2 = i % 5 === 0 ? 132 : 127;
        ticks += '<path d="M' + (200 + Math.cos(a) * r1).toFixed(1) + ' ' + (160 + Math.sin(a) * r1).toFixed(1) + 'L' + (200 + Math.cos(a) * r2).toFixed(1) + ' ' + (160 + Math.sin(a) * r2).toFixed(1) + '" stroke="rgba(255,255,255,' + (i % 5 === 0 ? '.3' : '.12') + ')" stroke-width="1.4"/>';
      }
      var circ = 2 * Math.PI * 96, frac = 0.68;
      var endA = -Math.PI / 2 + frac * Math.PI * 2;
      var ex = (200 + Math.cos(endA) * 96).toFixed(1), ey = (160 + Math.sin(endA) * 96).toFixed(1);
      var bars = [30, 44, 22, 38, 52].map(function (h, k) { return '<rect x="' + (322 + k * 12) + '" y="' + (296 - h) + '" width="7" height="' + h + '" rx="3.5" fill="' + (k === 4 ? C.U : C.L) + '" opacity="' + (k === 4 ? 1 : 0.55) + '"' + (k === 4 ? ' filter="url(#' + id + 'g)"' : '') + '/>'; }).join('');
      return svgOpen(id) +
        '<radialGradient id="' + id + 'glow" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="' + C.U + '" stop-opacity=".3"/><stop offset="1" stop-color="' + C.U + '" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + id + 'arc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + C.U + '"/><stop offset="1" stop-color="' + C.S + '"/></linearGradient>' +
        '<radialGradient id="' + id + 'coin" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF0C8"/><stop offset=".4" stop-color="' + C.U + '"/><stop offset="1" stop-color="#E0782F"/></radialGradient>' +
        '</defs>' +
        '<rect width="400" height="320" fill="url(#' + id + 'glow)"/>' +
        '<g class="spin" style="transform-origin:200px 160px">' + ticks + '</g>' +
        '<circle cx="200" cy="160" r="96" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="18"/>' +
        '<circle cx="200" cy="160" r="96" fill="none" stroke="url(#' + id + 'arc)" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + (circ * frac).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 200 160)" opacity=".45" filter="url(#' + id + 'G)"/>' +
        '<circle cx="200" cy="160" r="96" fill="none" stroke="url(#' + id + 'arc)" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + (circ * frac).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 200 160)"/>' +
        [180, 168, 156].map(function (cy, k) {
          // a small stack of coins, seen from slightly above: side band, face, embossed rim
          return '<path d="M160 ' + cy + 'V' + (cy + 9) + 'A40 14 0 0 0 240 ' + (cy + 9) + 'V' + cy + 'Z" fill="#C9642A"' + (k === 0 ? ' filter="url(#' + id + 'g)"' : '') + '/>' +
            '<path d="M160 ' + (cy + 4.5) + 'A40 14 0 0 0 240 ' + (cy + 4.5) + '" fill="none" stroke="rgba(255,226,170,.45)" stroke-width="1.2"/>' +
            '<ellipse cx="200" cy="' + cy + '" rx="40" ry="14" fill="url(#' + id + 'coin)"/>' +
            '<ellipse cx="200" cy="' + cy + '" rx="29" ry="9.5" fill="none" stroke="rgba(120,45,10,.4)" stroke-width="1.6"/>';
        }).join('') +
        '<path d="M200 145l3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1z" fill="#B8541F" opacity=".72" transform="translate(0 156) scale(1 .42) translate(0 -155)"/>' +
        '<ellipse cx="186" cy="150" rx="13" ry="3.6" fill="#fff" opacity=".55" transform="rotate(-6 186 150)"/>' +
        '<circle class="breath" cx="' + ex + '" cy="' + ey + '" r="10" fill="#fff" stroke="' + C.S + '" stroke-width="3" filter="url(#' + id + 'g)"/>' +
        bars +
        '</svg>';
    }
  };
  // where each case lens sits: x%, y%, size (% of art width)
  var LENS = { latte: [52, 56, 34], pulse: [44, 29, 30], route: [55, 50, 31], sneaker: [56, 40, 30], orbit: [81, 53, 26], ring: [30, 63, 29] };

  function initCases() {
    var cards = $$('.case');
    cards.forEach(function (card, i) {
      var motif = card.getAttribute('data-motif');
      var art = $('.case__art', card);
      if (!art || !ART[motif]) return;
      art.innerHTML = ART[motif]('a' + i + motif.slice(0, 2)) + '<span class="case__lens"></span>';
      var lp = LENS[motif], ln = $('.case__lens', art);
      ln.style.setProperty('--x', lp[0] + '%');
      ln.style.setProperty('--y', lp[1] + '%');
      ln.style.setProperty('--s', lp[2] + '%');
      ln.style.animationDelay = (-i * 1.3) + 's';
      liquid(ln, { kind: 'lens', mag: 0.55, rim: 1.0, scale: 0.5, chroma: 0.05, css: 'saturate(1.35) brightness(1.1)', priority: 4 });
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting && animated()); });
      }, { rootMargin: '60px' });
      cards.forEach(function (c) { io.observe(c); });
      D.on('previewactive', function () { cards.forEach(function (c) { var r = c.getBoundingClientRect(); c.classList.toggle('is-live', animated() && r.bottom > 0 && r.top < innerHeight); }); });
    }
    carousel($('.cases'), $('.cases-meta'), cards);
  }

  /* ---------- snap carousels (mobile cases, mobile/tablet plans): counter + bar ---------- */
  function carousel(list, meta, items) {
    if (!list || !meta || !items.length) return { sync: function () {} };
    var num = $('.cases-meta__i', meta), n = items.length, pending = false;
    function sync() {
      pending = false;
      var lr = list.getBoundingClientRect(), mid = lr.left + lr.width / 2, idx = 0, best = 1e9;
      var max = list.scrollWidth - list.clientWidth;
      items.forEach(function (it, i) {
        var r = it.getBoundingClientRect(), c = r.left + r.width / 2;
        var d = Math.abs(c - mid);
        if (d < best) { best = d; idx = i; }
      });
      if (list.scrollLeft <= 4) idx = Math.min(idx, 0);
      if (max > 0 && list.scrollLeft >= max - 4) idx = n - 1;
      if (num) num.textContent = (idx < 9 ? '0' : '') + (idx + 1);
      meta.style.setProperty('--ci', idx);
    }
    list.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(sync);
    }, { passive: true });
    return { sync: sync };
  }

  /* =========================================================================
   * Process: a glass tube with a liquid droplet. It rides the tube as you
   * scroll; on desktop you can also drag it or use the arrow keys, and it
   * settles on a step with a spring. The step under it lights up.
   * ========================================================================= */
  var processRail = (function () {
    var proc = $('.process');
    var api = { measure: function () {}, update: function () {} };
    if (!proc) return api;
    var rail = $('.rail', proc), fill = $('.rail__fill', proc), bub = $('.rail__bubble', proc), steps = $$('.step', proc);
    var stations = [], vertical = false, railLen = 1, fillOff = 0, bsize = 0;
    var pos = new Spring(0, 70, 13, 0.05);
    var manual = false, dragging = false, current = -1, measured = false, inView = false;
    var grab = { off: 0, last: 0, t: 0, v: 0 };

    function axis(r) { return vertical ? r.top + r.height / 2 : r.left + r.width / 2; }
    api.measure = function () {
      vertical = mqNarrow.matches;
      var rr = rail.getBoundingClientRect(), fr = fill.getBoundingClientRect();
      var start = vertical ? rr.top : rr.left;
      railLen = Math.max(1, vertical ? rr.height : rr.width);
      fillOff = (vertical ? fr.top : fr.left) - start;
      bsize = bub ? bub.offsetWidth : 0;
      stations = steps.map(function (s) { return axis($('.step__node', s).getBoundingClientRect()) - start; });
      if (bub) {
        // a keyboard slider on desktop; on phones the droplet only rides along with the scroll
        bub.tabIndex = vertical ? -1 : 0;
        if (vertical) bub.setAttribute('aria-hidden', 'true'); else bub.removeAttribute('aria-hidden');
        bub.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
      }
      measured = stations.length > 0;
      api.update(true);
    };
    function lo() { return stations[0] || 0; }
    function hi() { return stations[stations.length - 1] || railLen; }
    function nearest(v) {
      var k = 0, best = 1e9;
      stations.forEach(function (s, i) { var d = Math.abs(s - v); if (d < best) { best = d; k = i; } });
      return k;
    }
    function scrollTarget() {
      var vh = innerHeight;
      if (vertical) {
        // the droplet stays level with the reading line while the steps pass under it
        var rr = rail.getBoundingClientRect();
        return clamp(vh * 0.6 - rr.top, lo(), hi());
      }
      var pr = proc.getBoundingClientRect();
      var t = clamp((vh * 0.86 - pr.top) / (vh * 0.62), 0, 1);
      if (isPreview && !previewActive && window.scrollY < 10) t = 1;
      return lo() + (hi() - lo()) * t;
    }
    api.update = function (snap) {
      if (!measured) return;
      if (!manual && !dragging) pos.t = scrollTarget();
      if (snap === true || !animated()) pos.snap(pos.t);
      paint();
      wake();
    };
    function setCurrent(k) {
      if (k === current) return;
      current = k;
      steps.forEach(function (s, i) { s.classList.toggle('is-current', i === k); });
      if (bub) {
        var t = steps[k] && $('.step__title', steps[k]);
        bub.setAttribute('aria-valuenow', String(k + 1));
        bub.setAttribute('aria-valuetext', (k < 9 ? '0' : '') + (k + 1) + ' · ' + (t ? t.textContent : ''));
      }
    }
    function paint() {
      var p = pos.x;
      steps.forEach(function (s, i) { s.classList.toggle('is-lit', p >= stations[i] - 2); });
      setCurrent(nearest(p));
      var shown = clamp(p - fillOff, 0, railLen);
      proc.style.setProperty('--fill', shown.toFixed(1) + 'px');
      if (bub) {
        var st = animated() ? Math.min(Math.abs(pos.v) / 2600, 0.16) : 0;
        var a = (p - bsize / 2).toFixed(2);
        bub.style.transform = (vertical ? 'translate3d(0,' + a + 'px,0) scale(' + (1 - st * 0.5).toFixed(4) + ',' + (1 + st).toFixed(4) + ')'
          : 'translate3d(' + a + 'px,0,0) scale(' + (1 + st).toFixed(4) + ',' + (1 - st * 0.5).toFixed(4) + ')');
      }
    }
    tickers.push(function (dt) {
      if (!measured) return false;
      var m = pos.step(dt);
      paint();
      return m;
    });
    function goTo(k) {
      k = clamp(k, 0, stations.length - 1);
      manual = true;
      pos.t = stations[k];
      if (!animated()) pos.snap(pos.t);
      paint();
      wake();
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; api.update(); });
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      // leaving the section hands the droplet back to the scroll
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (!inView && !dragging) manual = false;
      }).observe(proc);
    }

    if (bub) {
      function local(e) {
        var rr = rail.getBoundingClientRect();
        return vertical ? e.clientY - rr.top : e.clientX - rr.left;
      }
      bub.addEventListener('pointerdown', function (e) {
        if (vertical || isPreview || e.button > 0) return;
        e.preventDefault();
        try { bub.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
        dragging = true; manual = true;
        grab.off = local(e) - pos.x; grab.last = local(e); grab.t = performance.now(); grab.v = 0;
        pos.k = 380; pos.c = 34;
        bub.classList.add('is-dragging');
        bub.focus({ preventScroll: true });
      });
      bub.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var v = local(e), now = performance.now();
        grab.v = grab.v * 0.6 + (v - grab.last) / Math.max(1, now - grab.t) * 0.4;
        grab.last = v; grab.t = now;
        pos.t = clamp(v - grab.off, lo() - bsize * 0.2, hi() + bsize * 0.2);
        wake();
      });
      function drop() {
        if (!dragging) return;
        dragging = false;
        pos.k = 70; pos.c = 13;
        bub.classList.remove('is-dragging');
        // a flick carries it on to the next step
        goTo(nearest(pos.t + clamp(grab.v, -2.5, 2.5) * 140));
      }
      bub.addEventListener('pointerup', drop);
      bub.addEventListener('pointercancel', drop);
      bub.addEventListener('lostpointercapture', drop);
      bub.addEventListener('keydown', function (e) {
        var k = current < 0 ? 0 : current, n = stations.length - 1, to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') to = k + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') to = k - 1;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = n;
        if (to === null) return;
        e.preventDefault();
        goTo(to);
      });
      // a click on the tube or on a step card sends the droplet there
      rail.addEventListener('click', function (e) { if (!vertical && !isPreview) goTo(nearest(local(e))); });
      steps.forEach(function (s, i) {
        s.addEventListener('click', function (e) {
          if (vertical || isPreview || !mqFine.matches || (window.getSelection && String(window.getSelection()))) return;
          goTo(i);
        });
      });
    }
    return api;
  })();

  /* =========================================================================
   * Pricing: thick liquid slabs over a pool of light that follows the cursor
   * (drifts on its own otherwise). The slabs' rims bend the light behind them.
   * ========================================================================= */
  var pricing = (function () {
    var stage = $('.pricing-stage');
    var api = { measure: function () {} };
    if (!stage) return api;
    var pool = $('.pricing-light', stage);
    var sun = $('.pricing-light__sun', stage), sea = $('.pricing-light__sea', stage);
    var disc = $('.pricing-light__disc', stage), ring = $('.pricing-light__ring', stage);
    var discS = 0, ringS = 0, top = 0;
    var lx = new Spring(0.5, 16, 7, 0.0005), ly = new Spring(0.5, 16, 7, 0.0005);
    var W = 0, H = 0, sunS = 0, seaS = 0, inView = false, hover = false;
    api.measure = function () {
      W = pool ? pool.offsetWidth : 0; H = pool ? pool.offsetHeight : 0;
      sunS = sun ? sun.offsetWidth : 0; seaS = sea ? sea.offsetWidth : 0;
      discS = disc ? disc.offsetWidth : 0; ringS = ring ? ring.offsetWidth : 0;
      // the slabs' top rims, as a fraction of the pool: the idle drift keeps the sun near them
      var pl = $('.plan', stage);
      top = pl && pool ? (pl.getBoundingClientRect().top - pool.getBoundingClientRect().top) / Math.max(1, H) : 0.2;
      paint();
    };
    function paint() {
      var sx = lx.x * W, sy = ly.x * H;
      if (sun) sun.style.transform = 'translate3d(' + (sx - sunS / 2).toFixed(1) + 'px,' + (sy - sunS / 2).toFixed(1) + 'px,0)';
      if (disc) disc.style.transform = 'translate3d(' + (sx - discS / 2).toFixed(1) + 'px,' + (sy - discS / 2).toFixed(1) + 'px,0)';
      if (ring) ring.style.transform = 'translate3d(' + ((1 - lx.x) * W - ringS / 2).toFixed(1) + 'px,' + ((top + 0.05 + (ly.x - top) * 0.6) * H - ringS / 2).toFixed(1) + 'px,0)';
      // the cool pool drifts the other way, so warm and cool never pile up into mud
      if (sea) sea.style.transform = 'translate3d(' + ((1 - lx.x) * W - seaS / 2).toFixed(1) + 'px,' + ((0.35 + (1 - ly.x) * 0.5) * H - seaS / 2).toFixed(1) + 'px,0)';
    }
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !interactive()) return;
      var r = (pool || stage).getBoundingClientRect();
      lx.t = clamp((e.clientX - r.left) / r.width, 0.04, 0.96);
      ly.t = clamp((e.clientY - r.top) / r.height, 0.1, 0.9);
      hover = true;
      wake();
    });
    stage.addEventListener('pointerleave', function () { hover = false; wake(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView) { api.measure(); wake(); }
      }).observe(stage);
    }
    tickers.push(function (dt, now) {
      if (!inView) return false;
      var anim = animated();
      if (!hover) {
        // idle: the sun drifts along the slabs' top rims, dipping behind the glass and out again
        if (anim) { lx.t = 0.5 + 0.36 * Math.sin(now / 1000 * 0.19); ly.t = top + 0.02 + 0.09 * Math.cos(now / 1000 * 0.29); }
        else { lx.t = 0.37; ly.t = top + 0.03; }
      }
      if (!anim) { lx.snap(lx.t); ly.snap(ly.t); paint(); return false; }
      var m = lx.step(dt);
      m = ly.step(dt) || m;
      paint();
      return m || !hover;
    });
    // desktop: each slab gets a refracting bezel over a frosted core (like the header)
    if (!mqMobile.matches && !mqCoarse.matches) {
      $$('.plan', stage).forEach(function (p) {
        liquid(p, { kind: 'edge', bezel: 26, strength: 1, scale: 46, frost: 16, css: 'saturate(1.6)', priority: 5 });
      });
    }
    // phones & tablets: the plans become a snap carousel that opens on the featured one
    var list = $('.plans', stage), plans = $$('.plan', stage);
    var car = carousel(list, $('.plans-meta', stage), plans);
    api.center = function () {
      if (!list || list.scrollWidth <= list.clientWidth + 2) return;
      var f = $('.plan[data-featured="true"]', list) || plans[0];
      if (!f) return;
      list.scrollLeft = f.offsetLeft - (list.clientWidth - f.offsetWidth) / 2;
      car.sync();
    };
    return api;
  })();

  /* =========================================================================
   * FAQ: glass pills that open on a spring
   * ========================================================================= */
  function initFaq() {
    var items = $$('.faq__item');
    items.forEach(function (d) {
      d.removeAttribute('name'); // exclusivity handled here so the closing one can animate
      var s = $('summary', d);
      s.addEventListener('click', function (e) {
        e.preventDefault();
        toggle(d);
      });
    });
    function toggle(d) {
      if (d.open && !d._closing) close(d);
      else {
        items.forEach(function (o) { if (o !== d && o.open && !o._closing) close(o); });
        open(d);
      }
    }
    function open(d) {
      if (d._anim) d._anim.cancel();
      d._closing = false;
      var start = d.offsetHeight;
      d.open = true;
      if (reduced || !d.animate) return;
      var end = d.offsetHeight;
      d._anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 720, easing: 'cubic-bezier(.3, 1.25, .45, 1)' });
      d._anim.onfinish = function () { d._anim = null; };
    }
    function close(d) {
      if (d._anim) d._anim.cancel();
      if (reduced || !d.animate) { d.open = false; return; }
      var start = d.offsetHeight, end = $('summary', d).offsetHeight;
      d._closing = true;
      d._anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 460, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      d._anim.onfinish = function () { d.open = false; d._closing = false; d._anim = null; };
    }
  }

  /* =========================================================================
   * Form: shake invalid fields, keep the success state in view
   * ========================================================================= */
  function initForm() {
    var form = $('form[data-dz-form]');
    if (!form) return;
    form.addEventListener('diapason:forminvalid', function (e) {
      if (reduced) return;
      ((e.detail && e.detail.fields) || []).forEach(function (n) {
        var inp = form.elements[n];
        if (!inp) return;
        inp.classList.remove('is-shake');
        void inp.offsetWidth;
        inp.classList.add('is-shake');
      });
    });
    form.addEventListener('animationend', function (e) {
      if (e.animationName === 'shake') e.target.classList.remove('is-shake');
    });
    form.addEventListener('diapason:formsent', function () {
      var s = $('.form__success', form);
      if (!s) return;
      var r = s.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 90) s.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    });
    // the sun button's highlight follows the pointer
    $$('.btn--sun').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        b.style.setProperty('--by', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
      b.addEventListener('pointerleave', function () { b.style.removeProperty('--bx'); b.style.removeProperty('--by'); });
    });
  }

  /* =========================================================================
   * Reveal on scroll
   * ========================================================================= */
  function initReveal() {
    var els = $$('.rv');
    if (isPreview || reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var groups = new Map();
    els.forEach(function (el) {
      var p = el.parentElement, i = groups.get(p) || 0;
      groups.set(p, i + 1);
      el.style.setProperty('--rd', Math.min(i, 6) * 85 + 'ms');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================================
   * Footer wordmark: set so it spans its box exactly, per language, after fonts
   * ========================================================================= */
  function fitWord() {
    var el = $('.footer__word');
    if (!el || !el.clientWidth) return;
    el.style.fontSize = '';
    el.classList.remove('is-fit');
    var cs = getComputedStyle(el);
    var box = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var rg = document.createRange();
    rg.selectNodeContents(el);
    var w = rg.getBoundingClientRect().width;
    if (!w || box <= 0) return;
    el.style.fontSize = clamp(parseFloat(cs.fontSize) * box / w * 0.985, 40, 380).toFixed(1) + 'px';
    el.classList.add('is-fit');
  }

  /* =========================================================================
   * Fast scroll: the SVG refraction steps aside (plain frost of the same
   * strength) while the page flies, and comes back as soon as it settles.
   * ========================================================================= */
  (function () {
    if (!LIQUID) return;
    var lastY = window.scrollY, lastT = performance.now(), fast = false, timer = 0;
    function flying(ms) {
      if (!fast) { fast = true; root.classList.add('lg-fast'); }
      clearTimeout(timer);
      timer = setTimeout(function () { fast = false; root.classList.remove('lg-fast'); }, ms);
    }
    window.addEventListener('scroll', function () {
      var now = performance.now(), y = window.scrollY, dt = now - lastT;
      var v = dt > 4 ? Math.abs(y - lastY) / dt * 1000 : 0;
      lastY = y; lastT = now;
      if (v > 900) flying(200);
    }, { passive: true });
    // a mouse-wheel notch (or line/page scrolling) announces a jump before the first scroll frame;
    // slow trackpad scrolling keeps the refraction
    window.addEventListener('wheel', function (e) {
      if (e.deltaMode !== 0 || Math.abs(e.deltaY) >= 60) flying(260);
    }, { passive: true });
  })();

  function relayout() {
    lens.measure();
    services.refresh();
    nav.refresh();
    measureDoc();
    processRail.measure();
    pricing.measure();
    fitWord();
  }

  /* =========================================================================
   * Boot
   * ========================================================================= */
  D.ready(function () {
    glue(document.body);
    hideEmptyBadges();
    updateEngine();
    initCases();
    initReveal();
    initFaq();
    initForm();
    initSpecular();
    initTilt();
    measureDoc();
    processRail.measure();
    pricing.measure();
    pricing.center && pricing.center();
    fitWord();

    // liquid droplets in the hero
    if (lens.el) liquid(lens.el, { kind: 'lens', mag: 0.5, rim: 1.15, scale: 0.5, chroma: 0.06, soften: 0.4, css: 'saturate(1.45) brightness(1.08) contrast(1.04)', priority: 1 });
    var bub = $('.rail__bubble');
    if (bub) liquid(bub, { kind: 'lens', mag: 0.45, rim: 1.1, scale: 0.55, chroma: 0.06, soften: 0.4, css: 'saturate(1.4) brightness(1.1)', priority: 3 });
    var fa = $('.floater--a');
    if (fa && !mqMobile.matches) liquid(fa, { kind: 'lens', mag: 0.18, rim: 0.9, scale: 0.34, css: 'blur(7px) saturate(1.8) brightness(1.06)', priority: 6 });

    if (!BG || reduced || isPreview) bgStatic();
    var startLens = function () { lens.start && lens.start(); };
    if (isPreview || reduced) startLens();
    else setTimeout(function () { afterBG(startLens); }, 950); // never drop the droplet while the GL context spins up
  });

  D.on('langchange', function () {
    glue(document.body);
    hideEmptyBadges();
    updateEngine();
    requestAnimationFrame(function () {
      relayout();
      pricing.center && pricing.center();
    });
  });

  D.on('previewactive', function (d) {
    previewActive = !!(d && d.active);
    if (previewActive) wake();
    processRail.update();
  });

  D.on('motionchange', function (d) {
    reduced = !!(d && d.reduced);
    if (reduced) {
      $$('.rv').forEach(function (el) { el.classList.add('is-in'); });
      $$('.case').forEach(function (c) { c.classList.remove('is-live'); });
      bgStatic();
    } else wake();
  });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (BG) { BG.resize(); if (!animated()) bgStatic(); }
      relayout();
    }, 140);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      relayout();
      pricing.center && pricing.center();
    });
  }
  window.addEventListener('load', function () { measureDoc(); processRail.measure(); lens.measure(); pricing.measure(); fitWord(); });
})();
