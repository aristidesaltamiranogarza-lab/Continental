// tests/casona_marcas.js — revisa que los GLB de la casona traigan los marcadores y choques que lee MARC (c_casa_marcas.js).
// Maqueta: modelos/casona/{nm1,n0,n1,n2}.glb. Planta baja horneada (pasos 3a/3b): pb.glb, con los marcadores de n0, líneas de corte,
// la gata, la segunda UV (luz) y su pb_luz.jpg. Planta alta horneada (paso 5): pa.glb y pa_luz.webp. Sótano horneado (paso 6): sm.glb y sm_luz.webp. Azotea (paso 7): az.glb y az_luz.webp.
const fs=require('fs'),path=require('path'),assert=require('assert');
const DIR=path.join(__dirname,'..','modelos','casona');
const ORDEN=['nm1','n0','n1','n2'];
// mesas por nivel según el anteproyecto
const MESAS={nm1:['cubilete','poker','blackjack','billar','ruleta'],n0:['continental','monopolydeal','uno','domino'],n1:['merida','haciendas','backgammon'],n2:['rummy','conecta4','loteria']};
const FAM='ctkf';
function gltf(f){const b=fs.readFileSync(f);assert.strictEqual(b.readUInt32LE(0),0x46546c67,'no es GLB');
 const n=b.readUInt32LE(12);return JSON.parse(b.slice(20,20+n).toString('utf8'))}
let fallas=0;
const PUNTO={},cerca=(p,q)=>Math.abs(p[0]-q[0])<.01&&Math.abs(p[2]-q[2])<.01;
for(const [arch,nv] of [...ORDEN.map(n=>[n,n]),['pb','n0'],['pa','n1'],['sm','nm1'],['az','n2']]){const J=gltf(path.join(DIR,arch+'.glb')),N=J.nodes||[],by={};N.forEach(o=>by[o.name]=o);const ex=o=>o.extras||{};
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
 // paso 4: una sola escalera; llegada y portales en el mismo punto en todos los niveles; planos "Ir a"
 const le=by['llegada_escalera_'+nv];t(le,'llegada_escalera');if(le){PUNTO.le=PUNTO.le||le.translation;t(cerca(le.translation,PUNTO.le),'llegada_escalera fuera del punto común')}
 for(const k of ['sube','baja']){const o=by['escalera_'+k+'_'+nv];if(!o)continue;PUNTO[k]=PUNTO[k]||o.translation;t(cerca(o.translation,PUNTO[k]),'escalera_'+k+' fuera del punto común')}
 const pl=N.filter(o=>/^plano_.+_/.test(o.name));t(by['plano_escalera_'+nv]&&pl.every(o=>typeof ex(o).ry==='number'),'plano_escalera con ry');
 if(nv==='n0')t(by.plano_zaguan_n0,'plano_zaguan_n0');
 t(N.filter(o=>/^puerta_.+_/.test(o.name)).length>0,'puertas');
 // choques: seg (uno por malla) o segs (varios, de 4 en 4); obs de 3 en 3
 let nseg=0;N.forEach(o=>{const e=ex(o);if(Array.isArray(e.seg)){nseg++;t(e.seg.length===4&&e.r>0,'seg de '+o.name)}
  if(Array.isArray(e.segs)){nseg+=e.segs.length/4;t(e.segs.length%4===0&&e.r>0,'segs de '+o.name)}
  if(Array.isArray(e.obs))t(e.obs.length%3===0,'obs de '+o.name)});
 t(nseg>=10,'segmentos de choque: '+nseg);
 t(N.some(o=>/_(piso|balcon|tierra)(_|$)/.test(o.name)),'pisos para los límites');
 if(arch==='pb'||arch==='pa'||arch==='sm'||arch==='az'){
  const lin=N.filter(o=>/_(muro|dintel|antepecho)_/.test(o.name));
  t(lin.length>20&&lin.every(o=>typeof ex(o).linea==='string'),'líneas de corte con extra linea');
  if(arch==='pb')t(by.gata_n0&&typeof ex(by.gata_n0).ry==='number','gata_n0');
  const uv1=(J.meshes||[]).filter(m=>m.primitives.every(p=>'TEXCOORD_1' in p.attributes)).length;
  t(uv1>50,'mallas con luz horneada (TEXCOORD_1): '+uv1);
  t(['webp','jpg'].some(e=>fs.existsSync(path.join(DIR,arch+'_luz.'+e))),arch+'_luz.webp|jpg');
  if(arch==='pb')t(by.pb_arbol_copa&&by.pb_hamaca&&by.pb_columnas,'árbol, hamaca y columnas');
  // planta alta (paso 5): barandal al vacío con choque, balcones, libreros y el patio de abajo sin choques
  if(arch==='pa'){t(by.pa_barandal_pasamanos&&ex(by.pa_barandal_pasamanos).segs,'barandal con choque');t(by.pa_balcon_0&&by.pa_libros&&by.pa_columnas,'balcones, libros y columnas');
   t(by.pa_abajo_arbol_copa&&by.pa_abajo_laja&&!N.some(o=>/^pa_abajo_/.test(o.name)&&(ex(o).segs||ex(o).obs||ex(o).linea)),'patio de abajo sin choques ni corte')}}
 // sótano (paso 6): forros de casino y billar con corte, muebles con choque y los empties de lo que pone SOTC
 if(arch==='sm'){t(N.some(o=>/_tapiz_vino$/.test(o.name)&&ex(o).linea)&&N.some(o=>/_tapiz_verde$/.test(o.name)&&ex(o).linea),'tapiz con corte');
  t(by.sm_muebles&&ex(by.sm_muebles).obs&&ex(by.sm_muebles).segs,'muebles con choque');
  for(const k of ['rockola','taquera','marcador','cuadro','neon_casino','neon_billar','neon_cantina'])t(by['sot_'+k]&&typeof ex(by['sot_'+k]).ry==='number','sot_'+k)}
 // azotea (paso 7): pretil con corte y choque, barandal al vacío, pérgola alta, tinacos, tendedero; lo de abajo sin choques ni corte
 if(arch==='az'){t(N.some(o=>/^az_muro_p[hv]/.test(o.name)&&ex(o).linea&&ex(o).segs),'pretil con corte y choque');t(by.az_barandal_pil&&ex(by.az_barandal_pil).segs,'barandal con choque');
  t(by.az_pergola&&ex(by.az_pergola).obs&&by.az_tinacos&&ex(by.az_tinacos).obs&&by.az_tendedero&&ex(by.az_tendedero).segs,'pérgola, tinacos y tendedero con choque');
  t(by.az_muro_tapa&&ex(by.az_muro_tapa).linea,'tapa del cubo con corte');
  t(by.az_abajo0_arbol_copa&&by.az_abajo0_laja&&!N.some(o=>/^az_abajo/.test(o.name)&&(ex(o).segs||ex(o).obs||ex(o).linea||/_(muro|dintel|antepecho|piso)_/.test(o.name))),'abajo sin choques ni corte')}
 console.log(arch,'mesas',ms.length,'segmentos',nseg,'puertas',N.filter(o=>/^puerta_/.test(o.name)).length)}
if(fallas){console.log('casona_marcas:',fallas,'fallas');process.exit(1)}
console.log('casona_marcas: ok');
