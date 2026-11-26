/* Pesquisa por palavras em portugues (BM25 com radicais), sem modelos nem rede.
   Serve de base a LUME/embeddings.js: sozinha apanha o que tem palavras em comum com o bloco;
   junta-se aos embeddings para apanhar o que so se parece no significado. Ver LUME/PESQUISA_SEMANTICA.md.
   Funciona no navegador (window.LumePalavras) e em Node (module.exports), para o teste LUME/tests/avaliar_pesquisa.mjs. */
(function (raiz) {
  "use strict";
  var STOP = {};
  ("a o as os um uma uns umas de do da dos das em no na nos nas para por com sem que e é se ao aos à às como qual quais quando onde quem " +
   "eu me te lhe nos vos meu minha teu tua seu sua isto isso aquilo este esta esse essa ser estar ter haver fazer faco faz fazem fazes ha foi sao era " +
   "sera mas ou mais menos muito pouco tambem ja so ainda entre sobre ate quero quer queres preciso diz diga explica explicar explique ensina ensinar " +
   "percebo perceber nao sim").split(" ").forEach(function (w) { STOP[w] = 1; });

  function semAcentos(t) { return String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

  /* Radical simples: "ordenar", "ordeno" e "ordenacao" ficam todos "orden". */
  function radical(w) {
    if (w.length <= 3) return w;
    w = w.replace(/(coes|oes|aes)$/, "ao").replace(/(ismos?)$/, "").replace(/(mente)$/, "");
    w = w.replace(/(acao|icao|ucao|acoes|icoes)$/, "").replace(/(ador|adora|edor|idor|adores)$/, "");
    w = w.replace(/(amos|emos|imos|ando|endo|indo|ados|idos|adas|idas|ado|ido|ada|ida)$/, "");
    w = w.replace(/(ar|er|ir|as|es|os)$/, "").replace(/s$/, "");
    return w.replace(/(a|o|e)$/, "");
  }
  function termos(t) {
    return semAcentos(t).split(/[^a-z0-9]+/).filter(function (w) { return w && !STOP[w]; }).map(radical).filter(function (w) { return w.length > 1; });
  }

  /* Blocos "Titulo (sinonimos): texto". Palavras do titulo pesam 3 vezes mais. */
  var PESO_TITULO = 3;
  function indexar(blocos) {
    var docs = blocos.map(function (b) {
      var i = b.indexOf(":"), titulo = i > 0 ? b.slice(0, i) : b.slice(0, 40), corpo = i > 0 ? b.slice(i + 1) : b;
      return { t: termos(titulo), c: termos(corpo) };
    });
    var df = {}, soma = 0;
    docs.forEach(function (d) {
      var vistos = {};
      d.t.concat(d.c).forEach(function (w) { if (!vistos[w]) { vistos[w] = 1; df[w] = (df[w] || 0) + 1; } });
      soma += d.t.length * PESO_TITULO + d.c.length;
    });
    return { docs: docs, df: df, N: docs.length, media: soma / (docs.length || 1) };
  }
  function contar(lista, w) { var n = 0; for (var i = 0; i < lista.length; i++) if (lista[i] === w) n++; return n; }

  /* Pontuacao BM25 da pergunta contra cada bloco (mesma ordem do indice). */
  function pontuar(ix, pergunta) {
    var vistos = {}, Q = termos(pergunta).filter(function (w) { if (vistos[w]) return false; vistos[w] = 1; return true; });
    return ix.docs.map(function (d) {
      var s = 0, len = d.t.length * PESO_TITULO + d.c.length;
      Q.forEach(function (w) {
        var tf = contar(d.t, w) * PESO_TITULO + contar(d.c, w);
        if (!tf) return;
        var n = ix.df[w] || 0, idf = Math.log(1 + (ix.N - n + 0.5) / (n + 0.5));
        s += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * len / ix.media));
      });
      return s;
    });
  }

  /* Junta palavras e significado: metade cada. As palavras so pesam a serio se a pergunta tiver
     termos suficientes em comum (conf), senao mandam os embeddings. Ambos entre 0 e 1. */
  function misturar(lex, emb) {
    var mx = 0, i;
    for (i = 0; i < lex.length; i++) if (lex[i] > mx) mx = lex[i];
    var conf = Math.min(1, mx / 6), L = mx || 1;
    return lex.map(function (x, k) { return 0.5 * (x / L) * conf + 0.5 * Math.max(0, emb[k]); });
  }

  var API = { termos: termos, radical: radical, indexar: indexar, pontuar: pontuar, misturar: misturar };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (raiz) raiz.LumePalavras = API;
})(typeof window !== "undefined" ? window : null);
