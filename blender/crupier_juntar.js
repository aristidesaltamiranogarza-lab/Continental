// crupier_juntar.js — mete las piezas de blender/crupier_piezas.glb (Arriba_4, Arriba_4_M: atuendo de crupier de crupier.py)
// en blender/chibi_prueba.glb (lo que exporta rig.py) y comprime a modelos/personaje/chibi.glb como en PENDIENTES.md
// (prune con keepLeaves para no perder los empties de sien, y meshopt). Los huesos de las piezas nuevas se cambian por
// los del Rig original (por nombre) y los materiales por los que ya existen con el mismo nombre (av_arriba, av_boton...),
// para que el juego les ponga color igual que a las demas prendas.
// Uso: node blender/crupier_juntar.js [carpeta con node_modules de @gltf-transform/core|extensions|functions@4 y meshoptimizer]
//   (npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer en una carpeta aparte)
const path=require('path'),{createRequire}=require('module');
const R=createRequire(path.join(path.resolve(process.argv[2]||'.'),'node_modules','x.js'));
const {NodeIO}=R('@gltf-transform/core'),{ALL_EXTENSIONS}=R('@gltf-transform/extensions');
const {mergeDocuments,prune,meshopt}=R('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder}=R('meshoptimizer');
const D=__dirname,BASE=path.join(D,'chibi_prueba.glb'),PZ=path.join(D,'crupier_piezas.glb'),OUT=path.join(D,'..','modelos','personaje','chibi.glb');
const PIEZAS=/^Arriba_4(_M)?$/;
(async()=>{
 await MeshoptEncoder.ready;await MeshoptDecoder.ready;
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
 const doc=await io.read(BASE),src=await io.read(PZ),root=doc.getRoot();
 const viejos=new Set([...root.listNodes(),...root.listMaterials(),...root.listScenes(),...root.listSkins(),...root.listMeshes(),...root.listAccessors(),...root.listAnimations()]);
 // quitar piezas de una corrida anterior
 for(const n of root.listNodes())if(PIEZAS.test(n.getName()))n.dispose();
 // los clips del UAL (anim_retarget.py) van en anim.glb; si la escena los trae, fuera de chibi.glb
 for(const a of root.listAnimations())if(/^(Quieto|Camina|Trota|Sentarse|Sentado|Levantarse)$/.test(a.getName()))a.dispose();
 mergeDocuments(doc,src);
 const nuevo=x=>!viejos.has(x);
 const porNombre=(lista,nm)=>lista.find(x=>viejos.has(x)&&x.getName()===nm);
 const rig=porNombre(root.listNodes(),'Rig');if(!rig)throw new Error('sin nodo Rig');
 const hechos=[];
 for(const n of root.listNodes().filter(nuevo)){
  if(!PIEZAS.test(n.getName())||!n.getMesh())continue;
  const sk=n.getSkin();
  const js=sk.listJoints(),os=js.map(j=>{const o=porNombre(root.listNodes(),j.getName());if(!o)throw new Error('hueso sin par '+j.getName());return o});
  js.forEach(j=>sk.removeJoint(j));os.forEach(o=>sk.addJoint(o));   // mismo orden: JOINTS_0 sigue valiendo
  const sr=porNombre(root.listNodes(),sk.getSkeleton()&&sk.getSkeleton().getName());if(sr)sk.setSkeleton(sr);
  for(const p of n.getMesh().listPrimitives()){const m=p.getMaterial(),o=m&&porNombre(root.listMaterials(),m.getName());if(o)p.setMaterial(o)}
  const pa=n.getParentNode();if(pa)pa.removeChild(n);rig.addChild(n);hechos.push(n.getName())}
 // lo demas que vino de crupier_piezas.glb (su escena, su armadura) se va
 for(const s of root.listScenes().filter(nuevo))s.dispose();
 for(const n of root.listNodes().filter(nuevo))if(!hechos.includes(n.getName()))n.dispose();
 root.setDefaultScene(root.listScenes()[0]);
 const b0=root.listBuffers()[0];root.listAccessors().forEach(a=>a.setBuffer(b0));root.listBuffers().slice(1).forEach(b=>b.dispose());   // un GLB = un buffer
 await doc.transform(prune({keepLeaves:true}),meshopt({encoder:MeshoptEncoder,level:'high'}));
 await io.write(OUT,doc);
 const fs=require('fs');
 console.log('piezas',hechos,'nodos',root.listNodes().length,'mallas',root.listMeshes().length,'mats',root.listMaterials().map(m=>m.getName()).join(' '),
  'anim',root.listAnimations().length,Math.round(fs.statSync(OUT).size/1024)+' KB')})().catch(e=>{console.error(e);process.exit(1)});
