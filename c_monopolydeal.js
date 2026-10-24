// Monopoly Deal: interfaz del cliente. Se registra en GM.monopolydeal. Reutiliza sala, chat, sonidos, animaciones y arrastre de game.js
const mdNEED=[2,3,3,3,3,3,3,2,4,2],mdRENT=[[1,2],[1,2,3],[1,2,4],[1,3,5],[2,3,6],[2,4,6],[2,4,7],[3,8],[1,2,3,4],[1,2]];
const mdCC=['#8b5a3c','#8fd3f4','#e45aa6','#f59a23','#d7263d','#f7d51d','#2e9e5b','#1f4aa8','#2b2b2b','#9ccf9a'],mdLT=[0,1,0,0,0,1,0,0,0,1];
const mdCN=['Café','Celeste','Rosa','Naranja','Rojo','Amarillo','Verde','Azul','Ferrocarril','Servicio'];
const mdAN={tratosucio:'Trato sucio',dino:'Di que no',ladron:'Ladrón',forzoso:'Trato forzoso',cobro:'Cobro',cumple:'Es mi cumpleaños',salida:'Pasa por la salida',casa:'Casa',hotel:'Hotel',doble:'Doble renta'};
const mdAI={tratosucio:'💥',dino:'🚫',ladron:'🥷',forzoso:'🔄',cobro:'💼',cumple:'🎂',salida:'🏁',casa:'🏠',hotel:'🏨',doble:'✖2'};
// Mazo oficial (106 cartas); idéntico al del servidor
const mdCAT=[],mdAdd=(n,o)=>{for(let i=0;i<n;i++)mdCAT.push({...o})};
[[1,6],[2,5],[3,3],[4,3],[5,2],[10,1]].forEach(([v,n])=>mdAdd(n,{t:'m',v}));
[[0,1,['Mediterráneo','Báltica']],[1,1,['Oriental','Vermont','Connecticut']],[2,2,['St. Charles','Virginia','States']],[3,2,['St. James','Tennessee','Nueva York']],
 [4,3,['Kentucky','Indiana','Illinois']],[5,3,['Atlantic','Ventnor','Marvin']],[6,4,['Pacific','N. Carolina','Pennsylvania']],[7,4,['Park Place','Boardwalk']],
 [8,2,['Reading','Penn.','B&O','Short Line']],[9,2,['Eléctrica','Agua']]].forEach(([c,v,ns])=>ns.forEach(n=>mdAdd(1,{t:'p',c,v,n})));
[[[7,6],4,1],[[1,0],1,1],[[3,2],2,2],[[4,5],3,2],[[6,8],4,1],[[1,8],4,1],[[8,9],2,1]].forEach(([cs,v,n])=>mdAdd(n,{t:'w',cs,v}));mdAdd(2,{t:'w',cs:'any',v:0});
[['tratosucio',5,2],['dino',4,3],['ladron',3,3],['forzoso',3,3],['cobro',3,3],['cumple',2,3],['salida',1,10],['casa',3,3],['hotel',4,2],['doble',1,2]].forEach(([k,v,n])=>mdAdd(n,{t:'a',k,v}));
[[0,1],[2,3],[4,5],[6,7],[8,9]].forEach(cs=>mdAdd(2,{t:'r',cs,v:1}));mdAdd(3,{t:'r',cs:'any',v:3});
const mdCols=c=>c.t=='p'?[c.c]:c.cs=='any'?[0,1,2,3,4,5,6,7,8,9]:c.cs;
const mdBg=c=>c.cs=='any'?'linear-gradient(90deg,#d7263d,#f7d51d,#2e9e5b,#1f4aa8)':`linear-gradient(90deg,${mdCC[c.cs[0]]} 50%,${mdCC[c.cs[1]]} 50%)`;
const mdWN=c=>c.cs=='any'?'multicolor':c.cs.map(x=>mdCN[x]).join(' / ');
const mdName=id=>{const c=mdCAT[id];return c.t=='m'?'Dinero $'+c.v+'M':c.t=='p'?c.n:c.t=='w'?'Comodín '+mdWN(c):c.t=='r'?'Renta '+mdWN(c):mdAN[c.k]};
function mdIn(id){const c=mdCAT[id],v=`<b class="mv">$${c.v}M</b>`;
 if(c.t=='m')return `<span class="mn">Dinero</span>${v}`;
 if(c.t=='p')return `<i class="mb" style="background:${mdCC[c.c]}"></i><span class="mn">${c.n}</span>${v}`;
 if(c.t=='w')return `<i class="mb" style="background:${mdBg(c)}"></i><span class="mn">Comodín ${mdWN(c)}</span>${v}`;
 if(c.t=='r')return `<i class="mb" style="background:${mdBg(c)}"></i><span class="mn">Renta ${mdWN(c)}</span>${v}`;
 return `<i class="ma">${mdAI[c.k]}</i><span class="mn">${mdAN[c.k]}</span>${v}`}
