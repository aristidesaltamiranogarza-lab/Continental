// Haciendas de Yucatán 3D: modelos y texturas hechos con código (sin archivos). Los usa c_haciendas3d.js como window.H3M.
// Terrenos: henequén (agaves en surcos), maíz (milpa), piedra (rocas), miel (jobones mayas y flores), sal (salinas rosas) y cenote (agua turquesa).
// Piezas: sacbé, rancho (casa maya con techo de huano), hacienda (casa principal con arcos y chimenea), puertos con muelle, letrero y lancha, huracán.
(function(){
if(typeof THREE==='undefined'){console.warn('Haciendas 3D: falta Three.js');return}
const TX={},std=(c,r=.7,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r},o));
const cyl=(a,b,h,n=16)=>new THREE.CylinderGeometry(a,b,h,n),box=(a,b,c)=>new THREE.BoxGeometry(a,b,c);
function mesh(geo,m,x=0,y=0,z=0,sh=true){const s=new THREE.Mesh(geo,m);s.position.set(x,y,z);s.castShadow=sh;s.receiveShadow=true;return s}
// textura de canvas guardada por nombre
function ctex(k,w,h,draw,rep){if(TX[k])return TX[k];const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}return TX[k]=t}
const rnd=s=>()=>{s=(s*16807)%2147483647;return (s-1)/2147483646};
const speck=(g,w,h,n,cols,r0,r1,R)=>{for(let i=0;i<n;i++){g.fillStyle=cols[i%cols.length];g.beginPath();g.arc(R()*w,R()*h,r0+R()*(r1-r0),0,7);g.fill()}};
// ---- texturas de cada terreno (la cara de arriba del hexágono va de -1 a 1: repeat .5 y offset .5) ----
const TER=[
 (g,w,h,R)=>{g.fillStyle='#8c7a4e';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=22){g.fillStyle='#6f5f3a';g.fillRect(0,y,w,7);g.fillStyle='#a08d5c';g.fillRect(0,y+9,w,3)}speck(g,w,h,160,['#7d6a42','#9c8858'],1,3,R)},
 (g,w,h,R)=>{g.fillStyle='#6d5a34';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=18){g.fillStyle='#5a4a2a';g.fillRect(x,0,6,h)}speck(g,w,h,260,['#5c8a33','#7aa83f','#c9a83c'],1.5,4,R)},
 (g,w,h,R)=>{g.fillStyle='#8f8b82';g.fillRect(0,0,w,h);speck(g,w,h,300,['#7b776f','#a39f96','#6b675f','#b4b0a6'],2,9,R);g.strokeStyle='rgba(50,48,44,.45)';g.lineWidth=2;
  for(let i=0;i<14;i++){g.beginPath();let x=R()*w,y=R()*h;g.moveTo(x,y);for(let j=0;j<4;j++){x+=(R()-.5)*50;y+=(R()-.5)*50;g.lineTo(x,y)}g.stroke()}},
 (g,w,h,R)=>{g.fillStyle='#7a9a45';g.fillRect(0,0,w,h);speck(g,w,h,220,['#6b8a3a','#8fb052'],2,6,R);speck(g,w,h,120,['#f2c94c','#e86fa8','#b07cf0','#fff'],1.5,3.5,R)},
 (g,w,h,R)=>{g.fillStyle='#e9e3df';g.fillRect(0,0,w,h);const cs=['#f3b7c6','#eec2cf','#f6d5dc','#e9a8bb'];for(let y=0;y<h;y+=44)for(let x=0;x<w;x+=44){g.fillStyle=cs[(x/44+y/44*3)%4|0];g.fillRect(x+3,y+3,38,38)}
  speck(g,w,h,200,['#fff','#fbeef2'],1,2.5,R)},
 (g,w,h,R)=>{g.fillStyle='#6f6a5c';g.fillRect(0,0,w,h);speck(g,w,h,240,['#5d584b','#857f6f','#4f6b3a'],2,8,R)}];
