// c_casona_fuera.js — CFUE: la casona entera vista desde fuera. Cada nivel es su propia escena (CAJA); aquí se le ponen encima/debajo
// los otros niveles sobre el suelo (pb, pa, az) como copias solo para ver (sin mesas ni choques), a su altura real.
// Abajo: se ven con la cámara fuera de la casa (y el nivel activo esconde sus piezas *_abajo*, que son lo mismo). Arriba: solo con tu Mii fuera
// (dentro serían un techo encima). En la planta baja reemplaza al casco de cajas (CCAS) en cuanto cargan. Los GLB se cargan la primera vez que hacen falta.
(function(){
if(typeof THREE==='undefined')return;
const BASE='modelos/casona/',GL={c0:['pb','6'],c1:['pa','5'],c2:['az','1']},Y={c0:0,c1:5.8,c2:10.3},ORDEN=['c0','c1','c2'];
const R={},P={};
// entre la planta baja (muros hasta 5.5) y la alta (piso en 5.8) nadie modeló el canto de la losa por fuera: franja de muro y cornisa de cantera
function losa(){if(!window.LOTE)return null;const L=LOTE(),h=.15,y0=5.45,y1=5.85,b=(x0,x1,z0,z1,a,c,k)=>L.box(x1-x0,c-a,z1-z0,k,(x0+x1)/2,(a+c)/2,(z0+z1)/2);
 const MU=0xe6b89c;b(-18-h,18+h,17-h,17+h-.01,y0,y1,MU);b(-18-h,18+h,-13-h,-13+h,y0,y1,MU);b(-18-h,-18+h,-13,17,y0,y1,MU);b(18-h,18+h,-13,17,y0,y1,MU);   // el contorno
 b(-18.3,18.3,17.1,17.38,5.4,5.9,0xe7dac4);b(-18.3,-18.1,-13.2,17.38,5.4,5.9,0xe7dac4);b(18.1,18.3,-13.2,17.38,5.4,5.9,0xe7dac4);
 const m=new THREE.MeshLambertMaterial();return L.mesh(window.CCALLE?CCALLE.tinte(m):m)}
// con tu Mii fuera no se ven los letreros de las mesas (se asomaban a través de los muros)
let tF=0;const st=document.createElement('style');st.textContent='body.cfue-fuera .h3sign{visibility:hidden!important}';document.head.appendChild(st);
setInterval(()=>{if(performance.now()-tF>400)document.body.classList.remove('cfue-fuera')},500);
function carga(id){if(P[id])return P[id];const g=GL[id];
 return P[id]=CGLB.cargador().then(Ld=>Ld.loadAsync(BASE+g[0]+'.glb?v='+g[1])).then(gl=>{const r=gl.scene;
  if(window.CMAT)CMAT.aplicar(r,BASE+g[0]+'_luz.webp?v='+g[1]);if(window.CAJA&&CAJA.juntas)CAJA.juntas(r);
  const fuera=[];r.traverse(o=>{if(/_abajo|_piso_calle$|^gata_|^accion_|^plano_/.test(o.name))fuera.push(o)});fuera.forEach(o=>o.visible=false);
  return R[id]=r}).catch(e=>{console.warn('CFUE',id,e);return null})}
function pon(F){const id=F.id;if(!(id in Y)||!window.CGLB)return null;
 const AB=[];F.SC.traverse(o=>{if(/_abajo/.test(o.name)&&o.visible)AB.push(o)});
 const capas=ORDEN.filter(k=>k!==id).map(k=>({k,arriba:Y[k]>Y[id],G:null,pedido:0}));
 const fuera=(x,z)=>x<-18.2||x>18.2||z>17.1||z<-13.2;
 let LS=null;
 function paso(c,p){let abajo=false,arriba=false;
  const cf=c&&fuera(c.position.x,c.position.z),pf=p&&fuera(p.x,p.z);
  capas.forEach(L=>{const ver=L.arriba?!!(pf&&cf):!!cf;
   if(ver&&!L.G){if(!L.pedido){L.pedido=1;carga(L.k).then(r=>{if(!r)return;L.G=r.clone();L.G.position.y=Y[L.k]-Y[id];L.G.visible=false;L.G.name='casona-fuera-'+L.k;F.SC.add(L.G)})}return}
   if(L.G){L.G.visible=ver;if(ver){if(L.arriba)arriba=true;else abajo=true}}});
  if(pf){tF=performance.now();document.body.classList.add('cfue-fuera')}
  if((abajo||arriba)&&!LS&&(LS=losa()||1)!==1){LS.position.y=-Y[id];F.SC.add(LS)}if(LS&&LS!==1)LS.visible=abajo||arriba;
  AB.forEach(o=>o.visible=!abajo);
  if(arriba&&F.casco)F.casco.M.visible=false}
 return {paso}}
window.CFUE={pon};
})();
