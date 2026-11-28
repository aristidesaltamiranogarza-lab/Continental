// c_colonos3d.js — CO3: Colonos en 3D. La isla (CO3K) sobre su mesa rectangular dentro de la casa (FONDO), con los rivales sentados en los lados
// largos y la cabecera (MPJ, con sus cartas reales en las manos); tú eres la cámara, en el lado corto de enfrente. Misma API que CO2 (c_colonos2d.js):
// COU y COFX la usan sin saber cuál es (COB()). Pellizco o rueda acercan, arrastrar mueve (no gira), Arriba = vista desde arriba (MCAM.boton).
// Tirada: los dados salen del lugar de quien tira y se quedan en el fieltro; los terrenos que pagan (y sus piezas) se levantan y los demás se apagan.
// 2D/3D: co3Toggle() (se guarda en co_3d). Sin WebGL se queda el 2D. Extra: seat(k,cabeza) → dónde está un rival en pantalla; dados(a,b,k).
(function(){
if(typeof THREE==='undefined'||!window.COLD||!window.CO3K||!window.CO2){console.warn('Colonos 3D: falta Three.js, colonos_data.js, c_colonos3d_kit.js o c_colonos2d.js');return}
const D=COLD,K=CO3K,v3=(x,y,z)=>new THREE.Vector3(x,y,z),HS=.62,YT=K.TOP*HS,EL=1.02,ELA=1.48,KMAX=3.2,PI=Math.PI,DS=.34;
const RMo=()=>typeof RM!=='undefined'?!!RM:matchMedia('(prefers-reduced-motion:reduce)').matches;
const lsG=k=>{try{return localStorage.getItem(k)}catch(e){return null}},lsS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const pc=k=>D.PCOL[k%D.PCOL.length],CS=()=>(window.MESA&&MESA.CASA_S)||2.74;
let quiere=lsG('co_3d')!=='0',ok=true,ready=false,shown=false,R,SC,CA,root,cv,shR=false,fz=0,W=0,H=0,sun,lastNow=0;
let IS=null,mesa=null,tbl=null,bkey='',G0=null,me0=-1,ins={t:0,r:0,b:0,l:0},spots=null,spKey='',spG=null,dirty=4,rollT=-1e9,rollS=0,arr=false;
let rob=null,robAt=-1,hx=5,hz=6,BOX=[],BOXI=[],drag=null,pinch=null,pzN=0,szOk=false;
const piezas=new Map(),anim=[],dados=[],ptr=new Map(),ray=new THREE.Raycaster(),P2=new THREE.Vector2(),PL=new THREE.Plane(v3(0,1,0),-YT),TMP=v3(0,0,0),QT=new THREE.Quaternion();
const VW={x:0,z:0,k:1,e:EL},VT={x:0,z:0,k:1,e:EL},FC={k:'',d:16,ox:0,oy:0};
const MS={peg:new THREE.MeshBasicMaterial({color:'#FDF6E9',transparent:true,opacity:.88,depthWrite:false}),on:new THREE.MeshBasicMaterial({color:'#C2512A'})},GH=new Map();
const ghost=m=>{let g=GH.get(m);if(!g){g=m.clone();g.transparent=true;g.opacity=.6;g.depthWrite=false;GH.set(m,g)}return g};
// ---------- escena ----------
function init(){if(ready)return ok;ready=true;
 try{const r0=window.FONDO?FONDO.R('colonos'):null;shR=!!r0;R=r0||new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){console.warn('Colonos 3D:',e);return ok=false}
 if(!shR){R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.autoClear=false}
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(34,1,.5,400);SC.add(CA);
 const hl=new THREE.HemisphereLight(0xfff4e6,0x3a2a1e,1.5);SC.add(hl);
 sun=new THREE.DirectionalLight(0xfff0d8,2.3);sun.position.set(-5,16,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;SC.add(sun);SC.add(sun.target);
 const fill=new THREE.DirectionalLight(0xcfe0ff,.5);fill.position.set(7,6,-5);SC.add(fill);[hl,sun,fill].forEach(l=>l.layers.enableAll());
 root=document.createElement('div');root.id='co3root';root.className='co3-capa';root.setAttribute('aria-hidden','true');document.body.appendChild(root);cv=R.domElement;if(!shR)root.appendChild(cv);
 root.addEventListener('pointerdown',down);addEventListener('pointermove',move);addEventListener('pointerup',up);addEventListener('pointercancel',up);root.addEventListener('contextmenu',e=>e.preventDefault());
 root.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0016))},{passive:false});
 requestAnimationFrame(loop);return true}
