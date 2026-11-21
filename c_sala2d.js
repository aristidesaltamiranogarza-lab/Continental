// c_sala2d.js — SL2D: la sala de espera nueva (SALA, c_sala.js) cuando no hay casa 3D (modo Ligero y continental.html).
// En lugar de la casa va una mesa 2D vista desde arriba, del color del juego, con la gente sentada alrededor y la AI en las sillas libres.
// c_sala.js llama SL2D.ok(), SL2D.monta(el) y SL2D.pinta(...). Estilos: ui_sala.css (sección "sin casa").
(function(){
const $=id=>document.getElementById(id);
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ini=n=>es((Array.from(String(n||'?').trim())[0]||'?').toUpperCase());
const casa=()=>!!(window.CASA3D&&CASA3D.on&&CASA3D.on());
let css=false,sig='';
function ok(){if(casa())return false;if(!css&&!document.querySelector('link[href="ui_sala.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='ui_sala.css';document.head.appendChild(l)}css=true;return true}
function monta(el){document.documentElement.classList.add('sala2d');if($('slF2'))return;const f=document.createElement('div');f.id='slF2';f.className='sl-f2';f.setAttribute('aria-hidden','true');
 f.innerHTML='<div class="sl-f2a"><div class="sl-f2m"><div class="sl-f2p"><span class="sl-f2i" id="slF2i"></span></div><div class="sl-f2s" id="slF2s"></div></div></div>';el.prepend(f)}
function quita(){document.documentElement.classList.remove('sala2d');sig=''}
// ps: jugadores (con .i), me: tu índice, libres: sillas de la AI, hola: {nombre: momento en que llegó}, col: color de cada nombre
function pinta(icon,ps,me,libres,hola,col){const i=$('slF2i');if(i&&i.dataset.k!==icon.k){i.dataset.k=icon.k;i.innerHTML=icon.h;i.classList.remove('pop');void i.offsetWidth;i.classList.add('pop')}
 const k=JSON.stringify([ps.map(p=>[p.name,p.i,p.bot]),me,libres]);if(k===sig)return;sig=k;const box=$('slF2s');if(!box)return;
 // tú abajo al centro; los demás siguen alrededor de la mesa
 const yo=Math.max(0,ps.findIndex(p=>p.i===me)),L=ps.slice(yo).concat(ps.slice(0,yo)).map(p=>({p})).concat(Array.from({length:Math.max(0,libres)},()=>({ai:1}))),n=L.length,t=performance.now();
 box.innerHTML=L.map((s,j)=>{const a=Math.PI/2+j*2*Math.PI/Math.max(n,2),x=50+Math.cos(a)*50,y=50+Math.sin(a)*50,st=`left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--d:${(j*.09).toFixed(2)}s`;
  if(s.ai)return `<div class="sl-f2x ai" style="${st}"><i>AI</i></div>`;const p=s.p,yo2=p.i===me;
  return `<div class="sl-f2x${yo2?' yo':''}${t-(hola[p.name]||-1e9)<2500?' nuevo':''}" style="${st}"><i style="--c:${col(p.name)}">${ini(p.name)}</i><b>${yo2?'Tú':es(p.name)}</b></div>`}).join('')}
window.SL2D={ok,monta,quita,pinta};
})();
