// c_colonos3d_kit.js — CO3K: las piezas 3D de Colonos, todas de geometría (sin modelos): terrenos gruesos de madera pintada con su diorama
// (bosque, cerro, pasto, campo, monte, desierto, oro), fichas de número, mar enmarcado en madera, puertos con barquito, poblado, ciudad,
// camino y ladrón redondeados, dados, y la mesa rectangular con sus sillas (lados largos y cabecera; tu lado, el de la cámara, queda libre).
// Unidades de la isla: un terreno mide 1 de radio (como COLD.geo, x→x, y→z); CO3 la escala. Cada terreno es una sola malla con color por vértice.
// CO3K.isla(G) → {g, tierra:[{g,mat,i}], box (contorno para encuadrar), c:[cx,cz]} · CO3K.pieza(w,col) · CO3K.ladron() · CO3K.dado() · CO3K.mesa(hx,hz,m)
(function(){
if(typeof THREE==='undefined'||!window.COLD)return;
const D=COLD,v3=(x,y,z)=>new THREE.Vector3(x,y,z),E=new THREE.Euler(),PI=Math.PI,TH=.26,Y0=TH+.03,FONT='Nunito,system-ui,sans-serif';
const std=(c,r,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r==null?.8:r},o||{}));
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
// ---------- juntar geometrías (color por vértice): un dibujo por terreno ----------
function junta(L){let n=0;const P=[];
 L.forEach(o=>{const g=(o.g.index?o.g.toNonIndexed():o.g.clone()).applyMatrix4(o.m);P.push([g,new THREE.Color(o.c)]);n+=g.attributes.position.count});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let i=0;
 P.forEach(([g,c])=>{const p=g.attributes.position,q=g.attributes.normal;pos.set(p.array,i*3);nor.set(q.array,i*3);for(let j=0;j<p.count;j++){const b=(i+j)*3;col[b]=c.r;col[b+1]=c.g;col[b+2]=c.b}i+=p.count;g.dispose()});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeBoundingSphere();return g}
function pila(){const L=[];const f=(g,c,x,y,z,sx,sy,sz,ry,rx,rz)=>{E.set(rx||0,ry||0,rz||0);sx=sx==null?1:sx;
 L.push({g,c,m:new THREE.Matrix4().compose(v3(x,y,z),new THREE.Quaternion().setFromEuler(E),v3(sx,sy==null?sx:sy,sz==null?sx:sz))})};f.L=L;return f}
const GB={};const gb=()=>GB.ok?GB:Object.assign(GB,{ok:1,cono:new THREE.ConeGeometry(1,1,7),cono5:new THREE.ConeGeometry(1,1,5),bola:new THREE.IcosahedronGeometry(1,1),
 cil:new THREE.CylinderGeometry(1,1,1,10),cil6:new THREE.CylinderGeometry(1,1,1,6),caja:new THREE.BoxGeometry(1,1,1)});
// ---------- terrenos ----------
const TC={0:['#5E8C4F','#476B3C'],1:['#C8744A','#9C5634'],2:['#A9CB6F','#7F9F4E'],3:['#E3B651','#B88E33'],4:['#9298A2','#6F7580'],5:['#E6D2A2','#BFA674'],7:['#C9B163','#9C8640']};
function sitios(r,n,dmin,r0,r1){const P=[];for(let t=0;t<n*40&&P.length<n;t++){const a=r()*PI*2,d=r0+(r1-r0)*Math.sqrt(r()),x=Math.cos(a)*d,z=Math.sin(a)*d;
 if(P.every(p=>Math.hypot(p[0]-x,p[1]-z)>=dmin))P.push([x,z])}return P}
