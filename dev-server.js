// Zero-dependency static development server: npm run dev
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const port = Number(process.env.PORT)||3000;
http.createServer((req,res)=>{
  let file;
  try {file=decodeURI((req.url||'/').split('?')[0]);}catch{res.writeHead(400);res.end('Bad URL');return;}
  if(file==='/') file='/index.html';
  const full=path.resolve(root,'.'+file);
  if(!full.startsWith(root+path.sep)&&full!==root){res.writeHead(403);res.end('Forbidden');return;}
  fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)});
}).listen(port,'0.0.0.0',()=>console.log(`Scene Hai? → http://localhost:${port}`));
