// c_av2d_caras.js — AV2D.CARAS: caras de reacción para los retratos 2D (feliz, sorpresa, enojo, triste). Cada una es {extra} para AV2D.retrato:
// dobla la boca, mueve las cejas y aprieta o abre los ojos (geometría clonada, cada lado sobre su centro) e inclina la cabeza.
// La usan los asientos de la mesa 2D (c_mesa2d.js: M2D.reac). Probar: AV2D.CARAS.prueba() dibuja las cuatro con tu personaje.
(function(){
if(!window.AV2D)return;
// f(x,y,cx,cy,hw) → [x,y]; cx,cy,hw: centro y medio ancho del lado (izquierdo x<0, derecho x>0) de esa pieza
function defo(p,es,f){p.traverse(o=>{if(!o.isMesh||!o.visible||!es(o))return;const g=o.geometry.clone(),a=g.attributes.position,n=a.count;
 const C=[[0,0,0,0],[0,0,0,0]];for(let i=0;i<n;i++){const c=C[a.getX(i)<0?0:1];c[0]+=a.getX(i);c[1]+=a.getY(i);c[2]++}
 C.forEach(c=>{if(c[2]){c[0]/=c[2];c[1]/=c[2]}});for(let i=0;i<n;i++){const c=C[a.getX(i)<0?0:1];c[3]=Math.max(c[3],Math.abs(a.getX(i)-c[0]))}
 for(let i=0;i<n;i++){const x=a.getX(i),c=C[x<0?0:1],[nx,ny]=f(x,a.getY(i),c[0],c[1],c[3]||1);a.setXY(i,nx,ny)}
 a.needsUpdate=true;o.geometry=g})}
const mats=o=>Array.isArray(o.material)?o.material:[o.material];
const boca=f=>p=>defo(p,o=>/^Boca_/.test(o.name),f),cejas=f=>p=>defo(p,o=>/^Cejas_/.test(o.name),f),ojos=f=>p=>defo(p,o=>mats(o).some(m=>m&&m.name==='av_ojo'),f);
const cab=(x,z)=>p=>p.traverse(o=>{if(o.isBone&&o.name==='cabeza'){o.rotation.x+=x;o.rotation.z+=z}});
const junta=(...fs)=>(p,T)=>fs.forEach(f=>f(p,T));
const CARAS={
 // ojos en arco (^ ^), sonrisa grande, cejas arriba, cabeza ladeada
 feliz:{extra:junta(boca((x,y)=>[x*1.3,y*1.3+.46*(x*x-.35)]),ojos((x,y,cx,cy,hw)=>{const u=(x-cx)/hw;return [x,cy+(y-cy)*.38+.018*(1-u*u)-.006]}),cejas((x,y)=>[x,y+.14]),cab(-.05,.13))},
 // boca en O, ojos grandes, cejas muy arriba
 sorpresa:{extra:junta(boca((x,y)=>[x*.55,y*3.2+.08]),ojos((x,y,cx,cy)=>[cx+(x-cx)*1.14,cy+(y-cy)*1.25]),cejas((x,y)=>[x,y+.42+.12*(1-x*x)]),cab(-.1,0))},
 // ceño: cejas bajando hacia adentro, ojos entrecerrados, boca hacia abajo
 enojo:{extra:junta(boca((x,y)=>[x*.85,y*.9-.3*(x*x-.35)]),cejas((x,y)=>{const a=Math.abs(x);return [x,y-.55*(1-a)+.18]}),ojos((x,y,cx,cy)=>[x,cy+(y-cy)*.72-.004]),cab(.12,0))},
 // cejas subiendo hacia adentro, boca triste, cabeza abajo y ladeada
 triste:{extra:junta(boca((x,y)=>[x*.78,y*.9-.24*(x*x-.35)-.04]),cejas((x,y)=>{const a=Math.abs(x);return [x,y+.5*(1-a)-.12]}),ojos((x,y,cx,cy)=>[x,cy+(y-cy)*.85-.004]),cab(.2,-.15))}};
// las cuatro junto a la normal, en una imagen (para revisar)
CARAS.prueba=async(cod)=>{cod=cod||(()=>{try{return localStorage.cont_av}catch(e){}})()||AV.azar();const ks=['',...Object.keys(CARAS).filter(k=>k!='prueba')];
 const cs=[];for(const k of ks)cs.push(await AV2D.retrato(cod,{tam:200,plano:'busto',giro:.35,fondo:'#e9dcc4',...(k?CARAS[k]:{})}));
 const c=document.createElement('canvas');c.width=200*cs.length;c.height=200;const g=c.getContext('2d');cs.forEach((x,i)=>g.drawImage(x,i*200,0,200,200));return c};
AV2D.CARAS=CARAS;
})();