const nSeats=()=>{const n=G0?G0.players.length:4;return me0>=0?n-1:n};
const seatDe=k=>{const n=G0.players.length;return me0>=0?((k-me0)%n+n)%n:k+1};   // 0 = tú (sin personaje)
const wx=p=>(p.x-IS.c[0])*HS,wz=p=>(p.y-IS.c[1])*HS;
function arma(G){const key=G.hx.map(h=>h.q+','+h.r+','+h.t+','+h.n).join(';')+'|'+G.ports.map(p=>p.e+':'+p.r).join(',')+'|'+nSeats();if(key===bkey)return;bkey=key;
 if(window.MPJ)MPJ.suelta();if(tbl){SC.remove(tbl);if(IS)IS.tierra.forEach(T=>T&&T.g.children[0].geometry.dispose())}
 tbl=new THREE.Group();SC.add(tbl);IS=K.isla(G);IS.g.scale.setScalar(HS);tbl.add(IS.g);IS.tierra.forEach(T=>{if(T){T.x0=T.g.position.x;T.base=1}});
 const ax=Math.max(...IS.box.map(p=>Math.abs(p[0])))*HS,az=Math.max(...IS.box.map(p=>Math.abs(p[1])))*HS;hx=Math.max(4.2,ax+.75);hz=Math.max(hx+1,az+1.5);
 mesa=K.mesa(hx,hz,nSeats());tbl.add(mesa.g);
 BOXI=[];IS.box.forEach(p=>BOXI.push(v3(p[0]*HS,0,p[1]*HS),v3(p[0]*HS,YT+.25,p[1]*HS)));casaModo();
 const sc=sun.shadow.camera,m=Math.max(hx,hz)+2;Object.assign(sc,{left:-m,right:m,top:m,bottom:-m,near:1,far:60});sc.updateProjectionMatrix();
 piezas.forEach(p=>p.parent&&p.parent.remove(p));piezas.clear();rob=null;robAt=-1;spKey='';spG=null;dados.length=0;anim.length=0;pzN=0;FC.k='';dirty=6;
 VT.x=VT.z=0;VT.k=1;Object.assign(VW,VT)}
// k: tamaño de las personas (el de la casa)
function casaModo(){if(!mesa)return;mesa.escala((fz||CS())*((window.FONDO&&FONDO.MII)||1));
 BOX=BOXI;FC.k='';dirty=4}
// ---------- cámara: encaja la isla en el hueco que deja la interfaz ----------
function fit(e){const key=W+'x'+H+'|'+ins.t+','+ins.r+','+ins.b+','+ins.l+'|'+e.toFixed(3)+'|'+bkey.length;if(FC.k===key)return FC;
 const aw=Math.max(80,W-ins.l-ins.r),ah=Math.max(80,H-ins.t-ins.b),fx=ins.l+aw/2,fy=ins.t+ah/2;CA.aspect=W/Math.max(1,H);CA.clearViewOffset();
 let d=FC.d||16,cx=0,cy=0;for(let it=0;it<5;it++){CA.position.set(0,Math.sin(e)*d,Math.cos(e)*d);CA.lookAt(0,0,0);CA.updateMatrixWorld();
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;BOX.forEach(p=>{TMP.copy(p).project(CA);x0=Math.min(x0,TMP.x);x1=Math.max(x1,TMP.x);y0=Math.min(y0,TMP.y);y1=Math.max(y1,TMP.y)});
  cx=(x0+x1)/2;cy=(y0+y1)/2;d*=Math.max((x1-x0)*W/2/aw,(y1-y0)*H/2/ah)*1.02}
 return Object.assign(FC,{k:key,d,ox:fx-(W/2+cx*W/2),oy:fy-(H/2-cy*H/2)})}
