// Haciendas de Yucatán 2D: tablero de hexágonos en SVG con zoom (pellizco, rueda, botones) y arrastre, como c_merida2d.js.
// Lo maneja c_haciendasui.js como window.H2 (show, layout, theme, sync, cam). Tocar un lugar iluminado llama HZU.tap(tipo, id). NO cambia reglas.
(function(){
const D=window.HACD;if(!D){console.warn('Haciendas 2D: falta haciendas_data.js');return}
const U=100,KMAX=4,TC=['#79a96a','#e8c24a','#a7a49a','#df9234','#eef1ee','#2fb8c6'],TS=['#3f6e37','#a47d16','#6c695f','#9a5a12','#9aa6a4','#11707c'];
let root,wrap,svg,gS,gD,shown=false,SW=0,SH=0,BW=1,BH=1,VB=[0,0,1,1],ins={t:0,r:0,b:0,l:0},raf=0,G0=null,skey='',lastTap=0,rn=-1;
const vw={x:0,y:0,k:1},vt={x:0,y:0,k:1},ptr=new Map();
const P=(x,y)=>(x*U).toFixed(1)+','+(y*U).toFixed(1),pc=k=>D.PCOL[k%D.PCOL.length];
window.H2={ok:()=>true,
 show(on){if(on)build();if(shown===on)return;shown=on;if(root)root.style.display=on?'block':'none';if(on)kick()},
 layout(i){ins=i;fit();clampV();Object.assign(vw,vt);apply()},
 theme(t){if(root)root.dataset.t=t},
 sync(G,hl){G0=G;const g=D.geo(G.bn),k=G.bn+':'+G.hx.map(h=>h.t+'.'+h.n).join(',');if(k!==skey){skey=k;statics(G,g);fit();home()}
  gD.innerHTML=dyn(G,g,hl||{});if(G.rn!==rn){if(rn>=0&&G.dice[0]&&G.dice[0]+G.dice[1]!==7)flash(G,G.dice[0]+G.dice[1]);rn=G.rn}},
 cam(c){if(c=='home')home();else if(c=='zi')zoomAt(cx(),cy(),vt.k*1.4);else if(c=='zo')zoomAt(cx(),cy(),vt.k/1.4)}};
function build(){if(root)return;root=document.createElement('div');root.id='h2root';root.dataset.t='claro';
 root.innerHTML=`<div class="h2w"><svg xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="h2sh" cx="50%" cy="38%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><g class="s"></g><g class="d"></g></svg></div>`;
 document.body.appendChild(root);wrap=root.firstChild;svg=wrap.firstChild;gS=svg.querySelector('g.s');gD=svg.querySelector('g.d');
 root.addEventListener('pointerdown',pDown);root.addEventListener('pointermove',pMove);root.addEventListener('pointerup',pUp);root.addEventListener('pointercancel',e=>ptr.delete(e.pointerId));
 root.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,vt.k*Math.exp(-e.deltaY*.0018))},{passive:false})}
