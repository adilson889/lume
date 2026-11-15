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

## Em resumo

Não queremos construir um bot com mil comandos. Queremos construir um bot com capacidades suficientes para produzir mil operações diferentes.

Há uma diferença enorme entre essas duas coisas.

**Não vamos ensinar o Lume a decorar milhares de comandos. Vamos dar-lhe capacidades para construir operações diferentes.**
