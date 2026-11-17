// c_casa_cuartos.js — CUA: en la planta baja no se dibujan los cuartos que no se ven.
// Si la cámara está dentro de un cuarto (bajo el techo), solo se dibujan ese cuarto, el de tu Mii (por el corte de muros)
// y los que se asoman por un vano que cae en la pantalla. Cámara afuera o arriba de los techos: se dibuja todo.
// Cada objeto de la escena que cabe en un solo cuarto queda ligado a él; su visible pasa a ser visible propio y cuarto visible,
// así no choca con el corte de muros ni con la mesa congelada. Lo que se mueve (Miis, mascotas) o abarca dos cuartos no se toca.
(function(){
if(typeof THREE==='undefined')return;
const H=9,E=.4,C=.1;
// cuartos: rectángulos [x0,x1,z0,z1] (c_casa_pb.js, planta)
const R=[{n:'sal',r:[[-17,17,-15,11]]},{n:'zag',r:[[-4.5,4.5,11.3,19]]},{n:'com',r:[[-17,-1.15,-25,-15.3]]},
 {n:'coc',r:[[-.85,12,-25,-15.3],[12,17,-19.35,-15.3]]},{n:'ban',r:[[12.3,17,-25,-19.65]]}];
// vanos entre cuartos: [a,b,eje del muro,posición del muro,centro del vano,ancho,alto]
const V=[[0,2,'z',-15.15,-9.5,4,5.8],[0,3,'z',-15.15,6,2.2,3.6],[0,1,'z',11.15,0,4.2,6.4],[2,3,'x',-1,-19.5,2.2,3.6],[3,4,'z',-19.5,14.6,2,3.6]]
 .map(([a,b,ax,p,c,w,h])=>({a,b,box:ax==='z'?new THREE.Box3(new THREE.Vector3(c-w/2,0,p-.3),new THREE.Vector3(c+w/2,h,p+.3))
  :new THREE.Box3(new THREE.Vector3(p-.3,0,c-w/2),new THREE.Vector3(p+.3,h,c+w/2))}));
const VIS=R.map(()=>true),fr=new THREE.Frustum(),pm=new THREE.Matrix4(),bb=new THREE.Box3();
const visto=new WeakSet(),LIG=[];let sc=null,nHijos=-1,tScan=0,on=true;

const en=(x,z,r,e)=>x>=r[0]-e&&x<=r[1]+e&&z>=r[2]-e&&z<=r[3]+e;
function cuarto(x,z,e){for(let i=0;i<R.length;i++)if(R[i].r.some(r=>en(x,z,r,e)))return i;return -1}
function ligar(o,i){const v=o.visible;o.userData.cuV=v;o.userData.cuI=i;o.userData.cuP=[o.position.x,o.position.y,o.position.z];
 Object.defineProperty(o,'visible',{configurable:true,enumerable:true,get(){const k=this.userData.cuI;return this.userData.cuV&&(k<0||!on||VIS[k])},set(v){this.userData.cuV=v}});LIG.push(o)}
function soltar(o){o.userData.cuI=-1}
function clasifica(o){if(visto.has(o))return;const u=o.userData;
 if(u.key||u.keep||o.isLight||o.isCamera){visto.add(o);return}
 let luz=false;o.traverse(c=>{if(c.isLight)luz=true});if(luz){visto.add(o);return}
 bb.setFromObject(o);if(bb.isEmpty())return;visto.add(o);   // modelo que aún no carga: se revisa luego
 const cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2,i=cuarto(cx,cz,C);if(i<0)return;
 if(!R[i].r.some(r=>en(bb.min.x,bb.min.z,r,E)&&en(bb.max.x,bb.max.z,r,E)))return;ligar(o,i)}
function scan(S){if(S!==sc){sc=S;nHijos=-1}
 for(const o of LIG){const p=o.userData.cuP;if(o.userData.cuI>=0&&(o.parent!==sc||o.position.x!==p[0]||o.position.y!==p[1]||o.position.z!==p[2]))soltar(o)}
 if(S.children.length===nHijos&&performance.now()-tScan<2000)return;nHijos=S.children.length;tScan=performance.now();S.children.forEach(clasifica)}
function todos(v){for(let i=0;i<VIS.length;i++)VIS[i]=v}

let k=0;
function paso(cam,av){const S=window.CASA3D&&CASA3D.sc();if(!S||!cam)return;if(k++%30===0)scan(S);
 const cp=cam.position,ic=cp.y<H?cuarto(cp.x,cp.z,0):-1;if(ic<0||!on){todos(true);return}
 todos(false);pm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);fr.setFromProjectionMatrix(pm);
 const cola=[ic];VIS[ic]=true;const ia=av?cuarto(av.x,av.z,0):-1;if(ia>=0&&!VIS[ia]){VIS[ia]=true;cola.push(ia)}
 while(cola.length){const i=cola.shift();for(const v of V){const j=v.a===i?v.b:v.b===i?v.a:-1;if(j<0||VIS[j])continue;if(fr.intersectsBox(v.box)){VIS[j]=true;cola.push(j)}}}}

window.CUA={paso,set on(v){on=!!v},get on(){return on},
 dbg:()=>({cuartos:R.map((r,i)=>r.n+':'+(VIS[i]?'si':'no')).join(' '),ligados:LIG.filter(o=>o.userData.cuI>=0).length,
  porCuarto:R.map((r,i)=>r.n+'='+LIG.filter(o=>o.userData.cuI===i).length).join(' ')})};
})();
