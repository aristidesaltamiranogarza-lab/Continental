// c_casa_glb.js — CGLB: modelos .glb de la casa (texturas KTX2, geometría meshopt) con el THREE global de three.min.js.
// Puente: los cargadores de three (GLTFLoader, KTX2Loader) son módulos que importan 'three'; se bajan de jsDelivr como texto,
// se cambia 'three' por un módulo que reexporta window.THREE y se cargan como blob. Así no hace falta importmap ni bundler.
// Calidad: ligero = sin modelos; medio = versión Medio; completo = primero Medio y en segundo plano se cambia a HD.
// Solo se cargan los modelos del piso donde estás; al cambiar de piso se libera la memoria del anterior.
// Origen: en localhost los archivos locales (modelos/); fuera, jsDelivr con la etiqueta del catálogo; si jsDelivr falla, el servidor.
//   const g=CGLB.pon('pb','silla_madera',{pos:[1,0,2],rot:Math.PI/2,esc:1,sombra:true,listo:(obj,ver)=>{}});  escena.add(g);
(function(){
const TV='0.160.0',JSM='https://cdn.jsdelivr.net/npm/three@'+TV+'/examples/jsm/',REPO='aristidesaltamiranogarza-lab/Continental';
const H=location.hostname,LOCAL=location.protocol==='file:'||/^(localhost|127\.0\.0\.1|\[::1\])$/.test(H)||/\.(localhost|test)$/.test(H);
const PROPIO=new URL('modelos/',location.href).href;
let CAT=null,catP=null,base=PROPIO,ldP=null,piso='pb',q0=null;
const LUG={},CACHE=new Map(),ST={bytes:0,ok:0,err:0,carg:0};   // LUG: piso -> lugares; CACHE: url -> {p, n (usos), gl, b (bytes)}
const cal=()=>{const q=window.CALIDAD;return q==='completo'||q==='medio'?q:'ligero'};

// ---------- puente de módulos ----------
let shim=null;const BL=new Map();
const blob=t=>URL.createObjectURL(new Blob([t],{type:'text/javascript'}));
function shimURL(){if(!shim){const k=Object.keys(window.THREE).filter(x=>/^[A-Za-z_$][\w$]*$/.test(x));shim=blob('const T=window.THREE;export const {'+k.join(',')+'}=T;export default T;')}return shim}
const RE=/^(\s*import\s*|\s*(?:import|export)\b[^'";]*?\bfrom\s*)(['"])([^'"\n]+)\2/gm;   // solo import/export al inicio de línea (no lo que viene en comentarios)
function modBlob(u){if(BL.has(u))return BL.get(u);
 const p=fetch(u).then(r=>{if(!r.ok)throw Error(r.status+' '+u);return r.text()}).then(async t=>{
  const dep=new Map();let m;RE.lastIndex=0;while((m=RE.exec(t)))if(m[3]!=='three'&&!dep.has(m[3]))dep.set(m[3],modBlob(new URL(m[3],u).href));
  for(const [s,pp] of dep)dep.set(s,await pp);
  return blob(t.replace(RE,(a,b,c,s)=>b+c+(s==='three'?shimURL():dep.get(s))+c))});
 BL.set(u,p);return p}
const mod=r=>modBlob(JSM+r).then(u=>import(u));

// cargador único (GLTF + KTX2 + meshopt); el KTX2 necesita el renderer para saber qué compresión aguanta la tarjeta
function cargador(){return ldP||(ldP=Promise.all([mod('loaders/GLTFLoader.js'),mod('loaders/KTX2Loader.js'),mod('libs/meshopt_decoder.module.js')]).then(([G,K,M])=>{
 const L=new G.GLTFLoader(),k=new K.KTX2Loader().setTranscoderPath(JSM+'libs/basis/'),R=window.CASA3D&&CASA3D.R&&CASA3D.R();
 if(R)k.detectSupport(R);L.setKTX2Loader(k);L.setMeshoptDecoder(M.MeshoptDecoder);return L}).catch(e=>{ldP=null;throw e}))}

// ---------- catálogo ----------
function catalogo(){return catP||(catP=fetch(PROPIO+'modelos.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{modelos:{}}).catch(()=>({modelos:{}})).then(c=>{
 CAT=c;CAT.modelos=CAT.modelos||{};if(!LOCAL&&c.version)base='https://cdn.jsdelivr.net/gh/'+REPO+'@'+c.version+'/modelos/';return CAT}))}
const urlDe=(b,v)=>b+v.archivo+(v.h?'?h='+v.h:'');

// ---------- caché con usos: un .glb se baja una vez y cada lugar usa una copia que comparte geometría y texturas ----------
function bajar(u){return fetch(u).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer()})}
function toma(v){const u=urlDe(PROPIO,v);let c=CACHE.get(u);
 if(!c){c={n:0,gl:null,b:0};CACHE.set(u,c);ST.carg++;
  c.p=Promise.all([cargador(),bajar(urlDe(base,v)).catch(e=>{if(base===PROPIO)throw e;console.warn('[CGLB] jsDelivr falló, uso el servidor',e);base=PROPIO;return bajar(u)})])
   .then(([L,buf])=>{c.b=buf.byteLength;ST.bytes+=c.b;return new Promise((ok,no)=>L.parse(buf,'',ok,no))})
   .then(gl=>{c.gl=gl;ST.ok++;ST.carg--;if(c.n<=0)suelta(u,true);return gl},e=>{ST.err++;ST.carg--;ST.bytes-=c.b;CACHE.delete(u);throw e})}
 c.n++;return{u,p:c.p}}
