// c_mdeal3d_zoom.js — MD3Z: ver una carta de Monopoly Deal 3D en grande. Al mantener presionada una carta, vuela desde donde
// está (en la mano o en la mesa) al centro de la pantalla con su cara completa (MD3K.grande). Tocar en cualquier lado la regresa.
// MD3Z.abre(id, {x,y,w,h} en px de pantalla) · MD3Z.cierra() · MD3Z.on
(function(){
let el=null,from=null,shut=null;
function rect(){const vw=innerWidth,vh=innerHeight,h=Math.min(vh*.74,vw*.86*1.5),w=h/1.5;return {x:(vw-w)/2,y:(vh-h)/2,w,h}}
function fx(r,t){return `translate(${r.x+r.w/2-t.x-t.w/2}px,${r.y+r.h/2-t.y-t.h/2}px) scale(${r.w/t.w}) rotate(${r.rot||0}rad)`}
function abre(id,r0){if(typeof MD3K=='undefined')return;if(shut){clearTimeout(shut);shut=null;if(el)el.remove();el=null}
 const t=rect();from=r0||{x:t.x+t.w/2-20,y:innerHeight,w:40,h:60};
 el=document.createElement('div');el.className='md3z';el.setAttribute('role','dialog');el.setAttribute('aria-label','Carta en grande');
 el.innerHTML=`<img class="md3z-c" src="${MD3K.grande(id)}" alt="" draggable="false" style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px">`;
 const c=el.firstChild;c.style.transform=fx(from,t);
 el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();cierra()});
 document.body.appendChild(el);if(typeof sfx=='function')sfx('card');
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!el)return;el.classList.add('on');c.style.transform='none'}))}
function cierra(){if(!el||shut)return;const c=el.firstChild,t=rect();el.classList.remove('on');c.style.transform=fx(from,t);
 const e=el;shut=setTimeout(()=>{e.remove();if(el===e)el=null;shut=null},300)}
addEventListener('keydown',e=>{if(e.key=='Escape')cierra()});
window.MD3Z={abre,cierra,get on(){return !!el&&!shut}};
})();
