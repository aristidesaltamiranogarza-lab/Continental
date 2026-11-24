// c_casona_fuera.js — CFUE: la casona entera vista desde fuera. Cada nivel es su propia escena (CAJA); aquí se le ponen encima/debajo
// los otros niveles sobre el suelo (pb, pa, az) como copias solo para ver (sin mesas ni choques), a su altura real.
// Abajo: se ven con la cámara fuera de la casa (y el nivel activo esconde sus piezas *_abajo*, que son lo mismo). Arriba: solo con tu Mii fuera
// (dentro serían un techo encima). En la planta baja reemplaza al casco de cajas (CCAS) en cuanto cargan. Los GLB se cargan la primera vez que hacen falta.
(function(){
if(typeof THREE==='undefined')return;
const BASE='modelos/casona/',GL={c0:['pb','7'],c1:['pa','6'],c2:['az','2']},Y={c0:0,c1:5.8,c2:10.3},ORDEN=['c0','c1','c2'];
const R={},P={};
// entre la planta baja (muros hasta 5.5) y la alta (piso en 5.8), en los GLB sin entrepiso (antes de hornear R3): franja de muro y cornisa de cantera
// y lo mismo entre la planta alta (muros hasta 10.0) y la azotea (piso en 10.3)
function losa(y0,y1){if(!window.LOTE)return null;const L=LOTE(),h=.15,b=(x0,x1,z0,z1,a,c,k)=>L.box(x1-x0,c-a,z1-z0,k,(x0+x1)/2,(a+c)/2,(z0+z1)/2);
 const MU=0xe6b89c,CA=0xe7dac4;{
  b(-18-h,18+h,17-h,17+h-.01,y0,y1,MU);b(-18-h,18+h,-13-h,-13+h,y0,y1,MU);b(-18-h,-18+h,-13,17,y0,y1,MU);b(18-h,18+h,-13,17,y0,y1,MU);   // el contorno
  b(-18.3,18.3,17.1,17.38,y0-.05,y1+.05,CA);b(-18.3,-18.1,-13.2,17.38,y0-.05,y1+.05,CA);b(18.1,18.3,-13.2,17.38,y0-.05,y1+.05,CA)}
 const m=new THREE.MeshLambertMaterial();return L.mesh(window.CCALLE?CCALLE.tinte(m):m)}
// con tu Mii fuera no se ven los letreros de las mesas (se asomaban a través de los muros)
let tF=0;const st=document.createElement('style');st.textContent='body.cfue-fuera .h3sign{visibility:hidden!important}';document.head.appendChild(st);
setInterval(()=>{if(performance.now()-tF>400)document.body.classList.remove('cfue-fuera')},500);
function carga(id){if(P[id])return P[id];const g=GL[id];
 return P[id]=CGLB.cargador().then(Ld=>Ld.loadAsync(BASE+g[0]+'.glb?v='+g[1])).then(gl=>{const r=gl.scene;
  if(window.CMAT)CMAT.aplicar(r,BASE+g[0]+'_luz.webp?v='+g[1]);if(window.CAJA&&CAJA.juntas)CAJA.juntas(r);
  const fuera=[],cg=window.CCALLE&&CCALLE.glb&&CCALLE.glb();r.traverse(o=>{if(cg&&/_piso_calle$/.test(o.name)){o.position.y-=.35;o.updateMatrix();return}if(/_abajo|_arriba|_piso_calle$|^gata_|^accion_|^plano_/.test(o.name))fuera.push(o)});fuera.forEach(o=>o.visible=false);
  return R[id]=r}).catch(e=>{console.warn('CFUE',id,e);return null})}
function pon(F){const id=F.id;if(!(id in Y)||!window.CGLB)return null;
 const AB=[],AR=[];F.SC.traverse(o=>{if(/_abajo/.test(o.name)&&o.visible)AB.push(o);if(/_escalera_arriba/.test(o.name))AR.push(o)});   // _arriba: el cubo de la escalera de arriba visto por el hueco
 const capas=ORDEN.filter(k=>k!==id).map(k=>({k,arriba:Y[k]>Y[id],G:null,pedido:0}));
 const fuera=(x,z)=>x<-18.2||x>18.2||z>17.1||z<-13.2;
 const BAN=[{a:'c0',b:'c1',y:[5.45,5.85],M:null},{a:'c1',b:'c2',y:[9.95,10.35],M:null}];   // cada franja se ve si se dibujan los dos niveles que junta
 // R3: casona_pa/az.py ya modelan el canto (pa_entrepiso, az_entrepiso); la franja de código queda solo para los GLB viejos
 const EP={c1:'pa_entrepiso',c2:'az_entrepiso'},HE={},hecho=k=>{if(k in HE)return HE[k];const r=k===id?F.SC:R[k];if(!r)return false;const n=EP[k],pre=n.slice(0,3);let ya=false,hay=false;
  r.traverse(o=>{if(o.name===n)hay=true;else if(o.name.startsWith(pre))ya=true});if(ya||hay)HE[k]=hay;return hay};   // se recuerda cuando ya cargó ese GLB
 function paso(c,p){let abajo=false,arriba=false;
  const cf=c&&fuera(c.position.x,c.position.z),pf=p&&fuera(p.x,p.z);
  capas.forEach(L=>{const ver=L.arriba?!!(pf&&cf):!!cf;
   if(ver&&!L.G){if(!L.pedido){L.pedido=1;carga(L.k).then(r=>{if(!r)return;L.G=r.clone();L.G.position.y=Y[L.k]-Y[id];L.G.visible=false;L.G.name='casona-fuera-'+L.k;F.SC.add(L.G)})}return}
   if(L.G){L.G.visible=ver;if(ver){if(L.arriba)arriba=true;else abajo=true}}});
  if(pf){tF=performance.now();document.body.classList.add('cfue-fuera')}
  const dib=k=>k===id||capas.some(L=>L.k===k&&L.G&&L.G.visible);
  BAN.forEach(B=>{const v=dib(B.a)&&dib(B.b)&&!hecho(B.b);if(v&&!B.M&&(B.M=losa(...B.y)||1)!==1){B.M.userData.cfue=1;B.M.position.y=-Y[id];F.SC.add(B.M)}if(B.M&&B.M!==1)B.M.visible=v});
  AB.forEach(o=>o.visible=!abajo);
  AR.forEach(o=>{if(window.VIS)VIS.poner(o,'cfue',arriba);else o.visible=!arriba});
  if(arriba&&F.casco)F.casco.M.visible=false}
 return {paso}}
window.CFUE={pon};
})();
