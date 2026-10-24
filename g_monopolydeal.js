// Monopoly Deal: reglas en el servidor (módulo cargado por server.js).
// Etapa 1: robar, jugar hasta 3 cartas, banco, propiedades, comodines, descartar a 7, ganar con N sets.
// Estado: G.hands, G.bank[k]=[ids], G.tb[k]={color:[ids]} (propiedades por color), G.hs[k]={color:{h:id,hh:id}} (casa/hotel puestos), G.hl[k]=[ids] (casas/hoteles sueltos recibidos en pago), G.pa = acción pendiente (etapa 3)
const NEED=[2,3,3,3,3,3,3,2,4,2];        // tamaño del set por color
const RENT=[[1,2],[1,2,3],[1,2,4],[1,3,5],[2,3,6],[2,4,6],[2,4,7],[3,8],[1,2,3,4],[1,2]];
const CN=['café','celeste','rosa','naranja','rojo','amarillo','verde','azul','ferrocarril','servicio'];
// Mazo oficial de 106 cartas. t: m dinero, p propiedad, w comodín de propiedad, a acción, r renta
const CAT=[],add=(n,o)=>{for(let i=0;i<n;i++)CAT.push({...o})};
[[1,6],[2,5],[3,3],[4,3],[5,2],[10,1]].forEach(([v,n])=>add(n,{t:'m',v}));
[[0,1,['Mediterráneo','Báltica']],[1,1,['Oriental','Vermont','Connecticut']],[2,2,['St. Charles','Virginia','States']],[3,2,['St. James','Tennessee','Nueva York']],
 [4,3,['Kentucky','Indiana','Illinois']],[5,3,['Atlantic','Ventnor','Marvin']],[6,4,['Pacific','N. Carolina','Pennsylvania']],[7,4,['Park Place','Boardwalk']],
 [8,2,['Reading','Penn.','B&O','Short Line']],[9,2,['Eléctrica','Agua']]].forEach(([c,v,ns])=>ns.forEach(n=>add(1,{t:'p',c,v,n})));
[[[7,6],4,1],[[1,0],1,1],[[3,2],2,2],[[4,5],3,2],[[6,8],4,1],[[1,8],4,1],[[8,9],2,1]].forEach(([cs,v,n])=>add(n,{t:'w',cs,v}));add(2,{t:'w',cs:'any',v:0});
[['tratosucio',5,2],['dino',4,3],['ladron',3,3],['forzoso',3,3],['cobro',3,3],['cumple',2,3],['salida',1,10],['casa',3,3],['hotel',4,2],['doble',1,2]].forEach(([k,v,n])=>add(n,{t:'a',k,v}));
[[0,1],[2,3],[4,5],[6,7],[8,9]].forEach(cs=>add(2,{t:'r',cs,v:1}));add(3,{t:'r',cs:'any',v:3});
const AN={tratosucio:'Trato sucio',dino:'Di que no',ladron:'Ladrón',forzoso:'Trato forzoso',cobro:'Cobro',cumple:'Es mi cumpleaños',salida:'Pasa por la salida',casa:'Casa',hotel:'Hotel',doble:'Doble renta'};
const cs2=c=>c.cs=='any'?'multicolor':c.cs.map(x=>CN[x]).join('/');
const cname=id=>{const c=CAT[id];return c.t=='m'?'$'+c.v+'M':c.t=='p'?c.n:c.t=='w'?'comodín '+cs2(c):c.t=='r'?'renta '+cs2(c):AN[c.k]};
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const lg=(G,k,t,c)=>{(G.log=G.log||[]).push({k,t,c,n:G.ln=(G.ln||0)+1});if(G.log.length>12)G.log.shift()};
function pull(G){if(!G.deck.length&&G.disc.length){G.deck=shuf(G.disc);G.disc=[]}return G.deck.pop()}
function drawN(G,k,n){let g=0;while(g<n){const x=pull(G);if(x===undefined)break;G.hands[k].push(x);g++}return g}
const sets=(G,k)=>Object.keys(G.tb[k]).filter(c=>cmp(G.tb[k][c],c)).length;
const canColor=(c,col)=>Number.isInteger(col)&&col>=0&&col<=9&&(c.t=='p'?c.c==col:c.cs=='any'||c.cs.includes(col));
const hsIds=(G,k)=>Object.values(G.hs[k]).flatMap(s=>[s.h,s.hh].filter(x=>x!=null));
function checkWin(R,k){const G=R.G;if(G.phase=='play'&&sets(G,k)>=G.opts.sets){G.win=k;G.phase='final';G.pa=null}}
function startTurn(R){const G=R.G,k=G.turn;G.plays=0;G.step='play';G.pa=null;G.note='';const g=drawN(G,k,G.hands[k].length?2:5);lg(G,k,'robó '+g+' cartas')}
function nextTurn(R){const G=R.G,n=G.players.length;do{G.turn=(G.turn+1)%n}while(R.players[G.turn].out);G.tc++;startTurn(R)}
function deal(R){const G=R.G,n=R.players.length;G.deck=shuf([...Array(CAT.length).keys()]);G.disc=[];
 G.hands=R.players.map(p=>p.out?[]:G.deck.splice(0,5));G.bank=R.players.map(()=>[]);G.tb=R.players.map(()=>({}));G.hs=R.players.map(()=>({}));G.hl=R.players.map(()=>[]);
 do{G.turn=Math.floor(Math.random()*n)}while(R.players[G.turn].out);
 G.tc++;G.win=-1;G.log=[];G.dn=(G.dn||0)+1;G.rlUntil=Date.now();G.cdUntil=Date.now()+3000;R.pb=null;R.cl={};startTurn(R)}