function diorama(f,t,r){const B=gb(),y=Y0;
 if(t==0){sitios(r,9,.27,.44,.76).forEach(([x,z],i)=>{const h=.26+r()*.12,c=i%3?'#2F5E37':'#244A2B';f(B.cil,'#6B4A2E',x,y+.04,z,.03,.08,.03);f(B.cono,c,x,y+.08+h/2,z,.12+r()*.03,h,.12)})}
 else if(t==1){f(B.bola,'#B6633B',-.42,y-.02,-.38,.3,.12,.2,.4);f(B.bola,'#B6633B',.45,y-.02,.36,.3,.13,.2,-.3);f(B.cil,'#8F4325',-.48,y+.005,.34,.17,.02,.12);
  const bx=.44,bz=-.42;[[-.05,0,0],[.05,0,0],[0,.045,0],[-.05,0,.06],[.05,0,.06]].forEach(([dx,dy,dz])=>f(B.caja,'#9B4123',bx+dx,y+.025+dy,bz+dz,.09,.044,.05,.3))}
 else if(t==2){sitios(r,4,.3,.46,.74).forEach(([x,z])=>{const a=r()*PI*2;f(B.bola,'#FBF8F0',x,y+.07,z,.11,.075,.08,a);f(B.bola,'#3B3330',x+Math.cos(a)*.1,y+.08,z-Math.sin(a)*.1,.04,.045,.04)});
  for(let i=0;i<4;i++){const x=-.7+i*.13,z=-.2-i*.1;f(B.caja,'#8A6A45',x,y+.04,z,.02,.08,.02)}f(B.caja,'#8A6A45',-.5,y+.06,-.35,.42,.018,.018,-.66)}
 else if(t==3){for(let z=-.72;z<=.73;z+=.145){const a=Math.abs(z),hw=(a<=.45?.78:.78*(.9-a)/.45)-.06;if(hw<.08)continue;
   if(a<.42)[[-hw,-.42],[.42,hw]].forEach(([x0,x1])=>{if(x1-x0>.05)f(B.caja,'#C9952F',(x0+x1)/2,y+.012,z,x1-x0,.024,.045)});else f(B.caja,'#C9952F',0,y+.012,z,hw*2,.024,.045)}
  sitios(r,3,.38,.5,.72).forEach(([x,z])=>{f(B.bola,'#D49A2F',x,y+.02,z,.1,.09,.1);f(B.cil,'#B5801F',x,y+.06,z,.075,.012,.075)})}
 else if(t==4){[[-.38,-.36,.32,.55],[.4,-.3,.28,.48],[.05,.5,.3,.42],[-.55,.3,.2,.3]].forEach(([x,z,rr,h],i)=>{f(B.cono5,i%2?'#7D8491':'#767C88',x,y+h/2,z,rr,h,rr,i);
   const sh=h*.34;f(B.cono5,'#EEF0F3',x,y+h-sh/2+.004,z,rr*sh/h*1.08,sh,rr*sh/h*1.08,i)})}
 else if(t==5){f(B.bola,'#D5BB83',-.4,y-.02,-.4,.32,.06,.18,.5);f(B.bola,'#D5BB83',.38,y-.02,.42,.3,.06,.16,-.4);
  const cx=.45,cz=-.35;f(B.cil,'#7A9A5C',cx,y+.1,cz,.035,.2,.035);f(B.cil,'#7A9A5C',cx-.06,y+.12,cz,.022,.08,.022);f(B.cil,'#7A9A5C',cx+.06,y+.14,cz,.022,.07,.022);
  f(B.bola,'#C9B184',-.5,y+.01,.35,.05,.03,.04);f(B.bola,'#C9B184',.05,y+.01,-.62,.06,.035,.045)}
 else if(t==7){sitios(r,6,.2,.46,.72).forEach(([x,z],i)=>f(B.bola,i%2?'#F2C94C':'#8E8A7A',x,y+.03,z,i%2?.06:.09,i%2?.05:.06,i%2?.06:.08,r()*3))}}
