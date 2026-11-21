// Bienvenida: personaje (retrato, al azar o editar con MIPJ), nombre (obligatorio, uno al azar) y calidad, antes de entrar.
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

// nombres al azar: título + antojo yucateco, o antojo + apodo (máx. 14 letras, sin números)
const TT=['Tío','Tía','Don','Doña','Primo','Prima','Compa','Nena','Güero','Chato','Abue','Profe'];
const CO=['Panucho','Salbut','Chaya','Papadzul','Marquesita','Cochito','Kibi','Horchata','Pibipollo','Codzito','Xcatic','Relleno',
 'Polcán','Mamey','Pitaya','Huach','Joroch','Achiote','Tamalito','Sikilpak','Habanero','Saramuyo','Elote','Mantecado','Champola',
 'Cacahuate','Caldito','Chicharra','Lima','Queso Bola','Sopa de Lima','Pib','Dulce de Coco','Chocolomo'];
const AP=['Veloz','Feliz','Audaz','de Oro','Turbo','Mayor','Express','Real','del Rancho','Sabroso','Picante','Suertudo'];
const pick=a=>a[Math.random()*a.length|0];
function rnd(prev){for(let i=0;i<40;i++){const n=Math.random()<.65?pick(TT)+' '+pick(CO):pick(CO)+' '+pick(AP);if(n.length<=14&&n!==prev)return n}return 'Tía Pibipollo'}

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
#bnv .bnv-dado{flex:none;width:48px;height:48px;display:grid;place-items:center;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-chip);color:var(--ui-icon)}
#bnv .bnv-dado svg,#bnv .bnv-ed svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#bnv .bnv-yo{display:flex;gap:14px;align-items:center}
#bnv .bnv-av{position:relative;flex:none;width:120px;height:120px}
#bnv .bnv-ver{display:block;width:100%;height:100%;padding:0;border:0;border-radius:24px;background:var(--ui-chip);overflow:hidden}
#bnv .bnv-ver canvas{display:block;width:100%;height:100%}
#bnv .bnv-av .bnv-dado{position:absolute;right:-8px;bottom:-8px;width:44px;height:44px;background:var(--ui-sheet);box-shadow:var(--ui-shadow)}
#bnv .bnv-der{flex:1;min-width:0}#bnv .bnv-der .bnv-l{margin-top:0}
#bnv .bnv-ed{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:44px;margin-top:10px;border:1px solid var(--ui-line);border-radius:999px;background:transparent;color:var(--ui-text);font-weight:800}
#bnv .bnv-ed svg{color:var(--ui-icon);width:20px;height:20px}
#bnv .bnv-e{min-height:1.2em;margin-top:4px;color:var(--ui-accent);font-size:.9em}
#bnv .bnv-q{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
#bnv .bnv-c{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px 12px;border-radius:18px;border:2px solid transparent;background:var(--ui-chip);text-align:center}
#bnv .bnv-c[aria-checked="true"]{border-color:var(--ui-accent)}
#bnv .bnv-i{width:64px;height:52px;color:var(--ui-icon)}#bnv .bnv-i svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
#bnv .bnv-c b{font-size:1.05em;font-weight:800}#bnv .bnv-c small{color:var(--ui-sub);font-size:.85em;font-weight:700}
#bnv .bnv-go{display:block;width:100%;min-height:52px;margin-top:18px;font-size:1.15em;font-weight:800;border:0;border-radius:999px;background:var(--ui-accent);color:var(--ui-on)}
@media (max-width:420px){#bnv .bnv-av{width:96px;height:96px}#bnv .bnv-yo{gap:12px}#bnv .bnv-q{gap:8px}#bnv .bnv-c{padding:10px 4px}#bnv .bnv-i{width:52px;height:42px}}
#h3cal{font:inherit;font-size:.9em;padding:4px 2px;border-radius:8px;max-width:96px}
.bnv-fps{position:fixed;left:50%;top:72px;transform:translateX(-50%);z-index:60;max-width:calc(100vw - 32px);display:flex;align-items:center;gap:8px;flex-wrap:wrap;
 padding:8px 10px 8px 14px;font-size:.92em}
.bnv-fps button{font:inherit;padding:4px 12px;cursor:pointer}.bnv-fps svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;vertical-align:middle}`;
document.head.appendChild(css);

// dibujos en vez de texto: cartas planas (2D), casa (3D), casa con sol y sombra (3D completo)
const CASA='<path d="M10 22 24 11l14 11v14H10z"/><path d="M20 36v-8h8v8"/>';
const CARD={ligero:['<rect x="8" y="9" width="15" height="22" rx="3"/><rect x="26" y="9" width="15" height="22" rx="3"/><path d="M15.5 16v8M33.5 16v8"/>','Ligero','2D'],
 medio:[CASA,'Medio','3D'],
 completo:[CASA+'<path d="M38 36h8l-8-7" fill="currentColor" fill-opacity=".3" stroke="none"/><circle cx="41" cy="7" r="3"/><path d="M41 1v1M47 7h-1M45.2 2.8l-.7.7"/>','Completo','3D HD']};
const I=n=>window.UI&&UI.ico?UI.ico(n):'';
// retrato del personaje (el mismo de MIPJ y de la mesa 2D)
let pjGen=0;
async function pinta(box){const id=++pjGen;
 for(let i=0;i<40&&!(window.AV&&window.AV2D);i++)await new Promise(r=>setTimeout(r,250));if(!window.AV||!window.AV2D)return;
 try{await AV.listo();const cv=await AV2D.retrato(AV.mio(),{tam:240,plano:'busto',giro:.35,fondo:null});if(id===pjGen&&box.isConnected)box.replaceChildren(cv)}catch(e){}}
const pend=()=>!!document.getElementById('bnv');
function show(){
 let q=saved||(touchy?'medio':'completo');
 const el=document.createElement('div');el.id='bnv';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','bnvt');
 el.innerHTML=`<div class="bnv-box"><h1 id="bnvt">gamemash</h1>
 <div class="bnv-yo"><div class="bnv-av"><button type="button" class="bnv-ver" aria-label="Editar personaje" title="Editar personaje"></button>
  <button type="button" class="bnv-dado bnv-pjr" title="Otro personaje" aria-label="Otro personaje al azar">${I('dado')}</button></div>
 <div class="bnv-der"><label class="bnv-l" for="bnvn">Tu nombre</label>
 <div class="bnv-n"><input id="bnvn" maxlength="14" autocomplete="nickname" spellcheck="false"><button type="button" class="bnv-dado bnv-nr" title="Otro nombre" aria-label="Otro nombre al azar">${I('dado')}</button></div>
 <button type="button" class="bnv-ed">${I('persona')}Editar personaje</button></div></div>
 <div class="bnv-e" id="bnve" aria-live="polite"></div>
 <div class="bnv-l" id="bnvql">Calidad</div>
 <div class="bnv-q" role="radiogroup" aria-labelledby="bnvql">${Q.map(k=>{const [i,t,d]=CARD[k];return `<button type="button" class="bnv-c" role="radio" aria-checked="${k===q}" data-q="${k}" aria-label="${t}: ${d}"><span class="bnv-i"><svg viewBox="0 0 48 40" aria-hidden="true">${i}</svg></span><b>${t}</b><small>${d}</small></button>`}).join('')}</div>
 <button type="button" class="bnv-go">Entrar</button></div>`;
 document.body.appendChild(el);
 const inp=el.querySelector('#bnvn'),err=el.querySelector('#bnve'),ver=el.querySelector('.bnv-ver');
 inp.value=(typeof pname!=='undefined'&&pname.trim())||rnd();
 inp.oninput=()=>{if(inp.value.trim())err.textContent=''};
 inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
 el.querySelector('.bnv-nr').onclick=()=>{inp.value=rnd(inp.value);err.textContent=''};
 pinta(ver);
 el.querySelector('.bnv-pjr').onclick=()=>{if(window.AV){AV.mio(AV.azar());pinta(ver)}};
 // editar: se esconde la bienvenida mientras está abierto "Mi personaje" y al volver se redibuja
 const edita=()=>{if(!window.MIPJ||!window.AV)return;MIPJ.abrir();if(!MIPJ.abierto())return;el.style.display='none';
  const t=setInterval(()=>{if(MIPJ.abierto())return;clearInterval(t);el.style.display='';pinta(ver)},200)};
 ver.onclick=edita;el.querySelector('.bnv-ed').onclick=edita;
 el.querySelectorAll('.bnv-c').forEach(b=>b.onclick=()=>{q=b.dataset.q;el.querySelectorAll('.bnv-c').forEach(c=>c.setAttribute('aria-checked',c===b))});
 el.querySelector('.bnv-go').onclick=go;
 function go(){const n=inp.value.trim();if(!n){err.textContent='Escribe un nombre para entrar.';inp.focus();return}
  pname=n;ls.set('cont_n',n);el.remove();saved=q;keep(q);
  ls.set('cont_av_hecho','1');// ya vio (o armó) su personaje aquí
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
 el.innerHTML=`<span>Va algo lento (${Math.round(fps)} FPS). ¿Probar en <b>${QN[lo]}</b>?</span><button type="button" data-q="${lo}">Bajar</button><button type="button" aria-label="Cerrar aviso">${I('x')}</button>`;
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;el.remove();if(b.dataset.q)set(b.dataset.q)};
 document.body.appendChild(el);setTimeout(()=>el.remove(),20000)}

// selector para la barra de la casa (junto al nombre)
const sel=()=>`<select id="h3cal" onchange="BIEN.set(this.value)" title="Calidad" aria-label="Calidad">${Q.map(k=>`<option value="${k}"${k===CALIDAD?' selected':''}>${QN[k]}</option>`).join('')}</select>`;

window.BIEN={a3:()=>set(last3),pend,set,toggled,watch,sel,show:()=>{if(!pend())show()}};
const nm=(ls.get('cont_n')||'').trim();
if((!nm||!saved)&&!inGame())show();
// quien ya tenía nombre y nunca eligió personaje: le sale al cargar
else if(!ls.get('cont_av_hecho')&&!inGame())addEventListener('load',()=>setTimeout(()=>{if(window.MIPJ&&window.THREE&&!inGame())MIPJ.abrir()},1500));
})();
