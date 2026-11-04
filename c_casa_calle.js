// c_casa_calle.js — CCALLE: la calle (Bloque D, fase D4). c_casa_pb.js lo llama al armar la planta baja (CCALLE.build(kit)).
// La fachada es parte de la planta baja y entra al corte de paredes: muro ocre con zócalo, pilastras, cornisa, pretil con copete y
// letrero, portón abierto con jambas de piedra, dos ventanas altas con reja voladiza hasta el piso, faroles y el número.
// Lo demás cuelga del exterior compartido (CIELO.mundo), así también se ve por las ventanas de los otros pisos: banqueta (se camina
// hasta su orilla; el arroyo no), calle con tope y registros, postes con cables, laurel encalado, un vocho estacionado y los vecinos:
// fachadas meridanas contiguas de colores con relieve, azoteas con tinaco, una cuadra de cada lado con su esquina, y la calle se
// pierde en la neblina. De noche se prenden el poste, los faroles y algunas ventanas; lo de la casa se oscurece (CCALLE.tinte).
// CCALLE.fondo(R,cámara,SC,piso): en la planta baja (y en la alta y la terraza) el exterior se dibuja primero y la casa encima (comparten la profundidad); si un bloque
// de vecinos (o lo de atrás de la barda, CCALLE.zona) queda entre la cámara y tu Mii, ese cuadro no se dibuja.
(function(){
if(typeof THREE==='undefined')return;
const FZ=19.3,ZB=23.3,ZA=33.3,ZE=37.3,YA=-.35,CR=0xefe6d2,PI=0xd9ccb2,HI=0x1c1c1e,LAU=[-14,22.4],POS=[13.8,22.85];
let EXT=null,REG=false,rs=11;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280,pick=a=>a[(rnd()*a.length)|0];
const dk=(c,k)=>new THREE.Color(c).multiplyScalar(k||.72).getHex();
const ZON=[],TIN=[],VID=[],LUZ=[],NOC=new THREE.Color(0x6c7898),DIA=new THREE.Color(0xffffff);

// ---------- de día o de noche (sigue a CIELO) ----------
function tema(){const n=!!(window.CIELO&&CIELO.noche&&CIELO.noche());
 TIN.forEach(o=>o.m.color.copy(o.c).multiply(n?NOC:DIA));
 VID.forEach(v=>{v.a.array.set(n?v.noc:v.dia);v.a.needsUpdate=true});
 LUZ.forEach(l=>l.L.intensity=n?l.i:0)}
// material de la casa que da a la calle o al patio: de noche se oscurece (las luces de la casa no siguen el tema)
const tinte=m=>{TIN.push({m,c:m.color.clone()});return m};
// vidrios (malla de LOTE con MeshBasic): el color de noche viene en los vértices (prendido u oscuro); de día todos son del color "dia"
function vidrio(M,dia){const a=M.geometry.attributes.color,noc=a.array.slice(),d=new Float32Array(noc.length),c=new THREE.Color(dia==null?0x34404c:dia);
 for(let i=0;i<d.length;i+=3){d[i]=c.r;d[i+1]=c.g;d[i+2]=c.b}VID.push({a,noc,dia:d});return M}
const luz=(L,i)=>{LUZ.push({L,i});L.intensity=0;return L};
// grupo hijo de una cara de muro (c_casa_pb.js) cuyas piezas usan coordenadas del mundo: se esconde junto con la cara
const enMundo=g=>{const Q=new THREE.Group();g.updateMatrix();Q.applyMatrix4(g.matrix.clone().invert());g.add(Q);return Q};

// ---------- lo que se esconde si tapa a tu Mii: b=[x0,x1,y0,y1,z0,z1] ----------
function zona(o,b){ZON.push({o,b})}
function cruza(a,t,b){let t0=0,t1=1;for(let k=0;k<3;k++){const ax='xyz'[k],o=a[ax],d=t[ax]-o,lo=b[k*2],hi=b[k*2+1];
  if(Math.abs(d)<1e-6){if(o<lo||o>hi)return false;continue}let u=(lo-o)/d,v=(hi-o)/d;if(u>v){const w=u;u=v;v=w}
  t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return false}return true}
const cP=new THREE.Vector3(),tA=new THREE.Vector3();
function fondo(R,cam,SC,p){if(!EXT||!window.CIELO||!CIELO.fondo)return false;if(SC.background)SC.background=null;p=p||'pb';const y0=(CIELO.ALT&&CIELO.ALT[p])||0;
 cam.getWorldPosition(cP);const H3=window.CASA3D,av=H3&&H3.yo&&H3.yo();if(av)tA.set(av.x,1.6,av.z);else cam.getWorldDirection(tA).multiplyScalar(14).add(cP);
 cP.y+=y0;tA.y+=y0;   // las zonas van en coordenadas de la casa (planta baja en 0)
 const lj=CIELO.lejos||[],fuera=cP.z<-42.4||cP.z>ZE;
 for(const z of ZON)if(cruza(cP,tA,z.b))z.o.forEach(o=>o.visible=false);if(fuera)lj.forEach(o=>o.visible=false);
 CIELO.fondo(R,cam,p);
 for(const z of ZON)z.o.forEach(o=>o.visible=true);lj.forEach(o=>o.visible=true);return true}

// ---------- armado (cada vez que se arma la planta baja; lo de afuera solo una vez) ----------
function build(k){if(!window.LOTE)return;const {OB,std,PB,cal,tabique,suelo,B,MS}=k;
 // el muro del frente: cara del zaguán y cara de la calle, con el hueco del portón
 const F={m:tinte(std(0xffffff,.92,{map:cal('fach','#e2a73c')})),lam:tinte(std(0xa8742c,.9)),lamH:1.1,rod:tinte(std(0xf2ead8,.8))};
 const {fb}=tabique('x',FZ-.15,-1,[[-4.5,4.5,MS.zag]],[[-17.3,17.3,F]],[{at:0,w:3.6,h:5.4}]);
 fachada(enMundo(fb[0].g),k);
 // cuartos del frente (no se entra; desde arriba se ve su piso) y el umbral del portón
 const fr=cal('frente','#b9ad98');suelo(-17,-4.5,11.15,19.15,fr);suelo(4.5,17,11.15,19.15,fr);
 B(3.6,.02,.42,std(0x8a8077,.85),0,.012,FZ-.15).castShadow=false;
 // choques: rejas de las ventanas, laurel y poste; se camina hasta la orilla de la banqueta
 [-10.6,10.6].forEach(x=>OB.push({x:x-.7,z:FZ+.45,r:.95},{x:x+.7,z:FZ+.45,r:.95}));
 OB.push({x:LAU[0],z:LAU[1],r:1.05},{x:POS[0],z:POS[1],r:.3});
 PB.bx[3]=ZB-.6;PB.cb[3]=ZB+.5;
 if(!EXT&&window.CIELO)EXT=calle(k);
 if(!REG&&window.CIELO&&CIELO.on){REG=true;CIELO.on(tema)}tema()}

// ---------- la fachada (en la planta baja, dentro de la cara de la calle) ----------
function fachada(Q,k){const {std,ctex}=k,L=LOTE(),V=LOTE(),VL=LOTE(),b=(w,h,d,c,x,y,z,ry,rx,rz)=>L.box(w,h,d,c,x,y,FZ+z,ry,rx,rz),OC=0xe2a73c;
 // pilastras con basa y capitel
 [-16.95,-3.3,3.3,16.95].forEach(x=>{b(.86,1.2,.26,0xb9ad96,x,.6,.13);b(.7,7.1,.16,CR,x,4.75,.08);b(.86,.3,.24,CR,x,8.45,.12)});
 // cornisa, pretil con remate y el copete sobre el portón con sus remates de bola
 b(34.6,.22,.3,CR,0,8.71,.15);b(34.8,.4,.5,CR,0,9.02,.25);
 L.box(34.6,1.3,.3,OC,0,9.87,FZ-.15);L.box(34.9,.18,.5,CR,0,10.61,FZ-.1);
 L.box(7.6,1.1,.3,OC,0,11.25,FZ-.15);L.box(7.9,.18,.5,CR,0,11.89,FZ-.1);L.box(3.4,.8,.3,OC,0,12.38,FZ-.15);L.box(3.7,.16,.46,CR,0,12.86,FZ-.1);
 [-3.75,3.75].forEach(x=>L.bola(.22,1,1,1,CR,x,12.2,FZ-.1));[-1.7,1.7].forEach(x=>L.bola(.18,1,1,1,CR,x,13.1,FZ-.1));
 // portón: jambas y dintel de piedra con su clave
 [-1,1].forEach(s=>b(.42,5.6,.18,PI,s*2.01,2.8,.09));b(4.86,.55,.2,PI,0,5.675,.1);b(.55,.78,.26,PI,0,5.7,.13);b(5.2,.14,.32,CR,0,6.02,.16);
 // faroles en las pilastras del portón
 [-3.3,3.3].forEach(x=>{b(.08,.08,.6,HI,x,6.95,.38);b(.5,.08,.5,HI,x,6.98,.7);b(.42,.07,.42,HI,x,6.18,.7);L.cyl(.02,.13,.2,HI,x,7.12,FZ+.7,6);
  [[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]].forEach(([a,c])=>b(.035,.78,.035,HI,x+a,6.58,.7+c));VL.box(.36,.72,.36,0xffd08a,x,6.58,FZ+.7)});
 // ventanas altas: postigos verdes abajo, vidrio arriba (de noche con luz), marco de cantera y reja voladiza hasta el piso
 [-10.6,10.6].forEach(x=>{const w=2.4,y0=.7,h=6.3,yc=y0+h/2,VE=0x2f6b4a,VO=0x245a3d;
  b(w,h,.02,0x14100c,x,yc,.01);
  [-1,1].forEach(s=>{b(1.17,4.45,.06,VE,x+s*.6,2.975,.04);[1.5,2.95,4.4].forEach(y=>b(.82,1.15,.03,VO,x+s*.6,y,.085))});
  V.box(2.3,1.62,.02,0xffc46a,x,6.12,FZ+.03);b(.06,1.7,.05,VE,x,6.12,.05);b(2.4,.08,.06,VE,x,5.27,.05);
  [-1,1].forEach(s=>b(.32,6.6,.14,CR,x+s*1.36,yc,.07));b(3.1,.4,.16,CR,x,7.2,.08);b(3.4,.14,.36,CR,x,7.47,.18);b(3.2,.18,.75,PI,x,.52,.375);
  for(let i=0;i<13;i++)b(.045,6.55,.045,HI,x-1.32+i*.22,3.885,.64);
  [.66,1.4,5.6,6.4,7.14].forEach(y=>{b(2.72,.05,.05,HI,x,y,.64);[-1,1].forEach(s=>b(.05,.05,.62,HI,x+s*1.34,y,.33))});
  [-1,1].forEach(s=>b(.045,6.55,.045,HI,x+s*1.34,3.885,.33));
  for(let j=0;j<5;j++)L.geo(new THREE.TorusGeometry(.17,.02,4,12),HI,x-.88+j*.44,6,FZ+.64)});
 // número de talavera y el letrero pintado en el copete
 const num=ctex('numero-casa',128,96,(g,w,h)=>{g.fillStyle='#f7f3ea';g.fillRect(0,0,w,h);g.strokeStyle='#1f4f9a';g.lineWidth=8;g.strokeRect(6,6,w-12,h-12);g.fillStyle='#1f4f9a';
  [[16,16],[w-16,16],[16,h-16],[w-16,h-16]].forEach(([a,c])=>{g.beginPath();g.arc(a,c,6,0,7);g.fill()});g.font='bold 44px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('512',w/2,h/2+3)});
 const pn=new THREE.Mesh(new THREE.PlaneGeometry(.62,.46),tinte(std(0xffffff,.35,{map:num})));pn.position.set(3.3,4.3,FZ+.17);Q.add(pn);
 const rot=ctex('rotulo-casa',512,64,(g,w,h)=>{g.font='bold 40px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(90,40,10,.5)';
  g.strokeText('CASA DE JUEGOS',w/2,h/2+2);g.fillStyle='#f7efdc';g.fillText('CASA DE JUEGOS',w/2,h/2+2)});
 const pr=new THREE.Mesh(new THREE.PlaneGeometry(6.6,.82),tinte(std(0xffffff,.8,{map:rot,transparent:true})));pr.position.set(0,11.25,FZ+.01);Q.add(pr);
 const M=L.mesh(tinte(new THREE.MeshStandardMaterial({roughness:.85})));M.castShadow=M.receiveShadow=true;
 Q.add(M,vidrio(V.mesh(new THREE.MeshBasicMaterial()),0x2c3640),vidrio(VL.mesh(new THREE.MeshBasicMaterial()),0xd8d2c0))}

// ---------- afuera (CIELO.mundo): calle, banquetas, postes, laurel, vocho y los vecinos ----------
function calle(k){const {ctex}=k,RT=new THREE.Group();RT.name='calle';CIELO.mundo.add(RT);
 const tx=(key,rep,draw)=>{const t=ctex(key,256,256,draw,1);t.repeat.set(1/rep,1/rep);return t},sr=s=>()=>(s=(s*9301+49297)%233280)/233280;
 const asf=tx('asfalto',12,(g,w,h)=>{const r=sr(3);g.fillStyle='#55555a';g.fillRect(0,0,w,h);
  for(let i=0;i<5;i++){const v=r()<.5?40:105;g.fillStyle=`rgba(${v},${v},${v+3},.16)`;g.fillRect(r()*w,r()*h,30+r()*90,20+r()*60)}
  for(let i=0;i<3000;i++){const v=55+r()*80|0;g.fillStyle=`rgba(${v},${v},${v+4},.55)`;g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}
  g.strokeStyle='rgba(25,25,28,.5)';g.lineWidth=1.2;for(let i=0;i<4;i++){g.beginPath();let x=r()*w,y=r()*h;g.moveTo(x,y);for(let j=0;j<6;j++){x+=(r()-.5)*40;y+=(r()-.5)*40;g.lineTo(x,y)}g.stroke()}});
 const ban=tx('banqueta',4,(g,w,h)=>{const r=sr(5);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const v=188+r()*16|0;g.fillStyle=`rgb(${v},${v-6},${v-16})`;g.fillRect(x*64,y*64,64,64)}
  for(let i=0;i<900;i++){g.fillStyle=r()<.5?'rgba(90,80,70,.12)':'rgba(255,250,240,.12)';g.fillRect(r()*w,r()*h,2,2)}
  for(let i=0;i<6;i++){g.fillStyle='rgba(70,60,50,.08)';g.beginPath();g.ellipse(r()*w,r()*h,8+r()*20,6+r()*14,r()*3,0,7);g.fill()}
  g.fillStyle='rgba(60,55,50,.45)';for(let i=0;i<=4;i++){g.fillRect(i*64-1,0,2,h);g.fillRect(0,i*64-1,w,2)}});
 const pat=ctex('patina',256,256,(g,w,h)=>{const r=sr(9);g.fillStyle='#f4f1ea';g.fillRect(0,0,w,h);
  for(let i=0;i<40;i++){g.fillStyle=i%3?'rgba(90,70,50,.05)':'rgba(255,255,255,.08)';g.beginPath();g.ellipse(r()*w,r()*h,10+r()*50,8+r()*30,r()*3,0,7);g.fill()}
  for(let i=0;i<14;i++){const x=r()*w,l=20+r()*70,gr=g.createLinearGradient(0,0,0,l);gr.addColorStop(0,'rgba(70,60,50,.14)');gr.addColorStop(1,'rgba(70,60,50,0)');g.fillStyle=gr;g.fillRect(x,0,3+r()*6,l)}});
 const LA=LOTE(),LB=LOTE(),L=LOTE(),LF=LOTE(),VL=LOTE(),LV=LOTE();
 const plano=(Lx,x0,x1,z0,z1,y)=>{const w=x1-x0,d=z1-z0,g=new THREE.PlaneGeometry(w,d),u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*w,u.getY(i)*d);
  g.rotateX(-Math.PI/2);Lx.geo(g,0xffffff,(x0+x1)/2,y,(z0+z1)/2)};
 // arroyo, calles de las esquinas, banquetas con su guarnición
 plano(LA,-215,215,ZB,ZA,YA);[[82,88],[-88,-82]].forEach(([a,c])=>{plano(LA,a,c,-75,ZB,YA);plano(LA,a,c,ZA,100,YA)});
 [[-215,-88],[-82,82],[88,215]].forEach(([a,c])=>{plano(LB,a,c,FZ,ZB,0);plano(LB,a,c,ZA,ZE,0);
  L.box(c-a,.34,.3,0xaaa498,(a+c)/2,YA+.165,ZB-.15);L.box(c-a,.34,.3,0xaaa498,(a+c)/2,YA+.165,ZA+.15)});
 [[80,82,81.85],[88,90,88.15],[-82,-80,-81.85],[-90,-88,-88.15]].forEach(([a,c,xc])=>{plano(LB,a,c,-75,FZ,0);plano(LB,a,c,ZE,100,0);
  L.box(.3,.34,ZB+75,0xaaa498,xc,YA+.165,(ZB-75)/2);L.box(.3,.34,100-ZA,0xaaa498,xc,YA+.165,(ZA+100)/2)});
 // tope pintado y registros
 for(let j=0;j<10;j++)L.geo(new THREE.CylinderGeometry(.5,.5,1,12).scale(1,1,.38),j%2?0x1c1c1c:0xf2c230,-36,YA,ZB+.5+j,0,Math.PI/2,0);
 [[-8,28.6],[24,26.4],[-52,30.1],[60,27.2]].forEach(([x,z])=>{L.cyl(.75,.75,.05,0x3c3c3e,x,YA+.02,z,16);L.cyl(.6,.6,.06,0x2c2c2e,x,YA+.025,z,16)});
 // postes de concreto con cruceta, aisladores y lámpara; cables entre ellos (y la acometida a la casa)
 const PO=[[-75,1],[-44,1],[POS[0],1],[44,1],[75,1],[-60,-1],[-29,-1],[0,-1],[30,-1],[61,-1]],zp=s=>s>0?POS[1]:ZA+.45;
 PO.forEach(([x,s])=>{const z=zp(s);L.cyl(.17,.26,12.2,0x9c978c,x,6.1,z,8);L.box(.16,.16,3,0x8a7a64,x,11.3,z);
  [-1.3,0,1.3].forEach(dz=>L.cyl(.05,.07,.22,0xd8d8d0,x,11.5,z+dz,6));
  L.box(.12,.12,2.6,0x8a8a84,x,10.45,z+s*1.3,0,s*.12,0);L.box(.5,.22,.95,0x5a5a58,x,10.62,z+s*2.75);VL.box(.38,.05,.75,0xfff0c8,x,10.49,z+s*2.75)});
 const P=[],cat=(a,c,sag)=>{const f=t=>[a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t-sag*4*t*(1-t),a[2]+(c[2]-a[2])*t];for(let i=0;i<10;i++)P.push(...f(i/10),...f((i+1)/10))};
 [1,-1].forEach(s=>{const z=zp(s),xs=[-215,...PO.filter(p=>p[1]===s).map(p=>p[0]).sort((a,c)=>a-c),215];
  for(let i=0;i<xs.length-1;i++){[-1.3,0,1.3].forEach(dz=>cat([xs[i],11.62,z+dz],[xs[i+1],11.62,z+dz],.7));cat([xs[i],8.6,z],[xs[i+1],8.6,z],1)}});
 cat([POS[0],8.6,POS[1]],[15.4,8.1,FZ+.06],.35);
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));RT.add(new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:0x161616})));
 // laurel en su cazuela, con el tronco encalado
 {const [x,z]=LAU;L.box(1.9,.2,1.9,0xe8e2d4,x,.1,z);L.box(1.55,.02,1.55,0x4a3626,x,.205,z);
  L.cyl(.32,.46,6.2,0x7a6a58,x,3.3,z,10);L.cyl(.48,.48,1.5,0xf4f1ea,x,.95,z,10);
  for(let i=0;i<4;i++)L.rama(0x6a5a48,x,5.6,z,3.2,.22,.12,i/4*Math.PI*2+.4,.75);
  for(let i=0;i<18;i++)LF.bola(1.3+rnd()*.8,1.15,.85,1.15,pick([0x2f5a2a,0x3a6b32,0x2a4f25,0x447a38]),x+(rnd()-.5)*7,8.4+rnd()*3.6,Math.min(25.4,Math.max(21.6,z+.8+(rnd()-.5)*4.4)))}
 // vocho estacionado junto a la banqueta
 {const X=7.5,Y=YA,Z=25.2,C=0x5fb3c9,CH=0xd0d2d4,GL=0x1d2832,v=(w,h,d,c,x,y,z,ry,rx,rz)=>LV.box(w,h,d,c,X+x,Y+y,Z+z,ry,rx,rz),
   sp=(sx,sy,sz,c,x,y,z,half)=>LV.geo(new THREE.SphereGeometry(1,20,12,0,Math.PI*2,0,half?Math.PI/2:Math.PI).scale(sx,sy,sz),c,X+x,Y+y,Z+z);
  v(5.4,.62,2.1,C,-.1,.95,0);sp(2.1,1.3,1.1,C,.3,1.26,0,1);sp(1.6,.72,1.02,C,-1.9,1.2,0,1);sp(1.25,.95,1.02,C,2.1,1.2,0,1);
  [[-2.05,1],[-2.05,-1],[2.1,1],[2.1,-1]].forEach(([x,s])=>{sp(.95,.62,.42,C,x,.98,s);
   LV.geo(new THREE.CylinderGeometry(.6,.6,.42,16),0x161616,X+x,Y+.6,Z+s*1.06,0,Math.PI/2,0);LV.geo(new THREE.CylinderGeometry(.3,.3,.44,12),CH,X+x,Y+.6,Z+s*1.06,0,Math.PI/2,0)});
  v(.03,.62,1.42,GL,-1.4,2,0,0,0,-.62);v(.03,.42,1,GL,2.05,2.02,0,0,0,.72);
  [-1,1].forEach(s=>{v(2.3,.55,.03,GL,.38,1.98,s*.97,0,-s*.3,0);v(2.3,.1,.26,0x222222,.1,.72,s*1.17);
   LV.geo(new THREE.SphereGeometry(.2,10,8),0xf4f0d8,X-2.78,Y+1.42,Z+s);v(.08,.22,.16,0xc62828,3.2,1.32,s*.98)});
  v(.16,.17,2.3,CH,-3.42,.84,0);v(.16,.17,2.3,CH,3.32,.84,0);v(.04,.3,.9,0xf2f2ea,-3.52,.84,0);v(.04,.3,.9,0xf2f2ea,3.42,.84,0)}
 // luces de noche: el poste de la casa y los faroles del portón
 const lp=new THREE.PointLight(0xffd9a0,0,34,1.2);lp.position.set(POS[0],10.1,POS[1]+2.6);RT.add(lp);luz(lp,70);
 const lz=new THREE.PointLight(0xffc98a,0,16,1.5);lz.position.set(0,6.2,FZ+1.4);RT.add(lz);luz(lz,24);
 const cop=LF.mesh(new THREE.MeshLambertMaterial({flatShading:true}));zona([cop],[LAU[0]-5.2,LAU[0]+5.2,6.6,13.8,19.2,27.8]);   // la copa del laurel se esconde si tapa a tu Mii
 RT.add(LA.mesh(new THREE.MeshLambertMaterial({map:asf})),LB.mesh(new THREE.MeshLambertMaterial({map:ban})),L.mesh(new THREE.MeshLambertMaterial()),cop,vidrio(VL.mesh(new THREE.MeshBasicMaterial()),0xd8d2c0),LV.mesh(new THREE.MeshStandardMaterial({roughness:.4,metalness:.1})));
 // los vecinos: de este lado (con árboles en sus patios) y enfrente; cada bloque se esconde si tapa a tu Mii
 const mC=new THREE.MeshLambertMaterial({map:pat}),mF=new THREE.MeshLambertMaterial({flatShading:true}),mV=new THREE.MeshBasicMaterial();
 const lado=(xs,s,arb,b)=>{const Lc=LOTE(),Lv=LOTE(),Lf=LOTE();xs.forEach(([a,c])=>fila(Lc,Lv,Lf,a,c,s,arb));const G=new THREE.Group();
  G.add(Lc.mesh(mC));if(Lv.n())G.add(vidrio(Lv.mesh(mV)));if(Lf.n())G.add(Lf.mesh(mF));RT.add(G);zona([G],b)};
 lado([[17.3,80],[90,215]],1,true,[17.35,400,-2,80,-90,FZ-.05]);
 lado([[-17.3,-80],[-90,-215]],1,true,[-400,-17.35,-2,80,-90,FZ-.05]);
 lado([[-215,-90],[-80,80],[90,215]],-1,false,[-400,400,-2,80,ZE+.05,200]);
 return RT}

