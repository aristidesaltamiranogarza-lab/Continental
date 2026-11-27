// c_rummy_kit.js — RUK: piezas 3D del Rummy hechas con código. Fichas de hueso (todas en UNA malla instanciada con un solo atlas: una llamada de
// dibujo), atril de madera de dos escalones, bolsa de tela que se desinfla, reloj de arena, huecos donde cabe una ficha y la raya de grupo malo.
// Ficha acostada: cara hacia +y, el número se lee desde +z (tu lado). Unidades: ancho 1, largo RUK.H, grueso RUK.D (cada instancia lleva su escala).
// Cada color tiene además una figurita bajo el número (rojo círculo, azul cuadro, negro rombo, naranja triángulo) para no confundir rojo y naranja.
(function(){
if(typeof THREE==='undefined'||!window.RUMMY)return;
const RU=window.RUMMY,H=1.36,D=.3,CW=128,CH=174,COLS=8,ROWS=7,AW=CW*COLS,AH=CH*ROWS;
const INK=['#c22b2b','#1d58a8','#1e1e22','#e2860c'],F='"Nunito","Segoe UI",Arial,sans-serif';
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),V2=(x,y)=>new THREE.Vector2(x,y);
// celda del atlas: 0–51 número y color, 52 y 53 comodines, 54 ficha boca abajo (atriles ajenos)
const cell=id=>id==null||id<0?54:id>=RU.JK?52+(id-RU.JK):id%52;
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function marca(g,c,x,y,s){g.fillStyle=INK[c];g.beginPath();
 if(c==0)g.arc(x,y,s,0,7);else if(c==1)g.rect(x-s*.88,y-s*.88,s*1.76,s*1.76);else if(c==2){g.moveTo(x,y-s*1.2);g.lineTo(x+s,y);g.lineTo(x,y+s*1.2);g.lineTo(x-s,y)}else{g.moveTo(x,y-s*1.1);g.lineTo(x+s*1.15,y+s*.9);g.lineTo(x-s*1.15,y+s*.9)}g.fill()}
// comodín: solo una corona de tres picos, grande y centrada (rojo y negro / azul y naranja)
function comodin(g,cx,cy,k){const a=k?INK[1]:INK[0],b=k?INK[3]:INK[2],w=48,y0=cy+26,y1=cy-30;
 g.fillStyle=a;g.beginPath();g.moveTo(cx-w,y0);g.lineTo(cx-w-4,y1);g.lineTo(cx-w*.45,cy-2);g.lineTo(cx,y1-14);g.lineTo(cx+w*.45,cy-2);g.lineTo(cx+w+4,y1);g.lineTo(cx+w,y0);g.closePath();g.fill();
 g.fillStyle=b;g.fillRect(cx-w,y0-2,w*2,12);[[-w-4,y1],[0,y1-14],[w+4,y1]].forEach(([x,y])=>{g.beginPath();g.arc(cx+x,y,8,0,7);g.fill()})}
let ATL=null;
function atlas(){if(ATL)return ATL;const c=document.createElement('canvas');c.width=AW;c.height=AH;const g=c.getContext('2d');
 for(let i=0;i<56;i++){const x=(i%COLS)*CW,y=(i/COLS|0)*CH;
  g.fillStyle='#efe6d2';g.fillRect(x,y,CW,CH);   // canto (la orilla de la celda la usan los costados de la ficha)
  const gr=g.createRadialGradient(x+CW/2,y+CH*.42,8,x+CW/2,y+CH/2,CW*.8);gr.addColorStop(0,'#fffaf0');gr.addColorStop(1,'#f1e7d3');
  g.fillStyle=gr;rr(g,x+7,y+7,CW-14,CH-14,16);g.fill();
  if(i>=55)continue;
  if(i<52){const c0=i/13|0,n=i%13+1;g.fillStyle=INK[c0];g.font=`900 ${n>9?78:92}px ${F}`;g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),x+CW/2,y+CH*.43);
   if(n==6||n==9){g.fillRect(x+CW/2-18,y+CH*.43+42,36,6)}   // raya bajo el 6 y el 9 (se leen igual de cabeza)
   marca(g,c0,x+CW/2,y+CH*.8,9)}
  else if(i<54)comodin(g,x+CW/2,y+CH*.5,i-52);
  else{g.strokeStyle='rgba(150,120,80,.25)';g.lineWidth=3;rr(g,x+18,y+18,CW-36,CH-36,12);g.stroke()}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return ATL=t}
