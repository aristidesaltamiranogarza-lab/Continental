// Casa de juegos 3D: la pantalla de inicio es una casa donde caminas con tu Mii y eliges a qué mesa entrar.
// Cada mesa es un juego (Continental, Uno, Monopoly Deal). Sentarte abre una ventanita para crear una sala o unirte con código;
// de ahí en adelante todo sigue igual (mk / joinR de game.js). Usa los Miis del Continental 3D. NO cambia el servidor.
(function(){
const K=window.C3D;
if(typeof THREE==='undefined'||typeof GM==='undefined'||!K){console.warn('Casa 3D: falta Three.js o los Miis del Continental 3D');return}
const origHome=home;
let on=true;try{on=localStorage.getItem('casa_3d')!=='0'}catch(e){}
let R,SC,CA,root,cv,ready=false,W=0,H=0,por=false,lastNow=0,me=null,meKey='',sel=null,closed=null,tgt=null,tgtG=null,stuck=0,moved=false,mark=null,zoom=1,cy=0,st=null,pin=null;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),keys=new Set(),tch=new Map(),hits=[],ray=new THREE.Raycaster(),P2=new THREE.Vector2(),FLOOR=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const touchy=matchMedia('(pointer:coarse)').matches,lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
let dark=lsGet('cont_dark')!=null?lsGet('cont_dark')=='1':matchMedia('(prefers-color-scheme:dark)').matches;
// la casa: paredes en x = ±HX, de z = ZB (fondo) a ZF (enfrente, donde está la puerta)
const HX=17,ZB=-15,ZF=11,TH=1.5;         // TH: altura de las mesas (la de los Miis sentados)
const TB=[{g:'continental',x:-8.5,z:-4,felt:['#2f9a62','#0f4a2d']},{g:'uno',x:0,z:-9,felt:['#c0393f','#5e1218']},{g:'monopolydeal',x:8.5,z:-4,felt:['#3d84cc','#123a68']}].filter(t=>GM[t.g]);
TB.forEach(t=>t.r=2.2);
const OB=[];                             // obstáculos redondos (sillas, muebles): {x,z,r}
const DESC={continental:'Rummy de 7 rondas con contratos de tríos y corridas. Tiene juegos escondidos en el cuarto.',
 uno:'Mismo color, número o símbolo; comodines y ¡UNO! Puedes jugar contra bots.',monopolydeal:'Junta 3 grupos de propiedades completos antes que los demás.'};

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
 buildHouse();mkMe();
 cv.addEventListener('pointerdown',pDown);cv.addEventListener('pointermove',pMove);cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',e=>{tch.delete(e.pointerId);pin=null;st=null});
 cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{if(!active())return;e.preventDefault();zoom=Math.max(.55,Math.min(1.7,zoom*Math.exp(e.deltaY*.0012)))},{passive:false});
 const typing=e=>/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'');
 addEventListener('keydown',e=>{if(!active()||typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);tgt=null;tgtG=null}
  else if(k=='q')cy-=.25;else if(k=='e')cy+=.25;else if(k=='escape'&&sel){closed=sel;sel=null;render()}});
 addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
 requestAnimationFrame(loop)}
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
 // ventana de noche al fondo
 const sky=ctex('sky',256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0a1230');gr.addColorStop(1,'#26407a');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#fff';for(let i=0;i<60;i++){g.globalAlpha=.3+(i%5)*.14;g.fillRect((i*71)%w,(i*37)%(h*.7),2,2)}g.globalAlpha=1;g.fillStyle='#f4f1d0';g.beginPath();g.arc(190,60,18,0,7);g.fill()});
 [-9,9].forEach(wx=>{const win=new THREE.Mesh(new THREE.PlaneGeometry(4.5,3.2),new THREE.MeshBasicMaterial({map:sky}));win.position.set(wx,5.4,ZB+.06);SC.add(win);
  const fr=std(0xe9e2d0,.5);box(4.8,.18,.3,fr,wx,7.1,ZB+.12);box(4.8,.25,.45,fr,wx,3.7,ZB+.2);box(.18,3.4,.3,fr,wx-2.33,5.4,ZB+.12);box(.18,3.4,.3,fr,wx+2.33,5.4,ZB+.12);box(.1,3.2,.2,fr,wx,5.4,ZB+.1)});
 // letrero de la casa en la pared del fondo
 const logo=ctex('logo',512,128,(g,w,h)=>{g.fillStyle='#2a1a10';rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle='#c9a24a';g.lineWidth=6;rr(g,10,10,w-20,h-20,14);g.stroke();
  g.font='bold 54px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f4d58a';g.fillText('🎴 Casa de juegos',w/2,h/2+3)});
 const lg=new THREE.Mesh(new THREE.PlaneGeometry(6,1.5),std(0xffffff,.6,{map:logo}));lg.position.set(0,6.6,ZB+.08);SC.add(lg);
 // sofá a la derecha, librero a la izquierda, plantas en las esquinas, puerta enfrente
 const sofa=std(0x2f4a5a,.85),sx=HX-1.4,sz=3;const so=new THREE.Group();so.position.set(sx,0,sz);so.rotation.y=-Math.PI/2;SC.add(so);
 box(5.4,.9,2,sofa,0,.75,0,so);box(5.4,1.7,.55,sofa,0,1.6,-.75,so);[-1,1].forEach(s=>box(.55,1.4,2,sofa,s*2.7,1.1,0,so));[-1.3,1.3].forEach(dx=>box(2.5,.35,1.6,std(0x37566a,.9),dx,1.35,.15,so));
 OB.push({x:sx,z:sz-1.8,r:1.4},{x:sx,z:sz,r:1.4},{x:sx,z:sz+1.8,r:1.4});
 const bw=std(0x4a2c18,.6),bx=-HX+.55,bz=4,BC=[0x8b1e1e,0x1e4f8b,0x2e6b3a,0xc9a24a,0x5a2a6b,0x2b2b2b,0xa85a1e,0xe0d6c0];let rs=7;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280;
 box(.9,7,.12,bw,bx,3.5,bz-1.6);box(.9,7,.12,bw,bx,3.5,bz+1.6);box(.1,7,3.3,bw,bx-.42,3.5,bz);
 for(let s=0;s<6;s++){const y=.1+s*1.38;box(.9,.1,3.3,bw,bx,y,bz);if(s==5)break;let z=bz-1.5;while(z<bz+1.4){const t=.12+rnd()*.14,hh=.75+rnd()*.45;box(.62,hh,t,std(BC[(rnd()*BC.length)|0],.7),bx+.05,y+.06+hh/2,z+t/2);z+=t+.02}}
 OB.push({x:bx+.5,z:bz-1,r:1.2},{x:bx+.5,z:bz+1,r:1.2});
 const lf=std(0x2e7d32,.8);[[-HX+1.3,ZB+1.3],[HX-1.3,ZB+1.3],[-HX+1.3,ZF-1.5]].forEach(([px,pz])=>{cyl(.5,.38,1,std(0xb5643c,.7),px,.5,pz);
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2,l=new THREE.Mesh(new THREE.ConeGeometry(.2,1.8,6),lf);l.position.set(px+Math.cos(a)*.28,1.8,pz+Math.sin(a)*.28);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);l.castShadow=true;SC.add(l)}OB.push({x:px,z:pz,r:.9})});
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
 // sillas alrededor
 for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4,cx=Math.cos(a)*(t.r+.9),cz=Math.sin(a)*(t.r+.9),ch=new THREE.Group();ch.position.set(cx,0,cz);ch.rotation.y=Math.atan2(-cx,-cz);G.add(ch);
  box(1,.12,1,wood,0,.9,0,ch);box(1,1.3,.12,wood,0,1.6,-.45,ch);[[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]].forEach(([x,z])=>cyl(.05,.05,.9,wood,x,.45,z,ch,8));
  OB.push({x:t.x+cx,z:t.z+cz,r:.6})}
 // luz cálida sobre la mesa (sin lámpara: desde arriba tapaba la vista)
 const lt=new THREE.PointLight(0xffd9a0,30,12,1.6);lt.position.y=5.9;G.add(lt);
 // aro de luz en el piso: se prende cuando te acercas
 const ring=new THREE.Mesh(new THREE.RingGeometry(t.r+1.4,t.r+1.7,64),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;G.add(ring);
 t.ring=ring;G.traverse(o=>{if(o.userData.hit)hits.push(o)})}

