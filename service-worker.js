/* ===================================================================== */
/*  FISI//OS · service-worker.js                                         */
/*  Offline-Caching. Strategie: Network-first für HTML (immer frisch,    */
/*  Cache als Fallback), Cache-first für statische Assets (css/js/svg).  */
/*  Cache-Version bei größeren Updates erhöhen → alte Caches werden      */
/*  automatisch gelöscht.                                                */
/* ===================================================================== */
const CACHE = "fisi-os-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./theme.css",
  "./study.js",
  "./manifest.json",
  "./icon.svg",
  "./ap2.html",
  "./lf1.html",
  "./lf2.html",
  "./lf3.html",
  "./lf4.html",
  "./prio.html",
  "./python_byte.html",
  "./lf4_it_sicherheit.html",
  "./lf_isms_grundschutz.html",
  "./bsi_anforderungsindex.html",
  "./lzk.html"
];

// Installation: alle bekannten Dateien vorab cachen
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // einzeln cachen, damit ein fehlendes File die Installation nicht abbricht
      Promise.allSettled(ASSETS.map(u => c.add(u)))
    ).then(() => self.skipWaiting())
  );
});

// Aktivierung: alte Cache-Versionen entfernen
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Abruf
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fremd-Domains (z. B. Google Fonts) einfach durchreichen, aber nach Abruf cachen
  const sameOrigin = url.origin === self.location.origin;

  // HTML-Navigationen: Network-first (frische Inhalte), Cache-Fallback offline
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Statische Assets: Cache-first, im Hintergrund aktualisieren
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && (sameOrigin || res.type === "cors")) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
