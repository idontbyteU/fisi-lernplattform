# DESIGN-SYSTEM — FISI Lernplattform
Single Source of Truth = theme.css. Bei Konflikt gilt theme.css.
Schnellreferenz der belegten Werte, um Raten zu vermeiden.

## Eiserne Regeln
- ALLE Farben ueber CSS-Variablen, NIE Hex an Elementen -> hell/dunkel schaltet automatisch.
- Beide Themes Pflicht: theme.css + theme.js einbinden. Kein Light-only-Inline-CSS.
- Nur gerade Anfuehrungszeichen (" ') in HTML-Attributen UND JS. Keine typografischen.
- Bestehende Komponenten/Klassen wiederverwenden, nicht neu erfinden.
- service-worker.js (network-first) + manifest.json nicht anfassen ohne Anlass.
- Startseite: EINE Kachel pro Lernfeld. Unterthemen in den Hub, nie neue Startseiten-Kachel.
- Kein Build-Step. Statisches HTML/CSS/JS.

## Lernfeld-Akzentfarben (feste Zuordnung)
LF1 cyan #2de2e6 | LF2 gruen #27f59a | LF3 amber #ffb43b | LF4 magenta #ff2a6d | LF5 lila #b66bff
Akzent kommt automatisch aus data-lf="N" -> .tile[data-lf=N]{--ac:var(--lfN)}.
Seiten-Akzent entsprechend dem Lernfeld setzen (USV/LF3=amber, UML/LF5=lila).

## Farb-Tokens (dunkel / hell)
Flaechen: --bg #070710/#fff, --bg2 #0c0c1a/#f4f7fa
Text: --ink #f3fbff/#16202b, --read #d8e3f2/#222e3a, --muted #9fb0cc/#5a6675, --dim #6b768f/#7c8896
Neon: --cyan #2de2e6/#0892a5, --magenta #ff2a6d/#c81e5a, --purple #b66bff/#7a3ec8, --lime #9dff52, --amber #ffb43b/#b8801f
Status: --ok #27f59a/#138a5e, --warn=amber, --danger=magenta
Struktur: --line, --glass, --glass2, --code-bg #0a0d14/#eef3f8

## Schriften
--fdisp Orbitron (Headlines/Brand/Kachel-h3) | --fui Chakra Petch (Text/UI) | --fmono Share Tech Mono (Code/Tags/Meta)

## Breakpoints (vollstaendig)
881px Layout (Shell/Rail einspaltig, TOC) | 719px Drawer->Bottom-Sheet | 640px Mobile-Hauptschwelle (Header stapelt, Tabs scrollbar, Touch >=40px) | 560px Grids einspaltig | 380px Knoepfe stapeln

## Kacheln
Startseite .grid = 2 Spalten (560px->1). Muster: <a class="tile" data-lf="N" style="--i:k" ...> mit .ic/h3/p/.meta.
--i:k = fortlaufender Index (Fade-Animation). .tile.ap = AP-Kachel, .tile.ghost = geplant/nicht klickbar.

## Komponenten-Inventar (vorhanden, wiederverwenden)
.sum: .h-sec/.h-sub/.lead, dl.deflist, ul.clean, .cardgrid(c2/c3), .chain, .stufen, .gloss
.callout: Basis(amber)/.tip(cyan)/.warn(magenta)/.merk(lime) - mit Hell-Overrides
Rechnen: .calc/.calc-card/.calc-sol(.step/.res) | prio: .card/.badge/.panel
Karteikarten: study.js (3-Stufen-Mastery .m-lo/.m-mid/.m-hi) | Drawer: drawer.js (.drw-*) | Python: .pyhub

## Nordstern
Abrufen statt Wiedererkennen. Aktives Produzieren/Anwenden vor passivem Lesen.
