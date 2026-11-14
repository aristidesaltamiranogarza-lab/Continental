// c_billar_look.js — BLOOK: aspecto de la mesa de billar (solo dibujo, no toca BFIS). Texturas de bolas, paño, madera, cuero y malla,
// mapa de entorno PMREM para los reflejos y el perfil real de las bandas. En calidad Media las texturas y esferas van a la mitad.
(function(){
if(typeof THREE==='undefined')return;
const PI=Math.PI,C={},lo=()=>window.CALIDAD==='medio',rnd=Math.random;
function tex(key,w,h,draw,o){o=o||{};if(C[key])return C[key];const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);if(!o.lin)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
 if(o.rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(o.rep[0],o.rep[1])}return C[key]=t}
function rep(t,x,y){const c=t.clone();c.repeat.set(x,y);c.needsUpdate=true;return c}

// ---------- entorno: cuarto cálido, lámpara encima y el paño verde abajo (lo que reflejan bolas y madera) ----------
let ENV=null,esp=[],tm=0;
function env(m){if(ENV){m.envMap=ENV;m.needsUpdate=true}else{esp.push(m);mkEnv()}return m}
function mkEnv(){if(ENV||tm)return;const R=window.CASA3D&&CASA3D.R&&CASA3D.R();if(!R){tm=setTimeout(()=>{tm=0;mkEnv()},600);return}
 const t=tex('bi-env',512,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#2e241c');gr.addColorStop(.3,'#5a4636');gr.addColorStop(.5,'#6b5442');
  gr.addColorStop(.56,'#2a2018');gr.addColorStop(.7,'#1d5c35');gr.addColorStop(1,'#123d23');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='rgba(255,236,200,.16)';[.12,.37,.62,.87].forEach(x=>g.fillRect(x*w-18,h*.3,36,h*.16));
  g.fillStyle='#fff6e2';g.filter='blur(3px)';[.25,.75].forEach(x=>{g.beginPath();g.ellipse(x*w,h*.11,w*.07,h*.035,0,0,7);g.fill()});
  g.fillRect(0,0,w,h*.025);g.filter='none'});
 t.mapping=THREE.EquirectangularReflectionMapping;const pm=new THREE.PMREMGenerator(R);ENV=pm.fromEquirectangular(t).texture;pm.dispose();
 esp.forEach(m=>{m.envMap=ENV;m.needsUpdate=true});esp=[]}

// ---------- bolas: número nítido en círculo, franja limpia y desgaste leve ----------
function texBola(n,COL){const s=lo()?512:1024;return tex('bi-bola'+n+'-'+s,s,s/2,(g,w,h)=>{const c=COL[n>8?n-8:n];g.fillStyle=n>8||!n?COL[0]:c;g.fillRect(0,0,w,h);
 if(n>8){g.fillStyle=c;g.fillRect(0,h*.285,w,h*.43)}
 [w*.25,w*.75].forEach(x=>{if(!n){g.fillStyle='#c0262a';g.beginPath();g.arc(x,h/2,h*.035,0,7);g.fill();return}
  const r=h*.135;g.fillStyle='#f7f3e8';g.beginPath();g.arc(x,h/2,r,0,7);g.fill();g.fillStyle='#141414';g.font='bold '+Math.round(r*(n>9?1.05:1.3))+'px Arial,Helvetica,sans-serif';
  g.textAlign='center';g.textBaseline='middle';g.fillText(n,x,h/2+r*.06);if(n==6||n==9)g.fillRect(x-r*.3,h/2+r*.62,r*.6,r*.1)});
 for(let i=0;i<w*.6;i++){g.fillStyle=rnd()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.06)';g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1)}
 g.strokeStyle='rgba(255,255,255,.06)';g.lineWidth=1;for(let i=0;i<24;i++){const x=rnd()*w,y=h*.2+rnd()*h*.6,a=rnd()*PI;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*s*.03,y+Math.sin(a)*s*.01);g.stroke()}})}
function matBola(n,COL){return env(new THREE.MeshPhysicalMaterial({map:texBola(n,COL),roughness:.2,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:.9}))}
function geoBola(R){return lo()?new THREE.SphereGeometry(R,32,20):new THREE.SphereGeometry(R,48,32)}

