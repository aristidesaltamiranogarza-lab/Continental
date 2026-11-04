// Avatares "Caricatura" de la casa (reemplazan a los Miis viejos): cabeza con la cara pintada de frente (ojos con iris y párpados, cejas, nariz,
// boca, chapitas, pecas, bigote, lágrima), pelo por estilo (tazón, largo, raya en medio, corto, gorra, chongo, cola de caballo), torso con playera,
// cuellos/capucha/puños, lentes, sombreado toon de 3 tonos y contorno (casco invertido). Brazos y piernas de UNA pieza: un tubo con codo/rodilla
// que se rehace cada cuadro cuando el juego llama C3D.seg con los apoderados up/fo (up/lo en piernas). Parpadean solos; MII.setFace cambia el gesto.
// Se arma en el marco de los Miis viejos (vista previa ×1/.85) para que sillas, mesas y manos sigan donde estaban. Lo usa mkAvatar (c_continental3d.js).
(function(){
if(typeof THREE==='undefined')return;
const PI=Math.PI,clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t,v3=(x,y,z)=>new THREE.Vector3(x,y,z);
const sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const hexRGB=h=>{h=h.replace('#','');return [0,2,4].map(k=>parseInt(h.slice(k,k+2),16))};
const mix=(a,b,t)=>{const A=hexRGB(a),B=hexRGB(b);return '#'+A.map((v,k)=>Math.round(v+(B[k]-v)*t).toString(16).padStart(2,'0')).join('')};
const rgba=(h,a)=>{const c=hexRGB(h);return `rgba(${c[0]},${c[1]},${c[2]},${a})`};
const css=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)?c:'#'+new THREE.Color(c).getHexString();
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
const KS=1/.85,Y0=1.336;   // vista previa → marco viejo: y_viejo=(y-Y0)*KS

// ---------- los 6 personajes (mismo orden que AVP; la ropa toma el color de la ficha) ----------
const CH=[
 {skin:'#f4d0ae',hair:'bowl',hc:'#3d2516',eyes:'round',iris:'#6b4423',brow:'soft',nose:'button',mouth:'smile',blush:1,pants:'#33405f',shoe:'#2b2b31',top:'tee',suit:'♠︎'},
 {skin:'#e2aa7e',hair:'long',hc:'#1e1511',eyes:'lash',iris:'#4a2c18',brow:'arch',nose:'curve',mouth:'smile',blush:1,pants:'#2c2c36',shoe:'#b23b5c',top:'sweater'},
 {skin:'#f8dcc5',hair:'curtain',hc:'#e4b04b',eyes:'round',iris:'#3f80c4',brow:'bold',nose:'curve',mouth:'grin',freckles:1,pants:'#3b5a8c',shoe:'#d23232',top:'hoodie'},
 {skin:'#8d5b3d',hair:'short',hc:'#141010',eyes:'round',iris:'#2e1c12',brow:'flat',nose:'wide',mouth:'smile',glasses:1,pants:'#b9a078',shoe:'#f2f2f2',top:'polo'},
 {skin:'#d39a6a',hair:'cap',hc:'#3a2414',cap:'#c62828',eyes:'happy',iris:'#3a2414',brow:'arch',nose:'button',mouth:'open',must:1,pants:'#30343a',shoe:'#2a4a8a',top:'tee',suit:'skull'},
 {skin:'#ffe1c9',hair:'pony',hc:'#7b4a22',eyes:'lash',iris:'#4f7d3b',brow:'arch',nose:'button',mouth:'small',blush:1,pants:'#3b5a8c',shoe:'#f06292',top:'sweater'}];
// entradas extra de AVP (los abuelos del Rummy) vienen con el vocabulario viejo
function conv(A){const E={oval:'round',dot:'round'},B={angry:'bold'},N={dot:'button'},H={spiky:'short'};
 return {skin:A.skin||'#f0c8a8',hair:H[A.hair]||A.hair||'short',hc:A.hc||'#3a2414',cap:A.cap,eyes:E[A.eyes]||A.eyes||'round',iris:A.iris||'#4a3020',brow:B[A.brow]||A.brow||'flat',
  nose:N[A.nose]||A.nose||'button',mouth:A.mouth||'smile',blush:A.blush,freckles:A.freckles,must:A.must,glasses:A.glasses,pants:css(A.bot!=null?A.bot:0x33405f),shoe:css(A.shoe!=null?A.shoe:0x2b2b31),top:A.top||'sweater',suit:A.suit}}

// ---------- materiales ----------
const GRAD=new THREE.DataTexture(new Uint8Array([105,185,255]),3,1,THREE.RedFormat);GRAD.minFilter=GRAD.magFilter=THREE.NearestFilter;GRAD.generateMipmaps=false;GRAD.needsUpdate=true;
const OUT=new THREE.MeshBasicMaterial({color:0x241a30,side:THREE.BackSide});
OUT.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <project_vertex>','vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);mvPosition.xyz+=normalize(normalMatrix*normal)*0.015;gl_Position=projectionMatrix*mvPosition;')};
const T=(c,map)=>new THREE.MeshToonMaterial({color:map?0xffffff:new THREE.Color(c),map:map||null,gradientMap:GRAD});
function canvasTex(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function smoothSeams(geo){const p=geo.attributes.position,n=geo.attributes.normal,map=new Map();
 for(let i=0;i<p.count;i++){const k=p.getX(i).toFixed(4)+','+p.getY(i).toFixed(4)+','+p.getZ(i).toFixed(4);let e=map.get(k);if(!e){e=[0,0,0,[]];map.set(k,e)}e[0]+=n.getX(i);e[1]+=n.getY(i);e[2]+=n.getZ(i);e[3].push(i)}
 map.forEach(e=>{if(e[3].length<2)return;const l=Math.hypot(e[0],e[1],e[2])||1;e[3].forEach(i=>n.setXYZ(i,e[0]/l,e[1]/l,e[2]/l))});n.needsUpdate=true}

// ---------- geometrías compartidas (unidades de la vista previa) ----------
const FS=512,FW=1.1,PX=FS/FW,fx=x=>FS/2+x*PX,fy=y=>FS/2-y*PX;
// cabeza: mejillas llenas abajo, cara un poco más plana al frente
function headDef(x,y,z){const ch=Math.exp(-((y+.16)**2)/.03);x*=1+.07*ch;z*=(1+.03*ch)*(1-.05*sm(-.05,.25,z));y*=1.03;return [x,y,z]}
const SPH=new THREE.SphereGeometry(1,32,22),HANDG=new THREE.SphereGeometry(1,20,14).scale(.1,.115,.094);
// la cara se pinta con proyección de frente: HEADF = mitad de enfrente (textura), HEADB = nuca (piel lisa)
const [HEADF,HEADB]=(()=>{const geo=new THREE.SphereGeometry(.5,72,54),p=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<p.count;i++){const [x,y,z]=headDef(p.getX(i),p.getY(i),p.getZ(i));p.setXYZ(i,x,y,z);uv.setXY(i,.5+x/FW,.5+y/FW)}
 geo.computeVertexNormals();smoothSeams(geo);
 const ix=geo.index.array,f=[],b=[];for(let t=0;t<ix.length;t+=3){const zc=(p.getZ(ix[t])+p.getZ(ix[t+1])+p.getZ(ix[t+2]))/3;(zc>-.03?f:b).push(ix[t],ix[t+1],ix[t+2])}
 const F=geo.clone(),B=geo.clone();F.setIndex(f);B.setIndex(b);geo.dispose();return [F,B]})();
