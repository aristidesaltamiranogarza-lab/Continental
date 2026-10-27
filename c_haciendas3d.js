// Haciendas de Yucatán 3D: el tablero sobre una mesa de madera en el cuarto del Continental 3D (C3D.buildRoom), con la misma cámara que Mérida.
// Modelos en c_haciendas3dm.js (H3M). Lo maneja c_haciendasui.js como window.H3 (ok, show, layout, theme, sync, cam). Tocar un lugar iluminado llama HZU.tap.
// Cámara: 1 dedo gira e inclina; 2 dedos acercan, mueven y giran; ratón: arrastrar gira, clic derecho (o Shift) mueve, rueda acerca. Doble toque recentra.
(function(){
const D=window.HACD,M=window.H3M;if(typeof THREE==='undefined'||!D||!M){console.warn('Haciendas 3D: falta Three.js, haciendas_data.js o c_haciendas3dm.js');return}
const K3=window.C3D||null,TOPT=1.5,KMIN=.7,KMAX=4.5,RS=1.6;
let EL=.95,R,SC,CA,root,cv,ready=false,failed=false,shown=false,W=0,H=0,board,dyn,hits,theme='',raf=0,G0=null,LT={},room=null,tPrev=0,W0=0,skey='',dkey='',rn=-1,rollT=-1e9;
let S=1,CX=0,CZ=0,BX=6,BZ=6,fitD=30,fitV=30,fitTop=30,lastTap=0,lastXY=[0,0],pin=null,seaT=null;
const ins={t:0,r:0,b:0,l:0},dice=[],faces=[],ptr=new Map(),ray=new THREE.Raycaster(),P2=new THREE.Vector2(),tiles=[],anim=[],flash={},seen=new Set();
const VW={x:0,z:0,k:1,a:0,t:EL},VT={x:0,z:0,k:1,a:0,t:EL},VK=['x','z','k','a','t'],v3=(x,y,z)=>new THREE.Vector3(x,y,z),wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
const pc=k=>D.PCOL[k%D.PCOL.length];
const css=document.createElement('style');css.textContent=`#hz3root{position:fixed;inset:0;z-index:1;display:none;background:radial-gradient(ellipse at 50% 45%,#3a2c20 0%,#140e09 75%);touch-action:none;-webkit-user-select:none;user-select:none}
#hz3root canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}`;document.head.appendChild(css);
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true,alpha:true});const mob=matchMedia('(pointer:coarse)').matches;R.setPixelRatio(Math.min(devicePixelRatio||1,mob?1.5:2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(40,1,.1,400);
 LT.h=new THREE.HemisphereLight(0xfff4e0,0x3a2a1e,1.5);SC.add(LT.h);
 LT.d=new THREE.DirectionalLight(0xfff0d8,2.3);LT.d.position.set(-6,16,8);LT.d.castShadow=true;LT.d.shadow.mapSize.set(mob?1024:2048,mob?1024:2048);
 Object.assign(LT.d.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:50});LT.d.shadow.bias=-.0005;SC.add(LT.d);
 LT.s=new THREE.SpotLight(0xffd9a0,0,0,.62,.55,0);LT.s.position.set(0,15,0);LT.s.target.position.set(0,0,0);SC.add(LT.s,LT.s.target);
 // mesa (igual que la de Mérida)
 const wood=new THREE.MeshPhysicalMaterial({color:0x6e3b1b,roughness:.38,clearcoat:.7,clearcoatRoughness:.25}),dw=M.std(0x3a1e0c,.6);
 const rr=(w,r)=>{const s=new THREE.Shape(),h=w/2;s.moveTo(-h+r,-h);s.lineTo(h-r,-h);s.quadraticCurveTo(h,-h,h,-h+r);s.lineTo(h,h-r);s.quadraticCurveTo(h,h,h-r,h);s.lineTo(-h+r,h);s.quadraticCurveTo(-h,h,-h,h-r);s.lineTo(-h,-h+r);s.quadraticCurveTo(-h,-h,-h+r,-h);return s};
 const tg=new THREE.ExtrudeGeometry(rr(15.4,1.3),{depth:.38,bevelEnabled:true,bevelThickness:.1,bevelSize:.12,bevelSegments:4,curveSegments:10});tg.rotateX(-Math.PI/2);
 const tt=new THREE.Mesh(tg,wood);tt.position.y=-.1-.48;tt.receiveShadow=tt.castShadow=true;SC.add(tt);
 const FY=-1.55*RS,ap=new THREE.Mesh(M.box(13.6,.7,13.6),dw);ap.position.y=-.95;SC.add(ap);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const l=new THREE.Mesh(M.box(.9,-.6-FY,.9),dw);l.position.set(a*6.2,(-.6+FY)/2,b*6.2);l.castShadow=true;SC.add(l)});
 if(K3&&K3.buildRoom){try{room=K3.buildRoom(false,6.2,6.2);room.scale.setScalar(RS);SC.add(room);room.traverse(o=>{if(o.isLight)o.userData.i0=o.intensity})}catch(e){console.warn('Haciendas 3D: sin cuarto',e);room=null}}
 board=new THREE.Group();dyn=new THREE.Group();hits=new THREE.Group();SC.add(board,dyn,hits);
 for(let v=1;v<=6;v++)faces[v]=new THREE.MeshStandardMaterial({map:M.dieTex(v),roughness:.35});
 for(let j=0;j<2;j++){const d=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.42),[1,6,2,5,3,4].map(v=>faces[v]));d.castShadow=true;SC.add(d);dice.push(d)}
 root=document.createElement('div');root.id='hz3root';cv=R.domElement;root.appendChild(cv);document.body.appendChild(root);
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);if(ptr.size<2)pin=null});
 cv.addEventListener('contextmenu',e=>e.preventDefault());cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,VT.k*Math.exp(-e.deltaY*.0015))},{passive:false});
 addEventListener('keydown',e=>{if(!shown||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')||e.ctrlKey||e.metaKey||e.altKey)return;
  const f={arrowleft:()=>VT.a-=.2,arrowright:()=>VT.a+=.2,arrowup:()=>VT.t+=.08,arrowdown:()=>VT.t-=.08,'+':()=>VT.k*=1.2,'=':()=>VT.k*=1.2,'-':()=>VT.k/=1.2,home:home}[e.key.toLowerCase()];
  if(f){e.preventDefault();f();touched=true;clampV()}})}
