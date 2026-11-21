/* Service worker do Lume (PWA).
   Casca da app e ficheiros do bot ficam guardados para o Lume abrir sem ligacao.
   Estrategias:
   - navegacao (index.html): rede primeiro (4 s), depois a copia guardada, depois offline.html
   - codigo do proprio site (js, html, css): rede primeiro (4 s), depois a copia guardada
   - ficheiros do bot (LUME/bot, json, txt, sql): rede primeiro (5 s), depois a copia guardada
   - imagens, icones, fontes e manifest: copia guardada e atualiza em segundo plano
   - bibliotecas externas (marked, DOMPurify, highlight.js, motor BotQL): copia guardada e atualiza em segundo plano
   - tudo o resto (API, pesquisa, POST, mobile.html): vai direto a rede, sem passar pelo cache
   Ao publicar uma versao nova: acrescentar ficheiros novos do site a NUCLEO e, se quiseres limpar as copias
   antigas de uma vez, mudar VERSAO. Os ficheiros do bot sao descobertos sozinhos em LUME/bot/arquivos.json. */
"use strict";

var VERSAO = "0.5.30";
var P = "lume-";
var C_SHELL = P + "shell-" + VERSAO;
var C_DADOS = P + "dados-" + VERSAO;
var C_LIBS = P + "libs-1";
var C_MEDIA = P + "media-2";
var ATUAIS = [C_SHELL, C_DADOS, C_LIBS, C_MEDIA];
var BASE = new URL("./", self.registration.scope);

var NUCLEO = [
  "./",
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "LUME/formatador.js",
  "LUME/dialogo.js",
  "LUME/despachante.js",
  "LUME/math.js",
  "LUME/vendor/katex/katex.min.js",
  "LUME/vendor/katex/katex.min.css",
  "LUME/editor/lume-editor.js",
  "LUME/vendor/nlp.min.js",
  "LUME/assets/icons/icon-192.png",
  "LUME/assets/icons/icon-512.png"
];
var OPCIONAL = [
  "LUME/definicoes.html",
  "LUME/VERSION",
  "LUME/vendor/katex/fonts/KaTeX_AMS-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Main-Bold.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Main-Italic.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Main-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Math-Italic.woff2",
  "LUME/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2",
  "LUME/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2",
  "LUME/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Script-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Size1-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Size2-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Size3-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Size4-Regular.woff2",
  "LUME/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2",
  "LUME/assets/icons/favicon-32.png",
  "LUME/assets/icons/apple-touch-icon.png"
];
var CDN = [
  "https://cdn.jsdelivr.net/npm/marked@12/marked.min.js",
  "https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js",
  "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11/highlight.min.js",
  "https://botql-edidor.vercel.app/botql.browser.js"
];
var HOSTS_CDN = { "cdn.jsdelivr.net": 1, "unpkg.com": 1, "botql-edidor.vercel.app": 1 };

function u(p) { return new URL(p, BASE).href; }
function comTempo(p, ms) {
  return new Promise(function (res, rej) {
    var t = setTimeout(function () { rej(new Error("tempo")); }, ms);
    p.then(function (r) { clearTimeout(t); res(r); }, function (e) { clearTimeout(t); rej(e); });
  });
}
function guardar(cache, chave, resp) {
  try { return cache.put(chave, resp).catch(function () {}); } catch (e) { return Promise.resolve(); }
}
/* tenta CORS (resposta legivel); se o servidor nao deixar, cai para resposta opaca (serve para <script>) */
async function buscarCors(url) {
  try {
    var r = await fetch(url, { mode: "cors", credentials: "omit" });
    if (r && r.ok) return r;
  } catch (e) {}
  return fetch(new Request(url, { mode: "no-cors" }));
}
async function limitar(nome, max) {
  try {
    var c = await caches.open(nome), ks = await c.keys();
    for (var i = 0; i < ks.length - max; i++) await c.delete(ks[i]);
  } catch (e) {}
}

