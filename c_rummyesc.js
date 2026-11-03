// Rummy 3D: "La terraza de los abuelos" al atardecer. Cielo naranja y rosa con el sol bajito, piso de barro, barda con buganvilia, árbol, macetas,
// ventilador de pie, foquitos colgados que se van encendiendo, y la mesa de herrería con mantel de hule, sillas, radio, tazas de café y vasos de agua de jamaica.
// window.RME.build(SC, CH, mob) arma todo en la escena (CH: CASA3D) y regresa {K, step, start, seats(n), seat(c), radio}. Todo hecho con código; NO cambia reglas.
(function(){
if(typeof THREE==='undefined')return;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),rnd=(a,b)=>a+Math.random()*(b-a);
function pol(a,r,y){return v3(Math.cos(a)*r,y||0,Math.sin(a)*r)}
// silla c de n: la 0 (la tuya) queda al frente (+z) · mesa de radio TBR a la altura TH (la de la casa) · sillas a CR · atriles a AR · bolsa y reloj a tus lados
const ang=(c,n)=>Math.PI/2+c/n*Math.PI*2;
const K={TH:1.5,TBR:2,CR:2.6,AR:1.68,ang,pol};K.BAG=pol(Math.PI/2-.7,1.55,K.TH);K.RELOJ=pol(Math.PI/2+.7,1.55,K.TH);
const SUND=v3(-.5,.16,-.85).normalize();
let CH,G0,SUN,HEMI,FAN=null,BULBS=[],WARM=[],T0=0;const CHAIRS=[],CUPS=[];let RADIO=null;
const std=(c,r,o)=>CH.std(c,r,o);
function add(geo,mat,x,y,z,par,sh=true){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=sh;(par||G0).add(m);return m}
// tubo de a a b (herrería, cables, ramas)
function tube(a,b,r,mat,par){const d=b.clone().sub(a),m=add(new THREE.CylinderGeometry(r,r,d.length(),8),mat,0,0,0,par);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(v3(0,1,0),d.normalize());return m}
const tex=(k,w,h,f,rx,ry)=>{const t=CH.ctex('rm-'+k,w,h,f,!!rx);if(rx)t.repeat.set(rx,ry);return t};
// ---------- cielo, sol y luces ----------
function sky(mob){const t=tex('cielo',8,512,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);
  [[0,'#1c2550'],[.2,'#3e3a78'],[.32,'#874f8e'],[.4,'#e0707e'],[.45,'#fb9a6a'],[.49,'#ffcf8e'],[.51,'#ffe2ab'],[.56,'#e3a07c'],[1,'#8f5a4a']].forEach(([s,c])=>gr.addColorStop(s,c));g.fillStyle=gr;g.fillRect(0,0,w,h)});
 G0.add(new THREE.Mesh(new THREE.SphereGeometry(80,32,24),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,fog:false,depthWrite:false})));
 const sg=tex('sol',128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,248,225,1)');gr.addColorStop(.16,'rgba(255,216,150,.95)');gr.addColorStop(.45,'rgba(255,160,100,.32)');gr.addColorStop(1,'rgba(255,140,90,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:sg,fog:false,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending}));sp.position.copy(SUND).multiplyScalar(70);sp.scale.setScalar(18);G0.add(sp);
 HEMI=new THREE.HemisphereLight(0xffc0a0,0x6a3a28,.9);G0.add(HEMI);
 // el sol bajito: luz cálida de lado y sombras largas
 SUN=new THREE.DirectionalLight(0xffa25e,2.4);SUN.position.copy(SUND).multiplyScalar(22);G0.add(SUN,SUN.target);SUN.castShadow=true;
 const c=SUN.shadow.camera;c.left=c.bottom=-8;c.right=c.top=8;c.near=1;c.far=50;SUN.shadow.mapSize.set(mob?1024:2048,mob?1024:2048);SUN.shadow.bias=-.0004;SUN.shadow.normalBias=.02;
 const fill=new THREE.DirectionalLight(0x9a8cff,.25);fill.position.set(6,5,8);G0.add(fill)}
