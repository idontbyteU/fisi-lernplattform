# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**FISI//OS** is a static, PWA-capable learning platform for the German IT apprenticeship exam (Fachinformatiker Systemintegration). There is no build step, no package manager, no framework, and no server — every page is a plain `.html` file opened directly in the browser or served from a static host (e.g. GitHub Pages).

## Design-System
Verbindliche Design-Vorgaben stehen in DESIGN.md (Repo-Root): Farb-Tokens,
Lernfeld-Akzentfarben, Breakpoints, Komponenten-Inventar, eiserne Regeln.
Vor UI-/Seiten-Aenderungen DESIGN.md beachten. Single Source of Truth bleibt
theme.css; DESIGN.md ist die Schnellreferenz.

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
| `theme.css` | Single design-system file — all colors, fonts, components. Holds **both** palettes: dark in `:root`, light in `html[data-theme="light"]`. Edit here for global changes. |
| `theme.js` | Shared theme engine. Applies the saved theme to `<html>` before paint, injects/wires the `.theme-tg` header toggle, persists to `localStorage` key `fisi_theme` (default dark). Include `<script src="theme.js"></script>` in every page `<head>`. |
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

## Design-Standards (verbindlich für alle Seiten)

Diese zwei Standards gelten für **jede** Seite/Kachel/Modul. Bestehende Seiten werden darauf umgestellt; neue Seiten erfüllen sie von Anfang an.

### 1. Theme: Hell- UND Dunkelmodus (gleichwertig)

- Beide Modi sind Pflicht und gleich wichtig. Umsetzung **ausschließlich über CSS-Custom-Properties**, geschaltet per `data-theme` am `<html>`-Element (`[data-theme="light"]` = hell; ohne Attribut = dunkel).
- **Umschalt-Button sichtbar im Header jeder Seite** (`.theme-tg`). Wird von `theme.js` injiziert/verdrahtet — Seite braucht nur `<script src="theme.js"></script>` im `<head>`.
- Auswahl in `localStorage` (Key `fisi_theme`) speichern und beim Laden wiederherstellen. **Standard = dunkel.**
- **Exakte Paletten, 1:1 aus den bestehenden Modulen** (`lf4.html` / `lf3_ipv6.html` stellen hell und dunkel bereits korrekt dar — sie sind die Farbquelle). Nichts runden, vereinheitlichen oder annähern. Beide Paletten leben zentral in `theme.css`:

  **Dunkel (`:root`):** `--bg:#070710; --bg2:#0c0c1a; --ink:#f3fbff; --muted:#9fb0cc; --dim:#6b768f; --read:#d8e3f2; --cyan:#2de2e6; --magenta:#ff2a6d; --purple:#b66bff; --lime:#9dff52; --amber:#ffb43b; --line:rgba(120,180,220,.14); --glass:rgba(16,20,36,.62); --glass2:rgba(20,26,46,.7); --ok:#27f59a; --warn:#ffb43b; --danger:#ff2a6d` (+ `--lf1..5`, Aliase).

  **Hell (`html[data-theme="light"]`):** `--bg:#ffffff; --bg2:#f4f7fa; --ink:#16202b; --muted:#5a6675; --dim:#7c8896; --read:#222e3a; --cyan:#0892a5; --magenta:#c81e5a; --purple:#7a3ec8; --amber:#b8801f; --ok:#138a5e; --line:#d4dde6; --glass:#f4f7fa; --glass2:#eef3f8; --warn:#b8801f; --danger:#c81e5a; --card:#ffffff; --shadow:0 6px 20px rgba(30,50,80,.10)`.

- Beide Paletten werden **einheitlich auf allen Seiten** verwendet — hell sieht überall gleich aus, dunkel sieht überall gleich aus.
- **Keine hartcodierten Farben mehr direkt an Elementen.** Seiten mit eigenem `:root` (z. B. `python_lab` mit `--lab-*`) aliasen ihre Variablen auf die kanonischen (`--lab-bg:var(--bg)` usw.), damit beide Modi automatisch greifen.

### 2. Lösungen/Erklärungen: ein einklappbarer Block pro Aufgabe

- Werden **nicht** am Seitenende (oder in einer Seiten-Rail) gesammelt — jede Lösung/Erklärung steht **direkt unter ihrer Aufgabe**.
- **Ein** einklappbarer Block: **ein Klick öffnet die komplette Lösung, ein Klick schließt sie**. Kein mehrstufiges Aufklappen (kein Tipp→Teil→Komplett).
- **Standardmäßig zugeklappt.**