self.addEventListener("install", function (ev) {
  ev.waitUntil((async function () {
    var c = await caches.open(C_SHELL);
    await Promise.all(NUCLEO.map(function (p) { return c.add(new Request(u(p), { cache: "reload" })); }));
    await Promise.all(OPCIONAL.map(function (p) {
      return c.add(new Request(u(p), { cache: "reload" })).catch(function () {});
    }));
    /* ficheiros do bot: a lista vem de arquivos.json, por isso ficheiros novos entram sem mexer aqui */
    try {
      var r = await fetch(u("LUME/bot/arquivos.json"), { cache: "reload" });
      if (r.ok) {
        var copia = r.clone(), lista = await r.json(), d = await caches.open(C_DADOS);
        await guardar(d, u("LUME/bot/arquivos.json"), copia);
        await Promise.all(lista.map(function (n) {
          return d.add(new Request(u("LUME/bot/" + n), { cache: "reload" })).catch(function () {});
        }));
      }
    } catch (e) {}
    /* bibliotecas externas: melhor esforco, nao impede a instalacao */
    var l = await caches.open(C_LIBS);
    await Promise.all(CDN.map(function (x) {
      return buscarCors(x).then(function (resp) {
        if (resp && (resp.ok || resp.type === "opaque")) return guardar(l, x, resp);
      }).catch(function () {});
    }));
  })());
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil((async function () {
    var ks = await caches.keys();
    await Promise.all(ks.filter(function (k) {
      return k.indexOf(P) === 0 && ATUAIS.indexOf(k) < 0;
    }).map(function (k) { return caches.delete(k); }));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

/* navegacao: rede primeiro, com tempo limite, e a casca guardada como reserva */
function mesmaPagina(url) {
  var x = new URL(url);
  return x.origin === BASE.origin && (x.pathname === BASE.pathname || x.pathname === BASE.pathname + "index.html");
}
async function navegar(ev) {
  var req = ev.request, c = await caches.open(C_SHELL), pre = null, chave = u("index.html");
  try { pre = await ev.preloadResponse; } catch (e) {}
  var rede = (pre ? Promise.resolve(pre) : fetch(req)).then(function (r) {
    if (r && r.ok && mesmaPagina(req.url)) guardar(c, chave, r.clone());
    return r;
  });
  ev.waitUntil(rede.catch(function () {}));
  try {
    return await comTempo(rede, 4000);
  } catch (e) {
    return (await c.match(chave)) || (await c.match(u("./"))) || (await c.match(u("offline.html"))) || Response.error();
  }
}

/* rede primeiro com tempo limite; sem rede usa a copia guardada */
async function redePrimeiro(ev, nome, ms) {
  var req = ev.request, c = await caches.open(nome);
  var rede = fetch(req).then(function (r) {
    if (r && r.ok && r.type === "basic" && r.status === 200) guardar(c, req, r.clone());
    return r;
  });
  ev.waitUntil(rede.catch(function () {}));
  try {
    return await comTempo(rede, ms);
  } catch (e) {
    var hit = await c.match(req);
    if (hit) return hit;
    try { return await rede; } catch (e2) { return Response.error(); }
  }
}

/* copia guardada primeiro e atualiza em segundo plano */
async function midia(ev) {
  var req = ev.request, c = await caches.open(C_MEDIA), hit = await c.match(req);
  var rede = fetch(req).then(function (r) {
    if (r && r.ok && r.type === "basic" && r.status === 200) { guardar(c, req, r.clone()); limitar(C_MEDIA, 80); }
    return r;
  }).catch(function () { return null; });
  ev.waitUntil(rede);
  if (hit) return hit;
  return (await rede) || Response.error();
}
async function bibliotecas(ev) {
  var url = ev.request.url, c = await caches.open(C_LIBS), hit = await c.match(url);
  var rede = buscarCors(url).then(function (r) {
    if (r && (r.ok || r.type === "opaque")) guardar(c, url, r.clone());
    return r;
  }).catch(function () { return null; });
  ev.waitUntil(rede);
  if (hit) return hit;
  return (await rede) || Response.error();
}

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (HOSTS_CDN[url.hostname] && (req.destination === "script" || /\.(js|css)$/.test(url.pathname))) {
      ev.respondWith(bibliotecas(ev));
    }
    return;
  }
  var p = url.pathname;
  if (/\/mobile\.html$/.test(p) || p.indexOf("/api/") === 0) return;
  if (req.mode === "navigate") { ev.respondWith(navegar(ev)); return; }
  if (/\/LUME\/bot\//.test(p) || /\.(json|txt|sql)$/.test(p)) { ev.respondWith(redePrimeiro(ev, C_DADOS, 5000)); return; }
  if (/\.(png|jpe?g|webp|svg|ico|gif|woff2?|ttf|webmanifest)$/.test(p)) { ev.respondWith(midia(ev)); return; }
  if (/\.(m?js|html|css)$/.test(p) || /\/$/.test(p)) { ev.respondWith(redePrimeiro(ev, C_SHELL, 4000)); return; }
});

self.addEventListener("message", function (ev) {
  var d = ev.data || {};
  if (d.tipo === "SKIP_WAITING") self.skipWaiting();
  else if (d.tipo === "VERSAO" && ev.source) ev.source.postMessage({ tipo: "VERSAO", versao: VERSAO });
});
