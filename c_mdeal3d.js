// c_mdeal3d.js — MD3: Monopoly Deal 3D en la mesa redonda de la casa (MESA), con los personajes (MPJ), la cámara viva (MCAM) y la casa de fondo (FONDO).
// NO cambia reglas ni servidor ni c_monopolydeal.js (lo comparte el 2D Ligero): envuelve GM.monopolydeal.body/after (ya envueltos por c_mdeal_hud.js) y usa
// sus mismas acciones y su estado (mdPick, mdSel, mdPay, mdSt…). Cada jugador tiene su zona del fieltro (MESA zona) frente a su silla: el banco
// en billetes a la izquierda y sus propiedades en columnas por color. Tu mano va en abanico frente a la cámara; tocar una carta abre su tarjeta (MD3U).
// Cartas: c_mdeal3d_kit.js (MD3K). Interfaz: c_mdeal3d_ui.js (MD3U) + ui_mdeal3d.css. "Vista clásica 2D" en el ☰ (localStorage md_3d).
(function(){
if(typeof THREE==='undefined'||typeof GM==='undefined'||!GM.monopolydeal||!window.MD3K||!window.MD3U||!window.MESA){console.warn('Monopoly Deal 3D: falta algo');return}
const orig=GM.monopolydeal.body,origAfter=GM.monopolydeal.after,K3=window.C3D||null,G0=GM.monopolydeal;
const $=s=>document.querySelector(s),lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
let on=lsGet('md_3d')!=='0';
let R,SC,CA,root,cv,ready=false,shR=false,fz=0,W=0,H=0,L=null,tableKey='',tbl=null,mesa=null,mc=null,hdNow=0;
let menu=false,winHide=false,msgK='',msgT=0,dealN=-1,logN=-1,first=true,dealing=false,dl=0,hov=null,st=null,myTc=null,lastNow=0,pin=null,setsN=null;
const meshes=new Map(),texC={},glows=new Map(),hits=[],tch=new Map();
const CW=1,CH=1.5,CT=.012,D=3;
const ray=new THREE.Raycaster();ray.layers.enableAll();
const P2=new THREE.Vector2(),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1),YA=new THREE.Vector3(0,1,0),MLT=new THREE.Vector3();
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),Qe=(x,y,z)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
const FD=Qe(0,0,Math.PI),hh=n=>(Math.imul(n+7,2654435761)>>>0);
const VW={x:0,z:0,k:1,a:0,t:0},VT={x:0,z:0,k:1,a:0,t:0,who:-1},KMAX=4,PL=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const FELT=['#3d84cc','#123a68'];
(window.MESA_J=window.MESA_J||{}).monopolydeal={col:()=>FELT,logo:null};   // la casa pone esta misma mesa (c_mesa3d.js)

// ---------- texturas y cartas ----------
function tx(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=R?Math.min(16,R.capabilities.getMaxAnisotropy()):4;return t}
addEventListener('md3k-arte',()=>{for(const f in texC)texC[f].needsUpdate=true});   // ya están las caras ilustradas
const faceT=f=>texC[f]||(texC[f]=tx(f[0]=='b'?MD3K.billete(+f.slice(1)):MD3K.cara(+f.slice(1))));   // f: 'c'+id (su cara) o 'b'+valor (billete)
const backT=()=>texC.d||(texC.d=tx(MD3K.dorso()));
function glowTex(){if(texC.glow)return texC.glow;const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.shadowColor='#fff';g.shadowBlur=34;g.fillStyle='#fff';g.beginPath();g.roundRect?g.roundRect(52,52,152,152,16):g.rect(52,52,152,152);g.fill();g.fill();return texC.glow=tx(c)}
const GI=152/256;
let GEO=null;
function mkCard(f){GEO=GEO||new THREE.BoxGeometry(CW,CT,CH);const ed=new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.6});
 const top=new THREE.MeshStandardMaterial({map:f?faceT(f):backT(),roughness:.55,alphaTest:.5}),bot=new THREE.MeshStandardMaterial({map:backT(),roughness:.55,alphaTest:.5});
 const m=new THREE.Mesh(GEO,[ed,ed,top,bot,ed,ed]);m.castShadow=true;m.receiveShadow=true;m.userData={f};return m}
function setFace(m,f){const t=f?faceT(f):backT();m.userData.f=f;if(m.material[2].map!==t){m.material[2].map=t;m.material[2].needsUpdate=true}}
function tint(m,v){const c=m.material[2].color;if(Math.abs(c.r-v)>.01)c.setScalar(v)}
function drop(key){const m=meshes.get(key);if(!m)return;m.parent&&m.parent.remove(m);m.material.forEach(x=>x.dispose());if(m.userData.sg){m.userData.sg.geometry.dispose();m.userData.sg.material.dispose()}meshes.delete(key)}
function target(m,par,pos,q,s,o={}){const T=m.userData.T;
 if(T&&T.par===par&&T.pos.distanceToSquared(pos)<1e-8&&T.q.angleTo(q)<1e-4&&Math.abs(T.s-s)<1e-6)return;
 m.userData.T={par,pos:pos.clone(),q:q.clone(),s};if(m.parent!==par)par.attach(m);
 const ly=par===CA?1:0;if(m.userData.ly!==ly){m.userData.ly=ly;m.traverse(o=>o.layers.set(ly));const hd=ly==1;m.material.forEach(x=>{x.depthTest=!hd;x.depthWrite=!hd;x.transparent=hd;x.needsUpdate=true});m.material[3].visible=!hd;if(!hd)m.renderOrder=0}
 const ms=RM||(first&&!dealing)?0:(o.ms==null?480:o.ms);
 if(!ms){m.position.copy(pos);m.quaternion.copy(q);m.scale.setScalar(s);m.userData.tw=null;return}
 m.userData.tw={p0:m.position.clone(),q0:m.quaternion.clone(),s0:m.scale.x,t0:performance.now()+(o.delay||0),ms,arc:o.arc==null?(par===SC?.6:.12):o.arc,spin:o.spin||0,pv:o.pv}}
function step(now){meshes.forEach(m=>{const w=m.userData.tw,T=m.userData.T,b=m.userData.bob;if(!w){if(b!=null&&T&&!RM)m.position.y=T.pos.y+.035*Math.sin(now/340+b);return}let k=(now-w.t0)/w.ms;if(k<0)return;if(k>1)k=1;
 const e=1-Math.pow(1-k,3),a=Math.sin(Math.PI*k)*w.arc;m.position.lerpVectors(w.p0,T.pos,e);if(T.par===SC)m.position.y+=a;else m.position.z+=a;
 m.quaternion.slerpQuaternions(w.q0,T.q,e);if(w.spin)m.rotateY(w.spin*(1-e));m.scale.setScalar(w.s0+(T.s-w.s0)*e);
 if(k===1){m.userData.tw=null;if(w.pv&&window.MFX&&T.par===SC)MFX.polvo(SC,T.pos,T.s)}})}
function glow(key,pos,w,h,col,lvl,hit,ry){let g=glows.get(key);
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.renderOrder=1;SC.add(g);glows.set(key,g)}
 g.visible=true;g.position.copy(pos);g.rotation.z=ry||0;g.scale.set(w/GI,h/GI,1);g.material.color.set(col);g.userData.lvl=lvl;g.userData.hit=hit||null;g.userData.used=1;if(hit)hits.push(g);return g}
