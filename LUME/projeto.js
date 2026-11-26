/* Lume - pedidos sobre projetos (lado do chat).
   Entende frases para criar, abrir e editar projetos e responde com window.LumeProjetoChat.responder(q),
   que o despachante chama antes do gerador de codigo. Devolve null quando a frase nao e sobre projetos,
   para o Lume seguir o caminho normal. Os dados vivem nos modulos XLang xlang-projeto e xlang-editar
   (carregados por LUME/editor/lume-projeto.js); este ficheiro so interpreta a frase.
   Frases: "cria um projeto loja", "abre o projeto loja", "lista os projetos", "cria um exemplo",
   "cria o ficheiro app.xl", "escreve em app.xl: <texto>", "mostra app.xl", "lista os ficheiros",
   "troca 'ola' por 'bom dia' em app.xl", "procura total nos ficheiros", "desfaz app.xl",
   "corre app.xl", "abre o ficheiro app.xl". */
(function(){
"use strict";
var EXEMPLO="<program>\n  <var name=\"nome\" value=\"'Mundo'\"></var>\n  <print>Ola, {nome}!</print>\n</program>\n";

/* sem acentos e em minusculas, sem mudar o comprimento (para cortar o texto original pelas mesmas posicoes) */
function nz(t){return String(t).replace(/[À-ſ]/g,function(c){var d=c.normalize("NFD").charAt(0);return d||c}).toLowerCase()}
function P(){return window.lumeProjeto||null}
function ok(texto,html,etapas){return{texto:texto,html:html||"",etapas:etapas||[]}}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function cartao(nome,n){return'<div class="lume-proj" data-proj="'+esc(nome)+'" data-n="'+n+'"></div>'}
function cerca(txt,lang){var f="```";return f+(lang||"")+"\n"+txt.replace(/\n$/,"")+"\n"+f}

function caminhoDe(n,q){
 var m=/(?:^|[\s"'`(])([\w\-]+(?:\/[\w\-.]+)*\.[a-z0-9]{1,5})(?=$|[\s"'`:,)])/.exec(n);
 if(!m)return"";
 var i=m.index+m[0].indexOf(m[1]);return q.slice(i,i+m[1].length);
}
function nomeProjeto(n,q){
 var m=/\bprojeto\b\s*(?:chamado|de nome|com o nome|com nome|:)?\s*(?:o |a )?/.exec(n);
 if(!m)return"";
 var ini=m.index+m[0].length,resto=n.slice(ini),fim=resto.search(/\s+(com|e|para|que|onde|agora)\b|[.,;!?]/);
 var nome=q.slice(ini,fim<0?q.length:ini+fim).replace(/["'`]/g,"").trim();
 return /^[\w\- ]{1,40}$/.test(nome)?nome:"";
}
function depoisDeDoisPontos(q){
 var i=q.indexOf(":");if(i<0)return null;
 var t=q.slice(i+1).replace(/^\s*\n?/,"");
 var f=/^```[\w-]*\n([\s\S]*?)\n?```\s*$/.exec(t);
 return(f?f[1]:t).replace(/\s+$/,"")+"\n";
}
function semProjeto(){return ok("Ainda não há um projeto aberto. Diz «cria um projeto» com um nome, ou «abre o projeto» com o nome dele.")}
function erro(e){return ok(String(e&&e.message||e).replace(/^[A-Za-z]+: /,"").replace(/^./,function(c){return c.toUpperCase()}))}

async function responder(q){
 q=String(q||"").trim();
 if(!q||q.length>4000)return null;
 var n=nz(q),L=P();
 var fala=/\b(projetos?|ficheiros?|arquivos?)\b/.test(n)||(/\bexemplo\b/.test(n)&&!!(window.XLangProjeto&&window.XLangProjeto.atual()));
 var caminho=caminhoDe(n,q);
 if(!L||(!fala&&!caminho))return null;
 var verbo=function(r){return new RegExp("\\b("+r+")\\b").test(n)};
 try{
  /* ---- projetos ---- */
  if(/\bprojetos\b/.test(n)&&verbo("lista|listar|mostra|mostrar|quais|ver|tenho|meus")&&!/\bficheiros?\b/.test(n)){
   var l=await L.lista();
   return ok(l.length?"Os teus projetos: "+l.join(", ")+".":"Ainda não tens projetos. Diz «cria um projeto» com um nome.");
  }
  if(/\bprojeto\b/.test(n)&&(verbo("cria|criar|crie|faz|fazer|inicia")||/\bnovo projeto\b/.test(n))&&!verbo("abre|abrir|abra")&&!/\b(ficheiro|arquivo)\b/.test(n)&&!/\bexemplo\b/.test(n)){
   var nm=nomeProjeto(n,q);
   if(!nm)return ok("Que nome queres dar ao projeto? Usa letras, números, espaços ou hífens, até 40 caracteres.");
   var ex=await L.lista();
   if(ex.indexOf(nm)>=0)return ok("O projeto «"+nm+"» já existe. Diz «abre o projeto "+nm+"» para o usares.");
   await L.criar(nm);window.XLangProjeto.abrir(nm);
   return ok("Criei o projeto «"+nm+"» e deixei-o aberto. Toca no cartão para abrir o editor.",cartao(nm,0),["Criei o projeto vazio."]);
  }
  if(/\bprojeto\b/.test(n)&&verbo("abre|abrir|abra|usa|usar|entra|muda")&&!/\b(ficheiro|arquivo)\b/.test(n)){
   var nome=nomeProjeto(n,q);
   if(!nome)return ok("Qual projeto queres abrir? Diz «abre o projeto» e o nome.");
   var lp=await L.lista();
   if(lp.indexOf(nome)<0)return ok("Não encontrei o projeto «"+nome+"»."+(lp.length?" Tens: "+lp.join(", ")+".":" Diz «cria um projeto "+nome+"»."));
   var fs=window.XLangProjeto.abrir(nome);
   return ok("Abri o projeto «"+nome+"» ("+fs.length+(fs.length===1?" ficheiro":" ficheiros")+").",cartao(nome,fs.length));
  }
  /* ---- a partir daqui precisa de um projeto aberto ---- */
  var PR=window.XLangProjeto;
  if(!PR)return null;
  var preciso=function(){return PR.atual()?null:semProjeto()};
  if(/\bexemplo\b/.test(n)&&verbo("cria|criar|crie|faz|fazer|gera|gerar|mostra")){
   var s=preciso();if(s)return s;
   var alvo="ola.xl";PR.escrever(alvo,EXEMPLO);PR.abrirFicheiro(alvo);
   return ok("Criei «"+alvo+"» no projeto «"+PR.atual()+"». Diz «corre ola.xl» para o ver a funcionar.\n\n"+cerca(EXEMPLO,"html"),cartao(PR.atual(),PR.ficheiros().length));
  }
  if(/\b(ficheiros|arquivos)\b/.test(n)&&verbo("lista|listar|mostra|mostrar|quais|ver")&&!caminho){
   var s2=preciso();if(s2)return s2;
   var fl=PR.ficheiros();
   return ok(fl.length?"Ficheiros de «"+PR.atual()+"»:\n"+fl.map(function(f){return"- "+f}).join("\n"):"O projeto «"+PR.atual()+"» ainda está vazio.",cartao(PR.atual(),fl.length));
  }
  var pc=/\b(?:procura|procurar|pesquisa|encontra|acha)\s+(?:["'`])?(.+?)(?:["'`])?\s+(?:no projeto|nos ficheiros|nos arquivos|em todos os ficheiros)\b/.exec(n);
  if(pc){
   var s4=preciso();if(s4)return s4;
   var i0=n.indexOf(pc[1],pc.index),achados=editar("edProcurar",q.slice(i0,i0+pc[1].length));
   return ok(achados.length?"Encontrei "+achados.length+(achados.length===1?" resultado:":" resultados:")+"\n"+achados.map(function(a){return"- "+a}).join("\n"):"Não encontrei «"+q.slice(i0,i0+pc[1].length)+"» no projeto «"+PR.atual()+"».");
  }
  if(!caminho)return null;
  var s3=preciso();if(s3)return s3;
  if(verbo("troca|trocar|substitui|substituir")){
   var m=/(?:troca|trocar|substitui|substituir)\s+(?:["'`])?(.+?)(?:["'`])?\s+por\s+(?:["'`])?(.+?)(?:["'`])?\s+(?:em|no|do)\s+(?:ficheiro\s+|arquivo\s+)?/.exec(n);
   if(!m)return ok("Diz assim: «troca 'texto antigo' por 'texto novo' em "+caminho+"».");
   var ini1=n.indexOf(m[1],m.index),ini2=n.indexOf(m[2],ini1+m[1].length);
   var antigo=q.slice(ini1,ini1+m[1].length),novo=q.slice(ini2,ini2+m[2].length);
   var r=editar("edTrocar",caminho,antigo,novo);
   return ok("Troquei o texto na linha "+r+" de «"+caminho+"».",cartao(PR.atual(),PR.ficheiros().length),["Troquei só esse trecho, sem refazer o ficheiro."]);
  }
  if(verbo("desfaz|desfazer|volta|voltar|reverte|reverter")){
   PR.desfazer(caminho);return ok("Voltei à versão anterior de «"+caminho+"».",cartao(PR.atual(),PR.ficheiros().length));
  }
  if(verbo("corre|correr|executa|executar|roda|rodar|testa|testar")){
   var tx=PR.ler(caminho);L.executar(caminho,tx);return ok("A correr «"+caminho+"».");
  }
  if(verbo("escreve|escrever|guarda|guardar|grava|gravar")||(verbo("cria|criar|crie|novo|nova")&&/\b(ficheiro|arquivo)\b/.test(n))){
   var conteudo=depoisDeDoisPontos(q),ja=PR.existe(caminho);
   if(conteudo===null){
    if(ja)return ok("«"+caminho+"» já existe. Para mudar o conteúdo diz «escreve em "+caminho+":» seguido do texto.");
    conteudo="";
   }
   PR.escrever(caminho,conteudo);PR.abrirFicheiro(caminho);
   return ok((ja?"Atualizei «":"Criei «")+caminho+"» no projeto «"+PR.atual()+"».",cartao(PR.atual(),PR.ficheiros().length));
  }
  if(verbo("abre|abrir|abra|edita|editar")){
   if(!PR.existe(caminho))return ok("Não encontrei «"+caminho+"» no projeto «"+PR.atual()+"».");
   PR.abrirFicheiro(caminho);L.abrir(PR.atual());return ok("Abri «"+caminho+"» no editor.");
  }
  if(verbo("mostra|mostrar|le|ler|ver|diz|exibe")){
   var t=PR.ler(caminho);
   return ok("«"+caminho+"»:\n\n"+cerca(t,/\.xl$/.test(caminho)?"html":""));
  }
  return null;
 }catch(e){return erro(e)}
}

/* edTrocar corre pelo registo de funcoes do XLang, tal como num programa */
function editar(nome,a,b,c){
 var R=window.XLangRegistry;
 if(!R||!R.call&&!R.get)throw new Error("o módulo xlang-editar não está carregado");
 var f=R.get?R.get(nome):null;
 if(typeof f!=="function")throw new Error("o módulo xlang-editar não está carregado");
 return f(a,b,c);
}

window.LumeProjetoChat={responder:responder};
})();
