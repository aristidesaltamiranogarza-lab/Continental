// Mérida en Venta 3D: tablero 3D a pantalla completa con fichas yucatecas (sombrero, hamaca, tricitaxi, panucho, huipil, guayabera).
// NO cambia reglas ni servidor. Se carga DESPUÉS de c_merida.js: envuelve GM.merida.body/after y usa el mismo panel de acciones (MR.panel).
// Arrastra para girar la cámara, rueda o pellizco para acercar, toca una casilla para ver sus rentas.
(function(){
if(typeof THREE==='undefined'||typeof GM==='undefined'||!GM.merida||!window.MR){console.warn('Mérida 3D: falta Three.js o c_merida.js');return}
const orig=GM.merida.body,origAfter=GM.merida.after,D=MR.D,B=MR.B,K=2048/12;
let on=true;try{on=localStorage.getItem('merida_3d')!=='0'}catch(e){}
let R,SC,CA,root,cv,ready=false,W=0,H=0,dyn,selM,ring,rollN=-1,rollT=-1e9,hudScroll=0,lastNow=0,dynKey='';
const toks=[],anim=[],shown=[],dice=[],faces=[],cam={yaw:0,pitch:.98,z:1},ptr=new Map(),ray=new THREE.Raycaster(),P2=new THREE.Vector2(),PLANE=new THREE.Plane(new THREE.Vector3(0,1,0),-.11);
const css=document.createElement('style');css.textContent=`
#m3root{position:fixed;left:0;top:0;z-index:1;display:none;background:radial-gradient(ellipse at 50% 40%,#5a4330 0%,#22170e 70%);touch-action:none;-webkit-user-select:none;user-select:none}
#m3root canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}
#m3hud{position:fixed;z-index:10;pointer-events:auto;overflow:auto;right:6px;top:6px;bottom:6px;width:min(390px,44vw);padding:6px;box-sizing:border-box;background:rgba(45,30,18,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:10px;overscroll-behavior:contain}
@media (max-width:759px){#m3hud{left:0;right:0;bottom:0;top:auto;width:auto;height:48vh;border-radius:12px 12px 0 0}}
html.m3on,html.m3on body{overflow:hidden;height:100%;overscroll-behavior:none}html.m3on #app{pointer-events:none}
.m3top{display:flex;flex-wrap:wrap;gap:2px;margin-bottom:4px}`;document.head.appendChild(css);
// ---- geometría del tablero: 12x12, esquinas de 1.5 y casillas de 1. Lado 0 abajo (z+), 1 izquierda, 2 arriba, 3 derecha ----
function cpos(i){if(i==0)return[5.25,5.25];if(i<10)return[5-i,5.25];if(i==10)return[-5.25,5.25];if(i<20)return[-5.25,5-(i-10)];
 if(i==20)return[-5.25,-5.25];if(i<30)return[-5+(i-20),-5.25];if(i==30)return[5.25,-5.25];return[5.25,-5+(i-30)]}
const side=i=>Math.floor(i/10)%4,INW=[[0,-1],[1,0],[0,1],[-1,0]];
function sqAt(x,z){const a=Math.abs(x),b=Math.abs(z);if(a>6||b>6||(a<4.5&&b<4.5))return -1;
 if(z>4.5)return x>4.5?0:x<-4.5?10:Math.floor(5.5-x);if(z<-4.5)return x<-4.5?20:x>4.5?30:20+Math.floor(x+5.5);
 return x<0?10+Math.floor(5.5-z):30+Math.floor(z+5.5)}
// ---- texturas ----
function wrap(g,t,mw){const w=t.split(' '),L=[];let l='';w.forEach(x=>{const y=l?l+' '+x:x;if(g.measureText(y).width>mw&&l){L.push(l);l=x}else l=y});if(l)L.push(l);return L}
const ICO={go:'⬅️',jail:'🔒',free:'🏖️',gtj:'👮',s:'❓',c:'🎁',tax:'🧾',r:'🚌'},UI={CFE:'⚡',JAPAY:'💧'};
function boardTex(){const c=document.createElement('canvas');c.width=c.height=2048;const g=c.getContext('2d'),F='"Segoe UI","Noto Sans",system-ui,sans-serif';
 const gr=g.createRadialGradient(1024,1024,100,1024,1024,900);gr.addColorStop(0,'#fff6df');gr.addColorStop(1,'#e8d6a8');g.fillStyle=gr;g.fillRect(0,0,2048,2048);
 // centro: título y lugares de las cartas
 g.save();g.translate(1024,1024);g.rotate(-Math.PI/4);g.textAlign='center';g.textBaseline='middle';
 g.fillStyle='#8a3b12';g.font='bold 150px Georgia,serif';g.fillText('Mérida',0,-90);g.fillText('en Venta',0,70);
 g.fillStyle='#6b5a3a';g.font='italic 52px Georgia,serif';g.fillText('la Ciudad Blanca',0,190);g.restore();
 [[-1,'❓','Suerte','#ffcf5a'],[1,'🎁','Comunidad','#9fd4ff']].forEach(([s,ic,t,col])=>{g.save();g.translate(1024+s*330,1024+s*330);g.rotate(-Math.PI/4);
  g.fillStyle=col;g.strokeStyle='#5a4630';g.lineWidth=6;g.beginPath();if(g.roundRect)g.roundRect(-150,-100,300,200,18);else g.rect(-150,-100,300,200);g.fill();g.stroke();
  g.fillStyle='#3a2a18';g.textAlign='center';g.textBaseline='middle';g.font='80px '+F;g.fillText(ic,0,-25);g.font='bold 44px '+F;g.fillText(t,0,55);g.restore()});
 for(let i=0;i<40;i++){const s=B[i],[x,z]=cpos(i),cor=i%10==0,w=(cor?1.5:1)*K,h=1.5*K;g.save();g.translate((x+6)*K,(z+6)*K);g.rotate(side(i)*Math.PI/2);
  g.fillStyle='#fbf6e8';g.fillRect(-w/2,-h/2,w,h);g.strokeStyle='#33402f';g.lineWidth=4;g.strokeRect(-w/2,-h/2,w,h);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#222';
  let y=-h/2+16;
  if(s.t=='p'){g.fillStyle=D.gcol[s.g];g.fillRect(-w/2+2,-h/2+2,w-4,.3*K);g.strokeRect(-w/2,-h/2,w,.3*K);y+=.3*K+14}
  else if(!cor){g.font='70px '+F;g.fillStyle='#222';g.fillText(s.t=='u'?UI[s.n]:ICO[s.t],0,-h/2+.36*K);y+=.62*K}
  else{g.font='120px '+F;g.fillText(ICO[s.t],0,-25)}
  g.fillStyle='#1d1d1d';g.font='bold '+(cor?40:29)+'px '+F;const L=wrap(g,s.n.toUpperCase(),w-18);
  if(cor){L.forEach((l,j)=>g.fillText(l,0,-h/2+38+j*42));if(s.s){g.font='30px '+F;g.fillText(s.s,0,h/2-40)}}
  else{L.forEach((l,j)=>g.fillText(l,0,y+14+j*32));const pr=s.p||s.v;if(pr){g.font='600 30px '+F;g.fillText('$'+pr,0,h/2-30)}}
  g.restore()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=R.capabilities.getMaxAnisotropy();return t}
function stripeTex(cols,w=64,h=8){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');cols.forEach((x,i)=>{g.fillStyle=x;g.fillRect(i*w/cols.length,0,w/cols.length+1,h)});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function huipilTex(){const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');g.fillStyle='#fbfaf6';g.fillRect(0,0,256,256);
 const fl=(y,s)=>{for(let x=8;x<256;x+=32){['#e53935','#8e24aa','#fbc02d','#43a047'].forEach((col,j)=>{g.fillStyle=col;g.beginPath();g.arc(x+(j%2?8:-8)*s,y+(j<2?-8:8)*s,7*s,0,7);g.fill()});g.fillStyle='#ff7043';g.beginPath();g.arc(x,y,5*s,0,7);g.fill()}};
 g.fillStyle='#2e7d32';g.fillRect(0,206,256,4);g.fillRect(0,252,256,4);fl(230,1);g.fillRect(0,34,256,3);fl(16,.8);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function pipTex(v){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#fbf7ec';g.fillRect(0,0,128,128);
 const P={1:[[64,64]],2:[[34,34],[94,94]],3:[[30,30],[64,64],[98,98]],4:[[34,34],[94,34],[34,94],[94,94]],5:[[30,30],[98,30],[64,64],[30,98],[98,98]],6:[[34,28],[94,28],[34,64],[94,64],[34,100],[94,100]]};
 g.fillStyle=v==1?'#c62828':'#1d1d1d';P[v].forEach(([x,y])=>{g.beginPath();g.arc(x,y,v==1?17:12,0,7);g.fill()});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
// ---- piezas ----
const std=(c,r=.6,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r},o));
function add(G,geo,m,x=0,y=0,z=0,rx=0,ry=0,rz=0){const s=new THREE.Mesh(geo,m);s.position.set(x,y,z);s.rotation.set(rx,ry,rz);s.castShadow=true;G.add(s);return s}
const cyl=(a,b,h,n=20)=>new THREE.CylinderGeometry(a,b,h,n),box=(a,b,c)=>new THREE.BoxGeometry(a,b,c);
function piece(k){const G=new THREE.Group(),T=k%6,col=MR.pc(k);add(G,cyl(.2,.22,.05,24),std(col,.4,{metalness:.2}),0,.025);
 if(T==0){const st=std(0xe6cf8f,.85);add(G,cyl(.27,.27,.025,28),st,0,.08);add(G,cyl(.12,.135,.16,20),st,0,.17);add(G,cyl(.1,.12,.02,20),st,0,.255);
  add(G,new THREE.TorusGeometry(.13,.014,6,24),std(0x3b2a1a,.6),0,.11,0,Math.PI/2)}
 else if(T==1){const wd=std(0x7a4a24,.7);add(G,cyl(.018,.018,.36,8),wd,-.17,.21);add(G,cyl(.018,.018,.36,8),wd,.17,.21);
  ['#e53935','#fb8c00','#fdd835','#43a047','#1e88e5','#8e24aa'].forEach((c,j)=>{const z=-.075+j*.03,cv=new THREE.CatmullRomCurve3([[-.16,.34],[-.08,.2],[0,.16],[.08,.2],[.16,.34]].map(([x,y])=>new THREE.Vector3(x,y,z)));
   add(G,new THREE.TubeGeometry(cv,16,.016,6),std(c,.8))});add(G,cyl(.004,.004,.2,4),std(0xffffff,.9),-.17,.38,0,Math.PI/2);add(G,cyl(.004,.004,.2,4),std(0xffffff,.9),.17,.38,0,Math.PI/2)}
 else if(T==2){const rd=std(0xc62828,.5),bk=std(0x222222,.5),wh=new THREE.TorusGeometry(.065,.016,8,20);
  add(G,wh,bk,-.13,.1,.08,0,Math.PI/2);add(G,wh,bk,.13,.1,.08,0,Math.PI/2);add(G,wh,bk,0,.1,-.16,0,Math.PI/2);
  add(G,box(.3,.06,.16),rd,0,.17,.08);add(G,box(.3,.12,.03),rd,0,.23,.0);add(G,box(.04,.04,.26),bk,0,.13,-.06);
  add(G,box(.34,.015,.22),std(0x1565c0,.6),0,.39,.07);[[-.15,.15],[.15,.15],[-.15,-.01],[.15,-.01]].forEach(([x,z])=>add(G,cyl(.008,.008,.2,6),bk,x,.29,z));
  add(G,box(.08,.03,.06),bk,0,.22,-.14);add(G,cyl(.006,.006,.2,6),bk,0,.23,-.08,0,0,Math.PI/2)}
 else if(T==3){add(G,cyl(.2,.2,.05,28),std(0xd8a257,.85),0,.08);add(G,cyl(.18,.18,.015,28),std(0x7cb342,.8),0,.11);
  [[.07,.04],[-.06,.07],[0,-.08],[-.09,-.04]].forEach(([x,z])=>add(G,cyl(.045,.045,.018,14),std(0xe53935,.6),x,.125,z));
  for(let j=0;j<7;j++){const a=j*.9;add(G,new THREE.TorusGeometry(.028,.007,5,12),std(0xc2185b,.5),Math.cos(a)*.1,.137,Math.sin(a)*.1,Math.PI/2)}
  for(let j=0;j<6;j++)add(G,box(.05,.015,.015),std(0x8d4e1f,.8),Math.sin(j*2.1)*.07,.14,Math.cos(j*2.1)*.07,0,j)}
 else if(T==4){const m=new THREE.MeshStandardMaterial({map:huipilTex(),roughness:.85});add(G,cyl(.1,.16,.34,24),m,0,.22);
  add(G,box(.07,.06,.06),std(0xfbfaf6,.85),-.13,.33,0,0,0,.5);add(G,box(.07,.06,.06),std(0xfbfaf6,.85),.13,.33,0,0,0,-.5);
  add(G,new THREE.SphereGeometry(.05,12,10),std(0x8d5524,.6),0,.43);add(G,new THREE.TorusGeometry(.05,.012,6,4),std(0xe53935,.5),0,.38,.09,0,0,Math.PI/4)}
 else{const m=std(0xf3eee0,.75),ln=std(0xd9d2bf,.8);add(G,box(.26,.28,.1),m,0,.2);add(G,box(.08,.14,.08),m,-.16,.27,0,0,0,.45);add(G,box(.08,.14,.08),m,.16,.27,0,0,0,-.45);
  add(G,box(.12,.03,.1),m,0,.355);[-.08,-.04,.04,.08].forEach(x=>add(G,box(.008,.26,.008),ln,x,.2,.052));
  [[-.07,.27],[.07,.27],[-.07,.13],[.07,.13]].forEach(([x,y])=>add(G,box(.05,.045,.006),ln,x,y,.054));for(let j=0;j<5;j++)add(G,cyl(.007,.007,.006,8),std(0x8d6e63,.4),0,.32-j*.055,.054,Math.PI/2)}
 return G}
function house(hotel,n){const G=new THREE.Group(),c=hotel?0xd81b60:[0xf48fb1,0xffe082,0x80deea,0xa5d6a7][n%4];
 add(G,box(hotel?.3:.14,hotel?.16:.11,hotel?.16:.14),std(c,.6),0,hotel?.08:.055);
 const roof=add(G,new THREE.ConeGeometry(hotel?.2:.11,hotel?.1:.08,4),std(0x8d3a1a,.7),0,(hotel?.16:.11)+(hotel?.05:.04),0,0,Math.PI/4);roof.scale.set(hotel?1.25:1,1,hotel?.8:1);return G}
// ---- escena ----
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,200);
 SC.add(new THREE.HemisphereLight(0xfff4e0,0x3a2a1e,1.6));const L=new THREE.DirectionalLight(0xfff0d8,2.4);L.position.set(-6,16,8);L.castShadow=true;L.shadow.mapSize.set(2048,2048);
 Object.assign(L.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:50});L.shadow.bias=-.0005;SC.add(L);
 const tb=new THREE.Mesh(cyl(10.5,10.5,.4,64),std(0x6d4426,.75));tb.position.y=-.45;tb.receiveShadow=true;SC.add(tb);
 const base=new THREE.Mesh(box(12.3,.2,12.3),std(0x2f4f3a,.6));base.receiveShadow=true;SC.add(base);
 const top=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.MeshStandardMaterial({map:boardTex(),roughness:.85}));top.rotation.x=-Math.PI/2;top.position.y=.101;top.receiveShadow=true;SC.add(top);
 dyn=new THREE.Group();SC.add(dyn);
 selM=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xff9800,transparent:true,opacity:.35,depthWrite:false}));selM.rotation.x=-Math.PI/2;selM.position.y=.105;selM.visible=false;SC.add(selM);
 ring=new THREE.Mesh(new THREE.TorusGeometry(.27,.03,8,32),new THREE.MeshBasicMaterial({color:0xffd54a}));ring.rotation.x=Math.PI/2;SC.add(ring);
 for(let v=1;v<=6;v++)faces[v]=new THREE.MeshStandardMaterial({map:pipTex(v),roughness:.35});
 for(let j=0;j<2;j++){const d=new THREE.Mesh(box(.5,.5,.5),[1,6,2,5,3,4].map(v=>faces[v]));d.castShadow=true;d.position.set(-.4+j*.8,.36,.9);SC.add(d);dice.push(d)}
 root=document.createElement('div');root.id='m3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY})});
 cv.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);if(!p)return;
  if(ptr.size==1){cam.yaw-=(e.clientX-p.x)*.008;cam.pitch=Math.max(.4,Math.min(1.5,cam.pitch+(e.clientY-p.y)*.006))}
  else if(ptr.size==2){const [a,b]=[...ptr.values()],d0=Math.hypot(a.x-b.x,a.y-b.y);p.x=e.clientX;p.y=e.clientY;const d1=Math.hypot(a.x-b.x,a.y-b.y);if(d0>0)zoom(d1/d0);return}
  p.x=e.clientX;p.y=e.clientY});
 const up=e=>{const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(p&&!ptr.size&&Math.hypot(e.clientX-p.x0,e.clientY-p.y0)<7)pick(e)};
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>ptr.delete(e.pointerId));
 cv.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0015))},{passive:false});
 requestAnimationFrame(loop)}