let touched=false;
function applyTheme(t){if(t===theme||!ready)return;theme=t;const dk=t=='oscuro';
 LT.h.intensity=dk?.42:1.5;LT.d.intensity=dk?.45:2.3;LT.s.intensity=dk?2.6:0;root.style.background=dk?'radial-gradient(ellipse at 50% 45%,#1b1611 0%,#050403 75%)':'';
 if(room)room.traverse(o=>{if(o.isLight)o.intensity=o.userData.i0*(dk?.3:1)})}
// ---- tablero: se arma una vez por partida (terrenos, adornos, fichas, mar y puertos) ----
const hx=(g,i)=>[(g.H[i].x-CX),(g.H[i].y-CZ)],vx=(g,v)=>[(g.V[v].x-CX),(g.V[v].y-CZ)],vy=(G,g,v)=>Math.max(...g.V[v].h.map(h=>M.HT[G.hx[h].t]))+.03;
function statics(G,g){board.clear();tiles.length=0;const SQ=Math.sqrt(3),sea=new Map();
 CX=g.H.reduce((s,h)=>s+h.x,0)/g.H.length;CZ=g.H.reduce((s,h)=>s+h.y,0)/g.H.length;
 g.H.forEach(H=>D.DIR.forEach(([a,b])=>{const q=H.q+a,r=H.r+b,k=q+','+r;if(g.idx[k]==null&&!sea.has(k))sea.set(k,[SQ*(q+r/2)-CX,1.5*r-CZ])}));
 BX=0;BZ=0;sea.forEach(([x,z])=>{BX=Math.max(BX,Math.abs(x)+.87);BZ=Math.max(BZ,Math.abs(z)+1)});S=Math.min(1,6.3/Math.max(BX,BZ));board.scale.setScalar(S);dyn.scale.setScalar(S);hits.scale.setScalar(S);
 const base=M.mesh(M.box(BX*2+.3,.1,BZ*2+.3),M.std(0x3a2414,.7),0,-.05,0,false);board.add(base);
 sea.forEach(([x,z])=>{const s=M.seaTile();s.position.set(x,0,z);board.add(s)});seaT=board.children[1]&&board.children[1].material[0].map;
 G.hx.forEach((h,i)=>{const [x,z]=hx(g,i),t=M.tile(h.t);t.position.set(x,0,z);board.add(t);tiles[i]=t;const d=M.deco(h.t,i+1);d.position.set(x,0,z);board.add(d);t.userData.deco=d;
  if(h.n){const k=M.token(h.n);k.position.set(x,t.userData.h+.025,z);board.add(k);t.userData.tok=k}});
 G.ports.forEach(p=>{const E=g.E[p.e],a=60*p.k*Math.PI/180,nx=Math.cos(a),nz=Math.sin(a),mx=E.x-CX,mz=E.y-CZ;board.add(M.port(p,E.v.map(v=>vx(g,v)),mx+nx*.62,mz+nz*.62,nx,nz))});
 resize()}
