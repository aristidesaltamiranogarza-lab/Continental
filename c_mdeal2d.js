// Monopoly Deal 2D (MD2): la vista 2D de Monopoly Deal sobre la mesa compartida (c_mesa2d.js). Se carga antes de c_mdeal3d.js para que la vista 3D la use como su vista 2D.
// Tu mesa va en el fieltro frente a ti: el banco como billetes encimados y las propiedades en columnas por color (2/3, renta). Arrastra una carta al banco, a tus
// propiedades o al centro (acción); tocarla abre su tarjeta (MD3U, la misma del 3D). Los rivales muestran su banco y sus sets en el asiento; tocarlos abre su mesa.
// Usa el estado y las acciones de c_monopolydeal.js (mdSel, mdTg, mdSt, mdPay, mdDo…) y las caras de MD3K (con las ilustraciones de CARTA2D).
(function(){
if(!window.M2D||typeof GM=='undefined'||!GM.monopolydeal||typeof mdCAT=='undefined')return;
const MD=GM.monopolydeal,b0=MD.body,face0=MD.face,ev0=MD.ev,ico=n=>window.UI&&UI.ico?UI.ico(n):'';
const on2=()=>!!document.querySelector('#app .md2');
// ---------- caras: las de MD3K en chico, como blob (el HTML queda ligero) ----------
const IM={},Q=[],QS=new Set();let qOn=false,rT=0;
const lienzo=k=>k=='d'?MD3K.dorso():k[0]=='b'?MD3K.billete(+k.slice(1)):MD3K.cara(+k.slice(1));
function src(k){if(IM[k])return IM[k];if(window.MD3K&&!QS.has(k)){QS.add(k);Q.push(k);sigue()}return ''}
function sigue(){if(qOn||!Q.length)return;qOn=true;const k=Q.shift(),fin=()=>{QS.delete(k);qOn=false;if(Q.length)sigue();else repinta()};
 try{const s=lienzo(k),c=document.createElement('canvas');c.width=228;c.height=342;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(s,0,0,228,342);
  c.toBlob(b=>{if(b){if(IM[k])URL.revokeObjectURL(IM[k]);IM[k]=URL.createObjectURL(b)}fin()},'image/png')}catch(e){fin()}}
function repinta(){clearTimeout(rT);rT=setTimeout(()=>{if(!on2())return;if(typeof dg!='undefined'&&dg&&dg.on)return repinta();render()},40)}
// ya llegaron las caras ilustradas de las acciones: se vuelven a sacar
addEventListener('md3k-arte',()=>{Object.keys(IM).forEach(k=>{const c=k[0]=='c'&&mdCAT[+k.slice(1)];if(c&&c.t=='a'&&!QS.has(k)){QS.add(k);Q.push(k)}});sigue()});
const tono=id=>{const c=mdCAT[id];return c.t=='p'?mdCC[c.c]:c.t=='w'?(c.cs=='any'?'#c2512a':mdCC[c.cs[0]]):c.t=='m'?'#e2d3a4':(window.MD3K&&MD3K.ACOL[c.k])||'#5b4535'};
function cc(id,o={}){const u=src('c'+id);
 return `<div class="c m2c${o.sel?' s':''}${o.nw?' nw':''}${o.cls?' '+o.cls:''}"${o.id?` id="${o.id}"`:''}${o.did!=null?` data-id="${o.did}"`:''}${o.on?` onclick="${o.on}"`:''} data-c="${id}" aria-label="${esc(mdName(id))}" style="--k:${tono(id)}">${u?`<img src="${u}" alt="" draggable="false">`:''}</div>`}
function bi(id,o={}){const v=mdCAT[id].v,u=src('b'+v),bl=window.MD3K&&MD3K.BILL&&MD3K.BILL[v];
 return `<div class="m2bi${o.sel?' s':''}${o.nw?' nw':''}"${o.on?` onclick="${o.on}"`:''} aria-label="$${v}M" style="--k:${bl?bl[0]:'#efe6c8'}">${u?`<img src="${u}" alt="" draggable="false">`:`<b>${v}</b>`}</div>`}
const giro=id=>({r:((id*47)%25)-12,x:((id*31)%9)-4,y:((id*17)%7)-3});
// ---------- lo que hay en la mesa de cada quien (para animar lo que acaba de llegar) ----------
let antes=null,antesDn=-1;
const nuevo=id=>!!antes&&!antes.has(id);
function enMesa(G){const s=new Set();G.players.forEach((p,k)=>{(G.bank[k]||[]).forEach(x=>s.add(x));Object.values(G.tb[k]||{}).forEach(a=>a.forEach(x=>s.add(x)));
 Object.values((G.hs&&G.hs[k])||{}).forEach(h=>{if(h.h!=null)s.add(h.h);if(h.hh!=null)s.add(h.hh)});((G.hl&&G.hl[k])||[]).forEach(x=>s.add(x))});return s}
// sets completos en cuadritos de su color (los que faltan, vacíos)
function metas(k){const G=V.G,tb=G.tb[k]||{},cs=Object.keys(tb).filter(c=>mdCmp(tb[c],c)).map(Number),n=Math.max(G.opts.sets,cs.length);
 return Array.from({length:n},(_,j)=>j<cs.length?`<i class="on" style="--c:${mdCC[cs[j]]}"></i>`:'<i></i>').join('')}
// el resumen del asiento de un rival: cada color como una barrita con sus casillas llenas
function minis(k){const tb=V.G.tb[k]||{};return Object.keys(tb).map(Number).filter(c=>tb[c].length).sort((a,b)=>a-b).map(c=>{const n=tb[c].length,need=mdNEED[c];
 return `<i class="m2s${mdCmp(tb[c],c)?' f':''}" style="--c:${mdCC[c]}">${'<u class="on"></u>'.repeat(Math.min(n,need))}${'<u></u>'.repeat(Math.max(0,need-n))}</i>`}).join('')}
// ---------- la mesa de un jugador: banco, casas sueltas y columnas por color ----------
function tabla(k,dz){const G=V.G,i=V.me,me=k==i,tb=G.tb[k]||{},hs=(G.hs&&G.hs[k])||{},lo=(G.hl&&G.hl[k])||[],bank=mdSortB(G.bank[k]||[]);
 const pay=me&&mdPaying(),pl=me&&G.phase=='play'&&G.turn==i&&G.step=='play'&&!G.pa,po=x=>({sel:mdPay.has(x),on:`mdPayTog(${x})`,cls:'pg'});
 const sv=!!mdSt&&mdSt.m.tgt==k,sg=!!mdSt&&me&&mdSt.m.t=='forced'&&mdSt.m.take!=null,pa=G.pa,rs=me&&!!pa&&mdSK(pa.k)&&pa.tg.some(y=>y.k==i&&y.st=='wait');
 const cols=Object.keys(tb).map(Number).filter(c=>tb[c].length).sort((a,b)=>a-b);
 const grupos=cols.map(c=>{const ids=tb[c],need=mdNEED[c],full=mdCmp(ids,c),orph=!mdHasBase(ids),h=hs[c]||{},hx=[h.h,h.hh].filter(x=>x!=null);
  const gs=sv&&mdSt.m.t=='deal'&&full,rg=rs&&pa.k=='deal'&&pa.col==c,ap=(sv&&mdSt.m.t=='deal'&&!full)||((sv&&mdSt.m.t!='deal')||sg)&&full;
  const op=x=>{if(pay)return po(x);if(sv&&mdSt.m.t!='deal')return full?{}:{sel:mdSt.m.take==x,on:`mdStTake(${x})`,cls:'pk'};if(sg)return full?{}:{on:`mdStGive(${x})`,cls:'pk'};
   if(rs&&pa.take==x)return {cls:'riesgo'};if(pl&&mdCAT[x].t=='w')return {sel:mdSel==x&&mdFrom=='t',on:`mdPickT(${x})`,cls:'mv'};return {}};
  const L=[...ids.map(x=>cc(x,{...op(x),nw:nuevo(x)})),...hx.map(x=>cc(x,pay?po(x):{nw:nuevo(x)}))];
  return `<div class="m2g${full?' full':''}${orph?' orph':''}${gs?' pk':''}${rg?' riesgo':''}${ap?' apag':''}${dz?' m2d-drop':''}" data-z="prop" data-col="${c}" style="--c:${mdCC[c]};--t:${mdLT[c]?'#2a1d16':'#fff'};--n:${L.length}"${gs?` onclick="mdStGrp(${c})"`:''}>
  <div class="m2gh">${Math.min(ids.length,need)}/${need}${full?ico('ok'):''}</div><div class="m2gc">${L.join('')}</div><div class="m2gr">${orph?'No cuenta':'$'+mdRentAmt(k,c)+'M'}</div></div>`}).join('');
 const tot=bank.reduce((a,x)=>a+mdCAT[x].v,0);
 const banco=`<div class="m2bk${dz?' m2d-drop':''}${pay&&bank.length?' pg':''}" data-z="bank" style="--n:${Math.max(bank.length,1)}"><div class="m2gh">$${tot}M</div><div class="m2bc">${bank.length?bank.map(x=>bi(x,pay?{sel:mdPay.has(x),on:`mdPayTog(${x})`}:{nw:nuevo(x)})).join(''):'<i class="m2vac">Banco</i>'}</div><div class="m2gr">${bank.length?bank.length+(bank.length==1?' billete':' billetes'):''}</div></div>`;
 const sueltas=lo.length?`<div class="m2g m2lo" style="--c:#8a6a4a;--t:#fff;--n:${lo.length}"><div class="m2gh">Sueltas</div><div class="m2gc">${lo.map(x=>cc(x,pay?po(x):{sel:pl&&mdSel==x&&mdFrom=='l',on:pl?`mdPickL(${x})`:'',cls:pl?'mv':'',nw:nuevo(x)})).join('')}</div><div class="m2gr">a un set</div></div>`:'';
 const vacio=cols.length?'':`<div class="m2g m2vg" data-z="prop"><div class="m2gh">&nbsp;</div><div class="m2gc"><i class="m2vac">${me?'Propiedades':'Nada aún'}</i></div><div class="m2gr"></div></div>`;
 const u=(bank.length?1+(bank.length-1)*(pay?.58:.28):1.2)+(lo.length?1:0)+(cols.length||1.9),it=1+(lo.length?1:0)+(cols.length||1);
 return `<div class="m2-tab ui-desl"><div class="m2-fila" style="--u:${u.toFixed(2)};--it:${it}">${banco}${sueltas}<div class="m2-props${dz?' m2d-drop':''}" data-z="prop">${grupos}${vacio}</div></div></div>`}
// ---------- la acción pendiente, al centro de la mesa ----------
function paB(){const p=V.G.pa;if(!p)return '';const sk=mdSK(p.k);
 const what=p.k=='sly'?'Ladrón':p.k=='forced'?'Trato forzoso':p.k=='deal'?'Trato sucio':p.k=='rent'?'Renta':p.k=='cobro'?'Cobro':'Es mi cumpleaños';
 const det=p.k=='sly'?esc(mdName(p.take)):p.k=='forced'?esc(mdName(p.take))+' por '+esc(mdName(p.give)):p.k=='deal'?'Set '+mdCN[p.col]:p.k=='rent'?mdCN[p.col]+' · $'+p.amt+'M'+(p.tg.length>1?' c/u':''):'$'+p.amt+'M'+(p.tg.length>1?' c/u':'');
 return `<div class="m2-pa"${p.k=='rent'||p.k=='deal'?` style="--c:${mdCC[p.col]}"`:''}>${M2D.retrato(p.by)}<div><b>${what}</b><span>${det}</span></div>${p.rem!=null?'<em class="mdpat"></em>':''}</div>`}
const TAG={wait:['Paga','Decide'],say:['Di que no','Di que no'],paid:['Pagó','Aceptó'],no:['Anulado','Anulado']};
// soltar una carta de tu mano: en el banco, en tus propiedades (o en un color) o al centro
function elige(id){mdSel=id;mdFrom='h';render()}
function suelta(id,el){const G=V.G,c=mdCAT[id],z=el&&el.dataset.z,col=el&&el.dataset.col!=null?+el.dataset.col:null;
 if(G.step=='disc')return mdDo({t:'discard',id});
 if(G.plays>=3)return bad('Ya usaste tus 3 jugadas: termina tu turno');
 if(z=='bank'){if(c.t=='p'||c.t=='w')return bad('Las propiedades no van al banco');return mdDo({t:'bank',id})}
 if(c.t=='m')return mdDo({t:'bank',id});
 if(c.t=='p')return mdDo({t:'prop',id});
 if(c.t=='w'){const cs=mdCols(c).filter(x=>c.cs!='any'||mdHasBase(G.tb[V.me][x]||[]));
  if(col!=null&&cs.includes(col))return mdDo({t:'prop',id,col});if(cs.length==1)return mdDo({t:'prop',id,col:cs[0]});return elige(id)}
 if(c.k=='casa'||c.k=='hotel'){const cs=mdHcols(V.me,c.k);if(col!=null&&cs.includes(col))return mdDo({t:c.k=='casa'?'house':'hotel',id,col});if(cs.length==1)return mdDo({t:c.k=='casa'?'house':'hotel',id,col:cs[0]});return elige(id)}
 if(z=='centro'&&c.k=='salida')return mdDo({t:'go',id});
 if(z=='centro'&&c.k=='cumple')return mdDo({t:'bday',id});
 elige(id)}
window.md2Seat=function(k){const p=V.players[k];if(!p||p.out)return;if(mdTg)return mdTap(k);if(mdSt)return;mdOpen=mdOpen==k?-1:k;if(typeof sfx=='function')sfx('tick');render()};
window.md2End=function(){mdSel=null;send({t:'end'})};
// tocar una carta de una mesa (o del descarte) que no hace nada: se ve de cerca
function zoom(id){if(!window.MD3K||document.querySelector('.m2-zoom'))return;const z=document.createElement('div');z.className='m2-zoom';
 z.innerHTML=`<img src="${MD3K.grande(id)}" alt="${esc(mdName(id))}">`;z.onclick=()=>z.remove();document.body.appendChild(z);if(typeof sfx=='function')sfx('tick')}
addEventListener('keydown',e=>{const z=document.querySelector('.m2-zoom');if(z&&e.key=='Escape'){z.remove();e.stopPropagation()}},true);
document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('#app .md2 .m2-tab .m2c:not([onclick]), #app .md2 .m2-desc .m2c[data-c]');if(c&&!c.closest('.m2g.pk')&&!(Date.now()-noClick<300))zoom(+c.dataset.c)});
document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('#app .md2 .m2d-seat');if(s&&!(Date.now()-noClick<300))md2Seat(+s.dataset.seat)});
// ---------- la pantalla ----------
function orden(G){const i=V.me,t=G.turn,mine=i==t;   // lo mismo que pone en orden mdBody (carta elegida, pagos, rival elegido)
 if(mdDn!==G.dn){mdDn=G.dn;mdOpen=-1;mdTg=null;mdPay=new Set()}
 if(mdPaV!==V){mdPaV=V;mdPaEnd=Date.now()+((G.pa&&G.pa.rem)||0)}
 {const pn=G.pa?G.pa.n:-1;if(pn!==mdPaN){mdPaN=pn;mdPay=new Set()}}
 const h=i>=0?G.hands[i]:[];
 if(!mine||(mdFrom=='l'&&!((G.hl&&G.hl[i])||[]).includes(mdSel))||(mdFrom=='h'&&!h.includes(mdSel))||(mdFrom=='t'&&!(G.tb[i]&&Object.values(G.tb[i]).some(a=>a.includes(mdSel)))))mdSel=null;
 if(!mine||G.pa){mdTg=null;mdSt=null}
 if(i>=0&&mdPay.size){const ok=new Set(mdAssets(i));mdPay=new Set([...mdPay].filter(x=>ok.has(x)))}
 if(mdOpen>=0&&(mdOpen==i||!V.players[mdOpen]||V.players[mdOpen].out))mdOpen=-1}
