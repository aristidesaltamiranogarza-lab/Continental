// Casa de juegos 3D: la pantalla de inicio es una casa donde caminas con tu Mii, ves a los demás en vivo y eliges a qué mesa entrar.
// Cada mesa es un juego (Continental, Uno, Monopoly Deal): ahí se ven sentados los que están jugando y las salas que esperan jugadores.
// Sentarte abre una ventanita para crear una sala o unirte; de ahí en adelante todo sigue igual (mk / joinR de game.js).
// Emotes y globitos de texto. La posición de cada quien pasa por POST /casa (server.js). Usa los Miis del Continental 3D.
(function(){
const K=window.C3D;
if(typeof THREE==='undefined'||typeof GM==='undefined'||!K){console.warn('Casa 3D: falta Three.js o los Miis del Continental 3D');return}
const origHome=home;
let on=true;try{on=localStorage.getItem('casa_3d')!=='0'}catch(e){}
let R,SC,CA,root,cv,lay,ready=false,W=0,H=0,por=false,lastNow=0,me=null,sel=null,closed=null,tgt=null,tgtG=null,stuck=0,moved=false,mark=null,st=null,pin=null,fire=null,disco=null,camRep=null;
// cámara libre (como en el Continental 3D): VT = adónde va, VW = dónde está. ox,oz = qué tanto la moviste lejos de tu Mii,
// k = zoom (más = más cerca), a = giro, t = inclinación. Cuadrar regresa todo a 0 (y k a 1)
const VW={ox:0,oz:0,k:1,a:0,t:0},VT={ox:0,oz:0,k:1,a:0,t:0},VK=['ox','oz','k','a','t'],KMIN=.45,KMAX=2.6;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),keys=new Set(),tch=new Map(),hits=[],ray=new THREE.Raycaster(),P2=new THREE.Vector2(),FLOOR=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const touchy=matchMedia('(pointer:coarse)').matches,lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
let dark=lsGet('cont_dark')!=null?lsGet('cont_dark')=='1':matchMedia('(prefers-color-scheme:dark)').matches,camOpen=lsGet('cont_cam')=='1';
// cada pestaña es una persona distinta en la casa (sessionStorage: sobrevive a recargar, no se comparte entre pestañas)
const myId=(()=>{let v=null;try{v=sessionStorage.getItem('casa_id')}catch(e){}if(!v){v=Math.random().toString(36).slice(2,12);try{sessionStorage.setItem('casa_id',v)}catch(e){}}return v})();
// la casa: paredes en x = ±HX, de z = ZB (fondo) a ZF (enfrente)
const HX=17,ZB=-15,ZF=11,TH=1.5;         // TH: altura de las mesas (la de los Miis sentados)
const TB=[{g:'continental',x:-8.5,z:-4,felt:['#2f9a62','#0f4a2d']},{g:'uno',x:0,z:-9,felt:['#c0393f','#5e1218']},{g:'monopolydeal',x:8.5,z:-4,felt:['#3d84cc','#123a68']}].filter(t=>GM[t.g]);
TB.forEach(t=>t.r=2.2);
const OB=[];                             // obstáculos redondos (sillas, muebles): {x,z,r}
const EMO=['👋','😂','🎉','❤️','👍','😮','💃','🕺'],DANCE=['💃','🕺'],DMS=8000;   // los bailes duran DMS ms (o hasta que camines)
const DESC={continental:'Rummy de 7 rondas con contratos de tríos y corridas. Tiene juegos escondidos en el cuarto.',
 uno:'Mismo color, número o símbolo; comodines y ¡UNO! Puedes jugar contra bots.',monopolydeal:'Junta 3 grupos de propiedades completos antes que los demás.'};
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
 monopolydeal:[['m1','#8bc34a','#fff','$5'],['m2','#e53935','#fff','🏠'],['m3','#1e88e5','#fff','$2'],['m4','#fbc02d','#333','$1'],['m5','#7b1fa2','#fff','🏨']]};

