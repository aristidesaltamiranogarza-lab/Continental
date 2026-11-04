// c_casa_luces.js — LUZ: tope de luces puntuales en Completo (D7). La tarjeta calcula cada luz puntual en cada pixel; con 16 o más por piso
// una laptop no llega a 60. Se dejan prendidas solo las K más cercanas a lo que ves (un punto 4 m delante de la cámara), siempre K
// para que los shaders no se recompilen; al cambiar una, la que sale se apaga suave y la que entra se prende suave.
// No se tocan las que dan sombra ni las userData.keep. En Medio no hace nada (applyQ ya apaga las puntuales). LUZ.k(n) cambia el tope.
(function(){
let K=8,sc=null,P=[],q0,tSel=0,sw=null,lista=false,V,D;
const FD=.35,casa=()=>window.CASA3D&&CASA3D.sc&&CASA3D.R&&CASA3D.R()&&CASA3D;
function punto(){if(!V){V=new THREE.Vector3();D=new THREE.Vector3()}const C=CASA3D.cam();C.getWorldPosition(V);C.getWorldDirection(D);D.y=0;D.normalize();return V.addScaledVector(D,4)}
function elige(){const p=punto();P.forEach(e=>{e.l.getWorldPosition(D);e.d=D.distanceTo(p)});return P.slice().sort((a,b)=>a.d-b.d).slice(0,K)}
// captura del piso: prepara los shaders con K luces en paralelo y mientras tanto deja todas como estaban
async function captura(S){sc=S;sw=null;lista=false;P=[];
 S.traverse(o=>{if(o.isPointLight&&!o.castShadow&&!o.userData.keep&&o.visible)P.push({l:o,i:o.intensity,f:1,on:true,d:0})});
 if(P.length<=K){P=[];return}
 const A=new Set(elige()),R=CASA3D.R();P.forEach(e=>e.l.visible=A.has(e));
 try{const pr=R.compileAsync&&R.compileAsync(S,CASA3D.cam());P.forEach(e=>e.l.visible=true);if(pr)await Promise.race([pr,new Promise(ok=>setTimeout(ok,4000))])}catch(e){P.forEach(x=>x.l.visible=true)}
 if(sc!==S)return;P.forEach(e=>{e.on=A.has(e);e.l.visible=e.on;e.f=e.on?1:0;e.l.intensity=e.i*e.f});lista=true}
// regresa las luces como estaban; al salir de Completo no toca la visibilidad (applyQ ya las apagó)
function suelta(vis){P.forEach(e=>{if(vis)e.l.visible=true;e.l.intensity=e.i});P=[];sc=null;lista=false;sw=null}
function tick(now){requestAnimationFrame(tick);if(!casa()||document.hidden)return;const S=CASA3D.sc(),q=window.CALIDAD;
 if(q!==q0){const era=q0;q0=q;if(era==='completo')suelta(false);sc=null}
 if(q!=='completo')return;
 if(S!==sc){if(sc)suelta(true);captura(S);return}
 if(!lista)return;
 if(sw){const dt=Math.min(.05,(now-sw.t)/1000);sw.t=now;
  if(sw.o){sw.o.f-=dt/FD;if(sw.o.f<=0){sw.o.f=0;sw.o.on=false;sw.o.l.visible=false;sw.o.l.intensity=sw.o.i*0;sw.o=null;sw.n.on=true;sw.n.l.visible=true;sw.n.f=0}else sw.o.l.intensity=sw.o.i*sw.o.f}
  else{sw.n.f=Math.min(1,sw.n.f+dt/FD);sw.n.l.intensity=sw.n.i*sw.n.f;if(sw.n.f>=1)sw=null}
  return}
 if(now-tSel<300)return;tSel=now;
 // cambia una a la vez: la peor prendida por la mejor apagada, si está al menos 1.5 m más cerca
 const A=new Set(elige()),o=P.filter(e=>e.on&&!A.has(e)).sort((a,b)=>b.d-a.d)[0],n=P.filter(e=>!e.on&&A.has(e)).sort((a,b)=>a.d-b.d)[0];
 if(o&&n&&n.d<o.d-1.5)sw={o,n,t:now}}
requestAnimationFrame(tick);
window.LUZ={k:n=>{K=Math.max(1,n|0);if(sc)suelta(true)},info:()=>({on:P.length?P.filter(e=>e.on).length:0,total:P.length,k:K})};
})();
