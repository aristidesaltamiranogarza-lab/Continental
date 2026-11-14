// Bola 8 en la mesa del cuarto del billar (sótano). Sin salas: lo usa server.js desde /casa (b.bi).
// El servidor es la verdad: recibe solo el tiro {a,v,ex,ey} (y x,z de la blanca si la tiene en mano), lo simula con BFIS y reparte
// en ult el E0 y el tiro normalizado para que cada cliente lo reproduzca igual (BFIS.simula(ult.E0,ult.tiro)); E es el estado final.
// Fases: libre → arma (reto: 1 contra 1 con alguien del cuarto o con bot; 2 contra 2, los huecos los llenan bots) → juego → fin
// (revancha o vuelve a libre).
// Reglas simplificadas: sin cantar tronera; saque al azar; tras el saque la mesa queda abierta aunque caigan bolas y la primera bola
// metida sin falta después decide lisas/rayadas. Sigues tirando si metes una tuya (o cualquiera en el saque / con la mesa abierta).
// Falta: no tocar nada, tocar primero una que no es tuya (con la mesa abierta, la 8), meter la blanca o acabarse los 45 s;
// el rival pone la blanca detrás de la línea de cabeza. La 8 antes de tiempo o con falta: pierdes. La 8 en el saque: se acomoda
// de nuevo y saca el mismo.
// 2 contra 2: los equipos se turnan y dentro del equipo se alternan los dos en cada entrada.
const F=require('./billar_fis.js'),BOT=require('./billar_bot.js');
const T_TIRO=45000,T_RETO=60000,T_FIN=20000,T_BOT=1200,T_REP=800;   // T_REP: margen tras ver el tiro antes de contar el tiempo
const NOMBOTS=['Paco','Chabela','Don Lalo','Meche','Rigo','Tere'];
const LISAS=[1,2,3,4,5,6,7],RAYADAS=[9,10,11,12,13,14,15],GR={l:LISAS,r:RAYADAS};
const {R,L,A:AN,P}=F.M;
const r4=v=>Math.round(v*1e4)/1e4;

// dónde va la blanca en mano si el tirador no dice (o la que hay no sirve): en la cabeza o lo más cerca que quepa
function lugar(E,coc){if(E[0]&&F.libre(E,E[0][0],E[0][1],coc))return E[0].slice();
 const x0=-L/4;for(let k=0;k<60;k++)for(let s=-1;s<=1;s+=2){const z=s*k*R;if(F.libre(E,x0,z,coc))return [x0,z];
  for(let d=1;d<8;d++)if(F.libre(E,x0-d*R,z,coc))return [r4(x0-d*R),z]}
 return [x0,0]}

