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
const ray=new THREE.Raycaster(),P2=new THREE.Vector2(),X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),Qe=(x,y,z)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
const FD=Qe(0,0,Math.PI),FU=Qe(0,0,0);   // boca abajo / boca arriba sobre la mesa
const $=s=>document.querySelector(s);
// cámara libre: VT = adónde va, VW = dónde está (x,z = punto de la mesa que queda al centro, k = zoom, a = giro, t = inclinación). who = jugador que estás mirando
const VW={x:0,z:0,k:1,a:0,t:0},VT={x:0,z:0,k:1,a:0,t:0,who:-1},KMAX=3.2,PL=new THREE.Plane(new THREE.Vector3(0,1,0),0),tch=new Map();
let pin=null,myTc=null,lastNow=0,peekEl=null,peekId=null,camOpen=false,camTip=false,camRep=null,ap=null;
try{camOpen=localStorage.getItem('cont_cam')=='1'}catch(e){}
const touchy=matchMedia('(pointer:coarse)').matches,lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
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
 SC.add(new THREE.HemisphereLight(0xffffff,0x24402e,1.7));
 const Ld=new THREE.DirectionalLight(0xfff2da,2.6);Ld.position.set(-5,14,7);Ld.castShadow=true;Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0004;
 Object.assign(Ld.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:40});SC.add(Ld);
 const fill=new THREE.DirectionalLight(0xbfdcff,.6);fill.position.set(6,6,-4);SC.add(fill);
 const pt=new THREE.PointLight(0xffffff,1.6,0,1.4);pt.position.set(0,1.2,1);CA.add(pt);   // luz suave para tu mano
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
 L.band={x0:L.rect.x0,x1:ix,z0:iz-(por?1.5:1.4),z1:iz+(por?.45:.35)};L.rectMine=Object.assign({},L.rect,{z1:L.band.z0-.15})}
// Ajusta cámara y tamaños a la pantalla: la mesa ocupa lo que queda entre la barra de arriba y tu mano.
function layout(){const w=innerWidth,h=innerHeight;W=w;H=h;R.setSize(w,h,false);
 const por=w/h<.95;if((por?'p':'l')!==tableKey){tableKey=por?'p':'l';buildTable(por)}
 const tb=$('#t3top'),bb=$('#t3bar .w7g'),top=(tb?tb.getBoundingClientRect().bottom:54)+(h<500?4:24),bar=h-(bb?bb.getBoundingClientRect().top:h-60);
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
function clampV(){if(!L)return;VT.k=Math.max(1,Math.min(KMAX,VT.k));VT.x=Math.max(-L.rx,Math.min(L.rx,VT.x));VT.z=Math.max(-L.rz,Math.min(L.rz,VT.z));
 VT.t=Math.max(.42-L.el,Math.min(1.5-L.el,VT.t))}
const VK=['x','z','k','a','t'];
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);cam()}
function viewStep(dt){const f=RM?1:1-Math.exp(-dt/110);let ch=0;
 VK.forEach(q=>{const d=VT[q]-VW[q];if(Math.abs(d)>1e-4){VW[q]+=d*f;ch=1}else if(d){VW[q]=VT[q];ch=1}});if(ch)cam()}
const viewed=()=>VT.k>1.02||Math.abs(VT.x)>.05||Math.abs(VT.z)>.05||Math.abs(VT.a)>.01||Math.abs(VT.t)>.01;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
// cuadrar: regresa a la vista de siempre por el camino corto
function home(){VW.a=wrap(VW.a);Object.assign(VT,{x:0,z:0,k:1,a:0,t:0,who:-1})}
// pasos de la barra de cámara y del teclado (suaves: solo mueven el destino)
function camStep(c){const f=1.1/VT.k,sa=Math.sin(VT.a),ca=Math.cos(VT.a),mv={up:[0,-1],dn:[0,1],lf:[-1,0],rt:[1,0]}[c];
 if(c=='rl')VT.a-=.2;else if(c=='rr')VT.a+=.2;else if(c=='zi')VT.k*=1.2;else if(c=='zo')VT.k/=1.2;else if(c=='tu')VT.t+=.09;else if(c=='td')VT.t-=.09;
 else if(mv){VT.x+=(mv[0]*ca+mv[1]*sa)*f;VT.z+=(-mv[0]*sa+mv[1]*ca)*f}else return;VT.who=-1;clampV()}
