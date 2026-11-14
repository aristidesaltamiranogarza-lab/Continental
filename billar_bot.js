// Bot de Bola 8 (L5). Solo en el servidor (g_billar.js). Juega como una persona: para cada bola legal y cada hoyo con camino
// libre arma el tiro de bola fantasma, corrige la puntería midiendo en BFIS hacia dónde sale la bola (el corte "tira" la bola)
// y prueba fuerzas y efectos; califica lo que pasa: ganar, meter sin falta y dejar la blanca con otro tiro fácil, o una defensa
// que deje al rival tapado. Sin camino a ninguna bola legal busca carambola por banda. Con bola en mano elige dónde ponerla.
// niv 0..2 (fácil, normal, difícil): cuántos tiros mira, si piensa en la posición y la defensa, y el pulso (ruido al final).
const F=require('./billar_fis.js');
const {R,L,A:AN,P,MC}=F.M,D=2*R,VM=F.A.vmax,AB=MC/Math.SQRT2;
// a dónde se apunta cada hoyo: al centro de su boca (entre las puntas de las bandas), no al hoyo; de lado así sí entra
const BOCA=P.map(p=>p.ox===0?[p.x,p.oz*AN/2]:[p.ox*(L/2-AB/2),p.oz*(AN/2-AB/2)]);
const LISAS=[1,2,3,4,5,6,7],RAY=[9,10,11,12,13,14,15];
const NIV=[
 {k:4,fz:[1],ef:[0],afina:0,pos:0,def:0,sims:24,ang:.03,vel:.15,mano:1,cal:0},
 {k:6,fz:[.8,1.3],ef:[0,.35],afina:1,pos:.6,def:.5,sims:70,ang:.008,vel:.07,mano:3,cal:0},
 {k:9,fz:[.7,1,1.4],ef:[-.4,0,.4],afina:2,pos:1,def:1,sims:130,ang:.0025,vel:.025,mano:5,cal:3}];

// ¿pasa una bola del punto a al b sin rozar otra? (ex1, ex2: bolas que no cuentan)
function camino(E,ax,az,bx,bz,ex1,ex2){const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1e-12;
 for(let i=0;i<16;i++){if(i===ex1||i===ex2||!E[i])continue;const x=E[i][0],z=E[i][1];let t=((x-ax)*dx+(z-az)*dz)/l2;t=t<0?0:t>1?1:t;
  const qx=ax+t*dx-x,qz=az+t*dz-z;if(qx*qx+qz*qz<D*D*.98)return false}return true}

// tiros directos desde la blanca en c a las bolas obj, del más fácil al más difícil
function tiros(E,c,obj){const r=[];
 for(const i of obj){const b=E[i];if(!b)continue;
  for(let h=0;h<P.length;h++){const p=P[h],q=BOCA[h],dx=q[0]-b[0],dz=q[1]-b[1],dl=Math.sqrt(dx*dx+dz*dz),ux=dx/dl,uz=dz/dl;
   if(p.ox===0&&Math.abs(uz)<.5)continue;   // a la de en medio no entra muy de lado
   const gx=b[0]-D*ux,gz=b[1]-D*uz,ax=gx-c[0],az=gz-c[1],al=Math.sqrt(ax*ax+az*az);if(al<1e-4)continue;
   const co=(ax*ux+az*uz)/al;if(co<.3)continue;
   if(!camino(E,c[0],c[1],gx,gz,0,i)||!camino(E,b[0],b[1],q[0],q[1],i,0))continue;
   r.push({i,h,f:co*co/(1+.5*al+.8*dl),a:Math.atan2(az,ax),al,dl,co,ux,uz})}}
 return r.sort((x,y)=>y.f-x.f)}
const facil=(E,c,obj)=>{if(!c)return 0;const t=tiros(E,c,obj);return t.length?t[0].f:0};

// qué toca primero la blanca y qué se mete
function lee(r){let pri=-1,tc=0;for(const v of r.ev)if(v.k=='bola'&&(v.a===0||v.b===0)){pri=v.a===0?v.b:v.a;tc=v.t;break}
 return {pri,tc,met:r.ev.filter(v=>v.k=='tronera').map(v=>v.a)}}

// lo que vale el resultado r para quien tiró (o: legales, saque, mias, pos, def)
function califica(r,o){const {pri,met}=lee(r),fin=r.fin;
 const fal=met.includes(0)||pri<0||!o.legales.includes(pri);
 if(met.includes(8))return o.saque?0:!fal&&o.legales[0]===8?1e4:-1e4;
 if(fal)return -500;
 const obj=met.filter(i=>i&&i!==8);let mias=o.mias,sigue;
 if(o.saque)sigue=obj.length>0;
 else if(!mias){if(obj.length){mias=obj[0]<8?LISAS:RAY;sigue=true}}
 else sigue=obj.some(i=>mias.includes(i));
 if(sigue){const quedan=(mias||LISAS.concat(RAY)).filter(i=>fin[i]);
  return 100+15*obj.filter(i=>!mias||mias.includes(i)).length+300*o.pos*facil(fin,fin[0],quedan.length?quedan:[8])}
 const suyas=!mias?LISAS.concat(RAY):mias===LISAS?RAY:LISAS,qs=suyas.filter(i=>fin[i]);
 return -10*obj.length-250*o.def*facil(fin,fin[0],qs.length?qs:[8])}