function cuerpo(){const G=V.G;if(!G||(G.phase!='play'&&G.phase!='final'))return b0.apply(this,arguments);
 orden(G);if(G.phase=='final')return fin();
 if(antesDn!==G.dn){antesDn=G.dn;antes=null}
 const i=V.me,t=G.turn,mine=i>=0&&i==t,h=i>=0?G.hands[i]:[],pl=mine&&G.step=='play'&&!G.pa,dis=mine&&G.step=='disc',left=3-G.plays;
 const pa=G.pa,yoPa=pa&&i>=0&&pa.tg.find(y=>y.k==i);
 const ver=mdSt&&(mdSt.m.t!='forced'||mdSt.m.take==null)?mdSt.m.tgt:mdOpen;
 const seats=M2D.rivales(1,1).map(([k,x,y])=>{const p=V.players[k]||{},px=pa&&pa.tg.find(z=>z.k==k);
  const tag=px?TAG[px.st][mdSK(pa.k)?1:0]:pa&&pa.by==k?(mdSK(pa.k)?'Roba':'Cobra'):'';
  const s=M2D.asiento(k,{x,y,turno:k==t,cuenta:hc(k),tag,extra:`<div class="m2-ri" data-tbl="${k}"><b>$${mdBank(k)}M</b><span>${minis(k)}</span></div>`});
  const tg=mdTg&&!p.out?(mdTg.steal&&!mdStealOk(mdTg.t,k)?' no':' tg'):'';
  return s.replace('class="m2d-seat','class="m2d-seat'+tg+(ver==k?' ver':''))});
 const dl=G.disc.slice(-3),pila=dl.map((id,j)=>{const q=giro(id),last=j==dl.length-1;return `<div class="m2-d" style="--r:${q.r}deg;--x:${q.x}px;--y:${q.y}px">${cc(id,last?{id:'disc',nw:id!==prevTop}:{})}</div>`}).join('')||'<div class="c m2c m2hueco" id="disc"></div>';
 const dk=src('d');
 const centro=`<div class="m2-mesa${i<0?' solo':''}"><div class="m2-cen${pl||dis?' m2d-drop':''}" data-z="centro">
  <div class="m2-piles"><div class="m2-pila"><div class="c m2c m2dk" id="deck">${dk?`<img src="${dk}" alt="">`:''}</div><small>${G.deck}</small></div><div class="m2-pila m2-desc">${pila}</div></div>${paB()}</div>
  ${i>=0?`<div class="m2-mia" data-tbl="${i}">${tabla(i,pl)}</div>`:''}</div>`;
 const vp=ver>=0&&ver!=i&&V.players[ver]&&!V.players[ver].out?ver:-1;
 const verH=vp<0?'':`${mdSt?'':'<div class="m2-scr" onclick="mdOpen=-1;render()"></div>'}<div class="m2-ver${mdSt?' st':''}" style="--c:${COL[vp%10]}"><div class="m2-vh">${M2D.retrato(vp)}<div><b>${nm(vp)}</b><span>${mdSets(vp)}/${G.opts.sets} sets · ${hc(vp)} cartas</span></div>${mdSt?'':`<button class="ui-x" onclick="mdOpen=-1;render()" aria-label="Cerrar">${ico('x')}</button>`}</div><div class="m2-vb">${tabla(vp,false)}</div></div>`;
 const cj=window.MD3U?MD3U.caja():'',caja=cj?`<div class="m2-caja${vp>=0||mdTg?' abajo':''}${mdPaying()?' paga':''}">${cj}</div>`:'';
 let st=i<0?mirTxt():pa?(yoPa&&yoPa.st=='wait'?(mdSK(pa.k)?'Decide qué hacer':'Elige con qué pagar'):pa.by==i?'Esperando a que respondan':nm(pa.by)+' está cobrando'):
  dis?`Descarta ${h.length-7}: suelta en el centro`:!mine?'Turno de <b>'+nm(t)+'</b>':mdTg?'Toca a un rival':mdSt?'Elige en su mesa':mdSel!=null?'Elige qué hacer con la carta':
  left<=0?'Ya no te quedan jugadas':left==3?'Tu turno: arrastra cartas a tu mesa o tócalas':`Te ${left==1?'queda 1 jugada':'quedan '+left+' jugadas'}`;
 if(G.note)st='<b>'+esc(G.note)+'</b> · '+st;if(msg)st=esc(msg);
 const acc=pl?`<button class="ui-btn${left<=0?' m2-go':''}" onclick="md2End()">${h.length>7?'Terminar (descarta '+(h.length-7)+')':'Terminar turno'}</button>`:'';
 const mano=i>=0?M2D.abanico(mdDisp(h).map(id=>({h:cc(id,{did:id,sel:id==mdSel&&mdFrom=='h',nw:prevHand.size&&!prevHand.has(id),on:`mdPick(${id})`}),cls:mdSel!=null&&mdFrom=='h'&&id!=mdSel?'no':''}))):'';
 M2D.suelta=pl||dis?suelta:null;
 M2D.teclas=k=>{if(k=='Escape'){if(mdTg)mdTg=null;else if(mdSt)mdSt=null;else if(mdSel!=null)mdSel=null;else if(mdOpen>=0)mdOpen=-1;else return;render();return 1}
  if(k=='Enter'&&pl&&mdSel==null&&!mdTg&&!mdSt){md2End();return 1}if(k=='o'&&i>=0){cyc();return 1}};
 antes=enMesa(G);
 return M2D.mesa({cls:'md2'+(mine?' tu':''),redonda:1,domo:1,estilo:M2D.fieltro('monopolydeal'),
  top:`<div class="ui-pill m2-jug" title="Jugadas que quedan">${[0,1,2].map(j=>`<i class="${j<left?'on':''}"></i>`).join('')}<span class="m2d-sm">${mine?'Jugadas':esc(G.players[t].name)}</span></div>${i>=0?`<div class="ui-pill m2-meta" title="Sets completos">${metas(i)}<b>${mdSets(i)}/${G.opts.sets}</b></div>`:''}`,
  der:window.md3Toggle?UI.dim(0,'M2D.menu(0);md3Toggle()'):'',seats,centro,capa:verH+caja,hint:st,mine:mine&&!msg&&!pa,yo:i>=0?M2D.yo(i,{turno:mine}):'',acc,
  ord:i>=0?`<button class="ui-btn ghost m2d-ord" onclick="cyc()">${ico(manual?'libre':'ordenar')}<span class="m2d-sm">${manual?'Mi orden':sortS?'Por valor':'Por tipo'}</span></button>`:'',mano,rules:MD.rules})}