// ---------- una fila de casas vecinas entre xa y xb; s=1 de este lado (miran a +z), s=-1 enfrente ----------
const PAL=[0xe8a0a8,0xe2b452,0x7fa8d0,0x8cbf88,0xf0e4cc,0xd9785a,0xc9d6a0,0xf2c49b,0xa9d4cc,0xdcb8d8],MADS=[0x2f6b4a,0x5a3418,0x2a4f7a,0x7a2a22,0x3a2a1a],
 AZO=[0xb5473a,0xd9d4c7,0x9a9890,0xc9764a],VERD=[0x3f7a35,0x4b8a3c,0x356b2e,0x2f5f2a];
function fila(L,V,F,xa,xb,s,arb){const dir=xb>xa?1:-1;let x=xa;
 while(Math.abs(xb-x)>1){let w=7+rnd()*6;const rest=Math.abs(xb-x);if(rest-w<5)w=rest;casa(L,V,F,Math.min(x,x+dir*w),Math.max(x,x+dir*w),s,arb);x+=dir*w}}
function casa(L,V,F,x0,x1,s,arb){const zf=s>0?FZ:ZE,w=x1-x0,cx=(x0+x1)/2,o=k=>zf+s*k,r=rnd(),dos=r<.2,hr=dos?14.6+rnd()*2.4:(r<.34?7.2+rnd()*.8:8.4+rnd()*1.8),
  dd=14+rnd()*12,c=pick(PAL),cr=rnd()<.7?CR:0xf7f2e6,mad=pick(MADS),lejos=Math.abs(cx)>95;
 L.box(w,hr,dd,c,cx,hr/2,o(-dd/2));L.box(w,.12,dd-.3,pick(AZO),cx,hr+.06,o(-dd/2-.15));          // la casa y su azotea
 L.box(w,1,.3,c,cx,hr+.5,o(-.15));L.box(w+.04,.14,.44,cr,cx,hr+1.07,o(-.1));                     // pretil
 L.box(w,.36,.34,cr,cx,hr-.3,o(.17));L.box(w,.16,.2,cr,cx,hr-.62,o(.1));L.box(w,1,.1,dk(c),cx,.5,o(.05));   // cornisa y zócalo
 [x0+.25,x1-.25].forEach(px=>L.box(.5,hr-.8,.12,cr,px,(hr-.8)/2,o(.06)));if(dos)L.box(w,.3,.16,cr,cx,8.9,o(.08));
 if(rnd()<.55)L.cyl(.75,.75,1.5,0x1c1c1c,cx+(rnd()-.5)*(w-2.5),hr+.87,o(-2-rnd()*(dd-4)),12);   // tinaco
 const n=w>10.5?3:2,pd=(rnd()*n)|0,paso=(w-1.6)/n;
 for(let i=0;i<n;i++){const px=x0+.8+paso*(i+.5);if(i===pd)puerta(L,px,o,mad,cr);else ventana(L,V,px,o,mad,cr,lejos,.9,Math.min(hr-2.4,4.2+rnd()*.7));
  if(dos){L.box(2.7,.2,.95,cr,px,9.7,o(.47));if(!lejos){for(let j=0;j<9;j++)L.box(.04,1.1,.04,HI,px-1.28+j*.32,10.35,o(.9));L.box(2.7,.06,.06,HI,px,10.92,o(.9))}
   ventana(L,V,px,o,mad,cr,lejos,9.9,Math.min(hr-11.4,3.6))}}
 if(arb&&rnd()<.6){const tz=Math.max(-40,zf-dd-3-rnd()*9),tx=cx+(rnd()-.5)*(w-3),h=4.5+rnd()*3,fl=rnd()<.25;L.cyl(.24,.34,h,0x6b5a48,tx,h/2,tz,7);
  for(let i=0;i<6;i++)F.bola(1.5+rnd()*.9,1.2,.9,1.2,fl&&i%2?pick([0xe8401c,0xf2562a]):pick(VERD),tx+(rnd()-.5)*3.2,h+rnd()*2.4,tz+(rnd()-.5)*3.2)}}