// geometría de la ficha: rectángulo redondeado con bisel. Los costados toman la orilla de la celda (crema); la cara, la celda completa
let GEO=null;
function geo(){if(GEO)return GEO;const w=1,h=H,r=.16,b=.045,s=new THREE.Shape(),x0=-w/2+b,y0=-h/2+b,x1=w/2-b,y1=h/2-b,rr2=r-b;
 s.moveTo(x0+rr2,y0);s.lineTo(x1-rr2,y0);s.quadraticCurveTo(x1,y0,x1,y0+rr2);s.lineTo(x1,y1-rr2);s.quadraticCurveTo(x1,y1,x1-rr2,y1);s.lineTo(x0+rr2,y1);s.quadraticCurveTo(x0,y1,x0,y1-rr2);s.lineTo(x0,y0+rr2);s.quadraticCurveTo(x0,y0,x0+rr2,y0);
 const g=new THREE.ExtrudeGeometry(s,{depth:D-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:3});
 g.translate(0,0,-(D-2*b)/2);g.computeVertexNormals();
 const P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,zt=D/2-.001,mu=7/CW,mv=7/CH;
 for(let i=0;i<P.count;i++){if(N.getZ(i)>.95&&P.getZ(i)>=zt){U.setXY(i,mu+(P.getX(i)+w/2)/w*(1-2*mu),1-(mv+(1-(P.getY(i)+h/2)/h)*(1-2*mv)))}else U.setXY(i,2/CW,1-.5)}
 g.rotateX(-Math.PI/2);return GEO=g}
// material con la celda por instancia (aCell) sobre el mismo atlas
function mat(){const m=new THREE.MeshStandardMaterial({map:atlas(),roughness:.42,metalness:0});
 m.onBeforeCompile=sh=>{sh.uniforms.uCell={value:V2(1/COLS,1/ROWS)};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aCell;uniform vec2 uCell;').replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv=vec2(aCell.x,1.0-uCell.y-aCell.y)+vMapUv*uCell;')};
 m.customProgramCacheKey=()=>'rukT';return m}
// fichas(n): malla instanciada para n fichas. f.pon(i,id,matriz,tinte) · f.fin(cuantas) al terminar el cuadro
function fichas(n){const g=geo().clone(),A=new Float32Array(n*2);g.setAttribute('aCell',new THREE.InstancedBufferAttribute(A,2));
 const m=new THREE.InstancedMesh(g,mat(),n);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;
 m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3).fill(1),3);const C=new THREE.Color();
 return {m,pon(i,id,M,t){m.setMatrixAt(i,M);const c=cell(id);A[i*2]=(c%COLS)/COLS;A[i*2+1]=(c/COLS|0)/ROWS;C.setRGB(t==null?1:t[0]!=null?t[0]:t,t==null?1:t[1]!=null?t[1]:t,t==null?1:t[2]!=null?t[2]:t);m.setColorAt(i,C)},
  fin(k){m.count=k;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;g.attributes.aCell.needsUpdate=true}}}
// ---- madera ----
let WT=null;
function vetas(){if(WT)return WT;const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle='#9a6638';g.fillRect(0,0,256,64);
 for(let i=0;i<34;i++){g.strokeStyle=`rgba(${60+Math.random()*30|0},${32+Math.random()*16|0},14,${.12+Math.random()*.18})`;g.lineWidth=1+Math.random()*2;g.beginPath();const y=Math.random()*64;g.moveTo(0,y);for(let x=0;x<=256;x+=32)g.lineTo(x,y+Math.sin(x/40+i)*3);g.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return WT=t}
const madera=()=>new THREE.MeshStandardMaterial({map:vetas(),roughness:.62,color:0xffffff});
// atril de dos escalones (nt=1: de uno) de largo L (x), visto desde +z. Las fichas se recargan en cada escalón: slot(t,x) → {p, q} locales (t 0 abajo, 1 arriba).
// fichas paradas con escala s: la altura de la ficha es s*H
const TILT=.26;
function atril(L,s,nt){const g=new THREE.Group(),M=madera(),pf=new THREE.Shape(),uno=nt==1;
 // perfil (x del shape = z del mundo, hacia el frente; y arriba): escalón bajo al frente y escalón alto atrás, para que se lean las dos filas
 (uno?[[-.5,0],[1,0],[1,.16],[.92,.22],[.3,.22],[.18,1.02],[-.3,1.06],[-.5,.85]]:[[-1.15,0],[1,0],[1,.16],[.92,.22],[.3,.22],[.24,1.17],[-.32,1.17],[-.4,1.95],[-.9,1.9],[-1.15,1.6]]).forEach(([z,y],i)=>i?pf.lineTo(z*s,y*s):pf.moveTo(z*s,y*s));pf.closePath();
 const ge=new THREE.ExtrudeGeometry(pf,{depth:L,bevelEnabled:true,bevelThickness:.04*s,bevelSize:.04*s,bevelSegments:1,curveSegments:1});
 ge.rotateY(-Math.PI/2);ge.translate(L/2,0,0);
 const U=ge.attributes.uv;for(let i=0;i<U.count;i++)U.setXY(i,U.getX(i)*.35/s,U.getY(i)*.35/s);
 const m=new THREE.Mesh(ge,M);m.castShadow=true;m.receiveShadow=true;g.add(m);
 const hc=H*s*Math.cos(TILT)/2,hs=H*s*Math.sin(TILT)/2,q=new THREE.Quaternion().setFromAxisAngle(v3(1,0,0),Math.PI/2-TILT);
 g.userData.slot=(t,x)=>({p:v3(x,(t?1.17:.22)*s+hc,(t?-.02:.62)*s-hs),q:q.clone()});
 g.userData.alto=(uno?1.06:1.95)*s;g.userData.fondo=(uno?.5:1.15)*s;return g}
// ---- bolsa de tela ----
function bolsa(){const g=new THREE.Group(),pts=[[.02,0],[.3,.02],[.5,.1],[.6,.25],[.62,.45],[.58,.65],[.48,.82],[.34,.95],[.27,1.02],[.3,1.1],[.38,1.18],[.42,1.24]].map(([r,y])=>V2(r,y));
 const ge=new THREE.LatheGeometry(pts,22),P=ge.attributes.position;
 for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),a=Math.atan2(z,x),f=1+.06*Math.sin(a*6+y*5)*Math.min(1,y);P.setXYZ(i,x*f,y,z*f)}ge.computeVertexNormals();
 const tela=new THREE.MeshStandardMaterial({color:0xa5432f,roughness:.95,side:THREE.DoubleSide}),m=new THREE.Mesh(ge,tela);m.castShadow=true;m.receiveShadow=true;g.add(m);
 const cu=new THREE.Mesh(new THREE.TorusGeometry(.32,.035,6,20),new THREE.MeshStandardMaterial({color:0xe8d3a0,roughness:.8}));cu.rotation.x=Math.PI/2;cu.position.y=1.0;g.add(cu);
 g.userData.cuerpo=m;g.userData.boca=v3(0,1.2,0);return g}
