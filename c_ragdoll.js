// c_ragdoll.js — RAG: ragdoll híbrido sin librerías para los personajes AV (c_avatar.js). Solo visual: cada cliente lo simula.
// RAG.crea(av,o): desde la pose que tenga ahora, verlet con 10 puntos (base de la columna fija en la silla, cuello, cabeza, pecho,
// hombros, codos y manos), varillas, límites de cuello y codo (distancia mínima) y choque con la mesa y el piso; cada cuadro
// orienta columna, cabeza, brazos y antebrazos hacia sus puntos (AV.post). o: mesa {y, r, c (Vector3 centro)}, piso (y),
// imp (Vector3: velocidad inicial de la cabeza), rh (radio de la cabeza), ya (true: ya estaba muerto, se acomoda sin animar),
// cae {L: 1 a su izquierda / -1 a su derecha, s: medio ancho}: el cuerpo entero se voltea de la silla al piso de ese lado.
// RAG.quita(av).
(function(){
if(typeof THREE==='undefined')return;
const V=THREE.Vector3,Q=THREE.Quaternion,G=-7.5,DT=1/60,IT=6;
const qa=new Q(),qb=new Q(),va=new V(),vb=new V(),vc=new V(),m4=new THREE.Matrix4();
// puntos: 0 base (fija), 1 cuello, 2 cabeza, 3 pecho, 4/5 hombro I/D, 6/7 codo I/D, 8/9 mano I/D
const RAD=[.1,.12,.45,.2,.12,.12,.08,.08,.07,.07],IM=[0,1,.35,.6,1,1,1,1,1,1];
const VAR=[[0,1],[1,2],[1,3],[0,3],[1,4],[1,5],[4,5],[0,4],[0,5],[3,4],[3,5],[4,6],[6,8],[5,7],[7,9]];
function marcoT(P){const y=va.subVectors(P[1],P[0]).normalize(),x=vb.subVectors(P[4],P[5]);x.addScaledVector(y,-x.dot(y)).normalize();const z=vc.crossVectors(x,y);
 return new Q().setFromRotationMatrix(m4.makeBasis(x,y,z))}
function crea(av,o){if(!av||!window.AV)return null;o=o||{};const b={};
 for(const n of ['cadera','columna','cabeza','brazo_I','brazo_D','antebrazo_I','antebrazo_D','mano_I','mano_D'])b[n]=av.getObjectByName(n);
 if(Object.values(b).some(x=>!x))return null;av.updateMatrixWorld(true);
 const wp=n=>b[n].getWorldPosition(new V()),wq=n=>b[n].getWorldQuaternion(new Q());
 const cue=wp('cabeza'),up=new V(0,1,0).applyQuaternion(wq('cabeza')),base=wp('columna');
 const qv=av.getWorldQuaternion(new Q()),fw=new V(0,0,1).applyQuaternion(qv),ax={s:new V(1,0,0).applyQuaternion(qv),u:new V(0,1,0).applyQuaternion(qv),f:fw};
 const P=[base,cue,cue.clone().addScaledVector(up,.5),base.clone().lerp(cue,.55).addScaledVector(fw,.15),wp('brazo_I'),wp('brazo_D'),wp('antebrazo_I'),wp('antebrazo_D'),wp('mano_I'),wp('mano_D')];
 const rad=RAD.slice();if(o.rh)rad[2]=o.rh;
 const L=VAR.map(([i,j])=>P[i].distanceTo(P[j]));
 // límites: cuello hasta ~65°, codo hasta ~150° (distancia mínima entre los extremos)
 const minD=(i,j,k,ang)=>{const a=P[i].distanceTo(P[j]),c=P[j].distanceTo(P[k]);return Math.sqrt(a*a+c*c+2*a*c*Math.cos(ang))};
 const MIN=[[0,2,minD(0,1,2,1.13)],[4,8,minD(4,6,8,2.6)],[5,9,minD(5,7,9,2.6)]];
 const S={av,o,ax,P,O:P.map(p=>p.clone()),rad,L,MIN,b,acc:0,t:0,dorm:false,
  T0:marcoT(P),Qc:wq('cadera'),
  Q0:{columna:wq('columna'),cabeza:wq('cabeza'),hombro_I:b.brazo_I.parent.getWorldQuaternion(new Q()),hombro_D:b.brazo_D.parent.getWorldQuaternion(new Q()),
   brazo_I:wq('brazo_I'),brazo_D:wq('brazo_D'),antebrazo_I:wq('antebrazo_I'),antebrazo_D:wq('antebrazo_D')},
  v0:{cabeza:va.subVectors(P[2],P[1]).clone(),brazo_I:P[6].clone().sub(P[4]),brazo_D:P[7].clone().sub(P[5]),antebrazo_I:P[8].clone().sub(P[6]),antebrazo_D:P[9].clone().sub(P[7])}};
 if(o.cae){const q0=av.quaternion.clone(),L=o.cae.L<0?-1:1,s=o.cae.s||.3;
  S.cae={L,q0,p0:av.position.clone(),ax:new V(0,0,1).applyQuaternion(q0),pv:av.position.clone().add(new V(L*s,0,0).applyQuaternion(q0)).setY(0)}}
 if(o.imp){const d=o.imp.clone().multiplyScalar(DT);for(const [i,k] of [[2,1],[1,.6],[3,.35]])S.O[i].addScaledVector(d,-k)}
 if(o.ya){for(let i=0;i<300;i++)paso(S);S.dorm=true}
 AV.post(av,dt=>{if(!S.dorm){S.acc=Math.min(S.acc+dt,.1);while(S.acc>=DT){S.acc-=DT;paso(S)}}pon(S)});
 av.userData.rag=S;todos.add(S);return S}
function paso(S){const {P,O,o}=S,m=o.mesa,piso=o.piso||0;S.t+=DT;if(S.cae)raiz(S);
 for(let i=1;i<P.length;i++){const p=P[i],q=O[i];va.subVectors(p,q).multiplyScalar(.985);q.copy(p);p.add(va);p.y+=G*DT*DT}
 for(let it=0;it<IT;it++){
  VAR.forEach(([i,j],k)=>junta(P,i,j,S.L[k],false));
  for(const [i,j,d] of S.MIN)junta(P,i,j,d,true);
  tronco(S);
  for(let i=1;i<P.length;i++){const p=P[i],r=S.rad[i];
   if(m){const dx=p.x-m.c.x,dz=p.z-m.c.z,h=Math.hypot(dx,dz),k=h>m.r?m.r/h:1;   // punto más cercano del tablero (disco de 6 cm, con orilla)
    choca(p,O[i],r,vb.set(m.c.x+dx*k,Math.max(m.y-.06,Math.min(m.y,p.y)),m.c.z+dz*k),.5)}
   if(p.y<piso+r)choca(p,O[i],r,vb.set(p.x,piso,p.z),.4)}}
 if(S.t>5){let mx=0;for(let i=1;i<P.length;i++)mx=Math.max(mx,P[i].distanceTo(O[i]));if(mx<1e-4)S.dorm=true}}
// voltea la raíz alrededor de un eje en el piso, a un lado de la silla (cae de golpe y rebota un poco); la base de la columna la sigue
function raiz(S){const c=S.cae,t=S.t,T=.5,a=S.av,P2=Math.PI/2;
 const th=t<T?P2*(t/T)*(t/T):P2-.12*Math.abs(Math.sin((t-T)*13))*Math.exp(-(t-T)*5),q=qa.setFromAxisAngle(c.ax,-c.L*th);
 a.position.copy(c.p0).sub(c.pv).applyQuaternion(q).add(c.pv);a.quaternion.copy(q).multiply(c.q0);a.updateMatrixWorld(true);
 S.b.columna.getWorldPosition(S.P[0]);S.O[0].copy(S.P[0]);const w=a.getWorldQuaternion(qb);
 S.ax.s.set(1,0,0).applyQuaternion(w);S.ax.u.set(0,1,0).applyQuaternion(w);S.ax.f.set(0,0,1).applyQuaternion(w)}
// cadera: el tronco se dobla al frente hasta ~110° y hacia atrás 20°; de lado, 30° (no se cae de la silla)
function tronco(S){const P=S.P,a=S.ax,d=va.subVectors(P[1],P[0]),L=S.L[0],s=d.dot(a.s),u=d.dot(a.u),f=d.dot(a.f);
 const fi0=Math.atan2(f,u),ps0=Math.atan2(s,Math.hypot(u,f)),fi=Math.max(-.35,Math.min(1.9,fi0)),ps=Math.max(-.5,Math.min(.5,ps0));if(fi===fi0&&ps===ps0)return;
 const c=Math.cos(ps);P[1].copy(P[0]).addScaledVector(a.s,Math.sin(ps)*L).addScaledVector(a.u,Math.cos(fi)*c*L).addScaledVector(a.f,Math.sin(fi)*c*L)}
// p choca con el punto c (radio r): sale por la normal, pierde la velocidad hacia adentro y frena lo tangencial (fr)
function choca(p,q,r,c,fr){const n=vc.subVectors(p,c);let d=n.length();if(d>=r)return;if(d<1e-5){n.set(0,1,0);d=0}else n.divideScalar(d);
 const e=r-d;p.addScaledVector(n,e);q.addScaledVector(n,e);const v=va.subVectors(p,q),vn=v.dot(n);if(vn<0)v.addScaledVector(n,-vn);
 const t=v.clone().addScaledVector(n,-v.dot(n));v.addScaledVector(t,-fr);q.subVectors(p,v)}
function junta(P,i,j,L,min){const a=P[i],b=P[j],d=va.subVectors(b,a),l=d.length();if(l<1e-6||(min&&l>=L))return;
 const wi=IM[i],wj=IM[j],w=wi+wj;if(!w)return;d.multiplyScalar((l-L)/l/w);a.addScaledVector(d,wi);b.addScaledVector(d,-wj)}
// huesos: el tronco gira con el marco base-cuello-hombros; cabeza, brazos y antebrazos se orientan hacia su punto (sin giro propio)
function local(bone,parentW,w){bone.quaternion.copy(qb.copy(parentW).invert().multiply(w))}
function swing(D,v0,v1){return qa.setFromUnitVectors(vb.copy(v0).applyQuaternion(D).normalize(),vc.copy(v1).normalize()).clone()}
function pon(S){const {P,b,Q0,v0}=S,D=marcoT(P).multiply(S.T0.clone().invert());
 const wCol=D.clone().multiply(Q0.columna);local(b.columna,S.cae?b.columna.parent.getWorldQuaternion(new Q()):S.Qc,wCol);
 const wCab=swing(D,v0.cabeza,va.subVectors(P[2],P[1])).multiply(D).multiply(Q0.cabeza);local(b.cabeza,wCol,wCab);
 for(const [l,h,c,m] of [['I',4,6,8],['D',5,7,9]]){const wH=D.clone().multiply(Q0['hombro_'+l]);
  const sb=swing(D,v0['brazo_'+l],new V().subVectors(P[c],P[h])),wB=sb.clone().multiply(D).multiply(Q0['brazo_'+l]);local(b['brazo_'+l],wH,wB);
  const R=sb.multiply(D),sa=swing(R,v0['antebrazo_'+l],new V().subVectors(P[m],P[c])),wA=sa.multiply(R).multiply(Q0['antebrazo_'+l]);local(b['antebrazo_'+l],wB,wA)}}
function quita(av){if(!av||!av.userData.rag)return;todos.delete(av.userData.rag);av.userData.rag=null;if(window.AV)AV.post(av,null)}
const todos=new Set();   // los que están cayendo o caídos (para revisar en consola)
window.RAG={crea,quita,todos};
})();
