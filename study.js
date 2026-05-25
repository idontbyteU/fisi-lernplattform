/* ===================================================================== */
/*  FISI//OS · study.js  ·  Gemeinsame Karteikarten-Logik                */
/*  3 Stufen: Unsicher(0) · Wackelt(0,5) · Sitzt(1)                       */
/*  Beherrschung = Ø der letzten 10 Versuche je Karte (gleitendes Fenster)*/
/*  Aufruf je Seite:  Study.init({ cards:CARDS, cats:CATS, key:"..." })   */
/* ===================================================================== */
(function (global) {
  const WINDOW = 10;                 // Anzahl gewerteter letzter Versuche
  const SURE = 80;                   // ab wie viel % gilt eine Karte/Thema als "sitzt"
  const VAL = { hi: 1, mid: 0.5, lo: 0 };

  const Study = {};

  Study.init = function (opts) {
    const CARDS = opts.cards, CATS = opts.cats;
    const LS = opts.key || "fisi_study_v2";

    // Stabile ID je Karte (falls noch nicht gesetzt)
    CARDS.forEach((c, i) => { if (!c.id) c.id = "c" + i; });

    // ---- Speicher laden ----
    let store; try { store = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { store = {}; }
    store.hist = store.hist || {};   // { cardId: [0.5,1,0,...] }  (neuester am Ende)
    const save = () => { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) {} };

    // ---- Beherrschung berechnen ----
    function masteryOf(id) {
      const h = store.hist[id];
      if (!h || !h.length) return null;            // null = noch nie geübt
      const sum = h.reduce((a, b) => a + b, 0);
      return Math.round((sum / h.length) * 100);
    }
    function masteryClass(m) {
      if (m === null) return "m-new";
      if (m >= SURE) return "m-hi";
      if (m >= 50) return "m-mid";
      return "m-lo";
    }
    function barClass(m) { return m >= SURE ? "hi" : (m >= 50 ? "mid" : "lo"); }

    // Ø-Beherrschung über eine Kartenmenge (ungeübt = 0 → Balken füllt sich beim Lernen)
    function scopeMastery(list) {
      if (!list.length) return 0;
      const sum = list.reduce((a, c) => a + (masteryOf(c.id) || 0), 0);
      return Math.round(sum / list.length);
    }
    function record(id, v) {
      const h = store.hist[id] || [];
      h.push(v); while (h.length > WINDOW) h.shift();
      store.hist[id] = h; save();
    }

    // ---- DOM ----
    const cardChips = document.getElementById('cardChips');
    const studyEl = document.getElementById('study');
    const ptxt = document.querySelector('#vCards .ptxt') || document.querySelector('.ptxt');
    const pfill = document.getElementById('pfill');

    let activeCat = "alle", onlyOpen = false, shuffled = false, deck = [], pos = 0, flipped = false;

    // ---- Chips (mit %-Suffix je Thema) ----
    function chipPct(list) { return list.length ? scopeMastery(list) : 0; }
    function buildCardChips() {
      cardChips.innerHTML = "";
      const allList = CARDS.slice();
      const all = document.createElement('button');
      all.className = "chip" + (activeCat === "alle" ? " on" : "");
      all.innerHTML = 'Alle <span class="ct">(' + CARDS.length + ')</span>';
      all.onclick = () => { activeCat = "alle"; buildCardChips(); rebuild(); };
      cardChips.appendChild(all);
      Object.keys(CATS).forEach(k => {
        const list = CARDS.filter(c => c.c === k); if (!list.length) return;
        const m = chipPct(list);
        const c = document.createElement('button');
        c.className = "chip" + (activeCat === k ? " on" : "");
        c.innerHTML = CATS[k].label + ' <span class="pct ' + masteryClass(m) + '">' + m + '%</span>';
        if (activeCat === k) { c.style.background = CATS[k].color; c.style.borderColor = CATS[k].color; c.style.color = "#04121a"; }
        c.onclick = () => { activeCat = k; buildCardChips(); rebuild(); };
        cardChips.appendChild(c);
      });
    }

    function scopeList() { return CARDS.filter(c => activeCat === "alle" || c.c === activeCat); }
    function baseDeck() {
      let d = scopeList();
      if (onlyOpen) d = d.filter(c => { const m = masteryOf(c.id); return m === null || m < SURE; });
      return d;
    }
    function rebuild() {
      deck = baseDeck();
      if (shuffled) for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[deck[i], deck[j]] = [deck[j], deck[i]]; }
      pos = 0; flipped = false; updateProg(); renderStudy();
    }

    // ---- Fortschrittsleiste: Ø-Beherrschung + "N/M Themen sicher" ----
    function updateProg() {
      const scope = scopeList();
      const avg = scopeMastery(scope);
      if (pfill) { pfill.style.width = avg + "%"; pfill.parentElement.className = "pbar"; }
      // Themen sicher zählen
      const themes = Object.keys(CATS).filter(k => CARDS.some(c => c.c === k));
      const sure = themes.filter(k => scopeMastery(CARDS.filter(c => c.c === k)) >= SURE).length;
      if (ptxt) {
        ptxt.innerHTML = '<span class="big" style="color:var(--cyan)">' + avg + '%</span> beherrscht'
          + ' · <span class="sec">' + sure + '/' + themes.length + '</span> Themen sicher';
      }
    }

    // ---- Lern-Ansicht ----
    function badge(m) {
      const cls = masteryClass(m);
      const txt = m === null ? "neu" : m + "%";
      return '<span class="mbadge ' + cls + '"><span class="md"></span>' + txt + '</span>';
    }
    function renderStudy() {
      if (deck.length === 0) {
        studyEl.innerHTML = '<div class="done-msg"><div class="em">🎯</div><h3>Nichts offen</h3><p>In dieser Auswahl sitzt alles über ' + SURE + '%.</p><button class="tbtn" id="rs">Alles wiederholen</button></div>';
        document.getElementById('rs').onclick = () => { onlyOpen = false; const t = document.getElementById('tOpen'); if (t) t.classList.remove('on'); rebuild(); };
        return;
      }
      if (pos >= deck.length) pos = deck.length - 1;
      const card = deck[pos], cat = CATS[card.c], m = masteryOf(card.id);
      studyEl.innerHTML = `
        <div class="cardmeta">
          <div class="counter">Karte <b>${pos + 1}</b> / ${deck.length}</div>
          ${badge(m)}
        </div>
        <div class="flash${flipped ? ' flip' : ''}" id="flash"><div class="flash-inner">
          <div class="face"><div class="f-cat" style="color:${cat.color}">${cat.label}</div><div class="f-q">${card.q}</div><div class="f-hint">Klick / Leertaste zum Umdrehen</div></div>
          <div class="face b"><div class="f-lbl">Antwort</div><div class="f-a">${card.a}</div><div class="f-hint">Wie sicher saß das?</div></div>
        </div></div>
        <div class="ans-btns">
          <button class="again" id="bLo">✗ Unsicher</button>
          <button class="mid" id="bMid">~ Wackelt</button>
          <button class="known" id="bHi">✓ Sitzt</button>
        </div>
        <div class="nav"><button id="bP">← Zurück</button><span>${pos + 1} / ${deck.length}</span><button id="bN">Überspringen →</button></div>`;
      const flashEl = document.getElementById('flash');
      flashEl.onclick = () => { flipped = !flipped; flashEl.classList.toggle('flip', flipped); };
      const answer = (v) => {
        const before = masteryOf(card.id);
        record(card.id, v);
        const after = masteryOf(card.id);
        buildCardChips(); updateProg();
        // kleiner Level-up-Effekt, wenn die Karte neu ≥80% erreicht
        if ((before === null || before < SURE) && after >= SURE) {
          flashEl.classList.add('levelup');
          setTimeout(next, 620);
        } else { next(); }
      };
      document.getElementById('bLo').onclick = () => answer(VAL.lo);
      document.getElementById('bMid').onclick = () => answer(VAL.mid);
      document.getElementById('bHi').onclick = () => answer(VAL.hi);
      document.getElementById('bP').onclick = () => { if (pos > 0) { pos--; flipped = false; renderStudy(); } };
      document.getElementById('bN').onclick = () => next();
    }
    function next() {
      if (pos < deck.length - 1) { pos++; flipped = false; renderStudy(); }
      else {
        if (onlyOpen) { rebuild(); }
        else {
          studyEl.innerHTML = '<div class="done-msg"><div class="em">✅</div><h3>Stapel durch!</h3><p>Alle Karten dieser Auswahl gesehen. Dein Fortschritt ist gespeichert.</p><button class="tbtn" id="rr">Nochmal von vorn</button></div>';
          document.getElementById('rr').onclick = () => { pos = 0; flipped = false; renderStudy(); };
        }
      }
    }

    // ---- Toolbar ----
    const tShuffle = document.getElementById('tShuffle');
    const tOpen = document.getElementById('tOpen');
    const tReset = document.getElementById('tReset');
    if (tShuffle) tShuffle.onclick = function () { shuffled = !shuffled; this.classList.toggle('on', shuffled); rebuild(); };
    if (tOpen) { tOpen.textContent = "Nur offene"; tOpen.onclick = function () { onlyOpen = !onlyOpen; this.classList.toggle('on', onlyOpen); rebuild(); }; }
    if (tReset) tReset.onclick = function () {
      if (!confirm("Fortschritt dieser Auswahl wirklich zurücksetzen?")) return;
      scopeList().forEach(c => delete store.hist[c.id]); save(); buildCardChips(); rebuild();
    };

    // ---- Tastatur ----
    document.addEventListener('keydown', e => {
      const v = document.getElementById('vCards');
      if (!v || !v.classList.contains('on') || deck.length === 0) return;
      if (e.code === "Space") { e.preventDefault(); flipped = !flipped; const f = document.getElementById('flash'); if (f) f.classList.toggle('flip', flipped); }
      else if (e.code === "Digit1") { const b = document.getElementById('bLo'); if (b) b.click(); }
      else if (e.code === "Digit2") { const b = document.getElementById('bMid'); if (b) b.click(); }
      else if (e.code === "Digit3") { const b = document.getElementById('bHi'); if (b) b.click(); }
      else if (e.code === "ArrowRight") next();
      else if (e.code === "ArrowLeft") { if (pos > 0) { pos--; flipped = false; renderStudy(); } }
    });

    // ---- Start ----
    buildCardChips();
    rebuild();
    // rebuild() wird auch beim Tab-Wechsel auf "Karten" aufgerufen (Seite ruft Study.rebuild())
    Study._rebuild = rebuild;
    Study._refresh = () => { buildCardChips(); updateProg(); };
  };

  global.Study = Study;
})(window);
