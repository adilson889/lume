/* Lume - ponte do editor de apps (lado do chat).
   - Transforma respostas <div class="lume-app" data-lume-app="..."> em cartoes de ficheiro.
   - Ao tocar no cartao abre LUME/editor/editor.html numa iframe isolada em ecra inteiro.
   - Atende os pedidos do editor (copiar, descarregar, fechar) por postMessage.
   Usa do chat: copiarTexto, mostrarToast, window.baixarFicheiro (todos opcionais). */
(function(){
var VARS=["--bg","--card","--text","--border","--muted","--r","--on","--code-bg"];
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
function abrir(h){
 fechar();
 var f=document.createElement("iframe");
 f.id="lume-ed-frame";f.setAttribute("sandbox","allow-scripts");f.src="LUME/editor/editor.html";
 document.body.appendChild(f);
 atual={frame:f,html:h,nome:nomeFicheiro(h)};
}
function enviarParaEditor(){
 if(!atual)return;
 atual.frame.contentWindow.postMessage({lumeAbrir:true,html:atual.html,nome:atual.nome,tema:tema()},"*");
}
window.addEventListener("message",function(e){
 var d=e.data;
 if(!atual||!d||typeof d.lumeEd!=="string"||e.source!==atual.frame.contentWindow)return;
 if(d.lumeEd==="pronto")enviarParaEditor();
 else if(d.lumeEd==="fechar")fechar();
 else if(d.lumeEd==="copiar"&&typeof d.texto==="string"){if(typeof copiarTexto==="function")copiarTexto(d.texto);toast(String(d.msg||"Copiado"))}
 else if(d.lumeEd==="baixar"&&typeof d.conteudo==="string"){
  if(typeof window.baixarFicheiro==="function")window.baixarFicheiro(String(d.nome||"app.html"),d.conteudo,String(d.mime||"text/plain"));else toast("Descarregar indisponível")}
});
function montar(el){
 if(el.dataset.pronto)return;el.dataset.pronto="1";
 var h;try{h=decodeURIComponent(el.dataset.lumeApp)}catch(x){return}
 var c=document.createElement("button");c.type="button";c.className="lume-arquivo";
 c.innerHTML='<span class="la-ic">'+IC+'</span><span><span class="la-n"></span><span class="la-s">Página HTML - toca para abrir</span></span>';
 c.querySelector(".la-n").textContent=nomeFicheiro(h);
 c.addEventListener("click",function(){abrir(h)});
 el.appendChild(c);
}
function varrer(){document.querySelectorAll("div.lume-app[data-lume-app]").forEach(montar)}
new MutationObserver(varrer).observe(document.body,{childList:true,subtree:true});
varrer();
})();
