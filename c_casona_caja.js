// c_casona_caja.js — CAJA: maqueta de cajas de la casona (paso 1 de CASONA.md). Solo con ?casa=caja.
// Cada nivel es un piso de c_casa3d.js (cm1, c0, c1, c2) armado desde modelos/casona/<nivel>.glb (blender/casona.py).
// Del GLB salen las mesas (empties mesa_<juego>; mesa real si el juego existe, si no una de muestra), los choques
// (extras seg/r de muros y barandales; r de columnas y bultos), la llegada y las dos escaleras (sube/baja) como portales.
// Corte: se esconde cada línea de muro que cruce entre la cámara y tu personaje.
(function(){
if(typeof THREE==='undefined')return;
const ON=/[?&]casa=caja\b/.test(location.search),V='1',BASE='modelos/casona/';
const NV={cm1:{f:'nm1',sube:'c0',baja:null},c0:{f:'n0',sube:'c1',baja:'cm1'},c1:{f:'n1',sube:'c2',baja:'c0'},c2:{f:'n2',sube:null,baja:'c1'}};
const FEL={c:['#2f9a62','#0f4a2d'],t:['#3d84cc','#123a68'],k:['#a8343f','#4a1218'],f:['#b9ad90','#6e6450']};
const FAM={continental:'c',uno:'c',monopolydeal:'c',rummy:'c',merida:'t',haciendas:'t',backgammon:'t',conecta4:'t',domino:'f',loteria:'f'};
const X=x=>x-18,Z=z=>17-z,LLEGA={x:X(4),z:Z(11.1)};
const FS={};

function piso(id){if(FS[id])return FS[id];const H=window.CASA3D;if(!H||!window.CGLB)return null;const N=NV[id];
 const S=new THREE.Scene(),TB=[],OB=[],hits=[],WL=[],links=[],LIN=[];
 S.background=new THREE.Color(id==='cm1'?0x1a1512:0xbcd3e0);
 S.add(new THREE.HemisphereLight(0xfff4e0,0x8a7a6a,id==='cm1'?1.3:1.7));const L=new THREE.DirectionalLight(0xffffff,id==='cm1'?.6:1.4);L.position.set(-10,20,12);S.add(L);
 const lk=(k,to)=>{if(!to)return null;const z=k==='sube'?Z(13.1):Z(14.9),l={x:X(6.7),z,r:1,ax:X(7.4),az:z,to};links.push(l);return l};
 const LS={sube:lk('sube',N.sube),baja:lk('baja',N.baja)};
 const sp={...LLEGA};
 const F={id,SC:S,TB,OB,hits,links,WL,bx:[X(0)+.4,X(36)-.4,(id==='c0'?Z(48):Z(30))+.4,(id==='c0'?Z(-3):id==='c1'?Z(-1.3):Z(0))-.4],k:1,ext:id!=='cm1',
  spawn:()=>({x:sp.x,z:sp.z,yaw:-Math.PI/2}),step:()=>corte(LIN)};
 F.cb=[X(0),X(36),F.bx[2]-.4,F.bx[3]+.4];
 const MAT={},mat=m=>{const n=(m&&m.name)||'x';return MAT[n]||(MAT[n]=new THREE.MeshLambertMaterial({color:m&&m.color?m.color.clone():0xcccccc}))};
 CGLB.cargador().then(Ld=>Ld.loadAsync(BASE+N.f+'.glb?v='+V)).then(gl=>{const R=gl.scene;S.add(R);R.updateMatrixWorld(true);
  const lin={},e=[],w=new THREE.Vector3(),bb=new THREE.Box3();
  R.traverse(o=>{const u=o.userData||{};
   if(o.isMesh){o.material=mat(o.material);
    if(u.seg)WL.push([...u.seg,u.r||.3]);else if(u.tipo==='obst'||u.tipo==='columna'){o.getWorldPosition(w);OB.push({x:w.x,z:w.z,r:u.r||.5})}
    if(/_(muro|dintel|antepecho)_/.test(o.name)){bb.setFromObject(o);const dx=bb.max.x-bb.min.x,dz=bb.max.z-bb.min.z,h=dx>dz;
     const k=(h?'h':'v')+(h?(bb.min.z+bb.max.z)/2:(bb.min.x+bb.max.x)/2).toFixed(1);const l=lin[k]||(lin[k]={h,c:+k.slice(1),a:1e9,b:-1e9,ms:[]});
     l.a=Math.min(l.a,h?bb.min.x:bb.min.z);l.b=Math.max(l.b,h?bb.max.x:bb.max.z);l.ms.push(o)}
    if(/_escalon_s/.test(o.name)&&LS.sube){o.userData.hit={t:'link',l:LS.sube};hits.push(o)}
    if(/_escalon_b/.test(o.name)&&LS.baja){o.userData.hit={t:'link',l:LS.baja};hits.push(o)}
   }else if(/^mesa_/.test(o.name))e.push(o);
   else if(/^llegada_/.test(o.name)){o.getWorldPosition(w);sp.x=w.x;sp.z=w.z}});
  LIN.push(...Object.values(lin));
  e.forEach(o=>{o.getWorldPosition(w);const g=o.userData.juego||o.name.slice(5),f=FAM[g]||'k';
   if(typeof GM!=='undefined'&&GM[g]){const t={g,x:w.x,z:w.z,r:2.2,felt:FEL[f]};TB.push(t);H.mesa(t,S,hits,OB)}
   else muestra(H,S,OB,g,w.x,w.z,FEL[o.userData.libre?'f':f])});
  CAJA.listos[id]=true}).catch(err=>console.warn('CAJA',err));
 return FS[id]=F}

// mesa de muestra para los juegos que aún no existen (o que viven en su propio cuarto: billar, casino, ruleta)
function muestra(H,S,OB,g,x,z,fe){const G=new THREE.Group();G.position.set(x,0,z);S.add(G);const wd=H.std(0x4a2814,.5),fl=H.std(new THREE.Color(fe[0]).getHex(),.9);
 if(g==='billar'){H.box(3,.3,5.6,fl,0,1.45,0,G);H.box(3.3,1.3,5.9,wd,0,.65,0,G);OB.push({x,z:z-1.4,r:2},{x,z:z+1.4,r:2});return}
 H.cyl(2.2,2.2,.12,fl,0,1.5,0,G,32);H.cyl(.35,.5,1.45,wd,0,.72,0,G,12);OB.push({x,z,r:2.7})}

// corte: líneas de muro que cruzan el segmento cámara→personaje
function cruza(l,cx,cz,px,pz){const a=l.h?cz:cx,b=l.h?pz:px;if((a-l.c)*(b-l.c)>0)return false;const t=(l.c-a)/((b-a)||1e-6),u=l.h?cx+(px-cx)*t:cz+(pz-cz)*t;return u>l.a-.5&&u<l.b+.5}
function corte(LIN){const H=window.CASA3D,c=H&&H.cam&&H.cam(),p=H&&H.yo&&H.yo();if(!c||!p)return;
 LIN.forEach(l=>{const v=!cruza(l,c.position.x,c.position.z,p.x,p.z);if(l.v!==v){l.v=v;l.ms.forEach(m=>m.visible=v)}})}

// al entrar a la casa con ?casa=caja, directo a la planta baja de la maqueta
function arranque(){const H=window.CASA3D;if(H&&H.on&&H.on()&&H.piso&&H.piso()==='pb'&&window.casaPiso){casaPiso('c0');return}setTimeout(arranque,400)}
const M={};Object.keys(NV).forEach(id=>{M[id]={ok:()=>ON&&!!(window.CASA3D&&CASA3D.mesa&&window.CGLB),piso:()=>piso(id)}});
window.CAJA={on:ON,NV,listos:{},piso,M};
if(ON)setTimeout(arranque,600);
})();
