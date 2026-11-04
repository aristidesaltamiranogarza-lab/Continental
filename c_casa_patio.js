// c_casa_patio.js — CPAT: el patio trasero (Bloque D, fase D4). c_casa_pb.js lo llama al armar la planta baja (CPAT.build(kit)).
// La fachada de atrás es parte de la planta baja y entra al corte de paredes: muro amarillo con la puerta de arco del comedor
// (puertas de vidrio abiertas y abanico), las ventanas del comedor, la cocina y el baño vistas desde afuera, cornisa, gárgolas
// y un farol. El patio cuelga del exterior compartido (CIELO.mundo), así también se ve por esas ventanas: corredor de cemento
// rojo y jardín, hamaca entre dos pilares bajo una pérgola con bugambilia, flamboyán con su arriate encalado, lavadero con pila,
// tendedero con un hipil, macetas, la barda alta pintada y copas de árboles (y una palmera) asomando detrás.
// c_casa_amb.js cuelga aquí la hamaca y sienta al gato en el arriate (CPAT.ham, CPAT.gato). Usa CCALLE (tinte, vidrio, luz, zona).
(function(){
if(typeof THREE==='undefined')return;
const PZ=-25.3,BZ=-42.3,BX=17.3,BH=7.2,TER=-31.6,CR=0xefe6d2,HI=0x1c1c1e,PU=-4.2,FL=[-8.6,-36.2],LV=[13.6,-41.2],
 VERD=[0x3f7a35,0x4b8a3c,0x356b2e,0x2f5f2a],BUG=[0xc2185b,0xd81b60,0xad1457,0x9c27b0],ROJ=[0xe8401c,0xf2562a,0xd9361a,0xff6a2a];
let EXT=null,rs=29;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280,pick=a=>a[(rnd()*a.length)|0];
const CP={build,ham:null,gato:null};

function build(k){const CC=window.CCALLE;if(!window.LOTE||!CC)return;const {OB,std,PB,cal,tabique,B,MS,WL}=k;
 // el muro de atrás: caras del comedor, la cocina y el baño (adentro) y la del patio, con la puerta de arco del comedor
 const PF={m:CC.tinte(std(0xffffff,.92,{map:cal('patf','#e9bd5a')})),lam:CC.tinte(std(0x9a6a2a,.9)),lamH:1,rod:CC.tinte(std(0xf2ead8,.8))};
 const {fb}=tabique('x',PZ+.15,1,[[-17,-1.15,MS.com],[-.85,12,MS.coc],[12.3,17,MS.ban]],[[-BX,BX,PF]],[{at:PU,w:2.6,h:4.8,arco:1}]);
 fachada(CC.enMundo(fb[0].g),CC);
 B(2.6,.02,.42,std(0x8a8077,.85),PU,.012,PZ+.15).castShadow=false;
 if(!EXT&&window.CIELO)EXT=patio(k,CC);
 if(EXT){CP.ham={P:EXT,x0:2.73,x1:8.47,z:-30.4};CP.gato={P:EXT,x:FL[0]+.55,y:.55,z:FL[1]+1.34,ry:.38}}
 // choques: bardas, pilares, flamboyán, lavadero, tendedero y macetas; se camina todo el patio
 WL.push([-BX,BZ,BX,BZ,.45],[-BX,PZ,-BX,BZ,.45],[BX,PZ,BX,BZ,.45]);
 OB.push({x:2.5,z:-30.4,r:.55},{x:8.7,z:-30.4,r:.55},{x:FL[0],z:FL[1],r:1.75},{x:LV[0]-.85,z:LV[1],r:.85},{x:LV[0]+.85,z:LV[1],r:.85},
  {x:LV[0]-2.4,z:LV[1]+1.1,r:.35},{x:4.4,z:-38.6,r:.3},{x:11,z:-38.6,r:.3});
 MAC.forEach(([x,z])=>OB.push({x,z,r:.55}));
 PB.bx[2]=BZ+.7;PB.cb[2]=BZ+.5;CC.tema()}

// ---------- la fachada de atrás (en la planta baja, dentro de la cara del patio) ----------
function fachada(Q,CC){const L=LOTE(),V=LOTE(),VL=LOTE(),o=kk=>PZ-kk,MD=0x4a2c18,OC=0xe9bd5a;
 // ventanas vistas desde afuera: vidrio (de noche con la luz de adentro), marco de cantera y reja
 [[-9,4.4,3,3.4],[4.6,4.7,2.8,2.2],[15.6,6.2,1.2,1.1]].forEach(([x,y,w,h])=>{V.box(w,h,.02,0xffc470,x,y,o(.02));
  L.box(.06,h,.04,0x2c4a3c,x,y,o(.04));L.box(w,.06,.04,0x2c4a3c,x,y+h*.15,o(.04));
  [-1,1].forEach(s=>L.box(.26,h+.26,.12,CR,x+s*(w/2+.13),y,o(.06)));L.box(w+.8,.3,.16,CR,x,y+h/2+.28,o(.08));L.box(w+.6,.14,.36,CR,x,y-h/2-.07,o(.18));
  const nb=Math.max(3,Math.round(w/.24));for(let i=1;i<nb;i++)L.box(.04,h,.04,HI,x-w/2+i*w/nb,y,o(.14));[.3,.7].forEach(f=>L.box(w,.04,.04,HI,x,y-h/2+h*f,o(.14)))});
 // puerta del comedor: dos hojas de vidrio abiertas contra el muro y el abanico del arco
 [-1,1].forEach(s=>{const x=PU+s*1.98;L.box(1.3,3.45,.06,MD,x,1.75,o(.06));
  [.75,1.85,2.95].forEach(y=>V.box(1.02,.92,.02,0xffc470,x,y,o(.1)))});
 V.geo(new THREE.CircleGeometry(1.3,20,0,Math.PI),0xffc470,PU,3.5,PZ+.15);
 L.geo(new THREE.TorusGeometry(1.25,.06,4,20,Math.PI),MD,PU,3.5,PZ+.15);L.box(2.6,.1,.2,MD,PU,3.5,PZ+.15);
 for(let i=1;i<5;i++){const a=i/5*Math.PI;L.box(.05,1.25,.06,MD,PU+Math.cos(a)*.62,3.5+Math.sin(a)*.62,PZ+.15,0,0,a-Math.PI/2)}
 // farol junto a la puerta
 {const x=-6.6;L.box(.07,.07,.5,HI,x,5.6,o(.25));L.box(.46,.08,.46,HI,x,5.62,o(.55));L.box(.4,.07,.4,HI,x,4.86,o(.55));L.cyl(.02,.12,.18,HI,x,5.75,o(.55),6);
  [[-.17,-.17],[.17,-.17],[-.17,.17],[.17,.17]].forEach(([a,c])=>L.box(.03,.72,.03,HI,x+a,5.24,o(.55+c)));VL.box(.32,.66,.32,0xffd08a,x,5.24,o(.55))}
 // cornisa, pretil con remate y gárgolas de barro
 L.box(2*BX,.22,.3,CR,0,8.71,o(.15));L.box(2*BX+.2,.4,.5,CR,0,9.02,o(.25));L.box(2*BX,1,.3,OC,0,9.72,PZ+.15);L.box(2*BX+.3,.16,.48,CR,0,10.3,PZ+.1);
 [-12,-.5,9.5].forEach(x=>L.box(.32,.26,1.1,0xb5643c,x,9.45,o(.55)));
 const M=L.mesh(CC.tinte(new THREE.MeshStandardMaterial({roughness:.85})));M.castShadow=M.receiveShadow=true;
 Q.add(M,CC.vidrio(V.mesh(new THREE.MeshBasicMaterial({side:THREE.DoubleSide})),0x2a3540),CC.vidrio(VL.mesh(new THREE.MeshBasicMaterial()),0xd8d2c0))}

// ---------- afuera (CIELO.mundo): el patio ----------
const MAC=[[-16.2,-27,'hoja'],[-16.2,-29.6,'sabila'],[-16.1,-40.9,'hoja'],[-7.4,-26.1,'flor'],[-1.2,-26.1,'flor'],[16.2,-26.7,'hoja'],[16.2,-29.4,'sabila'],
 [16.1,-34.5,'hoja',0x2a6fb0],[1.4,-31.3,'flor'],[16.1,-37,'flor',0xf2c230]];
function patio(k,CC){const {ctex,pm,cal}=k,G=new THREE.Group();G.name='patio';CIELO.mundo.add(G);
 const sr=s=>()=>(s=(s*9301+49297)%233280)/233280,tx=(key,rep,draw)=>{const t=ctex(key,256,256,draw,1);t.repeat.set(1/rep,1/rep);return t};
 const tRojo=tx('piso-rojo',3,(g,w,h)=>{const r=sr(4);g.fillStyle='#a8492f';g.fillRect(0,0,w,h);
  for(let i=0;i<1400;i++){g.fillStyle=r()<.5?'rgba(60,20,10,.12)':'rgba(255,200,170,.1)';g.fillRect(r()*w,r()*h,2,2)}
  for(let i=0;i<8;i++){g.fillStyle='rgba(255,220,200,.07)';g.beginPath();g.ellipse(r()*w,r()*h,20+r()*40,6+r()*12,r()*3,0,7);g.fill()}
  g.fillStyle='rgba(50,20,10,.5)';for(let i=0;i<=2;i++){g.fillRect(i*128-1,0,2,h);g.fillRect(0,i*128-1,w,2)}});
 const tJar=tx('jardin',6,(g,w,h)=>{const r=sr(8);g.fillStyle='#6a873c';g.fillRect(0,0,w,h);
  for(let i=0;i<7;i++){g.fillStyle='rgba(130,100,60,.35)';g.beginPath();g.ellipse(r()*w,r()*h,14+r()*30,10+r()*20,r()*3,0,7);g.fill()}
  for(let i=0;i<2600;i++){const c=['rgba(70,110,40,.6)','rgba(120,150,60,.5)','rgba(50,80,30,.5)','rgba(150,140,80,.35)'][(r()*4)|0];g.strokeStyle=c;g.lineWidth=1;
   const x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*3,y-3-r()*5);g.stroke()}});
 const L=LOTE(),Lt=LOTE(),Lj=LOTE(),Lb=LOTE(),F=LOTE(),Ff=LOTE(),L2=LOTE(),F2=LOTE();
 const plano=(Lx,x0,x1,z0,z1)=>{const g=pm(x1-x0,z1-z0);g.rotateX(-Math.PI/2);Lx.geo(g,0xffffff,(x0+x1)/2,0,(z0+z1)/2)};
 // piso: corredor de cemento rojo junto a la casa y jardín; bordillo de ladrillo y pasitos de piedra al lavadero
 plano(Lt,-BX,BX,TER,PZ);plano(Lj,-BX,BX,BZ,TER);L.box(2*BX,.1,.22,0x9a3a26,0,.05,TER);
 [[10.6,-32.6],[11.4,-34],[12,-35.5],[12.5,-37],[12.9,-38.6]].forEach(([x,z])=>L.geo(new THREE.CylinderGeometry(.55,.6,.06,9).scale(1,1,.8),0xa49c8c,x,.03,z,rnd()*3));
 // barda alta pintada (una cara hacia el patio), zócalo y remate; bugambilia asomando por arriba y colgando
 Lb.geo(pm(2*BX,BH),0xc8664a,0,BH/2,BZ);Lb.geo(pm(PZ-BZ,BH),0xe0b062,-BX,BH/2,(PZ+BZ)/2,Math.PI/2);Lb.geo(pm(PZ-BZ,BH),0x9cc7b4,BX,BH/2,(PZ+BZ)/2,-Math.PI/2);
 L.box(2*BX,1,.08,0x8a4434,0,.5,BZ+.04);L.box(.08,1,PZ-BZ,0xa07a3a,-BX+.04,.5,(PZ+BZ)/2);L.box(.08,1,PZ-BZ,0x6a8a7c,BX-.04,.5,(PZ+BZ)/2);
 L.box(2*BX+.4,.2,.42,CR,0,BH+.1,BZ-.05);[-1,1].forEach(s=>L.box(.42,.2,PZ-BZ,CR,s*(BX+.05),BH+.1,(PZ+BZ)/2));
 for(let i=0;i<22;i++)F.bola(.7+rnd()*.5,1.4,.8,1,rnd()<.6?pick(BUG):pick(VERD),-16+rnd()*32,BH+.1+rnd()*.6,BZ+(rnd()-.3)*.8);
 for(let i=0;i<7;i++)F.bola(.5+rnd()*.3,1.2,1.4,.6,rnd()<.65?pick(BUG):pick(VERD),-2+rnd()*8,4.6+rnd()*2.4,BZ+.3);
 // flamboyán con su arriate encalado (el gato se sienta en la orilla) y sus flores caídas
 {const [x,z]=FL;L.cyl(1.6,1.7,.55,0xf2efe6,x,.275,z,24);L.cyl(1.42,1.42,.03,0x4a3424,x,.56,z,24);
  L.cyl(.42,.6,5,0x76675a,x,3.05,z,10);L.cyl(.62,.62,1.3,0xf4f1ea,x,1.2,z,10);
  for(let i=0;i<5;i++)L.rama(0x6b5a4a,x,5,z,4.2+rnd(),.3,.16,i/5*Math.PI*2+.3,.95+rnd()*.25,7);
  for(let i=0;i<26;i++){const a=rnd()*Math.PI*2,d=Math.pow(rnd(),.6)*7.2;Ff.bola(1.5+rnd()*.7,1.6,.55,1.6,pick(VERD),x+Math.cos(a)*d,7.9+(1-d/7.2)*1.1+rnd()*.5,z+Math.sin(a)*d)}
  for(let i=0;i<46;i++){const a=rnd()*Math.PI*2,d=Math.pow(rnd(),.5)*7.4;Ff.bola(.55+rnd()*.35,1.3,.6,1.3,pick(ROJ),x+Math.cos(a)*d,8.5+(1-d/7.4)*1.1+rnd()*.4,z+Math.sin(a)*d)}
  for(let i=0;i<50;i++){const a=rnd()*Math.PI*2,d=1.9+rnd()*5,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;if(pz<TER-.3&&pz>BZ+.3&&px>-BX+.3)L.cyl(.13,.13,.01,pick(ROJ),px,.012,pz,5)}}
 // hamaca entre dos pilares encalados; pérgola de madera con bugambilia (la hamaca la cuelga c_casa_amb.js)
 [2.5,8.7].forEach(x=>{L.box(.86,.6,.86,0x9a8a70,x,.3,-30.4);L.box(.7,5.4,.7,CR,x,3.3,-30.4);L.box(.88,.3,.88,CR,x,6.15,-30.4)});
 L.box(8,.36,.32,0x5a3a22,5.6,6.48,-30.4);L.box(8,.3,.24,0x5a3a22,5.6,6.48,PZ-.12);for(let x=1.8;x<=9.45;x+=.95)L.box(.18,.26,5.7,0x6b4428,x,6.79,-28.15);
 L.cyl(.06,.09,6.2,0x5a4030,2.92,3.4,-30.1,5,0,.06,.05);
 for(let i=0;i<12;i++)F.bola(.6+rnd()*.4,1.3,.6,1.3,rnd()<.65?pick(BUG):pick(VERD),1.8+rnd()*7.6,7.05+rnd()*.3,-25.6-rnd()*5.4);
 for(let i=0;i<4;i++)F.bola(.4,1,1.3,1,i%2?pick(BUG):pick(VERD),3.05,1.6+i*1.2,-30.1);
 // lavadero con pila, llave, jabón y cubeta
 {const [x,z]=LV,cm=0xbdb6a8,cl=0xc9c3b6;L.box(3.4,1.45,1.5,cm,x,.725,z);L.box(1.3,.02,1.2,0x6aa6c8,x-.95,1.46,z);
  [-1,1].forEach(s=>{L.box(1.5,.14,.12,cl,x-.95,1.52,z+s*.69);L.box(.12,.14,1.5,cl,x-.95+s*.69,1.52,z)});
  L.box(1.5,.1,1.3,0xd2ccc0,x+.85,1.5,z+.05,0,-.12,0);for(let i=0;i<6;i++)L.box(1.3,.04,.06,0xb8b2a6,x+.85,1.57+i*.02,z-.4+i*.17,0,-.12,0);
  L.box(.3,.12,.2,0x7ad0a0,x+1.25,1.62,z-.35);L.cyl(.04,.04,.9,0x8a8a84,x-.95,2,BZ+.06,6);L.box(.06,.06,.3,0xc9a24a,x-.95,2.35,BZ+.2);L.box(.2,.04,.04,0xc9a24a,x-.95,2.45,BZ+.12);
  L.cyl(.34,.27,.62,0xd03a2a,x-2.4,.31,z+1.1,14);L.geo(new THREE.TorusGeometry(.33,.02,4,12,Math.PI),0x888888,x-2.4,.62,z+1.1)}
 // tendedero: dos postes, dos lazos y la ropa (con un hipil bordado)
 [4.4,11].forEach(x=>{L.cyl(.06,.07,4.6,0x8a8f94,x,2.3,-38.6,8);L.box(.08,.08,1.4,0x8a8f94,x,4.5,-38.6)});
 [-.55,.55].forEach(dz=>L.cyl(.015,.015,6.6,0xe8e4da,7.7,4.45,-38.6+dz,4,0,0,Math.PI/2));
 {const z=-39.15,b=(w,h,c,x,y,d)=>L.box(w,h,d||.04,c,x,y,z);
  b(1,1.35,0xf7f4ec,5.6,3.78);b(.42,.06,0xd81b60,5.6,4.25,.06);[-1,1].forEach(s=>b(.06,.3,0xd81b60,5.6+s*.21,4.1,.06));b(.42,.06,0x2e7d32,5.6,3.95,.06);
  b(1,.22,0xd81b60,5.6,3.3,.06);b(1,.07,0x2e7d32,5.6,3.45,.06);b(1,.06,0xf9a825,5.6,3.16,.06);
  b(.95,1.05,0x3a6fb0,7.1,3.92);[-1,1].forEach(s=>b(.3,.4,0x3a6fb0,7.1+s*.62,4.2));
  [0xe63946,0xf4a261,0x2a9d8f].forEach((c,i)=>b(.3,1.3,c,8.2+i*.3,3.8));b(.75,1.2,0x2b4a7a,9.9,3.85)}
 {const z=-38.05;[[5.2,.25,.45,0xf2f2f2],[5.6,.25,.45,0xf2f2f2],[6.6,.7,.7,0xf4c430],[8.4,.6,.8,0xe8a0a8]].forEach(([x,w,h,c])=>L.box(w,h,.04,c,x,4.45-h/2,z))}
 // macetas: de barro (o latas pintadas) con hojas, sábila o flores
 MAC.forEach(([x,z,t,c])=>{c=c||0xb5643c;L.cyl(.5,.36,.85,c,x,.425,z,12);L.cyl(.56,.56,.12,c,x,.85,z,12);L.cyl(.46,.46,.02,0x4a3424,x,.92,z,10);
  if(t==='sabila')for(let i=0;i<9;i++){const a=i/9*Math.PI*2;L.geo(new THREE.ConeGeometry(.09,1.1,4),0x6f9a7a,x+Math.cos(a)*.38,1.4,z+Math.sin(a)*.38,-a,0,-.45)}
  else if(t==='flor'){for(let i=0;i<5;i++)F.bola(.32,1,.8,1,pick(VERD),x+(rnd()-.5)*.5,1.15+rnd()*.3,z+(rnd()-.5)*.5);
   for(let i=0;i<8;i++)F.bola(.09,1,1,1,pick([0xe53935,0xff5c8a,0xffffff]),x+(rnd()-.5)*.7,1.4+rnd()*.25,z+(rnd()-.5)*.7,0)}
  else for(let i=0;i<6;i++)F.bola(.38+rnd()*.15,1,1.1,1,pick(VERD),x+(rnd()-.5)*.5,1.25+rnd()*.5,z+(rnd()-.5)*.5)});
 // farol del patio de noche
 const lf=new THREE.PointLight(0xffc98a,0,20,1.4);lf.position.set(-6.6,4.9,PZ-1.3);G.add(lf);CC.luz(lf,30);
 const mC=new THREE.MeshLambertMaterial(),mF=new THREE.MeshLambertMaterial({flatShading:true});
 G.add(Lt.mesh(new THREE.MeshLambertMaterial({map:tRojo})),Lj.mesh(new THREE.MeshLambertMaterial({map:tJar})),Lb.mesh(new THREE.MeshLambertMaterial({map:cal('barda','#f3eee4')})),L.mesh(mC),F.mesh(mF));
 // la copa del flamboyán se esconde si tapa a tu Mii (como las paredes)
 const cop=Ff.mesh(mF);G.add(cop);CC.zona([cop],[FL[0]-8.2,FL[0]+8.2,6.4,11.6,FL[1]-8.2,FL[1]+8.2]);
 // detrás de la barda: copas de árboles (uno de jacaranda, uno de flamboyán) y una palmera; se esconde si tapa a tu Mii
 const T=new THREE.Group();T.name='tras';CIELO.mundo.add(T);
 [[-26,-47],[-13,-49],[-2,-46.5],[11,-51],[22,-47],[33,-52],[-35,-53]].forEach(([x,z],i)=>{const h=6+rnd()*2.5,fl=i===1?[0x8a6ccf,0x9b7fd9]:i===4?ROJ:null;
  L2.cyl(.3,.4,h,0x6b5a48,x,h/2,z,7);for(let j=0;j<7;j++)F2.bola(1.9+rnd(),1.2,.9,1.2,fl&&j%2?pick(fl):pick(VERD),x+(rnd()-.5)*4,h+rnd()*2.6,z+(rnd()-.5)*4)});
 {let p=[6,0,-46.5];for(let i=0;i<4;i++)p=L2.rama(0x8a7a62,p[0],p[1],p[2],3.4,.28,.22,0,.06+i*.05,8);
  for(let i=0;i<9;i++){const th=i/9*Math.PI*2;L2.box(3.8,.06,.7,0x4f8a3a,p[0]+Math.cos(th)*1.8,p[1]-.4,p[2]+Math.sin(th)*1.8,-th,0,-.38)}
  for(let i=0;i<3;i++)L2.bola(.28,1,1,1,0x6b4a2a,p[0]+(i-1)*.3,p[1]-.3,p[2]+.2)}
 T.add(L2.mesh(new THREE.MeshLambertMaterial()),F2.mesh(new THREE.MeshLambertMaterial({flatShading:true})));CC.zona([T],[-400,400,-2,60,-200,BZ-.15]);
 return G}

window.CPAT=CP;
})();