// ---------- ver en grande la carta de arriba del descarte (ratón encima o dedo presionado) ----------
const peekImg={};
function peek(onn){const id=onn&&V.G.disc.length?V.G.disc[V.G.disc.length-1]:null;if(id===peekId)return;peekId=id;if(!peekEl)return;
 if(id==null){peekEl.classList.remove('on');return}
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
 Object.assign(VT,{x:(x0+x1)/2,z:(z0+z1)/2,k:Math.max(1.5,Math.min(KMAX,kk)),who:k});clampV();sfx('card')}
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
 if(!g){g=new THREE.Mesh(new THREE.PlaneGeometry(CW*1.22/GI,CH*1.16/GI),new THREE.MeshBasicMaterial({map:glowTex(),color:0x4fb8ff,opacity:.6,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));g.rotation.x=-Math.PI/2;g.position.y=-CT;m.add(g);m.userData.sg=g}
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
 if(mine&&myTc!==G.tc){myTc=G.tc;if(VT.who>=0)home()}
 // qué pasó desde la última vez (para saber de dónde sale cada carta)
 const from={},took={};(G.log||[]).forEach(e=>{if(e.n<=logN)return;if(e.c!=null&&/^(descartó|pegó|cambió)/.test(e.t))from[e.c]=e.k;if(/^(tomó|compró)/.test(e.t))took[e.k]=1});logN=Math.max(logN,G.ln||0);
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
   pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k:VW.k,g:ground((a[0]+b[0])/2,(a[1]+b[1])/2),ang:Math.atan2(b[1]-a[1],b[0]-a[0]),acc:0,rot:false};return}
  if(tch.size>2)return}
 if(e.button==1)e.preventDefault();
 const rot=e.button==1||(e.button==2&&e.shiftKey),pan=e.button==2&&!rot;if(pan||rot)cv.style.cursor=rot?'move':'grabbing';
 st={x:e.clientX,y:e.clientY,hit:pan||rot?null:pick(e),pid:e.pointerId,pan,rot,a0:VW.a,t0:VW.t,g:null};try{cv.setPointerCapture(e.pointerId)}catch(_){}
 if(e.pointerType!=='mouse'&&st.hit&&st.hit.t=='disc'){const s0=st;s0.lp=setTimeout(()=>{if(st!==s0)return;s0.peek=true;peek(true);if(navigator.vibrate)navigator.vibrate(12)},380)}}
function pMove(e){if(!active())return;
 if(tch.has(e.pointerId)){tch.set(e.pointerId,[e.clientX,e.clientY]);
  if(pin&&tch.size>=2){const [a,b]=[...tch.values()],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]);let da=wrap(ang-pin.ang);pin.ang=ang;
   // el giro arranca hasta pasar ~7°, para que pellizcar no rote sin querer
   pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.12){pin.rot=true;da=pin.acc}if(pin.rot)VT.a=VW.a+da;
   VT.k=pin.k*(Math.hypot(a[0]-b[0],a[1]-b[1])||1)/pin.d;snap();
   const p=ground(mx,my);if(p&&pin.g){VT.x+=pin.g.x-p.x;VT.z+=pin.g.z-p.z;snap()}return}}
 if(!st){if(e.pointerType==='mouse'){const h=pick(e),id=h&&h.t=='hand'?h.id:null;peek(!!h&&h.t=='disc');cv.style.cursor=h?'pointer':'default';if(id!==hov){hov=id;sync()}}return}
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
 if(h.t=='slot'){if(pl&&!dn)sel.size?addTo(h.k,[...sel]):backFrom(h.k);return}
 if(h.t=='hand'){if(pl)tog(h.id);else sfx('card')}}

