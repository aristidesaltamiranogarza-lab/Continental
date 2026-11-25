// c_casona_fuera.js — CFUE: la casona entera vista desde fuera. Cada nivel es su propia escena (CAJA); aquí se le ponen encima/debajo
// los otros niveles sobre el suelo (pb, pa, az) como copias solo para ver (sin mesas ni choques), a su altura real.
// Abajo: se ven con la cámara fuera de la casa (y el nivel activo esconde sus piezas *_abajo*, que son lo mismo). Arriba: solo con tu Mii fuera
// (dentro serían un techo encima). En la planta baja reemplaza al casco de cajas (CCAS) en cuanto cargan. Los GLB se cargan la primera vez que hacen falta.
(function(){
if(typeof THREE==='undefined')return;
const BASE='modelos/casona/',CRU=/[?&]crudo\b/.test(location.search),GL={c0:['pb','9'],c1:['pa','8'],c2:['az','4']},Y={c0:0,c1:5.8,c2:10.3},ORDEN=['c0','c1','c2'];
const R={},P={};
// con tu Mii fuera no se ven los letreros de las mesas (se asomaban a través de los muros)
let tF=0;const st=document.createElement('style');st.textContent='body.cfue-fuera .h3sign{visibility:hidden!important}';document.head.appendChild(st);
setInterval(()=>{if(performance.now()-tF>400)document.body.classList.remove('cfue-fuera')},500);
function carga(id){if(P[id])return P[id];const g=GL[id];
 return P[id]=CGLB.cargador().then(Ld=>Ld.loadAsync(BASE+(CRU?'crudo/'+g[0]+'.glb?v=c'+Date.now():g[0]+'.glb?v='+g[1]))).then(gl=>{const r=gl.scene;
  if(window.CMAT)CMAT.aplicar(r,CRU?null:BASE+g[0]+'_luz.webp?v='+g[1]);if(window.CAJA&&CAJA.juntas)CAJA.juntas(r);if(window.PATV)PATV.vestir(r,id);
  const fuera=[],cg=window.CCALLE&&CCALLE.glb&&CCALLE.glb();r.traverse(o=>{if(cg&&/_piso_calle$/.test(o.name)){o.position.y-=.35;o.updateMatrix();return}if(/_abajo|_arriba|_piso_calle$|^gata_|^accion_|^plano_/.test(o.name))fuera.push(o)});fuera.forEach(o=>o.visible=false);
  return R[id]=r}).catch(e=>{console.warn('CFUE',id,e);return null})}
function pon(F){const id=F.id;if(!(id in Y)||!window.CGLB)return null;
 const AB=[],AR=[];F.SC.traverse(o=>{if(/_abajo/.test(o.name)&&o.visible)AB.push(o);if(/_escalera_arriba/.test(o.name))AR.push(o)});   // _arriba: el cubo de la escalera de arriba visto por el hueco
 const capas=ORDEN.filter(k=>k!==id).map(k=>({k,arriba:Y[k]>Y[id],G:null,pedido:0}));
 const fuera=(x,z)=>x<-18.2||x>18.2||z>17.1||z<-13.2;
 function paso(c,p){let abajo=false,arriba=false;
  const cf=c&&fuera(c.position.x,c.position.z),pf=p&&fuera(p.x,p.z);
  const pat=!pf&&!!window.PATV&&PATV.dentro(p);   // desde el patio y sus corredores siempre se ven los de arriba (PATV corta el lado de la cámara)
  capas.forEach(L=>{const ver=L.arriba?!!(pf&&cf)||pat:!!cf;if(L.arriba&&window.PATV)PATV.paso(L.k,Y[L.k]-Y[id],c,p,pat);
   if(ver&&!L.G){if(!L.pedido){L.pedido=1;carga(L.k).then(r=>{if(!r)return;L.G=r.clone();L.G.position.y=Y[L.k]-Y[id];L.G.visible=false;L.G.name='casona-fuera-'+L.k;F.SC.add(L.G)})}return}
   if(L.G){L.G.visible=ver;if(ver){if(L.arriba)arriba=true;else abajo=true}}});
  if(pf){tF=performance.now();document.body.classList.add('cfue-fuera')}
  AB.forEach(o=>o.visible=!abajo);
  AR.forEach(o=>{if(window.VIS)VIS.poner(o,'cfue',arriba);else o.visible=!arriba});
  if(arriba&&F.casco)F.casco.M.visible=false}
 return {paso}}
window.CFUE={pon};
})();
