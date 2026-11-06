// Escaleras entre los pisos de la casa y el plano enmarcado junto a cada una (tocarlo abre el 🧭 "Ir a…" de c_casa_ir.js).
// up: escalera que sube hasta una puerta con letrero · down: el hueco de una escalera que baja, con barandal · door: puerta con letrero
// plano: atril con el corte de la casa y "estás aquí" · floor: piso con huecos. Lo usan c_casa3d.js (planta baja), c_casa_alta.js,
// c_casa_terraza.js y c_sotano.js. Cada escalera devuelve su link {x,z,r,ax,az,to}: caminar hasta él (o tocarla) te cambia de piso.
(function(){
if(typeof THREE==='undefined')return;
const H=()=>window.CASA3D;
// marco local: el grupo se para en el pie de la escalera y avanza hacia su -z; dir [dx,dz] es hacia dónde avanza en el mundo
function frame(S,x,z,dir){const G=new THREE.Group();G.position.set(x,0,z);G.rotation.y=Math.atan2(-dir[0],-dir[1]);S.add(G);
 return {G,W:(lx,lz)=>({x:x-lx*dir[1]-lz*dir[0],z:z+lx*dir[0]-lz*dir[1]})}}
const link=(W,to,lz,az)=>{const c=W(0,lz),a=W(0,az);return {x:c.x,z:c.z,r:1.1,ax:a.x,az:a.z,to}};
const hitAll=(G,hits,hit)=>G.traverse(o=>{if(o.isMesh){o.userData.hit=hit;hits.push(o)}});
// letrero como el de las puertas de la planta baja: [texto, fondo, borde, letra, color de la luz]
function sign(key,s){const h=H();return h.ctex('sign-'+key,512,128,(g,w,hh)=>{g.fillStyle=s[1];h.rr(g,4,4,w-8,hh-8,18);g.fill();g.strokeStyle=s[2];g.lineWidth=6;h.rr(g,10,10,w-20,hh-20,14);g.stroke();
 g.font='bold '+(s[0].length>16?42:50)+'px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=s[3];g.fillText(s[0],w/2,hh/2+3)})}
// puerta con su marco, letrero encima y foquito (la luz se apaga en calidad Media). P: grupo y posición local; mira hacia su +z
function door(P,x,y,z,key,s){const h=H(),G=new THREE.Group();G.position.set(x,y,z);P.add(G);const fr=h.std(0xe9e2d0,.5),wd=h.std(0x4a2814,.45),dk=h.std(0x2e1a0e,.5);
 h.box(1.9,3.4,.12,wd,0,1.7,.06,G);[[-.45,2.45],[.45,2.45],[-.45,.95],[.45,.95]].forEach(([a,b])=>h.box(.7,b>2?1.4:1.1,.05,dk,a,b,.14,G));
 h.box(.22,3.7,.3,fr,-1.06,1.85,.12,G);h.box(.22,3.7,.3,fr,1.06,1.85,.12,G);h.box(2.34,.25,.34,fr,0,3.72,.14,G);
 const kb=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),h.std(0xc9a24a,.3,{metalness:.8}));kb.position.set(.7,1.55,.22);G.add(kb);
 const sg=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.65),h.std(0xffffff,.6,{map:sign(key,s)}));sg.position.set(0,4.3,.1);G.add(sg);
 const lt=new THREE.PointLight(s[4],6,6,1.6);lt.position.set(0,4.1,.9);G.add(lt);return G}

// ---------- escalera que sube: escalones macizos, descanso, barandal de herrería y la puerta arriba ----------
// e: {S,hits,OB,x,z (pie), dir (hacia dónde sube), to, key, sign, n, w, land, rail: lados con barandal (1 = su +x, -1 = su -x), wall: muro tras la puerta}
function up(e){const h=H(),{S,hits,OB}=e,n=e.n||10,rh=.36,d=.62,w=e.w||2.4,L=e.land||2.2,T=n*d,Y=n*rh,{G,W}=frame(S,e.x,e.z,e.dir),lk=link(W,e.to,.45,1.1);
 const box=(a,b,c,m,x,y,z)=>h.box(a,b,c,m,x,y,z,G),pl=h.std(0xeadfc8,.85),tr=h.std(0x6a3e1e,.5),ir=h.std(0x1c1c1e,.45,{metalness:.6});
 for(let i=0;i<n;i++){const y=(i+1)*rh;box(w,y,d,pl,0,y/2,-(i+.5)*d);box(w+.06,.06,d+.05,tr,0,y+.03,-(i+.5)*d+.02)}
 box(w,Y,L,pl,0,Y/2,-T-L/2);box(w+.06,.06,L,tr,0,Y+.03,-T-L/2);
 (e.rail||[1]).forEach(s=>{const x=s*(w/2-.07),len=Math.hypot(T,Y);
  const hr=box(.1,.08,len,tr,x,Y/2+1.5,-T/2);hr.rotation.x=Math.atan2(Y,T);box(.16,1.9,.16,tr,x,.95,-.1);
  for(let i=0;i<n;i++)box(.035,1.5-rh/2,.035,ir,x,(i+1)*rh+(1.5-rh/2)/2,-(i+.5)*d);
  box(.1,.08,L,tr,x,Y+1.5,-T-L/2);for(let z=.3;z<L;z+=.5)box(.035,1.5,.035,ir,x,Y+.75,-T-z)});
 if(e.wall)box(w+.8,Y+4.4,.3,pl,0,(Y+4.4)/2,-T-L-.15);
 door(G,0,Y,-T-L,e.key,e.sign);hitAll(G,hits,{t:'link',l:lk});
 // no se camina por la escalera: solo hasta el pie
 for(let z=1;z<T+L-.4;z+=1.2){const p=W(0,-z);OB.push({x:p.x,z:p.z,r:w/2+.1})}
 return lk}

// ---------- escalera que baja: el hueco en el piso (floor lo deja libre), escalones que se pierden abajo y barandal en tres lados ----------
// e: {S,hits,OB,x,z (orilla por donde se entra), dir (hacia dónde baja), to, n, w}. Devuelve {lk, hole:[x0,x1,z0,z1]}
function down(e){const h=H(),{S,hits,OB}=e,n=e.n||8,rh=.36,d=.62,w=e.w||2.4,T=n*d,hw=w/2+.12,{G,W}=frame(S,e.x,e.z,e.dir),lk=link(W,e.to,-.3,.9);
 const box=(a,b,c,m,x,y,z)=>h.box(a,b,c,m,x,y,z,G),pl=h.std(0xeadfc8,.85),tr=h.std(0x6a3e1e,.5),ir=h.std(0x1c1c1e,.45,{metalness:.6}),dk=h.std(0x1a120c,.95);
 for(let i=0;i<n;i++){const y=-(i+1)*rh;box(w,rh,d,pl,0,y+rh/2,-(i+.5)*d);box(w+.04,.05,d+.04,tr,0,y+.02,-(i+.5)*d+.02)}
 // las paredes del cubo de la escalera y el fondo oscuro
 [-1,1].forEach(s=>box(.2,5,T+.3,dk,s*(hw+.1),-2.52,-T/2));box(w+.64,5,.2,dk,0,-2.52,-T-.1);box(w+.4,.1,T,dk,0,-n*rh-.6,-T/2);
 // orilla de madera y barandal
 [-1,1].forEach(s=>{box(.16,.06,T+.2,tr,s*hw,.03,-T/2);box(.1,.08,T+.1,tr,s*hw,1.45,-T/2-.05);box(.16,1.5,.16,tr,s*hw,.75,-.05);
  for(let z=.45;z<T;z+=.45)box(.035,1.42,.035,ir,s*hw,.71,-z)});
 box(2*hw+.16,.06,.16,tr,0,.03,-T);box(2*hw+.1,.08,.1,tr,0,1.45,-T);for(let x=-hw+.4;x<hw;x+=.45)box(.035,1.42,.035,ir,x,.71,-T);
 [-1,1].forEach(s=>box(.16,1.5,.16,tr,s*hw,.75,-T));
 hitAll(G,hits,{t:'link',l:lk});
 for(let z=1.4;z<T;z+=1){const p=W(0,-z);OB.push({x:p.x,z:p.z,r:w/2})}
 const c=[W(-hw,0),W(hw,0),W(-hw,-T),W(hw,-T)],xs=c.map(p=>p.x),zs=c.map(p=>p.z);
 return {lk,hole:[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)]}}

