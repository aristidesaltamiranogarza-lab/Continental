// Continental 3D: mesa 3D a pantalla completa, estilo juegos de Windows 7. NO cambia reglas ni servidor.
// Se carga DESPUES de c_continental.js y envuelve GM.continental.body/after. Usa las mismas acciones que la vista 2D
// (draw, pegar, discard, armar, bajar...). Lobby, fin de ronda y final se ven como siempre.
(function(){
if(typeof THREE==='undefined'||typeof GM==='undefined'||!GM.continental){console.warn('Continental 3D: falta Three.js o GM.continental');return}
const orig=GM.continental.body,origAfter=GM.continental.after;
let on=true;try{on=localStorage.getItem('cont_3d')!=='0'}catch(e){}
let R,SC,CA,root,cv,ready=false,W=0,H=0,L=null,tableKey='',felt=null,tbl=null;
let menu=false,msgK='',msgT=0,dealN=-1,logN=-1,first=true,dealing=false,dl=0,hov=null,st=null,drag=null,menuOpen=new Set(),menuScroll=0,wasDown=null,bajando=0;
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
let pin=null,myTc=null,lastNow=0,peekEl=null,peekId=null,camOpen=false,camTip=false,camRep=null,ap=null;
let c4found=false,mini=false,c4open=false,c4was=false,c4snap='';   // c4: ventana de Conecta 4 abierta, última ficha animada, estado anterior (para sonidos)
   // barra de arriba oculta (modo minimalista)
try{camOpen=localStorage.getItem('cont_cam')=='1';mini=localStorage.getItem('cont_mini')=='1'}catch(e){}
const touchy=matchMedia('(pointer:coarse)').matches,lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
c4found=lsGet('cont_c4f')=='1';   // ¿ya descubriste el Conecta 4 en este dispositivo?
// menús en modo oscuro: si nunca lo has elegido, sigue al sistema
let dark=lsGet('cont_dark')!=null?lsGet('cont_dark')=='1':matchMedia('(prefers-color-scheme:dark)').matches;
const setDark=d=>{dark=d;try{localStorage.setItem('cont_dark',d?'1':'0')}catch(e){}};
// íconos de la barra de cámara (trazos simples, toman el color del botón)
const ic=d=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC={cam:ic('<path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/>'),
 rl:ic('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 3v5h5"/>'),rr:ic('<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v5h-5"/>'),
 zi:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/>'),zo:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M7.5 10.5h6"/>'),
 tu:ic('<path d="M3 18h18M6 18l3-6h6l3 6"/><path d="M12 9V3M9 6l3-3 3 3"/>'),td:ic('<path d="M2 16l5-6h10l5 6z"/><path d="M12 7V2M9 5l3 2 3-2"/>'),
 home:ic('<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>')};

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
function feltTex(st=sbg){const k='felt'+st;if(texC[k])return texC[k];
 const c=cnv(512,512),g=c.getContext('2d'),b={green:['#34a56a','#125334'],red:['#c04a52','#64181e'],blue:['#4489cf','#163f70'],orange:['#dd9240','#7e450f'],purple:['#8a5cc4','#331757'],graphite:['#636b75','#202429']}[st]||['#34a56a','#125334'];
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
 const ly=par===CA?1:0;if(m.userData.ly!==ly){m.userData.ly=ly;m.traverse(o=>o.layers.set(ly))}
 const ms=RM||(first&&!dealing)?0:(o.ms==null?430:o.ms);
 if(!ms){m.position.copy(pos);m.quaternion.copy(q);m.scale.setScalar(s);m.userData.tw=null;return}
 m.userData.tw={p0:m.position.clone(),q0:m.quaternion.clone(),s0:m.scale.x,t0:performance.now()+(o.delay||0),ms,arc:o.arc==null?(par===SC?.7:.12):o.arc}}
function step(now){meshes.forEach((m,key)=>{const w=m.userData.tw,T=m.userData.T;if(!w||(drag&&drag.m===m))return;let k=(now-w.t0)/w.ms;if(k<0)return;if(k>1)k=1;
 const e=1-Math.pow(1-k,3),a=Math.sin(Math.PI*k)*w.arc;m.position.lerpVectors(w.p0,T.pos,e);if(T.par===SC)m.position.y+=a;else m.position.z+=a;
 m.quaternion.slerpQuaternions(w.q0,T.q,e);m.scale.setScalar(w.s0+(T.s-w.s0)*e);
 if(k===1){m.userData.tw=null;if(m.userData.kill)drop(key)}})}
// brillos (mazo, descarte, combinaciones, turno). Son planos con textura suave; también sirven para tocar.
function glow(key,pos,w,h,col,lvl,hit,ry){let g=glows.get(key);
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.renderOrder=1;SC.add(g);glows.set(key,g)}
 g.visible=true;g.position.copy(pos);g.rotation.z=ry||0;g.scale.set(w/GI,h/GI,1);g.material.color.set(col);g.userData.lvl=lvl;g.userData.hit=hit||null;g.userData.used=1;if(hit)hits.push(g);return g}
function pulse(now){const p=.65+.35*Math.sin(now/260);glows.forEach(g=>{g.material.opacity=g.userData.lvl*(g.userData.lvl>.5?p:1)})
 slots.forEach(m=>{const b=m.userData;if(!m.visible)return;const k=(Date.now()-(b.badT||0))/550;m.position.x=b.bx+(k<1?Math.sin(k*40)*.09*(1-k):0);
  m.material.color.set(k<1?0xff5a4a:b.col);m.material.opacity=b.ok?.95:.55+.25*Math.sin(now/380)})}   // >.5 = parpadea

// ---------- escena y mesa ----------
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,200);SC.add(CA);
 const hl=new THREE.HemisphereLight(0xffffff,0x24402e,1.7);SC.add(hl);
 const Ld=new THREE.DirectionalLight(0xfff2da,2.6);Ld.position.set(-5,14,7);Ld.castShadow=true;Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0004;
 Object.assign(Ld.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:60});SC.add(Ld);
 const fill=new THREE.DirectionalLight(0xbfdcff,.6);fill.position.set(6,6,-4);SC.add(fill);
 const pt=new THREE.PointLight(0xffffff,1.6,0,1.4);pt.position.set(0,1.2,1);CA.add(pt);   // luz suave para tu mano
 [hl,Ld,fill,pt].forEach(l=>l.layers.enableAll());R.autoClear=false;
 root=document.createElement('div');root.id='c3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 peekEl=document.createElement('div');peekEl.id='t3peek';peekEl.className='w7 w7g';peekEl.innerHTML='<img alt=""><div class="nm"></div>';document.body.appendChild(peekEl);
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pCancel);
 cv.addEventListener('pointerleave',()=>{if(!st)peek(false);if(!st&&hov!=null){hov=null;sync()}});cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0015))},{passive:false});
 addEventListener('keydown',e=>{if(!active()||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;
  if(ap){if(e.key==='Escape')apClose(0);else if(e.key==='Enter')apClose(1);return}
  if(e.key==='Escape'){if(menu){menu=false;render()}else home();return}
  if(e.key===' '||e.key==='Home'){if(viewed()){e.preventDefault();home()}return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const c={q:'rl',e:'rr',r:'tu',f:'td',w:'up',arrowup:'up',s:'dn',arrowdown:'dn',a:'lf',arrowleft:'lf',d:'rt',arrowright:'rt','+':'zi','=':'zi','-':'zo'}[e.key.toLowerCase()];
  if(c){e.preventDefault();camStep(c)}});
 // barra de cámara: dejar presionado repite
 const stopRep=()=>{if(camRep){clearTimeout(camRep.t);clearInterval(camRep.i);camRep=null}};
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('[data-cam]');if(!b||!active())return;e.preventDefault();stopRep();const c=b.dataset.cam;
  if(c=='tog'){camOpen=!camOpen;camTip=camOpen&&!lsGet('cont_camtip');try{localStorage.setItem('cont_cam',camOpen?'1':'0')}catch(_){}sfx('tick');render();return}
  if(camTip){camTip=false;try{localStorage.setItem('cont_camtip','1')}catch(_){}render()}
  if(c=='home'){home();sfx('tick');return}
  camStep(c);camRep={t:setTimeout(()=>{camRep.i=setInterval(()=>camStep(c),90)},320)}});
 ['pointerup','pointercancel','blur'].forEach(t=>addEventListener(t,stopRep));
 requestAnimationFrame(loop3)}
