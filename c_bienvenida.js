// Bienvenida: nombre (obligatorio, con uno chistoso al azar) y calidad, antes de entrar al lobby.
// Ligero = la pantalla 2D clásica; Medio = casa 3D sin sombras, pixelRatio 1 y menos luces; Completo = todo.
// Se guarda en el dispositivo (cont_n, casa_cal; casa_cal3 = la última calidad 3D). window.CALIDAD lo leen
// los demás módulos. También: nombres del lobby (lobbyName) y el vigilante de FPS de los primeros segundos.
// Se carga después de game.js y ANTES de c_casa3d.js (que llama a BIEN.pend / toggled / watch).
(function(){
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const Q=['ligero','medio','completo'],QN={ligero:'Ligero',medio:'Medio',completo:'Completo'};
const touchy=matchMedia('(pointer:coarse)').matches,inGame=()=>typeof S!=='undefined'&&!!S;
let saved=ls.get('casa_cal');if(!Q.includes(saved))saved=null;
window.CALIDAD=saved||(ls.get('casa_3d')==='0'?'ligero':'completo');
let last3=ls.get('casa_cal3');if(last3!=='medio'&&last3!=='completo')last3=CALIDAD!=='ligero'?CALIDAD:'medio';

// nombres solo para las etiquetas del lobby (dentro de cada juego se queda el suyo)
const LN={merida:'Monopoly',haciendas:'YuCATÁN'};
window.lobbyName=k=>LN[k]||(typeof GM!=='undefined'&&GM[k]?GM[k].name:k);

const NB=['Tío Lentejas','Doña Chaya','Don Panucho','Tía Chacha','Primo Huach','Don Salbut','Tía Marquesita','Don Papadzul',
 'Doña Tamal','Tío Cochito','Nena Habanera','Compa Xcatic','Don Codzito','Tía Pibipollo','Primo Kibi','Doña Horchata'];
function rnd(){const b=NB[Math.random()*NB.length|0],n=b+' '+(10+Math.random()*90|0);return n.length<=14?n:b}

const css=document.createElement('style');css.textContent=`
#bnv{position:fixed;inset:0;z-index:1000;overflow:auto;background:var(--ui-scrim);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:var(--ui-text);
 display:flex;align-items:flex-start;justify-content:center;padding:max(16px,4vh) 16px 24px;font:700 15px/1.3 var(--ui-font)}
#bnv .bnv-box{width:100%;max-width:600px;background:var(--ui-sheet);border:1px solid var(--ui-line);border-radius:var(--ui-r);padding:22px 18px;box-shadow:var(--ui-shadow)}
#bnv h1{margin:0 0 14px;font:800 1.5em var(--ui-font);text-align:center;color:var(--ui-text)}
#bnv .bnv-l{display:block;margin:14px 0 6px;font-weight:700;font-size:.9em;color:var(--ui-sub)}
#bnv .bnv-n{display:flex;gap:8px}
#bnv input{flex:1;min-width:0;min-height:48px;font:700 18px var(--ui-font);padding:0 16px;border-radius:14px;border:1px solid var(--ui-line);background:var(--ui-field);color:var(--ui-text)}
#bnv input:focus{outline:none;border-color:var(--ui-accent)}
#bnv button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation}
#bnv .bnv-dado{width:52px;min-height:48px;font-size:24px;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-chip)}
#bnv .bnv-e{min-height:1.2em;margin-top:4px;color:var(--ui-accent);font-size:.9em}
#bnv .bnv-q{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
#bnv .bnv-c{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 10px;min-height:132px;border-radius:18px;border:2px solid transparent;background:var(--ui-chip);text-align:center}
#bnv .bnv-c[aria-checked="true"]{border-color:var(--ui-accent)}
#bnv .bnv-i{font-size:30px}#bnv .bnv-c b{font-size:1.05em;font-weight:800}#bnv .bnv-c small{color:var(--ui-sub);font-size:.82em;font-weight:600;line-height:1.3}
#bnv .bnv-go{display:block;width:100%;min-height:52px;margin-top:18px;font-size:1.15em;font-weight:800;border:0;border-radius:999px;background:var(--ui-accent);color:var(--ui-on)}
#bnv .bnv-p{margin-top:10px;text-align:center;color:var(--ui-sub);font-size:.82em;font-weight:600}
@media (max-width:520px){#bnv .bnv-q{grid-template-columns:1fr}#bnv .bnv-c{flex-direction:row;min-height:0;text-align:left;gap:12px;padding:12px}
 #bnv .bnv-c span:last-child{display:flex;flex-direction:column}}
#h3cal{font:inherit;font-size:.9em;padding:4px 2px;border-radius:8px;max-width:96px}
.bnv-fps{position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:60;max-width:calc(100vw - 32px);display:flex;align-items:center;gap:8px;flex-wrap:wrap;
 padding:8px 10px 8px 14px;font-size:.92em}
.bnv-fps button{font:inherit;padding:4px 12px;cursor:pointer}`;
document.head.appendChild(css);

const CARD={ligero:['🪶','Ligero','Pantalla 2D clásica. Para celulares sencillos.'],medio:['⚡','Medio','Casa 3D sin sombras. Va bien en casi todo.'],
 completo:['✨','Completo','Casa 3D con sombras y todas las luces.']};
const pend=()=>!!document.getElementById('bnv');
function show(){
 let q=saved||(touchy?'medio':'completo');
 const el=document.createElement('div');el.id='bnv';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','bnvt');
 el.innerHTML=`<div class="bnv-box"><h1 id="bnvt">🏠 Casa de juegos</h1>
 <label class="bnv-l" for="bnvn">¿Cómo te llamas?</label>
 <div class="bnv-n"><input id="bnvn" maxlength="14" autocomplete="nickname" spellcheck="false"><button type="button" class="bnv-dado" title="Otro nombre al azar" aria-label="Otro nombre al azar">🎲</button></div>
 <div class="bnv-e" id="bnve" aria-live="polite"></div>
 <div class="bnv-l" id="bnvql">¿Cómo quieres verla?</div>
 <div class="bnv-q" role="radiogroup" aria-labelledby="bnvql">${Q.map(k=>{const [i,t,d]=CARD[k];return `<button type="button" class="bnv-c" role="radio" aria-checked="${k===q}" data-q="${k}"><span class="bnv-i">${i}</span><span><b>${t}</b><small>${d}</small></span></button>`}).join('')}</div>
 <button type="button" class="bnv-go">Entrar</button>
 <div class="bnv-p">La calidad se puede cambiar después en la barra de arriba.</div></div>`;
 document.body.appendChild(el);
 const inp=el.querySelector('#bnvn'),err=el.querySelector('#bnve');
 inp.value=(typeof pname!=='undefined'&&pname.trim())||rnd();
 inp.oninput=()=>{if(inp.value.trim())err.textContent=''};
 inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
 el.querySelector('.bnv-dado').onclick=()=>{inp.value=rnd();err.textContent=''};
 el.querySelectorAll('.bnv-c').forEach(b=>b.onclick=()=>{q=b.dataset.q;el.querySelectorAll('.bnv-c').forEach(c=>c.setAttribute('aria-checked',c===b))});
 el.querySelector('.bnv-go').onclick=go;
 function go(){const n=inp.value.trim();if(!n){err.textContent='Escribe un nombre para entrar.';inp.focus();return}
  pname=n;ls.set('cont_n',n);el.remove();saved=q;keep(q);
  const C=window.CASA3D;if(C&&C.on()!==(q!=='ligero'))casaToggle();else if(typeof render=='function')render()}
}
function keep(q){CALIDAD=q;ls.set('casa_cal',q);if(q!=='ligero'){last3=q;ls.set('casa_cal3',q)}}

// cambiar la calidad desde la barra (o desde el aviso de FPS)
function set(q){if(!Q.includes(q)||q===CALIDAD)return;keep(q);const C=window.CASA3D;if(!C)return;
 const want=q!=='ligero';if(C.on()!==want)casaToggle();else if(want){C.calidad(q);watch();if(typeof render=='function')render()}}
// la casa se prendió o apagó con su botón: Ligero, o la última calidad 3D
function toggled(on){keep(on?last3:'ligero');if(on)watch()}

// vigilante de FPS: los primeros ~5 s en 3D (sin contar el primer segundo, que compila shaders)
let w=null;
function watch(){const me={n:0,t0:0};w=me;if(CALIDAD==='ligero')return;
 const f=t=>{if(w!==me)return;if(document.hidden){w=null;return}
  if(!me.t0)me.t0=t+1000;else if(t>=me.t0){me.n++;if(t-me.t0>=5000){w=null;const fps=me.n*1000/(t-me.t0);if(fps<30)warn(fps);return}}
  requestAnimationFrame(f)};requestAnimationFrame(f)}
function warn(fps){if(CALIDAD==='ligero'||inGame()||!window.CASA3D||!CASA3D.on())return;const lo=CALIDAD==='completo'?'medio':'ligero';
 let el=document.getElementById('bnvfps');if(el)el.remove();
 el=document.createElement('div');el.id='bnvfps';el.className='bnv-fps';el.setAttribute('role','status');
 el.innerHTML=`<span>🐢 Va algo lento (${Math.round(fps)} FPS). ¿Probar en <b>${QN[lo]}</b>?</span><button type="button" data-q="${lo}">Bajar</button><button type="button" aria-label="Cerrar aviso">✕</button>`;
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;el.remove();if(b.dataset.q)set(b.dataset.q)};
 document.body.appendChild(el);setTimeout(()=>el.remove(),20000)}

// selector para la barra de la casa (junto al nombre)
const sel=()=>`<select id="h3cal" onchange="BIEN.set(this.value)" title="Calidad" aria-label="Calidad">${Q.map(k=>`<option value="${k}"${k===CALIDAD?' selected':''}>${QN[k]}</option>`).join('')}</select>`;

window.BIEN={pend,set,toggled,watch,sel,show:()=>{if(!pend())show()}};
const nm=(ls.get('cont_n')||'').trim();
if((!nm||!saved)&&!inGame())show();
})();
