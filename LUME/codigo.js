/* Lume - pedidos de codigo (TypeScript).
   1) parte a frase em palavras; 2) descobre a intencao (variavel ou funcao) pelas palavras do lexico;
   3) extrai os dados (nomes, valores, operacao); 4) entrega ao gerador (vendor/xlang-codigo.js), que monta
   o codigo por regras e o verifica. Nao ha frases fixas: so um lexico de palavras com significado.
   Os nomes dados pelo utilizador ficam exatamente como escritos. Sem modelos de linguagem. */
(function(){
"use strict";

/* ===== LEXICO: palavras com significado (dados, nao frases) ===== */
var LEX={
 acoes:"cria criar crie faz fazer faca gera gerar gere escreve escrever escreva declara declarar declare define definir preciso quero",
 variavel:"variavel variaveis constante constantes const",
 funcao:"funcao funcoes",
 linguagem:"typescript ts codigo",
 retorno:"devolve devolver devolvendo retorna retornar retornando calcula calcular calcule faz",
 entrada:"recebe receber recebendo usa com para",
 ligar:"igual valendo vale com como de valor",
 vazias:"entre um uma uns umas dois duas o a os as de do da dos das em no na que e por favor me chamada chamado chamadas chamados nome ao pelo pela",
 tipoNome:"variavel numero valor",
 binarios:{mais:"+",soma:"+",somar:"+",menos:"-",subtrai:"-",subtrair:"-",vezes:"*",multiplicado:"*",multiplica:"*",multiplicar:"*",produto:"*",dividido:"/",divide:"/",dividir:"/","+":"+","-":"-","*":"*","/":"/"},
 unarios:{dobro:["*",2],triplo:["*",3],quadruplo:["*",4],metade:["/",2],quadrado:["*","eu"]},
 escolha:{maior:">",menor:"<",maximo:">",minimo:"<"},
 nomesOp:{"+":"somar","-":"subtrair","*":"multiplicar","/":"dividir"},
 booleanos:{verdadeiro:true,"true":true,falso:false,"false":false}
};
function conj(t){var o={};t.split(" ").forEach(function(w){o[w]=1});return o}
var S={acoes:conj(LEX.acoes),variavel:conj(LEX.variavel),funcao:conj(LEX.funcao),linguagem:conj(LEX.linguagem),retorno:conj(LEX.retorno),entrada:conj(LEX.entrada),ligar:conj(LEX.ligar),vazias:conj(LEX.vazias),tipoNome:conj(LEX.tipoNome)};
var NOME_RE=/^[A-Za-z_$][A-Za-z0-9_$]*$/,ACENTO_RE=/[À-ÿ]/;

function sa(t){return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"")}

/* ===== 1) PALAVRAS ===== */
function palavras(q){
 var re=/"[^"]*"|'[^']*'|«[^»]*»|“[^”]*”|\d+(?:[.,]\d+)?|[A-Za-zÀ-ÿ_$][A-Za-z0-9À-ÿ_$]*|[=+\-*\/;,:]/g,m,o=[];
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
 return !!(S.acoes[n]||S.variavel[n]||S.funcao[n]||S.linguagem[n]||S.retorno[n]||S.entrada[n]||S.ligar[n]||S.vazias[n]||S.tipoNome[n]||LEX.binarios[n]!==undefined||LEX.unarios[n]||LEX.escolha[n]||LEX.booleanos[n]!==undefined);
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

/* ===== 2) INTENCAO ===== */
function interpretar(q){
 var ws=palavras(String(q||"").trim().replace(/[.!?]+$/,""));
 ws=ws.filter(function(w,i){return !(ePal(w)&&(w.n==="typescript"||w.n==="ts")&&i>0&&ws[i-1]&&(ws[i-1].n==="em"||ws[i-1].n==="com"))&&!(ePal(w)&&w.n==="em"&&ws[i+1]&&(ws[i+1].n==="typescript"||ws[i+1].n==="ts"))});
 var a=-1;
 for(var i=0;i<Math.min(ws.length,3);i++)if(ePal(ws[i])&&S.acoes[ws[i].n]){a=i;break}
 if(a<0)return null;
 var iF=-1,iV=-1;
 for(var j=a+1;j<ws.length;j++){
  if(iF<0&&ePal(ws[j])&&S.funcao[ws[j].n])iF=j;
  if(iV<0&&ePal(ws[j])&&S.variavel[ws[j].n])iV=j;
 }
 function soVazias(de,ate){for(var k=de;k<ate;k++){if(!(eVazia(ws[k])||(ePal(ws[k])&&S.linguagem[ws[k].n])||(ePal(ws[k])&&ws[k].n==="me")))return false}return true}
 if(iF>=0&&(iV<0||iF<iV)){if(!soVazias(a+1,iF))return null;return interpretarFuncao(ws.slice(iF+1))}
 if(iV>=0){if(!soVazias(a+1,iV))return null;return interpretarVariaveis(ws.slice(iV+1))}
 return null;
}

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

/* compatibilidade com as chamadas antigas */
function analisar(q){var r=interpretar(q);return r&&r.tipo==="variaveis"?r:null}
function analisarFuncao(q){var r=interpretar(q);return r&&r.tipo==="funcao"?r:null}

/* ===== 4) GERAR E VERIFICAR ===== */
function gerar(pedido){
 var C=window.LumeCodigo;
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

function gerarFuncao(f){
 var C=window.LumeCodigo;
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

function responder(q){
 var pedido=interpretar(q);
 if(!pedido)return null;
 if(pedido.erro)return{texto:pedido.erro,etapas:["Percebi que é um pedido de código, mas não consegui ler tudo com segurança."]};
 var r=pedido.tipo==="funcao"?gerarFuncao(pedido.funcao):gerar(pedido);
 if(r.erro)return{texto:"Não vou mostrar código duvidoso: "+r.erro,etapas:["Montei o código mas a verificação recusou-o."]};
 r.texto="```ts\n"+r.texto+"\n```";
 return r;
}

window.LumeCodigoChat={interpretar:interpretar,analisar:analisar,analisarFuncao:analisarFuncao,gerar:gerar,responder:responder,lexico:LEX};
if(typeof module!=="undefined"&&module.exports)module.exports=window.LumeCodigoChat;
})();
