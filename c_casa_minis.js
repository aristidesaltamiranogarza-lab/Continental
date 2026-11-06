// Maquetas sobre las mesas de la casa (en vez de las cartitas): Mérida en Venta (tablero) y YuCATÁN (isla de hexágonos).
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

window.MINI={pon(G,g,y,hit){const f={merida,haciendas:yucatan}[g];if(!f||!T())return false;const P=new (T().Group)();P.position.y=y;P.rotation.y=g=='merida'?.18:-.12;f(P);
 P.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&hit)o.userData.hit=hit});G.add(P);return true}};
})();
