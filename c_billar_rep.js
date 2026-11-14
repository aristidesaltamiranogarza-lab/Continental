// c_billar_rep.js — BREP: reproduce en la mesa 3D de BIL un tiro que simuló BFIS (el mismo resultado que verán todos): posición y
// giro de cada bola (con su ω; como la mesa va ×K, el mismo ω sirve), caída a la tronera, y avisa cada evento a su tiempo
// (taco, choques, bandas, troneras) para los sonidos. BREP.pon(mesa,E) acomoda sin animar; BREP.juega(mesa,res,{al(ev),fin(res),vel});
// BREP.para(). Para probar la física en el sótano desde la consola: BREP.saque(semilla) y BREP.tiro(ángulo, v, ex, ey).
(function(){
if(typeof THREE==='undefined'||!window.BFIS)return;
const MET=BFIS.EST.METIDA,q=new THREE.Quaternion(),w=new THREE.Vector3();
let act=null,E=null;
function pon(m,E){const {K,Y,R}=m.D;m.bolas.forEach((b,i)=>{const e=E[i];b.visible=!!e;if(e)b.position.set(e[0]*K,Y+R,e[1]*K)})}
function para(){act=null}
function juega(m,res,op){act={m,res,op:op||{},ne:0,t0:0,ult:0,o:[]};pon(m,res.E0);requestAnimationFrame(paso)}
function paso(now){const a=act;if(!a)return;if(!a.t0)a.t0=now;
 const t=(now-a.t0)/1000*(a.op.vel||1),dt=t-a.ult,{K,Y,R,P}=a.m.D,ev=a.res.ev;a.ult=t;
 while(a.ne<ev.length&&ev[a.ne].t<=t){if(a.op.al)try{a.op.al(ev[a.ne])}catch(e){console.warn(e)}a.ne++}
 for(let i=0;i<16;i++){const b=a.m.bolas[i],s=a.o[i]=BFIS.en(a.res,i,t,a.o[i]);
  if(s.s===MET){   // cae: se va al centro del hoyo mientras se hunde, y desaparece abajo
   const tm=t-s.t0,H=P[s.p],k=Math.min(1,tm/.25);if(!b.visible)continue;if(tm>.6){b.visible=false;continue}
   b.position.set(s.x*K+(H.x-s.x*K)*k,Math.max(Y-.15,Y+R-4.9*K*tm*tm),s.z*K+(H.z-s.z*K)*k)}
  else b.position.set(s.x*K,Y+R,s.z*K);
  w.set(s.wx,s.wy,s.wz);const an=w.length()*dt;if(an>0){q.setFromAxisAngle(w.normalize(),an);b.quaternion.premultiply(q)}}
 if(t>a.res.dur+.7){act=null;if(a.op.fin)a.op.fin(a.res);return}
 requestAnimationFrame(paso)}

// pruebas desde la consola (la mesa del cuarto del billar)
const mesa=()=>window.SAL&&SAL.M&&SAL.M.billar;
function tiro(a,v,ex,ey){const m=mesa();if(!m)return 'sin mesa';if(!E)E=BFIS.rack(BFIS.azar(1));
 if(!E[0]){const c=BFIS.M.cabeza;E[0]=BFIS.libre(E,c[0],c[1])?[c[0],c[1]]:[c[0]-.2,0]}
 const t0=performance.now(),r=BFIS.simula(E,{a:+a||0,v:v==null?2:+v,ex:+ex||0,ey:+ey||0}),ms=performance.now()-t0;E=r.fin;juega(m,r);
 return {ms:+ms.toFixed(1),dur:+r.dur.toFixed(2),choques:r.ev.filter(e=>e.k=='bola').length,bandas:r.ev.filter(e=>e.k=='banda').length,metidas:r.ev.filter(e=>e.k=='tronera').map(e=>e.a)}}
function saque(sem){E=BFIS.rack(BFIS.azar(sem==null?(Math.random()*1e9)>>>0:sem));return tiro((Math.random()-.5)*.01,BFIS.A.vmax)}

window.BREP={pon,juega,para,tiro,saque,get E(){return E}};
})();
