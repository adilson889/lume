# Pesquisa semantica (embeddings) no Lume

Estado: infraestrutura pronta (`LUME/embeddings.js`), mas NAO ligada ao Lume X: o modelo atual nao serve para portugues (ver Resultados).

## Objetivo
Escolher respostas pelo significado, nao so por palavras iguais:
- conhecimento local (`aprendido.txt`, `conhecimento_programacao.txt`, etc.): "como faco um loop" encontra a entrada sobre `for`;
- pesquisa na web: escolher a frase mais relevante do resumo da Wikipedia.
Nao gera texto. So mede similaridade entre frases.

## Modelo
- `Xenova/all-MiniLM-L6-v2`, versao quantizada (`model_quantized.onnx`, cerca de 23 MB).
- Fonte: https://huggingface.co/Xenova/all-MiniLM-L6-v2
- Biblioteca: transformers.js (https://github.com/huggingface/transformers.js)
- Licenca do modelo: Apache-2.0.
- Limite: foi treinado sobretudo em ingles. Para portugues, traduzir a pergunta para ingles (o chat ja tem traducao) ou trocar por `Xenova/multilingual-e5-small` (cerca de 115 MB).

## Ficheiros (colocar no repo)
```
LUME/ia/minilm/
  config.json
  tokenizer.json
  tokenizer_config.json
  onnx/model_quantized.onnx
```

Biblioteca e runtime (descarregados pelo mesmo workflow, `LUME/ia/baixar-minilm.yml`):
```
LUME/ia/transformers/
  transformers.min.js
  ort-wasm-simd-threaded*.wasm / .mjs
  VERSAO.txt
```

## Regras de carregamento
1. Nunca carregar no arranque do site.
2. So no Lume X (o Flash e o Lume ficam sem isto).
3. Carregar sob demanda, na primeira pesquisa que precisar, em segundo plano. Enquanto isso, responder como hoje.
4. Guardar em cache permanente (Cache Storage, via service worker). Incluir os ficheiros na lista de cache de `sw.js` so depois de carregados.
5. Se falhar, voltar ao comportamento atual (palavras-chave). Nunca bloquear a resposta.
6. Opcional: interruptor "Pesquisa inteligente (25 MB)" nas definicoes.

## Plano de implementacao
1. `LUME/embeddings.js`: carrega o transformers.js e o modelo (local, `env.allowRemoteModels=false`, `env.localModelPath`), expoe `window.LumeEmb.vetor(texto)` e `window.LumeEmb.melhor(pergunta, lista, n)`.
2. Conhecimento local: ao carregar, gerar um vetor por bloco e guardar em IndexedDB (chave = hash do bloco). Recalcular so blocos novos.
3. `despachante.js`: no Lume X, quando nada responde, tentar `LumeEmb.melhor` nos blocos locais com limiar de confianca (ex.: similaridade >= 0.5). Abaixo do limiar, nao responder.
4. Pesquisa web: usar `LumeEmb.melhor` para escolher as frases do resumo, em vez da pontuacao por palavras de `resumirSnippet`.
5. Treino: casos novos em `LUME/treino/casos.txt` (perguntas com palavras diferentes das do conhecimento).

## Riscos
- Peso total real: biblioteca + WASM + modelo, acima de 23 MB.
- RAM e tempo de arranque em telemoveis fracos.
- Traducao usa um endpoint nao oficial; manter fallback.

## Resultados da avaliacao (all-MiniLM-L6-v2 quantizado)
Medido com `LUME/tests/embeddings.html` sobre os 256 blocos de `conhecimento_programacao.txt`:
- Pergunta em portugues contra blocos em portugues: top-1 certo em 1 de 12; faixas de pontuacao misturadas (tema 0,56-0,77, fora do tema 0,41-0,55). Inutilizavel.
- Pergunta traduzida para ingles contra os mesmos blocos em portugues: top-1 certo em 7 de 12 (top-3: 9 de 12). Tema 0,27-0,66, fora do tema e pedidos do bot (desenhar, loja, contas, cumprimentos) 0,13-0,39. Os acertos fortes (o que e X) ficam acima de 0,52.
- Escolher a frase certa dentro de um artigo da Wikipedia (pergunta em portugues): 2 em 7; pior que a heuristica por palavras de `resumirSnippet`. Nao ligado.

## Estado: ligado so ao Lume X
- `LUME/embeddings.js` embrulha `window.LumeDespachante.tentar`: corre depois do despachante, so se ele nao respondeu e so no Lume X.
- Na 1.a pergunta do Lume X carrega o modelo em segundo plano e responde como ate agora. Da 2.a em diante: traduz a pergunta para ingles (`translate.googleapis.com`, o mesmo servico do chat, 3,5 s de limite), compara com os blocos e, se a melhor pontuacao for >= 0,45, responde com o bloco e o seu titulo ("Pelo que percebi, perguntas sobre **Titulo**"). Abaixo do limiar, ou se a traducao falhar, segue para o bot.
- Flash e Lume nunca carregam o modelo.
- Limite honesto: a esta pontuacao apanha sobretudo perguntas "o que e X"; as parafrases mais livres (0,27-0,44) ficam abaixo do limiar e seguem para o bot. Um bloco vizinho pode sair em vez do exato (ex.: "Commit" para o historico do codigo).

## Proximo passo
- Traduzir os blocos para ingles (ou usar `Xenova/multilingual-e5-small`, cerca de 115 MB, com os prefixos `query: ` e `passage: `) deve subir o top-1. Medir sempre com `LUME/tests/embeddings.html` antes de baixar o limiar.
- Pesquisa na Wikipedia: so depois de passar na mesma medicao.

## O que `embeddings.js` ja resolve (necessario para qualquer modelo)
- O transformers.js 4.x, por defeito, vai buscar o runtime WASM a CDN (jsdelivr): sem rede nao arranca. O modulo aponta `wasmPaths` para `LUME/ia/transformers/ort-wasm-simd-threaded.{mjs,wasm}`.
- Com `localModelPath` em URL (`http...`) o transformers.js nao encontra o tokenizer local; o modulo usa o caminho (`/LUME/ia/`).
- Dos 4 runtimes WASM em `LUME/ia/transformers/` so se usa `ort-wasm-simd-threaded.wasm` (+ `.mjs`, ~14 MB). Os outros tres (`asyncify`, `jsep`, `jspi`, cerca de 72 MB) podem ser apagados do repo.
- Primeira execucao: cerca de 9 s para vetorizar os 256 blocos; depois ficam em IndexedDB (cerca de 40 ms por pergunta).

## Lume Flash: pesquisa por palavras (0.5.83)
O Flash e o modelo leve: nao descarrega modelos nem usa rede. Responde a perguntas de programacao com
`LUME/pesquisa_palavras.js` (BM25 com radicais portugueses, palavras do titulo valem 3x) sobre
`bot/conhecimento_programacao.txt` e `bot/aprendido.txt`. `LUME/pesquisa_flash.js` liga isto ao despachante,
so no Flash, depois do despachante e antes da pesquisa na Wikipedia. Tres saidas:
- o nome exato de um topico ("o que e um ciclo for") ou uma pontuacao >= 10: responde;
- pontuacao entre 6 e 10 e uma palavra da pergunta no titulo: propoe ate 3 opcoes para tocar;
- senao: fica calado e segue como antes (Wikipedia).

Medido com `node LUME/tests/pesquisa_flash.js` (40 perguntas de programacao e 16 fora de tema, em `tests/perguntas_pesquisa.json`):
responde a 19 (19 certas, 0 erradas), propoe opcoes em 9 (a certa estava em 8), fica calado em 12, e nas 16 fora de tema nao responde a nenhuma.
Ressalva: os limiares (10 e 6) foram escolhidos nestas mesmas perguntas. Com perguntas reais de utilizadores o resultado pode ser pior;
acrescenta-as ao JSON e volta a correr o teste.

## Resultados com o MiniLM e as palavras (so teste, nao ligado ao X)
`LUME/tests/avaliar_pesquisa.mjs` corre o MiniLM do repo em Node e compara metodos (instrucoes no topo do ficheiro).
Com validacao cruzada (limiar escolhido numa metade das 40 perguntas e medido na outra), sobre 40 perguntas:
- X de hoje (MiniLM com a pergunta traduzida): certas 17, erradas 2, falsos 0 em 16;
- palavras + MiniLM com a pergunta traduzida: certas 29, erradas 4, falsos 0;
- palavras + MiniLM em portugues (sem rede): certas 27, erradas 7, falsos 0.
Ganha em respostas certas mas erra mais. As traducoes usadas sao as minhas, nao as da Google: a prova real e com perguntas reais.
