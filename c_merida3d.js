// Mérida en Venta 3D: el tablero sobre una mesa de madera en el cuarto del Continental 3D (C3D.buildRoom), fichas yucatecas de metal con base
// del color de cada jugador, flechas que rebotan encima de cada ficha, casas y hoteles con arcos, dados que ruedan y tema Menta u Oscuro.
// Lo maneja c_meridaui.js como window.M3 (ok, show, layout, theme, follow, sync, cam, look). NO cambia reglas ni servidor.
// Cámara: 1 dedo gira e inclina; 2 dedos acercan, mueven y giran; ratón: arrastrar gira, clic derecho (o Shift) mueve, rueda acerca. Doble toque recentra.
(function(){
if(typeof THREE==='undefined'||!window.MR){console.warn('Mérida 3D: falta Three.js o c_merida.js');return}
const D=MR.D,B=MR.B,K=2048/12,K3=window.C3D||null,TOPT=1.5,KMIN=.7,KMAX=4.5,HOP=180,RS=1.6;
let EL=.95,R,SC,CA,root,cv,ready=false,failed=false,shown=false,W=0,H=0,dyn,selM,ring,rollN=-1,rollT=-1e9,dynKey='',theme='',topMat,envT=null,M1,M2,raf=0,G0=null,selI=-1;
let fol=true,back=null,touched=false,fitD=30,fitV=30,fitTop=30,lastTap=0,lastXY=[0,0],pin=null,LT={},room=null,tPrev=0,fontsOk=false,W0=0;
const ins={t:0,r:0,b:0,l:0},toks=[],arrs=[],anim=[],shownPos=[],dice=[],faces=[],ptr=new Map(),ray=new THREE.Raycaster(),P2=new THREE.Vector2(),PL0=new THREE.Plane(new THREE.Vector3(0,1,0),-.11);
const VW={x:0,z:0,k:1,a:0,t:EL},VT={x:0,z:0,k:1,a:0,t:EL},VK=['x','z','k','a','t'],v3=(x,y,z)=>new THREE.Vector3(x,y,z),wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
const css=document.createElement('style');css.textContent=`#m3root{position:fixed;inset:0;z-index:1;display:none;background:radial-gradient(ellipse at 50% 45%,#3a2c20 0%,#140e09 75%);touch-action:none;-webkit-user-select:none;user-select:none}
#m3root canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}`;document.head.appendChild(css);
// ---- geometría del tablero: 12x12, esquinas de 1.5 y casillas de 1. Lado 0 abajo (z+), 1 izquierda, 2 arriba, 3 derecha ----
function cpos(i){if(i==0)return[5.25,5.25];if(i<10)return[5-i,5.25];if(i==10)return[-5.25,5.25];if(i<20)return[-5.25,5-(i-10)];
 if(i==20)return[-5.25,-5.25];if(i<30)return[-5+(i-20),-5.25];if(i==30)return[5.25,-5.25];return[5.25,-5+(i-30)]}
const side=i=>Math.floor(i/10)%4,INW=[[0,-1],[1,0],[0,1],[-1,0]];
function sqAt(x,z){const a=Math.abs(x),b=Math.abs(z);if(a>6||b>6||(a<4.5&&b<4.5))return -1;
 if(z>4.5)return x>4.5?0:x<-4.5?10:Math.floor(5.5-x);if(z<-4.5)return x<-4.5?20:x>4.5?30:20+Math.floor(x+5.5);
 return x<0?10+Math.floor(5.5-z):30+Math.floor(z+5.5)}
// ---- texturas del tablero (una por tema) ----
const ICO={go:'⬅️',jail:'🔒',free:'🏖️',gtj:'👮',s:'❓',c:'🎁',tax:'🧾',r:'🚌'},UI={CFE:'⚡',JAPAY:'💧'};
const PAL={menta:{bg:'#cde6d0',ln:'#18201b',tx:'#18201b',sb:'#33413a',c0:'#d8ecda',c1:'#c3dcc6'},oscuro:{bg:'#1f2a25',ln:'#5f7469',tx:'#e9f0eb',sb:'#a7b8ae',c0:'#28352f',c1:'#1a231f'}},TX={};
function wrapT(g,t,mw){const w=t.split(' '),L=[];let l='';w.forEach(x=>{const y=l?l+' '+x:x;if(g.measureText(y).width>mw&&l){L.push(l);l=x}else l=y});if(l)L.push(l);return L}
function boardTex(th){if(TX[th])return TX[th];const P=PAL[th],c=document.createElement('canvas');c.width=c.height=2048;const g=c.getContext('2d'),F='Archivo,"Segoe UI","Noto Sans",system-ui,sans-serif';
 g.fillStyle=P.bg;g.fillRect(0,0,2048,2048);const gr=g.createRadialGradient(1024,1024,80,1024,1024,860);gr.addColorStop(0,P.c0);gr.addColorStop(1,P.c1);g.fillStyle=gr;g.fillRect(256,256,1536,1536);
 // logo en diagonal, como el de la caja
 g.save();g.translate(1024,1024);g.rotate(-38*Math.PI/180);g.textAlign='center';g.textBaseline='middle';g.font='900 108px '+F;
 const tw=g.measureText('MÉRIDA EN VENTA').width+80;g.fillStyle='#18201b';g.fillRect(-tw/2-14,-100,tw+28,200);g.fillStyle='#fff';g.fillRect(-tw/2-7,-93,tw+14,186);g.fillStyle='#d7261e';g.fillRect(-tw/2,-86,tw,172);
 g.fillStyle='#fff';g.fillText('MÉRIDA EN VENTA',0,6);g.fillStyle=P.sb;g.font='italic 600 56px Georgia,serif';g.fillText('la Ciudad Blanca',0,165);g.restore();
 [[-1,'❓','SUERTE','#f7a21b'],[1,'🎁','COMUNIDAD','#5bb4ec']].forEach(([s,ic,t,col])=>{g.save();g.translate(1024+s*330,1024+s*330);g.rotate(-Math.PI/4);
  g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-142,-88,300,200);g.fillStyle=col;g.strokeStyle='#18201b';g.lineWidth=8;g.beginPath();if(g.roundRect)g.roundRect(-150,-100,300,200,20);else g.rect(-150,-100,300,200);g.fill();g.stroke();
  g.fillStyle='#18201b';g.textAlign='center';g.textBaseline='middle';g.font='78px '+F;g.fillText(ic,0,-28);g.font='900 34px '+F;g.fillText(t,0,52);g.restore()});
 for(let i=0;i<40;i++){const s=B[i],[x,z]=cpos(i),cor=i%10==0,w=(cor?1.5:1)*K,h=1.5*K;g.save();g.translate((x+6)*K,(z+6)*K);g.rotate(side(i)*Math.PI/2);
  g.fillStyle=P.bg;g.fillRect(-w/2,-h/2,w,h);g.strokeStyle=P.ln;g.lineWidth=5;g.strokeRect(-w/2,-h/2,w,h);g.textAlign='center';g.textBaseline='middle';
  let y=-h/2+20;const nm=s.n.toUpperCase();
  if(s.t=='p'){g.fillStyle=D.gcol[s.g];g.fillRect(-w/2,-h/2,w,.3*K);g.strokeRect(-w/2,-h/2,w,.3*K);y+=.3*K+8}
  else if(!cor){g.font='66px '+F;g.fillStyle=P.tx;g.fillText(s.t=='u'?UI[s.n]:ICO[s.t],0,-h/2+.34*K);y+=.6*K}
  else{g.font='118px '+F;g.fillStyle=P.tx;g.fillText(ICO[s.t],0,-14)}
  let fs=cor?40:31;g.font=`800 ${fs}px ${F}`;const mw=Math.max(...nm.split(' ').map(t=>g.measureText(t).width)),lim=w-22;if(mw>lim){fs=Math.floor(fs*lim/mw);g.font=`800 ${fs}px ${F}`}
  const L=wrapT(g,nm,lim);g.fillStyle=P.tx;
  if(cor){L.forEach((l,j)=>g.fillText(l,0,-h/2+40+j*fs*1.08));if(s.s){g.fillStyle=P.sb;g.font='600 28px '+F;g.fillText(s.s,0,h/2-36)}}
  else{L.forEach((l,j)=>g.fillText(l,0,y+12+j*fs*1.08));const pr=s.p||s.v;if(pr){g.fillStyle=P.sb;g.font='700 30px '+F;g.fillText('$'+pr,0,h/2-30)}}
  g.restore()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=R.capabilities.getMaxAnisotropy();return TX[th]=t}
function pipTex(v){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#fbf7ec';g.fillRect(0,0,128,128);
 const P={1:[[64,64]],2:[[34,34],[94,94]],3:[[30,30],[64,64],[98,98]],4:[[34,34],[94,34],[34,94],[94,94]],5:[[30,30],[98,30],[64,64],[30,98],[98,98]],6:[[34,28],[94,28],[34,64],[94,64],[34,100],[94,100]]};
 g.fillStyle=v==1?'#d7261e':'#1d1d1d';P[v].forEach(([x,y])=>{g.beginPath();g.arc(x,y,v==1?18:12,0,7);g.fill()});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
// reflejos para el metal de las fichas: un cielo cálido con un par de "ventanas" brillantes
function mkEnv(){const pm=new THREE.PMREMGenerator(R),es=new THREE.Scene(),c=document.createElement('canvas');c.width=16;c.height=256;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);
 gr.addColorStop(0,'#fffaf0');gr.addColorStop(.42,'#d9cfc0');gr.addColorStop(.52,'#6d5b49');gr.addColorStop(1,'#1d1610');g.fillStyle=gr;g.fillRect(0,0,16,256);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;es.add(new THREE.Mesh(new THREE.SphereGeometry(20,32,16),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide})));
 [[9,9,5],[-9,7,-6],[2,13,-9]].forEach(([x,y,z])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(6,2.5,6),new THREE.MeshBasicMaterial({color:new THREE.Color(5,4.8,4.4)}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m)});
 envT=pm.fromScene(es,.02).texture;pm.dispose()}
