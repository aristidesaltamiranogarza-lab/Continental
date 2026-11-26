// Mérida en Venta: resumen al terminar la partida (MFIN). Con los números que guarda g_merida.js en G.sx:
// la colonia que más cobró, quién pagó y quién cobró más renta, y quién fue más veces a la cárcel.
(function(){
function top(a,G){let k=-1,v=0;(a||[]).forEach((x,j)=>{if(x>v&&G.players[j]){v=x;k=j}});return k<0?null:[k,v]}
function valor(G,k,H){let v=G.cash[k]||0;(G.own||[]).forEach((o,i)=>{if(o!==k)return;const s=H.B[i];v+=G.mg&&G.mg[i]?s.p/2:s.p;if(G.hs&&G.hs[i]&&s.t=='p')v+=G.hs[i]*H.D.hc[s.g]});return v}
// podio: cada quien con su fortuna (cuenta al aparecer, c_merida_entra.js); el ganador primero y los quebrados al final
function podio(G,H){const bk=k=>G.bk&&G.bk[k],vs=G.players.map((_,k)=>G.vf?G.vf[k]:bk(k)?0:valor(G,k,H));
 const ks=G.players.map((_,k)=>k).sort((a,b)=>(b===G.win)-(a===G.win)||(!!bk(a)-!!bk(b))||vs[b]-vs[a]);
 return `<div class="mfin-p">${ks.map((k,j)=>`<div class="mfin-q${k===G.win?' w':''}${bk(k)?' bk':''}" style="--i:${j}">${H.tok(k,'xs')}<span>${H.nm(k)}</span><b${bk(k)?'':` data-cnt="${vs[k]}" data-d="${500+j*120}"`}>${bk(k)?'quebró':H.$m(vs[k])}</b></div>`).join('')}</div>`}
function html(G,H){const X=G.sx,P=podio(G,H);if(!X)return P;const R=[];
 let bi=-1,bv=0;Object.keys(X.ern||{}).forEach(i=>{if(X.ern[i]>bv){bv=X.ern[i];bi=+i}});
 if(bi>=0){const s=H.B[bi],c=s.t=='p'?H.D.gcol[s.g]:'#9aa59f';R.push(['Mejor compra',`<i class="mfin-c" style="background:${c}"></i>${s.n}`,'cobró '+H.$m(bv)])}
 const rr=top(X.rr,G);if(rr)R.push(['Cobró más renta',H.tok(rr[0],'xs')+' '+H.nm(rr[0]),H.$m(rr[1])]);
 const rp=top(X.rp,G);if(rp)R.push(['Pagó más renta',H.tok(rp[0],'xs')+' '+H.nm(rp[0]),H.$m(rp[1])]);
 const jl=top(X.jl,G);if(jl)R.push(['Más veces en la cárcel',H.tok(jl[0],'xs')+' '+H.nm(jl[0]),jl[1]+(jl[1]>1?' veces':' vez')]);
 if(!R.length)return P;return P+`<div class="mfin">${R.map(r=>`<div class="mfin-r"><small>${r[0]}</small><b>${r[1]}</b><span>${r[2]}</span></div>`).join('')}</div>`}
const css=document.createElement('style');css.textContent=`
.mfin{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 2px}
.mfin-r{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:12px;background:var(--mu-card);box-shadow:0 1px 0 rgba(0,0,0,.06),0 3px 10px rgba(0,0,0,.08);animation:mfin .5s cubic-bezier(.3,1.4,.5,1) calc(var(--mu-fdl,0s) + .9s) backwards}
.mfin-r:nth-child(2){animation-delay:calc(var(--mu-fdl,0s) + 1.02s)}.mfin-r:nth-child(3){animation-delay:calc(var(--mu-fdl,0s) + 1.14s)}.mfin-r:nth-child(4){animation-delay:calc(var(--mu-fdl,0s) + 1.26s)}
.mfin-p{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 4px}.mfin-q.w{grid-column:1/-1}
.mfin-q{display:flex;align-items:center;gap:6px;min-width:0;min-height:36px;padding:3px 10px;border-radius:14px;background:var(--mu-card)}
.mfin-q>.mu-tok{flex:none}
.mfin-q span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 14px var(--mu-f);color:var(--mu-ink)}
.mfin-q b{font:900 14px var(--mu-f);color:var(--mu-ink);font-variant-numeric:tabular-nums}
.mfin-q.w{background:var(--ui-accent,#C2512A)}.mfin-q.w span,.mfin-q.w b{color:var(--ui-on,#fff)}
.mfin-q.bk{opacity:.55}.mfin-q.bk b{font-weight:700;color:var(--mu-sub)}
.mfin-r small{font:800 11px var(--mu-f);text-transform:uppercase;letter-spacing:.06em;color:var(--mu-sub)}.mfin-r b{display:flex;align-items:center;gap:6px;font:900 14px/1.2 var(--mu-f);color:var(--mu-ink)}.mfin-r span{font:700 13px var(--mu-f);color:var(--mu-sub)}
.mfin-c{flex:none;width:12px;height:12px;border-radius:4px}
@keyframes mfin{from{opacity:0;transform:translateY(10px) scale(.96)}}@media (prefers-reduced-motion:reduce){.mfin-r{animation:none}}`;
document.head.appendChild(css);
window.MFIN={html};
})();