function buildTable(por){if(tbl){SC.remove(tbl);tbl.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 const rx=por?4.7:7.3,rz=por?6.6:4.5;tbl=new THREE.Group();
 felt=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.12,96),new THREE.MeshStandardMaterial({map:feltTex(),roughness:.95}));felt.scale.set(rx+.05,1,rz+.05);felt.position.y=-.06;felt.receiveShadow=true;tbl.add(felt);
 const ring=(a,b,n=160)=>Array.from({length:n},(_,i)=>new THREE.Vector2(Math.cos(i/n*Math.PI*2)*a,Math.sin(i/n*Math.PI*2)*b));
 const sh=new THREE.Shape(ring(rx+.6,rz+.6));sh.holes.push(new THREE.Path(ring(rx,rz).reverse()));
 const rim=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:5,curveSegments:1}),
  new THREE.MeshPhysicalMaterial({color:0x6e3b1b,roughness:.38,clearcoat:.7,clearcoatRoughness:.25}));rim.rotation.x=-Math.PI/2;rim.position.y=-.08;rim.castShadow=true;rim.receiveShadow=true;tbl.add(rim);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1.4,96),new THREE.MeshStandardMaterial({color:0x3a1e0c,roughness:.6}));base.scale.set(rx+.62,1,rz+.62);base.position.y=-.82;tbl.add(base);
 SC.add(tbl);
 // zonas: mazo/descarte y rectángulo para las combinaciones
 const ps=por?1.25:.95,ix=rx*.62,iz=rz*.62;
 L=Object.assign(L||{},{por,rx,rz,ps});
 if(por){L.deck=v3(-1.45,0,-iz+1.1);L.disc=v3(1.45,0,-iz+1.1);L.rect={x0:-ix,x1:ix,z0:-iz+2.8,z1:iz}}
 else{L.deck=v3(-ix+.6,0,-.95);L.disc=v3(-ix+.6,0,1.15);L.rect={x0:-ix+1.6,x1:ix,z0:-iz,z1:iz}}
 // mientras no te bajes, tu lado de la mesa guarda las siluetas de tu contrato
 L.band={x0:L.rect.x0,x1:ix,z0:iz-(por?1.5:1.4),z1:iz+(por?.45:.35)};L.rectMine=Object.assign({},L.rect,{z1:L.band.z0-.15});
 const room=buildRoom(por,rx,rz);tbl.add(room);L.room=room.userData.room;
 buildC4(por,rx,rz,room.userData.c4);buildBG(room.userData.bg)}
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
function buildC4(por,rx,rz,at){c4d.clear();c4cols.length=0;
 const P=new THREE.Group(),g=new THREE.Group(),blue=new THREE.MeshPhysicalMaterial({color:0x2260d0,roughness:.28,clearcoat:1,clearcoatRoughness:.15});
 // marco con 42 hoyos (se ve a través, como el de verdad)
 const sh=new THREE.Shape();sh.moveTo(-3.7,.2);sh.lineTo(3.7,.2);sh.lineTo(3.7,6.4);sh.lineTo(-3.7,6.4);sh.closePath();
 for(let c=0;c<7;c++)for(let r=0;r<6;r++){const hp=new THREE.Path();hp.absarc(c-3,.7+r,.38,0,Math.PI*2,true);sh.holes.push(hp)}
 const fr=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2,curveSegments:18}),blue);fr.position.z=-.15;fr.castShadow=true;g.add(fr);
 [-3.4,3.4].forEach(x=>{const f=new THREE.Mesh(new THREE.BoxGeometry(.5,.25,1.6),blue);f.position.set(x,.08,0);f.castShadow=true;g.add(f)});
 // columnas para tocar: invisibles, se iluminan cuando puedes tirar ahí
 for(let c=0;c<7;c++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.98,6.2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));
  m.position.set(c-3,3.3,.24);m.userData.hit={t:'c4',c};g.add(m);c4cols.push(m)}
 g.scale.setScalar(.4);P.add(g);   // derecho, a 90°
 // mesita de madera
 const wood=new THREE.MeshStandardMaterial({color:0x5a2f14,roughness:.55}),tp=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.12,40),wood);
 tp.scale.set(2.2,1,1.2);tp.position.y=-.07;tp.receiveShadow=true;tp.castShadow=true;P.add(tp);
 const leg=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,1.4,16),wood);leg.position.y=-.8;P.add(leg);
 const ft=new THREE.Mesh(new THREE.CylinderGeometry(.9,1,.1,32),wood);ft.position.y=-1.5;P.add(ft);
 P.position.copy(at);P.rotation.y=-.5;tbl.add(P);P.updateMatrixWorld(true);
 // colores base para la penumbra: se ilumina cuando la cámara se acerca a jugar
 const mats=[blue,wood];C4B={P,g,id:null,lit:.4,mats:mats.map(m=>({m,base:m.color.clone()}))};c4light(.4)}
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
// la cara del Mii se dibuja en una textura (como los de Wii: ojos, cejas, nariz y boca "pintados")
function miiFace(A){return ctex('mii'+AVP.indexOf(A),256,256,(g,w,h)=>{const sk=new THREE.Color(A.skin),dk=`rgb(${sk.r*170|0},${sk.g*120|0},${sk.b*100|0})`;g.lineCap='round';g.lineJoin='round';
 if(A.blush){g.fillStyle='rgba(255,120,130,.32)';[[78,158],[178,158]].forEach(([x,y])=>{g.beginPath();g.ellipse(x,y,22,13,0,0,7);g.fill()})}
 [-1,1].forEach(s=>{const x=128+s*38,y=120;
  if(A.eyes=='happy'){g.strokeStyle='#1a1a1a';g.lineWidth=7;g.beginPath();g.arc(x,y+6,14,Math.PI*1.12,Math.PI*1.88);g.stroke()}
  else if(A.eyes=='dot'){g.fillStyle='#1a1a1a';g.beginPath();g.ellipse(x,y,9,14,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+3,y-5,3.5,0,7);g.fill()}
  else{g.fillStyle='#fff';g.beginPath();g.ellipse(x,y,15,19,0,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;g.stroke();
   g.fillStyle='#1a1a1a';g.beginPath();g.ellipse(x+s*-2,y+3,9,13,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(x+s*-2+3,y-3,3.5,0,7);g.fill();
   if(A.eyes=='lash'){g.strokeStyle='#1a1a1a';g.lineWidth=4;g.beginPath();g.ellipse(x,y,15,19,0,Math.PI*1.1,Math.PI*1.9);g.stroke();[0,1].forEach(i=>{g.beginPath();g.moveTo(x+s*(10+i*5),y-15+i*5);g.lineTo(x+s*(18+i*5),y-22+i*5);g.stroke()})}}
  // cejas
  g.strokeStyle=A.hc;g.lineWidth=7;g.beginPath();
  if(A.brow=='arch'){g.arc(x,y-6,20,Math.PI*1.25,Math.PI*1.75)}else if(A.brow=='angry'){g.moveTo(x-s*16,y-32);g.lineTo(x+s*14,y-24)}else{g.moveTo(x-15,y-30);g.lineTo(x+15,y-30)}g.stroke()});
 // nariz
 g.strokeStyle=dk;g.fillStyle=dk;g.lineWidth=5;
 if(A.nose=='curve'){g.beginPath();g.moveTo(130,138);g.quadraticCurveTo(122,160,134,162);g.stroke()}else if(A.nose=='wide'){g.beginPath();g.ellipse(128,158,13,7,0,0,Math.PI);g.stroke()}else{g.beginPath();g.ellipse(128,156,6,4,0,0,7);g.fill()}
 if(A.must){g.fillStyle=A.hc;g.beginPath();g.ellipse(112,174,18,7,-.25,0,7);g.ellipse(144,174,18,7,.25,0,7);g.fill()}
 // boca
 g.strokeStyle='#8a2a2a';g.fillStyle='#7a1f24';g.lineWidth=6;const my=186;
 if(A.mouth=='grin'||A.mouth=='open'){g.beginPath();g.moveTo(104,my-4);g.quadraticCurveTo(128,my+(A.mouth=='open'?34:28),152,my-4);g.closePath();g.fill();
  if(A.mouth=='grin'){g.fillStyle='#fff';g.fillRect(110,my-4,36,8)}else{g.fillStyle='#e0707a';g.beginPath();g.ellipse(128,my+12,11,6,0,0,7);g.fill()}}
 else if(A.mouth=='small'){g.beginPath();g.arc(128,my-10,12,Math.PI*.2,Math.PI*.8);g.stroke()}
 else{g.beginPath();g.arc(128,my-16,24,Math.PI*.2,Math.PI*.8);g.stroke()}
 if(A.glasses){g.strokeStyle='#202024';g.lineWidth=5;[-1,1].forEach(s=>{g.beginPath();g.ellipse(128+s*38,121,24,22,0,0,7);g.stroke()});g.beginPath();g.moveTo(114,118);g.lineTo(142,118);g.stroke()}})}
const avs=new Map(),hsh=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const UP=new THREE.Vector3(0,1,0),avDir=new THREE.Vector3(),avTgt=new THREE.Vector3(),avA=new THREE.Vector3(),avB=new THREE.Vector3();
// a quién le toca qué avatar: según su nombre, sin repetir en la sala
function avPick(){const G=V.G,used=new Set(),out={};G.players.forEach((p,k)=>{let i=hsh(p.id||p.name)%AVP.length;while(used.has(i)&&used.size<AVP.length)i=(i+1)%AVP.length;used.add(i);out[k]=i});return out}
// cápsula estirada entre dos puntos (brazos y piernas)
function seg(m,a,b){avDir.subVectors(b,a);const l=avDir.length();m.position.copy(a).addScaledVector(avDir,.5);m.quaternion.setFromUnitVectors(UP,avDir.normalize());m.scale.y=l/m.userData.len}
// codo con cinemática inversa de dos huesos (pole = hacia dónde se dobla)
function ik(sh,hand,l1,l2,pole,out){avA.subVectors(hand,sh);const L=Math.min(avA.length(),l1+l2-.002),c=(l1*l1+L*L-l2*l2)/(2*l1*L),h=l1*Math.sqrt(Math.max(0,1-c*c));avA.normalize();
 avB.copy(pole).sub(sh);avB.addScaledVector(avA,-avB.dot(avA)).normalize();return out.copy(sh).addScaledVector(avA,c*l1).addScaledVector(avB,h)}
function mkAvatar(k,pi){const A=AVP[pi],std=(c,r)=>new THREE.MeshStandardMaterial({color:c,roughness:r==null?.6:r});
 const skin=std(new THREE.Color(A.skin),.6),top=std(new THREE.Color(COL[k%10]),.7),hair=std(new THREE.Color(A.hc),.75),pants=std(A.bot,.8),shoe=std(A.shoe,.5),wood=std(0x3a1e0c,.6);
 const g=new THREE.Group(),hit={t:'seat',k},M=(geo,mat,x,y,z,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(par||g).add(m);return m};
 const limb=(r,len,mat,par)=>{const m=M(new THREE.CapsuleGeometry(r,len,4,12),mat,0,0,0,par);m.userData.len=len+2*r;return m};
 // silla
 M(new THREE.BoxGeometry(1.1,.12,1),wood,0,-.66,-.05);M(new THREE.BoxGeometry(1.1,1.35,.12),wood,0,.05,-.55);
 [[-.48,-.5],[.48,-.5],[-.48,.38],[.48,.38]].forEach(([x,z])=>M(new THREE.CylinderGeometry(.05,.05,.9,8),wood,x,-1.1,z));
 // piernas cortas y zapatos de bolita
 [-1,1].forEach(s=>{const hp=v3(s*.17,-.5,.05),kn=v3(s*.19,-.5,.72),an=v3(s*.2,-1.3,.78);
  seg(limb(.14,.45,pants),hp,kn);seg(limb(.12,.55,pants),kn,an);M(new THREE.SphereGeometry(.17,16,12),shoe,s*.2,-1.42,.86).scale.set(.85,.6,1.3)});
 M(new THREE.CapsuleGeometry(.3,.18,4,14),pants,0,-.5,0).scale.set(1.2,.75,.9);
 // cuerpo de Mii: torso corto y redondeado, sin cuello
 const body=new THREE.Group();g.add(body);
 const tor=M(new THREE.CapsuleGeometry(.33,.32,6,18),top,0,-.05,0,body);tor.scale.set(1.12,1,.85);tor.userData.hit=hit;
 // cabeza grande: cara pintada al frente
 const head=new THREE.Group();head.position.set(0,.88,0);body.add(head);
 const sk=M(new THREE.SphereGeometry(.5,36,28),skin,0,0,0,head);sk.scale.set(1,1.04,.96);sk.userData.hit=hit;
 const face=new THREE.Mesh(new THREE.SphereGeometry(.503,36,28,Math.PI/2-.95,1.9,Math.PI/2-.85,1.7),new THREE.MeshStandardMaterial({map:miiFace(A),transparent:true,alphaTest:.05,roughness:.6}));
 face.scale.copy(sk.scale);head.add(face);
 [-1,1].forEach(s=>M(new THREE.SphereGeometry(.1,12,10),skin,s*.49,-.02,0,head).scale.set(.55,1,.85));
 // peinados de Mii (en bloque, como casco)
 const cap=(t,rx,sc)=>{const c=M(new THREE.SphereGeometry(.53,32,18,0,Math.PI*2,0,Math.PI*t),hair,0,.03,-.02,head);c.rotation.x=rx;c.scale.set(sc||1.02,1.06,1);return c};
 if(A.hair=='bowl'){cap(.5,-.15,1.05);M(new THREE.CylinderGeometry(.5,.54,.12,32,1,true,-Math.PI*.75,Math.PI*1.5),hair,0,.12,0,head).material.side=THREE.DoubleSide}
 if(A.hair=='short')cap(.4,-.45);
 if(A.hair=='spiky'){cap(.45,-.35);for(let i=0;i<10;i++){const a=i/10*Math.PI*2,c=M(new THREE.ConeGeometry(.12,.32,8),hair,Math.cos(a)*.24,.46,Math.sin(a)*.24-.04,head);c.rotation.set(Math.sin(a)*.7,0,-Math.cos(a)*.7)}}
 if(A.hair=='long'){cap(.52,-.2,1.06);M(new THREE.CapsuleGeometry(.42,.42,4,16),hair,0,-.28,-.16,head).scale.set(1.1,1,.6);[-1,1].forEach(s=>M(new THREE.CapsuleGeometry(.11,.45,4,10),hair,s*.44,-.18,.1,head))}
 if(A.hair=='bun'){cap(.48,-.3);M(new THREE.SphereGeometry(.2,16,12),hair,0,.55,-.12,head)}
 if(A.hair=='cap'){cap(.4,-.3);const cp=M(new THREE.SphereGeometry(.54,28,14,0,Math.PI*2,0,Math.PI*.45),std(new THREE.Color(A.cap),.55),0,.05,0,head);cp.scale.y=1.06;
  M(new THREE.CylinderGeometry(.34,.34,.035,22,1,false,-Math.PI/2,Math.PI),std(new THREE.Color(A.cap),.55),0,.2,.36,head).rotation.x=.12}
 // brazos cortos con manos de bolita (se recalculan cada cuadro)
 const arms=[-1,1].map(s=>({s,sh:v3(s*.4,.15,0),up:limb(.1,.24,top,body),fo:limb(.095,.22,top,body),hand:M(new THREE.SphereGeometry(.13,14,10),skin,0,0,0,body),sleeve:null,el:new THREE.Vector3(),h:new THREE.Vector3()}));
 g.userData={k,pi,body,head,arms,reachT:0,cheerT:0,l1:.45,l2:.43};return g}
function avSync(){const G=V.G,want=new Set(G.players.map((_,k)=>k).filter(k=>!V.players[k].out)),pk=avPick();   // incluye tu propio avatar
 avs.forEach((g,k)=>{if(!want.has(k)||g.userData.pi!==pk[k]){SC.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});avs.delete(k)}});
 want.forEach(k=>{let g=avs.get(k);if(!g){g=mkAvatar(k,pk[k]);SC.add(g);avs.set(k,g)}const a=seatA(k);
  g.position.set(Math.cos(a)*(L.rx+1.4),0,Math.sin(a)*(L.rz+1.4));g.rotation.y=Math.atan2(-g.position.x,-g.position.z);
  g.traverse(o=>{if(o.userData.hit)hits.push(o)})})}
