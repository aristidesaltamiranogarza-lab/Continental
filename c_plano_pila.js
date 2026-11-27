// c_plano_pila.js — PPILA: las hojas del plano 2D, una por piso (como albanene), apiladas en el mismo marco para que escalera y patio
// coincidan. Bajar: la hoja de arriba se levanta desde la orilla del jardín y deja ver la de abajo; subir: la del piso de arriba cae
// encima con un rebote. Los pisos de abajo se ven tenues a través de la hoja (el sótano no: lo tapa la tierra). Varios pisos de golpe:
// las hojas pasan una tras otra. El nodo vive fuera de render(): PLANO2D lo vuelve a montar y las animaciones (WAAPI) siguen.
(function(){
const ORD=['cm1','c0','c1','c2'];   // de abajo hacia arriba: el orden de la pila
const LIFT=470,DROP=640,STEP=150;
let el=null,H={},cur='c0',rot=null,ANIMS=[],finT=0,listo=false;
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const est=(i,ci)=>i>ci?'arriba':i===ci?'actual':(ORD[i]==='cm1'?'tapada':'abajo');
const opE=s=>s==='actual'?1:s==='abajo'?.3:0;
const R=a=>rot?`rotateY(${-a}deg)`:`rotateX(${a}deg)`;   // bisagra en la orilla del jardín: arriba (vertical) o a la izquierda (girado)
const papel=()=>{if(typeof sfx=='function')try{sfx('card')}catch(e){}};
function nodo(){if(!el){el=document.createElement('div');el.className='pl-pila'}return el}
// rehace las hojas si cambió el giro (o la primera vez); svgDe(f) da el dibujo de cada piso. Devuelve true si las rehízo.
function arma(r,svgDe,f){if(r===rot&&listo)return false;para();rot=r;if(f)cur=f;const ci=ORD.indexOf(cur);
 nodo().innerHTML=ORD.map((k,i)=>`<div class="pl-hoja ${est(i,ci)}" data-f="${k}" style="z-index:${i+1}">${svgDe(k)}<div class="pl-capa"></div><div class="pl-gente"></div></div>`).join('');
 H={};el.querySelectorAll('.pl-hoja').forEach(h=>H[h.dataset.f]=h);listo=true;return true}
function anima(e,kf,o){ANIMS.push(e.animate(kf,Object.assign({fill:'backwards'},o)))}
function para(){ANIMS.forEach(a=>{try{a.finish()}catch(e){}});ANIMS=[];clearTimeout(finT)}
const vuela=v=>{const b=el&&el.closest('.pl-box');if(b)b.classList.toggle('vuela',v)};
// ir al piso f (desde: índice de donde parte; -1 = la pila se arma desde la mesa vacía)
function ir(f,cb,desde){if(!listo){cur=f;cb&&cb();return}
 para();const a=desde!=null?desde:ORD.indexOf(cur),b=ORD.indexOf(f);if(a===b){cb&&cb();return}
 cur=f;const hs=ORD.map(k=>H[k]);
 hs.forEach((h,i)=>{h.className='pl-hoja '+est(i,b)+(i===a?'':' cae')});
 const fin=()=>{hs.forEach(h=>h.classList.remove('cae','sale'));vuela(false);const h=H[f];h.classList.remove('entra');void h.offsetWidth;h.classList.add('entra');
  finT=setTimeout(()=>h.classList.remove('entra'),1200);cb&&cb()};
 if(RM()){fin();return}
 vuela(true);
 if(b<a){
  for(let k=a,n=0;k>b;k--,n++){const d=n*STEP;
   anima(hs[k],[{transform:R(0),opacity:1,visibility:'visible'},{transform:R(52),opacity:1,offset:.55},{transform:R(92),opacity:0,visibility:'visible'}],{duration:LIFT,delay:d,easing:'cubic-bezier(.4,0,.75,.45)'});
   setTimeout(papel,d)}
  for(let k=a,n=0;k>b;k--,n++){const i=k-1;anima(hs[i],[{opacity:opE(est(i,k)),visibility:'visible'},{opacity:1,visibility:'visible'}],{duration:220,delay:n*STEP+80,easing:'ease-out'})}
 }else{
  if(a>=0)hs[a].classList.add('sale');
  for(let k=a+1,n=0;k<=b;k++,n++){const d=n*STEP;
   anima(hs[k],[{transform:R(92),opacity:0,visibility:'visible'},{transform:R(58),opacity:1,offset:.22},{transform:R(0),offset:.7},{transform:R(3.5),offset:.85},{transform:R(0),opacity:1,visibility:'visible'}],{duration:DROP,delay:d,easing:'cubic-bezier(.3,0,.45,1)'});
   if(desde==null)setTimeout(papel,d+DROP*.6)}
  for(let k=a+1,n=0;k<=b;k++,n++){const i=k-1;if(i<0)continue;anima(hs[i],[{opacity:1,visibility:'visible'},{opacity:opE(est(i,k)),visibility:'visible'}],{duration:300,delay:n*STEP+DROP*.62,easing:'ease-out'})}
 }
 finT=setTimeout(fin,(Math.abs(b-a)-1)*STEP+(b<a?LIFT:DROP))}
// entrada de la pantalla: todas las hojas arriba y, tras ms, caen desde el sótano hasta el piso f
let enT=0;
function entrada(f,ms){if(!listo)return;para();clearTimeout(enT);cur=f;ORD.forEach(k=>H[k].className='pl-hoja arriba');
 enT=setTimeout(()=>ir(f,null,-1),ms||120)}
// lo que se toca y tiene letra en la hoja de arriba (letreros, mesas): solo se cambia si cambió
function capa(html){const h=H[cur];if(!h||h._c===html)return;h._c=html;h.querySelector('.pl-capa').innerHTML=html}
window.PPILA={nodo,arma,ir,entrada,capa,para,ORD,cur:()=>cur,hoja:f=>H[f],gente:f=>H[f]&&H[f].querySelector('.pl-gente')};
})();
