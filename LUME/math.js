/* Lume - formulas em LaTeX (KaTeX).
   Aceita $...$ e \(...\) na linha, $$...$$ e \[...\] em bloco.
   O marked reconhece a formula antes de tratar _ e *, o DOMPurify deixa passar o marcador
   e window.lumeMath(elemento) desenha as formulas depois. Sem KaTeX, mostra o texto da formula. */
(function(){
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
if(window.marked&&typeof marked.use==="function"){
 marked.use({extensions:[
  {name:"lumeMathBloco",level:"block",
   start:function(src){var i=src.search(/\$\$|\\\[/);return i<0?undefined:i},
   tokenizer:function(src){
    var m=/^(?:\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\])[ \t]*(?:\n|$)/.exec(src);
    if(m)return {type:"lumeMathBloco",raw:m[0],tex:(m[1]||m[2]).trim()};
   },
   renderer:function(t){return '<div class="lume-math" data-bloco="1" data-tex="'+esc(t.tex)+'">'+esc(t.tex)+'</div>\n'}},
  {name:"lumeMathLinha",level:"inline",
   start:function(src){var i=src.search(/\$|\\\(/);return i<0?undefined:i},
   tokenizer:function(src){
    var m=/^\\\(([\s\S]+?)\\\)/.exec(src)||/^\$\$([^\n]+?)\$\$/.exec(src)||/^\$(?![\s$])((?:\\.|[^$\\\n])+?)\$(?!\d)/.exec(src);
    if(m&&!/\s$/.test(m[1]))return {type:"lumeMathLinha",raw:m[0],tex:m[1].trim()};
   },
   renderer:function(t){return '<span class="lume-math" data-tex="'+esc(t.tex)+'">'+esc(t.tex)+'</span>'}}
 ]});
}
window.lumeMath=function(raiz){
 if(!raiz||!window.katex)return;
 var els=raiz.querySelectorAll(".lume-math:not([data-ok])");
 for(var i=0;i<els.length;i++){
  var el=els[i];
  try{katex.render(el.getAttribute("data-tex")||"",el,{displayMode:el.hasAttribute("data-bloco"),throwOnError:false,strict:"ignore",trust:false})}
  catch(e){el.textContent=el.getAttribute("data-tex")||""}
  el.setAttribute("data-ok","1");
 }
};
})();
