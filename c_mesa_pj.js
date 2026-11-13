// c_mesa_pj.js — MPJ: los personajes (AV, c_avatar.js) sentados en las sillas de la mesa (MESA, c_mesa3d.js), con sus cartas boca abajo
// en las manos (su cantidad real) y sus reacciones. Cada uno va en el marco de su silla (unidades de la casa: la silla trae la escala k).
// MPJ.sync(mesa,lista,{dorso,listo}) → false mientras carga el GLB (al cargar llama listo()). lista: [{i asiento (0 = el tuyo), k jugador, cod código AV}].
// MPJ.paso(now,turno) cada cuadro (turno = asiento). MPJ.cartas(i,n). Puntos del mundo: MPJ.mano(i), MPJ.arriba(i) (sobre su cabeza).
// Reacciones: roba(i,de,ancho) la carta vuela de "de" a sus manos · estira(i,a) · compra(i,si) levanta la mano · festeja(i) · mira(i,punto,ms)
// · cabeza(i,ms) mano a la cabeza un rato · fin(i) baila el ganador y los demás se llevan la mano a la cabeza; fin(-1) regresa todo. suelta() los saca de las sillas (antes de rearmar la mesa).
(function(){
if(typeof THREE==='undefined')return;
function fab(){   // MPJ.nueva() da otra instancia (cada mesa del sótano lleva la suya)
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),PJ=new Map(),SEAT=v3(0,-1.27,-.25),OJO=v3(0,2.02,.25),CWm=.22,CHm=.31,P=v3(0,0,0),Q=v3(0,0,0),U=v3(0,1,0);
const TILT=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-.4),PLANA=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),qq=new THREE.Quaternion();
let mesa=null,geo=null,mats=null,dorso=null,carga=null,finI=-2,tl=0;
const RMo=()=>typeof RM!=='undefined'&&RM;
// código AV fijo según el nombre (para quien no ha hecho su personaje): todos lo ven igual
function codigo(nom){let x=2166136261;for(const c of String(nom||'Jugador'))x=Math.imul(x^c.charCodeAt(0),16777619);x=x||1;
 const r=n=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)%n};
 return AV.codificar({s:1+r(2),p:1+r(7),c:1+r(3),b:1+r(3),n:1+r(3),a:1+r(3),d:1+r(3),col:[r(8),r(8),r(10),r(10)]})}
function cartaM(){if(!geo){geo=new THREE.BoxGeometry(CWm,CHm,.008);const ed=new THREE.MeshStandardMaterial({color:0xe9e6dc,roughness:.6});
  mats=[ed,ed,ed,ed,new THREE.MeshStandardMaterial({roughness:.6}),new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.7})]}
 if(mats[4].map!==dorso){mats[4].map=dorso;mats[4].needsUpdate=true}const m=new THREE.Mesh(geo,mats);m.castShadow=true;return m}