function terreno(h,i){const t=h.t,c=TC[t];if(!c)return null;const f=pila(),B=gb(),r=rng(i*977+t*31+7);
 f(B.cil6,c[1],0,TH/2,0,.95,TH,.95);f(B.cil6,c[0],0,TH+.015,0,.9,.03,.9);diorama(f,t,r);
 if(h.n)f(B.cil,'#E8D9BB',0,Y0+.02,0,.36,.04,.36);
 const mat=std(0xffffff,.85,{vertexColors:true}),m=new THREE.Mesh(junta(f.L),mat);m.castShadow=m.receiveShadow=true;
 const g=new THREE.Group();g.add(m);if(h.n){const n=new THREE.Mesh(GT.disco||(GT.disco=new THREE.CircleGeometry(.34,28)),numMat(h.n));n.rotation.x=-PI/2;n.position.y=Y0+.041;n.receiveShadow=true;g.add(n)}
 return {g,mat,i}}
// ---------- texturas pequeñas (número, tasa, puntitos de un lugar, dados, dorso) ----------
const GT={},TX={};
function lienzo(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
const numMat=n=>TX['n'+n]||(TX['n'+n]=new THREE.MeshStandardMaterial({roughness:.9,map:lienzo(128,128,(g,w)=>{const red=n==6||n==8,col=red?'#B3301C':'#3A2416';
 g.fillStyle='#F6EAD2';g.beginPath();g.arc(64,64,62,0,7);g.fill();g.lineWidth=5;g.strokeStyle='#C7AE84';g.stroke();g.fillStyle=col;g.font=`900 ${red?58:52}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(n,64,58);
 const p=D.PIP(n);for(let i=0;i<p;i++){g.beginPath();g.arc(64+(i-(p-1)/2)*11,98,4,0,7);g.fill()}})}));
const RCOL=['#3F6E35','#B0552F','#F1EDE2','#E0AE3E','#6E7684'];
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const tasa=r=>TX['t'+r]||(TX['t'+r]=lienzo(192,80,(g)=>{rr(g,4,4,184,72,36);g.fillStyle='#FDF6E9';g.fill();g.lineWidth=5;g.strokeStyle='#7A4A28';g.stroke();
 g.fillStyle='#3A2416';g.font=`900 44px ${FONT}`;g.textAlign='center';g.textBaseline='middle';if(r<0)g.fillText('3:1',96,42);else{g.beginPath();g.arc(42,40,20,0,7);g.fillStyle=RCOL[r];g.fill();g.lineWidth=3;g.strokeStyle='rgba(58,36,22,.45)';g.stroke();g.fillStyle='#3A2416';g.fillText('2:1',118,42)}}));
const lugar=(n,on)=>TX['l'+n+on]||(TX['l'+n+on]=lienzo(96,96,(g)=>{g.beginPath();g.arc(48,48,40,0,7);g.fillStyle=on?'#C2512A':'#FDF6E9';g.fill();g.lineWidth=7;g.strokeStyle=on?'#FDF6E9':'#C2512A';g.stroke();
 if(n){g.fillStyle=on?'#FFF8EE':'#3A2416';g.font=`900 44px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(n,48,51)}}));
const DP={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]};
const cara=v=>TX['d'+v]||(TX['d'+v]=lienzo(128,128,(g)=>{g.fillStyle='#E8DCC6';g.fillRect(0,0,128,128);rr(g,6,6,116,116,26);g.fillStyle='#FBF5EA';g.fill();g.fillStyle='#3A2416';
 DP[v].forEach(([a,b])=>{g.beginPath();g.arc(64+a*32,64+b*32,11,0,7);g.fill()})}));
const dorso=()=>TX.dorso||(TX.dorso=lienzo(128,180,(g)=>{rr(g,0,0,128,180,16);g.fillStyle='#F1E4CC';g.fill();rr(g,8,8,112,164,11);g.fillStyle='#2E6E73';g.fill();
 g.strokeStyle='rgba(241,228,204,.7)';g.lineWidth=5;g.beginPath();for(let i=0;i<6;i++){const a=(60*i-30)*PI/180;g.lineTo(64+Math.cos(a)*30,90+Math.sin(a)*30)}g.closePath();g.stroke()}));
// ---------- el mar: contorno de la isla, agua, marco de madera y puertos ----------
function hull(P){P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),L=[],R=[];
 for(const p of P){while(L.length>1&&cr(L[L.length-2],L[L.length-1],p)<=0)L.pop();L.push(p)}
 for(let i=P.length-1;i>=0;i--){const p=P[i];while(R.length>1&&cr(R[R.length-2],R[R.length-1],p)<=0)R.pop();R.push(p)}return L.slice(0,-1).concat(R.slice(0,-1))}
