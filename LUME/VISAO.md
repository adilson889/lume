# Visão do Lume

**O Lume deve conhecer as suas capacidades, não necessariamente todos os comandos possíveis.**

Se programarmos antecipadamente todos os comandos, teremos um sistema limitado a uma lista de operações conhecidas.

Mas o HTMLx-lang já oferece variáveis, funções, condições, ciclos, arrays, cálculos, DOM, reactividade e comunicação externa.

Isso significa que podemos dar ao Lume capacidades fundamentais e permitir que ele as combine para executar tarefas diferentes.

## Exemplo

Alguém pede:

> Cria uma calculadora que some números e mostre o resultado num gráfico.

O Lume não precisa de ter um comando específico chamado `CRIAR_CALCULADORA_COM_GRAFICO`.

Deve saber combinar:

1. A capacidade de criar interfaces.
2. A capacidade de receber dados.
3. A capacidade matemática.
4. A capacidade de gerar gráficos.
5. A capacidade de actualizar elementos dinamicamente.

O resultado é uma operação composta.

## Arquitectura

- **BotQL:** define as regras e o comportamento do Lume.
- **HTMLx-lang:** fornece os meios de execução.
- **Command Dispatcher:** encaminha as operações.
- **Lume:** interpreta o pedido, selecciona capacidades e coordena a execução.

## Regra

O Lume não deve inventar capacidades que não possui. Deve combinar apenas ferramentas disponíveis e verificar se a operação pode ser executada.

## Registo de capacidades e despachante

A ideia para sair dos comandos é separar três coisas:

1. **O que o Lume sabe fazer** vive em dados, no registo `LUME/bot/capacidades.txt`. Cada capacidade diz que verbos e objetos a ativam, o que precisa para ser executada (por exemplo, pelo menos dois números ou duas peças) e que resposta a executa. Acrescentar uma capacidade é acrescentar uma linha.
2. **Quem decide** é um despachante (`LUME/despachante.js`). Lê a pergunta, procura os verbos e os objetos no registo, mede o que o pedido traz (números, peças de `pecas.txt`) e escolhe a capacidade. Não tem frases decoradas.
3. **Quem executa** é o HTMLx-lang, através das respostas indicadas no registo.

Antes de executar, o despachante verifica se o pedido tem o que é preciso. Se não tem, o Lume diz o que sabe fazer e o que lhe falta, em vez de inventar. Se a pergunta mistura capacidades ou não se aplica a nenhuma, segue para o bot, que decide pelas regras do `main.sql`.

Os dados crescem sem mexer na lógica: as peças dos desenhos estão em `LUME/bot/pecas.txt` e uma peça nova é uma linha nova. O desenho de várias peças num só SVG (por exemplo uma casa com árvore e sol) sai de um único ciclo sobre esse registo, e não de um bloco por desenho.

### Como chegamos lá

| Passo | Estado | O que traz |
|---|---|---|
| 1. Registo e despachante | feito (0.4.0) | calcular, desenhar peças e criar loja como capacidades; verificação do que falta |
| 2. Cadeias | por fazer | o resultado de uma capacidade entra na seguinte, por exemplo calcular e depois mostrar num gráfico |
| 3. Mais capacidades de base | por fazer | gráficos, tabelas, formulários e dados externos, cada uma como uma linha no registo |
| 4. Ensinadas por pessoas | por fazer | alguém ensina uma peça ou uma capacidade pelo editor e ela entra no registo sem tocar em código |
| 5. Retirar as regras antigas | por fazer | as regras do `main.sql` que o despachante já cobre deixam de existir |

A cadeia (passo 2) depende de decidirmos de que lado fica a ponte entre capacidades: no chat, ou no HTMLx-lang com chamadas de blocos por nome.

## Em resumo

Não queremos construir um bot com mil comandos. Queremos construir um bot com capacidades suficientes para produzir mil operações diferentes.

Há uma diferença enorme entre essas duas coisas.

**Não vamos ensinar o Lume a decorar milhares de comandos. Vamos dar-lhe capacidades para construir operações diferentes.**
