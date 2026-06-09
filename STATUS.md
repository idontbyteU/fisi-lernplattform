# STATUS — Ist-Zustand FISI//OS

> Momentaufnahme der Lernplattform. Statisch, kein Build, jede Seite eine `.html`.
> Erstellt als Bestandsaufnahme vor weiteren Erweiterungen.

## 1. Health-Status (JS-Scanner)

`python tools/js_scan.py` → **18/18 Dateien fehlerfrei, Exit 0.**
Prüft alle `<script>`-Blöcke auf echte Syntaxfehler (unterminierte Strings/Regex,
deutsches `„…"` mit geradem Schluss-`"`, wörtliches `</script>` in JS-Strings).

## 2. Datei-Inventar (18 HTML-Module)

| Datei | Typ | Zweck | Umfang | Stand | Verlinkt von |
|---|---|---|---|---|---|
| `index.html` | Hub | Startseite, Kacheln, Suche/Filter, Countdown, PWA-Banner | 14 Kacheln, 8 Filter-Chips | ✅ fertig | — (Einstieg) |
| `prio.html` | Aufgaben | AP1-Prüfungstraining, Tipp/Teil-/Komplettlösung | 16 Aufgaben | ✅ fertig | index |
| `ap1_simulation.html` | Aufgaben | AP1-Simulation: Timer, Musterlösung, Selbstkorrektur, Schwächenanalyse | 11 Aufgaben · 3 Modi | ✅ fertig | index |
| `ap2.html` | Stub | Platzhalter AP2 / Projekt | 66 Zeilen | 🚧 Stub | index |
| `python_byte.html` | Aufgaben | Python-Aufgaben + Debugging + Cheatsheet | 16 Aufgaben · 3 Bereiche | ✅ fertig | index |
| `python_lab.html` | Interaktiv | Echtes Python (Pyodide), Editor, Visualizer, Auto-Check | 11 Tabs · 23 Quiz-Aufgaben | ✅ fertig | index |
| `lf1.html` | Karteikarten | Kaufvertrag, Kalkulation, Inventur, Rechtsformen | 95 Karten | ✅ fertig | index |
| `lf2.html` | Karteikarten | Beschaffung, Nutzwertanalyse, PM, Netzplan | 64 Karten | ✅ fertig | index |
| `lf3.html` | Karteikarten | Netzwerke, OSI, TCP/IP, Subnetting, RAID | 77 Karten¹ | ✅ fertig | index |
| `lf3_ipv6.html` | Referenz+Karten | IPv6-Vertiefung | ~29 Karten | ✅ fertig | lf3 |
| `lf4.html` | Hub (Multi-Tab) | **Aktuelle** LF4-Konsolidierung: IT-Sicherheit/ISMS/DSGVO | 5 Tabs · 88 Karten · 109 Begriffe | ✅ fertig | index |
| `lf4_grundschutz_uebung.html` | Übung | IT-Grundschutz-Übung | 289 Zeilen | ✅ fertig | lf4 |
| `lf4_it_sicherheit.html` | Karteikarten+Ref | LF4-Detailmodul (Themen/Karten/Gesetze/DSGVO) | 4 Tabs · 38 Karten | ⚠️ verwaist | (nur lf_isms) |
| `lf4_bedrohungen.html` | Karteikarten+Quiz | Bedrohungen & Angriffsmethoden | 4 Tabs · 84 Karten | ⚠️ verwaist | — |
| `lf_isms_grundschutz.html` | Referenz | ISMS & IT-Grundschutz (Artikel) | 608 Zeilen | ⚠️ verwaist | (nur self) |
| `lf_sicherheit_datenschutz.html` | Referenz | IT-Sicherheit & Datenschutz (Artikel) | 322 Zeilen | ⚠️ verwaist | — |
| `lf_bedrohungen.html` | Karteikarten | Bedrohungen & Modellierung (Vorgänger von lf4) | 52 Karten | ⚠️ verwaist | — |
| `lzk.html` | Redirect | Weiterleitung „aktuelle LZK" → lf4 | 38 Zeilen | ✅ fertig | — |

¹ Index nennt 77; grobe Zählung im Quelltext ergab ~89 → Inhalt evtl. gewachsen, Kachel-Zahl ggf. veraltet.

## 3. Navigation (index.html → Kacheln)

