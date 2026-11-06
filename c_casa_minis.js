// Maquetas sobre las mesas de la casa (en vez de las cartitas): Mérida en Venta, YuCATÁN, Continental, Uno y Monopoly Deal.
// Todo con InstancedMesh y geometrías/materiales compartidos: ~8 draw calls por mesa. MINI.pon(G, juego, alturaDeLaMesa, hit) → true si puso algo.
(function(){
const T=()=>window.THREE,TAU=Math.PI*2;let K=null;
function cv(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new (T().CanvasTexture)(c);t.colorSpace=T().SRGBColorSpace;t.anisotropy=8;return t}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const mat=(c,r,o)=>new (T().MeshStandardMaterial)(Object.assign({color:c,roughness:r==null?.7:r},o||{}));
function rnd(s){return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
// instancias: [[x,y,z, rotY, escala(número o [x,y,z]), color?, rotX?, rotZ?], ...]
function inst(geo,m,L,P){const THREE=T(),im=new THREE.InstancedMesh(geo,m,L.length),o=new THREE.Object3D(),c=new THREE.Color();o.rotation.order="YXZ";
 L.forEach((a,i)=>{o.position.set(a[0],a[1],a[2]);o.rotation.set(a[6]||0,a[3]||0,a[7]||0);const s=a[4]==null?1:a[4];if(s.length)o.scale.set(s[0],s[1],s[2]);else o.scale.setScalar(s);
  o.updateMatrix();im.setMatrixAt(i,o.matrix);if(a[5])im.setColorAt(i,c.set(a[5]))});
 im.castShadow=im.receiveShadow=true;P.add(im);return im}
function kit(){if(K)return K;const THREE=T();
 const hs=new THREE.Shape([[-.028,0],[.028,0],[.028,.04],[0,.068],[-.028,.04]].map(p=>new THREE.Vector2(p[0],p[1])));
 const house=new THREE.ExtrudeGeometry(hs,{depth:.05,bevelEnabled:false});house.translate(0,0,-.025);
 const pawn=new THREE.LatheGeometry([[0,0],[.05,0],[.05,.012],[.036,.02],[.018,.07],[.03,.085],[.034,.1],[.024,.122],[0,.13]].map(p=>new THREE.Vector2(p[0],p[1])),14);
 const die=new THREE.BoxGeometry(1,1,1),uv=die.attributes.uv;   // 6 caras en un atlas 3x2: un solo draw call para los dos dados
 for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v,col=f%3,row=f/3|0;uv.setXY(i,(col+uv.getX(i))/3,(1-row+uv.getY(i))/2)}
 const dieT=cv(384,256,(g)=>{const P={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]};
  [1,6,2,5,3,4].forEach((n,f)=>{const x=f%3*128,y=(f/3|0)*128;g.fillStyle='#fbf7ee';g.fillRect(x,y,128,128);g.fillStyle=n==1?'#c62828':'#2b2118';
   P[n].forEach(([a,b])=>{g.beginPath();g.arc(x+a*32,y+b*32,n==1?17:12,0,TAU);g.fill()})})});
 return K={house,pawn,die,dieM:mat(0xffffff,.35,{map:dieT}),pl:mat(0xffffff,.45),box:new THREE.BoxGeometry(1,1,1)}}

// ---------- Mérida en Venta: tablero de 40 casillas con casitas, hotel, fichas, dados y billetes ----------
const MW=1024,MC=136,MCW=(MW-2*MC)/9,MB=2.5;
function rot(x,y,s){for(let k=0;k<s;k++){const dx=x-MW/2,dy=y-MW/2;x=MW/2-dy;y=MW/2+dx}return[x,y]}   // 90° por lado (sentido del reloj)
function cell(i,d){const s=i/10|0,j=i%10,[x,y]=rot(MW-MC-(j-.5)*MCW,MW-MC+d,s);return[(x/MW-.5)*MB,(y/MW-.5)*MB,s]}   // centro de la casilla a d px del borde de adentro
let mTex=null;
function meridaTex(){if(mTex)return mTex;const D=window.MERD,B=D&&D.board,gc=(D&&D.gcol)||[];
 return mTex=cv(MW,MW,(g)=>{g.fillStyle='#f3ecd8';g.fillRect(0,0,MW,MW);g.fillStyle='#e6efd9';g.fillRect(MC,MC,MW-2*MC,MW-2*MC);
  g.strokeStyle='#3b2f2a';g.lineWidth=3;g.strokeRect(MC,MC,MW-2*MC,MW-2*MC);g.strokeRect(3,3,MW-6,MW-6);
  const mid=(t,x,y,sz,c,f)=>{g.fillStyle=c;g.font=(f||'bold ')+sz+'px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,x,y)};
  for(let s=0;s<4;s++){g.save();g.translate(MW/2,MW/2);g.rotate(s*Math.PI/2);g.translate(-MW/2,-MW/2);
   for(let j=1;j<10;j++){const i=s*10+j,c=B&&B[i]||{},x=MW-MC-j*MCW,y=MW-MC;g.strokeStyle='#3b2f2a';g.lineWidth=2;g.strokeRect(x,y,MCW,MC);
    if(c.t=='p'){g.fillStyle=gc[c.g]||'#999';g.fillRect(x+1,y+1,MCW-2,MC*.24);g.strokeRect(x,y,MCW,MC*.24);g.fillStyle='#8b8172';g.fillRect(x+16,y+MC*.42,MCW-32,5);g.fillRect(x+22,y+MC*.52,MCW-44,5);mid('$'+c.p,x+MCW/2,y+MC*.8,19,'#3b2f2a','')}
    else if(c.t=='r'){g.fillStyle='#2b2b2b';rr(g,x+16,y+40,MCW-32,30,6);g.fill();g.fillStyle='#f3ecd8';g.fillRect(x+22,y+46,MCW-44,9);g.fillStyle='#2b2b2b';[x+26,x+MCW-26].forEach(a=>{g.beginPath();g.arc(a,y+74,7,0,TAU);g.fill()});mid('$200',x+MCW/2,y+MC*.8,19,'#3b2f2a','')}
    else if(c.t=='s')mid('?',x+MCW/2,y+MC*.5,64,'#ef7d22');
    else if(c.t=='c'){g.fillStyle='#22b3c4';rr(g,x+18,y+44,MCW-36,40,6);g.fill();g.fillStyle='#f3ecd8';g.fillRect(x+18,y+58,MCW-36,4)}
    else if(c.t=='u'){g.fillStyle=i<20?'#f2c230':'#22b3c4';g.beginPath();g.arc(x+MCW/2,y+60,20,0,TAU);g.fill();mid('$150',x+MCW/2,y+MC*.8,19,'#3b2f2a','')}
    else if(c.t=='tax'){g.fillStyle='#8b8172';g.beginPath();g.moveTo(x+MCW/2,y+36);g.lineTo(x+MCW-20,y+64);g.lineTo(x+MCW/2,y+92);g.lineTo(x+20,y+64);g.closePath();g.fill()}}
   g.restore()}
  const cor=(x,y,a,f)=>{g.save();g.translate(x+MC/2,y+MC/2);g.rotate(a);f();g.restore()};
  cor(MW-MC,MW-MC,-Math.PI/4,()=>{mid('SALIDA',0,-18,26,'#3b2f2a');g.fillStyle='#d63a3a';g.beginPath();g.moveTo(-44,22);g.lineTo(-14,4);g.lineTo(-14,14);g.lineTo(44,14);g.lineTo(44,30);g.lineTo(-14,30);g.lineTo(-14,40);g.closePath();g.fill()});
  cor(0,MW-MC,Math.PI/4,()=>{g.fillStyle='#ef7d22';g.fillRect(-36,-36,72,72);g.strokeStyle='#3b2f2a';g.lineWidth=5;for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(k*18,-36);g.lineTo(k*18,36);g.stroke()}});
  cor(0,0,3*Math.PI/4,()=>{g.fillStyle='#f2c230';g.beginPath();g.arc(0,-8,24,0,TAU);g.fill();g.fillStyle='#22b3c4';g.fillRect(-46,22,92,16)});
  cor(MW-MC,0,-3*Math.PI/4,()=>{g.fillStyle='#1e3a6b';g.beginPath();g.arc(0,0,34,0,TAU);g.fill();mid('!',0,2,52,'#f3ecd8')});
  // centro: listón y nombre
  g.save();g.translate(MW/2,MW/2);g.rotate(-Math.PI/4);g.fillStyle='#d63a3a';g.fillRect(-300,-62,600,124);g.fillStyle='#b02c2c';g.fillRect(-300,-62,600,8);g.fillRect(-300,54,600,8);
  mid('MÉRIDA',0,-12,76,'#fff8ea');mid('EN VENTA',0,40,30,'#ffe0a8');g.restore();
  // lugares de las cartas
  g.setLineDash([10,8]);g.lineWidth=3;g.strokeStyle='#ef7d22';g.strokeRect(250,250,170,118);g.strokeStyle='#22b3c4';g.strokeRect(MW-420,MW-368,170,118);g.setLineDash([])})}
function merida(P){const THREE=T(),k=kit(),D=window.MERD||{},gc=D.gcol||[],pc=D.pcol||['#e53935','#1e88e5','#43a047','#fb8c00'];
 const base=new THREE.Mesh(k.box,mat(0x2f4a3a,.6));base.scale.set(MB,.05,MB);base.position.y=.025;base.castShadow=base.receiveShadow=true;P.add(base);
 const top=new THREE.Mesh(new THREE.PlaneGeometry(MB-.03,MB-.03),mat(0xffffff,.8,{map:meridaTex()}));top.rotation.x=-Math.PI/2;top.position.y=.051;top.receiveShadow=true;P.add(top);
 const Y=.051,hs=[];   // casitas verdes y hoteles rojos sobre la franja de color
 [[6,2],[8,3],[9,2],[16,1],[18,2],[19,1],[26,4],[27,4],[29,3]].forEach(([i,n])=>{const[x,z,s]=cell(i,MC*.12);for(let q=0;q<n;q++){const o=(q-(n-1)/2)*.046,dx=s%2?0:o,dz=s%2?o:0;hs.push([x+(s==0?-dx:s==2?dx:0),Y,z+(s==1?-dz:s==3?dz:0),-s*Math.PI/2+Math.PI/2,.85,'#2e9e57'])}});
 [37,39].forEach(i=>{const[x,z,s]=cell(i,MC*.12);hs.push([x,Y,z,-s*Math.PI/2+Math.PI/2,[1.9,1.15,1],'#d63a3a'])});
 inst(k.house,k.pl,hs,P);
 inst(k.pawn,mat(0xffffff,.3,{metalness:.25}),[[...cell(0,MC*.55).slice(0,2),pc[0]],[...cell(14,MC*.6).slice(0,2),pc[1]],[...cell(24,MC*.6).slice(0,2),pc[2]],[...cell(31,MC*.58).slice(0,2),pc[3]]].map(([x,z,c],i)=>[x+(i==0?.07:0),Y,z,0,1.25,c]),P);
 inst(k.die,k.dieM,[[.14,Y+.06,.2,.5,.12],[.33,Y+.06,.12,1.2,.12,null,Math.PI/2]],P);
 // mazos de Suerte y Comunidad (sobre su lugar del centro)
 const card=(c,t)=>cv(256,176,g=>{g.fillStyle='#fbf7ee';rr(g,0,0,256,176,18);g.fill();g.fillStyle=c;rr(g,10,10,236,156,12);g.fill();g.fillStyle='#fff8ea';g.font='bold 92px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,92)});
 [['#ef7d22','?',-1],['#22b3c4','✦',1]].forEach(([c,t,sg])=>{const m=new THREE.Mesh(k.box,[mat(0xf3ecd8),mat(0xf3ecd8),mat(0xffffff,.6,{map:card(c,t)}),mat(0xf3ecd8),mat(0xf3ecd8),mat(0xf3ecd8)]);
  const cx=(335/MW-.5)*MB*sg*-1,cz=(309/MW-.5)*MB*sg*-1;m.scale.set(.38,.04,.27);m.position.set(cx,Y+.02,cz);m.rotation.y=sg>0?Math.PI:0;m.castShadow=true;P.add(m)});
 // billetes a un lado del tablero
 const bill=cv(256,128,g=>{g.fillStyle='#fff';g.fillRect(0,0,256,128);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=6;g.strokeRect(12,12,232,104);g.beginPath();g.arc(128,64,30,0,TAU);g.stroke();g.fillStyle='rgba(0,0,0,.45)';g.font='bold 40px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('$',128,66)});
 const bm=new THREE.BoxGeometry(.34,.008,.17);const bl=[];['#f4f1e8','#f6c9d6','#bfe3f2','#cfe8b8','#f6e39a'].forEach((c,s)=>{for(let q=0;q<3+s%2;q++)bl.push([-.74+s*.37,.004+q*.009,MB/2+.24+(q%2)*.012,(q%2?.04:-.03)+s*.02,1,c])});
 inst(bm,mat(0xffffff,.8,{map:bill}),bl,P)}

// ---------- YuCATÁN: isla de 19 hexágonos (henequén, maíz, piedra, miel, sal y el cenote) con ranchos, haciendas y sacbés ----------
const HX=[[0,-2,1],[1,-2,0],[2,-2,3],[-1,-1,2],[0,-1,4],[1,-1,0],[2,-1,2],[-2,0,3],[-1,0,1],[0,0,5],[1,0,4],[2,0,0],[-2,1,0],[-1,1,1],[0,1,2],[1,1,3],[-2,2,4],[-1,2,1],[0,2,2]];   // [q, r, terreno] (FIX19 de haciendas_data.js)
const HS=.34,HCOL=['#7fae6a','#e4c45c','#a49e93','#e0a243','#eab3c0','#9c917c'];
function yucatan(P){const THREE=T(),k=kit(),R=(4*HS+.1)/.866,h0=.05,ty=h0+.075,rn=rnd(7);
 const pos=([q,r])=>[Math.sqrt(3)*HS*(q+r/2),1.5*HS*r],cor=(i,c)=>{const[x,z]=pos(HX[i]),a=c*Math.PI/3;return[x+HS*Math.sin(a),z+HS*Math.cos(a)]};
 const fr=new THREE.Mesh(new THREE.CylinderGeometry(R+.09,R+.12,.04,6),mat(0x6e3b1b,.5));fr.rotation.y=Math.PI/6;fr.position.y=.02;fr.castShadow=fr.receiveShadow=true;P.add(fr);
 const sea=new THREE.Mesh(new THREE.CylinderGeometry(R,R,h0,6),mat(0x2a9bbd,.25,{metalness:.1}));sea.rotation.y=Math.PI/6;sea.position.y=h0/2+.005;sea.receiveShadow=true;P.add(sea);
 inst(new THREE.CylinderGeometry(HS*.98,HS*.98,.05,6),mat(0xe8d6a8,.85),HX.map(t=>{const[x,z]=pos(t);return[x,h0+.025,z]}),P);
 const tg=new THREE.CylinderGeometry(HS*.86,HS*.9,.035,6);tg.translate(0,.0175,0);
 inst(tg,mat(0xffffff,.85),HX.map(t=>{const[x,z]=pos(t);return[x,h0+.04,z,0,1,HCOL[t[2]]]}),P);
 const F={0:[],1:[],2:[],3:[],4:[]},spot=(x,z,rad)=>{const a=rn()*TAU,d=Math.sqrt(rn())*rad;return[x+Math.cos(a)*d,z+Math.sin(a)*d]};
 HX.forEach(t=>{const[x,z]=pos(t),y=ty,ty0=t[2];
  if(ty0==0)for(let n=0;n<6;n++){const[a,b]=spot(x,z,.2);for(let l=0;l<5;l++)F[0].push([a,y,b,l*TAU/5+rn(),[.9,.8+rn()*.4,.9],null,.5,0])}   // agaves: 5 hojas abiertas
  if(ty0==1)for(let rw=-2;rw<=2;rw++)for(let c=-2;c<=2;c++){if(Math.abs(rw)+Math.abs(c)>3||rn()<.15)continue;F[1].push([x+c*.07+rw*.02,y,z+rw*.075,rn()*TAU,[1,.8+rn()*.5,1]])}
  if(ty0==2)for(let n=0;n<5;n++){const[a,b]=spot(x,z,.2),s=.05+rn()*.05;F[2].push([a,y+s*.3,b,rn()*TAU,[s,s*.8,s*1.1],null,rn(),rn()])}
  if(ty0==3)for(let n=0;n<3;n++){const[a,b]=spot(x,z,.17);F[3].push([a,y,b,rn()*TAU,1])}
  if(ty0==4)for(let n=0;n<5;n++){const[a,b]=spot(x,z,.2);F[4].push([a,y,b,rn()*TAU,.7+rn()*.5])}
  if(ty0==5){const w=new THREE.Mesh(new THREE.CylinderGeometry(HS*.5,HS*.42,.012,24),mat(0x18b6c9,.15,{emissive:0x0a4a55,emissiveIntensity:.5}));w.position.set(x,y+.003,z);P.add(w);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(HS*.52,.025,6,24),mat(0x8a7f6a,.9));ring.rotation.x=Math.PI/2;ring.position.set(x,y+.01,z);ring.castShadow=true;P.add(ring)}});
 const leaf=new THREE.ConeGeometry(.012,.13,4);leaf.translate(0,.065,0);inst(leaf,mat(0x5e9c86,.6),F[0],P);
 const corn=new THREE.CylinderGeometry(.008,.012,.13,5);corn.translate(0,.065,0);inst(corn,mat(0x8fb04a,.7),F[1],P);
 const cob=new THREE.CapsuleGeometry(.012,.025,2,6);cob.translate(.012,.09,0);inst(cob,mat(0xf0c43a,.6),F[1],P);
 inst(new THREE.IcosahedronGeometry(1,0),mat(0x8d877d,.95,{flatShading:true}),F[2],P);
 const hive=new THREE.SphereGeometry(.05,10,8);hive.scale(1,1.15,1);hive.translate(0,.045,0);inst(hive,mat(0xc98a3a,.8),F[3],P);
 const salt=new THREE.ConeGeometry(.05,.06,8);salt.translate(0,.03,0);inst(salt,mat(0xfbfbf7,.6),F[4],P);
 // ranchos y haciendas en esquinas, sacbés en orillas (colores de jugador de HACD.PCOL)
 const pc=(window.HACD&&HACD.PCOL)||['#d63a3a','#2563eb','#f4f1e8','#f07c1a'],yv=ty+.002,hx=[],rd=[];
 [[8,0,0,1],[5,3,1,0],[13,2,2,0],[2,4,3,1],[15,1,0,0],[10,5,1,1]].forEach(([i,c,p,big])=>{const[x,z]=cor(i,c);hx.push([x,yv,z,rn()*TAU,big?[1.6,1.35,1.3]:1.1,pc[p]]);
  const[a,b]=cor(i,(c+1)%6);rd.push([(x+a)/2,yv,(z+b)/2,Math.atan2(a-x,b-z),[.045,.03,HS*.62],pc[p]]);if(big){const[e,f]=cor(i,(c+5)%6);rd.push([(x+e)/2,yv,(z+f)/2,Math.atan2(e-x,f-z),[.045,.03,HS*.62],pc[p]])}});
 inst(k.house,k.pl,hx,P);
 const road=new THREE.BoxGeometry(1,1,1);road.translate(0,.5,0);inst(road,k.pl,rd,P);
 inst(k.die,k.dieM,[[R+.06,.06,-.95,.7,.12],[R-.05,.06,-1.18,2,.12,null,Math.PI/2]],P)}   // dados en la orilla de la mesa

// ---------- Cartas con volumen: un atlas por juego y UN draw call por mesa (por instancia: celda de la cara de arriba, de abajo y del canto) ----------
const CW=.3,CH=.42,CT=.006,AC=8,AR=4,PW=128,PH=184,AT={},v2=p=>new (T().Vector2)(p[0],p[1]);
const txt=(g,s,x,y,px,c,f)=>{g.font=(f==null?'bold ':f)+px+'px Georgia,serif';g.fillStyle=c;g.textAlign='center';g.textBaseline='middle';g.fillText(s,x,y)};
const atlas=(k,cells)=>AT[k]||(AT[k]=cv(AC*PW,AR*PH,g=>cells.forEach((f,i)=>{g.save();g.translate(i%AC*PW,(i/AC|0)*PH);f(g,PW,PH);g.restore()})));
const canto=(c,l)=>(g,w,h)=>{g.fillStyle=c;g.fillRect(0,0,w,h);g.fillStyle=l;for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1)};
const blanco=(g,w,h,c)=>{g.fillStyle=c||'#fdfbf5';rr(g,1,1,w-2,h-2,12);g.fill()};
function cardMat(tex){const m=mat(0xffffff,.55,{map:tex,alphaTest:.5});
 m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aCard;attribute float aFace;').replace('#include <uv_vertex>','#include <uv_vertex>\nfloat cId=aFace>1.5?aCard.y:(aFace>.5?aCard.x:aCard.z),cRow=floor((cId+.5)/'+AC+'.);vMapUv=(vec2(cId-cRow*'+AC+'.,'+(AR-1)+'.-cRow)+uv)/vec2('+AC+'.,'+AR+'.);')};
 m.customProgramCacheKey=()=>'cartaAtlas';return m}
function cartas(P,tex,L){const THREE=T();kit();if(!K.card){const g=new THREE.BoxGeometry(1,1,1),f=new Float32Array(24);f.fill(1,8,12);f.fill(2,12,16);g.setAttribute('aFace',new THREE.BufferAttribute(f,1));K.card=g}
 const g=K.card.clone(),a=new Float32Array(L.length*3);L.forEach((c,i)=>a.set(c[8],i*3));g.setAttribute('aCard',new THREE.InstancedBufferAttribute(a,3));return inst(g,cardMat(tex),L,P)}
// una carta (celda arriba; o.b abajo, o.t grueso para los mazos); y = altura de su base
const cd=(L,x,z,ry,top,y,o)=>{o=o||{};const t=o.t||CT;L.push([x,(y||0)+t/2,z,ry,[CW,t,CH],null,o.rx||0,o.rz||0,[top,o.b==null?1:o.b,0]])};
const pos=(a,d,q)=>[Math.cos(a)*d+Math.sin(a)*q,Math.sin(a)*d-Math.cos(a)*q];   // frente al asiento de ángulo a: d hacia afuera, q a su derecha
// fila o cascada frente al asiento (la punta de la carta mira al centro)
function fila(L,a,d,q,cells,dd,dq){cells.forEach((k,j)=>{const[x,z]=pos(a,d+j*dd,q+j*dq);cd(L,x,z,Math.PI/2-a,k,j*.0065)})}
function abanico(L,a,d,cells,sp){const n=cells.length,[px,pz]=pos(a,d,0);cells.forEach((k,i)=>{const th=Math.PI/2-a-(i-(n-1)/2)*sp;cd(L,px-Math.sin(th)*CH*.38,pz-Math.cos(th)*CH*.38,th,k,i*.0065)})}
function monton(L,x,z,cells,rn,sp,ry,jr){cells.forEach((k,i)=>cd(L,x+(rn()-.5)*sp,z+(rn()-.5)*sp,(ry||0)+(rn()-.5)*(jr==null?1.2:jr),k,i*.0065))}
function tienda(L,x,z,ry,c1,c2,ang){const h=CH/2*Math.sin(ang),o=CH/2*Math.cos(ang);[[o,ang,c1],[-o,-ang,c2]].forEach(([d,rx,k])=>L.push([x+Math.sin(ry)*d,h,z+Math.cos(ry)*d,ry,[CW,CT,CH],null,rx,0,[k,1,0]]))}   // dos cartas de canto, recargadas
// fichas de casino: canto con rayas y cara con anillo (un draw call; el color va por instancia)
function fichas(P,L){const THREE=T();kit();if(!K.chip){const g=new THREE.CylinderGeometry(.06,.06,.018,24),n=g.attributes.normal,uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++){const c=Math.abs(n.getY(i))>.5;uv.setXY(i,c?uv.getX(i)*.5:uv.getX(i),c?uv.getY(i)*.5:.5+uv.getY(i)*.5)}
  const t=cv(256,256,g=>{g.fillStyle='#000';g.fillRect(0,0,256,256);g.fillStyle='#fff';for(let k=0;k<8;k++)g.fillRect(k*32+11,0,10,128);
   g.strokeStyle='#fff';g.lineWidth=13;for(let k=0;k<8;k++){g.beginPath();g.arc(64,192,55,k*TAU/8,k*TAU/8+.32);g.stroke()}g.lineWidth=3;g.beginPath();g.arc(64,192,36,0,TAU);g.stroke()});
  const m=mat(0xffffff,.4,{map:t});m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','float kF=texture2D(map,vMapUv).r;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.91,.86),kF);')};
  m.customProgramCacheKey=()=>'ficha';K.chip=[g,m]}
 return inst(K.chip[0],K.chip[1],L,P)}
