/*
 * Diapason core — shared by the hub and all five style pages.
 * i18n (RU/EN), list templates, the style dock, cross-style navigation that keeps your section,
 * the demo contact form, and the preview mode used by the hub's live thumbnails.
 *
 * Load order at the END of <body>, as plain (non-defer) scripts:
 *   assets/core/content.js → assets/<style>/copy.js (optional) → assets/core/core.js → assets/<style>/script.js
 * core.js initialises synchronously, so the first paint already has the copy in place.
 */
(function () {
  'use strict';

  var C = window.DIAPASON_CONTENT;
  if (!C) { console.error('[diapason] content.js must load before core.js'); return; }

  var root = document.documentElement;
  var LANG_KEY = 'diapason.lang';
  var VT_KEY = 'diapason.vt';
  var SECTIONS = ['top', 'services', 'work', 'process', 'pricing', 'faq', 'contact'];
  var params = new URLSearchParams(location.search);
  var styleId = root.getAttribute('data-style') || 'hub';
  var isHub = styleId === 'hub';
  var isPreview = params.get('preview') === '1';
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var extra = { ru: {}, en: {} };
  var readyQueue = [];
  var isReady = false;

  /* ---------- storage (never throws) ---------- */
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }
  function session(key, value) {
    try {
      if (value === undefined) return sessionStorage.getItem(key);
      if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ---------- language ---------- */
  function detectLang() {
    var p = params.get('lang');
    if (p === 'ru' || p === 'en') return p;
    var s = store(LANG_KEY);
    if (s === 'ru' || s === 'en') return s;
    return /^(ru|uk|be|kk)\b/i.test(navigator.language || '') ? 'ru' : 'en';
  }
  var lang = detectLang();

  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function deepMerge(target, src) {
    Object.keys(src || {}).forEach(function (k) {
      var v = src[k];
      if (isObj(v)) { if (!isObj(target[k])) target[k] = {}; deepMerge(target[k], v); }
      else target[k] = v;
    });
    return target;
  }
  (window.DIAPASON_EXTRA || []).forEach(function (d) {
    if (d.ru) deepMerge(extra.ru, d.ru);
    if (d.en) deepMerge(extra.en, d.en);
  });

  function resolve(obj, path) {
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (obj == null) return undefined;
      obj = obj[parts[i]];
    }
    return obj;
  }
  function normalizeKey(key) {
    // "style.hero" → "styles.<current style>.hero"
    if (key.indexOf('style.') === 0) return 'styles.' + styleId + key.slice(5);
    return key;
  }
  function t(key, l) {
    l = l || lang;
    var k = normalizeKey(String(key));
    var v = resolve(extra[l], k);
    if (v === undefined) v = resolve(C[l], k);
    if (v === undefined && l !== 'ru') { v = resolve(extra.ru, k); if (v === undefined) v = resolve(C.ru, k); }
    if (v === undefined) console.warn('[diapason] missing copy:', k);
    return v;
  }
  function fmt(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, n) {
      return vars && Object.prototype.hasOwnProperty.call(vars, n) ? vars[n] : m;
    });
  }
  function readVars(el) {
    var raw = el.getAttribute('data-i18n-vars');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  /* ---------- list templates ----------
   * <template data-i18n-list="services.items"> … data-i18n="@title" … {nn} … {@motif} … </template>
   * "@"      → the current item (for arrays of strings)
   * "@field" → field of the current item (becomes an absolute key, so language switches keep working)
   * {i} {n} {nn} → index, 1-based number, zero-padded number; {@field} → raw field value (hex, href, motif…)
   * Nested templates are allowed: data-i18n-list="@features".
   */
  var KEY_ATTRS = ['data-i18n', 'data-i18n-html', 'data-i18n-list'];
  function rewriteKey(v, base) {
    if (v === '@') return base;
    if (v.charAt(0) === '@') return base + '.' + v.slice(1);
    return v;
  }
  function fillPlaceholders(str, i, item) {
    return str
      .replace(/\{i\}/g, String(i))
      .replace(/\{n\}/g, String(i + 1))
      .replace(/\{nn\}/g, (i + 1 < 10 ? '0' : '') + (i + 1))
      .replace(/\{@(\w+)\}/g, function (m, f) {
        return isObj(item) && item[f] != null ? String(item[f]) : '';
      });
  }
  function rewriteNode(el, base, i, item) {
    Array.prototype.slice.call(el.attributes).forEach(function (a) {
      var v = a.value;
      if (KEY_ATTRS.indexOf(a.name) > -1) v = rewriteKey(v, base);
      else if (a.name === 'data-i18n-attr') {
        v = v.split(';').map(function (pair) {
          var ix = pair.indexOf(':');
          if (ix < 0) return pair;
          return pair.slice(0, ix) + ':' + rewriteKey(pair.slice(ix + 1).trim(), base);
        }).join(';');
      }
      if (v.indexOf('{') > -1) v = fillPlaceholders(v, i, item);
      if (v !== a.value) el.setAttribute(a.name, v);
    });
  }
  function expandTemplate(tpl) {
    var key = tpl.getAttribute('data-i18n-list');
    var list = t(key);
    var frag = document.createDocumentFragment();
    if (Array.isArray(list)) {
      list.forEach(function (item, i) {
        var clone = tpl.content.cloneNode(true);
        var base = key + '.' + i;
        var walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) {
          if (node.nodeType === 3) {
            if (node.nodeValue.indexOf('{') > -1) node.nodeValue = fillPlaceholders(node.nodeValue, i, item);
          } else {
            rewriteNode(node, base, i, item);
          }
        }
        Array.prototype.forEach.call(clone.children, function (ch) { ch.setAttribute('data-index', i); });
        frag.appendChild(clone);
      });
    }
    tpl.replaceWith(frag);
  }
  function expandLists(scope) {
    var tpl, guard = 0;
    while ((tpl = (scope || document).querySelector('template[data-i18n-list]')) && guard++ < 500) expandTemplate(tpl);
  }

  /* ---------- apply copy ---------- */
  function apply(scope) {
    scope = scope || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v != null && typeof v !== 'object') el.textContent = fmt(v, readVars(el));
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-html'));
      if (v != null && typeof v !== 'object') el.innerHTML = fmt(v, readVars(el));
    });
    scope.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var ix = pair.indexOf(':');
        if (ix < 0) return;
        var name = pair.slice(0, ix).trim();
        var v = t(pair.slice(ix + 1).trim());
        if (name && v != null && typeof v !== 'object') el.setAttribute(name, fmt(v, readVars(el)));
      });
    });
    root.setAttribute('lang', lang);
    root.setAttribute('data-lang', lang);
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      var on = b.getAttribute('data-set-lang') === lang;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-active', on);
    });
  }

  function emit(name, detail, target) {
    (target || document).dispatchEvent(new CustomEvent(name, { detail: detail, bubbles: true }));
  }

  function setLang(next) {
    if (next !== 'ru' && next !== 'en') return;
    if (next === lang) return;
    lang = next;
    store(LANG_KEY, lang);
    if (params.has('lang')) {
      params.set('lang', lang);
      try { history.replaceState(history.state, '', location.pathname + '?' + params.toString() + location.hash); } catch (e) {}
    }
    apply();
    updateDockLinks();
    emit('diapason:langchange', { lang: lang });
  }

  /* ---------- sections & navigation ---------- */
  function currentSection() {
    var line = window.innerHeight * 0.35;
    var found = 'top';
    for (var i = 0; i < SECTIONS.length; i++) {
      var el = document.getElementById(SECTIONS[i]);
      if (el && el.getBoundingClientRect().top <= line) found = SECTIONS[i];
    }
    return found;
  }
  function styleById(id) {
    for (var i = 0; i < C.styles.length; i++) if (C.styles[i].id === id) return C.styles[i];
    return null;
  }
  function urlFor(target, section) {
    if (target === 'hub') return 'index.html?lang=' + lang;
    var s = styleById(target);
    if (!s) return null;
    var sec = section === undefined ? (isHub ? '' : currentSection()) : section;
    return s.file + '?lang=' + lang + (sec && sec !== 'top' ? '#' + sec : '');
  }
  function rememberOrigin(x, y) {
    session(VT_KEY, JSON.stringify({ x: Math.round(x), y: Math.round(y) }));
  }
  function go(target, opts) {
    opts = opts || {};
    if (target === styleId) return;
    var url = urlFor(target, opts.section);
    if (!url) return;
    if (opts.origin) rememberOrigin(opts.origin.x, opts.origin.y);
    location.href = url;
  }

  /* ---------- dock ---------- */
  var dock = null;
  function buildDock() {
    if (isHub || isPreview) return;
    dock = document.createElement('nav');
    dock.className = 'dz-dock';
    dock.setAttribute('data-i18n-attr', 'aria-label:a11y.dock');
    var html = '<a class="dz-dock__hub" data-dz-go="hub" href="index.html">' +
      '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" fill="currentColor"/></svg>' +
      '<span class="dz-dock__hub-label" data-i18n="dock.hub"></span></a><ol class="dz-dock__list">';
    C.styles.forEach(function (s) {
      var current = s.id === styleId;
      html += '<li><a class="dz-dock__item' + (current ? ' is-current' : '') + '" data-dz-go="' + s.id + '" href="' + s.file + '"' +
        (current ? ' aria-current="page"' : '') + ' style="--dz-accent:' + s.accent + '">' +
        '<span class="dz-dock__num">' + s.num + '</span>' +
        '<span class="dz-dock__name" data-i18n="styles.' + s.id + '.short"></span></a></li>';
    });
    html += '</ol><span class="dz-dock__keys" aria-hidden="true" data-i18n="dock.keys"></span>';
    dock.innerHTML = html;
    document.body.appendChild(dock);
    root.classList.add('dz-has-dock');
  }
  function updateDockLinks() {
    document.querySelectorAll('[data-dz-go]').forEach(function (a) {
      var url = urlFor(a.getAttribute('data-dz-go'), a.getAttribute('data-dz-section') || undefined);
      if (url && a.tagName === 'A') a.setAttribute('href', url);
    });
  }

  /* any [data-dz-go] link (dock, hub strips, footers) remembers the click point for the reveal */
  document.addEventListener('click', function (e) {
    var langBtn = e.target.closest('[data-set-lang]');
    if (langBtn) { e.preventDefault(); setLang(langBtn.getAttribute('data-set-lang')); return; }
    var toggle = e.target.closest('[data-lang-toggle]');
    if (toggle) { e.preventDefault(); setLang(lang === 'ru' ? 'en' : 'ru'); return; }
    var link = e.target.closest('[data-dz-go]');
    if (link && link.tagName === 'A' && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      if (link.getAttribute('data-dz-go') === styleId) { e.preventDefault(); return; }
      link.setAttribute('href', urlFor(link.getAttribute('data-dz-go'), link.getAttribute('data-dz-section') || undefined));
      if (e.detail === 0 || (!e.clientX && !e.clientY)) {
        // keyboard activation: reveal from the link itself
        var r = link.getBoundingClientRect();
        rememberOrigin(r.left + r.width / 2, r.top + r.height / 2);
      } else {
        rememberOrigin(e.clientX, e.clientY);
      }
    }
  });

  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }
  document.addEventListener('keydown', function (e) {
    if (isPreview || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
    var n = e.key;
    var target = null;
    if (n === '0') target = 'hub';
    else if (/^[1-5]$/.test(n)) target = C.styles[Number(n) - 1].id;
    if (!target || target === styleId) return;
    var anchor = (dock && dock.querySelector('[data-dz-go="' + target + '"]')) || document.querySelector('[data-dz-go="' + target + '"]');
    var r = anchor ? anchor.getBoundingClientRect() : null;
    go(target, { origin: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 } });
  });

  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (scrollTick || !dock) return;
    scrollTick = true;
    requestAnimationFrame(function () { scrollTick = false; updateDockLinks(); });
  }, { passive: true });

  /* ---------- demo contact form ----------
   * <form data-dz-form novalidate> with inputs name="name" (required), name="contact" (required),
   * [data-error-for="name"], [data-error-for="contact"], [data-form-success] (hidden) and [data-form-reset].
   */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var HANDLE = /^@[A-Za-z0-9_]{4,32}$/;
  var PHONE = /^\+?[\d\s()-]{10,}$/;
  function validField(name, value) {
    value = (value || '').trim();
    if (name === 'name') return value.length >= 2;
    if (name === 'contact') return EMAIL.test(value) || HANDLE.test(value) || PHONE.test(value);
    return true;
  }
  function showError(form, name, show) {
    var input = form.elements[name];
    var box = form.querySelector('[data-error-for="' + name + '"]');
    if (input) input.setAttribute('aria-invalid', show ? 'true' : 'false');
    if (box) {
      box.setAttribute('data-i18n', 'contact.form.errors.' + name);
      box.textContent = show ? t('contact.form.errors.' + name) : '';
      box.hidden = !show;
    }
  }
  function bindForm(form) {
    if (form.__dz) return;
    form.__dz = true;
    form.setAttribute('novalidate', '');
    ['name', 'contact'].forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener('blur', function () { if (input.value) showError(form, name, !validField(name, input.value)); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') showError(form, name, !validField(name, input.value)); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.classList.contains('is-sending')) return;
      var bad = ['name', 'contact'].filter(function (n) { return form.elements[n] && !validField(n, form.elements[n].value); });
      ['name', 'contact'].forEach(function (n) { showError(form, n, bad.indexOf(n) > -1); });
      if (bad.length) {
        form.elements[bad[0]].focus();
        emit('diapason:forminvalid', { fields: bad }, form);
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = data[k] ? [].concat(data[k], v) : v; });
      form.classList.add('is-sending');
      form.setAttribute('aria-busy', 'true');
      var submit = form.querySelector('[type="submit"]');
      var submitLabel = (submit && submit.querySelector('[data-i18n]')) || submit;
      var setSubmitLabel = function (key) {
        if (!submitLabel) return;
        submitLabel.setAttribute('data-i18n', key);
        submitLabel.textContent = t(key);
      };
      setSubmitLabel('contact.form.sending');
      emit('diapason:formsending', { data: data }, form);
      setTimeout(function () {
        form.classList.remove('is-sending');
        form.classList.add('is-sent');
        form.removeAttribute('aria-busy');
        setSubmitLabel('contact.form.submit');
        var success = form.querySelector('[data-form-success]') || document.querySelector('[data-form-success]');
        if (success) {
          success.querySelectorAll('[data-i18n-vars]').forEach(function (el) {
            el.setAttribute('data-i18n-vars', JSON.stringify({ name: String(data.name || '').trim() }));
          });
          apply(success);
          success.hidden = false;
          if (!success.hasAttribute('tabindex')) success.setAttribute('tabindex', '-1');
          success.focus({ preventScroll: true });
        }
        emit('diapason:formsent', { data: data }, form);
      }, root.classList.contains('dz-reduced-motion') ? 200 : 900);
    });
    form.addEventListener('click', function (e) {
      if (!e.target.closest('[data-form-reset]')) return;
      e.preventDefault();
      form.reset();
      form.classList.remove('is-sent');
      ['name', 'contact'].forEach(function (n) { showError(form, n, false); });
      var success = form.querySelector('[data-form-success]') || document.querySelector('[data-form-success]');
      if (success) success.hidden = true;
      if (form.elements.name) form.elements.name.focus();
      emit('diapason:formreset', {}, form);
    });
  }

  /* ---------- preview mode (hub thumbnails) ---------- */
  var auto = { on: false, raf: 0, last: 0, pauseUntil: 0 };
  function autoscrollStep(now) {
    if (!auto.on) return;
    var dt = Math.min(64, now - (auto.last || now));
    auto.last = now;
    if (now > auto.pauseUntil) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY + dt * 0.12;
      if (y >= max - 1) { auto.pauseUntil = now + 1200; y = max; setTimeout(function () { window.scrollTo({ top: 0, behavior: 'instant' }); }, 1100); }
      window.scrollTo({ top: y, behavior: 'instant' });
    }
    auto.raf = requestAnimationFrame(autoscrollStep);
  }
  function setPreviewActive(on) {
    root.classList.toggle('dz-preview-active', on);
    emit('diapason:previewactive', { active: on });
    if (on && !auto.on) { auto.on = true; auto.last = 0; auto.raf = requestAnimationFrame(autoscrollStep); }
    if (!on) { auto.on = false; cancelAnimationFrame(auto.raf); }
  }
  if (isPreview) {
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.type === 'diapason:autoscroll') setPreviewActive(!!d.on);
      if (d.type === 'diapason:lang') setLang(d.lang);
      if (d.type === 'diapason:reset') window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  /* ---------- reduced motion ---------- */
  function syncMotion() { root.classList.toggle('dz-reduced-motion', motionQuery.matches); }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', function () { syncMotion(); emit('diapason:motionchange', { reduced: motionQuery.matches }); });

  /* ---------- public API ---------- */
  window.DIAPASON = {
    content: C,
    styles: C.styles,
    sections: SECTIONS.slice(),
    styleId: styleId,
    isHub: isHub,
    isPreview: isPreview,
    get lang() { return lang; },
    get reducedMotion() { return motionQuery.matches; },
    t: t,
    fmt: fmt,
    apply: apply,
    expand: expandLists,
    setLang: setLang,
    extend: function (dict) {
      if (dict.ru) deepMerge(extra.ru, dict.ru);
      if (dict.en) deepMerge(extra.en, dict.en);
      if (isReady) apply();
    },
    go: go,
    urlFor: urlFor,
    currentSection: currentSection,
    bindForm: bindForm,
    ready: function (fn) { if (isReady) fn(window.DIAPASON); else readyQueue.push(fn); },
    on: function (name, fn) { document.addEventListener('diapason:' + name, function (e) { fn(e.detail, e); }); }
  };

  /* ---------- init (synchronous) ---------- */
  syncMotion();
  if (isPreview) root.classList.add('dz-preview');
  root.classList.add(isHub ? 'dz-hub' : 'dz-style');
  store(LANG_KEY, lang);
  expandLists();
  buildDock();
  apply();
  updateDockLinks();
  document.querySelectorAll('form[data-dz-form]').forEach(bindForm);
  isReady = true;
  root.classList.add('dz-ready');
  readyQueue.splice(0).forEach(function (fn) { try { fn(window.DIAPASON); } catch (err) { console.error(err); } });
  emit('diapason:ready', { lang: lang, style: styleId });

  // Re-align to the requested section once webfonts settle (layout can shift after they load).
  if (location.hash && SECTIONS.indexOf(location.hash.slice(1)) > -1 && !isPreview) {
    var target = document.getElementById(location.hash.slice(1));
    var userScrolled = false;
    var mark = function () { userScrolled = true; };
    window.addEventListener('wheel', mark, { passive: true, once: true });
    window.addEventListener('touchstart', mark, { passive: true, once: true });
    window.addEventListener('keydown', mark, { once: true });
    var realign = function () { if (!userScrolled && target) target.scrollIntoView({ behavior: 'instant', block: 'start' }); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(realign); });
    window.addEventListener('load', function () { setTimeout(realign, 60); }, { once: true });
  }
})();
