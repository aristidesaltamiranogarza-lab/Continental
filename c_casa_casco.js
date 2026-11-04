// c_casa_casco.js — CASCO: la casa por fuera (Bloque D, fase D5). c_casa_pb.js lo llama al armar la planta baja (CASCO.build(kit)).
// Tres piezas en el exterior compartido (CIELO.mundo), cada una vista solo desde los pisos donde hace falta (CIELO.pisos):
//   azo:  la azotea de la planta baja. Desde la alta y la terraza, y en la planta baja con tu Mii afuera (así la casa tiene techo).
//   pb:   pretiles, copete y las fachadas en sencillo. Desde la alta y la terraza (en la planta baja ya están las de verdad,
//         en c_casa_calle.js y c_casa_patio.js).
//   alta: muros de afuera de la planta alta con sus ventanas (las mismas que pone c_casa_alta.js por dentro), zócalo y cornisa.
//   ter:  piso y pretil de la terraza, cubo de la escalera, tinaco y postes de los foquitos.
// alta y ter se ven desde la terraza (alta) y desde la planta baja solo con tu Mii afuera (banqueta o patio): adentro serían un techo
// que tapa media sala. Si la cámara queda dentro de ellas o entre la cámara y tu Mii, se esconden (CCALLE.zona).
// Medidas: planta baja x ±17.3, z -25.3..19.3, azotea en 9.6. La planta alta queda remetida: por dentro x ±15, z -12..9, muro de .3,
// de 9.6 a 19.2. La terraza es su techo, con las mismas medidas (pretil de 1.2 sobre los muros de la alta).
(function(){
if(typeof THREE==='undefined')return;
const A=9.6,TE=19.2,X=15,ZB=-12,ZF=9,T=.3,PX=17.3,PF=19.3,PZ=-25.3,PT=1.2,
 OC=0xe2a73c,AM=0xe9bd5a,CR=0xefe6d2,PI=0xd9ccb2,HI=0x1c1c1e,VE=0x2f6b4a,VO=0x245a3d,AZ=0xb5573e,CAL=0xf1e9da,TER=0xa5482e,LUZ=0xffc46a,OSC=0x241a12;
const dk=(c,k)=>new THREE.Color(c).multiplyScalar(k||.72).getHex();
// ventanas de la planta alta (c_casa_alta.js las pone por dentro con VENT; aquí se ven por fuera). lado: izq (x=-15), der (x=15),
// fr (z=9, a la calle), at (z=-12, al patio); u: centro sobre el muro; y: centro sobre el piso de la alta.
const VA=[
 {lado:'izq',u:-4.6,y:4.6,w:3,h:3.6},                         // estudio
 {lado:'izq',u:5.4,y:4.8,w:2.2,h:3,nueva:1},                  // rincón de lectura
 {lado:'der',u:.4,y:2.7,w:3.2,h:5.4,puerta:1},                // balcón
 {lado:'der',u:-7.6,y:4.6,w:2.4,h:3.2,nueva:1},               // corredor, junto al reloj
 {lado:'fr',u:-9.6,y:4.6,w:2.6,h:3.4,nueva:1},{lado:'fr',u:-1.8,y:4.6,w:2.6,h:3.4,nueva:1},   // a la calle
 {lado:'at',u:-11.8,y:7.35,w:2,h:1,nueva:1,alta:1},{lado:'at',u:-5.3,y:7.35,w:2,h:1,nueva:1,alta:1},{lado:'at',u:1.2,y:7.35,w:2,h:1,nueva:1,alta:1}];   // altas, sobre los libreros
// dónde va cada ventana por dentro (para VENT.pon): x, z y hacia dónde mira el vidrio (al cuarto)
const dentro=v=>v.lado==='izq'?{x:-X,z:v.u,ry:Math.PI/2}:v.lado==='der'?{x:X,z:v.u,ry:-Math.PI/2}:v.lado==='fr'?{x:v.u,z:ZF,ry:Math.PI}:{x:v.u,z:ZB,ry:0};
// por fuera: punto a k del paño de afuera del muro de la alta
const P=(l,u,k)=>l==='fr'?[u,ZF+T+k]:l==='at'?[u,ZB-T-k]:l==='izq'?[-X-T-k,u]:[X+T+k,u],RY=l=>l==='izq'||l==='der'?Math.PI/2:0;
let HECHO=false;
// tu Mii está afuera de la planta baja (banqueta o patio)
const fuera=()=>{const y=window.CASA3D&&CASA3D.piso&&CASA3D.piso()==='pb'&&CASA3D.yo&&CASA3D.yo();return !!y&&(y.z>PF||y.z<PZ||Math.abs(y.x)>PX)};

function build(k){if(HECHO||!window.LOTE||!window.CIELO||!CIELO.pisos||!window.CCALLE)return;HECHO=true;
 const CC=window.CCALLE,mat=()=>new THREE.MeshStandardMaterial({roughness:.85}),G={};
 ['azo','pb','alta','ter'].forEach(n=>{G[n]=new THREE.Group();G[n].name='casco-'+n;CIELO.mundo.add(G[n])});
 CIELO.pisos(G.azo,p=>p==='alta'||p==='ter'||(p==='pb'&&fuera()));
 CIELO.pisos(G.pb,['alta','ter']);
 CIELO.pisos(G.alta,p=>p==='ter'||(p==='pb'&&fuera()));
 CIELO.pisos(G.ter,p=>p==='pb'&&fuera());
 // de noche los muros se oscurecen igual que las fachadas de abajo (CCALLE.tinte), así el farol de la calle no los deja más prendidos;
 // la azotea no: ya la oscurece la luna como a las de los vecinos
 const arma=(g,L,V,sinT)=>{const ms=[L.mesh(sinT?mat():CC.tinte(mat()))];if(V.n())ms.push(CC.vidrio(V.mesh(new THREE.MeshBasicMaterial()),0x2c3640));ms.forEach(m=>g.add(m));return ms};
 const [Z,Lb,Vb]=bajo();CC.zona(arma(G.azo,Z,LOTE(),1),[-PX,PX,A-.4,A+.1,PZ,PF]);arma(G.pb,Lb,Vb);
 const sube=arma(G.alta,...alta()).concat(arma(G.ter,...terraza()));
 // si la cámara queda dentro de la alta o de la terraza, o la tapan, se esconden
 CC.zona(sube,[-X-T-.7,X+T+.7,A,TE+5.5,ZB-T-.7,ZF+T+.7]);CC.tema()}

// ---------- la planta baja vista desde arriba ----------
function bajo(){const L=LOTE(),V=LOTE(),Z=LOTE();
 // azotea alrededor de la alta (debajo de la alta no: ahí está su piso y el hueco de la escalera)
 const yA=A-.16;Z.box(2*PX,.3,PF-.3-ZF,AZ,0,yA,(ZF+PF-.3)/2);Z.box(2*PX,.3,ZB-PZ-.3,AZ,0,yA,(ZB+PZ+.3)/2);
 [-1,1].forEach(s=>Z.box(PX-X,.3,ZF-ZB,AZ,s*(PX+X)/2,yA,(ZF+ZB)/2));
 // juntas de la impermeabilización y un par de bajadas de agua
 for(let z=PZ+2.5;z<PF-1;z+=3.2)if(z<ZB-.5||z>ZF+.5)Z.box(2*PX-.6,.02,.05,dk(AZ,.8),0,A,z);
 [[-16.6,-24.6],[16.6,-24.6],[-16.6,18.6],[16.6,18.6]].forEach(([x,z])=>Z.cyl(.12,.12,.06,0x2a2420,x,A,z,8));
 // fachada de la calle: muro ocre, pilastras, cornisa, pretil con copete, portón y ventanas
 L.box(2*PX,8.6,.3,OC,0,4.3,PF-.15);L.box(2*PX,1,.06,dk(OC),0,.5,PF+.03);
 [-16.95,-3.3,3.3,16.95].forEach(x=>{L.box(.86,1.2,.26,0xb9ad96,x,.6,PF+.13);L.box(.7,7.1,.16,CR,x,4.75,PF+.08);L.box(.86,.3,.24,CR,x,8.45,PF+.12)});
 L.box(34.6,.22,.3,CR,0,8.71,PF+.15);L.box(34.8,.4,.5,CR,0,9.02,PF+.25);
 L.box(34.6,1.3,.3,OC,0,9.87,PF-.15);L.box(34.9,.18,.5,CR,0,10.61,PF-.1);
 L.box(7.6,1.1,.3,OC,0,11.25,PF-.15);L.box(7.9,.18,.5,CR,0,11.89,PF-.1);L.box(3.4,.8,.3,OC,0,12.38,PF-.15);L.box(3.7,.16,.46,CR,0,12.86,PF-.1);
 [-3.75,3.75].forEach(x=>L.bola(.22,1,1,1,CR,x,12.2,PF-.1));[-1.7,1.7].forEach(x=>L.bola(.18,1,1,1,CR,x,13.1,PF-.1));
 L.box(3.6,5.4,.04,OSC,0,2.7,PF+.01);[-1,1].forEach(s=>L.box(.42,5.6,.18,PI,s*2.01,2.8,PF+.09));L.box(4.86,.55,.2,PI,0,5.675,PF+.1);
 [-10.6,10.6].forEach(x=>{[-1,1].forEach(s=>L.box(1.17,4.45,.06,VE,x+s*.6,2.975,PF+.04));V.box(2.3,1.62,.02,LUZ,x,6.12,PF+.03);
  [-1,1].forEach(s=>L.box(.32,6.6,.14,CR,x+s*1.36,4.0,PF+.07));L.box(3.1,.4,.16,CR,x,7.2,PF+.08);
  for(let i=0;i<13;i++)L.box(.045,6.55,.045,HI,x-1.32+i*.22,3.885,PF+.64);L.box(2.72,.05,.62,HI,x,7.14,PF+.33)});
 // fachada del patio: muro amarillo, cornisa, pretil, gárgolas, ventanas y la puerta de arco del comedor
 L.box(2*PX,8.6,.3,AM,0,4.3,PZ+.15);L.box(2*PX,.22,.3,CR,0,8.71,PZ-.15);L.box(2*PX+.2,.4,.5,CR,0,9.02,PZ-.25);
 L.box(2*PX,1,.3,AM,0,9.72,PZ+.15);L.box(2*PX+.3,.16,.48,CR,0,10.3,PZ+.1);
 [-12,-.5,9.5].forEach(x=>L.box(.32,.26,1.1,0xb5643c,x,9.45,PZ-.55));
 [[-9,4.4,3,3.4],[4.6,4.7,2.8,2.2],[15.6,6.2,1.2,1.1]].forEach(([x,y,w,h])=>{V.box(w,h,.02,LUZ,x,y,PZ-.02);
  [-1,1].forEach(s=>L.box(.26,h+.26,.12,CR,x+s*(w/2+.13),y,PZ-.06));L.box(w+.8,.3,.16,CR,x,y+h/2+.28,PZ-.08);L.box(w+.6,.14,.36,CR,x,y-h/2-.07,PZ-.18)});
 L.box(2.6,3.5,.04,OSC,-4.2,1.75,PZ-.02);V.geo(new THREE.CircleGeometry(1.3,16,0,Math.PI).rotateY(Math.PI),LUZ,-4.2,3.5,PZ-.02);
 // costados (pegados a los vecinos) que suben a pretil
 [-1,1].forEach(s=>{L.box(.3,10.4,PF-PZ,0xe6d6b8,s*(PX-.15),5.2,(PF+PZ)/2);L.box(.5,.14,PF-PZ,CR,s*(PX-.15),10.47,(PF+PZ)/2)});
 return [Z,L,V]}

// ---------- la planta alta por fuera ----------
function alta(){const L=LOTE(),V=LOTE(),H=TE-A,yc=(A+TE)/2,W=2*(X+T);
 const b=(l,w,h,d,c,u,y,kk,Q)=>{const [x,z]=P(l,u,kk);(Q||L).box(w,h,d,c,x,y,z,RY(l))};
 // muros: ocre a la calle y a los lados, amarillo al patio (como las fachadas de abajo)
 L.box(W,H,T,OC,0,yc,ZF+T/2);L.box(W,H,T,AM,0,yc,ZB-T/2);[-1,1].forEach(s=>L.box(T,H,ZF-ZB,OC,s*(X+T/2),yc,(ZF+ZB)/2));
 const lados=[['fr',W,OC],['at',W,AM],['izq',ZF-ZB+2*T,OC],['der',ZF-ZB+2*T,OC]],cu=l=>l==='izq'||l==='der'?(ZF+ZB)/2:0;
 lados.forEach(([l,w,c])=>{const u=cu(l);
  b(l,w+.08,.7,.06,dk(c),u,A+.35,.03);                                        // zócalo
  [-1,1].forEach(s=>b(l,.5,H-.9,.1,CR,u+s*(w/2-.25),A+.7+(H-.9)/2,.05));         // pilastras en las esquinas
  b(l,w+.3,.22,.3,CR,u,TE-.62,.15);b(l,w+.5,.34,.5,CR,u,TE-.2,.25)});          // cornisa (arriba va el pretil de la terraza)
 // ventanas: vidrio (de noche con luz), marco de cantera, reja y postigos verdes abiertos
 VA.forEach(v=>{const {lado:l,u,w,h}=v,y=A+v.y;
  b(l,w,h,.02,LUZ,u,y,.01,V);
  [-1,1].forEach(s=>b(l,.26,h+.26,.12,CR,u+s*(w/2+.13),y,.06));b(l,w+.8,.3,.16,CR,u,y+h/2+.28,.08);
  if(!v.puerta)b(l,w+.6,.14,.36,CR,u,y-h/2-.07,.18);
  if(v.puerta){b(l,w+.9,.12,.7,PI,u,A+.06,.35);[-1,1].forEach(s=>b(l,w/2,h-.2,.06,VE,u+s*(w*.75+.3),y-.1,.05))}
  else if(!v.alta){const n=Math.max(3,Math.round(w/.24));for(let i=1;i<n;i++)b(l,.04,h,.04,HI,u-w/2+i*w/n,y,.16);[.3,.7].forEach(f=>b(l,w,.04,.04,HI,u,y-h/2+h*f,.16));
   [-1,1].forEach(s=>{b(l,w/2,h,.05,VE,u+s*(w*.75+.3),y,.05);for(let yy=y-h/2+.3;yy<y+h/2-.2;yy+=.3)b(l,w/2-.12,.05,.03,VO,u+s*(w*.75+.3),yy,.09)})}});
 return [L,V]}

// ---------- la terraza vista desde abajo: piso, pretil, cubo de la escalera, tinaco y postes ----------
function terraza(){const L=LOTE(),V=LOTE();
 L.box(2*X,.2,ZF-ZB,TER,0,TE-.1,(ZF+ZB)/2);
 const W=2*(X+T);L.box(W,PT,T,CAL,0,TE+PT/2,ZB-T/2);L.box(W,PT*.8,T,CAL,0,TE+PT*.4,ZF+T/2);[-1,1].forEach(s=>L.box(T,PT,ZF-ZB,CAL,s*(X+T/2),TE+PT/2,(ZF+ZB)/2));
 L.box(W+.2,.1,.5,TER,0,TE+PT+.05,ZB-T/2);L.box(W+.2,.1,.5,TER,0,TE+PT*.8+.05,ZF+T/2);[-1,1].forEach(s=>L.box(.5,.1,ZF-ZB+.3,TER,s*(X+T/2),TE+PT+.05,(ZF+ZB)/2));
 const CX=9.6,CZ=-8.7;L.box(4.4,4.6,4.2,CAL,CX,TE+2.3,CZ);L.box(4.7,.2,4.5,TER,CX,TE+4.7,CZ);L.box(1.5,2.7,.04,OSC,CX,TE+1.35,CZ+2.11);
 {const x=-10.4,z=-8.4,bk=0x151515,mt=0x707478;L.box(2.4,.12,2.4,mt,x,TE+1.3,z);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,c])=>L.box(.1,1.3,.1,mt,x+a*1.05,TE+.65,z+c*1.05));
  L.cyl(.95,1,2.2,bk,x,TE+2.46,z,20);L.cyl(.6,.95,.35,bk,x,TE+3.73,z,20);L.cyl(.32,.32,.12,bk,x,TE+3.96,z,12)}
 const RX=-3.6,RZ=-1.6;[[RX-4.6,RZ-4.4],[RX+4.6,RZ-4.4],[RX+4.6,RZ+4.4],[RX-4.6,RZ+4.4]].forEach(([x,z])=>{L.cyl(.07,.09,4.6,0x3a2212,x,TE+2.3,z,6);V.bola(.12,1,1,1,0xffd27a,x,TE+4.4,z,0)});
 return [L,V]}

window.CASCO={build,VA,dentro,fuera,medidas:{A,TE,X,ZB,ZF,T,PX,PF,PZ}};
})();