const pila=(L,x,z,n,c,rn)=>{for(let i=0;i<n;i++)L.push([x+(rn()-.5)*.006,.009+i*.0185,z+(rn()-.5)*.006,rn()*TAU,1,c])};
// vaso con bebida sobre posavasos (3 draw calls)
function vaso(P,x,z,liq,h){const THREE=T();kit();if(!K.vaso){K.vaso=new THREE.LatheGeometry([[0,0],[.058,0],[.066,.13],[.061,.13],[.053,.014],[0,.014]].map(v2),24);K.vasoM=mat(0xeef7f8,.04,{transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false})}
 const add=(geo,m,y)=>{const e=new THREE.Mesh(geo,m);e.position.set(x,y,z);P.add(e);return e};
 add(new THREE.CylinderGeometry(.09,.09,.006,24),mat(0x9a6a3c,.9),.003).receiveShadow=true;
 const l=add(new THREE.CylinderGeometry(.056,.053,h,24),mat(liq,.12,{transparent:true,opacity:.85}),.02+h/2);l.castShadow=true;add(K.vaso,K.vasoM,.006)}

// ---------- Continental: mazo rojo, descarte, tercias y escalera bajadas, manos, fichas, trago y la libreta de anotaciones ----------
const PIP={1:[[.5,.5]],2:[[.5,.2],[.5,.8]],3:[[.5,.2],[.5,.5],[.5,.8]],4:[[.3,.2],[.7,.2],[.3,.8],[.7,.8]]};
PIP[5]=[...PIP[4],[.5,.5]];PIP[6]=[...PIP[4],[.3,.5],[.7,.5]];PIP[7]=[...PIP[6],[.5,.35]];PIP[8]=[...PIP[6],[.5,.35],[.5,.65]];
PIP[9]=[[.3,.2],[.7,.2],[.3,.4],[.7,.4],[.3,.6],[.7,.6],[.3,.8],[.7,.8],[.5,.5]];PIP[10]=[...PIP[9].slice(0,8),[.5,.3],[.5,.7]];
function palo(g,s,x,y,r){const C=(a,b,q)=>{g.beginPath();g.arc(a,b,q,0,TAU);g.fill()},Tr=(...p)=>{g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.fill()};
 if(s=='d')Tr(x,y-r,x+r*.72,y,x,y+r,x-r*.72,y);
 else if(s=='h'){C(x-r*.48,y-r*.32,r*.52);C(x+r*.48,y-r*.32,r*.52);Tr(x-r*.98,y-r*.18,x+r*.98,y-r*.18,x,y+r)}
 else if(s=='s'){C(x-r*.47,y+r*.2,r*.5);C(x+r*.47,y+r*.2,r*.5);Tr(x-r*.95,y+r*.1,x+r*.95,y+r*.1,x,y-r);Tr(x,y+r*.2,x+r*.32,y+r,x-r*.32,y+r)}
 else{C(x,y-r*.42,r*.4);C(x-r*.46,y+r*.12,r*.4);C(x+r*.46,y+r*.12,r*.4);C(x,y,r*.2);Tr(x,y,x+r*.3,y+r,x-r*.3,y+r)}}