// ---------- paño: tejido fino repetido (relieve y aspereza) ----------
function tejido(){return tex('bi-tejido',128,128,(g,w,h)=>{const d=g.createImageData(w,h),a=d.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const v=128+(((x+y)&3)<2?26:-26)+(((x-y)&7)<1?-18:0)+(rnd()-.5)*40,i=(y*w+x)*4;a[i]=a[i+1]=a[i+2]=v;a[i+3]=255}g.putImageData(d,0,0)},{lin:1,rep:[70,35]})}
function matPano(map){const t=tejido();return new THREE.MeshStandardMaterial({map,roughness:1,roughnessMap:t,bumpMap:t,bumpScale:.35})}

// ---------- madera: veta en gris claro que se tiñe con el color del material ----------
function veta(){return tex('bi-veta',1024,256,(g,w,h)=>{g.fillStyle='#f2ece4';g.fillRect(0,0,w,h);
 for(let i=0;i<9;i++){g.fillStyle='rgba(60,30,10,'+(.04+rnd()*.06)+')';g.fillRect(0,rnd()*h,w,8+rnd()*30)}
 for(let i=0;i<90;i++){let y=rnd()*h;const a=.06+rnd()*.16,ph=rnd()*7,am=1+rnd()*5;g.strokeStyle=rnd()<.8?'rgba(40,15,4,'+a+')':'rgba(255,220,180,'+a*.6+')';
  g.lineWidth=.5+rnd()*2;g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=16){y+=(rnd()-.5)*.8;g.lineTo(x,y+Math.sin(x/w*PI*2*2+ph)*am)}g.stroke()}},{rep:[.7,2.5]})}
function matMadera(color,clear,box){const t=box?rep(veta(),2,1):veta();
 return env(new THREE.MeshPhysicalMaterial({color,map:t,roughness:.42,clearcoat:clear,clearcoatRoughness:.14,envMapIntensity:.6}))}

// ---------- cuero con poro y malla de las canastas ----------
function poro(){return tex('bi-poro',128,128,(g,w,h)=>{const d=g.createImageData(w,h),a=d.data;for(let i=0;i<a.length;i+=4){a[i]=a[i+1]=a[i+2]=110+rnd()*60;a[i+3]=255}g.putImageData(d,0,0)},{lin:1,rep:[6,2]})}
function matCuero(color){const t=poro();return env(new THREE.MeshStandardMaterial({color,roughness:.6,bumpMap:t,bumpScale:.5,envMapIntensity:.4}))}
function matMalla(){const t=tex('bi-malla',128,128,(g,w,h)=>{g.strokeStyle='#d7b98a';g.lineWidth=7;g.lineCap='round';
 [-1,0,1].forEach(i=>{g.beginPath();g.moveTo(i*w,0);g.lineTo(i*w+w,h);g.stroke();g.beginPath();g.moveTo(i*w+w,0);g.lineTo(i*w,h);g.stroke()})},{rep:[9,3]});
 return new THREE.MeshStandardMaterial({color:0x8a6440,map:t,alphaTest:.5,side:THREE.DoubleSide,roughness:.85})}

// ---------- banda con perfil real: socavada bajo la nariz y techo inclinado hacia el riel ----------
// b = [nariz0, nariz1, fondo2, fondo3] en x,z; la nariz queda donde dice BFIS (a la altura nh), solo cambia lo de arriba y abajo
function banda(b,R,Y,RT){const [x0,z0]=b[0],[x1,z1]=b[1];let nx=-(z1-z0),nz=x1-x0;const l=Math.hypot(nx,nz);nx/=l;nz/=l;
 if((b[3][0]-x0)*nx+(b[3][1]-z0)*nz<0){nx=-nx;nz=-nz}   // n: de la nariz hacia el fondo de la banda
 const nh=Y+1.27*R,dep=RT-Y-.002,g=new THREE.ExtrudeGeometry(new THREE.Shape(b.map(([x,z])=>new THREE.Vector2(x,-z))),{depth:dep,steps:6,bevelEnabled:false});
 g.rotateX(-PI/2);g.translate(0,Y+.001,0);const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=(x-x0)*nx+(z-z0)*nz;if(d>.004)continue;
  const s=y<nh?(nh-y)/(nh-Y)*.42*R:(y-nh)/(RT-nh)*.55*R;p.setXYZ(i,x+nx*s,y,z+nz*s)}
 g.computeVertexNormals();return g}

window.BLOOK={env,matBola,geoBola,matPano,matMadera,matCuero,matMalla,banda,tex};
})();
