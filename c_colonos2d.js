// Colonos 2D (CO2): tablero de hexágonos en SVG sobre una capa fija que no se redibuja (así las animaciones no se cortan con render()).
// Arte propio de los bocetos: terrenos pintados con su diorama, mar enmarcado en madera, fichas con anillo de tu color donde cobras.
// Zoom con pellizco o rueda y arrastrar para mover (arrastrar no gira). Tocar cerca de un lugar válido lo elige (CO2.onTap(tipo,id)).
// API: show(on) · sync(G,me,o) con o={spots:{w,L},ghost:{w,at},col} · fit(ins) · pos(tipo,id) → {x,y} en pantalla · roll(s) · reset()
(function(){
const D=window.COLD;if(!D){console.warn('Colonos 2D: falta colonos_data.js');return}
const U=60,S3=Math.sqrt(3),NS='http://www.w3.org/2000/svg',RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const f1=v=>Math.round(v*10)/10,FONT='font-family="Nunito,system-ui,sans-serif"';
const pc=k=>D.PCOL[k%D.PCOL.length];
const dk=(c,m)=>{m=m==null?.42:m;const n=parseInt(c.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,f=x=>Math.round(x*(1-m)).toString(16).padStart(2,'0');return '#'+f(r)+f(g)+f(b)};
const pd=k=>k%D.PCOL.length==2?'#7A6646':dk(pc(k));
// colores de los recursos (madera, ladrillo, lana, trigo, mineral) para puertos y cartas
const RCOL=['#3F6E35','#B0552F','#F1EDE2','#E0AE3E','#6E7684'];
// ---------- arte de los terrenos (símbolos de 100×100 con el hexágono recortado) ----------
const DEFS=`<defs>
<clipPath id="coHx"><polygon points="41.57,-24 41.57,24 0,48 -41.57,24 -41.57,-24 0,-48"/></clipPath>
<pattern id="coWh" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="9" height="9" fill="#E3B651"/><rect width="9" height="3.2" fill="#D2A03A"/></pattern>
<g id="coTree"><ellipse cx="0" cy="9" rx="8" ry="2.6" fill="#1d2e1a" opacity=".25"/><path d="M0-13C5-6 9 1 8 6Q0 10-8 6C-9 1-5-6 0-13Z" fill="#2F5E37"/><path d="M0-13C5-6 9 1 8 6Q4 8.5 1 8.6C2.5 0 1.5-7 0-13Z" fill="#244A2B"/></g>
<g id="coSheep"><ellipse cx="0" cy="5" rx="7" ry="2" fill="#2d3a1a" opacity=".2"/><ellipse cx="0" cy="0" rx="7" ry="5" fill="#FBF8F0" stroke="#DCD4C3" stroke-width=".8"/><ellipse cx="-6.5" cy="-1.5" rx="2.4" ry="2.9" fill="#3B3330"/></g>
<g id="coHay"><ellipse cx="0" cy="5" rx="9" ry="2.4" fill="#5a3d10" opacity=".25"/><path d="M-8 4Q-8-8 0-9Q8-8 8 4Z" fill="#D49A2F"/><path d="M-5 0Q0-4 5 0M-6 3Q0-1 6 3" stroke="#B5801F" stroke-width="1" fill="none"/></g>
<symbol id="coT0" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="#5E8C4F"/><path d="M-50 6C-30-4-10 14 10 4S40-2 50 8V50H-50Z" fill="#557F47"/><use href="#coTree" x="-20" y="-28"/><use href="#coTree" x="3" y="-33"/><use href="#coTree" x="23" y="-21"/><use href="#coTree" x="-33" y="-2"/><use href="#coTree" x="31" y="3"/><use href="#coTree" x="-22" y="22"/><use href="#coTree" x="3" y="29"/><use href="#coTree" x="23" y="23"/></g></symbol>
<symbol id="coT1" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="#C8744A"/><ellipse cx="-17" cy="-22" rx="19" ry="9" fill="#B6633B"/><ellipse cx="22" cy="18" rx="21" ry="10" fill="#B6633B"/><ellipse cx="-20" cy="22" rx="12" ry="6" fill="#8F4325"/><ellipse cx="-20" cy="21" rx="9" ry="4" fill="#A44E2C"/><g transform="translate(16 -26)" fill="#9B4123" stroke="#EDB896" stroke-width=".7"><rect x="-10" y="6" width="9.5" height="4.5" rx="1"/><rect x=".5" y="6" width="9.5" height="4.5" rx="1"/><rect x="-5" y="1" width="9.5" height="4.5" rx="1"/><rect x="-8" y="-4" width="8" height="4.5" rx="1"/><rect x="1" y="-4" width="8" height="4.5" rx="1"/></g></g></symbol>
<symbol id="coT2" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="#A9CB6F"/><path d="M-32-8l2-5 2 5M10-32l2-5 2 5M26 0l2-5 2 5M-10 32l2-5 2 5M-36 14l2-5 2 5M14 34l2-5 2 5" stroke="#84AC50" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-44-12L-12-36M-38-16l0-6M-28-23l0-6M-18-30l0-6" stroke="#8A6A45" stroke-width="2" stroke-linecap="round"/><g class="co-sh"><use href="#coSheep" x="-18" y="-16"/></g><use href="#coSheep" x="20" y="-24"/><g class="co-sh b"><use href="#coSheep" x="-24" y="20"/></g><use href="#coSheep" x="24" y="16"/></g></symbol>
<symbol id="coT3" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="url(#coWh)"/><use href="#coHay" x="-22" y="-20"/><use href="#coHay" x="24" y="22"/><use href="#coHay" x="-26" y="24"/></g></symbol>
<symbol id="coT4" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="#9298A2"/><path d="M-38 6L-17-30Q-15-33-13-30L8 6Z" fill="#767C88"/><path d="M-15-31L-13-30L8 6L-5 6Z" fill="#636874"/><path d="M-20-24L-16-31Q-15-33-13-30L-9-24L-12-26L-15-23L-17-26Z" fill="#EEF0F3"/><path d="M6-2L21-32Q23-35 25-32L42-2Z" fill="#7D8491"/><path d="M23-33L25-32L42-2L31-2Z" fill="#666C78"/><path d="M-12 44L10 12Q12 9 14 12L36 44Z" fill="#737985"/><path d="M-28 22l6-3 4 4M24 28l5-4 3 3M-4 -6l5-3 3 3" stroke="#C3D3E6" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-34 36v-6a5 5 0 0 1 10 0v6z" fill="#3A3530"/></g></symbol>
<symbol id="coT5" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="#E6D2A2"/><path d="M-50-8C-30-18-10-4 10-12S40-20 50-12M-50 24C-30 14-10 28 10 20S40 12 50 20" stroke="#D5BB83" stroke-width="3" fill="none"/><path d="M17 8V-14a3.5 3.5 0 0 1 7 0V8Z" fill="#7A9A5C"/><path d="M17-4h-4a3 3 0 0 1-3-3v-5a2.5 2.5 0 0 1 5 0v3h2M24-8h3v-4a2.5 2.5 0 0 1 5 0v5a3 3 0 0 1-3 3h-5" fill="#7A9A5C"/><ellipse cx="-24" cy="-26" rx="5" ry="3" fill="#C9B184"/><ellipse cx="-30" cy="30" rx="6" ry="3.4" fill="#C9B184"/></g></symbol>
<symbol id="coT6" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="#3B8C9A"/><path d="M-30-10q5-4 10 0t10 0M8 18q5-4 10 0t10 0" stroke="#8CCAD2" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></g></symbol>
<symbol id="coT7" viewBox="-50 -50 100 100"><g clip-path="url(#coHx)"><rect x="-50" y="-50" width="100" height="100" fill="#B9A47A"/><path d="M-40 10L-14-24L12 10Z" fill="#9C8760"/><path d="M0 30L22-6L46 30Z" fill="#8E7A55"/><g fill="#E7B93A" stroke="#9A6E12" stroke-width="1"><path d="M-22 22l5-4 6 2-1 5-7 1z"/><path d="M14-20l4-3 5 2-1 4-6 1z"/><path d="M-6 0l4-3 5 2-1 4-6 1z"/></g></g></symbol>
</defs>`;
// ---------- piezas ----------
function piece(x,y,u,k,w,cls){const city=w=='u',d=city?'M-12 7V-3l6-6 6 6v-1h2v-8l5-4 5 4V7Z':'M-8 6V-3l8-7 8 7V6Z',sh=city?'M7-16L12-12V7H7Z':'M0-10L8-3V6H0Z';
 return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(u*100)/100})"><g class="${cls||''}"><ellipse cy="7" rx="${city?14:10}" ry="3" fill="#000" opacity=".25"/><path d="${d}" fill="${pc(k)}" stroke="${pd(k)}" stroke-width="1.6" stroke-linejoin="round"/><path d="${sh}" fill="#000" opacity=".14"/></g></g>`}
function road(A,B,k,cls){const f=.17,a=[A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f],b=[B[0]+(A[0]-B[0])*f,B[1]+(A[1]-B[1])*f];
 return `<g class="${cls||''}"><line x1="${f1(a[0])}" y1="${f1(a[1]+2)}" x2="${f1(b[0])}" y2="${f1(b[1]+2)}" stroke="${pd(k)}" stroke-width="${f1(U*.24)}" stroke-linecap="round"/><line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${pc(k)}" stroke-width="${f1(U*.15)}" stroke-linecap="round"/></g>`}
const robber=(x,y,u)=>`<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(u*100)/100})"><g class="co-rob"><ellipse cy="0" rx="9" ry="3" fill="#000" opacity=".3"/><path d="M-7 0C-8-8-6-13-3-15C-6-18-5-24 0-24C5-24 6-18 3-15C6-13 8-8 7 0Z" fill="#2A221E" stroke="#120D0A" stroke-width="1"/><path d="M-4-19Q0-21 4-19" stroke="#5C4C42" stroke-width="1.4" fill="none"/></g></g>`;
function token(n,ring,col){if(!n)return '';const red=n==6||n==8,R=U,r=R*.34,c=red?'#B3301C':'#3A2416';let s='';
 if(ring)s+=`<circle r="${f1(r+R*.07)}" fill="none" stroke="${col}" stroke-width="${f1(R*.065)}"/>`+(ring>1?`<circle r="${f1(r+R*.16)}" fill="none" stroke="${col}" stroke-width="${f1(R*.05)}"/>`:'');
 s+=`<circle r="${f1(r)}" fill="#F6EAD2" stroke="#C7AE84" stroke-width="${f1(R*.035)}"/><text y="${f1(R*.08)}" text-anchor="middle" font-size="${f1(R*.34)}" font-weight="900" fill="${c}" ${FONT}>${n}</text>`;
 const p=D.PIP(n),sp=R*.075;for(let i=0;i<p;i++)s+=`<circle cx="${f1((i-(p-1)/2)*sp)}" cy="${f1(R*.2)}" r="1.7" fill="${c}"/>`;return s}
// ---------- estado ----------
let root,svg,cam,gT,gP,gS,shown=false,bkey='',BB={x:0,y:0,w:1,h:1},ins={t:0,r:0,b:0,l:0},prev=null,spots=null,G0=null,me0=-1;
const vw={x:0,y:0,k:1},ptr=new Map();let drag=null,pinch=null,base=1,rollT=0;
const W=()=>innerWidth,H=()=>innerHeight;
const hc=h=>[h.x*U,h.y*U];
function mk(){root=document.createElement('div');root.id='co2d';root.className='co2d-capa';root.setAttribute('aria-hidden','true');
 root.innerHTML=`<svg xmlns="${NS}">${DEFS}<g id="coCam"><g id="coT"></g><g id="coP"></g><g id="coS"></g></g></svg>`;document.body.appendChild(root);
 svg=root.firstChild;cam=svg.querySelector('#coCam');gT=svg.querySelector('#coT');gP=svg.querySelector('#coP');gS=svg.querySelector('#coS');
 svg.addEventListener('pointerdown',down);addEventListener('pointermove',move);addEventListener('pointerup',up);addEventListener('pointercancel',up);
 svg.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0016))},{passive:false});
 addEventListener('resize',()=>{if(shown)apply()})}
