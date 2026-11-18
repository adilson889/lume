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
function detectarConversa(q){
 var t=norm(q);
 /* conversa so em mensagens curtas e que nao pedem nenhuma capacidade (cria, calcula, desenha...) */
 if(t.split(" ").length>10)return null;
 var med=medidores(q,t);
 if(lerCapacidades().some(function(c){return ativa(c,t,med)}))return null;
 var curta=t.replace(/[?!.,;:]+/g," ").replace(/\s+/g," ").trim();
 var saudacao=/\b(oi|ola|bom dia|boa tarde|boa noite|e ai|ei|hey|hello|wey|boas|opa|eia)\b/.test(t);
 var perguntaEstado=/\b(como estas|como vai|como vais|tudo bem|tudo bom|tudo tranquilo|esta tudo bem)\b/.test(t)&&!/\btudo bem com /.test(t)&&(/[?]/.test(q)||/\b(como estas|como vai|como vais)\b/.test(t)||/\b(ola|oi|bom dia|boa tarde|boa noite|hey|hello)\b/.test(t));
 var agradecimento=/\b(obrigado|obrigada|agradecido|agradecida|agradeco|valeu|thanks)\b/.test(t)||aproximada(t,["obrigado","obrigada","agradeco"]);
 var despedida=/\b(adeus|ate logo|ate ja|ate amanha|xau|tchau|falou|vou embora)\b/.test(t)||aproximada(t,["adeus","tchau"]);
 var ajuda=/\b(o que sabes fazer|que sabes fazer|tu fazes o que|suas capacidades|teus recursos)\b/.test(t)||/^(ajuda|ajudas|preciso de ajuda|podes ajudar|podes ajudar me|podes me ajudar)$/.test(curta.replace(/-/g," "));
 var hora=/\b(que horas (sao|e)|horas sao|que hora e)\b/.test(t);
 var data=/\b(que dia e hoje|qual e a data|data de hoje|em que dia estamos|que dia da semana)\b/.test(t);
 var mn=/(?:o\s+)?meu\s+nome\s+(?:e|é)\s+([A-Za-zÀ-ÿ]{2,20})|chamo[\s-]+me\s+([A-Za-zÀ-ÿ]{2,20})|me\s+chamo\s+([A-Za-zÀ-ÿ]{2,20})/i.exec(q);
 var nome=mn?(mn[1]||mn[2]||mn[3]):"";
 if(nome)nome=nome.charAt(0).toUpperCase()+nome.slice(1);
 var perguntaNome=/\b(qual e o meu nome|como me chamo|sabes o meu nome|sabes quem eu sou)\b/.test(t);
 if(saudacao||perguntaEstado||agradecimento||despedida||ajuda||hora||data||nome||perguntaNome)
  return {saudacao:saudacao,estado:perguntaEstado,agradecimento:agradecimento,despedida:despedida,ajuda:ajuda,hora:hora,data:data,nome:nome,perguntaNome:perguntaNome};
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
 }else if(c.saudacao){
  partes.push(escolher(L("pergunta_aberta",["Em que posso ajudar?"]),"aberta"));
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
async function tentar(q){
 if(typeof window.lumeOnReply==="function"){var conversa=gerarConversa(q);if(conversa){window.lumeAtualizarEtapa&&window.lumeAtualizarEtapa("A compor uma resposta para ti...");window.lumeOnReply({text:conversa});return true;}}
 var caps=lerCapacidades();if(!caps.length||typeof window.lumeOnReply!=="function")return false;
 var t=norm(q),m=medidores(q,t);
 /* decide pelo verbo e pelo objeto juntos: "gera" serve a varias capacidades, "gera um botao" so a uma */
 var ativos=caps.filter(function(c){return ativa(c,t,m)});
 /* em caso de empate, ganha a unica capacidade cujas condicoes (requer) se cumprem */
 if(ativos.length>1){var cumprem=ativos.filter(function(x){return cumpre(x.requer,m)});if(cumprem.length===1)ativos=cumprem}
 if(ativos.length!==1)return false;
 var c=ativos[0];
 if(window.lumeAtualizarEtapa){var etapas={calcular:"A executar o cálculo...",desenhar:"A preparar o desenho...",frases:"A construir frases...",codigo:"A preparar o código...",loja:"A estruturar a página..."};window.lumeAtualizarEtapa(etapas[c.nome]||("A preparar "+c.nome+"..."));}
 if(cumpre(c.requer,m)){
  var conversa=gerarConversa(q);if(conversa){window.lumeOnReply({text:conversa});return true;}
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
/* Matematica em linguagem natural: converte o pedido numa expressao com funcoes da xlang-math
   (sqr, cbr, pow, factorial, gcd, lcm, median, mode, max, min, range, std, variance, sin, cos, tan,
   radians, log, log10, log2, round, hypot, PI). Devolve {f: expressao, m: texto} ou null.
   O chat avalia f no XLang (rescalculo.txt) e mostra "O resultado de m e ...". */
function funcaoMatematica(q){
 var t=norm(q).replace(/[?!.]+$/,"");
 if(/\b(frase|frases|desenh\w*|cri\w+|ger\w+|site|loja|codigo)\b/.test(t))return null;
 var N="(\\d+(?:[.,]\\d+)?)";
 function v(x){return parseFloat(String(x).replace(",","."))}
 function fmt(x){return String(x).replace(".",",")}
 function juntar(a){return a.length>1?a.slice(0,-1).map(fmt).join(", ")+" e "+fmt(a[a.length-1]):fmt(a[0])}
 function R(f,m){return {f:f,m:m}}
 var m;
 /* percentagens */
 if((m=new RegExp("desconto de "+N+"\\s*(?:%|por cento)\\s*(?:em|sobre|de|num|no|na)\\s*"+N).exec(t)))return R(fmt(v(m[2])).replace(",",".")+"*(100-"+v(m[1])+")/100","desconto de "+fmt(v(m[1]))+"% em "+fmt(v(m[2])));
 if((m=new RegExp("aumento de "+N+"\\s*(?:%|por cento)\\s*(?:em|sobre|de|num|no|na)\\s*"+N).exec(t)))return R(v(m[2])+"*(100+"+v(m[1])+")/100","aumento de "+fmt(v(m[1]))+"% em "+fmt(v(m[2])));
 if((m=new RegExp(N+"\\s*(?:%|por cento)\\s*de\\s*"+N).exec(t)))return R(v(m[1])+"*"+v(m[2])+"/100",fmt(v(m[1]))+"% de "+fmt(v(m[2])));
 var nums=(typeof window.numerosDaPergunta==="function"?window.numerosDaPergunta(q):(t.match(/-?\d+(?:[.,]\d+)?/g)||[]).map(v)).filter(function(x){return isFinite(x)&&Math.abs(x)<=1e12});
 if(/\b(valor de pi|quanto vale pi|numero pi)\b/.test(t))return R("PI()","pi");
 if(!nums.length)return null;
 var x=nums[0];
 /* raizes */
 if(/raiz cubica/.test(t))return R("cbr("+x+")","raiz cúbica de "+fmt(x));
 if(/\braiz\b/.test(t)&&x>=0)return R("sqr("+x+")","raiz quadrada de "+fmt(x));
 /* teoria dos numeros */
 if(/fatorial/.test(t)&&Number.isInteger(x)&&x>=0&&x<=20)return R("factorial("+x+")","fatorial de "+fmt(x));
 var ints=nums.every(function(y){return Number.isInteger(y)&&y>0});
 if(/\b(mmc|minimo multiplo comum)\b/.test(t)&&nums.length>=2&&ints)return R(nums.slice(1).reduce(function(a,b){return "lcm("+a+","+b+")"},String(nums[0])),"mmc de "+juntar(nums));
 if(/\b(mdc|maximo divisor comum)\b/.test(t)&&nums.length>=2&&ints)return R(nums.slice(1).reduce(function(a,b){return "gcd("+a+","+b+")"},String(nums[0])),"mdc de "+juntar(nums));
 /* potencias */
 if((m=new RegExp(N+"\\s*ao\\s*(quadrado|cubo)").exec(t))){var b0=v(m[1]),e0=m[2]==="cubo"?3:2;if(isFinite(Math.pow(b0,e0)))return R("pow("+b0+","+e0+")",fmt(b0)+" ao "+m[2])}
 if((m=new RegExp(N+"\\s*(?:elevado\\s+(?:a|ao)|\\^)\\s*"+N).exec(t))){var b1=v(m[1]),e1=v(m[2]);if(Math.abs(Math.pow(b1,e1))<1e15)return R("pow("+b1+","+e1+")",fmt(b1)+" elevado a "+fmt(e1))}
 /* trigonometria */
 if((m=/\b(seno|sen|cosseno|cos|tangente|tan)\b/.exec(t))){
  var fn=/^s/.test(m[1])?"sin":/^c/.test(m[1])?"cos":"tan",graus=/graus|°/.test(t)||/°/.test(q);
  if(fn==="tan"&&graus&&x%180===90)return null;
  return R(fn+"("+(graus?"radians("+x+")":x)+")",({sin:"seno",cos:"cosseno",tan:"tangente"})[fn]+" de "+fmt(x)+(graus?" graus":""));
 }
 /* logaritmos */
 if(/\b(logaritmo|log|ln)\b/.test(t)&&x>0){
  if(/natural|\bln\b/.test(t))return R("log("+x+")","logaritmo natural de "+fmt(x));
  var base=/base\s*2\b/.test(t)?2:10,xb=nums[0];
  if(/base/.test(t)&&nums.length>=2){base=nums[nums.length-1];xb=nums[0];if(base!==2&&base!==10)return null}
  if(xb>0)return R((base===2?"log2(":"log10(")+xb+")","logaritmo de "+fmt(xb)+" na base "+base);
 }
 if(/hipotenusa|pitagoras/.test(t)&&nums.length>=2)return R("hypot("+nums[0]+","+nums[1]+")","hipotenusa de catetos "+juntar(nums.slice(0,2)));
 /* arredondamento */
 if(/arredond/.test(t)){
  var c=nums.length>1&&/casa/.test(t)&&Number.isInteger(nums[1])&&nums[1]>=0&&nums[1]<=10?nums[1]:null;
  return R(c===null?"round("+x+")":"round("+x+","+c+")","arredondar "+fmt(x)+(c===null?"":" a "+c+" casas"));
 }
 /* estatistica (precisa de 2 ou mais numeros) */
 if(nums.length>=2){
  var am=/amostral/.test(t),lst=nums.join(","),rot=juntar(nums);
  if(/\bmediana\b/.test(t))return R("median("+lst+")","mediana de "+rot);
  if(/\bmoda de\b/.test(t))return R("mode("+lst+")","moda de "+rot);
  if(/\b(maior|maximo)\b/.test(t))return R("max("+lst+")","maior de "+rot);
  if(/\b(menor|minimo)\b/.test(t))return R("min("+lst+")","menor de "+rot);
  if(/amplitude/.test(t))return R("range("+lst+")","amplitude de "+rot);
  if(/desvio padrao/.test(t))return R((am?"sampleStd(":"std(")+lst+")","desvio padrão"+(am?" amostral":"")+" de "+rot);
  if(/variancia/.test(t))return R((am?"sampleVariance(":"variance(")+lst+")","variância"+(am?" amostral":"")+" de "+rot);
 }
 return null;
}
window.lumeFuncaoMatematica=funcaoMatematica;
window.LumeDespachante={tentar:tentar,pedeEntrega:pedeEntrega,ler:lerCapacidades,medidores:function(q){return medidores(q,norm(q))}};
})();
