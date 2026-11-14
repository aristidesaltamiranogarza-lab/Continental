// c_billar_juego.js — BIJ: jugar Bola 8 en la mesa del cuarto del billar (SAL.M.billar; reglas en g_billar.js por /casa b.bi).
// L3 apuntar y tirar: el tiro se simula aquí al soltar (BFIS, igual que el servidor) y se reproduce con BREP sin esperar; cuando
// llega ult del servidor con el mismo tiro no se repite. Los tiros de los demás se reproducen al cambiar ult.
// Apuntar: arrastrar sobre el lienzo (horizontal gira, vertical afina) o A/D y flechas (Shift fino); en la vista de arriba el apunte
// sigue al dedo. Fuerza: jalar hacia abajo la barra de la derecha y soltar, o mantener Espacio. Efecto: arrastrar el punto de la bola
// chica (en L4 pasa a la blanca en 3D). Bola en mano: arrastrar la blanca y soltar. Guía: hasta la primera bola + hacia dónde van.
// c_casa3d.js: BIJ.estado(v,err), BIJ.out(), BIJ.hud(busy), BIJ.key(k), BIJ.oculto(id). SAL.step llama BIJ.paso(). Ajustes en BIJ.A.
(function(){
if(typeof THREE==='undefined'||!window.BFIS||!window.BREP)return;
const A={sens:.0042,fino:.12,tecla:.9,carga:.65,cerca:3.4,camAtras:1.75,camAlto:.8,camMira:1.2,inc:1.12,techo:3.5,suave:6,
 tilt:.09,largo:1.47,jalon:.32,guiaObj:.45,guiaBl:.3};
const PI=Math.PI,FM=BFIS.M,R=FM.R,touchy=matchMedia('(pointer:coarse)').matches,v3=(x,y,z)=>new THREE.Vector3(x,y,z);
const H=()=>window.CASA3D,M=()=>window.SAL&&SAL.M&&SAL.M.billar||null;
const yoId=()=>H()&&H().myId?H().myId():null,quien=id=>H()&&H().quien?H().quien(id):null;
const son=k=>{if(typeof sfx=='function')sfx(k)},rr=()=>{if(typeof render=='function')render()};
const r4=v=>Math.round(v*1e4)/1e4,cola=[];
let V=null,uk='',jug=false,pend=null,ang=0,pot=0,ex=0,ey=0,fase='apunta',bx=0,bz=0,vista='taco',tk='',hk='',tP=0,golpe=0,esp=false;
let G=null,M0=null,ln=null,ring=null,lo=null,lb=null,taco=null,cp=null,cq=null,fov0=0,dueno=false,meVis=null;

// ---------- estado ----------
const enJuego=()=>!!(V&&V.yo&&(V.fase==='juego'||V.fase==='fin'));
const miTurno=()=>!!(V&&V.fase==='juego'&&V.yo&&V.turno===V.yo[0]&&V.ti&&V.ti[V.turno]===V.yo[1]);
const puedo=()=>miTurno()&&!jug&&!pend&&!!M0;
const enSot=()=>!!(H()&&H().piso&&H().piso()==='sot');
function E(){const e=(V&&V.E||[]).map(b=>b&&b.slice());if(V&&V.mano)e[0]=[bx,bz];return e}
function lugar(Es,coc){if(Es[0]&&BFIS.libre(Es,Es[0][0],Es[0][1],coc))return Es[0].slice();const [x0,z0]=FM.cabeza;
 for(let r=0;r<40;r++)for(let k=0;k<8;k++){const x=r4(x0+Math.cos(k*PI/4)*r*R*.7),z=r4(z0+Math.sin(k*PI/4)*r*R*.7);if(BFIS.libre(Es,x,z,coc))return [x,z]}return [x0,z0]}
function apuntaInicial(){const e=E(),c=e[0];if(!c)return;if(V.saque){ang=Math.atan2(FM.pie?FM.pie[1]-c[1]:-c[1],(FM.pie?FM.pie[0]:FM.L/4)-c[0]);return}
 const g=V.gr&&V.gr[V.yo[0]],mias=g=='l'?[1,2,3,4,5,6,7]:g=='r'?[9,10,11,12,13,14,15]:[1,2,3,4,5,6,7,9,10,11,12,13,14,15];
 let obj=mias.filter(i=>e[i]);if(!obj.length)obj=[8];let b=-1,bd=1e9;obj.forEach(i=>{const d=Math.hypot(e[i][0]-c[0],e[i][1]-c[1]);if(d<bd){bd=d;b=i}});
 if(b>=0)ang=Math.atan2(e[b][1]-c[1],e[b][0]-c[0])}
function nuevoTurno(){pot=0;ex=0;ey=0;vista='taco';if(V.mano){[bx,bz]=lugar(V.E||[],V.mano==='cocina');fase='coloca'}else fase='apunta';apuntaInicial()}

function estado(v,err){if(err){if(window.SAL)SAL.aviso(err);if(pend){pend=null;BREP.para();jug=false;if(M0&&V&&V.E)BREP.pon(M0,V.E)}}
 if(!v)return;v.t0=performance.now();const prim=!V;V=v;BIJ.v=v;const u=v.ult,k=u?u.n+'|'+u.por+'|'+(u.tiro?u.tiro.a+','+u.tiro.v:'-'):'';
 if(prim){uk=k;if(M0&&v.E)BREP.pon(M0,v.E);return}
 if(k!==uk){uk=k;if(!u)return;
  if(pend&&u.tiro&&u.tiro.a===pend.a&&u.tiro.v===pend.v&&u.tiro.ex===pend.ex&&u.tiro.ey===pend.ey){pend=null;return}   // ya lo estamos viendo
  pend=null;if(M0&&u.tiro)reproduce(u.E0,u.tiro);else if(M0&&v.E&&!jug)BREP.pon(M0,v.E)}
 else if(M0&&v.E&&!jug&&!pend&&!miTurno())BREP.pon(M0,v.E)}
function reproduce(E0,t){const m=M0,res=BFIS.simula(E0,t);jug=true;
 BREP.juega(m,res,{al:ev=>{if(ev.k==='tronera')son('card')},fin:()=>{jug=false;if(V&&V.E)BREP.pon(m,V.E);tk=''}})}
function tira(){if(!puedo()||fase!=='apunta'||pot<.02){pot=0;return}const e=E();if(!e[0])return;
 const t=BFIS.norma({a:ang,v:Math.max(.05,pot*pot*BFIS.A.vmax),ex,ey}),m={op:'tiro',a:t.a,v:t.v,ex:t.ex,ey:t.ey};if(V.mano){m.x=r4(bx);m.z=r4(bz)}
 cola.length=0;cola.push(m);pend=Object.assign({t:performance.now()},t);golpe=performance.now();pot=0;son('tick');reproduce(e,t)}
function act(op,x){if(cola.length<8)cola.push(Object.assign({op},x||{}));son('tick');rr()}

// ---------- dibujo: guía y taco ----------
function arma(){const m=M();if(!m||!m.D||!m.bolas)return false;if(G&&G.parent)G.parent.remove(G);M0=m;G=new THREE.Group();m.G.add(G);
 const mat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false}),mk=n=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));return g};
 ln=new THREE.Line(mk(2),mat);lo=new THREE.Line(mk(2),mat);lb=new THREE.Line(mk(2),mat.clone());lb.material.opacity=.5;ring=new THREE.LineLoop(mk(32),mat);G.add(ln,lo,lb,ring);
 const K=m.D.K,cyl=new THREE.CylinderGeometry(.015*K,.0065*K,A.largo*K,12),pal=new THREE.Mesh(cyl,new THREE.MeshStandardMaterial({color:0xc89a62,roughness:.45}));
 pal.rotation.z=PI/2;pal.position.x=-A.largo*K/2;taco=new THREE.Group();taco.rotation.order='YZX';taco.add(pal);G.add(taco);
 if(V&&V.E&&!jug)BREP.pon(m,V.E);return true}