function pulse(now){const p=.65+.35*Math.sin(now/260);glows.forEach(g=>{g.material.opacity=g.userData.lvl*(g.userData.lvl>.5?p:1)})}
function selGlow(m,onn,col){let g=m.userData.sg;if(!g&&!onn)return;
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(CW*1.24/GI,CH*1.16/GI),new THREE.MeshBasicMaterial({map:glowTex(),opacity:.5,transparent:false,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.position.y=-CT;m.add(g);g.layers.set(m.userData.ly||0);m.userData.sg=g}
 if(g.layers.mask!==(1<<(m.userData.ly||0)))g.layers.set(m.userData.ly||0);g.visible=!!onn;if(onn)g.material.color.set(col)}

// ---------- escena y mesa ----------
function init(){if(ready)return;ready=true;
 shR=!!(window.FONDO&&FONDO.R('monopolydeal'));R=shR?FONDO.R():new THREE.WebGLRenderer({antialias:true,alpha:true});if(!shR){R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap}
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,200);SC.add(CA);
 const hl=new THREE.HemisphereLight(0xffffff,0x2a1e18,1.7);SC.add(hl);
 const Ld=new THREE.DirectionalLight(0xfff2da,2.6);Ld.position.set(-5,14,7);Ld.castShadow=true;Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0004;
 Object.assign(Ld.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:60});SC.add(Ld);
 const fill=new THREE.DirectionalLight(0xbfdcff,.6);fill.position.set(6,6,-4);SC.add(fill);
 const pt=new THREE.PointLight(0xffffff,1.6,0,1.4);pt.position.set(0,1.2,1);CA.add(pt);
 [hl,Ld,fill,pt].forEach(l=>l.layers.enableAll());R.autoClear=false;
 root=document.createElement('div');root.id='md3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pCancel);
 cv.addEventListener('pointerleave',()=>{if(!st&&hov!=null){hov=null;sync()}});cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();if(mc)mc.toca();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0015))},{passive:false});
 addEventListener('keydown',e=>{if(!active()||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;
  if(e.key==='Escape'){if(menu){menu=false;render()}else if(mdTg){mdTg=null;render()}else if(mdSt){mdSt=null;render()}else if(mdSel!=null){mdSel=null;render()}else if(window.MD3A&&MD3A.dz.size){MD3A.dz.clear();render()}else home();return}
  if(e.key===' '||e.key==='Home'){if(viewed()){e.preventDefault();home()}return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const c={q:'rl',e:'rr',r:'tu',f:'td',w:'up',arrowup:'up',s:'dn',arrowdown:'dn',a:'lf',arrowleft:'lf',d:'rt',arrowright:'rt','+':'zi','=':'zi','-':'zo'}[e.key.toLowerCase()];
  if(c){e.preventDefault();camStep(c)}});
 mc=window.MCAM?MCAM.crea({vt:VT,home,snap,viewed,el:()=>L?L.el:1,kTop:()=>L&&L.kTop||.8}):null;
 requestAnimationFrame(loop3)}
function buildTable(por){if(window.MPJ)MPJ.suelta();if(tbl){SC.remove(tbl);tbl.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 tbl=new THREE.Group();SC.add(tbl);mesa=MESA.arma(tbl,{n:V&&V.G?V.G.players.length:4,col:FELT,logo:null,sep:2.3});mesa.escala((fz||MESA.CASA_S)*((window.FONDO&&FONDO.MII)||1));   // personajes del tamaño de la casa (como Uno)
 L=Object.assign(L||{},{por,rx:mesa.r,rz:mesa.r,ps:.9});L.deck=mesa.centro.mazo.clone();L.disc=mesa.centro.descarte.clone();
 if(K3){const room=K3.buildRoom(por,mesa.r,mesa.r);tbl.add(room);L.room=room.userData.room;L.roomG=room}L.baseM=mesa.pie;fz=-1}

// ---------- cámara ----------
function layout(){const w=innerWidth,h=innerHeight;W=w;H=h;R.setSize(w,h,false);
 const por=w/h<.95,tk=(por?'p':'l')+(V&&V.G?V.G.players.length:4);if(tk!==tableKey){tableKey=tk;buildTable(por)}
 const bt=e=>{const r=e&&e.getBoundingClientRect();return r&&r.height?r:null},tb=bt($('#gjHint'))||bt($('#gjTop')),bb=$('#gjBar .gj-bb');
 const top=(tb?tb.bottom:80)+(h<500?4:10),bar=h-(bb?bb.getBoundingClientRect().top:h-60);
 const ch=Math.max(76,Math.min(h*(por?.19:.17),w*.26,170));Object.assign(L,{top,bar,ch,barTop:bb?bb.getBoundingClientRect().top:0});
 document.documentElement.style.setProperty('--md3fan',Math.round(bar+ch*1.05)+'px');document.documentElement.style.setProperty('--md3bar',Math.round(bar+8)+'px');document.documentElement.style.setProperty('--md3top',Math.round(top)+'px');
 const rb=h-bar-ch*.55,rh=Math.max(120,rb-top),el=por?.85:.8;
 CA.clearViewOffset();CA.aspect=w/rh;
 const pts=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;for(const y of [0,.3])pts.push(v3(Math.cos(a)*(L.rx-.25),y,Math.sin(a)*(L.rz-.25)))}
 const ext=d=>{CA.position.set(0,Math.sin(el)*d,Math.cos(el)*d);CA.lookAt(0,0,0);CA.updateProjectionMatrix();CA.updateMatrixWorld();
  let a=1e9,b=-1e9,c=1e9,e=-1e9;pts.forEach(p=>{const q=p.clone().project(CA);a=Math.min(a,q.x);b=Math.max(b,q.x);c=Math.min(c,q.y);e=Math.max(e,q.y)});return [a,b,c,e]};
 let lo=3,hi=120;for(let i=0;i<32;i++){const m=(lo+hi)/2,x=ext(m);((x[1]-x[0])/2<.98&&(x[3]-x[2])/2<.97)?hi=m:lo=m}
 const x=ext(hi),cx=(x[0]+x[1])/2,cy=(x[2]+x[3])/2;
 L.el=el;L.d=hi;L.kTop=.8;CA.setViewOffset(w,rh,cx*w/2,-top-cy*rh/2,w,h);CA.updateProjectionMatrix();lampY();clampV();cam()}
function lampY(){if(!mesa)return;const p=v3(0,0,0);let lo=mesa.r*1.1,hi=mesa.r*4;
 if(p.set(0,lo,mesa.sr).project(CA).y<1.03)for(let i=0;i<20;i++){const m=(lo+hi)/2;p.set(0,m,mesa.sr).project(CA).y>1.03?hi=m:lo=m}else hi=lo;mesa.lampara(hi)}
function cam(){if(!L||!L.d)return;const e=L.el+VW.t,d=L.d/VW.k;
 CA.position.set(VW.x+Math.sin(VW.a)*Math.cos(e)*d,Math.sin(e)*d,VW.z+Math.cos(VW.a)*Math.cos(e)*d);CA.lookAt(VW.x,0,VW.z);if(hdNow)CA.rotateOnWorldAxis(YA,hdNow);CA.updateMatrixWorld()}
function vivo(now,dt){const G=V.G,t=G.turn,tp=t>=0&&G.phase==='play'&&mesa?mesa.asiento(rel(t)).mano:null;
 if(mesa){MLT.set(tp?tp.x*.7:0,0,tp?tp.z*.7:0);mesa.luzHacia(MLT,1-Math.exp(-dt/900));mesa.pantalla(L.el+VW.t<1.2)}
 if(!mc||!L||!L.d)return;const e=L.el+VW.t,d=L.d/VW.k;
 const h=mc.paso(now,{cam:{px:VW.x+Math.sin(VW.a)*Math.cos(e)*d,pz:VW.z+Math.cos(VW.a)*Math.cos(e)*d,lx:VW.x,lz:VW.z},turno:t!==V.me?tp:null,quieto:!!(st||pin||VT.who>=0||mdSt||mdTg)});
 if(h!==hdNow){hdNow=h;cam()}}
function corte(k,ms){if(!mc||!mesa||k===V.me)return;const A=mesa.asiento(rel(k)),c=Math.cos(A.a),s=Math.sin(A.a),r=mesa.r*.6;mc.corte({x:c*r,z:s*r,a:Math.atan2(-c,-s),k:2.2,t:-.25},ms)}
function clampV(){if(!L)return;VT.k=Math.max(VT.top?.7:1,Math.min(KMAX,VT.k));const Q=L.room||{X:L.rx+2,ZB:-L.rz-6,ZF:L.rz+2};VT.x=Math.max(-Q.X+1,Math.min(Q.X-1,VT.x));VT.z=Math.max(Q.ZB-2,Math.min(Q.ZF+1,VT.z));
 VT.t=Math.max(.25-L.el,Math.min(1.5-L.el,VT.t));if(L.d)VT.k=Math.min(VT.k,Math.max(1,Math.sin(L.el+VT.t)*L.d/3.6))}
const VK=['x','z','k','a','t'];
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);cam()}
// barrido al mirar a alguien: la cámara sube y se aleja a medio camino; ya ahí, se mece despacio
let sw=0,drg=null;
function dropAt(x,y){const p=ground(x,y),me=V.me;if(!p||!mesa||me<0)return null;const Z=zona(me),d=p.clone().sub(Z.c),u=d.dot(Z.ex),v=d.dot(Z.ez),U=c=>c.pos.clone().sub(Z.c).dot(Z.ex);
 if(Math.abs(u)<Z.w*1.15&&Math.abs(v)<Z.h*1.35){const out=lay(me).out;let b=null,bd=1e9;out.forEach(c=>{const du=Math.abs(U(c)-u);if(du<bd){bd=du;b=c}});
  if(b&&bd<b.s*CW*.75)return {z:b.hit.t=='bank'?'bank':'prop',col:b.hit.col};const bk=out.some(c=>c.hit.t=='bank'),u0=out.length?Math.min(...out.map(U)):0;return {z:!bk&&u<u0?'bank':'prop'}}
 return Math.hypot(p.x,p.z)<Math.min(L.rx,L.rz)*.5?{z:'centro'}:null}