// ---------- piso de barro, bardas y la casa ----------
function stucco(k,base){return tex('muro-'+k,256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},${rnd(.02,.06)})`;g.fillRect(rnd(0,w),rnd(0,h),rnd(1,3),rnd(1,3))}
  for(let i=0;i<6;i++){const gr=g.createLinearGradient(0,h*.6,0,h);gr.addColorStop(0,'rgba(90,50,30,0)');gr.addColorStop(1,'rgba(90,50,30,.18)');g.fillStyle=gr;g.fillRect(rnd(0,w),h*.6,rnd(20,60),h*.4)}},4,1)}
function patio(){const t=tex('piso',256,256,(g,w,h)=>{for(let i=0;i<2;i++)for(let j=0;j<2;j++){g.fillStyle=`hsl(${16+rnd(-3,3)},${52+rnd(-6,6)}%,${44+rnd(-6,6)}%)`;g.fillRect(i*128,j*128,128,128);
   for(let k=0;k<70;k++){g.fillStyle=`rgba(${Math.random()<.5?'80,30,10':'255,220,180'},${rnd(.03,.09)})`;g.beginPath();g.arc(i*128+rnd(0,128),j*128+rnd(0,128),rnd(1,6),0,7);g.fill()}}
  g.strokeStyle='#d9c3a5';g.lineWidth=6;for(let i=0;i<=2;i++){g.beginPath();g.moveTo(i*128,0);g.lineTo(i*128,h);g.stroke();g.beginPath();g.moveTo(0,i*128);g.lineTo(w,i*128);g.stroke()}},24,24);
 const fl=add(new THREE.PlaneGeometry(26,26),std(0xffffff,.85,{map:t}),0,0,0);fl.rotation.x=-Math.PI/2;fl.castShadow=false;
 const mB=std(0xffffff,.92,{map:stucco('b','#e79a76')}),cap=std(0xb5573a,.8);
 [[0,-7.5,17,0],[-8.5,0,15,1],[8.5,0,15,1]].forEach(([x,z,l,r])=>{const m=add(new THREE.BoxGeometry(l,2.6,.28),mB,x,1.3,z),c=add(new THREE.BoxGeometry(l+.1,.1,.4),cap,x,2.65,z);if(r)m.rotation.y=c.rotation.y=Math.PI/2});
 // la casa, detrás de ti: puerta, ventanas con luz adentro y su tejaroz
 add(new THREE.BoxGeometry(17,4.4,.3),std(0xffffff,.9,{map:stucco('c','#f0d9b2')}),0,2.2,7.5);add(new THREE.BoxGeometry(1.1,2.2,.08),std(0x5a3216,.6),1.6,1.1,7.33);
 [-2.6,4.4].forEach(x=>{add(new THREE.BoxGeometry(1.3,1.1,.06),std(0xffd38a,.5,{emissive:0xffb04a,emissiveIntensity:.9}),x,1.9,7.33);add(new THREE.BoxGeometry(1.5,.08,.2),std(0x8a5a3a,.7),x,1.32,7.3)});
 add(new THREE.BoxGeometry(17.4,.14,1),std(0xa9452c,.75),0,4.35,7.1)}
// casas, tinacos y la cúpula de la iglesia detrás de la barda (sin tapar el sol)
function lejos(){const cs=[0x6d4a5e,0x7d5662,0x5e4458,0x8a6068];for(let i=0;i<14;i++){const x=-16+i*2.4+rnd(-.5,.5);if(x<-5&&x>-14)continue;const h=rnd(2.6,4.6),w=rnd(1.8,2.6),z=rnd(-15,-12);
  add(new THREE.BoxGeometry(w,h,2),std(cs[i%4],.95),x,h/2,z,G0,false);if(Math.random()<.6)add(new THREE.CylinderGeometry(.35,.35,.6,12),std(0x1c1c1c,.7),x+rnd(-.5,.5),h+.3,z,G0,false)}
 const ig=std(0xc9a27a,.9);add(new THREE.BoxGeometry(3,5,3),ig,9,2.5,-20,G0,false);add(new THREE.SphereGeometry(1.4,16,10,0,Math.PI*2,0,Math.PI/2),std(0xd9b36a,.6),9,5,-20,G0,false);add(new THREE.BoxGeometry(1.2,8,1.2),ig,11.6,4,-19,G0,false)}
// ---------- plantas: buganvilia en la barda, el árbol y las macetas ----------
function bugambilia(){const N=420,m=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.11,0),std(0xffffff,.8,{flatShading:true}),N),o=new THREE.Object3D(),c=new THREE.Color();
 const PK=['#d81b72','#e9358f','#c2185b','#f06292','#b0145a'],GR=['#2f6b2a','#3d7d33','#24561f'],cl=[];for(let k=0;k<11;k++)cl.push({x:rnd(-7.8,7.8),y:rnd(2.2,2.9),r:rnd(.5,1.1)});
 for(let i=0;i<N;i++){const q=cl[i%cl.length],a=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random())*q.r,y=q.y+Math.sin(a)*rr*.7-(Math.random()<.35?rnd(0,1.2):0);
  o.position.set(q.x+Math.cos(a)*rr,Math.max(.6,y),-7.3+rnd(-.1,.22));o.rotation.set(rnd(0,3),rnd(0,3),rnd(0,3));o.scale.setScalar(rnd(.6,1.25));o.updateMatrix();m.setMatrixAt(i,o.matrix);
  m.setColorAt(i,c.set(Math.random()<.72?PK[i%5]:GR[i%3]))}
 m.instanceColor.needsUpdate=true;m.castShadow=true;G0.add(m)}
function arbol(){const x=-6.3,z=-5.6,tr=std(0x5b3a24,.9);add(new THREE.CylinderGeometry(.16,.3,3.4,10),tr,x,1.7,z);tube(v3(x,2.4,z),v3(x+.9,3.3,z+.4),.08,tr);tube(v3(x,2.7,z),v3(x-.7,3.5,z+.3),.07,tr);
 for(let i=0;i<10;i++)add(new THREE.IcosahedronGeometry(rnd(.7,1.25),1),std(new THREE.Color().setHSL(.27+rnd(-.03,.03),.45,.24+rnd(0,.08)),.9,{flatShading:true}),x+rnd(-1.3,1.3),3.7+rnd(-.4,.7),z+rnd(-1,1))}
function macetas(){const barro=std(0xb85a32,.85),tie=std(0x5a3a22,1);
 [[-7.6,-6.6,'cactus'],[-4.2,-6.8,'malvón'],[-1.2,-6.9,'helecho'],[2.6,-6.8,'malvón'],[5.6,-6.6,'sábila'],[7.7,-3,'helecho'],[-7.8,1.5,'malvón'],[7.6,3.5,'cactus'],[-3.6,6.8,'helecho'],[5.8,6.7,'malvón']].forEach(([x,z,t])=>{
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(rnd(.85,1.2));G0.add(g);
  add(new THREE.CylinderGeometry(.3,.22,.5,16),barro,0,.25,0,g);add(new THREE.TorusGeometry(.3,.04,6,18),barro,0,.5,0,g).rotation.x=Math.PI/2;add(new THREE.CircleGeometry(.28,16),tie,0,.49,0,g).rotation.x=-Math.PI/2;
  if(t=='cactus'){const v=std(0x3f7d3a,.8);add(new THREE.CapsuleGeometry(.11,.6,4,10),v,0,.9,0,g);add(new THREE.CapsuleGeometry(.07,.25,4,8),v,.15,1,0,g).rotation.z=-.6}
  else if(t=='sábila'){const v=std(0x5f8f5a,.7);for(let i=0;i<9;i++){const a=i/9*Math.PI*2,c=add(new THREE.ConeGeometry(.05,.6,5),v,Math.cos(a)*.1,.75,Math.sin(a)*.1,g);c.rotation.order='YXZ';c.rotation.set(rnd(.3,.7),a,0)}}
  else if(t=='helecho')add(new THREE.IcosahedronGeometry(.42,1),std(0x3e7a35,.9,{flatShading:true}),0,.82,0,g).scale.set(1.2,.8,1.2);
  else{add(new THREE.IcosahedronGeometry(.34,1),std(0x2f6a2b,.9,{flatShading:true}),0,.8,0,g);const fl=std(0xd32f3f,.7);for(let i=0;i<7;i++)add(new THREE.IcosahedronGeometry(.07,0),fl,rnd(-.25,.25),rnd(.95,1.1),rnd(-.25,.25),g)}})}
// ---------- ventilador de pie que voltea de un lado a otro ----------
function ventilador(){const g=new THREE.Group();g.position.set(3.7,0,-1.8);g.rotation.y=Math.atan2(-3.7,1.8);G0.add(g);const mt=std(0xe8e4dc,.5,{metalness:.2}),cage=std(0xdedede,.4,{metalness:.5}),az=std(0x7fb3c8,.5);
 add(new THREE.CylinderGeometry(.32,.36,.06,24),mt,0,.03,0,g);add(new THREE.CylinderGeometry(.025,.03,1.9,10),mt,0,1,0,g);
 const h=new THREE.Group();h.position.y=2;g.add(h);add(new THREE.CylinderGeometry(.11,.11,.22,16),mt,0,0,-.06,h).rotation.x=Math.PI/2;add(new THREE.TorusGeometry(.34,.008,6,40),cage,0,0,.12,h);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;tube(v3(0,0,.17),v3(Math.cos(a)*.34,Math.sin(a)*.34,.12),.004,cage,h)}
 const bl=new THREE.Group();bl.position.z=.1;h.add(bl);for(let i=0;i<3;i++){const p=new THREE.Group();p.rotation.z=i/3*Math.PI*2;bl.add(p);add(new THREE.BoxGeometry(.08,.28,.01),az,0,.15,0,p).rotation.y=.35}
 FAN={h,bl}}
// ---------- foquitos colgados de la casa a la barda (se encienden uno por uno al anochecer) ----------
function foquitos(){const wire=new THREE.LineBasicMaterial({color:0x222018}),soc=std(0x2a2a2a,.6),bg=new THREE.SphereGeometry(.055,10,8),sg=new THREE.CylinderGeometry(.022,.022,.05,8);
 [[v3(-4.2,3.7,7.3),v3(-3,3.1,-7.3)],[v3(0,3.9,7.3),v3(0,3.2,-7.3)],[v3(4.2,3.7,7.3),v3(3,3.1,-7.3)],[v3(-8.3,2.9,-2),v3(8.3,2.9,-2.6)]].forEach(([a,b])=>{
  const at=t=>{const p=a.clone().lerp(b,t);p.y-=.7*4*t*(1-t);return p},pts=[];for(let i=0;i<=40;i++)pts.push(at(i/40));G0.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wire));
  for(let i=1;i<14;i++){const p=at(i/14),m=std(0xfff1cf,.4,{emissive:0xffc46a,emissiveIntensity:0});add(bg,m,p.x,p.y-.07,p.z,G0,false);add(sg,soc,p.x,p.y-.01,p.z,G0,false);BULBS.push({m,d:BULBS.length*.55+rnd(0,.5)})}});
 WARM=[v3(0,3,1.2),v3(0,3,-1.6)].map(p=>{const l=new THREE.PointLight(0xffc27a,0,10,1.8);l.position.copy(p);G0.add(l);return l})}
// ---------- la mesa de herrería con mantel de hule floreado ----------
function mesa(){const g=new THREE.Group();G0.add(g);
 const hule=tex('hule',512,512,(c,w,h)=>{c.fillStyle='#f6eed6';c.fillRect(0,0,w,h);const F=['#d8432f','#f1b42f','#3d7ad6','#e2589a'];
  for(let i=0;i<26;i++){const x0=rnd(0,w),y0=rnd(0,h),r=rnd(14,26),col=F[i%4],rots=[0,1,2].map(k=>k*2.1+rnd(0,1));
   for(const ox of [-w,0,w])for(const oy of [-h,0,h]){const x=x0+ox,y=y0+oy;if(x<-60||x>w+60||y<-60||y>h+60)continue;   // también del otro lado: el dibujo se repite sin cortes
    c.fillStyle='#4f8a3a';rots.forEach(a=>{c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(r*1.3,0,r*.7,r*.28,0,0,7);c.fill();c.restore()});
    c.fillStyle=col;for(let k=0;k<5;k++){const a=k/5*Math.PI*2;c.beginPath();c.arc(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,r*.45,0,7);c.fill()}c.fillStyle='#ffe07a';c.beginPath();c.arc(x,y,r*.28,0,7);c.fill()}}},3,3);
 add(new THREE.CylinderGeometry(K.TBR,K.TBR,.03,64),std(0xffffff,.55,{map:hule}),0,K.TH-.015,0,g);
 const hs=hule.clone();hs.repeat.set(9,.6);hs.needsUpdate=true;add(new THREE.CylinderGeometry(K.TBR+.012,K.TBR+.06,.3,72,1,true),std(0xffffff,.6,{map:hs,side:THREE.DoubleSide}),0,K.TH-.165,0,g);
 const fe=std(0xf2efe8,.35,{metalness:.4});add(new THREE.CylinderGeometry(.05,.05,K.TH-.35,10),fe,0,(K.TH-.35)/2+.05,0,g);add(new THREE.TorusGeometry(K.TBR-.25,.02,6,48),fe,0,K.TH-.33,0,g).rotation.x=Math.PI/2;
 for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;tube(v3(0,.55,0),pol(a,.75,.02),.025,fe,g);add(new THREE.SphereGeometry(.04,8,6),fe,Math.cos(a)*.75,.03,Math.sin(a)*.75,g)}}
// silla de herrería blanca con cojín (en su grupo, +z mira a la mesa)
function silla(){const g=new THREE.Group(),fe=std(0xf2efe8,.35,{metalness:.4}),coj=std([0xc84b3a,0x2e7d4f,0xe0a030][CHAIRS.length%3],.85);
 add(new THREE.CylinderGeometry(.34,.34,.035,24),fe,0,.92,0,g);add(new THREE.CylinderGeometry(.31,.31,.07,24),coj,0,.97,0,g);
 [[-.24,-.24],[.24,-.24],[-.24,.24],[.24,.24]].forEach(([x,z])=>tube(v3(x,.9,z),v3(x*1.15,0,z*1.15),.018,fe,g));
 [-.26,.26].forEach(x=>tube(v3(x,.92,-.27),v3(x*1.05,1.85,-.34),.02,fe,g));add(new THREE.TorusGeometry(.27,.02,6,24,Math.PI),fe,0,1.82,-.335,g);
 for(let i=-2;i<=2;i++)tube(v3(i*.09,.96,-.29),v3(i*.095,1.78,-.33),.011,fe,g);[-.13,.13].forEach(x=>add(new THREE.TorusGeometry(.06,.01,6,16),fe,x,1.42,-.31,g));return g}
// ---------- sobre la mesa: radio vieja, tazas de barro con café y vasos de agua de jamaica ----------
function radio(){const g=new THREE.Group(),wd=std(0x6e3b1c,.5);
 const gr=tex('rejilla',64,64,(c,w,h)=>{c.fillStyle='#c9b48a';c.fillRect(0,0,w,h);c.strokeStyle='rgba(90,60,30,.45)';for(let i=0;i<w;i+=3){c.beginPath();c.moveTo(i,0);c.lineTo(i,h);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(w,i);c.stroke()}},3,2);
 const dial=tex('dial',128,32,(c,w,h)=>{c.fillStyle='#f3e2b0';c.fillRect(0,0,w,h);c.fillStyle='#5a3a1a';c.font='bold 11px sans-serif';[55,70,90,110,140,160].forEach((v,i)=>c.fillText(v,6+i*20,20));c.fillStyle='#c0392b';c.fillRect(70,4,2,24)});
 add(new THREE.BoxGeometry(.48,.28,.18),wd,0,.14,0,g);add(new THREE.PlaneGeometry(.26,.2),std(0xffffff,.9,{map:gr}),-.07,.15,.091,g);
 add(new THREE.PlaneGeometry(.14,.04),std(0xffffff,.5,{map:dial,emissive:0xffb35a,emissiveIntensity:.25}),.15,.2,.091,g);
 [.11,.19].forEach(x=>add(new THREE.CylinderGeometry(.022,.022,.02,14),std(0xd8c49a,.4,{metalness:.5}),x,.09,.1,g).rotation.x=Math.PI/2);
 tube(v3(.18,.28,-.04),v3(.32,.72,-.1),.004,std(0xcccccc,.3,{metalness:.8}),g);G0.add(g);return g}
function taza(){const g=new THREE.Group(),b=std(0xa65a35,.8);add(new THREE.CylinderGeometry(.068,.052,.12,18,1,true),std(0xa65a35,.8,{side:THREE.DoubleSide}),0,.06,0,g);
 add(new THREE.CircleGeometry(.064,18),std(0x2a160c,.3),0,.1,0,g).rotation.x=-Math.PI/2;add(new THREE.TorusGeometry(.035,.01,6,14),b,.08,.06,0,g);add(new THREE.CylinderGeometry(.0685,.066,.018,18,1,true),std(0xf2d27a,.7),0,.09,0,g);return g}
function vaso(){const g=new THREE.Group();add(new THREE.CylinderGeometry(.06,.05,.17,18,1,true),new THREE.MeshStandardMaterial({color:0xdfeff2,roughness:.08,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}),0,.085,0,g,false);
 add(new THREE.CylinderGeometry(.056,.048,.125,18),new THREE.MeshStandardMaterial({color:0x8e1240,roughness:.15,transparent:true,opacity:.86}),0,.065,0,g,false);
 const hi=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.05,transparent:true,opacity:.55});for(let i=0;i<2;i++)add(new THREE.BoxGeometry(.035,.035,.035),hi,rnd(-.02,.02),.12,rnd(-.02,.02),g,false).rotation.set(rnd(0,1),rnd(0,1),0);return g}
// acomoda sillas, radio y tazas para n jugadores; cada taza va junto a su atril, del lado que quede más libre
function seats(n){E.n=n;for(let c=0;c<5;c++){const s=CHAIRS[c]||(CHAIRS[c]=silla());if(!s.parent)G0.add(s);s.visible=c<n;if(c<n){const p=pol(ang(c,n),K.CR);s.position.copy(p);s.rotation.y=Math.atan2(-p.x,-p.z)}}
 const ra=n%2?Math.PI*1.5:Math.PI*1.5-Math.PI/n,rp=pol(ra,1.55,K.TH);RADIO.position.copy(rp);RADIO.rotation.y=Math.atan2(-rp.x,-rp.z);
 const res=[K.BAG,K.RELOJ,rp];CUPS.forEach(c=>c.visible=false);
 for(let c=0;c<n;c++){const a=ang(c,n),off=c?.46:.62;let best=null;[1,-1].forEach(sg=>{const p=pol(a+sg*off,1.86,K.TH),d=Math.min(...res.map(q=>q.distanceTo(p)));if(!best||d>best.d)best={p,d}});
  const cup=CUPS[c]||(CUPS[c]=c%2?vaso():taza());if(!cup.parent)G0.add(cup);cup.visible=true;cup.position.copy(best.p);res.push(best.p)}}
function step(now,dt){const t=(now-T0)/1000;if(FAN){FAN.h.rotation.y=Math.sin(now/2600)*.55;FAN.bl.rotation.z-=dt*.035}
 let on=0;BULBS.forEach(b=>{const k=Math.max(0,Math.min(1,(t-2-b.d)/.8));b.m.emissiveIntensity=k*(2.4+.2*Math.sin(now/90+b.d*7));on+=k});WARM.forEach(l=>l.intensity=on/BULBS.length*9);
 const s=Math.min(1,t/900);SUN.intensity=2.4-1.2*s;HEMI.intensity=.9-.35*s}   // el sol se va metiendo en unos 15 minutos
const E={K,step,seats,n:0,start(now){T0=now},seat:c=>pol(ang(c,E.n||1),K.CR),get radio(){return RADIO}};
window.RME={K,build(SC,ch,mob){CH=ch;G0=new THREE.Group();SC.add(G0);sky(mob);patio();lejos();bugambilia();arbol();macetas();ventilador();foquitos();mesa();RADIO=radio();return E}};
})();
