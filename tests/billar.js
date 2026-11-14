// Pruebas de la física del billar (billar_fis.js).  Uso: node tests/billar.js
const assert=require('assert'),F=require('../billar_fis.js');
let n=0;const ok=(t,f)=>{try{f();n++}catch(e){console.error('x '+t);throw e}};
const {R,L,A:AN,P,SEG,BANDAS}=F.M,A=F.A,g=A.g,{PARADA,GIRO,DESL,ROD,METIDA}=F.EST,I=.4*R*R;
const mesa=(...bs)=>{const E=new Array(16).fill(null);bs.forEach(([i,x,z])=>E[i]=[x,z]);return E};
const cerca=(a,b,tol,m)=>assert(Math.abs(a-b)<=tol,(m||'')+' '+a+' vs '+b);
const ang=(x,z)=>Math.atan2(z,x),gr=r=>r*180/Math.PI;
const entre=(x,a,b,m)=>assert(x>=a&&x<=b,(m||'')+' '+x+' fuera de ['+a+', '+b+']');
// velocidad con que sale la blanca (taco nivelado)
const vb=(v,ex=0,ey=0)=>{const ox=ex*A.efmax,oy=ey*A.efmax;return (1+A.etaco)*v/(1+A.mbola/A.mtaco+2.5*(ox*ox+oy*oy))};
// tiro hacia el punto (x,z)
const hacia=(E,x,z,v,ex=0,ey=0)=>({a:Math.atan2(z-E[0][1],x-E[0][0]),v,ex,ey});
const ener=b=>.5*(b.vx*b.vx+b.vz*b.vz)+.5*I*(b.wx*b.wx+b.wy*b.wy+b.wz*b.wz);
const bola=o=>Object.assign(F._.mk(0,0),o);
// el primer cuadro de la bola i después del evento e (lo que trae justo después del choque)
const tras=(r,i,e)=>r.kf[i].find(k=>k.t>=e.t);

ok('seno y coseno propios iguales a los de Math',()=>{for(let i=0;i<=4000;i++){const a=-12+i*.006,[c,s]=F.sc(a);cerca(c,Math.cos(a),2e-15);cerca(s,Math.sin(a),2e-15)}});

ok('norma: cuantiza, recorta y no deja pasar basura',()=>{const t=F.norma({a:7,v:99,ex:1,ey:1});cerca(t.a,7-2*Math.PI,1e-6);assert.strictEqual(t.v,A.vmax);
 assert(t.ex*t.ex+t.ey*t.ey<=1);assert.deepStrictEqual(F.norma({a:NaN,v:'x',ex:undefined}),{a:0,v:0,ex:0,ey:0});
 assert.strictEqual(F.norma({v:-3}).v,0);const u=F.norma({a:.1234567891,v:1.234567});assert.strictEqual(u.a,.123457);assert.strictEqual(u.v,1.2346)});

ok('determinista: el mismo tiro da bit por bit lo mismo, también tras pasar por JSON',()=>{const rnd=F.azar(3);
 for(let k=0;k<5;k++){const E=F.rack(rnd),T={a:(rnd()-.5)*.03,v:5+rnd()*2,ex:rnd()-.5,ey:rnd()-.5};
  const a=F.simula(E,T),b=F.simula(JSON.parse(JSON.stringify(E)),JSON.parse(JSON.stringify(T)));
  assert.strictEqual(JSON.stringify([a.fin,a.ev]),JSON.stringify([b.fin,b.ev]))}
 // una partida: cada tiro sale del final del anterior
 const juega=()=>{const r=F.azar(11);let E=F.rack(r);const out=[];for(let k=0;k<12&&E[0];k++){const T={a:r()*7,v:.5+r()*5,ex:r()-.5,ey:r()-.5};const s=F.simula(E,T);out.push(s.fin);E=JSON.parse(JSON.stringify(s.fin))}return JSON.stringify(out)};
 assert.strictEqual(juega(),juega())});

