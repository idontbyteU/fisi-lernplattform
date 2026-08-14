/* ===================================================================== */
/*  FISI//OS · rechnen_data.js                                           */
/*  Reine Daten- und Rechenlogik fuer den Uebungsgenerator.              */
/*                                                                       */
/*  WICHTIG: Diese Datei enthaelt KEINEN DOM-Zugriff, kein document,     */
/*  kein window und keine Anzeige-Logik. Sie wird klassisch per          */
/*  <script src="rechnen_data.js"></script> eingebunden - deshalb kein   */
/*  import/export, sondern eine globale const RECHNEN.                   */
/*                                                                       */
/*  Aufbau:                                                              */
/*    RECHNEN.gruppen = [ {id, label, themen:[themenId, ...]} ]          */
/*    RECHNEN.themen  = { <themenId>: {label, formeln:[], flow:[],      */
/*                        gen()} }                                      */
/*                                                                       */
/*  formeln[] = ausgeschriebene Formelzeilen (eine Zeile je Eintrag,     */
/*    KEINE \n innerhalb eines Eintrags - ap1_rechnen.html rendert sie   */
/*    ohne pre-wrap).                                                    */
/*    Zeilen mit dem Praefix "Achtung: " sind Warnhinweise, Zeilen mit   */
/*    "Merksatz: " sind Merksaetze. formelsammlung.html zieht sie aus    */
/*    der Liste heraus und zeigt sie als Warn- bzw. Merk-Box;            */
/*    ap1_rechnen.html listet sie unveraendert mit auf.                  */
/*  flow[]    = Ablaufkette des Rechenwegs, ein Kasten je Eintrag.       */
/*    Wird von formelsammlung.html als Flowchart dargestellt.            */
/*                                                                       */
/*  gen() wuerfelt bei jedem Aufruf frische Zahlen und liefert           */
/*    {frage, einheit, loesung, pruef, schritte, falle, merk}            */
/*  bzw. bei mehrteiligen Aufgaben                                       */
/*    {frage, teile:[{label, einheit, loesung, pruef}], schritte,        */
/*     falle, merk}                                                      */
/*                                                                       */
/*  gen(vorgabe) akzeptiert optional ein Objekt mit festen Werten        */
/*  (statt gewuerfelter). Das dient ausschliesslich dem Nachrechnen der  */
/*  Kontrollwerte; im Normalbetrieb wird gen() ohne Argument gerufen.    */
/*                                                                       */
/*  pruef-Arten (nur Kennzeichnung - die Vergleichslogik liegt spaeter   */
/*  in der Seite, NICHT in dieser Datei):                                */
/*    "exakt" = ganze Zahl / aufgerundete Sekunden                       */
/*    "geld"  = Toleranz +/- 0,01                                        */
/*    "rel"   = Toleranz +/- 0,5 %                                       */
/*    "text"  = Textabgleich (z. B. Seitenverhaeltnis 16:9)              */
/* ===================================================================== */