function estrella(g,x,y,r){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}g.closePath();g.fill()}
function frances(id){return(g,w,h)=>{blanco(g,w,h);g.strokeStyle='#d9d2c2';g.lineWidth=1.5;g.stroke();
 if(id=='Jk'){g.fillStyle='#c62828';[[0,0],[w,h]].forEach(([x,y],i)=>{g.save();g.translate(x,y);g.rotate(i*Math.PI);'JOKER'.split('').forEach((c,j)=>txt(g,c,15,22+j*15,14,'#c62828'));g.restore()});estrella(g,w/2,h/2,40);g.fillStyle='#1d1d1d';estrella(g,w/2,h/2,15);return}
 const r=id.slice(0,-1),s=id.slice(-1),c='hd'.includes(s)?'#c62828':'#1d1d1d';
 const idx=()=>{txt(g,r,16,22,r=='10'?21:26,c);g.fillStyle=c;palo(g,s,16,44,8)};idx();g.save();g.translate(w,h);g.rotate(Math.PI);idx();g.restore();
 g.fillStyle=c;if('JQK'.includes(r)){g.fillStyle='#f4e7c4';g.fillRect(30,30,w-60,h-60);g.strokeStyle=c;g.lineWidth=2.5;g.strokeRect(30,30,w-60,h-60);txt(g,r,w/2,h/2+3,60,c);g.fillStyle=c;palo(g,s,43,45,9);palo(g,s,w-43,h-45,9)}
 else if(r=='A')palo(g,s,w/2,h/2,34);
 else PIP[+r].forEach(([x,y])=>{g.save();g.translate(w*(.5+(x-.5)*1.1),h*(.14+y*.72));if(y>.5)g.rotate(Math.PI);palo(g,s,0,0,13);g.restore()})}}
