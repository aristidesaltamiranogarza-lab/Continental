// BROMA: a Caro y Chiaspa la cabeza de su personaje 3D les crece despacio y luego regresa de golpe.
// Los nombres salen de las respuestas del servidor (pares nombre+av). Solo aris/papiaris ven el interruptor en Ajustes.
(function(){
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
const BLANCO=n=>{n=norm(n);return n==='caro'||n==='chiaspa'},DUENO=n=>{n=norm(n);return n==='aris'||n==='papiaris'};
const cods=new Set(),pjs=new Set();let on=true;const T0=performance.now(),CICLO=240e3,MAX=.85;
// recoge pares {name|n, av} de cualquier JSON del servidor
function junta(o,d){if(!o||typeof o!=='object'||d>5)return;if(Array.isArray(o)){for(const x of o)junta(x,d+1);return}
 const n=o.name!=null?o.name:o.n;if(typeof o.av==='string'&&typeof n==='string'&&BLANCO(n))cods.add(o.av);
 if(Array.isArray(o.ps)&&Array.isArray(o.av))o.ps.forEach((n,i)=>{if(BLANCO(n)&&o.av[i])cods.add(o.av[i])});
 for(const k in o){const v=o[k];if(v&&typeof v==='object')junta(v,d+1)}}
const f0=window.fetch.bind(window);
window.fetch=function(u,op){const pr=f0(u,op);const s=String(u&&u.url||u);if(/\/modelos\/|\.(glb|ktx2|webp|jpe?g|png|mp3|json)(\?|$)/.test(s))return pr;
 pr.then(r=>{if(on&&/json/.test(r.headers.get('content-type')||''))r.clone().json().then(j=>junta(j,0)).catch(()=>{})}).catch(()=>{});return pr};
function mio(){try{if(typeof pname!=='undefined'&&BLANCO(pname)){const c=localStorage.getItem('cont_av');if(c)cods.add(c)}}catch(e){}}
function escala(){const t=((performance.now()-T0)%CICLO)/CICLO;   // crece suave y en el último 2% regresa con un rebote
 if(t<.98){const k=t/.98;return 1+MAX*k*k}const k=(t-.98)/.02;return 1+MAX*Math.exp(-6*k)*Math.cos(k*Math.PI*3)}
function aplica(p){const b=p.userData.bromaB||(p.userData.bromaB=p.getObjectByName('cabeza'));if(!b)return;
 const s=on&&cods.has(p.userData.bromaC)?escala():1;if(s!==1||b.userData.bromaS){b.scale.setScalar(s);b.userData.bromaS=s!==1}}
function marca(p,cod){if(!p||p.userData.bromaC!==undefined)return p;p.userData.bromaC=cod;pjs.add(p);
 const u0=p.updateMatrixWorld;p.updateMatrixWorld=function(f){if(this.userData.av)aplica(this);return u0.call(this,f)};return p}
function engancha(){if(!window.AV||AV._broma)return!!(window.AV&&AV._broma);AV._broma=1;
 const ya=AV.crearYa,cr=AV.crear;AV.crearYa=c=>marca(ya(c),c);AV.crear=c=>cr(c).then(p=>marca(p,c));return true}
if(!engancha()){const i=setInterval(()=>{if(engancha())clearInterval(i)},300)}
function trae(){f0('broma',{cache:'no-store'}).then(r=>r.json()).then(j=>{on=!!j.on}).catch(()=>{})}
trae();setInterval(()=>{trae();mio()},20e3);setTimeout(mio,2e3);
window.BROMA={dueno:()=>typeof pname!=='undefined'&&DUENO(pname),on:()=>on,
 set(v){on=!!v;f0('broma',{method:'POST',body:JSON.stringify({n:typeof pname!=='undefined'?pname:'',on})}).then(r=>r.json()).then(j=>{on=!!j.on}).catch(()=>{})}};
})();
