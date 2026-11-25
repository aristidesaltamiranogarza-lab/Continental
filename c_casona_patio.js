// c_casona_patio.js — PATV: fundido de las copias de los otros niveles (CFUE las pone y decide cuándo se ven).
// Aparecer y desaparecer de golpe se notaba: la copia se disuelve con un tramado Bayer 4x4 en A.fun ms (ver(k,G,on) cada cuadro).
// suelo(k,y): debajo de esa y (mundo) no se dibuja la copia (lo que cuelga bajo su piso se encimaba con el techo del nivel de abajo).
// Se cambia el material de las copias de CFUE (son solo suyas), sin materiales nuevos. Ajustes en PATV.A.
(function(){
if(typeof THREE==='undefined')return;
const A={x:10.2,z0:-17.2,z1:7.2,fun:350};   // patio y corredores en coordenadas del juego (plano: x 8..28, z 10..34)
const UA={},ua=k=>UA[k]||(UA[k]={value:1}),UY={},uy=k=>UY[k]||(UY[k]={value:-1e9});   // UA: cuánto se ve (0..1); UY: corte bajo el piso
const dentro=p=>!!p&&Math.abs(p.x)<A.x&&p.z>A.z0&&p.z<A.z1;
const VS='varying vec3 pcW;\n',FS='uniform float pcA,pcY;\nvarying vec3 pcW;\n'+
 'float pcB2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}\nfloat pcB4(vec2 a){return pcB2(.5*a)*.25+pcB2(a);}\n',
 MAIN='if(pcW.y<pcY)discard;\nif(pcA<.999&&pcB4(gl_FragCoord.xy)>=pcA)discard;\n';
const hechos=new WeakSet();
function vestir(root,k){const a=ua(k);root.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
 if(!m||hechos.has(m))return;hechos.add(m);const ob=m.onBeforeCompile,ck=m.customProgramCacheKey();
 m.customProgramCacheKey=()=>ck+'|pc';
 m.onBeforeCompile=(s,r)=>{if(ob&&ob!==THREE.Material.prototype.onBeforeCompile)ob.call(m,s,r);s.uniforms.pcA=a;s.uniforms.pcY=uy(k);
  s.vertexShader=VS+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\npcW=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader=FS+s.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,'$&\n'+MAIN)};
 m.needsUpdate=true})})}
// ver(k,G,on): cada cuadro; on = si la copia G (nivel k) debe verse. Devuelve cuánto se ve (0 = apagada, 1 = completa).
function ver(k,G,on){const t=performance.now(),u=G.userData,dt=u.pcT?Math.min(100,t-u.pcT):0;u.pcT=t;
 if(u.pcV==null)u.pcV=G.visible?1:0;u.pcV=Math.max(0,Math.min(1,u.pcV+(on?1:-1)*dt/A.fun));ua(k).value=u.pcV;G.visible=u.pcV>0;return u.pcV}
const suelo=(k,y)=>{uy(k).value=y};
window.PATV={A,dentro,vestir,ver,suelo};
})();
