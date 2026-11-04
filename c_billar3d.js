// c_billar3d.js — BIL: mesa de billar de pool (9 pies) hecha en código para el cuarto del billar del sótano (c_sotano_salon.js).
// Lista para jugarse después: BIL.D trae las medidas en el espacio de la mesa (x a lo largo, z a lo ancho, y desde el piso):
//   L×A del paño entre narices de banda, R de bola, Y altura del paño, buchacas {x,z,r}, narices de banda y quijadas como segmentos,
//   cabeza y pie (donde va la blanca y el triángulo). build() devuelve las 16 bolas (0 = blanca) ya acomodadas.
// También BIL.taquera (taquera de pared con tacos, triángulo y gises) y BIL.marcador (marcador de cuentas de pared).
(function(){
if(typeof THREE==='undefined')return;
const V2=THREE.Vector2,PI=Math.PI;
const K=1.42;   // escala de la casa: las mesas de juego van más grandes que las reales (los Miis son cabezones)
// mesa de 9 pies (WPA) por K: paño L×A, bola R, altura del paño Y, banda (ancho CW, alto CH), riel de madera RW,
// boca de buchaca de esquina MC y de en medio MS, radio de su hoyo PC y PS
const L=2.54*K,A=1.27*K,R=.05715/2*K,Y=.762*K,CW=.05*K,CH=.045*K,RW=.13*K,MC=.116*K,MS=.13*K,PC=.062*K,PS=.066*K,RT=Y+CH;
// buchacas (o: hacia afuera)
const P=[];[-1,1].forEach(sx=>[-1,1].forEach(sz=>P.push({x:sx*(L/2+.028*K),z:sz*(A/2+.028*K),r:PC,ox:sx,oz:sz})));
[-1,1].forEach(sz=>P.push({x:0,z:sz*(A/2+.045*K),r:PS,ox:0,oz:sz}));
// bandas: nariz (lo que toca la bola) y fondo; las quijadas cierran hacia la buchaca (esquina 142°, en medio 103.5°)
const a=MC/Math.SQRT2,dc=CW/Math.tan(38*PI/180),ds=CW/Math.tan(76.5*PI/180),BANDAS=[];
[-1,1].forEach(s=>{const n=s*A/2,f=s*(A/2+CW);
 BANDAS.push([[-L/2+a,n],[-MS/2,n],[-MS/2+ds,f],[-L/2+a-dc,f]],[[MS/2,n],[L/2-a,n],[L/2-a+dc,f],[MS/2-ds,f]]);
 const m=s*L/2,g=s*(L/2+CW);BANDAS.push([[m,-A/2+a],[m,A/2-a],[g,A/2-a+dc],[g,-A/2+a-dc]])});
const D={K,L,A,R,Y,RT,CW,CH,P,cabeza:[-L/4,0],pie:[L/4,0],
 bandas:BANDAS.map(b=>[b[0][0],b[0][1],b[1][0],b[1][1]]),quijadas:BANDAS.flatMap(b=>[[b[0][0],b[0][1],b[3][0],b[3][1]],[b[1][0],b[1][1],b[2][0],b[2][1]]])};

// contorno del rectángulo ±hx × ±hz con las buchacas: fuera=1 la muesca se mete al riel, -1 muerde el paño
function muescas(hx,hz,C,fuera){const per=[[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]],raw=[];
 for(let s=0;s<4;s++){const [ax,az]=per[s],[bx,bz]=per[(s+1)%4],k=Math.ceil(Math.hypot(bx-ax,bz-az)/.01);for(let i=0;i<k;i++)raw.push([ax+(bx-ax)*i/k,az+(bz-az)*i/k])}
 const en=q=>C.find(p=>Math.hypot(q[0]-p.x,q[1]-p.z)<p.r),n=raw.length,st=raw.findIndex(q=>!en(q)),out=[];
 for(let j=0;j<n;){const q=raw[(st+j)%n],p=en(q);if(!p){out.push(q);j++;continue}
  let e=j;while(e+1<n&&en(raw[(st+e+1)%n])===p)e++;
  const qa=raw[(st+j)%n],qb=raw[(st+e)%n],t0=Math.atan2(qa[1]-p.z,qa[0]-p.x),t1=Math.atan2(qb[1]-p.z,qb[0]-p.x),to=Math.atan2(p.oz,p.ox);
  let d=t1-t0;while(d<0)d+=2*PI;if(Math.cos(t0+d/2-to)*fuera<0)d-=2*PI;
  const m=Math.max(8,Math.ceil(Math.abs(d)*p.r/.006));for(let i=0;i<=m;i++){const t=t0+d*i/m;out.push([p.x+Math.cos(t)*p.r,p.z+Math.sin(t)*p.r])}
  j=e+1}
 // fuera los puntos de en medio de las rectas (el riel quedaba con miles de vértices)
 const k=out.length,o2=out.filter((q,i)=>{const a=out[(i-1+k)%k],b=out[(i+1)%k];return Math.abs((q[0]-a[0])*(b[1]-q[1])-(q[1]-a[1])*(b[0]-q[0]))>1e-8});
 return o2.map(([x,z])=>new V2(x,-z))}
function rrect(hx,hz,r){const s=new THREE.Shape();s.moveTo(-hx+r,-hz);s.lineTo(hx-r,-hz);s.quadraticCurveTo(hx,-hz,hx,-hz+r);s.lineTo(hx,hz-r);s.quadraticCurveTo(hx,hz,hx-r,hz);
 s.lineTo(-hx+r,hz);s.quadraticCurveTo(-hx,hz,-hx,hz-r);s.lineTo(-hx,-hz+r);s.quadraticCurveTo(-hx,-hz,-hx+r,-hz);return s}
// figura (x,-z) levantada: de top-depth-2bev a top
function alza(shape,depth,bev,top){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:10});
 g.rotateX(-PI/2);g.translate(0,top-depth-bev,0);return g}