function terTex(t){return ctex('ter'+t,256,256,(g,w,h)=>TER[t](g,w,h,rnd(31+t*7)))}
function seaTex(){return ctex('sea',256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#3aa7c4');gr.addColorStop(1,'#2a86a8');g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.strokeStyle='rgba(255,255,255,.28)';g.lineWidth=2;const R=rnd(5);for(let i=0;i<40;i++){const x=R()*w,y=R()*h;g.beginPath();g.arc(x,y,6+R()*8,3.6,5.8);g.stroke()}},true)}
// ficha con número y puntitos (6 y 8 en rojo)
function tokTex(n){return ctex('n'+n,128,128,(g,w,h)=>{g.fillStyle='#fbf3df';g.fillRect(0,0,w,h);const red=n==6||n==8;g.fillStyle=red?'#c62828':'#2a2a2a';
 g.font='800 60px system-ui,"Segoe UI",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(n,64,56);const p=6-Math.abs(7-n);for(let i=0;i<p;i++){g.beginPath();g.arc(64+(i-(p-1)/2)*11,98,4.2,0,7);g.fill()}})}
function signTex(txt,ico){return ctex('s'+txt+ico,128,96,(g,w,h)=>{g.fillStyle='#fbf3df';g.fillRect(0,0,w,h);g.strokeStyle='#7a5230';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);
 g.fillStyle='#4a3018';g.textAlign='center';g.textBaseline='middle';if(ico){g.font='40px system-ui';g.fillText(ico,64,36);g.font='800 26px system-ui';g.fillText(txt,64,74)}else{g.font='800 44px system-ui';g.fillText(txt,64,52)}})}
function label(txt){const t=ctex('l'+txt,256,64,(g,w,h)=>{g.font='800 34px system-ui,"Segoe UI",sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=8;g.strokeStyle='rgba(255,255,255,.85)';g.strokeText(txt,128,32);g.fillStyle='#164452';g.fillText(txt,128,32)});
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(.9,.225,1);return s}
function dieTex(v){const P={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]};
 return ctex('d'+v,128,128,(g,w,h)=>{g.fillStyle='#fffdf7';g.fillRect(0,0,w,h);g.fillStyle=v==1?'#c62828':'#1b1b1b';P[v].forEach(([x,y])=>{g.beginPath();g.arc(x*32,y*32,v==1?15:11,0,7);g.fill()})})}
// ---- hexágono con relieve (cara de arriba con textura, costados de tierra) ----
const HS=new THREE.Shape();for(let c=0;c<6;c++){const a=(60*c-30)*Math.PI/180,x=Math.cos(a)*.97,y=-Math.sin(a)*.97;c?HS.lineTo(x,y):HS.moveTo(x,y)}HS.closePath();
const GEO={};const hexGeo=h=>GEO['h'+h]||(GEO['h'+h]=(()=>{const g=new THREE.ExtrudeGeometry(HS,{depth:h,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:2});g.rotateX(-Math.PI/2);return g})());
const SIDE=std(0x6b4f33,.9),HT=[.26,.24,.32,.25,.2,.22];
function tile(t){const tx=terTex(t).clone();tx.needsUpdate=true;tx.repeat.set(.5,.5);tx.offset.set(.5,.5);const top=std(0xffffff,.85,{map:tx}),m=mesh(hexGeo(HT[t]),[top,SIDE],0,0,0,false);m.userData.top=top;m.userData.h=HT[t]+.03;return m}
function seaTile(){const tx=seaTex();return mesh(hexGeo(.1),[std(0xffffff,.25,{map:tx,metalness:.1}),std(0x2a6f8a,.5)],0,0,0,false)}
function token(n){const m=mesh(cyl(.3,.3,.05,36),[std(0xe9dcbc,.6),std(0xffffff,.55,{map:tokTex(n)}),std(0xe9dcbc,.6)]);m.rotation.y=Math.PI/2;return m}
// ---- adornos de cada terreno (en un anillo alrededor de la ficha) ----
const M={agave:std(0x5f9e8a,.75),stalk:std(0x5c8a33,.8),ear:std(0xe8c24a,.6),tassel:std(0xc9a45a,.8),rock:std(0x8d8a82,.95,{flatShading:true}),rock2:std(0xa7a49a,.95,{flatShading:true}),
 log:std(0x7a5230,.85),cap:std(0x4a3018,.85),flower:[std(0xf2c94c,.6),std(0xe86fa8,.6),std(0xb07cf0,.6)],salt:std(0xfdfcfb,.45),water:std(0x2fc4d4,.15,{metalness:.2,emissive:0x0b5560,emissiveIntensity:.5}),
 vine:std(0x3f7a35,.8),straw:std(0xc9a45a,.9),door:std(0x3a2414,.8),brick:std(0xa0522d,.85),arch:std(0x2a2a2a,.7),stone:std(0xe8e0cf,.8),wood:std(0x7a5230,.8),sail:std(0xfff8ea,.7,{side:THREE.DoubleSide})};
const G1={leaf:new THREE.ConeGeometry(.03,.3,5),stalk:cyl(.012,.018,.42,5),ear:new THREE.CapsuleGeometry(.025,.07,3,6),rock:new THREE.DodecahedronGeometry(1,0),log:cyl(.07,.07,.3,10),
 cap:cyl(.075,.075,.02,10),flower:new THREE.SphereGeometry(.025,6,4),salt:new THREE.ConeGeometry(.13,.16,10),vine:cyl(.008,.008,.25,4)};
function ring(n,r0,r1,R,f){for(let i=0;i<n;i++){const a=i/n*Math.PI*2+R()*.5,r=r0+R()*(r1-r0);f(Math.cos(a)*r,Math.sin(a)*r,R)}}
function deco(t,seed){const g=new THREE.Group(),R=rnd(seed*97+13),y=HT[t]+.03;
 if(t==0)ring(6,.5,.66,R,(x,z)=>{for(let j=0;j<9;j++){const a=j/9*Math.PI*2,l=mesh(G1.leaf,M.agave,x,y+.12,z);l.rotation.set(Math.cos(a)*.75,0,-Math.sin(a)*.75);g.add(l)}});
 if(t==1)ring(11,.45,.72,R,(x,z,R)=>{const s=.85+R()*.3;g.add(mesh(G1.stalk,M.stalk,x,y+.21*s,z));const e=mesh(G1.ear,M.ear,x+.025,y+.2*s,z);e.rotation.z=-.4;g.add(e);
  const ta=mesh(G1.leaf,M.tassel,x,y+.44*s,z);ta.scale.set(.6,.35,.6);g.add(ta)});
 if(t==2){ring(8,.45,.72,R,(x,z,R)=>{const s=.07+R()*.09,r=mesh(G1.rock,R()<.5?M.rock:M.rock2,x,y+s*.6,z);r.scale.set(s*1.2,s,s);r.rotation.set(R()*3,R()*3,0);g.add(r)});
  const hill=mesh(G1.rock,M.rock,-.2,y+.05,-.55);hill.scale.set(.32,.16,.22);g.add(hill)}
 if(t==3){ring(3,.5,.62,R,(x,z,R)=>{const L=mesh(G1.log,M.log,x,y+.11,z);L.rotation.set(0,R()*3,Math.PI/2);g.add(L);
  [-1,1].forEach(s=>{const c=mesh(G1.cap,M.cap,0,s*.155,0);L.add(c)});const st=mesh(box(.04,.06,.04),M.wood,x,y+.03,z);g.add(st)});
  ring(22,.4,.78,R,(x,z,R)=>g.add(mesh(G1.flower,M.flower[R()*3|0],x,y+.03,z,false)))}
 if(t==4)ring(5,.48,.7,R,(x,z,R)=>{const s=.7+R()*.5,c=mesh(G1.salt,M.salt,x,y+.08*s,z);c.scale.setScalar(s);g.add(c)});
 if(t==5){const w=mesh(new THREE.CircleGeometry(.62,40),M.water,0,y+.006,0,false);w.rotation.x=-Math.PI/2;g.add(w);g.userData.water=w;
  const rim=mesh(new THREE.TorusGeometry(.64,.07,8,40),M.rock,0,y+.01,0);rim.rotation.x=Math.PI/2;rim.scale.z=.6;g.add(rim);
  ring(10,.6,.66,R,(x,z,R)=>{const v=mesh(G1.vine,M.vine,x,y-.06,z,false);v.rotation.z=(R()-.5)*.3;g.add(v)})}
 return g}
// ---- piezas del color del jugador ----
function sacbe(c,len){const g=new THREE.Group();g.add(mesh(box(len,.09,.15),std(c,.5),0,.045,0));return g}
// banderita del color del jugador (se ve desde arriba)
function flag(c,x,y,z){const g=new THREE.Group();g.add(mesh(cyl(.008,.008,.22,5),M.wood,x,y+.11,z));const f=mesh(box(.12,.07,.01),std(c,.5),x+.06,y+.18,z);g.add(f);return g}
// rancho: casa maya ovalada con techo de huano y puerta
function rancho(c){const g=new THREE.Group(),m=std(c,.55),w=mesh(cyl(.15,.16,.2,18),m,0,.1,0);w.scale.x=1.4;g.add(w);
 const r=mesh(new THREE.ConeGeometry(.17,.2,18),M.straw,0,.3,0);r.scale.x=1.4;g.add(r);g.add(mesh(box(.07,.12,.02),M.door,0,.07,.155));
 g.add(flag(c,0,.38,0));return g}
// hacienda: casa principal con arcos, pretil, chimenea de ladrillo y escalinata
function hacienda(c){const g=new THREE.Group(),m=std(c,.55),W=.46,D=.26;
 g.add(mesh(box(W+.06,.03,D+.1),M.stone,0,.015,0));g.add(mesh(box(W,.18,D),m,0,.12,0));g.add(mesh(box(W+.02,.03,D+.02),M.stone,0,.225,0));
 for(let i=0;i<4;i++){const x=-W/2+.075+i*(W-.15)/3,a=mesh(box(.06,.1,.01),M.arch,x,.1,D/2+.004,false);g.add(a);const top=mesh(cyl(.03,.03,.01,10,1),M.arch,x,.15,D/2+.004,false);top.rotation.x=Math.PI/2;g.add(top)}
 g.add(mesh(box(.12,.1,.12),m,0,.28,-.02));const cr=mesh(new THREE.ConeGeometry(.09,.08,4),std(0x8a3b2a,.7),0,.37,-.02);cr.rotation.y=Math.PI/4;g.add(cr);
 g.add(mesh(cyl(.028,.04,.5,10),M.brick,W/2-.04,.25,-D/2+.03));g.add(flag(c,0,.4,-.02));g.add(mesh(box(.14,.02,.06),M.stone,0,.035,D/2+.06));return g}
// puerto: muelles desde la orilla, plataforma, letrero, lancha y nombre
function port(p,vs,px,pz,nx,nz){const g=new THREE.Group();
 vs.forEach(([x,z])=>{const dx=px-x,dz=pz-z,L=Math.hypot(dx,dz),b=mesh(box(L,.03,.07),M.wood,(x+px)/2,.15,(z+pz)/2);b.rotation.y=-Math.atan2(dz,dx);g.add(b)});
 g.add(mesh(cyl(.2,.22,.06,16),M.wood,px,.15,pz));g.add(mesh(cyl(.015,.015,.32,6),M.wood,px,.32,pz));
 const s=mesh(box(.34,.26,.02),[M.wood,M.wood,M.wood,M.wood,std(0xffffff,.7,{map:signTex(p.r<0?'3:1':'2:1',p.r<0?'':H3M.ICO[p.r])}),M.wood],px,.5,pz);s.userData.face=1;g.add(s);
 const bt=new THREE.Group(),hull=mesh(box(.3,.07,.12),std(0xd9e6ec,.6),0,0,0);hull.scale.set(1,1,1);bt.add(hull);bt.add(mesh(box(.32,.02,.13),std(0x2a6f8a,.6),0,.04,0));
 bt.add(mesh(cyl(.008,.008,.3,5),M.wood,0,.18,0));const sail=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,.05,0,0,.32,0,.15,.06,0],3)),M.sail);bt.add(sail);
 bt.position.set(px+nx*.42+nz*.18,.12,pz+nz*.42-nx*.18);bt.rotation.y=-Math.atan2(nz,nx)+Math.PI/2;g.add(bt);g.userData.boat=bt;
 const l=label(p.nm);l.position.set(px,.78,pz);g.add(l);return g}
// huracán: anillos de nubes que giran, embudo y basura que vuela
function hurricane(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xe8eef2,roughness:.9,transparent:true,opacity:.62,depthWrite:false}),R=[.5,.4,.31,.23,.16];
 R.forEach((r,i)=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,.06+i*.004,8,28),m);t.rotation.x=Math.PI/2;t.position.y=1.15-i*.2;t.userData.sp=1.5+i*.7;g.add(t)});
 const f=new THREE.Mesh(new THREE.CylinderGeometry(.48,.06,1.05,24,1,true),new THREE.MeshStandardMaterial({color:0xb9c6cf,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));f.position.y=.62;g.add(f);
 for(let i=0;i<10;i++){const d=new THREE.Mesh(box(.04,.02,.03),std([0x7a5230,0x5f9e8a,0xc9a45a][i%3],.8));d.userData.o={r:.25+Math.random()*.3,y:.3+Math.random()*.8,a:Math.random()*6,s:2+Math.random()*2};g.add(d)}
 g.userData.spin=now=>{g.children.forEach(c=>{if(c.userData.sp)c.rotation.z=now/1000*c.userData.sp;const o=c.userData.o;if(o){const a=o.a+now/1000*o.s;c.position.set(Math.cos(a)*o.r,o.y,Math.sin(a)*o.r);c.rotation.set(a,a*1.3,0)}});
  f.rotation.y=now/400;g.position.y=Math.sin(now/500)*.03};return g}
function dome(){const m=new THREE.Mesh(new THREE.SphereGeometry(.88,28,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xffd54a,transparent:true,opacity:.16,emissive:0xffb300,emissiveIntensity:.35,depthWrite:false,side:THREE.DoubleSide}));return m}
window.H3M={ICO:['🌿','🌽','🪨','🍯','🧂','💧'],HT,tile,seaTile,token,deco,sacbe,rancho,hacienda,port,hurricane,dome,dieTex,std,mesh,box,cyl}})();