function start(R){R.G={phase:'play',players:R.players.map(p=>({id:p.id,name:p.name})),round:0,scores:[],tc:0,opts:{sets:R.opts.sets,autopay:!!R.opts.autopay}};deal(R)}
function view(R,tok,me,now){const G=R.G,pa=G.pa;let sug;if(pa&&me>=0){const x=pa.tg.find(y=>y.k==me);if(x&&x.st=='wait')sug=autoIds(G,me,pa.amt)}
 const v={...G,pa:pa?{...pa,dl:undefined,rem:pa.dl?Math.max(0,pa.dl-now):null}:null,hands:G.hands.map((h,i)=>i==me?h:h.length),deck:G.deck.length,disc:G.disc.slice(-1),dc:G.disc.length,cd:Math.max(0,G.cdUntil-now),rc:0};
 delete v.rlUntil;delete v.cdUntil;return {G:v,claim:false,pend:false,sug}}
function kick(R,k){const G=R.G;G.disc.push(...G.hands[k],...G.bank[k],...Object.values(G.tb[k]).flat(),...hsIds(G,k),...G.hl[k]);G.hands[k]=[];G.bank[k]=[];G.tb[k]={};G.hs[k]={};G.hl[k]=[];
 const left=R.players.map((p,i)=>i).filter(i=>!R.players[i].out);
 if(left.length<2){G.phase='final';G.win=left[0]??-1;G.pa=null;return}
 if(G.pa){if(G.pa.by==k)G.pa=null;else{G.pa.tg=G.pa.tg.filter(x=>x.k!=k);settle(R,0)}}
 if(G.turn==k)nextTurn(R)}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),t=m.t;
 if(G.phase!='play')return 'La partida terminó.';
 if(t=='pay'||t=='dino'||t=='accept'||t=='force')return respond(R,i,tok,m);
 if(i<0||i!=G.turn)return 'No es tu turno.';
 if(Date.now()<G.cdUntil)return 'Espera a que termine la cuenta regresiva.';
 if(G.pa)return 'Hay una acción pendiente: espera a que se resuelva.';
 const h=G.hands[i],id=m.id;
 if(t=='discard'){if(G.step!='disc')return 'Solo descartas al terminar tu turno, si tienes más de 7 cartas.';if(!h.includes(id))return 'Jugada inválida.';
  G.hands[i]=h.filter(x=>x!=id);G.disc.push(id);lg(G,i,'descartó '+cname(id),id);if(G.hands[i].length<=7)nextTurn(R);return}
 if(G.step=='disc')return 'Tienes más de 7 cartas: descarta hasta quedarte con 7.';
 if(t=='end'){if(h.length>7){G.step='disc';return}nextTurn(R);return}
 if(t=='move'){const c=CAT[id],col=+m.col;let from=-1;for(const k in G.tb[i])if(G.tb[i][k].includes(id))from=+k;
  if(from<0||c.t!='w')return 'Solo puedes mover comodines que ya están en tu mesa.';if(!canColor(c,col))return 'Ese comodín no sirve para ese color.';if(col==from)return;
  const hf=G.hs[i][from],gf=G.tb[i][from],rem=gf.filter(x=>x!=id);if(hf&&hf.h!=null&&!cmp(rem,from))return 'Ese set tiene casa: no puedes sacarle propiedades hasta quitarla.';
  if(rem.length&&hasBase(gf)&&!hasBase(rem))return 'Dejarías un comodín multicolor sin propiedad en ese color.';
  if(c.cs=='any'&&!hasBase(G.tb[i][col]||[]))return 'El comodín multicolor necesita antes una propiedad (o comodín de dos colores) en ese color.';
  G.tb[i][from]=G.tb[i][from].filter(x=>x!=id);if(!G.tb[i][from].length)delete G.tb[i][from];(G.tb[i][col]=G.tb[i][col]||[]).push(id);
  lg(G,i,'movió '+cname(id)+' a '+CN[col],id);checkWin(R,i);return}
 if(G.plays>=3)return 'Ya jugaste 3 cartas este turno: termina tu turno.';
 if(t=='house'||t=='hotel'){const kd=t=='house'?'casa':'hotel',col=+m.col,L=G.hl[i],fl=L.includes(id),c=CAT[id];
  if(!c||c.t!='a'||c.k!=kd||!(fl||h.includes(id)))return 'Jugada inválida.';
  if(!Number.isInteger(col)||col<0||col>9)return 'Elige un color válido.';
  if(col>=8)return 'La casa y el hotel no van en ferrocarril ni servicio.';
  if(!cmp(G.tb[i][col],col))return 'Solo se pone en un set completo.';
  const s=G.hs[i][col]||{};
  if(t=='house'){if(s.h!=null)return 'Ese set ya tiene casa.';s.h=id}else{if(s.h==null)return 'El hotel necesita una casa en ese set.';if(s.hh!=null)return 'Ese set ya tiene hotel.';s.hh=id}
  G.hs[i][col]=s;if(fl)G.hl[i]=L.filter(x=>x!=id);else G.hands[i]=h.filter(x=>x!=id);
  G.plays++;lg(G,i,'puso '+AN[kd]+' en '+CN[col],id);return}
 if(!h.includes(id))return 'Jugada inválida.';const c=CAT[id];
 if(t=='rent'){if(c.t!='r')return 'Esa carta no es de renta.';const col=+m.col;
  if(!Number.isInteger(col)||col<0||col>9||!(c.cs=='any'||c.cs.includes(col)))return 'Esa carta no cobra ese color.';
  const base=rentAmt(G,i,col);if(!base)return 'No tienes propiedades de ese color.';
  const ds=Array.isArray(m.doubles)?m.doubles:[];if(ds.length>2||new Set(ds).size!=ds.length||!ds.every(x=>h.includes(x)&&CAT[x].t=='a'&&CAT[x].k=='doble'))return 'Doble renta inválida.';
  if(G.plays+1+ds.length>3)return 'No te alcanzan las jugadas: esa renta usa '+(1+ds.length)+'.';
  let tg=others(R,i);if(c.cs=='any'){const x=+m.tgt;if(!tg.includes(x))return 'Elige a quién cobrarle.';tg=[x]}
  const amt=base*(1<<ds.length);useCards(G,i,[id,...ds]);G.plays+=1+ds.length;
  lg(G,i,'jugó '+cname(id)+': cobra $'+amt+'M de '+CN[col]+(ds.length?' (×'+(1<<ds.length)+')':''),id);startPA(R,'rent',i,[id,...ds],amt,tg,col);return}
 if(t=='cobro'){if(c.k!='cobro')return 'Esa carta no es «Cobro».';const x=+m.tgt;if(!others(R,i).includes(x))return 'Elige a quién cobrarle.';
  useCards(G,i,[id]);G.plays++;lg(G,i,'jugó Cobro: $5M a '+G.players[x].name,id);startPA(R,'cobro',i,[id],5,[x]);return}
 if(t=='bday'){if(c.k!='cumple')return 'Esa carta no es «Es mi cumpleaños».';
  useCards(G,i,[id]);G.plays++;lg(G,i,'jugó Es mi cumpleaños: $2M de cada uno',id);startPA(R,'bday',i,[id],2,others(R,i));return}
 if(t=='bank'){if(c.t=='p'||c.t=='w')return 'Las propiedades no se guardan en el banco.';
  G.hands[i]=h.filter(x=>x!=id);G.bank[i].push(id);G.plays++;lg(G,i,'guardó '+cname(id)+' en el banco',id);return}
 if(t=='prop'){if(c.t!='p'&&c.t!='w')return 'Esa carta no es una propiedad.';const col=c.t=='p'?c.c:+m.col;if(!canColor(c,col))return 'Elige un color válido para ese comodín.';
  if(c.t=='w'&&c.cs=='any'&&!hasBase(G.tb[i][col]||[]))return 'El comodín multicolor necesita antes una propiedad (o comodín de dos colores) en ese color.';
  G.hands[i]=h.filter(x=>x!=id);(G.tb[i][col]=G.tb[i][col]||[]).push(id);G.plays++;lg(G,i,'puso '+cname(id)+' ('+CN[col]+')',id);checkWin(R,i);return}
 if(t=='go'){if(c.k!='salida')return 'Esa carta no es «Pasa por la salida».';
  G.hands[i]=h.filter(x=>x!=id);G.disc.push(id);G.plays++;lg(G,i,'jugó Pasa por la salida',id);const g=drawN(G,i,2);lg(G,i,'robó '+g+' cartas');return}
 return 'Acción desconocida.'}

