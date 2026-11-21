/* Formatador do Lume: transforma texto simples em Markdown por calculo, sem modelos fixos.
   formatar(texto, ctx) mede cada bloco (palavras, frases, itens, simbolos de codigo, marcadores de sequencia)
   e decide a estrutura: titulo, paragrafos, listas, listas numeradas, codigo, citacoes, destaque de termos e de resultados.
   ctx.pergunta (opcional): a pergunta do utilizador, usada para escolher os termos a destacar.
   Texto que ja traz marcacao (Markdown ou HTML) fica como esta. O chat converte o Markdown (marked + DOMPurify). */
(function(){
"use strict";
var PARADAS={};
("para como qual quais quando onde porque quem quanto sobre isso esse essa este esta aquilo uma uns umas com sem mais menos muito pouco voce teu tua meu minha seu sua fazer faz diz dizer posso podes pode quero queres preciso precisas tenho tens existe significa serve sabes sabe explica explicar mostra mostrar cria criar fala falar ajuda ajudar").split(" ").forEach(function(w){PARADAS[w]=1});
function nz(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
function palavras(t){var m=String(t).trim().match(/\S+/g);return m?m.length:0}
function cap(s){s=String(s);return s.charAt(0).toUpperCase()+s.slice(1)}
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
/* ---------- medicoes ---------- */
function frases(b){
 var r=null;
 try{r=b.split(new RegExp("(?<=[.!?…])\\s+(?=[A-ZÀ-Ý0-9«\"(])"))}catch(e){r=null}
 if(!r)r=b.match(/[^.!?]+[.!?]*\s*/g)||[b];
 return r.map(function(x){return x.trim()}).filter(Boolean);
}
var SEQ=/^(?:primeiro|em primeiro lugar|segundo|em segundo lugar|terceiro|em terceiro lugar|quarto|depois|em seguida|a seguir|por fim|por ultimo|finalmente|passo \d+)\b[\s,:.\-]*/;
function marcador(s){var m=nz(String(s).trim()).match(SEQ);return m?m[0].length:0}
var CODIGO_INICIO=/^\s*(?:def |class [A-Za-z_]+[:({]|import |from \w+ import |function[ (]|const |let |var |if ?\(|for ?\(|while ?\(|return[ ;]|print\(|console\.|#include|public |private |SELECT |INSERT |UPDATE |DELETE |CREATE |<\?|\$\w+ ?=)/;
function pontCodigo(l){var m=l.match(/[{}();=<>\[\]$]/g);return (m?m.length:0)/Math.max(l.length,1)}
function ehLinhaCodigo(l){
 return CODIGO_INICIO.test(l)||pontCodigo(l)>0.09||(/^\s{2,}\S/.test(l)&&/[;{}()=:]/.test(l))||/^\s*[}\])]+[;,]?\s*$/.test(l);
}
function pareceCodigo(b){
 var ls=b.split("\n").filter(function(x){return x.trim()});
 if(!ls.length)return false;
 if(ls.length===1)return CODIGO_INICIO.test(ls[0])||(/[;{}]\s*$/.test(ls[0])&&pontCodigo(ls[0])>0.06);
 return ls.filter(ehLinhaCodigo).length/ls.length>=0.6;
}
function lingua(c){
 if((/^\s*(?:def |import |from \w+ import |print\()/m.test(c)||/:\s*$/m.test(c))&&!/[{};]\s*$/m.test(c))return "python";
 if(/\b(?:function|const|let|var|console\.)|=>/.test(c))return "javascript";
 if(/\b(?:SELECT|INSERT|UPDATE|CREATE TABLE|FROM)\b/.test(c))return "sql";
 if(/#include|int main/.test(c))return "c";
 return "";
}
/* "a, b, c e d" -> ["a","b","c","d"] */
function dividir(s){
 s=s.replace(/[.!?…]+\s*$/,"").trim();
 var p=s.split(/\s*[;,]\s*/);
 if(p.length>=2){
  p[p.length-1]=p[p.length-1].replace(/^(?:e|ou)\s+/i,"");
  var u=p[p.length-1],m=u.match(/^(.+?)\s+e\s+(.+)$/i);
  if(m&&palavras(u)>1){p.pop();p.push(m[1],m[2])}
 }
 return p.map(function(x){return x.trim()}).filter(Boolean);
}
function lista(itens,num){return itens.map(function(x,i){return (num?(i+1)+". ":"- ")+x}).join("\n")}
var LAB=/^([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 _\/\-]{1,27}):\s+(\S.*)$/;
/* parte um paragrafo comprido em pedacos de tamanho parecido */
function partir(b){
 var f=frases(b),n=b.length;
 if(f.length<2||(n<=230&&f.length<5))return [b];
 var k=Math.min(Math.max(2,Math.ceil(n/230)),f.length),alvo=n/k,saida=[],cur="";
 f.forEach(function(x,i){
  cur+=(cur?" ":"")+x;
  if(cur.length>=alvo&&saida.length<k-1&&f.length-i-1>0){saida.push(cur);cur=""}
 });
 if(cur)saida.push(cur);
 return saida;
}
/* resultado de uma conta: "2 + 3 = 5." -> "2 + 3 = **5**." */
function destaqueResultado(s){
 if(s.length>120||/\*\*/.test(s))return s;
 return s.replace(/((?:=|\b(?:resultado|total|soma|produto|média|media|diferença|diferenca)\b)[^0-9\n]{0,24})(-?\d[\d.,]*)(?=\s*[.!?]?$)/i,"$1**$2**");
}
/* ---------- decisao por bloco ---------- */
function jaFormatado(t){
 return /<\/?[a-zA-Z][^>]*>/.test(t)||/```/.test(t)||/\*\*[^*\n]+\*\*/.test(t)||/^\s{0,3}(?:#{1,6}\s|>\s?|[-*+]\s|\d+[.)]\s|\|.*\|)/m.test(t);
}
function blocosDe(t){
 return t.replace(/\r\n?/g,"\n").trim().split(/\n{2,}/).map(function(b){return b.replace(/[ \t]+$/gm,"").replace(/^\n+|\n+$/g,"")}).filter(Boolean);
}
function formatarBloco(b,i,n){
 var ls=b.split("\n").map(function(x){return x.trim()}).filter(Boolean),pal=palavras(b);
 if(pareceCodigo(b))return [{t:"codigo",s:"```"+lingua(b)+"\n"+b.replace(/\s+$/,"")+"\n```"}];
 if(i===0&&n>=2&&ls.length===1&&pal<=8&&b.length<=60&&!/[.!?:;,…]$/.test(b)&&!/\d\s*[=+*\/x×÷\-]\s*\d/.test(b))return [{t:"titulo",s:"### "+cap(b)}];
 var um=ls.join(" "),ca=um.match(/^(dica|nota|aten[cç][aã]o|aviso|importante|cuidado)\s*:\s*(\S.*)$/i);
 if(ca&&(i>0||n>1))return [{t:"citacao",s:"> **"+cap(ca[1])+":** "+ca[2]}];
 if(ls.length>=2){
  var lab=ls.filter(function(x){return LAB.test(x)}),mk=ls.filter(function(x){return marcador(x)>0});
  if(lab.length>=2&&lab.length>=ls.length*0.6)return [{t:"lista",s:lista(ls.map(function(x){var m=x.match(LAB);return m?"**"+m[1]+":** "+m[2]:x}))}];
  if(mk.length>=2)return [{t:"lista",s:lista(ls.map(function(x){var k=marcador(x);return k?cap(x.slice(k)):x}),true)}];
  var media=ls.reduce(function(a,x){return a+palavras(x)},0)/ls.length;
  if(ls.length>=3&&media<=12)return [{t:"lista",s:lista(ls)}];
  return ls.map(function(x){return {t:"p",s:x}});
 }
 var s=ls[0],mi=s.match(/^([^:\n]{3,140}):\s+(\S.*)$/);
 if(mi&&frases(mi[2]).length===1){
  var it=dividir(mi[2]),mx=0,sm=0;
  it.forEach(function(x){var p=palavras(x);mx=Math.max(mx,p);sm+=p});
  if(it.length>=3&&mx<=8&&sm/it.length<=5)return [{t:"p",s:mi[1]+":"},{t:"lista",s:lista(it.map(cap))}];
 }
 var fr=frases(s);
 if(fr.length>=3){
  var idx=[];
  fr.forEach(function(x,j){if(marcador(x)>0)idx.push(j)});
  if(idx.length>=2&&idx.length>=fr.length*0.5){
   var ini=idx[0],ent=[];
   if(ini>0)ent.push({t:"p",s:fr.slice(0,ini).join(" ")});
   ent.push({t:"lista",s:lista(fr.slice(ini).map(function(x){var k=marcador(x);return k?cap(x.slice(k)):x}),true)});
   return ent;
  }
 }
 return partir(s).map(function(x){return {t:"p",s:destaqueResultado(x)}});
}
/* ---------- destaque dos termos da pergunta ---------- */
function termos(p){
 var w=nz(p).split(/[^a-z0-9]+/).filter(function(x){return x.length>=4&&!PARADAS[x]}),r=[];
 w.forEach(function(x){if(r.indexOf(x)<0)r.push(x)});
 return r.slice(0,4);
}
function destacar(es,tm){
 var tot=0;
 es.forEach(function(e){if(e.t==="p")tot+=e.s.length});
 if(tot<140||!tm.length)return;
 var usados=0;
 es.forEach(function(e,idx){
  if(e.t!=="p"||idx>2)return;
  for(var k=0;k<tm.length&&usados<2;k++){
   var ns=nz(e.s);if(ns.length!==e.s.length)return;
   var m=new RegExp("(^|[^a-z0-9*])("+esc(tm[k])+")(?![a-z0-9*])").exec(ns);
   if(!m)continue;
   var a=m.index+m[1].length,z=a+m[2].length;
   e.s=e.s.slice(0,a)+"**"+e.s.slice(a,z)+"**"+e.s.slice(z);usados++;
  }
 });
}
function formatar(texto,ctx){
 var t=String(texto==null?"":texto);
 try{
  if(t.trim().length<60||jaFormatado(t))return t;
  var bl=blocosDe(t),es=[];
  bl.forEach(function(b,i){formatarBloco(b,i,bl.length).forEach(function(e){es.push(e)})});
  destacar(es,termos((ctx||{}).pergunta));
  return es.map(function(e){return e.s}).join("\n\n");
 }catch(e){return t}
}
window.LumeFormatador={formatar:formatar};
})();
