// Continental 3D: la partida en la mesa redonda (c_mesa3d.js) con los personajes (c_mesa_pj.js), la cámara viva (c_mesa_cam.js) y sus detalles
// (c_mesa_fx.js). NO cambia reglas ni servidor. Sin la casa (FONDO) se ve el cuarto viejo con el Conecta 4 y el Backgammon escondidos.
// Se carga DESPUES de c_continental.js y envuelve GM.continental.body/after. Usa las mismas acciones que la vista 2D
// (draw, pegar, discard, armar, bajar...). Lobby, fin de ronda y final se ven como siempre.
(function(){
if(typeof THREE==='undefined'||typeof GM==='undefined'||!GM.continental){console.warn('Continental 3D: falta Three.js o GM.continental');return}
const orig=GM.continental.body,origAfter=GM.continental.after;
let on=true;try{on=localStorage.getItem('cont_3d')!=='0'}catch(e){}
let R,SC,CA,root,cv,ready=false,W=0,H=0,L=null,tableKey='',tbl=null,mesa=null;
let menu=false,msgK='',msgT=0,dealN=-1,logN=-1,first=true,dealing=false,dl=0,hov=null,st=null,drag=null,wasDown=null,bajando=0;
const slots=new Map();                   // siluetas del contrato en tu lado de la mesa
const meshes=new Map(),texC={},glows=new Map(),hits=[];
const CW=1,CH=1.4,CT=.012,D=3;          // carta base (unidades del mundo) y distancia de tu mano a la cámara
const TW=256,TH=358;                     // tamaño de las texturas de carta
const ray=new THREE.Raycaster();ray.layers.enableAll();   // capa 1 = tu mano (se dibuja encima de todo)
const P2=new THREE.Vector2(),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),Qe=(x,y,z)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
const FD=Qe(0,0,Math.PI),FU=Qe(0,0,0);   // boca abajo / boca arriba sobre la mesa
const $=s=>document.querySelector(s);
// cámara libre: VT = adónde va, VW = dónde está (x,z = punto de la mesa que queda al centro, k = zoom, a = giro, t = inclinación). who = jugador que estás mirando
const VW={x:0,z:0,k:1,a:0,t:0},VT={x:0,z:0,k:1,a:0,t:0,who:-1},KMAX=4,PL=new THREE.Plane(new THREE.Vector3(0,1,0),0),tch=new Map();
let pin=null,myTc=null,lastNow=0,peekEl=null,peekId=null,dpvEl=null,ap=null,mc=null,hdNow=0;   // mc: cámara viva (c_mesa_cam.js); hdNow: giro de cabeza hacia el turno
let c4found=false,mini=false,c4open=false,c4was=false,c4snap='';   // c4: ventana de Conecta 4 abierta, última ficha animada, estado anterior (para sonidos)
   // barra de arriba oculta (modo minimalista)
try{mini=localStorage.getItem('cont_mini')=='1'}catch(e){}
const touchy=matchMedia('(pointer:coarse)').matches,lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
c4found=lsGet('cont_c4f')=='1';   // ¿ya descubriste el Conecta 4 en este dispositivo?
// menús en modo oscuro: si nunca lo has elegido, sigue al sistema
let dark=lsGet('cont_dark')!=null?lsGet('cont_dark')=='1':matchMedia('(prefers-color-scheme:dark)').matches;
const setDark=d=>{dark=d;if(window.UI)UI.setTema(d?'noche':'dia');try{localStorage.setItem('cont_dark',d?'1':'0')}catch(e){}};


// ---------- texturas (dibujadas en canvas) ----------
function cnv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function tx(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=R?Math.min(8,R.capabilities.getMaxAnisotropy()):4;return t}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function backTex(st=sback){const k='b'+st;if(texC[k])return texC[k];
 const c=cnv(TW,TH),g=c.getContext('2d'),col={red:['#c0302f','#7a1316'],blue:['#3a7be0','#163c85'],green:['#2f9e5a','#0f4d2a'],gold:['#e6bd45','#8f6a0c'],black:['#3b3b42','#0b0b0e'],neon:['#00c8e6','#7a00cc']}[st]||['#c0302f','#7a1316'],ln=st=='black'?'230,197,90':'255,255,255';
 g.fillStyle='#fff';rr(g,0,0,TW,TH,20);g.fill();g.save();rr(g,12,12,TW-24,TH-24,12);g.clip();
 const gr=g.createLinearGradient(0,0,TW,TH);gr.addColorStop(0,col[0]);gr.addColorStop(1,col[1]);g.fillStyle=gr;g.fillRect(0,0,TW,TH);
 g.strokeStyle=`rgba(${ln},.2)`;g.lineWidth=2;for(let i=-TH;i<TW+TH;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i+TH,TH);g.stroke();g.beginPath();g.moveTo(i,TH);g.lineTo(i+TH,0);g.stroke()}
 const sh=g.createLinearGradient(0,0,0,TH);sh.addColorStop(0,'rgba(255,255,255,.38)');sh.addColorStop(.46,'rgba(255,255,255,.08)');sh.addColorStop(.5,'rgba(255,255,255,0)');g.fillStyle=sh;g.fillRect(0,0,TW,TH);
 g.restore();g.strokeStyle=`rgba(${ln},.85)`;g.lineWidth=3;rr(g,22,22,TW-44,TH-44,8);g.stroke();
 g.fillStyle=`rgba(${ln},.9)`;g.font='bold 80px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('♠',TW/2,TH/2+4);
 return texC[k]=tx(c)}
function faceTex(id,st=scards){const k='f'+id+st;if(texC[k])return texC[k];
 const c0=C(id),c=cnv(TW,TH),g=c.getContext('2d'),dark=st=='black',retro=st=='retro',big=st=='big',red=!c0.j&&(c0.s==1||c0.s==2);
 const ink=c0.j?(dark?'#ffd54a':'#6a1b9a'):st=='contrast'?['#111','#d50000','#0050d0','#007a2a'][c0.s]:red?(dark?'#ff6060':'#c62828'):(dark?'#f2f2f2':'#151515');
 const bg=g.createLinearGradient(0,0,TW,TH);
 if(dark){bg.addColorStop(0,'#2e2e2e');bg.addColorStop(1,'#121212')}else if(retro){bg.addColorStop(0,'#f7edd3');bg.addColorStop(1,'#e0cfa3')}else{bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#e9edf2')}
 g.fillStyle=bg;rr(g,0,0,TW,TH,20);g.fill();g.strokeStyle=dark?'#555':'#9aa3ad';g.lineWidth=3;rr(g,1.5,1.5,TW-3,TH-3,19);g.stroke();
 const F=retro?'Georgia,"Times New Roman",serif':'"Segoe UI",Arial,sans-serif';g.fillStyle=ink;g.textAlign='center';g.textBaseline='middle';
 const r=c0.j?'★':RN[c0.r-1],s=c0.j?'':SU[c0.s];
 const corner=()=>{const x=big?46:36;g.font=`${big?800:700} ${big?(r.length>1?60:76):(r.length>1?44:54)}px ${F}`;g.fillText(r,x,big?50:40);if(s){g.font=`${big?64:46}px ${F}`;g.fillText(s,x,big?118:90)}};
 corner();g.save();g.translate(TW,TH);g.rotate(Math.PI);corner();g.restore();
 if(c0.j){g.font='118px serif';g.fillText('🃏',TW/2,TH/2-6);g.font=`800 28px ${F}`;g.fillText('COMODÍN',TW/2,TH/2+92)}
 else if(big){if(c0.r>=11){g.font=`800 96px ${F}`;g.fillText(r,TW/2+18,TH/2-6)}g.font=`${c0.r>=11?70:120}px ${F}`;g.fillText(s,TW/2+18,c0.r>=11?TH/2+80:TH/2+20)}
 else if(c0.r>=11){g.strokeStyle=ink;g.lineWidth=3;rr(g,62,72,TW-124,TH-144,10);g.stroke();g.globalAlpha=.1;g.fill();g.globalAlpha=1;
  g.font=`700 104px ${F}`;g.fillText(r,TW/2,TH/2-18);g.font=`60px ${F}`;g.fillText(s,TW/2,TH/2+66)}
 else{g.font=`${c0.r==1?170:136}px ${F}`;g.fillText(s,TW/2,TH/2+8)}
 return texC[k]=tx(c)}
function glowTex(){if(texC.glow)return texC.glow;const c=cnv(256,256),g=c.getContext('2d');g.shadowColor='#fff';g.shadowBlur=34;g.fillStyle='#fff';rr(g,52,52,152,152,16);g.fill();g.fill();return texC.glow=tx(c)}
const GI=152/256;
function ghostTex(){if(texC.ghost)return texC.ghost;const c=cnv(512,320),g=c.getContext('2d');g.fillStyle='rgba(255,255,255,.13)';rr(g,10,10,492,300,28);g.fill();
 g.setLineDash([26,16]);g.lineWidth=9;g.strokeStyle='#fff';rr(g,10,10,492,300,28);g.stroke();return texC.ghost=tx(c)}                         // parte "sólida" de la textura de brillo
// colores del fieltro (centro, orilla) según el estilo; el verde es el del Continental (#1F6B4A)
const FELT={green:['#2a8a5e','#14492f'],red:['#c04a52','#64181e'],blue:['#4489cf','#163f70'],orange:['#dd9240','#7e450f'],purple:['#8a5cc4','#331757'],graphite:['#636b75','#202429']};
function feltTex(st=sbg){const k='felt'+st;if(texC[k])return texC[k];
 const c=cnv(512,512),g=c.getContext('2d'),b=FELT[st]||FELT.green;
 const gr=g.createRadialGradient(256,256,10,256,256,256);gr.addColorStop(0,b[0]);gr.addColorStop(1,b[1]);g.fillStyle=gr;g.fillRect(0,0,512,512);
 const im=g.getImageData(0,0,512,512),d=im.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*16;d[i]+=n;d[i+1]+=n;d[i+2]+=n}g.putImageData(im,0,0);
 return texC[k]=tx(c)}

// ---------- cartas 3D ----------
let GEO=null;
function mkCard(id){GEO=GEO||new THREE.BoxGeometry(CW,CT,CH);const ed=new THREE.MeshStandardMaterial({color:0xe9e6dc,roughness:.6});
 const top=new THREE.MeshStandardMaterial({map:id==null?backTex():faceTex(id),roughness:.75,alphaTest:.5});
 const bot=new THREE.MeshStandardMaterial({map:backTex(),roughness:.6,alphaTest:.5});
 const m=new THREE.Mesh(GEO,[ed,ed,top,bot,ed,ed]);m.castShadow=true;m.receiveShadow=true;m.userData={id};return m}
function setFace(m,id){const t=id==null?backTex():faceTex(id),b=backTex();m.userData.id=id;
 if(m.material[2].map!==t){m.material[2].map=t;m.material[2].needsUpdate=true}if(m.material[3].map!==b){m.material[3].map=b;m.material[3].needsUpdate=true}}
function drop(key){const m=meshes.get(key);if(!m)return;m.parent&&m.parent.remove(m);m.material.forEach(x=>x.dispose());if(m.userData.sg){m.userData.sg.geometry.dispose();m.userData.sg.material.dispose()}meshes.delete(key)}
// Destino de una carta: padre (mesa o cámara), posición, giro y escala. Si cambia, se mueve suave desde donde está.
function target(m,par,pos,q,s,o={}){const T=m.userData.T;
 if(T&&T.par===par&&T.pos.distanceToSquared(pos)<1e-8&&T.q.angleTo(q)<1e-4&&Math.abs(T.s-s)<1e-6)return;
 m.userData.T={par,pos:pos.clone(),q:q.clone(),s};if(m.parent!==par)par.attach(m);
 const ly=par===CA?1:0;if(m.userData.ly!==ly){m.userData.ly=ly;m.traverse(o=>o.layers.set(ly));m.material.forEach(x=>x.depthTest=!ly);if(!ly)m.renderOrder=0}   // en tu mano: sin prueba de profundidad, en orden (renderOrder)
 const ms=RM||(first&&!dealing)?0:(o.ms==null?430:o.ms);
 if(!ms){m.position.copy(pos);m.quaternion.copy(q);m.scale.setScalar(s);m.userData.tw=null;return}
 m.userData.tw={p0:m.position.clone(),q0:m.quaternion.clone(),s0:m.scale.x,t0:performance.now()+(o.delay||0),ms,arc:o.arc==null?(par===SC?.7:.12):o.arc,puff:o.puff}}
function step(now){meshes.forEach((m,key)=>{const w=m.userData.tw,T=m.userData.T;if(!w||(drag&&drag.m===m))return;let k=(now-w.t0)/w.ms;if(k<0)return;if(k>1)k=1;
 const e=1-Math.pow(1-k,3),a=Math.sin(Math.PI*k)*w.arc;m.position.lerpVectors(w.p0,T.pos,e);if(T.par===SC)m.position.y+=a;else m.position.z+=a;
 m.quaternion.slerpQuaternions(w.q0,T.q,e);m.scale.setScalar(w.s0+(T.s-w.s0)*e);
 if(k===1){m.userData.tw=null;if(m.userData.kill)drop(key);else if(w.puff&&T.par===SC)cae(m.position)}})}
// una carta cae en la mesa (descarte o bajada): polvo de fieltro (c_mesa_fx.js) y su golpecito, sin amontonar sonidos
let caeT=0;function cae(p){if(window.MFX)MFX.polvo(SC,p,L.ps);const t=performance.now();if(t-caeT>90){caeT=t;sfx('place')}}
// brillos (mazo, descarte, combinaciones, turno). Son planos con textura suave; también sirven para tocar.
function glow(key,pos,w,h,col,lvl,hit,ry){let g=glows.get(key);
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.renderOrder=1;SC.add(g);glows.set(key,g)}
 g.visible=true;g.position.copy(pos);g.rotation.z=ry||0;g.scale.set(w/GI,h/GI,1);g.material.color.set(col);g.userData.lvl=lvl;g.userData.hit=hit||null;g.userData.used=1;if(hit)hits.push(g);return g}
function pulse(now){const p=.65+.35*Math.sin(now/260);glows.forEach(g=>{const fl=g.userData.fl?Math.max(0,1-(now-g.userData.fl)/800):0;g.material.opacity=Math.max(g.userData.lvl*(g.userData.lvl>.5?p:1),fl)})   // fl: destello (pegaron en esa combinación)
 slots.forEach(m=>{const b=m.userData;if(!m.visible)return;const k=(Date.now()-(b.badT||0))/550;m.position.x=b.bx+(k<1?Math.sin(k*40)*.09*(1-k):0);
  m.material.color.set(k<1?0xff5a4a:b.hot?0x9fe8ff:b.col);m.material.opacity=b.hot?1:b.ok?.95:b.fit?.75+.25*Math.sin(now/170):.55+.25*Math.sin(now/380)})}   // >.5 = parpadea

