// Casa de juegos 3D: la pantalla de inicio es una casa donde caminas con tu Mii, ves a los demás en vivo y eliges a qué mesa entrar.
// Cada mesa es un juego (Continental, Uno, Monopoly Deal): ahí se ven sentados los que están jugando y las salas que esperan jugadores.
// Sentarte abre una ventanita para crear una sala o unirte; de ahí en adelante todo sigue igual (mk / joinR de game.js).
// Emotes y globitos de texto. La posición de cada quien pasa por POST /casa (server.js). Usa los Miis del Continental 3D.
(function(){
const K=window.C3D;
if(typeof THREE==='undefined'||typeof GM==='undefined'||!K){console.warn('Casa 3D: falta Three.js o los Miis del Continental 3D');return}
const origHome=home;
let on=true;try{on=localStorage.getItem('casa_3d')!=='0'}catch(e){}
let R,SC,CA,root,cv,lay,ready=false,W=0,H=0,por=false,lastNow=0,me=null,sel=null,closed=null,picked=null,tgt=null,tgtG=null,stuck=0,moved=false,mark=null,st=null,pin=null,fire=null,disco=null,camRep=null,hits=[],tgtL=null;
// cámara libre (como en el Continental 3D): VT = adónde va, VW = dónde está. ox,oz = qué tanto la moviste lejos de tu Mii,
// k = zoom (más = más cerca), a = giro, t = inclinación. Cuadrar regresa todo a 0 (y k a 1)
const VW={ox:0,oz:0,k:1,a:0,t:0},VT={ox:0,oz:0,k:1,a:0,t:0},VK=['ox','oz','k','a','t'],KMIN=.3,KMAX=4;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),keys=new Set(),tch=new Map(),ray=new THREE.Raycaster(),P2=new THREE.Vector2(),FLOOR=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const touchy=matchMedia('(pointer:coarse)').matches,lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
let dark=lsGet('cont_dark')!=null?lsGet('cont_dark')=='1':matchMedia('(prefers-color-scheme:dark)').matches,camOpen=lsGet('cont_cam')=='1';
// cada pestaña es una persona distinta en la casa (sessionStorage: sobrevive a recargar, no se comparte entre pestañas)
const myId=(()=>{let v=null;try{v=sessionStorage.getItem('casa_id')}catch(e){}if(!v){v=Math.random().toString(36).slice(2,12);try{sessionStorage.setItem('casa_id',v)}catch(e){}}return v})();
// la casa: paredes en x = ±HX, de z = ZB (fondo) a ZF (enfrente)
const HX=17,ZB=-15,ZF=11,TH=1.5;         // TH: altura de las mesas (la de los Miis sentados)
let TB=[{g:'continental',x:-8.5,z:-4,felt:['#2f9a62','#0f4a2d']},{g:'uno',x:0,z:-9,felt:['#c0393f','#5e1218']},{g:'monopolydeal',x:8.5,z:-4,felt:['#3d84cc','#123a68']},{g:'ruleta',x:HX-.2,z:-8,door:1,to:'sot'}].filter(t=>GM[t.g]);
TB.forEach(t=>t.r=t.door?1:2.2);         // door: en vez de mesa es una puerta en la pared derecha (la Ruleta Rusa, al sótano). Monopoly, YuCATÁN y Backgammon: planta alta; Rummy y Conecta 4: terraza
let OB=[];                               // obstáculos redondos (sillas, muebles): {x,z,r}
// pisos (c_sotano.js, c_casa_alta.js, c_casa_terraza.js): cada piso trae su escena (SC), mesas (TB), obstáculos (OB), cosas que se tocan (hits), límites para caminar (bx) y para la cámara (cb)
// y escaleras (links). Solo se dibuja el piso donde estás; el sótano se arma la primera vez que bajas. to: la puerta te lleva a ese piso
const PB={id:'pb',bx:[-HX+1,HX-1,ZB+1.2,ZF-1],cb:[-HX,HX,ZB,ZF],links:[],spawn:f=>f==='alta'||f==='ter'?{x:HX-11.4,z:2.8,yaw:-Math.PI/2}:{x:HX-2.6,z:-8,yaw:-Math.PI/2}};let FL=PB,LK=[],fBusy=false;
const FM={sot:'SOT',alta:'ALTA',ter:'TERR'},fmod=id=>window[FM[id]],FLS={pb:PB};   // módulo de cada piso y los que ya se armaron
const canGo=id=>id==='pb'||!!(fmod(id)&&fmod(id).ok()),fpOn=()=>!!(window.CAV&&CAV.on());
function goFloor(id,then){if(fBusy||id===FL.id||!canGo(id))return false;fBusy=true;tgt=tgtG=tgtL=null;keys.clear();sel=null;closed=null;sfx('card');
 // ya en negro: se arma el piso (la primera vez), se pasa todo a su escena y se compilan sus materiales antes de que se vea
 const sw=()=>{const nf=id==='pb'?PB:fmod(id).piso();if(!nf)return render();FLS[nf.id]=nf;const from=FL.id;tgt=tgtG=tgtL=null;keys.clear();if(FL===PB)Object.assign(PB,{SC,TB,OB,hits});FL=nf;({SC,TB,OB,hits}=nf);LK=nf.links||[];if(window.CGLB)CGLB.piso(nf.id);
  [me.g,mark,...[...others.values()].map(a=>a.g)].forEach(o=>SC.add(o));const s=nf.spawn(from);me.pos.set(s.x,0,s.z);solve(me.pos);me.yaw=me.g.rotation.y=s.yaw;me.g.position.set(me.pos.x,1.57,me.pos.z);
  Object.assign(VT,{ox:0,oz:0,k:nf.k||1,a:fpOn()?s.yaw-Math.PI:0,t:0});VW.a=VT.a;snap();rstate();try{R.compile(SC,CA)}catch(e){}if(window.ETQ)ETQ.hov(null);if(then)then();render()};
 if(!window.CCAM){sw();fBusy=false;return true}
 CCAM.fade(1,380).then(()=>{sw();return CCAM.fade(0,520)}).then(()=>{fBusy=false});return true}
// estado del renderer para este piso (el sótano usa el tono de cine de la Ruleta). También al volver de una partida, que usa el mismo lienzo
// full: applyQ completo (recompila materiales); al volver de una partida solo hace falta si la calidad es Media (la Ruleta prende las sombras)
function rstate(full){R.toneMapping=FL.tm||THREE.NoToneMapping;R.toneMappingExposure=FL.tx||1;if(full!==false)applyQ(window.CALIDAD);else{R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true}if(FL.enter)FL.enter(fpOn())}
function back(){if(cv.parentNode!==root)root.insertBefore(cv,root.firstChild);cv.style.filter='';rstate(window.CALIDAD==='medio');me.g.visible=!fpOn()}
// primera persona (c_casa_avatar.js): tecla V o el botón del ojo
function fpTog(){if(!window.CAV||!ready||fBusy)return;const P=window.CCAM&&CCAM.pose(CA),f=!CAV.on();CAV.set(f);if(!f&&document.pointerLockElement)document.exitPointerLock();
 Object.assign(VT,f?{ox:0,oz:0,t:0,a:me.yaw-Math.PI}:{ox:0,oz:0,t:0,k:FL.k||1,a:VW.a});VW.a=VT.a;layout();snap();me.g.visible=!f;if(FL.enter)FL.enter(f);
 if(P)CCAM.blendIn(CA,P,600);sfx('tick');render()}
const EMO=['😭','🥺','🤣','👻','❤️','🔥','🤬','🖕','💃','🕺'],DANCE=['💃','🕺'],DMS=8000;   // los bailes duran DMS ms (o hasta que camines)
const DESC={continental:'Rummy de 7 rondas con contratos de tríos y corridas. Tiene juegos escondidos en el cuarto.',
 uno:'Mismo color, número o símbolo; comodines y ¡UNO! Puedes jugar contra bots.',monopolydeal:'Junta 3 grupos de propiedades completos antes que los demás.',merida:'Compra colonias de Mérida, cobra renta y construye. Gana el último que no quiebre.',haciendas:'Pon ranchos y sacbés, cosecha y comercia en Yucatán. Gana quien llegue primero a los puntos.',
 ruleta:'Un revólver, una bala y nervios de acero. Gana el último que quede vivo. Los bots llenan la mesa.',
 rummy:'Sal a la terraza con los abuelos: arma series y escaleras con fichas de madera y reacomoda la mesa. Gana quien se quede sin fichas.'};
const others=new Map(),seated=new Map();let rooms=[],roomsKey='',netBusy=false,netT=0,outEm=null,outSay=null,synced=false;

// ---------- texturas ----------
function cnv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
const texC={};
function ctex(key,w,h,draw,rep){if(texC[key])return texC[key];const c=cnv(w,h);draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}return texC[key]=t}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
// cartitas de adorno sobre cada mesa
function miniCard(key,bg,fg,txt,border){return ctex('mc'+key,128,180,(g,w,h)=>{g.fillStyle=border||'#fff';rr(g,0,0,w,h,14);g.fill();g.fillStyle=bg;rr(g,8,8,w-16,h-16,10);g.fill();
 g.fillStyle=fg;g.font='bold 64px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,w/2,h/2+4)})}
const DECO={continental:[['c1','#fff','#151515','♠'],['c2','#fff','#c62828','♥'],['c3','#fff','#c62828','♦'],['c4','#fff','#151515','♣'],['c5','#c0302f','#fff','♠']],
 uno:[['u1','#e53935','#fff','7'],['u2','#fbc02d','#fff','+2'],['u3','#43a047','#fff','⊘'],['u4','#1e88e5','#fff','4'],['u5','#1c1c1c','#fdd835','UNO']],
 monopolydeal:[['m1','#8bc34a','#fff','$5'],['m2','#e53935','#fff','🏠'],['m3','#1e88e5','#fff','$2'],['m4','#fbc02d','#333','$1'],['m5','#7b1fa2','#fff','🏨']],
 merida:[['r1','#d63a3a','#fff','🏠'],['r2','#f4f1e8','#333','$400'],['r3','#22b3c4','#fff','🚌'],['r4','#f2c230','#333','🎲'],['r5','#2e9e57','#fff','🏨']],
 haciendas:[['h1','#79a96a','#fff','🌿'],['h2','#e8c24a','#333','🌽'],['h3','#a7a49a','#fff','🪨'],['h4','#df9234','#fff','🍯'],['h5','#eef1ee','#333','🧂']],
 rummy:[['k1','#f3ead2','#c62828','7'],['k2','#f3ead2','#1e5aa8','12'],['k3','#f3ead2','#1a1a1a','3'],['k4','#f3ead2','#e07a10','9'],['k5','#f3ead2','#2e7d32','★']]};

// ---------- escena ----------
// calidad (c_bienvenida.js). Medio: sin sombras, pixelRatio 1 y sin luces puntuales (menos la chimenea)
let QL=null;
function applyQ(q){if(window.CGLB)CGLB.calidad();if(!R||!QL)return;const lo=q==='medio';
 R.setPixelRatio(Math.min(devicePixelRatio||1,lo?1:2));R.shadowMap.enabled=!lo;QL.Ld.castShadow=!lo;QL.hl.intensity=lo?2.1:1.5;
 SC.traverse(o=>{if(o.isPointLight&&!(fire&&o===fire.light)&&!o.userData.keep)o.visible=!lo;if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)})}
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();SC.background=new THREE.Color(0x1a120c);CA=new THREE.PerspectiveCamera(42,1,.1,200);
 const hl=new THREE.HemisphereLight(0xfff4e6,0x3a2a1e,1.5);SC.add(hl);
 const Ld=new THREE.DirectionalLight(0xfff0d8,2.2);Ld.position.set(-8,22,10);Ld.castShadow=true;Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0005;
 Object.assign(Ld.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:70});SC.add(Ld);QL={hl,Ld};
 root=document.createElement('div');root.id='h3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 lay=document.createElement('div');lay.id='h3lay';document.body.appendChild(lay);   // nombres, globitos y avisos (fuera de #app: no se borran al redibujar)
 // llegada por el zaguán: la cámara entra desde afuera y tu Mii camina hasta su lugar (c_casa_cam.js)
 const zg=window.CCAM&&!CCAM.RM;
 buildHouse();const cl=!!window.CCALLE;me=newAv(pname,v3(0,0,zg?ZF+(cl?10.2:6.2):3),Math.PI);if(zg){tgt=v3(0,0,3);CCAM.blendIn(CA,CCAM.at(cl?v3(0,3.6,ZF+17):v3(0,2.4,ZF+7.6),v3(0,2.6,ZF-6)),cl?3600:2800,'inOut')}   // llegas por el zaguán (c_casa_pb.js)applyQ(window.CALIDAD);if(window.BIEN)BIEN.watch();
 setTimeout(()=>{if(!moved){moved=true;if(active()&&!inputBusy())render()}},12000);   // la ayuda de arriba se va sola
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',e=>{tch.delete(e.pointerId);pin=null;st=null});
 cv.addEventListener('contextmenu',e=>e.preventDefault());cv.addEventListener('pointerleave',()=>{if(window.ETQ)ETQ.hov(null)});
 cv.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();if(fpOn())return;VT.k*=Math.exp(-e.deltaY*.0015);clampV()},{passive:false});
 const typing=e=>/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'');
 // teclado: W A S D / flechas = caminar; Q E = girar; R F = inclinar; + − = zoom; Inicio = cuadrar; 1-8 = gestos; G = rueda de gestos; Enter = chat
 addEventListener('keydown',e=>{if(window.CCAM&&active()&&!typing(e))CCAM.cut();if(!active()||typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);tgt=null;tgtG=null}
  else if(k=='e'&&sel&&window.CMESA&&CMESA.key('e'))e.preventDefault()
  else if({q:'rl',e:'rr',r:'tu',f:'td','+':'zi','=':'zi','-':'zo'}[k]){e.preventDefault();camBtn({q:'rl',e:'rr',r:'tu',f:'td','+':'zi','=':'zi','-':'zo'}[k])}
  else if(k=='home'){e.preventDefault();camHome()}
  else if(k=='v'){e.preventDefault();fpTog()}
  else if(k=='escape'){if(window.CHUD&&CHUD.key('escape'))return;if(window.CMESA&&CMESA.key('escape'))return;if(sel){closed=sel;sel=null;render()}else camHome()}
  else if(k=='enter'){if(window.CHUD&&CHUD.key('enter'))e.preventDefault()}
  else if(k=='g'){if(window.CHUD&&CHUD.key('g'))e.preventDefault()}
  else if(k>='1'&&k<='8')casaEm(EMO[+k-1])});
 addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
 // barra de cámara: dejar presionado repite
 const stopRep=()=>{if(camRep){clearTimeout(camRep.t);clearInterval(camRep.i);camRep=null}};
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('[data-cam]');if(!b||!active())return;e.preventDefault();stopRep();const c=b.dataset.cam;
  if(c=='tog'){camOpen=!camOpen;try{localStorage.setItem('cont_cam',camOpen?'1':'0')}catch(_){}sfx('tick');render();return}
  if(c=='home'){camHome();sfx('tick');return}
  if(c=='fp'){fpTog();return}
  camBtn(c);camRep={t:setTimeout(()=>{camRep.i=setInterval(()=>camBtn(c),90)},320)}});
 ['pointerup','pointercancel','blur'].forEach(t=>addEventListener(t,stopRep));
 requestAnimationFrame(loop)}