// ---------- escena ----------
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();SC.background=new THREE.Color(0x1a120c);CA=new THREE.PerspectiveCamera(42,1,.1,200);
 const hl=new THREE.HemisphereLight(0xfff4e6,0x3a2a1e,1.5);SC.add(hl);
 const Ld=new THREE.DirectionalLight(0xfff0d8,2.2);Ld.position.set(-8,22,10);Ld.castShadow=true;Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0005;
 Object.assign(Ld.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:70});SC.add(Ld);
 root=document.createElement('div');root.id='h3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 lay=document.createElement('div');lay.id='h3lay';document.body.appendChild(lay);   // nombres, globitos y avisos (fuera de #app: no se borran al redibujar)
 buildHouse();me=newAv(pname,v3(0,0,3),Math.PI);
 setTimeout(()=>{if(!moved){moved=true;if(active()&&!inputBusy())render()}},12000);   // la ayuda de arriba se va sola
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',e=>{tch.delete(e.pointerId);pin=null;st=null});
 cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0015))},{passive:false});
 const typing=e=>/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'');
 // teclado: W A S D / flechas = caminar; Q E = girar; R F = inclinar; + − = zoom; Inicio = cuadrar; 1-8 = emotes; Enter = hablar
 addEventListener('keydown',e=>{if(!active()||typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);tgt=null;tgtG=null}
  else if({q:'rl',e:'rr',r:'tu',f:'td','+':'zi','=':'zi','-':'zo'}[k]){e.preventDefault();camBtn({q:'rl',e:'rr',r:'tu',f:'td','+':'zi','=':'zi','-':'zo'}[k])}
  else if(k=='home'){e.preventDefault();camHome()}
  else if(k=='escape'){if(sel){closed=sel;sel=null;render()}else camHome()}
  else if(k=='enter'){const i=$id('h3say');if(i){e.preventDefault();i.focus()}}
  else if(k>='1'&&k<='8')casaEm(EMO[+k-1])});
 addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
 // barra de cámara: dejar presionado repite
 const stopRep=()=>{if(camRep){clearTimeout(camRep.t);clearInterval(camRep.i);camRep=null}};
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('[data-cam]');if(!b||!active())return;e.preventDefault();stopRep();const c=b.dataset.cam;
  if(c=='tog'){camOpen=!camOpen;try{localStorage.setItem('cont_cam',camOpen?'1':'0')}catch(_){}sfx('tick');render();return}
  if(c=='home'){camHome();sfx('tick');return}
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
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(HX*2,ZF-ZB),fm);floor.rotation.x=-Math.PI/2;floor.position.set(0,0,(ZF+ZB)/2);floor.receiveShadow=true;SC.add(floor);
 // tapete grande al centro
 const rug=ctex('rug',512,512,(g,w,h)=>{g.fillStyle='#5a1a1e';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=12;g.strokeRect(20,20,w-40,h-40);g.lineWidth=4;g.strokeRect(46,46,w-92,h-92);
  g.fillStyle='rgba(201,162,74,.35)';for(let i=0;i<6;i++)for(let j=0;j<6;j++){g.beginPath();g.arc(100+i*62,100+j*62,8,0,7);g.fill()}});
 const rg=new THREE.Mesh(new THREE.PlaneGeometry(20,13),std(0xffffff,.95,{map:rug}));rg.rotation.x=-Math.PI/2;rg.position.set(0,.01,-4);rg.receiveShadow=true;SC.add(rg);
 // paredes con lambrín (la de enfrente no, para que la cámara vea)
 const wp=ctex('wall',256,256,(g,w,h)=>{g.fillStyle='#6d5a48';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=32){g.fillStyle='rgba(255,235,200,.06)';g.fillRect(x,0,14,h)}
  g.fillStyle='rgba(255,235,200,.08)';for(let y=16;y<h;y+=64)for(let x=16;x<w;x+=64){g.beginPath();g.arc(x+(y%128?32:0),y,5,0,7);g.fill()}},1);
 const WH=9,wall=(w,x,z,ry)=>{const m=std(0xffffff,.9,{map:wp.clone()});m.map.needsUpdate=true;m.map.repeat.set(w/3,WH/3);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,WH),m);pl.position.set(x,WH/2,z);pl.rotation.y=ry;pl.receiveShadow=true;SC.add(pl);
  const wa=new THREE.Mesh(new THREE.PlaneGeometry(w,2.4),std(0x3e2a1c,.55));wa.position.set(x,1.2,z);wa.rotation.y=ry;wa.translateZ(.03);SC.add(wa);
  const tr=new THREE.Mesh(new THREE.PlaneGeometry(w,.14),std(0x2e1f14,.5));tr.position.set(x,2.45,z);tr.rotation.y=ry;tr.translateZ(.05);SC.add(tr)};
 wall(HX*2,0,ZB,0);wall(ZF-ZB,-HX,(ZF+ZB)/2,Math.PI/2);wall(ZF-ZB,HX,(ZF+ZB)/2,-Math.PI/2);
 // ventanas de noche al fondo
 const sky=ctex('sky',256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0a1230');gr.addColorStop(1,'#26407a');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#fff';for(let i=0;i<60;i++){g.globalAlpha=.3+(i%5)*.14;g.fillRect((i*71)%w,(i*37)%(h*.7),2,2)}g.globalAlpha=1;g.fillStyle='#f4f1d0';g.beginPath();g.arc(190,60,18,0,7);g.fill()});
 [-9,9].forEach(wx=>{const win=new THREE.Mesh(new THREE.PlaneGeometry(4.5,3.2),new THREE.MeshBasicMaterial({map:sky}));win.position.set(wx,5.4,ZB+.06);SC.add(win);
  const fr=std(0xe9e2d0,.5);box(4.8,.18,.3,fr,wx,7.1,ZB+.12);box(4.8,.25,.45,fr,wx,3.7,ZB+.2);box(.18,3.4,.3,fr,wx-2.33,5.4,ZB+.12);box(.18,3.4,.3,fr,wx+2.33,5.4,ZB+.12);box(.1,3.2,.2,fr,wx,5.4,ZB+.1)});
 // letrero de la casa en la pared del fondo
 const logo=ctex('logo',512,128,(g,w,h)=>{g.fillStyle='#2a1a10';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle='#c9a24a';g.lineWidth=6;rr(g,10,10,w-20,h-20,14);g.stroke();
  g.font='bold 54px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f4d58a';g.fillText('🎴 Casa de juegos',w/2,h/2+3)});
 const lg=new THREE.Mesh(new THREE.PlaneGeometry(6,1.5),std(0xffffff,.6,{map:logo}));lg.position.set(0,6.6,ZB+.08);SC.add(lg);
 // sofá a la derecha, librero a la izquierda, plantas en las esquinas
 const sofa=std(0x2f4a5a,.85),sx=HX-1.4,sz=3;const so=new THREE.Group();so.position.set(sx,0,sz);so.rotation.y=-Math.PI/2;SC.add(so);
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
 TB.forEach(t=>buildTable(t));
 // marca donde tocaste el piso
 mark=new THREE.Mesh(new THREE.RingGeometry(.25,.4,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));mark.rotation.x=-Math.PI/2;mark.position.y=.03;SC.add(mark)}