### 3. Flip-Karteikarten: keine durchscheinende Rückseite

- Beide Kartenseiten MÜSSEN `backface-visibility:hidden` (inkl. `-webkit-`-Präfix) und einen voll deckenden Hintergrund (Alpha = 1) haben. NIEMALS halbtransparente Flächen (rgba mit Alpha<1, `var(--glass*)` o. Ä.) auf drehenden Kartenseiten verwenden – sonst scheint die gespiegelte Rückseite im Dunkelmodus durch. Gilt für JEDE Seite und JEDE eigene Inline-Engine, nicht nur die zentrale `.face`-Karte.

### 4. Lange Konzept-Erklärungen: opaker Drawer im Vordergrund

Lange Konzept-Erklärungen öffnen in einem opaken Drawer im Vordergrund, standardmäßig angedockt (Desktop: Panel rechts; Handy: hochziehbares Bottom-Sheet), mit Umschaltung auf blockierendes Vollbild. Frei resizebare Panels sind nicht erlaubt – nur feste Zustände. Kurze Aufgaben-Erklärungen bleiben inline einklappbar (siehe Standard 2).

- Zentrale, wiederverwendbare Komponente: `drawer.js` (Logik) + `.drw-*`-Stile in `theme.css`. In jede Seite per `<script src="drawer.js"></script>` im `<head>` einbinden. Nur **eine** Panel-Instanz – neuer Inhalt ersetzt den alten, kein Stapeln.
- Inhalt laden: Ein Button mit `data-erkl="content/<datei>.md"` (optional `data-erkl-title="…"`) wird automatisch verdrahtet und rendert die Markdown-Datei in den Drawer. Programmatisch: `Drawer.openMarkdown({url|md, title, trigger})` bzw. `Drawer.open({html, title, trigger})`.
- Panel-Hintergrund **immer voll deckend** (`var(--bg2)`, Alpha = 1), klare Kante/Schatten; eigener Scrollbereich mit `overscroll-behavior:contain`; Code-Blöcke horizontal scrollbar in `var(--code-bg)`. Im Vollbild Fokusfalle, Seite dahinter gesperrt; beim Schließen Fokus zurück auf den auslösenden Button. Schließen per Button, Esc, und (nur im Vollbild) Klick auf den abgedunkelten Hintergrund. Beim Drucken ausgeblendet.
- Lange Erklär-Inhalte liegen als Markdown unter `content/` und müssen in `service-worker.js` (`ASSETS`) registriert werden (sonst nicht offline). Werden per `fetch` geladen → über lokalen Server/HTTPS öffnen, nicht per `file://`.

## Key conventions

- **All content is inline**: Card data, question arrays, and page-specific JS live directly inside `<script>` tags in each HTML file — there are no separate JSON or JS data files.
- **Mastery is stored in `localStorage`**: The `study.js` key format is `fisi_<module>_v2`. Changing the key resets all user progress for that page.
- **No external dependencies at runtime**: Google Fonts are the only CDN resource. Everything else is local.
- **New pages must be registered** in `service-worker.js` `ASSETS` array, otherwise they won't be available offline.
- **Cyberpunk UI conventions**: Use `<div class="scan"></div>` as the first child of `<body>` (scanline overlay). Header uses `.hdr` > `.hdr-in` with a `.back` link and optional `.tabs` or `.mode` switcher. All pages link back to `index.html`.

## Git / Commits (Windows / PowerShell)

Diese Umgebung läuft unter **Windows mit PowerShell**. Commit-Nachrichten **IMMER** auf eine der beiden folgenden Arten erstellen:

- **Einzeiliger Betreff:** `git commit -m "betreff"` (eine einfache, in Anführungszeichen gesetzte Zeile).
- **Mehrzeilige Beschreibung:** Text vorher in eine **temporäre Datei** schreiben und mit `git commit -F <datei>` committen (Datei danach löschen).

**NICHT verwenden:** Here-Strings (`@'…'@` / `@"…"@`) oder `$(printf …)`-Konstruktionen als Commit-Nachricht. Diese werden je nach Shell falsch interpretiert und erzeugen einen **kaputten Betreff (z. B. nur `@`)**. Wenn eine ausführliche, strukturierte Nachricht nötig ist, führt der Weg über `-F <datei>` — nicht über verschachtelte Shell-Expansion.