const $id=id=>document.getElementById(id);
function std(c,r,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r==null?.7:r},o||{}))}
function box(w,h,d,mat,x,y,z,par){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(par||SC).add(m);return m}
function cyl(rt,rb,h,mat,x,y,z,par,n){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n||24),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(par||SC).add(m);return m}
function buildHouse(){
 // piso de duela
 const fl=ctex('floor',512,512,(g,w,h)=>{for(let i=0;i<8;i++){const y=i*64;g.fillStyle=['#7a5534','#6b4a2e','#835c38','#73502f'][i%4];g.fillRect(0,y,w,64);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y,w,2);const o=(i*173)%w;g.fillRect(o,y,2,64);g.fillRect((o+256)%w,y,2,64);
  for(let k=0;k<50;k++){g.fillStyle=k%2?'rgba(0,0,0,.06)':'rgba(255,220,170,.05)';g.fillRect((k*97+i*31)%w,y+(k*13)%60,40+(k*37)%120,1)}}},1);
 const fm=std(0xffffff,.75,{map:fl.clone()});fm.map.needsUpdate=true;fm.map.repeat.set(HX*2/6,(ZF-ZB)/6);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(HX*2,ZF-ZB),fm);floor.rotation.x=-Math.PI/2;floor.position.set(0,0,(ZF+ZB)/2);floor.receiveShadow=true;if(!window.CPB)SC.add(floor);   // con c_casa_pb.js el salón lleva piso de pasta
 // tapete grande al centro
 const rug=ctex('rug',512,512,(g,w,h)=>{g.fillStyle='#5a1a1e';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=12;g.strokeRect(20,20,w-40,h-40);g.lineWidth=4;g.strokeRect(46,46,w-92,h-92);
  g.fillStyle='rgba(201,162,74,.35)';for(let i=0;i<6;i++)for(let j=0;j<6;j++){g.beginPath();g.arc(100+i*62,100+j*62,8,0,7);g.fill()}});
 const rg=new THREE.Mesh(new THREE.PlaneGeometry(20,13),std(0xffffff,.95,{map:rug}));rg.rotation.x=-Math.PI/2;rg.position.set(0,.01,-4);rg.receiveShadow=true;SC.add(rg);
 // paredes con arcos y puertas, techo, zaguán, comedor, cocina y baño (c_casa_pb.js)
 if(window.CPB)CPB.build({SC,OB,hits,std,box,cyl,ctex,HX,ZB,ZF,PB});
 // letrero de la casa en la pared del fondo
 const logo=ctex('logo',512,128,(g,w,h)=>{g.fillStyle='#2a1a10';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle='#c9a24a';g.lineWidth=6;rr(g,10,10,w-20,h-20,14);g.stroke();
  g.font='bold 54px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f4d58a';g.fillText('🎴 Casa de juegos',w/2,h/2+3)});
 const lg=new THREE.Mesh(new THREE.PlaneGeometry(6,1.5),std(0xffffff,.6,{map:logo}));lg.position.set(0,6.6,ZB+.08);SC.add(lg);
 // sofá a la derecha, librero a la izquierda, plantas en las esquinas
 const sofa=std(0x2f4a5a,.85),sx=HX-1.4,sz=8.2;const so=new THREE.Group();so.position.set(sx,0,sz);so.rotation.y=-Math.PI/2;SC.add(so);
 box(5.4,.9,2,sofa,0,.75,0,so);box(5.4,1.7,.55,sofa,0,1.6,-.75,so);[-1,1].forEach(s=>box(.55,1.4,2,sofa,s*2.7,1.1,0,so));[-1.3,1.3].forEach(dx=>box(2.5,.35,1.6,std(0x37566a,.9),dx,1.35,.15,so));
 OB.push({x:sx,z:sz-1.8,r:1.4},{x:sx,z:sz,r:1.4},{x:sx,z:sz+1.8,r:1.4});
 const bw=std(0x4a2c18,.6),bx=-HX+.55,bz=4,BC=[0x8b1e1e,0x1e4f8b,0x2e6b3a,0xc9a24a,0x5a2a6b,0x2b2b2b,0xa85a1e,0xe0d6c0];let rs=7;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280;
 box(.9,7,.12,bw,bx,3.5,bz-1.6);box(.9,7,.12,bw,bx,3.5,bz+1.6);box(.1,7,3.3,bw,bx-.42,3.5,bz);
 for(let s=0;s<6;s++){const y=.1+s*1.38;box(.9,.1,3.3,bw,bx,y,bz);if(s==5)break;let z=bz-1.5;while(z<bz+1.4){const t=.12+rnd()*.14,hh=.75+rnd()*.45;box(.62,hh,t,std(BC[(rnd()*BC.length)|0],.7),bx+.05,y+.06+hh/2,z+t/2);z+=t+.02}}
 OB.push({x:bx+.5,z:bz-1,r:1.2},{x:bx+.5,z:bz+1,r:1.2});
 const lf=std(0x2e7d32,.8);[[-HX+1.3,ZB+1.3],[HX-1.3,ZB+1.3],[-HX+1.3,ZF-1.5]].forEach(([px,pz])=>{cyl(.5,.38,1,std(0xb5643c,.7),px,.5,pz);
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2,l=new THREE.Mesh(new THREE.ConeGeometry(.2,1.8,6),lf);l.position.set(px+Math.cos(a)*.28,1.8,pz+Math.sin(a)*.28);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);l.castShadow=true;SC.add(l)}OB.push({x:px,z:pz,r:.9})});
 // chimenea en la pared izquierda, con fuego que parpadea
 const fx=-HX+.75,fz=-9,stone=std(0x8a8077,.9),ch=new THREE.Group();ch.position.set(fx,0,fz);ch.rotation.y=Math.PI/2;SC.add(ch);
 box(3.6,3.2,1.3,stone,0,1.6,0,ch);box(4.2,.3,1.6,std(0x4a2c18,.5),0,3.3,.1,ch);box(2.2,1.7,.2,std(0x120a06,.95),0,1.15,.6,ch);box(2.2,6,1,stone,0,6,-.1,ch);
 [-.35,.35].forEach((d,i)=>{const l=cyl(.13,.13,1.5,std(0x5a3418,.8),d*.4,.45,.75,ch,10);l.rotation.z=Math.PI/2;l.rotation.y=d})
 const flames=[[0,.75,.45,1.1,0xff7a1a],[-.3,.7,.3,.8,0xffb02e],[.32,.7,.3,.75,0xffb02e],[0,.7,.22,.55,0xfff1a8]].map(([x,y,r,h,c])=>{const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,12),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.9}));m.position.set(x,y+h/2,.75);ch.add(m);return m});
 const fl2=new THREE.PointLight(0xff8a2a,18,14,1.6);fl2.position.set(0,1.4,1.6);ch.add(fl2);fire={flames,light:fl2};OB.push({x:fx+.5,z:fz,r:2.1});
 // bola disco sobre el tapete: gira siempre; sus luces de colores se prenden cuando alguien baila
 const mir=ctex('mirror',256,128,(g,w,h)=>{for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const v=150+Math.random()*105|0;g.fillStyle=`rgb(${v},${v},${v+10})`;g.fillRect(x,y,7,7)}});
 const ball=new THREE.Mesh(new THREE.SphereGeometry(.6,24,16),std(0xffffff,.25,{map:mir,metalness:.9,emissive:0x222233}));ball.position.set(0,7.6,-4);SC.add(ball);
 cyl(.015,.015,1.4,std(0x222222,.4),0,8.9,-4,SC,6);
 const dl=[0xff2fd1,0x2fe8ff,0xffe02f].map(c=>{const l=new THREE.PointLight(c,0,16,1.4);SC.add(l);return l});disco={ball,dl,lvl:0};
 // mesas de juego
 TB.forEach(t=>buildTable(t));   // el Cubilete está en el sótano (c_sotano.js); Conecta 4 y Backgammon arriba (c_casa_terraza.js, c_casa_alta.js)
 // escalera a la planta alta contra la pared derecha y un plano junto a cada escalera (c_casa_esc.js)
 if(window.ESC){PB.links=[ESC.up({S:SC,hits,OB,x:HX-8.4,z:2.8,dir:[1,0],to:'alta',key:'pb-alta',sign:['⬆ Planta alta','#2a1a10','#c9a24a','#f4d58a',0xffc070],n:10,land:2.2,rail:[-1,1]})];LK=PB.links;
  ESC.plano({S:SC,hits,OB,x:HX-9.2,z:.6,ry:.3,here:'pb'});ESC.plano({S:SC,hits,OB,x:HX-1.2,z:-5.6,ry:-.6,here:'pb'})}
 if(window.CAMB)CAMB.build({THREE,SC,OB,std,box,cyl,ctex,TB,TH,HX,ZB,ZF});   // lámparas, ventiladores, reloj, hamaca y gato (c_casa_amb.js)
 // marca donde tocaste el piso
 mark=new THREE.Mesh(new THREE.RingGeometry(.25,.4,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));mark.rotation.x=-Math.PI/2;mark.position.y=.03;SC.add(mark)}
