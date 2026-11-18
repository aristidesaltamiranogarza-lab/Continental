// Mérida en Venta: mazos de Suerte y Comunidad como pilas de cartas (MZ). MZ.m3 para el tablero 3D (M3), MZ.m2 para el 2D (M2).
// La pila baja conforme se sacan cartas y se rehace al barajar (G.dk = cartas que quedan, G.sh = barajadas). Al sacar, la de arriba
// se levanta, viaja a la cámara y se voltea; draw() devuelve cuánto dura para que el panel de la carta salga después.
(function(){
const COL={s:'#f7a21b',c:'#5bb4ec'},IC={s:'suerte',c:'regalo'},NM={s:'Suerte',c:'Comunidad'},F='Archivo,"Segoe UI","Noto Sans",system-ui,sans-serif',FLY=1400,BK=650;
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
const rr=(g,x,y,w,h,r)=>{g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)};
function wrap(g,t,mw){const w=String(t).split(' '),L=[];let l='';w.forEach(x=>{const y=l?l+' '+x:x;if(g.measureText(y).width>mw&&l){L.push(l);l=x}else l=y});if(l)L.push(l);return L}
function backCv(d){const c=document.createElement('canvas');c.width=512;c.height=330;const g=c.getContext('2d');
 g.fillStyle='#fffef8';g.fillRect(0,0,512,330);g.fillStyle=COL[d];rr(g,16,16,480,298,24);g.fill();g.strokeStyle='#18201b';g.lineWidth=7;g.stroke();
 g.textAlign='center';g.textBaseline='middle';MIC.draw(g,IC[d],256,138,118,'#18201b');g.fillStyle='#18201b';g.font='900 46px '+F;g.fillText(NM[d].toUpperCase(),256,258);return c}
function frontCv(d,t){const c=document.createElement('canvas');c.width=512;c.height=330;const g=c.getContext('2d');
 g.fillStyle='#fffef8';g.fillRect(0,0,512,330);g.fillStyle=COL[d];g.fillRect(0,0,512,54);g.strokeStyle='#18201b';g.lineWidth=10;g.strokeRect(5,5,502,320);
 g.fillStyle='#18201b';g.textAlign='center';g.textBaseline='middle';MIC.draw(g,IC[d],150,29,34,'#18201b');g.font='900 26px '+F;g.fillText(NM[d].toUpperCase(),270,30);
 let fs=36,L;do{g.font='700 '+fs+'px '+F;L=wrap(g,t,440);fs-=2}while(L.length*fs*1.28>240&&fs>16);fs+=2;
 const lh=fs*1.28,y0=192-(L.length-1)*lh/2;L.forEach((l,i)=>g.fillText(l,256,y0+i*lh));return c}
// cuántas cartas se ven y cuándo bajan: espera a que la ficha llegue a la casilla (draw pone la hora), luego quita una; si se barajó, se rehace
function trk(N,apply){let S={s:{},c:{}},lastCn=null;const nOf=c=>c>0?Math.max(1,Math.round(c*N/16)):0;
 function lift(d){const s=S[d];clearTimeout(s.wt);s.wt=0;
  if(s.shuf){s.shuf=0;s.dn=Math.max(0,s.dn-1);apply(d,s.dn,false);s.wr=setTimeout(()=>{s.dn=nOf(s.cnt);apply(d,s.dn,true)},300)}else{s.dn=nOf(s.cnt);apply(d,s.dn,false)}}
 return {sync(G){const cn=G.card?G.card.n:-1,dr=lastCn!=null&&cn>=0&&cn!==lastCn?G.card.d:null;lastCn=cn;
   ['s','c'].forEach(d=>{const s=S[d],h=(G.sh&&G.sh[d])||0,c=G.dk?G.dk[d]:16;s.cnt=typeof c=='number'?c:c.length;
    if(s.sh==null){s.sh=h;s.dn=nOf(s.cnt);apply(d,s.dn,false);return}
    if(h!==s.sh){s.sh=h;s.shuf=1}
    if(d===dr){clearTimeout(s.wt);s.wt=setTimeout(()=>lift(d),3500);return}
    if(s.wt)return;if(s.shuf){s.shuf=0;s.dn=nOf(s.cnt);apply(d,s.dn,true)}else if(nOf(s.cnt)!==s.dn){s.dn=nOf(s.cnt);apply(d,s.dn,false)}})},
  wait(d,ms){const s=S[d];if(!s)return 0;clearTimeout(s.wt);s.wt=setTimeout(()=>lift(d),ms);return s.dn||1},
  reset(){['s','c'].forEach(d=>{clearTimeout(S[d].wt);clearTimeout(S[d].wr)});S={s:{},c:{}};lastCn=null}}}

// ---------- 3D ----------
const N3=12,CW=1.55,CD=1,CT=.02,Y0=.101,P3=330/(2048/12);
function m3(THREE,SC,R){
 const tex=cv=>{const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy());return t};
 const edge=new THREE.MeshStandardMaterial({color:0xf1ecdd,roughness:.85}),geo=new THREE.BoxGeometry(CW,CT,CD),O=new THREE.Object3D(),S={},backT={};
 const lit=m=>new THREE.MeshStandardMaterial({map:m,emissive:0xffffff,emissiveMap:m,emissiveIntensity:.4,roughness:.7});
 ['s','c'].forEach((d,j)=>{backT[d]=tex(backCv(d));const m=new THREE.InstancedMesh(geo,[edge,edge,lit(backT[d]),edge,edge,edge],N3);m.castShadow=m.receiveShadow=true;m.frustumCulled=false;
  const p=(j?1:-1)*P3;m.position.set(p,Y0,p);m.rotation.y=Math.PI/4;m.count=0;SC.add(m);
  const jit=[...Array(N3)].map((_,i)=>{const f=x=>{const h=Math.sin(x)*43758.5453;return h-Math.floor(h)},a=f((i+1)*(j?91.7:37.3)),b=f((i+1)*12.9898+j*4.1);return {x:(a-.5)*.07,z:(b-.5)*.06,r:(a-b)*.08}});
  S[d]={m,jit,dn:0,shT:-1}});
 function lay(s,t){const n=s.dn;s.m.count=n;const a=t>=0&&t<1?Math.sin(t*Math.PI):0;
  for(let i=0;i<n;i++){const q=s.jit[i],sd=i%2?1:-1;O.position.set(q.x+sd*a*CW*.58,CT/2+(i+(Math.floor(i/2)-i)*a)*CT+a*.04,q.z);O.rotation.set(0,q.r+sd*a*.12,0);O.updateMatrix();s.m.setMatrixAt(i,O.matrix)}
  s.m.instanceMatrix.needsUpdate=true}
 const tr=trk(N3,(d,n,sh)=>{const s=S[d];s.dn=n;if(sh&&!RM())s.shT=performance.now();else lay(s,-1)});
 // la carta que vuela: dorso hacia +Z, frente hacia -Z (volteada sobre Y para que el texto quede derecho)
 const fly=new THREE.Group(),bk=new THREE.Mesh(new THREE.PlaneGeometry(CW,CD),lit(null)),fr=new THREE.Mesh(new THREE.PlaneGeometry(CW,CD),lit(null)),ed=new THREE.Mesh(new THREE.BoxGeometry(CW*.99,CD*.99,CT*.9),edge);
 bk.position.z=CT/2;fr.position.z=-CT/2;fr.rotation.y=Math.PI;fly.add(bk,fr,ed);fly.visible=false;fly.renderOrder=20;[bk,fr,ed].forEach(o=>o.renderOrder=20);SC.add(fly);
 const qX=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),qY4=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4),q0=qY4.clone().multiply(qX);
 const qF=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI),qT=new THREE.Quaternion(),v=new THREE.Vector3(),pA=new THREE.Vector3(),pB=new THREE.Vector3();
 let F0=null,LP=null;const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 return {
  sync:G=>tr.sync(G),
  draw(c,text,delay){if(RM())return 0;const s=S[c.d];if(!s)return 0;const top=tr.wait(c.d,delay),p=s.m.position;
   if(fr.material.map)fr.material.map.dispose();const ft=tex(frontCv(c.d,text));fr.material.map=fr.material.emissiveMap=ft;bk.material.map=bk.material.emissiveMap=backT[c.d];fr.material.needsUpdate=bk.material.needsUpdate=true;
   F0={t0:performance.now()+delay,p0:new THREE.Vector3(p.x,Y0+top*CT+CT/2,p.z)};LP=F0.p0;return FLY},
  // regreso: de frente a la cámara vuelve a la pila boca abajo
  back(){if(RM()||!LP)return 0;F0={t0:performance.now(),p0:LP,bw:1};return BK},
  step(now,CA){['s','c'].forEach(d=>{const s=S[d];if(s.shT<0)return;const t=(now-s.shT)/700;lay(s,t);if(t>=1)s.shT=-1});
   if(!F0){fly.visible=false;return}const u=(now-F0.t0)/(F0.bw?BK:FLY);if(u<0){fly.visible=false;return}if(u>=1){F0=null;fly.visible=false;return}fly.visible=true;
   // delante de la cámara, con la carta a ~30% del alto de la vista; qT = de frente a la cámara
   const dist=CD/(.3*2*Math.tan(CA.fov*Math.PI/360));v.set(0,0,-1).applyQuaternion(CA.quaternion);pB.copy(CA.position).addScaledVector(v,dist);qT.copy(CA.quaternion).multiply(qF);
   const dz=x=>[bk,fr,ed].forEach(o=>{o.material.depthTest=x});
   if(F0.bw){const e=ease(u);dz(u>.75);fly.position.lerpVectors(pB,F0.p0,e);fly.position.y+=Math.sin(e*Math.PI)*.5;fly.quaternion.copy(qT).slerp(q0,e);fly.scale.setScalar(1);return}
   pA.copy(F0.p0);pA.y+=.5;dz(u<=.25);
   // se levanta, viaja volteándose en el camino y llega ya de frente (sin pararse grande antes de voltear)
   if(u<.18){const e=ease(u/.18);fly.position.copy(F0.p0);fly.position.y+=.5*e;fly.quaternion.copy(q0);fly.scale.setScalar(1)}
   else if(u<.85){const e=ease((u-.18)/.67);fly.position.lerpVectors(pA,pB,e);fly.position.y+=Math.sin(e*Math.PI)*.6;fly.quaternion.copy(q0).slerp(qT,e);fly.scale.setScalar(1)}
   else{const e=(u-.85)/.15;fly.position.copy(pB);fly.quaternion.copy(qT);fly.scale.setScalar(1+Math.sin(e*Math.PI)*.04)}},
  reset(){tr.reset();F0=LP=null;fly.visible=false;['s','c'].forEach(d=>{S[d].dn=0;S[d].shT=-1;S[d].m.count=0})}}}

