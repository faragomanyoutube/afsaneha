const VERSION = "afsaneha-v1";
const SHELL = [
  "./","./index.html","./contribute.html","./about.html","./contributors.html","./offline.html","./config.json",
  "./assets/css/style.css",
  "./assets/js/i18n.js","./assets/js/md.js","./assets/js/app.js","./assets/js/legend.js",
  "./assets/js/story.js","./assets/js/contribute.js","./assets/js/contributors.js",
  "./assets/js/map.js","./assets/js/views.js","./assets/js/season.js","./assets/js/pwa.js","./assets/js/tilt.js",
  "./assets/data/legends.json","./assets/data/provinces.json",
  "./assets/img/logo-amber.png","./assets/img/logo-purple.png"
];
self.addEventListener("install", e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  const isData = url.pathname.endsWith(".json") || url.pathname.endsWith(".md");
  if(isData){ e.respondWith(fetch(req).then(r=>{ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); return r; }).catch(()=>caches.match(req))); return; }
  e.respondWith(caches.match(req).then(hit=> hit || fetch(req).then(r=>{ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); return r; }).catch(()=>{ if(req.mode==="navigate") return caches.match("./offline.html"); })));
});
