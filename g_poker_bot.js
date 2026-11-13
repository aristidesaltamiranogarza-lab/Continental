// Decisiones de los bots del Póker. Nivel normal: juega según su probabilidad de ganar contra los que siguen en la mano y a veces farolea.
// v: {c, mesa, alta, ap, f, minR, bote (incluye apuestas en curso), rivales, lim, calle, BB}. Devuelve {op, v}.
const PE=require('./poker_eval.js');
function decide(v,rnd=Math.random){const n=Math.max(1,v.rivales),eq=PE.equidad(v.c,v.mesa,n,v.calle?260:160),rel=eq*(n+1);
 const falta=v.alta-v.ap,max=v.ap+v.f,bote=v.bote,r=rnd();
 const subeA=x=>{if(v.lim)return {op:falta>0?'igualar':'pasar'};if(!v.calle)x=Math.max(x,v.BB*2);
  let to=Math.max(v.alta+v.minR,Math.round((v.alta+x)/5)*5);if(to>=max*0.8)to=max;return {op:to>=max?'todo':'subir',v:to}};
 if(falta<=0){
  if(rel>1.9||eq>0.75)return subeA(bote*(0.5+r*0.4));
  if(rel>1.35&&r<0.45)return subeA(bote*0.5);
  if(r<0.08)return subeA(bote*0.6);   // farol
  return {op:'pasar'}}
 const odds=falta/(bote+falta);
 if((rel>2.1||eq>0.8)&&r<0.65)return subeA(Math.max(bote*0.75,falta*2));
 if(eq>=odds+0.04||(falta<=v.BB&&rel>0.9))return {op:'igualar'};
 if(r<0.04)return subeA(bote*0.8);   // farol
 return {op:'retirar'}}
module.exports={decide};