function libera(o){o.traverse(x=>{if(x.geometry)x.geometry.dispose();[].concat(x.material||[]).forEach(m=>{for(const k in m){const t=m[k];if(t&&t.isTexture)t.dispose()}m.dispose()})})}
function suelta(u,ya){const c=CACHE.get(u);if(!c)return;if(!ya)c.n--;if(c.n>0||!c.gl)return;CACHE.delete(u);ST.bytes-=c.b;libera(c.gl.scene)}

// ---------- lugares ----------
function vacia(L){L.t++;if(L.obj){L.g.remove(L.obj);L.obj=null}if(L.u){suelta(L.u);L.u=null}L.v=null}
async function llena(L){const q=cal();if(q==='ligero'||L.piso!==piso)return vacia(L);
 const t=++L.t;await catalogo();if(t!==L.t)return;const m=CAT.modelos[L.n];if(!m){if(!L.av){L.av=1;console.warn('[CGLB] no está en el catálogo:',L.n)}return}
 const pasos=(q==='completo'?(L.v?['hd']:['medio','hd']):['medio']).filter(v=>m[v]&&v!==L.v);
 for(const v of pasos){const k=toma(m[v]);let gl;
  try{gl=await k.p}catch(e){console.warn('[CGLB] no se pudo cargar',L.n,v,e);suelta(k.u);continue}
  if(t!==L.t){suelta(k.u);return}   // cambió el piso o la calidad mientras bajaba
  const o=gl.scene.clone(true),sb=L.o.sombra!==false&&q==='completo';
  o.traverse(x=>{if(x.isMesh){x.castShadow=sb;x.receiveShadow=q==='completo'}});
  if(L.obj)L.g.remove(L.obj);if(L.u)suelta(L.u);L.obj=o;L.u=k.u;L.v=v;L.g.add(o);
  if(L.o.listo)try{L.o.listo(o,v)}catch(e){console.error(e)}}}

// pon(piso, nombre, opciones): grupo vacío al momento (ponlo en la escena) que se llena cuando el modelo baja
function pon(p,n,o){o=o||{};const g=new THREE.Group();g.name='glb:'+n;
 if(o.pos)g.position.fromArray(o.pos);if(o.rot!=null)g.rotation.y=o.rot;if(o.esc!=null)typeof o.esc==='number'?g.scale.setScalar(o.esc):g.scale.fromArray(o.esc);
 const L={piso:p,n,o,g,obj:null,u:null,v:null,t:0};(LUG[p]=LUG[p]||[]).push(L);g.userData.glb=L;if(p===piso)llena(L);return g}
function quita(g){const L=g&&g.userData.glb;if(!L)return;vacia(L);const a=LUG[L.piso];if(a){const i=a.indexOf(L);if(i>=0)a.splice(i,1)}}

// cambio de piso: libera lo de los demás pisos y carga el nuevo
function setPiso(id){if(!id)return;piso=id;for(const p in LUG)if(p!==id)LUG[p].forEach(vacia);(LUG[id]||[]).forEach(llena)}
function setCal(){const q=cal();if(q===q0)return;q0=q;(LUG[piso]||[]).forEach(L=>{if(q!=='completo'||!L.v)vacia(L);llena(L)})}

window.CGLB={pon,quita,piso:setPiso,calidad:setCal,catalogo,mod,cargador,
 info:()=>{let n=0,hd=0;for(const p in LUG)LUG[p].forEach(L=>{if(L.obj){n++;if(L.v==='hd')hd++}});
  return{piso,calidad:cal(),origen:base===PROPIO?(LOCAL?'local':'servidor'):'jsDelivr',puestos:n,hd,archivos:CACHE.size,mb:ST.bytes/1048576,cargando:ST.carg,errores:ST.err}}};
if(window.CASA3D&&CASA3D.piso)piso=CASA3D.piso()||piso;
})();
