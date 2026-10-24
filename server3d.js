// Arranca TU server.js sin tocarlo y le agrega la ruta /3d y el archivo c_continental3d.js
const http=require('http'),fs=require('fs'),path=require('path');
const orig=http.createServer;
http.createServer=function(handler){
  return orig.call(http,async(req,res)=>{
    const p=new URL(req.url,'http://x').pathname;
    if(p==='/3d'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'continental3d.html')))}
    if(p==='/c_continental3d.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'c_continental3d.js')))}
    return handler(req,res)})};
require('./server.js');