// ---- capa fija: mar, hexágonos, fichas con números y puntitos, puertos con muelles ----
const poly=(g,h,s=1)=>{const H=g.H[h];return H.v.map(v=>P(H.x+(g.V[v].x-H.x)*s,H.y+(g.V[v].y-H.y)*s)).join(' ')};
function statics(G,g){let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;g.V.forEach(v=>{mnx=Math.min(mnx,v.x);mxx=Math.max(mxx,v.x);mny=Math.min(mny,v.y);mxy=Math.max(mxy,v.y)});
 const m=1.15;VB=[(mnx-m)*U,(mny-m)*U,(mxx-mnx+2*m)*U,(mxy-mny+2*m)*U];svg.setAttribute('viewBox',VB.join(' '));BW=VB[2];BH=VB[3];
 const SQ=Math.sqrt(3),sea=new Map();g.H.forEach(H=>D.DIR.forEach(([a,b],k)=>{const q=H.q+a,r=H.r+b,key=q+','+r;if(g.idx[key]==null&&!sea.has(key))sea.set(key,[SQ*(q+r/2),1.5*r])}));
 let h='';sea.forEach(([x,y])=>{h+=`<polygon class="sea" points="${[0,1,2,3,4,5].map(c=>{const a=(60*c-30)*Math.PI/180;return P(x+Math.cos(a)*1.01,y+Math.sin(a)*1.01)}).join(' ')}"/>`});
 G.ports.forEach(p=>{const E=g.E[p.e],H=g.H[p.h],a=60*p.k*Math.PI/180,px=E.x+Math.cos(a)*.62,py=E.y+Math.sin(a)*.62;
  E.v.forEach(v=>{h+=`<line class="dock" x1="${(g.V[v].x*U).toFixed(1)}" y1="${(g.V[v].y*U).toFixed(1)}" x2="${(px*U).toFixed(1)}" y2="${(py*U).toFixed(1)}"/>`});
  h+=`<g transform="translate(${P(px,py)})"><circle class="port" r="${.3*U}"/>${p.r<0?`<text class="pt" y="${.1*U}">3:1</text>`:`<text class="pi" y="${-.02*U}">${D.ICO[p.r]}</text><text class="pt s" y="${.2*U}">2:1</text>`}
   <text class="pn" y="${.47*U}">${p.nm}</text></g>`});
 G.hx.forEach((x,i)=>{const H=g.H[i];h+=`<g id="h2h${i}" class="hx t${x.t}"><polygon points="${poly(g,i,.97)}" fill="${TC[x.t]}" stroke="${TS[x.t]}" stroke-width="${.05*U}"/><polygon points="${poly(g,i,.97)}" fill="url(#h2sh)"/>
  <text class="ti" x="${(H.x*U).toFixed(1)}" y="${((H.y-.42)*U).toFixed(1)}">${D.ICO[x.t]}</text>`;
  if(x.n){const red=x.n==6||x.n==8,pp=D.PIP(x.n),cx0=H.x*U,cy0=(H.y+.12)*U;h+=`<circle class="tk" cx="${cx0}" cy="${cy0}" r="${.31*U}"/><text class="tn${red?' red':''}" x="${cx0}" y="${cy0+.06*U}">${x.n}</text>`;
   for(let j=0;j<pp;j++)h+=`<circle class="pp${red?' red':''}" cx="${(cx0+(j-(pp-1)/2)*.075*U).toFixed(1)}" cy="${(cy0+.19*U).toFixed(1)}" r="${.026*U}"/>`}
  h+='</g>'});
 gS.innerHTML=h}
// ---- capa que cambia: sacbés, ranchos, haciendas, huracán, protecciones y lugares iluminados ----
const HOUSE='M-.22,.17 L-.22,-.04 L0,-.25 L.22,-.04 L.22,.17 Z',HAC='M-.34,.19 L-.34,-.06 L-.14,-.06 L-.14,-.28 L0,-.41 L.14,-.28 L.14,-.06 L.34,-.06 L.34,.19 Z';
const shp=(d,x,y,c)=>`<path class="pc" d="${d.replace(/-?\d*\.?\d+/g,n=>(+n*U).toFixed(1))}" transform="translate(${P(x,y)})" fill="${c}"/>`;
function dyn(G,g,hl){let h='';const seg=(e,sh)=>{const [a,b]=g.E[e].v.map(v=>g.V[v]),s=sh||.16;return {x1:(a.x+(b.x-a.x)*s)*U,y1:(a.y+(b.y-a.y)*s)*U,x2:(b.x+(a.x-b.x)*s)*U,y2:(b.y+(a.y-b.y)*s)*U}};
 const L=o=>`x1="${o.x1.toFixed(1)}" y1="${o.y1.toFixed(1)}" x2="${o.x2.toFixed(1)}" y2="${o.y2.toFixed(1)}"`;
 G.eo.forEach((o,e)=>{if(o<0)return;const s=L(seg(e));h+=`<line class="rd0" ${s}/><line class="rd" ${s} stroke="${pc(o)}"/>`});
 const H=g.H[G.hur];h+=`<g transform="translate(${P(H.x,H.y+.12)})"><circle class="hd" r="${.4*U}"/><text class="hur" y="${.2*U}">🌀</text></g>`;
 (G.prot||[]).forEach(p=>{const X=g.H[p.h];h+=`<text class="pr" x="${((X.x+.42)*U).toFixed(1)}" y="${((X.y-.2)*U).toFixed(1)}">🛡️</text>`});
 (hl.h||[]).forEach(i=>{h+=`<polygon class="hl" data-h="${i}" points="${poly(g,i,.9)}"/>`});
 G.vo.forEach((o,v)=>{if(o<0)return;const V=g.V[v];h+=shp(G.vl[v]==2?HAC:HOUSE,V.x,V.y,pc(o))});
 (hl.e||[]).forEach(e=>{const s=L(seg(e,.2));h+=`<line class="he" ${s}/><line class="hit" data-e="${e}" ${s}/>`});
 (hl.v||[]).forEach(v=>{const V=g.V[v];h+=`<circle class="hv" data-v="${v}" cx="${(V.x*U).toFixed(1)}" cy="${(V.y*U).toFixed(1)}" r="${.17*U}"/>`});
 return h}