// puerta al sótano (pared derecha): marco como el de las ventanas, letrero como el de la casa y un foquito rojo encima
function buildDoor(t){const G=new THREE.Group();G.position.set(HX,0,t.z);G.rotation.y=-Math.PI/2;SC.add(G);t.G=G;const hit={t:'table',g:t.g},fr=std(0xe9e2d0,.5),wd=std(0x4a2814,.45),dk=std(0x2e1a0e,.5);
 box(1.9,3.6,.12,wd,0,1.8,.06,G).userData.hit=hit;[[-.45,2.55],[.45,2.55],[-.45,1],[.45,1]].forEach(([x,y])=>box(.7,y>2?1.5:1.2,.05,dk,x,y,.14,G).userData.hit=hit);
 box(.22,3.9,.3,fr,-1.06,1.95,.12,G);box(.22,3.9,.3,fr,1.06,1.95,.12,G);box(2.34,.25,.34,fr,0,3.92,.14,G);
 const kb=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),std(0xc9a24a,.3,{metalness:.8}));kb.position.set(.7,1.6,.22);G.add(kb);
 // letrero sobre la puerta (sign: texto, fondo, borde, letra y color de la luz; si no, el del sótano)
 const S=t.sign||['⬇ Sótano · Ruleta','#1a0c0a','#a3302a','#e9c9a0',0xff4a2a];
 const sg=ctex('sign-'+t.g,512,128,(g,w,h)=>{g.fillStyle=S[1];rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle=S[2];g.lineWidth=6;rr(g,10,10,w-20,h-20,14);g.stroke();
  g.font='bold '+(S[0].length>16?42:50)+'px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=S[3];g.fillText(S[0],w/2,h/2+3)});
 const s=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.65),std(0xffffff,.6,{map:sg}));s.position.set(0,4.55,.1);G.add(s);
 const lt=new THREE.PointLight(S[4],8,6,1.6);lt.position.set(0,4.3,.9);G.add(lt);
 const ring=new THREE.Mesh(new THREE.RingGeometry(t.r+1.4,t.r+1.7,64),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;G.add(ring);
 t.ring=ring;t.chairs=[];G.traverse(o=>{if(o.userData.hit)hits.push(o)})}
