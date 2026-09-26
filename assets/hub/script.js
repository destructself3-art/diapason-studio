/*
 * Diapason — hub behaviour.
 * A tuner: the five styles are one note (A) in five octaves, 110 → 1760 Hz.
 * - the word «ДИАПАЗОН»: every letter is set in one of the five styles and keeps re-rolling;
 *   hovering a strip "tunes" the word toward that style;
 * - five live previews (iframes in preview mode) that expand and auto-scroll on hover/focus;
 *   on phones they become a sticky deck where only the top card is live;
 * - the compare table, the CTA style picker and an opt-in tuning-fork tone.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('hub-js');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  DIAPASON.ready(function (D) {
    var preview = D.isPreview;
    var reduced = function () { return D.reducedMotion; };
    var STYLES = D.styles;
    var IDS = STYLES.map(function (s) { return s.id; });
    var byId = {};
    STYLES.forEach(function (s) { byId[s.id] = s; });
    /* identification colours on graphite (--hi): the accent itself, except link-blue, lifted to 4.8:1 on graphite.
       The raw accent stays for fills (the "Open" pill, the CTA button). */
    var HI = { brutalism: '#CCFF00', glassmorphism: '#2EC4B6', 'retro-90s': '#6B6BFF', minimalism: '#FF4D1A', cyberpunk: '#FF2E88' };
    var ON = { brutalism: '#000000', glassmorphism: '#0B3C49', 'retro-90s': '#FFFFFF', minimalism: '#141414', cyberpunk: '#08070D' };
    var HZ = { brutalism: 110, glassmorphism: 220, 'retro-90s': 440, minimalism: 880, cyberpunk: 1760 };
    var NOTE = { brutalism: 'A2', glassmorphism: 'A3', 'retro-90s': 'A4', minimalism: 'A5', cyberpunk: 'A6' };
    var NBSP = ' ';
    var ORIGIN = /^https?:$/.test(location.protocol) ? location.origin : '*';

    /* ---------------------------------------------------------------- header height → hero fills the screen */
    var topBar = document.querySelector('.top');
    function syncTop() { root.style.setProperty('--top-h', topBar.offsetHeight + 'px'); }
    syncTop();
    if ('ResizeObserver' in window) new ResizeObserver(syncTop).observe(topBar);

    /* ---------------------------------------------------------------- sound: an opt-in tuning fork */
    var Sound = (function () {
      var btn = document.querySelector('[data-sound]');
      var ctx = null;
      var on = false;
      var last = 0;
      function ensure() {
        if (!ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ctx = new AC();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
      }
      function ping(hz) {
        if (!on || !ctx || document.hidden || !hz) return;
        var now = performance.now();
        if (now - last < 110) return;
        last = now;
        var t = ctx.currentTime;
        var vol = 0.15 * Math.pow(110 / hz, 0.4);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
        g.connect(ctx.destination);
        var o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = hz;
        o.connect(g);
        /* the metallic "clang" partial of a real fork (~6.27×), gone in a blink */
        var g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.0001, t);
        g2.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.004);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        g2.connect(ctx.destination);
        var o2 = ctx.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = Math.min(hz * 6.27, 7000);
        o2.connect(g2);
        o.start(t); o2.start(t);
        o.stop(t + 2.7); o2.stop(t + 0.2);
      }
      if (btn) {
        btn.addEventListener('click', function () {
          on = !on;
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          if (on && ensure()) { last = 0; ping(440); }
        });
      }
      document.addEventListener('visibilitychange', function () {
        if (!ctx) return;
        if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
      });
      return { ping: ping };
    })();

    /* ---------------------------------------------------------------- the word */
    var Word = (function () {
      var el = document.querySelector('[data-word]');
      var TAG = { brutalism: '[01]', glassmorphism: '02', 'retro-90s': '', minimalism: '04', cyberpunk: '05//' };
      var assign = [];
      var glyphs = [];
      var hot = null;
      var timer = 0;
      var inView = true;
      var recent = [];

      /* no style may crowd the word: with 8 letters and 5 styles every style gets at most 2 tiles (2,2,2,1,1) */
      function cap() { return Math.ceil(Math.max(1, glyphs.length || assign.length) / IDS.length); }
      function initial(n) {
        var pool = IDS.slice();
        var extra = shuffle(IDS.slice());
        for (var e = 0; pool.length < n; e++) pool.push(extra[e % extra.length]);
        for (var k = 0; k < 60; k++) {
          shuffle(pool);
          var ok = true;
          for (var i = 1; i < pool.length; i++) if (pool[i] === pool[i - 1]) { ok = false; break; }
          if (ok) break;
        }
        return pool;
      }

      function render(intro) {
        var locale = D.lang === 'ru' ? 'ru-RU' : 'en-US';
        var letters = Array.from(String(D.t('hub.title') || '').toLocaleUpperCase(locale));
        if (assign.length !== letters.length) assign = initial(letters.length);
        el.style.setProperty('--n', letters.length);
        el.innerHTML = letters.map(function (ch, i) {
          var s = assign[i];
          return '<span class="glyph' + (intro ? ' is-hidden' : '') + '" data-s="' + s + '" style="--i:' + i + '">' +
            '<span class="glyph__in"><span class="glyph__l" data-l="' + esc(ch) + '">' + esc(ch) + '</span>' +
            '<span class="glyph__tag">' + TAG[s] + '</span></span></span>';
        }).join('');
        glyphs = Array.prototype.slice.call(el.children);
        markHot();
        if (intro) {
          glyphs.forEach(function (g, i) {
            setTimeout(function () {
              g.classList.remove('is-hidden');
              g.classList.add('arrive');
            }, 160 + i * 95);
          });
        }
      }

      function markHot() {
        if (hot) el.setAttribute('data-hot', hot); else el.removeAttribute('data-hot');
        glyphs.forEach(function (g) { g.classList.toggle('is-hot', !!hot && g.getAttribute('data-s') === hot); });
      }

      function setStyle(i, id) {
        var g = glyphs[i];
        if (!g || g._busy) return;
        assign[i] = id;
        var apply = function () {
          g.setAttribute('data-s', id);
          var tag = g.querySelector('.glyph__tag');
          if (tag) tag.textContent = TAG[id];
          g.classList.toggle('is-hot', !!hot && id === hot);
        };
        if (reduced() || preview) { apply(); return; }
        g._busy = true;
        g.classList.remove('arrive');
        g.classList.add('leave');
        setTimeout(function () {
          g.classList.remove('leave');
          apply();
          void g.offsetWidth;
          g.classList.add('arrive');
          g._busy = false;
        }, 150);
      }

      function remember(i) { recent.push(i); if (recent.length > 3) recent.shift(); }
      function counts() {
        var c = {};
        IDS.forEach(function (id) { c[id] = 0; });
        assign.forEach(function (s) { c[s]++; });
        return c;
      }

      function step() {
        var n = glyphs.length;
        if (!n) return;
        var c = counts();
        var i, id, cand;
        if (hot) {
          cand = [];
          assign.forEach(function (s, k) { if (s !== hot && recent.indexOf(k) < 0) cand.push(k); });
          if (c[hot] < Math.ceil(n * 0.62) && cand.length) {
            i = pick(cand);
            id = hot;
          } else {
            cand = [];
            assign.forEach(function (s, k) { if (s !== hot) cand.push(k); });
            if (!cand.length) return;
            i = pick(cand);
            id = pick(IDS.filter(function (s) { return s !== hot && s !== assign[i]; }));
          }
        } else {
          /* take a letter from the most crowded style and hand it to a missing one, or to one below the cap —
             so the word keeps rotating but always reads as five characters, never one */
          var missing = IDS.filter(function (s) { return c[s] === 0; });
          var top = Math.max.apply(null, IDS.map(function (s) { return c[s]; }));
          var lim = cap();
          if (top < 2) return;
          cand = [];
          assign.forEach(function (s, k) { if (c[s] === top && recent.indexOf(k) < 0) cand.push(k); });
          if (!cand.length) assign.forEach(function (s, k) { if (c[s] === top) cand.push(k); });
          i = pick(cand);
          var opts = missing.length ? missing : IDS.filter(function (s) {
            return s !== assign[i] && c[s] < lim && s !== assign[i - 1] && s !== assign[i + 1];
          });
          if (!opts.length) opts = IDS.filter(function (s) { return s !== assign[i] && c[s] < lim; });
          if (!opts.length) opts = IDS.filter(function (s) { return s !== assign[i]; });
          id = pick(opts);
        }
        remember(i);
        setStyle(i, id);
      }

      function canRun() { return !reduced() && !preview && !document.hidden && inView; }
      function loop() {
        clearTimeout(timer);
        if (!canRun()) return;
        var c = counts();
        var delay;
        if (hot) delay = c[hot] >= Math.ceil(glyphs.length * 0.62) ? 1100 : 460;
        else if (IDS.some(function (s) { return c[s] === 0; })) delay = 420;
        else if (IDS.some(function (s) { return c[s] > cap(); })) delay = 520; /* after tuning: settle back quickly */
        else delay = 1500 + Math.random() * 900;
        timer = setTimeout(function () { step(); loop(); }, delay);
      }

      function setHot(id) {
        if (id === hot) return;
        hot = id;
        markHot();
        clearTimeout(timer);
        if (!canRun()) return;
        if (hot) timer = setTimeout(function () { step(); loop(); }, 220);
        else loop();
      }

      /* touching a tile with the mouse re-rolls it */
      el.addEventListener('pointerover', function (e) {
        if (e.pointerType !== 'mouse' || reduced() || preview) return;
        var g = e.target.closest('.glyph');
        if (!g) return;
        var now = performance.now();
        if (g._hov && now - g._hov < 650) return;
        g._hov = now;
        var i = glyphs.indexOf(g);
        if (i < 0) return;
        var c = counts();
        var opts = IDS.filter(function (s) { return s !== assign[i] && c[s] < cap(); });
        if (!opts.length) opts = IDS.filter(function (s) { return s !== assign[i]; });
        remember(i);
        setStyle(i, hot && assign[i] !== hot ? hot : pick(opts));
      });
      el.addEventListener('animationend', function (e) {
        var g = e.target.closest && e.target.closest('.glyph');
        if (g && e.target.classList.contains('glyph__in')) g.classList.remove('arrive');
      });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          inView = entries[0].isIntersecting;
          if (inView) loop(); else clearTimeout(timer);
        }).observe(el);
      }
      document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else loop(); });
      D.on('motionchange', function () { loop(); });

      return {
        render: render,
        start: loop,
        setHot: setHot
      };
    })();

    /* ---------------------------------------------------------------- strips: five live previews */
    var stage = document.querySelector('.stage');
    var list = document.querySelector('[data-strips]');
    var readoutLive = document.querySelector('[data-readout-live]');
    var needleEl = document.querySelector('[data-needle]');
    var mqWide = window.matchMedia('(min-width: 900px)');
    var FLEX = 3.2;
    var VIRTUAL_W = 1280;
    var deck = !mqWide.matches;
    var active = -1;
    var focusByKeyboard = false;

    var items = Array.prototype.slice.call(list.querySelectorAll('.strip')).map(function (el, i) {
      var s = byId[el.getAttribute('data-id')];
      return {
        el: el,
        i: i,
        id: s.id,
        file: s.file,
        note: el.getAttribute('data-note'),
        hz: Number(el.getAttribute('data-hz')),
        iframe: el.querySelector('iframe'),
        frame: el.querySelector('.strip__frame'),
        link: el.querySelector('.strip__link'),
        requested: false,
        loaded: false,
        wantScroll: false,
        retries: 0,
        stick: 0
      };
    });

    /* a semitone ruler around each A: naturals longer, sharps shorter, the A itself is the station */
    var NATURAL = { '-5': 1, '-4': 1, '-2': 1, '0': 1, '2': 1, '3': 1, '5': 1 };
    items.forEach(function (it) {
      var html = '';
      for (var k = -6; k <= 6; k++) html += '<i class="' + (k === 0 ? 'a' : (NATURAL[k] ? 'n' : '')) + '"></i>';
      it.el.querySelector('.strip__ticks').innerHTML = html;
    });

    function srcFor(it) { return it.file + '?preview=1&lang=' + D.lang; }
    function post(it, msg) {
      if (!it.loaded) return;
      try { it.iframe.contentWindow.postMessage(msg, ORIGIN); } catch (e) {}
    }
    function request(it) {
      if (!it || it.requested) return;
      it.requested = true;
      it.iframe.addEventListener('load', function () { onLoad(it); });
      it.iframe.setAttribute('src', srcFor(it));
    }
    function onLoad(it) {
      if (!it.iframe.getAttribute('src')) return;
      if (inflight === it) { inflight = null; clearTimeout(inflightT); }
      if (deck) pump();
      var ok = true;
      try {
        var doc = it.iframe.contentDocument;
        if (doc && doc.documentElement) ok = doc.documentElement.getAttribute('data-style') === it.id;
      } catch (e) { ok = true; }
      it.loaded = ok;
      it.el.classList.toggle('is-loaded', ok);
      it.el.classList.toggle('is-missing', !ok);
      if (ok) {
        post(it, { type: 'diapason:lang', lang: D.lang });
        if (it.wantScroll) post(it, { type: 'diapason:autoscroll', on: true });
      } else if (it.retries < 60) {
        /* a page that is still being built: look again a little later, without adding history entries */
        it.retries++;
        setTimeout(function () {
          try { it.iframe.contentWindow.location.replace(srcFor(it)); } catch (e) { it.iframe.setAttribute('src', srcFor(it)); }
        }, 5000);
      }
    }

    /* on the deck the sound toggle joins the hint line instead of taking a row of its own */
    var soundBtn = document.querySelector('[data-sound]');
    var soundHome = soundBtn && soundBtn.parentNode;
    var stageBar = document.querySelector('.stage__bar');
    function placeSound() {
      if (!soundBtn || !soundHome || !stageBar) return;
      var host = deck ? stageBar : soundHome;
      if (soundBtn.parentNode !== host) host.appendChild(soundBtn);
    }

    function layout() {
      deck = !mqWide.matches;
      stage.classList.toggle('is-deck', deck);
      root.classList.toggle('hub-deck', deck);
      placeSound();
      var f = items[0].frame;
      var fw = f.clientWidth;
      var fh = f.clientHeight;
      if (!fw || !fh) return;
      var vw, s, expW;
      if (!deck) {
        var gap = parseFloat(getComputedStyle(list).columnGap) || 10;
        var W = list.clientWidth - gap * (items.length - 1);
        expW = W * FLEX / (FLEX + items.length - 1);
        vw = VIRTUAL_W;
        s = expW / VIRTUAL_W;
      } else {
        vw = Math.max(375, Math.round(fw));
        s = fw / vw;
        expW = fw;
      }
      list.style.setProperty('--s', s.toFixed(4));
      list.style.setProperty('--vw', vw + 'px');
      list.style.setProperty('--vh', Math.max(360, Math.round(fh / s)) + 'px');
      list.style.setProperty('--exp-w', Math.round(expW) + 'px');
      items.forEach(function (it) { it.stick = parseFloat(getComputedStyle(it.el).top) || 0; });
      needleEl.style.top = (list.offsetTop - 2) + 'px';
      Needle.kick(80);
      setupLoading();
      if (deck) deckScan();
    }

    /* loading: staggered on wide screens. On the deck a page load is a long task, so it must never land
       mid-swipe: the queue keeps the card on top and the next one ready, one page at a time, and only starts
       a load once scrolling has been quiet for a moment and the main thread is idle. */
    var staggered = false;
    var inflight = null;
    var inflightT = 0;
    var pumpT = 0;
    var lastScrollT = 0;
    var QUIET = 180;
    function setupLoading() {
      if (!deck) {
        if (staggered) return;
        staggered = true;
        items.forEach(function (it, i) { setTimeout(function () { request(it); }, preview ? 0 : 350 + i * 320); });
      } else {
        pump();
      }
    }
    function wanted() {
      if (!deck || stage.classList.contains('is-away')) return [];
      var a = Math.max(0, active);
      return [items[a], items[a + 1]].filter(function (it) { return it && !it.requested; });
    }
    function pump() {
      clearTimeout(pumpT);
      if (!deck || inflight) return;
      var next = wanted()[0];
      if (!next) return;
      var quiet = performance.now() - lastScrollT;
      if (quiet < QUIET) { pumpT = setTimeout(pump, QUIET - quiet + 20); return; }
      var start = function () {
        if (!deck || inflight || next.requested) { pump(); return; }
        if (performance.now() - lastScrollT < QUIET) { pumpT = setTimeout(pump, QUIET); return; }
        inflight = next;
        clearTimeout(inflightT);
        inflightT = setTimeout(function () { if (inflight === next) { inflight = null; pump(); } }, 9000);
        request(next);
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 900 });
      else pumpT = setTimeout(start, 60);
    }

    function setScroll(it, on) {
      if (on && reduced()) on = false;
      if (it.wantScroll === on) return;
      it.wantScroll = on;
      clearTimeout(it.resetT);
      post(it, { type: 'diapason:autoscroll', on: on });
      if (!on) it.resetT = setTimeout(function () { resetPreview(it); }, 4200);
    }
    function resetPreview(it) {
      if (it.wantScroll || !it.loaded) return;
      if (reduced()) { post(it, { type: 'diapason:reset' }); return; }
      it.el.classList.add('is-resetting');
      setTimeout(function () {
        post(it, { type: 'diapason:reset' });
        setTimeout(function () { it.el.classList.remove('is-resetting'); }, 140);
      }, 280);
    }

    function tune(it) {
      stage.classList.toggle('is-tuned', !!it);
      if (!it) { stage.style.setProperty('--glow', 'transparent'); return; }
      stage.style.setProperty('--glow', HI[it.id]);
      readoutLive.innerHTML = '<b style="--rc:' + HI[it.id] + '">' + esc(it.note) + '</b> · ' + it.hz + NBSP +
        esc(D.t('x.hub.hz')) + ' — ' + esc(D.t('styles.' + it.id + '.name'));
    }

    /* on the deck every visitor scrolls past all five cards, so "the last card seen" says nothing.
       Suggest the style the visitor actually lingered on (at least 1.5 s in total), if any. */
    var Dwell = (function () {
      var total = {};
      var cur = null;
      var paused = null;
      var t0 = 0;
      function stop() {
        if (cur) total[cur] = (total[cur] || 0) + (performance.now() - t0);
        cur = null;
      }
      function start(id) {
        stop();
        if (id && !document.hidden) { cur = id; t0 = performance.now(); }
      }
      function best() {
        var b = null;
        var bt = 1500;
        Object.keys(total).forEach(function (id) { if (total[id] >= bt) { b = id; bt = total[id]; } });
        return b;
      }
      /* only a card stuck on top of the deck counts — not the first card peeking below the intro */
      function track(id) {
        if (id === cur) return;
        start(id);
        var b = best();
        if (b) Cta.suggest(b);
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { paused = cur; stop(); }
        else if (paused && deck && items[active] && items[active].id === paused) { start(paused); paused = null; }
      });
      return { track: track };
    })();

    function activate(i) {
      if (i === active) return;
      active = i;
      list.classList.toggle('has-active', i >= 0);
      items.forEach(function (it, k) {
        it.el.classList.toggle('is-active', k === i);
        /* on the deck, cards buried under the one on top stop rendering, and so do cards far below it */
        it.el.classList.toggle('is-covered', deck && i > 0 && k < i);
        it.el.classList.toggle('is-far', deck && i >= 0 && k > i + 2);
        setScroll(it, k === i);
      });
      var it = items[i];
      if (deck) pump();
      else Dwell.track(null);
      if (it) {
        if (!deck) request(it);
        tune(it);
        if (!deck) { Word.setHot(it.id); Cta.suggest(it.id); }
        Sound.ping(it.hz);
        needleEl.style.color = HI[it.id];
      } else {
        tune(null);
        Word.setHot(null);
        needleEl.style.color = '';
      }
      Needle.kick(1100);
    }

    /* hover (mouse) and keyboard focus expand a strip */
    var hoverT = 0;
    var leaveT = 0;
    function indexOf(li) { for (var k = 0; k < items.length; k++) if (items[k].el === li) return k; return -1; }
    list.addEventListener('pointerover', function (e) {
      if (deck || e.pointerType === 'touch') return;
      var li = e.target.closest('.strip');
      if (!li) return;
      clearTimeout(leaveT);
      clearTimeout(hoverT);
      var i = indexOf(li);
      hoverT = setTimeout(function () { activate(i); }, active < 0 ? 30 : 80);
    });
    list.addEventListener('pointerleave', function (e) {
      if (deck || e.pointerType === 'touch') return;
      clearTimeout(hoverT);
      leaveT = setTimeout(function () {
        if (focusByKeyboard && list.contains(document.activeElement)) return;
        activate(-1);
      }, 140);
    });
    document.addEventListener('keydown', function () { focusByKeyboard = true; }, true);
    document.addEventListener('pointerdown', function () { focusByKeyboard = false; }, true);
    list.addEventListener('focusin', function (e) {
      if (deck) return;
      var li = e.target.closest('.strip');
      if (!li) return;
      clearTimeout(leaveT);
      activate(indexOf(li));
    });
    list.addEventListener('focusout', function (e) {
      if (deck) return;
      if (list.contains(e.relatedTarget)) return;
      if (list.matches(':hover')) return;
      activate(-1);
    });

    /* the deck: the card on top is the live one */
    var scanRaf = 0;
    function deckScan() {
      scanRaf = 0;
      if (!deck) return;
      var lr = list.getBoundingClientRect();
      var vh = window.innerHeight;
      if (lr.bottom < 120 || lr.top > vh) { activate(-1); Dwell.track(null); return; }
      var idx = -1;
      items.forEach(function (it, k) {
        if (it.el.getBoundingClientRect().top <= it.stick + 6) idx = k;
      });
      Dwell.track(idx >= 0 ? items[idx].id : null);
      if (idx < 0 && items[0].el.getBoundingClientRect().top < vh * 0.58) idx = 0;
      activate(idx);
    }
    window.addEventListener('scroll', function () {
      if (!deck) return;
      lastScrollT = performance.now();
      if (scanRaf) return;
      scanRaf = requestAnimationFrame(deckScan);
    }, { passive: true });

    /* Enter on a focused strip: start the circular reveal from the strip itself, not from the bottom edge
       (a keyboard click carries no pointer coordinates) */
    items.forEach(function (it) {
      it.link.addEventListener('click', function (e) {
        if (e.detail !== 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        var r = it.el.getBoundingClientRect();
        var x = r.left + r.width / 2;
        var y = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight);
        D.go(it.id, { origin: { x: x, y: y } });
      });
    });

    /* ---------------------------------------------------------------- the needle: a spring that follows the station */
    var Needle = (function () {
      var x = null;
      var v = 0;
      var raf = 0;
      var until = 0;
      function target() {
        var sr = stage.getBoundingClientRect();
        if (active >= 0) {
          var r = items[active].el.getBoundingClientRect();
          return r.left - sr.left + r.width / 2;
        }
        var lr = list.getBoundingClientRect();
        return lr.left - sr.left + lr.width / 2;
      }
      function frame(now) {
        raf = 0;
        if (deck) return;
        var t = target();
        if (x === null || reduced()) { x = t; v = 0; }
        else {
          v = (v + (t - x) * 0.09) * 0.72;
          x += v;
        }
        needleEl.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        stage.style.setProperty('--gx', (x / Math.max(1, stage.clientWidth) * 100).toFixed(2) + '%');
        if (now < until || Math.abs(v) > 0.02 || Math.abs(t - x) > 0.25) raf = requestAnimationFrame(frame);
      }
      function kick(ms) {
        until = Math.max(until, performance.now() + (ms || 600));
        if (!raf) raf = requestAnimationFrame(frame);
      }
      function sweep() {
        /* first paint: the needle starts at the low end and swings to A4 — the tuning fork's 440 */
        if (reduced() || preview || deck) { kick(60); return; }
        x = 0;
        v = 0;
        kick(1600);
      }
      return { kick: kick, sweep: sweep, ready: function () { needleEl.classList.add('is-ready'); } };
    })();

    /* ---------------------------------------------------------------- compare: five design systems */
    var sysHost = document.querySelector('[data-systems]');
    (function buildSystems() {
      var CORNER = {
        brutalism: '<path d="M3 24V3h21" stroke="currentColor" stroke-width="3.5"/>',
        glassmorphism: '<path d="M3 24V15A12 12 0 0 1 15 3h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
        'retro-90s': '<path d="M3 24V3h21" stroke="#FFFFFF" stroke-width="2"/><path d="M6.5 24V6.5H24" stroke="#808080" stroke-width="2"/>',
        minimalism: '<path d="M3 24V3h21" stroke="currentColor" stroke-width="1"/><circle cx="24" cy="3" r="2" fill="#FF4D1A" stroke="none"/>',
        cyberpunk: '<path d="M3 24V11l8-8h13" stroke="#00F0FF" stroke-width="1.4"/>'
      };
      var rows = ['fonts', 'palette', 'radius', 'motion', 'signature'];
      var html = '<div class="sys__labels" aria-hidden="true"><span class="sys__lab"></span>' +
        '<span class="sys__lab" data-i18n="x.hub.specimenLabel"></span>' +
        rows.map(function (r) { return '<span class="sys__lab" data-i18n="hub.compare.' + r + '"></span>'; }).join('') + '</div>';
      STYLES.forEach(function (s) {
        var k = 'styles.' + s.id;
        var pal = D.t(k + '.palette') || [];
        html += '<article class="sys__col" data-s="' + s.id + '" style="--accent:' + HI[s.id] + '">' +
          '<h3 class="sys__head"><a class="sys__link" href="' + esc(D.urlFor(s.id) || s.file) + '" data-dz-go="' + s.id + '">' +
          '<span class="sys__meta"><span class="sys__num">' + s.num + '</span>' +
          '<span class="sys__hz" aria-hidden="true"><b>' + NOTE[s.id] + '</b> ' + HZ[s.id] + NBSP + '<span data-i18n="x.hub.hz"></span></span></span>' +
          '<span class="sys__name" data-i18n="' + k + '.name"></span>' +
          '<svg class="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5"/></svg></a></h3>' +
          '<div class="spec spec--' + s.id + '" aria-hidden="true"><span class="spec__txt" data-i18n="x.hub.specimen"></span></div>' +
          '<dl class="sys__dl">' +
          '<div class="sys__row"><dt data-i18n="hub.compare.fonts"></dt><dd><span class="dz-sr-only" data-i18n="' + k + '.fonts"></span>' +
          '<span class="fontset" aria-hidden="true" data-fontset="' + k + '.fonts"></span></dd></div>' +
          '<div class="sys__row"><dt data-i18n="hub.compare.palette"></dt><dd><ul class="pal">' +
          pal.map(function (p, i) {
            return '<li style="--c:' + esc(p.hex) + '"><span class="pal__sw" aria-hidden="true"></span>' +
              '<span class="pal__name" data-i18n="' + k + '.palette.' + i + '.name"></span><code>' + esc(p.hex) + '</code></li>';
          }).join('') + '</ul></dd></div>' +
          '<div class="sys__row"><dt data-i18n="hub.compare.radius"></dt><dd><svg class="corner" viewBox="0 0 26 26" aria-hidden="true" style="color:var(--text-2)">' + CORNER[s.id] + '</svg><span data-i18n="' + k + '.radius"></span></dd></div>' +
          '<div class="sys__row"><dt data-i18n="hub.compare.motion"></dt><dd><span class="mo mo--' + s.id + '" aria-hidden="true"><i></i></span><span data-i18n="' + k + '.motion"></span></dd></div>' +
          '<div class="sys__row"><dt data-i18n="hub.compare.signature"></dt><dd><span data-i18n="' + k + '.signature"></span></dd></div>' +
          '</dl></article>';
      });
      sysHost.innerHTML = html;
      D.apply(sysHost);
      renderFontsets();
    })();

    /* each typeface name is set in the typeface itself */
    function renderFontsets() {
      var FACE = {
        'dela gothic one': 'f-dela', 'ibm plex mono': 'f-plex', geologica: 'f-geo', 'times new roman': 'f-times',
        'comic sans ms': 'f-comic', 'press start 2p': 'f-press', manrope: 'f-manrope', tektur: 'f-tektur', 'jetbrains mono': 'f-jb'
      };
      Array.prototype.forEach.call(document.querySelectorAll('[data-fontset]'), function (el) {
        var parts = String(D.t(el.getAttribute('data-fontset')) || '').split(/\s*\+\s*/);
        el.innerHTML = parts.map(function (name) {
          return '<i class="' + (FACE[name.toLowerCase()] || '') + '">' + esc(name) + '</i>';
        }).join('<b>+</b>');
      });
    }

    function syncSysScroller() {
      /* on the deck layout the table becomes a swipeable row — make it reachable from the keyboard */
      if (deck) {
        sysHost.setAttribute('tabindex', '0');
        sysHost.setAttribute('role', 'region');
        sysHost.setAttribute('data-i18n-attr', 'aria-label:hub.compare.title');
        sysHost.setAttribute('aria-label', D.t('hub.compare.title'));
      } else {
        sysHost.removeAttribute('tabindex');
        sysHost.removeAttribute('role');
        sysHost.removeAttribute('data-i18n-attr');
        sysHost.removeAttribute('aria-label');
      }
    }

    /* previews stop rendering while the whole stage is out of view (desktop strips and the phone deck alike) */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var away = !entries[0].isIntersecting;
        stage.classList.toggle('is-away', away);
        if (away && !deck) activate(-1);
        if (!away && deck) pump();
      }, { rootMargin: '240px 0px 240px 0px' }).observe(stage);
    }

    /* pause the small looping demos while they are off-screen */
    function pauseOffscreen(el) {
      if (!el || !('IntersectionObserver' in window)) return;
      new IntersectionObserver(function (entries) {
        el.classList.toggle('is-paused', !entries[0].isIntersecting);
      }).observe(el);
    }
    pauseOffscreen(sysHost);
    pauseOffscreen(document.querySelector('.how'));
    pauseOffscreen(document.getElementById('start'));

    /* ---------------------------------------------------------------- CTA: pick the character, land in its brief */
    var Cta = (function () {
      var sec = document.getElementById('start');
      var btn = sec.querySelector('[data-cta]');
      var label = sec.querySelector('.fork-label');
      var radios = Array.prototype.slice.call(sec.querySelectorAll('input[name="pick"]'));
      var KEY = 'diapason.hub.pick';
      var picked = 'brutalism';
      var userPicked = false;
      function set(id) {
        if (!byId[id]) return;
        picked = id;
        sec.style.setProperty('--accent', byId[id].accent);
        sec.style.setProperty('--hi', HI[id]);
        sec.style.setProperty('--on', ON[id]);
        /* the fork rings at the picked style's note: lower octaves swing slower */
        sec.style.setProperty('--wave-dur', (2.4 * Math.pow(440 / HZ[id], 0.25)).toFixed(2) + 's');
        if (label) label.textContent = NOTE[id] + ' · ' + HZ[id];
        btn.setAttribute('href', D.urlFor(id, 'contact') || (byId[id].file + '#contact'));
        radios.forEach(function (r) { r.checked = r.value === id; });
      }
      function remember(id) { try { sessionStorage.setItem(KEY, id); } catch (e) {} }
      function saved() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
      /* the visible choice and the destination must never disagree (Back, bfcache, restored form state) */
      function sync() {
        var c = radios.filter(function (r) { return r.checked; })[0];
        if (c && c.value !== picked) { userPicked = true; set(c.value); remember(c.value); }
        else if (!c) set(picked);
      }
      radios.forEach(function (r) {
        r.addEventListener('change', function () {
          if (!r.checked) return;
          userPicked = true;
          set(r.value);
          remember(r.value);
          Sound.ping(HZ[r.value]);
        });
      });
      window.addEventListener('pageshow', sync);
      window.addEventListener('load', sync);
      btn.addEventListener('click', function (e) {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        var x = e.clientX;
        var y = e.clientY;
        if (!x && !y) {
          var r = btn.getBoundingClientRect();
          x = r.left + r.width / 2;
          y = r.top + r.height / 2;
        }
        D.go(picked, { section: 'contact', origin: { x: x, y: y } });
      });
      var prev = saved();
      if (prev && byId[prev]) { userPicked = true; set(prev); } else set(picked);
      return {
        suggest: function (id) { if (!userPicked) set(id); },
        refresh: function () { set(picked); }
      };
    })();

    /* in-page "to the top" links glide (keyboard focus scrolling stays instant) */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="#top"]');
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      var brand = document.querySelector('.top .brand');
      if (brand && a !== brand) brand.focus({ preventScroll: true });
    });

    /* ---------------------------------------------------------------- reveals */
    var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
    if (reduced() || preview || !('IntersectionObserver' in window)) {
      rvs.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var rvIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          rvIO.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      rvs.forEach(function (el) { rvIO.observe(el); });
    }

    /* ---------------------------------------------------------------- language, visibility, resize */
    D.on('langchange', function (d) {
      Word.render(false);
      renderFontsets();
      items.forEach(function (it) { post(it, { type: 'diapason:lang', lang: d.lang }); });
      tune(items[active] || null);
      Cta.refresh();
      syncSysScroller();
    });
    document.addEventListener('visibilitychange', function () {
      items.forEach(function (it) {
        if (!it.wantScroll) return;
        post(it, { type: 'diapason:autoscroll', on: !document.hidden });
      });
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) activate(-1);
    });

    var resizeRaf = 0;
    function onResize() {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(function () {
        var wasDeck = deck;
        layout();
        if (wasDeck !== deck) { activate(-1); syncSysScroller(); if (deck) deckScan(); }
      });
    }
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(list);
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

    /* ---------------------------------------------------------------- first paint */
    var intro = !reduced() && !preview;
    Word.render(intro);
    layout();
    syncSysScroller();
    if (intro && !deck) {
      /* the needle appears with the strips and swings from the low end to A4 */
      setTimeout(function () { Needle.ready(); Needle.sweep(); }, 780);
    } else {
      Needle.ready();
      Needle.sweep();
    }
    Word.start();
    if (intro) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.classList.add('hub-intro-run');
          root.classList.remove('hub-intro');
          setTimeout(function () { root.classList.remove('hub-intro-run'); }, 2000);
        });
      });
    } else {
      root.classList.remove('hub-intro');
    }
  });
})();