function uvXZ(g,hx,hz){const p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+hx)/(2*hx),1-(p.getZ(i)+hz)/(2*hz));u.needsUpdate=true}

// ---------- bolas ----------
const COL=['#f3eee0','#f2c21b','#1d4fb8','#d02a1e','#5b2a86','#f07a17','#1d7a3a','#7a1f1f','#141414'];
function texBola(ctex,n){return ctex('bola-'+n,256,128,(g,w,h)=>{const c=COL[n>8?n-8:n];g.fillStyle=n>8||!n?COL[0]:c;g.fillRect(0,0,w,h);
 if(n>8){g.fillStyle=c;g.fillRect(0,h*.2,w,h*.6)}
 [w*.25,w*.75].forEach(x=>{if(!n){g.fillStyle='#c0262a';g.beginPath();g.arc(x,h/2,5,0,7);g.fill();return}
  g.fillStyle='#f7f3e8';g.beginPath();g.arc(x,h/2,22,0,7);g.fill();g.fillStyle='#151515';g.font='bold '+(n>9?24:29)+'px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';
  g.fillText(n,x,h/2+1);if(n==6||n==9)g.fillRect(x-7,h/2+13,14,2.5)})})}
// triángulo de 8: la 1 en la punta (sobre el pie), la 8 al centro, lisa y rayada en las esquinas de atrás
const ORD=[1,9,2,10,8,3,11,7,14,4,5,13,15,6,12];
function acomodo(){const o=[[D.cabeza[0],D.cabeza[1]]],g=R+.0007;let k=0;
 for(let i=0;i<5;i++)for(let j=0;j<=i;j++)o[ORD[k++]]=[D.pie[0]+i*Math.sqrt(3)*g,(2*j-i)*g];return o}

// ---------- tacos (LOTE: una malla para todos) ----------
// de abajo hacia arriba: goma, casquillo, puño, antebrazo, unión, flecha, virola y suela; 1.47 m reales
const TACO=[[.02,.022,.022,'#111111'],[.35,.022,.021,'#3a1a0c'],[.3,.021,.0195,'#1a1a1a'],[.42,.0195,.0165,'#8a4a1c'],[.03,.0168,.0168,'#e9dcc0'],[.94,.0165,.0095,'#e8d2a6'],[.03,.0095,.0095,'#f4f1ea'],[.012,.0093,.0093,'#2a5a8a']];
function taco(LT,x,y,z){let h=y;TACO.forEach(([l,r0,r1,c])=>{LT.cyl(r1,r0,l,c,x,h+l/2,z,12);h+=l})}