function place(v){const f=fit(v.e),d=f.d/v.k;CA.position.set(v.x,Math.sin(v.e)*d,v.z+Math.cos(v.e)*d);CA.lookAt(v.x,0,v.z);CA.setViewOffset(W,H,-f.ox,-f.oy,W,H);CA.updateMatrixWorld()}
function camStep(dt){const a=drag||pinch?1:1-Math.exp(-dt/110);['x','z','k','e'].forEach(c=>{VW[c]+=(VT[c]-VW[c])*a});place(VW)}
function suelo(x,y,v){place(v);P2.set(x/W*2-1,-(y/H)*2+1);ray.setFromCamera(P2,CA);const p=ray.ray.intersectPlane(PL,v3(0,0,0));place(VW);return p}
function scr(p){TMP.copy(p).project(CA);return {x:(TMP.x+1)/2*W,y:(1-TMP.y)/2*H}}
function clampT(){const m=1-1/VT.k,mx=hx*m,mz=hz*.85*m;VT.x=Math.max(-mx,Math.min(mx,VT.x));VT.z=Math.max(-mz,Math.min(mz,VT.z))}
function zoomAt(x,y,k1){if(!shown||!IS)return;k1=Math.max(1,Math.min(KMAX,k1));if(Math.abs(k1-VT.k)<1e-4)return;const v0=Object.assign({},VT),a=suelo(x,y,v0);VT.k=k1;const b=suelo(x,y,VT);
 if(a&&b){VT.x+=a.x-b.x;VT.z+=a.z-b.z}clampT();if(k1===1){VT.x=VT.z=0}}
function down(e){if(!shown||!IS)return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});try{root.setPointerCapture(e.pointerId)}catch(_){}
 if(ptr.size==1){Object.assign(VW,VT);drag={x:e.clientX,y:e.clientY,v:Object.assign({},VT),p:suelo(e.clientX,e.clientY,VT),mv:false}}
 if(ptr.size==2){const[a,b]=[...ptr.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,k:VT.k};drag=null}}
function move(e){if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&ptr.size>=2){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);zoomAt((a.x+b.x)/2,(a.y+b.y)/2,pinch.k*d/pinch.d);return}
 if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.mv&&Math.hypot(dx,dy)>8)drag.mv=true;
  if(drag.mv&&VT.k>1.001&&drag.p){const q=suelo(e.clientX,e.clientY,drag.v);if(q){VT.x=drag.v.x-(q.x-drag.p.x);VT.z=drag.v.z-(q.z-drag.p.z);clampT()}}}}
function up(e){if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);if(ptr.size<2)pinch=null;if(!ptr.size&&drag){const d=drag;drag=null;if(!d.mv)tap(e.clientX,e.clientY)}}
// tocar cerca de un lugar válido lo elige: el más cercano en pantalla (los puntitos flotan sobre la esquina)
function spotW(w,id){const g=D.geo(G0.hx),p=w=='h'?g.H[id]:w=='c'?g.E[id]:g.V[id];return p&&v3(wx(p),w=='h'||w=='c'?YT:YT+.22,wz(p))}
function pxHex(){const a=scr(v3(0,YT,0)),b=scr(v3(HS,YT,0));return Math.hypot(a.x-b.x,a.y-b.y)||1}
function tap(x,y){if(!spots||!G0||!IS)return;let best=-1,bd=1e9;spots.L.forEach(id=>{const p=spotW(spots.w,id);if(!p)return;const s=scr(p),d=Math.hypot(s.x-x,s.y-y);if(d<bd){bd=d;best=id}});
 const lim=Math.max(30,pxHex()*(spots.w=='h'?.95:.55));if(best>=0&&bd<=lim&&CO2.onTap)CO2.onTap(spots.w,best)}
