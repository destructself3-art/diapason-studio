/*
 * Diapason · 04 Minimalism
 * One continuous line draws itself through the page as you scroll. It starts as the full stop of the
 * hero headline and ends as the full stop of the footer tagline. Everything else stays quiet.
 */
(function () {
  'use strict';

  var D = window.DIAPASON;
  if (!D) return;

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var isPreview = D.isPreview;
  var reduced = D.reducedMotion;
  var animate = !isPreview && !reduced;

  if (animate) root.classList.add('mz-anim');
  if (!animate) root.classList.add('mz-static');

  var mqWide = window.matchMedia('(min-width: 1024px)');
  var mqNav = window.matchMedia('(min-width: 1100px)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt || false); }

  /* ------------------------------------------------------------ the one curve */
  function bezier(x1, y1, x2, y2) {
    function A(a, b) { return 1 - 3 * b + 3 * a; }
    function B(a, b) { return 3 * b - 6 * a; }
    function C(a) { return 3 * a; }
    function at(t, a, b) { return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
    function slope(t, a, b) { return 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a); }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var s = slope(t, x1, x2);
        if (Math.abs(s) < 1e-6) break;
        t -= (at(t, x1, x2) - x) / s;
      }
      return at(clamp(t, 0, 1), y1, y2);
    };
  }
  var ease = bezier(0.22, 1, 0.36, 1);

  /* ------------------------------------------------------------ typographer
   * Non-breaking spaces where Russian (and good English) typography wants them:
   * short words stick to the next word, dashes stick to the previous one, numbers keep their units.
   */
  function typo(s, lang) {
    if (!s) return s;
    // short prefixes never dangle at a line end: «вау-/момент», «SLA-/тревоги», «веб-/приложения».
    // A word joiner after the hyphen removes the break (Manrope has no U+2011 glyph, so the hyphen stays Manrope's)
    s = s.replace(/(^|[\s(«„"])([A-Za-zА-Яа-яЁё0-9]{1,4})-(?=[A-Za-zА-Яа-яЁё0-9])/g, '$1$2-⁠');
    s = s.replace(/ ([—–]) /g, ' $1 ');
    s = s.replace(/(\d) (?=\d{3}(?!\d))/g, '$1 ');
    s = s.replace(/(\d) (?=(?:₽|ч|px|h|%)(?![A-Za-zА-Яа-яЁё]))/g, '$1 ');
    if (lang === 'ru') {
      var re = /(^|[\s «(„])([А-Яа-яЁё]{1,2}) /g;
      s = s.replace(re, '$1$2 ').replace(re, '$1$2 ');
    } else {
      var re2 = /(^|[\s (])(a|an|I|&) /g;
      s = s.replace(re2, '$1$2 ');
    }
    return s;
  }
  function typeset() {
    var lang = D.lang;
    $$('[data-i18n]', body).forEach(function (el) {
      if (el.children.length || el.closest('.dz-dock')) return;
      var t = el.textContent;
      var n = typo(t, lang);
      if (n !== t) el.textContent = n;
    });
  }

  /* prices: the "от / from" prefix is set small, the figure stays large */
  function formatPrices() {
    $$('.plan__price').forEach(function (el) {
      if (el.children.length) return;
      var m = /^(от|from)[\s ]+(.+)$/i.exec(el.textContent);
      if (!m) return;
      var pre = doc.createElement('span');
      pre.className = 'plan__from';
      pre.textContent = m[1];
      el.textContent = '';
      el.appendChild(pre);
      el.appendChild(doc.createTextNode(m[2]));
    });
  }

  /* ------------------------------------------------------------ word masks */
  function splitEl(el) {
    var text = el.textContent;
    var stop = el.hasAttribute('data-stop');
    var words = text.split(/ +/).filter(Boolean);
    el.textContent = '';
    words.forEach(function (word, i) {
      var last = i === words.length - 1;
      var w = doc.createElement('span');
      var inner = doc.createElement('span');
      w.className = 'w';
      inner.className = 'w__i';
      if (stop && last && /\.$/.test(word)) {
        inner.appendChild(doc.createTextNode(word.slice(0, -1)));
        var st = doc.createElement('span');
        st.className = 'stop';
        st.textContent = '.';
        inner.appendChild(st);
        w.appendChild(inner);
        var bl = doc.createElement('i');
        bl.className = 'bl';
        bl.setAttribute('aria-hidden', 'true');
        w.appendChild(bl);
      } else if (stop && last) {
        inner.textContent = word;
        w.appendChild(inner);
        var bl2 = doc.createElement('i');
        bl2.className = 'bl';
        bl2.setAttribute('aria-hidden', 'true');
        w.appendChild(bl2);
      } else {
        inner.textContent = word;
        w.appendChild(inner);
      }
      el.appendChild(w);
      if (!last) el.appendChild(doc.createTextNode(' '));
    });
  }
  function splitAll() {
    $$('[data-split]').forEach(function (host) {
      var leaves = host.hasAttribute('data-i18n') ? [host] : $$('[data-i18n]', host);
      var i = 0;
      leaves.forEach(function (el) {
        splitEl(el);
        $$('.w__i', el).forEach(function (s) { s.style.setProperty('--i', i++); });
      });
    });
  }

  /* ------------------------------------------------------------ hero headline: first line set to the measure
   * On desktop the first line is fitted to the column width (capped), so RU and EN share one composition:
   * a full-width statement and a quiet, right-aligned reply. Phones keep natural wrapping.
   * The size is also capped by the height: meta, headline and foot must all rest above the style dock
   * on the first screen (1280×720, 1366×768 laptops included). */
  function fitHero() {
    var h1 = $('.hero__title');
    var line = $('.hero__line');
    if (!h1 || !line) return;
    if (!mqWide.matches) {
      h1.style.fontSize = '';
      h1.classList.remove('is-fit');
      return;
    }
    var wrap = $('#top .wrap');
    var cs = getComputedStyle(wrap);
    var avail = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    h1.style.fontSize = '100px';
    h1.classList.add('is-fit');
    line.classList.add('is-measuring');
    var w = line.getBoundingClientRect().width;
    line.classList.remove('is-measuring');
    if (!w) { h1.style.fontSize = ''; h1.classList.remove('is-fit'); return; }
    var vw = root.clientWidth;
    var vh = window.innerHeight;
    var max = Math.min(164, vw * 0.096, Math.max(vw * 0.07, vh * 0.16));
    var fit = 100 * avail / w * 0.985;
    var size = Math.min(max, fit);
    // height budget: viewport − header − dock-safe bottom − everything in the hero that is not the headline
    var foot = $('.hero__foot');
    var meta = $('.hero__meta');
    var hdr = $('.site-header');
    var perPx = h1.offsetHeight / 100;
    if (foot && meta && perPx > 0) {
      var dock = parseFloat(getComputedStyle(root).getPropertyValue('--dz-dock-space')) || 96;
      var rest = parseFloat(cs.paddingTop) + meta.offsetHeight + parseFloat(getComputedStyle(h1).marginTop) +
        parseFloat(getComputedStyle(foot).marginTop) + foot.offsetHeight;
      var byH = (vh - (hdr ? hdr.offsetHeight : 72) - dock - 8 - rest) / perPx;
      // below ~700 px of height the page simply scrolls: keep a readable floor rather than a tiny headline
      if (byH < size) size = Math.max(byH, Math.min(size, 64));
    }
    h1.style.fontSize = size.toFixed(2) + 'px';
  }

  /* ------------------------------------------------------------ case art: 1 px line drawings */
  function ticks(cx, cy, r1, r2, n, cls, keep) {
    var d = '';
    for (var i = 0; i < n; i++) {
      if (keep && !keep(i)) continue;
      var a = (i / n) * Math.PI * 2 - Math.PI / 2;
      var c = Math.cos(a);
      var s = Math.sin(a);
      d += 'M' + (cx + c * r1).toFixed(1) + ' ' + (cy + s * r1).toFixed(1) + 'L' + (cx + c * r2).toFixed(1) + ' ' + (cy + s * r2).toFixed(1);
    }
    return '<path class="' + cls + '" d="' + d + '"/>';
  }
  function motion(path, dur) {
    return '<circle class="dot" cx="0" cy="0" r="4.5"><animateMotion dur="' + dur + '" repeatCount="indefinite" path="' + path + '"/></circle>';
  }
  var ART = {
    latte: function () {
      var dial = 'M89 150A111 111 0 1 1 311 150A111 111 0 1 1 89 150';
      return '' +
        '<circle class="g" cx="200" cy="150" r="120"/>' +
        ticks(200, 150, 106, 114, 24, 'k', function (i) { return i >= 18 || i <= 6; }) +
        ticks(200, 150, 108, 114, 24, 'g', function (i) { return i > 6 && i < 18; }) +
        '<path d="M86 150H74"/>' +
        '<circle cx="200" cy="150" r="80"/>' +
        '<circle cx="200" cy="150" r="70"/>' +
        '<path d="M279 137H297A13 13 0 0 1 297 163H279"/>' +
        '<path d="M200 191C171 171 159 155 161 140C163 126 176 118 189 121C195 123 198 128 200 134C202 128 205 123 211 121C224 118 237 126 239 140C241 155 229 171 200 191Z"/>' +
        '<path class="g" d="M147 118A64 64 0 0 1 172 96"/>' +
        '<circle class="mk" cx="89" cy="150" r="4.5"/>' +
        motion(dial, '12s');
    },
    pulse: function () {
      var ecg = 'M24 172H110C117 172 119 158 127 158C135 158 137 172 144 172H164L175 190L193 70L213 220L225 172H248C258 172 262 148 278 148C294 148 298 172 308 172H376';
      return '' +
        '<path class="h" d="M24 88H376M24 130H376M24 214H376M24 256H376M80 60V270M140 60V270M200 60V270M260 60V270M320 60V270"/>' +
        '<path d="' + ecg + '"/>' +
        '<circle class="mk" cx="193" cy="70" r="4.5"/>' +
        motion(ecg, '2.4s');
    },
    route: function () {
      var route = 'M76 226H176L172 146H262V64H334';
      return '' +
        '<path class="g" d="M20 64H380M20 146C120 140 250 152 380 142M20 226H380M76 20V280M168 20L178 280M262 20V280M334 20C328 110 340 200 332 280"/>' +
        '<path class="h" d="M20 262C90 244 150 284 230 262S340 240 380 250M20 276C90 258 150 298 230 276S340 254 380 264"/>' +
        '<path d="' + route + '"/>' +
        '<circle class="fk" cx="76" cy="226" r="3.5"/>' +
        '<circle cx="175" cy="186" r="4"/>' +
        '<circle cx="262" cy="106" r="4"/>' +
        '<circle cx="334" cy="64" r="4"/>' +
        '<circle cx="334" cy="64" r="11"/>' +
        '<circle class="mk" cx="218" cy="146" r="4.5"/>' +
        motion(route, '6s');
    },
    sneaker: function () {
      return '' +
        '<path d="M60 134C50 160 44 188 46 208V214C46 222 52 228 62 228H336C358 228 374 220 374 206C374 194 364 188 348 184C300 172 262 156 232 136C214 124 198 112 184 104C178 100 170 100 166 106L160 120C140 134 108 138 86 130C76 126 68 128 60 134Z"/>' +
        '<path d="M46 208H340C356 208 366 204 372 198"/>' +
        '<path class="g" d="M64 219H338"/>' +
        '<path d="M318 208C318 194 330 186 348 184"/>' +
        '<path class="g" d="M106 208C102 180 96 152 88 131"/>' +
        '<path d="M60 134L55 117L65 115L69 132"/>' +
        '<circle cx="187" cy="119" r="2.2"/><circle cx="201" cy="128" r="2.2"/><circle cx="215" cy="137" r="2.2"/><circle cx="229" cy="146" r="2.2"/>' +
        '<path d="M187 119L193 108M201 128L208 117M215 137L222 126M229 146L237 135"/>' +
        '<path class="dash fade" d="M112 196C164 176 232 170 300 188"/>' +
        '<path class="g" d="M58 166H80M58 174H74M58 182H78"/>' +
        '<circle class="spot" cx="70" cy="174" r="10"/>' +
        '<circle class="mk" cx="70" cy="174" r="4.5"/>' +
        '<circle class="dot" cx="70" cy="174" r="4.5"/>';
    },
    orbit: function () {
      var ell = 'M42 150A158 50 0 1 0 358 150A158 50 0 1 0 42 150';
      return '' +
        '<g class="fade">' +
          '<circle class="fg" cx="58" cy="46" r="1.4"/><circle class="fg" cx="344" cy="36" r="1.4"/>' +
          '<circle class="fg" cx="362" cy="236" r="1.4"/><circle class="fg" cx="36" cy="244" r="1.4"/>' +
          '<circle class="fg" cx="116" cy="268" r="1.4"/><circle class="fg" cx="296" cy="274" r="1.4"/>' +
          '<circle class="fg" cx="248" cy="28" r="1.4"/>' +
        '</g>' +
        '<circle class="g" cx="326" cy="80" r="9"/>' +
        '<g transform="rotate(-12 200 150)">' +
          '<path d="M42 150A158 50 0 0 1 358 150"/>' +
        '</g>' +
        '<circle cx="200" cy="150" r="54" style="fill:var(--paper)"/>' +
        '<path class="g" d="M200 96A30 54 0 0 1 200 204"/>' +
        '<g transform="rotate(-12 200 150)">' +
          '<path d="M42 150A158 50 0 0 0 358 150"/>' +
          '<circle class="mk" cx="200" cy="200" r="4.5"/>' +
          motion(ell, '7s') +
        '</g>';
    },
    ring: function () {
      return '' +
        '<circle class="h" cx="200" cy="150" r="96"/>' +
        ticks(200, 150, 106, 112, 30, 'g') +
        '<circle class="ring-arc" cx="200" cy="150" r="96" pathLength="100" transform="rotate(-90 200 150)"/>' +
        '<circle cx="200" cy="150" r="32"/>' +
        '<circle class="g" cx="200" cy="150" r="25"/>' +
        // a coin, not a knob: a reeded rim and the currency of the page's language
        ticks(200, 150, 27.4, 30.2, 40, 'g') +
        '<path class="cur cur--rub" d="M196 163V137H203.5A6.5 6.5 0 0 1 203.5 150H196M191.5 155.5H203"/>' +
        '<path class="cur cur--usd" d="M205.5 143C204.6 140.6 202.6 139.3 200 139.3C196.8 139.3 194.7 141.3 194.7 144C194.7 147.2 197.6 148.3 200.3 149.2C203.2 150.2 205.7 151.5 205.7 154.9C205.7 158 203.3 160.4 200 160.4C197.1 160.4 195 159.1 194.2 156.6M200 135.6V164.4"/>' +
        '<circle class="mk" cx="134.3" cy="220" r="4.5"/>' +
        '<g class="ring-dot"><circle class="dot" cx="200" cy="54" r="4.5"/></g>';
    }
  };
  function drawArt() {
    $$('.case').forEach(function (c) {
      var host = c.querySelector('.case__art');
      var motif = c.getAttribute('data-motif');
      if (!host || !ART[motif] || host.firstElementChild) return;
      host.innerHTML = '<svg class="art art--' + motif + '" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" focusable="false">' + ART[motif]() + '</svg>';
      var svg = host.firstElementChild;
      var k = 0;
      $$('path, circle', svg).forEach(function (el) {
        var cls = el.getAttribute('class') || '';
        if (/\b(mk|dot|spot|ring-arc|fk|fg|dash)\b/.test(cls) || el.closest('.fade')) return;
        el.setAttribute('pathLength', '1');
        el.style.setProperty('--k', k++);
      });
      if (svg.pauseAnimations) { try { svg.pauseAnimations(); } catch (e) {} }
    });
  }
  function sizeArt() {
    $$('.art').forEach(function (svg) {
      var w = svg.clientWidth;
      var h = svg.clientHeight;
      if (!w || !h) return;
      var scale = Math.min(w / 400, h / 300);
      svg.style.setProperty('--sw', (1 / scale).toFixed(3));
    });
  }
  function setCaseActive(c, onOff) {
    if (c.classList.contains('is-active') === onOff) return;
    c.classList.toggle('is-active', onOff);
    var svg = c.querySelector('.art');
    if (!svg || !svg.pauseAnimations) return;
    try {
      if (onOff && animate) svg.unpauseAnimations(); else svg.pauseAnimations();
    } catch (e) {}
  }
  function bindCases() {
    if (isPreview) return;
    var cases = $$('.case');
    if (mqFine.matches) {
      cases.forEach(function (c) {
        on(c, 'pointerenter', function () { setCaseActive(c, true); });
        on(c, 'pointerleave', function () { setCaseActive(c, false); });
      });
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { setCaseActive(e.target, e.isIntersecting); });
      }, { rootMargin: '-38% 0px -38% 0px' });
      cases.forEach(function (c) { io.observe(c); });
    }
  }

  /* ------------------------------------------------------------ reveal on scroll */
  var revealIO = null;
  function markReveal() {
    var fade = [
      '.hero__meta', '.hero__lead', '.hero__actions', '.stat',
      '.svc__sticky .section-num', '.svc__sticky .section-lead', '.service',
      '.sec-head .section-num', '.sec-head .section-lead',
      '.case', '.work__more', '.step > *', '.plan', '.pricing__note',
      '.faq__item', '.contact__aside', '.form', '.footer__brand', '.colophon', '.footer__links'
    ];
    fade.forEach(function (sel) { $$(sel).forEach(function (el) { el.setAttribute('data-reveal', ''); }); });
    ['.sec-head', '.svc__sticky', '.stat', '.service', '.step', '.footer__grid'].forEach(function (sel) {
      $$(sel).forEach(function (el) { el.setAttribute('data-rule', ''); });
    });
  }
  function reveal(el, d) {
    el.style.setProperty('--d', d || 0);
    el.classList.add('is-in');
  }
  function initReveal() {
    markReveal();
    if (!animate || !('IntersectionObserver' in window)) {
      $$('[data-reveal], [data-rule], [data-split], .case').forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    revealIO = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) {
        var ra = a.getBoundingClientRect();
        var rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      batch.forEach(function (el, i) {
        reveal(el, Math.min(i, 6));
        revealIO.unobserve(el);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0 });
    $$('[data-reveal], [data-rule], [data-split], .case').forEach(function (el) {
      if (el.closest('#top')) return; // the hero plays its own entrance
      revealIO.observe(el);
    });
  }
  function heroEntrance() {
    var title = $('.hero__title');
    var parts = [$('.hero__meta')].concat($$('.hero__lead, .hero__actions, .stat'));
    if (!animate) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        reveal(title, 0);
        parts.forEach(function (el, i) {
          el.style.transitionDelay = (i === 0 ? 120 : 520 + i * 70) + 'ms';
          el.classList.add('is-in');
        });
        setTimeout(function () { parts.forEach(function (el) { el.style.transitionDelay = ''; }); }, 2400);
      });
    });
  }

  /* ------------------------------------------------------------ THE LINE */
  var S = {
    svg: null, path: null, tip: null, marksG: null,
    prims: [], total: 0, ls: [], ys: [], xs: [], ym: [],
    introLen: 0, marks: [], startR: 6, endR: 5, travelR: 5,
    cur: 0, raf: 0, last: 0, pending: 0, ready: false, snap: true, snapUntil: 0,
    intro: 'done', introT0: 0, start: null, left: null, roT: 0, roLast: 0
  };
  // the opening gesture: the dot appears on the full stop as the headline lands, holds a beat, then draws
  var INTRO_DOT = 380;   // ms after the hero entrance starts (the last word is landing)
  var INTRO_HOLD = 440;  // ms on the full stop
  var INTRO_MS = 1250;   // the underline and the drop into the margin, on the one curve
  var heroThis = $('.hero__this');
  var fontsDone = false;
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { fontsDone = true; });
  var footer = $('.site-footer');

  function makeSvg() {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'mz-line');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = doc.createElementNS(NS, 'path');
    path.setAttribute('class', 'mz-line__path');
    var marks = doc.createElementNS(NS, 'g');
    var tip = doc.createElementNS(NS, 'circle');
    tip.setAttribute('class', 'mz-line__tip');
    tip.setAttribute('r', '5');
    var start = doc.createElementNS(NS, 'circle');
    start.setAttribute('class', 'mz-line__start');
    start.setAttribute('r', '1.5');
    svg.appendChild(path);
    svg.appendChild(start);
    svg.appendChild(marks);
    svg.appendChild(tip);
    body.appendChild(svg);
    S.svg = svg; S.path = path; S.tip = tip; S.marksG = marks; S.start = start;
  }

  /* layout-space rectangles (ignore transforms used by reveal animations) */
  function lrect(el) {
    var x = 0;
    var y = 0;
    var n = el;
    while (n && n !== body && n !== root) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent;
    }
    return { l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight, w: el.offsetWidth, h: el.offsetHeight };
  }
  function snap(v) { return Math.floor(v) + 0.5; }

  var gctx = null;
  var gcache = {};
  function glyphBox(weight, fs) {
    var key = weight + '/' + fs;
    if (gcache[key]) return gcache[key];
    if (!gctx) gctx = doc.createElement('canvas').getContext('2d');
    var box = null;
    if (gctx) {
      gctx.font = weight + ' ' + fs + 'px Manrope, sans-serif';
      var m = gctx.measureText('.');
      if (m && typeof m.actualBoundingBoxRight === 'number') {
        box = { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
      }
    }
    if (!box || !(box.r + box.l > 0)) box = { l: -fs * 0.05, r: fs * 0.14, a: fs * 0.09, d: 0 };
    var loaded = doc.fonts && doc.fonts.check ? doc.fonts.check(weight + ' ' + fs + 'px Manrope') : true;
    if (loaded) gcache[key] = box;
    return box;
  }
  function stopPoint(host) {
    var st = host && host.querySelector('.stop');
    var bl = host && host.querySelector('.bl');
    if (!bl) {
      var r = lrect(host);
      return { x: r.r, y: r.b - 20, rad: 5, fs: 40 };
    }
    var ref = st || bl.previousElementSibling || host;
    var cs = getComputedStyle(ref);
    var fs = parseFloat(cs.fontSize) || 40;
    var b = bl.getBoundingClientRect();
    var base = b.bottom + window.scrollY;
    if (!st) return { x: b.left + window.scrollX + fs * 0.12, y: base - fs * 0.05, rad: fs * 0.05 + 1, fs: fs };
    var m = glyphBox(cs.fontWeight, fs);
    var w = st.getBoundingClientRect().width;
    var x0 = b.left + window.scrollX - w;
    return {
      x: x0 + (m.r - m.l) / 2,
      y: base + (m.d - m.a) / 2,
      rad: Math.max(m.l + m.r, m.a + m.d) * 0.62 + 0.9,
      fs: fs
    };
  }

  /* an orthogonal polyline with rounded corners → primitives (lines and quarter arcs) + SVG path data */
  function buildPath(pts, defR) {
    var P = [];
    pts.forEach(function (p) {
      var q = P[P.length - 1];
      if (q && Math.abs(q[0] - p[0]) < 0.01 && Math.abs(q[1] - p[1]) < 0.01) {
        if (p[2] != null) q[2] = p[2];
        return;
      }
      if (q && Math.abs(q[0] - p[0]) >= 0.01 && Math.abs(q[1] - p[1]) >= 0.01) P.push([q[0], p[1], null]);
      P.push([p[0], p[1], p[2] == null ? null : p[2]]);
    });
    for (var i = P.length - 2; i > 0; i--) {
      var a = P[i - 1];
      var b = P[i];
      var c = P[i + 1];
      var vx = Math.abs(a[0] - b[0]) < 0.01 && Math.abs(b[0] - c[0]) < 0.01;
      var hz = Math.abs(a[1] - b[1]) < 0.01 && Math.abs(b[1] - c[1]) < 0.01;
      if ((vx && Math.sign(b[1] - a[1]) === Math.sign(c[1] - b[1])) || (hz && Math.sign(b[0] - a[0]) === Math.sign(c[0] - b[0]))) P.splice(i, 1);
    }
    var prims = [];
    var cx = P[0][0];
    var cy = P[0][1];
    var f = function (v) { return (Math.round(v * 100) / 100).toString(); };
    var d = 'M' + f(cx) + ' ' + f(cy);
    function line(x, y) {
      var len = Math.hypot(x - cx, y - cy);
      if (len < 0.01) return;
      prims.push({ t: 0, x0: cx, y0: cy, x1: x, y1: y, len: len });
      d += 'L' + f(x) + ' ' + f(y);
      cx = x; cy = y;
    }
    for (var k = 1; k < P.length; k++) {
      var p = P[k];
      if (k === P.length - 1) { line(p[0], p[1]); break; }
      var prev = P[k - 1];
      var next = P[k + 1];
      var ix = Math.sign(p[0] - prev[0]);
      var iy = Math.sign(p[1] - prev[1]);
      var ox = Math.sign(next[0] - p[0]);
      var oy = Math.sign(next[1] - p[1]);
      var lin = Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1]);
      var lout = Math.abs(next[0] - p[0]) + Math.abs(next[1] - p[1]);
      var r = p[2] != null ? p[2] : defR;
      r = Math.min(r, lin * (k === 1 ? 1 : 0.5), lout * (k === P.length - 2 ? 1 : 0.5));
      var cross = ix * oy - iy * ox;
      if (r < 0.5 || cross === 0) { line(p[0], p[1]); continue; }
      var sx = p[0] - ix * r;
      var sy = p[1] - iy * r;
      line(sx, sy);
      var ex = p[0] + ox * r;
      var ey = p[1] + oy * r;
      var ccx = sx + ox * r;
      var ccy = sy + oy * r;
      prims.push({ t: 1, cx: ccx, cy: ccy, r: r, a0: Math.atan2(sy - ccy, sx - ccx), da: cross > 0 ? Math.PI / 2 : -Math.PI / 2, len: r * Math.PI / 2 });
      d += 'A' + f(r) + ' ' + f(r) + ' 0 0 ' + (cross > 0 ? 1 : 0) + ' ' + f(ex) + ' ' + f(ey);
      cx = ex; cy = ey;
    }
    return { prims: prims, d: d, x0: P[0][0], y0: P[0][1] };
  }
  function primPoint(p, t) {
    if (p.t === 0) return { x: p.x0 + (p.x1 - p.x0) * t, y: p.y0 + (p.y1 - p.y0) * t };
    var a = p.a0 + p.da * t;
    return { x: p.cx + p.r * Math.cos(a), y: p.cy + p.r * Math.sin(a) };
  }
  function pointAt(len) {
    var pr = S.prims;
    if (!pr.length) return { x: 0, y: 0 };
    var lo = 0;
    var hi = pr.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (pr[mid].s <= len) lo = mid; else hi = mid - 1;
    }
    var p = pr[lo];
    return primPoint(p, p.len ? clamp((len - p.s) / p.len, 0, 1) : 0);
  }
  function lenAtY(Y) {
    var ym = S.ym;
    var ls = S.ls;
    var n = ym.length;
    if (!n) return 0;
    if (Y <= ym[0]) return 0;
    if (Y >= ym[n - 1]) return S.total;
    var lo = 0;
    var hi = n - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (ym[mid] < Y) lo = mid; else hi = mid;
    }
    var y0 = ym[lo];
    var y1 = ym[hi];
    var t = y1 > y0 ? (Y - y0) / (y1 - y0) : 1;
    return ls[lo] + (ls[hi] - ls[lo]) * t;
  }
  function lenNear(x, y) {
    var best = 0;
    var bd = Infinity;
    for (var i = 0; i < S.ls.length; i++) {
      var dx = S.xs[i] - x;
      var dy = S.ys[i] - y;
      var dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = S.ls[i]; }
    }
    return best;
  }

  function route() {
    var pts = [];
    var marks = [];
    function P(x, y, r) { pts.push([x, y, r]); }
    function mid(a, b) { return snap((a + b) / 2); }

    var wrap = $('#top .wrap');
    var wr = lrect(wrap);
    var cs = getComputedStyle(wrap);
    var pad = parseFloat(cs.paddingLeft) || 24;
    var cL = wr.l + pad;
    var cR = wr.r - (parseFloat(cs.paddingRight) || pad);
    var L = snap(cL - pad / 2);
    var R = snap(cR + pad / 2);
    var wide = mqWide.matches;

    // hero: the dot leaves the full stop, drops below the headline and underlines it, right to left
    var s = stopPoint($('.hero__this'));
    var sx = snap(s.x);
    // on small headlines a short drop with a quarter arc would read as a comma («тихий,»):
    // there the drop is longer and the corner almost square
    var small = s.fs < 72;
    var dropY = snap(s.y + (small ? Math.max(24, s.fs * 0.5) : s.fs * 0.34));
    P(sx, s.y);
    P(sx, dropY, small ? 3 : Math.min(26, s.fs * 0.2));
    P(L, dropY);
    var introY = dropY + clamp(window.innerHeight * 0.14, 80, 150);
    var heroBottom = lrect($('#top .wrap')).b;

    var q = function (sel) { return $(sel); };

    if (wide) {
      // services: the lane between the sticky title and the list
      var aside = lrect(q('.svc__aside'));
      var list = lrect(q('.services'));
      var laneS = mid(aside.r, list.l);
      var y1 = mid(heroBottom, Math.min(aside.t, list.t));
      P(L, y1); P(laneS, y1);

      // work: weave through the staggered grid
      var wHead = lrect(q('#work .sec-head'));
      var y2 = mid(list.b, wHead.t);
      P(laneS, y2); P(R, y2);
      var cases = $$('.case').map(lrect);
      var gridTop = Math.min.apply(null, cases.map(function (c) { return c.t; }));
      var y3 = mid(wHead.b, gridTop);
      P(R, y3);
      var lane = R;
      for (var i = 0; i < cases.length; i += 2) {
        var a = cases[i];
        var b = cases[i + 1];
        var laneW = b ? snap((a.r + b.l) / 2) : snap(a.r + 48);
        if (i === 0) P(laneW, y3);
        else {
          var pb = Math.max(cases[i - 2].b, cases[i - 1].b);
          var jy = mid(pb, b ? Math.min(a.t, b.t) : a.t);
          P(lane, jy); P(laneW, jy);
        }
        lane = laneW;
      }
      var more = lrect(q('.work__more'));
      var workBottom = Math.max(more.b, cases[cases.length - 1].b, cases[cases.length - 2] ? cases[cases.length - 2].b : 0);

      // process: the line becomes the staircase — treads and risers
      var pHead = lrect(q('#process .sec-head'));
      var y4 = mid(workBottom, pHead.t);
      P(lane, y4); P(L, y4);
      var steps = $$('.step').map(lrect);
      steps.forEach(function (st, k) {
        var ty = snap(st.t);
        if (k === 0) P(L, ty);
        else {
          var rx = snap((steps[k - 1].r + st.l) / 2);
          var py = snap(steps[k - 1].t);
          P(rx, py, 14); P(rx, ty, 14);
        }
        marks.push([snap(st.l) + 5, ty]);
      });
      var lastTy = snap(steps[steps.length - 1].t);
      P(R, lastTy);

      // pricing: it frames the featured column — along the top rule, down its left edge,
      // back along its foot — and leaves down the next divider
      var planEls = $$('.plan');
      var plans = planEls.map(lrect);
      var box = lrect(q('.plans'));
      var top = snap(box.t);
      var bot = snap(box.b - 1);
      var feat = planEls.findIndex(function (el) { return el.getAttribute('data-featured') === 'true'; });
      if (plans.length === 3 && feat === 1) {
        var f12 = snap(plans[1].l);
        var f23 = snap(plans[2].l);
        P(R, top); P(f12, top, 0); P(f12, bot, 0); P(f23, bot, 0);
        var noteF = lrect(q('.pricing__note'));
        var fHeadF = lrect(q('#faq .sec-head'));
        var y5f = mid(Math.max(box.b, noteF.b), fHeadF.t);
        P(f23, y5f); P(L, y5f);
      } else if (plans.length >= 3) {
        var d23 = snap(plans[2].l);
        var d12 = snap(plans[1].l);
        P(R, top); P(d23, top, 0); P(d23, bot, 0); P(d12, bot, 0);
        var note = lrect(q('.pricing__note'));
        var fHead = lrect(q('#faq .sec-head'));
        var y5 = mid(Math.max(box.b, note.b), fHead.t);
        P(d12, y5); P(L, y5);
      } else {
        var fHead2 = lrect(q('#faq .sec-head'));
        var y5b = mid(box.b, fHead2.t);
        P(R, y5b); P(L, y5b);
      }

      // contact: the lane between the details and the form
      var cHead = lrect(q('#contact .sec-head'));
      var cAside = lrect(q('.contact__aside'));
      var form = lrect(q('.form'));
      var laneC = mid(cAside.r, form.l);
      var y6 = mid(cHead.b, Math.min(cAside.t, form.t));
      P(L, y6); P(laneC, y6);
      var fLead = lrect(q('.footer__lead'));
      var y7 = mid(Math.max(cAside.b, form.b), fLead.t);
      P(laneC, y7); P(R, y7);
    } else {
      // phones and tablets: the line keeps to the margins and switches sides between sections
      var secs = [
        { head: '.svc__sticky', lane: R, last: '.services' },
        { head: '#work .sec-head', lane: L, last: '.work__more' },
        { head: '#process .sec-head', lane: L, last: '.steps', steps: true },
        { head: '#pricing .sec-head', lane: R, last: '.pricing__note' },
        { head: '#faq .sec-head', lane: L, last: '.faq' },
        { head: '#contact .sec-head', lane: R, last: '.form' }
      ];
      var curLane = L;
      var prevB = heroBottom;
      secs.forEach(function (sec) {
        var hd = lrect(q(sec.head));
        if (sec.lane !== curLane) {
          // cross on the section's own top hairline, so the line draws each rule as it passes
          var y = snap(hd.t);
          P(curLane, y); P(sec.lane, y);
          curLane = sec.lane;
        }
        if (sec.steps) $$('.step').forEach(function (st) { marks.push([curLane, snap(lrect(st).t)]); });
        prevB = lrect(q(sec.last)).b;
      });
      if (curLane !== R) {
        var fl = lrect(q('.footer__lead'));
        var y8 = mid(prevB, fl.t);
        P(curLane, y8); P(R, y8);
      }
    }

    // finale: in from the right margin, onto the full stop of the tagline
    var e = stopPoint($('.footer__tagline'));
    var ey = snap(e.y);
    P(R, ey);
    P(snap(e.x), ey);

    return { pts: pts, marks: marks, start: s, end: e, introY: introY, wide: wide };
  }

  function rebuild() {
    S.pending = 0;
    if (!S.svg) return;
    var fitKey = root.clientWidth + 'x' + (mqWide.matches ? window.innerHeight : 0) + (fontsDone ? 'f' : '');
    if (S.fitKey !== fitKey) { S.fitKey = fitKey; fitHero(); }
    var rt;
    try { rt = route(); } catch (err) { return; }
    var built = buildPath(rt.pts, rt.wide ? 40 : 24);
    var total = 0;
    built.prims.forEach(function (p) { p.s = total; total += p.len; });
    var ls = [];
    var xs = [];
    var ys = [];
    built.prims.forEach(function (p, idx) {
      var n = Math.max(1, Math.ceil(p.len / 4));
      for (var k = idx === 0 ? 0 : 1; k <= n; k++) {
        var t = k / n;
        var pt = primPoint(p, t);
        ls.push(p.s + p.len * t);
        xs.push(pt.x);
        ys.push(pt.y);
      }
    });
    var ym = new Array(ys.length);
    var mx = -Infinity;
    for (var i = 0; i < ys.length; i++) { mx = Math.max(mx, ys[i]); ym[i] = mx; }

    S.prims = built.prims;
    S.total = total;
    S.ls = ls; S.xs = xs; S.ys = ys; S.ym = ym;
    S.startR = rt.start.rad;
    S.endR = rt.end.rad;
    S.start.setAttribute('cx', built.x0.toFixed(2));
    S.start.setAttribute('cy', built.y0.toFixed(2));
    S.travelR = rt.wide ? 5 : 4;
    // the gesture ends where the scroll-bound line rests at the top of the page, so nothing moves on after it
    S.introLen = Math.min(total, Math.max(lenAtY(rt.introY), lenAtY(window.innerHeight * 0.62)));

    S.path.setAttribute('d', built.d);
    S.path.setAttribute('pathLength', String(total));
    S.path.style.strokeDasharray = total + ' ' + (total + 64);

    // step markers
    while (S.marksG.firstChild) S.marksG.removeChild(S.marksG.firstChild);
    S.marks = rt.marks.map(function (m) {
      var c = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', 'mz-line__mark');
      c.setAttribute('cx', m[0]);
      c.setAttribute('cy', m[1]);
      c.setAttribute('r', rt.wide ? 4.5 : 4);
      S.marksG.appendChild(c);
      return { el: c, len: lenNear(m[0], m[1]) };
    });

    updateLength();
    S.ready = true;
    if (S.cur > total) S.cur = total;
    render(S.cur);
    kick();
  }
  function scheduleRebuild() {
    if (S.pending) return;
    S.pending = requestAnimationFrame(rebuild);
  }
  function softRebuild() {
    var now = performance.now();
    var wait = 140 - (now - S.roLast);
    if (wait <= 0) { S.roLast = now; scheduleRebuild(); return; }
    if (!S.roT) S.roT = setTimeout(function () { S.roT = 0; S.roLast = performance.now(); scheduleRebuild(); }, wait);
  }

  function updateLength() {
    var el = $('.colophon__len');
    if (!el || !S.total) return;
    var n = Math.round(S.total / 10) * 10;
    var str = n.toLocaleString(D.lang === 'ru' ? 'ru-RU' : 'en-US');
    var vars = JSON.stringify({ len: str });
    if (el.getAttribute('data-i18n-vars') === vars && el.textContent.indexOf(str) > -1) return;
    el.setAttribute('data-i18n-vars', vars);
    el.textContent = typo(D.fmt(D.t('x.minimalism.lineLength'), { len: str }), D.lang);
  }

  function scrollLen() {
    var vh = window.innerHeight;
    var sy = window.scrollY;
    var max = Math.max(1, root.scrollHeight - vh);
    var k = 0.62;
    var endY = S.ym.length ? S.ym[S.ym.length - 1] : 0;
    var kEnd = (endY - max) / vh + 0.04;
    if (kEnd > k) {
      var f = clamp((sy - (max - vh)) / vh, 0, 1);
      k += (kEnd - k) * f;
    }
    if (sy >= max - 2) return S.total;
    return lenAtY(sy + vh * k);
  }
  function introBase(now) {
    if (S.intro === 'wait') return 0;
    if (S.intro === 'run') {
      var p = clamp((now - S.introT0) / INTRO_MS, 0, 1);
      if (p >= 1) { S.intro = 'done'; return S.introLen; }
      return S.introLen * ease(p);
    }
    return S.introLen;
  }
  function render(len) {
    if (!S.total) return;
    len = clamp(len, 0, S.total);
    S.path.style.strokeDashoffset = String(S.total - len);
    var p = pointAt(len);
    var r = S.travelR;
    var k1 = clamp(len / 90, 0, 1);
    var k2 = clamp((S.total - len) / 90, 0, 1);
    if (k1 < 1) r = S.startR + (S.travelR - S.startR) * ease(k1);
    else if (k2 < 1) r = S.endR + (S.travelR - S.endR) * ease(k2);
    S.tip.setAttribute('cx', p.x.toFixed(2));
    S.tip.setAttribute('cy', p.y.toFixed(2));
    S.tip.setAttribute('r', r.toFixed(2));
    for (var i = 0; i < S.marks.length; i++) {
      var m = S.marks[i];
      var passed = len >= m.len - 1;
      if (m.on !== passed) { m.on = passed; m.el.classList.toggle('is-passed', passed); }
    }
    var done = len >= S.total - 1;
    if (footer && S.done !== done) { S.done = done; footer.classList.toggle('is-line-done', done); }
    var left = len > 0.5;
    if (S.left !== left) {
      S.left = left;
      S.svg.classList.toggle('is-left', left);
      if (heroThis) heroThis.classList.toggle('is-left', left);
    }
  }
  function tick(now) {
    S.raf = 0;
    if (!S.ready) return;
    var dt = S.last ? Math.min(50, now - S.last) : 16.7;
    S.last = now;
    var base = introBase(now);
    var running = S.intro === 'run';
    var sl = S.intro === 'wait' || S.intro === 'run' ? 0 : scrollLen();
    var tgt = Math.max(base, sl);
    if (running) {
      S.cur = tgt;
    } else if (!animate || S.snap || now < S.snapUntil) {
      S.cur = tgt;
      S.snap = false;
    } else {
      var next = S.cur + (tgt - S.cur) * (1 - Math.exp(-dt / 120));
      if (S.intro === 'run') next = Math.max(next, base);
      if (Math.abs(tgt - next) < 0.35) next = tgt;
      S.cur = next;
    }
    render(S.cur);
    if (S.cur !== tgt || S.intro === 'run') kick();
    else S.last = 0;
  }
  function kick() {
    if (!S.raf) S.raf = requestAnimationFrame(tick);
  }
  function startIntro() {
    if (S.intro !== 'wait') return;
    S.svg.classList.add('is-on');
    setTimeout(function () {
      if (S.intro !== 'wait') return;
      S.intro = 'run';
      S.introT0 = performance.now();
      kick();
    }, INTRO_HOLD);
  }
  function skipIntro() {
    if (S.intro === 'done') return;
    S.intro = 'done';
    S.svg.classList.add('is-on');
    kick();
  }

  function initLine() {
    makeSvg();
    var atTop = window.scrollY < 40 && !(location.hash && location.hash.length > 1 && location.hash !== '#top');
    if (animate && atTop) {
      S.intro = 'wait';
      S.snap = false;
    } else {
      S.intro = 'done';
      S.snap = true;
      S.snapUntil = performance.now() + 1800;
      S.svg.classList.add('is-on');
    }
    rebuild();
    on(window, 'scroll', function () {
      if (S.intro === 'wait' && window.scrollY > 4) skipIntro();
      kick();
    }, { passive: true });
    on(window, 'resize', scheduleRebuild);
    if ('ResizeObserver' in window) new ResizeObserver(softRebuild).observe(body);
    if (doc.fonts) {
      if (doc.fonts.ready) doc.fonts.ready.then(scheduleRebuild);
      on(doc.fonts, 'loadingdone', scheduleRebuild);
    }
    on(window, 'load', scheduleRebuild);
    // the hash realignment in core scrolls after load: land on the right spot without a long redraw
    if (!atTop) on(window, 'load', function () { S.snapUntil = performance.now() + 900; kick(); });
  }

  /* ------------------------------------------------------------ header: hide on the way down, scrollspy, menu */
  var header = $('.site-header');
  var menuBtn = $('.menu-btn');
  var menuOpen = false;
  var navLinks = $$('.site-nav a');
  var lastY = window.scrollY;
  var hdrTick = false;

  function onHeaderScroll() {
    hdrTick = false;
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    if (!menuOpen && !isPreview && !header.contains(doc.activeElement)) {
      if (y > lastY + 6 && y > 280) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 120) header.classList.remove('is-hidden');
    }
    lastY = y;
    var sec = D.currentSection();
    navLinks.forEach(function (a) {
      a.classList.toggle('is-current', a.getAttribute('href') === '#' + sec);
    });
  }
  function setMenu(open, returnFocus) {
    if (menuOpen === open) return;
    menuOpen = open;
    root.classList.toggle('is-menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    var label = menuBtn.querySelector('.menu-btn__label');
    var key = open ? 'a11y.close' : 'a11y.menu';
    label.setAttribute('data-i18n', key);
    label.textContent = D.t(key);
    ['#main', '.site-footer'].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) {
      header.classList.remove('is-hidden');
      var first = $('.site-nav a');
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    } else if (returnFocus) {
      menuBtn.focus({ preventScroll: true });
    }
  }
  function initHeader() {
    on(window, 'scroll', function () {
      if (!hdrTick) { hdrTick = true; requestAnimationFrame(onHeaderScroll); }
    }, { passive: true });
    on(header, 'focusin', function () { header.classList.remove('is-hidden'); });
    // keyboard focus never hides under the sticky header (WCAG 2.4.11): Shift+Tab aligns a control to the very
    // top edge, where the header (shown again by the upward scroll) would cover it
    on(doc, 'focusin', function (e) {
      var t = e.target;
      if (!t || !t.getBoundingClientRect || header.contains(t) || (t.closest && t.closest('.dz-dock, .dz-skip'))) return;
      requestAnimationFrame(function () {
        if (doc.activeElement !== t || menuOpen) return;
        var vis = false;
        try { vis = t.matches(':focus-visible'); } catch (err) { vis = true; }
        if (!vis) return;
        var box = (t.closest && t.closest('.chip')) || t;
        var need = header.offsetHeight + 16;
        var top = box.getBoundingClientRect().top;
        if (top < need) window.scrollBy({ top: top - need, behavior: 'instant' });
      });
    });
    on(menuBtn, 'click', function () { setMenu(!menuOpen, false); });
    on(doc, 'keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { e.preventDefault(); setMenu(false, true); }
    });
    $$('.site-menu a').forEach(function (a) {
      on(a, 'click', function () { if (menuOpen) setMenu(false, false); });
    });
    var mqChange = function () { if (mqNav.matches && menuOpen) setMenu(false, false); };
    if (mqNav.addEventListener) mqNav.addEventListener('change', mqChange);
    onHeaderScroll();
  }

  /* ------------------------------------------------------------ the dot cursor & magnetic links (pointer: fine) */
  function initCursor() {
    if (!animate || !mqFine.matches) return;
    var dot = doc.createElement('div');
    dot.className = 'mz-cursor';
    dot.setAttribute('aria-hidden', 'true');
    body.appendChild(dot);
    root.classList.add('mz-cursor-on');
    var mx = -100;
    var my = -100;
    var cx = -100;
    var cy = -100;
    var raf = 0;
    var seen = false;
    function loop() {
      raf = 0;
      cx += (mx - cx) * 0.34;
      cy += (my - cy) * 0.34;
      if (Math.abs(mx - cx) < 0.1 && Math.abs(my - cy) < 0.1) { cx = mx; cy = my; }
      dot.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (cx !== mx || cy !== my) raf = requestAnimationFrame(loop);
    }
    on(doc, 'pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      if (!seen) { seen = true; cx = mx; cy = my; dot.classList.add('is-on'); }
      var t = e.target;
      var inDock = t.closest && t.closest('.dz-dock');
      var typing = t.closest && t.closest('input:not([type="checkbox"]):not([type="radio"]), textarea');
      dot.classList.toggle('is-off', !!(inDock || typing));
      dot.classList.toggle('is-link', !!(t.closest && t.closest('a, button, summary, label, [data-magnetic]')));
      dot.classList.toggle('is-art', !!(t.closest && t.closest('.case__art')));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    on(doc, 'pointerdown', function () { dot.classList.add('is-down'); });
    on(doc, 'pointerup', function () { dot.classList.remove('is-down'); });
    on(doc.documentElement, 'mouseleave', function () { dot.classList.add('is-off'); });
    on(doc.documentElement, 'mouseenter', function () { dot.classList.remove('is-off'); });

    $$('[data-magnetic]').forEach(function (el) {
      on(el, 'pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.setProperty('--mx', clamp(dx * 0.22, -9, 9).toFixed(1) + 'px');
        el.style.setProperty('--my', clamp(dy * 0.32, -7, 7).toFixed(1) + 'px');
      });
      on(el, 'pointerleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });
  }

  /* ------------------------------------------------------------ smooth scrolling for in-page links only
   * (a global scroll-behavior would also animate focus scrolling, which fights keyboard users) */
  function initAnchors() {
    var t = 0;
    on(doc, 'click', function (e) {
      if (!animate || e.defaultPrevented || e.button !== 0) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('dz-skip')) return;
      root.classList.add('mz-smooth');
      clearTimeout(t);
      t = setTimeout(function () { root.classList.remove('mz-smooth'); }, 2200);
    }, true);
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
      on(window, ev, function () { if (root.classList.contains('mz-smooth')) { clearTimeout(t); t = setTimeout(function () { root.classList.remove('mz-smooth'); }, 400); } }, { passive: true });
    });
  }

  /* ------------------------------------------------------------ form: keep the result in view; the message grows with its text */
  function initForm() {
    var form = $('form[data-dz-form]');
    if (!form) return;
    var ta = $('textarea', form);
    if (ta) {
      var grow = function () {
        var cs = getComputedStyle(ta);
        ta.style.height = 'auto';
        ta.style.height = (ta.scrollHeight + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)) + 'px';
      };
      on(ta, 'input', grow);
      on(form, 'reset', function () { setTimeout(grow, 0); });
      on(form, 'diapason:formreset', function () { setTimeout(grow, 0); });
    }
    on(form, 'diapason:formsent', function () {
      var r = form.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.6) {
        var y = window.scrollY + r.top - Math.min(160, window.innerHeight * 0.2);
        window.scrollTo({ top: y, behavior: animate ? 'smooth' : 'auto' });
      }
    });
  }

  /* ------------------------------------------------------------ language switch: re-typeset, re-split, redraw */
  // keep the reader where they are: remember the block nearest the top before the copy changes length
  var langAnchor = null;
  function pickAnchor() {
    var best = null;
    var bestD = Infinity;
    $$('.hero__title, .hero__foot, .sec-head, .svc__aside, .service, .case, .work__more, .step, .plan, .pricing__note, .faq__item, .contact__aside, .field, .footer__lead, .footer__grid').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= window.innerHeight) return;
      var d = Math.abs(r.top - 80);
      if (d < bestD) { bestD = d; best = { el: el, top: r.top }; }
    });
    return best;
  }
  function restoreAnchor() {
    if (!langAnchor) return;
    var a = langAnchor;
    langAnchor = null;
    if (!a.el.isConnected) return;
    var d = a.el.getBoundingClientRect().top - a.top;
    if (Math.abs(d) > 1) window.scrollTo({ top: window.scrollY + d, behavior: 'instant' });
  }
  on(doc, 'click', function (e) {
    var b = e.target.closest && e.target.closest('[data-set-lang], [data-lang-toggle]');
    if (!b || b.getAttribute('data-set-lang') === D.lang) return;
    langAnchor = pickAnchor();
  }, true);

  function onLang() {
    typeset();
    formatPrices();
    splitAll();
    fitHero();
    restoreAnchor();
    if (!animate) $$('[data-split]').forEach(function (el) { el.classList.add('is-in'); });
    else {
      // headings in view rise again in the new language
      var vh = window.innerHeight;
      $$('[data-split].is-in').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.classList.remove('is-in');
        void el.offsetWidth;
        el.classList.add('is-in');
      });
    }
    updateLength();
    scheduleRebuild();
  }

  /* ------------------------------------------------------------ boot */
  D.ready(function () {
    typeset();
    formatPrices();
    splitAll();
    fitHero();
    drawArt();
    sizeArt();
    initReveal();
    initHeader();
    initLine();
    initCursor();
    bindCases();
    initAnchors();
    initForm();

    if ('ResizeObserver' in window) {
      var artRO = new ResizeObserver(sizeArt);
      $$('.case__art').forEach(function (el) { artRO.observe(el); });
    }

    D.on('langchange', onLang);
    D.on('motionchange', function (d) {
      reduced = !!(d && d.reduced);
      animate = !isPreview && !reduced;
      root.classList.toggle('mz-static', !animate);
      if (!animate) {
        root.classList.remove('mz-anim');
        skipIntro();
        $$('.art').forEach(function (s) { try { s.pauseAnimations(); } catch (e) {} });
      }
    });

    if (!animate) {
      $$('[data-split]').forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    // hero entrance waits for the webfont (max 1.1 s), then the full stop sets off
    var started = false;
    var go = function () {
      if (started) return;
      started = true;
      scheduleRebuild();
      heroEntrance();
      setTimeout(function () { scheduleRebuild(); startIntro(); }, INTRO_DOT);
    };
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go);
    setTimeout(go, 1100);
  });
})();
