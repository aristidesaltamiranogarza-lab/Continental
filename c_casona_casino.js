// c_casona_casino.js — CASC: lo que se mueve en el casino del sótano de la casona (CASONA.md R8/R12). SOTC lo llama con los empties
// sot_ruleta_casino y sot_traga<n> del GLB (blender/casona_sm.py, lista SOT; ry = hacia dónde mira el frente): una ruleta automática
// (la rueda gira sola y cada tanto tira la bola; tocar el paño la tira ya) con sus sillas, y tragamonedas con banco (tocar la pantalla =
// tirada corta, sin apuestas; si salen tres iguales el foco de arriba parpadea). Caja, alfombras, cuadros y plantas van horneados en el GLB.
// CASC.pon(e,H,F) con e(n) → {x,y,z,ry} o null; devuelve {paso} o null. CASC.A: ajustes.
(function(){
if(typeof THREE==='undefined')return;
const PI=Math.PI,TAU=2*PI,rnd=(a,b)=>a+Math.random()*(b-a);
const A={TH:1.5,HT:3.2,VR:.7,GIRO:8,FRENO:.33,PAUSA:10,REEL:9};
const ROJOS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const RUEDA=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const col=n=>n===0?'#1d7a3e':ROJOS.has(n)?'#a3192a':'#151515';
const ORO='#e9c46a',CROMO='#c8ccd2',MAD='#2a160c',VINO='#6e1a24';

// ---------- texturas ----------
function texPano(H){return H.ctex('casc-pano',1024,512,(g,w,h)=>{g.fillStyle='#17734a';g.fillRect(0,0,w,h);
 const x0=40,y0=40,z0=70,cw=64,ch=80;g.strokeStyle='#efe6c8';g.lineWidth=3;g.textAlign='center';g.textBaseline='middle';
 const t=(s,x,y,f)=>{g.fillStyle='#f4ecd6';g.font=f||'bold 30px Georgia,serif';g.fillText(s,x,y)};
 g.beginPath();g.moveTo(x0+z0,y0);g.lineTo(x0+z0,y0+3*ch);g.lineTo(x0,y0+1.5*ch);g.closePath();g.fillStyle=col(0);g.fill();g.stroke();t('0',x0+z0*.62,y0+1.5*ch);
 for(let c=0;c<12;c++)for(let r=0;r<3;r++){const n=c*3+3-r,x=x0+z0+c*cw,y=y0+r*ch;g.strokeRect(x,y,cw,ch);
  g.fillStyle=col(n);g.beginPath();g.ellipse(x+cw/2,y+ch/2,24,30,0,0,TAU);g.fill();t(String(n),x+cw/2,y+ch/2+1,'bold 26px Georgia,serif')}
 for(let r=0;r<3;r++){g.strokeRect(x0+z0+12*cw,y0+r*ch,cw,ch);t('2a1',x0+z0+12.5*cw,y0+(r+.5)*ch,'bold 20px Georgia,serif')}
 ['1a 12','2a 12','3a 12'].forEach((s,i)=>{const x=x0+z0+i*4*cw;g.strokeRect(x,y0+3*ch,4*cw,60);t(s,x+2*cw,y0+3*ch+30,'bold 26px Georgia,serif')});
 ['1-18','PAR','r','n','IMPAR','19-36'].forEach((s,i)=>{const x=x0+z0+i*2*cw,y=y0+3*ch+60;g.strokeRect(x,y,2*cw,60);
  if(s.length>1)t(s,x+cw,y+30,'bold 22px Georgia,serif');
  else{g.fillStyle=s==='r'?'#a3192a':'#151515';g.beginPath();g.moveTo(x+cw,y+8);g.lineTo(x+cw+30,y+30);g.lineTo(x+cw,y+52);g.lineTo(x+cw-30,y+30);g.closePath();g.fill();g.stroke()}})})}

function texRueda(H){return H.ctex('casc-rueda',512,512,(g,w,h)=>{const c=w/2,n=RUEDA.length,da=TAU/n;
 const gr=g.createRadialGradient(c,c,10,c,c,190);gr.addColorStop(0,'#8a5a2a');gr.addColorStop(1,'#4a2a12');g.fillStyle=gr;g.beginPath();g.arc(c,c,256,0,TAU);g.fill();
 RUEDA.forEach((k,i)=>{const a=i*da-PI/2-da/2;g.fillStyle=col(k);g.beginPath();g.moveTo(c+Math.cos(a)*170,c+Math.sin(a)*170);g.arc(c,c,250,a,a+da);g.arc(c,c,170,a+da,a,true);g.closePath();g.fill();
  g.save();g.translate(c,c);g.rotate(a+da/2+PI/2);g.fillStyle='#f4ecd6';g.font='bold 22px Georgia,serif';g.textAlign='center';g.fillText(String(k),0,-222);g.restore()});
 g.strokeStyle=ORO;g.lineWidth=3;for(let i=0;i<n;i++){const a=i*da-PI/2-da/2;g.beginPath();g.moveTo(c+Math.cos(a)*170,c+Math.sin(a)*170);g.lineTo(c+Math.cos(a)*206,c+Math.sin(a)*206);g.stroke()}
 [170,206,250].forEach(r=>{g.beginPath();g.arc(c,c,r,0,TAU);g.stroke()});
 g.lineWidth=6;for(let i=0;i<8;i++){const a=i*PI/4;g.beginPath();g.moveTo(c+Math.cos(a)*40,c+Math.sin(a)*40);g.lineTo(c+Math.cos(a)*160,c+Math.sin(a)*160);g.stroke()}})}

// rodillo: 5 figuras dibujadas una sobre otra (siete, BAR, cerezas, campana, limón); cada una ocupa 1/5 del alto
const NF=5;
function texRodillo(H){return H.ctex('casc-rodillo',128,640,(g,w,h)=>{g.fillStyle='#f6f1e4';g.fillRect(0,0,w,h);const s=h/NF;
 for(let i=0;i<NF;i++){const y=i*s,cx=w/2,cy=y+s/2;g.strokeStyle='rgba(0,0,0,.12)';g.lineWidth=2;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();
  if(i===0){g.fillStyle='#c0182c';g.font='bold 96px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('7',cx,cy+4)}
  if(i===1){g.fillStyle='#151515';g.fillRect(cx-46,cy-24,92,48);g.fillStyle='#f6f1e4';g.font='bold 30px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('BAR',cx,cy+1)}
  if(i===2){g.strokeStyle='#2f6b2a';g.lineWidth=5;g.beginPath();g.moveTo(cx-18,cy+10);g.quadraticCurveTo(cx,cy-40,cx+14,cy-38);g.moveTo(cx+18,cy+14);g.quadraticCurveTo(cx+14,cy-20,cx+14,cy-38);g.stroke();
   g.fillStyle='#c0182c';[[cx-20,cy+18],[cx+20,cy+22]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,20,0,TAU);g.fill()})}
  if(i===3){g.fillStyle='#d8a531';g.beginPath();g.moveTo(cx-36,cy+26);g.quadraticCurveTo(cx-30,cy-38,cx,cy-38);g.quadraticCurveTo(cx+30,cy-38,cx+36,cy+26);g.closePath();g.fill();
   g.beginPath();g.arc(cx,cy+30,9,0,TAU);g.fill()}
  if(i===4){g.fillStyle='#e8d23a';g.beginPath();g.ellipse(cx,cy,40,28,.2,0,TAU);g.fill();g.strokeStyle='#b9a21e';g.lineWidth=3;g.stroke()}}})}

function texLetrero(H){return H.ctex('casc-letrero',256,80,(g,w,h)=>{g.fillStyle='#3a0c12';g.fillRect(0,0,w,h);g.fillStyle=ORO;g.font='italic bold 40px Georgia,serif';
 g.textAlign='center';g.textBaseline='middle';g.fillText('Fortuna',w/2,h/2+2);g.fillStyle='#fff1c8';for(let i=0;i<14;i++){g.beginPath();g.arc(9+i*(w-18)/13,7,3.5,0,TAU);g.arc(9+i*(w-18)/13,h-7,3.5,0,TAU);g.fill()}})}

// ---------- piezas ----------
function silla(H,G,x,z,ry,OB){if(!window.CAS3)return;const c=CAS3.silla(H.std,'#5a1a1a');c.position.set(x,0,z);c.rotation.y=ry;G.add(c);OB.push([x,z,.35])}

function ruleta(H,p,F,tap){const G=new THREE.Group();G.position.set(p.x,p.y,p.z);G.rotation.y=p.ry;F.SC.add(G);const TH=A.TH,OB=[];
 const L=LOTE();
 L.box(2.9,.1,1.0,'#160c06',0,.05,0);L.box(3.0,1.3,1.1,MAD,0,.75,0);L.box(3.04,.05,1.14,ORO,0,1.38,0);
 L.box(3.4,.1,1.5,'#3a2010',0,1.45,0);
 [-1,1].forEach(s=>{L.box(3.4,.09,.13,'#4a1418',0,1.54,s*.69);L.box(.13,.09,1.25,'#4a1418',s*1.635,1.54,0)});
 L.cyl(.68,.64,.07,'#3a2010',1.0,1.535,0,40);
 const m=L.mesh(H.std(0xffffff,.55));m.castShadow=m.receiveShadow=true;G.add(m);
 const ar=new THREE.Mesh(new THREE.TorusGeometry(.63,.03,8,48),H.std(0xc9a24a,.35,{metalness:.6}));ar.rotation.x=PI/2;ar.position.set(1.0,1.58,0);G.add(ar);
 const pano=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.05),H.std(0xffffff,.95,{map:texPano(H)}));pano.rotation.x=-PI/2;pano.position.set(-.55,TH+.003,0);
 pano.userData.hit={t:'fn',f:tap};G.add(pano);F.hits.push(pano);
 // rueda: disco con las casillas, torreta de latón con cuatro brazos (gira con el disco) y la bola
 const giro=new THREE.Group();giro.position.set(1.0,TH+.075,0);giro.userData.anim=1;G.add(giro);
 const dm=new THREE.Mesh(new THREE.CircleGeometry(.6,48),H.std(0xffffff,.5,{map:texRueda(H)}));dm.rotation.x=-PI/2;dm.userData.anim=1;giro.add(dm);
 const lat=H.std(0xc9a24a,.3,{metalness:.7}),tor=new THREE.Mesh(new THREE.ConeGeometry(.09,.12,16),lat);tor.position.y=.06;tor.userData.anim=1;giro.add(tor);
 for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.26,6),lat);b.rotation.z=PI/2;b.rotation.y=i*PI/2;b.position.y=.11;b.userData.anim=1;giro.add(b)}
 const bola=new THREE.Mesh(new THREE.SphereGeometry(.03,12,8),H.std(0xf8f6f0,.25));bola.userData.anim=1;G.add(bola);
 window.CAS3&&CAS3.campana&&(CAS3.campana(G,H.std,-.55,2.75,0,A.HT,1.1),CAS3.campana(G,H.std,1.0,2.75,0,A.HT,.9));
 // sillas: cuatro de un lado y tres del otro, mirando al paño
 [-1.35,-.5,.35].forEach(x=>silla(H,G,x,1.3,PI,OB));[-1.35,-.5,.35,1.2].forEach(x=>silla(H,G,x,-1.3,0,OB));
 [-1.1,0,1.1].forEach(x=>OB.push([x,0,.85]));
 G.updateMatrixWorld(true);const v=new THREE.Vector3();
 F.OB.push(...OB.map(([x,z,r])=>{v.set(x,0,z);G.localToWorld(v);return {x:v.x,z:v.z,r}}));
 // estado: la bola corre al revés de la rueda, frena, baja a las casillas y se queda en una
 let wa=0,ba=rnd(0,TAU),bv=0,br=.46,off=0,fase='quieta',t=rnd(2,A.PAUSA);
 const da=TAU/RUEDA.length;
 const tirar=()=>{if(fase==='gira')return;fase='gira';bv=-(A.GIRO+rnd(0,3));br=.58};
 return {tirar,paso(dt){wa+=A.VR*dt;giro.rotation.y=wa;
  if(fase==='quieta'){ba=wa+off;br=.46;t-=dt;if(t<=0)tirar()}
  else{ba+=bv*dt;bv*=Math.exp(-A.FRENO*dt);const s=Math.abs(bv);
   br=s>3?.58:.46+.12*Math.max(0,(s-1.4)/1.6);
   if(s<1.4){off=Math.round((ba-wa)/da)*da;fase='quieta';t=A.PAUSA+rnd(0,4)}}
  const y=fase==='gira'&&Math.abs(bv)<3?Math.abs(Math.sin(ba*3))*.02:0;
  bola.position.set(1.0+Math.cos(-ba)*br,TH+.105+y,Math.sin(-ba)*br)}}}

