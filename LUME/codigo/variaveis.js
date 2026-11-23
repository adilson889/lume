// variaveis.js - Intenção: declarar variáveis e constantes (const nome: tipo = valor;).
(function() {
"use strict";
var PT = (typeof window !== "undefined" && window.LumeCodigoPT) || require("./nucleo.js");
var LEX=PT.LEX,S=PT.S,sa=PT.sa,ePal=PT.ePal,eVazia=PT.eVazia,eNome=PT.eNome,eNomeCtx=PT.eNomeCtx,valorLit=PT.valorLit,erroNome=PT.erroNome,expressao=PT.expressao,nomesDe=PT.nomesDe;
function codigo(){return (typeof window!=="undefined"&&window.LumeCodigo)||require("./gerador.js")}
function interpretarVariaveis(ws){
 var seg=[],cur=[];
 ws.forEach(function(w){
  if(w.k==="sim"&&(w.t===","||w.t===";")||(ePal(w)&&w.n==="e"&&cur.length)){if(cur.length)seg.push(cur);cur=[]}
  else cur.push(w);
 });
 if(cur.length)seg.push(cur);
 var linhas=[],tipos={};
 for(var s=0;s<seg.length;s++){
  var p=seg[s].filter(function(w){return !(ePal(w)&&(S.variavel[w.n]||S.linguagem[w.n]))});
  while(p.length&&((eVazia(p[0])&&!(p[0].n==="nome"&&p[1]&&(S.ligar[p[1].n]||p[1].k==="sim")))||(ePal(p[0])&&p[0].n==="com")))p.shift();
  var nome=p.shift();
  if(!nome||!ePal(nome))return{erro:"Não percebi qual é o nome da variável em «"+seg[s].map(function(x){return x.t}).join(" ")+"»."};
  var en=erroNome(nome.t);if(en)return{erro:en};
  while(p.length&&((ePal(p[0])&&(S.ligar[p[0].n]||S.vazias[p[0].n]))||(p[0].k==="sim"&&(p[0].t==="="||p[0].t===":"))))p.shift();
  if(!p.length)return{erro:"Não percebi o valor de «"+nome.t+"». Diz-me, por exemplo, «"+nome.t+" com 120»."};
  var lit=p.length===1?valorLit(p[0]):null,l;
  if(lit){l=[nome.t,lit.tipo,lit.valor];tipos[nome.t]=lit.tipo}
  else{
   var ex=expressao(p);
   if(ex.erro)return{erro:ex.erro.replace(/\.$/,"")+" (em «"+nome.t+"»)."};
   if(ex.escolha)return{erro:"Escolher o "+ex.palavraEscolha+" precisa de um if; pede-me uma função, por exemplo «cria uma função que devolve o "+ex.palavraEscolha+" entre a e b»."};
   if(ex.itens.length!==2||ex.ops.length!==1)return{erro:"Para «"+nome.t+"» preciso de um valor ou de uma conta com dois valores."};
   for(var q=0;q<ex.itens.length;q++){var nn=ex.itens[q].nome;if(nn!==undefined){var e2=erroNome(nn);if(e2)return{erro:e2}}}
   var x=ex.itens[0],y=ex.itens[1],tx=x.nome!==undefined?tipos[x.nome]:"number";
   l=[nome.t,tx||"number",x.nome!==undefined?x.nome:x.num,ex.ops[0],y.nome!==undefined?y.nome:y.num];tipos[nome.t]=tx||"number";
  }
  linhas.push(l);
 }
 if(!linhas.length)return null;
 var usados={};
 linhas.forEach(function(l){if(l.length===5)[l[2],l[4]].forEach(function(x){if(typeof x==="string")usados[x]=1})});
 var util=linhas.length===1?[linhas[0][0]]:linhas.map(function(l){return l[0]}).filter(function(n){return usados[n]});
 return{tipo:"variaveis",linhas:linhas,utilizador:util};
}

function gerar(pedido){
 var C=codigo();
 if(!C)return{erro:"O gerador de código não está carregado."};
 var etapas=[],nomes=pedido.linhas.map(function(l){return l[0]});
 etapas.push("Intenção: declarar "+(pedido.linhas.length===1?"uma variável":pedido.linhas.length+" variáveis")+" ("+nomes.join(", ")+"). Os nomes ficam exatamente como escreveste.");
 var p;
 try{p=C.deLinhas(pedido.utilizador,pedido.linhas)}catch(e){return{erro:String(e.message||e)}}
 etapas.push("Montei cada declaração letra a letra pelas regras: const, nome, dois pontos, tipo, igual, valor e ponto e vírgula.");
 var texto;
 try{texto=C.gerar(p.programa,p.tabela).replace(/\n$/,"")}catch(e){return{erro:String(e.message||e)}}
 var falta=nomes.filter(function(n){return texto.indexOf("const "+n+":")<0});
 if(falta.length)return{erro:"O código gerado não tem a variável «"+falta[0]+"» com o nome exato."};
 etapas.push("Teste 1: confirmei que as variáveis que pediste (\""+nomes.join("\", \"")+"\") estão declaradas com o nome e o tipo exatos.");
 etapas.push("Teste 2: confirmei a ordem (declarar antes de usar), os tipos das contas e que nenhuma linha passa de 80 colunas.");
 return{texto:texto,letras:C.emitirLetras(p.programa),etapas:etapas};
}

PT.registar({nome:"variaveis",chaves:"variavel variaveis constante constantes const",interpretar:interpretarVariaveis,gerar:gerar});
})();