// los hexágonos que produjeron brillan un momento
function flash(G,n){G.hx.forEach((x,i)=>{if(x.n!==n||i===G.hur)return;const e=document.getElementById('h2h'+i);if(!e)return;e.classList.remove('hot');void e.getBBox();e.classList.add('hot');setTimeout(()=>e.classList.remove('hot'),1600)})}
// ---- cámara 2D: vw = dónde está, vt = adónde va (x,y en px de pantalla, k = zoom) ----
const visW=()=>Math.max(50,innerWidth-ins.l-ins.r),visH=()=>Math.max(50,innerHeight-ins.t-ins.b),cx=()=>ins.l+visW()/2,cy=()=>ins.t+visH()/2;
function fit(){if(!wrap)return;const s=Math.min(visW()/BW,visH()/BH)*.98,w=Math.round(BW*s),h=Math.round(BH*s);if(w===SW&&h===SH)return;
 const r=SW?w/SW:1;SW=w;SH=h;wrap.style.width=w+'px';wrap.style.height=h+'px';vt.x*=r;vt.y*=r}
function clampV(){vt.k=Math.max(1,Math.min(KMAX,vt.k));const mx=Math.max(0,(SW*vt.k-visW())/2)+SW*.15,my=Math.max(0,(SH*vt.k-visH())/2)+SH*.15;
 vt.x=Math.max(-mx,Math.min(mx,vt.x));vt.y=Math.max(-my,Math.min(my,vt.y))}
function apply(){if(wrap)wrap.style.transform=`translate(${cx()-SW*vw.k/2+vw.x}px,${cy()-SH*vw.k/2+vw.y}px) scale(${vw.k})`}
function zoomAt(px,py,k){k=Math.max(1,Math.min(KMAX,k));const X=cx()-SW*vt.k/2+vt.x,Y=cy()-SH*vt.k/2+vt.y,bx=(px-X)/vt.k,by=(py-Y)/vt.k;
 vt.k=k;vt.x=px-bx*k-cx()+SW*k/2;vt.y=py-by*k-cy()+SH*k/2;clampV();kick()}
function home(){Object.assign(vt,{x:0,y:0,k:1});kick()}
// ---- dedos y ratón: 1 dedo arrastra, 2 dedos pellizcan; tocar un lugar iluminado lo elige; doble toque centra ----
function pDown(e){ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,mv:false});try{root.setPointerCapture(e.pointerId)}catch(_){}
 if(ptr.size==2){const [a,b]=[...ptr.values()];root._pin={d:Math.hypot(a.x-b.x,a.y-b.y)||1,k:vt.k,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,x:vt.x,y:vt.y}}}
function pMove(e){const p=ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;if(Math.hypot(p.x-p.x0,p.y-p.y0)>6)p.mv=true;
 if(ptr.size>=2&&root._pin){const [a,b]=[...ptr.values()],Q=root._pin,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,k=Math.max(1,Math.min(KMAX,Q.k*Math.hypot(a.x-b.x,a.y-b.y)/Q.d));
  const X=cx()-SW*Q.k/2+Q.x,Y=cy()-SH*Q.k/2+Q.y,bx=(Q.mx-X)/Q.k,by=(Q.my-Y)/Q.k;vt.k=k;vt.x=mx-bx*k-cx()+SW*k/2;vt.y=my-by*k-cy()+SH*k/2;clampV();Object.assign(vw,vt);apply();return}
 if(p.mv&&ptr.size==1){vt.x+=dx;vt.y+=dy;clampV();Object.assign(vw,vt);apply()}}