// el contorno corrido d hacia fuera con las esquinas redondas (polígono convexo)
function rodea(P,d,seg){let A=0;const n=P.length;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}const s=A>0?1:-1,out=[];
 const nr=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return s>0?[dy/l,-dx/l]:[-dy/l,dx/l]};
 for(let i=0;i<n;i++){const p=P[i],n1=nr(P[(i-1+n)%n],p),n2=nr(p,P[(i+1)%n]),a1=Math.atan2(n1[1],n1[0]),da=Math.atan2(n1[0]*n2[1]-n1[1]*n2[0],n1[0]*n2[0]+n1[1]*n2[1]);
  for(let j=0;j<=seg;j++){const a=a1+da*j/seg;out.push([p[0]+Math.cos(a)*d,p[1]+Math.sin(a)*d])}}return out}
const forma=P=>new THREE.Shape(P.map(p=>new THREE.Vector2(p[0],-p[1])));
function isla(G){const g=D.geo(G.hx),B=gb(),root=new THREE.Group(),P=hull(g.V.map(v=>[v.x,v.y]));
 const xs=P.map(p=>p[0]),zs=P.map(p=>p[1]),c=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2];
 const Pc=P.map(p=>[p[0]-c[0],p[1]-c[1]]),Wd=rodea(Pc,.9,5),Ou=rodea(Pc,1.22,5),In=rodea(Pc,.86,5);
 const agua=new THREE.Mesh(new THREE.ShapeGeometry(forma(Wd),4),std('#3B8C9A',.35));agua.rotation.x=-PI/2;agua.position.y=.12;agua.receiveShadow=true;root.add(agua);
 const sh=forma(Ou);sh.holes.push(new THREE.Path(In.slice().reverse().map(p=>new THREE.Vector2(p[0],-p[1]))));
 const mg=new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2,curveSegments:4});
 const marco=new THREE.Mesh(mg,std('#8E5A32',.6));marco.rotation.x=-PI/2;marco.castShadow=marco.receiveShadow=true;root.add(marco);
 // olas: rayitas claras quietas sobre el agua
 const f=pila();Pc.forEach((p,i)=>{if(i%2)return;const l=Math.hypot(p[0],p[1])||1,x=p[0]+p[0]/l*.45,z=p[1]+p[1]/l*.45;f(B.caja,'#8CCAD2',x,.125,z,.22,.006,.03,-Math.atan2(p[1],p[0])+PI/2)});
 // puertos: dos muelles desde la orilla, un barquito y su tasa
 const tasas=[];G.ports.forEach(pt=>{const Ed=g.E[pt.e],h=g.H[pt.h];if(!Ed||!h)return;const ex=Ed.x-c[0],ez=Ed.y-c[1],ux=Ed.x-h.x,uz=Ed.y-h.y,l=Math.hypot(ux,uz)||1,nx=ux/l,nz=uz/l,ry=-Math.atan2(nz,nx);
  Ed.v.forEach(v=>{const a=[g.V[v].x-c[0],g.V[v].y-c[1]],b=[a[0]+(ex-a[0])*.25,a[1]+(ez-a[1])*.25];f(B.caja,'#7A4A28',b[0]+nx*.2,.15,b[1]+nz*.2,.42,.04,.07,ry)});
  const bx=ex+nx*.56,bz=ez+nz*.56,ty=ry+PI/2;f(B.caja,'#6B3F22',bx,.16,bz,.3,.07,.12,ty);f(B.cil,'#5A3519',bx,.3,bz,.012,.24,.012);
  f(B.cono5,'#F4EBDA',bx+Math.cos(ty)*.05,.3,bz-Math.sin(ty)*.05,.09,.2,.012,ty);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tasa(pt.r),depthWrite:false}));s.scale.set(.8,.33,1);s.position.set(bx,.7,bz);s.renderOrder=3;root.add(s);tasas.push(s)});
 const det=new THREE.Mesh(junta(f.L),std(0xffffff,.7,{vertexColors:true}));det.castShadow=true;root.add(det);
 const tierra=[];G.hx.forEach((h,i)=>{const T=terreno(h,i);if(!T)return;T.g.position.set(g.H[i].x-c[0],0,g.H[i].y-c[1]);root.add(T.g);tierra[i]=T});
 return {g:root,tierra,c,box:rodea(Pc,1.27,2),tasas}}