function dragPos(){const m=meshes.get('c'+drg.id),f=L.hand&&L.hand.find(h=>h.id===drg.id);if(!m||!f)return;const p=ground(drg.x,drg.y);
 if(p&&(p.x*p.x)/(L.rx*L.rx)+(p.z*p.z)/(L.rz*L.rz)<1.1){p.y=.35;target(m,SC,p,Qe(0,zona(V.me).yaw,0),L.ps*1.15,{ms:90,arc:0})}
 else target(m,CA,loc(drg.x,drg.y,D-.05),f.q,f.s*1.08,{ms:60,arc:0})}const SWD=1000;
function viewStep(dt){const now=performance.now(),sp=sw&&!RM?Math.min(1,(now-sw)/SWD):1;if(sp>=1)sw=0;const arc=sp<1?Math.sin(Math.PI*sp):0;
 const sway=!RM&&!sw&&VT.who>=0?{a:.06*Math.sin(now/2600),t:.025*Math.sin(now/3700)}:null;
 const f=RM?1:1-Math.exp(-dt/(sw?210:110));let ch=0;VK.forEach(q=>{let tg=VT[q]+(q=='t'?.3*arc:q=='k'?-.35*arc*VT.k/2:0)+(sway&&sway[q]||0);if(q=='t')tg=Math.min(tg,1.5-L.el);const d=tg-VW[q];if(Math.abs(d)>1e-4){VW[q]+=d*f;ch=1}else if(d){VW[q]=tg;ch=1}});if(ch)cam()}
const viewed=()=>VT.k>1.02||Math.abs(VT.x)>.05||Math.abs(VT.z)>.05||Math.abs(VT.a)>.01||Math.abs(VT.t)>.01;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function home(){if(VT.who>=0)sw=performance.now();VW.a=wrap(VW.a);Object.assign(VT,{x:0,z:0,k:1,a:0,t:0,who:-1,top:false})}
function camStep(c){const f=1.1/VT.k,sa=Math.sin(VT.a),ca=Math.cos(VT.a),mv={up:[0,-1],dn:[0,1],lf:[-1,0],rt:[1,0]}[c];
 if(c=='rl')VT.a-=.2;else if(c=='rr')VT.a+=.2;else if(c=='zi')VT.k*=1.2;else if(c=='zo')VT.k/=1.2;else if(c=='tu')VT.t+=.09;else if(c=='td')VT.t-=.09;
 else if(mv){VT.x+=(mv[0]*ca+mv[1]*sa)*f;VT.z+=(-mv[0]*sa+mv[1]*ca)*f}else return;VT.who=-1;clampV()}
function ground(cx,cy){const r=cv.getBoundingClientRect();P2.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(PL,v3(0,0,0))}
function zoomAt(cx,cy,k){const p=ground(cx,cy);k=Math.max(1,Math.min(KMAX,k));if(!p)return;const f=VT.k/k;VT.x=p.x-(p.x-VT.x)*f;VT.z=p.z-(p.z-VT.z)*f;VT.k=k;VT.who=-1;clampV()}
// mirar la zona de un jugador desde su lado (sus cartas se leen derechas). Otra vez = regresar
function look(k){if(!L||!mesa)return;if(mc)mc.toca();if(VT.who===k)return home();const z=zona(k);
 let a=Math.atan2(z.ez.x,z.ez.z);a=VW.a+wrap(a-VW.a);Object.assign(VT,{x:z.c.x,z:z.c.z,a,t:.12,k:k===V.me?1.9:2.1,who:k});clampV();sw=performance.now();sfx('card')}
function loc(px,py,d){const v=v3(px/W*2-1,1-py/H*2,.5).applyMatrix4(CA.projectionMatrixInverse);return v.multiplyScalar(-d/v.z)}
function toPx(p){const q=p.clone().project(CA);return [(q.x+1)/2*W,(1-q.y)/2*H]}