const mdCls=id=>'c md m'+mdCAT[id].t;
function mdc(id,o={}){return `<div class="${mdCls(id)}${o.sel?' s':''}${o.sm?' sm':''}${o.nw?' nw':''}"${o.id?` id="${o.id}"`:''}${o.did!=null?` data-id="${o.did}"`:''}${o.on?` onclick="${o.on}"`:''}>${mdIn(id)}</div>`}
const mdKey=id=>{const c=mdCAT[id];return c.t=='p'?c.c:c.t=='w'?10+(c.cs=='any'?9:c.cs[0]):c.t=='m'?30+c.v:c.t=='a'?60:80};
const mdDisp=h=>[...h].sort(manual?(a,b)=>oi({id:a})-oi({id:b}):sortS?(a,b)=>mdCAT[b].v-mdCAT[a].v||mdKey(a)-mdKey(b):(a,b)=>mdKey(a)-mdKey(b)||a-b);
// Regla de la casa: un grupo necesita al menos una propiedad o comodín de 2 colores (no solo multicolor)
const mdHasBase=cs=>cs.some(x=>{const c=mdCAT[x];return c.t=='p'||c.cs!='any'});
const mdCmp=(cs,col)=>!!cs&&cs.length>=mdNEED[col]&&mdHasBase(cs);
const mdSets=k=>{const tb=V.G.tb[k];return Object.keys(tb).filter(c=>mdCmp(tb[c],c)).length};
const mdRentAmt=(k,col)=>{const G=V.G,g=G.tb[k][col];if(!g||!mdHasBase(g))return 0;const s=(G.hs[k]||{})[col]||{};return mdRENT[col][Math.min(g.length,mdNEED[col])-1]+(s.h!=null?3:0)+(s.hh!=null?4:0)};
const mdRivals=()=>V.G.players.map((p,k)=>k).filter(k=>k!=V.me&&!V.players[k].out);
const mdAssets=k=>{const G=V.G;return [...G.bank[k],...Object.values(G.tb[k]).flat(),...Object.values(G.hs[k]||{}).flatMap(s=>[s.h,s.hh].filter(x=>x!=null)),...((G.hl&&G.hl[k])||[])]};
function mdPaying(){const pa=V.G.pa;return !!pa&&V.me>=0&&pa.tg.some(x=>x.k==V.me&&x.st=='wait')}
function mdPayTog(id){if(Date.now()-noClick<300)return;mdPay.has(id)?mdPay.delete(id):mdPay.add(id);render()}
async function mdPaySend(){const ok=await send({t:'pay',ids:[...mdPay]});if(ok){mdPay=new Set();render()}}
const mdAsk=m=>{mdTg=m;mdSel=null;render()};
let mdSel=null,mdFrom='h',mdOpen=-1,mdFold=false,mdDn=-1,mdTg=null,mdDbl=0,mdPay=new Set(),mdPaN=-1,mdPaEnd=0,mdPaV=null;
function mdPick(id){if(Date.now()-noClick<300)return;const G=V.G;if(V.me!=G.turn)return bad('No es tu turno.');if(Date.now()<cdEnd)return;mdSel=mdSel==id&&mdFrom=='h'?null:id;mdFrom='h';mdFold=false;render()}
function mdPickT(id){if(Date.now()-noClick<300)return;const G=V.G;if(V.me!=G.turn||G.step!='play'||G.pa)return;mdSel=mdSel==id&&mdFrom=='t'?null:id;mdFrom='t';mdFold=false;render()}
function mdPickL(id){if(Date.now()-noClick<300)return;const G=V.G;if(V.me!=G.turn||G.step!='play'||G.pa)return;mdSel=mdSel==id&&mdFrom=='l'?null:id;mdFrom='l';mdFold=false;render()}
const mdHcols=(k,kd)=>{const G=V.G,tb=G.tb[k],hs=G.hs[k]||{};return Object.keys(tb).map(Number).filter(c=>c<8&&tb[c].length>=mdNEED[c]&&(kd=='casa'?(hs[c]||{}).h==null:(hs[c]||{}).h!=null&&(hs[c]||{}).hh==null))};
const mdDo=m=>{mdSel=null;render();send(m)};
function mdGroups(k,mine){const G=V.G,tb=G.tb[k],cols=Object.keys(tb).map(Number).filter(c=>tb[c].length).sort((a,b)=>a-b),pay=k==V.me&&mdPaying(),po=x=>({sm:1,sel:mdPay.has(x),on:'mdPayTog('+x+')'});
 if(!cols.length)return '<div class="top">Sin propiedades todavía.</div>';
 return '<div class="mgs">'+cols.map(c=>{const ids=tb[c],need=mdNEED[c],full=mdCmp(ids,c),orph=!mdHasBase(ids),hs=(G.hs[k]||{})[c]||{},r=mdRentAmt(k,c),hx=[hs.h,hs.hh].filter(x=>x!=null);
  return `<div class="mg${full?' full':''}${orph?' orph':''}" style="--gc:${mdCC[c]};--gt:${mdLT[c]?'#111':'#fff'}"><div class="mgh"><b>${mdCN[c]}${hs.h!=null?' 🏠':''}${hs.hh!=null?'🏨':''}</b><span>${Math.min(ids.length,need)}/${need}${full?' ✓':''}</span></div><div class="pips">${Array.from({length:need},(_,j)=>`<u class="${j<ids.length?'on':''}"></u>`).join('')}</div><div class="mgc">${ids.map(x=>mdc(x,pay?po(x):{sm:1,sel:mine&&x==mdSel&&mdFrom=='t',on:mine&&mdCAT[x].t=='w'?`mdPickT(${x})`:''})).join('')}${hx.map(x=>mdc(x,pay?po(x):{sm:1})).join('')}</div><div class="mrent">${orph?'⚠ sin propiedad: no cuenta':'Renta $'+r+'M'}</div></div>`}).join('')+'</div>'}