// ---------- puerta suelta a otro piso (el cubo de la escalera en la terraza): mira hacia ry ----------
function exit(e){const {S,hits}=e,G=new THREE.Group();G.position.set(e.x,0,e.z);G.rotation.y=e.ry||0;S.add(G);const dir=[Math.sin(e.ry||0),Math.cos(e.ry||0)];
 const lk=link((lx,lz)=>({x:e.x+dir[0]*lz,z:e.z+dir[1]*lz}),e.to,.6,1.3);door(G,0,0,0,e.key,e.sign);hitAll(G,hits,{t:'link',l:lk});return lk}

// ---------- piso con huecos (las escaleras que bajan). b: [x0,x1,z0,z1] ----------
function floor(S,b,holes,mat){const s=new THREE.Shape();s.moveTo(b[0],-b[3]);s.lineTo(b[1],-b[3]);s.lineTo(b[1],-b[2]);s.lineTo(b[0],-b[2]);s.closePath();
 (holes||[]).forEach(q=>{const p=new THREE.Path();p.moveTo(q[0],-q[3]);p.lineTo(q[0],-q[2]);p.lineTo(q[1],-q[2]);p.lineTo(q[1],-q[3]);p.closePath();s.holes.push(p)});
 const m=new THREE.Mesh(new THREE.ShapeGeometry(s),mat);m.rotation.x=-Math.PI/2;m.receiveShadow=true;S.add(m);return m}