// ---------- escena y mesa ----------
// shR: dibuja con el WebGL de la casa · fz: escala de la casa de fondo (0: con su propio cuarto); c_casa_fondo.js
let shR=false,fz=0;
function init(){if(ready)return;ready=true;
 shR=!!(window.FONDO&&FONDO.R('continental'));R=shR?FONDO.R():new THREE.WebGLRenderer({antialias:true,alpha:true});if(!shR){R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap}
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,200);SC.add(CA);
 const hl=new THREE.HemisphereLight(0xffffff,0x24402e,1.7);SC.add(hl);
 const Ld=new THREE.DirectionalLight(0xfff2da,2.6);Ld.position.set(-5,14,7);Ld.castShadow=true;Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0004;
 Object.assign(Ld.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:60});SC.add(Ld);
 const fill=new THREE.DirectionalLight(0xbfdcff,.6);fill.position.set(6,6,-4);SC.add(fill);
 const pt=new THREE.PointLight(0xffffff,1.6,0,1.4);pt.position.set(0,1.2,1);CA.add(pt);   // luz suave para tu mano
 [hl,Ld,fill,pt].forEach(l=>l.layers.enableAll());R.autoClear=false;
 root=document.createElement('div');root.id='c3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 peekEl=document.createElement('div');peekEl.id='t3peek';peekEl.className='ui ui-card';peekEl.innerHTML='<img alt=""><div class="nm"></div>';document.body.appendChild(peekEl);
 dpvEl=document.createElement('div');dpvEl.id='t3dpv';dpvEl.className='ui ui-card';dpvEl.innerHTML='<small>Descarte</small><img alt=""><div class="nm"></div>';document.body.appendChild(dpvEl);
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pCancel);
 cv.addEventListener('pointerleave',()=>{if(!st)peek(false);if(!st&&hov!=null){hov=null;sync()}});cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();if(mc)mc.toca();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0015))},{passive:false});
 addEventListener('keydown',e=>{if(!active()||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;
  if(ap){if(e.key==='Escape')apClose(0);else if(e.key==='Enter')apClose(1);return}
  if(e.key==='Escape'){if(menu){menu=false;render()}else home();return}
  if(e.key===' '||e.key==='Home'){if(viewed()){e.preventDefault();home()}return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const c={q:'rl',e:'rr',r:'tu',f:'td',w:'up',arrowup:'up',s:'dn',arrowdown:'dn',a:'lf',arrowleft:'lf',d:'rt',arrowright:'rt','+':'zi','=':'zi','-':'zo'}[e.key.toLowerCase()];
  if(c){e.preventDefault();if(mc)mc.toca();camStep(c)}});
 mc=window.MCAM?MCAM.crea({vt:VT,home,snap,viewed,el:()=>L?L.el:1}):null;
 requestAnimationFrame(loop3)}
function buildTable(por){if(window.MPJ)MPJ.suelta();if(tbl){SC.remove(tbl);tbl.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 // la mesa redonda (c_mesa3d.js): crece con los jugadores y es la misma en vertical y horizontal (la cámara se aleja para que quepa)
 const ps=por?1.25:1.05;tbl=new THREE.Group();SC.add(tbl);mesa=MESA.arma(tbl,{n:V&&V.G?V.G.players.length:4,col:FELT[sbg]||FELT.green,logo:'Continental',sep:CW*ps*1.7,hueco:[CW*ps*1.35+.2,CH*ps/2+.4]});
 const r=mesa.r;L=Object.assign(L||{},{por,rx:r,rz:r,ps});
 // mazo y descarte al centro; las bajadas de cada quien en su zona, frente a su silla (L.zona(asiento)); en la tuya, mientras no te bajes, las siluetas de tu contrato
 L.deck=mesa.centro.mazo.clone();L.disc=mesa.centro.descarte.clone();L.zona=i=>mesa.asiento(i).zona;L.band=L.zona(0);
 const room=buildRoom(por,r,r);tbl.add(room);L.room=room.userData.room;L.roomG=room;L.baseM=mesa.pie;
 buildC4(por,r,r,room.userData.c4);buildBG(room.userData.bg)}
// ---------- el cuarto: piso, paredes y muebles alrededor de la mesa (el Conecta 4 está en una esquina del fondo) ----------
function ctex(key,w,h,draw){if(texC[key])return texC[key];const c=cnv(w,h);draw(c.getContext('2d'),w,h);const t=tx(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return texC[key]=t}
function buildRoom(por,rx,rz){const R=new THREE.Group(),FY=-1.55,X=rx+7.5,ZB=-(rz+7.5),ZF=rz+7,WH=10;R.userData.room={X,ZB,ZF,FY};
 const std=(c,r,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r==null?.7:r},o||{}));
 const B=(w,h,d,mat,x,y,z,par)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(par||R).add(m);return m};
 const C=(rt,rb,h,mat,x,y,z,par,n)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n||20),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(par||R).add(m);return m};
 const rnd=(i=>()=>(i=(i*9301+49297)%233280)/233280)(7);   // mismo cuarto siempre
 // piso de duela
 const fl=ctex('floor',512,512,(g,w,h)=>{for(let i=0;i<8;i++){const y=i*64;g.fillStyle=['#6b4a2e','#5e4027','#74512f','#654529'][i%4];g.fillRect(0,y,w,64);
  g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,y,w,2);const o=(i*173)%w;g.fillRect(o,y,2,64);g.fillRect((o+256)%w,y,2,64);
  for(let k=0;k<50;k++){g.fillStyle=k%2?'rgba(0,0,0,.06)':'rgba(255,220,170,.05)';g.fillRect((k*97+i*31)%w,y+(k*13)%60,40+(k*37)%120,1)}}});
 const fm=std(0xffffff,.75,{map:fl.clone()});fm.map.needsUpdate=true;fm.map.repeat.set(X/3,(ZF-ZB)/6);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(2*X,ZF-ZB),fm);floor.rotation.x=-Math.PI/2;floor.position.set(0,FY,(ZF+ZB)/2);floor.receiveShadow=true;R.add(floor);
 // tapete debajo de la mesa
 const rug=ctex('rug',512,512,(g,w,h)=>{g.fillStyle='#5a1a1e';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=10;g.beginPath();g.ellipse(256,256,236,236,0,0,7);g.stroke();
  g.lineWidth=4;g.beginPath();g.ellipse(256,256,205,205,0,0,7);g.stroke();g.strokeStyle='rgba(201,162,74,.35)';g.lineWidth=2;for(let i=0;i<16;i++){g.beginPath();g.ellipse(256,256,190-i*11,190-i*11,0,0,7);g.stroke()}});
 const rg=new THREE.Mesh(new THREE.CircleGeometry(1,64),std(0xffffff,.95,{map:rug}));rg.rotation.x=-Math.PI/2;rg.scale.set(rx+3.2,rz+3.2,1);rg.position.y=FY+.01;rg.receiveShadow=true;R.add(rg);
 // paredes tapizadas con lambrín de madera
 const wp=ctex('wall',256,256,(g,w,h)=>{g.fillStyle='#6d5a48';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=32){g.fillStyle='rgba(255,235,200,.06)';g.fillRect(x,0,14,h)}
  g.fillStyle='rgba(255,235,200,.08)';for(let y=16;y<h;y+=64)for(let x=16;x<w;x+=64){g.beginPath();g.arc(x+(y%128?32:0),y,5,0,7);g.fill()}});
 const wall=(w,x,z,ry)=>{const m=std(0xffffff,.9,{map:wp.clone()});m.map.needsUpdate=true;m.map.repeat.set(w/3,WH/3);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,WH),m);pl.position.set(x,FY+WH/2,z);pl.rotation.y=ry;pl.receiveShadow=true;R.add(pl);
  const wa=new THREE.Mesh(new THREE.PlaneGeometry(w,2.4),std(0x3e2a1c,.55));wa.position.set(x,FY+1.2,z);wa.rotation.y=ry;wa.translateZ(.03);wa.receiveShadow=true;R.add(wa);
  const tr=new THREE.Mesh(new THREE.PlaneGeometry(w,.14),std(0x2e1f14,.5));tr.position.set(x,FY+2.45,z);tr.rotation.y=ry;tr.translateZ(.05);R.add(tr)};
 // cuarto completo: 4 paredes y techo (todo se ve solo por dentro, así la cámara puede estar afuera sin que estorben)
 wall(2*X,0,ZB,0);wall(ZF-ZB,-X,(ZF+ZB)/2,Math.PI/2);wall(ZF-ZB,X,(ZF+ZB)/2,-Math.PI/2);wall(2*X,0,ZF,Math.PI);
 const ceil=new THREE.Mesh(new THREE.PlaneGeometry(2*X,ZF-ZB),std(0xe9e1d0,.95));ceil.rotation.x=Math.PI/2;ceil.position.set(0,FY+WH,(ZF+ZB)/2);R.add(ceil);
 const cl=new THREE.Mesh(new THREE.CircleGeometry(1.1,32),new THREE.MeshBasicMaterial({color:0xfff1cc}));cl.rotation.x=Math.PI/2;cl.position.set(0,FY+WH-.02,0);R.add(cl);
 const cll=new THREE.PointLight(0xfff0d6,45,0,1.5);cll.position.set(0,FY+WH-1.2,0);R.add(cll);   // luz de techo: ilumina las 4 paredes
 // puerta en la pared de enfrente (detrás de ti)
 const dr=new THREE.Mesh(new THREE.PlaneGeometry(2.6,5.4),std(0x5a3a22,.5));dr.rotation.y=Math.PI;dr.position.set(X*.55,FY+2.7,ZF-.04);R.add(dr);
 const kn=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),std(0xc9a24a,.3));kn.position.set(X*.55-1,FY+2.6,ZF-.12);R.add(kn);
 // ventana de noche en la pared del fondo
 const sky=ctex('sky',256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0a1230');gr.addColorStop(1,'#26407a');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#fff';for(let i=0;i<60;i++){g.globalAlpha=.3+(i%5)*.14;g.fillRect((i*71)%w,(i*37)%(h*.7),2,2)}g.globalAlpha=1;g.fillStyle='#f4f1d0';g.beginPath();g.arc(190,60,18,0,7);g.fill()});
 const wx=X*.3,wy=FY+5.6,win=new THREE.Mesh(new THREE.PlaneGeometry(4,3),new THREE.MeshBasicMaterial({map:sky}));win.position.set(wx,wy,ZB+.06);R.add(win);
 const fr=std(0xe9e2d0,.5);B(4.3,.18,.3,fr,wx,wy+1.55,ZB+.12);B(4.3,.25,.45,fr,wx,wy-1.55,ZB+.2);B(.18,3.2,.3,fr,wx-2.08,wy,ZB+.12);B(.18,3.2,.3,fr,wx+2.08,wy,ZB+.12);B(.1,3,.2,fr,wx,wy,ZB+.1);B(4,.1,.2,fr,wx,wy,ZB+.1);
 // sofá contra la pared del fondo
 const sofa=std(0x2f4a5a,.85),sx=-X*.35,sz=ZB+1.3;B(5.4,.9,2,sofa,sx,FY+.75,sz);B(5.4,1.7,.55,sofa,sx,FY+1.6,sz-.75);[-1,1].forEach(s=>B(.55,1.4,2,sofa,sx+s*2.7,FY+1.1,sz));
 [-1.3,1.3].forEach(dx=>{B(2.5,.35,1.6,std(0x37566a,.9),sx+dx,FY+1.35,sz+.15);B(1.1,.9,.3,std(0xc9a24a,.8),sx+dx*1.2,FY+1.9,sz-.35).rotation.z=dx*.08});
 // mesita a tus espaldas (junto a la pared de enfrente): ahí está el Backgammon, con dos puf
 const ct=std(0x4a2c18,.5),tx=-X*.35,tz=ZF-2.6;B(4,.14,2.9,ct,tx,FY+1.02,tz);[[-1.8,-1.25],[1.8,-1.25],[-1.8,1.25],[1.8,1.25]].forEach(([a,b])=>B(.14,.95,.14,ct,tx+a,FY+.48,tz+b));
 [-1,1].forEach(s=>{C(.75,.8,.9,std(0x7a2a2a,.85),tx+s*2.9,FY+.45,tz,null,24)});
 R.userData.bg=v3(tx,FY+1.09,tz);
 // librero en la pared izquierda, cerca del fondo
 const bw=std(0x4a2c18,.6),bz=ZB+3.6,bx=-X+.55;B(.9,7,.12,bw,bx,FY+3.5,bz-1.6);B(.9,7,.12,bw,bx,FY+3.5,bz+1.6);B(.1,7,3.3,bw,bx-.42,FY+3.5,bz);
 const BC=[0x8b1e1e,0x1e4f8b,0x2e6b3a,0xc9a24a,0x5a2a6b,0x2b2b2b,0xa85a1e,0xe0d6c0];
 for(let sh=0;sh<6;sh++){const y=FY+.1+sh*1.38;B(.9,.1,3.3,bw,bx,y,bz);if(sh==5)break;let z=bz-1.5;while(z<bz+1.4){const t=.12+rnd()*.14,hh=.75+rnd()*.45;
   const bk=B(.62,hh,t,std(BC[(rnd()*BC.length)|0],.7),bx+.05,y+.06+hh/2,z+t/2);if(rnd()<.12)bk.rotation.x=.2;z+=t+.02}}
 // escritorio con computadora (fondo de pantalla tipo Windows 7), lámpara y silla, en la pared izquierda
 const dz=por?2:-.5,dx=-X+1.3,dk=std(0x5a3a22,.55);B(2.2,.14,4.6,dk,dx,FY+1.55,dz);[[-.95,-2.1],[.95,-2.1],[-.95,2.1],[.95,2.1]].forEach(([a,b])=>B(.12,1.5,.12,dk,dx+a,FY+.75,dz+b));
 const scr=ctex('w7wall',256,160,(g,w,h)=>{const gr=g.createRadialGradient(w*.55,h*.45,10,w*.5,h*.5,w*.7);gr.addColorStop(0,'#3fa4e8');gr.addColorStop(.6,'#155a9c');gr.addColorStop(1,'#0a2a5a');g.fillStyle=gr;g.fillRect(0,0,w,h);
  [['#f25022',-1,-1],['#7fba00',1,-1],['#00a4ef',-1,1],['#ffb900',1,1]].forEach(([c,a,b])=>{g.fillStyle=c;g.beginPath();g.ellipse(w*.5+a*15,h*.45+b*13,13,11,a*b*.2,0,7);g.fill()});
  g.fillStyle='rgba(20,40,70,.85)';g.fillRect(0,h-14,w,14);g.fillStyle='#4aa0e0';g.beginPath();g.arc(10,h-7,6,0,7);g.fill()});
 const mon=new THREE.Group();mon.position.set(dx-.35,FY+1.62,dz);mon.rotation.y=Math.PI/2;R.add(mon);const blk=std(0x1b1b1f,.35);
 B(2.3,1.45,.12,blk,0,1.05,0,mon);const sm=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.28),new THREE.MeshBasicMaterial({map:scr}));sm.position.set(0,1.05,.07);mon.add(sm);
 B(.15,.5,.15,blk,0,.3,-.05,mon);B(.8,.05,.5,blk,0,.04,-.05,mon);B(1.6,.05,.5,std(0x2a2a2e,.5),0,.04,.8,mon);
 const lmp=std(0x2a2a2e,.4);C(.2,.25,.06,lmp,dx-.5,FY+1.65,dz+1.7);const arm=C(.03,.03,1.1,lmp,dx-.5,FY+2.2,dz+1.7);arm.rotation.z=.3;
 const sh=C(.12,.3,.3,std(0x2f6b3a,.5),dx-.3,FY+2.7,dz+1.7);sh.rotation.z=.9;
 // cuadros en la pared derecha
 const art=(key,draw,z,y,w,h)=>{const t=ctex(key,256,192,draw);const gq=new THREE.Group();gq.position.set(X-.1,y,z);gq.rotation.y=-Math.PI/2;R.add(gq);
  B(w+.25,h+.25,.1,std(0xc9a24a,.4),0,0,0,gq);const pm=new THREE.Mesh(new THREE.PlaneGeometry(w,h),std(0xffffff,.8,{map:t}));pm.position.z=.06;gq.add(pm)};
 art('art1',(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#f7b267');gr.addColorStop(1,'#f4845f');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#2b2d42';g.beginPath();g.moveTo(0,h);g.lineTo(90,80);g.lineTo(160,140);g.lineTo(210,60);g.lineTo(w,h);g.fill();g.fillStyle='#fff3c4';g.beginPath();g.arc(70,50,22,0,7);g.fill()},-1,FY+5,3,2.2);
 art('art2',(g,w,h)=>{g.fillStyle='#1f6b4a';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='bold 120px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('♠',w/2-50,h/2+6);g.fillStyle='#d32f2f';g.fillText('♥',w/2+50,h/2+6)},3.2,FY+4.6,1.8,1.4);
 // planta en la esquina del fondo a la izquierda
 const px=-X+1.2,pz=ZB+1.1;C(.45,.35,.9,std(0xb5643c,.7),px,FY+.45,pz);const lf=std(0x2e7d32,.8);
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2,l=new THREE.Mesh(new THREE.ConeGeometry(.18,1.6,6),lf);l.position.set(px+Math.cos(a)*.25,FY+1.6,pz+Math.sin(a)*.25);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);l.castShadow=true;R.add(l)}
 // esquina del Conecta 4: lámpara de pie (luz cálida y tenue) y dos banquitos
 const cx=X-3,cz=ZB+3;R.userData.c4=v3(cx,0,cz);
 const fpole=std(0x2a2a2e,.4);C(.35,.4,.08,fpole,cx+1.9,FY+.04,cz-1.4);C(.04,.04,4.4,fpole,cx+1.9,FY+2.2,cz-1.4);
 const shade=C(.35,.6,.6,std(0xf3e2b8,.8,{emissive:0xffc477,emissiveIntensity:.6,side:THREE.DoubleSide}),cx+1.9,FY+4.5,cz-1.4,null,24);shade.material.transparent=true;shade.material.opacity=.95;
 const lt=new THREE.PointLight(0xffc477,6,9,1.6);lt.position.set(cx+1.9,FY+4.2,cz-1.4);R.add(lt);
 [-1,1].forEach(s=>{C(.45,.45,.12,std(0x7a2a2a,.8),cx+s*1.5,FY+1.05,cz+1.3);C(.06,.08,1,fpole,cx+s*1.5,FY+.5,cz+1.3)});
 return R}
// ---------- tablero 3D de Conecta 4: en una mesita al fondo de la sala, detrás de la mesa ----------
let C4B=null,DISC=null;const c4d=new Map(),c4cols=[];
function mkC4(par,at,cols){   // el modelo solo (también lo usa la Casa 3D)
 const P=new THREE.Group(),g=new THREE.Group(),blue=new THREE.MeshPhysicalMaterial({color:0x2260d0,roughness:.28,clearcoat:1,clearcoatRoughness:.15});
 // marco con 42 hoyos (se ve a través, como el de verdad)
 const sh=new THREE.Shape();sh.moveTo(-3.7,.2);sh.lineTo(3.7,.2);sh.lineTo(3.7,6.4);sh.lineTo(-3.7,6.4);sh.closePath();
 for(let c=0;c<7;c++)for(let r=0;r<6;r++){const hp=new THREE.Path();hp.absarc(c-3,.7+r,.38,0,Math.PI*2,true);sh.holes.push(hp)}
 const fr=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2,curveSegments:18}),blue);fr.position.z=-.15;fr.castShadow=true;g.add(fr);
 [-3.4,3.4].forEach(x=>{const f=new THREE.Mesh(new THREE.BoxGeometry(.5,.25,1.6),blue);f.position.set(x,.08,0);f.castShadow=true;g.add(f)});
 // columnas para tocar: invisibles, se iluminan cuando puedes tirar ahí
 for(let c=0;c<7;c++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.98,6.2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
  m.position.set(c-3,3.3,.24);m.userData.hit={t:'c4',c};g.add(m);cols.push(m)}
 g.scale.setScalar(.4);P.add(g);   // derecho, a 90°
 // mesita de madera
 const wood=new THREE.MeshStandardMaterial({color:0x5a2f14,roughness:.55}),tp=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.12,40),wood);
 tp.scale.set(2.2,1,1.2);tp.position.y=-.07;tp.receiveShadow=true;tp.castShadow=true;P.add(tp);
 const leg=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,1.4,16),wood);leg.position.y=-.8;P.add(leg);
 const ft=new THREE.Mesh(new THREE.CylinderGeometry(.9,1,.1,32),wood);ft.position.y=-1.5;P.add(ft);
 P.position.copy(at);P.rotation.y=-.5;par.add(P);P.updateMatrixWorld(true);return {P,g,mats:[blue,wood]}}
