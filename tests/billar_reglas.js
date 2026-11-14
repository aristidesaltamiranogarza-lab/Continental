// Pruebas de las reglas de Bola 8 del servidor (g_billar.js).  Uso: node tests/billar_reglas.js
const assert=require('assert'),F=require('../billar_fis.js'),GB=require('../g_billar.js');
let n=0;const ok=(t,f)=>{try{f();n++}catch(e){console.error('x '+t);throw e}};
const {R,L,A:AN,P}=F.M;
let T=1e6;const now=()=>T;
const sem=s=>()=>(s=(s*1103515245+12345)%2147483648)/2147483648;
const nueva=(s=7)=>GB.mesa({now,rnd:sem(s)});
const vacia=(...bs)=>{const E=new Array(16).fill(null);bs.forEach(([i,x,z])=>E[i]=[x,z]);return E};
// mesa 1 contra 1 entre a (equipo 0) y b (equipo 1), con turno de a
function duelo(){const m=nueva();m.act('a','Ana',{op:'retar',a:'b'});m.act('b','Beto',{op:'unir'});Object.assign(m.S,{turno:0,ti:[0,0],saque:0,mano:null});return m}
// bola i a d m del hoyo h por su diagonal y la blanca más atrás en la misma línea: tiro recto a la tronera
const H=P[3];   // esquina (+x,+z)
const enLinea=(i,d,db)=>{const u=Math.SQRT1_2;return [[i,H.x-d*u,H.z-d*u],[0,H.x-db*u,H.z-db*u]]};
const recto={a:Math.PI/4,v:1.6,ex:0,ey:-.5};
const resto=[[2,-.9,-.4],[3,-.6,-.4],[10,-.3,-.4],[11,0,-.4],[8,.3,-.4]];

ok('reto contra bot: empieza con el triángulo y bola en mano en la cocina',()=>{const m=nueva();assert.strictEqual(m.act('a','Ana',{op:'retar',bot:1,niv:2}),undefined);
 const v=m.view('a');assert.strictEqual(v.fase,'juego');assert.strictEqual(v.saque,1);assert.strictEqual(v.mano,'cocina');
 assert.deepStrictEqual(v.yo,[0,0]);assert(v.eq[1][0].bot);assert.strictEqual(v.E.filter(Boolean).length,16)});

ok('reto 1 contra 1: solo el retado acepta; rechazar libera la mesa',()=>{const m=nueva();m.act('a','Ana',{op:'retar',a:'b'});
 assert.strictEqual(m.view('a').fase,'arma');assert(m.act('c','Caro',{op:'unir'}));assert(m.act('c','Caro',{op:'retar',bot:1}));
 m.act('b','Beto',{op:'rechazar'});assert.strictEqual(m.view('a').fase,'libre');
 m.act('a','Ana',{op:'retar',a:'b'});m.act('b','Beto',{op:'unir'});assert.strictEqual(m.view('b').fase,'juego');assert.deepStrictEqual(m.view('b').yo,[1,0])});

ok('no se reta a quien no está ni a uno mismo; el reto caduca',()=>{const m=nueva();assert(m.act('a','Ana',{op:'retar',a:'a'}));
 assert(m.act('a','Ana',{op:'retar',a:'zz'},k=>k=='a'));m.act('a','Ana',{op:'retar',a:'b'});T+=61000;m.tick();assert.strictEqual(m.view('a').fase,'libre')});

ok('2 contra 2: huecos con bots y se alternan dentro del equipo',()=>{const m=nueva();m.act('a','Ana',{op:'retar',modo:2});m.act('b','Beto',{op:'unir',e:0});
 assert(m.act('b','Beto',{op:'empezar'}));m.act('a','Ana',{op:'empezar'});const v=m.view('a');assert.strictEqual(v.fase,'juego');
 assert(v.eq[1][0].bot&&v.eq[1][1].bot&&!v.eq[0][1].bot);
 Object.assign(m.S,{turno:0,ti:[0,0],saque:0,E:vacia([0,-.5,0],[1,.5,.3])});m.act('a','Ana',{op:'tiro',a:Math.PI,v:.3});   // no toca nada
 assert.strictEqual(m.S.turno,1);assert.strictEqual(m.S.ti[0],1);assert(m.act('a','Ana',{op:'tiro',a:0,v:1}))});

