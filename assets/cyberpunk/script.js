/*
 * Diapason — 05 · Cyberpunk
 * Boot sequence · cursor-tracking HUD with target lock · decrypt/scramble + chromatic glitch ·
 * a holographic tuning fork (canvas 2D) you can strike · neon wireframe "data shards" ·
 * scroll-driven pipeline · terminal contact form with a block caret.
 * Every visible word comes from content.js / copy.js via DIAPASON.t() or data-i18n.
 */
(function () {
  'use strict';

  var D = window.DIAPASON;
  if (!D) return;

  var doc = document;
  var root = doc.documentElement;
  var PREVIEW = D.isPreview;
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var previewActive = false;
  var hasIO = 'IntersectionObserver' in window;

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function X(k) { return D.t('x.cyberpunk.' + k); }
  function now() { return performance.now(); }
  function reduced() { return D.reducedMotion; }
  function idle() { return reduced() || (PREVIEW && !previewActive); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n, l) { n = String(Math.max(0, Math.round(n))); while (n.length < l) n = '0' + n; return n; }
  function hex4() { return ('000' + ((Math.random() * 65536) | 0).toString(16)).slice(-4).toUpperCase(); }

  /* =========================================================
     Decrypt / scramble — keeps the real text as aria-label on the host while it runs
     ========================================================= */
  var GLYPHS = {
    ru: 'АБВГДЕЖЗИКЛМНПРСТУФХЦЧШЭЮЯ0123456789#$%&*+=<>/\\',
    en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>/\\'
  };
  var scrambles = new Map();

  function scramble(el, opt) {
    opt = opt || {};
    if (!el) return;
    stopScramble(el, true);
    var final = el.textContent;
    if (!final || !final.trim() || reduced() || PREVIEW) { if (opt.done) opt.done(); return; }
    var set = GLYPHS[D.lang] || GLYPHS.en;
    var len = final.length;
    var dur = opt.duration || clamp(260 + len * 16, 320, 900);
    var th = [];
    for (var i = 0; i < len; i++) th.push(clamp(i / len * 0.72 + Math.random() * 0.28, 0, 0.99));
    var host = opt.labelEl || null;
    if (host && host.hasAttribute('aria-label')) host = null;
    if (host) host.setAttribute('aria-label', opt.label || final);
    // the effect must never change layout (no re-wrap → no scroll-anchoring jumps)
    var lock = { w: el.style.width, h: el.style.height, d: el.style.display, o: el.style.overflow, ws: el.style.whiteSpace };
    if (opt.lockWidth) {
      el.style.width = el.getBoundingClientRect().width + 'px';
      el.style.display = 'inline-block';
      el.style.overflow = 'hidden';
      el.style.whiteSpace = 'nowrap';
    } else if (getComputedStyle(el).display !== 'inline') {
      el.style.height = el.getBoundingClientRect().height + 'px';
    }
    var st = { final: final, raf: 0, host: host, done: opt.done, last: 0, g: [], lock: lock };
    var t0 = now() + (opt.delay || 0);
    function frame(t) {
      var p = (t - t0) / dur;
      if (p >= 1) { finish(el, st); return; }
      var refresh = t - st.last > 48;
      if (refresh) st.last = t;
      var out = '';
      for (var j = 0; j < len; j++) {
        var c = final.charAt(j);
        if (c === ' ' || c === '\n' || c === ' ' || c === '—' || p >= th[j]) { out += c; continue; }
        if (refresh || !st.g[j]) st.g[j] = set.charAt((Math.random() * set.length) | 0);
        out += st.g[j];
      }
      el.textContent = out;
      st.raf = requestAnimationFrame(frame);
    }
    scrambles.set(el, st);
    frame(now());
  }
  function unlock(el, st) {
    if (!st.lock) return;
    el.style.width = st.lock.w; el.style.height = st.lock.h; el.style.display = st.lock.d; el.style.overflow = st.lock.o; el.style.whiteSpace = st.lock.ws;
  }
  function finish(el, st) {
    el.textContent = st.final;
    scrambles.delete(el);
    unlock(el, st);
    if (st.host) st.host.removeAttribute('aria-label');
    if (st.done) st.done();
  }
  function stopScramble(el, restore) {
    var st = scrambles.get(el);
    if (!st) return;
    cancelAnimationFrame(st.raf);
    scrambles.delete(el);
    if (restore) el.textContent = st.final;
    unlock(el, st);
    if (st.host) st.host.removeAttribute('aria-label');
  }
  function stopAllScrambles() {
    // core has already written the new language into the DOM — just stop writing over it
    scrambles.forEach(function (st, el) {
      cancelAnimationFrame(st.raf);
      unlock(el, st);
      if (st.host) st.host.removeAttribute('aria-label');
    });
    scrambles.clear();
  }
  function finalText(el) { var st = scrambles.get(el); return st ? st.final : el.textContent; }

  /* =========================================================
     Chromatic glitch
     ========================================================= */
  function syncGlitch() { $$('.glitch').forEach(function (el) { el.setAttribute('data-text', finalText(el)); }); }
  function glitch(el, ms) {
    if (!el || reduced()) return;
    el.setAttribute('data-text', finalText(el));
    el.classList.remove('is-glitch');
    void el.offsetWidth;
    el.classList.add('is-glitch');
    clearTimeout(el.__glt);
    el.__glt = setTimeout(function () { el.classList.remove('is-glitch'); }, ms || 420);
  }
  function inView(el, margin) {
    var r = el.getBoundingClientRect();
    margin = margin || 0;
    return r.bottom > margin && r.top < window.innerHeight - margin && r.width > 0;
  }
  function ambientGlitch() {
    setTimeout(ambientGlitch, 2800 + Math.random() * 4200);
    if (doc.hidden || idle()) return;
    var pool = $$('.hero__line, .hero__this, .sec-title, .footer__word').filter(function (el) { return inView(el, 40); });
    if (!pool.length) return;
    var el = pool[(Math.random() * pool.length) | 0];
    if (el.classList.contains('hero__this') && Math.random() < 0.5) { buzz(el); return; }
    glitch(el, 420);
  }
  function buzz(el) {
    el.classList.remove('is-lit', 'is-buzz');
    void el.offsetWidth;
    el.classList.add('is-buzz');
    setTimeout(function () { el.classList.remove('is-buzz'); }, 520);
  }

  /* =========================================================
     Boot sequence (≤ 2 s, once per session, skippable)
     ========================================================= */
  function buildBootLog(log) {
    var lines = X('boot.lines') || [];
    log.textContent = '';
    lines.forEach(function (ln, i) {
      var li = doc.createElement('li');
      li.style.setProperty('--i', i);
      var t = doc.createElement('span'); t.className = 't'; t.textContent = ln.t;
      var d = doc.createElement('span'); d.className = 'd';
      var s = doc.createElement('span'); s.className = 's' + (/^0\b/.test(ln.s) ? ' is-warn' : ''); s.textContent = ln.s;
      li.appendChild(t); li.appendChild(d); li.appendChild(s);
      log.appendChild(li);
    });
  }
  function runBoot(onReveal) {
    var boot = $('[data-boot]');
    if (!boot || !root.classList.contains('cp-boot') || PREVIEW || reduced()) {
      root.classList.remove('cp-boot');
      if (boot) boot.remove();
      onReveal();
      return;
    }
    try { sessionStorage.setItem('cp.booted', '1'); } catch (e) {}
    buildBootLog($('[data-boot-log]', boot));
    var pct = $('[data-boot-pct]', boot);
    var granted = $('.boot__granted', boot);
    var t0 = now();
    var timers = [];
    var revealed = false;
    var ended = false;
    var evs = ['keydown', 'pointerdown', 'wheel', 'touchstart'];

    (function tickPct() {
      if (ended || revealed) return;
      var p = clamp((now() - t0 - 50) / 1200, 0, 1);
      pct.textContent = pad(Math.floor(p * 100), 3) + '%';
      if (p < 1) requestAnimationFrame(tickPct);
    })();

    timers.push(setTimeout(function () {
      boot.classList.add('is-granted');
      glitch(granted, 380);
    }, 1250));
    timers.push(setTimeout(out, 1580));

    function out() {
      if (revealed) return;
      revealed = true;
      timers.forEach(clearTimeout);
      boot.classList.add('is-out');
      onReveal();
      setTimeout(end, 380);
    }
    function end() {
      if (ended) return;
      ended = true;
      root.classList.remove('cp-boot');
      boot.remove();
      evs.forEach(function (ev) { window.removeEventListener(ev, skip, true); });
    }
    function skip(e) {
      if (e.type === 'keydown' && (e.metaKey || e.ctrlKey || e.altKey)) return;
      out();
    }
    evs.forEach(function (ev) { window.addEventListener(ev, skip, { capture: true, passive: true }); });
  }

  /* =========================================================
     Hero intro (after boot, or straight away on later visits)
     ========================================================= */
  var holo = null;
  function startIntro() {
    var had = root.classList.contains('cp-intro');
    root.classList.remove('cp-intro');
    if (holo) holo.update();
    if (!had || PREVIEW || reduced()) return;
    var h1 = $('.hero__title');
    var l1 = $('.hero__line');
    var l2 = $('.hero__this');
    h1.setAttribute('aria-label', finalText(l1) + ' ' + finalText(l2));
    scramble(l1, { duration: 950 });
    scramble($('.hero__eyebrow [data-i18n]'), { duration: 700 });
    $$('.stats dt').forEach(function (dt, i) { scramble(dt, { duration: 520, delay: 380 + i * 110 }); });
    l2.style.animationDelay = '0.42s';
    l2.classList.add('is-lit');
    var wrap = $('[data-holo]');
    if (wrap) wrap.classList.add('is-in');
    setTimeout(function () { if (holo) holo.strike(); }, 900);
    setTimeout(function () {
      h1.removeAttribute('aria-label');
      l2.style.animationDelay = '';
      l2.classList.remove('is-lit');
      glitch(l1, 420);
    }, 1800);
  }

  /* =========================================================
     Holographic tuning fork (canvas 2D)
     ========================================================= */
  function Holo(wrap) {
    var canvas = $('canvas', wrap);
    var ctx = canvas.getContext('2d');
    var ampEl = $('[data-holo-amp]', wrap);
    var hero = wrap.closest('.hero') || doc.body;
    var botMeta = $('[data-holo-bot]', wrap);
    var topMeta = $('.holo__meta--top', wrap);
    var W = 0, H = 0, dpr = 1, raf = 0, running = false, visible = true;
    // the viewer frame inside the (wider, masked) canvas, and the room taken by the bottom labels
    var FX0 = 0, FX1 = 0, botH = 0, topH = 0;
    var t = 0, lastT = 0, amp = 0.35, lastStrike = -10, rings = [];
    var yawOff = 0, tiltOff = 0, yawT = 0, tiltT = 0, hot = false;
    var box = { x0: 0, y0: 0, x1: 0, y1: 0 };
    var TOP = 1.3, CY = -0.35, RO = 0.38, RI = 0.24, STEM = 0.075, BOT = -1.5, DEPTH = 0.1;
    var prof = [], links = [];

    (function build() {
      var a0 = Math.asin(STEM / RO), i, a;
      prof.push([-STEM, BOT]); links.push(0);
      for (i = 0; i <= 8; i++) { a = -Math.PI / 2 - a0 - (Math.PI / 2 - a0) * (i / 8); prof.push([RO * Math.cos(a), CY + RO * Math.sin(a)]); if (i % 4 === 0) links.push(prof.length - 1); }
      prof.push([-RO, TOP]); links.push(prof.length - 1);
      prof.push([-RI, TOP]); links.push(prof.length - 1);
      for (i = 0; i <= 12; i++) { a = -Math.PI + Math.PI * (i / 12); prof.push([RI * Math.cos(a), CY + RI * Math.sin(a)]); if (i % 3 === 0) links.push(prof.length - 1); }
      prof.push([RI, TOP]); links.push(prof.length - 1);
      prof.push([RO, TOP]); links.push(prof.length - 1);
      for (i = 0; i <= 8; i++) { a = -(Math.PI / 2 - a0) * (i / 8); prof.push([RO * Math.cos(a), CY + RO * Math.sin(a)]); if (i % 4 === 0) links.push(prof.length - 1); }
      prof.push([STEM, BOT]); links.push(prof.length - 1);
    })();

    function resize() {
      var r = canvas.getBoundingClientRect();
      var f = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, mqFine.matches ? 2 : 1.5);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      FX0 = clamp((f.left - r.left) * dpr, 0, W);
      FX1 = clamp((f.right - r.left) * dpr, FX0 + 1, W);
      botH = botMeta && botMeta.offsetParent ? botMeta.offsetHeight : 0;
      topH = topMeta && topMeta.offsetParent ? topMeta.offsetHeight : 0;
      canvas.width = W; canvas.height = H;
      if (!running) render(false);
    }

    function project(x, y, z, yaw, tilt, cx, cy, s) {
      var cyw = Math.cos(yaw), syw = Math.sin(yaw);
      var x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      var ct = Math.cos(tilt), st = Math.sin(tilt);
      var y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      var f = 4.2 / (4.2 - z2);
      return [cx + x1 * s * f, cy - y1 * s * f];
    }

    function forkPoints(defl, yaw, tilt, cx, cy, s) {
      var front = [], back = [];
      for (var i = 0; i < prof.length; i++) {
        var x = prof[i][0], y = prof[i][1];
        if (y > CY) { var k = (y - CY) / (TOP - CY); x += (x < 0 ? -1 : 1) * defl * k * k; }
        front.push(project(x, y, DEPTH, yaw, tilt, cx, cy, s));
        back.push(project(x, y, -DEPTH, yaw, tilt, cx, cy, s));
      }
      return [front, back];
    }
    function strokeFork(P) {
      ctx.beginPath();
      for (var f = 0; f < 2; f++) {
        var pts = P[f];
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
      }
      for (var j = 0; j < links.length; j++) {
        var n = links[j];
        ctx.moveTo(P[0][n][0], P[0][n][1]);
        ctx.lineTo(P[1][n][0], P[1][n][1]);
      }
      ctx.stroke();
    }
    function ellipseY(y, rad, yaw, tilt, cx, cy, s, seg) {
      ctx.beginPath();
      for (var i = 0; i <= seg; i++) {
        var a = (i / seg) * Math.PI * 2;
        var p = project(Math.cos(a) * rad, y, Math.sin(a) * rad, yaw, tilt, cx, cy, s);
        if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
    }

    function render(live) {
      if (!W || !H) return;
      var yaw = 0.38 + (live ? Math.sin(t * 0.42) * 0.62 : 0) + yawOff;
      var tilt = -0.16 + tiltOff;
      var FW = FX1 - FX0;
      // fit the fork (prong tips → projector rings ≈ 3.1 s tall) between the label rows
      var y0 = topH ? (topH + 16) * dpr : H * 0.06;
      var y1 = botH ? H - (botH + 46) * dpr : H * 0.94;
      var s = Math.max(10, Math.min((y1 - y0) / 3.1, H * 0.27, FW * 0.62));
      var cx = (FX0 + FX1) / 2, cy = y0 + 1.36 * s + Math.max(0, (y1 - y0) - 3.1 * s) / 2;
      var lw = Math.max(1, dpr);
      var omega = Math.PI * 2 * 11;
      var defMax = amp * 0.085;
      var defl = live ? defMax * Math.sin(t * omega) : defMax * 0.6;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // projector beam
      var baseY = BOT - 0.14;
      var pb = project(0, baseY, 0, yaw, tilt, cx, cy, s);
      var g = ctx.createLinearGradient(0, pb[1], 0, cy - TOP * s * 1.08);
      g.addColorStop(0, 'rgba(0,240,255,0.16)');
      g.addColorStop(1, 'rgba(0,240,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(pb[0] - s * 0.56, pb[1]);
      ctx.lineTo(pb[0] + s * 0.56, pb[1]);
      ctx.lineTo(cx + s * 0.95, cy - TOP * s * 1.08);
      ctx.lineTo(cx - s * 0.95, cy - TOP * s * 1.08);
      ctx.closePath();
      ctx.fill();

      // projector rings
      ctx.lineWidth = lw;
      ctx.setLineDash([6 * dpr, 7 * dpr]);
      ctx.lineDashOffset = live ? -t * 30 * dpr : 0;
      ctx.strokeStyle = 'rgba(0,240,255,0.55)';
      ellipseY(baseY, 0.58, yaw, tilt, cx, cy, s, 48); ctx.stroke();
      ctx.lineDashOffset = live ? t * 22 * dpr : 0;
      ctx.strokeStyle = 'rgba(255,46,136,0.6)';
      ellipseY(baseY, 0.44, yaw, tilt, cx, cy, s, 40); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0,240,255,0.28)';
      ellipseY(baseY - 0.05, 0.3, yaw, tilt, cx, cy, s, 32); ctx.stroke();

      // scan ring travelling up the fork
      var sy = BOT + ((live ? t * 0.45 : 0.62) % 1) * (TOP - BOT + 0.2);
      ctx.strokeStyle = 'rgba(245,242,0,0.45)';
      ellipseY(sy, 0.55, yaw, tilt, cx, cy, s, 40); ctx.stroke();

      // the fork: ghosts (motion blur), glow, chromatic offset, core line
      var P;
      if (live && defMax > 0.01) {
        ctx.strokeStyle = 'rgba(0,240,255,' + (0.1 + amp * 0.12).toFixed(3) + ')';
        ctx.lineWidth = lw;
        strokeFork(forkPoints(defMax, yaw, tilt, cx, cy, s));
        strokeFork(forkPoints(-defMax, yaw, tilt, cx, cy, s));
      }
      P = forkPoints(defl, yaw, tilt, cx, cy, s);
      ctx.strokeStyle = 'rgba(0,240,255,' + (hot ? 0.22 : 0.12) + ')';
      ctx.lineWidth = 6 * dpr;
      strokeFork(P);
      ctx.save();
      ctx.translate(-2.4 * dpr, 0.6 * dpr);
      ctx.strokeStyle = 'rgba(255,46,136,0.62)';
      ctx.lineWidth = lw;
      strokeFork(P);
      ctx.restore();
      ctx.strokeStyle = hot ? 'rgba(210,252,255,1)' : 'rgba(0,240,255,0.95)';
      ctx.lineWidth = 1.35 * dpr;
      strokeFork(P);

      // vertices
      ctx.fillStyle = 'rgba(230,248,255,0.9)';
      for (var v = 0; v < links.length; v += 2) {
        var q = P[0][links[v]];
        ctx.fillRect(q[0] - 1.5 * dpr, q[1] - 1.5 * dpr, 3 * dpr, 3 * dpr);
      }

      // bounds (for hover / strike), in CSS px relative to the canvas
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (var b = 0; b < P[0].length; b++) {
        var pp = P[0][b];
        if (pp[0] < x0) x0 = pp[0]; if (pp[0] > x1) x1 = pp[0];
        if (pp[1] < y0) y0 = pp[1]; if (pp[1] > y1) y1 = pp[1];
      }
      box.x0 = x0 / dpr; box.x1 = x1 / dpr; box.y0 = y0 / dpr; box.y1 = y1 / dpr;

      // sound rings from the prongs
      var tip = project(0, TOP * 0.72, 0, yaw, tilt, cx, cy, s);
      for (var r = rings.length - 1; r >= 0; r--) {
        var age = t - rings[r];
        if (age < 0) continue;
        var rad = (0.3 + age * 1.5) * s;
        var al = 1 - age / 1.5;
        if (al <= 0) { rings.splice(r, 1); continue; }
        ctx.strokeStyle = 'rgba(0,240,255,' + (al * 0.8).toFixed(3) + ')';
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath(); ctx.arc(tip[0], tip[1], rad, -0.55, 0.55); ctx.stroke();
        ctx.beginPath(); ctx.arc(tip[0], tip[1], rad, Math.PI - 0.55, Math.PI + 0.55); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,46,136,' + (al * 0.5).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(tip[0] - 2 * dpr, tip[1], rad * 0.92, -0.4, 0.4); ctx.stroke();
      }

      // oscilloscope trace, inside the frame and above the bottom labels (only where the labels show)
      var wy = H - (botH + 16) * dpr, wx0 = FX0 + 26 * dpr, wx1 = FX1 - 26 * dpr;
      if (botH && FW / dpr > 240) {
      ctx.strokeStyle = 'rgba(0,240,255,0.18)';
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(wx0, wy); ctx.lineTo(wx1, wy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,46,136,0.9)';
      ctx.lineWidth = 1.3 * dpr;
      ctx.beginPath();
      var A = (1.5 + amp * 13) * dpr;
      for (var x = wx0; x <= wx1; x += 2 * dpr) {
        var u = (x - wx0) / (wx1 - wx0);
        var env = Math.sin(u * Math.PI);
        var yy = wy - Math.sin(u * 44 - (live ? t * 16 : 0)) * A * env;
        if (x === wx0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      }

      if (ampEl) ampEl.textContent = amp.toFixed(2);
    }

    function frame(ts) {
      if (!running) return;
      var dt = Math.min(0.05, lastT ? (ts - lastT) / 1000 : 0.016);
      lastT = ts;
      t += dt;
      amp = Math.max(0.05, amp * Math.exp(-dt / 1.7));
      yawOff += (yawT - yawOff) * 0.06;
      tiltOff += (tiltT - tiltOff) * 0.06;
      if (t - lastStrike > 8.5) strike();
      render(true);
      raf = requestAnimationFrame(frame);
    }
    function should() { return visible && !doc.hidden && !idle(); }
    function update() {
      var go = should();
      if (go && !running) { running = true; lastT = 0; raf = requestAnimationFrame(frame); }
      else if (!go && running) { running = false; cancelAnimationFrame(raf); }
      if (!go) render(false);
    }
    function strike() {
      lastStrike = t;
      amp = 1;
      rings.push(t, t + 0.14, t + 0.28);
      if (!running) render(false);
    }

    // pointer: parallax + hover glow + strike
    function local(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    }
    function over(p) { return p.x > box.x0 - 26 && p.x < box.x1 + 26 && p.y > box.y0 - 20 && p.y < box.y1 + 20; }
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var p = local(e);
      yawT = clamp((p.x / p.w - 0.5) * 0.9, -0.6, 0.6);
      tiltT = clamp((p.y / p.h - 0.5) * 0.28, -0.2, 0.2);
      var h = over(p) && !e.target.closest('a, button');
      if (h !== hot) { hot = h; wrap.classList.toggle('is-hot', hot); if (!running) render(false); }
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { yawT = 0; tiltT = 0; if (hot) { hot = false; wrap.classList.remove('is-hot'); } });
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      if (over(local(e))) strike();
    });

    if (hasIO) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; update(); }).observe(wrap);
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(resize);
      ro.observe(wrap);
      if (botMeta) ro.observe(botMeta);
      if (topMeta) ro.observe(topMeta);
    } else window.addEventListener('resize', resize);
    doc.addEventListener('visibilitychange', update);
    resize();
    return { update: update, strike: strike };
  }

  /* =========================================================
     Case art — neon wireframes, one per motif (viewBox 320 × 200)
     ========================================================= */
  var ECG = 'M20 108H62L70 100L78 108H90L98 120L108 50L118 150L126 108H148L158 96L170 108H182L190 100L198 108H210L218 120L228 50L238 150L246 108H268L278 96L290 108H300';
  var ART = {
    latte:
      '<circle class="dm" cx="128" cy="100" r="86"/>' +
      '<circle class="dm" cx="128" cy="100" r="75" stroke-dasharray="2 5"/>' +
      '<path class="ln" d="M184 86h20a14 14 0 0 1 0 28h-20"/>' +
      '<circle class="ln gl" cx="128" cy="100" r="58"/>' +
      '<circle class="ln" cx="128" cy="100" r="50" opacity=".5"/>' +
      '<g class="spin" style="transform-origin:128px 100px">' +
        '<path class="mg gl" d="M128 130C104 113 96 97 108 85c8-8 18-5 20 6c2-11 12-14 20-6c12 12 4 28-20 45z"/>' +
        '<path class="mg" d="M128 60v70" opacity=".55"/>' +
        '<path class="mg" d="M92 78c12-16 60-16 72 0M92 122c12 16 60 16 72 0" opacity=".3"/>' +
      '</g>' +
      '<g transform="translate(270 0)">' +
        '<path class="dm" d="M0 36V164M-4 36h8M-4 68h8M-4 100h8M-4 132h8M-4 164h8"/>' +
        '<circle class="yl gl" cx="0" cy="36" r="7"/>' +
        '<path class="yl" d="M0 22v-5M0 50v5M-14 36h-5M14 36h5M-10 26l-3-3M10 26l3-3M-10 46l-3 3M10 46l3 3" opacity=".8"/>' +
        '<path class="mg gl" d="M3 154a10 10 0 1 0 6 16a8 8 0 0 1-6-16z"/>' +
        '<g class="bob"><path class="fc" d="M-9 38h18v3h-18z"/></g>' +
        '<text x="-44" y="71">12:00</text><text x="-44" y="135">18:00</text>' +
      '</g>',
    pulse:
      '<rect class="dm" x="20" y="34" width="280" height="132"/>' +
      '<path class="dm" d="M20 67h280M20 100h280M20 133h280M76 34v132M132 34v132M188 34v132M244 34v132" opacity=".45"/>' +
      '<path class="mg" opacity=".22" d="' + ECG + '"/>' +
      '<path class="mg gl" pathLength="100" stroke-dasharray="24 76" d="' + ECG + '"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="2.4s" repeatCount="indefinite"/></path>' +
      '<circle class="fy" r="3.4"><animateMotion dur="2.4s" begin="-0.576s" repeatCount="indefinite" path="' + ECG + '"/></circle>' +
      '<path class="mg gl" d="M34 52c-3-4-9-2-8 3c1 4 8 8 8 8s7-4 8-8c1-5-5-7-8-3z"/>' +
      '<text class="big" x="50" y="62">142</text>' +
      '<g transform="translate(232 44)"><path class="dm" d="M0 14h8v-4h-8zM12 14h8v-8h-8zM24 14h8v-12h-8z"/><path class="yl" d="M36 14h8v-16h-8z"/><path class="dm" d="M48 14h8v-20h-8z"/></g>',
    route:
      '<path class="ln" stroke-width="14" opacity=".13" d="M-10 158C50 138 84 188 150 160S250 112 330 130"/>' +
      '<path class="dm" d="M-10 150C50 130 84 180 150 152S250 104 330 122M-10 166C50 146 84 196 150 168S250 120 330 138"/>' +
      '<path class="dm" d="M0 40H320M0 82H320M0 118H250M40 0V200M100 0V200M170 0V150M230 0V200M290 0V110M10 200L310 10" opacity=".75"/>' +
      '<path class="dm" d="M112 92h46v18h-46zM182 50h36v22h-36zM242 128h36v22h-36zM52 50h36v22h-36zM112 50h46v22h-46z" opacity=".55"/>' +
      '<path id="cp-route" class="mg gl flow" d="M40 172V118H100V82H170V40H230L290 40"/>' +
      '<rect class="fy" x="35" y="167" width="10" height="10"/>' +
      '<path class="fm" d="M290 31l9 9-9 9-9-9z"/>' +
      '<circle class="ln ping" cx="100" cy="118" r="5"/><circle class="fc" cx="100" cy="118" r="2.6"/>' +
      '<circle class="ln ping d2" cx="170" cy="82" r="5"/><circle class="fc" cx="170" cy="82" r="2.6"/>' +
      '<circle class="ln ping d3" cx="230" cy="40" r="5"/><circle class="fc" cx="230" cy="40" r="2.6"/>' +
      '<g class="fc" opacity=".45"><circle cx="70" cy="40" r="2"/><circle cx="200" cy="118" r="2"/><circle cx="290" cy="82" r="2"/><circle cx="40" cy="82" r="2"/><circle cx="260" cy="118" r="2"/></g>' +
      '<g><circle class="fy" r="4.6"/><circle class="yl" r="10" opacity=".45"/><animateMotion dur="6s" repeatCount="indefinite" rotate="auto"><mpath href="#cp-route"/></animateMotion></g>' +
      '<text x="242" y="62">00:14</text><text x="50" y="190">#03 → #07</text>',
    sneaker:
      '<ellipse class="dm" cx="168" cy="170" rx="142" ry="13" stroke-dasharray="3 5"/>' +
      '<path class="dm" d="M44 132C110 127 200 129 290 136M46 118C100 113 150 115 190 116M52 104C74 104 92 108 112 100" opacity=".8"/>' +
      '<path class="ln gl" d="M36 146C32 158 42 164 62 164H262C286 164 300 156 298 141"/>' +
      '<path class="ln" d="M36 146C120 146 220 144 298 141"/>' +
      '<path class="ln gl" d="M38 146L40 108C41 96 48 88 60 90L84 96C96 99 106 94 112 86L126 68C130 62 138 62 142 67L180 104C200 118 238 120 266 122C286 124 298 132 298 141"/>' +
      '<path class="ln" d="M60 90C70 104 94 106 112 86M126 68L120 58C118 50 128 46 134 52L156 78" opacity=".8"/>' +
      '<path class="ln" d="M40 118C58 116 70 126 72 146M248 121C256 131 262 139 266 145"/>' +
      '<path class="yl" d="M137 78l10-4M145 86l10-4M153 94l10-4M161 102l10-4" />' +
      '<path class="mg gl" d="M150 144L176 104M166 144L192 110M182 144L206 114"/>' +
      '<path class="ln" d="M40 108L30 98L34 92L44 100"/>' +
      '<path class="dm" d="M36 186H150M186 186H298M36 181v10M298 181v10"/><text x="155" y="189">285</text>' +
      '<g class="scanx"><path class="yl" d="M0 50V172" opacity=".85"/><rect x="-14" y="50" width="14" height="122" fill="rgba(245,242,0,.07)"/></g>',
    orbit:
      '<g class="fc" opacity=".6"><circle cx="24" cy="26" r="1"/><circle cx="64" cy="170" r="1.2"/><circle cx="296" cy="160" r="1"/><circle cx="210" cy="20" r="1.2"/><circle cx="110" cy="30" r=".9"/><circle cx="300" cy="84" r="1"/><circle cx="20" cy="120" r="1"/></g>' +
      '<circle class="ln" cx="272" cy="42" r="10" opacity=".7"/><path class="dm" d="M262 42a10 4 0 0 0 20 0"/>' +
      '<g transform="rotate(-14 160 100)">' +
        '<path class="mg" d="M32 100A128 34 0 0 1 288 100" opacity=".4" stroke-dasharray="3 5"/>' +
        '<path id="cp-orbit" d="M32 100A128 34 0 0 0 288 100A128 34 0 0 0 32 100" fill="none" stroke="none"/>' +
        '<g><path class="fy" d="M-7-4L7 0L-7 4L-4 0Z"/><animate attributeName="opacity" values="0;1" keyTimes="0;0.5" calcMode="discrete" dur="9s" repeatCount="indefinite"/><animateMotion dur="9s" repeatCount="indefinite" rotate="auto"><mpath href="#cp-orbit"/></animateMotion></g>' +
      '</g>' +
      '<circle class="fv" cx="160" cy="100" r="46" opacity=".92"/>' +
      '<circle class="ln gl" cx="160" cy="100" r="46"/>' +
      '<g class="dm"><ellipse cx="160" cy="100" rx="46" ry="11"/><ellipse cx="160" cy="80" rx="41" ry="9"/><ellipse cx="160" cy="120" rx="41" ry="9"/><ellipse cx="160" cy="64" rx="28" ry="6"/><ellipse cx="160" cy="136" rx="28" ry="6"/><ellipse cx="160" cy="100" rx="17" ry="46"/><ellipse cx="160" cy="100" rx="33" ry="46"/></g>' +
      '<g transform="rotate(-14 160 100)">' +
        '<path class="mg gl" d="M288 100A128 34 0 0 1 32 100"/>' +
        '<g><path class="fy" d="M-7-4L7 0L-7 4L-4 0Z"/><path class="yl" d="M-11 0h-10" opacity=".7"/><animate attributeName="opacity" values="1;0" keyTimes="0;0.5" calcMode="discrete" dur="9s" repeatCount="indefinite"/><animateMotion dur="9s" repeatCount="indefinite" rotate="auto"><mpath href="#cp-orbit"/></animateMotion></g>' +
      '</g>' +
      '<text x="22" y="186">T+216 · 0.38</text>',
    ring:
      '<circle class="dm" cx="116" cy="100" r="82" stroke-dasharray="1 7" stroke-width="5" opacity=".7"/>' +
      '<circle class="ln" cx="116" cy="100" r="64" stroke-width="7" opacity=".14"/>' +
      '<circle class="mg gl draw" cx="116" cy="100" r="64" stroke-width="7" pathLength="100" transform="rotate(-90 116 100)"/>' +
      '<circle class="ln" cx="116" cy="100" r="44"/>' +
      '<circle class="dm" cx="116" cy="100" r="37"/>' +
      '<text class="big" x="116" y="108" text-anchor="middle">68%</text>' +
      '<g transform="translate(246 0)">' +
        '<path class="ln" d="M-28 148V96M28 148V96" opacity=".6"/>' +
        '<ellipse class="ln" cx="0" cy="148" rx="28" ry="8"/><ellipse class="ln" cx="0" cy="135" rx="28" ry="8" opacity=".7"/><ellipse class="ln" cx="0" cy="122" rx="28" ry="8" opacity=".7"/><ellipse class="ln" cx="0" cy="109" rx="28" ry="8" opacity=".7"/>' +
        '<ellipse class="fv" cx="0" cy="96" rx="28" ry="8"/><ellipse class="ln gl" cx="0" cy="96" rx="28" ry="8"/><ellipse class="yl" cx="0" cy="96" rx="16" ry="4"/>' +
        '<path class="dm" d="M-30 176h8M-18 176h8M-6 176h8M6 176h8M18 176h8" stroke-width="4"/><path class="yl" d="M30 176h8" stroke-width="4"/>' +
      '</g>'
  };
  function artSVG(motif) {
    return '<svg class="art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" focusable="false">' + (ART[motif] || '') + '</svg>';
  }

  // neon glow baked into the SVG: two wider, faint copies under each .gl stroke (a CSS drop-shadow
  // on animated strokes re-rasterises the filter region every frame)
  function haloize(host) {
    $$('.gl', host).forEach(function (el) {
      var sw = parseFloat(getComputedStyle(el).strokeWidth) || 1.3;
      [[6, 'halo'], [2.6, 'halo halo--in']].forEach(function (h) {
        var c = el.cloneNode(true);
        c.removeAttribute('id');
        c.setAttribute('class', el.getAttribute('class').split(' ').filter(function (x) { return x && x !== 'gl'; }).join(' ') + ' ' + h[1]);
        c.style.strokeWidth = (sw + h[0]) + 'px';
        el.parentNode.insertBefore(c, el);
      });
    });
  }

  function initServiceRows() {
    $$('.service').forEach(function (row) {
      var h = $('h3', row);
      if (h) row.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') scramble(h, { duration: 420, labelEl: h });
      });
    });
  }

  function initShards() {
    var cases = $$('.case');
    cases.forEach(function (c) {
      var art = $('.case__art', c);
      var m = c.getAttribute('data-motif');
      if (art && ART[m] && !art.firstElementChild) { art.innerHTML = artSVG(m); haloize(art); }
      var name = $('.case__name', c);
      var shell = $('.case__shell', c);
      if (shell && name) shell.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') scramble(name, { duration: 460, labelEl: name });
      });
    });
    syncShardLabels();
    function set(c, live) {
      live = live && !idle();
      c.classList.toggle('is-live', live);
      var svg = $('svg', c);
      if (!svg || !svg.pauseAnimations) return;
      if (live) svg.unpauseAnimations();
      else svg.pauseAnimations();
    }
    var state = new Map();
    function refresh() { cases.forEach(function (c) { set(c, state.get(c)); }); }
    if (hasIO) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { state.set(en.target, en.isIntersecting); set(en.target, en.isIntersecting); });
      }, { rootMargin: '60px 0px' });
      cases.forEach(function (c) { io.observe(c); });
    } else cases.forEach(function (c) { state.set(c, true); });
    // reduced motion / preview: freeze on a representative frame
    cases.forEach(function (c) {
      var svg = $('svg', c);
      if (svg && svg.setCurrentTime && idle()) { svg.setCurrentTime(1.3); svg.pauseAnimations(); }
    });
    return refresh;
  }
  function syncShardLabels() {
    $$('.case').forEach(function (c) {
      var i = c.getAttribute('data-index');
      var shell = $('.case__shell', c);
      if (shell) shell.setAttribute('data-lock-label', X('shards.' + i + '.id') || '');
    });
    $$('.plan').forEach(function (p) {
      var shell = $('.plan__shell', p);
      if (shell) shell.setAttribute('data-lock-label', X('tier') + ' 0' + (Number(p.getAttribute('data-index')) + 1));
    });
    $$('[data-style-key]').forEach(function (k) {
      k.setAttribute('data-lock-label', D.t('styles.' + k.getAttribute('data-style-key') + '.short') || '');
    });
  }

  /* =========================================================
     Services: ETA bars (weeks parsed from the copy, max 6)
     ========================================================= */
  function initServiceBars() {
    $$('.service').forEach(function (s) {
      var meta = $('.service__meta', s);
      var bar = $('.service__bar', s);
      if (!meta || !bar) return;
      var n = parseInt((meta.textContent.match(/\d+/) || ['0'])[0], 10) || 0;
      bar.textContent = '';
      for (var i = 0; i < 6; i++) {
        var seg = doc.createElement('i');
        if (i < n) seg.className = 'on';
        bar.appendChild(seg);
      }
    });
  }

  /* =========================================================
     Hazard tape (built from the service titles and project names)
     ========================================================= */
  function buildTape() {
    var services = (D.t('services.items') || []).map(function (s) { return s.title; });
    var projects = (D.t('work.items') || []).map(function (s) { return s.name; });
    $$('[data-tape]').forEach(function (track) {
      var front = track.getAttribute('data-tape') === 'front';
      var words = front ? services.concat(services) : projects.concat(projects, projects);
      track.textContent = '';
      for (var r = 0; r < 2; r++) {
        var g = doc.createElement('span');
        g.className = 'tape__group';
        words.forEach(function (w) {
          var s = doc.createElement('span');
          s.textContent = w;
          var hz = doc.createElement('i');
          hz.className = 'tape__hz';
          g.appendChild(s);
          g.appendChild(hz);
        });
        track.appendChild(g);
      }
    });
  }

  /* =========================================================
     Reveal on scroll + h2 decrypt
     ========================================================= */
  function initReveal() {
    var items = $$('[data-rv]');
    items.forEach(function (el) {
      var idx = el.getAttribute('data-index');
      var d;
      if (idx !== null) d = (Number(idx) % 4) * 90;
      else {
        var sib = $$(':scope > [data-rv]', el.parentElement);
        d = Math.max(0, sib.indexOf(el)) * 80;
      }
      el.style.setProperty('--rv-d', d + 'ms');
    });
    if (PREVIEW || reduced() || !hasIO) return;
    root.classList.add('cp-rv');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        el.classList.add('is-in');
        if (el.hasAttribute('data-decrypt')) {
          scramble(el, { duration: 820, labelEl: el, delay: 60, done: function () { glitch(el, 380); } });
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     Scroll: sector readout, depth, nav state, pipeline
     ========================================================= */
  var navLinks = [];
  function sectorName(i) { return i === 0 ? X('hud.top') : D.t('nav.items.' + (i - 1) + '.label'); }
  var lastSector = -1;
  var hudEls = null;
  function updateScroll() {
    if (!hudEls) hudEls = {
      pct: $$('[data-hud-pct]'), progress: $$('[data-hud-progress]'), marker: $$('[data-hud-marker]'),
      num: $$('[data-hud-num]'), name: $$('[data-hud-name]'), segs: $$('[data-hud-segs] i')
    };
    var id = D.currentSection();
    var idx = Math.max(0, D.sections.indexOf(id));
    var max = root.scrollHeight - window.innerHeight;
    var depth = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    var pctTxt = pad(depth * 100, 3) + '%';
    hudEls.pct.forEach(function (el) { if (el.textContent !== pctTxt) el.textContent = pctTxt; });
    hudEls.progress.forEach(function (el) { el.style.transform = 'scaleX(' + depth.toFixed(4) + ')'; });
    hudEls.marker.forEach(function (el) { el.style.transform = 'translateY(' + (depth * 36).toFixed(3) + 'vh)'; });
    if (idx !== lastSector) {
      lastSector = idx;
      var num = pad(idx + 1, 2) + '/' + pad(D.sections.length, 2);
      var nm = sectorName(idx);
      hudEls.num.forEach(function (el) { el.textContent = num; });
      hudEls.name.forEach(function (el) { el.textContent = nm; });
      hudEls.segs.forEach(function (s, i) { s.className = i < idx ? 'on' : i === idx ? 'cur' : ''; });
      navLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }
    updatePipeline();
  }
  var pipe = null, steps = [];
  var circuit = null;
  function updatePipeline() {
    if (!pipe) return;
    var p;
    if (PREVIEW || reduced()) p = 1;
    else {
      var r = pipe.getBoundingClientRect();
      var vh = window.innerHeight;
      p = clamp((vh * 0.78 - r.top) / Math.max(1, r.height * 0.9), 0, 1);
    }
    pipe.style.setProperty('--p', p.toFixed(4));
    var fr = circuit && circuit.on ? circuit.fr : null;
    if (fr) {
      var off = String((1 - p).toFixed(4));
      circuit.fill.style.strokeDashoffset = off;
      circuit.glow.style.strokeDashoffset = off;
      var pt = circuit.fill.getPointAtLength(p * circuit.len);
      circuit.pk.style.transform = 'translate3d(' + pt.x.toFixed(1) + 'px,' + pt.y.toFixed(1) + 'px,0)';
    }
    var n = steps.length;
    function thr(i) { return fr ? Math.max(0.01, fr[i] - 0.004) : i / n + 0.01; }
    steps.forEach(function (s, i) {
      var on = p >= thr(i) || p >= 0.999;
      s.classList.toggle('is-on', on);
      s.classList.toggle('is-current', on && (i === n - 1 || p < thr(i + 1)));
    });
  }

  /* Tablet (2×2 grid): route the trace as a PCB circuit 01 → 02, down the right edge, back along the
     row gap, down into 03 → 04 — with 45° chamfers. Fill, glow and packet follow the same --p. */
  function initCircuit() {
    var svg = pipe && $('.pipeline__circuit', pipe);
    if (!svg) return;
    var mq = window.matchMedia('(min-width: 700px) and (max-width: 999px)');
    var paths = $$('path', svg);
    circuit = { on: false, fr: null, len: 1, fill: $('.pipeline__c-fill', svg), glow: $('.pipeline__c-glow', svg), pk: $('.pipeline__c-packet', pipe) };
    function build() {
      circuit.on = mq.matches && steps.length === 4;
      if (!circuit.on) { circuit.fr = null; return; }
      var list = $('.steps', pipe);
      var c = steps.map(function (st) { return [list.offsetLeft + st.offsetLeft + 8, list.offsetTop + st.offsetTop + 8]; });
      var x1 = c[0][0], y1 = c[0][1], x2 = c[1][0], y3 = c[2][1];
      var gap = parseFloat(getComputedStyle(list).rowGap) || 48;
      var xr = pipe.clientWidth + 14;              // in the page gutter, right of column 2
      var ym = y3 - 8 - gap / 2;                   // middle of the row gap
      var k = 12;                                  // chamfer
      var d = 'M' + x1 + ' ' + y1 + 'H' + (xr - k) + 'L' + xr + ' ' + (y1 + k) + 'V' + (ym - k) +
        'L' + (xr - k) + ' ' + ym + 'H' + (x1 + k) + 'L' + x1 + ' ' + (ym + k) + 'V' + y3 + 'H' + x2;
      paths.forEach(function (el) { el.setAttribute('d', d); });
      var ch = k * Math.SQRT2;
      var row = x2 - x1;
      var L = (xr - k - x1) + ch + (ym - k - y1 - k) + ch + (xr - k - x1 - k) + ch + (y3 - ym - k) + row;
      circuit.len = circuit.fill.getTotalLength() || L;
      circuit.fr = [0, row / L, (L - row) / L, 1];
    }
    function rebuild() { build(); updatePipeline(); }
    if (mq.addEventListener) mq.addEventListener('change', rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe($('.steps', pipe));
    else window.addEventListener('resize', rebuild);
    build();
  }

  /* =========================================================
     HUD — reticle that tracks the cursor and locks onto targets
     ========================================================= */
  function initHud() {
    var hud = $('[data-hud]');
    if (!hud) return;
    var clocks = $$('[data-hud-clock]');
    function clock() {
      var d = new Date();
      var s = pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2);
      clocks.forEach(function (el) { if (el.textContent !== s) el.textContent = s; });
    }
    clock();
    setInterval(function () { if (!doc.hidden) clock(); }, 500);

    if (PREVIEW) return;
    var rc = $$('.hud__rc', hud);
    var xl = $('.hud__xline', hud);
    var yl = $('.hud__yline', hud);
    var tag = $('[data-hud-tag]', hud);
    var lockB = $('[data-hud-lock]', hud);
    var xy = $$('[data-hud-xy], [data-hud-pos]');
    var LOCK = 'a[href], button, summary, label.chip, input, textarea, [data-lock]';
    var SZ = 9;
    var P = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var C = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    var lockEl = null, on = false, looping = false, tagW = 140;

    function tr(x, y) { return 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; }
    function targets() {
      if (lockEl && lockEl.isConnected) {
        var r = lockEl.getBoundingClientRect();
        if (r.width && r.bottom > 0 && r.top < window.innerHeight) {
          var p = 6;
          return [[r.left - p, r.top - p], [r.right + p, r.top - p], [r.left - p, r.bottom + p], [r.right + p, r.bottom + p]];
        }
      }
      var s = 14;
      return [[P.x - s, P.y - s], [P.x + s, P.y - s], [P.x - s, P.y + s], [P.x + s, P.y + s]];
    }
    function place() {
      rc[0].style.transform = tr(C[0].x, C[0].y);
      rc[1].style.transform = tr(C[1].x - SZ, C[1].y);
      rc[2].style.transform = tr(C[2].x, C[2].y - SZ);
      rc[3].style.transform = tr(C[3].x - SZ, C[3].y - SZ);
      xl.style.transform = tr(0, P.y);
      yl.style.transform = tr(P.x, 0);
      // free: the tag rides the reticle; locked: it stays by the pointer (targets can be taller than the screen)
      var ax = lockEl ? P.x + 18 : C[3].x + 6, ay = lockEl ? P.y + 20 : C[3].y + 6;
      var tx = Math.max(8, Math.min(ax, window.innerWidth - tagW - 14));
      var ty = Math.max(8, Math.min(ay, window.innerHeight - 110));
      tag.style.transform = tr(tx, ty);
    }
    function loop() {
      var T = targets();
      var k = reduced() ? 1 : 0.28;
      var moving = false;
      for (var i = 0; i < 4; i++) {
        var dx = T[i][0] - C[i].x, dy = T[i][1] - C[i].y;
        if (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25) { moving = true; C[i].x += dx * k; C[i].y += dy * k; }
        else { C[i].x = T[i][0]; C[i].y = T[i][1]; }
      }
      place();
      if (moving) requestAnimationFrame(loop); else looping = false;
    }
    function kick() { if (on && !looping) { looping = true; requestAnimationFrame(loop); } }
    function lockText(el) {
      if (!el) return '';
      var extra = el.getAttribute('data-lock-label');
      return X('hud.lock') + (extra ? ' ▸ ' + extra : '');
    }
    function setLock(el) {
      if (el === lockEl) return;
      lockEl = el;
      hud.classList.toggle('is-locked', !!el);
      lockB.textContent = lockText(el);
      tagW = tag.offsetWidth || tagW;
      kick();
    }
    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      P.x = e.clientX; P.y = e.clientY;
      if (!on) {
        on = true;
        hud.classList.add('is-tracking');
        var T = targets();
        for (var i = 0; i < 4; i++) { C[i].x = T[i][0]; C[i].y = T[i][1]; }
        tagW = tag.offsetWidth || tagW;
      }
      var txt = 'X ' + pad(P.x, 4) + ' · Y ' + pad(P.y, 4);
      xy.forEach(function (el) { el.textContent = txt; });
      kick();
    }, { passive: true });
    doc.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var el = e.target && e.target.closest ? e.target.closest(LOCK) : null;
      if (el && el.closest('.dz-dock, .hud, [hidden]')) el = null;
      setLock(el);
    }, { passive: true });
    doc.addEventListener('pointerout', function (e) {
      if (e.relatedTarget) return;
      on = false;
      hud.classList.remove('is-tracking');
      setLock(null);
    }, { passive: true });
    window.addEventListener('scroll', kick, { passive: true });
    D.on('langchange', function () { lockB.textContent = lockText(lockEl); tagW = tag.offsetWidth || tagW; });
  }

  /* =========================================================
     Header: height variable, mobile menu
     ========================================================= */
  function initHeader() {
    var header = $('[data-header]');
    if (!header) return;
    function setH() { root.style.setProperty('--hdr', header.offsetHeight + 'px'); }
    setH();
    if ('ResizeObserver' in window) new ResizeObserver(setH).observe(header); else window.addEventListener('resize', setH);

    var btn = $('[data-menu-btn]');
    var label = $('.menu-btn__label', btn);
    var nav = $('#site-nav');
    var behind = [$('main'), $('.site-footer')].filter(Boolean);
    var open = false;
    function set(v) {
      open = v;
      header.classList.toggle('is-open', v);
      root.classList.toggle('cp-menu-open', v);
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      behind.forEach(function (el) { el.inert = v; if (v) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
      var key = v ? 'a11y.close' : 'a11y.menu';
      label.setAttribute('data-i18n', key);
      label.textContent = D.t(key);
    }
    btn.addEventListener('click', function () { set(!open); if (open) { var first = $('a', nav); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60); } });
    nav.addEventListener('click', function (e) { if (open && e.target.closest('a')) set(false); });
    doc.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') { set(false); btn.focus(); } });
    var mqDesk = window.matchMedia('(min-width: 1180px)');
    var onDesk = function () { if (mqDesk.matches && open) set(false); };
    if (mqDesk.addEventListener) mqDesk.addEventListener('change', onDesk);
  }

  /* =========================================================
     In-page anchors: smooth scroll on click only (keyboard focus scrolling stays instant)
     ========================================================= */
  function initAnchors() {
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('dz-skip')) return;
      var id = a.getAttribute('href').slice(1);
      var target = id ? doc.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(history.state, '', location.pathname + location.search + '#' + id); } catch (err) {}
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* =========================================================
     Hover decrypt on links and buttons
     ========================================================= */
  function initHoverScramble() {
    doc.addEventListener('pointerover', function (e) {
      if (e.pointerType !== 'mouse') return;
      var host = e.target.closest && e.target.closest('[data-scramble]');
      if (!host || (e.relatedTarget && host.contains(e.relatedTarget))) return;
      var tgt = host.querySelector('[data-i18n]');
      if (!tgt) return;
      scramble(tgt, { duration: 360, labelEl: host, lockWidth: host.classList.contains('btn') });
    });
  }

  /* =========================================================
     Terminal form: block caret, invalid shake, packet id, inert body
     ========================================================= */
  function initForm() {
    var form = $('form[data-dz-form]');
    if (!form) return;
    var body = $('[data-form-body]', form);
    var measure = doc.createElement('canvas').getContext('2d');
    form.classList.add('has-caret');

    $$('.field--line input', form).forEach(function (inp) {
      var caret = $('.field__caret', inp.parentNode);
      if (!caret) return;
      function place() {
        var s = inp.selectionStart, en = inp.selectionEnd;
        if (doc.activeElement !== inp || s == null || s !== en) { caret.classList.remove('is-on'); return; }
        var cs = getComputedStyle(inp);
        measure.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        var w = measure.measureText(inp.value.slice(0, s)).width;
        var padL = parseFloat(cs.paddingLeft) || 0;
        var x = inp.offsetLeft + padL + w - inp.scrollLeft;
        x = Math.min(x, inp.offsetLeft + inp.clientWidth - 6);
        caret.style.setProperty('--cx', x.toFixed(1) + 'px');
        caret.style.top = (inp.offsetTop + (parseFloat(cs.paddingTop) || 0) + 1) + 'px';
        caret.classList.add('is-on');
        caret.style.animation = 'none';
        void caret.offsetWidth;
        caret.style.animation = '';
      }
      var q = function () { requestAnimationFrame(place); };
      ['focus', 'blur', 'input', 'keydown', 'keyup', 'click', 'select', 'scroll'].forEach(function (ev) { inp.addEventListener(ev, q); });
      doc.addEventListener('selectionchange', function () { if (doc.activeElement === inp) q(); });
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(q);
    });

    function syncErrPrefix() { $$('.field__error', form).forEach(function (el) { el.setAttribute('data-prefix', X('form.error')); }); }
    syncErrPrefix();
    D.on('langchange', syncErrPrefix);

    form.addEventListener('diapason:forminvalid', function (e) {
      if (reduced()) return;
      ((e.detail && e.detail.fields) || []).forEach(function (n) {
        var f = form.elements[n] && form.elements[n].closest('.field');
        if (!f) return;
        f.classList.remove('is-shake');
        void f.offsetWidth;
        f.classList.add('is-shake');
        setTimeout(function () { f.classList.remove('is-shake'); }, 400);
      });
    });
    form.addEventListener('diapason:formsending', function () {
      var pk = $('[data-packet]', form);
      if (pk) pk.textContent = '#' + hex4() + '-' + hex4();
    });
    form.addEventListener('diapason:formsent', function () {
      if (body) body.setAttribute('inert', '');
      // the message sits in the middle of a tall panel — bring it to the middle of the screen
      var r = form.getBoundingClientRect();
      var mid = r.top + r.height / 2;
      if (mid < window.innerHeight * 0.2 || mid > window.innerHeight * 0.8) {
        form.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      }
      var done = $('.form__done', form);
      if (done) setTimeout(function () { glitch(done, 420); }, 380);
    });
    // runs before core's reset handler (capture), so the name field is focusable again
    form.addEventListener('click', function (e) {
      if (e.target.closest('[data-form-reset]') && body) body.removeAttribute('inert');
    }, true);
  }

  /* =========================================================
     Misc copy-driven bits
     ========================================================= */
  function syncBadges() {
    $$('.plan__badge').forEach(function (b) { b.hidden = !b.textContent.trim(); });
  }
  function syncHoloHint() {
    var hint = $('[data-holo-hint]');
    if (!hint) return;
    var key = mqFine.matches ? 'x.cyberpunk.holo.hintMouse' : 'x.cyberpunk.holo.hintTouch';
    hint.setAttribute('data-i18n', key);
    hint.textContent = D.t(key);
  }

  /* =========================================================
     Boot it all
     ========================================================= */
  D.ready(function () {
    navLinks = $$('.site-nav a');
    pipe = $('[data-pipeline]');
    steps = $$('.step');

    syncBadges();
    syncHoloHint();
    initServiceBars();
    initServiceRows();
    buildTape();
    syncGlitch();
    initHeader();

    var holoWrap = $('[data-holo]');
    if (holoWrap) holo = Holo(holoWrap);

    initCircuit();
    var refreshShards = initShards();
    initReveal();
    initHud();
    initHoverScramble();
    initAnchors();
    initForm();

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; updateScroll(); });
    }, { passive: true });
    window.addEventListener('resize', function () { lastSector = -1; updateScroll(); });
    updateScroll();

    runBoot(function () {
      startIntro();
      if (holo) holo.update();
    });

    setTimeout(ambientGlitch, 3200);

    D.on('langchange', function () {
      stopAllScrambles();
      syncGlitch();
      buildTape();
      syncBadges();
      syncShardLabels();
      lastSector = -1;
      updateScroll();
    });
    D.on('previewactive', function (d) {
      previewActive = !!(d && d.active);
      if (holo) holo.update();
      if (refreshShards) refreshShards();
    });
    D.on('motionchange', function () {
      if (holo) holo.update();
      if (refreshShards) refreshShards();
      updatePipeline();
    });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { lastSector = -1; updateScroll(); });
  });
})();