// colores base para la penumbra: se ilumina cuando la cámara se acerca a jugar
function buildC4(por,rx,rz,at){c4d.clear();c4cols.length=0;const o=mkC4(tbl,at,c4cols);C4B={P:o.P,g:o.g,id:null,lit:.4,mats:o.mats.map(m=>({m,base:m.color.clone()}))};c4light(.4)}
function c4light(v){if(!C4B)return;C4B.lit=v;C4B.mats.forEach(o=>o.m.color.copy(o.base).multiplyScalar(v));c4d.forEach(m=>m.material.color.copy(m.userData.base).multiplyScalar(v))}
// la partida que se muestra: la tuya, o si no juegas, cualquiera que esté en curso
function c4show(){const L4=V.G.c4s||[];return L4.find(x=>x.p.includes(V.me))||L4.find(x=>x.st=='play')||null}
function c4sync(){if(!C4B)return;const g=c4show(),key=g?g.id:0;hits.push(...c4cols);
 const rm=x=>{const m=c4d.get(x);if(!m)return;C4B.g.remove(m);m.material.dispose();c4d.delete(x)};
 if(key!==C4B.id){[...c4d.keys()].forEach(rm);C4B.id=key}
 const win=new Set(g&&g.line||[]);
 for(let x=0;x<42;x++){const v=g?g.b[x]:0;let m=c4d.get(x);if(!v){rm(x);continue}
  if(!m){DISC=DISC||new THREE.CylinderGeometry(.4,.4,.2,32);
   m=new THREE.Mesh(DISC,new THREE.MeshPhysicalMaterial({color:v==1?0xe53935:0xf9c623,roughness:.3,clearcoat:1,clearcoatRoughness:.1}));m.rotation.x=Math.PI/2;m.castShadow=true;
   m.userData.base=m.material.color.clone();m.material.color.multiplyScalar(C4B.lit);
   const y1=.7+Math.floor(x/7);m.position.set(x%7-3,y1,0);m.userData.y1=y1;if(x===g.last&&!first&&!RM){m.userData.t0=performance.now();m.position.y=7.4}C4B.g.add(m);c4d.set(x,m)}
  m.userData.win=win.has(x)}}
// caída con rebote y brillo de la línea ganadora
const bounce=k=>k<1/2.75?7.5625*k*k:k<2/2.75?7.5625*(k-=1.5/2.75)*k+.75:k<2.5/2.75?7.5625*(k-=2.25/2.75)*k+.9375:7.5625*(k-=2.625/2.75)*k+.984375;
function c4step(now){const lt=VT.c4?1:.4;if(C4B&&Math.abs(C4B.lit-lt)>.005)c4light(C4B.lit+(lt-C4B.lit)*.06);
 c4d.forEach(m=>{const u=m.userData;if(u.t0){const k=Math.min(1,(now-u.t0)/650);m.position.y=u.y1+(7.4-u.y1)*(1-bounce(k));if(k>=1)u.t0=0}
 m.material.emissive.setHex(u.win?0xffffff:0);m.material.emissiveIntensity=u.win?.18+.18*Math.sin(now/140):0})}
const c4mine=()=>{const g=c4g();return g&&g.st=='play'&&g.turn==g.p.indexOf(V.me)?g:null};
function c4hover(c){c4cols.forEach((m,i)=>{m.material.opacity=i===c&&c4mine()?.2:0})}
// ---------- avatares de los demás jugadores (estilo Xbox 360), sentados alrededor de la mesa ----------
// 6 Miis ya armados (estilo propio, inspirado en los de Wii); a cada jugador le toca uno distinto. La ropa es del color de su ficha.
const AVP=[
 {skin:'#f6d3b3',hair:'bowl',hc:'#3b2416',eyes:'dot',brow:'flat',nose:'dot',mouth:'smile',blush:1,bot:0x3b4a6b,shoe:0x2a2a2e},
 {skin:'#e8b48a',hair:'long',hc:'#1d1410',eyes:'lash',brow:'arch',nose:'curve',mouth:'smile',blush:1,bot:0x2b2b33,shoe:0xb03a5a},
 {skin:'#f7dcc4',hair:'spiky',hc:'#d9a640',eyes:'oval',brow:'angry',nose:'curve',mouth:'grin',bot:0x3b5a8c,shoe:0xd03030},
 {skin:'#8a5a3c',hair:'short',hc:'#120c08',eyes:'oval',brow:'flat',nose:'wide',mouth:'smile',glasses:1,bot:0xb9a078,shoe:0xf2f2f2},
 {skin:'#d9a273',hair:'cap',hc:'#3a2414',cap:'#c62828',eyes:'happy',brow:'arch',nose:'dot',mouth:'open',must:1,bot:0x30343a,shoe:0x2a4a8a},
 {skin:'#ffe0c8',hair:'bun',hc:'#7a4a22',eyes:'lash',brow:'arch',nose:'dot',mouth:'small',blush:1,bot:0x3b5a8c,shoe:0xf06292}];
const hsh=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const UP=new THREE.Vector3(0,1,0),avDir=new THREE.Vector3(),avA=new THREE.Vector3(),avB=new THREE.Vector3();
// cápsula estirada entre dos puntos (brazos y piernas)
function seg(m,a,b){if(m.userData.limb)return m.userData.limb(a,b);   // brazo/pierna de una pieza (c_mii.js): rehace el tubo
 avDir.subVectors(b,a);const l=avDir.length();m.position.copy(a).addScaledVector(avDir,.5);m.quaternion.setFromUnitVectors(UP,avDir.normalize());m.scale.y=l/m.userData.len}
// codo con cinemática inversa de dos huesos (pole = hacia dónde se dobla)
function ik(sh,hand,l1,l2,pole,out){avA.subVectors(hand,sh);const L=Math.min(avA.length(),l1+l2-.002),c=(l1*l1+L*L-l2*l2)/(2*l1*L),h=l1*Math.sqrt(Math.max(0,1-c*c));avA.normalize();
 avB.copy(pole).sub(sh);avB.addScaledVector(avA,-avB.dot(avA)).normalize();return out.copy(sh).addScaledVector(avA,c*l1).addScaledVector(avB,h)}
// o.stand: de pie y sin silla (la casa de juegos); las piernas se acomodan cada cuadro con userData.legs
// Mii de las cartas (c_mii.js). En Continental ya no se sienta nadie así (van los personajes); lo usan la casa, la Ruleta y los abuelos del Rummy
function mkAvatar(k,pi,o={}){return MII.mk(k,pi,o,COL[k%10],AVP[pi])}
// personajes (c_mesa_pj.js) en las sillas de la mesa; mientras carga su GLB (o si no hay) las sillas esperan vacías y sus cartas van en el fieltro
function avSync(){if(!window.MPJ||!mesa)return;const G=V.G,P=V.players||[];
 if(MPJ.sync(mesa,G.players.map((_,k)=>({i:rel(k),k,cod:(P[k]&&P[k].av)||MPJ.codigo(P[k]&&P[k].name)})).filter(x=>!(P[x.k]&&P[x.k].out)),{dorso:backTex(),listo:()=>sync()}))MPJ.hits().forEach(o=>hits.push(o))}
function avStep(now){if(window.MPJ&&MPJ.on&&V&&V.G)MPJ.paso(now,V.G.turn>=0?rel(V.G.turn):-1)}
// ---------- Backgammon: tablero 3D sobre la mesita de centro (otro juego escondido del cuarto) ----------
const BGW=3,BGD=2.3,BGBAR=.24,BGPW=(BGW-BGBAR)/12;let BGB=null,bgSel=null,bgfound=lsGet('cont_bgf')=='1',bgopen=false,bgwas=false,bgsnap='';
function bgX(i){if(i<12){const j=i;return BGW/2-(j+.5)*BGPW-(j>=6?BGBAR:0)}const j=i-12;return -BGW/2+(j+.5)*BGPW+(j>=6?BGBAR:0)}
// caras del dado con v arriba (orden de BoxGeometry: +x,-x,+y,-y,+z,-z; las opuestas suman 7)
function diceFaces(v){const o=[1,2,3,4,5,6].filter(x=>x!==v&&x!==7-v),a=o[0],b=o.find(x=>x!==a&&x!==7-a);return [a,7-a,v,7-v,b,7-b]}
const bgZ=i=>i<12?BGD/2:-BGD/2,bgDir=i=>i<12?-1:1;
function pipTex(v){return ctex('pip'+v,128,128,(g,w,h)=>{g.fillStyle='#f7f4ec';g.fillRect(0,0,w,h);g.fillStyle='#1b1b1b';const P={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]}[v];
 P.forEach(([x,y])=>{g.beginPath();g.arc(x*32,y*32,11,0,7);g.fill()})})}
function mkBG(par,at){const P=new THREE.Group(),g=new THREE.Group();P.add(g);P.position.copy(at);
 const std=(c,r,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r==null?.6:r},o||{})),M=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
 const wood=std(0x5a3418,.45),felt=std(0x1f5b3a,.95),red=std(0x9e2a2a,.7),ivory=std(0xe8dcc0,.7),tray=BGW/2+.1+.17;
 M(new THREE.BoxGeometry(BGW+.24+.4,.12,BGD+.24),wood,.2,.06,0);M(new THREE.BoxGeometry(BGW,.02,BGD),felt,0,.13,0);
 M(new THREE.BoxGeometry(BGBAR,.08,BGD),wood,0,.16,0);M(new THREE.BoxGeometry(.34,.06,BGD),std(0x3a210f,.6),tray,.14,0);
 [[0,BGD/2+.06,BGW+.64,.12],[0,-BGD/2-.06,BGW+.64,.12]].forEach(([x,z,w,d])=>M(new THREE.BoxGeometry(w,.1,d),wood,.2,.17,z));
 // los 24 triángulos
 const tri=new THREE.Shape();tri.moveTo(-BGPW*.46,0);tri.lineTo(BGPW*.46,0);tri.lineTo(0,BGD*.42);tri.closePath();const tg=new THREE.ShapeGeometry(tri);
 for(let i=0;i<24;i++){const m=new THREE.Mesh(tg,i%2?ivory:red);m.rotation.x=-Math.PI/2;m.position.set(bgX(i),.142,bgZ(i));if(i>=12)m.rotation.z=Math.PI;m.receiveShadow=true;g.add(m)}
 // zonas para tocar: puntos, barra y bandeja de salida (se iluminan para guiarte)
 const hits=[],zone=(w,d,x,z,p)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x,.16,z);m.userData.hit={t:'bg',p};g.add(m);hits.push(m);return m};
 const zs={};for(let i=0;i<24;i++)zs[i]=zone(BGPW*.98,BGD/2,bgX(i),bgZ(i)/2,i);zs[25]=zone(BGBAR,BGD,0,0,25);zs[-1]=zone(.34,BGD,tray,0,-1);
 // fichas (15 de cada color) y dados
 const ck=[[],[]],cg=new THREE.CylinderGeometry(BGPW*.43,BGPW*.43,.045,24);
 [0,1].forEach(p=>{for(let n=0;n<15;n++){const m=new THREE.Mesh(cg,new THREE.MeshPhysicalMaterial({color:p?0x26262b:0xf2ead8,roughness:.35,clearcoat:.8}));m.castShadow=true;m.position.set(tray,.2,0);g.add(m);ck[p].push(m)}});
 const dice=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.17,.17,.17),[1,2,3,4,5,6].map(v=>std(0xffffff,.35,{map:pipTex(v)})));m.castShadow=true;m.visible=false;g.add(m);return m});
 par.add(P);P.updateMatrixWorld(true);return {P,g,zs,hits,ck,dice,tray,mats:[wood,felt,red,ivory]}}
function buildBG(at){const o=mkBG(tbl,at);BGB=Object.assign(o,{id:null,rn:-1,lit:.4,mats:o.mats.map(m=>({m,base:m.color.clone()}))})}
const bgg=()=>{const L=V.G.bgs||[];return L.find(x=>x.p.includes(V.me))};
const bgshow=()=>{const L=V.G.bgs||[];return bgg()||L.find(x=>x.st=='play')||null};
const bgmine=()=>{const g=bgg();return g&&g.st=='play'&&g.turn==g.p.indexOf(V.me)?g:null};
// coloca fichas y dados según la partida; las fichas se deslizan a su lugar en bgStep
function bgSync(){if(!BGB)return;hits.push(...BGB.hits);const g=bgshow();
 const put=(m,x,y,z)=>{m.userData.to=v3(x,y,z)};
 [0,1].forEach(p=>{let n=0;const ck=BGB.ck[p],s=p?-1:1;
  if(g){for(let i=0;i<24;i++){const c=g.pts[i]*s;for(let k=0;k<c;k++){const layer=Math.floor(k/5),kk=k%5;put(ck[n++],bgX(i),.17+layer*.05,bgZ(i)+bgDir(i)*(BGPW*.45+kk*BGPW*.88+layer*BGPW*.44))}}
   for(let k=0;k<g.bar[p];k++)put(ck[n++],0,.22,(p?1:-1)*(.18+k*BGPW*.88));
   for(let k=0;k<g.off[p];k++)put(ck[n++],BGB.tray,.19+k*.047,(p?-1:1)*BGD*.3)}
  while(n<15)put(ck[n++],BGB.tray,.19+(n-1)*.047,(p?-1:1)*BGD*.3)});
 // dados: se ven mientras hay partida; los que ya se usaron se oscurecen
 BGB.dice.forEach((d,j)=>{d.visible=!!(g&&g.st=='play');if(!g)return;const v=g.dice[j]||1,dbl=g.dice[0]==g.dice[1],used=dbl?(4-g.left.length)>=2*(j+1):!g.left.includes(v);
  diceFaces(v).forEach((f,n)=>{const m=d.material[n];m.map=pipTex(f);m.color.setScalar(used?.45:1);m.needsUpdate=true});
  d.userData.to=v3((g.turn?-1:1)*BGW/4+(j?.12:-.12),.23,j?.1:-.1)});
 if(g&&g.rn!==BGB.rn){BGB.rn=g.rn;BGB.dice.forEach(d=>d.userData.t0=performance.now())}
 bgMark()}
// guía: tus fichas que se pueden mover, la elegida (amarillo) y a dónde puede ir (verde)
function bgMark(){if(!BGB)return;const g=bgmine(),zs=BGB.zs;Object.values(zs).forEach(z=>{z.material.opacity=0});if(!g)return;
 if(bgSel!=null&&!g.mv.some(m=>m[0]===bgSel))bgSel=null;
 g.mv.forEach(m=>{const z=zs[m[0]];if(z&&bgSel==null){z.material.color.set(0x8fd0ff);z.material.opacity=.22}});
 if(bgSel!=null){zs[bgSel].material.color.set(0xffd54a);zs[bgSel].material.opacity=.35;g.mv.filter(m=>m[0]===bgSel).forEach(m=>{const z=zs[m[2]];z.material.color.set(0x6dff8a);z.material.opacity=.38})}}
