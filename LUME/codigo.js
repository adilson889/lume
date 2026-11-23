/* Lume - carregador do gerador de codigo. Carrega os ficheiros de LUME/codigo/ por ordem e expoe
   window.LumeCodigoChat.responder(q) ao despachante. Se ainda nao carregaram, devolve null e o
   Lume segue o caminho normal. Para juntar uma capacidade nova: ver LUME/codigo/README.md. */
(function(){
"use strict";
var FICHEIROS=["gerador.js","lexico.js","nucleo.js","variaveis.js","funcoes.js","condicoes.js","listas.js"];
var pronto=false,carregando=false;
function carregar(url){return new Promise(function(ok,erro){var s=document.createElement("script");s.src=url;s.onload=ok;s.onerror=function(){erro(new Error(url))};document.head.appendChild(s)})}
function preparar(){
 if(pronto||carregando)return;
 carregando=true;
 FICHEIROS.reduce(function(p,f){return p.then(function(){return carregar("LUME/codigo/"+f)})},Promise.resolve())
  .then(function(){pronto=!!(window.LumeCodigoPT&&window.LumeCodigo);carregando=false})
  .catch(function(){carregando=false});
}
window.LumeCodigoChat={responder:function(q){
 if(!pronto){preparar();return null}
 try{return window.LumeCodigoPT.responder(q)}catch(_){return null}
}};
preparar();
})();
