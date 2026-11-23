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
 vazias:"elementos valores itens numeros for seja ser eh esta fica sendo entre um uma uns umas dois duas o a os as de do da dos das em no na que e por favor me chamada chamado chamadas chamados nome ao pelo pela",
 tipoNome:"variavel numero valor",
 binarios:{mais:"+",soma:"+",somar:"+",menos:"-",subtrai:"-",subtrair:"-",vezes:"*",multiplicado:"*",multiplica:"*",multiplicar:"*",produto:"*",dividido:"/",divide:"/",dividir:"/","+":"+","-":"-","*":"*","/":"/"},
 unarios:{dobro:["*",2],triplo:["*",3],quadruplo:["*",4],metade:["/",2],quadrado:["*","eu"]},
 escolha:{maior:">",menor:"<",maximo:">",minimo:"<"},
 comparar:{maior:">",menor:"<",igual:"===",diferente:"!=="},
 propriedades:{par:1,impar:1},
 condicao:"se senao ou",
 colecao:"lista listas array arrays",
 agregados:{media:"media",contar:"contar",quantos:"contar",tamanho:"contar",comprimento:"contar"},
 nomesOp:{"+":"somar","-":"subtrair","*":"multiplicar","/":"dividir"},
 booleanos:{verdadeiro:true,"true":true,falso:false,"false":false}
};
if (typeof window !== "undefined") window.LumeCodigoLexico = LEX;
if (typeof module !== "undefined" && module.exports) module.exports = LEX;
})();
