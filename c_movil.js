// MOVIL: en pantalla táctil todos los renderizadores van sin antialiasing y con densidad máx. 1.25 (el tope de 30 FPS está en c_fps.js).
// Va justo después de three.min.js. ?nomovil lo desactiva.
(function(){
if(!window.THREE||!matchMedia('(pointer:coarse)').matches||/[?&]nomovil\b/.test(location.search))return;
const B=THREE.WebGLRenderer,MAX=1.25;
class R extends B{constructor(o){super(Object.assign({},o,{antialias:false}));const sp=this.setPixelRatio.bind(this);this.setPixelRatio=v=>sp(Math.min(v||1,MAX));this.setPixelRatio(this.getPixelRatio())}}
THREE.WebGLRenderer=R;window.MOVIL={MAX};
})();