// ---------- posiciones ----------
const rel=k=>{const n=V.G.players.length,me=V.me<0?0:V.me;return (k-me+n)%n};
const zona=k=>mesa.asiento(rel(k)).zona;
function seatP(k,f){const a=mesa.asiento(rel(k)).a;return v3(Math.cos(a)*L.rx*f,0,Math.sin(a)*L.rz*f)}
const seatW=k=>{const q=window.MPJ&&MPJ.on&&MPJ.mano(rel(k));if(q)return q;const p=seatP(k,.86);p.y=.3;return p};
// lo que tiene un jugador en la mesa: banco (billetes de mayor a menor), propiedades por color (con su casa y hotel encima) y casas sueltas
function items(k){const G=V.G,tb=G.tb[k]||{},hs=(G.hs&&G.hs[k])||{},it=[];
 const bk=[...(G.bank[k]||[])].sort((a,b)=>mdCAT[a].v-mdCAT[b].v||a-b);if(bk.length)it.push({t:'bank',ids:bk});
 Object.keys(tb).map(Number).filter(c=>tb[c].length).sort((a,b)=>a-b).forEach(c=>{const s=hs[c]||{};it.push({t:'tb',col:c,ids:[...tb[c],...[s.h,s.hh].filter(x=>x!=null)],full:mdCmp(tb[c],c)})});
 const hl=(G.hl&&G.hl[k])||[];if(hl.length)it.push({t:'hl',ids:[...hl]});return it}
// acomoda las columnas en la zona (una o dos filas, la carta más grande que quepa). Regresa [{id,face,pos,q,s,hit,top}] y los rectángulos de sets completos
function lay(k){const z=zona(k),it=items(k),n=Math.max(1,it.length),Wd=2*z.w*.96,Dp=2*z.h*.92,OF=.2,bx=k===V.me&&mdPaying(),cnt=x=>x.t=='bank'&&!bx?Math.min(x.ids.length,3):x.ids.length;let best=null;
 for(let r=1;r<=2;r++){const per=Math.ceil(n/r);let cw=Math.min(1.15,Wd/per/1.08);
  for(let ri=0;ri<r;ri++){const row=it.slice(ri*per,ri*per+per),mx=Math.max(1,...row.map(cnt)),need=cw*CH*(1+(mx-1)*OF);if(need>Dp/r)cw=Dp/r/(CH*(1+(mx-1)*OF))}
  if(!best||cw>best.cw*1.06)best={r,per,cw}}
 const {r,per,cw}=best,ch=cw*CH,pitch=Wd/per,q=Qe(0,z.yaw,0),out=[],sets=[];
 it.forEach((x,j)=>{const ri=Math.floor(j/per),jj=j%per,rn=Math.min(per,it.length-ri*per),u=(jj-(rn-1)/2)*pitch,v0=-z.h*.92+ri*(Dp/r)+ch/2,nn=x.ids.length;
  const off=x.t=='bank'&&nn>3&&!bx?ch*OF*2/(nn-1):ch*OF;
  x.ids.forEach((id,i)=>{const v=v0+i*off,p=z.c.clone().addScaledVector(z.ex,u).addScaledVector(z.ez,v);p.y=.008+i*.0045;
   const cc=mdCAT[id],up=x.t=='tb'&&cc.t=='w'&&Array.isArray(cc.cs)&&cc.cs[1]===x.col;out.push({id,face:x.t=='bank'?'b'+mdCAT[id].v:'c'+id,pos:p,q:up?Qe(0,z.yaw+Math.PI,0):q,s:cw,hit:{t:x.t,k,id,col:x.col,full:x.full}})});
  if(x.full){const vm=v0+(nn-1)*off/2,p=z.c.clone().addScaledVector(z.ex,u).addScaledVector(z.ez,vm);sets.push({col:x.col,p,w:cw*1.25,h:ch+(nn-1)*off+cw*.2})}});
 return {out,sets,z}}
// abanico de tu mano (hija de la cámara): la elegida se asoma
function fan(ids,sel){const n=ids.length,ch=L.ch,cw=ch/CH*CW,upp=(loc(W,0,D).x-loc(0,0,D).x)/W,av=W-24-ch*.3,cx=W/2,out=[];
 let rows=1,per=n,stp=n>1?Math.min(cw*.66,(av-cw)/(n-1)):0;if(n>9&&stp<cw*.3){rows=2;per=Math.ceil(n/2);stp=Math.min(cw*.66,(av-cw)/(per-1))}
 ids.forEach((id,i)=>{const r=rows==2&&i>=per?1:0,j=r?i-per:i,rn=r?n-per:Math.min(n,per),off=j-(rn-1)/2,dx=off*stp,u=dx/(W/2);
  let y=H-Math.max(L.bar,72)-8-ch/2+u*u*ch*.18-(rows==2&&!r?ch*.42:0);if(sel instanceof Set?sel.has(id):id===sel)y-=ch*.3;else if(hov===id)y-=ch*.08;
  const ang=Math.max(-.3,Math.min(.3,-u*.22)),d=D-i*.004-(r?.03:0);
  out.push({id,x:cx+dx,y,pos:loc(cx+dx,y,d),q:new THREE.Quaternion().setFromAxisAngle(Z,ang).multiply(new THREE.Quaternion().setFromAxisAngle(X,Math.PI/2-.16)),s:ch*upp/CH})});
 return out}

// ---------- personajes y reacciones ----------
function avSync(){if(!window.MPJ||!mesa)return;const G=V.G,P=V.players||[];
 if(MPJ.sync(mesa,G.players.map((_,k)=>({i:rel(k),k,cod:(P[k]&&P[k].av)||MPJ.codigo(P[k]&&P[k].name)})).filter(x=>!(P[x.k]&&P[x.k].out)),{dorso:backT(),listo:()=>sync()}))MPJ.hits().forEach(o=>hits.push(o))}
function avStep(now){if(window.MPJ&&MPJ.on&&V&&V.G){const G=V.G;MPJ.paso(now,G.phase=='play'&&G.turn>=0?rel(G.turn):-1);MPJ.fin(G.phase=='final'&&G.win>=0?rel(G.win):-1)}}
const byName=t=>V.G.players.findIndex(p=>t.includes(p.name));
function react(e){const k=e.k,t=e.t,pj=window.MPJ&&MPJ.on,i=k>=0?rel(k):-1,c=e.c!=null?mdCAT[e.c]:null;
 if(/^robó/.test(t)){const m=/^robó (\d+)/.exec(t),n=Math.min(m?+m[1]:1,5);if(pj&&i>0)for(let j=0;j<n;j++)setTimeout(()=>MPJ.roba(i,L.deck,CW*.9),j*150);else if(pj)MPJ.estira(0,L.deck);return}
 if(/^jugó/.test(t)){if(pj)MPJ.estira(i,L.disc);if(!c)return;
  if(c.t=='r'){const m=/cobra \$(\d+)M de (\S+)/.exec(t),ci=m?mdCN.findIndex(x=>x.toLowerCase()==m[2]):-1;popAt(-1,'Renta'+(m?' $'+m[1]+'M':''),ci>=0?mdCC[ci]:'#c9971a',ci>=0?mdCN[ci]:'');return}
  if(c.t=='a'){popAt(-1,mdAN[c.k],MD3K.ACOL[c.k]||'#fff');const v=/contra (.+?)(:|$)/.exec(t),x=v?byName(v[1]):-1;
   if(x>=0&&pj){if(c.k=='dino')MPJ.cabeza(rel(x),2200);else MPJ.mira(rel(x),zona(x).c,1800)}
   if(c.k=='tratosucio'&&x>=0)corte(x,1900)}return}
 if(/^(guardó|puso|movió)/.test(t)){if(pj&&i>=0)MPJ.estira(i,zona(k).c);return}
 if(/^pagó/.test(t)){const m=/\$(\d+)M/.exec(t);if(m)popAt(k,'-$'+m[1]+'M','#e0523a');if(pj&&i>=0)MPJ.cabeza(i,1500);return}
 if(/^(le robó|cambió)/.test(t)){popAt(k,/set/.test(t)?'Set robado':/^cambió/.test(t)?'Cambio':'Robo',MD3K.ACOL.tratosucio);if(pj&&i>=0)MPJ.festeja(i);return}
 if(/^aceptó/.test(t)){if(pj&&i>=0)MPJ.cabeza(i,1500)}}
