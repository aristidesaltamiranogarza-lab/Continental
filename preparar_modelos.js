// preparar_modelos.js — se corre en tu computadora, NO en el servidor (el servidor sigue sin dependencias).
// Toma cada .glb original de modelos/originales/ y genera las dos versiones con gltf-transform (npx la baja la primera vez):
//   modelos/hd/<nombre>.glb     Completo: texturas KTX2 de hasta 2048, geometría meshopt, polígonos intactos
//   modelos/medio/<nombre>.glb  Medio:    texturas KTX2 de hasta 512, la mitad de polígonos
// y llena modelos/modelos.json (archivo, huella, KB). La fuente y la licencia de cada modelo se escriben a mano en el catálogo
// (o en modelos/originales/<nombre>.json: {"fuente":"Kenney Furniture Kit","licencia":"CC0","url":"…"}) y se conservan.
// KTX2 necesita "toktx" (KTX-Software, https://github.com/KhronosGroup/KTX-Software/releases) en el PATH; si no está, usa WebP y avisa.
// Uso:  node preparar_modelos.js [nombre …] [--version modelos-v2] [--seco]
//   sin nombres = todos; --version cambia la etiqueta del catálogo (luego: git tag modelos-v2 && git push --tags);
//   --seco solo muestra los comandos y no toca nada.
const fs=require('fs'),path=require('path'),cr=require('crypto'),{spawnSync}=require('child_process');
const D=path.join(__dirname,'modelos'),ORI=path.join(D,'originales'),CATF=path.join(D,'modelos.json'),GT='@gltf-transform/cli@4';
const args=process.argv.slice(2),seco=args.includes('--seco'),vi=args.indexOf('--version'),ver=vi>=0?args[vi+1]:null;
const nombres=args.filter((a,i)=>!a.startsWith('--')&&!(vi>=0&&i===vi+1));
const VERS={hd:{tam:2048,extra:[]},medio:{tam:512,extra:['--simplify-ratio','0.5','--simplify-error','0.01']}};

const win=process.platform==='win32',npx=win?'npx.cmd':'npx';
const corre=(c,a)=>spawnSync(c,a,{stdio:'inherit',shell:win});
const hay=c=>{try{return spawnSync(c,['--version'],{stdio:'ignore',shell:win}).status===0}catch(e){return false}};

const cat=fs.existsSync(CATF)?JSON.parse(fs.readFileSync(CATF,'utf8')):{version:'modelos-v1',modelos:{}};
cat.modelos=cat.modelos||{};if(ver)cat.version=ver;
if(!fs.existsSync(ORI)){console.log('No existe modelos/originales/. Pon ahí los .glb originales (CC0) y vuelve a correr.');process.exit(1)}
const todos=fs.readdirSync(ORI).filter(f=>f.toLowerCase().endsWith('.glb')).map(f=>f.slice(0,-4));
const lista=nombres.length?nombres:todos;
const faltan=lista.filter(n=>!todos.includes(n));if(faltan.length){console.log('No encuentro en originales/:',faltan.join(', '));process.exit(1)}
const ktx=hay('toktx');if(!ktx)console.warn('⚠ No encontré toktx: las texturas salen en WebP (más memoria en la tarjeta). Instala KTX-Software para KTX2.');

let mal=0;
for(const n of lista){
 const src=path.join(ORI,n+'.glb'),e=cat.modelos[n]||(cat.modelos[n]={fuente:'',licencia:'CC0',pisos:[]});
 const lado=path.join(ORI,n+'.json');if(fs.existsSync(lado))Object.assign(e,JSON.parse(fs.readFileSync(lado,'utf8')));
 for(const v in VERS){
  const rel=v+'/'+n+'.glb',out=path.join(D,rel);
  const a=['-y',GT,'optimize',src,out,'--compress','meshopt','--texture-compress',ktx?'ktx2':'webp','--texture-size',String(VERS[v].tam),...VERS[v].extra];
  console.log('\n▶',n,v,'\n ',npx,a.join(' '));if(seco)continue;
  fs.mkdirSync(path.dirname(out),{recursive:true});
  const r=corre(npx,a);if(r.status!==0||!fs.existsSync(out)){console.error('✖ falló',n,v);mal++;continue}
  const b=fs.readFileSync(out);e[v]={archivo:rel,h:cr.createHash('sha1').update(b).digest('hex').slice(0,10),kb:Math.round(b.length/1024)}}
 e.original_kb=Math.round(fs.statSync(src).size/1024)}

if(seco){console.log('\n(--seco: no se escribió nada)');process.exit(0)}
const orden={};Object.keys(cat.modelos).sort().forEach(k=>orden[k]=cat.modelos[k]);cat.modelos=orden;
fs.writeFileSync(CATF,JSON.stringify(cat,null,1)+'\n');
let hd=0,md=0;for(const k in cat.modelos){hd+=(cat.modelos[k].hd||{}).kb||0;md+=(cat.modelos[k].medio||{}).kb||0}
console.log('\nCatálogo:',Object.keys(cat.modelos).length,'modelos · HD',(hd/1024).toFixed(1),'MB · Medio',(md/1024).toFixed(1),'MB · etiqueta',cat.version);
const sin=Object.keys(cat.modelos).filter(k=>!cat.modelos[k].fuente);if(sin.length)console.log('Falta la fuente de:',sin.join(', '));
process.exit(mal?1:0);
