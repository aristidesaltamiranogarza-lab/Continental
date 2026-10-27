// Haciendas de Yucatán: tableros, puertos y cartas. Lo usan las reglas (g_haciendas.js, con require) y el cliente (window.HACD).
// Hexágonos de punta arriba en coordenadas axiales (q,r), pantalla con y hacia abajo. Orilla k: normal a 60·k° (0 este, 1 sureste... 5 noreste).
// Esquina c a 60·c−30°; la orilla k une las esquinas k y k+1. Terrenos t: 0 henequén · 1 maíz · 2 piedra · 3 miel · 4 sal · 5 cenote (no produce).
(function(root,f){const D=f();if(typeof module!=='undefined'&&module.exports)module.exports=D;else root.HACD=D})(this,function(){
const RES=['henequén','maíz','piedra','miel','sal'],TER=[...RES,'cenote'],ICO=['🌿','🌽','🪨','🍯','🧂','💧'];
const DIR=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],SQ3=Math.sqrt(3);
// costos [henequén, maíz, piedra, miel, sal]: s sacbé · r rancho · h hacienda · c carta de desarrollo
const COST={s:[1,0,1,0,0],r:[1,1,0,1,1],h:[0,2,3,0,0],c:[0,1,0,1,1]},PIECES={s:15,r:5,h:4};
// cartas: g Guardia maya · f Fajina · c Cosecha · m Mercado de Mérida · p0..p4 punto oculto
const DEV={g:{n:14,nm:'Guardia maya',ico:'🛡️',tx:'Mueve el huracán y roba una carta, o protege uno de tus hexágonos una ronda.'},
 f:{n:2,nm:'Fajina',ico:'⛏️',tx:'Dos sacbés gratis, o un sacbé gratis y un recurso del banco.'},
 c:{n:2,nm:'Cosecha',ico:'🧺',tx:'Toma dos recursos del banco.'},
 m:{n:2,nm:'Mercado de Mérida',ico:'🛒',tx:'Elige un recurso: cada rival te da hasta dos.'},
 p:{n:5,nm:'Punto oculto',ico:'⛪',tx:'Vale un punto. Se mantiene oculta hasta ganar.'}};
const PTS=['Izamal','Valladolid','Motul','Ticul','Tekax'];
const deck=()=>{const d=[];for(const c of 'gfcm')for(let i=0;i<DEV[c].n;i++)d.push(c);PTS.forEach((_,i)=>d.push('p'+i));return d};
// puertos en orden por la costa, del poniente pasando por el norte (los dos últimos solo en el tablero grande)
const PORTN=['Celestún','Sisal','Chuburná','Progreso','Telchac','Dzilam','San Felipe','Río Lagartos','El Cuyo','Chicxulub','Las Coloradas'];

// ---- formas: 19 hexágonos (radio 2) y 30 (filas 3-4-5-6-5-4-3) ----
function shape(n){const L=[];
 if(n==19){for(let r=-2;r<=2;r++)for(let q=-2;q<=2;q++)if(Math.abs(q+r)<=2)L.push([q,r])}
 else for(let r=-3;r<=3;r++)for(let q=Math.max(-3,-3-r);q<=Math.min(2,2-r);q++)L.push([q,r]);
 return L}
// geometría: H hexágonos (v esquinas, e orillas, nb vecinos), V esquinas (h hex, v vecinas, e orillas), E orillas (v, h), coast orillas de costa en orden
const GEO={};
function geo(n){if(GEO[n])return GEO[n];const P=shape(n),idx={},H=[],V=[],E=[],vk={},ek={};P.forEach(([q,r],i)=>idx[q+','+r]=i);
 const vid=(x,y)=>{const k=Math.round(x*100)+','+Math.round(y*100);if(vk[k]==null){vk[k]=V.length;V.push({x:+x.toFixed(3),y:+y.toFixed(3),h:[],v:[],e:[]})}return vk[k]};
 P.forEach(([q,r],i)=>{const x=SQ3*(q+r/2),y=1.5*r,h={q,r,x:+x.toFixed(3),y,v:[],e:[],nb:DIR.map(([a,b])=>idx[(q+a)+','+(r+b)]??-1)};
  for(let c=0;c<6;c++){const a=(60*c-30)*Math.PI/180,v=vid(x+Math.cos(a),y+Math.sin(a));h.v.push(v);V[v].h.push(i)}H.push(h)});
 H.forEach((h,i)=>{for(let k=0;k<6;k++){const a=h.v[k],b=h.v[(k+1)%6],key=Math.min(a,b)+'-'+Math.max(a,b);
  if(ek[key]==null){ek[key]=E.length;E.push({v:[a,b],h:[],x:+((V[a].x+V[b].x)/2).toFixed(3),y:+((V[a].y+V[b].y)/2).toFixed(3)});V[a].e.push(ek[key]);V[b].e.push(ek[key]);V[a].v.push(b);V[b].v.push(a)}
  const e=ek[key];h.e.push(e);E[e].h.push(i)}});
 const cx=H.reduce((s,h)=>s+h.x,0)/H.length,cy=H.reduce((s,h)=>s+h.y,0)/H.length,ang=e=>{let a=Math.atan2(E[e].y-cy,E[e].x-cx);return a<-Math.PI+1e-6?a+2*Math.PI:a};
 const coast=[];H.forEach((h,i)=>h.nb.forEach((b,k)=>{if(b<0)coast.push({h:i,k,e:h.e[k]})}));coast.sort((a,b)=>ang(a.e)-ang(b.e));
 return GEO[n]={n,H,V,E,coast,idx}}

// ---- tablero fijo de 19 (terreno, número) y sus puertos (hex, orilla, recurso; -1 = genérico 3:1) ----
const FIX19=[[0,-2,1,6],[1,-2,0,5],[2,-2,3,10],[-1,-1,2,9],[0,-1,4,3],[1,-1,0,11],[2,-1,2,8],[-2,0,3,4],[-1,0,1,10],[0,0,5,0],
 [1,0,4,4],[2,0,0,9],[-2,1,0,8],[-1,1,1,11],[0,1,2,2],[1,1,3,3],[-2,2,4,5],[-1,2,1,12],[0,2,2,6]];
const FIXP19=[[0,-2,4,-1],[2,-2,5,3],[2,-1,0,-1],[2,0,1,4],[0,2,1,-1],[-1,2,2,1],[-2,2,3,-1],[-2,0,3,0],[-1,-1,4,2]];
const NUM19=[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],NUM30=[2,2,3,3,3,4,4,4,5,5,5,6,6,6,8,8,8,9,9,9,10,10,10,11,11,11,12,12];
const TER19=[0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,4,4,4,5],TER30=[0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4,5,5];
function shuf(a,rnd){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
// semilla fija para el tablero grande "fijo"
const seeded=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hot=n=>n==6||n==8;
// puertos: lista de {e orilla, h hex, k, r recurso (-1 genérico), nm nombre}, en orden por la costa
function portsAt(g,pos,types){const L=pos.map((c,i)=>Object.assign({},c,{r:types[i]}));const o=e=>g.coast.findIndex(c=>c.e===e);
 L.sort((a,b)=>o(a.e)-o(b.e));L.forEach((p,i)=>p.nm=PORTN[i]);return L}
function evenCoast(g,m){const L=g.coast.length,off=Math.floor(L/m/2);return Array.from({length:m},(_,i)=>g.coast[(Math.round(i*L/m)+off)%L])}
// tablero: n = 19 o 30; fixed = tablero fijo; rnd = generador (Math.random por defecto)
function board(n,fixed,rnd){rnd=rnd||Math.random;const g=geo(n);let hx,ports;
 if(n==19&&fixed){hx=g.H.map(h=>{const f=FIX19.find(a=>a[0]==h.q&&a[1]==h.r);return {t:f[2],n:f[3]}});
  ports=portsAt(g,FIXP19.map(([q,r,k])=>{const h=g.idx[q+','+r];return {h,k,e:g.H[h].e[k]}}),FIXP19.map(p=>p[3]))}
 else{const R=fixed?seeded(1907):rnd,T=n==19?TER19:TER30,N=n==19?NUM19:NUM30;
  for(let tries=0;;tries++){const t=shuf(T.slice(),R),nums=shuf(N.slice(),R);let j=0;hx=t.map(x=>({t:x,n:x==5?0:nums[j++]}));
   if(!hx.some((h,i)=>hot(h.n)&&g.H[i].nb.some(b=>b>=0&&hot(hx[b].n))))break}
  const pos=n==19?FIXP19.map(([q,r,k])=>{const h=g.idx[q+','+r];return {h,k,e:g.H[h].e[k]}}):evenCoast(g,11);
  const types=n==19?[-1,-1,-1,-1,0,1,2,3,4]:[-1,-1,-1,-1,-1,0,1,2,3,4,Math.floor(R()*5)];ports=portsAt(g,pos,shuf(types,R))}
 return {n,hx,ports,hur:hx.findIndex(h=>h.t==5)}}
// ---- reglas de lugar, iguales en servidor y cliente: piezas que quedan, dónde se puede construir y tasa de cambio ----
function left(G,k){let r=0,h=0,s=0;G.vo.forEach((o,v)=>{if(o===k){if(G.vl[v]==1)r++;else h++}});G.eo.forEach(o=>{if(o===k)s++});
 return {s:PIECES.s-s,r:PIECES.r-r,h:PIECES.h-h}}
// rancho: esquina libre, sin vecinos ocupados (una orilla de separación) y, fuera del inicio, tocando un sacbé tuyo
function okV(G,k,v,setup){const V=geo(G.bn).V[v];if(!V||G.vo[v]>=0||V.v.some(w=>G.vo[w]>=0))return false;return !!setup||V.e.some(e=>G.eo[e]===k)}
// sacbé: orilla libre que sale de tu red (un edificio tuyo, o un sacbé tuyo en una esquina sin edificio rival). at: debe tocar esa esquina
function okE(G,k,e,at){const g=geo(G.bn),E=g.E[e];if(!E||G.eo[e]>=0)return false;if(at!=null)return E.v.includes(at);
 return E.v.some(v=>G.vo[v]===k||(G.vo[v]<0&&g.V[v].e.some(x=>x!==e&&G.eo[x]===k)))}
function spots(G,k,w){const g=geo(G.bn),L=[];
 if(G.st=='setup'){if(G.turn!==k)return L;if(G.sv<0){if(w=='r')g.V.forEach((_,v)=>{if(okV(G,k,v,true))L.push(v)})}
  else if(w=='s')g.E.forEach((_,e)=>{if(okE(G,k,e,G.sv))L.push(e)});return L}
 const lf=left(G,k);
 if(w=='s'&&lf.s>0)g.E.forEach((_,e)=>{if(okE(G,k,e))L.push(e)});
 if(w=='r'&&lf.r>0)g.V.forEach((_,v)=>{if(okV(G,k,v))L.push(v)});
 if(w=='h'&&lf.h>0)G.vo.forEach((o,v)=>{if(o===k&&G.vl[v]==1)L.push(v)});
 return L}
// cambio con el banco: 4:1, 3:1 con puerto genérico, 2:1 con puerto de ese recurso
function rate(G,k,r){const g=geo(G.bn);let b=4;G.ports.forEach(p=>{if(g.E[p.e].v.some(v=>G.vo[v]===k))b=Math.min(b,p.r===r?2:p.r<0?3:4)});return b}
// colores de jugador (sin verde ni amarillo, que son de los terrenos)
const PCOL=['#d63a3a','#2563eb','#f4f1e8','#f07c1a','#8b4fc9','#3b2f2a'];
// pips: probabilidad de un número en 36avos
const PIP=n=>n?6-Math.abs(7-n):0;
return {RES,TER,ICO,DIR,COST,PIECES,DEV,PTS,PORTN,PCOL,deck,geo,board,PIP,shuf,seeded,left,okV,okE,spots,rate}});