const zoom=f=>{cam.z=Math.max(.6,Math.min(2.6,cam.z*f))};
function pick(e){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const p=new THREE.Vector3();if(!ray.ray.intersectPlane(PLANE,p))return;const i=sqAt(p.x,p.z);if(i>=0)MR.sel(i);else if(MR.selected>=0)MR.sel(-1)}
function layout(){const mob=innerWidth<760,hud=document.getElementById('m3hud'),hr=hud?hud.getBoundingClientRect():null;
 if(mob){root.style.right='0';root.style.bottom=(hr?Math.round(innerHeight-hr.top):Math.round(innerHeight*.48))+'px'}else{root.style.bottom='0';root.style.right=(hr?Math.round(innerWidth-hr.left):400)+'px'}
 const b=root.getBoundingClientRect();W=Math.max(1,b.width);H=Math.max(1,b.height);R.setSize(W,H,false);CA.aspect=W/H;CA.updateProjectionMatrix()}
// dónde va cada ficha dentro de su casilla (las que comparten casilla se acomodan en 2 columnas)
function slot(k,G){const i=G.pos[k],[x,z]=cpos(i),s=side(i),[ix,iz]=INW[s],tx=Math.abs(iz),tz=Math.abs(ix);
 const same=G.players.map((_,j)=>j).filter(j=>!G.bk[j]&&G.pos[j]===i&&(i!==10||!!G.jail[j]===!!G.jail[k])),n=same.indexOf(k);
 if(i===10){if(G.jail[k])return [x+.3+(n%2)*.3-.15,z-.3-Math.floor(n/2)*.25];return [x-.45+(n%3)*.3,z+.5]}
 const c=(n%2)-.5,r=Math.floor(n/2)-1,cor=i%10==0;return [x+tx*c*.42+ix*(r*.36-.12)*(cor?1:1),z+tz*c*.42+iz*(r*.36-.12)]}
