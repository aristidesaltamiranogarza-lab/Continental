// Rummy 3D: la terraza en primera persona, sentado en tu silla. Escenario en c_rummyesc.js (RME) y modelos en c_rummy3dm.js (RM3M); reusa materiales de la casa (CASA3D).
// Los abuelos y el confeti en c_rummyabuelos.js (RMA). Lo maneja c_rummyui.js como window.R3, con la misma API que R2 (ok, show, layout, sync, cam, sort) y los mismos avisos a RMU (can, pick, put, rack).
// Cámara: sentado (arrastrar para voltear, doble clic al frente) o cenital (cam('vista'), con zoom y tu atril abajo: c_rummy3dvista.js, RMV); cam('atril') acerca tu atril. Cada ficha se desliza sola a su lugar.
(function(){
const OK3=typeof THREE!=='undefined'&&!!window.RME&&!!window.RM3M&&!!window.RUMMY&&!!window.RMV;
let R,SC,CA,root,cv,lay,E,K,BAG,RELOJ,ready=false,failed=false,shown=false,raf=0,tPrev=0,Wd=0,Hd=0,vo='',st=null,ins={t:0,b:0},vista='sen',big=false,camE=null,camA=null;
let drag=null,hov=null,hop=0,primed=false,lastTc=null,lastTn=null,lastTurn=-1,lastFx=-1,bagT=0,flipT=-1e9,seatKey='',seatK=[],L=null,RK=null,AV=false,dockV=0,docked=false;   // AV: hay abuelos (c_rummyabuelos.js)
const look={y:0,p:0},T=new Map(),BK=[],UL=[],tags=[],racks=[];   // T: fichas con número (id → mesh) · BK: fichas de espaldas en cada atril ajeno · UL: marcas bajo cada grupo
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),cl=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>x<0?0:x>1?1:x*x*(3-2*x),es=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const TV=OK3?v3(0,0,0):null,TV2=OK3?v3(0,0,0):null,RQ=OK3?new THREE.Quaternion():null,Q0=OK3?new THREE.Quaternion():null,ray=OK3?new THREE.Raycaster():null,P2=OK3?new THREE.Vector2():null,PL=OK3?new THREE.Plane(v3(0,1,0),-1.52):null;
window.R3={ok:()=>OK3&&!failed,
 show(on){if(on&&!ready){try{init()}catch(e){console.warn('Rummy 3D:',e);failed=true;return}}if(!ready||shown===on)return;shown=on;root.style.display=on?'block':'none';
  if(on){reset();E.start(performance.now());tPrev=0;if(!raf)raf=requestAnimationFrame(loop)}},
 layout(i){ins=i},
 sync(s){st=s;if(ready&&shown)try{apply()}catch(e){fail(e)}},
 cam(c){if(c=='vista'){vista=vista=='sen'?'cen':'sen';RMV.reset()}else big=c=='atril';look.y=look.p=0},
 sort(){hop=performance.now()}};
function fail(e){console.warn('Rummy 3D:',e);failed=true;R3.show(false);if(typeof render=='function')render()}
// al volver a entrar: sin fichas viejas; la primera vista las pone directo en su lugar
function reset(){T.forEach(m=>SC.remove(m));T.clear();BK.forEach(a=>a&&a.forEach(m=>SC.remove(m)));BK.length=0;seatKey='';primed=false;lastTc=null;lastTn=null;lastFx=-1;lastTurn=-1;camE=null;big=false;look.y=look.p=0;RMV.reset();if(AV)RMA.reset()}
// ---------- dónde se sienta cada quien: tú en la silla 0 y los demás en orden de turno ----------
const seatOf=(G,k,me)=>{const n=G.players.length,o=G.ord;return me>=0?(o.indexOf(k)-o.indexOf(me)+n)%n:o.indexOf(k)};
function buildRacks(n,mine){racks.forEach(r=>r.parent&&r.parent.remove(r));docked=false;racks.length=0;BK.forEach(a=>a&&a.forEach(m=>SC.remove(m)));BK.length=0;
 for(let c=0;c<n;c++){const r=RM3M.rack(c===0&&mine?1.5:1.2),p=K.pol(K.ang(c,n),K.AR,K.TH);r.position.copy(p);r.rotation.y=Math.atan2(p.x,p.z);SC.add(r);r.updateMatrixWorld(true);racks.push(r)}}
// ---------- acomodo: grupos en filas sobre la mesa (se encogen si no caben) y tu atril en dos filas ----------
const AREA={x0:-1.05,x1:1.05,z0:-.95,z1:.82};
function flow(gs,sc){const sp=(RM3M.TW+.008)*sc,gap=.1*sc,rs=(RM3M.TL+.07)*sc,W=AREA.x1-AREA.x0,rows=[];let row={w:0,it:[]};
 gs.forEach((n,k)=>{const w=n*sp;if(row.it.length&&row.w+gap+w>W){rows.push(row);row={w:0,it:[]}}const a=row.it.length?gap:0;row.it.push({k,w,x:row.w+a});row.w+=a+w});if(row.it.length)rows.push(row);
 return {rows,h:rows.length*rs,sp,rs}}
// en tu turno el último lugar es para combinación nueva
function layout(mesa,my){const gs=mesa.map(g=>g.length);if(my)gs.push(1);let sc=1,r=flow(gs,sc);for(let i=0;i<10&&r.h>AREA.z1-AREA.z0;i++){sc*=.9;r=flow(gs,sc)}
 const zm=(AREA.z0+AREA.z1)/2,pos=[],box=[];
 r.rows.forEach((row,ri)=>{const z=zm-r.h/2+r.rs*(ri+.5),x0=-row.w/2;row.it.forEach(it=>{const gx=x0+it.x;box[it.k]={x0:gx,x1:gx+it.w,z0:z-r.rs/2,z1:z+r.rs/2,z};pos[it.k]=[];for(let j=0;j<gs[it.k];j++)pos[it.k].push({x:gx+r.sp*(j+.5),z})})});
 return {pos,box,sc,nuevo:my}}
function rowsOf(n,rk){const per=Math.ceil(n/2)||1,sp=Math.min(RM3M.TW+.006,(rk.userData.len-.08)/per);return {per,sp,sc:sp/(RM3M.TW+.006)}}
function rackSlot(rk,i,n,o){const row=i<o.per?0:1,j=row?i-o.per:i,cnt=row?n-o.per:o.per,x=(j-(cnt-1)/2)*o.sp,sl=RM3M.slot(row,x);return {row,x,lp:sl.p,lq:sl.q,p:rk.localToWorld(sl.p.clone()),q:rk.quaternion.clone().multiply(sl.q)}}
// ---------- cada vez que cambia algo: a dónde va cada ficha ----------
function apply(){const s=st,G=s.G,n=G.players.length,me=s.me,now=performance.now();
 const key=n+':'+(s.atril?1:0);if(key!==seatKey){seatKey=key;E.seats(n);buildRacks(n,!!s.atril)}
 seatK=[];G.ord.forEach(k=>{seatK[seatOf(G,k,me)]=k});if(AV)RMA.seats(G,seatK,me,E);
 L=layout(s.mesa,s.my);const want=new Map(),y0=K.TH+RM3M.TT*L.sc/2+.003;
 s.mesa.forEach((g,gi)=>g.forEach((id,j)=>{const t=L.pos[gi][j];want.set(id,{p:v3(t.x,y0+(s.sel===id?.05:0),t.z),q:Q0,s:L.sc})}));
 RK=null;if(s.atril&&racks[0]){const o=rowsOf(s.atril.length,racks[0]);RK={list:s.atril.map((id,i)=>Object.assign({id},rackSlot(racks[0],i,s.atril.length,o))),ids:new Set(s.atril)};
  RK.list.forEach(r=>want.set(r.id,{p:s.sel===r.id?r.p.clone().setY(r.p.y+.05):r.p,q:r.q,s:o.sc,lp:s.sel===r.id?r.lp.clone().setY(r.lp.y+.05):r.lp,lq:r.lq}))}
 // las que llegan: de la bolsa (las que robas) o del atril de quien está jugando; las que se van regresan a su atril
 const ts=G.phase=='play'?seatOf(G,G.turn,me):-1,from=c=>c>0&&racks[c]?racks[c].localToWorld(v3(0,.2,0)):K.BAG.clone().setY(K.TH+.35);
 want.forEach((w,id)=>{let m=T.get(id);if(!m){m=RM3M.tile(id);SC.add(m);T.set(id,m);const onR=RK&&RK.ids.has(id);
   m.position.copy(!primed?w.p:onR?K.BAG.clone().setY(K.TH+.35):from(ts));m.quaternion.copy(!primed||!onR?w.q:Q0);m.scale.setScalar(w.s)}
  const u=m.userData;u.tp=w.p;u.tq=w.q;u.ts=w.s;u.die=0;u.rack=!!(RK&&RK.ids.has(id));u.lp=w.lp;u.lq=w.lq;if(!u.rack)u.cl=null;
  u.fm.emissive.setHex(s.sel===id?0x2e8b57:s.nuevas.has(id)?0xffa000:0);u.fm.emissiveIntensity=s.sel===id?.45:.22});
 T.forEach((m,id)=>{if(want.has(id))return;const u=m.userData;if(!u.die){u.die=now+520;u.tp=from(lastTurn>=0?seatOf(G,lastTurn,me):ts);u.ts=.6}});
 seatK.forEach((k,c)=>{if(!(c===0&&s.atril))backs(c,s.cnt[k]||0)});
 underlays();
 if(G.tc!==lastTc){if(lastTc!=null&&G.phase=='play')flipT=now;lastTc=G.tc}
 const F=G.fx||[];if(lastFx<0)lastFx=F.filter(f=>(f.ago||0)>2500).reduce((m,f)=>Math.max(m,f.n),0);F.forEach(f=>{if(f.n<=lastFx)return;lastFx=f.n;if(f.t=='roba'||f.t=='mez')bagT=now+(f.t=='mez'?1400:650);
  if(AV)RMA.fx(f,{bag:K.BAG,table:v3(0,K.TH,0),cam:CA.position})});
 // quien está jugando estira la mano cada vez que mueve fichas en la mesa
 if(G.tn!==lastTn){if(lastTn!=null&&AV&&G.turn!==me)RMA.poke(G.turn,v3(0,K.TH,0));lastTn=G.tn}
 lastTurn=G.phase=='play'?G.turn:-1;primed=true}
// fichas de espaldas en el atril de otro: las nuevas salen de la bolsa
function backs(c,n){const a=BK[c]||(BK[c]=[]),rk=racks[c];if(!rk)return;
 while(a.length<n){const m=RM3M.back();m.position.copy(primed?K.BAG.clone().setY(K.TH+.35):rk.position);SC.add(m);a.push(m)}while(a.length>n)SC.remove(a.pop());
 const o=rowsOf(n,rk);a.forEach((m,i)=>{const r=rackSlot(rk,i,n,o);m.userData={tp:r.p,tq:r.q,ts:o.sc};if(!primed){m.position.copy(r.p);m.quaternion.copy(r.q);m.scale.setScalar(o.sc)}})}
// marcas bajo cada grupo: rojo si no sirve, gris si está bloqueado (antes de bajar), verde donde va a caer lo que arrastras, blanco el lugar para combinación nueva
function underlays(){const s=st,nb=L.box.length;
 while(UL.length<nb){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.renderOrder=1;SC.add(m);UL.push(m)}
 UL.forEach((m,k)=>{const b=L.box[k];m.visible=!!b;if(!b)return;m.position.set((b.x0+b.x1)/2,K.TH+.002,b.z);m.scale.set(b.x1-b.x0+.05,b.z1-b.z0-.02,1);m.userData.k=L.nuevo&&k===nb-1?-1:k});ulColor()}
function ulColor(){UL.forEach(m=>{if(!m.visible)return;const k=m.userData.k;let c=0xffffff,o=0;
 if(hov&&hov.g===k)c=0x2e8b57,o=.38;else if(k===-1)o=.24;else if(st.bad.has(k))c=0xd63a2a,o=.32;else if(st.lock.has(k))c=0x6b5a4a,o=.14;m.material.color.setHex(c);m.material.opacity=o})}
// ---------- cada cuadro ----------
function stepTiles(now,dt){const k=1-Math.exp(-dt/80),hp=now-hop<480?Math.sin(Math.PI*(now-hop)/480)*.07:0;
const rk=racks[0];if(rk)rk.getWorldQuaternion(RQ);const rs=rk?rk.getWorldScale(TV2).x:1;
 T.forEach((m,id)=>{const u=m.userData;if(!u.tp)return;let tp=u.tp,tq=u.tq,ts=u.ts;m.castShadow=!(docked&&u.rack);
  if(u.rack&&u.lp&&rk&&!(drag&&drag.on&&drag.id===id)){if(!u.cl||u.dv!==dockV){u.dv=dockV;u.cl=rk.worldToLocal(m.position.clone());u.cq=RQ.clone().invert().multiply(m.quaternion);u.cs=m.scale.x/rs}
   u.cl.lerp(TV.copy(u.lp).setY(u.lp.y+hp/rs),k);u.cq.slerp(u.lq,k);u.cs+=(ts-u.cs)*k;m.position.copy(rk.localToWorld(TV.copy(u.cl)));m.quaternion.copy(RQ).multiply(u.cq);m.scale.setScalar(u.cs*rs);return}
  u.cl=null;
  if(drag&&drag.on&&drag.id===id&&drag.p){tp=TV.copy(drag.p).setY(K.TH+.16);tq=Q0;ts=L?L.sc:1}else if(hp&&u.rack)tp=TV.copy(u.tp).setY(u.tp.y+hp);   // al ordenar, las del atril brincan
  m.position.lerp(tp,k);m.quaternion.slerp(tq,k);m.scale.setScalar(m.scale.x+(ts-m.scale.x)*k);if(u.die&&now>u.die){SC.remove(m);T.delete(id)}});
 BK.forEach(a=>a&&a.forEach(m=>{const u=m.userData;if(!u.tp)return;m.position.lerp(u.tp,k);m.quaternion.slerp(u.tq,k);m.scale.setScalar(m.scale.x+(u.ts-m.scale.x)*k)}));
 // la bolsa se sacude cuando alguien roba o al revolver
 if(now<bagT){const w=Math.sin(now/38)*.07*Math.min(1,(bagT-now)/500);BAG.rotation.z=w;BAG.scale.set(1+w*.4,1-w*.3,1+w*.4)}else{BAG.rotation.z=0;BAG.scale.setScalar(1)}
 // reloj de arena: se voltea al empezar cada turno y se vacía con el tiempo
 const G=st.G,u=RELOJ.userData,fl=cl((now-flipT)/700,0,1);u.inner.rotation.z=Math.PI*(1-ease(fl));
 const f=G.phase!='play'?0:fl<1?1:cl((st.dl-Date.now())/(G.o.t*1000),0,1);RM3M.relojSet(RELOJ,f,G.phase=='play'&&fl>=1)}
function camStep(now,dt){const a=CA.aspect,port=a<1,vf=CA.fov*Math.PI/180,hf=2*Math.atan(Math.tan(vf/2)*a);let eye,at;
const dk=vista=='cen'&&st.me>=0&&!!RK;
 if(big&&RK&&!dk){const d=Math.max(.7,(racks[0].userData.len/2+.06)/Math.tan(hf/2));eye=v3(0,K.TH+.2+d*.5,K.AR+d*.86);at=v3(0,K.TH+.1,K.AR-.02)}
 else if(vista=='cen'||st.me<0){const d=(K.TBR+.2)/Math.tan(Math.min(hf,vf)/2);eye=v3(0,K.TH+d,.9);at=v3(0,K.TH,.08);RMV.cen(eye,at,K.TBR)}
 else{eye=v3(Math.sin(now/2300)*.012,K.TH+(port?1.5:1.02)+Math.sin(now/1700)*.008,K.CR+(port?.3:-.12));at=v3(0,K.TH-.05,port?.35:.15)}   // sentado, con un balanceo leve
 if(!camE){camE=eye.clone();camA=at.clone()}const k=1-Math.exp(-dt/230);camE.lerp(eye,k);camA.lerp(at,k);
 CA.position.copy(camE);CA.lookAt(camA);if(vista=='sen'&&!big&&st.me>=0){CA.rotateY(look.y);CA.rotateX(look.p)}CA.updateMatrixWorld();
 if(RMV.dock(racks[0],CA,SC,dk,ins,Hd)){dockV++;docked=dk}}
// nombre y fichas sobre cada silla ajena
function labels(){const s=st,G=s.G;for(let c=0;c<5;c++){let t=tags[c];if(!t){t=tags[c]=document.createElement('div');t.className='rm3-tag';lay.appendChild(t)}
 const k=seatK[c];if(k==null||c===0&&s.me>=0||c>=G.players.length){t.style.display='none';continue}
 const h=AV&&RMA.head(c),p=(h?h.clone().setY(h.y+.78):E.seat(c).setY(K.TH+1.35)).project(CA),vis=p.z<1&&Math.abs(p.x)<1.05&&Math.abs(p.y)<1.05;t.style.display=vis?'':'none';if(!vis)continue;
 const tx=es(G.players[k].name)+' <b>'+(s.cnt[k]||0)+'</b>';if(t._t!==tx){t._t=tx;t.innerHTML=tx}t.classList.toggle('turn',G.phase=='play'&&G.turn===k);t.classList.toggle('out',!!G.out[k]);
 t.style.transform=`translate(${((p.x+1)/2*Wd).toFixed(1)}px,${((1-p.y)/2*Hd).toFixed(1)}px) translate(-50%,-100%)`}}
function loop(now){raf=0;if(!shown)return;raf=requestAnimationFrame(loop);const dt=Math.min(100,now-(tPrev||now));tPrev=now;
 const b=root.getBoundingClientRect();if(b.width!==Wd||b.height!==Hd){Wd=b.width;Hd=b.height;R.setSize(Wd,Hd,false);CA.aspect=Wd/Math.max(1,Hd);CA.fov=Wd<Hd?72:56;vo=''}
 // la barra de abajo tapa parte de la pantalla: se recorre la imagen para que tu atril quede a la vista
 const sh=Math.round((ins.b||0)-(ins.t||0)),vk=Wd+'x'+Hd+':'+sh;if(vk!==vo){vo=vk;if(Math.abs(sh)>2)CA.setViewOffset(Wd,Hd+Math.abs(sh),0,sh>0?sh:0,Wd,Hd);else CA.clearViewOffset();CA.updateProjectionMatrix()}
 try{E.step(now,dt);if(st&&primed){camStep(now,dt);stepTiles(now,dt);if(AV)RMA.step(now,dt,{G:st.G,me:st.me,cam:CA.position,left:st.dl-Date.now(),tap:()=>{if(window.RMS)RMS.snd('tap')}});labels()}R.render(SC,CA)}catch(e){fail(e)}}
// ---------- tocar y arrastrar: los mismos avisos que el 2D ----------
function ptr(e){const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA)}
function tileAt(e){ptr(e);const ms=[];T.forEach(m=>{if(!m.userData.die)ms.push(m)});const h=ray.intersectObjects(ms,false)[0];return h?h.object.userData.id:null}
function ground(e){ptr(e);return ray.ray.intersectPlane(PL,v3(0,0,0))}
function onRack(e){if(!RK||!racks[0])return null;ptr(e);const h=ray.intersectObject(racks[0].userData.zone,false)[0];return h?racks[0].worldToLocal(h.point.clone()):null}
// a dónde va: tu atril (en qué lugar), un grupo (en qué lugar), el lugar para combinación nueva o cualquier parte libre de la mesa
function target(e,id){const lp=onRack(e);if(lp){const row=lp.y>.15?0:1;return {r:RK.list.filter(r=>r.id!==id&&(r.row<row||r.row===row&&r.x<lp.x)).length}}
 const p=ground(e);if(!p||!L)return null;
 for(let k=0;k<L.box.length;k++){const b=L.box[k];if(b&&p.x>b.x0-.045*L.sc&&p.x<b.x1+.045*L.sc&&p.z>b.z0&&p.z<b.z1){if(L.nuevo&&k===L.box.length-1)return {g:-1};return {g:k,at:st.mesa[k].filter((x,j)=>x!==id&&L.pos[k][j].x<p.x).length}}}
 return Math.hypot(p.x,p.z)<K.TBR-.15?{g:-1}:null}