// ---------- la lámpara: barra con tres campanas de vidrio verde ----------
function lampara(G,std,y,top){const L0=new THREE.Group();L0.position.y=y;G.add(L0);
 const bar=std(0x3a2414,.4),lat=std(0xc9a24a,.32,{metalness:.85}),vid=std(0x1f7a46,.22,{emissive:0x0e3a20,emissiveIntensity:.7,metalness:.1});
 const b=new THREE.Mesh(new THREE.BoxGeometry(2.7,.08,.14),bar);b.position.y=.3;L0.add(b);
 [[-1.3,.06],[1.3,.06]].forEach(([x])=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.18),lat);t.position.set(x,.3,0);L0.add(t);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,top-y-.34,6),lat);c.position.set(x,(top-y+.34)/2,0);L0.add(c)});
 const pr=[[.27,0],[.26,.03],[.22,.09],[.15,.16],[.08,.22],[.05,.27],[.035,.3]].map(p=>new V2(p[0],p[1])),sg=new THREE.LatheGeometry(pr,28),
  glow=new THREE.MeshBasicMaterial({color:0xfff1cf,toneMapped:false}),inn=new THREE.MeshBasicMaterial({color:0xffe9b8,side:THREE.BackSide,toneMapped:false});
 [-.88,0,.88].forEach(x=>{const s=new THREE.Mesh(sg,vid);s.position.set(x,0,0);L0.add(s);const i=new THREE.Mesh(sg,inn);i.scale.setScalar(.97);i.position.set(x,.005,0);L0.add(i);
  const f=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),glow);f.position.set(x,.08,0);L0.add(f);
  const k=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.05,10),lat);k.position.set(x,.32,0);L0.add(k)});
 const luz=new THREE.PointLight(0xfff0d2,13,7.5,1.45);luz.position.set(0,-.25,0);L0.add(luz);return {g:L0,luz}}

