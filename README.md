# Diapason — one site, five characters

Portfolio concept for «Диапазон» (Diapason), a fictional web design studio. The studio's one-page site exists in
**five styles** — brutalism, glassmorphism, retro ’90s, minimalism and cyberpunk — and a **hub** shows them side by
side. The copy, the sections, their order and their anchors are identical on every page; the layout, grid, type,
colour, motion and component behaviour are designed from scratch for each style. A client sees the designer's range
in seconds.

"Diapason" is the full compass of an instrument — the whole range it can sound.

## Pages

| # | Page | Style | Signature |
|---|------|-------|-----------|
| — | `index.html` | Hub | «ДИАПАЗОН» set letter by letter in the five styles, each tile landing with its style's own motion; five live previews laid out as a tuner (A2–A6, 110–1760 Hz) that expand and auto-scroll on hover; an opt-in tuning-fork tone; a compare table of the five design systems |
| 01 | `brutalism.html` | Brutalism | A headline that measures itself to fill the width, stamped in with hard steps; acid stickers and price tags you can drag (mouse, touch, arrow keys) |
| 02 | `glassmorphism.html` | Glassmorphism | A WebGL lagoon behind real liquid glass (SVG displacement refraction in Chromium); a glass droplet that bends the headline and follows the cursor |
| 03 | `retro-90s.html` | Retro ’90s | A Windows 95 desktop with a Netscape homepage: draggable windows, Start menu, hit counter, guestbook form and an original WebAudio chiptune |
| 04 | `minimalism.html` | Minimalism | Greyscale with one orange dot; a single line draws itself through the whole page as you scroll |
| 05 | `cyberpunk.html` | Cyberpunk | A boot sequence, a HUD that tracks the cursor, text that decrypts itself and a holographic tuning fork you can strike |

## How it works

- **One source of copy.** `assets/core/content.js` holds every word in Russian and English. Pages contain only
  `data-i18n` keys and `<template data-i18n-list>` blocks, so the five versions physically cannot drift apart, and the
  RU/EN switch changes every word on the page.
- **Same anchors everywhere.** `#top · #services · #work · #process · #pricing · #faq · #contact`. The style dock at the
  bottom (or keys `1`–`5`, `0` for the hub) opens the same section in another style, in the same language, with a
  circular reveal (cross-document View Transitions, Chrome 126+ / Safari 18.2+; other browsers just navigate).
- **Preview mode.** `?preview=1` turns a page into a quiet, auto-scrolling thumbnail for the hub: no loaders, audio
  or cursors, heavy loops paused until the strip is active.
- **No build step, no framework.** Vanilla HTML/CSS/JS, Google Fonts (all with Cyrillic), no external images — all art
  is SVG, CSS, canvas or WebGL.

## Run

```bash
node serve.mjs
```

Open http://localhost:5178 (or double-click `start.bat`). Opening the files directly also works, but the reveal
between styles and the hub previews need a real origin.

## Structure

```
index.html, brutalism.html, glassmorphism.html, retro-90s.html, minimalism.html, cyberpunk.html
assets/core/      content.js (RU/EN copy), core.js (i18n, dock, navigation, form, preview), core.css
assets/<style>/   style.css, script.js, copy.js (style-specific jokes, boot lines, labels)
docs/SPEC.md      the build spec and art direction for every style
docs/skeleton.html the canonical markup every page is built from
```

The contact form is a demo: it validates and shows a success state but sends nothing. To go live, post the form data
to a Telegram bot or a form service in the `diapason:formsent` handler.
