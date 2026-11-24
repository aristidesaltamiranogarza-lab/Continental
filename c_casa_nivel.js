// c_casa_nivel.js — NIVC: corte por nivel estilo Sims (CASONA.md V6). Con la cámara por encima del techo del nivel,
// el techo y lo que está a su altura o más arriba (bordes de losa) recibe el motivo `piso` de VIS con un fundido corto;
// al bajar la cámara (primera persona) vuelve. NIVC.tapas(lineas) pone una tapa plana oscura donde MARC.corte esconde un muro.
// En la azotea (c2) y la calle no se corta nada. Ajustes en NIVC.A.
(function(){
if(typeof THREE==='undefined')return;
const A={dur:180,margen:.05,hist:.3};
const bx=new THREE.Box3();
function preparar(R,id){if(id==='c2'||!R)return null;let H=0;
 R.traverse(o=>{if(o.isMesh&&/_techo$/.test(o.name)){bx.setFromObject(o);H=Math.max(H,bx.max.y)}});if(!H)return null;
 const T=[];R.traverse(o=>{if(!o.isMesh)return;bx.setFromObject(o);if(bx.min.y>=H-A.margen){o.userData.nivel=1;T.push(o)}});   // userData: que MRG no lo junte
 return T.length?{H,T,arriba:false,f:1,t:0,mt:0}:null}
function clonar(N){N.T.forEach(o=>{const v=o.material,m=v.clone();m.onBeforeCompile=v.onBeforeCompile;if(v.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey)m.customProgramCacheKey=v.customProgramCacheKey;o.material=m});N.mt=1}
function opac(N,f){N.T.forEach(o=>{const m=o.material,tr=f<1;if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true}m.opacity=f;m.depthWrite=!tr})}
function paso(N,cam){if(!N||!cam)return;const y=cam.position.y,n=performance.now();
 const a=N.arriba?y>N.H-A.hist:y>N.H+A.hist;
 if(a!==N.arriba){N.arriba=a;N.t=n;if(!N.mt)clonar(N);if(!a)N.T.forEach(o=>window.VIS?VIS.mostrar(o,'piso'):o.visible=true)}
 const meta=N.arriba?0:1;if(N.f===meta)return;
 const k=Math.min(1,(n-N.t)/A.dur);N.f=N.arriba?1-k:k;opac(N,N.f);
 if(N.f===0)N.T.forEach(o=>window.VIS?VIS.ocultar(o,'piso'):o.visible=false)}
// tapa oscura en el pie de cada muro cortado (la crea al primer corte)
let MT=null;
function tapa(l){if(l.tapa!==undefined)return l.tapa;const m0=l.ms[0];let S=m0;while(S&&S.parent)S=S.parent;if(!S||l.t==null){l.tapa=null;return null}
 MT=MT||new THREE.MeshBasicMaterial({color:0x2a211b});const L=l.b-l.a,g=new THREE.PlaneGeometry(l.h?L:l.t,l.h?l.t:L);g.rotateX(-Math.PI/2);
 const p=new THREE.Mesh(g,MT);p.position.set(l.h?(l.a+l.b)/2:l.c,l.y0+.03,l.h?l.c:(l.a+l.b)/2);p.name='nivc_tapa';p.raycast=()=>{};p.visible=false;p.matrixAutoUpdate=false;p.updateMatrix();S.add(p);return l.tapa=p}
function tapas(L){L.forEach(l=>{const p=l.v===false?tapa(l):l.tapa;if(p)p.visible=l.v===false})}
window.NIVC={A,preparar,paso,tapas};
})();