// ---------- piezas: caminos, poblados, ciudades y ladrón; lo nuevo cae ----------
function cae(p,dl){if(RMo())return;const y1=p.position.y;p.position.y=y1+1.3;anim.push({ty:'cae',o:p,t0:performance.now()+(dl||0),dur:460,y0:y1+1.3,y1})}
function pzSync(G,me){const g=D.geo(G.hx),vivo=new Set(),nuevas=pzN++>0;
 G.eo.forEach((k,e)=>{if(k<0)return;const key='e'+e;vivo.add(key);let p=piezas.get(key);if(p&&p.userData.k===k)return;if(p)tbl.remove(p);
  const E=g.E[e],A=g.V[E.v[0]],B=g.V[E.v[1]];p=K.pieza('c',pc(k));p.scale.setScalar(HS);p.position.set(wx(E),YT,wz(E));p.rotation.y=-Math.atan2(B.y-A.y,B.x-A.x);
  p.userData={k,e};tbl.add(p);piezas.set(key,p);if(nuevas)cae(p)});
 G.vo.forEach((k,v)=>{if(k<0)return;const key='v'+v,t=G.vt[v]=='u'?'u':'p';vivo.add(key);let p=piezas.get(key);if(p&&p.userData.k===k&&p.userData.t===t)return;if(p)tbl.remove(p);
  p=K.pieza(t,pc(k));p.scale.setScalar(HS*(t=='u'?1.05:1));p.position.set(wx(g.V[v]),YT,wz(g.V[v]));p.rotation.y=((v*37)%11-5)*.035;p.userData={k,t,v};tbl.add(p);piezas.set(key,p);if(nuevas)cae(p)});
 piezas.forEach((p,key)=>{if(!vivo.has(key)){tbl.remove(p);piezas.delete(key)}});
 if(G.rob>=0&&G.hx[G.rob]){const h=g.H[G.rob],x=wx(h)+(G.hx[G.rob].n?-.5*HS:0),z=wz(h);if(!rob){rob=K.ladron();rob.scale.setScalar(HS);tbl.add(rob);robAt=-1}
  if(robAt!==G.rob){if(robAt>=0&&!RMo())anim.push({ty:'salta',o:rob,t0:performance.now(),dur:620,a:rob.position.clone(),b:v3(x,YT,z)});else rob.position.set(x,YT,z);robAt=G.rob}rob.visible=true}
 else if(rob)rob.visible=false;
 IS.tierra.forEach((T,i)=>{if(T){T.base=i===G.rob?.58:1;if(!rollS)T.mat.color.setScalar(T.base)}});
 // tus números: anillo de tu color en las fichas que tocan tus piezas (doble con ciudad)
 const ring=G.hx.map(()=>0),col=pc(Math.max(0,me));if(me>=0)G.vo.forEach((k,v)=>{if(k===me)g.V[v].h.forEach(h=>ring[h]=Math.max(ring[h],G.vt[v]=='u'?2:1))});
 IS.tierra.forEach((T,i)=>{if(!T||!G.hx[i].n)return;let a=T.aro;const n=ring[i];if(!n){if(a)a.visible=false;return}
  if(!a){a=T.aro=new THREE.Group();[[.385,.44],[.47,.51]].forEach(([r0,r1])=>{const m=new THREE.Mesh(new THREE.RingGeometry(r0,r1,40),new THREE.MeshBasicMaterial({color:col}));m.rotation.x=-PI/2;a.add(m)});a.position.y=K.TOP+.006;T.g.add(a)}
  a.visible=true;a.children.forEach((m,j)=>{m.material.color.set(col);m.visible=j<n})})}
