/* Treino do Lume: corre os casos de casos.txt contra o despachante e o dialogo e mostra o que falhou.
   Uso: node LUME/treino/treinar.js [-v]   (na raiz do repositorio) */
const fs=require("fs"),B="LUME/bot/",V=process.argv.includes("-v");
const nz=t=>String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function novo(){
 const st={};global.sessionStorage={getItem:k=>st[k]||null,setItem:(k,v)=>{st[k]=v}};global.localStorage=global.sessionStorage;
 const A={};for(const n of JSON.parse(fs.readFileSync(B+"arquivos.json","utf8")))if(n!=="main.sql")A[n]=fs.readFileSync(B+n,"utf8");
 global.window={arquivosBot:A};
 (0,eval)(fs.readFileSync("LUME/despachante.js","utf8"));(0,eval)(fs.readFileSync("LUME/dialogo.js","utf8"));
 const o={out:[]};window.lumeOnReply=x=>{o.out.push(x.text||x.html||"");window.LumeDialogo.registar(x.text||"")};return o;
}
(async()=>{
 let ok=0,total=0;const falhas=[];
 for(const l of fs.readFileSync("LUME/treino/casos.txt","utf8").split(/\r?\n/)){
  if(!l.trim()||l.trim()[0]==="#")continue;
  const i=l.lastIndexOf(" | ");const msgs=l.slice(0,i).split(" >> "),esp=l.slice(i+3).trim();
  const o=novo();let r=false,resp="",q2="";
  if(/^MATH[+-]$/.test(esp)){const m=window.lumeFuncaoMatematica(msgs[0]);const bom=esp==="MATH+"?!!m:!m;total++;if(bom)ok++;else falhas.push([l,m?"reconheceu: "+m.m:"nao reconheceu"]);continue}
  for(const q of msgs){o.out=[];q2=window.LumeDialogo.reescrever(q);r=await window.LumeDespachante.tentar(q2);resp=o.out.join(" ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
  const raw=o.out.join(" ");
  let bom;
  if(esp==="BOT")bom=!r||/^\s*(<program|<!--)/.test(raw)===false&&!r;
  else bom=r&&new RegExp(esp,"i").test(esp.startsWith("<")?raw:nz(resp));
  if(esp==="BOT")bom=!r;
  total++;if(bom)ok++;else falhas.push([l,r?"respondeu: "+resp.slice(0,110):"passou ao bot"]);
  if(V)console.log((bom?"ok  ":"FALHA ")+l+"\n      -> "+(r?resp.slice(0,110):"(bot)"));
 }
 console.log(`\nTreino: ${ok}/${total} (${Math.round(100*ok/total)}%)`);
 falhas.forEach(f=>console.log("FALHA:",f[0],"\n   ",f[1]));
 process.exit(falhas.length?1:0);
})();