ok('golpe: velocidad del taco a la bola y rodado natural con la suela a 2/5 R arriba',()=>{
 const r=F.simula(mesa([0,-1,0]),{a:0,v:1,ey:.8});const k=r.kf[0][0];
 cerca(k.vx,vb(1,0,.8),1e-12);assert.strictEqual(k.s,ROD);cerca(k.wz,-k.vx/R,1e-9);
 const c=F.simula(mesa([0,-1,0]),{a:0,v:1}).kf[0][0];cerca(c.vx,1.75/(1+.17/.54),1e-12);assert.strictEqual(c.s,DESL);cerca(c.wz,0,1e-15)});

ok('rodando: se para a v²/(2·mur·g), en v/(mur·g) segundos, en línea recta',()=>{
 for(const [a,v] of [[0,.3],[.7,.25],[-2.4,.2]]){const E=mesa([0,0,0]),r=F.simula(E,{a,v,ey:.8}),v0=vb(v,0,.8),d=v0*v0/(2*A.mur*g),[c,s]=F.sc(a);
  cerca(r.fin[0][0],d*c,1e-9,'x');cerca(r.fin[0][1],d*s,1e-9,'z');cerca(r.dur,v0/(A.mur*g),1e-9,'t');assert.strictEqual(r.kf[0].length,2)}});

ok('deslizando: rueda a (5v - 2R·wz)/7 al tiempo 2u/(7·mus·g) (golpe al centro, retroceso y seguimiento)',()=>{
 for(const ey of [0,-1,-.5,.3,1]){const r=F.simula(mesa([0,-1.1,0]),{a:0,v:.8,ey}),k0=r.kf[0][0],k1=r.kf[0][1],u=k0.vx+R*k0.wz,tau=2*Math.abs(u)/(7*A.mus*g);
  if(Math.abs(ey-.8)<1e-9)continue;cerca(k1.t,tau,1e-12,'tau');cerca(k1.vx,(5*k0.vx-2*R*k0.wz)/7,1e-12,'v');assert.strictEqual(k1.s,ROD);
  cerca(k1.x,-1.1+k0.vx*tau-.5*A.mus*g*Math.sign(u)*tau*tau,1e-12,'x')}});

ok('choque de frente sin efecto: la blanca se queda con (1-e)/2 y la otra sale con (1+e)/2',()=>{
 const p=bola({x:0,vx:2,s:DESL}),q=bola({x:2*R,s:PARADA});F._.cte();const v=F._.bb(p,q);cerca(v,2,1e-15);
 cerca(p.vx,(1-A.eb),1e-12);cerca(q.vx,(1+A.eb),1e-12);cerca(p.vz,0,1e-15);cerca(q.wy,0,1e-15)});

ok('bola-bola: se conserva el momento y nunca se gana energía (10 000 choques al azar)',()=>{F._.cte();const r=F.azar(5),x=()=>r()*2-1;
 for(let k=0;k<10000;k++){const a=r()*7,p=bola({vx:x()*5,vz:x()*5,wx:x()*200,wy:x()*200,wz:x()*200}),q=bola({x:2*R*Math.cos(a),z:2*R*Math.sin(a),vx:x()*3,vz:x()*3,wx:x()*200,wy:x()*200,wz:x()*200});
  const e0=ener(p)+ener(q),mx=p.vx+q.vx,mz=p.vz+q.vz;F._.bb(p,q);cerca(p.vx+q.vx,mx,1e-12);cerca(p.vz+q.vz,mz,1e-12);assert(ener(p)+ener(q)<=e0*(1+1e-12)+1e-15,'energía '+k)}});

ok('banda: nunca se gana energía y la bola sale hacia la mesa (10 000 al azar)',()=>{F._.cte();const r=F.azar(6),x=()=>r()*2-1;
 for(let k=0;k<10000;k++){const a=r()*7,nx=Math.cos(a),nz=Math.sin(a),b=bola({vx:x()*8,vz:x()*8,wx:x()*300,wy:x()*300,wz:x()*300});
  const e0=ener(b),v=F._.bc(b,nx,nz);assert(ener(b)<=e0*(1+1e-12)+1e-15,'energía '+k);if(v>0)assert(b.vx*nx+b.vz*nz>0)}});

