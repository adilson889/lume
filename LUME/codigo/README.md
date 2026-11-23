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
| `condicoes.js` | Resultado de funções com condição: "verdadeiro se a for maior que b", "'positivo' se n for maior que 0 senão 'negativo'", "se n é par" |

Ordem de carregamento: gerador, léxico, núcleo, intenções e resultados (a lista está em `../codigo.js`).

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
