// c_casa_sentar.js — SENT: sentarte en sillas, bancos y sillones sueltos de la casa (los de las mesas de juego no).
// SENT.reg(grupo,{h,dz,fy}) marca un asiento: h = altura del cojín en el mundo, dz = centro del cojín en z local, fy = giro extra del frente
// (el frente es +z local). c_casa3d.js: SENT.toca(ray) al tocar el piso (camina al frente del asiento), SENT.llega(me) al llegar,
// SENT.paso(me, mover) cada cuadro: mientras estás sentado devuelve true; moverte (teclas, joystick u otro destino) te levanta.
(function(){
if(typeof THREE==='undefined')return;
const L=[],UP=new THREE.Vector3(0,1,0),v3=(x,y,z)=>new THREE.Vector3(x,y,z);let on=null,pend=null;
function reg(o,c){c=c||{};o.userData.sent={h:c.h||.95,dz:c.dz||0,fy:c.fy||0};L.push(o);return o}
function vis(o){for(let p=o.parent;p;p=p.parent)if(!p.visible)return false;return !!o.parent}
function spot(o){o.updateMatrixWorld(true);const s=o.userData.sent,p=o.localToWorld(v3(0,0,s.dz)),f=o.localToWorld(v3(0,0,s.dz+1)).sub(p).setY(0).normalize();
 if(s.fy)f.applyAxisAngle(UP,s.fy);return {p,f,yaw:Math.atan2(f.x,f.z),front:p.clone().addScaledVector(f,1.2).setY(0)}}
function toca(ray){let best=null,bd=1e9;L.forEach(o=>{if(!vis(o))return;const r=ray.intersectObject(o,true);if(r.length&&r[0].distance<bd){bd=r[0].distance;best=o}});
 pend=best;return best?spot(best).p.setY(0):null}   // caminas al asiento mismo (solve te deja junto a él)
function llega(a){const o=pend;pend=null;if(!o||!a)return false;const s=spot(o);if(Math.hypot(a.pos.x-s.p.x,a.pos.z-s.p.z)>3.2)return false;
 const h=o.userData.sent.h,g=a.g,b=s.p.clone().addScaledVector(s.f,-.25);on={s};a.pos.set(s.p.x,a.pos.y,s.p.z);a.yaw=s.yaw;g.rotation.y=s.yaw;a.w=0;
 if(g.userData.av&&window.AV){AV.sentar(g,true,true);AV.pose(g,"Reposo",0);g.position.set(b.x,h-.7,b.z)}else g.position.set(s.p.x,h+.25,s.p.z);return true}
function paso(a,mover){if(!on)return false;if(!mover)return true;const s=on.s;on=null;if(a){a.pos.set(s.front.x,a.pos.y,s.front.z);if(a.g.userData.av&&window.AV)AV.sentar(a.g,false,true)}return false}
window.SENT={reg,toca,llega,paso,sentado:()=>!!on,lista:()=>L};
})();
