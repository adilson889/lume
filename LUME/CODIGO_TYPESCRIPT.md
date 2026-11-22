# Lume: gerador de código por regras (TypeScript) - rascunho 1

Estado: proposta para rever. Nada disto está implementado. Sem modelo de linguagem: tudo sai de regras em ficheiros de dados, montado letra a letra.

## 1. Princípios

1. **Estrutura explícita e fixa.** Um ficheiro TypeScript tem sempre as mesmas secções, na mesma ordem, de cima para baixo. O Lume nunca decide "onde pôr" uma coisa: a regra já o diz.
2. **Sem componentes nem templates prontos.** Não existe um "cartão" guardado como texto. Existem regras de escrita (como se escreve uma declaração, uma função, uma tag) e o Lume junta-as para construir o que foi pedido.
3. **Letra a letra.** O resultado é um fluxo de caracteres produzido por um emissor com estado (nível de indentação, início de linha, secção atual).
4. **As variáveis do utilizador são sagradas.** O que o utilizador nomeou entra no código exatamente como foi escrito, e o Lume verifica isso antes de mostrar.
5. **Verificar antes de mostrar.** Estrutura, sintaxe, tipos e variáveis do utilizador são conferidos. Se falhar, o Lume corrige ou diz que não confia no resultado, como nos testes das contas.

## 2. Ficheiros de regras (a pasta `LUME/codigo/`, proposta)

| Ficheiro | O que contém |
|---|---|
| `alfabeto.txt` | letras, dígitos e símbolos permitidos; o que é espaço, fim de linha e indentação |
| `lexico_ts.txt` | palavras reservadas, operadores e pontuação do TypeScript |
| `nomes.txt` | regras de nomes (formato, palavras proibidas, como derivar um nome de uma palavra) |
| `estrutura_ts.txt` | a ordem das secções de um ficheiro e do interior de uma função |
| `sintaxe_ts.txt` | como se escreve cada construção (declaração, função, `if`, `for`, ...) |
| `tipos_ts.txt` | tipos básicos, que operações valem para cada tipo, regra do retorno |
| `logica.txt` | padrões de programação (acumular, contar, procurar, validar, sair cedo) |
| `pedidos_codigo.txt` | como um pedido do utilizador vira intenção + variáveis |
| `testes_codigo.txt` | casos de teste das regras e do código gerado |

## 3. Estrutura de um ficheiro, de cima para baixo

Ordem fixa. Se uma secção não for necessária, não aparece, mas as outras mantêm a ordem.

1. Comentário de cabeçalho (uma linha: o que o ficheiro faz).
2. `import`: primeiro de bibliotecas externas, depois do próprio projeto; `import type` para tipos. Uma linha por `import`, ordenados alfabeticamente.
3. Tipos: `type`, `interface`, `enum`.
4. Constantes de módulo: nome em MAIÚSCULAS_COM_SUBLINHADO.
5. Variáveis de módulo (só se inevitável; por omissão não há).
6. Funções, por esta ordem: auxiliares puras, depois funções de domínio, depois a função de entrada. Uma função é sempre declarada antes de ser usada.
7. Classes (se existirem).
8. `export`: no fim, numa linha só.
9. Ponto de entrada (chamada), se for um programa e não uma biblioteca.

### Interior de uma função

1. Assinatura com todos os parâmetros e o retorno com tipo explícito.
2. Guardas no topo: validar entradas e sair cedo.
3. Variáveis (`const` primeiro, `let` só se for reatribuída).
4. Lógica.
5. `return` no fim.

### Regras de estilo (código limpo)

- Indentação: 2 espaços. Chaveta de abertura na mesma linha. Ponto e vírgula sempre. Aspas simples.
- Uma instrução por linha. Linha com no máximo 80 caracteres.
- `const` por omissão, `let` quando preciso, nunca `var`. Nunca `any`.
- Funções com nome de verbo (`calcularMedia`), tipos em PascalCase (`Aluno`), constantes em MAIÚSCULAS.
- Uma função faz uma só coisa. Sem números soltos: valores com significado viram constantes.

## 4. Montagem letra a letra

O emissor mantém um estado: nível de indentação, se está no início da linha e em que secção está. Cada regra de sintaxe é uma sequência de itens, e só os itens "literais" produzem caracteres.

Notação proposta (cada regra é uma linha):

```
declaracao_const : "const" ESP NOME ":" ESP TIPO ESP "=" ESP EXPR ";" FIM
funcao           : "function" ESP NOME "(" PARAMS ")" ":" ESP TIPO ESP "{" FIM INDENTA CORPO DESINDENTA "}" FIM
retorno          : "return" ESP EXPR ";" FIM
```