function dorsoRojo(g,w,h){blanco(g,w,h);g.fillStyle='#a8202a';rr(g,8,8,w-16,h-16,8);g.fill();g.save();g.clip();g.strokeStyle='rgba(255,215,195,.4)';g.lineWidth=2;
 for(let k=-h;k<w+h;k+=13){g.beginPath();g.moveTo(k,0);g.lineTo(k+h,h);g.moveTo(k+h,0);g.lineTo(k,h);g.stroke()}g.restore();g.strokeStyle='#fdfbf5';g.lineWidth=2;rr(g,14,14,w-28,h-28,6);g.stroke()}
const CN=['7s','7h','7d','9c','10c','Jc','Qc','As','Kd','3h','8s','Qh','Jk','5d','2s','Ks','4c','6d'];
function libreta(P,x,z,ry){const THREE=T(),geo=new THREE.BoxGeometry(.3,.012,.4),uv=geo.attributes.uv;for(let i=0;i<24;i++)if(i<8||i>11)uv.setXY(i,.02,.02);
 const t=cv(256,340,c=>{c.fillStyle='#fbf6e6';c.fillRect(0,0,256,340);c.fillStyle='#7a2626';c.fillRect(0,0,256,30);txt(c,'CONTINENTAL',128,16,15,'#f3e3b5');
  const R=['2T','1T1E','2E','3T','2T1E','1T2E','3E'],N=[[0,15,35,5],[20,0,45,10],[55,30,0,25],[0,40,15]];
  c.strokeStyle='#9ec5d8';c.lineWidth=1.5;for(let i=0;i<=7;i++){c.beginPath();c.moveTo(8,62+i*34);c.lineTo(248,62+i*34);c.stroke()}
  c.strokeStyle='#d98c8c';c.beginPath();c.moveTo(70,40);c.lineTo(70,310);c.stroke();['A','B','C','D'].forEach((p,j)=>txt(c,p,96+j*48,48,16,'#4a4038'));
  R.forEach((r,i)=>{txt(c,r,38,79+i*34,13,'#6a5f52','');(N[i]||[]).forEach((n,j)=>txt(c,''+n,96+j*48,80+i*34,19,'#1d3f9a','italic '))})});
 const m=new THREE.Mesh(geo,mat(0xffffff,.85,{map:t}));m.position.set(x,.006,z);m.rotation.y=ry;m.castShadow=m.receiveShadow=true;P.add(m)}