function buildTable(t){const G=new THREE.Group();G.position.set(t.x,0,t.z);SC.add(G);const hit={t:'table',g:t.g},wood=std(0x4a2814,.45);
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
function disposeG(g){SC.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()})}
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
function seatSync(){const want=new Map();TB.forEach(t=>{rooms.filter(r=>r.g==t.g&&r.st=='play').flatMap(r=>r.ps).slice(0,t.chairs.length).forEach((n,j)=>want.set(t.g+':'+j+':'+n,{t,j,n}))});
 seated.forEach((s,k)=>{if(!want.has(k)){disposeG(s.g);s.t.chairs[s.j].visible=true;seated.delete(k)}});
 want.forEach((w,k)=>{if(seated.has(k))return;const c=w.t.chairs[w.j],g=mkG(w.n,1);c.visible=false;
  g.position.set(w.t.x+c.position.x,1.55,w.t.z+c.position.z);g.rotation.y=Math.atan2(-c.position.x,-c.position.z);seated.set(k,{g,t:w.t,j:w.j,seed:Math.random()*10})})}
function solve(p){p.x=Math.max(-HX+1,Math.min(HX-1,p.x));p.z=Math.max(ZB+1.2,Math.min(ZF-1,p.z));
 TB.concat(OB).forEach(o=>{const r=(o.g?o.r+.45:o.r)+.35,dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz);if(d<r&&d>1e-4){p.x=o.x+dx/d*r;p.z=o.z+dz/d*r}})}
function turn(a,yaw){let d=yaw-a.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));a.g.rotation.y+=d*.18}
function walk(dt,now){const a=me,p=a.pos,cy=VW.a,fw=v3(-Math.sin(cy),0,-Math.cos(cy)),rt=v3(Math.cos(cy),0,-Math.sin(cy)),dir=v3(0,0,0);
 if(keys.has('w')||keys.has('arrowup'))dir.add(fw);if(keys.has('s')||keys.has('arrowdown'))dir.sub(fw);if(keys.has('d')||keys.has('arrowright'))dir.add(rt);if(keys.has('a')||keys.has('arrowleft'))dir.sub(rt); if(!dir.lengthSq()&&tgt){dir.subVectors(tgt,p).setY(0);if(dir.length()<.12){dir.set(0,0,0);arrive()}}
 const sp=5.2*dt/1000;let mv=0;
 if(dir.lengthSq()){dir.normalize();const q=p.clone();p.addScaledVector(dir,sp);solve(p);mv=q.distanceTo(p);
  // si moviste la cámara, se queda donde la dejaste (no sigue a tu Mii) hasta que toques Cuadrar
  if(panned()){const dx=p.x-q.x,dz=p.z-q.z;VT.ox-=dx;VT.oz-=dz;VW.ox-=dx;VW.oz-=dz}a.yaw=Math.atan2(dir.x,dir.z);a.danceT=-1e9;if(!moved){moved=true;render()}
  // atorado contra una silla o mueble camino a una mesa: ya llegó
  if(tgt){stuck=mv<sp*.3?stuck+1:0;if(stuck>8)arrive()}}
 a.w+=((mv>.001?1:0)-a.w)*.15;a.ph+=mv*3.1;
 // mirar hacia la mesa al llegar
 const t=sel&&TB.find(x=>x.g===sel);if(t&&!mv)a.yaw=Math.atan2(t.x-p.x,t.z-p.z);
 turn(a,a.yaw);a.g.position.set(p.x,1.57,p.z);pose(a,now,!!sel);
 // ¿cerca de una mesa? abre su ventanita (si la cerraste, hasta que te alejes)
 let near=null;TB.forEach(x=>{const dd=Math.hypot(p.x-x.x,p.z-x.z);x.near=dd<x.r+2.3;if(x.near&&!near)near=x.g;x.ring.material.opacity+=((x.near?.75:0)-x.ring.material.opacity)*.12});
 if(closed&&closed!==near)closed=null;const want=near&&near!==closed?near:null;if(want!==sel){sel=want;if(sel)sfx('tick');render()}}
