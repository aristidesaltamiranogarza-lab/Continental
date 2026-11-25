// c_casa_revisar.js — REV: revisión automática de la cámara en las marcas de CCAM (c_casa_marcacam.js).
// REV.ahora(): mide la toma actual: cuánto se ve de tu Mii (píxeles reales, con tramas y cortes incluidos), qué lo tapa
// (rayo de la cámara a la cabeza) y qué copias de otros pisos (CFUE) se están dibujando.
// REV.todas(): recorre todas las marcas, deja una tabla en consola (y en REV.ult) y vuelve a donde estabas. ?revisar la corre al cargar.
(function(){
if(typeof THREE==='undefined')return;
const A={min:60};   // % mínimo de tu Mii que debe verse
const MAG=new THREE.MeshBasicMaterial({color:0xff00ff,fog:false,toneMapped:false});
let RT=null,buf=null;
const H=()=>window.CASA3D&&CASA3D.on&&CASA3D.on()?CASA3D:null,espera=ms=>new Promise(r=>setTimeout(r,ms));
function cuenta(R,SC,CA){const s=R.getDrawingBufferSize(new THREE.Vector2()),w=s.x|0,h=s.y|0;
 if(!RT||RT.width!==w||RT.height!==h){if(RT)RT.dispose();RT=new THREE.WebGLRenderTarget(w,h);buf=new Uint8Array(w*h*4)}
 const pre=R.getRenderTarget();R.setRenderTarget(RT);R.clear();R.render(SC,CA);R.readRenderTargetPixels(RT,0,0,w,h,buf);R.setRenderTarget(pre);
 let n=0;for(let i=0;i<buf.length;i+=4)if(buf[i]>235&&buf[i+1]<25&&buf[i+2]>235)n++;return n}
const vis=o=>{for(;o;o=o.parent)if(!o.visible)return false;return true};
const nombre=o=>{for(;o;o=o.parent)if(o.name&&!/^(Scene|Object3D|)$/.test(o.name))return o.name;return '?'};
function ahora(){const h=H();if(!h)return null;const R=h.R(),SC=h.sc(),CA=h.cam(),yo=h.quien(h.myId()),g=yo&&yo.g;if(!g)return null;
 const ms=[];g.traverse(o=>{if(o.isMesh&&vis(o))ms.push(o)});const mat=ms.map(o=>o.material);
 ms.forEach(o=>o.material=MAG);const a=cuenta(R,SC,CA);
 const lay=CA.layers.mask;ms.forEach(o=>o.layers.enable(30));CA.layers.set(30);const b=cuenta(R,SC,CA);CA.layers.mask=lay;ms.forEach(o=>o.layers.disable(30));
 ms.forEach((o,i)=>o.material=mat[i]);
 const p=h.yo(),cab=new THREE.Vector3(p.x,g.position.y+1.6,p.z),d=cab.clone().sub(CA.position),L=d.length();
 const rc=new THREE.Raycaster(CA.position,d.normalize(),.1,L-.3);rc.camera=CA;let tapa=null;
 try{tapa=rc.intersectObject(SC,true).find(i=>vis(i.object)&&!ms.includes(i.object)&&!i.object.isSprite&&!i.object.isPoints&&!i.object.isLine)}catch(e){}
 const otros=[];SC.traverse(o=>{if(/^casona-fuera-/.test(o.name)&&o.visible)otros.push(o.name.slice(13))});
 return {piso:h.piso(),mii:b?Math.round(a/b*100):0,tapa:tapa?nombre(tapa.object):'',otros:otros.join(' ')}}
async function todas(L){const h=H();if(!h||!window.CCAM)return null;const antes=h.poseCam(),out=[];L=L||CCAM.marcas();
 for(const n of L){const P=Object.assign({},CCAM.M[n]);if(!CCAM.ir(n)&&h.piso()!==(P.f||'pb')){out.push({marca:n,error:'no fue'});continue}
  for(let i=0;i<60&&h.piso()!==(P.f||'pb');i++)await espera(200);await espera(2500);
  const r=ahora()||{};if(P.fp){r.mii='-';r.ok=''}else r.ok=r.mii>=A.min?'':'MAL';out.push(Object.assign({marca:n},r))}   // en primera persona tu Mii no se ve
 h.ponCam(antes);console.table(out);REV.ult=out;return out}
const REV=window.REV={A,ahora,todas,ult:null};
if(/[?&]revisar\b/.test(location.search)){let n=0;const go=()=>{if(H()&&window.CCAM)return setTimeout(()=>todas(),3000);if(++n<200)setTimeout(go,300)};go()}
})();