function buildTable(t){if(t.door)return buildDoor(t);const G=new THREE.Group();G.position.set(t.x,0,t.z);SC.add(G);t.G=G;const hit={t:'table',g:t.g},wood=std(0x4a2814,.45);
 const fe=ctex('felt'+t.g,256,256,(g,w,h)=>{const gr=g.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,t.felt[0]);gr.addColorStop(1,t.felt[1]);g.fillStyle=gr;g.fillRect(0,0,w,h)});
 const top=cyl(t.r,t.r,.14,std(0xffffff,.95,{map:fe}),0,TH,0,G,64);top.userData.hit=hit;
 const rim=new THREE.Mesh(new THREE.TorusGeometry(t.r,.13,12,64),new THREE.MeshPhysicalMaterial({color:0x6e3b1b,roughness:.38,clearcoat:.7}));rim.rotation.x=Math.PI/2;rim.position.y=TH+.06;rim.castShadow=true;G.add(rim);rim.userData.hit=hit;
 cyl(.25,.35,TH-.1,wood,0,(TH-.1)/2,0,G);cyl(1,1.1,.1,wood,0,.05,0,G);
 // cartitas encima
 (DECO[t.g]||[]).forEach(([k,bg,fg,tx],i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,.77),new THREE.MeshStandardMaterial({map:miniCard(k,bg,fg,tx),roughness:.6,transparent:true}));
  const a=i/5*Math.PI*2+.4,d=i==4?0:1.1;m.rotation.set(-Math.PI/2,0,a*1.7);m.position.set(Math.cos(a)*d,TH+.08+i*.002,Math.sin(a)*d);m.receiveShadow=true;G.add(m)});
 // sillas alrededor (cuando alguien está jugando en esa mesa, su Mii ocupa la silla)
 t.chairs=[];for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4,cx=Math.cos(a)*(t.r+.9),cz=Math.sin(a)*(t.r+.9),ch=new THREE.Group();ch.position.set(cx,0,cz);ch.rotation.y=Math.atan2(-cx,-cz);G.add(ch);
  box(1,.12,1,wood,0,.9,0,ch);box(1,1.3,.12,wood,0,1.6,-.45,ch);[[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]].forEach(([x,z])=>cyl(.05,.05,.9,wood,x,.45,z,ch,8));
  t.chairs.push(ch);OB.push({x:t.x+cx,z:t.z+cz,r:.6})}
 // luz cálida sobre la mesa (sin lámpara: desde arriba tapaba la vista)
 const lt=new THREE.PointLight(0xffd9a0,30,12,1.6);lt.position.y=5.9;G.add(lt);
 // aro de luz en el piso: se prende cuando te acercas
 const ring=new THREE.Mesh(new THREE.RingGeometry(t.r+1.4,t.r+1.7,64),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;G.add(ring);
 t.ring=ring;G.traverse(o=>{if(o.userData.hit)hits.push(o)})}

// ---------- Miis de pie (tú y los demás). Cada quien se ve igual en todas las pantallas: cara y color salen de su nombre ----------
function lookOf(n){n=(n||'').trim()||'Tú';return [K.hsh(n)%10,K.hsh(n+'·')%K.AVP.length]}
function disposeG(g){if(g.parent)g.parent.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()})}
function mkG(name,seat){const [k,pi]=lookOf(name),g=K.mkAvatar(k,pi,seat?{}:{stand:true});g.traverse(o=>{if(o.isMesh)o.castShadow=true});SC.add(g);g.userData.key=k+':'+pi;return g}
function newAv(name,pos,yaw){const g=mkG(name);const a={g,name,pos:pos.clone(),to:pos.clone(),yaw,tyaw:yaw,w:0,ph:0,waveT:-1e9,dance:null,danceT:-1e9,tag:null,bub:null,bubT:0};g.position.set(pos.x,1.57,pos.z);g.rotation.y=yaw;return a}
function rename(a,name){a.name=name;const k=lookOf(name).join(':');if(k!==a.g.userData.key){const g=mkG(name);g.position.copy(a.g.position);g.rotation.y=a.g.rotation.y;disposeG(a.g);a.g=g}if(a.tag)a.tag.textContent=(name||'').trim()||'Tú'}
function dropAv(a){disposeG(a.g);if(a.tag)a.tag.remove();if(a.bub)a.bub.remove()}
const POLE=[v3(-1.2,-.4,-.7),v3(1.2,-.4,-.7)],tmp=new THREE.Vector3(),tmp2=new THREE.Vector3(),wv=new THREE.Vector3();
// pasos: piernas y brazos se mecen al caminar (w = qué tanto camina, ph = fase del paso); con un emote, la mano derecha saluda.
// Bailes (parado): 💃 brazos arriba y cadera de lado a lado; 🕺 de disco, señalando arriba y abajo con la otra mano en la cintura
const dancing=(a,now)=>{const t=now-a.danceT;return a.dance&&t>=0&&t<DMS&&a.w<.3?Math.min(1,t/300,(DMS-t)/300):0};
function pose(a,now,lookDown){const u=a.g.userData,w=a.w,ph=a.ph,wt=(now-a.waveT)/2200,wave=wt>=0&&wt<1?Math.sin(wt*Math.PI):0,dn=dancing(a,now),disco=a.dance=='🕺',bt=now/1000*Math.PI*2*1.1;
 u.body.position.y=Math.abs(Math.sin(ph))*.06*w+.012*Math.sin(now/650)+Math.abs(Math.sin(bt))*.12*dn;u.body.rotation.x=.06*w;
 u.body.rotation.z=Math.sin(bt)*(disco?.06:.14)*dn;u.body.rotation.y=Math.sin(bt/2)*(disco?.5:.3)*dn;u.head.rotation.z=-Math.sin(bt)*.18*dn;
 (u.legs||[]).forEach(L=>{let q=L.s*Math.sin(ph)*.55*w,b=q*.6-Math.max(0,L.s*Math.cos(ph))*.35*w;
  if(dn){const up=Math.max(0,L.s*Math.sin(bt))*(disco?.7:.45)*dn;q+=up;b-=up*1.3}   // pasito: sube una rodilla y luego la otra
  const kn=tmp.set(L.hp.x+L.s*.01,L.hp.y-.48*Math.cos(q),L.hp.z+.48*Math.sin(q)),an=tmp2.set(kn.x,kn.y-.42*Math.cos(b),kn.z+.42*Math.sin(b));
  K.seg(L.up,L.hp,kn);K.seg(L.lo,kn,an);L.sh.position.set(an.x,an.y-.07,an.z+.08)});
 u.arms.forEach(m=>{const s=m.s,sw=-s*Math.sin(ph)*.38*w,pole=POLE[s>0?1:0].clone();m.h.set(s*.52,-.6+.08*Math.abs(sw),sw+.06);
  if(s>0&&wave&&!dn){m.h.lerp(wv.set(.55,1.05+.14*Math.sin(now/85),.25),wave);pole.y+=1.4*wave}
  if(dn){if(!disco)wv.set(s*(.42+.14*Math.sin(bt+s)),1.1+.12*Math.sin(bt*2+s),.12);
   else if(s>0)wv.set(Math.sin(bt)>0?.75:.55,Math.sin(bt)>0?1.25:-.45,Math.sin(bt)>0?.35:.4);else wv.set(-.48,-.18,-.08);
   m.h.lerp(wv,dn);pole.y+=(disco&&s<0?.2:1.3)*dn}
  K.ik(m.sh,m.h,u.l1,u.l2,pole,m.el);K.seg(m.up,m.sh,m.el);K.seg(m.fo,m.el,m.h);m.hand.position.copy(m.h)});
 u.head.rotation.y*=.9;u.head.rotation.x+=((lookDown?.25:.05)-u.head.rotation.x)*.1}
// Miis sentados jugando (los de las salas que ya empezaron): manos sobre la mesa, de vez en cuando tiran una carta
function poseSeated(s,now){const u=s.g.userData,t=now/1000+s.seed,r=Math.pow(Math.max(0,Math.sin(t*.8)),10);
 u.body.scale.y=1+.012*Math.sin(now/650+s.seed);u.head.rotation.y=.45*Math.sin(t*.35);u.head.rotation.x=.25;
 u.arms.forEach(m=>{const k=m.s>0?r:0;m.h.set(m.s*.34-m.s*.12*k,.36+.15*k,.72+.6*k);K.ik(m.sh,m.h,u.l1,u.l2,POLE[m.s>0?1:0].clone(),m.el);K.seg(m.up,m.sh,m.el);K.seg(m.fo,m.el,m.h);m.hand.position.copy(m.h)})}
function seatSync(){const want=new Map();Object.values(FLS).forEach(f=>(f===FL?TB:f.TB||[]).forEach(t=>{if(!t.chairs)return;t.fl=f;rooms.filter(r=>r.g==t.g&&r.st=='play').flatMap(r=>r.ps).slice(0,t.chairs.length).forEach((n,j)=>want.set(t.g+':'+j+':'+n,{t,j,n}))}));
 seated.forEach((s,k)=>{if(!want.has(k)){disposeG(s.g);s.t.chairs[s.j].visible=true;seated.delete(k)}});
 want.forEach((w,k)=>{if(seated.has(k))return;const c=w.t.chairs[w.j],g=mkG(w.n,1),fs=w.t.fl===FL?SC:w.t.fl.SC;if(fs)fs.add(g);c.visible=false;
  g.position.set(w.t.x+c.position.x,1.55,w.t.z+c.position.z);g.rotation.y=Math.atan2(-c.position.x,-c.position.z);seated.set(k,{g,t:w.t,j:w.j,seed:Math.random()*10})})}