function mdTbl(k,close){const G=V.G,lo=(G.hl&&G.hl[k])||[],o=V.players[k],bank=G.bank[k],tot=bank.reduce((a,x)=>a+mdCAT[x].v,0),mine=k==V.me&&G.turn==k&&G.step=='play'&&G.phase=='play'&&!G.pa,pay=k==V.me&&mdPaying(),po=x=>({sm:1,sel:mdPay.has(x),on:'mdPayTog('+x+')'});
 return `<div class="box mtb${k==G.turn&&G.phase=='play'?' on':''}${o.out?' out':''}" data-tbl="${k}" style="--c:${COL[k%10]}"><div class="mth">${chip(k)}<b>${nm(k)}${k==V.me?' (tú)':''}</b><span class="msets">Sets ${mdSets(k)}/${G.opts.sets}</span>${close?'<button class="b g sm2" onclick="mdOpen=-1;render()">✕</button>':''}</div>`
  +(o.out?'<div class="top">Expulsado.</div>':`<div class="mbank"><b>🏦 Banco $${tot}M</b> <span class="top">(${bank.length} cartas)</span><div class="mbc">${bank.map(x=>mdc(x,pay?po(x):{sm:1})).join('')}</div></div>${lo.length?`<div class="mbank"><b>🏠 Sueltas</b> <span class="top">(se colocan en un set completo)</span><div class="mbc">${lo.map(x=>mdc(x,pay?po(x):{sm:1,sel:mine&&x==mdSel&&mdFrom=='l',on:mine?`mdPickL(${x})`:''})).join('')}</div></div>`:''}${mdGroups(k,mine)}`)+'</div>'}