// ---- piezas: figuras de metal sobre una base del color del jugador ----
const std=(c,r=.6,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r},o));
function add(G,geo,m,x=0,y=0,z=0,rx=0,ry=0,rz=0){const s=new THREE.Mesh(geo,m);s.position.set(x,y,z);s.rotation.set(rx,ry,rz);s.castShadow=true;G.add(s);return s}
const cyl=(a,b,h,n=20)=>new THREE.CylinderGeometry(a,b,h,n),box=(a,b,c)=>new THREE.BoxGeometry(a,b,c);
function piece(k){const G=new THREE.Group(),T=k%6,c=new THREE.Color(MR.pc(k)),P=new THREE.Group();
 add(G,cyl(.27,.3,.08,36),std(c,.35,{metalness:.15,emissive:c,emissiveIntensity:.22}),0,.04);add(G,new THREE.TorusGeometry(.285,.018,8,44),M1,0,.08,0,Math.PI/2);
 P.position.y=.03;G.add(P);
 if(T==0){add(P,cyl(.27,.27,.025,32),M1,0,.08);add(P,cyl(.12,.135,.16,24),M1,0,.17);add(P,cyl(.1,.12,.02,24),M1,0,.255);add(P,new THREE.TorusGeometry(.13,.016,8,28),M2,0,.11,0,Math.PI/2)}
 else if(T==1){add(P,cyl(.02,.02,.36,10),M2,-.17,.21);add(P,cyl(.02,.02,.36,10),M2,.17,.21);
  for(let j=0;j<6;j++){const z=-.075+j*.03,cv=new THREE.CatmullRomCurve3([[-.16,.34],[-.08,.2],[0,.16],[.08,.2],[.16,.34]].map(([x,y])=>v3(x,y,z)));add(P,new THREE.TubeGeometry(cv,16,.016,6),j%2?M2:M1)}
  add(P,cyl(.005,.005,.2,4),M1,-.17,.38,0,Math.PI/2);add(P,cyl(.005,.005,.2,4),M1,.17,.38,0,Math.PI/2)}
 else if(T==2){const wh=new THREE.TorusGeometry(.065,.018,8,20);add(P,wh,M2,-.13,.1,.08,0,Math.PI/2);add(P,wh,M2,.13,.1,.08,0,Math.PI/2);add(P,wh,M2,0,.1,-.16,0,Math.PI/2);
  add(P,box(.3,.06,.16),M1,0,.17,.08);add(P,box(.3,.12,.03),M1,0,.23,0);add(P,box(.04,.04,.26),M2,0,.13,-.06);add(P,box(.34,.015,.22),M1,0,.39,.07);
  [[-.15,.15],[.15,.15],[-.15,-.01],[.15,-.01]].forEach(([x,z])=>add(P,cyl(.009,.009,.2,6),M2,x,.29,z));add(P,box(.08,.03,.06),M2,0,.22,-.14);add(P,cyl(.007,.007,.2,6),M2,0,.23,-.08,0,0,Math.PI/2)}
 else if(T==3){add(P,cyl(.2,.2,.05,32),M1,0,.08);add(P,cyl(.18,.18,.015,32),M2,0,.11);[[.07,.04],[-.06,.07],[0,-.08],[-.09,-.04]].forEach(([x,z])=>add(P,cyl(.045,.045,.02,16),M1,x,.125,z));
  for(let j=0;j<7;j++){const a=j*.9;add(P,new THREE.TorusGeometry(.028,.008,6,12),M1,Math.cos(a)*.1,.137,Math.sin(a)*.1,Math.PI/2)}}
 else if(T==4){add(P,cyl(.1,.16,.34,28),M1,0,.22);add(P,box(.07,.06,.06),M1,-.13,.33,0,0,0,.5);add(P,box(.07,.06,.06),M1,.13,.33,0,0,0,-.5);add(P,new THREE.SphereGeometry(.055,16,12),M1,0,.43);
  add(P,new THREE.TorusGeometry(.13,.012,6,28),M2,0,.12,0,Math.PI/2);add(P,new THREE.TorusGeometry(.1,.01,6,28),M2,0,.32,0,Math.PI/2);add(P,new THREE.TorusGeometry(.05,.013,6,4),M2,0,.38,.09,0,0,Math.PI/4)}
 else{add(P,box(.26,.28,.1),M1,0,.2);add(P,box(.08,.14,.08),M1,-.16,.27,0,0,0,.45);add(P,box(.08,.14,.08),M1,.16,.27,0,0,0,-.45);add(P,box(.12,.03,.1),M1,0,.355);
  [-.08,-.04,.04,.08].forEach(x=>add(P,box(.01,.26,.01),M2,x,.2,.053));for(let j=0;j<5;j++)add(P,cyl(.008,.008,.008,8),M2,0,.32-j*.055,.055,Math.PI/2)}
 P.scale.setScalar(1.18);return G}
