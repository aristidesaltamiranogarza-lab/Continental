// Colonos 2D (COU): la mesa sobre el marco común M2D (arriba: gestos, chat y menú como en los demás juegos). El tablero vive en CO2 (c_colonos2d.js).
// Sin pestañas: rivales con su etiqueta (puntos, cartas, desarrollo, medallas), tus 5 montones, la bandeja (camino, poblado, ciudad, carta) y un botón principal
// que siempre está en el mismo lugar (Tirar → Terminar; Poner cuando eliges un lugar). Comercio en un tapete; con 7, descarte a la vez. Animaciones en COFX.
(function(){
const D=window.COLD;if(!D||typeof GM==='undefined'||!GM.colonos||!window.M2D||!window.CO2){console.warn('Colonos UI: falta c_colonos.js, c_colonos2d.js o c_mesa2d.js');return}
const b0=GM.colonos.body,ico=n=>window.UI&&UI.ico?UI.ico(n):'',RN=['Madera','Ladrillo','Lana','Trigo','Mineral'];
const CBG=['#D6E6C6','#F1CDB6','#EDF4DB','#F6E3AE','#DCE0E7'],CBD=['#4C7A40','#B0552F','#8DB35A','#C9962C','#6E7684'],DOT=['#3F6E35','#B0552F','#F1EDE2','#E0AE3E','#6E7684'];
const DEVN={k:'Caballero',v:'Punto',c:'Caminos',a:'Abundancia',m:'Monopolio'},DEVT={k:'Mueve el ladrón y roba una carta.',v:'Un punto secreto.',c:'Pon 2 caminos gratis.',a:'Toma 2 cartas del banco.',m:'Todos te dan un recurso.'};
const DEVC={k:'#8C3B2E',v:'#C9962C',c:'#2E6E73',a:'#3D7A47',m:'#5E4A8C'};
let on=false,t0=0,sel=null,gh=null,mat=null,dis=null,pk=null,finX=false,lastSt='',lastTc=-1;
const active=()=>typeof S!='undefined'&&!!S&&!!V&&V.game==='colonos'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final');
const nm=k=>k===V.me?'Tú':esc(((V.G.players[k])||{}).name||'?'),pc=k=>D.PCOL[k%D.PCOL.length],tot=a=>a?a.reduce((s,x)=>s+x,0):0;
const has=(r,c)=>!!r&&c.every((x,i)=>r[i]>=x);
// ---------- dibujos chicos ----------
function rico(r,s,op){const b=[
 '<circle cx="-5" cy="4" r="5.5" fill="#8A5A30"/><circle cx="-5" cy="4" r="3.2" fill="#D7A66A"/><circle cx="6" cy="4" r="5.5" fill="#8A5A30"/><circle cx="6" cy="4" r="3.2" fill="#D7A66A"/><circle cx=".5" cy="-5" r="5.5" fill="#7A4E28"/><circle cx=".5" cy="-5" r="3.2" fill="#CF9B5E"/>',
 '<g fill="#A8482A" stroke="#F3D3BF" stroke-width="1"><rect x="-10" y="3" width="9.5" height="5.5" rx="1"/><rect x=".5" y="3" width="9.5" height="5.5" rx="1"/><rect x="-5" y="-3" width="9.5" height="5.5" rx="1"/><rect x="-9" y="-9" width="8.5" height="5.5" rx="1"/><rect x=".5" y="-9" width="8.5" height="5.5" rx="1"/></g>',
 '<ellipse cx="1" cy="1" rx="9" ry="6.5" fill="#FFFFFF" stroke="#CFC6B4" stroke-width="1.2"/><ellipse cx="-8" cy="-1" rx="3.2" ry="3.8" fill="#3B3330"/><path d="M-3 7v3M5 7v3" stroke="#3B3330" stroke-width="1.8" stroke-linecap="round"/>',
 '<path d="M0 11V-9" stroke="#B7862A" stroke-width="1.6"/>'+[-6,-1,4].map(y=>`<ellipse cx="-3" cy="${y}" rx="2.4" ry="4" transform="rotate(-30 -3 ${y})" fill="#D9A43A"/><ellipse cx="3" cy="${y}" rx="2.4" ry="4" transform="rotate(30 3 ${y})" fill="#D9A43A"/>`).join('')+'<ellipse cx="0" cy="-11" rx="2.2" ry="3.6" fill="#D9A43A"/>',
 '<path d="M-10 8L-6-4L1-9L9-3L10 8Z" fill="#6E7684"/><path d="M-6-4L1-9L3 0L-2 3Z" fill="#B4C0CE"/><path d="M3 0L9-3L10 8L4 8Z" fill="#59606C"/>'][r];
 return `<svg class="co-ri" viewBox="-13 -13 26 26" style="${s?`width:${s}px;height:${s}px;`:''}${op!=null?`opacity:${op}`:''}" aria-hidden="true">${b}</svg>`}
const carta=(r,n,cls)=>`<span class="co-cd ${cls||''}" style="--bg:${CBG[r]};--bd:${CBD[r]}">${rico(r)}${n!=null?`<b>${n}</b>`:''}</span>`;
const PZS={c:'<line x1="-8" y1="6" x2="8" y2="-6" stroke="var(--pd)" stroke-width="7" stroke-linecap="round"/><line x1="-8" y1="6" x2="8" y2="-6" stroke="var(--pc)" stroke-width="4.4" stroke-linecap="round"/>',
 p:'<path d="M-8 7V-2l8-7 8 7V7Z" fill="var(--pc)" stroke="var(--pd)" stroke-width="1.6" stroke-linejoin="round"/>',
 u:'<path d="M-11 8V-2l5.5-5.5 5.5 5.5v-1h2v-7l4.5-3.5 4.5 3.5V8Z" fill="var(--pc)" stroke="var(--pd)" stroke-width="1.6" stroke-linejoin="round"/>',
 d:'<rect x="-6.5" y="-9" width="13" height="18" rx="2.4" fill="#8C3B2E" stroke="#F1E4CC" stroke-width="1.3"/><circle r="3.4" fill="none" stroke="#F1E4CC" stroke-width="1.1" opacity=".75"/>'};
const pzs=(w,k)=>`<svg class="co-pz" viewBox="-13 -13 26 26" style="--pc:${pc(k)};--pd:${k%D.PCOL.length==2?'#7A6646':'rgba(0,0,0,.45)'}" aria-hidden="true">${PZS[w]}</svg>`;
const medal=t=>`<i class="co-md" title="${t=='lr'?'Ruta más larga':'Ejército más grande'}">${t=='lr'?'<svg viewBox="0 0 24 24"><path d="M5 19L19 5" stroke="#5A3A0E" stroke-width="3" stroke-linecap="round"/></svg>':'<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" fill="none" stroke="#5A3A0E" stroke-width="2.4"/></svg>'}</i>`;
const devCard=(c,n,cls,on)=>`<button class="co-dv ${cls||''}" style="--dc:${DEVC[c]}" ${on?`onclick="COU.dev('${c}')"`:'tabindex="-1"'} aria-label="${DEVN[c]}"><span>${DEVN[c]}</span>${n>1?`<b>${n}</b>`:''}</button>`;
const die=v=>`<i class="co-die" data-v="${v}">${'<u></u>'.repeat(v)}</i>`;
// ---------- quién y qué ----------
const G=()=>V.G,me=()=>V.me,act=()=>V.G.actor,mine=()=>V.G.phase==='play'&&act()===me()&&me()>=0;
function spots(){const g=G(),k=me();if(!mine())return null;const st=g.st;
 if(st=='setup')return g.sv<0?{w:'p',L:D.spots(g,k,'p')}:{w:'c',L:D.spots(g,k,'c')};
 if(st=='roads')return {w:'c',L:D.spots(g,k,'c')};
 if(st=='robber')return {w:'h',L:g.hx.map((x,i)=>i).filter(i=>i!==g.rob&&D.land(g.hx[i].t))};
 if((st=='main'||st=='sbp')&&sel)return {w:sel,L:D.spots(g,k,sel)};return null}
const ghW=sp=>sp?sp.w:null;
function canB(w){const g=G(),k=me();if(!mine()||(g.st!='main'&&g.st!='sbp'))return false;const r=g.res[k];
 if(w=='d')return g.deck>0&&has(r,D.COST.d);return has(r,D.COST[w])&&D.spots(g,k,w).length>0}
// ---------- piezas de la pantalla ----------
function tag(k){const g=G(),P=(V.players||[])[k]||{},n=g.nres[k],hl=g.o.hl,o=myOffer(),turn=act()===k&&g.phase==='play';
 const st=o?(o.si.includes(k)?'si':o.no.includes(k)?'no':''):'',steal=mine()&&g.st=='steal'&&(g.cand||[]).includes(k);
 return `<div class="co-tag${turn?' on':''}${st?' '+st:''}${steal?' pick':''}${P.out?' out':''}" data-seat="${k}" style="--c:${pc(k)}" onclick="COU.seat(${k})">
 <span class="co-pt">${M2D.retrato(k)}<em style="background:${pc(k)}" class="${k%D.PCOL.length==2?'cl':''}">${g.vp[k]}</em></span>
 <span class="co-tx"><b>${nm(k)}</b><span class="co-ns"><i class="co-nc${n>hl?' al':''}">${n}</i><i class="co-nd">${g.ndev[k]}</i>${g.kn[k]?`<i class="co-nk">${g.kn[k]}</i>`:''}${g.lr===k?medal('lr'):''}${g.ga===k?medal('ga'):''}</span></span>
 ${st=='si'?`<span class="co-ok">${CHK}</span>`:''}</div>`}
function mano(){const g=G(),k=me(),r=g.res[k]||[0,0,0,0,0],dv=g.dev[k]||[],m=mat,d=dis;
 const piles=r.map((n,i)=>{const used=(m?m.give[i]:0)+(d?d[i]:0),left=n-used;
  return `<button class="co-pile${left?'':' z'}" data-pile="${i}" style="--bg:${CBG[i]};--bd:${CBD[i]};--i:${i}" onclick="COU.pile(${i})" aria-label="${RN[i]}: ${left}">${rico(i)}<b>${left}</b></button>`}).join('');
 const grp={};dv.forEach(x=>{const nw=x.t===g.tc&&x.c!='v';const key=x.c+(nw?'n':'');grp[key]=(grp[key]||0)+1});
 const devs=Object.keys(grp).sort().map(key=>devCard(key[0],grp[key],key[1]?'nuevo':'',true)).join('');
 return `<div class="co-mano"><span class="co-yo" style="--c:${pc(k)}"><em class="${k%D.PCOL.length==2?'cl':''}" style="background:${pc(k)}">${g.vp[k]}</em>${g.lr===k?medal('lr'):''}${g.ga===k?medal('ga'):''}${g.kn[k]?`<i class="co-nk">${g.kn[k]}</i>`:''}</span><div class="co-piles">${piles}</div>${devs?`<div class="co-devs">${devs}</div>`:''}</div>`}
function tray(){const g=G(),k=me(),r=g.res[k]||[0,0,0,0,0],lf=D.left(g,k);
 return `<div class="co-tray">`+['c','p','u','d'].map((w,j)=>{const cost=D.COST[w],h=r.slice();const dots=cost.map((x,i)=>Array(x).fill(i)).flat().map(i=>{const ok=h[i]-->0;return `<i class="${ok?'':'f'}" style="--dc:${DOT[i]}"></i>`}).join('');
  const ok=canB(w),n=w=='d'?g.deck:lf[w];
  return `<button class="co-tb${sel===w?' on':''}${ok?'':' no'}" style="--d:${80+j*50}ms" onclick="COU.tray('${w}')" aria-label="${{c:'Camino',p:'Poblado',u:'Ciudad',d:'Carta'}[w]}" ${ok||sel===w?'':'aria-disabled="true"'}>${pzs(w,k)}<span class="co-cost">${dots}</span><small>${n}</small></button>`}).join('')+'</div>'}
function myOffer(){const g=G();return (g.offers||[]).find(o=>o.from===me()&&o.from===g.turn)}
// el botón principal y lo que va junto (comerciar, deshacer, cancelar)
function acciones(){const g=G(),k=me(),st=g.st,sp=spots();let main='',sec='';
 if(g.phase!=='play'||k<0)return '';
 if(gh)main=`<button class="ui-btn co-main go" onclick="COU.ok()">${CHK}${gh.w=='h'?'Mover':'Poner'}</button>`;
 else if(mine()&&st=='roll')main=`<button class="ui-btn co-main go" onclick="COU.a({t:'roll'})">${dieI()}Tirar</button>`;
 else if(mine()&&st=='main')main=`<button class="ui-btn co-main" onclick="COU.fin()">Terminar</button>`;
 else if(mine()&&st=='sbp')main=`<button class="ui-btn co-main" onclick="COU.a({t:'end'})">Listo</button>`;
 else if(mine()&&st=='roads')main=`<button class="ui-btn co-main sec" onclick="COU.a({t:'skip'})">Saltar</button>`;
 else main=`<span class="co-main co-esp" style="--c:${pc(act())}"><i></i>${act()===k?'Tú':nm(act())}</span>`;
 if(sel||gh)sec+=`<button class="ui-rb" onclick="COU.cancel()" aria-label="Cancelar">${ico('x')}</button>`;
 if(g.undo&&!gh)sec+=`<button class="ui-rb" onclick="COU.a({t:'undo'})" aria-label="Deshacer">${UNDO}</button>`;
 const T=g.turn,canTr=st=='main'&&!g.out[k];
 if(canTr&&!gh)sec+=`<button class="ui-rb${mat?' on':''}" onclick="COU.mat()" aria-label="Comerciar">${SWAP}</button>`;
 return `<div class="co-acc">${sec}${main}</div>`}
const CHK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
const SWAP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h13l-3-3M18 8l-3 3M19 16H6l3 3M6 16l3-3"/></svg>';
const UNDO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6L4 11l5 5M4 11h10a5 5 0 0 1 0 10h-3"/></svg>';
const dieI=()=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/></svg>';
// la frase de ayuda solo cuando hay que elegir algo en el tablero
function hint(){const g=G(),st=g.st,k=me();if(g.phase!=='play')return '';
 if(st=='discard'&&g.dis&&g.dis[k]==null)return 'Esperando descartes';
 if(!mine())return '';
 if(st=='setup')return gh?'':g.sv<0?'Pon tu poblado':'Pon tu camino';
 if(st=='robber')return gh?'':'Mueve el ladrón';if(st=='steal')return 'Elige a quién robar';if(st=='roads')return gh?'':'Camino gratis';
 if(sel&&!gh)return {c:'Elige dónde va el camino',p:'Elige dónde va el poblado',u:'Elige qué poblado crece'}[sel]||'';return ''}
// últimas jugadas como íconos (arriba, sin registro que abrir)
function tira(){const g=G(),L=(g.log||[]).filter(x=>['tira','pone','compra','juega','roba','trato','banco','ladron'].includes(x.t)).slice(-5);
 const ic=x=>x.t=='tira'?`<b>${x.s}</b>`:x.t=='pone'?pzs(x.w,x.k):x.t=='compra'?pzs('d',x.k):x.t=='juega'?`<i class="co-mj" style="--dc:${DEVC[x.c]}"></i>`:x.t=='roba'||x.t=='ladron'?'<i class="co-mr"></i>':x.t=='trato'||x.t=='banco'?SWAP:'';
 const d=g.dice&&g.dice[0]?`<span class="co-dice">${die(g.dice[0])}${die(g.dice[1])}</span>`:'';
 return `<div class="ui-pill co-strip">${d}${L.map(x=>`<span class="co-lm" style="--c:${pc(x.k)}">${ic(x)}</span>`).join('')}</div>`}
// ---------- capas: oferta para ti, tapete de comercio, descarte, carta, final ----------
function ofertas(){const g=G(),k=me(),T=g.turn;if(g.st!='main'||k<0)return '';
 const L=(g.offers||[]).filter(o=>o.from!==k&&((o.from===T&&(o.to<0||o.to===k)&&!o.si.includes(k)&&!o.no.includes(k))||(o.from!==T&&T===k)));if(!L.length)return '';const o=L[0];
 const can=o.from===T?has(g.res[k],o.want):has(g.res[k],o.want);
 return `<div class="co-of ui-card" style="--c:${pc(o.from)}"><span class="co-ofq">${M2D.retrato(o.from)}</span><div class="co-ofr">${lista(o.give)}<span class="co-ar">→</span>${lista(o.want)}</div>
 <div class="co-ofb"><button class="ui-btn sec" onclick="COU.a({t:'reject',id:${o.id}})">No</button><button class="ui-btn" ${can?'':'disabled'} onclick="COU.a({t:'accept',id:${o.id}})">${CHK}Sí</button></div></div>`}
// tu oferta abierta: una pastilla con lo que das y pides; tocar a quien dijo que sí la cierra
function mio(){const o=myOffer();if(!o||mat)return '';return `<div class="co-mio ui-pill">${lista(o.give)}<span class="co-ar">→</span>${lista(o.want)}<button class="ui-rb" onclick="COU.a({t:'cancel',id:${o.id}})" aria-label="Quitar oferta">${ico('x')}</button></div>`}
const lista=a=>`<span class="co-ls">${a.map((n,i)=>n?carta(i,n,'s'):'').join('')}</span>`;
function tapete(){if(!mat)return '';const g=G(),k=me(),T=g.turn,R=g.rates||[4,4,4,4,4],gv=mat.give,wt=mat.want,ng=tot(gv),nw=tot(wt);
 const bi=gv.findIndex(x=>x>0),bj=wt.findIndex(x=>x>0),bank=T===k&&ng&&nw==1&&gv.filter(x=>x).length==1&&gv[bi]===R[bi]&&wt[bj]===1&&bi!==bj&&g.bank[bj]>0;
 const mo=myOffer();
 return `<div class="co-mat ui-card">
 <div class="co-mr1"><span class="co-ml">Das</span>${gv.map((n,i)=>`<button class="co-ch${n?'':' z'}" style="--bg:${CBG[i]};--bd:${CBD[i]}" onclick="COU.mg(${i},-1)" ${n?'':'tabindex="-1"'}>${rico(i)}<b>${n||''}</b><small>${R[i]}:1</small></button>`).join('')}</div>
 <div class="co-mr1"><span class="co-ml">Pides</span>${wt.map((n,i)=>`<button class="co-ch${n?'':' e'}" style="--bg:${CBG[i]};--bd:${CBD[i]}" onclick="COU.mw(${i},1)">${rico(i)}<b>${n||''}</b>${n?`<i onclick="event.stopPropagation();COU.mw(${i},-1)">−</i>`:''}</button>`).join('')}</div>
 <div class="co-mb">${mo?`<button class="ui-btn sec" onclick="COU.a({t:'cancel',id:${mo.id}})">Quitar oferta</button>`:''}
 <button class="ui-btn sec" ${bank?'':'disabled'} onclick="COU.banco(${bi},${bj})">Banco</button>
 <button class="ui-btn" ${ng&&nw&&!gv.some((x,i)=>x&&wt[i])?'':'disabled'} onclick="COU.ofrece()">${T===k?'Ofrecer':'Ofrecer a '+nm(T)}</button>
 <button class="ui-rb" onclick="COU.mat(0)" aria-label="Cerrar">${ico('x')}</button></div></div>`}
function descarte(){const g=G(),k=me();if(g.st!='discard'||!g.dis||g.dis[k]==null)return '';if(!dis)dis=[0,0,0,0,0];const n=g.dis[k],t=tot(dis);
 return `<div class="co-dis ui-card"><div class="co-dt"><svg class="co-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/><circle class="v" cx="18" cy="18" r="15" style="stroke-dasharray:${(t/n*94.2).toFixed(1)} 94.2"/></svg><b>${t}/${n}</b></div>
 <div class="co-ls">${dis.map((x,i)=>x?`<button class="co-ch" style="--bg:${CBG[i]};--bd:${CBD[i]}" onclick="COU.dd(${i})">${rico(i)}<b>${x}</b></button>`:'').join('')||'<span class="co-sub">Toca tus cartas</span>'}</div>
 <button class="ui-btn" ${t===n?'':'disabled'} onclick="COU.a({t:'discard',r:COU.dis})">Descartar</button></div>`}
function cartaSheet(){if(!pk)return '';const g=G(),k=me(),c=pk.c,x=(g.dev[k]||[]).find(d=>d.c===c&&d.t!==g.tc),canP=c!='v'&&x&&!g.played&&mine()&&(g.st=='roll'||g.st=='main');
 const need=c=='a'?2:c=='m'?1:0,ready=pk.r.length===need;
 return `<div class="ui-scrim" onclick="COU.dev(null)"></div><div class="co-dvs ui-card"><div class="co-dvb" style="--dc:${DEVC[c]}"><span>${DEVN[c]}</span></div><p>${DEVT[c]}</p>
 ${canP&&need?`<div class="co-ls">${[0,1,2,3,4].map(i=>`<button class="co-ch${pk.r.includes(i)?' on':''}" style="--bg:${CBG[i]};--bd:${CBD[i]}" onclick="COU.pr(${i})">${rico(i)}${pk.r.filter(r=>r===i).length>1?'<b>2</b>':''}</button>`).join('')}</div>`:''}
 <div class="co-mb"><button class="ui-btn sec" onclick="COU.dev(null)">Cerrar</button>${canP?`<button class="ui-btn" ${ready?'':'disabled'} onclick="COU.juega()">Jugar</button>`:''}</div></div>`}
function final(){const g=G(),w=g.win,ks=g.players.map((p,k)=>k).sort((a,b)=>g.vp[b]-g.vp[a]),mx=Math.max(1,...g.stats.dice);
 const src=k=>{let p=0,u=0;g.vt.forEach((t,v)=>{if(g.vo[v]===k){if(t=='p')p++;if(t=='u')u++}});const pv=(g.dev[k]||[]).filter(c=>c.c=='v').length;
  return [[pzs('p',k),p],[pzs('u',k),u*2],[medal('lr'),g.lr===k?2:0],[medal('ga'),g.ga===k?2:0],[devCard('v',1,'mini'),pv]].filter(x=>x[1]).map(x=>`<span>${x[0]}<b>${x[1]}</b></span>`).join('')};
 return `<div class="co-fin ui-card${finX?' min':''}">${w>=0?M2D.retrato(w,'big','feliz'):''}<h2>${w>=0?(w===me()?'Ganaste':nm(w)+' gana'):'Fin de la partida'}</h2>
 <div class="co-ft">${ks.map((k,j)=>`<div class="${k===w?'w':''}" style="--d:${200+j*80}ms"><span class="co-pt">${M2D.retrato(k,'',k===w?'feliz':'')}<em style="background:${pc(k)}" class="${k%D.PCOL.length==2?'cl':''}">${g.vp[k]}</em></span><b>${nm(k)}</b><span class="co-src">${src(k)}</span></div>`).join('')}</div>
 <div class="co-dch">${g.stats.dice.slice(2).map((n,i)=>`<span style="--h:${(n/mx*100).toFixed(0)}%;--d:${400+i*40}ms" class="${i+2==7?'s':''}"><i></i><b>${i+2}</b><em>${n}</em></span>`).join('')}</div>
 <div class="co-mb"><button class="ui-btn sec" onclick="COU.finX()">${finX?'Ver resumen':'Ver la isla'}</button><button class="ui-btn" onclick="send({t:'reset'})">Nueva partida</button><button class="ui-btn sec" onclick="leave()">Salir</button></div></div>`}
// ---------- la mesa ----------
function mesa(){const g=G(),k=me(),n=g.players.length,ks=[];
 if(k>=0)for(let j=1;j<n;j++)ks.push((k+j)%n);else for(let j=0;j<n;j++)ks.push(j);
 if(g.phase==='final')return M2D.mesa({cls:'co2d fin',estilo:edl(),top:tira(),capa:`<div class="co-ui">${final()}</div>`,rules:GM.colonos.rules});
 const h=hint(),sp=spots();
 const capa=`<div class="co-ui${sp?' pick':''}"><div class="co-riv">${ks.map((x,j)=>`<div class="co-in" style="--d:${j*60}ms">${tag(x)}</div>`).join('')}</div>
 ${k>=0?mano()+`<div class="co-der">${tray()}${acciones()}</div>`:''}
 ${h?`<div class="co-hint ui-pill" role="status">${h}</div>`:''}${ofertas()}${mio()}${tapete()}${descarte()}${cartaSheet()}</div>`;
 return M2D.mesa({cls:'co2d',estilo:edl(),top:tira(),capa,rules:GM.colonos.rules})}
const edl=()=>`--edl:-${Math.min(9e4,Date.now()-t0)}ms`;
// el hueco del tablero: lo que no tapan la barra de arriba, los rivales, tu mano y la bandeja
function encaja(){const q=s=>document.querySelector('#app .co2d '+s),R=s=>{const e=q(s);return e?e.getBoundingClientRect():null};
 const top=R('.m2d-top'),riv=R('.co-riv'),man=R('.co-mano'),der=R('.co-der'),W=innerWidth,H=innerHeight,land=W>H*1.15;let i={t:top?top.bottom:0,r:8,b:8,l:8};
 if(land){if(riv)i.l=Math.max(i.l,riv.right+4);if(man)i.l=Math.max(i.l,man.right+4);if(der)i.r=Math.max(i.r,W-der.left+4)}
 else{if(riv&&riv.height)i.t=Math.max(i.t,riv.bottom);const b=[man,der].filter(Boolean).map(r=>r.top);if(b.length)i.b=Math.max(8,H-Math.min(...b))}
 if(G().phase==='final'&&!finX){const f=R('.co-fin');if(f){if(land)i.r=Math.max(i.r,W-f.left);else i.b=Math.max(i.b,H-f.top)}}
 CO2.fit({t:Math.round(i.t),r:Math.round(i.r),b:Math.round(i.b),l:Math.round(i.l)})}
// ---------- acciones ----------
const rr=()=>{if(typeof render=='function')render()},tick=()=>{if(typeof sfx=='function')sfx('tick')};
CO2.onTap=(w,id)=>{const sp=spots();if(!sp||sp.w!==w)return;if(gh&&gh.at===id){COU.ok();return}gh={w:w=='h'?'h':G().st=='setup'?(G().sv<0?'p':'c'):G().st=='roads'?'c':sel,at:id};tick();rr()};
const COU=window.COU={rico,pzs,
 async a(m){tick();const ok=await send(m);if(m.t=='discard'&&ok)dis=null;return ok},
 ok(){if(!gh)return;const x=gh;gh=null;if(x.w=='h')COU.a({t:'robber',h:x.at});else{COU.a({t:'build',w:x.w,at:x.at});if(G().st!='roads'&&G().st!='setup')sel=null}},
 cancel(){sel=null;gh=null;tick();rr()},
 tray(w){if(w=='d'){if(canB('d'))COU.a({t:'buy'});else if(typeof sfx=='function')sfx('bad');return}
  if(sel===w){sel=null;gh=null}else if(canB(w)){sel=w;gh=null;mat=null}else{if(typeof sfx=='function')sfx('bad');return}tick();rr()},
 fin(){sel=null;gh=null;mat=null;COU.a({t:'end'})},
 seat(k){const g=G();if(mine()&&g.st=='steal'&&(g.cand||[]).includes(k)){COU.a({t:'steal',v:k});return}
  const o=myOffer();if(o&&o.si.includes(k)){COU.a({t:'close',id:o.id,k});mat=null;return}},
 pile(i){const g=G(),k=me(),r=g.res[k];if(!r)return;
  if(dis&&g.st=='discard'&&g.dis&&g.dis[k]!=null){if(r[i]-dis[i]>0&&tot(dis)<g.dis[k]){dis[i]++;tick();rr()}return}
  if(mat){if(r[i]-mat.give[i]>0){mat.give[i]++;mat.want[i]=0;tick();rr()}return}
  if(g.st=='main'&&!gh){COU.mat();if(mat&&r[i]>0){mat.give[i]=1;mat.want[i]=0;rr()}}},
 dd(i){if(dis&&dis[i]>0){dis[i]--;tick();rr()}},
 get dis(){return dis},
 // el tapete: si te falta una sola carta para algo, ya la pide
 mat(v){if(v===0||(v==null&&mat)){mat=null;tick();rr();return}const g=G(),r=g.res[me()]||[0,0,0,0,0];mat={give:[0,0,0,0,0],want:[0,0,0,0,0]};sel=null;gh=null;
  for(const w of ['p','u','c','d']){const c=D.COST[w],miss=c.map((x,i)=>Math.max(0,x-r[i]));if(tot(miss)===1){mat.want=miss;break}}tick();rr()},
 mg(i,d){if(mat){mat.give[i]=Math.max(0,mat.give[i]+d);tick();rr()}},
 mw(i,d){if(!mat)return;mat.want[i]=Math.max(0,Math.min(9,mat.want[i]+d));if(mat.want[i])mat.give[i]=0;tick();rr()},
 banco(a,b){COU.a({t:'bank',give:a,get:b});mat=null},
 ofrece(){const m={t:'offer',give:mat.give.slice(),want:mat.want.slice(),to:-1};mat=null;COU.a(m)},
 dev(c){pk=c?{c,r:[]}:null;tick();rr()},
 pr(i){if(!pk)return;const need=pk.c=='a'?2:1;if(pk.r.length>=need)pk.r=need==1?[i]:[pk.r[1],i];else pk.r.push(i);tick();rr()},
 juega(){const c=pk.c,m={t:'play',c};if(c=='a')m.r=pk.r.slice();if(c=='m')m.r=pk.r[0];pk=null;COU.a(m)},
 finX(){finX=!finX;tick();rr()}};
// ---------- enganche con game.js ----------
GM.colonos.body=function(){if(!active())return b0();try{
  const g=G();if(!on){on=true;t0=Date.now();finX=false;CO2.show(true)}
  const key=g.st+'|'+g.tc;if(key!==lastSt){lastSt=key;gh=null;if(g.st!='main'&&g.st!='sbp')sel=null;if(g.st!='discard')dis=null;if(g.st!='main')mat=null}
  if(sel&&!canB(sel))sel=null;pk=pk&&(g.dev[me()]||[]).some(d=>d.c===pk.c)?pk:null;
  return mesa()}catch(e){console.warn('Colonos UI:',e);return b0()}};
GM.colonos.after=function(){if(!active()){off();return}const g=G(),sp=spots();
 CO2.sync(g,me(),{spots:sp,ghost:gh,col:pc(Math.max(0,me()))});requestAnimationFrame(encaja);
 document.documentElement.classList.add('coui');if(window.COFX)COFX.after(g,me())};
function off(){if(!on)return;on=false;sel=gh=mat=dis=pk=null;lastSt='';CO2.show(false);document.documentElement.classList.remove('coui');if(window.COFX)COFX.reset()}
setInterval(()=>{if(on&&!active())off()},400);
let rz=0;addEventListener('resize',()=>{if(!on)return;clearTimeout(rz);rz=setTimeout(()=>{if(active())rr()},120)});
})();