// ---------- tablero fijo (cambia solo si cambia la isla) ----------
function hull(P){P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),L=[],R=[];
 for(const p of P){while(L.length>1&&cr(L[L.length-2],L[L.length-1],p)<=0)L.pop();L.push(p)}
 for(let i=P.length-1;i>=0;i--){const p=P[i];while(R.length>1&&cr(R[R.length-2],R[R.length-1],p)<=0)R.pop();R.push(p)}return L.slice(0,-1).concat(R.slice(0,-1))}
function tiles(G){const g=D.geo(G.hx),pts=[];g.V.forEach(v=>pts.push([v.x*U,v.y*U]));const hl=hull(pts),poly=hl.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
 const xs=hl.map(p=>p[0]),ys=hl.map(p=>p[1]),m=U*1.25;BB={x:Math.min(...xs)-m,y:Math.min(...ys)-m,w:Math.max(...xs)-Math.min(...xs)+2*m,h:Math.max(...ys)-Math.min(...ys)+2*m};
 let s=`<g class="co-mar"><polygon points="${poly}" transform="translate(0 ${f1(U*.22)})" fill="#120B07" opacity=".3" stroke="#120B07" stroke-width="${f1(U*1.9)}" stroke-linejoin="round"/>
 <polygon points="${poly}" fill="#8E5A32" stroke="#8E5A32" stroke-width="${f1(U*1.85)}" stroke-linejoin="round"/><polygon points="${poly}" fill="#3B8C9A" stroke="#3B8C9A" stroke-width="${f1(U*1.45)}" stroke-linejoin="round"/>`;
 const cx=g.H.reduce((a,h)=>a+h.x,0)/g.H.length*U,cy=g.H.reduce((a,h)=>a+h.y,0)/g.H.length*U;
 hl.forEach((p,i)=>{if(i%2)return;const dx=p[0]-cx,dy=p[1]-cy,l=Math.hypot(dx,dy)||1,x=p[0]+dx/l*U*.42,y=p[1]+dy/l*U*.42,w=U*.2;
  s+=`<path class="co-ola" style="--d:${(i*.37%3).toFixed(2)}s" d="M${f1(x-w)} ${f1(y)}q${f1(w/2)} ${f1(-w*.45)} ${f1(w)} 0t${f1(w)} 0" fill="none" stroke="#8CCAD2" stroke-width="${f1(U*.05)}" stroke-linecap="round" opacity=".7"/>`});
 s+='</g>';
 // puertos: dos muelles desde la orilla, un barquito y la tasa
 G.ports.forEach((p,i)=>{const E=g.E[p.e],h=g.H[p.h],ex=E.x*U,ey=E.y*U,ux=(ex-h.x*U),uy=(ey-h.y*U),l=Math.hypot(ux,uy)||1,nx=ux/l,ny=uy/l;
  E.v.forEach(v=>{const a=[g.V[v].x*U,g.V[v].y*U],b=[a[0]+(ex-a[0])*.25,a[1]+(ey-a[1])*.25];s+=`<line x1="${f1(b[0])}" y1="${f1(b[1])}" x2="${f1(b[0]+nx*U*.42)}" y2="${f1(b[1]+ny*U*.42)}" stroke="#7A4A28" stroke-width="${f1(U*.1)}" stroke-linecap="round"/>`});
  const bx=ex+nx*U*.78,by=ey+ny*U*.78,u=U/30,w=U*1.1,hh=U*.46,ly=by-U*.62;
  s+=`<g transform="translate(${f1(bx)} ${f1(by)}) scale(${f1(u*100)/100})"><g class="co-bote" style="--d:${(i*.43%2).toFixed(2)}s"><ellipse cy="4" rx="11" ry="2.6" fill="#1F5A63" opacity=".5"/><path d="M-10 0h20l-4 5h-12z" fill="#6B3F22"/><path d="M1-1V-15L10-3Z" fill="#F4EBDA"/><path d="M-1-1V-12L-8-3Z" fill="#E6D9C2"/></g></g>`;
  s+=`<g transform="translate(${f1(bx)} ${f1(ly)})"><rect x="${f1(-w/2)}" y="${f1(-hh/2)}" width="${f1(w)}" height="${f1(hh)}" rx="${f1(hh/2)}" fill="#FDF6E9" stroke="#7A4A28" stroke-width="${f1(U*.04)}"/>`
   +(p.r<0?`<text y="${f1(hh*.3)}" text-anchor="middle" font-size="${f1(U*.3)}" font-weight="900" fill="#3A2416" ${FONT}>3:1</text>`:`<circle cx="${f1(-w/2+hh/2)}" r="${f1(hh*.3)}" fill="${RCOL[p.r]}" stroke="#3A2416" stroke-opacity=".4"/><text x="${f1(hh*.25)}" y="${f1(hh*.3)}" text-anchor="middle" font-size="${f1(U*.3)}" font-weight="900" fill="#3A2416" ${FONT}>2:1</text>`)+'</g>'});
 // terrenos de arriba hacia abajo; entran cayendo desde el centro hacia fuera
 const ord=G.hx.map((x,i)=>i).sort((a,b)=>g.H[a].y-g.H[b].y||g.H[a].x-g.H[b].x);
 ord.forEach(i=>{const h=g.H[i],[x,y]=hc(h),dl=Math.round(Math.hypot(h.x,h.y)*70+120);
  s+=`<g transform="translate(${f1(x)} ${f1(y)})"><g class="co-t" data-h="${i}" style="--d:${dl}ms"><use href="#coT${G.hx[i].t}" x="${-U}" y="${-U}" width="${2*U}" height="${2*U}"/><g class="co-tk"></g></g></g>`});
 gT.innerHTML=s}
