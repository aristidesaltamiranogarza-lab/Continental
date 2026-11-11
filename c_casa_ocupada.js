// c_casa_ocupada.js — OCUP: mesas ocupadas de la casa. En cada mesa con partida en curso el juego se ve andando:
// mazo y pila al centro, cartas boca abajo frente a cada lugar, un aro que marca el turno y, cada par de segundos,
// el del turno tira una carta a la pila (vuela y se voltea) o roba del mazo. c_casa3d.js llama OCUP.sync(lista) en
// seatSync con [{t,n,dirs,y}] (t.G = grupo de la mesa con origen al centro, dirs = ángulo de cada silla, y = altura del fieltro)
// y OCUP.paso(now) en cada cuadro.
(()=>{
const M=new Map();let R=null;
const COL=['#C2512A','#2F7A4F','#2B5F9E','#D9A21B','#6B3FA0'];
function rec(){if(R)return R;const cv=f=>{const c=document.createElement('canvas');c.width=64;c.height=90;const g=c.getContext('2d');f(g);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
 const rr=(g,x,y,w,h,r)=>{g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)};
 const dia=(g,x,y,s)=>{g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*.7,y);g.lineTo(x,y+s);g.lineTo(x-s*.7,y);g.closePath();g.fill()};
 const mat=t=>new THREE.MeshStandardMaterial({map:t,roughness:.65,transparent:true,alphaTest:.3});
 const back=mat(cv(g=>{g.fillStyle='#FDF6E9';rr(g,0,0,64,90,8);g.fill();g.fillStyle='#7A2A18';rr(g,5,5,54,80,5);g.fill();
  g.strokeStyle='rgba(255,226,196,.6)';g.lineWidth=2;rr(g,10,10,44,70,4);g.stroke();g.fillStyle='rgba(255,226,196,.6)';dia(g,32,45,12)}));
 const caras=COL.map(c=>mat(cv(g=>{g.fillStyle='#FFFAF1';rr(g,0,0,64,90,8);g.fill();g.strokeStyle=c;g.lineWidth=3;rr(g,6,6,52,78,6);g.stroke();
  g.fillStyle=c;dia(g,32,45,20);dia(g,15,18,6);dia(g,49,72,6)})));
 const geo=new THREE.PlaneGeometry(.42,.6);
 const aro=new THREE.MeshBasicMaterial({color:0xFFC98A,transparent:true,opacity:.6,depthWrite:false});
 return R={back,caras,geo,aro,aroG:new THREE.RingGeometry(.36,.46,40)}}
// carta: dos caras pegadas (arriba la cara, abajo el dorso); rotation.z=PI la deja boca abajo
function carta(cara){const r=rec(),c=new THREE.Group(),f=new THREE.Mesh(r.geo,cara||r.back),b=new THREE.Mesh(r.geo,r.back);
 f.rotation.x=-Math.PI/2;f.position.y=.002;b.rotation.x=Math.PI/2;c.add(f,b);return c}
const lugar=(s,j,k)=>{const a=s.dirs[j],d=s.rr;return new THREE.Vector3(Math.cos(a)*d,s.y,Math.sin(a)*d)};
function arma(o){const r=rec(),g=new THREE.Group();g.name='ocupada';o.t.G.add(g);
 const s={t:o.t,g,dirs:o.dirs,n:o.n,y:o.y+.012,rr:Math.max(.9,o.t.r*.6),pila:[],mazo:new THREE.Group(),fan:[],vuelo:null,turno:0,sig:performance.now()+900+Math.random()*900,ta:o.dirs[0]};
 for(let i=0;i<6;i++){const c=carta();c.rotation.z=Math.PI;c.position.y=i*.012;s.mazo.add(c)}s.mazo.position.set(-.4,s.y,0);s.mazo.rotation.y=.2;g.add(s.mazo);
 for(let i=0;i<3;i++)tira(s,carta(r.caras[(Math.random()*5)|0]),true);
 s.aro=new THREE.Mesh(r.aroG,r.aro.clone());s.aro.rotation.x=-Math.PI/2;g.add(s.aro);
 abanicos(s);return s}
// cartas boca abajo frente a cada jugador
function abanicos(s){s.fan.forEach(f=>s.g.remove(f));s.fan=[];for(let j=0;j<s.n;j++){const f=new THREE.Group(),p=lugar(s,j),a=s.dirs[j];f.position.copy(p);f.rotation.y=-a-Math.PI/2;
 for(let i=0;i<3;i++){const c=carta();c.rotation.z=Math.PI;c.rotation.y=(i-1)*.28;c.position.set((i-1)*.1,i*.004,0);f.add(c)}s.g.add(f);s.fan.push(f)}}
// una carta llega a la pila (queda boca arriba, un poco girada); solo se guardan las últimas 5
function tira(s,c,ya){c.position.set(.35+(Math.random()-.5)*.08,s.y+s.pila.length*.004,(Math.random()-.5)*.08);c.rotation.set(0,Math.random()*Math.PI,0);if(ya)s.g.add(c);s.pila.push(c);
 if(s.pila.length>5){const v=s.pila.shift();s.g.remove(v);s.pila.forEach((p,i)=>p.position.y=s.y+i*.004)}}
function sync(L){const v=new Set();(L||[]).forEach(o=>{if(!o.t||!o.t.G||!o.n||!o.dirs||!o.dirs.length)return;v.add(o.t);const n=Math.min(o.n,o.dirs.length);let s=M.get(o.t);
  if(s&&(s.g.parent!==o.t.G||s.dirs.join()!==o.dirs.join())){quita(s);s=null}
  if(!s){s=arma({...o,n});M.set(o.t,s)}else if(s.n!==n){s.n=n;s.turno%=n;abanicos(s)}});
 M.forEach((s,t)=>{if(!v.has(t))quita(s)})}
function quita(s){if(s.g.parent)s.g.parent.remove(s.g);s.aro.material.dispose();M.delete(s.t)}
const ease=q=>q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;
function paso(now){if(!M.size)return;M.forEach(s=>{
 // aro del turno: se desliza hacia el lugar del que tira y late
 const a=s.dirs[s.turno];let d=a-s.ta;d=Math.atan2(Math.sin(d),Math.cos(d));s.ta+=d*.08;const r=s.rr*1.08;
 s.aro.position.set(Math.cos(s.ta)*r,s.y-.006,Math.sin(s.ta)*r);s.aro.material.opacity=.38+.22*Math.sin(now/260);
 const f=s.vuelo;if(f){const q=Math.min(1,(now-f.t0)/f.dur),e=ease(q);f.c.position.lerpVectors(f.a,f.b,e);f.c.position.y+=Math.sin(q*Math.PI)*f.alto;
  f.c.rotation.z=f.z0+(f.z1-f.z0)*e;f.c.rotation.y=f.y0+f.giro*e;
  if(q>=1){s.vuelo=null;if(f.roba){s.g.remove(f.c);const fan=s.fan[f.j];if(fan){fan.scale.setScalar(1.12);setTimeout(()=>fan.scale.setScalar(1),160)}}else tira(s,f.c,false);
   s.turno=(s.turno+1)%s.n;s.sig=now+1300+Math.random()*1500}}
 else if(now>=s.sig){const j=s.turno,roba=Math.random()<.25,c=carta(roba?null:rec().caras[(Math.random()*5)|0]),p=lugar(s,j),m=s.mazo.position.clone().setY(s.y+.08);
  const a0=roba?m:p.clone().setY(s.y+.03),b0=roba?p.clone().setY(s.y+.03):new THREE.Vector3(.35,s.y+s.pila.length*.004,0);
  c.position.copy(a0);s.g.add(c);s.vuelo={c,a:a0,b:b0,j,roba,t0:now,dur:roba?520:680,alto:roba?.35:.55,z0:Math.PI,z1:roba?Math.PI:0,y0:-s.dirs[j],giro:(Math.random()-.5)*2.4}}})}
window.OCUP={sync,paso,get n(){return M.size}};
})();