// ---------- piezas (redondeadas, del color del jugador) ----------
const MJ={},mat=col=>MJ[col]||(MJ[col]=std(col,.5));
function rrect(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
const ext=(s,d,b)=>{const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:6});g.translate(0,0,-d/2);return g};
function geoP(w){if(GT[w])return GT[w];let g;
 if(w=='p'){const s=new THREE.Shape([[-.15,0],[.15,0],[.15,.16],[0,.28],[-.15,.16]].map(p=>new THREE.Vector2(...p)));g=ext(s,.2,.028);g.translate(0,.028,0)}
 else if(w=='u'){const q=[[-12,7],[-12,-3],[-6,-9],[0,-3],[0,-4],[2,-4],[2,-12],[7,-16],[12,-12],[12,7]].map(p=>new THREE.Vector2(p[0]*.015,(7-p[1])*.015));g=ext(new THREE.Shape(q),.22,.026);g.translate(0,.026,0)}
 else if(w=='c'){g=ext(rrect(.56,.13,.06),.08,.022);g.rotateX(-PI/2);g.translate(0,.062,0)}
 return GT[w]=g}
function pieza(w,col){const m=new THREE.Mesh(geoP(w),mat(col));m.castShadow=true;m.receiveShadow=true;return m}
function ladron(){const p=[[0,0],[.14,0],[.15,.03],[.11,.07],[.085,.19],[.11,.22],[.1,.245],[.06,.26],[.09,.3],[.1,.35],[.08,.4],[.04,.43],[0,.44]].map(q=>new THREE.Vector2(q[0],q[1]));
 const m=new THREE.Mesh(GT.lad||(GT.lad=new THREE.LatheGeometry(p,14)),MJ.lad||(MJ.lad=std("#2A221E",.55)));m.castShadow=true;return m}
function dado(){const g=GT.dado||(GT.dado=new THREE.BoxGeometry(1,1,1)),M=MJ.dado||(MJ.dado=[3,4,1,6,2,5].map(v=>new THREE.MeshStandardMaterial({map:cara(v),roughness:.45})));
 const m=new THREE.Mesh(g,M);m.castShadow=true;return m}
