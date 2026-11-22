// tests/casona_marcas.js — revisa que los GLB de la casona traigan los marcadores y choques que lee MARC (c_casa_marcas.js).
// Maqueta: modelos/casona/{nm1,n0,n1,n2}.glb. Planta baja horneada (pasos 3a/3b): pb.glb, con los marcadores de n0, líneas de corte,
// la gata, la segunda UV (luz) y su pb_luz.jpg.
const fs=require('fs'),path=require('path'),assert=require('assert');
const DIR=path.join(__dirname,'..','modelos','casona');
const ORDEN=['nm1','n0','n1','n2'];
// mesas por nivel según el anteproyecto
const MESAS={nm1:['cubilete','poker','blackjack','billar','ruleta'],n0:['continental','monopolydeal','uno','domino'],n1:['merida','haciendas','backgammon'],n2:['rummy','conecta4','loteria']};
const FAM='ctkf';
function gltf(f){const b=fs.readFileSync(f);assert.strictEqual(b.readUInt32LE(0),0x46546c67,'no es GLB');
 const n=b.readUInt32LE(12);return JSON.parse(b.slice(20,20+n).toString('utf8'))}
let fallas=0;
for(const [arch,nv] of [...ORDEN.map(n=>[n,n]),['pb','n0']]){const J=gltf(path.join(DIR,arch+'.glb')),N=J.nodes||[],by={};N.forEach(o=>by[o.name]=o);const ex=o=>o.extras||{};
 const t=(ok,msg)=>{if(!ok){fallas++;console.log('FALLA',arch,msg)}};
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
  t(N.some(e=>ex(e).escalera===k),'escalones '+k)}
 t(by['llegada_'+nv],'llegada');
 t(N.filter(o=>/^puerta_.+_/.test(o.name)).length>0,'puertas');
 // choques: seg (uno por malla) o segs (varios, de 4 en 4); obs de 3 en 3
 let nseg=0;N.forEach(o=>{const e=ex(o);if(Array.isArray(e.seg)){nseg++;t(e.seg.length===4&&e.r>0,'seg de '+o.name)}
  if(Array.isArray(e.segs)){nseg+=e.segs.length/4;t(e.segs.length%4===0&&e.r>0,'segs de '+o.name)}
  if(Array.isArray(e.obs))t(e.obs.length%3===0,'obs de '+o.name)});
 t(nseg>=10,'segmentos de choque: '+nseg);
 t(N.some(o=>/_(piso|balcon|tierra)(_|$)/.test(o.name)),'pisos para los límites');
 if(arch==='pb'){
  const lin=N.filter(o=>/_(muro|dintel|antepecho)_/.test(o.name));
  t(lin.length>20&&lin.every(o=>typeof ex(o).linea==='string'),'líneas de corte con extra linea');
  t(by.gata_n0&&typeof ex(by.gata_n0).ry==='number','gata_n0');
  const uv1=(J.meshes||[]).filter(m=>m.primitives.every(p=>'TEXCOORD_1' in p.attributes)).length;
  t(uv1>50,'mallas con luz horneada (TEXCOORD_1): '+uv1);
  t(fs.existsSync(path.join(DIR,'pb_luz.jpg')),'pb_luz.jpg');
  t(by.pb_arbol_copa&&by.pb_hamaca&&by.pb_columnas,'árbol, hamaca y columnas')}
 console.log(arch,'mesas',ms.length,'segmentos',nseg,'puertas',N.filter(o=>/^puerta_/.test(o.name)).length)}
if(fallas){console.log('casona_marcas:',fallas,'fallas');process.exit(1)}
console.log('casona_marcas: ok');
