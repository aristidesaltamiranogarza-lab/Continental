// c_casino3d.js — CAS3: mesas de casino hechas en código para el salón del sótano (c_sotano_salon.js).
// Blackjack: media luna con el paño impreso (paga 3 a 2, reglas del crupier, seguro y 5 casillas), charola de fichas, zapato, tarima del crupier,
//   descartes, letrero de apuestas y 5 lugares. Póker: ovalada con pista de madera, portavasos, charola del crupier, baraja,
//   botón de dealer y 8 lugares (el crupier al centro del lado de atrás). Vacías por ahora; listas para jugarse:
//   cada una devuelve {G, lugares:[{x,z,ry}] en el mundo, sillas:[grupos], OB:[círculos], D (medidas en el espacio de la mesa)}.
// CAS3.silla(std) = silla acolchada (una malla); CAS3.campana(...) = lámpara colgante.
(function(){
if(typeof THREE==='undefined')return;
const V2=THREE.Vector2,PI=Math.PI;
const grupo=(S,e)=>{const G=new THREE.Group();G.position.set(e.x||0,0,e.z||0);G.rotation.y=e.ry||0;S.add(G);return G};
const malla=(G,geo,m,x,y,z,sh)=>{const o=new THREE.Mesh(geo,m);o.position.set(x||0,y||0,z||0);o.castShadow=sh!==false;o.receiveShadow=true;G.add(o);return o};
function uvRect(g,x0,x1,z0,z1){const p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)-x0)/(x1-x0),1-(p.getZ(i)-z0)/(z1-z0));u.needsUpdate=true}
function alza(shape,depth,bev,top){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:24});
 g.rotateX(-PI/2);g.translate(0,top-depth-bev,0);return g}
function plano(shape,y){const g=new THREE.ShapeGeometry(shape,24);g.rotateX(-PI/2);g.translate(0,y,0);return g}
// del espacio de la mesa al mundo
const mundo=(G,x,z)=>{G.updateMatrixWorld(true);const v=new THREE.Vector3(x,0,z).applyMatrix4(G.matrixWorld);return v};

// ---------- texturas ----------
function fieltro(g,w,h,c0,c1){const gr=g.createRadialGradient(w/2,h*.45,10,w/2,h/2,w*.6);gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<w*h/80;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.03)':'rgba(0,0,0,.05)';g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5)}}
// texto curvo alrededor de (cx,cy) a radio r, centrado hacia abajo (lo lee quien está abajo de la textura)
function curvo(g,t,cx,cy,r,font,col,sp){g.save();g.font=font;g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';
 const cs=[...t],ws=cs.map(c=>g.measureText(c).width+(sp||0)),tot=ws.reduce((p,q)=>p+q,0);let an=PI/2+tot/2/r;
 cs.forEach((c,i)=>{const q=an-ws[i]/2/r;g.save();g.translate(cx+Math.cos(q)*r,cy+Math.sin(q)*r);g.rotate(q-PI/2);g.fillText(c,0,0);g.restore();an-=ws[i]/r});g.restore()}