// ---------- la mesa ----------
// e: {S,hits,std,ctex,x,z,ry,hit,top(alto del techo)}; devuelve {G,bolas,luz,D,OB:[círculos en el mundo]}
function build(e){const {S,hits,std,ctex}=e,G=new THREE.Group();G.position.set(e.x||0,0,e.z||0);G.rotation.y=e.ry||0;S.add(G);
 const pano=ctex('billar-pano',512,256,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,20,w/2,h/2,w*.62);gr.addColorStop(0,'#237a46');gr.addColorStop(1,'#185e34');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<5200;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.05)';g.fillRect(Math.random()*w,Math.random()*h,1.4,1.4)}
  const hx=L/2+CW;[D.cabeza[0],D.pie[0]].forEach(x=>{g.fillStyle='rgba(10,20,12,.75)';g.beginPath();g.arc((x+hx)/(2*hx)*w,h/2,2.6,0,7);g.fill()})});
 const M={pano:std(0xffffff,.93,{map:pano}),banda:std(0x1b6838,.9),hoyo:new THREE.MeshBasicMaterial({color:0x040302}),garg:std(0x1c130d,.9,{side:THREE.BackSide}),
  riel:new THREE.MeshPhysicalMaterial({color:0x5a2a12,roughness:.4,clearcoat:.6,clearcoatRoughness:.28}),fald:std(0x3a1a0b,.48),mold:std(0x24100a,.5),
  lat:std(0xc9a24a,.3,{metalness:.85}),cuero:std(0x2a1a10,.55),perla:std(0xf4f0e6,.28,{emissive:0x302d26})};
 const add=(geo,m,x,y,z,sh)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);o.castShadow=sh!==false;o.receiveShadow=true;G.add(o);return o};
 const hx=L/2+CW,hz=A/2+CW,ox=hx+RW,oz=hz+RW;
 // paño con las buchacas mordidas; abajo de cada hoyo, su garganta oscura
 const bed=new THREE.ShapeGeometry(new THREE.Shape(muescas(hx-.003,hz-.003,P,-1)));bed.rotateX(-PI/2);uvXZ(bed,hx,hz);add(bed,M.pano,0,Y,0,false);
 P.forEach(p=>{add(new THREE.CylinderGeometry(p.r+.004,p.r*.85,.16,22,1,true),M.garg,p.x,Y-.078,p.z,false);
  const d=new THREE.Mesh(new THREE.CircleGeometry(p.r*.86,22),M.hoyo);d.rotation.x=-PI/2;d.position.set(p.x,Y-.155,p.z);G.add(d)});
 // bandas
 BANDAS.forEach(b=>add(alza(new THREE.Shape(b.map(([x,z])=>new V2(x,-z))),CH-.01,.005,RT),M.banda));
 // riel de madera con las muescas, forro de cuero en cada buchaca y esquinas de latón
 const rs=rrect(ox,oz,.05);rs.holes.push(new THREE.Path(muescas(hx,hz,P.map(p=>Object.assign({},p,{r:p.r+.01})),1)));add(alza(rs,.1,.014,RT),M.riel);
 P.forEach(p=>{const esq=p.ox!==0,arc=esq?PI*1.25:PI*1.02,to=Math.atan2(p.oz,p.ox),g=new THREE.TorusGeometry(p.r+.012,.016,6,22,arc);
  g.rotateX(PI/2);g.rotateY(-(to-arc/2));g.scale(1,.6,1);add(g,M.cuero,p.x,RT-.002,p.z,false)});
 [-1,1].forEach(sx=>[-1,1].forEach(sz=>{add(new THREE.BoxGeometry(.22,.11,.016),M.lat,sx*(ox-.1),RT-.07,sz*(oz+.008),false);add(new THREE.BoxGeometry(.016,.11,.22),M.lat,sx*(ox+.008),RT-.07,sz*(oz-.1),false)}));
 // diamantes de nácar: a octavos en las largas y a cuartos en las cortas
 if(window.LOTE){const LT=LOTE(),dg=()=>new THREE.CircleGeometry(.021,4).rotateX(-PI/2);
  [-3,-2,-1,1,2,3].forEach(i=>[-1,1].forEach(s=>LT.geo(dg(),'#ffffff',i*L/8,RT+.002,s*(hz+RW/2))));
  [-1,0,1].forEach(i=>[-1,1].forEach(s=>LT.geo(dg(),'#ffffff',s*(hx+RW/2),RT+.002,i*A/4)));const dm=LT.mesh(M.perla);G.add(dm)}
 // faldón con moldura, placa de latón, canastas de cuero en las buchacas y patas torneadas
 const fb=RT-.128,fh=.2,ft=.06;[-1,1].forEach(s=>{add(new THREE.BoxGeometry(2*ox-.04,fh,ft),M.fald,0,fb-fh/2+.01,s*(oz-.02-ft/2));add(new THREE.BoxGeometry(ft,fh,2*oz-.04-2*ft),M.fald,s*(ox-.02-ft/2),fb-fh/2+.01,0);
  add(new THREE.BoxGeometry(2*ox-.02,.035,.03),M.mold,0,fb-fh+.02,s*(oz-.035));add(new THREE.BoxGeometry(.03,.035,2*oz-.05),M.mold,s*(ox-.035),fb-fh+.02,0)});
 add(new THREE.BoxGeometry(.34,.07,.008),M.lat,0,fb-fh/2,oz-.02+.004,false);
 const cp=[[.12,.24],[.115,.2],[.1,.12],[.08,.05],[.05,.01],[.001,0]].map(q=>new V2(q[0],q[1])).reverse(),cg=new THREE.LatheGeometry(cp,16);
 P.forEach(p=>add(cg,M.cuero,p.x,fb-fh-.13,p.z));
 const lp=[[.001,0],[.13,0],[.13,.04],[.1,.07],[.075,.16],[.105,.3],[.12,.4],[.09,.5],[.065,.62],[.09,.72],[.11,.8],[.11,fb-fh+.02],[.001,fb-fh+.02]].map(q=>new V2(q[0],q[1])),lg=new THREE.LatheGeometry(lp,18);
 [-1,1].forEach(sx=>[-1,1].forEach(sz=>add(lg,M.fald,sx*(L/2-.42),0,sz*(A/2-.08))));
 // gises en dos esquinas
 [[-1,1],[1,-1]].forEach(([sx,sz])=>add(new THREE.BoxGeometry(.045,.04,.045),std(0x2a63b8,.8),sx*(hx+RW*.55),RT+.02,sz*(hz+RW*.55)));
 // bolas
 const sg=new THREE.SphereGeometry(R,18,12),pos=acomodo(),bolas=[];
 for(let n=0;n<16;n++){const b=new THREE.Mesh(sg,std(0xffffff,.16,{map:texBola(ctex,n)}));b.position.set(pos[n][0],Y+R,pos[n][1]);
  b.rotation.set(Math.random()*7,Math.random()*7,Math.random()*7);b.castShadow=true;b.userData.n=n;G.add(b);bolas.push(b)}
 // golpes: la mesa y sus bolas se tocan (el aviso de próximamente o, después, abrir la partida)
 if(e.hit)G.traverse(o=>{if(o.isMesh){o.userData.hit=e.hit;hits.push(o)}});
 const lm=e.top?lampara(G,std,2.72,e.top):null;
 // choques (en el mundo): tres círculos a lo largo
 G.updateMatrixWorld(true);const OB=[-.9,0,.9].map(x=>{const v=new THREE.Vector3(x,0,0).applyMatrix4(G.matrixWorld);return {x:v.x,z:v.z,r:1.11}});
 return {G,bolas,luz:lm&&lm.luz,lampara:lm&&lm.g,D,OB}}