// ---------- lugares válidos: pegs que se levantan (esquinas con sus puntitos) y la pieza fantasma ----------
function spSync(G,me,o){const sp=o.spots&&o.spots.L&&o.spots.L.length?o.spots:null,gh=o.ghost&&o.ghost.at!=null?o.ghost:null;spots=sp;
 const base=sp?sp.w+':'+sp.L.join(','):'',key=base+'|'+(gh?gh.w+gh.at:'');if(key===spKey)return;const nuevo=!spKey.startsWith(base+'|')||!base;spKey=key;
 if(spG)tbl.remove(spG);spG=null;if(!sp)return;spG=new THREE.Group();tbl.add(spG);const g=D.geo(G.hx),now=performance.now();
 sp.L.forEach((id,j)=>{const on=!!gh&&gh.at===id;let m;
  if(sp.w=='h'){const h=g.H[id];m=new THREE.Mesh(CO3.GA||(CO3.GA=new THREE.RingGeometry(.52*HS,.64*HS,40)),on?MS.on:MS.peg);m.rotation.x=-PI/2;m.position.set(wx(h),YT+.02,wz(h))}
  else if(sp.w=='c'){const E=g.E[id],A=g.V[E.v[0]],B=g.V[E.v[1]];m=K.pieza('c','#FDF6E9');m.material=on?MS.on:MS.peg;m.castShadow=false;m.scale.set(HS*1.08,HS*.5,HS*1.25);m.position.set(wx(E),YT+.012,wz(E));m.rotation.y=-Math.atan2(B.y-A.y,B.x-A.x)}
  else{if(on)return;const V=g.V[id],dots=V.h.reduce((a,h)=>a+D.PIP(G.hx[h].n),0);m=new THREE.Sprite(new THREE.SpriteMaterial({map:K.lugar(dots,false),depthTest:false,depthWrite:false}));m.renderOrder=5;m.scale.setScalar(.36);m.position.set(wx(V),YT+.22,wz(V))}
  spG.add(m);if(nuevo&&!RMo()){const s=m.scale.clone();m.scale.multiplyScalar(.01);anim.push({ty:'sube',o:m,t0:now+Math.min(j*25,400),dur:280,s})}});
 if(gh){let m;
  if(gh.w=='c'){const E=g.E[gh.at],A=g.V[E.v[0]],B=g.V[E.v[1]];m=K.pieza('c',pc(me));m.scale.setScalar(HS);m.position.set(wx(E),YT,wz(E));m.rotation.y=-Math.atan2(B.y-A.y,B.x-A.x)}
  else if(gh.w=='p'||gh.w=='u'){const V=g.V[gh.at];m=K.pieza(gh.w,pc(me));m.scale.setScalar(HS*1.1);m.position.set(wx(V),YT,wz(V))}
  else if(gh.w=='h'){const h=g.H[gh.at];m=K.ladron();m.scale.setScalar(HS);m.position.set(wx(h)+(G.hx[gh.at].n?-.5*HS:0),YT,wz(h))}
  if(m){m.material=ghost(m.material);m.castShadow=false;spG.add(m)}}
 dirty=3}
// ---------- personajes ----------
function gente(){if(!window.MPJ||!mesa||!G0)return;const P=(window.V&&V.players)||[],n=G0.players.length,L=[];
 for(let k=0;k<n;k++){const i=seatDe(k);if(i)L.push({i,k,cod:(P[k]&&P[k].av)||MPJ.codigo(P[k]&&P[k].name)})}
 if(MPJ.sync(mesa,L,{dorso:K.dorso(),listo:()=>{if(shown&&G0)gente()}}))L.forEach(x=>MPJ.cartas(x.i,(G0.nres&&G0.nres[x.k])||0));dirty=4}