const TPTS=new THREE.SplineCurve([[.001,.78],[.27,.79],[.30,.84],[.292,.95],[.30,1.07],[.322,1.19],[.318,1.29],[.275,1.37],[.19,1.43],[.10,1.465],[.001,1.475]].map(q=>new THREE.Vector2(q[0],q[1]))).getPoints(60);
const TORSO=new THREE.LatheGeometry(TPTS,56,PI,2*PI);
// radio del torso a cierta altura (para pegar cosas a la tela, como los cordones de la sudadera)
function torR(y){for(let i=1;i<TPTS.length-1;i++){const a=TPTS[i],b=TPTS[i+1];if(a.y!==b.y&&(y-a.y)*(y-b.y)<=0)return lerp(a.x,b.x,(y-a.y)/(b.y-a.y))}return .3}
const BUN=(()=>{const g=new THREE.SphereGeometry(.17,40,28),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.05*Math.sin(Math.atan2(z,x)*7+y*40);p.setXYZ(i,x*k,y,z*k)}g.computeVertexNormals();smoothSeams(g);return g})();

// pelo: casquete que sigue la línea de nacimiento (fleco, patillas, nuca) y se mete en la piel en la orilla
const HS={
 bowl:{R:.553,vol:.05,rid:.012,Tf:.415*PI,Ts:.57*PI,Tb:.7*PI,tuck:.8,lip:1.025,fr:p=>.035*Math.abs(Math.sin(p*13))*(1-sm(.25*PI,.4*PI,Math.abs(p)))},
 short:{R:.536,vol:.03,rid:.007,Tf:.335*PI,Ts:.52*PI,Tb:.64*PI,tuck:1,fr:p=>.13*Math.exp(-(((Math.abs(p)-.43*PI)/.12)**2))},
 long:{R:.552,vol:.04,rid:.013,Tf:.31*PI,Ts:PI/2+1.3,Tb:PI/2+1.45,a0:.31*PI,a1:.44*PI,tuck:1,hang:1,flare:.05,fr:p=>.24*sm(0,.24*PI,Math.abs(p))},
 bun:{R:.533,vol:0,rid:.011,Tf:.32*PI,Ts:.55*PI,Tb:.71*PI,tuck:1},
 curtain:{R:.55,vol:.05,rid:0,swp:.016,lift:.03,part:.035,Tf:.3*PI,Ts:.56*PI,Tb:.7*PI,a0:.26*PI,a1:.42*PI,tuck:.75,lip:1.03,
  fr:p=>{const a=Math.abs(p);return .12*PI*Math.exp(-(((a-.2*PI)/(.08*PI))**2))-.1*PI*Math.exp(-(((a-.5*PI)/(.07*PI))**2))}},
 cap:{R:.535,vol:0,rid:.005,Tf:.37*PI,Ts:.55*PI,Tb:.69*PI,tuck:1}};
