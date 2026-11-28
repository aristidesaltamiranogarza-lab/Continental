// Colonos: datos y reglas de lugar, iguales en servidor (require) y cliente (window.COLD). Reglas clásicas de la isla de 5 recursos.
// El tablero es una lista de hexágonos {q,r,t,n}: así un escenario (o una expansión con mar, oro o varias islas) es solo datos.
// Hexágonos de punta arriba en coordenadas axiales (q,r), y hacia abajo. Orilla k: normal a 60·k° (0 este, 1 sureste... 5 noreste).
// Esquina c a 60·c−30°; la orilla k une las esquinas k y k+1. Terreno t: 0 bosque · 1 cerro · 2 pasto · 3 campo · 4 monte · 5 desierto · 6 mar · 7 oro.
(function(root,f){const D=f();if(typeof module!=='undefined'&&module.exports)module.exports=D;else root.COLD=D})(this,function(){
const RES=['madera','ladrillo','lana','trigo','mineral'],TER=['bosque','cerro','pasto','campo','monte','desierto','mar','oro'];
const DES=5,MAR=6,DIR=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],SQ3=Math.sqrt(3);
// costos [madera, ladrillo, lana, trigo, mineral]: c camino · p poblado · u ciudad · d carta de desarrollo
const COST={c:[1,1,0,0,0],p:[1,1,1,1,0],u:[0,0,0,2,3],d:[0,0,1,1,1]};
// piezas: en 'o' orilla o 'e' esquina, cuántas tiene cada quien, puntos; sobre: pieza que reemplaza. Una expansión agrega aquí (barco...)
const PZ={c:{nm:'camino',en:'o',max:15,pts:0},p:{nm:'poblado',en:'e',max:5,pts:1},u:{nm:'ciudad',en:'e',max:4,pts:2,sobre:'p'}};
// cartas de desarrollo: k caballero · v punto · c construir caminos · a abundancia · m monopolio
const DEV={k:{nm:'Caballero'},v:{nm:'Punto'},c:{nm:'Construir caminos'},a:{nm:'Abundancia'},m:{nm:'Monopolio'}};
const PIP=n=>n?6-Math.abs(7-n):0,hot=n=>n==6||n==8;
// ---- formas ----
const radio=R=>{const L=[];for(let r=-R;r<=R;r++)for(let q=-R;q<=R;q++)if(Math.abs(q+r)<=R)L.push([q,r]);return L};
const filas30=()=>{const L=[];for(let r=-3;r<=3;r++)for(let q=Math.max(-3,-3-r);q<=Math.min(2,2-r);q++)L.push([q,r]);return L};
// ---- escenarios: forma, terrenos (cuántos de cada t), fichas de número, puertos (hex, orilla) y sus tipos (-1 = 3:1), banco y mazo ----
// fijo: tablero para la primera partida [q,r,t,n] y tipos de puerto en el mismo orden
const ESC={
 base:{nm:'Isla',jug:[3,4],forma:radio(2),ter:{0:4,1:3,2:4,3:4,4:3,5:1},
  num:[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],
  puertos:[[0,-2,4],[2,-2,5],[2,-1,0],[2,0,1],[0,2,1],[-1,2,2],[-2,2,3],[-2,0,3],[-1,-1,4]],tipos:[-1,-1,-1,-1,0,1,2,3,4],
  banco:19,mazo:{k:14,v:5,c:2,a:2,m:2},
  fijo:{hx:[[0,-2,2,6],[1,-2,0,5],[2,-2,1,10],[-1,-1,3,9],[0,-1,4,3],[1,-1,0,11],[2,-1,3,8],[-2,0,1,4],[-1,0,2,10],[0,0,5,0],
   [1,0,4,4],[2,0,0,9],[-2,1,0,8],[-1,1,2,11],[0,1,3,2],[1,1,1,3],[-2,2,4,5],[-1,2,2,12],[0,2,3,6]],tipos:[-1,1,-1,4,-1,2,-1,0,3]}},
 grande:{nm:'Isla grande',jug:[5,6],forma:filas30(),ter:{0:6,1:5,2:6,3:6,4:5,5:2},
  num:[2,2,3,3,3,4,4,4,5,5,5,6,6,6,8,8,8,9,9,9,10,10,10,11,11,11,12,12],
  puertos:11,tipos:[-1,-1,-1,-1,-1,0,1,2,3,4,2],banco:24,mazo:{k:20,v:5,c:3,a:3,m:3},sbp:true}};   // sbp: fase de construcción entre turnos (5–6)
const mazo=esc=>{const d=[],m=ESC[esc].mazo;for(const c in m)for(let i=0;i<m[c];i++)d.push(c);return d};
function shuf(a,rnd){rnd=rnd||Math.random;for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// ---- geometría desde la lista de hexágonos: H (v esquinas, e orillas, nb vecinos), V (h, v vecinas, e), E (v, h), coast ----
const GEO={};
function geo(hx){const key=hx.map(h=>h.q+','+h.r).join(';');if(GEO[key])return GEO[key];
 const idx={},H=[],V=[],E=[],vk={},ek={};hx.forEach((h,i)=>idx[h.q+','+h.r]=i);
 const vid=(x,y)=>{const k=Math.round(x*100)+','+Math.round(y*100);if(vk[k]==null){vk[k]=V.length;V.push({x:+x.toFixed(3),y:+y.toFixed(3),h:[],v:[],e:[]})}return vk[k]};
 hx.forEach(({q,r},i)=>{const x=SQ3*(q+r/2),y=1.5*r,h={q,r,x:+x.toFixed(3),y,v:[],e:[],nb:DIR.map(([a,b])=>idx[(q+a)+','+(r+b)]??-1)};
  for(let c=0;c<6;c++){const a=(60*c-30)*Math.PI/180,v=vid(x+Math.cos(a),y+Math.sin(a));h.v.push(v);V[v].h.push(i)}H.push(h)});
 H.forEach((h,i)=>{for(let k=0;k<6;k++){const a=h.v[k],b=h.v[(k+1)%6],ky=Math.min(a,b)+'-'+Math.max(a,b);
  if(ek[ky]==null){ek[ky]=E.length;E.push({v:[a,b],h:[],x:+((V[a].x+V[b].x)/2).toFixed(3),y:+((V[a].y+V[b].y)/2).toFixed(3)});V[a].e.push(ek[ky]);V[b].e.push(ek[ky]);V[a].v.push(b);V[b].v.push(a)}
  const e=ek[ky];h.e.push(e);E[e].h.push(i)}});
 const cx=H.reduce((s,h)=>s+h.x,0)/H.length,cy=H.reduce((s,h)=>s+h.y,0)/H.length,ang=e=>{let a=Math.atan2(E[e].y-cy,E[e].x-cx);return a<-Math.PI+1e-6?a+2*Math.PI:a};
 const coast=[];H.forEach((h,i)=>h.nb.forEach((b,k)=>{if(b<0)coast.push({h:i,k,e:h.e[k]})}));coast.sort((a,b)=>ang(a.e)-ang(b.e));
 return GEO[key]={H,V,E,coast,idx}}
const land=t=>t!==MAR,prod=t=>t<5;
// ---- tablero de un escenario: hx [{q,r,t,n}], ports [{e,h,k,r}] en orden por la costa, rob hex del ladrón ----
function board(esc,fijo,rnd){rnd=rnd||Math.random;const S=ESC[esc];let hx,tipos;
 if(fijo&&S.fijo){hx=S.fijo.hx.map(([q,r,t,n])=>({q,r,t,n}));tipos=S.fijo.tipos.slice()}
 else{const T=[];for(const t in S.ter)for(let i=0;i<S.ter[t];i++)T.push(+t);const g=geo(S.forma.map(([q,r])=>({q,r})));
  for(;;){const t=shuf(T.slice(),rnd),nums=shuf(S.num.slice(),rnd);let j=0;hx=S.forma.map(([q,r],i)=>({q,r,t:t[i],n:prod(t[i])?nums[j++]:0}));
   if(!hx.some((h,i)=>hot(h.n)&&g.H[i].nb.some(b=>b>=0&&hot(hx[b].n))))break}
  tipos=shuf(S.tipos.slice(),rnd)}
 const g=geo(hx);let pos;
 if(Array.isArray(S.puertos))pos=S.puertos.map(([q,r,k])=>{const h=g.idx[q+','+r];return {h,k,e:g.H[h].e[k]}});
 else{const L=g.coast.length,m=S.puertos,off=Math.floor(L/m/2);pos=Array.from({length:m},(_,i)=>Object.assign({},g.coast[(Math.round(i*L/m)+off)%L]))}
 const ports=pos.map((p,i)=>Object.assign(p,{r:tipos[i]})),o=e=>g.coast.findIndex(c=>c.e===e);ports.sort((a,b)=>o(a.e)-o(b.e));
 return {hx,ports,rob:hx.findIndex(h=>h.t==DES)}}
// ---- reglas de lugar (G: hx, vo dueño de esquina, vt pieza en esquina, eo dueño de orilla, et pieza en orilla, st, turn, sv) ----
const gG=G=>geo(G.hx);
function left(G,k){const n={};for(const w in PZ)n[w]=PZ[w].max;G.vt.forEach((t,v)=>{if(t&&G.vo[v]===k)n[t]--});G.et.forEach((t,e)=>{if(t&&G.eo[e]===k)n[t]--});return n}
// poblado: esquina libre que toca tierra, sin vecinos ocupados y, fuera del inicio, tocando un camino tuyo
function okV(G,k,v,setup){const V=gG(G).V[v];if(!V||G.vo[v]>=0||!V.h.some(h=>land(G.hx[h].t))||V.v.some(w=>G.vo[w]>=0))return false;
 return !!setup||V.e.some(e=>G.eo[e]===k)}
// camino: orilla libre que toca tierra y sale de tu red (pieza tuya en la esquina, o camino tuyo en una esquina sin pieza rival). at: debe tocar esa esquina
function okE(G,k,e,at){const g=gG(G),E=g.E[e];if(!E||G.eo[e]>=0||!E.h.some(h=>land(G.hx[h].t)))return false;if(at!=null)return E.v.includes(at);
 return E.v.some(v=>G.vo[v]===k||(G.vo[v]<0&&g.V[v].e.some(x=>x!==e&&G.eo[x]===k)))}
function spots(G,k,w){const g=gG(G),L=[];
 if(G.st=='setup'){if(G.turn!==k)return L;if(G.sv<0){if(w=='p')g.V.forEach((_,v)=>{if(okV(G,k,v,true))L.push(v)})}
  else if(w=='c')g.E.forEach((_,e)=>{if(okE(G,k,e,G.sv))L.push(e)});return L}
 const lf=left(G,k);if(!(lf[w]>0))return L;
 if(w=='c')g.E.forEach((_,e)=>{if(okE(G,k,e))L.push(e)});
 if(w=='p')g.V.forEach((_,v)=>{if(okV(G,k,v))L.push(v)});
 if(w=='u')G.vt.forEach((t,v)=>{if(t=='p'&&G.vo[v]===k)L.push(v)});
 return L}
// cambio con el banco: 4:1, 3:1 con puerto genérico, 2:1 con puerto de ese recurso
function rate(G,k,r){const g=gG(G);let b=4;G.ports.forEach(p=>{if(g.E[p.e].v.some(v=>G.vo[v]===k))b=Math.min(b,p.r===r?2:p.r<0?3:4)});return b}
// ruta más larga: el camino seguido más largo sin repetir orilla; una pieza rival en una esquina lo corta
function roadLen(G,k){const g=gG(G),mine=[];G.eo.forEach((o,e)=>{if(o===k)mine.push(e)});if(!mine.length)return 0;
 const used=new Set();let best=0;
 const go=(v,len)=>{if(len>best)best=len;if(len&&G.vo[v]>=0&&G.vo[v]!==k)return;
  for(const e of g.V[v].e){if(G.eo[e]!==k||used.has(e))continue;const E=g.E[e];used.add(e);go(E.v[0]===v?E.v[1]:E.v[0],len+1);used.delete(e)}};
 const ends=new Set();mine.forEach(e=>g.E[e].v.forEach(v=>ends.add(v)));ends.forEach(v=>go(v,0));return best}
// puntos: piezas, Ruta más larga 2, Ejército más grande 2 y (hid) cartas de punto, que son secretas hasta ganar
function vp(G,k,hid){let p=0;G.vt.forEach((t,v)=>{if(t&&G.vo[v]===k)p+=PZ[t].pts});G.et.forEach((t,e)=>{if(t&&G.eo[e]===k)p+=PZ[t].pts});
 if(G.lr===k)p+=2;if(G.ga===k)p+=2;if(hid)p+=G.dev[k].filter(c=>c.c=='v').length;return p+(G.xp?G.xp[k]||0:0)}
// colores de jugador (sin verde ni amarillo, que son de los terrenos)
const PCOL=['#2F6DB5','#C8382E','#EFE6D2','#E07B22','#7D52B8','#3B2F2A'];
return {RES,TER,DES,MAR,DIR,COST,PZ,DEV,PIP,ESC,PCOL,mazo,shuf,geo,board,land,prod,left,okV,okE,spots,rate,roadLen,vp}});