// flecha plana del color del jugador que siempre mira a la cámara; en la tuya dice "TÚ"
function arrow(k){const col=MR.pc(k),me=k===V.me,c=document.createElement('canvas');c.width=128;c.height=me?232:164;const g=c.getContext('2d'),y0=me?68:0;
 const P=()=>{g.beginPath();g.moveTo(44,y0+10);g.lineTo(84,y0+10);g.lineTo(84,y0+74);g.lineTo(114,y0+74);g.lineTo(64,y0+152);g.lineTo(14,y0+74);g.lineTo(44,y0+74);g.closePath()};
 g.lineJoin='round';P();g.lineWidth=16;g.strokeStyle='rgba(0,0,0,.35)';g.save();g.translate(3,5);g.stroke();g.restore();P();g.lineWidth=12;g.strokeStyle='#fff';g.stroke();g.fillStyle=col;g.fill();
 g.fillStyle='rgba(255,255,255,.28)';g.fillRect(50,y0+16,10,54);
 if(me){g.fillStyle='#fff';g.beginPath();g.roundRect?g.roundRect(14,4,100,58,16):g.rect(14,4,100,58);g.fill();g.fillStyle=col;g.beginPath();g.roundRect?g.roundRect(20,10,88,46,11):g.rect(20,10,88,46);g.fill();
  g.fillStyle='#fff';g.font='900 34px Archivo,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('TÚ',64,35)}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));
 s.center.set(.5,12/c.height);s.renderOrder=10;s.userData.r=c.height/c.width;return s}
// casas verdes con techo de dos aguas y hoteles rojos con arcos (toque colonial)
let HM=null;
function house(hotel){if(!HM){const rs=new THREE.Shape();rs.moveTo(-.1,0);rs.lineTo(.1,0);rs.lineTo(0,.085);rs.lineTo(-.1,0);const rg=new THREE.ExtrudeGeometry(rs,{depth:.17,bevelEnabled:false});rg.translate(0,0,-.085);
  HM={g:std(0x2e9e57,.5),r:std(0xc62828,.5),rf:std(0x1d6e3c,.55),rr:std(0x8e1b1b,.55),dk:std(0x1c1410,.8),cr:std(0xfff3e0,.7),rg}}   // techos verdes y rojos: desde arriba se leen como las casas y hoteles clásicos
 const G=new THREE.Group();
 if(!hotel){add(G,box(.15,.11,.15),HM.g,0,.055);add(G,HM.rg,HM.rf,0,.11);add(G,box(.04,.06,.006),HM.dk,0,.03,.076);return G}
 add(G,box(.36,.17,.17),HM.r,0,.085);add(G,box(.39,.03,.2),HM.rr,0,.185);
 [-.11,0,.11].forEach(x=>{add(G,box(.06,.07,.006),HM.cr,x,.05,.086);add(G,cyl(.03,.03,.006,12),HM.cr,x,.085,.086,Math.PI/2)});return G}
// ---- escena: cuarto del Continental, mesa cuadrada y el tablero encima ----
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true,alpha:true});const mob=matchMedia('(pointer:coarse)').matches;R.setPixelRatio(Math.min(devicePixelRatio||1,mob?1.75:2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,400);mkEnv();
 M1=new THREE.MeshStandardMaterial({color:0xdfe3e8,metalness:1,roughness:.24,envMap:envT,envMapIntensity:1.25});M2=new THREE.MeshStandardMaterial({color:0xa9aeb6,metalness:1,roughness:.42,envMap:envT,envMapIntensity:1});
 LT.h=new THREE.HemisphereLight(0xfff4e0,0x3a2a1e,1.5);SC.add(LT.h);
 LT.d=new THREE.DirectionalLight(0xfff0d8,2.3);LT.d.position.set(-6,16,8);LT.d.castShadow=true;LT.d.shadow.mapSize.set(mob?1024:2048,mob?1024:2048);
 Object.assign(LT.d.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:50});LT.d.shadow.bias=-.0005;SC.add(LT.d);
 LT.s=new THREE.SpotLight(0xffd9a0,0,0,.62,.55,0);LT.s.position.set(0,15,0);LT.s.target.position.set(0,0,0);SC.add(LT.s,LT.s.target);
 // mesa
 const wood=new THREE.MeshPhysicalMaterial({color:0x6e3b1b,roughness:.38,clearcoat:.7,clearcoatRoughness:.25}),dw=std(0x3a1e0c,.6);
 const rr=(w,r)=>{const s=new THREE.Shape(),h=w/2;s.moveTo(-h+r,-h);s.lineTo(h-r,-h);s.quadraticCurveTo(h,-h,h,-h+r);s.lineTo(h,h-r);s.quadraticCurveTo(h,h,h-r,h);s.lineTo(-h+r,h);s.quadraticCurveTo(-h,h,-h,h-r);s.lineTo(-h,-h+r);s.quadraticCurveTo(-h,-h,-h+r,-h);return s};
 const tg=new THREE.ExtrudeGeometry(rr(15.4,1.3),{depth:.38,bevelEnabled:true,bevelThickness:.1,bevelSize:.12,bevelSegments:4,curveSegments:10});tg.rotateX(-Math.PI/2);
 const tt=new THREE.Mesh(tg,wood);tt.position.y=-.1-.48;tt.receiveShadow=tt.castShadow=true;SC.add(tt);
 const FY=-1.55*RS,ap=new THREE.Mesh(box(13.6,.7,13.6),dw);ap.position.y=-.95;SC.add(ap);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const l=new THREE.Mesh(box(.9,-.6-FY,.9),dw);l.position.set(a*6.2,(-.6+FY)/2,b*6.2);l.castShadow=true;SC.add(l)});
 if(K3&&K3.buildRoom){try{room=K3.buildRoom(false,6.2,6.2);room.scale.setScalar(RS);SC.add(room);room.traverse(o=>{if(o.isLight)o.userData.i0=o.intensity})}catch(e){console.warn('Mérida 3D: sin cuarto',e);room=null}}
 // tablero
 const base=new THREE.Mesh(box(12.3,.2,12.3),std(0x18201b,.6));base.receiveShadow=base.castShadow=true;SC.add(base);
 topMat=new THREE.MeshStandardMaterial({roughness:.82});const top=new THREE.Mesh(new THREE.PlaneGeometry(12,12),topMat);top.rotation.x=-Math.PI/2;top.position.y=.101;top.receiveShadow=true;SC.add(top);
 dyn=new THREE.Group();SC.add(dyn);
 selM=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xff8a00,transparent:true,opacity:.42,depthWrite:false}));selM.rotation.x=-Math.PI/2;selM.position.y=.106;selM.visible=false;SC.add(selM);
 ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.035,10,40),new THREE.MeshBasicMaterial({color:0xffd54a}));ring.rotation.x=Math.PI/2;SC.add(ring);
 for(let v=1;v<=6;v++)faces[v]=new THREE.MeshStandardMaterial({map:pipTex(v),roughness:.35});
 for(let j=0;j<2;j++){const d=new THREE.Mesh(box(.5,.5,.5),[1,6,2,5,3,4].map(v=>faces[v]));d.castShadow=true;SC.add(d);dice.push(d)}
 root=document.createElement('div');root.id='m3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);if(ptr.size<2)pin=null});
 cv.addEventListener('contextmenu',e=>e.preventDefault());cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0015))},{passive:false});
 addEventListener('keydown',e=>{if(!shown||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase(),f={arrowleft:()=>VT.a-=.2,arrowright:()=>VT.a+=.2,arrowup:()=>VT.t+=.08,arrowdown:()=>VT.t-=.08,'+':()=>VT.k*=1.2,'=':()=>VT.k*=1.2,'-':()=>VT.k/=1.2,home:home}[k];
  if(f){e.preventDefault();f();touched=true;clampV()}});
 // cuando cargue la letra Archivo, se vuelven a dibujar los letreros del tablero
 let tries=0;const fw=()=>{if(fontsOk)return;if(document.fonts&&document.fonts.check('800 40px Archivo')){fontsOk=true;for(const k in TX){TX[k].dispose();delete TX[k]}const t=theme;theme='';applyTheme(t||'menta');return}if(++tries<30)setTimeout(fw,500)};fw()}