HS.pony=HS.bun;
function hairGeo(H){const NC=128,NR=46,pos=[0,H.R*(1+H.vol),0],ind=[],d=new THREE.Vector3();
 const Tof=p=>{const a=Math.abs(p);return H.Tf+(H.Ts-H.Tf)*sm(H.a0||.2*PI,H.a1||.42*PI,a)+(H.Tb-H.Ts)*sm(.6*PI,.88*PI,a)+(H.fr?H.fr(p):0)};
 for(let i=1;i<=NR;i++)for(let j=0;j<NC;j++){const p=-PI+2*PI*j/NC,T=Tof(p),t=T*i/NR;
  let r=H.R*(1+H.vol*Math.max(0,Math.cos(t))**2)*(1+H.rid*Math.sin(p*26+t*3)),x,y,z;
  if(H.swp)r*=1+H.swp*Math.sin(18*Math.abs(p)-9*t);
  if(H.lift)r*=1+H.lift*Math.max(0,Math.cos(p))*Math.exp(-(((t-.5)/.28)**2));
  if(H.part)r*=1-H.part*Math.exp(-(((Math.sin(t)*p)/.02)**2))*sm(.12,.3,t);
  if(H.hang&&t>PI/2&&T>1.75){const hd=t-PI/2,q=r*(1+H.flare*hd)*(1-.08*sm(T-.35,T,t));x=q*Math.sin(p);z=q*Math.cos(p);y=-hd*H.R}
  else{d.set(Math.sin(t)*Math.sin(p),Math.cos(t),Math.sin(t)*Math.cos(p));
   const hp=headDef(.5*d.x,.5*d.y,.5*d.z),rh=Math.hypot(hp[0],hp[1],hp[2]);
   const tk=H.tuck*sm(T-.22,T,t)*(H.hang?1-sm(1.45,1.75,T):1);
   r=lerp(r,rh*(H.lip||.985),tk);x=r*d.x;y=r*d.y;z=r*d.z}
  pos.push(x,y,z)}
 const V=(i,j)=>1+(i-1)*NC+((j%NC)+NC)%NC;
 for(let j=0;j<NC;j++)ind.push(0,V(1,j),V(1,j+1));
 for(let i=1;i<NR;i++)for(let j=0;j<NC;j++){const a=V(i,j),b=V(i+1,j),c=V(i,j+1),e=V(i+1,j+1);ind.push(a,b,c,b,e,c)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();return g}
const HAIRC={},hairOf=k=>HAIRC[k]||(HAIRC[k]=hairGeo(HS[k]||HS.short));

// ---------- tubos de una pieza (brazos, piernas, cola de caballo, cordones) ----------
const _c=v3(),_t=v3(),_n=v3(),_b=v3(),UPV=v3(0,1,0),XV=v3(1,0,0),ZV=v3(0,0,1);
function tubeGeo(TS,RS){const n=(TS+1)*RS+2,g=new THREE.BufferGeometry(),idx=[];
 for(let i=0;i<TS;i++)for(let j=0;j<RS;j++){const a=i*RS+j,b=i*RS+(j+1)%RS,c=a+RS,d=b+RS;idx.push(a,b,c,b,d,c)}
 const s0=(TS+1)*RS,s1=s0+1;for(let j=0;j<RS;j++){const k=(j+1)%RS;idx.push(s0,k,j,s1,TS*RS+j,TS*RS+k)}
 g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);g.userData.TS=TS;g.userData.RS=RS;return g}
// llena el tubo a lo largo de la curva entre u0 y u1; rf(u,ángulo) = radio. Marco por transporte paralelo (sin saltos entre anillos)
function fillTube(g,curve,u0,u1,rf){const TS=g.userData.TS,RS=g.userData.RS,p=g.attributes.position,A=p.array;
 for(let i=0;i<=TS;i++){const u=u0+(u1-u0)*i/TS;curve.getPointAt(u,_c);curve.getTangentAt(u,_t);
  if(i==0)_n.copy(Math.abs(_t.y)<.9?UPV:XV);
  _n.addScaledVector(_t,-_n.dot(_t));if(_n.lengthSq()<1e-8)_n.copy(Math.abs(_t.x)<.9?XV:ZV).addScaledVector(_t,-_n.dot(_t));_n.normalize();_b.crossVectors(_t,_n);
  for(let j=0;j<RS;j++){const a=j/RS*PI*2,r=rf(u,a),ca=Math.cos(a)*r,sa=Math.sin(a)*r,o=(i*RS+j)*3;A[o]=_c.x+_n.x*ca+_b.x*sa;A[o+1]=_c.y+_n.y*ca+_b.y*sa;A[o+2]=_c.z+_n.z*ca+_b.z*sa}
  if(i==0||i==TS){const k=rf(u,0)*(i?.5:-.5),o=((TS+1)*RS+(i?1:0))*3;A[o]=_c.x+_t.x*k;A[o+1]=_c.y+_t.y*k;A[o+2]=_c.z+_t.z*k}}
 p.needsUpdate=true;g.computeVertexNormals()}
// brazo/pierna: curva por hombro-codo-muñeca (cadera-rodilla-tobillo); parts = tubos sobre la misma curva (piel, manga...)
function mkLimb(par,parts,onSet){const curve=new THREE.CatmullRomCurve3([v3(0,0,0),v3(0,-.1,0),v3(0,-.2,0)],false,'centripetal');curve.arcLengthDivisions=48;
 const L={curve,ue:.5,ms:parts.map(q=>{const m=new THREE.Mesh(tubeGeo(q.ts||20,q.rs||12),q.mat);m.frustumCulled=false;m.castShadow=true;par.add(m);return m}),
  set(a,b,c){const P=curve.points;P[0].copy(a);P[1].copy(b);P[2].copy(c);const l1=a.distanceTo(b),l2=b.distanceTo(c);L.ue=clamp(l1/((l1+l2)||1),.1,.9);curve.updateArcLengths();
   parts.forEach((q,i)=>fillTube(L.ms[i].geometry,curve,q.u0||0,q.u1==null?1:q.u1,u=>q.r(u,L.ue)));if(onSet)onSet(L)}};
 return L}
