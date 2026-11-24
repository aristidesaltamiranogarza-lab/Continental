// MRG: junta en una sola malla las piezas quietas de la casa que se ven igual (menos dibujos por cuadro).
// Cada 2 s revisa la escena de la casa. Junta dentro del grupo más alto posible (T) sin cruzar grupos que se mueven o se ocultan.
// En la planta baja (con CUA) los grupos quietos de un mismo cuarto se juntan entre sí: la malla va en la escena, ligada a ese cuarto.
// Las originales se quedan (ocultas) para clics y código. Si una pieza se mueve, se muestra o cambia de material, su malla se
// deshace y esa pieza ya no se junta; si cambia un grupo intermedio, se deshace y se vuelve a juntar debajo de ese grupo.
// Si solo cambia el color, se hornea en los vértices. Apagar: ?nomerge o MRG.off(true) (se guarda).
(function(){
let off=/[?&]nomerge\b/.test(location.search);try{if(localStorage.getItem('mrg_off'))off=true}catch(e){}
const grupos=[];let iv=0;
const NO=new WeakSet(),DIN=new WeakSet(),OC=new WeakSet();   // OC: piezas que ya esconde una malla junta   // NO: piezas que se movieron; DIN: grupos que se mueven u ocultan
const PROPS=['color','emissive','specular','sheenColor','attenuationColor'],NUM=['roughness','metalness','emissiveIntensity','opacity','alphaTest','shininess','clearcoat','sheen','transmission','envMapIntensity','aoMapIntensity','lightMapIntensity','normalScale','bumpScale','displacementScale','reflectivity','flatShading','vertexColors','side','transparent','depthWrite','depthTest','toneMapped','fog','wireframe','polygonOffset','polygonOffsetFactor','polygonOffsetUnits','blending','colorWrite','visible'];
const MAPS=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','lightMap','alphaMap','bumpMap','displacementMap','envMap','specularMap','matcap','gradientMap'];
function clave(m,sinColor){let k=m.type;for(const p of PROPS)if(m[p]&&m[p].isColor&&!(sinColor&&p==='color'))k+='|'+m[p].getHexString();
 for(const p of NUM)if(m[p]!==undefined){const v=m[p];k+='|'+(v&&v.isVector2?v.x+','+v.y:v)}
 for(const p of MAPS)if(m[p])k+='|'+m[p].uuid+(m[p].version||0);return k}
function firma(g){return Object.keys(g.attributes).sort().map(n=>n+g.attributes[n].itemSize).join(',')}
function sombra(o){return ''+o.castShadow+o.receiveShadow+o.renderOrder+o.frustumCulled+o.layers.mask}
const FN=new WeakMap(),fl=f=>{let n=FN.get(f);if(n===undefined)FN.set(f,n=f.toString().length);return n};   // largo del código de una función (se calcula una vez)
function apto(o){if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||NO.has(o)||OC.has(o))return false;
 if(Object.keys(o.userData).some(k=>k!=='hit'&&k!=='name'))return false;   // con userData: algo la usa (cartas); 'hit' de la casa solo se usa con rayos; 'name' lo pone GLTFLoader (casona)
 if(o.children.length||!vis(o)||Array.isArray(o.material)||!o.material||o.morphTargetInfluences)return false;
 const m=o.material;if(m.isShaderMaterial||m.onBeforeCompile&&fl(m.onBeforeCompile)>20||m.transparent)return false;
 const g=o.geometry;if(!g||!g.attributes.position||!g.attributes.normal||Object.keys(g.morphAttributes).length)return false;
 return fl(o.onBeforeRender)<30}
const llano=x=>x&&!x.isScene&&!x.isBone&&!x.isMesh&&(x.type==='Group'||x.type==='Object3D')&&!Object.keys(x.userData).length&&x.name!=='Personaje'&&!DIN.has(x);
function enHueso(o){for(let p=o.parent;p;p=p.parent){if(p.isBone||p.name==='Personaje'||p.isSkinnedMesh)return true}return false}
// visible propio: con CUA (cuartos de la planta baja) un objeto puede estar oculto solo porque su cuarto no se ve
const vis=o=>window.CUA?CUA.vis(o):o.visible;
// cuarto de la planta baja donde puede juntarse con piezas de otros grupos (-1: no)
const cuartoDe=o=>window.CUA&&window.CASA3D&&CASA3D.piso&&(CUA.hay?CUA.hay(CASA3D.piso()):CASA3D.piso()==='pb')?CUA.de(o):-1;
function destino(o){let T=o.parent;const anc=[];   // sube mientras el grupo actual pueda quedar en medio
 while(llano(T)&&T.parent&&!T.parent.isScene&&vis(T)){anc.push(T);T=T.parent}
 // en la planta baja, los grupos de un mismo cuarto se juntan entre sí (la malla queda en la escena, ligada a ese cuarto)
 let r=-1;if(llano(T)&&T.parent&&T.parent.isScene&&vis(T)){r=cuartoDe(T);if(r>=0){anc.push(T);T=T.parent}else if(CUA.esAbre&&CUA.esAbre(T))r=cuartoDe(o)}else if(T&&T.isScene)r=cuartoDe(o);   // GLB de la casona (CUA.abre): por cuarto dentro del grupo
 return{T,anc,r}}
function pose(o){const a=o.position,q=o.quaternion,s=o.scale;return [a.x,a.y,a.z,q.x,q.y,q.z,q.w,s.x,s.y,s.z]}
function igual(o,p){const a=o.position,q=o.quaternion,s=o.scale;return a.x===p[0]&&a.y===p[1]&&a.z===p[2]&&q.x===p[3]&&q.y===p[4]&&q.z===p[5]&&q.w===p[6]&&s.x===p[7]&&s.y===p[8]&&s.z===p[9]}
const Mi=new THREE.Matrix4(),Mr=new THREE.Matrix4();
function junta(lista,T,hornea){   // geometría en las coordenadas de T; hornea: el color de cada material va a los vértices
 const names=Object.keys(lista[0].geometry.attributes);if(hornea)names.push('color');let nv=0,ni=0;
 for(const o of lista){const g=o.geometry;nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count}
 const out=new THREE.BufferGeometry(),buf={},isz=n=>n==='color'&&hornea?3:lista[0].geometry.attributes[n].itemSize;for(const n of names)buf[n]=new Float32Array(nv*isz(n));
 const idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni);let v0=0,i0=0;const nm=new THREE.Matrix3(),t=new THREE.Vector3();
 Mi.copy(T.matrixWorld).invert();
 for(const o of lista){const g=o.geometry,M=Mr.multiplyMatrices(Mi,o.matrixWorld),c=g.attributes.position.count,neg=M.determinant()<0;nm.getNormalMatrix(M);
  for(const n of names){const d=buf[n];if(n==='color'&&hornea){const k=o.material.color;for(let i=0,j=v0*3;i<c;i++,j+=3){d[j]=k.r;d[j+1]=k.g;d[j+2]=k.b}continue}
   const a=g.attributes[n],s=a.itemSize;
   for(let i=0;i<c;i++){if(n==='position'){t.fromBufferAttribute(a,i).applyMatrix4(M);const j=(v0+i)*3;d[j]=t.x;d[j+1]=t.y;d[j+2]=t.z}
    else if(n==='normal'){t.fromBufferAttribute(a,i).applyMatrix3(nm).normalize();const j=(v0+i)*3;d[j]=t.x;d[j+1]=t.y;d[j+2]=t.z}
    else for(let k=0;k<s;k++)d[(v0+i)*s+k]=a.getComponent(i,k)}}
  const n=g.index?g.index.count:c;for(let i=0;i<n;i+=3){const a=g.index?g.index.getX(i):i,b=g.index?g.index.getX(i+1):i+1,e=g.index?g.index.getX(i+2):i+2;
   idx[i0+i]=v0+a;idx[i0+i+1]=v0+(neg?e:b);idx[i0+i+2]=v0+(neg?b:e)}
  v0+=c;i0+=n}
 for(const n of names){const a=lista[0].geometry.attributes[n];out.setAttribute(n,new THREE.BufferAttribute(buf[n],isz(n),!!(a&&a.normalized&&!(n==='color'&&hornea))))}
 out.setIndex(new THREE.BufferAttribute(idx,1));out.computeBoundingSphere();out.computeBoundingBox();return out}
