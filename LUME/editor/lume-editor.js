/* Lume - ponte do editor de apps (lado do chat).
   - Transforma respostas <div class="lume-app" data-lume-app="..."> em cartoes de ficheiro.
   - Ao tocar no cartao abre LUME/editor/editor.html numa iframe isolada em ecra inteiro.
   - Atende os pedidos do editor (copiar, descarregar, fechar) por postMessage.
   Usa do chat: copiarTexto, mostrarToast, window.baixarFicheiro (todos opcionais). */
(function(){
var VARS=["--bg","--bg2","--bg3","--card","--text","--border","--muted","--r","--on"];
var IC='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10 13l-2 2 2 2M14 13l2 2-2 2"/></svg>';
var css=document.createElement("style");
css.textContent=".lume-arquivo{display:flex;align-items:center;gap:12px;width:100%;max-width:420px;padding:12px 14px;border:1px solid var(--border,#c9ceb8);border-radius:16px;background:var(--card,#fff);color:var(--text,#1d2410);font:inherit;text-align:left;cursor:pointer}"
+".lume-arquivo:active{transform:scale(.98)}"
+".lume-arquivo .la-ic{flex:none;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--r,#4a6a10);color:var(--on,#fff)}"
+".lume-arquivo .la-n{display:block;font-size:15px;font-weight:600;word-break:break-all}"
+".lume-arquivo .la-s{display:block;font-size:12.5px;color:var(--muted,#5c6b3a);margin-top:2px}"
+"#lume-ed-frame{position:fixed;inset:0;z-index:9990;width:100%;height:100%;border:0;background:var(--bg,#f6f7ee)}";
document.head.appendChild(css);
function toast(t){if(typeof mostrarToast==="function")mostrarToast(t)}
function tituloDe(h){var m=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(h);var t=m?m[1].trim():"";return t||"app"}
function nomeFicheiro(h){return(tituloDe(h).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)||"app")+".html"}
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
function montar(el){
 if(el.dataset.pronto)return;el.dataset.pronto="1";
 var h;try{h=decodeURIComponent(el.dataset.lumeApp)}catch(x){return}
 var c=document.createElement("button");c.type="button";c.className="lume-arquivo";
 c.innerHTML='<span class="la-ic">'+IC+'</span><span><span class="la-n"></span><span class="la-s">Página HTML - toca para abrir</span></span>';
 c.querySelector(".la-n").textContent=nomeFicheiro(h);
 c.addEventListener("click",function(){abrir(h)});
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