// radios: hombro, brazo, codo, antebrazo, muñeca, final (ue = dónde cae el codo/rodilla)
const radF=R=>(u,ue)=>{const P=[0,ue*.44,ue,ue+(1-ue)*.36,ue+(1-ue)*.8,1];for(let k=1;k<6;k++)if(u<=P[k])return lerp(R[k-1],R[k],sm(P[k-1],P[k],u));return R[5]};
const armR=radF([.082,.079,.066,.069,.053,.052].map(x=>x*KS)),legR=radF([.118,.108,.093,.094,.07,.068].map(x=>x*KS));
// apoderado que recibe C3D.seg(m,a,b) en lugar de una cápsula
const proxy=(mat,fn)=>{const o=new THREE.Object3D();o.material=mat;o.userData.limb=fn;return o};

// ---------- cara pintada ----------
const INK='#21161f';
function eye(g,cx,cy,s,A,ex,blink){
 const rx=27,ry=ex==='sorpresa'?44:38,shut=ex==='feliz'||(A.eyes==='happy'&&ex==='normal');
 if(blink||shut){g.strokeStyle=INK;g.lineWidth=9;g.beginPath();let oy;
  if(shut){g.moveTo(cx-rx,cy+10);g.quadraticCurveTo(cx,cy-30,cx+rx,cy+10);oy=cy+10}else{g.moveTo(cx-rx,cy+2);g.quadraticCurveTo(cx,cy+16,cx+rx,cy+2);oy=cy+2}
  g.stroke();if(A.eyes==='lash'){g.lineWidth=6;g.beginPath();g.moveTo(cx+s*(rx-3),oy-2);g.lineTo(cx+s*(rx+11),oy-11);g.stroke()}return}
 g.save();g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,PI*2);g.fillStyle='#fffdfb';g.fill();g.clip();
 const gr=g.createLinearGradient(0,cy-ry,0,cy+ry*.3);gr.addColorStop(0,'rgba(80,55,95,.32)');gr.addColorStop(1,'rgba(80,55,95,0)');g.fillStyle=gr;g.fillRect(cx-rx,cy-ry,rx*2,ry*1.3);
 const ir=ex==='sorpresa'?17:23,iy=cy+5,ig=g.createRadialGradient(cx,iy+ir*.3,1,cx,iy,ir);
 ig.addColorStop(0,mix(A.iris,'#ffffff',.45));ig.addColorStop(.6,A.iris);ig.addColorStop(1,mix(A.iris,'#000000',.55));
 g.fillStyle=ig;g.beginPath();g.arc(cx,iy,ir,0,PI*2);g.fill();
 g.fillStyle=INK;g.beginPath();g.arc(cx,iy,ir*.5,0,PI*2);g.fill();
 g.fillStyle='#fff';g.beginPath();g.ellipse(cx-ir*.36,iy-ir*.4,ir*.3,ir*.36,-.5,0,PI*2);g.fill();g.beginPath();g.arc(cx+ir*.4,iy+ir*.38,ir*.14,0,PI*2);g.fill();
 // párpado de arriba: [lado de afuera, lado de adentro]
 const L={enojado:[.12,.48],triste:[.44,.1],sorpresa:[0,0]}[ex]||[.13,.13];
 const ox=cx+s*(rx+6),inx=cx-s*(rx+6),yo=cy-ry+L[0]*2*ry,yi=cy-ry+L[1]*2*ry,ym=(yo+yi)/2-7;
 g.fillStyle=A.skin;g.beginPath();g.moveTo(ox,cy-ry-6);g.lineTo(ox,yo);g.quadraticCurveTo(cx,ym,inx,yi);g.lineTo(inx,cy-ry-6);g.closePath();g.fill();
 g.strokeStyle=INK;g.lineWidth=9;g.beginPath();g.moveTo(ox,yo);g.quadraticCurveTo(cx,ym,inx,yi);g.stroke();
 g.restore();
 g.strokeStyle='rgba(50,30,45,.3)';g.lineWidth=2.5;g.beginPath();g.ellipse(cx,cy,rx,ry,0,PI*.12,PI*.88);g.stroke();
 if(A.eyes==='lash'){g.strokeStyle=INK;g.lineWidth=6;g.beginPath();g.moveTo(cx+s*16,yo+1);g.lineTo(cx+s*(rx+10),yo-10);g.moveTo(cx+s*6,yo-2);g.lineTo(cx+s*14,yo-14);g.stroke()}}
function brow(g,cx,cy,s,A,ex){
 const by=cy-60,th={bold:16,arch:10,soft:12,flat:12}[A.brow]||12;let arch={arch:13,soft:8,flat:2,bold:5}[A.brow],o=0,i=0;if(arch==null)arch=6;
 if(ex==='enojado'){i=24;o=-6;arch=0}else if(ex==='triste'){i=-16;o=10;arch=3}else if(ex==='sorpresa'){i=-16;o=-12;arch+=5}else if(ex==='feliz'){i=-5;o=-3}
 g.strokeStyle=mix(A.hc,'#000000',.1);g.lineWidth=th;g.lineCap='round';g.beginPath();g.moveTo(cx+s*32,by+o+5);g.quadraticCurveTo(cx+s*4,by-arch+(o+i)/2,cx-s*28,by+i);g.stroke()}
