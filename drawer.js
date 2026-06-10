/* ===================================================================== */
/*  FISI//OS · drawer.js — wiederverwendbare „Erklärung"-Schublade        */
/*                                                                       */
/*  EINE opake Panel-Instanz im Vordergrund mit zwei festen Zuständen     */
/*  (kein freies Ziehen/Resizen):                                         */
/*    • angedockt  – Desktop: Panel rechts (nicht-blockierend);           */
/*                   Handy: hochziehbares Bottom-Sheet (Peek/halb/ganz).  */
/*    • Vollbild   – blockierend: abgedunkelter Hintergrund + Fokusfalle. */
/*                                                                       */
/*  Schließen: Schließen-Button, Esc, und (nur im Vollbild) Klick auf     */
/*  den abgedunkelten Hintergrund.                                        */
/*                                                                       */
/*  Öffentliche API (window.Drawer):                                      */
/*    Drawer.open({ title, html, trigger })                               */
/*    Drawer.openMarkdown({ url | md, title, trigger })                   */
/*    Drawer.close()  ·  Drawer.expand()  ·  Drawer.collapse()            */
/*                                                                       */
/*  Markup/Stile liegen in theme.css (.drw-*). CSS hier NICHT nötig.      */
/*  Dieselbe Mechanik kann später auch eine Navigations-Sidebar tragen.   */
/* ===================================================================== */
(function () {
  "use strict";

  var root, panel, body, titleEl, expandBtn, expandTxt, grip, backdrop;
  var trigger = null, built = false, savedOverflow = "";

  function isMobile() {
    return window.matchMedia("(max-width:719px)").matches;
  }

  /* ---------------------------------------------------------------- */
  /*  Aufbau der einzigen Instanz (lazy beim ersten Öffnen)            */
  /* ---------------------------------------------------------------- */
  function build() {
    if (built) return;
    root = document.createElement("div");
    root.className = "drw-root";
    root.hidden = true;
    root.dataset.state = "closed";
    root.dataset.mode = "docked";
    root.dataset.snap = "half";
    root.innerHTML =
      '<div class="drw-backdrop"></div>' +
      '<aside class="drw-panel" role="dialog" aria-modal="false" aria-labelledby="drw-title" tabindex="-1">' +
        '<div class="drw-grip" role="separator" aria-label="Höhe ändern"></div>' +
        '<header class="drw-head">' +
          '<h2 class="drw-title" id="drw-title"></h2>' +
          '<div class="drw-actions">' +
            '<button type="button" class="drw-btn drw-expand" aria-pressed="false">' +
              '<span class="drw-ico">⤢</span><span class="drw-lbl">Vergrößern</span></button>' +
            '<button type="button" class="drw-btn drw-close" aria-label="Erklärung schließen">✕</button>' +
          '</div>' +
        '</header>' +
        '<div class="drw-body" tabindex="0"></div>' +
      '</aside>';
    document.body.appendChild(root);

    panel = root.querySelector(".drw-panel");
    body = root.querySelector(".drw-body");
    titleEl = root.querySelector(".drw-title");
    expandBtn = root.querySelector(".drw-expand");
    expandTxt = expandBtn.querySelector(".drw-lbl");
    grip = root.querySelector(".drw-grip");
    backdrop = root.querySelector(".drw-backdrop");

    root.querySelector(".drw-close").addEventListener("click", close);
    expandBtn.addEventListener("click", toggleFull);
    backdrop.addEventListener("click", function () {
      if (root.dataset.mode === "full") close();
    });
    document.addEventListener("keydown", onKey, true);
    initDrag();
    built = true;
  }

  /* ---------------------------------------------------------------- */
  /*  Tastatur: Esc schließt, Tab wird im Vollbild eingesperrt         */
  /* ---------------------------------------------------------------- */
  function onKey(e) {
    if (!built || root.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab" && root.dataset.mode === "full") trapTab(e);
  }

  function focusables() {
    var sel = 'a[href],button:not([disabled]),textarea,input,select,' +
      'details>summary,[tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(panel.querySelectorAll(sel), function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }
  function trapTab(e) {
    var f = focusables();
    if (!f.length) { e.preventDefault(); panel.focus(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------------------------------------------------------- */
  /*  Zustände                                                         */
  /* ---------------------------------------------------------------- */
  function setMode(mode) {
    root.dataset.mode = mode;
    var full = mode === "full";
    panel.setAttribute("aria-modal", full ? "true" : "false");
    expandBtn.setAttribute("aria-pressed", full ? "true" : "false");
    expandTxt.textContent = full ? "Verkleinern" : "Vergrößern";
    expandBtn.querySelector(".drw-ico").textContent = full ? "⤡" : "⤢";
    lockScroll(full);
  }

  function lockScroll(on) {
    // Nur im Vollbild (blockierend) wird die Seite dahinter festgehalten.
    if (on) {
      savedOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = savedOverflow || "";
    }
  }

  function toggleFull() {
    setMode(root.dataset.mode === "full" ? "docked" : "full");
    panel.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------------- */
  /*  Öffnen / Schließen                                               */
  /* ---------------------------------------------------------------- */
  function open(opts) {
    build();
    opts = opts || {};
    trigger = opts.trigger ||
      (document.activeElement && document.activeElement !== document.body
        ? document.activeElement : null);

    titleEl.textContent = opts.title || "Erklärung";
    body.innerHTML = opts.html || "";
    body.scrollTop = 0;

    setMode("docked");
    root.dataset.snap = "half";
    root.hidden = false;
    void root.offsetWidth;          // Reflow erzwingen -> Einblend-Animation
    root.dataset.state = "open";
    panel.focus({ preventScroll: true });
  }

  function close() {
    if (!built || root.hidden) return;
    root.dataset.state = "closed";
    lockScroll(false);
    setMode("docked");

    var done = function () { root.hidden = true; panel.removeEventListener("transitionend", done); };
    panel.addEventListener("transitionend", done);
    setTimeout(function () { if (root.dataset.state === "closed") root.hidden = true; }, 420);

    var t = trigger; trigger = null;
    if (t && typeof t.focus === "function") { try { t.focus(); } catch (e) {} }
  }

  /* ---------------------------------------------------------------- */
  /*  Bottom-Sheet ziehen (nur Handy): Schnapppunkte Peek/halb/ganz     */
  /* ---------------------------------------------------------------- */
  function initDrag() {
    var active = false, sy = 0, sh = 0, moved = false;

    grip.addEventListener("pointerdown", function (e) {
      if (!isMobile() || root.dataset.mode === "full") return;
      active = true; moved = false;
      sy = e.clientY;
      sh = panel.getBoundingClientRect().height;
      root.dataset.dragging = "1";
      try { grip.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    grip.addEventListener("pointermove", function (e) {
      if (!active) return;
      var dy = sy - e.clientY;
      if (Math.abs(dy) > 5) moved = true;
      var h = sh + dy;
      var max = window.innerHeight * 0.96, min = window.innerHeight * 0.12;
      h = Math.max(min, Math.min(max, h));
      panel.style.height = h + "px";
    });

    function end() {
      if (!active) return;
      active = false;
      delete root.dataset.dragging;
      var vh = window.innerHeight;
      var frac = panel.getBoundingClientRect().height / vh;
      panel.style.height = "";          // CSS (data-snap) übernimmt wieder

      if (!moved) {                     // Tipp auf den Griff = nächster Schnapppunkt
        var order = ["peek", "half", "full"];
        var idx = order.indexOf(root.dataset.snap);
        root.dataset.snap = order[(idx + 1) % order.length];
        return;
      }
      if (frac < 0.22) { close(); return; }
      root.dataset.snap = frac < 0.5 ? "peek" : (frac < 0.8 ? "half" : "full");
    }
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  }

  /* ---------------------------------------------------------------- */
  /*  Mini-Markdown-Renderer (für Konzept-Erklärungen aus .md)         */
  /* ---------------------------------------------------------------- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inlineMd(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, function (m, c) { return "<code>" + c + "</code>"; });
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return s;
  }
  function tableCells(r) {
    var t = r.trim().replace(/^\|/, "").replace(/\|$/, "");
    return t.split("|").map(function (c) { return c.trim(); });
  }
  function renderTable(rows) {
    var head = tableCells(rows[0]);
    var html = '<div class="drw-tablewrap"><table class="drw-table"><thead><tr>';
    head.forEach(function (c) { html += "<th>" + inlineMd(c) + "</th>"; });
    html += "</tr></thead><tbody>";
    rows.slice(2).forEach(function (r) {
      html += "<tr>";
      tableCells(r).forEach(function (c) { html += "<td>" + inlineMd(c) + "</td>"; });
      html += "</tr>";
    });
    return html + "</tbody></table></div>";
  }
  function mdToHtml(md) {
    var lines = md.replace(/\r\n/g, "\n").replace(/\t/g, "    ").split("\n");
    var out = [], i = 0, para = [], list = null;
    function flushPara() { if (para.length) { out.push("<p>" + inlineMd(para.join(" ")) + "</p>"); para = []; } }
    function flushList() { if (list) { out.push("<ul>" + list.join("") + "</ul>"); list = null; } }

    while (i < lines.length) {
      var line = lines[i];
      var fence = line.match(/^\s*```(.*)$/);
      if (fence) {
        flushPara(); flushList();
        var lang = (fence[1] || "").trim(), buf = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; // schließendes ```
        out.push('<pre class="drw-pre"><code' + (lang ? ' class="lang-' + esc(lang) + '"' : "") +
          ">" + esc(buf.join("\n")) + "</code></pre>");
        continue;
      }
      if (/^\s*\|/.test(line) && i + 1 < lines.length &&
          /^\s*\|?[\s:\-|]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].indexOf("-") >= 0) {
        flushPara(); flushList();
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        out.push(renderTable(rows));
        continue;
      }
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushPara(); flushList();
        var lvl = Math.min(h[1].length + 1, 6);
        out.push("<h" + lvl + ">" + inlineMd(h[2].trim()) + "</h" + lvl + ">");
        i++; continue;
      }
      var li = line.match(/^\s*[-*]\s+(.*)$/);
      if (li) { flushPara(); if (!list) list = []; list.push("<li>" + inlineMd(li[1]) + "</li>"); i++; continue; }
      if (/^\s*$/.test(line)) { flushPara(); flushList(); i++; continue; }
      if (/^\s*<\/?(details|summary|div|br|hr)\b/i.test(line)) {
        flushPara(); flushList(); out.push(line); i++; continue;
      }
      para.push(line.trim()); i++;
    }
    flushPara(); flushList();
    return out.join("\n");
  }

  function openMarkdown(opts) {
    opts = opts || {};
    if (opts.md != null) {
      open({ title: opts.title, html: mdToHtml(opts.md), trigger: opts.trigger });
      return;
    }
    if (opts.url) {
      open({ title: opts.title, html: '<p class="drw-loading">Lädt …</p>', trigger: opts.trigger });
      fetch(opts.url)
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
        .then(function (txt) { body.innerHTML = mdToHtml(txt); body.scrollTop = 0; })
        .catch(function () {
          body.innerHTML = '<p class="drw-error">Diese Erklärung konnte nicht geladen werden. ' +
            'Bitte öffne die Seite über einen lokalen Server ' +
            '(z. B. <code>python -m http.server</code>) statt direkt per Doppelklick.</p>';
        });
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Öffentliche API                                                  */
  /* ---------------------------------------------------------------- */
  window.Drawer = {
    open: open,
    openMarkdown: openMarkdown,
    close: close,
    expand: function () { build(); setMode("full"); panel.focus({ preventScroll: true }); },
    collapse: function () { if (built) { setMode("docked"); panel.focus({ preventScroll: true }); } }
  };

  /* Bequemer Auto-Hook: jeder Button mit data-erkl="<url.md>" öffnet die
     Schublade mit dieser Markdown-Datei. data-erkl-title setzt den Titel. */
  function wireButtons() {
    document.querySelectorAll("[data-erkl]").forEach(function (btn) {
      if (btn.dataset.drwWired) return;
      btn.dataset.drwWired = "1";
      btn.addEventListener("click", function () {
        openMarkdown({
          url: btn.getAttribute("data-erkl"),
          title: btn.getAttribute("data-erkl-title") || "Erklärung",
          trigger: btn
        });
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireButtons);
  } else {
    wireButtons();
  }
})();
