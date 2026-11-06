// Pantallas clásicas (2D) de Continental, UNO y Monopoly Deal dentro de la casa 3D en estilo Cálida (skill casa-ui):
// fin de ronda, final, sala sin casa y la "Vista clásica 2D". Cada juego tiene su color (html[data-gcol], también en su 3D).
// No toca c_continental.js, c_uno.js, c_monopolydeal.js ni style.css (los comparte el 2D Ligero): pone html.g2dui y los estilos van en ui_juegos.css.
(function(){
if(typeof GM=='undefined'||!window.UI)return;
const R=document.documentElement,JUEGOS={continental:1,uno:1,monopolydeal:1},OTRA=['c3on','u3on','h3on','sala3d','lbon','mdui'];
const juego=()=>typeof S!='undefined'&&!!S&&typeof V!='undefined'&&!!V&&JUEGOS[V.game]?V.game:'';
function sync(){const g=juego();if((R.dataset.gcol||'')!==g){if(g)R.dataset.gcol=g;else delete R.dataset.gcol}
 const a=!!g&&!OTRA.some(c=>R.classList.contains(c))&&!document.getElementById('gjBar');
 if(a!==R.classList.contains('g2dui'))R.classList.toggle('g2dui',a)}
Object.keys(JUEGOS).forEach(k=>{const g=GM[k];if(!g)return;const a0=g.after;g.after=function(){if(a0)a0.apply(this,arguments);sync()}});
setInterval(sync,300);
})();