function nose(g,A,sd){const ny=fy(-.1),cx=256;
 if(A.nose==='button'){const r=g.createRadialGradient(cx,ny+5,2,cx,ny+2,22);r.addColorStop(0,rgba(sd,.5));r.addColorStop(1,rgba(sd,0));g.fillStyle=r;g.fillRect(cx-26,ny-24,52,52);
  g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(cx-5,ny-6,6,4,0,0,PI*2);g.fill();return}
 g.strokeStyle=rgba(sd,.85);g.lineWidth=6;g.beginPath();
 if(A.nose==='curve'){g.moveTo(cx+6,ny-24);g.quadraticCurveTo(cx-12,ny+6,cx+8,ny+8)}else{g.moveTo(cx-20,ny);g.quadraticCurveTo(cx,ny+14,cx+20,ny)}
 g.stroke();if(A.nose==='wide'){g.fillStyle=rgba(sd,.6);[-1,1].forEach(s=>{g.beginPath();g.ellipse(cx+s*10,ny+2,4,3,0,0,PI*2);g.fill()})}}
function mouth(g,A,ex){
 const my=fy(-.205),lip='#8e3039',dk='#5a1520',tg='#e27580',cx=256,m=ex==='normal'?A.mouth:ex;
 g.lineCap='round';g.lineJoin='round';
 if(m==='smile'){g.strokeStyle=lip;g.lineWidth=8;g.beginPath();g.moveTo(cx-30,my-6);g.quadraticCurveTo(cx,my+18,cx+30,my-6);g.stroke();return}
 if(m==='small'){g.strokeStyle=lip;g.lineWidth=7;g.beginPath();g.moveTo(cx-16,my-2);g.quadraticCurveTo(cx,my+10,cx+16,my-2);g.stroke();return}
 if(m==='triste'){g.strokeStyle=lip;g.lineWidth=8;g.beginPath();g.moveTo(cx-24,my+12);g.quadraticCurveTo(cx,my-10,cx+24,my+12);g.stroke();return}
 if(m==='sorpresa'){g.fillStyle=dk;g.beginPath();g.ellipse(cx,my+8,17,23,0,0,PI*2);g.fill();g.fillStyle=tg;g.beginPath();g.ellipse(cx,my+21,10,7,0,0,PI*2);g.fill();return}
 if(m==='enojado'){const w=32,h=22,x=cx-w,y=my-8;g.fillStyle='#fff';rr(g,x,y,w*2,h,9);g.fill();g.strokeStyle=dk;g.lineWidth=4;g.stroke();
  g.lineWidth=2.5;g.beginPath();g.moveTo(x+5,y+h/2);g.lineTo(x+w*2-5,y+h/2);for(let k=-2;k<=2;k++){g.moveTo(cx+k*12,y+3);g.lineTo(cx+k*12,y+h-3)}g.stroke();return}
 const w=m==='feliz'?40:32,d=m==='feliz'?44:32;
 g.save();g.beginPath();g.moveTo(cx-w,my-8);g.quadraticCurveTo(cx,my-1,cx+w,my-8);g.quadraticCurveTo(cx+w*.85,my+d,cx,my+d);g.quadraticCurveTo(cx-w*.85,my+d,cx-w,my-8);g.closePath();
 g.fillStyle=dk;g.fill();g.clip();g.fillStyle='#fff';g.fillRect(cx-w,my-16,w*2,m==='grin'?22:14);
 if(m!=='grin'){g.fillStyle=tg;g.beginPath();g.ellipse(cx,my+d,w*.62,d*.5,0,0,PI*2);g.fill()}g.restore()}
function drawFace(g,A,ex,blink){
 g.fillStyle=A.skin;g.fillRect(0,0,FS,FS);g.lineCap='round';g.lineJoin='round';
 const sd=mix(A.skin,'#4a1f12',.38),bl=A.blush?(ex==='feliz'?.5:.3):(ex==='feliz'?.2:0);
 if(bl)[-1,1].forEach(s=>{const x=fx(s*.255),y=fy(-.12),r=g.createRadialGradient(x,y,2,x,y,42);r.addColorStop(0,`rgba(255,105,120,${bl})`);r.addColorStop(1,'rgba(255,105,120,0)');g.fillStyle=r;g.fillRect(x-48,y-48,96,96)});
 if(A.freckles){g.fillStyle=rgba(sd,.5);[[-.27,-.07],[-.24,-.1],[-.3,-.1],[-.25,-.05],[.27,-.07],[.24,-.1],[.3,-.1],[.25,-.05]].forEach(([x,y])=>{g.beginPath();g.arc(fx(x),fy(y),4,0,PI*2);g.fill()})}
 const ey=fy(-.012);[-1,1].forEach(s=>{eye(g,fx(s*.165),ey,s,A,ex,blink);brow(g,fx(s*.165),ey,s,A,ex)});
 nose(g,A,sd);mouth(g,A,ex);
 if(A.must){const my=fy(-.205);g.fillStyle=mix(A.hc,'#000000',.05);[-1,1].forEach(s=>{g.beginPath();g.moveTo(256,my-24);g.bezierCurveTo(256+s*22,my-40,256+s*54,my-30,256+s*60,my-6);g.bezierCurveTo(256+s*42,my-16,256+s*20,my-12,256,my-15);g.closePath();g.fill()})}
 if(ex==='triste'){const tx=fx(.165)+22,ty=ey+50;g.fillStyle='rgba(110,185,255,.92)';g.beginPath();g.moveTo(tx,ty-16);g.quadraticCurveTo(tx+12,ty+2,tx,ty+9);g.quadraticCurveTo(tx-12,ty+2,tx,ty-16);g.fill();
  g.fillStyle='rgba(255,255,255,.8)';g.beginPath();g.arc(tx-3,ty,2.5,0,PI*2);g.fill()}}
