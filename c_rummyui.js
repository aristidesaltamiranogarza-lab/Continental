// Rummy: estado del turno y enganche con game.js (RMU). Envuelve GM.rummy.body/after; NO cambia reglas ni servidor.
// El tablero lo dibuja la mesa 3D (R3, c_rummy3d.js) o la 2D (R2, c_rummy2d.js) con la misma API; la interfaz la arma c_rummy_hud.js (RUH).
// En tu turno se arma una mesa de trabajo local con Deshacer: cada cambio va como mesa temporal (t:'tmp', los demás la ven en vivo)
// y al terminar se valida aquí con RUMMY.check antes de mandarla (t:'end'). Un solo botón dice qué va a pasar (estado()).
// Sugerencias (RUMBOT.mejor): los grupos que ya tienes en el atril; con el orden "grupos" quedan juntos y se bajan de un toque.
(function(){
const RU=window.RUMMY;if(!RU||typeof GM==='undefined'||!GM.rummy){console.warn('Rummy UI: faltan rummy_reglas.js o c_rummy.js');return}
const origBody=GM.rummy.body,cp=m=>m.map(g=>g.slice()),LOCK='Antes de tu primera bajada no puedes tocar las fichas de la mesa.';
const ls=(k,d)=>{try{const x=localStorage.getItem(k);return x==null?d:x}catch(e){return d}},lss=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const lig=()=>ls('casa_3d','1')==='0'||window.CALIDAD==='ligero';
// key: turno que se arma (G.tc:G.turn) · base: la mesa al empezar · work: la mesa de trabajo · placed: fichas del atril puestas · hist: Deshacer
let on=false,ok=true,key='',base=[],work=[],placed=new Set(),hist=[],sel=null,mx=[],order=[],modo=ls('rm_orden','grupos'),manual=false,ayuda=ls('rm_ayuda','1')!=='0';
let aviso='',avT=0,lastV=null,tmpT=0,tmpK='',busy=false,dl=0,vista=ls('rm_view',lig()?'2d':'3d'),menu=false,sugK='',sug=[],lastF=-1,turnoT=0,finT=0,big=false;
const active=()=>typeof S!='undefined'&&!!S&&typeof V!='undefined'&&!!V&&V.game==='rummy'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final');
const me=()=>V.me,mine=()=>V.G.mio||[];
const myTurn=()=>V.G.phase==='play'&&me()>=0&&!!V.G.players[me()]&&!V.G.out[me()]&&V.G.turn===me();
const is3=()=>vista=='3d'&&!!window.R3&&R3.ok(),stage=()=>is3()?window.R3:window.R2;
const inRack=id=>mine().includes(id)&&!placed.has(id),onTable=id=>work.some(g=>g.includes(id)),baseSet=()=>new Set(base.flat());
const tell=t=>{aviso=t;avT=Date.now()};
const SFX=(n,v)=>{if(window.RMS)RMS.snd(n,v)};
// ---- lo que manda el servidor (G.fx): sonidos y aviso al 3D ----
function fxs(){const G=V.G,F=G.fx||[];if(lastF<0)lastF=F.filter(f=>(f.ago||0)>2500).reduce((m,f)=>Math.max(m,f.n),0);
 F.forEach(f=>{if(f.n<=lastF)return;lastF=f.n;const yo=f.k===me();if(window.R3&&is3())R3.fx(f);
  if(f.t=='mez')SFX('mez');else if(f.t=='roba')SFX('roce');else if(f.t=='tiempo'||f.t=='mal')SFX('mal');
  else if(f.t=='gana'){SFX('gana');setTimeout(()=>SFX('aplauso'),400);if(typeof confetti=='function')setTimeout(()=>confetti(yo?90:30),900)}})}
// ---- estado local: se reinicia en cada turno; si recargas a media jugada se recupera de G.tmp ----
function syncTurn(){const G=V.G,k=G.tc+':'+G.turn;if(k===key)return;const was=key;key=k;base=cp(G.mesa);hist=[];sel=null;placed=new Set();tmpK='';work=cp(base);
 if(myTurn()){if(G.tmp){const A=baseSet(),M=new Set(mine());work=cp(G.tmp);work.flat().forEach(x=>{if(!A.has(x)&&M.has(x))placed.add(x)})}if(was){turnoT=Date.now();SFX('turno')}}}
function sugs(){const M=mine().filter(x=>!placed.has(x)),k=M.slice().sort((a,b)=>a-b).join()+'|'+(V.G.down[me()]?1:0);if(k===sugK)return sug;sugK=k;
 if(!ayuda||!window.RUMBOT||M.length<3)return sug=[];let g=RUMBOT.mejor(M,V.G.down[me()]?0:RU.MIN1);if(!g.length&&!V.G.down[me()])g=RUMBOT.mejor(M,0);return sug=g}
function ordenar(M){if(modo=='grupos'&&ayuda){const S2=sugs(),u=new Set(S2.flat());return S2.flat().filter(x=>M.includes(x)).concat(RU.ordena(M.filter(x=>!u.has(x)),false))}return RU.ordena(M,modo=='numero')}
function syncOrder(){const M=mine();if(!manual||!order.length){order=ordenar(M);return}order=order.filter(x=>M.includes(x));M.forEach(x=>{if(!order.includes(x))order.push(x)})}
// lo que dibuja el tablero: en tu turno tu mesa de trabajo; si no, la mesa temporal de quien juega
function view(){mx=sel!=null&&inRack(sel)&&myTurn()?mx.filter(x=>x!==sel&&inRack(x)):[];const G=V.G,my=myTurn(),live=G.phase=='play'&&!my&&G.tmp,mesa=my?work:live?G.tmp:G.mesa,A=new Set(G.mesa.flat());
 const bad=new Set(),lock=new Set();mesa.forEach((g,k)=>{if(!RU.grp(g))bad.add(k);if(my&&!G.down[me()]&&g.some(x=>A.has(x)))lock.add(k)});
 const nuevas=new Set(my?placed:live?G.tmp.flat().filter(x=>!A.has(x)):[]),atril=me()>=0?order.filter(x=>!placed.has(x)):null;
 return {mesa,atril,sel,mx:mx.slice(),bad,nuevas,lock,my,G,me:me(),dl,cnt:G.players.map((_,k)=>cnt(k)),sug:me()>=0&&ayuda&&modo=='grupos'?sugs().filter(g=>g.every(x=>atril.includes(x))):[]}}
function cnt(k){const G=V.G;if(G.phase!='play')return G.nr[k];if(k===me()&&myTurn())return mine().length-placed.size;
 if(k===G.turn&&G.tmp){const A=new Set(G.mesa.flat());return G.nr[k]-G.tmp.flat().filter(x=>!A.has(x)).length}return G.nr[k]}
function why(id){return !myTurn()?'Espera tu turno.':placed.has(id)||V.G.down[me()]?'':LOCK}
function save(){hist.push({w:cp(work),p:[...placed]});if(hist.length>80)hist.shift()}
function changed(){clearTimeout(tmpT);tmpT=setTimeout(()=>{if(!active()||!myTurn())return;const k=JSON.stringify(work);if(k===tmpK)return;tmpK=k;
  api('act',{c:S.c,t:S.t,m:{t:'tmp',mesa:work}}).catch(()=>{})},280);render()}
const no=t=>{tell(t);sel=null;SFX('mal',.5);render()};
// qué hace el botón grande ahora: robar, faltan puntos, arreglar grupos o listo
function estado(){if(!myTurn())return null;const G=V.G;if(!placed.size)return {k:'robar',t:G.nb?'Robar ficha':'Pasar'};
 const r=RU.check(base,mine(),work,G.down[me()]);if(!r.err)return {k:'listo',t:'Listo'};
 if(r.bad)return {k:'mal',t:r.bad.length==1?'Arregla 1 grupo':'Arregla '+r.bad.length+' grupos',why:'Los grupos con raya roja todavía no sirven.'};
 if(!G.down[me()]&&/primera bajada/.test(r.err))return {k:'faltan',t:'Faltan '+Math.max(1,RU.MIN1-RU.bajada(base,work)),why:'Tu primera bajada debe sumar '+RU.MIN1+' o más.'};
 return {k:'mal',t:'Revisa la mesa',why:r.err}}
// escalera 3-4-5-6-7 y otro 5: se parte en 3-4-5 y 5-6-7 (p = dónde está el número repetido)
function parte(g,id){const r=RU.grp(g);if(!r||r.k!='esc'||RU.isJ(id)||RU.col(id)!=r.c)return -1;const p=r.v.indexOf(RU.num(id));if(p<1||p>g.length-1)return -1;
 return RU.grp(g.slice(0,p).concat(id))&&RU.grp(g.slice(p))?p:-1}
window.RMU={
 can(id){if(V.G.phase!='play')return false;if(inRack(id))return true;return myTurn()&&onTable(id)&&!why(id)},
 pick(id){if(id!=null&&!RMU.can(id))return no(why(id)||'Esa ficha no se puede mover.');if(id!=null&&id!==sel)SFX('alza');if(id!=null&&mx.includes(id)&&sel!=null)mx=mx.filter(x=>x!==id).concat(sel);else mx=[];sel=id;render()},
 // varias fichas del atril: con una elegida, tocar otras del atril las suma (o las quita)
 mas(id){if(!myTurn()||sel==null||!inRack(sel)||!inRack(id))return;if(id===sel){if(!mx.length){sel=null;render();return}sel=mx.shift()}else if(mx.includes(id))mx=mx.filter(x=>x!==id);else{mx.push(id);SFX('alza')}render()},
 // a: {g, at} en el grupo g · {g:-1} grupo nuevo · {r:at} al atril (reacomodar el atril se vale en cualquier momento) · {g, at, parte:1} partir la escalera
 put(id,a){const G=V.G;if(G.phase!='play')return;const fromRack=inRack(id);
  if(fromRack&&a.r==null&&mx.length&&id===sel){const ids=[id].concat(mx);mx=[];if(!myTurn())return no('Espera tu turno.');if(a.g<0||!work[a.g])return RMU.grupo(ids);
   if(!G.down[me()]&&work[a.g].some(x=>baseSet().has(x)))return no(LOCK);save();const W=cp(work);W[a.g]=RU.arregla(W[a.g].concat(ids));work=W;ids.forEach(x=>placed.add(x));sel=null;
   ids.forEach((_,i)=>setTimeout(()=>SFX('clac',.7),i*70));return changed()}
  mx=[];
  if(a.r!=null){if(!fromRack){if(!myTurn()||!placed.has(id))return no('Las fichas de la mesa no pueden regresar a tu atril.');save();work=work.map(g=>g.filter(x=>x!==id)).filter(g=>g.length);placed.delete(id)}
   const sh=order.filter(x=>x!==id&&!placed.has(x)),b=sh[a.r];order=order.filter(x=>x!==id);order.splice(b==null?order.length:order.indexOf(b),0,id);manual=true;sel=null;SFX('clac',.5);return changed()}
  if(!myTurn())return no('Espera tu turno.');if(!fromRack&&!RMU.can(id))return no(why(id)||'Esa ficha no se puede mover.');
  if(a.g>=0&&!G.down[me()]&&work[a.g]&&work[a.g].some(x=>baseSet().has(x)))return no(LOCK);
  save();const W=cp(work);for(const g of W){const p=g.indexOf(id);if(p>=0){g.splice(p,1);break}}
  if(a.g<0||!W[a.g])W.push([id]);
  else if(a.parte){const g=W[a.g],p=parte(g,id);if(p>=0)W.splice(a.g,1,g.slice(0,p).concat(id),g.slice(p));else{g.splice(Math.min(a.at,g.length),0,id);W[a.g]=RU.arregla(g)}}
  else{W[a.g].splice(Math.min(a.at,W[a.g].length),0,id);W[a.g]=RU.arregla(W[a.g])}
  work=W.filter(g=>g.length);if(fromRack)placed.add(id);sel=null;SFX('clac');changed()},
 // dónde cabe la ficha id: [{g, at, parte}] (at en el grupo sin la ficha). Antes de bajar no se tocan los grupos que ya estaban
 destinos(id){if(!myTurn()||id==null)return [];const G=V.G,A=baseSet(),out=[];
  if(id===sel&&mx.length){const ids=[id].concat(mx),U=new Set(ids);work.forEach((g,gi)=>{if(!G.down[me()]&&g.some(x=>A.has(x)))return;const r=RU.arregla(g.concat(ids));if(RU.grp(r))out.push({g:gi,at:r.findIndex(x=>U.has(x))})});return out}
  work.forEach((g0,gi)=>{const g=g0.filter(x=>x!==id);if(!g.length)return;if(!G.down[me()]&&g.some(x=>A.has(x)))return;
   const r=RU.arregla(g.concat(id));if(RU.grp(r,r.length<3)){const at=r.indexOf(id);if(r.slice(0,at).concat(r.slice(at+1)).join()===g.join())out.push({g:gi,at})}
   const p=parte(g,id);if(p>=0)out.push({g:gi,at:p,parte:1})});return out},
 // un grupo entero de la mesa: ¿se puede levantar? y unirlo a otro (b)
 movible(g){return myTurn()&&!!work[g]&&work[g].every(x=>RMU.can(x))},
 une(a,b){if(!myTurn())return no('Espera tu turno.');if(a===b||!work[a]||!work[b])return;if(!RMU.movible(a))return no(LOCK);
  if(!V.G.down[me()]&&work[b].some(x=>baseSet().has(x)))return no(LOCK);const r=RU.arregla(work[b].concat(work[a]));if(!RU.grp(r))return no('Esos grupos no se pueden unir.');
  save();const W=cp(work);W[b]=r;W.splice(a,1);work=W;sel=null;mx=[];SFX('clac');changed()},
 // bajar de un toque un grupo de tu atril (sugerencia)
 grupo(ids){if(!myTurn())return no('Espera tu turno.');if(!ids.every(inRack))return;save();work=work.concat([RU.arregla(ids.slice())]);ids.forEach(x=>placed.add(x));sel=null;
  ids.forEach((_,i)=>setTimeout(()=>SFX('clac',.7),i*70));changed()},
 // tocar la bolsa en tu turno sin haber puesto nada = robar
 bolsa(){if(myTurn()&&!placed.size)RMU.end();else if(myTurn())tell('Ya pusiste fichas: termina con Listo o usa Deshacer.')},
 rack(o){big=!!o;if(!is3())R2.cam(big?'atril':'home');render()},
 undo(){if(!myTurn()||!hist.length)return;const h=hist.pop();work=h.w;placed=new Set(h.p);sel=null;SFX('clac',.4);changed()},
 todo(){if(!myTurn()||!hist.length)return;save();work=cp(base);placed=new Set();sel=null;tell('La mesa volvió a como estaba.');changed()},
 sort(){const L=ayuda?['grupos','color','numero']:['color','numero'];modo=L[(L.indexOf(modo)+1)%L.length];lss('rm_orden',modo);manual=false;order=ordenar(order.slice());
  stage().sort(modo=='numero');[0,60,130,210].forEach(d=>setTimeout(()=>SFX('clac',.4),d));tell(modo=='grupos'?'Por grupos':modo=='numero'?'Por número':'Por color');render()},
 async end(){if(!myTurn()||busy)return;const e=estado();if(e.k!='listo'&&e.k!='robar'){tell(e.why);SFX('mal',.6);render();return}
  const G=V.G,r=RU.check(base,mine(),work,G.down[me()]);busy=true;clearTimeout(tmpT);render();
  const okk=await send(r.pass?{t:'end'}:{t:'end',mesa:work});busy=false;if(!okk&&typeof msg=='string'&&msg)tell(msg.replace(/^\W+\s*/,''));render()},
 async again(){if(await send({t:'reset'}))await send({t:'start'});render()},
 menu(o){menu=o==null?!menu:!!o;if(typeof sfx=='function')sfx('tick');render()},
 mode(x){if(stage())stage().cam('home');big=false;vista=x||(is3()?'2d':'3d');lss('rm_view',vista);menu=false;render()},
 ayuda(){ayuda=!ayuda;lss('rm_ayuda',ayuda?'1':'0');sugK='';if(!ayuda&&modo=='grupos')modo='color';manual=false;render()},
 home(){if(stage())stage().cam('home');render()},
 // por qué no sirve el grupo g de la mesa (al tocar su raya roja)
 porque(g){const G=work[g]||[];if(G.length<3)return tell('Un grupo necesita 3 fichas o más.'),render();const nj=G.filter(x=>!RU.isJ(x)),n=new Set(nj.map(RU.num)),c=new Set(nj.map(RU.col));
  tell(n.size==1?(c.size<nj.length?'En una serie no se repite color.':'Una serie lleva máximo 4 fichas.'):c.size==1?'Una escalera va seguida, sin huecos (el 1 solo antes del 2).':'Ni serie (mismo número) ni escalera (mismo color y seguidos).');SFX('tap');render()},
 get st(){return {estado:estado(),sel,hist:hist.length,placed:placed.size,modo,ayuda,menu,vista:is3()?'3d':'2d',aviso:aviso&&Date.now()-avT<4500?aviso:'',avT,turnoT,finT,big,busy,cnt,myTurn:myTurn(),bajada:RU.bajada(base,work)}}};
// ---- enganche con game.js ----
GM.rummy.body=function(){if(!active()||!window.RUH)return origBody();GHUD.save();try{ok=true;syncTurn();syncOrder();const G=V.G;
  if(G.phase=='final'){if(!finT)finT=Date.now()}else finT=0;return RUH.html()}catch(e){console.warn('Rummy UI:',e);ok=false;return origBody()}};
GM.rummy.after=function(){if(!active()||!ok){off();return}
 if(!on){on=true;document.documentElement.classList.add('rmui');if(window.RUH)RUH.entra()}if(V!==lastV){lastV=V;dl=Date.now()+(V.G.left||0);fxs()}
 const s=stage();if(window.R2&&s!==R2)R2.show(false);if(window.R3&&s!==R3)R3.show(false);s.show(true);
 if(s!==R2&&!s.ok()){vista='2d';return render()}   // el 3D no pudo arrancar: queda el 2D
 GHUD.restore();s.layout(RUH.ins(is3()));s.sync(view());RUH.after()};
function off(){if(!on)return;on=false;document.documentElement.classList.remove('rmui');if(window.R2){R2.cam('home');R2.show(false)}if(window.R3)R3.show(false);
 menu=false;key='';order=[];sel=null;hist=[];aviso='';lastF=-1;sugK='';manual=false;big=false}
let rzT=0;addEventListener('resize',()=>{if(!on)return;clearTimeout(rzT);rzT=setTimeout(()=>{if(active())render()},120)});
addEventListener('keydown',e=>{if(!on||/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||''))return;const k=e.key.toLowerCase();
 if((e.ctrlKey||e.metaKey)&&k=='z'){e.preventDefault();RMU.undo()}else if(e.key=='Escape'){if(menu)RMU.menu(0);else if(sel!=null){sel=null;render()}}
 else if(e.key=='Enter'&&myTurn()){e.preventDefault();RMU.end()}else if(k=='o'&&!e.ctrlKey)RMU.sort()});
// reloj: tic-tac en tus últimos 10 s y la raya del tiempo sin volver a dibujar todo
let tic=-1;setInterval(()=>{if(on&&!active())return off();if(!on)return;const G=V.G,t=Math.max(0,dl-Date.now());if(window.RUH)RUH.reloj(t,(G.o&&G.o.t||90)*1000,G.phase=='play');
 if(myTurn()&&t<10500&&t>0){const s=Math.ceil(t/1000);if(s!==tic){tic=s;SFX('tic',1)}}else tic=-1;
 if(aviso&&Date.now()-avT>4500){aviso='';render()}},250);
})();
