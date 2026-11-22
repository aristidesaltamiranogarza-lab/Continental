// c_billar_juego.js — BIJ: jugar Bola 8 en la mesa del cuarto del billar (SAL.M.billar; reglas en g_billar.js por /casa b.bi).
// L3 apuntar y tirar: el tiro se simula aquí al soltar (BFIS, igual que el servidor) y se reproduce con BREP sin esperar; cuando
// llega ult del servidor con el mismo tiro no se repite. Los tiros de los demás se reproducen al cambiar ult.
// Apuntar: arrastrar sobre el lienzo (horizontal gira, vertical afina) o A/D y flechas (Shift fino); en la vista de arriba el apunte
// sigue al dedo. Fuerza: botón Tirar y jalar la barra hacia abajo (c_billar_ctl.js), o mantener Espacio. Efecto: arrastrar el punto de la bola
// chica (en L4 pasa a la blanca en 3D). Bola en mano: arrastrar la blanca y soltar. Guía: hasta la primera bola + hacia dónde van.
// c_casa3d.js: BIJ.estado(v,err), BIJ.out(), BIJ.hud(busy), BIJ.key(k), BIJ.oculto(id). SAL.step llama BIJ.paso(). Ajustes en BIJ.A.
(function(){
if(typeof THREE==='undefined'||!window.BFIS||!window.BREP||!window.BCAM)return;
const A={sens:.0042,fino:.12,tecla:.9,carga:.65,cerca:3.4,suave:6,
 tilt:.09,largo:1.47,jalon:.32,guiaObj:.45,guiaBl:.3};
const PI=Math.PI,FM=BFIS.M,R=FM.R,touchy=matchMedia('(pointer:coarse)').matches,v3=(x,y,z)=>new THREE.Vector3(x,y,z);
const H=()=>window.CASA3D,M=()=>window.SAL&&SAL.M&&SAL.M.billar||null;
const yoId=()=>H()&&H().myId?H().myId():null,quien=id=>H()&&H().quien?H().quien(id):null;
const son=k=>{if(typeof sfx=='function')sfx(k)},rr=()=>{if(typeof render=='function')render()};
const r4=v=>Math.round(v*1e4)/1e4,cola=[];
let V=null,uk='',jug=false,pend=null,ang=0,pot=0,ex=0,ey=0,fase='apunta',bx=0,bz=0,vista='taco',tk='',hk='',tP=0,golpe=0,esp=false;
let mira=false,mio=false,cm='';   // mira: fuera de tu tiro pediste ver la mesa (si no, caminas); mio: el tiro que se reproduce es tuyo; cm: modo de cámara
let G=null,M0=null,ln=null,ring=null,lo=null,lb=null,taco=null,cp=null,cq=null,fov0=0,dueno=false,meVis=null;

// ---------- estado ----------
const enJuego=()=>!!(V&&V.yo&&(V.fase==='juego'||V.fase==='fin'));
const miTurno=()=>!!(V&&V.fase==='juego'&&V.yo&&V.turno===V.yo[0]&&V.ti&&V.ti[V.turno]===V.yo[1]);
const puedo=()=>miTurno()&&!jug&&!pend&&!!M0;
const enSot=()=>!!(H()&&H().piso&&/^(sot|cm1)$/.test(H().piso()));
function E(){const e=(V&&V.E||[]).map(b=>b&&b.slice());if(V&&V.mano)e[0]=[bx,bz];return e}
function lugar(Es,coc){if(Es[0]&&BFIS.libre(Es,Es[0][0],Es[0][1],coc))return Es[0].slice();const [x0,z0]=FM.cabeza;
 for(let r=0;r<40;r++)for(let k=0;k<8;k++){const x=r4(x0+Math.cos(k*PI/4)*r*R*.7),z=r4(z0+Math.sin(k*PI/4)*r*R*.7);if(BFIS.libre(Es,x,z,coc))return [x,z]}return [x0,z0]}
function apuntaInicial(){const e=E(),c=e[0];if(!c)return;if(V.saque){ang=Math.atan2(FM.pie?FM.pie[1]-c[1]:-c[1],(FM.pie?FM.pie[0]:FM.L/4)-c[0]);return}
 const g=V.gr&&V.gr[V.yo[0]],mias=g=='l'?[1,2,3,4,5,6,7]:g=='r'?[9,10,11,12,13,14,15]:[1,2,3,4,5,6,7,9,10,11,12,13,14,15];
 let obj=mias.filter(i=>e[i]);if(!obj.length)obj=[8];let b=-1,bd=1e9;obj.forEach(i=>{const d=Math.hypot(e[i][0]-c[0],e[i][1]-c[1]);if(d<bd){bd=d;b=i}});
 if(b>=0)ang=Math.atan2(e[b][1]-c[1],e[b][0]-c[0])}
function nuevoTurno(){pot=0;ex=0;ey=0;hoyo=-1;vista=V.canta?'arriba':'taco';mira=false;if(V.mano){[bx,bz]=lugar(V.E||[],V.mano==='cocina');fase='coloca'}else fase='apunta';apuntaInicial()}

function estado(v,err){if(err){if(window.SAL)SAL.aviso(err);if(pend){pend=null;BREP.para();jug=false;destapa();if(M0&&V&&V.E)BREP.pon(M0,V.E)}}
 if(!v)return;v.t0=performance.now();const prim=!V,ant=V;real=v;V=jug&&tapa?Object.assign({},v,tapa):v;BIJ.v=V;if(!enSot())modo(false);if(v.yo&&v.fase==='fin'&&!enSot()&&!cola.some(c=>c.op==='salir'))cola.push({op:'salir'});const u=v.ult,k=u?u.n+'|'+u.por+'|'+(u.tiro?u.tiro.a+','+u.tiro.v:'-'):'';
 if(prim){uk=k;if(M0&&v.E)BREP.pon(M0,v.E);return}
 if(k!==uk){uk=k;if(!u)return;
  if(pend&&u.tiro&&u.tiro.a===pend.a&&u.tiro.v===pend.v&&u.tiro.ex===pend.ex&&u.tiro.ey===pend.ey){pend=null;return}   // ya lo estamos viendo
  pend=null;if(M0&&u.tiro)reproduce(u.E0,u.tiro,ant);else if(M0&&v.E&&!jug)BREP.pon(M0,v.E)}
 else if(M0&&v.E&&!jug&&!pend&&!miTurno())BREP.pon(M0,v.E)}
// mientras ruedan las bolas se sigue mostrando el estado de antes del tiro (turno, grupo, ganador, aviso): el resultado llega al detenerse
const OC=['fase','turno','ti','gr','gana','por','ult','mano','saque'];let tapa=null,real=null;
function destapa(){tapa=null;if(real){V=real;BIJ.v=real}}
function reproduce(E0,t,ant){const m=M0,res=BFIS.simula(E0,t),b=ant||V;if(b&&!tapa){tapa={};OC.forEach(f=>tapa[f]=b[f]);if(V)V=Object.assign({},V,tapa)}jug=true;BCAM.tiro(t.a);Object.assign(BCAM.VM,{z:1,x:0,y:0});
 BREP.juega(m,res,{al:ev=>{if(window.BSON)BSON.ev(ev);else if(ev.k==='tronera')son('card')},fin:()=>{jug=false;mio=false;destapa();if(V&&V.E)BREP.pon(m,V.E);tk=''}})}
function tira(){if(!puedo()||fase!=='apunta'||pot<.02){pot=0;return}if(V.canta&&hoyo<0){pot=0;vista='arriba';rr();if(window.SAL)SAL.aviso('Toca el hoyo donde va a entrar la 8');return}const e=E();if(!e[0])return;
 const t=BFIS.norma({a:ang,v:Math.max(.05,pot*pot*BFIS.A.vmax),ex,ey}),m={op:'tiro',a:t.a,v:t.v,ex:t.ex,ey:t.ey};if(V.mano){m.x=r4(bx);m.z=r4(bz)}if(V.canta)m.h=hoyo;
 cola.length=0;cola.push(m);pend=Object.assign({t:performance.now()},t);golpe=performance.now();pot=0;mio=true;reproduce(e,t)}
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
 const j=pot>.8?(pot-.8)/.2*k:0,jl=j*R*.07*Math.sin(now*.083),jv=j*R*.05*Math.sin(now*.121+1);
 taco.position.set((cc[0]-dx*atras-dz*(ex*o+jl))*K,M0.D.Y+(R+ey*o+jv)*K,(cc[1]-dz*atras+dx*(ex*o+jl))*K);taco.rotation.set(0,-ang+j*.004*Math.sin(now*.07),-A.tilt)}

// ---------- cámara (BCAM decide la pose; aquí se suaviza) ----------
const CD=new THREE.Camera(),Pc=v3(0,0,0),Lc=v3(0,0,0);
const enTaco=()=>puedo()&&fase==='apunta'&&vista==='taco';
function camara(dt){const C=H()&&H().cam();if(!C||!M0)return;const G0=M0.G;if(!fov0)fov0=C.fov;
 const c=E()[0]||[bx,bz],p=BCAM.pose({m:M0,modo:cm=jug?'mesa':enTaco()?'taco':'mesa',c,ang,pot,asp:C.aspect||1,fov0,dt}),f=p.f;Pc.copy(p.P);Lc.copy(p.L);
 G0.localToWorld(Pc);G0.localToWorld(Lc);CD.position.copy(Pc);CD.lookAt(Lc);
 if(!cp){cp=C.position.clone();cq=C.quaternion.clone()}const s=1-Math.exp(-dt*A.suave);cp.lerp(Pc,s);cq.slerp(CD.quaternion,s);
 C.position.copy(cp);C.quaternion.copy(cq);if(Math.abs(C.fov-f)>.01){C.fov+=(f-C.fov)*s;C.updateProjectionMatrix()}C.updateMatrixWorld()}
function suelta(){const C=H()&&H().cam(),me=quien(yoId());dueno=false;cp=cq=null;cm='';if(C&&fov0){C.fov=fov0;C.updateProjectionMatrix()}fov0=0;
 if(C&&window.CCAM)CCAM.blendIn(C,CCAM.pose(C),700);if(me&&meVis!=null)me.g.visible=meVis;meVis=null}

let mOn=null;
function modo(on){if(on===mOn)return;mOn=on;document.documentElement.classList.toggle('bijon',on);css();
 if(M0&&M0.lampara)M0.lampara.traverse(o=>{if(o.isMesh)o.visible=!on})}
// ---------- cada cuadro ----------
function paso(){const now=performance.now(),dt=Math.min(.1,(now-(tP||now))/1000);tP=now;if((!M0||M()!==M0)&&!arma())return;
 if(!V)return;if(pend&&now-pend.t>8000){pend=null}   // el servidor no contestó: que mande su verdad
 const t=miTurno()?V.turno+'|'+(V.ult?V.ult.n:0)+'|'+V.n+'|'+V.mano:'';if(t!==tk){tk=t;if(t&&!jug)nuevoTurno()}
 if(esp&&puedo()&&fase==='apunta')pot=Math.min(1,pot+dt*A.carga);
 if(keys.size&&puedo()&&fase==='apunta'){const g=dt*A.tecla*(keys.has('f')?A.fino*1.5:1);if(keys.has('l'))ang-=g;if(keys.has('r'))ang+=g}
 if(puedo()){if(V.mano)BREP.pon(M0,E());if(fase==='apunta')guia();else[ln,lo,lb,ring].forEach(o=>o.visible=false)}else[ln,lo,lb,ring].forEach(o=>o.visible=false);
 dibTaco(now);BCAM.punto(M0,E()[0],ang,ex,ey,dueno&&enTaco());marca();
 // fuera de tu tiro caminas y haces emotes (la cámara vuelve a la casa), salvo que pidas ver la mesa; tu tiro se sigue hasta que acaba
 const quiero=enJuego()&&enSot(),tomo=quiero&&(miTurno()||!!pend||(jug&&mio)||mira);if(!quiero){mira=false;Object.assign(BCAM.VM,{z:1,x:0,y:0})}
 modo(tomo);if(tomo){if(!dueno){dueno=true;const me=quien(yoId());if(me){meVis=me.g.visible}}camara(dt)}else if(dueno)suelta();
 if(window.BPJ){if((V.fase==='juego'||V.fase==='fin')&&enSot())BPJ.paso(V,M0,(V.E||[])[0],(quien(yoId())||{}).g);else BPJ.limpia()}
 const seg=V.fase==='juego'?Math.ceil(Math.max(0,V.left-(now-V.t0))/1000):0;
 if(window.BCTL)BCTL.paso({on:quiero,camina:quiero&&!dueno,fuera:quiero&&!miTurno()&&!pend&&!(jug&&mio),tiro:dueno&&puedo()&&fase==='apunta',vista,pot,ex,ey,mano:!!(V.mano&&puedo()&&fase==='apunta'),fin:V.fase==='fin',chip:quiero?chip(seg):''});const k=[V.fase,enJuego(),cerca(),miTurno(),jug,!!pend,fase,vista,V.turno,V.inv,V.gana].join('|');if(k!==hk){hk=k;rr()}}

// ---------- controles (c_billar_ctl.js) ----------
function css(){if(document.getElementById('bijCss'))return;const s=document.createElement('style');s.id='bijCss';s.textContent='html.bijon canvas{touch-action:none}.bij-bo{display:inline-block;width:1em;height:1em;border-radius:50%;vertical-align:-.15em;margin-right:.4em;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}.bij-l{background:#e8b923}.bij-r{background:linear-gradient(#f5f1e6 26%,#e8b923 26% 74%,#f5f1e6 74%)}.bij-a{background:linear-gradient(90deg,#e8b923 50%,#f5f1e6 50%)}';document.head.appendChild(s)}
function bola(g,t){return `<span class="bij-bo bij-${g||'a'}" role="img" aria-label="${t}"></span>`}
function chip(seg){if(!enJuego())return '';const yo=V.yo[0],gr=e=>V.gr&&V.gr[e],gt=g=>g=='l'?'Lisas':g=='r'?'Rayadas':'Mesa abierta';
 if(V.fase==='fin')return `<b>${V.gana===yo?'Ganaste':'Ganó '+esc(V.eq[V.gana]?V.eq[V.gana].map(nom).join(' y '):'')}</b>${V.por?'<small>'+esc(V.por)+'</small>':''}`;
 if(miTurno()&&!jug&&!pend)return `<b>${bola(gr(yo),gt(gr(yo)))}Tu tiro · ${seg} s</b>${fase==='coloca'?'<small>Coloca la blanca</small>':V.canta?'<small>'+(hoyo<0?'Toca el hoyo de la 8':'La 8 va al hoyo marcado')+'</small>':''}`;
 const m=V.ult&&(V.ult.msg||V.ult.fal),t=V.turno;
 return `<b>${t>=0?bola(gr(t),gt(gr(t))):''}${jug||pend?'Mirando el tiro':t>=0?seg+' s':'Billar'}</b>${m?'<small>'+esc(m)+'</small>':''}`}
addEventListener('keydown',e=>{if(!(enJuego()&&enSot())||e.repeat||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;if(e.key.toLowerCase()==='c'){e.stopPropagation();e.preventDefault();BIJ.vista()}},true);

// ---------- entrada sobre el lienzo ----------
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),pl=new THREE.Plane(),hit=v3(0,0,0);let toque=null;
const lienzo=e=>{const r=H()&&H().R&&H().R(),t=e.target;return !!r&&dueno&&puedo()&&(t===r.domElement||!(t.closest&&t.closest('.ui,button,input,#joy,.h3sign')))};
function enMesa(e){const C=H().cam(),cv=H().R().domElement,r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,C);
 const o=M0.G.localToWorld(v3(0,M0.D.Y+R*M0.D.K,0));pl.set(v3(0,1,0),-o.y);if(!ray.ray.intersectPlane(pl,hit))return null;const p=M0.G.worldToLocal(hit.clone());return [p.x/M0.D.K,p.z/M0.D.K]}