function popAt(k,t,col,sub){if(!L)return;const pa=k>=0&&window.MPJ&&MPJ.on&&MPJ.arriba(rel(k)),p=k<0?L.disc.clone().setY(.5):pa?pa.clone():seatP(k,1).setY(.6),[x,y]=toPx(p);
 const el=document.createElement('div');el.className='u3fx'+(k<0?' big':'');el.style.cssText=`left:${Math.max(60,Math.min(W-60,x))}px;top:${Math.max(70,Math.min(H-40,y))}px;--c:${col}`;
 el.innerHTML=`<b>${esc(t)}</b>${sub?`<small>${esc(sub)}</small>`:''}`;document.body.appendChild(el);setTimeout(()=>el.remove(),1500)}

// ---------- sincronizar la escena con el estado ----------
function ens(key,f,from){let m=meshes.get(key);
 if(!m){m=mkCard(f);SC.add(m);m.position.copy(from||L.deck);m.position.y+=.06;m.quaternion.copy(FD);m.scale.setScalar(L.ps);meshes.set(key,m);m.userData.nw=1}
 setFace(m,f);return m}
function go(m,par,pos,q,s,o){o=o||{};if(m.userData.nw){m.userData.nw=0;o.ms=Math.max(o.ms||0,560);o.pv=1;if(dealing){o.delay=dl*45;dl++}}target(m,par,pos,q,s,o)}
function sync(){if(!ready||!L||!mesa||!active())return;
 if(mesa.n!==V.G.players.length){layout();if(mesa.n!==V.G.players.length)return}
 const G=V.G,n=G.players.length,me=V.me,live=new Set(),fin=G.phase=='final',mine=!fin&&me>=0&&G.turn==me,P=V.players||[];
 hits.length=0;glows.forEach(g=>{g.userData.used=0});
 if(G.dn!==dealN){dealing=dealN>=0||G.cd>600;dealN=G.dn;logN=-1;setsN=null;meshes.forEach((m,k)=>drop(k));home()}else dealing=false;dl=0;
 if(mine&&myTc!==G.tc){myTc=G.tc;if(VT.who>=0)home()}
 const from={};(G.log||[]).forEach(e=>{if(e.n<=logN)return;if(e.c!=null&&e.k>=0)from[e.c]=e.k;if(logN>=0&&e.k!=null&&e.k>=0)react(e)});
 logN=Math.max(logN,G.ln||0);
 // sets completos nuevos: festejo y destellos
 const sc=G.players.map((_,k)=>P[k]&&P[k].out?0:mdSets(k));if(setsN&&!fin)sc.forEach((s,k)=>{if(s>setsN[k]){popAt(k,'Set completo','#f2c14e',s+' de '+G.opts.sets);if(window.MPJ&&MPJ.on)MPJ.festeja(rel(k))}});setsN=sc;
 // mazo
 const nv=G.deck?Math.min(12,Math.ceil(G.deck/7)):0;
 for(let i=0;i<nv;i++){const key='dk'+i,m=ens(key,null);live.add(key);m.userData.nw=0;m.userData.hit={t:'deck'};hits.push(m);target(m,SC,v3(L.deck.x+(i%2)*.006,.012+i*CT*L.ps*1.5,L.deck.z),Qe(0,(i%3-1)*.012,Math.PI),L.ps,{ms:250})}
 // descarte: las últimas que cayeron, un poco desordenadas
 const dsc=(G.disc||[]).slice(-6);
 dsc.forEach((id,i)=>{const key='c'+id,h=hh(id),fk=from[id],m=ens(key,'c'+id,fk!=null&&fk!==me?seatW(fk):null);live.add(key);m.userData.hit={t:'disc',id};hits.push(m);
  go(m,SC,v3(L.disc.x+((h%13)-6)*.02,.012+i*CT*L.ps*1.6,L.disc.z+(((h>>5)%11)-5)*.02),Qe(0,((h>>9)%41-20)*.02,0),L.ps,{spin:fk!=null&&!first?Math.PI*2:0})});
 avSync();
 // qué brilla: lo que puedes pagar, robar o mover
 const pay=me>=0&&!fin&&mdPaying(),stl=!fin&&mine&&mdSt?mdSt.m:null,canMv=mine&&G.step=='play'&&!G.pa&&G.plays<3;
 const elig=h=>{if(pay)return h.k===me;if(stl){if(h.k===stl.tgt&&h.t=='tb'){if(stl.t=='deal')return h.full;return !h.full&&mdCAT[h.id].t!='a'}
   if(stl.t=='forced'&&stl.take!=null&&h.k===me&&h.t=='tb')return !h.full&&mdCAT[h.id].t!='a';return false}
  if(canMv&&h.k===me)return (h.t=='tb'&&mdCAT[h.id].t=='w')||h.t=='hl';return false};
 // zonas de cada jugador
 for(let k=0;k<n;k++){const out=P[k]&&P[k].out,Z=zona(k);
  const lvl=0;   // sin brillo: el plano solo sirve para tocar la zona

  glow('z'+k,v3(Z.c.x,.002,Z.c.z),2*Z.w*1.04,2*Z.h*1.06,0xffffff,lvl,{t:'zone',k},Z.yaw);
  if(out)continue;const Ly=lay(k);
  Ly.out.forEach(c=>{const key='c'+c.id,m=ens(key,c.face,from[c.id]===k&&k!==me?seatW(k):null),h=c.hit,e=elig(h),sel=(pay&&mdPay.has(c.id))||(stl&&stl.take===c.id)||(mine&&mdSel===c.id&&mdFrom!=='h');
   live.add(key);m.castShadow=true;m.userData.hit=h;hits.push(m);m.renderOrder=0;tint(m,sel?1:(pay||stl)&&!e?.45:.8);m.userData.bob=sel?hh(c.id)%7:null;
   const p=sel?c.pos.clone().addScaledVector(Z.ex,c.s*.42).setY(c.pos.y+.3):c.pos;go(m,SC,p,sel?c.q.clone().multiply(Qe(0,-.14,0)):c.q,sel?c.s*1.12:c.s,{ms:sel?220:undefined});
   selGlow(m,false)});
  
  // manos de los rivales (con personaje la cantidad va en sus manos; sin personaje, boca abajo frente a su silla)
  if(k===me)continue;const cnt=Math.min(hc(k)||0,12),pj=window.MPJ&&MPJ.on&&!!MPJ.mano(rel(k));if(pj){MPJ.cartas(rel(k),hc(k)||0);continue}
  const a=mesa.asiento(rel(k)).a,c0=seatP(k,.9),tv=v3(Math.sin(a),0,-Math.cos(a)),ry=Math.PI/2-a;
  for(let j=0;j<cnt;j++){const key='h'+k+'_'+j,m=ens(key,null);live.add(key);m.userData.hit={t:'zone',k};hits.push(m);const off=j-(cnt-1)/2;go(m,SC,c0.clone().addScaledVector(tv,off*.2).setY(.012+j*.004),Qe(0,ry+off*.04,Math.PI),.45)}}
 if(me>=0&&window.MPJ&&MPJ.on)MPJ.cartas(0,hc(me)||0);
 // tu mano en abanico
 if(me>=0&&Array.isArray(G.hands[me])){const sel=mine&&G.step=='disc'&&window.MD3A?(MD3A.dzVale(),MD3A.dz):mine&&mdFrom==='h'?mdSel:null,F=fan(mdDisp(G.hands[me]),sel);L.hand=F;const dim=mine&&!(G.step=='play'&&!G.pa&&G.plays<3)&&G.step!='disc';
  F.forEach((f,i)=>{const key='c'+f.id,m=ens(key,'c'+f.id);live.add(key);m.castShadow=false;m.userData.hit={t:'hand',id:f.id};hits.push(m);
   m.renderOrder=10+i;tint(m,dim?.42:.66);if(m.userData.sg)m.userData.sg.renderOrder=5;if(drg&&drg.id===f.id)return;go(m,CA,f.pos,f.q,f.s,{ms:260})})}
 meshes.forEach((m,key)=>{if(!live.has(key))drop(key)});
 glows.forEach(g=>{if(!g.userData.used){g.visible=false;g.userData.lvl=0}});
 first=false}

