// c_uno_anuncio.js — UANU: anuncios de Uno. UANU.carta(c,k,x,y,txt): medalla con el símbolo de la carta (dibujado como en UCART),
// dos ondas y un listón con el texto, en (x,y) de pantalla; k = color (0..3, el elegido en comodines). UANU.pop(x,y,txt,col): listón solo.
(()=>{
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
let css=0;
function estilo(){if(css)return;css=1;const s=document.createElement('style');s.textContent=`
.ua{position:fixed;width:0;height:0;z-index:40;pointer-events:none;animation:ua-out 1.7s linear forwards}
.ua>*{position:absolute}
.ua-md,.ua-o{left:calc(var(--m)/-2);top:calc(var(--m)/-2);width:var(--m);height:var(--m)}
.ua-md{animation:ua-pop .5s cubic-bezier(.2,1.5,.4,1) both}
.ua-md canvas{display:block;width:100%;height:100%}
.ua-o{box-sizing:border-box;border-radius:50%;border:calc(var(--m)*.07) solid var(--c);opacity:0;animation:ua-onda .65s .1s ease-out both}
.ua-o.b{border-color:#FFFCF5;border-width:calc(var(--m)*.04);animation-delay:.22s}
.ua-rb{left:0;top:calc(var(--m)*.3);--ty:0%;transform-origin:50% 50%;white-space:nowrap;padding:.14em .75em .2em;border:3px solid #1C1616;border-radius:12px;
 background:var(--c);background:linear-gradient(180deg,color-mix(in srgb,var(--c) 62%,#fff) 0%,var(--c) 48%,color-mix(in srgb,var(--c) 78%,#000) 100%);
 box-shadow:0 4px 0 rgba(0,0,0,.32);animation:ua-rb .45s .16s cubic-bezier(.2,1.6,.4,1) both}
.ua-rb span{display:block;transform:skewX(10deg);font:800 clamp(18px,5.6vmin,30px)/1.15 "Nunito","Arial Rounded MT Bold","Segoe UI",system-ui,sans-serif;color:#FFFCF5;
 text-shadow:2px 0 #1C1616,-2px 0 #1C1616,0 2px #1C1616,0 -2px #1C1616,1.5px 1.5px #1C1616,-1.5px 1.5px #1C1616,1.5px -1.5px #1C1616,-1.5px -1.5px #1C1616,0 4px #1C1616}
.ua-p .ua-rb{top:0;--ty:-50%;animation-delay:0s}
.ua-p .ua-rb span{font-size:clamp(20px,6.4vmin,34px)}
.ua-s .ua-md{animation:ua-golpe .45s cubic-bezier(.5,0,.6,1.4) both}
.ua-s canvas{animation:ua-sello .5s .4s ease-out both}
.ua-r canvas{animation:ua-gira .75s .28s cubic-bezier(.6,0,.25,1) both}
.ua-w canvas{animation:ua-gira 1s .2s cubic-bezier(.5,0,.3,1) both}
.ua-d canvas,.ua-f canvas{animation:ua-tiembla .42s .32s linear both}
@keyframes ua-out{0%,76%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-28px) scale(.88)}}
@keyframes ua-pop{0%{opacity:0;transform:scale(.2) rotate(-28deg)}100%{opacity:1;transform:none}}
@keyframes ua-golpe{0%{opacity:0;transform:scale(2.6)}55%{opacity:1;transform:scale(.86)}100%{transform:none}}
@keyframes ua-onda{0%{opacity:.95;transform:scale(.75)}100%{opacity:0;transform:scale(2.3)}}
@keyframes ua-rb{0%{opacity:0;transform:translate(-50%,var(--ty)) skewX(-10deg) scaleX(.1)}100%{opacity:1;transform:translate(-50%,var(--ty)) skewX(-10deg)}}
@keyframes ua-sello{0%{transform:none}30%{transform:rotate(-14deg)}65%{transform:rotate(8deg)}100%{transform:none}}
@keyframes ua-gira{0%{transform:none}100%{transform:rotate(-360deg)}}
@keyframes ua-tiembla{0%,100%{transform:none}20%{transform:translate(-7%,2%) rotate(-5deg)}40%{transform:translate(6%,-2%) rotate(4deg)}60%{transform:translate(-4%,1%) rotate(-3deg)}80%{transform:translate(2%,0) rotate(1deg)}}`;
 document.head.appendChild(s)}
// medalla: sombra, aro de tinta, aro de papel (de cuatro colores en comodines), disco del color y el símbolo en papel con relieve
function medalla(c,k,px){const U=UCART,d=Math.min(2,devicePixelRatio||1),S=Math.round(px*d),cv=document.createElement('canvas');cv.width=cv.height=S;
 const g=cv.getContext('2d'),R=84,arc=(r,x=0,y=0)=>{g.beginPath();g.arc(x,y,r,0,7)};g.scale(S/200,S/200);g.translate(100,98);
 g.fillStyle='rgba(0,0,0,.28)';arc(R+6,3,6);g.fill();g.fillStyle=U.INK;arc(R+6);g.fill();
 if(c.c==4)[0,3,1,2].forEach((q,i)=>{g.beginPath();g.arc(0,0,R,(i-1)*Math.PI/2,i*Math.PI/2);g.arc(0,0,R*.84,i*Math.PI/2,(i-1)*Math.PI/2,true);g.closePath();g.fillStyle=U.COL[q];g.fill()});
 else{g.fillStyle=U.PAP;arc(R);g.fill()}
 g.fillStyle=U.INK;arc(R*.85);g.fill();
 const gr=g.createRadialGradient(-R*.3,-R*.35,4,0,0,R*.82);gr.addColorStop(0,U.CLA[k]);gr.addColorStop(.6,U.COL[k]);gr.addColorStop(1,U.OSC[k]);g.fillStyle=gr;arc(R*.81);g.fill();
 g.lineCap='round';g.lineWidth=4;g.strokeStyle='rgba(255,255,255,.4)';g.beginPath();g.arc(0,0,R*.68,Math.PI*1.08,Math.PI*1.5);g.stroke();
 if(c.t=='w')U.ovalo4(g,0,0,R*.36,R*.55,.42,true);else U.sym(g,c,0,0,R*1.3,U.PAP,U.OSC[k],true);
 return cv}
function pon(el,x,y,m){document.body.appendChild(el);const W=innerWidth,H=innerHeight,mx=Math.min(W/2,Math.max(m*.6,el.querySelector('.ua-rb')?.offsetWidth/2+12||0));
 el.style.left=Math.max(mx,Math.min(W-mx,x))+'px';el.style.top=Math.max(m/2+56,Math.min(H-m/2-46,y))+'px';setTimeout(()=>el.remove(),1750)}
function carta(c,k,x,y,txt){if(!window.UCART||!(k>=0))return;estilo();const m=Math.round(Math.max(84,Math.min(160,Math.min(innerWidth,innerHeight)*.26)));
 const el=document.createElement('div');el.className='ua ua-'+c.t;el.style.cssText=`--c:${UCART.COL[k]};--m:${m}px`;
 el.innerHTML=`<i class="ua-o"></i><i class="ua-o b"></i><span class="ua-md"></span>${txt?`<b class="ua-rb"><span>${esc(txt)}</span></b>`:''}`;
 el.querySelector('.ua-md').appendChild(medalla(c,k,m));pon(el,x,y,m)}
function pop(x,y,txt,col){estilo();const el=document.createElement('div');el.className='ua ua-p';el.style.cssText=`--c:${col};--m:40px`;
 el.innerHTML=`<b class="ua-rb"><span>${esc(txt)}</span></b>`;pon(el,x,y,40)}
window.UANU={carta,pop};
})();
