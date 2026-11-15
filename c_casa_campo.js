// c_casa_campo.js — CAMPO: lo que rodea a la colonia, colgado del exterior compartido (CIELO.mundo, coordenadas de la casa, suelo en -.4).
// Cerca: en los lotes vacíos detrás de las cuadras de los lados, un parque (kiosco, andadores, bancas, laureles, jardineras y faroles)
// a la izquierda y una cancha de fútbol con árboles a la derecha. Lejos: la colonia se acaba en una franja de árboles y sigue la llanura
// verde (el suelo de CIELO) con hileras de henequén, el casco de una hacienda con su chimenea y veletas de rancho que giran.
// Todo en pocas mallas (LOTE y una InstancedMesh para el henequén); de noche se oscurece con CCALLE.tinte y los faroles se prenden.
(function(){
if(typeof THREE==='undefined'||!window.CIELO||!window.LOTE)return;
const Y=-.4,CR=0xefe6d2,CAN=0xd9ccb2,HI=0x2a2a2c,MAD=0x7a4a2a,TRO=0x6b4a2e,CAL=0xf0ece0,ROJ=0xb5452f;
const HO=[0x4a7a3a,0x3d6b35,0x5a8a40,0x55803a];
let rs=23;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280,pick=a=>a[(rnd()*a.length)|0];
const L=LOTE(),F=LOTE(),G=new THREE.Group();G.name='campo';CIELO.mundo.add(G);
// árbol: tronco (encalado abajo si es laurel) y copa de bolas
function arbol(x,z,k,laurel){k=k||1;L.cyl(.25*k,.35*k,3.2*k,TRO,x,Y+1.6*k,z,6);if(laurel)L.cyl(.37*k,.37*k,1.1*k,CAL,x,Y+.55*k,z,6);
 const c=pick(HO);F.bola(2*k,1.15,.85,1.15,c,x,Y+4*k,z);F.bola(1.4*k,1,.9,1,c,x+1.1*k,Y+3.6*k,z+.4*k);F.bola(1.3*k,1,.9,1,c,x-.9*k,Y+3.7*k,z-.6*k)}
function banca(x,z,ry){const c=Math.cos(ry),s=Math.sin(ry),P=(u,v)=>[x+u*c+v*s,z-u*s+v*c];
 const [a,b]=P(0,0),[e,f]=P(0,.35);L.box(2.4,.12,.6,MAD,a,Y+.75,b,ry);L.box(2.4,.6,.1,MAD,e,Y+1.15,f,ry);
 [-1,1].forEach(k=>{const [g,h]=P(k*1.05,.1);L.box(.1,.75,.7,HI,g,Y+.38,h,ry)})}
const FAR=[];function farol(x,z){L.cyl(.08,.12,4.2,HI,x,Y+2.1,z,6);L.box(.5,.6,.5,HI,x,Y+4.5,z);FAR.push([x,Y+4.4,z])}
function jardinera(x,z,w,d){L.box(w,.5,d,CAN,x,Y+.25,z);L.box(w-.3,.08,d-.3,0x4f3a26,x,Y+.5,z);
 for(let i=0;i<w*d/2.2;i++)F.bola(.35,1,.8,1,pick([0xd8344e,0xf2b33d,0xe86aa0,0x3d7a3a,0x3d7a3a]),x+(rnd()-.5)*(w-.8),Y+.7,z+(rnd()-.5)*(d-.8))}

// ---------- el parque (izquierda): plaza con kiosco en el centro, andadores en cruz, bancas, jardineras, laureles y faroles ----------
{const cx=-55,cz=-35,W=28,D=24;
 L.box(W,.06,D,0x8fae5c,cx,Y+.03,cz);                                                  // pasto del parque (un poco más vivo que la llanura)
 L.box(W,.08,3,CAN,cx,Y+.05,cz);L.box(3,.08,D,CAN,cx,Y+.05,cz);L.cyl(7,7,.09,CAN,cx,Y+.06,cz,24);   // andadores y la plaza redonda
 L.box(W+.6,.4,.4,CR,cx,Y+.2,cz-D/2);L.box(W+.6,.4,.4,CR,cx,Y+.2,cz+D/2);[-1,1].forEach(s=>L.box(.4,.4,D,CR,cx+s*W/2,Y+.2,cz));   // guarnición
 // kiosco: base de ocho lados con escalones, columnas, barandal y techo de lámina roja con remate
 L.cyl(4.2,4.4,.9,CR,cx,Y+.45,cz,8);L.cyl(4.6,4.8,.3,CAN,cx,Y+.15,cz,8);L.box(1.6,.45,1,CAN,cx,Y+.22,cz+4.6);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,x=cx+Math.cos(a)*3.8,z=cz+Math.sin(a)*3.8;L.cyl(.16,.16,3.6,CAL,x,Y+2.7,z,6);
  const b=a+Math.PI/8,x2=cx+Math.cos(b)*3.8,z2=cz+Math.sin(b)*3.8;if(i!==1)L.box(2.8,.08,.08,HI,x2,Y+1.8,z2,-b+Math.PI/2)}
 L.cyl(4.8,4.6,.35,CAL,cx,Y+4.7,cz,8);L.cyl(.3,5,2.2,ROJ,cx,Y+5.95,cz,8);L.cyl(.12,.12,1,HI,cx,Y+7.5,cz,6);L.bola(.25,1,1,1,0xc9a24a,cx,Y+8.05,cz);
 // bancas mirando al kiosco, jardineras en las esquinas, laureles alrededor y faroles en los andadores
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;banca(cx+Math.cos(a)*8.2,cz+Math.sin(a)*8.2,Math.PI/2-a)}
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{jardinera(cx+a*8.5,cz+b*7.5,5,3.6);arbol(cx+a*12,cz+b*9.5,1.1,1);arbol(cx+a*4.5,cz+b*10,.9,1)});
 [[-13,0],[13,0],[0,-11],[0,11]].forEach(([a,b])=>arbol(cx+a,cz+b+(b?0:3.2),1,1));
 [[-7.5,1.8],[7.5,1.8],[1.8,-7],[1.8,7]].forEach(([a,b])=>farol(cx+a,cz+b))}