function seg(o,ax,az,bx2,bz2,y){const p=o.geometry.attributes.position,K=M0.D.K;p.setXYZ(0,ax*K,y,az*K);p.setXYZ(1,bx2*K,y,bz2*K);p.needsUpdate=true;o.geometry.computeBoundingSphere();o.visible=true}
function guia(){const e=E(),c=e[0],K=M0.D.K,y=M0.D.Y+.006;[ln,lo,lb,ring].forEach(o=>o.visible=false);if(!c)return;
 const dx=Math.cos(ang),dz=Math.sin(ang),hx=FM.L/2-R,hz=FM.A/2-R;let t=1e9,bi=-1;
 for(let i=1;i<16;i++){const b=e[i];if(!b)continue;const px=b[0]-c[0],pz=b[1]-c[1],pr=px*dx+pz*dz;if(pr<=0)continue;const d2=px*px+pz*pz-pr*pr;if(d2>=4*R*R)continue;const ti=pr-Math.sqrt(4*R*R-d2);if(ti<t){t=ti;bi=i}}
 let tb=1e9,nx=0,nz=0;if(dx>1e-9){const q=(hx-c[0])/dx;if(q<tb){tb=q;nx=-1;nz=0}}if(dx<-1e-9){const q=(-hx-c[0])/dx;if(q<tb){tb=q;nx=1;nz=0}}
 if(dz>1e-9){const q=(hz-c[1])/dz;if(q<tb){tb=q;nx=0;nz=-1}}if(dz<-1e-9){const q=(-hz-c[1])/dz;if(q<tb){tb=q;nx=0;nz=1}}
 if(bi>=0&&t<tb){const gx=c[0]+dx*t,gz=c[1]+dz*t,b=e[bi];seg(ln,c[0],c[1],gx,gz,y);
  const p=ring.geometry.attributes.position;for(let k=0;k<32;k++)p.setXYZ(k,(gx+Math.cos(k*PI/16)*R)*K,y,(gz+Math.sin(k*PI/16)*R)*K);p.needsUpdate=true;ring.geometry.computeBoundingSphere();ring.visible=true;
  let ox=b[0]-gx,oz=b[1]-gz;const on=Math.hypot(ox,oz)||1;ox/=on;oz/=on;seg(lo,b[0],b[1],b[0]+ox*A.guiaObj,b[1]+oz*A.guiaObj,y);
  const pr=dx*ox+dz*oz,tx=dx-pr*ox,tz=dz-pr*oz,tl=Math.hypot(tx,tz);if(tl>.02)seg(lb,gx,gz,gx+tx/tl*A.guiaBl*tl,gz+tz/tl*A.guiaBl*tl,y)}
 else{const gx=c[0]+dx*tb,gz=c[1]+dz*tb;seg(ln,c[0],c[1],gx,gz,y);const rx=nx?-dx:dx,rz=nz?-dz:dz;seg(lb,gx,gz,gx+rx*A.guiaBl,gz+rz*A.guiaBl,y)}}
