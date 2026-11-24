# LUME/codigo - Pedidos de código em português

Camada que lê um pedido escrito em português ("cria uma função que calcula o dobro de uma variável"), descobre a intenção, extrai os dados e gera código TypeScript letra a letra. Não há frases fixas: há um léxico de palavras com significado e regras para as combinar.

## Ficheiros

| Ficheiro | Papel |
|---|---|
| `../codigo.js` | Carregador: carrega estes ficheiros por ordem e expõe `window.LumeCodigoChat.responder(q)` ao despachante |
| `gerador.js` | Gerador: nós, verificador e emissor letra a letra (`window.LumeCodigo`) |
| `lexico.js` | Léxico (dados): ações, operações, palavras vazias, maior/menor... |
| `nucleo.js` | Núcleo: palavras, contas, descoberta da intenção, `responder` |
| `variaveis.js` | Intenção: declarar variáveis e constantes |
| `funcoes.js` | Intenção: criar funções (contas, dobro, metade, maior/menor com if) |
| `listas.js` | Listas e ciclos: "cria uma lista notas com 10, 12 e 15"; funções que somam, multiplicam, tiram a média ou contam os elementos de uma lista (com for) |
| `condicoes.js` | Resultado de funções com condição: "verdadeiro se a for maior que b", "'positivo' se n for maior que 0 senão 'negativo'", "se n é par", "entre 1 e 10", "múltiplo de 3", sujeito implícito |

Ordem de carregamento: gerador, léxico, núcleo, intenções e resultados (a lista está em `../codigo.js`).

## Formas diferentes de dizer o mesmo (paráfrases)

Os utilizadores não escrevem todos da mesma maneira, por isso a frase passa primeiro por uma tabela de reescritas em `lexico.js` (`parafrases`, dados e não código): «caso contrário», «se não», «senão» e «else» viram `senao`; «superior a», «acima de» e «mais que» viram «maior que»; «pelo menos» e «no mínimo» viram «maior ou igual a»; «positivo» e «negativo» viram «maior/menor que 0»; «subtrai b de a» vira «a menos b»; «resto da divisão de a por b» vira `a % b`; «dois números» viram `a` e `b`. As reescritas não mexem no que está entre aspas e ignoram maiúsculas e acentos. Para o Lume perceber uma forma nova, acrescenta uma linha `[padrão sem acentos, substituição]` à tabela.

Nas condições o sujeito pode ficar implícito («devolve 'aprovado' se for maior que 10»: usa-se o único parâmetro) e há «entre A e B», «múltiplo de X», «divisível por X», «par» e «ímpar».

## Juntar uma capacidade nova

1. Cria `LUME/codigo/<nome>.js` (copia o cabeçalho de `funcoes.js`) e regista a intenção:

```js
PT.registar({
  nome: 'ciclos',
  chaves: 'ciclo ciclos repete',      // palavras que a escolhem
  interpretar: function(ws) { /* devolve {tipo, ...} ou {erro} ou null */ },
  gerar: function(pedido) { /* devolve {texto, letras, etapas} ou {erro} */ }
});
```

2. Acrescenta o nome do ficheiro à lista `FICHEIROS` em `../codigo.js`.
3. Palavras novas vão para `lexico.js`.

## Juntar um tipo novo de resultado de função

Uma função pode devolver coisas muito diferentes. Em vez de crescer `funcoes.js`, cada tipo de resultado é um ficheiro que se regista com `PT.registarResultado({nome, ler})`. `ler(cauda)` recebe as palavras depois de «devolve» e devolve `null` (não é comigo), `{erro}`, ou `{nomes, nomeSugerido, retorno, descricao, montar}`, onde `montar(C, no)` devolve os passos do corpo da função. Ver `condicoes.js`.

## Regras que valem para todas as intenções

- Os nomes dados pelo utilizador ficam exatamente como escritos. Acentos e palavras reservadas são recusados com explicação.
- Se faltar um nome, o Lume inventa-o e diz qual foi.
- O código só é mostrado depois de verificado.
- Se os ficheiros ainda não carregaram (ou sem rede), `responder` devolve `null` e o Lume segue o caminho normal.