function nuevo(w){const p=AV.crearYa(w.cod);if(!p)return null;AV.sentar(p,true);AV.pose(p,'AgarreFrente',0);AV.agarre(p,'I',.55);AV.agarre(p,'D',.55);p.position.copy(SEAT);
 const hit=new THREE.Mesh(new THREE.BoxGeometry(1.1,2.3,1.05),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(0,.25,-.2);hit.userData.hit={t:'seat',k:w.k};
 const ab=new THREE.Group();
 return {p,hit,ab,k:w.k,cod:w.cod,i:w.i,mi:p.getObjectByName('mano_I'),md:p.getObjectByName('mano_D'),cs:[],n:0,pend:0,vu:[],
  g:{cy:0,cx:0,cartas:1,est:0,mano:0,arr:0},perd:false,est:null,mano:0,manoT:0,arr:-1e9,mira:null,miraT:0,baila:false}}
function quita1(s){AV.quita(s.p);[s.hit,s.ab].forEach(o=>o.parent&&o.parent.remove(o));s.hit.geometry.dispose();s.vu.forEach(v=>v.m.parent&&v.m.parent.remove(v.m))}
function silla(i){return mesa&&mesa.sillas[i]}
function sync(m,lista,o){o=o||{};if(!window.AV||!window.CGLB)return false;
 if(!AV.ya()){if(!carga)carga=AV.listo().then(()=>{if(o.listo)o.listo()}).catch(()=>{carga=null});return false}
 mesa=m;if(o.dorso){dorso=o.dorso;if(mats&&mats[4].map!==dorso){mats[4].map=dorso;mats[4].needsUpdate=true}}const want=new Map(lista.map(x=>[x.i,x]));
 PJ.forEach((s,i)=>{const w=want.get(i);if(!w||w.cod!==s.cod||w.k!==s.k){quita1(s);PJ.delete(i)}});
 want.forEach((w,i)=>{let s=PJ.get(i);if(!s){s=nuevo(w);if(!s)return;PJ.set(i,s)}const c=silla(i);if(c&&s.p.parent!==c)[s.p,s.hit,s.ab].forEach(x=>c.add(x))});
 return MPJ.on=PJ.size>0}
function suelta(){PJ.forEach(s=>[s.p,s.hit,s.ab].forEach(o=>o.parent&&o.parent.remove(o)))}
function hits(){const a=[];PJ.forEach(s=>{const c=silla(s.i);if(c&&c.visible)a.push(s.hit)});return a}
// abanico de cartas boca abajo entre sus manos (el dorso hacia la mesa)
function cartas(i,n){const s=PJ.get(i);if(s)s.n=Math.max(0,Math.min(14,n|0))}
function abanico(s){const n=Math.max(0,s.n-s.pend);while(s.cs.length<n){const m=cartaM();s.ab.add(m);s.cs.push(m)}while(s.cs.length>n){const m=s.cs.pop();s.ab.remove(m)}
 const sp=Math.min(.13,1/Math.max(1,n));s.cs.forEach((m,j)=>{const a=-(j-(n-1)/2)*sp;m.position.set(-Math.sin(a)*CHm*.42,Math.cos(a)*CHm*.42,-j*.004);m.rotation.set(0,0,a)})}
// centro de sus manos en el marco de la silla (si la derecha está ocupada, la izquierda sola)
function entreManos(s,out){const c=silla(s.i);if(!s.mi||!s.md||!c)return out.set(0,.9,.35);s.mi.getWorldPosition(P);s.md.getWorldPosition(Q);const g=s.g;out.copy(P).lerp(Q,.5*Math.max(0,1-Math.min(1,g.est+g.mano+g.arr)));c.worldToLocal(out);return out.add(Q.set(0,.02,.03))}
function mano(i){const s=PJ.get(i),c=silla(i);if(!s||!c)return null;c.updateMatrixWorld();return c.localToWorld(entreManos(s,v3(0,0,0)))}
function arriba(i){const s=PJ.get(i),c=silla(i);if(!s||!c)return null;return c.localToWorld(v3(s.baila?.85:0,1.65,s.baila?-.65:SEAT.z))}
function cabeza(i,out){const s=PJ.get(i),c=silla(i);if(!s||!c)return null;return c.localToWorld(out.copy(OJO).add(SEAT))}
const vis=s=>{const c=silla(s.i);return !!(c&&c.visible)};
// reacciones
function roba(i,de,w){const s=PJ.get(i);if(!s||!vis(s)||!mesa)return;estira(i,de);if(RMo())return;
 const m=cartaM();m.quaternion.copy(PLANA);m.position.copy(de).setY(.03);m.scale.setScalar((w||1)/CWm);mesa.g.add(m);s.pend++;s.vu.push({m,t0:performance.now()+220,de:de.clone()})}
function estira(i,a){const s=PJ.get(i);if(!s||!vis(s))return;s.est={t:performance.now(),a:a?a.clone():null}}
function compra(i,si){const s=PJ.get(i);if(!s)return;s.mano=si?1:0;s.manoT=performance.now()}
function festeja(i){const s=PJ.get(i);if(s)s.arr=performance.now()}
function mira(i,a,ms){const s=PJ.get(i);if(s&&a){s.mira=a.clone();s.miraT=performance.now()+(ms||1500)}}
function fin(g){if(g===finI)return;finI=g;PJ.forEach((s,i)=>{const c=silla(i);
 if(g>=0&&i===g){s.baila=true;AV.gesto(s.p,null);AV.sentar(s.p,false);s.p.position.set(.85,-1.55,-.65);s.ab.visible=false;AV.emote(s.p,['Twerk','Capoeira','Macarena','House','HipHop','Footwork','Freezes','Clasico'][Math.random()*8|0])}
 else if(g>=0){s.perd=true;AV.pose(s.p,'ManoCabeza')}
 else{if(s.baila){AV.emote(s.p,null,0);AV.sentar(s.p,true);s.p.position.copy(SEAT);s.ab.visible=true;s.baila=false}s.perd=false;AV.pose(s.p,'AgarreFrente')}})}
// cabeza(i,ms): se lleva la mano a la cabeza un rato (Uno: robar de castigo)
function cabeza(i,ms){const s=PJ.get(i);if(!s||s.baila||finI>=0)return;s.perd=true;s.perdH=performance.now()+(ms||2500);AV.pose(s.p,'ManoCabeza')}
// cada cuadro: cabezas al turno, brazos según las reacciones, cartas en las manos y las que vuelan
function paso(now,turno){const dt=Math.min(100,now-(tl||now)),f=1-Math.exp(-dt/140);tl=now;const tc=turno>=0&&PJ.has(turno)?cabeza(turno,v3(0,0,0)):null;
 PJ.forEach((s,i)=>{if(s.perdH&&now>s.perdH){s.perdH=0;if(finI<0){s.perd=false;AV.pose(s.p,'AgarreFrente')}}if(!vis(s)||s.baila)return;const c=silla(i);
  // a quién mira: lo que le pidieron, a sus cartas si es su turno, si no al que tiene el turno
  let a=s.miraT>now?s.mira:null,cx=.06,cy=0;if(s.est&&now-s.est.t<700&&s.est.a)a=s.est.a;
  if(!a&&turno===i)cx=.42;else{const t=a||tc;if(t){P.copy(t);s.p.worldToLocal(P);P.sub(OJO);cy=Math.max(-1.1,Math.min(1.1,Math.atan2(P.x,P.z)));cx=Math.max(-.35,Math.min(.6,Math.atan2(-P.y,Math.hypot(P.x,P.z))))}}
  const ek=s.est?(now-s.est.t)/650:1,est=ek>=0&&ek<1?Math.sin(ek*Math.PI):0,ak=(now-s.arr)/1500,arr=ak>=0&&ak<1?Math.min(1,Math.sin(ak*Math.PI)*1.6)*(.85+.15*Math.sin(ak*25)):0;
  if(s.mano&&now-s.manoT>6000)s.mano=0;const g=s.g;
  g.cy+=(cy-g.cy)*f;g.cx+=(cx-g.cx)*f;g.cartas+=((s.perd?0:1)-g.cartas)*f;g.est+=(est-g.est)*Math.min(1,f*2);g.mano+=(s.mano-g.mano)*f;g.arr+=(arr-g.arr)*Math.min(1,f*2);AV.gesto(s.p,g);
  // cartas: el abanico sigue a sus manos (con los brazos arriba se esconde un rato)
  abanico(s);entreManos(s,s.ab.position);s.ab.quaternion.copy(TILT);s.ab.visible=g.arr<.35&&!s.perd;
  s.vu=s.vu.filter(v=>{const k=(now-v.t0)/480;if(k<0)return true;const e=k>=1?1:1-Math.pow(1-k,3);c.localToWorld(Q.copy(s.ab.position));
   v.m.position.lerpVectors(v.de,Q,e);v.m.position.y+=Math.sin(Math.PI*Math.min(1,k))*1.2*c.scale.x;c.getWorldQuaternion(qq).multiply(TILT);v.m.quaternion.slerpQuaternions(PLANA,qq,e);
   const s0=v.m.userData.s0||(v.m.userData.s0=v.m.scale.x);v.m.scale.setScalar(s0+(c.scale.x-s0)*e);
   if(k>=1){mesa.g.remove(v.m);s.pend=Math.max(0,s.pend-1);return false}return true})})}
const MPJ={on:false,sync,suelta,hits,paso,cartas,mano,arriba,roba,estira,compra,festeja,mira,fin,cabeza,codigo,nueva:fab};return MPJ}
window.MPJ=fab();
})();