const FICHAS={blanca:['#f2eee4','#b3262e'],roja:['#c81f2a','#f4f1ea'],azul:['#1f4fb0','#f4f1ea'],verde:['#178a45','#f4f1ea'],naranja:['#e07b1a','#f4f1ea'],negra:['#141414','#e9c46a'],morada:['#6a2391','#f4f1ea']};
// sombra suave de contacto (una mancha difusa sobre el paño) para lo que está encima de la mesa
function sombra(G,ctex,x,y,z,w,d,ry,op){const t=ctex('sombra-blanda',64,64,(g,W,H)=>{const r=g.createRadialGradient(W/2,H/2,2,W/2,H/2,W/2);r.addColorStop(0,'rgba(0,0,0,1)');r.addColorStop(.55,'rgba(0,0,0,.6)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,W,H)});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:t,color:0,transparent:true,opacity:op||.55,depthWrite:false}));m.rotation.set(-PI/2,0,ry||0);m.position.set(x,y,z);m.renderOrder=1;G.add(m);return m}
// orilla de una pila de fichas acostadas: cuatro fichas por cuadro, cada una con sus manchas un poco giradas, y la raya entre ficha y ficha
function texFicha(ctex,k){const [b,s]=FICHAS[k],t=ctex('ficha4-'+k,64,64,(g,w,h)=>{g.fillStyle=b;g.fillRect(0,0,w,h);
  for(let c=0;c<4;c++){const y=c*16,o=(c*23)%16;g.fillStyle=s;for(let i=0;i<4;i++){const x=(o+i*16)%w;g.fillRect(x,y+3,6,10);g.fillRect(x-w,y+3,6,10)}
   g.fillStyle='rgba(0,0,0,.45)';g.fillRect(0,y+14.5,w,1.5)}},1);t.repeat.set(1,10);return t}
function texReverso(ctex){return ctex('carta-reverso',64,96,(g,w,h)=>{g.fillStyle='#f4f1ea';g.fillRect(0,0,w,h);g.fillStyle='#a3202a';g.fillRect(5,5,w-10,h-10);
 g.strokeStyle='rgba(255,230,220,.55)';g.lineWidth=1.5;for(let i=-h;i<w+h;i+=8){g.beginPath();g.moveTo(i,5);g.lineTo(i+h,h-5);g.stroke();g.beginPath();g.moveTo(i+h,5);g.lineTo(i,h-5);g.stroke()}})}
// charola de fichas: caja de madera con canaletas; los tubos van acostados a lo largo de z, medio hundidos
function charola(G,std,ctex,x,y,z,w,dz,ks){const md=std(0x2a160b,.4),fo=std(0x120a06,.8),D=dz+.06,n=ks.length,sp=(w-.08)/n;
 malla(G,new THREE.BoxGeometry(w,.016,D),md,x,y-.017,z);malla(G,new THREE.BoxGeometry(w-.04,.004,dz),fo,x,y-.007,z,false);
 [-1,1].forEach(k=>{malla(G,new THREE.BoxGeometry(w,.05,.025),md,x,y+.008,z+k*(D/2-.0125));malla(G,new THREE.BoxGeometry(.025,.05,D),md,x+k*(w/2-.0125),y+.008,z)});
 for(let i=1;i<n;i++)malla(G,new THREE.BoxGeometry(.006,.026,dz),md,x-w/2+.04+sp*i,y+.006,z);
 ks.forEach((k,i)=>{const c=malla(G,new THREE.CylinderGeometry(.031,.031,dz-.01,18),std(0xffffff,.42,{map:texFicha(ctex,k)}),x-w/2+.04+sp*(i+.5),y+.024,z);c.rotation.x=PI/2});
 sombra(G,ctex,x,y-.024,z+.02,w+.16,D+.14,0,.6)}

// ---------- silla acolchada (mira a +z, respaldo atrás) ----------
function silla(std,cuero){const G=new THREE.Group();if(!window.LOTE)return G;const LT=LOTE(),md='#2a160c',cu=cuero||'#6a1c1c',me='#c9a24a';
 [[-.3,-.28],[.3,-.28],[-.3,.28],[.3,.28]].forEach(([x,z])=>LT.cyl(.026,.036,.84,md,x,.42,z,8));
 [[-.3,.28],[.3,.28]].forEach(([x,z])=>LT.cyl(.03,.03,.02,me,x,.12,z,8));
 LT.box(.7,.03,.03,md,0,.28,.28);LT.box(.7,.03,.03,md,0,.28,-.28);
 LT.box(.78,.07,.74,md,0,.865,0);LT.box(.72,.12,.68,cu,0,.95,.01);LT.bola(.36,1,.18,.95,cu,0,1.0,.02,1);
 [-1,1].forEach(s=>LT.box(.06,.86,.06,md,s*.34,1.3,-.34,0,-.06,0));
 LT.box(.64,.56,.1,cu,0,1.36,-.34,0,-.06,0);LT.box(.78,.08,.09,md,0,1.72,-.37,0,-.06,0);
 // botones del capitoné
 for(let i=0;i<3;i++)for(let j=0;j<2;j++)LT.bola(.018,1,1,.5,'#3a0e0e',-.18+i*.18,1.22+j*.25,-.285+j*.016,0);
 const m=LT.mesh(std(0xffffff,.55));m.castShadow=true;m.receiveShadow=true;G.add(m);return G}

// ---------- lámpara colgante: campana de esmalte verde con su foco (la luz la pone quien la usa) ----------
function campana(G,std,x,y,z,top,s){s=s||1;const pr=[[.3,0],[.29,.03],[.24,.1],[.16,.17],[.09,.22],[.05,.26],[.04,.3]].map(p=>new V2(p[0]*s,p[1]*s)),sg=new THREE.LatheGeometry(pr,28);
 const sh=new THREE.Mesh(sg,std(0x1d3a2a,.35,{metalness:.45}));sh.position.set(x,y,z);G.add(sh);
 const i=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({color:0xfff1d8,side:THREE.BackSide,toneMapped:false}));i.scale.setScalar(.97);i.position.set(x,y+.004,z);G.add(i);
 const b=new THREE.Mesh(new THREE.SphereGeometry(.065*s,12,8),new THREE.MeshBasicMaterial({color:0xfff3d6,toneMapped:false}));b.position.set(x,y+.09*s,z);G.add(b);
 const c=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,top-y-.3*s,6),std(0x151515,.6));c.position.set(x,(top+y+.3*s)/2,z);G.add(c);return sh}
function luz(G,x,y,z,i,d){const l=new THREE.PointLight(0xffe2b0,i||10,d||6.5,1.5);l.position.set(x,y,z);G.add(l);return l}

// ---------- Blackjack ----------
// el crupier del lado -z (orilla recta en z=0), los jugadores en el arco hacia +z; el arco es un círculo con centro en (0,-CZ)
const CZ=.55,RB=2.2,BJN=5,BJQ=.5,BJRC=1.78,BJRS=2.95;   // media luna: radio, 5 lugares (ángulo entre ellos), radio de las casillas y de las sillas
const bjAng=i=>PI/2+((BJN-1)/2-i)*BJQ;
function texBJ(ctex){const s=1024/(2*RB);return ctex('bj-pano5',1024,Math.round((RB-CZ+.1)*s),(g,w,h)=>{fieltro(g,w,h,'#17734a','#0d4d31');const cx=w/2,cy=(-CZ+.1)*s,oro='#e9c46a';
 curvo(g,'BLACKJACK PAGA 3 A 2',cx,cy,.8*s,'800 33px Georgia,serif',oro,2);
 curvo(g,'EL CRUPIER PIDE CON 16 Y SE PLANTA CON 17',cx,cy,.96*s,'700 17px Arial,sans-serif','#f1ead6',1.5);
 g.strokeStyle=oro;g.lineWidth=2.5;[1.06,1.24].forEach(r=>{g.beginPath();g.arc(cx,cy,r*s,PI/2-1.1,PI/2+1.1);g.stroke()});
 curvo(g,'SEGURO PAGA 2 A 1',cx,cy,1.15*s,'800 21px Georgia,serif',oro,3);
 for(let i=0;i<BJN;i++){const q=bjAng(i),x=cx+Math.cos(q)*BJRC*s,y=cy+Math.sin(q)*BJRC*s;
  g.fillStyle='rgba(0,0,0,.14)';g.beginPath();g.arc(x,y,.13*s,0,7);g.fill();g.strokeStyle=oro;g.lineWidth=3;g.stroke();g.lineWidth=1.2;g.beginPath();g.arc(x,y,.13*s-6,0,7);g.stroke()}})}
function blackjack(e){const {S,hits,std,ctex}=e,TH=e.TH||1.5,G=grupo(S,e),hit=e.hit;
 const seg=(r,z0)=>{const t0=Math.asin((CZ+z0)/r),p=[];for(let i=0;i<=56;i++){const t=t0+(PI-2*t0)*i/56;p.push(new V2(Math.cos(t)*r,-(-CZ+Math.sin(t)*r)))}return new THREE.Shape(p)};
 const wd=new THREE.MeshPhysicalMaterial({color:0x4a2210,roughness:.42,clearcoat:.5,clearcoatRoughness:.3}),cu=std(0x1a110c,.42),blk=std(0x151515,.5);
 // paño impreso, cuerpo de madera, orilla del crupier y el acolchado de los jugadores
 const pg=plano(seg(RB-.1,0),TH);uvRect(pg,-RB,RB,-.1,RB-CZ);malla(G,pg,std(0xffffff,.95,{map:texBJ(ctex)}),0,0,0,false);
 malla(G,alza(seg(RB-.04,-.03),.16,.012,TH-.004),wd);
 const xr=Math.sqrt((RB-.04)**2-CZ*CZ);malla(G,new THREE.BoxGeometry(2*xr,.07,.1),wd,0,TH+.02,-.035);
 const t0=Math.asin(CZ/(RB-.06)),ar=PI-2*t0,tg=new THREE.TorusGeometry(RB-.06,.085,10,64,ar);tg.rotateX(PI/2);tg.scale(1,.75,1);tg.rotateY(-t0);malla(G,tg,cu,0,TH+.04,-CZ);
 [t0,PI-t0].forEach(t=>{const b=malla(G,new THREE.SphereGeometry(.085,12,8),cu,Math.cos(t)*(RB-.06),TH+.04,-CZ+Math.sin(t)*(RB-.06));b.scale.y=.75});
 // patas: dos pedestales con su pie
 [-1,1].forEach(sx=>{malla(G,new THREE.CylinderGeometry(.1,.12,TH-.2,16),blk,sx*.95,(TH-.2)/2,.55);malla(G,new THREE.BoxGeometry(.7,.05,.5),blk,sx*.95,.025,.55)});
 // charola de fichas, zapato (a la izquierda del crupier), descartes y letrero de apuestas
 charola(G,std,ctex,0,TH+.026,.19,.96,.22,['blanca','roja','azul','verde','naranja','negra','morada']);
 const rv=std(0xffffff,.6,{map:texReverso(ctex)}),bl=std(0xf4f1ea,.6);
 // zapato: caja vino con filos de latón, cara negra con la boca y la carta que asoma; se ven los cantos de las barajas por los lados
 const zp=new THREE.Group();zp.position.set(.76,TH,.2);zp.rotation.y=.42;G.add(zp);const zm=std(0x5a0c12,.3,{metalness:.1}),lat=std(0xc9a24a,.3,{metalness:.85}),ne=std(0x141010,.5);
 const canto=std(0xffffff,.7,{map:ctex('bj-cantos',8,64,(g,w,h)=>{g.fillStyle='#efe9dc';g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.2)';for(let i=0;i<h;i+=3)g.fillRect(0,i,w,1)})});
 malla(zp,new THREE.BoxGeometry(.17,.012,.36),zm,0,.006,0);[-1,1].forEach(k=>{malla(zp,new THREE.BoxGeometry(.012,.1,.36),zm,k*.079,.05,0);malla(zp,new THREE.BoxGeometry(.004,.06,.3),canto,k*.072,.042,0,false);
  malla(zp,new THREE.BoxGeometry(.016,.008,.36),lat,k*.079,.103,0)});
 malla(zp,new THREE.BoxGeometry(.17,.1,.012),zm,0,.05,-.174);malla(zp,new THREE.BoxGeometry(.146,.006,.3),zm,0,.098,-.02);
 const fr=new THREE.Group();fr.position.set(0,.055,.18);fr.rotation.x=.5;zp.add(fr);malla(fr,new THREE.BoxGeometry(.17,.1,.014),ne,0,0,0);malla(fr,new THREE.BoxGeometry(.17,.008,.018),lat,0,.052,0);
 malla(fr,new THREE.BoxGeometry(.12,.012,.02),std(0x050404,.9),0,-.03,.002,false);
 malla(zp,new THREE.BoxGeometry(.13,.004,.07),bl,0,.004,.215,false);malla(zp,new THREE.PlaneGeometry(.125,.065),rv,0,.0065,.215,false).rotation.x=-PI/2;
 sombra(G,ctex,.76,TH+.002,.2,.3,.5,.42,.6);
 // descartes: charolita del mismo vino con respaldo y lados bajos, las cartas usadas boca abajo
 const dsc=new THREE.Group();dsc.position.set(-.76,TH,.2);dsc.rotation.y=-.42;G.add(dsc);
 malla(dsc,new THREE.BoxGeometry(.2,.01,.27),zm,0,.005,0);malla(dsc,new THREE.BoxGeometry(.2,.1,.012),zm,0,.05,-.13);[-1,1].forEach(k=>malla(dsc,new THREE.BoxGeometry(.012,.05,.27),zm,k*.094,.025,0));
 malla(dsc,new THREE.BoxGeometry(.2,.008,.012),lat,0,.1,-.13);
 malla(dsc,new THREE.BoxGeometry(.17,.05,.24),canto,0,.035,.005);malla(dsc,new THREE.PlaneGeometry(.17,.24),rv,0,.0605,.005,false).rotation.x=-PI/2;
 sombra(G,ctex,-.76,TH+.002,.2,.3,.4,-.42,.6);
 const lt=ctex('bj-limite',256,150,(g,w,h)=>{g.fillStyle='#1a1410';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=5;g.strokeRect(6,6,w-12,h-12);
  g.fillStyle='#e9c46a';g.textAlign='center';g.font='800 30px Georgia,serif';g.fillText('BLACKJACK',w/2,50);g.fillStyle='#f1ead6';g.font='700 26px Arial,sans-serif';g.fillText('Mín $10 · Máx $500',w/2,102)});
 const pl=new THREE.Group();pl.position.set(-1.68,TH,.04);pl.rotation.y=.5;G.add(pl);malla(pl,new THREE.BoxGeometry(.24,.02,.06),blk,0,.01,0);
 const pp=malla(pl,new THREE.PlaneGeometry(.24,.14),new THREE.MeshBasicMaterial({map:lt}),0,.09,.0,false);pp.rotation.x=-.25;
 // tarima del crupier (detrás de la orilla recta; el personaje chibi no alcanza la mesa desde el piso)
 malla(G,new THREE.BoxGeometry(1.4,.38,.8),std(0x2a1a10,.7),0,.19,-.43);
 if(hit)G.traverse(o=>{if(o.isMesh){o.userData.hit=hit;hits.push(o)}});
 // 7 lugares frente a sus casillas
 const lugares=[],sillas=[];for(let i=0;i<BJN;i++){const q=bjAng(i),x=Math.cos(q)*BJRS,z=-CZ+Math.sin(q)*BJRS,c=silla(std,e.cuero);
  c.position.set(x,0,z);c.rotation.y=Math.atan2(-x,-(z+CZ));G.add(c);sillas.push(c);const w=mundo(G,x,z);lugares.push({x:w.x,z:w.z,ry:c.rotation.y+(e.ry||0)})}
 const OB=[[0,.6,1.2],[-1.45,.2,.75],[1.45,.2,.75]].map(([x,z,r])=>{const w=mundo(G,x,z);return {x:w.x,z:w.z,r}}).concat(lugares.map(l=>({x:l.x,z:l.z,r:.42})));
 return {G,lugares,sillas,OB,D:{TH,CZ,RB,crupier:[0,-.3],tarima:.38,zapato:[.76,.2],casillas:[...Array(BJN)].map((_,i)=>{const q=bjAng(i);return [Math.cos(q)*BJRC,-CZ+Math.sin(q)*BJRC]}),ang:bjAng,CZ,RC:BJRC}}}

// ---------- Póker ----------
// ovalada: rectas de ±PA y cabeceras de radio PB (orilla de afuera del acolchado)
const PA=.95,PB=.95;
const ovalo=r=>{const p=[];for(let i=0;i<=24;i++){const t=-PI/2+PI*i/24;p.push([PA+Math.cos(t)*r,Math.sin(t)*r])}for(let i=0;i<=24;i++){const t=PI/2+PI*i/24;p.push([-PA+Math.cos(t)*r,Math.sin(t)*r])}return p};
const forma=r=>new THREE.Shape(ovalo(r).map(([x,z])=>new V2(x,-z))),hueco=r=>new THREE.Path(ovalo(r).map(([x,z])=>new V2(x,-z)));
// punto y normal sobre el óvalo de radio r, a la fracción f del perímetro (0 = centro del lado de atrás, -z; avanza hacia +x)
function enOvalo(r,f){const Ls=2*PA,ar=PI*r,P=2*Ls+2*ar;let s=((f%1)+1)%1*P+PA;
 if(s<Ls)return {x:-PA+s,z:-r,nx:0,nz:-1};s-=Ls;if(s<ar){const t=-PI/2+s/r;return {x:PA+Math.cos(t)*r,z:Math.sin(t)*r,nx:Math.cos(t),nz:Math.sin(t)}}s-=ar;
 if(s<Ls)return {x:PA-s,z:r,nx:0,nz:1};s-=Ls;if(s<ar){const t=PI/2+s/r;return {x:-PA+Math.cos(t)*r,z:Math.sin(t)*r,nx:Math.cos(t),nz:Math.sin(t)}}return {x:-PA,z:-r,nx:0,nz:-1}}
class Pista extends THREE.Curve{constructor(r){super();this.r=r}getPoint(t,o){const p=enOvalo(this.r,t);return (o||new THREE.Vector3()).set(p.x,0,p.z)}}
function texPoker(ctex){const s=1024/3.8;return ctex('poker-pano',1024,512,(g,w,h)=>{fieltro(g,w,h,'#22508f','#132f57');const oro='#e3c26a',px=x=>(x+1.9)*s,pz=z=>(z+.95)*s;
 g.strokeStyle=oro;g.lineWidth=3;g.beginPath();ovalo(.43).forEach(([x,z],i)=>i?g.lineTo(px(x),pz(z)):g.moveTo(px(x),pz(z)));g.closePath();g.stroke();
 g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(241,234,214,.85)';g.font='800 17px Arial,sans-serif';g.fillText('CASA DE JUEGOS  ·  TEXAS HOLD\'EM',w/2,190);
 g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=8;g.fillStyle=oro;g.font='italic 800 96px Georgia,serif';g.fillText('Póker',w/2,256);g.shadowBlur=0;
 [['♠','#efe6d0'],['♥','#d8424a'],['♦','#d8424a'],['♣','#efe6d0']].forEach(([c,k],i)=>{g.fillStyle=k;g.font='44px Georgia,serif';g.fillText(c,w/2+(i-1.5)*62,322)})})}
function poker(e){const {S,hits,std,ctex}=e,TH=e.TH||1.5,G=grupo(S,e),hit=e.hit;
 const wd=new THREE.MeshPhysicalMaterial({color:0x4a2210,roughness:.4,clearcoat:.55,clearcoatRoughness:.28}),cu=std(0x15100c,.42),blk=std(0x151515,.5);
 const pg=plano(forma(.63),TH);uvRect(pg,-1.9,1.9,-.95,.95);malla(G,pg,std(0xffffff,.95,{map:texPoker(ctex)}),0,0,0,false);
 const pis=forma(.79);pis.holes.push(hueco(.62));malla(G,alza(pis,.018,.004,TH+.026),wd);
 malla(G,alza(forma(PB-.03),.17,.012,TH-.004),wd);
 const tg=new THREE.TubeGeometry(new Pista(PB-.09),220,.09,12,true);tg.scale(1,.75,1);malla(G,tg,cu,0,TH+.06,0);
 [-1,1].forEach(sx=>{malla(G,new THREE.CylinderGeometry(.12,.14,TH-.22,16),blk,sx*.85,(TH-.22)/2,0);malla(G,new THREE.BoxGeometry(.95,.05,.16),blk,sx*.85,.025,0);malla(G,new THREE.BoxGeometry(.16,.05,.8),blk,sx*.85,.025,0)});
 // crupier: charola, baraja; un botón de dealer frente a un jugador
 charola(G,std,ctex,0,TH+.026,-.51,.7,.12,['blanca','roja','roja','verde','negra','morada']);
 const rv=std(0xffffff,.6,{map:texReverso(ctex)}),bl=std(0xf4f1ea,.6);
 malla(G,new THREE.BoxGeometry(.1,.035,.14),[bl,bl,rv,bl,bl,bl],.52,TH+.018,-.33).rotation.y=.2;
 const bt=ctex('boton-dealer',128,128,(g,w,h)=>{g.fillStyle='#f6f3ea';g.fillRect(0,0,w,h);g.fillStyle='#1a1a1a';g.font='900 26px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('DEALER',w/2,h/2)});
 const bd=enOvalo(.48,3/9),boton=malla(G,new THREE.CylinderGeometry(.06,.06,.016,24),[bl,std(0xffffff,.5,{map:bt}),bl],bd.x,TH+.008,bd.z);
 // lugares: 9 a lo largo del óvalo (el 0 es el crupier, sin silla); portavasos en la pista
 const lugares=[],sillas=[];let LT=window.LOTE&&LOTE();
 for(let k=1;k<9;k++){const p=enOvalo(PB+.72,k/9),c=silla(std,e.cuero);c.position.set(p.x,0,p.z);c.rotation.y=Math.atan2(p.nx,p.nz)+PI;G.add(c);sillas.push(c);
  const w=mundo(G,p.x,p.z);lugares.push({x:w.x,z:w.z,ry:c.rotation.y+(e.ry||0)});
  if(LT){const q=enOvalo(.705,k/9+.022);LT.geo(new THREE.TorusGeometry(.045,.009,6,18).rotateX(PI/2),'#c8ccd0',q.x,TH+.03,q.z);LT.geo(new THREE.CircleGeometry(.04,16).rotateX(-PI/2),'#141414',q.x,TH+.028,q.z)}}
 if(LT)G.add(LT.mesh(std(0xffffff,.3,{metalness:.6})));
 if(hit)G.traverse(o=>{if(o.isMesh&&o.parent===G){o.userData.hit=hit;hits.push(o)}});
 const OB=[-.95,0,.95].map(x=>{const w=mundo(G,x,0);return {x:w.x,z:w.z,r:.97}}).concat(lugares.map(l=>({x:l.x,z:l.z,r:.42})));
 return {G,lugares,sillas,OB,D:{TH,PA,PB,crupier:enOvalo(PB+.72,0),boton,enOvalo}}}   // boton y enOvalo: PK3 mueve el botón de dealer

window.CAS3={blackjack,poker,silla,campana,luz};
})();
