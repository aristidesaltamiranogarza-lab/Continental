// c_casa_trama.js — TRAMA: tramado de lo que tapa a tu Mii (CASONA.md V5). En vez de esconder la línea de muro entre la cámara y el Mii
// (MARC.corte), sus píxeles se descartan con un patrón Bayer 4x4 dentro de un círculo en pantalla alrededor del Mii.
// Cada cuadro: segmento cámara→pies y cámara→cabeza contra las líneas de MARC (2D + alto de la línea), sin rayos contra mallas.
// Histéresis: entra al tapar, sale tras A.sale ms sin tapar; fundido de A.fun ms. Material: copia por (material original, línea),
// mismo programa que el original (cubica de CMAT incluida), se crea una vez y se reusa; al terminar el fundido vuelve el original
// (si alguien cambió el material mientras tanto, p. ej. CMAT al llegar la luz, se vuelve a tramar sobre el nuevo).
// VIS anota el motivo suave 'trama' (con ?vis se tiñe en lugar de tramar). ?corte: vuelve a esconder como antes. Ajustes en TRAMA.A.
(function(){
if(typeof THREE==='undefined')return;
const A={alto:2.0,r:.9,rmin:60,dens:.8,borde:.7,fun:200,sale:300};
const DIAG=!!(window.VIS&&VIS.DIAG);
const U={tc:{value:new THREE.Vector2()},tr:{value:100}};
const ORIG=new WeakMap(),COP=new WeakMap();
const FR='uniform vec2 trC;uniform float trR,trF;\nfloat trB2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}\n'+
 'float trB4(vec2 a){return trB2(.5*a)*.25+trB2(a);}\n';
const MAIN='if(trF>0.){float d=length(gl_FragCoord.xy-trC)/trR;if(trF*'+A.dens.toFixed(2)+'*(1.-smoothstep('+A.borde.toFixed(2)+',1.,d))>trB4(gl_FragCoord.xy))discard;}\n';
// copia tramada de m para la línea l (una por par; el fundido va en su trF)
function copia(m,l){let C=COP.get(m);if(!C){C=new Map();COP.set(m,C)}let c=C.get(l);if(c)return c;
 c=m.clone();c.extensions=m.extensions;const ob=m.onBeforeCompile,ck=m.customProgramCacheKey(),F={value:0};c.userData.trF=F;
 c.customProgramCacheKey=()=>ck+'|trama';
 c.onBeforeCompile=(s,r)=>{if(ob&&ob!==THREE.Material.prototype.onBeforeCompile)ob.call(m,s,r);s.uniforms.trC=U.tc;s.uniforms.trR=U.tr;s.uniforms.trF=F;
  s.fragmentShader=FR+s.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,'$&\n'+MAIN)};
 C.set(l,c);return c}
function viste(o,l,on){if(!o.isMesh)return;
 if(on){const m0=Array.isArray(o.material)?o.material[0]:o.material;if(!ORIG.has(o)||!(m0&&m0.userData.trF)){ORIG.set(o,o.material);o.material=Array.isArray(o.material)?o.material.map(m=>copia(m,l)):copia(o.material,l)}}
 else if(ORIG.has(o)){o.material=ORIG.get(o);ORIG.delete(o)}}
function fade(o,f){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.userData.trF)m.userData.trF.value=f})}
// ¿el segmento cámara→(pies..cabeza) cruza la línea l por debajo de su alto?
function tapa(l,c,p){const a=l.h?c.z:c.x,b=l.h?p.z:p.x;if((a-l.c)*(b-l.c)>0)return false;
 const t=(l.c-a)/((b-a)||1e-6),u=l.h?c.x+(p.x-c.x)*t:c.z+(p.z-c.z)*t;if(u<l.a-.3||u>l.b+.3)return false;
 if(l.y0==null)return true;const y1=c.y+(p.y-c.y)*t,y2=c.y+(p.y+A.alto-c.y)*t;return Math.min(y1,y2)<l.y1&&Math.max(y1,y2)>l.y0}
const v1=new THREE.Vector3(),v2=new THREE.Vector3(),DB=new THREE.Vector2();let t0=0;
function centro(cam,p){const H=window.CASA3D,R=H&&H.R&&H.R();if(!R)return;R.getDrawingBufferSize(DB);
 v1.set(p.x,p.y,p.z).project(cam);v2.set(p.x,p.y+A.alto,p.z).project(cam);
 const x1=(v1.x*.5+.5)*DB.x,y1=(v1.y*.5+.5)*DB.y,x2=(v2.x*.5+.5)*DB.x,y2=(v2.y*.5+.5)*DB.y;
 U.tc.value.set((x1+x2)/2,(y1+y2)/2);U.tr.value=Math.max(A.rmin*(DB.y/innerHeight||1),Math.hypot(x2-x1,y2-y1)*A.r)}
function paso(L,cam,p){if(!cam||!p)return;const n=performance.now(),dt=Math.min(100,n-(t0||n));t0=n;const c=cam.position;let hay=false;
 for(const l of L){if(tapa(l,c,p))l.tt=n;const on=l.tt!=null&&n-l.tt<A.sale,f0=l.tf||0,f=Math.max(0,Math.min(1,f0+(on?1:-1)*dt/A.fun));
  if(on!==!!l.ton){l.ton=on;l.ms.forEach(m=>{if(window.VIS)VIS.poner(m,'trama',on);if(on&&!DIAG)viste(m,l,true)})}
  if(f!==f0||on){l.tf=f;if(!DIAG)l.ms.forEach(m=>{if(f>0){if(on)viste(m,l,true);fade(m,f)}else viste(m,l,false)})}
  if(f>0)hay=true}
 if(hay&&!DIAG)centro(cam,p)}
const on=()=>!new URLSearchParams(location.search).has('corte');
window.TRAMA={paso,tapa,on,A,U};
})();
