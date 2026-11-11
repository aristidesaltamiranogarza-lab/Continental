// c_blackjack2d.js — BJ2D: vista 2D del Blackjack (B5). Panel plano con las cartas del crupier y de cada asiento; los botones siguen en la barra de BJH.
// BJH.hud lo incluye (BJ2D.html(v,s)) y su botón "2D" (BJ2D.boton()). Se recuerda en localStorage bj_2d. Estilos en ui_juegos.css (.bj2…).
(function(){
let on=false,vio=new Set(),quieto=false,firma=false;
try{on=localStorage.getItem('bj_2d')==='1'}catch(e){}
const es=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const mon=f=>'$'+Math.round(Math.abs(f||0)).toLocaleString('es-MX');
const PALO=['♠','♥','♦','♣'],RANGO=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RES={bj:'Blackjack',gana:'Gana',pierde:'Pierde',pasa:'Se pasa',empate:'Empate',rinde:'Se rinde'};
const total=h=>h.bj?'Blackjack':h.s&&h.t<=21?`${h.t-10} o ${h.t}`:String(h.t);
// k: clave única de la carta en la ronda (para animar solo las nuevas)
function carta(c,k){const nv=!firma&&!quieto&&!vio.has(k);if(!firma)vio.add(k);
 if(c<0)return `<i class="bj2c tap${nv?' nv':''}" aria-label="Carta tapada"></i>`;
 c%=52;const r=c%13,p=c/13|0,rojo=p==1||p==2,ps=PALO[p]+'︎';
 return `<i class="bj2c${rojo?' r':''}${nv?' nv':''}" aria-label="${RANGO[r]} de ${['picas','corazones','diamantes','tréboles'][p]}"><b>${RANGO[r]}</b><span>${ps}</span></i>`}
function mano(h,i,m,act){const k=`${i}:${m}:`,r=h.res,cl=r?(h.neta>0?' gana':h.neta<0?' pierde':''):act?' on':'';
 return `<div class="bj2m${act?' on':''}"><div class="bj2cs">${h.c.map((c,j)=>carta(c,k+j+':'+c)).join('')}</div>
  <div class="bj2i"><span class="bj2t${cl}">${r?`${RES[r]||r}${h.neta?` ${h.neta>0?'+':'−'}${mon(h.neta)}`:''}`:total(h)}</span><small>${mon(h.a)}</small></div></div>`}
function html(v,s,sinT){if(!on||!v)return '';firma=!!sinT;
 if(v.fase=='apuestas')vio.clear();   // ronda nueva: se olvidan las cartas vistas
 const t=v.fase=='turnos'&&v.turno?v.turno:null;
 const orden=v.as.map((a,i)=>i).filter(i=>v.as[i]).sort((x,y)=>(y===s)-(x===s)||x-y);
 const cr=v.cr.c.length?`<div class="bj2cs">${v.cr.c.map((c,j)=>carta(c,'cr:'+j+':'+c)).join('')}</div><span class="bj2t${v.fase=='crupier'?' on':''}">${v.cr.t}</span>`
  :`<span class="bj2v">${v.fase=='apuestas'?'Hagan sus apuestas':'Sin cartas'}</span>`;
 const filas=orden.map(i=>{const a=v.as[i],yo=i===s,tu=t&&t.s===i;
  const ms=a.manos.length?a.manos.map((h,m)=>mano(h,i,m,tu&&t.m===m)).join(''):`<span class="bj2v">${a.ap?`Apuesta ${mon(a.ap)}${a.listo?' · listo':''}`:'Sin apuesta'}</span>`;
  return `<div class="bj2s${yo?' yo':''}${tu?' on':''}"><div class="bj2n"><b>${yo?'Tú':es(a.n)}</b><small>${mon(a.f)}</small></div><div class="bj2ms">${ms}</div></div>`}).join('');
 const out=`<div class="ui bj2" role="region" aria-label="Mesa de Blackjack en 2D"><div class="bj2cr"><div class="bj2n"><b>Crupier</b></div>${cr}</div><div class="bj2l">${filas}</div></div>`;
 if(!firma)quieto=false;return out}
function boton(){return `<button class="ui-rb bj2b${on?' on':''}" onclick="BJ2D.tog()" title="${on?'Volver a la vista 3D':'Vista 2D'}" aria-label="Vista 2D" aria-pressed="${on}">2D</button>`}
const cls=()=>document.documentElement.classList.toggle('bj2on',on);cls();
function tog(){on=!on;cls();quieto=true;vio.clear();try{localStorage.setItem('bj_2d',on?'1':'0')}catch(e){}if(typeof sfx=='function')sfx('tick');if(typeof render=='function')render()}
window.BJ2D={html,boton,tog,on:()=>on};
})();