// ---------- lo que cambia: fichas con anillo, caminos, poblados, ciudades, ladrón, lugares válidos ----------
function pieces(G,me,o){const g=D.geo(G.hx),u=U*.034,col=o.col||pc(Math.max(0,me));
 const ring=G.hx.map(()=>0);if(me>=0)G.vo.forEach((k,v)=>{if(k===me)g.V[v].h.forEach(h=>ring[h]=Math.max(ring[h],G.vt[v]=='u'?2:1))});
 gT.querySelectorAll('.co-t').forEach(e=>{const i=+e.dataset.h,x=G.hx[i],key=x.n+'|'+ring[i]+'|'+(G.rob===i);if(e.dataset.k===key)return;e.dataset.k=key;
  e.querySelector('.co-tk').innerHTML=token(x.n,ring[i],col)+(G.rob===i?`<polygon points="41.6,-24 41.6,24 0,48 -41.6,24 -41.6,-24 0,-48" transform="scale(${f1(U/50*100)/100})" fill="#241C18" opacity=".38"/>`:'')});
 const nw=(a,b,i)=>prev&&a&&(prev[b][i]!==a[i]),P=prev;let s='';
 G.eo.forEach((k,e)=>{if(k<0)return;const E=g.E[e],A=[g.V[E.v[0]].x*U,g.V[E.v[0]].y*U],B=[g.V[E.v[1]].x*U,g.V[E.v[1]].y*U];s+=road(A,B,k,P&&P.eo[e]!==k?'co-drop':'')});
 const vs=[];G.vo.forEach((k,v)=>{if(k>=0)vs.push(v)});vs.sort((a,b)=>g.V[a].y-g.V[b].y);
 vs.forEach(v=>{const k=G.vo[v];s+=piece(g.V[v].x*U,g.V[v].y*U+u*2,u*(G.vt[v]=='u'?1.05:1),k,G.vt[v],P&&(P.vo[v]!==k||P.vt[v]!==G.vt[v])?'co-drop':'')});
 if(G.rob>=0&&G.hx[G.rob]){const h=g.H[G.rob],[x,y]=hc(h);s+=`<g class="${P&&P.rob!==G.rob?'co-drop':''}">`+robber(G.hx[G.rob].n?x-U*.5:x,y+U*.14,U/26)+'</g>'}
 gP.innerHTML=s;prev={eo:G.eo.slice(),vo:G.vo.slice(),vt:G.vt.slice(),rob:G.rob};
 // lugares válidos: se levantan como pegs con sus puntitos; el elegido muestra la pieza fantasma
 spots=o.spots&&o.spots.L&&o.spots.L.length?o.spots:null;root.classList.toggle('pick',!!spots);let t='';
 if(spots){const w=spots.w,gh=o.ghost&&o.ghost.at;spots.L.forEach((id,j)=>{const dl=`style="--d:${Math.min(j*25,400)}ms"`;
  if(w=='h'){const[x,y]=hc(g.H[id]);t+=`<g transform="translate(${f1(x)} ${f1(y)})"><g class="co-peg h${gh===id?' on':''}" ${dl}><circle r="${f1(U*.62)}" fill="rgba(253,246,233,.22)" stroke="#FDF6E9" stroke-width="${f1(U*.06)}" stroke-dasharray="${f1(U*.16)} ${f1(U*.1)}"/></g></g>`}
  else if(w=='c'){const E=g.E[id],A=g.V[E.v[0]],B=g.V[E.v[1]],a=Math.atan2(B.y-A.y,B.x-A.x)*180/Math.PI;
   t+=`<g transform="translate(${f1(E.x*U)} ${f1(E.y*U)}) rotate(${f1(a)})"><g class="co-peg${gh===id?' on':''}" ${dl}><rect x="${f1(-U*.36)}" y="${f1(-U*.15)}" width="${f1(U*.72)}" height="${f1(U*.3)}" rx="${f1(U*.15)}" fill="#FDF6E9" stroke="#C2512A" stroke-width="${f1(U*.08)}"/></g></g>`}
  else{const V=g.V[id],dots=V.h.reduce((a,h)=>a+D.PIP(G.hx[h].n),0);
   t+=`<g transform="translate(${f1(V.x*U)} ${f1(V.y*U)})"><g class="co-peg${gh===id?' on':''}" ${dl}><circle cy="${f1(U*.06)}" r="${f1(U*.3)}" fill="#000" opacity=".25"/><circle r="${f1(U*.3)}" fill="#FDF6E9" stroke="#C2512A" stroke-width="${f1(U*.05)}"/><text y="${f1(U*.1)}" text-anchor="middle" font-size="${f1(U*.27)}" font-weight="900" fill="#3A2416" ${FONT}>${dots||''}</text></g></g>`}});
  if(o.ghost&&o.ghost.at!=null){const id=o.ghost.at,w2=o.ghost.w;
   if(w2=='c'){const E=g.E[id];t+=road([g.V[E.v[0]].x*U,g.V[E.v[0]].y*U],[g.V[E.v[1]].x*U,g.V[E.v[1]].y*U],me,'co-gh')}
   else if(w2=='p'||w2=='u')t+=piece(g.V[id].x*U,g.V[id].y*U+u*2,u*1.1,me,w2,'co-gh')
   else if(w2=='h'){const[x,y]=hc(g.H[id]);t+=`<g opacity=".7">`+robber(G.hx[id].n?x-U*.5:x,y+U*.14,U/26)+'</g>'}}}
 gS.innerHTML=t}
