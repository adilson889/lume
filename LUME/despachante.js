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
  l.push({nome:p[0],verbos:lista(p[1]),objetos:lista(p[2]),requer:p[3],resposta:p[4],aviso:p[5]||"",entrega:/^(sim|s|1|true)$/i.test(p[6]||"")});
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
/* registos: "nome | sinonimos | ..." uma linha por entrada; chaves = nome + sinonimos, com e sem acentos */
function lerRegisto(ficheiro,minimo){
 var r=[];
 arq(ficheiro).split(/\r?\n/).forEach(function(l){
  if(!l.trim()||l.trim().charAt(0)==="#")return;
  var p=l.split("|").map(function(x){return x.trim()});
  if(p.length>=minimo)r.push(p);
 });
 return r;
}
function chavesDe(p,colunaSinonimos){
 var vistos={},ch=[];
 (p[0]+","+p[colunaSinonimos]).split(",").forEach(function(a){
  a=a.trim().toLowerCase();if(!a)return;
  [a,a.normalize("NFD").replace(/[\u0300-\u036f]/g,"")].forEach(function(k){if(!vistos[k]){vistos[k]=1;ch.push(k)}});
 });
 return ch;
}
function componentesDaPergunta(t){
 return lerRegisto("componentes.txt",5).filter(function(p){return chavesDe(p,1).some(function(k){return tem(t,norm(k))})}).length;
}
function lit(a){return"["+a.map(function(x){return typeof x==="number"?String(x):"'"+String(x).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"')+"'"}).join(",")+"]"}
/* variaveis XLang injetadas quando o programa usa comp_ ou cores_ */
window.variaveisGerador=function(codigo){
 var c=String(codigo),v="";
 if(c.indexOf("comp_")>=0){
  var L=lerRegisto("componentes.txt",5),nome=[],padrao=[],html=[],css=[],ch=[],mp=[];
  L.forEach(function(p,i){nome.push(p[0]);padrao.push(p[2]);html.push(p[3]);css.push(p.slice(4).join("|"));chavesDe(p,1).forEach(function(k){ch.push(k);mp.push(i)})});
  v+='<array name="comp_nome" value="'+lit(nome)+'"></array><array name="comp_padrao" value="'+lit(padrao)+'"></array><array name="comp_html" value="'+lit(html)+'"></array><array name="comp_css" value="'+lit(css)+'"></array><array name="comp_chaves" value="'+lit(ch)+'"></array><array name="comp_mapa" value="'+lit(mp)+'"></array><var name="comp_nchaves" value="'+ch.length+'"></var>';
 }
 if(c.indexOf("cores_")>=0){
  var C=lerRegisto("cores.txt",4),cn=[],hx=[],so=[],cc=[],cm=[];
  C.forEach(function(p,i){cn.push(p[0]);hx.push(p[1]);so.push(p[2]);chavesDe(p,3).forEach(function(k){cc.push(k);cm.push(i)})});
  v+='<array name="cores_nome" value="'+lit(cn)+'"></array><array name="cores_hex" value="'+lit(hx)+'"></array><array name="cores_sobre" value="'+lit(so)+'"></array><array name="cores_chaves" value="'+lit(cc)+'"></array><array name="cores_mapa" value="'+lit(cm)+'"></array><var name="cores_nchaves" value="'+cc.length+'"></var>';
 }
 return v;
};
function medidores(q,t){
 /* "um" e "uma" sao quase sempre artigos ("cria um botao"), por isso nao contam como numeros aqui */
 var nums=(String(q).match(/-?\d+(?:[.,]\d+)?|\b(?:zero|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\b/gi)||[]);
 return{numeros:nums.length,pecas:pecasDaPergunta(t).length,componentes:componentesDaPergunta(t)};
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
 return c.objetos.some(function(o){return o==="numeros"?m.numeros>=1:o==="pecas"?m.pecas>=1:o==="componentes"?m.componentes>=1:tem(t,o)});
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

/* true se a capacidade que vai responder esta marcada com entrega=sim (o chat pergunta antes como receber o resultado) */
function pedeEntrega(q){
 var caps=lerCapacidades();if(!caps.length)return false;
 var t=norm(q),m=medidores(q,t),ativos=caps.filter(function(c){return ativa(c,t,m)});
 if(ativos.length>1){var cumprem=ativos.filter(function(x){return cumpre(x.requer,m)});if(cumprem.length===1)ativos=cumprem}
 return ativos.length===1&&!!ativos[0].entrega&&cumpre(ativos[0].requer,m);
}

/* Motor inicial de frases: combina léxico separado de acordo com o número do sujeito. */
function linhas(f){
 return arq(f).split(/\r?\n/).map(function(x){return x.trim()}).filter(function(x){return x&&!/^#/.test(x)});
}
function escolher(a){return a.length?a[Math.floor(Math.random()*a.length)]:"";}
function gerarFrases(q){
 var sujeitos=linhas("frases_sujeitos.txt"),verbos=linhas("frases_verbos.txt"),
     complementos=linhas("frases_complementos.txt"),circ=linhas("frases_circunstancias.txt"),
     estruturas=linhas("estruturas_frases.txt");
 if(!sujeitos.length||!verbos.length||!complementos.length||!estruturas.length)return "Ainda estou a organizar as minhas frases.";
 var n=1,match=norm(q).match(/\b([1-5])\b/);if(match)n=Number(match[1]);
 if(/\b(duas|dois)\b/.test(norm(q)))n=2;
 if(/\b(tres|três)\b/.test(norm(q)))n=3;
 if(/\b(quatro)\b/.test(norm(q)))n=4;
 if(/\b(cinco)\b/.test(norm(q)))n=5;
 var saidas=[],usadas={};
 for(var i=0;i<n;i++){
  var s=escolher(sujeitos).split("|"),v=escolher(verbos).split("|");
  var plural=Math.random()<0.35, sujeito=(plural?s[1]:s[0])||s[0],verbo=(plural?v[1]:v[0])||v[0];
  var modelo=escolher(estruturas),comp=escolher(complementos),circunstancia=escolher(circ);
  var frase=modelo.replace(/\{sujeito\}/g,sujeito).replace(/\{verbo\}/g,verbo)
    .replace(/\{complemento\}/g,comp).replace(/\{circunstancia\}/g,circunstancia)
    .replace(/\s+/g," ").replace(/\s+([,.;:!?])/g,"$1").trim();
  if(usadas[frase]){i--;continue;}usadas[frase]=true;saidas.push(frase);
 }
 return saidas.join("\n");
}
/* devolve true se tratou a pergunta (executou ou avisou); false para o bot decidir */
async function tentar(q){
 var caps=lerCapacidades();if(!caps.length||typeof window.lumeOnReply!=="function")return false;
 var t=norm(q),m=medidores(q,t);
 /* decide pelo verbo e pelo objeto juntos: "gera" serve a varias capacidades, "gera um botao" so a uma */
 var ativos=caps.filter(function(c){return ativa(c,t,m)});
 /* em caso de empate, ganha a unica capacidade cujas condicoes (requer) se cumprem */
 if(ativos.length>1){var cumprem=ativos.filter(function(x){return cumpre(x.requer,m)});if(cumprem.length===1)ativos=cumprem}
 if(ativos.length!==1)return false;
 var c=ativos[0];
 if(cumpre(c.requer,m)){
  if(c.nome==="frases"){window.lumeOnReply({text:gerarFrases(q)});return true;}
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
window.LumeDespachante={tentar:tentar,pedeEntrega:pedeEntrega,ler:lerCapacidades,medidores:function(q){return medidores(q,norm(q))}};
})();
