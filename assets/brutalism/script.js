/*
 * Diapason · 01 Brutalism — behaviour.
 * Fitted headline (every line fills the width, words break by force), draggable stickers
 * (mouse / touch / arrow keys, constrained to their section), SVG case art, tickers, header, reveals, form states.
 */
(function () {
  'use strict';

  var D = window.DIAPASON;
  if (!D) return;
  var root = document.documentElement;
  var isPreview = D.isPreview;
  var reduced = function () { return D.reducedMotion || root.classList.contains('dz-reduced-motion'); };

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* =====================================================================
   * 1. Fitted headline
   * ===================================================================== */
  var HYPH = {};
  function buildHyph() {
    HYPH = {};
    var list = D.t('x.brutalism.hyph') || [];
    list.forEach(function (w) { HYPH[w.replace(/-/g, '').toLowerCase()] = w.split('-'); });
  }
  var LETTER = /[\p{L}\p{N}]/u;
  function letterCount(s) { var n = 0; for (var i = 0; i < s.length; i++) if (LETTER.test(s[i])) n++; return n; }

  // "характером." → ["харак", "те", "ром."] (breaks leave ≥ 3 letters on each side)
  function splitWord(word) {
    var m = word.match(/^(.*?)([.,!?:;…»"]*)$/);
    var core = m[1], tail = m[2];
    var parts = HYPH[core.toLowerCase()];
    if (!parts) return [word];
    var total = core.length, cuts = [], acc = 0;
    for (var i = 0; i < parts.length - 1; i++) {
      acc += parts[i].length;
      if (acc >= 3 && total - acc >= 3) cuts.push(acc);
    }
    if (!cuts.length) return [word];
    var out = [], prev = 0;
    cuts.forEach(function (c) { out.push(core.slice(prev, c)); prev = c; });
    out.push(core.slice(prev) + tail);
    return out;
  }

  function segments(text) {
    var words = text.trim().split(/\s+/);
    var segs = [];
    words.forEach(function (w, wi) {
      var parts = splitWord(w);
      parts.forEach(function (p, pi) { segs.push({ t: p, brk: pi < parts.length - 1 ? 'hyph' : 'space', w: wi }); });
    });
    function lastOf(wi) { for (var k = segs.length - 1; k >= 0; k--) if (segs[k].w === wi) return k; return -1; }
    words.forEach(function (w, wi) {
      var n = letterCount(w);
      if (n === 0 && wi > 0) segs[lastOf(wi - 1)].brk = 'nb';            // "—" sticks to the previous word
      else if (n > 0 && n <= 2 && wi < words.length - 1) segs[lastOf(wi)].brk = 'nb'; // "с" sticks to the next word
    });
    segs[segs.length - 1].brk = 'end';
    return segs;
  }
  function lineText(segs, i, j) {
    var s = '';
    for (var k = i; k <= j; k++) {
      s += segs[k].t;
      if (k < j) s += segs[k].brk === 'hyph' ? '' : ' ';
    }
    if (segs[j].brk === 'hyph') s += '-';
    return s;
  }

  var measureEl = null, measureCache = {};
  function measure(str) {
    if (measureCache[str] != null) return measureCache[str];
    measureEl.textContent = str;
    var w = measureEl.getBoundingClientRect().width || 1;
    measureCache[str] = w;
    return w;
  }

  /* Line breaking: every partition of the segments is scored (texts here are ≤ 8 segments, so this is tiny).
   * Per line: distance of its fitted size from the target, over-cap stretch, forced hyphens, and (opt.under) a
   * penalty for lines far below the target. Globally: opt.minLines, and opt.budget — a block taller than the
   * space it has on the first screen is heavily penalised. */
  var LINE_H = { title: 0.91, slab: 0.97, poster: 0.9 }; // line box in em: line-height + .hl-t padding + line gap
  function layout(segs, W, target, maxFs, opt) {
    opt = opt || {};
    var n = segs.length, lh = opt.lh || 0.91, bestCost = Infinity, best = null, cur = [], memo = {};
    function lineCost(i, j) {
      var key = i + ':' + j;
      if (memo[key]) return memo[key];
      var natural = W * 100 / measure(lineText(segs, i, j));
      var fs = Math.min(natural, maxFs);
      var c = Math.pow(Math.log(fs / target), 2) * 4 + 0.35;
      if (natural > maxFs) c += (1 - maxFs / natural) * 5;
      if (segs[j].brk === 'hyph') c += 1.1;
      if (opt.under) c += opt.under * Math.max(0, 0.6 - fs / target);
      return (memo[key] = { c: c, h: fs * lh });
    }
    (function walk(i, cost, height, tallest) {
      if (cost >= bestCost) return;
      if (i === n) {
        if (opt.minLines && cur.length < opt.minLines) return;
        // opt.shrink: the tallest line will give up a pocket to a sticker, so it ends up that much shorter
        if (opt.shrink) height -= tallest * (1 - opt.shrink);
        if (opt.budget > 0 && height > opt.budget) cost += Math.pow((height / opt.budget - 1) * 10, 2); // 5% over ≈ .25, 20% over = 4
        if (cost < bestCost) { bestCost = cost; best = cur.slice(); }
        return;
      }
      for (var j = i + 1; j <= n; j++) {
        if (j < n && segs[j - 1].brk === 'nb') continue;
        var lc = lineCost(i, j - 1);
        cur.push([i, j - 1]);
        walk(j, cost + lc.c, height + lc.h, Math.max(tallest, lc.h));
        cur.pop();
      }
    })(0, 0, 0, 0);
    return best || [[0, n - 1]];
  }

  function planBlock(el, key, kind, extra) {
    extra = extra || {};
    var text = D.t(key);
    if (typeof text !== 'string') return null;
    var cs = getComputedStyle(el);
    var W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (W <= 0) return null;
    var vh = Math.max(window.innerHeight || 700, 560);
    var target, maxFs, opt = { lh: LINE_H[kind], budget: extra.budget || 0, shrink: extra.pocket ? Math.max(0.5, (W - extra.pocket) / W) : 0 };
    if (kind === 'title') {
      target = Math.min(W < 560 ? W / 4.1 : W < 1000 ? W / 5.4 : W / 6.4, vh * 0.2);
      maxFs = Math.max(60, Math.min(W * 0.3, vh * 0.42));
      if (W >= 560) {
        opt.minLines = 2;   // the title never collapses into a one-line banner on short desktop viewports
        opt.under = 6;      // and no line is picked far below the target size
      }
    } else if (kind === 'poster') {
      target = W < 560 ? W / 5 : W / 7.2;
      maxFs = Math.max(56, Math.min(W * 0.17, vh * 0.3));
      opt.under = 4;
      if (W >= 560) opt.minLines = 2;
    } else {
      target = Math.min(W < 560 ? W / 5.2 : W < 1000 ? W / 8.5 : W / 12.5, vh * 0.12);
      maxFs = Math.max(40, Math.min(W * 0.2, vh * 0.2));
    }
    var segs = segments(text);
    var lines = layout(segs, W, target, maxFs, opt);
    return { el: el, W: W, maxFs: maxFs, sizes: [], lines: lines.map(function (ln) { return lineText(segs, ln[0], ln[1]); }) };
  }

  /* pocket = { lines: [indexes], w: px } — those lines are fitted to W − w, leaving room for a sticker */
  function renderBlock(p, startIndex, pocket) {
    var html = '', sizes = [];
    p.lines.forEach(function (str, li) {
      var pw = pocket && pocket.lines.indexOf(li) > -1 ? pocket.w : 0;
      var natural = (p.W - pw) * 100 / measure(str);
      var fs = Math.min(natural, p.maxFs) * 0.994;
      var inner = '<span class="hl-t">' + esc(str) + '</span>';
      if (natural > p.maxFs) {
        var stretch = natural / p.maxFs;
        if (stretch <= 1.16) inner = '<span class="hl-t" style="transform:scaleX(' + stretch.toFixed(4) + ')">' + esc(str) + '</span>';
        else inner += '<span class="hl-fill"></span>';
      }
      sizes.push(Math.round(fs));
      html += '<span class="hl-line' + (pw ? ' hl-line--pocket' : '') + '" style="font-size:' + fs.toFixed(2) + 'px;--i:' + (startIndex + li) + (pw ? ';--pocket:' + pw + 'px' : '') + '">' + inner + '</span>';
    });
    p.el.innerHTML = html;
    p.sizes = sizes;
    return sizes;
  }

  function ensureMeasure() {
    if (measureEl) return;
    var box = document.createElement('span');
    box.className = 'hl-measure-box';
    box.setAttribute('aria-hidden', 'true');
    measureEl = document.createElement('span');
    measureEl.className = 'hl-measure';
    box.appendChild(measureEl);
    $('.hero__stage').appendChild(box);
  }

  var heroPlan = null;
  function fitHeadline() {
    var title = $('.hl[data-hl="hero.title"]');
    var slab = $('.hl[data-hl="style.hero"]');
    if (!title || !slab) return;
    root.classList.add('br-fit');
    ensureMeasure();
    // the slab first: the title gets whatever height is left on the first screen
    var sp = planBlock(slab, 'style.hero', 'slab');
    if (sp) renderBlock(sp, 0);
    var budget = 0;
    if (sp && title.offsetParent) {
      var slabH = slab.offsetHeight + parseFloat(getComputedStyle(slab).marginTop || 0);
      // the slab must land above the style dock on the first screen
      budget = window.innerHeight - (title.getBoundingClientRect().top + (window.scrollY || 0)) - slabH - 88;
    }
    var tp = planBlock(title, 'hero.title', 'title', { budget: budget, pocket: desktopMq.matches ? burstPocket().w : 0 });
    if (tp) renderBlock(tp, 0);
    heroPlan = { title: tp, slab: sp };
    anchorHeroStickers();
    var n = tp ? tp.lines.length : 0;
    $$('.hl-line', slab).forEach(function (l, i) { l.style.setProperty('--i', n + i); });
    var out = $('[data-hl-sizes]');
    if (out) out.textContent = (tp ? tp.sizes.join(' / ') : '—') + ' · ' + (sp ? sp.sizes.join(' / ') : '—') + ' px';
  }

  /* Glyph ink boxes of fitted lines: the Range rect gives the advance box and the font's ascent line,
   * canvas metrics give each glyph's real ascent/descent. */
  var inkCtx = null;
  // strict: grow each box to the font's em box trimmed by 12% (what a reader perceives as the letter's cell)
  function inkBoxes(scope, strict) {
    if (!inkCtx) inkCtx = document.createElement('canvas').getContext('2d');
    var out = [], rg = document.createRange();
    var lines = scope.classList.contains('hl-line') ? [scope] : $$('.hl-line', scope);
    lines.forEach(function (line) {
      var t = $('.hl-t', line), node = t && t.firstChild;
      if (!node || !node.length) return;
      inkCtx.font = '400 ' + parseFloat(line.style.fontSize) + 'px ' + getComputedStyle(line).fontFamily;
      var asc = inkCtx.measureText('H').fontBoundingBoxAscent;
      var s = node.textContent;
      for (var i = 0; i < s.length; i++) {
        if (!/\S/.test(s[i])) continue;
        rg.setStart(node, i);
        rg.setEnd(node, i + 1);
        var g = rg.getBoundingClientRect();
        var m = inkCtx.measureText(s[i].toUpperCase());
        var base = g.top + asc, t = base - m.actualBoundingBoxAscent, b = base + m.actualBoundingBoxDescent;
        if (strict) { t = Math.min(t, g.top + g.height * 0.12); b = Math.max(b, g.bottom - g.height * 0.12); }
        out.push({ l: g.left, r: g.right, t: t, b: b });
      }
    });
    return out;
  }
  function coverage(rect, boxes) {
    var worst = 0;
    boxes.forEach(function (g) {
      var area = (g.r - g.l) * (g.b - g.t);
      if (area <= 0) return;
      var ix = Math.min(g.r, rect.r) - Math.max(g.l, rect.l), iy = Math.min(g.b, rect.b) - Math.max(g.t, rect.t);
      if (ix > 0 && iy > 0) worst = Math.max(worst, ix * iy / area);
    });
    return worst;
  }
  // layout size + axis-aligned box of the sticker after its --r rotation (transforms don't change offset*)
  function rotBox(s) {
    var w = s.offsetWidth, h = s.offsetHeight;
    var a = Math.abs(parseFloat(getComputedStyle(s).getPropertyValue('--r')) || 0) * Math.PI / 180;
    return { w: w, h: h, W: w * Math.cos(a) + h * Math.sin(a), H: w * Math.sin(a) + h * Math.cos(a) };
  }

  /* Desktop: the burst gets its own pocket at the end of the biggest title line (the line — or the pair of
   * lines — is fitted to the width minus the sticker), so it is slapped next to the type, never over it.
   * The RU·EN tag hangs under the slab's baseline at the right edge. Both are checked against every glyph. */
  var desktopMq = window.matchMedia('(min-width: 1024px)');
  function burstPocket() {
    var burst = $('.sticker--h1');
    var rb = burst ? rotBox(burst) : { w: 0, h: 0, W: 0, H: 0 };
    var gap = Math.round(Math.max(10, rb.W * 0.08));
    return { rb: rb, w: burst ? Math.ceil(rb.W + gap * 2) : 0 };
  }
  function anchorHeroStickers() {
    var box = $('.hero__stickers');
    var burst = $('.sticker--h1'), tag = $('.sticker--h2');
    if (!box || !burst || !tag) return;
    [burst, tag].forEach(function (s) { s.style.left = ''; s.style.top = ''; s.style.right = ''; s.style.bottom = ''; });
    var tp = heroPlan && heroPlan.title, slab = $('.hl--slab');
    if (!desktopMq.matches || !tp || !tp.lines.length || !slab) return;
    var br = box.getBoundingClientRect();
    var padR = parseFloat(getComputedStyle($('.hero__stage')).paddingRight) || 0;

    var bp = burstPocket(), rb = bp.rb, pw = bp.w;
    var sizes = tp.sizes.slice(), n = sizes.length;
    var lo = sizes.indexOf(Math.max.apply(null, sizes)), hi = lo, cands = [[lo]];
    while (hi - lo + 1 < n) {
      var up = lo > 0 ? sizes[lo - 1] : -1, dn = hi < n - 1 ? sizes[hi + 1] : -1;
      if (up >= dn) lo--; else hi++;
      var c = [];
      for (var k = lo; k <= hi; k++) c.push(k);
      cands.push(c);
    }
    var slabInk = inkBoxes(slab, true), best = null, shown = -1;
    for (var ci = 0; ci < cands.length; ci++) {
      var cand = cands[ci];
      renderBlock(tp, 0, { lines: cand, w: pw });
      shown = ci;
      var lines = $$('.hl-line', tp.el);
      var top = Infinity, bottom = -Infinity;
      inkBoxes(lines[cand[0]]).forEach(function (g) { top = Math.min(top, g.t); });
      inkBoxes(lines[cand[cand.length - 1]]).forEach(function (g) { bottom = Math.max(bottom, g.b); });
      var cx = br.width - padR - pw / 2;
      var cy = Math.max((top + bottom) / 2 - br.top, rb.H / 2 + 4); // never up into the meta row
      var rect = { l: br.left + cx - rb.W / 2, r: br.left + cx + rb.W / 2, t: br.top + cy - rb.H / 2, b: br.top + cy + rb.H / 2 };
      var cov = coverage(rect, inkBoxes(tp.el, true).concat(slabInk));
      if (!best || cov < best.cov - 0.001) best = { cov: cov, ci: ci, cx: cx, cy: cy };
      if (cov < 0.02) break;
    }
    if (best.ci !== shown) renderBlock(tp, 0, { lines: cands[best.ci], w: pw });
    burst.style.right = 'auto';
    burst.style.left = Math.round(best.cx - rb.w / 2) + 'px';
    burst.style.top = Math.round(best.cy - rb.h / 2) + 'px';
    var slot = $('.hero__slot');
    if (slot) {
      slot.style.left = burst.style.left;
      slot.style.top = burst.style.top;
      slot.style.width = rb.w + 'px';
      slot.style.height = rb.h + 'px';
    }

    // the tag: below the ink of the slab's last line, flush with the right edge of the type
    var sl = $$('.hl-line', slab), inkBottom = -Infinity;
    inkBoxes(sl[sl.length - 1]).forEach(function (g) { inkBottom = Math.max(inkBottom, g.b); });
    var rt = rotBox(tag);
    var tx = br.width - padR - rt.W / 2 - Math.round(rt.W * 0.06);
    var ty = inkBottom - br.top + 8 + rt.H / 2;
    tag.style.right = 'auto';
    tag.style.left = Math.round(tx - rt.w / 2) + 'px';
    tag.style.top = Math.round(ty - rt.h / 2) + 'px';
  }

  /* The Work head is a poster: its h2 is fitted like the hero, and the section number is a sticker living in
   * a pocket at the end of the last line (phones: in the caption row, which CSS keeps clear for it). */
  function fitPosters() {
    ensureMeasure();
    $$('.hl--poster').forEach(function (el) {
      var head = el.closest('.sec-head'), num = head && $('.section-num', head);
      var p = planBlock(el, el.getAttribute('data-hl'), 'poster');
      if (!p) return;
      renderBlock(p, 0);
      if (!num) return;
      num.style.left = '';
      num.style.top = '';
      if (window.innerWidth < 768 || !head.offsetParent) return;
      var rb = rotBox(num), gap = Math.round(Math.max(12, rb.W * 0.12)), pw = Math.ceil(rb.W + gap * 2);
      var li = p.lines.length - 1;
      renderBlock(p, 0, { lines: [li], w: pw });
      var top = Infinity, bottom = -Infinity;
      inkBoxes($$('.hl-line', el)[li]).forEach(function (g) { top = Math.min(top, g.t); bottom = Math.max(bottom, g.b); });
      var hr = head.getBoundingClientRect(), er = el.getBoundingClientRect();
      var cx = er.right - hr.left - pw / 2, cy = (top + bottom) / 2 - hr.top;
      num.style.left = Math.round(cx - rb.w / 2) + 'px';
      num.style.top = Math.round(cy - rb.h / 2) + 'px';
    });
  }

  function fitWordmark() {
    $$('[data-fit-line]').forEach(function (el) {
      var span = el.firstElementChild;
      if (!span) return;
      el.style.fontSize = '100px';
      span.style.transform = '';
      var cs = getComputedStyle(el);
      var W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var w = span.getBoundingClientRect().width || 1;
      var fs = Math.min(W * 100 / w * 0.994, 420);
      el.style.fontSize = fs.toFixed(2) + 'px';
      // room for descenders (the feet of «Д»): the word sits on the border, nothing is sliced off
      el.style.paddingBottom = '';
      if (!inkCtx) inkCtx = document.createElement('canvas').getContext('2d');
      inkCtx.font = '400 ' + fs + 'px ' + cs.fontFamily;
      var m = inkCtx.measureText(span.textContent.toUpperCase());
      var rg = document.createRange();
      rg.selectNodeContents(span);
      var g = rg.getBoundingClientRect(), er = el.getBoundingClientRect();
      var inkBottom = g.top + m.fontBoundingBoxAscent + m.actualBoundingBoxDescent;
      var contentBottom = er.bottom - parseFloat(getComputedStyle(el).paddingBottom);
      var need = inkBottom - contentBottom + fs * 0.035;
      if (need > fs * 0.06) el.style.paddingBottom = need.toFixed(1) + 'px';
    });
  }

  /* display headings: shrink until the longest unbreakable chunk fits its box (no mid-word breaks) */
  var FIT_WORDS = '.sec-head:not(.sec-head--poster) h2, .plan__name, .case__name, .service h3, .step h3, .contact__details dd, .form__success-title, .work__more, .footer__tagline, .faq__q';
  var wordMeasure = null;
  function fitWords(scope) {
    if (!wordMeasure) {
      var box = document.createElement('span');
      box.className = 'hl-measure-box';
      box.setAttribute('aria-hidden', 'true');
      wordMeasure = document.createElement('span');
      wordMeasure.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:pre;';
      box.appendChild(wordMeasure);
      document.body.appendChild(box);
    }
    $$(FIT_WORDS, scope).forEach(function (el) {
      el.style.fontSize = '';
      if (!el.offsetParent && el.getClientRects().length === 0) return;
      var cs = getComputedStyle(el);
      var W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (W <= 0) return;
      wordMeasure.style.font = cs.font;
      wordMeasure.style.letterSpacing = cs.letterSpacing;
      wordMeasure.style.textTransform = cs.textTransform;
      var max = 0;
      el.textContent.split(/[ \t\n]+/).forEach(function (unit) {
        unit.split(/(?<=[-‐])/).forEach(function (chunk) {
          if (!chunk) return;
          wordMeasure.textContent = chunk;
          max = Math.max(max, wordMeasure.getBoundingClientRect().width);
        });
      });
      if (max > W) el.style.fontSize = (parseFloat(cs.fontSize) * W / max * 0.97).toFixed(2) + 'px';
    });
  }

  function refitAll() {
    measureCache = {};
    fitHeadline();
    fitPosters();
    fitWordmark();
    fitWords();
    settleAllStickers();
    alignArrow();
  }

  /* =====================================================================
   * 2. Case art — every motif drawn in the brutalist kit (thick ink, acid fills, halftone)
   * ===================================================================== */
  var SLUG = { latte: 'svetoten', pulse: 'kadens', route: 'kolibri', sneaker: 'dvor01', orbit: 'aelita', ring: 'rovno' };
  function dots(id, size, dot) {
    return '<pattern id="' + id + '" width="' + size + '" height="' + size + '" patternUnits="userSpaceOnUse"><rect class="fi" x="' + (size - dot) / 2 + '" y="' + (size - dot) / 2 + '" width="' + dot + '" height="' + dot + '"/></pattern>';
  }
  var ART = {
    latte: function () {
      return '<rect class="fp" width="400" height="300"/>' +
        '<rect class="fi" x="200" width="200" height="300"/>' +
        '<path class="si nf" stroke-width="6" d="M62 20v16M62 92v16M20 64h16M88 64h16M32 34l11 11M81 83l11 11M32 94l11-11M81 45l11-11"/>' +
        '<circle class="fa si" cx="62" cy="64" r="19" stroke-width="6"/>' +
        '<circle class="fa" cx="338" cy="62" r="27"/><circle class="fi" cx="352" cy="51" r="24"/>' +
        '<g class="fp"><rect x="318" y="104" width="6" height="6"/><rect x="372" y="122" width="6" height="6"/><rect x="304" y="28" width="5" height="5"/><rect x="258" y="40" width="4" height="4"/><rect x="380" y="20" width="4" height="4"/></g>' +
        '<circle class="fi" cx="214" cy="170" r="104"/>' +
        '<circle class="fp si" cx="200" cy="156" r="104" stroke-width="6"/>' +
        '<circle class="nf si" cx="200" cy="156" r="85" stroke-width="3" stroke-dasharray="7 7"/>' +
        '<rect class="fp si" x="258" y="144" width="56" height="25" stroke-width="6"/>' +
        '<circle class="fp si" cx="200" cy="156" r="70" stroke-width="6"/>' +
        '<circle class="fi" cx="200" cy="156" r="54"/>' +
        '<g class="fp"><circle cx="187" cy="148" r="15"/><circle cx="213" cy="148" r="15"/><path d="M173 154H227L200 187Z"/></g>' +
        '<g class="fa"><circle cx="194" cy="152" r="7"/><circle cx="206" cy="152" r="7"/><path d="M187.6 155H212.4L200 170Z"/></g>' +
        '<text x="18" y="286" class="fi" font-size="14">09:00</text>' +
        '<text x="382" y="286" class="fp" font-size="14" text-anchor="end">18:00</text>';
    },
    pulse: function () {
      return '<defs>' + dots('br-pulse-d', 20, 3) + '</defs>' +
        '<rect class="fp" width="400" height="300"/>' +
        '<rect width="400" height="300" fill="url(#br-pulse-d)"/>' +
        '<rect class="fa" x="0" y="112" width="400" height="76"/>' +
        '<path class="si nf" stroke-width="3" d="M0 112H400M0 188H400"/>' +
        '<text x="386" y="104" class="fi" font-size="13" text-anchor="end">Z3 · 142–160</text>' +
        '<rect class="fi" x="16" y="16" width="130" height="62"/>' +
        '<text x="27" y="65" class="fa tx-d" font-size="42">128</text>' +
        '<text x="156" y="34" class="fi" font-size="13">BPM</text>' +
        '<polyline class="si nf pulse-line" stroke-width="9" stroke-linejoin="miter" stroke-linecap="square" points="0,150 92,150 108,132 124,150 192,150 210,34 234,268 256,110 272,150 306,150 322,134 338,150 372,150"/>' +
        '<rect class="fi" x="372" y="140" width="20" height="20"/>' +
        '<text x="16" y="284" class="fi" font-size="13">06:40 · 45′</text>';
    },
    route: function () {
      var hatch = '<pattern id="br-route-h" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="fi" width="3" height="12"/></pattern>';
      var cols = [[16, 80], [116, 80], [216, 80], [316, 68]];
      var rows = [[16, 54], [98, 48], [174, 48], [250, 36]];
      var blocks = '';
      rows.forEach(function (r, ri) {
        cols.forEach(function (c, ci) {
          var park = (ri === 1 && ci === 1) || (ri === 2 && ci === 3);
          blocks += '<rect x="' + c[0] + '" y="' + r[0] + '" width="' + c[1] + '" height="' + r[1] + '" class="si ' + (park ? 'fa' : '') + '" ' + (park ? '' : 'fill="url(#br-route-h)"') + ' stroke-width="4"/>';
        });
      });
      var pts = '30,85 206,85 206,161 306,161 306,237 374,237';
      return '<defs>' + hatch + '</defs>' +
        '<rect class="fp" width="400" height="300"/>' + blocks +
        '<polyline class="si nf" stroke-width="15" stroke-linejoin="miter" points="' + pts + '"/>' +
        '<polyline class="sa nf" stroke-width="5" stroke-dasharray="12 8" points="' + pts + '"/>' +
        '<g class="fp si" stroke-width="4"><rect x="100" y="120" width="12" height="12"/><rect x="250" y="79" width="12" height="12"/><rect x="100" y="30" width="12" height="12"/><rect x="150" y="231" width="12" height="12"/><rect x="300" y="36" width="12" height="12"/></g>' +
        '<rect class="fi" x="14" y="69" width="32" height="32"/><text x="30" y="93" class="fa tx-d" font-size="22" text-anchor="middle">A</text>' +
        '<rect class="fa si" x="358" y="221" width="32" height="32" stroke-width="4"/><text x="374" y="245" class="fi tx-d" font-size="22" text-anchor="middle">B</text>' +
        '<rect class="fi" x="214" y="119" width="84" height="26"/><text x="256" y="137" class="fa" font-size="13" text-anchor="middle">SLA 12′</text>';
    },
    sneaker: function () {
      return '<defs>' + dots('br-snk-d', 8, 3) + '</defs>' +
        '<rect class="fp" width="400" height="300"/>' +
        '<rect x="40" y="256" width="336" height="20" fill="url(#br-snk-d)"/>' +
        '<rect class="fi" x="0" y="250" width="400" height="6"/>' +
        '<path class="fi" d="M62 208 L64 118 L112 106 L134 130 L180 106 L204 74 L234 82 L244 126 L312 158 Q372 172 384 208 L392 234 L386 252 L56 252 L52 234 Z"/>' +
        '<path class="fa si" stroke-width="6" stroke-linejoin="miter" d="M50 196 L52 106 L100 94 L122 118 L168 94 L192 62 L222 70 L232 114 L300 146 Q360 160 372 196 Z"/>' +
        '<path class="fi" d="M58 110 L98 101 L116 121 L60 129 Z"/>' +
        '<path class="fi" d="M134 196 L184 120 L202 120 L152 196 Z M164 196 L214 126 L232 130 L182 196 Z M194 196 L242 134 L260 142 L212 196 Z"/>' +
        '<path class="fp si" stroke-width="6" d="M300 146 Q360 160 372 196 L320 196 Q318 168 300 146 Z"/>' +
        '<path class="si nf" stroke-width="6" d="M188 80 L210 92 M198 96 L222 108 M208 112 L232 122"/>' +
        '<rect class="fi" x="38" y="126" width="18" height="62"/>' +
        '<path class="fp si" stroke-width="6" d="M44 196 L374 196 L382 222 L40 222 Z"/>' +
        '<path class="fi" d="M40 222 L382 222 L376 242 L46 242 Z"/>' +
        '<path class="sp nf" stroke-width="4" d="M66 232h18M106 232h18M146 232h18M186 232h18M226 232h18M266 232h18M306 232h18M342 232h14"/>' +
        '<text x="18" y="40" class="fi tx-d" font-size="26">EU 43</text>' +
        '<text x="382" y="36" class="fi" font-size="13" text-anchor="end">SIDE / L · 3D</text>';
    },
    orbit: function () {
      return '<defs>' + dots('br-orb-d', 8, 3.4) + '<clipPath id="br-orb-c"><circle cx="200" cy="150" r="70"/></clipPath></defs>' +
        '<rect class="fi" width="400" height="300"/>' +
        '<g class="fp"><rect x="30" y="34" width="6" height="6"/><rect x="92" y="252" width="5" height="5"/><rect x="342" y="40" width="6" height="6"/><rect x="366" y="244" width="4" height="4"/><rect x="40" y="110" width="4" height="4"/><rect x="330" y="262" width="5" height="5"/><rect x="150" y="24" width="4" height="4"/><rect x="250" y="36" width="3" height="3"/></g>' +
        '<path class="sp nf" stroke-width="3" d="M318 96h16M326 88v16M72 88h12M78 82v12"/>' +
        '<g transform="rotate(-16 200 150)"><ellipse class="sp nf" cx="200" cy="150" rx="178" ry="56" stroke-width="4" stroke-dasharray="12 9"/></g>' +
        '<circle class="fa" cx="200" cy="150" r="70"/>' +
        '<g clip-path="url(#br-orb-c)"><rect x="120" y="70" width="170" height="170" fill="url(#br-orb-d)"/><circle class="fa" cx="180" cy="128" r="74"/><rect class="fi" x="120" y="146" width="170" height="9"/><rect class="fi" x="120" y="166" width="170" height="5"/></g>' +
        '<circle class="nf sp" cx="200" cy="150" r="70" stroke-width="6"/>' +
        '<g transform="rotate(-16 200 150)"><path class="sp nf" stroke-width="4" stroke-dasharray="12 9" d="M22 150 A178 56 0 0 0 378 150"/></g>' +
        '<g transform="translate(299 172) rotate(-26)"><path class="sa nf" stroke-width="4" d="M-20 -5h-14M-20 5h-14"/><path class="fp si" stroke-width="4" d="M-16 -11 L20 0 L-16 11 L-9 0 Z"/></g>' +
        '<text x="18" y="284" class="fp" font-size="13">T+216</text>' +
        '<text x="382" y="284" class="fa" font-size="13" text-anchor="end">LUN · MRS · LEO</text>';
    },
    ring: function () {
      var coins = '';
      for (var i = 0; i < 5; i++) coins += '<rect class="fa si" x="' + (30 + (i % 2) * 6) + '" y="' + (226 - i * 20) + '" width="74" height="20" stroke-width="4"/>';
      return '<defs>' + dots('br-ring-d', 10, 3) + '</defs>' +
        '<rect class="fp" width="400" height="300"/>' +
        '<rect x="0" y="0" width="128" height="300" fill="url(#br-ring-d)"/>' +
        '<rect class="fp" x="22" y="140" width="96" height="120"/>' + coins +
        '<rect class="fi" x="22" y="24" width="96" height="40"/><text x="70" y="52" class="fa tx-d" font-size="22" text-anchor="middle">64%</text>' +
        '<circle class="nf si" cx="252" cy="150" r="98" stroke-width="38"/>' +
        '<circle class="nf sa" cx="252" cy="150" r="98" stroke-width="24" stroke-dasharray="394 1000" transform="rotate(-90 252 150)"/>' +
        '<circle class="fp si" cx="252" cy="150" r="62" stroke-width="6"/>' +
        '<circle class="nf si" cx="252" cy="150" r="52" stroke-width="3" stroke-dasharray="5 5"/>' +
        '<text x="252" y="159" class="fi tx-d" font-size="24" text-anchor="middle">1 250</text>';
    }
  };
  function drawArt() {
    $$('.case').forEach(function (c) {
      var motif = c.getAttribute('data-motif');
      var art = $('.case__art', c);
      var slug = $('.case__slug', c);
      if (slug) slug.textContent = (SLUG[motif] || 'case') + '.' + motif;
      if (art && ART[motif] && !art.firstChild) {
        art.innerHTML = '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">' + ART[motif]() + '</svg>';
      }
    });
  }

  /* =====================================================================
   * 3. Stickers — drag with mouse/touch, arrows from the keyboard, constrained to the section
   * ===================================================================== */
  var zTop = 10;
  var zones = [];
  function place(s, x, y) {
    s._x = Math.round(x);
    s._y = Math.round(y);
    s.style.setProperty('--dx', s._x + 'px');
    s.style.setProperty('--dy', s._y + 'px');
    var slot = s.parentNode;
    if (slot && slot.classList && slot.classList.contains('sticker-slot')) slot.classList.toggle('is-peeled', !!(s._x || s._y));
    if (s.classList.contains('sticker--h1')) {
      var hs = $('.hero__slot');
      if (hs) hs.classList.toggle('is-peeled', !!(s._x || s._y));
    }
  }
  function thud(s) {
    if (reduced()) return;
    s.classList.remove('is-dropped');
    void s.offsetWidth;
    s.classList.add('is-dropped');
  }
  function bounds(s, zone) {
    var z = zone.getBoundingClientRect(), r = s.getBoundingClientRect(), pad = 6, sh = 18;
    var b = {
      minX: s._x + (z.left + pad - r.left),
      maxX: s._x + (z.right - pad - sh - r.right),
      minY: s._y + (z.top + pad - r.top),
      maxY: s._y + (z.bottom - pad - sh - r.bottom)
    };
    if (b.maxX < b.minX) b.maxX = b.minX;
    if (b.maxY < b.minY) b.maxY = b.minY;
    return b;
  }
  function settle(s, zone) {
    if (!s._x && !s._y) return;
    var b = bounds(s, zone);
    place(s, clamp(s._x, b.minX, b.maxX), clamp(s._y, b.minY, b.maxY));
  }
  function settleAllStickers() {
    zones.forEach(function (z) { z.stickers.forEach(function (s) { settle(s, z.el); }); z.refresh(); });
  }
  function initStickers() {
    $$('[data-sticker-zone]').forEach(function (zoneEl) {
      var stickers = $$('[data-sticker]', zoneEl);
      var resetBtn = $('[data-sticker-reset]', zoneEl);
      var zone = {
        el: zoneEl,
        stickers: stickers,
        refresh: function () {
          if (!resetBtn) return;
          resetBtn.disabled = !stickers.some(function (s) { return s._x || s._y; });
        }
      };
      zones.push(zone);
      stickers.forEach(function (s) {
        s._x = 0; s._y = 0;
        if (isPreview) { s.removeAttribute('tabindex'); return; }
        var drag = null;
        s.addEventListener('pointerdown', function (e) {
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          // no preventDefault: the native mousedown focuses the sticker without a keyboard focus ring
          try { s.setPointerCapture(e.pointerId); } catch (err) {}
          s.classList.add('is-dragging');
          s.style.zIndex = ++zTop;
          drag = { id: e.pointerId, px: e.clientX, py: e.clientY, x: s._x, y: s._y, b: bounds(s, zoneEl) };
        });
        s.addEventListener('pointermove', function (e) {
          if (!drag || e.pointerId !== drag.id) return;
          place(s, clamp(drag.x + e.clientX - drag.px, drag.b.minX, drag.b.maxX), clamp(drag.y + e.clientY - drag.py, drag.b.minY, drag.b.maxY));
        });
        var end = function (e) {
          if (!drag || e.pointerId !== drag.id) return;
          drag = null;
          s.classList.remove('is-dragging');
          settle(s, zoneEl);
          thud(s);
          zone.refresh();
        };
        s.addEventListener('animationend', function (e) { if (e.animationName === 'br-thud') s.classList.remove('is-dropped'); });
        s.addEventListener('dragstart', function (e) { e.preventDefault(); });
        s.addEventListener('pointerup', end);
        s.addEventListener('pointercancel', end);
        s.addEventListener('lostpointercapture', end);
        s.addEventListener('keydown', function (e) {
          var step = e.shiftKey ? 48 : 12, dx = 0, dy = 0;
          if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;
          else if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;
          else if (e.key === 'Home') { e.preventDefault(); place(s, 0, 0); zone.refresh(); return; }
          else return;
          e.preventDefault();
          var b = bounds(s, zoneEl);
          place(s, clamp(s._x + dx, b.minX, b.maxX), clamp(s._y + dy, b.minY, b.maxY));
          s.style.zIndex = ++zTop;
          zone.refresh();
        });
      });
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          var hadFocus = document.activeElement === resetBtn;
          stickers.forEach(function (s) { place(s, 0, 0); s.style.zIndex = ''; });
          zone.refresh();
          // the button disables itself: keep keyboard users in the zone instead of dropping focus to <body>
          if (hadFocus && stickers[0] && !isPreview) stickers[0].focus({ preventScroll: true });
        });
      }
      zone.refresh();
    });
  }

  /* =====================================================================
   * 4. Tickers
   * ===================================================================== */
  function initTickers() {
    $$('[data-ticker]').forEach(function (tk) {
      var btn = $('[data-ticker-toggle]', tk);
      var label = $('.ticker__label', tk);
      if (!btn || !label) return;
      btn.addEventListener('click', function () {
        var paused = tk.classList.toggle('is-paused');
        var key = paused ? 'x.brutalism.ticker.play' : 'x.brutalism.ticker.pause';
        label.setAttribute('data-i18n', key);
        label.textContent = D.t(key);
      });
    });
  }

  /* =====================================================================
   * 5. Header: mobile menu, scroll-spy, stepped progress bar
   * ===================================================================== */
  function initHeader() {
    var btn = $('.menu-btn');
    var nav = $('#site-nav');
    var label = btn && $('.menu-btn__label', btn);
    var main = $('#main');
    var footer = $('.site-footer');
    var mq = window.matchMedia('(max-width: 1239px)');
    function setMenu(open, focusBack) {
      root.classList.toggle('is-menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var key = open ? 'a11y.close' : 'a11y.menu';
      label.setAttribute('data-i18n', key);
      label.textContent = D.t(key);
      if (main) main.inert = open;
      if (footer) footer.inert = open;
      if (open) { var first = $('a', nav); if (first) first.focus(); }
      else if (focusBack) btn.focus();
    }
    if (btn && nav) {
      btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
      nav.addEventListener('click', function (e) { if (e.target.closest('a') && mq.matches) setMenu(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && root.classList.contains('is-menu-open')) setMenu(false, true);
      });
      var onMq = function () { if (!mq.matches && root.classList.contains('is-menu-open')) setMenu(false); };
      if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);
    }

    var bar = $('.progress');
    var lastSection = null;
    var nowNum = $('.header-now__num'), nowLabel = $('[data-header-now]');
    function setNow(cur) {
      lastSection = cur;
      if (!nowLabel) return;
      var idx = D.sections.indexOf(cur);
      nowNum.textContent = (idx < 10 ? '0' : '') + Math.max(idx, 0);
      var key = idx > 0 ? 'nav.items.' + (idx - 1) + '.label' : 'x.brutalism.cover';
      nowLabel.setAttribute('data-i18n', key);
      nowLabel.textContent = D.t(key);
    }
    var links = $$('.site-nav li > a[href^="#"]');
    var tick = false;
    function update() {
      tick = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      if (bar) bar.style.setProperty('--p', (Math.round(p * 32) / 32).toFixed(4));
      var cur = D.currentSection();
      if (cur !== lastSection) setNow(cur);
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + cur && cur !== 'top';
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', function () { if (!tick) { tick = true; requestAnimationFrame(update); } });
    update();
  }

  /* =====================================================================
   * 6. Reveal — stepped wipe when blocks enter the viewport
   * ===================================================================== */
  function initReveal() {
    if (isPreview || reduced() || !('IntersectionObserver' in window)) return;
    root.classList.add('br-reveal');
    var io = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--rd', (k++ * 70) + 'ms');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  /* =====================================================================
   * 7. Copy post-processing (badges, ruble sign)
   * ===================================================================== */
  function polishCopy() {
    $$('.plan__badge').forEach(function (b) { b.hidden = !b.textContent.trim(); });
    $$('.plan__price').forEach(function (p) {
      var txt = p.textContent;
      if (txt.indexOf('₽') > -1 && !$('.rub', p)) p.innerHTML = esc(txt).replace('₽', '<span class="rub">₽</span>');
    });
  }

  /* =====================================================================
   * 7b. Typography: no hanging prepositions, numbers glued to their units
   * ===================================================================== */
  var TYPO_SEL = 'h2, h3, .section-lead, .hero__lead, .faq__q, .faq__a, .case__text, .case__type, .plan__text, .service p, .step p, .contact__details dd, .work__more, .pricing__note, .sticker-help, .hero__hint span, .footer__tagline, .colophon__row span, .form__success-text, .form__success-note, .form__privacy';
  function typo() {
    var NB = String.fromCharCode(160); // no-break space
    var WJ = String.fromCharCode(0x2060); // word joiner
    // RU: one- and two-letter prepositions/conjunctions never hang at a line end; EN: only "a" / "I"
    var shortWord = D.lang === 'ru'
      ? /(^|[\s(«"])([A-Za-zА-Яа-яЁё]{1,2})[ \t]+(?=\S)/g
      : /(^|[\s("])([AaI])[ \t]+(?=\S)/g;
    $$(TYPO_SEL).forEach(function (el) {
      if (el.children.length) return;
      var t = el.textContent;
      var n = t
        .replace(shortWord, '$1$2' + NB)
        .replace(shortWord, '$1$2' + NB)               // second pass catches runs like «и в»
        .replace(/[ \t]+([—–])/g, NB + '$1')            // a dash never starts a line
        .replace(/(\d)[ \t]+(?=[^\s—–])/g, '$1' + NB)  // «48 часов», «90 000 ₽»
        .replace(/([\p{L}\d])–(?=[\p{L}\d])/gu, '$1' + WJ + '–' + WJ); // ranges stay whole: «10:00–19:00», «Пн–Пт»
      if (n !== t) el.textContent = n;
    });
    // font names in the colophon never split («IBM Plex / Mono»)
    $$('.colophon__fonts').forEach(function (el) {
      var t = el.textContent, n = t.split(' + ').map(function (f) { return f.replace(/ /g, NB); }).join(' + ');
      if (n !== t) el.textContent = n;
    });
  }

  /* =====================================================================
   * 8. Form: shake on invalid, lock fields behind the success slab
   * ===================================================================== */
  /* Contact: the drawn arrow turns into the form exactly at the submit button (the reset button once sent).
   * The offset is clamped to the room the column already has, so it can never make the column grow. */
  function alignArrow() {
    var sign = $('.contact__sign'), arrow = $('.contact__arrow'), form = $('form[data-dz-form]');
    if (!sign || !arrow || !form) return;
    if (!desktopMq.matches) { sign.style.removeProperty('--arrow-b'); return; }
    var target = form.classList.contains('is-sent') ? $('[data-form-reset]', form) : $('.btn--submit', form);
    var tr = target && target.getBoundingClientRect();
    if (!tr || !tr.height) return;
    var sr = sign.getBoundingClientRect(), ac = getComputedStyle(arrow);
    var shaft = parseFloat(ac.borderBottomWidth) || 0;
    var cur = parseFloat(ac.marginBottom) || 0;
    var req = $('.contact__req', sign);
    var minB = (req ? req.offsetHeight : 16) + 36;
    var maxB = cur + arrow.offsetHeight - (parseFloat(ac.minHeight) || 0); // what the shaft can give up
    var b = sr.bottom - (tr.top + tr.height / 2) - shaft / 2;
    sign.style.setProperty('--arrow-b', Math.round(clamp(b, minB, Math.max(minB, maxB))) + 'px');
  }

  // the form has just collapsed to the slab: make sure the stamp and the title are on screen
  function bringSlabIntoView() {
    var slab = $('[data-form-success]');
    if (!slab || slab.hidden) return;
    var r = slab.getBoundingClientRect(), top = $('.site-header').getBoundingClientRect().bottom;
    if (r.top < top + 8 || r.bottom > window.innerHeight - 90) slab.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }

  function initForm() {
    var form = $('form[data-dz-form]');
    if (!form) return;
    var setInert = function (on) {
      Array.prototype.forEach.call(form.children, function (ch) { if (!ch.hasAttribute('data-form-success')) ch.inert = on; });
    };
    form.addEventListener('diapason:forminvalid', function () {
      if (reduced()) return;
      form.classList.remove('is-shake');
      void form.offsetWidth;
      form.classList.add('is-shake');
    });
    form.addEventListener('animationend', function (e) { if (e.animationName === 'br-shake') form.classList.remove('is-shake'); });
    // Tab into the textarea: Chrome only scrolls its caret into view — show the whole field above the dock
    var viaTab = false;
    document.addEventListener('keydown', function (e) { if (e.key === 'Tab') viaTab = true; }, true);
    document.addEventListener('pointerdown', function () { viaTab = false; }, true);
    $$('textarea', form).forEach(function (ta) {
      ta.addEventListener('focus', function () {
        if (viaTab) requestAnimationFrame(function () { ta.scrollIntoView({ block: 'nearest' }); });
      });
    });
    form.addEventListener('diapason:formsent', function () {
      setInert(true);
      typo();          // core has just re-rendered the success copy with the name in it
      fitWords(form);
      bringSlabIntoView();
    });
    form.addEventListener('click', function (e) { if (e.target.closest('[data-form-reset]')) setInert(false); }, true);
  }

  /* =====================================================================
   * boot
   * ===================================================================== */
  D.ready(function () {
    buildHyph();
    polishCopy();
    typo();
    drawArt();

    var intro = !isPreview && !reduced();
    if (intro) root.classList.add('br-intro');
    fitHeadline();
    fitPosters();
    fitWordmark();

    initStickers();
    initTickers();
    initHeader();
    initReveal();
    initForm();

    var go = function () {
      if (root.classList.contains('br-go')) return;
      refitAll();
      if (intro) root.classList.add('br-go');
    };
    if (document.fonts && document.fonts.load) {
      var sample = (D.t('hero.title') || '') + (D.t('style.hero') || '') + (D.t('brand.name') || '');
      Promise.race([
        Promise.all([
          document.fonts.load('400 100px "Dela Gothic One"', sample),
          document.fonts.load('500 16px "IBM Plex Mono"', sample)
        ]),
        new Promise(function (r) { setTimeout(r, 1400); })
      ]).then(go, go);
      document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', function () { refitAll(); });
    } else {
      go();
    }

    // refit when the stage width changes (not on mobile URL-bar height jitter)
    var lastW = 0, raf = 0;
    var onResize = function () {
      var w = $('.hero__stage').clientWidth;
      if (w === lastW) return;
      lastW = w;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(refitAll);
    };
    lastW = $('.hero__stage').clientWidth;
    if ('ResizeObserver' in window) {
      new ResizeObserver(onResize).observe($('.hero__stage'));
      // errors, the success slab, a resized textarea: the contact arrow follows the submit button
      var arrowRaf = 0;
      var ro = new ResizeObserver(function () { cancelAnimationFrame(arrowRaf); arrowRaf = requestAnimationFrame(alignArrow); });
      $$('.contact__form, .contact__side').forEach(function (el) { ro.observe(el); });
    } else window.addEventListener('resize', onResize);

    D.on('langchange', function () {
      buildHyph();
      polishCopy();
      typo();
      $$('.ticker__label, .menu-btn__label').forEach(function (l) { l.textContent = D.t(l.getAttribute('data-i18n')); });
      refitAll();
      requestAnimationFrame(settleAllStickers);
    });
  });
})();
