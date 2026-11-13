// Pruebas del Póker (evaluador, rondas, botes paralelos, bots).  Uso: node tests/poker.js
const assert=require('assert'),PE=require('../poker_eval.js'),PK=require('../g_poker.js'),BOT=require('../g_poker_bot.js');
let n=0;const ok=(t,f)=>{try{f();n++}catch(e){console.error('x '+t);throw e}};
// Carta por nombre: 'As' = As de picas (palos s h d c = 0 1 2 3), 'Th' = 10 de corazones.
const C=x=>{const r='A23456789TJQK'.indexOf(x[0]),s='shdc'.indexOf(x[1]);return s*13+r},H=s=>s.split(' ').map(C);
const P=s=>PE.puntos(H(s)),nom=s=>PE.nombre(P(s));
// Mesa de prueba: jugadores en asientos dados; 'cartas' es el orden exacto del mazo (lo demás se rellena).
function prueba(js,cartas=[],fichas={}){let t=0;const z0=H(cartas.join(' ')||'2s').slice(0,cartas.length),resto=[];for(let c=0;c<52;c++)if(!z0.includes(c))resto.push(c);
 const T=PK.mesa({now:()=>t,barajar:()=>z0.concat(resto),bots:false});T.t=()=>t;T.av=(ms)=>{t=ms==null?T.S.plazo:t+ms;T.tick()};
 js.forEach(([id,s])=>{T.act(id,id,{op:'sentar',s});if(fichas[id])T.S.as[s].f=fichas[id]});T.av();return T}
const A=(T,id,op,v)=>T.act(id,id,{op,v}),f=(T,s)=>T.S.as[s].f;

ok('categorías en orden',()=>{const L=['As Ks Qs Js Ts','9h 8h 7h 6h 5h','Ac Ad Ah As 2c','Kc Kd Kh 2s 2c','2h 7h 9h Jh Kh','5c 6d 7h 8s 9c','Qc Qd Qh 3s 4c','Jc Jd 3h 3s 4c','Tc Td 3h 6s 4c','Ac Jd 3h 6s 4c'];
 for(let i=1;i<L.length;i++)assert(P(L[i-1])>P(L[i]),L[i-1]+' > '+L[i])});
ok('nombres',()=>{assert.strictEqual(nom('As Ks Qs Js Ts'),'Escalera real');assert.strictEqual(nom('9h 8h 7h 6h 5h'),'Escalera de color');assert.strictEqual(nom('Jc Jd 3h 3s 4c'),'Doble par');
 assert.strictEqual(nom('Ah Kd'),'Carta alta');assert.strictEqual(nom('Ah Ad'),'Par')});
ok('escalera baja A-5 pierde con 2-6',()=>{assert(P('Ah 2c 3d 4s 5h')<P('2c 3d 4s 5h 6c'));assert.strictEqual(nom('Ah 2c 3d 4s 5h Kc Qd'),'Escalera')});
ok('desempates',()=>{assert(P('Ah Ad Kc 7s 2d')>P('Ah Ad Qc Js Td'));assert(P('Kh Kd 4c 4s Ad')>P('Kh Kd 4c 4s Qd'));
 assert.strictEqual(P('Ah Kd 9c 7s 2d 3h 4c'),P('Ac Kh 9d 7c 2s 3d 4s'))});
ok('siete cartas: el mejor color y el full más alto',()=>{assert.strictEqual(P('2h 7h 9h Jh Kh 3h Ad'),P('3h 7h 9h Jh Kh'));
 assert.strictEqual(P('Kc Kd Kh 2s 2c 2d 9s'),P('Kc Kd Kh 2s 2c'))});
ok('mejores 5 cartas',()=>{const m=PE.mejores(H('2h 7h 9h Jh Kh 3c Ad'));assert.strictEqual(m.length,5);assert(m.every(c=>(c/13|0)==1))});
ok('equidad y outs',()=>{const e=PE.equidad(H('Ah Ad'),[],1,2000);assert(e>0.78&&e<0.9,e);
 assert.strictEqual(PE.outs(H('Ah Kh'),H('2h 7h Qc')),15)});