function bgLight(v){BGB.lit=v;BGB.mats.forEach(o=>o.m.color.copy(o.base).multiplyScalar(v))}
function bgStep(now){if(!BGB)return;const lt=VT.bg?1:.45;if(Math.abs(BGB.lit-lt)>.005)bgLight(BGB.lit+(lt-BGB.lit)*.06);
 [...BGB.ck[0],...BGB.ck[1]].forEach(m=>{const t=m.userData.to;if(t)m.position.lerp(t,RM?1:.18)});
 BGB.dice.forEach(d=>{const t=d.userData.to;if(!t)return;const k=d.userData.t0?Math.min(1,(now-d.userData.t0)/650):1;d.position.copy(t);d.position.y+=Math.sin(k*Math.PI)*.35;
  d.rotation.set((1-k)*9,(1-k)*7,(1-k)*5);if(k>=1)d.userData.t0=0})}
// tocar el tablero: primero la cámara se acerca; luego eliges ficha y destino
function bgTap(p){const g=bgmine();if(!g){if(!bgg()){bgopen=true;render()}return}
 if(bgSel!=null){const m=g.mv.find(x=>x[0]===bgSel&&x[2]===p);if(m){bgSend({op:'move',id:g.id,from:m[0],die:m[1]});bgSel=null;sfx('place');return}}
 if(g.mv.some(x=>x[0]===p)){bgSel=bgSel===p?null:p;sfx('card')}else if(g.bar[g.p.indexOf(V.me)]&&g.mv.length){bgSel=25;sfx('card')}else bgSel=null;bgMark()}
// cámara: casi desde arriba, del lado de tu color
function bgLook(){if(!BGB||!L)return;const wc=BGB.g.localToWorld(v3(.2,.15,0)),me=bgg(),a=me&&me.p.indexOf(V.me)==1?Math.PI:0,e=1.3,t=wc.y/Math.sin(e);
 const k=Math.min(2*(L.rx+.75),2*(L.rz+.75))/4.2*(L.por?.85:.62);
 Object.assign(VT,{x:wc.x-Math.sin(a)*Math.cos(e)*t,z:wc.z-Math.cos(a)*Math.cos(e)*t,k:Math.max(1.5,Math.min(KMAX,k)),a,t:e-L.el,who:-1,c4:false,bg:true,top:false});clampV();sfx('card')}
function bgdiscover(){if(bgfound)return;bgfound=true;try{localStorage.setItem('cont_bgf','1')}catch(e){}sfx('win');confetti(30);banner('🎲 ¡Encontraste un juego secreto: Backgammon!')}
const BGIC='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" fill="#5a3418"/><rect x="3.5" y="5.5" width="17" height="13" fill="#1f5b3a"/><path d="M4 5.5l1.5 6 1.5-6zM7.5 5.5l1.5 6 1.5-6zM13.5 18.5l1.5-6 1.5 6zM17 18.5l1.5-6 1.5 6z" fill="#e8dcc0"/><path d="M5.8 18.5l1.5-6 1.5 6zM15.3 5.5l1.5 6 1.5-6z" fill="#9e2a2a"/><rect x="11.4" y="5.5" width="1.2" height="13" fill="#5a3418"/></svg>';
const bgdisc=k=>`<i class="c4m" style="background:${k?'radial-gradient(circle at 35% 30%,#666,#26262b 60%)':'radial-gradient(circle at 35% 30%,#fff,#e8dcc0 60%)'}"></i>`;
function bgUI(top){const G=V.G,me=V.me;if(me<0)return '';const g=bgg(),mi=g?g.p.indexOf(me):-1,op=g?g.p[1-mi]:-1;
 const myT=g&&g.st=='play'&&g.turn==mi,inv=g&&g.st=='inv'&&mi==1;if(fz||(!bgfound&&!g))return '';
 let h=`<button id="t3bgb" class="ui ui-rb t3gb${myT||inv?' on':''}" style="top:calc(env(safe-area-inset-top,0px) + ${top}px)" onclick="${bgopen&&VT.bg?'bgo(0)':'bggo()'}" title="Backgammon" aria-label="Backgammon">${BGIC}</button>`;
 if(inv&&!bgopen)h+=`<div id="t3bgi" class="ui ui-card t3gi">${chip(op)}<b>${nm(op)}</b> te reta a <b>Backgammon</b><span><button class="ui-btn sec" onclick="bga('acc')">Jugar</button><button class="ui-btn sec" onclick="bga('end')">Ahora no</button></span></div>`;
 if(!bgopen)return h;let b='';
 if(!g){const ks=G.players.map((_,k)=>k).filter(k=>k!==me&&!V.players[k].out),busy=k=>(G.bgs||[]).some(x=>x.st!='end'&&x.p.includes(k));
  b=`<div class="c4t">¿Contra quién quieres jugar?</div><div class="c4l">${ks.map(k=>`<button class="ui-btn sec" onclick="bginv(${k})"${busy(k)?' disabled':''}>${chip(k)}${nm(k)}${busy(k)?' · jugando':''}</button>`).join('')||'<span>No hay otros jugadores en la sala.</span>'}</div>
   <div class="c4n">Saca tus 15 fichas antes que tu rival. Los dados se tiran solos al empezar cada turno.</div>`}
 else if(g.st=='inv')b=mi==0?`<div class="c4t">Esperando a que <b>${nm(op)}</b> acepte…</div><div class="gj-btns"><button class="ui-btn sec" onclick="bga('end')">Cancelar</button></div>`
  :`<div class="c4t">${chip(op)}<b>${nm(op)}</b> te reta a Backgammon</div><div class="gj-btns"><button class="ui-btn" onclick="bga('acc')">Jugar</button><button class="ui-btn sec" onclick="bga('end')">Ahora no</button></div>`;
 else{const dc=g.dice[0]==g.dice[1]?`${g.dice[0]}·${g.dice[0]} (dobles)`:g.dice.join(' y ');
  const st=g.st=='play'?(myT?(g.mv.length?`${bgdisc(mi)} <b>¡Tu turno!</b> Dados: ${dc}. Toca una ficha y luego a dónde moverla`:`${bgdisc(mi)} Dados: ${dc}. No tienes jugadas`):`${bgdisc(1-mi)} Turno de ${nm(op)}… (dados: ${dc})`)
   :g.w==mi?(g.why?`🏆 ${nm(op)} se rindió: ¡ganaste!`:'🏆 <b>¡Ganaste!</b>'):(g.why?'Te rendiste':`Ganó <b>${nm(op)}</b>`);
  b=`<div class="c4s${myT?' me':''}">${st}</div><div class="c4p">${bgdisc(0)} ${nm(g.p[0])} (${g.off[0]}/15) &nbsp;vs&nbsp; ${bgdisc(1)} ${nm(g.p[1])} (${g.off[1]}/15)</div>
   <div class="gj-btns">${VT.bg?'<button class="ui-btn sec" onclick="bgo(0)">Volver a la mesa</button>':'<button class="ui-btn" onclick="bggo()">Ver tablero</button>'}${myT&&!g.mv.length?'<button class="ui-btn" onclick="bga(\'pass\')">Pasar turno</button>':''}${g.st=='play'?`<button class="ui-btn sec" onclick="if(confirm('¿Rendirte en Backgammon?'))bga('end')">Rendirse</button>`:`<button class="ui-btn" onclick="bginv(${op})">Revancha</button><button class="ui-btn sec" onclick="bga('end')">Nueva partida</button>`}</div>`}
 return h+`<div id="t3bg" class="ui ui-card t3gp" role="dialog" aria-label="Backgammon"><div class="ui-hd"><h2 class="ui-h">Backgammon</h2><button class="ui-x" onclick="bgo(0)" aria-label="Cerrar">${UI.ico('x')}</button></div><div class="ui-bd">${b}</div></div>`}
function bgcheck(){const g=bgg();if(!g){bgsnap='';return}const mi=g.p.indexOf(V.me),k=[g.id,g.st,JSON.stringify(g.last),g.turn,g.rn,g.w].join('|');if(k===bgsnap)return;
 const o=bgsnap.split('|');bgsnap=k;if(!o[0]||+o[0]!==g.id){if(g.st=='inv'&&mi==1)sfx('go');return}
 if(o[2]!==JSON.stringify(g.last))sfx('place');if(o[4]!==String(g.rn))sfx('shuf');
 if(g.st=='end'&&o[1]!='end'){if(g.w==mi){sfx('win');confetti(40);banner('🏆 ¡Ganaste Backgammon!')}else sfx('tick')}
 else if(g.st=='play'&&g.turn==mi&&(o[1]!='play'||+o[3]!==g.turn))setTimeout(()=>sfx('go'),400)}
const bgSend=m=>api('act',{c:S.c,t:S.t,m:Object.assign({t:'bg'},m)}).then(d=>{if(d&&d.err)bad(d.err)}).catch(()=>bad('Sin conexión.'));
window.bga=op=>{const g=bgg();if(op=='acc')bgdiscover();if(g)bgSend({op,id:g.id})};
window.bgo=o=>{bgopen=!!o;menu=false;if(!o&&VT.bg)home();sfx('tick');render()};
window.bggo=()=>{bgopen=true;menu=false;bgLook();render()};
window.bginv=k=>{bgSend({op:'inv',k});sfx('card')};
// llevar la cámara al tablero: su centro queda en medio de la pantalla
function c4look(){if(!C4B||!L)return;const wc=C4B.g.localToWorld(v3(0,3.3,0)),e=.55,a=C4B.P.rotation.y,k=Math.min(2*(L.rx+.75),2*(L.rz+.75))/3.7*(L.por?.78:.6);
 // de frente al tablero: el punto del piso al que mira la cámara queda detrás de su centro, en la dirección de la vista
 const back=Math.cos(e)*wc.y/Math.sin(e);
 Object.assign(VT,{x:wc.x-Math.sin(a)*back,z:wc.z-Math.cos(a)*back,k:Math.max(1.5,Math.min(KMAX,k)),a,t:e-L.el,who:-1,c4:true,bg:false,top:false});clampV();sfx('card')}
// Ajusta cámara y tamaños a la pantalla: la mesa ocupa lo que queda entre la barra de arriba y tu mano.
const tkey=()=>(innerWidth/innerHeight<.95?'p':'l')+(V&&V.G?V.G.players.length:4);   // la mesa se rearma al girar o si cambia cuántos juegan
// la lámpara cuelga justo arriba de lo que se ve desde tu silla (se asoma al acercar o inclinar la cámara)
function lampY(){if(!mesa)return;const p=v3(0,0,0);let lo=mesa.r*1.1,hi=mesa.r*4;
 if(p.set(0,lo,mesa.sr).project(CA).y<1.03)for(let i=0;i<20;i++){const m=(lo+hi)/2;p.set(0,m,mesa.sr).project(CA).y>1.03?hi=m:lo=m}else hi=lo;mesa.lampara(hi)}
function layout(){const w=innerWidth,h=innerHeight;W=w;H=h;R.setSize(w,h,false);
 const por=w/h<.95;if(tkey()!==tableKey){tableKey=tkey();buildTable(por)}
 const tb=$('#gjHint')||$('#gjTop'),bb=$('#gjBar .gj-bb'),top=mini?(h<500?4:14):(tb?tb.getBoundingClientRect().bottom:100)+(h<500?4:10),bar=h-(bb?bb.getBoundingClientRect().top:h-60);
 const ch=Math.max(80,Math.min(h*.22,w*.34,200));Object.assign(L,{top,bar,ch,barTop:bb?bb.getBoundingClientRect().top:0});
 document.documentElement.style.setProperty('--t3fan',Math.round(bar+ch*1.1)+'px');document.documentElement.style.setProperty('--t3bar',Math.round(bar+8)+'px');
 const rb=h-bar-ch*.62,rh=Math.max(120,rb-top),el=por?1.12:.98;
 CA.clearViewOffset();CA.aspect=w/rh;
 const pts=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;for(const y of [0,.4])pts.push(v3(Math.cos(a)*(L.rx+.75),y,Math.sin(a)*(L.rz+.75)))}
 const ext=d=>{CA.position.set(0,Math.sin(el)*d,Math.cos(el)*d);CA.lookAt(0,0,0);CA.updateProjectionMatrix();CA.updateMatrixWorld();
  let a=1e9,b=-1e9,c=1e9,e=-1e9;pts.forEach(p=>{const q=p.clone().project(CA);a=Math.min(a,q.x);b=Math.max(b,q.x);c=Math.min(c,q.y);e=Math.max(e,q.y)});return [a,b,c,e]};
 let lo=3,hi=120;for(let i=0;i<32;i++){const m=(lo+hi)/2,x=ext(m);((x[1]-x[0])/2<.98&&(x[3]-x[2])/2<.97)?hi=m:lo=m}
 const x=ext(hi),cx=(x[0]+x[1])/2,cy=(x[2]+x[3])/2;
 L.el=el;L.d=hi;CA.setViewOffset(w,rh,cx*w/2,-top-cy*rh/2,w,h);CA.updateProjectionMatrix();lampY();clampV();cam()}
// ---------- mover la cámara (tu mano es hija de la cámara, así que se queda quieta) ----------
// la cámara gira (a) e inclina (t) alrededor del punto (x,z) y se acerca según k
function cam(){if(!L||!L.d)return;const e=L.el+VW.t,d=L.d/VW.k;
 CA.position.set(VW.x+Math.sin(VW.a)*Math.cos(e)*d,Math.sin(e)*d,VW.z+Math.cos(VW.a)*Math.cos(e)*d);CA.lookAt(VW.x,0,VW.z);if(hdNow)CA.rotateOnWorldAxis(YA,hdNow);CA.updateMatrixWorld()}
const YA=v3(0,1,0),MLT=v3(0,0,0);
// cámara viva (c_mesa_cam.js): voltea un poco hacia quien tiene el turno, regresa sola a tu vista, cortes; y la luz de la lámpara se va despacio a su zona
function vivo(now,dt){const G=V.G;if(mesa&&G){const t=G.turn,z=t>=0&&G.phase==='play'?L.zona(rel(t)).c:null;MLT.set(z?z.x*.85:0,0,z?z.z*.85:0);mesa.luzHacia(MLT,1-Math.exp(-dt/900));mesa.pantalla(L.el+VW.t<1.2)}
 if(!mc||!L||!L.d)return;const e=L.el+VW.t,d=L.d/VW.k,t=G.turn;
 const h=mc.paso(now,{cam:{px:VW.x+Math.sin(VW.a)*Math.cos(e)*d,pz:VW.z+Math.cos(VW.a)*Math.cos(e)*d,lx:VW.x,lz:VW.z},turno:t>=0&&t!==V.me&&G.phase==='play'?L.zona(rel(t)).c:null,quieto:!!(VT.c4||VT.bg||drag||st||pin)});
 if(h!==hdNow){hdNow=h;cam()}}
// corte breve y cercano a un jugador: de frente a él, entre su zona y su silla. No a media jugada tuya (salvo al cerrar la ronda)
function corte(k,ms,forzar){if(!mc||!mesa||(!forzar&&k===V.me)||(!forzar&&(V.G.turn===V.me||sel.size||drag)))return;const A=mesa.asiento(rel(k)),c=Math.cos(A.a),s=Math.sin(A.a),R=mesa.r*.62;
 mc.corte({x:c*R,z:s*R,a:Math.atan2(-c,-s),k:2.3,t:-.28},ms,forzar)}
function clampV(){if(!L)return;const k0=VT.top?.7:1;VT.k=Math.max(k0,Math.min(KMAX,VT.k));const Q=L.room||{X:L.rx+2,ZB:-L.rz-6,ZF:L.rz+2};VT.x=Math.max(-Q.X+1,Math.min(Q.X-1,VT.x));VT.z=Math.max(Q.ZB-2,Math.min(Q.ZF+1,VT.z));
 VT.t=Math.max(.3-L.el,Math.min(1.5-L.el,VT.t));
 // altura mínima de la cámara: si baja de más, tu mano (que va pegada a la cámara) se mete en la mesa
 if(L.d)VT.k=Math.min(VT.k,Math.max(k0,Math.sin(L.el+VT.t)*L.d/3.6))}
const VK=['x','z','k','a','t'];
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);cam()}
function viewStep(dt){const f=RM?1:1-Math.exp(-dt/110);let ch=0;
 VK.forEach(q=>{const d=VT[q]-VW[q];if(Math.abs(d)>1e-4){VW[q]+=d*f;ch=1}else if(d){VW[q]=VT[q];ch=1}});if(ch)cam()}
