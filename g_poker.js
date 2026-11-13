// Texas Hold'em sin límite de la mesa ovalada del sótano. Sin salas: lo usa server.js desde /casa (b.pk).
// 8 asientos, ciegas fijas 5/10. Fichas por sesión: 1,000 al sentarte; si llegas a 0, recarga a 1,000 en la siguiente mano.
// Te sientas en un lugar libre y juegas desde la siguiente mano. 20 s por decisión: al acabarse pasa si puede; si no, se retira.
// Bots (g_poker_bot.js): mientras haya alguien real sentado, completan la mesa hasta 4 (máximo 3 bots); se van entre manos.
// Fases: espera → mano (calle 0 preflop, 1 flop, 2 turn, 3 river) ↔ pausa (entre calles; corre=1 si ya nadie puede apostar) → fin → mano…
// Botes paralelos: salen de lo que puso cada quien en la mano (tot), incluidos los que se fueron (muertos). La apuesta que nadie igualó se devuelve.
// Cartas: 0..51 como en g_blackjack.js.
const PE=require('./poker_eval.js'),BOT=require('./g_poker_bot.js');
const N=8,SB=5,BB=10,INI=1000,T_ACT=20000,T_CALLE=1400,T_FIN=6000,T_BOTE=2500,T_ESPERA=3000,MIN_MESA=4,MAX_BOTS=3;
const NOMBOTS=['Chema','Lupita','Don Beto','Rocío','Nacho','Toña','Memo','Chayo'];
function barajar(){const z=[];for(let i=0;i<52;i++)z.push(i);for(let i=51;i>0;i--){const j=Math.random()*(i+1)|0;[z[i],z[j]]=[z[j],z[i]]}return z}