ok('banda de frente: rebota con e(v) y a una bola rodando la nariz le come el giro',()=>{F._.cte();
 const b=bola({vx:-1.5,s:DESL}),e=Math.max(A.ecmin,A.ec0-A.ec1*1.5);F._.bc(b,1,0);cerca(b.vx,1.5*e,1e-12);cerca(b.vz,0,1e-15);cerca(b.wy,0,1e-15);
 const hh=(2*A.nariz-1)*R,rh=Math.sqrt(R*R-hh*hh),c=bola({vx:-1.5,wz:1.5/R});F._.bc(c,1,0);const fk=Math.min(1.5/2.5,A.muc*(1+e)*1.5*R/rh);
 cerca(c.vx,1.5*e,1e-12);cerca(c.wz,1.5/R-2.5*fk/R,1e-9);assert(c.wz<1.5/R&&c.wz>-c.vx/R)});

ok('banda en ángulo sin efecto: la fricción frena lo que corre a lo largo de la banda',()=>{F._.cte();
 const hh=(2*A.nariz-1)*R,rh=Math.sqrt(R*R-hh*hh),b=bola({vx:1,vz:-1}),e=Math.max(A.ecmin,A.ec0-A.ec1);F._.bc(b,0,1);const f=Math.min(1/3.5,A.muc*(1+e)*R/rh);
 cerca(b.vz,e,1e-12);cerca(b.vx,1-f,1e-12);assert(b.wy!==0)});

ok('efecto lateral en la banda: a favor abre el ángulo, en contra lo cierra',()=>{const rel=ex=>{
  const E=mesa([0,0,0]),r=F.simula(E,{a:Math.PI/4,v:1.2,ex}),e=r.ev.find(e=>e.k=='banda'),k=tras(r,0,e);return Math.abs(k.vx/k.vz)};
 const iz=rel(-1),ce=rel(0),de=rel(1);assert(iz>ce&&ce>de,iz+' '+ce+' '+de)});

ok('regla de los 90°: blanca sin giro en corte de media bola sale casi en ángulo recto con la otra',()=>{
 const E=mesa([0,0,0],[1,2*R+.001,R]),r=F.simula(E,{a:0,v:1}),e=r.ev.find(e=>e.k=='bola'),c=tras(r,0,e),o=tras(r,1,e);
 assert.strictEqual(e.a,0);let d=gr(Math.abs(ang(c.vx,c.vz)-ang(o.vx,o.vz)));if(d>180)d=360-d;entre(d,82,90,'ángulo')});

ok('regla de los 30°: blanca rodando en media bola acaba desviada unos 30°',()=>{
 for(const v of [.8,1.6]){const E=mesa([0,-.8,0],[1,0,R]),r=F.simula(E,{a:0,v,ey:.8}),e=r.ev.find(e=>e.k=='bola');
  const k=r.kf[0].find(k=>k.t>e.t&&k.s===ROD);entre(gr(Math.abs(ang(k.vx,k.vz))),27,36,'v='+v)}});

ok('tiro inducido: en un corte la bola tocada se abre un poco de la línea de centros, hacia donde va la blanca',()=>{
 const E=mesa([0,0,0],[1,2*R+.001,R]),r=F.simula(E,{a:0,v:.8}),e=r.ev.find(e=>e.k=='bola'),o=tras(r,1,e);
 const lc=ang(F.en(r,1,e.t).x-F.en(r,0,e.t).x,F.en(r,1,e.t).z-F.en(r,0,e.t).z),d=gr(ang(o.vx,o.vz)-lc);entre(d,-5,-.3,'grados (la blanca va hacia -z)')});

ok('retroceso y seguimiento: tras pegar de frente la blanca vuelve, sigue o casi se queda',()=>{
 const v=ey=>{const r=F.simula(mesa([0,-.3,0],[1,0,0]),{a:0,v:2.5,ey}),e=r.ev.find(e=>e.k=='bola'),k=r.kf[0].find(k=>k.t>e.t&&k.s===ROD);return k.vx};
 const d=v(-1),s=v(1),c=v(-.25);assert(d<-.4,'retroceso '+d);assert(s>.4,'seguimiento '+s);assert(c<0&&c>-.3,'casi se queda '+c)});

