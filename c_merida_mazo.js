// Mérida en Venta: mazos de Suerte y Comunidad como pilas de cartas (MZ). MZ.m3 para el tablero 3D (M3), MZ.m2 para el 2D (M2).
// La pila baja conforme se sacan cartas y se rehace al barajar (G.dk = cartas que quedan, G.sh = barajadas). Al sacar, la de arriba
// sale de la pila: at(d) dice dónde está en pantalla para que la carta de c_meridaui.js vuele desde ahí.
(function(){
const COL={s:'#f7a21b',c:'#5bb4ec'},IC={s:'suerte',c:'regalo'},NM={s:'Suerte',c:'Comunidad'},F='Archivo,"Segoe UI","Noto Sans",system-ui,sans-serif';
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
const rr=(g,x,y,w,h,r)=>{g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)};
function wrap(g,t,mw){const w=String(t).split(' '),L=[];let l='';w.forEach(x=>{const y=l?l+' '+x:x;if(g.measureText(y).width>mw&&l){L.push(l);l=x}else l=y});if(l)L.push(l);return L}
function backCv(d){const c=document.createElement('canvas');c.width=512;c.height=330;const g=c.getContext('2d');
 g.fillStyle='#fffef8';g.fillRect(0,0,512,330);g.fillStyle=COL[d];rr(g,16,16,480,298,24);g.fill();g.strokeStyle='#18201b';g.lineWidth=7;g.stroke();
 g.textAlign='center';g.textBaseline='middle';MIC.draw(g,IC[d],256,138,118,'#18201b');g.fillStyle='#18201b';g.font='900 46px '+F;g.fillText(NM[d].toUpperCase(),256,258);return c}
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
 // dónde se ve la carta de arriba de la pila (pantalla): centro, ancho y giro; con dl además baja la pila cuando la carta sale
 let LC=null;const v=new THREE.Vector3();
 return {
  sync:G=>tr.sync(G),
  at(d,dl){const s=S[d];if(!s)return null;const top=dl!=null?tr.wait(d,dl):s.dn;if(!LC)return null;const p=s.m.position,y=Y0+top*CT,b=R.domElement.getBoundingClientRect(),
   pr=(x,z)=>{v.set(x,y,z).project(LC);return v.z<1?[b.left+(v.x+1)/2*b.width,b.top+(1-v.y)/2*b.height]:null},h=CW/2*Math.SQRT1_2,A=pr(p.x-h,p.z+h),B=pr(p.x+h,p.z-h),C=pr(p.x,p.z);
   if(!A||!B||!C)return null;let a=Math.atan2(B[1]-A[1],B[0]-A[0])*180/Math.PI;if(a>90)a-=180;else if(a<-90)a+=180;return {x:C[0],y:C[1],w:Math.hypot(B[0]-A[0],B[1]-A[1]),a}},
  step(now,CA){['s','c'].forEach(d=>{const s=S[d];if(s.shT<0)return;const t=(now-s.shT)/700;lay(s,t);if(t>=1)s.shT=-1});
   LC=CA},
  reset(){tr.reset();['s','c'].forEach(d=>{S[d].dn=0;S[d].shT=-1;S[d].m.count=0})}}}

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
  at(d,dl){const e=S[d];if(!e)return null;if(dl!=null)tr.wait(d,dl);const ks=[...e.querySelectorAll('.m2k')].filter(k=>k.style.display!='none'),r=(ks[ks.length-1]||e).getBoundingClientRect();
   return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width/1.16,a:-45}},
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
`;
document.head.appendChild(css);
window.MZ={m3,m2};
})();