// ---------- 2D ----------
const N2=8;
function m2(ctr){const S={};
 ['s','c'].forEach(d=>{const e=document.createElement('div');e.className='m2deck '+d;let h='';
  for(let i=0;i<N2;i++){const r=(Math.sin((i+1)*(d=='s'?37.3:91.7))*3).toFixed(2);h+=`<div class="m2k" style="--i:${i};--r:${r}deg"><span>${MIC.h(IC[d])}</span><b>${NM[d]}</b></div>`}
  e.innerHTML=h;ctr.prepend(e);S[d]=e});
 const show=(d,n)=>S[d].querySelectorAll('.m2k').forEach((k,i)=>{k.style.display=i<n?'':'none'});
 const tr=trk(N2,(d,n,sh)=>{show(d,n);if(sh&&!RM()){const e=S[d];e.classList.remove('shuf');void e.offsetWidth;e.classList.add('shuf');setTimeout(()=>e.classList.remove('shuf'),750)}});
 return {
  sync:G=>tr.sync(G),
  draw(c,text,delay,ins){if(RM())return 0;const e=S[c.d];if(!e)return 0;tr.wait(c.d,delay);
   setTimeout(()=>{const ks=[...e.querySelectorAll('.m2k')].filter(k=>k.style.display!='none'),top=ks[ks.length-1]||e,r=top.getBoundingClientRect();
    const box=document.createElement('div');box.className='mz2box';const I=ins||{t:0,b:0,r:0};box.style.cssText=`top:${I.t||0}px;bottom:${I.b||0}px;right:${I.r||0}px`;
    box.innerHTML=`<div class="mz2c"><div class="mz2f mz2b ${c.d}"><span>${MIC.h(IC[c.d])}</span><b>${NM[c.d]}</b></div><div class="mz2f mz2t ${c.d}"><h5>${MIC.h(IC[c.d])} ${NM[c.d]}</h5><p></p></div></div>`;
    box.querySelector('p').textContent=text;document.body.appendChild(box);const fc=box.firstChild,fb=fc.getBoundingClientRect();
    const dx=r.left+r.width/2-(fb.left+fb.width/2),dy=r.top+r.height/2-(fb.top+fb.height/2),s0=Math.max(.15,Math.min(1,(r.width/1.2)/fb.width));
    const A=`translate(${dx}px,${dy}px) rotate(-45deg) scale(${s0})`,B=`translate(${dx}px,${dy-24}px) rotate(-45deg) scale(${s0*1.12})`;
    fc.animate([{transform:A+' rotateY(0deg)',offset:0},{transform:B+' rotateY(0deg)',offset:.18},{transform:'translate(0,0) rotate(0) scale(1) rotateY(0deg)',offset:.6},{transform:'scale(1.05) rotateY(180deg)',offset:.85},{transform:'scale(1) rotateY(180deg)',offset:1}],
     {duration:FLY,easing:'ease-in-out',fill:'forwards'});setTimeout(()=>box.remove(),FLY+40)},delay);return FLY},
  back(c,ins,text){if(RM())return 0;const e=S[c.d];if(!e)return 0;const ks=[...e.querySelectorAll('.m2k')].filter(k=>k.style.display!='none'),top=ks[ks.length-1]||e,r=top.getBoundingClientRect();
   const box=document.createElement('div');box.className='mz2box';const I=ins||{t:0,b:0,r:0};box.style.cssText=`top:${I.t||0}px;bottom:${I.b||0}px;right:${I.r||0}px`;
   box.innerHTML=`<div class="mz2c"><div class="mz2f mz2b ${c.d}"><span>${MIC.h(IC[c.d])}</span><b>${NM[c.d]}</b></div><div class="mz2f mz2t ${c.d}"><h5>${MIC.h(IC[c.d])} ${NM[c.d]}</h5><p></p></div></div>`;
   box.querySelector('p').textContent=text||'';document.body.appendChild(box);const fc=box.firstChild,fb=fc.getBoundingClientRect(),dx=r.left+r.width/2-(fb.left+fb.width/2),dy=r.top+r.height/2-(fb.top+fb.height/2),s0=Math.max(.15,Math.min(1,(r.width/1.2)/fb.width));
   fc.animate([{transform:'translate(0,0) rotate(0) scale(1) rotateY(180deg)'},{transform:`translate(${dx}px,${dy}px) rotate(-45deg) scale(${s0}) rotateY(0deg)`}],{duration:BK,easing:'ease-in-out',fill:'forwards'});setTimeout(()=>box.remove(),BK+40);return BK},
  reset(){tr.reset()}}}