const norm=a=>a-2*Math.PI*Math.round(a/(2*Math.PI));
// hacia dónde sale la bola i cuando la blanca tira con ángulo a
function salida(E,t,i){const r=F.simula(E,t),{pri,tc}=lee(r);if(pri!==i)return null;const b=F.en(r,i,tc);
 return Math.hypot(b.vx,b.vz)>1e-6?Math.atan2(b.vz,b.vx):null}

function tiro(o){const N=NIV[o.niv]||NIV[1],rnd=o.rnd||Math.random,legales=o.legales;
 const ruido=t=>({a:t.a+(rnd()-.5)*2*N.ang,v:Math.max(.3,Math.min(VM,t.v*(1+(rnd()-.5)*2*N.vel))),ex:t.ex||0,ey:t.ey||0});
 if(o.saque){const c=o.c;return Object.assign(ruido({a:Math.atan2(-c[1],L/4-c[0]),v:VM*.92,ey:.1}),{x:c[0],z:c[1]})}
 const cal={legales,saque:0,mias:o.mias||null,pos:N.pos,def:N.def};
 // con bola en mano: los lugares de la cocina con el tiro más fácil
 let lugares=[o.c];
 if(o.mano){const ls=[];for(let ix=0;ix<=8;ix++)for(let iz=0;iz<=8;iz++){const x=-L/2+R*1.5+(L/4-R*1.5)*ix/8,z=(-AN/2+R*1.5)+(AN-R*3)*iz/8;
   if(F.libre(o.E,x,z,true))ls.push({c:[Math.round(x*1e4)/1e4,Math.round(z*1e4)/1e4],f:facil(o.E,[x,z],legales)})}
  ls.sort((a,b)=>b.f-a.f);if(ls.length&&ls[0].f>0)lugares=ls.slice(0,N.mano).map(l=>l.c)}
 let sims=0,mejor=null;const res=[];
 const prueba=(E,t,extra)=>{sims++;const r=F.simula(E,t),s=califica(r,cal)+(extra||0),x={s,t,E,c:E[0]};res.push(x);
  if(!mejor||s>mejor.s)mejor=x;return s};
 const presu=Math.floor(N.sims/lugares.length);
 for(const c of lugares){const E=o.E.map(b=>b&&b.slice());E[0]=c.slice();const tope=sims+presu;
  // tiros a hoyo
  for(const t of tiros(E,c,legales).slice(0,N.k)){if(sims>=tope)break;
   const v0=Math.min(VM,1.1+1.1*(t.al+t.dl)/Math.max(t.co,.5)),des=Math.atan2(t.uz,t.ux);let a=t.a;
   for(let it=0;it<N.afina;it++){const th0=salida(E,{a,v:v0,ex:0,ey:0},t.i),e=.003,th1=salida(E,{a:a+e,v:v0,ex:0,ey:0},t.i);sims+=2;
    if(th0==null||th1==null||Math.abs(norm(th1-th0))<1e-7)break;const da=norm(des-th0)*e/norm(th1-th0);if(Math.abs(da)>.05)break;a+=da}
   for(const fz of N.fz)for(const ey of N.ef){if(sims>=tope)break;prueba(E,{a,v:Math.min(VM,v0*fz),ex:0,ey},0)}}
  // defensa / toque legal: a cada bola legal con camino, llena y delgada por los dos lados
  if(sims<tope&&(!mejor||mejor.s<100))for(const i of legales){const b=E[i];if(!b||sims>=tope)break;
   const dx=b[0]-c[0],dz=b[1]-c[1],dl=Math.hypot(dx,dz);if(!camino(E,c[0],c[1],b[0],b[1],0,i))continue;
   const a0=Math.atan2(dz,dx),fino=Math.asin(Math.min(1,D*.8/dl));
   for(const da of [0,fino,-fino])for(const v of [1.3,2.6]){if(sims>=tope)break;prueba(E,{a:a0+da,v,ex:0,ey:0},-5)}}}
 // nada sirvió: carambola por banda (ángulos alrededor) desde el primer lugar
 if(!mejor||mejor.s<=-500){const E=o.E.map(b=>b&&b.slice());E[0]=lugares[0].slice();
  for(let k=0;k<48;k++)prueba(E,{a:k*Math.PI/24+.013,v:3.6,ex:0,ey:0},0)}
 // difícil: entre los mejores, el que aguanta un pulso imperfecto
 if(N.cal&&mejor.s>=100){res.sort((a,b)=>b.s-a.s);let m2=-Infinity;
  for(const x of res.slice(0,N.cal)){if(x.s<100)break;let sum=x.s;
   for(const d of [-2,2])sum+=califica(F.simula(x.E,Object.assign({},x.t,{a:x.t.a+d*N.ang})),cal);
   if(sum/3>m2){m2=sum/3;mejor=x}}}
 const t=mejor.t,c=mejor.c;
 return Object.assign(ruido(t),{x:c[0],z:c[1]})}

module.exports={tiro,tiros,califica,camino,NIV};