const POLE=[v3(-1.3,-.5,-.4),v3(1.3,-.5,-.4)];
function avStep(now){if(!avs.size||!V||!V.G)return;const G=V.G;
 avs.forEach(g=>{const u=g.userData,k=u.k,turn=G.turn===k,f=.08;
  u.body.scale.y=1+.012*Math.sin(now/650+k*1.7);u.body.rotation.x+=((turn?.12:0)-u.body.rotation.x)*f;
  // la cabeza mira a quien tiene el turno (o a sus cartas cuando le toca)
  let yaw=0,pitch=.3;if(!turn){avTgt.copy(G.turn===V.me||!avs.get(G.turn)?v3(0,1,L.rz+1):avs.get(G.turn).position.clone().setY(1.3));g.worldToLocal(avTgt);
   yaw=Math.max(-1.1,Math.min(1.1,Math.atan2(avTgt.x,avTgt.z)));pitch=.05}
  u.head.rotation.y+=(yaw-u.head.rotation.y)*f;u.head.rotation.x+=(pitch-u.head.rotation.x)*f;
  // manos sobre la orilla de la mesa; la derecha se estira al jugar; las dos arriba al bajarse
  const rt=(now-u.reachT)/700,ct=(now-u.cheerT)/1500,reach=rt>=0&&rt<1?Math.sin(rt*Math.PI):0,cheer=ct>=0&&ct<1?Math.sin(ct*Math.PI):0;
  u.arms.forEach(a=>{const s=a.s,r=s>0?reach:0;a.h.set(s*.34-s*.12*r,.36+.15*r,.72+.8*r);
   if(cheer)a.h.lerp(avTgt.set(s*.62,1.25+.15*Math.sin(now/90+s),.2),cheer);
   const pole=avDir.copy(POLE[s>0?1:0]);if(cheer)pole.y+=1.4*cheer;ik(a.sh,a.h,u.l1,u.l2,pole.clone(),a.el);
   seg(a.up,a.sh,a.el);seg(a.fo,a.el,a.h);a.hand.position.copy(a.h);if(a.sleeve)seg(a.sleeve,a.sh,avB.copy(a.sh).lerp(a.el,.42))})})}
// ---------- Backgammon: tablero 3D sobre la mesita de centro (otro juego escondido del cuarto) ----------
const BGW=3,BGD=2.3,BGBAR=.24,BGPW=(BGW-BGBAR)/12;let BGB=null,bgSel=null,bgfound=lsGet('cont_bgf')=='1',bgopen=false,bgwas=false,bgsnap='';
function bgX(i){if(i<12){const j=i;return BGW/2-(j+.5)*BGPW-(j>=6?BGBAR:0)}const j=i-12;return -BGW/2+(j+.5)*BGPW+(j>=6?BGBAR:0)}
// caras del dado con v arriba (orden de BoxGeometry: +x,-x,+y,-y,+z,-z; las opuestas suman 7)
function diceFaces(v){const o=[1,2,3,4,5,6].filter(x=>x!==v&&x!==7-v),a=o[0],b=o.find(x=>x!==a&&x!==7-a);return [a,7-a,v,7-v,b,7-b]}
const bgZ=i=>i<12?BGD/2:-BGD/2,bgDir=i=>i<12?-1:1;
function pipTex(v){return ctex('pip'+v,128,128,(g,w,h)=>{g.fillStyle='#f7f4ec';g.fillRect(0,0,w,h);g.fillStyle='#1b1b1b';const P={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]}[v];
 P.forEach(([x,y])=>{g.beginPath();g.arc(x*32,y*32,11,0,7);g.fill()})})}
function buildBG(at){const P=new THREE.Group(),g=new THREE.Group();P.add(g);P.position.copy(at);
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
 tbl.add(P);P.updateMatrixWorld(true);
 const mats=[wood,felt,red,ivory];BGB={P,g,zs,hits,ck,dice,tray,id:null,rn:-1,lit:.4,mats:mats.map(m=>({m,base:m.color.clone()}))}}
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
 Object.assign(VT,{x:wc.x-Math.sin(a)*Math.cos(e)*t,z:wc.z-Math.cos(a)*Math.cos(e)*t,k:Math.max(1.5,Math.min(KMAX,k)),a,t:e-L.el,who:-1,c4:false,bg:true});clampV();sfx('card')}