function arrastra(e,ini){const p=(fase==='coloca'||vista==='arriba')?enMesa(e):null;
 if(ini&&p&&fase==='apunta'&&V.canta){const h=cerHoyo(p);if(h>=0){hoyo=h;toque.hoyo=1;rr();return}}if(toque&&toque.hoyo)return;
 if(fase==='coloca'){if(p){const coc=V.mano==='cocina',m=R*1.01,x=r4(Math.max(-FM.L/2+m,Math.min(coc?-FM.L/4:FM.L/2-m,p[0]))),z=r4(Math.max(-FM.A/2+m,Math.min(FM.A/2-m,p[1]))),Es=E();if(BFIS.libre(Es,x,z,coc)){bx=x;bz=z}}return}
 if(vista==='arriba'){if(p){const c=E()[0];if(c&&Math.hypot(p[0]-c[0],p[1]-c[1])>R)ang=Math.atan2(p[1]-c[1],p[0]-c[0])}return}
 if(!ini){ang+=(e.clientX-toque.x)*A.sens+(e.clientY-toque.y)*A.sens*A.fino}}
// hoyo de la 8: cuando solo te queda la 8 tocas el hoyo donde va a entrar (aro en el hoyo); si entra en otro, pierdes
let hoyo=-1,aro=null;
function cerHoyo(p){let b=-1,d=1e9;FM.P.forEach((o,i)=>{const k=Math.hypot(p[0]-o.x,p[1]-o.z);if(k<d){d=k;b=i}});return d<FM.P[b].r*2.2?b:-1}
function marca(){const ve=!!(dueno&&miTurno()&&V.canta&&!jug&&!pend);if(!aro&&!ve)return;const m=M0;
 if(!aro||aro.parent!==m.G){if(aro&&aro.parent)aro.parent.remove(aro);aro=new THREE.Mesh(new THREE.RingGeometry(.8,1,40),new THREE.MeshBasicMaterial({color:0xf2b84b,transparent:true,depthWrite:false,side:THREE.DoubleSide}));aro.rotation.x=-Math.PI/2;aro.renderOrder=5;m.G.add(aro)}
 const D=m.D,t=performance.now()/1000;aro.visible=ve;if(!ve)return;
 if(hoyo>=0){const o=FM.P[hoyo];aro.position.set(o.x*D.K,D.Y+.004,o.z*D.K);aro.scale.setScalar(o.r*D.K*1.25);aro.material.opacity=1}
 else{const o=FM.P[Math.floor(t*1.6)%FM.P.length];aro.position.set(o.x*D.K,D.Y+.004,o.z*D.K);aro.scale.setScalar(o.r*D.K*1.25);aro.material.opacity=.55}}
