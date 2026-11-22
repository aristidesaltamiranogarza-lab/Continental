// tests/casona_marcas.js — revisa que los GLB de la casona traigan los marcadores y choques que lee MARC (c_casa_marcas.js).
const fs=require('fs'),path=require('path'),assert=require('assert');
const DIR=path.join(__dirname,'..','modelos','casona');
const ORDEN=['nm1','n0','n1','n2'];
// mesas por nivel según el anteproyecto
const MESAS={nm1:['cubilete','poker','blackjack','billar','ruleta'],n0:['continental','monopolydeal','uno','domino'],n1:['merida','haciendas','backgammon'],n2:['rummy','conecta4','loteria']};
const FAM='ctkf';
function nodos(f){const b=fs.readFileSync(f);assert.strictEqual(b.readUInt32LE(0),0x46546c67,'no es GLB');
 const n=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+n).toString('utf8'));return j.nodes||[]}
let fallas=0;
for(const nv of ORDEN){const N=nodos(path.join(DIR,nv+'.glb')),by={};N.forEach(o=>by[o.name]=o);const ex=o=>o.extras||{};
 const t=(ok,msg)=>{if(!ok){fallas++;console.log('FALLA',nv,msg)}};
 t(!N.some(o=>/\.\d{3}$/.test(o.name||'')),'nombres con .001');
 // mesas
 const ms=N.filter(o=>/^mesa_/.test(o.name));
 t(ms.length===MESAS[nv].length,'mesas: '+ms.map(o=>o.name).join(','));
 for(const g of MESAS[nv]){const o=by['mesa_'+g];t(o,'falta mesa_'+g);if(!o)continue;
  t(ex(o).juego===g&&FAM.includes(ex(o).fam)&&ex(o).r>0,'extras de mesa_'+g);
  t(Math.abs(o.translation[1]-1.55)<.01,'altura de mesa_'+g)}
 // escaleras y llegada
 const i=ORDEN.indexOf(nv);
 for(const [k,to] of [['sube',ORDEN[i+1]],['baja',ORDEN[i-1]]]){const o=by['escalera_'+k+'_'+nv];
  t(!!o===!!to,'escalera_'+k+' existe solo si hay nivel');if(!o)continue;
  t(ex(o).to===to&&ex(o).r>0&&Array.isArray(ex(o).pie),'extras de escalera_'+k);
  t(N.filter(e=>ex(e).escalera===k).length>=4,'escalones '+k)}
 t(by['llegada_'+nv],'llegada');
 t(N.filter(o=>/^puerta_.+_/.test(o.name)).length>0,'puertas');
 // choques
 const seg=N.filter(o=>Array.isArray(ex(o).seg));
 t(seg.length>=10&&seg.every(o=>ex(o).seg.length===4&&ex(o).r>0),'segmentos de choque: '+seg.length);
 t(N.some(o=>/_(piso|balcon|tierra)(_|$)/.test(o.name)),'pisos para los límites');
 console.log(nv,'mesas',ms.length,'segmentos',seg.length,'puertas',N.filter(o=>/^puerta_/.test(o.name)).length)}
if(fallas){console.log('casona_marcas:',fallas,'fallas');process.exit(1)}
console.log('casona_marcas: ok');