function bgdiscover(){if(bgfound)return;bgfound=true;try{localStorage.setItem('cont_bgf','1')}catch(e){}sfx('win');confetti(30);banner('🎲 ¡Encontraste un juego secreto: Backgammon!')}
const BGIC='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" fill="#5a3418"/><rect x="3.5" y="5.5" width="17" height="13" fill="#1f5b3a"/><path d="M4 5.5l1.5 6 1.5-6zM7.5 5.5l1.5 6 1.5-6zM13.5 18.5l1.5-6 1.5 6zM17 18.5l1.5-6 1.5 6z" fill="#e8dcc0"/><path d="M5.8 18.5l1.5-6 1.5 6zM15.3 5.5l1.5 6 1.5-6z" fill="#9e2a2a"/><rect x="11.4" y="5.5" width="1.2" height="13" fill="#5a3418"/></svg>';
const bgdisc=k=>`<i class="c4m" style="background:${k?'radial-gradient(circle at 35% 30%,#666,#26262b 60%)':'radial-gradient(circle at 35% 30%,#fff,#e8dcc0 60%)'}"></i>`;
function bgUI(top){const G=V.G,me=V.me;if(me<0)return '';const g=bgg(),mi=g?g.p.indexOf(me):-1,op=g?g.p[1-mi]:-1;
 const myT=g&&g.st=='play'&&g.turn==mi,inv=g&&g.st=='inv'&&mi==1;if(!bgfound&&!g)return '';
 let h=`<button id="t3bgb" class="w7 w7b t3gb${myT||inv?' p':''}" style="top:calc(env(safe-area-inset-top,0px) + ${top}px)" onclick="${bgopen&&VT.bg?'bgo(0)':'bggo()'}" title="Backgammon" aria-label="Backgammon">${BGIC}</button>`;
 if(inv&&!bgopen)h+=`<div id="t3bgi" class="w7 w7g t3gi">${chip(op)}<b>${nm(op)}</b> te reta a <b>Backgammon</b><span><button class="w7b" onclick="bga('acc')">Jugar</button><button class="w7b" onclick="bga('end')">Ahora no</button></span></div>`;
 if(!bgopen)return h;let b='';
 if(!g){const ks=G.players.map((_,k)=>k).filter(k=>k!==me&&!V.players[k].out),busy=k=>(G.bgs||[]).some(x=>x.st!='end'&&x.p.includes(k));
  b=`<div class="c4t">¿Contra quién quieres jugar?</div><div class="c4l">${ks.map(k=>`<button class="w7b" onclick="bginv(${k})"${busy(k)?' disabled':''}>${chip(k)}${nm(k)}${busy(k)?' · jugando':''}</button>`).join('')||'<span>No hay otros jugadores en la sala.</span>'}</div>
   <div class="c4n">Saca tus 15 fichas antes que tu rival. Los dados se tiran solos al empezar cada turno.</div>`}
 else if(g.st=='inv')b=mi==0?`<div class="c4t">Esperando a que <b>${nm(op)}</b> acepte…</div><div class="ft"><button class="w7b" onclick="bga('end')">Cancelar</button></div>`
  :`<div class="c4t">${chip(op)}<b>${nm(op)}</b> te reta a Backgammon</div><div class="ft"><button class="w7b dflt" onclick="bga('acc')">Jugar</button><button class="w7b" onclick="bga('end')">Ahora no</button></div>`;
 else{const dc=g.dice[0]==g.dice[1]?`${g.dice[0]}·${g.dice[0]} (dobles)`:g.dice.join(' y ');
  const st=g.st=='play'?(myT?(g.mv.length?`${bgdisc(mi)} <b>¡Tu turno!</b> Dados: ${dc}. Toca una ficha y luego a dónde moverla`:`${bgdisc(mi)} Dados: ${dc}. No tienes jugadas`):`${bgdisc(1-mi)} Turno de ${nm(op)}… (dados: ${dc})`)
   :g.w==mi?(g.why?`🏆 ${nm(op)} se rindió: ¡ganaste!`:'🏆 <b>¡Ganaste!</b>'):(g.why?'Te rendiste':`Ganó <b>${nm(op)}</b>`);
  b=`<div class="c4s${myT?' me':''}">${st}</div><div class="c4p">${bgdisc(0)} ${nm(g.p[0])} (${g.off[0]}/15) &nbsp;vs&nbsp; ${bgdisc(1)} ${nm(g.p[1])} (${g.off[1]}/15)</div>
   <div class="ft">${VT.bg?'<button class="w7b" onclick="bgo(0)">↩ Mesa</button>':'<button class="w7b dflt" onclick="bggo()">Ver tablero</button>'}${myT&&!g.mv.length?'<button class="w7b dflt" onclick="bga(\'pass\')">Pasar turno</button>':''}${g.st=='play'?`<button class="w7b" onclick="if(confirm('¿Rendirte en Backgammon?'))bga('end')">Rendirse</button>`:`<button class="w7b dflt" onclick="bginv(${op})">Revancha</button><button class="w7b" onclick="bga('end')">Nueva partida</button>`}</div>`}
 return h+`<div id="t3bg" class="w7 w7win t3gp" role="dialog" aria-label="Backgammon"><div class="wt"><span>Backgammon</span><button class="wx" onclick="bgo(0)" aria-label="Cerrar">✕</button></div><div class="wb">${b}</div></div>`}
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
 Object.assign(VT,{x:wc.x-Math.sin(a)*back,z:wc.z-Math.cos(a)*back,k:Math.max(1.5,Math.min(KMAX,k)),a,t:e-L.el,who:-1,c4:true,bg:false});clampV();sfx('card')}
// Ajusta cámara y tamaños a la pantalla: la mesa ocupa lo que queda entre la barra de arriba y tu mano.
function layout(){const w=innerWidth,h=innerHeight;W=w;H=h;R.setSize(w,h,false);
 const por=w/h<.95;if((por?'p':'l')!==tableKey){tableKey=por?'p':'l';buildTable(por)}
 const tb=$('#t3top'),bb=$('#t3bar .w7g'),top=mini?(h<500?4:14):(tb?tb.getBoundingClientRect().bottom:54)+(h<500?4:24),bar=h-(bb?bb.getBoundingClientRect().top:h-60);
 const ch=Math.max(80,Math.min(h*.22,w*.34,200));Object.assign(L,{top,bar,ch,barTop:bb?bb.getBoundingClientRect().top:0});
 document.documentElement.style.setProperty('--t3fan',Math.round(bar+ch*1.1)+'px');document.documentElement.style.setProperty('--t3bar',Math.round(bar+8)+'px');
 const rb=h-bar-ch*.62,rh=Math.max(120,rb-top),el=por?1.12:.98;
 CA.clearViewOffset();CA.aspect=w/rh;
 const pts=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;for(const y of [0,.4])pts.push(v3(Math.cos(a)*(L.rx+.75),y,Math.sin(a)*(L.rz+.75)))}
 const ext=d=>{CA.position.set(0,Math.sin(el)*d,Math.cos(el)*d);CA.lookAt(0,0,0);CA.updateProjectionMatrix();CA.updateMatrixWorld();
  let a=1e9,b=-1e9,c=1e9,e=-1e9;pts.forEach(p=>{const q=p.clone().project(CA);a=Math.min(a,q.x);b=Math.max(b,q.x);c=Math.min(c,q.y);e=Math.max(e,q.y)});return [a,b,c,e]};
 let lo=3,hi=120;for(let i=0;i<32;i++){const m=(lo+hi)/2,x=ext(m);((x[1]-x[0])/2<.98&&(x[3]-x[2])/2<.97)?hi=m:lo=m}
 const x=ext(hi),cx=(x[0]+x[1])/2,cy=(x[2]+x[3])/2;
 L.el=el;L.d=hi;CA.setViewOffset(w,rh,cx*w/2,-top-cy*rh/2,w,h);CA.updateProjectionMatrix();clampV();cam()}
// ---------- mover la cámara (tu mano es hija de la cámara, así que se queda quieta) ----------
// la cámara gira (a) e inclina (t) alrededor del punto (x,z) y se acerca según k
function cam(){if(!L||!L.d)return;const e=L.el+VW.t,d=L.d/VW.k;
 CA.position.set(VW.x+Math.sin(VW.a)*Math.cos(e)*d,Math.sin(e)*d,VW.z+Math.cos(VW.a)*Math.cos(e)*d);CA.lookAt(VW.x,0,VW.z);CA.updateMatrixWorld()}
function clampV(){if(!L)return;VT.k=Math.max(1,Math.min(KMAX,VT.k));const Q=L.room||{X:L.rx+2,ZB:-L.rz-6,ZF:L.rz+2};VT.x=Math.max(-Q.X+1,Math.min(Q.X-1,VT.x));VT.z=Math.max(Q.ZB-2,Math.min(Q.ZF+1,VT.z));
 VT.t=Math.max(.3-L.el,Math.min(1.5-L.el,VT.t));
 // altura mínima de la cámara: si baja de más, tu mano (que va pegada a la cámara) se mete en la mesa
 if(L.d)VT.k=Math.min(VT.k,Math.max(1,Math.sin(L.el+VT.t)*L.d/3.6))}
const VK=['x','z','k','a','t'];
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);cam()}
function viewStep(dt){const f=RM?1:1-Math.exp(-dt/110);let ch=0;
 VK.forEach(q=>{const d=VT[q]-VW[q];if(Math.abs(d)>1e-4){VW[q]+=d*f;ch=1}else if(d){VW[q]=VT[q];ch=1}});if(ch)cam()}
