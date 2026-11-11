// Blackjack de la mesa media luna del sótano. Sin salas: lo usa server.js desde /casa (b.bj).
// 5 asientos, zapato de 6 barajas (se rebaraja al pasar el 75 %), el crupier se planta en todo 17, blackjack paga 3 a 2.
// Fichas por sesión: al sentarte tienes 1,000; si bajas del mínimo, recarga a 1,000. Apuesta de 10 a 500 en múltiplos de 5.
// Opciones: pedir, plantar, doblar, dividir (hasta 4 manos; Ases una vez y una carta cada uno), seguro (crupier con As, paga 2 a 1)
// y rendirse (temprana: antes de que el crupier revise su blackjack; recuperas la mitad).
// Fases: apuestas → reparto → seguro (si el crupier muestra As o 10) → turnos → crupier → pago → apuestas.
// Cartas: número 0..51; rango c%13 (0=A, 1..9 = 2..10, 10..12 = J Q K), palo c/13|0.
const N=5,MIN=10,MAX=500,INI=1000,BARAJAS=6,CORTE=0.75,T_AP=15000,T_ACT=20000,T_PAGO=5000;
const val=c=>{const r=c%13;return r==0?1:r>=9?10:r+1};
function total(cs){let t=0,a=0;for(const c of cs){t+=val(c);if(c%13==0)a=1}const s=a&&t+10<=21;return {t:s?t+10:t,s:!!s}}
const esBJ=m=>m.c.length==2&&!m.div&&total(m.c).t==21;
function barajar(){const z=[];for(let i=0;i<BARAJAS*52;i++)z.push(i%52);for(let i=z.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[z[i],z[j]]=[z[j],z[i]]}return z}

