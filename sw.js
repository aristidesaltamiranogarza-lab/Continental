// sw.js — caché de modelos, texturas y mapas de luz que ya traen versión (?v=N, @modelos-vN, three@x.y.z).
// Primero la caché; si no está, red y se guarda. Al guardar una versión nueva se borran las otras del mismo archivo.
// Todo lo demás (páginas, scripts del juego, salas, polling) va directo a la red, sin tocarlo.
const C='gm-recursos-1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('gm-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const EXT=/\.(glb|gltf|bin|ktx2|webp|jpg|jpeg|png|exr|hdr|json|wasm|js)$/i;
// llave sin el reintento (&r=); "base" sin la versión, para borrar las viejas
function llave(u){const x=new URL(u);x.searchParams.delete('r');return x.href}
function base(u){const x=new URL(u);x.search='';return x.href.replace(/@modelos-v[\w.-]+/,'@modelos')}
function versionado(u){const x=new URL(u);if(!EXT.test(x.pathname))return false;
 if(x.origin===self.location.origin)return x.pathname.startsWith('/modelos/')&&x.searchParams.has('v');
 if(x.hostname==='cdn.jsdelivr.net'||x.hostname==='unpkg.com')return /@modelos-v[\w.-]+\/|three@\d+\.\d+\.\d+\//.test(x.pathname);
 return false}
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||!versionado(q.url))return;
 const k=llave(q.url);
 e.respondWith(caches.open(C).then(c=>c.match(k).then(r=>r||fetch(q).then(res=>{if(res.ok&&res.type!=='opaque'){const cp=res.clone(),b=base(k);
  e.waitUntil(c.keys().then(ks=>Promise.all(ks.filter(x=>x.url!==k&&base(x.url)===b).map(x=>c.delete(x)))).then(()=>c.put(k,cp)).catch(()=>{}))}return res}))))});