// ---------- tu Mii ----------
function myLook(){const n=(pname||'').trim()||'Tú';return [K.hsh(n)%10,K.hsh(n+'·')%K.AVP.length]}
function mkMe(){const [k,pi]=myLook(),key=k+':'+pi;if(me&&meKey===key)return;const old=me;meKey=key;
 const g=K.mkAvatar(k,pi,{stand:true});g.traverse(o=>{if(o.isMesh)o.castShadow=true});SC.add(g);
 const u=g.userData;u.pos=old?old.userData.pos:v3(0,0,3);u.yaw=old?old.userData.yaw:Math.PI;u.ph=0;u.w=0;g.position.copy(u.pos).setY(1.57);
 if(old){SC.remove(old);old.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()})}me=g}
const POLE=[v3(-1.2,-.4,-.7),v3(1.2,-.4,-.7)],tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
// pasos: piernas y brazos se mecen al caminar (w = qué tanto camina, ph = fase del paso)
function pose(now){const u=me.userData,w=u.w,ph=u.ph;
 u.body.position.y=Math.abs(Math.sin(ph))*.06*w+.012*Math.sin(now/650);u.body.rotation.x=.06*w;
 (u.legs||[]).forEach(L=>{const a=L.s*Math.sin(ph)*.55*w,b=a*.6-Math.max(0,L.s*Math.cos(ph))*.35*w,kn=tmp.set(L.hp.x+L.s*.01,L.hp.y-.48*Math.cos(a),L.hp.z+.48*Math.sin(a)),an=tmp2.set(kn.x,kn.y-.42*Math.cos(b),kn.z+.42*Math.sin(b));
  K.seg(L.up,L.hp,kn);K.seg(L.lo,kn,an);L.sh.position.set(an.x,an.y-.07,an.z+.08)});
 u.arms.forEach(a=>{const s=a.s,sw=-s*Math.sin(ph)*.38*w;a.h.set(s*.52,-.6+.08*Math.abs(sw),sw+.06);K.ik(a.sh,a.h,u.l1,u.l2,POLE[s>0?1:0].clone(),a.el);K.seg(a.up,a.sh,a.el);K.seg(a.fo,a.el,a.h);a.hand.position.copy(a.h)});
 u.head.rotation.y*=.9;u.head.rotation.x+=((sel?.25:.05)-u.head.rotation.x)*.1}