const efe=(e,l)=>fase==='apunta'&&vista==='taco'?BCAM.efecto(e,H().cam(),H().R().domElement,M0,E()[0],ang,l):null;
// vista de arriba movible: dos dedos acercan (pellizco) y mueven la mesa; rueda acerca; clic derecho, o un dedo cuando no es tu tiro, la mueve;
// doble clic la regresa. Un dedo en tu tiro sigue apuntando (el segundo dedo cancela ese apunte).
const dedos=new Map();let gest=null;
const sobre=e=>{const r=H()&&H().R&&H().R(),t=e.target;return !!r&&dueno&&cm==='mesa'&&(t===r.domElement||!(t.closest&&t.closest('.ui,button,input,#joy,.h3sign')))};
function gIni(){const p=[...dedos.values()];if(!p.length){gest=null;return}const a=p[0],b=p[1]||a;gest={d:Math.hypot(a.x-b.x,a.y-b.y)||1,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,z:BCAM.VM.z,dos:p.length>1}}
function gMueve(){const p=[...dedos.values()];if(!gest||!p.length)return;const a=p[0],b=p[1]||a,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
 if(gest.dos&&p.length>1)BCAM.VM.z=Math.max(1,Math.min(BCAM.A.zoom,gest.z*Math.hypot(a.x-b.x,a.y-b.y)/gest.d));
 const p0=enMesa({clientX:gest.cx,clientY:gest.cy}),p1=enMesa({clientX:cx,clientY:cy});if(p0&&p1){BCAM.VM.x-=(p1[0]-p0[0])*M0.D.K;BCAM.VM.y-=(p1[1]-p0[1])*M0.D.K}gest.cx=cx;gest.cy=cy}