function pUp(e){const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(ptr.size<2)root._pin=null;if(!p||p.mv||ptr.size)return;
 const t=document.elementFromPoint(e.clientX,e.clientY),c=t&&t.closest&&t.closest('[data-v],[data-e],[data-h]');
 if(c&&window.HZU){const d=c.dataset;if(d.v!=null)HZU.tap('v',+d.v);else if(d.e!=null)HZU.tap('e',+d.e);else HZU.tap('h',+d.h);return}
 const now=performance.now();if(now-lastTap<320){home();lastTap=0}else lastTap=now}
function kick(){if(!raf&&shown)raf=requestAnimationFrame(loop)}
function loop(){raf=0;if(!shown)return;let busy=false;const f=ptr.size?1:.2;
 ['x','y','k'].forEach(q=>{const d=vt[q]-vw[q];if(Math.abs(d)>(q=='k'?1e-4:.3)){vw[q]+=d*f;busy=true}else vw[q]=vt[q]});apply();if(busy)kick()}
// ---- estilos ----
const css=document.createElement('style');css.textContent=`
#h2root{position:fixed;inset:0;z-index:1;display:none;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;
 --sea:#7cc4d8;--sea2:#5aaec6;--pg:radial-gradient(ellipse at 50% 40%,#e8f3f1 0%,#bcdcdc 80%);background:var(--pg);font-family:"Archivo",system-ui,sans-serif}
#h2root[data-t=oscuro]{--sea:#1d4a5c;--sea2:#173c4b;--pg:radial-gradient(ellipse at 50% 40%,#13232b 0%,#070d10 80%)}
.h2w{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}.h2w svg{width:100%;height:100%;display:block;overflow:visible}
#h2root .sea{fill:var(--sea);stroke:var(--sea2);stroke-width:4}
#h2root .dock{stroke:#7a5230;stroke-width:9;stroke-linecap:round}#h2root .port{fill:#fbf3df;stroke:#7a5230;stroke-width:5}
#h2root text{text-anchor:middle;font-family:inherit;pointer-events:none}#h2root .pt{font-size:20px;font-weight:800;fill:#4a3018}#h2root .pt.s{font-size:15px}#h2root .pi{font-size:22px}
#h2root .pn{font-size:13px;font-weight:700;fill:#164452;paint-order:stroke;stroke:rgba(255,255,255,.75);stroke-width:3px}#h2root[data-t=oscuro] .pn{fill:#cfe9ef;stroke:rgba(0,0,0,.6)}
#h2root .ti{font-size:34px;opacity:.9}#h2root .tk{fill:#fdf6e3;stroke:#7d6a45;stroke-width:3}#h2root .tn{font-size:30px;font-weight:800;fill:#2a2a2a}#h2root .red{fill:#c62828}#h2root .pp{fill:#2a2a2a}
#h2root .hx.hot polygon:first-child{animation:h2hot 1.5s ease-out}@keyframes h2hot{0%,40%{filter:brightness(1.45) drop-shadow(0 0 14px #fff6b0)}100%{filter:none}}
#h2root .rd0{stroke:#1b1b1b;stroke-width:21;stroke-linecap:round}#h2root .rd{stroke-width:13;stroke-linecap:round}
#h2root .pc{stroke:#1b1b1b;stroke-width:4;stroke-linejoin:round}
#h2root .hd{fill:rgba(40,60,80,.35)}#h2root .hur{font-size:62px;transform-box:fill-box;transform-origin:center;animation:h2spin 2.4s linear infinite}@keyframes h2spin{to{transform:rotate(-360deg)}}
#h2root .pr{font-size:26px}
#h2root .hl{fill:rgba(255,193,7,.22);stroke:#ffb300;stroke-width:8;animation:h2pl 1s ease-in-out infinite alternate;cursor:pointer}
#h2root .he{stroke:#ffb300;stroke-width:15;stroke-linecap:round;opacity:.9;animation:h2pl 1s ease-in-out infinite alternate}#h2root .hit{stroke:transparent;stroke-width:38;stroke-linecap:round;cursor:pointer}
#h2root .hv{fill:rgba(255,255,255,.92);stroke:#ffb300;stroke-width:6;animation:h2pl 1s ease-in-out infinite alternate;cursor:pointer}
@keyframes h2pl{from{opacity:.55}to{opacity:1}}`;
document.head.appendChild(css);
})();
