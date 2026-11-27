// c_rummy3d.js — R3: el Rummy en la mesa redonda de la casona (MESA), con los personajes (MPJ) y la casa de fondo (FONDO). NO cambia reglas.
// Lo maneja c_rummyui.js con la misma API que el 2D (ok, show, layout, sync, cam, sort) y le avisa jugadas con R3.fx(f).
// Dos posturas: en tu turno te inclinas sobre la mesa (cámara alta, la mesa llena la pantalla); en el de otro te recargas y ves a todos,
// con la cabeza volteando hacia quien juega. Arrastrar con un dedo mueve la vista, dos dedos acercan y giran; a los 5 s sin tocar regresa sola.
// Fichas: todas en una malla instanciada (RUK.fichas) para la mesa y los atriles ajenos, y otra para tu atril, que va pegado abajo de la pantalla
// con su propia cámara fija (CR: no se mueve con la vista). Al pasar de un marco a otro la ficha conserva su lugar en pantalla.
// La mesa se acomoda sola en filas; con una ficha levantada aparecen huecos verdes donde cabe (y uno para grupo nuevo).
(function(){
if(typeof THREE==='undefined'||!window.RUMMY||!window.RUK)return;
const RU=window.RUMMY,K=window.RUK,v3=(x,y,z)=>new THREE.Vector3(x,y,z),cl=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
const RMo=()=>typeof RM!='undefined'&&RM;
const FELT=['#2f7d63','#123f33'],SO=.34,DC=3,TILT=K.TILT;   // SO: fichas de los atriles ajenos · DC: distancia de tu atril a su cámara
(window.MESA_J=window.MESA_J||{}).rummy={col:()=>FELT,logo:null};
let R,SC,CA,CR,root,cv,ready=false,failed=false,shown=false,shR=false,fz=0,W=0,H=0,dirty=true,gen=0,anim=true,first=true,lastNow=0;
let IN={t:0,r:0,rb:0},S=null,mesa=null,tbl=null,bag=null,clock=null,TW=null,TC=null,myR=null,myK='',rk={},glowM=null,LT=null,RK=null,dealT=0,gameK='';
const P=new Map(),pool={s:[],r:[],b:[]},idxW=[],idxC=[],X=v3(1,0,0),Y=v3(0,1,0);
const QI=new THREE.Quaternion(),M4=new THREE.Matrix4(),SV=v3(0,0,0),SCL=v3(1,1,1),ray=new THREE.Raycaster(),P2=new THREE.Vector2(),PL=new THREE.Plane(v3(0,1,0),0);
ray.layers.enableAll();
const CAM={p:0,pt:0,IN:null,BK:null,rh:1},VT={x:0,z:0,k:1,a:0,t:0},VW={x:0,z:0,k:1,a:0,t:0};
let tocado=0,shake=0,hd=0,tcK='',vuelta=0;
const act=()=>shown&&!!S&&typeof V!='undefined'&&!!V&&V.game==='rummy'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final');
const rel=k=>{const o=S.G.ord,me=S.me<0?o[0]:S.me;return (o.indexOf(k)-o.indexOf(me)+o.length)%o.length};
const sfx=(n,v)=>{if(window.RMS)RMS.snd(n,v)};

// ---------- escena ----------
function init(){if(ready||failed)return;try{
 shR=!!(window.FONDO&&FONDO.R('rummy'));R=shR?FONDO.R():new THREE.WebGLRenderer({antialias:true,alpha:true});
 if(!shR){R.setPixelRatio(Math.min(devicePixelRatio||1,window.MOVIL?1.5:2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap}
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,200);CR=new THREE.PerspectiveCamera(40,1,.05,40);SC.add(CA,CR);
 const hl=new THREE.HemisphereLight(0xfff4e2,0x2a1e18,1.6),Ld=new THREE.DirectionalLight(0xffe9c8,2.5);Ld.position.set(-6,14,8);Ld.castShadow=true;Ld.shadow.mapSize.set(window.MOVIL?1024:2048,window.MOVIL?1024:2048);Ld.shadow.bias=-.0004;
 Object.assign(Ld.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:50});const fill=new THREE.DirectionalLight(0xc8dcff,.55);fill.position.set(6,6,-5);
 const pt=new THREE.PointLight(0xffffff,1.1,0,1.4);pt.position.set(0,.6,.6);CR.add(pt);SC.add(hl,Ld,fill);[hl,Ld,fill,pt].forEach(l=>l.layers.enableAll());R.autoClear=false;
 root=document.createElement('div');root.id='rm3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pCancel);
 cv.addEventListener('contextmenu',e=>e.preventDefault());cv.addEventListener('wheel',e=>{if(!act())return;e.preventDefault();toca();VT.k=cl(VT.k*Math.exp(-e.deltaY*.0015),.75,2.6)},{passive:false});
 TW=K.fichas(140);SC.add(TW.m);TC=K.fichas(48);CR.add(TC.m);TC.m.layers.set(1);TC.m.castShadow=TC.m.receiveShadow=false;
 glowM=K.plano(K.brillo(),{blending:THREE.AdditiveBlending});glowM.visible=false;SC.add(glowM);
 ready=true;requestAnimationFrame(loop)}catch(e){console.warn('Rummy 3D:',e);failed=true}}
function build(n){if(window.MPJ)MPJ.suelta();if(tbl){SC.remove(tbl);tbl.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 tbl=new THREE.Group();SC.add(tbl);mesa=MESA.arma(tbl,{n,col:FELT,logo:null,aire:true});mesa.escala((fz||MESA.CASA_S)*((window.FONDO&&FONDO.MII)||1));
 if(window.C3D&&C3D.buildRoom){const room=C3D.buildRoom(false,mesa.r,mesa.r);tbl.add(room);tbl.userData.room=room}
 const r=mesa.r;bag=K.bolsa();bag.position.set(r*.6,0,r*.62);bag.rotation.y=.5;tbl.add(bag);
 clock=K.reloj();clock.position.set(-r*.63,0,r*.6);clock.scale.setScalar(1.1);tbl.add(clock);
 rk={};for(let i=1;i<n;i++){const A=mesa.asiento(i),g=K.atril(4.6,SO,2),d=r-.62;g.position.set(Math.cos(A.a)*d,0,Math.sin(A.a)*d);g.rotation.y=Math.PI/2-A.a;tbl.add(g);rk[i]=g}
 tbl.updateMatrixWorld(true);P.clear();fz=-1;dirty=true}
function casaModo(){const v=!fz,rm=tbl&&tbl.userData.room;if(rm)rm.visible=v;if(mesa){mesa.pie.visible=v;mesa.escala((fz||MESA.CASA_S)*((window.FONDO&&FONDO.MII)||1));mesa.sillas[0].visible=true}dirty=true}

// ---------- tu atril: pegado abajo de la pantalla (cámara CR, sin el corrimiento de la vista) ----------
const upp=()=>2*DC*Math.tan(THREE.MathUtils.degToRad(CR.fov/2))/H;
const scr=(x,y)=>v3((x-W/2)*upp(),(H/2-y)*upp(),-DC);
function rackLay(){const n=S&&S.atril?S.atril.length:14,land=W>H*1.1,av=Math.max(160,W-(land?IN.r:0)-20-74);   // 74: el globo del chat abajo a la derecha
let tp=land?Math.min(H*.125,58):Math.min(W/11.4,50);
 let cap=Math.floor((av-tp*.9)/(tp*1.06));if(land&&n>cap){const t2=Math.max(34,av/(n*1.06+.9));if(t2<tp){tp=t2;cap=Math.floor((av-tp*.9)/(tp*1.06))}}let nt=n>cap?2:1;if(nt==2&&n>cap*2){tp=(av-tp*.9)/(Math.ceil(n/2)*1.06);cap=Math.ceil(n/2)}
 const u=upp(),Lc=av*u,sc=tp*u,key=[W,H,nt,Math.round(Lc*1e3),Math.round(sc*1e4)].join(':');
 if(key!==myK){myK=key;if(myR){CR.remove(myR);myR.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
  myR=K.atril(Lc,sc,nt);myR.traverse(o=>{o.layers.set(1);if(o.isMesh)o.castShadow=o.receiveShadow=false});CR.add(myR);
  const cx=10+av/2;myR.position.copy(scr(cx,H-3));myR.rotation.x=.62;myR.updateMatrix();
  // las fichas quedan justo a la distancia DC (así miden en pantalla lo calculado y no se salen por los lados)
  const zs=myR.userData.slot(0,0).p.applyMatrix4(myR.matrix).z,kz=DC/-zs;myR.position.multiplyScalar(kz);myR.updateMatrix();
  // que no se corte: lo más bajo (la orilla del frente o el pie de las fichas) queda 4 px arriba de la orilla de la pantalla
  const b1=v3(0,0,sc).applyMatrix4(myR.matrix),b2=myR.userData.slot(0,0).p.add(v3(0,-K.H*sc*Math.cos(TILT)/2,K.H*sc*Math.sin(TILT)/2)).applyMatrix4(myR.matrix);
  myR.position.y+=-(H/2-4)*u-Math.min(b1.y,b2.y);myR.updateMatrix();
  const t1=v3(0,myR.userData.alto,-myR.userData.fondo).applyMatrix4(myR.matrix),t2=myR.userData.slot(nt-1,0).p.add(v3(0,K.H*sc*Math.cos(TILT)/2,-K.H*sc*Math.sin(TILT)/2)).applyMatrix4(myR.matrix),ty=H/2-Math.max(t1.y,t2.y)/u;RK={nt,cap,sc,Lc,tp,top:ty,cx}}
 return RK}
// lugar j del atril (fila de abajo primero): {p, q} en el marco de CR
function rackSlot(j,n){const L=RK,f=L.nt==2&&j>=L.cap?1:0,jj=f?j-L.cap:j,m=f?n-L.cap:Math.min(n,L.cap),pit=L.sc*1.06,x=(jj-(m-1)/2)*pit,s=myR.userData.slot(f,x);
 s.p.applyMatrix4(myR.matrix);s.q.premultiply(myR.quaternion);return s}

// ---------- la mesa: grupos en filas que se acomodan solos; con ficha levantada, huecos donde cabe ----------
function layTable(m,D,sel){const Rr=mesa.r-1.25,seqs=m.map((g,gi)=>{const s=g.map((id,i)=>({id,g:gi,i}));
  if(D){const ps=g.indexOf(sel);D.filter(d=>d.g===gi).sort((a,b)=>b.at-a.at).forEach(d=>{const at=ps>=0&&d.at>ps?d.at+1:d.at;s.splice(at,0,{gh:d})})}return s});
 if(D)seqs.push([{gh:{g:-1},mas:1}]);
 if(!seqs.length)return {items:[],gh:[],gr:[],tw:.62,box:null};
 for(let tw=.74;tw>.18;tw*=.94){const th=tw*K.H,pt=tw*1.05,gg=tw*.62,pitch=th*1.22,wd=s=>s.length*pt-(pt-tw);
  for(let nr=1;nr*pitch<=2*Rr;nr++){const z0=-((nr-1)*pitch)/2,hw=j=>{const e=Math.abs(z0+j*pitch)+th/2;return e>=Rr?0:Math.sqrt(Rr*Rr-e*e)};
   const rows=Array.from({length:nr},()=>({s:[],w:0}));let ri=0,ok=true;
   for(const s of seqs){const w=wd(s);while(ri<nr&&(rows[ri].w?rows[ri].w+gg+w:w)>2*hw(ri))ri++;if(ri>=nr){ok=false;break}const R0=rows[ri];R0.w=R0.w?R0.w+gg+w:w;R0.s.push(s)}
   if(!ok)continue;
   const items=[],gh=[],gr=[];let x0=1e9,x1=-1e9;
   rows.forEach((R0,j)=>{const z=z0+j*pitch;let x=-R0.w/2;R0.s.forEach(s=>{const gx=x;s.forEach(t=>{const p=v3(x+tw/2,K.D*tw/2,z);if(t.gh)gh.push({p,d:t.gh,mas:t.mas});else items.push({id:t.id,g:t.g,i:t.i,p});x+=pt});
     const g0=s.find(t=>!t.gh);if(g0)gr.push({g:g0.g,x:(gx+x-pt+tw)/2,z,w:x-pt+tw-gx});x+=gg-pt+tw});x0=Math.min(x0,-R0.w/2);x1=Math.max(x1,R0.w/2)});
   return {items,gh,gr,tw,th,box:{x0,x1,z0:z0-th/2,z1:z0+(nr-1)*pitch+th/2}}}}
 return {items:[],gh:[],gr:[],tw:.2,box:null}}
// dónde está la ficha j del atril de k (para que lo que juega salga de ahí y lo que roba llegue ahí)
function enAtril(k,j,n){const i=rel(k),g=rk[i];if(!g)return null;const cap=Math.floor(4.6/(SO*1.06)),f=j>=cap?1:0,jj=f?j-cap:j,m=f?n-cap:Math.min(n,cap),s=g.userData.slot(f,(jj-(m-1)/2)*SO*1.06*(m>cap?cap/m:1));
 return {p:g.localToWorld(s.p),q:g.getWorldQuaternion(new THREE.Quaternion()).multiply(s.q)}}
const boca=()=>bag?bag.localToWorld(bag.userData.boca.clone()):v3(0,1,0);

// ---------- piezas: una por ficha (t+id) o por ficha boca abajo de un atril ajeno (h+k_j) ----------
function aMarco(x,fr){CA.updateMatrixWorld();CR.updateMatrixWorld();
 if(fr==='c'){SV.copy(x.p).applyMatrix4(CA.matrixWorldInverse);const z=SV.z;SV.applyMatrix4(CA.projectionMatrix);const v=v3(SV.x,SV.y,.5).applyMatrix4(CR.projectionMatrixInverse);x.p.copy(v.multiplyScalar(z/v.z));
  x.q.premultiply(CA.getWorldQuaternion(new THREE.Quaternion()).invert())}
 else{SV.copy(x.p);const z=SV.z;SV.applyMatrix4(CR.projectionMatrix);const v=v3(SV.x,SV.y,.5).applyMatrix4(CA.projectionMatrixInverse);v.multiplyScalar(z/v.z);x.p.copy(v.applyMatrix4(CA.matrixWorld));
  x.q.premultiply(CA.getWorldQuaternion(new THREE.Quaternion()))}
 x.fr=fr}
function pon(k,id,fr,p,q,s,o){o=o||{};let x=P.get(k);
 if(!x){const d=o.de;x={k,id,fr:d?d.fr||'w':fr,p:(d?d.p:p).clone(),q:(d&&d.q?d.q:q).clone(),s:d&&d.s?d.s:s,T:null,tw:null,hop:null};P.set(k,x);if(!d)o.ms=0}
 x.id=id;x.vivo=gen;x.tint=o.tint;x.hit=o.hit||null;
 const T=x.T;if(T&&T.fr===fr&&T.p.distanceToSquared(p)<1e-8&&T.q.angleTo(q)<1e-4&&Math.abs(T.s-s)<1e-6)return x;
 x.T={fr,p:p.clone(),q:q.clone(),s};if(x.fr!==fr)aMarco(x,fr);
 const ms=RMo()?0:o.ms==null?340:o.ms;anim=true;
 if(!ms){x.p.copy(p);x.q.copy(q);x.s=s;x.tw=null;return x}
 x.tw={p0:x.p.clone(),q0:x.q.clone(),s0:x.s,t0:performance.now()+(o.delay||0),ms,arc:o.arc==null?.3*s:o.arc,spin:o.spin||0,snd:o.snd};return x}
const QS=new THREE.Quaternion();
function piezas(now){if(!anim)return;let nw=0,nc=0,any=false;
 const dk=drg&&drg.T?'t'+drg.id:null;
 P.forEach(x=>{if(x.k===dk&&x.T===drg.T){x.p.lerp(x.T.p,.5);x.q.slerp(x.T.q,.4);x.s+=(x.T.s-x.s)*.4;any=true}const w=x.tw;if(w){const k0=(now-w.t0)/w.ms;any=true;if(k0>=0){const k=Math.min(1,k0),e=1-Math.pow(1-k,3);x.p.lerpVectors(w.p0,x.T.p,e);x.p.y+=Math.sin(Math.PI*k)*w.arc;
   x.q.slerpQuaternions(w.q0,x.T.q,e);if(w.spin)x.q.multiply(QS.setFromAxisAngle(Y,w.spin*(1-e)));x.s=w.s0+(x.T.s-w.s0)*e;if(k===1){x.tw=null;if(w.snd)sfx('clac',.45)}}}
  let hy=0;if(x.hop){const k=(now-x.hop.t0)/440;if(k>=1)x.hop=null;else if(k>0)hy=Math.sin(Math.PI*k)*x.hop.a;any=true}
  SV.copy(x.p);SV.y+=hy;M4.compose(SV,x.q,SCL.setScalar(x.s));
  if(x.fr==='c'){TC.pon(nc,x.id,M4,x.tint);idxC[nc++]=x.k}else{TW.pon(nw,x.id,M4,x.tint);idxW[nw++]=x.k}});
 TW.fin(nw);TC.fin(nc);TW.m.computeBoundingSphere();TC.m.computeBoundingSphere();anim=any}

// ---------- sincronizar con lo que dice c_rummyui.js ----------
const TN=[.93,.93,.93],TNEW=[1.05,1.01,.9],TLK=[.66,.66,.66],TSEL=[1.08,1.03,.86];
let prevVal=new Set(),prevJ={},prevNr=null,prevOn=new Set(),deTurno=-1;
function sync(s){S=s;if(!ready||!act())return;const G=s.G,n=G.players.length;if(!mesa||mesa.n!==n){dirty=true;return}gen++;
 const gk=G.t0+':'+n;if(gk!==gameK){gameK=gk;first=true;prevVal=new Set();prevJ={};prevNr=null;prevOn=new Set();if(!G.mesa.length&&!G.tmp&&(G.el||0)<9000)dealT=performance.now()}
 const dealing=dealT&&performance.now()-dealT<2500,fin=G.phase!=='play',sel=s.my?s.sel:null,lv=G.phase=='play'&&!s.my&&G.tmp;
 const D=sel!=null&&window.RMU&&RMU.destinos?RMU.destinos(sel):null;
 LT=layTable(s.mesa,D,sel);const L=LT,now=performance.now();
 // fichas de la mesa (las nuevas de otro salen de su atril; las tuyas vienen de tu atril)
 const A=new Set(G.mesa.flat()),onNow=new Set();let gi=0;
 const turnK=G.turn,tc=turnK>=0&&turnK!==s.me&&!fin?(s.cnt[turnK]||0):0;
 const dg=drg?drg.id:null;
 L.items.forEach(it=>{const id=it.id,k='t'+id,x=P.get(k);onNow.add(id);if(id===dg){if(x)x.vivo=gen;return}let de=null,spin=0;
  if(!x&&!first&&turnK>=0&&turnK!==s.me){const e=enAtril(turnK,tc+(gi++),tc+gi);if(e)de={fr:'w',p:e.p,q:e.q,s:SO}}
  if(RU.isJ(id)&&prevJ[id]!=null&&prevJ[id]!==JSON.stringify(s.mesa[it.g]))spin=Math.PI*2;
  const lk=s.lock&&s.lock.has(it.g),nw=s.nuevas&&s.nuevas.has(id),up=id===sel;
  pon(k,id,'w',up?it.p.clone().setY(it.p.y+.5*L.tw):it.p,QI,L.tw,{de,spin,snd:!!de,tint:up?TSEL:lk?TLK:nw?TNEW:TN,hit:{t:'mesa',id,g:it.g,i:it.i},ms:de?620:x&&x.fr==='c'?420:320,arc:de||(x&&x.fr==='c')?1.3*L.tw:undefined})});
 prevJ={};s.mesa.forEach(g=>g.forEach(id=>{if(RU.isJ(id))prevJ[id]=JSON.stringify(g)}));
 // grupos que se acaban de completar: destellos
 const val=new Set();s.mesa.forEach((g,i)=>{if(g.length>=3&&RU.grp(g))val.add(g.slice().sort((a,b)=>a-b).join())});
 if(!first&&!dealing)L.gr.forEach(r=>{const g=s.mesa[r.g],key=g&&g.slice().sort((a,b)=>a-b).join();if(key&&val.has(key)&&!prevVal.has(key)&&g.some(id=>!A.has(id))){if(window.MFX)MFX.destello(SC,v3(r.x,.02,r.z),r.w+L.tw*.4,L.th*1.4,0xffe7a0);sfx('grupo',.8)}});
 prevVal=val;
 // tu atril
 if(s.atril){const L2=rackLay(),n2=s.atril.length;s.atril.forEach((id,j)=>{const k='t'+id,x=P.get(k),sl=rackSlot(j,n2),up=id===s.sel;if(id===dg){if(x)x.vivo=gen;return}let de=null,delay=0,ms=300;
   if(!x){de={fr:'w',p:boca(),q:QI,s:L.tw};ms=dealing?640:560;if(dealing)delay=(j*n+rel(s.me))*26}
   const p=up?sl.p.clone().add(v3(0,L2.sc*.42,0).applyQuaternion(myR.quaternion)):sl.p;
   pon(k,id,'c',p,sl.q,L2.sc,{de,delay,ms,arc:de?L2.sc*1.5:undefined,snd:!!de&&!dealing,tint:up?TSEL:null,hit:{t:'atril',id,i:j}})})}
 // atriles ajenos (al final, sus fichas boca arriba frente a su atril)
 G.ord.forEach(k=>{if(k===s.me&&!(s.me<0))return;const i=rel(k);if(!rk[i])return;
  if(fin&&G.racks){const ids=G.racks[k]||[],g=rk[i],q=QI;ids.forEach((id,j)=>{const m=ids.length,x=(j-(m-1)/2)*SO*1.25,p=g.localToWorld(v3(x,K.D*SO/2,1.15));const e=enAtril(k,j,m);pon('t'+id,id,'w',p,q,SO*1.15,{de:e?{fr:'w',p:e.p,q:e.q,s:SO}:null,delay:j*60,ms:520})});return}
  const c=s.cnt[k]||0;for(let j=0;j<c;j++){const e=enAtril(k,j,c),x=P.get('h'+k+'_'+j);
   pon('h'+k+'_'+j,-1,'w',e.p,e.q,SO,{de:x?null:first&&!dealing?null:{fr:'w',p:boca(),q:QI,s:SO*.8},delay:dealing?(j*n+i)*26:0,ms:dealing?640:560,arc:1.1,hit:{t:'atril2',k}})}});
 P.forEach((x,k)=>{if(x.vivo!==gen){P.delete(k);anim=true}});
 // huecos, rayas de grupo malo, brillo de la elegida y sugerencias del atril
 marcas(s,L);
 // posturas: inclinado en tu turno (o con algo levantado), recargado si no
 CAM.pt=!fin&&(s.my||sel!=null)?1:0;encuadre();
 const tk=G.tc+':'+G.turn;if(tk!==tcK){if(tcK&&!fin)vuelta=performance.now();tcK=tk}
 // le queda una (o dos): todos lo miran
 if(prevNr&&!fin)G.nr.forEach((c,k)=>{if(c<=2&&prevNr[k]>2&&!G.out[k]){if(window.MPJ&&MPJ.on)G.ord.forEach(j=>{if(j!==k)MPJ.mira(rel(j),cabeza(k),2200)});sfx('tension')}});prevNr=G.nr.slice();
 avSync();first=false;dirty=false}
function cabeza(k){const q=window.MPJ&&MPJ.on&&MPJ.arriba(rel(k));if(q)return q;const A=mesa.asiento(rel(k));return A.pos.clone().setY(2)}
function pool1(arr,mk,par){return i=>{let o=arr[i];if(!o){o=mk();arr[i]=o;par.add(o)}o.visible=true;return o}}
function marcas(s,L){const hs=pool1(pool.s,()=>K.plano(K.hueco(0)),SC),rs=pool1(pool.r,()=>K.plano(K.raya()),SC),bs=pool1(pool.b,()=>{const m=K.plano(K.raya(),{color:0xffd15a});m.rotation.x=0;m.layers.set(1);return m},CR);
 [pool.s,pool.r,pool.b].forEach(a=>a.forEach(o=>{o.visible=false;o.userData.hit=null}));
 L.gh.forEach((g,i)=>{const o=hs(i),t=K.hueco(!!g.mas);if(o.material.map!==t){o.material.map=t;o.material.needsUpdate=true}o.position.copy(g.p).setY(.006);o.scale.set(L.tw*1.02,L.th*1.02,1);o.userData.hit={t:'hueco',d:g.d}});
 let j=0;L.gr.forEach(r=>{if(!s.bad||!s.bad.has(r.g))return;const o=rs(j++);o.position.set(r.x,.006,r.z+L.th/2+L.tw*.16);o.scale.set(r.w,L.tw*.45,1);o.userData.hit={t:'raya',g:r.g}});
 const sel=s.sel,it=sel!=null&&L.items.find(t=>t.id===sel);glowM.visible=!!it;if(it){glowM.position.set(it.p.x,.004,it.p.z);glowM.scale.set(L.tw*2.2,L.th*1.9,1)}
 // sugerencias: raya dorada bajo los grupos que ya tienes armados en la fila de abajo (tocarla los baja juntos)
 if(s.sug&&s.atril&&RK){let b=0;const n=s.atril.length;s.sug.forEach(gs=>{const ix=gs.map(id=>s.atril.indexOf(id)).sort((a,b)=>a-b);if(ix[0]<0||ix[ix.length-1]-ix[0]!==ix.length-1||ix[ix.length-1]>=RK.cap)return;
   const a=rackSlot(ix[0],n),z=rackSlot(ix[ix.length-1],n),o=bs(b++);
   // acostada sobre la orilla del escalón de abajo, frente a las fichas (si no, el atril la tapa)
   const inv=new THREE.Matrix4().copy(myR.matrix).invert(),xa=a.p.clone().applyMatrix4(inv).x,xz=z.p.clone().applyMatrix4(inv).x;
   o.position.set((xa+xz)/2,.275*RK.sc,.9*RK.sc).applyMatrix4(myR.matrix);o.quaternion.copy(myR.quaternion).multiply(QS.setFromAxisAngle(X,-Math.PI/2));o.scale.set(Math.abs(xz-xa)+RK.sc*.85,RK.sc*.2,1);o.userData.hit={t:'sug',ids:gs.slice()}})}}

// ---------- cámara: dos posturas y lo que pone el jugador encima ----------
function fit(pts,T,el,rh){CA.clearViewOffset();CA.aspect=W/rh;CA.updateProjectionMatrix();
 const ext=d=>{CA.position.set(T.x,T.y+Math.sin(el)*d,T.z+Math.cos(el)*d);CA.lookAt(T);CA.updateMatrixWorld();let a=1e9,b=-1e9,c=1e9,e=-1e9;
  for(const p of pts){SV.copy(p).project(CA);a=Math.min(a,SV.x);b=Math.max(b,SV.x);c=Math.min(c,SV.y);e=Math.max(e,SV.y)}return [a,b,c,e]};
 let lo=1,hi=160;for(let i=0;i<30;i++){const m=(lo+hi)/2,x=ext(m);((x[1]-x[0])/2<.95&&(x[3]-x[2])/2<.93)?hi=m:lo=m}
 const x=ext(hi);return {T:T.clone(),el,d:hi,cx:(x[0]+x[1])/2,cy:(x[2]+x[3])/2}}
function encuadre(){if(!mesa||!W||drg)return;const r=mesa.r,rk2=RK||rackLay(),rh=Math.max(120,rk2.top-IN.t-(W>H*1.1?0:IN.rb));CAM.rh=rh;
 const L=LT,m=L?L.tw*.6:.4,pin=[],Rr=r-1.25;let b=L&&L.box;
 // nunca tan cerca que se pierda la mesa: el encuadre mide al menos 3/4 del ancho de la zona de juego y la mitad de su fondo
 if(b){const cx0=(b.x0+b.x1)/2,cz0=(b.z0+b.z1)/2,hx=Math.max((b.x1-b.x0)/2,Rr*.72),hz=Math.max((b.z1-b.z0)/2,Rr*.42);b={x0:cx0-hx,x1:cx0+hx,z0:cz0-hz,z1:cz0+hz}}
 if(b)[[b.x0-m,b.z0-m],[b.x1+m,b.z0-m],[b.x0-m,b.z1+m],[b.x1+m,b.z1+m]].forEach(([x,z])=>pin.push(v3(x,0,z),v3(x,.3,z)));else for(let i=0;i<12;i++){const a=i/12*Math.PI*2;pin.push(v3(Math.cos(a)*2.6,0,Math.sin(a)*2.6))}
 const cx=b?(b.x0+b.x1)/2:0,cz=b?(b.z0+b.z1)/2:0;CAM.IN=fit(pin,v3(cx,0,cz),1.08,rh);
 const pb=[];for(let i=0;i<20;i++){const a=i/20*Math.PI*2;pb.push(v3(Math.cos(a)*r,0,Math.sin(a)*r))}
 if(S)S.G.ord.forEach(k=>{if(k!==S.me)pb.push(cabeza(k).clone().setY(cabeza(k).y+.4))});CAM.BK=fit(pb,v3(0,0,-r*.18),.5,rh)}
function camara(now,dt){if(!CAM.IN)return;const f=RMo()?1:1-Math.exp(-dt/320);CAM.p+=(CAM.pt-CAM.p)*f;const e=CAM.p*CAM.p*(3-2*CAM.p),A=CAM.BK,B=CAM.IN;
 // a los 5 s sin tocar, la vista regresa sola
 if(tocado&&now-tocado>5000&&!drg&&!pin){tocado=0;Object.assign(VT,{x:0,z:0,k:1,a:0,t:0})}
 const g=RMo()?1:1-Math.exp(-dt/140);for(const q in VT)VW[q]+=(VT[q]-VW[q])*g;
 const T=v3(lerp(A.T.x,B.T.x,e)+VW.x,0,lerp(A.T.z,B.T.z,e)+VW.z),el=cl(lerp(A.el,B.el,e)+VW.t,.3,1.45),d=lerp(A.d,B.d,e)/VW.k,ya=VW.a;
 CA.position.set(T.x+Math.sin(ya)*Math.cos(el)*d,Math.sin(el)*d,T.z+Math.cos(ya)*Math.cos(el)*d);
 // empujón del jugadón
 if(shake){const k=(now-shake)/520;if(k>=1)shake=0;else{const a=(1-k)*.06*d/10;CA.position.x+=Math.sin(now*.09)*a;CA.position.y+=Math.cos(now*.11)*a}}
 CA.lookAt(T);
 // la cabeza voltea un poco hacia quien juega (solo recargado)
 let ht=0;if(S&&S.G.phase=='play'&&S.G.turn!==S.me&&S.G.turn>=0){const a=mesa.asiento(rel(S.G.turn)).a;ht=-.24*Math.cos(a)*(1-e)}
 hd+=(ht-hd)*(RMo()?1:1-Math.exp(-dt/600));if(hd)CA.rotateOnWorldAxis(Y,hd);
 const rh=CAM.rh,cx=lerp(A.cx,B.cx,e),cy=lerp(A.cy,B.cy,e);CA.aspect=W/rh;CA.setViewOffset(W,rh,cx*W/2,-IN.t-cy*rh/2,W,H);CA.updateProjectionMatrix();CA.updateMatrixWorld();
 CR.position.copy(CA.position);CR.quaternion.copy(CA.quaternion);CR.aspect=W/H;CR.updateProjectionMatrix();CR.updateMatrixWorld()}
function toca(){tocado=performance.now()}

// ---------- bolsa, reloj, luz y personajes ----------
let bagK=0,bagS=1;
function cosas(now,dt){if(!S||!mesa)return;const G=S.G;
 const t=G.nb!=null?.5+.5*Math.min(1,G.nb/78):1;bagS+=(t-bagS)*.08;let sq=0;if(bagK){const k=(now-bagK)/420;if(k>=1)bagK=0;else sq=Math.sin(Math.PI*k)*.12}
 bag.scale.set(bagS*(1+sq*.6),bagS*(1-sq),bagS*(1+sq*.6));
 const u=clock.userData,tot=(G.o&&G.o.t||90)*1000,left=G.phase=='play'?Math.max(0,S.dl-Date.now()):0;
 if(vuelta){const k=(now-vuelta)/650;if(k>=1){vuelta=0;u.inner.rotation.x=0;u.arena(1)}else{u.inner.rotation.x=Math.PI*(1-Math.pow(1-k,3));u.arena(0)}}else u.arena(G.phase=='play'?left/tot:0);
 // la luz se va hacia quien juega
 const tp=G.phase=='play'&&G.turn>=0?mesa.asiento(rel(G.turn)).mano:null;mesa.luzHacia(tp?v3(tp.x*.6,0,tp.z*.6):v3(0,0,0),1-Math.exp(-dt/900))}
function avSync(){if(!window.MPJ||!mesa||!S)return;const G=S.G,Pl=V.players||[];
 if(MPJ.sync(mesa,G.ord.map(k=>({i:rel(k),k,cod:(Pl[k]&&Pl[k].av)||MPJ.codigo(Pl[k]&&Pl[k].name)})).filter(x=>!G.out[x.k]),{dorso:K.atlas(),listo:()=>{dirty=true}}))G.ord.forEach(k=>MPJ.cartas(rel(k),0))}
function avStep(now){if(window.MPJ&&MPJ.on&&S){const G=S.G;MPJ.paso(now,G.phase=='play'&&G.turn>=0?rel(G.turn):-1);MPJ.fin(G.phase=='final'&&G.win!=null&&G.win>=0?rel(G.win):-1)}}
// avisos de c_rummyui.js (G.fx del servidor): roba, juega, tiempo, mal, gana, mez
function fx(f){if(!ready||!mesa||!S)return;const pj=window.MPJ&&MPJ.on,i=f.k>=0?rel(f.k):-1,now=performance.now();
 if(f.t=='mez'){bagK=now}
 else if(f.t=='roba'){bagK=now+200;if(pj&&i>0)MPJ.estira(i,boca())}
 else if(f.t=='juega'){if(pj&&i>0&&LT&&LT.box)MPJ.estira(i,v3((LT.box.x0+LT.box.x1)/2,0,(LT.box.z0+LT.box.z1)/2));
  if((f.to||0)>=5){shake=now;P.forEach(x=>{if(x.fr==='w'&&x.id>=0&&x.T&&x.T.p.y<.5){const d=Math.hypot(x.T.p.x,x.T.p.z);x.hop={t0:now+d*45,a:.28*x.T.s};anim=true}});sfx('golpe');
   if(pj){if(i>0)MPJ.festeja(i);S.G.ord.forEach(k=>{if(k!==f.k&&rel(k)>0)MPJ.mira(rel(k),cabeza(f.k),1800)})}}
  else if((f.to||0)>=3&&pj&&i>0)MPJ.festeja(i)}
 else if(f.t=='tiempo'||f.t=='mal'){if(pj&&i>0)MPJ.cabeza(i,1600)}}
// etiquetas (HTML de c_rummyui.js): la tablita de cada quien sobre su cabeza y el número de la bolsa
function toPx(p){SV.copy(p).project(CA);return [(SV.x+1)/2*W,(1-SV.y)/2*H]}
function labels(){if(!S||!mesa)return;const y0=IN.t+4,yb=RK?RK.top-6:H;
 document.querySelectorAll('.rm-pl').forEach(el=>{const k=+el.dataset.seat;if(k===S.me||!S.G.players[k]){el.style.visibility='hidden';return}el.style.visibility='';
  const tx=el.textContent;if(el._t!==tx){el._t=tx;el._w=el.offsetWidth;el._h=el.offsetHeight}const [x,y]=toPx(cabeza(k).clone().setY(cabeza(k).y+.35)),hw=el._w/2+4,hh=el._h/2+2,X2=cl(x,hw,W-hw-(W>H*1.1?IN.r*.2:0)),Y2=cl(y-hh,y0+hh,yb-hh);
  el.style.transform=`translate(${X2.toFixed(1)}px,${Y2.toFixed(1)}px) translate(-50%,-50%)`});
 const b=document.getElementById('rmbag');if(b)b.style.visibility=CAM.p>.5?'hidden':'';if(b&&bag&&CAM.p<=.5){const [x,y]=toPx(bag.localToWorld(v3(0,bag.userData.boca.y+.25,0)));b.style.transform=`translate(${x.toFixed(1)}px,${cl(y,y0+10,yb-10).toFixed(1)}px) translate(-50%,-50%)`}}

// ---------- tocar: arrastrar fichas, tocar y tocar, mover la vista ----------
let st=null,drg=null,pin=null,hov=null,hovT=0;const tch=new Map();
function rayo(e,cam){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,cam);return ray}
function pick(e){const seen=o=>!window.FONDO||FONDO.seen(o);
 let h=rayo(e,CR).intersectObjects([TC.m].concat(pool.b.filter(o=>o.visible)),false);
 for(const x of h){if(x.object===TC.m){const q=P.get(idxC[x.instanceId]);if(q&&q.hit)return q.hit}else if(x.object.userData.hit)return x.object.userData.hit}
 h=rayo(e,CA).intersectObjects([TW.m].concat(pool.s.filter(o=>o.visible),pool.r.filter(o=>o.visible),bag?[bag]:[]),true).filter(x=>seen(x.object));
 for(const x of h){if(x.object===TW.m){const q=P.get(idxW[x.instanceId]);if(q&&q.hit)return q.hit}else{let o=x.object;while(o&&!o.userData.hit&&o!==bag)o=o.parent;if(o===bag)return {t:'bolsa'};if(o&&o.userData.hit)return o.userData.hit}}
 return null}
function suelo(cx,cy){const r=cv.getBoundingClientRect();P2.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(PL,v3(0,0,0))}
// adónde caería la ficha que arrastras: hueco, junto a una ficha de la mesa, al atril o a un grupo nuevo
function destino(cx,cy){if(RK&&cy>RK.top-8&&S.atril){const n=S.atril.length;let b=n,bd=1e9;for(let j=0;j<n;j++){SV.copy(rackSlot(j,n).p).project(CR);const x=(SV.x+1)/2*W,d=Math.abs(x-cx);if(d<bd){bd=d;b=cx<x?j:j+1}}return {r:b}}
 const p=suelo(cx,cy);if(!p||!LT)return null;let best=null,bd=1e9;
 LT.gh.forEach(g=>{const d=Math.hypot(g.p.x-p.x,g.p.z-p.z);if(d<bd){bd=d;best=g.d.g<0?{g:-1}:{g:g.d.g,at:g.d.at}}});if(best&&bd<LT.tw*1.1)return best;
 LT.items.forEach(t=>{if(t.id===drg.id)return;const d=Math.hypot(t.p.x-p.x,(t.p.z-p.z)*.8);if(d<bd){bd=d;best={g:t.g,at:p.x>t.p.x?t.i+1:t.i}}});
 if(best&&bd<LT.tw*1.3)return best;return Math.hypot(p.x,p.z)<mesa.r-1?{g:-1}:null}
// la ficha que arrastras sigue al dedo cuadro por cuadro (piezas() la acerca suave a drg.T, sin animaciones que se reinicien)
function arrastra(cx,cy){const x=P.get('t'+drg.id);if(!x)return;const enR=RK&&cy>RK.top-8;let T;
 if(enR){const p=scr(cx,cy);p.z=-DC+.25;T={fr:'c',p,q:rackSlot(0,1).q,s:RK.sc*1.12}}
 else{const p=suelo(cx,cy);if(!p)return;p.y=.55*(LT?LT.tw:.6);T={fr:'w',p,q:QI,s:(LT?LT.tw:.6)*1.1}}
 if(x.fr!==T.fr)aMarco(x,T.fr);x.T=T;x.tw=null;x.tint=TSEL;drg.T=T;anim=true}
function pDown(e){if(!act())return;toca();
 if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);if(tch.size==2){st=null;drg=null;const [a,b]=[...tch.values()];pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VT.k,ang:Math.atan2(b[1]-a[1],b[0]-a[0]),a:VT.a,mx:(a[0]+b[0])/2,my:(a[1]+b[1])/2,x:VT.x,z:VT.z};return}if(tch.size>2)return}
 st={x:e.clientX,y:e.clientY,hit:pick(e),pid:e.pointerId,pan:e.button==2,g:null,vx:VT.x,vz:VT.z,va:VT.a,vt:VT.t};try{cv.setPointerCapture(e.pointerId)}catch(_){}}