// material de las mallas juntas: una copia por clave, compartida entre grupos (menos cambios de material); si cambia el original, vigila deshace el grupo
const MATS=new Map();
function matDe(src,h){const k=(h?'c#':'')+clave(src,h);let e=MATS.get(k);if(!e){const m=src.clone();if(h){m.color.set(0xffffff);m.vertexColors=true}MATS.set(k,e={m,n:0,k})}e.n++;return e}
function suelta(e){if(--e.n<=0){MATS.delete(e.k);e.m.dispose()}}
function oculta(o,G){const d=Object.getOwnPropertyDescriptor(o,'visible'),acc=d&&d.get;let vv=acc?vis(o):true;OC.add(o);   // acc: ya trae un visible con get/set (CUA)
 Object.defineProperty(o,'visible',{configurable:true,get:()=>G.vivo?false:acc?d.get.call(o):vv,set:v=>{if(acc)d.set.call(o,v);if(G.vivo&&v!==vv){vv=v;NO.add(o);deshaz(G)}else vv=v}});
 return()=>{OC.delete(o);if(acc)Object.defineProperty(o,'visible',d);else{delete o.visible;o.visible=vv}}}
function deshaz(G){if(!G.vivo)return;G.vivo=false;G.malla.parent&&G.malla.parent.remove(G.malla);G.malla.geometry.dispose();if(G.me)suelta(G.me);
 G.items.forEach(it=>it.res());const i=grupos.indexOf(G);if(i>=0)grupos.splice(i,1)}