// ---- piezas, huracán, protecciones y lugares iluminados (se rehace cuando algo cambia) ----
function dynamic(G,g,hl,now){dyn.clear();hits.clear();const fresh=new Set();
 const put=(o,key,x,y,z)=>{o.position.set(x,y,z);dyn.add(o);fresh.add(key);if(!seen.has(key)&&seen.size)anim.push({o,y,t0:now})};
 G.eo.forEach((o,e)=>{if(o<0)return;const [a,b]=g.E[e].v.map(v=>vx(g,v)),L=Math.hypot(b[0]-a[0],b[1]-a[1]),s=M.sacbe(pc(o),L*.7),y=Math.max(vy(G,g,g.E[e].v[0]),vy(G,g,g.E[e].v[1]));
  s.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);put(s,'e'+e+':'+o,(a[0]+b[0])/2,y-.02,(a[1]+b[1])/2)});
 G.vo.forEach((o,v)=>{if(o<0)return;const [x,z]=vx(g,v),p=G.vl[v]==2?M.hacienda(pc(o)):M.rancho(pc(o));put(p,'v'+v+':'+G.vl[v],x,vy(G,g,v),z)});
 const [hx0,hz0]=hx(g,G.hur),hu=M.hurricane();hu.position.set(hx0,M.HT[G.hx[G.hur].t]+.03,hz0);dyn.add(hu);dyn.userData.hur=hu;
 (G.prot||[]).forEach(p=>{const [x,z]=hx(g,p.h),d=M.dome();d.position.set(x,M.HT[G.hx[p.h].t]+.03,z);dyn.add(d)});
 const GL=new THREE.MeshBasicMaterial({color:0xffc107,transparent:true,opacity:.75,depthWrite:false}),inv=new THREE.MeshBasicMaterial({visible:false}),hit=(geo,k,id,x,y,z)=>{const m=new THREE.Mesh(geo,inv);m.position.set(x,y,z);m.userData={k,id};hits.add(m);return m};
 (hl.h||[]).forEach(i=>{const [x,z]=hx(g,i),y=M.HT[G.hx[i].t]+.06,c=new THREE.Mesh(new THREE.CylinderGeometry(.92,.92,.02,6),new THREE.MeshBasicMaterial({color:0xffc107,transparent:true,opacity:.28,depthWrite:false}));
  c.position.set(x,y,z);c.rotation.y=Math.PI/6;c.userData.pulse=.3;dyn.add(c);const r=new THREE.Mesh(new THREE.TorusGeometry(.86,.035,6,6),GL);r.rotation.set(Math.PI/2,0,Math.PI/6);r.position.set(x,y+.01,z);r.userData.pulse=.8;dyn.add(r);
  hit(new THREE.CylinderGeometry(.9,.9,.5,6),'h',i,x,y,z)});
 (hl.e||[]).forEach(e=>{const [a,b]=g.E[e].v.map(v=>vx(g,v)),L=Math.hypot(b[0]-a[0],b[1]-a[1]),y=Math.max(vy(G,g,g.E[e].v[0]),vy(G,g,g.E[e].v[1]))+.03,ang=-Math.atan2(b[1]-a[1],b[0]-a[0]),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;
  const m=new THREE.Mesh(M.box(L*.62,.06,.12),GL);m.position.set(mx,y,mz);m.rotation.y=ang;m.userData.pulse=.8;dyn.add(m);const h=hit(M.box(L*.7,.3,.36),'e',e,mx,y,mz);h.rotation.y=ang});
 (hl.v||[]).forEach(v=>{const [x,z]=vx(g,v),y=vy(G,g,v)+.04,bm=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.7,10),new THREE.MeshBasicMaterial({color:0xffd54a,transparent:true,opacity:.5,depthWrite:false}));
  bm.position.set(x,y+.35,z);bm.userData.pulse=.55;dyn.add(bm);const r=new THREE.Mesh(new THREE.TorusGeometry(.2,.045,8,24),GL);r.rotation.x=Math.PI/2;r.position.set(x,y,z);r.userData.pulse=.8;dyn.add(r);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.03,16),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85}));c.position.set(x,y,z);c.userData.pulse=.9;dyn.add(c);hit(new THREE.CylinderGeometry(.28,.28,.8,8),'v',v,x,y+.3,z)});
 seen.clear();fresh.forEach(k=>seen.add(k));if(!seen.size)seen.add('-')}
