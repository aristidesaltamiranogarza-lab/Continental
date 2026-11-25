// c_casona_caja.js — CAJA: maqueta de cajas de la casona (CASONA.md pasos 1–2). Es la casa por defecto; ?casa=vieja vuelve a la casa vieja.
// Cada nivel es un piso de c_casa3d.js (cm1, c0, c1, c2) armado desde modelos/casona/<nivel>.glb (blender/casona.py).
// Todo lo que se toca sale del GLB vía MARC (c_casa_marcas.js): mesas (mesa real si el juego existe, si no una de muestra),
// choques, llegada, límites y las escaleras (sube/baja, destino en el extra to) como portales. Corte con MARC.corte.
// La planta baja ya es la detallada y horneada (pasos 3a/3b: modelos/casona/pb.glb, materiales en CMAT, gata en gata_n0);
// con ?pb=caja vuelve a la maqueta de cajas (planta alta, paso 5: pa.glb de blender/casona_pa.py; ?pa=caja; sótano, paso 6: sm.glb de blender/casona_sm.py
// con sus juegos de verdad en SOTC, c_casona_sot.js; ?sm=caja; azotea, paso 7: az.glb de blender/casona_az.py; ?az=caja). Paso 4: una sola escalera (sube/baja en el mismo punto de los 4 niveles); al llegar
// desde otro nivel apareces en llegada_escalera; planos enmarcados (plano_<lugar>) con la planta del nivel que abren "Ir a" (CIR).
(function(){
if(typeof THREE==='undefined')return;
const ON=!/[?&]casa=(vieja|glb)\b/.test(location.search),V='4',BASE='modelos/casona/',CR=/[?&]crudo\b/.test(location.search),VP='9',Q=k=>new RegExp('[?&]'+k+'=caja\\b').test(location.search),HB={cm1:Q('sm')?null:['sm','5','webp'],c0:Q('pb')?null:['pb',VP,'webp'],c1:Q('pa')?null:['pa','8','webp'],c2:Q('az')?null:['az','4','webp']};
const NV={cm1:'nm1',c0:'n0',c1:'n1',c2:'n2'},PISO={};Object.keys(NV).forEach(k=>PISO[NV[k]]=k);
const FEL={c:['#2f9a62','#0f4a2d'],t:['#3d84cc','#123a68'],k:['#a8343f','#4a1218'],f:['#b9ad90','#6e6450']};
const FS={};

function piso(id){if(FS[id])return FS[id];const H=window.CASA3D;if(!H||!window.CGLB||!window.MARC)return null;
 const S=new THREE.Scene(),TB=[],OB=[],hits=[],WL=[],links=[],LIN=[];
 S.background=new THREE.Color(id==='cm1'?0x1a1512:0xbcd3e0);
 S.add(new THREE.HemisphereLight(0xfff4e0,0x8a7a6a,id==='cm1'?1.3:1.7));const L=new THREE.DirectionalLight(0xffffff,id==='cm1'?.6:1.4);L.position.set(-10,20,12);S.add(L);
 const sp={x:0,z:0},se={x:0,z:0,ok:0},bx=[-17.6,17.6,-12.6,16.6];
 const hb=!!(HB[id]&&window.CMAT)&&HB[id];
 const F={id,SC:S,TB,OB,hits,links,WL,bx,k:1,ext:id!=='cm1',spawn:from=>from in NV&&se.ok?{x:se.x,z:se.z,yaw:Math.PI/2}:{x:sp.x,z:sp.z,yaw:-Math.PI/2},step:()=>{const c=H.cam&&H.cam(),p=H.yo&&H.yo();if(window.TRAMA&&TRAMA.on())TRAMA.paso(LIN,c,p);else MARC.corte(LIN,window.CAV&&CAV.on()&&p?{position:p}:c,p);/* R13: en primera persona no se corta nada */if(window.NIVC){NIVC.tapas(LIN);NIVC.paso(F.niv,c)}if(F.cua)CUA.paso(c,p,id);
  if(F.copas)CMAT.paso(F.copas,p,c);if(F.casco)F.casco.paso(p);if(F.fuera)F.fuera.paso(c,p);if(F.sot)F.sot.step();if(F.gata){const n=performance.now();GATA.paso(F.gata,n,Math.min(50,n-(F.tg||n)));F.tg=n}}};
 F.cb=[bx[0]-.4,bx[1]+.4,bx[2]-.4,bx[3]+.4];
 const MAT={},mat=m=>{const n=(m&&m.name)||'x';return MAT[n]||(MAT[n]=new THREE.MeshLambertMaterial({color:m&&m.color?m.color.clone():0xcccccc}))};
 let ok;F.listo=new Promise(r=>ok=r);const PR=F.pr={glb:0,luz:hb?0:1,re:0};F.prog=()=>({p:PR.glb*.75+PR.luz*.25,re:PR.re});let gOK=0,lOK=!hb;const fin=()=>{if(gOK&&lOK)ok()};
 bajaGLB(BASE+(hb?(CR?'crudo/'+hb[0]+'.glb?v=c'+Date.now():hb[0]+'.glb?v='+hb[1]):NV[id]+'.glb?v='+V),PR).then(gl=>{const R=gl.scene;S.add(R);if(window.VIS)VIS.grandes(R);if(window.NIVC)F.niv=NIVC.preparar(R,id);
  if(hb){CMAT.aplicar(R,CR?null:BASE+hb[0]+'_luz.'+hb[2]+'?v='+hb[1],()=>{PR.luz=1;lOK=1;fin()},n=>{PR.re=n});F.copas=CMAT.copas(R);juntas(R)}else R.traverse(o=>{if(o.isMesh)o.material=mat(o.material)});
  for(const n in PEGA){const o=R.getObjectByName(n);if(o)o.userData.pega=PEGA[n]}
  const D=MARC.leer(R);
  WL.push(...D.WL);OB.push(...D.OB);LIN.push(...D.lineas);
  if(D.llegada){sp.x=D.llegada.x;sp.z=D.llegada.z}
  if(D.llegadaEsc)Object.assign(se,{x:D.llegadaEsc.x,z:D.llegadaEsc.z,ok:1});
  D.planos.forEach(p=>plano(H,S,hits,p,id,D));D.acciones.forEach(a=>accion(S,hits,a));
  if(hb&&id==='cm1'&&window.SOTC)try{F.sot=SOTC.pon(F,R,D,H)}catch(er){console.error('[SOTC]',er)}
  if(D.caja){const c=D.caja;bx.splice(0,4,c[0]+.4,c[1]-.4,c[2]+.4,c[3]-.4);F.cb.splice(0,4,...c)}
  if(window.CUA&&CUA.casona&&CUA.casona(id,D.WL,D.caja,D)){CUA.abre(R);F.cua=1}   // paso 10: no dibuja los cuartos cerrados que no se ven
  for(const k of ['sube','baja']){const e=D.escaleras[k],to=e&&PISO[e.to];if(!to)continue;
   const l={x:e.x,z:e.z,r:e.r,ax:e.ax,az:e.az,to};links.push(l);
   D.escalones[k].forEach(o=>{o.userData.hit={t:'link',l};hits.push(o)})}
  D.mesas.forEach(m=>{const fe=FEL[m.fam]||FEL.k;if(F.sot&&F.sot.hechas[m.g])return;
   if(typeof GM!=='undefined'&&GM[m.g]){const t={g:m.g,x:m.x,z:m.z,r:2.2,felt:fe,aire:m.aire};TB.push(t);H.mesa(t,S,hits,OB);if(F.sot&&F.sot.viste)F.sot.viste(t)}
   else muestra(H,S,OB,m.g,m.x,m.z,fe)});
  if(hb&&id==='c0'){gata(H,S,hits,R,D,F);calle(F,R,D)}
  if(hb&&id!=='cm1'&&window.CFUE)try{F.fuera=CFUE.pon(F)}catch(er){console.error('[CFUE]',er)}
  F.marcas=D;CAJA.listos[id]=true;gOK=1;fin()}).catch(err=>{console.warn('CAJA',err);ok()});
 return FS[id]=F}

// arreglos al cargar, sin volver a hornear (la luz va pegada a los vértices):
// - las tapas de cada tramo de muro (caras con normal a lo largo del tramo) quedaban en el plano de la cara del muro perpendicular y parpadeaban
//   (franjas oscuras en las uniones); se meten 1.5 cm dentro del muro. Las jambas de puertas y ventanas también, pero las tapa su marco de cantera.
// - los pisos de afuera (pasto, calle, banqueta, laja) suben 2 cm: la calle y el patio de la casa vieja (CCALLE.fondo) se dibujan en el mismo plano.
// - en la planta alta, el canto de la losa del vacío baja 1 cm (su tapa estaba al ras del piso del corredor).
// Uniones: en una T (el muro de enfrente sigue de los dos lados) el que llega termina en la cara del otro (lambrín 2 cm dentro del otro, moldura en su cara;
// las tapas quedan espalda con espalda, no se ven); en una esquina el tramo 'h' cubre el cuadro de la esquina tal cual y el 'v' llega solo hasta la cara del 'h'
// (así su cara de afuera ya no está bajo la tapa del 'h'). Medidas de casona_pb.py.
const HM=.15,PISO_FUERA=/_piso_(pasto|calle|banqueta|laja)$/;
// R5: en una esquina el lambrín del 'h' llega a la cara del lambrín del 'v' (antes salía 2 cm y su tapa horneada hacía una franja oscura) y el del 'v' a la del 'h'
const EXT={'':HM,lam:HM+.03,rod:HM+.05},T_EXT={'':-HM,lam:-(HM+.01),rod:-(HM+.05)},L_EXT={'':-HM,lam:-(HM+.03),rod:-(HM+.05)},E_EXT={h:EXT,v:L_EXT};
function juntas(R){const W=[];
 R.traverse(o=>{if(!o.isMesh)return;const m=/_muro_(b?)([hv])\d+_\d+(?:_(lam|rod))?$/.exec(o.name);
  if(m){const bb=new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position),e=m[2],A=e==='h'?'x':'z',Cc=e==='h'?'z':'x';
   W.push({o,b:!!m[1],e,s:m[3]||'',A,Cc,a0:bb.min[A],a1:bb.max[A],c:(bb.min[Cc]+bb.max[Cc])/2});return}
  const dy=PISO_FUERA.test(o.name)?.02:/_losa_borde$/.test(o.name)?-.01:0;if(dy){o.position.y+=dy;o.updateMatrix()}});
 const base=W.filter(w=>!w.s);
 W.forEach(w=>{const g=w.o.geometry,P=g.attributes.position,N=g.attributes.normal;if(!N)return;const ia=w.A==='x'?0:2,ic=2-ia;
  // planos de las tapas (vértices con normal a lo largo del tramo) → a dónde van; luego se mueven TODOS los vértices de ese plano (también las orillas de los lados)
  const mv=new Map();
  for(let i=0;i<P.count;i++){const n=N.getComponent(i,ia);if(Math.abs(n)<=.99)continue;const s=Math.sign(n),a=P.getComponent(i,ia),k=a.toFixed(3);if(mv.has(k))continue;const j=a-s*EXT[w.s];
   const q=base.find(p=>p.e!==w.e&&Math.abs(p.c-j)<.02&&p.a0<w.c+.2&&p.a1>w.c-.2);if(!q){mv.set(k,null);continue}   // jamba o punta suelta: se queda
   mv.set(k,j+s*(q.a0<w.c-.2&&q.a1>w.c+.2?T_EXT[w.s]:E_EXT[w.e][w.s]))}
  for(let i=0;i<P.count;i++){const t=mv.get(P.getComponent(i,ia).toFixed(3));if(t!=null)P.setComponent(i,ia,t);
   if(w.b&&!w.s&&Math.abs(N.getComponent(i,ic))>.99)P.setComponent(i,ic,P.getComponent(i,ic)-N.getComponent(i,ic)*.006)}   // la barda, 6 mm más delgada que el muro que la sigue
  P.needsUpdate=true;g.computeBoundingSphere();g.computeBoundingBox()})}

// paso 8, la calle: CCALLE ya arma el exterior a la medida de la casona (fachada en 17, banqueta de 1.6, arroyo más abajo), así que la tira de
// arroyo del GLB se esconde; se camina hasta la orilla de la banqueta y el poste choca. El patio de la casa vieja (CPAT) no se ve en la casona.
// Con tu Mii en la banqueta se prende el casco (CCAS: planta alta, azotea, pérgola y tinacos).
function calle(F,R,D){const ar=R.getObjectByName('pb_piso_calle'),cg=window.CCALLE&&CCALLE.glb&&CCALLE.glb();if(ar){if(cg){ar.position.y-=.35;ar.updateMatrix()}else ar.visible=false}
 // se cruza la calle hasta la banqueta de enfrente (fachadas vecinas en 32.6): se baja al arroyo (y -.35) y se sube en las guarniciones
 F.bx[3]=32.2;F.cb[3]=Math.max(F.cb[3],33);if(cg){F.bx2=[[-42,21,17.2,32.2],[-87,87,19.6,37],[-89.7,-80.3,-47,37],[80.3,89.7,-47,37],[-89.7,-41,-47,-23],[41,89.7,-47,-23]];F.cb.splice(0,4,Math.min(F.cb[0],-90),Math.max(F.cb[1],90),Math.min(F.cb[2],-48),Math.max(F.cb[3],38))}   // calle.glb: su tramo, la calle entera, las de las esquinas y por detrás de las cuadras al parque (izq.) y a la cancha (der.)
 F.OB.push(...(cg?[{x:-36,z:18.3,r:.35},{x:-6,z:18.3,r:.35},{x:-30,z:18.3,r:.75}]:[{x:11.8,z:18.3,r:.3}]),{x:0,z:29.05,r:.3});
 [4.8,6.2,7.5,8.8,10.2].forEach(x=>F.OB.push({x,z:20.5,r:.75}));   // el vocho
 const ss=(e,z)=>Math.min(1,Math.max(0,(z-e+.15)/.3)),st=t=>t*t*(3-2*t);F.gy=(x,z)=>-.35*(st(ss(18.6,z))-st(ss(28.6,z)));
 if(window.CCAS)try{F.casco=CCAS.pon(F)}catch(er){console.error('[CCAS]',er)}
 if(window.CIELO&&CIELO.pisos)CIELO.mundo.children.forEach(o=>{if((o.name==='patio'||o.name==='tras')&&!o.userData.casona){o.userData.casona=1;CIELO.pisos(o,p=>!(p in PISO_ID))}})}
const PISO_ID={cm1:1,c0:1,c1:1,c2:1};
// campana y cazos de la cocina: cuelgan del muro del norte (z 10 del plano); se esconden con él en el corte
const PEGA={pb_coc_campana:[13.8,7],pb_coc_cobre:[11.2,7]};

// cosas que se tocan (accion_<k> del GLB): el espejo y el ropero de tu cuarto abren Mi personaje; la radio de la sala de música cambia el volumen
const ACC={mipj:()=>{if(window.MIPJ)MIPJ.abrir()},radio:()=>{if(window.musCyc)musCyc()}};
function accion(S,hits,a){const f=ACC[a.k.replace(/\d+$/,'')];if(!f)return;const m=new THREE.Mesh(new THREE.SphereGeometry(a.r,10,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
 m.position.set(a.x,a.y,a.z);m.userData.hit={t:'fn',f};S.add(m);hits.push(m)}

// la gata de la casona: sale del empty gata_n0 (ry en extras) y pasea por el patio (el piso de laja) sin chocar con columnas ni mesas
function gata(H,S,hits,R,D,F){const g=R.getObjectByName('gata_n0'),pl=R.getObjectByName('pb_piso_laja');if(!g||!pl||!window.GATA||!GATA.nueva)return;
 const p=new THREE.Vector3(),b=new THREE.Box3().setFromObject(pl);g.getWorldPosition(p);const box=[b.min.x+.5,b.max.x-.5,b.min.z+.5,b.max.z-.5];
 const en=(x,z)=>x>box[0]-1.5&&x<box[1]+1.5&&z>box[2]-1.5&&z<box[3]+1.5;
 const obs=D.OB.filter(o=>en(o.x,o.z)).map(o=>[o.x,o.z,o.r]).concat(D.mesas.filter(m=>en(m.x,m.z)).map(m=>[m.x,m.z,3.4]));
 F.gata=GATA.nueva({SC:S,std:H.std,hits},{x:p.x,z:p.z,ry:+(g.userData.ry||0),box,obs})}

// plano enmarcado en el muro: la planta de este nivel dibujada desde el GLB (muros de choque, mesas por familia, "estás aquí")
// y la pila de los 4 niveles con el actual marcado. Tocarlo abre "Ir a" (CIR). Mira hacia su +z local girado ry.
// GLB con progreso (PR.glb) y reintentos sin recargar (1, 2, 4, 8, 15 s...; tras 8 fallos se rinde y el piso queda vacío)
function bajaGLB(url,PR){let n=0;const va=()=>CGLB.cargador().then(Ld=>new Promise((si,no)=>Ld.load(url+(n?'&r='+n:''),si,e=>{PR.glb=e.lengthComputable&&e.total?e.loaded/e.total:Math.min(.9,e.loaded/8e6)},no)))
 .then(gl=>{PR.glb=1;return gl},e=>{if(++n>8)throw e;PR.re=n;console.warn('[CAJA] '+url+' falló, reintento '+n,e);return new Promise(r=>setTimeout(r,Math.min(15000,1000*2**(n-1)))).then(va)});return va()}
const ORD=['c2','c1','c0','cm1'];
function plano(H,S,hits,p,id,D){const c=D.caja;if(!c)return;
 const tx=H.ctex('casona-plano-'+id+'-'+p.k,512,512,(g,w,h)=>{g.fillStyle='#efe3c8';g.fillRect(0,0,w,h);g.strokeStyle='#8a6a48';g.lineWidth=6;g.strokeRect(14,14,w-28,h-28);
  ORD.forEach((k,i)=>{g.fillStyle=k===id?'#c2512a':'rgba(94,52,24,.25)';H.rr(g,w-74,34+i*22,40,14,5);g.fill()});
  const pad=44,ar=w-pad*2-50,s=Math.min(ar/(c[1]-c[0]),(h-pad*2)/(c[3]-c[2])),ox=pad+(ar-(c[1]-c[0])*s)/2,oy=pad+((h-pad*2)-(c[3]-c[2])*s)/2,X=x=>ox+(x-c[0])*s,Y=z=>oy+(z-c[2])*s;
  g.strokeStyle='#5a3c26';g.lineCap='round';D.WL.forEach(l=>{g.lineWidth=Math.max(2,Math.min(l[4],.35)*s);g.beginPath();g.moveTo(X(l[0]),Y(l[1]));g.lineTo(X(l[2]),Y(l[3]));g.stroke()});
  D.mesas.forEach(m=>{const fe=FEL[m.fam]||FEL.k;g.beginPath();g.arc(X(m.x),Y(m.z),Math.max(5,m.r*s),0,7);g.fillStyle=m.libre?'rgba(0,0,0,0)':fe[0];g.fill();if(m.libre){g.setLineDash([5,4]);g.strokeStyle=fe[1];g.lineWidth=3;g.stroke();g.setLineDash([])}});
  g.beginPath();g.arc(X(p.x),Y(p.z),11,0,7);g.fillStyle='#c2512a';g.fill();g.lineWidth=4;g.strokeStyle='#fff8ee';g.stroke()});
 const G=new THREE.Group();G.position.set(p.x,p.y,p.z);G.rotation.y=p.ry;S.add(G);
 H.box(1.66,1.66,.07,H.std(0x5a3418,.5),0,0,.035,G);const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.46,1.46),H.std(0xffffff,.85,{map:tx}));pl.position.z=.075;G.add(pl);
 const hit={t:'fn',f:()=>{if(window.CIR)CIR.show()}};G.traverse(o=>{if(o.isMesh){o.userData.hit=hit;hits.push(o)}})}

// mesa de muestra para los juegos que aún no existen (o que viven en su propio cuarto: billar, casino, ruleta)
function muestra(H,S,OB,g,x,z,fe){const G=new THREE.Group();G.position.set(x,0,z);S.add(G);const wd=H.std(0x4a2814,.5),fl=H.std(new THREE.Color(fe[0]).getHex(),.9);
 if(g==='billar'){H.box(3,.3,5.6,fl,0,1.45,0,G);H.box(3.3,1.3,5.9,wd,0,.65,0,G);OB.push({x,z:z-1.4,r:2},{x,z:z+1.4,r:2});return}
 H.cyl(2.2,2.2,.12,fl,0,1.5,0,G,32);H.cyl(.35,.5,1.45,wd,0,.72,0,G,12);OB.push({x,z,r:2.7})}

// al entrar a la casa con ?casa=caja, directo a la planta baja de la maqueta
function arranque(){const H=window.CASA3D;if(H&&H.on&&H.on()&&H.piso&&H.piso()==='pb'&&window.casaPiso){casaPiso('c0');return}setTimeout(arranque,400)}
const M={};Object.keys(NV).forEach(id=>{M[id]={ok:()=>ON&&!!(window.CASA3D&&CASA3D.mesa&&window.CGLB&&window.MARC),piso:()=>piso(id)}});
window.CAJA={on:ON,NV,listos:{},piso,M,juntas};
if(ON)setTimeout(arranque,600);
})();