// ---------- tocar ----------
function pick(e){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(hits,false).filter(x=>x.object.userData.hit&&(!window.FONDO||FONDO.seen(x.object)));if(h.length)pick.o=h[0].object;return h.length?h[0].object.userData.hit:null}
// mantener presionada una carta: verla en grande (MD3Z)
function lpRect(o){const b=new THREE.Box3().setFromObject(o),r=cv.getBoundingClientRect();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
 for(let i=0;i<8;i++){const q=v3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).project(CA),x=r.left+(q.x+1)/2*r.width,y=r.top+(1-q.y)/2*r.height;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
 const h=y1-y0,w=Math.min(x1-x0,h/1.5);return {x:(x0+x1)/2-w/2,y:y0,w,h:w*1.5}}
function lpArm(){const s=st;if(!s||!s.hit||s.hit.id==null||!window.MD3Z)return;const o=pick.o,id=s.hit.id;s.lp=setTimeout(()=>{if(st!==s||s.g)return;s.lpd=true;try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}MD3Z.abre(id,lpRect(o))},420)}
function pDown(e){if(!active())return;if(mc)mc.toca();if(menu){menu=false;render();return}
 if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(tch.size==2){st=null;const [a,b]=[...tch.values()];VK.forEach(q=>VT[q]=VW[q]);VT.who=-1;
   pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VW.k,g:ground((a[0]+b[0])/2,(a[1]+b[1])/2),ang:Math.atan2(b[1]-a[1],b[0]-a[0]),acc:0,rot:false,my:(a[1]+b[1])/2,mx:(a[0]+b[0])/2,t:VW.t,mode:null};return}
  if(tch.size>2)return}
 if(e.button==1)e.preventDefault();
 const rot=e.button==1||(e.button==2&&e.shiftKey),pan=e.button==2&&!rot;if(pan||rot)cv.style.cursor=rot?'move':'grabbing';
 st={x:e.clientX,y:e.clientY,hit:pan||rot?null:pick(e),pid:e.pointerId,pan,rot,a0:VW.a,t0:VW.t,g:null};lpArm();try{cv.setPointerCapture(e.pointerId)}catch(_){}}
function pMove(e){if(!active())return;
 if(tch.has(e.pointerId)){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(pin&&tch.size>=2){const [a,b]=[...tch.values()],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]),dd=Math.hypot(a[0]-b[0],a[1]-b[1])-pin.d;let da=wrap(ang-pin.ang);pin.ang=ang;
   if(!pin.mode){const dy=my-pin.my,dx=mx-pin.mx;if(Math.abs(dy)>16&&Math.abs(dd)<Math.abs(dy)*.35&&Math.abs(dx)<Math.abs(dy)*.6&&Math.abs(pin.acc+da)<.1)pin.mode='tilt';else if(Math.abs(dd)>14||Math.abs(dx)>16||Math.abs(pin.acc+da)>.12)pin.mode='free'}
   if(pin.mode=='tilt'){VT.t=pin.t+(my-pin.my)*.006;VT.who=-1;snap();return}
   if(!pin.mode)return;
   pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.12){pin.rot=true;da=pin.acc}if(pin.rot)VT.a=VW.a+da;
   VT.k=pin.k*(Math.hypot(a[0]-b[0],a[1]-b[1])||1)/pin.d;snap();
   const p=ground(mx,my);if(p&&pin.g){VT.x+=pin.g.x-p.x;VT.z+=pin.g.z-p.z;snap()}return}}
 if(!st){if(e.pointerType==='mouse'){const h=pick(e),id=h&&h.t=='hand'?h.id:null;cv.style.cursor=h&&h.t!='zone'?'pointer':h?'pointer':'default';if(id!==hov){hov=id;sync()}}return}
 if(e.pointerId!==st.pid)return;
 if(st.hit&&st.hit.t=='hand'&&!st.pan&&!st.rot&&window.MD3A&&(drg||(Math.hypot(e.clientX-st.x,e.clientY-st.y)>10&&MD3A.puede(st.hit.id)))){if(!drg){drg={id:st.hit.id};clearTimeout(st.lp);cv.style.cursor='grabbing';if(mdSel!=null){mdSel=null;render()}}drg.x=e.clientX;drg.y=e.clientY;dragPos();return}
 if(st.rot){VT.a=st.a0+(e.clientX-st.x)*.007;VT.t=st.t0+(e.clientY-st.y)*.005;VT.who=-1;snap();return}
 if(st.g||Math.hypot(e.clientX-st.x,e.clientY-st.y)>10){if(!st.g){st.g=ground(st.x,st.y);VT.who=-1;if(!st.pan)cv.style.cursor='grabbing'}
  const p=ground(e.clientX,e.clientY);if(st.g&&p){VT.x=VW.x+st.g.x-p.x;VT.z=VW.z+st.g.z-p.z;VT.k=VW.k;snap()}}}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}
 if(!st||e.pointerId!==st.pid)return;const s=st;st=null;clearTimeout(s.lp);try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 if(s.lpd)return;
 if(drg){const d=drg,t=dropAt(d.x,d.y);drg=null;cv.style.cursor='default';eat=performance.now();if(!(t&&MD3A.suelta(d.id,t.z,t.col)))sfx('card');sync();return}
 if(s.pan||s.rot||s.g){cv.style.cursor='default';return}
 if(mc&&(!s.hit||s.hit.t=='zone'||s.hit.t=='seat')&&!mdTg&&mc.dobleToque(s.x,s.y))return;
 eat=performance.now();tap(s.hit)}
