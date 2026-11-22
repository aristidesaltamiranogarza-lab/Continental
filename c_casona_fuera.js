// c_casona_fuera.js — CFUE: la casona entera vista desde fuera. Cada nivel es su propia escena (CAJA); aquí se le ponen encima/debajo
// los otros niveles sobre el suelo (pb, pa, az) como copias solo para ver (sin mesas ni choques), a su altura real.
// Abajo: se ven con la cámara fuera de la casa (y el nivel activo esconde sus piezas *_abajo*, que son lo mismo). Arriba: solo con tu Mii fuera
// (dentro serían un techo encima). En la planta baja reemplaza al casco de cajas (CCAS) en cuanto cargan. Los GLB se cargan la primera vez que hacen falta.
(function(){
if(typeof THREE==='undefined')return;
const BASE='modelos/casona/',GL={c0:['pb','6'],c1:['pa','5'],c2:['az','1']},Y={c0:0,c1:5.8,c2:10.3},ORDEN=['c0','c1','c2'];
const R={},P={};
function carga(id){if(P[id])return P[id];const g=GL[id];
 return P[id]=CGLB.cargador().then(Ld=>Ld.loadAsync(BASE+g[0]+'.glb?v='+g[1])).then(gl=>{const r=gl.scene;
  if(window.CMAT)CMAT.aplicar(r,BASE+g[0]+'_luz.webp?v='+g[1]);if(window.CAJA&&CAJA.juntas)CAJA.juntas(r);
  const fuera=[];r.traverse(o=>{if(/_abajo|_piso_calle$|^gata_|^accion_|^plano_/.test(o.name))fuera.push(o)});fuera.forEach(o=>o.visible=false);
  return R[id]=r}).catch(e=>{console.warn('CFUE',id,e);return null})}
function pon(F){const id=F.id;if(!(id in Y)||!window.CGLB)return null;
 const AB=[];F.SC.traverse(o=>{if(/_abajo/.test(o.name)&&o.visible)AB.push(o)});
 const capas=ORDEN.filter(k=>k!==id).map(k=>({k,arriba:Y[k]>Y[id],G:null,pedido:0}));
 const fuera=(x,z)=>x<-18.2||x>18.2||z>17.1||z<-13.2;
 function paso(c,p){let abajo=false,arriba=false;
  const cf=c&&fuera(c.position.x,c.position.z),pf=p&&fuera(p.x,p.z);
  capas.forEach(L=>{const ver=L.arriba?!!(pf&&cf):!!cf;
   if(ver&&!L.G){if(!L.pedido){L.pedido=1;carga(L.k).then(r=>{if(!r)return;L.G=r.clone();L.G.position.y=Y[L.k]-Y[id];L.G.visible=false;L.G.name='casona-fuera-'+L.k;F.SC.add(L.G)})}return}
   if(L.G){L.G.visible=ver;if(ver){if(L.arriba)arriba=true;else abajo=true}}});
  AB.forEach(o=>o.visible=!abajo);
  if(arriba&&F.casco)F.casco.M.visible=false}
 return {paso}}
window.CFUE={pon};
})();