ok('mano a mano: el botón pone la chica y habla primero; retirarse',()=>{const T=prueba([['a',0],['b',3]]);
 assert.strictEqual(T.S.btn,0);assert.strictEqual(T.S.sb,0);assert.strictEqual(T.S.bb,3);assert.strictEqual(T.S.turno,0);
 A(T,'a','retirar');assert.strictEqual(T.S.fase,'fin');assert.strictEqual(f(T,0),995);assert.strictEqual(f(T,3),1005);
 assert.strictEqual(T.view('b').res[0].v,10);T.av();assert.strictEqual(T.S.btn,3);assert.strictEqual(T.S.sb,3)});
ok('la ciega grande tiene opción',()=>{const T=prueba([['a',0],['b',1],['c',2]]);   // btn 0, sb 1, bb 2; habla 0
 A(T,'a','igualar');A(T,'b','igualar');assert.strictEqual(T.S.turno,2);A(T,'c','pasar');assert.strictEqual(T.S.fase,'pausa');assert.strictEqual(T.S.mesa.length,3);
 T.av();assert.strictEqual(T.S.fase,'mano');assert.strictEqual(T.S.turno,1)});
ok('no se puede pasar con apuesta ni subir menos del mínimo',()=>{const T=prueba([['a',0],['b',1],['c',2]]);
 assert.strictEqual(A(T,'a','pasar'),'No puedes pasar: hay apuesta');assert.strictEqual(A(T,'a','subir',15),'Lo mínimo es 20');
 A(T,'a','subir',30);assert.strictEqual(T.S.minR,20);assert.strictEqual(A(T,'b','subir',40),'Lo mínimo es 50')});
ok('botes paralelos con dos todo',()=>{   // reparto desde la chica: b c a b c a; quema, flop, quema, turn, quema, river
 const T=prueba([['a',0],['b',1],['c',2]],['Ks','Qs','As','Kh','Qh','Ah','5c','2d','7c','9d','6h','Jc','8s','4d'],{a:100,b:300});
 A(T,'a','todo');A(T,'b','todo');A(T,'c','igualar');assert.strictEqual(T.S.corre,1);assert.strictEqual(T.S.mesa.length,3);
 assert.deepStrictEqual(T.S.botes.map(b=>b.v),[300,400]);T.av();T.av();T.av();assert.strictEqual(T.S.fase,'fin');
 assert.strictEqual(f(T,0),300);assert.strictEqual(f(T,1),400);assert.strictEqual(f(T,2),700);
 const r=T.view().res;assert.deepStrictEqual(r.map(x=>x.g),[[0],[1]]);assert.strictEqual(r[0].nom,'Par');assert.strictEqual(T.view().as[2].c[0],C('Qs'))});
ok('bote dividido',()=>{   // mesa con escalera para todos
 const T=prueba([['a',0],['b',1],['c',2]],['2c','3c','4c','2d','3d','4d','5h','9s','Ts','Jd','6h','Qh','7h','Kd']);
 A(T,'a','igualar');A(T,'b','igualar');A(T,'c','subir',20);A(T,'a','retirar');A(T,'b','igualar');   // bote 10+20+20 = 50
 for(let k=0;k<3;k++){T.av();A(T,'b','pasar');A(T,'c','pasar')}assert.strictEqual(T.S.fase,'fin');
 assert.deepStrictEqual(T.S.res[0].g,[1,2]);assert.strictEqual(T.S.res[0].v,50);assert.strictEqual(f(T,1),1005);assert.strictEqual(f(T,2),1005)});
ok('la apuesta que nadie iguala regresa',()=>{const T=prueba([['a',0],['b',1],['c',2]]);A(T,'a','subir',200);A(T,'b','retirar');A(T,'c','retirar');
 assert.strictEqual(f(T,0),1015);assert.strictEqual(T.S.res[0].v,25)});