function applyTheme(t){if(t===theme||!ready)return;theme=t;topMat.map=boardTex(t);topMat.needsUpdate=true;const dk=t=='oscuro';
 LT.h.intensity=dk?.42:1.5;LT.d.intensity=dk?.45:2.3;LT.s.intensity=dk?2.6:0;root.style.background=dk?'radial-gradient(ellipse at 50% 45%,#1b1611 0%,#050403 75%)':'';
 if(room)room.traverse(o=>{if(o.isLight)o.intensity=o.userData.i0*(dk?.3:1)})}
// ---- cámara: VT = adónde va, VW = dónde está (x,z punto del tablero al centro, k zoom, a giro, t inclinación) ----
function camPos(V0,d){const e=V0.t;CA.position.set(V0.x+Math.sin(V0.a)*Math.cos(e)*d,Math.sin(e)*d,V0.z+Math.cos(V0.a)*Math.cos(e)*d);CA.lookAt(V0.x,0,V0.z);CA.updateMatrixWorld()}
const applyCam=()=>camPos(VW,fitV/VW.k);
function clampV(){VT.k=Math.max(KMIN,Math.min(KMAX,VT.k));VT.t=Math.max(.35,Math.min(TOPT,VT.t));VT.x=Math.max(-7,Math.min(7,VT.x));VT.z=Math.max(-7,Math.min(7,VT.z))}
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);applyCam()}
function home(){VW.a=wrapA(VW.a);Object.assign(VT,{x:0,z:0,k:1,a:0,t:EL});back=null}
// distancia para que el tablero completo quepa en el hueco que deja la interfaz (se busca proyectando las esquinas)
const CORN=[[-6.2,0,-6.2],[6.2,0,-6.2],[-6.2,0,6.2],[6.2,0,6.2],[-6,.6,-6],[6,.6,-6],[-6,.6,6],[6,.6,6]].map(p=>v3(...p));
function fitFor(t){const x0=ins.l/W*2-1,x1=1-ins.r/W*2,y0=-1+ins.b/H*2,y1=1-ins.t/H*2,mx=(x1-x0)*.02,my=(y1-y0)*.02,q=v3(0,0,0);let lo=4,hi=200;
 for(let it=0;it<22;it++){const d=(lo+hi)/2;camPos({x:0,z:0,a:0,t},d);let ok=true;for(const c of CORN){q.copy(c).project(CA);if(q.x<x0+mx||q.x>x1-mx||q.y<y0+my||q.y>y1-my){ok=false;break}}if(ok)hi=d;else lo=d}
 return hi}
