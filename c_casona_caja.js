// c_casona_caja.js — CAJA: maqueta de cajas de la casona (CASONA.md pasos 1–2). Solo con ?casa=caja.
// Cada nivel es un piso de c_casa3d.js (cm1, c0, c1, c2) armado desde modelos/casona/<nivel>.glb (blender/casona.py).
// Todo lo que se toca sale del GLB vía MARC (c_casa_marcas.js): mesas (mesa real si el juego existe, si no una de muestra),
// choques, llegada, límites y las escaleras (sube/baja, destino en el extra to) como portales. Corte con MARC.corte.
// La planta baja ya es la detallada y horneada (pasos 3a/3b: modelos/casona/pb.glb, materiales en CMAT, gata en gata_n0);
// con ?pb=caja vuelve a la maqueta de cajas (planta alta, paso 5: pa.glb de blender/casona_pa.py; ?pa=caja; sótano, paso 6: sm.glb de blender/casona_sm.py
// con sus juegos de verdad en SOTC, c_casona_sot.js; ?sm=caja). Paso 4: una sola escalera (sube/baja en el mismo punto de los 4 niveles); al llegar
// desde otro nivel apareces en llegada_escalera; planos enmarcados (plano_<lugar>) con la planta del nivel que abren "Ir a" (CIR).
(function(){
if(typeof THREE==='undefined')return;
const ON=/[?&]casa=caja\b/.test(location.search),V='4',BASE='modelos/casona/',VP='5',Q=k=>new RegExp('[?&]'+k+'=caja\\b').test(location.search),HB={cm1:Q('sm')?null:['sm','2','webp'],c0:Q('pb')?null:['pb',VP,'webp'],c1:Q('pa')?null:['pa','3','webp']};
const NV={cm1:'nm1',c0:'n0',c1:'n1',c2:'n2'},PISO={};Object.keys(NV).forEach(k=>PISO[NV[k]]=k);
const FEL={c:['#2f9a62','#0f4a2d'],t:['#3d84cc','#123a68'],k:['#a8343f','#4a1218'],f:['#b9ad90','#6e6450']};
const FS={};

function piso(id){if(FS[id])return FS[id];const H=window.CASA3D;if(!H||!window.CGLB||!window.MARC)return null;
 const S=new THREE.Scene(),TB=[],OB=[],hits=[],WL=[],links=[],LIN=[];
 S.background=new THREE.Color(id==='cm1'?0x1a1512:0xbcd3e0);
 S.add(new THREE.HemisphereLight(0xfff4e0,0x8a7a6a,id==='cm1'?1.3:1.7));const L=new THREE.DirectionalLight(0xffffff,id==='cm1'?.6:1.4);L.position.set(-10,20,12);S.add(L);
 const sp={x:0,z:0},se={x:0,z:0,ok:0},bx=[-17.6,17.6,-12.6,16.6];
 const hb=!!(HB[id]&&window.CMAT)&&HB[id];
 const F={id,SC:S,TB,OB,hits,links,WL,bx,k:1,ext:id!=='cm1',spawn:from=>from in NV&&se.ok?{x:se.x,z:se.z,yaw:Math.PI/2}:{x:sp.x,z:sp.z,yaw:-Math.PI/2},step:()=>{const c=H.cam&&H.cam(),p=H.yo&&H.yo();MARC.corte(LIN,c,p);
  if(F.copas)CMAT.paso(F.copas,p,c);if(F.sot)F.sot.step();if(F.gata){const n=performance.now();GATA.paso(F.gata,n,Math.min(50,n-(F.tg||n)));F.tg=n}}};
 F.cb=[bx[0]-.4,bx[1]+.4,bx[2]-.4,bx[3]+.4];
 const MAT={},mat=m=>{const n=(m&&m.name)||'x';return MAT[n]||(MAT[n]=new THREE.MeshLambertMaterial({color:m&&m.color?m.color.clone():0xcccccc}))};
 let ok;F.listo=new Promise(r=>ok=r);
 CGLB.cargador().then(Ld=>Ld.loadAsync(BASE+(hb?hb[0]+'.glb?v='+hb[1]:NV[id]+'.glb?v='+V))).then(gl=>{const R=gl.scene;S.add(R);
  if(hb){CMAT.aplicar(R,BASE+hb[0]+'_luz.'+hb[2]+'?v='+hb[1]);F.copas=CMAT.copas(R)}else R.traverse(o=>{if(o.isMesh)o.material=mat(o.material)});
  const D=MARC.leer(R);
  WL.push(...D.WL);OB.push(...D.OB);LIN.push(...D.lineas);
  if(D.llegada){sp.x=D.llegada.x;sp.z=D.llegada.z}
  if(D.llegadaEsc)Object.assign(se,{x:D.llegadaEsc.x,z:D.llegadaEsc.z,ok:1});
  D.planos.forEach(p=>plano(H,S,hits,p,id,D));
  if(hb&&id==='cm1'&&window.SOTC)try{F.sot=SOTC.pon(F,R,D,H)}catch(er){console.error('[SOTC]',er)}
  if(D.caja){const c=D.caja;bx.splice(0,4,c[0]+.4,c[1]-.4,c[2]+.4,c[3]-.4);F.cb.splice(0,4,...c)}
  for(const k of ['sube','baja']){const e=D.escaleras[k],to=e&&PISO[e.to];if(!to)continue;
   const l={x:e.x,z:e.z,r:e.r,ax:e.ax,az:e.az,to};links.push(l);
   D.escalones[k].forEach(o=>{o.userData.hit={t:'link',l};hits.push(o)})}
  D.mesas.forEach(m=>{const fe=FEL[m.fam]||FEL.k;if(F.sot&&F.sot.hechas[m.g])return;
   if(typeof GM!=='undefined'&&GM[m.g]){const t={g:m.g,x:m.x,z:m.z,r:2.2,felt:fe};TB.push(t);H.mesa(t,S,hits,OB)}
   else muestra(H,S,OB,m.g,m.x,m.z,fe)});
  if(hb&&id==='c0')gata(H,S,hits,R,D,F);
  F.marcas=D;CAJA.listos[id]=true;ok()}).catch(err=>{console.warn('CAJA',err);ok()});
 return FS[id]=F}

// la gata de la casona: sale del empty gata_n0 (ry en extras) y pasea por el patio (el piso de laja) sin chocar con columnas ni mesas
function gata(H,S,hits,R,D,F){const g=R.getObjectByName('gata_n0'),pl=R.getObjectByName('pb_piso_laja');if(!g||!pl||!window.GATA||!GATA.nueva)return;
 const p=new THREE.Vector3(),b=new THREE.Box3().setFromObject(pl);g.getWorldPosition(p);const box=[b.min.x+.5,b.max.x-.5,b.min.z+.5,b.max.z-.5];
 const en=(x,z)=>x>box[0]-1.5&&x<box[1]+1.5&&z>box[2]-1.5&&z<box[3]+1.5;
 const obs=D.OB.filter(o=>en(o.x,o.z)).map(o=>[o.x,o.z,o.r]).concat(D.mesas.filter(m=>en(m.x,m.z)).map(m=>[m.x,m.z,3.4]));
 F.gata=GATA.nueva({SC:S,std:H.std,hits},{x:p.x,z:p.z,ry:+(g.userData.ry||0),box,obs})}

// plano enmarcado en el muro: la planta de este nivel dibujada desde el GLB (muros de choque, mesas por familia, "estás aquí")
// y la pila de los 4 niveles con el actual marcado. Tocarlo abre "Ir a" (CIR). Mira hacia su +z local girado ry.
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
window.CAJA={on:ON,NV,listos:{},piso,M};
if(ON)setTimeout(arranque,600);
})();