function solve(p){p.x=Math.max(-HX+1,Math.min(HX-1,p.x));p.z=Math.max(ZB+1.2,Math.min(ZF-1,p.z));
 TB.concat(OB).forEach(o=>{const r=(o.g?o.r+.45:o.r)+.35,dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz);if(d<r&&d>1e-4){p.x=o.x+dx/d*r;p.z=o.z+dz/d*r}})}
function walk(dt,now){const u=me.userData,p=u.pos,fw=v3(-Math.sin(cy),0,-Math.cos(cy)),rt=v3(Math.cos(cy),0,-Math.sin(cy)),dir=v3(0,0,0);
 if(keys.has('w')||keys.has('arrowup'))dir.add(fw);if(keys.has('s')||keys.has('arrowdown'))dir.sub(fw);if(keys.has('d')||keys.has('arrowright'))dir.add(rt);if(keys.has('a')||keys.has('arrowleft'))dir.sub(rt);
 if(!dir.lengthSq()&&tgt){dir.subVectors(tgt,p).setY(0);if(dir.length()<.12){dir.set(0,0,0);arrive()}}
 const sp=5.2*dt/1000;let mv=0;
 if(dir.lengthSq()){dir.normalize();const q=p.clone();p.addScaledVector(dir,sp);solve(p);mv=q.distanceTo(p);u.yaw=Math.atan2(dir.x,dir.z);if(!moved){moved=true;render()}
  // atorado contra una silla o mueble camino a una mesa: ya llegó
  if(tgt){stuck=mv<sp*.3?stuck+1:0;if(stuck>8)arrive()}}
 u.w+=((mv>.001?1:0)-u.w)*.15;u.ph+=mv*3.1;
 // mirar hacia la mesa al llegar
 const t=sel&&TB.find(x=>x.g===sel);if(t&&!mv)u.yaw=Math.atan2(t.x-p.x,t.z-p.z);
 let d=u.yaw-me.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));me.rotation.y+=d*.18;me.position.set(p.x,1.57,p.z);pose(now);
 // ¿cerca de una mesa? abre su ventanita (si la cerraste, hasta que te alejes)
 let near=null;TB.forEach(x=>{const dd=Math.hypot(p.x-x.x,p.z-x.z);x.near=dd<x.r+2.3;if(x.near&&!near)near=x.g;x.ring.material.opacity+=((x.near?.75:0)-x.ring.material.opacity)*.12});
 if(closed&&closed!==near)closed=null;const want=near&&near!==closed?near:null;if(want!==sel){sel=want;if(sel)sfx('tick');render()}}
function arrive(){tgt=null;stuck=0;if(tgtG){closed=null;tgtG=null}}
function goTable(g){const t=TB.find(x=>x.g===g);if(!t)return;const p=me.userData.pos,d=Math.hypot(p.x-t.x,p.z-t.z)||1;
 tgt=v3(t.x+(p.x-t.x)/d*(t.r+1.5),0,t.z+(p.z-t.z)/d*(t.r+1.5));tgtG=g;closed=null;stuck=0;showMark(tgt);sfx('card')}