**Sektion „Prüfungsvorbereitung"**
- 🎯 AP1 · Aufgaben & Lösungswege → `prio.html`
- ⏱️ AP1 · Prüfungssimulation → `ap1_simulation.html`
- 📐 AP2 · Aufgaben & Projekt → `ap2.html` *(In Vorbereitung)*
- 🗂️ Projekt → **kein Link** (`.ghost`-Kachel, „Geplant")

**Sektion „Programmierung"**
- 🐍 Python Byte → `python_byte.html`
- 🧪 Python Lab → `python_lab.html`

**Sektion „Lernfelder · Karteikarten"**
- 📘 Lernfeld 1 → `lf1.html`
- 📗 Lernfeld 2 → `lf2.html`
- 📙 Lernfeld 3 → `lf3.html`
- 📕 Lernfeld 4 → `lf4.html` *(Badge „LZK 02.06." = nur `<span>`, kein Link)*

## 4. Interne Links — Prüfung

**Alle aufgelösten `href`-Ziele existieren** (keine 404-Links). `projekt.html` taucht
nur in einem HTML-Kommentar auf, ist also kein toter Link.

**⚠️ Verwaiste Seiten** (existieren, aber von index.html aus **nicht erreichbar**):

| Seite | Inbound-Link |
|---|---|
| `lf4_bedrohungen.html` | keiner |
| `lf4_it_sicherheit.html` | nur von `lf_isms_grundschutz` (selbst verwaist) |
| `lf_isms_grundschutz.html` | nur Self-Link |
| `lf_sicherheit_datenschutz.html` | keiner |
| `lf_bedrohungen.html` | keiner |
| `lzk.html` | keiner (nur per Direktlink/Bookmark) |

→ Vermutlich ältere/standalone LF4-Themenseiten, die durch das konsolidierte
`lf4.html` abgelöst wurden (gleicher Titel bei `lf4.html` ↔ `lf_bedrohungen.html`).
**Offene Entscheidung:** verlinken (Sub-Nav in lf4) oder archivieren/entfernen.

> Hinweis: Beim Anlegen/Verlinken neuer Seiten zusätzlich `service-worker.js`
> `ASSETS` aktualisieren (Offline-Cache).

## 5. Modul-Bereiche (Tabs/Sektionen)

- **python_lab** (11 Tabs): Code-Labor · Schleifen · Logik · Listen · Dictionary · Funktionen · Strings · Sortieren · Struktogramm · Übungen · Lernpfad
- **lf4** (5 Tabs): Zusammenfassung · Karteikarten · Begriffe · Gesetze · DSGVO (+ Grundschutz-Übung, PDF-Spickzettel)
- **lf4_bedrohungen** (4 Tabs): Zusammenfassung · Karteikarten · Begriffe A–Z · Quiz
- **lf4_it_sicherheit** (4 Tabs): Themen · Karteikarten · Gesetze · DSGVO
- **python_byte** (3 Bereiche): Aufgaben · „Fehler lesen & selbst lösen" · Cheatsheet
- **lf1/lf2/lf3** : reine `study.js`-Karteikarten (eine Ansicht, Mastery/Filter/Shuffle)
- **prio / ap1_simulation** : `.shell`/`.main`/`.rail`-Layout, Aufgabe + Erklärpanel

## 6. Nur manuell im Browser testbar

Der Scanner prüft nur Syntax. Folgendes braucht echte Browser-Prüfung:

- **python_lab** — Pyodide lädt (CDN, erster Load langsam, dann gecacht); Code-Ausführung; `input()`-Dialog; **23er-Quiz Auto-Check** (führt Code wirklich aus); 8 Visualizer (Schleifen, Listen, Bubblesort, if/else, Dictionary, Funktionen, Slicing, Struktogramm); „📖 Erklärung"-Panels.
- **python_byte** — Hinweis-/Lösungs-Toggles je Aufgabe.
- **ap1_simulation** — Timer, Modus-Umschaltung, Selbstkorrektur, Schwächenanalyse.
- **prio** — Tipp / Teil- / Komplettlösung aufklappen.
- **lf4_bedrohungen** — Quiz-Tab (Auswertung).
- **Alle Karteikarten** (`study.js`) — Mastery-Tracking, Shuffle, Filter, Tastatur-Shortcuts, `localStorage`-Persistenz.
- **PWA** — Service Worker (nur HTTPS/localhost), Install-Banner, Offline-Cache; auf `file://` still übersprungen.
