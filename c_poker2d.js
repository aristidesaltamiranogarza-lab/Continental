// c_poker2d.js — PK2D: vista 2D del Póker (P5). Panel plano con las comunes, los botes y cada asiento (cartas, apuesta, última jugada, resultado);
// los botones siguen en la barra de PKH. PKH.hud lo incluye (PK2D.html(v,s,sinT)) y su botón "2D" (PK2D.boton()). Se recuerda en localStorage pk_2d.
// Reusa las cartas y el panel del Blackjack 2D (.bj2…, ui_juegos.css); lo propio va en .pk2….
(function(){
let on=false,vio=new Set(),quieto=false,firma=false,mano=null;
try{on=localStorage.getItem('pk_2d')==='1'}catch(e){}
const es=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const mon=f=>'$'+Math.round(Math.abs(f||0)).toLocaleString('es-MX');
const PALO=['♠','♥','♦','♣'],RANGO=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],CALLE=['Antes del flop','Flop','Turn','River'];
const ACC={ciega:'Ciega',pasar:'Pasa',igualar:'Iguala',subir:'Sube a',apostar:'Apuesta',todo:'Todo',retirar:'Se retira'};
function carta(c,k){const nv=!firma&&!quieto&&!vio.has(k);if(!firma)vio.add(k);
 if(c<0)return `<i class="bj2c tap${nv?' nv':''}" aria-label="Carta tapada"></i>`;
 c%=52;const r=c%13,p=c/13|0,rojo=p==1||p==2;
 return `<i class="bj2c${rojo?' r':''}${nv?' nv':''}" aria-label="${RANGO[r]} de ${['picas','corazones','diamantes','tréboles'][p]}"><b>${RANGO[r]}</b><span>${PALO[p]}︎</span></i>`}
function fila(v,s,i,j){const a=v.as[i],yo=i===s,tu=v.fase==='mano'&&v.turno===i,fin=v.fase==='fin';
 const fic=[i===v.btn?'D':'',i===v.sb?'CC':'',i===v.bb?'CG':''].filter(Boolean).map(t=>`<em class="pk2d">${t}</em>`).join('');
 const cs=a.jug&&a.c&&a.c.length&&!(a.fold&&!yo&&!a.mos)?`<div class="bj2cs${a.fold?' pk2f':''}">${a.c.map((c,m)=>carta(c,i+':'+m+':'+c)).join('')}</div>`:'';
 let est;
 if(!a.jug)est=`<span class="bj2v">${v.fase==='espera'?'Esperando':'Siguiente mano'}</span>`;
 else if(fin&&(a.neta||a.nom)){const r=(v.res||[]).find(r=>r.g.includes(i)),nom=a.nom||(r&&r.nom)||'';
  est=`<span class="bj2t${a.neta>0?' gana':a.neta<0?' pierde':''}">${a.neta?`${a.neta>0?'+':'−'}${mon(a.neta)}`:''}${a.neta&&nom?' ':''}${es(nom)}</span>`}
 else if(a.fold)est=`<span class="bj2v">Se retira</span>`;
 else{const ac=a.acc&&!fin?`${ACC[a.acc.o]||''}${a.acc.v&&a.acc.o!=='todo'?' '+mon(a.acc.v):''}`:'';
  est=`${a.ap?`<span class="bj2t${tu?' on':''}">${mon(a.ap)}</span>`:''}${a.allin?'<span class="bj2v">Todo</span>':ac?`<span class="bj2v">${ac}</span>`:''}`}
 const jug=yo&&j?`<small class="pk2j">${es(j.nom)} · ${j.p} %${j.o?` · ${j.o} outs`:''}</small>`:'';
 return `<div class="bj2s${yo?' yo':''}${tu?' on':''}${a.fold?' pk2o':''}"><div class="bj2n"><b>${yo?'Tú':es(a.n)}</b><small>${mon(a.f)}</small></div>
  <div class="bj2ms">${cs}<div class="bj2i"><div class="pk2e">${fic}${est}</div>${jug}</div></div></div>`}
function html(v,s,sinT,j){if(!on||!v)return '';firma=!!sinT;
 if(v.mano!==mano){mano=v.mano;vio.clear()}   // mano nueva: se olvidan las cartas vistas
 const mesa=[0,1,2,3,4].map(k=>k<v.mesa.length?carta(v.mesa[k],'m:'+k+':'+v.mesa[k]):'<i class="bj2c pk2h" aria-hidden="true"></i>').join('');
 const B=v.botes||[],bt=B.length?B.map((b,k)=>`<span class="bj2t">${B.length>1?(k?'Bote '+(k+1):'Principal'):'Bote'} ${mon(b.v)}</span>`).join(''):'';
 const cab=v.fase==='espera'?'Esperando jugadores':v.fase==='fin'?(v.res&&v.res.some(r=>r.nom)?'Showdown':'Fin de la mano'):CALLE[v.calle]||'';
 const orden=v.as.map((a,i)=>i).filter(i=>v.as[i]).sort((x,y)=>(y===s)-(x===s)||x-y);
 const out=`<div class="ui bj2 pk2" role="region" aria-label="Mesa de Póker en 2D"><div class="bj2cr pk2m"><div class="bj2n"><b>${cab}</b></div>
  <div class="pk2c"><div class="bj2cs pk2cs">${mesa}</div><div class="pk2b">${bt}</div></div></div>
  <div class="bj2l">${orden.map(i=>fila(v,s,i,j)).join('')}</div></div>`;
 if(!firma)quieto=false;return out}
function boton(){return `<button class="ui-rb bj2b${on?' on':''}" onclick="PK2D.tog()" title="${on?'Volver a la vista 3D':'Vista 2D'}" aria-label="Vista 2D" aria-pressed="${on}">2D</button>`}
const cls=()=>document.documentElement.classList.toggle('pk2on',on);cls();
function tog(){on=!on;cls();quieto=true;vio.clear();try{localStorage.setItem('pk_2d',on?'1':'0')}catch(e){}if(typeof sfx=='function')sfx('tick');if(typeof render=='function')render()}
window.PK2D={html,boton,tog,on:()=>on};
})();
