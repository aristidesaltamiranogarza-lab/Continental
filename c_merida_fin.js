// Mérida en Venta: resumen al terminar la partida (MFIN). Con los números que guarda g_merida.js en G.sx:
// la colonia que más cobró, quién pagó y quién cobró más renta, y quién fue más veces a la cárcel.
(function(){
function top(a,G){let k=-1,v=0;(a||[]).forEach((x,j)=>{if(x>v&&G.players[j]){v=x;k=j}});return k<0?null:[k,v]}
function html(G,H){const X=G.sx;if(!X)return '';const R=[];
 let bi=-1,bv=0;Object.keys(X.ern||{}).forEach(i=>{if(X.ern[i]>bv){bv=X.ern[i];bi=+i}});
 if(bi>=0){const s=H.B[bi],c=s.t=='p'?H.D.gcol[s.g]:'#9aa59f';R.push(['Mejor compra',`<i class="mfin-c" style="background:${c}"></i>${s.n}`,'cobró '+H.$m(bv)])}
 const rr=top(X.rr,G);if(rr)R.push(['Cobró más renta',H.tok(rr[0],'xs')+' '+H.nm(rr[0]),H.$m(rr[1])]);
 const rp=top(X.rp,G);if(rp)R.push(['Pagó más renta',H.tok(rp[0],'xs')+' '+H.nm(rp[0]),H.$m(rp[1])]);
 const jl=top(X.jl,G);if(jl)R.push(['Más veces en la cárcel',H.tok(jl[0],'xs')+' '+H.nm(jl[0]),jl[1]+(jl[1]>1?' veces':' vez')]);
 if(!R.length)return '';return `<div class="mfin">${R.map(r=>`<div class="mfin-r"><small>${r[0]}</small><b>${r[1]}</b><span>${r[2]}</span></div>`).join('')}</div>`}
const css=document.createElement('style');css.textContent=`
.mfin{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 2px}
.mfin-r{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:12px;background:var(--mu-card);box-shadow:0 1px 0 rgba(0,0,0,.06),0 3px 10px rgba(0,0,0,.08);animation:mfin .5s cubic-bezier(.2,1.3,.5,1) backwards}
.mfin-r:nth-child(2){animation-delay:.12s}.mfin-r:nth-child(3){animation-delay:.24s}.mfin-r:nth-child(4){animation-delay:.36s}
.mfin-r small{font:800 11px var(--mu-f);text-transform:uppercase;letter-spacing:.06em;color:var(--mu-sub)}.mfin-r b{display:flex;align-items:center;gap:6px;font:900 14px/1.2 var(--mu-f);color:var(--mu-ink)}.mfin-r span{font:700 13px var(--mu-f);color:var(--mu-sub)}
.mfin-c{flex:none;width:12px;height:12px;border-radius:4px}
@keyframes mfin{from{opacity:0;transform:translateY(10px) scale(.96)}}@media (prefers-reduced-motion:reduce){.mfin-r{animation:none}}`;
document.head.appendChild(css);
window.MFIN={html};
})();
