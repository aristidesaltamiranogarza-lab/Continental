// Arranca TU server.js sin tocarlo: la página principal (/ y /3d) es la versión 3D y sirve c_continental3d.js, c_uno3d.js, c_casa3d.js y music.js
const http=require('http'),fs=require('fs'),path=require('path');
const orig=http.createServer;
http.createServer=function(handler){
  return orig.call(http,async(req,res)=>{
    const p=new URL(req.url,'http://x').pathname;
    if(p==='/'||p==='/3d'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'continental3d.html')))}
    if(p==='/c_continental3d.js'||p==='/c_uno3d.js'||p==='/c_casa3d.js'||p==='/c_cubilete3d.js'||p==='/music.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,p.slice(1))))}
    return handler(req,res)})};
require('./server.js');