function sync(G,hl){if(!ready)return;G0=G;const g=D.geo(G.bn),k=G.bn+':'+G.hx.map(h=>h.t+'.'+h.n).join(',');if(k!==skey){skey=k;seen.clear();statics(G,g);dkey=''}
 const dk=JSON.stringify([G.eo,G.vo,G.vl,G.hur,G.prot,hl]);if(dk!==dkey){dkey=dk;dynamic(G,g,hl||{},performance.now())}
 if(G.rn!==rn){if(rn>=0&&G.dice[0]){rollT=performance.now();setDice(G.dice);const s=G.dice[0]+G.dice[1];if(s!==7)G.hx.forEach((h,i)=>{if(h.n===s&&i!==G.hur)flash[i]=performance.now()+400})}else setDice(G.dice[0]?G.dice:[5,2]);rn=G.rn}}
function setDice(v){dice.forEach((d,j)=>{const n=v[j]||1,m=d.material;m[2]=faces[n];m[3]=faces[7-n];const o=[1,2,3,4,5,6].filter(x=>x!==n&&x!==7-n);m[0]=faces[o[0]];m[1]=faces[7-o[0]];m[4]=faces[o[1]];m[5]=faces[7-o[1]]})}
// ---- cámara: VT = adónde va, VW = dónde está (x,z punto al centro, k zoom, a giro, t inclinación) ----
function camPos(V0,d){const e=V0.t;CA.position.set(V0.x+Math.sin(V0.a)*Math.cos(e)*d,Math.sin(e)*d,V0.z+Math.cos(V0.a)*Math.cos(e)*d);CA.lookAt(V0.x,0,V0.z);CA.updateMatrixWorld()}
const applyCam=()=>camPos(VW,fitV/VW.k);
function clampV(){VT.k=Math.max(KMIN,Math.min(KMAX,VT.k));VT.t=Math.max(.35,Math.min(TOPT,VT.t));VT.x=Math.max(-7,Math.min(7,VT.x));VT.z=Math.max(-7,Math.min(7,VT.z))}
function snap(){clampV();VK.forEach(q=>VW[q]=VT[q]);applyCam()}
function home(){VW.a=wrapA(VW.a);Object.assign(VT,{x:0,z:0,k:1,a:0,t:EL})}
function fitFor(t){const bx=BX*S+.1,bz=BZ*S+.1,C=[[-bx,0,-bz],[bx,0,-bz],[-bx,0,bz],[bx,0,bz],[-bx,.7,-bz],[bx,.7,-bz],[-bx,.7,bz],[bx,.7,bz]].map(p=>v3(...p));
 const x0=ins.l/W*2-1,x1=1-ins.r/W*2,y0=-1+ins.b/H*2,y1=1-ins.t/H*2,mx=(x1-x0)*.02,my=(y1-y0)*.02,q=v3(0,0,0);let lo=4,hi=200;
 for(let it=0;it<22;it++){const d=(lo+hi)/2;camPos({x:0,z:0,a:0,t},d);let ok=true;for(const c of C){q.copy(c).project(CA);if(q.x<x0+mx||q.x>x1-mx||q.y<y0+my||q.y>y1-my){ok=false;break}}if(ok)hi=d;else lo=d}
 return hi}