function mesa(o={}){
 const now=o.now||Date.now,nueva=o.barajar||barajar,conBots=o.bots!==false;
 const S={fase:'espera',plazo:0,z:[],pos:0,as:Array(N).fill(null),btn:-1,sb:-1,bb:-1,turno:-1,calle:0,mesa:[],alta:0,minR:BB,mAp:0,muertos:[],botes:[],res:null,mano:0,corre:0,botT:0,nb:0};
 const carta=()=>S.z[S.pos++];
 const idx=id=>S.as.findIndex(a=>a&&a.id===id);
 const enMano=a=>!!(a&&a.jug&&!a.fold),actua=a=>enMano(a)&&!a.allin,juega=a=>!!(a&&a.jug);
 const vivos=()=>S.as.filter(enMano),humanos=()=>S.as.filter(a=>a&&!a.bot).length;
 const sig=(i,f)=>{for(let k=1;k<=N;k++){const j=((i+k)%N+N)%N;if(f(S.as[j]))return j}return -1};
 const nuevo=(id,n,bot)=>({id,n,bot:bot?1:0,f:INI,c:[],ap:0,tot:0,fold:0,allin:0,act:0,lim:0,jug:0,mos:0,gan:0,neta:0,acc:null});
 function poner(a,v){v=Math.max(0,Math.min(v,a.f));a.f-=v;a.ap+=v;a.tot+=v;if(!a.f)a.allin=1;return v}

 function lugarBot(){let mj=-1,md=-1;const oc=S.as.map((a,i)=>a?i:-1).filter(i=>i>=0);
  for(let j=0;j<N;j++){if(S.as[j])continue;const d=oc.length?Math.min(...oc.map(i=>Math.min((i-j+N)%N,(j-i+N)%N))):N;if(d>md){md=d;mj=j}}return mj}
 function bots(){const H=humanos(),quiero=H?Math.min(MAX_BOTS,Math.max(0,MIN_MESA-H)):0,B=S.as.map((a,i)=>a&&a.bot?i:-1).filter(i=>i>=0);
  while(B.length>quiero)S.as[B.pop()]=null;
  while(B.length<quiero){const j=lugarBot();if(j<0)break;const us=S.as.filter(a=>a&&a.bot).map(a=>a.n);S.nb++;
   S.as[j]=nuevo('bot:'+S.nb,NOMBOTS.find(x=>!us.includes(x))||'Bot',1);B.push(j)}}
 function listos(){if(conBots)bots();const n=S.as.filter(Boolean).length;S.plazo=n>=2?(S.plazo||now()+T_ESPERA):0}

 function empezar(){
  if(conBots)bots();
  S.res=null;S.botes=[];S.mesa=[];S.muertos=[];S.turno=-1;S.corre=0;S.calle=0;S.alta=0;S.minR=BB;S.mAp=0;
  S.as.forEach(a=>{if(!a)return;if(a.f<=0)a.f=INI;Object.assign(a,{c:[],ap:0,tot:0,fold:0,allin:0,act:0,lim:0,jug:1,mos:0,gan:0,neta:0,acc:null})});
  const L=S.as.filter(Boolean);if(L.length<2){S.as.forEach(a=>{if(a)a.jug=0});S.fase='espera';S.plazo=0;return}
  S.mano++;S.z=nueva();S.pos=0;
  S.btn=sig(S.btn,juega);
  if(L.length==2){S.sb=S.btn;S.bb=sig(S.sb,juega)}else{S.sb=sig(S.btn,juega);S.bb=sig(S.sb,juega)}
  const sa=S.as[S.sb],ba=S.as[S.bb];poner(sa,SB);sa.acc={o:'ciega',v:sa.ap};poner(ba,BB);ba.acc={o:'ciega',v:ba.ap};S.alta=BB;
  for(let k=0;k<2;k++){let i=S.sb;do{S.as[i].c.push(carta());i=sig(i,juega)}while(i!=S.sb)}
  S.fase='mano';avanzar(S.bb)}
 function avanzar(desde){
  if(vivos().length<=1)return ganaSolo();
  const otros=S.as.filter(actua).length>1,pend=a=>actua(a)&&(a.ap<S.alta||(!a.act&&otros));
  const t=sig(desde,pend);if(t<0)return finCalle();
  S.turno=t;S.plazo=now()+T_ACT;if(S.as[t].bot)S.botT=now()+900+Math.random()*1800}
 function devolver(){let top=null,seg=S.mAp;   // la apuesta que nadie igualó regresa a su dueño
  S.as.filter(juega).forEach(a=>{if(!top||a.ap>top.ap){if(top)seg=Math.max(seg,top.ap);top=a}else seg=Math.max(seg,a.ap)});
  if(top&&top.ap>seg){const d=top.ap-seg;top.ap-=d;top.tot-=d;top.f+=d;if(top.f)top.allin=0}}
 function recoger(){devolver();S.as.forEach(a=>{if(a){a.ap=0;a.act=0;a.lim=0}});S.alta=0;S.minR=BB;S.mAp=0;S.botes=botes()}
 function calle(){S.calle++;S.pos++;for(let i=S.calle==1?3:1;i>0;i--)S.mesa.push(carta());S.as.forEach(a=>{if(a&&!a.fold)a.acc=null})}
 function finCalle(){recoger();S.turno=-1;
  if(S.calle==3)return showdown();
  if(S.as.filter(actua).length<=1){S.corre=1;vivos().forEach(a=>a.mos=1)}
  calle();S.fase='pausa';S.plazo=now()+T_CALLE}
 function botes(){const C=S.as.filter(juega).map(a=>({t:a.tot,v:enMano(a),i:S.as.indexOf(a)})).concat(S.muertos.map(t=>({t,v:false})));
  const niv=[...new Set(C.filter(c=>c.v).map(c=>c.t))].sort((a,b)=>a-b),R=[];let prev=0;
  niv.forEach((L,k)=>{const ult=k==niv.length-1;let v=0;C.forEach(c=>{v+=Math.max(0,(ult?c.t:Math.min(c.t,L))-prev)});
   const e=C.filter(c=>c.v&&c.t>=L).map(c=>c.i),u=R[R.length-1];
   if(u&&u.e.join()==e.join())u.v+=v;else if(v)R.push({v,e});prev=L});
  return R}
 function fin(nb){S.as.forEach(a=>{if(juega(a))a.neta=a.gan-a.tot});S.fase='fin';S.turno=-1;S.plazo=now()+T_FIN+T_BOTE*Math.max(0,nb-1)}
 function ganaSolo(){recoger();const w=vivos()[0],v=S.botes.reduce((s,b)=>s+b.v,0);w.gan=v;w.f+=v;S.res=[{v,g:[S.as.indexOf(w)],nom:null}];fin(1)}
 function showdown(){const V=vivos();V.forEach(a=>{a.mos=1;a.pts=PE.puntos(a.c.concat(S.mesa))});S.botes=botes();S.res=[];
  S.botes.forEach(b=>{const el=b.e.map(i=>S.as[i]).filter(enMano),mx=Math.max(...el.map(a=>a.pts));
   const W=el.filter(a=>a.pts==mx).map(a=>S.as.indexOf(a)).sort((x,y)=>(x-S.btn-1+2*N)%N-(y-S.btn-1+2*N)%N);   // la ficha sobrante va al primero a la izquierda del botón
   const p=Math.floor(b.v/W.length);let r=b.v-p*W.length;
   W.forEach(i=>{const g=p+(r>0?1:0);if(r>0)r--;S.as[i].gan+=g;S.as[i].f+=g});
   S.res.push({v:b.v,g:W,nom:PE.nombre(mx)})});
  fin(S.res.length)}
 function salir(id){const s=idx(id);if(s<0)return;const a=S.as[s],enJuego=a.jug&&(S.fase=='mano'||S.fase=='pausa');
  if(enJuego){S.muertos.push(a.tot);S.mAp=Math.max(S.mAp,a.ap)}
  S.as[s]=null;
  if(!humanos()){S.as.fill(null);S.fase='espera';S.plazo=0;S.turno=-1;S.res=null;S.botes=[];S.mesa=[];return}
  if(S.fase=='espera')return listos();
  if(!enJuego)return;
  if(vivos().length<=1)return ganaSolo();
  if(S.fase=='mano'&&S.turno==s)avanzar(s)}

 function jugar(a,s,op,v){const falta=S.alta-a.ap,max=a.ap+a.f;
  if(op=='retirar'){a.fold=1;a.acc={o:'retirar'}}
  else if(op=='pasar'){if(falta>0)return 'No puedes pasar: hay apuesta';a.acc={o:'pasar'}}
  else if(op=='igualar'){if(falta<=0)return jugar(a,s,'pasar');poner(a,falta);a.acc={o:a.allin?'todo':'igualar',v:a.ap}}
  else if(op=='subir'||op=='todo'){v=op=='todo'?max:Math.round(+v||0);if(v>max)v=max;
   if(v<=S.alta){if(v==max)return jugar(a,s,'igualar');return 'Tienes que subir a más de '+S.alta}
   if(a.lim)return 'Solo puedes igualar o retirarte';
   const era=S.alta,sube=v-era,minTo=era+S.minR;if(v<minTo&&v<max)return 'Lo mínimo es '+minTo;
   poner(a,v-a.ap);
   if(sube>=S.minR){S.minR=sube;S.as.forEach(b=>{if(b&&b!==a){b.act=0;b.lim=0}})}
   else S.as.forEach(b=>{if(b&&b!==a&&b.act){b.act=0;b.lim=1}});   // todo corto: no reabre la subida a quien ya actuó
   S.alta=v;a.acc={o:a.allin?'todo':era?'subir':'apostar',v}}
  else return 'Acción desconocida';
  a.act=1;avanzar(s)}
 function vistaBot(s){const a=S.as[s];return {c:a.c,mesa:S.mesa,alta:S.alta,ap:a.ap,f:a.f,minR:S.minR,lim:a.lim,calle:S.calle,BB,
  rivales:vivos().length-1,bote:S.botes.reduce((t,b)=>t+b.v,0)+S.as.reduce((t,b)=>t+(b?b.ap:0),0)}}

 function tick(alive){if(alive)S.as.forEach(a=>{if(a&&!a.bot&&!alive(a.id))salir(a.id)});
  if(S.fase=='mano'&&S.turno>=0&&S.as[S.turno]&&S.as[S.turno].bot&&now()>=S.botT){const s=S.turno,a=S.as[s],d=BOT.decide(vistaBot(s));
   if(jugar(a,s,d.op,d.v))jugar(a,s,S.alta>a.ap?'igualar':'pasar')}
  if(!S.plazo||now()<S.plazo)return;
  if(S.fase=='espera'||S.fase=='fin')empezar();
  else if(S.fase=='mano'){const a=S.as[S.turno];if(a)jugar(a,S.turno,S.alta>a.ap?'retirar':'pasar')}   // se tardó
  else if(S.fase=='pausa'){if(!S.corre){S.fase='mano';avanzar(S.btn)}else if(S.calle<3){calle();S.plazo=now()+T_CALLE}else showdown()}}

 // Devuelve un texto si la acción no se pudo. op: sentar(s) parar mostrar retirar pasar igualar subir(v = total de tu apuesta en la calle) todo
 function act(id,name,m){m=m||{};const op=m.op,s=idx(id),a=s>=0?S.as[s]:null;if(a&&name)a.n=name;
  if(op=='sentar'){if(a)return;const k=m.s|0;if(k<0||k>=N)return 'Ese lugar no existe';if(S.as[k])return 'Ese lugar ya está ocupado';
   S.as[k]=nuevo(id,name,0);if(S.fase=='espera')listos();return}
  if(!a)return;
  if(op=='parar')return salir(id);
  if(op=='mostrar'){if(S.fase=='fin'&&a.jug&&a.c.length)a.mos=1;return}
  if(S.fase!='mano'||S.turno!=s)return;
  return jugar(a,s,op,m.v)}

 function view(id){const yo=idx(id);
  return {fase:S.fase,left:S.plazo?Math.max(0,S.plazo-now()):0,mano:S.mano,calle:S.calle,mesa:S.mesa,btn:S.btn,sb:S.sb,bb:S.bb,turno:S.turno,
   alta:S.alta,minR:S.minR,ciegas:[SB,BB],corre:S.corre,yo,botes:S.botes,res:S.res,
   as:S.as.map((a,i)=>a&&{id:a.id,n:a.n,bot:a.bot,f:a.f,ap:a.ap,tot:a.tot,fold:a.fold,allin:a.allin,jug:a.jug,lim:a.lim,mos:a.mos,gan:a.gan,neta:a.neta,acc:a.acc,
    c:i==yo||a.mos?a.c:a.c.map(()=>-1),nom:a.mos&&S.mesa.length>=3?PE.nombre(PE.puntos(a.c.concat(S.mesa))):null})}}
 return {act,tick,view,S}}

module.exports=Object.assign(mesa(),{mesa,N,SB,BB,INI});
