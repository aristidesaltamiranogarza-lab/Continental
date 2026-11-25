// Envío de archivos por partes (stream) en vez de readFileSync, para no congelar el polling con archivos grandes.
// modelos/: .glb y .ktx2 con caché larga (cada versión se publica con otra etiqueta o carpeta), ETag, 304 y Range.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const DIR=path.join(__dirname,'modelos');
const TIPOS={'.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream','.ktx2':'image/ktx2','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};

// envia(req,res,archivo,tipo,cache): manda el archivo en partes; responde 304 si el navegador ya lo tiene y 206 si pide un rango
function envia(req,res,f,tipo,cache){
 fs.stat(f,(e,st)=>{
  if(e||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('no')}
  const tag='"'+st.size.toString(36)+'-'+Math.floor(st.mtimeMs).toString(36)+'"',h={'Content-Type':tipo,'Cache-Control':cache,'ETag':tag,'Accept-Ranges':'bytes'};
  if(req.headers['if-none-match']===tag){res.writeHead(304,h);return res.end()}
  let a=0,b=st.size-1,code=200;const rg=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
  if(rg&&st.size&&(rg[1]||rg[2])){
   if(!rg[1])a=Math.max(0,st.size-+rg[2]);else{a=+rg[1];if(rg[2])b=Math.min(+rg[2],b)}   // "bytes=-500" = los últimos 500
   if(a>b||a>=st.size){res.writeHead(416,{'Content-Range':'bytes */'+st.size});return res.end()}
   code=206;h['Content-Range']='bytes '+a+'-'+b+'/'+st.size}
  h['Content-Length']=b-a+1;res.writeHead(code,h);
  if(req.method==='HEAD')return res.end();
  const s=fs.createReadStream(f,{start:a,end:b});s.on('error',()=>res.destroy());s.pipe(res)})}

// los .glb (y .gltf/.bin/.json) van comprimidos si el navegador acepta br o gzip: un GLB de la casona baja de 1.7 MB a ~250 KB.
// Se comprime una vez por archivo y versión (tamaño+fecha) y se guarda en memoria; con Range se manda tal cual. Las texturas ya vienen comprimidas.
const ZIP=new Set(['.glb','.gltf','.bin','.json']),ZC=new Map();
const BRQ=q=>({params:{[zlib.constants.BROTLI_PARAM_QUALITY]:q}}),MEJ=[];let mejOc=false;
function mejora(){if(mejOc||!MEJ.length)return;mejOc=true;const m=MEJ.shift();zlib.brotliCompress(m.buf,BRQ(11),(e,z)=>{if(!e&&ZC.get(m.k)===m.ent&&m.ent.b)m.ent.b=z;mejOc=false;setTimeout(mejora,100)})}
function comprimido(req,res,f,tipo,cache){const ae=req.headers['accept-encoding']||'',enc=/\bbr\b/.test(ae)?'br':/\bgzip\b/.test(ae)?'gzip':'';
 if(!enc||req.headers.range)return envia(req,res,f,tipo,cache);
 fs.stat(f,(e,st)=>{if(e||!st.isFile())return envia(req,res,f,tipo,cache);const tag='"'+st.size.toString(36)+'-'+Math.floor(st.mtimeMs).toString(36)+'-'+enc+'"',k=f+'|'+enc,h={'Content-Type':tipo,'Cache-Control':cache,'ETag':tag,'Vary':'Accept-Encoding'};
  if(req.headers['if-none-match']===tag){res.writeHead(304,h);return res.end()}
  const manda=b=>{h['Content-Encoding']=enc;h['Content-Length']=b.length;res.writeHead(200,h);res.end(req.method==='HEAD'?undefined:b)};
  const c=ZC.get(k);if(c&&c.tag===tag){if(c.b)return manda(c.b);return c.p.then(manda,()=>envia(req,res,f,tipo,cache))}
  const ent={tag,p:null,b:null};
  // brotli 11 tarda ~7 s por GLB (más en el servidor y en cada reinicio): primero va en calidad 5 (~70 ms) y la 11 se hace después, de uno en uno
  const p=ent.p=new Promise((ok,no)=>fs.readFile(f,(e2,buf)=>{if(e2)return no(e2);(enc==='br'?zlib.brotliCompress:zlib.gzip)(buf,enc==='br'?BRQ(5):{level:6},(e3,z)=>{if(e3)return no(e3);ok(z);if(enc==='br'){MEJ.push({k,ent,buf});mejora()}})}));
  ZC.set(k,ent);p.then(z=>{ent.b=z;manda(z)},()=>{ZC.delete(k);envia(req,res,f,tipo,cache)})})}

// /modelos/...: solo archivos dentro de la carpeta; el catálogo se revalida siempre y los modelos se guardan un año
// (el cliente pide cada modelo con ?h=<huella del catálogo>, así un modelo regenerado nunca sale viejo de la caché)
function modelos(req,res,p){
 let rel;try{rel=decodeURIComponent(p.slice('/modelos/'.length))}catch(e){rel=''}
 const f=path.normalize(path.join(DIR,rel)),ext=path.extname(f).toLowerCase();
 if(!f.startsWith(DIR+path.sep)||!TIPOS[ext]||/(^|[\\/])originales([\\/]|$)/.test(rel)){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('no')}
 res.setHeader('Access-Control-Allow-Origin','*');
 (ZIP.has(ext)?comprimido:envia)(req,res,f,TIPOS[ext],ext==='.json'?'no-cache':'public, max-age=31536000, immutable')}

module.exports={envia,modelos};
