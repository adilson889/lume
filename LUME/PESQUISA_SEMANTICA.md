# Pesquisa semantica (embeddings) no Lume

Estado: planeado. Ainda nao implementado.

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
