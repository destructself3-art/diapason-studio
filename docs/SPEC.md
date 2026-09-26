# Diapason — build spec

**Diapason** («Диапазон») is a fictional web design studio. Its one-page site exists in **five styles**
(brutalism, glassmorphism, retro ’90s, minimalism, cyberpunk) plus a **hub** that presents them side by side.
The point of the project: a prospective client instantly sees the designer's range. It is a portfolio piece, so
every page must look like Awwwards-level studio work — alive, fast, detailed, with a clear wow moment in the first
5 seconds. A page that merely "works" but looks templated or AI-generated is a failure.

The copy, sections, order and anchors are **identical** on all five pages. Everything else — layout, grid,
typography, colour, motion, behaviour of components — is designed from scratch for each style.
It is **not** a recoloured template.

```
diapason-studio/
  index.html            hub                 → assets/hub/{style.css, script.js, copy.js?}
  brutalism.html        01                  → assets/brutalism/…
  glassmorphism.html    02                  → assets/glassmorphism/…
  retro-90s.html        03                  → assets/retro-90s/…
  minimalism.html       04                  → assets/minimalism/…
  cyberpunk.html        05                  → assets/cyberpunk/…
  assets/core/          SHARED — content.js (all copy, RU+EN), core.js (engine), core.css (dock, reveal)
  docs/skeleton.html    the canonical markup = the content contract
  serve.mjs             node serve.mjs → http://localhost:5178
```

## 1. Ownership (parallel build — read carefully)

- You own **only** your page file and your `assets/<id>/` folder. Never edit another style's files.
- **Never edit** `assets/core/*`, `docs/*`, `serve.mjs`. If you believe core needs a change, work around it in your
  own files and describe the request in your final report (`coreRequests`).
- Style-specific extra copy (marquee text, boot lines, retro jokes…) goes into `assets/<id>/copy.js`, both languages,
  under the namespace `x.<id>` (hub: `x.hub`):
  ```js
  window.DIAPASON_EXTRA = window.DIAPASON_EXTRA || [];
  window.DIAPASON_EXTRA.push({ ru: { x: { cyberpunk: { boot: ['…'] } } }, en: { x: { cyberpunk: { boot: ['…'] } } } });
  ```
  No hard-coded human-language text in HTML or JS — everything visible goes through `data-i18n*` or `DIAPASON.t()`,
  so the RU/EN switch changes every word. (Pure decoration like `0x3F`, `C:\>`, `.exe` is fine.)

## 2. Page contract

Start from `docs/skeleton.html` (fix the `../` paths — your page lives in the project root).

1. `<html lang="ru" data-style="<id>">` — `<id>` is exactly `brutalism | glassmorphism | retro-90s | minimalism | cyberpunk`.
2. `<head>`: keep the inline boot `<script>` from the skeleton verbatim (reveal origin), `core.css` **before** your
   `style.css`, a style-specific inline SVG favicon, `theme-color`, `<title data-i18n="style.metaTitle">`,
   `<meta name="description" data-i18n-attr="content:meta.description">`.
3. Scripts at the **end of `<body>`**, plain (no `defer`/`module`), in this order:
   `assets/core/content.js` → `assets/<id>/copy.js` (if any) → `assets/core/core.js` → `assets/<id>/script.js`.
   core.js initialises synchronously; in your script use `DIAPASON.ready(fn)` (runs immediately) and
   `DIAPASON.on('langchange', fn)` to re-render anything you generate from copy.
4. Sections, in this order, with these exact ids: `#top` (hero) · `#services` · `#work` · `#process` · `#pricing` ·
   `#faq` · `#contact`, then `<footer>`. Every copy key used in the skeleton must appear on your page
   (you may add more keys; you may not drop any). Give sections `scroll-margin-top` if the header is sticky.
5. Lists are `<template data-i18n-list="…">` blocks (see the header comment in `core.js`: `@field`, `@`, `{nn}`,
   `{@motif}`, nested lists). They expand before your script runs, and each top-level clone gets `data-index`.
6. Hero `<h1>` = `hero.title` + `style.hero` ("Сайты с характером." / "Этот — брутальный.") — the second line is the
   page's personality statement; make it sing.
7. Form: keep `form[data-dz-form]`, fields `name`, `contact`, `type` (checkbox chips), `budget` (radio chips),
   `message`, the `[data-error-for]` boxes, `[data-form-success]` and `[data-form-reset]`. core.js validates and
   toggles `.is-sending` / `.is-sent`, fires `diapason:formsending | formsent | forminvalid | formreset` on the form.
   Style every state: default, hover, focus, invalid, sending, success.
