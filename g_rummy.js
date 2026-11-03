// Rummy de fichas: 106 fichas (dos juegos de 1–13 en 4 colores y 2 comodines), de 2 a 5 personas, sin bots. 14 fichas a cada quien; el resto va a la bolsa. Una sola mano.
// Turno: el cliente manda la mesa final (t:'end', mesa) y el servidor la valida con rummy_reglas.js. Sin fichas propias en la mesa: roba 1. Mesa inválida o se acaba el tiempo: la mesa vuelve a como estaba y roba 1.
// Mientras arma, el cliente manda la mesa temporal (t:'tmp', mesa) para que los demás vean los movimientos en vivo (G.tmp, G.tn). La bolsa y los atriles ajenos nunca salen en la vista.
// Fin: gana quien se queda sin fichas; si la bolsa está vacía y nadie juega en una ronda completa, gana quien tenga menos puntos en mano (comodín 30).
const cr=require('crypto'),RU=require('./rummy_reglas.js'),NAV=8,LATE=800;
// opciones: t segundos por turno
const OPTS={t:60},RNG={t:[30,120]};
const pn=(G,k)=>G.players[k].name,vivos=G=>G.ord.filter(k=>!G.out[k]);
const lg=(G,t)=>{G.log.push({t,n:G.ln=(G.ln||0)+1});if(G.log.length>30)G.log.shift()};
const fx=(G,t,k,to)=>{G.fx.push({n:G.fn=(G.fn||0)+1,t,k,to,ts:Date.now()});if(G.fx.length>12)G.fx.shift()};
const mez=a=>{for(let i=a.length-1;i>0;i--){const j=cr.randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
// G.ord: orden de turno al azar · G.av: muñeco de abuelo de cada quien (distintos, al azar) · G.down: ya hizo su primera bajada · G.idle: turnos seguidos sin jugar con la bolsa vacía
function start(R){const o=Object.assign({},OPTS,R.opts),n=R.players.length,bag=mez(RU.mazo());
 R.G={phase:'play',round:0,tc:0,tn:0,o,players:R.players.map(p=>({id:p.id,name:p.name})),racks:R.players.map(()=>bag.splice(0,14)),bag,
  mesa:[],tmp:null,down:Array(n).fill(false),out:Array(n).fill(0),ord:mez([...Array(n).keys()]),av:mez([...Array(NAV).keys()]).slice(0,n),
  idle:0,turn:-1,t0:0,at:0,win:null,pts:null,log:[],fx:[]};
 const G=R.G;fx(G,'mez',-1);lg(G,'Se revuelven las fichas en la bolsa. Empieza '+pn(G,G.ord[0])+'.');begin(R,G.ord[0])}
function begin(R,k){const G=R.G;Object.assign(G,{turn:k,tmp:null,t0:Date.now()});G.at=G.t0+G.o.t*1000;G.tc++;arm(R)}
function next(G,k){const L=G.ord,p=L.indexOf(k);for(let s=1;s<=L.length;s++){const j=L[(p+s)%L.length];if(!G.out[j])return j}return k}
// no jugó (pasó, mesa inválida o se le acabó el tiempo): la mesa se queda como estaba y roba 1 si hay
function pasa(R,i,por,err){const G=R.G,x=G.bag.pop(),n=pn(G,i);G.tmp=null;
 if(x!=null){G.racks[i].push(x);G.idle=0;fx(G,'roba',i)}else G.idle++;
 if(por)fx(G,por,i);
 lg(G,(por=='tiempo'?'⏳ A '+n+' se le acabó el tiempo. ':por=='mal'?'❌ '+err+' La mesa de '+n+' volvió a como estaba. ':'')+(x!=null?n+' robó una ficha.':n+' pasó: ya no hay fichas en la bolsa.'));
 if(!G.bag.length&&G.idle>=vivos(G).length)return fin(R,null,'bolsa');
 begin(R,next(G,i))}
function juega(R,i,r){const G=R.G;G.mesa=r.mesa;G.racks[i]=G.racks[i].filter(x=>!r.jug.includes(x));G.tmp=null;G.idle=0;
 if(!G.down[i]){G.down[i]=true;lg(G,'🎉 '+pn(G,i)+' bajó por primera vez con '+r.pts+' puntos.')}
 else lg(G,pn(G,i)+' puso '+r.jug.length+(r.jug.length==1?' ficha.':' fichas.'));
 fx(G,'juega',i,r.jug.length);if(!G.racks[i].length)return fin(R,i,'sin');begin(R,next(G,i))}
// por: 'sin' (se quedó sin fichas) · 'bolsa' (gana quien tenga menos puntos; empate: menos fichas) · 'solo' (los demás se fueron)
function fin(R,w,por){const G=R.G;clearTimeout(R.rmT);G.pts=G.racks.map(RU.mano);
 if(w==null){const L=vivos(G);w=L.length?L.reduce((b,k)=>G.pts[k]<G.pts[b]||G.pts[k]==G.pts[b]&&G.racks[k].length<G.racks[b].length?k:b):null}
 Object.assign(G,{phase:'final',win:w,tmp:null,at:0});G.tc++;if(w==null)return;fx(G,'gana',w);const n=pn(G,w);
 lg(G,por=='sin'?'🏆 ¡'+n+' se quedó sin fichas y gana!':por=='solo'?'🏆 '+n+' gana: se quedó solo en la mesa.':'🏆 Se acabó la bolsa y nadie pudo jugar: gana '+n+' con '+G.pts[w]+' puntos en mano.')}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),t=m.t;
 if(G.phase!='play')return 'La partida terminó.';if(i<0||G.out[i])return 'No estás jugando.';if(G.turn!==i)return 'No es tu turno.';
 if(Date.now()>=G.at+LATE){tarde(R);return 'Se acabó el tiempo.'}
 if(t=='tmp'){const e=RU.forma(G.mesa,G.racks[i],m.mesa);if(e)return e;G.tmp=m.mesa.filter(g=>g.length).map(g=>g.slice());G.tn++;return}
 if(t=='end'){const r=m.mesa==null?{pass:true}:RU.check(G.mesa,G.racks[i],m.mesa,G.down[i]);
  if(r.pass)pasa(R,i,'');else if(r.err)pasa(R,i,'mal',r.err);else juega(R,i,r);return}
 return 'Esa acción no existe.'}