// ---------- taquera de pared (mira a +z; z=0 es la pared) ----------
function taquera(e){const {S,std}=e,G=new THREE.Group();G.position.set(e.x,0,e.z);G.rotation.y=e.ry||0;S.add(G);
 const wd=std(0x3a1f10,.5),wd2=std(0x24130a,.55),bx=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;G.add(o);return o};
 bx(1.42,2.02,.05,wd,0,1.28,.025);bx(1.5,.08,.09,wd2,0,2.32,.06);bx(1.5,.08,.09,wd2,0,.26,.06);
 bx(1.42,.07,.24,wd2,0,.4,.14);bx(1.42,.09,.13,wd2,0,1.95,.1);
 if(window.LOTE){const LT=LOTE();for(let i=0;i<6;i++)taco(LT,-.55+i*.22,.44,.16);
  // gises en la repisa
  for(let i=0;i<3;i++)LT.box(.045,.045,.045,'#2a63b8',.42+i*.07,.46,.2);const m=LT.mesh(std(0xffffff,.45));m.castShadow=true;G.add(m)}
 // triángulo colgado de una clavija
 const tri=new THREE.Mesh(new THREE.TorusGeometry(.22,.022,4,3),std(0x6a3a1a,.5));tri.rotation.z=PI/2;tri.position.set(-.95,1.55,.06);tri.castShadow=true;G.add(tri);
 bx(.03,.03,.08,std(0xc9a24a,.3,{metalness:.85}),-.95,1.75,.05);return G}

// ---------- marcador de cuentas (mira a +z) ----------
function marcador(e){const {S,std}=e,G=new THREE.Group();G.position.set(e.x,e.y,e.z);G.rotation.y=e.ry||0;S.add(G);
 const wd=std(0x3a1f10,.45),fr=(w,h,d,x,y)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wd);o.position.set(x,y,d/2);o.castShadow=true;G.add(o)};
 fr(2,.08,.08,0,.26);fr(2,.08,.08,0,-.26);fr(.08,.6,.08,-.96,0);fr(.08,.6,.08,.96,0);fr(.06,.44,.05,0,0);fr(1.84,.44,.02,0,0);
 if(window.LOTE){const LT=LOTE();[.1,-.1].forEach((y,k)=>{LT.cyl(.006,.006,1.84,'#c9a24a',0,y,.07,6,0,0,PI/2);
   const izq=k?7:4;for(let i=0;i<20;i++){const x=i<izq?-.88+i*.06:.88-(19-i)*.06;LT.cyl(.035,.035,.055,Math.floor(i/5)%2?'#1a1a1a':'#efe6d0',x,y,.07,12,0,0,PI/2)}});
  const m=LT.mesh(std(0xffffff,.35));m.castShadow=true;G.add(m)}
 return G}

window.BIL={build,taquera,marcador,D};
})();
