// c_cache_img.js — CIMG: guarda dibujos caros (cartas ilustradas, retratos) en el Cache del navegador para no redibujarlos en cada partida.
// La versión es un hash del código de los scripts que los dibujan (ver(re)): si cambia el código, se dibujan de nuevo y lo viejo se borra.
// CIMG.ver(re) → promesa de la versión · CIMG.saca(grupo,v,clave,'bmp'|'url') → ImageBitmap / URL o null · CIMG.pon(grupo,v,clave,lienzo,max)
(function(){
const VER={},LIMPIO={};let caP=null;
const ca=()=>caP||(caP=(window.caches?caches.open('casa-dibujos'):Promise.resolve(null)).catch(()=>null));
function ver(re){const k=re.source;if(VER[k])return VER[k];
 return VER[k]=(async()=>{let h=2166136261;for(const x of [...document.scripts].filter(x=>x.src&&re.test(x.src))){const t=await (await fetch(x.src,{cache:'force-cache'})).text();
  for(let i=0;i<t.length;i++)h=Math.imul(h^t.charCodeAt(i),16777619)}return (h>>>0).toString(36)})().catch(()=>'')}
const url=(g,v,k)=>'/_dib/'+g+'/'+v+'/'+encodeURIComponent(k);
async function limpia(c,g,v){if(LIMPIO[g])return;LIMPIO[g]=1;try{for(const q of await c.keys())if(q.url.includes('/_dib/'+g+'/')&&!q.url.includes('/_dib/'+g+'/'+v+'/'))c.delete(q)}catch(e){}}
async function saca(g,v,k,como){if(!v)return null;const c=await ca();if(!c)return null;limpia(c,g,v);
 try{const r=await c.match(url(g,v,k));if(!r)return null;const b=await r.blob();return como==='url'?URL.createObjectURL(b):await createImageBitmap(b)}catch(e){return null}}
async function pon(g,v,k,cv,max){if(!v||!cv||!cv.toBlob)return;const c=await ca();if(!c)return;
 cv.toBlob(b=>{if(b)c.put(url(g,v,k),new Response(b,{headers:{'Content-Type':b.type}})).then(()=>max&&recorta(c,g,max)).catch(()=>{})},'image/webp',.92)}
// max: cuántos guarda el grupo como mucho (los más viejos salen primero; p. ej. retratos de bots que cambian cada partida)
async function recorta(c,g,max){try{const ks=(await c.keys()).filter(q=>q.url.includes('/_dib/'+g+'/'));for(let i=0;i<ks.length-max;i++)c.delete(ks[i])}catch(e){}}
window.CIMG={ver,saca,pon};
})();
