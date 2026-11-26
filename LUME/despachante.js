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
/* quantas pecas ha no pedido, contando as repeticoes: "duas casas" = 2, "uma casa e tres arvores" = 4 */
function quantidadesPecas(t){
 var NUM={dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12};
 var vistos={},total=0;
 arq("pecas.txt").split(/\r?\n/).forEach(function(l){
  if(!l.trim()||l.trim().charAt(0)==="#")return;
  var p=l.split("|");if(p.length<3)return;
  var nome=p[0].trim(),chaves=(p[0]+","+p[1]).split(",").map(norm).filter(Boolean);
  if(vistos[nome]||!chaves.some(function(k){return tem(t,k)}))return;
  vistos[nome]=1;var q=1;
  chaves.forEach(function(k){
   var re=new RegExp("(?:^|\\s)(\\d+|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\\s+"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?=\\s|$)");
   var m=re.exec(t);if(m){var v=/^\d+$/.test(m[1])?parseInt(m[1],10):NUM[m[1]];if(v>q)q=v}
  });
  total+=Math.min(q,12);
 });
 return total;
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
 if(c.indexOf("grafico_")>=0){
  var gq=String(typeof ultimaPergunta==="string"?ultimaPergunta:""),gr=graficoFuncao(gq);
  if(gr&&!gr.e)v+='<var name="temgrafico" value="true"></var><var name="grafico_erro" value="\'\'"></var><var name="grafico_titulo" value="\''+gr.titulo+'\'"></var><array name="grafico_svg" value="'+lit([gr.svg])+'"></array><array name="grafico_info" value="'+lit(gr.info)+'"></array>';
  else if(gr)v+='<var name="temgrafico" value="true"></var><var name="grafico_erro" value="\''+gr.e+'\'"></var><var name="grafico_titulo" value="\'\'"></var><array name="grafico_svg" value="[]"></array><array name="grafico_info" value="[]"></array>';
  else v+='<var name="temgrafico" value="false"></var>';
 }
 return v;
};
function medidores(q,t){
 /* "um" e "uma" sao quase sempre artigos ("cria um botao"), por isso nao contam como numeros aqui */
 var nums=(String(q).match(/-?\d+(?:[.,]\d+)?|\b(?:zero|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\b/gi)||[]);
 return{numeros:nums.length,pecas:/\b(grafico|graficos|pontas|seno|funcao)\b/.test(t)||/\by\s*=/.test(t)?0:quantidadesPecas(t),componentes:componentesDaPergunta(t)};
}
function cumpre(requer,m){
 if(!requer||requer==="-")return true;
 return requer.split(/[,&]/).every(function(c){
  var x=/^\s*(\w+)\s*(>=|<=|==|>|<)\s*(\d+)\s*$/.exec(c);if(!x)return true;
  var v=m[x[1]]||0,n=+x[3];
  return x[2]===">="?v>=n:x[2]==="<="?v<=n:x[2]==="=="?v===n:x[2]===">"?v>n:v<n;
 });
}
/* palavras que nao sao de contas: "preciso de 2 ou 3 frases mais curtas" nao e uma soma */
var _palavrasConta={calcula:1,calcule:1,calcular:1,quanto:1,e:1,a:1,o:1,de:1,da:1,do:1,por:1,com:1,mais:1,menos:1,vezes:1,dividido:1,dividir:1,divide:1,soma:1,somar:1,multiplica:1,multiplicar:1,subtrai:1,subtrair:1,resultado:1,qual:1,que:1,da_:1,favor:1,x:1,ao:1,quadrado:1,cubo:1,elevado:1,raiz:1,numeros:1,numero:1,total:1,valor:1,entre:1,e_:1};
function estranhasNaConta(t){
 var nomes={};arq("numeros.txt").split(/\r?\n/).forEach(function(l){if(!l.trim()||l.trim().charAt(0)==="#")return;var p=l.split("|");if(p.length>1)p[1].split(",").forEach(function(w){nomes[norm(w)]=1})});
 return t.split(/[^a-z0-9]+/).filter(function(w){return w&&!/^\d/.test(w)&&!_palavrasConta[w]&&!nomes[w]}).length;
}
function ativa(c,t,m){
 if(!c.verbos.some(function(v){return tem(t,v)}))return false;
 if(c.nome==="calcular"&&estranhasNaConta(t)>=2)return false;
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

/* Conversa: identifica intenções combinadas e constrói uma resposta única.
   Os ficheiros de respostas completas deixam de controlar saudações e conversa básica. */
function dist(a,b){
 var m=[],i,j;for(i=0;i<=a.length;i++){m[i]=[i]}for(j=1;j<=b.length;j++)m[0][j]=j;
 for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));
 return m[a.length][b.length];
}
/* tolera um erro de escrita em palavras longas (ex.: "obrigdo") */
function aproximada(t,palavras){
 return t.split(" ").some(function(w){return w.length>=5&&palavras.some(function(p){return Math.abs(w.length-p.length)<=1&&dist(w,p)<=1})});
}
function nomeGuardado(){try{return localStorage.getItem("lume_nome")||""}catch(e){return""}}
function guardarNome(n){try{localStorage.setItem("lume_nome",n)}catch(e){}}
var _aguardaEstado=0;
/* O que a pessoa diz sobre si: "bem", "mal", "neutro" ou "" (t ja normalizado). */
function estadoDito(t){
 if(/\b(nao estou (muito |tao )?bem|nao me sinto bem|estou (um pouco |muito |bastante )?(mal|triste|cansado|cansada|doente|ansioso|ansiosa|nervoso|nervosa|preocupado|preocupada|desanimado|desanimada|aborrecido|aborrecida|stressado|stressada)|estou com (sono|dor|febre)|correr mal)\b/.test(t))return "mal";
 if(/\b(estou|ando|vou|fico|me sinto|sinto me)\s+((muito|tao|bastante|mesmo|tambem|la)\s+)*(bem|otimo|otima|excelente|feliz|contente|tranquilo|tranquila|fixe|bom|boa|satisfeito|satisfeita|animado|animada)\b/.test(t))return "bem";
 if(/\b(eu )?tambem\b.*\b(bem|otimo|otima|fixe)\b/.test(t)||/\bcorrer (muito )?bem\b/.test(t)||/\btudo (bem|bom|tranquilo|certo|otimo|normal) comigo\b/.test(t))return "bem";
 if(/\b(mais ou menos|assim assim|estou ocupado|estou ocupada)\b/.test(t))return "neutro";
 return "";
}
function detectarConversa(q){
 var t=norm(q);
 /* conversa so em mensagens curtas e que nao pedem nenhuma capacidade (cria, calcula, desenha...) */
 if(t.split(" ").length>10)return null;
 var med=medidores(q,t);
 if(lerCapacidades().some(function(c){return ativa(c,t,med)}))return null;
 var curta=t.replace(/[?!.,;:]+/g," ").replace(/\s+/g," ").trim();
 /* a saudacao esta no inicio da mensagem: "hoje foi um bom dia" nao e um cumprimento */
 var saudacao=/\b(oi|ola|bom dia|boa tarde|boa noite|e ai|ei|hey|hello|wey|boas|opa|eia)\b/.test(curta.split(" ").slice(0,3).join(" "));
 var perguntaEstado=/\b(como estas|como vai|como vais|tudo bem|tudo bom|tudo tranquilo|esta tudo bem)\b/.test(t)&&!/\btudo bem com /.test(t)&&(/[?]/.test(q)||/\b(como estas|como vai|como vais)\b/.test(t)||/\b(ola|oi|bom dia|boa tarde|boa noite|hey|hello)\b/.test(t));
 /* resposta a "como estas?": a pessoa diz como esta (e pode devolver a pergunta). Nao se volta a perguntar. */
 var pedeEstado=/\b(como estas|como vai|como vais)\b/.test(t);
 var devolve=/\b(e tu|e voce|e vc|e contigo|e consigo|e por ai|e desse lado|e do teu lado)\b/.test(t);
 var respEstado=estadoDito(t);
 if(!respEstado&&Date.now()-_aguardaEstado<120000){
  var bare=/^(eu )?(tambem|bem|muito bem|otimo|otima|fixe|tudo bem|tudo bom|tudo tranquilo|tudo certo|tudo|de boa|na paz|normal|mais ou menos|assim assim)( obrigad[oa])?( e tu| e voce)?$/.exec(curta);
  if(bare)respEstado=/normal|mais ou menos|assim assim/.test(bare[2])?"neutro":"bem";
 }
 if(respEstado&&!pedeEstado)perguntaEstado=false;else respEstado="";
 var agradecimento=/\b(obrigado|obrigada|agradecido|agradecida|agradeco|valeu|thanks)\b/.test(t)||aproximada(t,["obrigado","obrigada","agradeco"]);
 var despedida=/\b(adeus|ate logo|ate ja|ate amanha|xau|tchau|falou|vou embora)\b/.test(t)||aproximada(t,["adeus","tchau"]);
 var ajuda=/\b(o que sabes fazer|que sabes fazer|tu fazes o que|suas capacidades|teus recursos)\b/.test(t)||/^(ajuda|ajudas|preciso de ajuda|podes ajudar|podes ajudar me|podes me ajudar)$/.test(curta.replace(/-/g," "));
 var hora=/\b(que horas (sao|e)|horas sao|que hora e)\b/.test(t);
 var data=/\b(que dia e hoje|qual e a data|data de hoje|em que dia estamos|que dia da semana)\b/.test(t);
 var mn=/(?:o\s+)?meu\s+nome\s+(?:e|é)\s+([A-Za-zÀ-ÿ]{2,20})|chamo[\s-]+me\s+([A-Za-zÀ-ÿ]{2,20})|me\s+chamo\s+([A-Za-zÀ-ÿ]{2,20})/i.exec(q);
 var nome=mn?(mn[1]||mn[2]||mn[3]):"";
 if(nome)nome=nome.charAt(0).toUpperCase()+nome.slice(1);
 var perguntaNome=/\b(qual e o meu nome|como me chamo|sabes o meu nome|sabes quem eu sou)\b/.test(t);
 if(saudacao||perguntaEstado||respEstado||agradecimento||despedida||ajuda||hora||data||nome||perguntaNome)
  return {saudacao:saudacao,estado:perguntaEstado,respEstado:respEstado,devolve:devolve,agradecimento:agradecimento,despedida:despedida,ajuda:ajuda,hora:hora,data:data,nome:nome,perguntaNome:perguntaNome};
 return null;
}
/* frases por tipo em conversa.txt (formato: tipo | texto); se o ficheiro faltar usa o padrao */
function L(tipo,padrao){
 var r=[];
 arq("conversa.txt").split(/\r?\n/).forEach(function(l){
  if(!l.trim()||l.trim().charAt(0)==="#")return;
  var i=l.indexOf("|");if(i<1)return;
  if(l.slice(0,i).trim()===tipo&&l.slice(i+1).trim())r.push(l.slice(i+1).trim());
 });
 return r.length?r:padrao;
}
function gerarConversa(q){
 var c=detectarConversa(q);if(!c)return "";
 var nomeSalvo=nomeGuardado();
 function cumprimentoHorario(){
  var hora=new Date().getHours();
  if(hora>=5&&hora<12)return "Bom dia";
  if(hora>=12&&hora<18)return "Boa tarde";
  return "Boa noite";
 }
 function maiuscula(x){return x.charAt(0).toUpperCase()+x.slice(1)}
 var partes=[];
 if(c.nome){
  guardarNome(c.nome);
  return "Prazer, "+c.nome+". Vou lembrar-me do teu nome neste dispositivo.";
 }
 if(c.perguntaNome)return nomeSalvo?"Chamas-te "+nomeSalvo+".":"Ainda não me disseste o teu nome. Escreve, por exemplo: o meu nome é Ana.";
 /* a pessoa respondeu a "como estas?": reage e segue em frente, sem voltar a perguntar */
 if(c.respEstado&&!c.despedida&&!c.ajuda&&!c.hora&&!c.data){
  _aguardaEstado=0;
  var rx=c.respEstado==="mal"?escolher(L("reage_mal",["Lamento ouvir isso"]),"rmal"):c.respEstado==="neutro"?escolher(L("reage_neutro",["Percebo"]),"rneu"):escolher(L("reage_bem",["Ainda bem","Que bom saber","Fico contente por saber"]),"rbem");
  var ini=c.saudacao?cumprimentoHorario()+(nomeSalvo?", "+nomeSalvo:"")+"! ":"";
  var dv=c.devolve?escolher(L("devolucao_resposta",["Eu também estou bem, obrigado"]),"drsp"):"";
  var segue=escolher(L("segue",["Em que posso ajudar?"]),"segue");
  var frase=[rx,dv].filter(Boolean).map(function(x){return x.replace(/[.!?]*$/,".")}).join(" ");
  return (ini+frase+" "+segue).replace(/\s+/g," ").trim();
 }
 if(c.hora||c.data){
  var agora=new Date();
  if(c.hora)partes.push("São "+agora.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"})+".");
  if(c.data)partes.push("Hoje é "+agora.toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+".");
  return partes.join(" ");
 }
 if(c.despedida){
  var fim=escolher(L("despedida",["Até logo","Até à próxima","Fica bem"]),"despedida");
  return c.agradecimento?escolher(L("agradece",["Ainda bem que pude ajudar"]),"agradece")+". "+fim+".":fim+". Quando quiseres, continuamos.";
 }
 if(c.ajuda){
  var nomes=[];
  lerCapacidades().forEach(function(x){nomes.push(x.nome==="codigo"?"código":x.nome==="desenhar"?"desenhos":x.nome==="calcular"?"cálculos":x.nome==="loja"?"lojas e páginas":x.nome)});
  nomes=nomes.filter(Boolean);
  var ult=nomes.pop();
  return escolher(L("abertura_ajuda",["Posso ajudar-te com"]),"abertura")+" "+(nomes.length?nomes.join(", ")+" e ":"")+ult+". "+escolher(L("fecho_ajuda",["Podes escrever o que precisas com naturalidade."]),"fecho");
 }
 if(c.agradecimento&&!c.saudacao&&!c.estado)return escolher(L("agradece",["Ainda bem que pude ajudar"]),"agradece")+". Se precisares de mais alguma coisa, é só dizer.";
 if(c.saudacao)partes.push(cumprimentoHorario()+(nomeSalvo?", "+nomeSalvo:"")+"!");
 if(c.estado){
  partes.push(escolher(L("estado",["Estou bem"]),"estado").replace(/[.!?]?$/, "."));
  partes.push(maiuscula(escolher(L("obrigado_pergunta",["obrigado por perguntares"]),"obrig"))+".");
  partes.push(escolher(L("devolucao",["E tu, como estás?"]),"devol"));
  _aguardaEstado=Date.now();
 }else if(c.saudacao){
  var pa=escolher(L("pergunta_aberta",["Em que posso ajudar?"]),"aberta");
  partes.push(pa);
  if(/est[aá]s|tudo bem|contigo/i.test(pa))_aguardaEstado=Date.now();
 }else if(c.agradecimento){
  partes.push(escolher(L("agradece",["Ainda bem que pude ajudar"]),"agradece")+".");
 }
 return partes.join(" ").replace(/\s+/g," ").trim();
}
/* Motor de frases: combina o léxico de frases livres sem depender de respostas completas. */
function linhas(f){
 return arq(f).split(/\r?\n/).map(function(x){return x.trim()}).filter(function(x){return x&&!/^#/.test(x)});
}
var _ultimo={};
/* escolhe ao acaso, sem repetir a escolha anterior da mesma chave */
function escolher(a,k){
 if(!a.length)return "";
 var i=Math.floor(Math.random()*a.length);
 if(k&&a.length>1&&_ultimo[k]===i)i=(i+1+Math.floor(Math.random()*(a.length-1)))%a.length;
 if(k)_ultimo[k]=i;
 return a[i];
}
function gerarFrases(q){
 var conversa=gerarConversa(q);if(conversa)return conversa;
 var sujeitos=linhas("frases_sujeitos.txt"),verbos=linhas("frases_verbos.txt"),
     complementos=linhas("frases_complementos.txt"),circ=linhas("frases_circunstancias.txt"),
     estruturas=linhas("estruturas_frases.txt");
 if(!sujeitos.length||!verbos.length||!complementos.length||!estruturas.length)return "Ainda estou a organizar as minhas frases.";
 var n=1,match=norm(q).match(/\b([1-5])\b/);if(match)n=Number(match[1]);
 if(/\b(duas|dois)\b/.test(norm(q)))n=2;
 if(/\b(tres|três)\b/.test(norm(q)))n=3;
 if(/\b(quatro)\b/.test(norm(q)))n=4;
 if(/\b(cinco)\b/.test(norm(q)))n=5;
 var saidas=[],usadas={},tent=0;
 for(var i=0;i<n;i++){
  var s=escolher(sujeitos).split("|"),v=escolher(verbos).split("|");
  var plural=Math.random()<0.35, sujeito=(plural?s[1]:s[0])||s[0],verbo=(plural?v[1]:v[0])||v[0];
  var modelo=escolher(estruturas),comp=escolher(complementos),circunstancia=escolher(circ);
  var frase=modelo.replace(/\{sujeito\}/g,sujeito).replace(/\{verbo\}/g,verbo)
    .replace(/\{complemento\}/g,comp).replace(/\{circunstancia\}/g,circunstancia)
    .replace(/\s+/g," ").replace(/\s+([,.;:!?])/g,"$1").replace(/, ([A-ZÀ-Ú])(?=[a-zà-ú]|\s)/g,function(m,a){return", "+a.toLowerCase()}).trim();
  frase=frase.charAt(0).toUpperCase()+frase.slice(1);
  if(usadas[frase]){if(tent++<30)i--;continue;}usadas[frase]=true;saidas.push(frase);
 }
 return saidas.join("\n");
}
/* devolve true se tratou a pergunta (executou ou avisou); false para o bot decidir */
/* fala corrente: "tô cansado", "tá bom", "vc", "tbm", "obg" -> forma padrao, para o resto do Lume perceber */
function coloquial(q){
 var B="(?<![\\p{L}\\d])",E="(?![\\p{L}\\d])";
 function R(p,r,f){return function(x){return x.replace(new RegExp(p,f||"giu"),r)}}
 var passos=[
  R(B+"(tô|tou)"+E+"(?=\\s+\\p{L})","estou"),R(B+"to"+E+"(?=\\s+(bem|mal|cansad|com|a\\s|muito|feliz|triste|otim|ok|fixe|doente|aqui|de\\s|\\p{L}+(ndo|ado|ada|ido|ida)\\b))","estou"),
  R(B+"tá"+E,"está"),R(B+"pra"+E,"para"),R(B+"vc"+E,"você"),R(B+"(tbm|tb)"+E,"também"),
  R(B+"(obg|obgd|brigado|brigada)"+E,"obrigado"),R(B+"pq"+E,"porque"),
  R(B+"o+i+"+E,"oi"),R(B+"bom\\s+dia+"+E,"bom dia"),R(B+"boa\\s+tarde+"+E,"boa tarde"),R(B+"boa\\s+noite+"+E,"boa noite"),
  /* gerundio brasileiro -> "a" + infinitivo: "estou descansando" -> "estou a descansar" */
  function(x){return x.replace(new RegExp(B+"(estou|estás|está|estamos|estão|estava|estavas|estávamos|estavam|ando|andas|anda)\\s+(\\p{L}+?)(ando|endo|indo)"+E,"giu"),function(m,a,b,c){return a+" a "+b+({ando:"ar",endo:"er",indo:"ir"}[c.toLowerCase()])})}
 ];
 return passos.reduce(function(x,f){return f(x)},String(q));
}
var NOMES_CAP={codigo:"código",desenhar:"desenhos",calcular:"cálculos",loja:"lojas e páginas",frases:"frases"};
function raciocinio(t,ms){try{window.lumeAtualizarEtapa&&window.lumeAtualizarEtapa(t,ms)}catch(e){}}
function descreverConversa(c){
 var p=[];
 if(c.nome)p.push("o teu nome ("+c.nome+")");
 if(c.perguntaNome)p.push("uma pergunta sobre o teu nome");
 if(c.saudacao)p.push("um cumprimento");
 if(c.estado)p.push("uma pergunta sobre como estou");
 if(c.respEstado)p.push("a tua resposta sobre como estás");
 if(c.devolve)p.push("a pergunta devolvida a mim");
 if(c.agradecimento)p.push("um agradecimento");
 if(c.despedida)p.push("uma despedida");
 if(c.ajuda)p.push("um pedido para saber o que faço");
 if(c.hora)p.push("uma pergunta sobre as horas");
 if(c.data)p.push("uma pergunta sobre a data");
 if(!p.length)return "Reconheci uma conversa simples, sem pedido para nenhuma capacidade.";
 var u=p.pop();
 return "Li a mensagem e reconheci "+(p.length?p.join(", ")+" e ":"")+u+"; respondi como numa conversa, sem usar nenhuma capacidade.";
}
function descreverCapacidade(c,t,m,n){
 var ev=c.verbos.filter(function(v){return tem(t,v)});
 var eo=(c.objetos||[]).filter(function(o){return o==="numeros"?m.numeros>=1:o==="pecas"?m.pecas>=1:o==="componentes"?m.componentes>=1:tem(t,o)}).map(function(o){return o==="numeros"?m.numeros+(m.numeros===1?" número":" números"):o==="pecas"?m.pecas+(m.pecas===1?" peça":" peças"):o==="componentes"?m.componentes+(m.componentes===1?" componente":" componentes"):"«"+o+"»"});
 return "Das "+n+" capacidades que tenho, só «"+(NOMES_CAP[c.nome]||c.nome)+"» corresponde: encontrei o verbo «"+(ev[0]||"")+"»"+(eo.length?" e "+eo.join(", "):"")+".";
}
/* ===== Tutor de equacoes do 2.o grau =====
   Conduz a resolucao passo a passo, como numa aula: oferece-se para resolver em conjunto, pede os coeficientes,
   a formula do discriminante e as raizes, corrige cada resposta e so avanca quando a pessoa acerta,
   desiste ("nao sei") ou pede a solucao. Estado em memoria; "resolve tu" ou "sair" terminam. */
var _tutor=null;
window.lumeTutorAtivo=function(){return !!(_tutor&&Date.now()-_tutor.t<1800000)};
function tF(n){n=Math.round(n*1e6)/1e6;if(n===0)n=0;return String(n).replace(".",",").replace("-","−")}
function tW(n){return n<0?"("+tF(n)+")":tF(n)}
function tNum(s){
 s=String(s||"").replace(/[−–]/g,"-").replace(/\s+/g,"");
 var m=/^(-?\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/.exec(s);
 if(m){var d=parseFloat(m[2].replace(",","."));return d?parseFloat(m[1].replace(",","."))/d:null}
 m=/^-?\d+(?:[.,]\d+)?$/.exec(s);return m?parseFloat(s.replace(",",".")):null;
}
function tTermos(a,b,c,X){
 var out="";
 [[a,X+"²"],[b,X],[c,""]].forEach(function(t){
  var k=t[0];if(k===0)return;
  var mag=Math.abs(k),body=t[1]===""?tF(mag):(mag===1?"":tF(mag))+t[1];
  out+=out===""?(k<0?"−":"")+body:" "+(k<0?"−":"+")+" "+body;
 });
 return out||"0";
}
var _tElogio=["Exatamente!","Isso mesmo!","Muito bem!","Certo!","Boa!"],_tI=0;
function tElogio(){return _tElogio[_tI++%_tElogio.length]}
function tNorm(t){return norm(t).replace(/[^a-z0-9=,.\-+*\/² ]/g," ").replace(/\s+/g," ").trim()}
function tNumeros(t){var r=[],re=/-?\d+(?:[.,]\d+)?(?:\/\d+)?/g,m,s=String(t||"").replace(/[−–]/g,"-");while((m=re.exec(s)))r.push(tNum(m[0]));return r}
function lF(n){n=Math.round(n*1e6)/1e6;if(n===0)n=0;return String(n).replace(".","{,}")}
function lW(n){return n<0?"("+lF(n)+")":lF(n)}
function lTermos(a,b,c,X){
 var out="";
 [[a,X+"^2"],[b,X],[c,""]].forEach(function(t){
  var k=t[0];if(k===0)return;
  var mag=Math.abs(k),body=t[1]===""?lF(mag):(mag===1?"":lF(mag))+t[1];
  out+=out===""?(k<0?"-":"")+body:" "+(k<0?"-":"+")+" "+body;
 });
 return out||"0";
}
function tPasso(T,etapa){
 var e=T.q,X=e.X,a=e.a,b=e.b,c=e.c,s=lF(Math.sqrt(T.D));
 if(etapa==="coef")return "**Primeiro passo: identificar os coeficientes.**\n\nUma equação do 2.º grau escreve-se $a"+X+"^2 + b"+X+" + c = 0$: o **a** acompanha $"+X+"^2$, o **b** acompanha $"+X+"$ e o **c** é o termo sem $"+X+"$.\n\nA tua equação é:\n\n$$"+lTermos(a,b,c,X)+" = 0$$\n\nQuem são o **a**, o **b** e o **c**? Escreve assim, por exemplo: a = 3, b = −4, c = 7 (cuidado com os sinais).";
 if(etapa==="deltaf")return "**Segundo passo: o discriminante $\\Delta$ (delta).**\n\nO $\\Delta$ diz-nos quantas raízes a equação tem. Lembras-te da fórmula? Escreve-a (ou diz «não sei» e eu mostro).";
 if(etapa==="bh"){
  if(T.D===0)return "**Último passo: a fórmula de Bhaskara.**\n\nComo $\\Delta = 0$, usa-se:\n\n$$"+X+" = \\frac{-b}{2a}$$\n\nSubstituindo:\n\n$$"+X+" = \\frac{-"+lW(b)+"}{2 \\times "+lW(a)+"}$$\n\nQual é o valor de $"+X+"$?";
  return "**Último passo: a fórmula de Bhaskara.**\n\nComo $\\Delta > 0$, há duas raízes:\n\n$$"+X+" = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$\n\nAqui $\\sqrt{\\Delta} = "+s+"$.\n\nComeça pelo sinal +:\n\n$$"+X+"_1 = \\frac{-"+lW(b)+" + "+s+"}{2 \\times "+lW(a)+"}$$\n\nQual é o valor de $"+X+"_1$?";
 }
 return "";
}
function tSolucaoCorpo(e){
 var X=e.X,a=e.a,b=e.b,c=e.c,D=b*b-4*a*c;if(Math.abs(D)<1e-9)D=0;
 var o="**Primeiro passo: identificar os coeficientes.**\n\nA equação\n\n$$"+lTermos(a,b,c,X)+" = 0$$\n\ntem $a = "+lF(a)+"$, $b = "+lF(b)+"$ e $c = "+lF(c)+"$ (o **a** acompanha $"+X+"^2$, o **b** acompanha $"+X+"$ e o **c** é o termo sem $"+X+"$).";
 o+="\n\n**Segundo passo: o discriminante $\\Delta$.**\n\nA fórmula é $\\Delta = b^2 - 4ac$. Substituindo:\n\n$$\\Delta = "+lW(b)+"^2 - 4 \\times "+lW(a)+" \\times "+lW(c)+"$$\n\n$$\\Delta = "+lF(b*b)+" - "+lW(4*a*c)+" = "+lF(D)+"$$";
 if(D<0)return o+"\n\nComo o $\\Delta$ é **negativo**, não existe raiz quadrada real de $\\Delta$: a equação **não tem solução real**.\n\n**Resultado:** sem solução real";
 if(D===0){var x=-b/(2*a);return o+"\n\nComo o $\\Delta$ é **zero**, a equação tem uma **raiz dupla**.\n\n**Último passo: a fórmula de Bhaskara.**\n\n$$"+X+" = \\frac{-b}{2a}$$\n\n$$"+X+" = \\frac{-"+lW(b)+"}{2 \\times "+lW(a)+"} = \\frac{"+lF(-b)+"}{"+lF(2*a)+"} = "+lF(x)+"$$\n\n**Resultado:** $"+X+" = "+lF(x)+"$ (raiz dupla)"}
 var s=Math.sqrt(D),x1=(-b+s)/(2*a),x2=(-b-s)/(2*a);
 return o+"\n\nComo o $\\Delta$ é **positivo**, a equação tem **duas raízes reais diferentes**.\n\n**Último passo: a fórmula de Bhaskara.**\n\n$$"+X+" = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$\n\ncom $\\sqrt{\\Delta} = "+lF(s)+"$:\n\n$$"+X+"_1 = \\frac{-"+lW(b)+" + "+lF(s)+"}{2 \\times "+lW(a)+"} = \\frac{"+lF(-b+s)+"}{"+lF(2*a)+"} = "+lF(x1)+"$$\n\n$$"+X+"_2 = \\frac{-"+lW(b)+" - "+lF(s)+"}{2 \\times "+lW(a)+"} = \\frac{"+lF(-b-s)+"}{"+lF(2*a)+"} = "+lF(x2)+"$$\n\n**Resultado:** $"+X+"_1 = "+lF(x1)+"$ e $"+X+"_2 = "+lF(x2)+"$";
}
function tFim(msg){_tutor=null;return {texto:msg,fim:true,rac:"Terminei a resolução guiada."}}
function tSubst(a,b,c,r){
 var it=[[a,(Math.abs(a)===1?"":lF(Math.abs(a))+" \\times ")+lW(r)+"^2",a*r*r],[b,(Math.abs(b)===1?"":lF(Math.abs(b))+" \\times ")+lW(r),b*r],[c,lF(Math.abs(c)),c]].filter(function(t){return t[0]!==0});
 var l1="",l2="",tot=a*r*r+b*r+c,mag=Math.abs(a*r*r)+Math.abs(b*r)+Math.abs(c)+1;
 it.forEach(function(t,i){
  l1+=i===0?(t[0]<0?"-":"")+t[1]:" "+(t[0]<0?"-":"+")+" "+t[1];
  l2+=i===0?(t[2]<0?"-":"")+lF(Math.abs(t[2])):" "+(t[2]<0?"-":"+")+" "+lF(Math.abs(t[2]));
 });
 var ok=Math.abs(tot)<=1e-6*mag;
 return {tex:l1+" = "+l2+" = "+(ok?"0":lF(tot)),ok:ok};
}
function tTestes(e){
 var X=e.X,a=e.a,b=e.b,c=e.c,D=b*b-4*a*c;if(Math.abs(D)<1e-9)D=0;
 if(D<0)return null;
 var s=Math.sqrt(D),r1=(-b+s)/(2*a),r2=(-b-s)/(2*a),ok=true;
 var marca=function(v){return v?" \\;\\checkmark":" \\;\\text{falhou}"};
 var t1="**Teste 1: substituir na equação**\n\n";
 (D===0?[[r1,X]]:[[r1,X+"_1"],[r2,X+"_2"]]).forEach(function(p){
  var sb=tSubst(a,b,c,p[0]);if(!sb.ok)ok=false;
  t1+="Para $"+p[1]+" = "+lF(p[0])+"$:\n\n$$"+sb.tex+marca(sb.ok)+"$$\n\n";
 });
 var S=-b/a,P=c/a,tol=1e-6*(Math.abs(S)+Math.abs(P)+1);
 var okS=Math.abs(r1+r2-S)<=tol,okP=Math.abs(r1*r2-P)<=tol;
 if(!okS||!okP)ok=false;
 var t2="**Teste 2: soma e produto das raízes**\n\nA soma das raízes tem de ser $-\\frac{b}{a} = -\\frac{"+lW(b)+"}{"+lW(a)+"} = "+lF(S)+"$, e $"+X+"_1 + "+X+"_2 = "+lF(r1)+" + "+lW(r2)+" = "+lF(r1+r2)+"$ $"+marca(okS).replace(" \\;","")+"$.\n\nO produto tem de ser $\\frac{c}{a} = \\frac{"+lF(c)+"}{"+lF(a)+"} = "+lF(P)+"$, e $"+X+"_1 \\times "+X+"_2 = "+lF(r1)+" \\times "+lW(r2)+" = "+lF(r1*r2)+"$ $"+marca(okP).replace(" \\;","")+"$.";
 var fim=ok?"Os dois testes deram o mesmo resultado que a fórmula de Bhaskara, por isso a resposta está **correta** e podes usá-la com confiança.":"Algum teste não bateu, por isso **não te aconselho a usar esta resposta**.";
 var antes="Antes de te responder, deixa-me testar o resultado por dois caminhos diferentes: substituir as raízes na equação e conferir a soma e o produto das raízes.\n\n"+(ok?"Bom, os testes passaram e deram o mesmo resultado. Vou então mostrar-te os passos.":"Hmm, os testes não deram o mesmo resultado, por isso não te aconselho a usar esta resposta. Mesmo assim, aqui estão os passos para veres onde pode estar a diferença.")+"\n\n";
 var xs=D===0?X+" = "+tF(r1):X+"₁ = "+tF(r1)+" e "+X+"₂ = "+tF(r2);
 var et=["A testar o resultado por dois caminhos","Teste 1: a substituir "+xs+" na equação","Teste 2: a conferir a soma ("+tF(S)+") e o produto ("+tF(P)+") das raízes",ok?"Os testes passaram e deram o mesmo resultado":"Os testes não bateram: não recomendo esta resposta","A preparar a resposta com os cálculos"];
 return {ok:ok,etapas:et,antes:antes,depois:"**Sobre os testes**\n\n"+t1+t2+"\n\n"+fim};
}
var _etapasTestes=null;
function tSolucaoDe(e){
 var corpo=tSolucaoCorpo(e),t=tTestes(e);
 _etapasTestes=t?t.etapas:null;
 if(!t)return corpo;
 return t.antes+corpo+"\n\n"+t.depois;
}
function tSolucao(T,pref){var o=tSolucaoDe(T.q);_tutor=null;return {texto:(pref||"Está bem, resolvo eu, com os mesmos passos.")+"\n\n"+o,rac:"Resolvi sozinho, com os mesmos passos e sem perguntas.",etapas:_etapasTestes,g:tGraf(T.q)}}
/* testes genericos (2 caminhos) para os pedidos novos: a={d,t,c,ok}, b={d,t,c,ok}; c leva matematica em md(mx(..)) */
function eqn(a,b){return Math.abs(a-b)<=1e-6*(Math.abs(b)+1)}
function TT2(a,b){
 var ok=a.ok&&b.ok;
 var et=["A testar o resultado por dois caminhos","Teste 1: "+a.t,"Teste 2: "+b.t,ok?"Os testes passaram e deram o mesmo resultado":"Os testes não bateram: não recomendo esta resposta","A preparar a resposta com os cálculos"];
 var antes="Antes de te responder, deixa-me testar o resultado por dois caminhos diferentes: "+a.d+" e "+b.d+".\n\n"+(ok?"Bom, os testes passaram e deram o mesmo resultado. Vou então mostrar-te os passos.":"Hmm, os testes não deram o mesmo resultado, por isso não te aconselho a usar esta resposta. Mesmo assim, aqui estão os passos para veres onde pode estar a diferença.")+"\n\n";
 var fim=ok?"Os dois testes deram o mesmo resultado, por isso a resposta está **correta** e podes usá-la com confiança.":"Algum teste não bateu, por isso **não te aconselho a usar esta resposta**.";
 var mk=function(i,x){return "**Teste "+i+": "+x.t+"**\n\n"+x.c+(x.ok?" $\\checkmark$":" (falhou)")};
 return {ok:ok,etapas:et,antes:antes,depois:"**Sobre os testes**\n\n"+mk(1,a)+"\n\n"+mk(2,b)+"\n\n"+fim};
}
var T_ETAPA_TESTE=8000;
function comTestes(fm,corpo){
 var t=fm&&fm.tt;
 if(!t||!t.etapas||!t.etapas.length)return corpo;
 t.etapas.forEach(function(e){raciocinio(e,T_ETAPA_TESTE)});
 return t.antes+corpo+"\n\n"+t.depois;
}
/* testes da equacao do 1.o grau: substituir nos dois lados e conferir a forma simplificada */
function tTestes1(l,r,c1,c0,x,X){
 try{
  var av=function(p,v){var s=0;for(var k=p.length-1;k>=0;k--)s=s*v+(p[k]||0);return s};
  var le=av(l,x),ld=av(r,x),s2=c1*x+c0;
  if(!isFinite(le)||!isFinite(ld)||!isFinite(s2))return null;
  var ok1=Math.abs(le-ld)<=1e-6*(Math.abs(le)+Math.abs(ld)+1),ok2=Math.abs(s2)<=1e-6*(Math.abs(c1*x)+Math.abs(c0)+1),ok=ok1&&ok2;
  var sg=c0<0?"-":"+";
  var t1="**Teste 1: substituir na equação**\n\nPara $"+X+" = "+lF(x)+"$, o lado esquerdo vale $"+lF(le)+"$ e o lado direito vale $"+lF(ld)+"$"+(ok1?", por isso são iguais $\\checkmark$.":", por isso **não** são iguais (falhou).");
  var t2="**Teste 2: equação simplificada**\n\nDepois de passar tudo para o mesmo lado, a equação fica $"+(c1===1?"":c1===-1?"-":lF(c1))+X+" "+sg+" "+lF(Math.abs(c0))+" = 0$. Com $"+X+" = "+lF(x)+"$:\n\n$$"+lF(c1)+" \\times "+lW(x)+" "+sg+" "+lF(Math.abs(c0))+" = "+lF(s2)+(ok2?" \\checkmark":" \\text{falhou}")+"$$";
  var fim=ok?"Os dois testes deram o mesmo resultado, por isso a resposta está **correta** e podes usá-la com confiança.":"Algum teste não bateu, por isso **não te aconselho a usar esta resposta**.";
  var antes="Antes de te responder, deixa-me testar o resultado por dois caminhos diferentes: substituir "+X+" nos dois lados da equação e conferir a equação simplificada.\n\n"+(ok?"Bom, os testes passaram e deram o mesmo resultado. Vou então mostrar-te os passos.":"Hmm, os testes não deram o mesmo resultado, por isso não te aconselho a usar esta resposta. Mesmo assim, aqui estão os passos para veres onde pode estar a diferença.")+"\n\n";
  var et=["A testar o resultado por dois caminhos","Teste 1: a substituir "+X+" = "+tF(x)+" nos dois lados da equação","Teste 2: a conferir a equação simplificada ("+(c1===1?"":c1===-1?"−":tF(c1))+X+" "+(c0<0?"−":"+")+" "+tF(Math.abs(c0))+" = 0)",ok?"Os testes passaram e deram o mesmo resultado":"Os testes não bateram: não recomendo esta resposta","A preparar a resposta com os cálculos"];
  return {ok:ok,etapas:et,antes:antes,depois:"**Sobre os testes**\n\n"+t1+"\n\n"+t2+"\n\n"+fim};
 }catch(e){return null}
}
/* testes das contas simples: recalcular sobre a expressao e prova real com a operacao inversa */
function tTestesCalc(arv,v,D,F,W){
 var av=function(n){
  switch(n.t){
   case "n":return n.v;
   case "c":return Math.PI;
   case "g":return av(n.x);
   case "neg":return -av(n.x);
   case "p":{var a=av(n.x);if(n.op==="²")return a*a;if(n.op==="³")return a*a*a;if(n.op==="%")return a/100;throw 0}
   case "b":{var l=av(n.l),r=av(n.r);if(n.op==="+")return l+r;if(n.op==="-")return l-r;if(n.op==="*")return l*r;if(n.op==="/")return l/r;return Math.pow(l,r)}
   case "fn":{if(n.a.length!==1)throw 0;var x=av(n.a[0]);if(n.n==="sqrt")return Math.sqrt(x);if(n.n==="cbrt")return Math.cbrt(x);if(n.n==="abs")return Math.abs(x);throw 0}
  }
  throw 0;
 };
 var v1=av(arv);if(!isFinite(v1))return null;
 var ok=true,ok1=Math.abs(v1-v)<=1e-9*(Math.abs(v)+1);if(!ok1)ok=false;
 var top=arv;while(top&&top.t==="g")top=top.x;
 var t1="**Teste 1: recalcular a conta**\n\nRefiz a conta de novo, diretamente sobre a expressão "+md(mx(D(arv)))+", e deu "+md(mx(F(v1)))+(ok1?", o mesmo resultado (confere).":", diferente de "+md(mx(F(v)))+" (não confere).");
 var t2=null,txt="",nome="",inv=0,alvo=0;
 if(top.t==="b"&&"+-*/".indexOf(top.op)>=0){
  var l=av(top.l),r=av(top.r);
  if(top.op==="+"){inv=v-r;alvo=l;txt=F(v)+" − "+W(r)+" = "+F(inv);nome="Numa soma, o resultado menos uma parcela tem de dar a outra parcela."}
  else if(top.op==="-"){inv=v+r;alvo=l;txt=F(v)+" + "+W(r)+" = "+F(inv);nome="Numa subtração, o resultado mais o número que foi tirado tem de dar o número de partida."}
  else if(top.op==="*"&&r!==0){inv=v/r;alvo=l;txt=F(v)+" ÷ "+W(r)+" = "+F(inv);nome="Numa multiplicação, o resultado dividido por um fator tem de dar o outro fator."}
  else if(top.op==="/"){inv=v*r;alvo=l;txt=F(v)+" × "+W(r)+" = "+F(inv);nome="Numa divisão, o resultado vezes o divisor tem de dar o dividendo."}
 }else if(top.t==="fn"&&top.a.length===1&&(top.n==="sqrt"||top.n==="cbrt")){
  var xx=av(top.a[0]);
  if(top.n==="sqrt"){inv=v*v;alvo=xx;txt=W(v)+"² = "+F(inv);nome="Numa raiz quadrada, o resultado ao quadrado tem de dar o número que estava dentro da raiz."}
  else{inv=v*v*v;alvo=xx;txt=W(v)+"³ = "+F(inv);nome="Numa raiz cúbica, o resultado ao cubo tem de dar o número que estava dentro da raiz."}
 }else if(top.t==="p"&&(top.op==="²"||top.op==="³")){
  var xp=av(top.x);
  if(top.op==="²"){inv=Math.sqrt(v);alvo=Math.abs(xp);txt="√"+F(v)+" = "+F(inv);nome="Num quadrado, a raiz quadrada do resultado tem de dar o número de partida (sem sinal)."}
  else{inv=Math.cbrt(v);alvo=xp;txt="∛"+F(v)+" = "+F(inv);nome="Num cubo, a raiz cúbica do resultado tem de dar o número de partida."}
 }
 if(nome){
  var ok2=Math.abs(inv-alvo)<=1e-6*(Math.abs(alvo)+1);if(!ok2)ok=false;
  t2="**Teste 2: prova real**\n\n"+nome+" Aqui: "+md(mx(txt))+", e o valor esperado é "+md(mx(F(alvo)))+(ok2?" (confere).":" (não confere).");
 }
 var n=t2?2:1;
 var fim=ok?(n===2?"Os dois testes deram":"O teste deu")+" o mesmo resultado, por isso a resposta está **correta** e podes usá-la com confiança.":"Algum teste não bateu, por isso **não te aconselho a usar esta resposta**.";
 var antes="Antes de te responder, deixa-me testar o resultado"+(n===2?" por dois caminhos diferentes: recalcular a conta de novo e fazer a prova real com a operação inversa.":" recalculando a conta de novo.")+"\n\n"+(ok?"Bom, "+(n===2?"os testes passaram e deram":"o teste passou e deu")+" o mesmo resultado. Vou então mostrar-te os passos.":"Hmm, os testes não deram o mesmo resultado, por isso não te aconselho a usar esta resposta. Mesmo assim, aqui estão os passos para veres onde pode estar a diferença.")+"\n\n";
 var et=[n===2?"A testar o resultado por dois caminhos":"A testar o resultado","Teste 1: a recalcular a conta de novo"].concat(t2?["Teste 2: a fazer a prova real com a operação inversa"]:[],[ok?(n===2?"Os testes passaram e deram o mesmo resultado":"O teste passou e deu o mesmo resultado"):"Os testes não bateram: não recomendo esta resposta","A preparar a resposta com os cálculos"]);
 return {ok:ok,etapas:et,antes:antes,depois:"**Sobre os testes**\n\n"+t1+(t2?"\n\n"+t2:"")+"\n\n"+fim};
}
/* Grafico da parabola no fim da resolucao: bloco XLang com a lib xlang-grafico (carregada do CDN pelo interpretador). */
function tGraf(q){
 var n=function(v){return String(+(+v).toFixed(6))};
 return '<script type="text/xlang"><program><import name="xlang.grafico"></import><print>{plotParabola('+n(q.a)+', '+n(q.b)+', '+n(q.c)+')}</print></program><\/script>';
}
function tutorIniciar(fx){
 var e=fx.q,D=e.b*e.b-4*e.a*e.c;if(Math.abs(D)<1e-9)D=0;
 _tutor={q:e,fx:fx,etapa:"oferta",erros:0,D:D,t:Date.now(),x1:null,x2:null};
 var eqt=tTermos(e.a,e.b,e.c,e.X).replace(/&/g,"&amp;").replace(/</g,"&lt;");
 return {texto:"",html:'<div class="ask-intro"><b>Boa!</b> Temos uma equação do 2.º grau: <span class="lume-math" data-tex="'+lx(tTermos(e.a,e.b,e.c,e.X)+" = 0").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;")+'">'+eqt+' = 0</span>.<br>Como preferes resolver este exercício?</div><div class="ask-opcoes"><div class="ask-opcao" role="button" data-botql-ask="Resolver juntos, passo a passo">Resolver juntos, passo a passo</div><div class="ask-opcao" role="button" data-botql-ask="O Lume resolve sozinho">O Lume resolve sozinho</div></div>',rac:"Reconheci uma equação do 2.º grau e fiz uma sondagem: resolver juntos ou eu resolver sozinho."};
}
function tutorResponder(txt){
 var T=_tutor;if(!T)return null;
 T.t=Date.now();
 if(T.tipo==="fis"){var rf=window.LumeFisica?window.LumeFisica.responder(T,txt,{fim:function(){_tutor=null}}):null;if(!rf)_tutor=null;return rf}
 var n=tNorm(txt),e=T.q,X=e.X,a=e.a,b=e.b,c=e.c,D=T.D;
 if(/^(sair|cancelar|cancela|parar|para|esquece|esquece isso|deixa|deixa estar|chega|nao quero continuar)$/.test(n))return tFim("Combinado, ficamos por aqui. Quando quiseres, escreve outra equação.");
 if(/^(resolve tu|resolve|resolve por mim|faz tu|mostra tudo|mostra a solucao|mostra a resolucao|diz a solucao|diz a resposta|resolve tudo)$/.test(n))return tSolucao(T);
 var fmN=null;try{fmN=funcaoMatematica(txt)}catch(_){}
 if(fmN&&fmN.q){_tutor=null;return null}
 var naoSei=/^(nao sei|sei la|nao me lembro|nao lembro|ajuda|ajuda me|dica|nao faco ideia|nao consigo)$/.test(n);
 var palavras=n.split(" ").filter(Boolean).length;
 if(T.etapa==="oferta"){
  if(/^(sim|s|claro|bora|vamos|ok|pode ser|quero|vamos la|vamos sim|bora la|vamos a isso|sim vamos|sim quero|ya|yes|resolver juntos|resolver juntos,? passo a passo|juntos|passo a passo|resolvemos juntos)$/.test(n)){T.etapa="coef";return {texto:tPasso(T,"coef"),rac:"Passo 1: identificar os coeficientes a, b e c."}}
  if(/^(nao|n|agora nao|nao quero|nao obrigado|diretamente|direto|o lume resolve sozinho|lume resolve sozinho|resolve sozinho|sozinho|resolve tu sozinho)$/.test(n))return tSolucao(T);
  if(palavras>=3){_tutor=null;return null}
  return {texto:"Escolhe: **resolver juntos** ou **o Lume resolve sozinho**."};
 }
 if(T.etapa==="coef"){
  var got={},re=/\b([abc])\s*[=:]\s*(-|−)?\s*(\d+(?:[.,]\d+)?(?:\/\d+)?)/g,mm,txt2=String(txt).toLowerCase().replace(/[−–]/g,"-");
  while((mm=re.exec(txt2)))got[mm[1]]=tNum((mm[2]?"-":"")+mm[3]);
  if(Object.keys(got).length<3){var ns=tNumeros(txt2);if(ns.length===3&&palavras<=8)got={a:ns[0],b:ns[1],c:ns[2]}}
  var certo=function(){return "Os coeficientes são $a = "+lF(a)+"$, $b = "+lF(b)+"$ e $c = "+lF(c)+"$."};
  var seguir=function(pre){T.etapa="deltaf";T.erros=0;return {texto:pre+"\n\n"+tPasso(T,"deltaf"),rac:"Passo 2: o discriminante Δ."}};
  if(naoSei)return seguir(certo());
  if(Object.keys(got).length<3){
   if(palavras>=5){_tutor=null;return null}
   return {texto:"Não percebi. Escreve os três valores assim: a = 3, b = −4, c = 7."};
  }
  if(Math.abs(got.a-a)<1e-9&&Math.abs(got.b-b)<1e-9&&Math.abs(got.c-c)<1e-9)return seguir("**"+tElogio()+"** "+certo());
  T.erros++;
  var errados=["a","b","c"].filter(function(k){return Math.abs(got[k]-({a:a,b:b,c:c})[k])>1e-9});
  if(T.erros>=2)return seguir("Sem problema. "+certo());
  return {texto:"Quase. "+(errados.length===1?"Revê o **"+errados[0]+"**":"Revê o "+errados.map(function(k){return "**"+k+"**"}).join(" e o "))+": o **a** acompanha "+X+"², o **b** acompanha "+X+" e o **c** é o termo sem "+X+". Atenção ao sinal. Tenta outra vez.",rac:"Os coeficientes estavam errados; dei uma pista."};
 }
 if(T.etapa==="deltaf"){
  var f=txt.toLowerCase().replace(/[−–]/g,"-").replace(/[\s*·×.]/g,"").replace(/\^2/g,"2").replace(/²/g,"2").replace(/^(delta|δ|d|Δ)=/i,"");
  var okf=/^b2-4ac$/.test(f);
  var pref;
  if(okf)pref="**"+tElogio()+"** A fórmula é $\\Delta = b^2 - 4ac$.";
  else if(naoSei||T.erros>=1)pref="A fórmula é $\\Delta = b^2 - 4ac$.";
  else{T.erros++;return {texto:"Não é bem essa. Pensa: o Δ usa o **b** ao quadrado e subtrai quatro vezes o **a** e o **c**. Tenta outra vez ou diz «não sei».",rac:"A fórmula do Δ não estava certa; dei uma pista."}}
  var sub="Substituindo:\n\n$$\\Delta = "+lW(b)+"^2 - 4 \\times "+lW(a)+" \\times "+lW(c)+"$$\n\n$$\\Delta = "+lF(b*b)+" - "+lW(4*a*c)+" = "+lF(D)+"$$";
  if(D<0){var r={texto:pref+"\n\n"+sub+"\n\nComo o $\\Delta$ é **negativo**, não existe raiz quadrada real de $\\Delta$: a equação **não tem solução real**.\n\n**Resultado:** sem solução real\n\nPara outra equação, é só escrevê-la.",rac:"Δ negativo: sem solução real; terminei a resolução.",g:tGraf(T.q)};_tutor=null;return r}
  T.etapa="bh";T.erros=0;
  var interp=D===0?"Como o $\\Delta$ é **zero**, a equação tem uma **raiz dupla**.":"Como o $\\Delta$ é **positivo**, a equação tem **duas raízes reais diferentes**.";
  return {texto:pref+"\n\n"+sub+"\n\n"+interp+"\n\n"+tPasso(T,"bh"),rac:"Passo 3: aplicar a fórmula de Bhaskara."};
 }
 if(T.etapa==="bh"||T.etapa==="bh2"){
  var alvo=D===0?-b/(2*a):T.etapa==="bh"?(-b+Math.sqrt(D))/(2*a):(-b-Math.sqrt(D))/(2*a);
  var nome=D===0?X:T.etapa==="bh"?X+"₁":X+"₂",nomeL=D===0?X:T.etapa==="bh"?X+"_1":X+"_2";
  var ns2=tNumeros(String(txt).replace(/[x][12₁₂]?\s*=/gi," ")),v=ns2.length&&palavras<=8?ns2[ns2.length-1]:null;
  var acertou=v!==null&&Math.abs(v-alvo)<0.01;
  function avancar(pre){
   if(D===0){var r2={texto:pre+"\n\n**Resultado:** $"+X+" = "+lF(alvo)+"$ (raiz dupla)\n\nPara outra equação, é só escrevê-la.",rac:"Terminei: raiz dupla.",g:tGraf(T.q)};_tutor=null;return r2}
   if(T.etapa==="bh"){
    T.x1=alvo;T.etapa="bh2";T.erros=0;
    return {texto:pre+"\n\nAgora o **sinal −**:\n\n$$"+X+"_2 = \\frac{-"+lW(b)+" - "+lF(Math.sqrt(D))+"}{2 \\times "+lW(a)+"}$$\n\nQual é o valor de $"+X+"_2$?",rac:"Passo 3b: a segunda raiz."};
   }
   var r3={texto:pre+"\n\n**Resultado:** $"+X+"_1 = "+lF(T.x1)+"$ e $"+X+"_2 = "+lF(alvo)+"$\n\nPara outra equação, é só escrevê-la.",rac:"Terminei: duas raízes.",g:tGraf(T.q)};_tutor=null;return r3;
  }
  if(acertou)return avancar("**"+(D===0?"Acertaste em cheio!":tElogio())+"** $"+nomeL+" = "+lF(alvo)+"$.");
  if(naoSei||T.erros>=1)return avancar("Sem problema: $"+nomeL+" = "+lF(alvo)+"$.");
  if(v===null){if(palavras>=5){_tutor=null;return null}return {texto:"Escreve só o valor numérico de $"+nomeL+"$."}}
  T.erros++;
  return {texto:"Ainda não. Calcula primeiro o **numerador** $-"+lW(b)+(D===0?"":(T.etapa==="bh"?" + ":" - ")+lF(Math.sqrt(D)))+" = "+lF(-b+(D===0?0:(T.etapa==="bh"?1:-1)*Math.sqrt(D)))+"$ e o **denominador** $2 \\times "+lW(a)+" = "+lF(2*a)+"$. Depois divide. Tenta outra vez.",rac:"O valor não estava certo; mostrei o numerador e o denominador."};
 }
 _tutor=null;return null;
}
/* Contas com passos: responde em texto simples; o chat passa-o pelo formatador (lista, destaque do resultado). */
/* ===== Contas em LaTeX (KaTeX) =====
   mx(s) marca um pedaco de matematica dentro de um passo; md(s) troca as marcas por $...$.
   lx(s) converte matematica em texto (×, ÷, −, ², √, Δ, vírgula decimal...) para LaTeX. */
var MA="\u27e6",MB="\u27e7";
function mx(s){return MA+s+MB}
function lx(s){
 var SP={"⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9"},SB={"₀":"0","₁":"1","₂":"2","₃":"3","₄":"4","₅":"5","₆":"6","₇":"7","₈":"8","₉":"9"};
 s=String(s==null?"":s).replace(/[−–]/g,"-");
 s=s.replace(/(\d),(\d)/g,"$1{,}$2");
 s=s.replace(/\(-b ([+-]) √Δ\) ÷ 2a/g,"\\frac{-b $1 \\sqrt{\\Delta}}{2a}").replace(/-b ÷ 2a/g,"\\frac{-b}{2a}");
 s=s.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)?√(\([^()]*\)|\d+(?:\{,\}\d+)?|Δ|[a-z])/g,function(_,i,o){o=o.charAt(0)==="("?o.slice(1,-1):o;var ix=i?i.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,function(c){return SP[c]}):"";return "\\sqrt"+(ix?"["+ix+"]":"")+"{"+o+"}"});
 s=s.replace(/∛(\([^()]*\)|\d+(?:\{,\}\d+)?)/g,function(_,o){return "\\sqrt[3]{"+(o.charAt(0)==="("?o.slice(1,-1):o)+"}"});
 s=s.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,function(m){return "^{"+m.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,function(c){return SP[c]})+"}"});
 s=s.replace(/\^(\d+)/g,"^{$1}");
 s=s.replace(/([₀₁₂₃₄₅₆₇₈₉]+)/g,function(m){return "_{"+m.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,function(c){return SB[c]})+"}"});
 s=s.replace(/\b(asin|acos|atan)\(/g,function(_,n){return "\\arc"+n.slice(1)+"("});
 s=s.replace(/\b(sin|cos|tan|ln|log|exp)(?=[(_])/g,"\\$1");
 s=s.replace(/\bsen\(/g,"\\operatorname{sen}(").replace(/\b(arredondar|floor|ceil|max|min|mmc|mdc|abs|round|mediana)\(/g,"\\operatorname{$1}(");
 s=s.replace(/×/g," \\times ").replace(/÷/g," \\div ").replace(/·/g," \\cdot ").replace(/\*/g," \\times ").replace(/π/g,"\\pi ").replace(/Δ/g,"\\Delta ").replace(/°/g,"^{\\circ}").replace(/%/g,"\\%").replace(/≈/g," \\approx ");
 s=s.replace(/\brad\b/g,"\\text{ rad}").replace(/(\S) e (?=\S)/g,"$1 \\text{ e } ");
 s=s.replace(/;\s+/g,";\\ ").replace(/,\s+/g,",\\ ").replace(/\s+/g," ").trim();
 return s;
}
function md(s){return String(s==null?"":s).split(/[\u27e6\u27e7]/).map(function(p,i){return i%2?"$"+lx(p)+"$":p}).join("")}
function limparMarcas(x){return typeof x==="string"?x.replace(/[\u27e6\u27e7]/g,""):x}
/* avalia expressoes da xlang-math (sqr, pow, lcm, median...) em JavaScript, sem eval */
var FN={sqr:Math.sqrt,cbr:Math.cbrt,pow:Math.pow,sin:Math.sin,cos:Math.cos,tan:Math.tan,log:Math.log,log10:Math.log10,log2:Math.log2,hypot:Math.hypot,max:Math.max,min:Math.min,
 radians:function(d){return d*Math.PI/180},PI:function(){return Math.PI},
 round:function(x,c){var k=Math.pow(10,c||0);return Math.round(x*k)/k},
 factorial:function(n){var r=1;for(var i=2;i<=n;i++)r*=i;return r},
 gcd:function(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t}return a},
 lcm:function(a,b){return a&&b?Math.abs(a*b)/FN.gcd(a,b):0},
 median:function(){var a=[].slice.call(arguments).sort(function(x,y){return x-y}),n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2},
 range:function(){return Math.max.apply(null,arguments)-Math.min.apply(null,arguments)},
 variance:function(){var a=[].slice.call(arguments),m=a.reduce(function(x,y){return x+y},0)/a.length;return a.reduce(function(x,y){return x+(y-m)*(y-m)},0)/a.length},
 std:function(){return Math.sqrt(FN.variance.apply(null,arguments))},
 sampleVariance:function(){var a=[].slice.call(arguments),m=a.reduce(function(x,y){return x+y},0)/a.length;return a.reduce(function(x,y){return x+(y-m)*(y-m)},0)/(a.length-1)},
 sampleStd:function(){return Math.sqrt(FN.sampleVariance.apply(null,arguments))}};
function avaliarF(src){
 var s=String(src||""),i=0;
 function ws(){while(s.charAt(i)===" ")i++}
 function prim(){ws();var c=s.charAt(i);
  if(c==="("){i++;var v=soma();ws();if(s.charAt(i)!==")")throw 0;i++;return v}
  if(c==="-"){i++;return -prim()}
  if(c==="+"){i++;return prim()}
  if(/[0-9]/.test(c)){var m=/^\d+(?:\.\d+)?/.exec(s.slice(i));i+=m[0].length;return parseFloat(m[0])}
  var n=/^[a-zA-Z_]\w*/.exec(s.slice(i));if(!n||!FN.hasOwnProperty(n[0]))throw 0;i+=n[0].length;ws();if(s.charAt(i)!=="(")throw 0;i++;
  var args=[];ws();if(s.charAt(i)!==")"){for(;;){args.push(soma());ws();if(s.charAt(i)===","){i++;continue}break}}
  ws();if(s.charAt(i)!==")")throw 0;i++;return FN[n[0]].apply(null,args)}
 function termo(){var v=prim();for(;;){ws();var c=s.charAt(i);if(c==="*"){i++;v*=prim()}else if(c==="/"){i++;v/=prim()}else return v}}
 function soma(){var v=termo();for(;;){ws();var c=s.charAt(i);if(c==="+"){i++;v+=termo()}else if(c==="-"){i++;v-=termo()}else return v}}
 try{var r=soma();ws();return i===s.length&&isFinite(r)?r:null}catch(e){return null}
}
function respostaSimples(fm){
 if(typeof fm.v==="number"&&isFinite(fm.v)&&!(fm.p&&fm.p.length))return "Li a conta como: "+md(fm.m)+"\n\n**Resultado:** $"+lx(tF(fm.v))+"$";
 if(fm.f&&fm.p===undefined){var v=avaliarF(fm.f);if(v===null)return null;var r=lx(tF(v));
  return fm.tx?"**Li o pedido como:** "+fm.m+"\n\n$$"+fm.tx+" = "+r+"$$":"O resultado de "+fm.m+" é $"+r+"$."}
 return null;
}
/* "10 mais 5", "calcula 15 vezes 4", "media de 4, 6 e 8": a mesma regra do calculo.txt, mas em LaTeX */
function contaPorPalavras(q){
 var t=norm(q),nums=(typeof window.numerosDaPergunta==="function"?window.numerosDaPergunta(q):(t.match(/-?\d+(?:[.,]\d+)?/g)||[]).map(function(x){return parseFloat(x.replace(",","."))})).filter(function(x){return isFinite(x)});
 if(nums.length<2)return null;
 var n1=nums[0],n2=nums[1],v,tex,w=function(a){return a.map(function(x,i){return i?lW(x):lF(x)})};
 if(/dividido/.test(t)){if(n2===0)return "Não dá para dividir por zero.";v=n1/n2;tex=lF(n1)+" \\div "+lW(n2)}
 else if(/vezes/.test(t)){v=nums.reduce(function(a,b){return a*b},1);tex=w(nums).join(" \\times ")}
 else if(/menos/.test(t)){v=n1-n2;tex=lF(n1)+" - "+lW(n2)}
 else if(/media/.test(t)){v=nums.reduce(function(a,b){return a+b},0)/nums.length;tex="\\frac{"+nums.map(lF).join(" + ")+"}{"+nums.length+"}"}
 else{v=nums.reduce(function(a,b){return a+b},0);tex=w(nums).join(" + ")}
 if(!isFinite(v))return null;
 return "Li a conta como: $"+tex+"$\n\n**Resultado:** $"+lF(v)+"$";
}
function textoConta(fm){
 if(fm.e&&!(fm.p&&fm.p.length))return fm.e;
 var seq=[],notas=[],res=fm.r||"";
 (fm.p||[]).forEach(function(x){if(/^(Primeiro|Depois|Por fim):/.test(x))seq.push(x);else notas.push(x)});
 if(!res&&seq.length){var u=seq[seq.length-1],g=u.match(/\u27e6[^\u27e6\u27e7]*\u27e7/g),mm=g?g[g.length-1].slice(1,-1):u,i=mm.lastIndexOf(" = ");if(i>=0)res=mx(mm.slice(i+3))}
 var passos=seq.map(function(x){var m=/^(Primeiro|Depois|Por fim): ([\s\S]*)$/.exec(x);return "- **"+m[1]+":** "+md(m[2])}).join("\n");
 var o="Li a conta como: "+md(fm.m)+"\n\n"+passos;
 if(res)o+="\n\n**Resultado:** "+md(res);
 if(notas.length)o+="\n\n"+notas.join(" ");
 return o;
}
/* ===== Pedidos visuais por intencao: tabelas e graficos (xlang-tabela / xlang-grafico, via CDN) =====
   Nao depende de frases: procura o substantivo (tabela, grafico...) e le os dados que vierem com ele
   (numeros soltos, linhas com colunas, pares nome-valor, uma funcao). */
function visTxt(s){return String(s==null?"":s).replace(/[<>"{}\\&`]/g," ").replace(/'/g,"’").replace(/\s+/g," ").trim()}
function visLit(s){var t=visTxt(s);return /^-?\d+(?:\.\d+)?$/.test(t)?t:"'"+t+"'"}
function visCols(l){
 l=String(l).trim();var p;
 if(/\t/.test(l))p=l.split(/\t+/);else if(/[;|]/.test(l))p=l.split(/\s*[;|]\s*/);else if(/\s{2,}/.test(l))p=l.split(/\s{2,}/);else p=[l];
 return p.map(visTxt).filter(Boolean);
}
function visLinhas(q0){
 var ls=String(q0).split(/\r?\n/).map(function(x){return x.trim()}).filter(Boolean);
 if(ls.length<3)return null;
 var dados=ls.slice(1),cab=null;
 if(!/\d/.test(dados[0])){cab=visCols(dados[0].replace(/[.:]+\s*$/,"").replace(/[.:](\s{2,})/,"$1"));dados=dados.slice(1)}
 if(!dados.length||dados.length>60)return null;
 var k=cab&&cab.length>1?cab.length:Math.max.apply(null,dados.map(function(l){return visCols(l).length}));
 var rows=dados.map(function(l){
  var c=visCols(l);
  if(c.length<2||c.length<k){
   var m=k===2&&/^(.*?)\s+(-?\d+(?:[.,]\d+)?(?:\s+[^\s\d]+)?)$/.exec(l);
   if(m)c=[visTxt(m[1]),visTxt(m[2])];
   else{var tk=l.split(/\s+/).map(visTxt);if(tk.length===k)c=tk}
  }
  while(c.length<k)c.push("");
  return c.slice(0,6);
 });
 k=Math.min(k,6);
 if(k<2)return null;
 if(!cab)cab=[];while(cab.length<k)cab.push("Coluna "+(cab.length+1));
 return {cab:cab.slice(0,k),rows:rows.map(function(r){return r.slice(0,k)})};
}
function visNums(t){
 var out=[],re=/-?\d+(?:,\d+)+|-?\d+(?:\.\d+)?/g,m;
 while((m=re.exec(String(t)))!==null){
  var x=m[0];
  if(x.indexOf(",")>=0){var ps=x.split(",");if(ps.length>=3)ps.forEach(function(v){out.push(parseFloat(v))});else out.push(parseFloat(ps[0]+"."+ps[1]))}
  else out.push(parseFloat(x));
 }
 return out.filter(function(x){return isFinite(x)&&Math.abs(x)<=1e12});
}
function visEquacao(t){
 var tk=String(t).split(/\s+/),ini=-1,fim=-1;
 function mat(x){return /^(?:f\(x\)|[xy]|[\d(+\-−*\/^.,=²³fxy)]+)$/i.test(x)}
 for(var i=0;i<tk.length;i++){
  if(!mat(tk[i])){if(ini>=0&&/[xy]/i.test(tk.slice(ini,fim+1).join("")))break;ini=-1;continue}
  if(ini<0)ini=i;fim=i;
 }
 if(ini<0)return null;
 var e=tk.slice(ini,fim+1).join("");
 return /[xy]/i.test(e)?e.replace(/[.,]+$/,""):null;
}
function visProg(corpo){return '<script type="text/xlang"><program>'+corpo+'</program><\/script>'}
function pedidoVisual(q0){
 q0=String(q0||"");if(q0.length>3000)return null;
 var t=norm(q0),tab=/\b(tabela|tabelas|quadro|grelha)\b/.test(t),gra=/\b(grafico|graficos|plot|plote|curva|parabola|histograma|diagrama)\b/.test(t);
 if(!tab&&!gra)return null;
 var imp=function(n){return '<import name="xlang.'+n+'"></import>'};
 if(tab&&!gra){
  if(/\b(verdade|periodica|nutricional|classificacao|campeonato|precos?)\b/.test(t))return null;
  if(/\b(multiplicacao|multiplicar|tabuada)\b/.test(t)){var mn=visNums(t)[0];if(mn!==undefined&&Number.isInteger(mn)&&mn>=0&&mn<=1000)return{rac:"Pediste a tabuada; montei a tabela.",html:[visProg(imp("tabela")+"<print>{tabMultiplication("+mn+", 10)}</print>")]}}
  var L=visLinhas(q0);
  if(L){
   var h="["+L.cab.map(visLit).join(", ")+"]",r="["+L.rows.map(function(x){return "["+x.map(visLit).join(", ")+"]"}).join(", ")+"]";
   return{rac:"Li as linhas e as colunas que escreveste e organizei-as numa tabela.",html:[visProg(imp("tabela")+'<array name="h" value="'+h+'"></array><array name="r" value="'+r+'"></array><print>{tabTable(h, r)}</print>')]};
  }
  var ns=visNums(t);
  if(ns.length>=2&&ns.length<=60){
   var v="["+ns.map(function(x){return String(+(+x).toFixed(8))}).join(", ")+"]",rep=ns.some(function(x,i){return ns.indexOf(x)!==i});
   var calc=/\b(media|mediana|moda|variancia|desvio|amplitude|estatistic|resumo|calcul\w*|soma|maximo|minimo)\b/.test(t),am=/amostra/.test(t);
   var rows2="["+ns.map(function(x,i){return "["+(i+1)+", "+(+(+x).toFixed(8))+"]"}).join(", ")+"]";
   var c="<array name=\"v\" value=\""+v+"\"></array><array name=\"r\" value=\""+rows2+"\"></array><print>{tabTable(['n', 'Valor'], r, 'Valores')}</print>";
   if(rep||calc)c+="<print>{tabFrequencies(v)}</print>";
   if(calc)c+="<print>{tabStats(v, "+(am?"true":"false")+")}</print>";
   return{rac:"Organizei os números numa tabela"+(calc?" e calculei as medidas estatísticas.":"."),html:[visProg(imp("tabela")+c)]};
  }
  return null;
 }
 if(gra){
  var eq=visEquacao(t);
  if(eq){
   var gr=null;try{gr=graficoFuncao("grafico de "+eq)}catch(_){}
   if(gr&&!gr.e&&gr.c){
    var n8=function(x){return String(+(+x).toFixed(8))},cc=gr.c;
    var fn=cc[2]!==0?"plotParabola("+n8(cc[2])+", "+n8(cc[1])+", "+n8(cc[0])+")":"plotLinear("+n8(cc[1])+", "+n8(cc[0])+")";
    return{rac:"Percebi que queres o gráfico da função e li a expressão que escreveste.",html:[visProg(imp("grafico")+"<print>{"+fn+"}</print>")]};
   }
   return null;
  }
  var D=null;
  var src=q0.split(/\r?\n/).map(function(x){return x.trim()}).filter(Boolean);
  if(src.length>=3){
   var pares=src.slice(1).map(function(l){var c=visCols(l);if(c.length>=2&&isFinite(parseFloat(c[1].replace(",","."))))return[c[0],parseFloat(c[1].replace(",","."))];var m=/^(.*?)\s+(-?\d+(?:[.,]\d+)?)\s*\S*$/.exec(l);return m?[visTxt(m[1]),parseFloat(m[2].replace(",","."))]:null});
   if(pares.every(Boolean)&&pares.length>=2&&pares.length<=30)D=pares;
  }
  if(D){
   var lb="["+D.map(function(p){return "'"+visTxt(p[0])+"'"}).join(", ")+"]",vl="["+D.map(function(p){return +p[1].toFixed(8)}).join(", ")+"]";
   var pie=/\b(pizza|torta|circular|setores)\b/.test(t)&&D.every(function(p){return p[1]>=0});
   return{rac:"Li os nomes e os valores que escreveste e desenhei o gráfico.",html:[visProg(imp("grafico")+'<array name="l" value="'+lb+'"></array><array name="v" value="'+vl+'"></array><print>{'+(pie?"plotPie":"plotBars")+"(l, v)}</print>")]};
  }
 }
 return null;
}
/* Nivel do modelo (Flash, Lume, X): o despachante respeita-o. Flash: so o resultado, sem raciocinio,
   sem testes, sem esbocos, sem tabelas/graficos e sem tutor. */
var _racOrig=raciocinio;
function nivelModelo(){try{return window.lumeModeloAtual?window.lumeModeloAtual():"lume"}catch(e){return "lume"}}
function soResultado(t){
 var ps=String(t||"").split(/\n\n+/),r=ps.filter(function(x){return /^\*\*Resultado/.test(x)});
 if(r.length)return r.join("\n\n");
 var f=ps.filter(function(x){return /^\*\*[a-d]\)/.test(x)});
 return f.length?f.join("\n\n"):ps[ps.length-1];
}
/* Lume X: nao concorda por agradar; corrige afirmacoes erradas */
function afirmacaoErrada(q){
 var t=norm(q).replace(/[?!.]+$/,"").replace(/\b(certo|nao e|nao)$/,"").replace(/^(sabes que|sabias que|e verdade que|e verdade|confirma)\s+/,"").trim();
 var m=/^(\d+(?:[.,]\d+)?)\s*([+\-*x\/])\s*(\d+(?:[.,]\d+)?)\s*=\s*(\d+(?:[.,]\d+)?)$/.exec(t);
 if(m){var A=parseFloat(m[1].replace(",",".")),B=parseFloat(m[3].replace(",",".")),R=parseFloat(m[4].replace(",",".")),o=m[2],v=o==="+"?A+B:o==="-"?A-B:o==="/"?(B?A/B:NaN):A*B;
  if(isFinite(v)){v=Math.round(v*1e9)/1e9;var f=function(n){return String(n).replace(".",",")};return Math.abs(v-R)<1e-9?"Correto: "+f(A)+" "+(o==="x"?"×":o)+" "+f(B)+" = "+f(R)+".":"Não está certo. "+f(A)+" "+(o==="x"?"×":o==="/"?"÷":o)+" "+f(B)+" = **"+f(v)+"**, não "+f(R)+"."}}
 var L=[[/\b(peso e (a )?mesma coisa que (a )?massa|massa e peso (sao )?(a )?mesma coisa|peso e massa sao (a )?mesma coisa)/,"Não concordo. **Massa** (kg) é a quantidade de matéria e não muda; **peso** (N) é a força da gravidade, $P = m\\cdot g$, e varia com o local."],
 [/\b(corpos?|objetos?) (mais )?pesados? caem (mais )?(rapido|depressa)/,"Não, no vazio todos os corpos caem com a mesma aceleração $g$. Só a resistência do ar faz diferença."],
 [/\b(sem forca nao ha movimento|para (haver|existir) movimento (e preciso|precisa) de forca)/,"Falso. Pela 1.ª lei de Newton, sem força resultante o corpo mantém o movimento retilíneo uniforme. A força muda o movimento, não o mantém."],
 [/\bvelocidade e aceleracao (sao )?(a )?mesma coisa\b/,"Não. Velocidade é quanto a posição varia no tempo ($v=\\Delta x/\\Delta t$); aceleração é quanto a velocidade varia ($a=\\Delta v/\\Delta t$)."],
 [/\bcalor e temperatura (sao )?(a )?mesma coisa\b/,"Não. **Temperatura** mede a agitação média das partículas; **calor** é energia em trânsito entre corpos a temperaturas diferentes."]];
 for(var i=0;i<L.length;i++)if(L[i][0].test(t))return L[i][1];
 return null;
}
async function tentar(q){
 var _q0=q,NV=nivelModelo(),FL=NV==="flash",raciocinio=FL?function(){}:_racOrig;
 if(NV==="x"){var _nx=0;raciocinio=function(t,ms){_nx++;return _racOrig("["+_nx+"] "+t,ms)};
  try{if(typeof window.lumeOnReply==="function"&&q.length<=160){var _er=afirmacaoErrada(q);if(_er){raciocinio("Li uma afirmação e vou verificá-la antes de responder, sem concordar só por concordar.");raciocinio("Conferi a conta ou o conceito e a minha verificação "+(/^Correto/.test(_er)?"confirma":"contradiz")+" o que disseste.");window.lumeOnReply({text:_er});return true}}}catch(_){}
  raciocinio("Vou interpretar o pedido, procurar premissas falsas e só depois resolver.")}
 q=coloquial(q);
 if(!FL&&typeof window.lumeOnReply==="function"&&window.lumeTutorAtivo()){var rt=tutorResponder(q);if(rt){if(rt.etapas&&rt.etapas.length)rt.etapas.forEach(function(e){raciocinio(e,T_ETAPA_TESTE)});else if(rt.rac)raciocinio(rt.rac);window.lumeOnReply({text:rt.texto});if(rt.g)window.lumeOnReply({html:rt.g});return true}}
 var _vis=null;try{_vis=pedidoVisual(_q0)}catch(_){}
 if(_vis&&typeof window.lumeOnReply==="function"){raciocinio(_vis.rac);_vis.html.forEach(function(h){window.lumeOnReply({html:h})});return true}
 var DL=window.LumeDialogo;
 if(DL&&typeof window.lumeOnReply==="function"){
  var etp=window.lumeAtualizarEtapa,esp=function(t){etp&&etp(t);return Promise.resolve()};
  var rc=DL.recuperar&&DL.recuperar(q);
  if(rc){await esp("Perguntaste o que sei de ti; vou procurar na memória.");await esp(rc.achou?"Encontrei "+rc.n+(rc.n===1?" facto guardado: ":" factos guardados: ")+rc.rots+".":"Procurei na memória e ainda não há nada guardado sobre ti.");window.lumeOnReply({text:rc.resposta});return true}
  var mm=DL.memorizar&&DL.memorizar(q);
  if(mm){var mr=String(mm.rot||"").toLowerCase();await esp(mm.novo?(mm.antes?"Disseste um novo valor para «"+mr+"»; vou atualizar a memória.":"Disseste «"+mr+"»; vou guardá-lo na memória."):"Disseste «"+mr+"», mas isso já estava guardado.");await esp(mm.novo?(mm.antes?"Troquei «"+mm.antes+"» por «"+mm.val+"».":"Guardei «"+mm.val+"» em «"+mr+"»."):"Não mudei nada na memória.")}
  DL.ver(q);var rd=DL.resolver(q);if(rd&&rd.resposta){window.lumeOnReply({text:rd.resposta});return true}}
 if(typeof window.lumeOnReply==="function"&&window.LumeProjetoChat&&q.length<=4000){
  var prj=null;try{prj=await window.LumeProjetoChat.responder(q)}catch(_){}
  if(prj){(prj.etapas||[]).forEach(function(e){raciocinio(e)});window.lumeOnReply({text:prj.texto,html:prj.html||undefined});return true}
 }
 if(typeof window.lumeOnReply==="function"&&window.LumeCodigoChat&&q.length<=400){
  var cod=null;try{cod=window.LumeCodigoChat.responder(q)}catch(_){}
  if(cod){(cod.etapas||[]).forEach(function(e,i){raciocinio(e,i>=2?T_ETAPA_TESTE:undefined)});window.lumeOnReply({text:cod.texto});return true}
 }
 if(typeof window.lumeOnReply==="function"&&window.LumeFisica&&window.LumeFisica.cenario&&_q0.length<=900){
  var cen=null;try{cen=window.LumeFisica.cenario(_q0)}catch(_){}
  if(cen&&FL){if(cen.esboco)window.lumeOnReply({html:cen.esboco});window.lumeOnReply({text:cen.resumo||soResultado(cen.texto)});return true}
  if(cen){if(cen.esboco){raciocinio("Primeiro desenhei um esboço do enunciado, como se faz em Física, antes de resolver.");window.lumeOnReply({html:cen.esboco})}(cen.etapas||[]).forEach(function(e,i){raciocinio(e,i>=2?T_ETAPA_TESTE:undefined)});window.lumeOnReply({text:cen.texto});return true}
 }
 if(typeof window.lumeOnReply==="function"&&window.LumeFisica&&q.length<=700){
  var fis=null;try{fis=window.LumeFisica.analisar(q)}catch(_){}
  if(fis){
   var esb=window.LumeFisica.esboco?window.LumeFisica.esboco(fis):null;
   if(FL){var sfl=window.LumeFisica.solucao(fis);if(esb)window.lumeOnReply({html:esb.html});window.lumeOnReply({text:soResultado(sfl.texto)});return true}
   if(esb){raciocinio("Desenhei primeiro um esboço do enunciado, como se faz em Física.");window.lumeOnReply({html:esb.html})}
   if(/^(resolve|resolva|resolver)\b/.test(norm(q))){
    raciocinio("Li o exercício de Física, identifiquei os dados e o que se pede, e resolvi sozinho, com os mesmos passos e sem perguntas.");
    var sf=window.LumeFisica.solucao(fis);sf.etapas.forEach(function(e){raciocinio(e,T_ETAPA_TESTE)});
    window.lumeOnReply({text:sf.texto});return true}
   var of=window.LumeFisica.oferta(fis);
   _tutor={tipo:"fis",fis:fis,etapa:"oferta",erros:0,t:Date.now()};
   raciocinio(of.rac);window.lumeOnReply({text:"",html:of.html});return true;
  }
 }
 if(typeof window.lumeOnReply==="function"&&q.length<=140){var fmx=null;try{fmx=funcaoMatematica(q)}catch(_){}if(fmx&&fmx.q){if(FL){window.lumeOnReply({text:soResultado(tSolucaoDe(fmx.q))});return true}if(/^(resolve|resolva|resolver|calcula|calcule|calcular|determine|encontre|quais|qual|quanto|raizes|raiz)\b/.test(norm(q))){raciocinio("Pediste a resolução; resolvi sozinho, com os mesmos passos e sem perguntas.");window.lumeOnReply({text:tSolucaoDe(fmx.q)});window.lumeOnReply({html:tGraf(fmx.q)});return true}var ti=tutorIniciar(fmx);raciocinio(ti.rac);window.lumeOnReply({text:ti.texto,html:ti.html});return true}
  if(FL&&fmx&&!fmx.e&&fmx.p&&fmx.p.length){window.lumeOnReply({text:soResultado(textoConta(fmx))});return true}
  if(fmx&&((fmx.p&&fmx.p.length)||fmx.e)){raciocinio("Li o pedido como uma conta e fiz os passos em JavaScript; o chat formata a resposta.");window.lumeOnReply({text:comTestes(fmx,textoConta(fmx))});if(_estNums&&!fmx.e)window.lumeOnReply({html:tTab(_estNums)});return true}var rj=fmx&&!fmx.e?respostaSimples(fmx):null;if(rj&&FL){window.lumeOnReply({text:rj});return true}if(rj){raciocinio("Fiz a conta em JavaScript e escrevi o resultado em LaTeX.");window.lumeOnReply({text:comTestes(fmx,rj)});if(_estNums&&!fmx.e)window.lumeOnReply({html:tTab(_estNums)});return true}}
 if(typeof window.lumeOnReply==="function"){var cdet=detectarConversa(q);var conversa=gerarConversa(q);if(conversa){raciocinio(descreverConversa(cdet||{}));window.lumeOnReply({text:conversa});return true;}}
 var caps=lerCapacidades();if(!caps.length||typeof window.lumeOnReply!=="function")return false;
 var t=norm(q),m=medidores(q,t);
 /* decide pelo verbo e pelo objeto juntos: "gera" serve a varias capacidades, "gera um botao" so a uma */
 var ativos=caps.filter(function(c){return ativa(c,t,m)});
 /* em caso de empate, ganha a unica capacidade cujas condicoes (requer) se cumprem */
 if(ativos.length>1){var cumprem=ativos.filter(function(x){return cumpre(x.requer,m)});if(cumprem.length===1)ativos=cumprem}
 if(!ativos.length&&DL){var cv=DL.conversar(q);if(cv){window.lumeOnReply({text:cv});return true}}
 if(ativos.length!==1){raciocinio(ativos.length?"Mais de uma capacidade corresponde ("+ativos.map(function(x){return "«"+(NOMES_CAP[x.nome]||x.nome)+"»"}).join(", ")+"); passei o pedido ao motor do bot para decidir.":"Nenhuma capacidade nativa corresponde ao pedido; passei-o ao motor do bot.");return false}
 var c=ativos[0];
 raciocinio(descreverCapacidade(c,t,m,caps.length));
 if(cumpre(c.requer,m)){
  raciocinio("O pedido tem tudo o que «"+(NOMES_CAP[c.nome]||c.nome)+"» precisa; a preparar a resposta.");
  var conversa=gerarConversa(q);if(conversa){window.lumeOnReply({text:conversa});return true;}
  if(c.nome==="frases"){window.lumeOnReply({text:gerarFrases(q)});return true;}
  var partes=c.resposta.split(",");if(partes[0].trim()==="rescalculo.txt"){var cj=contaPorPalavras(q);if(cj){raciocinio("Li a conta nas palavras e escrevi o resultado em LaTeX.");window.lumeOnReply({text:cj});return true}}var txt=entrada(partes[0].trim(),parseInt(partes[1],10)||1);
  if(!txt)return false;
  window.lumeOnReply({text:txt});
  return true;
 }
 var liga=/(^|\s)(e|com)(\s|$)|,/.test(t);
 if(c.aviso&&liga){
  raciocinio("O pedido junta várias coisas e «"+(NOMES_CAP[c.nome]||c.nome)+"» não cumpre as condições; avisei em vez de adivinhar.");
  var txt2=c.aviso.replace(/\{pecas\}/g,String(m.pecas)).replace(/\{lista\}/g,todasAsPecas().join(", "));
  window.lumeOnReply({text:txt2});
  return true;
 }
 return false;
}
/* Matematica em linguagem natural: converte o pedido numa expressao com funcoes da xlang-math
   (sqr, cbr, pow, factorial, gcd, lcm, median, mode, max, min, range, std, variance, sin, cos, tan,
   radians, log, log10, log2, round, hypot, PI). Devolve {f: expressao, m: texto} ou null.
   O chat avalia f no XLang (rescalculo.txt) e mostra "O resultado de m e ...". */
/* ===== Calculadora de expressoes =====
   Le contas como as pessoas escrevem: 2(2+3), [5-(7+5)-6], cos(30), 5^2, 5², x², √16, 2π, 3!, 6:2, "dois mais tres".
   Faz o parse com precedencia (parenteses, potencia, x e /, + e -), multiplicacao implicita, e devolve
   {f: expressao para a xlang-math, m: conta lida, p: passos, e: erro}. Trigonometria: graus por omissao. */
function calculadora(q){
 var s=String(q||"").toLowerCase().trim();
 if(!s||s.length>140)return null;
 s=s.replace(/^(?:por favor[, ]*)?(?:calcule|calcula|calcular|resolva|resolve|resolver|efetue|efectue|quanto\s+(?:[eé]|d[aá])|qual\s+(?:[eé]\s+)?o\s+resultado\s+d[eao]|qual\s+o\s+valor\s+d[eao]|valor\s+d[eao])\s*/,"");
 s=s.replace(/[?!=.\s]+$/,"").trim();
 if(!s||/^\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}$/.test(s))return null;
 s=s.replace(/raiz\s+c[uú]bica\s+(?:de\s+)?/g,"∛").replace(/raiz\s+quadrada\s+(?:de\s+)?/g,"√").replace(/\braiz\s+(?:de\s+)?/g,"√")
  .replace(/\b(seno|sen|cosseno|tangente)\s+(?:de\s+)?/g,function(a,w){return({seno:"sin ",sen:"sin ",cosseno:"cos ",tangente:"tan "})[w]})
  .replace(/\bao\s+quadrado\b/g,"²").replace(/\bao\s+cubo\b/g,"³").replace(/\belevado\s+(?:a|ao)\b/g,"^")
  .replace(/\bmultiplicad[oa]\s+por\b|\bvezes\b/g,"*").replace(/\bdividid[oa]\s+por\b|\bdividid[oa]\b/g,"/")
  .replace(/\bmais\b/g,"+").replace(/\bmenos\b/g,"-").replace(/\bpor\s+cento\b/g,"%");
 var NUM={zero:0,um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10};
 arq("numeros.txt").split(/\r?\n/).forEach(function(l){if(!l.trim()||l.trim().charAt(0)==="#")return;var p=l.split("|");if(p.length<2)return;var n=parseInt(p[0],10);if(!isFinite(n))return;p[1].split(",").forEach(function(w){w=norm(w);if(w)NUM[w]=n})});
 var FN={sin:"sin",sen:"sin",cos:"cos",tan:"tan",tg:"tan",asin:"asin",arcsin:"asin",acos:"acos",arccos:"acos",atan:"atan",arctan:"atan",sqrt:"sqrt",cbrt:"cbrt",ln:"ln",log:"log",log10:"log",log2:"log2",exp:"exp",abs:"abs",floor:"floor",ceil:"ceil",round:"round",min:"min",max:"max"};
 /* tokens */
 var tk=[],i=0,m;
 while(i<s.length){
  var c=s.charAt(i);
  if(/\s/.test(c)){i++;continue}
  if((m=/^\d+(?:[.,]\d+)?/.exec(s.slice(i)))){tk.push({k:"n",v:parseFloat(m[0].replace(",","."))});i+=m[0].length;continue}
  if((m=/^[a-zà-ú]+/.exec(s.slice(i)))){
   var w=m[0],nw=norm(w);i+=w.length;
   if(w==="log"&&(m=/^(?:10|2)(?!\d)/.exec(s.slice(i)))){w+=m[0];i+=m[0].length}
   if(w==="pi")tk.push({k:"c"});
   else if(FN[w])tk.push({k:"f",v:FN[w]});
   else if(NUM.hasOwnProperty(nw))tk.push({k:"n",v:NUM[nw]});
   else if(w==="x")tk.push({k:"o",v:"*"});
   else if(w==="graus"||w==="grau")tk.push({k:"u",v:"deg"});
   else if(w==="rad"||w==="radianos"||w==="radiano")tk.push({k:"u",v:"rad"});
   else return null;
   continue;
  }
  if(c==="*"&&s.charAt(i+1)==="*"){tk.push({k:"o",v:"^"});i+=2;continue}
  if((m=/^[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/.exec(s.slice(i)))){
   var sp=m[0],ng=sp.charAt(0)==="⁻",dg=(ng?sp.slice(1):sp).split("").map(function(h){return "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(h)}).join("");
   if(!dg||dg.indexOf("-")>=0)return null;
   i+=sp.length;
   if(!ng&&/^[√∛]/.test(s.slice(i))){tk.push({k:"f",v:"nroot",idx:parseInt(dg,10)});i++;continue}
   if(!ng&&(dg==="2"||dg==="3")){tk.push({k:"o",v:dg==="2"?"²":"³"});continue}
   tk.push({k:"o",v:"^"});if(ng)tk.push({k:"o",v:"-"});tk.push({k:"n",v:parseInt(dg,10)});continue;
  }
  var map={"×":"*","÷":"/",":":"/","−":"-","–":"-","[":"(","{":"(","]":")","}":")"};
  var o=map[c]||c;
  if(o==="π"){tk.push({k:"c"})}
  else if(o==="√"){tk.push({k:"f",v:"sqrt"})}
  else if(o==="∛"){tk.push({k:"f",v:"cbrt"})}
  else if(o==="°"){tk.push({k:"u",v:"deg"})}
  else if("+-*/^()!%²³;,".indexOf(o)>=0)tk.push({k:"o",v:o});
  else return null;
  i++;
 }
 /* multiplicacao implicita: 2(3+4), (1+2)(3+4), 2π, 3cos(30) */
 var tt=[];
 tk.forEach(function(b,j){
  var a=tt[tt.length-1];
  if(a){
   var fim=a.k==="n"||a.k==="c"||a.k==="u"||(a.k==="o"&&(a.v===")"||a.v==="!"||a.v==="%"||a.v==="²"||a.v==="³"));
   var ini=b.k==="c"||b.k==="f"||(b.k==="o"&&b.v==="(")||(b.k==="n"&&a.k==="o"&&a.v===")");
   if(fim&&ini)tt.push({k:"o",v:"*"});
  }
  tt.push(b);
 });
 tk=tt;
 if(!tk.length)return null;
 var pos=0;
 function peek(v){var t=tk[pos];return t&&t.k==="o"&&t.v===v}
 function bad(){throw {parse:1}}
 function pExpr(){var l=pTerm();while(peek("+")||peek("-")){var op=tk[pos++].v;l={t:"b",op:op,l:l,r:pTerm()}}return l}
 function pTerm(){var l=pUnary();while(peek("*")||peek("/")){var op=tk[pos++].v;l={t:"b",op:op,l:l,r:pUnary()}}return l}
 function pUnary(){if(peek("-")){pos++;return {t:"neg",x:pUnary()}}if(peek("+")){pos++;return pUnary()}return pPow()}
 function pPow(){var b=pPost();if(peek("^")){pos++;return {t:"b",op:"^",l:b,r:pUnary()}}return b}
 function pPost(){
  var x=pPrim();
  for(;;){
   var t=tk[pos];if(!t)break;
   if(t.k==="o"&&(t.v==="!"||t.v==="%"||t.v==="²"||t.v==="³")){pos++;x={t:"p",op:t.v,x:x}}
   else if(t.k==="u"){pos++;x={t:"u",u:t.v,x:x}}
   else break;
  }
  return x;
 }
 function pPrim(){
  var t=tk[pos++];if(!t)bad();
  if(t.k==="n")return {t:"n",v:t.v};
  if(t.k==="c")return {t:"c"};
  if(t.k==="o"&&t.v==="("){var e=pExpr();if(!peek(")"))bad();pos++;return {t:"g",x:e}}
  if(t.k==="f"){
   if(peek("(")){
    pos++;var args=[pExpr()];
    while(peek(";")||peek(",")){pos++;args.push(pExpr())}
    if(!peek(")"))bad();pos++;
    return {t:"fn",n:t.v,a:args,idx:t.idx};
   }
   if(peek("-")){pos++;return {t:"fn",n:t.v,a:[{t:"neg",x:pPost()}],sp:1,idx:t.idx}}
   return {t:"fn",n:t.v,a:[pPost()],sp:1,idx:t.idx};
  }
  bad();
 }
 var arv;
 try{arv=pExpr();if(pos!==tk.length)bad()}catch(e){if(e&&e.parse)return null;throw e}
 /* so conta como matematica se tiver pelo menos uma operacao */
 var ops=0;
 (function cont(n){if(!n)return;if(n.t==="b"||n.t==="fn"||(n.t==="p"&&n.op!=="%"))ops++;if(n.x)cont(n.x);if(n.l)cont(n.l);if(n.r)cont(n.r);if(n.a)n.a.forEach(cont)})(arv);
 if(!ops)return null;
 /* avaliacao com passos */
 function F(x){var r=Number(x.toFixed(6));if(r===0)r=0;return String(r).replace(".",",").replace("-","\u2212")}
 function S(n,v){return n.t==="c"?"π":F(v)}
 function SW(n,v){return n.t==="c"?"π":W(v)}
 function W(x){return x<0?"("+F(x)+")":F(x)}
 function SUP(k){return String(k).split("").map(function(d){return "⁰¹²³⁴⁵⁶⁷⁸⁹".charAt(+d)}).join("")}
 var SIM={"+":"+","-":"−","*":"×","/":"÷","^":"^"};
 var passos=[],notas=[];
 function Erro(t){this.msg=t}
 function lit(v){var t=String(v);return /e/i.test(t)?v.toFixed(12):t}
 function temPi(n){if(!n)return false;if(n.t==="c")return true;return temPi(n.x)||temPi(n.l)||temPi(n.r)||(n.a||[]).some(temPi)}
 function unid(n){return n&&n.t==="u"?n.u:null}
 function D(n){
  switch(n.t){
   case "n":return F(n.v);
   case "c":return "π";
   case "g":return "("+D(n.x)+")";
   case "neg":return "−"+D(n.x);
   case "u":return D(n.x)+(n.u==="deg"?"°":" rad");
   case "p":return D(n.x)+n.op;
   case "b":if(n.op==="^"&&n.r.t==="n"&&Number.isInteger(n.r.v)&&n.r.v>=0&&n.r.v<=99)return D(n.l)+SUP(n.r.v);return D(n.l)+" "+SIM[n.op]+" "+D(n.r);
   case "fn":{if(n.n==="nroot"){var a0=D(n.a[0]);return SUP(n.idx)+"√"+((n.a[0].t==="n"||n.a[0].t==="c"||n.a[0].t==="g")?a0:"("+a0+")")}var nm=({sqrt:"√",cbrt:"∛",sin:"sen",ln:"ln",log2:"log₂",log:"log"})[n.n]||n.n;var ar=n.a.map(D).join("; ");return (n.n==="sqrt"||n.n==="cbrt")?(n.a[0].t==="n"||n.a[0].t==="c"?nm+ar:nm+"("+ar+")"):nm+"("+ar+")"}
  }
 }
 function E(n){
  /* devolve {v, f} */
  switch(n.t){
   case "n":return {v:n.v,f:lit(n.v)};
   case "c":return {v:Math.PI,f:"PI()"};
   case "g":return E(n.x);
   case "u":return E(n.x);
   case "neg":{var a=E(n.x);return {v:-a.v,f:"(0-"+a.f+")"}}
   case "p":{
    var a=E(n.x),v,f;
    if(n.op==="!"){if(!(Number.isInteger(a.v)&&a.v>=0&&a.v<=20))throw new Erro("O fatorial só existe para inteiros de 0 a 20 (para valores maiores o resultado é demasiado grande).");v=1;for(var k=2;k<=a.v;k++)v*=k;f="factorial("+a.f+")"}
    else if(n.op==="%"){v=a.v/100;f="("+a.f+"/100)"}
    else{var e=n.op==="²"?2:3;v=Math.pow(a.v,e);f="pow("+a.f+","+e+")"}
    passos.push(F(a.v)+n.op+" = "+F(v));
    return {v:v,f:f};
   }
   case "b":{
    var l=E(n.l),r=E(n.r),v,f;
    if(n.op==="+"){v=l.v+r.v;f="("+l.f+"+"+r.f+")"}
    else if(n.op==="-"){v=l.v-r.v;f="("+l.f+"-"+r.f+")"}
    else if(n.op==="*"){v=l.v*r.v;f="("+l.f+"*"+r.f+")"}
    else if(n.op==="/"){if(r.v===0)throw new Erro("Não dá para dividir por zero.");v=l.v/r.v;f="("+l.f+"/"+r.f+")"}
    else{
     if(l.v===0&&r.v<0)throw new Erro("Não dá para dividir por zero.");
     v=Math.pow(l.v,r.v);
     if(!isFinite(v))throw new Erro("Não é possível calcular esta potência com números reais.");
     f="pow("+l.f+","+r.f+")";
    }
    if(!isFinite(v)||Math.abs(v)>=1e15)throw new Erro("O resultado é demasiado grande para mostrar.");
    if(n.op==="^"&&n.r.t==="n"&&Number.isInteger(r.v)&&r.v>=0&&r.v<=99)passos.push(SW(n.l,l.v)+SUP(r.v)+" = "+F(v));else passos.push(S(n.l,l.v)+" "+SIM[n.op]+" "+SW(n.r,r.v)+" = "+F(v));
    return {v:v,f:f};
   }
   case "fn":{
    var A=n.a.map(E),x=A[0].v,fx=A[0].f,nm=n.n,v,f,sh;
    var ang=nm==="sin"||nm==="cos"||nm==="tan";
    if(ang){
     var u=unid(n.a[0]),rad=u==="rad"||temPi(n.a[0]);
     if(!u&&!temPi(n.a[0])&&notas.indexOf("Assumi que os ângulos estão em graus. Para radianos escreve rad ou usa π.")<0)notas.push("Assumi que os ângulos estão em graus. Para radianos escreve rad ou usa π.");
     var xr=rad?x:x*Math.PI/180;
     if(nm==="tan"&&Math.abs(Math.cos(xr))<1e-12)throw new Erro("A tangente não existe para este ângulo.");
     v=Math[nm](xr);f=nm+"("+(rad?fx:"radians("+fx+")")+")";
     sh=({sin:"sen",cos:"cos",tan:"tan"})[nm]+"("+F(x)+(rad?" rad":"°")+")";
    }else if(nm==="asin"||nm==="acos"||nm==="atan"){
     if(nm!=="atan"&&Math.abs(x)>1)throw new Erro("O arco-"+(nm==="asin"?"seno":"cosseno")+" só existe para valores entre −1 e 1.");
     v=Math[nm](x)*180/Math.PI;f="degrees("+nm+"("+fx+"))";if(notas.indexOf("O resultado dos arcos (asin, acos, atan) está em graus.")<0)notas.push("O resultado dos arcos (asin, acos, atan) está em graus.");sh=nm+"("+F(x)+")";
    }else if(nm==="nroot"){
     var ix=n.idx;
     if(!(ix>=1))throw new Erro("O índice da raiz tem de ser um inteiro positivo.");
     if(ix%2===0&&x<0)throw new Erro("Não existe raiz de índice par de um número negativo.");
     v=ix===1?x:ix===3?Math.cbrt(x):(x<0?-Math.pow(-x,1/ix):Math.pow(x,1/ix));
     var rv=Math.round(v);if(Math.abs(v-rv)<1e-9&&Math.pow(rv,ix)===x)v=rv;
     f=ix===1?fx:ix===2?"sqr("+fx+")":ix===3?"cbr("+fx+")":(x<0?"(0-pow((0-"+fx+"),1/"+ix+"))":"pow("+fx+",1/"+ix+")");
     sh=SUP(ix)+"√"+W(x);
    }else if(nm==="sqrt"){
     if(x<0)throw new Erro("Não existe raiz quadrada real de um número negativo.");
     v=Math.sqrt(x);f="sqr("+fx+")";sh="√"+W(x);
    }else if(nm==="cbrt"){v=Math.cbrt(x);f="cbr("+fx+")";sh="∛"+W(x)}
    else if(nm==="ln"||nm==="log"||nm==="log2"){
     if(x<=0)throw new Erro("O logaritmo só existe para números positivos.");
     v=nm==="ln"?Math.log(x):nm==="log"?Math.log10(x):Math.log2(x);
     f=({ln:"log",log:"log10",log2:"log2"})[nm]+"("+fx+")";sh=({ln:"ln",log:"log",log2:"log₂"})[nm]+"("+F(x)+")";
    }else if(nm==="exp"){v=Math.exp(x);f="exp("+fx+")";sh="exp("+F(x)+")"}
    else if(nm==="abs"){v=Math.abs(x);f="max("+fx+",(0-"+fx+"))";sh="|"+F(x)+"|"}
    else if(nm==="floor"||nm==="ceil"){v=Math[nm](x);f=nm+"("+fx+")";sh=nm+"("+F(x)+")"}
    else if(nm==="round"){
     var d=A.length>1?A[1].v:0;if(!(Number.isInteger(d)&&d>=0&&d<=10))throw new Erro("Para arredondar, o número de casas deve ser um inteiro entre 0 e 10.");
     v=Math.round(x*Math.pow(10,d))/Math.pow(10,d);f=A.length>1?"round("+fx+","+A[1].f+")":"round("+fx+")";sh="arredondar("+F(x)+(A.length>1?"; "+d:"")+")";
    }else{
     var vs=A.map(function(y){return y.v});v=Math[nm].apply(null,vs);f=nm+"("+A.map(function(y){return y.f}).join(",")+")";sh=nm+"("+vs.map(F).join("; ")+")";
    }
    if(!isFinite(v)||Math.abs(v)>=1e15)throw new Erro("O resultado é demasiado grande para mostrar.");
    passos.push(sh+" = "+F(v)+((nm==="asin"||nm==="acos"||nm==="atan")?"°":""));
    return {v:v,f:f};
   }
  }
 }
 var m0=mx(D(arv)),res;
 try{res=E(arv)}catch(e){if(e instanceof Erro)return {f:"0",m:m0,p:[],e:e.msg};throw e}
 if(!isFinite(res.v))return {f:"0",m:m0,p:[],e:"Não consegui calcular esta conta."};
 var TT=null;try{TT=tTestesCalc(arv,res.v,D,F,W)}catch(e){TT=null}
 var P=passos;
 if(P.length<2&&!notas.length)return {f:res.f,m:m0,p:[],e:"",v:res.v,tt:TT};
 if(P.length>12)P=P.slice(0,6).concat(["..."],P.slice(-5));
 var n=P.length;
 P=P.map(function(t,k){return t==="..."?t:(k===0?"Primeiro: ":k===n-1?"Por fim: ":"Depois: ")+mx(t)});
 return {f:res.f,m:m0,p:P.concat(notas),e:"",tt:TT};
}
var LP=(function(){
 var SUPD="⁰¹²³⁴⁵⁶⁷⁸⁹";
 function add(a,b,sg){var r=[],n=Math.max(a.length,b.length);for(var k=0;k<n;k++)r.push((a[k]||0)+sg*(b[k]||0));return r}
 function mulp(a,b){var r=[];for(var i=0;i<a.length;i++)for(var j=0;j<b.length;j++)r[i+j]=(r[i+j]||0)+a[i]*b[j];if(r.length>9)throw "nl";return r}
 function grau(a){for(var k=a.length-1;k>0;k--)if(Math.abs(a[k])>1e-12)return k;return 0}
 function cte(a){return grau(a)===0}
 function poly(t,vars){
  t=t.replace(/[−–]/g,"-").replace(/×/g,"*").replace(/[÷:]/g,"/").replace(/,/g,".").replace(/[\[{]/g,"(").replace(/[\]}]/g,")");
  var tk=[],i=0,m,c;
  while(i<t.length){
   c=t.charAt(i);
   if(/\s/.test(c)){i++;continue}
   if((m=/^\d+(?:\.\d+)?/.exec(t.slice(i)))){tk.push({n:parseFloat(m[0])});i+=m[0].length;continue}
   if(/[a-z]/.test(c)){
    if(/[a-z]/.test(t.charAt(i+1))||(i>0&&/[a-z]/.test(t.charAt(i-1))))throw 0;
    vars[c]=1;tk.push({v:c});i++;continue}
   if((m=/^[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/.exec(t.slice(i)))){
    var sp=m[0],ng=sp.charAt(0)==="⁻",dg=(ng?sp.slice(1):sp).split("").map(function(h){return SUPD.indexOf(h)}).join("");
    if(!dg||dg.indexOf("-")>=0)throw 0;
    tk.push({o:"^"});if(ng)tk.push({o:"-"});tk.push({n:parseInt(dg,10)});i+=sp.length;continue}
   if("+-*/^()".indexOf(c)<0)throw 0;
   tk.push({o:c});i++;
  }
  var tt=[];
  tk.forEach(function(b){
   var a=tt[tt.length-1];
   if(a&&(a.n!==undefined||a.v||a.o===")")&&(b.n!==undefined||b.v||b.o==="("))tt.push({o:"*"});
   tt.push(b);
  });
  var p=0;
  function ok(o){return tt[p]&&tt[p].o===o}
  function atom(){
   var k=tt[p++];if(!k)throw 0;
   if(k.n!==undefined)return [k.n];
   if(k.v)return [0,1];
   if(k.o==="("){var r=soma();if(!ok(")"))throw 0;p++;return r}
   throw 0;
  }
  function pot(){
   var b=atom();
   if(ok("^")){
    p++;var e=unario();
    if(!cte(e))throw "nl";
    var n=e[0];
    if(cte(b)){var pv=Math.pow(b[0],n);if(!isFinite(pv))throw 0;return [pv]}
    if(!(Number.isInteger(n)&&n>=0&&n<=8))throw "nl";
    var r=[1];for(var k=0;k<n;k++)r=mulp(r,b);
    return r;
   }
   return b;
  }
  function unario(){
   if(ok("-")){p++;return unario().map(function(z){return -z})}
   if(ok("+")){p++;return unario()}
   return pot();
  }
  function termo(){
   var r=unario();
   while(ok("*")||ok("/")){
    var o=tt[p++].o,d=unario();
    if(o==="*")r=mulp(r,d);
    else{if(!cte(d))throw "nl";if(d[0]===0)throw "z";r=r.map(function(z){return z/d[0]})}
   }
   return r;
  }
  function soma(){
   var r=termo();
   while(ok("+")||ok("-")){
    var o=tt[p++].o,d=termo();
    r=add(r,d,o==="+"?1:-1);
   }
   return r;
  }
  var res=soma();if(p<tt.length)throw 0;return res;
 }
 return {poly:poly,add:add,grau:grau,cte:cte};
})();
/* Grafico de funcoes do 1.o e 2.o grau: y = 2x+1, f(x) = x²-4x+3, "grafico de x²". Devolve {svg,titulo,info,e} ou null. */
function graficoFuncao(q){
 try{
 // var t=String(q||"").toLowerCase().trim();
 var t=String(q||"").toLowerCase().trim().replace(/\s+(?:em|num|no)\s+(?:ficheiro|arquivo|p[aá]gina)\s*$/,"");
 if(!t||t.length>140)return null;
 if(/\b(seno|cosseno|tangente|sin|cos|tan|log|ln)\b/.test(t))return null;
 var pal=/^(?:por favor|pode|podes|desenha\w*|desenhe|faz|fa[cç]a|fazer|tra[cç]a\w*|mostra\w*|plot\w*|gr[aá]fico|fun[cç][aã]o|o|a|um|uma|de|da|do|me|para|com)\b[\s,]*/;
 var eq=t;
 while(pal.test(eq))eq=eq.replace(pal,"");
 eq=eq.replace(/[?!.\s]+$/,"").trim();
 if(!eq||eq.length>60)return null;
 var ERRO={e:"Só desenho gráficos de funções do 1.º e 2.º grau, como y = 2x+1 ou y = x²-4x+3."},P,vv={},ei=eq.indexOf("=");
 try{
  if(ei>=0){
   if(!/gr[aá]fico|plot|curva|par[aá]bola|esbo[cç]|represent|visualiz|fun[cç][aã]o|desenh|tra[cç]a/.test(t))return null;
   var le=eq.slice(0,ei).trim().replace(/^[fg]\s*\(\s*x\s*\)$/,"y"),ri=eq.slice(ei+1).trim();
   if(!le||!ri||ri.indexOf("=")>=0||!/\by\b/.test(le+" "+ri))return null;
   var lado=function(yv){var yy="("+yv+")";return LP.add(LP.poly(le.replace(/\by\b/g,yy),vv),LP.poly(ri.replace(/\by\b/g,yy),vv),-1)};
   var A0=lado(0),A1=lado(1),A2=lado(2),B=LP.add(A1,A0,-1),B0=B[0]||0;
   var dif=LP.add(A2,LP.add(A0,B,2),-1);
   if(LP.grau(B)>0||Math.abs(B0)<1e-12||dif.some(function(z){return Math.abs(z)>1e-9}))return ERRO;
   P=A0.map(function(z){return -z/B0+0});
  }else{
   if(!/gr[aá]fico|plot|curva|par[aá]bola|esbo[cç]|represent|visualiz|fun[cç][aã]o/.test(t))return null;
   P=LP.poly(eq,vv);
  }
 }catch(e){return e==="nl"?ERRO:null}
 var ks=Object.keys(vv);
 if(ks.length>1||(ks.length===1&&ks[0]!=="x"))return null;
 if(LP.grau(P)>2)return ERRO;
 function Z(v){return Math.abs(v)<1e-12?0:v}
 var c0=Z(P[0]||0),c1=Z(P[1]||0),c2=Z(P[2]||0),quad=c2!==0;
 function F(n){n=Math.round(n*1e4)/1e4;if(n===0)n=0;return String(n).replace(".",",").replace("-","−")}
 function ev(x){return (c2*x+c1)*x+c0}
 var roots=[],vx=0,vy=0,D=0;
 if(quad){
  D=c1*c1-4*c2*c0;if(Math.abs(D)<1e-9)D=0;
  vx=-c1/(2*c2);vy=ev(vx);
  if(D===0)roots=[vx];
  else if(D>0){var sq=Math.sqrt(D);roots=[(-c1-sq)/(2*c2),(-c1+sq)/(2*c2)].sort(function(a,b){return a-b})}
 }else if(c1!==0)roots=[-c0/c1];
 var marks=[],seen={};
 function marca(x,y,k){var key=Math.round(x*1e6)+","+Math.round(y*1e6);if(seen[key])return;seen[key]=1;marks.push({x:x,y:y,k:k})}
 if(quad)marca(vx,vy,"v");
 roots.forEach(function(r){marca(r,0,"r")});
 marca(0,c0,"i");
 var kx=[0].concat(roots);if(quad)kx.push(vx);
 var kmin=Math.min.apply(null,kx),kmax=Math.max.apply(null,kx);
 var half=Math.max((kmax-kmin)/2*1.5,3),mid=(kmin+kmax)/2,xmin=mid-half,xmax=mid+half;
 var N=80,k,ys=[0];
 for(k=0;k<=N;k++)ys.push(ev(xmin+(xmax-xmin)*k/N));
 marks.forEach(function(m){ys.push(m.y)});
 var ymin=Math.min.apply(null,ys),ymax=Math.max.apply(null,ys);
 if(ymax-ymin<1e-9)ymax=ymin+1;
 var pd=(ymax-ymin)*0.1;ymin-=pd;ymax+=pd;
 function passo(r){var b=r/5,e=Math.pow(10,Math.floor(Math.log10(b))),f=b/e;return (f<1.5?1:f<3.5?2:f<7.5?5:10)*e}
 function eixo(a,b){var s=passo(b-a),r=[],n=Math.ceil(a/s-1e-9);for(;n*s<=b+1e-9;n++)r.push(Math.round(n*s*1e9)/1e9);return r}
 var W=300,H=260,ml=38,mr=14,mt=16,mb=28,pw=W-ml-mr,ph=H-mt-mb;
 function px(x){return Math.round((ml+(x-xmin)/(xmax-xmin)*pw)*100)/100}
 function py(y){return Math.round((H-mb-(y-ymin)/(ymax-ymin)*ph)*100)/100}
 function cl(v,a,b){return Math.max(a,Math.min(b,v))}
 var o='<rect x="0" y="0" width="300" height="260" fill="#fbfbf4" stroke="#c9ceb8"></rect>',tx=eixo(xmin,xmax),ty=eixo(ymin,ymax);
 tx.forEach(function(v){o+='<line x1="'+px(v)+'" y1="'+mt+'" x2="'+px(v)+'" y2="'+(H-mb)+'" stroke="#e3e6d3" stroke-width="1"></line>'});
 ty.forEach(function(v){o+='<line x1="'+ml+'" y1="'+py(v)+'" x2="'+(W-mr)+'" y2="'+py(v)+'" stroke="#e3e6d3" stroke-width="1"></line>'});
 o+='<line x1="'+ml+'" y1="'+py(0)+'" x2="'+(W-mr)+'" y2="'+py(0)+'" stroke="#666" stroke-width="1.5"></line><line x1="'+px(0)+'" y1="'+mt+'" x2="'+px(0)+'" y2="'+(H-mb)+'" stroke="#666" stroke-width="1.5"></line>';
 tx.forEach(function(v){if(v!==0)o+='<text x="'+px(v)+'" y="'+(py(0)+11)+'" font-size="8" fill="#555" text-anchor="middle">'+F(v)+'</text>'});
 ty.forEach(function(v){if(v!==0)o+='<text x="'+(px(0)-4)+'" y="'+(py(v)+3)+'" font-size="8" fill="#555" text-anchor="end">'+F(v)+'</text>'});
 o+='<text x="'+(W-mr)+'" y="'+(py(0)-4)+'" font-size="9" fill="#666" text-anchor="end">x</text><text x="'+(px(0)+5)+'" y="'+(mt+8)+'" font-size="9" fill="#666">y</text>';
 var pts=[];
 for(k=0;k<=N;k++){var xx=xmin+(xmax-xmin)*k/N;pts.push(px(xx)+","+py(ev(xx)))}
 o+='<polyline points="'+pts.join(" ")+'" fill="none" stroke="#2e6bd6" stroke-width="2.5" stroke-linejoin="round"></polyline>';
 marks.forEach(function(m){
  var mx=px(m.x),my=py(m.y),lx,ly,an,rot="("+F(m.x)+"; "+F(m.y)+")";
  if(m.k==="v"){lx=mx;ly=my+(c2>0?15:-8);an="middle"}
  else if(m.k==="r"){lx=mx;ly=my-7;an="middle"}
  else{lx=mx+6;ly=my+(m.y>=0?-6:12);an="start"}
  if(an==="start"&&lx>W-mr-52){lx=mx-6;an="end"}
  if(an==="middle")lx=cl(lx,ml+26,W-mr-26);
  ly=cl(ly,mt+9,H-4);
  o+='<circle cx="'+mx+'" cy="'+my+'" r="3.5" fill="#c0392b"></circle><text x="'+lx+'" y="'+ly+'" font-size="9" fill="#1d2410" text-anchor="'+an+'" stroke="#fbfbf4" stroke-width="3" paint-order="stroke">'+rot+'</text>';
 });
 var tit="";
 [[c2,"x²"],[c1,"x"],[c0,""]].forEach(function(p){
  var kk=p[0];if(kk===0)return;
  var mg=Math.abs(kk),b=p[1]===""?F(mg):(mg===1?"":F(mg))+p[1];
  tit+=tit===""?(kk<0?"−":"")+b:" "+(kk<0?"−":"+")+" "+b;
 });
 if(!tit)tit="0";
 var info=[];
 if(quad){
  info.push("Parábola com a concavidade voltada para "+(c2>0?"cima":"baixo")+" (a = "+F(c2)+")");
  info.push("Vértice: ("+F(vx)+"; "+F(vy)+")");
  info.push(D>0?"Raízes: x₁ = "+F(roots[0])+" e x₂ = "+F(roots[1]):D===0?"Raiz dupla: x = "+F(roots[0]):"Não corta o eixo x (Δ = "+F(D)+", negativo)");
 }else if(c1!==0){
  info.push("Reta "+(c1>0?"crescente":"decrescente")+" (declive m = "+F(c1)+")");
  info.push("Raiz: x = "+F(roots[0]));
 }else info.push("Função constante: y = "+F(c0));
 info.push("Corta o eixo y em (0; "+F(c0)+")");
 return {svg:o,titulo:"y = "+tit,info:info,e:"",c:[c0,c1,c2]};
 }catch(err){return null}
}
/* Equacoes do 1.o e 2.o grau com uma incognita: 2x+3=11, x²-5x+6=0, x^2=9, (x+1)^2=4, 3(x-1)=x+5 */
function equacao(q){
 try{
 var s=String(q||"").toLowerCase().trim();
 if(!s||s.length>100)return null;
 s=s.replace(/^(?:por favor[, ]*)?(?:calcule|calcula|resolva|resolve|resolver|qual\s+(?:[eé]\s+)?o\s+valor\s+de)\s*/,"").replace(/[?!.\s]+$/,"");
 var lados=s.split("=");
 if(lados.length!==2||!lados[0].trim()||!lados[1].trim())return null;
 if(/\d\s+[a-z]\s+\d/.test(s))return null;
 var vars={};
 var add=LP.add,grau=LP.grau;
 function poly(t){return LP.poly(t,vars)}
 var m0=mx((lados[0].trim()+" = "+lados[1].trim()).replace(/[\[{]/g,"(").replace(/[\]}]/g,")"));
 function ER(t){return {f:"0",m:m0,p:[],e:t}}
 var l,r;
 try{l=poly(lados[0]);r=poly(lados[1])}
 catch(e){
  if(e==="nl")return ER("Só resolvo equações do 1.º e 2.º grau com uma incógnita.");
  if(e==="z")return ER("Não dá para dividir por zero.");
  return null;
 }
 var nv=Object.keys(vars);
 if(!nv.length)return null;
 if(nv.length>1)return ER("Só resolvo equações com uma incógnita.");
 var X=nv[0],P=add(l,r,-1),g=grau(P);
 function Z(v){return Math.abs(v)<1e-12?0:v}
 var c0=Z(P[0]||0),c1=Z(P[1]||0),c2=Z(P[2]||0);
 if(grau(P)>2)return ER("Só resolvo equações do 1.º e 2.º grau com uma incógnita.");
 function F(n){n=Math.round(n*1e6)/1e6;if(n===0)n=0;return String(n).replace(".",",").replace("-","−")}
 function W(n){return n<0?"("+F(n)+")":F(n)}
 function termos(a,b,c){
  var out="";
  [[a,X+"²"],[b,X],[c,""]].forEach(function(t){
   var k=t[0];if(k===0)return;
   var mag=Math.abs(k),body=t[1]===""?F(mag):(mag===1?"":F(mag))+t[1];
   out+=out===""?(k<0?"−":"")+body:" "+(k<0?"−":"+")+" "+body;
  });
  return out||"0";
 }
 function passos(L){var n=L.length;return L.map(function(t,k){return (k===0?"Primeiro: ":k===n-1?"Por fim: ":"Depois: ")+t})}
 function arred(v){return String(Math.round(v*1e9)/1e9)}
 if(c2!==0){
  var a=c2,b=c1,c=c0,D=b*b-4*a*c;if(Math.abs(D)<1e-9)D=0;
  var dTxt="Discriminante: "+mx("Δ = b² − 4·a·c = "+W(b)+"² − 4 × "+W(a)+" × "+W(c)+" = "+F(D));
  var L=["Passar tudo para o mesmo lado: "+mx(termos(a,b,c)+" = 0"),"Coeficientes: "+mx("a = "+F(a)+", b = "+F(b)+", c = "+F(c)),dTxt],x1,res;
  if(D<0){L.push("Como "+mx("Δ")+" é negativo, não existe raiz quadrada real de "+mx("Δ")+": a equação não tem solução real");return {f:"0",m:m0,p:passos(L),e:"",r:"sem solução real",q:{a:a,b:b,c:c,X:X}}}
  if(D===0){
   x1=-b/(2*a);L.push(mx(X+" = −b ÷ 2a = "+F(x1)));res=mx(X+" = "+F(x1))+" (raiz dupla)";
  }else{
   var sq=Math.sqrt(D);x1=(-b+sq)/(2*a);var x2=(-b-sq)/(2*a);
   L.push(mx("√Δ = "+F(sq)));L.push(mx(X+"₁ = (−b + √Δ) ÷ 2a = "+F(x1)));L.push(mx(X+"₂ = (−b − √Δ) ÷ 2a = "+F(x2)));
   res=mx(X+"₁ = "+F(x1))+" e "+mx(X+"₂ = "+F(x2));
  }
  return {f:arred(x1),m:m0,p:passos(L),e:"",r:res,q:{a:a,b:b,c:c,X:X}};
 }
 if(c1===0)return ER(c0===0?"Esta equação é verdadeira para qualquer valor de "+X+" (infinitas soluções).":"Esta equação não tem solução.");
 var A=c1,B=-c0,x=B/A,coef=(A===1?"":A===-1?"−":F(A))+X;
 var jt=function(ts){var o="";ts.forEach(function(t){var k=Z(t[0]);if(k===0)return;var mg=Math.abs(k),b=t[1]===""?F(mg):(mg===1?"":F(mg))+t[1];o+=o===""?(k<0?"−":"")+b:" "+(k<0?"−":"+")+" "+b});return o||"0"};
 var esq=jt([[l[1]||0,X],[-(r[1]||0),X]]),dir=jt([[r[0]||0,""],[-(l[0]||0),""]]),simp=coef+" = "+F(B);
 var L2=["Juntar os termos: "+mx(esq+" = "+dir)];
 if(simp!==esq+" = "+dir)L2.push("Simplificar: "+mx(simp));
 if(A!==1){L2.push("Dividir os dois lados por "+mx(F(A))+": "+mx(X+" = "+F(B)+" ÷ "+F(A)));L2.push(mx(X+" = "+F(x)))}
 return {f:arred(x),m:m0,p:passos(L2),e:"",r:mx(X+" = "+F(x)),tt:tTestes1(l,r,c1,c0,x,X)};
 }catch(err){return null}
}
/* Expressoes com uma letra e sem "=": 2x²+4x+8, 3x+5, (x+1)^2, e "2x²+4x+8 com x = 3".
   Sem valor para a letra, simplifica e descreve (grau, raizes); com valor, substitui e calcula, mostrando os termos. */
/* ===== Expressoes algebricas com fracoes (funcoes racionais) =====
   "1/x + 3", "x/2 + x/3", "2/(x-1) - 3/x", "(x²-9)/(x-3)", e "... com x = 2".
   Coeficientes racionais exactos; mmc dos denominadores, soma dos numeradores, simplificacao pelo mdc dos polinomios. */
var RF=(function(){
 function gi(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t}return a}
 function Fr(n,d){if(d===undefined)d=1;if(d===0)throw "z";if(d<0){n=-n;d=-d}var g=gi(n,d)||1;if(Math.abs(n)>1e12||d>1e12)throw "g";return {n:n/g,d:d/g}}
 function fa(a,b){return Fr(a.n*b.d+b.n*a.d,a.d*b.d)}
 function fm(a,b){return Fr(a.n*b.n,a.d*b.d)}
 function fv(a,b){return Fr(a.n*b.d,a.d*b.n)}
 var Z0=Fr(0),U1=Fr(1);
 function tr(a){a=a.slice();while(a.length>1&&a[a.length-1].n===0)a.pop();return a.length?a:[Z0]}
 function nulo(a){return a.length===1&&a[0].n===0}
 function gr(a){return a.length-1}
 function pa(a,b,sg){var r=[],n=Math.max(a.length,b.length);for(var k=0;k<n;k++)r.push(fa(a[k]||Z0,fm(b[k]||Z0,Fr(sg))));return tr(r)}
 function pm(a,b){var r=[];for(var i=0;i<a.length;i++)for(var j=0;j<b.length;j++)r[i+j]=fa(r[i+j]||Z0,fm(a[i],b[j]));if(r.length>12)throw "g";return tr(r)}
 function pd(a,b){var q=[],r=a.slice(),lb=b[b.length-1];if(nulo(b))throw "z";for(var k=r.length-b.length;k>=0;k--){var c=fv(r[k+b.length-1]||Z0,lb);q[k]=c;for(var j=0;j<b.length;j++)r[k+j]=fa(r[k+j]||Z0,fm(fm(c,b[j]),Fr(-1)))}return {q:tr(q.length?q:[Z0]),r:tr(r.slice(0,Math.max(b.length-1,1)))}}
 function mdc(a,b){while(!nulo(b)){var r=pd(a,b).r;a=b;b=r}return a}
 function ints(a){var L=1;a.forEach(function(c){L=L/gi(L,c.d)*c.d});var v=a.map(function(c){return c.n*(L/c.d)});return {v:v,L:L}}
 /* forma inteira e primitiva (coeficiente principal positivo); devolve {p, k} com a = k * p */
 function prim(a){var t=ints(a),g=0;t.v.forEach(function(x){g=gi(g,x)});g=g||1;var s=a[a.length-1].n<0?-1:1;return {p:t.v.map(function(x){return Fr(s*x/g)}),k:Fr(s*g,t.L)}}
 function norm(n,d){
  if(nulo(n))return {n:[Z0],d:[U1]};
  var g=mdc(n,d);if(gr(g)>0){n=pd(n,g).q;d=pd(d,g).q}
  var pn=prim(n),pd2=prim(d),k=fv(pn.k,pd2.k);
  return {n:pm(pn.p,[Fr(k.n)]),d:pm(pd2.p,[Fr(k.d)])};
 }
 function rf(n,d){return norm(n,d)}
 function ra(a,b,sg){return rf(pa(pm(a.n,b.d),pm(b.n,a.d),sg),pm(a.d,b.d))}
 function rm(a,b){return rf(pm(a.n,b.n),pm(a.d,b.d))}
 function rd(a,b){if(nulo(b.n))throw "z";return rf(pm(a.n,b.d),pm(a.d,b.n))}
 function rp(a,k){var r={n:[U1],d:[U1]},b=k<0?{n:a.d,d:a.n}:a;if(k<0&&nulo(a.n))throw "z";for(var i=0;i<Math.abs(k);i++)r=rm(r,b);return r}
 function ev(P,x){var s=Z0;for(var k=P.length-1;k>=0;k--)s=fa(fm(s,x),P[k]);return s}
 function evf(P,x){var s=0;for(var k=P.length-1;k>=0;k--)s=s*x+P[k].n/P[k].d;return s}
 return {Fr:Fr,fa:fa,fm:fm,fv:fv,Z0:Z0,U1:U1,tr:tr,nulo:nulo,gr:gr,pa:pa,pm:pm,pd:pd,mdc:mdc,prim:prim,rf:rf,ra:ra,rm:rm,rd:rd,rp:rp,ev:ev,evf:evf,gi:gi,ints:ints}
})();
function racional(q){
 try{
 var s=String(q||"").toLowerCase().trim();
 if(!s||s.length>100)return null;
 s=s.replace(/^(?:por favor[, ]*)?(?:calcule|calcula|calcular|simplifique|simplifica|simplificar|resolva|resolve|resolver|efetue|efectue|reduza|reduz|reduzir|qual\s+(?:[eé]\s+)?o\s+valor\s+de|quanto\s+(?:[eé]|vale|d[aá]))\s*/,"").replace(/[?!.\s]+$/,"");
 var val=null,mv=/^(.*?)[,\s]*(?:com|para|quando|se|sendo|onde|e\s+se)?\s*\b([a-df-z])\s*(?:=|vale|for|igual\s+a)\s*(-|−)?\s*(\d+(?:[.,]\d+)?)$/.exec(s);
 if(mv&&mv[1].trim()){s=mv[1].trim();val=(mv[3]?-1:1)*parseFloat(mv[4].replace(",","."))}
 if(s.indexOf("=")>=0||!/[\/÷]/.test(s)||!/[a-df-z]/.test(s))return null;
 if(!/^[0-9a-df-z+\-−–*×/÷^().,\s²³⁴⁵⁶⁷⁸⁹]+$/.test(s))return null;
 if(/\d\s+[a-z]\s+\d/.test(s))return null;
 var t=s.replace(/[−–]/g,"-").replace(/×/g,"*").replace(/÷/g,"/").replace(/,/g,".");
 var SUPD="⁰¹²³⁴⁵⁶⁷⁸⁹",tk=[],i=0,m,c,vr=null;
 while(i<t.length){
  c=t.charAt(i);
  if(/\s/.test(c)){i++;continue}
  if((m=/^\d+(?:\.\d+)?/.exec(t.slice(i)))){var dc=m[0].split(".");tk.push({n:RF.Fr(parseInt(dc[0]+(dc[1]||""),10),Math.pow(10,(dc[1]||"").length))});i+=m[0].length;continue}
  if(/[a-z]/.test(c)){if(/[a-z]/.test(t.charAt(i+1))||(i>0&&/[a-z]/.test(t.charAt(i-1))))return null;if(vr&&vr!==c)return null;vr=c;tk.push({v:1});i++;continue}
  if((m=/^[⁰¹²³⁴⁵⁶⁷⁸⁹]+/.exec(t.slice(i)))){tk.push({o:"^"});tk.push({n:RF.Fr(parseInt(m[0].split("").map(function(h){return SUPD.indexOf(h)}).join(""),10)),e:1});i+=m[0].length;continue}
  tk.push({o:c});i++;
 }
 if(!vr)return null;
 var X=vr,tt=[];
 tk.forEach(function(b){var a=tt[tt.length-1];if(a&&(a.n!==undefined||a.v||a.o===")")&&(b.n!==undefined&&!b.e||b.v||b.o==="("))tt.push({o:"*"});tt.push(b)});
 var p=0;function ok(o){return tt[p]&&tt[p].o===o}
 function atom(){var k=tt[p++];if(!k)throw 0;if(k.n!==undefined)return {t:"n",v:k.n};if(k.v)return {t:"x"};if(k.o==="("){var r=soma();if(!ok(")"))throw 0;p++;return r}throw 0}
 function pot(){var b=atom();if(ok("^")){p++;var sg=1;if(ok("-")){p++;sg=-1}var k=tt[p++];if(!k||k.n===undefined||k.n.d!==1||k.n.n>8)throw 0;return {t:"^",a:b,k:sg*k.n.n}}return b}
 function un(){if(ok("-")){p++;return {t:"neg",a:un()}}if(ok("+")){p++;return un()}return pot()}
 function termo(){var r=un();while(ok("*")||ok("/")){var o=tt[p++].o;r={t:o,a:r,b:un()}}return r}
 var tops=null;
 function soma(top){var l=[{sg:1,nd:termo()}];while(ok("+")||ok("-")){var o=tt[p++].o;l.push({sg:o==="+"?1:-1,nd:termo()})}if(top)tops=l;var r=l[0].nd;for(var j=1;j<l.length;j++)r={t:l[j].sg>0?"+":"-",a:r,b:l[j].nd};return r}
 var ast=soma(true);if(p<tt.length)return null;
 var ONE=RF.rf([RF.U1],[RF.U1]);
 function E(n){
  switch(n.t){
   case "n":return RF.rf([n.v],[RF.U1]);
   case "x":return RF.rf([RF.Z0,RF.U1],[RF.U1]);
   case "neg":return RF.rm(E(n.a),RF.rf([RF.Fr(-1)],[RF.U1]));
   case "+":return RF.ra(E(n.a),E(n.b),1);
   case "-":return RF.ra(E(n.a),E(n.b),-1);
   case "*":return RF.rm(E(n.a),E(n.b));
   case "/":return RF.rd(E(n.a),E(n.b));
   case "^":return RF.rp(E(n.a),n.k);
  }
 }
 function EF(n,x){
  switch(n.t){
   case "n":return n.v.n/n.v.d;case "x":return x;case "neg":return -EF(n.a,x);
   case "+":return EF(n.a,x)+EF(n.b,x);case "-":return EF(n.a,x)-EF(n.b,x);
   case "*":return EF(n.a,x)*EF(n.b,x);case "/":return EF(n.a,x)/EF(n.b,x);case "^":return Math.pow(EF(n.a,x),n.k);
  }
 }
 var R=E(ast),terms=tops.map(function(o){return {sg:o.sg,r:E(o.nd),nd:o.nd}});
 /* formatacao */
 function F(n){return String(n).replace("-","−")}
 function pw(k){return k===0?"":k===1?X:X+"^{"+k+"}"}
 function pT(P){var o="",g=RF.gr(P);for(var k=g;k>=0;k--){var c=P[k];if(c.n===0&&g>0)continue;var nn=c.n,mag=Math.abs(nn),body=k===0?String(mag):(mag===1?"":String(mag))+pw(k);o+=o===""?(nn<0?"-":"")+body:" "+(nn<0?"-":"+")+" "+body}return o||"0"}
 function nt(P){var n=0;for(var k=0;k<P.length;k++)if(P[k].n!==0)n++;return n}
 function par(P){return nt(P)>1||(RF.gr(P)===0&&P[0].n<0)?"("+pT(P)+")":pT(P)}
 function fT(N,D){return RF.gr(D)===0&&D[0].n===1?pT(N):"\\frac{"+pT(N)+"}{"+pT(D)+"}"}
 function rT(r){return fT(r.n,r.d)}
 var L=[],Rstr=null,nome=function(){return mx(X)};
 var hasDen=false;terms.forEach(function(t){if(t.r.d.length>1||t.r.d[0].n!==1)hasDen=true});
 function den1(r){return r.d.length===1&&r.d[0].n===1}
 var varDen=terms.some(function(t){return t.r.d.length>1});
 /* condicoes de existencia: raizes racionais de denominadores lineares */
 function conds(ds){var out=[];function add(rt){var tx=rt.d===1?String(rt.n):"\\frac{"+rt.n+"}{"+rt.d+"}",z=X+" \\neq "+tx;if(out.indexOf(z)<0)out.push(z)}
  ds.forEach(function(D){
   if(RF.gr(D)===1)add(RF.fv(RF.fm(D[0],RF.Fr(-1)),D[1]));
   else if(RF.gr(D)===2){var A=D[2],B=D[1],C=D[0],dl=RF.fa(RF.fm(B,B),RF.fm(RF.Fr(-4),RF.fm(A,C))),sq=Math.sqrt(dl.n/dl.d);
    if(dl.n>=0&&Number.isInteger(dl.n)&&dl.d===1&&Number.isInteger(sq)){var tw=RF.fm(RF.Fr(2),A);add(RF.fv(RF.fa(RF.fm(B,RF.Fr(-1)),RF.Fr(sq)),tw));if(sq!==0)add(RF.fv(RF.fa(RF.fm(B,RF.Fr(-1)),RF.Fr(-sq)),tw))}}
  });return out}
 var orig=terms.map(function(t,k){return (k===0?(t.sg<0?"-":""):(t.sg<0?" - ":" + "))+(t.r.n.length>1&&k>0&&den1(t.r)&&false?"":rT(t.r))}).join("");
 var Dres=terms.filter(function(t){return !den1(t.r)}).map(function(t){return t.r.d});
 var nTermosDen=Dres.length;
 if(terms.length===1){
  var nd=terms[0].nd;if(nd.t!=="/")return null;
  var an=E(nd.a),bn=E(nd.b),rawN=RF.pm(an.n,bn.d),rawD=RF.pm(an.d,bn.n),g=RF.mdc(rawN,rawD);
  if(RF.gr(g)<1)return null;
  var gp=RF.prim(g).p;
  var cs=conds([bn.n]);
  orig=fT(rawN,rawD);
  if(cs.length)L.push("Condição para a expressão existir (o denominador não pode ser zero): "+mx(cs.join(",\\ ")));
  L.push("Há um fator comum no numerador e no denominador: "+mx(par(gp)));
  L.push("Dividir o numerador e o denominador por "+mx(par(gp))+": "+mx(fT(rawN,rawD)+" = "+fT(R.n,R.d)));
 }else{
  if(!hasDen)return null;
  var cs2=conds(Dres);
  if(cs2.length)L.push("Condições para a expressão existir (os denominadores não podem ser zero): "+mx(cs2.join(",\\ ")));
  /* mmc: parte numerica e parte polinomial */
  var dist=[];Dres.forEach(function(D){var pp=RF.prim(D).p;if(RF.gr(pp)===0)return;if(!dist.some(function(z){return RF.gr(z)===RF.gr(pp)&&z.every(function(c,k){return c.n===pp[k].n&&c.d===pp[k].d})}))dist.push(pp)});
  var Lp=[RF.U1],coprimos=true;
  dist.forEach(function(pp){var g2=RF.mdc(Lp,pp);if(RF.gr(g2)>0)coprimos=false;Lp=RF.prim(RF.pd(RF.pm(Lp,pp),g2).q).p});
  var Lc=1;Dres.forEach(function(D){var c=RF.prim(D).k;Lc=Lc/RF.gi(Lc,c.n)*c.n});
  var Lfull=RF.pm(Lp,[RF.Fr(Lc)]);
  var Lstr=coprimos&&dist.length>0?[Lc>1?String(Lc):""].concat(dist.map(function(pp){return dist.length>1||Lc>1?par(pp):pT(pp)})).filter(Boolean).join(""):pT(Lfull);
  if(Dres.length>=2||dist.length>1||Lc>1){
   if(Dres.length>=2||RF.gr(Lp)>0&&terms.length>1||Lc>1)L.push("Denominador comum: o mmc dos denominadores é "+mx(Lstr));
  }
  var Nsum=[RF.Z0],partes=[];
  terms.forEach(function(t){
   var mult=RF.pd(Lfull,t.r.d).q,numer=RF.pm(t.r.n,mult);
   Nsum=RF.pa(Nsum,numer,t.sg);
   partes.push((partes.length===0?(t.sg<0?"-":""):(t.sg<0?" - ":" + "))+(RF.gr(mult)===0&&mult[0].n===1?"\\frac{"+pT(t.r.n)+"}{"+Lstr+"}":"\\frac{"+(RF.gr(t.r.n)===0&&t.r.n[0].n===1?par(mult):par(t.r.n)+" \\times "+par(mult))+"}{"+Lstr+"}"));
  });
  L.push("Escrever cada termo com esse denominador: "+mx(partes.join("")));
  L.push("Juntar numa só fração e desenvolver o numerador: "+mx("\\frac{"+pT(Nsum)+"}{"+Lstr+"}"));
  var nz=RF.nulo(Nsum),ratio=RF.rf(Nsum,Lfull);
  var igualP=function(A,B){return A.length===B.length&&A.every(function(c,k){return c.n===B[k].n&&c.d===B[k].d})};
  var semSimp=nz||(igualP(ratio.n,Nsum)&&igualP(ratio.d,Lfull));
  if(!semSimp)L.push("Simplificar, dividindo o numerador e o denominador pelo fator comum"+(RF.gr(RF.mdc(Nsum,Lfull))>0?" "+mx(par(RF.prim(RF.mdc(Nsum,Lfull)).p)):"")+": "+mx("\\frac{"+pT(Nsum)+"}{"+Lstr+"} = "+rT(R)));
  else Rstr=nz?"0":"\\frac{"+pT(Nsum)+"}{"+Lstr+"}";
 }
 if(val!==null){
  var vx=val===Math.round(val)?RF.Fr(Math.round(val)):RF.Fr(Math.round(val*1000),1000);
  var Dv=RF.ev(R.d,vx);if(Dv.n===0)return {f:"0",m:mx(orig)+" com "+mx(X+" = "+F(val)),p:[],e:"Com "+X+" = "+F(val).replace(".",",")+" o denominador fica zero, por isso a expressão não está definida."};
  var Nv=RF.ev(R.n,vx),res=RF.fv(Nv,Dv);
  var vt=vx.d===1?(vx.n<0?"("+vx.n+")":String(vx.n)):"\\frac{"+vx.n+"}{"+vx.d+"}";
  var sbs=function(P){var o=[],g=RF.gr(P);for(var k=g;k>=0;k--){var c=P[k];if(c.n===0&&g>0)continue;var mag=Math.abs(c.n),b=k===0?String(mag):(mag===1?"":String(mag)+" \\times ")+(k===1?vt:vt+"^{"+k+"}");o.push((o.length===0?(c.n<0?"-":""):(c.n<0?"- ":"+ "))+b)}return o.join(" ")||"0"};
  L.push("Substituir "+mx(X)+" por "+mx(vt)+": "+(RF.gr(R.d)===0&&R.d[0].n===1?mx(sbs(R.n)):mx("\\frac{"+sbs(R.n)+"}{"+sbs(R.d)+"}")));
  var rs=res.d===1?String(res.n):"\\frac{"+res.n+"}{"+res.d+"}";
  L.push("Calcular: "+mx(((RF.gr(R.d)===0&&R.d[0].n===1)||Nv.d>1||Dv.d>1||(Nv.n===res.n&&Dv.n===res.d)?"":"\\frac{"+Nv.n+"}{"+Dv.n+"} = ")+rs+(res.d===1?"":" \\approx "+String(Math.round(res.n/res.d*1e4)/1e4).replace(".","{,}"))));
  var vf=res.n/res.d;
  var okv=Math.abs(terms.reduce(function(a,t){return a+t.sg*EF(t.nd,val)},0)-vf)<1e-6*(Math.abs(vf)+1);
  var nL=L.length;
  return {f:String(Math.round(vf*1e9)/1e9),m:mx(orig)+" com "+mx(X+" = "+F(val)),p:L.map(function(x,k){return (k===0?"Primeiro: ":k===nL-1?"Por fim: ":"Depois: ")+x}),e:"",r:mx(rs),tt:TT2({d:"calcular a expressão original com "+X+" = "+F(val),t:"expressão original",ok:okv,c:"A expressão original, com "+md(mx(X+" = "+F(val)))+", dá "+md(mx(String(Math.round(terms.reduce(function(a,t){return a+t.sg*EF(t.nd,val)},0)*1e4)/1e4).replace(".","{,}")))+", igual a "+md(mx(String(Math.round(vf*1e4)/1e4).replace(".","{,}")))+"."},{d:"recalcular com outro caminho",t:"valor exato",ok:Math.abs(Dv.n)>0,c:"O valor exato é a fração "+md(mx(rs))+"."})};
 }
 /* testes: dois pontos diferentes, evitando os polos */
 var pts=[2,3,-2,5,7,-3,4,6],usados=[];
 pts.forEach(function(x){if(usados.length<2&&RF.ev(R.d,RF.Fr(x)).n!==0&&terms.every(function(t){return RF.ev(t.r.d,RF.Fr(x)).n!==0&&isFinite(EF(t.nd,x))}))usados.push(x)});
 function tst(x,k){var a=terms.reduce(function(s2,t){return s2+t.sg*EF(t.nd,x)},0),b=RF.evf(R.n,x)/RF.evf(R.d,x),f4=function(z){return String(Math.round(z*1e4)/1e4).replace(".","{,}")};return {d:"substituir "+X+" por "+F(x)+" na expressão original e no resultado",t:"substituir "+X+" = "+F(x),ok:Math.abs(a-b)<=1e-6*(Math.abs(a)+1),c:"Com "+md(mx(X+" = "+F(x)))+", a expressão original dá "+md(mx(f4(a)))+" e o resultado dá "+md(mx(f4(b)))+"."}}
 var TT=usados.length===2?TT2(tst(usados[0]),tst(usados[1])):undefined;
 L.push("Resultado simplificado.");
 L.pop();
 var nn2=L.length;if(!nn2)return null;
 return {f:"0",m:mx(orig),p:L.map(function(x,k){return (k===0?"Primeiro: ":k===nn2-1?"Por fim: ":"Depois: ")+x}),e:"",r:mx(Rstr||rT(R)),tt:TT};
 }catch(err){return null}
}
var _algUltima=null;
function expressaoAlgebrica(q){
 try{
 var s=String(q||"").toLowerCase().trim();
 if(!s||s.length>100)return null;
 s=s.replace(/^(?:por favor[, ]*)?(?:calcule|calcula|calcular|simplifique|simplifica|simplificar|resolva|resolve|resolver|expanda|expande|desenvolva|desenvolve|qual\s+(?:[eé]\s+)?o\s+valor\s+de|quanto\s+(?:[eé]|vale|d[aá]))\s*/,"").replace(/[?!.\s]+$/,"");
 var val=null,m=/^(.*?)[,\s]*(?:com|para|quando|se|sendo|onde|e\s+se)?\s*\b([a-df-z])\s*(?:=|vale|for|igual\s+a)\s*(-|−)?\s*(\d+(?:[.,]\d+)?)$/.exec(s),X0=null;
 if(m&&m[1].trim()){s=m[1].trim();X0=m[2];val=parseFloat(m[4].replace(",","."))*(m[3]?-1:1)}
 if(s.indexOf("=")>=0||s.length<2||!/\d/.test(s))return null;
 if(!/^[0-9a-df-z+\-−–*×/÷:^().,\s²³⁴⁵⁶⁷⁸⁹\[\]{}]+$/.test(s))return null;
 if(!/[a-df-z]/.test(s.replace(/\d\s*x\s*\d/g,"#")))return null;
 if(/\d\s+[a-z]\s+\d/.test(s))return null;
 var vars={},P;
 try{P=LP.poly(s,vars)}catch(e){return null}
 var nv=Object.keys(vars);if(nv.length!==1)return null;
 var X=nv[0];if(X0&&X0!==X)return null;
 var g=LP.grau(P);
 function Z(v){return Math.abs(v)<1e-12?0:v}
 function F(n){n=Math.round(n*1e6)/1e6;if(n===0)n=0;return String(n).replace(".",",").replace("-","−")}
 function W(n){return n<0?"("+F(n)+")":F(n)}
 var SUP="⁰¹²³⁴⁵⁶⁷⁸⁹";
 function pot(k){return k===0?"":k===1?X:X+(k<10?SUP.charAt(k):"^"+k)}
 function termos(){
  var out="";
  for(var k=g;k>=0;k--){
   var c=Z(P[k]||0);if(c===0&&!(k===0&&out===""))continue;
   var mag=Math.abs(c),body=k===0?F(mag):(mag===1?"":F(mag))+pot(k);
   out+=out===""?(c<0?"−":"")+body:" "+(c<0?"−":"+")+" "+body;
  }
  return out;
 }
 function passos(L){var n=L.length;return L.map(function(x,k){return (k===0?"Primeiro: ":k===n-1?"Por fim: ":"Depois: ")+x})}
 var orig=s.replace(/\*/g,"×").replace(/-/g,"−").replace(/\^2/g,"²").replace(/\^3/g,"³").replace(/\s+/g," ");
 var simp=termos(),L=[];
 if(g===0&&val===null)return null;
 function igual(a,b){return a.replace(/[\s×]/g,"")===b.replace(/[\s×]/g,"")}
 if(val===null){
  if(g>2){
   L.push("Isto é uma expressão com a letra "+mx(X)+", por isso não tem um único valor.");
   if(!igual(orig,simp))L.push("Forma simplificada: "+mx(simp));
   L.push("Polinómio do "+g+".º grau: só resolvo raízes do 1.º e 2.º grau.");
   _algUltima={s:s,t:Date.now()};
   return {f:"0",m:mx(orig),p:passos(L),e:"",r:mx(simp)};
  }
  /* sem "=": a pessoa quer as raizes, por isso resolve-se "expressao = 0" */
  var eq=equacao(s+" = 0");
  _algUltima={s:s,t:Date.now()};
  if(!eq||eq.e)return eq;
  var pre="Não há \"=\" nem valor para "+mx(X)+": assumi que queres as raízes, ou seja, "+mx(simp+" = 0");
  if(!igual(orig,simp))pre="Simplificar: "+mx(simp)+". "+pre;
  eq.p=eq.p.map(function(x){return x.replace(/^(Primeiro|Depois|Por fim): /,"")});
  eq.p=eq.p.filter(function(x){return !/^Passar tudo para o mesmo lado/.test(x)});
  eq.p=passos([pre].concat(eq.p).concat(["Para o valor da expressão com um "+mx(X)+" concreto, diz por exemplo "+mx(X+" = 3")+"."]));
  return eq;
 }
 if(!igual(orig,simp))L.push("Forma simplificada: "+mx(simp));
 var xs=W(val),sub="",ts=[],tv=[],tot=0;
 for(var k=g;k>=0;k--){
  var c=Z(P[k]||0);if(c===0&&!(k===0&&ts.length===0))continue;
  var pv=Math.pow(val,k),v=c*pv;tot+=v;
  var base=k===0?F(Math.abs(c)):(Math.abs(c)===1?"":F(Math.abs(c))+" × ")+(k===1?xs:xs+(k<10?SUP.charAt(k):"^"+k));
  ts.push((ts.length===0?(c<0?"−":""):(c<0?"− ":"+ "))+base);
  tv.push(v);
 }
 sub=ts.join(" ");
 L.push("Substituir "+mx(X)+" por "+mx(F(val))+": "+mx(sub));
 if(g>0)L.push("Calcular cada termo: "+mx(tv.map(F).join("; ")));
 L.push("Somar: "+mx(tv.map(function(v,i){return i===0?F(v):v<0?"− "+F(-v):"+ "+F(v)}).join(" ")+" = "+F(tot)));
 return {f:String(Math.round(tot*1e9)/1e9),m:mx(simp)+" com "+mx(X+" = "+F(val)),p:passos(L),e:"",r:mx(F(tot))};
 }catch(err){return null}
}
/* ===== Fracoes com passos =====
   "1/2 + 1/3", "3/4 × 2/5", "(1/2 + 1/3) ÷ 5/6", "simplifica 12/18", "3/4 de 20".
   Aritmetica exacta com inteiros: mmc para somar e subtrair, produto cruzado, inverso para dividir e simplificacao final. */
function fracoes(q){
 try{
 var o=String(q||"").toLowerCase().trim();
 if(!o||o.length>120)return null;
 var s=o.replace(/^(?:por favor[, ]*)?(?:calcula|calcule|calcular|resolve|resolva|resolver|simplifica|simplifique|simplificar|reduz|reduza|reduzir|efetue|efectue|quanto\s+[eé]|qual\s+[eé]\s+o\s+resultado\s+d[ea])\s*/,"").replace(/^(?:a\s+)?(?:fra[cç][aã]o|fra[cç][oõ]es|express[aã]o)\s+(?:de\s+)?/,"").replace(/[?!.=\s]+$/,"");
 var pedeSimp=/\b(simplif\w*|reduz\w*)\b/.test(o)||/fra[cç][aã]o/.test(o);
 s=s.replace(/(\d+\/\d+)\s+de\s+(\d+)/g,"$1 × $2").replace(/\bmais\b/g,"+").replace(/\bmenos\b/g,"-").replace(/\b(?:vezes|multiplicado\s+por)\b/g,"×").replace(/\b(?:dividido\s+por|a\s+dividir\s+por|dividido)\b/g,"÷");
 s=s.replace(/[−–]/g,"-").replace(/\s+\/\s+/g," ÷ ").replace(/(?<=[\d)])\s*[x*]\s*(?=[\d(])/g,"×").replace(/(?<=[\d)])\s*:\s*(?=[\d(])/g,"÷");
 if(!/^[\d\s+\-×÷\/()]+$/.test(s))return null;
 if(!/\d+\/\d+/.test(s))return null;
 var tk=s.match(/\d+\/\d+|\d+|[+\-×÷()]/g);if(!tk||tk.join("").replace(/\s/g,"")!==s.replace(/\s/g,""))return null;
 var L=[],ER=function(t){return {f:"0",m:mx(s),p:[],e:t}};
 function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=b;b=a%b;a=t}return a||1}
 function R(n,d){if(d===0)throw "z";if(d<0){n=-n;d=-d}return {n:n,d:d}}
 function grande(r){if(Math.abs(r.n)>1e12||r.d>1e12)throw "g"}
 function fr(r){return r.d===1?String(r.n):(r.n<0?"-":"")+"\\frac{"+Math.abs(r.n)+"}{"+r.d+"}"}
 function frp(r){return r.n<0?"("+fr(r)+")":fr(r)}
 function simp(r,rot){var g=gcd(r.n,r.d);if(g>1){var n=R(r.n/g,r.d/g);L.push("Simplificar "+mx(fr(r))+", dividindo o numerador e o denominador por "+mx(g)+": "+mx(fr(r)+" = "+fr(n)));return n}return r}
 var p=0;
 function atom(){
  var t=tk[p++];if(t===undefined)throw 0;
  if(t==="("){var v=soma();if(tk[p++]!==")")throw 0;return {r:v.r,l:"\\left("+v.l+"\\right)"}}
  if(t==="-"){var a=atom();return {r:R(-a.r.n,a.r.d),l:"-"+a.l}}
  var m=/^(\d+)\/(\d+)$/.exec(t);
  if(m)return {r:R(parseInt(m[1],10),parseInt(m[2],10)),l:"\\frac{"+m[1]+"}{"+m[2]+"}"};
  if(/^\d+$/.test(t))return {r:R(parseInt(t,10),1),l:t};
  throw 0;
 }
 function termo(){
  var a=atom();
  while(tk[p]==="×"||tk[p]==="÷"){
   var op=tk[p++],b=atom(),r;
   if(op==="×"){
    r=R(a.r.n*b.r.n,a.r.d*b.r.d);grande(r);
    L.push("Multiplicar os numeradores entre si e os denominadores entre si: "+mx(frp(a.r)+" \\times "+frp(b.r)+" = \\frac{"+a.r.n+" \\times "+b.r.n+"}{"+a.r.d+" \\times "+b.r.d+"} = "+fr(r)));
   }else{
    if(b.r.n===0)throw "z";
    var inv=R(b.r.d,b.r.n);r=R(a.r.n*inv.n,a.r.d*inv.d);grande(r);
    L.push("Dividir é multiplicar pelo inverso da segunda fração ("+mx(fr(b.r)+" \\to "+fr(inv))+"): "+mx(frp(a.r)+" \\div "+frp(b.r)+" = "+frp(a.r)+" \\times "+frp(inv)+" = "+fr(r)));
   }
   r=simp(r);a={r:r,l:a.l+(op==="×"?" \\times ":" \\div ")+b.l};
  }
  return a;
 }
 function soma(){
  var a=termo();
  while(tk[p]==="+"||tk[p]==="-"){
   var op=tk[p++],b=termo(),r,sg=op==="+"?1:-1,sy=op==="+"?" + ":" - ";
   if(a.r.d===b.r.d){
    r=R(a.r.n+sg*b.r.n,a.r.d);
    L.push("Os denominadores são iguais ("+mx(a.r.d)+"), por isso "+(sg>0?"somam":"subtraem")+"-se só os numeradores: "+mx(frp(a.r)+sy+frp(b.r)+" = \\frac{"+a.r.n+sy+(b.r.n<0?"("+b.r.n+")":b.r.n)+"}{"+a.r.d+"} = "+fr(r)));
   }else{
    var mm=a.r.d/gcd(a.r.d,b.r.d)*b.r.d;grande({n:mm,d:1});
    var na=a.r.n*(mm/a.r.d),nb=b.r.n*(mm/b.r.d);
    L.push("Denominadores diferentes: o mmc de "+mx(a.r.d)+" e "+mx(b.r.d)+" é "+mx(mm));
    L.push("Converter para o denominador "+mx(mm)+": "+mx(frp(a.r)+" = \\frac{"+a.r.n+" \\times "+(mm/a.r.d)+"}{"+mm+"} = "+fr(R(na,mm))+"\\quad e \\quad "+frp(b.r)+" = \\frac{"+b.r.n+" \\times "+(mm/b.r.d)+"}{"+mm+"} = "+fr(R(nb,mm))));
    r=R(na+sg*nb,mm);
    L.push((sg>0?"Somar":"Subtrair")+" os numeradores: "+mx(fr(R(na,mm))+sy+frp(R(nb,mm))+" = \\frac{"+na+sy+(nb<0?"("+nb+")":nb)+"}{"+mm+"} = "+fr(r)));
   }
   grande(r);r=simp(r);a={r:r,l:a.l+sy+b.l};
  }
  return a;
 }
 var v;
 try{
  if(tk.length===1&&/\//.test(tk[0])){
   if(!pedeSimp)return null;
   var mt=/^(\d+)\/(\d+)$/.exec(tk[0]),n0=parseInt(mt[1],10),d0=parseInt(mt[2],10);
   if(d0===0)return ER("Não dá para dividir por zero: o denominador não pode ser 0.");
   var g0=gcd(n0,d0),r0=R(n0/g0,d0/g0);
   L.push("Procurar o mdc de "+mx(n0)+" e "+mx(d0)+": "+mx("\\operatorname{mdc}("+n0+",\\ "+d0+") = "+g0));
   L.push(g0>1?"Dividir o numerador e o denominador por "+mx(g0)+": "+mx("\\frac{"+n0+" \\div "+g0+"}{"+d0+" \\div "+g0+"} = "+fr(r0)):"O mdc é "+mx(1)+", por isso a fração já está na forma mais simples");
   v={r:r0,l:"\\frac{"+n0+"}{"+d0+"}"};
  }else{
   v=soma();if(p<tk.length)return null;
  }
 }catch(e){
  if(e==="z")return ER("Não dá para dividir por zero.");
  if(e==="g")return ER("Os números ficaram demasiado grandes para eu mostrar os passos.");
  return null;
 }
 var r=v.r,val=r.n/r.d;
 function Fd(x){x=Math.round(x*1e4)/1e4;return String(x).replace(".","{,}")}
 var tail=r.d===1?"":(Math.abs(r.n)>r.d?" = "+(r.n<0?"-":"")+Math.floor(Math.abs(r.n)/r.d)+"\\frac{"+(Math.abs(r.n)%r.d)+"}{"+r.d+"}":"")+" \\approx "+Fd(val);
 if(r.d!==1&&Math.abs(r.n)%r.d===0)tail=" \\approx "+Fd(val);
 if(r.d!==1&&Math.abs(r.n)>r.d)L.push("Escrever como número misto e em decimal: "+mx(fr(r)+tail));
 else if(r.d!==1)L.push("Em decimal: "+mx(fr(r)+" \\approx "+Fd(val)));
 if(!L.length)return null;
 var n=L.length;
 var _q2=0,_fd=function(x){return String(Math.round(x*1e4)/1e4).replace(".","{,}")};
 function _ea(){var t=tk[_q2++];if(t==="("){var v2=_es();_q2++;return v2}if(t==="-")return -_ea();var mm=/^(\d+)\/(\d+)$/.exec(t);if(mm)return +mm[1]/+mm[2];return +t}
 function _et(){var a=_ea();while(tk[_q2]==="×"||tk[_q2]==="÷"){var o=tk[_q2++],b=_ea();a=o==="×"?a*b:a/b}return a}
 function _es(){var a=_et();while(tk[_q2]==="+"||tk[_q2]==="-"){var o=tk[_q2++],b=_et();a=o==="+"?a+b:a-b}return a}
 var _dv=_es(),_g2=gcd(r.n,r.d),_o1=eqn(_dv,val),_o2=_g2===1;
 var _tt=TT2({d:"fazer a conta toda em decimais",t:"conta em decimais",ok:_o1,c:"Fazendo a conta toda em decimais dá "+md(mx(_fd(_dv)))+" e a fração do resultado, "+md(mx(fr(r)))+", também vale "+md(mx(_fd(val)))+(_o1?"":" (não confere)")+"."},
  {d:"ver se a fração final está simplificada",t:"fração irredutível",ok:_o2,c:"O máximo divisor comum de "+md(mx(Math.abs(r.n)))+" e "+md(mx(r.d))+" é "+md(mx(_g2))+(_o2?", por isso já não se pode simplificar mais.":", por isso ainda se podia simplificar.")});
 return {tt:_tt,f:String(Math.round(val*1e9)/1e9),m:mx(v.l),p:L.map(function(t,k){return (k===0?"Primeiro: ":k===n-1?"Por fim: ":"Depois: ")+t}),e:"",r:mx(fr(r)+(r.d===1?"":tail))};
 }catch(err){return null}
}
/* ===== Sistemas de duas equacoes com duas incognitas =====
   "x + y = 10 e x - y = 2", "sistema: 2x+3y=12; x-y=1", "... pelo metodo da substituicao".
   Por omissao usa o metodo da adicao (eliminar uma incognita); com "substituicao" isola e substitui. */
function sistema(q){
 try{
 var o=String(q||"").toLowerCase().trim();
 if(!o||o.length>140||(o.match(/=/g)||[]).length!==2)return null;
 var subst=/substitui/.test(o);
 var s=o.replace(/\b(?:pelo|usando|com|por|utilizando|atrav[eé]s\s+d[oa])\s+(?:o\s+)?m[eé]todo\s+(?:da|de|do)\s+[^\s;,]+/g," ").replace(/^(?:por favor[, ]*)?(?:resolve|resolva|resolver|calcula|calcule|determina|determine|encontra|encontre)?\s*(?:o\s+)?(?:sistema(?:\s+de\s+equa[cç][aã]o|\s+de\s+equa[cç][oõ]es)?)?\s*[:\-]?\s*/,"").replace(/[?!.\s]+$/,"");
 var cnt=function(t){return (t.match(/=/g)||[]).length},eqs=null,re=/\s*(?:;|\n|&|\be\b|,)\s*/g,m;
 while((m=re.exec(s))){var a=s.slice(0,m.index),b=s.slice(m.index+m[0].length);if(cnt(a)===1&&cnt(b)===1){eqs=[a,b];break}if(!m[0].length)re.lastIndex++}
 if(!eqs)return null;
 function lin(side,cf,sg){
  var t=side.replace(/\s+/g,"").replace(/[−–]/g,"-").replace(/,/g,".").replace(/[×*]/g,"");
  if(!t)return false;
  var rx=/^([+-]?)(\d+(?:\.\d+)?)?([a-z])?/,pos=0;
  while(pos<t.length){
   var mm=rx.exec(t.slice(pos));if(!mm||!mm[0].length||(!mm[2]&&!mm[3]))return false;
   var sgn=(mm[1]==="-"?-1:1)*sg,num=mm[2]!==undefined?parseFloat(mm[2]):1,k=mm[3]||"#";
   cf[k]=(cf[k]||0)+sgn*num;pos+=mm[0].length;
  }
  return true;
 }
 var cfs=[{},{}];
 for(var i=0;i<2;i++){var ld=eqs[i].split("=");if(!lin(ld[0],cfs[i],1)||!lin(ld[1],cfs[i],-1))return null}
 var vs={};cfs.forEach(function(c){Object.keys(c).forEach(function(k){if(k!=="#")vs[k]=1})});
 var vn=Object.keys(vs).sort();
 var m0=mx(eqs.map(function(e){return e.trim().replace(/-/g,"−")}).join(" ; "));
 var ER=function(t){return {f:"0",m:m0,p:[],e:t}};
 if(vn.length>2)return ER("Só resolvo sistemas de duas equações com duas incógnitas.");
 if(vn.length<2)return null;
 var X=vn[0],Y=vn[1];
 function Z(v){return Math.abs(v)<1e-12?0:v}
 var a1=Z(cfs[0][X]||0),b1=Z(cfs[0][Y]||0),c1=-(cfs[0]["#"]||0),a2=Z(cfs[1][X]||0),b2=Z(cfs[1][Y]||0),c2=-(cfs[1]["#"]||0);
 c1=Z(c1);c2=Z(c2);
 function F(n){n=Math.round(n*1e6)/1e6;if(n===0)n=0;return String(n).replace(".",",").replace("-","−")}
 function W(n){return n<0?"("+F(n)+")":F(n)}
 function eqt(a,b,c){
  var out="";
  [[a,X],[b,Y]].forEach(function(t){var k=t[0];if(k===0)return;var mag=Math.abs(k),body=(mag===1?"":F(mag))+t[1];out+=out===""?(k<0?"−":"")+body:" "+(k<0?"−":"+")+" "+body});
  return (out||"0")+" = "+F(c);
 }
 var D=a1*b2-a2*b1;
 if(Math.abs(D)<1e-12){
  var prop=Math.abs(a1*c2-a2*c1)<1e-9&&Math.abs(b1*c2-b2*c1)<1e-9;
  return ER(prop?"As duas equações dizem o mesmo (uma é múltipla da outra): o sistema é indeterminado, tem infinitas soluções.":"As equações são incompatíveis (mesmos coeficientes de "+X+" e "+Y+" mas resultados diferentes): o sistema é impossível, não tem solução.");
 }
 var xv=(c1*b2-c2*b1)/D,yv=(a1*c2-a2*c1)/D;
 var L=["Escrever o sistema: "+mx("(1)\\ "+eqt(a1,b1,c1))+" e "+mx("(2)\\ "+eqt(a2,b2,c2))];
 function tx1(k,v){return k===1?W(v):k===-1?"-"+W(v):F(k)+" \\times "+W(v)}
 function tyc(k){return k===1?"":F(k)}
 function ver(){L.push("Verificar na equação (2): "+mx(tx1(a2,xv)+(b2<0?" - "+(Math.abs(b2)===1?"":F(-b2)+" \\times ")+W(yv):" + "+(b2===1?"":F(b2)+" \\times ")+W(yv))+" = "+F(a2*xv+b2*yv))+(Math.abs(a2*xv+b2*yv-c2)<1e-6?", igual ao segundo membro: confere":""))}
 var algum0=(a1===0||b1===0||a2===0||b2===0);
 if(subst||algum0){
  /* isolar uma incognita: prefere equacao com coeficiente ±1 ou com um zero */
  var cand=[[0,X],[0,Y],[1,X],[1,Y]].filter(function(c){var k=c[0]?(c[1]===X?a2:b2):(c[1]===X?a1:b1);return k!==0});
  cand.sort(function(p,q2){function sc(c){var k=Math.abs(c[0]?(c[1]===X?a2:b2):(c[1]===X?a1:b1)),oth=c[0]?(c[1]===X?b2:a2):(c[1]===X?b1:a1);return (oth===0?-2:0)+(k===1?-1:0)}return sc(p)-sc(q2)});
  var e1=cand[0][0],V=cand[0][1],U=V===X?Y:X;
  var A=[[a1,b1,c1],[a2,b2,c2]][e1],B=[[a1,b1,c1],[a2,b2,c2]][1-e1];
  var kv=V===X?A[0]:A[1],ku=V===X?A[1]:A[0],pp=A[2]/kv,qq=-ku/kv;
  function lintxt(p0,q0,U0){var t="";if(p0!==0)t=F(p0);if(q0!==0){var mag=Math.abs(q0),body=(mag===1?"":F(mag))+U0;t+=t===""?(q0<0?"−":"")+body:" "+(q0<0?"−":"+")+" "+body}return t||"0"}
  L.push("Isolar "+mx(V)+" na equação ("+(e1+1)+"): "+mx(V+" = "+lintxt(pp,qq,U)));
  var kb=V===X?B[0]:B[1],kub=V===X?B[1]:B[0],tot=kub+kb*qq,rhs=B[2]-kb*pp;
  var uc=function(k){return k===1?"":k===-1?"−":F(k)};
  if(qq===0){
   L.push("Substituir "+mx(V+" = "+F(pp))+" na equação ("+(2-e1)+"): "+mx((kb===0?"":(kb===1?"":kb===-1?"−":F(kb)+" \\times ")+W(pp)+" ")+(kub<0?"− "+(kub===-1?"":F(-kub)):(kb===0?"":"+ ")+(kub===1?"":F(kub)))+U+" = "+F(B[2])));
   var rhs0=B[2]-kb*pp;
   if(kub!==1)L.push(mx(U+" = "+F(rhs0)+" \\div "+W(kub)+" = "+F(rhs0/kub)));
   else L.push(mx(U+" = "+F(rhs0)));
   var uv0=rhs0/kub,vv0=pp;
   xv=V===X?vv0:uv0;yv=V===X?uv0:vv0;ver();
  }else{
  L.push("Substituir "+mx(V)+" na equação ("+(2-e1)+"): "+mx((kb===1?"":kb===-1?"−":F(kb))+"\\left("+lintxt(pp,qq,U)+"\\right) "+(kub<0?"− "+(kub===-1?"":F(-kub)):"+ "+(kub===1?"":F(kub)))+U+" = "+F(B[2])));
  L.push("Desenvolver e agrupar: "+mx(uc(tot)+U+" = "+F(rhs)));
  var uv=rhs/tot;
  if(tot!==1)L.push(mx(U+" = "+F(rhs)+" \\div "+W(tot)+" = "+F(uv)));
  var vv=pp+qq*uv;
  L.push("Voltar à expressão de "+mx(V)+": "+mx(V+" = "+(pp!==0?F(pp)+(qq<0?" - ":" + "):(qq<0?"-":""))+(Math.abs(qq)===1?"":F(Math.abs(qq))+" \\times ")+W(uv)+" = "+F(vv)));
  xv=V===X?vv:uv;yv=V===X?uv:vv;ver();
  }
 }else{
  var g=1;if([a1,b1,a2,b2].every(Number.isInteger)){var gg=function(x,y){x=Math.abs(x);y=Math.abs(y);while(y){var t=y;y=x%y;x=t}return x};var l=Math.abs(b1*b2)/gg(b1,b2);g=l}else g=Math.abs(b1*b2);
  var m1=g/Math.abs(b1),m2=g/Math.abs(b2),mesmo=(b1>0)===(b2>0);
  L.push(m1===1&&m2===1?"Os coeficientes de "+mx(Y)+" são "+(mesmo?"iguais":"simétricos")+", por isso já se pode eliminar "+mx(Y):"Para eliminar "+mx(Y)+": "+[m1!==1?"multiplicar (1) por "+mx(F(m1)):"",m2!==1?"multiplicar (2) por "+mx(F(m2)):""].filter(Boolean).join(" e ")+": "+mx("(1)\\ "+eqt(a1*m1,b1*m1,c1*m1))+" e "+mx("(2)\\ "+eqt(a2*m2,b2*m2,c2*m2)));
  var Ax=mesmo?a1*m1-a2*m2:a1*m1+a2*m2,Cx=mesmo?c1*m1-c2*m2:c1*m1+c2*m2;
  L.push((mesmo?"Subtrair":"Somar")+" as duas equações (os termos em "+mx(Y)+" cancelam): "+mx((Ax===1?"":Ax===-1?"−":F(Ax))+X+" = "+F(Cx)));
  L.push(mx(X+" = "+F(Cx)+" \\div "+W(Ax)+" = "+F(xv)));
  L.push("Substituir "+mx(X+" = "+F(xv))+" na equação (1): "+mx(tx1(a1,xv)+(b1<0?" - "+tyc(-b1)+Y:" + "+tyc(b1)+Y).replace(" + 0"+Y,"")+" = "+F(c1)+" \\Rightarrow "+(Math.abs(b1)===1?"":(b1===-1?"":"")+F(b1))+Y+" = "+F(c1-a1*xv))+(Math.abs(b1)===1&&b1>0?"":", logo "+mx(Y+" = "+F(yv))));
  ver();
 }
 var n=L.length;
 var _l1=a1*xv+b1*yv,_l2=a2*xv+b2*yv,_s1=eqn(_l1,c1)&&eqn(_l2,c2),_x2,_y2;
 if(a1!==0){_y2=(c2-a2*c1/a1)/(b2-a2*b1/a1);_x2=(c1-b1*_y2)/a1}else{_y2=c1/b1;_x2=(c2-b2*_y2)/a2}
 var _s2=eqn(_x2,xv)&&eqn(_y2,yv);
 var _lh=function(a,b){var o=[];if(a!==0)o.push(W(a)+" \\times "+W(xv));if(b!==0)o.push(W(b)+" \\times "+W(yv));return o.join(" + ")||"0"};
 var _tt=TT2({d:"substituir "+X+" e "+Y+" nas duas equações",t:"substituir nas duas equações",ok:_s1,c:"Com "+md(mx(X+" = "+F(xv)+",\\ "+Y+" = "+F(yv)))+": na equação (1), "+md(mx(_lh(a1,b1)+" = "+F(_l1)))+" (esperado "+md(mx(F(c1)))+"); na equação (2), "+md(mx(_lh(a2,b2)+" = "+F(_l2)))+" (esperado "+md(mx(F(c2)))+")."},
  {d:"resolver outra vez por outro caminho (isolar uma incógnita e substituir)",t:"resolver por outro caminho",ok:_s2,c:"Isolando uma incógnita e substituindo na outra equação, obtém-se "+md(mx(X+" = "+F(_x2)+",\\ "+Y+" = "+F(_y2)))+(_s2?", igual à solução encontrada.":", diferente da solução encontrada.")});
 return {tt:_tt,f:String(Math.round(xv*1e9)/1e9),m:m0,p:L.map(function(t,k){return (k===0?"Primeiro: ":k===n-1?"Por fim: ":"Depois: ")+t}),e:"",r:mx(X+" = "+F(xv))+" e "+mx(Y+" = "+F(yv))};
 }catch(err){return null}
}
/* ===== Estatistica com passos: media, variancia e desvio padrao ===== */
function estatistica(tipo,nums,am){
 try{
 var n=nums.length;if(n<2||n>12)return null;
 function F(x){x=Math.round(x*1e4)/1e4;if(x===0)x=0;return String(x).replace(".",",").replace("-","−")}
 function W(x){return x<0?"("+F(x)+")":F(x)}
 var soma=nums.reduce(function(a,b){return a+b},0),mu=soma/n,L=[],arred=false;
 function chk(x){if(Math.abs(Math.round(x*1e4)/1e4-x)>1e-12)arred=true;return x}
 L.push("Somar os valores: "+mx(nums.map(function(x,i){return i?(x<0?"− "+F(-x):"+ "+F(x)):F(x)}).join(" ")+" = "+F(soma)));
 L.push("Dividir pela quantidade de valores ("+mx(n)+"): "+mx("\\bar{x} = "+F(soma)+" \\div "+n+" = "+F(chk(mu))));
 var _ss=nums.reduce(function(a,b){return a+b/n},0),_sd=nums.reduce(function(a,b){return a+(b-mu)},0);
 var _ttm=TT2({d:"recalcular a média dividindo cada valor por "+n,t:"recalcular a média",ok:eqn(_ss,mu),c:"Somando cada valor dividido por "+md(mx(n))+" obtém-se "+md(mx(F(_ss)))+", igual à média "+md(mx(F(mu)))+"."},
  {d:"ver se a soma dos desvios é zero",t:"soma dos desvios",ok:Math.abs(_sd)<1e-6*(Math.abs(soma)+1),c:"A soma dos desvios em relação à média tem de ser zero; aqui dá "+md(mx(F(Math.abs(_sd)<1e-9?0:_sd)))+"."});
 if(tipo==="media")return {tt:_ttm,f:String(mu),m:"média de "+mx(nums.map(F).join(", ")),p:L.map(function(t,k){return (k===0?"Primeiro: ":k===L.length-1?"Por fim: ":"Depois: ")+t}),e:"",r:mx("\\bar{x} = "+F(mu))};
 var ds=nums.map(function(x){return x-mu}),qs=ds.map(function(d){return d*d}),sq=qs.reduce(function(a,b){return a+b},0);
 L.push("Calcular o desvio de cada valor em relação à média ("+mx("x_i - \\bar{x}")+"): "+mx(nums.map(function(x,i){return F(x)+" - "+W(chk(mu))+" = "+F(chk(ds[i]))}).join(";\\ ")));
 L.push("Elevar cada desvio ao quadrado: "+mx(ds.map(function(d,i){return W(chk(d))+"^{2} = "+F(chk(qs[i]))}).join(";\\ ")));
 L.push("Somar os quadrados: "+mx(qs.map(function(x,i){return i?"+ "+F(x):F(x)}).join(" ")+" = "+F(chk(sq))));
 var den=am?n-1:n,vr=sq/den,sym=am?"s":"\\sigma";
 L.push("Variância"+(am?" amostral (divide por "+mx("n - 1")+")":" (divide por "+mx("n")+")")+": "+mx(sym+"^{2} = "+F(sq)+" \\div "+den+" = "+F(chk(vr))));
 var _q1=nums.reduce(function(a,b){return a+b*b},0),_alt=am?(_q1-n*mu*mu)/(n-1):_q1/n-mu*mu,_sdv=Math.sqrt(vr);
 var _ttv=TT2({d:"usar a fórmula alternativa da variância (média dos quadrados menos o quadrado da média)",t:"fórmula alternativa",ok:eqn(_alt,vr),c:"Pela fórmula alternativa, a variância dá "+md(mx(F(_alt)))+", igual a "+md(mx(F(vr)))+"."},
  {d:"conferir que a raiz quadrada da variância ao quadrado volta à variância",t:"raiz e quadrado",ok:eqn(_sdv*_sdv,vr)&&vr>=0,c:"A raiz quadrada de "+md(mx(F(vr)))+" é "+md(mx(F(_sdv)))+" e, elevada ao quadrado, dá "+md(mx(F(_sdv*_sdv)))+"."});
 if(tipo==="variancia"){var n1=L.length;return {tt:_ttv,f:String(vr),m:"variância"+(am?" amostral":"")+" de "+mx(nums.map(F).join(", ")),p:L.map(function(t,k){return (k===0?"Primeiro: ":k===n1-1?"Por fim: ":"Depois: ")+t}),e:"",r:mx(sym+"^{2} = "+F(vr))+(arred?" (valores arredondados a 4 casas decimais)":"")}}
 var sd=Math.sqrt(vr);
 L.push("O desvio padrão é a raiz quadrada da variância: "+mx(sym+" = \\sqrt{"+F(chk(vr))+"} = "+F(chk(sd))));
 var n2=L.length;
 return {tt:_ttv,f:String(sd),m:"desvio padrão"+(am?" amostral":"")+" de "+mx(nums.map(F).join(", ")),p:L.map(function(t,k){return (k===0?"Primeiro: ":k===n2-1?"Por fim: ":"Depois: ")+t}),e:"",r:mx(sym+" = "+F(sd))+(arred?" (valores arredondados a 4 casas decimais)":"")};
 }catch(err){return null}
}
/* ===== Geometria, unidades, regra de tres e juros, com passos ===== */
function aplicadas(q){
 try{
 var t=norm(q).replace(/[?!.]+$/,"");
 if(!t||t.length>160)return null;
 var ns=(t.match(/\d+(?:[.,]\d+)?/g)||[]).map(function(x){return parseFloat(x.replace(",","."))});
 if(!ns.length||ns.length>4)return null;
 function F(n){n=Math.round(n*1e4)/1e4;if(n===0)n=0;return String(n).replace(".",",").replace("-","−")}
 function out(m,L,r,f,tt){var n=L.length;return {tt:tt,f:String(f),m:m,p:L.map(function(s,k){return (k===0?"Primeiro: ":k===n-1?"Por fim: ":"Depois: ")+s}),e:"",r:r}}
 var m;
 /* ---- juros ---- */
 if(/\bjuros?\b|\bmontante\b/.test(t)&&ns.length>=3){
  var C=ns[0],i=ns[1],n=ns[2],comp=/composto/.test(t);
  if(C>0&&i>=0&&n>0&&n<=600){
   var L=[];
   L.push("Dados: capital "+mx("C = "+F(C))+", taxa "+mx("i = "+F(i)+"% = "+F(i/100))+", tempo "+mx("t = "+F(n)));
   var J,M;
   if(comp){
    M=C*Math.pow(1+i/100,n);J=M-C;
    L.push("Juros compostos: o montante é "+mx("M = C(1 + i)^{t}"));
    L.push("Substituir: "+mx("M = "+F(C)+" \\times (1 + "+F(i/100)+")^{"+F(n)+"} = "+F(C)+" \\times "+F(Math.pow(1+i/100,n))+" = "+F(M)));
    L.push("Os juros são o montante menos o capital: "+mx("J = "+F(M)+" - "+F(C)+" = "+F(J)));
   }else{
    J=C*i/100*n;M=C+J;
    L.push("Juros simples: "+mx("J = C \\times i \\times t"));
    L.push("Substituir: "+mx("J = "+F(C)+" \\times "+F(i/100)+" \\times "+F(n)+" = "+F(J)));
    L.push("O montante é o capital mais os juros: "+mx("M = "+F(C)+" + "+F(J)+" = "+F(M)));
   }
   L.push("A taxa e o tempo têm de estar na mesma unidade (por exemplo, % ao ano e anos).");
   var tj=TT2({d:"conferir que o montante é o capital mais os juros",t:"montante = capital + juros",ok:eqn(C+J,M),c:"Somando "+md(mx(F(C)+" + "+F(J)))+" obtém-se "+md(mx(F(C+J)))+", igual ao montante "+md(mx(F(M)))+"."},
   comp?{d:"descobrir o tempo a partir do montante com logaritmos",t:"tempo a partir do montante",ok:i>0?eqn(Math.log(M/C)/Math.log(1+i/100),n):true,c:"Pelos logaritmos, "+md(mx("t = \\frac{\\ln(M/C)}{\\ln(1 + i)} = "+F(i>0?Math.log(M/C)/Math.log(1+i/100):n)))+", igual ao tempo dado."}
   :{d:"descobrir a taxa a partir dos juros",t:"taxa a partir dos juros",ok:eqn(J/(C*n)*100,i),c:"Pela fórmula inversa, "+md(mx("i = \\frac{J}{C \\times t} = \\frac{"+F(J)+"}{"+F(C)+" \\times "+F(n)+"} = "+F(J/(C*n)*100)+"%"))+", igual à taxa dada."});
   return out("juros "+(comp?"compostos":"simples"),L,mx("J = "+F(J))+" e "+mx("M = "+F(M)),Math.round(M*100)/100,tj);
  }
 }
 /* ---- regra de tres ---- */
 if((/regra de tres/.test(t)||(/^se\b/.test(t)&&/\bquant[oa]s?\b/.test(t)))&&ns.length===3){
  var inv=/inversa|inversamente|trabalhadores|operarios|pedreiros|pessoas|maquinas|torneiras|velocidade/.test(t);
  var A=ns[0],B=ns[1],Cc=ns[2];
  if(A>0&&B>0&&Cc>0){
   var x=inv?A*B/Cc:B*Cc/A,L=[];
   L.push("Organizar os dados: "+mx("\\begin{array}{c|c} "+F(A)+" & "+F(B)+" \\\\ "+F(Cc)+" & x \\end{array}"));
   if(inv){
    L.push("As grandezas são **inversamente** proporcionais (uma sobe, a outra desce), por isso multiplicam-se os valores da mesma linha: "+mx(F(A)+" \\times "+F(B)+" = "+F(Cc)+" \\times x"));
    L.push("Isolar "+mx("x")+": "+mx("x = \\frac{"+F(A)+" \\times "+F(B)+"}{"+F(Cc)+"} = \\frac{"+F(A*B)+"}{"+F(Cc)+"} = "+F(x)));
   }else{
    L.push("As grandezas são **diretamente** proporcionais, por isso as razões são iguais: "+mx("\\frac{"+F(A)+"}{"+F(Cc)+"} = \\frac{"+F(B)+"}{x}"));
    L.push("Multiplicar em cruz: "+mx(F(A)+" \\times x = "+F(B)+" \\times "+F(Cc)));
    L.push("Isolar "+mx("x")+": "+mx("x = \\frac{"+F(B)+" \\times "+F(Cc)+"}{"+F(A)+"} = \\frac{"+F(B*Cc)+"}{"+F(A)+"} = "+F(x)));
   }
   var o1=inv?eqn(A*B,Cc*x):eqn(A/Cc,B/x),x2=inv?B*(A/Cc):B*(Cc/A);
   var tr=TT2({d:"substituir "+"x"+" na proporção",t:"substituir na proporção",ok:o1,c:inv?"Com "+md(mx("x = "+F(x)))+": "+md(mx(F(A)+" \\times "+F(B)+" = "+F(A*B)+"\\text{ e }"+F(Cc)+" \\times "+F(x)+" = "+F(Cc*x)))+".":"Com "+md(mx("x = "+F(x)))+": "+md(mx("\\frac{"+F(A)+"}{"+F(Cc)+"} = "+F(A/Cc)+"\\text{ e }\\frac{"+F(B)+"}{"+F(x)+"} = "+F(B/x)))+"."},
    {d:"calcular com o fator de variação",t:"fator de variação",ok:eqn(x2,x),c:"O fator é "+md(mx(inv?F(A/Cc):F(Cc/A)))+" e "+md(mx(F(B)+" \\times "+F(inv?A/Cc:Cc/A)+" = "+F(x2)))+", igual a "+md(mx("x"))+"."});
   return out("regra de três",L,mx("x = "+F(x)),Math.round(x*1e6)/1e6,tr);
  }
 }
 /* ---- unidades ---- */
 var U={m:{mm:.001,cm:.01,dm:.1,m:1,km:1000},g:{mg:.001,g:1,kg:1000,t:1e6},l:{ml:.001,cl:.01,l:1},s:{s:1,min:60,h:3600,d:86400,sem:604800}};
 var AL={milimetro:"mm",milimetros:"mm",centimetro:"cm",centimetros:"cm",decimetro:"dm",decimetros:"dm",metro:"m",metros:"m",quilometro:"km",quilometros:"km",kilometro:"km",kilometros:"km",miligrama:"mg",miligramas:"mg",grama:"g",gramas:"g",quilo:"kg",quilos:"kg",quilograma:"kg",quilogramas:"kg",kilo:"kg",kilos:"kg",tonelada:"t",toneladas:"t",mililitro:"ml",mililitros:"ml",centilitro:"cl",centilitros:"cl",litro:"l",litros:"l",segundo:"s",segundos:"s",minuto:"min",minutos:"min",hora:"h",horas:"h",dia:"d",dias:"d",semana:"sem",semanas:"sem",celsius:"C",fahrenheit:"F",kelvin:"K",c:"C",f:"F",k:"K"};
 function ua(s){if(AL[s])return AL[s];return null}
 if((m=/(-?\d+(?:[.,]\d+)?)\s*(?:graus?\s+)?([a-z]+)\s+(?:em|para|pra|a)\s+(?:graus?\s+)?([a-z]+)\b/.exec(t))){
  var v=parseFloat(m[1].replace(",",".")),u1=ua(m[2])||(U.m[m[2]]||U.g[m[2]]||U.l[m[2]]||U.s[m[2]]?m[2]:null),u2=ua(m[3])||(U.m[m[3]]||U.g[m[3]]||U.l[m[3]]||U.s[m[3]]?m[3]:null);
  if(u1&&u2&&u1!==u2){
   var T1={C:1,F:1,K:1};
   if(T1[u1]&&T1[u2]){
    var L=[],c=v,nome={C:"°C",F:"°F",K:"K"};
    if(u1==="F"){c=(v-32)*5/9;L.push("Passar para Celsius: "+mx("C = (F - 32) \\times \\frac{5}{9} = ("+F(v)+" - 32) \\times \\frac{5}{9} = "+F(c)))}
    else if(u1==="K"){c=v-273.15;L.push("Passar para Celsius: "+mx("C = K - 273{,}15 = "+F(v)+" - 273{,}15 = "+F(c)))}
    var res=c;
    if(u2==="F"){res=c*9/5+32;L.push("Passar de Celsius para Fahrenheit: "+mx("F = C \\times \\frac{9}{5} + 32 = "+F(c)+" \\times \\frac{9}{5} + 32 = "+F(res)))}
    else if(u2==="K"){res=c+273.15;L.push("Passar de Celsius para Kelvin: "+mx("K = C + 273{,}15 = "+F(c)+" + 273{,}15 = "+F(res)))}
    if(!L.length)return null;
    var kv=function(val,u){return u==="C"?val+273.15:u==="F"?(val-32)*5/9+273.15:val},tk1=kv(v,u1),tk2=kv(res,u2);
    var back=u1==="C"?(u2==="F"?(res-32)*5/9:res-273.15):u1==="F"?(u2==="C"?res*9/5+32:(res-273.15)*9/5+32):(u2==="C"?res+273.15:(res-32)*5/9+273.15);
    var tt1=TT2({d:"voltar à unidade de partida",t:"conversão inversa",ok:eqn(back,v),c:"Fazendo o caminho de volta, "+md(mx(F(res)+"\\ "+nome[u2]))+" dá "+md(mx(F(back)+"\\ "+nome[u1]))+", igual ao valor dado."},
     {d:"comparar as duas temperaturas em Kelvin",t:"comparar em Kelvin",ok:eqn(tk1,tk2),c:"Em Kelvin, a temperatura de partida é "+md(mx(F(tk1)))+" e a de chegada é "+md(mx(F(tk2)))+"."});
    return out("converter "+F(v)+" "+nome[u1]+" para "+nome[u2],L,mx(F(v)+"\\ "+({C:"^{\\circ}C",F:"^{\\circ}F",K:"K"})[u1]+" = "+F(res)+"\\ "+({C:"^{\\circ}C",F:"^{\\circ}F",K:"K"})[u2]),Math.round(res*1e6)/1e6,tt1);
   }
   var cat=null;["m","g","l","s"].forEach(function(k){if(U[k][u1]&&U[k][u2])cat=k});
   if(cat){
    var f1=U[cat][u1],f2=U[cat][u2],r=f1/f2,res=v*r,L=[];
    var tu=function(x){return "\\text{ "+x+"}"};
    if(r>=1)L.push("Relação entre as unidades: "+mx("1"+tu(u1)+" = "+F(Math.round(r*1e9)/1e9)+tu(u2)));
    else L.push("Relação entre as unidades: "+mx("1"+tu(u2)+" = "+F(Math.round(1/r*1e9)/1e9)+tu(u1)));
    L.push(r>=1?"Multiplicar pelo fator: "+mx(F(v)+" \\times "+F(Math.round(r*1e9)/1e9)+" = "+F(res)):"Dividir pelo fator: "+mx(F(v)+" \\div "+F(Math.round(1/r*1e9)/1e9)+" = "+F(res)));
    var tu2=TT2({d:"converter de volta para "+u1,t:"conversão inversa",ok:eqn(res*f2/f1,v),c:"Convertendo "+md(mx(F(res)+tu(u2)))+" de volta, obtém-se "+md(mx(F(res*f2/f1)+tu(u1)))+", igual ao valor dado."},
     {d:"comparar as duas quantidades na unidade base",t:"comparar na unidade base",ok:eqn(v*f1,res*f2),c:"Na unidade base, "+md(mx(F(v)+tu(u1)))+" vale "+md(mx(F(v*f1)))+" e "+md(mx(F(res)+tu(u2)))+" vale "+md(mx(F(res*f2)))+"."});
    return out("converter "+F(v)+" "+u1+" para "+u2,L,mx(F(v)+tu(u1)+" = "+F(res)+tu(u2)),Math.round(res*1e9)/1e9,tu2);
   }
  }
 }
 /* ---- geometria ---- */
 if(/\b(area|perimetro|volume|circunferencia)\b/.test(t)){
  var gr=/volume/.test(t)?"V":/perimetro|circunferencia/.test(t)?"P":"A";
  var P=Math.PI;
  function rr(a){return F(a)}
  var G=[
   ["cubo",{V:[1,"V = a^{3}",function(a){return "V = "+F(a[0])+"^{3}"},function(a){return a[0]*a[0]*a[0]}],A:[1,"A = 6a^{2}",function(a){return "A = 6 \\times "+F(a[0])+"^{2}"},function(a){return 6*a[0]*a[0]}]},"do cubo"],
   ["paralelepipedo|bloco|caixa",{V:[3,"V = c \\times l \\times h",function(a){return "V = "+a.map(F).join(" \\times ")},function(a){return a[0]*a[1]*a[2]}],A:[3,"A = 2(cl + ch + lh)",function(a){return "A = 2("+F(a[0])+"\\times"+F(a[1])+" + "+F(a[0])+"\\times"+F(a[2])+" + "+F(a[1])+"\\times"+F(a[2])+")"},function(a){return 2*(a[0]*a[1]+a[0]*a[2]+a[1]*a[2])}]},"do paralelepípedo"],
   ["cilindro",{V:[2,"V = \\pi r^{2} h",function(a){return "V = \\pi \\times "+F(a[0])+"^{2} \\times "+F(a[1])},function(a){return P*a[0]*a[0]*a[1]},1],A:[2,"A = 2\\pi r(r + h)",function(a){return "A = 2 \\times \\pi \\times "+F(a[0])+" \\times ("+F(a[0])+" + "+F(a[1])+")"},function(a){return 2*P*a[0]*(a[0]+a[1])},1]},"do cilindro"],
   ["esfera",{V:[1,"V = \\frac{4}{3}\\pi r^{3}",function(a){return "V = \\frac{4}{3} \\times \\pi \\times "+F(a[0])+"^{3}"},function(a){return 4/3*P*Math.pow(a[0],3)},1],A:[1,"A = 4\\pi r^{2}",function(a){return "A = 4 \\times \\pi \\times "+F(a[0])+"^{2}"},function(a){return 4*P*a[0]*a[0]},1]},"da esfera"],
   ["cone",{V:[2,"V = \\frac{\\pi r^{2} h}{3}",function(a){return "V = \\frac{\\pi \\times "+F(a[0])+"^{2} \\times "+F(a[1])+"}{3}"},function(a){return P*a[0]*a[0]*a[1]/3},1]},"do cone"],
   ["quadrado",{A:[1,"A = l^{2}",function(a){return "A = "+F(a[0])+"^{2}"},function(a){return a[0]*a[0]}],P:[1,"P = 4l",function(a){return "P = 4 \\times "+F(a[0])},function(a){return 4*a[0]}]},"do quadrado"],
   ["retangulo",{A:[2,"A = b \\times h",function(a){return "A = "+F(a[0])+" \\times "+F(a[1])},function(a){return a[0]*a[1]}],P:[2,"P = 2(b + h)",function(a){return "P = 2 \\times ("+F(a[0])+" + "+F(a[1])+")"},function(a){return 2*(a[0]+a[1])}]},"do retângulo"],
   ["triangulo",{A:[2,"A = \\frac{b \\times h}{2}",function(a){return "A = \\frac{"+F(a[0])+" \\times "+F(a[1])+"}{2}"},function(a){return a[0]*a[1]/2}],P:[3,"P = a + b + c",function(a){return "P = "+a.map(F).join(" + ")},function(a){return a[0]+a[1]+a[2]}]},"do triângulo"],
   ["trapezio",{A:[3,"A = \\frac{(B + b) \\times h}{2}",function(a){return "A = \\frac{("+F(a[0])+" + "+F(a[1])+") \\times "+F(a[2])+"}{2}"},function(a){return (a[0]+a[1])*a[2]/2}]},"do trapézio"],
   ["losango",{A:[2,"A = \\frac{D \\times d}{2}",function(a){return "A = \\frac{"+F(a[0])+" \\times "+F(a[1])+"}{2}"},function(a){return a[0]*a[1]/2}]},"do losango"],
   ["paralelogramo",{A:[2,"A = b \\times h",function(a){return "A = "+F(a[0])+" \\times "+F(a[1])},function(a){return a[0]*a[1]}]},"do paralelogramo"],
   ["circulo|circunferencia|disco",{A:[1,"A = \\pi r^{2}",function(a){return "A = \\pi \\times "+F(a[0])+"^{2}"},function(a){return P*a[0]*a[0]},1],P:[1,"P = 2\\pi r",function(a){return "P = 2 \\times \\pi \\times "+F(a[0])},function(a){return 2*P*a[0]},1]},"do círculo"]
  ];
  for(var gi=0;gi<G.length;gi++){
   if(!new RegExp("\\b("+G[gi][0]+")\\b").test(t))continue;
   var e=G[gi][1][gr];if(!e)return null;
   var a=ns.slice(),L=[],dia=/diametro/.test(t)&&e[0]===1&&gi>=3&&/esfera|circulo|circunferencia|disco/.test(G[gi][0]);
   var nm=gr==="A"?"área":gr==="P"?"perímetro":"volume";
   if(a.length<e[0])return null;
   a=a.slice(0,e[0]);
   if(dia){L.push("O diâmetro é "+mx("d = "+F(a[0]))+", por isso o raio é "+mx("r = \\frac{d}{2} = \\frac{"+F(a[0])+"}{2} = "+F(a[0]/2)));a=[a[0]/2]}
   L.push("Fórmula do "+nm+" "+G[gi][2]+": "+mx(e[1]));
   L.push("Substituir os valores: "+mx(e[2](a)));
   var val=e[3](a),un=(t.match(/\b(mm|cm|dm|km|m)\b/)||[])[1],ex=gr==="V"?3:gr==="A"?2:1;
   var us=un?"\\text{ "+un+"}"+(ex>1?"^{"+ex+"}":""):"";
   L.push("Calcular: "+mx(e[2](a).split("=")[0]+"= "+(e[4]?F(val):F(val))+us));
   if(e[4])L[L.length-1]="Calcular (com "+mx("\\pi \\approx 3{,}14159")+"): "+mx(e[2](a).split("=")[0]+"\\approx "+F(Math.round(val*100)/100)+us);
   var nmf=G[gi][0].split("|")[0],a0=ns[0],bk;
   var IV={"cubo":{V:function(){return Math.cbrt(val)},A:function(){return Math.sqrt(val/6)}},"paralelepipedo":{V:function(){return val/(a[1]*a[2])},A:function(){return (val/2-a[1]*a[2])/(a[1]+a[2])}},"cilindro":{V:function(){return Math.sqrt(val/(P*a[1]))},A:function(){return (-a[1]+Math.sqrt(a[1]*a[1]+2*val/P))/2}},"esfera":{V:function(){return Math.cbrt(3*val/(4*P))},A:function(){return Math.sqrt(val/(4*P))}},"cone":{V:function(){return Math.sqrt(3*val/(P*a[1]))}},"quadrado":{A:function(){return Math.sqrt(val)},P:function(){return val/4}},"retangulo":{A:function(){return val/a[1]},P:function(){return val/2-a[1]}},"triangulo":{A:function(){return 2*val/a[1]},P:function(){return val-a[1]-a[2]}},"trapezio":{A:function(){return 2*val/a[2]-a[1]}},"losango":{A:function(){return 2*val/a[1]}},"paralelogramo":{A:function(){return val/a[1]}},"circulo":{A:function(){return Math.sqrt(val/P)},P:function(){return val/(2*P)}}};
   bk=IV[nmf]&&IV[nmf][gr]?IV[nmf][gr]():a[0];
   var shown=Math.round(val*100)/100;
   var tg=TT2({d:"usar a fórmula ao contrário para voltar ao valor de partida",t:"fórmula inversa",ok:eqn(bk,a[0]),c:"Com a fórmula ao contrário, a partir de "+md(mx(F(val)))+" recupera-se o primeiro dado, "+md(mx(F(bk)))+", igual a "+md(mx(F(a[0])))+"."},
    {d:"ver se o resultado faz sentido e se o arredondamento é razoável",t:"resultado possível",ok:val>0&&isFinite(val)&&Math.abs(shown-val)<=0.005+1e-9,c:"O resultado "+md(mx(F(val)))+" é positivo, como tem de ser para um(a) "+nm+", e o valor mostrado, "+md(mx(F(shown)))+", difere do exato por menos de "+md(mx("0{,}005"))+"."});
   return out(nm+" "+G[gi][2],L,mx(e[2](a).split("=")[0]+(e[4]?"\\approx ":"= ")+F(e[4]?Math.round(val*100)/100:val)+us),Math.round(val*1e6)/1e6,tg);
  }
 }
 return null;
 }catch(err){return null}
}
/* Tabelas da xlang-tabela para pedidos de estatistica: resumo sempre, frequencias se houver valores repetidos. */
var _estNums=null;
function tTab(e){
 var v="["+e.nums.map(function(x){return String(+(+x).toFixed(8))}).join(", ")+"]";
 var rep=e.nums.some(function(x,i){return e.nums.indexOf(x)!==i});
 return '<script type="text/xlang"><program><import name="xlang.tabela"></import><array name="v" value="'+v+'"></array>'+(rep?"<print>{tabFrequencies(v)}</print>":"")+"<print>{tabStats(v, "+(e.am?"true":"false")+")}</print></program><\/script>";
}
function funcaoMatematica(q){
 _estNums=null;
  var _mp=_algUltima&&Date.now()-_algUltima.t<900000&&/^(?:e\s+)?(?:se\s+|para\s+|com\s+|quando\s+)?([a-df-z])\s*(?:=|vale|for|igual\s+a)\s*(-|−)?\s*(\d+(?:[.,]\d+)?)\s*[?!.]*$/.exec(String(q||"").toLowerCase().trim());
  if(_mp){var _r=expressaoAlgebrica(_algUltima.s+" com "+_mp[1]+" = "+(_mp[2]?"-":"")+_mp[3]);if(_r)return _r}
  var _s=sistema(q);if(_s)return _s;
  var _rc=racional(q);if(_rc)return _rc;
  var _q=equacao(q);if(_q)return _q;
  var _a=expressaoAlgebrica(q);if(_a)return _a;
  var _fr=fracoes(q);if(_fr)return _fr;
  var _ap=aplicadas(q);if(_ap)return _ap;
  var _c=calculadora(q);if(_c)return _c;
 var t=norm(q).replace(/[?!.]+$/,"");
 if(/\b(frase|frases|desenh\w*|cri\w+|ger\w+|site|loja|codigo)\b/.test(t))return null;
 var N="(\\d+(?:[.,]\\d+)?)";
 function v(x){return parseFloat(String(x).replace(",","."))}
 function fmt(x){return String(x).replace(".",",")}
 function juntar(a){return a.length>1?a.slice(0,-1).map(fmt).join(", ")+" e "+fmt(a[a.length-1]):fmt(a[0])}
 function tf(x){return fmt(x).replace(",","{,}")}
 function R(f,m,tx){return {f:f,m:m,tx:tx}}
 var m;
 /* percentagens */
 if((m=new RegExp("desconto de "+N+"\\s*(?:%|por cento)\\s*(?:em|sobre|de|num|no|na)\\s*"+N).exec(t)))return R(fmt(v(m[2])).replace(",",".")+"*(100-"+v(m[1])+")/100","desconto de "+fmt(v(m[1]))+"% em "+fmt(v(m[2])));
 if((m=new RegExp("aumento de "+N+"\\s*(?:%|por cento)\\s*(?:em|sobre|de|num|no|na)\\s*"+N).exec(t)))return R(v(m[2])+"*(100+"+v(m[1])+")/100","aumento de "+fmt(v(m[1]))+"% em "+fmt(v(m[2])));
 if((m=new RegExp(N+"\\s*(?:%|por cento)\\s*de\\s*"+N).exec(t)))return R(v(m[1])+"*"+v(m[2])+"/100",fmt(v(m[1]))+"% de "+fmt(v(m[2])),tf(v(m[1]))+"\\% \\times "+tf(v(m[2])));
 var nums=(typeof window.numerosDaPergunta==="function"?window.numerosDaPergunta(q):(t.match(/-?\d+(?:[.,]\d+)?/g)||[]).map(v)).filter(function(x){return isFinite(x)&&Math.abs(x)<=1e12});
 if(/\b(valor de pi|quanto vale pi|numero pi)\b/.test(t))return R("PI()","pi");
 if(!nums.length)return null;
 var x=nums[0];
 /* raizes */
 if(/raiz cubica/.test(t))return R("cbr("+x+")","raiz cúbica de "+fmt(x),"\\sqrt[3]{"+tf(x)+"}");
 if(/\braiz\b/.test(t)&&x>=0)return R("sqr("+x+")","raiz quadrada de "+fmt(x),"\\sqrt{"+tf(x)+"}");
 /* teoria dos numeros */
 if(/fatorial/.test(t)&&Number.isInteger(x)&&x>=0&&x<=20)return R("factorial("+x+")","fatorial de "+fmt(x),tf(x)+"!");
 var ints=nums.every(function(y){return Number.isInteger(y)&&y>0});
 if(/\b(mmc|minimo multiplo comum)\b/.test(t)&&nums.length>=2&&ints)return R(nums.slice(1).reduce(function(a,b){return "lcm("+a+","+b+")"},String(nums[0])),"mmc de "+juntar(nums),"\\operatorname{mmc}("+nums.map(tf).join(",\\ ")+")");
 if(/\b(mdc|maximo divisor comum)\b/.test(t)&&nums.length>=2&&ints)return R(nums.slice(1).reduce(function(a,b){return "gcd("+a+","+b+")"},String(nums[0])),"mdc de "+juntar(nums),"\\operatorname{mdc}("+nums.map(tf).join(",\\ ")+")");
 /* potencias */
 if((m=new RegExp(N+"\\s*ao\\s*(quadrado|cubo)").exec(t))){var b0=v(m[1]),e0=m[2]==="cubo"?3:2;if(isFinite(Math.pow(b0,e0)))return R("pow("+b0+","+e0+")",fmt(b0)+" ao "+m[2],tf(b0)+"^{"+e0+"}")}
 if((m=new RegExp(N+"\\s*(?:elevado\\s+(?:a|ao)|\\^)\\s*"+N).exec(t))){var b1=v(m[1]),e1=v(m[2]);if(Math.abs(Math.pow(b1,e1))<1e15)return R("pow("+b1+","+e1+")",fmt(b1)+" elevado a "+fmt(e1),tf(b1)+"^{"+tf(e1)+"}")}
 /* trigonometria */
 if((m=/\b(seno|sen|cosseno|cos|tangente|tan)\b/.exec(t))){
  var fn=/^s/.test(m[1])?"sin":/^c/.test(m[1])?"cos":"tan",graus=/graus|°/.test(t)||/°/.test(q);
  if(fn==="tan"&&graus&&x%180===90)return null;
  return R(fn+"("+(graus?"radians("+x+")":x)+")",({sin:"seno",cos:"cosseno",tan:"tangente"})[fn]+" de "+fmt(x)+(graus?" graus":""),"\\"+fn+"("+tf(x)+(graus?"^{\\circ}":"")+")");
 }
 /* logaritmos */
 if(/\b(logaritmo|log|ln)\b/.test(t)&&x>0){
  if(/natural|\bln\b/.test(t))return R("log("+x+")","logaritmo natural de "+fmt(x),"\\ln("+tf(x)+")");
  var base=/base\s*2\b/.test(t)?2:10,xb=nums[0];
  if(/base/.test(t)&&nums.length>=2){base=nums[nums.length-1];xb=nums[0];if(base!==2&&base!==10)return null}
  if(xb>0)return R((base===2?"log2(":"log10(")+xb+")","logaritmo de "+fmt(xb)+" na base "+base,"\\log_{"+base+"}("+tf(xb)+")");
 }
 if(/hipotenusa|pitagoras/.test(t)&&nums.length>=2)return R("hypot("+nums[0]+","+nums[1]+")","hipotenusa de catetos "+juntar(nums.slice(0,2)),"\\sqrt{"+tf(nums[0])+"^{2} + "+tf(nums[1])+"^{2}}");
 /* arredondamento */
 if(/arredond/.test(t)){
  var c=nums.length>1&&/casa/.test(t)&&Number.isInteger(nums[1])&&nums[1]>=0&&nums[1]<=10?nums[1]:null;
  return R(c===null?"round("+x+")":"round("+x+","+c+")","arredondar "+fmt(x)+(c===null?"":" a "+c+" casas"));
 }
 /* estatistica (precisa de 2 ou mais numeros) */
 if(nums.length>=2){
  var am=/amostral/.test(t),lst=nums.join(","),rot=juntar(nums);
  _estNums={nums:nums,am:am};
  if(/\bmedia\s+(?:aritmetica\s+)?(?:de|dos|das|entre)\b|^(?:calcula|calcule|qual\s+e)\s+(?:a\s+)?media\b/.test(t)&&!/ponderada/.test(t)){var _e0=estatistica("media",nums);if(_e0)return _e0}
  if(/\bmediana\b/.test(t))return R("median("+lst+")","mediana de "+rot,"\\operatorname{mediana}("+nums.map(tf).join(",\\ ")+")");
  if(/\bmoda de\b/.test(t))return R("mode("+lst+")","moda de "+rot);
  if(/\b(maior|maximo)\b/.test(t))return R("max("+lst+")","maior de "+rot,"\\max("+nums.map(tf).join(",\\ ")+")");
  if(/\b(menor|minimo)\b/.test(t))return R("min("+lst+")","menor de "+rot,"\\min("+nums.map(tf).join(",\\ ")+")");
  if(/amplitude/.test(t))return R("range("+lst+")","amplitude de "+rot);
  if(/desvio padrao/.test(t)){var _e1=estatistica("desvio",nums,am);if(_e1)return _e1}
  if(/variancia/.test(t)){var _e2=estatistica("variancia",nums,am);if(_e2)return _e2}
  if(/desvio padrao/.test(t))return R((am?"sampleStd(":"std(")+lst+")","desvio padrão"+(am?" amostral":"")+" de "+rot);
  if(/variancia/.test(t))return R((am?"sampleVariance(":"variance(")+lst+")","variância"+(am?" amostral":"")+" de "+rot);
 }
 return null;
}
window.lumeFuncaoMatematica=function(q){var r=funcaoMatematica(q);if(!r)return r;var c=Object.assign({},r);c.m=limparMarcas(c.m);c.r=limparMarcas(c.r);if(c.p)c.p=c.p.map(limparMarcas);return c};
window.LumeDespachante={tentar:tentar,pedeEntrega:pedeEntrega,ler:lerCapacidades,medidores:function(q){return medidores(q,norm(q))}};
})();