const mdBank=k=>V.G.bank[k].reduce((a,x)=>a+mdCAT[x].v,0);
// Tira compacta de un rival. Es tocable: hoy abre/cierra su mesa; en la Etapa 3 también elegirá a la víctima (mdTap).
function mdStrip(k){const G=V.G,o=V.players[k],tb=G.tb[k],on=G.phase=='play'&&G.turn==k,px=G.pa&&G.pa.tg.find(y=>y.k==k);
 const pips=Object.keys(tb).map(Number).filter(c=>tb[c].length).sort((a,b)=>a-b).map(c=>`<b class="mdp${tb[c].length>=mdNEED[c]?' full':''}" style="--gc:${mdCC[c]};--gt:${mdLT[c]?'#111':'#fff'}" title="${mdCN[c]}">${Math.min(tb[c].length,mdNEED[c])}/${mdNEED[c]}</b>`).join('');
 return `<div class="mdst${on?' on':''}${mdOpen==k?' open':''}${o.out?' out':''}${mdTg&&!o.out?' tgm':''}" data-seat="${k}" data-tbl="${k}" style="--c:${COL[k%10]}" onclick="mdTap(${k})">${chip(k)}<b class="mdn">${nm(k)}</b><i class="dot${o.on?' on':''}"></i><span class="mdi">🂠${hc(k)}</span><span class="mdi">⭐${mdSets(k)}/${G.opts.sets}</span><span class="mdi">🏦$${mdBank(k)}M</span>${px?`<span class="mdi">${{wait:'⏳',say:'🚫?',paid:'✅',no:'🚫'}[px.st]}</span>`:G.pa&&G.pa.by==k?'<span class="mdi">💥</span>':''}<span class="mdps">${o.out?'expulsado':pips}</span></div>`}
function mdTap(k){if(V.players[k].out)return;if(mdTg){const m={...mdTg,tgt:k};mdTg=null;mdDo(m);return}mdOpen=mdOpen==k?-1:k;render()}
function mdPA(){const G=V.G,pa=G.pa;if(!pa)return '';const by=nm(pa.by),W={wait:'⏳ debe pagar',say:'🚫 «Di que no» (¿responde '+by+'?)',paid:'✅ pagó',no:'🚫 anulado'},
 what=pa.k=='rent'?'Renta de '+mdCN[pa.col]:pa.k=='cobro'?'Cobro':'Es mi cumpleaños';
 return `<div class="mdpa"><b>💥 ${by}: ${what} · $${pa.amt}M${pa.tg.length>1?' a cada uno':''}</b>${pa.rem!=null?` <span class="mdpt">⏱ <b class="mdpat">${Math.max(0,Math.ceil((mdPaEnd-Date.now())/1000))} s</b></span>`:''}<div class="mdpx">${pa.tg.map(x=>`<span>${chip(x.k)}${nm(x.k)} ${W[x.st]}</span>`).join('')}</div>${V.host?`<button class="b g sm2" onclick="send({t:'force'})">Forzar pago automático</button>`:''}</div>`}
