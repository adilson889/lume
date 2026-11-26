/* Mede a pesquisa por palavras do Lume Flash (LUME/pesquisa_palavras.js + LUME/pesquisa_flash.js), sem modelos nem rede.
   Uso: node LUME/tests/pesquisa_flash.js     (devolve erro se o Flash responder mal a perguntas fora de tema) */
"use strict";
var fs = require("fs"), path = require("path");
var P = require("../pesquisa_palavras.js");
var raiz = path.join(__dirname, "..");
var L = { responde: 10, sugere: 6 };
var blocos = [];
["bot/conhecimento_programacao.txt", "bot/aprendido.txt"].forEach(function (f) {
  fs.readFileSync(path.join(raiz, f), "utf8").split(/\n\s*\n/).forEach(function (t) { t = t.trim(); if (t.length > 30) blocos.push(t); });
});
var ix = P.indexar(blocos), D = JSON.parse(fs.readFileSync(path.join(__dirname, "perguntas_pesquisa.json"), "utf8"));
var porTitulo = {};
blocos.forEach(function (b, i) { var k = b.indexOf(":"), c = (k > 0 ? b.slice(0, k) : b).replace(/\s*\(.*$/, "").trim(), ch = P.termos(c).join(" "); if (ch && porTitulo[ch] === undefined) porTitulo[ch] = i; });
function ordenar(q) { return P.pontuar(ix, q).map(function (s, i) { return [s, i]; }).sort(function (a, b) { return b[0] - a[0]; }); }
function certo(i, aceites) { return aceites.some(function (t) { return blocos[i].indexOf(t) === 0; }); }
function temTermoNoTitulo(q, i) {
  var t = blocos[i], k = t.indexOf(":"), tt = P.termos(k > 0 ? t.slice(0, k) : t), qq = P.termos(q);
  return qq.some(function (w) { return tt.indexOf(w) >= 0; });
}
var r = { resp: 0, certas: 0, erradas: 0, sug: 0, sugCom: 0, calado: 0, foraResp: 0, foraSug: 0 };
D.in.forEach(function (p) {
  var o = ordenar(p.q), top = o[0], ch = P.termos(p.q).join(" ");
  if (porTitulo[ch] !== undefined) top = [99, porTitulo[ch]];
  if (top[0] >= L.responde) { r.resp++; if (certo(top[1], p.ok)) r.certas++; else { r.erradas++; console.log("ERRADA: " + p.q + " -> " + blocos[top[1]].split(":")[0]); } }
  else if (top[0] >= L.sugere && temTermoNoTitulo(p.q, top[1])) { r.sug++; if (o.slice(0, 3).some(function (x) { return certo(x[1], p.ok); })) r.sugCom++; }
  else r.calado++;
});
D.fora.forEach(function (p) {
  var o = ordenar(p.q), top = o[0], ch = P.termos(p.q).join(" ");
  if (porTitulo[ch] !== undefined) top = [99, porTitulo[ch]];
  if (top[0] >= L.responde) { r.foraResp++; console.log("FORA respondida: " + p.q + " -> " + blocos[top[1]].split(":")[0]); }
  else if (top[0] >= L.sugere && temTermoNoTitulo(p.q, top[1])) { r.foraSug++; console.log("FORA com sugestoes: " + p.q); }
});
console.log("\nFlash (so palavras), " + D.in.length + " perguntas de programacao:");
console.log("  responde " + r.resp + " (certas " + r.certas + ", erradas " + r.erradas + ")");
console.log("  sugere   " + r.sug + " (a certa estava nas 3 sugestoes em " + r.sugCom + ")");
console.log("  calado   " + r.calado + " (segue para a pesquisa na Wikipedia)");
console.log("  fora de tema (" + D.fora.length + "): respondidas " + r.foraResp + ", com sugestoes " + r.foraSug);
process.exit(r.foraResp > 0 ? 1 : 0);
