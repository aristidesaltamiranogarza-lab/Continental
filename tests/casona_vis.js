// tests/casona_vis.js — V7 sin navegador: grafo de portales (c_casa_portales.js), recorrido, histéresis y que pb/pa/sm.glb
// traigan los empties cuarto_<id>_<n> {w,d,h} y portal_<a>_<b>_<n> {w,h,ax} que lee MARC y recorre CUA.
const fs=require('fs'),path=require('path'),assert=require('assert');
const PORT=require('../c_casa_portales.js');
let fallas=0;const t=(ok,msg)=>{if(!ok){fallas++;console.log('FALLA',msg)}};
// grafo chico: sala-zaguan-comedor en fila, zaguan al abierto, cocina solo al abierto
const C=[{id:'sala'},{id:'zaguan'},{id:'comedor'},{id:'cocina'}];
const P=[{a:'sala',b:'zaguan',k:1},{a:'zaguan',b:'comedor',k:2},{a:'zaguan',b:'abierto',k:3},{a:'abierto',b:'cocina',k:4},{a:'x',b:'y',k:5}];
const G=PORT.grafo(C,P);
t(G.n===5&&G.ab===4,'n y abierto al final');
t(G.V.length===4,'portal entre dos desconocidos (los dos abierto) no cuenta');
let v=PORT.recorrer(G,[0],()=>true);t(v.every(x=>x),'todo visible si todos los portales se ven');
v=PORT.recorrer(G,[0],p=>p.p.k!==3);t(v[0]&&v[1]&&v[2]&&!v[3]&&!v[4],'sin el portal del zaguan al abierto: ni abierto ni cocina');
v=PORT.recorrer(G,[0],()=>false);t(v.join()==='true,false,false,false,false','sin portales en pantalla: solo el cuarto de inicio');
v=PORT.recorrer(G,[0,3],()=>false);t(v[0]&&v[3]&&!v[1],'cuarto de la cámara y el de tu Mii');
v=PORT.recorrer(G,[-1,9],()=>true);t(v.every(x=>!x),'inicio fuera de rango no revienta');
// histéresis: aparece al momento, se esconde después de ms
const H={};let h=PORT.hist(H,[true,false],0,300);t(h[0]&&!h[1],'hist inicial');
h=PORT.hist(H,[false,true],100,300);t(h[0]&&h[1],'sigue visible dentro de ms y el nuevo aparece al momento');
h=PORT.hist(H,[false,false],350,300);t(!h[0]&&h[1],'se esconde pasado ms');
h=PORT.hist(H,[false,false],401,300);t(!h[0]&&!h[1],'todos escondidos');
// GLB de la casona: empties V7
const DIR=path.join(__dirname,'..','modelos','casona');
function nodos(f){const b=fs.readFileSync(f),n=b.readUInt32LE(12);return JSON.parse(b.slice(20,20+n).toString('utf8')).nodes||[]}
for(const [arch,nv,minC] of [['pb','n0',9],['pa','n1',6],['sm','nm1',8]]){const N=nodos(path.join(DIR,arch+'.glb'));
 const cu=N.filter(o=>/^cuarto_/.test(o.name||'')),po=N.filter(o=>/^portal_/.test(o.name||''));
 t(cu.length>=minC,arch+': '+cu.length+' cuartos (se esperaban '+minC+')');
 t(po.length>=cu.length-1,arch+': '+po.length+' portales');
 cu.forEach(o=>{const e=o.extras||{};t(e.w>0&&e.d>0&&e.h>0&&o.name.endsWith('_'+nv),arch+' '+o.name+' sin w/d/h o nivel')});
 const ids=new Set(cu.map(o=>o.name.split('_')[1]));
 po.forEach(o=>{const e=o.extras||{},[,a,b]=o.name.split('_');t(e.w>0&&e.h>0&&(e.ax==='x'||e.ax==='z'),arch+' '+o.name+' sin w/h/ax');
  t((ids.has(a)||a==='abierto')&&(ids.has(b)||b==='abierto')&&a!==b,arch+' '+o.name+' une cuartos que no existen')});
 // cada cuarto cerrado tiene al menos un portal (si no, nunca se veria desde fuera)
 ids.forEach(id=>t(po.some(o=>{const [,a,b]=o.name.split('_');return a===id||b===id}),arch+': '+id+' sin portal'))}
console.log(fallas?fallas+' fallas':'casona_vis: todo bien');process.exit(fallas?1:0);