// ---- Etapa 3a: pagos, rentas e interrupciones ----
const hasBase=cs=>cs.some(x=>{const c=CAT[x];return c.t=='p'||c.cs!='any'});   // regla de la casa: un grupo necesita al menos 1 propiedad o comodín de 2 colores (no solo multicolor)
const cmp=(cs,col)=>!!cs&&cs.length>=NEED[col]&&hasBase(cs);
const others=(R,i)=>R.players.map((p,k)=>k).filter(k=>k!=i&&!R.players[k].out);
const useCards=(G,i,ids)=>{G.hands[i]=G.hands[i].filter(x=>!ids.includes(x));G.disc.push(...ids)};
function rentAmt(G,k,col){const g=G.tb[k][col];if(!g||!hasBase(g))return 0;const s=G.hs[k][col]||{};return RENT[col][Math.min(g.length,NEED[col])-1]+(s.h!=null?3:0)+(s.hh!=null?4:0)}
function assets(G,k){const a=[];G.bank[k].forEach(id=>a.push({id,w:'b'}));
 for(const c in G.tb[k])G.tb[k][c].forEach(id=>a.push({id,w:'p',col:+c}));
 for(const c in G.hs[k]){const s=G.hs[k][c];[s.hh,s.h].forEach(id=>id!=null&&a.push({id,w:'h',col:+c}))}
 G.hl[k].forEach(id=>a.push({id,w:'l'}));return a}