// ---------- dados: salen del lugar de quien tira y se quedan en el fieltro ----------
function tira(a,b,k){if(!IS||!mesa)return null;const i=seatDe(k),A=i?mesa.asiento(i):null,now=performance.now();let p0,p1,ox;
 if(!A){p0=v3(hx*.25,5,hz+3.5);p1=v3(hx*.55,0,hz-.7);ox=v3(.26,0,0)}
 else if(A.ry===0){p0=v3(0,3.6,A.pos.z*.85);p1=v3(.3,0,-hz+.7);ox=v3(.26,0,0)}
 else{const sx=Math.sign(A.pos.x);p0=v3(A.pos.x*.85,3.6,A.pos.z);p1=v3(sx*(hx-.42),0,A.pos.z);ox=v3(0,0,.26)}
 while(dados.length<2){const m=K.dado();m.scale.setScalar(DS);m.visible=false;tbl.add(m);dados.push(m)}
 [a,b].forEach((v,j)=>{const m=dados[j],q1=K.arriba(v,Math.random()*PI*2),s=j?1:-1;for(let q=anim.length-1;q>=0;q--)if(anim[q].o===m)anim.splice(q,1);m.visible=true;
  const e0=p0.clone().addScaledVector(ox,s),e1=p1.clone().addScaledVector(ox,s);e1.y=DS/2;
  if(RMo()){m.position.copy(e1);m.quaternion.copy(q1);return}
  anim.push({ty:'dado',o:m,t0:now+j*70,dur:820,a:e0,b:e1,q1,ax:v3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize(),sp:9+Math.random()*5});m.position.copy(e0)});
 dirty=4;return scr(v3(p1.x,.9,p1.z))}
// ---------- animaciones de cada cuadro ----------
const oBack=u=>1+2.7*Math.pow(u-1,3)+1.7*Math.pow(u-1,2),alto=u=>u<.72?1-(u/.72)*(u/.72):.12*Math.sin((u-.72)/.28*PI);
function step(now){for(let i=anim.length-1;i>=0;i--){const a=anim[i],u=Math.min(1,(now-a.t0)/a.dur);if(u<0)continue;const o=a.o;
  if(a.ty=='cae')o.position.y=a.y1+(a.y0-a.y1)*alto(u);
  else if(a.ty=='sube')o.scale.copy(a.s).multiplyScalar(Math.max(.01,oBack(u)));
  else if(a.ty=='salta'){o.position.lerpVectors(a.a,a.b,u);o.position.y=YT+Math.sin(PI*u)*.9}
  else if(a.ty=='dado'){const f=Math.min(1,u/.78);o.position.lerpVectors(a.a,a.b,1-Math.pow(1-f,1.6));o.position.y=u<.78?a.b.y+(a.a.y-a.b.y)*(1-f)*(1-f)+Math.sin(PI*f)*1.2:a.b.y+Math.abs(Math.sin((u-.78)/.22*PI))*.12;
   o.quaternion.copy(a.q1).multiply(QT.setFromAxisAngle(a.ax,Math.pow(1-u,1.5)*a.sp))}
  if(u>=1)anim.splice(i,1)}
 if(!rollS||!G0)return;const tr=now-rollT,env=tr<0?0:tr<260?tr/260:tr<1900?1:tr<2300?1-(tr-1900)/400:0,lift=.12*Math.sin(env*PI/2),g=D.geo(G0.hx),up=new Set();
 IS.tierra.forEach((T,i)=>{if(!T)return;const h=G0.hx[i],hit=h.n===rollS&&D.prod(h.t),rb=i===G0.rob;T.g.position.y=hit&&!rb?lift:0;
  T.g.position.x=T.x0+(hit&&rb&&tr<800?Math.sin(tr*.06)*.05*(1-tr/800):0);T.mat.color.setScalar(T.base*(hit?1:1-.42*env));if(hit&&!rb){g.H[i].v.forEach(v=>up.add('v'+v));g.H[i].e.forEach(e=>up.add('e'+e))}});
 piezas.forEach((p,key)=>{if(!anim.some(a=>a.o===p))p.position.y=YT+(up.has(key)?lift*HS:0)});if(rob&&!anim.some(a=>a.o===rob))rob.position.y=YT;
 if(tr>2400){rollS=0;IS.tierra.forEach(T=>{if(T){T.mat.color.setScalar(T.base);T.g.position.y=0;T.g.position.x=T.x0}});piezas.forEach(p=>p.position.y=YT)}}
