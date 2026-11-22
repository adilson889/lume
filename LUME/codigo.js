/* Lume - pedidos de codigo (TypeScript). Le o pedido em portugues, tira os nomes e valores
   do utilizador e entrega-os ao gerador (vendor/xlang-codigo.js), que monta o codigo por regras.
   Os nomes do utilizador ficam exatamente como foram escritos. Nao usa modelos de linguagem. */
(function(){
"use strict";
var ID="[A-Za-z_$][A-Za-z0-9_$]*";
var NOME_RE=new RegExp("^"+ID+"$");
var ACENTO_RE=/[À-ÿ]/;
var OPS=[[/^(?:mais|\+)$/i,"+"],[/^(?:menos|-)$/i,"-"],[/^(?:vezes|multiplicado por|x|\*)$/i,"*"],[/^(?:dividido por|sobre|\/)$/i,"/"]];

function sa(t){return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"")}

/* Valor simples: numero, texto entre aspas, verdadeiro/falso. Devolve {tipo,valor} ou null. */
function valorSimples(v){
 v=v.trim();
 if(/^-?\d+(?:[.,]\d+)?$/.test(v))return{tipo:"number",valor:parseFloat(v.replace(",","."))};
 var m=v.match(/^(?:"([^"]*)"|'([^']*)'|«([^»]*)»|“([^”]*)”)$/);
 if(m)return{tipo:"string",valor:m[1]!==undefined?m[1]:m[2]!==undefined?m[2]:m[3]!==undefined?m[3]:m[4]};
 if(/^(?:verdadeiro|true)$/i.test(v))return{tipo:"boolean",valor:true};
 if(/^(?:falso|false)$/i.test(v))return{tipo:"boolean",valor:false};
 return null;
}

function operando(t){
 t=t.trim();
 var s=valorSimples(t);
 if(s&&s.tipo==="number")return{num:s.valor};
 if(new RegExp("^"+ID+"$").test(t))return{nome:t};
 if(/[À-ÿ]/.test(t)&&/^[A-Za-zÀ-ÿ_$][A-Za-z0-9À-ÿ_$]*$/.test(t))return{acento:t};
 return null;
}

/* Parte uma conta "a vezes b" em esquerda, operador, direita. */
function conta(v){
 var m=v.match(/^(.+?)\s*(\+|\*|\/)\s*(.+)$/)||v.match(/^(.+?)\s+(mais|menos|vezes|multiplicado por|dividido por|sobre|x|-)\s+(.+)$/i);
 if(!m)return null;
 var op=null;for(var i=0;i<OPS.length;i++)if(OPS[i][0].test(m[2])){op=OPS[i][1];break}
 var a=operando(m[1]),b=operando(m[3]);
 if(!op||!a||!b)return null;
 return{esq:a,op:op,dir:b};
}

function limparPedido(t){
 t=t.trim().replace(/[.!?]+$/,"");
 var m=t.match(/^(?:por favor[,\s]+)?(?:cria|criar|crie|faz|faca|faça|gera|gerar|gere|escreve|escrever|escreva|declara|declarar|declare)(?:-me)?\s+(?:me\s+)?(.*)$/i);
 if(!m)return null;
 var resto=m[1];
 if(!/^(?:(?:um|uma|uns|umas|o|a|os|as|dois|duas)\s+)?(?:c[oó]digo|vari[aá]ve(?:l|is)|constantes?|const)\b/i.test(resto))return null;
 if(!/\b(?:vari[aá]ve(?:l|is)|constantes?|const|typescript|ts)\b/i.test(t))return null;
 resto=resto.replace(/\b(?:em|com)\s+(?:typescript|ts)\b/ig,"")
  .replace(/^(?:um|uma|uns|umas|o|a|os|as|dois|duas)\s+/i,"")
  .replace(/^(?:c[oó]digo\s+(?:com|de|para)\s+)?(?:(?:uma?|as|os|duas|dois)\s+)?(?:vari[aá]ve(?:l|is)|constantes?|const)\s+(?:chamad[ao]s?\s+|com o nome\s+|de nome\s+)?/i,"")
  .trim();
 return resto;
}

/* Analisa o pedido. Devolve null se nao for um pedido de codigo, ou {linhas,utilizador,erro?}. */
function analisar(q){
 var resto=limparPedido(String(q||""));
 if(resto===null||!resto)return null;
 var partes=resto.split(/\s*;\s*|,\s+|\s+e\s+/).filter(function(x){return x.trim()});
 var linhas=[],tipos={},erro=null;
 for(var i=0;i<partes.length&&!erro;i++){
  var p=partes[i].trim().replace(/^(?:a|o|uma?)\s+(?:vari[aá]vel|constante)\s+/i,"").replace(/^(?:vari[aá]vel|constante)\s+/i,"").replace(/^(?:a|o)\s+(?=\S+\s+(?:de|como|=|com|igual)\b)/i,"");
  var m=p.match(/^([A-Za-zÀ-ÿ_$][A-Za-z0-9À-ÿ_$]*)\s*(?:=|:|igual a|valendo|vale|com\s+(?:o\s+)?valor(?:\s+de)?|com|como|de|valor)\s+(.+)$/i);
  if(!m){erro="Não percebi «"+partes[i].trim()+"». Escreve por exemplo: cria a variável alunos com 120.";break}
  var nome=m[1],val=m[2].trim();
  if(ACENTO_RE.test(nome)){erro="O nome «"+nome+"» tem acentos. Em TypeScript uso nomes sem acentos (por exemplo «"+sa(nome)+"»); diz-me com que nome o queres.";break}
  if(!NOME_RE.test(nome)){erro="«"+nome+"» não é um nome válido.";break}
  var s=valorSimples(val),l;
  if(s){l=[nome,s.tipo,s.valor];tipos[nome]=s.tipo}
  else{
   var c=conta(val);
   if(!c){erro="Não percebi o valor «"+val+"» de «"+nome+"». Uso números, textos entre aspas, verdadeiro/falso ou contas como preco vezes quantidade.";break}
   if(c.esq.acento||c.dir.acento){erro="Os nomes «"+(c.esq.acento||c.dir.acento)+"» têm acentos; usa nomes sem acentos.";break}
   var ta=c.esq.nome?tipos[c.esq.nome]:"number";
   l=[nome,ta||"number",c.esq.nome||c.esq.num,c.op,c.dir.nome||c.dir.num];tipos[nome]=ta||"number";
  }
  linhas.push(l);
 }
 var usados={};
 linhas.forEach(function(l){if(l.length===5){[l[2],l[4]].forEach(function(x){if(typeof x==="string")usados[x]=1})}});
 var utilizador=linhas.length===1?[linhas[0][0]]:linhas.map(function(l){return l[0]}).filter(function(n){return usados[n]});
 return{linhas:linhas,utilizador:utilizador,erro:erro};
}

/* Monta, verifica e devolve {texto, letras, etapas} ou {erro}. */
function gerar(pedido){
 var C=window.LumeCodigo;
 if(!C)return{erro:"O gerador de código não está carregado."};
 var etapas=[];
 var nomes=pedido.linhas.map(function(l){return l[0]});
 etapas.push("Li o pedido em TypeScript: "+pedido.linhas.length+(pedido.linhas.length===1?" declaração":" declarações")+" ("+nomes.join(", ")+"). Os nomes ficam exatamente como escreveste.");
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

function responder(q){
 var pedido=analisar(q);
 if(!pedido)return null;
 if(pedido.erro)return{texto:pedido.erro,etapas:["Percebi que é um pedido de código, mas não consegui ler os nomes e valores com segurança."]};
 var r=gerar(pedido);
 if(r.erro)return{texto:"Não vou mostrar código duvidoso: "+r.erro,etapas:["Montei o código mas a verificação recusou-o."]};
 r.texto="```ts\n"+r.texto+"\n```";
 return r;
}

window.LumeCodigoChat={analisar:analisar,gerar:gerar,responder:responder};
if(typeof module!=="undefined"&&module.exports)module.exports=window.LumeCodigoChat;
})();