function showMark(p){mark.position.set(p.x,.03,p.z);mark.material.opacity=.9;mark.scale.setScalar(1)}

// ---------- cámara (sigue a tu Mii desde atrás y arriba) ----------
const camP=v3(0,12,20),camT=v3(0,0,0);
function camStep(snap){const p=me.userData.pos,d=(por?28:19)*zoom,el=por?1.08:.9,ah=por?6:5;   // ah: mira un poco adelante de tu Mii
 // en celular parado, con la ventanita de la mesa abierta (abajo), la mesa y tu Mii se suben a la parte de arriba
 const t=por&&sel&&TB.find(x=>x.g===sel),c=t?v3((t.x+p.x)/2+Math.sin(cy)*6,0,(t.z+p.z)/2+Math.cos(cy)*6):null;
 const look=c?v3(c.x,1,c.z):v3(p.x-Math.sin(cy)*ah,1,p.z-Math.cos(cy)*ah),want=v3(look.x+Math.sin(cy)*Math.cos(el)*d,Math.sin(el)*d,look.z+Math.cos(cy)*Math.cos(el)*d);
 if(snap){camP.copy(want);camT.copy(look)}else{camP.lerp(want,.08);camT.lerp(look,.12)}CA.position.copy(camP);CA.lookAt(camT)}
function layout(){W=innerWidth;H=innerHeight;por=W/H<.95;R.setSize(W,H,false);CA.aspect=W/H;CA.fov=por?52:42;CA.updateProjectionMatrix()}
function toPx(p){const q=p.clone().project(CA);return [(q.x+1)/2*W,(1-q.y)/2*H,q.z<1]}

// ---------- tocar: piso = caminar ahí, mesa o letrero = ir a esa mesa; arrastrar = girar la cámara; pellizcar/rueda = zoom ----------
function pick(e){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 const h=ray.intersectObjects(hits,false);if(h.length)return h[0].object.userData.hit;const p=ray.ray.intersectPlane(FLOOR,v3(0,0,0));return p?{t:'floor',p}:null}
function pDown(e){if(!active())return;if(e.pointerType==='touch'){tch.set(e.pointerId,[e.clientX,e.clientY]);if(tch.size==2){const [a,b]=[...tch.values()];pin={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,z:zoom};st=null;return}}
 st={x:e.clientX,y:e.clientY,cy,pid:e.pointerId,drag:false};try{cv.setPointerCapture(e.pointerId)}catch(_){}}
function pMove(e){if(!active())return;if(tch.has(e.pointerId))tch.set(e.pointerId,[e.clientX,e.clientY]);
 if(pin&&tch.size>=2){const [a,b]=[...tch.values()];zoom=Math.max(.55,Math.min(1.7,pin.z*pin.d/(Math.hypot(a[0]-b[0],a[1]-b[1])||1)));return}
 if(!st){if(e.pointerType==='mouse'){const h=pick(e);cv.style.cursor=h&&h.t=='table'?'pointer':'default'}return}
 if(e.pointerId!==st.pid)return;if(!st.drag&&Math.hypot(e.clientX-st.x,e.clientY-st.y)>10)st.drag=true;if(st.drag)cy=st.cy-(e.clientX-st.x)*.006}
function pUp(e){if(tch.delete(e.pointerId)&&pin){if(tch.size<2)pin=null;st=null;return}if(!st||e.pointerId!==st.pid)return;const s=st;st=null;try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 if(s.drag)return;const h=pick(e);if(!h)return;
 if(h.t=='table')return goTable(h.g);
 tgt=h.p.setY(0);tgtG=null;solve(tgt);showMark(tgt)}