const sumV=ids=>ids.reduce((a,x)=>a+CAT[x].v,0);
// sets con casa/hotel que se romperían si se entregan estas cartas sin entregar también su casa/hotel
function houseBad(G,k,ids){const bad=[];for(const c in G.hs[k]){const s=G.hs[k][c],g=G.tb[k][c]||[];
  if(g.some(x=>ids.includes(x))&&!cmp(g.filter(x=>!ids.includes(x)),c)&&((s.hh!=null&&!ids.includes(s.hh))||(s.h!=null&&!ids.includes(s.h))))bad.push(c);
  else if(s.hh!=null&&s.h!=null&&ids.includes(s.h)&&!ids.includes(s.hh))bad.push(c)}return bad}
const redundant=(G,k,ids,amt)=>ids.some(x=>{const t=ids.filter(y=>y!=x);return sumV(t)>=amt&&!houseBad(G,k,t).length});
function payErr(G,k,ids,amt){const A=assets(G,k),own=new Set(A.map(a=>a.id));
 if(!Array.isArray(ids)||new Set(ids).size!=ids.length||!ids.every(x=>own.has(x)))return 'Cartas inválidas.';
 const tot=sumV(A.map(a=>a.id));
 if(tot<=amt)return ids.length==A.length?'':'No te alcanza: debes entregar todo lo que tienes.';
 const s=sumV(ids);if(s<amt)return 'Te faltan $'+(amt-s)+'M.';
 if(houseBad(G,k,ids).length)return 'Ese set tiene casa u hotel: entrégalos antes que sus propiedades (primero el hotel, luego la casa).';
 if(redundant(G,k,ids,amt))return 'Estás entregando de más: quita cartas que no hacen falta (no hay cambio).';
 return ''}
