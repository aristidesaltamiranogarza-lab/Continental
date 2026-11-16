// MOVIL: en pantalla táctil todos los renderizadores van con densidad máx. 1.5 (antialiasing y 60 FPS se quedan: sin ellos se ve dentado y a saltos).
// Va justo después de three.min.js. ?nomovil lo desactiva.
(function(){
if(!window.THREE||!matchMedia('(pointer:coarse)').matches||/[?&]nomovil\b/.test(location.search))return;
const B=THREE.WebGLRenderer,MAX=1.5,SH=1024;   // SH: mapa de sombra máx. 1024 (a 2048 es 4 veces el trabajo y calienta)
class R extends B{constructor(o){super(o);const sp=this.setPixelRatio.bind(this);this.setPixelRatio=v=>sp(Math.min(v||1,MAX));this.setPixelRatio(this.getPixelRatio());const sm=this.shadowMap,sr=sm.render.bind(sm);sm.render=(L,sc,cam)=>{for(const l of L){const z=l.shadow&&l.shadow.mapSize;if(z&&(z.x>SH||z.y>SH)){z.set(Math.min(z.x,SH),Math.min(z.y,SH));if(l.shadow.map){l.shadow.map.dispose();l.shadow.map=null}}}return sr(L,sc,cam)}}}
THREE.WebGLRenderer=R;window.MOVIL={MAX};
})();