// los demás: se deslizan suave hacia la última posición que mandó el servidor
function walkOthers(dt,now){const f=1-Math.exp(-dt/110);others.forEach(a=>{const q=a.pos.clone();a.pos.lerp(a.to,f);const mv=q.distanceTo(a.pos);
 a.w+=((mv>.002?1:0)-a.w)*.15;a.ph+=mv*3.1;if(mv>.02)a.danceT=-1e9;if(mv>.002)a.tyaw=Math.atan2(a.pos.x-q.x,a.pos.z-q.z);turn(a,a.tyaw);a.g.position.set(a.pos.x,1.57,a.pos.z);pose(a,now,false)});
 seated.forEach(s=>poseSeated(s,now))}
function arrive(){tgt=null;stuck=0;if(tgtG){closed=null;tgtG=null}}
// llega por el hueco entre dos sillas que le quede más cerca (las sillas están a 45°, los huecos a 0°, 90°, 180° y 270°)
function goTable(g){const t=TB.find(x=>x.g===g);if(!t)return;const p=me.pos,a=Math.round(Math.atan2(p.z-t.z,p.x-t.x)/(Math.PI/2))*(Math.PI/2);
 tgt=v3(t.x+Math.cos(a)*(t.r+1.5),0,t.z+Math.sin(a)*(t.r+1.5));solve(tgt);tgtG=g;closed=null;stuck=0;showMark(tgt);sfx('card')}
function showMark(p){mark.position.set(p.x,.03,p.z);mark.material.opacity=.9;mark.scale.setScalar(1)}

// ---------- en vivo: mando mi posición y recibo a los demás + las salas (cada ~0.3 s) ----------
function inputBusy(){const a=document.activeElement;return !!(a&&/INPUT|TEXTAREA/.test(a.tagName)&&a.closest&&a.closest('#app'))}
async function net(now){if(netBusy||now-netT<300)return;netBusy=true;netT=now;
 const b={id:myId,name:(pname||'').trim()||'Jugador',x:me.pos.x,z:me.pos.z,yaw:me.yaw,w:me.w>.3?1:0};if(outEm){b.em=outEm;outEm=null}if(outSay){b.say=outSay;outSay=null}
 try{const d=await api('casa',b);if(active())netSync(d)}catch(e){}netBusy=false}
function netSync(d){const seen=new Set(),n0=others.size;
 (d.p||[]).forEach(o=>{seen.add(o.id);let a=others.get(o.id);const pos=v3(+o.x||0,0,+o.z||0);
  if(!a){a=newAv(o.name,pos,+o.yaw||0);a.emN=o.emN;a.sayN=o.sayN;others.set(o.id,a);if(synced)toast(`👋 ${o.name} entró a la casa`)}
  else if(a.name!==o.name)rename(a,o.name);
  a.to.copy(pos);if(!o.w&&a.to.distanceTo(a.pos)<.05)a.tyaw=+o.yaw||a.tyaw;
  if(o.em&&o.emN!==a.emN){a.emN=o.emN;bubble(a,o.em,1)}if(o.say&&o.sayN!==a.sayN){a.sayN=o.sayN;bubble(a,o.say)}});
 others.forEach((a,id)=>{if(!seen.has(id)){if(synced)toast(`${a.name} salió`);dropAv(a);others.delete(id)}});
 rooms=d.r||[];const k=JSON.stringify(rooms)+'|'+others.size;synced=true;
 if(k!==roomsKey){const rk=roomsKey.split('|')[0],nk=k.split('|')[0];roomsKey=k;if(rk!==nk)seatSync();if(!inputBusy())render()}}