function rebuild(G){const key=JSON.stringify([G.own,G.hs,G.mg]);if(key===dynKey)return;dynKey=key;
 while(dyn.children.length)dyn.remove(dyn.children[0]);
 for(let i=0;i<40;i++){const o=G.own[i];if(o<0)continue;const [x,z]=cpos(i),s=side(i),[ix,iz]=INW[s],w=i%10==0?1.5:1;
  const bar=new THREE.Mesh(box(Math.abs(iz)?w*.9:.08,.03,Math.abs(ix)?w*.9:.08),std(MR.pc(o),.5,{transparent:!!G.mg[i],opacity:G.mg[i]?.35:1}));
  bar.position.set(x-ix*.7,.12,z-iz*.7);dyn.add(bar);
  const h=G.hs[i];if(!h)continue;const n=h==5?1:h;for(let j=0;j<n;j++){const m=house(h==5,i+j),t=n==1?0:(j-(n-1)/2)*.22;m.position.set(x+ix*.6+Math.abs(iz)*t,.11,z+iz*.6+Math.abs(ix)*t);m.rotation.y=s*Math.PI/2;dyn.add(m)}}}
function sync(){const G=V.G;
 G.players.forEach((_,k)=>{if(!toks[k]){toks[k]=piece(k);toks[k].rotation.y=0;SC.add(toks[k]);shown[k]=G.pos[k];const [x,z]=slot(k,G);toks[k].position.set(x,.1,z);anim[k]=null}
  toks[k].visible=!G.bk[k];const t=G.pos[k];
  if(shown[k]!==t){const d=(t-shown[k]+40)%40,path=[];if(d>0&&d<=12&&!(t===10&&G.jail[k]))for(let j=1;j<=d;j++)path.push((shown[k]+j)%40);else path.push(t);shown[k]=t;anim[k]={path,t0:performance.now(),from:toks[k].position.clone()}}
  else if(!anim[k]){const [x,z]=slot(k,G);toks[k].position.set(x,.1,z)}});
 if(G.rn!==rollN){if(rollN>=0)rollT=performance.now();rollN=G.rn;setDice(G.dice)}
 rebuild(G);const i=MR.selected;selM.visible=i>=0;if(i>=0){const [x,z]=cpos(i),s=side(i),w=i%10==0?1.5:1;selM.position.set(x,.105,z);selM.scale.set(s%2?1.5:w,s%2?w:1.5,1)}}
