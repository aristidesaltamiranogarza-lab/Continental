// srv_push.js — Web Push sin dependencias (SOCIAL.md S4): avisa con el navegador cerrado cuando te invitan.
// Push sin contenido (solo la firma VAPID, sin cifrar nada): al llegar, sw.js pide la invitación a POST /push_inv con su endpoint.
// Llaves: variables VAPID_PUB y VAPID_PRIV (en Render: Environment); si no hay, se crean en .push_llaves.json y se imprimen para copiarlas.
// Las suscripciones viven en memoria; el navegador las vuelve a mandar cada vez que abre el juego (c_gente.js), así sobreviven a reinicios.
const cr=require('crypto'),https=require('https'),fs=require('fs'),path=require('path');
const F=path.join(__dirname,'.push_llaves.json');
// solo servicios de push conocidos: el servidor nunca hace POST a una dirección cualquiera
const HOSTS=/^(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[\w.-]+\.push\.apple\.com|[\w.-]+\.notify\.windows\.com)$/;
function nuevas(){const {publicKey,privateKey}=cr.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 return {pub:publicKey.export({format:'der',type:'spki'}).subarray(-65).toString('base64url'),priv:privateKey.export({format:'jwk'}).d}}
function carga(){if(process.env.VAPID_PUB&&process.env.VAPID_PRIV)return {pub:process.env.VAPID_PUB,priv:process.env.VAPID_PRIV};
 try{return JSON.parse(fs.readFileSync(F,'utf8'))}catch(e){}
 const k=nuevas();try{fs.writeFileSync(F,JSON.stringify(k))}catch(e){}
 console.log('push: llaves nuevas. Para que no cambien al reiniciar, ponlas en el servidor:\n  VAPID_PUB='+k.pub+'\n  VAPID_PRIV='+k.priv);return k}
const K=carga();
const P=Buffer.from(K.pub,'base64url');
const LLAVE=cr.createPrivateKey({key:{kty:'EC',crv:'P-256',d:K.priv,x:P.subarray(1,33).toString('base64url'),y:P.subarray(33,65).toString('base64url')},format:'jwk'});
const SUB=process.env.VAPID_SUB||'mailto:avisos@example.com';
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const jwts={};   // una firma por servicio, dura 12 h (se renueva a las 11)
function jwt(aud){const now=Math.floor(Date.now()/1000),j=jwts[aud];if(j&&j.exp-now>3600)return j.t;
 const exp=now+43200,d=b64({typ:'JWT',alg:'ES256'})+'.'+b64({aud,exp,sub:SUB});
 const t=d+'.'+cr.sign('sha256',Buffer.from(d),{key:LLAVE,dsaEncoding:'ieee-p1363'}).toString('base64url');jwts[aud]={t,exp};return t}
const subs={},porEp={};   // subs[huella] = {ep, me}; porEp[endpoint] = me
function valida(ep){try{const u=new URL(String(ep));return u.protocol==='https:'&&String(ep).length<800&&HOSTS.test(u.hostname)?u:null}catch(e){return null}}
// pon(me, huella, endpoint|null): guarda o borra la suscripción de ese aparato
function pon(me,k,ep){const o=subs[k];if(o){delete porEp[o.ep];delete subs[k]}if(!ep)return {ok:1};
 if(!valida(ep))return {err:'Servicio de avisos no válido.'};subs[k]={ep,me};porEp[ep]=me;return {ok:1}}
// avisa(huella): manda el push (TTL 60 s, como la invitación); si el servicio dice que ya no existe, se borra
function avisa(k){const o=subs[k];if(!o)return;const u=valida(o.ep);if(!u)return;
 const req=https.request({method:'POST',hostname:u.hostname,port:u.port||443,path:u.pathname+u.search,timeout:8000,
  headers:{TTL:'60',Urgency:'high','Content-Length':0,Authorization:`vapid t=${jwt(u.origin)}, k=${K.pub}`}},res=>{res.resume();if(res.statusCode===404||res.statusCode===410)pon(o.me,k,null)});
 req.on('error',()=>{});req.on('timeout',()=>req.destroy());req.end()}
module.exports={pub:K.pub,pon,avisa,mio:ep=>porEp[String(ep||'')]||null};
