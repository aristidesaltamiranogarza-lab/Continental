// Rummy: reglas puras, sin estado. Las usa g_rummy.js en el servidor y el cliente (para resaltar combinaciones y contar la primera bajada). En el navegador queda en window.RUMMY.
// Fichas por id: 0–103 son dos juegos de 1–13 en 4 colores (color id%52/13, número id%13+1); 104 y 105 son comodines.
// La mesa es una lista de grupos y cada grupo una lista de ids en el orden en que está puesto (en las escaleras el orden dice qué representa cada comodín).
(function(){
const COL=['rojo','azul','negro','naranja'],JK=104,TOT=106,MIN1=30,JV=30;
const isJ=x=>x>=JK,col=x=>x%52/13|0,num=x=>x%13+1;
const mazo=()=>Array.from({length:TOT},(_,i)=>i);
const key=g=>g.slice().sort((a,b)=>a-b).join(',');
// un grupo: serie (mismo número, colores distintos, 3–4 fichas) o escalera (mismo color, consecutivos; el 1 solo va antes del 2, sin 13→1).
// Devuelve {k:'serie'|'esc', v:[valor de cada lugar], pts, c (color de la escalera), n y falt (número de la serie y colores que le faltan)} o null.
// Con una sola ficha normal y dos comodines puede ser las dos cosas: se toma la que vale más (si empatan, escalera). corto: acepta grupos de menos de 3 (para acomodar los que se están armando).
function grp(g,corto){if(!Array.isArray(g)||g.length<(corto?1:3)||g.length>13)return null;const nj=g.filter(x=>!isJ(x));if(!nj.length)return null;
 const n0=num(nj[0]),cs=nj.map(col);let s=null,e=null;
 if(g.length<=4&&nj.every(x=>num(x)==n0)&&new Set(cs).size==cs.length)s={k:'serie',n:n0,v:g.map(()=>n0),pts:n0*g.length,falt:[0,1,2,3].filter(c=>!cs.includes(c))};
 const b=n0-g.indexOf(nj[0]);
 if(b>=1&&b+g.length-1<=13&&g.every((x,k)=>isJ(x)||col(x)==cs[0]&&num(x)==b+k)){const v=g.map((_,k)=>b+k);e={k:'esc',c:cs[0],v,pts:v.reduce((a,x)=>a+x,0)}}
 return s&&e?(s.pts>e.pts?s:e):s||e}
// acomoda un grupo al soltarle una ficha: si ya sirve tal cual (aunque esté corto) se queda igual; si es de un solo color, lo ordena como escalera
// con los comodines en los huecos y los que sobran al final (o al principio si ya llegó al 13). Si no se puede, lo deja como estaba.
function arregla(g){if(grp(g,1))return g.slice();const o=g.filter(x=>!isJ(x)).sort((a,b)=>num(a)-num(b)),js=g.filter(isJ),r=[];
 if(!o.length||o.some(x=>col(x)!=col(o[0])))return g.slice();
 o.forEach((x,k)=>{if(k)for(let v=num(o[k-1])+1;v<num(x)&&js.length;v++)r.push(js.shift());r.push(x)});
 while(js.length){if(num(o[0])-r.indexOf(o[0])+r.length<=13)r.push(js.shift());else r.unshift(js.shift())}
 return grp(r,1)?r:g.slice()}
// lo que representa cada comodín de la mesa: id → {k:'esc',c,n} o {k:'serie',n,falt}
function reps(mesa){const o={};for(const g of mesa){const r=grp(g);if(r)g.forEach((x,k)=>{if(isJ(x))o[x]=r.k=='esc'?{k:'esc',c:r.c,n:r.v[k]}:{k:'serie',n:r.n,falt:r.falt}})}return o}
const igual=(a,b)=>!!b&&a.k==b.k&&a.n==b.n&&(a.k=='serie'||a.c==b.c);
const cubre=(x,r)=>!isJ(x)&&num(x)==r.n&&(r.k=='esc'?col(x)==r.c:r.falt.includes(col(x)));
// mesa bien formada y solo con fichas de la mesa o del atril. Devuelve el error o null.
function forma(antes,atril,mesa){if(!Array.isArray(mesa)||mesa.length>TOT||mesa.some(g=>!Array.isArray(g)))return 'Mesa mal formada.';
 const F=mesa.flat();if(F.some(x=>!Number.isInteger(x)||x<0||x>=TOT))return 'Mesa mal formada.';
 if(new Set(F).size!=F.length)return 'Hay una ficha repetida.';
 const ok=new Set(antes.flat().concat(atril));return F.some(x=>!ok.has(x))?'Esa ficha no es tuya.':null}
// valida la mesa final de un turno (bajo: si ya hizo su primera bajada). Devuelve {pass:true} si no jugó fichas propias,
// {err, bad:[grupos inválidos]} si no sirve, o {ok:true, mesa, jug:[fichas que salieron del atril], pts (de la primera bajada)}.
function check(antes,atril,mesa,bajo){const e=forma(antes,atril,mesa);if(e)return {err:e};
 mesa=mesa.filter(g=>g.length);const F=new Set(mesa.flat()),A=new Set(antes.flat());
 for(const x of A)if(!F.has(x))return {err:'Las fichas de la mesa no pueden regresar a tu atril.'};
 const jug=[...F].filter(x=>!A.has(x));if(!jug.length)return {pass:true};
 const rs=mesa.map(g=>grp(g)),bad=rs.map((r,k)=>r?-1:k).filter(k=>k>=0);if(bad.length)return {err:'Hay combinaciones inválidas en la mesa.',bad};
 // primera bajada: los grupos que ya estaban se quedan igual y lo nuevo sale solo del atril, con 30 puntos o más
 let pts=0;if(!bajo){const q=antes.map(key);
  for(let k=0;k<mesa.length;k++){const j=q.indexOf(key(mesa[k]));if(j>=0){q.splice(j,1);continue}
   if(mesa[k].some(x=>A.has(x)))return {err:'Antes de tu primera bajada no puedes tocar las fichas de la mesa.'};pts+=rs[k].pts}
  if(pts<MIN1)return {err:'La primera bajada debe sumar '+MIN1+' o más (llevas '+pts+').'}}
 // comodín que cambia de lo que representa: la ficha que representaba tiene que salir de tu atril en este turno
 const ra=reps(antes),rb=reps(mesa),usa=new Set();
 for(const x in ra){if(igual(ra[x],rb[x]))continue;const y=jug.find(z=>!usa.has(z)&&cubre(z,ra[x]));
  if(y==null)return {err:'Para mover un comodín tienes que poner la ficha que representa.'};usa.add(y)}
 return {ok:true,mesa:mesa.map(g=>g.slice()),jug,pts}}
// puntos en mano (el comodín vale 30) · puntos de los grupos nuevos hechos solo con fichas propias (contador de la primera bajada)
const mano=a=>a.reduce((s,x)=>s+(isJ(x)?JV:num(x)),0);
const bajada=(antes,mesa)=>{const A=new Set(antes.flat());return mesa.reduce((s,g)=>{const r=!g.some(x=>A.has(x))&&grp(g);return s+(r?r.pts:0)},0)};
// ordenar el atril por color o por número; los comodines al final
const ordena=(a,porNum)=>a.slice().sort((x,y)=>isJ(x)-isJ(y)||(porNum?num(x)-num(y)||col(x)-col(y):col(x)-col(y)||num(x)-num(y))||x-y);
const RUMMY={COL,JK,TOT,MIN1,JV,isJ,col,num,mazo,grp,arregla,reps,forma,check,mano,bajada,ordena};
if(typeof module!='undefined'&&module.exports)module.exports=RUMMY;else window.RUMMY=RUMMY;
})();