// ---------- capa de controles ----------
function hud(){const g=sel&&GM[sel];
 let o=`<div id="h3top" class="w7 w7g"><span class="h3t">🏠 <b>Casa de juegos</b></span><input id="h3name" placeholder="Tu nombre" maxlength="14" value="${esc(pname)}" oninput="pname=this.value;casaName()" aria-label="Tu nombre">
  ${typeof musCyc=='function'?`<button class="w7b" onclick="musCyc()" title="Música: ${musName()}" aria-label="Música">${musName()=='apagada'?'🔇':'🎵'}</button>`:''}<button class="w7b" onclick="casaToggle()" title="Pantalla de inicio clásica">2D</button></div>`;
 if(!moved)o+=`<div id="h3hint" class="w7 w7g">${touchy?'👆 Toca el piso para caminar · toca una mesa para jugar':'🖱 Clic en el piso para caminar (o W A S D) · clic en una mesa para jugar'}</div>`;
 TB.forEach(t=>{const G=GM[t.g];o+=`<div class="w7 w7g h3sign${t.g===sel?' on':''}" data-g="${t.g}" onclick="casaGo('${t.g}')">${G.emoji} <b>${G.name}</b><small>${t.g===sel?'aquí':'toca para jugar'}</small></div>`});
 o+=`<div class="w7 t3pl" id="h3me">${esc((pname||'').trim()||'Tú')}</div>`;
 if(msg&&!g)o+=`<div class="w7 t3msg">${esc(msg)}</div>`;
 // te invitaron con un enlace: unirte sin tener que caminar
 if(!g&&code&&code.length==5)o+=`<div id="h3inv" class="w7 w7g">Te invitaron a la sala <b>${esc(code)}</b><button class="w7b p" onclick="joinR()">Unirme</button></div>`;
 if(g)o+=`<div id="h3win" class="w7 w7win" role="dialog" aria-labelledby="h3wt"><div class="wt"><span id="h3wt">${g.emoji} ${g.name}</span><button class="wx" onclick="casaClose()" aria-label="Cerrar">✕</button></div>
  <div class="wb"><div class="h3d">${DESC[sel]||''} <span class="h3n">Hasta ${g.max} jugadores.</span></div>
  <div class="h3b"><button class="w7b dflt" onclick="casaPlay('listo')">▶ Crear sala y jugar</button><button class="w7b" onclick="casaPlay('host')" title="Creas la sala y la administras, sin jugar">👑 Solo administrar</button></div>
  <div class="h3j"><span>¿Ya tienes código?</span><input id="h3code" placeholder="Código" maxlength="5" value="${esc(code)}" oninput="code=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')joinR()" aria-label="Código de la sala"><button class="w7b" onclick="joinR()">Unirme</button></div>
  ${msg?`<div class="h3m">${esc(msg)}</div>`:''}</div></div>`;
 return o}
// letreros, nombre y avisos: siguen a la mesa / a tu Mii en la pantalla
function labels(){const tb=document.getElementById('h3top'),y0=tb?tb.getBoundingClientRect().bottom+4:0;
 document.querySelectorAll('#app .h3sign').forEach(el=>{const t=TB.find(x=>x.g===el.dataset.g);if(!t)return;const [x,y,vis]=toPx(v3(t.x,TH+2.5,t.z)),hw=el.offsetWidth/2+4;
  el.style.display=vis?'':'none';el.style.transform=`translate(${Math.max(hw,Math.min(W-hw,x))}px,${Math.max(y0+el.offsetHeight,y)}px) translate(-50%,-100%)`});   // nunca debajo de la barra de arriba
 const m=document.getElementById('h3me');if(m){const [x,y]=toPx(v3(me.userData.pos.x,3.5,me.userData.pos.z));m.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`}}

// ---------- engancharse a la pantalla de inicio ----------
function active(){return on&&!S}
function loop(now){requestAnimationFrame(loop);const a=active(),dt=Math.min(100,now-(lastNow||now));lastNow=now;
 if(root.style.display!==(a?'block':'none'))root.style.display=a?'block':'none';document.documentElement.classList.toggle('h3on',a);if(!a){keys.clear();return}
 document.documentElement.classList.toggle('c3dark',dark);
 if(innerWidth!==W||innerHeight!==H){layout();camStep(true)}
 walk(dt,now);camStep(false);mark.material.opacity*=.96;mark.scale.multiplyScalar(1.01);labels();R.render(SC,CA)}
home=function(){if(!active())return origHome()+(on?'':`<button class="b g" onclick="casaToggle()">🏠 Entrar a la casa 3D</button>`);
 try{init();return hud()}catch(e){console.warn('Casa 3D:',e);on=false;return origHome()}};
window.casaToggle=()=>{on=!on;try{localStorage.setItem('casa_3d',on?'1':'0')}catch(e){}render()};
window.casaGo=g=>{if(sel===g)return;goTable(g)};
window.casaClose=()=>{closed=sel;sel=null;sfx('tick');render()};
window.casaPlay=mode=>{if(!sel)return;pgame=sel;mk(mode)};
let nmT=null;window.casaName=()=>{clearTimeout(nmT);nmT=setTimeout(()=>{mkMe();const m=document.getElementById('h3me');if(m)m.textContent=(pname||'').trim()||'Tú'},350)};
})();
