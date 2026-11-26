// c_prueba_mano.js — PMANO: solo en localhost, en Continental 2D. Un botón arriba a la izquierda abre un menú para empezar
// una partida de prueba con N cartas en tu mano (/prueba?mano=N, los demás son bots y nadie bajado).
(function(){
if(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))return;
const NS=[3,7,11,15,20,25,30];let abierto=false;
const css=`#pmano{position:fixed;left:calc(10px + env(safe-area-inset-left,0px));top:calc(64px + env(safe-area-inset-top,0px));z-index:80;display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 20px)}
#pmano button{font:700 13px var(--ui-font,system-ui);border:0;border-radius:999px;padding:6px 12px;background:var(--ui-sheet,#FFF8EE);color:var(--ui-text,#2a1a10);box-shadow:0 3px 10px rgba(0,0,0,.25);cursor:pointer;transition:transform .15s,opacity .2s}
#pmano button:active{transform:scale(.94)}#pmano .on{background:var(--ui-accent,#2e7d4f);color:var(--ui-on,#fff)}
#pmano .n{animation:pmIn .28s cubic-bezier(.2,1.4,.4,1) both}@keyframes pmIn{from{opacity:0;transform:translateX(-8px) scale(.8)}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const el=document.createElement('div');el.id='pmano';
function mia(){try{const G=V&&V.G;return G&&G.hands&&Array.isArray(G.hands[V.me])?G.hands[V.me].length:null}catch(e){return null}}
function pinta(){const n=mia();el.innerHTML=`<button class="${abierto?'on':''}" data-t>Mano${n!=null?' '+n:''}</button>`+
 (abierto?NS.map((k,j)=>`<button class="n${k===n?' on':''}" style="animation-delay:${j*.03}s" data-n="${k}">${k}</button>`).join(''):'')}
el.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.t!=null){abierto=!abierto;pinta();return}
 const G=V&&V.G,r=G?G.round||0:0,np=V&&V.players?Math.max(2,Math.min(5,V.players.length)):4;location.href=`/prueba?mano=${b.dataset.n}&r=${r}&n=${np}`};
function mira(){const ok=typeof gnow=='function'&&gnow()==='continental'&&!!document.querySelector('#app .m2d')&&typeof V!='undefined'&&V&&V.G;
 if(ok&&!el.isConnected){document.body.appendChild(el);pinta()}else if(!ok&&el.isConnected){el.remove();abierto=false}
 else if(ok&&!abierto){const n=mia(),t=el.querySelector('[data-t]');if(t&&t.textContent!=='Mano'+(n!=null?' '+n:''))pinta()}}
setInterval(mira,700);
window.PMANO={pinta};
})();
