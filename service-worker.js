/* ===================================================================== */
/*  FISI//OS · service-worker.js                                         */
/*  Strategie: NETWORK-FIRST für alles (online immer der neueste Stand). */
/*  Bei jedem Abruf wird zuerst frisch aus dem Netz geladen und der      */
/*  Cache aktualisiert; nur wenn kein Netz da ist, kommt die gecachte    */
/*  Version als Offline-Fallback. So gibt es nie veraltete oder gemischt */
/*  alte/neue Stände (z. B. neue lf4.html mit alter study.js/theme.css). */
/*                                                                       */
/*  Private Einzelnutzung: kein manuelles Hochzählen einer Versionsnr.   */
/*  nötig – der Cache wird ohnehin bei jedem Online-Abruf erneuert.      */
/* ===================================================================== */
const CACHE = "fisi-os-v4";           // bei Network-first unkritisch; erhoeht fuer lf5_datenbanken.html
const ASSETS = [
  "./",
  "./index.html",
  "./theme.css",
  "./theme.js",
  "./study.js",
  "./drawer.js",
  "./manifest.json",
  "./icon.svg",
  "./ap2.html",
  "./ap1_uebersicht.html",
  "./ap2_uebersicht.html",
  "./lf1.html",
  "./lf2.html",
  "./lf3.html",
  "./lf3_ipv6.html",
  "./lf3_usv.html",
  "./lf4.html",
  "./lf4_grundschutz_uebung.html",
  "./lf4_zusammenfassung.pdf",
  "./lf4_grundschutz_check_umsetzung.pdf",
  "./prio.html",
  "./programmierung.html",
  "./python_byte.html",
  "./python_lab.html",
  "./Python_Befehlsreferenz.pdf",
  "./content/erklaerung_datei_io.md",
  "./lf5_vorgehensmodelle.html",
  "./struktogramme.html",
  "./json.html",
  "./lf5_bpmn.html",
  "./lf5_uml.html",
  "./lf5_datenbanken.html",
  "./img/db/db_sensor_aufgabe.png",
  "./img/db/db_sensor_loesung.png",
  "./img/db/db_sensor_relational.png",
  "./img/db/db_walzanlage_aufgabe.png",
  "./img/db/db_walzanlage_loesung.png",
  "./img/db/db_impfzentrum_aufgabe.png",
  "./img/db/db_impfzentrum_loesung.png",
  "./img/uml/ex_uc_schluesselsystem.png",
  "./img/uml/ex_act_raumbuchung.png",
  "./img/uml/ex_state_raumbelegung.png",
  "./img/uml/sol_uc_gebaeudemanagement.png",
  "./img/uml/sol_uc_aktionaersversammlung.png",
  "./img/uml/sol_uc_krake.png",
  "./img/uml/sol_uc_helferlein.png",
  "./img/uml/sol_act_max3zahlen.png",
  "./img/uml/sol_act_facharbeiter.png",
  "./img/uml/sol_act_geldautomat.png",
  "./img/uml/sol_act_onlineshop.png",
  "./img/uml/sol_act_aktionaersversammlung.png",
  "./img/uml/sol_act_kundenportal.png",
  "./img/uml/sol_act_yachthafen.png",
  "./img/uml/sol_state_ampel.png",
  "./lf4_it_sicherheit.html",
  "./lf_isms_grundschutz.html",
  "./lzk.html"
];

// Installation: bekannte Dateien einmal vorab cachen (für sofortige Offline-Fähigkeit)
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

// Aktivierung: fremde/alte Cache-Versionen entfernen, sofort übernehmen
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Abruf: Network-first für ALLES (gleiche Domain), Cache nur als Fallback
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Fremd-Domains (z. B. Schriftarten): unverändert durchreichen
  if (!sameOrigin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // erfolgreichen Abruf in den Cache spiegeln
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        // offline: gecachte Version, sonst Startseite als letzter Fallback
        caches.match(req).then(r => r || caches.match("./index.html"))
      )
  );
});