function dibTaco(now){const e=E(),c=e[0];const ver=puedo()&&fase==='apunta'&&c||(golpe&&now-golpe<140);taco.visible=!!ver;if(!ver)return;
 const K=M0.D.K,cc=c||[bx,bz],dx=Math.cos(ang),dz=Math.sin(ang),o=BFIS.A.efmax*R,k=golpe&&now-golpe<140?Math.max(0,1-(now-golpe)/90):1,
  atras=(R*.35+pot*A.jalon)*k+R;
 taco.position.set((cc[0]-dx*atras-dz*ex*o)*K,M0.D.Y+(R+ey*o)*K,(cc[1]-dz*atras+dx*ex*o)*K);taco.rotation.set(0,-ang,-A.tilt)}

// ---------- cámara (básica; L4 la afina) ----------
const CD=new THREE.Camera(),Pc=v3(0,0,0),Lc=v3(0,0,0);
function camara(dt){const C=H()&&H().cam();if(!C||!M0)return;const D=M0.D,K=D.K,G0=M0.G;if(!fov0)fov0=C.fov;let f=fov0;
 const e=E(),c=e[0]||[bx,bz];
 if(puedo()&&fase==='apunta'&&vista==='taco'){const dx=Math.cos(ang),dz=Math.sin(ang);Pc.set((c[0]-dx*A.camAtras/K)*K,D.Y+R*K+A.camAlto,(c[1]-dz*A.camAtras/K)*K);
  Lc.set((c[0]+dx*A.camMira/K)*K,D.Y,(c[1]+dz*A.camMira/K)*K)}
 else{const asp=C.aspect||1,vx=asp<1,hl=D.L/2+.35,ha=D.A/2+.35,tv=Math.tan(f*PI/360),
  w=vx?ha:hl,hgt=(vx?hl:ha)*Math.sin(A.inc),d0=Math.max(w/(tv*asp),hgt/tv)*1.05,dm=(A.techo-D.Y)/Math.sin(A.inc);let d=d0;
  if(d>dm){f=Math.min(100,2*Math.atan(tv*d0/dm)*180/PI);d=dm}const ci=Math.cos(A.inc)*d,si=Math.sin(A.inc)*d;
  Lc.set(0,D.Y,0);if(vx)Pc.set(-ci,D.Y+si,0);else Pc.set(0,D.Y+si,ci)}
 G0.localToWorld(Pc);G0.localToWorld(Lc);CD.position.copy(Pc);CD.lookAt(Lc);
 if(!cp){cp=C.position.clone();cq=C.quaternion.clone()}const s=1-Math.exp(-dt*A.suave);cp.lerp(Pc,s);cq.slerp(CD.quaternion,s);
 C.position.copy(cp);C.quaternion.copy(cq);if(Math.abs(C.fov-f)>.01){C.fov+=(f-C.fov)*s;C.updateProjectionMatrix()}C.updateMatrixWorld()}