function setDice(v){dice.forEach((d,j)=>{const n=v[j]||1,m=d.material;m[2]=faces[n];m[3]=faces[7-n];const o=[1,2,3,4,5,6].filter(x=>x!==n&&x!==7-n);m[0]=faces[o[0]];m[1]=faces[7-o[0]];m[4]=faces[o[1]];m[5]=faces[7-o[1]]})}
const HOP=170;
function step(now){const G=V.G;
 G.players.forEach((_,k)=>{const a=anim[k],T=toks[k];if(!T)return;if(a){const t=(now-a.t0)/HOP;
   if(t>=1){a.path.shift();a.from=T.position.clone();a.t0=now;if(!a.path.length){anim[k]=null;const [x,z]=slot(k,G);T.position.set(x,.1,z);return}}
   const to=a.path[0],last=a.path.length==1,[x,z]=last?slot(k,G):cpos(to),u=Math.min(1,Math.max(0,t));
   T.position.set(a.from.x+(x-a.from.x)*u,.1+Math.sin(u*Math.PI)*.35,a.from.z+(z-a.from.z)*u)}
  T.rotation.y=cam.yaw+(k===G.turn&&G.phase=='play'?Math.sin(now/400)*.25:0)});
 const k=G.turn,T=toks[k];ring.visible=!!T&&G.phase=='play'&&!G.bk[k];if(T){ring.position.set(T.position.x,T.position.y+.03,T.position.z);ring.scale.setScalar(1+Math.sin(now/250)*.08)}
 const t=(now-rollT)/700;dice.forEach((d,j)=>{const bx=-.4+j*.8;if(t<1){const q=1-t;d.position.set(bx+Math.sin(now/70+j)*.25*q,.36+Math.abs(Math.sin(t*Math.PI*3))*1.1*q,.9+Math.cos(now/80+j)*.25*q);d.rotation.set(now/60*q+j,now/50*q,now/75*q)}
  else{d.position.set(bx,.36,.9);d.rotation.set(0,j?.3:-.25,0)}})}