addEventListener('pointerdown',e=>{if(!sobre(e))return;const pan=e.button===1||e.button===2||!puedo()||fase!=='apunta'&&fase!=='coloca';if(e.pointerType!=='touch'&&!pan)return;
 dedos.set(e.pointerId,{x:e.clientX,y:e.clientY,pan});if(dedos.size>1&&toque){ang=toque.a0;toque=null}
 if(dedos.size>1||pan){e.stopImmediatePropagation();gIni()}},true);
addEventListener('pointermove',e=>{const d=dedos.get(e.pointerId);if(!d)return;d.x=e.clientX;d.y=e.clientY;if(gest){e.stopImmediatePropagation();gMueve()}},true);
const gFin=e=>{if(!dedos.delete(e.pointerId))return;if(gest){dedos.forEach(d=>d.pan=true);gIni()}};
addEventListener('pointerup',gFin,true);addEventListener('pointercancel',gFin,true);
addEventListener('wheel',e=>{if(!sobre(e))return;e.preventDefault();e.stopImmediatePropagation();BCAM.VM.z=Math.max(1,Math.min(BCAM.A.zoom,BCAM.VM.z*Math.exp(-e.deltaY*.0015)))},{passive:false,capture:true});
addEventListener('contextmenu',e=>{if(sobre(e))e.preventDefault()},true);
addEventListener('dblclick',e=>{if(sobre(e))Object.assign(BCAM.VM,{z:1,x:0,y:0})},true);
addEventListener('pointerdown',e=>{if(!lienzo(e))return;e.stopPropagation();const f=efe(e,false);toque={id:e.pointerId,a0:ang,x:e.clientX,y:e.clientY,ef:!!f};if(f){[ex,ey]=f;return}arrastra(e,true)},true);
addEventListener('pointermove',e=>{if(!toque||toque.id!==e.pointerId)return;e.stopPropagation();if(toque.ef){const f=puedo()&&efe(e,true);if(f)[ex,ey]=f;return}if(puedo())arrastra(e,false);toque.x=e.clientX;toque.y=e.clientY},true);
const fin=e=>{if(!toque||toque.id!==e.pointerId)return;e.stopPropagation();toque=null;if(fase==='coloca'&&puedo()){fase='apunta';apuntaInicial();rr()}};
addEventListener('pointerup',fin,true);addEventListener('pointercancel',fin,true);
const keys=new Set(),TK={arrowleft:'l',a:'l',arrowright:'r',d:'r'};
addEventListener('keydown',e=>{if(!dueno||!puedo()||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||''))return;const k=e.key.toLowerCase();
 if(TK[k]){e.stopPropagation();e.preventDefault();keys.add(TK[k]);if(e.shiftKey)keys.add('f');else keys.delete('f')}
 else if(k===' '){e.stopPropagation();e.preventDefault();if(fase==='apunta'&&!esp){esp=true;pot=0}}
 else if(k==='w'||k==='s'||k==='arrowup'||k==='arrowdown'){e.stopPropagation();e.preventDefault()}},true);
addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(TK[k])keys.delete(TK[k]);if(k==='shift')keys.delete('f');if(k===' '&&esp){esp=false;tira()}},true);
addEventListener('blur',()=>{keys.clear();esp=false});

// ---------- aviso de la mesa / barra de juego ----------
function cerca(){const me=quien(yoId()),P=window.SAL&&SAL.P&&SAL.P.billar;return !!(me&&P&&enSot()&&Math.hypot(me.pos.x-P.x,me.pos.z-P.z)<A.cerca)}
const nom=p=>p?p.n:'',I=n=>window.UI?UI.ico(n):'',esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function hud(busy){if(busy||!V||!enSot())return '';css();const me=yoId();
 if(enJuego())return '';
 if(window.BIH)return BIH.hud(V,me,cerca(),touchy);
 if(V.fase==='arma'&&V.inv===me){const o=V.eq[0][0];return `<button class="ui uh-aviso" onclick="BIJ.act('unir')" aria-label="Aceptar reto de Billar"><span class="uh-ai" aria-hidden="true">${I('jugar')}</span>
  <span class="uh-at"><b>${esc(nom(o))} te reta al Billar</b><small>Toca para aceptar</small></span></button>`}
 if(!cerca()||V.fase!=='libre')return '';
 return `<button class="ui uh-aviso" onclick="BIJ.tap()" aria-label="Jugar Billar"><span class="uh-ai" aria-hidden="true">${I('jugar')}</span>
  <span class="uh-at"><b>Jugar Billar</b><small>Bola 8 contra bot${touchy?' · toca para empezar':''}</small></span>${touchy?'':'<kbd>E</kbd>'}</button>`}
function tap(){if(window.BIH&&V&&!enJuego()&&(V.fase==='libre'||V.fase==='arma'))return BIH.abre();if(V&&V.fase==='libre'&&!enJuego())act('retar',{modo:1,bot:1,niv:1});else if(window.SAL)SAL.aviso('La mesa de billar está ocupada')}
function key(k){if(k==='escape'&&window.BIH&&BIH.cierra())return true;if(k==='e'&&V&&(V.fase==='libre'||V.fase==='arma'&&!V.yo)&&cerca()){tap();return true}return false}

const BIJ=window.BIJ={A,v:null,estado,paso,hud,key,act,tap,out:()=>cola.shift()||null,
 vista:()=>{if(enJuego()&&!miTurno())mira=!mira;else vista=vista==='taco'?'arriba':'taco';rr()},mover:()=>{if(puedo()&&V.mano){fase='coloca';rr()}},
 oculto:id=>!!(dueno&&id===yoId())||!!(V&&V.ocultos&&V.ocultos.includes(id)),jugando:()=>enJuego()};
if(window.BCTL)BCTL.cfg({pot:v=>{if(puedo())pot=v},tira,vista:BIJ.vista,ef:(x,y)=>{ex=x;ey=y},act,mover:BIJ.mover});
})();
