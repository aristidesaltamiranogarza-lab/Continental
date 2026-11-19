// Nombres de bots por sexo y un personaje (código de c_avatar.js) que va con el nombre.
// Hombre: cuerpo 1, peinados 1–3 (picos, rapado, despeinado), sin blusa ni falda. Mujer: cuerpo 2, peinados 4–7 (coleta, melena, chongo, largo).
const cr=require('crypto'),ri=n=>cr.randomInt(n);
const H=['Chucho','Toño','Neto','Memo','Pepe','Paco','Beto','Lalo','Nacho','Chava','Rodrigo','Arturo','Javier','Julio','Miguel'];
const M=['Lupe','Chela','Paty','Rosy','Lety','Mari','Conchita','Yoli','Claudia','Gaby','Fernanda','Ximena','Daniela','Sofía','Brenda'];
// alternados para que una mesa salga mezclada
const BOTN=H.flatMap((h,i)=>[h,M[i]]);
const limpio=n=>String(n||'').replace(/^\W+\s*/u,'').trim();
const esMujer=n=>{n=limpio(n);if(M.includes(n))return true;if(H.includes(n))return false;
 if(/^(Doña|Tía|Seño)\b/i.test(n))return true;if(/^(Don|Tío|Güero)\b/i.test(n))return false;return ri(2)==1};
const avDe=n=>{const m=esMujer(n);
 return 's'+(m?2:1)+'p'+(m?4+ri(4):1+ri(3))+'c'+(1+ri(3))+'b'+(1+ri(3))+'n'+(1+ri(3))+'a'+(1+ri(m?3:2))+'d'+(1+ri(m?3:2))+'-'+ri(8)+ri(8)+ri(10)+ri(10)};
module.exports={H,M,BOTN,esMujer,avDe};
