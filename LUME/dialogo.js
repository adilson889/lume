/* Dialogo do Lume: memoria de conversa, analise por particulas e resposta composta.
   1. analisar(texto)  -> particulas: sim/nao, pergunta, sentimento (lexico.txt), identidade, elogio, critica, riso, risco.
   2. registar(resposta) -> memoriza a pergunta que o Lume acabou de fazer (estado, ajuda, nome, confirmar, numeros).
   3. reescrever(texto) -> completa respostas curtas usando a pergunta pendente ("uma casa com arvore" -> "desenha uma casa com arvore").
   4. resolver(texto)   -> responde a "sim/nao/bem/cansado..." sabendo a que pergunta respondem.
   5. conversar(texto)  -> frases de 1.a pessoa: eco ("estou com sono" -> "estas com sono") + reacao + seguimento.
   As frases vivem em conversa.txt (tipo | texto) e o sentimento em lexico.txt. */
(function(){
"use strict";
var CH="lume_dialogo_v1";
var S={n:0,pend:null,humor:0,ultimoPedido:"",ultimaPergunta:"",ultimoEstado:null};
try{var j0=sessionStorage.getItem(CH);if(j0)S=Object.assign(S,JSON.parse(j0))}catch(e){}
function gravar(){try{sessionStorage.setItem(CH,JSON.stringify(S))}catch(e){}}
function nz(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function arq(n){return String((window.arquivosBot||{})[n]||"")}
function tem(t,p){return new RegExp("(^|[^a-z0-9])"+p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"([^a-z0-9]|$)").test(t)}
var _u={};
function pick(a,k){
 if(!a.length)return "";
 var i=Math.floor(Math.random()*a.length);
 if(k&&a.length>1&&_u[k]===i)i=(i+1+Math.floor(Math.random()*(a.length-1)))%a.length;
 if(k)_u[k]=i;return a[i];
}
function L(tipo,padrao){
 var r=[];
 arq("conversa.txt").split(/\r?\n/).forEach(function(l){
  if(!l.trim()||l.trim().charAt(0)==="#")return;
  var i=l.indexOf("|");if(i<1)return;
  if(l.slice(0,i).trim()===tipo&&l.slice(i+1).trim())r.push(l.slice(i+1).trim());
 });
 return r.length?r:padrao;
}
/* escolhe uma frase do tipo e preenche os espacos {nome}, {eco}... */
function dizer(tipo,padrao,slots){
 var s=pick(L(tipo,padrao),"d_"+tipo);
 for(var k in (slots||{}))s=s.split("{"+k+"}").join(slots[k]);
 return s;
}
function frase(s){s=String(s||"").trim();if(!s)return "";s=s.charAt(0).toUpperCase()+s.slice(1);return /[.!?]$/.test(s)?s:s+"."}
function juntar(a){return a.filter(Boolean).map(frase).join(" ")}
/* ---------- sentimento ---------- */
var _lx=null,_lf="";
function lexico(){
 var f=arq("lexico.txt");if(_lx&&f===_lf)return _lx;
 var r={v:{},neg:{},int:{}};
 f.split(/\r?\n/).forEach(function(l){
  l=l.trim();if(!l||l.charAt(0)==="#")return;
  var i=l.indexOf("|");if(i<1)return;
  var k=l.slice(0,i).trim(),v=l.slice(i+1).trim();
  if(k==="@neg")v.split(",").forEach(function(w){r.neg[nz(w.trim())]=1});
  else if(k==="@int")v.split(",").forEach(function(w){var p=w.split(":");r.int[nz(p[0].trim())]=parseFloat(p[1])||1});
  else{var n=parseFloat(v);if(isFinite(n))r.v[nz(k)]=n}
 });
 _lx=r;_lf=f;return r;
}
function valencia(t){
 var lx=lexico(),w=t.split(/[^a-z0-9]+/).filter(Boolean),soma=0,hits=0;
 w.forEach(function(x,i){
  if(lx.v[x]===undefined)return;
  var v=lx.v[x];
  for(var k=1;k<=3&&i-k>=0;k++){var a=w[i-k];if(k===1&&lx.int[a])v*=lx.int[a];if(lx.neg[a]){v=-v*0.8;break}}
  soma+=v;hits++;
 });
 var val=Math.max(-1,Math.min(1,soma/2));
 return {v:val,hits:hits,pol:!hits?"":val>0.2?"pos":val<-0.2?"neg":"neutro"};
}
/* ---------- analise ---------- */
function analisar(q){
 var raw=String(q||"").trim(),t=nz(raw),c=t.replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim(),n=c?c.split(" ").length:0;
 var f={raw:raw,t:t,c:c,n:n,val:valencia(t)};
 f.pergunta=/\?\s*$/.test(raw)||/^(quem|qual|quais|quando|onde|como|porque|por que|quanto|quantos|o que|que)\b/.test(c);
 f.sim=/^(sim|claro|pode ser|pode|ok|okay|certo|combinado|com certeza|obvio|aham|uhum|isso|exato|exatamente|vamos|bora|vai|faz|por favor|quero|sim por favor|claro que sim|sim quero|pode sim)$/.test(c);
 f.nao=/^(nao|nao obrigado|nao obrigada|agora nao|nao quero|nao preciso|deixa|esquece|nada|nunca|nao por agora|por agora nao)$/.test(c);
 f.devolve=/\be (tu|voce|vc|contigo|consigo|por ai|desse lado)\b/.test(c);
 f.identidade=/\b(quem es tu|quem es|o que es|que es tu|como te chamas|qual e o teu nome)\b/.test(c);
 f.elogio=/\b(es|estas|foste|ficou|voce e|voce esta|tu es)\s+(muito |mesmo |bastante )?(bom|boa|inteligente|esperto|fixe|incrivel|otimo|genial|perfeito|util)\b/.test(c)||/\b(bom trabalho|parabens|gostei|adorei|muito bem|excelente)\b/.test(c);
 f.critica=/\b(nao (percebeste|entendeste|sabes|funciona|serve|presta)|esta errado|errado|es (burro|estupido|inutil)|nao era isso)\b/.test(c);
 f.riso=/^(k{2,}|(ha){2,}h?|(he){2,}h?|rs+|lol|ahah+|haha+)( .*)?$/.test(c);
 f.risco=/\b(me matar|suicid\w*|quero morrer|nao quero (mais )?viver|acabar com (tudo|a minha vida)|me magoar|fazer mal a mim)\b/.test(c);
 return f;
}
/* ---------- eco: "estou com sono" -> "estas com sono" ---------- */
var FLIP=[[/\bnão estou\b/g,"não estás"],[/\bsinto-me\b/g,"sentes-te"],[/\bme sinto\b/g,"te sentes"],[/\bestou\b/g,"estás"],[/\bsou\b/g,"és"],[/\btenho\b/g,"tens"],[/\bsinto\b/g,"sentes"],[/\bgosto\b/g,"gostas"],[/\badoro\b/g,"adoras"],[/\bodeio\b/g,"odeias"],[/\bdetesto\b/g,"detestas"],[/\bacabei\b/g,"acabaste"],[/\bconsegui\b/g,"conseguiste"],[/\bpassei\b/g,"passaste"],[/\bchumbei\b/g,"chumbaste"],[/\bperdi\b/g,"perdeste"],[/\bganhei\b/g,"ganhaste"],[/\bcansei\b/g,"cansaste"],[/\bmeus\b/g,"teus"],[/\bminhas\b/g,"tuas"],[/\bmeu\b/g,"teu"],[/\bminha\b/g,"tua"],[/\bcomigo\b/g,"contigo"],[/\bmim\b/g,"ti"],[/\bme\b/g,"te"],[/\beu\b/g,"tu"]];
var DECL=/^(?:eu\s+)?(?:não\s+)?(estou|sou|sinto-me|me sinto|sinto|tenho|gosto|adoro|odeio|detesto|acabei|consegui|passei|chumbei|perdi|ganhei|cansei)\b/;
function eco(raw){
 var r=raw.toLowerCase().trim().replace(/[.!?…]+$/,"").replace(/^eu\s+/,"");
 FLIP.forEach(function(p){r=r.replace(p[0],p[1])});
 return r;
}
/* ---------- registar o que o Lume perguntou ---------- */
function registar(texto){
 try{
  var s=String(texto||"");
  if(/^\s*(<program|<!doctype|<html)/i.test(s)||s.length>700){S.pend=null;S.ultimaPergunta="";gravar();return}
  s=s.replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
  var fr=s.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[],ult=fr.slice(-2).join(" ").trim(),qs="";
  fr.slice(-2).forEach(function(x){if(/\?\s*$/.test(x.trim()))qs=x.trim()});
  var n=nz(s),nq=nz(qs),tipo="";
  if(/dois ou mais numeros|quantos numeros|que numeros/.test(n))tipo="numeros";
  else if(/como te chamas|qual e o teu nome/.test(nq))tipo="nome";
  else if(qs&&/como estas|como vais|como esta o teu dia|como esta a correr|tudo bem contigo|\be tu\b|e desse lado|e contigo|e voce/.test(nq))tipo="estado";
  else if(/em que (te )?posso ajudar|o que (queres|precisas|te traz|posso fazer)|em que estas a trabalhar|diz me o que precisas|escreve o que precisas|podes escrever o que precisas/.test(n))tipo="ajuda";
  else if(qs&&/^(queres|preferes|posso|devo|gostavas|desejas|vamos)\b|queres que/.test(nq))tipo="confirmar";
  else if(qs)tipo="livre";
  if(!tipo){S.pend=null;S.ultimaPergunta="";gravar();return}
  S.pend={tipo:tipo,sub:tipo==="confirmar"&&/falar sobre isso|desabafar|contar/.test(nq)?"ouvir":"",pergunta:qs||ult,n:S.n};
  S.ultimaPergunta=qs||ult;gravar();
 }catch(e){}
}
function ver(q){
 S.n++;
 try{
  var caps=window.LumeDespachante&&window.LumeDespachante.ler?window.LumeDespachante.ler():[],t=nz(q);
  if(caps.some(function(c){return c.verbos.some(function(v){return tem(t,v)})}))S.ultimoPedido=String(q);
 }catch(e){}
 gravar();
}
/* "uma casa com arvore" depois de "Em que posso ajudar?" -> "desenha uma casa com arvore" */
function completar(q){
 var D=window.LumeDespachante;if(!D||!D.ler||!D.medidores)return null;
 var t=nz(q),caps=D.ler(),m=D.medidores(q);
 if(caps.some(function(c){return c.verbos.some(function(v){return tem(t,v)})}))return null;
 if(m.numeros>=2)return "calcula "+q;
 if(m.pecas>=1)return "desenha "+q;
 var c=caps.filter(function(x){return x.objetos.some(function(o){return o!=="numeros"&&o!=="pecas"&&o!=="componentes"&&tem(t,o)})})[0];
 if(c&&c.verbos[0])return c.verbos[0]+" "+q;
 if(m.componentes>=1)return "cria "+q;
 return null;
}
function reescrever(q){
 try{
  var p=S.pend;if(!p||S.n+1-p.n>3)return q;
  var f=analisar(q);if(f.pergunta||f.n>12||f.sim||f.nao)return q;
  var novo=null;
  if(p.tipo!=="nome"&&p.tipo!=="numeros"&&!(p.tipo==="confirmar"&&p.sub==="ouvir")&&!DECL.test(f.raw.toLowerCase()))novo=completar(q);
  else if(p.tipo==="nome"&&/^[a-zà-ÿ]{2,20}( [a-zà-ÿ]{2,20})?$/i.test(f.raw))novo="o meu nome é "+f.raw.charAt(0).toUpperCase()+f.raw.slice(1);
  else if(p.tipo==="numeros"&&/\d/.test(q)&&S.ultimoPedido)novo=S.ultimoPedido+" "+q;
  if(novo&&novo!==q){S.pend=null;gravar();return novo}
 }catch(e){}
 return q;
}
function sentir(f){S.humor=Math.round((0.6*S.humor+0.4*f.val.v)*100)/100}
/* resposta a uma pergunta que o Lume fez */
function resolver(q){
 try{
  var p=S.pend;if(!p||S.n-p.n>3)return null;
  var f=analisar(q),r=null;
  if(p.tipo==="confirmar"||p.tipo==="ajuda"){
   if(f.sim){
    S.pend=p.tipo==="confirmar"&&p.sub==="ouvir"?null:{tipo:"ajuda",sub:"",pergunta:"",n:S.n};
    r=p.sub==="ouvir"?dizer("sim_ouvir",["Estou a ouvir."]):dizer("sim_ajuda",["Diz-me o que precisas."]);
   }else if(f.nao){S.pend=null;r=dizer("nao_geral",["Tudo bem. Estou por aqui se precisares."])}
  }else if(p.tipo==="estado"&&f.n<=8&&!/\d/.test(f.c)&&(f.val.hits||f.devolve)&&!f.identidade){
   sentir(f);S.ultimoEstado={pol:f.val.pol,n:S.n};
   var pol=f.val.pol;
   var rx=pol==="pos"?dizer("reage_bem",["Ainda bem"]):pol==="neg"?dizer("reage_mal",["Lamento ouvir isso"]):pol==="neutro"?dizer("reage_neutro",["Percebo"]):"";
   var dv=f.devolve?dizer("devolucao_resposta",["Eu também estou bem, obrigado"]):"";
   var sg=pol==="neg"?dizer("segue_neg",["Queres falar sobre isso?"]):pol==="pos"?dizer("segue_pos",["O que queres fazer agora?"]):dizer("segue",["Em que posso ajudar?"]);
   S.pend=null;r=juntar([rx,dv])+" "+sg;
  }
  if(r){gravar();return {resposta:r.trim()}}
 }catch(e){}
 return null;
}
/* conversa sem pedido: identidade, elogio, critica, riso, risco, sim/nao soltos, frases de 1.a pessoa */
function conversar(q){
 try{
  var f=analisar(q);if(!f.n||f.n>14)return "";
  if(f.risco)return dizer("risco",["Lamento muito que estejas a passar por isso. Não estás sozinho. Fala agora com alguém de confiança ou com um serviço de emergência da tua zona."]);
  if(f.identidade){
   var caps=window.LumeDespachante&&window.LumeDespachante.ler?window.LumeDespachante.ler():[],nm=[];
   var nomes={codigo:"código",desenhar:"desenhos",calcular:"cálculos",loja:"lojas e páginas",frases:"frases"};
   caps.forEach(function(c){nm.push(nomes[c.nome]||c.nome)});
   var u=nm.pop();
   return dizer("identidade",["Sou o Lume."],{})+(u?" Sei trabalhar com "+(nm.length?nm.join(", ")+" e ":"")+u+".":"");
  }
  if(f.elogio&&!f.pergunta){sentir(f);return juntar([dizer("elogio_resp",["Obrigado"]),dizer("segue",["Em que posso ajudar?"])])}
  if(f.critica&&!f.pergunta){S.pend={tipo:"ajuda",sub:"",pergunta:"",n:S.n};return dizer("critica_resp",["Desculpa, ainda estou a aprender. Diz-me com mais detalhe o que esperavas e eu tento outra vez."])}
  if(f.riso)return dizer("riso_resp",["Ainda bem que te ri."]);
  if(f.sim||f.nao)return dizer(f.sim?"sim_solto":"nao_solto",["Sim a quê? Diz-me o que precisas."]);
  if(!f.pergunta&&DECL.test(f.raw.toLowerCase().replace(/^\s+/,""))){
   var pol=f.val.pol||"neutro",e=eco(f.raw);
   sentir(f);S.ultimoEstado={pol:pol,n:S.n};
   var rx=f.val.hits?(pol==="pos"?dizer("reage_bem",["Ainda bem"]):pol==="neg"?dizer("reage_mal",["Lamento ouvir isso"]):dizer("reage_neutro",["Percebo"])):"";
   var sg=pol==="neg"?dizer("segue_neg",["Queres falar sobre isso?"]):pol==="pos"?dizer("segue_pos",["O que queres fazer agora?"]):dizer("segue_neutro",["Queres que te ajude com isso?"]);
   return juntar([dizer("eco_modelo",["{eco}"],{eco:e}),rx,sg]);
  }
 }catch(err){}
 return "";
}
window.LumeDialogo={ver:ver,registar:registar,reescrever:reescrever,resolver:resolver,conversar:conversar,analisar:analisar,estado:function(){return S}};
})();