const RECHNEN = (function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  HILFSFUNKTIONEN (gekapselt, nicht global)                          */
  /* ------------------------------------------------------------------ */

  // Ganzzahl inklusive beider Grenzen
  function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // zufaelliges Element aus einem Array
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // auf 2 Nachkommastellen runden
  function r2(x) {
    return Math.round(x * 100) / 100;
  }

  // aufrunden
  function auf(x) {
    return Math.ceil(x);
  }

  // deutsche Zahlformatierung: Komma als Dezimaltrenner, Punkt als Tausender
  function fmt(x) {
    if (typeof x !== "number" || !isFinite(x)) return String(x);
    var neg = x < 0;
    var teile = Math.abs(x).toString().split(".");
    var ganz = teile[0];
    var nk = teile.length > 1 ? teile[1] : "";
    var out = "";
    for (var i = 0; i < ganz.length; i++) {
      if (i > 0 && (ganz.length - i) % 3 === 0) out += ".";
      out += ganz.charAt(i);
    }
    if (nk) out += "," + nk;
    return (neg ? "-" : "") + out;
  }

  /* --- interne Kleinhelfer (kein Teil der geforderten Hilfsfunktionen) --- */

  // Vorgabewert benutzen, sonst den gewuerfelten Wert
  function oder(vorgabe, fallback) {
    return vorgabe === undefined ? fallback : vorgabe;
  }

  // zwei verschiedene Elemente aus einem Array
  function pick2(arr) {
    var a = rndInt(0, arr.length - 1);
    var b = rndInt(0, arr.length - 1);
    while (b === a) b = rndInt(0, arr.length - 1);
    return [arr[a], arr[b]];
  }

  // Schnittstellen-Rate in Bit/s
  function zuBit(ss) {
    return ss.einheit === "Gbit/s" ? ss.rate * 1e9 : ss.rate * 1e6;
  }

  // Schnittstellen-Rate in Mbit/s
  function zuMbit(ss) {
    return ss.einheit === "Gbit/s" ? ss.rate * 1000 : ss.rate;
  }

  // Geldbetrag deutsch mit genau zwei Nachkommastellen (1.234,50)
  function euro(x) {
    var v = Math.round(x * 100) / 100;
    var s = Math.abs(v).toFixed(2).split(".");
    return (v < 0 ? "-" : "") + fmt(parseInt(s[0], 10)) + "," + s[1];
  }

  // groesster gemeinsamer Teiler (euklidischer Algorithmus)
  function ggT(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /* ------------------------------------------------------------------ */
  /*  FESTE KONSTANTEN                                                   */
  /* ------------------------------------------------------------------ */

  var SCHNITTSTELLEN = [
    { name: "USB 2.0",           rate: 480, einheit: "Mbit/s", bit: true },
    { name: "USB 3.0 / 3 Gen 1", rate: 5,   einheit: "Gbit/s", bit: true },
    { name: "USB 3 Gen 2",       rate: 10,  einheit: "Gbit/s", bit: true },
    { name: "USB 3 Gen 2x2",     rate: 20,  einheit: "Gbit/s", bit: true },
    { name: "USB 4",             rate: 40,  einheit: "Gbit/s", bit: true },
    { name: "Ethernet 1G",       rate: 1,   einheit: "Gbit/s", bit: true },
    { name: "USB 3.0",           rate: 450, einheit: "MB/s",   bit: false },
    { name: "eSATA II",          rate: 300, einheit: "MB/s",   bit: false }
  ];

  var AUFLOESUNGEN = [
    { name: "VGA",     b: 640,  h: 480 },
    { name: "Full HD", b: 1920, h: 1080 },
    { name: "WQHD",    b: 2560, h: 1440 },
    { name: "UHD-4K",  b: 3840, h: 2160 },
    { name: "5K",      b: 5120, h: 2880 },
    { name: "8K",      b: 7680, h: 4320 }
  ];

  // 30,42 = 365/12 - im Aufgabentext immer ausdruecklich nennen
  var MONATSTAGE = [30, 31, 30.42];

  /* --- abgeleitete Teilmengen ---------------------------------------- */

  var BIT_SS = SCHNITTSTELLEN.filter(function (s) { return s.bit === true; });
  var BYTE_SS = SCHNITTSTELLEN.filter(function (s) { return s.bit === false; });

  // Dezimal-/Binaer-Paare fuer die Einheiten-Umrechnung (n = Zehnerpotenz-Stufe)
  var EINHEITEN_PAARE = [
    { dez: "kB", bin: "KiB", n: 1 },
    { dez: "MB", bin: "MiB", n: 2 },
    { dez: "GB", bin: "GiB", n: 3 },
    { dez: "TB", bin: "TiB", n: 4 }
  ];

  // Bit/Byte-Umrechnungen (f = Faktor von der Ausgangs- auf die Zieleinheit)
  var BITBYTE = [
    { von: "Mbit",  nach: "MByte", f: 1 / 8, weg: "Bit / 8" },
    { von: "Gbit",  nach: "GByte", f: 1 / 8, weg: "Bit / 8" },
    { von: "MByte", nach: "Mbit",  f: 8,     weg: "Byte * 8" },
    { von: "GByte", nach: "Gbit",  f: 8,     weg: "Byte * 8" }
  ];

  // Scanner-Formate in cm
  var SCAN_FORMATE = [[10, 15], [13, 18], [20, 30]];

  // Verbraucher mit typischer Leistungsaufnahme in Watt (Gruppe strom)
  var GERAETE = [
    { name: "Arbeitsplatz-PC",   watt: 120 },
    { name: "Monitor 24 Zoll",   watt: 28 },
    { name: "Thin Client",       watt: 18 },
    { name: "Rack-Server",       watt: 450 },
    { name: "NAS mit 4 Platten", watt: 60 },
    { name: "Etagen-Switch",     watt: 35 },
    { name: "Multifunktions-Drucker", watt: 90 }
  ];

  // Arbeitspreis in Cent je kWh
  var STROMPREIS = [32, 35, 38, 41];

  // Netzteil-Wirkungsgrade in Prozent (80 PLUS Bronze bis Titanium)
  var WIRKUNGSGRAD = [82, 85, 88, 90, 92, 94];

  // Komponenten eines PCs mit Leistungsaufnahme in Watt (Gruppe netzteil)
  var KOMPONENTEN = [
    { name: "Prozessor",     watt: 125, min: 1, max: 1 },
    { name: "Grafikkarte",   watt: 220, min: 1, max: 1 },
    { name: "Mainboard",     watt: 40,  min: 1, max: 1 },
    { name: "RAM-Modul",     watt: 6,   min: 2, max: 4 },
    { name: "SSD",           watt: 8,   min: 1, max: 2 },
    { name: "Festplatte",    watt: 10,  min: 0, max: 3 },
    { name: "Gehäuselüfter", watt: 4,   min: 2, max: 5 }
  ];

  // Betrachtungszeitraeume fuer Verfuegbarkeit
  var ZEITRAEUME = [
    { name: "Jahr",             stunden: 8760 },
    { name: "Monat (30 Tage)",  stunden: 720 },
    { name: "Woche",            stunden: 168 }
  ];

  // uebliche Verfuegbarkeitsklassen in Prozent
  var VERFUEGBARKEIT = [99, 99.5, 99.9, 99.95, 99.99];

  /* ------------------------------------------------------------------ */
  /*  THEMEN                                                             */
  /* ------------------------------------------------------------------ */

  var themen = {

    /* =============== EINHEITEN UMRECHNEN (Gruppe daten) ============== */
    einheiten: {
      label: "Einheiten umrechnen",
      formeln: [
        "Dezimale Einheiten (Hersteller): kB, MB, GB, TB - Schritte von 1.000",
        "Binäre Einheiten (Betriebssystem): KiB, MiB, GiB, TiB - Schritte von 1.024",
        "1 kB = 1.000 Byte   |   1 KiB = 1.024 Byte",
        "1 MB = 1.000² Byte   |   1 MiB = 1.024² Byte",
        "1 GB = 1.000³ Byte   |   1 GiB = 1.024³ Byte",
        "1 TB = 1.000⁴ Byte   |   1 TiB = 1.024⁴ Byte",
        "Dezimale Angabe in binäre Einheit: Zielwert = Ausgangswert × (1.000 ÷ 1.024)ⁿ",
        "n = 1 bei k, 2 bei M, 3 bei G, 4 bei T",
        "Byte in Bit = Byte × 8",
        "Bit in Byte = Bit ÷ 8",
        "Achtung: kB/MB/GB/TB sind dezimale Einheiten, KiB/MiB/GiB/TiB binäre - binär meint hier die 1.024er-Schritte, nicht das Zahlensystem.",
        "Merksatz: 1 Byte = 8 Bit."
      ],
      flow: [
        "Angabe mit Einheit",
        "dezimal (kB, MB, GB) oder binär (KiB, MiB, GiB)?",
        "n bestimmen: k = 1, M = 2, G = 3, T = 4",
        "× (1.000 ÷ 1.024)ⁿ",
        "Zielwert in der gesuchten Einheit"
      ],
      gen: function (v) {
        v = v || {};
        var variante = oder(v.variante, pick(["A", "B"]));

        /* --- Variante A: dezimal -> binär --- */
        if (variante === "A") {
          var p = oder(v.paar, pick(EINHEITEN_PAARE));
          var X = oder(v.X, p.n <= 2 ? rndInt(50, 999) : rndInt(1, 16));
          var dezByte = X * Math.pow(1000, p.n);
          var binByte = Math.pow(1024, p.n);
          var l = r2(dezByte / binByte);

          return {
            frage: (p.n <= 2
              ? "Eine Datei ist mit <b>" + fmt(X) + " " + p.dez + "</b> angegeben."
              : p.n === 3
                ? "Ein USB-Stick ist mit <b>" + fmt(X) + " " + p.dez + "</b> beschriftet."
                : "Eine Festplatte ist mit <b>" + fmt(X) + " " + p.dez + "</b> beschriftet."
            ) + " Wie viel zeigt das Betriebssystem in <b>" + p.bin + "</b> an? Auf 2 Nachkommastellen runden.",
            einheit: p.bin,
            loesung: l,
            pruef: "rel",
            schritte: [
              "Herstellerangabe ist dezimal: " + fmt(X) + " " + p.dez + " = " +
                fmt(X) + " * 1000^" + p.n + " Byte = " + fmt(dezByte) + " Byte",
              "Das Betriebssystem rechnet binär: 1 " + p.bin + " = 1024^" + p.n +
                " Byte = " + fmt(binByte) + " Byte",
              fmt(dezByte) + " Byte / " + fmt(binByte) + " = " + fmt(l) + " " + p.bin
            ],
            falle: "Hersteller rechnen dezimal (1000er-Schritte), Betriebssysteme binär (1024er-Schritte). " +
                   "Wer beide Systeme gleichsetzt, verschenkt genau die Differenz, über die sich alle wundern.",
            merk: "Je größer die Einheit, desto größer die Lücke (kB 2,4 % bis TB 9,1 %)."
          };
        }

        /* --- Variante B: Bit <-> Byte --- */
        var bb = oder(v.bb, pick(BITBYTE));
        var Y = oder(v.Y, rndInt(2, 512));
        var lb = r2(Y * bb.f);

        return {
          frage: "<b>" + fmt(Y) + " " + bb.von + "</b> in <b>" + bb.nach +
                 "</b> umrechnen.",
          einheit: bb.nach,
          loesung: lb,
          pruef: "rel",
          schritte: [
            "Umrechnungsweg: " + bb.weg,
            fmt(Y) + " " + bb.von + " " + (bb.f === 8 ? "* 8" : "/ 8") + " = " +
              fmt(lb) + " " + bb.nach
          ],
          falle: "Bit und Byte werden gerne verwechselt, weil sich nur die Groß-/Kleinschreibung unterscheidet. " +
                 "Der Faktor 8 fehlt dann komplett oder steht auf der falschen Seite.",
          merk: "Bit durch 8 ergibt Byte, Byte mal 8 ergibt Bit. Byte ist immer die kleinere Zahl."
        };
      }
    },

    /* ========= ÜBERTRAGUNGSZEIT (BIT-RATE) (Gruppe daten) ============ */
    zeit_bit: {
      label: "Übertragungszeit (Bit-Rate)",
      formeln: [
        "Datenmenge in Bit = GiB × 1024³ × 8",
        "Rate in Bit/s = Zahl × 10⁹ (bei Gbit/s) oder × 10⁶ (bei Mbit/s)",
        "Nutzbare Rate = Rate in Bit/s × Nutzanteil(%) ÷ 100",
        "Zeit (Sekunden) = AUFRUNDEN( Datenmenge in Bit ÷ nutzbare Rate )",
        "Achtung: GiB sind 1.024³ Byte, nicht 1.000³ - und die Byte müssen vor dem Teilen mit 8 auf Bit gebracht werden.",
        "Merksatz: Zeit = Datenmenge ÷ Geschwindigkeit."
      ],
      flow: [
        "Datenmenge",
        "in Bit umrechnen",
        "Geschwindigkeit",
        "in Bit/s umrechnen",
        "Nutzanteil berücksichtigen",
        "Datenmenge ÷ nutzbare Rate",
        "Sekunden",
        "AUFRUNDEN"
      ],
      gen: function (v) {
        v = v || {};
        var G = oder(v.G, rndInt(1, 50));
        var ss = oder(v.ss, pick(BIT_SS));
        var p = oder(v.p, pick([50, 60, 70, 80]));

        var D = G * Math.pow(1024, 3) * 8;
        var Rbit = zuBit(ss);
        var Reff = Rbit * p / 100;
        var t = auf(D / Reff);

        return {
          frage: "Wie lange dauert das Kopieren einer <b>" + fmt(G) +
                 " GiB</b>-Datei über <b>" + ss.name + "</b> (<b>" + fmt(ss.rate) +
                 " " + ss.einheit + "</b>), wenn nur <b>" + fmt(p) +
                 " %</b> der theoretischen Rate erreicht werden? Auf volle Sekunden aufrunden.",
          einheit: "s",
          loesung: t,
          pruef: "exakt",
          schritte: [
            "Datenmenge in Bit: " + fmt(G) + " GiB * 1024³ * 8 = " + fmt(D) + " Bit",
            "Theoretische Rate: " + fmt(ss.rate) + " " + ss.einheit + " = " +
              fmt(Rbit) + " Bit/s",
            "Nutzbare Rate: " + fmt(Rbit) + " Bit/s * " + fmt(p) + " % = " +
              fmt(Reff) + " Bit/s",
            "Zeit: " + fmt(D) + " Bit / " + fmt(Reff) + " Bit/s = " +
              fmt(r2(D / Reff)) + " s, aufgerundet " + fmt(t) + " s"
          ],
          falle: "GiB ist 1024³ Byte, nicht 1000³. Und die Byte müssen vor der Division noch mit 8 auf Bit gebracht werden, " +
                 "weil die Schnittstelle in Bit/s angegeben ist.",
          merk: "Übertragungszeit wird immer aufgerundet, nie kaufmännisch gerundet."
        };
      }
    },

    /* ======== ÜBERTRAGUNGSZEIT (BYTE-RATE) (Gruppe daten) ============ */
    zeit_byte: {
      label: "Übertragungszeit (Byte-Rate)",
      formeln: [
        "Datenmenge in MB = GiB × 1024³ ÷ 1.000²",
        "Zeit (Sekunden) = AUFRUNDEN( Datenmenge in MB ÷ Rate in MB/s )",
        "Mbit/s = Megabit pro Sekunde, MB/s = Megabyte pro Sekunde",
        "Achtung: MB/s ist eine BYTE-Rate - hier NICHT mit 8 multiplizieren.",
        "Merksatz: großes B = Byte, kleines b = Bit. Ein Buchstabe, Faktor 8."
      ],
      flow: [
        "Datenmenge in GiB",
        "in Byte umrechnen (× 1024³)",
        "in MB umrechnen (÷ 1.000²)",
        "÷ Rate in MB/s",
        "Sekunden",
        "AUFRUNDEN"
      ],
      gen: function (v) {
        v = v || {};
        var G = oder(v.G, rndInt(1, 50));
        var ss = oder(v.ss, pick(BYTE_SS));

        var D_MB = G * Math.pow(1024, 3) / Math.pow(1000, 2);
        var t = auf(D_MB / ss.rate);

        return {
          frage: "<b>" + fmt(G) + " GiB</b> über eine Schnittstelle mit <b>" +
                 fmt(ss.rate) + " MB/s</b> (" + ss.name +
                 "). Zeit in vollen Sekunden (aufrunden).",
          einheit: "s",
          loesung: t,
          pruef: "exakt",
          schritte: [
            "Datenmenge in MB: " + fmt(G) + " GiB * 1024³ / 1000² = " +
              fmt(r2(D_MB)) + " MB",
            "Zeit: " + fmt(r2(D_MB)) + " MB / " + fmt(ss.rate) + " MB/s = " +
              fmt(r2(D_MB / ss.rate)) + " s",
            "Aufgerundet: " + fmt(t) + " s"
          ],
          falle: "MB/s ist eine Byte-Rate, hier wird NICHT mit 8 multipliziert. " +
                 "Wer trotzdem mal 8 rechnet, landet beim achtfachen Ergebnis.",
          merk: "Großes B = Byte, kleines b = Bit. Ein Buchstabe, Faktor 8."
        };
      }
    },

    /* ============== FAKTOR-VERGLEICH (Gruppe daten) ================== */
    faktor: {
      label: "Faktor-Vergleich",
      formeln: [
        "Zuerst beide Raten auf dieselbe Einheit bringen: 1 Gbit/s = 1.000 Mbit/s",
        "Faktor = schnellere Rate ÷ langsamere Rate",
        "Beispiel: 2 Gbit/s = 2.000 Mbit/s, geteilt durch 500 Mbit/s ergibt Faktor 4",
        "Ergebnis: die schnellere Verbindung ist 4× so schnell.",
        "Achtung: beide Raten müssen VOR dem Teilen dieselbe Einheit haben."
      ],
      flow: [
        "Zwei Raten mit verschiedenen Einheiten",
        "beide auf dieselbe Einheit bringen (z. B. Mbit/s)",
        "schnellere Rate ÷ langsamere Rate",
        "Faktor"
      ],
      gen: function (v) {
        v = v || {};
        var paar = v.ss1 && v.ss2 ? [v.ss1, v.ss2] : pick2(BIT_SS);
        var a = paar[0];
        var b = paar[1];
        // die schnellere Schnittstelle steht immer vorn
        if (zuMbit(b) > zuMbit(a)) { var tmp = a; a = b; b = tmp; }

        var m1 = zuMbit(a);
        var m2 = zuMbit(b);
        var f = r2(m1 / m2);

        return {
          frage: "Um welchen Faktor ist <b>" + a.name + "</b> (" + fmt(a.rate) +
                 " " + a.einheit + ") schneller als <b>" + b.name + "</b> (" +
                 fmt(b.rate) + " " + b.einheit + ")?",
          einheit: "",
          loesung: f,
          pruef: "rel",
          schritte: [
            a.name + ": " + fmt(a.rate) + " " + a.einheit + " = " + fmt(m1) + " Mbit/s",
            b.name + ": " + fmt(b.rate) + " " + b.einheit + " = " + fmt(m2) + " Mbit/s",
            "Faktor: " + fmt(m1) + " / " + fmt(m2) + " = " + fmt(f)
          ],
          falle: "Vor dem Teilen die Einheiten angleichen. Gbit/s und Mbit/s unterscheiden sich um den Faktor 1000, " +
                 "wer das überspringt, ist um genau diesen Faktor daneben.",
          merk: "Erst gleiche Einheit, dann rechnen."
        };
      }
    },

    /* ====== BILD-/SCREENSHOT-DATENMENGE (Gruppe bild) ================ */
    bild_menge: {
      label: "Bild-/Screenshot-Datenmenge",
      formeln: [
        "Rohdaten (Byte) = Anzahl Bilder × Breite × Höhe × Byte pro Pixel",
        "Datenmenge (Byte) = Rohdaten × Komprimierung(%) ÷ 100",
        "Datenmenge in Bit = Datenmenge in Byte × 8",
        "Zeit (Sekunden) = AUFRUNDEN( Datenmenge in Bit ÷ Rate in Bit/s )",
        "Achtung: erst komprimieren, dann in Bit umrechnen - nicht umgekehrt.",
        "Merksatz: Idealfall bedeutet volle Rate, also kein Abschlag für den Nutzanteil."
      ],
      flow: [
        "Anzahl Bilder",
        "Breite × Höhe",
        "Pixelanzahl",
        "× Byte pro Pixel",
        "Rohdaten",
        "× Komprimierung",
        "Datenmenge",
        "× 8 ergibt Bit",
        "÷ Rate in Bit/s, dann AUFRUNDEN"
      ],
      gen: function (v) {
        v = v || {};
        var N = oder(v.N, rndInt(5000, 50000));
        var a = oder(v.aufl, pick(AUFLOESUNGEN));
        var byte = oder(v.byte, pick([2, 3, 4]));
        var k = oder(v.k, pick([20, 30, 40]));
        var paar = v.ss1 && v.ss2 ? [v.ss1, v.ss2] : pick2(BIT_SS);
        var ss1 = paar[0];
        var ss2 = paar[1];

        var roh = N * a.b * a.h * byte;
        var D = roh * k / 100;
        var Dbit = D * 8;
        var t1 = auf(Dbit / zuBit(ss1));
        var t2 = auf(Dbit / zuBit(ss2));

        return {
          frage: "<b>" + fmt(N) + "</b> Bilder mit <b>" + a.b + "x" + a.h +
                 "</b> Pixel (" + a.name + "), <b>" + fmt(byte) +
                 " Byte/Pixel</b>, als JPG auf <b>" + fmt(k) +
                 " %</b> komprimiert. Wie lange dauert die Übertragung im Idealfall über <b>" +
                 ss1.name + "</b> und über <b>" + ss2.name + "</b>?",
          teile: [
            { label: "a) " + ss1.name, einheit: "s", loesung: t1, pruef: "exakt" },
            { label: "b) " + ss2.name, einheit: "s", loesung: t2, pruef: "exakt" }
          ],
          schritte: [
            "Rohdatenmenge: " + fmt(N) + " * " + a.b + " * " + a.h +
              " * " + fmt(byte) + " Byte = " + fmt(roh) + " Byte",
            "Nach Komprimierung auf " + fmt(k) + " %: " + fmt(roh) + " Byte * " +
              fmt(k) + " % = " + fmt(D) + " Byte",
            "In Bit: " + fmt(D) + " Byte * 8 = " + fmt(Dbit) + " Bit",
            "a) " + ss1.name + ": " + fmt(Dbit) + " Bit / " + fmt(zuBit(ss1)) +
              " Bit/s = " + fmt(r2(Dbit / zuBit(ss1))) + " s, aufgerundet " + fmt(t1) + " s",
            "b) " + ss2.name + ": " + fmt(Dbit) + " Bit / " + fmt(zuBit(ss2)) +
              " Bit/s = " + fmt(r2(Dbit / zuBit(ss2))) + " s, aufgerundet " + fmt(t2) + " s"
          ],
          falle: "Erst komprimieren, dann auf Bit umrechnen. Nicht umgekehrt. " +
                 "Wer zuerst mal 8 rechnet und dann den Kompressionsfaktor vergisst, liegt um ein Vielfaches daneben.",
          merk: "Idealfall heißt volle Rate, kein Auslastungsabschlag."
        };
      }
    },

    /* =========== SCANNER-DATENMENGE (dpi) (Gruppe bild) ============== */
    scanner: {
      label: "Scanner-Datenmenge (dpi)",
      formeln: [
        "dpi = dots per inch = Bildpunkte pro Zoll",
        "Schritt 1 - Zoll = Zentimeter ÷ 2,54 (ZWINGEND auf 2 Nachkommastellen runden)",
        "Schritt 2 - Breite in Pixel = Breite in Zoll × dpi",
        "Schritt 2 - Höhe in Pixel = Höhe in Zoll × dpi",
        "Schritt 3 - Pixel je Bild = Breite in Pixel × Höhe in Pixel",
        "Schritt 4 - Datenmenge (Byte) = Anzahl Bilder × Pixel je Bild × Bit pro Pixel ÷ 8",
        "Schritt 5 - Datenmenge in GB = Byte ÷ 10⁹",
        "Schritt 6 - Endgröße = GB × Komprimierung(%) ÷ 100",
        "Schritt 7 - Nutzbare Rate (GB/s) = Rate in Bit/s × Nutzanteil(%) ÷ 100 ÷ 8 ÷ 10⁹",
        "Schritt 8 - Zeit (Sekunden) = AUFRUNDEN( Endgröße ÷ nutzbare Rate )",
        "Achtung: die Zwischenrundung auf 2 Nachkommastellen gehört in Schritt 1 - danach wird durchgerechnet.",
        "Merksatz: doppelte dpi bedeuten vierfache Datenmenge, weil Breite UND Höhe wachsen."
      ],
      flow: [
        "Papiergröße in cm",
        "cm in Zoll (÷ 2,54, auf 2 Nachkommastellen runden)",
        "Zoll × dpi",
        "Pixel je Bild",
        "× Bit pro Pixel ÷ 8",
        "Datenmenge in Byte",
        "÷ 10⁹ ergibt GB, dann × Komprimierung",
        "÷ nutzbare Rate, dann AUFRUNDEN"
      ],
      gen: function (v) {
        v = v || {};
        var N = oder(v.N, rndInt(1000, 10000));
        var f = oder(v.format, pick(SCAN_FORMATE));
        var dpi = oder(v.dpi, pick([150, 300, 600]));
        var bit = oder(v.bit, pick([8, 24, 32]));
        var p = oder(v.p, pick([50, 60, 70, 80]));
        var k = oder(v.k, pick([20, 30, 40]));
        var ss = oder(v.ss, pick(BIT_SS));

        // erst runden, dann weiterrechnen - die Zwischenrundung gehoert hierhin
        var b_zoll = r2(f[0] / 2.54);
        var h_zoll = r2(f[1] / 2.54);
        var pxB = b_zoll * dpi;
        var pxH = h_zoll * dpi;
        var pixel = pxB * pxH;

        var D = N * pixel * bit / 8;
        var GB = D / 1e9;
        var Dk = GB * k / 100;
        var rate = (zuBit(ss) * p / 100) / 8 / 1e9;
        var t = auf(Dk / rate);

        return {
          frage: "<b>" + fmt(N) + "</b> Fotos im Format <b>" + fmt(f[0]) + "x" +
                 fmt(f[1]) + " cm</b> werden mit <b>" + fmt(dpi) +
                 " dpi</b> und einer Farbtiefe von <b>" + fmt(bit) +
                 " Bit/Pixel</b> eingescannt. a) Wie groß ist die Datenmenge in GB? " +
                 "b) Wie lange dauert die Übertragung über <b>" + ss.name + "</b> (<b>" +
                 fmt(ss.rate) + " " + ss.einheit + "</b>), wenn <b>" + fmt(p) +
                 " %</b> nutzbar sind und die Bilder als JPG auf <b>" + fmt(k) +
                 " %</b> komprimiert werden?",
          teile: [
            { label: "a) Datenmenge", einheit: "GB", loesung: r2(GB), pruef: "rel" },
            { label: "b) Übertragungszeit", einheit: "s", loesung: t, pruef: "exakt" }
          ],
          schritte: [
            "cm in Zoll, auf 2 Nachkommastellen gerundet: " + fmt(f[0]) + " cm / 2,54 = " +
              fmt(b_zoll) + " Zoll, " + fmt(f[1]) + " cm / 2,54 = " + fmt(h_zoll) + " Zoll",
            "Pixel je Foto: (" + fmt(b_zoll) + " * " + fmt(dpi) + ") * (" + fmt(h_zoll) +
              " * " + fmt(dpi) + ") = " + fmt(pxB) + " * " + fmt(pxH) + " = " + fmt(pixel) + " Pixel",
            "a) Datenmenge: " + fmt(N) + " * " + fmt(pixel) + " Pixel * " + fmt(bit) +
              " Bit / 8 = " + fmt(D) + " Byte = " + fmt(r2(GB)) + " GB",
            "Nach Komprimierung auf " + fmt(k) + " %: " + fmt(r2(GB)) + " GB * " +
              fmt(k) + " % = " + fmt(r2(Dk)) + " GB",
            "Nutzbare Rate: " + fmt(ss.rate) + " " + ss.einheit + " * " + fmt(p) +
              " % / 8 = " + fmt(rate) + " GB/s",
            "b) Zeit: " + fmt(r2(Dk)) + " GB / " + fmt(rate) + " GB/s = " +
              fmt(r2(Dk / rate)) + " s, aufgerundet " + fmt(t) + " s"
          ],
          falle: "cm müssen durch 2,54 geteilt werden. dpi wirkt quadratisch, weil Breite und Höhe " +
                 "beide damit multipliziert werden - doppelte dpi sind deshalb nicht doppelt so viele Daten.",
          merk: "Doppelte dpi bedeutet vierfache Datenmenge."
        };
      }
    },

    /* ====== PIXELZAHL & SEITENVERHÄLTNIS (Gruppe bild) =============== */
    pixel: {
      label: "Pixelzahl & Seitenverhältnis",
      formeln: [
        "Pixel gesamt = Breite × Höhe",
        "ggT = größter gemeinsamer Teiler von Breite und Höhe (euklidischer Algorithmus)",
        "Seitenverhältnis = (Breite ÷ ggT) : (Höhe ÷ ggT)",
        "Beispiel: 1920 × 1080, ggT = 120",
        "Beispiel: 1920 ÷ 120 = 16 und 1080 ÷ 120 = 9, also 16 : 9",
        "Merksatz: das Seitenverhältnis immer mit dem ggT kürzen, nie ungekürzt stehen lassen."
      ],
      flow: [
        "Auflösung Breite × Höhe",
        "Breite × Höhe ergibt Pixel gesamt",
        "ggT von Breite und Höhe bestimmen",
        "beide Werte ÷ ggT",
        "Seitenverhältnis als B : H"
      ],
      gen: function (v) {
        v = v || {};
        var a = oder(v.aufl, pick(AUFLOESUNGEN));
        var px = a.b * a.h;
        var g = ggT(a.b, a.h);
        var verh = (a.b / g) + ":" + (a.h / g);

        return {
          frage: "Ein Monitor hat die Auflösung <b>" + a.b + "x" + a.h +
                 "</b> (" + a.name + "). a) Wie viele Pixel sind das insgesamt? " +
                 "b) Welches Seitenverhältnis ergibt sich (gekürzt, Form B:H)?",
          teile: [
            { label: "a) Pixel gesamt", einheit: "Pixel", loesung: px, pruef: "exakt" },
            { label: "b) Seitenverhältnis", einheit: "", loesung: verh, pruef: "text" }
          ],
          schritte: [
            "a) Pixel gesamt: " + a.b + " * " + a.h + " = " + fmt(px) + " Pixel",
            "b) größter gemeinsamer Teiler von " + a.b + " und " + a.h +
              " (euklidischer Algorithmus): " + g,
            "b) kürzen: " + a.b + " / " + g + " : " + a.h + " / " + g + " = " + verh
          ],
          falle: "Das Seitenverhältnis nicht ungekürzt stehen lassen. " +
                 "1920:1080 ist rechnerisch richtig, gefragt ist aber die gekürzte Form.",
          merk: "Mit dem größten gemeinsamen Teiler kürzen."
        };
      }
    },

    /* ============== STROMKOSTEN PRO MONAT (Gruppe strom) ============= */
    stromkosten: {
      label: "Stromkosten pro Monat",
      formeln: [
        "Leistung in Kilowatt = Leistung in Watt ÷ 1.000",
        "Verbrauch (kWh) = Leistung in kW × Stunden pro Tag × Tage im Monat",
        "Kosten (EUR) = Verbrauch in kWh × Preis in ct/kWh ÷ 100",
        "Monatslänge: 30 Tage, 31 Tage oder 30,42 Tage (Jahresdurchschnitt = 365 ÷ 12)",
        "Achtung: zwei Umrechnungen, die gern untergehen - Watt ÷ 1.000 ergibt Kilowatt, Cent ÷ 100 ergibt Euro.",
        "Merksatz: erst kW, dann kWh, dann Euro."
      ],
      flow: [
        "Leistung in Watt",
        "÷ 1.000 ergibt Leistung in kW",
        "× Stunden pro Tag",
        "× Tage im Monat",
        "Verbrauch in kWh",
        "× Strompreis in ct/kWh ÷ 100",
        "Kosten in EUR"
      ],
      gen: function (v) {
        v = v || {};
        var g = oder(v.geraet, pick(GERAETE));
        var h = oder(v.h, rndInt(4, 14));
        var d = oder(v.d, pick(MONATSTAGE));
        var preis = oder(v.preis, pick(STROMPREIS));

        var kWh = g.watt / 1000 * h * d;
        var kosten = r2(kWh * preis / 100);

        return {
          frage: "Ein <b>" + g.name + "</b> mit <b>" + fmt(g.watt) +
                 " W</b> läuft <b>" + fmt(h) + " Stunden am Tag</b> an <b>" +
                 fmt(d) + " Tagen im Monat</b>. Der Arbeitspreis beträgt <b>" +
                 fmt(preis) + " ct/kWh</b>. Wie hoch sind die Stromkosten pro Monat?",
          einheit: "EUR",
          loesung: kosten,
          pruef: "geld",
          schritte: [
            "Leistung in Kilowatt: " + fmt(g.watt) + " W / 1000 = " +
              fmt(g.watt / 1000) + " kW",
            "Verbrauch: " + fmt(g.watt / 1000) + " kW * " + fmt(h) + " h * " +
              fmt(d) + " Tage = " + fmt(r2(kWh)) + " kWh",
            "Kosten: " + fmt(r2(kWh)) + " kWh * " + fmt(preis) + " ct = " +
              fmt(r2(kWh * preis)) + " ct = " + euro(kosten) + " EUR"
          ],
          falle: "Zwei Umrechnungen, die gern untergehen: Watt durch 1000 ergibt Kilowatt, " +
                 "und Cent durch 100 ergibt Euro. Wer eine davon vergisst, liegt um Faktor 1000 oder 100 daneben.",
          merk: "Erst kW, dann kWh, dann Euro."
        };
      }
    },

    /* ========= JAHRESVERBRAUCH UND -KOSTEN (Gruppe strom) ============ */
    strom_jahr: {
      label: "Jahresverbrauch & -kosten",
      formeln: [
        "Verbrauch (kWh pro Jahr) = Anzahl Geräte × Leistung in Watt ÷ 1.000 × Stunden pro Tag × 365",
        "Kosten (EUR pro Jahr) = Verbrauch in kWh × Preis in ct/kWh ÷ 100",
        "Merksatz: Dauerbetrieb bedeutet 24 Stunden pro Tag, also 8.760 Stunden im Jahr."
      ],
      flow: [
        "Anzahl Geräte",
        "× Leistung in Watt ÷ 1.000",
        "× Stunden pro Tag",
        "× 365 Tage",
        "Verbrauch in kWh pro Jahr",
        "× Strompreis in ct/kWh ÷ 100",
        "Kosten in EUR pro Jahr"
      ],
      gen: function (v) {
        v = v || {};
        var n = oder(v.n, rndInt(5, 40));
        var g = oder(v.geraet, pick(GERAETE));
        var h = oder(v.h, pick([8, 10, 12, 24]));
        var preis = oder(v.preis, pick(STROMPREIS));

        var kWh = n * g.watt / 1000 * h * 365;
        var kosten = r2(kWh * preis / 100);

        return {
          frage: "In einem Betrieb laufen <b>" + fmt(n) + "</b> Geräte vom Typ <b>" +
                 g.name + "</b> (je <b>" + fmt(g.watt) + " W</b>) an <b>365 Tagen</b> " +
                 "jeweils <b>" + fmt(h) + " Stunden</b> täglich. Der Arbeitspreis liegt bei <b>" +
                 fmt(preis) + " ct/kWh</b>. a) Wie viel kWh verbrauchen sie im Jahr? " +
                 "b) Welche Kosten entstehen dadurch?",
          teile: [
            { label: "a) Verbrauch", einheit: "kWh", loesung: r2(kWh), pruef: "rel" },
            { label: "b) Kosten", einheit: "EUR", loesung: kosten, pruef: "geld" }
          ],
          schritte: [
            "Leistung aller Geräte: " + fmt(n) + " * " + fmt(g.watt) + " W = " +
              fmt(n * g.watt) + " W = " + fmt(n * g.watt / 1000) + " kW",
            "Betriebsstunden im Jahr: " + fmt(h) + " h * 365 = " + fmt(h * 365) + " h",
            "a) Verbrauch: " + fmt(n * g.watt / 1000) + " kW * " + fmt(h * 365) +
              " h = " + fmt(r2(kWh)) + " kWh",
            "b) Kosten: " + fmt(r2(kWh)) + " kWh * " + fmt(preis) + " ct / 100 = " +
              euro(kosten) + " EUR"
          ],
          falle: "Die Stückzahl gehört mit in die Rechnung. Ein Gerät allein verbraucht " +
                 "wenig, die Summe über alle Geräte und das ganze Jahr ist der eigentliche Posten.",
          merk: "Stückzahl mal Leistung mal Stunden - erst danach der Preis."
        };
      }
    },

    /* ====== SPARPOTENZIAL BEIM GERAETETAUSCH (Gruppe strom) ========== */
    sparen: {
      label: "Sparpotenzial beim Gerätetausch",
      formeln: [
        "Eingesparte Leistung (Watt) = Leistung alt - Leistung neu",
        "Eingesparte Energie (kWh pro Jahr) = eingesparte Leistung ÷ 1.000 × Stunden pro Tag × 365",
        "Ersparnis (EUR pro Jahr) = eingesparte kWh × Preis in ct/kWh ÷ 100",
        "Achtung: gerechnet wird mit der DIFFERENZ, nicht mit der Leistung des neuen Geräts."
      ],
      flow: [
        "Leistung alt",
        "minus Leistung neu",
        "eingesparte Watt",
        "÷ 1.000 × Stunden pro Tag × 365",
        "eingesparte kWh pro Jahr",
        "× Strompreis ÷ 100",
        "Ersparnis in EUR pro Jahr"
      ],
      gen: function (v) {
        v = v || {};
        var alt = oder(v.alt, rndInt(180, 400));
        var neu = oder(v.neu, rndInt(30, 120));
        var h = oder(v.h, rndInt(6, 12));
        var preis = oder(v.preis, pick(STROMPREIS));

        var dP = alt - neu;
        var kWh = dP / 1000 * h * 365;
        var ersparnis = r2(kWh * preis / 100);

        return {
          frage: "Ein Altgerät mit <b>" + fmt(alt) + " W</b> wird durch ein neues mit <b>" +
                 fmt(neu) + " W</b> ersetzt. Es läuft <b>" + fmt(h) +
                 " Stunden täglich</b> an 365 Tagen, der Arbeitspreis beträgt <b>" +
                 fmt(preis) + " ct/kWh</b>. Wie viel Euro spart der Tausch pro Jahr?",
          einheit: "EUR",
          loesung: ersparnis,
          pruef: "geld",
          schritte: [
            "Eingesparte Leistung: " + fmt(alt) + " W - " + fmt(neu) + " W = " + fmt(dP) + " W",
            "Eingesparte Energie: " + fmt(dP / 1000) + " kW * " + fmt(h) + " h * 365 = " +
              fmt(r2(kWh)) + " kWh",
            "Ersparnis: " + fmt(r2(kWh)) + " kWh * " + fmt(preis) + " ct / 100 = " +
              euro(ersparnis) + " EUR pro Jahr"
          ],
          falle: "Gerechnet wird mit der DIFFERENZ der Leistungen, nicht mit der Leistung " +
                 "des neuen Geräts. Gefragt ist die Ersparnis, nicht der neue Verbrauch.",
          merk: "Erst die Differenz bilden, dann hochrechnen."
        };
      }
    },

    /* ============ AMORTISATIONSZEIT (Gruppe wirtschaft) ============== */
    amortisation: {
      label: "Amortisationszeit",
      formeln: [
        "Amortisation bedeutet: ab wann hat die Ersparnis den Mehrpreis ausgeglichen?",
        "Zeit (Monate) = AUFRUNDEN( Mehrpreis ÷ Ersparnis pro Monat )",
        "Zeit (Jahre) = Monate ÷ 12",
        "Achtung: es wird immer AUFGERUNDET - nach 8,3 Monaten ist der Mehrpreis noch nicht wieder drin.",
        "Merksatz: amortisiert ist die Anschaffung, sobald die Summe der Ersparnisse den Mehrpreis erreicht."
      ],
      flow: [
        "Mehrpreis der teureren Variante",
        "÷ Ersparnis pro Monat",
        "Monate (Zwischenwert mit Nachkommastellen)",
        "AUFRUNDEN auf volle Monate",
        "÷ 12 ergibt Jahre"
      ],
      gen: function (v) {
        v = v || {};
        var mehr = oder(v.mehr, rndInt(200, 1500));
        var spar = oder(v.spar, rndInt(15, 90));

        var monate = auf(mehr / spar);

        return {
          frage: "Eine sparsamere Anlage kostet <b>" + euro(mehr) +
                 " EUR</b> mehr als die Standardvariante, senkt die laufenden Kosten aber um <b>" +
                 euro(spar) + " EUR pro Monat</b>. Nach wie vielen vollen Monaten hat sie " +
                 "sich amortisiert?",
          einheit: "Monate",
          loesung: monate,
          pruef: "exakt",
          schritte: [
            "Mehrpreis: " + euro(mehr) + " EUR",
            "Monatliche Ersparnis: " + euro(spar) + " EUR",
            "Rechnung: " + euro(mehr) + " / " + euro(spar) + " = " +
              fmt(r2(mehr / spar)) + " Monate",
            "Aufgerundet auf volle Monate: " + fmt(monate) + " Monate " +
              "(entspricht rund " + fmt(r2(monate / 12)) + " Jahren)"
          ],
          falle: "Es wird immer aufgerundet. Nach 8,3 Monaten ist der Mehrpreis noch nicht " +
                 "wieder drin, erst der neunte Monat bringt die Anschaffung ins Plus.",
          merk: "Amortisation immer aufrunden, nie kaufmännisch runden."
        };
      }
    },

    /* ============== GESAMTKOSTEN / TCO (Gruppe wirtschaft) =========== */
    tco: {
      label: "Gesamtkosten (TCO)",
      formeln: [
        "TCO = Total Cost of Ownership = Gesamtkosten über den gesamten Nutzungszeitraum",
        "Betriebskosten = Kosten pro Monat × 12 × Jahre",
        "TCO = Anschaffungspreis + Betriebskosten",
        "TCO pro Jahr = TCO ÷ Jahre",
        "Merksatz: der Kaufpreis ist nur ein Teil - über die Laufzeit übersteigen die Betriebskosten ihn oft deutlich."
      ],
      flow: [
        "Anschaffungspreis (einmalig)",
        "Kosten pro Monat × 12 × Jahre",
        "Betriebskosten",
        "Anschaffung + Betriebskosten",
        "TCO",
        "÷ Jahre ergibt TCO pro Jahr"
      ],
      gen: function (v) {
        v = v || {};
        var ansch = oder(v.ansch, rndInt(800, 4000));
        var monat = oder(v.monat, rndInt(20, 150));
        var jahre = oder(v.jahre, pick([3, 4, 5]));

        var betrieb = monat * 12 * jahre;
        var gesamt = ansch + betrieb;

        return {
          frage: "Ein Gerät kostet in der Anschaffung <b>" + euro(ansch) +
                 " EUR</b>. Für Wartung, Strom und Verbrauchsmaterial fallen <b>" +
                 euro(monat) + " EUR im Monat</b> an. a) Wie hoch sind die Betriebskosten " +
                 "über <b>" + fmt(jahre) + " Jahre</b>? b) Wie hoch sind die Gesamtkosten (TCO)?",
          teile: [
            { label: "a) Betriebskosten", einheit: "EUR", loesung: r2(betrieb), pruef: "geld" },
            { label: "b) TCO", einheit: "EUR", loesung: r2(gesamt), pruef: "geld" }
          ],
          schritte: [
            "Laufzeit in Monaten: " + fmt(jahre) + " Jahre * 12 = " + fmt(jahre * 12) + " Monate",
            "a) Betriebskosten: " + euro(monat) + " EUR * " + fmt(jahre * 12) + " = " +
              euro(betrieb) + " EUR",
            "b) TCO: " + euro(ansch) + " EUR + " + euro(betrieb) + " EUR = " +
              euro(gesamt) + " EUR",
            "Zum Vergleich pro Jahr: " + euro(gesamt) + " / " + fmt(jahre) + " = " +
              euro(gesamt / jahre) + " EUR"
          ],
          falle: "Der Anschaffungspreis ist nur ein Teil. Über die Laufzeit übersteigen die " +
                 "Betriebskosten ihn oft deutlich - genau darum wird nach der TCO gefragt.",
          merk: "TCO = einmalige Kosten plus alle laufenden Kosten der Nutzungsdauer."
        };
      }
    },

    /* ============= KAUF ODER LEASING (Gruppe wirtschaft) ============= */
    kauf_leasing: {
      label: "Kauf oder Leasing",
      formeln: [
        "Kauf: Gesamtkosten = Kaufpreis",
        "Leasing: Gesamtkosten = Rate pro Monat × Laufzeit in Monaten",
        "Differenz = Betrag von (Leasingkosten - Kaufpreis)",
        "Achtung: die Monatsrate wirkt klein - erst Rate mal Laufzeit ist mit dem Kaufpreis vergleichbar.",
        "Merksatz: günstiger ist die Variante mit der kleineren Gesamtsumme."
      ],
      flow: [
        "Kaufpreis (einmalig)",
        "Rate pro Monat × Laufzeit in Monaten",
        "Leasingkosten gesamt",
        "Betrag der Differenz beider Summen",
        "kleinere Gesamtsumme ist günstiger"
      ],
      gen: function (v) {
        v = v || {};
        var kauf = oder(v.kauf, rndInt(1200, 5000));
        var rate = oder(v.rate, rndInt(40, 160));
        var monate = oder(v.monate, pick([24, 36, 48]));

        var leasing = rate * monate;
        var diff = r2(Math.abs(leasing - kauf));
        var guenstiger = leasing < kauf ? "Leasing" : "Kauf";

        return {
          frage: "Ein Server kostet im Kauf <b>" + euro(kauf) +
                 " EUR</b>. Alternativ wird er für <b>" + euro(rate) +
                 " EUR im Monat</b> über <b>" + fmt(monate) +
                 " Monate</b> geleast. a) Wie hoch sind die Leasingkosten insgesamt? " +
                 "b) Wie groß ist die Differenz zum Kaufpreis?",
          teile: [
            { label: "a) Leasing gesamt", einheit: "EUR", loesung: r2(leasing), pruef: "geld" },
            { label: "b) Differenz", einheit: "EUR", loesung: diff, pruef: "geld" }
          ],
          schritte: [
            "a) Leasingkosten: " + euro(rate) + " EUR * " + fmt(monate) + " Monate = " +
              euro(leasing) + " EUR",
            "b) Differenz: " + euro(leasing) + " EUR - " + euro(kauf) + " EUR = " +
              euro(leasing - kauf) + " EUR",
            "Betrag der Differenz: " + euro(diff) + " EUR",
            "Rein rechnerisch günstiger: " + guenstiger
          ],
          falle: "Die Monatsrate wirkt klein, die Laufzeit macht sie groß. Erst die Rate mal " +
                 "der Laufzeit ergibt eine Zahl, die mit dem Kaufpreis vergleichbar ist.",
          merk: "Rate mal Laufzeit - vorher ist kein Vergleich möglich."
        };
      }
    },

    /* ============ NETZTEIL DIMENSIONIEREN (Gruppe netzteil) ========== */
    netzteil_dimension: {
      label: "Netzteil dimensionieren",
      formeln: [
        "Je Komponente: Leistung = Anzahl × Leistung in Watt",
        "Gesamtleistung = Summe aller Komponenten (CPU, GPU, Mainboard, RAM, SSD, Lüfter, weitere)",
        "Nötige Leistung = Gesamtleistung × (1 + Reserve(%) ÷ 100)",
        "Ergebnis AUFRUNDEN auf volle Watt.",
        "Achtung: ein Netzteil sollte nicht dauerhaft an seiner maximalen Leistung laufen - die Reserve wird aufgeschlagen, nicht abgezogen.",
        "Merksatz: Summe bilden, Reserve draufschlagen, aufrunden."
      ],
      flow: [
        "CPU + GPU + Mainboard + RAM + SSD + Lüfter + weitere",
        "je Komponente: Anzahl × Leistung",
        "Gesamtleistung in Watt",
        "× (1 + Reserve ÷ 100)",
        "AUFRUNDEN",
        "nötige Netzteilleistung"
      ],
      gen: function (v) {
        v = v || {};
        var reserve = oder(v.reserve, pick([20, 25, 30]));
        var liste = oder(v.liste, KOMPONENTEN.map(function (k) {
          return { name: k.name, watt: k.watt, anzahl: rndInt(k.min, k.max) };
        }).filter(function (k) { return k.anzahl > 0; }));

        var summe = 0;
        var text = [];
        var rechnung = [];
        liste.forEach(function (k) {
          summe += k.anzahl * k.watt;
          text.push(k.anzahl + "x " + k.name + " (" + fmt(k.watt) + " W)");
          rechnung.push(k.anzahl + " * " + fmt(k.watt));
        });

        var noetig = auf(summe * (1 + reserve / 100));

        return {
          frage: "Ein PC wird aus folgenden Komponenten aufgebaut: <b>" +
                 text.join(", ") + "</b>. Es sollen <b>" + fmt(reserve) +
                 " %</b> Leistungsreserve eingeplant werden. Wie viel Watt muss das " +
                 "Netzteil mindestens liefern? Auf volle Watt aufrunden.",
          einheit: "W",
          loesung: noetig,
          pruef: "exakt",
          schritte: [
            "Summe der Komponenten: " + rechnung.join(" + ") + " = " + fmt(summe) + " W",
            "Reserve aufschlagen: " + fmt(summe) + " W * " + fmt(100 + reserve) + " % = " +
              fmt(r2(summe * (1 + reserve / 100))) + " W",
            "Aufgerundet: " + fmt(noetig) + " W"
          ],
          falle: "Die Reserve wird auf die Summe aufgeschlagen, nicht von ihr abgezogen. " +
                 "Und aufgerundet wird immer - ein zu knappes Netzteil schaltet unter Last ab.",
          merk: "Summe bilden, Reserve draufschlagen, aufrunden."
        };
      }
    },

    /* ====== WIRKUNGSGRAD & VERLUSTLEISTUNG (Gruppe netzteil) ========= */
    wirkungsgrad: {
      label: "Wirkungsgrad & Verlustleistung",
      formeln: [
        "Aufgenommene Leistung = abgegebene Leistung ÷ (Wirkungsgrad(%) ÷ 100)",
        "Verlustleistung = aufgenommene Leistung - abgegebene Leistung",
        "Wirkungsgrad (%) = abgegebene Leistung ÷ aufgenommene Leistung × 100",
        "Die Verlustleistung geht als Wärme verloren.",
        "Achtung: es wird GETEILT, nicht multipliziert - die aufgenommene Leistung ist immer größer als die abgegebene.",
        "Merksatz: Aufnahme = Abgabe geteilt durch Wirkungsgrad."
      ],
      flow: [
        "aufgenommene Leistung aus dem Netz",
        "Gerät (Netzteil)",
        "Nutzleistung an die Komponenten",
        "Verlustleistung = Aufnahme - Abgabe",
        "Verlust wird zu Wärme"
      ],
      gen: function (v) {
        v = v || {};
        var eta = oder(v.eta, pick(WIRKUNGSGRAD));
        var pAb = oder(v.pAb, rndInt(150, 650));

        var pZu = r2(pAb / (eta / 100));
        var verlust = r2(pZu - pAb);

        return {
          frage: "Ein Netzteil gibt <b>" + fmt(pAb) +
                 " W</b> an die Komponenten ab und arbeitet mit einem Wirkungsgrad von <b>" +
                 fmt(eta) + " %</b>. a) Wie viel Leistung nimmt es aus dem Netz auf? " +
                 "b) Wie viel davon geht als Wärme verloren?",
          teile: [
            { label: "a) Aufnahme", einheit: "W", loesung: pZu, pruef: "rel" },
            { label: "b) Verlust", einheit: "W", loesung: verlust, pruef: "rel" }
          ],
          schritte: [
            "a) Aufgenommene Leistung: " + fmt(pAb) + " W / " + fmt(eta) + " % = " +
              fmt(pAb) + " / " + fmt(eta / 100) + " = " + fmt(pZu) + " W",
            "b) Verlustleistung: " + fmt(pZu) + " W - " + fmt(pAb) + " W = " +
              fmt(verlust) + " W",
            "Gegenprobe: " + fmt(pAb) + " / " + fmt(pZu) + " * 100 = " +
              fmt(r2(pAb / pZu * 100)) + " %"
          ],
          falle: "Geteilt wird, nicht multipliziert. Die aufgenommene Leistung ist immer " +
                 "GRÖSSER als die abgegebene - wer mal 0,9 rechnet statt durch 0,9, dreht das um.",
          merk: "Aufnahme = Abgabe geteilt durch Wirkungsgrad."
        };
      }
    },

    /* ========== ERLAUBTE AUSFALLZEIT (Gruppe verfuegbar) ============= */
    ausfallzeit: {
      label: "Erlaubte Ausfallzeit",
      formeln: [
        "Ausfall (%) = 100 - Verfügbarkeit (%)",
        "Ausfallzeit = Zeitraum × Ausfall(%) ÷ 100",
        "Ausfallzeit in Minuten = Ausfallzeit in Stunden × 60",
        "Zeiträume: Jahr = 8.760 h, Monat (30 Tage) = 720 h, Woche = 168 h",
        "Achtung: gerechnet wird mit dem AUSFALLanteil, nicht mit der Verfügbarkeit.",
        "Merksatz: erst 100 % minus Verfügbarkeit, dann mal den Zeitraum."
      ],
      flow: [
        "vereinbarte Verfügbarkeit in %",
        "100 % minus Verfügbarkeit",
        "Ausfall in %",
        "× Zeitraum in Stunden ÷ 100",
        "Ausfallzeit in Stunden",
        "× 60 ergibt Minuten"
      ],
      gen: function (v) {
        v = v || {};
        var a = oder(v.a, pick(VERFUEGBARKEIT));
        var z = oder(v.zeitraum, pick(ZEITRAEUME));

        var stunden = z.stunden * (100 - a) / 100;
        var minuten = r2(stunden * 60);

        return {
          frage: "Für ein System ist eine Verfügbarkeit von <b>" + fmt(a) +
                 " %</b> vereinbart. Wie viele Minuten darf es pro <b>" + z.name +
                 "</b> maximal ausfallen?",
          einheit: "min",
          loesung: minuten,
          pruef: "rel",
          schritte: [
            "Ausfallanteil: 100 % - " + fmt(a) + " % = " + fmt(r2(100 - a)) + " %",
            "Zeitraum " + z.name + ": " + fmt(z.stunden) + " Stunden",
            "Ausfallzeit: " + fmt(z.stunden) + " h * " + fmt(r2(100 - a)) + " % = " +
              fmt(r2(stunden)) + " h",
            "In Minuten: " + fmt(r2(stunden)) + " h * 60 = " + fmt(minuten) + " min"
          ],
          falle: "Gerechnet wird mit dem AUSFALLanteil, nicht mit der Verfügbarkeit. " +
                 "Bei 99,9 % sind das 0,1 % - der kleine Rest ist die gesuchte Größe.",
          merk: "Erst 100 % minus Verfügbarkeit, dann mal den Zeitraum."
        };
      }
    },

    /* ====== VERFUEGBARKEIT AUS MTBF UND MTTR (Gruppe verfuegbar) ===== */
    mtbf: {
      label: "Verfügbarkeit aus MTBF und MTTR",
      formeln: [
        "MTBF = Mean Time Between Failures = mittlere Betriebsdauer zwischen zwei Ausfällen",
        "MTTR = Mean Time To Repair = mittlere Reparaturdauer",
        "Verfügbarkeit (%) = MTBF ÷ (MTBF + MTTR) × 100",
        "Achtung: im Nenner steht die SUMME aus MTBF und MTTR, nicht die MTBF allein - sonst käme immer 100 % heraus.",
        "Merksatz: Betriebszeit geteilt durch Betriebszeit plus Reparaturzeit."
      ],
      flow: [
        "MTBF (Betriebsdauer zwischen Ausfällen)",
        "MTTR (Reparaturdauer)",
        "Gesamtzeit = MTBF + MTTR",
        "MTBF ÷ Gesamtzeit",
        "× 100 ergibt Verfügbarkeit in %"
      ],
      gen: function (v) {
        v = v || {};
        var mtbf = oder(v.mtbf, rndInt(2000, 20000));
        var mttr = oder(v.mttr, pick([2, 4, 6, 8, 12, 24]));

        var verf = r2(mtbf / (mtbf + mttr) * 100);

        return {
          frage: "Ein Gerät hat eine <b>MTBF von " + fmt(mtbf) +
                 " Stunden</b> und eine <b>MTTR von " + fmt(mttr) +
                 " Stunden</b>. Wie hoch ist die Verfügbarkeit in Prozent? " +
                 "Auf 2 Nachkommastellen runden.",
          einheit: "%",
          loesung: verf,
          pruef: "rel",
          schritte: [
            "Gesamtzeit: MTBF + MTTR = " + fmt(mtbf) + " h + " + fmt(mttr) + " h = " +
              fmt(mtbf + mttr) + " h",
            "Verfügbarkeit: " + fmt(mtbf) + " / " + fmt(mtbf + mttr) + " = " +
              fmt(r2(mtbf / (mtbf + mttr) * 10000) / 10000),
            "In Prozent: " + fmt(verf) + " %"
          ],
          falle: "Im Nenner steht die SUMME aus MTBF und MTTR, nicht die MTBF allein. " +
                 "Sonst käme immer 100 % heraus.",
          merk: "Betriebszeit geteilt durch Betriebszeit plus Reparaturzeit."
        };
      }
    },

    /* ============ SLA-AUSFALLBUDGET (Gruppe verfuegbar) ============== */
    sla_budget: {
      label: "SLA-Ausfallbudget",
      formeln: [
        "SLA = Service Level Agreement = vertraglich zugesicherte Verfügbarkeit",
        "Minuten im Monat (30 Tage) = 30 × 24 × 60 = 43.200 Minuten",
        "Ausfall (%) = 100 - SLA (%)",
        "Ausfallbudget (Minuten) = 43.200 × Ausfall(%) ÷ 100",
        "Rest = Budget - bereits verbrauchte Ausfallminuten",
        "Beispiel: SLA 99,9 % ergibt Ausfall 0,1 % und 43.200 × 0,1 ÷ 100 = 43,2 Minuten",
        "Beispiel: bei bereits 20 Minuten Ausfall bleiben 43,2 - 20 = 23,2 Minuten Rest",
        "Achtung: der Zeitraum muss zum SLA passen - ein Monatsbudget rechnet mit 43.200 Minuten, nicht mit den 525.600 eines Jahres.",
        "Merksatz: 99,9 % im Monat sind 43,2 Minuten Ausfall - nicht mehr."
      ],
      flow: [
        "SLA in % (zugesicherte Verfügbarkeit)",
        "100 % minus SLA",
        "Ausfall in %",
        "× 43.200 Minuten ÷ 100",
        "Ausfallbudget in Minuten",
        "minus bereits verbrauchte Minuten",
        "Restbudget"
      ],
      gen: function (v) {
        v = v || {};
        var sla = oder(v.sla, pick([99, 99.5, 99.9, 99.95]));
        var minutenMonat = 30 * 24 * 60;
        var budget = r2(minutenMonat * (100 - sla) / 100);
        var verbraucht = oder(v.verbraucht, rndInt(1, Math.max(1, Math.floor(budget * 0.8))));
        var rest = r2(budget - verbraucht);

        return {
          frage: "Der SLA sichert eine Verfügbarkeit von <b>" + fmt(sla) +
                 " %</b> pro Monat zu (30 Tage). In der ersten Monatshälfte gab es bereits <b>" +
                 fmt(verbraucht) + " Minuten</b> Ausfall. a) Wie hoch ist das Ausfallbudget " +
                 "im Monat? b) Wie viele Minuten bleiben noch übrig?",
          teile: [
            { label: "a) Budget", einheit: "min", loesung: budget, pruef: "rel" },
            { label: "b) Rest", einheit: "min", loesung: rest, pruef: "rel" }
          ],
          schritte: [
            "Minuten im Monat: 30 * 24 * 60 = " + fmt(minutenMonat) + " min",
            "Ausfallanteil: 100 % - " + fmt(sla) + " % = " + fmt(r2(100 - sla)) + " %",
            "a) Budget: " + fmt(minutenMonat) + " min * " + fmt(r2(100 - sla)) + " % = " +
              fmt(budget) + " min",
            "b) Rest: " + fmt(budget) + " min - " + fmt(verbraucht) + " min = " +
              fmt(rest) + " min"
          ],
          falle: "Der Zeitraum muss zum SLA passen. Ein Monatsbudget rechnet sich aus 43.200 " +
                 "Minuten, nicht aus den 525.600 Minuten eines Jahres.",
          merk: "99,9 % im Monat sind 43,2 Minuten Ausfall - nicht mehr."
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /*  GRUPPEN                                                            */
  /*  Alle sechs Gruppen sind gefuellt.                                  */
  /* ------------------------------------------------------------------ */

  var gruppen = [
    { id: "daten",      label: "Datenmengen",        themen: ["einheiten", "zeit_bit", "zeit_byte", "faktor"] },
    { id: "bild",       label: "Bild & Auflösung",   themen: ["bild_menge", "scanner", "pixel"] },
    { id: "strom",      label: "Strom & Kosten",     themen: ["stromkosten", "strom_jahr", "sparen"] },
    { id: "wirtschaft", label: "Wirtschaftlichkeit", themen: ["amortisation", "tco", "kauf_leasing"] },
    { id: "netzteil",   label: "Netzteile",          themen: ["netzteil_dimension", "wirkungsgrad"] },
    { id: "verfuegbar", label: "Verfügbarkeit",      themen: ["ausfallzeit", "mtbf", "sla_budget"] }
  ];

  return {
    gruppen: gruppen,
    themen: themen,
    // Konstanten mit veroeffentlichen, sie werden spaeter weiterverwendet
    SCHNITTSTELLEN: SCHNITTSTELLEN,
    AUFLOESUNGEN: AUFLOESUNGEN,
    MONATSTAGE: MONATSTAGE
  };
})();
