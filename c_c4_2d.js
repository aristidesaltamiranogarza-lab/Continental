// Conecta 4 en 2D: el tablero plano dentro de la ventanita del Conecta 4 de la casa (GHUD.win de c_juegos3d.js).
// Se juega tocando una columna (JG3.tap, igual que en el tablero 3D). Estilos en ui_juegos.css (.c42). Se oculta con su botón (localStorage c4_2d).
(function(){
let on=true,lk='',t0=0;
try{on=localStorage.getItem('c4_2d')!=='0'}catch(e){}
const now=()=>performance.now();
// g: partida {id,b,last,line,st,turn,p}; mi: mi lugar (0/1); my: es mi turno
function html(g,mi,my){
 if(!on)return `<button class="ui-btn ghost c42t" onclick="C42D.tog()">Ver tablero 2D</button>`;
 const k=g.id+':'+g.last;if(k!==lk){lk=k;t0=g.last>=0?now():0}
 const el=t0?now()-t0:1e9,line=g.line||[];let s='';
 for(let c=0;c<7;c++){const full=!!g.b[35+c];let h='';
  for(let r=5;r>=0;r--){const x=r*7+c,v=g.b[x];let cl='c42h',st='';
   if(v){if(line.includes(x))cl+=' w';if(x===g.last&&el<450){cl+=' l';st=` style="--f:${6-r};--d:${-Math.round(el)}ms"`}}
   h+=`<i class="${cl}"${st}>${v?`<i class="c4m ${v==2?'y':'r'}"></i>`:''}</i>`}
  s+=`<button class="c42c" aria-label="Columna ${c+1}" onclick="JG3.tap({t:'c4',c:${c}})"${my&&!full?'':' disabled'}>${h}</button>`}
 return `<div class="c42${my?' my':''}">${s}</div><button class="ui-btn ghost c42t" onclick="C42D.tog()">Ocultar tablero 2D</button>`}
window.C42D={html,tog:()=>{on=!on;try{localStorage.setItem('c4_2d',on?'1':'0')}catch(e){}if(typeof sfx=='function')sfx('tick');if(typeof render=='function')render()}};
})();