// globitos (lo que dijo o su emote) y nombres arriba de cada Mii
function bubble(a,t,emo){if(a.bub)a.bub.remove();const el=document.createElement('div');el.className='h3bub'+(emo?' emo':'');el.textContent=t;lay.appendChild(el);a.bub=el;a.bubT=performance.now()+(emo?3000:6000);if(emo){if(DANCE.includes(t)){a.dance=t;a.danceT=performance.now()}else a.waveT=performance.now()}}
function toast(t){let box=$id('h3toasts');if(!box){box=document.createElement('div');box.id='h3toasts';lay.appendChild(box)}const el=document.createElement('div');el.className='w7 w7g h3toast';el.textContent=t;box.appendChild(el);setTimeout(()=>el.remove(),3200)}
function tags(now){const all=[me,...others.values()];all.forEach(a=>{if(!a.tag){a.tag=document.createElement('div');a.tag.className='w7 t3pl h3nm'+(a===me?' me':'');a.tag.textContent=(a.name||'').trim()||'Tú';lay.appendChild(a.tag)}
  const [x,y,vis]=toPx(v3(a.pos.x,3.45,a.pos.z));a.tag.style.display=vis?'':'none';a.tag.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
  if(a.bub){if(now>a.bubT){a.bub.remove();a.bub=null}else{const [bx,by]=toPx(v3(a.pos.x,4.05,a.pos.z));a.bub.style.display=vis?'':'none';a.bub.style.transform=`translate(${bx}px,${by}px) translate(-50%,-100%)`;a.bub.classList.toggle('out',a.bubT-now<400)}}})}

// ---------- cámara: sigue a tu Mii desde atrás y arriba; la puedes mover, girar, inclinar y acercar libremente ----------
const selOff=v3(0,0,0),selT=v3(0,0,0),AH=()=>por?6:5;   // AH: la cámara mira un poco adelante de tu Mii
const EL=()=>por?1.08:.9,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// punto de la casa al centro de la pantalla
function center(V){const p=me.pos;return v3(p.x+V.ox-Math.sin(V.a)*AH(),0,p.z+V.oz-Math.cos(V.a)*AH())}
function applyCam(){const c=center(VW).add(selOff),a=VW.a,d=(por?28:19)/VW.k,el=EL()+VW.t;
 CA.position.set(c.x+Math.sin(a)*Math.cos(el)*d,Math.sin(el)*d+1,c.z+Math.cos(a)*Math.cos(el)*d);CA.lookAt(c.x,1,c.z);CA.updateMatrixWorld()}
function clampV(){VT.k=Math.max(KMIN,Math.min(KMAX,VT.k));VT.t=Math.max(.32-EL(),Math.min(1.45-EL(),VT.t));
 // que el centro no se salga de la casa
 const c=center(VT),cx=Math.max(-HX,Math.min(HX,c.x)),cz=Math.max(ZB,Math.min(ZF,c.z));VT.ox+=cx-c.x;VT.oz+=cz-c.z}
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);applyCam()}
function camStep(dt,snapNow){if(snapNow){VK.forEach(q=>VW[q]=VT[q])}else{const f=RM?1:1-Math.exp(-dt/110);VK.forEach(q=>{VW[q]+=(VT[q]-VW[q])*f})}
 // en celular parado, con la ventanita de la mesa abierta (abajo), la mesa y tu Mii se suben a la parte de arriba (si no moviste la cámara)
 const t=por&&sel&&!viewed()&&TB.find(x=>x.g===sel),p=me.pos;
 if(t)selT.set((t.x+p.x)/2+Math.sin(VW.a)*6,0,(t.z+p.z)/2+Math.cos(VW.a)*6).sub(center(VW));else selT.set(0,0,0);selOff.lerp(selT,snapNow?1:.1);applyCam()}
const panned=()=>Math.abs(VT.ox)>.3||Math.abs(VT.oz)>.3,viewed=()=>panned()||Math.abs(VT.k-1)>.03||Math.abs(wrap(VT.a))>.02||Math.abs(VT.t)>.02;
function camHome(){VW.a=wrap(VW.a);Object.assign(VT,{ox:0,oz:0,k:1,a:0,t:0})}
function camBtn(c){if(c=='rl')VT.a-=.2;else if(c=='rr')VT.a+=.2;else if(c=='zi')VT.k*=1.2;else if(c=='zo')VT.k/=1.2;else if(c=='tu')VT.t+=.09;else if(c=='td')VT.t-=.09;else return;clampV()}
// punto del piso debajo del dedo/ratón
function ground(x,y){const r=cv.getBoundingClientRect();P2.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(FLOOR,v3(0,0,0))}
// zoom hacia donde apuntas (rueda del ratón)
function zoomAt(x,y,k){const p=ground(x,y);k=Math.max(KMIN,Math.min(KMAX,k));if(!p){VT.k=k;return clampV()}const c=center(VT),f=VT.k/k;
 VT.ox+=(p.x-c.x)*(1-f);VT.oz+=(p.z-c.z)*(1-f);VT.k=k;clampV()}
function layout(){W=innerWidth;H=innerHeight;por=W/H<.95;R.setSize(W,H,false);CA.aspect=W/H;CA.fov=por?52:42;CA.updateProjectionMatrix()}
function toPx(p){const q=p.clone().project(CA);return [(q.x+1)/2*W,(1-q.y)/2*H,q.z<1]}

