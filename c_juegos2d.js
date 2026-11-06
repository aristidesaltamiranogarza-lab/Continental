// "Vista clásica 2D" de Continental y UNO dentro de la casa 3D, en estilo Cálida (skill casa-ui).
// No toca c_continental.js, c_uno.js ni style.css (los comparte el 2D Ligero): pone html.g2dui y los estilos van en ui_juegos.css.
(function(){
if(typeof GM=='undefined'||!window.UI)return;
const R=document.documentElement,FASES={play:1,end:1,final:1};
const on=()=>typeof S!='undefined'&&!!S&&typeof V!='undefined'&&!!V&&(V.game==='continental'||V.game==='uno')&&!!V.G&&!!FASES[V.G.phase]&&!document.getElementById('gjBar');
const sync=()=>{const a=on();if(a!==R.classList.contains('g2dui'))R.classList.toggle('g2dui',a)};
['continental','uno'].forEach(k=>{const g=GM[k];if(!g)return;const a0=g.after;g.after=function(){if(a0)a0.apply(this,arguments);sync()}});
setInterval(sync,400);
})();