function lapiz(P,x,z,ry){const THREE=T(),C=['#2b2b2b','#e2c08f','#f2c230','#f2c230','#b9bcc4','#e58b98','#e58b98'],t=cv(4,70,g=>C.forEach((c,j)=>{g.fillStyle=c;g.fillRect(0,(6-j)*10,4,10)}));
 const m=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.0016,.005],[.0072,.028],[.0072,.2],[.0075,.2],[.0075,.218],[.007,.232],[0,.236]].map(v2),6),mat(0xffffff,.5,{map:t}));
 m.rotation.order='YXZ';m.rotation.set(0,ry,Math.PI/2);m.position.set(x,.0075,z);m.castShadow=true;P.add(m)}
function continental(P){const rn=rnd(11),L=[],I=n=>CN.indexOf(n)+2,q=Math.PI/4,B=1;
 cd(L,-.24,-.05,.08,B,0,{t:.07});monton(L,.24,-.05,['2s','4c','5d'].map(I),rn,.07);
 fila(L,q,.92,-.52,['7s','7h','7d'].map(I),0,.09);fila(L,q,.92,-.02,['9c','10c','Jc','Qc'].map(I),0,.09);fila(L,3*q,.92,-.22,['Ks','Kd','Jk'].map(I),0,.09);
 abanico(L,q,1.8,['As','3h','4c','8s','Qh','Kd','6d'].map(I),.13);abanico(L,3*q,1.8,Array(6).fill(B),.12);abanico(L,5*q,1.8,Array(8).fill(B),.1);abanico(L,7*q,1.8,Array(5).fill(B),.13);
 tienda(L,-.66,-.7,.7,I('Qh'),I('3h'),1.05);
 cartas(P,atlas('continental',[canto('#efe8d6','#cbbfa6'),dorsoRojo,...CN.map(frances)]),L);
 const F=[];pila(F,-1.56,-.1,9,'#c62828',rn);pila(F,-1.42,.12,7,'#1e5aa8',rn);pila(F,-1.66,.15,5,'#2e7d32',rn);pila(F,-1.36,-.16,4,'#262626',rn);
 pila(F,.62,-.66,3,'#c62828',rn);pila(F,.75,-.55,2,'#1e5aa8',rn);F.push([.66,.017,-.47,.4,1,'#e0a82e',.22,0]);fichas(P,F);
 vaso(P,1.55,.05,0xc07a2a,.045);libreta(P,-.04,-1.45,.12);lapiz(P,.2,-1.32,1.9)}