// ---------- tocar: piso = caminar ahí, mesa o letrero = ir a esa mesa ----------
// Ratón: arrastrar (izquierdo o derecho) = mover la cámara; clic de rueda o Shift + clic derecho = girar e inclinar; rueda = zoom.
// Dedo: arrastrar = mover; dos dedos = pellizcar para zoom, girarlos para rotar, subirlos o bajarlos juntos para inclinar
function pick(e){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(hits,false);if(h.length)return h[0].object.userData.hit;const p=ray.ray.intersectPlane(FLOOR,v3(0,0,0));return p?{t:'floor',p}:null}
function pDown(e){if(!active())return;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
 if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(tch.size==2){st=null;const [a,b]=[...tch.values()];VK.forEach(q=>VT[q]=VW[q]);
   pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VW.k,g:ground((a[0]+b[0])/2,(a[1]+b[1])/2),ang:Math.atan2(b[1]-a[1],b[0]-a[0]),acc:0,rot:false,my:(a[1]+b[1])/2,mx:(a[0]+b[0])/2,t:VW.t,mode:null};return}
  if(tch.size>2)return}
 if(e.button==1)e.preventDefault();
 const rot=e.button==1||(e.button==2&&e.shiftKey),pan=e.button==2&&!rot;if(pan||rot)cv.style.cursor=rot?'move':'grabbing';
 st={x:e.clientX,y:e.clientY,pid:e.pointerId,pan,rot,a0:VW.a,t0:VW.t,g:null};try{cv.setPointerCapture(e.pointerId)}catch(_){}}
function pMove(e){if(!active())return;
 if(tch.has(e.pointerId)){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(pin&&tch.size>=2){const [a,b]=[...tch.values()],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]),dd=Math.hypot(a[0]-b[0],a[1]-b[1])-pin.d;let da=wrap(ang-pin.ang);pin.ang=ang;
   // ¿inclinar o mover? si los dos dedos suben/bajan juntos sin abrirse ni girar, es inclinar
   if(!pin.mode){const dy=my-pin.my,dx=mx-pin.mx;if(Math.abs(dy)>16&&Math.abs(dd)<Math.abs(dy)*.35&&Math.abs(dx)<Math.abs(dy)*.6&&Math.abs(pin.acc+da)<.1)pin.mode='tilt';else if(Math.abs(dd)>14||Math.abs(dx)>16||Math.abs(pin.acc+da)>.12)pin.mode='free'}
   if(pin.mode=='tilt'){VT.t=pin.t+(my-pin.my)*.006;snap();return}
   if(!pin.mode)return;
   pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.12){pin.rot=true;da=pin.acc}if(pin.rot)VT.a=VW.a+da;
   VT.k=pin.k*(Math.hypot(a[0]-b[0],a[1]-b[1])||1)/pin.d;snap();
   const p=ground(mx,my);if(p&&pin.g){VT.ox+=pin.g.x-p.x;VT.oz+=pin.g.z-p.z;snap()}return}}
 if(!st){if(e.pointerType==='mouse'){const h=pick(e);cv.style.cursor=h&&h.t=='table'?'pointer':'default'}return}
 if(e.pointerId!==st.pid)return;
 if(st.rot){VT.a=st.a0+(e.clientX-st.x)*.007;VT.t=st.t0+(e.clientY-st.y)*.005;snap();return}
 // mover la cámara: el punto que agarraste se queda bajo el dedo
 if(st.g||st.pan||Math.hypot(e.clientX-st.x,e.clientY-st.y)>10){if(!st.g){st.g=ground(st.x,st.y);if(!st.pan)cv.style.cursor='grabbing'}
  const p=ground(e.clientX,e.clientY);if(st.g&&p){VT.ox=VW.ox+st.g.x-p.x;VT.oz=VW.oz+st.g.z-p.z;VT.k=VW.k;snap()}}}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}if(!st||e.pointerId!==st.pid)return;const s=st;st=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 if(s.pan||s.rot||s.g){cv.style.cursor='default';return}const h=pick(e);if(!h)return;
 if(h.t=='table')return goTable(h.g);
 tgt=h.p.setY(0);tgtG=null;solve(tgt);showMark(tgt)}
// botón Cuadrar: aparece solo si moviste la cámara
function viewBtn(){const el=$id('t3view');if(!el)return;const k=viewed()?'1':'';if(el.dataset.k===k)return;el.dataset.k=k;el.style.display=k?'':'none'}

// ---------- capa de controles ----------
const ic=d=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC={cam:ic('<path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/>'),
 rl:ic('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 3v5h5"/>'),rr:ic('<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v5h-5"/>'),
 zi:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/>'),zo:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M7.5 10.5h6"/>'),
 tu:ic('<path d="M3 18h18M6 18l3-6h6l3 6"/><path d="M12 9V3M9 6l3-3 3 3"/>'),td:ic('<path d="M2 16l5-6h10l5 6z"/><path d="M12 7V2M9 5l3 2 3-2"/>'),
 home:ic('<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>')};