function solve(p){const b=FL.bx;p.x=Math.max(b[0],Math.min(b[1],p.x));p.z=Math.max(b[2],Math.min(b[3],p.z));
 TB.concat(OB).forEach(o=>{const r=(o.g?o.r+.45:o.r)+.35,dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz);if(d<r&&d>1e-4){p.x=o.x+dx/d*r;p.z=o.z+dz/d*r}});
 // muros (FL.WL: segmentos [ax,az,bx,bz,r] sin los vanos, de c_casa_pb.js)
 (FL.WL||[]).forEach(([ax,az,bx,bz,r])=>{const vx=bx-ax,vz=bz-az,t=Math.max(0,Math.min(1,((p.x-ax)*vx+(p.z-az)*vz)/(vx*vx+vz*vz||1))),qx=ax+vx*t,qz=az+vz*t,dx=p.x-qx,dz=p.z-qz,d=Math.hypot(dx,dz);if(d<r&&d>1e-4){p.x=qx+dx/d*r;p.z=qz+dz/d*r}})}
function turn(a,yaw){let d=yaw-a.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));a.g.rotation.y+=d*.18}
let wp=[],wpFor=null;   // ruta (c_casa_ruta.js) hacia tgt, punto por punto
function walk(dt,now){const a=me,p=a.pos,cy=VW.a,fw=v3(-Math.sin(cy),0,-Math.cos(cy)),rt=v3(Math.cos(cy),0,-Math.sin(cy)),dir=v3(0,0,0);
 if(keys.has('w')||keys.has('arrowup'))dir.add(fw);if(keys.has('s')||keys.has('arrowdown'))dir.sub(fw);if(keys.has('d')||keys.has('arrowright'))dir.add(rt);if(keys.has('a')||keys.has('arrowleft'))dir.sub(rt); if(window.JOY&&JOY.on){dir.addScaledVector(fw,-JOY.y).addScaledVector(rt,JOY.x);tgt=null;tgtG=null}   // joystick del celular (c_casa_joy.js)
 if(!dir.lengthSq()&&tgt){if(tgt!==wpFor){wpFor=tgt;wp=window.RUTA?RUTA.find(p,tgt,FL,TB.concat(OB)):[]}while(wp.length>1&&Math.hypot(wp[0].x-p.x,wp[0].z-p.z)<.35)wp.shift();
  const aim=wp.length>1?wp[0]:tgt;dir.subVectors(aim,p).setY(0);if(aim===tgt&&dir.length()<.12){dir.set(0,0,0);arrive()}}
 const sp=5.2*dt/1000;let mv=0;
 if(dir.lengthSq()){dir.normalize();const q=p.clone();p.addScaledVector(dir,sp);solve(p);mv=q.distanceTo(p);
  // si moviste la cámara, se queda donde la dejaste (no sigue a tu Mii) hasta que toques Cuadrar
  if(panned()){const dx=p.x-q.x,dz=p.z-q.z;VT.ox-=dx;VT.oz-=dz;VW.ox-=dx;VW.oz-=dz}a.yaw=Math.atan2(dir.x,dir.z);a.danceT=-1e9;if(!moved){moved=true;render()}
  // atorado contra una silla o mueble camino a una mesa: ya llegó
  if(tgt){stuck=mv<sp*.3?stuck+1:0;if(stuck>8)arrive()}}
 a.w+=((mv>.001?1:0)-a.w)*.15;a.ph+=mv*3.1;
 // mirar hacia la mesa al llegar
 const t=sel&&TB.find(x=>x.g===sel);if(t&&!mv)a.yaw=Math.atan2(t.x-p.x,t.z-p.z);if(fpOn()&&!mv)a.yaw=VW.a+Math.PI;   // en primera persona miras hacia donde ve la cámara
 turn(a,a.yaw);a.g.position.set(p.x,1.57,p.z);pose(a,now,!!sel);
 // ¿cerca de la mesa que picaste? abre su ventanita (solo si la elegiste con clic o Ir a…; si te alejas se olvida)
 let near=null;TB.forEach(x=>{const dd=Math.hypot(p.x-x.x,p.z-x.z);x.near=dd<x.r+2.3&&!(x.to&&canGo(x.to));if(x.near&&!near)near=x.g;x.ring.material.opacity+=((x.near?.75:0)-x.ring.material.opacity)*.12});
 // caminar hasta una puerta que lleva a otro piso (o a la escalera) = cambiar de piso
 if(mv>.001&&!fBusy){const d=TB.find(x=>x.to&&canGo(x.to)&&Math.hypot(p.x-x.x,p.z-x.z)<x.r+1.05)||LK.find(l=>Math.hypot(p.x-l.x,p.z-l.z)<l.r);if(d&&goFloor(d.to))return}
 if(closed&&closed!==near)closed=null;if(picked&&!tgtG&&near!==picked)picked=null;const want=near&&near===picked&&near!==closed?near:null;if(want!==sel){sel=want;if(sel){sfx('tick');if(document.pointerLockElement)document.exitPointerLock()}render()}}
// los demás: se deslizan suave hacia la última posición que mandó el servidor
function walkOthers(dt,now){const f=1-Math.exp(-dt/110);others.forEach(a=>{a.g.visible=(a.f||'pb')===FL.id;const q=a.pos.clone();a.pos.lerp(a.to,f);const mv=q.distanceTo(a.pos);   // solo se ven los de tu piso
 a.w+=((mv>.002?1:0)-a.w)*.15;a.ph+=mv*3.1;if(mv>.02)a.danceT=-1e9;if(mv>.002)a.tyaw=Math.atan2(a.pos.x-q.x,a.pos.z-q.z);turn(a,a.tyaw);a.g.position.set(a.pos.x,1.57,a.pos.z);pose(a,now,false)});
 seated.forEach(s=>poseSeated(s,now))}
function arrive(){const g=tgtG,l=tgtL,t=g&&TB.find(x=>x.g===g);tgt=null;stuck=0;tgtL=null;if(tgtG){closed=null;tgtG=null}
 if(t&&t.to&&canGo(t.to))goFloor(t.to);else if(l)goFloor(l.to)}
// llega por el hueco entre dos sillas que le quede más cerca (las sillas están a 45°, los huecos a 0°, 90°, 180° y 270°)
function goTable(g){const t=TB.find(x=>x.g===g);if(!t)return;const p=me.pos,a=Math.round(Math.atan2(p.z-t.z,p.x-t.x)/(Math.PI/2))*(Math.PI/2);
 tgt=t.door?v3(t.x-2.3,0,t.z):v3(t.x+Math.cos(a)*(t.r+1.5),0,t.z+Math.sin(a)*(t.r+1.5));solve(tgt);tgtG=g;picked=g;tgtL=null;closed=null;stuck=0;showMark(tgt);sfx('card')}
function showMark(p){mark.position.set(p.x,.03,p.z);mark.material.opacity=.9;mark.scale.setScalar(1)}

// ---------- en vivo: mando mi posición y recibo a los demás + las salas (cada ~0.3 s) ----------
function inputBusy(){const a=document.activeElement;return !!(a&&/INPUT|TEXTAREA/.test(a.tagName)&&a.closest&&a.closest('#app'))}
async function net(now){if(netBusy||now-netT<300)return;netBusy=true;netT=now;
 const b={id:myId,name:(pname||'').trim()||'Jugador',x:me.pos.x,z:me.pos.z,yaw:me.yaw,w:me.w>.3?1:0,f:FL.id};if(outEm){b.em=outEm;outEm=null}if(outSay){b.say=outSay;outSay=null}
 if(window.CUB3){const c=CUB3.out();if(c)b.cub=c}if(window.JG3){const j=JG3.out();if(j)b.jg=j}
 try{const d=await api('casa',b);if(active()){netSync(d);const ch=(window.CUB3&&CUB3.sync(d.cub,myId))|(window.JG3&&JG3.sync(d.jg,d.jerr));if(ch&&!inputBusy())render()}}catch(e){}netBusy=false}
