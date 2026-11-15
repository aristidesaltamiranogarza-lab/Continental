// c_billar_pj.js — BPJ: los bots del Billar como personajes (AV) junto a la mesa. Cada uno sale con un diseño al azar (fijo por su nombre, igual en
// todos los clientes) y camina por el contorno de la mesa (nunca la atraviesa): en su tiro va al lado de la blanca y la mira; fuera de él vuelve
// a su lugar y a ratos baila; al ganar festeja. BIJ.paso llama BPJ.paso(V,M0,blanca,yo) cada cuadro (yo = el personaje propio, de él toma
// escala y escena); BPJ.limpia() fuera de la partida. Ajustes en BPJ.A.
(function(){
if(typeof THREE==='undefined')return;
const A={sep:.75,vel:1.5,baile:[12000,30000],bailes:['Twerk','Capoeira','Macarena','House','HipHop','Footwork','Freezes','Clasico']};
const PJ=new Map(),v3=(x,y,z)=>new THREE.Vector3(x,y,z),W=v3(0,0,0),Q=v3(0,0,0);let pide=false,tP=0;
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function codigo(n){let h=hash(n)||1;const r0=Math.random;   // AV.azar con un azar sembrado por el nombre
 Math.random=()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return (h>>>0)/4294967296};try{return AV.azar()}finally{Math.random=r0}}
// contorno: rectángulo alrededor de la mesa (coordenadas de M.G), recorrido por s ∈ [0, per)
function rect(D){const o=(.18+A.sep)*D.K,hx=D.L/2+o,hz=D.A/2+o;return {hx,hz,per:4*(hx+hz)}}
function punto(r,s){const {hx,hz,per}=r;s=((s%per)+per)%per;
 if(s<2*hx)return [-hx+s,-hz];s-=2*hx;if(s<2*hz)return [hx,-hz+s];s-=2*hz;if(s<2*hx)return [hx-s,hz];s-=2*hx;return [-hx,hz-s]}
function proyecta(r,x,z){const {hx,hz}=r,c=[[Math.min(hx,Math.max(-hx,x))+hx,Math.abs(z+hz)],[2*hx+Math.min(hz,Math.max(-hz,z))+hz,Math.abs(x-hx)],
  [2*hx+2*hz+hx-Math.min(hx,Math.max(-hx,x)),Math.abs(z-hz)],[4*hx+2*hz+hz-Math.min(hz,Math.max(-hz,z)),Math.abs(x+hx)]];
 return c.reduce((a,b)=>b[1]<a[1]?b:a)[0]}
function quita(id){const b=PJ.get(id);if(!b)return;if(window.AV)AV.quita(b.p);if(b.p.parent)b.p.parent.remove(b.p);PJ.delete(id)}
function limpia(){[...PJ.keys()].forEach(quita)}
function paso(V,M0,bl,yo){const now=performance.now(),dt=Math.min(.1,(now-(tP||now))/1000);tP=now;
 if(!V||!M0||!window.AV||!yo||!yo.parent){limpia();return}
 if(!AV.ya()){if(!pide){pide=true;AV.listo().catch(()=>{})}return}
 const bots=[];(V.eq||[]).forEach((eq,e)=>(eq||[]).forEach((p,j)=>{if(p&&p.bot)bots.push({p,e,j})}));
 const ids=new Set(bots.map(b=>b.p.id));[...PJ.keys()].forEach(id=>{if(!ids.has(id))quita(id)});if(!bots.length)return;
 const D=M0.D,r=rect(D),G=M0.G;G.updateMatrixWorld();const gy=G.getWorldPosition(W).y;
 bots.forEach((x,k)=>{let b=PJ.get(x.p.id);
  if(!b){const p=AV.crearYa(codigo(x.p.n||x.p.id));if(!p)return;p.scale.copy(yo.scale);yo.parent.add(p);
   const home=r.per*(.08+.25*((k*2+x.e)%4));b={p,s:home,home,w:0,ph:0,yaw:0,baile:null,hasta:0,prox:now+A.baile[0]*(.3+Math.random())};PJ.set(x.p.id,b);
   const [hx,hz]=punto(r,b.s);W.set(hx,0,hz);G.localToWorld(W);p.position.set(W.x,gy,W.z)}
  const turno=V.fase==='juego'&&V.turno===x.e&&V.ti&&V.ti[x.e]===x.j,gana=V.fase==='fin'&&V.gana===x.e;
  const c=bl?[bl[0]*D.K,bl[1]*D.K]:[0,0],meta=turno&&bl?proyecta(r,c[0],c[1]):b.home;
  let ds=meta-b.s;ds-=Math.round(ds/r.per)*r.per;const pasoL=Math.sign(ds)*Math.min(Math.abs(ds),A.vel*D.K*dt);b.s+=pasoL;
  const [lx,lz]=punto(r,b.s);W.set(lx,0,lz);G.localToWorld(W);const mv=Math.hypot(W.x-b.p.position.x,W.z-b.p.position.z),anda=Math.abs(ds)>.02;
  b.w+=((anda?1:0)-b.w)*.15;b.ph+=mv*3.1;
  if(anda){const [ax,az]=punto(r,b.s+Math.sign(ds)*.2);Q.set(ax,0,az)}else if(turno&&bl)Q.set(c[0],0,c[1]);else Q.set(lx*.2,0,lz*.2);
  G.localToWorld(Q);const ty=Math.atan2(Q.x-W.x,Q.z-W.z);b.yaw+=Math.atan2(Math.sin(ty-b.yaw),Math.cos(ty-b.yaw))*Math.min(1,dt*8);b.p.rotation.y=b.yaw;
  b.p.position.set(W.x,gy-Math.abs(Math.sin(b.ph))*.1*b.w,W.z);
  // bailes: al ganar sin parar; quieto y fuera de su tiro, de vez en cuando
  const quieto=!anda&&!turno;if(b.baile&&(anda||turno||(!gana&&now>b.hasta))){AV.emote(b.p,null);b.baile=null;b.prox=now+A.baile[0]+Math.random()*(A.baile[1]-A.baile[0])}
  if(!b.baile&&quieto&&(gana||now>b.prox)){const cl=A.bailes[Math.random()*A.bailes.length|0];if(AV.emote(b.p,cl)){b.baile=cl;b.hasta=now+(AV.dur(cl)||6)*1000}else b.prox=now+A.baile[1]}
  AV.mueve(b.p,{w:b.w,ph:b.ph,sal:0,dn:0,bt:0,t:now})})}
window.BPJ={A,paso,limpia};
})();
