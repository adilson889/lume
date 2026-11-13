const fs=require('fs'),vm=require('vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const a=html.indexOf('function chaveAprendido'),b=html.indexOf('async function correrBotComDados');
const bloco=html.slice(a,b);
const dom=new JSDOM('');
const store={};
const chamadas=[];
const ctx={console,setTimeout,clearTimeout,AbortController,Date,Promise,
  DOMParser:dom.window.DOMParser,ID_BOT:'',
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v}},
  fetch:async(url)=>{chamadas.push(url);
    if(url.includes('wikipedia')) return{ok:true,json:async()=>({query:{pages:{2:{title:'Docker (software)',index:2,extract:'Docker &amp; <b>containers</b> sao uma plataforma.'},1:{title:'Linux',index:1,extract:'Linux e um kernel.'}}}})};
    if(url.includes('pt.stackoverflow')) return{ok:true,json:async()=>({items:[{title:'Como usar docker &#39;compose&#39;?',excerpt:'use <span class="highlight">docker</span> compose up',question_id:11}]})};
    return{ok:true,json:async()=>({items:[{title:'Docker run',excerpt:'docker run image',question_id:22},{title:'Docker ps',excerpt:'lista containers',question_id:23}]})};}};
vm.createContext(ctx);
vm.runInContext(bloco+';this.api={pesquisarWeb,restaurarAprendido,guardarAprendido,textoLimpo}',ctx);
const api=ctx.api;
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log(c?'  ok  ':'  FAIL',m)};
(async()=>{
 console.log('providers');
 const r=await api.pesquisarWeb({query:'docker compose',providers:['WIKI','STACKOVERFLOW']});
 ok(r.length>=4,'junta resultados dos dois providers: '+r.length);
 ok(r[0].title==='Linux'&&r[1].title.startsWith('Como usar'),'intercala wiki e stack, wiki ordenada por index');
 ok(r.every(x=>!/[<>]/.test(x.snippet)&&!/&amp;|&#39;/.test(x.snippet+x.title)),'HTML e entidades limpos');
 ok(r[2].snippet.includes('Docker & containers'),'entidade &amp; decodificada');
 ok(chamadas.some(u=>u.includes('origin=*'))&&chamadas.some(u=>u.includes('pt.stackoverflow'))&&chamadas.some(u=>u.includes('site=stackoverflow')),'URLs: wiki com origin=*, stack pt e en');
 const r2=await api.pesquisarWeb({query:'x',providers:['DESCONHECIDO']});
 ok(Array.isArray(r2)&&r2.length===0,'provider desconhecido e ignorado');
 console.log('persistencia (delta) + motor');
 const BotQL=(()=>{const c={console,setTimeout,Date,Promise};vm.createContext(c);return vm.runInContext(fs.readFileSync('botql_browser.js','utf8')+';BotQL',c)})();
 const bot_e={nome:'Lume',arquivos:{'lume.txt':'Python e uma linguagem interpretada.'},sql:`CREATE BOT "Lume"
CONNECT SEARCH WIKI, STACKOVERFLOW
ON MESSAGE
  ASK(lume.txt) AND REPLY "Qual?" OR SEARCH message INTO lume.txt OR REPLY "nao sei"
RUN BOT`};
 const criar=()=>{const out=[];const f=new BotQL.MemoryFileSystem(api.restaurarAprendido(bot_e));
   const b=BotQL.BotQLInterpreter.fromSource(bot_e.sql,{fileSystem:f,basePath:'',onSearch:api.pesquisarWeb,onFileWrite:api.guardarAprendido(bot_e)});
   b.onReply=({text,html})=>out.push({text,html});return{b,out,f}};
 let x=criar();
 await x.b.receiveMessage('c1','o que e docker containers plataforma');
 ok(x.out.length===1&&/docker/i.test(x.out[0].text),'aprendeu pela web e respondeu: '+(x.out[0]&&x.out[0].text.slice(0,50)));
 const guardado=JSON.parse(store['botql_aprendido_Lume']||'{}');
 ok(guardado['lume.txt']&&!guardado['lume.txt'].includes('Python e uma'),'guardou so o delta aprendido, sem o ficheiro original');
 const n=chamadas.length;
 x=criar();
 ok(x.f.readFile('lume.txt').startsWith('Python e uma')&&/docker/i.test(x.f.readFile('lume.txt')),'ao recarregar, original + aprendido');
 await x.b.receiveMessage('c1','o que e docker containers plataforma');
 ok(chamadas.length===n&&/docker/i.test(x.out[0].text),'depois de recarregar responde do ficheiro sem pesquisar');
 bot_e.arquivos['lume.txt']='Python NOVA versao do ficheiro base.';
 x=criar();
 ok(x.f.readFile('lume.txt').startsWith('Python NOVA')&&/docker/i.test(x.f.readFile('lume.txt')),'se o ficheiro base mudar, usa o novo e mantem o aprendido');
 console.log(`\n${pass} passaram, ${fail} falharam`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
