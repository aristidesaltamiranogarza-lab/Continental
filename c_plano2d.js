// c_plano2d.js — PLANO2D: el inicio 2D como la planta de la casona vista desde arriba (SOCIAL.md S5). Pestañas por nivel (Sótano, Planta baja,
// Planta alta, Azotea), cuartos dibujados con los datos de plano_casona.js (blender/plano.py), mesas como botones con el ícono del juego:
// con partida, los retratos de quien juega alrededor; con sala esperando, un asiento libre que late. Tocar una mesa abre el mismo panel que
// CMESA en 3D (Mirar, Unirme, Crear sala). La gente de la casa (3D y 2D) sale como retratos en su lugar, con su globito si dijo algo.
// Al tocar una mesa quedas parado junto a ella: GENTE.latido manda esa posición (PLANO2D.pos) y los de 3D te ven ahí.
// c_lobby_home.js lo pone en LOBBY.home si PLANO2D.ok(). Se carga después de c_gente.js y c_casa_mesa.js. Estilos: ui_lobby.css (sección pl-).
(function(){
const NIV=[['c2','Azotea'],['c1','Planta alta'],['c0','Planta baja'],['cm1','Sótano']];
const MK={poker:'pk',blackjack:'bj'};   // mesa del GLB -> clave del inicio (CAS de c_lobby.js)
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let piso='',sel='',D=null,ult='';
const vis=()=>!!document.querySelector('.pl-box');   // el plano está en pantalla
const U=()=>window.LOBBY&&LOBBY.u;
const P=()=>window.PLANO_C;
function busca(g){const C=P();if(!C)return null;for(const f in C){const m=C[f].mesas.find(m=>m.g===g||MK[m.g]===g);if(m)return Object.assign({f},m)}return null}
// qué hace cada mesa: 'sala' (juego con salas: panel de CMESA), 'cas' (Póker/Blackjack 2D), 'bil' (Billar 2D) o '' (adorno)
function tipo(g){const u=U();if(!u)return '';const k=MK[g]||g;
 if(k==='billar')return u.b2d()?'bil':'';if(u.CAS[k])return u.c2d()?'cas':'';return u.lista().includes(k)?'sala':''}
const salas=()=>(D&&D.r)||[];
function ctx(g){const R=salas().filter(r=>r.g===g),G=GM[g]||{};
 return {g,G,name:U().nom(g),desc:'',pl:R.filter(r=>r.st=='play').reduce((a,r)=>a+r.n,0),op:R.filter(r=>r.st=='lobby'),pr:R.filter(r=>r.st=='play'&&r.w),
  code:typeof code=='string'?code:'',msg:typeof msg=='string'?msg:'',play:'PLANO2D.crea()',
  extra:G.rules?`<button class="ui-btn ghost full" onclick="CMESA.cerrar();LOBBY.pan('reg')">Cómo se juega</button>`:''}}
// ---------- dibujo ----------
const pc=(v,a,b)=>((v-a)/b*100).toFixed(2)+'%';
function cuartos(L){const [x0,z0,w,d]=L.per;
 return `<svg class="pl-svg" viewBox="${x0} ${z0} ${w} ${d}" preserveAspectRatio="none" aria-hidden="true"><rect class="pl-per" x="${x0}" y="${z0}" width="${w}" height="${d}"/>${L.areas.map(a=>{
  const k=a.c==='cuarto'?'cu':a.c==='open'?(/patio/.test(a.n)?'pa':'ab'):a.c==='void'?'va':'ti';
  return `<rect class="pl-a ${k}" x="${a.x}" y="${a.z}" width="${a.w}" height="${a.d}" rx=".25"/>`}).join('')}</svg>`}
const av=n=>window.CHUD&&CHUD.av?CHUD.av(n):`<i class="uh-av">${es((Array.from(String(n||'?'))[0]||'?').toUpperCase())}</i>`;
function mesa(m,L){const [x0,z0,w,d]=L.per,t=tipo(m.g),k=MK[m.g]||m.g,u=U(),R=salas().filter(r=>r.g===k),pr=R.filter(r=>r.st!=='lobby'),op=R.some(r=>r.st==='lobby');
 const ps=[].concat(...pr.map(r=>r.ps||[])).slice(0,5),st=`left:${pc(m.x,x0,w)};top:${pc(m.z,z0,d)}`;
 const al=ps.map((n,i)=>{const a=-Math.PI/2+(i-(ps.length-1)/2)*.75;return `<span class="pl-j" style="--x:${Math.cos(a).toFixed(2)};--y:${Math.sin(a).toFixed(2)}">${av(n)}</span>`}).join('');
 const nm=es(u.nom(k)),est=ps.length?` · ${ps.length} jugando`:op?' · sala esperando':'';
 if(!t)return `<span class="pl-m nada" style="${st}" aria-hidden="true"></span>`;
 return `<button class="pl-m${pr.length?' juega':''}${op?' esp':''}${sel===m.g?' yo':''}" style="${st};--f:${u.COL[k]||'#C2512A'}" onclick="PLANO2D.toca('${m.g}')" aria-label="${nm}${est}" title="${nm}"><span class="pl-ic">${u.ico(k)}</span>${op?'<i class="pl-lib"></i>':''}${al}</button>`}
// gente en este nivel: los de 3D en su x,z; los de 2D junto a la mesa que tocaron. Tú, junto a la tuya.
function gente(L,f){const [x0,z0,w,d]=L.per,now=performance.now(),Ps=(D&&D.p||[]).filter(p=>p.f===f&&isFinite(p.x)&&isFinite(p.z));
 const yo=pos();if(yo.f===f)Ps.push({x:yo.x,z:yo.z,name:typeof pname=='string'&&pname.trim()||'Tú',yo:1});
 return Ps.map(p=>`<span class="pl-p${p.yo?' yo':''}" style="left:${pc(p.x,x0,w)};top:${pc(p.z,z0,d)}" title="${es(p.name)}">${av(p.name)}${p.say?`<b class="pl-say">${es(String(p.say).slice(0,40))}</b>`:''}</span>`).join('')}
function tabs(){const C=P(),R=salas();
 return `<nav class="pl-tabs" role="tablist" aria-label="Nivel">${NIV.map(([f,n])=>{const L=C[f];const hay=L&&L.mesas.some(m=>R.some(r=>r.g===(MK[m.g]||m.g)))||(D&&D.p||[]).some(p=>p.f===f);
  return `<button class="pl-t${f===piso?' on':''}" role="tab" aria-selected="${f===piso}" onclick="PLANO2D.piso('${f}')">${n}${hay?'<i class="pl-dot" aria-label="hay gente"></i>':''}</button>`}).join('')}</nav>`}
function html(){const C=P();if(!C)return '';
 if(ult&&!(typeof S!='undefined'&&S)){const m=busca(ult);if(m){piso=m.f;sel=m.g}ult=''}   // saliste de una partida: vuelves junto a esa mesa
 if(!C[piso]){const m=busca(typeof pgame=='string'?pgame:'');piso=m?m.f:'c0'}
 const L=C[piso],[,,w,d]=L.per,r=(w/d).toFixed(4);
 const mp=window.CMESA&&CMESA.abierta&&CMESA.abierta()&&sel&&tipo(sel)==='sala'?CMESA.panel2d(ctx(MK[sel]||sel)):'';
 return `<div class="pl">${tabs()}<div class="pl-area"><div class="pl-box" style="aspect-ratio:${w}/${d};width:min(100cqw,calc(100cqh*${r}))">${cuartos(L)}${L.mesas.map(m=>mesa(m,L)).join('')}${gente(L,piso)}</div></div></div>${mp}`}
// ---------- acciones ----------
function toca(g){const t=tipo(g),k=MK[g]||g;sel=g;if(typeof sfx=='function')try{sfx('tick')}catch(e){}
 if(window.GENTE&&GENTE.late)GENTE.late();   // los demás te ven junto a la mesa de una vez
 if(t==='bil'){B2D.abre();return}if(t==='cas'){C2D.abre(k);return}
 if(t==='sala'){pgame=k;if(window.CMESA)CMESA.abre2d(k);render()}}
function crea(){if(!sel)return;pgame=MK[sel]||sel;if(window.CMESA)CMESA.cerrar();mk('listo')}
// dónde estás para la casa: junto a la mesa que tocaste (de frente a ella), o '2d' si no has tocado ninguna
function pos(){const m=sel&&busca(sel);if(!m||!vis())return {f:'2d',x:0,z:0,yaw:0};const r=(m.r||1.5)+1.3;return {f:m.f,x:m.x,z:m.z+r,yaw:Math.PI}}
// la respuesta de /casa (la trae GENTE.latido): salas y gente; se vuelve a dibujar solo si cambió algo que se ve
let sig='';
function casa(d){if(!d)return;D=d;if(!ok()||!vis())return;const s=JSON.stringify([d.r,(d.p||[]).map(p=>[p.f,p.x,p.z,p.name,p.say])]);if(s===sig)return;sig=s;
 if(typeof render=='function'&&!(typeof S!='undefined'&&S)&&!document.querySelector('.pl-area input:focus,.uh-mesa input:focus'))render()}
function ok(){return !!(P()&&window.LOBBY&&LOBBY.u&&window.CMESA&&CMESA.panel2d)}
setInterval(()=>{if(typeof S!='undefined'&&S&&typeof V!='undefined'&&V&&V.game)ult=V.game},1000);
window.PLANO2D={ok,html,toca,crea,pos,casa,piso:f=>{piso=f;if(window.CMESA)CMESA.cerrar();render()},visible:vis};
})();
