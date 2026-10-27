// Bots de Haciendas de Yucatán: un solo nivel, con nombre y personalidad yucateca. bot(R,k) → {m: acción, ms: espera} o null; server.js lo agenda y lo manda por act().
// Fundan según la probabilidad y la variedad de los números, construyen por prioridades, comercian con banco, puertos y jugadores, y no le ayudan a quien va ganando.
// fav: recurso preferido · sty: road (sacbés) · city (haciendas) · card (cartas) · trade (comercia más)
module.exports=X=>{const {D,geo,tot,has,left,okV,okE,spots,rate,vp,roadLen}=X,{COST,PIP}=D;
const PER={'Don Chucho':{fav:0,sty:'road'},'Doña Mary':{fav:3,sty:'card'},'Güero Canul':{fav:2,sty:'city'},'Doña Lupita':{fav:1,sty:'city'},
 'Tía Nena':{fav:4,sty:'trade'},'Don Wilbert':{fav:2,sty:'road'},'Don Ermilo':{fav:1,sty:'trade'}};
const botn=Object.keys(PER).map(n=>'🤖 '+n),SPD=[800,1500,800,300];
const per=(R,k)=>PER[R.players[k].name.replace(/^🤖\s*/,'')]||{fav:k%5,sty:['road','city','card','trade'][k%4]};
const missN=(r,c)=>c.reduce((s,x,i)=>s+Math.max(0,x-r[i]),0),other=(E,v)=>E.v[0]===v?E.v[1]:E.v[0];
// a quien va ganando no se le ayuda: no se comercia con él y es el blanco del huracán
const avoid=(G,k,j)=>{const v=vp(G,j,false);return j!==k&&(v>=G.o.pts-2||v>=vp(G,k,false)+3)};
// pips por recurso que ya produce k
function prodOf(G,k){const g=geo(G),a=[0,0,0,0,0];G.vo.forEach((o,v)=>{if(o!==k)return;g.V[v].h.forEach(h=>{const x=G.hx[h];if(x.t<5)a[x.t]+=PIP(x.n)*G.vl[v]})});return a}
// qué tan buena es una esquina: probabilidad, variedad, recurso favorito, lo que le falta y puertos
function vscore(G,k,v,P,mine){const g=geo(G),seen=new Set();let s=0;
 g.V[v].h.forEach(h=>{const x=G.hx[h];if(x.t>4)return;const p=PIP(x.n)*(h===G.hur?.3:1);s+=p+(x.t===P.fav?p*.4:0)+(mine&&!mine[x.t]?2.5:0);seen.add(x.t)});
 s+=seen.size*1.2;const pt=G.ports.find(p=>geo(G).E[p.e].v.includes(v));if(pt)s+=pt.r<0?1.5:mine&&mine[pt.r]>=5?3:1;return s}
function best(L,f){let b=-1,bs=-Infinity;L.forEach(x=>{const s=f(x);if(s>bs){bs=s;b=x}});return b}
// ---- inicio: el mejor rancho; el sacbé apunta a la mejor esquina libre a dos pasos ----
function setupMove(G,k,P){const g=geo(G);
 if(G.sv<0){const mine=prodOf(G,k);return {t:'build',w:'r',v:best(spots(G,k,'r'),v=>vscore(G,k,v,P,mine)+Math.random()*1.5)}}
 return {t:'build',w:'s',e:best(spots(G,k,'s'),e=>{const w=other(g.E[e],G.sv);let s=Math.random();
  g.V[w].v.forEach(u=>{if(u!==G.sv&&okV(G,k,u,true))s=Math.max(s,vscore(G,k,u,P,null)+Math.random())});return s})}}
// ---- sacbé: primer tramo hacia la mejor esquina para un rancho (hasta 4 pasos); si no hay, alarga el camino si busca el Sacbé real ----
function roadStep(G,k,P){const g=geo(G),mine=prodOf(G,k),dist={},first={},Q=[],lf=left(G,k);if(lf.s<=0)return -1;
 g.V.forEach((V,v)=>{if(G.vo[v]>=0&&G.vo[v]!==k)return;if(G.vo[v]===k||V.e.some(e=>G.eo[e]===k)){dist[v]=0;Q.push(v)}});
 let b=-1,bv=0;while(Q.length){const u=Q.shift();if(dist[u]>=4||(G.vo[u]>=0&&G.vo[u]!==k))continue;
  for(const e of g.V[u].e){if(G.eo[e]>=0)continue;const w=other(g.E[e],u);if(dist[w]!=null)continue;dist[w]=dist[u]+1;first[w]=dist[u]?first[u]:e;
   if(G.vo[w]<0&&!g.V[w].v.some(x=>G.vo[x]>=0)&&lf.r>0){const s=vscore(G,k,w,P,mine)/(1+dist[w]*.6);if(s>bv){bv=s;b=first[w]}}Q.push(w)}}
 if(b>=0||G.lr===k||roadLen(G,k)<3)return b;
 // sin lugar para ranchos: alarga el camino para ganar el Sacbé real
 const L0=roadLen(G,k);let bg=0;spots(G,k,'s').forEach(e=>{G.eo[e]=k;const d=roadLen(G,k)-L0;G.eo[e]=-1;if(d>bg){bg=d;b=e}});return b}
// ---- metas en orden de prioridad: h hacienda · r rancho · s sacbé (para abrir camino) · c carta ----
function plan(G,k,P){const lf=left(G,k),sc={};
 if(lf.h>0&&spots(G,k,'h').length)sc.h=5+(P.sty=='city'?2:0)+(lf.r<=0?2:0);
 const rs=lf.r>0&&spots(G,k,'r').length;if(rs)sc.r=6+(P.sty=='road'?.5:0);
 if(lf.s>0&&roadStep(G,k,P)>=0){if(!rs&&lf.r>0)sc.s=4+(P.sty=='road'?1.5:0);else if(G.lr!==k&&G.ll[k]>=3)sc.s=3+(P.sty=='road'?1.5:0)}
 if(G.deck.length)sc.c=2+(P.sty=='card'?2.5:0)+(lf.r<=0&&lf.h<=0?4:0);
 return Object.keys(sc).sort((a,b)=>sc[b]-sc[a])}
function buildMove(G,k,w,P){
 if(w=='h'){const v=best(spots(G,k,'h'),v=>geo(G).V[v].h.reduce((s,h)=>s+(G.hx[h].t<5&&h!==G.hur?PIP(G.hx[h].n):0),0));return v>=0?{t:'build',w,v}:null}
 if(w=='r'){const mine=prodOf(G,k),v=best(spots(G,k,'r'),v=>vscore(G,k,v,P,mine));return v>=0?{t:'build',w,v}:null}
 if(w=='s'){const e=roadStep(G,k,P);return e>=0?{t:'build',w,e}:null}
 return G.deck.length?{t:'build',w:'c'}:null}
// lo que más le falta para la meta
function needOf(r,c,P){let b=-1,bs=0;c.forEach((x,i)=>{const s=x-r[i]+(i===P.fav?.1:0);if(x>r[i]&&s>bs){bs=s;b=i}});return b}
// ¿le conviene el cambio? recibe o.give y da o.want
function good(G,k,o,P){if(avoid(G,k,o.from)||!has(G.res[k],o.want))return false;const top=plan(G,k,P)[0],c=top?COST[top]:[1,1,1,1,1];
 const after=G.res[k].map((x,i)=>x-o.want[i]+o.give[i]),a=missN(after,c),b=missN(G.res[k],c);return a<b||(a===b&&tot(o.give)>tot(o.want))}
function respond(G,k,o,P){if(good(G,k,o,P))return {t:'accept',id:o.id};
 if(!avoid(G,k,o.from)&&!G.offers.some(x=>x.from===k)&&Math.random()<(P.sty=='trade'?.6:.25)){
  const top=plan(G,k,P)[0],c=top?COST[top]:[0,0,0,0,0],r=G.res[k],need=needOf(r,c,P),sx=best([0,1,2,3,4].filter(x=>x!==need&&r[x]-c[x]>0),x=>r[x]-c[x]+(o.want[x]?2:0));
  if(need>=0&&sx>=0){const give=[0,0,0,0,0],want=[0,0,0,0,0];give[sx]=1;want[need]=1;return {t:'offer',re:o.id,give,want}}}
 return {t:'reject',id:o.id}}
// a quién ofrecerle: a todos, o a alguien que no vaya ganando
function pickTo(G,k){const L=G.players.map((_,j)=>j).filter(j=>j!==k&&!G.out[j]);if(!L.some(j=>avoid(G,k,j)))return -1;
 const ok=L.filter(j=>!avoid(G,k,j));return ok.length?ok[Math.random()*ok.length|0]:null}
function tradeMove(G,k,top,P){const r=G.res[k],c=COST[top],need=needOf(r,c,P);if(need<0)return null;
 const bx=best([0,1,2,3,4].filter(x=>x!==need&&r[x]-c[x]>=rate(G,k,x)),x=>r[x]-c[x]-rate(G,k,x));if(bx>=0)return {t:'bank',give:bx,get:need};
 if(G.oc>=(P.sty=='trade'?3:2))return null;const sx=best([0,1,2,3,4].filter(x=>x!==need&&r[x]-c[x]>0),x=>r[x]-c[x]);if(sx<0)return null;
 const to=pickTo(G,k);if(to===null)return null;const give=[0,0,0,0,0],want=[0,0,0,0,0];give[sx]=1;want[need]=1;return {t:'offer',to,give,want}}
// ---- cartas ----
function cardMove(G,k,P,pre){if(G.played)return null;const g=geo(G),H=G.dev[k].filter(c=>c.tc<G.tc).map(c=>c.id);
 const hurt=g.H[G.hur].v.some(v=>G.vo[v]===k)&&PIP(G.hx[G.hur].n)>=3;
 if(H.includes('g')&&(hurt||(!pre&&G.gu[k]+1>=3&&G.ga!==k&&(G.ga<0||G.gu[k]+1>G.gu[G.ga]))||(!pre&&P.sty=='card'&&Math.random()<.3)))return {t:'dev',c:'g'};
 if(pre)return null;const top=plan(G,k,P)[0],c=top?COST[top]:null,r=G.res[k];
 if(c&&H.includes('c')){const m=missN(r,c);if(m>=1&&m<=2){const L=[];c.forEach((x,i)=>{for(let j=r[i];j<x;j++)L.push(i)});while(L.length<2)L.push(P.fav);return {t:'dev',c:'c',r:L.slice(0,2)}}}
 if(c&&H.includes('m')){const n=needOf(r,c,P);if(n>=0)return {t:'dev',c:'m',r:n}}
 if(H.includes('f')&&roadStep(G,k,P)>=0){const lf=left(G,k);if(lf.s>=2&&top=='s')return {t:'dev',c:'f'};if(c){const n=needOf(r,c,P);if(n>=0)return {t:'dev',c:'f',r:n}}}
 return null}
// ---- huracán: al hexágono que más le duela a los rivales (sobre todo al que va ganando), nunca a uno propio ----
function pickHex(G,k){const g=geo(G),pub=G.players.map((_,j)=>vp(G,j,false));
 return best(g.H.map((_,h)=>h).filter(h=>h!==G.hur&&!G.prot.some(p=>p.h===h)),h=>{let s=Math.random()*.3;
  g.H[h].v.forEach(v=>{const o=G.vo[v];if(o<0)return;if(o===k){s-=50;return}s+=G.vl[v]*PIP(G.hx[h].n)*(1+pub[o]*.15)*(avoid(G,k,o)?1.6:1)+(tot(G.res[o])?.5:0)});return s})}
const pickVictim=(G,k)=>best(G.cand,j=>vp(G,j,false)*10+tot(G.res[j]));
function discardPick(G,k,P){const n=G.dis[k],r=G.res[k].slice(),out=[0,0,0,0,0],top=plan(G,k,P)[0],c=top?COST[top]:[0,0,0,0,0];
 for(let i=0;i<n;i++){const b=best([0,1,2,3,4].filter(x=>r[x]>0),x=>r[x]-c[x]*1.5-(x===P.fav?.5:0));r[b]--;out[b]++}return out}
// ---- turno principal: contraofertas, esperar respuesta, cartas, construir, comerciar, terminar ----
function mainMove(G,k,P,W){const r=G.res[k];if(G.ac>80)return {t:'end'};
 for(const o of G.offers)if(o.from!==k&&o.to===k)return good(G,k,o,P)?{t:'accept',id:o.id}:{t:'reject',id:o.id};
 const mine=G.offers.find(o=>o.from===k);if(mine)return {m:{t:'reject',id:mine.id},ms:Math.max(0,W-(Date.now()-mine.ts))};
 const cm=cardMove(G,k,P,false);if(cm)return cm;
 const goals=plan(G,k,P),top=goals[0];if(!top)return {t:'end'};
 if(has(r,COST[top])){const m=buildMove(G,k,top,P);if(m)return m}
 const m0=missN(r,COST[top]);
 for(const w of goals.slice(1)){if(!has(r,COST[w]))continue;const a=r.map((x,i)=>x-COST[w][i]);if(missN(a,COST[top])<=m0||tot(r)>G.o.hl){const m=buildMove(G,k,w,P);if(m)return m}}
 return tradeMove(G,k,top,P)||{t:'end'}}
function bot(R,k){const G=R.G;if(!G||G.phase!='play'||G.out[k])return null;const P=per(R,k),sp=SPD[G.o.vel]||800,hum=!R.players[k].bot;
 const go=(x,f=1)=>{const o=x.m?x:{m:x,ms:Math.round(sp*f*(.6+Math.random()*.8))};if(hum)o.m.ab=1;return o};
 if(G.st=='discard')return G.dis&&G.dis[k]!=null?go({t:'discard',r:discardPick(G,k,P)}):null;
 if(G.turn!==k){if(G.st!='main')return null;const o=G.offers.find(o=>o.from===G.turn&&(o.to===k||o.to<0)&&!o.no.includes(k));return o?go(respond(G,k,o,P),1.3):null}
 if(G.st=='setup')return go(setupMove(G,k,P),1.2);
 if(G.st=='roll')return go(cardMove(G,k,P,true)||{t:'roll'});
 if(G.st=='move')return go({t:'move',h:pickHex(G,k)});
 if(G.st=='steal')return go({t:'steal',v:pickVictim(G,k)});
 if(G.st=='road'){const e=roadStep(G,k,P);return go(e>=0&&okE(G,k,e)?{t:'build',w:'s',e}:{t:'skip'})}
 if(G.st=='main'){const W=R.players.some((p,j)=>j!==k&&!p.bot&&!G.out[j])?9000:sp*3;return go(mainMove(G,k,P,W))}return null}
return {bot,botn}};
