/* Offline-Cache. Bei jeder neuen App-Version VERSION erhoehen, dann laden alle Geraete die neuen Dateien. */
const VERSION='scanner-v1';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  // App-Dateien: zuerst Netz (immer aktuell), bei fehlender Verbindung aus dem Cache
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy))}
      return res;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('index.html'))));
    return;
  }
  // Schriftarten (Google Fonts): aus dem Cache, im Hintergrund aktualisieren
  if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.open(VERSION).then(c=>c.match(req).then(hit=>{
      const net=fetch(req).then(res=>{c.put(req,res.clone());return res}).catch(()=>hit);
      return hit||net;
    })));
  }
});
