// Mérida en Venta: retratos 2D de los jugadores (MPT) en lugar de la ficha en la barra, los paneles y la ficha de título.
// AV2D dibuja el busto una vez por personaje (uno a la vez, cuando el navegador está libre) y se guarda como imagen; mientras tanto se ve la ficha.
(function(){
const PT=new Map(),cola=[];let ocupado=false;
function cod(k){if(typeof V=='undefined')return '';const p=(V.players||[])[k]||{},n=(V.G&&V.G.players[k]&&V.G.players[k].name)||p.name||'';
 return p.av||(window.MPJ&&MPJ.codigo?MPJ.codigo(n):'')}
const libre=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:2500}):setTimeout(f,300);
function sigue(){if(ocupado)return;const c=cola.shift();if(!c)return;ocupado=true;
 libre(async()=>{try{const cv=await AV2D.retrato(c,{tam:96,plano:'busto',giro:.35,fondo:null});PT.set(c,cv.toDataURL('image/png'))}catch(e){PT.set(c,'')}
  ocupado=false;pon(c);setTimeout(sigue,60)})}
function pon(c){const u=PT.get(c);if(!u)return;document.querySelectorAll(`.mu-tok[data-c="${c}"]`).forEach(e=>{if(!e.querySelector('img'))e.innerHTML=`<img src="${u}" alt="">`})}
// img(k): {c: código del personaje, u: imagen lista o ''}
function img(k){const c=cod(k);if(!c||!window.AV2D)return {c:'',u:''};if(!PT.has(c)){PT.set(c,null);cola.push(c);sigue()}return {c,u:PT.get(c)||''}}
window.MPT={img};
})();
