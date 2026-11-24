// c_vis.js — VIS: gestor único de visibilidad (CASONA.md V2). Todo lo que esconde cosas de la casa pasa por aquí con un motivo,
// así se sabe quién lo hizo. Un objeto se dibuja solo si su visible propio es true y no tiene ningún motivo duro activo.
// Motivos: cuarto (CUA), piso (corte por nivel), tapa (lo que tapa al Mii: CPB.corte, MARC.corte; luego el tramado),
// copa (CMAT: el dueño desvanece, VIS solo lo anota), trama (TRAMA: el dueño trama el material) y fuera (solo diagnóstico). copa, trama y fuera no esconden.
// VIS.ocultar(o,m) / VIS.mostrar(o,m) / VIS.poner(o,m,bool) / VIS.motivos(o) / VIS.propio(o) (visible sin motivos).
// ?vis: nada se esconde por motivo; se tiñe (rojo cuarto, azul piso, verde copa, amarillo tapa, gris fuera) y F6 lista en consola qué y por qué;
// F7 (o VIS.limites()) busca límites viejos. VIS.grandes(raíz): lo grande sin prueba de cámara (V3).
// El estado va en un WeakMap (no en userData: MRG no junta lo que tiene userData).
(function(){
if(typeof THREE==='undefined')return;
const DIAG=new URLSearchParams(location.search).has('vis');
const SUAVE={copa:1,fuera:1,trama:1},ORDEN=['tapa','trama','piso','cuarto','copa','fuera'];
const COL={cuarto:0xe0413a,piso:0x3a6be0,copa:0x3ac25a,tapa:0xf0c63a,trama:0xf0a03a,fuera:0x8a8a8a};
const ST=new WeakMap(),CON=new Set(),ORIG=new WeakMap(),MAT={};
const duro=s=>{for(const m of s.m)if(!SUAVE[m])return true;return false};
function reg(o){let s=ST.get(o);if(s)return s;s={v:o.visible,m:new Set()};ST.set(o,s);
 Object.defineProperty(o,'visible',{configurable:true,enumerable:true,get(){return s.v&&(DIAG||!s.m.size||!duro(s))},set(v){s.v=v}});return s}
function tinte(o,s){if(!DIAG)return;const k=ORDEN.find(m=>s.m.has(m)),mt=k&&(MAT[k]||(MAT[k]=new THREE.MeshBasicMaterial({color:COL[k],transparent:true,opacity:.6,depthWrite:false})));
 o.traverse(c=>{if(!c.isMesh)return;if(mt){if(!ORIG.has(c))ORIG.set(c,c.material);c.material=mt}else if(ORIG.has(c)){c.material=ORIG.get(c);ORIG.delete(c)}})}
function poner(o,m,on){if(!o)return;const s=on?reg(o):ST.get(o);if(!s||s.m.has(m)===!!on)return;
 if(on)s.m.add(m);else s.m.delete(m);if(s.m.size)CON.add(o);else CON.delete(o);tinte(o,s)}
const ocultar=(o,m)=>poner(o,m,true),mostrar=(o,m)=>poner(o,m,false);
const motivos=o=>{const s=ST.get(o);return s?[...s.m]:[]};
const propio=o=>{const s=ST.get(o);return s?s.v:o.visible};
function lista(){const L=[];for(const o of CON){if(!o.parent){CON.delete(o);continue}L.push({nombre:o.name||o.type,motivos:motivos(o).join(' '),propio:propio(o)})}
 console.table(L);const n={};L.forEach(r=>r.motivos.split(' ').forEach(m=>n[m]=(n[m]||0)+1));console.log('[vis]',n);return L}
// V3: lo grande (suelo, muros de lado a lado, pisos, techos, casco) casi siempre está en pantalla: sin prueba de cámara (frustumCulled=false)
const GR=20,bg=new THREE.Box3(),vg=new THREE.Vector3();
const esGrande=o=>{if(!o.geometry||o.isSkinnedMesh||o.isInstancedMesh)return false;o.updateWorldMatrix(true,false);bg.setFromObject(o);bg.getSize(vg);return Math.max(vg.x,vg.z)>=GR};
function grandes(R){let n=0;R.traverse(o=>{if(o.isMesh&&o.frustumCulled&&esGrande(o)){o.frustumCulled=false;n++}});return n}
// límites viejos (?vis, F7): mallas cuya esfera o caja no contiene sus vértices (se movieron sin recalcular) o sin prueba de cámara
const lb=new THREE.Box3(),lv=new THREE.Vector3();
function limites(R){R=R||(window.CASA3D&&CASA3D.sc());if(!R)return;const mal=[];let sin=0;
 R.traverse(o=>{if(!o.isMesh||!o.geometry||o.isSkinnedMesh)return;if(!o.frustumCulled){sin++;return}const g=o.geometry,P=g.attributes.position;if(!P||o.isInstancedMesh)return;
  lb.setFromBufferAttribute(P);const s=g.boundingSphere,b=g.boundingBox,e=1e-3;
  if(s){const r2=(s.radius+e)**2,st=Math.max(1,P.count>>12);for(let i=0;i<P.count;i+=st){lv.fromBufferAttribute(P,i);if(lv.distanceToSquared(s.center)>r2){mal.push({nombre:o.name||o.type,que:'esfera'});break}}}
  if(b&&(b.min.x>lb.min.x+e||b.min.y>lb.min.y+e||b.min.z>lb.min.z+e||b.max.x<lb.max.x-e||b.max.y<lb.max.y-e||b.max.z<lb.max.z-e))mal.push({nombre:o.name||o.type,que:'caja'})});
 if(mal.length)console.table(mal);console.log('[vis] límites viejos:',mal.length,'sin prueba de cámara:',sin);return mal}
if(DIAG)addEventListener('keydown',e=>{if(e.key==='F6'){e.preventDefault();lista()}if(e.key==='F7'){e.preventDefault();limites()}});
window.VIS={reg,ocultar,mostrar,poner,motivos,propio,lista,DIAG,COL,grandes,esGrande,limites};
})();
