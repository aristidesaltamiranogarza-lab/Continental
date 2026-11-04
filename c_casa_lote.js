// c_casa_lote.js — LOTE: junta muchas piezas sueltas (cajas, cilindros, bolas, cualquier geometría) en UNA malla por material,
// con el color de cada pieza en sus vértices. Así el exterior (c_casa_calle.js, c_casa_patio.js) se dibuja con pocas llamadas.
// Uso: const L=LOTE();L.box(w,h,d,color,x,y,z,ry,rx,rz);L.cyl(rt,rb,h,color,x,y,z,lados,ry,rx,rz);L.bola(r,sx,sy,sz,color,x,y,z);
//      L.geo(geometríaNueva,color,x,y,z,ry,rx,rz);padre.add(L.mesh(material))   (giro en orden YXZ: primero rz, luego rx, luego ry)
(function(){
if(typeof THREE==='undefined')return;
const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s1=new THREE.Vector3(1,1,1),cc=new THREE.Color();
function LOTE(){const P=[];
 const geo=(g,c,x,y,z,ry,rx,rz)=>{e.set(rx||0,ry||0,rz||0,'YXZ');q.setFromEuler(e);m4.compose(p.set(x||0,y||0,z||0),q,s1);
  const k=g.index?g.toNonIndexed():g;if(k!==g)g.dispose();k.applyMatrix4(m4);cc.set(c);k.userData.c=[cc.r,cc.g,cc.b];P.push(k);return k};
 return {geo,n:()=>P.length,
  box:(w,h,d,c,x,y,z,ry,rx,rz)=>geo(new THREE.BoxGeometry(w,h,d),c,x,y,z,ry,rx,rz),
  cyl:(rt,rb,h,c,x,y,z,n,ry,rx,rz)=>geo(new THREE.CylinderGeometry(rt,rb,h,n||10),c,x,y,z,ry,rx,rz),
  bola:(r,sx,sy,sz,c,x,y,z,n)=>geo(new THREE.IcosahedronGeometry(r,n==null?1:n).scale(sx,sy,sz),c,x,y,z),
  // rama: cilindro que sale de (x,y,z) hacia el rumbo th (radianes en el piso) inclinado a del vertical; devuelve la punta
  rama(c,x,y,z,len,r0,r1,th,a,n){const sa=Math.sin(a)*len/2,ca=Math.cos(a)*len/2;
   geo(new THREE.CylinderGeometry(r1,r0,len,n||6),c,x+Math.cos(th)*sa,y+ca,z+Math.sin(th)*sa,-th,0,-a);return [x+Math.cos(th)*sa*2,y+ca*2,z+Math.sin(th)*sa*2]},
  mesh(mat){let n=0;P.forEach(g=>n+=g.attributes.position.count);
   const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3);let o=0;
   P.forEach(g=>{const a=g.attributes,k=a.position.count,[r,gg,b]=g.userData.c;pos.set(a.position.array,o*3);nor.set(a.normal.array,o*3);if(a.uv)uv.set(a.uv.array,o*2);
    for(let i=o*3,j=(o+k)*3;i<j;i+=3){col[i]=r;col[i+1]=gg;col[i+2]=b}o+=k;g.dispose()});
   const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));
   G.setAttribute('uv',new THREE.BufferAttribute(uv,2));G.setAttribute('color',new THREE.BufferAttribute(col,3));G.computeBoundingSphere();
   mat.vertexColors=true;P.length=0;return new THREE.Mesh(G,mat)}}}
window.LOTE=LOTE;
})();