const viewed=()=>VT.k>1.02||Math.abs(VT.x)>.05||Math.abs(VT.z)>.05||Math.abs(VT.a)>.01||Math.abs(VT.t)>.01;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// cuadrar: regresa a la vista de siempre por el camino corto
function home(){VW.a=wrap(VW.a);Object.assign(VT,{x:0,z:0,k:1,a:0,t:0,who:-1,c4:false,bg:false,top:false})}
// pasos de la barra de cámara y del teclado (suaves: solo mueven el destino)
function camStep(c){const f=1.1/VT.k,sa=Math.sin(VT.a),ca=Math.cos(VT.a),mv={up:[0,-1],dn:[0,1],lf:[-1,0],rt:[1,0]}[c];
 if(c=='rl')VT.a-=.2;else if(c=='rr')VT.a+=.2;else if(c=='zi')VT.k*=1.2;else if(c=='zo')VT.k/=1.2;else if(c=='tu')VT.t+=.09;else if(c=='td')VT.t-=.09;
 else if(mv){VT.x+=(mv[0]*ca+mv[1]*sa)*f;VT.z+=(-mv[0]*sa+mv[1]*ca)*f}else return;VT.who=-1;clampV()}
// ---------- ver en grande la carta de arriba del descarte (ratón encima o dedo presionado) ----------
const peekImg={};
function peek(onn){const id=onn&&V&&V.G&&V.G.disc.length?V.G.disc[V.G.disc.length-1]:null;
 // sin carta que mostrar: siempre se oculta (antes se quedaba pegada si el descarte quedaba vacío)
 if(id==null){peekId=null;if(peekEl)peekEl.classList.remove('on');return}if(id===peekId)return;peekId=id;if(!peekEl)return;
 const k=id+scards;peekEl.firstChild.src=peekImg[k]||(peekImg[k]=faceTex(id).image.toDataURL());const c=C(id);
 peekEl.lastChild.textContent=c.j?'Comodín':RN[c.r-1]+SU[c.s];peekEl.classList.add('on');peekPos();sfx('card')}
// junto a la pila, sin salirse de la pantalla
function peekPos(){if(peekId==null||!L||!L.disc)return;const [x,y]=toPx(L.disc),w=peekEl.offsetWidth,h=peekEl.offsetHeight,d=CH*L.ps*VW.k*28+20;
 // en horizontal la pila está a la orilla izquierda: la carta sale a su derecha para no tapar tu mano
 const lf=L.por?x-w/2:x+d*.7,top=!L.por?y-h/2:y<H/2?y+d:y-d-h;peekEl.style.transform=`translate(${Math.max(8,Math.min(W-w-8,lf))}px,${Math.max(8,Math.min(H-h-8,top))}px)`}
// ---------- cartita del descarte abajo a la izquierda: solo cuando la pila no se ve (jugando Backgammon/Conecta 4 o con la cámara movida) ----------
function dpv(){if(!dpvEl)return;const G=V&&V.G,id=G&&G.disc.length?G.disc[G.disc.length-1]:null;let show=false;
 if(id!=null&&L&&L.disc){const q=L.disc.clone().project(CA);show=q.z>1||Math.abs(q.x)>.97||Math.abs(q.y)>.97}
 if(show){const k=id+scards;if(dpvEl.dataset.k!==k){const was=dpvEl.dataset.k;dpvEl.dataset.k=k;
   dpvEl.children[1].src=peekImg[k]||(peekImg[k]=faceTex(id).image.toDataURL());const c=C(id);dpvEl.lastChild.textContent=c.j?'Comodín':RN[c.r-1]+SU[c.s];
   // carta nueva en el descarte: un brillo corto para que se note
   if(was){dpvEl.classList.remove('new');void dpvEl.offsetWidth;dpvEl.classList.add('new')}}}
 if(dpvEl.classList.contains('on')!==show)dpvEl.classList.toggle('on',show)}
// punto de la mesa debajo del dedo/ratón
function ground(cx,cy){const r=cv.getBoundingClientRect();P2.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(PL,v3(0,0,0))}
// zoom hacia un punto de la pantalla (rueda del ratón)
function zoomAt(cx,cy,k){const p=ground(cx,cy);k=Math.max(VT.top?.7:1,Math.min(KMAX,k));if(!p)return;const f=VT.k/k;VT.x=p.x-(p.x-VT.x)*f;VT.z=p.z-(p.z-VT.z)*f;VT.k=k;VT.who=-1;clampV()}
// mirar a un jugador: sus combinaciones (o su asiento si no se ha bajado). Tocarlo otra vez regresa a la mesa completa
function look(k){if(!L)return;if(mc)mc.toca();if(VT.who===k)return home();const bs=(L.mb||[]).filter(b=>b.o===k);let x0,x1,z0,z1;
 if(bs.length){x0=Math.min(...bs.map(b=>b.x0));x1=Math.max(...bs.map(b=>b.x1));z0=Math.min(...bs.map(b=>b.z0));z1=Math.max(...bs.map(b=>b.z1))}
 else{const p=seatP(k,.84);x0=p.x-1.5;x1=p.x+1.5;z0=p.z-1;z1=p.z+1}
 const kk=Math.min(2*(L.rx+.75)/(x1-x0+1.2),2*(L.rz+.75)/(z1-z0+1.2))*.9;
 Object.assign(VT,{x:(x0+x1)/2,z:(z0+z1)/2,k:Math.max(1.5,Math.min(KMAX,kk)),who:k,c4:false,top:false});clampV();sfx('card')}
function loc(px,py,d){const v=v3(px/W*2-1,1-py/H*2,.5).applyMatrix4(CA.projectionMatrixInverse);return v.multiplyScalar(-d/v.z)}
function toPx(p){const q=p.clone().project(CA);return [(q.x+1)/2*W,(1-q.y)/2*H]}

// ---------- posiciones ----------
function seatA(k){const n=V.G.players.length,me=V.me<0?0:V.me;return Math.PI/2+((k-me+n)%n)*(2*Math.PI/n)}
function seatP(k,f){const a=seatA(k);return v3(Math.cos(a)*L.rx*f,0,Math.sin(a)*L.rz*f)}
const rel=k=>{const n=V.G.players.length,me=V.me<0?0:V.me;return (k-me+n)%n};   // asiento de la mesa (0 = el tuyo)
// abanico de tu mano en la parte de abajo de la pantalla (las cartas son hijas de la cámara)
function fan(ids,x0=0,x1=W){const n=ids.length,ch=L.ch,cw=ch/CH*CW,upp=(loc(W,0,D).x-loc(0,0,D).x)/W,av=x1-x0-20,cx=(x0+x1)/2,out=[];
 let rows=1,per=n,stp=n>1?Math.min(cw*.62,(av-cw)/(n-1)):0;if(n>9&&stp<cw*.2){rows=2;per=Math.ceil(n/2);stp=Math.min(cw*.62,(av-cw)/(per-1))}
 ids.forEach((id,i)=>{const r=rows==2&&i>=per?1:0,j=r?i-per:i,rn=r?n-per:Math.min(n,per),off=j-(rn-1)/2,dx=off*stp,u=dx/((x1-x0)/2);
  let y=H-Math.max(L.bar,72)-8-ch/2+u*u*ch*.22-(rows==2&&!r?ch*.42:0);if(sel.has(id))y-=ch*.2;else if(hov===id)y-=ch*.08;
  const ang=Math.max(-.32,Math.min(.32,-u*.26)),hv=hov===id&&!sel.has(id),up=hv||sel.has(id),d=D-i*.004-(r?.03:0);
  out.push({id,x:cx+dx,y,pos:loc(cx+dx,y,d),q:new THREE.Quaternion().setFromAxisAngle(Z,ang).multiply(new THREE.Quaternion().setFromAxisAngle(X,Math.PI/2-(up?.04:.3))),s:ch*upp/CH*(hv?1.06:1)})});
 return out}
// al: hacia dónde se cargan los renglones dentro de r (x: -1 izquierda, 1 derecha; z: -1 arriba, 1 abajo; 0 al centro)
function meldLay(ms,r,al){al=al||{x:0,z:0};
 for(let s=.9;;s-=.03){const cw=s*CW,ch=s*CH,ov=cw*.36,gx=cw*.32,gz=ch*.24,rows=[[]];let x=r.x0,z=r.z0;
  ms.forEach((m,k)=>{const mw=cw+(m.cards.length-1)*ov;if(x+mw>r.x1+1e-6&&x>r.x0){x=r.x0;z+=ch+gz;rows.push([])}rows[rows.length-1].push({k,x,z,mw});x+=mw+gx});
  if(z+ch<=r.z1||s<=.24){const out=[],dz=Math.max(0,(r.z1-(z+ch))*(al.z+1)/2);rows.forEach(rw=>{if(!rw.length)return;const e=rw[rw.length-1],sh=(r.x1-(e.x+e.mw))*(al.x+1)/2;rw.forEach(p=>{p.x+=sh;p.z+=dz;out[p.k]=p})});return {s,cw,ch,ov,pos:out}}}}
// las combinaciones de cada quien en su zona, en el marco de la zona (girada con su dueño); cada una trae la escala y la zona (p.zn)
function zoneLay(ms){const pos=[],by=new Map();ms.forEach((m,k)=>{const o=rel(m.owner);if(!by.has(o))by.set(o,[]);by.get(o).push(k)});
 by.forEach((ks,o)=>{const zn=L.zona(o),l=meldLay(ks.map(k=>ms[k]),{x0:-zn.w,x1:zn.w,z0:-zn.h,z1:zn.h},{x:0,z:o?zn.dueno:-1});   // pegadas a su dueño; las tuyas hacia el centro (abajo las tapa tu mano)
 ks.forEach((k,j)=>pos[k]=Object.assign({s:l.s,cw:l.cw,ch:l.ch,ov:l.ov,zn,q:Qe(0,zn.yaw,0)},l.pos[j]))});return {pos}}
// punto (lx,lz) del marco de una zona, en el mundo
function zw(zn,lx,lz,y){return v3(zn.c.x+zn.ex.x*lx+zn.ez.x*lz,y||0,zn.c.z+zn.ex.z*lx+zn.ez.z*lz)}
// caja del mundo de una combinación (para tocar, acercar la vista y el imán)
function mbox(p,o){const a=[zw(p.zn,p.x,p.z),zw(p.zn,p.x+p.mw,p.z),zw(p.zn,p.x,p.z+p.ch),zw(p.zn,p.x+p.mw,p.z+p.ch)];return {o,x0:Math.min(...a.map(v=>v.x)),x1:Math.max(...a.map(v=>v.x)),z0:Math.min(...a.map(v=>v.z)),z1:Math.max(...a.map(v=>v.z))}}

// ---------- sincronizar la escena con el estado del servidor ----------
function ens(key,id,from){let m=meshes.get(key);
 if(!m){m=mkCard(id);SC.add(m);m.position.copy(from||L.deck);m.position.y+=.06;m.quaternion.copy(FD);m.scale.setScalar(L.ps);meshes.set(key,m);m.userData.nw=1}
 setFace(m,id);selGlow(m,false);return m}