function netSync(d){const seen=new Set(),n0=others.size;
 (d.p||[]).forEach(o=>{seen.add(o.id);let a=others.get(o.id);const pos=v3(+o.x||0,0,+o.z||0);
  if(!a){a=newAv(o.name,pos,+o.yaw||0);a.emN=o.emN;a.sayN=o.sayN;others.set(o.id,a);if(synced)toast(`👋 ${o.name} entró a la casa`)}
  else if(a.name!==o.name)rename(a,o.name);
  a.f=o.f||'pb';a.to.copy(pos);if(!o.w&&a.to.distanceTo(a.pos)<.05)a.tyaw=+o.yaw||a.tyaw;
  if(o.em&&o.emN!==a.emN){a.emN=o.emN;bubble(a,o.em,1)}if(o.say&&o.sayN!==a.sayN){a.sayN=o.sayN;bubble(a,o.say)}});
 others.forEach((a,id)=>{if(!seen.has(id)){if(synced)toast(`${a.name} salió`);dropAv(a);others.delete(id)}});
 rooms=d.r||[];const k=JSON.stringify(rooms)+'|'+others.size;synced=true;
 if(k!==roomsKey){const rk=roomsKey.split('|')[0],nk=k.split('|')[0];roomsKey=k;if(rk!==nk)seatSync();if(!inputBusy())render()}}
// globitos (lo que dijo o su emote) y nombres arriba de cada Mii
function bubble(a,t,emo){if(!emo&&window.CHUD)CHUD.msg(a===me?(pname||'').trim()||'Tú':a.name,t,a===me);if(a.bub)a.bub.remove();const el=document.createElement('div');el.className='h3bub'+(emo?' emo':'');el.textContent=t;lay.appendChild(el);a.bub=el;a.bubT=performance.now()+(emo?3000:6000);if(emo){if(DANCE.includes(t)){a.dance=t;a.danceT=performance.now()}else a.waveT=performance.now()}}
function toast(t){let box=$id('h3toasts');if(!box){box=document.createElement('div');box.id='h3toasts';lay.appendChild(box)}const el=document.createElement('div');el.className='w7 w7g h3toast';el.textContent=t;box.appendChild(el);setTimeout(()=>el.remove(),3200)}
function tags(now){const all=[me,...others.values()];all.forEach(a=>{if(!a.tag){a.tag=document.createElement('div');a.tag.className='w7 t3pl h3nm'+(a===me?' me':'');a.tag.textContent=(a.name||'').trim()||'Tú';lay.appendChild(a.tag)}
  const [x,y,v0]=toPx(v3(a.pos.x,3.45,a.pos.z)),vis=v0&&a.g.visible;a.tag.style.display=vis?'':'none';a.tag.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
  if(a.bub){if(now>a.bubT){a.bub.remove();a.bub=null}else{const [bx,by]=toPx(v3(a.pos.x,4.05,a.pos.z));a.bub.style.display=vis?'':'none';a.bub.style.transform=`translate(${bx}px,${by}px) translate(-50%,-100%)`;a.bub.classList.toggle('out',a.bubT-now<400)}}})}

// ---------- cámara tipo Roblox: sigue a tu Mii desde atrás; arrastrar la gira alrededor de él, rueda o pellizco para acercar ----------
const selOff=v3(0,0,0),selT=v3(0,0,0),AH=()=>0;   // AH: cuánto adelante de tu Mii mira la cámara (0 = a él)
const EL=()=>por?.78:.62,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// punto de la casa al centro de la pantalla
function center(V){const p=me.pos;return v3(p.x+V.ox-Math.sin(V.a)*AH(),0,p.z+V.oz-Math.cos(V.a)*AH())}
function applyCam(){if(fpOn())return CAV.apply(CA,me.pos,VW);const c=center(VW).add(selOff),a=VW.a,d=(por?20:14)/VW.k,el=EL()+VW.t;
 CA.position.set(c.x+Math.sin(a)*Math.cos(el)*d,Math.sin(el)*d+1.9,c.z+Math.cos(a)*Math.cos(el)*d);CA.lookAt(c.x,1.9,c.z);CA.updateMatrixWorld()}
function clampV(){if(fpOn())return CAV.clamp(VT);VT.k=Math.max(KMIN,Math.min(KMAX,VT.k));VT.t=Math.max(.1-EL(),Math.min(1.45-EL(),VT.t));
 // que el centro no se salga de la casa
 const c=center(VT),b=FL.cb,cx=Math.max(b[0],Math.min(b[1],c.x)),cz=Math.max(b[2],Math.min(b[3],c.z));VT.ox+=cx-c.x;VT.oz+=cz-c.z}
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);applyCam()}
function camStep(dt,snapNow){if(snapNow){VK.forEach(q=>VW[q]=VT[q])}else{const f=RM?1:1-Math.exp(-dt/110);VK.forEach(q=>{VW[q]+=(VT[q]-VW[q])*f})}
 // en celular parado, con la ventanita de la mesa abierta (abajo), la mesa y tu Mii se suben a la parte de arriba (si no moviste la cámara)
 const t=por&&sel&&!viewed()&&(!window.CMESA||CMESA.abierta())&&TB.find(x=>x.g===sel),p=me.pos;
 if(t)selT.set((t.x+p.x)/2+Math.sin(VW.a)*6,0,(t.z+p.z)/2+Math.cos(VW.a)*6).sub(center(VW));else selT.set(0,0,0);selOff.lerp(selT,snapNow?1:.1);applyCam()}
const panned=()=>Math.abs(VT.ox)>.3||Math.abs(VT.oz)>.3,viewed=()=>fpOn()?Math.abs(VT.t)>.02:panned()||Math.abs(VT.k-(FL.k||1))>.03||Math.abs(wrap(VT.a))>.02||Math.abs(VT.t)>.02;
// Cuadrar: llega con easing (c_casa_cam.js) en vez de deslizarse
function camHome(){const P=window.CCAM&&ready&&!CCAM.busy()&&CCAM.pose(CA);VW.a=wrap(VW.a);Object.assign(VT,fpOn()?{t:0}:{ox:0,oz:0,k:FL.k||1,a:0,t:0});if(P){snap();CCAM.blendIn(CA,P,700)}}
function camBtn(c){if(c=='rl')VT.a-=.2;else if(c=='rr')VT.a+=.2;else if(c=='zi')VT.k*=1.2;else if(c=='zo')VT.k/=1.2;else if(c=='tu')VT.t+=.09;else if(c=='td')VT.t-=.09;else return;clampV()}
// punto del piso debajo del dedo/ratón
function ground(x,y){const r=cv.getBoundingClientRect();P2.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(FLOOR,v3(0,0,0))}
// zoom hacia donde apuntas (rueda del ratón)
function zoomAt(x,y,k){if(fpOn())return;const p=ground(x,y);k=Math.max(KMIN,Math.min(KMAX,k));if(!p){VT.k=k;return clampV()}const c=center(VT),f=VT.k/k;
 VT.ox+=(p.x-c.x)*(1-f);VT.oz+=(p.z-c.z)*(1-f);VT.k=k;clampV()}
function layout(){W=innerWidth;H=innerHeight;por=W/H<.95;R.setSize(W,H,false);CA.aspect=W/H;CA.fov=fpOn()?CAV.fov(por):por?52:42;CA.updateProjectionMatrix()}
function toPx(p){const q=p.clone().project(CA);return [(q.x+1)/2*W,(1-q.y)/2*H,q.z<1]}

// ---------- tocar: piso = caminar ahí, mesa o letrero = ir a esa mesa ----------
// Ratón: arrastrar (izquierdo o derecho) = mover la cámara; clic de rueda o Shift + clic derecho = girar e inclinar; rueda = zoom.
// Dedo: arrastrar = mover; dos dedos = pellizcar para zoom, girarlos para rotar, subirlos o bajarlos juntos para inclinar
// qué etiqueta le toca a lo que señalas (mesa, puerta, cubilete, Conecta 4, backgammon)
const hk=h=>h&&(h.t=='table'?h.g:/^(cub|c4|bg)$/.test(h.t)?h.t:h.t=='fn'&&h.g?h.g:null);   // fn con g: mesas de próximamente del sótano (c_sotano_salon.js)
function pick(e){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(hits,false);if(h.length)return h[0].object.userData.hit;const p=ray.ray.intersectPlane(FLOOR,v3(0,0,0));return p?{t:'floor',p}:null}
function pDown(e){if(!active())return;if(window.CCAM)CCAM.cut();if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
 if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(tch.size==2){st=null;const [a,b]=[...tch.values()];VK.forEach(q=>VT[q]=VW[q]);
   pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VW.k,g:ground((a[0]+b[0])/2,(a[1]+b[1])/2),ang:Math.atan2(b[1]-a[1],b[0]-a[0]),acc:0,rot:false,my:(a[1]+b[1])/2,mx:(a[0]+b[0])/2,t:VW.t,mode:null};return}
  if(tch.size>2)return}
 if(e.button==1)e.preventDefault();
 // primera persona con ratón: el primer clic atrapa el puntero (Esc lo suelta); después cada clic actúa en la mira del centro
 if(fpOn()&&e.pointerType==='mouse'&&e.button===0&&!locked()&&!noLock){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{noLock=true})}catch(_){noLock=true}return}   // si el navegador no deja, se mira arrastrando
 const rot=e.button==1||(e.button==2&&e.shiftKey),pan=e.button==2&&!rot;if(pan||rot)cv.style.cursor=rot?'move':'grabbing';
 st={x:e.clientX,y:e.clientY,pid:e.pointerId,pan,rot,a0:VW.a,t0:VW.t,g:null};try{cv.setPointerCapture(e.pointerId)}catch(_){}}