// pago automático: lo más barato primero; banco antes que propiedades; comodines al final; sets completos al final
function autoIds(G,k,amt){const A=assets(G,k);if(sumV(A.map(a=>a.id))<=amt)return A.map(a=>a.id);
 const v=x=>CAT[x].v,asc=(a,b)=>v(a)-v(b)||a-b,isW=x=>CAT[x].t=='w'?1:0,bank=G.bank[k].slice().sort(asc),loose=G.hl[k].slice().sort(asc),inc=[],comp=[];
 for(const c in G.tb[k]){const g=G.tb[k][c],s=G.hs[k][c]||{},o=g.slice().sort((a,b)=>isW(a)-isW(b)||asc(a,b));
  if(cmp(g,c))comp.push({s:sumV(g),ids:[s.hh,s.h].filter(x=>x!=null).concat(o)});else inc.push(...o)}
 inc.sort((a,b)=>isW(a)-isW(b)||asc(a,b));comp.sort((a,b)=>a.s-b.s);
 let ids=[],s=0;for(const x of [...bank,...loose,...inc,...comp.flatMap(x=>x.ids)]){if(s>=amt)break;ids.push(x);s+=v(x)}
 for(let n=0;n<12;n++){const bad=houseBad(G,k,ids);if(!bad.length)break;for(const c of bad){const h=G.hs[k][c]||{};[h.hh,h.h].forEach(x=>{if(x!=null&&!ids.includes(x))ids.push(x)})}}
 for(let ch=1;ch;){ch=0;for(const x of ids.slice().reverse()){const t=ids.filter(y=>y!=x);if(sumV(t)>=amt&&!houseBad(G,k,t).length){ids=t;ch=1}}}
 return ids}
function xfer(G,from,to,ids){for(const id of ids){let q=G.bank[from].indexOf(id);
  if(q>=0){G.bank[from].splice(q,1);G.bank[to].push(id);continue}
  if(G.hl[from].includes(id)){G.hl[from]=G.hl[from].filter(x=>x!=id);G.hl[to].push(id);continue}
  let d=0;for(const c in G.tb[from])if(G.tb[from][c].includes(id)){G.tb[from][c]=G.tb[from][c].filter(x=>x!=id);if(!G.tb[from][c].length)delete G.tb[from][c];(G.tb[to][c]=G.tb[to][c]||[]).push(id);d=1;break}
  if(d)continue;
  for(const c in G.hs[from]){const s=G.hs[from][c];if(s.h==id)delete s.h;else if(s.hh==id)delete s.hh;else continue;if(s.h==null&&s.hh==null)delete G.hs[from][c];G.hl[to].push(id);break}}}
