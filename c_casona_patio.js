// c_casona_patio.js — PATV: corte de las copias de los niveles de arriba (CFUE las pone; se ven siempre).
// Con la cámara por encima del piso de ese nivel (seguimiento alto), la mitad del lado de la cámara se descarta en el shader
// (plano vertical que pasa A.m más allá de tu Mii hacia la cámara): queda el lado de enfrente y los lados, como un corte.
// Se cambia el material de las copias de CFUE (son solo suyas), sin materiales nuevos. Ajustes en PATV.A.
(function(){
if(typeof THREE==='undefined')return;
const A={x:10.2,z0:-17.2,z1:7.2,m:1};   // patio y corredores en coordenadas del juego (plano: x 8..28, z 10..34)
const P={value:new THREE.Vector3()},D={value:new THREE.Vector3(0,1,A.m)},U={};
const uni=k=>U[k]||(U[k]={value:0}),UY={},uy=k=>UY[k]||(UY[k]={value:-1e9});   // UY: debajo de esta y (mundo) no se dibuja la copia
const dentro=p=>!!p&&Math.abs(p.x)<A.x&&p.z>A.z0&&p.z<A.z1;
const VS='varying vec3 pcW;\n',FS='uniform float pcOn,pcY;uniform vec3 pcP,pcD;\nvarying vec3 pcW;\n',
 MAIN='if(pcW.y<pcY)discard;\nif(pcOn>0.&&dot(pcW.xz-pcP.xz,pcD.xy)>pcD.z)discard;\n';
const hechos=new WeakSet();
function vestir(root,k){const on=uni(k);root.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
 if(!m||hechos.has(m))return;hechos.add(m);const ob=m.onBeforeCompile,ck=m.customProgramCacheKey();
 m.customProgramCacheKey=()=>ck+'|pc';
 m.onBeforeCompile=(s,r)=>{if(ob&&ob!==THREE.Material.prototype.onBeforeCompile)ob.call(m,s,r);s.uniforms.pcOn=on;s.uniforms.pcY=uy(k);s.uniforms.pcP=P;s.uniforms.pcD=D;
  s.vertexShader=VS+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\npcW=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=FS+s.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,'$&\n'+MAIN)};
 m.needsUpdate=true})})}
// cada cuadro: k = nivel de la copia, y0 = su piso relativo a la escena, corta = si se aplica el corte
function paso(k,y0,cam,p,corta){const on=uni(k);on.value=corta&&cam&&p&&cam.position.y>y0?1:0;if(!on.value)return;
 const dx=cam.position.x-p.x,dz=cam.position.z-p.z,l=Math.hypot(dx,dz)||1;P.value.set(p.x,p.y,p.z);D.value.set(dx/l,dz/l,A.m)}
// suelo(k,y): con tu Mii dentro de la casa, lo de la copia que cuelga bajo su piso (cantos de losa, ménsulas, el cubo de la escalera
// que baja) se encimaba con el techo y los muros del nivel de abajo (rayas oscuras, un muro en la escalera): se corta en y
const suelo=(k,y)=>{uy(k).value=y};
window.PATV={A,dentro,vestir,paso,suelo};
})();