const locked=()=>document.pointerLockElement===cv;let noLock=false;addEventListener('pointerlockerror',()=>{noLock=true});
function pMove(e){if(!active())return;
 if(locked()){VT.a-=(e.movementX||0)*.0025;VT.t-=(e.movementY||0)*.0025;snap();return}   // primera persona con el ratón atrapado: mover = mirar
 if(tch.has(e.pointerId)){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(pin&&tch.size>=2){if(fpOn())return;const [a,b]=[...tch.values()],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]),dd=Math.hypot(a[0]-b[0],a[1]-b[1])-pin.d;let da=wrap(ang-pin.ang);pin.ang=ang;
   // ¿inclinar o mover? si los dos dedos suben/bajan juntos sin abrirse ni girar, es inclinar
   if(!pin.mode){const dy=my-pin.my,dx=mx-pin.mx;if(Math.abs(dy)>16&&Math.abs(dd)<Math.abs(dy)*.35&&Math.abs(dx)<Math.abs(dy)*.6&&Math.abs(pin.acc+da)<.1)pin.mode='tilt';else if(Math.abs(dd)>14||Math.abs(dx)>16||Math.abs(pin.acc+da)>.12)pin.mode='free'}
   if(pin.mode=='tilt'){VT.t=pin.t+(my-pin.my)*.006;snap();return}
   if(!pin.mode)return;
   pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.12){pin.rot=true;da=pin.acc}if(pin.rot)VT.a=VW.a+da;
   VT.k=pin.k*(Math.hypot(a[0]-b[0],a[1]-b[1])||1)/pin.d;snap();
   return}}
 if(!st){if(e.pointerType==='mouse'){const h=pick(e);cv.style.cursor=h&&(h.t=='table'||h.t=='link'||h.t=='fn'||h.t=='cub'||h.t=='c4'||h.t=='bg')?'pointer':'default';if(window.ETQ)ETQ.hov(hk(h))}return}
 if(e.pointerId!==st.pid)return;
 // primera persona: arrastrar = mirar alrededor (a la derecha = miras a la derecha)
 if(fpOn()){if(st.g||Math.hypot(e.clientX-st.x,e.clientY-st.y)>6){st.g=1;VT.a=st.a0-(e.clientX-st.x)*.006;VT.t=st.t0-(e.clientY-st.y)*.004;snap()}return}
 if(st.rot){VT.a=st.a0+(e.clientX-st.x)*.007;VT.t=st.t0+(e.clientY-st.y)*.005;snap();return}
 // arrastrar (ratón o dedo) = girar la cámara alrededor de tu Mii, como en Roblox
 if(st.g||st.pan||Math.hypot(e.clientX-st.x,e.clientY-st.y)>8){st.g=1;cv.style.cursor='grabbing';VT.a=st.a0-(e.clientX-st.x)*.008;VT.t=st.t0+(e.clientY-st.y)*.005;snap()}}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}if(!st||e.pointerId!==st.pid)return;const s=st;st=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 if(s.pan||s.rot||s.g){cv.style.cursor='default';return}const rc=cv.getBoundingClientRect(),h=pick(locked()?{clientX:rc.left+rc.width/2,clientY:rc.top+rc.height/2}:e);if(!h)return;
 // en el celular el primer toque solo enseña el detalle de la etiqueta; el segundo entra
 const hg=hk(h);if(hg&&e.pointerType==='touch'&&window.ETQ&&!ETQ.tap(hg))return;
 if(h.t=='table')return h.g===sel&&window.CMESA?CMESA.abrir():goTable(h.g);
 if(h.t=='link'){tgt=v3(h.l.ax,0,h.l.az);tgtL=h.l;tgtG=null;solve(tgt);showMark(tgt);sfx('card');return}   // la escalera
 if(h.t=='c4'||h.t=='bg')return JG3.tap(h);
 if(h.t=='fn')return h.f();   // el plano junto a la escalera (abre el 🧭) o la radio
 if(h.t=='cub'){tgt=v3(CUB3.X-1.6,0,CUB3.Z+1.6);tgtG=null;solve(tgt);showMark(tgt);return CUB3.open()}
 tgt=h.p.setY(0);tgtG=null;tgtL=null;solve(tgt);showMark(tgt)}
// botón Cuadrar: aparece solo si moviste la cámara
function viewBtn(){const el=$id('t3view');if(!el)return;const k=viewed()?'1':'';if(el.dataset.k===k)return;el.dataset.k=k;el.style.display=k?'':'none'}

// ---------- capa de controles ----------
const ic=d=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC={cam:ic('<path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/>'),
 rl:ic('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 3v5h5"/>'),rr:ic('<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v5h-5"/>'),
 zi:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/>'),zo:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M7.5 10.5h6"/>'),
 tu:ic('<path d="M3 18h18M6 18l3-6h6l3 6"/><path d="M12 9V3M9 6l3-3 3 3"/>'),td:ic('<path d="M2 16l5-6h10l5 6z"/><path d="M12 7V2M9 5l3 2 3-2"/>'),
 fp:ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 home:ic('<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>')};
function camUI(){const cb=(c,t)=>`<button class="w7b" data-cam="${c}" title="${t}" aria-label="${t}">${IC[c]}</button>`;
 return ` <div id="t3cam" class="w7${camOpen?' open':''}"><button class="w7b tog" data-cam="tog" title="Cámara" aria-label="Cámara" aria-expanded="${camOpen}">${IC.cam}</button>${window.CAV?`<button class="w7b tog${CAV.on()?' on':''}" data-cam="fp" title="${CAV.on()?'Volver a la cámara de arriba':'Primera persona'} (V)" aria-label="Primera persona" aria-pressed="${CAV.on()}">${IC.fp}</button>`:''}
 <div class="w7g pan">${cb('rl','Girar a la izquierda (Q)')}${cb('rr','Girar a la derecha (E)')}${cb('zi','Acercar (+)')}${cb('zo','Alejar (−)')}${cb('tu','Ver más desde arriba (R)')}${cb('td','Ver más de lado (F)')}
 <button class="w7b wide" data-cam="home" title="Cuadrar la cámara (Inicio)">${IC.home} Cuadrar</button></div></div>`}
function tinfo(g){const pl=rooms.filter(r=>r.g==g&&r.st=='play').reduce((a,r)=>a+r.n,0),op=rooms.filter(r=>r.g==g&&r.st=='lobby');return {pl,op}}
function hud(){const g=sel&&GM[sel],n=others.size+1;
 // la mesa que picaste: aviso "Jugar…" y, al tocarlo (o E), su panel (c_casa_mesa.js)
 let mh='';if(window.CMESA){let c=null;if(g){const {pl,op}=tinfo(sel);c={g:sel,G:g,name:window.lobbyName?lobbyName(sel):g.name,desc:DESC[sel]||'',pl,op,pr:rooms.filter(r=>r.g==sel&&r.st=='play'&&r.w),code,msg}}mh=CMESA.html(c)}
 const busy=!!(g&&window.CMESA&&CMESA.abierta());
 let o=window.CHUD?CHUD.html({piso:FL.id,n,name:pname,touchy,fp:fpOn(),canFp:!!window.CAV,busy,
  people:[{n:(pname||'').trim()||'Tú',f:FL.id,me:1},...[...others.values()].map(a=>({n:a.name,f:a.f}))]}):'';
 TB.forEach(t=>{const G=GM[t.g],{pl,op}=tinfo(t.g),sub=t.g===sel?'aquí':[pl?pl+' jugando':'',op.length?op.length+(op.length>1?' salas abiertas':' sala abierta'):''].filter(Boolean).join(' · ')||'sin partidas';
  o+=`<div class="w7 w7g h3sign${t.g===sel?' on':''}${op.length?' open':''}" data-g="${t.g}" onclick="casaGo('${t.g}')">${G.emoji} <b>${window.lobbyName?lobbyName(t.g):G.name}</b><small>${sub}</small></div>`});
 if(msg&&!busy)o+=`<div class="w7 t3msg">${esc(msg)}</div>`;
 // te invitaron con un enlace: unirte sin tener que caminar
 if(!g&&code&&code.length==5)o+=`<div id="h3inv" class="w7 w7g">Te invitaron a la sala <b>${esc(code)}</b><button class="w7b p" onclick="joinR()">Unirme</button></div>`;
 o+=mh;
 if(window.CUB3&&FL.id==='sot')o+=CUB3.hud(busy);if(window.JG3)o+=JG3.hud(busy);   // el cubilete en el sótano; Conecta 4 en la terraza y Backgammon en la planta alta
 if(window.CIR)o+=CIR.hud(busy);
 if(window.SOT)o+=SOT.seatHud();
 return o}