// si un set pierde su condición de completo, su casa y hotel quedan sueltos
function gcHs(G,k){for(const c in G.hs[k])if(!cmp(G.tb[k][c],c)){const s=G.hs[k][c];[s.h,s.hh].forEach(x=>x!=null&&G.hl[k].push(x));delete G.hs[k][c]}}
function armPA(R){const G=R.G,pa=G.pa;pa.n=(G.pn=(G.pn||0)+1);if(!G.opts.autopay){pa.dl=null;return}
 pa.dl=Date.now()+60000;const n=pa.n;setTimeout(()=>{const g=R.G;if(!g||g.phase!='play'||!g.pa||g.pa.n!==n)return;autoAll(R);if(R.poke)R.poke()},60300)}
function settle(R,reset){const G=R.G,pa=G.pa;if(!pa)return;if(pa.tg.every(x=>x.st=='paid'||x.st=='no')){G.pa=null;return}if(reset)armPA(R)}
function startPA(R,k,by,cards,amt,tgts,col){const G=R.G,tg=[];
 tgts.forEach(x=>{if(assets(G,x).length)tg.push({k:x,st:'wait',ch:0});else lg(G,x,'no tiene nada que pagar')});
 if(!tg.length)return;G.pa={k,by,cards,amt,col,tg};armPA(R)}
function doPay(R,x,ids,auto){const G=R.G,pa=G.pa,s=sumV(ids);xfer(G,x.k,pa.by,ids);gcHs(G,x.k);x.st='paid';
 lg(G,x.k,(auto?'pagó automáticamente $':'pagó $')+s+'M a '+G.players[pa.by].name);checkWin(R,pa.by)}
function autoAll(R,only){const G=R.G,pa=G.pa;if(!pa)return;
 for(const x of pa.tg){if(only!==undefined&&x.k!=only)continue;
  if(x.st=='wait'){doPay(R,x,autoIds(G,x.k,pa.amt),1);if(!G.pa)return}else if(x.st=='say'){x.st='no';lg(G,pa.by,'aceptó el «Di que no» de '+G.players[x.k].name)}}
 settle(R,0)}
function respond(R,i,tok,m){const G=R.G,pa=G.pa,t=m.t;
 if(!pa)return 'No hay ninguna acción pendiente.';
 if(t=='force'){if(R.host!=tok)return 'Solo el host puede forzar la respuesta.';autoAll(R,m.k===undefined?undefined:+m.k);return}
 if(i<0)return 'No participas en esta acción.';
 if(t=='pay'){const x=pa.tg.find(y=>y.k==i);if(!x||x.st!='wait')return 'No tienes que pagar ahora.';const e=payErr(G,i,m.ids,pa.amt);if(e)return e;doPay(R,x,m.ids);settle(R,0);return}
 if(t=='accept'){const x=pa.tg.find(y=>y.k==+m.k);if(i!=pa.by||!x||x.st!='say')return 'No hay ningún «Di que no» que aceptar.';x.st='no';lg(G,i,'aceptó el «Di que no» de '+G.players[x.k].name);settle(R,0);return}
 const id=m.id,h=G.hands[i];if(!h||!h.includes(id)||CAT[id].k!='dino')return 'Esa carta no es «Di que no».';
 const x=i==pa.by?pa.tg.find(y=>y.k==+m.k&&y.st=='say'):pa.tg.find(y=>y.k==i&&y.st=='wait');
 if(!x)return i==pa.by?'Nadie te ha dicho que no.':'Ahora no puedes responder.';
 G.hands[i]=h.filter(y=>y!=id);G.disc.push(id);x.ch++;
 if(i==pa.by){x.st='wait';lg(G,i,'jugó Di que no contra '+G.players[x.k].name,id)}
 else{x.st='say';lg(G,i,'jugó Di que no',id);if(!G.hands[pa.by].some(y=>CAT[y].k=='dino')){x.st='no';lg(G,pa.by,'no tiene cómo responder')}}
 settle(R,1);return}
const tick=R=>{const G=R.G;if(G&&G.phase=='play'&&G.pa&&G.pa.dl&&Date.now()>=G.pa.dl+500){autoAll(R);if(R.poke)R.poke()}};
module.exports={id:'monopolydeal',name:'Monopoly Deal',min:2,max:5,opts:{sets:3,autopay:false},rng:{sets:[2,4]},start,view,act,kick,tick,CAT,NEED,RENT};
