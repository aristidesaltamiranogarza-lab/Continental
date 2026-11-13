// c_poker3d.js — PK3: el Póker (Texas Hold'em) del salón del sótano en 3D (mesa ovalada CAS3.poker en SAL.M.poker; reglas en g_poker.js por /casa b.pk).
// Cartas propias frente a cada asiento (las de los demás tapadas hasta el showdown), las comunes al centro, apuestas de la calle frente a cada quien,
// botes al centro (uno por bote paralelo) que vuelan al ganador uno por uno; el botón de dealer de la mesa se mueve al asiento que toca.
// Caras, reverso y fichas: BJ3.kit. Sentarse: E o tocar la mesa; levantarse: Esc o caminar. Sentados con MPJ sobre las sillas de CAS3.
// c_casa3d.js: PK3.estado(v,err), PK3.out(), PK3.hud(busy), PK3.key(k), PK3.sentado(id). SAL.step llama PK3.paso(). La interfaz (P4) usará PK3.act, PK3.v, PK3.yo().
(function(){
if(typeof THREE==='undefined')return;
// ---------- ajustes: ms y medidas en el espacio de la mesa (el crupier en -z) ----------
const A={
 carta:[.11,.155],rCarta:.47,sepCarta:.07,      // tamaño; radio de las cartas propias desde el óvalo; separación entre tus dos cartas
 sepMesa:.13,zMesa:.04,                        // comunes: separación y dónde (al centro)
 rAp:.3,zBote:-.24,sepBote:.17,                // apuestas de la calle; botes
 reparte:110,vuelo:420,alto:.22,volteo:380,barre:460,
 ficha:620,tPausa:1300,tBote:2500,tFin:6000,   // vuelo de fichas; espera antes de pagar; entre botes y fin (= T_BOTE y T_FIN del servidor)
 silla:1.55,cerca:4.4,
 cam:{ojo:2.25,adelante:.4,mira:.35,zoom:3.2,giro:1.6,sube:.9,baja:.7,sens:.005,blend:700,arriba:{alto:2.1,atras:1.5,fov:1.25}}
};
const PI=Math.PI,v3=(x,y,z)=>new THREE.Vector3(x,y,z),MAZO=[.52,-.33],MUCK=[-.5,-.3];
const touchy=matchMedia('(pointer:coarse)').matches,ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const CAR=new Map(),TW=[],PILAS=new Map(),SIL=[],cola=[];
let V=null,R=null,M0=null,TH=1.5,ini=false,tP=0,mano=null,pide=-1,pideT=0,parando=false,ancla=null,meVis=null,p0=null,q0=null,camT=0,mk='',mpjOk=false,hk='',GEO=null,BT=null;
const H=()=>window.CASA3D,M=()=>window.SAL&&SAL.M&&SAL.M.poker||null,K=()=>window.BJ3&&BJ3.kit;
const yoId=()=>H()&&H().myId?H().myId():null,quien=id=>H()&&H().quien?H().quien(id):null;
const mio=()=>{const id=yoId();return V&&id?V.as.findIndex(a=>a&&a.id===id):-1},yo=()=>parando?-1:mio();
const mundo=p=>R.localToWorld(p.clone()),rr=()=>{if(typeof render=='function')render()};
const mon=f=>'$'+Math.round(f||0).toLocaleString('es-MX');
const son=k=>{if(typeof sfx=='function')sfx(k)};

// ---------- dónde va cada cosa (asiento s = lugar s de CAS3 = fracción (s+1)/9 del óvalo) ----------
function ov(r,s,ta){const p=M0.D.enOvalo(r,(s+1)/9);return {x:p.x+p.nz*(ta||0),z:p.z-p.nx*(ta||0),ry:Math.atan2(p.nx,p.nz)}}
const enMesa=(o,y)=>v3(o.x,TH+(y||.003),o.z);
function lugar(t){if(t.s<0)return {p:v3((t.j-2)*A.sepMesa,TH+.003,A.zMesa),ry:0};
 const o=ov(A.rCarta,t.s,(t.j-.5)*A.sepCarta);return {p:enMesa(o,.003+t.j*.0015),ry:o.ry+(t.j-.5)*.12}}
const apPos=s=>enMesa(ov(A.rAp,s),.002),jugador=s=>{const p=enMesa(ov(1.2,s));p.y=TH+.3;return p};
const botePos=(k,n)=>v3((k-(n-1)/2)*A.sepBote,TH+.002,A.zBote);
function btnPos(s){const o=ov(.36,s,-.17);return enMesa(o,.008)}

// ---------- cartas y fichas ----------
function carta(c){const k=K();if(!GEO)GEO=new THREE.BoxGeometry(A.carta[0],.004,A.carta[1]);const {ED,DOR}=k.dorso();
 const m=new THREE.Mesh(GEO,[ED,ED,c<0?DOR:k.caraMat(c),DOR,ED,ED]),o=new THREE.Group();m.receiveShadow=true;o.add(m);R.add(o);return {o,m,c}}
function pila(v){const o=new THREE.Group();K().llena(o,v);R.add(o);return {o,m:null,v}}

// ---------- animaciones: x = {o grupo, m malla (volteo en m.rotation.z) o null} ----------
function quitaTw(x){for(let i=TW.length-1;i>=0;i--)if(TW[i].x===x)TW.splice(i,1)}
function ir(x,p,ry,f,d,o){o=o||{};quitaTw(x);const y0=x.o.rotation.y;
 TW.push({x,p0:x.o.position.clone(),p1:p.clone(),y0,y1:y0+wrap(ry-y0),f0:x.m?x.m.rotation.z:0,f1:f,t0:performance.now()+(o.tras||0),d,arc:o.arc||0,fin:o.fin,ve:o.ve})}
function pon(x,L){x.o.position.copy(L.p);x.o.rotation.y=L.ry;if(x.m)x.m.rotation.z=0;x.o.visible=true}
function pasoTw(now){for(let i=TW.length-1;i>=0;i--){const t=TW[i];if(!t)continue;const k=(now-t.t0)/t.d;if(k<0)continue;const e=ease(Math.min(1,k)),o=t.x.o;
 if(t.ve){t.ve=0;o.visible=true;if(t.x.m)son('deal')}
 o.position.lerpVectors(t.p0,t.p1,e);if(t.arc)o.position.y+=Math.sin(PI*Math.min(1,k))*t.arc;o.rotation.y=t.y0+(t.y1-t.y0)*e;if(t.x.m)t.x.m.rotation.z=t.f0+(t.f1-t.f0)*e;
 if(k>=1){TW.splice(TW.indexOf(t),1);if(t.fin)t.fin()}}}
function acaba(){for(let n=0;TW.length&&n<5;n++)TW.splice(0).forEach(t=>{t.x.o.visible=true;t.x.o.position.copy(t.p1);t.x.o.rotation.y=t.y1;if(t.x.m)t.x.m.rotation.z=t.f1;if(t.fin)t.fin()})}

// ---------- cartas: las de la mano actual por clave; las nuevas salen del mazo (en orden de reparto), las que sobran van al descarte ----------
function cartas(snap){const T=new Map(),m=V.mano,n0=V.sb>=0?V.sb:0;let orden=[];
 V.as.forEach((a,s)=>{if(!a||!a.c||!a.c.length||a.fold)return;a.c.forEach((c,j)=>{T.set(m+':h'+s+':'+j,{s,j,c});orden.push({k:m+':h'+s+':'+j,o:j*8+(s-n0+8)%8})})});
 orden.sort((a,b)=>a.o-b.o);orden=orden.map(x=>x.k);
 (V.mesa||[]).forEach((c,j)=>T.set(m+':m'+j,{s:-1,j,c}));
 let nb=0;CAR.forEach((x,k)=>{if(T.has(k))return;CAR.delete(k);barre(x,nb++*40,snap)});
 let nn=0;T.forEach((t,k)=>{const L=lugar(t);let x=CAR.get(k);
  if(!x){x=carta(t.c);x.L=L;CAR.set(k,x);if(snap){pon(x,L);return}
   const i=t.s<0?nn++:orden.indexOf(k);x.o.visible=false;x.o.position.set(MAZO[0],TH+.05,MAZO[1]);x.o.rotation.y=L.ry+.5;x.m.rotation.z=PI;
   ir(x,L.p,L.ry,t.c<0?PI:0,A.vuelo,{arc:A.alto,tras:i*A.reparte+(t.s<0?250:0),ve:1});return}
  if(x.c<0&&t.c>=0){x.c=t.c;x.m.material[2]=K().caraMat(t.c);if(snap)pon(x,L);else{x.m.rotation.z=PI;ir(x,L.p,L.ry,0,A.volteo,{arc:.05})}}})}
function barre(x,tras,snap){quitaTw(x);const fin=()=>R.remove(x.o);if(snap||!x.o.visible)return fin();ir(x,v3(MUCK[0],TH+.06,MUCK[1]),-.4,PI,A.barre,{arc:.1,tras,fin})}

// ---------- fichas: apuesta de la calle frente a cada quien; al recoger van al bote; en el fin cada bote vuela a quien lo gana ----------
function finEl(){const nb=Math.max(1,(V.res||[]).length);return A.tFin+A.tBote*(nb-1)-V.left+(performance.now()-V.t0)}
function fichas(snap){const F=new Map(),B=V.botes||[],Rs=V.res||[],fin=V.fase==='fin',el=fin?finEl():0,uno=Rs.length!==B.length;
 V.as.forEach((a,s)=>{if(a&&a.ap)F.set('a'+s,{v:a.ap,p:apPos(s),s})});
 const G={};B.forEach((b,k)=>{const r=uno?Rs[0]:Rs[k],t=A.tPausa+(uno?0:k*A.tBote);
  if(fin&&r&&r.g&&r.g.length&&el>=t){const w=r.g,p=Math.floor(b.v/w.length);w.forEach((s,i)=>G[s]=(G[s]||0)+p+(i<b.v-p*w.length?1:0));return}
  F.set('b'+k,{v:b.v,p:botePos(k,B.length),w:fin&&r&&r.g?r.g[0]:null})});
 for(const s in G)F.set('g'+s,{v:G[s],p:apPos(+s),s:+s});
 const now=performance.now(),fuera=(P,dest,tras)=>ir(P,dest,0,0,A.ficha,{arc:.12,tras,fin:()=>R.remove(P.o)});
 PILAS.forEach((P,k)=>{if(F.has(k))return;PILAS.delete(k);quitaTw(P);if(snap||!P.o.visible)return R.remove(P.o);
  if(k[0]==='a')fuera(P,botePos(0,1));else if(k[0]==='b'&&P.w!=null){fuera(P,apPos(P.w));son('chips')}else if(k[0]==='g')fuera(P,jugador(P.s));else R.remove(P.o)});
 F.forEach((f,k)=>{let P=PILAS.get(k);if(f.w!=null&&P)P.w=f.w;
  if(!P){P=pila(f.v);Object.assign(P,{s:f.s,w:f.w,p:f.p});PILAS.set(k,P);P.o.position.copy(f.p);if(snap)return;
   if(k[0]==='a'){P.o.position.copy(jugador(f.s));ir(P,f.p,0,0,A.ficha,{arc:.12});if(f.s!==yo())son('chip')}else{P.o.visible=false;P.en=now+A.ficha*.9}return}
  if(P.p.distanceTo(f.p)>1e-4){P.p=f.p;if(snap)P.o.position.copy(f.p);else ir(P,f.p,0,0,320,{arc:.03})}
  if(f.v===P.v)return;const d=f.v-P.v;P.v=f.v;if(snap||d<0){P.en=0;return K().llena(P.o,f.v)}
  if(k[0]==='a'){const c=pila(d);c.o.position.copy(jugador(f.s));ir(c,f.p,0,0,A.ficha,{arc:.12,fin:()=>{R.remove(c.o);if(P.v===f.v)K().llena(P.o,f.v)}});if(f.s!==yo())son('chip')}
  else P.en=now+A.ficha*.9})}
function pasoPilas(now){PILAS.forEach(P=>{if(P.en&&now>=P.en){P.en=0;K().llena(P.o,P.v);P.o.visible=true}})}

function boton(snap){const b=M0&&M0.D.boton;if(!b||!V||V.btn<0)return;const p=btnPos(V.btn);if(!BT)BT=v3(b.position.x,b.position.y,b.position.z);
 BT.copy(p);if(snap)b.position.copy(p)}
function sync(snap){const nueva=mano!=null&&V.mano!==mano;cartas(snap);fichas(snap);boton(snap);mano=V.mano;if(nueva&&!snap)son('tick')}

// ---------- gente sentada (MPJ en marcos sobre las sillas de CAS3) ----------
let PJ=null;   // su propia instancia de MPJ
function gente(now){if(!window.MPJ)return;const MPJ=PJ||(PJ=window.MPJ.nueva());const L=[],y=sentadoYa()&&vista==='yo'?yo():-1;
 V.as.forEach((a,i)=>{if(!a||i===y)return;const q=quien(a.id);L.push({i,k:a.id,cod:(q&&q.av)||MPJ.codigo(a.n)})});
 const k=JSON.stringify(L);if(k!==mk){const ok=MPJ.sync({g:R,sillas:SIL},L,{listo:()=>{mk=''}});mpjOk=!!(window.AV&&AV.ya&&AV.ya());mk=ok||!L.length?k:''}
 if(mpjOk)MPJ.paso(now,V.fase==='mano'?V.turno:-1)}

// ---------- tu lugar y la cámara: 'yo' = tus ojos, inclinado sobre la mesa · 'arriba' = toda la mesa desde detrás de tu silla ----------
let vista='yo',fov0=0,dbl=0,pz=0;const look={y:0,p:0,z:1},teclas=new Set(),toques=new Map();
const CD=new THREE.PerspectiveCamera(),Pc=v3(0,0,0),Lc=v3(0,0,0),Dv=v3(0,0,0);
const clampL=()=>{const C=A.cam;look.y=Math.max(-C.giro,Math.min(C.giro,look.y));look.p=Math.max(-C.baja,Math.min(C.sube,look.p));look.z=Math.max(1,Math.min(C.zoom,look.z))};
function camara(now,s,dt){const m=M(),C=H().cam();if(!C)return;const l=m.lugares[s],fx=Math.sin(l.ry),fz=Math.cos(l.ry),Q=A.cam;
 if(teclas.size){const g=dt*1.6/look.z;if(teclas.has('l'))look.y+=g;if(teclas.has('r'))look.y-=g;if(teclas.has('u'))look.p+=g*.7;if(teclas.has('d'))look.p-=g*.7;clampL()}
 if(vista==='yo'){Pc.set(l.x+fx*Q.adelante,Q.ojo,l.z+fz*Q.adelante);const c=lugar({s,j:.5,c:0}).p;Lc.set(c.x*(1-Q.mira),TH,c.z*(1-Q.mira));m.G.localToWorld(Lc)}
 else{const a=Q.arriba,o=ov(.2+a.atras,s);Pc.set(o.x,TH+a.alto,o.z);m.G.localToWorld(Pc);Lc.set(0,TH,0);m.G.localToWorld(Lc)}
 Dv.subVectors(Lc,Pc);const y0=Math.atan2(Dv.x,Dv.z),pa=Math.atan2(Dv.y,Math.hypot(Dv.x,Dv.z)),yw=y0+look.y,pt=Math.max(-1.5,Math.min(.5,pa+look.p));
 Dv.set(Math.sin(yw)*Math.cos(pt),Math.sin(pt),Math.cos(yw)*Math.cos(pt));CD.position.copy(Pc);CD.lookAt(Lc.copy(Pc).add(Dv));
 if(!fov0)fov0=C.fov;const f=Math.min(100,fov0*(vista==='arriba'?Q.arriba.fov:1))/look.z;if(Math.abs(C.fov-f)>.01){C.fov+=(f-C.fov)*Math.min(1,dt*12);C.updateProjectionMatrix()}
 if(!p0){p0=C.position.clone();q0=C.quaternion.clone();camT=now}const e=ease(Math.min(1,(now-camT)/Q.blend));
 C.position.lerpVectors(p0,Pc,e);C.quaternion.slerpQuaternions(q0,CD.quaternion,e);C.updateMatrixWorld()}
function ver(v){const C=H()&&H().cam();vista=v==null?(vista==='yo'?'arriba':'yo'):v;Object.assign(look,{y:0,p:0,z:1});if(C){p0=C.position.clone();q0=C.quaternion.clone();camT=performance.now()}mk='';rr()}
function recentra(){Object.assign(look,{y:0,p:0,z:1});rr()}
const mirando=()=>Math.abs(look.y)>.05||Math.abs(look.p)>.05||look.z>1.05;
function sienta(s){const l=M().lugares[s],me=quien(yoId());pide=-1;vista='yo';Object.assign(look,{y:0,p:0,z:1});if(!me)return;
 me.pos.x=l.x-Math.sin(l.ry)*.85;me.pos.z=l.z-Math.cos(l.ry)*.85;ancla={x:me.pos.x,z:me.pos.z};meVis=me.g.visible}
function suelta(){const me=quien(yoId()),C=H()&&H().cam();if(me&&meVis!=null)me.g.visible=meVis;ancla=null;meVis=null;p0=null;teclas.clear();toques.clear();mk='';
 if(C&&fov0){C.fov=fov0;C.updateProjectionMatrix()}fov0=0;if(C&&window.CCAM)CCAM.blendIn(C,CCAM.pose(C),700)}
// entrada: mientras estás sentado, el lienzo es tuyo
const sentadoYa=()=>yo()>=0&&!!ancla;
const lienzo=e=>{const r=H()&&H().R&&H().R();return !!r&&e.target===r.domElement&&sentadoYa()};
addEventListener('pointerdown',e=>{if(!lienzo(e))return;e.stopPropagation();toques.set(e.pointerId,{x:e.clientX,y:e.clientY});
 const t=performance.now();if(toques.size===1){if(t-dbl<320){recentra();dbl=0}else dbl=t}pz=0},true);
addEventListener('pointermove',e=>{const p=toques.get(e.pointerId);if(!p)return;e.stopPropagation();
 if(toques.size>=2){p.x=e.clientX;p.y=e.clientY;const [a,b]=[...toques.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pz)look.z*=d/pz;pz=d;clampL();return}
 const k=A.cam.sens/look.z;look.y+=(e.clientX-p.x)*k;look.p+=(e.clientY-p.y)*k;p.x=e.clientX;p.y=e.clientY;clampL()},true);
const suelto=e=>{if(toques.delete(e.pointerId)){e.stopPropagation();pz=0;rr()}};addEventListener('pointerup',suelto,true);addEventListener('pointercancel',suelto,true);
addEventListener('wheel',e=>{if(!lienzo(e))return;e.stopPropagation();e.preventDefault();look.z*=Math.exp(-e.deltaY*.0015);clampL();rr()},{capture:true,passive:false});
const TK={arrowleft:'l',a:'l',arrowright:'r',d:'r',arrowup:'u',w:'u',arrowdown:'d',s:'d'};
addEventListener('keydown',e=>{if(!sentadoYa()||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;const k=e.key.toLowerCase();
 if(TK[k]){e.stopPropagation();e.preventDefault();teclas.add(TK[k])}else if(k==='+'||k==='='||k==='-'){e.stopPropagation();look.z*=k==='-'?.8:1.25;clampL();rr()}},true);
addEventListener('keyup',e=>{const k=TK[e.key.toLowerCase()];if(k&&teclas.delete(k))rr()},true);
addEventListener('blur',()=>teclas.clear());
function cerca(){const me=quien(yoId()),P=window.SAL&&SAL.P.poker;return !!(me&&P&&H().piso()==='sot'&&Math.hypot(me.pos.x-P.x,me.pos.z-P.z)<A.cerca)}

// ---------- jugadas ----------
function act(op,x){if(cola.length<8)cola.push(Object.assign({op},x||{}))}
function sentar(){const m=M();if(!m||!V||yo()>=0||pide>=0)return;const me=quien(yoId());if(!me)return;let b=-1,bd=1e9;
 m.lugares.forEach((l,i)=>{if(i>=V.as.length||V.as[i])return;const d=Math.hypot(l.x-me.pos.x,l.z-me.pos.z);if(d<bd){bd=d;b=i}});
 if(b<0)return window.SAL&&SAL.aviso('La mesa está llena');pide=b;pideT=performance.now();act('sentar',{s:b});son('tick')}
function levantarse(){if(yo()<0)return;act('parar');parando=true;suelta();rr()}

function estado(v,err){if(err&&window.SAL)SAL.aviso(err);if(err)pide=-1;if(!v||!v.as)return;v.t0=performance.now();V=v;PK3.v=v;
 if(parando&&mio()<0)parando=false;if(pide>=0&&performance.now()-pideT>4000)pide=-1;if(ini)sync(false)}
function arma(){const m=M();if(!m||!H()||!K()||!m.D.enOvalo)return false;if(R&&R.parent)R.parent.remove(R);CAR.clear();TW.length=0;PILAS.clear();SIL.length=0;
 M0=m;TH=m.D.TH||1.5;R=new THREE.Group();m.G.add(R);m.sillas.forEach(c=>{const w=new THREE.Group();w.position.y=A.silla;c.add(w);SIL.push(w)});
 ini=true;mk='';BT=null;if(V)sync(true);return true}
function paso(){const now=performance.now(),dt=Math.min(.1,(now-(tP||now))/1000);if((!ini||M()!==M0)&&!arma())return;
 if(now-tP>1000){acaba();mk=''}   // pestaña dormida: todo a su lugar
 tP=now;pasoTw(now);pasoPilas(now);if(!V)return;if(V.fase==='fin')fichas(false);
 const b=M0.D.boton;if(b&&BT&&b.position.distanceTo(BT)>1e-3)b.position.lerp(BT,Math.min(1,dt*5));
 gente(now);const s=yo(),me=quien(yoId());
 if(s>=0){if(!ancla)sienta(s);if(me&&ancla){if(Math.hypot(me.pos.x-ancla.x,me.pos.z-ancla.z)>.4)levantarse();else{if(mpjOk)me.g.visible=false;camara(now,s,dt)}}}
 else if(ancla)suelta();
 document.documentElement.classList.toggle('pksit',sentadoYa());
 const k=[s,s<0&&cerca(),vista,mirando(),s>=0?V.as[s].f:V.as.filter(Boolean).length,V.fase,V.turno].join('|');if(k!==hk){hk=k;rr()}}

// ---------- aviso de la mesa (al centro abajo, como CMESA); la barra de jugadas llega con P4 ----------
function hud(busy){if(busy||!ini||!V||!H()||H().piso()!=='sot')return '';const s=yo(),I=n=>window.UI?UI.ico(n):'';
 if(window.PKH&&s>=0)return PKH.hud(V,s);
 if(s>=0)return `<button class="ui uh-aviso" onclick="PK3.levantarse()" aria-label="Levantarse de la mesa de Póker"><span class="uh-ai" aria-hidden="true">${I('salir')}</span>
  <span class="uh-at"><b>Póker · ${mon(V.as[s].f)} en fichas</b><small>Levantarse</small></span>${touchy?'':'<kbd>Esc</kbd>'}</button>`;
 if(!cerca())return '';const n=V.as.filter(Boolean).length,[sb,bb]=V.ciegas||[5,10];
 return `<button class="ui uh-aviso" onclick="PK3.sentar()" aria-label="Jugar Póker"><span class="uh-ai" aria-hidden="true">${I('jugar')}</span>
  <span class="uh-at"><b>Jugar Póker</b><small>${n?n+' en la mesa · ':''}Ciegas $${sb}/$${bb}${touchy?' · toca para sentarte':''}</small></span>${touchy?'':'<kbd>E</kbd>'}</button>`}
function key(k){if(k==='escape'&&yo()>=0){levantarse();return true}if(k==='e'&&yo()<0&&cerca()){sentar();return true}return false}

const PK3=window.PK3={A,v:null,estado,paso,hud,key,act,sentar,levantarse,yo,ver,recentra,mirando,vista:()=>vista,out:()=>cola.shift()||null,tap:()=>{if(yo()<0)sentar()},cerca,
 sentado:id=>!!(mpjOk&&V&&H()&&H().piso()==='sot'&&V.as.some(a=>a&&a.id===id))};
})();
