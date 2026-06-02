# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**FISI//OS** is a static, PWA-capable learning platform for the German IT apprenticeship exam (Fachinformatiker Systemintegration). There is no build step, no package manager, no framework, and no server — every page is a plain `.html` file opened directly in the browser or served from a static host (e.g. GitHub Pages).

## Running / developing locally

Open `index.html` directly in a browser, or serve the directory with any static file server:

```
npx serve .
# or
python -m http.server 8080
```

The PWA Service Worker only activates on HTTPS or `localhost`. On a raw `file://` URL the Service Worker is silently skipped; all other functionality works.

## Architecture

### Shared assets (affect every page)
| File | Purpose |
|---|---|
| `theme.css` | Single design-system file — all colors, fonts, components. Edit here for global changes. |
| `study.js` | Flashcard engine (`Study.init({cards, cats, key})`). Handles mastery tracking, shuffle, filter, keyboard shortcuts, localStorage. |
| `service-worker.js` | Network-first PWA cache. **Must be updated** when a new HTML page is added (add its path to the `ASSETS` array). |
| `manifest.json` | PWA manifest. |

### Page patterns

**Karteikarten-Seiten** (`lf1.html` – `lf4.html`): Define `CARDS` (array of `{id, q, a, c}`) and `CATS` (category map) as inline `<script>` constants, then call `Study.init({cards: CARDS, cats: CATS, key: "fisi_lf1_v2"})`. The `study.js` engine renders everything. The `key` string must be unique per page (it's the `localStorage` key).

**Aufgaben-Seiten** (`prio.html`, `ap1_simulation.html`): Self-contained inline JS. Use the `.shell` / `.main` / `.rail` layout for the two-column task + explanation panel. Task data lives as a JS array inside the `<script>` block.

**Zusammenfassungs-Seiten** (`lf4_it_sicherheit.html`, `lf_isms_grundschutz.html`, etc.): Pure HTML reference articles using `.sum` component classes from `theme.css`. No JS logic needed.

### Design tokens (in `theme.css` `:root`)
```
--bg, --bg2        dark backgrounds
--cyan             primary accent (also --green, --blue aliases)
--magenta          secondary accent
--lf1..--lf5       per-Lernfeld neon colors (cyan/green/amber/magenta/purple)
--ok / --warn / --danger   status colors
--fdisp / --fui / --fmono  Orbitron / Chakra Petch / Share Tech Mono
```

Tile accent color is set via the `--ac` CSS variable, overridden by `data-lf="N"` attributes on `.tile` elements.

## Key conventions

- **All content is inline**: Card data, question arrays, and page-specific JS live directly inside `<script>` tags in each HTML file — there are no separate JSON or JS data files.
- **Mastery is stored in `localStorage`**: The `study.js` key format is `fisi_<module>_v2`. Changing the key resets all user progress for that page.
- **No external dependencies at runtime**: Google Fonts are the only CDN resource. Everything else is local.
- **New pages must be registered** in `service-worker.js` `ASSETS` array, otherwise they won't be available offline.
- **Cyberpunk UI conventions**: Use `<div class="scan"></div>` as the first child of `<body>` (scanline overlay). Header uses `.hdr` > `.hdr-in` with a `.back` link and optional `.tabs` or `.mode` switcher. All pages link back to `index.html`.
