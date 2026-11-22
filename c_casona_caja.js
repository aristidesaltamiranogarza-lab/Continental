// c_casona_caja.js — CAJA: maqueta de cajas de la casona (CASONA.md pasos 1–2). Solo con ?casa=caja.
// Cada nivel es un piso de c_casa3d.js (cm1, c0, c1, c2) armado desde modelos/casona/<nivel>.glb (blender/casona.py).
// Todo lo que se toca sale del GLB vía MARC (c_casa_marcas.js): mesas (mesa real si el juego existe, si no una de muestra),
// choques, llegada, límites y las escaleras (sube/baja, destino en el extra to) como portales. Corte con MARC.corte.
// La planta baja ya es la detallada y horneada (pasos 3a/3b: modelos/casona/pb.glb, materiales en CMAT, gata en gata_n0);
// con ?pb=caja vuelve a la maqueta de cajas.
(function(){
if(typeof THREE==='undefined')return;
const ON=/[?&]casa=caja\b/.test(location.search),V='2',BASE='modelos/casona/',PB=!/[?&]pb=caja\b/.test(location.search),VP='1';
const NV={cm1:'nm1',c0:'n0',c1:'n1',c2:'n2'},PISO={};Object.keys(NV).forEach(k=>PISO[NV[k]]=k);
const FEL={c:['#2f9a62','#0f4a2d'],t:['#3d84cc','#123a68'],k:['#a8343f','#4a1218'],f:['#b9ad90','#6e6450']};
const FS={};

function piso(id){if(FS[id])return FS[id];const H=window.CASA3D;if(!H||!window.CGLB||!window.MARC)return null;
 const S=new THREE.Scene(),TB=[],OB=[],hits=[],WL=[],links=[],LIN=[];
 S.background=new THREE.Color(id==='cm1'?0x1a1512:0xbcd3e0);
 S.add(new THREE.HemisphereLight(0xfff4e0,0x8a7a6a,id==='cm1'?1.3:1.7));const L=new THREE.DirectionalLight(0xffffff,id==='cm1'?.6:1.4);L.position.set(-10,20,12);S.add(L);
 const sp={x:0,z:0},bx=[-17.6,17.6,-12.6,16.6];
 const hb=id==='c0'&&PB&&!!window.CMAT;
 const F={id,SC:S,TB,OB,hits,links,WL,bx,k:1,ext:id!=='cm1',spawn:()=>({x:sp.x,z:sp.z,yaw:-Math.PI/2}),step:()=>{const c=H.cam&&H.cam(),p=H.yo&&H.yo();MARC.corte(LIN,c,p);
  if(F.copas)CMAT.paso(F.copas,p,c);if(F.gata){const n=performance.now();GATA.paso(F.gata,n,Math.min(50,n-(F.tg||n)));F.tg=n}}};
 F.cb=[bx[0]-.4,bx[1]+.4,bx[2]-.4,bx[3]+.4];
 const MAT={},mat=m=>{const n=(m&&m.name)||'x';return MAT[n]||(MAT[n]=new THREE.MeshLambertMaterial({color:m&&m.color?m.color.clone():0xcccccc}))};
 CGLB.cargador().then(Ld=>Ld.loadAsync(BASE+(hb?'pb.glb?v='+VP:NV[id]+'.glb?v='+V))).then(gl=>{const R=gl.scene;S.add(R);
  if(hb){CMAT.aplicar(R,BASE+'pb_luz.jpg?v='+VP);F.copas=CMAT.copas(R)}else R.traverse(o=>{if(o.isMesh)o.material=mat(o.material)});
  const D=MARC.leer(R);
  WL.push(...D.WL);OB.push(...D.OB);LIN.push(...D.lineas);
  if(D.llegada){sp.x=D.llegada.x;sp.z=D.llegada.z}
  if(D.caja){const c=D.caja;bx.splice(0,4,c[0]+.4,c[1]-.4,c[2]+.4,c[3]-.4);F.cb.splice(0,4,...c)}
  for(const k of ['sube','baja']){const e=D.escaleras[k],to=e&&PISO[e.to];if(!to)continue;
   const l={x:e.x,z:e.z,r:e.r,ax:e.ax,az:e.az,to};links.push(l);
   D.escalones[k].forEach(o=>{o.userData.hit={t:'link',l};hits.push(o)})}
  D.mesas.forEach(m=>{const fe=FEL[m.fam]||FEL.k;
   if(typeof GM!=='undefined'&&GM[m.g]){const t={g:m.g,x:m.x,z:m.z,r:2.2,felt:fe};TB.push(t);H.mesa(t,S,hits,OB)}
   else muestra(H,S,OB,m.g,m.x,m.z,fe)});
  if(hb)gata(H,S,hits,R,D,F);
  F.marcas=D;CAJA.listos[id]=true}).catch(err=>console.warn('CAJA',err));
 return FS[id]=F}

// la gata de la casona: sale del empty gata_n0 (ry en extras) y pasea por el patio (el piso de laja) sin chocar con columnas ni mesas
function gata(H,S,hits,R,D,F){const g=R.getObjectByName('gata_n0'),pl=R.getObjectByName('pb_piso_laja');if(!g||!pl||!window.GATA||!GATA.nueva)return;
 const p=new THREE.Vector3(),b=new THREE.Box3().setFromObject(pl);g.getWorldPosition(p);const box=[b.min.x+.5,b.max.x-.5,b.min.z+.5,b.max.z-.5];
 const en=(x,z)=>x>box[0]-1.5&&x<box[1]+1.5&&z>box[2]-1.5&&z<box[3]+1.5;
 const obs=D.OB.filter(o=>en(o.x,o.z)).map(o=>[o.x,o.z,o.r]).concat(D.mesas.filter(m=>en(m.x,m.z)).map(m=>[m.x,m.z,3.4]));
 F.gata=GATA.nueva({SC:S,std:H.std,hits},{x:p.x,z:p.z,ry:+(g.userData.ry||0),box,obs})}

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