function traga(H,p,F,mats,i){const G=new THREE.Group();G.position.set(p.x,p.y,p.z);G.rotation.y=p.ry;F.SC.add(G);
 const L=LOTE(),cu=i%2?'#5a1520':VINO;
 L.box(.92,.92,.72,'#3a0e14',0,.46,0);L.box(.94,.04,.74,CROMO,0,.94,0);
 L.box(.88,1.0,.56,cu,0,1.46,-.08);[-1,1].forEach(s=>L.box(.03,1.02,.58,CROMO,s*.455,1.46,-.08));
 L.box(.72,.54,.04,'#141414',0,1.5,.205);L.box(.9,.06,.32,'#262626',0,1.0,.3,0,.25);
 [['#c0182c',-.22],['#e0b030',0],['#2f8a3a',.22]].forEach(([c,x])=>L.cyl(.04,.04,.03,c,x,1.04,.32,10,0,.25));
 L.box(.5,.08,.16,CROMO,0,.26,.38);L.box(.92,.36,.64,cu,0,2.14,-.04);L.box(.94,.03,.66,CROMO,0,1.95,-.04);
 L.box(.06,.12,.12,CROMO,.47,1.2,0);L.cyl(.02,.02,.5,CROMO,.5,1.45,0,8);L.bola(.055,1,1,1,'#c0182c',.5,1.72,0);
 // banco
 L.cyl(.2,.22,.04,CROMO,0,.02,.95,16);L.cyl(.035,.035,.86,CROMO,0,.45,.95,8);L.cyl(.22,.2,.1,'#5a1a1a',0,.9,.95,18);L.bola(.22,1,.25,1,'#5a1a1a',0,.95,.95);
 const m=L.mesh(H.std(0xffffff,.5));m.castShadow=m.receiveShadow=true;G.add(m);
 const let_=new THREE.Mesh(new THREE.PlaneGeometry(.82,.26),mats.letrero);let_.position.set(0,2.14,.285);G.add(let_);
 const foco=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),mats.foco[i%2]);foco.position.set(0,2.4,-.04);foco.userData.anim=1;G.add(foco);
 const rod=[],hit={t:'fn',f:()=>tirar()};
 for(let k=0;k<3;k++){const tx=mats.rodillo.clone();tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(1,.6);tx.offset.y=Math.floor(rnd(0,NF))/NF;tx.needsUpdate=true;
  const q=new THREE.Mesh(new THREE.PlaneGeometry(.2,.42),new THREE.MeshBasicMaterial({map:tx}));q.position.set(-.22+k*.22,1.5,.23);q.userData.hit=hit;q.userData.anim=1;G.add(q);F.hits.push(q);rod.push({tx,v:0,fin:0})}
 G.updateMatrixWorld(true);const v=new THREE.Vector3();[[0,0,.55],[0,.95,.3]].forEach(([x,z,r])=>{v.set(x,0,z);G.localToWorld(v);F.OB.push({x:v.x,z:v.z,r})});
 let t=-1,gana=0;
 function tirar(){if(t>=0)return;t=0;gana=0;rod.forEach((r,k)=>{r.v=A.REEL;r.fin=.9+k*.45;r.k=Math.floor(rnd(0,NF))})}
 return {foco,paso(dt){if(t<0)return;t+=dt;let todos=true;
  rod.forEach(r=>{if(t<r.fin){r.tx.offset.y=(r.tx.offset.y+r.v*dt*.2)%1;todos=false}else if(r.v){r.v=0;r.tx.offset.y=(r.k/NF+.8)%1}});
  if(todos){t=-1;if(rod.every(r=>r.k===rod[0].k))gana=2.5}},gana:()=>gana,baja(dt){gana=Math.max(0,gana-dt)}}}

