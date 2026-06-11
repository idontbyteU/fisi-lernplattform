/* ===================================================================== */
/*  FISI//OS · theme.js — gemeinsame Hell/Dunkel-Steuerung               */
/*                                                                       */
/*  - wendet das gespeicherte Theme SOFORT auf <html> an (im <head>      */
/*    eingebunden, daher vor dem ersten Paint -> kein Flackern)          */
/*  - injiziert bzw. verdrahtet einen Umschalt-Button (.theme-tg) im     */
/*    Header jeder Seite                                                  */
/*  - speichert die Wahl unter dem gemeinsamen Key "fisi_theme"          */
/*    (Standard = dunkel), damit die Auswahl plattformweit gilt          */
/* ===================================================================== */
(function () {
  var KEY = "fisi_theme";
  var root = document.documentElement;

  function current() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function apply(t) {
    if (t === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }
  function relabel(btns) {
    var next = current() === "light" ? "🌙 Dunkel" : "☀ Hell";
    btns.forEach(function (b) { b.textContent = next; });
  }

  // 1) Gespeichertes Theme sofort anwenden (Standard: dunkel)
  var saved = "dark";
  try { saved = localStorage.getItem(KEY) || "dark"; } catch (e) {}
  apply(saved);

  // 2) Button(s) verdrahten / einfügen, sobald das DOM steht
  function wire() {
    var btns = Array.prototype.slice.call(document.querySelectorAll(".theme-tg"));
    if (btns.length === 0) {
      var b = document.createElement("button");
      b.className = "theme-tg theme-tg--auto";
      b.type = "button";
      b.title = "Hell/Dunkel umschalten";
      var host = document.querySelector(".hdr-in, .pyhub, .labbar, .top-bar, .hdr, header");
      if (host) { host.appendChild(b); }
      else { b.className = "theme-tg theme-tg--float"; document.body.appendChild(b); }
      btns = [b];
    }
    relabel(btns);
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var now = current() === "light" ? "dark" : "light";
        apply(now);
        try { localStorage.setItem(KEY, now); } catch (e) {}
        relabel(btns);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
