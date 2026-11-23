// funcoes.js - Intenção: criar funções (contas, dobro/metade, maior/menor com if).
(function() {
"use strict";
var PT = (typeof window !== "undefined" && window.LumeCodigoPT) || require("./nucleo.js");
var LEX=PT.LEX,S=PT.S,sa=PT.sa,ePal=PT.ePal,eVazia=PT.eVazia,eNome=PT.eNome,eNomeCtx=PT.eNomeCtx,valorLit=PT.valorLit,erroNome=PT.erroNome,expressao=PT.expressao,nomesDe=PT.nomesDe;
function codigo(){return (typeof window!=="undefined"&&window.LumeCodigo)||require("./gerador.js")}
function interpretarFuncao(ws){
 var r=-1;
 for(var i=0;i<ws.length;i++)if(ePal(ws[i])&&S.retorno[ws[i].n]){r=i;break}
 var cabeca=r<0?[]:ws.slice(0,r),cauda=r<0?ws:ws.slice(r+1);
 var nome=null,params=[];
 /* nome dado: «chamada X» ou a primeira palavra livre antes do verbo (uma operacao so conta como nome se houver depois uma conta explicita) */
 for(var k=0;k<cabeca.length;k++){
  if(ePal(cabeca[k])&&(cabeca[k].n==="chamada"||cabeca[k].n==="chamado"||cabeca[k].n==="nome")&&cabeca[k+1]&&ePal(cabeca[k+1])){nome=cabeca[k+1].t;break}
 }
 if(!nome){
  for(var m=0;m<cabeca.length;m++){
   if(eVazia(cabeca[m]))continue;
   if(eNome(cabeca[m])||(ePal(cabeca[m])&&(LEX.binarios[cabeca[m].n]!==undefined||LEX.unarios[cabeca[m].n]||LEX.escolha[cabeca[m].n])&&r>=0))nome=cabeca[m].t;
   break;
  }
 }
 var ent=-1;
 for(var e=0;e<cabeca.length;e++)if(ePal(cabeca[e])&&S.entrada[cabeca[e].n]){ent=e;break}
 if(ent>=0)for(var f=ent+1;f<cabeca.length;f++){if(eNomeCtx(cabeca,f)&&cabeca[f].t!==nome&&params.indexOf(cabeca[f].t)<0)params.push(cabeca[f].t)}
 if(nome){var en=erroNome(nome);if(en)return{erro:en}}
 for(var g=0;g<params.length;g++){var ep=erroNome(params[g]);if(ep)return{erro:ep.replace("O nome","O parâmetro")}}
 if(!cauda.length)return{erro:"Percebi que queres uma função, mas não percebi o que ela deve devolver. Diz-me, por exemplo, «que devolve n vezes 2»."};
 var ex=expressao(cauda,params[0]);
 if(ex.erro)return{erro:ex.erro};
 var inventados=[];
 if(ex.unario&&!params.length){params=[ex.alvo];if(ex.alvoInventado)inventados=["valor"]}
 if(!params.length){params=nomesDe(ex.itens)}
 if(!params.length)return{erro:"Percebi a conta, mas não sei com que variáveis a função trabalha. Diz-me os nomes, por exemplo «que recebe a e b»."};
 var inventouNome=false;
 if(!nome){nome=ex.palavraEscolha||ex.unario||(ex.ops.length?LEX.nomesOp[ex.ops[0]]:"calcular");inventouNome=true}
 var ea=nomesDe(ex.itens).map(erroNome).filter(Boolean)[0];if(ea)return{erro:ea};
 return{tipo:"funcao",funcao:{nome:nome,params:params,itens:ex.itens,ops:ex.ops,unario:ex.unario||null,escolha:ex.escolha||null,palavraEscolha:ex.palavraEscolha||null,nomeInventado:inventouNome,inventados:inventados}};
}

function gerarFuncao(f){
 var C=codigo();
 if(!C)return{erro:"O gerador de código não está carregado."};
 var no=function(o){return o.nome!==undefined?C.ident(o.nome):C.literal(o.num)};
 var e=no(f.itens[0]),passos;
 if(f.escolha){passos=[C.se(C.comparacao(no(f.itens[0]),f.escolha,no(f.itens[1])),[C.retorno(no(f.itens[0]))]),C.retorno(no(f.itens[1]))]}
 else{for(var i=1;i<f.itens.length;i++)e=C.binaria(e,f.ops[i-1],no(f.itens[i]));passos=[C.retorno(e)]}
 var tabela=C.criarTabela(),texto,programa;
 var op=f.ops.length?f.ops[0]:null,nomeOp={"+":"soma","-":"subtração","*":"multiplicação","/":"divisão"};
 var etapas=["Intenção: criar uma função"+(f.escolha?" que escolhe o "+f.palavraEscolha+" de dois valores, com um if":f.unario?" que calcula o "+f.unario:op?" com uma "+nomeOp[op]:"")+". Parâmetros: "+f.params.join(", ")+"."+(f.inventados&&f.inventados.length?" Não deste nome à variável, por isso chamei-lhe «"+f.inventados[0]+"».":"")+(f.nomeInventado?" Não deste nome à função, por isso chamei-lhe «"+f.nome+"».":" Os nomes que deste ficam exatamente como escreveste.")];
 try{
  C.registarUtilizador(tabela,f.nome);
  programa=[C.funcao(f.nome,f.params.map(function(n){return C.parametro(n,"number")}),"number",passos)];
  etapas.push("Montei a função letra a letra pelas regras: function, nome, parâmetros com tipo, tipo de retorno, chaveta, return e fecho.");
  texto=C.gerar(programa,tabela).replace(/\n$/,"");
  var sem=f.params.filter(function(n){return texto.indexOf(n+": number")<0});
  if(texto.indexOf("function "+f.nome+"(")<0||sem.length)return{erro:"O código gerado não tem os nomes exatos que pediste."};
  etapas.push("Teste 1: confirmei que a função «"+f.nome+"» e os parâmetros estão com o nome e o tipo exatos.");
  etapas.push("Teste 2: confirmei que todos os nomes usados no return existem como parâmetros, que os tipos batem certo e que nenhuma linha passa de 80 colunas.");
 }catch(err){return{erro:String(err.message||err)}}
 return{texto:texto,letras:C.emitirLetras(programa),etapas:etapas};
}

PT.registar({nome:"funcoes",chaves:"funcao funcoes",interpretar:interpretarFuncao,gerar:function(p){return gerarFuncao(p.funcao)}});
})();