const viewed=()=>VT.k>1.02||Math.abs(VT.x)>.05||Math.abs(VT.z)>.05||Math.abs(VT.a)>.01||Math.abs(VT.t)>.01;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// cuadrar: regresa a la vista de siempre por el camino corto
function home(){VW.a=wrap(VW.a);Object.assign(VT,{x:0,z:0,k:1,a:0,t:0,who:-1,c4:false,bg:false})}
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
// punto de la mesa debajo del dedo/ratón
function ground(cx,cy){const r=cv.getBoundingClientRect();P2.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(PL,v3(0,0,0))}
// zoom hacia un punto de la pantalla (rueda del ratón)
function zoomAt(cx,cy,k){const p=ground(cx,cy);k=Math.max(1,Math.min(KMAX,k));if(!p)return;const f=VT.k/k;VT.x=p.x-(p.x-VT.x)*f;VT.z=p.z-(p.z-VT.z)*f;VT.k=k;VT.who=-1;clampV()}
// mirar a un jugador: sus combinaciones (o su asiento si no se ha bajado). Tocarlo otra vez regresa a la mesa completa
function look(k){if(!L)return;if(VT.who===k)return home();const bs=(L.mb||[]).filter(b=>b.o===k);let x0,x1,z0,z1;
 if(bs.length){x0=Math.min(...bs.map(b=>b.x0));x1=Math.max(...bs.map(b=>b.x1));z0=Math.min(...bs.map(b=>b.z0));z1=Math.max(...bs.map(b=>b.z1))}
 else{const p=seatP(k,.84);x0=p.x-1.5;x1=p.x+1.5;z0=p.z-1;z1=p.z+1}
 const kk=Math.min(2*(L.rx+.75)/(x1-x0+1.2),2*(L.rz+.75)/(z1-z0+1.2))*.9;
 Object.assign(VT,{x:(x0+x1)/2,z:(z0+z1)/2,k:Math.max(1.5,Math.min(KMAX,kk)),who:k,c4:false});clampV();sfx('card')}
function loc(px,py,d){const v=v3(px/W*2-1,1-py/H*2,.5).applyMatrix4(CA.projectionMatrixInverse);return v.multiplyScalar(-d/v.z)}
function toPx(p){const q=p.clone().project(CA);return [(q.x+1)/2*W,(1-q.y)/2*H]}

// ---------- posiciones ----------
function seatA(k){const n=V.G.players.length,me=V.me<0?0:V.me;return Math.PI/2+((k-me+n)%n)*(2*Math.PI/n)}
function seatP(k,f){const a=seatA(k);return v3(Math.cos(a)*L.rx*f,0,Math.sin(a)*L.rz*f)}
// abanico de tu mano en la parte de abajo de la pantalla (las cartas son hijas de la cámara)
function fan(ids,x0=0,x1=W){const n=ids.length,ch=L.ch,cw=ch/CH*CW,upp=(loc(W,0,D).x-loc(0,0,D).x)/W,av=x1-x0-20,cx=(x0+x1)/2,out=[];
 let rows=1,per=n,stp=n>1?Math.min(cw*.62,(av-cw)/(n-1)):0;if(n>9&&stp<cw*.2){rows=2;per=Math.ceil(n/2);stp=Math.min(cw*.62,(av-cw)/(per-1))}
 ids.forEach((id,i)=>{const r=rows==2&&i>=per?1:0,j=r?i-per:i,rn=r?n-per:Math.min(n,per),off=j-(rn-1)/2,dx=off*stp,u=dx/((x1-x0)/2);
  let y=H-Math.max(L.bar,72)-8-ch/2+u*u*ch*.18-(rows==2&&!r?ch*.42:0);if(sel.has(id))y-=ch*.2;else if(hov===id)y-=ch*.08;
  const ang=Math.max(-.3,Math.min(.3,-u*.22)),d=D-i*.004-(r?.03:0);
  out.push({id,x:cx+dx,y,pos:loc(cx+dx,y,d),q:new THREE.Quaternion().setFromAxisAngle(Z,ang).multiply(new THREE.Quaternion().setFromAxisAngle(X,Math.PI/2-.16)),s:ch*upp/CH})});
 return out}
function meldLay(ms,r){
 for(let s=.9;;s-=.03){const cw=s*CW,ch=s*CH,ov=cw*.36,gx=cw*.32,gz=ch*.24,rows=[[]];let x=r.x0,z=r.z0;
  ms.forEach((m,k)=>{const mw=cw+(m.cards.length-1)*ov;if(x+mw>r.x1+1e-6&&x>r.x0){x=r.x0;z+=ch+gz;rows.push([])}rows[rows.length-1].push({k,x,z,mw});x+=mw+gx});
  if(z+ch<=r.z1||s<=.24){const out=[];rows.forEach(rw=>{if(!rw.length)return;const e=rw[rw.length-1],sh=(r.x1-(e.x+e.mw))/2;rw.forEach(p=>{p.x+=sh;out[p.k]=p})});return {s,cw,ch,ov,pos:out}}}}

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
function sync(){if(!ready||!L||!active())return;
 const G=V.G,n=G.players.length,me=V.me,live=new Set(),mine=me>=0&&G.turn==me,pl=mine&&G.step=='play',dn=me>=0&&G.down[me];
 hits.length=0;glows.forEach(g=>{g.userData.used=0});
 if(pl&&!dn&&!staged.length)staged=types().map(type=>({type,ids:[]}));if(dn&&staged.length)staged=[];
 // te acabas de bajar: festejo
 if(me>=0){if(wasDown===false&&dn&&!first){sfx('go');confetti(40);banner('¡Te bajaste!')}wasDown=!!dn}
 // ronda nueva: se recoge todo y se reparte desde el mazo
 if(G.dn!==dealN){dealing=dealN>=0;dealN=G.dn;logN=-1;meshes.forEach((m,k)=>drop(k));home()}else dealing=false;dl=0;
 // empieza tu turno: si estabas mirando a alguien, la cámara regresa a la mesa
 if(mine&&myTc!==G.tc){myTc=G.tc;if(VT.who>=0||VT.c4||VT.bg)home();if((c4open||bgopen)&&W<700&&!first){c4open=bgopen=false;render()}}
 // qué pasó desde la última vez (para saber de dónde sale cada carta)
 const from={},took={},tnow=performance.now();(G.log||[]).forEach(e=>{if(e.n<=logN)return;const av=logN>=0&&avs.get(e.k);if(av){if(/^se bajó/.test(e.t))av.userData.cheerT=tnow;else av.userData.reachT=tnow}if(e.c!=null&&/^(descartó|pegó|cambió)/.test(e.t))from[e.c]=e.k;if(/^(tomó|compró)/.test(e.t))took[e.k]=1});logN=Math.max(logN,G.ln||0);
 const seatW=k=>{const p=seatP(k,.84);p.y=.3;return p};
 // mazo: pila con grosor según las cartas que quedan
 const nv=G.deck?Math.min(10,Math.ceil(G.deck/5)):0;
 for(let i=0;i<nv;i++){const key='dk'+i,m=ens(key,null);live.add(key);m.userData.hit={t:'deck'};hits.push(m);m.userData.nw=0;
  target(m,SC,v3(L.deck.x+(i%2)*.006,.012+i*CT*L.ps*1.5,L.deck.z),Qe(0,(i%3-1)*.012,Math.PI),L.ps,{ms:250})}
 const drawNow=mine&&G.step=='draw';
 glow('deck',v3(L.deck.x,.004,L.deck.z),CW*L.ps*1.25,CH*L.ps*1.2,0xffd54a,drawNow?.9:0,{t:'deck'});
 // descarte: las 3 de arriba
 const top3=G.disc.slice(-3);top3.forEach((id,i)=>{const key='c'+id,m=ens(key,id,from[id]!=null?seatW(from[id]):null);live.add(key);m.userData.hit={t:'disc'};hits.push(m);
  go(m,SC,v3(L.disc.x+((id*37)%11-5)*.01,.012+i*CT*L.ps*1.6,L.disc.z+((id*17)%7-3)*.01),Qe(0,((id*13)%9-4)*.035,0),L.ps)});
 const dscOn=drawNow&&G.disc.length?.9:pl&&sel.size==1?.55:0;
 glow('disc',v3(L.disc.x,.004,L.disc.z),CW*L.ps*1.25,CH*L.ps*1.2,drawNow?0xffd54a:0x55c8ff,dscOn,{t:'disc'});
 // combinaciones en la mesa
 const ML=meldLay(G.melds,me>=0&&!dn?L.rectMine:L.rect),one=sel.size==1?[...sel][0]:drag?drag.id:null;L.mb=[];
 G.melds.forEach((mm,k)=>{const p=ML.pos[k];L.mb.push({o:mm.owner,x0:p.x,x1:p.x+p.mw,z0:p.z,z1:p.z+ML.ch});mm.cards.forEach((id,j)=>{const key='c'+id,m=ens(key,id,seatW(from[id]!=null?from[id]:mm.owner));live.add(key);m.userData.hit={t:'meld',k};hits.push(m);
   go(m,SC,v3(p.x+ML.cw/2+j*ML.ov,.012+j*.0035,p.z+ML.ch/2),FU,ML.s)});
  const can=pl&&one!=null&&dn&&fitsMeld(one,mm);
  glow('m'+k,v3(p.x+p.mw/2,.003,p.z+ML.ch/2),p.mw+.14,ML.ch+.14,can?0x55c8ff:0xffffff,can?.85:.0,{t:'meld',k});
  glow('o'+k,v3(p.x+p.mw/2,.004,p.z+ML.ch+.07),p.mw,.08,COL[mm.owner%10],.5)});
 avSync();
 // manos de los demás: cartas boca abajo frente a su asiento
 for(let k=0;k<n;k++){if(k===me)continue;const cnt=Math.min(hc(k)||0,12),a=seatA(k),c=seatP(k,.84),tg=v3(Math.sin(a),0,-Math.cos(a)),ry=Math.PI/2-a;
  for(let j=0;j<cnt;j++){const key='h'+k+'_'+j,m=ens(key,null,took[k]?L.disc:null);live.add(key);m.userData.hit={t:'seat',k};hits.push(m);const off=j-(cnt-1)/2;
   go(m,SC,c.clone().addScaledVector(tg,off*.24).setY(.012+j*.004),Qe(0,ry+off*.04,Math.PI),.5)}
  glow('t'+k,v3(c.x,.003,c.z),Math.max(1.4,cnt*.24+.8),1.15,0x55c8ff,G.turn==k?.8:0,{t:'seat',k},ry)}
 // siluetas de tu contrato con las cartas que ya pusiste
 const showS=pl&&!dn&&staged.length,SL=showS?slotLay(staged,L.band):null;L.slots=SL;
 slots.forEach((m,k)=>{if(!showS||k>=staged.length)m.visible=false});
 if(showS)staged.forEach((g,k)=>{const p=SL.pos[k];let m=slots.get(k);
  if(!m){m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:ghostTex(),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.renderOrder=1;SC.add(m);slots.set(k,m)}
  const ok=okSlot(g);m.visible=true;m.position.set(p.x+p.w/2,.004,p.z);m.scale.set(p.w,SL.ch+SL.pad*2,1);Object.assign(m.userData,{bx:p.x+p.w/2,ok,col:ok?0x6dff8a:g.ids.length?0xffe27a:0xffffff,hit:{t:'slot',k}});hits.push(m);
  g.ids.forEach((id,j)=>{const key='c'+id,c=ens(key,id);live.add(key);c.castShadow=true;c.userData.hit={t:'slot',k};hits.push(c);
   go(c,SC,v3(p.x+SL.pad+SL.cw/2+j*SL.ov,.014+j*.0035,p.z),FU,SL.s,{ms:380})})});
 // tu mano en abanico
 if(me>=0&&Array.isArray(G.hands[me])){const ids=disp().map(c=>c.id),F=fan(ids);L.hand=F;
  F.forEach(f=>{const key='c'+f.id,m=ens(key,f.id);live.add(key);m.castShadow=false;m.userData.hit={t:'hand',id:f.id};hits.push(m);
   selGlow(m,sel.has(f.id)||(drag&&drag.m===m));if(drag&&drag.m===m)return;go(m,CA,f.pos,f.q,f.s,{ms:260})});
}
 // lo que ya no está: si otro jugador lo tomó vuela a su asiento; si no, desaparece
 meshes.forEach((m,key)=>{if(live.has(key)||m.userData.kill)return;const tk=m.userData.hit&&m.userData.hit.t=='disc'?Object.keys(took).find(k=>+k!==me):null;
  if(tk!=null&&!RM){m.userData.kill=1;target(m,SC,seatW(+tk),FD,.5,{ms:420})}else drop(key)});
 glows.forEach(g=>{if(!g.userData.used){g.visible=false;g.userData.lvl=0}});
 c4sync();bgSync();
 if(felt&&felt.material.map!==feltTex()){felt.material.map=feltTex();felt.material.needsUpdate=true}
 first=false}

