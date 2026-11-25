// c_casona_junta.js — JUNTA: copia de un GLB de la casona juntada por material (una malla por material y juego de atributos).
// Para las copias que solo se ven (CFUE: los otros niveles desde el patio o desde fuera): ahí no hace falta el corte por líneas
// ni los choques, así que decenas de muros, pisos y adornos con el mismo material se dibujan en una sola llamada (celular).
// Lee también posiciones cuantizadas (KHR_mesh_quantization): todo queda en Float32 y en coordenadas del GLB. Sin normales (CMAT
// usa materiales básicos con luz horneada). Lo escondido (visible=false) no entra. JUNTA.de(raiz) → THREE.Group nuevo.
(function(){
if(typeof THREE==='undefined')return;
const v=new THREE.Vector3(),comp=(a,i,j)=>j===0?a.getX(i):j===1?a.getY(i):j===2?a.getZ(i):a.getW(i);   // getX..W desnormalizan (cuantizado) y sirven con intercalados
function visible(o,raiz){for(let p=o;p&&p!==raiz.parent;p=p.parent)if(!p.visible)return false;return true}
function de(raiz){raiz.updateMatrixWorld(true);const G=new THREE.Group(),grupos=new Map();
 raiz.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||Array.isArray(o.material)||!visible(o,raiz))return;
  const g=o.geometry;if(!g.attributes.position)return;const ks=Object.keys(g.attributes).filter(k=>k!=='normal').sort();
  const k=o.material.uuid+'|'+ks.join(',')+'|'+ks.map(n=>g.attributes[n].itemSize).join(',');
  let e=grupos.get(k);if(!e)grupos.set(k,e={m:o.material,ks,l:[]});e.l.push(o)});
 grupos.forEach(({m,ks,l})=>{let nv=0,ni=0;
  l.forEach(o=>{const g=o.geometry,n=g.attributes.position.count;nv+=n;ni+=g.index?g.index.count:n});
  const out={},tam={};ks.forEach(k=>{tam[k]=l[0].geometry.attributes[k].itemSize;out[k]=new Float32Array(nv*tam[k])});
  const idx=nv>65535?new Uint32Array(ni):new Uint16Array(ni);let ov=0,oi=0;
  l.forEach(o=>{const g=o.geometry,n=g.attributes.position.count;
   ks.forEach(k=>{const a=g.attributes[k],s=tam[k],d=out[k];
    if(k==='position')for(let i=0;i<n;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);d[(ov+i)*3]=v.x;d[(ov+i)*3+1]=v.y;d[(ov+i)*3+2]=v.z}
    else for(let i=0;i<n;i++)for(let j=0;j<s;j++)d[(ov+i)*s+j]=comp(a,i,j)});
   if(g.index)for(let i=0;i<g.index.count;i++)idx[oi++]=g.index.getX(i)+ov;else for(let i=0;i<n;i++)idx[oi++]=ov+i;
   ov+=n});
  const g=new THREE.BufferGeometry();ks.forEach(k=>g.setAttribute(k,new THREE.BufferAttribute(out[k],tam[k])));g.setIndex(new THREE.BufferAttribute(idx,1));
  g.computeBoundingSphere();g.computeBoundingBox();
  const M=new THREE.Mesh(g,m);M.name='junta_'+(m.name||'m');M.matrixAutoUpdate=false;M.raycast=()=>{};G.add(M)});
 return G}
window.JUNTA={de};
})();