ok('efecto lateral sin avance: tras pegar de frente con efecto, la blanca queda girando en su lugar y luego se para',()=>{
 const r=F.simula(mesa([0,0,0],[1,2*R+.0005,0]),{a:0,v:1,ex:1}),k=r.kf[0];const g1=k.find(f=>f.s===GIRO);assert(g1,'giro');
 const fin=k[k.length-1];assert.strictEqual(fin.s,PARADA);cerca(fin.t-g1.t,Math.abs(g1.wy)/(2.5*A.musp*g/R),1e-9)});

ok('troneras: tiro limpio a cada una (suave y fuerte) cae en esa',()=>{for(let p=0;p<6;p++)for(const v of [.9,6]){const H=P[p];
 const E=H.ox?mesa([0,H.ox*(L/2-.45),H.oz*(AN/2-.45)]):mesa([0,.3,-H.oz*.2]),r=F.simula(E,hacia(E,H.x,H.z,v)),e=r.ev.find(e=>e.k=='tronera');
 assert(e&&e.a===0&&e.p===p,'tronera '+p+' v='+v);assert.strictEqual(r.fin[0],null)}});

ok('quijadas: rozando la boca a veces entra y a veces sale, nunca se escapa',()=>{let dentro=0,fuera=0;
 for(let k=-30;k<=30;k++){const E=mesa([0,.6,.2]),r=F.simula(E,hacia(E,P[3].x,P[3].z+k*.003,3));if(r.fin[0])fuera++;else dentro++;sana(r,'boca '+k)}
 assert(dentro>5&&fuera>5,dentro+'/'+fuera)});

// invariantes de un resultado: sin NaN, todo parado dentro de la mesa, sin encimarse ni meterse en las bandas
function enPol(x,z,pol){let c=false;for(let i=0,j=pol.length-1;i<pol.length;j=i++){const [xi,zi]=pol[i],[xj,zj]=pol[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)c=!c}return c}
function dSeg(x,z,G){const px=x-G.ax,pz=z-G.az,t=Math.max(0,Math.min(G.l,px*G.ux+pz*G.uz)),dx=px-G.ux*t,dz=pz-G.uz*t;return Math.sqrt(dx*dx+dz*dz)}
function sana(r,m){assert.strictEqual(r.tope,0,m+' tope');assert(r.dur<A.tmax,m+' dur');
 r.fin.forEach((e,i)=>{if(!e)return;const [x,z]=e;assert(isFinite(x)&&isFinite(z),m+' NaN');
  assert(Math.abs(x)<L/2+.05&&Math.abs(z)<AN/2+.05,m+' fuera '+i+' '+x+','+z);
  BANDAS.forEach(b=>assert(!enPol(x,z,b),m+' dentro de una banda '+i));SEG.forEach(G=>assert(dSeg(x,z,G)>=R-1e-6,m+' encimada en banda '+i+' '+dSeg(x,z,G)));
  P.forEach(H=>assert((x-H.x)**2+(z-H.z)**2>=H.r*H.r,m+' en un hoyo '+i));
  for(let j=i+1;j<16;j++){const o=r.fin[j];if(o)assert(Math.hypot(o[0]-x,o[1]-z)>=2*R-1e-6,m+' encimadas '+i+'-'+j)}});
 r.kf.forEach(k=>k.forEach(f=>{assert(isFinite(f.x+f.z+f.vx+f.vz+f.wx+f.wy+f.wz),m+' NaN');if(f.s>=0)SEG.forEach(G=>assert(dSeg(f.x,f.z,G)>=R-1e-5,m+' cruzó una banda'))}))}

