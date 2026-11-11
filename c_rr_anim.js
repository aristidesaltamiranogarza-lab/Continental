// c_rr_anim.js — RRA: la coreografía del turno en la Ruleta (c_ruleta3d.js). Poses de blender/poses_ruleta.py mezcladas con
// AV.mezcla (tomar el arma, cargar, girar el tambor, apuntar con ApuntaI/C/D según el ángulo, a la sien, alivio, aventarla) y
// gestos encima; el revólver en la mano, en la mesa o volando y deslizándose girando hasta el siguiente; su mecánica (tambor,
// martillo con el pulgar, gatillo, puerta, varilla, bala y casquillo) y tu mano en primera persona.
// RRA.reset(c) al armar la mesa · RRA.fx(f,c) con cada efecto del servidor (spin/click/bang) · RRA.paso(c) cada cuadro.
// c: {P, s (etapa), G, me, now, dt, gunW, gunV, CA, SC, TH, TBR, yaw(p,punto)}
(function(){
if(typeof THREE==='undefined')return;
const V=THREE.Vector3,Qt=THREE.Quaternion,A=Math.PI/3,FR=2.6,GR=9.8,CV=.75;   // CV: la carga dura 3 s × CV   // A: ángulo de ApuntaI/ApuntaD; FR: frenado al deslizarse
const cl=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>x<0?0:x>1?1:x*x*(3-2*x),ent=(t,a,b)=>ease((t-a)/(b-a)),rnd=(a,b)=>a+Math.random()*(b-a);
const tv=new V(),tv2=new V(),ts=new V(),eu=new THREE.Euler(),M=new THREE.Matrix4();
// ar: el arma (modo 'mesa' | 'mano' | 'vuela'; k quien la tiene; pos/q en el mundo cuando no está en una mano)
let ar=null,tam=0,disp=-1e9,dispB=-1e9,giro=-1e9,carga=null,cargar=true,casq=false,toma=null,tomada=-1e9,turno=-2,lanz=null,etapa=-1,eyect=false;
const casqs=[],humos=[];let texH=null;
// humo del disparo: bocanadas que salen de Rev_Boca, crecen y se desvanecen
function humo(c){const w=c.gunV.visible?c.gunV:c.gunW,mz=w.userData.mz;if(!mz)return;mz.updateWorldMatrix(true,false);
 if(!texH){const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d'),gr=g.createRadialGradient(32,32,2,32,32,32);
  gr.addColorStop(0,'rgba(220,215,205,.9)');gr.addColorStop(1,'rgba(220,215,205,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);texH=new THREE.CanvasTexture(cv)}
 const p=mz.getWorldPosition(new V()),dir=new V(0,0,-1).transformDirection(mz.matrixWorld);
 for(let i=0;i<7;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:texH,transparent:true,depthWrite:false,opacity:.55}));
  m.position.copy(p).addScaledVector(dir,.03+i*.025);c.SC.add(m);humos.push({m,v:dir.clone().multiplyScalar(rnd(.3,.9)).add(new V(rnd(-.08,.08),rnd(.15,.35),rnd(-.08,.08))),t:c.now,d:rnd(1400,2200)})}}
const spot=(c,k)=>{const o=c.P[k].out;return new V(o.x*(c.TBR-.5),c.TH+.04,o.z*(c.TBR-.5))};
const qMesa=y=>new Qt().setFromEuler(eu.set(0,y,Math.PI/2));
const yawDe=q=>{tv.set(0,0,1).applyQuaternion(q);return Math.atan2(tv.x,tv.z)};
function siguiente(G,k){const n=G.players.length;for(let i=1;i<=n;i++){const j=(k+i)%n;if(!G.dead[j])return j}return -1}
function reset(c){const k=c.G&&c.G.sh>=0?c.G.sh:0,o=c.P[k]?c.P[k].out:new V(0,0,1);
 ar={modo:'mesa',k:-1,pos:c.P[k]?spot(c,k):new V(0,c.TH+.04,0),q:qMesa(Math.atan2(o.x,o.z)+1.9),vel:new V(),wy:0};ar.yaw=yawDe(ar.q);
 tam=0;disp=dispB=giro=-1e9;carga=null;cargar=true;casq=false;toma=null;turno=-2;lanz=null;etapa=-1;
 casqs.splice(0).concat(humos.splice(0)).forEach(x=>x.m.parent&&x.m.parent.remove(x.m))}
// dónde está el arma de la mano ahora (tu vista o el Rig_Agarre de quien la tiene); la deja suelta en gunW
function deMano(c){const W=c.gunW;if(c.gunV.visible){c.gunV.updateWorldMatrix(true,false);c.gunV.matrixWorld.decompose(W.position,W.quaternion,ts)}
 else RRPJ.suelta(W);W.scale.set(1,1,1);return {pos:W.position.clone(),q:W.quaternion.clone()}}
function vuela(c,pos,q,vel,wy){ar={modo:'vuela',k:-1,pos,q:q.clone(),qi:q.clone(),ti:c.now,vel,wy,yaw:yawDe(q)}}
// aventarla: cae a la mesa y se desliza hasta quedar frente a k (frenado FR; cuenta el tiempo en el aire)
function lanza(c,pos,q,k,vy){const d=tv2.subVectors(spot(c,k),pos).setY(0),D=d.length(),y0=Math.max(0,pos.y-c.TH-.04);
 const t=(vy+Math.sqrt(vy*vy+2*GR*y0))/GR,v=-FR*t+Math.sqrt(FR*FR*t*t+2*FR*D);
 vuela(c,pos,q,d.clone().normalize().multiplyScalar(Math.max(0,v)).setY(vy),(Math.random()<.5?-1:1)*rnd(5,9))}
function agarra(c,k){ar.modo='mano';ar.k=k;tomada=c.now;toma=null}
function fx(f,c){const now=c.now;
 if(f.t=='spin'&&f.k>=0)giro=now;
 if(f.t=='click'||f.t=='bang'){disp=now;tam+=A}
 if(f.t=='bang'){dispB=now;casq=true;cargar=true;humo(c);
  if(f.to===f.k&&ar&&ar.modo==='mano'&&ar.k===f.k){const m=deMano(c);vuela(c,m.pos,m.q,new V(rnd(-.4,.4),.8,rnd(-.4,.4)),rnd(-6,6))}}}   // se le cae
// ---------- física del arma suelta y de los casquillos ----------
function fisica(c,dt){
 if(ar.modo==='vuela'){const p=ar.pos,v=ar.vel,h=Math.hypot(p.x,p.z),piso=h<c.TBR?c.TH+.04:.04;
  if(p.y>piso+1e-3||v.y>0){v.y-=GR*dt;p.addScaledVector(v,dt);if(p.y<=piso){p.y=piso;v.y=v.y<-2?-v.y*.2:0}}
  else{p.y=piso;const s=Math.hypot(v.x,v.z),ns=Math.max(0,s-FR*dt);if(s>0)v.x*=ns/s,v.z*=ns/s;p.x+=v.x*dt;p.z+=v.z*dt;
   if(Math.hypot(p.x,p.z)>c.TBR&&piso>1)v.y=-.01;   // se sale por la orilla: cae al piso
   if(ns<.03&&Math.abs(v.y)<1e-3){ar.modo='mesa';ar.vel.set(0,0,0)}}
  ar.yaw+=ar.wy*dt;ar.wy*=Math.exp(-2.2*dt);ar.q.copy(ar.qi).slerp(qMesa(ar.yaw),ent(c.now-ar.ti,0,380))}
 for(let i=humos.length-1;i>=0;i--){const h=humos[i],x=(c.now-h.t)/h.d;h.m.position.addScaledVector(h.v,dt);h.v.multiplyScalar(Math.exp(-1.5*dt));
  h.m.scale.setScalar(.08+.55*x);h.m.material.opacity=.55*(1-x);if(x>=1){h.m.parent&&h.m.parent.remove(h.m);h.m.material.dispose();humos.splice(i,1)}}
 for(let i=casqs.length-1;i>=0;i--){const x=casqs[i],p=x.m.position,v=x.v,h=Math.hypot(p.x,p.z),piso=h<c.TBR?c.TH+.008:.008;
  v.y-=GR*dt;p.addScaledVector(v,dt);x.m.rotation.x+=x.w*dt;x.m.rotation.z+=x.w*.7*dt;
  if(p.y<piso){p.y=piso;v.y=Math.abs(v.y)>.6?-v.y*.35:0;v.x*=.7;v.z*=.7;x.w*=.6}
  if(c.now-x.t>6000){x.m.parent&&x.m.parent.remove(x.m);casqs.splice(i,1)}}}
function eyecta(c,w){const d=w.userData;if(!d.casq||!d.inner)return;d.inner.updateMatrixWorld(true);
 const m=d.casq.clone();m.visible=true;m.position.copy(d.rec0);d.casq.parent.localToWorld(m.position);
 d.casq.parent.getWorldQuaternion(m.quaternion);const dir=tv.set(0,0,1).transformDirection(d.casq.parent.matrixWorld);
 c.SC.add(m);casqs.push({m,v:dir.multiplyScalar(1.3).add(new V(rnd(-.3,.3),1.2,rnd(-.3,.3))),w:rnd(10,20),t:c.now})}
// ---------- piezas del revólver ----------
function piezas(w,e,c){const d=w.userData;if(!d.inner)return;d.drum.rotation.z=e.tam;d.hammer.rotation.x=.7*e.cock;
 if(d.trig)d.trig.rotation.x=-.32*e.gat;if(d.gate)d.gate.rotation.z=1.45*e.pu;if(d.rod)d.rod.position.z=d.rod0+.045*e.va;
 if(d.bala){d.bala.visible=e.bala>=0&&w.visible;if(d.bala.visible){const pa=d.bala.parent;pa.updateMatrixWorld(true);
  const de=pa.worldToLocal(tv.copy(e.balaDe)),en=tv2.copy(d.rec0);en.z+=.06;
  if(e.bala<.7)d.bala.position.copy(de).lerp(en,e.bala/.7);else d.bala.position.copy(en).lerp(d.rec0,(e.bala-.7)/.3)}}}
// ---------- poses ----------
function pon(a,pz,fd){const ks=Object.keys(pz);if(ks.length===1)AV.pose(a,ks[0],fd);else AV.mezcla(a,pz,fd)}
function apunta(c,p,to,g){const y=cl(c.yaw(p,to),-1.5,1.5),yy=cl(y,-A,A);g.gy=(y-yy)*.8;g.cy=0;
 return {ApuntaI:Math.max(0,yy/A),ApuntaC:Math.max(.001,1-Math.abs(yy)/A),ApuntaD:Math.max(0,-yy/A)}}
function paso(c){const {P,s,G,me,now}=c;if(!s||!G||!ar)return;const dt=Math.min(.05,c.dt||.016);
 const sh=G.phase=='play'?s.sh:-1,el=now-s.t0,dur=Math.max(1,s.t1-s.t0),res=s.st=='res'?s.res:null;
 const vivo=k=>!!P[k]&&!P[k].dead,yo=k=>k===me;
 if(s.tc!==etapa){etapa=s.tc;lanz=null}
 if(sh!==turno){turno=sh;toma=null}
 if(s.st=='fire'||s.st=='nerv'){if(carga){carga=null;cargar=false;casq=false}}
 // el arma tiene que estar en su mano: alguien decidió antes de tomarla, o llegaste a media partida
 const enSuMano=()=>ar.modo==='mano'&&ar.k===sh;
 if(sh>=0&&vivo(sh)&&!enSuMano()&&!lanz&&(s.st=='fire'||s.st=='nerv'||(res&&!(res.r=='bang'&&res.v===sh)&&ar.modo!=='vuela'))){agarra(c,sh);cargar=false;casq=false}
 // empieza el turno: el arma se desliza hasta quien tira (si quedó lejos) y la toma
 if(sh>=0&&vivo(sh)&&(s.st=='spin'||s.st=='aim')&&!enSuMano()){
  if(ar.modo==='mesa'){if(ar.pos.distanceTo(spot(c,sh))>.5)lanza(c,ar.pos.clone(),ar.q,sh,.4);else if(!toma)toma=now}
  if(toma&&now-toma>=450)agarra(c,sh)}
 // cargar: al empezar (antes de girar) o en el resultado de un balazo a otro
 if(enSuMano()&&cargar&&!carga&&(s.st=='spin'||s.st=='aim'||(res&&res.r=='bang'&&res.v!==sh&&el>1100))){carga={t:now,casq};eyect=false}
 if(carga&&(now-carga.t)/CV>3000){carga=null;cargar=false;casq=false}
 // aventarla al siguiente
 const vivos=G.dead.filter(x=>!x).length;
 if(enSuMano()&&!lanz&&vivos>1&&res&&((res.r=='click'&&res.v===sh&&el>=1300)||(res.r=='bang'&&res.v!==sh&&el>=4400))){
  const n=siguiente(G,sh);if(n>=0){const m=deMano(c);lanza(c,m.pos,m.q,n,1.2);lanz={t:now}}}
 fisica(c,dt);
 // ---- personajes ----
 const hp=P[sh];
 P.forEach((p,k)=>{if(!p.pv.visible||p.fall)return;if(yo(k)){p.av.visible=false;return}
  const a=p.av,mira=hp&&k!==sh?(sh===me?c.CA.position:hp.eye):null;if(mira)p.cy+=(cl(c.yaw(p,mira),-1,1)-p.cy)*.08;
  const g={cy:p.cy,cx:0};let pz,fd=.45,ag=.15,agI=.15,am=0;
  if(k!==sh){   // los demás: manos en la mesa, inquietos; alivio si les apuntaron y salió clic
   pz={[res&&res.r=='click'&&res.v===k&&el<1600?'Alivio':'ReposoNervioso']:1};g.cx+=Math.sin(now/310+p.seed)*.02;g.cy+=Math.sin(now/570+p.seed*2)*.03}
  else if(!enSuMano()){pz=toma?{TomaArma:1}:lanz&&now-lanz.t<350?{AvientaArma:1}:{ReposoNervioso:1};fd=toma?.3:.4;ag=toma?.3+.7*ent(now-toma,250,450):.15}
  else{ag=1;pz={AgarreFrente:1};
   if(carga){const lt=(now-carga.t)/CV;pz={[lt<1900?'CargaBala':'GiraTambor']:1};agI=lt<1900?.55:.1;g.cy=0;fd=.35}
   else if(s.st=='spin'||s.st=='aim'){
    if(now-giro<1300){pz={GiraTambor:1};agI=.1;g.cy=0;fd=.3}
    else{const o=P.filter((q,j)=>j!==k&&!q.dead&&q.pv.visible);if(o.length){const q=o[Math.floor(now/480+p.seed)%o.length];   // mira a los demás, rápido
     p.cy+=(cl(c.yaw(p,yo(q.k)?c.CA.position:q.eye),-1,1)-p.cy)*.15;g.cy=p.cy}}}
   else if(s.st=='fire'||(res&&res.r=='click'&&res.v!==k)||(res&&res.r=='bang'&&res.v!==k&&el<900)){
    const t=P[s.tg];if(t)pz=apunta(c,p,s.tg===me?c.CA.position:t.eye,g);fd=.35;if(s.st=='fire')am=ent(el,300,550)-ent(el,700,900)}
   else if(s.st=='nerv'){pz={PistolaSien:1};fd=.5;am=ent(el,700,950)-ent(el,1150,1350);const x=cl(el/dur,0,1),amp=.012+.06*x;
    g.cx=(Math.random()-.5)*amp*2;g.cy=-.08*x+(Math.random()-.5)*amp*2}
   else if(res&&res.r=='click'&&res.v===k){pz={[el<300?'PistolaSien':el<1000?'Alivio':'AvientaArma']:1};fd=el<1000?.45:.22}
   else if(res&&res.r=='bang'&&el>=4100){pz={AvientaArma:1};fd=.22}}
  const rt=now-dispB;if(k===sh&&rt<450)g.ret=rt<70?rt/70:1-ent(rt,70,450);   // retroceso
  pon(a,pz,fd);AV.agarre(a,'D',ag);AV.agarre(a,'I',agI);AV.amartilla(a,am);AV.gesto(a,g)});
 // ---- el revólver: en tu mano (primera persona), en la de quien tira o suelto ----
 const mio=sh===me&&vivo(me)&&enSuMano();RRPJ.ver(c.gunV,mio);RRPJ.ver(c.gunW,!mio);
 if(ar.modo==='mano'&&!yo(ar.k)&&P[ar.k])RRPJ.enMano(c.gunW,P[ar.k].agr);
 else{RRPJ.enMano(c.gunW,null);c.gunW.position.copy(ar.pos);c.gunW.quaternion.copy(ar.q)}
 // estado de las piezas
 let cock=0,gat=0,pu=0,va=0,bala=-1;
 if(s.st=='fire')cock=ent(el,450,650);else if(s.st=='nerv')cock=ent(el,900,1100);
 if((s.st=='fire'||s.st=='nerv')&&s.t1)gat=.5*ent(now,s.t1-300,s.t1);const dd=now-disp;if(dd<350)gat=1-ent(dd,150,350);
 let sp=giro;
 if(carga){const lt=(now-carga.t)/CV;pu=ent(lt,300,550)-ent(lt,1600,1850);if(carga.casq){va=ent(lt,550,750)-ent(lt,850,1050);if(lt>=700&&!eyect){eyect=true;eyecta(c,mio?c.gunV:c.gunW)}}
  if(lt>=900&&lt<1850)bala=ent(lt,900,1500);sp=Math.max(sp,carga.t+1900*CV)}
 const st=now-sp;if(st>=0&&st<1200)tam+=(1-st/1200)*36*dt;
 let balaDe=null;if(bala>=0){if(mio)balaDe=c.CA.localToWorld(new V(-.22,-.4,-.55));else{const h=P[sh].av.getObjectByName('mano_I');balaDe=h?h.getWorldPosition(new V()):c.gunW.getWorldPosition(new V())}}
 const e={tam:tam+cock*A,cock,gat,pu,va,bala,balaDe};piezas(c.gunW,e,c);piezas(c.gunV,e,c);
 if(mio)vista(c,s,el,dur,res);}
// tu mano en primera persona
function vista(c,s,el,dur,res){const V3=(x,y,z)=>new V(x,y,z),now=c.now,CA=c.CA,W=c.gunV;
 const pos=V3(.24,-.27,-.62);let at=CA.localToWorld(V3(-.06,.14,-6)),amp=.002,roll=0;
 pos.lerp(V3(.3,-.75,-.5),1-ent(now-tomada,0,450));   // sube de la mesa al tomarla
 if(carga){const lt=(now-carga.t)/CV,f=ent(lt,0,300)-ent(lt,2700,3000);pos.lerp(V3(.06,-.2,-.48),f);at.lerp(CA.localToWorld(V3(-3,-.3,-1.2)),f);roll=-1.1*f}
 else if(now-giro<1300){const f=ent(now-giro,0,200)-ent(now-giro,1000,1300);pos.lerp(V3(.1,-.22,-.5),f);roll=-.5*f}
 if(s.st=='fire'||(res&&res.v!==c.me&&el<900)||(res&&res.r=='click'&&res.v!==c.me)){const t=c.P[s.tg];if(t){pos.lerp(V3(.12,-.17,-.6),ent(el,0,600));at=t.eye.clone()}}
 else if(s.st=='nerv'||(res&&res.v===c.me)){const f=s.st=='nerv'?ent(el,0,1200):1-ent(el,300,900);pos.lerp(V3(.33,.01,-.12),f);at=CA.localToWorld(V3(.33-f*1.4,0,-.12-(1-f)*5));
  amp=s.st=='nerv'?.002+.012*cl(el/dur,0,1):.002;if(res&&el>=1000)pos.lerp(V3(.15,-.3,-.9),ent(el,1000,1300))}   // la avienta
 W.position.copy(pos).add(V3(Math.random()-.5,Math.random()-.5,0).multiplyScalar(amp));W.lookAt(at);if(roll)W.rotateZ(roll);
 const rt=now-dispB;if(rt<450)W.rotateX(-.5*(rt<70?rt/70:1-ent(rt,70,450)));RRPJ.pasoVista(W)}
window.RRA={reset,fx,paso,get estado(){return {ar,carga,cargar,casq,toma,lanz,casqs:casqs.length,humos:humos.length}}};
})();
