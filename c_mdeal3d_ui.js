// c_mdeal3d_ui.js — MD3U: tarjetas de la interfaz Cálida de Monopoly Deal 3D (sin emojis). Usa el estado y las acciones de c_monopolydeal.js
// (mdSel, mdTg, mdSt, mdPay, mdDo, mdAsk, mdStealStart, mdPaySend…), así que la vista 2D y la 3D juegan igual.
// MD3U.caja() → la tarjeta de acción (responder, pagar, elegir rival o propiedad, o qué hacer con la carta elegida) · MD3U.pa() → aviso de la acción pendiente
// · MD3U.pips(k) → los sets de un jugador en cuadritos de color.
(function(){
if(typeof mdCAT=='undefined'||!window.UI)return;
const ic=n=>UI.ico(n),q=s=>String(s).replace(/'/g,'&#39;');
const B=(fn,t,cl)=>`<button class="ui-btn${cl?' '+cl:''}" onclick='${q(fn)}'>${t}</button>`;
const D=(m,t,cl)=>B('mdDo('+JSON.stringify(m)+')',t,cl);
const N=x=>`<span class="ui-sub md3n">${x}</span>`;
const tm=()=>V.G.pa&&V.G.pa.rem!=null?' · <b class="mdpat"></b>':'';
function caja(t,txt,btns,o){o=o||{};const img=o.id!=null?`<img class="md3ci" src="${MD3K.url(o.id)}" alt="">`:'';
 return `<div id="md3box" class="ui ui-card md3box" role="dialog" aria-label="${t.replace(/<[^>]+>/g,'').replace(/"/g,'')}"><div class="md3bh">${img}<h2 class="ui-h">${t}</h2>${o.x?`<button class="ui-x" onclick="${o.x}" aria-label="Cancelar">${ic('x')}</button>`:''}</div>${txt?`<p class="ui-sub md3bt">${txt}</p>`:''}<div class="md3bb">${btns}</div></div>`}
// responder a una acción en tu contra (o al «Di que no» que te dijeron)
function responde(){const G=V.G,pa=G.pa,i=V.me;if(!pa||i<0)return '';
 const x=pa.tg.find(y=>y.k==i),dn=G.hands[i].find(id=>mdCAT[id].k=='dino'),db=dn!=null?B(`send({t:'dino',id:${dn}})`,'Di que no','sec'):'';
 if(x&&x.st=='wait'&&mdSK(pa.k)){const d=pa.k=='deal'?'tu set '+mdCN[pa.col]+' completo':pa.k=='sly'?'tu '+esc(mdName(pa.take)):'tu '+esc(mdName(pa.take))+' a cambio de su '+esc(mdName(pa.give));
  return caja(`${nm(pa.by)} quiere ${d}`,'Nadie sabe si tienes «Di que no»'+tm(),B("send({t:'allow'})",'Permitir')+db)}
 if(x&&x.st=='wait'){const tot=mdAssets(i).reduce((a,id)=>a+mdCAT[id].v,0),sm=[...mdPay].reduce((a,id)=>a+mdCAT[id].v,0);
  return caja(`Pagas $${pa.amt}M a ${nm(pa.by)}`,`Toca cartas de tu banco o de tu mesa (se levantan). No hay cambio. ${tot<=pa.amt?'<b>No te alcanza: entrega todo.</b> ':''}Elegido: <b>$${sm}M</b> de $${pa.amt}M${tm()}`,
   B('mdPaySend()',ic('ok')+'Pagar',sm>=pa.amt||sm>=tot?'go':'')+B('mdPay=new Set(V.sug||[]);render()','Usar sugerido','sec')+db)}
 if(i==pa.by){const s=pa.tg.find(y=>y.st=='say');if(s)return caja(`${nm(s.k)} dijo «Di que no»`,'',(dn!=null?B(`send({t:'dino',id:${dn},k:${s.k}})`,'Responder con Di que no'):'')+B(`send({t:'accept',k:${s.k}})`,'Aceptar','sec'))}
 if(x&&x.st=='say')return caja('Dijiste «Di que no»','Esperando a '+nm(pa.by)+'…','');
 return ''}
function renta(id,c){const G=V.G,Ds=G.hands[V.me].filter(x=>mdCAT[x].k=='doble'),maxD=Math.max(0,Math.min(Ds.length,2,3-G.plays-1));if(mdDbl>maxD)mdDbl=maxD;
 const cols=(c.cs=='any'?[0,1,2,3,4,5,6,7,8,9]:c.cs).filter(x=>mdRentAmt(V.me,x)>0),dbs=Ds.slice(0,mdDbl),al=mdRivals();
 let h=maxD>0?`<div class="md3dbl"><span>Doble renta</span>${B('mdDbl=Math.max(0,mdDbl-1);render()','−','sec')}<b>×${1<<mdDbl}</b>${B(`mdDbl=Math.min(${maxD},mdDbl+1);render()`,'+','sec')}</div>`:'';
 return h+(cols.map(x=>{const amt=mdRentAmt(V.me,x)*(1<<mdDbl),m={t:'rent',id,col:x,doubles:dbs},sw=`<i class="md3sw" style="--c:${mdCC[x]}"></i>`;
  return c.cs=='any'&&al.length>1?B('mdAsk('+JSON.stringify(m)+')',`${sw}Cobrar ${mdCN[x]} · $${amt}M a…`):D(c.cs=='any'?{...m,tgt:al[0]}:m,`${sw}Cobrar ${mdCN[x]} · $${amt}M`)}).join('')||N('No tienes propiedades de esos colores para cobrar.'))}
// qué hacer con la carta elegida (de tu mano, un comodín de tu mesa o una casa suelta)
function menu(){const G=V.G;if(mdSel==null)return '';const id=mdSel,c=mdCAT[id],play=G.step=='play'&&G.plays<3&&!G.pa,okc=x=>c.cs!='any'||mdHasBase(G.tb[V.me][x]||[]),sw=x=>`<i class="md3sw" style="--c:${mdCC[x]}"></i>`;let b='';
 if(mdFrom=='t'){const cur=Object.keys(G.tb[V.me]).find(k=>G.tb[V.me][k].includes(id)),cost=c.cs=='any'&&mdHasBase(G.tb[V.me][cur]||[]);
  b=G.plays>=3?N('Ya usaste tus 3 jugadas: mueve comodines en tu siguiente turno.'):mdCols(c).filter(x=>x!=cur&&okc(x)).map(x=>D({t:'move',id,col:x},sw(x)+'A '+mdCN[x]+(cost?' (1 jugada)':''))).join('')||N('No hay otro color disponible (el multicolor necesita una propiedad en el destino).')}
 else if(G.step=='disc')b=D({t:'discard',id},ic('x')+'Descartar');
 else if(!play)b=N(G.pa?'Hay una acción pendiente: espera a que se resuelva.':'No te quedan jugadas: termina tu turno.');
 else if(c.t=='p')b=D({t:'prop',id},sw(c.c)+'Poner en mi mesa');
 else if(c.t=='w')b=mdCols(c).filter(okc).map(x=>D({t:'prop',id,col:x},sw(x)+'En '+mdCN[x])).join('')||N('El multicolor necesita antes una propiedad (o comodín de 2 colores) de ese color en tu mesa.');
 else{if(c.k=='salida')b+=D({t:'go',id},'Robar 2 cartas');
  if(c.k=='casa'||c.k=='hotel'){const cs=mdHcols(V.me,c.k);b+=cs.map(x=>D({t:c.k=='casa'?'house':'hotel',id,col:x},sw(x)+(c.k=='casa'?'Casa':'Hotel')+' en '+mdCN[x])).join('')||N(c.k=='casa'?'Necesitas un set completo sin casa (no ferrocarril ni servicio).':'Necesitas un set completo que ya tenga casa y aún no hotel.')}
  if(c.t=='r')b+=renta(id,c);
  if(c.k=='cobro'){const al=mdRivals();b+=al.length==1?D({t:'cobro',id,tgt:al[0]},'Cobrar $5M a '+esc(G.players[al[0]].name)):B(`mdAsk({t:'cobro',id:${id}})`,'Cobrar $5M a… (elige rival)')}
  if(c.k=='cumple')b+=D({t:'bday',id},'Cobrar $2M a cada uno');
  if(c.k=='doble')b+=N('Se juega junto con una carta de renta.');
  if(c.k=='dino')b+=N('Se usa para responder cuando te quieran cobrar o quitar algo.');
  if(['ladron','forzoso','tratosucio'].includes(c.k)){const kd={ladron:'sly',forzoso:'forced',tratosucio:'deal'}[c.k],ok=mdRivals().filter(k=>mdStealOk(kd,k));
   b+=ok.length?B(`mdStealStart('${kd}',${id})`,{sly:'Robar una propiedad',forced:'Intercambiar propiedades',deal:'Robar un set completo'}[kd]+(ok.length>1?' (elige rival)':' a '+esc(G.players[ok[0]].name))):N('Nadie tiene algo que puedas tomar con esta carta.')}
  if(mdFrom!='l')b+=D({t:'bank',id},'Al banco $'+c.v+'M','sec')}
 return caja(esc(mdName(id)),'',b,{id,x:'mdSel=null;render()'})}
function caja0(){const G=V.G;if(G.phase!='play')return '';const r=responde();if(r)return r;
 if(mdTg)return caja('Elige un rival','Toca su nombre o su lugar en la mesa.',B('mdTg=null;render()','Cancelar','sec'),{x:'mdTg=null;render()'});
 if(mdSt){const m=mdSt.m,nx=nm(m.tgt),t=m.t=='deal'?`Toca el set completo de ${nx} que quieres robar.`:m.t=='sly'?`Toca la propiedad de ${nx} que quieres robar.`:m.take==null?`Toca la propiedad de ${nx} que quieres.`:`Ahora toca la tuya que le darás a ${nx}, o toca otra suya para cambiar.`;
  return caja(mdAN[mdCAT[m.id].k],t,B('mdSt=null;render()','Cancelar','sec'),{id:m.id,x:'mdSt=null;render()'})}
 return menu()}
// aviso de la acción pendiente (quién cobra o roba, y cómo va cada quien)
function pa(){const G=V.G,p=G.pa;if(!p||G.phase!='play')return '';const sk=mdSK(p.k),W={wait:sk?'debe responder':'debe pagar',say:'dijo «Di que no»',paid:sk?'listo':'pagó',no:'anulado'};
 const what=p.k=='sly'?'Ladrón: '+esc(mdName(p.take)):p.k=='forced'?'Trato forzoso: '+esc(mdName(p.take))+' por '+esc(mdName(p.give)):p.k=='deal'?'Trato sucio: set '+mdCN[p.col]:p.k=='rent'?'Renta de '+mdCN[p.col]:p.k=='cobro'?'Cobro':'Es mi cumpleaños';
 return `<div id="md3pa" class="ui md3pa" role="status"><b>${nm(p.by)}: ${what}${sk?'':' · $'+p.amt+'M'+(p.tg.length>1?' c/u':'')}</b>${p.tg.map(x=>`<span class="md3st ${x.st}">${chip(x.k)}${nm(x.k)} · ${W[x.st]}</span>`).join('')}${p.rem!=null?'<b class="mdpat"></b>':''}${V.host?B("send({t:'force'})",'Forzar pago','sec md3sm'):''}</div>`}
function pips(k){const tb=V.G.tb[k]||{};return Object.keys(tb).map(Number).filter(c=>tb[c].length).sort((a,b)=>a-b).map(c=>{const n=tb[c].length,f=mdCmp(tb[c],c);
 return `<i class="md3pip${f?' full':''}" style="--c:${mdCC[c]};--t:${mdLT[c]?'#111':'#fff'}" title="${mdCN[c]}">${Math.min(n,mdNEED[c])}/${mdNEED[c]}</i>`}).join('')}
window.MD3U={caja:caja0,pa,pips};
})();