function tap(e,id){const s=st.sel;
 if(id==null&&s==null&&E.radio){ptr(e);if(ray.intersectObject(E.radio,true).length)return RMU.radio()}   // tocar la radio la prende o la apaga
 if(id!=null){if(s==null||s===id)return RMU.pick(s===id?null:id);if(st.atril&&st.atril.includes(s)&&st.atril.includes(id))return RMU.pick(id)}
 if(s!=null){const a=target(e,s);if(a)return RMU.put(s,a)}
 if(onRack(e)){if(vista!='cen')RMU.rack(!big)}else if(big)RMU.rack(false)}
function init(){const CH=window.CASA3D;if(!CH)throw new Error('falta c_casa3d.js');const mob=matchMedia('(pointer:coarse)').matches;
 R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,mob?1.5:2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
 SC=new THREE.Scene();SC.fog=new THREE.Fog(0xe9a382,16,60);CA=new THREE.PerspectiveCamera(56,1,.03,160);SC.add(CA);
 RM3M.init(CH);E=RME.build(SC,CH,mob);K=E.K;AV=!!window.RMA&&RMA.init(SC,K,CH);PL.constant=-(K.TH+.02);BAG=RM3M.bag();BAG.position.copy(K.BAG);SC.add(BAG);RELOJ=RM3M.reloj();RELOJ.position.copy(K.RELOJ);SC.add(RELOJ);
 root=document.createElement('div');root.id='rm3root';cv=R.domElement;root.appendChild(cv);lay=document.createElement('div');lay.id='rm3lay';root.appendChild(lay);document.body.appendChild(root);
 cv.addEventListener('pointerdown',e=>{if(!st||!primed)return;if(RMV.down(e,vista=='cen')){drag=null;hov=null;return}drag={pid:e.pointerId,x:e.clientX,y:e.clientY,id:tileAt(e),on:false,mv:false,ly:look.y,lp:look.p,p:null};try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointermove',e=>{if(RMV.move(e))return;const d=drag;if(!d||e.pointerId!==d.pid)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(!d.mv&&Math.hypot(dx,dy)>7){d.mv=true;if(d.id!=null&&RMU.can(d.id))d.on=true;else d.id=null}if(!d.mv)return;
  if(d.on){d.p=ground(e);hov=target(e,d.id);ulColor()}else if(vista=='sen'&&!big){look.y=cl(d.ly-dx*.004,-1.3,1.3);look.p=cl(d.lp-dy*.003,-.5,.4)}else if(vista=='cen'){RMV.pan(e.clientX-(d.qx??d.x),e.clientY-(d.qy??d.y),CA,Hd);d.qx=e.clientX;d.qy=e.clientY}});
 cv.addEventListener('pointerup',e=>{RMV.up(e);const d=drag;if(!d||e.pointerId!==d.pid)return;drag=null;hov=null;if(d.on){const a=target(e,d.id);ulColor();if(a)RMU.put(d.id,a);return}if(!d.mv)tap(e,d.id)});
 cv.addEventListener('pointercancel',e=>{RMV.up(e);drag=null;hov=null});cv.addEventListener('dblclick',()=>{look.y=0;look.p=0;RMV.reset()});
 cv.addEventListener('wheel',e=>{if(vista!='cen')return;e.preventDefault();RMV.wheel(e)},{passive:false});ready=true}
const css=document.createElement('style');css.textContent=`#rm3root{position:fixed;inset:0;z-index:1;display:none;background:#e9a382;touch-action:none;-webkit-user-select:none;user-select:none}
#rm3root canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}#rm3lay{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.rm3-tag{position:absolute;left:0;top:0;padding:2px 9px;border-radius:999px;background:rgba(58,36,18,.78);color:#fff3e0;font:700 13px/1.4 system-ui,sans-serif;white-space:nowrap}
.rm3-tag b{color:#ffd27a;margin-left:4px}.rm3-tag.turn{background:#ffb300;color:#3a2412}.rm3-tag.turn b{color:#3a2412}.rm3-tag.out{opacity:.5;text-decoration:line-through}`;document.head.appendChild(css);
})();