function suelta(){const C=H()&&H().cam(),me=quien(yoId());dueno=false;cp=cq=null;if(C&&fov0){C.fov=fov0;C.updateProjectionMatrix()}fov0=0;
 if(C&&window.CCAM)CCAM.blendIn(C,CCAM.pose(C),700);if(me&&meVis!=null)me.g.visible=meVis;meVis=null;muestra(false)}

// ---------- cada cuadro ----------
function paso(){const now=performance.now(),dt=Math.min(.1,(now-(tP||now))/1000);tP=now;if((!M0||M()!==M0)&&!arma())return;
 if(!V)return;if(pend&&now-pend.t>8000){pend=null}   // el servidor no contestó: que mande su verdad
 const t=miTurno()?V.turno+'|'+(V.ult?V.ult.n:0)+'|'+V.n+'|'+V.mano:'';if(t!==tk){tk=t;if(t&&!jug)nuevoTurno()}
 if(esp&&puedo()&&fase==='apunta')pot=Math.min(1,pot+dt*A.carga);
 if(keys.size&&puedo()&&fase==='apunta'){const g=dt*A.tecla*(keys.has('f')?A.fino*1.5:1);if(keys.has('l'))ang-=g;if(keys.has('r'))ang+=g}
 if(puedo()){if(V.mano)BREP.pon(M0,E());if(fase==='apunta')guia();else[ln,lo,lb,ring].forEach(o=>o.visible=false)}else[ln,lo,lb,ring].forEach(o=>o.visible=false);
 dibTaco(now);
 const quiero=enJuego()&&enSot();if(quiero){if(!dueno){dueno=true;const me=quien(yoId());if(me){meVis=me.g.visible}}camara(dt)}else if(dueno)suelta();
 muestra(puedo()&&fase==='apunta');
 const seg=V.fase==='juego'?Math.ceil(Math.max(0,V.left-(now-V.t0))/1000):0,k=[V.fase,enJuego(),cerca(),miTurno(),jug,!!pend,fase,vista,seg,V.turno,V.inv,V.gana].join('|');if(k!==hk){hk=k;rr()}}

// ---------- barra de fuerza y efecto (DOM) ----------
let pz=null,ef=null;
function css(){if(document.getElementById('bijCss'))return;const s=document.createElement('style');s.id='bijCss';s.textContent=`
.bij-ctl{position:fixed;right:max(14px,env(safe-area-inset-right));top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:14px;z-index:30;touch-action:none;user-select:none}
.bij-ef{width:72px;height:72px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ece6da 60%,#cfc6b6);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);position:relative;cursor:grab}
.bij-ef i{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#222;left:50%;top:50%}
.bij-pot{width:56px;height:min(40vh,240px);border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);position:relative;overflow:hidden;cursor:ns-resize}
.bij-pot b{position:absolute;left:6px;right:6px;top:6px;border-radius:999px;background:var(--ui-accent);height:0}
.bij-pot span{position:absolute;left:0;right:0;bottom:10px;text-align:center;font:800 12px var(--ui-font);color:var(--ui-sub)}
.bij-bar{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 32px);z-index:30}
.bij-bar .bij-st{padding:10px 18px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);color:var(--ui-text);display:flex;flex-direction:column;line-height:1.2}
.bij-bar .bij-st small{color:var(--ui-sub);font-weight:700}.bij-bar .ui-btn{min-height:44px}`;document.head.appendChild(s)}
function ctl(){let el=document.getElementById('bijCtl');if(el)return el;css();el=document.createElement('div');el.id='bijCtl';el.className='ui bij-ctl';el.style.display='none';
 el.innerHTML='<div class="bij-ef" aria-label="Efecto: arrastra el punto"><i></i></div><div class="bij-pot" aria-label="Fuerza: jala hacia abajo y suelta"><b></b><span>Jalar</span></div>';
 (document.getElementById('app')||document.body).appendChild(el);const po=el.querySelector('.bij-pot'),eb=el.querySelector('.bij-ef');
 po.addEventListener('pointerdown',e=>{if(!puedo())return;e.preventDefault();po.setPointerCapture(e.pointerId);pz={y:e.clientY,h:po.clientHeight-12}});
 po.addEventListener('pointermove',e=>{if(!pz)return;pot=Math.max(0,Math.min(1,(e.clientY-pz.y)/pz.h))});
 const suelto=e=>{if(!pz)return;pz=null;tira()};po.addEventListener('pointerup',suelto);po.addEventListener('pointercancel',()=>{pz=null;pot=0});
 const efm=e=>{const r=eb.getBoundingClientRect();let x=(e.clientX-r.left)/r.width*2-1,y=-((e.clientY-r.top)/r.height*2-1);const m=Math.hypot(x,y);if(m>.85){x*=.85/m;y*=.85/m}ex=Math.abs(x)<.06?0:x/.85;ey=Math.abs(y)<.06?0:y/.85};
 eb.addEventListener('pointerdown',e=>{e.preventDefault();eb.setPointerCapture(e.pointerId);ef=1;efm(e)});eb.addEventListener('pointermove',e=>{if(ef)efm(e)});
 eb.addEventListener('pointerup',()=>{ef=null});eb.addEventListener('dblclick',()=>{ex=ey=0});return el}