// el click que el navegador manda después de soltar no debe caer en la tarjeta que acaba de salir bajo el dedo (p. ej. «Al banco»)
let eat=0;addEventListener('click',e=>{if(performance.now()-eat<450&&e.target.closest&&e.target.closest('#md3box')){e.stopPropagation();e.preventDefault()}},true);
function pCancel(e){drg=null;if(e&&e.pointerId!=null)tch.delete(e.pointerId);if(tch.size<2)pin=null;st=null;sync()}
function tap(h){const G=V.G,me=V.me,fin=G.phase=='final';
 if(!h){if(mdSel!=null&&!mdSt&&!mdTg){mdSel=null;render();return}if(VT.who>=0)home();return}
 if(fin){if(h.k!=null)look(h.k);return}
 if(h.t=='hand'){if(me>=0&&G.turn==me&&G.step=='disc'&&window.MD3A)MD3A.dzTog(h.id);else if(me>=0&&G.turn==me)mdPick(h.id);else sfx('card');return}
 if(h.t=='deck'||h.t=='disc'){sfx('card');return}
 const k=h.k;
 if(mdTg&&k!=null&&k!==me)return mdTap(k);
 if(me>=0&&mdPaying()&&k===me&&h.id!=null)return mdPayTog(h.id);
 if(mdSt&&h.id!=null){const m=mdSt.m;
  if(k===m.tgt&&h.t=='tb'){if(m.t=='deal'){if(h.full)return mdStGrp(h.col);return bad('Toca un set completo.')}{if(!h.full&&mdCAT[h.id].t!='a')return mdStTake(h.id);return bad('Solo propiedades de sets sin completar.')}}
  if(m.t=='forced'&&m.take!=null&&k===me&&h.t=='tb'){if(!h.full&&mdCAT[h.id].t!='a')return mdStGive(h.id);return bad('Solo propiedades de sets sin completar.')}}
 if(k===me&&G.turn==me&&h.id!=null){if(h.t=='tb'&&mdCAT[h.id].t=='w')return mdPickT(h.id);if(h.t=='hl')return mdPickL(h.id)}
 if(k!=null)look(k)}

