// billar_fis.js — BFIS: física del billar, la misma en el servidor (require) y en el cliente (window.BFIS).
// Determinista: solo + - * / y Math.sqrt/round/trunc/abs/min/max, que dan bit por bit lo mismo en todos los motores (nada de
// Math.sin/cos/exp/pow/hypot ni Math.random). El billar es caótico: una diferencia de 1e-16 ya cambia cómo acaba un saque, por eso
// las medidas son literales y el ángulo del tiro usa sc() propio. Así un tiro (ángulo, fuerza, efecto) da lo mismo en todos lados.
// Plano de la mesa: x a lo largo, z a lo ancho, y hacia arriba (mano derecha, como la mesa de c_billar3d.js, que la dibuja ×K);
// metros y segundos reales. Estado entre tiros E: 16 × ([x,z] | null = metida); la 0 es la blanca.
// Movimiento por estados con fórmula exacta: deslizando (el apoyo patina: fricción mus, el efecto arriba/abajo se gasta), rodando
// (mur), girando en su lugar (efecto lateral, musp) y parada. Choques: bola-bola con restitución eb y fricción que baja con la velocidad (tiro inducido
// por corte y por efecto, efecto que se transmite); bandas y quijadas con restitución que baja con la velocidad y fricción muc en la nariz
// (cambia el efecto lateral y se come parte del de arriba/abajo); tronera cuando el centro de la
// bola entra al hoyo. Integración: pasos fijos A.dt; en cada paso se busca el primer choque con el tiempo exacto de contacto sobre
// el desplazamiento del paso, todo avanza hasta ahí, se resuelve y se sigue con lo que queda del paso.
(function(){
'use strict';
// ---------- la mesa: 9 pies (WPA) ----------
// paño L×AN entre narices, bola R, banda CW, boca de buchaca de esquina MC y de en medio MS (entre narices),
// DC/DS: cuánto se cierra la quijada hacia el fondo (142° en la esquina, 103.5° en medio)
const R=.028575,L=2.54,AN=1.27,CW=.05,MC=.116,MS=.13,DC=.064,DS=.012;
const P=[];   // hoyos (o: hacia afuera); el orden lo comparte c_billar3d.js
[-1,1].forEach(sx=>[-1,1].forEach(sz=>P.push({x:sx*(L/2+.028),z:sz*(AN/2+.028),r:.062,ox:sx,oz:sz})));
[-1,1].forEach(sz=>P.push({x:0,z:sz*(AN/2+.045),r:.066,ox:0,oz:sz}));
const AB=MC/Math.SQRT2,BANDAS=[];   // cada banda: nariz 0→1, fondo 2→3; quijadas 0→3 y 1→2
[-1,1].forEach(s=>{const n=s*AN/2,f=s*(AN/2+CW);
 BANDAS.push([[-L/2+AB,n],[-MS/2,n],[-MS/2+DS,f],[-L/2+AB-DC,f]],[[MS/2,n],[L/2-AB,n],[L/2-AB+DC,f],[MS/2-DS,f]]);
 const m=s*L/2,g=s*(L/2+CW);BANDAS.push([[m,-AN/2+AB],[m,AN/2-AB],[g,AN/2-AB+DC],[g,-AN/2+AB-DC]])});
// lo que tocan las bolas: segmentos (narices y quijadas) y las puntas de cada banda
const SEG=[],PTS=[];
BANDAS.forEach(b=>{[[0,1],[0,3],[1,2]].forEach(([i,j],k)=>{const [ax,az]=b[i],[bx,bz]=b[j],dx=bx-ax,dz=bz-az,l=Math.sqrt(dx*dx+dz*dz);
  SEG.push({ax,az,ux:dx/l,uz:dz/l,l,nx:-dz/l,nz:dx/l,nariz:k===0,x0:Math.min(ax,bx)-R,x1:Math.max(ax,bx)+R,z0:Math.min(az,bz)-R,z1:Math.max(az,bz)+R})});
 b.forEach(([x,z])=>PTS.push({x,z}))});
const XI=L/2-R-1e-5,ZI=AN/2-R-1e-5;   // con el centro dentro de ±XI × ±ZI no hay banda ni hoyo que tocar
const M={R,L,A:AN,CW,MC,MS,DC,DS,P,BANDAS,SEG,PTS,cabeza:[-L/4,0],pie:[L/4,0]};

// ---------- ajustes (se pueden cambiar en vivo desde la consola; el servidor manda con los suyos) ----------
const A={g:9.81,
 mus:.2,mur:.01,musp:.0127,         // paño: deslizar, rodar, girar sobre su eje (dω/dt = -5/2·musp·g/R)
 eb:.95,mb0:.01,mb1:.108,mbk:1.088, // bola-bola: restitución; fricción mb0 + mb1·e^(-mbk·v) según lo que patinan (Alciatore)
 ec0:.9,ec1:.03,ecmin:.7,muc:.2,    // banda: restitución ec0 - ec1·v (mín. ecmin), fricción
 nariz:.635,                        // altura de la nariz de la banda / diámetro de la bola
 etaco:.75,mbola:.17,mtaco:.54,     // golpe: restitución de la suela, masas (kg)
 efmax:.5,vmax:7,                   // efecto: desplazamiento máximo de la suela (fracción de R); velocidad máxima del taco (m/s)
 dt:1/400,tmax:40,hueco:0};        // paso, tiempo máximo de un tiro, hueco entre bolas del triángulo (pegadas: el golpe se reparte)

const PARADA=0,GIRO=1,DESL=2,ROD=3,METIDA=-1;   // s>0: se mueve; s>=DESL: se traslada; s>=0: en la mesa
const EU=1e-6,EV=1e-6,EW=1e-4,VA=1e-7,MAXEV=400,D2=2*R,TC=4*R*1e-9,TP=2*R*1e-9,TL=1e-9;
let as,ar,ks,kw,hh,rh;
function cte(){as=A.mus*A.g;ar=A.mur*A.g;ks=2.5*as/R;kw=2.5*A.musp*A.g/R;hh=(2*A.nariz-1)*R;rh=Math.sqrt(R*R-hh*hh)}

// coseno y seno con puras sumas y productos (Math.cos cambia en el último bit entre navegadores)
const TAU=6.283185307179586,MP=1.5707963267948966;
function sc(a){a-=TAU*Math.round(a/TAU);const q=Math.round(a/MP),r=a-q*MP,r2=r*r;
 const s=r*(1-r2/6*(1-r2/20*(1-r2/42*(1-r2/72*(1-r2/110*(1-r2/156*(1-r2/210*(1-r2/272))))))));
 const c=1-r2/2*(1-r2/12*(1-r2/30*(1-r2/56*(1-r2/90*(1-r2/132*(1-r2/182*(1-r2/240)))))));
 return q===0?[c,s]:q===1?[-s,c]:q===-1?[s,-c]:[-c,-s]}
// generador para triángulos y bots (mulberry32: enteros de 32 bits, igual en todos lados)
function azar(sem){let a=sem>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}

// ---------- una bola ----------
function mk(x,z){return {x,z,vx:0,vz:0,wx:0,wy:0,wz:0,s:PARADA,p:-1}}
function cp(d,o){d.x=o.x;d.z=o.z;d.vx=o.vx;d.vz=o.vz;d.wx=o.wx;d.wy=o.wy;d.wz=o.wz;d.s=o.s;d.p=o.p;return d}
function foto(b,t){return {t,x:b.x,z:b.z,vx:b.vx,vz:b.vz,wx:b.wx,wy:b.wy,wz:b.wz,s:b.s,p:b.p}}
// el apoyo en el paño está en r=(0,-R,0): su velocidad es u = v + ω×r = (vx + R·wz, vz - R·wx)
function clasifica(b){if(b.s===METIDA)return;const ux=b.vx+R*b.wz,uz=b.vz-R*b.wx;
 if(ux*ux+uz*uz>EU*EU){b.s=DESL;return}
 if(b.vx*b.vx+b.vz*b.vz>EV*EV){b.s=ROD;b.wx=b.vz/R;b.wz=-b.vx/R;return}
 b.vx=b.vz=b.wx=b.wz=0;if(b.wy>EW||b.wy<-EW)b.s=GIRO;else{b.wy=0;b.s=PARADA}}
function gira(b,h){if(b.wy>0){b.wy-=kw*h;if(b.wy<0)b.wy=0}else if(b.wy<0){b.wy+=kw*h;if(b.wy>0)b.wy=0}}
// avanza la bola exactamente dt s con la fórmula de su estado; si en medio cambia (deja de patinar, se para) sigue con la nueva.
// t: tiempo al empezar; kf: lista donde anotar cada cambio (null en las predicciones)
function evol(b,dt,t,kf){for(let k=0;k<8&&dt>0;k++){const s=b.s;if(s<=0)return;let h=dt,fin=false;
  if(s===DESL){   // el apoyo patina: u baja en línea recta a 7/2·mus·g; v y ω cambian a ritmo fijo (trayectoria parabólica)
   const ux=b.vx+R*b.wz,uz=b.vz-R*b.wx,u=Math.sqrt(ux*ux+uz*uz),ex=ux/u,ez=uz/u,tau=2*u/(7*as);if(tau<=dt){h=tau;fin=true}
   const ax=as*ex,az=as*ez;b.x+=(b.vx-.5*ax*h)*h;b.z+=(b.vz-.5*az*h)*h;b.vx-=ax*h;b.vz-=az*h;b.wx+=ks*ez*h;b.wz-=ks*ex*h}
  else if(s===ROD){   // rueda sin patinar y frena a mur·g en línea recta
   const v=Math.sqrt(b.vx*b.vx+b.vz*b.vz),ex=b.vx/v,ez=b.vz/v,tau=v/ar;if(tau<=dt){h=tau;fin=true}
   const ax=ar*ex,az=ar*ez;b.x+=(b.vx-.5*ax*h)*h;b.z+=(b.vz-.5*az*h)*h;
   if(fin)b.vx=b.vz=0;else{b.vx-=ax*h;b.vz-=az*h}b.wx=b.vz/R;b.wz=-b.vx/R}
  else{const tau=(b.wy<0?-b.wy:b.wy)/kw;if(tau<=dt){h=tau;fin=true}}
  gira(b,h);dt-=h;t+=h;
  if(fin){if(s===GIRO)b.wy=0;clasifica(b);if(kf)kf.push(foto(b,t))}}}

// ---------- choques (impulsos por unidad de masa; I = 2/5·R²) ----------
// bola-bola, n de p a q; devuelve con qué velocidad normal se acercaban (0: no se acercaban, no pasa nada)
function bb(p,q){let nx=q.x-p.x,nz=q.z-p.z;const d=Math.sqrt(nx*nx+nz*nz);if(d===0)return 0;nx/=d;nz/=d;
 const vn=(p.vx-q.vx)*nx+(p.vz-q.vz)*nz;if(vn<=VA)return 0;
 const jn=.5*(1+A.eb)*vn;p.vx-=jn*nx;p.vz-=jn*nz;q.vx+=jn*nx;q.vz+=jn*nz;
 // deslizamiento entre las dos superficies en el contacto (r = ±R·n): tangente horizontal t=(-nz,nx) y vertical
 const w=p.wy+q.wy,sx=p.vx-q.vx+R*w*nz,sz=p.vz-q.vz-R*w*nx,st=-sx*nz+sz*nx,sy=R*((p.wz+q.wz)*nx-(p.wx+q.wx)*nz),s=Math.sqrt(st*st+sy*sy);
 if(s>1e-12){const x=A.mbk*s,F=(A.mb0+A.mb1/(1+x*(1+x*(.5+x/6))))*jn;   // e^-x sin Math.exp
 let ft=-st/7,fy=-sy/5;   // lo que haría falta para que dejen de patinar
  if(ft*ft+fy*fy>F*F){const a=-F*st/s,c=-F*sy/s;if(Math.abs(a)<Math.abs(ft))ft=a;if(Math.abs(c)<Math.abs(fy))fy=c}
  // la parte vertical no levanta la bola (la mesa la detiene), solo cambia el giro; a las dos les cambia igual
  p.vx-=ft*nz;p.vz+=ft*nx;q.vx+=ft*nz;q.vz-=ft*nx;const k=2.5/R,dx=-k*nz*fy,dy=-k*ft,dz=k*nx*fy;
  p.wx+=dx;p.wy+=dy;p.wz+=dz;q.wx+=dx;q.wy+=dy;q.wz+=dz}
 return vn}
// banda (nariz, quijada o punta), n horizontal de la banda hacia la bola; devuelve con qué velocidad llegaba.
// La toca en r = -rh·n + hh·y (la nariz, hh sobre el centro): el empuje normal pasa por el centro (su parte vertical la detiene
// la mesa) y no gira la bola; la fricción en el plano tangente sí: a lo largo de la banda (t = y×n: frena lo que corre y cambia el
// efecto lateral) y en la dirección inclinada de la nariz (solo giro: se come parte del efecto arriba/abajo)
function bc(b,nx,nz){const vn=b.vx*nx+b.vz*nz;if(vn>=-VA)return 0;
 const e=Math.max(A.ecmin,A.ec0+A.ec1*vn),jh=-(1+e)*vn,k=2.5/(R*R),tx=nz,tz=-nx;
 b.vx+=jh*nx;b.vz+=jh*nz;
 const ct=b.vx*tx+b.vz*tz-rh*b.wy-hh*(b.wx*nx+b.wz*nz),ck=R*(b.wx*tx+b.wz*tz),F=A.muc*jh*R/rh;   // F: tope de Coulomb
 let ft=-ct/3.5,fk=-ck/2.5;
 if(ft*ft+fk*fk>F*F){const s=Math.sqrt(ct*ct+ck*ck),a=-F*ct/s,c=-F*ck/s;if(Math.abs(a)<Math.abs(ft))ft=a;if(Math.abs(c)<Math.abs(fk))fk=c}
 b.vx+=ft*tx;b.vz+=ft*tz;b.wx+=k*(fk*R*tx-ft*hh*nx);b.wy-=k*ft*rh;b.wz+=k*(fk*R*tz-ft*hh*nz);
 return -vn}

// la detección y la resolución hacen exactamente la misma cuenta: si una dice que se acercan, la otra también
function acerca(p,q){let nx=q.x-p.x,nz=q.z-p.z;const d=Math.sqrt(nx*nx+nz*nz);if(d===0)return false;nx/=d;nz/=d;return (p.vx-q.vx)*nx+(p.vz-q.vz)*nz>VA}
function npunta(b,G){let nx=b.x-G.x,nz=b.z-G.z;const d=Math.sqrt(nx*nx+nz*nz);if(d===0)return null;return [nx/d,nz/d]}

// ---------- el primer contacto dentro del tramo ----------
// Q: dónde acabaría cada bola al final del tramo de h s. Cada bola va por una parábola (velocidad v, aceleración a sacada de Q).
// El contacto se busca sobre la cuerda (la curva se desvía micras en un paso) y solo cuenta si en ese instante, con v + a·t, de
// verdad se acercan; si no, es un roce. Tipos: 1 bola-bola, 2 segmento, 3 punta, 4 hoyo. ign: contactos que en este paso ya se
// resolvieron sin cambiar nada (red de seguridad: nunca se repite el mismo en vano).
const DX=new Float64Array(16),DZ=new Float64Array(16),AX=new Float64Array(16),AZ=new Float64Array(16);
let eS,eK,eI,eJ;
function primero(B,Q,h,ign){eS=1;eK=0;const h2=2/(h*h);
 for(let i=0;i<16;i++){const p=B[i];if(p.s>=DESL){DX[i]=Q[i].x-p.x;DZ[i]=Q[i].z-p.z;AX[i]=(DX[i]-p.vx*h)*h2;AZ[i]=(DZ[i]-p.vz*h)*h2}else DX[i]=DZ[i]=AX[i]=AZ[i]=0}
 for(let i=0;i<16;i++){const p=B[i];if(p.s<0)continue;const mi=p.s>=DESL,dxi=DX[i],dzi=DZ[i];
  for(let j=i+1;j<16;j++){const q=B[j];if(q.s<0||!mi&&q.s<DESL)continue;
   const ex=DX[j]-dxi,ez=DZ[j]-dzi,dx=q.x-p.x,dz=q.z-p.z,lim=D2+Math.abs(ex)+Math.abs(ez);
   if(dx>lim||dx<-lim||dz>lim||dz<-lim||ign.length&&ign.indexOf((16+i)*64+j)>=0)continue;
   const c=dx*dx+dz*dz-D2*D2;
   if(c<=TC){if(acerca(p,q)){eS=0;eK=1;eI=i;eJ=j;return}continue}   // ya se tocan: ¿se siguen acercando?
   const b=dx*ex+dz*ez;if(b>=0)continue;const di=b*b-(ex*ex+ez*ez)*c;if(di<0)continue;
   const s=c/(-b+Math.sqrt(di));if(s>=eS)continue;
   const th=s*h,wx=q.vx-p.vx+(AX[j]-AX[i])*th,wz=q.vz-p.vz+(AZ[j]-AZ[i])*th;if(wx*(dx+ex*s)+wz*(dz+ez*s)>=0)continue;
   eS=s;eK=1;eI=i;eJ=j}
  if(!mi)continue;
  const qx=p.x+dxi,qz=p.z+dzi,x0=Math.min(p.x,qx),x1=Math.max(p.x,qx),z0=Math.min(p.z,qz),z1=Math.max(p.z,qz);
  if(x0>-XI&&x1<XI&&z0>-ZI&&z1<ZI)continue;
  for(let g=0;g<SEG.length;g++){const G=SEG[g];if(x1<G.x0||x0>G.x1||z1<G.z0||z0>G.z1||ign.length&&ign.indexOf((32+i)*64+g)>=0)continue;
   const px=p.x-G.ax,pz=p.z-G.az;let d=px*G.nx+pz*G.nz,sg=1;if(d<0){d=-d;sg=-1}
   const nx=G.nx*sg,nz=G.nz*sg;
   if(d<=R+TL){const pr=px*G.ux+pz*G.uz;if(pr>=0&&pr<=G.l&&p.vx*nx+p.vz*nz<-VA){eS=0;eK=2;eI=i;eJ=g;return}continue}
   const dn=dxi*nx+dzi*nz;if(dn>=0)continue;const s=(d-R)/-dn;if(s>=eS)continue;
   const pr=(px+dxi*s)*G.ux+(pz+dzi*s)*G.uz,th=s*h;if(pr<0||pr>G.l||(p.vx+AX[i]*th)*nx+(p.vz+AZ[i]*th)*nz>=0)continue;
   eS=s;eK=2;eI=i;eJ=g}
  for(let g=0;g<PTS.length;g++){const G=PTS[g];if(G.x<x0-R||G.x>x1+R||G.z<z0-R||G.z>z1+R||ign.length&&ign.indexOf((48+i)*64+g)>=0)continue;
   const dx=G.x-p.x,dz=G.z-p.z,c=dx*dx+dz*dz-R*R;
   if(c<=TP){const n=npunta(p,G);if(n&&p.vx*n[0]+p.vz*n[1]<-VA){eS=0;eK=3;eI=i;eJ=g;return}continue}
   const b=-(dx*dxi+dz*dzi);if(b>=0)continue;const di=b*b-(dxi*dxi+dzi*dzi)*c;if(di<0)continue;
   const s=c/(-b+Math.sqrt(di));if(s>=eS)continue;
   const th=s*h;if((p.vx+AX[i]*th)*(dxi*s-dx)+(p.vz+AZ[i]*th)*(dzi*s-dz)>=0)continue;
   eS=s;eK=3;eI=i;eJ=g}
  for(let g=0;g<6;g++){const G=P[g],dx=p.x-G.x,dz=p.z-G.z,c=dx*dx+dz*dz-G.r*G.r;
   if(c<=0){eS=0;eK=4;eI=i;eJ=g;return}
   const b=dx*dxi+dz*dzi;if(b>=0)continue;const di=b*b-(dxi*dxi+dzi*dzi)*c;if(di<0)continue;
   const s=c/(-b+Math.sqrt(di));if(s<eS){eS=s;eK=4;eI=i;eJ=g}}}}

// Si dos bolas que se empujan (un racimo) quedaron encimadas por las micras que se desvía la curva dentro de un paso, se separan
// justo al contacto por la línea de centros (se mueve la que va en movimiento); sin esto el encimado se acumula paso tras paso.
function separa(p,q){let nx=q.x-p.x,nz=q.z-p.z;const d=Math.sqrt(nx*nx+nz*nz),o=D2-d;if(o<=0||d===0)return false;nx/=d;nz/=d;
 const mp=p.s>=DESL,mq=q.s>=DESL,f=mp===mq?.5:mp?1:0;p.x-=nx*o*f;p.z-=nz*o*f;q.x+=nx*o*(1-f);q.z+=nz*o*(1-f);return true}
// resuelve el contacto encontrado en el tiempo t; false si no cambió nada
function resuelve(B,ev,kf,t){const b=B[eI];
 if(eK===1){const q=B[eJ],v=bb(b,q);if(v>0){clasifica(b);clasifica(q)}const o=separa(b,q);if(!v&&!o)return false;
  kf[eI].push(foto(b,t));kf[eJ].push(foto(q,t));if(v>0)ev.push({t,k:'bola',a:eI,b:eJ,v});return true}
 if(eK===4){b.s=METIDA;b.p=eJ;kf[eI].push(foto(b,t));ev.push({t,k:'tronera',a:eI,p:eJ,v:Math.sqrt(b.vx*b.vx+b.vz*b.vz)});return true}
 let nx,nz,d;
 if(eK===2){const G=SEG[eJ],sg=(b.x-G.ax)*G.nx+(b.z-G.az)*G.nz<0?-1:1;nx=G.nx*sg;nz=G.nz*sg;d=(b.x-G.ax)*nx+(b.z-G.az)*nz}
 else{const G=PTS[eJ],n=npunta(b,G);if(!n)return false;nx=n[0];nz=n[1];d=(b.x-G.x)*nx+(b.z-G.z)*nz}
 const v=bc(b,nx,nz),o=d<R;if(v>0)clasifica(b);if(o){b.x+=nx*(R-d);b.z+=nz*(R-d)}   // igual: si se metió micras en la banda, sale
 if(!v&&!o)return false;kf[eI].push(foto(b,t));if(v>0)ev.push({t,k:'banda',a:eI,v,n:eK===2&&SEG[eJ].nariz});return true}

// ---------- el tiro ----------
// t: {a: ángulo en el plano (de +x hacia +z), v: velocidad del taco m/s, ex: efecto lateral -1..1 (+ = derecha), ey: -1..1 (+ = arriba)}
function norma(t){t=t||{};const f=(x,k)=>{x=+x;return isFinite(x)?Math.round(x*k)/k:0};
 let a=+t.a;if(!isFinite(a))a=0;a=f(a-TAU*Math.round(a/TAU),1e6);
 let v=f(t.v,1e4),ex=f(t.ex,1e3),ey=f(t.ey,1e3);v=Math.max(0,Math.min(A.vmax,v));
 const m=ex*ex+ey*ey;if(m>1){const r=Math.sqrt(m);ex=Math.trunc(ex/r*1e3)/1e3;ey=Math.trunc(ey/r*1e3)/1e3}
 return {a,v,ex,ey}}
// taco nivelado: impulso en el punto (ex,ey)·efmax·R de la cara de la bola; con desplazamiento sale más lenta
function taco(b,T){const [c,s]=sc(T.a),ox=T.ex*A.efmax,oy=T.ey*A.efmax,v=(1+A.etaco)*T.v/(1+A.mbola/A.mtaco+2.5*(ox*ox+oy*oy)),k=2.5*v/R;
 b.vx=v*c;b.vz=v*s;b.wx=k*oy*s;b.wy=k*ox;b.wz=-k*oy*c}

// simula el tiro completo desde E. Devuelve {E0, tiro, fin (E al final), ev (eventos en orden), kf (por bola, sus cambios de estado
// para dibujarla con en()), dur, n (vueltas), tope (pasos que llegaron a MAXEV; debe ser 0)}
function simula(E,tiro,op){op=op||{};cte();const B=[],Q=[],kf=[],ev=[],T=norma(tiro);
 for(let i=0;i<16;i++){const e=E[i],b=mk(e?+e[0]:0,e?+e[1]:0);if(!e)b.s=METIDA;B.push(b);Q.push(mk(0,0));kf.push([])}
 if(B[0].s===PARADA&&T.v>0){taco(B[0],T);clasifica(B[0]);ev.push({t:0,k:'taco',v:Math.sqrt(B[0].vx*B[0].vx+B[0].vz*B[0].vz)})}
 for(let i=0;i<16;i++)kf[i].push(foto(B[i],0));
 const H=A.dt,ign=[];let t=0,n=0,tope=0;
 for(;;){let mov=false;for(let i=0;i<16;i++)if(B[i].s>0){mov=true;break}
  if(!mov)break;
  if(t>=A.tmax){for(let i=0;i<16;i++){const b=B[i];if(b.s>0){b.vx=b.vz=b.wx=b.wy=b.wz=0;b.s=PARADA;kf[i].push(foto(b,t))}}break}
  let rem=H,k=0;ign.length=0;
  while(rem>0){
   for(let i=0;i<16;i++)if(B[i].s>=DESL)evol(cp(Q[i],B[i]),rem,t,null);
   primero(B,Q,rem,ign);n++;
   const h=eS<1?eS*rem:rem;
   for(let i=0;i<16;i++)if(B[i].s>0)evol(B[i],h,t,kf[i]);
   t+=h;rem=eS<1?rem-h:0;
   if(eS<1){if(!resuelve(B,ev,kf,t))ign.push((eK*16+eI)*64+eJ);if(++k>=MAXEV){tope++;for(let i=0;i<16;i++)if(B[i].s>0)evol(B[i],rem,t,kf[i]);t+=rem;rem=0}}}}
 let dur=0;kf.forEach(k=>{const x=k[k.length-1].t;if(x>dur)dur=x});
 return {E0:E.map(e=>e&&[+e[0],+e[1]]),tiro:T,fin:B.map(b=>b.s<0?null:[b.x,b.z]),ev,kf,dur,n,tope}}

// estado de la bola i a los t s del tiro (para dibujarla): {x,z,vx,vz,wx,wy,wz,s,p,t0}; o se reusa
function en(res,i,t,o){const k=res.kf[i];let lo=0,hi=k.length-1;
 while(lo<hi){const m=(lo+hi+1)>>1;if(k[m].t<=t)lo=m;else hi=m-1}
 const f=k[lo];o=cp(o||mk(0,0),f);o.t0=f.t;if(o.s>0&&t>f.t){cte();evol(o,t-f.t,f.t,null)}return o}

// ---------- acomodo ----------
// triángulo de Bola 8 con la punta en el pie: la 8 al centro, una lisa y una rayada en las esquinas de atrás, lo demás al azar;
// bien apretado (hueco 0: los contactos se resuelven juntos y el golpe se reparte por todo el triángulo; con hueco, cada bola
// tiembla menos que el hueco y nunca se enciman). La blanca en la cabeza. rnd: función 0..1 (el servidor)
function rack(rnd){rnd=rnd||Math.random;const g=A.hueco,d=2*R+g,h=d*Math.sqrt(3)/2,E=new Array(16).fill(null);
 const mez=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1)),x=a[i];a[i]=a[j];a[j]=x}return a};
 const li=mez([1,2,3,4,5,6,7]),ra=mez([9,10,11,12,13,14,15]),esq=rnd()<.5?[li.pop(),ra.pop()]:[ra.pop(),li.pop()],resto=mez(li.concat(ra));
 let k=0;for(let i=0;i<5;i++)for(let j=0;j<=i;j++,k++){const nb=k===4?8:k===10?esq[0]:k===14?esq[1]:resto.pop(),r=g*.4*Math.sqrt(rnd()),[c,s]=sc(rnd()*TAU);
  E[nb]=[L/4+i*h+r*c,(j-i/2)*d+r*s]}
 E[0]=[-L/4,0];return E}
// ¿cabe la blanca en (x,z)? coc: solo detrás de la línea de cabeza
function libre(E,x,z,coc){if(!(Math.abs(x)<=L/2-R&&Math.abs(z)<=AN/2-R))return false;if(coc&&x>-L/4)return false;
 for(let i=1;i<16;i++){const e=E[i];if(!e)continue;const dx=e[0]-x,dz=e[1]-z;if(dx*dx+dz*dz<4*R*R)return false}return true}

const BFIS={M,A,sc,azar,norma,simula,en,rack,libre,EST:{PARADA,GIRO,DESL,ROD,METIDA},_:{bb,bc,clasifica,evol,cte,mk,taco}};
if(typeof module!='undefined'&&module.exports)module.exports=BFIS;else window.BFIS=BFIS;
})();