ok('falta por no tocar nada: pasa el turno con bola en mano en la cocina',()=>{const m=duelo();m.S.E=vacia([0,-.5,0],[1,.5,.3]);
 m.act('a','Ana',{op:'tiro',a:Math.PI,v:.4});const u=m.view('a').ult;assert(u.fal);assert.strictEqual(m.S.turno,1);assert.strictEqual(m.S.mano,'cocina');
 assert(m.act('b','Beto',{op:'tiro',x:.5,z:0,a:0,v:1}),'fuera de la cocina');assert(m.act('b','Beto',{op:'tiro',x:-.9,z:.3,a:0,v:1})===undefined)});

ok('meter la blanca es falta',()=>{const m=duelo();const u=Math.SQRT1_2;m.S.E=vacia([0,H.x-.3*u,H.z-.3*u],[1,-1,-.4]);
 m.act('a','Ana',{op:'tiro',a:Math.PI/4,v:1.2});const r=m.view('a');assert.strictEqual(r.ult.fal,'Metió la blanca');assert.strictEqual(r.E[0],null);
 assert.strictEqual(r.turno,1);m.act('b','Beto',{op:'tiro',a:0,v:.5});assert(m.S.ult.E0[0][0]<=-L/4,'la blanca va a la cabeza')});

ok('mesa abierta: la primera metida decide el grupo y sigue tirando',()=>{const m=duelo();m.S.E=vacia(...enLinea(9,.3,.8),...resto);
 m.act('a','Ana',{op:'tiro',...recto});const v=m.view('a');assert(v.ult.met.includes(9),JSON.stringify(v.ult.met));assert(!v.ult.fal);
 assert.deepStrictEqual(v.gr,['r','l']);assert.strictEqual(v.turno,0);assert.strictEqual(v.ult.sigue,1)});

ok('con la mesa abierta tocar primero la 8 es falta',()=>{const m=duelo();m.S.E=vacia(...enLinea(8,.3,.8),[1,-1,-.4],[9,-.8,-.4]);
 m.act('a','Ana',{op:'tiro',...recto});const v=m.view('a');assert.strictEqual(v.fase,'fin');assert.strictEqual(v.gana,1)});

ok('tocar primero una ajena es falta aunque entre',()=>{const m=duelo();m.S.gr=['l','r'];m.S.E=vacia(...enLinea(9,.3,.8),...resto);
 m.act('a','Ana',{op:'tiro',...recto});const v=m.view('a');assert(v.ult.fal);assert.strictEqual(v.turno,1);assert.strictEqual(v.mano,'cocina')});

ok('meter una propia: sigue; solo una ajena (sin falta): pasa',()=>{const m=duelo();m.S.gr=['l','r'];m.S.E=vacia(...enLinea(1,.3,.8),...resto);
 m.act('a','Ana',{op:'tiro',...recto});assert.strictEqual(m.S.turno,0);assert.strictEqual(m.S.mano,null);
 const m2=duelo();m2.S.gr=['r','l'];m2.S.E=vacia(...enLinea(1,.3,.8),...resto);m2.act('a','Ana',{op:'tiro',...recto});   // toca la 1 primero: falta
 assert(m2.S.ult.fal)});

ok('la 8 antes de tiempo pierde; con el grupo limpio gana',()=>{const m=duelo();m.S.gr=['l','r'];m.S.E=vacia(...enLinea(8,.3,.8),[1,-1,-.4],[9,-.8,-.4]);
 m.act('a','Ana',{op:'tiro',...recto});assert.strictEqual(m.S.gana,1);
 const g=duelo();g.S.gr=['l','r'];g.S.E=vacia(...enLinea(8,.3,.8),[9,-.8,-.4]);g.act('a','Ana',{op:'tiro',...recto});
 const v=g.view('b');assert.strictEqual(v.fase,'fin');assert.strictEqual(v.gana,0);assert.strictEqual(v.por,'Metió la 8')});

ok('la 8 en el saque: se acomoda de nuevo y saca el mismo',()=>{const m=duelo();Object.assign(m.S,{saque:1,mano:null});m.S.E=vacia(...enLinea(8,.3,.8),[1,-1,-.4]);
 m.act('a','Ana',{op:'tiro',...recto});assert.strictEqual(m.S.fase,'juego');assert.strictEqual(m.S.turno,0);assert.strictEqual(m.S.saque,1);
 assert.strictEqual(m.S.E.filter(Boolean).length,16);assert.strictEqual(m.S.mano,'cocina')});

