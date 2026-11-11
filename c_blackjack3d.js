// c_blackjack3d.js — BJ3: el Blackjack del salón del sótano en 3D (mesa CAS3.blackjack en SAL.M.blackjack; reglas en g_blackjack.js por /casa b.bj).
// Cartas sobre el paño en cada casilla (en cascada; manos divididas lado a lado), las del crupier en BJC.LUGAR; fichas apiladas en la casilla y el seguro.
// Las cartas vuelan desde la mano del crupier cuando él las suelta (BJC.al) y al acabar la ronda se barren a los descartes; pagos: fichas de la charola a la casilla
// o de la casilla a la charola. Sentarse: E o tocar la mesa (el lugar libre más cerca); levantarse: Esc o caminar. Sentados con MPJ (sillas de CAS3);
// cámara sobre tu hombro que voltea un poco al turno (MCAM). c_casa3d.js: BJ3.estado(v,err), BJ3.out(), BJ3.hud(busy), BJ3.key(k), BJ3.sentado(id).
// SAL.step llama BJ3.paso(). Para B4 (interfaz): BJ3.act(op,extra) manda una jugada, BJ3.v la última vista, BJ3.yo() tu asiento (-1 si no).
(function(){
if(typeof THREE==='undefined')return;
// ---------- ajustes: tiempos en ms, medidas en el espacio de la mesa (+z hacia los jugadores) ----------
const A={
 carta:[.13,.185],                 // ancho y largo de una carta en el paño
 rCarta:1.13,rFicha:1.33,rSeguro:1.035,   // radios desde el centro de la media luna: cartas, fichas (casilla) y seguro
 cascada:[.032,.045],              // cada carta nueva se corre: de lado y hacia el crupier
 sepMano:.16,sepCr:.1,             // entre manos divididas; entre cartas del crupier
 vuelo:430,alto:.32,               // carta de la mano del crupier al paño: duración y altura del arco
 espera:1600,                      // si el crupier no la suelta en este tiempo, vuela sola
 volteo:380,                       // voltear su carta tapada
 barre:480,barreSep:45,            // a los descartes: duración y desfase entre cartas
 ficha:[.042,.012],maxFichas:24,fichaVuelo:620,   // radio y alto de una ficha, tope por pila, vuelo de los pagos
 silla:1.55,                       // altura del marco del personaje sobre la silla (MPJ lo baja 1.27)
 cerca:3.2,                        // distancia al centro de la mesa para el aviso "Jugar Blackjack"
 cam:{atras:1.1,alto:5.6,lado:-.9,mira:.4,blend:900}   // sentado: detrás de tu silla, altura, a un lado (sobre tu hombro), punto que ve (0 tu casilla … 1 el crupier), llegada
};
const PI=Math.PI,v3=(x,y,z)=>new THREE.Vector3(x,y,z),CZ=.55,LUGAR=window.BJC?BJC.LUGAR:[0,.47],ZAP=[.76,.2],DESC=[-.76,.2],CHAR=[0,.19];
const PALO=['♠','♥','♦','♣'],RANGO=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const FICHAS=[[500,'#5b2a86'],[100,'#1d1d1f'],[25,'#2e7d3e'],[5,'#b3262e'],[1,'#ece6da']];
const touchy=matchMedia('(pointer:coarse)').matches,ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const CAR=[],PEND={},TW=[],PILAS=new Map(),PAGO=new Set(),MAT={},FM={},SIL=[],cola=[];
let V=null,R=null,M0=null,TH=1.5,ini=false,tP=0,ronda=null,mc=null,pide=-1,pideT=0,parando=false,ancla=null,meVis=null,p0=null,q0=null,camT=0,mk='',mpjOk=false,hk='';
let GEO=null,ED=null,DOR=null,FG=null;
const H=()=>window.CASA3D,M=()=>window.SAL&&SAL.M&&SAL.M.blackjack||null;
const yoId=()=>H()&&H().myId?H().myId():null,quien=id=>H()&&H().quien?H().quien(id):null;
const mio=()=>{const id=yoId();return V&&id?V.as.findIndex(a=>a&&a.id===id):-1},yo=()=>parando?-1:mio();
const mundo=p=>R.localToWorld(p.clone()),rr=()=>{if(typeof render=='function')render()};
const mon=f=>'$'+Math.round(f||0).toLocaleString('es-MX');

// ---------- cartas y fichas (texturas de canvas, cacheadas por CASA3D.ctex) ----------
const tx=(k,w,h,f)=>H().ctex(k,w,h,f);
function caraMat(c){c%=52;if(MAT[c])return MAT[c];const r=c%13,p=c/13|0,col=p==1||p==2?'#b3202a':'#1d1a17',ps=PALO[p]+'︎';
 const t=tx('bj3-carta-'+c,128,180,(g,w,h)=>{g.fillStyle='#fbf8f1';g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=3;g.strokeRect(2,2,w-4,h-4);
  g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';
  const esq=()=>{g.font='800 30px Georgia,serif';g.fillText(RANGO[r],21,22);g.font='26px serif';g.fillText(ps,21,50)};esq();g.save();g.translate(w,h);g.rotate(PI);esq();g.restore();
  if(r>=10){g.font='800 62px Georgia,serif';g.fillText(RANGO[r],w/2,h/2-10);g.font='34px serif';g.fillText(ps,w/2,h/2+38)}else{g.font=(r?'72px':'92px')+' serif';g.fillText(ps,w/2,h/2+4)}});
 return MAT[c]=new THREE.MeshStandardMaterial({map:t,roughness:.6})}
function carta(c){if(!GEO){GEO=new THREE.BoxGeometry(A.carta[0],.004,A.carta[1]);ED=new THREE.MeshStandardMaterial({color:0xe9e6dc,roughness:.6});
  DOR=new THREE.MeshStandardMaterial({roughness:.6,map:tx('carta-reverso',64,96,(g,w,h)=>{g.fillStyle='#f4f1ea';g.fillRect(0,0,w,h);g.fillStyle='#a3202a';g.fillRect(5,5,w-10,h-10)})})}
 const m=new THREE.Mesh(GEO,[ED,ED,c<0?DOR:caraMat(c),DOR,ED,ED]),o=new THREE.Group();m.receiveShadow=true;o.add(m);R.add(o);return {o,m,c}}
function fichaMat(d,col){if(FM[d])return FM[d];const t=tx('bj3-ficha-'+d,64,64,(g,w,h)=>{g.fillStyle=col;g.fillRect(0,0,w,h);g.strokeStyle=d==1?'#b3262e':'#f4efe4';
  g.lineWidth=7;g.setLineDash([9,7]);g.beginPath();g.arc(32,32,27,0,7);g.stroke();g.setLineDash([]);g.lineWidth=2;g.beginPath();g.arc(32,32,17,0,7);g.stroke()});
 const top=new THREE.MeshStandardMaterial({map:t,roughness:.45});return FM[d]=[new THREE.MeshStandardMaterial({color:col,roughness:.45}),top,top]}
function llena(o,v){while(o.children.length)o.remove(o.children[0]);if(!FG)FG=new THREE.CylinderGeometry(A.ficha[0],A.ficha[0],A.ficha[1],20);let y=A.ficha[1]/2,n=0;
 for(const [d,col] of FICHAS)while(v>=d&&n<A.maxFichas){v-=d;const m=new THREE.Mesh(FG,fichaMat(d,col));m.position.set((Math.random()-.5)*.005,y,(Math.random()-.5)*.005);
  m.rotation.y=Math.random()*6;m.castShadow=true;o.add(m);y+=A.ficha[1];n++}}
function pila(v){const o=new THREE.Group();llena(o,v);R.add(o);return {o,m:null,v}}

// ---------- dónde va cada cosa ----------
const ang=s=>{const q=PI/2+(3-s)*.3;return [Math.cos(q),Math.sin(q)]};   // hacia afuera desde el centro de la media luna (igual que CAS3)
function lugar(x){if(x.s<0)return {p:v3(LUGAR[0]+(x.j-.5)*A.sepCr,TH+.003+x.j*.0015,LUGAR[1]),ry:0,f:x.c<0?PI:0};
 const [ux,uz]=ang(x.s),ta=(x.h-(x.nh-1)/2)*A.sepMano+x.j*A.cascada[0],r=A.rCarta-x.j*A.cascada[1];
 return {p:v3(ux*r-uz*ta,TH+.003+x.j*.0015,-CZ+uz*r+ux*ta),ry:Math.atan2(ux,uz),f:0}}
function sitio(s,r,ta){const [ux,uz]=ang(s);return v3(ux*r-uz*ta,TH+.002,-CZ+uz*r+ux*ta)}
const enMano=(s,h,nh,lado)=>sitio(s,A.rFicha,(h-(nh-1)/2)*A.sepMano+(lado||0));
const jugador=s=>{const p=sitio(s,2.05,0);p.y=TH+.35;return p},charola=()=>v3(CHAR[0],TH+.06,CHAR[1]);
const desde=()=>{const p=window.BJC&&BJC.mano();return p?R.worldToLocal(p.clone()):v3(ZAP[0],TH+.13,ZAP[1])};

// ---------- animaciones: x = {o grupo, m malla (volteo en m.rotation.z) o null} ----------
function quitaTw(x){for(let i=TW.length-1;i>=0;i--)if(TW[i].x===x)TW.splice(i,1)}
function ir(x,p,ry,f,d,o){o=o||{};quitaTw(x);const y0=x.o.rotation.y;
 TW.push({x,p0:x.o.position.clone(),p1:p.clone(),y0,y1:y0+wrap(ry-y0),f0:x.m?x.m.rotation.z:0,f1:f,t0:performance.now()+(o.tras||0),d,arc:o.arc||0,fin:o.fin})}
function pon(x,L){x.o.position.copy(L.p);x.o.rotation.y=L.ry;if(x.m)x.m.rotation.z=L.f}
function pasoTw(now){for(let i=TW.length-1;i>=0;i--){const t=TW[i];if(!t)continue;const k=(now-t.t0)/t.d;if(k<0)continue;const e=ease(Math.min(1,k)),o=t.x.o;
 o.position.lerpVectors(t.p0,t.p1,e);if(t.arc)o.position.y+=Math.sin(PI*Math.min(1,k))*t.arc;o.rotation.y=t.y0+(t.y1-t.y0)*e;if(t.x.m)t.x.m.rotation.z=t.f0+(t.f1-t.f0)*e;
 if(k>=1){TW.splice(TW.indexOf(t),1);if(t.fin)t.fin()}}}
function acaba(){for(let n=0;TW.length&&n<5;n++)TW.splice(0).forEach(t=>{t.x.o.position.copy(t.p1);t.x.o.rotation.y=t.y1;if(t.x.m)t.x.m.rotation.z=t.f1;if(t.fin)t.fin()})}

// ---------- cartas: empareja las que ya están con la vista; las nuevas esperan al crupier, las que sobran se barren ----------
function cartas(v,snap,nueva){const now=performance.now(),T=[];
 v.as.forEach((a,s)=>{if(a)a.manos.forEach((h,hi)=>h.c.forEach((c,j)=>T.push({s,h:hi,j,c,nh:a.manos.length})))});v.cr.c.forEach((c,j)=>T.push({s:-1,h:0,j,c,nh:1}));
 const usa=new Set(),par=new Map(),libres=nueva?[]:CAR.slice();
 const busca=f=>T.forEach(t=>{if(par.has(t))return;const x=libres.find(x=>!usa.has(x)&&x.s===t.s&&f(x,t));if(x){usa.add(x);par.set(t,x)}});
 busca((x,t)=>x.c===t.c&&x.h===t.h&&x.j===t.j);busca((x,t)=>x.c===t.c);busca((x,t)=>t.s<0&&x.c<0&&x.j===t.j);
 let n=0;CAR.slice().forEach(x=>{if(!usa.has(x))barre(x,n++*A.barreSep,snap)});
 T.forEach(t=>{let x=par.get(t);const L=lugar(t);
  if(!x){x=carta(t.c);Object.assign(x,t,{L});CAR.push(x);if(snap)pon(x,L);else{x.o.visible=false;x.pend=now;(PEND[t.s]=PEND[t.s]||[]).push(x)}return}
  const cambio=!x.L||x.L.p.distanceTo(L.p)>1e-4||x.L.ry!==L.ry;Object.assign(x,{h:t.h,j:t.j,nh:t.nh,L});
  if(x.c<0&&t.c>=0){x.c=t.c;x.m.material[2]=caraMat(t.c);if(snap)pon(x,L);else x.volt=now;return}   // su carta tapada: se voltea cuando él la voltea
  if(snap)pon(x,L);else if(cambio&&!x.pend&&!x.volt)ir(x,L.p,L.ry,L.f,320,{arc:.02})})}
function vuela(x){const L=x.L,Q=PEND[x.s];x.pend=0;if(Q){const i=Q.indexOf(x);if(i>=0)Q.splice(i,1)}
 x.o.position.copy(desde());x.o.rotation.y=L.ry+(x.s<0?0:.6);x.m.rotation.z=PI;x.o.visible=true;
 const MP=window.MPJ&&mpjOk&&x.s>=0?MPJ:null;if(MP&&x.j>=2)MP.estira(x.s,mundo(L.p));
 ir(x,L.p,L.ry,L.f,A.vuelo,{arc:A.alto,fin:()=>{if(MP)MP.mira(x.s,mundo(L.p),900)}})}
function voltea(x){x.volt=0;ir(x,x.L.p,x.L.ry,0,A.volteo,{arc:.05})}
function barre(x,tras,snap){const i=CAR.indexOf(x);if(i>=0)CAR.splice(i,1);const Q=PEND[x.s];if(Q&&Q.includes(x))Q.splice(Q.indexOf(x),1);quitaTw(x);
 const fin=()=>R.remove(x.o);if(snap||!x.o.visible)return fin();ir(x,v3(DESC[0],TH+.08,DESC[1]),-.42,PI,A.barre,{arc:.12,tras,fin})}
function alCrupier(t,i){if(t==='carta'){const Q=PEND[i];if(Q&&Q.length)vuela(Q[0])}else if(t==='voltea'){const x=CAR.find(x=>x.s<0&&x.volt);if(x)voltea(x)}}

// ---------- fichas: apuesta de cada mano, ganancia al lado y seguro; lo perdido vuela a la charola, lo ganado sale de ella ----------
function fichas(v,snap){const F=new Map();
 v.as.forEach((a,s)=>{if(!a)return;const nh=a.manos.length;if(!nh){if(a.ap)F.set(s+':0',{s,v:a.ap,p:enMano(s,0,1)});return}
  a.manos.forEach((h,hi)=>{const r=h.res!=null,ne=r?h.neta||0:0;F.set(s+':'+hi,{s,v:h.a+Math.min(0,ne),p:enMano(s,hi,nh)});
   if(ne>0)F.set(s+':g'+hi,{s,v:ne,p:enMano(s,hi,nh,.095),char:1});
   const kp=v.ronda+':'+s+':'+hi;if(r&&!PAGO.has(kp)){PAGO.add(kp);if(!snap&&window.MPJ&&mpjOk){if(ne>0)MPJ.festeja(s);else if(ne<0)MPJ.cabeza(s,2200)}}});
  if(a.seg&&a.manos.some(h=>h.res==null))F.set(s+':s',{s,v:a.seg,p:sitio(s,A.rSeguro,.07)})});
 const fuera=(P,dest)=>ir(P,dest,0,0,A.fichaVuelo,{arc:.15,fin:()=>R.remove(P.o)});
 PILAS.forEach((P,k)=>{if(F.has(k))return;PILAS.delete(k);quitaTw(P);if(snap)R.remove(P.o);else fuera(P,jugador(P.s))});   // fin de la ronda: se las lleva el jugador
 F.forEach((f,k)=>{let P=PILAS.get(k);
  if(!P){P=pila(f.v);P.s=f.s;P.p=f.p;PILAS.set(k,P);P.o.position.copy(f.p);if(!snap){P.o.position.copy(f.char?charola():jugador(f.s));ir(P,f.p,0,0,A.fichaVuelo,{arc:.15})}return}
  if(P.p.distanceTo(f.p)>1e-4){P.p=f.p;if(snap)P.o.position.copy(f.p);else ir(P,f.p,0,0,320,{arc:.03})}   // al dividir se recorre
  if(f.v===P.v)return;const d=f.v-P.v;P.v=f.v;if(snap)return llena(P.o,f.v);
  if(d<0){const c=pila(-d);c.o.position.copy(P.o.position);llena(P.o,f.v);fuera(c,charola())}
  else{const c=pila(d);c.o.position.copy(jugador(f.s));ir(c,f.p,0,0,A.fichaVuelo,{arc:.15,fin:()=>{R.remove(c.o);if(P.v===f.v)llena(P.o,f.v)}})}})}

function sync(snap){const nueva=ronda!=null&&V.ronda!==ronda;if(nueva)PAGO.clear();cartas(V,snap,nueva);fichas(V,snap);ronda=V.ronda}

// ---------- gente sentada (MPJ en marcos sobre las sillas de CAS3) ----------
function gente(now){if(!window.MPJ)return;const L=[];V.as.forEach((a,i)=>{if(!a)return;const q=quien(a.id);L.push({i,k:a.id,cod:(q&&q.av)||MPJ.codigo(a.n)})});
 const k=JSON.stringify(L);if(k!==mk){const ok=MPJ.sync({g:R,sillas:SIL},L,{listo:()=>{mk=''}});mpjOk=!!(window.AV&&AV.ya&&AV.ya());mk=ok||!L.length?k:''}
 if(mpjOk)MPJ.paso(now,V.fase=='turnos'&&V.turno?V.turno.s:-1)}

// ---------- tu lugar: ancla detrás de la silla, cámara sobre tu hombro ----------
const CD=new THREE.PerspectiveCamera(),Pc=v3(0,0,0),Lc=v3(0,0,0);
function camara(now,s){const m=M(),C=H().cam();if(!C)return;const l=m.lugares[s],cs=m.D.casillas[s],fx=Math.sin(l.ry),fz=Math.cos(l.ry);
 Pc.set(l.x-fx*A.cam.atras+fz*A.cam.lado,A.cam.alto,l.z-fz*A.cam.atras-fx*A.cam.lado);Lc.set(cs[0]+(LUGAR[0]-cs[0])*A.cam.mira,TH,cs[1]+(LUGAR[1]-cs[1])*A.cam.mira);m.G.localToWorld(Lc);
 if(!mc&&window.MCAM)mc=MCAM.crea({vt:{},home(){},snap(){},viewed:()=>false,el:()=>0});
 let g=0;if(mc){const t=V.fase=='turnos'&&V.turno?V.turno.s:V.fase=='crupier'?-1:null;
  const tp=t==null?null:m.G.localToWorld(t<0?v3(LUGAR[0],TH,LUGAR[1]):v3(m.D.casillas[t][0],TH,m.D.casillas[t][1]));g=mc.paso(now,{cam:{px:Pc.x,pz:Pc.z,lx:Lc.x,lz:Lc.z},turno:tp})}
 const dx=Lc.x-Pc.x,dz=Lc.z-Pc.z,c=Math.cos(g),sn=Math.sin(g);Lc.x=Pc.x+dx*c+dz*sn;Lc.z=Pc.z+dz*c-dx*sn;CD.position.copy(Pc);CD.lookAt(Lc);
 if(!p0){p0=C.position.clone();q0=C.quaternion.clone();camT=now}const e=ease(Math.min(1,(now-camT)/A.cam.blend));
 C.position.lerpVectors(p0,Pc,e);C.quaternion.slerpQuaternions(q0,CD.quaternion,e)}
function sienta(s){const l=M().lugares[s],me=quien(yoId());pide=-1;if(!me)return;me.pos.x=l.x-Math.sin(l.ry)*.85;me.pos.z=l.z-Math.cos(l.ry)*.85;ancla={x:me.pos.x,z:me.pos.z};meVis=me.g.visible}
function suelta(){const me=quien(yoId()),C=H()&&H().cam();if(me&&meVis!=null)me.g.visible=meVis;ancla=null;meVis=null;p0=null;
 if(C&&window.CCAM)CCAM.blendIn(C,CCAM.pose(C),700)}
function cerca(){const me=quien(yoId()),P=window.SAL&&SAL.P.blackjack;return !!(me&&P&&H().piso()==='sot'&&Math.hypot(me.pos.x-P.x,me.pos.z-P.z)<A.cerca)}

// ---------- jugadas ----------
function act(op,x){if(cola.length<8)cola.push(Object.assign({op},x||{}))}
function sentar(){const m=M();if(!m||!V||yo()>=0||pide>=0)return;const me=quien(yoId());if(!me)return;let b=-1,bd=1e9;
 m.lugares.forEach((l,i)=>{if(V.as[i])return;const d=Math.hypot(l.x-me.pos.x,l.z-me.pos.z);if(d<bd){bd=d;b=i}});
 if(b<0)return window.SAL&&SAL.aviso('La mesa está llena');pide=b;pideT=performance.now();act('sentar',{s:b});if(typeof sfx=='function')sfx('tick')}
function levantarse(){if(yo()<0)return;act('parar');parando=true;suelta();rr()}

function estado(v,err){if(err&&window.SAL)SAL.aviso(err);if(err)pide=-1;if(!v||!v.as)return;V=v;BJ3.v=v;
 if(parando&&mio()<0)parando=false;if(pide>=0&&performance.now()-pideT>4000)pide=-1;if(ini)sync(false)}
function arma(){const m=M();if(!m||!H())return false;if(R&&R.parent)R.parent.remove(R);CAR.length=0;TW.length=0;PILAS.clear();SIL.length=0;for(const k in PEND)delete PEND[k];
 M0=m;TH=m.D.TH||1.5;R=new THREE.Group();m.G.add(R);m.sillas.forEach(c=>{const w=new THREE.Group();w.position.y=A.silla;c.add(w);SIL.push(w)});
 if(window.BJC)BJC.al(alCrupier);ini=true;mk='';if(V)sync(true);return true}
function paso(){const now=performance.now();if((!ini||M()!==M0)&&!arma())return;
 if(now-tP>1000){acaba();for(const s in PEND)PEND[s].splice(0).forEach(x=>{x.pend=0;x.o.visible=true;pon(x,x.L)});CAR.forEach(x=>{if(x.volt){x.volt=0;pon(x,x.L)}});mk=''}   // volviste al sótano
 tP=now;
 for(const s in PEND){const x=PEND[s][0];if(x&&now-x.pend>A.espera)vuela(x)}
 const xv=CAR.find(x=>x.volt);if(xv&&now-xv.volt>A.espera)voltea(xv);
 pasoTw(now);if(!V)return;gente(now);
 const s=yo(),me=quien(yoId());
 if(s>=0){if(!ancla)sienta(s);if(me&&ancla){if(Math.hypot(me.pos.x-ancla.x,me.pos.z-ancla.z)>.4)levantarse();else{if(mpjOk)me.g.visible=false;camara(now,s)}}}
 else if(ancla)suelta();
 const k=[s,s<0&&cerca(),s>=0?V.as[s].f:V.as.filter(Boolean).length].join('|');if(k!==hk){hk=k;rr()}}

// ---------- aviso de la mesa (al centro abajo, como CMESA) ----------
function hud(busy){if(busy||!ini||!V||!H()||H().piso()!=='sot')return '';const s=yo(),I=n=>window.UI?UI.ico(n):'';
 if(s>=0)return `<button class="ui uh-aviso" onclick="BJ3.levantarse()" aria-label="Levantarse de la mesa de Blackjack"><span class="uh-ai" aria-hidden="true">${I('salir')}</span>
  <span class="uh-at"><b>Blackjack · ${mon(V.as[s].f)} en fichas</b><small>Levantarse</small></span>${touchy?'':'<kbd>Esc</kbd>'}</button>`;
 if(!cerca())return '';const n=V.as.filter(Boolean).length;
 return `<button class="ui uh-aviso" onclick="BJ3.sentar()" aria-label="Jugar Blackjack"><span class="uh-ai" aria-hidden="true">${I('jugar')}</span>
  <span class="uh-at"><b>Jugar Blackjack</b><small>${n?n+' jugando · ':''}Mín $${V.min} · Máx $${V.max}${touchy?' · toca para sentarte':''}</small></span>${touchy?'':'<kbd>E</kbd>'}</button>`}
function key(k){if(k==='escape'&&yo()>=0){levantarse();return true}if(k==='e'&&yo()<0&&cerca()){sentar();return true}return false}

const BJ3=window.BJ3={A,v:null,estado,paso,hud,key,act,sentar,levantarse,yo,out:()=>cola.shift()||null,tap:()=>{if(yo()<0)sentar()},
 sentado:id=>!!(mpjOk&&V&&H()&&H().piso()==='sot'&&V.as.some(a=>a&&a.id===id))};
})();