// ---------- cámara: encaja el tablero en el hueco que deja la interfaz; zoom y arrastre encima ----------
function apply(){const aw=Math.max(80,W()-ins.l-ins.r),ah=Math.max(80,H()-ins.t-ins.b);base=Math.min(aw/BB.w,ah/BB.h);
 const k=base*vw.k,mx=Math.max(0,(BB.w*k-aw)/2+aw*.25),my=Math.max(0,(BB.h*k-ah)/2+ah*.25);vw.x=Math.max(-mx,Math.min(mx,vw.x));vw.y=Math.max(-my,Math.min(my,vw.y));
 const cx=ins.l+aw/2+vw.x,cy=ins.t+ah/2+vw.y;cam.setAttribute('transform',`translate(${f1(cx)} ${f1(cy)}) scale(${k.toFixed(4)}) translate(${f1(-(BB.x+BB.w/2))} ${f1(-(BB.y+BB.h/2))})`)}
const ctr=()=>{const aw=Math.max(80,W()-ins.l-ins.r),ah=Math.max(80,H()-ins.t-ins.b);return [ins.l+aw/2,ins.t+ah/2]};
function toW(x,y){const[cx,cy]=ctr(),k=base*vw.k;return [(x-cx-vw.x)/k+BB.x+BB.w/2,(y-cy-vw.y)/k+BB.y+BB.h/2]}
function toS(x,y){const[cx,cy]=ctr(),k=base*vw.k;return {x:cx+vw.x+(x-BB.x-BB.w/2)*k,y:cy+vw.y+(y-BB.y-BB.h/2)*k}}
function zoomAt(x,y,f){const k0=vw.k,k1=Math.max(1,Math.min(3.2,k0*f));if(k1===k0)return;const[cx,cy]=ctr(),r=k1/k0;vw.x=x-cx-r*(x-cx-vw.x);vw.y=y-cy-r*(y-cy-vw.y);vw.k=k1;if(k1===1){vw.x=0;vw.y=0}apply()}
function down(e){ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});try{svg.setPointerCapture(e.pointerId)}catch(_){}
 if(ptr.size==1)drag={x:e.clientX,y:e.clientY,vx:vw.x,vy:vw.y,mv:false,t:Date.now()};
 if(ptr.size==2){const[a,b]=[...ptr.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,k:vw.k};if(drag)drag.mv=true}}