// 0: nada; si una pieza cambió se marca NO; si un grupo intermedio cambió se marca DIN
function revisa(G){if(!G.malla.parent)return true;
 for(const a of G.anc)if(vis(a.o)!==a.v||a.o.parent!==a.pa||!igual(a.o,a.p)){DIN.add(a.o);return true}
 for(const it of G.items){const o=it.o;if(o.parent!==it.pa||o.material!==it.mat||o.geometry!==it.geo||!igual(o,it.p)){NO.add(o);return true}}
 return false}
function pasada(){if(off||!window.CASA3D||!CASA3D.sc)return;const sc=CASA3D.sc();if(!sc)return;sc.updateMatrixWorld();
 const dest=new Map();
 sc.traverse(o=>{if(!o.parent||!apto(o)||enHueso(o))return;const d=destino(o),dk=d.T.isScene?'r'+d.r:d.r>=0?d.T.uuid+'r'+d.r:d.T;let e=dest.get(dk);if(!e)dest.set(dk,e={T:d.T,r:d.r,l:[],anc:new Set()});e.l.push(o);d.anc.forEach(a=>e.anc.add(a))});
 dest.forEach(e=>{const T=e.T;if(e.l.length<2||T.isBone)return;const cub=new Map();
  for(const o of e.l){const k=clave(o.material)+'#'+firma(o.geometry)+'#'+sombra(o);(cub.get(k)||cub.set(k,[]).get(k)).push(o)}
  // las que quedaron solas se juntan si solo cambia el color (se hornea en los vértices)
  const solas=new Map();cub.forEach((l,k)=>{if(l.length>1)return;const o=l[0],m=o.material;
   if(!m.color||m.vertexColors||o.geometry.attributes.color||!(m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial||m.isMeshBasicMaterial))return;
   const k2=clave(m,true)+'#'+firma(o.geometry)+'#'+sombra(o);(solas.get(k2)||solas.set(k2,[]).get(k2)).push(o);cub.delete(k)});
  solas.forEach((l,k)=>{if(l.length>1)cub.set('c#'+k,l)});
  const anc=[...e.anc].map(a=>({o:a,v:vis(a),pa:a.parent,p:pose(a)}));
  cub.forEach((l,k)=>{if(l.length<2)return;const G={vivo:true,items:[],anc:anc.filter(a=>l.some(o=>{for(let p=o.parent;p&&p!==T;p=p.parent)if(p===a.o)return true;return false}))},h=k.startsWith('c#');
   G.me=matDe(l[0].material,h);const mat=G.me.m;
   const m=new THREE.Mesh(junta(l,T,h),mat);m.castShadow=l[0].castShadow;m.receiveShadow=l[0].receiveShadow;m.renderOrder=l[0].renderOrder;m.frustumCulled=l[0].frustumCulled&&!(window.VIS&&VIS.esGrande(m));m.layers.mask=l[0].layers.mask;
   m.userData._mrg=true;m.raycast=()=>{};m.name='mrg';G.malla=m;
   m.onBeforeRender=()=>{if(G.vivo&&revisa(G))queueMicrotask(()=>deshaz(G))};   // cada cuadro que se dibuja
   // límites: junta() ya calcula esfera y caja; la malla juntada nunca se mueve (si una pieza se mueve, revisa deshace el grupo), así que no envejecen
   for(const o of l)G.items.push({o,pa:o.parent,p:pose(o),mat:o.material,k:clave(o.material),geo:o.geometry,res:null});
   G.items.forEach(it=>{it.res=oculta(it.o,G)});T.add(m);if(e.r>=0&&window.CUA)CUA.ligar(m,e.r);grupos.push(G)})})}
// las que no se dibujan (fuera de cámara) se revisan por partes: ~1/8 cada 120 ms, con el color del material
function vigila(){if(!grupos.length)return;const n=Math.max(1,Math.ceil(grupos.length/8));
 for(let j=0;j<n&&grupos.length;j++){iv=iv%grupos.length;const G=grupos[iv++];let roto=revisa(G);
  if(!roto)for(const it of G.items){if(it.k===undefined)it.k=clave(it.o.material);else if(clave(it.o.material)!==it.k){NO.add(it.o);roto=true;break}}
  if(roto)deshaz(G)}}
setInterval(pasada,2000);setInterval(vigila,120);
window.MRG={off(v){off=!!v;try{v?localStorage.setItem('mrg_off','1'):localStorage.removeItem('mrg_off')}catch(e){}if(v)grupos.slice().forEach(deshaz)},
 info:()=>({mallas:grupos.length,materiales:MATS.size,piezas:grupos.reduce((s,G)=>s+G.items.length,0)}),pasada};
})();
