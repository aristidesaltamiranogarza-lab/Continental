// c_rr_pj.js — RRPJ: los personajes (AV, c_avatar.js) y el revólver (modelos/personaje/revolver.glb) de la Ruleta Rusa.
// RRPJ.listo() carga los dos GLB; RRPJ.ya(). RRPJ.pj(cod) → {av, agr (Rig_Agarre, hijo de mano_D)} sentado con las manos al frente.
// RRPJ.arma(w): llena el grupo w con un revólver (cañón hacia +z, origen en el agarre); w.userData: drum, hammer, mz (la boca: su -Z es el cañón).
// w.userData también: trig, gate, rod (rod0), bala, casq, rec0 (la recámara frente a la puerta). RRPJ.suelta(w): ver abajo.
// RRPJ.enMano(w,agr|null): cuelga el revólver de w del Rig_Agarre de alguien (Rev_Agarre sobre Rig_Agarre) o lo regresa a w. RRPJ.ver(w,v).
// RRPJ.vista(w,cod): tu mano en primera persona (tu personaje recortado: solo antebrazo, mano y manga) agarrando el revólver de w; RRPJ.pasoVista(w) cada cuadro.
(function(){
if(typeof THREE==='undefined')return;
const URL_REV=new URL('modelos/personaje/revolver.glb?v=1',location.href).href;
const RPI=new THREE.Matrix4().makeRotationY(Math.PI),SEAT=new THREE.Vector3(0,.36,-.04),M1=new THREE.Matrix4(),M2=new THREE.Matrix4();
let rev=null,revP=null;
function cargaRev(){return revP||(revP=CGLB.cargador().then(L=>new Promise((ok,mal)=>L.load(URL_REV,ok,null,mal))).then(g=>{
 const s=g.scene;s.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}if(/^Rev_(Bala|Casquillo)$/.test(o.name))o.visible=false});
 s.updateMatrixWorld(true);const a=s.getObjectByName('Rev_Agarre');rev={s,inv:a.matrixWorld.clone().invert()};return rev}).catch(e=>{revP=null;console.warn('[RRPJ] no cargó el revólver',e);throw e}))}
function listo(){return Promise.all([AV.listo(),cargaRev()])}
const ya=()=>!!rev&&AV.ya();
function pj(cod){const av=AV.crearYa(cod);if(!av)return null;av.position.copy(SEAT);AV.sentar(av,true);AV.pose(av,'AgarreFrente',0);AV.agarre(av,'I',.3);AV.agarre(av,'D',.3);
 return {av,agr:av.getObjectByName('Rig_Agarre')}}
// el revólver dentro de w (mientras carga, piezas vacías para que el juego no truene)
function arma(w,sombra=true){const d=w.userData;d.spin=d.spin||-1e9;
 if(!d.mz){d.drum=new THREE.Object3D();d.hammer=new THREE.Object3D();d.mz=new THREE.Object3D();d.mz.position.set(0,.035,.31);d.mz.rotation.y=Math.PI;w.add(d.mz)}
 cargaRev().then(r=>{if(d.inner)return;const G=r.s.clone(true);G.matrixAutoUpdate=false;G.matrix.multiplyMatrices(RPI,r.inv);w.add(G);w.remove(d.mz);
  if(!sombra)G.traverse(o=>{o.castShadow=false});
  const o=n=>G.getObjectByName(n);Object.assign(d,{inner:G,drum:o('Rev_Tambor'),hammer:o('Rev_Martillo'),mz:o('Rev_Boca'),trig:o('Rev_Gatillo'),gate:o('Rev_Puerta'),rod:o('Rev_Varilla'),bala:o('Rev_Bala'),casq:o('Rev_Casquillo')});
  d.rod0=d.rod?d.rod.position.z:0;const rc=o('Rev_Recamara');d.rec0=rc?rc.position.clone():new THREE.Vector3();G.visible=w.visible}).catch(()=>{});
 return w}
function enMano(w,agr){const d=w.userData,G=d.inner;if(!G)return;
 if(agr){if(G.parent!==agr){agr.add(G);G.matrix.copy(rev.inv)}}
 else if(G.parent!==w){w.add(G);G.matrix.multiplyMatrices(RPI,rev.inv)}}
// suelta(w): saca el revólver de la mano y deja w (su agarre) donde estaba en el mundo, para que siga volando desde ahí
function suelta(w){const d=w.userData,G=d.inner;if(!G||G.parent===w)return false;G.updateWorldMatrix(true,false);
 M1.multiplyMatrices(G.matrixWorld,M2.multiplyMatrices(RPI,rev.inv).invert());enMano(w,null);M1.decompose(w.position,w.quaternion,w.scale);return true}
function ver(w,v){w.visible=v;if(w.userData.inner)w.userData.inner.visible=v}
// recorta un clon del personaje: solo los triángulos que mueven el antebrazo y la mano derechos (más de la mitad del peso)
const KEEP=/^(mano_D|antebrazo_D|dedos\d_D|pulgar\d_D)$/;
function recorta(p){p.traverse(o=>{if(!o.isSkinnedMesh)return;o.castShadow=o.receiveShadow=false;const g=o.geometry,keep=o.skeleton.bones.map(b=>KEEP.test(b.name));
 const si=g.attributes.skinIndex,sw=g.attributes.skinWeight;if(!si||!sw){o.visible=false;return}const n=si.count,ok=new Uint8Array(n);
 for(let v=0;v<n;v++){let w=0;if(keep[si.getX(v)])w+=sw.getX(v);if(keep[si.getY(v)])w+=sw.getY(v);if(keep[si.getZ(v)])w+=sw.getZ(v);if(keep[si.getW(v)])w+=sw.getW(v);ok[v]=w>.5}
 const ix=g.index?g.index.array:null,m=ix?ix.length:n,out=[];
 for(let t=0;t<m;t+=3){const a=ix?ix[t]:t,b=ix?ix[t+1]:t+1,c=ix?ix[t+2]:t+2;if(ok[a]&&ok[b]&&ok[c])out.push(a,b,c)}
 if(!out.length){o.geometry=new THREE.BufferGeometry();o.visible=false;return}
 const ng=new THREE.BufferGeometry();for(const k in g.attributes)ng.setAttribute(k,g.attributes[k]);ng.setIndex(out);o.geometry=ng})}
function vista(w,cod){const d=w.userData;if(d.vm&&d.vmCod===cod)return;if(d.vm){AV.quita(d.vm);d.vm=null}
 const av=AV.crearYa(cod);if(!av)return;recorta(av);AV.pose(av,'AgarreFrente',0);AV.agarre(av,'D',1);av.matrixAutoUpdate=false;w.add(av);
 d.vm=av;d.vmCod=cod;d.vmAgr=av.getObjectByName('Rig_Agarre');pasoVista(w)}
// la mano se acomoda para que su Rig_Agarre quede en el agarre del revólver (el origen de w, cañón en +z)
function pasoVista(w){const d=w.userData,av=d.vm;if(!av||!d.vmAgr)return;av.updateMatrixWorld(true);
 M1.copy(av.matrixWorld).invert().multiply(d.vmAgr.matrixWorld).invert();av.matrix.multiplyMatrices(RPI,M1);av.matrixWorldNeedsUpdate=true}
window.RRPJ={listo,ya,pj,arma,enMano,suelta,ver,vista,pasoVista,SEAT};
})();