function resize(){if(!ready)return;const b=root.getBoundingClientRect();W=Math.max(1,b.width);H=Math.max(1,b.height);R.setSize(W,H,false);
 const sx=(ins.l-ins.r)/2,sy=(ins.t-ins.b)/2,Wf=W+2*Math.abs(sx),Hf=H+2*Math.abs(sy);CA.aspect=Wf/Hf;CA.setViewOffset(Wf,Hf,Math.abs(sx)-sx,Math.abs(sy)-sy,W,H);CA.updateProjectionMatrix();
 const el=W-ins.l-ins.r<H-ins.t-ins.b?1.12:.95;if(el!==EL){if(Math.abs(VT.t-EL)<.01)VT.t=VW.t=el;EL=el}
 const k0=fitD,f=fitFor(EL);fitTop=fitFor(TOPT);fitD=f;if(!W0){fitV=f;W0=1}if(VT.t>TOPT-.02)VT.k=Math.max(VT.k,f/fitTop);applyCam();return k0!==f}
// ---- dedos y ratón ----
function ground(px,py){const r=cv.getBoundingClientRect();P2.set((px-r.left)/r.width*2-1,-(py-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(new THREE.Plane(v3(0,1,0),0),v3(0,0,0))}
function zoomAt(px,py,k){const p=ground(px,py);k=Math.max(KMIN,Math.min(KMAX,k));if(p){const f=VT.k/k;VT.x=p.x-(p.x-VT.x)*f;VT.z=p.z-(p.z-VT.z)*f}VT.k=k;touched=true;clampV()}
function pDown(e){if(!shown)return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,mv:false,pan:e.pointerType=='mouse'&&(e.button==2||e.shiftKey||e.button==1)});try{cv.setPointerCapture(e.pointerId)}catch(_){}
 touched=true;if(ptr.size==2){VK.forEach(q=>VT[q]=VW[q]);const [a,b]=[...ptr.values()];pin={d:Math.hypot(a.x-b.x,a.y-b.y)||1,k:VT.k,ang:Math.atan2(b.y-a.y,b.x-a.x),acc:0,rot:false,g:ground((a.x+b.x)/2,(a.y+b.y)/2)}}}