- `"..."` é texto literal, emitido letra a letra (`c`, `o`, `n`, `s`, `t`, ...).
- `ESP` é um espaço, `FIM` é fim de linha, `INDENTA` e `DESINDENTA` mudam o nível (2 espaços por nível).
- `NOME`, `TIPO`, `EXPR`, `PARAMS`, `CORPO` são encaixes preenchidos por outras regras ou por valores do utilizador.

Os espaços e as quebras de linha vêm só dos itens `ESP` e `FIM`, nunca de texto solto. É isto que evita erros de estrutura.

Para a mesma regra, se o Lume tiver de a escrever no chat, a saída pode ser enviada letra a letra, como se estivesse a digitar.

## 5. Variáveis do utilizador

Percurso de um pedido: "cria um cartão com a variável alunos".

1. **Extrair.** O Lume identifica `alunos` como nome dado pelo utilizador. Fica na tabela de símbolos com origem "utilizador".
2. **Completar o que falta.** Se o tipo ou o valor não foi dito, o Lume pergunta por sondagem numerada (ex.: "alunos é: 1) uma quantidade (`number`), 2) uma lista de nomes (`string[]`)?"). Se não houver resposta, escolhe o mais provável e diz qual escolheu.
3. **Usar sempre esse nome.** Quando o código precisa de "o número de alunos", a regra consulta a tabela de símbolos e escreve `alunos`, com as mesmas maiúsculas e minúsculas. Nunca inventa um sinónimo.
4. **Nome inválido.** Se o nome do utilizador não for um identificador válido (ex.: começa por número, é palavra reservada), o Lume diz isso e propõe outro. Nunca troca em silêncio.
5. **Verificar.** Antes de mostrar, confere que cada símbolo do utilizador aparece declarado e usado. Se não, rejeita e refaz.

Exemplo do que se espera (a tag HTML também é montada pelas regras, não vem de um modelo):

```ts
const alunos: number = 120;

function criarCartao(alunos: number): string {
  return '<div class="cartao"><h2>Alunos</h2><p>' + alunos + '</p></div>';
}
```

## 6. Verificação antes de mostrar

1. **Estrutura:** as secções estão na ordem certa e nada fica fora do sítio.
2. **Sintaxe:** parênteses, chavetas e aspas fecham; cada instrução acaba; a indentação bate com o nível.
3. **Tipos:** o `return` bate com o tipo declarado; as operações valem para os tipos; não há `any`.
4. **Variáveis do utilizador:** declaradas e usadas, com o nome exato.
5. **Execução (mais tarde):** um mini-interpretador corre o código com casos de teste, sem `eval`.

Cada verificação aparece como "Teste N", como já se faz nas contas.

## 7. Marcos

| Marco | Entrega |
|---|---|
| M1 | alfabeto, léxico, estrutura de ficheiro; `const`/`let` com tipos; uma função com `return` |
| M2 | `if`/`else`, `for`, `while`, arrays, operadores |
| M3 | `interface`, `type`, `import`/`export` |
| M4 | padrões de lógica (somar lista, contar, procurar, validar) e pedidos reais |
| M5 | HTML e CSS como regras de sintaxe (tags, atributos), para casos como o cartão |
| M6 | classes e verificação por execução |
| M7 | C++ com as mesmas camadas |

## 8. Decisões tomadas

1. **Nomes inventados pelo Lume: português sem acentos, `camelCase`** (`calcularMedia`). Os acentos são válidos em TypeScript mas dão problemas de ficheiros e ferramentas; o ASCII evita isso e mantém a coerência com os nomes do utilizador, que ficam exatamente como ele escreve.
2. **Estilo: 2 espaços, aspas simples, ponto e vírgula sempre, 80 colunas.** É o estilo mais comum em TypeScript, e 80 colunas cabem no ecrã do telemóvel sem quebrar o código no chat.
3. **`function nome() {}` por omissão; função de seta só em funções passadas como argumento** (callbacks). As declarações têm nome claro nos erros, e a ordem fixa do ficheiro já resolve a ordem de uso.
4. **Regras em `LUME/codigo/` (Lume); montagem e interpretador como biblioteca `xlang.codigo` (HTMLx-lang).** Os dados crescem sem tocar no motor, e o motor serve outros bots.
5. **Tipo em falta: sondagem só quando a resposta muda a estrutura do código** (ex.: `alunos` ser um número ou uma lista). Quando for um pormenor (valor inicial, nome de uma auxiliar), o Lume escolhe o mais provável e diz qual escolheu. Evita perguntas a mais sem arriscar código errado.