// panel de respuesta: pagar / Di que no / aceptar
function mdRespond(){const G=V.G,pa=G.pa,i=V.me;if(!pa||i<0)return '';
 const x=pa.tg.find(y=>y.k==i),dn=G.hands[i].find(id=>mdCAT[id].k=='dino'),db=dn!=null?`<button class="b g" onclick="send({t:'dino',id:${dn}})">🚫 Di que no</button>`:'';
 if(x&&x.st=='wait'){const tot=mdAssets(i).reduce((a,id)=>a+mdCAT[id].v,0),sm=[...mdPay].reduce((a,id)=>a+mdCAT[id].v,0);
  return `<div class="box mdm"><b>💸 Debes pagar $${pa.amt}M a ${nm(pa.by)}</b><div class="top">Toca cartas de tu banco o de tu mesa. No hay cambio. ${tot<=pa.amt?'<b>No te alcanza: entrega todo.</b> ':''}Elegido: <b>$${sm}M</b> de $${pa.amt}M${pa.rem!=null?' · ⏱ <b class="mdpat"></b>':''}</div><button class="b" onclick="mdPaySend()">Pagar</button><button class="b g" onclick="mdPay=new Set(V.sug||[]);render()">Usar sugerido</button>${db}</div>`}
 if(i==pa.by)return pa.tg.filter(y=>y.st=='say').map(y=>`<div class="box mdm"><b>🚫 ${nm(y.k)} dijo «Di que no»</b><div>${dn!=null?`<button class="b" onclick="send({t:'dino',id:${dn},k:${y.k}})">Responder con Di que no</button>`:''}<button class="b g" onclick="send({t:'accept',k:${y.k}})">Aceptar</button></div></div>`).join('');
 if(x&&x.st=='say')return '<div class="box mdm top">Dijiste «Di que no». Esperando a '+nm(pa.by)+'…</div>';
 return ''}
const mdTgBox=()=>'<div class="box mdm"><b>🎯 Elige a quién cobrar</b><div class="top">Toca su tira arriba.</div><button class="b g sm2" onclick="mdTg=null;render()">Cancelar</button></div>';
function mdRentUI(id,c){const G=V.G,D=G.hands[V.me].filter(x=>mdCAT[x].k=='doble'),maxD=Math.max(0,Math.min(D.length,2,3-G.plays-1));if(mdDbl>maxD)mdDbl=maxD;
 const cols=(c.cs=='any'?[0,1,2,3,4,5,6,7,8,9]:c.cs).filter(x=>mdRentAmt(V.me,x)>0),dbs=D.slice(0,mdDbl),al=mdRivals();
 let h=maxD>0?`<div class="top">Doble renta: <button class="b g sm2" onclick="mdDbl=Math.max(0,mdDbl-1);render()">−</button> <b>×${1<<mdDbl}</b> <button class="b g sm2" onclick="mdDbl=Math.min(${maxD},mdDbl+1);render()">+</button></div>`:'';
 return h+(cols.map(x=>{const amt=mdRentAmt(V.me,x)*(1<<mdDbl),m={t:'rent',id,col:x,doubles:dbs};
  return c.cs=='any'&&al.length>1?`<button class="b" onclick='mdAsk(${JSON.stringify(m)})'>Cobrar ${mdCN[x]} · $${amt}M a…</button>`:`<button class="b" onclick='mdDo(${JSON.stringify(c.cs=='any'?{...m,tgt:al[0]}:m)})'>Cobrar ${mdCN[x]} · $${amt}M</button>`}).join('')||'<div class="top">No tienes propiedades de esos colores para cobrar.</div>')}