// ---------- el plano: corte de la casa con sus 4 pisos y "estás aquí" ----------
const PS=[['ter','Terraza',46,94],['alta','Planta alta',99,157],['pb','Planta baja',161,219],['sot','Sótano',226,276]];
function draw(g,w,h,here){g.fillStyle='#efe3c4';g.fillRect(0,0,w,h);g.strokeStyle='#8a6a3a';g.lineWidth=3;g.strokeRect(8,8,w-16,h-16);
 g.fillStyle='#4a2814';g.font='bold 22px Georgia,serif';g.textAlign='center';g.fillText('gamemash',w/2,34);
 const P=PS.find(p=>p[0]===here);if(P){g.fillStyle='rgba(224,122,16,.3)';g.fillRect(30,P[2]+1,196,P[3]-P[2]-2)}
 g.strokeStyle='#4a2814';g.lineWidth=3;g.strokeRect(28,99,200,120);g.fillStyle='#4a2814';g.fillRect(28,94,200,5);g.fillRect(28,157,200,4);
 g.fillRect(28,84,6,10);g.fillRect(222,84,6,10);g.fillRect(184,64,32,30);g.fillStyle='#efe3c4';g.fillRect(194,74,12,20);
 g.fillStyle='#6a4a2a';g.fillRect(10,219,236,6);g.setLineDash([6,4]);g.strokeRect(40,226,176,50);g.setLineDash([]);
 // escaleras en zigzag del lado derecho
 g.strokeStyle='#8a5a2a';g.lineWidth=2;[[157,99],[219,161],[276,226]].forEach(([y0,y1])=>{g.beginPath();g.moveTo(186,y0);for(let i=1;i<=5;i++){const x=186+i*7,y=y0-(y0-y1)*i/5;g.lineTo(x-7,y);g.lineTo(x,y)}g.stroke()});
 g.textAlign='left';g.textBaseline='middle';PS.forEach(([id,n,a,b])=>{const m=(a+b)/2,on=id===here;g.fillStyle=on?'#a3302a':'#3a2412';g.font=(on?'bold ':'')+'17px "Segoe UI",Arial,sans-serif';g.fillText(n,40,on?m-8:m);
  if(on){g.font='bold 13px "Segoe UI",Arial,sans-serif';g.fillText('● Estás aquí',44,m+11)}});
 g.textAlign='center';g.fillStyle='#4a2814';g.font='bold 14px "Segoe UI",Arial,sans-serif';g.fillText('🧭 Toca para ir a otro piso',w/2,300)}
// e: {S,hits,OB,x,z,ry,here,s (escala)}. Atril de madera con marco dorado; tocarlo abre el 🧭
function plano(e){const h=H(),{S,hits,OB}=e,G=new THREE.Group();G.position.set(e.x,0,e.z);G.rotation.y=e.ry||0;G.scale.setScalar(e.s||1);S.add(G);
 const wd=h.std(0x4a2814,.45),gold=h.std(0xc9a24a,.35,{metalness:.7}),box=(a,b,c,m,x,y,z)=>h.box(a,b,c,m,x,y,z,G);
 const pic=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.5),h.std(0xffffff,.8,{map:h.ctex('plano-'+e.here,256,320,(g,w,hh)=>draw(g,w,hh,e.here))}));pic.position.set(0,2.55,.075);G.add(pic);
 box(1.24,1.54,.06,wd,0,2.55,.02);[[0,3.36,1.4,.12],[0,1.74,1.4,.12],[-.64,2.55,.12,1.74],[.64,2.55,.12,1.74]].forEach(([x,y,a,b])=>box(a,b,.1,gold,x,y,.07));
 [-.45,.45].forEach(x=>{box(.07,1.8,.07,wd,x,.9,0).rotation.z=x>0?.1:-.1});   // abren hacia abajo y terminan bajo el marco (no tocan la imagen)box(.07,2.4,.07,wd,0,1.15,-.42).rotation.x=.36;box(1.3,.06,.2,wd,0,1.74,.14);
 hitAll(G,hits,{t:'fn',f:()=>{if(window.CIR)CIR.show()}});OB.push({x:e.x,z:e.z,r:.45*(e.s||1)});return G}

window.ESC={up,down,exit,floor,plano,sign};
})();