// ---------- tocar y arrastrar ----------
function pick(e,only){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(only||hits,false);return h.length?h[0].object.userData.hit:null}
// Ratón: clic derecho y arrastrar = mover; clic de rueda (o Shift + clic derecho) = girar e inclinar; rueda = zoom.
// Dedo: arrastrar fuera de tu mano = mover; dos dedos = pellizcar para zoom, girarlos para rotar
function pDown(e){if(!active()||ap)return;if(e.pointerType!=='mouse')peek(false);if(menu){menu=false;render();return}
 if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(tch.size==2){if(drag)pCancel();st=null;const [a,b]=[...tch.values()];VK.forEach(q=>VT[q]=VW[q]);VT.who=-1;
   pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VW.k,g:ground((a[0]+b[0])/2,(a[1]+b[1])/2),ang:Math.atan2(b[1]-a[1],b[0]-a[0]),acc:0,rot:false,my:(a[1]+b[1])/2,mx:(a[0]+b[0])/2,t:VW.t,mode:null};return}
  if(tch.size>2)return}
 if(e.button==1)e.preventDefault();
 const rot=e.button==1||(e.button==2&&e.shiftKey),pan=e.button==2&&!rot;if(pan||rot)cv.style.cursor=rot?'move':'grabbing';
 st={x:e.clientX,y:e.clientY,hit:pan||rot?null:pick(e),pid:e.pointerId,pan,rot,a0:VW.a,t0:VW.t,g:null};try{cv.setPointerCapture(e.pointerId)}catch(_){}
 if(e.pointerType!=='mouse'&&st.hit&&st.hit.t=='disc'){const s0=st;s0.lp=setTimeout(()=>{if(st!==s0)return;s0.peek=true;peek(true);if(navigator.vibrate)navigator.vibrate(12)},380)}}
function pMove(e){if(!active())return;
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
 if(st.rot){VT.a=st.a0+(e.clientX-st.x)*.007;VT.t=st.t0+(e.clientY-st.y)*.005;VT.who=-1;snap();return}
 // arrastrar la mesa: el punto que agarraste se queda bajo el dedo
 if(!drag&&(st.g||((st.pan||!h||h.t!='hand')&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10))){if(!st.g){st.g=ground(st.x,st.y);VT.who=-1;if(!st.pan)cv.style.cursor='grabbing'}
  const p=ground(e.clientX,e.clientY);if(st.g&&p){VT.x=VW.x+st.g.x-p.x;VT.z=VW.z+st.g.z-p.z;VT.k=VW.k;snap()}return}
 if(!drag&&h&&h.t=='hand'&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10){const m=meshes.get('c'+h.id);if(m){drag={id:h.id,m,tgt:null};hov=null;sync()}}
 if(!drag)return;const m=drag.m;m.position.copy(loc(e.clientX,e.clientY-L.ch*.15,D-.5));m.quaternion.setFromAxisAngle(X,Math.PI/2-.1);m.scale.setScalar(m.userData.T.s*1.08);
 // ¿encima de qué está? (casilla de armado, combinación o descarte)
 const t=pick(e,hits.filter(o=>o.userData.hit&&o.userData.hit.t!='hand'));drag.tgt=t&&(t.t=='meld'||t.t=='disc'||t.t=='slot')?t:null}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}
 if(!st||e.pointerId!==st.pid)return;const s=st;st=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 clearTimeout(s.lp);if(s.peek){peek(false);return}   // soltar después de ver la carta no la toma
 if(s.pan||s.rot||s.g){cv.style.cursor='default';return}
 if(drag){const d=drag;drag=null;d.m.userData.T=null;noClick=Date.now();
  const G=V.G,pl=V.me>=0&&G.turn==V.me&&G.step=='play';
  if(d.tgt&&pl&&d.tgt.t=='slot')return addTo(d.tgt.k,sel.has(d.id)?[...sel]:[d.id]);
  if(d.tgt&&pl&&d.tgt.t=='meld'){sel=new Set([d.id]);render();return pegar(d.tgt.k)}
  if(d.tgt&&pl&&d.tgt.t=='disc'){sel=new Set([d.id]);render();return discard()}
  // reordenar tu mano: se mete junto a la carta más cercana
  const F=(L.hand||[]).filter(f=>f.id!==d.id);let b=-1,bd=1e12;F.forEach((f,i)=>{const dd=(e.clientX-f.x)**2+(e.clientY-f.y)**2;if(dd<bd){bd=dd;b=i}});
  const ids=F.map(f=>f.id);ids.splice(b<0?0:b+(e.clientX>F[b].x?1:0),0,d.id);myOrder=ids.concat(staged.flatMap(g=>g.ids));manual=true;sfx('place');render();return}
 tap(s.hit)}