// entre el parque y la casa, y detrás de las cuadras, más árboles sueltos
[[-34,-26],[-28,-36],[-22,-30],[-36,-40],[-75,-28],[-76,-42]].forEach(([x,z])=>arbol(x,z,.9+rnd()*.4,rnd()<.5));

// ---------- la cancha (derecha): pasto con rayas blancas, porterías, gradita y árboles ----------
{const cx=55,cz=-35,W=26,D=16,bl=0xf4f1e8;
 L.box(W+4,.06,D+4,0x6f9a48,cx,Y+.03,cz);for(let i=0;i<6;i++)L.box(W/6,.065,D,i%2?0x78a44e:0x6a9444,cx-W/2+W/12+i*W/6,Y+.035,cz);
 const ln=(w,d,x,z)=>L.box(w,.07,d,bl,x,Y+.04,z);ln(W,.15,cx,cz-D/2);ln(W,.15,cx,cz+D/2);ln(.15,D,cx-W/2,cz);ln(.15,D,cx+W/2,cz);ln(.15,D,cx,cz);
 for(let i=0;i<24;i++){const a=i/24*Math.PI*2;L.box(.4,.07,.15,bl,cx+Math.cos(a)*2.6,Y+.04,cz+Math.sin(a)*2.6,-a+Math.PI/2)}
 [-1,1].forEach(s=>{const x=cx+s*W/2;ln(3,.15,x-s*1.5,cz-3);ln(3,.15,x-s*1.5,cz+3);ln(.15,6,x-s*3,cz);
  [-2,2].forEach(d=>L.box(.15,2.2,.15,bl,x+s*.1,Y+1.1,cz+d));L.box(.15,.15,4.15,bl,x+s*.1,Y+2.2,cz);L.box(.05,2.2,4,0xd8d8d0,x+s*1.1,Y+1.1,cz)});
 for(let i=0;i<3;i++)L.box(12,.35,.9,CR,cx,Y+.2+i*.45,cz+D/2+2.6+i*.9);              // gradita
 for(let i=0;i<7;i++)arbol(cx-W/2+2+i*(W-4)/6,cz-D/2-3.5,.9+rnd()*.3,rnd()<.6);
 [[-1,1],[1,1]].forEach(([a])=>arbol(cx+a*(W/2+3.5),cz+D/2+3,1))}
[[24,-28],[30,-38],[22,-40],[78,-30],[76,-44]].forEach(([x,z])=>arbol(x,z,.9+rnd()*.4,rnd()<.5));

