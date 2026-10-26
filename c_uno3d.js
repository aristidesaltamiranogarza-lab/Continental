// Uno 3D: mesa 3D a pantalla completa para el Uno, en el mismo cuarto y con los mismos Miis del Continental 3D. NO cambia reglas ni servidor.
// Se carga DESPUÉS de c_uno.js y c_continental3d.js. Envuelve GM.uno.body/after y usa las mismas acciones que la vista 2D
// (uplay, ucol, udraw, upass, uuno, ucatch). Lobby y final se ven como siempre.
(function(){
if(typeof THREE==='undefined'||typeof GM==='undefined'||!GM.uno){console.warn('Uno 3D: falta Three.js o GM.uno');return}
const orig=GM.uno.body,origAfter=GM.uno.after,K3=window.C3D||null;   // K3: cuarto y Miis del Continental 3D (si no está, mesa sola)
let on=true;try{on=localStorage.getItem('uno_3d')!=='0'}catch(e){}
let R,SC,CA,root,cv,ready=false,W=0,H=0,L=null,tableKey='',felt=null,tbl=null,ringG=null,ringM=null,dpvEl=null;
let menu=false,msgK='',msgT=0,dealN=-1,logN=-1,first=true,dealing=false,dl=0,hov=null,st=null,drag=null,menuOpen=new Set(),menuScroll=0,myTc=null,lastNow=0,pin=null,camRep=null;
let pile=[],ringBoost=0,ringDir=1,winHide=false;       // pile: las últimas cartas del descarte (el servidor solo manda la de arriba)
const meshes=new Map(),texC={},glows=new Map(),hits=[],avs=new Map();
const CW=1,CH=1.5,CT=.012,D=3;           // carta base (unidades del mundo) y distancia de tu mano a la cámara
const TW=256,TH=384;                     // tamaño de las texturas de carta
const ray=new THREE.Raycaster();ray.layers.enableAll();   // capa 1 = tu mano (se dibuja encima de todo)
const P2=new THREE.Vector2(),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),Qe=(x,y,z)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
const FD=Qe(0,0,Math.PI);                // boca abajo sobre la mesa
const $=s=>document.querySelector(s),lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}},touchy=matchMedia('(pointer:coarse)').matches;
const hh=n=>(Math.imul(n+7,2654435761)>>>0);   // "azar" fijo por carta (cómo cae en el descarte)
// cámara libre: VT = adónde va, VW = dónde está (x,z = punto de la mesa al centro, k = zoom, a = giro, t = inclinación). who = jugador que estás mirando
const VW={x:0,z:0,k:1,a:0,t:0},VT={x:0,z:0,k:1,a:0,t:0,who:-1},KMAX=4,PL=new THREE.Plane(new THREE.Vector3(0,1,0),0),tch=new Map();
// mismas preferencias que el Continental 3D (barra de cámara, barra de arriba, modo oscuro)
let camOpen=lsGet('cont_cam')=='1',mini=lsGet('cont_mini')=='1';
let dark=lsGet('cont_dark')!=null?lsGet('cont_dark')=='1':matchMedia('(prefers-color-scheme:dark)').matches;
const setDark=d=>{dark=d;try{localStorage.setItem('cont_dark',d?'1':'0')}catch(e){}};
// colores de las cartas (más vivos que en la vista 2D) y su sombra
const UC=['#e53935','#fbc02d','#43a047','#1e88e5'],UCD=['#9e1b1b','#c47f00','#1b6b2a','#0d4a9c'];
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
// símbolo de la carta (número, salto, reversa, +2, +4) con contorno; s = tamaño
function sym(g,c,x,y,s,fill,line){g.save();g.translate(x,y);g.lineJoin='round';g.lineCap='round';
 const ink=w=>{g.lineWidth=w+s*.09;g.strokeStyle=line;g.stroke();g.lineWidth=w;g.strokeStyle=fill;g.stroke()};
 if(c.t=='s'){g.beginPath();g.arc(0,0,s*.32,0,7);ink(s*.11);g.beginPath();g.moveTo(-s*.22,s*.22);g.lineTo(s*.22,-s*.22);ink(s*.11)}
 else if(c.t=='r'){g.rotate(-Math.PI/4);[1,-1].forEach(d=>{g.save();g.scale(d,d);g.beginPath();g.moveTo(-s*.32,-s*.14);g.lineTo(s*.1,-s*.14);ink(s*.1);
   g.beginPath();g.moveTo(s*.08,-s*.32);g.lineTo(s*.36,-s*.14);g.lineTo(s*.08,s*.04);g.closePath();g.lineWidth=s*.09;g.strokeStyle=line;g.stroke();g.fillStyle=fill;g.fill();g.restore()})}
 else{const t=c.t=='n'?String(c.n):c.t=='d'?'+2':'+4';g.font=`italic 900 ${Math.round(t.length>1?s*.74:s)}px "Arial Black","Segoe UI",Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';
  g.lineWidth=s*.1;g.strokeStyle=line;g.strokeText(t,0,s*.04);g.fillStyle=fill;g.fillText(t,0,s*.04);
  if(c.t=='n'&&(c.n==6||c.n==9)){g.beginPath();g.moveTo(-s*.2,s*.46);g.lineTo(s*.2,s*.46);ink(s*.07)}}   // 6 y 9 subrayados
 g.restore()}
// óvalo de 4 colores de los comodines
function wildOval(g,x,y,rx,ry,a){g.save();g.translate(x,y);g.rotate(a);
 [0,3,1,2].forEach((col,q)=>{g.beginPath();g.moveTo(0,0);g.ellipse(0,0,rx,ry,0,(q-1)*Math.PI/2,q*Math.PI/2);g.closePath();g.fillStyle=UC[col];g.fill()});
 g.lineWidth=Math.max(2,rx*.07);g.strokeStyle='#fff';g.beginPath();g.ellipse(0,0,rx,ry,0,0,7);g.stroke();g.restore()}
function shine(g){const sh=g.createLinearGradient(0,0,TW*.7,TH);sh.addColorStop(0,'rgba(255,255,255,.3)');sh.addColorStop(.42,'rgba(255,255,255,.06)');sh.addColorStop(.47,'rgba(255,255,255,0)');g.fillStyle=sh;g.fillRect(0,0,TW,TH)}
function faceTex(id){const k='f'+id+(cbl?'c':'');if(texC[k])return texC[k];
 const c=U(id),cn=cnv(TW,TH),g=cn.getContext('2d'),wild=c.c==4,col=wild?'#1c1c1c':UC[c.c];
 g.fillStyle='#fdfdfb';rr(g,0,0,TW,TH,24);g.fill();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;rr(g,1,1,TW-2,TH-2,23);g.stroke();
 g.save();rr(g,13,13,TW-26,TH-26,16);g.clip();
 const gr=g.createLinearGradient(0,0,TW,TH);gr.addColorStop(0,wild?'#3a3a3a':col);gr.addColorStop(1,wild?'#050505':UCD[c.c]);g.fillStyle=gr;g.fillRect(0,0,TW,TH);
 if(wild)wildOval(g,TW/2,TH/2,90,150,.45);
 else{g.save();g.translate(TW/2,TH/2);g.rotate(.45);g.fillStyle='#fff';g.beginPath();g.ellipse(0,0,88,150,0,0,7);g.fill();g.restore()}
 shine(g);g.restore();
 if(c.t=='f')sym(g,c,TW/2,TH/2,124,'#fff','#111');else if(!wild)sym(g,c,TW/2,TH/2,c.t=='n'?150:132,col,'#111');
 // esquinas en blanco (la de abajo, de cabeza)
 const cs=rot=>{g.save();if(rot){g.translate(TW,TH);g.rotate(Math.PI)}if(c.t=='w')wildOval(g,42,54,15,24,.45);else sym(g,c,44,54,50,'#fff','rgba(0,0,0,.6)');g.restore()};cs(0);cs(1);
 // letra del color (opción de la vista 2D, ayuda si confundes colores)
 if(cbl&&!wild){g.font='800 30px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.6)';
  [[TW-40,44,0],[40,TH-44,1]].forEach(([x,y,r])=>{g.save();g.translate(x,y);if(r)g.rotate(Math.PI);g.strokeText('RAVZ'[c.c],0,0);g.fillStyle='#fff';g.fillText('RAVZ'[c.c],0,0);g.restore()})}
 return texC[k]=tx(cn)}
function backTex(){if(texC.b)return texC.b;const cn=cnv(TW,TH),g=cn.getContext('2d');
 g.fillStyle='#fdfdfb';rr(g,0,0,TW,TH,24);g.fill();g.save();rr(g,13,13,TW-26,TH-26,16);g.clip();
 const gr=g.createRadialGradient(TW/2,TH/2,20,TW/2,TH/2,TH*.7);gr.addColorStop(0,'#2c2c2c');gr.addColorStop(1,'#050505');g.fillStyle=gr;g.fillRect(0,0,TW,TH);
 g.save();g.translate(TW/2,TH/2);g.rotate(.45);const rg=g.createLinearGradient(-90,-150,90,150);rg.addColorStop(0,'#ff5a4a');rg.addColorStop(1,'#b3140c');g.fillStyle=rg;g.beginPath();g.ellipse(0,0,90,150,0,0,7);g.fill();g.restore();
 g.save();g.translate(TW/2,TH/2+4);g.rotate(-.35);g.font='italic 900 80px "Arial Black","Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
 g.lineWidth=16;g.strokeStyle='#111';g.strokeText('UNO',0,0);g.fillStyle='#fdd835';g.fillText('UNO',0,0);g.restore();
 shine(g);g.restore();return texC.b=tx(cn)}
function glowTex(){if(texC.glow)return texC.glow;const c=cnv(256,256),g=c.getContext('2d');g.shadowColor='#fff';g.shadowBlur=34;g.fillStyle='#fff';rr(g,52,52,152,152,16);g.fill();g.fill();return texC.glow=tx(c)}
const GI=152/256;                        // parte "sólida" de la textura de brillo
const FELT={green:['#2f9a62','#0f4a2d'],red:['#c0393f','#5e1218'],blue:['#3d84cc','#123a68'],orange:['#d98a35','#74400c'],purple:['#8457c0','#2e1452'],graphite:['#5d656f','#1d2126']};
function feltTex(){const k='felt'+sbg;if(texC[k])return texC[k];
 const c=cnv(512,512),g=c.getContext('2d'),b=FELT[sbg]||FELT.green,gr=g.createRadialGradient(256,256,10,256,256,256);gr.addColorStop(0,b[0]);gr.addColorStop(1,b[1]);g.fillStyle=gr;g.fillRect(0,0,512,512);
 const im=g.getImageData(0,0,512,512),d=im.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*16;d[i]+=n;d[i+1]+=n;d[i+2]+=n}g.putImageData(im,0,0);
 return texC[k]=tx(c)}
// anillo de flechas alrededor del centro: gira en el sentido del juego y se pinta del color actual
function ringTex(d){const k='ring'+d;if(texC[k])return texC[k];const S=1024,cn=cnv(S,S),g=cn.getContext('2d'),c=S/2,r=440;
 g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=6;[r-50,r+50].forEach(q=>{g.beginPath();g.arc(c,c,q,0,7);g.stroke()});
 g.strokeStyle='#fff';g.lineWidth=17;g.lineCap='round';g.lineJoin='round';
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;g.save();g.translate(c+Math.cos(a)*r,c+Math.sin(a)*r);g.rotate(a+d*Math.PI/2);g.beginPath();g.moveTo(-14,-24);g.lineTo(14,0);g.lineTo(-14,24);g.stroke();g.restore()}
 return texC[k]=tx(cn)}

// ---------- cartas 3D ----------
let GEO=null;
function mkCard(id){GEO=GEO||new THREE.BoxGeometry(CW,CT,CH);const ed=new THREE.MeshStandardMaterial({color:0xf2f0ea,roughness:.6});
 const top=new THREE.MeshStandardMaterial({map:id==null?backTex():faceTex(id),roughness:.55,alphaTest:.5});
 const bot=new THREE.MeshStandardMaterial({map:backTex(),roughness:.55,alphaTest:.5});
 const m=new THREE.Mesh(GEO,[ed,ed,top,bot,ed,ed]);m.castShadow=true;m.receiveShadow=true;m.userData={id};return m}
function setFace(m,id){const t=id==null?backTex():faceTex(id);m.userData.id=id;if(m.material[2].map!==t){m.material[2].map=t;m.material[2].needsUpdate=true}}
function tint(m,v){const c=m.material[2].color;if(Math.abs(c.r-v)>.01)c.setScalar(v)}   // cartas que no puedes jugar: más oscuras
function drop(key){const m=meshes.get(key);if(!m)return;m.parent&&m.parent.remove(m);m.material.forEach(x=>x.dispose());if(m.userData.sg){m.userData.sg.geometry.dispose();m.userData.sg.material.dispose()}meshes.delete(key)}
// Destino de una carta: padre (mesa o cámara), posición, giro y escala. Si cambia, se mueve suave desde donde está.
function target(m,par,pos,q,s,o={}){const T=m.userData.T;
 if(T&&T.par===par&&T.pos.distanceToSquared(pos)<1e-8&&T.q.angleTo(q)<1e-4&&Math.abs(T.s-s)<1e-6)return;
 m.userData.T={par,pos:pos.clone(),q:q.clone(),s};if(m.parent!==par)par.attach(m);
 // en tu mano las cartas se dibujan en orden (renderOrder) y no por profundidad: inclinadas y tan juntas, una atravesaba a la de al lado.
 // Van como "transparentes" para que se ordenen junto con los brillos (si no, el brillo se pinta encima de las cartas)
 const ly=par===CA?1:0;if(m.userData.ly!==ly){m.userData.ly=ly;m.traverse(o=>o.layers.set(ly));const hd=ly==1;m.material.forEach(x=>{x.depthTest=!hd;x.depthWrite=!hd;x.transparent=hd;x.needsUpdate=true});m.material[3].visible=!hd;if(!hd)m.renderOrder=0}
 const ms=RM||(first&&!dealing)?0:(o.ms==null?430:o.ms);
 if(!ms){m.position.copy(pos);m.quaternion.copy(q);m.scale.setScalar(s);m.userData.tw=null;return}
 m.userData.tw={p0:m.position.clone(),q0:m.quaternion.clone(),s0:m.scale.x,t0:performance.now()+(o.delay||0),ms,arc:o.arc==null?(par===SC?.7:.12):o.arc,spin:o.spin||0}}
function step(now){meshes.forEach((m,key)=>{const w=m.userData.tw,T=m.userData.T;if(!w||(drag&&drag.m===m))return;let k=(now-w.t0)/w.ms;if(k<0)return;if(k>1)k=1;
 const e=1-Math.pow(1-k,3),a=Math.sin(Math.PI*k)*w.arc;m.position.lerpVectors(w.p0,T.pos,e);if(T.par===SC)m.position.y+=a;else m.position.z+=a;
 m.quaternion.slerpQuaternions(w.q0,T.q,e);if(w.spin)m.rotateY(w.spin*(1-e));m.scale.setScalar(w.s0+(T.s-w.s0)*e);
 if(k===1){m.userData.tw=null}})}
// brillos (mazo, descarte, turno). Son planos con textura suave; también sirven para tocar.
function glow(key,pos,w,h,col,lvl,hit,ry){let g=glows.get(key);
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.renderOrder=1;SC.add(g);glows.set(key,g)}
 g.visible=true;g.position.copy(pos);g.rotation.z=ry||0;g.scale.set(w/GI,h/GI,1);g.material.color.set(col);g.userData.lvl=lvl;g.userData.hit=hit||null;g.userData.used=1;if(hit)hits.push(g);return g}
function pulse(now){const p=.65+.35*Math.sin(now/260);glows.forEach(g=>{g.material.opacity=g.userData.lvl*(g.userData.lvl>.5?p:1)})}   // >.5 = parpadea
// brillo pegado detrás de una carta de tu mano (las que sí puedes jugar)
function selGlow(m,onn,col){let g=m.userData.sg;if(!g&&!onn)return;
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(CW*1.2/GI,CH*1.14/GI),new THREE.MeshBasicMaterial({map:glowTex(),opacity:.55,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.position.y=-CT;m.add(g);g.layers.set(m.userData.ly||0);m.userData.sg=g}
 g.visible=!!onn;if(onn)g.material.color.set(col)}

// ---------- escena y mesa ----------
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,200);SC.add(CA);
 const hl=new THREE.HemisphereLight(0xffffff,0x2a1e18,1.7);SC.add(hl);
 const Ld=new THREE.DirectionalLight(0xfff2da,2.6);Ld.position.set(-5,14,7);Ld.castShadow=true;Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0004;
 Object.assign(Ld.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:60});SC.add(Ld);
 const fill=new THREE.DirectionalLight(0xbfdcff,.6);fill.position.set(6,6,-4);SC.add(fill);
 const pt=new THREE.PointLight(0xffffff,1.6,0,1.4);pt.position.set(0,1.2,1);CA.add(pt);   // luz suave para tu mano
 [hl,Ld,fill,pt].forEach(l=>l.layers.enableAll());R.autoClear=false;
 root=document.createElement('div');root.id='u3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 dpvEl=document.createElement('div');dpvEl.id='u3dpv';dpvEl.className='w7 w7g';dpvEl.innerHTML='<small>Descarte</small><img alt=""><div class="nm"></div>';document.body.appendChild(dpvEl);
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pCancel);
 cv.addEventListener('pointerleave',()=>{if(!st&&hov!=null){hov=null;sync()}});cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0015))},{passive:false});
 addEventListener('keydown',e=>{if(!active()||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;
  if(e.key==='Escape'){if(upick!=null){upick=null;render()}else if(menu){menu=false;render()}else home();return}
  if(e.key===' '||e.key==='Home'){if(viewed()){e.preventDefault();home()}return}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key.toLowerCase()==='u'){const G=V.G;if(V.me>=0&&hc(V.me)==1&&!G.uno[V.me])uuno();return}   // U = ¡UNO!
  const c={q:'rl',e:'rr',r:'tu',f:'td',w:'up',arrowup:'up',s:'dn',arrowdown:'dn',a:'lf',arrowleft:'lf',d:'rt',arrowright:'rt','+':'zi','=':'zi','-':'zo'}[e.key.toLowerCase()];
  if(c){e.preventDefault();camStep(c)}});
 // barra de cámara: dejar presionado repite
 const stopRep=()=>{if(camRep){clearTimeout(camRep.t);clearInterval(camRep.i);camRep=null}};
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('[data-cam]');if(!b||!active())return;e.preventDefault();stopRep();const c=b.dataset.cam;
  if(c=='tog'){camOpen=!camOpen;try{localStorage.setItem('cont_cam',camOpen?'1':'0')}catch(_){}sfx('tick');render();return}
  if(c=='home'){home();sfx('tick');return}
  camStep(c);camRep={t:setTimeout(()=>{camRep.i=setInterval(()=>camStep(c),90)},320)}});
 ['pointerup','pointercancel','blur'].forEach(t=>addEventListener(t,stopRep));
 requestAnimationFrame(loop3)}
function buildTable(por){if(tbl){SC.remove(tbl);tbl.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 const rx=por?4.7:7.3,rz=por?6.6:4.5;tbl=new THREE.Group();
 felt=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.12,96),new THREE.MeshStandardMaterial({map:feltTex(),roughness:.95}));felt.scale.set(rx+.05,1,rz+.05);felt.position.y=-.06;felt.receiveShadow=true;tbl.add(felt);
 const ring=(a,b,n=160)=>Array.from({length:n},(_,i)=>new THREE.Vector2(Math.cos(i/n*Math.PI*2)*a,Math.sin(i/n*Math.PI*2)*b));
 const sh=new THREE.Shape(ring(rx+.6,rz+.6));sh.holes.push(new THREE.Path(ring(rx,rz).reverse()));
 // orilla de la mesa: laca negra con un filo de color que toma el color actual del juego
 const rim=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:5,curveSegments:1}),
  new THREE.MeshPhysicalMaterial({color:0x17171b,roughness:.3,clearcoat:.9,clearcoatRoughness:.2}));rim.rotation.x=-Math.PI/2;rim.position.y=-.08;rim.castShadow=true;rim.receiveShadow=true;tbl.add(rim);
 const ep=Array.from({length:120},(_,i)=>{const a=i/120*Math.PI*2;return v3(Math.cos(a)*(rx+.05),.03,Math.sin(a)*(rz+.05))});
 const edge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ep,true),240,.045,8,true),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.7,roughness:.4}));tbl.add(edge);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1.4,96),new THREE.MeshStandardMaterial({color:0x111114,roughness:.6}));base.scale.set(rx+.62,1,rz+.62);base.position.y=-.82;tbl.add(base);
 SC.add(tbl);
 const ps=por?1.25:.95;L=Object.assign(L||{},{por,rx,rz,ps,edge});
 // al centro de la mesa: mazo a la izquierda y descarte a la derecha (en celular parado, uno arriba del otro
 // para que no los tapen los nombres de los lados); el anillo de flechas los rodea
 L.ctr=v3(0,0,por?-.5:-.15);if(por){L.deck=v3(0,0,L.ctr.z-1.15*ps);L.disc=v3(0,0,L.ctr.z+1.15*ps)}else{L.deck=v3(-1.5*ps,0,L.ctr.z);L.disc=v3(1.5*ps,0,L.ctr.z)}
 ringG=new THREE.Group();ringG.position.copy(L.ctr).setY(.004);ringM=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:ringTex(1),transparent:true,opacity:.5,depthWrite:false}));
 ringM.rotation.x=-Math.PI/2;const rr2=por?3.1:2.75;ringM.scale.set(rr2*2.3,rr2*2.3,1);ringM.renderOrder=1;ringG.add(ringM);tbl.add(ringG);
 if(K3){const room=K3.buildRoom(por,rx,rz);tbl.add(room);L.room=room.userData.room}}
function ringStep(dt,now){if(!ringG||!V||!V.G)return;const G=V.G;
 if(G.dir!==ringDir){ringDir=G.dir;ringM.material.map=ringTex(ringDir);ringM.material.needsUpdate=true;if(!first)ringBoost=1}
 ringBoost=Math.max(0,ringBoost-dt/900);ringG.rotation.y-=ringDir*dt*(.00025+ringBoost*.006);
 // color actual: el anillo y el filo de la mesa cambian suave
 const tc=new THREE.Color(UC[G.color]||'#ffffff');ringM.material.color.lerp(tc,.08);ringM.material.opacity=.42+.12*Math.sin(now/400)+ringBoost*.3;
 if(L.edge){L.edge.material.color.lerp(tc,.08);L.edge.material.emissive.lerp(tc,.08)}}

// ---------- cámara (tu mano es hija de la cámara, así que se queda quieta) ----------
function layout(){const w=innerWidth,h=innerHeight;W=w;H=h;R.setSize(w,h,false);
 const por=w/h<.95;if((por?'p':'l')!==tableKey){tableKey=por?'p':'l';buildTable(por)}
 const tb=$('#t3top'),bb=$('#t3bar .w7g'),top=mini?(h<500?4:14):(tb?tb.getBoundingClientRect().bottom:54)+(h<500?4:24),bar=h-(bb?bb.getBoundingClientRect().top:h-60);
 const ch=Math.max(80,Math.min(h*.22,w*.3,200));Object.assign(L,{top,bar,ch,barTop:bb?bb.getBoundingClientRect().top:0});
 document.documentElement.style.setProperty('--t3fan',Math.round(bar+ch*1.15)+'px');document.documentElement.style.setProperty('--t3bar',Math.round(bar+8)+'px');
 const rb=h-bar-ch*.62,rh=Math.max(120,rb-top),el=por?1.12:.98;
 CA.clearViewOffset();CA.aspect=w/rh;
 const pts=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2;for(const y of [0,.4])pts.push(v3(Math.cos(a)*(L.rx+.75),y,Math.sin(a)*(L.rz+.75)))}
 const ext=d=>{CA.position.set(0,Math.sin(el)*d,Math.cos(el)*d);CA.lookAt(0,0,0);CA.updateProjectionMatrix();CA.updateMatrixWorld();
  let a=1e9,b=-1e9,c=1e9,e=-1e9;pts.forEach(p=>{const q=p.clone().project(CA);a=Math.min(a,q.x);b=Math.max(b,q.x);c=Math.min(c,q.y);e=Math.max(e,q.y)});return [a,b,c,e]};
 let lo=3,hi=120;for(let i=0;i<32;i++){const m=(lo+hi)/2,x=ext(m);((x[1]-x[0])/2<.98&&(x[3]-x[2])/2<.97)?hi=m:lo=m}
 const x=ext(hi),cx=(x[0]+x[1])/2,cy=(x[2]+x[3])/2;
 L.el=el;L.d=hi;CA.setViewOffset(w,rh,cx*w/2,-top-cy*rh/2,w,h);CA.updateProjectionMatrix();clampV();cam()}
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
function home(){VW.a=wrap(VW.a);Object.assign(VT,{x:0,z:0,k:1,a:0,t:0,who:-1})}
function camStep(c){const f=1.1/VT.k,sa=Math.sin(VT.a),ca=Math.cos(VT.a),mv={up:[0,-1],dn:[0,1],lf:[-1,0],rt:[1,0]}[c];
 if(c=='rl')VT.a-=.2;else if(c=='rr')VT.a+=.2;else if(c=='zi')VT.k*=1.2;else if(c=='zo')VT.k/=1.2;else if(c=='tu')VT.t+=.09;else if(c=='td')VT.t-=.09;
 else if(mv){VT.x+=(mv[0]*ca+mv[1]*sa)*f;VT.z+=(-mv[0]*sa+mv[1]*ca)*f}else return;VT.who=-1;clampV()}
function ground(cx,cy){const r=cv.getBoundingClientRect();P2.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(PL,v3(0,0,0))}
function zoomAt(cx,cy,k){const p=ground(cx,cy);k=Math.max(1,Math.min(KMAX,k));if(!p)return;const f=VT.k/k;VT.x=p.x-(p.x-VT.x)*f;VT.z=p.z-(p.z-VT.z)*f;VT.k=k;VT.who=-1;clampV()}
// mirar a un jugador (sus cartas y su Mii). Tocarlo otra vez regresa a la mesa completa
function look(k){if(!L)return;if(VT.who===k)return home();const p=seatP(k,.95);Object.assign(VT,{x:p.x*.8,z:p.z*.8,k:2.1,who:k});clampV();sfx('card')}
function loc(px,py,d){const v=v3(px/W*2-1,1-py/H*2,.5).applyMatrix4(CA.projectionMatrixInverse);return v.multiplyScalar(-d/v.z)}
function toPx(p){const q=p.clone().project(CA);return [(q.x+1)/2*W,(1-q.y)/2*H]}

// ---------- posiciones ----------
function seatA(k){const n=V.G.players.length,me=V.me<0?0:V.me;return Math.PI/2+((k-me+n)%n)*(2*Math.PI/n)}
function seatP(k,f){const a=seatA(k);return v3(Math.cos(a)*L.rx*f,0,Math.sin(a)*L.rz*f)}
// abanico de tu mano: las que puedes jugar se asoman un poco, la que robaste se asoma más
function fan(ids,play,drawn){const n=ids.length,ch=L.ch,cw=ch/CH*CW,upp=(loc(W,0,D).x-loc(0,0,D).x)/W,av=W-20,cx=W/2,out=[];
 let rows=1,per=n,stp=n>1?Math.min(cw*.62,(av-cw)/(n-1)):0;if(n>10&&stp<cw*.26){rows=2;per=Math.ceil(n/2);stp=Math.min(cw*.62,(av-cw)/(per-1))}
 ids.forEach((id,i)=>{const r=rows==2&&i>=per?1:0,j=r?i-per:i,rn=r?n-per:Math.min(n,per),off=j-(rn-1)/2,dx=off*stp,u=dx/(W/2),ok=play.has(id);
  let y=H-Math.max(L.bar,72)-8-ch/2+u*u*ch*.18-(rows==2&&!r?ch*.42:0);if(id===drawn)y-=ch*.24;else if(ok)y-=ch*.1;if(hov===id)y-=ch*.07;
  const ang=Math.max(-.3,Math.min(.3,-u*.22)),d=D-i*.004-(r?.03:0);
  out.push({id,ok,x:cx+dx,y,pos:loc(cx+dx,y,d),q:new THREE.Quaternion().setFromAxisAngle(Z,ang).multiply(new THREE.Quaternion().setFromAxisAngle(X,Math.PI/2-.16)),s:ch*upp/CH})});
 return out}

// ---------- avatares (los Miis del Continental 3D) ----------
function avSync(){if(!K3)return;const G=V.G,want=new Set(G.players.map((_,k)=>k).filter(k=>!V.players[k].out)),pk=K3.avPick();
 avs.forEach((g,k)=>{if(!want.has(k)||g.userData.pi!==pk[k]){SC.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});avs.delete(k)}});
 want.forEach(k=>{let g=avs.get(k);if(!g){g=K3.mkAvatar(k,pk[k]);SC.add(g);avs.set(k,g)}const a=seatA(k);
  g.position.set(Math.cos(a)*(L.rx+1.4),0,Math.sin(a)*(L.rz+1.4));g.rotation.y=Math.atan2(-g.position.x,-g.position.z);
  g.traverse(o=>{if(o.userData.hit)hits.push(o)})})}
const POLE=[v3(-1.3,-.5,-.4),v3(1.3,-.5,-.4)],avTgt=new THREE.Vector3(),avP=new THREE.Vector3();
function avStep(now){if(!avs.size||!V||!V.G)return;const G=V.G;
 const fin=G.phase=='final';
 avs.forEach(g=>{const u=g.userData,k=u.k,turn=!fin&&G.turn===k,f=.08;
  u.body.scale.y=1+.012*Math.sin(now/650+k*1.7);u.body.rotation.x+=((turn?.12:0)-u.body.rotation.x)*f;
  // la cabeza mira a quien tiene el turno (o a sus cartas cuando le toca)
  let yaw=0,pitch=.3;if(!turn){avTgt.copy(G.turn===V.me||!avs.get(G.turn)?v3(0,1,L.rz+1):avs.get(G.turn).position.clone().setY(1.3));g.worldToLocal(avTgt);
   yaw=Math.max(-1.1,Math.min(1.1,Math.atan2(avTgt.x,avTgt.z)));pitch=.05}
  u.head.rotation.y+=(yaw-u.head.rotation.y)*f;u.head.rotation.x+=(pitch-u.head.rotation.x)*f;
  // la mano derecha se estira al tirar una carta; las dos arriba al gritar ¡UNO! (y sin parar si ganó)
  const rt=(now-u.reachT)/700,ct=(now-u.cheerT)/1500,reach=rt>=0&&rt<1?Math.sin(rt*Math.PI):0,cheer=fin&&G.win===k?1:ct>=0&&ct<1?Math.sin(ct*Math.PI):0;
  u.arms.forEach(a=>{const s=a.s,r=s>0?reach:0;a.h.set(s*.34-s*.12*r,.36+.15*r,.72+.8*r);
   if(cheer)a.h.lerp(avTgt.set(s*.62,1.25+.15*Math.sin(now/90+s),.2),cheer);
   const pole=avP.copy(POLE[s>0?1:0]);if(cheer)pole.y+=1.4*cheer;K3.ik(a.sh,a.h,u.l1,u.l2,pole.clone(),a.el);
   K3.seg(a.up,a.sh,a.el);K3.seg(a.fo,a.el,a.h);a.hand.position.copy(a.h)})})}

// ---------- sincronizar la escena con el estado del servidor ----------
function ens(key,id,from){let m=meshes.get(key);
 if(!m){m=mkCard(id);SC.add(m);m.position.copy(from||L.deck);m.position.y+=.06;m.quaternion.copy(FD);m.scale.setScalar(L.ps);meshes.set(key,m);m.userData.nw=1}
 setFace(m,id);return m}
// las cartas nuevas vuelan más lento; al repartir salen una por una
function go(m,par,pos,q,s,o){o=o||{};if(m.userData.nw){m.userData.nw=0;o.ms=Math.max(o.ms||0,520);if(dealing){o.delay=dl*45;dl++}}target(m,par,pos,q,s,o)}
const seatW=k=>{const p=seatP(k,.84);p.y=.3;return p};
function sync(){if(!ready||!L||!active())return;
 const G=V.G,n=G.players.length,me=V.me,live=new Set(),fin=G.phase=='final',mine=!fin&&me>=0&&G.turn==me,tnow=performance.now(),top=G.disc[G.disc.length-1];
 hits.length=0;glows.forEach(g=>{g.userData.used=0});
 // reparto nuevo: se recoge todo y se reparte desde el mazo (con animación si la cuenta regresiva sigue corriendo)
 if(G.dn!==dealN){dealing=dealN>=0||G.cd>600;dealN=G.dn;logN=-1;meshes.forEach((m,k)=>drop(k));pile=[];home()}else dealing=false;dl=0;
 // empieza tu turno: si estabas mirando a alguien, la cámara regresa a la mesa
 if(mine&&myTc!==G.tc){myTc=G.tc;if(VT.who>=0)home()}
 // qué pasó desde la última vez: de dónde sale cada carta, gestos de los Miis y efectos
 const from={};(G.log||[]).forEach(e=>{if(e.n<=logN)return;const old=logN<0,av=!old&&avs.get(e.k);
  if(e.c!=null&&/^jugó/.test(e.t)){from[e.c]=e.k;if(!old)fxPlay(e);if(av)av.userData.reachT=tnow}
  if(/^dijo/.test(e.t)){if(av)av.userData.cheerT=tnow;if(!old)popAt(e.k,'¡UNO!','#fdd835')}
  if(/^cobró/.test(e.t)&&!old){const v=G.players.findIndex(p=>e.t.includes(p.name+' (+2)'));if(v>=0)popAt(v,'+2','#ff6b5a')}});
 logN=Math.max(logN,G.ln||0);
 // mazo: pila con grosor según las cartas que quedan
 const nv=G.deck?Math.min(12,Math.ceil(G.deck/6)):0;
 for(let i=0;i<nv;i++){const key='dk'+i,m=ens(key,null);live.add(key);m.userData.hit={t:'deck'};hits.push(m);m.userData.nw=0;
  target(m,SC,v3(L.deck.x+(i%2)*.006,.012+i*CT*L.ps*1.5,L.deck.z),Qe(0,(i%3-1)*.012,Math.PI),L.ps*1.1,{ms:250})}
 const hand=me>=0&&Array.isArray(G.hands[me])?G.hands[me]:[],canD=mine&&G.step=='play'&&!G.ad,play=new Set(mine&&!G.ad?hand.filter(uok):[]);
 glow('deck',v3(L.deck.x,.004,L.deck.z),CW*L.ps*1.4,CH*L.ps*1.3,0xffd54a,canD?(play.size?.3:.95):0,{t:'deck'});
 // descarte: las últimas cartas que han caído, un poco desordenadas
 if(top!=null&&pile[pile.length-1]!==top){pile=pile.filter(x=>x!==top);pile.push(top);if(pile.length>7)pile.shift()}
 pile.forEach((id,i)=>{const key='c'+id,h=hh(id),fk=from[id],m=ens(key,id,fk!=null&&fk!==me?seatW(fk):null);live.add(key);m.userData.hit={t:'disc'};hits.push(m);
  go(m,SC,v3(L.disc.x+((h%13)-6)*.022,.012+i*CT*L.ps*1.6,L.disc.z+(((h>>5)%11)-5)*.022),Qe(0,((h>>9)%41-20)*.02,0),L.ps*1.1,{spin:fk!=null?Math.PI*2:0})});
 glow('disc',v3(L.disc.x,.004,L.disc.z),CW*L.ps*1.55,CH*L.ps*1.45,new THREE.Color(UC[G.color]||'#fff').getHex(),mine&&!G.ad?.8:.45,{t:'disc'});
 avSync();
 // manos de los demás: cartas boca abajo frente a su asiento
 for(let k=0;k<n;k++){if(k===me)continue;const cnt=Math.min(hc(k)||0,15),a=seatA(k),c=seatP(k,.84),tg=v3(Math.sin(a),0,-Math.cos(a)),ry=Math.PI/2-a;
  for(let j=0;j<cnt;j++){const key='h'+k+'_'+j,m=ens(key,null);live.add(key);m.userData.hit={t:'seat',k};hits.push(m);const off=j-(cnt-1)/2;
   go(m,SC,c.clone().addScaledVector(tg,off*.22).setY(.012+j*.004),Qe(0,ry+off*.04,Math.PI),.5)}
  glow('t'+k,v3(c.x,.003,c.z),Math.max(1.4,cnt*.22+.8),1.2,fin?0xffd54a:0x55c8ff,(fin?G.win==k:G.turn==k)?.8:0,{t:'seat',k},ry)}
 // tu mano en abanico (la luz de la mano es fuerte: sin bajar el tono, los colores se ven deslavados)
 if(me>=0&&Array.isArray(G.hands[me])){const dr=mine&&G.step=='drawn'?G.drawn:null,F=fan(udisp().map(c=>c.id),play,dr);L.hand=F;
  F.forEach((f,i)=>{const key='c'+f.id,m=ens(key,f.id),dg=drag&&drag.m===m;live.add(key);m.castShadow=false;m.userData.hit={t:'hand',id:f.id};hits.push(m);
   m.renderOrder=dg?999:10+i;tint(m,mine&&!G.ad&&!f.ok?.22:.62);selGlow(m,f.ok||dg,f.id===dr?0xffe27a:0x7fd8ff);if(m.userData.sg)m.userData.sg.renderOrder=dg?998:5;if(dg)return;go(m,CA,f.pos,f.q,f.s,{ms:260})})}
 // lo que ya no está, desaparece (las cartas jugadas ya están en el descarte)
 meshes.forEach((m,key)=>{if(!live.has(key))drop(key)});
 glows.forEach(g=>{if(!g.userData.used){g.visible=false;g.userData.lvl=0}});
 if(felt&&felt.material.map!==feltTex()){felt.material.map=feltTex();felt.material.needsUpdate=true}
 first=false}
// efectos de las cartas especiales: el símbolo salta sobre el descarte
function fxPlay(e){const c=U(e.c);if(c.t=='n')return;const G=V.G;
 if(c.c==4)popAt(-1,c.t=='f'?'+4':'★',UC[G.color],UCN[G.color]);
 else popAt(-1,usym(c),UC[c.c],c.t=='s'?'¡Salto!':c.t=='r'?'¡Reversa!':'')}
function popAt(k,t,col,sub){if(!L)return;const p=k<0?L.disc.clone().setY(.4):(avs.get(k)?avs.get(k).position.clone().setY(2.6):seatP(k,1).setY(.6)),[x,y]=toPx(p);
 const el=document.createElement('div');el.className='u3fx'+(k<0?' big':'');el.style.cssText=`left:${Math.max(40,Math.min(W-40,x))}px;top:${Math.max(70,Math.min(H-40,y))}px;--c:${col}`;
 el.innerHTML=`<b>${esc(t)}</b>${sub?`<small>${esc(sub)}</small>`:''}`;document.body.appendChild(el);setTimeout(()=>el.remove(),1500)}

// ---------- tocar y arrastrar ----------
function pick(e,only){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(only||hits,false);return h.length?h[0].object.userData.hit:null}
// Ratón: clic derecho y arrastrar = mover; clic de rueda (o Shift + clic derecho) = girar e inclinar; rueda = zoom.
// Dedo: arrastrar fuera de tu mano = mover; dos dedos = pellizcar para zoom, girarlos para rotar, subirlos o bajarlos para inclinar
function pDown(e){if(!active()||upick!=null)return;if(menu){menu=false;render();return}
 if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(tch.size==2){if(drag)pCancel();st=null;const [a,b]=[...tch.values()];VK.forEach(q=>VT[q]=VW[q]);VT.who=-1;
   pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VW.k,g:ground((a[0]+b[0])/2,(a[1]+b[1])/2),ang:Math.atan2(b[1]-a[1],b[0]-a[0]),acc:0,rot:false,my:(a[1]+b[1])/2,mx:(a[0]+b[0])/2,t:VW.t,mode:null};return}
  if(tch.size>2)return}
 if(e.button==1)e.preventDefault();
 const rot=e.button==1||(e.button==2&&e.shiftKey),pan=e.button==2&&!rot;if(pan||rot)cv.style.cursor=rot?'move':'grabbing';
 st={x:e.clientX,y:e.clientY,hit:pan||rot?null:pick(e),pid:e.pointerId,pan,rot,a0:VW.a,t0:VW.t,g:null};try{cv.setPointerCapture(e.pointerId)}catch(_){}}
function pMove(e){if(!active())return;
 if(tch.has(e.pointerId)){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(pin&&tch.size>=2){const [a,b]=[...tch.values()],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]),dd=Math.hypot(a[0]-b[0],a[1]-b[1])-pin.d;let da=wrap(ang-pin.ang);pin.ang=ang;
   if(!pin.mode){const dy=my-pin.my,dx=mx-pin.mx;if(Math.abs(dy)>16&&Math.abs(dd)<Math.abs(dy)*.35&&Math.abs(dx)<Math.abs(dy)*.6&&Math.abs(pin.acc+da)<.1)pin.mode='tilt';else if(Math.abs(dd)>14||Math.abs(dx)>16||Math.abs(pin.acc+da)>.12)pin.mode='free'}
   if(pin.mode=='tilt'){VT.t=pin.t+(my-pin.my)*.006;VT.who=-1;snap();return}
   if(!pin.mode)return;
   pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.12){pin.rot=true;da=pin.acc}if(pin.rot)VT.a=VW.a+da;
   VT.k=pin.k*(Math.hypot(a[0]-b[0],a[1]-b[1])||1)/pin.d;snap();
   const p=ground(mx,my);if(p&&pin.g){VT.x+=pin.g.x-p.x;VT.z+=pin.g.z-p.z;snap()}return}}
 if(!st){if(e.pointerType==='mouse'){const h=pick(e),id=h&&h.t=='hand'?h.id:null;cv.style.cursor=h?'pointer':'default';if(id!==hov){hov=id;sync()}}return}
 if(e.pointerId!==st.pid)return;const h=st.hit;
 if(st.rot){VT.a=st.a0+(e.clientX-st.x)*.007;VT.t=st.t0+(e.clientY-st.y)*.005;VT.who=-1;snap();return}
 // arrastrar la mesa: el punto que agarraste se queda bajo el dedo
 if(!drag&&(st.g||((st.pan||!h||h.t!='hand')&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10))){if(!st.g){st.g=ground(st.x,st.y);VT.who=-1;if(!st.pan)cv.style.cursor='grabbing'}
  const p=ground(e.clientX,e.clientY);if(st.g&&p){VT.x=VW.x+st.g.x-p.x;VT.z=VW.z+st.g.z-p.z;VT.k=VW.k;snap()}return}
 if(!drag&&h&&h.t=='hand'&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10){const m=meshes.get('c'+h.id);if(m){drag={id:h.id,m,tgt:null};hov=null;sync()}}
 if(!drag)return;const m=drag.m;m.position.copy(loc(e.clientX,e.clientY-L.ch*.15,D-.5));m.quaternion.setFromAxisAngle(X,Math.PI/2-.1);m.scale.setScalar(m.userData.T.s*1.08);
 // ¿encima del descarte?
 const t=pick(e,hits.filter(o=>o.userData.hit&&o.userData.hit.t=='disc'));drag.tgt=t;
 const g=glows.get('disc');if(g)g.userData.lvl=t?.95:.45}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}
 if(!st||e.pointerId!==st.pid)return;const s=st;st=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 if(s.pan||s.rot||s.g){cv.style.cursor='default';return}
 if(drag){const d=drag;drag=null;d.m.userData.T=null;
  // soltar en el descarte = jugarla (uplay valida y, si es comodín, pide el color)
  if(d.tgt){uplay(d.id);noClick=Date.now();sync();return}
  noClick=Date.now();
  // reordenar tu mano: se mete junto a la carta más cercana
  const F=(L.hand||[]).filter(f=>f.id!==d.id);let b=-1,bd=1e12;F.forEach((f,i)=>{const dd=(e.clientX-f.x)**2+(e.clientY-f.y)**2;if(dd<bd){bd=dd;b=i}});
  const ids=F.map(f=>f.id);ids.splice(b<0?0:b+(e.clientX>F[b].x?1:0),0,d.id);myOrder=ids;manual=true;sfx('place');render();return}
 tap(s.hit)}
function pCancel(e){if(e&&e.pointerId!=null)tch.delete(e.pointerId);if(tch.size<2)pin=null;if(drag){drag.m.userData.T=null;drag=null}st=null;sync()}
function tap(h){if(!h){if(VT.who>=0)home();return}const G=V.G,me=V.me,mine=me>=0&&G.turn==me;
 if(h.t=='deck'){if(mine&&G.step=='play'&&!G.ad)udraw();else if(mine&&G.step=='drawn')bad('Ya robaste: juega esa carta o pasa.');return}
 if(h.t=='disc'){if(mine&&G.step=='drawn'&&uok(G.drawn))uplay(G.drawn);return}
 if(h.t=='seat')return look(h.k);
 if(h.t=='hand'){if(mine)uplay(h.id);else sfx('card')}}

// ---------- capa de controles (HTML encima del 3D) ----------
const chipC=k=>`<i class="u3chip" style="--c:${UC[k]}"></i>`;
function hud(){const G=V.G,i=V.me,t=G.turn,fin=G.phase=='final',w=G.win,mine=!fin&&i==t,drawn=mine&&G.step=='drawn',pend=!fin&&G.pend>0,h=i>=0&&Array.isArray(G.hands[i])?G.hands[i]:[];
 if(!mine)upick=null;if(!fin)winHide=false;
 const hint=fin?(w>=0&&w==i?'¡Te quedaste sin cartas! 🎉':'Se quedó sin cartas. ¿Otra partida?'):G.ad>0?(mine?'Robando… ':esc(G.players[t].name)+' está robando… ')+'('+G.ad+')':i<0?'Mirando como host':!mine?'Esperando a '+nm(t)+'…':drawn?'Juega la carta que robaste o pasa':pend?`Acumula con un ${G.pendT=='d'?'+2 o +4':'+4'} o roba ${G.pend}`:'Toca una carta para jugarla, o el mazo para robar';
 const inf=fin?`🏆 <b>${w>=0?nm(w):'—'}</b> gana`:`${chipC(G.color)} <b>${UCN[G.color]}</b> · ${G.dir>0?'↻':'↺'}${pend?` · <b class="u3pend">+${G.pend} acumulado</b>`:''}`;
 let o=`<div id="t3top" class="w7 w7g${mine?' me':''}"><button class="w7b" onclick="u3dMenu()" aria-label="Menú">☰ Juego</button>
  <div class="inf"><div class="l1">${inf}</div><div class="l2">${mine?'<b>¡Tu turno!</b> '+hint:hint}</div></div>
  <button class="w7b" onclick="u3dMini()" title="Ocultar la barra" aria-label="Ocultar la barra">▴</button><button class="w7b" onclick="u3dToggle()" title="Vista clásica 2D">2D</button></div>`;
 if(mini)o=`<div id="t3mini" class="w7 w7g${mine?' me':''}"><button class="w7b" onclick="u3dMenu()" aria-label="Menú">☰</button><span class="st">${fin?inf:(mine?'<b>¡Tu turno!</b> ':'')+chipC(G.color)+' '+UCN[G.color]+(pend?' · +'+G.pend:'')}</span><button class="w7b" onclick="u3dMini()" title="Mostrar la barra" aria-label="Mostrar la barra">▾</button></div>`;
 const lg=(G.log||[]).slice(-1)[0];if(lg&&!mini)o+=`<div id="t3log" class="w7">${chip(lg.k)}<b>${esc(G.players[lg.k].name)}</b> ${esc(lg.t)}</div>`;
 // aviso (error o nota) que se desvanece solo
 const mk=(msg||'')+'|'+(G.note||'');if(mk!==msgK){msgK=mk;msgT=Date.now()}const age=Date.now()-msgT,mt=msg||G.note;
 if(mt&&age<4500)o+=`<div class="w7 t3msg" style="animation-delay:-${age}ms">${msg?esc(msg):'<b>'+esc(G.note)+'</b>'}</div>`;
 // jugadores alrededor de la mesa
 G.players.forEach((p,k)=>{if(k===i)return;const pl=V.players[k],on=!fin&&G.turn==k,n=hc(k),u1=fin?w==k:G.uno[k]&&n==1;
  o+=`<div class="w7 w7g t3seat${on?' on':''}${pl.out?' out':''}${VT.who==k?' look':''}${n==1?' u3one':''}" data-seat="${k}" onclick="u3dLook(${k})" title="Ver a ${esc(p.name)}">${chip(k)}<b>${esc(p.name)}</b> <i class="dot${pl.on?' on':''}"></i><small>${pl.out?'expulsado':(n+(n==1?' carta':' cartas')+(on?(G.ad?' · robando…':' · jugando…'):''))}</small>${u1?`<em class="u3b">${fin?'🏆 ¡Ganó!':'¡UNO!'}</em>`:''}</div>`});
 o+=`<div class="w7 t3pl" id="t3pdk">Mazo · ${G.deck}</div><div class="w7 t3pl" id="t3pds">${chipC(G.color)} ${UCN[G.color]}</div>`;
 // botones de abajo: robar el acumulado, pasar, ¡UNO!, cobrar UNO y ordenar
 let b='';
 if(fin){b=`<button class="w7b p" onclick="send({t:'reset'})">🔄 Nueva partida</button><button class="w7b" onclick="leave()">Salir</button>`;
  // resultados en una ventanita (se puede cerrar para ver la mesa)
  if(!winHide)o+=`<div id="u3win" class="w7 w7win" role="dialog" aria-labelledby="u3wt"><div class="wt"><span id="u3wt">Fin de la partida</span><button class="wx" onclick="u3dWin()" aria-label="Cerrar">✕</button></div>
   <div class="wb"><div class="u3tro">🏆</div><div class="u3wn">${w>=0?(w==i?'¡Ganaste!':`Ganó <b>${nm(w)}</b>`):'Fin'}</div>
   <div class="u3res">${G.players.map((p,k)=>`<div class="${k==w?'w':''}">${chip(k)}<span>${esc(p.name)}${k==i?' (tú)':''}</span><b>${V.players[k].out?'expulsado':k==w?'🏆':hc(k)+(hc(k)==1?' carta':' cartas')}</b></div>`).join('')}</div></div></div>`}
 else if(i<0)b=`<span class="hint">Mirando como host</span>`;
 else{const vk=G.vuln&&G.vuln.k!=i&&hc(G.vuln.k)==1&&!G.uno[G.vuln.k]?G.vuln.k:-1,my1=h.length==1&&!G.uno[i],said=h.length==1&&!!G.uno[i];
  if(mine&&G.step=='play'&&pend&&!G.ad)b+=`<button class="w7b p" onclick="udraw()">Robar ${G.pend}</button>`;
  if(drawn)b+=`<button class="w7b p" onclick="upass()">Pasar</button>`;
  b+=`<button class="w7b u3uno${my1?' go':''}${said?' ok':''}" ${my1?'':'disabled'} onclick="uuno()" title="Tecla U">${said?'¡UNO! ✔':'¡UNO!'}</button>`;
  if(vk>=0)b+=`<button class="w7b u3catch" onclick="ucatch()">😈 Cobrar UNO a ${nm(vk)}</button>`;
  b+=`<button class="w7b" onclick="cyc()" title="Ordenar">⇅ ${manual?'Mi orden':sortS?'Por número':'Por color'}</button>`}
 o+=`<div id="t3bar" class="w7"><div class="w7g">${b}</div></div>`;
 o+=`<button id="t3view" class="w7 w7b" onclick="u3dHome()" style="display:none" title="Regresar a la vista de siempre (Esc)">${IC.home} Cuadrar</button>`;
 const cb=(c,tt)=>`<button class="w7b" data-cam="${c}" title="${tt}" aria-label="${tt}">${IC[c]}</button>`;
 o+=`<div id="t3cam" class="w7${camOpen?' open':''}"><button class="w7b tog" data-cam="tog" title="Cámara" aria-label="Cámara" aria-expanded="${camOpen}">${IC.cam}</button>
  <div class="w7g pan">${cb('rl','Girar a la izquierda (Q)')}${cb('rr','Girar a la derecha (E)')}${cb('zi','Acercar (+)')}${cb('zo','Alejar (−)')}${cb('tu','Ver más desde arriba (R)')}${cb('td','Ver más de lado (F)')}
  <button class="w7b wide" data-cam="home" title="Cuadrar la cámara (Esc)">${IC.home} Cuadrar</button></div></div>`;
 // ventana para elegir el color del comodín (sugiere el color que más tienes)
 if(upick!=null&&mine){const cnt=[0,0,0,0];h.forEach(x=>{const c=U(x);if(x!==upick&&c.c<4)cnt[c.c]++});const best=cnt.indexOf(Math.max(...cnt));
  o+=`<div id="u3pick" class="w7 w7win" role="dialog" aria-modal="true" aria-labelledby="u3pt"><div class="wt"><span id="u3pt">Elige el color</span><button class="wx" onclick="upick=null;render()" aria-label="Cancelar">✕</button></div>
  <div class="wb"><div class="u3cols">${[0,1,2,3].map(k=>`<button class="u3col${k==best&&cnt[k]?' best':''}" style="--c:${UC[k]}" onclick="ucol(${k})"><b>${UCN[k]}</b><small>${cnt[k]?(cnt[k]==1?'tienes 1':'tienes '+cnt[k]):'no tienes'}</small></button>`).join('')}</div>
  <div class="ft"><button class="w7b" onclick="upick=null;render()">Cancelar</button></div></div></div>`}
 // menú Juego
 if(menu){const op=k=>menuOpen.has(k)?' open':'';
  o+=`<div id="t3menu" class="w7"><button class="mi" onclick="mute=!mute;render()">${mute?'🔇 Efectos de sonido: apagados':'🔊 Efectos de sonido: encendidos'}</button>${typeof musCyc=='function'?`<button class="mi" onclick="musCyc()">${musName()=='apagada'?'🔇':'🎵'} Música: ${musName()}</button>`:''}<button class="mi" onclick="u3dToggle()">🖼 Vista clásica 2D</button><button class="mi" onclick="u3dDark()">${dark?'☀️ Menús en modo claro':'🌙 Menús en modo oscuro'}</button><button class="mi" onclick="u3dMini()">${mini?'▾ Mostrar la barra de arriba':'▴ Ocultar la barra de arriba'}</button><hr>
  <button class="mi" onclick="setCb(${!cbl})">${cbl?'🔤 Letra del color en las cartas: sí':'🔤 Letra del color en las cartas: no'}</button><details data-k="pl"${op('pl')}><summary class="mi">👥 Jugadores</summary>${plist()}</details>
  <details data-k="lg"${op('lg')}><summary class="mi">📜 Historial</summary>${logv()||'<div class="rt">Nada todavía.</div>'}</details>
  ${GM.uno.rules.replace('<details>',`<details data-k="rg"${op('rg')}>`).replace('<summary>Reglas</summary>','<summary class="mi">📖 Reglas</summary><div class="rt">').replace(/<\/details>$/,'</div></details>')}
  ${V.host?`<hr><button class="mi" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">✖ Cerrar sala</button>`:''}</div>`}
 return o}
function labels(){if(!L)return;const bot=id=>{const e=document.getElementById(id),r=e&&e.getBoundingClientRect();return r&&r.height?r.bottom:0},y0=Math.max(bot('t3top'),bot('t3mini'),bot('t3log'))+2;
 document.querySelectorAll('#app .t3seat').forEach(el=>{const k=+el.dataset.seat,av=avs.get(k),[x,y]=toPx(av?av.position.clone().setY(2.15):seatP(k,1).setY(.3)),hw=el.offsetWidth/2+4,hh2=el.offsetHeight/2+4;
  el.style.transform=`translate(${Math.max(hw,Math.min(W-hw,x))}px,${Math.max(hh2+y0,Math.min(H-hh2,y))}px) translate(-50%,-50%)`});   // nunca encima de la barra de arriba ni de la última jugada
 // nombres de las pilas: abajo de cada una (en celular parado, el del mazo va arriba de él)
 const pl=(id,p,up)=>{const el=document.getElementById(id);if(!el)return;const [x,y]=toPx(p);el.style.transform=`translate(${x}px,${y}px) translate(-50%,${up?'-100%':'0'})`};
 const dz=CH*L.ps*1.1/2+.12;if(L.deck){pl('t3pdk',v3(L.deck.x,0,L.deck.z+(L.por?-dz:dz)),L.por);pl('t3pds',v3(L.disc.x,0,L.disc.z+dz))}}
// botón Cuadrar y clases de la página
function viewBtn(){const r=document.documentElement;r.classList.toggle('c3dark',dark);r.classList.toggle('u3mini',mini);
 const el=document.getElementById('t3view');if(!el)return;const k=viewed()&&(!camOpen||VT.who>=0)?String(VT.who):'';if(el.dataset.k===k)return;el.dataset.k=k;
 el.style.display=k?'':'none';const p=VT.who>=0&&V.G.players[VT.who];el.innerHTML=p?`👁 <b>${esc(p.name)}</b> · ${IC.home} Cuadrar`:`${IC.home} Cuadrar`;
 document.querySelectorAll('#app .t3seat').forEach(s=>s.classList.toggle('look',+s.dataset.seat===VT.who))}
// cartita del descarte abajo a la izquierda: solo cuando la pila no se ve (cámara movida o mirando a alguien)
function dpv(){if(!dpvEl)return;const G=V&&V.G,id=G&&G.disc.length?G.disc[G.disc.length-1]:null;let show=false;
 if(id!=null&&L&&L.disc){const q=L.disc.clone().project(CA);show=q.z>1||Math.abs(q.x)>.97||Math.abs(q.y)>.97}
 if(show){const k=id+(cbl?'c':'')+'|'+G.color;if(dpvEl.dataset.k!==k){const was=dpvEl.dataset.k;dpvEl.dataset.k=k;
   dpvEl.children[1].src=faceTex(id).image.toDataURL();const c=U(id);dpvEl.lastChild.innerHTML=c.c==4?`${chipC(G.color)} ${UCN[G.color]}`:esc(String(usym(c))+' '+UCN[c.c]);
   if(was){dpvEl.classList.remove('new');void dpvEl.offsetWidth;dpvEl.classList.add('new')}}}
 if(dpvEl.classList.contains('on')!==show)dpvEl.classList.toggle('on',show)}

// ---------- engancharse a la vista de siempre ----------
function active(){return on&&!!S&&!!V&&V.game==='uno'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final')}
function loop3(now){requestAnimationFrame(loop3);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('u3on',a);
 if(!a){first=true;if(dpvEl)dpvEl.classList.remove('on');document.documentElement.classList.remove('u3mini');home();VW.x=VW.z=0;VW.k=1;return}
 if(!L||innerWidth!==W||innerHeight!==H){layout();sync()}
 viewStep(dt);step(now);ringStep(dt,now);avStep(now);pulse(now);labels();viewBtn();dpv();
 // primero el cuarto y la mesa; luego tu mano encima (que nunca la tape una cabeza ni la mesa)
 R.clear();CA.layers.set(0);R.render(SC,CA);R.clearDepth();CA.layers.set(1);R.render(SC,CA);CA.layers.set(0)}
function toggle(){on=!on;menu=false;try{localStorage.setItem('uno_3d',on?'1':'0')}catch(e){}render()}
GM.uno.body=function(){
 if(!active()){const G=V&&V.G;return (G&&(G.phase=='play'||G.phase=='final')?`<button class="b g sm2" onclick="u3dToggle()">${on?'🖼 Vista clásica 2D':'🎲 Vista 3D'}</button>`:'')+orig()}
 // guardo lo abierto y el scroll del menú para que no se pierda al redibujar
 const m=$('#t3menu');if(m){menuScroll=m.scrollTop;menuOpen=new Set([...m.querySelectorAll('details[open]')].map(d=>d.dataset.k))}
 try{init();return hud()}catch(e){console.warn('Uno 3D:',e);on=false;return orig()}};
GM.uno.after=function(){if(origAfter)origAfter();if(!active())return;
 const m=$('#t3menu');if(m)m.scrollTop=menuScroll;
 try{const bb=$('#t3bar .w7g');if(!L||!L.top||(bb&&Math.abs(bb.getBoundingClientRect().top-L.barTop)>2))layout();sync();labels()}catch(e){console.warn('Uno 3D:',e)}};
window.u3dToggle=toggle;
window.u3dMenu=()=>{menu=!menu;render()};
window.u3dDark=()=>{setDark(!dark);menu=false;sfx('tick');render()};
window.u3dMini=()=>{mini=!mini;menu=false;try{localStorage.setItem('cont_mini',mini?'1':'0')}catch(e){}if(L)L.top=0;sfx('tick');render()};
window.u3dLook=look;
window.u3dHome=home;
window.u3dWin=()=>{winHide=true;sfx('tick');render()};
})();