// las cartas nuevas vuelan más lento; al repartir salen una por una (después de la ruleta)
function go(m,par,pos,q,s,o){o=o||{};if(m.userData.nw){m.userData.nw=0;o.ms=Math.max(o.ms||0,520);if(dealing){o.delay=Math.max(0,rlEnd-Date.now())+dl*55;dl++}}target(m,par,pos,q,s,o)}
// brillo azul (selección estilo Windows 7) pegado detrás de la carta
function selGlow(m,onn){let g=m.userData.sg;if(!g&&!onn)return;
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(CW*1.22/GI,CH*1.16/GI),new THREE.MeshBasicMaterial({map:glowTex(),color:0x4fb8ff,opacity:.6,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.position.y=-CT;m.add(g);g.layers.set(m.userData.ly||0);m.userData.sg=g}
 g.visible=!!onn}
// ---------- tu contrato: siluetas, auto-armado ----------
const types=()=>CON[V.G.round].split('');
// ¿estas cartas todavía pueden llegar a ser trío/corrida? (los comodines van donde sea)
function canBe(t,cs){const n=cs.filter(c=>!c.j);if(t=='C'&&cs.length>14)return false;if(!n.length)return true;
 return t=='T'?n.every(c=>c.r==n[0].r):n.every(c=>c.s==n[0].s)&&new Set(n.map(c=>c.r)).size==n.length}
function ordered(t,ids){const cs=ids.map(C);if(t!='C')return ids;const a=runArr(cs);return (a||cs.slice().sort((x,y)=>x.j-y.j||x.r-y.r)).map(c=>c.id)}
// reparte cartas en los grupos del contrato (búsqueda con poda). Devuelve los grupos o null.
const pc={};
function part(ts,ids){const key=ts.join('')+':'+ids.slice().sort((a,b)=>a-b).join(',');if(key in pc)return pc[key];
 const ord=ids.map(C).sort((a,b)=>a.j-b.j),g=ts.map(()=>[]);let n=0;
 const rec=i=>{if(++n>40000)return false;if(i==ord.length)return g.every((a,j)=>ts[j]=='T'?trio(a):!!runArr(a));const seen=new Set();
  for(let j=0;j<ts.length;j++){const sg=ts[j]+':'+g[j].map(c=>c.id).join(',');if(seen.has(sg))continue;seen.add(sg);
   g[j].push(ord[i]);if(canBe(ts[j],g[j])&&rec(i+1))return true;g[j].pop()}return false};
 return pc[key]=ids.length&&rec(0)?g.map((a,j)=>({type:ts[j],ids:ordered(ts[j],a.map(c=>c.id))})):null}
function pool(){return staged.flatMap(g=>g.ids).concat([...sel])}
function listo(){return staged.length&&((!sel.size&&staged.every(okSlot))||!!part(types(),pool()))}
function addTo(k,ids){const g=staged[k];if(!g)return;const nx=g.ids.concat(ids.filter(x=>!g.ids.includes(x)));
 if(!canBe(g.type,nx.map(C))){const m=slots.get(k);if(m)m.userData.badT=Date.now();return bad(g.type=='T'?'Un trío lleva cartas del mismo número.':'Una corrida lleva cartas del mismo palo, sin repetir número.')}
 g.ids=ordered(g.type,nx);ids.forEach(x=>sel.delete(x));sfx(okSlot(g)?'tick':'place');render()}
function backFrom(k){const g=staged[k];if(!g||!g.ids.length)return;g.ids=[];sfx('place');render()}
// Bajarme: si ya está todo en sus siluetas se baja; si no, intenta armarlo solo con lo seleccionado
function bajar3d(){if(bajando)return;const ts=types();
 if(!sel.size&&staged.every(okSlot))return bajar();
 const p=part(ts,pool());
 if(!p)return bad(sel.size||staged.some(g=>g.ids.length)?'Con esas cartas no se arma '+conTxt(V.G.round)+'. Revisa que no sobre ni falte ninguna.':'Selecciona las cartas de tu contrato ('+conTxt(V.G.round)+').');
 staged=p;sel=new Set();sfx('place');render();bajando=1;setTimeout(()=>{bajando=0;bajar()},RM?0:700)}
// texto de ayuda arriba de tu mano según lo que seleccionaste
function selTxt(){const G=V.G,me=V.me;if(me<0||G.turn!=me||G.step!='play')return '';const dn=G.down[me],cs=[...sel].map(C);
 if(dn)return sel.size==1?'Tócala en una combinación para pegarla, o en el descarte':sel.size?'Para pegar o descartar, selecciona una sola carta':'';
 if(!sel.size)return staged.some(g=>g.ids.length)?(staged.every(okSlot)?'✓ ¡Contrato listo! Toca Bajarme':''):'';
 if(part(types(),pool()))return '✓ ¡Contrato completo! Toca <b>Bajarme</b>';
 const n=cs.filter(c=>!c.j),r=n[0];
 if(cs.length>=3&&trio(cs))return '✓ Trío de '+RN[r.r-1]+' · tócalo en tu contrato';
 if(runArr(cs))return '✓ Corrida de '+SU[r.s]+' · tócala en tu contrato';
 if(sel.size==1)return 'Toca más cartas, o toca una silueta para ponerla ahí';
 if(canBe('T',cs)&&r)return 'Trío de '+RN[r.r-1]+' · falta'+(3-n.length>1?'n '+(3-n.length):' 1');
 if(canBe('C',cs)&&r)return 'Corrida de '+SU[r.s]+' · '+(cs.length<4?'falta'+(4-cs.length>1?'n '+(4-cs.length):' 1'):'faltan cartas en medio');
 return '✗ Estas cartas no combinan'}
function slotLay(gs,b){const n=gs.length,bw=b.x1-b.x0,bh=b.z1-b.z0;
 for(let s=.8;;s-=.03){const cw=s*CW,ch=s*CH,ov=cw*.36,pad=.22,gap=.3,ws=gs.map(g=>cw+(Math.max(g.ids.length,g.type=='T'?3:4)-1)*ov+pad*2),tot=ws.reduce((a,x)=>a+x,0)+gap*(n-1);
  if((tot<=bw&&ch+pad*2<=bh)||s<=.3){let x=b.x0+(bw-tot)/2;return {s,cw,ch,ov,pad,pos:ws.map(w=>{const p={x,w,z:(b.z0+b.z1)/2};x+=w+gap;return p})}}}}
function fitsMeld(id,mm){const a=mm.cards.map(C).concat(C(id));return mm.type=='T'?trio(a):!!runArr(a)}
// reacciones de los personajes según el log (c_mesa_pj.js): robar, tomar, comprar, bajarse, descartar y pegar (el dueño voltea y su combinación destella)
function pjLog(e){const i=rel(e.k),t=e.t,w=CW*L.ps;
 if(/^se bajó/.test(t)){MPJ.festeja(i);corte(e.k)}else if(/^robó del mazo/.test(t))i?MPJ.roba(i,L.deck,w):MPJ.estira(0,L.deck);   // la tuya ya vuela a tu mano de la pantallaelse if(/^(tomó|descartó)/.test(t))MPJ.estira(i,L.disc);
 else if(/^quiere comprar/.test(t))MPJ.compra(i,true);else if(/^canceló su compra/.test(t))MPJ.compra(i,false);else if(/^compró/.test(t)){MPJ.compra(i,false);if(i)MPJ.roba(i,L.deck,w);corte(e.k)}
 else if(/^(pegó|cambió)/.test(t)){const k=V.G.melds.findIndex(m=>m.cards.includes(e.c)),mm=V.G.melds[k],b=L.mb&&L.mb[k],c=b?v3((b.x0+b.x1)/2,0,(b.z0+b.z1)/2):v3(0,0,0);MPJ.estira(i,c);
  if(mm&&mm.owner!==e.k){MPJ.mira(rel(mm.owner),c,1600);const g=glows.get('m'+k);if(g)g.userData.fl=performance.now()}}}
// destellos y sonidos según el log (c_mesa_fx.js): pegar (destella la bajada), bajarse (destella su zona con su color); los demás roban con sonido
function fxLog(e){const t=e.t;if(!window.MFX)return;
 if(/^(pegó|cambió)/.test(t)){const k=V.G.melds.findIndex(m=>m.cards.includes(e.c)),b=L.mb&&L.mb[k];if(b)setTimeout(()=>MFX.destello(SC,v3((b.x0+b.x1)/2+.3,0,(b.z0+b.z1)/2),b.x1-b.x0+.6,b.z1-b.z0+.3),380)}
 else if(/^se bajó/.test(t)){const z=L.zona(rel(e.k));setTimeout(()=>MFX.destello(SC,z.c,z.x1-z.x0,z.z1-z.z0,COL[e.k%10]),520)}
 else if(e.k!==V.me&&/^(robó|tomó|compró)/.test(t))sfx('draw')}
function sync(){if(!ready||!L||!active())return;
 const G=V.G,n=G.players.length,me=V.me,live=new Set(),mine=me>=0&&G.turn==me,pl=mine&&G.step=='play',dn=me>=0&&G.down[me];
 hits.length=0;glows.forEach(g=>{g.userData.used=0});if(window.MPJ&&MPJ.on)MPJ.fin(G.phase==='end'&&G.out!=null?rel(G.out):-1);if(G.phase==='end'&&G.out!=null&&finCut!==G.dn){finCut=G.dn;corte(G.out,3000,true)}
 if(pl&&!dn&&!staged.length)staged=types().map(type=>({type,ids:[]}));if(dn&&staged.length)staged=[];
 // te acabas de bajar: festejo
 if(me>=0){if(wasDown===false&&dn&&!first){sfx('go');confetti(40);banner('¡Te bajaste!')}wasDown=!!dn}
 // ronda nueva: se recoge todo y se reparte desde el mazo
 if(G.dn!==dealN){dealing=dealN>=0;dealN=G.dn;logN=-1;meshes.forEach((m,k)=>drop(k));home()}else dealing=false;dl=0;
 // empieza tu turno: si estabas mirando a alguien, la cámara regresa a la mesa
 if(mine&&myTc!==G.tc){myTc=G.tc;if(viewed())home();if((c4open||bgopen)&&W<700&&!first){c4open=bgopen=false;render()}}
 // qué pasó desde la última vez (para saber de dónde sale cada carta)
 const from={},took={};(G.log||[]).forEach(e=>{if(e.n<=logN)return;if(logN>=0&&window.MPJ&&MPJ.on)pjLog(e);if(logN>=0)fxLog(e);if(e.c!=null&&/^(descartó|pegó|cambió)/.test(e.t))from[e.c]=e.k;if(/^(tomó|compró)/.test(e.t))took[e.k]=1});logN=Math.max(logN,G.ln||0);
 const seatW=k=>{const q=window.MPJ&&MPJ.on&&MPJ.mano(rel(k));if(q)return q;const p=seatP(k,.84);p.y=.3;return p};   // con personaje: sus manos
 // mazo: pila con grosor según las cartas que quedan
 const nv=G.deck?Math.min(10,Math.ceil(G.deck/5)):0;
 for(let i=0;i<nv;i++){const key='dk'+i,m=ens(key,null);live.add(key);m.userData.hit={t:'deck'};hits.push(m);m.userData.nw=0;
  target(m,SC,v3(L.deck.x+(i%2)*.006,.012+i*CT*L.ps*1.5,L.deck.z),Qe(0,(i%3-1)*.012,Math.PI),L.ps,{ms:250})}
 const drawNow=mine&&G.step=='draw';
 glow('deck',v3(L.deck.x,.004,L.deck.z),CW*L.ps*1.25,CH*L.ps*1.2,0xffd54a,drawNow?.9:0,{t:'deck'});
 // descarte: las 3 de arriba
 const top3=G.disc.slice(-3);top3.forEach((id,i)=>{const key='c'+id,m=ens(key,id,from[id]!=null?seatW(from[id]):null),was=m.userData.hit&&m.userData.hit.t;live.add(key);m.userData.hit={t:'disc'};hits.push(m);
  go(m,SC,v3(L.disc.x+((id*37)%11-5)*.01,.012+i*CT*L.ps*1.6,L.disc.z+((id*17)%7-3)*.01),Qe(0,((id*13)%9-4)*.035,0),L.ps,{puff:was!=='disc'})});
 const dscOn=drawNow&&G.disc.length?.9:pl&&sel.size==1?.55:0;
 glow('disc',v3(L.disc.x,.004,L.disc.z),CW*L.ps*1.25,CH*L.ps*1.2,drawNow?0xffd54a:0x55c8ff,hiK==='disc'?1.3:dscOn,{t:'disc'});
 // combinaciones en la mesa
 mesa.marcas(G.players.map((_,j)=>{const k=(j+(me<0?0:me))%n;return V.players[k]&&V.players[k].out?null:COL[k%10]}));   // zona de cada asiento con el color de su jugador
 const ML=zoneLay(G.melds),one=sel.size==1?[...sel][0]:drag?drag.id:null;L.mb=[];
 G.melds.forEach((mm,k)=>{const p=ML.pos[k];L.mb.push(mbox(p,mm.owner));mm.cards.forEach((id,j)=>{const key='c'+id,m=ens(key,id,seatW(from[id]!=null?from[id]:mm.owner)),was=m.userData.hit&&m.userData.hit.t;live.add(key);m.userData.hit={t:'meld',k};hits.push(m);
   go(m,SC,zw(p.zn,p.x+p.cw/2+j*p.ov,p.z+p.ch/2,.012+j*.0035),p.q,p.s,{puff:was!=='meld'})});
  const can=pl&&one!=null&&dn&&fitsMeld(one,mm);
  glow('m'+k,zw(p.zn,p.x+p.mw/2,p.z+p.ch/2,.003),p.mw+.14,p.ch+.14,can?0x55c8ff:0xffffff,hiK==='m'+k?1.3:can?.85:0,{t:'meld',k},p.zn.yaw);
  glow('o'+k,zw(p.zn,p.x+p.mw/2,p.z+p.ch+.07,.004),p.mw,.08,COL[mm.owner%10],.5,null,p.zn.yaw)});
 avSync();
 // manos de los demás: cartas boca abajo frente a su asiento
 if(me>=0&&window.MPJ&&MPJ.on)MPJ.cartas(0,hc(me)||0);   // tu personaje trae tus cartas (boca abajo)
 for(let k=0;k<n;k++){if(k===me)continue;const cnt=Math.min(hc(k)||0,12),a=seatA(k),c=mesa.asiento(rel(k)).mano,tg=v3(Math.sin(a),0,-Math.cos(a)),ry=Math.PI/2-a,pj=window.MPJ&&MPJ.on&&!!MPJ.mano(rel(k));if(pj)MPJ.cartas(rel(k),hc(k)||0);   // con personaje: las cartas van en sus manos
  if(!pj)for(let j=0;j<cnt;j++){const key='h'+k+'_'+j,m=ens(key,null,took[k]?L.disc:null);live.add(key);m.userData.hit={t:'seat',k};hits.push(m);const off=j-(cnt-1)/2;
   go(m,SC,c.clone().addScaledVector(tg,off*.24).setY(.012+j*.004),Qe(0,ry+off*.04,Math.PI),.5)}
  const zn=L.zona(rel(k));glow('t'+k,v3(zn.c.x,.002,zn.c.z),zn.w*2+.2,zn.h*2+.2,0x55c8ff,G.turn==k?.4:0,{t:'seat',k},zn.yaw)}   // su zona brilla en su turno (y tocarla te acerca a sus bajadas)
 // siluetas de tu contrato con las cartas que ya pusiste
 const showS=pl&&!dn&&staged.length,SL=showS?slotLay(staged,L.band):null;L.slots=SL;
 slots.forEach((m,k)=>{if(!showS||k>=staged.length)m.visible=false});
 if(showS)staged.forEach((g,k)=>{const p=SL.pos[k];let m=slots.get(k);
  if(!m){m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:ghostTex(),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.renderOrder=1;SC.add(m);slots.set(k,m)}
  const ok=okSlot(g),fit=!ok&&sel.size>0&&canBe(g.type,g.ids.concat([...sel].filter(x=>!g.ids.includes(x))).map(C));m.visible=true;m.position.set(p.x+p.w/2,.004,p.z);m.scale.set(p.w,SL.ch+SL.pad*2,1);Object.assign(m.userData,{bx:p.x+p.w/2,ok,fit,col:ok?0x6dff8a:fit?0x6fd3ff:g.ids.length?0xffe27a:0xffffff,hit:{t:'slot',k}});   // fit: ahí caben las que seleccionastehits.push(m);
  g.ids.forEach((id,j)=>{const key='c'+id,c=ens(key,id);live.add(key);c.castShadow=true;c.userData.hit={t:'slot',k};hits.push(c);
   go(c,SC,v3(p.x+SL.pad+SL.cw/2+j*SL.ov,.014+j*.0035,p.z),FU,SL.s,{ms:380})})});
 // tu mano en abanico
 if(me>=0&&Array.isArray(G.hands[me])){const ids=disp().map(c=>c.id),F=fan(ids);L.hand=F;
  F.forEach((f,i)=>{const key='c'+f.id,m=ens(key,f.id);live.add(key);m.castShadow=false;m.renderOrder=hov===f.id&&!sel.has(f.id)?300:10+i*2;m.userData.hit={t:'hand',id:f.id};hits.push(m);
   selGlow(m,sel.has(f.id)||(drag&&drag.m===m));if(drag&&drag.m===m)return;go(m,CA,f.pos,f.q,f.s,{ms:260})});
}
 // lo que ya no está: si otro jugador lo tomó vuela a su asiento; si no, desaparece
 meshes.forEach((m,key)=>{if(live.has(key)||m.userData.kill)return;const tk=m.userData.hit&&m.userData.hit.t=='disc'?Object.keys(took).find(k=>+k!==me):null;
  if(tk!=null&&!RM){m.userData.kill=1;target(m,SC,seatW(+tk),FD,.5,{ms:420})}else drop(key)});
 glows.forEach(g=>{if(!g.userData.used){g.visible=false;g.userData.lvl=0}});
 c4sync();bgSync();
 if(mesa)mesa.fieltro(FELT[sbg]||FELT.green);
 first=false}

// ---------- tocar y arrastrar ----------
function pick(e,only){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(only||hits,false).filter(x=>!window.FONDO||FONDO.seen(x.object));return h.length?h[0].object.userData.hit:null}
// Ratón: clic derecho y arrastrar = mover; clic de rueda (o Shift + clic derecho) = girar e inclinar; rueda = zoom.
// Dedo: arrastrar fuera de tu mano = mover; dos dedos = pellizcar para zoom, girarlos para rotar
function pDown(e){if(!active()||ap)return;if(mc)mc.toca();if(e.pointerType!=='mouse')peek(false);if(menu){menu=false;render();return}
 if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(tch.size==2){if(drag)pCancel();st=null;const [a,b]=[...tch.values()];VK.forEach(q=>VT[q]=VW[q]);VT.who=-1;
   pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VW.k,g:ground((a[0]+b[0])/2,(a[1]+b[1])/2),ang:Math.atan2(b[1]-a[1],b[0]-a[0]),acc:0,rot:false,my:(a[1]+b[1])/2,mx:(a[0]+b[0])/2,t:VW.t,mode:null};return}
  if(tch.size>2)return}
 if(e.button==1)e.preventDefault();
 const rot=e.button==1||(e.button==2&&e.shiftKey),pan=e.button==2&&!rot;if(pan||rot)cv.style.cursor=rot?'move':'grabbing';
 st={x:e.clientX,y:e.clientY,hit:pan||rot?null:pick(e),pid:e.pointerId,pan,rot,a0:VW.a,t0:VW.t,g:null};try{cv.setPointerCapture(e.pointerId)}catch(_){}
 if(e.pointerType!=='mouse'&&st.hit&&st.hit.t=='disc'){const s0=st;s0.lp=setTimeout(()=>{if(st!==s0)return;s0.peek=true;peek(true);if(navigator.vibrate)navigator.vibrate(12)},380)}}
function pMove(e){if(!active())return;if(mc&&(st||pin))mc.toca();
 if(tch.has(e.pointerId)){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(pin&&tch.size>=2){const [a,b]=[...tch.values()],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]),dd=Math.hypot(a[0]-b[0],a[1]-b[1])-pin.d;let da=wrap(ang-pin.ang);pin.ang=ang;
   // ¿inclinar o mover? si los dos dedos suben/bajan juntos sin abrirse ni girar, es inclinar
   if(!pin.mode){const dy=my-pin.my,dx=mx-pin.mx;if(Math.abs(dy)>16&&Math.abs(dd)<Math.abs(dy)*.35&&Math.abs(dx)<Math.abs(dy)*.6&&Math.abs(pin.acc+da)<.1)pin.mode='tilt';else if(Math.abs(dd)>14||Math.abs(dx)>16||Math.abs(pin.acc+da)>.12)pin.mode='free'}
   if(pin.mode=='tilt'){VT.t=pin.t+(my-pin.my)*.006;VT.who=-1;snap();return}
   if(!pin.mode)return;
   // el giro arranca hasta pasar ~7°, para que pellizcar no rote sin querer
   pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.12){pin.rot=true;da=pin.acc}if(pin.rot)VT.a=VW.a+da;
   VT.k=pin.k*(Math.hypot(a[0]-b[0],a[1]-b[1])||1)/pin.d;snap();
   const p=ground(mx,my);if(p&&pin.g){VT.x+=pin.g.x-p.x;VT.z+=pin.g.z-p.z;snap()}return}}
 if(!st){if(e.pointerType==='mouse'){const h=pick(e),id=h&&h.t=='hand'?h.id:null;peek(!!h&&h.t=='disc');c4hover(h&&h.t=='c4'?h.c:-1);cv.style.cursor=h?'pointer':'default';if(id!==hov){hov=id;sync()}}return}
 if(e.pointerId!==st.pid)return;const h=st.hit;
 if(st.peek)return;if(st.lp&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10){clearTimeout(st.lp);st.lp=null}
 if(!drag&&!st.pan&&!st.rot&&!st.g&&(!h||h.t!='hand')&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10){Object.assign(st,{rot:true,a0:VW.a,t0:VW.t,x:e.clientX,y:e.clientY});VT.who=-1;VT.top=false;cv.style.cursor='grabbing'}   // arrastrar gira alrededor de la mesa
 if(st.rot){VT.a=st.a0+(e.clientX-st.x)*.007;VT.t=st.t0+(e.clientY-st.y)*.005;VT.who=-1;snap();return}
 // arrastrar la mesa: el punto que agarraste se queda bajo el dedo
 if(!drag&&(st.g||((st.pan||!h||h.t!='hand')&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10))){if(!st.g){st.g=ground(st.x,st.y);VT.who=-1;if(!st.pan)cv.style.cursor='grabbing'}
  const p=ground(e.clientX,e.clientY);if(st.g&&p){VT.x=VW.x+st.g.x-p.x;VT.z=VW.z+st.g.z-p.z;VT.k=VW.k;snap()}return}
 if(!drag&&h&&h.t=='hand'&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10){const m=meshes.get('c'+h.id);if(m){drag={id:h.id,m,tgt:null};hov=null;sync();m.renderOrder=400}}
 if(!drag)return;const m=drag.m;m.position.copy(loc(e.clientX,e.clientY-L.ch*.15,D-.5));m.quaternion.setFromAxisAngle(X,Math.PI/2-.1);m.scale.setScalar(m.userData.T.s*1.08);
 // ¿encima de qué está? (casilla de armado, combinación o descarte)
 const t=pick(e,hits.filter(o=>o.userData.hit&&o.userData.hit.t!='hand'));drag.tgt=t&&(t.t=='meld'||t.t=='disc'||t.t=='slot')?t:null;if(!drag.tgt)drag.tgt=nearTgt(e.clientX,e.clientY,drag.id);dragHi(drag.tgt)}
