// c_casa_cuartos.js — CUA: no se dibujan los cuartos que no se ven (planta baja de la casa vieja y sótano, planta baja y alta de la casona).
// Si la cámara está dentro de un cuarto (bajo el techo), solo se dibujan ese cuarto, el de tu Mii (por el corte de muros)
// y los que se asoman por un vano que cae en la pantalla. Cámara afuera, en un lugar abierto o arriba de los techos: se dibuja todo.
// Cada objeto de la escena que cabe en un solo cuarto queda ligado a él; su visible pasa a ser visible propio y cuarto visible,
// así no choca con el corte de muros ni con la mesa congelada. Lo que se mueve (Miis, mascotas) o abarca dos cuartos no se toca.
// El estado va en un WeakMap (no en userData: MRG no junta lo que tiene userData). CUA.vis(o) da el visible propio; CUA.de(o) su cuarto.
// Cada piso tiene sus cuartos (CF): la casa vieja escritos a mano; la casona (CUA.casona) con los cuartos del anteproyecto y los vanos
// sacados de los muros de choque del GLB. CUA.abre(g): el GLB es un solo grupo; sus hijos se ligan uno por uno.
(function(){
if(typeof THREE==='undefined')return;
const E=.4,C=.1,A={hist:300};
const caja=(ax,p,c,w,h)=>ax==='z'?new THREE.Box3(new THREE.Vector3(c-w/2,0,p-.3),new THREE.Vector3(c+w/2,h,p+.3)):new THREE.Box3(new THREE.Vector3(p-.3,0,c-w/2),new THREE.Vector3(p+.3,h,c+w/2));
// piso: {R: cuartos [{n, r: rectángulos [x0,x1,z0,z1]}], V: vanos {a,b,box}, H: alto de los techos}
function hazPiso(R,V,H){return {R,V,H,VIS:R.map(()=>true)}}
// planta baja de la casa vieja (c_casa_pb.js); vanos: [a,b,eje del muro,posición del muro,centro del vano,ancho,alto]
const CF={pb:hazPiso([{n:'sal',r:[[-17,17,-15,11]]},{n:'zag',r:[[-4.5,4.5,11.3,19]]},{n:'com',r:[[-17,-1.15,-25,-15.3]]},
 {n:'coc',r:[[-.85,12,-25,-15.3],[12,17,-19.35,-15.3]]},{n:'ban',r:[[12.3,17,-25,-19.65]]}],
 [[0,2,'z',-15.15,-9.5,4,5.8],[0,3,'z',-15.15,6,2.2,3.6],[0,1,'z',11.15,0,4.2,6.4],[2,3,'x',-1,-19.5,2.2,3.6],[3,4,'z',-19.5,14.6,2,3.6]]
 .map(([a,b,ax,p,c,w,h])=>({a,b,box:caja(ax,p,c,w,h)})),9)};
const fr=new THREE.Frustum(),pm=new THREE.Matrix4(),bb=new THREE.Box3();
const visto=new WeakSet(),ST=new WeakMap(),ABRE=new WeakSet(),LIG=[];let sc=null,nHijos=-1,tScan=0,on=true,F=CF.pb;

const en=(x,z,r,e)=>x>=r[0]-e&&x<=r[1]+e&&z>=r[2]-e&&z<=r[3]+e;
function cuarto(x,z,e,f){const R=(f||F).R;for(let i=0;i<R.length;i++)if(R[i].r.some(r=>en(x,z,r,e)))return i;return -1}
function ligar(o,i,f){f=f||F;if(ST.has(o)){Object.assign(ST.get(o),{i,f});return}const s={i,f,par:o.parent,p:[o.position.x,o.position.y,o.position.z]};ST.set(o,s);VIS.reg(o);LIG.push(o)}
function clasifica(o){if(ABRE.has(o)){o.children.forEach(clasifica);return}if(visto.has(o))return;const u=o.userData;
 if(u.key||u.keep||u._mrg||o.isLight||o.isCamera){visto.add(o);return}
 let luz=false;o.traverse(c=>{if(c.isLight)luz=true});if(luz){visto.add(o);return}
 bb.setFromObject(o);if(bb.isEmpty())return;visto.add(o);   // modelo que aún no carga: se revisa luego
 const cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2,i=cuarto(cx,cz,C);if(i<0||!F.R[i].r.length)return;
 if(!F.R[i].r.some(r=>en(bb.min.x,bb.min.z,r,E)&&en(bb.max.x,bb.max.z,r,E)))return;
 // muro entre dos cuartos (llegan al eje del muro): se mete en el otro, no se liga (si no, desde el otro se borraba)
 if(F.R.some((q,j)=>j!==i&&q.r.some(r=>bb.max.x>r[0]+.05&&bb.min.x<r[1]-.05&&bb.max.z>r[2]+.05&&bb.min.z<r[3]-.05)))return;ligar(o,i)}
function scan(S){if(S!==sc){sc=S;nHijos=-1}
 for(const o of LIG){const s=ST.get(o),p=s.p;if(s.i>=0&&(o.parent!==s.par||o.position.x!==p[0]||o.position.y!==p[1]||o.position.z!==p[2]))s.i=-1}
 if(S.children.length===nHijos&&performance.now()-tScan<2000)return;nHijos=S.children.length;tScan=performance.now();S.children.forEach(clasifica)}
function todos(v){for(let i=0;i<F.VIS.length;i++)F.VIS[i]=v}
// visible propio (sin el corte por cuarto) y cuarto de un objeto o de su grupo más alto
function vis(o){return VIS.propio(o)}
// motivo 'cuarto' en VIS (c_vis.js): solo cambia lo que cambió
function sync(){for(const o of LIG){const s=ST.get(o);VIS.poner(o,'cuarto',s.i>=0&&on&&!s.f.VIS[s.i])}}
function de(o){for(let n=o;n&&!n.isScene;n=n.parent){const s=ST.get(n);if(s)return s.i}return -1}

let k=0;
// paso(cam, tu Mii, piso): cada cuadro del piso (sin piso: la planta baja de la casa vieja)
function paso(cam,av,id){paso0(cam,av,id);sync()}
function paso0(cam,av,id){const f=CF[id||'pb'];if(!f)return;if(f!==F){F=f;k=0}const S=window.CASA3D&&CASA3D.sc();if(!S||!cam)return;if(k++%30===0)scan(S);
 const cp=cam.position,ic=cp.y<F.H?cuarto(cp.x,cp.z,0):-1,t=performance.now();if(ic<0||!on||!F.R[ic].r.length){todos(true);if(window.PORT)PORT.hist(F.HS||(F.HS={}),F.VIS,t,A.hist);return}
 pm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);fr.setFromProjectionMatrix(pm);
 // V7: recorrido de portales desde el cuarto de la cámara y el de tu Mii (PORT), con histéresis para que no parpadee en las orillas
 const ia=av?cuarto(av.x,av.z,0):-1,ve=v=>fr.intersectsBox(v.box);
 let vis;if(window.PORT){vis=PORT.hist(F.HS||(F.HS={}),PORT.recorrer({n:F.R.length,V:F.V},[ic,ia],ve),t,A.hist)}
 else{vis=F.R.map(()=>false);const cola=[ic];vis[ic]=true;if(ia>=0&&!vis[ia]){vis[ia]=true;cola.push(ia)}
  while(cola.length){const i=cola.shift();for(const v of F.V){const j=v.a===i?v.b:v.b===i?v.a:-1;if(j<0||vis[j])continue;if(ve(v)){vis[j]=true;cola.push(j)}}}}
 for(let i=0;i<vis.length;i++)F.VIS[i]=vis[i]}

// casona: cuartos cerrados del anteproyecto (x, z, ancho, fondo del plano; en el juego x-18, 17-z) y alto de sus techos.
// Patio, corredores, traspatio y azotea son abiertos: lo que está ahí siempre se dibuja (el último "cuarto", sin rectángulos, solo une vanos).
const CC={c0:[5.5,{sal:[0,0,16,10],zag:[16,0,5,10],com:[21,0,15,10],esc:[0,10,8,7],ban:[0,17,8,5],lib:[0,22,8,12],coc:[28,10,8,12],des:[28,22,8,6],ser:[28,28,8,6]}],
 c1:[4.2,{bib:[0,0,16,10],ant:[16,0,5,10],tab:[21,0,15,10],esc:[0,10,8,7],cto:[0,17,8,13],mus:[28,10,8,20]}],
 cm1:[3.2,{can:[0,0,14,10],cas:[14,0,22,10],esc:[0,10,8,7],pas:[8,10,20,4],pas2:[8,14,4,3],bil:[0,17,12,13],cav:[28,10,8,10],osc:[28,20,8,10]}]};
// vanos: se recorre la orilla de cada cuarto; donde no hay muro de choque (WL: [x1,z1,x2,z2,r]) por 1 o más, hay un vano hacia el cuarto
// (o el abierto) de enfrente. Afuera de la casa (D.caja) no cuenta: la calle no se esconde.
function dist(px,pz,l){const dx=l[2]-l[0],dz=l[3]-l[1],L=dx*dx+dz*dz,t=L?Math.max(0,Math.min(1,((px-l[0])*dx+(pz-l[1])*dz)/L)):0;return Math.hypot(px-l[0]-t*dx,pz-l[1]-t*dz)}
function casona(id,WL,cj,M){if(M&&M.cuartos&&M.cuartos.length&&window.PORT)return CF[id]=portales(M);const c=CC[id];if(!c||!WL||!WL.length)return;const H=c[0],R=Object.keys(c[1]).map(n=>{const[x,z,w,d]=c[1][n];return {n,r:[[x-18,x+w-18,17-z-d,17-z]]}});
 R.push({n:'abierto',r:[]});const f=hazPiso(R,[],H),ab=R.length-1,V=f.V,dentro=(x,z)=>!cj||(x>cj[0]&&x<cj[1]&&z>cj[2]&&z<cj[3]);
 const libre=(x,z)=>!WL.some(l=>dist(x,z,l)<(l[4]||.3)+.08);
 R.forEach((q,a)=>q.r.forEach(r=>{
  for(const [ax,p,s,a0,a1] of [['z',r[2],-1,r[0],r[1]],['z',r[3],1,r[0],r[1]],['x',r[0],-1,r[2],r[3]],['x',r[1],1,r[2],r[3]]]){
   let ini=null,b=-1;const cierra=t=>{if(ini!=null&&t-ini>=1){const bj=b<0?ab:b;if(bj!==a&&!V.some(v=>(v.a===a&&v.b===bj||v.a===bj&&v.b===a)&&v.box.containsPoint(new THREE.Vector3(ax==='z'?(ini+t)/2:p,1,ax==='z'?p:(ini+t)/2))))V.push({a,b:bj,box:caja(ax,p,(ini+t)/2,t-ini+.4,H)})}ini=null};
   for(let t=a0+.15;t<=a1-.15;t+=.2){const x=ax==='z'?t:p,z=ax==='z'?p:t,ox=ax==='z'?x:p+s*.8,oz=ax==='z'?p+s*.8:z;
    if(libre(x,z)&&dentro(ox,oz)){const j=cuarto(ox,oz,0,f);if(ini==null){ini=t;b=j}else if(j!==b){cierra(t);ini=t;b=j}}else cierra(t)}
   cierra(a1-.15)}}));
 CF[id]=f;return f}
// V7: cuartos y portales marcados en Blender (MARC.leer: cuartos, portales); 'abierto' (patio, corredores, calle) va al final
function portales(M){const G=PORT.grafo(M.cuartos,M.portales),H=Math.max(...M.cuartos.map(c=>c.h));
 const R=M.cuartos.map(c=>({n:c.id,r:[[c.x-c.w/2,c.x+c.w/2,c.z-c.d/2,c.z+c.d/2]]}));R.push({n:'abierto',r:[]});
 const V=G.V.map(v=>({a:v.a,b:v.b,box:v.p.ax==='x'?caja('x',v.p.x,v.p.z,v.p.w+.4,v.p.h):caja('z',v.p.z,v.p.x,v.p.w+.4,v.p.h)}));
 const f=hazPiso(R,V,H);f.G=G;return f}
// el GLB de la casona es un grupo con todo: se ligan sus hijos (los muros, muebles y pisos de un solo cuarto)
function abre(g){ABRE.add(g);nHijos=-1}

window.CUA={A,paso,vis,de,abre,hay:id=>!!CF[id],casona,esAbre:g=>ABRE.has(g),ligar:(o,i)=>{visto.add(o);ligar(o,i,window.CASA3D&&CASA3D.piso&&CF[CASA3D.piso()])},set on(v){on=!!v;sync()},get on(){return on},
 dbg:()=>({cuartos:F.R.map((r,i)=>r.n+':'+(F.VIS[i]?'si':'no')).join(' '),vanos:F.V.map(v=>F.R[v.a].n+'-'+F.R[v.b].n).join(' '),ligados:LIG.filter(o=>ST.get(o).i>=0&&ST.get(o).f===F).length,
  porCuarto:F.R.map((r,i)=>r.n+'='+LIG.filter(o=>ST.get(o).i===i&&ST.get(o).f===F).length).join(' ')})};
})();
