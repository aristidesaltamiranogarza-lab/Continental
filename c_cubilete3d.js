// Cubilete en una mesita de la esquina de la Casa 3D (reglas en g_cubilete.js). Sin salas: viaja en el mismo /casa que las posiciones.
// c_casa3d.js llama a CUB3.build / out / sync / hud / step. Se carga ANTES de c_casa3d.js.
(function(){
const X=13.2,Z=-10.6,FN=['9','10','J','Q','K','A'],FC=['#26262b','#26262b','#c62828','#c62828','#26262b','#c62828'];
let E=null,S=null,me='',open=false,q=null,dice=[],faces=[],snap='',rollT=0,sign=null;
const nm=p=>esc(p.n||'Jugador');
function build(e){E=e;const {THREE,SC,hits,OB,std,cyl,ctex,TH}=e,G=new THREE.Group();G.position.set(X,0,Z);SC.add(G);const hit={t:'cub'};
 // mesita redonda con fieltro café y una pata
 const top=cyl(1.15,1.15,.1,std(0x7a4a24,.85),0,TH,0,G,40);top.userData.hit=hit;hits.push(top);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.15,.08,10,40),std(0x4a2814,.45));rim.rotation.x=Math.PI/2;rim.position.y=TH+.04;G.add(rim);
 cyl(.12,.16,TH,std(0x4a2814,.45),0,TH/2,0,G,12);cyl(.6,.6,.06,std(0x4a2814,.45),0,.03,0,G,24);
 // el cubilete (vaso de cuero)
 const cup=cyl(.32,.26,.62,std(0x5a2a14,.6,{side:THREE.DoubleSide}),-.62,TH+.37,-.35,G,20);cup.userData.hit=hit;hits.push(cup);
 cyl(.335,.335,.06,std(0xc9a14a,.4,{metalness:.6}),-.62,TH+.66,-.35,G,20);
 // caras de los dados
 for(let v=0;v<6;v++)faces.push(new THREE.MeshStandardMaterial({roughness:.35,map:ctex('cubf'+v,128,128,(g,w,h)=>{g.fillStyle='#fbf7ec';g.fillRect(0,0,w,h);
  g.fillStyle=FC[v];g.font='bold '+(v==1?58:72)+'px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(FN[v],w/2,h/2+4)})}));
 for(let i=0;i<5;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(.24,.24,.24),faces.slice());d.castShadow=true;d.userData.hit=hit;G.add(d);hits.push(d);dice.push(d);put(i,-1,0)}
 OB.push({x:X,z:Z,r:1.6});
 sign=document.createElement('div');sign.className='w7 w7g h3sign';sign.innerHTML='🎲 <b>Cubilete</b><small>toca para jugar</small>';sign.onclick=()=>CUB3.open();}
// v: cara de arriba (-1: dado guardado en el cubilete); h: apartado
function put(i,v,h){const d=dice[i],T=E.TH+.17;if(v<0){d.visible=false;return}d.visible=true;
 const m=d.material;for(let k=0;k<6;k++)m[k]=faces[(v+k+1)%6];m[2]=faces[v];   // +y = la cara que salió
 d.userData.p=[-.35+i*.26,T,h?.55:.12];d.userData.v=v}
function sync(c,id){me=id;if(!c)return false;const k=JSON.stringify(Object.assign({},c,{left:0}));if(k===snap)return false;const o=S;S=c;snap=k;
 if(o&&c.rolls>o.rolls&&c.st=='play')rollT=performance.now(),sfx('draw');if(o&&o.st=='play'&&c.st=='end')sfx(c.w.includes(me)?'go':'tick');
 if(o&&o.st!='play'&&c.st=='play')sfx('go');
 const turn=c.st=='play'?c.p[c.ti]:null,res=!turn&&c.st=='end'&&c.w.length?c.p.find(p=>p.id===c.w[0]):null,d=res&&res.r?res.r.d:c.dice;
 for(let i=0;i<5;i++)put(i,d[i],c.st=='play'&&c.held[i]);
 return true}
function step(now,toPx,W){if(!E)return;const t=(now-rollT)/650;
 dice.forEach((d,i)=>{const p=d.userData.p;if(!p)return;if(t<1&&!(S&&S.held[i])){const k=1-t;d.position.set(p[0]+Math.sin(now/90+i)*.08*k,p[1]+Math.abs(Math.sin(t*Math.PI*2.5))*.5*k,p[2]+Math.cos(now/80+i)*.08*k);
   d.rotation.set(now/70*k+i,now/60*k,now/85*k)}else{d.position.set(p[0],p[1],p[2]);d.rotation.set(0,0,0)}});
 if(sign){if(!sign.isConnected){const app=document.getElementById('app');if(app)app.appendChild(sign)}
  const [x,y,vis]=toPx(new E.THREE.Vector3(X,E.TH+2.1,Z));sign.style.display=vis?'':'none';sign.style.transform=`translate(${Math.max(70,Math.min(W-70,x))}px,${y}px) translate(-50%,-100%)`;
  const sub=S&&S.p.length?S.p.length+(S.st=='play'?' jugando':' en la mesa'):'toca para jugar';const sm=sign.querySelector('small');if(sm.textContent!==sub)sm.textContent=sub}}
function out(){const o=q;q=null;return o}
const send=(op,x)=>{q=Object.assign({op},x||{});sfx('tick')};
function hud(busy){ if(!open||busy||!S)return '';const c=S,mine=c.p.find(p=>p.id===me),turn=c.st=='play'?c.p[c.ti]:null,my=turn&&turn.id===me;
 const die=(v,i,h)=>`<button class="w7b cubd${h?' on':''}" ${my&&c.rolls>0&&c.rolls<3?`onclick="CUB3.a('hold',${i})"`:'disabled'} aria-label="Dado ${FN[v]}">${v<0?'·':FN[v]}</button>`;
 let st=c.msg?'🏆 '+esc(c.msg):c.st=='play'?(my?'<b>¡Tu turno!</b> '+(c.rolls?'Toca los dados que quieres apartar y vuelve a tirar, o plántate':'Tira los dados'):'Turno de '+nm(turn)+'…')
  :c.p.length<2?'Se juega de 2 o más. Espera a que alguien se una.':'Listos para empezar.';
 let h=`<div id="h3win" class="w7 w7win" role="dialog" aria-labelledby="cubt"><div class="wt"><span id="cubt">🎲 Cubilete</span><button class="wx" onclick="CUB3.close()" aria-label="Cerrar">✕</button></div><div class="wb">
  <div class="h3d">Dados de póker: 9, 10, J, Q, K, A. Hasta 3 tiros por turno. Cada ronda todos ponen ${c.ante} fichas; la mejor jugada se lleva el bote.
   <span class="h3n">Quintilla › Póker › Full › Corrida › Tercia › Dos pares › Par</span></div>
  <div class="cubp">${c.p.map(p=>`<div class="${turn&&turn.id===p.id?'on':''}${c.w.includes(p.id)?' w':''}"><span>${nm(p)}${p.id===me?' (tú)':''}</span><small>${p.r?esc(p.r.t):''}</small><b>🪙 ${p.f}</b></div>`).join('')||'<div><small>Nadie en la mesa todavía</small></div>'}</div>
  ${c.pot?`<div class="h3n">Bote: 🪙 ${c.pot}</div>`:''}<div class="h3d">${st}</div>
  ${my?`<div class="cubr">${c.dice.map((v,i)=>die(v,i,c.held[i])).join('')}</div><div class="h3b"><button class="w7b dflt" onclick="CUB3.a('roll')"${c.rolls>=3?' disabled':''}>🎲 Tirar (${c.rolls}/3)</button>${c.rolls?`<button class="w7b" onclick="CUB3.a('stand')">✋ Plantarme</button>`:''}</div>`:''}
  <div class="h3b">${!mine?`<button class="w7b dflt" onclick="CUB3.a('join')">Sentarme a jugar</button>`:c.st!='play'?`${c.p.length>=2?`<button class="w7b dflt" onclick="CUB3.a('start')">▶ ${c.rn?'Otra ronda':'Empezar'} (${c.ante} fichas)</button>`:''}<button class="w7b" onclick="CUB3.a('leave')">Levantarme</button>`:''}</div>
 </div></div>`;return h}
window.CUB3={X,Z,build,sync,step,out,hud,a:(op,i)=>{send(op,i!=null?{i}:null);if(op=='leave')open=false},
 open:()=>{open=true;if(window.JG3)JG3.close(1);if(typeof casaClose=='function')casaClose();else render()},close:()=>{open=false;sfx('tick');render()},isOpen:()=>open};
})();