function fin(){const G=V.G,w=G.win,P=V.players,ks=G.players.map((p,k)=>k).sort((a,b)=>(!!P[a].out-!!P[b].out)||mdSets(b)-mdSets(a)||mdBank(b)-mdBank(a));
 M2D.suelta=null;M2D.teclas=null;
 return M2D.mesa({cls:'md2',redonda:1,domo:1,estilo:M2D.fieltro('monopolydeal'),der:window.md3Toggle?UI.dim(0,'md3Toggle()'):'',
  capa:`<div class="m2d-fin">${w>=0?M2D.retrato(w,'big','feliz'):''}<h2>${w>=0?(w==V.me?'¡Ganaste!':nm(w)+' gana'):'Fin de la partida'}</h2>${w>=0?`<div class="m2-fs">${metas(w)}</div>`:''}
  <div class="m2d-tab">${ks.map(k=>`<div class="${k==w?'w':''}">${M2D.retrato(k,'',w>=0?(k==w?'feliz':'triste'):'')}<b>${nm(k)}</b><span class="m2-fm">${P[k].out?'':metas(k)}</span><span>${P[k].out?'fuera':`$<i data-cnt="${mdBank(k)}">${mdBank(k)}</i>M`}</span></div>`).join('')}</div>
  <div class="m2d-bts"><button class="ui-btn" onclick="send({t:'reset'})">Nueva partida</button><button class="ui-btn sec" onclick="leave()">Salir</button></div></div>`,rules:MD.rules})}
