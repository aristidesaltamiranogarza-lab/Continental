// c_casa_marcas.js — MARC: lee de un GLB de Blender los marcadores (empties) y los choques (extras), sin coordenadas a mano.
// Convención (blender/casona.py): mesa_<juego> {juego,fam,libre,r} · escalera_sube_<n>/escalera_baja_<n> {to,r,pie:[dx,dz]}
// · llegada_<n> · puerta_<x>_<n> · mallas con {seg:[ax,az,bx,bz],r} (muros, barandales) o {tipo:'columna'|'obst',r}
// · escalones con {escalera:'sube'|'baja'} · muros/dinteles/antepechos se agrupan en líneas para el corte · pisos dan los límites.
// MARC.leer(root) → {mesas,escaleras,puertas,llegada,WL,OB,lineas,escalones,caja}. MARC.corte(lineas,cam,yo) esconde muros.
(function(){
if(typeof THREE==='undefined')return;
const w=new THREE.Vector3(),bb=new THREE.Box3();
const pos=o=>(o.getWorldPosition(w),{x:+w.x.toFixed(3),y:+w.y.toFixed(3),z:+w.z.toFixed(3)});

function leer(root){root.updateMatrixWorld(true);
 const R={mesas:[],escaleras:{},puertas:{},llegada:null,WL:[],OB:[],lineas:[],escalones:{sube:[],baja:[]},caja:null};
 const lin={},cj=new THREE.Box3();let m;
 root.traverse(o=>{const u=o.userData||{},n=o.name||'';
  if(o.isMesh){
   if(u.seg)R.WL.push([...u.seg,u.r||.3]);
   else if(u.tipo==='obst'||u.tipo==='columna'){const p=pos(o);R.OB.push({x:p.x,z:p.z,r:u.r||.5})}
   if(u.escalera&&R.escalones[u.escalera])R.escalones[u.escalera].push(o);
   if(/_(piso|balcon|tierra)(_|$)/.test(n)){bb.setFromObject(o);cj.union(bb)}
   if(/_(muro|dintel|antepecho)_/.test(n)){bb.setFromObject(o);const dx=bb.max.x-bb.min.x,dz=bb.max.z-bb.min.z,h=dx>dz;
    const k=(h?'h':'v')+(h?(bb.min.z+bb.max.z)/2:(bb.min.x+bb.max.x)/2).toFixed(1),l=lin[k]||(lin[k]={h,c:+k.slice(1),a:1e9,b:-1e9,ms:[]});
    l.a=Math.min(l.a,h?bb.min.x:bb.min.z);l.b=Math.max(l.b,h?bb.max.x:bb.max.z);l.ms.push(o)}
   return}
  if(/^mesa_/.test(n)){const p=pos(o);R.mesas.push({g:u.juego||n.slice(5),x:p.x,y:p.y,z:p.z,r:u.r||2.2,fam:u.fam||(u.libre?'f':'k'),libre:!!u.libre,o})}
  else if((m=n.match(/^escalera_(sube|baja)_/))){const p=pos(o),d=u.pie||[0,0];R.escaleras[m[1]]={x:p.x,z:p.z,r:u.r||1,ax:p.x+d[0],az:p.z+d[1],to:u.to||null}}
  else if(/^llegada_/.test(n))R.llegada=pos(o);
  else if((m=n.match(/^puerta_(.+)_[^_]+$/)))R.puertas[m[1]]=pos(o)});
 R.lineas=Object.values(lin);
 if(!cj.isEmpty())R.caja=[cj.min.x,cj.max.x,cj.min.z,cj.max.z];
 return R}

// corte: líneas de muro que cruzan el segmento cámara→personaje
function cruza(l,cx,cz,px,pz){const a=l.h?cz:cx,b=l.h?pz:px;if((a-l.c)*(b-l.c)>0)return false;const t=(l.c-a)/((b-a)||1e-6),u=l.h?cx+(px-cx)*t:cz+(pz-cz)*t;return u>l.a-.5&&u<l.b+.5}
function corte(L,c,p){if(!c||!p)return;L.forEach(l=>{const v=!cruza(l,c.position.x,c.position.z,p.x,p.z);if(l.v!==v){l.v=v;l.ms.forEach(m=>m.visible=v)}})}

window.MARC={leer,corte};
})();
