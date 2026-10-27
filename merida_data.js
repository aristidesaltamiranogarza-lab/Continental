// Mérida en Venta: tablero, grupos, fichas y cartas. Lo usan las reglas (g_merida.js, con require) y el cliente (window.MERD).
// Casilla: t = go | p (colonia) | r (Va y Ven) | u (servicio) | tax | s (Suerte) | c (Comunidad) | jail | free (vacaciones) | gtj (ve a la cárcel)
// p: precio; r: rentas [sola, 1 casa, 2, 3, 4, hotel]; g: grupo
(function(D){if(typeof module!=='undefined')module.exports=D;else window.MERD=D})((function(){
const P=(n,g,p,r)=>({t:'p',n,g,p,r}),V=n=>({t:'r',n,p:200}),S={t:'s',n:'Suerte'},C={t:'c',n:'Comunidad'};
const board=[{t:'go',n:'Salida',s:'Plaza Grande'},
 P('San José Tecoh',0,60,[2,10,30,90,160,250]),C,P('Emiliano Zapata Sur',0,60,[4,20,60,180,320,450]),
 P('Ciudad Caucel',1,100,[6,30,90,270,400,550]),V('Ruta Periférico'),P('Juan Pablo II',1,100,[6,30,90,270,400,550]),
 {t:'tax',n:'Impuesto predial',v:200},P('Los Héroes',1,120,[8,40,100,300,450,600]),S,
 {t:'jail',n:'Cárcel',s:'Solo de visita'},
 P('La Mejorada',2,140,[10,50,150,450,625,750]),C,P('San Cristóbal',2,140,[10,50,150,450,625,750]),P('La Ermita',2,160,[12,60,180,500,700,900]),
 V('Circuito Metropolitano'),P('Santiago',3,180,[14,70,200,550,750,950]),P('Santa Ana',3,180,[14,70,200,550,750,950]),
 {t:'u',n:'CFE',p:150},P('Santa Lucía',3,200,[16,80,220,600,800,1000]),
 {t:'free',n:'Vacaciones',s:'en Progreso'},
 P('Pensiones',4,220,[18,90,250,700,875,1050]),{t:'u',n:'JAPAY',p:150},P('Chuburná',4,220,[18,90,250,700,875,1050]),
 P('Francisco de Montejo',4,240,[20,100,300,750,925,1100]),V('IE-Tram Paseo 60'),P('García Ginerés',5,260,[22,110,330,800,975,1150]),S,
 P('Itzimná',5,260,[22,110,330,800,975,1150]),P('Colonia México',5,280,[24,120,360,850,1025,1200]),
 {t:'gtj',n:'¡Ve a la cárcel!'},
 P('Campestre',6,300,[26,130,390,900,1100,1275]),S,P('Altabrisa',6,300,[26,130,390,900,1100,1275]),P('Montebello',6,320,[28,150,450,1000,1200,1400]),
 V('Ruta Nocturna'),{t:'tax',n:'Pago al SAT',v:100},P('Temozón Norte',7,350,[35,175,500,1100,1300,1500]),C,P('Paseo de Montejo',7,400,[50,200,600,1400,1700,2000])];
// grupos: color y costo de cada casa
const gcol=['#8d5a3b','#22b3c4','#8e44ad','#ef7d22','#d63a3a','#f2c230','#2e9e57','#f4f1e8'],hc=[50,50,100,100,150,150,200,200];
const tok=[['Sombrero','👒'],['Hamaca','🪢'],['Tricitaxi','🛺'],['Panucho','🌮'],['Huipil','👗'],['Guayabera','👔']];
const pcol=['#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa','#00897b'];
// cartas: go (avanza a), back (regresa n), jail, jf (sal de la cárcel), pay / get (banco), each (pagas a cada quien), all (cada quien te paga),
// rep [por casa, por hotel], near r|u (el Va y Ven / servicio más cercano: renta doble / 10 veces los dados)
const cards={s:[
 {t:'Te invitaron a una boda en Paseo de Montejo. Avanza hasta allá.',go:39},
 {t:'Avanza hasta la Salida y cobra $200.',go:0},
 {t:'Se te antojaron unas marquesitas: avanza hasta Santa Lucía. Si pasas por la Salida, cobra $200.',go:19},
 {t:'Te invitaron a comer a García Ginerés. Avanza hasta allá. Si pasas por la Salida, cobra $200.',go:26},
 {t:'Súbete al Va y Ven más cercano. Si tiene dueño, le pagas el doble de la renta.',near:'r'},
 {t:'Se fue la luz: ve al servicio más cercano. Si tiene dueño, le pagas 10 veces lo que sacaste en los dados.',near:'u'},
 {t:'El banco te paga intereses: cobra $50.',get:50},
 {t:'Te salvó un compadre: sales de la cárcel gratis. Guárdala hasta que la uses.',jf:1},
 {t:'Te pasaste un alto en Prolongación Montejo: regresa 3 casillas.',back:3},
 {t:'Te agarraron sin placas. Ve directo a la cárcel, sin pasar por la Salida.',jail:1},
 {t:'Mantenimiento de tus propiedades: paga $25 por casa y $100 por hotel.',rep:[25,100]},
 {t:'Multa por estacionarte en doble fila: paga $15.',pay:15},
 {t:'Toma la Ruta Periférico. Si pasas por la Salida, cobra $200.',go:5},
 {t:'Te nombraron presidente del comité de la feria de Xmatkuil: paga $50 a cada jugador.',each:50},
 {t:'Te pagaron el préstamo de la construcción: cobra $150.',get:150},
 {t:'Ganaste la rifa de la kermés: cobra $100.',get:100}],
c:[
 {t:'Avanza hasta la Salida y cobra $200.',go:0},
 {t:'El banco se equivocó a tu favor: cobra $200.',get:200},
 {t:'Consulta con el doctor: paga $50.',pay:50},
 {t:'Vendiste tu cochinita pibil del domingo: cobra $50.',get:50},
 {t:'Tu tía es abogada: sales de la cárcel gratis. Guárdala hasta que la uses.',jf:1},
 {t:'Ve directo a la cárcel, sin pasar por la Salida.',jail:1},
 {t:'¡Es tu cumpleaños! Cada jugador te da $10.',all:10},
 {t:'El SAT te devolvió impuestos: cobra $20.',get:20},
 {t:'Venció tu seguro de vida: cobra $100.',get:100},
 {t:'Colegiatura de la escuela: paga $50.',pay:50},
 {t:'Cuenta del hospital: paga $100.',pay:100},
 {t:'Te pagaron por tocar trova en la Plaza Grande: cobra $25.',get:25},
 {t:'Reparaciones después del huracán: paga $40 por casa y $115 por hotel.',rep:[40,115]},
 {t:'Segundo lugar en el concurso de jarana: cobra $10.',get:10},
 {t:'Heredaste una casona en el Centro: cobra $100.',get:100},
 {t:'Vendiste tus acciones: cobra $50.',get:50}]};
return {board,gcol,hc,tok,pcol,cards,go:200,jail:10,bail:50}})());