// ---------- Uno: mazo negro, descarte revuelto con un +4 encima, manos, flechas del sentido, refresco y palomitas ----------
const UC={r:'#e53935',y:'#f7c02a',g:'#3a9e48',b:'#1f74d1'},UQ=[UC.r,UC.b,UC.y,UC.g];
function unoSym(g,t,col,sc){g.save();g.scale(sc,sc);g.fillStyle=col;g.strokeStyle='#1c1c1c';g.lineWidth=3;g.lineJoin='round';
 if(t=='S'){g.lineWidth=11;g.strokeStyle=col;g.beginPath();g.arc(0,0,24,0,TAU);g.moveTo(-17,17);g.lineTo(17,-17);g.stroke()}
 else if(t=='R'){g.rotate(-Math.PI/4);[1,-1].forEach(d=>{g.save();g.scale(d,d);g.beginPath();g.moveTo(-14,26);g.lineTo(-14,-4);g.lineTo(-24,-4);g.lineTo(-7,-28);g.lineTo(10,-4);g.lineTo(0,-4);g.lineTo(0,26);g.closePath();g.fill();g.stroke();g.restore()})}
 else{g.font='900 '+(t.length>1?50:70)+'px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeText(t,0,3);g.fillText(t,0,3)}
 g.restore()}
function unoF(id){return(g,w,h)=>{const c=id[0],t0=id.slice(1),t=t0=='P'?'+2':t0,col=UC[c],neg=c=='w';
 blanco(g,w,h,'#fff');g.fillStyle=neg?'#1c1c1c':col;rr(g,8,8,w-16,h-16,9);g.fill();
 g.save();g.translate(w/2,h/2);g.beginPath();g.ellipse(0,0,w*.32,h*.42,.5,0,TAU);g.strokeStyle='#fff';
 if(t=='W'){g.save();g.clip();UQ.forEach((q,i)=>{g.fillStyle=q;g.fillRect(i%2?0:-w,i<2?-h:0,w,h)});g.restore();g.lineWidth=3;g.stroke()}
 else if(t=='4'){g.lineWidth=4;g.stroke();[[UC.b,-14,-20],[UC.g,-6,4],[UC.y,8,-12],[UC.r,15,12]].forEach(([q,x,y])=>{g.fillStyle=q;rr(g,x-11,y-16,22,32,4);g.fill();g.lineWidth=2;g.stroke()})}
 else{g.fillStyle='#fff';g.fill();unoSym(g,t,col,1)}
 g.restore();[[17,25,0],[w-17,h-25,Math.PI]].forEach(([x,y,r])=>{g.save();g.translate(x,y);g.rotate(r);if(t=='W')UQ.forEach((q,i)=>{g.fillStyle=q;g.fillRect(i%2?0:-7,i<2?-10:0,7,10)});else unoSym(g,t=='4'?'+4':t,'#fff',.32);g.restore()})}}
function dorsoUno(g,w,h){blanco(g,w,h,'#fff');g.fillStyle='#1c1c1c';rr(g,8,8,w-16,h-16,9);g.fill();g.save();g.translate(w/2,h/2);g.beginPath();g.ellipse(0,0,w*.33,h*.4,.5,0,TAU);g.fillStyle='#e53935';g.fill();
 g.rotate(-.45);g.font='italic 900 40px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=7;g.lineJoin='round';g.strokeStyle='#1c1c1c';g.strokeText('UNO',0,2);g.fillStyle='#f9d02e';g.fillText('UNO',0,2);g.restore()}
const UN=['r7','y2','g5','b9','rP','gR','bS','wW','w4','b3','r4','g1','y8','yP','bP'];
function flecha(r1,r2,a0,a1){const THREE=T(),s=new THREE.Shape(),N=24,p=(a,r)=>[Math.cos(a)*r,Math.sin(a)*r],w=r2-r1,am=(r1+r2)/2;
 for(let i=0;i<=N;i++){const q=p(a0+(a1-a0)*i/N,r2);i?s.lineTo(...q):s.moveTo(...q)}
 s.lineTo(...p(a1,r2+w*.7));s.lineTo(...p(a1+.2,am));s.lineTo(...p(a1,r1-w*.7));for(let i=N;i>=0;i--)s.lineTo(...p(a0+(a1-a0)*i/N,r1));
 const g=new THREE.ExtrudeGeometry(s,{depth:.01,bevelEnabled:false});g.rotateX(-Math.PI/2);return g}
function palomitas(P,x,z,rn){const THREE=T(),st=cv(256,16,g=>{for(let i=0;i<16;i++){g.fillStyle=i%2?'#fbf7ee':'#d63a3a';g.fillRect(i*16,0,16,16)}});
 const b=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.1,0],[.155,.085],[.163,.092],[.152,.092],[.092,.01],[0,.01]].map(v2),32),mat(0xffffff,.45,{map:st,side:THREE.DoubleSide}));b.position.set(x,0,z);b.castShadow=b.receiveShadow=true;P.add(b);
 const pf=[];for(let i=0;i<60;i++){const a=rn()*TAU,d=Math.sqrt(rn())*.12;pf.push([x+Math.cos(a)*d,.105-d*.25-rn()*.025,z+Math.sin(a)*d,rn()*TAU,.016+rn()*.009,['#fff6dc','#f3dc9c','#fffaf0'][i%3],rn()*3,rn()*3])}
 inst(new THREE.IcosahedronGeometry(1,0),mat(0xffffff,.8,{flatShading:true}),pf,P)}