// letreros: siguen a su mesa en la pantalla
function labels(){const tb=$id('uiTop'),y0=tb?tb.getBoundingClientRect().bottom+4:0,afuera=FL===PB&&!!window.CASCO&&CASCO.fuera();   // afuera la casa tiene techo: sin letreros de mesas
 document.querySelectorAll('#app .h3sign').forEach(el=>{const t=TB.find(x=>x.g===el.dataset.g);if(!t)return;const [x,y,vis]=toPx(v3(t.x,TH+2.5,t.z)),hw=el.offsetWidth/2+4;
  el.style.display=vis&&!afuera?'':'none';el.style.transform=`translate(${Math.max(hw,Math.min(W-hw,x))}px,${Math.max(y0+el.offsetHeight,y)}px) translate(-50%,-100%)`})}   // nunca debajo de la barra de arriba
// tamaño, transparencia y empalmes de todas las etiquetas (c_etiquetas.js)
function etq(){if(!window.ETQ)return;const cp=CA.position,ref=cp.distanceTo(center(VW))||1,tb=$id('uiTop');
 ETQ.step({y0:tb?tb.getBoundingClientRect().bottom+4:0,ratio:g=>{const a=TB.find(x=>x.g===g)||(g=='cub'&&window.CUB3?{x:CUB3.X,z:CUB3.Z}:window.JG3&&JG3.P&&JG3.P[g]||window.SAL&&SAL.P[g]);return a?Math.hypot(cp.x-a.x,cp.y-TH,cp.z-a.z)/ref:1}})}

// ---------- engancharse a la pantalla de inicio ----------
function active(){return on&&!S}
function loop(now){requestAnimationFrame(loop);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none')){root.style.display=lay.style.display=a?'block':'none';if(a)back();if(a&&sitP&&window.CCAM){CCAM.blendIn(CA,sitP,1300);sitP=null}}document.documentElement.classList.toggle('h3on',a);
 // en una partida del sótano la escena es la misma: los Miis que caminan se esconden (la Ruleta pone a los suyos en las sillas)
 document.documentElement.classList.toggle('h3lock',a&&document.pointerLockElement===cv);
 if(!a){keys.clear();if(document.pointerLockElement===cv)document.exitPointerLock();if(FL!==PB&&me.g.visible){me.g.visible=false;others.forEach(o=>o.g.visible=false)}return}
 if(window.UI)dark=UI.noche();document.documentElement.classList.toggle('c3dark',dark);
 if(innerWidth!==W||innerHeight!==H){layout();camStep(dt,true)}
 net(now);walk(dt,now);walkOthers(dt,now);camStep(dt,false);if(window.CCAM)CCAM.apply(CA,now);if(window.CHOV)CHOV.step(dt,TB,window.ETQ&&ETQ.act(),CA);viewBtn();mark.material.opacity*=.96;mark.scale.multiplyScalar(1.01);
 if(fire){fire.light.intensity=16+5*Math.sin(now*.013)+3*Math.sin(now*.031+1);fire.flames.forEach((f,i)=>{f.scale.y=1+.18*Math.sin(now*.02+i*1.7);f.scale.x=f.scale.z=1+.08*Math.sin(now*.017+i)})}
 if(disco){const any=[me,...others.values()].some(a=>dancing(a,now)>0);disco.lvl+=((any?1:0)-disco.lvl)*.05;disco.ball.rotation.y+=dt*(.0004+.0016*disco.lvl);
  disco.dl.forEach((l,i)=>{const a=now/900+i*2.09;l.position.set(Math.cos(a)*5,2.5,-4+Math.sin(a)*3.5);l.intensity=22*disco.lvl})}
 if(window.CUB3)CUB3.step(now,toPx,W,FL.id==='sot');if(window.JG3)JG3.step(now,toPx,W,FL.id);if(FL===PB&&window.CAMB)CAMB.step(now,dt);if(FL.step)FL.step(now,dt);if(window.SOT)SOT.seatTick(now);labels();tags(now);etq();if(window.VENT)VENT.paso(FL.id,R,CA);const exD=(FL===PB||!!FL.ext)&&!!window.CCALLE&&CCALLE.fondo(R,CA,SC,FL.id);R.render(SC,CA);if(exD)R.autoClear=true}
home=function(){if(window.BIEN&&BIEN.pend())return origHome();   // primero la bienvenida (c_bienvenida.js)
 if(!active())return origHome()+(on?'':`<button class="b g" onclick="casaToggle()">🏠 Entrar a la casa 3D</button>`);
 try{init();return hud()}catch(e){console.warn('Casa 3D:',e);on=false;return origHome()}};
// "Ir a…" (c_casa_ir.js): fundido y apareces junto a esa mesa (o el Cubilete / los juegos sueltos), cambiando de piso si hace falta
function irA(id,g){if(!ready||fBusy||!canGo(id))return;const put=()=>{const t=TB.find(x=>x.g===g)||(g=='cub'&&window.CUB3?{x:CUB3.X,z:CUB3.Z,r:1.15}:window.JG3&&JG3.P&&JG3.P[g]&&{x:JG3.P[g].x,z:JG3.P[g].z,r:1});if(!t)return;
  const p=t.door?v3(t.x-2.3,0,t.z):v3(t.x,0,t.z+(t.r||1)+1.5);solve(p);tgt=tgtG=tgtL=null;keys.clear();sel=null;closed=null;picked=t.door?null:g;me.pos.copy(p);me.yaw=me.g.rotation.y=Math.atan2(t.x-p.x,t.z-p.z);me.g.position.set(p.x,1.57,p.z);
  Object.assign(VT,{ox:0,oz:0,t:0,a:fpOn()?me.yaw-Math.PI:0});VW.a=VT.a;snap()};
 if(id!==FL.id)return goFloor(id,put);if(!window.CCAM){put();return render()}fBusy=true;sfx('card');CCAM.fade(1,320).then(()=>{put();render();return CCAM.fade(0,480)}).then(()=>{fBusy=false})}
// mesa(t, escena, hits, obstáculos): arma una mesa como las de la planta baja dentro de otro piso (c_casa_alta.js, c_casa_terraza.js)
function mesaEn(t,S,h,O){const k=[SC,hits,OB];SC=S;hits=h;OB=O;try{t.r=t.r||2.2;buildTable(t)}finally{[SC,hits,OB]=k}}
window.CASA3D={std,box,cyl,ctex,rr,mesa:mesaEn,look:lookOf,on:()=>on,calidad:applyQ,R:()=>R,sc:()=>SC,cam:()=>CA,piso:()=>FL.id,ir:irA,tinfo,can:canGo,yo:()=>me&&me.pos};
window.casaPiso=id=>{goFloor(id)};   // materiales y Miis para otros cuartos (el sótano de c_ruleta3d.js)
window.casaToggle=()=>{on=!on;try{localStorage.setItem('casa_3d',on?'1':'0')}catch(e){}if(window.BIEN)BIEN.toggled(on);if(on&&ready)applyQ(window.CALIDAD);render()};
window.casaGo=g=>{if(window.CUB3&&CUB3.isOpen())CUB3.close();if(window.JG3)JG3.close(1);if(sel===g){if(window.CMESA)CMESA.abrir();return}goTable(g)};
window.casaHome=()=>{camHome();sfx('tick')};window.casaClose=()=>{closed=sel;sel=null;sfx('tick');render()};
// sentarse: vuela a la mesa, baja a la altura de la silla y funde a negro; luego entra al juego (c_casa_cam.js)
let sitP=null;
function sit(go){const t=window.CCAM&&ready&&!CCAM.busy()&&sel&&TB.find(x=>x.g===sel);if(!t)return go();
 const a=Math.atan2(CA.position.x-t.x,CA.position.z-t.z),r=t.r+(t.door?2.6:1.25),lk=v3(t.x,TH+.15,t.z),m0=msg;
 const P=[CCAM.at(v3(t.x+Math.sin(a)*(r+3),TH+3.4,t.z+Math.cos(a)*(r+3)),lk),CCAM.at(v3(t.x+Math.sin(a)*r,TH+1.05,t.z+Math.cos(a)*r),lk)];
 sitP=P[1];CCAM.fly(CA,P,1150);
 setTimeout(()=>CCAM.fade(1,400).then(()=>{go();const t0=performance.now(),w=()=>{
  if(!active()){CCAM.release(CA,0);CCAM.fade(0,500)}                                   // ya entraste: se ve el juego
  else if(msg!==m0||performance.now()-t0>2500){sitP=null;CCAM.release(CA,700);CCAM.fade(0,400)}   // no se pudo: te levantas
  else setTimeout(w,80)};w()}),750)}
window.casaPlay=mode=>{if(!sel)return;pgame=sel;sit(()=>mk(mode))};
window.casaJoin=c=>{code=c;sit(()=>joinR())};
window.casaWatch=c=>sit(()=>watchR(c));
window.casaEm=e=>{if(!active()||!EMO.includes(e))return;outEm=e;bubble(me,e,1);sfx('tick')};
window.casaSay=x=>{const t=String(x||'').trim().slice(0,80);if(!t)return;outSay=t;bubble(me,t);sfx('tick')};window.casaFp=()=>fpTog();
let nmT=null;window.casaName=()=>{clearTimeout(nmT);nmT=setTimeout(()=>rename(me,pname),350)};
})();
