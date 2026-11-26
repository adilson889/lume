/* Lume - ambiente de projetos (lado do chat).
   - Os dados do projeto vivem aqui, na pagina do chat, nos modulos XLang xlang-projeto e xlang-editar
     (localStorage, chaves xlangproj:*). O editor (LUME/editor/editor.html) e so uma janela: mostra os
     ficheiros e pede alteracoes por postMessage.
   - Uso: window.lumeProjeto.abrir("Loja") abre o projeto no editor (cria-o se nao existir).
          window.lumeProjeto.escrever("app.xl", texto) cria ou substitui um ficheiro do projeto aberto.
   - Quando algo muda (o bot escreve, o usuario guarda), o editor aberto atualiza sozinho.
   - Executar um ficheiro .xl corre-o com o interpretador XLang numa folha por cima do editor.
   Usa do chat (todos opcionais): carregarXlang, xlangClasse, carregarScript, mostrarToast, copiarTexto.
   Os modulos sao carregados de MODULOS_BASE; depois de enviares os modulos para o repositorio
   HTMLx-lang, muda MODULOS_COMMIT para o hash do commit que os contem (evita a cache do jsDelivr). */
(function(){
var MODULOS_COMMIT="884532a3e7738731557e577fbaf3ab212ffa0d80";
var MODULOS_BASE="https://cdn.jsdelivr.net/gh/adilson889/HTMLx-lang@"+MODULOS_COMMIT+"/modules/";
var VARS=["--bg","--bg2","--bg3","--card","--text","--border","--muted","--r","--on"];

function toast(t){if(typeof mostrarToast==="function")mostrarToast(t)}
function tema(){var cs=getComputedStyle(document.body),o={};VARS.forEach(function(v){var x=cs.getPropertyValue(v).trim();if(x)o[v]=x});return o}
function carregar(url){
 if(typeof carregarScript==="function")return carregarScript(url);
 return new Promise(function(ok,erro){var s=document.createElement("script");s.src=url;s.onload=function(){ok(url)};s.onerror=function(){erro(new Error("falha ao carregar "+url))};document.head.appendChild(s)});
}

/* ---------- modulos ---------- */
var pronto=null;
function garantir(){
 if(window.XLangProjeto&&window.XLangProjeto.todos&&window.XLangRegistry&&window.XLangRegistry.has("edTrocar"))return Promise.resolve();
 if(!pronto){
  pronto=(typeof carregarXlang==="function"?carregarXlang():Promise.resolve())
   .then(function(){return window.XLangProjeto?0:carregar(MODULOS_BASE+"xlang-projeto.js")})
   .then(function(){return window.XLangRegistry&&window.XLangRegistry.has("edTrocar")?0:carregar(MODULOS_BASE+"xlang-editar.js")})
   .then(function(){if(!window.XLangProjeto)throw new Error("o modulo xlang-projeto nao carregou")});
  pronto.catch(function(){pronto=null});
 }
 return pronto;
}

/* ---------- editor ---------- */
var frame=null,desligar=null;
function enviar(m){if(frame&&frame.contentWindow)frame.contentWindow.postMessage(m,"*")}
function snapshot(){
 var P=window.XLangProjeto;
 if(!P||!P.atual())return;
 var f;try{f=P.todos()}catch(e){return}
 enviar({lumeProjeto:true,projeto:P.atual(),projetos:P.lista(),ficheiros:f,aberto:P.aberto(),tema:tema()});
}
function fechar(){
 if(desligar){desligar();desligar=null}
 if(frame){frame.remove();frame=null}
 fecharFolha();
}
function tentar(fn,rotulo){try{return fn()}catch(e){toast(String(e&&e.message||e).replace(/^[A-Za-z]+: /,""));return undefined}}

function abrir(nome){
 return garantir().then(function(){
  var P=window.XLangProjeto;
  if(P.lista().indexOf(nome)<0)P.criar(nome);
  if(P.atual()!==nome)P.abrir(nome);
  fechar();
  frame=document.createElement("iframe");
  frame.id="lume-proj-frame";frame.setAttribute("sandbox","allow-scripts");frame.src="LUME/editor/editor.html";
  frame.style.cssText="position:fixed;inset:0;z-index:9990;width:100%;height:100%;border:0;background:var(--bg,#f6f7ee)";
  document.body.appendChild(frame);
  desligar=P.aoMudar(snapshot);
 });
}

window.addEventListener("message",function(e){
 var d=e.data;
 if(!frame||!d||typeof d.lumeEd!=="string"||e.source!==frame.contentWindow)return;
 var P=window.XLangProjeto;if(!P)return;
 switch(d.lumeEd){
  case"pronto":snapshot();break;
  case"fechar":fechar();break;
  case"aberto":if(typeof d.caminho==="string"&&P.aberto()!==d.caminho)tentar(function(){P.abrirFicheiro(d.caminho)});break;
  case"guardar":if(typeof d.caminho==="string"&&typeof d.texto==="string"&&tentar(function(){P.escrever(d.caminho,d.texto);return true}))toast("Guardado");break;
  case"novoFicheiro":if(typeof d.caminho==="string"&&tentar(function(){if(P.existe(d.caminho))throw new Error("esse ficheiro já existe");P.escrever(d.caminho,"");P.abrirFicheiro(d.caminho);return true}))toast("Criado");break;
  case"renomearFicheiro":if(typeof d.de==="string"&&typeof d.para==="string")tentar(function(){P.renomear(d.de,d.para)});break;
  case"apagarFicheiro":if(typeof d.caminho==="string")tentar(function(){P.apagarFicheiro(d.caminho)});break;
  case"desfazerFicheiro":if(typeof d.caminho==="string"&&tentar(function(){P.desfazer(d.caminho);return true}))toast("Versão anterior reposta");break;
  case"escreverFicheiro":if(typeof d.caminho==="string"&&typeof d.texto==="string"&&tentar(function(){P.escrever(d.caminho,d.texto);return true}))toast("Criado");break;
  case"abrirProjeto":if(typeof d.nome==="string")tentar(function(){P.abrir(d.nome)});break;
  case"novoProjeto":if(typeof d.nome==="string"&&tentar(function(){P.criar(d.nome);P.abrir(d.nome);return true}))toast("Projeto criado");break;
  case"pergunta":if(typeof d.texto==="string")perguntar(d.texto.slice(0,2000));break;
  case"executar":if(typeof d.caminho==="string"&&typeof d.texto==="string")executar(d.caminho,d.texto);break;
  case"copiar":if(typeof d.texto==="string"){if(typeof copiarTexto==="function")copiarTexto(d.texto);toast(String(d.msg||"Copiado"))}break;
  case"baixar":if(typeof d.conteudo==="string"){if(typeof window.baixarFicheiro==="function")window.baixarFicheiro(String(d.nome||"ficheiro.txt"),d.conteudo,String(d.mime||"text/plain"));else toast("Descarregar indisponível")}break;
 }
});

/* ---------- conversa: a pergunta feita no editor segue o caminho normal do chat; as respostas voltam ao editor ---------- */
var vig=null,idResp=0;
function textoDe(n){
 var c=n.cloneNode(true);
 c.querySelectorAll(".lume-proj,.lume-app,button,style,script").forEach(function(x){x.remove()});
 c.querySelectorAll("p,div,li,pre,br,h1,h2,h3,h4,tr").forEach(function(x){x.appendChild(document.createTextNode("\n"))});
 return(c.textContent||"").replace(/\n{3,}/g,"\n\n").trim();
}
function seguir(n){
 var id=++idResp,t=null;
 function mandar(){var tx=textoDe(n);if(tx)enviar({lumeResposta:true,id:id,texto:tx})}
 var mo=new MutationObserver(function(){clearTimeout(t);t=setTimeout(mandar,200)});
 mo.observe(n,{childList:true,subtree:true,characterData:true});
 setTimeout(function(){mo.disconnect()},30000);
 mandar();
}
function vigiar(){
 var chat=document.getElementById("chat");if(!chat)return false;
 if(vig)vig.disconnect();
 vig=new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){
  if(n.nodeType===1&&n.classList&&n.classList.contains("msg")&&n.classList.contains("sistema")&&!n.classList.contains("digitando"))seguir(n);
 })})});
 vig.observe(chat,{childList:true});
 setTimeout(function(){if(vig){vig.disconnect();vig=null}},60000);
 return true;
}
function perguntar(texto){
 var inp=document.getElementById("chat-input");
 if(!inp||typeof window.enviar!=="function"||!vigiar()){toast("O chat não está disponível");return}
 inp.value=texto;
 window.enviar();
}