function active(){return on&&!!S&&!!V&&V.game==='merida'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final')}
function loop(now){requestAnimationFrame(loop);const a=active();lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('m3on',a);
 if(!a){if(toks.length){toks.forEach(t=>t&&SC.remove(t));toks.length=0;dynKey='';rollN=-1}return}
 const b=root.getBoundingClientRect();if(Math.abs(b.width-W)>1||Math.abs(b.height-H)>1)layout();
 try{step(now)}catch(e){console.warn('Mérida 3D:',e);on=false;render();return}const asp=W/H,dist=17.5/Math.min(1,asp*1.05)/cam.z;
 CA.position.set(Math.sin(cam.yaw)*Math.cos(cam.pitch)*dist,Math.sin(cam.pitch)*dist,Math.cos(cam.yaw)*Math.cos(cam.pitch)*dist);CA.lookAt(0,0,0);R.render(SC,CA)}
function hud(){return `<div id="m3hud"><div class="m3top"><button class="mrbt" onclick="m3d.toggle()">🖼 Vista 2D</button><button class="mrbt" onclick="m3d.turn()" aria-label="Girar">⟲ Girar</button>
 <button class="mrbt" onclick="m3d.zoom(1.2)" aria-label="Acercar">＋</button><button class="mrbt" onclick="m3d.zoom(1/1.2)" aria-label="Alejar">－</button><button class="mrbt" onclick="mute=!mute;render()">${mute?'🔇':'🔊'}</button></div>${MR.panel({card:true})}</div>`}
GM.merida.body=function(){
 if(!active()){const G=V&&V.G;return (G?`<button class="b g sm2" onclick="m3d.toggle()">🎲 Vista 3D</button>`:'')+orig()}
 const h=document.getElementById('m3hud');if(h)hudScroll=h.scrollTop;
 try{init();return hud()}catch(e){console.warn('Mérida 3D:',e);on=false;return orig()}};
GM.merida.after=function(){if(origAfter)origAfter();if(!active())return;const h=document.getElementById('m3hud');if(h)h.scrollTop=hudScroll;
 try{layout();sync()}catch(e){console.warn('Mérida 3D:',e)}};
window.m3d={toggle:()=>{on=!on;try{localStorage.setItem('merida_3d',on?'1':'0')}catch(e){}render()},turn:()=>{cam.yaw+=Math.PI/2;sfx('tick')},zoom};
})();
