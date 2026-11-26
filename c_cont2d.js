// Continental 2D (K2D): la vista 2D del Continental sobre la mesa compartida (c_mesa2d.js). Se carga antes de c_continental3d.js para que la vista 3D la use como su vista 2D.
// El contrato son casillas para llenar, las bajadas quedan frente a cada asiento y se pega soltando la carta sobre ellas; el descarte se toma tocándolo o se tira soltando ahí.
(function(){
if(!window.M2D||!GM.continental)return;
const b0=GM.continental.body,ico=n=>UI.ico?UI.ico(n):'';
const giro=id=>({r:((id*47)%21)-10,x:((id*31)%9)-4,y:((id*17)%7)-3});
const MIN={T:3,C:4},AYU={T:'mismo número',C:'seguidas, mismo palo'};
function cc(c,o={}){const red=!c.j&&(c.s==1||c.s==2),pc=c.j?'':c.s==2?' pd':c.s==3?' pt':'',u=window.CCART&&CCART.url(c,{st:typeof scards!='undefined'?scards:'classic'});   // la cara es la imagen de c_cont_cartas.js (la misma que en 3D)
 return `<div class="c${red?' r':''}${pc}${c.j?' jk':''}${o.sel?' s':''}${o.nw?' nw':''}${o.cls?' '+o.cls:''}${u?` ucv" style="--ui:url(${u})`:''}"${o.id?` id="${o.id}"`:''}${o.did!=null?` data-id="${o.did}"`:''}${o.on?` onclick="${o.on}"`:''}>`+
 (c.j?'<b>★</b><small>JK</small>':`<b>${RN[c.r-1]}</b><small>${SU[c.s]}</small>`)+'</div>'}
// las casillas del contrato viven en staged (game.js); se preparan solas cada ronda mientras no te hayas bajado
let rnd=-1;
function prepara(G,i){if(i<0||G.down[i]){if(armando||staged.length){armando=false;staged=[]}return false}
 const tipos=CON[G.round];if(rnd!==G.round||staged.map(g=>g.type).join('')!==tipos){rnd=G.round;staged=tipos.split('').map(type=>({type,ids:[]}))}
 const en=new Set(G.hands[i]);staged.forEach(g=>{g.ids=g.ids.filter(x=>en.has(x))});armando=true;return true}
// cartas de tu mano que ya forman un trío o una corrida posibles (rayita de color debajo)
function grupos(L,tipos){const m=new Map();
 if(tipos.includes('T')){const pr={};L.forEach(c=>{if(!c.j)(pr[c.r]=pr[c.r]||[]).push(c.id)});Object.values(pr).forEach(a=>{if(a.length>=3)a.forEach(id=>m.set(id,'gt'))})}
 if(tipos.includes('C'))for(let s=0;s<4;s++){const ids={};L.forEach(c=>{if(!c.j&&c.s==s){ids[c.r]=c.id;if(c.r==1)ids[14]=c.id}});
  let run=[];for(let r=1;r<=15;r++){if(ids[r]!=null)run.push(ids[r]);else{if(run.length>=3)run.forEach(id=>{if(!m.has(id))m.set(id,'gc')});run=[]}}}
 return m}
window.k2put=function(k){if(Date.now()-noClick<300)return;const g=staged[k];if(!g||!sel.size)return;const ids=[...sel];
 staged.forEach(x=>{x.ids=x.ids.filter(z=>!sel.has(z))});g.ids.push(...ids);if(g.type=='C'){const a=runArr(g.ids.map(C));if(a)g.ids=a.map(c=>c.id)}
 sel=new Set();sfx('place');render()};
function pegarEn(k,id,x){const m=V.G.melds[k];if(!m)return;let end;
 if(C(id).j&&m.type=='C'){const e=document.querySelector(`.k2-meld[data-k="${k}"]`),r=e&&e.getBoundingClientRect();end=r&&x!=null&&x<r.left+r.width/2?'start':'end'}
 sel=new Set();send({t:'pegar',k,id,end})}
window.k2tapMeld=function(k){if(Date.now()-noClick<300)return;const ch=[...sel];if(ch.length!=1)return bad('Elige una carta y tócala aquí');
 if(C(ch[0]).j&&V.G.melds[k].type=='C'){window.k2jk=[k,ch[0]];render();return}pegarEn(k,ch[0])};
window.k2jkEnd=function(e){const [k,id]=window.k2jk||[];window.k2jk=null;if(e&&k!=null)send({t:'pegar',k,id,end:e});sel=new Set();render()};
// las bajadas: las de los rivales arriba (en el orden de sus asientos, con su color), las tuyas abajo y el mazo en medio; en flujo para que nunca se encimen
function bajadas(G,orden,i,pl){const por={};G.melds.forEach((m,k)=>{(por[m.owner]=por[m.owner]||[]).push(k)});
 const grupo=o=>por[o]?`<div class="k2-baj" style="--c:${COL[o%10]}" title="${esc(G.players[o].name)}">`+por[o].map(k=>{const m=G.melds[k];
  return `<div class="k2-meld${pl?' m2d-drop go':''}" data-k="${k}"${pl?` onclick="k2tapMeld(${k})"`:''}>${m.cards.map(x=>cc(C(x))).join('')}</div>`}).join('')+'</div>':'';
 return [orden.map(grupo).join(''),i>=0?grupo(i):'']}
function casillas(pl){const ok=staged.every(okSlot);
 return `<div id="mini" class="k2-arm"><div class="k2-desl ui-desl">`+staged.map((g,k)=>{const v=okSlot(g),n=g.ids.length;
  return `<div class="slot k2-slot${v?' ok':n?' no':''}${sel.size?' go':''}" data-k="${k}" onclick="k2put(${k})"><div class="k2-sl"><b>${TN[g.type]}</b><span>${v?ico('ok'):AYU[g.type]}</span></div>
  <div class="row" style="--min:${MIN[g.type]}">${g.ids.map(x=>cc(C(x),{did:x,on:`event.stopPropagation();tapSlot(${x})`})).join('')}</div></div>`}).join('')+'</div>'+
  `${pl&&ok?'<button class="ui-btn k2-bajar" onclick="bajar()">Bajarme</button>':''}</div>`}
const HINT_MS=9000;let hK='',hT=0,hTo=0;
function cuerpo(){const G=V.G;if(!G)return b0();
 if(G.phase=='end'||G.phase=='final')return fin(G);if(G.phase!='play')return b0();
 const i=V.me,t=G.turn,mine=i>=0&&i==t,dn=i>=0&&G.down[i],pl=mine&&G.step=='play',dr=mine&&G.step=='draw';
 const arm=prepara(G,i),hand=i>=0?disp():[],gr=arm?grupos(hand,CON[G.round]):new Map();
 const canBuy=i>=0&&!mine&&!G.tdc&&G.disc.length>0;
 const rv=M2D.rivales(1,1),[bR,bM]=bajadas(G,rv.map(r=>r[0]),i,pl);
 const seats=rv.map(([k,x,y])=>{const n=hc(k);return M2D.asiento(k,{x,y,turno:k==t,cuenta:n,fan:Math.min(n,10),alerta:n==1,tag:G.down[k]?'Bajado':''})});
 const dl=G.disc.slice(-3),top=G.disc[G.disc.length-1];
 const pila=dl.map((id,j)=>{const q=giro(id),last=j==dl.length-1;return `<div class="k2-d" style="--r:${q.r}deg;--x:${q.x}px;--y:${q.y}px">${cc(C(id),last?{id:'disc',nw:id!==prevTop,cls:dr?'go':'',on:dr?"draw('disc')":''}:{})}</div>`}).join('');
 const centro=`<div class="k2-mesa"><div class="k2-ri">${bR}</div><div class="k2-piles"><div class="k2-pila"><div class="c bk${dr?' go':''}" id="deck"${dr?` onclick="draw('deck')"`:''}></div><small>${G.deck}</small></div>
 <div class="k2-pila"><div class="k2-desc${pl?' m2d-drop':''}" data-d="disc">${pila}</div>${canBuy?`<button class="k2-buy${V.claim?' on':''}" onclick="${V.claim?"send({t:'unbuy'})":'comprar()'}">${V.claim?'Cancelar compra':'Comprar +1'}</button>`:''}</div></div><div class="k2-mi">${bM}</div></div>`;
 let st=i<0?mirTxt():!mine?'Turno de <b>'+nm(t)+'</b>'+(canBuy&&!V.claim?' · puedes comprar el descarte':V.claim?' · pediste el descarte':''):dr?'Roba del mazo o toma el descarte':
  dn?'Pega cartas en la mesa o suelta una en el descarte':staged.every(okSlot)?'Contrato listo: bájate o descarta':'Llena tu contrato o descarta una carta';
 if(i>=0){const tk=G.round+'-'+t+'-'+G.step;if(tk!==hK){hK=tk;hT=Date.now();clearTimeout(hTo);if(mine)hTo=setTimeout(()=>{if(document.querySelector('#app .k2'))render()},HINT_MS)}
  if(!mine||Date.now()-hT<HINT_MS)st=''}if(msg)st=esc(msg);   // la sugerencia sale solo si tardas; lo que hicieron los demás ya sale en su globito
 let acc='';if(pl&&V.pend)acc+=`<button class="ui-btn sec" onclick="send({t:'undoswap'})">Deshacer</button>`;
 if(pl&&sel.size==1)acc+=`<button class="ui-btn" onclick="discard()">Descartar</button>`;
 const mano=(arm?casillas(pl):'')+(i>=0?M2D.abanico(hand.map(c=>({h:cc(c,{did:c.id,sel:sel.has(c.id),nw:prevHand.size&&!prevHand.has(c.id),on:`tog(${c.id})`}),cls:gr.get(c.id)||''}))):'');
 const jk=window.k2jk?`<div class="k2-jk"><div><b>¿Dónde va el comodín?</b><div class="m2d-bts"><button class="ui-btn" onclick="k2jkEnd('start')">Al inicio</button><button class="ui-btn" onclick="k2jkEnd('end')">Al final</button><button class="ui-btn ghost" onclick="k2jkEnd()">Cancelar</button></div></div></div>`:'';
 const v3=window.c3dToggle?UI.dim(0,'M2D.menu(0);c3dToggle()'):'';
 M2D.suelta=pl?((id,el,e)=>{staged.forEach(g=>{g.ids=g.ids.filter(z=>z!=id)});
  if(el&&el.dataset.k!=null)return pegarEn(+el.dataset.k,id,e&&e.clientX);sel=new Set([id]);discard()}):null;
 M2D.teclas=k=>{if(dr&&(k==' '||k=='r')){draw('deck');return 1}if(dr&&k=='d'){draw('disc');return 1}
  if(pl&&k=='Enter'&&sel.size==1){discard();return 1}if(pl&&k=='b'&&arm&&staged.every(okSlot)){bajar();return 1}
  if(k=='c'&&canBuy){V.claim?send({t:'unbuy'}):comprar();return 1}if(k=='o'){cyc();return 1}if(k=='Escape'&&sel.size){sel=new Set();render();return 1}};
 return M2D.mesa({cls:'k2'+(mine?' tu':''),redonda:1,domo:1,estilo:M2D.fieltro('continental'),
  top:`<div class="ui-pill k2-st"><b><span class="m2d-sm">Ronda </span>${G.round+1}/7</b>${['T','C'].map(x=>{const n=CON[G.round].split(x).length-1;return n?`<span class="k2-ct">${TN[x]}${n>1?' ×'+n:''}</span>`:''}).join('')}</div>`,der:v3,
  seats,centro,capa:jk,hint:st,mine:mine&&!msg,yo:i>=0?M2D.yo(i,{turno:mine}):'',acc,
  ord:i>=0?`<button class="ui-btn ghost m2d-ord" onclick="cyc()">${ico(manual?'libre':sortS?'palo':'numero')}<span class="m2d-sm">${manual?'Mi orden':sortS?'Por palo':'Por número'}</span></button>`:'',mano,
  menu:typeof styleUI=='function'?`<details><summary>Estilo de cartas</summary>${styleUI()}</details>`:'',rules})}
// fin de ronda y fin de partida: tarjeta sobre la mesa con los puntos
function fin(G){const P=V.players,tot=G.players.map((_,k)=>G.scores.reduce((a,r)=>a+r[k],0)),fn=G.phase=='final';
 const ks=G.players.map((p,k)=>k).sort((a,b)=>(!!P[a].out-!!P[b].out)||tot[a]-tot[b]),w=fn?ks[0]:G.out,ult=G.scores[G.scores.length-1]||[];
 M2D.suelta=null;M2D.teclas=null;
 const bts=fn?`<button class="ui-btn" onclick="send({t:'reset'})">Nueva partida</button><button class="ui-btn sec" onclick="leave()">Salir</button>`:
  (V.me>=0?(G.rd[V.me]?'<span class="k2-esp">Esperando a los demás</span>':`<button class="ui-btn" onclick="send({t:'ready'})">${G.round>=6?'Ver resultado':'Listo'}</button>`):'')+(V.host?`<button class="ui-btn sec" onclick="send({t:'next'})">Siguiente ronda</button>`:'');
 return M2D.mesa({cls:'k2',redonda:1,domo:1,estilo:M2D.fieltro('continental'),der:window.c3dToggle&&!fn?UI.dim(0,'c3dToggle()'):'',
  capa:`<div class="m2d-fin">${w>=0?M2D.retrato(w,'big','feliz'):''}<h2>${fn?(w==V.me?'¡Ganaste la partida!':nm(w)+' gana'):(w==V.me?'¡Te quedaste sin cartas!':nm(w)+' cierra la ronda '+(G.round+1))}</h2>
  <div class="m2d-tab">${ks.map(k=>`<div class="${k==w?'w':''}">${M2D.retrato(k,'',k==w?'feliz':fn?'triste':'')}<b>${nm(k)}</b>${fn?'':`<span class="k2-r${G.rd[k]?' ok':''}">${G.rd[k]?ico('ok'):''}+${ult[k]||0}</span>`}<span>${P[k].out?'fuera':tot[k]+' pts'}</span></div>`).join('')}</div>
  <details class="k2-tabla"><summary>Puntos por ronda</summary>${table()}</details><div class="m2d-bts">${bts}</div></div>`,rules})}
GM.continental.body=cuerpo;
// globitos: lo importante sale del asiento de quien lo hizo (robar y descartar ya se ven en la mesa)
const ev0=GM.continental.ev;
GM.continental.ev=e=>{if(ev0)ev0(e);if(!document.querySelector('#app .m2d')||e.k==null)return;const t=e.t;
 if(/^(se bajó|compró|se quedó un comodín)/.test(t))M2D.reac(e.k,'feliz');if(/^(robó|descartó|tomó)/.test(t))return;
 M2D.bb(e.k,/^quiere/.test(t)?'¡Compro!':/^canceló/.test(t)?'Ya no compro':/^compró/.test(t)?'Compró el descarte':/^se bajó/.test(t)?'¡Me bajo!':t.charAt(0).toUpperCase()+t.slice(1),
  /^(quiere|compró)/.test(t)?'uno':/^se bajó/.test(t)?'bien':'')};
})();

// prepara de una en una las 53 caras del estilo elegido; al tener imágenes nuevas se vuelve a pintar la mesa 2D
if(window.CCART){let q=[];const sig=()=>{const c=q.shift();if(!c)return;CCART.url(c,{st:typeof scards!='undefined'?scards:'classic'});(window.requestIdleCallback||setTimeout)(sig)};
 for(let s=0;s<4;s++)for(let r=1;r<=13;r++)q.push({r,s});q.push({j:1});setTimeout(sig,600);
 CCART.alUrl(()=>{if(typeof render=='function'&&document.querySelector('#app .m2d')&&typeof gnow=='function'&&gnow()==='continental')render()})}
