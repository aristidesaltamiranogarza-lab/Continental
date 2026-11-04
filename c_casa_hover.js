// Mesas de la casa al pasar el cursor (o con el primer toque en el celular): la mesa se eleva un poco,
// brilla y se asoma la silla libre más cercana a la cámara. Las puertas solo brillan.
// c_casa3d.js llama CHOV.step(dt, TB, g, cam) cada cuadro; g = la mesa señalada (ETQ.act()). Usa t.G y t.chairs.
(function(){
if(typeof THREE==='undefined')return;
const UP=.16,OUT=.55,ROT=.4,GLOW=new THREE.Color(0xffc870),GK=.22,wp=new THREE.Vector3();
const sm=t=>t*t*(3-2*t);
let ready=false;
// materiales de cada mesa; los que comparten varias mesas no brillan (se prenderían todas)
function prepAll(TB){ready=true;const cnt=new Map(),per=new Map();
 TB.forEach(t=>{if(!t.G)return;const ms=new Set(),parts=[];
  t.G.children.forEach(o=>{const isCh=(t.chairs||[]).includes(o);if(!isCh&&o!==t.ring)parts.push([o,o.position.y]);   // el aro del piso no sube
   if(!isCh)o.traverse(m=>{if(m.isMesh&&m.material&&m.material.emissive)ms.add(m.material)})});
  ms.forEach(m=>cnt.set(m,(cnt.get(m)||0)+1));per.set(t,{ms,parts})});
 per.forEach(({ms,parts},t)=>{t._hv={h:0,parts,mats:[...ms].filter(m=>cnt.get(m)===1).map(m=>[m,m.emissive.clone()]),ch:null}})}

function pickChair(t,v,cam){let best=null,bd=1e9;(t.chairs||[]).forEach(c=>{if(!c.visible)return;c.getWorldPosition(wp);const d=wp.distanceToSquared(cam.position);if(d<bd){bd=d;best=c}});
 if(best)v.ch={c:best,x:best.position.x,z:best.position.z,ry:best.rotation.y}}
function putChair(v,k){const s=v.ch,c=s.c,l=Math.hypot(s.x,s.z)||1,m=1+OUT*k/l;c.position.x=s.x*m;c.position.z=s.z*m;c.rotation.y=s.ry+ROT*k}

function step(dt,TB,g,cam){if(!ready)prepAll(TB);const f=1-Math.exp(-dt/90);
 TB.forEach(t=>{const v=t._hv;if(!v)return;const want=t.g===g?1:0;if(!want&&!v.h)return;
  v.h+=(want-v.h)*f;if(Math.abs(want-v.h)<.003)v.h=want;const k=sm(v.h);
  if(!t.door)v.parts.forEach(([o,y])=>o.position.y=y+UP*k);
  v.mats.forEach(([m,e0])=>m.emissive.copy(e0).lerp(GLOW,GK*k));
  if(t.door)return;
  if(want&&!v.ch)pickChair(t,v,cam);
  if(v.ch){if(!v.ch.c.visible){putChair(v,0);v.ch=null}else{putChair(v,k);if(!v.h)v.ch=null}}})}

window.CHOV={step};
})();