8. Footer: the colophon (`style.name`, `style.desc`, `style.fonts`, `style.palette` swatches), `footer.hub` link
   (`data-dz-go="hub"`), `footer.toTop`, `footer.rights`, brand + tagline. Reserve
   `padding-bottom: calc(<your padding> + var(--dz-dock-space))` at the very bottom so the dock never covers content.
9. `.plan__badge` is an empty string on non-featured plans — hide it with `:empty`.
10. Language switch: two buttons `[data-set-lang="ru"]` / `[data-set-lang="en"]` (core sets `aria-pressed` and
    `.is-active`). Both languages must look great — EN is shorter, RU has long words (`hyphens: auto`,
    `overflow-wrap: anywhere` on huge headlines where needed). Test both.

## 3. The dock and navigation (core-owned)

core.js injects a neutral `.dz-dock` pill fixed at the bottom centre (hub link + 01–05). **Do not restyle it.**
Keep the bottom 80 px of the viewport free of your own fixed UI across the middle 60% of the width (the dock is
up to ~800 px wide on desktop, ~300 px on phones) — a retro taskbar or HUD readout must go elsewhere.
Keys `1`–`5` switch styles, `0` opens the hub — do not bind these digits yourself. Switching keeps the current
section and language and plays a circular reveal (View Transitions). Do not set `view-transition-name` on anything
except with a name prefixed `<id>-`.

## 4. Preview mode (hub thumbnails)

The hub embeds every page as `<id>.html?preview=1&lang=xx` in a scaled-down, non-interactive iframe
(`DIAPASON.isPreview === true`, `<html>` gets `.dz-preview`). In preview:
- no loaders / boot sequences / intro delays — show the final state immediately;
- all reveal-on-scroll content visible (or revealed while auto-scrolling), no audio, no custom cursor, no trails;
- pause heavy animation loops unless the hub activates the preview (`DIAPASON.on('previewactive', d => d.active)`);
- core auto-scrolls the page when active — make sure nothing fights `window.scrollTo`.

## 5. Quality bar (all pages)

- **Tech:** vanilla HTML/CSS/JS. Libraries only if truly needed, only from `cdnjs.cloudflare.com` or
  `cdn.jsdelivr.net/npm/` with a pinned version. Fonts only from Google Fonts. **No external images** — art is SVG,
  CSS, canvas or WebGL drawn by you.
- **Fonts must support Cyrillic.** Verify: `curl -s "https://fonts.googleapis.com/css2?family=<Family>" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" | grep -c cyrillic`
  must be > 0. If a planned font lacks Cyrillic, pick the closest one that has it and report the change.
- **Responsive:** looks designed (not just "not broken") at 375, 768, 1024, 1440 px; no horizontal scroll;
  mobile navigation that works (menu button with `aria-expanded`, or a compact scrolling nav).
  Touch targets ≥ 44 px for primary controls. Hover effects need a touch equivalent or must be non-essential.
- **Performance:** 60 fps scrolling; canvas/WebGL at `devicePixelRatio` ≤ 2 (lower on mobile); pause loops when
  off-screen or tab hidden; avoid animating layout properties; big `backdrop-filter`/`filter: blur` areas are expensive.
- **Accessibility:** WCAG AA contrast for body text; visible `:focus-visible` on every interactive element; every
  interaction works from the keyboard (drag features: keyboard alternative or purely decorative);
  `prefers-reduced-motion` → no parallax, no auto-animations, no glitch/blink, instant state changes.
- **Details:** favicon, title, loader (if any) skippable, empty/error/success states, footer, selection colour,
  scrollbar (where tasteful), `::placeholder`, `:disabled`, `accent-color`.
- **No AI clichés:** no violet-blue gradient washes, no Inter everywhere, no identical icon-in-a-circle cards,
  no emoji as icons, no centred-everything layout.
- **The six case cards** (`work.items`) each get art drawn for their `motif` in *your* style:
  `latte` (latte-art heart / cup from above, day-night), `pulse` (heartbeat line), `route` (city map with a courier
  route and dots), `sneaker` (sneaker side profile), `orbit` (planet with an orbit and a small ship),
  `ring` (progress ring / coin — "left for today").

## 6. Art direction per page

