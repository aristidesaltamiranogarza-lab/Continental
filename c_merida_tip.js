// Mérida en Venta: etiqueta al pasar el mouse por una casilla (MTIP): de quién es y cuánto cobra ahora, o su precio si está libre.
// La llaman los tableros (c_merida3d.js y c_merida2d.js) solo con mouse; en el celular tocar la casilla abre su ficha como siempre.
(function(){
let el=null,cur=-1;
function renta(G,i){const B=MR.B,s=B[i],o=G.own[i],mio=j=>G.own[j]===o;
 if(s.t=='r')return MR.$m(25*2**(B.filter((b,j)=>b.t=='r'&&mio(j)).length-1));
 if(s.t=='u')return (B.every((b,j)=>b.t!='u'||mio(j))?10:4)+' veces los dados';
 const h=G.hs[i];return MR.$m(h?s.r[h]:s.r[0]*(G.o&&G.o.dbl&&MR.GR[s.g].every(mio)?2:1))}
function html(i){const G=V.G,s=MR.B[i];if(!G||!s||!['p','r','u'].includes(s.t))return '';const o=G.own[i],nm=t=>String(t).replace(/[<>&]/g,'');
 const h=G.hs[i],cs=h==5?' · hotel':h?` · ${h} casa${h>1?'s':''}`:'';
 if(o<0)return `<b>${nm(s.n)}</b><span>Libre · ${MR.$m(s.p)}</span>`;
 const p=G.players[o];return `<b>${nm(s.n)}</b><span><i style="background:${MR.pc(o)}">${MR.tk(o)}</i>${nm(p?p.name:'')}${cs}</span><span>${G.mg[i]?'Hipotecada':'Renta '+renta(G,i)}</span>`}
function show(i,x,y){if(i==null||i<0)return hide();if(i!==cur){const h=html(i);if(!h)return hide();cur=i;if(!el){el=document.createElement('div');el.className='mtip';document.body.appendChild(el)}el.innerHTML=h;el.hidden=false}
 if(!el||el.hidden)return;const w=el.offsetWidth,hh=el.offsetHeight;el.style.left=Math.max(8,Math.min(innerWidth-w-8,x+14))+'px';el.style.top=Math.max(8,y-hh-12)+'px'}
function hide(){cur=-1;if(el)el.hidden=true}
const css=document.createElement('style');css.textContent=`
.mtip{position:fixed;z-index:64;pointer-events:none;display:flex;flex-direction:column;gap:2px;max-width:220px;padding:8px 12px;border-radius:12px;background:#fffef8;color:#18201b;box-shadow:0 8px 22px rgba(0,0,0,.3);font:600 13px var(--mu-f,system-ui)}
.mtip[hidden]{display:none}.mtip b{font-weight:900;font-size:14px}.mtip span{display:flex;align-items:center;gap:6px;color:#3d4a42}
.mtip i{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;color:#fff;font-size:11px;font-style:normal}.mtip i svg{width:12px;height:12px}`;
document.head.appendChild(css);
window.MTIP={show,hide};
})();