function pMove(e){const p=ptr.get(e.pointerId);if(!p)return;const ox=p.x,oy=p.y;p.x=e.clientX;p.y=e.clientY;if(Math.hypot(p.x-p.x0,p.y-p.y0)>7)p.mv=true;
 if(ptr.size>=2&&pin){const [a,b]=[...ptr.values()],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,ang=Math.atan2(b.y-a.y,b.x-a.x);let da=wrapA(ang-pin.ang);pin.ang=ang;
  // el giro arranca hasta pasar ~8°, para que pellizcar no gire sin querer
  pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.14){pin.rot=true;da=pin.acc}if(pin.rot)VT.a+=da;
  VT.k=pin.k*(Math.hypot(a.x-b.x,a.y-b.y)||1)/pin.d;snap();const g=ground(mx,my);if(g&&pin.g){VT.x+=pin.g.x-g.x;VT.z+=pin.g.z-g.z;snap()}return}
 if(!p.mv||ptr.size!=1)return;
 if(p.pan){const g0=ground(ox,oy),g1=ground(p.x,p.y);if(g0&&g1){VT.x+=g0.x-g1.x;VT.z+=g0.z-g1.z;snap()}return}
 VT.a-=(p.x-ox)*.008;VT.t+=(p.y-oy)*.006;snap()}