function move(e){if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&ptr.size>=2){const[a,b]=[...ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y);zoomAt((a.x+b.x)/2,(a.y+b.y)/2,pinch.k*d/pinch.d/vw.k);return}
 if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.mv&&Math.hypot(dx,dy)>8)drag.mv=true;if(drag.mv&&vw.k>1.001){vw.x=drag.vx+dx;vw.y=drag.vy+dy;apply()}}}
function up(e){if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);if(ptr.size<2)pinch=null;
 if(!ptr.size&&drag){const d=drag;drag=null;if(!d.mv)tap(e.clientX,e.clientY)}}
function tap(x,y){if(!spots||!G0)return;const g=D.geo(G0.hx),[wx,wy]=toW(x,y),k=base*vw.k;let best=-1,bd=1e9;
 spots.L.forEach(id=>{const p=spots.w=='h'?g.H[id]:spots.w=='c'?g.E[id]:g.V[id],d=Math.hypot(p.x*U-wx,p.y*U-wy);if(d<bd){bd=d;best=id}});
 const lim=Math.max(30/k,U*(spots.w=='h'?.95:.55));if(best>=0&&bd<=lim&&CO2.onTap)CO2.onTap(spots.w,best)}
// ---------- API ----------
const CO2=window.CO2={onTap:null,
 show(on){if(on&&!root)mk();if(!root)return;if(on===shown)return;shown=on;
  if(on){root.classList.remove('sale');root.classList.add('on');root.style.display=''}
  else{root.classList.add('sale');root.classList.remove('on');setTimeout(()=>{if(!shown){root.style.display='none';bkey='';prev=null;gT.innerHTML='';gP.innerHTML='';gS.innerHTML=''}},380)}},
 sync(G,me,o){if(!root)mk();G0=G;me0=me;const key=G.hx.map(h=>h.q+','+h.r+','+h.t).join(';')+'|'+G.ports.map(p=>p.e+':'+p.r).join(',');
  if(key!==bkey){bkey=key;prev=null;tiles(G);vw.k=1;vw.x=0;vw.y=0;apply()}pieces(G,me,o||{})},
 fit(i){if(i.t===ins.t&&i.r===ins.r&&i.b===ins.b&&i.l===ins.l)return;ins=i;if(root)apply()},
 pos(t,id){if(!G0)return null;const g=D.geo(G0.hx),p=t=='h'?g.H[id]:t=='e'?g.E[id]:g.V[id];return p?toS(p.x*U,p.y*U):null},
 // la tirada: los terrenos que pagan se levantan, los demás se apagan; el del ladrón tiembla y se queda gris
 roll(s){if(!root||!G0)return;clearTimeout(rollT);const els=gT.querySelectorAll('.co-t');
  els.forEach(e=>{const x=G0.hx[+e.dataset.h],hit=x.n===s&&D.prod(x.t);e.classList.remove('hit','dim','rob');void e.getBBox;
   e.classList.add(hit?(+e.dataset.h===G0.rob?'rob':'hit'):'dim')});
  rollT=setTimeout(()=>els.forEach(e=>e.classList.remove('hit','dim','rob')),2300)},
 mid(){const[x,y]=ctr();return {x:x+vw.x,y:y+vw.y}},
 reset(){vw.k=1;vw.x=0;vw.y=0;apply()},
 get zoom(){return vw.k}};
})();
