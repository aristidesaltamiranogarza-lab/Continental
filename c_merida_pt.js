// Mérida en Venta: retratos 2D de los jugadores (MPT) en lugar de la ficha en la barra, los paneles y la ficha de título.
// AV2D dibuja el busto una vez por personaje (uno a la vez, cuando el navegador está libre) y se guarda como imagen; mientras tanto se ve la ficha.
// reac(k,cara,ms): el retrato cambia de cara un rato (feliz al cobrar renta, triste o enojo al pagarla; caras de AV2D.CARAS) y da un brinquito.
// Las caras se dibujan después de todos los bustos, también cuando el navegador está libre.
(function(){
const PT=new Map(),cola=[],REAC={},CARAS=['feliz','triste','enojo'];let ocupado=false;
function cod(k){if(typeof V=='undefined')return '';const p=(V.players||[])[k]||{},n=(V.G&&V.G.players[k]&&V.G.players[k].name)||p.name||'';
 return p.av||(window.MPJ&&MPJ.codigo?MPJ.codigo(n):'')}
const libre=f=>window.requestIdleCallback?requestIdleCallback(f,{timeout:2500}):setTimeout(f,300);
function pide(q,ya){if(PT.has(q))return;PT.set(q,null);if(ya)cola.unshift(q);else cola.push(q);sigue()}
function sigue(){if(ocupado)return;const q=cola.shift();if(!q)return;ocupado=true;const [c,v]=q.split('|');
 libre(async()=>{try{const ex=v&&AV2D.CARAS?AV2D.CARAS[v]:{};const cv=await AV2D.retrato(c,{tam:96,plano:'busto',giro:.35,fondo:null,...ex});PT.set(q,cv.toDataURL('image/png'))}catch(e){PT.set(q,'')}
  ocupado=false;pon(c);if(!v&&AV2D.CARAS)CARAS.forEach(x=>pide(c+'|'+x));setTimeout(sigue,60)})}
// la imagen vigente de k: su reacción si está dibujada y no ha pasado, si no el busto
function url(k,c){const r=REAC[k];return (r&&r.hasta>Date.now()&&PT.get(c+'|'+r.t))||PT.get(c)||''}
function pon(c){document.querySelectorAll(`.mu-tok[data-c="${c}"]`).forEach(e=>{const u=url(+e.dataset.k,c),i=e.querySelector('img');if(!u)return;if(!i)e.innerHTML=`<img src="${u}" alt="">`;else if(i.getAttribute('src')!==u)i.src=u})}
// img(k): {c: código del personaje, u: imagen lista o ''}
function img(k){const c=cod(k);if(!c||!window.AV2D)return {c:'',u:''};pide(c);return {c,u:url(k,c)}}
function reac(k,t,ms){const c=cod(k);if(!c||!window.AV2D)return;ms=ms||2600;REAC[k]={t,hasta:Date.now()+ms};pide(c+'|'+t,1);
 const ve=()=>{pon(c);document.querySelectorAll(`.mu-tok[data-k="${k}"]`).forEach(e=>{try{e.animate(t=='feliz'?[{transform:'none'},{transform:'translateY(-5px) scale(1.12)'},{transform:'none'}]:[{transform:'none'},{transform:'translateX(-2px)'},{transform:'translateX(2px)'},{transform:'none'}],{duration:t=='feliz'?420:300,iterations:t=='feliz'?1:2})}catch(_){}})};
 ve();setTimeout(ve,400);setTimeout(()=>pon(c),ms+60)}
window.MPT={img,reac};
})();