// ---------- capa de controles (HTML encima del 3D) ----------
function hud(){const G=V.G,i=V.me,t=G.turn,mine=i==t,dn=i>=0&&G.down[i],pl=mine&&G.step=='play',drw=mine&&G.step=='draw';
 const hint=i<0?'Mirando como host':mine?(drw?'Toca el mazo o el descarte para robar':dn?'Pega cartas en la mesa o descarta':'Selecciona cartas y tócalas en tu contrato'):'Esperando a '+nm(t)+'…';
 let h=`<div id="t3top" class="w7 w7g${mine?' me':''}"><button class="w7b" onclick="c3dMenu()" aria-label="Menú">☰ Juego</button>
  <div class="inf"><div class="l1">Ronda ${G.round+1}/7 · <b>${conTxt(G.round)}</b></div><div class="l2">${mine?'<b>¡Tu turno!</b> '+hint:hint}</div></div>
  <button class="w7b" onclick="c3dToggle()" title="Vista clásica 2D">2D</button></div>`;
 const lg=(G.log||[]).slice(-1)[0];if(lg)h+=`<div id="t3log" class="w7">${chip(lg.k)}<b>${esc(G.players[lg.k].name)}</b> ${esc(lg.t)}</div>`;
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
 // menú Juego
 if(menu){const op=k=>menuOpen.has(k)?' open':'';
  h+=`<div id="t3menu" class="w7"><button class="mi" onclick="mute=!mute;render()">${mute?'🔇 Sonido: apagado':'🔊 Sonido: encendido'}</button><button class="mi" onclick="c3dToggle()">🖼 Vista clásica 2D</button><hr>
  <button class="mi" onclick="c3dAp()">🎨 Cambiar apariencia…</button><details data-k="pl"${op('pl')}><summary class="mi">👥 Jugadores</summary>${plist()}</details>
  <details data-k="lg"${op('lg')}><summary class="mi">📜 Historial</summary>${logv()||'<div class="rt">Nada todavía.</div>'}</details>
  ${GM.continental.rules.replace('<details>',`<details data-k="rg"${op('rg')}>`).replace('<summary>Reglas</summary>','<summary class="mi">📖 Reglas</summary><div class="rt">').replace(/<\/details>$/,'</div></details>')}
  ${V.host?`<hr><button class="mi" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">✖ Cerrar sala</button>`:''}</div>`}
 return h}
// ---------- ventana "Cambiar apariencia" (como la de Solitario de Windows 7) ----------
const APT={bg:{n:'Mesa',h:'Elige el color de la mesa:',o:[['green','Verde clásico'],['blue','Azul'],['red','Vino'],['orange','Ámbar'],['purple','Púrpura'],['graphite','Grafito']]},
 cards:{n:'Cartas',h:'Elige el diseño de las cartas:',o:[['classic','Clásicas'],['big','Grandes'],['black','Negras'],['retro','Retro'],['contrast','Contraste']]},
 back:{n:'Reverso',h:'Elige el reverso de la baraja:',o:[['red','Rojo'],['blue','Azul'],['green','Verde'],['gold','Dorado'],['black','Ónix'],['neon','Neón']]}};
const thumbs={};
// miniaturas dibujadas con las mismas texturas de la mesa 3D
function thumb(kind,v){const k=kind+v+(kind=='bg'?scards+sback:'');if(thumbs[k])return thumbs[k];const c=cnv(176,124),g=c.getContext('2d');
 const card=(im,x,y,w,a)=>{g.save();g.translate(x,y);g.rotate(a);g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=6;g.shadowOffsetY=2;g.drawImage(im,-w/2,-w*TH/TW/2,w,w*TH/TW);g.restore()};
 if(kind=='bg'){g.save();g.beginPath();g.ellipse(88,62,84,56,0,0,7);g.fillStyle='#5a2e13';g.fill();g.beginPath();g.ellipse(88,62,74,47,0,0,7);g.clip();
  g.drawImage(feltTex(v).image,0,0,176,124);const sh=g.createRadialGradient(88,40,10,88,62,90);sh.addColorStop(0,'rgba(255,255,255,.18)');sh.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=sh;g.fillRect(0,0,176,124);g.restore();
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1.5;g.beginPath();g.ellipse(88,61,83,55,0,Math.PI*1.1,Math.PI*1.9);g.stroke();
  card(backTex().image,62,62,30,-.12);card(faceTex(13).image,100,64,30,.1)}
 else if(kind=='cards'){[[0,-.28,56],[25,0,88],[32,.28,120]].forEach(([id,a,x])=>card(faceTex(id,v).image,x,66,52,a))}
 else{card(backTex(v).image,74,64,54,-.14);card(backTex(v).image,104,62,54,.1)}
 return thumbs[k]=c.toDataURL()}
const apCur=k=>k=='bg'?sbg:k=='cards'?scards:sback;
function apUI(){const T=APT[ap.tab];
 return `<div id="t3ap" class="w7" role="dialog" aria-modal="true" aria-labelledby="t3apt"><div class="wt"><span id="t3apt">Cambiar apariencia</span><button class="wx" onclick="c3dApClose(0)" aria-label="Cerrar">✕</button></div>
 <div class="wb"><div class="tabs" role="tablist">${Object.keys(APT).map(k=>`<button role="tab" aria-selected="${ap.tab==k}" class="tab${ap.tab==k?' on':''}" onclick="c3dApTab('${k}')">${APT[k].n}</button>`).join('')}</div>
 <div class="pane" role="tabpanel"><div class="hd">${T.h}</div><div class="grid">${T.o.map(([v,n])=>`<button class="opt${apCur(ap.tab)==v?' on':''}" onclick="c3dApSet('${ap.tab}','${v}')" aria-pressed="${apCur(ap.tab)==v}"><img src="${thumb(ap.tab,v)}" alt=""><span>${n}</span></button>`).join('')}</div>
 <div class="nt">Los cambios se ven en la mesa al instante.</div></div>
 <div class="ft"><button class="w7b dflt" onclick="c3dApClose(1)">Aceptar</button><button class="w7b" onclick="c3dApClose(0)">Cancelar</button></div></div></div>`}
function apOpen(){menu=false;ap={tab:'bg',prev:[sbg,scards,sback]};render()}
function apSet(k,v){if(k=='bg')sbg=v;else if(k=='cards')scards=v;else sback=v;applyStyle();sfx('card');render()}
function apClose(ok){if(!ap)return;if(!ok){[sbg,scards,sback]=ap.prev;applyStyle()}ap=null;sfx('tick');render()}
function labels(){if(!L)return;document.querySelectorAll('#app .t3seat').forEach(el=>{const k=+el.dataset.seat,[x,y]=toPx(seatP(k,1).setY(.3)),hw=el.offsetWidth/2+4,hh=el.offsetHeight/2+4;
  el.style.transform=`translate(${Math.max(hw,Math.min(W-hw,x))}px,${Math.max(hh,Math.min(H-hh,y))}px) translate(-50%,-50%)`});
 const sl=L.slots;if(sl)sl.pos.forEach((p,k)=>{const el=document.getElementById('t3sl'+k);if(!el)return;const [x,y]=toPx(v3(p.x+p.w/2,0,p.z-sl.ch/2-sl.pad));el.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`});
 const se=document.getElementById('t3sel');if(se&&L.hand){const y=Math.min(...L.hand.map(f=>f.y))-L.ch/2-10,hw=se.offsetWidth/2+6;se.style.transform=`translate(${Math.max(hw,Math.min(W-hw,W/2))}px,${y}px) translate(-50%,-100%)`}
 const pl=(id,p)=>{const el=document.getElementById(id);if(!el)return;const [x,y]=toPx(p);el.style.transform=`translate(${x}px,${y}px) translate(-50%,0)`};
 if(peekId!=null){const t=V.G.disc[V.G.disc.length-1];if(t!==peekId){peekId=null;if(t!=null)peek(true)}peekPos()}
 const dz=CH*L.ps/2+.12;if(L.deck){pl('t3pdk',v3(L.deck.x,0,L.deck.z+dz));pl('t3pds',v3(L.disc.x,0,L.disc.z+dz))}}

// ---------- engancharse a la vista de siempre ----------
function active(){return on&&!!S&&!!V&&V.game==='continental'&&!!V.G&&V.G.phase==='play'}
function loop3(now){requestAnimationFrame(loop3);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('c3on',a);if(!a){first=true;peek(false);home();VW.x=VW.z=0;VW.k=1;return}
 if(!L||innerWidth!==W||innerHeight!==H){layout();sync()}
 viewStep(dt);step(now);pulse(now);labels();viewBtn();R.render(SC,CA)}
// con la barra de cámara abierta, su propio botón Cuadrar basta (salvo cuando miras a alguien)
function viewBtn(){document.documentElement.classList.toggle('c3ap',!!ap);const el=document.getElementById('t3view');if(!el)return;const k=viewed()&&(!camOpen||VT.who>=0)?String(VT.who):'';if(el.dataset.k===k)return;el.dataset.k=k;
 el.style.display=k?'':'none';const p=VT.who>=0&&V.G.players[VT.who];el.innerHTML=p?`👁 <b>${esc(p.name)}</b> · ${IC.home} Cuadrar`:`${IC.home} Cuadrar`;
 document.querySelectorAll('#app .t3seat').forEach(s=>s.classList.toggle('look',+s.dataset.seat===VT.who))}
function toggle(){on=!on;menu=false;try{localStorage.setItem('cont_3d',on?'1':'0')}catch(e){}render()}
GM.continental.body=function(){
 if(!active()){const G=V&&V.G;return (G&&G.phase=='play'?`<button class="b g sm2" onclick="c3dToggle()">${on?'🖼 Vista clásica 2D':'🎲 Vista 3D'}</button>`:'')+orig()}
 // guardo lo abierto y el scroll para que no se pierda al redibujar
 const m=$('#t3menu');if(m){menuScroll=m.scrollTop;menuOpen=new Set([...m.querySelectorAll('details[open]')].map(d=>d.dataset.k))}
 try{init();return hud()}catch(e){console.warn('Continental 3D:',e);on=false;return orig()}};
GM.continental.after=function(){if(origAfter)origAfter();if(!active())return;
 const m=$('#t3menu');if(m)m.scrollTop=menuScroll;
 try{const bb=$('#t3bar .w7g');if(!L||!L.top||(bb&&Math.abs(bb.getBoundingClientRect().top-L.barTop)>2))layout();sync();labels()}catch(e){console.warn('Continental 3D:',e)}};
window.c3dToggle=toggle;
window.c3dMenu=()=>{menu=!menu;render()};
window.c3dBajar=bajar3d;
window.c3dLook=look;
window.c3dHome=home;
window.c3dAp=apOpen;window.c3dApSet=apSet;window.c3dApClose=apClose;window.c3dApTab=k=>{ap.tab=k;render()};
})();