const EXS=['normal','feliz','enojado','sorpresa','triste'];
function faceRec(A){const c=document.createElement('canvas');c.width=c.height=FS;const g=c.getContext('2d'),tex=canvasTex(c);
 const r={A,g,tex,ex:'normal',bl:0,nb:performance.now()/1000+1+Math.random()*3,be:0,seed:Math.random()*10,draw(){drawFace(g,A,r.ex,r.bl);tex.needsUpdate=true}};r.draw();return r}

// ---------- playera: textura alrededor del torso (u = vuelta con el frente en medio, v = de la cintura a los hombros) ----------
function skull(g,cx,cy,s,fg,bg){g.fillStyle=fg;g.beginPath();g.ellipse(cx,cy-8*s,30*s,27*s,0,0,PI*2);g.fill();rr(g,cx-17*s,cy+6*s,34*s,22*s,7*s);g.fill();
 g.fillStyle=bg;[-1,1].forEach(k=>{g.beginPath();g.ellipse(cx+k*12*s,cy-6*s,9*s,10*s,0,0,PI*2);g.fill()});
 g.beginPath();g.moveTo(cx,cy+4*s);g.lineTo(cx-5*s,cy+13*s);g.lineTo(cx+5*s,cy+13*s);g.closePath();g.fill();
 g.strokeStyle=bg;g.lineWidth=3*s;g.lineCap='round';g.beginPath();[-8,0,8].forEach(x=>{g.moveTo(cx+x*s,cy+19*s);g.lineTo(cx+x*s,cy+26*s)});g.stroke()}