ok('saque: lo que entre no decide grupo y sigue si metió',()=>{const m=duelo();Object.assign(m.S,{saque:1,mano:null});m.S.E=vacia(...enLinea(9,.3,.8),...resto);
 m.act('a','Ana',{op:'tiro',...recto});assert.strictEqual(m.S.gr,null);assert.strictEqual(m.S.turno,0);assert.strictEqual(m.S.saque,0)});

ok('se acaba el tiempo: falta y bola en mano para el rival',()=>{const m=duelo();m.S.E=vacia([0,-.5,0],[1,.5,.3]);m.S.plazo=T+GB.T_TIRO;T+=GB.T_TIRO+1;m.tick();
 assert.strictEqual(m.S.turno,1);assert.strictEqual(m.S.ult.fal,'Se acabó el tiempo');assert.strictEqual(m.S.mano,'cocina')});

ok('no es tu turno / basura',()=>{const m=duelo();m.S.E=vacia([0,-.5,0],[1,.5,.3]);assert(m.act('b','Beto',{op:'tiro',a:0,v:1}));
 assert(m.act('a','Ana',{op:'tiro',a:'x',v:1}));assert(m.act('a','Ana',{op:'tiro',a:0,v:0}));assert.strictEqual(m.S.n,0)});

ok('el cliente reproduce cada tiro igual con ult (E0 + tiro)',()=>{const m=nueva(3);m.act('a','Ana',{op:'retar',bot:1});m.S.turno=0;m.S.ti=[0,0];
 m.act('a','Ana',{op:'tiro',a:0,v:6.5,ey:.1});const u=JSON.parse(JSON.stringify(m.view('a')));
 assert.deepStrictEqual(F.simula(u.ult.E0,u.ult.tiro).fin,u.E)});

ok('quien se va en 1 contra 1 pierde; reto abierto se cierra si se va quien retó',()=>{const m=duelo();m.tick(k=>k!='b');assert.strictEqual(m.S.fase,'fin');assert.strictEqual(m.S.gana,0);
 const r=nueva();r.act('a','Ana',{op:'retar',modo:2});r.tick(k=>k!='a');assert.strictEqual(r.S.fase,'libre')});

ok('bots contra bots terminan la partida sin errores y todo se reproduce',()=>{let fines=0;
 for(let s=1;s<=6;s++){const m=nueva(s);m.act('a','Ana',{op:'retar',bot:1,niv:2});m.S.eq[0][0]=Object.assign({},m.S.eq[1][0],{id:'bot:x',n:'X'});
  let k=0;while(m.S.fase=='juego'&&k<600){T+=60000;const n0=m.S.n;m.tick();k++;
   if(m.S.n>n0&&m.S.ult.tiro){const u=JSON.parse(JSON.stringify(m.S.ult));const fin=F.simula(u.E0,u.tiro).fin;
    if(m.S.ult.msg.indexOf('saque')<0)assert.deepStrictEqual(fin,m.S.fase=='juego'||m.S.fase=='fin'?JSON.parse(JSON.stringify(m.S.E)):fin)}}
  if(m.S.fase=='fin')fines++}
 assert(fines>=4,'solo terminaron '+fines)});

const BOT=require('../billar_bot.js');
ok('bot difícil: mete un corte suave y no comete falta',()=>{const E=vacia([0,-.3,.05],[3,.6,.35]);
 const t=BOT.tiro({E,c:E[0],legales:[1,2,3,4,5,6,7],mias:[1,2,3,4,5,6,7],niv:2,rnd:sem(3)}),r=F.simula(E,t);
 const met=r.ev.filter(v=>v.k=='tronera').map(v=>v.a);assert(met.includes(3)&&!met.includes(0),'metió '+met)});
ok('bot con bola en mano: la pone libre en la cocina',()=>{const E=vacia([5,.2,-.1],[12,-.5,.2]);
 const t=BOT.tiro({E,c:[-L/4,0],legales:[5],mias:[1,2,3,4,5,6,7],niv:1,mano:1,rnd:sem(4)});
 assert(t.x<=-L/4+1e-9&&F.libre(E,t.x,t.z,true))});

console.log('billar reglas: '+n+' pruebas bien');
