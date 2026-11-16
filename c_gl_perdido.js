// GLP: si el navegador tira el contexto WebGL (iPhone lo hace con poca memoria o al volver de segundo plano),
// todo el 3D queda negro. Se pide recuperarlo; si no vuelve pronto (o vuelve a medias), se recarga la página:
// es lo mismo que hacer el jugador a mano, y la sala te regresa a tu lugar.
(()=>{let t=0,pend=false;
 const recarga=()=>{if(document.hidden){pend=true;return}location.reload()};
 addEventListener('webglcontextlost',e=>{e.preventDefault();console.warn('WebGL: contexto perdido');clearTimeout(t);t=setTimeout(recarga,2500)},true);
 // three.js vuelve a armar su estado, pero texturas y sombras no siempre regresan bien: recargar también
 addEventListener('webglcontextrestored',()=>{clearTimeout(t);t=setTimeout(recarga,300)},true);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&pend){pend=false;location.reload()}});
 window.GLP={prueba(){const c=document.querySelector('canvas'),g=c&&(c.getContext('webgl2')||c.getContext('webgl')),x=g&&g.getExtension('WEBGL_lose_context');if(x)x.loseContext()}}})();
