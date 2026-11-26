// GIRAR: Continental se juega en horizontal. En celular vertical, con partida en curso, pide girar el teléfono
// (y si el navegador deja, pantalla completa + bloqueo horizontal). Entra con rebote y sale volando, como la portada.
(function(){
const tel='<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="20" y="6" width="24" height="52" rx="5"/><path d="M29 51h6"/></svg>';
let el=null,sale=0;
const toca=()=>{try{return typeof V!='undefined'&&V&&V.game==='continental'&&V.G&&V.me>=0&&innerHeight>innerWidth&&matchMedia('(pointer:coarse)').matches}catch(e){return false}};
function pon(){if(el)return;el=document.createElement('div');el.id='girar';el.className='ui girar';
 const lk=screen.orientation&&screen.orientation.lock&&document.documentElement.requestFullscreen;
 el.innerHTML=`<div class="gi-c"><div class="gi-t">${tel}</div><b>Gira tu teléfono</b>${lk?'<button class="ui-btn" onclick="GIRAR.lock()">Pantalla completa</button>':''}</div>`;
 document.body.appendChild(el)}
function quita(){if(!el||sale)return;const e=el;e.classList.add('sale');sale=setTimeout(()=>{e.remove();if(el===e)el=null;sale=0},260)}
function lock(){document.documentElement.requestFullscreen().then(()=>screen.orientation.lock('landscape')).catch(()=>{})}
function revisa(){toca()?pon():quita()}
addEventListener('resize',revisa);addEventListener('orientationchange',revisa);setInterval(revisa,700);
window.GIRAR={revisa,lock};
})();
