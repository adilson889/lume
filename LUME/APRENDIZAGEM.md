# Aprendizagem do Lume: estado atual e plano

Estado: **ideia, a fazer como última tarefa antes do lançamento.** Nada deste plano está implementado.

## Como funciona hoje

- Quem ensina escreve um bloco de texto. Fica **pendente** e passa a **aprovado** pelo dono ou por votos (`APROVAR_COM = 2`).
- Os blocos aprovados são juntados aos ficheiros de conhecimento do bot (`aprendido.txt` e outros) quando o app arranca.
- O servidor valida o bloco: tamanho, sem HTML, só links de sites aceites, nome do autor limpo (nomes reservados bloqueados).
- Cada resposta tem gosto e não gosto. O voto conta **1 por dispositivo e rede** e pode ser mudado ou retirado.
- Respostas não ensinadas (conversa, desenhos, contas) guardam os votos só pelo **hash do texto**, nunca o texto.
- Limites: 200 KB de texto aprovado, 2000 votantes por resposta ensinada, 3000 respostas gerais com até 300 votantes cada.
- Cada voto novo é um commit no ficheiro do Lume no GitHub.

## Limites que isto tem

1. **Resposta fixa:** um bloco aprovado fica até alguém o apagar. Os votos decidem a aprovação, mas não mudam depois qual resposta aparece.
2. **Contradições:** se duas pessoas ensinam coisas diferentes sobre o mesmo tema, não há regra de qual ganha.
3. **Ativação fraca:** o texto aprendido só aparece se a pergunta ativar o bloco certo. Perguntas ditas de outra forma passam ao lado.
4. **Sem correção:** para corrigir uma resposta errada é preciso ensinar outra, e as duas convivem.
5. **Crescimento:** o ficheiro cresce com blocos e votos, e cada voto é um commit.
6. **Votos por texto exato:** respostas com variações de frase dividem os votos entre si.

## Plano proposto

### 1. Formato em pares
Em vez de texto solto, cada entrada ensinada tem:
- **ativadores:** as formas de perguntar (várias frases);
- **resposta:** o texto a mostrar;
- **autor**, **data** e **votos**.

### 2. Várias respostas por pergunta
Uma pergunta pode ter mais de uma resposta ensinada. O Lume mostra a **mais votada**. A diferença entre gostos e não gostos decide a ordem.

### 3. Correção
Quem vê uma resposta errada pode propor uma correção, ligada à resposta original, em vez de criar uma entrada solta. Ao ser aprovada, passa a ser a mostrada.

### 4. Ocultar automaticamente
Uma resposta com muitos não gosto e poucos gostos deixa de ser mostrada e vai para revisão do dono. Os valores limite ficam por decidir.

### 5. Crescimento controlado
- Votos fora do ficheiro principal (ficheiro próprio ou agrupados), para não haver um commit por voto.
- Limpeza periódica de entradas ocultas e sem votos.

## Decisões em aberto

- Quantos ativadores por entrada e como validá-los (para não ativarem respostas em perguntas erradas).
- Valores para ocultar: mínimo de votos e proporção de não gosto.
- Quem aprova correções: só o dono, ou também votos.
- Migração: como converter os blocos já aprovados para o formato em pares.

## Ordem sugerida

1. Formato em pares e migração dos blocos existentes.
2. Várias respostas e escolha pela mais votada.
3. Correções.
4. Ocultar automaticamente.
5. Votos fora do ficheiro principal.

Cada passo pode ser lançado sozinho.