### 01 · Brutalism — `brutalism.html`
- Palette: concrete `#F2F0EB`, black `#000000`, acid `#CCFF00` (+ pure white `#FFFFFF` for blocks). Nothing else.
- Type: **Dela Gothic One** (display) + **IBM Plex Mono** (everything else).
- Raw visible grid; blocks butt together with shared 3–4 px black borders (table-like), hard offset shadows
  (`8px 8px 0 #000`), 0 radius, no gradients, no blur, no easing — instant swaps, `steps()`.
- A giant headline that fills the width and breaks aggressively; huge section numbers; at least one marquee band
  (pauses on hover, stops for reduced motion).
- **Signature (must ship):** acid **price stickers you can drag around the page** — the three plan prices (and a
  couple of hero stickers like "5 стилей / RU·EN") are rotated stickers draggable with mouse and touch, constrained to
  their section; focusable and movable with arrow keys; a small "reset" control.
- Hover = hard invert (black/acid). Buttons lift with a growing hard shadow and slam down on press.
- Raw captions (`[FIG. 02 — kadens.pulse]`), FAQ as full-width bordered rows with a huge +/−, form with thick-bordered
  inputs and block chips (checked = acid), success = an acid slab shouting the title.
- Refs: Balenciaga, Bloomberg Businessweek covers, brutalistwebsites.com, Gumroad.

### 02 · Glassmorphism — `glassmorphism.html`
- Palette: deep sea `#0B3C49`, lagoon `#2EC4B6`, sunset `#FF7A45`, sun `#FFC857` — **no violet/blue AI wash**.
- Type: **Geologica** (variable; light 300 for big headlines, 400–600 for UI).
- Background = living light: slow animated colour fields/caustics in the palette (cheap: low-res canvas or WebGL
  upscaled, or a few large gradient blobs) with a light that follows the cursor with spring inertia.
- Glass: `backdrop-filter: blur() saturate()`, a light 1 px rim (brighter top-left), a pointer-following specular
  highlight, subtle grain to prevent banding, soft deep shadows, radius 28 px. Text on glass must hit AA.
- **Signature (must ship):** **liquid glass** — an SVG `feDisplacementMap` refraction at glass edges
  (Chromium: `backdrop-filter: url(#…)`; graceful fallback to blur elsewhere), and a glass lens/droplet on the hero
  that follows the cursor (drag on touch) and visibly refracts what is behind it.
- Cards tilt in 3D toward the pointer (≤ 6°) with spring physics; everything moves with springs and inertia.
- Case art: glass lenses with glowing orbs/lines forming each motif. FAQ as glass pills that open smoothly;
  inputs/chips as glass with a lagoon/sun focus glow.
- Refs: Apple visionOS / iOS 26 Liquid Glass, Stripe's gradient mesh.

### 03 · Retro ’90s — `retro-90s.html`
- A GeoCities-era homepage living inside Windows 95: teal desktop `#008080`, window grey `#C0C0C0`, title bar navy
  `#000080`, bevels (`#FFFFFF / #DFDFDF / #808080 / #000000`), link blue `#0000EE`, visited `#551A8B`,
  plus loud accents in moderation (`#FFFF00`, `#FF00FF`, `#00FF00`).
- Type: Times New Roman (body on white "web page" areas), Comic Sans MS (playful bits), Arial/"MS Sans Serif"-like
  UI (Tahoma, Verdana fallbacks), **Press Start 2P** for pixel labels. Mobile fallbacks must still feel ’90s.
