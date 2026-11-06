// Cubilete en una mesita de la cantina del sótano (c_sotano.js) (reglas en g_cubilete.js). Sin salas: viaja en el mismo /casa que las posiciones.
// c_sotano.js llama a CUB3.build (con x, z); c_casa3d.js a out / sync / hud / step. Se carga ANTES de c_casa3d.js.
(function(){
let X=13.2,Z=-10.6;const FN=['9','10','J','Q','K','A'],FC=['#26262b','#26262b','#c62828','#c62828','#26262b','#c62828'];
let E=null,S=null,me='',open=false,q=null,dice=[],faces=[],snap='',rollT=0,sign=null;
const nm=p=>esc(p.n||'Jugador');
function build(e){if(E)return;E=e;if(e.x!=null){X=e.x;Z=e.z}const {THREE,SC,hits,OB,std,cyl,ctex,TH}=e,G=new THREE.Group();G.position.set(X,0,Z);SC.add(G);const hit={t:'cub'};
 // mesita de cantina: madera oscura con tapete verde, aro y pie torneado
 const wd=std(0x3a1e0e,.45),R=.8,top=cyl(R,R,.1,wd,0,TH,0,G,40);top.userData.hit=hit;hits.push(top);
 const fe=cyl(R-.13,R-.13,.012,std(0xffffff,.95,{map:ctex('cubfelt',256,256,(g,w,h)=>{const gr=g.createRadialGradient(128,128,8,128,128,128);gr.addColorStop(0,'#2f7550');gr.addColorStop(1,'#173f2a');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.globalAlpha=.06;for(let i=0;i<900;i++){g.fillStyle=i%2?'#fff':'#000';g.fillRect(Math.random()*w,Math.random()*h,1,1)}})}),0,TH+.055,0,G,40);fe.userData.hit=hit;hits.push(fe);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(R,.045,10,40),new THREE.MeshPhysicalMaterial({color:0x5a2e14,roughness:.35,clearcoat:.7}));rim.rotation.x=Math.PI/2;rim.position.y=TH+.03;rim.castShadow=true;G.add(rim);
 cyl(.07,.1,TH-.05,wd,0,(TH-.05)/2,0,G,14);cyl(.16,.12,.22,wd,0,TH*.35,0,G,14);cyl(.42,.46,.06,wd,0,.03,0,G,28);
 // el cubilete: cuero con costuras y aros de latón
 const cx=-.42,cz=-.36,cub=ctex('cubcuero',256,128,(g,w,h)=>{g.fillStyle='#6a2c14';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.fillStyle=`rgba(${i%2?'255,210,170':'20,5,0'},.07)`;g.fillRect(Math.random()*w,Math.random()*h,2,2)}
  g.fillStyle='#4a1c0a';g.fillRect(0,14,w,20);g.fillRect(0,h-30,w,18);g.fillStyle='#e2c08a';for(let x=2;x<w;x+=10){g.fillRect(x,9,5,2);g.fillRect(x,h-36,5,2)}
  g.strokeStyle='#c9a14a';g.lineWidth=3;for(let k=0;k<4;k++){const x=k*64+32;g.beginPath();g.moveTo(x,46);g.lineTo(x+12,64);g.lineTo(x,82);g.lineTo(x-12,64);g.closePath();g.stroke()}});
 const cup=new THREE.Mesh(new THREE.CylinderGeometry(.13,.112,.25,28,1,true),std(0xffffff,.55,{map:cub,side:THREE.DoubleSide}));cup.position.set(cx,TH+.06+.125,cz);cup.castShadow=true;cup.userData.hit=hit;G.add(cup);hits.push(cup);
 const brass=std(0xc9a14a,.3,{metalness:.7});[[.13,.25],[.113,0]].forEach(([r,y])=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,.009,6,28),brass);t.rotation.x=Math.PI/2;t.position.set(cx,TH+.06+y,cz);G.add(t)});
 cyl(.112,.112,.01,std(0x2a1006,.8),cx,TH+.065,cz,G,24);
 // caballito de tequila con su limón
 const sx=.5,sz=-.32,gl=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.04,0],[.046,.11],[.042,.11],[.036,.012],[0,.012]].map(p=>new THREE.Vector2(p[0],p[1])),18),std(0xeef7f8,.05,{transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));
 gl.position.set(sx,TH+.06,sz);G.add(gl);cyl(.039,.036,.07,std(0xd9a441,.15,{transparent:true,opacity:.85}),sx,TH+.06+.047,sz,G,18);
 const li=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.03,16,1,false,0,Math.PI),[std(0x3f8f2a,.6),std(0xd8e98a,.7),std(0xd8e98a,.7)]);li.rotation.set(0,.6,Math.PI/2);li.position.set(sx+.1,TH+.06+.045,sz+.12);li.castShadow=true;G.add(li);
 // caras de los dados
 for(let v=0;v<6;v++)faces.push(new THREE.MeshStandardMaterial({roughness:.35,map:ctex('cubf'+v,128,128,(g,w,h)=>{g.fillStyle='#fbf7ec';g.fillRect(0,0,w,h);
  g.fillStyle=FC[v];g.font='bold '+(v==1?58:72)+'px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(FN[v],w/2,h/2+4)})}));
 for(let i=0;i<5;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12),faces.slice());d.castShadow=true;d.userData.hit=hit;G.add(d);hits.push(d);dice.push(d);put(i,-1,0)}
 OB.push({x:X,z:Z,r:1.1});if(S)paint();
 sign=document.createElement('div');sign.className='ui ui-fx ui-glass h3sign';sign.dataset.g='cub';sign.innerHTML='<b>Cubilete</b><small>sin partidas</small>';sign.onclick=()=>CUB3.open();}
// v: cara de arriba (-1: dado guardado en el cubilete); h: apartado
function put(i,v,h){const d=dice[i],T=E.TH+.125,idle=v<0;if(idle)v=[5,5,3,2,0][i];d.visible=true;   // sin partida: tirados en el tapete
 const m=d.material;for(let k=0;k<6;k++)m[k]=faces[(v+k+1)%6];m[2]=faces[v];   // +y = la cara que salió
 d.userData.p=idle?[[-.16,T,.08],[.02,T,.2],[.12,T,-.02],[.27,T,.16],[-.04,T,-.1]][i]:[-.3+i*.15,T,h?.38:.04];d.userData.v=v}
function sync(c,id){me=id;if(!c)return false;const k=JSON.stringify(Object.assign({},c,{left:0}));if(k===snap)return false;const o=S;S=c;snap=k;
 if(o&&c.rolls>o.rolls&&c.st=='play')rollT=performance.now(),sfx('draw');if(o&&o.st=='play'&&c.st=='end')sfx(c.w.includes(me)?'go':'tick');
 if(o&&o.st!='play'&&c.st=='play')sfx('go');
 if(E)paint();return true}
function paint(){const c=S,turn=c.st=='play'?c.p[c.ti]:null,res=!turn&&c.st=='end'&&c.w.length?c.p.find(p=>p.id===c.w[0]):null,d=res&&res.r?res.r.d:c.dice;
 for(let i=0;i<5;i++)put(i,d[i],c.st=='play'&&c.held[i])}
function step(now,toPx,W,here){if(!E)return;if(!here){if(sign)sign.style.display='none';return}const t=(now-rollT)/650;
 dice.forEach((d,i)=>{const p=d.userData.p;if(!p)return;if(t<1&&!(S&&S.held[i])){const k=1-t;d.position.set(p[0]+Math.sin(now/90+i)*.04*k,p[1]+Math.abs(Math.sin(t*Math.PI*2.5))*.28*k,p[2]+Math.cos(now/80+i)*.04*k);
   d.rotation.set(now/70*k+i,now/60*k,now/85*k)}else{d.position.set(p[0],p[1],p[2]);d.rotation.set(0,0,0)}});
 if(sign){if(!sign.isConnected){const app=document.getElementById('app');if(app)app.appendChild(sign)}
  const [x,y,vis]=toPx(new E.THREE.Vector3(X,E.TH+1.3,Z));sign.style.display=vis?'':'none';sign.style.transform=`translate(${Math.max(70,Math.min(W-70,x))}px,${y}px) translate(-50%,-100%)`;
  const sub=S&&S.p.length?S.p.length+(S.st=='play'?' jugando':' en la mesa'):'sin partidas';const sm=sign.querySelector('small');if(sm.textContent!==sub)sm.textContent=sub}}
function out(){const o=q;q=null;return o}
const send=(op,x)=>{q=Object.assign({op},x||{});sfx('tick')};
function hud(busy){ if(!open||busy||!S)return '';const c=S,mine=c.p.find(p=>p.id===me),turn=c.st=='play'?c.p[c.ti]:null,my=turn&&turn.id===me;
 const die=(v,i,h)=>`<button class="ui-rb cubd${h?' on':''}" ${my&&c.rolls>0&&c.rolls<3?`onclick="CUB3.a('hold',${i})"`:'disabled'} aria-label="Dado ${FN[v]}">${v<0?'·':FN[v]}</button>`;
 let st=c.msg?'🏆 '+esc(c.msg):c.st=='play'?(my?'<b>¡Tu turno!</b> '+(c.rolls?'Toca los dados que quieres apartar y vuelve a tirar, o plántate':'Tira los dados'):'Turno de '+nm(turn)+'…')
  :c.p.length<2?'Se juega de 2 o más. Espera a que alguien se una.':'Listos para empezar.';
 let h=GHUD.win('<img class="gic" src="iconos/cub.png" alt=""> Cubilete',`
  <div class="h3d">Dados de póker: 9, 10, J, Q, K, A. Hasta 3 tiros por turno. Cada ronda todos ponen ${c.ante} fichas; la mejor jugada se lleva el bote.
   <span class="h3n">Quintilla › Póker › Full › Corrida › Tercia › Dos pares › Par</span></div>
  <div class="cubp">${c.p.map(p=>`<div class="${turn&&turn.id===p.id?'on':''}${c.w.includes(p.id)?' w':''}"><span>${nm(p)}${p.id===me?' (tú)':''}</span><small>${p.r?esc(p.r.t):''}</small><b>🪙 ${p.f}</b></div>`).join('')||'<div><small>Nadie en la mesa todavía</small></div>'}</div>
  ${c.pot?`<div class="h3n">Bote: 🪙 ${c.pot}</div>`:''}<div class="h3d">${st}</div>
  ${my?`<div class="cubr">${c.dice.map((v,i)=>die(v,i,c.held[i])).join('')}</div><div class="h3b"><button class="ui-btn" onclick="CUB3.a('roll')"${c.rolls>=3?' disabled':''}>🎲 Tirar (${c.rolls}/3)</button>${c.rolls?`<button class="ui-btn sec" onclick="CUB3.a('stand')">✋ Plantarme</button>`:''}</div>`:''}
  <div class="h3b">${!mine?`<button class="ui-btn" onclick="CUB3.a('join')">Sentarme a jugar</button>`:c.st!='play'?`${c.p.length>=2?`<button class="ui-btn" onclick="CUB3.a('start')">▶ ${c.rn?'Otra ronda':'Empezar'} (${c.ante} fichas)</button>`:''}<button class="ui-btn sec" onclick="CUB3.a('leave')">Levantarme</button>`:''}</div>`,'CUB3.close()');return h}
window.CUB3={get X(){return X},get Z(){return Z},n:()=>S?S.p.length:0,play:()=>!!(S&&S.st=='play'),build,sync,step,out,hud,a:(op,i)=>{send(op,i!=null?{i}:null);if(op=='leave')open=false},
 open:()=>{open=true;if(window.JG3)JG3.close(1);if(typeof casaClose=='function')casaClose();else render()},close:()=>{open=false;sfx('tick');render()},isOpen:()=>open};
})();