function resize(){if(!ready||!root)return;const b=root.getBoundingClientRect();W=Math.max(1,b.width);H=Math.max(1,b.height);R.setSize(W,H,false);
 const sx=(ins.l-ins.r)/2,sy=(ins.t-ins.b)/2,Wf=W+2*Math.abs(sx),Hf=H+2*Math.abs(sy);CA.aspect=Wf/Hf;CA.setViewOffset(Wf,Hf,Math.abs(sx)-sx,Math.abs(sy)-sy,W,H);CA.updateProjectionMatrix();
 const el=W-ins.l-ins.r<H-ins.t-ins.b?1.12:.95;if(el!==EL){if(Math.abs(VT.t-EL)<.01)VT.t=VW.t=el;EL=el}
 const f=fitFor(EL);fitTop=fitFor(TOPT);fitD=f;if(!W0){fitV=f;W0=1}if(VT.t>TOPT-.02)VT.k=Math.max(VT.k,f/fitTop);applyCam()}
// ---- dedos y ratón ----
function ground(px,py){const r=cv.getBoundingClientRect();P2.set((px-r.left)/r.width*2-1,-(py-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);return ray.ray.intersectPlane(new THREE.Plane(v3(0,1,0),0),v3(0,0,0))}
function zoomAt(px,py,k){const p=ground(px,py);k=Math.max(KMIN,Math.min(KMAX,k));if(p){const f=VT.k/k;VT.x=p.x-(p.x-VT.x)*f;VT.z=p.z-(p.z-VT.z)*f}VT.k=k;touched=true;clampV()}
function pDown(e){if(!shown)return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,mv:false,pan:e.pointerType=='mouse'&&(e.button==2||e.shiftKey||e.button==1)});try{cv.setPointerCapture(e.pointerId)}catch(_){}
 touched=true;if(ptr.size==2){VK.forEach(q=>VT[q]=VW[q]);const [a,b]=[...ptr.values()];pin={d:Math.hypot(a.x-b.x,a.y-b.y)||1,k:VT.k,ang:Math.atan2(b.y-a.y,b.x-a.x),acc:0,rot:false,g:ground((a.x+b.x)/2,(a.y+b.y)/2)}}}
function pMove(e){const p=ptr.get(e.pointerId);if(!p)return;const ox=p.x,oy=p.y;p.x=e.clientX;p.y=e.clientY;if(Math.hypot(p.x-p.x0,p.y-p.y0)>7)p.mv=true;
 if(ptr.size>=2&&pin){const [a,b]=[...ptr.values()],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,ang=Math.atan2(b.y-a.y,b.x-a.x);let da=wrapA(ang-pin.ang);pin.ang=ang;
  pin.acc+=da;if(!pin.rot&&Math.abs(pin.acc)>.14){pin.rot=true;da=pin.acc}if(pin.rot)VT.a+=da;
  VT.k=pin.k*(Math.hypot(a.x-b.x,a.y-b.y)||1)/pin.d;snap();const g=ground(mx,my);if(g&&pin.g){VT.x+=pin.g.x-g.x;VT.z+=pin.g.z-g.z;snap()}return}
 if(!p.mv||ptr.size!=1)return;
 if(p.pan){const g0=ground(ox,oy),g1=ground(p.x,p.y);if(g0&&g1){VT.x+=g0.x-g1.x;VT.z+=g0.z-g1.z;snap()}return}
 VT.a-=(p.x-ox)*.008;VT.t+=(p.y-oy)*.006;snap()}
function pUp(e){const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(ptr.size<2)pin=null;if(!p||p.mv||ptr.size||(e.pointerType=='mouse'&&e.button!==0))return;
 const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(hits.children,false)[0];if(h&&window.HZU){HZU.tap(h.object.userData.k,h.object.userData.id);return}
 const now=performance.now();if(now-lastTap<320&&Math.hypot(e.clientX-lastXY[0],e.clientY-lastXY[1])<40){home();lastTap=0}else{lastTap=now;lastXY=[e.clientX,e.clientY]}}