function mesa(o={}){
 const now=o.now||Date.now,rnd=o.rnd||Math.random,botTiro=o.bot||BOT.tiro;
 const S={fase:'libre',modo:1,eq:[[null],[null]],org:null,inv:null,niv:1,plazo:0,E:null,gr:null,ti:[0,0],turno:-1,mano:null,saque:0,n:0,ult:null,gana:-1,por:'',botT:0,nb:0};
 const todos=()=>S.eq[0].concat(S.eq[1]).filter(Boolean),humanos=()=>todos().filter(p=>!p.bot);
 const donde=id=>{for(let e=0;e<2;e++){const j=S.eq[e].findIndex(p=>p&&p.id===id);if(j>=0)return [e,j]}return null};
 const quien=()=>S.turno<0?null:S.eq[S.turno][S.ti[S.turno]];
 const mias=e=>S.gr?GR[S.gr[e]]:null,quedan=(E,e)=>mias(e).filter(i=>E[i]).length;
 function nuevoBot(niv){const us=todos().map(p=>p.n);S.nb++;return {id:'bot:'+S.nb,n:NOMBOTS.find(x=>!us.includes(x))||'Bot',bot:1,niv}}
 function libre(){Object.assign(S,{fase:'libre',modo:1,eq:[[null],[null]],org:null,inv:null,plazo:0,E:null,gr:null,turno:-1,mano:null,saque:0,ult:null,gana:-1,por:''})}
 function reloj(espera){const t=now()+espera;S.plazo=t+T_TIRO;S.botT=t+T_BOT}
 // bolas que puede tocar primero el que tira
 function legales(){if(S.saque)return LISAS.concat(RAYADAS);const e=S.turno;if(!S.gr)return LISAS.concat(RAYADAS);
  return quedan(S.E,e)?mias(e):[8]}

 function empezar(){for(let e=0;e<2;e++)for(let j=0;j<S.modo;j++)if(!S.eq[e][j])S.eq[e][j]=nuevoBot(S.niv);
  S.inv=null;S.n=0;S.ult=null;S.gana=-1;S.por='';S.ti=[0,0];acomodar(rnd()<.5?0:1)}
 function acomodar(e){S.fase='juego';S.E=F.rack(rnd);S.gr=null;S.turno=e;S.mano='cocina';S.saque=1;reloj(0)}
 function pasa(){const e=S.turno;S.ti[e]=(S.ti[e]+1)%S.modo;S.turno=1-e}
 function gana(e,por,espera){S.fase='fin';S.gana=e;S.por=por;S.turno=-1;S.mano=null;S.plazo=now()+espera+T_FIN}

 // reglas sobre lo que pasó en la simulación r desde E0
 function juzga(p,E0,r){const e=S.turno,ev=r.ev,saque=S.saque,mi=mias(e),en8=!!mi&&!quedan(E0,e);
  let pri=-1;for(const v of ev)if(v.k=='bola'&&(v.a===0||v.b===0)){pri=v.a===0?v.b:v.a;break}
  const met=ev.filter(v=>v.k=='tronera').map(v=>v.a),obj=met.filter(i=>i!=0&&i!=8);
  let fal='';
  if(met.includes(0))fal='Metió la blanca';
  else if(pri<0)fal='No tocó ninguna bola';
  else if(!saque&&!mi&&pri==8)fal='Con la mesa abierta no se toca primero la 8';
  else if(!saque&&mi&&(en8?pri!=8:!mi.includes(pri)))fal='Tocó primero una bola que no es suya';
  S.n++;S.saque=0;S.E=r.fin.map(b=>b&&[b[0],b[1]]);
  const u=S.ult={n:S.n,E0,tiro:r.tiro,por:p.id,e,dur:r.dur,pri,met,fal,sigue:0,msg:''},espera=Math.round(r.dur*1000)+T_REP;
  if(met.includes(8)){
   if(saque){u.msg='La 8 en el saque: se acomoda de nuevo';S.E=F.rack(rnd);S.mano='cocina';S.saque=1;u.sigue=1;return reloj(espera)}
   if(fal||!en8){u.msg=fal?'Metió la 8 con falta':'Metió la 8 antes de tiempo';return gana(1-e,u.msg,espera)}
   u.msg='Metió la 8';return gana(e,u.msg,espera)}
  let sigue=false;
  if(!fal){if(saque)sigue=obj.length>0;
   else if(!mi){if(obj.length){const g=obj[0]<8?'l':'r',o=g=='l'?'r':'l';S.gr=e==0?[g,o]:[o,g];sigue=true}}
   else sigue=obj.some(i=>mi.includes(i))}
  u.sigue=sigue?1:0;S.mano=fal?'cocina':null;
  if(!sigue)pasa();
  reloj(espera)}

 // devuelve un texto si no se pudo
 function tirar(p,m){const E=S.E.map(e=>e&&e.slice());
  if(S.mano){const coc=S.mano=='cocina';let x=+m.x,z=+m.z;
   if(m.x==null||m.z==null||!isFinite(x)||!isFinite(z))[x,z]=lugar(E,coc);
   x=r4(x);z=r4(z);if(!F.libre(E,x,z,coc))return 'La blanca no cabe ahí';E[0]=[x,z]}
  if(!E[0])E[0]=lugar(E,true);
  const T={a:+m.a,v:+m.v,ex:+m.ex||0,ey:+m.ey||0};
  if(!isFinite(T.a)||!isFinite(T.v)||T.v<=0||!isFinite(T.ex)||!isFinite(T.ey))return 'Tiro inválido';
  juzga(p,E,F.simula(E,T))}
 function tiroBot(p){const coc=S.mano=='cocina',c=S.mano||!S.E[0]?lugar(S.E,coc):S.E[0];
  let d=null;try{d=botTiro({E:S.E,c,legales:legales(),saque:S.saque,niv:p.niv,rnd,mano:!!S.mano&&!S.saque,mias:mias(S.turno)})}catch(_){}
  d=Object.assign({x:c[0],z:c[1]},d||{});if(tirar(p,d))tirar(p,{x:c[0],z:c[1],a:0,v:2})}
 function tiempo(){const p=quien();S.n++;S.ult={n:S.n,E0:S.E.map(e=>e&&e.slice()),tiro:null,por:p.id,e:S.turno,dur:0,pri:-1,met:[],fal:'Se acabó el tiempo',sigue:0,msg:''};
  if(!S.saque)S.mano='cocina';pasa();reloj(0)}

 // se fue (o se levantó) alguien: en el reto suelta su lugar; en juego, 1 contra 1 pierde su equipo; 2 contra 2 lo cubre un bot
 function salir(id){const w=donde(id);if(!w)return;const [e,j]=w;
  if(S.fase=='arma'){if(id===S.org)return libre();S.eq[e][j]=null;return}
  if(S.fase=='fin'){S.eq[e][j]=Object.assign(nuevoBot(S.niv),{n:S.eq[e][j].n+' (bot)'});if(!humanos().length)libre();return}
  if(S.modo==1){gana(1-e,S.eq[e][j].n+' se fue',0);S.eq[e][j]=Object.assign(nuevoBot(S.niv),{n:S.eq[e][j].n});return}
  S.eq[e][j]=nuevoBot(S.niv);if(!humanos().length)libre()}

 function tick(alive){if(alive)humanos().forEach(p=>{if(!alive(p.id))salir(p.id)});
  if(S.fase=='arma'&&now()>=S.plazo)return libre();
  if(S.fase=='fin'&&now()>=S.plazo)return libre();
  if(S.fase!='juego')return;const p=quien();
  if(p.bot&&now()>=S.botT)return tiroBot(p);
  if(!p.bot&&now()>=S.plazo)tiempo()}

 // op: retar {modo:1|2, a: id a quien retas (1 contra 1), bot:1 (contra bot), niv:0..2} · unir {e} (aceptar el reto o entrar
 // a un equipo en 2 contra 2) · rechazar · empezar (el que retó; llena huecos con bots) · tiro {a,v,ex,ey,x,z} · revancha · salir
 // alive (opcional): para no retar a alguien que ya no está
 function act(id,name,m,alive){m=m||{};const op=m.op,w=donde(id),p=w?S.eq[w[0]][w[1]]:null;if(p&&name)p.n=name;
  if(op=='retar'){if(S.fase!='libre')return 'La mesa está ocupada';
   const modo=m.modo==2?2:1,niv=[0,1,2].includes(m.niv)?m.niv:1;
   if(modo==1&&!m.bot){const a=String(m.a||'').slice(0,16);if(!a||a===id)return 'Elige a quién retar';if(alive&&!alive(a))return 'Esa persona ya no está aquí';S.inv=a}
   else S.inv=null;
   S.modo=modo;S.niv=niv;S.eq=[Array(modo).fill(null),Array(modo).fill(null)];S.eq[0][0]={id,n:name,bot:0};S.org=id;
   if(modo==1&&m.bot)return empezar();
   S.fase='arma';S.plazo=now()+T_RETO;return}
  if(op=='unir'){if(S.fase!='arma')return 'No hay reto abierto';if(w)return;if(S.inv&&S.inv!==id)return 'El reto es para alguien más';
   let e=m.e===0||m.e===1?m.e:(S.eq[1].includes(null)?1:0),j=S.eq[e].indexOf(null);if(j<0)return 'Ese equipo ya está completo';
   S.eq[e][j]={id,n:name,bot:0};if(todos().length==2*S.modo)empezar();return}
  if(op=='rechazar'){if(S.fase=='arma'&&S.inv===id)libre();return}
  if(op=='salir')return salir(id);
  if(!p)return;
  if(op=='empezar'){if(S.fase!='arma')return;if(id!==S.org)return 'Solo quien retó puede empezar';if(S.inv)return 'Falta que acepte el reto';return empezar()}
  if(op=='revancha'){if(S.fase!='fin')return;S.n=0;S.ult=null;S.gana=-1;S.por='';S.ti=[0,0];return acomodar(rnd()<.5?0:1)}
  if(op=='tiro'){if(S.fase!='juego')return 'No hay partida';if(quien()!==p)return 'No es tu turno';return tirar(p,m)}
  return 'Acción desconocida'}

 function view(id){const w=donde(id);
  return {fase:S.fase,modo:S.modo,niv:S.niv,org:S.org,inv:S.inv,left:S.plazo?Math.max(0,S.plazo-now()):0,
   eq:S.eq.map(t=>t.map(p=>p&&{id:p.id,n:p.n,bot:p.bot})),yo:w,turno:S.turno,ti:S.ti,gr:S.gr,mano:S.mano,saque:S.saque,
   E:S.E,n:S.n,ult:S.ult,gana:S.gana,por:S.por}}
 return {act,tick,view,S,legales}}

module.exports=Object.assign(mesa(),{mesa,lugar,T_TIRO});