function uno(P){const THREE=T(),rn=rnd(5),L=[],I=n=>UN.indexOf(n)+2,q=Math.PI/4,B=1;
 cd(L,-.26,.02,-.12,B,0,{t:.06});monton(L,.22,-.04,['r7','y2','g5','b9','rP','gR','bS'].map(I),rn,.1);cd(L,.24,-.02,.35,I('w4'),7*.0065);
 abanico(L,q,1.8,['b3','r4','g1','y8','wW','yP','bP'].map(I),.13);abanico(L,3*q,1.8,Array(5).fill(B),.13);abanico(L,5*q,1.8,Array(3).fill(B),.15);abanico(L,7*q,1.8,[B],0);
 cartas(P,atlas('uno',[canto('#ffffff','#dcdcdc'),dorsoUno,...UN.map(unoF)]),L);
 inst(flecha(.78,.86,.35,2.45),mat(0xffffff,.45,{emissive:0x3a2a00,emissiveIntensity:.4}),[[0,.001,0,0,1,'#ffd54a'],[0,.001,0,Math.PI,1,'#ffd54a']],P);
 vaso(P,1.55,.05,0xf08a1c,.07);const st=new THREE.Mesh(new THREE.CylinderGeometry(.005,.005,.2,8),mat(0xd63a3a,.4));st.position.set(1.57,.13,.05);st.rotation.z=-.3;st.castShadow=true;P.add(st);
 palomitas(P,-1.5,0,rn)}

// ---------- Monopoly Deal: mazo, dinero en pilas y en abanico, juegos de propiedades en cascada con casas y hotel, y un café ----------
const DM={1:'#e2d3a4',2:'#f0a7b9',3:'#b9dd9f',4:'#a6d2ee',5:'#c3a3dc',10:'#f4b062'},DV=[1,2,3,4,5,10];
const DP=[['#8a5a33','CENTRO'],['#8fcdee','SANTIAGO'],['#d6438f','SANTA ANA'],['#f08a24','ITZIMNÁ'],['#d63a3a','LA MEJORADA'],['#f2cf2e','SAN JUAN'],['#2e9e57','MONTEJO'],['#1f4fa6','GARCÍA GINERÉS']];
const esq=(g,w,h,v,bg)=>[[22,28],[w-22,h-28]].forEach(([x,y])=>{g.fillStyle=bg||'#fbf7ee';g.beginPath();g.arc(x,y,13,0,TAU);g.fill();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1.5;g.stroke();txt(g,''+v,x,y+1,14,'#2b2118')});
function dinero(v){return(g,w,h)=>{blanco(g,w,h,'#fbf7ee');g.fillStyle=DM[v];rr(g,8,8,w-16,h-16,8);g.fill();g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=2;rr(g,15,15,w-30,h-30,6);g.stroke();
 g.fillStyle='#fbf7ee';g.beginPath();g.arc(w/2,h/2,36,0,TAU);g.fill();g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=4;g.stroke();txt(g,'$'+v,w/2,h/2+2,v>9?28:34,'#2b2118');esq(g,w,h,v)}}
function propiedad([c,n],i){return(g,w,h)=>{blanco(g,w,h);g.strokeStyle='#2b2118';g.lineWidth=2;rr(g,7,7,w-14,h-14,7);g.stroke();g.fillStyle=c;g.fillRect(11,11,w-22,h*.24);
 let px=14;g.font='bold '+px+'px Georgia,serif';while(g.measureText(n).width>w-28&&px>8)g.font='bold '+(--px)+'px Georgia,serif';txt(g,n,w/2,11+h*.12,px,i==1||i==5?'#2b2118':'#fff');
 [1,2,3].forEach((k,j)=>{const y=h*.44+j*30;g.strokeStyle='#2b2118';g.lineWidth=1.5;g.strokeRect(18,y-10,13,19);txt(g,''+k,24.5,y,11,'#2b2118');g.fillStyle='#b9ae98';for(let x=38;x<w-48;x+=6)g.fillRect(x,y+5,3,2);txt(g,'$'+(k*2-1+i%3),w-30,y,16,'#2b2118')})}}