// ---- cada cuadro: huracán, agua, lanchas, resaltes, piezas que caen, terrenos que brillan, dados y cámara suave ----
function step(now,dt){const hu=dyn.userData.hur;if(hu&&hu.parent)hu.userData.spin(now);if(seaT)seaT.offset.set(now/60000%1,now/90000%1);
 const pl=.78+Math.sin(now/260)*.22;dyn.children.forEach(o=>{const p=o.userData.pulse;if(p){o.material.opacity=p*pl;o.scale.setScalar(1+Math.sin(now/260)*.05)}});
 board.children.forEach(o=>{const b=o.userData.boat;if(b){b.position.y=.12+Math.sin(now/600+b.position.x)*.025;b.rotation.z=Math.sin(now/800+b.position.z)*.06}});
 for(let i=anim.length-1;i>=0;i--){const a=anim[i],t=Math.min(1,(now-a.t0)/420),e=1-Math.pow(1-t,3);a.o.position.y=a.y+(1-e)*.9;a.o.scale.setScalar(.5+.5*e);if(t>=1)anim.splice(i,1)}
 tiles.forEach((t,i)=>{const f=flash[i];if(!f)return;const u=(now-f)/1400;const m=t.userData.top;if(u<0)return;if(u>=1){m.emissive.setHex(0);m.emissiveIntensity=0;delete flash[i];return}m.emissive.setHex(0xfff2a0);m.emissiveIntensity=Math.sin(u*Math.PI)*.55});
 const t=(now-rollT)/900,bx=BX*S+.75,bz=BZ*S*.45;dice.forEach((d,j)=>{const x0=bx+(j?.2:-.2),z0=bz+(j?-.3:.3);
  if(t<1){const q=1-t;d.position.set(x0-1.6*q*q+Math.sin(now/70+j)*.15*q,.11+Math.abs(Math.sin(t*Math.PI*2.5))*1.1*q,z0-1.4*q*q);d.rotation.set(now/60*q+j,now/50*q,now/75*q)}
  else{d.position.set(x0,.11,z0);d.rotation.set(0,j?.35:-.2,0)}});
 const f=1-Math.exp(-dt/110);VK.forEach(q=>{const dd=VT[q]-VW[q];VW[q]=Math.abs(dd)>1e-4?VW[q]+dd*f:VT[q]});fitV+=Math.abs(fitD-fitV)>.01?(fitD-fitV)*f:fitD-fitV}
function loop(now){raf=0;if(!shown)return;raf=requestAnimationFrame(loop);const dt=Math.min(100,now-(tPrev||now));tPrev=now;
 const b=root.getBoundingClientRect();if(Math.abs(b.width-W)>1||Math.abs(b.height-H)>1)resize();
 try{step(now,dt);applyCam();R.render(SC,CA)}catch(e){console.warn('Haciendas 3D:',e);H3.fail();if(typeof render=='function')render()}}
window.H3={ok:()=>!failed,
 fail(){failed=true;this.show(false)},
 show(on){if(on&&!failed){try{init()}catch(e){failed=true;console.warn('Haciendas 3D: no se pudo iniciar',e);throw e}}if(!ready||shown===on)return;shown=on;root.style.display=on?'block':'none';
  if(on){tPrev=0;if(!raf)raf=requestAnimationFrame(loop)}else{skey='';dkey='';rn=-1;G0=null}},
 layout(i){const ch=i.t!==ins.t||i.b!==ins.b||i.r!==ins.r||i.l!==ins.l;Object.assign(ins,i);if(ch||!W)resize()},
 theme:t=>applyTheme(t),sync:(G,hl)=>sync(G,hl),
 cam(c){touched=true;if(c=='home')home();else if(c=='top'){VT.a=Math.round(VT.a/(Math.PI/2))*(Math.PI/2);Object.assign(VT,{x:0,z:0,t:TOPT,k:fitD/fitTop})}
  else if(c=='rr')VT.a+=Math.PI/3;else if(c=='zi')VT.k*=1.3;else if(c=='zo')VT.k/=1.3;clampV()}};
})();