const css=document.createElement('style');css.textContent=`
.m2deck{position:absolute;width:calc(var(--u)*1.9);height:calc(var(--u)*1.22);transform:translate(-50%,-50%) rotate(-45deg)}
.m2deck.s{left:24%;top:24%}.m2deck.c{left:76%;top:76%}
.m2k{position:absolute;inset:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*.04);border-radius:calc(var(--u)*.12);border:calc(var(--u)*.045) solid #18201b;color:#18201b;
 transform:translate(calc(var(--u)*.024*var(--i)),calc(var(--u)*-.024*var(--i))) rotate(var(--r));box-shadow:calc(var(--u)*.03) calc(var(--u)*.04) 0 rgba(0,0,0,.22)}
.m2deck.s .m2k{background:#f7a21b}.m2deck.c .m2k{background:#5bb4ec}
.m2k span{font-size:calc(var(--u)*.42);line-height:1;display:flex}.m2k b{font-weight:900;font-size:calc(var(--u)*.18);text-transform:uppercase;letter-spacing:.08em}
.m2deck.shuf .m2k{animation:mzsh .7s ease-in-out}.m2deck .m2k:nth-child(odd){--sd:-1}.m2deck .m2k:nth-child(even){--sd:1}
@keyframes mzsh{50%{translate:calc(var(--sd)*var(--u)*1.05) 0}}
.mz2box{position:fixed;left:0;z-index:65;display:flex;align-items:center;justify-content:center;pointer-events:none;perspective:1000px}
.mz2c{position:relative;width:min(310px,80vw);aspect-ratio:1.55;transform-style:preserve-3d}
.mz2f{position:absolute;inset:0;box-sizing:border-box;-webkit-backface-visibility:hidden;backface-visibility:hidden;border-radius:14px;border:3px solid #18201b;color:#18201b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-family:${F};text-align:center;padding:14px}
.mz2b.s{background:#f7a21b}.mz2b.c{background:#5bb4ec}.mz2b span{font-size:64px;line-height:1;display:flex}.mz2b b{font-weight:900;font-size:20px;text-transform:uppercase;letter-spacing:.1em}
.mz2t{transform:rotateY(180deg);background:#fffef8;border-top:14px solid #f7a21b}.mz2t.c{border-top-color:#5bb4ec}
.mz2t h5{margin:0;font-weight:900;font-size:15px;text-transform:uppercase;letter-spacing:.1em;display:flex;gap:6px;align-items:center}.mz2t p{margin:0;font-weight:700;font-size:16px;line-height:1.3}`;
document.head.appendChild(css);
window.MZ={m3,m2};
})();
