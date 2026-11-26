// c_vista_carga.js — VCAR: al pasar un juego de 2D a 3D (Continental, Uno, Monopoly Deal) la escena 3D se arma de golpe y la pantalla se congela.
// Antes de armarla sale una mesa redonda del color del juego a la que se le reparten cartas (animación solo de transform, sigue aunque el hilo esté ocupado);
// se va como telón cuando el 3D ya corre parejo (3 cuadros seguidos rápidos, mínimo 0.7 s, máximo 8 s).
(function(){
const JS={c3dToggle:'continental',u3dToggle:'uno',md3Toggle:'monopolydeal'};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const css=`#vcar{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:var(--ui-sheet,#FDF6E9);
 font-family:var(--ui-font,system-ui);color:var(--ui-text,#3A2416);animation:vcEnt .28s ease-out both;pointer-events:all}
#vcar.fuera{animation:vcSal .42s cubic-bezier(.6,0,.8,.4) both}
#vcar .vc-m{position:relative;width:min(46vmin,260px);aspect-ratio:1;border-radius:50%;
 background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--f1) 70%,#fff) 0%,var(--f1) 55%,var(--f2) 100%);
 box-shadow:0 0 0 clamp(7px,1.6vmin,11px) #6B3F22,0 0 0 clamp(9px,2vmin,14px) #3E2312,var(--ui-shadow,0 10px 30px rgba(0,0,0,.3));animation:vcMesa .6s .05s cubic-bezier(.3,1.4,.5,1) both}
#vcar .vc-c{position:absolute;left:50%;top:50%;width:19%;aspect-ratio:.7;margin:-13.5% 0 0 -9.5%;border-radius:8%;background:#FFF8EE;border:2px solid #fff;
 box-shadow:0 3px 8px rgba(0,0,0,.3);transform:rotate(var(--r)) translateY(-120%);animation:vcRep 2.4s cubic-bezier(.3,1.3,.5,1) var(--d) infinite both}
#vcar .vc-c::after{content:"";position:absolute;inset:14%;border-radius:6%;border:2px solid color-mix(in srgb,var(--f1) 60%,transparent)}
#vcar .vc-t{font-weight:800;font-size:16px;animation:vcTxt .45s .35s cubic-bezier(.3,1.4,.5,1) both}
#vcar .vc-p{display:flex;gap:7px;margin-top:-10px}#vcar .vc-p i{width:8px;height:8px;border-radius:50%;background:var(--ui-accent,#C2512A);animation:vcPunto 1.1s ease-in-out infinite}
#vcar .vc-p i:nth-child(2){animation-delay:.15s}#vcar .vc-p i:nth-child(3){animation-delay:.3s}
@keyframes vcEnt{from{opacity:0}}@keyframes vcSal{to{opacity:0;transform:scale(1.06)}}
@keyframes vcMesa{from{opacity:0;transform:scale(.6)}}@keyframes vcTxt{from{opacity:0;transform:translateY(10px)}}
@keyframes vcRep{0%{opacity:0;transform:translate(0,130%) rotate(0) scale(.7)}12%{opacity:1}30%,80%{opacity:1;transform:rotate(var(--r)) translateY(-120%) scale(1)}95%,100%{opacity:0;transform:rotate(var(--r)) translateY(-120%) scale(.85)}}
@keyframes vcPunto{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(-6px);opacity:1}}
@media (prefers-reduced-motion:reduce){#vcar,#vcar *{animation-duration:.01s!important;animation-iteration-count:1!important}}`;
let st=null,activo=false;
const cuadro=()=>new Promise(r=>requestAnimationFrame(()=>r(performance.now())));
function muestra(j){if(!st){st=document.createElement('style');st.textContent=css;document.head.appendChild(st)}
 const m=window.MESA_J&&MESA_J[j],c=(m&&m.col&&m.col())||['#2e6b4c','#173d2b'],el=document.createElement('div');el.id='vcar';el.className='ui';el.setAttribute('role','status');
 const n=6;el.innerHTML=`<div class="vc-m" style="--f1:${c[0]};--f2:${c[1]}">${Array.from({length:n},(_,k)=>`<i class="vc-c" style="--r:${k*360/n}deg;--d:${(.25+k*.12).toFixed(2)}s"></i>`).join('')}</div><div class="vc-t">Armando la mesa 3D</div><div class="vc-p"><i></i><i></i><i></i></div>`;
 document.body.appendChild(el);return el}
async function pasa(fn,j,args){activo=true;const el=muestra(j),t0=performance.now();
 await cuadro();await cuadro();await new Promise(r=>setTimeout(r,RM?0:260));   // que la mesa ya se vea antes de congelar
 try{fn.apply(this,args)}catch(e){console.error(e)}
 let ok=0,ult=await cuadro();while(performance.now()-t0<8000){const t=await cuadro();ok=t-ult<40?ok+1:0;ult=t;if(ok>=3&&t-t0>700)break}
 el.classList.add('fuera');setTimeout(()=>{el.remove();activo=false},RM?0:420)}
function envuelve(){for(const k in JS){const f=window[k];if(typeof f!='function'||f.vcar)continue;
 const w=function(...a){if(activo)return;if(!document.querySelector('#app .m2d'))return f.apply(this,a);pasa(f,JS[k],a)};w.vcar=1;window[k]=w}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',envuelve):envuelve();
window.VCAR={envuelve};
})();
