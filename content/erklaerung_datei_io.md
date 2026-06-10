# Dateien lesen und schreiben in Python (Datei-Ein-/Ausgabe)

## Die Grundidee in einem Satz
Eine Datei ist nur Text, der auf der Festplatte gespeichert ist. Python kann so eine Datei **öffnen**, dann **etwas reinschreiben oder rauslesen** und sie danach wieder **schließen** — wie ein Heft, das du aufschlägst, beschreibst und wieder zuklappst.

## Das Muster, das du dir merken musst
Fast jeder Datei-Zugriff sieht so aus:
```python
with open("dateiname.txt", modus, encoding="utf-8") as f:
    # hier liest oder schreibst du über f
```
- `open(...)` öffnet die Datei.
- `with ... as f:` gibt dir mit `f` einen „Griff" zur Datei — und sorgt dafür, dass die Datei am Ende **automatisch geschlossen** wird.
- `encoding="utf-8"` brauchst du für Umlaute (ä, ö, ü, ß).

## Die drei Modi
| Modus | Bedeutung | Verhalten |
|-------|-----------|-----------|
| `"r"` | read (lesen) | Liest. **Fehler**, wenn die Datei nicht existiert. |
| `"w"` | write (schreiben) | Legt neu an oder **überschreibt komplett**. |
| `"a"` | append (anhängen) | Schreibt **ans Ende**, ohne Vorhandenes zu löschen. |

Merke: `"w"` ist gefährlich, wenn die Datei schon existiert — der alte Inhalt ist sofort weg.

## Schreiben
```python
with open("notizen.txt", "w", encoding="utf-8") as f:
    f.write("Erste Zeile\n")
    f.write("Zweite Zeile\n")
```
- `f.write("...")` schreibt Text.
- `\n` ist ein **Zeilenumbruch**. Ohne `\n` klebt alles in einer Zeile.

## Lesen — drei Wege

**1) Alles auf einmal:**
```python
with open("notizen.txt", "r", encoding="utf-8") as f:
    inhalt = f.read()
print(inhalt)
```
`f.read()` gibt den **gesamten** Dateiinhalt als einen String zurück.

**2) Zeile für Zeile (am häufigsten in Aufgaben):**
```python
with open("notizen.txt", "r", encoding="utf-8") as f:
    for zeile in f:
        print(zeile.strip())
```
`for zeile in f:` geht die Datei Zeile für Zeile durch. `.strip()` entfernt den Zeilenumbruch am Ende (sonst bekommst du doppelte Leerzeilen).

**3) Alle Zeilen als Liste:**
```python
with open("notizen.txt", "r", encoding="utf-8") as f:
    zeilen = f.readlines()   # ['Erste Zeile\n', 'Zweite Zeile\n']
```

## Komplettes Beispiel: schreiben, dann lesen
```python
# 1. schreiben
with open("einkauf.txt", "w", encoding="utf-8") as f:
    f.write("Milch\n")
    f.write("Brot\n")
    f.write("Eier\n")

# 2. wieder einlesen und anzeigen
with open("einkauf.txt", "r", encoding="utf-8") as f:
    for zeile in f:
        print("- " + zeile.strip())
```
Ausgabe:
```
- Milch
- Brot
- Eier
```

## Typische Fehler (und wie du sie vermeidest)
- **`with` vergessen / Datei nicht geschlossen** → Geschriebenes wird evtl. nicht gespeichert. Lösung: immer `with` verwenden.
- **Falscher Modus** → mit `"w"` aus Versehen eine vorhandene Datei überschrieben. Willst du anhängen, nimm `"a"`.
- **`\n` vergessen** → alles klebt in einer Zeile.
- **Datei existiert nicht** beim Lesen (`"r"`) → `FileNotFoundError`. Dateiname/Pfad prüfen.
- **`.strip()` vergessen** beim zeilenweisen Lesen → zusätzliche Leerzeilen in der Ausgabe.

## Merksatz
**Öffnen → lesen oder schreiben → schließen.** Mit `with open(...) as f:` übernimmt Python das Öffnen und Schließen — du machst nur den mittleren Teil. `"r"` liest, `"w"` überschreibt, `"a"` hängt an.

## Mini-Übung zum Selbermachen
Schreibe ein Programm, das drei deiner Lieblingsfilme in eine Datei `filme.txt` schreibt (jeder in einer eigenen Zeile) und sie danach **nummeriert** wieder ausgibt (`1. …`, `2. …`, `3. …`).

<details>
<summary>Lösung</summary>

```python
filme = ["Inception", "Matrix", "Interstellar"]

# schreiben
with open("filme.txt", "w", encoding="utf-8") as f:
    for film in filme:
        f.write(film + "\n")

# nummeriert lesen
with open("filme.txt", "r", encoding="utf-8") as f:
    nummer = 1
    for zeile in f:
        print(f"{nummer}. {zeile.strip()}")
        nummer += 1
```
</details>