function pCancel(e){if(st)clearTimeout(st.lp);peek(false);if(e&&e.pointerId!=null)tch.delete(e.pointerId);if(tch.size<2)pin=null;if(drag){drag.m.userData.T=null;drag=null}st=null;sync()}
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
 const hint=i<0?'Mirando como host':mine?(drw?'Toca el mazo o el descarte para robar':dn?'Pega cartas en la mesa o descarta':'Selecciona cartas y tócalas en tu contrato'):'Esperando a '+nm(t)+'…';
 let h=`<div id="t3top" class="w7 w7g${mine?' me':''}"><button class="w7b" onclick="c3dMenu()" aria-label="Menú">☰ Juego</button>
  <div class="inf"><div class="l1">Ronda ${G.round+1}/7 · <b>${conTxt(G.round)}</b></div><div class="l2">${mine?'<b>¡Tu turno!</b> '+hint:hint}</div></div>
  <button class="w7b" onclick="c3dMini()" title="Ocultar la barra" aria-label="Ocultar la barra">▴</button><button class="w7b" onclick="c3dToggle()" title="Vista clásica 2D">2D</button></div>`;
 // modo minimalista: solo una pastilla con el menú, el contrato (o tu turno) y el botón para regresar la barra
 if(mini)h=`<div id="t3mini" class="w7 w7g${mine?' me':''}"><button class="w7b" onclick="c3dMenu()" aria-label="Menú">☰</button><span class="st">${mine?'<b>¡Tu turno!</b>':esc(conTxt(G.round))}</span><button class="w7b" onclick="c3dMini()" title="Mostrar la barra" aria-label="Mostrar la barra">▾</button></div>`;
 const lg=(G.log||[]).slice(-1)[0];if(lg&&!mini)h+=`<div id="t3log" class="w7">${chip(lg.k)}<b>${esc(G.players[lg.k].name)}</b> ${esc(lg.t)}</div>`;
 // aviso (error o nota) que se desvanece solo
 const mk=(msg||'')+'|'+(G.note||'');if(mk!==msgK){msgK=mk;msgT=Date.now()}const age=Date.now()-msgT,mt=msg||G.note;
 if(mt&&age<4500)h+=`<div class="w7 t3msg" style="animation-delay:-${age}ms">${msg?esc(msg):'<b>'+esc(G.note)+'</b>'}</div>`;
 // jugadores alrededor de la mesa
 G.players.forEach((p,k)=>{if(k===i)return;const o=V.players[k],on=G.turn==k;
  const nj=G.melds.filter(m=>m.owner==k).length;
  h+=`<div class="w7 w7g t3seat${on?' on':''}${o.out?' out':''}${VT.who==k?' look':''}" data-seat="${k}" onclick="c3dLook(${k})" title="Ver la mesa de ${esc(p.name)}">${chip(k)}<b>${esc(p.name)}</b> <i class="dot${o.on?' on':''}"></i><small>${o.out?'expulsado':(hc(k)+' cartas'+(nj?' · ✓ '+nj+(nj>1?' juegos':' juego'):'')+(on?(G.step=='draw'?' · robando…':' · jugando…'):''))}</small></div>`});
 h+=`<div class="w7 t3pl" id="t3pdk">Mazo · ${G.deck}</div><div class="w7 t3pl" id="t3pds">Descarte</div>`;
 // botones de abajo
 let b='';
 if(i<0)b=`<span class="hint">Mirando como host</span>`;
 else{if(pl){const rd=!dn&&listo();if(!dn)b+=`<button class="w7b${rd?' p':''}" onclick="c3dBajar()">⬇ Bajarme</button>`;if(V.pend)b+=`<button class="w7b" onclick="send({t:'undoswap'})">↶ Deshacer cambio</button>`;
   b+=`<button class="w7b${sel.size==1&&!rd?' p':''}" onclick="discard()">Descartar</button>`}
  else if(drw)b+=`<span class="hint">👆 Toca el mazo o el descarte</span>`;
  if(!mine&&!G.tdc&&G.disc.length)b+=V.claim?`<span class="hint">Pediste comprar…</span><button class="w7b" onclick="send({t:'unbuy'})">✖ Cancelar compra</button>`:`<button class="w7b" onclick="comprar()">Comprar (+1)</button>`;
  b+=`<button class="w7b" onclick="cyc()" title="Ordenar">⇅ ${manual?'Mi orden':sortS?'Por palo':'Por número'}</button>`;
  if(dn)b=`<span class="hint">✓ Bajaste</span>`+b}
 h+=`<div id="t3bar" class="w7"><div class="w7g">${b}</div></div>`;
 h+=`<button id="t3view" class="w7 w7b" onclick="c3dHome()" style="display:none" title="Regresar a la vista de siempre (Esc)">${IC.home} Cuadrar</button>`;
 const cb=(c,t)=>`<button class="w7b" data-cam="${c}" title="${t}" aria-label="${t}">${IC[c]}</button>`;
 h+=`<div id="t3cam" class="w7${camOpen?' open':''}"><button class="w7b tog" data-cam="tog" title="Cámara" aria-label="Cámara" aria-expanded="${camOpen}">${IC.cam}</button>
  <div class="w7g pan">${cb('rl','Girar a la izquierda (Q)')}${cb('rr','Girar a la derecha (E)')}${cb('zi','Acercar (+)')}${cb('zo','Alejar (−)')}${cb('tu','Ver más desde arriba (R)')}${cb('td','Ver más de lado (F)')}
  <button class="w7b wide" data-cam="home" title="Cuadrar la cámara (Esc)">${IC.home} Cuadrar</button></div>
  ${camOpen&&camTip?`<div class="tip">${touchy?'<b>Con los dedos</b><br>☝ Arrastra la mesa para moverla<br>🤏 Pellizca para acercar<br>🔄 Gira dos dedos para rotar':'<b>Con el ratón</b><br>Clic derecho y arrastra: mover<br>Rueda: acercar<br>Clic de rueda (o Shift + clic derecho): girar e inclinar<br>Teclado: W A S D, Q / E, R / F'}</div>`:''}</div>`;
 if(ap)h+=apUI();
 // ayuda sobre lo seleccionado y nombres de las siluetas
 const tt=selTxt();if(tt)h+=`<div id="t3sel" class="w7 w7g${tt[0]=='✓'?' ok':tt[0]=='✗'?' no':''}">${tt}</div>`;
 if(pl&&!dn)staged.forEach((g,k)=>{const tot=staged.filter(x=>x.type==g.type).length,nn=staged.slice(0,k+1).filter(x=>x.type==g.type).length;
  h+=`<div class="w7 t3pl t3sl${okSlot(g)?' ok':''}" id="t3sl${k}">${TN[g.type]}${tot>1?' '+nn:''}${okSlot(g)?' ✓':''}</div>`});
 h+=c4UI();h+=bgUI(V.me>=0&&(c4found||c4g())?108:58);
 // menú Juego
 if(menu){const op=k=>menuOpen.has(k)?' open':'';
  h+=`<div id="t3menu" class="w7"><button class="mi" onclick="mute=!mute;render()">${mute?'🔇 Efectos de sonido: apagados':'🔊 Efectos de sonido: encendidos'}</button><button class="mi" onclick="musCyc()">${musName()=='apagada'?'🔇':'🎵'} Música: ${musName()}</button><button class="mi" onclick="c3dToggle()">🖼 Vista clásica 2D</button><button class="mi" onclick="c3dDark()">${dark?'☀️ Menús en modo claro':'🌙 Menús en modo oscuro'}</button><button class="mi" onclick="c3dMini()">${mini?'▾ Mostrar la barra de arriba':'▴ Ocultar la barra de arriba'}</button><hr>
  <button class="mi" onclick="c3dAp()">🎨 Cambiar apariencia…</button>${V.me>=0&&(c4found||c4g())?'<button class="mi" onclick="c4go()">🔴 Conecta 4</button>':''}${V.me>=0&&(bgfound||bgg())?'<button class="mi" onclick="bggo()">🎲 Backgammon</button>':''}<details data-k="pl"${op('pl')}><summary class="mi">👥 Jugadores</summary>${plist()}</details>
  <details data-k="lg"${op('lg')}><summary class="mi">📜 Historial</summary>${logv()||'<div class="rt">Nada todavía.</div>'}</details>
  ${GM.continental.rules.replace('<details>',`<details data-k="rg"${op('rg')}>`).replace('<summary>Reglas</summary>','<summary class="mi">📖 Reglas</summary><div class="rt">').replace(/<\/details>$/,'</div></details>')}
  ${V.host?`<hr><button class="mi" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">✖ Cerrar sala</button>`:''}</div>`}
 return h}
