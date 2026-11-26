/* Lume Flash: responde a perguntas de programacao pela pesquisa por palavras (LUME/pesquisa_palavras.js).
   Nao descarrega modelos nem usa rede: so le dois ficheiros de texto que ja estao no site
   (bot/conhecimento_programacao.txt e bot/aprendido.txt). Corre depois do despachante e antes da pesquisa
   na Wikipedia, so no Flash, e so quando o despachante nao respondeu. O Lume X continua com o embeddings.js.
   Regra: ou tem a certeza (responde), ou propoe ate 3 opcoes para tocar, ou fica calado e segue como antes. */
(function () {
  "use strict";
  var P = window.LumePalavras; if (!P) return;
  var BASE = new URL("./", document.currentScript ? document.currentScript.src : location.href).href; /* .../LUME/ */
  var RESPONDE = 10, SUGERE = 6;   /* medidos em LUME/tests/pesquisa_flash.js */
  var blocos = null, indice = null, porTitulo = null;

  async function carregar() {
    if (blocos) return blocos;
    var b = [];
    for (var f of ["bot/conhecimento_programacao.txt", "bot/aprendido.txt"]) {
      try {
        var r = await fetch(BASE + f); if (!r.ok) continue;
        (await r.text()).split(/\n\s*\n/).forEach(function (t) { t = t.trim(); if (t.length > 30) b.push(t); });
      } catch (e) {}
    }
    blocos = b; indice = P.indexar(b); porTitulo = {};
    b.forEach(function (x, i) { var k = P.termos(curto(x)).join(" "); if (k && porTitulo[k] === undefined) porTitulo[k] = i; });
    return b;
  }
  function dar(bl, i) {
    var t = titulo(bl[i]), c = bl[i].slice(t ? t.length + 1 : 0).trim();
    window.lumeOnReply({ text: (t ? "**" + t + "**\n\n" : "") + c });
    return true;
  }
  function titulo(b) { var i = b.indexOf(":"); return i > 0 ? b.slice(0, i).trim() : ""; }
  function curto(b) { return titulo(b).replace(/\s*\(.*$/, "").trim(); }
  function temTermoNoTitulo(q, b) {
    var tt = P.termos(titulo(b) || b.slice(0, 40)), qq = P.termos(q);
    return qq.some(function (w) { return tt.indexOf(w) >= 0; });
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  async function responder(q) {
    var nivel = window.lumeModeloAtual ? window.lumeModeloAtual() : "lume";
    if (nivel !== "flash" || typeof window.lumeOnReply !== "function") return false;
    q = String(q || "").trim();
    if (q.length < 8 || q.length > 200) return false;
    var bl = await carregar(); if (!bl.length) return false;
    /* O nome exato de um topico ("o que e um ciclo for") responde sempre: e o que as opcoes sugeridas enviam. */
    var chave = P.termos(q).join(" ");
    if (chave && porTitulo[chave] !== undefined) return dar(bl, porTitulo[chave]);
    var ord = P.pontuar(indice, q).map(function (s, i) { return [s, i]; }).sort(function (a, b) { return b[0] - a[0]; });
    var top = ord[0];
    if (top[0] >= RESPONDE) return dar(bl, top[1]);
    if (top[0] >= SUGERE && temTermoNoTitulo(q, bl[top[1]])) {
      var vistos = {}, op = [];
      ord.slice(0, 3).forEach(function (x) {
        var n = curto(bl[x[1]]);
        if (x[0] >= SUGERE * 0.6 && n && !vistos[n]) { vistos[n] = 1; op.push(n); }
      });
      if (op.length) {
        var html = '<div class="ask-intro">Não tenho a certeza do que queres saber. Queres dizer:</div><div class="ask-opcoes">' +
          op.map(function (n) { return '<div class="ask-opcao" role="button" data-botql-ask="O que é ' + esc(n) + '">' + esc(n) + '</div>'; }).join("") + '</div>';
        window.lumeOnReply({ text: "", html: html });
        return true;
      }
    }
    return false;
  }

  /* Liga ao despachante como o embeddings.js: corre depois dele, so se ele nao respondeu. */
  var D = window.LumeDespachante;
  if (D && typeof D.tentar === "function" && !D._flash) {
    var original = D.tentar; D._flash = true;
    D.tentar = async function (q) {
      var r = await original.apply(this, arguments);
      if (r) return r;
      try { return await responder(q); } catch (e) { return false; }
    };
  }
  window.LumePesquisaFlash = { responder: responder, limiares: { responde: RESPONDE, sugere: SUGERE } };
})();