function mesa(o={}){
 const now=o.now||Date.now,nueva=o.barajar||barajar;
 const S={fase:'apuestas',plazo:0,z:nueva(),pos:0,cr:[],tapada:true,as:Array(N).fill(null),turno:null,ronda:0,rebaraja:0,msg:''};
 const carta=()=>{if(S.pos>=S.z.length){S.z=nueva();S.pos=0;S.rebaraja++}return S.z[S.pos++]};
 const sentados=()=>S.as.filter(Boolean),enJuego=()=>sentados().filter(a=>a.manos.length);
 const asiento=id=>S.as.findIndex(a=>a&&a.id===id);
 const nueva_mano=(c,a,div)=>({c,a,dob:0,div:!!div,ren:0,fin:0,res:null,neta:0});
 const recarga=a=>{if(a.f<MIN)a.f=INI};

 function limpiar(){S.fase='apuestas';S.plazo=0;S.cr=[];S.tapada=true;S.turno=null;
  sentados().forEach(a=>{a.manos=[];a.ap=0;a.listo=0;a.seg=0;a.dec=0;a.neta=0;recarga(a)})}
 function repartir(){
  if(S.pos>=S.z.length*CORTE){S.z=nueva();S.pos=0;S.rebaraja++}
  S.ronda++;S.cr=[];S.tapada=true;S.msg='';
  const js=sentados().filter(a=>a.ap>0);sentados().forEach(a=>{a.manos=[];a.neta=0;a.seg=0;a.dec=0});
  js.forEach(a=>{a.manos=[nueva_mano([],a.ap)];a.ult=a.ap;a.ap=0;a.listo=0});
  for(let k=0;k<2;k++){js.forEach(a=>a.manos[0].c.push(carta()));S.cr.push(carta())}
  js.forEach(a=>{if(esBJ(a.manos[0]))a.manos[0].fin=1});
  S.fase='reparto';S.plazo=now()+400+350*2*(js.length+1)}
 const arriba=()=>S.cr[0]%13,revisa=()=>arriba()==0||val(S.cr[0])==10;
 function trasReparto(){if(revisa()){S.fase='seguro';S.plazo=now()+T_ACT;enJuego().forEach(a=>{if(a.manos[0].fin&&arriba()!=0)a.dec=1});finSeguro()}else turnos()}
 function finSeguro(force){const L=enJuego();if(!force&&L.some(a=>!a.dec))return;
  if(total(S.cr).t==21){S.tapada=false;S.msg='El crupier tiene blackjack';return pagar()}
  if(arriba()==0)S.msg='El crupier no tiene blackjack';turnos()}
 function turnos(){S.fase='turnos';sig()}
 function sig(){for(let s=0;s<N;s++){const a=S.as[s];if(!a)continue;const m=a.manos.findIndex(h=>!h.fin);if(m>=0){S.turno={s,m};S.plazo=now()+T_ACT;return}}
  S.turno=null;crupier()}
 function crupier(){S.fase='crupier';S.tapada=false;let n=0;
  const vivas=enJuego().some(a=>a.manos.some(h=>!h.ren&&total(h.c).t<=21&&!esBJ(h)));
  if(vivas)while(total(S.cr).t<17){S.cr.push(carta());n++}
  S.plazo=now()+900+800*n}
 function pagar(){const d=total(S.cr).t,dbj=S.cr.length==2&&d==21;
  enJuego().forEach(a=>{let neta=0;
   if(a.seg){if(dbj){a.f+=a.seg*3;neta+=a.seg*2}else neta-=a.seg}
   a.manos.forEach(h=>{const t=total(h.c).t,bj=esBJ(h);let r,p=0;
    if(h.ren){r='rinde';h.neta=Math.floor(h.a/2)-h.a}
    else{if(t>21)r='pasa';else if(bj&&dbj){r='empate';p=h.a}else if(bj){r='bj';p=h.a+Math.floor(h.a*1.5)}
     else if(dbj)r='pierde';else if(d>21||t>d){r='gana';p=h.a*2}else if(t==d){r='empate';p=h.a}else r='pierde';
     a.f+=p;h.neta=p-h.a}
    h.res=r;h.fin=1;neta+=h.neta});
   a.neta=neta});
  S.fase='pago';S.plazo=now()+T_PAGO}
 function salir(id){const s=asiento(id);if(s<0)return;const a=S.as[s];S.as[s]=null;
  if(!sentados().length)return limpiar();
  if(S.fase=='apuestas')return aTiempo();
  if(S.fase=='seguro')return finSeguro();
  if(S.fase=='turnos'&&S.turno&&S.turno.s==s)sig()}
 function aTiempo(){const L=sentados();if(L.length&&L.every(a=>a.listo))repartir()}

 function tick(alive){if(alive)sentados().filter(a=>!alive(a.id)).forEach(a=>salir(a.id));
  if(!S.plazo||now()<S.plazo)return;
  if(S.fase=='apuestas'){if(sentados().some(a=>a.ap>0))repartir();else S.plazo=0}
  else if(S.fase=='reparto')trasReparto();
  else if(S.fase=='seguro'){enJuego().forEach(a=>a.dec=1);finSeguro(1)}
  else if(S.fase=='turnos'&&S.turno){S.as[S.turno.s].manos[S.turno.m].fin=1;sig()}   // se tardó: se planta
  else if(S.fase=='crupier')pagar();
  else if(S.fase=='pago')limpiar()}

 // Devuelve un texto si la acción no se pudo.
 function act(id,name,m){m=m||{};const op=m.op;let s=asiento(id),a=s>=0?S.as[s]:null;if(a)a.n=name;
  if(op=='sentar'){if(a)return;const k=m.s|0;if(k<0||k>=N)return 'Ese lugar no existe';if(S.as[k])return 'Ese lugar ya está ocupado';
   S.as[k]={id,n:name,f:INI,manos:[],ap:0,ult:0,listo:0,seg:0,dec:0,neta:0};return}
  if(!a)return;
  if(op=='parar')return salir(id);
  if(S.fase=='apuestas'){
   if(op=='apostar'){const v=Math.round(+m.v||0);if(v&&(v<MIN||v>MAX||v%5))return 'La apuesta va de '+MIN+' a '+MAX;
    if(v>a.f+a.ap)return 'No te alcanzan las fichas';a.f+=a.ap-v;a.ap=v;a.listo=0;if(v&&!S.plazo)S.plazo=now()+T_AP;return}
   if(op=='listo'){if(!a.ap)return 'Primero apuesta';a.listo=1;return aTiempo()}
   return}
  const h0=a.manos[0];
  if(S.fase=='seguro'){if(!h0||a.dec)return;
   if(op=='seguro'){if(arriba()!=0)return;const c=Math.floor(h0.a/2);if(c>a.f)return 'No te alcanzan las fichas';a.f-=c;a.seg=c;a.dec=1}
   else if(op=='noseguro')a.dec=1;
   else if(op=='rendir'){if(h0.fin)return;h0.ren=1;h0.fin=1;a.f+=Math.floor(h0.a/2);a.dec=1}
   else return;
   return finSeguro()}
  if(S.fase!='turnos'||!S.turno||S.turno.s!=s)return;
  const h=a.manos[S.turno.m],t=()=>total(h.c).t;
  if(op=='pedir'){h.c.push(carta());if(t()>=21)h.fin=1}
  else if(op=='plantar')h.fin=1;
  else if(op=='doblar'){if(h.c.length!=2)return;if(a.f<h.a)return 'No te alcanzan las fichas';a.f-=h.a;h.a*=2;h.dob=1;h.c.push(carta());h.fin=1}
  else if(op=='dividir'){if(h.c.length!=2||val(h.c[0])!=val(h.c[1]))return;if(a.manos.length>=4)return 'Máximo 4 manos';if(a.f<h.a)return 'No te alcanzan las fichas';
   const ases=h.c[0]%13==0,o=nueva_mano([h.c.pop()],h.a,1);a.f-=h.a;h.div=1;a.manos.splice(S.turno.m+1,0,o);
   [h,o].forEach(x=>{x.c.push(carta());if(ases||total(x.c).t==21)x.fin=1})}
  else if(op=='rendir'){if(a.manos.length!=1||h.c.length!=2||h.div)return;h.ren=1;h.fin=1;a.f+=Math.floor(h.a/2)}
  else return;
  if(h.fin)sig()}

 function view(){const vc=S.tapada&&S.cr.length==2?[S.cr[0],-1]:S.cr;
  return {fase:S.fase,left:S.plazo?Math.max(0,S.plazo-now()):0,ronda:S.ronda,rebaraja:S.rebaraja,msg:S.msg,min:MIN,max:MAX,
   zapato:S.z.length-S.pos,cr:{c:vc,t:S.tapada?(S.cr.length?total([S.cr[0]]).t:0):total(S.cr).t},turno:S.turno,
   as:S.as.map(a=>a&&{id:a.id,n:a.n,f:a.f,ap:a.ap,ult:a.ult,listo:a.listo,seg:a.seg,dec:a.dec,neta:a.neta,
    manos:a.manos.map(h=>{const x=total(h.c);return {c:h.c,a:h.a,t:x.t,s:x.s,dob:h.dob,div:h.div,ren:h.ren,fin:h.fin,bj:esBJ(h),res:h.res,neta:h.neta}})})}}
 return {act,tick,view,S}}

module.exports=Object.assign(mesa(),{mesa,total,val,MIN,MAX,INI,N});
