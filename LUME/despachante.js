/* Lume - despachante de capacidades.
   Le LUME/bot/capacidades.txt (dados) e decide, para cada pergunta, que capacidade executar,
   se o pedido tem o que e preciso e o que dizer quando falta algo. Nao tem frases decoradas:
   so verbos, objetos e medidores (numeros, pecas) declarados no registo.
   Usa do chat: window.arquivosBot, window.lumeOnReply, numerosDaPergunta (opcional). */
(function(){
function norm(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim()}
function esc(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function tem(texto,palavra){return new RegExp("(^|[^a-z0-9])"+esc(palavra)+"([^a-z0-9]|$)").test(texto)}
function arq(n){return String((window.arquivosBot||{})[n]||"")}

function lerCapacidades(){
 var l=[];
 arq("capacidades.txt").split(/\r?\n/).forEach(function(x){
  if(!x.trim()||x.trim().charAt(0)==="#")return;
  var p=x.split("|").map(function(y){return y.trim()});
  if(p.length<5)return;
  l.push({nome:p[0],verbos:lista(p[1]),objetos:lista(p[2]),requer:p[3],resposta:p[4],aviso:p[5]||""});
 });
 return l;
}
function lista(s){return s.split(",").map(norm).filter(Boolean)}

/* medidores: quantos numeros e quantas pecas ha na pergunta */
function pecasDaPergunta(t){
 var vistos={},nomes=[];
 arq("pecas.txt").split(/\r?\n/).forEach(function(l){
  if(!l.trim()||l.trim().charAt(0)==="#")return;
  var p=l.split("|");if(p.length<3)return;
  var nome=p[0].trim(),chaves=(p[0]+","+p[1]).split(",").map(norm).filter(Boolean);
  if(chaves.some(function(k){return tem(t,k)}))if(!vistos[nome]){vistos[nome]=1;nomes.push(nome)}
 });
 return nomes;
}
function todasAsPecas(){
 var n=[];arq("pecas.txt").split(/\r?\n/).forEach(function(l){if(!l.trim()||l.trim().charAt(0)==="#")return;var p=l.split("|");if(p.length>=3)n.push(p[0].trim())});return n;
}
function medidores(q,t){
 var nums=typeof numerosDaPergunta==="function"?numerosDaPergunta(q):(String(q).match(/-?\d+(?:[.,]\d+)?/g)||[]);
 return{numeros:nums.length,pecas:pecasDaPergunta(t).length};
}
function cumpre(requer,m){
 if(!requer||requer==="-")return true;
 return requer.split(/[,&]/).every(function(c){
  var x=/^\s*(\w+)\s*(>=|<=|==|>|<)\s*(\d+)\s*$/.exec(c);if(!x)return true;
  var v=m[x[1]]||0,n=+x[3];
  return x[2]===">="?v>=n:x[2]==="<="?v<=n:x[2]==="=="?v===n:x[2]===">"?v>n:v<n;
 });
}
function ativa(c,t,m){
 if(!c.verbos.some(function(v){return tem(t,v)}))return false;
 if(!c.objetos.length)return true;
 return c.objetos.some(function(o){return o==="numeros"?m.numeros>=1:o==="pecas"?m.pecas>=1:tem(t,o)});
}

/* entrada N de um ficheiro no formato N-{ ... } (chavetas equilibradas) */
function entrada(ficheiro,n){
 var s=arq(ficheiro),re=new RegExp("(^|\\n)\\s*"+n+"\\s*-\\s*\\{","g"),m=re.exec(s);
 if(!m)return null;
 var i=re.lastIndex,d=1,j=i;
 while(j<s.length&&d>0){var c=s.charAt(j);if(c==="{")d++;else if(c==="}")d--;j++}
 if(d!==0)return null;
 var dentro=s.slice(i,j-1).trim();
 /* forma "N-{xlang}" seguida do programa ate a proxima entrada */
 if(dentro.toLowerCase()==="xlang"){
  var resto=s.slice(j),f=/\n\s*\d+\s*-/.exec(resto),corpo=(f?resto.slice(0,f.index):resto).trim();
  return/^<program/i.test(corpo)?corpo:"<program>"+corpo+"</program>";
 }
 return dentro;
}

/* devolve true se tratou a pergunta (executou ou avisou); false para o bot decidir */
async function tentar(q){
 var caps=lerCapacidades();if(!caps.length||typeof window.lumeOnReply!=="function")return false;
 var t=norm(q),m=medidores(q,t);
 var porVerbo=caps.filter(function(c){return c.verbos.some(function(v){return tem(t,v)})});
 if(porVerbo.length!==1)return false;
 var c=porVerbo[0];
 if(!ativa(c,t,m))return false;
 if(cumpre(c.requer,m)){
  var partes=c.resposta.split(","),txt=entrada(partes[0].trim(),parseInt(partes[1],10)||1);
  if(!txt)return false;
  window.lumeOnReply({text:txt});
  return true;
 }
 var liga=/(^|\s)(e|com)(\s|$)|,/.test(t);
 if(c.aviso&&liga){
  var txt2=c.aviso.replace(/\{pecas\}/g,String(m.pecas)).replace(/\{lista\}/g,todasAsPecas().join(", "));
  window.lumeOnReply({text:txt2});
  return true;
 }
 return false;
}
window.LumeDespachante={tentar:tentar,ler:lerCapacidades,medidores:function(q){return medidores(q,norm(q))}};
})();