function mdTables(){const G=V.G,ord=[...G.players.keys()];if(V.me>0){ord.splice(V.me,1);ord.unshift(V.me)}return ord.map(mdTbl).join('')}
function mdMenu(){const G=V.G;if(mdTg)return mdTgBox();if(mdSel==null)return '';const id=mdSel,c=mdCAT[id],play=G.step=='play'&&G.plays<3&&!G.pa,okc=x=>c.cs!='any'||mdHasBase(G.tb[V.me][x]||[]),B=(m,t,cl)=>`<button class="b${cl||''}" onclick='mdDo(${JSON.stringify(m)})'>${t}</button>`;let b='';
 if(mdFrom=='t'){const cur=Object.keys(G.tb[V.me]).find(k=>G.tb[V.me][k].includes(id));b=mdCols(c).filter(x=>x!=cur&&okc(x)).map(x=>B({t:'move',id,col:x},'→ '+mdCN[x])).join('')||'<span class="top">No hay otro color disponible (el multicolor necesita una propiedad en el destino).</span>'}
 else if(G.step=='disc')b=B({t:'discard',id},'Descartar');
 else if(!play)b='<span class="top">'+(G.pa?'Hay una acción pendiente: espera a que se resuelva.':'No te quedan jugadas: termina tu turno.')+'</span>';
 else if(c.t=='p')b=B({t:'prop',id},'Poner en mi mesa ('+mdCN[c.c]+')');
 else if(c.t=='w')b=mdCols(c).filter(okc).map(x=>B({t:'prop',id,col:x},'En '+mdCN[x])).join('')||'<span class="top">El multicolor necesita antes una propiedad (o comodín de 2 colores) de ese color en tu mesa.</span>';
 else{if(c.t=='a'&&c.k=='salida')b+=B({t:'go',id},'Pasa por la salida (robar 2)');
  if(c.t=='a'&&(c.k=='casa'||c.k=='hotel')){const cs=mdHcols(V.me,c.k);b+=cs.map(x=>B({t:c.k=='casa'?'house':'hotel',id,col:x},(c.k=='casa'?'Casa':'Hotel')+' en '+mdCN[x])).join('')||'<div class="top">'+(c.k=='casa'?'Necesitas un set completo sin casa (no ferrocarril ni servicio).':'Necesitas un set completo que ya tenga casa y aún no hotel.')+'</div>'}
  if(c.t=='r')b+=mdRentUI(id,c);
  if(c.t=='a'&&c.k=='cobro'){const al=mdRivals();b+=al.length==1?B({t:'cobro',id,tgt:al[0]},'Cobrar $5M a '+esc(G.players[al[0]].name)):`<button class="b" onclick="mdAsk({t:'cobro',id:${id}})">Cobrar $5M a… (elige rival)</button>`}
  if(c.t=='a'&&c.k=='cumple')b+=B({t:'bday',id},'Es mi cumpleaños · $2M de cada uno');
  if(c.t=='a'&&c.k=='doble')b+='<div class="top">Se juega junto con una carta de renta.</div>';
  if(c.t=='a'&&c.k=='dino')b+='<div class="top">Se usa para responder cuando te quieran cobrar o quitar algo.</div>';
  if(mdFrom!='l')b+=B({t:'bank',id},'Al banco $'+c.v+'M',' g');if(c.t=='a'&&!['salida','casa','hotel','cobro','cumple','doble','dino'].includes(c.k))b+='<div class="top">Esta acción se activa en la siguiente entrega; por ahora va al banco.</div>'}
 return `<div class="box mdm"><div class="mdmh">${mdc(id,{sm:1})}<b>${esc(mdName(id))}</b></div>${b}<button class="b g sm2" onclick="mdSel=null;render()">Cancelar</button></div>`}