MD.body=cuerpo;
// las cartas que vuelan (game.js fly) llevan las mismas caras
MD.face=id=>{if(!on2())return face0(id);const u=id<0?src('b'+(-id)):src('c'+id);return {h:u?`<img src="${u}" alt="">`:'',cls:'m2c'}};
MD.win=(n,fn)=>{const w=n.win;if(!fn||w<0)return;const me=w==V.me;sfx('win');banner(me?'¡Ganaste!':n.players[w].name+' ganó');confetti(me?90:35)};
// globitos: lo que hizo cada quien sale de su asiento
// caras: a quien le cobran o le roban se sorprende, el que paga se entristece, al robado le enoja; el que cobra o roba, feliz
const quien=t=>{const P=V.G.players;let b=-1;P.forEach((p,k)=>{if(t.includes(p.name)&&(b<0||p.name.length>P[b].name.length))b=k});return b};
MD.ev=e=>{if(ev0)ev0(e);if(!on2()||e.k==null)return;const t=e.t;let m='',c='',a;
 const pa=V.G.pa;if(/^jugó/.test(t)&&pa&&pa.by==e.k){M2D.reac(e.k,'feliz');pa.tg.forEach(x=>M2D.reac(x.k,'sorpresa',3000))}
 if(/^jugó Di que no/.test(t))M2D.reac(e.k,'feliz');else if(/^pagó/.test(t))M2D.reac(e.k,'triste');else if(/^le robó/.test(t)){M2D.reac(e.k,'feliz');M2D.reac(quien(t.replace(/^le robó .*? a /,'')),'enojo',3200)}
 if(/^jugó Di que no/.test(t)){m='¡Di que no!';c='malo'}
 else if(/^jugó Cobro/.test(t)){m='Cobro: $5M';c='uno'}
 else if(/^jugó Es mi cumpleaños/.test(t)){m='¡Es mi cumpleaños!';c='uno'}
 else if((a=t.match(/cobra \$(\d+)M de (\S+)/))){m='Renta '+a[2]+': $'+a[1]+'M';c='uno'}
 else if((a=t.match(/^jugó (Ladrón|Trato forzoso|Trato sucio)/))){m='¡'+a[1]+'!';c='malo'}
 else if((a=t.match(/^pagó.*?\$(\d+)M/))){m='Pagó $'+a[1]+'M'}
 else if(/^le robó/.test(t)){m=/set/.test(t)?'Se llevó un set':'Se llevó una propiedad';c='malo'}
 else if(/^jugó Pasa por la salida/.test(t))m='Roba 2';
 if(m)M2D.bb(e.k,m,c)};
})();
