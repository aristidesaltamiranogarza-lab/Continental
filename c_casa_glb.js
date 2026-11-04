// c_casa_glb.js — CGLB: modelos .glb de la casa (texturas KTX2, geometría meshopt) con el THREE global de three.min.js.
// Puente: los cargadores de three (GLTFLoader, KTX2Loader) son módulos que importan 'three'; se bajan de jsDelivr (o unpkg) como texto,
// se cambia 'three' por un módulo que reexporta window.THREE y se cargan como blob. Así no hace falta importmap ni bundler.
// Calidad: ligero = sin modelos; medio = versión Medio; completo = primero Medio y en segundo plano se cambia a HD.
// Solo se cargan los modelos del piso donde estás; al cambiar de piso se libera la memoria del anterior.
// Origen: en localhost los archivos locales (modelos/); fuera, jsDelivr con la etiqueta del catálogo; si jsDelivr falla, el servidor.
// D7: en Medio cada modelo de piso lleva sombra falsa (mancha); las copias del mismo modelo se dibujan como instancias (opción inst:false
// para lo que se mueve); si se acaba la memoria con HD, los modelos se quedan en Medio 7 días (CGLB.hd(true) lo regresa).
//   const g=CGLB.pon('pb','silla_madera',{pos:[1,0,2],rot:Math.PI/2,esc:1,sombra:true,listo:(obj,ver)=>{}});  escena.add(g);
(function(){
const TV='0.160.0',CDN=['https://cdn.jsdelivr.net/npm/three@'+TV+'/examples/jsm/','https://unpkg.com/three@'+TV+'/examples/jsm/'],REPO='aristidesaltamiranogarza-lab/Continental';
const H=location.hostname,LOCAL=location.protocol==='file:'||/^(localhost|127\.0\.0\.1|\[::1\])$/.test(H)||/\.(localhost|test)$/.test(H);
const PROPIO=new URL('modelos/',location.href).href;
let CAT=null,catP=null,base=PROPIO,ldP=null,piso='pb',q0=null;
const LUG={},CACHE=new Map(),ST={bytes:0,ok:0,err:0,carg:0};   // LUG: piso -> lugares; CACHE: url -> {p, n (usos), gl, b (bytes)}
const cal=()=>{const q=window.CALIDAD;return q==='completo'||q==='medio'?q:'ligero'};

// ---------- puente de módulos ----------
let shim=null;const BL=new Map();
const blob=t=>URL.createObjectURL(new Blob([t],{type:'text/javascript'}));
function shimURL(){if(!shim){const k=Object.keys(window.THREE).filter(x=>/^[A-Za-z_$][\w$]*$/.test(x));shim=blob('const T=window.THREE;export const {'+k.join(',')+'}=T;export default T;')}return shim}
// import/export al inicio de línea; entre la palabra y 'from' solo nombres, llaves, comas y * (así no cruza código ni textos)
const IMP=()=>/^[ \t]*(?:import|export)\s*(?:[\w$\s{},*]*?\bfrom\s*)?(['"])([^'"\n]+)\1/gm;
const espera=ms=>new Promise(ok=>setTimeout(ok,ms));
function trae(u,n){return fetch(u).then(r=>{if(!r.ok)throw Error(r.status+' '+u);return r.text()},e=>{if(n>0)return espera(700).then(()=>trae(u,n-1));throw e})}
function modBlob(u){if(BL.has(u))return BL.get(u);
 const p=trae(u,2).then(async t=>{const dep=new Map();
  for(const m of t.matchAll(IMP())){const s=m[2];if(s!=='three'&&/^\.{0,2}\//.test(s)&&!dep.has(s))dep.set(s,modBlob(new URL(s,u).href))}
  for(const [s,pp] of dep)dep.set(s,await pp);
  return blob(t.replace(IMP(),(a,c,s)=>{const x=s==='three'?shimURL():dep.get(s);return x?a.slice(0,a.length-s.length-2)+c+x+c:a}))});
 BL.set(u,p);p.catch(()=>BL.delete(u));return p}   // lo que falla se olvida: el siguiente intento lo vuelve a bajar
let JSM=null;   // CDN que funcionó; si jsDelivr no responde se usa unpkg (de ahí viene three.min.js)
function mod(r){const bs=JSM?[JSM]:CDN;let i=0;
 const va=()=>modBlob(bs[i]+r).then(u=>import(u)).then(M=>{JSM=JSM||bs[i];return M},e=>{if(++i<bs.length){console.warn('[CGLB] '+r+': '+bs[i-1]+' falló, pruebo '+bs[i],e);return va()}throw e});
 return va()}

// cargador único (GLTF + KTX2 + meshopt); el KTX2 necesita el renderer para saber qué compresión aguanta la tarjeta
function cargador(){return ldP||(ldP=Promise.all([mod('loaders/GLTFLoader.js'),mod('loaders/KTX2Loader.js'),mod('libs/meshopt_decoder.module.js')]).then(([G,K,M])=>{
 const L=new G.GLTFLoader(),k=new K.KTX2Loader().setTranscoderPath((JSM||CDN[0])+'libs/basis/'),R=window.CASA3D&&CASA3D.R&&CASA3D.R();
 if(R)k.detectSupport(R);
 if(R&&!R.domElement._cglb){R.domElement._cglb=1;R.domElement.addEventListener('webglcontextlost',()=>{if(cal()==='completo')bajaHD('se perdió el contexto WebGL')})}
 L.setKTX2Loader(k);L.setMeshoptDecoder(M.MeshoptDecoder);return L}).catch(e=>{ldP=null;throw e}))}

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

// ---------- memoria: HD solo mientras alcance ----------
// Se baja a Medio si la página se cerró a la fuerza cargando HD (iPhone sin memoria: Safari la recarga), si se pierde el contexto WebGL,
// si un HD falla por memoria o si la memoria de JS pasa del 90 %. Antes de eso no se baja nada.
const ls={g(k){try{return localStorage.getItem(k)}catch(e){return null}},s(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
let SIN=+(ls.g('casa_sin_hd')||0)>Date.now()-6048e5?'memoria':'',HDN=0,hdT=0;
function bajaHD(m){if(SIN)return;SIN=m;ls.s('casa_sin_hd',String(Date.now()));console.warn('[CGLB] modelos en Medio: '+m);
 (LUG[piso]||[]).forEach(L=>{if(L.v==='hd'){vacia(L);llena(L)}})}
// casa_hd_vivo: prendido mientras baja HD y 4 s más (el golpe de memoria llega al subirlo a la tarjeta); un cierre normal lo apaga
function hdVa(d){HDN+=d;clearTimeout(hdT);if(HDN>0)ls.s('casa_hd_vivo','1');else hdT=setTimeout(()=>{if(!HDN)ls.s('casa_hd_vivo',null)},4000)}
addEventListener('pagehide',()=>ls.s('casa_hd_vivo',null));
document.addEventListener('visibilitychange',()=>ls.s('casa_hd_vivo',document.hidden||!HDN?null:'1'));

// ---------- sombras falsas (Medio) e instancias ----------
let TMP=null,SBL=null;const tmp=()=>TMP||(TMP={b:new THREE.Box3(),b2:new THREE.Box3(),m:new THREE.Matrix4(),m2:new THREE.Matrix4(),v:new THREE.Vector3()});
function mancha(){if(SBL)return SBL;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),r=x.createRadialGradient(32,32,2,32,32,32);
 r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(.6,'rgba(0,0,0,.24)');r.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=r;x.fillRect(0,0,64,64);
 const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
 return SBL={g,m:new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})}}
// mancha bajo el modelo, a la altura del piso (o de la mesa donde está); lo colgado o en la pared (base arriba de 1.3) no lleva
function falsa(o,L){if(L.o.sombra===false||L.o.falsa===false)return;const g=L.g,sy=g.scale.y||1,T=tmp();
 o.updateMatrixWorld(true);T.m.copy(o.matrixWorld).invert();T.b.makeEmpty();
 o.traverse(x=>{if(!x.isMesh)return;const G=x.geometry;if(!G.boundingBox)G.computeBoundingBox();T.b.union(T.b2.copy(G.boundingBox).applyMatrix4(T.m2.multiplyMatrices(T.m,x.matrixWorld)))});
 if(T.b.isEmpty())return;const y=Math.max(T.b.min.y,-g.position.y/sy);if(g.position.y+y*sy>1.3)return;
 const S=mancha(),m=new THREE.Mesh(S.g,S.m);T.b.getSize(T.v);m.scale.set(T.v.x*1.3,1,T.v.z*1.3);
 m.position.set((T.b.min.x+T.b.max.x)/2,y+.012/sy,(T.b.min.z+T.b.max.z)/2);m.name='sombra';m.renderOrder=-1;o.add(m)}
// copias del mismo modelo (y todas las manchas) del piso en una sola llamada; las piezas originales se esconden pero se quedan en su lugar
const INS=[],OCU=[];let jT=0;
function deshaz(){clearTimeout(jT);INS.forEach(m=>{if(m.parent)m.parent.remove(m);m.dispose()});OCU.forEach(x=>x.visible=true);INS.length=OCU.length=0}
function pideJunta(){clearTimeout(jT);jT=setTimeout(junta,300)}
const vis=(x,h)=>{for(;x&&x!==h;x=x.parent)if(!x.visible)return false;return true};
function junta(){deshaz();const P=new Map(),T=tmp();
 (LUG[piso]||[]).forEach(L=>{if(!L.obj||L.o.inst===false||!vis(L.g))return;let r=L.g;while(r.parent)r=r.parent;if(r===L.g)return;
  L.obj.traverse(x=>{if(!x.isMesh||x.isInstancedMesh||x.isSkinnedMesh||x.morphTargetInfluences||!vis(x,L.g))return;
   const k=r.uuid+x.geometry.uuid+[].concat(x.material).map(m=>m.uuid).join();let e=P.get(k);if(!e)P.set(k,e={r,x:[]});e.x.push(x)})});
 const rs=new Set();P.forEach(e=>{if(e.x.length>1&&!rs.has(e.r)){rs.add(e.r);e.r.updateMatrixWorld(true)}});
 P.forEach(e=>{if(e.x.length<2)return;const a=e.x[0],m=new THREE.InstancedMesh(a.geometry,a.material,e.x.length);T.m.copy(e.r.matrixWorld).invert();
  e.x.forEach((x,i)=>{m.setMatrixAt(i,T.m2.multiplyMatrices(T.m,x.matrixWorld));x.visible=false;OCU.push(x)});
  m.castShadow=a.castShadow;m.receiveShadow=a.receiveShadow;m.renderOrder=a.renderOrder;m.name='glb:copias';m.computeBoundingSphere();e.r.add(m);INS.push(m)})}

// ---------- lugares ----------
function vacia(L){L.t++;if(L.obj){deshaz();L.g.remove(L.obj);L.obj=null;pideJunta()}if(L.u){suelta(L.u);L.u=null}L.v=null}
// tiempo hasta que el piso tiene todos sus modelos (el primero cuenta desde que se abrió la página)
let CN=0,tI=0,mide=true,tL=0;
async function llena(L){CN++;try{await llena0(L)}finally{if(!--CN&&mide){tL=performance.now()-tI;mide=false}}}
async function llena0(L){const q=cal();if(q==='ligero'||L.piso!==piso)return vacia(L);
 const t=++L.t;await catalogo();if(t!==L.t)return;const m=CAT.modelos[L.n];if(!m){if(!L.av){L.av=1;console.warn('[CGLB] no está en el catálogo:',L.n)}return}
 const pasos=(q==='completo'&&!SIN?(L.v?['hd']:['medio','hd']):['medio']).filter(v=>m[v]&&v!==L.v);
 for(const v of pasos){const k=toma(m[v]),hd=v==='hd';let gl;if(hd)hdVa(1);
  try{gl=await k.p}catch(e){if(hd&&(e instanceof RangeError||/memory|alloc/i.test(e&&e.message)))bajaHD('un modelo HD no cupo');console.warn('[CGLB] no se pudo cargar',L.n,v,e);suelta(k.u);continue}finally{if(hd)hdVa(-1)}
  if(t!==L.t||hd&&SIN){suelta(k.u);return}   // cambió el piso o la calidad mientras bajaba, o se acabó la memoria
  const o=gl.scene.clone(true),sb=L.o.sombra!==false&&q==='completo';
  o.traverse(x=>{if(x.isMesh){x.castShadow=sb;x.receiveShadow=q==='completo'}});
  deshaz();if(L.obj)L.g.remove(L.obj);if(L.u)suelta(L.u);L.obj=o;L.u=k.u;L.v=v;L.g.add(o);
  if(L.o.listo)try{L.o.listo(o,v)}catch(e){console.error(e)}
  if(q==='medio')falsa(o,L);pideJunta();
  if(hd){const M=performance.memory;if(M&&M.usedJSHeapSize>M.jsHeapSizeLimit*.9)bajaHD('memoria de JS al 90 %')}}}

// pon(piso, nombre, opciones): grupo vacío al momento (ponlo en la escena) que se llena cuando el modelo baja
function pon(p,n,o){o=o||{};const g=new THREE.Group();g.name='glb:'+n;
 if(o.pos)g.position.fromArray(o.pos);if(o.rot!=null)g.rotation.y=o.rot;if(o.esc!=null)typeof o.esc==='number'?g.scale.setScalar(o.esc):g.scale.fromArray(o.esc);
 const L={piso:p,n,o,g,obj:null,u:null,v:null,t:0};(LUG[p]=LUG[p]||[]).push(L);g.userData.glb=L;if(p===piso)llena(L);return g}
function quita(g){const L=g&&g.userData.glb;if(!L)return;vacia(L);const a=LUG[L.piso];if(a){const i=a.indexOf(L);if(i>=0)a.splice(i,1)}}

// cambio de piso: libera lo de los demás pisos y carga el nuevo
function setPiso(id){if(!id)return;if(id!==piso){tI=performance.now();mide=true}piso=id;for(const p in LUG)if(p!==id)LUG[p].forEach(vacia);(LUG[id]||[]).forEach(llena)}
function setCal(){const q=cal();if(q===q0)return;q0=q;(LUG[piso]||[]).forEach(L=>{if(q!=='completo'||!L.v)vacia(L);llena(L)})}

window.CGLB={pon,quita,piso:setPiso,calidad:setCal,catalogo,mod,cargador,
 hd:on=>{if(on===false)return bajaHD('a mano');SIN='';ls.s('casa_sin_hd',null);if(cal()==='completo')(LUG[piso]||[]).forEach(llena)},
 info:()=>{let n=0,hd=0;for(const p in LUG)LUG[p].forEach(L=>{if(L.obj){n++;if(L.v==='hd')hd++}});
  return{piso,calidad:cal(),origen:base===PROPIO?(LOCAL?'local':'servidor'):'jsDelivr',puestos:n,hd,archivos:CACHE.size,mb:ST.bytes/1048576,cargando:ST.carg,errores:ST.err,
   listo:mide?(CN?null:0):tL,copias:INS.length?[OCU.length,INS.length]:null,sinHD:SIN}}};
if(window.CASA3D&&CASA3D.piso)piso=CASA3D.piso()||piso;
if(ls.g('casa_hd_vivo')){ls.s('casa_hd_vivo',null);bajaHD('la página se cerró cargando HD')}
})();