function puerta(L,px,o,mad,cr){const dw=2+rnd()*.5,dh=4.6+rnd()*.5;
 L.box(dw,dh,.02,0x120e0a,px,dh/2,o(.01));L.box(dw-.08,dh-.06,.06,mad,px,dh/2,o(.04));
 [-1,1].forEach(k=>[.3,.72].forEach(f=>L.box(dw/2-.35,dh*.3,.03,dk(mad,.8),px+k*dw/4,dh*f,o(.085))));
 L.box(.3,dh+.35,.14,cr,px-dw/2-.15,(dh+.35)/2,o(.07));L.box(.3,dh+.35,.14,cr,px+dw/2+.15,(dh+.35)/2,o(.07));L.box(dw+.9,.42,.18,cr,px,dh+.35,o(.09))}
function ventana(L,V,px,o,mad,cr,lejos,y0,wh){const ww=1.5+rnd()*.5,yc=y0+wh/2;
 L.box(ww,wh,.02,0x15110d,px,yc,o(.01));
 if(rnd()<.5)[-1,1].forEach(k=>L.box(ww/2-.04,wh-.08,.05,mad,px+k*ww/4,yc,o(.035)));
 else{V.box(ww-.1,wh-.1,.02,rnd()<.42?pick([0xffc46a,0xffd890,0xf6b860]):0x0c0f14,px,yc,o(.025));L.box(.06,wh,.05,mad,px,yc,o(.04));L.box(ww,.06,.05,mad,px,y0+wh*.62,o(.04))}
 L.box(.24,wh+.3,.12,cr,px-ww/2-.12,yc,o(.06));L.box(.24,wh+.3,.12,cr,px+ww/2+.12,yc,o(.06));
 L.box(ww+.8,.32,.16,cr,px,y0+wh+.3,o(.08));L.box(ww+.6,.14,.4,cr,px,y0-.07,o(.2));
 if(!lejos){const nb=Math.round(ww/.25);for(let i=1;i<nb;i++)L.box(.04,wh+.1,.04,HI,px-ww/2+i*ww/nb,yc,o(.22));[.25,.75].forEach(f=>L.box(ww+.1,.04,.04,HI,px,y0+wh*f,o(.22)))}}

window.CCALLE={build,fondo,zona,tinte,vidrio,luz,enMundo,tema};
})();