function pon(e,H,F){if(!window.LOTE||!H||!H.ctex)return null;const ms=[],ps=[];let rl=null;
 const r=e('ruleta_casino');if(r)try{rl=ruleta(H,r,F,()=>rl&&rl.tirar())}catch(er){console.error('[CASC] ruleta',er)}
 const mats={letrero:new THREE.MeshBasicMaterial({map:texLetrero(H),toneMapped:false}),rodillo:texRodillo(H),
  foco:[new THREE.MeshBasicMaterial({color:0xffd27a,toneMapped:false}),new THREE.MeshBasicMaterial({color:0xff7a4a,toneMapped:false})]};
 for(let i=1;i<20;i++){const p=e('traga'+i);if(!p)break;try{ms.push(traga(H,p,F,mats,i))}catch(er){console.error('[CASC] traga',er);break}}
 if(!rl&&!ms.length)return null;
 let t0=performance.now(),tt=0;const c0=new THREE.Color(0xffd27a),c1=new THREE.Color(0xff7a4a),apag=new THREE.Color(0x4a2a1a);
 return {paso(){const n=performance.now(),dt=Math.min(.1,(n-t0)/1000);t0=n;tt+=dt;if(rl)rl.paso(dt);
  // los focos de arriba se turnan; el de la que ganó parpadea rápido
  const on=Math.floor(tt*1.5)%2;mats.foco[0].color.copy(on?c0:apag);mats.foco[1].color.copy(on?apag:c1);
  ms.forEach(m=>{m.paso(dt);if(m.gana()>0){m.baja(dt);m.foco.material=Math.floor(tt*10)%2?mats.foco[0]:mats.foco[1]}})}}}

window.CASC={pon,A};
})();