// qué giro deja la cara v arriba (caras: +x 3, -x 4, +y 1, -y 6, +z 2, -z 5)
const ARR={1:[0,0,0],6:[PI,0,0],2:[-PI/2,0,0],5:[PI/2,0,0],3:[0,0,PI/2],4:[0,0,-PI/2]};
function arriba(v,yaw){const a=ARR[v]||ARR[1];return new THREE.Quaternion().setFromAxisAngle(v3(0,1,0),yaw).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(a[0],a[1],a[2])))}
// ---------- la mesa rectangular: madera con canto, fieltro, cuatro patas y una silla por rival ----------
// hx,hz: medio ancho y medio largo del fieltro. m sillas (i = 1..m, el 0 eres tú y no lleva). Orden: lado izquierdo de cerca a lejos, cabecera, lado derecho de lejos a cerca.
function lugares(m){return m<=1?['H']:m==2?['Lm','Rm']:m==3?['Lm','H','Rm']:m==4?["Ln","Lf","Rf","Rn"]:m==5?["Ln","Lf","H","Rf","Rn"]:["Ln","Lm","Lf","Rf","Rm","Rn"]}
function juntaG(g){const por=new Map();g.updateMatrixWorld(true);g.traverse(o=>{if(!o.isMesh)return;const k=o.material;if(!por.has(k))por.set(k,[]);por.get(k).push(o)});
 const out=new THREE.Group();por.forEach((L,mt)=>{const m=new THREE.Mesh(junta(L.map(o=>({g:o.geometry,m:o.matrixWorld.clone(),c:'#ffffff'}))),mt);m.castShadow=m.receiveShadow=true;out.add(m)});return out}
function mesa(hx,hz,m){const g=new THREE.Group(),ORL=.55,wood=std('#6E3B1B',.42),dark=std('#3A1E0C',.55),pies=[];
 const tab=new THREE.Mesh(ext(rrect(2*(hx+ORL),2*(hz+ORL),.6),.34,.06),wood);tab.rotation.x=PI/2;tab.position.y=-.26;tab.castShadow=tab.receiveShadow=true;g.add(tab);
 const sh=rrect(2*(hx+ORL),2*(hz+ORL),.6);sh.holes.push(rrect(2*hx,2*hz,.35));const canto=new THREE.Mesh(ext(sh,.1,.03),wood);canto.rotation.x=-PI/2;canto.position.y=.03;canto.castShadow=canto.receiveShadow=true;g.add(canto);
 const felt=new THREE.Mesh(new THREE.ShapeGeometry(rrect(2*hx,2*hz,.35),6),std('#46613F',.95));felt.rotation.x=-PI/2;felt.position.y=.004;felt.receiveShadow=true;g.add(felt);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const p=new THREE.Mesh(gb().cil,dark);p.position.set(a*(hx-.3),0,b*(hz-.3));p.castShadow=true;g.add(p);pies.push(p)});
 const pos=lugares(m),sillas=[null],seats=[null];
 const k0=window.MESA&&MESA.sillaSola?juntaG(MESA.sillaSola()):null;
 pos.forEach(()=>{const s=k0?k0.clone():new THREE.Group();g.add(s);sillas.push(s)});
 const M={g,hx,hz,ORL,sillas,felt,pies,k:1,pos,
  asiento(i){const L=pos[i-1];if(!L)return null;const d=ORL+.55*M.k,zz=L[1]=='n'?hz*.3:L[1]=='f'?-hz*.55:-hz*.12;
   if(L=='H')return {pos:v3(0,0,-hz-d),ry:0,mira:v3(0,0,1),mano:v3(0,0,-hz+.3)};
   const sx=L[0]=='L'?-1:1;return {pos:v3(sx*(hx+d),0,zz),ry:-sx*PI/2,mira:v3(-sx,0,0),mano:v3(sx*(hx-.3),0,zz)}},
  // k: tamaño de las personas y sus sillas (en la casa, el de la casa); las patas llegan al piso (-1.55·k)
  escala(k){M.k=k;sillas.forEach((s,i)=>{if(!s)return;const A=M.asiento(i);s.position.copy(A.pos);s.rotation.y=A.ry;s.scale.setScalar(k)});
   const fl=1.55*k,h=fl-.5;pies.forEach(p=>{p.scale.set(.2,h,.2);p.position.y=-.5-h/2})}};
 M.escala(1);return M}
window.CO3K={isla,pieza,ladron,dado,arriba,mesa,dorso,lugar,TOP:Y0,mat};
})();