// ---------- Conecta 4 entre dos jugadores (se juega durante la partida; las reglas están en el servidor) ----------
const C4IC='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" fill="#2a63c6"/><circle cx="7" cy="9" r="2.6" fill="#0d2a5c"/><circle cx="12" cy="9" r="2.6" fill="#0d2a5c"/><circle cx="17" cy="9" r="2.6" fill="#f9c623"/><circle cx="7" cy="15" r="2.6" fill="#e53935"/><circle cx="12" cy="15" r="2.6" fill="#f9c623"/><circle cx="17" cy="15" r="2.6" fill="#e53935"/></svg>';
function c4discover(){if(c4found)return;c4found=true;try{localStorage.setItem('cont_c4f','1')}catch(e){}sfx('win');confetti(30);banner('🎲 ¡Encontraste un juego secreto: Conecta 4!')}
const c4g=()=>{const L=V.G.c4s||[];return L.find(x=>x.p.includes(V.me))};
const c4disc=k=>`<i class="c4m ${k?'y':'r'}"></i>`;
function c4UI(){const G=V.G,me=V.me;if(me<0)return '';const g=c4g(),mi=g?g.p.indexOf(me):-1,op=g?g.p[1-mi]:-1;
 const myT=g&&g.st=='play'&&g.turn==mi,inv=g&&g.st=='inv'&&mi==1;
 if(!c4found&&!g)return '';
 let h=`<button id="t3c4b" class="w7 w7b t3gb${myT||inv?' p':''}" onclick="${c4open&&VT.c4?'c4o(0)':'c4go()'}" title="Conecta 4" aria-label="Conecta 4">${C4IC}</button>`;
 // te retaron: aviso con botones aunque la ventana esté cerrada
 if(inv&&!c4open)h+=`<div id="t3c4i" class="w7 w7g t3gi">${chip(op)}<b>${nm(op)}</b> te reta a <b>Conecta 4</b><span><button class="w7b" onclick="c4a('acc')">Jugar</button><button class="w7b" onclick="c4a('end')">Ahora no</button></span></div>`;
 if(!c4open)return h;
 let b='';
 if(!g){const ks=G.players.map((_,k)=>k).filter(k=>k!==me&&!V.players[k].out),busy=k=>(G.c4s||[]).some(x=>x.st!='end'&&x.p.includes(k));
  b=`<div class="c4t">¿Contra quién quieres jugar?</div><div class="c4l">${ks.map(k=>`<button class="w7b" onclick="c4inv(${k})"${busy(k)?' disabled':''}>${chip(k)}${nm(k)}${busy(k)?' · jugando':''}</button>`).join('')||'<span>No hay otros jugadores en la sala.</span>'}</div>
   <div class="c4n">Junta 4 fichas de tu color en línea: horizontal, vertical o diagonal.</div>`}
 else if(g.st=='inv')b=mi==0?`<div class="c4t">Esperando a que <b>${nm(op)}</b> acepte…</div><div class="ft"><button class="w7b" onclick="c4a('end')">Cancelar</button></div>`
  :`<div class="c4t">${chip(op)}<b>${nm(op)}</b> te reta a Conecta 4</div><div class="ft"><button class="w7b dflt" onclick="c4a('acc')">Jugar</button><button class="w7b" onclick="c4a('end')">Ahora no</button></div>`;
 else{const st=g.st=='play'?(myT?`${c4disc(mi)} <b>¡Tu turno!</b> Toca una columna del tablero`:`${c4disc(1-mi)} Turno de ${nm(op)}…`)
   :g.w==2?'Empate: el tablero se llenó':g.w==mi?(g.why?`🏆 ${nm(op)} se rindió: ¡ganaste!`:'🏆 <b>¡Ganaste!</b>'):(g.why?'Te rendiste':`Ganó <b>${nm(op)}</b>`);
  b=`<div class="c4s${myT?' me':''}">${st}</div><div class="c4p">${c4disc(0)} ${nm(g.p[0])} &nbsp;vs&nbsp; ${c4disc(1)} ${nm(g.p[1])}</div>
   <div class="ft">${VT.c4?'<button class="w7b" onclick="c4o(0)">↩ Mesa</button>':'<button class="w7b dflt" onclick="c4go()">Ver tablero</button>'}${g.st=='play'?`<button class="w7b" onclick="if(confirm('¿Rendirte en Conecta 4?'))c4a('end')">Rendirse</button>`:`<button class="w7b dflt" onclick="c4inv(${op})">Revancha</button><button class="w7b" onclick="c4a('end')">Nueva partida</button>`}</div>`}
 return h+`<div id="t3c4" class="w7 w7win t3gp" role="dialog" aria-label="Conecta 4"><div class="wt"><span>Conecta 4</span><button class="wx" onclick="c4o(0)" aria-label="Cerrar">✕</button></div><div class="wb">${b}</div></div>`}
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
 return `<div id="t3ap" class="w7 w7win" role="dialog" aria-modal="true" aria-labelledby="t3apt"><div class="wt"><span id="t3apt">Cambiar apariencia</span><button class="wx" onclick="c3dApClose(0)" aria-label="Cerrar">✕</button></div>
 <div class="wb"><div class="tabs" role="tablist">${Object.keys(APT).map(k=>`<button role="tab" aria-selected="${ap.tab==k}" class="tab${ap.tab==k?' on':''}" onclick="c3dApTab('${k}')">${APT[k].n}</button>`).join('')}</div>
 <div class="pane" role="tabpanel"><div class="hd">${T.h}</div><div class="grid">${T.o.map(([v,n])=>`<button class="opt${apCur(ap.tab)==v?' on':''}" onclick="c3dApSet('${ap.tab}','${v}')" aria-pressed="${apCur(ap.tab)==v}"><img src="${thumb(ap.tab,v)}" alt=""><span>${n}</span></button>`).join('')}</div>
 <div class="nt">Los cambios se ven en la mesa al instante.</div></div>
 <div class="ft"><button class="w7b dflt" onclick="c3dApClose(1)">Aceptar</button><button class="w7b" onclick="c3dApClose(0)">Cancelar</button></div></div></div>`}
function apOpen(){menu=false;ap={tab:'bg',prev:[sbg,scards,sback,dark]};render()}
function apSet(k,v){if(k=='ui')setDark(v=='dark');else if(k=='bg')sbg=v;else if(k=='cards')scards=v;else sback=v;applyStyle();sfx('card');render()}
function apClose(ok){if(!ap)return;if(!ok){[sbg,scards,sback]=ap.prev;setDark(ap.prev[3]);applyStyle()}ap=null;sfx('tick');render()}
function labels(){if(!L)return;document.querySelectorAll('#app .t3seat').forEach(el=>{const k=+el.dataset.seat,av=avs.get(k),[x,y]=toPx(av?av.position.clone().setY(2.15):seatP(k,1).setY(.3)),hw=el.offsetWidth/2+4,hh=el.offsetHeight/2+4;
  el.style.transform=`translate(${Math.max(hw,Math.min(W-hw,x))}px,${Math.max(hh+(L.top||24)-20,Math.min(H-hh,y))}px) translate(-50%,-50%)`});   // nunca encima de la barra de arriba
 const sl=L.slots;if(sl)sl.pos.forEach((p,k)=>{const el=document.getElementById('t3sl'+k);if(!el)return;const [x,y]=toPx(v3(p.x+p.w/2,0,p.z-sl.ch/2-sl.pad));el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`});
 const se=document.getElementById('t3sel');if(se&&L.hand){const y=Math.min(...L.hand.map(f=>f.y))-L.ch/2-10,hw=se.offsetWidth/2+6;se.style.transform=`translate(${Math.max(hw,Math.min(W-hw,W/2))}px,${y}px) translate(-50%,-100%)`}
 const pl=(id,p)=>{const el=document.getElementById(id);if(!el)return;const [x,y]=toPx(p);el.style.transform=`translate(${x}px,${y}px) translate(-50%,0)`};
 if(peekId!=null){const t=V.G.disc[V.G.disc.length-1];if(t!==peekId){peekId=null;peek(t!=null)}peekPos()}
 const dz=CH*L.ps/2+.12;if(L.deck){pl('t3pdk',v3(L.deck.x,0,L.deck.z+dz));pl('t3pds',v3(L.disc.x,0,L.disc.z+dz))}}

// ---------- engancharse a la vista de siempre ----------
function active(){return on&&!!S&&!!V&&V.game==='continental'&&!!V.G&&V.G.phase==='play'}
function loop3(now){requestAnimationFrame(loop3);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('c3on',a);if(!a){first=true;peek(false);home();document.documentElement.classList.remove('c3mini');VW.x=VW.z=0;VW.k=1;return}
 if(!L||innerWidth!==W||innerHeight!==H){layout();sync()}
 viewStep(dt);step(now);c4step(now);bgStep(now);avStep(now);pulse(now);labels();viewBtn();
 // primero el cuarto y la mesa; luego tu mano encima (que nunca la tape una cabeza ni la mesa)
 R.clear();CA.layers.set(0);R.render(SC,CA);R.clearDepth();CA.layers.set(1);R.render(SC,CA);CA.layers.set(0)}
// con la barra de cámara abierta, su propio botón Cuadrar basta (salvo cuando miras a alguien)
function viewBtn(){if(c4open&&!!VT.c4!==c4was){c4was=!!VT.c4;render()}if(bgopen&&!!VT.bg!==bgwas){bgwas=!!VT.bg;render()}document.documentElement.classList.toggle('c3c4',!!(VT.c4||VT.bg));document.documentElement.classList.toggle('c3ap',!!ap);document.documentElement.classList.toggle('c3dark',dark);document.documentElement.classList.toggle('c3mini',mini);const el=document.getElementById('t3view');if(!el)return;const k=viewed()&&(!camOpen||VT.who>=0||VT.c4||VT.bg)?String(VT.c4?'c4':VT.bg?'bg':VT.who):'';if(el.dataset.k===k)return;el.dataset.k=k;
 el.style.display=k?'':'none';const p=VT.who>=0&&V.G.players[VT.who];el.innerHTML=VT.bg?`${BGIC} Backgammon · ${IC.home} Volver a la mesa`:VT.c4?`${C4IC} Conecta 4 · ${IC.home} Volver a la mesa`:p?`👁 <b>${esc(p.name)}</b> · ${IC.home} Cuadrar`:`${IC.home} Cuadrar`;
 document.querySelectorAll('#app .t3seat').forEach(s=>s.classList.toggle('look',+s.dataset.seat===VT.who))}
function toggle(){on=!on;menu=false;try{localStorage.setItem('cont_3d',on?'1':'0')}catch(e){}render()}
GM.continental.body=function(){
 if(!active()){const G=V&&V.G;return (G&&G.phase=='play'?`<button class="b g sm2" onclick="c3dToggle()">${on?'🖼 Vista clásica 2D':'🎲 Vista 3D'}</button>`:'')+orig()}
 // guardo lo abierto y el scroll para que no se pierda al redibujar
 const m=$('#t3menu');if(m){menuScroll=m.scrollTop;menuOpen=new Set([...m.querySelectorAll('details[open]')].map(d=>d.dataset.k))}
 try{init();return hud()}catch(e){console.warn('Continental 3D:',e);on=false;return orig()}};
GM.continental.after=function(){if(origAfter)origAfter();if(!active())return;
 try{c4check();bgcheck()}catch(e){}
 const m=$('#t3menu');if(m)m.scrollTop=menuScroll;
 try{const bb=$('#t3bar .w7g');if(!L||!L.top||(bb&&Math.abs(bb.getBoundingClientRect().top-L.barTop)>2))layout();sync();labels()}catch(e){console.warn('Continental 3D:',e)}};
window.c3dToggle=toggle;
window.c3dMenu=()=>{menu=!menu;render()};
window.c3dDark=()=>{setDark(!dark);menu=false;sfx('tick');render()};
window.c3dMini=()=>{mini=!mini;menu=false;try{localStorage.setItem('cont_mini',mini?'1':'0')}catch(e){}if(L)L.top=0;sfx('tick');render()};
window.c3dBajar=bajar3d;
window.c3dLook=look;
window.c3dHome=home;
window.c3dAp=apOpen;window.c3dApSet=apSet;window.c3dApClose=apClose;window.c3dApTab=k=>{ap.tab=k;render()};
})();
