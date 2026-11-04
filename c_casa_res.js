// c_casa_res.js — RES: resolución automática de la casa 3D (D7). Si la casa dibuja a menos de 50 cuadros por segundo durante 4 s,
// baja la densidad de pixeles de 0.25 en 0.25 hasta 1. Si al bajar no gana al menos 4 cuadros (el cuello no es la tarjeta), la regresa
// y ya no lo intenta. Se reinicia al cambiar la calidad. Solo mide cuando la casa dibuja cada cuadro y sin tirones de carga (>200 ms).
(function(){
let tope=0,muerto=false,prueba=null,malas=0,q0,p0,t0=0,n=0,f0=0,dmax=0,last=0;
function ventana(R,fps){const pr=R.getPixelRatio();
 if(prueba){const p=prueba;prueba=null;if(fps<p.fps*1.08){tope=p.de;R.setPixelRatio(p.de);muerto=true;console.info('[RES] bajar la resolución no ayudó, se queda en',p.de);return}}
 if(fps>=50||pr<=1){malas=0;return}
 if(++malas<2)return;malas=0;const nv=Math.max(1,Math.round((pr-.25)*4)/4);prueba={de:pr,fps};tope=nv;R.setPixelRatio(nv);
 console.info('[RES]',Math.round(fps),'fps: densidad',pr,'→',nv)}
function tick(now){requestAnimationFrame(tick);const R=window.CASA3D&&CASA3D.R&&CASA3D.R();
 if(!R||!R.info||document.hidden){t0=0;return}
 if(window.CALIDAD!==q0){q0=window.CALIDAD;tope=0;muerto=false;prueba=null;malas=0}
 const pi=CASA3D.piso&&CASA3D.piso();if(pi!==p0){p0=pi;muerto=false;prueba=null;malas=0;t0=0;return}   // cada piso se prueba aparte
 if(tope&&R.getPixelRatio()>tope)R.setPixelRatio(tope);   // la casa pone la suya al cambiar de piso o de calidad
 const fr=R.info.render.frame;if(!t0){t0=last=now;n=0;f0=fr;dmax=0;return}
 dmax=Math.max(dmax,now-last);last=now;n++;if(now-t0<2000)return;
 if(!muerto&&fr-f0>=n*.9&&dmax<200)ventana(R,n*1000/(now-t0));
 t0=now;n=0;f0=fr;dmax=0}
requestAnimationFrame(tick);
window.RES={info:()=>({tope,muerto}),reinicia:()=>{tope=0;muerto=false;prueba=null;malas=0}};
})();