/* ---------- executar XLang ---------- */
var folha=null;
function fecharFolha(){if(folha){folha.remove();folha=null}}
function executar(caminho,texto){
 fecharFolha();
 folha=document.createElement("div");
 folha.style.cssText="position:fixed;left:0;right:0;bottom:0;top:12%;z-index:9995;display:flex;flex-direction:column;background:var(--card,#fff);color:var(--text,#1d2410);border-radius:20px 20px 0 0;box-shadow:0 -8px 32px rgba(0,0,0,.25)";
 var cab=document.createElement("div");
 cab.style.cssText="display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border,#c9ceb8);font-weight:600;font-size:14px";
 var t=document.createElement("span");t.style.cssText="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";t.textContent="Resultado: "+caminho;
 var x=document.createElement("button");x.type="button";x.textContent="Fechar";x.style.cssText="border:0;border-radius:12px;padding:8px 14px;background:var(--r,#4a6a10);color:var(--on,#fff);font:inherit;cursor:pointer";
 x.addEventListener("click",fecharFolha);
 cab.appendChild(t);cab.appendChild(x);
 var slot=document.createElement("div");slot.style.cssText="flex:1;min-height:0;overflow:auto;padding:14px";
 folha.appendChild(cab);folha.appendChild(slot);document.body.appendChild(folha);
 var codigo=/<program[\s>]/i.test(texto)?texto:"<program>"+texto+"</program>";
 garantir().then(function(){return typeof carregarXlang==="function"?carregarXlang():0}).then(function(){
  var C=typeof xlangClasse==="function"?xlangClasse():window.XLangInterpreter;
  if(!C)throw new Error("interpretador indisponível");
  return new C(slot).run(codigo);
 }).catch(function(err){slot.textContent="Erro: "+(err&&err.message?err.message:err)});
}

