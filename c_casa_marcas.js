// c_casa_marcas.js — MARC: lee de un GLB de Blender los marcadores (empties) y los choques (extras), sin coordenadas a mano.
// Convención (blender/casona.py): mesa_<juego> {juego,fam,libre,r} · escalera_sube_<n>/escalera_baja_<n> {to,r,pie:[dx,dz]}
// · llegada_<n> · llegada_escalera_<n> (donde apareces al subir o bajar) · plano_<lugar>_<n> {ry} (plano "Ir a" en el muro) · puerta_<x>_<n> · accion_<cosa>_<n> {r} (se toca: mipj abre Mi personaje, radio la música) · mallas con {seg:[ax,az,bx,bz],r} o {segs:[ax,az,bx,bz,...],r} (muros, barandales, muebles),
// {obs:[x,z,r,...]} o {tipo:'columna'|'obst',r} · escalones con {escalera:'sube'|'baja'} · muros/dinteles/antepechos se agrupan
// en líneas para el corte (por el extra linea si lo traen; si no, por su eje) · pisos dan los límites.
// MARC.leer(root) → {mesas,escaleras,puertas,llegada,llegadaEsc,planos,WL,OB,lineas,escalones,caja}. MARC.corte(lineas,cam,yo) esconde muros.
(function(){
if(typeof THREE==='undefined')return;
const w=new THREE.Vector3(),bb=new THREE.Box3();
const pos=o=>(o.getWorldPosition(w),{x:+w.x.toFixed(3),y:+w.y.toFixed(3),z:+w.z.toFixed(3)});

function leer(root){root.updateMatrixWorld(true);
 const R={mesas:[],acciones:[],escaleras:{},puertas:{},llegada:null,llegadaEsc:null,planos:[],WL:[],OB:[],lineas:[],escalones:{sube:[],baja:[]},caja:null};
 const lin={},cj=new THREE.Box3(),peg=[];let m;
 root.traverse(o=>{const u=o.userData||{},n=o.name||'';
  if(o.isMesh){if(u.pega)peg.push(o);
   if(u.seg)R.WL.push([...u.seg,u.r||.3]);
   if(u.segs)for(let i=0;i+3<u.segs.length;i+=4)R.WL.push([u.segs[i],u.segs[i+1],u.segs[i+2],u.segs[i+3],u.r||.3]);
   if(u.obs)for(let i=0;i+2<u.obs.length;i+=3)R.OB.push({x:u.obs[i],z:u.obs[i+1],r:u.obs[i+2]});
   else if(!u.seg&&!u.segs&&(u.tipo==='obst'||u.tipo==='columna')){const p=pos(o);R.OB.push({x:p.x,z:p.z,r:u.r||.5})}
   if(u.escalera&&R.escalones[u.escalera])R.escalones[u.escalera].push(o);
   if(/_(piso|balcon|tierra)(_|$)/.test(n)){bb.setFromObject(o);cj.union(bb)}
   if(/_(muro|dintel|antepecho)_/.test(n)){bb.setFromObject(o);const h=bb.max.x-bb.min.x>bb.max.z-bb.min.z;
    const k=u.linea?'L'+u.linea:(h?'h':'v')+(h?(bb.min.z+bb.max.z)/2:(bb.min.x+bb.max.x)/2).toFixed(1),l=lin[k]||(lin[k]={u:new THREE.Box3(),cu:null,ms:[]});
    l.u.union(bb);if(u.seg||u.segs)(l.cu||(l.cu=new THREE.Box3())).union(bb);l.ms.push(o)}
   return}
  if(/^mesa_/.test(n)){const p=pos(o);R.mesas.push({g:u.juego||n.slice(5),x:p.x,y:p.y,z:p.z,r:u.r||2.2,fam:u.fam||(u.libre?'f':'k'),libre:!!u.libre,o})}
  else if((m=n.match(/^escalera_(sube|baja)_/))){const p=pos(o),d=u.pie||[0,0];R.escaleras[m[1]]={x:p.x,z:p.z,r:u.r||1,ax:p.x+d[0],az:p.z+d[1],to:u.to||null}}
  else if(/^llegada_escalera_/.test(n))R.llegadaEsc=pos(o);
  else if(/^llegada_/.test(n))R.llegada=pos(o);
  else if((m=n.match(/^plano_(.+)_[^_]+$/))){const p=pos(o);R.planos.push({k:m[1],x:p.x,y:p.y,z:p.z,ry:+(u.ry||0)})}
  else if((m=n.match(/^puerta_(.+)_[^_]+$/)))R.puertas[m[1]]=pos(o);
  else if((m=n.match(/^accion_(.+)_[^_]+$/))){const p=pos(o);R.acciones.push({k:m[1],x:p.x,y:p.y,z:p.z,r:+(u.r||1)})}});   // paso 9: espejo, radio (se tocan)
 // cada línea: eje y centro del cuerpo del muro (el que choca), largo de todo lo que cuelga de ella
 R.lineas=Object.values(lin).map(g=>{const b=g.cu||g.u,h=b.max.x-b.min.x>b.max.z-b.min.z;
  return {h,c:h?(b.min.z+b.max.z)/2:(b.min.x+b.max.x)/2,a:h?g.u.min.x:g.u.min.z,b:h?g.u.max.x:g.u.max.z,ms:g.ms}});
 // lo que cuelga de un muro sin ser muro (extra pega=[x,z], un punto del muro): se esconde con su línea
 peg.forEach(o=>{const [x,z]=o.userData.pega,l=R.lineas.find(l=>Math.abs(l.c-(l.h?z:x))<.5&&(l.h?x:z)>=l.a&&(l.h?x:z)<=l.b);if(l)l.ms.push(o)});
 if(!cj.isEmpty())R.caja=[cj.min.x,cj.max.x,cj.min.z,cj.max.z];
 return R}

// corte: líneas de muro que cruzan el segmento cámara→personaje
function cruza(l,cx,cz,px,pz){const a=l.h?cz:cx,b=l.h?pz:px;if((a-l.c)*(b-l.c)>0)return false;const t=(l.c-a)/((b-a)||1e-6),u=l.h?cx+(px-cx)*t:cz+(pz-cz)*t;return u>l.a-.5&&u<l.b+.5}
function corte(L,c,p){if(!c||!p)return;L.forEach(l=>{const v=!cruza(l,c.position.x,c.position.z,p.x,p.z);if(l.v!==v){l.v=v;l.ms.forEach(m=>{if(window.VIS)VIS.poner(m,'tapa',!v);else m.visible=v})}})}

window.MARC={leer,corte};
})();
