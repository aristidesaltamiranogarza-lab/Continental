// c_mesa_fx.js — MFX: detalles de la mesa (Continental; después Uno): polvo de fieltro cuando una carta cae en la mesa y destellos (estrellitas)
// al pegar en una bajada o al bajarse. Pocos sprites que se reciclan. Con reducir movimiento (RM) no hay nada.
// MFX.polvo(par,pos,k) (k = tamaño de la carta) · MFX.destello(par,pos,w,h,col) (rectángulo w×h del fieltro) · MFX.paso(now) cada cuadro.
(function(){
if(typeof THREE==='undefined')return;
const vivos=[],pool=[],TX={},RMo=()=>typeof RM!=='undefined'&&RM;let tl=0;
function tex(k,draw){if(TX[k])return TX[k];const c=document.createElement('canvas');c.width=c.height=64;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return TX[k]=t}
const motita=()=>tex('p',g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.5,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
const estrella=()=>tex('s',g=>{g.translate(32,32);const r=g.createRadialGradient(0,0,0,0,0,30);r.addColorStop(0,'#fff');r.addColorStop(.25,'rgba(255,255,255,.8)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;
 g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,d=i%2?7:30;g.lineTo(Math.cos(a)*d,Math.sin(a)*d)}g.closePath();g.fill()});
function spr(par,t,col,add){const s=pool.pop()||new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false}));const m=s.material;
 m.map=t;m.color.set(col);m.blending=add?THREE.AdditiveBlending:THREE.NormalBlending;m.needsUpdate=true;s.renderOrder=3;s.visible=true;par.add(s);return s}
// polvo: motitas del color del fieltro que salen de abajo de la carta, suben un poco y se desvanecen
function polvo(par,p,k){if(RMo()||!par)return;k=k||1;const now=performance.now();
 for(let i=0;i<9;i++){const a=Math.random()*Math.PI*2,v=(.6+Math.random()*.8)*k,s=spr(par,motita(),0xe8f2ea,false);s.position.set(p.x+Math.cos(a)*.3*k,.05,p.z+Math.sin(a)*.4*k);
  vivos.push({s,t0:now,vida:550+Math.random()*350,vx:Math.cos(a)*v,vy:.25+Math.random()*.35,vz:Math.sin(a)*v,s0:(.18+Math.random()*.14)*k,s1:(.45+Math.random()*.25)*k,op:.55})}}
// destello: estrellitas que se prenden y apagan sobre un rectángulo del fieltro
function destello(par,p,w,h,col){if(RMo()||!par)return;const now=performance.now(),n=Math.round(Math.min(16,6+(w*h)*.8));
 for(let i=0;i<n;i++){const s=spr(par,estrella(),col||0xffe08a,true);s.position.set(p.x+(Math.random()-.5)*w,.12+Math.random()*.25,p.z+(Math.random()-.5)*h);
  vivos.push({s,t0:now+Math.random()*260,vida:520+Math.random()*300,vx:0,vy:.2,vz:0,s0:.05,s1:.3+Math.random()*.25,op:1,brilla:1})}}
function paso(now){const dt=Math.min(.1,(now-(tl||now))/1000);tl=now;
 for(let i=vivos.length-1;i>=0;i--){const v=vivos[i],k=(now-v.t0)/v.vida,s=v.s;if(k<0){s.visible=false;continue}
  if(k>=1){s.parent&&s.parent.remove(s);pool.push(s);vivos.splice(i,1);continue}s.visible=true;
  s.position.x+=v.vx*dt;s.position.y+=v.vy*dt;s.position.z+=v.vz*dt;v.vx*=.9;v.vz*=.9;
  const e=v.brilla?Math.sin(k*Math.PI):1-k;s.material.opacity=v.op*e;s.scale.setScalar(v.s0+(v.s1-v.s0)*(v.brilla?Math.sin(k*Math.PI):Math.sqrt(k)));if(v.brilla)s.material.rotation=k*1.5}}
window.MFX={polvo,destello,paso};
})();
