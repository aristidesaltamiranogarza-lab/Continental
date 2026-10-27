// Cubilete (dados de póker) en una mesita de la esquina de la Casa 3D. Sin salas: lo usa server.js desde /casa (b.cub).
// 5 dados con caras 0..5 = 9, 10, J, Q, K, A. De 2 a 6 jugadores. Cada ronda todos ponen ANTE fichas al bote; por turnos,
// cada quien tira hasta 3 veces (aparta los dados que quiera y tira el resto) o se planta. La mejor jugada se lleva el bote; empate lo reparte.
// Quintilla > Póker > Full > Corrida > Tercia > Dos pares > Par > Nada.  Fichas: empiezas con 100; si te quedas sin fichas te regalan 100.
const FN=['9','10','J','Q','K','A'],ANTE=10,MAX=6,TURN=30000;
function rank(d){const c=[0,0,0,0,0,0];d.forEach(v=>c[v]++);const g=[0,1,2,3,4,5].filter(v=>c[v]).sort((a,b)=>c[b]-c[a]||b-a),n=g.map(v=>c[v]);
 let cat=0;if(n[0]==5)cat=7;else if(n[0]==4)cat=6;else if(n[0]==3&&n[1]==2)cat=5;else if(n.length==5&&g[0]-g[4]==4)cat=4;else if(n[0]==3)cat=3;else if(n[0]==2&&n[1]==2)cat=2;else if(n[0]==2)cat=1;
 return [cat,...g]}
const cmp=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]??-1)-(b[i]??-1);if(d)return d}return 0};
const rname=r=>{const c=r[0],f=v=>FN[v];return c==7?'Quintilla de '+f(r[1]):c==6?'Póker de '+f(r[1]):c==5?'Full de '+f(r[1])+' y '+f(r[2]):c==4?'Corrida':c==3?'Tercia de '+f(r[1]):c==2?'Dos pares ('+f(r[1])+' y '+f(r[2])+')':c==1?'Par de '+f(r[1]):'Nada (al '+f(r[1])+')'};
const C={st:'open',p:[],nm:{},f:{},ti:0,dice:[-1,-1,-1,-1,-1],held:[0,0,0,0,0],rolls:0,res:{},w:[],pot:0,rn:0,tt:0,msg:''};
function newTurn(){C.dice=[-1,-1,-1,-1,-1];C.held=[0,0,0,0,0];C.rolls=0;C.tt=Date.now()}
function settle(){const L=C.p.filter(k=>C.res[k]);C.st='end';C.w=[];if(!L.length){C.msg='';return}
 let best=L[0];L.forEach(k=>{if(cmp(C.res[k].r,C.res[best].r)>0)best=k});C.w=L.filter(k=>cmp(C.res[k].r,C.res[best].r)==0);
 const part=Math.floor(C.pot/C.w.length);C.w.forEach(k=>C.f[k]+=part);
 C.msg=(C.w.length>1?'Empate: '+C.w.map(k=>C.nm[k]).join(' y ')+' se reparten':C.nm[best]+' gana')+' '+C.pot+' fichas con '+rname(C.res[best].r);C.pot=0}
function next(){for(let j=1;j<=C.p.length;j++){const t=(C.ti+j)%C.p.length;if(!C.res[C.p[t]]){C.ti=t;newTurn();return}}settle()}
function stand(id){C.res[id]={d:C.dice.slice(),r:rank(C.dice)};next()}
function roll(){for(let i=0;i<5;i++)if(!C.held[i]||C.dice[i]<0)C.dice[i]=Math.random()*6|0;C.rolls++;C.tt=Date.now()}
function leave(id){const k=C.p.indexOf(id);if(k<0)return;const cur=C.st=='play'&&C.p[C.ti]===id;C.p.splice(k,1);delete C.res[id];
 if(C.st!='play')return;if(C.p.length<2){C.p.forEach(x=>C.f[x]+=Math.floor(C.pot/Math.max(1,C.p.length)));C.pot=0;C.st='end';C.w=[];C.msg='Se acabó la ronda: quedó un solo jugador';return}
 if(k<C.ti)C.ti--;if(cur){C.ti=(C.ti-1+C.p.length)%C.p.length;next()}}
// alive: ids que siguen en la casa
function tick(alive){C.p.filter(id=>!alive(id)).forEach(leave);
 if(C.st=='play'&&Date.now()-C.tt>TURN){const id=C.p[C.ti];if(C.rolls==0)roll();stand(id)}}   // se tardó: se planta solo
function act(id,name,m){m=m||{};C.nm[id]=name;if(C.f[id]==null)C.f[id]=100;const op=m.op;
 if(op=='join'){if(C.p.includes(id))return;if(C.p.length>=MAX)return C.msg='Ya son '+MAX+' en el Cubilete';C.p.push(id);if(C.st=='end'){C.st='open';C.res={};C.w=[]}return}
 if(!C.p.includes(id))return;
 if(op=='leave')return leave(id);
 if(op=='start'){if(C.st=='play'||C.p.length<2)return;C.p.forEach(k=>{if(C.f[k]<ANTE)C.f[k]+=100;C.f[k]-=ANTE});C.pot=ANTE*C.p.length;
  C.st='play';C.res={};C.w=[];C.msg='';C.rn++;C.ti=(C.rn-1)%C.p.length;newTurn();return}
 if(C.st!='play'||C.p[C.ti]!==id)return;
 if(op=='hold'){const i=m.i|0;if(C.rolls>0&&i>=0&&i<5)C.held[i]=C.held[i]?0:1;return}
 if(op=='roll'){if(C.rolls>=3)return;roll();if(C.rolls>=3)stand(id);return}
 if(op=='stand'&&C.rolls>0)return stand(id)}
function view(){return {st:C.st,p:C.p.map(k=>({id:k,n:C.nm[k],f:C.f[k],r:C.res[k]?{d:C.res[k].d,t:rname(C.res[k].r)}:null})),ti:C.ti,dice:C.dice,held:C.held,rolls:C.rolls,pot:C.pot,w:C.w,rn:C.rn,msg:C.msg,ante:ANTE,
 left:C.st=='play'?Math.max(0,TURN-(Date.now()-C.tt)):0}}
module.exports={act,tick,view,FN};