// arrastrando una carta: si no está encima de nada, lo más cercano donde cabe (a menos de 1.3 del dedo): una bajada, una silueta de tu contrato o el descarte
function nearTgt(cx,cy,id){const G=V.G,me=V.me;if(me<0||G.turn!=me||G.step!='play')return null;const p=ground(cx,cy);if(!p)return null;let b=null,bd=1.3;
 const ck=(x0,x1,z0,z1,t)=>{const d=Math.hypot(Math.max(x0-p.x,0,p.x-x1),Math.max(z0-p.z,0,p.z-z1));if(d<bd){bd=d;b=t}};
 if(G.down[me]&&L.mb)L.mb.forEach((r,k)=>{const mm=G.melds[k];if(mm&&fitsMeld(id,mm))ck(r.x0,r.x1,r.z0,r.z1,{t:'meld',k})});
 const S=L.slots;if(!G.down[me]&&S)staged.forEach((g,k)=>{const q=S.pos[k],h=S.ch/2+S.pad;if(q&&canBe(g.type,g.ids.concat(id).map(C)))ck(q.x,q.x+q.w,q.z-h,q.z+h,{t:'slot',k})});
 const dw=CW*L.ps*.6,dh=CH*L.ps*.6;ck(L.disc.x-dw,L.disc.x+dw,L.disc.z-dh,L.disc.z+dh,{t:'disc'});return b}
// el destino de lo que arrastras brilla más
let hiK=null;function dragHi(t){const k=!t?null:t.t=='meld'?'m'+t.k:t.t=='disc'?'disc':t.t=='slot'?'s'+t.k:null;if(k===hiK)return;hiSet(hiK,false);hiK=k;hiSet(k,true)}
function hiSet(k,on){if(!k)return;if(k[0]=='s'){const m=slots.get(+k.slice(1));if(m)m.userData.hot=on;return}const g=glows.get(k);if(!g)return;if(on){g.userData.lv0=g.userData.lvl;g.userData.lvl=1.3}else g.userData.lvl=g.userData.lv0||0}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}
 if(!st||e.pointerId!==st.pid)return;const s=st;st=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 clearTimeout(s.lp);if(s.peek){peek(false);return}   // soltar después de ver la carta no la toma
 if(s.pan||s.rot||s.g){cv.style.cursor='default';return}
 if(drag){const d=drag;drag=null;dragHi(null);d.m.userData.T=null;noClick=Date.now();
  const G=V.G,pl=V.me>=0&&G.turn==V.me&&G.step=='play';
  if(d.tgt&&pl&&d.tgt.t=='slot')return addTo(d.tgt.k,sel.has(d.id)?[...sel]:[d.id]);
  if(d.tgt&&pl&&d.tgt.t=='meld'){sel=new Set([d.id]);render();return pegar(d.tgt.k)}
  if(d.tgt&&pl&&d.tgt.t=='disc'){sel=new Set([d.id]);render();return discard()}
  // reordenar tu mano: se mete junto a la carta más cercana
  const F=(L.hand||[]).filter(f=>f.id!==d.id);let b=-1,bd=1e12;F.forEach((f,i)=>{const dd=(e.clientX-f.x)**2+(e.clientY-f.y)**2;if(dd<bd){bd=dd;b=i}});
  const ids=F.map(f=>f.id);ids.splice(b<0?0:b+(e.clientX>F[b].x?1:0),0,d.id);myOrder=ids.concat(staged.flatMap(g=>g.ids));manual=true;sfx('place');render();return}
 if(mc&&(!s.hit||s.hit.t=='seat')&&mc.dobleToque(s.x,s.y))return;   // doble toque en la mesa: vista desde arriba (y de regreso)
 tap(s.hit)}
function pCancel(e){if(st)clearTimeout(st.lp);peek(false);if(e&&e.pointerId!=null)tch.delete(e.pointerId);if(tch.size<2)pin=null;if(drag){drag.m.userData.T=null;drag=null;dragHi(null)}st=null;sync()}
function tap(h){if(!h){if(VT.who>=0)home();return}const G=V.G,me=V.me,mine=me>=0&&G.turn==me,pl=mine&&G.step=='play',dn=me>=0&&G.down[me];
 if(h.t=='deck'){if(mine&&G.step=='draw')draw('deck');return}
 if(h.t=='disc'){if(mine&&G.step=='draw')return draw('disc');if(pl&&sel.size==1)return discard();return}
 if(h.t=='meld'){if(pl&&sel.size)return pegar(h.k);return look(G.melds[h.k].owner)}
 if(h.t=='seat')return look(h.k);
 if(h.t=='bg'){bgdiscover();if(!VT.bg){bgopen=true;bgLook();render();return}return bgTap(h.p)}
 if(h.t=='c4'){c4discover();if(!VT.c4){c4open=true;c4look();render();return}const g=c4mine();if(g)return c4drop(h.c);if(!c4g()){c4open=true;render()}return}
 if(h.t=='slot'){if(pl&&!dn)sel.size?addTo(h.k,[...sel]):backFrom(h.k);return}
 if(h.t=='hand'){if(pl)tog(h.id);else sfx('card')}}