function muestra(on){const el=on?ctl():document.getElementById('bijCtl');if(!el)return;el.style.display=on?'':'none';if(!on)return;
 el.querySelector('.bij-pot b').style.height=`calc(${(pot*100).toFixed(1)}% - ${pot?12*pot:0}px)`;el.querySelector('.bij-pot span').textContent=pot>.01?Math.round(pot*100)+'%':'Jalar';
 const d=el.querySelector('.bij-ef i');d.style.left=(50+ex*.85*50)+'%';d.style.top=(50-ey*.85*50)+'%'}

// ---------- entrada sobre el lienzo ----------
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),pl=new THREE.Plane(),hit=v3(0,0,0);let toque=null;
const lienzo=e=>{const r=H()&&H().R&&H().R();return !!r&&e.target===r.domElement&&dueno&&puedo()};
function enMesa(e){const C=H().cam(),cv=H().R().domElement,r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,C);
 const o=M0.G.localToWorld(v3(0,M0.D.Y+R*M0.D.K,0));pl.set(v3(0,1,0),-o.y);if(!ray.ray.intersectPlane(pl,hit))return null;const p=M0.G.worldToLocal(hit.clone());return [p.x/M0.D.K,p.z/M0.D.K]}
function arrastra(e,ini){const p=(fase==='coloca'||vista==='arriba')?enMesa(e):null;
 if(fase==='coloca'){if(p){const x=r4(p[0]),z=r4(p[1]),Es=E();if(BFIS.libre(Es,x,z,V.mano==='cocina')){bx=x;bz=z}}return}
 if(vista==='arriba'){if(p){const c=E()[0];if(c&&Math.hypot(p[0]-c[0],p[1]-c[1])>R)ang=Math.atan2(p[1]-c[1],p[0]-c[0])}return}
 if(!ini){ang+=(e.clientX-toque.x)*A.sens+(e.clientY-toque.y)*A.sens*A.fino}}
addEventListener('pointerdown',e=>{if(!lienzo(e))return;e.stopPropagation();toque={id:e.pointerId,x:e.clientX,y:e.clientY};arrastra(e,true)},true);
addEventListener('pointermove',e=>{if(!toque||toque.id!==e.pointerId)return;e.stopPropagation();if(puedo())arrastra(e,false);toque.x=e.clientX;toque.y=e.clientY},true);
const fin=e=>{if(!toque||toque.id!==e.pointerId)return;e.stopPropagation();toque=null;if(fase==='coloca'&&puedo()){fase='apunta';apuntaInicial();rr()}};
addEventListener('pointerup',fin,true);addEventListener('pointercancel',fin,true);
const keys=new Set(),TK={arrowleft:'l',a:'l',arrowright:'r',d:'r'};
addEventListener('keydown',e=>{if(!dueno||!puedo()||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;const k=e.key.toLowerCase();
 if(TK[k]){e.stopPropagation();e.preventDefault();keys.add(TK[k]);if(e.shiftKey)keys.add('f');else keys.delete('f')}
 else if(k===' '){e.stopPropagation();e.preventDefault();if(fase==='apunta'&&!esp){esp=true;pot=0}}
 else if(k==='w'||k==='s'||k==='arrowup'||k==='arrowdown'){e.stopPropagation();e.preventDefault()}},true);
addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(TK[k])keys.delete(TK[k]);if(k==='shift')keys.delete('f');if(k===' '&&esp){esp=false;tira()}},true);
addEventListener('blur',()=>{keys.clear();esp=false;pz=null});