function camUI(){const cb=(c,t)=>`<button class="w7b" data-cam="${c}" title="${t}" aria-label="${t}">${IC[c]}</button>`;
 return `<button id="t3view" class="w7 w7b" onclick="casaHome()" style="display:none" title="Regresar la cámara a tu Mii (Inicio)">${IC.home} Cuadrar</button>
 <div id="t3cam" class="w7${camOpen?' open':''}"><button class="w7b tog" data-cam="tog" title="Cámara" aria-label="Cámara" aria-expanded="${camOpen}">${IC.cam}</button>
 <div class="w7g pan">${cb('rl','Girar a la izquierda (Q)')}${cb('rr','Girar a la derecha (E)')}${cb('zi','Acercar (+)')}${cb('zo','Alejar (−)')}${cb('tu','Ver más desde arriba (R)')}${cb('td','Ver más de lado (F)')}
 <button class="w7b wide" data-cam="home" title="Cuadrar la cámara (Inicio)">${IC.home} Cuadrar</button></div></div>`}
function tinfo(g){const pl=rooms.filter(r=>r.g==g&&r.st=='play').reduce((a,r)=>a+r.n,0),op=rooms.filter(r=>r.g==g&&r.st=='lobby');return {pl,op}}
function hud(){const g=sel&&GM[sel],n=others.size+1;
 let o=`<div id="h3top" class="w7 w7g"><span class="h3t">🏠 <b>Casa de juegos</b></span><span class="h3ppl" title="Personas en la casa">👥 ${n}</span><input id="h3name" placeholder="Tu nombre" maxlength="14" value="${esc(pname)}" oninput="pname=this.value;casaName()" aria-label="Tu nombre">
  ${typeof musCyc=='function'?`<button class="w7b" onclick="musCyc()" title="Música: ${musName()}" aria-label="Música">${musName()=='apagada'?'🔇':'🎵'}</button>`:''}<button class="w7b" onclick="casaToggle()" title="Pantalla de inicio clásica">2D</button></div>`;
 if(!moved)o+=`<div id="h3hint" class="w7 w7g">${touchy?'👆 Toca el piso para caminar · toca una mesa para jugar · arrastra para mover la cámara, dos dedos para girar y acercar':'🖱 Clic en el piso para caminar (o W A S D) · clic en una mesa para jugar · arrastra para mover la cámara · rueda para acercar · Q E para girar'}</div>`;
 o+=camUI();
 TB.forEach(t=>{const G=GM[t.g],{pl,op}=tinfo(t.g),sub=t.g===sel?'aquí':[pl?pl+' jugando':'',op.length?op.length+(op.length>1?' salas abiertas':' sala abierta'):''].filter(Boolean).join(' · ')||'toca para jugar';
  o+=`<div class="w7 w7g h3sign${t.g===sel?' on':''}${op.length?' open':''}" data-g="${t.g}" onclick="casaGo('${t.g}')">${G.emoji} <b>${G.name}</b><small>${sub}</small></div>`});
 if(msg&&!g)o+=`<div class="w7 t3msg">${esc(msg)}</div>`;
 // te invitaron con un enlace: unirte sin tener que caminar
 if(!g&&code&&code.length==5)o+=`<div id="h3inv" class="w7 w7g">Te invitaron a la sala <b>${esc(code)}</b><button class="w7b p" onclick="joinR()">Unirme</button></div>`;
 // emotes y para hablar (lo ven todos los que están en la casa)
 o+=`<div id="h3bar" class="w7 w7g">${EMO.map((e,i)=>`<button class="w7b em" onclick="casaEm('${e}')" title="${e} (tecla ${i+1})" aria-label="Emote ${e}">${e}</button>`).join('')}<span class="say"><input id="h3say" maxlength="80" placeholder="Di algo…" onkeydown="if(event.key==='Enter')casaSay();else if(event.key==='Escape')this.blur()" aria-label="Decir algo"><button class="w7b" onclick="casaSay()" aria-label="Decir">💬</button></span></div>`;
 if(g){const {pl,op}=tinfo(sel),pr=rooms.filter(r=>r.g==sel&&r.st=='play'&&r.w);
  o+=`<div id="h3win" class="w7 w7win" role="dialog" aria-labelledby="h3wt"><div class="wt"><span id="h3wt">${g.emoji} ${g.name}</span><button class="wx" onclick="casaClose()" aria-label="Cerrar">✕</button></div>
  <div class="wb"><div class="h3d">${DESC[sel]||''} <span class="h3n">Hasta ${g.max} jugadores.${pl?` Ahora: ${pl} jugando.`:''}</span></div>
  ${op.length?`<div class="h3rooms"><span>Salas esperando jugadores</span>${op.slice(0,5).map(r=>`<div><span>Sala de <b>${esc(r.host)}</b></span><small>${r.n}/${r.max}</small><button class="w7b p" onclick="casaJoin('${esc(r.c)}')">Unirme</button></div>`).join('')}</div>`:''}
  ${pr.length?`<div class="h3rooms h3watch"><span>Partidas en curso</span>${pr.slice(0,5).map(r=>`<div><span>${esc(r.ps.slice(0,3).join(', '))}${r.n>3?'…':''}</span><small>${r.sp?'👁 '+r.sp:''}</small><button class="w7b" onclick="casaWatch('${esc(r.w)}')" title="Mirar sin jugar">👁 Ver</button></div>`).join('')}</div>`:''}
  <div class="h3b"><button class="w7b${op.length?'':' dflt'}" onclick="casaPlay('listo')">▶ Crear sala y jugar</button><button class="w7b" onclick="casaPlay('host')" title="Creas la sala y la administras, sin jugar">👑 Solo administrar</button></div>
  <div class="h3j"><span>¿Tienes un código?</span><input id="h3code" placeholder="Código" maxlength="5" value="${esc(code)}" oninput="code=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')joinR()" aria-label="Código de la sala"><button class="w7b" onclick="joinR()">Unirme</button></div>
  ${msg?`<div class="h3m">${esc(msg)}</div>`:''}</div></div>`}
 return o}