- Sections are Win95 windows (title bar with icon, `_ □ ×` buttons), beveled buttons with a pressed state,
  WordArt-style hero heading (stacked text-shadows / gradient text), blinking "NEW!" (steps), a CSS marquee,
  an "Under construction" stripe with a pixel digger, 88×31 badges ("Best viewed in Netscape Navigator 3.0 at
  800×600"), a hit counter (odometer digits, localStorage), a webring box linking prev/next styles
  (`data-dz-go="glassmorphism"` / `"minimalism"`).
- **Signature (must ship):** **draggable windows** (by the title bar, bring-to-front, close/minimise with a desktop
  icon to restore; keyboard: focus the title bar and move with arrows) — at least 2–3 decorative windows on desktop;
  content windows may stay in flow. **A chiptune "MIDI player"** window: original melody with WebAudio square/
  triangle waves, play/stop, starts only on click, stops when the tab is hidden. Sparkle cursor trail on desktop.
- Pricing as a beveled table, FAQ as a folder tree or `<details>` with ▶, contact form styled as a **guestbook**,
  case art as pixel art (crisp SVG or box-shadow pixels) or "My Computer" icons.
- Any taskbar goes at the **top** (the dock owns the bottom).
- Refs: Cameron's World, the GeoCities archive, Windows 95 (98.css), Space Jam 1996.

### 04 · Minimalism — `minimalism.html`
- Palette: paper `#F4F3EF`, ink `#141414`, graphite `#8A8A85`, hairline `#D9D7D0`, dot `#FF4D1A`. The orange is used
  **only** for the dot: the cursor, the line's tip, active states, one full stop.
- Type: **Manrope** only (200–600). Headlines huge and light (300), tight tracking, sentence case.
- 12-column grid, generous margins, 1 px hairlines, lots of air, precise baseline rhythm.
- **Signature (must ship):** **one continuous SVG line draws itself through the whole page** as you scroll
  (`stroke-dashoffset` bound to scroll progress), weaving through the sections, with the orange dot at its tip.
  Recompute the path on resize, language change and font load. Simplify on mobile.
- Motion: 600 ms, one curve (`cubic-bezier(.22,1,.36,1)`) for everything; masked line reveals; magnetic links and
  a small orange dot cursor on desktop (pointer: fine only).
- Case art: 1 px line drawings of each motif. Pricing columns split by hairlines; FAQ rows with + that turns to ×;
  underline-only inputs; chips as text toggles marked with the dot.
- Refs: Dieter Rams / Braun, Muji, Kinfolk, Pentagram.

### 05 · Cyberpunk — `cyberpunk.html`
- Palette: void `#08070D` (+ panel `#12101C`), cyan `#00F0FF`, magenta `#FF2E88`, alert `#F5F200`, text ≈ `#E6F8FF`.
- Type: **Tektur** (display) + **JetBrains Mono** (body, labels).
- **Signature (must ship):** a **boot sequence** on entry (terminal lines from `x.cyberpunk`, progress bar,
  ACCESS GRANTED; ≤ 2 s; skippable by click/any key; once per session; skipped in preview and reduced motion) and a
  **HUD that tracks the cursor** — corner brackets, crosshair, live clock, pointer X/Y, "SECTOR 03/07 // PROCESS"
  scroll readout (`pointer-events: none`, bottom-centre kept free for the dock).
- Scanlines + faint noise, chromatic-aberration glitch on headings (occasional, not constant), text decrypt/scramble
  on hover and when h2s enter the viewport (keep the real text accessible — e.g. `aria-label`).
- Panels and buttons with 45° cut corners (clip-path), 1 px neon borders, glow on hover.
- Cases as "data shards" with neon wireframe motifs and IDs (`KDN-02 // STATUS: DEPLOYED`), pricing as access tiers
  (featured = magenta glow + yellow badge), FAQ as `> query` terminal rows, contact form as a terminal with a
  blinking block caret; success = TRANSMISSION COMPLETE.
- No Matrix rain. Refs: Cyberpunk 2077 UI, Ghost in the Shell, Blade Runner 2049 interfaces.

### Hub — `index.html`
- The gallery frame, not a sixth style: graphite `#0C0C0E`, text `#EDEDEA`, muted `#8B8B88`, hairlines
  `rgba(255,255,255,.1)`, each style's accent used only to identify that style. Type: **Onest** + **JetBrains Mono**.
- **Wow:** the word `hub.title` («ДИАПАЗОН» / "DIAPASON" — both 8 letters) where every letter is set in one of the
  five styles (its font, colour, treatment); letters periodically re-roll to other styles; hovering a strip lights
  up that style's letters. Accessible name = the whole word.
- **Five vertical strips** side by side, each a live `iframe` of `<id>.html?preview=1&lang=xx` (virtual width
  ~1280 px, scaled to fit, `pointer-events:none`, `tabindex="-1"`, `aria-hidden`, lazy) with number, name, desc and
  "Open →". Hover/focus → the strip expands (flex) and its preview auto-scrolls (`postMessage({type:'diapason:
  autoscroll', on:true})`), collapse → stop. Each strip is an `<a data-dz-go="<id>">` so the reveal starts at the
  click. Language toggle also posts `{type:'diapason:lang', lang}` to every iframe.
- Mobile: stacked cards (a preview at mobile width or a lighter treatment), only the visible one active; stay light.
- Below: the **compare table** of five design systems (specimen «Аа Бб 01» in each style's font, palette swatches,
  `radius`, `motion`, `signature` from `styles.<id>`), the three `hub.how` items, the `hub.cta` block (button →
  a style page's `#contact`), footer. Loads the five styles' fonts for the specimens and the title.