// ---- reloj: al pasar G.at (con LATE de gracia para lo que viene en camino) la mesa vuelve a como estaba y roba 1 ----
function arm(R){const G=R.G;clearTimeout(R.rmT);if(!G||G.phase!='play'||!G.at)return;
 R.rmT=setTimeout(()=>{if(R.G===G&&!tarde(R))arm(R)},Math.max(0,G.at+LATE-Date.now())+30);if(R.rmT.unref)R.rmT.unref()}
function tarde(R){const G=R.G;if(!G||G.phase!='play'||!G.at||Date.now()<G.at+LATE)return false;pasa(R,G.turn,'tiempo');if(R.poke)R.poke();return true}
function tick(R){tarde(R)}
function kick(R,k){const G=R.G;if(!G||G.phase!='play'||G.out[k])return;G.out[k]=1;lg(G,pn(G,k)+' se levantó de la mesa.');
 const L=vivos(G);if(L.length<2)return fin(R,L.length?L[0]:null,'solo');if(G.turn===k)begin(R,next(G,k))}
// G.mio: tu atril · G.nb: fichas en la bolsa · G.nr: fichas de cada atril. Al terminar se muestran todos los atriles (G.racks) para el resumen.
function view(R,tok,me,now){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),v=Object.assign({},G);delete v.bag;delete v.racks;
 v.nb=G.bag.length;v.nr=G.racks.map(r=>r.length);v.mio=i>=0?G.racks[i].slice():null;if(G.phase!='play')v.racks=G.racks;
 v.el=now-G.t0;v.left=G.at?Math.max(0,G.at-now):0;v.fx=G.fx.filter(f=>now-f.ts<8000).map(f=>Object.assign({},f,{ago:now-f.ts}));return {G:v,claim:false,pend:false}}
module.exports={id:'rummy',name:'Rummy',min:2,max:5,opts:OPTS,rng:RNG,start,view,act,kick,tick};