function loop(now){requestAnimationFrame(loop);const dt=Math.min(100,now-(lastNow||now));lastNow=now;if(!shown||!IS)return;
 const hc=document.documentElement.classList;if(shR&&cv.parentNode!==root){if(hc.contains('h3on')||hc.contains('sala3d'))return;root.prepend(cv);szOk=false}
 if(innerWidth!==W||innerHeight!==H||!szOk){W=innerWidth;H=innerHeight;R.setSize(W,H,false);szOk=true;FC.k=''}
 camStep(dt);step(now);if(window.MPJ&&MPJ.on&&G0){MPJ.paso(now,G0.phase=='play'&&G0.actor>=0?seatDe(G0.actor):-1);MPJ.fin(G0.phase=='final'&&G0.win>=0?seatDe(G0.win):-1)}
 const RT=Math.max(hx,hz)+.6,fs=shR&&window.FONDO?FONDO.pinta(R,CA,'colonos',{r:RT,rt:RT/CS()}):0;if(fs!==fz){fz=fs;casaModo()}
 if(!fs){R.setRenderTarget(null);R.autoClear=false;R.clear()}
 const au=R.shadowMap.autoUpdate;R.shadowMap.autoUpdate=false;if(dirty>0||anim.length||rollS){R.shadowMap.needsUpdate=true;if(dirty>0)dirty--}
 R.render(SC,CA);R.shadowMap.autoUpdate=au}
// ---------- API (la de CO2) ----------
const CO3=window.CO3={
 usa:()=>quiere&&ok,
 show(on){if(on&&!init()){CO2.show(true);return}if(!root||on===shown)return;shown=on;
  if(on){root.classList.remove('sale');root.classList.add('on');root.style.display='';szOk=false;dirty=6}
  else{root.classList.add('sale');root.classList.remove('on');if(window.MPJ)MPJ.suelta();setTimeout(()=>{if(!shown)root.style.display='none'},380);arr=false;VT.e=EL}},
 sync(G,me,o){if(!init())return CO2.sync(G,me,o);G0=G;me0=me;if(!W){W=innerWidth;H=innerHeight}arma(G);pzSync(G,me);spSync(G,me,o||{});gente();place(VW);dirty=Math.max(dirty,2)},
 fit(i){if(i.t===ins.t&&i.r===ins.r&&i.b===ins.b&&i.l===ins.l)return;ins=i;FC.k=''},
 pos(t,id){if(!G0||!IS)return null;const g=D.geo(G0.hx),p=t=='h'?g.H[id]:t=='e'?g.E[id]:g.V[id];return p?scr(v3(wx(p),YT,wz(p))):null},
 mid(){return IS?scr(v3(0,YT,0)):CO2.mid()},
 roll(s){if(!IS)return;rollS=s;rollT=performance.now()},
 dados:tira,
 // dónde está un rival en pantalla: sus manos (cartas) o sobre su cabeza (globito); null si no se ve
 seat(k,cab){if(!G0||!window.MPJ||!MPJ.on)return null;const i=seatDe(k);if(!i)return null;const p=cab?MPJ.arriba(i):MPJ.mano(i);if(!p)return null;const s=scr(p);return s.x>8&&s.x<W-8&&s.y>8&&s.y<H-8?s:null},
 reset(){VT.k=1;VT.x=VT.z=0},
 arriba(){arr=!arr;VT.e=arr?ELA:EL;document.querySelectorAll('.co2d .gj-arr').forEach(b=>{b.classList.toggle('on',arr);b.setAttribute('aria-pressed',arr)})},
 get top(){return arr},
 get zoom(){return VT.k}};
window.COB=()=>CO3.usa()?CO3:CO2;
window.co3Toggle=()=>{const a=CO3.usa();quiere=!a;lsS('co_3d',quiere?'1':'0');(a?CO3:CO2).show(false);(CO3.usa()?CO3:CO2).show(true);if(typeof render=='function')render()};
})();
