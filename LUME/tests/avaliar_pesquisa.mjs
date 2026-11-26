/* Compara metodos de pesquisa com o MiniLM que ja esta no repo, em Node (nao altera o site).
   Preparacao (fora do repo):  mkdir /tmp/emb && cd /tmp/emb && npm init -y && npm i @huggingface/transformers --ignore-scripts
   Uso (na pasta /tmp/emb):    node /caminho/para/LUME/tests/avaliar_pesquisa.mjs
   Metodos: MiniLM com a pergunta em portugues, MiniLM com a traduzida (o que o X faz hoje), palavras, e os hibridos.
   Mostra, por metodo, certas/erradas/falsos com o limiar escolhido numa metade das perguntas e medido na outra. */
import { createRequire } from "module";
import { pathToFileURL, fileURLToPath } from "url";
import fs from "fs";
import path from "path";
const aqui = path.dirname(fileURLToPath(import.meta.url)), raiz = path.join(aqui, "..");
const req = createRequire(process.cwd() + "/");
const T = await import(pathToFileURL(req.resolve("@huggingface/transformers")).href);
const P = createRequire(import.meta.url)(path.join(raiz, "pesquisa_palavras.js"));
T.env.allowRemoteModels = false; T.env.allowLocalModels = true; T.env.localModelPath = path.join(raiz, "ia") + "/";
const ex = await T.pipeline("feature-extraction", "minilm", { dtype: "q8" });
async function vec(ts) { const o = []; for (let i = 0; i < ts.length; i += 16) { const l = ts.slice(i, i + 16).map(t => t.slice(0, 600)); const r = await ex(l, { pooling: "mean", normalize: true }); const d = r.dims[1]; for (let j = 0; j < l.length; j++) o.push(r.data.slice(j * d, (j + 1) * d)); } return o; }
const cos = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const D = JSON.parse(fs.readFileSync(path.join(aqui, "perguntas_pesquisa.json"), "utf8"));
const blocos = [];
for (const f of ["bot/conhecimento_programacao.txt", "bot/aprendido.txt"]) fs.readFileSync(path.join(raiz, f), "utf8").split(/\n\s*\n/).forEach(t => { t = t.trim(); if (t.length > 30) blocos.push(t); });
const V = await vec(blocos.map(b => b.slice(0, 220))), ix = P.indexar(blocos);
const qPT = await vec(D.in.map(p => p.q)), qEN = await vec(D.in.map(p => p.en)), fPT = await vec(D.fora.map(p => p.q)), fEN = await vec(D.fora.map(p => p.en));
const certo = (i, ok) => ok.some(t => blocos[i].indexOf(t) === 0);
const embPT = (k, f) => V.map(v => cos((f ? fPT : qPT)[k], v)), embEN = (k, f) => V.map(v => cos((f ? fEN : qEN)[k], v));
const lex = (k, f) => P.pontuar(ix, (f ? D.fora : D.in)[k].q);
const hib = e => (k, f) => P.misturar(lex(k, f), e(k, f));
function cv(nome, fn) {
  const L = D.in.map((p, k) => { const o = fn(k, false).map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]); return { s: o[0][0], ok: certo(o[0][1], p.ok), k }; });
  const F = D.fora.map((p, k) => ({ s: Math.max(...fn(k, true)), k }));
  let C = 0, E = 0, X = 0, N = 0;
  for (const m of [0, 1]) {
    const tr = L.filter(x => x.k % 2 === m), te = L.filter(x => x.k % 2 !== m), ftr = F.filter(x => x.k % 2 === m), fte = F.filter(x => x.k % 2 !== m);
    let best = null;
    for (const th of [...new Set(tr.map(x => x.s).concat(ftr.map(x => x.s)))].sort((a, b) => a - b)) { const r = tr.filter(x => x.s >= th), c = r.filter(x => x.ok).length, p = c - 2 * (r.length - c) - 3 * ftr.filter(x => x.s >= th).length; if (!best || p > best.p) best = { th, p }; }
    const r = te.filter(x => x.s >= best.th); C += r.filter(x => x.ok).length; E += r.length - r.filter(x => x.ok).length; X += fte.filter(x => x.s >= best.th).length; N += te.length;
  }
  console.log(nome.padEnd(42) + "certas " + C + "/" + N + ", erradas " + E + ", falsos " + X + "/" + D.fora.length);
}
cv("MiniLM, pergunta em PT", embPT);
cv("MiniLM, pergunta traduzida (X hoje)", embEN);
cv("So palavras", lex);
cv("Palavras + MiniLM (PT, sem rede)", hib(embPT));
cv("Palavras + MiniLM (traduzida)", hib(embEN));
