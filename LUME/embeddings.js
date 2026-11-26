/* Pesquisa semantica do Lume (so no Lume X). Ver LUME/PESQUISA_SEMANTICA.md.
   Mede a semelhanca entre frases com o MiniLM (LUME/ia/minilm) via transformers.js (LUME/ia/transformers).
   Nao gera texto. Regras:
   - nao carrega nada no arranque: este ficheiro so define a API;
   - o modelo (cerca de 23 MB + WASM) so descarrega quando o Lume X precisa e em segundo plano;
   - se falhar ou ainda nao estiver pronto, quem chama continua como antes (palavras-chave). */
(function () {
  "use strict";
  var BASE = new URL("./", document.currentScript ? document.currentScript.src : location.href).href; /* .../LUME/ */
  /* O MiniLM e ingles: a pergunta e traduzida para ingles e comparada com os blocos em portugues.
     Medido em LUME/tests/embeddings.html: acertos fortes >= 0,52; pedidos fora do tema ou que o bot ja resolve <= 0,39. */
  var LIMIAR = 0.45;
  var estado = "parado"; /* parado | a-carregar | pronto | falhou */
  var promessa = null, extrator = null, trabalho = Promise.resolve();
  var blocosLocais = null;

  function aoMudar() { try { window.dispatchEvent(new CustomEvent("lume-emb", { detail: estado })) } catch (e) {} }

  function carregar() {
    if (promessa) return promessa;
    estado = "a-carregar"; aoMudar();
    promessa = (async function () {
      var T = await import(BASE + "ia/transformers/transformers.min.js");
      T.env.allowRemoteModels = false;
      T.env.allowLocalModels = true;
      /* caminho (nao URL http): com URL o transformers.js nao procura os ficheiros do tokenizer localmente */
      T.env.localModelPath = new URL(BASE).pathname + "ia/";
      T.env.useBrowserCache = true;
      try {
        var W = T.env.backends.onnx.wasm;
        W.numThreads = 1; /* sem exigir cabecalhos COOP/COEP */
        /* runtime local (por defeito iria a CDN e nao funcionaria offline) */
        W.wasmPaths = { mjs: BASE + "ia/transformers/ort-wasm-simd-threaded.mjs", wasm: BASE + "ia/transformers/ort-wasm-simd-threaded.wasm" };
      } catch (e) {}
      extrator = await T.pipeline("feature-extraction", "minilm", { dtype: "q8" });
      estado = "pronto"; aoMudar();
      return true;
    })().catch(function (e) {
      estado = "falhou"; aoMudar();
      try { console.warn("[LumeEmb] indisponivel:", e && e.message || e) } catch (_) {}
      return false;
    });
    return promessa;
  }

  /* Fila: o WASM corre um pedido de cada vez. */
  function emFila(fn) {
    var r = trabalho.then(fn, fn);
    trabalho = r.catch(function () {});
    return r;
  }

  async function vetores(textos) {
    var ok = await carregar();
    if (!ok || !extrator) throw new Error("modelo indisponivel");
    var out = [];
    for (var i = 0; i < textos.length; i += 16) {
      var lote = textos.slice(i, i + 16).map(function (t) { return String(t).slice(0, 600) });
      var r = await emFila(function () { return extrator(lote, { pooling: "mean", normalize: true }) });
      var d = r.dims[1], dados = r.data;
      for (var j = 0; j < lote.length; j++) out.push(Float32Array.from(dados.subarray(j * d, (j + 1) * d)));
    }
    return out;
  }

  function cos(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s } /* ja normalizados */

  /* hash simples (FNV-1a) para a chave de cache dos vetores */
  function hash(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) + "." + t.length }

  /* IndexedDB: vetores dos blocos locais, chave = hash do bloco */
  function bd() {
    return new Promise(function (ok, no) {
      try {
        var r = indexedDB.open("lume-emb", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("v") };
        r.onsuccess = function () { ok(r.result) };
        r.onerror = function () { no(r.error) };
      } catch (e) { no(e) }
    });
  }
  async function lerCache(chaves) {
    try {
      var db = await bd();
      return await new Promise(function (ok) {
        var tx = db.transaction("v"), st = tx.objectStore("v"), res = {}, n = chaves.length;
        if (!n) return ok(res);
        chaves.forEach(function (k) { var q = st.get(k); q.onsuccess = function () { if (q.result) res[k] = q.result; if (--n === 0) ok(res) }; q.onerror = function () { if (--n === 0) ok(res) } });
      });
    } catch (e) { return {} }
  }
  async function gravarCache(pares) {
    try {
      var db = await bd(), tx = db.transaction("v", "readwrite"), st = tx.objectStore("v");
      pares.forEach(function (p) { st.put(p[1], p[0]) });
    } catch (e) {}
  }

  /* Vetores de uma lista de textos, reaproveitando a cache. */
  async function vetoresComCache(textos) {
    var chaves = textos.map(hash), c = await lerCache(chaves), falta = [], idx = [];
    chaves.forEach(function (k, i) { if (!c[k]) { falta.push(textos[i]); idx.push(i) } });
    var novos = falta.length ? await vetores(falta) : [], gravar = [];
    novos.forEach(function (v, j) { c[chaves[idx[j]]] = v; gravar.push([chaves[idx[j]], v]) });
    if (gravar.length) gravarCache(gravar);
    return chaves.map(function (k) { return c[k] });
  }

  /* melhor(pergunta, lista, n): as n frases mais proximas. Devolve [{i, texto, score}] por ordem decrescente. */
  async function melhor(pergunta, lista, n) {
    if (!lista || !lista.length) return [];
    var q = (await vetores([pergunta]))[0], v = await vetoresComCache(lista);
    return lista.map(function (t, i) { return { i: i, texto: t, score: cos(q, v[i]) } })
      .sort(function (a, b) { return b.score - a.score }).slice(0, n || 1);
  }

  /* Conhecimento local: blocos separados por linha em branco. */
  async function carregarBlocos() {
    if (blocosLocais) return blocosLocais;
    var b = [];
    for (var f of ["bot/conhecimento_programacao.txt", "bot/aprendido.txt"]) {
      try {
        var r = await fetch(BASE + f); if (!r.ok) continue;
        (await r.text()).split(/\n\s*\n/).forEach(function (t) { t = t.trim(); if (t.length > 30) b.push(t) });
      } catch (e) {}
    }
    blocosLocais = b; return b;
  }
  /* Texto que representa o bloco no calculo: titulo e inicio (o resto pesa pouco e custa tempo). */
  function chaveBloco(t) { return t.slice(0, 220) }

  /* conhecimento(pergunta): melhor bloco local acima do limiar, ou null. Nunca lanca. */
  async function conhecimento(pergunta) {
    try {
      if (estado !== "pronto") return null;
      var blocos = await carregarBlocos(); if (!blocos.length) return null;
      var r = await melhor(pergunta, blocos.map(chaveBloco), 1);
      return r.length && r[0].score >= LIMIAR ? { texto: blocos[r[0].i], score: r[0].score } : null;
    } catch (e) { return null }
  }

  /* Traducao PT -> EN da pergunta (mesmo servico que o chat ja usa). Falha ou demora -> null, e nao se responde por significado. */
  var _trad = {};
  async function paraIngles(q) {
    if (_trad[q] !== undefined) return _trad[q];
    var ctl = new AbortController(), tm = setTimeout(function () { ctl.abort() }, 3500), r = null;
    try {
      var x = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=" + encodeURIComponent(q), { signal: ctl.signal });
      if (x.ok) { var j = await x.json(); r = j[0].map(function (a) { return a[0] || "" }).join("").trim() || null }
    } catch (e) { r = null } finally { clearTimeout(tm) }
    if (r) _trad[q] = r;
    return r;
  }

  /* Tira o enquadramento da pergunta ("como faco para", "o que e", "explica-me"...) e deixa so o tema, antes de traduzir e comparar. */
  function limparPergunta(q) {
    var t = String(q || "").trim(), antes;
    do {
      antes = t;
      t = t.replace(/^(ol[aá]|oi|ei|boas|bom dia|boa tarde|boa noite)[,!.\s]+/i, "")
        .replace(/^(por favor|pf)[,\s]+/i, "")
        .replace(/^(diz[- ]?me|diga[- ]?me|explica[- ]?me|explique[- ]?me|ensina[- ]?me|mostra[- ]?me|podes (dizer|explicar|ensinar)( me)?|pode (dizer|explicar)( me)?|sabes|sabe|gostava de saber|queria saber|quero saber|preciso de saber|preciso de ajuda com|ajuda[- ]?me (com|a))[,\s]+/i, "")
        .replace(/^(o que (é|e|são|sao|significa|quer dizer)|que (é|e)|quem (é|e|foi)|como (faço|faco|fazer|se faz|posso|é que se|e que se)( para| a)?|para que serve|qual (é|e))\s+/i, "")
        .replace(/^(um|uma|o|a|os|as)\s+/i, "");
    } while (t !== antes);
    t = t.replace(/[?!.]+$/, "").replace(/\s+(por favor|pf)$/i, "").trim();
    return t.length >= 3 ? t : String(q || "").trim();
  }

  /* Resposta por significado, so no Lume X. Devolve true se respondeu. */
  async function responderPorSentido(q) {
    var nivel = window.lumeModeloAtual ? window.lumeModeloAtual() : "lume";
    if (nivel !== "x" || typeof window.lumeOnReply !== "function") return false;
    q = String(q || "").trim();
    if (q.length < 8 || q.length > 160) return false;
    if (estado === "parado") { carregar(); return false }     /* arranca em segundo plano; esta resposta segue como hoje */
    if (estado !== "pronto") return false;
    var en = await paraIngles(limparPergunta(q)); if (!en) return false;
    if (window.lumeAtualizarEtapa) { try { window.lumeAtualizarEtapa("A procurar por significado no que sei...") } catch (e) {} }
    var r = await conhecimento(en); if (!r) return false;
    var i = r.texto.indexOf(":"), titulo = i > 0 ? r.texto.slice(0, i).trim() : "", corpo = i > 0 ? r.texto.slice(i + 1).trim() : r.texto;
    window.lumeOnReply({ text: (titulo ? "Pelo que percebi, perguntas sobre **" + titulo + "**:\n\n" : "") + corpo });
    return true;
  }

  /* Liga ao despachante sem mexer nas linhas minificadas: corre depois dele, so se ele nao respondeu. */
  var D = window.LumeDespachante;
  if (D && typeof D.tentar === "function" && !D._emb) {
    var original = D.tentar; D._emb = true;
    D.tentar = async function (q) {
      var r = await original.apply(this, arguments);
      if (r) return r;
      try { return await responderPorSentido(q) } catch (e) { return false }
    };
  }

  window.LumeEmb = {
    estado: function () { return estado },
    pronto: function () { return estado === "pronto" },
    iniciar: carregar,            /* pede o carregamento em segundo plano */
    vetor: async function (t) { return (await vetores([t]))[0] },
    melhor: melhor,
    conhecimento: conhecimento,
    paraIngles: paraIngles,
    limparPergunta: limparPergunta,
    responderPorSentido: responderPorSentido,
    aquecer: async function () { try { var b = await carregarBlocos(); await vetoresComCache(b.map(chaveBloco)) } catch (e) {} },
    limiar: LIMIAR
  };
})();