const SHIRTC={};
function shirtTex(A,col){const key=A.top+'|'+(A.suit||'')+'|'+col;if(SHIRTC[key])return SHIRTC[key];
 const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle=col;g.fillRect(0,0,512,256);
 const lt=mix(col,'#ffffff',.78),dk=mix(col,'#000000',.22);
 if(A.top==='sweater'){g.fillStyle=lt;[[.47,.51],[.56,.6]].forEach(([a,b])=>g.fillRect(0,256*(1-b),512,256*(b-a)));g.fillStyle=dk;g.fillRect(0,256*(1-.2),512,256*.12)}
 if(A.top==='tee'&&A.suit){g.save();g.translate(256,256*(1-.55));g.scale(1,.82);
  if(A.suit==='skull')skull(g,0,0,1.5,lt,col);
  else{g.fillStyle=lt;g.font='bold 96px "Segoe UI Symbol","Apple Symbols","Noto Sans Symbols 2","DejaVu Sans",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(A.suit,0,0)}g.restore()}
 if(A.top==='polo'){g.fillStyle=dk;g.fillRect(250,51,12,41)}
 if(A.top==='hoodie'){g.fillStyle=dk;rr(g,190,148,132,41,14);g.fill()}
 return SHIRTC[key]=canvasTex(c)}

// ---------- contorno: cada pieza se dibuja otra vez por dentro, un poco inflada, en tinta (no echa sombra) ----------
const noShadow={get:()=>false,set(){}};
function outline(root){const L=[];root.traverse(o=>{if(o.isMesh&&!o.userData.noOut)L.push(o)});
 L.forEach(o=>{const h=new THREE.Mesh(o.geometry,OUT);h.raycast=()=>{};h.frustumCulled=o.frustumCulled;h.userData.noOut=1;Object.defineProperty(h,'castShadow',noShadow);Object.defineProperty(h,'receiveShadow',noShadow);o.add(h)})}

// ---------- el avatar (marco viejo: cadera ~-.5, pies -1.57, hombros y=0, cabeza .74) ----------
function mk(k,pi,o,col,src){o=o||{};const A=pi<CH.length?CH[pi]:conv(src||{}),C=css(col);
 const mSkin=T(A.skin),mShirt=T(0,shirtTex(A,C)),mPlain=T(C),mTrim=T(mix(C,'#000000',.22)),mLight=T(mix(C,'#ffffff',.82)),mPants=T(A.pants),mShoe=T(A.shoe),mSole=T('#f3efe6'),mHair=T(A.hc);
 mHair.side=THREE.DoubleSide;
 const g=new THREE.Group(),hit={t:'seat',k},M=(geo,mat,x,y,z,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;par.add(m);return m};
 const capM=(r,len,mat,par)=>{const m=M(new THREE.CapsuleGeometry(r,len,6,12),mat,0,0,0,par);m.userData.len=len+2*r;return m};
 const segS=(m,a,b)=>{_c.subVectors(b,a);const l=_c.length();m.position.copy(a).addScaledVector(_c,.5);m.quaternion.setFromUnitVectors(UPV,_c.normalize());m.scale.y=l/m.userData.len};
 const shoe=(x,y,z)=>{const G=new THREE.Group();G.position.set(x,y,z);g.add(G);M(SPH,mShoe,0,0,0,G).scale.set(.159,.1,.235);M(SPH,mSole,0,-.064,.006,G).scale.set(.168,.047,.249);return G};
 let legs=null;
 if(!o.stand){
  // silla de madera (los abuelos del Rummy la esconden: buscan Box/Cylinder hijos directos)
  const wood=new THREE.MeshStandardMaterial({color:0x3a1e0c,roughness:.6}),W=(geo,x,y,z)=>{M(geo,wood,x,y,z,g).userData.noOut=1};
  W(new THREE.BoxGeometry(1.1,.12,1),0,-.66,-.05);W(new THREE.BoxGeometry(1.1,1.35,.12),0,.05,-.55);
  [[-.48,-.5],[.48,-.5],[-.48,.38],[.48,.38]].forEach(([x,z])=>W(new THREE.CylinderGeometry(.05,.05,.9,8),x,-1.1,z));
  // piernas sentadas: fijas
  [-1,1].forEach(s=>{const L=mkLimb(g,[{mat:mPants,r:legR}]);L.set(v3(s*.17,-.5,.05),v3(s*.19,-.5,.72),v3(s*.2,-1.3,.78));L.ms.forEach(m=>{m.frustumCulled=true;m.geometry.computeBoundingSphere()});shoe(s*.2,-1.42,.86)})}
 // de pie: quien lo use mueve las piernas con C3D.seg(L.up,cadera,rodilla) y C3D.seg(L.lo,rodilla,tobillo)
 else legs=[-1,1].map(s=>{const Lm=mkLimb(g,[{mat:mPants,r:legR}]),P0=v3(),P1=v3(),L={s,hp:v3(s*.17,-.5,0),sh:shoe(0,0,0)};
  L.up=proxy(mPants,(a,b)=>{P0.copy(a);P1.copy(b)});L.lo=proxy(mPants,(a,b)=>Lm.set(P0,a,b));
  const kn=v3(s*.18,-.98,.02);L.up.userData.limb(L.hp,kn);L.lo.userData.limb(kn,v3(s*.18,-1.4,0));L.sh.position.set(s*.18,-1.47,.08);return L});
 const lo=new THREE.Group();lo.scale.setScalar(KS);lo.position.y=-Y0*KS;g.add(lo);
 M(SPH,mPants,0,.85,0,lo).scale.set(.292,.17,.236);
 // cuerpo: bp lleva las piezas en unidades de la vista previa
 const body=new THREE.Group();g.add(body);const bp=new THREE.Group();bp.scale.setScalar(KS);bp.position.y=-Y0*KS;body.add(bp);
 const ring=(r,t,mat,y)=>{const m=M(new THREE.TorusGeometry(r,t,12,40),mat,0,y,0,bp);m.rotation.x=PI/2;m.scale.y=.82;return m};
 const tor=M(TORSO,mShirt,0,0,0,bp);tor.scale.z=.8;tor.userData.hit=hit;
 ring(.292,.024,mTrim,.815);
 M(new THREE.CylinderGeometry(.08,.09,.2,20),mSkin,0,1.47,0,bp);
 if(A.top==='tee')ring(.112,.026,mTrim,1.448);
 if(A.top==='sweater')ring(.116,.034,mLight,1.445);
 if(A.top==='polo'){ring(.12,.04,mLight,1.44);M(SPH,mLight,0,1.37,.233,bp).scale.setScalar(.017);M(SPH,mLight,0,1.31,.258,bp).scale.setScalar(.017)}
 if(A.top==='hoodie'){ring(.13,.05,mPlain,1.44);M(SPH,mPlain,0,1.46,-.19,bp).scale.set(.25,.16,.13);
  // cordones pegados a la tela del pecho (antes se hundían en el torso y solo asomaban las puntas)
  [-1,1].forEach(s=>{const pts=[1.425,1.37,1.3,1.22].map((y,i)=>{const x=s*(.048+.005*i),r=torR(y);return v3(x,y,.8*Math.sqrt(Math.max(0,r*r-x*x))+.013)});
   const cv=new THREE.CatmullRomCurve3(pts),tg=tubeGeo(12,6);fillTube(tg,cv,0,1,()=>.009);tg.computeBoundingSphere();M(tg,mLight,0,0,0,bp).userData.noOut=1;
   const ag=M(new THREE.CylinderGeometry(.012,.012,.034,8),mTrim,0,0,0,bp);ag.userData.noOut=1;cv.getPointAt(1,ag.position);cv.getTangentAt(1,_t);ag.position.addScaledVector(_t,.012);ag.quaternion.setFromUnitVectors(UPV,_t)})}
 // brazos de una pieza (se rehacen cada cuadro con C3D.seg(up,hombro,codo) y C3D.seg(fo,codo,mano)); manga corta = tubo de tela sobre el mismo brazo
 const long=A.top==='sweater'||A.top==='hoodie',am=long?mPlain:mSkin;
 const arms=[-1,1].map(s=>{const a={s,sh:v3(s*.335,0,0),el:v3(s*.4,-.44,0),h:v3(s*.44,-.86,.08),sleeve:null};
  const parts=[{mat:am,r:armR}];if(!long)parts.push({mat:mPlain,u0:0,u1:.4,rs:14,r:(u,ue)=>armR(u,ue)+.03+.014*sm(.22,.4,u)});
  let cuff=null;if(long){cuff=M(new THREE.TorusGeometry(armR(.86,.5)+.006,.022,10,28),mTrim,0,0,0,body);cuff.frustumCulled=false}
  const L=mkLimb(body,parts,cuff?(L=>{L.curve.getPointAt(.86,cuff.position);L.curve.getTangentAt(.86,_t);cuff.quaternion.setFromUnitVectors(ZV,_t)}):null),P0=v3(),E=v3();
  a.up=proxy(am,(p,q)=>{P0.copy(p)});
  a.fo=proxy(am,(p,q)=>{E.subVectors(q,p);const l=E.length();E.multiplyScalar(l>1e-4?Math.max(.02,l-.07)/l:0).add(p);L.set(P0,p,E)});
  M(SPH,mPlain,a.sh.x,a.sh.y-(long?0:.008),0,body).scale.setScalar(long?.096:.11);   // hombro de tela: ya no asoma la piel arriba de la manga
  a.hand=M(HANDG,mSkin,0,0,0,body);M(SPH,mSkin,-s*.024,.035,.062,a.hand).scale.set(.04,.052,.04);
  a.up.userData.limb(a.sh,a.el);a.fo.userData.limb(a.el,a.h);a.hand.position.copy(a.h);return a});
 // cabeza
 const head=new THREE.Group();head.position.y=(1.965-Y0)*KS;body.add(head);const hp=new THREE.Group();hp.scale.setScalar(KS);head.add(hp);
 const rec=faceRec(A),fm=T(0,rec.tex);fm.addEventListener('dispose',()=>rec.tex.dispose());
 const hf=M(HEADF,fm,0,0,0,hp),hb=M(HEADB,mSkin,0,0,0,hp);hf.userData.hit=hb.userData.hit=hit;
 if(A.hair!=='long')[-1,1].forEach(s=>M(SPH,mSkin,s*.515,-.03,-.01,hp).scale.set(.048,.095,.075));
 M(hairOf(A.hair),mHair,0,0,0,hp);
 if(A.hair==='cap'){const mc=T(A.cap||'#c62828');mc.side=THREE.DoubleSide;const d=new THREE.Group();d.position.y=.1;d.rotation.x=-.22;hp.add(d);
  M(new THREE.SphereGeometry(.57,48,20,0,2*PI,0,PI/2),mc,0,0,0,d);
  M(new THREE.CylinderGeometry(.572,.572,.07,48,1,true),mc,0,-.035,0,d);
  const b=M(new THREE.SphereGeometry(1,40,10,0,PI),mc,0,0,.2,d);b.scale.set(.45,.03,.68);b.rotation.x=.26;
  M(SPH,mc,0,.57,0,d).scale.set(.055,.03,.055);
  const lg=M(new THREE.CircleGeometry(.1,32),T('#ffffff'),0,.262,.512,d);lg.rotation.x=-.47;lg.userData.noOut=1;
  M(new THREE.CircleGeometry(.062,32),T(C),0,0,.002,lg).userData.noOut=1}
 if(A.hair==='bun'){const dir=v3(0,.9,-.44).normalize(),b=M(BUN,mHair,0,0,0,hp);b.position.copy(dir).multiplyScalar(.64);b.quaternion.setFromUnitVectors(UPV,dir);
  const bd=M(new THREE.TorusGeometry(.13,.03,12,32),mPlain,0,0,0,hp);bd.position.copy(dir).multiplyScalar(.54);bd.quaternion.setFromUnitVectors(ZV,dir)}
 // cola de caballo: sale de la nuca con su liga, cuelga y se mece un poco
 let tail=null;
 if(A.hair==='pony'){const P0=v3(0,.24,-.5),cv=new THREE.CatmullRomCurve3([P0,v3(0,.16,-.66),v3(0,-.06,-.71),v3(0,-.3,-.67),v3(0,-.5,-.6)].map(p=>p.clone().sub(P0))),tg=tubeGeo(26,16);
  const pr=u=>u<.15?lerp(.085,.125,sm(0,.15,u)):u<.5?lerp(.125,.1,sm(.15,.5,u)):u<.85?lerp(.1,.05,sm(.5,.85,u)):lerp(.05,.015,sm(.85,1,u));
  tail=new THREE.Group();tail.position.copy(P0);hp.add(tail);fillTube(tg,cv,0,1,(u,a)=>pr(u)*(1+.06*Math.sin(a*7+u*9)));tg.computeBoundingSphere();M(tg,mHair,0,0,0,tail);
  const bd=M(new THREE.TorusGeometry(.095,.028,10,28),mPlain,0,0,0,tail);cv.getPointAt(.06,bd.position);cv.getTangentAt(.06,_t);bd.quaternion.setFromUnitVectors(ZV,_t)}
 if(A.glasses){const mg=T('#1d1c22');
  [-1,1].forEach(s=>{M(new THREE.TorusGeometry(.1,.014,12,40),mg,s*.168,-.012,.505,hp);segS(capM(.011,.2,mg,hp),v3(s*.266,0,.49),v3(s*.47,.012,.3));segS(capM(.011,.2,mg,hp),v3(s*.47,.012,.3),v3(s*.535,.02,.02))});
  M(new THREE.CylinderGeometry(.012,.012,.14,10),mg,0,.005,.512,hp).rotation.z=PI/2}
 // parpadeo (y vaivén de la cola) cuando la cara se dibuja en pantalla
 hf.onBeforeRender=()=>{const t=performance.now()/1000;
  if(!rec.bl&&t>rec.nb){rec.bl=1;rec.be=t+.13;rec.draw()}else if(rec.bl&&t>rec.be){rec.bl=0;rec.nb=t+2+Math.random()*3.5;rec.draw()}
  if(tail){tail.rotation.z=.08*Math.sin(t*1.7+rec.seed);tail.rotation.x=.05*Math.sin(t*1.15+rec.seed)}};
 outline(g);
 g.userData={k,pi,body,head,arms,legs,reachT:0,cheerT:0,l1:.45,l2:.43,face:rec};return g}

// gesto de la cara: 'normal' | 'feliz' | 'enojado' | 'sorpresa' | 'triste'
function setFace(g,ex){const r=g&&g.userData&&g.userData.face;if(!r)return;r.ex=EXS.indexOf(ex)>=0?ex:'normal';r.draw()}
window.MII={mk,setFace,CH};
})();
