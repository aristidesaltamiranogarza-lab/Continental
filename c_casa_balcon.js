// c_casa_balcon.js — BALC: el balcón de la planta alta sobre la azotea del frente (la de la calle). c_casa_alta.js lo llama al armar el piso.
// La puerta es el vano del muro de la calle (BALC.vano, el mismo que corta c_casa_casco.js por fuera); el piso es la azotea de CASCO (azo)
// y el pretil con su copete los pone CASCO (pb). Aquí: jambas y hojas abiertas, la herrería sobre el pretil, macetas y los límites para caminar.
// Coordenadas de la planta alta (piso en 0): la azotea queda a la misma altura. Medidas en CASCO.medidas.
(function(){
if(typeof THREE==='undefined')return;
const ZF=9,PF=19.3,PX=17.3,ZB=-12,vano={at:-1.8,w:3.2,h:5.4};
function pon({S,H,OB,fr,box,cyl}){const std=H.std,{at,w,h}=vano,t=.18;
 const vd=std(0x3a5a4a,.55),vl=std(0x2c4a3c,.6),ir=std(0x1c1c1e,.45,{metalness:.6}),pi=std(0xd9ccb2,.8);
 // marco de cantera por dentro y umbral
 [-1,1].forEach(s=>box(t,h+t,.5,fr,at+s*(w/2+t/2),(h+t)/2,ZF-.1));box(w+t*2,t,.5,fr,at,h+t/2,ZF-.1);box(w+.4,.04,.7,pi,at,.02,ZF+.05);
 // hojas abiertas hacia el cuarto, pegadas al muro, con tablillas
 [-1,1].forEach(s=>{const x=at+s*(w/2+t+w/4+.05);box(w/2,h-.2,.07,vd,x,(h-.2)/2,ZF-.12);for(let y=.5;y<h-.4;y+=.3)box(w/2-.14,.05,.03,vl,x,y,ZF-.17)});
 // herrería sobre el pretil de la calle (sin tapar el copete del centro)
 const z=PF-.15,y0=1.12,y1=2.05;[[-PX+.3,-3.95],[3.95,PX-.3]].forEach(([a,b])=>{box(b-a,.07,.07,ir,(a+b)/2,y1,z);box(b-a,.05,.05,ir,(a+b)/2,y0+.08,z);
  for(let x=a;x<=b+.01;x+=.3)box(.035,y1-y0,.035,ir,x,(y0+y1)/2,z);
  for(let x=a+.15;x<b;x+=.6){const r=new THREE.Mesh(new THREE.TorusGeometry(.1,.014,6,14),ir);r.position.set(x,y1-.2,z);S.add(r)}});
 // macetas con geranios junto al pretil y a los lados de la puerta
 const pot=std(0xb5643c,.7),hoja=std(0x2e7d32,.8),flor=std(0xd8344e,.7);
 [[-13.5,18.2],[-8,18.2],[8,18.2],[13.5,18.2],[at-3.2,ZF+.8],[at+3.2,ZF+.8]].forEach(([x,zz])=>{cyl(.45,.34,.8,pot,x,.4,zz);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,l=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,0),hoja);l.position.set(x+Math.cos(a)*.28,1,zz+Math.sin(a)*.28);S.add(l)}
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2+.4,f=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,0),flor);f.position.set(x+Math.cos(a)*.35,1.3,zz+Math.sin(a)*.35);S.add(f)}
  OB.push({x,z:zz,r:.6})})}
// se camina por la azotea del frente y, rodeando la alta, por las tiras de los lados; los muros de la alta (F.WL) dejan pasar solo por la puerta
function limites(F){F.bx=[-PX+.9,PX-.9,ZB+1.2,PF-1];F.cb=[-PX,PX,ZB,PF-.5]}
window.BALC={vano,pon,limites};
})();