// ---------- capa de controles (HTML encima del 3D) ----------
function hud(){const G=V.G,i=V.me,t=G.turn,mine=i==t,dn=i>=0&&G.down[i],pl=mine&&G.step=='play',drw=mine&&G.step=='draw';
 const hint=i<0?mirTxt():mine?(drw?'Toca el mazo o el descarte para robar':dn?'Pega cartas en la mesa o descarta':'Selecciona cartas y tócalas en tu contrato'):'Esperando a '+nm(t)+'…';
 // arriba: ronda y contrato, turno, cámara y ☰; abajo de ellas la ayuda o la última jugada
 const lg=(G.log||[]).slice(-1)[0],lgT=lg?`${chip(lg.k)}<b>${esc(G.players[lg.k].name)}</b> ${esc(lg.t)}`:'';
 let h=GHUD.top({st:`${G.round+1}/7 · <b>${conTxt(G.round)}</b>`,turn:mine?'¡Tu turno!':'Turno de '+nm(t),me:mine,open:menu,menu:'c3dMenu()',right:(window.MCAM?MCAM.boton(VT.top):'')+GHUD.view('c3dHome()')});
 if(!mini)h+=GHUD.hint(mine||!lgT?hint:lgT);
 // aviso (error o nota) que se desvanece solo
 const mk=(msg||'')+'|'+(G.note||'');if(mk!==msgK){msgK=mk;msgT=Date.now()}const age=Date.now()-msgT,mt=msg||G.note;
 if(mt&&age<4500)h+=GHUD.toast(msg?esc(msg):'<b>'+esc(G.note)+'</b>',age,mini);
 // jugadores alrededor de la mesa
 G.players.forEach((p,k)=>{if(k===i)return;const o=V.players[k],on=G.turn==k;
  const nj=G.melds.filter(m=>m.owner==k).length;
  h+=`<div class="ui gj-seat${on?' on':''}${o.out?' out':''}${VT.who==k?' look':''}" data-seat="${k}" onclick="c3dLook(${k})" title="Ver la mesa de ${esc(p.name)}">${chip(k)}<b>${esc(p.name)}</b> <i class="dot${o.on?' on':''}"></i><small>${o.out?'expulsado':(hc(k)+' cartas'+(nj?' · ✓ '+nj+(nj>1?' juegos':' juego'):'')+(on?(G.step=='draw'?' · robando…':' · jugando…'):''))}</small></div>`});
 h+=`<div class="ui gj-pl" id="t3pdk">Mazo · ${G.deck}</div><div class="ui gj-pl" id="t3pds">Descarte</div>`;
 // botones de abajo
 let b='';const ic=n=>UI.ico(n);
 if(i<0)b=`<span class="gj-note">${mirTxt()}</span>${V.watch?`<button class="ui-btn sec" onclick="leave()">${ic('salir')}Dejar de mirar</button>`:''}`;
 else{if(pl){const rd=!dn&&listo();if(!dn)b+=`<button class="ui-btn${rd?' go':' sec'}" onclick="c3dBajar()">${ic('abajo')}Bajarme</button>`;if(V.pend)b+=`<button class="ui-btn sec" onclick="send({t:'undoswap'})">Deshacer cambio</button>`;
   b+=`<button class="ui-btn${sel.size==1&&!rd?' go':' sec'}" onclick="discard()">Descartar</button>`}
  else if(drw&&mini)b+=`<span class="gj-note">Toca el mazo o el descarte</span>`;   // sin modo compacto ya lo dice el aviso de arriba
  if(!mine&&!G.tdc&&G.disc.length)b+=V.claim?`<span class="gj-note">Pediste comprar…</span><button class="ui-btn sec" onclick="send({t:'unbuy'})">${ic('x')}Cancelar compra</button>`:`<button class="ui-btn sec" onclick="comprar()">Comprar (+1)</button>`;
  b+=`<button class="ui-btn sec" onclick="cyc()" title="Ordenar">${ic('ordenar')}${manual?'Mi orden':sortS?'Por palo':'Por número'}</button>`;
  if(dn)b=`<span class="gj-note">✓ Bajaste</span>`+b}
 h+=GHUD.bar(b);
 if(ap)h+=apUI();
 // ayuda sobre lo seleccionado y nombres de las siluetas
 const tt=selTxt();if(tt)h+=`<div id="t3sel" class="ui${tt[0]=='✓'?' ok':tt[0]=='✗'?' no':''}">${tt}</div>`;
 if(pl&&!dn)staged.forEach((g,k)=>{const tot=staged.filter(x=>x.type==g.type).length,nn=staged.slice(0,k+1).filter(x=>x.type==g.type).length;
  h+=`<div class="ui gj-pl t3sl${okSlot(g)?' ok':''}" id="t3sl${k}">${TN[g.type]}${tot>1?' '+nn:''}${okSlot(g)?' ✓':''}</div>`});
 h+=c4UI();h+=bgUI(V.me>=0&&(c4found||c4g())?126:72);
 // menú ☰: un solo panel con pestañas (ajustes, jugadores, historial y reglas)
 if(menu){const rg=String(GM.continental.rules).replace(/^\s*<details>\s*<summary>[^<]*<\/summary>/,'').replace(/<\/details>\s*$/,'');
  const aj=GHUD.ajustes(GHUD.row('','Ayuda arriba',GHUD.sw(!mini,'c3dMini()','Ayuda arriba')),
   `<button class="ui-btn sec full" onclick="c3dAp()">${ic('ajustes')}Cambiar apariencia…</button>${V.me>=0&&(c4found||c4g())?`<button class="ui-btn sec full" onclick="c4go()">${C4IC}Conecta 4</button>`:''}${V.me>=0&&(bgfound||bgg())?`<button class="ui-btn sec full" onclick="bggo()">${BGIC}Backgammon</button>`:''}<button class="ui-btn sec full" onclick="c3dToggle()">${ic('pantalla')}Vista clásica 2D</button>${V.host?`<button class="ui-btn sec full" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">${ic('x')}Cerrar sala</button>`:''}`);
  h+=GHUD.sheet('Continental',[['aj','Ajustes',aj],['pl','Jugadores',plist()],['lg','Historial',logv()||'<p class="ui-sub gj-empty">Nada todavía.</p>'],['rg','Reglas',`<div class="gj-rt">${rg}</div>`]],'c3dMenu()')}
 return h}
// ---------- Conecta 4 entre dos jugadores (se juega durante la partida; las reglas están en el servidor) ----------
const C4IC='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" fill="#2a63c6"/><circle cx="7" cy="9" r="2.6" fill="#0d2a5c"/><circle cx="12" cy="9" r="2.6" fill="#0d2a5c"/><circle cx="17" cy="9" r="2.6" fill="#f9c623"/><circle cx="7" cy="15" r="2.6" fill="#e53935"/><circle cx="12" cy="15" r="2.6" fill="#f9c623"/><circle cx="17" cy="15" r="2.6" fill="#e53935"/></svg>';
function c4discover(){if(c4found)return;c4found=true;try{localStorage.setItem('cont_c4f','1')}catch(e){}sfx('win');confetti(30);banner('🎲 ¡Encontraste un juego secreto: Conecta 4!')}
const c4g=()=>{const L=V.G.c4s||[];return L.find(x=>x.p.includes(V.me))};
const c4disc=k=>`<i class="c4m ${k?'y':'r'}"></i>`;
function c4UI(){const G=V.G,me=V.me;if(me<0)return '';const g=c4g(),mi=g?g.p.indexOf(me):-1,op=g?g.p[1-mi]:-1;
 const myT=g&&g.st=='play'&&g.turn==mi,inv=g&&g.st=='inv'&&mi==1;
 if(fz||(!c4found&&!g))return '';
 let h=`<button id="t3c4b" class="ui ui-rb t3gb${myT||inv?' on':''}" onclick="${c4open&&VT.c4?'c4o(0)':'c4go()'}" title="Conecta 4" aria-label="Conecta 4">${C4IC}</button>`;
 // te retaron: aviso con botones aunque la ventana esté cerrada
 if(inv&&!c4open)h+=`<div id="t3c4i" class="ui ui-card t3gi">${chip(op)}<b>${nm(op)}</b> te reta a <b>Conecta 4</b><span><button class="ui-btn sec" onclick="c4a('acc')">Jugar</button><button class="ui-btn sec" onclick="c4a('end')">Ahora no</button></span></div>`;
 if(!c4open)return h;
 let b='';
 if(!g){const ks=G.players.map((_,k)=>k).filter(k=>k!==me&&!V.players[k].out),busy=k=>(G.c4s||[]).some(x=>x.st!='end'&&x.p.includes(k));
  b=`<div class="c4t">¿Contra quién quieres jugar?</div><div class="c4l">${ks.map(k=>`<button class="ui-btn sec" onclick="c4inv(${k})"${busy(k)?' disabled':''}>${chip(k)}${nm(k)}${busy(k)?' · jugando':''}</button>`).join('')||'<span>No hay otros jugadores en la sala.</span>'}</div>
   <div class="c4n">Junta 4 fichas de tu color en línea: horizontal, vertical o diagonal.</div>`}
 else if(g.st=='inv')b=mi==0?`<div class="c4t">Esperando a que <b>${nm(op)}</b> acepte…</div><div class="gj-btns"><button class="ui-btn sec" onclick="c4a('end')">Cancelar</button></div>`
  :`<div class="c4t">${chip(op)}<b>${nm(op)}</b> te reta a Conecta 4</div><div class="gj-btns"><button class="ui-btn" onclick="c4a('acc')">Jugar</button><button class="ui-btn sec" onclick="c4a('end')">Ahora no</button></div>`;
 else{const st=g.st=='play'?(myT?`${c4disc(mi)} <b>¡Tu turno!</b> Toca una columna del tablero`:`${c4disc(1-mi)} Turno de ${nm(op)}…`)
   :g.w==2?'Empate: el tablero se llenó':g.w==mi?(g.why?`🏆 ${nm(op)} se rindió: ¡ganaste!`:'🏆 <b>¡Ganaste!</b>'):(g.why?'Te rendiste':`Ganó <b>${nm(op)}</b>`);
  b=`<div class="c4s${myT?' me':''}">${st}</div><div class="c4p">${c4disc(0)} ${nm(g.p[0])} &nbsp;vs&nbsp; ${c4disc(1)} ${nm(g.p[1])}</div>
   <div class="gj-btns">${VT.c4?'<button class="ui-btn sec" onclick="c4o(0)">Volver a la mesa</button>':'<button class="ui-btn" onclick="c4go()">Ver tablero</button>'}${g.st=='play'?`<button class="ui-btn sec" onclick="if(confirm('¿Rendirte en Conecta 4?'))c4a('end')">Rendirse</button>`:`<button class="ui-btn" onclick="c4inv(${op})">Revancha</button><button class="ui-btn sec" onclick="c4a('end')">Nueva partida</button>`}</div>`}
 return h+`<div id="t3c4" class="ui ui-card t3gp" role="dialog" aria-label="Conecta 4"><div class="ui-hd"><h2 class="ui-h">Conecta 4</h2><button class="ui-x" onclick="c4o(0)" aria-label="Cerrar">${UI.ico('x')}</button></div><div class="ui-bd">${b}</div></div>`}
// sonidos y avisos cuando cambia la partida (la jugada del otro, tu turno, el final)
function c4check(){const g=c4g();if(!g){c4snap='';return}const mi=g.p.indexOf(V.me),k=[g.id,g.st,g.last,g.turn,g.w].join(':');if(k===c4snap)return;
 const o=c4snap.split(':');c4snap=k;if(!o[0]||+o[0]!==g.id){if(g.st=='inv'&&mi==1)sfx('go');return}
 if(+o[2]!==g.last)sfx('place');
 if(g.st=='end'&&o[1]!='end'){if(g.w==mi){sfx('win');confetti(40);banner('🏆 ¡Ganaste Conecta 4!')}else sfx('tick')}
 else if(g.st=='play'&&g.turn==mi&&(o[1]!='play'||+o[3]!==g.turn))setTimeout(()=>sfx('go'),350)}
// se manda directo (no con send) para no borrar las cartas que tengas seleccionadas en el Continental
const c4send=m=>api('act',{c:S.c,t:S.t,m:Object.assign({t:'c4'},m)}).then(d=>{if(d&&d.err)bad(d.err)}).catch(()=>bad('Sin conexión.'));
const c4a=op=>{const g=c4g();if(op=='acc')c4discover();if(g)c4send({op,id:g.id})};
window.c4a=c4a;window.c4o=o=>{c4open=!!o;menu=false;if(!o&&VT.c4)home();sfx('tick');render()};
window.c4go=()=>{c4open=true;menu=false;c4look();render()};
window.c4inv=k=>{c4send({op:'inv',k});sfx('card')};   // el servidor borra la partida terminada al crear la nueva
window.c4drop=c=>{const g=c4g();if(g)c4send({op:'drop',id:g.id,c})};
// ---------- ventana "Cambiar apariencia" (como la de Solitario de Windows 7) ----------
const APT={bg:{n:'Mesa',h:'Elige el color de la mesa:',o:[['green','Verde clásico'],['blue','Azul'],['red','Vino'],['orange','Ámbar'],['purple','Púrpura'],['graphite','Grafito']]},
 cards:{n:'Cartas',h:'Elige el diseño de las cartas:',o:[['classic','Clásicas'],['big','Grandes'],['black','Negras'],['retro','Retro'],['contrast','Contraste']]},
 back:{n:'Reverso',h:'Elige el reverso de la baraja:',o:[['red','Rojo'],['blue','Azul'],['green','Verde'],['gold','Dorado'],['black','Ónix'],['neon','Neón']]},
 ui:{n:'Menús',h:'Elige cómo se ven los menús y ventanas:',o:[['light','Claro'],['dark','Oscuro']]}};
const thumbs={};
// miniaturas dibujadas con las mismas texturas de la mesa 3D
function thumb(kind,v){const k=kind+v+(kind=='bg'?scards+sback:'');if(thumbs[k])return thumbs[k];const c=cnv(176,124),g=c.getContext('2d');
 const card=(im,x,y,w,a)=>{g.save();g.translate(x,y);g.rotate(a);g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=6;g.shadowOffsetY=2;g.drawImage(im,-w/2,-w*TH/TW/2,w,w*TH/TW);g.restore()};
 if(kind=='bg'){g.save();g.beginPath();g.ellipse(88,62,84,56,0,0,7);g.fillStyle='#5a2e13';g.fill();g.beginPath();g.ellipse(88,62,74,47,0,0,7);g.clip();
  g.drawImage(feltTex(v).image,0,0,176,124);const sh=g.createRadialGradient(88,40,10,88,62,90);sh.addColorStop(0,'rgba(255,255,255,.18)');sh.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=sh;g.fillRect(0,0,176,124);g.restore();
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1.5;g.beginPath();g.ellipse(88,61,83,55,0,Math.PI*1.1,Math.PI*1.9);g.stroke();
  card(backTex().image,62,62,30,-.12);card(faceTex(13).image,100,64,30,.1)}
 else if(kind=='ui'){const d=v=='dark';   // ventanita de Windows 7 en claro u oscuro
  const fr=g.createLinearGradient(0,0,0,124);fr.addColorStop(0,d?'#59616d':'#bcd3ea');fr.addColorStop(1,d?'#2a2f37':'#6f97c0');g.fillStyle=fr;rr(g,14,8,148,108,8);g.fill();
  g.fillStyle=d?'#fff':'#000';g.font='11px "Segoe UI",sans-serif';g.fillText('Juego',24,22);g.fillStyle='#c94a2f';rr(g,130,8,24,12,3);g.fill();
  g.fillStyle=d?'#2b2d31':'#f0f0f0';g.fillRect(20,28,136,82);g.fillStyle=d?'#3d6f99':'#cce4f7';g.fillRect(26,48,124,14);
  g.fillStyle=d?'#cfd3d8':'#333';[38,55,72,89].forEach(y=>{g.fillRect(32,y,y==55?70:84,4)});
  const bt=g.createLinearGradient(0,96,0,106);bt.addColorStop(0,d?'#5a5f66':'#f2f2f2');bt.addColorStop(1,d?'#26282b':'#cfcfcf');g.fillStyle=bt;rr(g,104,94,46,12,2);g.fill()}
 else if(kind=='cards'){[[0,-.28,56],[25,0,88],[32,.28,120]].forEach(([id,a,x])=>card(faceTex(id,v).image,x,66,52,a))}
 else{card(backTex(v).image,74,64,54,-.14);card(backTex(v).image,104,62,54,.1)}
 return thumbs[k]=c.toDataURL()}
const apCur=k=>k=='ui'?(dark?'dark':'light'):k=='bg'?sbg:k=='cards'?scards:sback;
function apUI(){const T=APT[ap.tab];
 return `<div class="ui-scrim ligero" onclick="c3dApClose(0)"></div><div id="t3ap" class="ui ui-sheet mid" role="dialog" aria-modal="true" aria-labelledby="t3apt"><div class="ui-hd"><h2 class="ui-h" id="t3apt">Cambiar apariencia</h2><button class="ui-x" onclick="c3dApClose(0)" aria-label="Cerrar">${UI.ico('x')}</button></div>
 <div class="ui-seg full gj-tabs" role="tablist">${Object.keys(APT).map(k=>`<button type="button" role="tab" aria-selected="${ap.tab==k}" class="${ap.tab==k?'on':''}" onclick="c3dApTab('${k}')">${APT[k].n}</button>`).join('')}</div>
 <div class="ui-bd" role="tabpanel"><span class="ui-lbl">${T.h}</span><div class="t3apg">${T.o.map(([v,n])=>`<button class="t3apo${apCur(ap.tab)==v?' on':''}" onclick="c3dApSet('${ap.tab}','${v}')" aria-pressed="${apCur(ap.tab)==v}"><img src="${thumb(ap.tab,v)}" alt=""><span>${n}</span></button>`).join('')}</div>
 <p class="ui-sub t3apn">Los cambios se ven en la mesa al instante.</p></div>
 <div class="gj-btns t3apf"><button class="ui-btn sec" onclick="c3dApClose(0)">Cancelar</button><button class="ui-btn" onclick="c3dApClose(1)">Aceptar</button></div></div>`}
function apOpen(){menu=false;ap={tab:'bg',prev:[sbg,scards,sback,dark]};render()}
function apSet(k,v){if(k=='ui')setDark(v=='dark');else if(k=='bg')sbg=v;else if(k=='cards')scards=v;else sback=v;applyStyle();sfx('card');render()}
function apClose(ok){if(!ap)return;if(!ok){[sbg,scards,sback]=ap.prev;setDark(ap.prev[3]);applyStyle()}ap=null;sfx('tick');render()}
function labels(){if(!L)return;document.querySelectorAll('#app .gj-seat').forEach(el=>{const k=+el.dataset.seat,pa=window.MPJ&&MPJ.on&&MPJ.arriba(rel(k)),[x,y]=toPx(pa||seatP(k,1).setY(.3)),hw=el.offsetWidth/2+4,hh=el.offsetHeight/2+4;
  const X=Math.max(hw,Math.min(W-hw,x)),y0=(L.top||24)-20,Y=GHUD.dodge(X,Math.max(hh+y0,Math.min(H-hh,y)),hw,hh,y0);el.style.transform=`translate(${X}px,${Y}px) translate(-50%,-50%)`});   // nunca encima de la barra de arriba
 const sl=L.slots;if(sl)sl.pos.forEach((p,k)=>{const el=document.getElementById('t3sl'+k);if(!el)return;const [x,y]=toPx(v3(p.x+p.w/2,0,p.z-sl.ch/2-sl.pad));el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`});
 const se=document.getElementById('t3sel');if(se&&L.hand){const y=Math.min(...L.hand.map(f=>f.y))-L.ch/2-10,hw=se.offsetWidth/2+6;se.style.transform=`translate(${Math.max(hw,Math.min(W-hw,W/2))}px,${y}px) translate(-50%,-100%)`}
 const pl=(id,p,up)=>{const el=document.getElementById(id);if(!el)return;const [x,y]=toPx(p);el.style.transform=`translate(${x}px,${y}px) translate(-50%,${up?'-100%':'0'})`};
 if(peekId!=null){const t=V.G.disc[V.G.disc.length-1];if(t!==peekId){peekId=null;peek(t!=null)}peekPos()}
 // si el descarte queda debajo del mazo en pantalla, el nombre del mazo va arriba de él (si no, tapa la carta del descarte)
  const dz=CH*L.ps/2+.12;if(L.deck){const up=Math.abs(L.disc.x-L.deck.x)<CW*L.ps*1.5&&L.disc.z>L.deck.z;pl('t3pdk',v3(L.deck.x,0,L.deck.z+(up?-dz:dz)),up);pl('t3pds',v3(L.disc.x,0,L.disc.z+dz))}}

// ---------- engancharse a la vista de siempre ----------
// al cerrar la ronda la mesa se queda 3 s más: el ganador baila y los demás se llevan la mano a la cabeza (c_mesa_pj.js)
let finT=0,finPh='',finCut=-1;
function active(){if(!(on&&!!S&&!!V&&V.game==='continental'&&!!V.G))return false;const G=V.G;
 if(G.phase!==finPh){if(finPh==='play'&&G.phase==='end'&&window.MPJ&&MPJ.on&&!RM)finT=performance.now()+3200;finPh=G.phase}
 return G.phase==='play'||(G.phase==='end'&&performance.now()<finT)}
function loop3(now){requestAnimationFrame(loop3);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('c3on',a);if(!a){if(finT){finT=0;if(window.MPJ)MPJ.fin(-1);render()}first=true;peek(false);if(dpvEl)dpvEl.classList.remove('on');home();document.documentElement.classList.remove('c3mini');VW.x=VW.z=0;VW.k=1;return}
 if(shR&&cv.parentNode!==root){root.prepend(cv);W=0}   // el lienzo de la casa pasa a la mesa
 if(!L||innerWidth!==W||innerHeight!==H||tkey()!==tableKey){layout();sync()}
 viewStep(dt);vivo(now,dt);step(now);if(window.MFX)MFX.paso(now);c4step(now);bgStep(now);avStep(now);pulse(now);labels();viewBtn();dpv();
 // primero el cuarto y la mesa; luego tu mano encima (que nunca la tape una cabeza ni la mesa)
 // con la casa de fondo (c_casa_fondo.js) va primero la casa y la mesa queda encima, sin su cuarto
 const fs=window.FONDO?FONDO.pinta(R,CA,'continental',{r:mesa.R,rt:2.6*mesa.R/(MESA.radio(4)+MESA.ORL)}):0;if(fs!==fz||L.roomG.visible!==!fs){fz=fs;casaModo()}
 if(!fs)R.clear();CA.layers.set(0);R.render(SC,CA);R.clearDepth();CA.layers.set(1);R.render(SC,CA);CA.layers.set(0)}
// sin su cuarto en la casa: ni el Conecta 4 ni el Backgammon escondidos; los Miis a tamaño de casa
function casaModo(){const v=!fz;L.roomG.visible=L.baseM.visible=v;mesa.escala(fz?fz*FONDO.MII:1);mesa.sillas[0].visible=true;   // en la casa las sillas a su tamaño; tu personaje también se ve sentado
 [C4B,BGB].forEach(o=>{if(o&&o.P)o.P.visible=v});if(V&&V.G)sync();if(c4found||bgfound)render()}
// con la barra de cámara abierta, su propio botón Cuadrar basta (salvo cuando miras a alguien)
function viewBtn(){const ab=document.querySelector('.gj-arr'),mv=viewed()&&!VT.top;   // uno a la vez: Arriba (en tu vista o en la de arriba) o Recentrar (cámara movida)
 if(ab){if(ab.classList.contains('on')!==!!VT.top){ab.classList.toggle('on',!!VT.top);ab.setAttribute('aria-pressed',!!VT.top)}const dsp=mv?'none':'';if(ab.style.display!==dsp)ab.style.display=dsp}if(c4open&&!!VT.c4!==c4was){c4was=!!VT.c4;render()}if(bgopen&&!!VT.bg!==bgwas){bgwas=!!VT.bg;render()}document.documentElement.classList.toggle('c3c4',!!(VT.c4||VT.bg));document.documentElement.classList.toggle('c3ap',!!ap);if(window.UI)dark=UI.noche();document.documentElement.classList.toggle('c3dark',dark);document.documentElement.classList.toggle('c3mini',mini);const el=document.getElementById('gjView');if(!el)return;const k=viewed()&&!VT.top?String(VT.c4?'c4':VT.bg?'bg':VT.who):'';if(el.dataset.k===k)return;el.dataset.k=k;
 el.style.display=k?'':'none';const p=VT.who>=0&&V.G.players[VT.who];el.title=el.ariaLabel=VT.bg||VT.c4?'Volver a la mesa (Esc)':p?'Viendo a '+p.name+' · Recentrar (Esc)':'Recentrar (Esc)';
 document.querySelectorAll('#app .gj-seat').forEach(s=>s.classList.toggle('look',+s.dataset.seat===VT.who))}
function toggle(){on=!on;menu=false;try{localStorage.setItem('cont_3d',on?'1':'0')}catch(e){}render()}
GM.continental.body=function(){
 if(!active()){const G=V&&V.G;return (G&&G.phase=='play'?`<button class="b g sm2" onclick="c3dToggle()">${UI.ico('ojo')}${on?'Vista clásica 2D':'Vista 3D'}</button>`:'')+orig()}
 // guardo lo abierto y el scroll para que no se pierda al redibujar
 GHUD.save();
 try{init();return hud()}catch(e){console.warn('Continental 3D:',e);on=false;return orig()}};
GM.continental.after=function(){if(origAfter)origAfter();if(!active())return;
 try{c4check();bgcheck()}catch(e){}
 GHUD.restore();
 try{const bb=$('#gjBar .gj-bb');if(!L||!L.top||(bb&&Math.abs(bb.getBoundingClientRect().top-L.barTop)>2))layout();sync();labels()}catch(e){console.warn('Continental 3D:',e)}};
window.c3dToggle=toggle;
window.c3dMenu=()=>{menu=!menu;render()};
window.c3dDark=()=>{setDark(!dark);menu=false;sfx('tick');render()};
window.c3dMini=()=>{mini=!mini;menu=false;try{localStorage.setItem('cont_mini',mini?'1':'0')}catch(e){}if(L)L.top=0;sfx('tick');render()};
window.c3dBajar=bajar3d;
window.c3dLook=look;
window.c3dHome=home;window.c3dArriba=()=>{if(mc)mc.arriba(!VT.top)};
window.c3dAp=apOpen;window.c3dApSet=apSet;window.c3dApClose=apClose;window.c3dApTab=k=>{ap.tab=k;render()};
// el Uno 3D usa el mismo cuarto y los mismos Miis
window.C3D={buildRoom,mkAvatar,seg,ik,setFace:(g,ex)=>window.MII&&MII.setFace(g,ex),AVP,hsh,mkC4,mkBG,bgX,bgZ,bgDir,diceFaces,pipTex,bounce,BGW,BGD,BGPW};
})();
