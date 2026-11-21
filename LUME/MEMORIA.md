# Memória do Lume

Este documento descreve como o Lume lembra e esquece, o que já está feito e o que falta. A memória do Lume vive em JavaScript (`LUME/dialogo.js`) e é independente do `Context()` do BotQL. Se um dia o BotQL oferecer uma solução nativa, esta implementação pode ser substituída por ela.

## Princípios

- Só se guarda o que o utilizador diz. Nada é inferido.
- A memória é por dispositivo e navegador (`localStorage` e `sessionStorage`). Sem login, não há forma de a ligar a uma pessoa em vez de a um dispositivo.
- A memória de conversa é curta e acaba com a sessão. A persistente guarda poucos factos, e o utilizador pode vê-los, esquecê-los ou limpá-los.
- Cada tipo de memória tem o seu próprio armazenamento, para não se misturarem.

## Estado atual

### Memória de conversa (sessão)

Guardada em `sessionStorage`, chave `lume_dialogo_v1`, no objeto `S` de `dialogo.js`.

| Campo | Para que serve |
|---|---|
| `n` | contador de turnos |
| `pend` | pergunta que o Lume fez e ainda espera resposta (nome, estado, ajuda, confirmar, números, livre) |
| `ultimoPedido` | último pedido que corresponde a uma capacidade do despachante |
| `ultimaPergunta` | última pergunta feita pelo Lume |
| `ultimaResposta` | última resposta do Lume, sem HTML, até 1500 caracteres |
| `humor` | média móvel do sentimento das mensagens |
| `ultimoEstado` | último estado emocional dito pelo utilizador |
| `hist` | histórico curto: até 6 turnos, cada um com `n`, `p` (pedido, 200 caracteres) e `r` (resposta, 300 caracteres) |

### Continuidade

Feita em `reescrever()`:

- «de novo», «outra vez» e «repete» repetem o último pedido.
- «mais curto», «mais simples», «mais longo» e «mais detalhado» juntam-se ao último pedido.
- Respostas curtas completam a pergunta pendente durante 3 turnos. Exemplo: «uma casa com árvore» passa a «desenha uma casa com árvore».
- «repete» repete a última resposta (`conversar()`).

### Memória persistente

Guardada em `localStorage`, chave `lume_memoria_v1`. As regras estão em `LUME/bot/memoria.txt`, uma por linha, no formato `chave | rótulo | padrão`. O grupo 1 do padrão é o valor guardado e a mesma chave substitui o valor antigo.

Chaves atuais: `nome`, `local`, `gosto`, `nota`. O nome é copiado também para `lume_nome`, usado nos cumprimentos.

Operações disponíveis em `window.LumeDialogo`: `memorizar`, `recuperar` («o que sabes de mim»), `memoriaTexto`, `lista`, `esquecer`, `limpar`, `historico`.

### Ligação

`despachante.js` chama `recuperar`, `memorizar`, `ver`, `resolver` e `conversar`. `index.html` e `mobile.html` chamam `reescrever` antes de despachar e `registar` em cada resposta.

## Lacunas

- Não há assunto atual. «E em Python?» depois de uma pergunta sobre funções não funciona.
- «Mais curto» junta-se ao pedido anterior, mas não encurta a resposta anterior.
- A expressão de «mais curto» é fixa e só funciona se o pedido anterior for de uma capacidade do despachante.
- A memória persistente não expira. O campo `t` (data) é guardado mas não é usado.
- As regras de `memoria.txt` só apanham a frase inteira (`^...$`). «Moro em Luanda e gosto de futebol» não guarda nada.
- Não há aprendizagem de preferências durante a conversa.

## Plano

1. Histórico curto de turnos. Feito: campo `hist` e função `historico()`. Ainda não é usado por nenhuma regra.
2. Assunto atual: guardar o tema do último turno (capacidade ou tema do conhecimento) para resolver perguntas de seguimento.
3. «Mais curto» e «mais longo» a atuarem sobre a última resposta, usando `hist`.
4. Expiração na memória persistente, por chave (por exemplo, `nota` expira e `nome` não). Exige uma coluna nova em `memoria.txt` e ajuste do leitor em `regrasMemoria()`.
5. Regras de `memoria.txt` que apanhem factos dentro de frases mais longas.
6. Preferências aprendidas na conversa, só depois de os passos anteriores estarem estáveis.

Cada passo vira casos novos em `LUME/treino/casos.txt`.