ok('mesas al azar: 600 tiros (y partidas de 12 tiros) sin escapar, encimarse ni atravesar bandas',()=>{const r=F.azar(21);
 for(let k=0;k<600;k++){const E=new Array(16).fill(null),nb=1+Math.floor(r()*16);
  for(let i=0;i<nb;i++)for(let t=0;t<50;t++){const x=(r()*2-1)*(L/2-R),z=(r()*2-1)*(AN/2-R);if(F.libre(E,x,z)&&(!E[0]||Math.hypot(E[0][0]-x,E[0][1]-z)>=2*R)){E[i]=[x,z];break}}
  if(!E[0])continue;const T={a:r()*7,v:.05+r()*A.vmax,ex:r()*2-1,ey:r()*2-1};sana(F.simula(E,T),'tiro '+k)}
 for(let p=0;p<30;p++){let E=F.rack(r);for(let k=0;k<12&&E[0];k++){const s=F.simula(E,{a:r()*7,v:.3+r()*6.7,ex:r()*2-1,ey:r()*2-1});sana(s,'partida '+p+'/'+k);E=s.fin}}});

ok('repetición: en() empieza en E0, acaba en fin y nunca brinca',()=>{const r0=F.azar(8);
 for(let k=0;k<6;k++){const E=F.rack(r0),r=F.simula(E,{a:(r0()-.5)*.04,v:6.5,ex:r0()-.5,ey:r0()-.5});
  for(let i=0;i<16;i++){const a=F.en(r,i,0);cerca(a.x,E[i][0],1e-15);let px=a.x,pz=a.z;
   for(let t=1/240;t<=r.dur+.01;t+=1/240){const b=F.en(r,i,t);if(b.s===METIDA)break;assert(Math.hypot(b.x-px,b.z-pz)<=12/240,'brinco '+i+' t='+t);px=b.x;pz=b.z}
   const f=F.en(r,i,r.dur+1);if(r.fin[i]){cerca(f.x,r.fin[i][0],1e-9);cerca(f.z,r.fin[i][1],1e-9)}else assert.strictEqual(f.s,METIDA)}}});

ok('triángulo: 15 bolas sin encimarse, la 8 al centro, lisa y rayada en las esquinas, y el mismo con la misma semilla',()=>{
 for(let s=1;s<40;s++){const E=F.rack(F.azar(s));for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)assert(Math.hypot(E[i][0]-E[j][0],E[i][1]-E[j][1])>=2*R+.2*A.hueco-1e-12);
  const h=(2*R+A.hueco)*Math.sqrt(3)/2;cerca(E[8][0],L/4+2*h,A.hueco+1e-12);cerca(E[8][1],0,A.hueco+1e-12);
  const esq=E.map((e,i)=>[i,e]).filter(([i,e])=>i&&e[0]>L/4+3.5*h&&Math.abs(e[1])>1.5*(2*R)).map(([i])=>i);assert.strictEqual(esq.length,2);assert((esq[0]<8)!==(esq[1]<8),esq.join())}
 assert.deepStrictEqual(F.rack(F.azar(9)),F.rack(F.azar(9)))});

ok('libre: fuera de la mesa, encimada o fuera de la cocina no se puede',()=>{const E=mesa([1,0,0]);
 assert(!F.libre(E,0,R));assert(F.libre(E,0,2*R+1e-9));assert(!F.libre(E,L/2,0));assert(F.libre(E,-L/2+R,0,true));assert(!F.libre(E,-L/4+.01,0,true))});

ok('saque: abre todo el triángulo, rápido y sin topes',()=>{const r=F.azar(31),t0=Date.now();let met=0,bl=0,qt=0;const N=40;
 for(let k=0;k<N;k++){const E=F.rack(r),s=F.simula(E,{a:(r()-.5)*.02,v:A.vmax});sana(s,'saque '+k);met+=s.ev.filter(e=>e.k=='tronera').length;if(!s.fin[0])bl++;
  const quietas=s.fin.filter((e,i)=>i&&e&&Math.hypot(e[0]-E[i][0],e[1]-E[i][1])<.05).length;qt+=quietas;assert(quietas<5,'triángulo sin abrir: '+quietas)}
 const ms=Date.now()-t0;assert(ms<N*60,ms+' ms');entre(met/N,.3,3,'metidas por saque');assert(qt/N<1.2,'quietas por saque '+qt/N);assert(bl<N/4,'blanca metida '+bl)});

console.log('billar: '+n+' pruebas bien');
