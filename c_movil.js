// MOVIL: en pantalla táctil todos los renderizadores van con densidad máx. 1.5 (antialiasing y 60 FPS se quedan: sin ellos se ve dentado y a saltos).
// Va justo después de three.min.js. ?nomovil lo desactiva.
(function(){
if(!window.THREE||!matchMedia('(pointer:coarse)').matches||/[?&]nomovil\b/.test(location.search))return;
const B=THREE.WebGLRenderer,MAX=1.5;
class R extends B{constructor(o){super(o);const sp=this.setPixelRatio.bind(this);this.setPixelRatio=v=>sp(Math.min(v||1,MAX));this.setPixelRatio(this.getPixelRatio())}}
THREE.WebGLRenderer=R;window.MOVIL={MAX};
})();