/* ---------- cartao do projeto nas respostas do chat: <div class="lume-proj" data-proj="nome" data-n="3"> ---------- */
function montarCartao(el){
 if(el.dataset.pronto)return;el.dataset.pronto="1";
 var nome=el.getAttribute("data-proj")||"",n=el.getAttribute("data-n")||"0";
 el.style.cssText="display:flex;align-items:center;gap:10px;max-width:360px;padding:12px 14px;border:1px solid var(--border,#c9ceb8);border-radius:14px;background:var(--card,#fff);color:var(--text,#1d2410);cursor:pointer;-webkit-tap-highlight-color:transparent";
 el.setAttribute("role","button");el.tabIndex=0;
 var t=document.createElement("span");t.style.cssText="flex:1;min-width:0";
 var a=document.createElement("span");a.style.cssText="display:block;font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";a.textContent=nome;
 var b=document.createElement("span");b.style.cssText="display:block;font-size:12px;color:var(--muted,#5c6b3a)";b.textContent="Projeto · "+n+(n==="1"?" ficheiro":" ficheiros")+" · toca para abrir";
 t.appendChild(a);t.appendChild(b);el.appendChild(t);
 function ir(){abrir(nome).catch(function(e){toast(String(e&&e.message||e))})}
 el.addEventListener("click",ir);
 el.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();ir()}});
}
function varrer(){document.querySelectorAll("div.lume-proj[data-proj]").forEach(montarCartao)}
new MutationObserver(varrer).observe(document.body,{childList:true,subtree:true});
varrer();

window.lumeProjeto={
 abrir:abrir,
 fechar:fechar,
 executar:executar,
 escrever:function(caminho,texto){return garantir().then(function(){return window.XLangProjeto.escrever(caminho,texto)})},
 ler:function(caminho){return garantir().then(function(){return window.XLangProjeto.ler(caminho)})},
 ficheiros:function(){return garantir().then(function(){return window.XLangProjeto.ficheiros()})},
 criar:function(nome){return garantir().then(function(){return window.XLangProjeto.criar(nome)})},
 lista:function(){return garantir().then(function(){return window.XLangProjeto.lista()})}
};
})();
