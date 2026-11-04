// Etiquetas de las mesas en la casa 3D (.h3sign con data-g): solo icono + nombre; el detalle (<small>)
// sale al pasar el cursor, o con el primer toque en el celular (el segundo toque entra).
// Se encogen y desvanecen con la distancia a la cámara, y se apartan para no empalmarse entre sí
// ni con los nombres de los Miis. c_casa3d.js llama a ETQ.step cada cuadro, ETQ.hov y ETQ.tap.
(function(){
const css=document.createElement('style');css.textContent=`
.h3sign small{display:none}
.h3sign.on small,.h3sign.hov small,.h3sign.det small{display:block}
@media (hover:hover){.h3sign:hover small{display:block}}
.h3sign.det small::after{content:' · toca otra vez para entrar'}
.h3sign{transform-origin:50% 100%;transition:opacity .2s}
.h3sign.hov,.h3sign.det,.h3sign:hover{z-index:10}`;
document.head.appendChild(css);

let pt='mouse',det=null,detT=0,hov=null,act=null;   // act: la mesa señalada (para c_casa_hover.js)
addEventListener('pointerdown',e=>{pt=e.pointerType},true);
// primer toque: solo enseña el detalle; true = ya lo estaba enseñando (el segundo toque entra)
function tap(g){const now=performance.now();if(det===g&&now<detT){det=null;return true}det=g;detT=now+5000;return false}
document.addEventListener('click',e=>{if(pt!=='touch')return;const el=e.target.closest&&e.target.closest('#app .h3sign');
 if(el&&el.dataset.g&&!tap(el.dataset.g)){e.preventDefault();e.stopPropagation()}},true);

const full=el=>el.classList.contains('on')||el.classList.contains('hov')||el.classList.contains('det')||el.matches(':hover');
// o.ratio(g): distancia de la cámara a esa mesa entre la distancia al centro de la vista (1 = igual de lejos)
// o.y0: borde de abajo de la barra de arriba
function step(o){
 const now=performance.now();if(det&&now>detT)det=null;
 const L=[];
 document.querySelectorAll('#app .h3sign').forEach(el=>{
  // si el módulo de esa etiqueta no volvió a poner su transform, quito lo que le agregué el cuadro anterior
  let t=el.style.transform;if(el._etq!=null&&t===el._etq)t=el._base;el._base=t;el.style.transform=t;el._etq=null;
  const g=el.dataset.g;el.classList.toggle('det',!!g&&g===det);el.classList.toggle('hov',!!g&&g===hov);
  if(el.style.display!=='none')L.push(el)});
 const hv=L.find(el=>el.matches(':hover'));act=det||hov||(hv&&hv.dataset.g)||null;
 if(!L.length)return;
 // obstáculos fijos: los nombres arriba de los Miis y el panel de la cámara
 const P=[];document.querySelectorAll('.h3nm,#t3cam').forEach(n=>{if(n.style.display==='none')return;const r=n.getBoundingClientRect();if(r.width)P.push({l:r.left,r:r.right,t:r.top,b:r.bottom})});
 const I=L.map(el=>{const r=el.getBoundingClientRect(),f=full(el),k=f?1:(o.ratio(el.dataset.g)||1),
  q=f?0:Math.max(0,Math.min(1,(k-1.15)/.8)),s=1-.3*q,w=r.width*s,h=r.height*s,cx=r.left+r.width/2;
  return {el,f,k,s,op:1-.55*q,l:cx-w/2,r:cx+w/2,t:r.bottom-h,b:r.bottom}});
 I.sort((a,b)=>(b.f-a.f)||(a.k-b.k));   // las importantes y las cercanas se quedan; las demás se apartan
 const M=3,hit=(a,dy,p)=>a.l<p.r+M&&a.r>p.l-M&&a.t+dy<p.b+M&&a.b+dy>p.t-M;
 I.forEach(a=>{let dy=0;
  for(let i=0;i<6;i++){const p=P.find(p=>hit(a,dy,p));if(!p)break;
   const up=p.t-M-a.b;dy=a.t+up>=o.y0?up:p.b+M-a.t}
  P.push({l:a.l,r:a.r,t:a.t+dy,b:a.b+dy});
  const el=a.el,d0=el._dy||0;el._dy=Math.abs(dy-d0)<.5?dy:d0+(dy-d0)*.3;
  el.style.transform=el._base+` translateY(${el._dy.toFixed(1)}px) scale(${a.s.toFixed(3)})`;el._etq=el.style.transform;
  const op=String(+a.op.toFixed(2));if(el.style.opacity!==op)el.style.opacity=op})}

window.ETQ={step,tap,hov:g=>{hov=g||null},act:()=>act};
})();