function pUp(e){const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(ptr.size<2)pin=null;if(!p||p.mv||ptr.size||(e.pointerType=='mouse'&&e.button!==0))return;
 const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const q=v3(0,0,0),i=ray.ray.intersectPlane(PL0,q)?sqAt(q.x,q.z):-1;
 if(i>=0){if(window.MRU)MRU.sel(i);return}
 const now=performance.now();if(now-lastTap<320&&Math.hypot(e.clientX-lastXY[0],e.clientY-lastXY[1])<40){home();lastTap=0}else{lastTap=now;lastXY=[e.clientX,e.clientY]}}
// ---- fichas en su casilla (las que comparten casilla se acomodan) ----
function slot(k,G){const i=G.pos[k],[x,z]=cpos(i),s=side(i),[ix,iz]=INW[s],tx=Math.abs(iz),tz=Math.abs(ix);
 const same=G.players.map((_,j)=>j).filter(j=>!G.bk[j]&&G.pos[j]===i&&(i!==10||!!G.jail[j]===!!G.jail[k])),n=same.indexOf(k);
 if(i===10){if(G.jail[k])return [x+.3+(n%2)*.34-.17,z-.3-Math.floor(n/2)*.3+.15];return [x-.5+(n%3)*.38,z+.5-Math.floor(n/3)*.4]}
 const c=same.length<2?0:(n%2)-.5,r=Math.floor(n/2)-(Math.ceil(same.length/2)-1)/2;return [x+tx*c*.44+ix*(r*.4-.12),z+tz*c*.44+iz*(r*.4-.12)]}
function rebuild(G){const key=JSON.stringify([G.own,G.hs,G.mg]);if(key===dynKey)return;dynKey=key;
 while(dyn.children.length)dyn.remove(dyn.children[0]);
 for(let i=0;i<40;i++){const o=G.own[i];if(o<0)continue;const [x,z]=cpos(i),s=side(i),[ix,iz]=INW[s],w=i%10==0?1.5:1;
  const bar=new THREE.Mesh(box(Math.abs(iz)?w*.92:.1,.04,Math.abs(ix)?w*.92:.1),std(MR.pc(o),.45,{transparent:!!G.mg[i],opacity:G.mg[i]?.35:1}));bar.position.set(x-ix*.69,.12,z-iz*.69);dyn.add(bar);
  const h=G.hs[i];if(!h)continue;const n=h==5?1:h;for(let j=0;j<n;j++){const m=house(h==5),t=n==1?0:(j-(n-1)/2)*.22;m.position.set(x+ix*.6+Math.abs(iz)*t,.11,z+iz*.6+Math.abs(ix)*t);m.rotation.y=s*Math.PI/2;dyn.add(m)}}}
function sync(G,sel){G0=G;
 G.players.forEach((_,k)=>{if(!toks[k]){toks[k]=piece(k);SC.add(toks[k]);arrs[k]=arrow(k);SC.add(arrs[k]);shownPos[k]=G.pos[k];const [x,z]=slot(k,G);toks[k].position.set(x,.1,z);anim[k]=null}
  toks[k].visible=arrs[k].visible=!G.bk[k];const t=G.pos[k];
  if(shownPos[k]!==t){const d=(t-shownPos[k]+40)%40,path=[];if(d>0&&d<=12&&!(t===10&&G.jail[k]))for(let j=1;j<=d;j++)path.push((shownPos[k]+j)%40);else path.push(t);
   shownPos[k]=t;anim[k]={path,t0:performance.now(),from:toks[k].position.clone()};if(fol&&!ptr.size){if(!back)back=Object.assign({},VT);touched=false;anim[k].fol=true}}
  else if(!anim[k]){const [x,z]=slot(k,G);toks[k].position.set(x,.1,z)}});
 if(G.rn!==rollN){if(rollN>=0)rollT=performance.now();rollN=G.rn;setDice(G.dice)}
 rebuild(G);selI=sel;selM.visible=sel>=0;if(sel>=0){const [x,z]=cpos(sel),s=side(sel),w=sel%10==0?1.5:1;selM.position.set(x,.106,z);selM.scale.set(s%2?1.5:w,s%2?w:1.5,1)}}