function mdBody(){const G=V.G,i=V.me,t=G.turn,mine=i==t;
 if(mdDn!==G.dn){mdDn=G.dn;mdOpen=-1;mdFold=false;mdTg=null;mdPay=new Set()}
 if(mdPaV!==V){mdPaV=V;mdPaEnd=Date.now()+((G.pa&&G.pa.rem)||0)}
 {const pn=G.pa?G.pa.n:-1;if(pn!==mdPaN){mdPaN=pn;mdPay=new Set()}}
 if(G.phase=='final'){const w=G.win;return `<h1>🏆 ${w>=0?nm(w):'—'} gana</h1><div class="box" style="font-size:1.2em">${w>=0&&w==i?'¡Juntaste '+G.opts.sets+' sets completos! 🎉':'Juntó '+G.opts.sets+' sets completos.'}</div>${mdTables()}<button class="b" onclick="send({t:'reset'})">Nueva partida</button><button class="b g" onclick="leave()">Salir</button>${plist()}`}
 const h=i>=0?G.hands[i]:[];
 if(!mine||(mdFrom=='l'&&!((G.hl&&G.hl[i])||[]).includes(mdSel))||(mdFrom=='h'&&!h.includes(mdSel))||(mdFrom=='t'&&!(G.tb[i]&&Object.values(G.tb[i]).some(a=>a.includes(mdSel)))))mdSel=null;
 if(!mine||G.pa)mdTg=null;
 if(i>=0&&mdPay.size){const ok=new Set(mdAssets(i));mdPay=new Set([...mdPay].filter(x=>ok.has(x)))}
 if(mdOpen>=0&&(mdOpen==i||!V.players[mdOpen]||V.players[mdOpen].out))mdOpen=-1;
 const pl=mine&&G.step=='play'&&!G.pa,dis=mine&&G.step=='disc',left=3-G.plays,n=G.players.length,
  riv=i>=0?Array.from({length:n-1},(_,j)=>(i+1+j)%n):[...G.players.keys()];
 const st=G.pa?'Hay una acción pendiente: mira el aviso de arriba.':i<0?'Mirando como host.':dis?`Descarta ${h.length-7} carta${h.length-7>1?'s':''} para quedarte con 7.`:mine?`Te ${left==1?'queda':'quedan'} <b>${left}</b> jugada${left==1?'':'s'}. Toca una carta de tu mano.`:'Esperando a '+nm(t)+'…';
 const msgH=msg?`<div class="msg">${msg}</div>`:'';
 let o=`<div class="mdw${mdFold?' fold':''}"><div class="mdtop top${mine?' myturn':''}">Turno de <b>${nm(t)}</b>${mine?' (¡tú!)':''} · Jugadas ${G.plays}/3 · Gana quien junte <b>${G.opts.sets}</b> sets${G.note?'<br><b>'+esc(G.note)+'</b>':''}${mdPA()}</div>
 <div class="mdrs">${riv.map(mdStrip).join('')}${mdOpen<0&&riv.length?'<div class="top mdhint">Toca un rival para ver su mesa.</div>':''}</div>
 <div class="mdpl"><div class="box piles felt"><div class="pile"><small>Mazo (${G.deck})</small><div class="c bk" id="deck">🂠</div></div><div class="pile"><small>Descarte</small>${G.disc.length?mdc(G.disc[G.disc.length-1],{id:'disc',nw:G.disc[G.disc.length-1]!==prevTop}):'<div class="c md empty" id="disc"></div>'}</div><div class="top pstat">${st}</div></div>${logv()}${i<0?msgH:''}</div>
 <div class="mdmy">${i>=0?`<div id="mesa">${mdTbl(i)}</div>`:''}${mdOpen>=0?mdTbl(mdOpen,1):''}</div>`;
 if(i>=0)o+=`<div class="mdhw" data-seat="${i}">${msgH}${mdRespond()}${mdMenu()}<div class="mdhb"><b>Tus cartas (${h.length})</b>${pl?`<button class="b sm2" onclick="send({t:'end'})">${h.length>7?'Terminar (descartar '+(h.length-7)+')':'Terminar turno'}</button>`:''}<button class="b g sm2" onclick="cyc()">Orden: ${manual?'mío':sortS?'valor':'tipo'}</button><button class="b g sm2 mdfold" onclick="mdFold=!mdFold;render()">${mdFold?'▲ Mostrar':'▼ Plegar'}</button></div><div id="hand">${mdDisp(h).map(id=>mdc(id,{did:id,sel:id==mdSel&&mdFrom=='h',nw:prevHand.size&&!prevHand.has(id),on:`mdPick(${id})`})).join('')}</div></div>`;
 return o+`<div class="mdft"><button class="b g sm2" onclick="mute=!mute;render()">${mute?'🔇 Sonido':'🔊 Sonido'}</button><details><summary>Jugadores</summary>${plist()}</details>`+(V.host?`<button class="b g sm2" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">Cerrar sala</button>`:'')+mdRules+'</div></div>'}