function comodin(a,b){return(g,w,h)=>{blanco(g,w,h);g.fillStyle=a;g.fillRect(11,11,w-22,h*.3);g.fillStyle=b;g.fillRect(11,h-11-h*.3,w-22,h*.3);txt(g,'COMODÍN',w/2,h/2,15,'#2b2118')}}
function renta(a,b){return(g,w,h)=>{blanco(g,w,h,'#fbf7ee');g.fillStyle='#efe6cf';rr(g,8,8,w-16,h-16,8);g.fill();[[a,Math.PI,0],[b,0,Math.PI]].forEach(([c,s,e])=>{g.fillStyle=c;g.beginPath();g.arc(w/2,h/2-6,40,s,e);g.fill()});
 g.strokeStyle='#fbf7ee';g.lineWidth=5;g.beginPath();g.arc(w/2,h/2-6,40,0,TAU);g.stroke();txt(g,'RENTA',w/2,h*.8,17,'#2b2118');esq(g,w,h,1)}}
function salida(g,w,h){blanco(g,w,h,'#fbf7ee');g.fillStyle='#e7efdc';rr(g,8,8,w-16,h-16,8);g.fill();txt(g,'ACCIÓN',w/2,h*.14,13,'#2b2118');g.fillStyle='#d63a3a';g.beginPath();g.arc(w/2,h/2,42,0,TAU);g.fill();
 g.strokeStyle='#fbf7ee';g.lineWidth=4;g.stroke();txt(g,'PASA POR',w/2,h/2-8,12,'#fff');txt(g,'LA SALIDA',w/2,h/2+9,12,'#fff');esq(g,w,h,1)}
function dorsoDeal(g,w,h){blanco(g,w,h,'#fbf7ee');g.fillStyle='#c8242b';rr(g,8,8,w-16,h-16,8);g.fill();g.save();g.clip();g.fillStyle='rgba(0,0,0,.09)';
 for(let y=-w;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y+w);g.lineTo(w,y+w+7);g.lineTo(0,y+7);g.fill()}g.restore();g.fillStyle='#fbf7ee';g.beginPath();g.ellipse(w/2,h/2,38,50,0,0,TAU);g.fill();txt(g,'$',w/2,h/2+3,62,'#c8242b')}
function taza(P,x,z,ry){const THREE=T(),G=new THREE.Group(),pm=mat(0xf7f3ea,.3,{side:THREE.DoubleSide});G.position.set(x,0,z);G.rotation.y=ry;P.add(G);
 const cup=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.075,0],[.1,.012],[.103,.016],[.096,.016],[.07,.009],[.036,.009],[.035,.015],[.045,.045],[.053,.078],[.056,.08],[.05,.08],[.043,.05],[.033,.02],[0,.018]].map(v2),28),pm);
 const cafe=new THREE.Mesh(new THREE.CircleGeometry(.046,24),mat(0x3b2414,.12));cafe.rotation.x=-Math.PI/2;cafe.position.y=.07;
 const asa=new THREE.Mesh(new THREE.TorusGeometry(.02,.0055,6,14,Math.PI),pm);asa.rotation.z=-Math.PI/2;asa.position.set(.05,.05,0);
 [cup,cafe,asa].forEach(m=>{m.castShadow=m.receiveShadow=true;G.add(m)})}
function monopolydeal(P){const k=kit(),rn=rnd(3),L=[],hs=[],q=Math.PI/4,B=1,M=v=>2+DV.indexOf(v),PR=i=>8+i,WI=16,RE=17,GO=18;
 cd(L,-.24,-.02,.1,B,0,{t:.05});monton(L,.22,-.05,[M(5),GO,RE],rn,.08);
 const set=(a,off,cells,casas)=>{fila(L,a,.82,off,cells,.085,0);const d=.84+(cells.length-1)*.085,y=(cells.length-1)*.0065+CT;casas.forEach(([dq,sc,c])=>{const[x,z]=pos(a,d,off+dq);hs.push([x,y,z,Math.PI/2-a,sc,c])})};
 set(q,-.36,[PR(6),PR(6),PR(6)],[[-.065,1.7,'#2e9e57'],[.06,[2.5,1.9,1.6],'#d63a3a']]);set(q,0,[PR(7),PR(7)],[]);set(q,.36,[PR(1),PR(1),PR(1)],[[0,1.7,'#2e9e57']]);
 set(3*q,-.36,[PR(4),PR(4)],[]);set(3*q,0,[PR(3),PR(3),PR(3)],[[0,1.7,'#2e9e57']]);set(3*q,.36,[PR(5),WI],[]);
 monton(L,...pos(q,1.6,-.3),[M(1),M(2),M(1),M(5)],rn,.03,Math.PI/2-q,.3);monton(L,...pos(q,1.6,.12),[M(10),M(3)],rn,.03,Math.PI/2-q,.3);
 abanico(L,3*q,1.8,[M(1),M(2),M(3),M(5),M(10)],.17);abanico(L,5*q,1.8,Array(6).fill(B),.12);monton(L,...pos(5*q,.95,0),[M(2),M(4),M(1)],rn,.04,Math.PI/2-5*q,.4);
 abanico(L,7*q,1.8,[M(3),PR(2),RE,GO,M(4)],.15);
 cartas(P,atlas('monopolydeal',[canto('#f3eee2','#d2c8b2'),dorsoDeal,...DV.map(dinero),...DP.map(propiedad),comodin(DP[1][0],DP[0][0]),renta(DP[4][0],DP[5][0]),salida]),L);
 inst(k.house,k.pl,hs,P);taza(P,-1.5,-.05,.6)}

window.MINI={pon(G,g,y,hit){const f={merida,haciendas:yucatan,continental,uno,monopolydeal}[g];if(!f||!T())return false;const P=new (T().Group)();P.position.y=y;P.rotation.y={merida:.18,haciendas:-.12}[g]||0;f(P);
 P.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&hit)o.userData.hit=hit});G.add(P);return true}};
})();