function pMove(e){if(!act())return;
 if(tch.has(e.pointerId)){tch.set(e.pointerId,[e.clientX,e.clientY]);if(pin&&tch.size>=2){const [a,b]=[...tch.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1])||1,ang=Math.atan2(b[1]-a[1],b[0]-a[0]);toca();
   VT.k=cl(pin.k*d/pin.d,.75,2.6);VT.a=pin.a+Math.atan2(Math.sin(ang-pin.ang),Math.cos(ang-pin.ang));const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,f=.012/VW.k;VT.x=pin.x-(mx-pin.mx)*f;VT.z=pin.z-(my-pin.my)*f;return}}
 if(!st){if(e.pointerType==='mouse'&&performance.now()-hovT>60){hovT=performance.now();const h=pick(e),id=h&&(h.t=='atril'||h.t=='mesa')&&window.RMU&&RMU.can(h.id)?h.id:null;cv.style.cursor=h&&h.t!='atril2'?'pointer':'default';if(id!==hov)hov=id}return}
 if(e.pointerId!==st.pid)return;const mv=Math.hypot(e.clientX-st.x,e.clientY-st.y);
 if(drg){drg.x=e.clientX;drg.y=e.clientY;arrastra(e.clientX,e.clientY);return}
 if(mv>9&&st.hit&&(st.hit.t=='atril'||st.hit.t=='mesa')&&!st.g&&window.RMU&&RMU.can(st.hit.id)){drg={id:st.hit.id,x:e.clientX,y:e.clientY};cv.style.cursor='grabbing';if(S.sel!==drg.id)RMU.pick(drg.id);arrastra(e.clientX,e.clientY);return}
 if(mv>9||st.g){toca();st.g=true;if(st.pan||e.buttons==4){VT.a=st.va+(e.clientX-st.x)*.006;VT.t=st.vt+(e.clientY-st.y)*.004}else{const f=.013/VW.k*(CAM.p>.5?.7:1);VT.x=st.vx-(e.clientX-st.x)*f;VT.z=st.vz-(e.clientY-st.y)*f}
  const lim=mesa?mesa.r*.6:4;VT.x=cl(VT.x,-lim,lim);VT.z=cl(VT.z,-lim,lim)}}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}
 if(!st||e.pointerId!==st.pid)return;const s=st;st=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}cv.style.cursor='default';
 if(drg){const d=drg,t=destino(d.x,d.y);drg=null;encuadre();const x=P.get('t'+d.id);if(x)x.T=null;if(t)RMU.put(d.id,t);else{RMU.pick(null)}dirty=true;if(S)sync(S);return}
 if(s.g)return;tap(s.hit)}
