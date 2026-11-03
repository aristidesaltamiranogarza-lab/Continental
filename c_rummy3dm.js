// Rummy 3D: modelos hechos con código para c_rummy3d.js. Fichas de madera clara con el número pintado a mano (el comodín con carita),
// atriles de madera de dos escalones, la bolsa de tela del pozo y el reloj de arena. window.RM3M (init, tile, back, rack, slot, bag, reloj, relojSet). NO cambia reglas.
(function(){
if(typeof THREE==='undefined'||!window.RUMMY)return;const RU=window.RUMMY;
// ficha acostada: TW de ancho (x), TL de largo (z), TT de grueso; en el atril se para inclinada TILT hacia atrás
const TW=.13,TL=.17,TT=.036,TILT=.24,INK=['#c0392b','#1f5fa8','#2b2b2b','#e07a10'];
let CH=null,GEO=null,SIDE=null;const FM={};   // FM: material de la cara de cada ficha (por id, para iluminarla sola)
const rnd=(a,b)=>a+Math.random()*(b-a),v3=(x,y,z)=>new THREE.Vector3(x,y,z);
function wood(g,w,h){const gr=g.createLinearGradient(0,0,w*.4,h);gr.addColorStop(0,'#f7e9c8');gr.addColorStop(1,'#e4c793');g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<16;i++){g.strokeStyle=`rgba(150,100,50,${rnd(.04,.12)})`;g.lineWidth=rnd(.8,2.4);const y=rnd(0,h);g.beginPath();g.moveTo(-4,y);g.bezierCurveTo(w*.3,y+rnd(-9,9),w*.7,y+rnd(-9,9),w+4,y+rnd(-7,7));g.stroke()}
 g.strokeStyle='rgba(120,80,40,.32)';g.lineWidth=7;g.strokeRect(0,0,w,h)}
// la cara: el número pintado con pincel (un poco chueco y con doble trazo); el 6 y el 9 llevan rayita; el comodín, una carita
function faceTex(id){const j=RU.isJ(id),c=j?0:RU.col(id),n=j?0:RU.num(id);
 return CH.ctex('rm-f'+(j?'j':c+'-'+n),128,168,(g,w,h)=>{wood(g,w,h);g.save();g.translate(w/2,h/2+6);
  if(j){g.fillStyle='#f6c34a';g.strokeStyle='#b5462a';g.lineWidth=5;g.beginPath();g.arc(0,-4,40,0,7);g.fill();g.stroke();g.fillStyle='#3a2a1a';[-14,14].forEach(x=>{g.beginPath();g.arc(x,-14,6,0,7);g.fill()});
   g.lineWidth=6;g.lineCap='round';g.beginPath();g.arc(0,-2,22,.25,Math.PI-.25);g.stroke();g.fillStyle='rgba(230,90,80,.5)';[-26,26].forEach(x=>{g.beginPath();g.arc(x,4,7,0,7);g.fill()})}
  else{g.rotate(((n*7+c*3)%5-2)*.018);g.font=`bold ${n>9?86:104}px Georgia,'Times New Roman',serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle=INK[c];
   g.globalAlpha=.92;g.fillText(n,0,0);g.globalAlpha=.3;g.fillText(n,2,-2);g.globalAlpha=1;if(n==6||n==9)g.fillRect(-14,46,28,6)}
  g.restore()})}
function tile(id){if(!FM[id])FM[id]=CH.std(0xffffff,.55,{map:faceTex(id)});const m=new THREE.Mesh(GEO,[SIDE,SIDE,FM[id],SIDE,SIDE,SIDE]);m.castShadow=m.receiveShadow=true;m.userData={id,fm:FM[id]};return m}
function back(){const m=new THREE.Mesh(GEO,SIDE);m.castShadow=true;return m}   // ficha de otro atril: de espaldas, sin número
// atril de dos escalones; en su grupo x va a lo largo y +z mira a su dueño. zone: caja invisible para soltar fichas ahí
function rack(len){const g=new THREE.Group(),wd=CH.std(0x9a6438,.55),dk=CH.std(0x6e4424,.6);
 const B=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=b.receiveShadow=true;g.add(b);return b};
 B(len,.03,.32,wd,0,.015,0);B(len,.07,.12,dk,0,.065,-.1);B(len,.025,.025,wd,0,.045,.135);B(len,.025,.025,dk,0,.112,-.03);[-1,1].forEach(s=>B(.03,.13,.32,dk,s*(len/2-.015),.065,0));
 const z=new THREE.Mesh(new THREE.BoxGeometry(len+.12,.34,.46),new THREE.MeshBasicMaterial({visible:false}));z.position.y=.15;g.add(z);g.userData={len,zone:z};return g}
// lugar de una ficha parada en el atril: fila 0 arriba atrás, fila 1 abajo adelante; x a lo largo
const QT=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2-TILT,0,0)),UP=v3(0,Math.cos(TILT),-Math.sin(TILT)),NR=v3(0,Math.sin(TILT),Math.cos(TILT));
function slot(row,x){return {p:v3(x,row?.035:.1,row?.1:-.06).addScaledVector(UP,TL/2).addScaledVector(NR,TT/2),q:QT}}
// bolsa de manta con rayas, jareta y la boca abierta
function bag(){const g=new THREE.Group(),t=CH.ctex('rm-manta',128,128,(c,w,h)=>{c.fillStyle='#efe3c8';c.fillRect(0,0,w,h);for(let i=0;i<w;i+=2){c.fillStyle=`rgba(120,90,50,${rnd(.03,.08)})`;c.fillRect(i,0,1,h);c.fillRect(0,i,w,1)}
  [['#c0392b',18],['#2e7d4f',30],['#c0392b',42],['#f2b632',90],['#1f5fa8',100]].forEach(([col,y])=>{c.fillStyle=col;c.fillRect(0,y,w,5)})},true);t.repeat.set(4,1);
 const P=[[0,0],[.12,.005],[.17,.04],[.19,.1],[.17,.17],[.11,.23],[.065,.26],[.06,.28],[.085,.32],[.1,.34]].map(([x,y])=>new THREE.Vector2(x,y));
 const m=new THREE.Mesh(new THREE.LatheGeometry(P,28),CH.std(0xffffff,.95,{map:t,side:THREE.DoubleSide}));m.castShadow=m.receiveShadow=true;g.add(m);
 const cu=CH.std(0x8a5a2b,.9),k=new THREE.Mesh(new THREE.TorusGeometry(.066,.01,6,20),cu);k.rotation.x=Math.PI/2;k.position.y=.265;g.add(k);
 [-1,1].forEach(s=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.14,6),cu);c.position.set(s*.05+.06,.2,.06);c.rotation.z=s*.3;g.add(c)});
 const ins=new THREE.Mesh(new THREE.CircleGeometry(.06,16),CH.std(0x2a1a10,1));ins.rotation.x=-Math.PI/2;ins.position.y=.27;g.add(ins);return g}
// reloj de arena de madera: inner se voltea; tp (arena de arriba) y bp (montoncito de abajo) cambian con lo que queda del turno
function reloj(){const g=new THREE.Group(),inner=new THREE.Group(),wd=CH.std(0x7a4a26,.5),sand=CH.std(0xe0b56a,.9);inner.position.y=.19;g.add(inner);
 [-1,1].forEach(s=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.03,20),wd);c.position.y=s*.175;c.castShadow=true;inner.add(c)});
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2,p=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.33,8),wd);p.position.set(Math.cos(a)*.083,0,Math.sin(a)*.083);p.castShadow=true;inner.add(p)}
 const prof=[[.012,0],[.03,.02],[.06,.07],[.07,.12],[.064,.155],[.05,.16]].map(([x,y])=>new THREE.Vector2(x,y)),gl=new THREE.MeshStandardMaterial({color:0xe8f4f6,roughness:.05,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false});
 [1,-1].forEach(s=>{const b=new THREE.Mesh(new THREE.LatheGeometry(prof,24),gl);b.scale.y=s;inner.add(b)});
 const tp=new THREE.Group(),top=new THREE.Mesh(new THREE.ConeGeometry(.058,.12,20),sand);top.rotation.x=Math.PI;top.position.y=.06;tp.position.y=.012;tp.add(top);inner.add(tp);
 const bp=new THREE.Group(),bot=new THREE.Mesh(new THREE.ConeGeometry(.062,.085,20),sand);bot.position.y=.0425;bp.position.y=-.16;bp.add(bot);inner.add(bp);
 const str=new THREE.Mesh(new THREE.CylinderGeometry(.0035,.0035,.15,6),sand);str.position.y=-.08;inner.add(str);g.userData={inner,tp,bp,str};return g}
function relojSet(g,f,run){const u=g.userData,a=Math.cbrt(Math.max(.001,f)),b=Math.cbrt(Math.max(.001,1-f));u.tp.scale.setScalar(a);u.bp.scale.setScalar(b);u.str.visible=run&&f>.005&&f<.995}
window.RM3M={TW,TL,TT,init(ch){if(CH)return;CH=ch;GEO=new THREE.BoxGeometry(TW,TT,TL);SIDE=CH.std(0xe9cf9e,.6)},tile,back,rack,slot,bag,reloj,relojSet};
})();