// ---- reloj de arena (alto 1): r.arena(f) con f = lo que queda arriba (1 a 0); r.voltea() lo gira medio giro ----
function reloj(){const g=new THREE.Group(),inner=new THREE.Group(),M=madera(),vid=new THREE.MeshStandardMaterial({color:0xdff3ff,roughness:.05,transparent:true,opacity:.28,depthWrite:false});
 g.add(inner);[.04,.96].forEach(y=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.08,16),M);c.position.y=y;c.castShadow=true;inner.add(c)});
 for(let i=0;i<3;i++){const a=i*2.094,p=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.9,6),M);p.position.set(Math.cos(a)*.25,.5,Math.sin(a)*.25);inner.add(p)}
 const vp=[];for(let i=0;i<=12;i++){const t=i/12,r=.04+.17*Math.pow(Math.abs(t-.5)*2,.8);vp.push(V2(r,.08+t*.84))}inner.add(new THREE.Mesh(new THREE.LatheGeometry(vp,16),vid));
 const AM=new THREE.MeshStandardMaterial({color:0xe9c27a,roughness:.9}),cono=new THREE.ConeGeometry(.17,.34,14);
 const top=new THREE.Mesh(cono,AM);top.rotation.x=Math.PI;const bot=new THREE.Mesh(cono,AM);inner.add(top,bot);
 g.userData={arena(f){f=Math.max(0,Math.min(1,f));top.visible=f>.02;top.scale.setScalar(Math.cbrt(f)||.001);top.position.y=.52+.17*Math.cbrt(f);
  const q=1-f;bot.visible=q>.02;bot.scale.setScalar(Math.cbrt(q)||.001);bot.position.y=.09+.17*Math.cbrt(q)},vu:0,inner};
 g.userData.arena(1);return g}
// ---- marcas sobre el fieltro: hueco (dónde cabe), hueco de grupo nuevo, raya roja y brillo de la elegida ----
const TX={};
function tx(k,w,h,draw){if(TX[k])return TX[k];const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return TX[k]=t}
const hueco=(mas)=>tx(mas?'h+':'h',128,174,(g,w,h)=>{g.setLineDash([16,10]);g.lineWidth=8;g.strokeStyle='#9ff0bf';rr(g,8,8,w-16,h-16,18);g.stroke();g.fillStyle='rgba(159,240,191,.16)';g.fill();
 if(mas){g.setLineDash([]);g.lineWidth=10;g.lineCap='round';g.beginPath();g.moveTo(w/2,h/2-22);g.lineTo(w/2,h/2+22);g.moveTo(w/2-22,h/2);g.lineTo(w/2+22,h/2);g.stroke()}});
const raya=()=>tx('r',64,16,(g,w,h)=>{g.fillStyle='#ff6a4d';rr(g,0,3,w,10,5);g.fill()});
const brillo=()=>tx('b',128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,10,64,64,62);r.addColorStop(0,'rgba(255,214,110,.9)');r.addColorStop(1,'rgba(255,214,110,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
function plano(t,o){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial(Object.assign({map:t,transparent:true,depthWrite:false},o||{})));m.rotation.x=-Math.PI/2;m.renderOrder=2;return m}
window.RUK={H,D,TILT,INK,cell,atlas,fichas,atril,bolsa,reloj,hueco,raya,brillo,plano,madera};
})();
