// lexico.js - Léxico do gerador de código em português (dados, não frases).
// Cada lista é uma família de palavras com significado. Para o Lume perceber uma palavra
// nova, acrescenta-a aqui. Usado por nucleo.js.
(function() {
"use strict";
var LEX={
 acoes:"cria criar crie faz fazer faca gera gerar gere escreve escrever escreva declara declarar declare define definir preciso quero",
 variavel:"variavel variaveis constante constantes const",
 funcao:"funcao funcoes",
 linguagem:"typescript ts codigo",
 retorno:"devolve devolver devolvendo retorna retornar retornando calcula calcular calcule faz diz dizer indica verifica verificar testa testar",
 entrada:"recebe receber recebendo usa com para",
 ligar:"igual valendo vale com como de valor",
 vazias:"guarda guardar guardando armazena armazenar contem tem elementos valores itens numeros for seja ser eh esta fica sendo entre um uma uns umas dois duas o a os as de do da dos das em no na que e por favor me chamada chamado chamadas chamados nome ao pelo pela",
 tipoNome:"variavel numero valor",
 binarios:{mais:"+",soma:"+",somar:"+",menos:"-",subtrai:"-",subtrair:"-",vezes:"*",multiplicado:"*",multiplica:"*",multiplicar:"*",produto:"*",dividido:"/",divide:"/",dividir:"/",resto:"%","%":"%","+":"+","-":"-","*":"*","/":"/","%":"%"},
 unarios:{dobro:["*",2],triplo:["*",3],quadruplo:["*",4],metade:["/",2],quadrado:["*","eu"]},
 escolha:{maior:">",menor:"<",maximo:">",minimo:"<"},
 comparar:{maior:">",menor:"<",igual:"===",diferente:"!=="},
 propriedades:{par:1,impar:1,multiplo:1,divisivel:1},
 condicao:"se senao ou",
 colecao:"lista listas array arrays",
 agregados:{media:"media",contar:"contar",quantos:"contar",tamanho:"contar",comprimento:"contar"},
 nomesOp:{"+":"somar","-":"subtrair","*":"multiplicar","/":"dividir","%":"resto"},
 booleanos:{verdadeiro:true,verdadeira:true,"true":true,falso:false,falsa:false,"false":false},
 /* Formas diferentes de dizer a mesma coisa. [padrao sem acentos, substituicao]. Aplicadas por ordem,
    sem maiusculas/acentos, so fora das aspas. Para o Lume perceber uma forma nova, acrescenta uma linha. */
 parafrases:[
  ["\\b(if)\\b","se"],["\\b(else)\\b","senao"],
  ["\\s*,?\\s*\\b(caso contrario|do contrario|ou entao|em caso contrario|senao)\\b\\s*(?:(?:devolve|devolver|retorna|retornar|da|mostra|escreve)\\s+)?"," senao "],
  [",?\\s*\\bse nao\\b(?!\\s+(for|seja|e|eh|esta|estiver|fosse|fica))\\s*(?:(?:devolve|devolver|retorna|retornar|da|mostra|escreve)\\s+)?"," senao "],
  ["\\b(caso|quando|desde que)\\b","se"],
  ["\\b(superior a|acima de|mais do que|mais que|maior do que|maior que)\\b","maior que"],
  ["\\b(inferior a|abaixo de|menos do que|menos que|menor do que|menor que)\\b","menor que"],
  ["\\b(pelo menos|no minimo|igual ou superior a|igual ou maior que)\\b","maior ou igual a"],
  ["\\b(no maximo|igual ou inferior a|igual ou menor que)\\b","menor ou igual a"],
  ["\\bnao (e|eh|for|seja) (igual a|igual)\\b","diferente de"],["\\b(distinto de|distinta de)\\b","diferente de"],
  ["\\b(positivo|positiva)\\b","maior que 0"],["\\b(negativo|negativa)\\b","menor que 0"],["\\bzero\\b","0"],
  ["\\b(multiplo|multiplos) de\\b","multiplo de"],["\\bdivisivel por\\b","divisivel por"],
  ["\\b(subtrai|subtrair|subtraia)\\s+([A-Za-z0-9_$]+)\\s+(?:de|a)\\s+([A-Za-z0-9_$]+)\\b","$3 menos $2"],
  ["\\bresto (?:da|de) divisao (?:de )?([A-Za-z0-9_$]+) por ([A-Za-z0-9_$]+)","$1 % $2"],
  ["\\b(?:a )?multiplicacao de ([A-Za-z0-9_$]+) por ([A-Za-z0-9_$]+)","$1 vezes $2"],["\\b(?:a )?divisao de ([A-Za-z0-9_$]+) por ([A-Za-z0-9_$]+)","$1 dividido $2"],
  ["\\b(maior|menor)\\s+(numero|valor)\\b","$1"],
  ["\\bcompara(?:r)? ([A-Za-z0-9_$]+) e ([A-Za-z0-9_$]+) e (?:devolve|devolver|retorna|retornar|diz|da)\\s+o\\s+(maior|menor)\\b","devolve o $3 entre $1 e $2"],
  ["\\b(maior|menor) entre dois (numeros|valores)\\b","$1 entre a e b"],
  ["\\b(?:recebe|recebendo|com|para)\\s+(?:dois|duas)\\s+(?:numeros|valores|parametros)\\b","recebe a e b"],
  ["\\b(?:recebe|recebendo|com|para)\\s+(?:tres)\\s+(?:numeros|valores|parametros)\\b","recebe a, b e c"],
  ["\\b(?:recebe|recebendo|com|para)\\s+(?:um|uma)\\s+(?:numero|valor|parametro)\\b","recebe n"],
  ["\\b(?:a )?(soma|somar|adiciona|adicionar)\\s+(?:de\\s+|dos\\s+)?(?:dois|duas)\\s+(?:numeros|valores)\\b","a mais b"],
  ["\\b(?:subtrai|subtrair|subtracao de|diferenca entre)\\s+(?:dois|duas)\\s+(?:numeros|valores)\\b","a menos b"],
  ["\\b(?:multiplica|multiplicar|produto de|multiplicacao de)\\s+(?:dos\\s+)?(?:dois|duas)\\s+(?:numeros|valores)\\b","a vezes b"],
  ["\\b(?:divide|dividir|divisao de|quociente de)\\s+(?:dos\\s+)?(?:dois|duas)\\s+(?:numeros|valores)\\b","a dividido b"],
  ["\\b(fun[c]ao) para\\b","funcao que"]
 ]

};
if (typeof window !== "undefined") window.LumeCodigoLexico = LEX;
if (typeof module !== "undefined" && module.exports) module.exports = LEX;
})();