// ---------- capa de controles (HTML encima del 3D) ----------
const uic=n=>UI.ico(n);
function hud(){const G=V.G,i=V.me,t=G.turn,fin=G.phase=='final',w=G.win,mine=!fin&&i==t,h=i>=0&&Array.isArray(G.hands[i])?G.hands[i]:[],P=V.players;
 if(!fin)winHide=false;
 const pl=mine&&G.step=='play'&&!G.pa,dis=mine&&G.step=='disc',left=3-G.plays;
 const hint=fin?(w>=0&&w==i?'¡Juntaste '+G.opts.sets+' sets completos!':'Juntó '+G.opts.sets+' sets completos. ¿Otra partida?'):G.pa?'Hay una acción pendiente.':i<0?mirTxt():dis?`Descarta ${h.length-7}`:mine?(mdSel!=null||mdTg||mdSt?'':window.MD3A?MD3A.pips():left+'/3'):'Esperando a '+nm(t)+'…';
 const inf=i>=0?`Sets <b><i data-gvn="s${i}">${mdSets(i)}</i>/${G.opts.sets}</b> · Banco <b>$<i data-gvn="b${i}">${mdBank(i)}</i>M</b>`:`Gana con <b>${G.opts.sets}</b> sets`;
 const trn=fin?'Fin de la partida':mine?'¡Tu turno!':'Turno de '+nm(t);
 const lg=(G.log||[]).slice(-1)[0],lgT=lg&&lg.k>=0&&G.players[lg.k]?`${chip(lg.k)}<b>${esc(G.players[lg.k].name)}</b> ${esc(lg.t)}`:'';
 let o=GHUD.top({st:inf,turn:trn,me:mine,open:menu,menu:'md3Menu()',right:(window.MCAM?MCAM.boton(VT.top,'md3Arriba()'):'')+GHUD.view('md3Home()')});
 {const ht=dis?'':mine||fin||!lgT?hint:lgT;if(ht)o+=GHUD.hint(ht)}
 const mm=(msg||'').replace(/^\W+\s*/,''),mk=mm+'|'+(G.note||'');if(mk!==msgK){msgK=mk;msgT=Date.now()}const age=Date.now()-msgT,mt=mm||G.note;
 if(mt&&age<4500)o+=GHUD.toast(mm?esc(mm):'<b>'+esc(G.note)+'</b>',age);
 o+=MD3U.pa();
 // jugadores alrededor de la mesa (tocar = ver su zona; al elegir rival = elegirlo)
 const W2={wait:mdSK(G.pa&&G.pa.k)?'debe responder':'debe pagar',say:'«Di que no»',paid:'listo',no:'anulado'};
 G.players.forEach((p,k)=>{if(k===i)return;const pp=P[k],on2=!fin&&G.turn==k,px=G.pa&&G.pa.tg.find(y=>y.k==k),tg=mdTg&&mine&&!pp.out;
  o+=`<div class="ui gj-seat md3seat${on2?' on':''}${pp.out?' out':''}${VT.who==k?' look':''}${tg?' tgm':''}" data-seat="${k}" onclick="md3Seat(${k})" title="${tg?'Elegir a ':'Ver a '}${esc(p.name)}${pp.out?'':` · ${hc(k)} cartas · $${mdBank(k)}M · ${mdSets(k)}/${G.opts.sets} sets`}">${chip(k)}<b>${esc(p.name)}</b>${pp.on?'':'<i class="dot"></i>'}${pp.out?'<small>expulsado</small>':''}${px?`<em class="u3b">${W2[px.st]}</em>`:G.pa&&G.pa.by==k?'<em class="u3b">cobra</em>':fin&&w==k?'<em class="u3b">¡Ganó!</em>':''}</div>`});
 
 o+=MD3U.caja();
 let b='';
 if(fin){b=`<button class="ui-btn" onclick="send({t:'reset'})">${uic('nuevo')}Nueva partida</button><button class="ui-btn sec" onclick="leave()">${uic('salir')}Salir</button>`;
  if(!winHide)o+=`<div id="md3win" class="ui ui-card gj-win" role="dialog" aria-labelledby="md3wt"><div class="ui-hd"><h2 class="ui-h" id="md3wt">Fin de la partida</h2><button class="ui-x" onclick="md3Win()" aria-label="Cerrar">${uic('x')}</button></div>
   <div class="ui-bd"><div class="u3wn">${w>=0?(w==i?'¡Ganaste!':`Ganó <b>${nm(w)}</b>`):'Fin'}</div>
   <div class="u3res">${G.players.map((p,k)=>`<div class="${k==w?'w':''}">${chip(k)}<span>${esc(p.name)}${k==i?' (tú)':''}</span><b>${P[k].out?'expulsado':`<i data-cnt="${mdSets(k)}">${mdSets(k)}</i>`+(mdSets(k)==1?' set':' sets')+` · $<i data-cnt="${mdBank(k)}">${mdBank(k)}</i>M`}</b></div>`).join('')}</div></div></div>`}
 else if(i<0)b=`<span class="gj-note">${mirTxt()}</span>${V.watch?`<button class="ui-btn sec" onclick="leave()">${uic('salir')}Dejar de mirar</button>`:''}`;
 else{if(pl)b+=`<button class="ui-btn go" onclick="mdSel=null;send({t:'end'})">${h.length>7?'Terminar (descartar '+(h.length-7)+')':'Terminar turno'}</button>`;
  if(dis){MD3A.dzVale();const k=MD3A.dz.size,n=h.length-7;b+=k?`<button class="ui-btn go md3dz" onclick="MD3A.dzManda()">${uic('x')}Descartar<i class="md3n" aria-label="${k} de ${n}">${k}/${n}</i></button>`:`<span class="ui-btn md3dz" role="status" aria-label="Toca las cartas que vas a descartar">Sobran<i class="md3n">${n}</i></span>`}
  b+=`<button class="ui-btn sec" onclick="cyc()" title="Ordenar">${uic('ordenar')}${manual?'Mi orden':sortS?'Por valor':'Por tipo'}</button>`;
  b+=`<button class="ui-btn sec md3mine" onclick="md3Look(${i})" title="Ver mi mesa de cerca" aria-label="Mi mesa">${uic('ojo')}<span>Mi mesa</span></button>`}
 o+=GHUD.bar(b);
 if(menu){const rg=String(G0.rules).replace(/^\s*<details>\s*<summary>[^<]*<\/summary>/,'').replace(/<\/details>\s*$/,'');
  const aj=GHUD.ajustes(GHUD.row('','Vista',UI.dim(1,'md3Toggle()')),`${V.host?`<button class="ui-btn sec full" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">${uic('x')}Cerrar sala</button>`:''}<button class="ui-btn sec full" onclick="leave()">${uic('salir')}${V.watch?'Dejar de mirar':'Salir de la sala'}</button>`);
  o+=GHUD.sheet('Monopoly Deal',[['aj','Ajustes',aj],['pl','Jugadores',plist()],['lg','Historial',logv()||'<p class="ui-sub gj-empty">Nada todavía.</p>'],['rg','Reglas',`<div class="gj-rt">${rg}</div>`]],'md3Menu()')}
 return o}
function labels(){if(!L||!mesa)return;const bot=id=>{const e=document.getElementById(id),r=e&&e.getBoundingClientRect();return r&&r.height?r.bottom:0},y0=Math.max(bot('gjTop'),bot('gjHint'),bot('md3pa'))+2;
 document.querySelectorAll('#app .md3seat').forEach(el=>{const k=+el.dataset.seat,pa=window.MPJ&&MPJ.on&&MPJ.arriba(rel(k)),[x,y]=toPx(pa||seatP(k,1).setY(.3)),hw=el.offsetWidth/2+4,h2=el.offsetHeight/2+4;
  const X2=Math.max(hw,Math.min(W-hw,x)),Y=GHUD.dodge(X2,Math.max(h2+y0,Math.min(H-h2-(L.bar||60),pa?y-h2+6:y)),hw,h2,y0);el.style.transform=`translate(${X2}px,${Y}px) translate(-50%,-50%)`});
 const el=document.getElementById('md3pdk');if(el&&L.deck){const [x,y]=toPx(v3(L.deck.x,0,L.deck.z+CH*L.ps/2+.1));el.style.transform=`translate(${x}px,${y}px) translate(-50%,0)`}}
function viewBtn(){const el=document.getElementById('gjView');if(!el)return;const k=viewed()?String(VT.who):'';if(el.dataset.k===k)return;el.dataset.k=k;
 el.style.display=k?'':'none';const p=VT.who>=0&&V.G.players[VT.who];el.title=el.ariaLabel=p?'Viendo a '+p.name+' · Cuadrar (Esc)':'Cuadrar (Esc)';
 document.querySelectorAll('#app .md3seat').forEach(s=>s.classList.toggle('look',+s.dataset.seat===VT.who))}

// ---------- engancharse a la vista de siempre ----------
const lig=()=>{try{return localStorage.getItem('casa_3d')==='0'||window.CALIDAD==='ligero'}catch(e){return false}};let sala0=null;   // en Ligero (menú 2D) cada sala nueva empieza en 2D
function sala(k){const c=typeof V!='undefined'&&V&&V.code;if(!c||c===sala0)return;sala0=c;if(lig())on=false;else try{on=localStorage.getItem(k)!=='0'}catch(e){}}
function active(){sala('md_3d');return on&&typeof S!='undefined'&&!!S&&typeof V!='undefined'&&!!V&&V.game==='monopolydeal'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final')}
function loop3(now){requestAnimationFrame(loop3);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('md3on',a);
 if(!a){first=true;home();VW.x=VW.z=0;VW.k=1;return}
 if(shR&&cv.parentNode!==root&&!(document.documentElement.classList.contains('h3on')||document.documentElement.classList.contains('sala3d'))){root.prepend(cv);W=0}
 if(!L||!mesa||innerWidth!==W||innerHeight!==H){layout();sync()}
 viewStep(dt);vivo(now,dt);step(now);if(window.MFX)MFX.paso(now);avStep(now);pulse(now);labels();viewBtn();
 const fs=window.FONDO?FONDO.pinta(R,CA,'monopolydeal',{r:mesa.R,rt:2.6*mesa.R/(MESA.radio(4)+MESA.ORL)}):0;if(fs!==fz){fz=fs;casaModo()}
 if(!fs)R.clear();CA.layers.set(0);R.render(SC,CA);R.clearDepth();CA.layers.set(1);R.render(SC,CA);CA.layers.set(0)}
function casaModo(){const v=!fz;if(L.roomG)L.roomG.visible=v;L.baseM.visible=v;mesa.escala((fz||MESA.CASA_S)*((window.FONDO&&FONDO.MII)||1));mesa.sillas[0].visible=true;if(V&&V.G)sync()}   // personajes del tamaño de la casa, con o sin la casa de fondo (como Uno)
function toggle(){on=!on;menu=false;try{localStorage.setItem('md_3d',on?'1':'0')}catch(e){}render()}
G0.body=function(){
 if(!active()){const G=typeof V!='undefined'&&V&&V.G,h=orig.apply(this,arguments);return (G&&(G.phase=='play'||G.phase=='final')&&!/class="m2d /.test(h)?UI.dim(0,'md3Toggle()','md3tog'):'')+h}
 orig.apply(this,arguments);   // la vista 2D pone en orden su estado (carta elegida, pagos, rival elegido); su HTML no se usa
 GHUD.save();
 try{init();return hud()}catch(e){console.warn('Monopoly Deal 3D:',e);on=false;return orig.apply(this,arguments)}};
G0.after=function(){if(origAfter)origAfter.apply(this,arguments);if(!active())return;
 document.documentElement.classList.remove('mdui');GHUD.restore();
 try{const bb=$('#gjBar .gj-bb');if(!L||!L.top||(bb&&Math.abs(bb.getBoundingClientRect().top-L.barTop)>2))layout();sync();labels()}catch(e){console.warn('Monopoly Deal 3D:',e)}};
window.md3Toggle=toggle;
window.md3Menu=()=>{menu=!menu;sfx('tick');render()};
window.md3Seat=k=>{const G=V.G;if(mdTg&&G.turn==V.me)return mdTap(k);look(k)};
window.md3Look=look;
window.md3Home=home;window.md3Arriba=()=>{if(mc)mc.arriba(!VT.top)};
window.md3Win=()=>{winHide=true;sfx('tick');render()};
window.MD3={sync:()=>sync(),look,get L(){return L}};
})();
