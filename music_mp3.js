// Canciones en mp3 de la casa (musica/): rotan al azar (la sintetizada del menú solo suena si ninguno carga), sin repetir la anterior.
// music.js llama MP3.sync(enCasa, ctx, master) en cada musSync(): devuelve true si ahora suena un mp3 (y la sintetizada calla).
// Pasan por el master de music.js, así el 🎵 controla su volumen. Cada mp3 se descarga solo cuando le toca. Se carga DESPUÉS de music.js.
(function(){
const TR=['bossanova','cocteljazz','jazzcafe'],SYN_MS=180000,bad=new Set();   // -1 = la sintetizada: solo si ningún mp3 carga
let pick=null,au=null,gn=null,ctx=null,tm=0,on=false;
function next(){const ok=[...TR.keys()].filter(i=>!bad.has(i)),all=ok.length>1?ok.filter(i=>i!==pick):ok;pick=all.length?all[Math.random()*all.length|0]:-1;
 clearTimeout(tm);if(pick<0)tm=setTimeout(()=>{if(pick<0)skip()},SYN_MS)}
function skip(){next();if(window.musSync)musSync()}
function mk(c,m){if(au&&ctx===c)return;if(au){au.onended=au.onerror=null;au.pause();on=false}ctx=c;au=new Audio();au.preload='none';
 au.onended=skip;au.onerror=()=>{if(pick>=0){bad.add(pick);console.warn('mp3 no cargó:',TR[pick]);skip()}};
 gn=c.createGain();gn.gain.value=0;c.createMediaElementSource(au).connect(gn);gn.connect(m)}
function fade(v,s){const t=ctx.currentTime,g=gn.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(v,t+s)}
function sync(casa,c,m){if(pick===null)next();
 if(!casa||pick<0){if(on){on=false;fade(0,1.2);const a=au;setTimeout(()=>{if(!on)a.pause()},1300)}return false}
 mk(c,m);const src='musica/'+TR[pick]+'.mp3';if(!au.src.endsWith(src))au.src=src;
 if(!on||au.paused){on=true;fade(1,1.6);const p=au.play();if(p)p.catch(()=>{on=false})}else if(ctx.state!=='running')try{ctx.resume()}catch(e){}return true}
window.MP3={sync,skip,now:()=>pick==null||pick<0?'menu':TR[pick],t:()=>au&&!au.paused?au.currentTime:-1};   // t: segundos del mp3 que suena (-1 si ninguno)
})();