// ---------- lejos: franja de árboles donde se acaba la colonia (sin tapar la calle) ----------
for(let i=0;i<70;i++){const a=i/70*Math.PI*2+rnd()*.05,r=100+rnd()*14,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>8&&z<48)continue;arbol(x,z,1.3+rnd()*.8,false)}
// hacienda: casco con arcos, chimenea de ladrillo y bodega
{const x=-128,z=-96,ry=.6,c=Math.cos(ry),s=Math.sin(ry),P=(u,v)=>[x+u*c+v*s,z-u*s+v*c];
 let [a,b]=P(0,0);L.box(26,6,9,0xe2b452,a,Y+3,b,ry);L.box(27,.6,10,CR,a,Y+6.2,b,ry);
 for(let i=0;i<7;i++){[a,b]=P(-10.5+i*3.5,4.6);L.box(2,3.6,.3,0x6e4a2a,a,Y+1.8,b,ry)}
 [a,b]=P(-4,4.7);L.box(5,2.2,.3,0xe2b452,a,Y+7.3,b,ry);[a,b]=P(18,-2);L.box(10,4.5,8,0xd8c8a8,a,Y+2.25,b,ry);L.box(10.5,.4,8.5,ROJ,a,Y+4.6,b,ry);
 [a,b]=P(26,4);L.cyl(1,1.6,24,0xa8563a,a,Y+12,b,10);L.cyl(1.3,1.1,1,0x8a4630,a,Y+24.2,b,10)}
// veletas de rancho: torre de fierro y rueda de aspas que gira (onBeforeRender, sin tocar el ciclo de la casa)
const VEL=[];[[118,-70],[-150,-30],[140,-130],[-100,-150]].forEach(([x,z])=>{const h=14;
 for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]])L.box(.15,h,.15,0x9a9ea2,x+a*.9,Y+h/2,z+b*.9,0,a*.06,-b*.06);
 for(let y=3;y<h;y+=3.5)L.box(1.6,.1,1.6,0x9a9ea2,x,Y+y,z);L.box(1.6,.2,.3,0x9a9ea2,x,Y+h+.1,z);L.box(3,.6,.05,0xb5452f,x-2.2,Y+h+.4,z,Math.PI/2);
 const rueda=LOTE();for(let i=0;i<14;i++){const g=i/14*Math.PI*2;rueda.box(.35,2.4,.05,0xd0d0cc,Math.sin(g)*1.5,Math.cos(g)*1.5,0,0,0,-g)}
 const m=rueda.mesh(CCt(new THREE.MeshLambertMaterial({flatShading:true})));m.position.set(x,Y+h+.4,z+.9);m.rotation.y=Math.atan2(-x,-z);
 const ph=rnd()*6;m.onBeforeRender=()=>{m.rotation.z=ph+performance.now()*.0012};VEL.push(m);G.add(m)});
// henequén: hileras de matas en parcelas por la llanura (una sola InstancedMesh)
{const geo=new THREE.ConeGeometry(.9,1.6,5).translate(0,.8,0),P=[[-60,-120,0],[40,-125,.2],[125,-20,1.3],[-125,-55,1.1],[-130,60,1.4],[120,70,1.6],[30,125,0],[-55,118,.1],[95,-100,.7]],M=[];
 P.forEach(([px,pz,ry])=>{const c=Math.cos(ry),s=Math.sin(ry);for(let r=0;r<10;r++)for(let k=0;k<22;k++){const u=(k-10.5)*2.2+(rnd()-.5)*.4,v=(r-4.5)*3.2;M.push([px+u*c+v*s,pz-u*s+v*c,.8+rnd()*.5])}});
 const im=new THREE.InstancedMesh(geo,CCt(new THREE.MeshLambertMaterial({color:0x6f9a7a,flatShading:true})),M.length),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),sc=new THREE.Vector3();
 M.forEach(([x,z,k],i)=>{e.set(0,rnd()*6,0);q.setFromEuler(e);im.setMatrixAt(i,m4.compose(p.set(x,Y,z),q,sc.set(k,k,k)))});G.add(im)}
function CCt(m){return window.CCALLE&&CCALLE.tinte?CCALLE.tinte(m):m}
G.add(L.mesh(CCt(new THREE.MeshLambertMaterial({flatShading:true}))),F.mesh(CCt(new THREE.MeshLambertMaterial({flatShading:true}))));
// faroles del parque: focos que de noche se prenden
const FO=LOTE();FAR.forEach(([x,y,z])=>FO.bola(.2,1,1,1,0xffffff,x,y,z,0));const fo=FO.mesh(new THREE.MeshBasicMaterial({fog:true}));G.add(fo);
const tema=()=>{const n=CIELO.noche();fo.material.color.setHex(n?0xffd27a:0x8a8a80)};CIELO.on(tema);tema();
window.CAMPO={G,VEL};
})();
