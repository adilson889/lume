// condicoes.js - Resultado de funções com condição: "devolve verdadeiro se a for maior que b",
// "devolve 'positivo' se n for maior que 0 senão 'negativo'", "diz se n é par".
(function() {
"use strict";
var PT = (typeof window !== "undefined" && window.LumeCodigoPT) || require("./nucleo.js");
var LEX=PT.LEX,ePal=PT.ePal,eVazia=PT.eVazia,eNomeCtx=PT.eNomeCtx,valorLit=PT.valorLit,erroNome=PT.erroNome;

var SIMBOLOS={">":">","<":"<",">=":">=","<=":"<=","==":"===","===":"===","!=":"!==","!==":"!=="};
var NOMES={">":"ehMaior","<":"ehMenor",">=":"ehMaiorOuIgual","<=":"ehMenorOuIgual","===":"saoIguais","!==":"saoDiferentes"};

/* Le a condicao (palavras depois de "se"): {esq,op,dir} ou {par:true|false,alvo} */
function condicao(ws){
 var op=null,prop=null,itens=[],usados={};
 for(var i=0;i<ws.length;i++){
  var w=ws[i];
  if(w.k==="sim"&&SIMBOLOS[w.t]){op=SIMBOLOS[w.t];continue}
  if(ePal(w)&&LEX.comparar[w.n]!==undefined){
   op=LEX.comparar[w.n];
   var n1=ws[i+1],n2=ws[i+2];
   if((op===">"||op==="<")&&n1&&ePal(n1)&&n1.n==="ou"&&n2&&ePal(n2)&&n2.n==="igual"){op+="=";i+=2}
   continue;
  }
  if(ePal(w)&&LEX.propriedades[w.n]){prop=w.n;continue}
  if(w.k==="num"){itens.push({num:parseFloat(w.t.replace(",","."))});continue}
  if(eNomeCtx(ws,i)){itens.push({nome:w.t});continue}
 }
 if(prop){
  if(itens.length!==1||itens[0].nome===undefined)return{erro:"Para «"+prop+"» preciso de uma variável, por exemplo «se n for "+prop+"»."};
  return{par:prop==="par",alvo:itens[0],propriedade:prop};
 }
 if(!op)return{erro:"Não percebi a condição. Uso «maior que», «menor que», «igual a», «diferente de» (ou os símbolos > < >= <=) e «par»/«ímpar»."};
 if(itens.length!==2)return{erro:"Preciso de dois valores para comparar, por exemplo «se a for maior que b»."};
 return{esq:itens[0],op:op,dir:itens[1]};
}

function valorDe(ws){
 var so=ws.filter(function(w){return !(w.k==="sim"&&w.t===",")});
 if(so.length===1&&ePal(so[0])&&eVazia(so[0])&&eNomeCtx(so,0))return{nome:so[0].t};
 var p=ws.filter(function(w){return !(eVazia(w)&&!(w.k==="pal"&&valorLit(w)))&&!(w.k==="sim"&&w.t===",")});
 if(!p.length)return null;
 if(p.length!==1)return{erro:"Não percebi o que devolver: «"+ws.map(function(x){return x.t}).join(" ")+"»."};
 var l=valorLit(p[0]);
 if(l)return{lit:l};
 if(p[0].k==="pal"&&!/[À-ÿ]/.test(p[0].t))return{nome:p[0].t};
 return{erro:"Não percebi o que devolver: «"+p[0].t+"»."};
}

function ler(cauda){
 var i=-1;
 for(var k=0;k<cauda.length;k++)if(ePal(cauda[k])&&cauda[k].n==="se"){i=k;break}
 if(i<0)return null;
 var antes=cauda.slice(0,i),resto=cauda.slice(i+1),j=-1;
 for(var m=0;m<resto.length;m++)if(ePal(resto[m])&&resto[m].n==="senao"){j=m;break}
 var condWs=j<0?resto:resto.slice(0,j),senaoWs=j<0?[]:resto.slice(j+1);
 var c=condicao(condWs);if(c.erro)return c;
 var A=valorDe(antes),B=senaoWs.length?valorDe(senaoWs):null;
 if(A&&A.erro)return A;if(B&&B.erro)return B;
 var soCond=!A||(A.lit&&A.lit.tipo==="boolean"&&A.lit.valor===true&&!B);
 var nomes=[];
 function junta(o){if(o&&o.nome!==undefined&&nomes.indexOf(o.nome)<0)nomes.push(o.nome)}
 if(c.par!==undefined)junta(c.alvo);else{junta(c.esq);junta(c.dir)}
 if(A)junta(A);if(B)junta(B);
 var sug=c.par!==undefined?(c.par?"ehPar":"ehImpar"):NOMES[c.op];
 function cond(C,no){
  if(c.par!==undefined)return C.comparacao(C.binaria(no(c.alvo),"%",C.literal(2)),c.par?"===":"!==",C.literal(0));
  return C.comparacao(no(c.esq),c.op,no(c.dir));
 }
 if(soCond){
  return{nomes:nomes,nomeSugerido:sug,retorno:"boolean",descricao:"que devolve verdadeiro ou falso, comparando com uma condição",
   montar:function(C,no){return[C.retorno(cond(C,no))]}};
 }
 if(A.lit&&A.lit.tipo==="boolean"&&A.lit.valor===false&&!B)return{erro:"Para devolver falso quando a condição é verdadeira, diz-me o que devolver no «senão»."};
 if(!B)return{erro:"Devolves um valor se a condição for verdadeira, mas e se não for? Acrescenta «senão» e o valor, por exemplo «senão 0»."};
 var tA=A.lit?A.lit.tipo:"number",tB=B.lit?B.lit.tipo:"number";
 if(tA!==tB)return{erro:"Os dois valores a devolver têm de ser do mesmo tipo ("+tA+" e "+tB+")."};
 function val(C,no,o){return o.lit?C.literal(o.lit.valor):C.ident(o.nome)}
 return{nomes:nomes,nomeSugerido:"decidir",retorno:tA,descricao:"com uma condição (if) que escolhe o valor a devolver",
  montar:function(C,no){return[C.se(cond(C,no),[C.retorno(val(C,no,A))]),C.retorno(val(C,no,B))]}};
}

PT.registarResultado({nome:"condicoes",ler:ler});
})();