function pCancel(e){tch.delete(e.pointerId);if(tch.size<2)pin=null;if(drg){const x=P.get('t'+drg.id);if(x)x.T=null;drg=null;if(S)sync(S)}st=null}
function tap(h){if(!window.RMU||!S)return;const sel=S.sel;
 if(!h){if(sel!=null)RMU.pick(null);return}
 if(h.t=='sug')return RMU.grupo(h.ids);
 if(h.t=='raya')return RMU.porque(h.g);
 if(h.t=='bolsa'){sfx('tap');return RMU.bolsa&&RMU.bolsa()}
 if(h.t=='hueco')return sel!=null&&RMU.put(sel,h.d.g<0?{g:-1}:{g:h.d.g,at:h.d.at});
 if(h.t=='atril2'){sfx('tap');return}
 if(h.id===sel)return RMU.pick(null);
 if(sel==null)return RMU.pick(h.id);
 if(h.t=='atril')return RMU.put(sel,{r:h.i});
 if(h.t=='mesa'){const fromRack=S.atril&&S.atril.includes(sel);if(!fromRack&&!S.mesa.flat().includes(sel))return RMU.pick(h.id);return RMU.put(sel,{g:h.g,at:h.i+1})}}
addEventListener('keydown',e=>{if(!act()||/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;if(e.key==='Escape'&&S&&S.sel!=null)RMU.pick(null)});

// ---------- cuadro ----------
function layout(){if(innerWidth!==W||innerHeight!==H){W=innerWidth;H=innerHeight;R.setSize(W,H,false)}const n=S?S.G.players.length:4;if(!mesa||mesa.n!==n)build(n);rackLay();if(S&&act())sync(S);encuadre();dirty=false}
function loop(now){requestAnimationFrame(loop);const a=act(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('rm3on',a);
 if(!a){first=true;return}
 if(shR&&cv.parentNode!==root&&!(document.documentElement.classList.contains('h3on')||document.documentElement.classList.contains('sala3d'))){root.prepend(cv);W=0}
 if(dirty||innerWidth!==W||innerHeight!==H)layout();
 camara(now,dt);piezas(now);cosas(now,dt);if(window.MFX)MFX.paso(now);avStep(now);labels();
 const fs=window.FONDO?FONDO.pinta(R,CA,'rummy',{r:mesa.R,rt:2.6*mesa.R/(MESA.radio(4)+MESA.ORL),viaje:1,techo:1.25}):0;if(fs!==fz){fz=fs;casaModo()}
 if(!fs)R.clear();CA.layers.set(0);R.render(SC,CA);R.clearDepth();CR.layers.set(1);R.render(SC,CR)}

window.R3={ok:()=>{init();return ready&&!failed},show(b){shown=!!b;if(b)init()},layout(i){const o=Object.assign({t:0,r:0,rb:0},i||{});if(o.t!==IN.t||o.r!==IN.r||o.rb!==IN.rb){IN=o;dirty=true}},sync(s){S=s;if(ready&&mesa&&mesa.n===s.G.players.length)sync(s);else dirty=true},
 cam(x){if(x=='home'){Object.assign(VT,{x:0,z:0,k:1,a:0,t:0});tocado=0}},sort(){},fx,home:()=>R3.cam('home'),get vista(){return Math.abs(VT.x)>.05||Math.abs(VT.z)>.05||Math.abs(VT.k-1)>.03||Math.abs(VT.a)>.02},
 get rackTop(){return RK?RK.top:H},_paso:t=>loop(t)};   // _paso: para probar con el panel oculto (sin requestAnimationFrame)
})();
