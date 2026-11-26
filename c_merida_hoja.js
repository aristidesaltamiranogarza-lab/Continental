// Mérida en Venta: paneles de abajo (Jugadores, Mías, Tratos, Historial) con pestaña para deslizarlos hacia abajo y cerrarlos (MHOJ).
// Sin barras de desplazamiento: el borde se desvanece donde hay más (ui-desl).
(function(){
const css=`.mu-grab{display:flex;justify-content:center;align-items:center;height:22px;margin:-4px 0 -6px;cursor:grab;touch-action:none;flex:none}
.mu-grab i{display:block;width:44px;height:5px;border-radius:999px;background:var(--ui-sub,#C9B19C);opacity:.55;transition:opacity .15s,width .15s}
.mu-grab:hover i,.mu-grab.on i{opacity:.9;width:56px}
.mu-sheet.mu-drag{animation:none!important;transition:none!important}
.mu-sheet.mu-back{transition:transform .22s cubic-bezier(.2,1.3,.4,1)}
.mu-sheet.mu-out{transition:transform .18s ease-in;transform:translateY(110%)!important}
.mu-sheet,.mu-sheet *{scrollbar-width:none}.mu-sheet ::-webkit-scrollbar,.mu-sheet::-webkit-scrollbar{display:none;width:0;height:0}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
let D=null;
// se arrastra desde la pestaña o el título del panel
document.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('.mu-grab,.mu-sheet>header');if(!g)return;const sh=g.closest('.mu-sheet');if(!sh||!sh.querySelector('.mu-grab'))return;
 D={sh,g:sh.querySelector('.mu-grab'),y0:e.clientY,t0:performance.now(),dy:0,id:e.pointerId};sh.classList.remove('mu-back');sh.classList.add('mu-drag');D.g.classList.add('on');try{g.setPointerCapture(e.pointerId)}catch(_){}});
document.addEventListener('pointermove',e=>{if(!D||e.pointerId!==D.id)return;const dy=e.clientY-D.y0;D.dy=dy>0?dy:-Math.sqrt(-dy)*2;D.sh.style.transform=`translateY(${D.dy}px)`});
function fin(e){if(!D||e.pointerId!==D.id)return;const {sh,g,dy,t0}=D;D=null;sh.classList.remove('mu-drag');g.classList.remove('on');
 const v=dy/Math.max(1,performance.now()-t0),tap=Math.abs(dy)<6&&e.target.closest&&e.target.closest('.mu-grab');
 if(dy>Math.min(90,sh.offsetHeight*.25)||v>.6||tap){sh.classList.add('mu-out');setTimeout(()=>{if(window.MRU)MRU.tab(null)},170)}
 else{sh.classList.add('mu-back');sh.style.transform='';setTimeout(()=>sh.classList.remove('mu-back'),240)}}
document.addEventListener('pointerup',fin);document.addEventListener('pointercancel',fin);
window.MHOJ={};
})();
