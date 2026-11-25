// c_casona_fuera.js — CFUE: la casona entera vista desde fuera. Cada nivel es su propia escena (CAJA); aquí se le ponen encima/debajo
// los otros niveles sobre el suelo (pb, pa, az) como copias solo para ver (sin mesas ni choques), a su altura real.
// Cuándo se ve cada una: la regla única de paso() (CASONA.md R14). El nivel activo esconde sus piezas *_abajo* (lo mismo, ligero) cuando la copia
// de abajo ya se ve completa. En la planta baja reemplaza al casco de cajas (CCAS) en cuanto cargan. Los GLB se cargan la primera vez que hacen falta.
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
function pon(F){const id=F.id,nv=id in Y;if(!window.CGLB)return null;   // el sótano (sin copias) solo usa la regla del cubo de la escalera
 const AB=[],AR=[];F.SC.traverse(o=>{if(/_abajo/.test(o.name)&&o.visible)AB.push(o);if(/_escalera_arriba/.test(o.name))AR.push(o)});   // _arriba: el cubo de la escalera de arriba visto por el hueco
 const capas=!nv?[]:ORDEN.filter(k=>k!==id).map(k=>({k,arriba:Y[k]>Y[id],G:null,pedido:0}));
 const zf=id==='c0'?-17.2:-13.2,fuera=(x,z,m)=>x<-18.2-m||x>18.2+m||z>17.1+m||z<zf-m;   // la planta baja llega a z 34 del plano (cuarto libre, servicio, corredor norte); las de arriba a 30
 // Regla única (CASONA.md R14): ABAJO (desde la planta alta y la azotea) siempre la copia real: jardín, patio y calle, no las piezas *_abajo*.
 // ARRIBA: se ve si tu Mii y la cámara están fuera de la casa, o si la cámara está debajo de su piso (primera persona, zoom muy cerca: es el techo).
 // Con la cámara alta adentro, nunca (tapaba a tu Mii). Si un nivel no se ve, los de encima tampoco. Al cambiar se disuelve (PATV.ver).
 let cf=false,yAR=null,bAR=false;const bajo={};
 function paso(c,p){let abajo=false,arriba=false,corte=false,quiere=null;
  if(c)cf=fuera(c.position.x,c.position.z,cf?-.6:.6);   // histéresis: entrar o salir .6 m para cambiar
  const pf=nv&&!!p&&fuera(p.x,p.z,0),afuera=pf&&cf;
  capas.forEach(L=>{let ver=true;
   if(L.arriba){const y=Y[L.k]-Y[id],cy=c?c.position.y:0;bajo[L.k]=cy<y-(bajo[L.k]?.2:.8);   // histéresis en altura
    ver=!corte&&(afuera||bajo[L.k]);if(!ver)corte=true;if(quiere==null)quiere=ver;
    if(window.PATV&&PATV.suelo)PATV.suelo(L.k,afuera?-1e9:y-.31)}   // dentro: lo que cuelga bajo su piso se encimaba con el techo de abajo
   if(ver&&!L.G){if(!L.pedido){L.pedido=1;carga(L.k).then(r=>{if(!r)return;L.G=window.JUNTA?JUNTA.de(r):r.clone();   // copia juntada por material (menos llamadas de dibujo)
   L.G.position.y=Y[L.k]-Y[id];L.G.visible=false;L.G.name='casona-fuera-'+L.k;F.SC.add(L.G)})}return}
   if(!L.G)return;const v=window.PATV&&PATV.ver?PATV.ver(L.k,L.G,ver):+(L.G.visible=ver);
   if(L.arriba){if(v>0)arriba=true}else if(v>=1)abajo=true});
  if(pf){tF=performance.now();document.body.classList.add('cfue-fuera')}
  AB.forEach(o=>o.visible=!abajo);
  if(yAR==null){yAR=1e9;AR.forEach(o=>{const b=new THREE.Box3().setFromObject(o,false);if(!b.isEmpty())yAR=Math.min(yAR,b.min.y)})}
  if(quiere==null){bAR=!!c&&c.position.y<yAR-(bAR?.2:.8);quiere=bAR}   // sin copia de arriba (sótano): el cubo solo con la cámara debajo de él
  const sinAR=arriba||!quiere;   // el cubo de la escalera de arriba es de arriba: solo mientras su copia carga
  AR.forEach(o=>{if(window.VIS)VIS.poner(o,'cfue',sinAR);else o.visible=!sinAR});
  if(F.casco&&capas.some(L=>L.arriba&&L.G))F.casco.M.visible=false}   // con las copias cargadas, ellas mandan (el casco era su versión ligera)
 return {paso}}
window.CFUE={pon};
})();
