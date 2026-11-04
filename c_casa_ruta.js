// Casa: caminar tocando el piso con búsqueda de ruta (estilo Sims). A* en una rejilla del piso que rodea mesas, sillas y muebles.
// RUTA.find(desde, hasta, piso, obstáculos) → lista de puntos (THREE.Vector3) para ir de uno en uno; el último es el destino.
// Obstáculos: los mismos círculos que usa solve() en c_casa3d.js ({x,z,r}, las mesas con g llevan .45 más por las sillas).
(function(){
if(typeof THREE==='undefined')return;
const CS=.4,PAD=.42;   // CS: tamaño de cada cuadro; PAD: distancia extra al borde de cada obstáculo (medio cuerpo del Mii)
function find(a,b,FL,obs){const bx=FL.bx,x0=bx[0],z0=bx[2],nx=Math.max(1,Math.ceil((bx[1]-x0)/CS)+1),nz=Math.max(1,Math.ceil((bx[3]-z0)/CS)+1);
 // muros (FL.WL de c_casa_pb.js): segmentos [ax,az,bx,bz,r]
 const WL=FL.WL||[],dw=(x,z,[ax,az,bx,bz])=>{const vx=bx-ax,vz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz||1)));return Math.hypot(x-ax-vx*t,z-az-vz*t)},
  muro=(x,z)=>WL.some(s=>dw(x,z,s)<s[4]+.05);
 const R=obs.map(o=>({x:o.x,z:o.z,r:(o.g?o.r+.45:o.r)+.35})),free=(x,z)=>x>=bx[0]&&x<=bx[1]&&z>=bx[2]&&z<=bx[3]&&R.every(o=>Math.hypot(x-o.x,z-o.z)>=o.r+PAD*.5)&&!muro(x,z);
 const blk=new Uint8Array(nx*nz),X=i=>x0+i*CS,Z=j=>z0+j*CS;
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=X(i),z=Z(j);blk[j*nx+i]=R.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+PAD*.5)||muro(x,z)?1:0}
 const cell=p=>[Math.max(0,Math.min(nx-1,Math.round((p.x-x0)/CS))),Math.max(0,Math.min(nz-1,Math.round((p.z-z0)/CS)))];
 // si el inicio o el final caen dentro de un obstáculo, se toma el cuadro libre más cercano
 const near=([i,j])=>{if(!blk[j*nx+i])return [i,j];for(let r=1;r<Math.max(nx,nz);r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const ii=i+di,jj=j+dj;if(ii>=0&&jj>=0&&ii<nx&&jj<nz&&!blk[jj*nx+ii])return [ii,jj]}return [i,j]};
 const s=near(cell(a)),g=near(cell(b)),S=s[1]*nx+s[0],Gi=g[1]*nx+g[0];
 // línea recta libre entre dos puntos (para recortar la ruta)
 const los=(p,q)=>{const d=Math.hypot(q.x-p.x,q.z-p.z),n=Math.ceil(d/(CS*.5));for(let k=1;k<n;k++){const t=k/n;if(!free(p.x+(q.x-p.x)*t,p.z+(q.z-p.z)*t))return false}return true};
 const dest=b.clone().setY(0);if(los(a,dest))return [dest];
 const gs=new Float32Array(nx*nz).fill(1e9),from=new Int32Array(nx*nz).fill(-1),done=new Uint8Array(nx*nz),open=[S];gs[S]=0;
 const h=k=>Math.hypot(k%nx-g[0],(k/nx|0)-g[1]);let found=false;
 while(open.length){let bi=0;for(let q=1;q<open.length;q++)if(gs[open[q]]+h(open[q])<gs[open[bi]]+h(open[bi]))bi=q;const c=open.splice(bi,1)[0];if(c===Gi){found=true;break}if(done[c])continue;done[c]=1;
  const ci=c%nx,cj=c/nx|0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ii=ci+di,jj=cj+dj;if(ii<0||jj<0||ii>=nx||jj>=nz)continue;const k=jj*nx+ii;if(blk[k]||done[k])continue;
   if(di&&dj&&(blk[cj*nx+ii]||blk[jj*nx+ci]))continue;   // no cortar esquinas
   const ng=gs[c]+(di&&dj?1.414:1);if(ng<gs[k]){gs[k]=ng;from[k]=c;open.push(k)}}}
 if(!found)return [dest];   // sin ruta: derecho, como antes (solve lo empuja)
 const pts=[];for(let k=Gi;k!==-1;k=from[k])pts.unshift(new THREE.Vector3(X(k%nx),0,Z(k/nx|0)));pts.push(dest);
 // recorta: de cada punto salta al más lejano que se vea en línea recta
 const out=[];let cur=a.clone().setY(0),i=0;while(i<pts.length){let j=pts.length-1;while(j>i&&!los(cur,pts[j]))j--;out.push(pts[j]);cur=pts[j];i=j+1}
 return out}
window.RUTA={find};
})();