function setDice(v){dice.forEach((d,j)=>{const n=v[j]||1,m=d.material;m[2]=faces[n];m[3]=faces[7-n];const o=[1,2,3,4,5,6].filter(x=>x!==n&&x!==7-n);m[0]=faces[o[0]];m[1]=faces[7-o[0]];m[4]=faces[o[1]];m[5]=faces[7-o[1]]})}
// ---- cada cuadro: fichas que brincan casilla por casilla, flechas que rebotan, dados, cámara suave ----
function step(now,dt){const G=G0;if(!G)return;let moving=false;
 G.players.forEach((_,k)=>{const a=anim[k],T=toks[k];if(!T)return;
  if(a){moving=true;let t=(now-a.t0)/HOP;
   if(t>=1){a.path.shift();a.from=T.position.clone();a.t0=now;t=0;if(!a.path.length){anim[k]=null;const [x,z]=slot(k,G);T.position.set(x,.1,z);
     if(a.fol)setTimeout(()=>{if(back&&!touched&&!anim.some(Boolean)){Object.assign(VT,back);clampV()}back=null},900)}}
   if(anim[k]){const to=a.path[0],last=a.path.length==1,[x,z]=last?slot(k,G):cpos(to),u=Math.min(1,t);
    T.position.set(a.from.x+(x-a.from.x)*u,.1+Math.sin(u*Math.PI)*.4,a.from.z+(z-a.from.z)*u);if(a.fol&&!touched){VT.x=T.position.x;VT.z=T.position.z;VT.k=Math.max(VT.k,back?Math.max(back.k,1.7):1.7);clampV()}}}
  const on=k===G.turn&&G.phase=='play';T.rotation.y=VW.a+(on?Math.sin(now/420)*.3:0);
  const A=arrs[k],d=CA.position.distanceTo(T.position),w=Math.max(.42,Math.min(2.6,d*.03))*(on?1.35:1);   // casi del mismo tamaño en pantalla, de cerca o de lejos
  A.scale.set(w,w*A.userData.r,1);A.position.set(T.position.x,T.position.y+.72+(Math.sin(now/(on?170:260)+k)*.5+.5)*.22*w,T.position.z)});
 const k=G.turn,T=toks[k];ring.visible=!!T&&G.phase=='play'&&!G.bk[k];if(T){ring.position.set(T.position.x,T.position.y+.02,T.position.z);ring.scale.setScalar(1+Math.sin(now/250)*.08)}
 const t=(now-rollT)/800;dice.forEach((d,j)=>{const bx=1.05+(j?.3:-.3),bz=1.05+(j?-.24:.24);
  if(t<1){const q=1-t;d.position.set(bx+1.8*q*q+Math.sin(now/70+j)*.15*q,.36+Math.abs(Math.sin(t*Math.PI*2.5))*1.2*q,bz-1.8*q*q+Math.cos(now/80+j)*.15*q);d.rotation.set(now/60*q+j,now/50*q,now/75*q)}
  else{d.position.set(bx,.36,bz);d.rotation.set(0,j?.35:-.2,0)}});
 // la cámara se desliza hacia donde va
 const f=1-Math.exp(-dt/(moving&&!touched?140:110));VK.forEach(q=>{const dd=VT[q]-VW[q];VW[q]=Math.abs(dd)>1e-4?VW[q]+dd*f:VT[q]});fitV+=Math.abs(fitD-fitV)>.01?(fitD-fitV)*f:fitD-fitV}
function loop(now){raf=0;if(!shown)return;raf=requestAnimationFrame(loop);const dt=Math.min(100,now-(tPrev||now));tPrev=now;
 const b=root.getBoundingClientRect();if(Math.abs(b.width-W)>1||Math.abs(b.height-H)>1)resize();
 try{step(now,dt);applyCam();R.render(SC,CA)}catch(e){console.warn('Mérida 3D:',e);M3.fail();if(typeof render=='function')render()}}
window.M3={ok:()=>!failed,
 fail(){failed=true;this.show(false)},
 show(on){if(on&&!failed){try{init()}catch(e){failed=true;console.warn('Mérida 3D: no se pudo iniciar',e);throw e}}if(!ready||shown===on)return;shown=on;root.style.display=on?'block':'none';
  if(on){tPrev=0;if(!raf)raf=requestAnimationFrame(loop)}else{toks.forEach(t=>t&&SC.remove(t));arrs.forEach(a=>a&&SC.remove(a));toks.length=arrs.length=anim.length=shownPos.length=0;dynKey='';rollN=-1;G0=null;back=null}},
 layout(i){const ch=i.t!==ins.t||i.b!==ins.b||i.r!==ins.r||i.l!==ins.l;Object.assign(ins,i);if(ch||!W)resize()},
 theme:t=>applyTheme(t),follow:on=>{fol=on},
 sync:(G,sel)=>sync(G,sel),
 cam(c){touched=true;back=null;if(c=='home')home();else if(c=='top'){VT.a=Math.round(VT.a/(Math.PI/2))*(Math.PI/2);Object.assign(VT,{x:0,z:0,t:TOPT,k:fitD/fitTop})}
  else if(c=='untop')Object.assign(VT,{t:EL,k:1,x:0,z:0});else if(c=='rr')VT.a+=Math.PI/2;else if(c=='zi')VT.k*=1.3;else if(c=='zo')VT.k/=1.3;clampV()},
 look(k){const T=toks[k];if(!T||!T.visible)return;touched=true;back=null;const p=T.position;
  if(VT.k>2&&Math.hypot(VT.x-p.x,VT.z-p.z)<.3)home();else Object.assign(VT,{x:p.x,z:p.z,k:Math.max(VT.k,2.4)});clampV()}};
})();