// letreros: siguen a su mesa en la pantalla
function labels(){const tb=$id('h3top'),y0=tb?tb.getBoundingClientRect().bottom+4:0;
 document.querySelectorAll('#app .h3sign').forEach(el=>{const t=TB.find(x=>x.g===el.dataset.g);if(!t)return;const [x,y,vis]=toPx(v3(t.x,TH+2.5,t.z)),hw=el.offsetWidth/2+4;
  el.style.display=vis?'':'none';el.style.transform=`translate(${Math.max(hw,Math.min(W-hw,x))}px,${Math.max(y0+el.offsetHeight,y)}px) translate(-50%,-100%)`})}   // nunca debajo de la barra de arriba

// ---------- engancharse a la pantalla de inicio ----------
function active(){return on&&!S}
function loop(now){requestAnimationFrame(loop);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none')){root.style.display=lay.style.display=a?'block':'none'}document.documentElement.classList.toggle('h3on',a);if(!a){keys.clear();return}
 document.documentElement.classList.toggle('c3dark',dark);
 if(innerWidth!==W||innerHeight!==H){layout();camStep(dt,true)}
 net(now);walk(dt,now);walkOthers(dt,now);camStep(dt,false);viewBtn();mark.material.opacity*=.96;mark.scale.multiplyScalar(1.01);
 if(fire){fire.light.intensity=16+5*Math.sin(now*.013)+3*Math.sin(now*.031+1);fire.flames.forEach((f,i)=>{f.scale.y=1+.18*Math.sin(now*.02+i*1.7);f.scale.x=f.scale.z=1+.08*Math.sin(now*.017+i)})}
 if(disco){const any=[me,...others.values()].some(a=>dancing(a,now)>0);disco.lvl+=((any?1:0)-disco.lvl)*.05;disco.ball.rotation.y+=dt*(.0004+.0016*disco.lvl);
  disco.dl.forEach((l,i)=>{const a=now/900+i*2.09;l.position.set(Math.cos(a)*5,2.5,-4+Math.sin(a)*3.5);l.intensity=22*disco.lvl})}
 labels();tags(now);R.render(SC,CA)}
home=function(){if(!active())return origHome()+(on?'':`<button class="b g" onclick="casaToggle()">🏠 Entrar a la casa 3D</button>`);
 try{init();return hud()}catch(e){console.warn('Casa 3D:',e);on=false;return origHome()}};
window.casaToggle=()=>{on=!on;try{localStorage.setItem('casa_3d',on?'1':'0')}catch(e){}render()};
window.casaGo=g=>{if(sel===g)return;goTable(g)};
window.casaHome=()=>{camHome();sfx('tick')};window.casaClose=()=>{closed=sel;sel=null;sfx('tick');render()};
window.casaPlay=mode=>{if(!sel)return;pgame=sel;mk(mode)};
window.casaJoin=c=>{code=c;joinR()};
window.casaWatch=c=>watchR(c);
window.casaEm=e=>{if(!active()||!EMO.includes(e))return;outEm=e;bubble(me,e,1);sfx('tick')};
window.casaSay=()=>{const i=$id('h3say'),t=i&&i.value.trim().slice(0,80);if(!t)return;i.value='';outSay=t;bubble(me,t);sfx('tick')};
let nmT=null;window.casaName=()=>{clearTimeout(nmT);nmT=setTimeout(()=>rename(me,pname),350)};
})();
