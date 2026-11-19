/* Lume - ponte do editor de apps (lado do chat).
   - Transforma respostas <div class="lume-app" data-lume-app="..."> em cartoes de ficheiro.
   - Ao tocar no cartao abre LUME/editor/editor.html numa iframe isolada em ecra inteiro.
   - Atende os pedidos do editor (copiar, descarregar, fechar) por postMessage.
   - O nome do cartao e curto (max. 24 letras). O chat pergunta o nome antes de criar o ficheiro
     (window.lumeNome) e a pessoa pode mudar o nome no lapis do cartao.
   Usa do chat: copiarTexto, mostrarToast, adicionarMensagem, window.baixarFicheiro (todos opcionais). */
(function(){
var VARS=["--bg","--bg2","--bg3","--card","--text","--border","--muted","--r","--on"];
var IC='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10 13l-2 2 2 2M14 13l2 2-2 2"/></svg>';
var IL='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
var css=document.createElement("style");
css.textContent=".lume-arquivo{display:flex;align-items:center;gap:10px;width:100%;max-width:340px;box-sizing:border-box;padding:8px 8px 8px 10px;border:1px solid var(--border,#c9ceb8);border-radius:14px;background:var(--card,#fff);color:var(--text,#1d2410);cursor:pointer;-webkit-tap-highlight-color:transparent}"
+".lume-arquivo:active{transform:scale(.98)}"
+".lume-arquivo .la-ic{flex:none;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--r,#4a6a10);color:var(--on,#fff)}"
+".lume-arquivo .la-ic svg{width:20px;height:20px}"
+".lume-arquivo .la-t{flex:1;min-width:0}"
+".lume-arquivo .la-n{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
+".lume-arquivo .la-s{display:block;font-size:12px;color:var(--muted,#5c6b3a);margin-top:1px}"
+".lume-arquivo .la-in{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:14px;font-weight:600;padding:2px 6px;border:1px solid var(--r,#4a6a10);border-radius:8px;background:var(--bg,#fff);color:var(--text,#1d2410);outline:none}"
+".lume-arquivo .la-ed{flex:none;width:34px;height:34px;padding:0;border:0;border-radius:10px;background:transparent;color:var(--muted,#5c6b3a);display:flex;align-items:center;justify-content:center;cursor:pointer}"
+".lume-arquivo .la-ed:active{background:var(--bg2,#eef0e2)}"
+"#lume-ed-frame{position:fixed;inset:0;z-index:9990;width:100%;height:100%;border:0;background:var(--bg,#f6f7ee)}";
document.head.appendChild(css);
function toast(t){if(typeof mostrarToast==="function")mostrarToast(t)}
function tituloDe(h){var m=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(h);var t=m?m[1].trim():"";return t||"app"}
function semAc(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
/* nome valido e curto: letras, numeros e hifens, no maximo 24 antes de .html */
function limparNome(s){
 var b=semAc(s).replace(/\.html?$/,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,24).replace(/-+$/,"");
 return b?b+".html":"";
}
/* nome automatico: ate 2 palavras do titulo, sem "desenho", "de", "uma", etc. */
function nomeFicheiro(h){
 var p=semAc(tituloDe(h)).replace(/[^a-z0-9]+/g," ").trim().split(" ").filter(function(w){return w.length>2&&w!=="desenho"&&!/^(uma|para|com|das|dos)$/.test(w)});
 return limparNome(p.slice(0,2).join("-"))||"pagina.html";
}
function tema(){
 var cs=getComputedStyle(document.body),o={};
 VARS.forEach(function(v){var x=cs.getPropertyValue(v).trim();if(x)o[v]=x});
 return o;
}
var atual=null;
function fechar(){if(atual){atual.frame.remove();atual=null}}
function abrir(h,opc){
 fechar();
 var f=document.createElement("iframe");
 f.id="lume-ed-frame";f.setAttribute("sandbox","allow-scripts");f.src="LUME/editor/editor.html";
 document.body.appendChild(f);
 atual=Object.assign({frame:f,html:h,nome:nomeFicheiro(h),lingua:"html",site:true,guardar:false,aoGuardar:null},opc||{});
}
function enviarParaEditor(){
 if(!atual)return;
 atual.frame.contentWindow.postMessage({lumeAbrir:true,html:atual.html,nome:atual.nome,lingua:atual.lingua,site:atual.site,guardar:atual.guardar,tema:tema()},"*");
}
window.addEventListener("message",function(e){
 var d=e.data;
 if(!atual||!d||typeof d.lumeEd!=="string"||e.source!==atual.frame.contentWindow)return;
 if(d.lumeEd==="pronto")enviarParaEditor();
 else if(d.lumeEd==="fechar")fechar();
 else if(d.lumeEd==="guardar"&&typeof d.texto==="string"){if(atual.aoGuardar)atual.aoGuardar(d.texto);toast("Guardado")}
 else if(d.lumeEd==="copiar"&&typeof d.texto==="string"){if(typeof copiarTexto==="function")copiarTexto(d.texto);toast(String(d.msg||"Copiado"))}
 else if(d.lumeEd==="baixar"&&typeof d.conteudo==="string"){
  if(typeof window.baixarFicheiro==="function")window.baixarFicheiro(String(d.nome||"app.html"),d.conteudo,String(d.mime||"text/plain"));else toast("Descarregar indisponível")}
});

/* O editor segue o tema da app (claro/escuro), tambem quando muda com o editor aberto. */
function sincronizarTema(){
 if(atual&&atual.frame.contentWindow)atual.frame.contentWindow.postMessage({lumeTema:true,tema:tema()},"*");
}
new MutationObserver(sincronizarTema).observe(document.documentElement,{attributes:true,attributeFilter:["class","data-theme"]});
new MutationObserver(sincronizarTema).observe(document.body,{attributes:true,attributeFilter:["class","data-theme"]});

/* ---------- ficheiros anexados: tocar no quadrado abre-o no editor e pode ser editado ---------- */
var LINGUAS={html:"html",htm:"html",css:"css",js:"js",json:"js",ts:"js",java:"js",kt:"js",c:"js",cpp:"js",cs:"js",go:"js",rs:"js",php:"js",swift:"js"};
var CHAVE="lume_anexos";
function lerReg(){try{return JSON.parse(localStorage.getItem(CHAVE)||"[]")}catch(e){return[]}}
function gravarReg(l){try{localStorage.setItem(CHAVE,JSON.stringify(l.slice(-8)))}catch(e){}}
window.registarAnexo=function(a){
 if(!a||!a.id||a.tipo!=="texto"||typeof a.dados!=="string")return;
 var l=lerReg().filter(function(x){return x.id!==a.id});l.push({id:a.id,nome:a.nome,dados:a.dados});gravarReg(l);
};
function abrirAnexo(a,aoGuardar){
 var ex=/\.([A-Za-z0-9]+)$/.exec(a.nome||"");ex=ex?ex[1].toLowerCase():"";
 var l=LINGUAS[ex]||"texto";
 abrir(a.dados,{nome:a.nome||"ficheiro.txt",lingua:l,site:l==="html",guardar:true,aoGuardar:aoGuardar});
}
document.addEventListener("click",function(e){
 var c=e.target.closest&&e.target.closest(".anexo-card");
 if(!c||e.target.closest(".remover"))return;
 var chip=c.closest("#anexo-chip");
 if(chip){
  var a=window.anexo;if(!a||a.tipo!=="texto"||typeof a.dados!=="string")return;
  e.stopPropagation();e.preventDefault();
  abrirAnexo(a,function(t){a.dados=t;if(typeof window.atualizarBotaoEnviar==="function")window.atualizarBotaoEnviar()});
  return;
 }
 var id=c.getAttribute("data-anexo-id");if(!id)return;
 var r=lerReg().filter(function(x){return x.id===id})[0];
 e.stopPropagation();e.preventDefault();
 if(!r){toast("O conteúdo deste anexo já não está disponível");return}
 abrirAnexo({nome:r.nome,dados:r.dados,tipo:"texto"},function(t){r.dados=t;var l=lerReg().filter(function(x){return x.id!==id});l.push(r);gravarReg(l)});
},true);

/* ---------- nome do ficheiro: o chat pergunta e sugere um nome curto antes de criar o ficheiro ---------- */
var RUIDO=/^(desenha|desenhe|desenhar|faz|faca|fazer|cria|crie|criar|gera|gere|gerar|mostra|mostrar|quero|preciso|favor|uma|para|com|dos|das|por|num|que|meu|minha|ficheiro|arquivo|pagina|html|codigo|desenho|svg)$/;
function sugerido(p){
 var w=semAc(p).split(/[^a-z0-9]+/).filter(function(x){return /^[a-z]{3,}$/.test(x)&&!RUIDO.test(x)});
 var b=(w.slice(0,2).join("-")||"desenho").slice(0,24).replace(/-+$/,"");
 return b+".html";
}
/* devolve o nome escolhido, ou "" se a mensagem nao parece um nome (ex.: e outro pedido) */
function daResposta(e,sug){
 var s=semAc(e).replace(/\s+/g," ").trim();
 if(!s)return "";
 if(/^(sim|ok|pode ser|esse|esse mesmo|tanto faz|qualquer|qualquer um|deixa|usa esse|a sugestao|o sugerido)$/.test(s))return sug;
 if(s.split(" ").length>3||s.length>30||/\b(desenha|desenhe|faz|faca|cria|crie|calcula|gera|gere|mostra|quero|preciso|como|qual|quanto)\b/.test(s))return "";
 return limparNome(s);
}
function perguntar(sug){
 if(typeof adicionarMensagem!=="function")return;
 var p="Que nome queres dar ao ficheiro? Toca na sugestão ou escreve outro nome curto.";
 adicionarMensagem(p,"sistema",true,'<div class="ask-intro">'+p+'</div><div class="ask-opcoes"><div class="ask-opcao" role="button" data-botql-ask="'+sug+'">'+sug+'</div></div>');
}
window.lumeNome={pendente:null,sugerido:sugerido,daResposta:daResposta,perguntar:perguntar};

function montar(el){
 if(el.dataset.pronto)return;el.dataset.pronto="1";
 var h;try{h=decodeURIComponent(el.dataset.lumeApp)}catch(x){return}
 var nome=limparNome(el.dataset.nome||window.lumeNomeFicheiro||"")||nomeFicheiro(h);
 window.lumeNomeFicheiro="";
 var c=document.createElement("div");c.className="lume-arquivo";c.setAttribute("role","button");c.tabIndex=0;
 c.innerHTML='<span class="la-ic">'+IC+'</span><span class="la-t"><span class="la-n"></span><span class="la-s">Página HTML - toca para abrir</span></span><button type="button" class="la-ed" aria-label="Mudar nome">'+IL+'</button>';
 var n=c.querySelector(".la-n");n.textContent=nome;
 c.addEventListener("click",function(e){
  if(e.target.closest(".la-ed,.la-in"))return;
  abrir(h,{nome:nome});
 });
 c.addEventListener("keydown",function(e){
  if(e.target!==c)return;
  if(e.key==="Enter"||e.key===" "){e.preventDefault();abrir(h,{nome:nome})}
 });
 c.querySelector(".la-ed").addEventListener("click",function(e){
  e.stopPropagation();
  if(c.querySelector(".la-in"))return;
  var inp=document.createElement("input");
  inp.type="text";inp.className="la-in";inp.maxLength=30;inp.value=nome.replace(/\.html$/,"");
  inp.setAttribute("aria-label","Nome do ficheiro");
  n.style.display="none";n.parentNode.insertBefore(inp,n);inp.focus();inp.select();
  var feito=false;
  function fim(guardar){
   if(feito)return;feito=true;
   if(guardar){var v=limparNome(inp.value);if(v)nome=v}
   n.textContent=nome;n.style.display="";inp.remove();
  }
  inp.addEventListener("keydown",function(k){
   if(k.key==="Enter"){k.preventDefault();fim(true)}
   else if(k.key==="Escape"){fim(false)}
  });
  inp.addEventListener("blur",function(){fim(true)});
 });
 el.appendChild(c);
}
/* Respostas XLang que trazem uma pagina completa: <pre data-ficheiro><code>...</code></pre> vira o cartao do ficheiro. */
function converterPaginas(){
 document.querySelectorAll("pre[data-ficheiro]").forEach(function(pre){
  var texto=pre.textContent||"";pre.removeAttribute("data-ficheiro");
  if(!/<html[\s>]/i.test(texto))return;
  var card=document.createElement("div");card.className="lume-app";card.setAttribute("data-lume-app",encodeURIComponent(texto));
  pre.parentNode.replaceChild(card,pre);
 });
}
function varrer(){converterPaginas();document.querySelectorAll("div.lume-app[data-lume-app]").forEach(montar)}
new MutationObserver(varrer).observe(document.body,{childList:true,subtree:true});
varrer();
})();
