// listas.js - Listas e ciclos. Duas coisas num ficheiro, ambas sobre listas:
//  1) Intenção "lista": cria uma lista com valores ("cria uma lista notas com 10, 12 e 15").
//  2) Resultado de função sobre listas: soma, produto, média e contagem, com um for.
(function() {
"use strict";
var PT = (typeof window !== "undefined" && window.LumeCodigoPT) || require("./nucleo.js");
var LEX=PT.LEX,S=PT.S,ePal=PT.ePal,eVazia=PT.eVazia,eNome=PT.eNome,valorLit=PT.valorLit,erroNome=PT.erroNome;
function codigo(){return (typeof window!=="undefined"&&window.LumeCodigo)||require("./gerador.js")}

/* ===== 1) declarar uma lista ===== */
function interpretarLista(ws){
 var p=ws.slice();
 while(p.length&&(eVazia(p[0])||(ePal(p[0])&&S.colecao[p[0].n])))p.shift();
 if(p.length&&ePal(p[0])&&S.ligar[p[0].n])return{erro:"Diz-me o nome da lista. Escreve por exemplo: cria uma lista notas com 10, 12 e 15."};
 var nome=p.shift();
 if(!nome||!ePal(nome))return{erro:"Não percebi o nome da lista. Escreve por exemplo: cria uma lista notas com 10, 12 e 15."};
 var en=erroNome(nome.t);if(en)return{erro:en};
 while(p.length&&((ePal(p[0])&&(S.ligar[p[0].n]||S.vazias[p[0].n]))||(p[0].k==="sim"&&(p[0].t==="="||p[0].t===":"))))p.shift();
 var vals=[];
 for(var i=0;i<p.length;i++){
  var w=p[i];
  if(w.k==="sim"&&(w.t===","||w.t===";"))continue;
  if(ePal(w)&&w.n==="e")continue;
  var l=valorLit(w);
  if(!l)return{erro:"Não percebi o valor «"+w.t+"» da lista. Uso números, textos entre aspas ou verdadeiro/falso."};
  vals.push(l);
 }
 if(!vals.length)return{erro:"A lista «"+nome.t+"» precisa de valores, por exemplo «com 10, 12 e 15»."};
 var tipo=vals[0].tipo;
 if(vals.some(function(v){return v.tipo!==tipo}))return{erro:"Os valores de uma lista têm de ser todos do mesmo tipo (números, textos ou verdadeiro/falso)."};
 return{tipo:"lista",nome:nome.t,tipoItens:tipo,valores:vals.map(function(v){return v.valor})};
}
function gerarLista(p){
 var C=codigo();
 if(!C)return{erro:"O gerador de código não está carregado."};
 var etapas=["Intenção: declarar uma lista de "+p.tipoItens+" chamada «"+p.nome+"», com "+p.valores.length+" valores. O nome fica exatamente como escreveste."];
 var tabela=C.criarTabela(),programa,texto;
 try{
  C.registarUtilizador(tabela,p.nome);
  programa=[C.declaracao("const",p.nome,p.tipoItens+"[]",C.lista(p.valores.map(function(v){return C.literal(v)})))];
  etapas.push("Montei a declaração letra a letra pelas regras: const, nome, tipo da lista, igual, parênteses retos com os valores separados por vírgula e ponto e vírgula.");
  texto=C.gerar(programa,tabela).replace(/\n$/,"");
  if(texto.indexOf("const "+p.nome+": "+p.tipoItens+"[]")<0)return{erro:"O código gerado não tem a lista com o nome e o tipo exatos."};
  etapas.push("Teste 1: confirmei que «"+p.nome+"» está declarada com o nome e o tipo exatos.");
  etapas.push("Teste 2: confirmei que todos os valores são do mesmo tipo e que nenhuma linha passa de 80 colunas.");
 }catch(err){return{erro:String(err.message||err)}}
 return{texto:texto,letras:C.emitirLetras(programa),etapas:etapas};
}
PT.registar({nome:"listas",chaves:"lista listas array arrays",interpretar:interpretarLista,gerar:gerarLista});

/* ===== 2) funcoes sobre listas ===== */
function itemDe(lista){
 var r=/ores$/.test(lista)?lista.slice(0,-2):/s$/.test(lista)&&lista.length>2?lista.slice(0,-1):"item";
 return(r===lista||erroNome(r))?"item":r;
}
var OPS={"+":{nome:"somar",ini:0,atr:"+=",rotulo:"a soma"},"*":{nome:"multiplicar",ini:1,atr:"*=",rotulo:"o produto"}};
function ler(cauda){
 var iC=-1,k;
 for(k=0;k<cauda.length;k++)if(ePal(cauda[k])&&S.colecao[cauda[k].n]){iC=k;break}
 if(iC<0)return null;
 var agg=null,op=null;
 cauda.forEach(function(w){
  if(!ePal(w))return;
  if(LEX.agregados[w.n]&&!agg)agg=LEX.agregados[w.n];
  else if(LEX.binarios[w.n]!==undefined&&!op)op=LEX.binarios[w.n];
 });
 var nomeLista=null;
 for(k=iC+1;k<cauda.length;k++){if(eNome(cauda[k])){nomeLista=cauda[k].t;break}}
 var tipo=agg||(op&&OPS[op]?"op":null);
 if(!tipo)return{erro:"Percebi que é sobre uma lista, mas por agora só somo, multiplico, tiro a média ou conto os elementos. Diz-me, por exemplo, «que soma os números de uma lista»."};
 var nomes=[nomeLista||"numeros"];
 var sug=agg==="media"?"calcularMedia":agg==="contar"?"contar":OPS[op].nome;
 var desc=agg==="contar"?"que conta os elementos de uma lista":"que percorre uma lista com um for e calcula "+(agg==="media"?"a média":OPS[op].rotulo);
 return{nomes:nomes,nomeSugerido:sug,retorno:"number",tipoParam:"number[]",descricao:desc,
  montar:function(C,no,pn){
   var lista=pn[0],item=itemDe(lista),acc=(lista==="total"||item==="total")?"resultado":"total";
   if(agg==="contar")return[C.retorno(C.membro(C.ident(lista),"length"))];
   var o=agg==="media"?OPS["+"]:OPS[op];
   var passos=[C.declaracao("let",acc,"number",C.literal(o.ini)),C.para(item,C.ident(lista),[C.atribuicao(acc,o.atr,C.ident(item))])];
   passos.push(C.retorno(agg==="media"?C.binaria(C.ident(acc),"/",C.membro(C.ident(lista),"length")):C.ident(acc)));
   return passos;
  }};
}
PT.registarResultado({nome:"listas",ler:ler});
})();
