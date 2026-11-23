// nucleo.js - Núcleo da interpretação de pedidos de código em português.
// Parte a frase em palavras, descobre a intenção pelas palavras-chave das intenções registadas
// e entrega o resto à intenção certa. Cada capacidade nova é um ficheiro um ficheiro nesta pasta que
// chama registar(). Precisa de lexico.js e gerador.js.
(function() {
"use strict";
var LEX = (typeof window !== "undefined" && window.LumeCodigoLexico) || require("./lexico.js");
function conj(t){var o={};t.split(" ").forEach(function(w){o[w]=1});return o}
var S={acoes:conj(LEX.acoes),variavel:conj(LEX.variavel),funcao:conj(LEX.funcao),linguagem:conj(LEX.linguagem),retorno:conj(LEX.retorno),entrada:conj(LEX.entrada),ligar:conj(LEX.ligar),vazias:conj(LEX.vazias),tipoNome:conj(LEX.tipoNome),condicao:conj(LEX.condicao)};
var NOME_RE=/^[A-Za-z_$][A-Za-z0-9_$]*$/,ACENTO_RE=/[À-ÿ]/;

function sa(t){return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"")}

/* ===== 1) PALAVRAS ===== */
function palavras(q){
 var re=/"[^"]*"|'[^']*'|«[^»]*»|“[^”]*”|\d+(?:[.,]\d+)?|[A-Za-zÀ-ÿ_$][A-Za-z0-9À-ÿ_$]*|[<>!]=?=?|={1,3}|[+\-*\/;,:]/g,m,o=[];
 while((m=re.exec(q))){
  var t=m[0],k;
  if(/^["'«“]/.test(t))k="txt";else if(/^\d/.test(t))k="num";else if(/^[A-Za-zÀ-ÿ_$]/.test(t))k="pal";else k="sim";
  o.push({t:t,n:sa(t).toLowerCase(),k:k});
 }
 return o;
}
function ePal(w){return w&&w.k==="pal"}
function eVazia(w){return ePal(w)&&S.vazias[w.n]}
function eLexico(w){
 if(!ePal(w))return false;
 var n=w.n;
 return !!(S.acoes[n]||S.variavel[n]||S.funcao[n]||S.linguagem[n]||S.retorno[n]||S.entrada[n]||S.ligar[n]||S.vazias[n]||S.tipoNome[n]||LEX.binarios[n]!==undefined||LEX.unarios[n]||LEX.escolha[n]||LEX.comparar[n]!==undefined||LEX.propriedades[n]||S.condicao[n]||LEX.booleanos[n]!==undefined);
}
function eNome(w){return ePal(w)&&!eLexico(w)}
var INFIX={mais:1,menos:1,vezes:1,multiplicado:1,dividido:1,"+":1,"-":1,"*":1,"/":1};
/* "a" e "o" tambem podem ser nomes de variaveis (a mais b): conta como nome se estiver ao lado de um operador, de "e" ou do fim */
function eNomeCtx(ws,i){
 var w=ws[i];
 if(eNome(w))return true;
 if(!ePal(w)||!(w.n==="a"||w.n==="o"))return false;
 var nx=ws[i+1],pv=ws[i-1];
 if(!nx)return true;
 if(pv&&ePal(pv)&&pv.n==="se")return true;
 if(ePal(nx)&&(nx.n==="for"||nx.n==="seja"||nx.n==="esta"||nx.n==="fica"))return true;
 if(nx.k==="sim"&&(nx.t===","||nx.t===";"))return true;
 if(ePal(nx)&&nx.n==="e")return true;
 if(INFIX[nx.n])return true;
 if(pv&&INFIX[pv.n])return true;
 return false;
}
function valorLit(w){
 if(w.k==="num")return{tipo:"number",valor:parseFloat(w.t.replace(",","."))};
 if(w.k==="txt")return{tipo:"string",valor:w.t.slice(1,-1)};
 if(ePal(w)&&LEX.booleanos[w.n]!==undefined)return{tipo:"boolean",valor:LEX.booleanos[w.n]};
 return null;
}
function opDe(w){return(w.k==="pal"||w.k==="sim")&&LEX.binarios[w.n]!==undefined?LEX.binarios[w.n]:null}

function erroNome(n){
 if(ACENTO_RE.test(n))return"O nome «"+n+"» tem acentos. Em TypeScript uso nomes sem acentos (por exemplo «"+sa(n)+"»); diz-me com que nome o queres.";
 if(!NOME_RE.test(n))return"«"+n+"» não é um nome válido.";
 return null;
}

/* ===== 3) EXPRESSOES: operandos e operadores, venham em que forma vierem ===== */
/* Devolve {itens:[{nome}|{num}], ops:[...]} ou {erro}. Aceita "a vezes b", "a*b", "soma a e b",
   "soma de a e b e c", "o dobro de x". */
function expressao(ws,operandoPorOmissao){
 var itens=[],ops=[],i,w;
 for(i=0;i<ws.length;i++){
  if(ePal(ws[i])&&LEX.escolha[ws[i].n]){
   var cmp=LEX.escolha[ws[i].n],vs=[];
   for(var q=0;q<ws.length;q++){
    if(ws[q].k==="num")vs.push({num:parseFloat(ws[q].t.replace(",","."))});
    else if(q!==i&&eNomeCtx(ws,q))vs.push({nome:ws[q].t});
   }
   if(vs.length!==2)return{erro:"Por agora comparo dois valores de cada vez. Diz-me, por exemplo, «o "+ws[i].t+" entre a e b»."};
   return{itens:vs,ops:[],escolha:cmp,palavraEscolha:ws[i].n};
  }
  w=ws[i];
  if(ePal(w)&&LEX.unarios[w.n]){
   var u=LEX.unarios[w.n],alvo=null;
   for(var j=i+1;j<ws.length;j++){if(eNomeCtx(ws,j)){alvo=ws[j].t;break}if(ws[j].k==="num"){alvo=null;break}}
   var inv=false;
   if(!alvo){alvo=operandoPorOmissao||"valor";inv=!operandoPorOmissao}
   itens.push({nome:alvo});ops.push(u[0]);itens.push(u[1]==="eu"?{nome:alvo}:{num:u[1]});
   return{itens:itens,ops:ops,unario:w.n,alvo:alvo,alvoInventado:inv};
  }
  var op=opDe(w);
  if(op){ops.push(op);continue}
  if(w.k==="num"){itens.push({num:parseFloat(w.t.replace(",","."))});continue}
  if(eNomeCtx(ws,i)){itens.push({nome:w.t});continue}
 }
 if(!itens.length)return{erro:"Não encontrei com que fazer a conta."};
 if(!ops.length){return itens.length===1?{itens:itens,ops:[]}:{erro:"Não percebi que conta fazer com «"+ws.map(function(x){return x.t}).join(" ")+"»."}}
 if(ops.length===1&&itens.length>2&&(ops[0]==="+"||ops[0]==="*")){while(ops.length<itens.length-1)ops.push(ops[0])}
 if(itens.length!==ops.length+1)return{erro:"Não percebi a conta «"+ws.map(function(x){return x.t}).join(" ")+"»."};
 var iguais=ops.every(function(o){return o===ops[0]});
 if(ops.length>1&&!(iguais&&(ops[0]==="+"||ops[0]==="*")))return{erro:"Por agora faço uma conta de cada vez (ou várias somas, ou vários produtos). Diz-me a conta por partes."};
 return{itens:itens,ops:ops};
}
function nomesDe(itens){var v=[];itens.forEach(function(x){if(x.nome!==undefined&&v.indexOf(x.nome)<0)v.push(x.nome)});return v}

/* ===== INTENCOES ===== */
var intencoes=[];
/* i = {nome, chaves:"palavra palavra", interpretar(ws)->pedido|{erro}|null, gerar(pedido)->{texto,etapas,letras}|{erro}} */
function registar(i){i.conjunto=conj(i.chaves);intencoes.push(i)}

function interpretar(q){
 var ws=palavras(String(q||"").trim().replace(/[.!?]+$/,""));
 ws=ws.filter(function(w,i){return !(ePal(w)&&(w.n==="typescript"||w.n==="ts")&&i>0&&ws[i-1]&&(ws[i-1].n==="em"||ws[i-1].n==="com"))&&!(ePal(w)&&w.n==="em"&&ws[i+1]&&(ws[i+1].n==="typescript"||ws[i+1].n==="ts"))});
 var a=-1;
 for(var i=0;i<Math.min(ws.length,3);i++)if(ePal(ws[i])&&S.acoes[ws[i].n]){a=i;break}
 if(a<0)return null;
 var j,k,esc=null,pos=-1;
 for(j=a+1;j<ws.length&&!esc;j++){
  if(!ePal(ws[j]))continue;
  for(k=0;k<intencoes.length;k++)if(intencoes[k].conjunto[ws[j].n]){esc=intencoes[k];pos=j;break}
 }
 if(!esc)return null;
 for(var m=a+1;m<pos;m++){if(!(eVazia(ws[m])||(ePal(ws[m])&&S.linguagem[ws[m].n])||(ePal(ws[m])&&ws[m].n==="me")))return null}
 var p=esc.interpretar(ws.slice(pos+1));
 if(p)p.intencao=esc;
 return p;
}

function responder(q){
 var pedido=interpretar(q);
 if(!pedido)return null;
 if(pedido.erro)return{texto:pedido.erro,etapas:["Percebi que é um pedido de código, mas não consegui ler tudo com segurança."]};
 var r=pedido.intencao.gerar(pedido);
 if(r.erro)return{texto:"Não vou mostrar código duvidoso: "+r.erro,etapas:["Montei o código mas a verificação recusou-o."]};
 r.texto="```ts\n"+r.texto+"\n```";
 return r;
}

var PT={LEX:LEX,S:S,sa:sa,conj:conj,palavras:palavras,ePal:ePal,eVazia:eVazia,eLexico:eLexico,eNome:eNome,eNomeCtx:eNomeCtx,valorLit:valorLit,opDe:opDe,erroNome:erroNome,expressao:expressao,nomesDe:nomesDe,registar:registar,resultados:[],registarResultado:function(h){PT.resultados.push(h)},interpretar:interpretar,responder:responder,intencoes:intencoes};
if (typeof window !== "undefined") window.LumeCodigoPT = PT;
if (typeof module !== "undefined" && module.exports) module.exports = PT;
})();
