# Gerador de codigo (HTML + CSS)

O Lume gera componentes de interface a partir de dados, sem comandos decorados.
Pedidos como "cria um botao vermelho grande com texto Comprar agora" ou
"gera um cartao azul e um alerta" passam pelo despachante (capacidade `codigo`
em `LUME/bot/capacidades.txt`) e correm `gerar_codigo.txt`.

## Como funciona

1. O despachante decide pelo verbo (cria, gera, faz...) e pelo objeto: o objeto
   `componentes` significa "algum nome de `componentes.txt` aparece no pedido".
2. O chat injeta no XLang os arrays `comp_*` (de `componentes.txt`) e `cores_*`
   (de `cores.txt`), como faz com `pecas_*`.
3. `gerar_codigo.txt` e um unico programa generico: le a cor, o tamanho, a forma e
   o texto do pedido, e junta o CSS e o HTML de cada componente pedido.
4. A resposta e um bloco de codigo com `<style>` (variaveis `--cor`, `--cor-escuro`,
   `--cor-claro`, `--sobre`, `--raio`, `--tam`) e o HTML.

## O que a pessoa pode pedir

| Parte | Exemplos |
|-------|----------|
| Componente | botao, titulo, cartao, campo, login, alerta, etiqueta, navegacao, rodape |
| Cor | vermelho, azul, verde... (cores.txt) ou um valor `#ff6600` |
| Tamanho | grande, pequeno |
| Forma | redondo, quadrado |
| Texto | `com texto Comprar agora`, `escrito ...`, `dizendo ...`, `chamado ...` |

Com "ficheiro", "arquivo" ou "pagina" no pedido, em vez do bloco de codigo o Lume entrega uma pagina HTML completa, como cartao que abre no editor.

Varios componentes no mesmo pedido saem num so bloco de codigo, com a mesma cor, tamanho e texto.

## Acrescentar um componente

Uma linha nova em `LUME/bot/componentes.txt`, sem tocar em mais nada:

```
nome | sinonimos | texto padrao | HTML | CSS
```

- No HTML, `@texto@` e o texto pedido (ou o padrao).
- No CSS, `¶` separa as regras (cada uma fica numa linha na resposta).
- Usa as variaveis `var(--cor)`, `var(--cor-escuro)`, `var(--cor-claro)`, `var(--sobre)`,
  `var(--raio)` e `var(--tam)` para que a cor, a forma e o tamanho pedidos funcionem.
- Nao uses o caractere `|` dentro do HTML ou do CSS.

## Acrescentar uma cor

Uma linha nova em `LUME/bot/cores.txt`:

```
nome | hex | cor do texto sobre ela | sinonimos
```

## Notas sobre o XLang

- Nao ha metodos de texto (`.slice`, `.join`, `.indexOf`): usa `split`, `trim`, `includes`.
- `.length` so funciona em variaveis; guarda o `split` numa variavel primeiro.
- Uma expressao invalida nao da erro: o valor fica como texto literal. Se algo parece
  ignorado, mostra a variavel com `<print>` para ver o que ela guardou.
- Um valor com mudanca de linha e lido como texto literal; `gerar_codigo.txt` usa isso
  para obter a quebra de linha (`nlq` e `nl`).
- Um `<foreach>` dentro de um `<for>` pode quebrar o ciclo de fora: usa um `<for>` com indice.
