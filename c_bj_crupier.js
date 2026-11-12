// c_bj_crupier.js — BJC: el crupier del Blackjack, un personaje (AV) de pie en la tarima detrás de la media luna de CAS3.blackjack (sótano).
// BJC.pon(mesa) lo pone (c_sotano_salon.js; mesa = {G,D}). BJC.estado(v) recibe la vista bj de /casa (c_casa3d.js) y anima lo nuevo:
// cada carta: la mano izquierda va al zapato y la derecha la lanza a la casilla; voltea su carta tapada; mira a quien tiene el turno.
// A mano (en cola): BJC.reparte(i) (casilla 0–6; -1 la suya), BJC.voltea(); BJC.mira(i|null). BJC.paso() cada cuadro (SAL.step).
// Para c_blackjack3d.js: BJC.mano() punto del mundo de su mano derecha; BJC.al(fn): fn('carta',i) al soltar una carta, fn('voltea') al voltear;
// BJC.LUGAR = dónde van sus cartas (espacio de la mesa, +z hacia los jugadores).
(function(){
if(typeof THREE==='undefined')return;
const COD='s1p2c2b1n1a1d1-1268',LUGAR=[0,.47];   // código AV: camisa vino y pantalón oscuro
// gestos encima de AV.GE (radianes desde AgarreFrente; medidos con la mano sobre el paño, el zapato y su carta):
// apo/apd las manos juntas apoyadas en la orilla, detrás de la charola (codos parejos; resueltas midiendo manos y codos), zap la izquierda sobre el zapato, rep la derecha lanza al frente, vol la derecha sobre su carta, gir le gira la muñeca
const GES={apo:{I:[-.16,.06,-.6,-1.84]},apd:{D:[.45,-.18,.56,1.5]},zap:{I:[-1.5,1,-.4,-.4],D:[-.7,.5,0,0]},rep:{D:[-1.1,-1,.6,0],I:[-.35,0,0,0]},vol:{D:[-.1,.9,-.1,0]},gir:{D:[0,0,0,-1.6]}};
const G0={cy:0,cx:.2,gy:0,col:0,apo:1,apd:1,zap:0,rep:0,vol:0,gir:0,mano:0},PJ=new THREE.Vector3();
let mesa=null,p=null,LZ=[],POS=[0,-.3],ZAP=[.76,.2],cola=[],act=null,mir=null,prev=null,cb=null,g={...G0},giro=0,tA=0,suelto=true;
const ang=t=>Math.atan2(t[0]-POS[0],t[1]-POS[1]);   // + hacia su izquierda (+x)
const dest=i=>i<0||!mesa?LUGAR:mesa.D.casillas[i];
// luz propia: una cálida de frente y arriba (que se le vea la cara y la ropa) y otra detrás que lo despega del papel tapiz; sin sombras
function luces(G,D){const y=D.tarima||0;[[0xffe6c4,3,2.6,[0,y+2.2,POS[1]+1.1]],[0xffd9a8,2.2,1.6,[0,y+1.9,POS[1]-.65]]].forEach(([c,i,d,q])=>{const l=new THREE.PointLight(c,i,d,1.5);l.position.set(...q);G.add(l);LZ.push(l)})}
function pon(m){quita();mesa=m;if(!window.AV||!m)return;const D=m.D;POS=D.crupier||POS;ZAP=D.zapato||ZAP;luces(m.G,D);
 AV.crear(COD).then(q=>{if(!q||mesa!==m)return q&&AV.quita(q);p=q;for(const k in GES)AV.GE[k]=GES[k];
  q.position.set(POS[0],D.tarima||0,POS[1]);q.traverse(o=>{if(o.isMesh)o.castShadow=true});m.G.add(q);AV.pose(q,'AgarreFrente',0);AV.agarre(q,'I',.25);AV.agarre(q,'D',.25)}).catch(()=>{})}
function quita(){LZ.splice(0).forEach(l=>l.parent&&l.parent.remove(l));if(p){if(p.parent)p.parent.remove(p);AV.quita(p)}p=null;mesa=null;cola=[];act=null;g={...G0};giro=0}
function mete(o){o.en=performance.now();if(cola.length<40)cola.push(o)}
const reparte=i=>mete({t:'rep',i}),voltea=()=>mete({t:'vol'}),mira=i=>{mir=i==null||i<0?null:i};
// vista bj: cartas por asiento y del crupier; la ronda nueva se reparte en su orden (dos vueltas: cada casilla y luego él)
function estado(v){if(!v||!v.as||!v.cr)return;const cn=a=>a&&a.manos?a.manos.reduce((s,h)=>s+h.c.length,0):0;
 const n={r:v.ronda,as:v.as.map(cn),cr:v.cr.c.length,tap:v.cr.c.includes(-1)};
 if(prev&&p){if(n.r!==prev.r){for(let k=0;k<2;k++){n.as.forEach((c,i)=>{if(c>k)reparte(i)});if(n.cr>k)reparte(-1)}
   n.as.forEach((c,i)=>{for(let j=2;j<c;j++)reparte(i)});if(!n.tap&&n.cr>=2)voltea();for(let j=2;j<n.cr;j++)reparte(-1)}
  else{n.as.forEach((c,i)=>{for(let j=prev.as[i]||0;j<c;j++)reparte(i)});if(prev.tap&&!n.tap)voltea();for(let j=Math.max(2,prev.cr);j<n.cr;j++)reparte(-1)}}
 prev=n;mira(v.fase==='turnos'&&v.turno?v.turno.s:null)}
const S=(a,b,u)=>u<=a?0:u>=b?1:(u=(u-a)/(b-a),u*u*(3-2*u));   // rampa suave de a a b
function paso(){if(!p)return;const t=performance.now(),dt=Math.min(.1,(t-(tA||t))/1000);tA=t;
 if(!act&&cola.length){act=cola.shift();if(t-act.en>5000){act=null;cola=cola.filter(o=>t-o.en<=5000)}else{act.t0=t;act.d=act.t==='vol'?750:cola.length>5?260:340;suelto=false}}
 const m={...G0};let aim=mir==null?0:ang(dest(mir))*.7;
 if(act){const u=Math.min(1,(t-act.t0)/act.d);
  if(act.t==='rep'){const a1=ang(ZAP),a2=ang(dest(act.i));aim=a1+(a2-a1)*S(.3,.6,u);
   m.zap=S(0,.3,u)*(1-S(.4,.65,u));m.rep=S(.4,.7,u)*(1-.7*S(.85,1,u));m.col=.5*m.zap+.4*m.rep;
   if(!suelto&&u>=.72){suelto=true;if(cb)cb('carta',act.i)}}
  else{aim=0;m.cx=.35;m.vol=S(0,.25,u)*(1-S(.8,1,u));m.col=.15*m.vol;m.gir=S(.35,.6,u)*(1-S(.8,1,u));m.mano=.2*S(.35,.5,u)*(1-S(.5,.7,u));
   if(!suelto&&u>=.5){suelto=true;if(cb)cb('voltea')}}
  if(u>=1)act=null}
 m.apo=1-m.zap;m.apd=Math.max(0,1-m.rep-m.vol);m.gy=aim*.35;m.cy=aim*.3;const f=Math.min(1,dt*14);
 for(const k in G0)g[k]+=(m[k]-g[k])*f;giro+=(aim*.45-giro)*f;p.rotation.y=giro;AV.gesto(p,g)}
function mano(){const b=p&&p.getObjectByName('mano_D');return b?b.getWorldPosition(PJ):null}
window.BJC={pon,quita,estado,paso,reparte,voltea,mira,mano,al:fn=>{cb=fn},LUGAR,get p(){return p}};
})();