ok('todo corto no reabre la subida',()=>{const T=prueba([['a',0],['b',1],['c',2]],[],{b:45});
 A(T,'a','subir',30);A(T,'b','todo');assert.strictEqual(T.S.alta,45);A(T,'c','igualar');assert.strictEqual(T.S.turno,0);
 assert.strictEqual(A(T,'a','subir',100),'Solo puedes igualar o retirarte');A(T,'a','igualar');assert.strictEqual(T.S.fase,'pausa')});
ok('se acaba el tiempo: pasa o se retira',()=>{const T=prueba([['a',0],['b',1],['c',2]]);T.av();assert(T.S.as[0].fold);
 A(T,'b','igualar');A(T,'c','pasar');T.av();assert.strictEqual(T.S.turno,1);T.av();assert.strictEqual(T.S.as[1].fold,0);assert.strictEqual(T.S.turno,2)});
ok('irse a media mano deja sus fichas en el bote',()=>{const T=prueba([['a',0],['b',1],['c',2]]);A(T,'a','subir',50);A(T,'b','parar');
 A(T,'c','retirar');assert.strictEqual(T.S.fase,'fin');assert.strictEqual(f(T,0),1015);assert.strictEqual(T.S.as[1],null)});
ok('ver: cartas ajenas tapadas, se enseñan al final si quieres',()=>{const T=prueba([['a',0],['b',1]]);const v=T.view('a');
 assert(v.as[0].c[0]>=0);assert.deepStrictEqual(v.as[1].c,[-1,-1]);assert.deepStrictEqual(T.view('x').as[0].c,[-1,-1]);
 A(T,'a','retirar');A(T,'b','mostrar');assert(T.view('a').as[1].c[0]>=0)});
ok('bots: completan la mesa a 4 y se van al llegar gente',()=>{let t=0;const T=PK.mesa({now:()=>t});T.act('h1','Ana',{op:'sentar',s:0});
 assert.strictEqual(T.S.as.filter(a=>a&&a.bot).length,3);T.act('h2','Beto',{op:'sentar',s:1});assert.strictEqual(T.S.as.filter(a=>a&&a.bot).length,2);
 T.act('h1','Ana',{op:'parar'});T.act('h2','Beto',{op:'parar'});assert.strictEqual(T.S.as.filter(Boolean).length,0)});
ok('bots: decisiones válidas',()=>{for(let i=0;i<50;i++){const d=BOT.decide({c:H('7c 2d'),mesa:[],alta:10,ap:0,f:1000,minR:10,lim:0,calle:0,BB:10,rivales:3,bote:15});
  assert(['retirar','igualar','subir','todo'].includes(d.op))}
 const d=BOT.decide({c:H('Ah Ad'),mesa:H('As Ac 2d'),alta:0,ap:0,f:1000,minR:10,lim:0,calle:1,BB:10,rivales:2,bote:60},()=>0.5);assert(d.op=='subir'&&d.v>=10)});
ok('300 manos con bots: las fichas cuadran',()=>{let t=0;const T=PK.mesa({now:()=>t});T.act('h','Ana',{op:'sentar',s:2});let manos=0,ini=0,mano=0;
 for(let k=0;k<200000&&manos<300;k++){t+=500;
  if(T.S.fase=='mano'&&T.S.turno==2){const a=T.S.as[2],r=Math.random();T.act('h','Ana',r<.3?{op:'igualar'}:r<.5?{op:'subir',v:T.S.alta+T.S.minR}:r<.6?{op:'todo'}:{op:a.ap<T.S.alta?'retirar':'pasar'})}
  T.tick(()=>true);
  if(T.S.mano!=mano&&T.S.fase!='espera'){mano=T.S.mano;ini=T.S.as.reduce((s,a)=>s+(a?a.f+a.tot:0),0)}
  if(T.S.fase=='fin'&&T.S.mano==mano&&mano!=manos){manos=mano;assert.strictEqual(T.S.as.reduce((s,a)=>s+(a?a.f:0),0),ini,'mano '+mano)}}
 assert(manos>=300,manos)});
console.log('poker: '+n+' pruebas bien');
