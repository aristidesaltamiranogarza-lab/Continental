// c_casa_marcacam.js — marcadores de cámara para reproducir lo que desaparece (CASONA.md V1).
// ?cam=nombre pone la cámara en esa pose al cargar (piso, lugar del Mii, giro, inclinación, zoom, primera persona).
// En consola: CCAM.marca('nombre') imprime la pose actual lista para pegar en M (y la guarda en este navegador);
// CCAM.ir('nombre') va a una; CCAM.sig() a la siguiente (o F4 con ?cam). CCAM.marcas() lista los nombres.
// Pose: {f: piso, x, z: Mii, yaw: hacia dónde ve, fp: primera persona, ox, oz: desplazamiento, k: zoom, a: giro, t: inclinación}.
(function(){
const M={
 zaguan:{f:'c0',x:.5,z:12,yaw:Math.PI,fp:0,ox:0,oz:0,k:1,a:0,t:0},
 patio_corredor:{f:'c0',x:-8,z:5,yaw:2.4,fp:0,ox:0,oz:0,k:1,a:.8,t:0},
 patio_centro:{f:'c0',x:0,z:-5,yaw:Math.PI,fp:0,ox:0,oz:0,k:1.3,a:0,t:0},
 escalera:{f:'c0',x:-12,z:3.5,yaw:-1.57,fp:0,ox:0,oz:0,k:1,a:1.57,t:0},
 traspatio:{f:'c0',x:0,z:-15,yaw:0,fp:0,ox:0,oz:0,k:1,a:3.14,t:0},
 calle:{f:'c0',x:0,z:22,yaw:Math.PI,fp:0,ox:0,oz:0,k:.8,a:0,t:0},
 calle_vecinas:{f:'c0',x:14,z:22,yaw:Math.PI,fp:0,ox:0,oz:0,k:.8,a:.6,t:0},
 alta_patio:{f:'c1',x:-8,z:0,yaw:1.57,fp:0,ox:0,oz:0,k:1,a:-1.57,t:0},
 sotano:{f:'cm1',x:0,z:5,yaw:Math.PI,fp:0,ox:0,oz:0,k:1,a:0,t:0},
 azotea:{f:'c2',x:0,z:0,yaw:Math.PI,fp:0,ox:0,oz:0,k:.9,a:.5,t:0},
 // casos reportados (25 nov): la azotea o la planta alta tapaban a tu Mii, el cubo de la escalera en el sótano, el jardín desde la azotea
 pb_patio_lejos:{f:'c0',x:-8,z:5,yaw:0,fp:0,ox:0,oz:0,k:.6,a:0,t:0},
 pb_cerca:{f:'c0',x:-8,z:5,yaw:0,fp:0,ox:0,oz:0,k:3,a:0,t:0},
 pb_primera:{f:'c0',x:-8,z:5,yaw:0,fp:1,ox:0,oz:0,k:1,a:0,t:0},
 alta_corredor:{f:'c1',x:-8,z:-4,yaw:0,fp:0,ox:0,oz:0,k:1,a:0,t:0},
 alta_lejos:{f:'c1',x:-8,z:0,yaw:0,fp:0,ox:0,oz:0,k:.6,a:-1.57,t:0},
 sotano_billar:{f:'cm1',x:-12,z:-3,yaw:Math.PI,fp:0,ox:0,oz:0,k:1,a:0,t:0},
 azotea_jardin:{f:'c2',x:0,z:-11.5,yaw:0,fp:0,ox:0,oz:0,k:1,a:0,t:0}
};
const LS='casa_marcacam';let loc={};try{loc=JSON.parse(localStorage.getItem(LS)||'{}')||{}}catch(e){}
const todas=()=>Object.assign({},M,loc),nombres=()=>Object.keys(todas());let i=-1;
const C3=()=>window.CASA3D&&CASA3D.poseCam?CASA3D:null;
function marca(n){const c=C3();if(!c)return null;const P=c.poseCam();n=n||'m'+(Object.keys(loc).length+1);loc[n]=P;try{localStorage.setItem(LS,JSON.stringify(loc))}catch(e){}
 const t=` ${/^[a-z_]\w*$/i.test(n)?n:JSON.stringify(n)}:${JSON.stringify(P)},`;console.log(t);return t}
function ir(n){const P=todas()[n],c=C3();if(!P){console.warn('[cam] no hay marca',n,'- hay:',nombres().join(' '));return false}if(!c)return false;i=nombres().indexOf(n);return c.ponCam(P)}
function sig(){const L=nombres();i=(i+1)%L.length;console.log('[cam]',L[i]);return ir(L[i])}
const C=window.CCAM||(window.CCAM={});Object.assign(C,{marca,ir,sig,marcas:nombres,M});
// ?cam=nombre: espera a que la casa esté lista
const q=new URLSearchParams(location.search).get('cam');
if(q!=null){let n=0;const go=()=>{const c=C3();if(c&&c.on()&&ir(q||nombres()[0]))return;if(++n<200)setTimeout(go,300)};setTimeout(go,500);
 addEventListener('keydown',e=>{if(e.key==='F4'){e.preventDefault();sig()}})}
})();