const mdRules=`<details><summary>Reglas</summary>Gana quien primero junte <b>3 sets completos de colores distintos</b> (el host puede cambiarlo de 2 a 4). Cada turno robas 2 cartas (5 si te quedaste sin cartas), juegas hasta 3 cartas y al terminar descartas hasta quedarte con 7.<br><b>Qué puedes jugar:</b> dinero y acciones al banco (una acción en el banco ya no se recupera), propiedades a tu mesa por color, y comodines de propiedad en cualquiera de sus colores. Mover un comodín de color en tu mesa durante tu turno no cuenta como jugada. Un set está completo con: café 2, celeste 3, rosa 3, naranja 3, rojo 3, amarillo 3, verde 3, azul 2, ferrocarril 4, servicio 2. Todas las propiedades de un color se agrupan en un solo conjunto.<br><b>Pasa por la salida:</b> robas 2 cartas. El banco y la mesa de todos son visibles. <br><b>Casa y Hotel:</b> la Casa va en un set completo (no ferrocarril ni servicio) y suma $3M a la renta; el Hotel va en un set completo que ya tenga casa y suma $4M más. Cada uno cuenta como una jugada. No puedes sacar propiedades (ni mover comodines) de un set con casa hasta quitarla; al pagar, entrega primero el hotel y luego la casa. Una casa u hotel recibido en pago se conserva «suelto» y se coloca después.<br><b>Renta:</b> cobra a todos (carta de dos colores) o a un solo jugador (comodín de renta) según tus propiedades de ese color, más $3M por casa y $4M por hotel. Cada <b>Doble renta</b> multiplica por 2 (dos dobles = ×4) y cuenta como una jugada. <b>Cobro:</b> $5M a un jugador. <b>Es mi cumpleaños:</b> $2M de cada uno. Quien paga elige qué cartas entrega (banco o propiedades), sin cambio; si no le alcanza, entrega todo. <b>Di que no</b> anula la acción contra ti y se puede contestar con otro, en cadena (no cuenta como jugada). Con el <b>pago automático</b> activado, a los 60 s sin responder se paga con tus cartas más baratas (banco primero, comodines al final, sin romper sets completos si hay otra opción); si no, el host puede forzarlo.<br><b>Comodín multicolor:</b> puede haber varios juntos en un grupo, pero nunca un grupo solo de multicolores ni uno suelto: siempre al menos una propiedad o comodín de dos colores. Si te quitan la propiedad, el multicolor deja de contar hasta que lo muevas a otro grupo.<br>Ladrón, Trato forzoso y Trato sucio llegan en la siguiente entrega.</details>`;
function mdLobby(host){const o=V.opts||{},s=host?[2,3,4].map(n=>`<button class="b g sm2${o.sets==n?' on':''}" onclick="send({t:'opts',o:{sets:${n}}})">${n}</button>`).join(''):`<b>${o.sets}</b>`;
 return `<div class="box"><b>Reglas de esta sala</b><br>Sets completos para ganar: ${s}${host?'<div class="top">Oficial: 3 sets de colores distintos.</div>':''}<br>Pago automático (60 s): ${host?`<button class="b g sm2${o.autopay?' on':''}" onclick="send({t:'opts',o:{autopay:${!o.autopay}}})">${o.autopay?'Sí':'No'}</button>`:`<b>${o.autopay?'Sí':'No'}</b>`}${host?'<div class="top">Si alguien no responde en 60 s, el servidor paga por él con sus cartas más baratas. Si está en No, no hay límite y el host puede forzar.</div>':''}</div>`+(host?`<button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button>`:'')}
setInterval(()=>{document.querySelectorAll('.mdpat').forEach(e=>e.textContent=Math.max(0,Math.ceil((mdPaEnd-Date.now())/1000))+' s')},500);
GM.monopolydeal={name:'Monopoly Deal',emoji:'💰',max:5,rules:mdRules,lobby:mdLobby,body:mdBody,
 face:id=>({h:mdIn(id),cls:'md m'+mdCAT[id].t}),
 win:(n,fin)=>{const w=n.win;if(!fin||w<0)return;const me=w==V.me;sfx('win');banner(me?'🏆 ¡Ganaste!':'🏆 '+n.players[w].name+' ganó');confetti(me?90:35)},
 after:()=>{const G=V.G;if(G&&G.phase=='play'){prevHand=new Set(Array.isArray(G.hands[V.me])?G.hands[V.me]:[]);prevTop=G.disc[G.disc.length-1]}}};
