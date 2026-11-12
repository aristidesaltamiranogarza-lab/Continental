// EICO: íconos de silueta de los bailes, sacados del propio personaje (chibi.glb).
// Para cada clip prueba varios cuadros y se queda con la pose más abierta (o el cuadro fijo de EICO.A).
// EICO.url(clip) da el dataURL (o ''); EICO.prep() los hace una vez; las <img data-eico="Clip"> se llenan solas.
(function(){
const A={},   // clip → fracción fija del cuadro (0–1); si no está, se elige sola
 S=192,N=14,GIRO=.35,urls={};let prom=null;
function pinta(){document.querySelectorAll('img[data-eico]').forEach(im=>{const u=urls[im.dataset.eico];if(u&&im.src!==u){im.src=u;im.classList.add('ok')}})}
function caja(cx,W){const d=cx.getImageData(0,0,W,W).data;let x0=W,y0=W,x1=-1,y1=-1;
 for(let y=0;y<W;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 return x1<0?null:{x0,y0,x1,y1,w:x1-x0+1,h:y1-y0+1}}
function prep(){if(prom)return prom;if(!window.AV||!window.THREE)return Promise.resolve();
 prom=AV.listo().then(b=>new Promise(ok=>setTimeout(()=>{try{hace(b)}catch(e){console.warn('EICO',e)}pinta();ok()},60))).catch(e=>console.warn('EICO',e));return prom}
function hace(b){const W=320,cv=document.createElement('canvas');cv.width=cv.height=W;
 const r=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,preserveDrawingBuffer:true});r.setClearColor(0,0);
 const p=AV.crearYa(AV.azar?AV.azar():'');if(!p){r.dispose();return}AV.quita(p);
 const esc=new THREE.Scene();esc.add(p);esc.overrideMaterial=new THREE.MeshBasicMaterial({color:0xffffff});p.rotation.y=GIRO;
 p.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(p),H=bx.max.y-bx.min.y||1,cy=(bx.max.y+bx.min.y)/2,L=H*1.3;
 const cam=new THREE.OrthographicCamera(-L,L,L,-L,-10*H,10*H);cam.position.set(0,cy,5*H);cam.lookAt(0,cy,0);
 const mx=new THREE.AnimationMixer(p),t2=document.createElement('canvas');t2.width=t2.height=W;const c2=t2.getContext('2d',{willReadFrequently:true});
 const out=document.createElement('canvas');out.width=out.height=S;const co=out.getContext('2d');
 for(const nom of Object.keys(b.clips)){const clip=b.clips[nom];if(!/^[A-Z]/.test(nom)||!EICO.CLIPS.includes(nom))continue;
  mx.stopAllAction();const a=mx.clipAction(clip);a.reset().play();
  const fr=A[nom]!=null?[A[nom]]:Array.from({length:N},(_,i)=>(i+.5)/N);let mejor=null;
  for(const f of fr){mx.setTime(clip.duration*f);p.updateMatrixWorld(true);r.render(esc,cam);c2.clearRect(0,0,W,W);c2.drawImage(cv,0,0);
   const k=caja(c2,W);if(!k)continue;const pt=k.w*k.h;if(!mejor||pt>mejor.pt)mejor={pt,k,img:c2.getImageData(0,0,W,W)}}
  if(!mejor)continue;c2.putImageData(mejor.img,0,0);const k=mejor.k,m=S*.12,z=Math.min((S-2*m)/k.w,(S-2*m)/k.h);
  const dw=k.w*z,dh=k.h*z,dx=(S-dw)/2,dy=(S-dh)/2+S*.02;co.clearRect(0,0,S,S);
  co.save();co.shadowColor='rgba(60,30,10,.45)';co.shadowOffsetX=S*.025;co.shadowOffsetY=S*.03;co.shadowBlur=0;
  co.drawImage(t2,k.x0,k.y0,k.w,k.h,dx,dy,dw,dh);co.restore();urls[nom]=out.toDataURL('image/png')}
 mx.stopAllAction();mx.uncacheRoot(p);esc.remove(p);esc.overrideMaterial.dispose();r.dispose();r.forceContextLoss()}
window.EICO={A,CLIPS:['Twerk','Capoeira','Macarena','House','HipHop','Footwork','Freezes','Clasico'],prep,pinta,url:n=>urls[n]||''};
})();