// ---------- aviso de la mesa / barra de juego ----------
function cerca(){const me=quien(yoId()),P=window.SAL&&SAL.P&&SAL.P.billar;return !!(me&&P&&enSot()&&Math.hypot(me.pos.x-P.x,me.pos.z-P.z)<A.cerca)}
const nom=p=>p?p.n:'',I=n=>window.UI?UI.ico(n):'',esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function hud(busy){if(busy||!V||!enSot())return '';css();const me=yoId();
 if(enJuego()){const yo=V.yo[0],g=V.gr&&V.gr[yo],gt=g=='l'?'Lisas':g=='r'?'Rayadas':'Mesa abierta',now=performance.now(),seg=Math.ceil(Math.max(0,V.left-(now-V.t0))/1000);
  let b,s,bt='';
  if(V.fase==='fin'){b=V.gana===yo?'Ganaste':'Ganó '+esc(V.eq[V.gana]?V.eq[V.gana].map(nom).join(' y '):'');s=esc(V.por);bt=`<button class="ui-btn" onclick="BIJ.act('revancha')">Revancha</button>`}
  else if(miTurno()&&!jug&&!pend){b=`Tu tiro · ${seg} s`;s=fase==='coloca'?'Arrastra la blanca a su lugar':touchy?'Arrastra para apuntar · jala la barra':'Arrastra o A/D para apuntar · Espacio para tirar';
   bt=(fase==='apunta'?`<button class="ui-btn sec" onclick="BIJ.vista()">${vista==='taco'?'Arriba':'Detrás'}</button>`:'')+(V.mano&&fase==='apunta'?`<button class="ui-btn sec" onclick="BIJ.mover()">Mover blanca</button>`:'')}
  else{const p=V.turno>=0&&V.eq[V.turno]?V.eq[V.turno][V.ti[V.turno]]:null;b=jug||pend?'Mirando el tiro':p?'Tira '+esc(nom(p)):'Billar';s=V.ult&&V.ult.msg?esc(V.ult.msg):V.ult&&V.ult.fal?esc(V.ult.fal):""}
  return `<div class="ui bij-bar"><div class="bij-st" role="status"><b>${b}</b><small>${[s,V.fase==="juego"?gt:""].filter(Boolean).join(" · ")}</small></div>${bt}<button class="ui-btn ghost" onclick="BIJ.act('salir')" aria-label="Salir del Billar">${I('salir')}</button></div>`}
 if(V.fase==='arma'&&V.inv===me){const o=V.eq[0][0];return `<button class="ui uh-aviso" onclick="BIJ.act('unir')" aria-label="Aceptar reto de Billar"><span class="uh-ai" aria-hidden="true">${I('jugar')}</span>
  <span class="uh-at"><b>${esc(nom(o))} te reta al Billar</b><small>Toca para aceptar</small></span></button>`}
 if(!cerca()||V.fase!=='libre')return '';
 return `<button class="ui uh-aviso" onclick="BIJ.tap()" aria-label="Jugar Billar"><span class="uh-ai" aria-hidden="true">${I('jugar')}</span>
  <span class="uh-at"><b>Jugar Billar</b><small>Bola 8 contra bot${touchy?' · toca para empezar':''}</small></span>${touchy?'':'<kbd>E</kbd>'}</button>`}
function tap(){if(V&&V.fase==='libre'&&!enJuego())act('retar',{modo:1,bot:1,niv:1});else if(window.SAL)SAL.aviso('La mesa de billar está ocupada')}
function key(k){if(k==='e'&&V&&V.fase==='libre'&&cerca()){tap();return true}return false}

const BIJ=window.BIJ={A,v:null,estado,paso,hud,key,act,tap,out:()=>cola.shift()||null,
 vista:()=>{vista=vista==='taco'?'arriba':'taco';rr()},mover:()=>{if(puedo()&&V.mano){fase='coloca';rr()}},
 oculto:id=>!!(dueno&&id===yoId()),jugando:()=>enJuego()};
})();
