/* Lume - Fisica. Motor geral de exercicios, sem casos fixos:
   le o texto, encontra os numeros com unidades, converte para o SI, decide que grandeza cada um e,
   percebe o que se pede e procura, numa tabela de formulas, a que liga os dados ao pedido (com ate
   dois calculos intermedios). Isola a incognita sozinho, escreve tudo em LaTeX e confere o resultado
   por dois caminhos (unidades e prova real). Interface: window.LumeFisica.{analisar, oferta, solucao, responder}. */
(function(){
"use strict";

/* ===== dimensoes: [kg, m, s, A, K, mol] ===== */
var Z=[0,0,0,0,0,0];
function V(a,b,c,d,e,f){return [a||0,b||0,c||0,d||0,e||0,f||0]}
function dAdd(a,b,k){k=k==null?1:k;var r=[],i;for(i=0;i<6;i++)r.push(a[i]+k*b[i]);return r}
function dEq(a,b){for(var i=0;i<6;i++)if(Math.abs(a[i]-b[i])>1e-9)return false;return true}
function nz(t){return String(t==null?"":t).normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}

/* ===== unidades ===== */
var UB={g:[1e-3,V(1),1],m:[1,V(0,1),1],s:[1,V(0,0,1),1],A:[1,V(0,0,0,1),1],K:[1,V(0,0,0,0,1),0],mol:[1,V(0,0,0,0,0,1),0],
 N:[1,V(1,1,-2),1],J:[1,V(1,2,-2),1],W:[1,V(1,2,-3),1],Pa:[1,V(1,-1,-2),1],Hz:[1,V(0,0,-1),1],V:[1,V(1,2,-3,-1),1],
 ohm:[1,V(1,2,-3,-2),1],C:[1,V(0,0,1,1),1],L:[1e-3,V(0,3),1],min:[60,V(0,0,1),0],h:[3600,V(0,0,1),0],
 cal:[4.186,V(1,2,-2),1],eV:[1.602e-19,V(1,2,-2),1],Wh:[3600,V(1,2,-2),1],atm:[101325,V(1,-1,-2),0],bar:[1e5,V(1,-1,-2),0],
 mmHg:[133.322,V(1,-1,-2),0],rpm:[1/60,V(0,0,-1),0],degC:[1,V(0,0,0,0,1),0],rad:[1,Z,0],deg:[Math.PI/180,Z,0],ton:[1000,V(1),0]};
var PF={k:1e3,M:1e6,G:1e9,T:1e12,m:1e-3,c:1e-2,d:1e-1,u:1e-6,n:1e-9};
var PALAVRAS_NAO_UNIDADE={um:1,uma:1,uns:1,umas:1,as:1,os:1,de:1,da:1,do:1,no:1,na:1,em:1,ou:1,se:1,mas:1,com:1,por:1,para:1};
function simb(id){
 if(id==="l")id="L";
 if(PALAVRAS_NAO_UNIDADE[id])return null;
 if(UB[id])return {f:UB[id][0],d:UB[id][1],off:id==="degC"?273.15:0};
 if(id.length>1&&PF[id.charAt(0)]!=null){var r=UB[id.slice(1)];if(r&&r[2])return {f:PF[id.charAt(0)]*r[0],d:r[1],off:0}}
 return null;
}
function unidade(raw){
 var s=String(raw||"").trim().replace(/\u00b2/g,"^2").replace(/\u00b3/g,"^3").replace(/[\u00b7\u22c5\u00d7]/g,"*").replace(/[\u2212\u2013]/g,"-")
  .replace(/\u03a9|\u2126/g,"ohm").replace(/[\u00b0\u00ba]\s*C/g,"degC").replace(/[\u00b0\u00ba]/g,"deg").replace(/\u00b5|\u03bc/g,"u").replace(/\s+/g,"");
 s=s.replace(/([A-Za-z])\.(?=[A-Za-z(])/g,"$1*");
 if(!s)return null;
 var tk=s.match(/[A-Za-z]+|-?\d+|[()*\/^]/g);if(!tk||tk.join("")!==s)return null;
 var pos=0;
 function seq(){
  var f=1,d=Z,off=0,den=false,got=false;
  while(pos<tk.length){
   var t=tk[pos],r=null;
   if(t===")"){break}
   if(t==="*"||t==="/"){if(!got)return null;if(t==="/")den=true;pos++;continue}
   if(t==="("){pos++;r=seq();if(!r||tk[pos]!==")")return null;pos++}
   else if(/^[A-Za-z]+$/.test(t)){var sm=simb(t);if(!sm)return null;pos++;r=sm}
   else return null;
   var ex=1;
   if(tk[pos]==="^"&&/^-?\d+$/.test(tk[pos+1]||"")){ex=parseInt(tk[pos+1],10);pos+=2}
   else if(/^-?\d+$/.test(tk[pos]||"")&&!/^[()*\/^]$/.test(tk[pos])){ex=parseInt(tk[pos],10);pos++}
   if(ex===0)return null;
   var k=den?-ex:ex;
   f*=Math.pow(r.f,k);d=dAdd(d,r.d,k);off=r.off||off;got=true;
  }
  return got?{f:f,d:d,off:off}:null;
 }
 var res=seq();
 if(!res||pos!==tk.length)return null;
 if(res.off&&!(dEq(res.d,V(0,0,0,0,1))&&Math.abs(res.f-1)<1e-12))res.off=0;
 return res;
}
function texUn(raw){
 var s=String(raw).trim().replace(/\u00b2/g,"^2").replace(/\u00b3/g,"^3").replace(/[\u00b7\u22c5\u00d7*]/g,"\\cdot ").replace(/\u03a9|\u2126|ohm/g,"\\Omega ")
  .replace(/degC|[\u00b0\u00ba]\s*C/g,"^{\\circ}C").replace(/deg|[\u00b0\u00ba]/g,"^{\\circ}").replace(/\^(-?\d+)/g,"^{$1}").replace(/^(u|\u00b5|\u03bc)(?=[A-Za-z])/,"\\mu ");
 return "\\mathrm{"+s+"}";
}
var PU=[["metros? por segundo ao quadrado","m/s^2"],["metros? por segundo quadrado","m/s^2"],["metros? por segundo","m/s"],["quilometros? por hora","km/h"],["kilometros? por hora","km/h"],
 ["quilogramas? por metro cubico","kg/m^3"],["gramas? por centimetro cubico","g/cm^3"],["newtons? por metro","N/m"],["newtons? por coulomb","N/C"],["joules? por quilograma kelvin","J/(kg*K)"],
 ["quilogramas?","kg"],["quilos?","kg"],["gramas?","g"],["quilometros?","km"],["kilometros?","km"],["centimetros?","cm"],["milimetros?","mm"],["metros?","m"],["segundos?","s"],["minutos?","min"],["horas?","h"],
 ["newtons?","N"],["joules?","J"],["quilojoules?","kJ"],["quilowatts?","kW"],["watts?","W"],["volts?","V"],["amperes?","A"],["ohms?","ohm"],["hertz","Hz"],["pascais|pascal","Pa"],
 ["graus celsius","degC"],["kelvins?","K"],["coulombs?","C"],["litros?","L"],["quilocalorias?","kcal"],["calorias?","cal"],["atmosferas?","atm"],["radianos?","rad"],["graus","deg"],["moles?","mol"]];
var PU_RE=PU.map(function(p){return [new RegExp("(\\d)\\s*(?:"+p[0]+")(?![a-z])","gi"),"$1 "+p[1]]});
function palavrasUnidades(s){PU_RE.forEach(function(r){s=s.replace(r[0],r[1])});return s}

/* ===== grandezas ===== */
var Q={},ORD=[];
function gq(k,tex,p,art,nome,dim,u,al,sy,o){var x={k:k,tex:tex,p:p,art:art,nome:nome,dim:dim,u:u,al:al||[],sy:sy||[]};if(o)for(var z in o)x[z]=o[z];Q[k]=x;ORD.push(k)}
var LL=V(0,1),TT=V(0,0,1),FF=V(1,1,-2),EE=V(1,2,-2),KK=V(0,0,0,0,1);
gq("d","d","d","a","distância",LL,"m",["distancia","deslocamento","espaco percorrido","espaco","percurso","trajeto","comprimento"],["d","s","Δs","Δx"]);
gq("h","h","h","a","altura",LL,"m",["altura","profundidade","desnivel","do solo","do chao","acima do solo"],["h"],{cx:["sobe","sobem","subir","subiu","elevado","eleva","a uma altura"]});
gq("r","r","r","o","raio",LL,"m",["raio","distancia entre"],["r"]);
gq("x","x","x","a","deformação",LL,"m",["deformacao","alongamento","compressao","elongacao","esticada","esticou","comprimida","comprimiu"],["x"]);
gq("lam","\\lambda","λ","o","comprimento de onda",LL,"m",["comprimento de onda"],["λ","lambda"]);
gq("t","t","t","o","tempo",TT,"s",["intervalo de tempo","tempo","duracao","demora"],["t","Δt"]);
gq("Per","T","T","o","período",TT,"s",["periodo"],["T"]);
gq("m","m","m","a","massa",V(1),"kg",["massa"],["m"]);
gq("v","v","v","a","velocidade",V(0,1,-1),"m/s",["velocidade final","velocidade media","velocidade escalar","velocidade da onda","velocidade","rapidez"],["v","vf","vm"]);
gq("v0","v_0","v₀","a","velocidade inicial",V(0,1,-1),"m/s",["velocidade inicial"],["v0","vi","vo"]);
gq("a","a","a","a","aceleração",V(0,1,-2),"m/s^2",["aceleracao"],["a"]);
gq("g","g","g","a","aceleração da gravidade",V(0,1,-2),"m/s^2",["aceleracao da gravidade","aceleracao gravitica","gravidade"],["g"]);
gq("F","F","F","a","força",FF,"N",["forca resultante","forca elastica","forca aplicada","forca de tracao","intensidade da forca","forca","tracao"],["F","Fr"]);
gq("Fa","F_{at}","Fat","a","força de atrito",FF,"N",["forca de atrito"],["Fat"]);
gq("Fn","N","N","a","força normal",FF,"N",["forca normal","reacao normal","normal"],["N"]);
gq("Pp","P","P","o","peso",FF,"N",["forca peso","peso"],["P"],{cx:["pesa","pesam"]});
gq("Emp","E","E","o","empuxo",FF,"N",["empuxo","impulsao"],["E"]);
gq("mu","\\mu","μ","o","coeficiente de atrito",Z,"",["coeficiente de atrito"],["μ","mu"],{auto:false});
gq("k","k","k","a","constante elástica",V(1,0,-2),"N/m",["constante elastica","constante da mola","constante de elasticidade"],["k"]);
gq("p","p","p","o","momento linear",V(1,1,-1),"kg\\cdot m/s",["momento linear","quantidade de movimento","momento"],["p"]);
gq("Imp","I","I","o","impulso",V(1,1,-1),"N\\cdot s",["impulso"],[]);
gq("W","W","W","o","trabalho",EE,"J",["trabalho"],["W"]);
gq("Ec","E_c","Ec","a","energia cinética",EE,"J",["energia cinetica"],["Ec"]);
gq("Ep","E_p","Ep","a","energia potencial",EE,"J",["energia potencial gravitica","energia potencial elastica","energia potencial gravitacional","energia potencial"],["Ep"]);
gq("E","E","E","a","energia",EE,"J",["energia mecanica","energia consumida","energia eletrica","energia"],["E"]);
gq("Q","Q","Q","o","calor",EE,"J",["quantidade de calor","calor"],["Q"]);
gq("P","P","P","a","potência",V(1,2,-3),"W",["potencia eletrica","potencia"],["P"]);
gq("A","A","A","a","área",V(0,2),"m^2",["area"],["A"]);
gq("Vol","V","V","o","volume",V(0,3),"m^3",["volume"],["V"]);
gq("pres","p","p","a","pressão",V(1,-1,-2),"Pa",["pressao"],["p"]);
gq("rho","\\rho","ρ","a","densidade",V(1,-3),"kg/m^3",["massa volumica","massa especifica","densidade"],["ρ","rho"]);
gq("c","c","c","o","calor específico",V(0,2,-2,0,-1),"J/(kg\\cdot K)",["calor especifico","capacidade termica massica"],["c"]);
gq("Lc","L","L","o","calor latente",V(0,2,-2),"J/kg",["calor latente"],["L"]);
gq("Tk","T","T","a","temperatura",KK,"K",["temperatura"],["T"],{abs:true});
gq("DT","\\Delta T","ΔT","a","variação de temperatura",KK,"K",["variacao de temperatura","variacao da temperatura","aumento de temperatura","aumento da temperatura","elevacao de temperatura","diferenca de temperatura"],["ΔT","dT"],{cx:["aquecimento","aquecer","aquecida","aumentando","aumentou","aqueceu","elevou"]});
gq("Ti","T_i","Ti","a","temperatura inicial",KK,"K",["temperatura inicial"],["Ti"],{auto:false,keep:true});
gq("Tf","T_f","Tf","a","temperatura final",KK,"K",["temperatura final"],["Tf"],{auto:false,keep:true});
gq("n","n","n","o","número de moles",V(0,0,0,0,0,1),"mol",["numero de moles","quantidade de substancia","moles"],["n"]);
gq("f","f","f","a","frequência",V(0,0,-1),"Hz",["frequencia"],["f"]);
gq("w","\\omega","ω","a","velocidade angular",V(0,0,-1),"rad/s",["velocidade angular","frequencia angular"],["ω","w"]);
gq("U","U","U","a","tensão",V(1,2,-3,-1),"V",["diferenca de potencial","tensao","voltagem","ddp"],["U","V"]);
gq("I","I","I","a","corrente",V(0,0,0,1),"A",["intensidade de corrente","corrente eletrica","corrente"],["I","i"]);
gq("R","R","R","a","resistência",V(1,2,-3,-2),"\\Omega",["resistencia"],["R"]);
gq("q","q","q","a","carga",V(0,0,1,1),"C",["carga eletrica","carga"],["q","Q"]);
gq("Ef","E","E","o","campo elétrico",V(1,1,-3,-1),"N/C",["campo eletrico"],[]);
gq("ang","\\theta","θ","o","ângulo",Z,"",["angulo"],["θ","α"]);
gq("G","G","G","a","constante gravitacional",V(-1,3,-2),"N\\cdot m^2/kg^2",[],[],{cte:6.674e-11,auto:false});
gq("ke","k_e","k","a","constante de Coulomb",V(1,3,-4,-2),"N\\cdot m^2/C^2",[],[],{cte:9e9,auto:false});
gq("Rg","R","R","a","constante dos gases",V(1,2,-2,0,-1,-1),"J/(mol\\cdot K)",[],[],{cte:8.314,auto:false});
var NOTA_CTE={g:"valor da aceleração da gravidade à superfície da Terra",G:"constante da gravitação universal",rho:"densidade da água",ke:"constante da lei de Coulomb",Rg:"constante universal dos gases",c:"calor específico da água"};
var SYM={};ORD.forEach(function(k){Q[k].sy.forEach(function(s){(SYM[s]=SYM[s]||[]).push(k)})});
function chavesDeDim(d){return ORD.filter(function(k){var q=Q[k];return q.auto!==false&&dEq(q.dim,d)})}

/* ===== formulas ===== */
var FM=[];
function C(n,d,v){return {n:String(n),d:String(d),v:v!=null?v:n/d}}
function chave(s){return s.split("#")[0]}
function indice(s){return s.indexOf("#")>0?parseInt(s.split("#")[1],10)-1:0}
function sp(s,p){return "\u27ea"+s+"\u27eb"+(p!==1?"^{"+p+"}":"")}
function junta(it,co){var a=[];if(co!=="1"||!it.length)a.push(co);it.forEach(function(t){a.push(sp(t[0],t[1]))});return a.join(" \\cdot ")}
function frac(n,d){return d==="1"?n:"\\frac{"+n+"}{"+d+"}"}
function mono(id,area,nome,w,lhs,c,rhs,alt){
 var vars=[];lhs.concat(rhs).forEach(function(t){if(vars.indexOf(t[0])<0)vars.push(t[0])});
 var E={};lhs.forEach(function(t){E[t[0]]=(E[t[0]]||0)+t[1]});rhs.forEach(function(t){E[t[0]]=(E[t[0]]||0)-t[1]});
 var f={id:id,area:area,nome:nome,w:w||[],vars:vars,alt:alt||{},mono:true,E:E,c:c,isol:{}};
 f.dir=lhs.length===1&&lhs[0][1]===1?lhs[0][0]:null;
 var rn=rhs.filter(function(t){return t[1]>0}),rd=rhs.filter(function(t){return t[1]<0}).map(function(t){return [t[0],-t[1]]});
 var lt=lhs.map(function(t){return sp(t[0],t[1])}).join(" \\cdot ");
 var rt=(c.n==="1"&&c.d!=="1"&&!rd.length)?"\\frac{1}{"+c.d+"} \\cdot "+junta(rn,"1"):frac(junta(rn,c.n),junta(rd,c.d));
 f.orig=lt+" = "+rt;
 vars.forEach(function(j){
  var ej=E[j],num=[],den=[];
  vars.forEach(function(s){if(s===j)return;var p=-E[s];if(p>0)num.push([s,p]);else if(p<0)den.push([s,-p])});
  var N=junta(num,c.n),D=junta(den,c.d);
  if(ej<0){var tmp=N;N=D;D=tmp}
  var body=frac(N,D);if(Math.abs(ej)===2)body="\\sqrt{"+body+"}";
  f.isol[j]={t:body,f:function(Vv){var p=c.v;vars.forEach(function(s){if(s!==j)p/=Math.pow(Vv[s],E[s])});return Math.pow(p,1/ej)}};
 });
 FM.push(f);
}
function man(o){o.mono=false;o.alt=o.alt||{};FM.push(o)}
mono("mru","Cinemática","Velocidade média",["velocidade media","mru","movimento uniforme"],[["v",1]],C(1,1),[["d",1],["t",-1]]);
man({id:"mruv_v",area:"Cinemática",nome:"Movimento uniformemente variado (velocidade)",w:["mruv","acelera","aceleracao","trava","freia"],vars:["v","v0","a","t"],dir:"v",
 orig:"v = v_0 + a \\cdot t",terms:[[["v",1]],[["v0",1]],[["a",1],["t",1]]],
 isol:{v:{t:sp("v0",1)+" + "+sp("a",1)+" \\cdot "+sp("t",1),f:function(x){return x.v0+x.a*x.t}},
  v0:{t:sp("v",1)+" - "+sp("a",1)+" \\cdot "+sp("t",1),f:function(x){return x.v-x.a*x.t}},
  a:{t:"\\frac{"+sp("v",1)+" - "+sp("v0",1)+"}{"+sp("t",1)+"}",f:function(x){return (x.v-x.v0)/x.t}},
  t:{t:"\\frac{"+sp("v",1)+" - "+sp("v0",1)+"}{"+sp("a",1)+"}",f:function(x){return (x.v-x.v0)/x.a}}}});
man({id:"mruv_d",area:"Cinemática",nome:"Movimento uniformemente variado (posição)",w:["mruv","acelera","percorre"],vars:["d","v0","a","t"],dir:"d",
 orig:"d = v_0 \\cdot t + \\frac{1}{2} \\cdot a \\cdot t^{2}",terms:[[["d",1]],[["v0",1],["t",1]],[["a",1],["t",2]]],
 isol:{d:{t:sp("v0",1)+" \\cdot "+sp("t",1)+" + \\frac{1}{2} \\cdot "+sp("a",1)+" \\cdot "+sp("t",2),f:function(x){return x.v0*x.t+0.5*x.a*x.t*x.t}},
  v0:{t:"\\frac{"+sp("d",1)+" - \\frac{1}{2} \\cdot "+sp("a",1)+" \\cdot "+sp("t",2)+"}{"+sp("t",1)+"}",f:function(x){return (x.d-0.5*x.a*x.t*x.t)/x.t}},
  a:{t:"\\frac{2 \\cdot ("+sp("d",1)+" - "+sp("v0",1)+" \\cdot "+sp("t",1)+")}{"+sp("t",2)+"}",f:function(x){return 2*(x.d-x.v0*x.t)/(x.t*x.t)}}}});
man({id:"torricelli",area:"Cinemática",nome:"Equação de Torricelli",w:["torricelli","sem tempo"],vars:["v","v0","a","d"],dir:null,
 orig:"v^{2} = v_0^{2} + 2 \\cdot a \\cdot d",terms:[[["v",2]],[["v0",2]],[["a",1],["d",1]]],
 isol:{v:{t:"\\sqrt{"+sp("v0",2)+" + 2 \\cdot "+sp("a",1)+" \\cdot "+sp("d",1)+"}",f:function(x){return Math.sqrt(x.v0*x.v0+2*x.a*x.d)}},
  v0:{t:"\\sqrt{"+sp("v",2)+" - 2 \\cdot "+sp("a",1)+" \\cdot "+sp("d",1)+"}",f:function(x){return Math.sqrt(x.v*x.v-2*x.a*x.d)}},
  a:{t:"\\frac{"+sp("v",2)+" - "+sp("v0",2)+"}{2 \\cdot "+sp("d",1)+"}",f:function(x){return (x.v*x.v-x.v0*x.v0)/(2*x.d)}},
  d:{t:"\\frac{"+sp("v",2)+" - "+sp("v0",2)+"}{2 \\cdot "+sp("a",1)+"}",f:function(x){return (x.v*x.v-x.v0*x.v0)/(2*x.a)}}}});
mono("queda_v","Cinemática","Queda livre (velocidade)",["queda livre","cai","largado","abandonado","solto"],[["v",1]],C(1,1),[["g",1],["t",1]],{h:["d"]});
mono("queda_h","Cinemática","Queda livre (altura)",["queda livre","cai","largado","abandonado","solto"],[["h",1]],C(1,2),[["g",1],["t",2]],{h:["d"]});
mono("queda_vh","Cinemática","Queda livre (velocidade e altura)",["queda livre","cai","largado","abandonado","solto","chao"],[["v",2]],C(2,1),[["g",1],["h",1]],{h:["d"]});
mono("mcu_v","Movimento circular","Velocidade no movimento circular",["circular","circunferencia","roda"],[["v",1]],C(1,1),[["w",1],["r",1]]);
mono("mcu_w","Movimento circular","Velocidade angular",["circular","circunferencia","roda","rotacao"],[["w",1]],{n:"2\\pi",d:"1",v:2*Math.PI},[["f",1]]);
mono("mcu_ac","Movimento circular","Aceleração centrípeta",["centripeta","circular","curva"],[["a",1]],C(1,1),[["v",2],["r",-1]]);
mono("freq","Ondulatória","Frequência e período",["periodo","frequencia"],[["f",1]],C(1,1),[["Per",-1]]);
mono("newton","Dinâmica","Segunda lei de Newton",["newton","resultante","puxa","empurra","acelera"],[["F",1]],C(1,1),[["m",1],["a",1]]);
man({id:"newton_atrito",area:"Dinâmica",nome:"Segunda lei de Newton com atrito (plano horizontal)",w:["atrito","plano","puxado","puxada","empurrado","empurrada"],vars:["F","m","a","mu","g"],dir:null,
 orig:"F - \\mu \\cdot m \\cdot g = m \\cdot a",terms:[[["F",1]],[["mu",1],["m",1],["g",1]],[["m",1],["a",1]]],
 isol:{a:{t:"\\frac{"+sp("F",1)+" - "+sp("mu",1)+" \\cdot "+sp("m",1)+" \\cdot "+sp("g",1)+"}{"+sp("m",1)+"}",f:function(x){return (x.F-x.mu*x.m*x.g)/x.m}},
  F:{t:sp("m",1)+" \\cdot "+sp("a",1)+" + "+sp("mu",1)+" \\cdot "+sp("m",1)+" \\cdot "+sp("g",1),f:function(x){return x.m*x.a+x.mu*x.m*x.g}},
  mu:{t:"\\frac{"+sp("F",1)+" - "+sp("m",1)+" \\cdot "+sp("a",1)+"}{"+sp("m",1)+" \\cdot "+sp("g",1)+"}",f:function(x){return (x.F-x.m*x.a)/(x.m*x.g)}}}});
mono("peso","Dinâmica","Peso",["peso"],[["Pp",1]],C(1,1),[["m",1],["g",1]]);
mono("atrito","Dinâmica","Força de atrito",["atrito"],[["Fa",1]],C(1,1),[["mu",1],["Fn",1]],{Fn:["F","Pp"]});
mono("hooke","Dinâmica","Lei de Hooke",["mola","elastica","hooke"],[["F",1]],C(1,1),[["k",1],["x",1]],{F:["Pp"]});
mono("grav","Gravitação","Lei da gravitação universal",["gravitacional","gravitacao","atracao","planeta"],[["F",1]],C(1,1),[["G",1],["m",1],["m#2",1],["r",-2]],{r:["d"]});
mono("momento","Dinâmica","Momento linear",["momento","quantidade de movimento"],[["p",1]],C(1,1),[["m",1],["v",1]]);
mono("impulso","Dinâmica","Impulso",["impulso"],[["Imp",1]],C(1,1),[["F",1],["t",1]]);
mono("fcp","Movimento circular","Força centrípeta",["centripeta","curva","circular"],[["F",1]],C(1,1),[["m",1],["v",2],["r",-1]]);
mono("ec","Energia e trabalho","Energia cinética",["energia cinetica","cinetica"],[["Ec",1]],C(1,2),[["m",1],["v",2]]);
mono("epg","Energia e trabalho","Energia potencial gravítica",["potencial","gravitica","altura"],[["Ep",1]],C(1,1),[["m",1],["g",1],["h",1]]);
mono("epe","Energia e trabalho","Energia potencial elástica",["mola","elastica"],[["Ep",1]],C(1,2),[["k",1],["x",2]]);
mono("trab","Energia e trabalho","Trabalho de uma força",["trabalho"],[["W",1]],C(1,1),[["F",1],["d",1]]);
man({id:"trabcos",area:"Energia e trabalho",nome:"Trabalho de uma força inclinada",w:["trabalho","angulo","inclinada","forma"],vars:["W","F","d","ang"],dir:"W",
 orig:"W = F \\cdot d \\cdot \\cos\\theta",terms:[[["W",1]],[["F",1],["d",1]]],
 isol:{W:{t:sp("F",1)+" \\cdot "+sp("d",1)+" \\cdot \\cos("+sp("ang",1)+")",f:function(x){return x.F*x.d*Math.cos(x.ang)}},
  F:{t:"\\frac{"+sp("W",1)+"}{"+sp("d",1)+" \\cdot \\cos("+sp("ang",1)+")}",f:function(x){return x.W/(x.d*Math.cos(x.ang))}},
  d:{t:"\\frac{"+sp("W",1)+"}{"+sp("F",1)+" \\cdot \\cos("+sp("ang",1)+")}",f:function(x){return x.W/(x.F*Math.cos(x.ang))}}}});
mono("pot_w","Energia e trabalho","Potência",["potencia"],[["P",1]],C(1,1),[["W",1],["t",-1]]);
mono("pot_e","Energia e trabalho","Potência e energia",["potencia","energia"],[["P",1]],C(1,1),[["E",1],["t",-1]]);
mono("pot_f","Energia e trabalho","Potência de uma força",["potencia"],[["P",1]],C(1,1),[["F",1],["v",1]]);
mono("dens","Hidrostática","Densidade",["densidade","massa volumica"],[["rho",1]],C(1,1),[["m",1],["Vol",-1]]);
mono("pres","Hidrostática","Pressão",["pressao"],[["pres",1]],C(1,1),[["F",1],["A",-1]]);
mono("hidro","Hidrostática","Pressão hidrostática",["pressao","profundidade","liquido","agua"],[["pres",1]],C(1,1),[["rho",1],["g",1],["h",1]]);
mono("empuxo","Hidrostática","Empuxo (Arquimedes)",["empuxo","impulsao","flutua","submerso","arquimedes"],[["Emp",1]],C(1,1),[["rho",1],["g",1],["Vol",1]]);
mono("calor","Termologia","Calor sensível",["calor","aquecer","aquece","temperatura"],[["Q",1]],C(1,1),[["m",1],["c",1],["DT",1]]);
mono("latente","Termologia","Calor latente",["fusao","vaporizacao","mudanca de estado"],[["Q",1]],C(1,1),[["m",1],["Lc",1]]);
man({id:"dT",area:"Termologia",nome:"Variação de temperatura",w:["temperatura","aquecer","de"],vars:["DT","Tf","Ti"],dir:"DT",
 orig:"\\Delta T = T_f - T_i",terms:[[["DT",1]],[["Tf",1]],[["Ti",1]]],
 isol:{DT:{t:sp("Tf",1)+" - "+sp("Ti",1),f:function(x){return x.Tf-x.Ti}},Tf:{t:sp("Ti",1)+" + "+sp("DT",1),f:function(x){return x.Ti+x.DT}},Ti:{t:sp("Tf",1)+" - "+sp("DT",1),f:function(x){return x.Tf-x.DT}}}});
mono("gas","Gases","Equação dos gases perfeitos",["gas","gases","perfeito"],[["pres",1],["Vol",1]],C(1,1),[["n",1],["Rg",1],["Tk",1]]);
mono("onda","Ondulatória","Equação fundamental das ondas",["onda","ondas","som","luz"],[["v",1]],C(1,1),[["lam",1],["f",1]]);
mono("ohm","Eletricidade","Lei de Ohm",["ohm","resistencia","circuito"],[["U",1]],C(1,1),[["R",1],["I",1]]);
mono("potel1","Eletricidade","Potência elétrica",["potencia","eletrica"],[["P",1]],C(1,1),[["U",1],["I",1]]);
mono("potel2","Eletricidade","Potência dissipada numa resistência",["potencia","resistencia","efeito de joule"],[["P",1]],C(1,1),[["R",1],["I",2]]);
mono("potel3","Eletricidade","Potência com a tensão e a resistência",["potencia","resistencia"],[["P",1]],C(1,1),[["U",2],["R",-1]]);
mono("carga","Eletricidade","Carga e corrente",["carga","corrente"],[["q",1]],C(1,1),[["I",1],["t",1]]);
mono("energia","Eletricidade","Energia consumida",["energia","consumo","consome"],[["E",1]],C(1,1),[["P",1],["t",1]]);
mono("coulomb","Eletricidade","Lei de Coulomb",["coulomb","cargas","eletrica"],[["F",1]],C(1,1),[["ke",1],["q",1],["q#2",1],["r",-2]],{r:["d"]});
mono("campo","Eletricidade","Campo elétrico",["campo"],[["Ef",1]],C(1,1),[["F",1],["q",-1]]);
mono("ddp","Eletricidade","Tensão e campo elétrico",["campo","tensao"],[["U",1]],C(1,1),[["Ef",1],["d",1]]);

/* ===== leitura do texto ===== */
var UNID_RE=/^\s*([A-Za-z\u00b5\u03bc\u03a9\u2126\u00b0\u00ba][A-Za-z\u00b5\u03bc\u03a9\u2126\u00b0\u00ba\u00b2\u00b3\u00b7\u22c5*\/^\-\d.()]*)/;
function medidas(s0){
 var out=[],re=/(-?\d+(?:[.,]\d+)?)(?:\s*(?:x|\u00d7|\*)\s*10\s*\^?\s*\{?(-?\d+)\}?|e(-?\d+)(?![a-z]))?/g,m;
 while((m=re.exec(s0))){
  var i=m.index,prev=s0.charAt(i-1),num=m[1];
  if(/[A-Za-z_]/.test(prev))continue;
  if(num.charAt(0)==="-"&&/[\d)\]]/.test(prev)){num=num.slice(1);i++}
  var neg=num.charAt(0)==="-";if(neg)num=num.slice(1);
  var core=/^\d{1,3}(\.\d{3})+$/.test(num)?num.replace(/\./g,""):num.replace(",",".");
  var v=parseFloat(core);if(!isFinite(v))continue;
  var ex=m[2]!=null?parseInt(m[2],10):(m[3]!=null?parseInt(m[3],10):0);
  if(ex)v*=Math.pow(10,ex);
  if(neg)v=-v;
  var end=m.index+m[0].length,um=UNID_RE.exec(s0.slice(end)),un=null,raw="",uend=end;
  if(um){
   var tk=um[1],st=end+um[0].length-tk.length;
   for(var L=tk.length;L>0;L--){
    var cand=tk.slice(0,L),rem=tk.charAt(L);
    if(L<tk.length&&/[A-Za-z]/.test(rem)&&/[A-Za-z]$/.test(cand))continue;
    var u2=unidade(cand);if(u2){un=u2;raw=cand;uend=st+L;break}
   }
  }
  out.push({i:i,ne:end,e:uend,v:v,un:un,raw:raw});
  if(uend>re.lastIndex)re.lastIndex=uend;
 }
 return out;
}
function fronteira(s0,i){var b=0,rx=/[.!?]\s|\n/g,m;while((m=rx.exec(s0))&&m.index<i)b=m.index+m[0].length;return b}
function contexto(s0,M,j){
 var m=M[j],b=Math.max(fronteira(s0,m.i),j>0?M[j-1].e:0),preO=s0.slice(Math.max(b,m.i-70),m.i);
 var prox=j+1<M.length?M[j+1].i:s0.length,pos=s0.slice(m.e,Math.min(prox,m.e+28)),cut=pos.search(/[.!?;]/);
 if(cut>=0)pos=pos.slice(0,cut);
 return {pre:preO.toLowerCase(),preO:preO,pos:pos.toLowerCase()};
}
function pontuar(k,c){
 var best=0;
 Q[k].al.concat(Q[k].cx||[]).forEach(function(a){
  var re=new RegExp("\\b"+a+"(?:s|es)?\\b","g"),m,sc;
  while((m=re.exec(c.pre))){sc=a.length*3-(c.pre.length-(m.index+m[0].length))/10;if(sc>best)best=sc}
  var p=new RegExp("\\b"+a+"(?:s|es)?\\b").exec(c.pos);if(p){sc=a.length*1.5-p.index/10;if(sc>best)best=sc}
 });
 return best;
}
function chaveDe(m,c){
 var cands=chavesDeDim(m.un.d);if(!cands.length)return null;
 var sy=/([A-Za-z\u03bb\u03bc\u03c1\u03c9\u03b8\u0394]{1,3}[0-9]?)\s*[=:]\s*$/.exec(c.preO);
 if(sy){var ks=SYM[sy[1]];if(ks)for(var i=0;i<ks.length;i++)if(cands.indexOf(ks[i])>=0)return ks[i]}
 if(cands.length===1)return cands[0];
 var best=cands[0],bs=0;
 cands.forEach(function(k){var s=pontuar(k,c);if(s>bs){bs=s;best=k}});
 return best;
}
function intervalos(s0,M){
 for(var j=0;j+1<M.length;j++){
  var a=M[j],b=M[j+1];if(!b.un||b.rng)continue;
  if(a.un&&!dEq(a.un.d,b.un.d))continue;
  var antes=s0.slice(Math.max(0,a.i-12),a.i).toLowerCase(),entre=s0.slice(a.e,b.i).toLowerCase();
  if(/(\bde|\bentre|\bdesde)\s*$/.test(antes)&&/^\s*(a|ate|e)\s*$/.test(entre)){if(!a.un){a.un=b.un;a.raw=b.raw;a.e=a.ne}a.rng=1;b.rng=2}
 }
}
function montar(s0,sl){
 var M=medidas(s0),A={},ordem=[];
 intervalos(s0,M);
 M.forEach(function(m,j){
  if(!m.un)return;
  var c=contexto(s0,M,j),k;
  if(m.rng&&dEq(m.un.d,V(0,1,-1)))k=m.rng===1?"v0":"v";
  else if(m.rng&&dEq(m.un.d,KK))k=m.rng===1?"Ti":"Tf";
  else k=chaveDe(m,c);
  if(!k)return;
  var q=Q[k],v=Number((m.v*m.un.f).toPrecision(12));
  if(q.abs&&m.un.off)v=m.v+m.un.off;
  if(q.keep)v=m.v;
  var en={k:k,v:v,ov:m.v,raw:m.raw,un:m.un,src:"dado"};
  (A[k]=A[k]||[]).push(en);ordem.push(en);
 });
 if(A.v&&A.v.length>=2&&!A.v0){A.v0=[A.v[0]];A.v0[0].k="v0";A.v=[A.v[1]];ordem.forEach(function(e){if(e===A.v0[0])e.k="v0"})}
 var mu=/(?:coeficiente de atrito(?: cinetico| estatico| dinamico)?(?:\s+(?:de|e|=|vale|igual a|:))?\s*|atrito(?: cinetico| estatico| dinamico)?\s+de\s+coeficiente\s*(?:de|=|e)?\s*|atrito(?: cinetico| estatico| dinamico)?\s*(?:=|de|vale|igual a)\s*|(?:^|[^a-z])(?:mu|\u03bc)\s*=\s*)(\d+(?:[.,]\d+)?)(?!\s*[a-z%])/.exec(sl);
 if(mu&&!A.mu){var en2={k:"mu",v:parseFloat(mu[1].replace(",",".")),ov:parseFloat(mu[1].replace(",",".")),raw:"",un:{f:1,d:Z,off:0},src:"dado"};A.mu=[en2];ordem.push(en2)}
 function impl(k,nota,raw){if(!A[k]){var e={k:k,v:0,ov:0,raw:raw,un:{f:1,d:Q[k].dim,off:0},src:"dado",impl:nota};A[k]=[e];ordem.push(e)}}
 if(/repouso/.test(sl)&&!/(ate|chegar|chega|fica|ficar|volta|voltar)[^.]{0,24}repouso/.test(sl))impl("v0","parte do repouso","m/s");
 if(/ate\s+(a\s+|ao\s+)?(parar|paragem|repouso)|para por completo|ate parar/.test(sl)){if(A.v&&A.v.length===1&&!A.v0){A.v0=[A.v[0]];A.v0[0].k="v0";delete A.v}impl("v","fica parado no fim","m/s")}
 if(/queda livre|cai\b|caiu|deixa[- ]?se cair|deixado cair|abandonado|largado|solto/.test(sl))impl("v0","parte do repouso","m/s");
 return {A:A,ordem:ordem};
}
var ALIASES=[];ORD.forEach(function(k){Q[k].al.forEach(function(a){ALIASES.push({k:k,a:a,re:new RegExp("\\b"+a+"(?:s|es)?\\b","g")})})});
function regiaoPergunta(sl){
 var m=/\b(qual|quais|quanto|quanta|quantos|quantas|calcul\w*|determin\w*|encontr\w*|obtenh\w*|indiqu\w*|descubr\w*|ache|achar|diga|resolv\w*)\b/.exec(sl),a=m?m.index:-1,q=sl.indexOf("?");
 if(q>=0){var b=0,rx=/[.!?]\s/g,x;while((x=rx.exec(sl))&&x.index<q)b=x.index+x[0].length;if(a<0||b<a)a=b}
 return a<0?null:a;
}
function alvosDe(sl,A){
 var qm=regiaoPergunta(sl);
 if(qm===null)return null;
 var reg=sl.slice(qm),hits=[];
 ALIASES.forEach(function(x){x.re.lastIndex=0;var m;while((m=x.re.exec(reg)))hits.push({i:m.index,e:m.index+m[0].length,k:x.k,l:x.a.length})});
 hits.sort(function(a,b){return b.l-a.l||a.i-b.i});
 var tom=[],fin=[];
 hits.forEach(function(h){if(tom.some(function(t){return h.i<t.e&&h.e>t.i}))return;tom.push(h);fin.push(h)});
 fin.sort(function(a,b){return a.i-b.i});
 var ks=[];
 fin.forEach(function(h){if(Q[h.k].cte==null&&!A[h.k]&&ks.indexOf(h.k)<0)ks.push(h.k)});
 if(ks.length>1)ks=ks.filter(function(k){return k!=="g"});
 return ks;
}

/* ===== resolver ===== */
function obter(f,spec,A,ctx){
 var k=chave(spec),i=indice(spec);
 if(A[k]&&A[k][i])return A[k][i];
 var al=f.alt[spec]||[];
 for(var j=0;j<al.length;j++){var e=A[al[j]];if(e&&e[0])return e[0]}
 var q=Q[k];
 if(q.cte!=null)return {k:k,v:q.cte,src:"cte"};
 if(k==="g")return ctx.alvoG?null:{k:"g",v:9.8,src:"cte"};
 if(k==="c"&&ctx.agua)return {k:"c",v:4186,src:"cte"};
 if(k==="rho"&&ctx.agua)return {k:"rho",v:1000,src:"cte"};
 return null;
}
function nums(vals){var o={};for(var s in vals)o[s]=vals[s].v;return o}
function palavrasHit(f,sl){var n=0;f.w.forEach(function(w){if(sl.indexOf(w)>=0)n++});return n}
function diretos(K,A,ctx,so){
 var res=[];
 FM.forEach(function(f){
  if(so&&f!==so)return;
  f.vars.forEach(function(spec){
   if(chave(spec)!==K||indice(spec)!==0||!f.isol[spec])return;
   var vals={},used=0,cte=0,ok=true;
   f.vars.forEach(function(s){
    if(s===spec)return;
    var en=obter(f,s,A,ctx);if(!en){ok=false;return}
    vals[s]=en;if(en.src==="cte")cte++;else used++;
   });
   if(!ok||!used)return;
   var r;try{r=f.isol[spec].f(nums(vals))}catch(e){return}
   if(!isFinite(r))return;
   res.push({f:f,K:spec,vals:vals,v:r,score:used*100+palavrasHit(f,ctx.sl)*10-cte});
  });
 });
 res.sort(function(a,b){return b.score-a.score});
 return res;
}
function clonar(A){var o={};for(var k in A)o[k]=A[k].slice();return o}
function resolver(K,A,ctx,prof,pilha){
 var d=diretos(K,A,ctx);
 if(d.length)return {passos:[d[0]],v:d[0].v,score:d[0].score};
 if(prof<=0)return null;
 var best=null;
 FM.forEach(function(f){
  f.vars.forEach(function(spec){
   if(chave(spec)!==K||indice(spec)!==0||!f.isol[spec])return;
   var falta=[];f.vars.forEach(function(s){if(s!==spec&&!obter(f,s,A,ctx))falta.push(s)});
   if(!falta.length||falta.length>2)return;
   var A2=clonar(A),passos=[],ok=true;
   falta.forEach(function(s){
    if(!ok)return;
    if(indice(s)!==0){ok=false;return}
    var cs=[chave(s)].concat(f.alt[s]||[]),sub=null,k2=null;
    for(var ci=0;ci<cs.length&&!sub;ci++){if(cs[ci]===K||pilha.indexOf(cs[ci])>=0)continue;sub=resolver(cs[ci],A2,ctx,prof-1,pilha.concat([K]));if(sub)k2=cs[ci]}
    if(!sub){ok=false;return}
    passos=passos.concat(sub.passos);
    A2[k2]=[{k:k2,v:sub.v,src:"calc"}].concat(A2[k2]||[]);
   });
   if(!ok)return;
   var fin=diretos(K,A2,ctx,f);if(!fin.length)return;
   var tot=passos.concat([fin[0]]);
   if(!best||tot.length<best.passos.length||(tot.length===best.passos.length&&fin[0].score>best.score))best={passos:tot,v:fin[0].v,score:fin[0].score};
  });
 });
 return best;
}
function analisar(q){
 var s0=nz(q);
 if(s0.length<14)return null;
 s0=palavrasUnidades(s0);
 var sl=s0.toLowerCase();
 if(/\b(convert\w*|transform\w*)/.test(sl)||/\bpassa\s+(?:de\s+)?[\d.,]+\s*[a-z\u00b0\/\u00b2\u00b3^*\-]*\s+para\b/.test(sl))return null;
 var L=montar(s0,sl),A=L.A,nm=L.ordem.filter(function(e){return !e.impl}).length;
 if(nm<1)return null;
 var ctx={sl:sl,agua:/\bagua\b/.test(sl)};
 var ks=alvosDe(sl,A);
 if(ks===null)return null;
 if(!ks.length)return null;
 ctx.alvoG=ks.indexOf("g")>=0;
 var alvos=[],nao=[],regQ=s0.slice(Math.max(0,regiaoPergunta(sl)));
 ks.forEach(function(K){
  var r=resolver(K,A,ctx,2,[]);
  if(!r){nao.push(K);return}
  var al={K:K,passos:r.passos,v:r.v},re=/\bem\s+([A-Za-z\u00b5\u03bc\u03a9\u00b0][A-Za-z\u00b5\u03bc\u03a9\u00b0\u00b2\u00b3*\/^\-\d.()]*)/g,mm;
  while((mm=re.exec(regQ))){var tok=mm[1].replace(/[.,;:)]+$/,""),un=unidade(tok);if(un&&dEq(un.d,Q[K].dim)&&!(Math.abs(un.f-1)<1e-12&&!un.off)){al.em={raw:tok,un:un};break}}
  alvos.push(al);
 });
 if(!alvos.length)return null;
 var ct=[];
 alvos.forEach(function(a){a.passos.forEach(function(st){for(var s in st.vals){var e=st.vals[s];if(e.src==="cte"&&ct.indexOf(e.k)<0)ct.push(e.k)}})});
 var last=alvos[0].passos[alvos[0].passos.length-1];
 var usados=[];alvos.forEach(function(a){a.passos.forEach(function(st){for(var s in st.vals)usados.push(st.vals[s])})});
 var nu=L.ordem.filter(function(e){return !e.impl&&usados.indexOf(e)<0});
 return {sl:sl,dados:L.ordem,A:A,ctes:ct,alvos:alvos,nao:nao,nu:nu,area:last.f.area,simples:alvos.length===1&&alvos[0].passos.length===1};
}

/* ===== apresentacao em LaTeX ===== */
function trimNum(x){return String(Number(x.toPrecision(5)))}
function fmtNum(x){
 if(!isFinite(x))return "?";
 if(x===0)return "0";
 var a=Math.abs(x);
 if(a>=1e6||a<1e-3){
  var e=Math.floor(Math.log10(a)),m=Number((x/Math.pow(10,e)).toPrecision(4));
  if(Math.abs(m)>=10){m=m/10;e++}
  return (m===1?"":m===-1?"-":String(m).replace(".","{,}")+" \\times ")+"10^{"+e+"}";
 }
 return trimNum(x).replace(".","{,}");
}
function aprox(x){return Math.abs(Number(x.toPrecision(5))-x)>1e-9*Math.abs(x)}
function symTex(f,spec){
 var k=chave(spec),i=indice(spec),t=Q[k].tex;
 var multi=f&&f.vars.some(function(s){return chave(s)===k&&indice(s)>0});
 return multi?t+"_{"+(i+1)+"}":t;
}
function valTex(spec,en){
 if(chave(spec)==="ang")return fmtNum(en.v*180/Math.PI)+"^{\\circ}";
 var s=fmtNum(en.v);
 return (en.v<0||/\\times/.test(s))?"("+s+")":s;
}
function rend(tpl,fn){return tpl.replace(/\u27ea([^\u27eb]+)\u27eb/g,function(_,s){return fn(s)})}
function exprTpl(f,K){if(f.mono&&K===f.dir){return f.orig.slice(f.orig.indexOf(" = ")+3)}return f.isol[K].t}
function unRes(k){var u=Q[k].u;return u?"\\ \\mathrm{"+u+"}":""}
function linhaIsol(st){return symTex(st.f,st.K)+" = "+rend(exprTpl(st.f,st.K),function(s){return symTex(st.f,s)})}
function linhaSubst(st){return symTex(st.f,st.K)+" = "+rend(exprTpl(st.f,st.K),function(s){return valTex(s,st.vals[s])}).replace(/\\cdot/g,"\\times")}
function linhaRes(st){return symTex(st.f,st.K)+(aprox(st.v)?" \\approx ":" = ")+fmtNum(st.v)+unRes(chave(st.K))}
function origTex(f){return rend(f.orig,function(s){return symTex(f,s)})}
function valCte(k){return k==="g"?9.8:k==="c"?4186:k==="rho"?1000:Q[k].cte}
function dadoSym(p,en){var l=p.A[en.k]||[],i=l.indexOf(en);return l.length>1?Q[en.k].tex+"_{"+(i+1)+"}":Q[en.k].tex}
function dadoLinha(p,en){
 var u=en.raw?(en.k==="ang"&&/^(deg|[\u00b0\u00ba])$/.test(en.raw)?"^{\\circ}":"\\ "+texUn(en.raw)):"";
 return "$"+dadoSym(p,en)+" = "+fmtNum(en.ov)+u+"$"+(en.impl?" ("+en.impl+")":"");
}
function convLinha(en){
 if(en.impl||!en.un||Q[en.k].keep||en.k==="ang"||en.k==="mu")return "";
 var conv=Math.abs(en.un.f-1)>1e-12||(Q[en.k].abs&&en.un.off);
 return conv?"$"+fmtNum(en.ov)+"\\ "+texUn(en.raw)+" = "+fmtNum(en.v)+unRes(en.k)+"$":"";
}
function nomeAlvo(K){return Q[K].art+" "+Q[K].nome+" $"+Q[K].tex+"$"}
function dadosTexto(p){
 var o="**Primeiro passo: ler os dados.**\n\n"+p.dados.map(function(e){return "- "+dadoLinha(p,e)}).join("\n");
 var cv=p.dados.map(convLinha).filter(Boolean);
 if(cv.length)o+="\n\nConvertendo para o SI: "+cv.join("; ")+".";
 p.ctes.forEach(function(k){o+="\n\nUsei $"+Q[k].tex+" = "+fmtNum(valCte(k))+unRes(k)+"$ ("+NOTA_CTE[k]+")."});
 if(p.nu&&p.nu.length)o+="\n\nNão precisei de "+p.nu.map(function(e){return "$"+dadoSym(p,e)+"$"}).join(", ")+" neste cálculo.";
 o+="\n\n**O que se pede:** "+p.alvos.map(function(a){return nomeAlvo(a.K)}).join("; ")+".";
 return o;
}
function blocoFormula(st,tit){
 var f=st.f,o=tit+" ("+f.nome+").\n\n$$"+origTex(f)+"$$";
 if(st.K!==f.dir)o+="\n\nIsolando $"+symTex(f,st.K)+"$:\n\n$$"+linhaIsol(st)+"$$";
 return o;
}
function corpo(p){
 var o=dadosTexto(p),multi=p.alvos.length>1;
 p.alvos.forEach(function(a,ia){
  var n=a.passos.length,ord=!multi&&n===1;
  if(multi)o+="\n\n**"+String.fromCharCode(97+ia)+") Calcular "+nomeAlvo(a.K)+"**";
  a.passos.forEach(function(st,i){
   var fin=i===n-1;
   if(!fin){
    o+="\n\n"+blocoFormula(st,"**Passo intermédio: calcular $"+symTex(st.f,st.K)+"$**")+"\n\n$$"+linhaSubst(st)+(aprox(st.v)?" \\approx ":" = ")+fmtNum(st.v)+unRes(chave(st.K))+"$$";
    return;
   }
   o+="\n\n"+blocoFormula(st,ord?"**Segundo passo: escolher a fórmula**":"**Fórmula**");
   o+="\n\n"+(ord?"**Terceiro passo: substituir os valores.**":"**Substituindo:**")+"\n\n$$"+linhaSubst(st)+"$$";
   o+="\n\n"+(ord?"**Quarto passo: calcular.**":"**Calculando:**")+"\n\n$$"+linhaRes(st)+"$$";
   o+="\n\n**Resultado:** $"+linhaRes(st)+"$";
   if(a.em){var ev=(st.v-(Q[a.K].abs?a.em.un.off:0))/a.em.un.f;o+="\n\nEm $"+texUn(a.em.raw)+"$: $"+symTex(st.f,st.K)+(aprox(ev)?" \\approx ":" = ")+fmtNum(ev)+"\\ "+texUn(a.em.raw)+"$ (porque $1\\ "+texUn(a.em.raw)+" = "+fmtNum(a.em.un.f)+unRes(a.K)+"$)."}
  });
 });
 if(p.nao.length)o+="\n\nNão consegui calcular "+p.nao.map(function(k){return "$"+Q[k].tex+"$"}).join(", ")+" com estes dados.";
 return o;
}

/* ===== testes por dois caminhos ===== */
var NU=["kg","m","s","A","K","mol"];
function dimTex(v){var a=[];v.forEach(function(e,i){if(e!==0)a.push("\\mathrm{"+NU[i]+"}"+(e===1?"":"^{"+e+"}"))});return a.length?a.join("\\cdot "):"1"}
function testeUnid(st){
 var f=st.f,K=st.K,k=chave(K),q=Q[k],ok,txt;
 if(f.mono){
  var ej=f.E[K],s=Z;
  f.vars.forEach(function(sp){if(sp!==K)s=dAdd(s,Q[chave(sp)].dim,-f.E[sp]/ej)});
  ok=dEq(s,q.dim);
  txt="As unidades que a fórmula dá a $"+symTex(f,K)+"$ são $"+dimTex(s)+(q.u?" = \\mathrm{"+q.u+"}":"")+"$"+(ok?" $\\checkmark$.":", mas $"+symTex(f,K)+"$ devia ter outras unidades (falhou).");
 }else{
  var ds=f.terms.map(function(tm){var s=Z;tm.forEach(function(t){s=dAdd(s,Q[chave(t[0])].dim,t[1])});return s});
  ok=ds.every(function(d){return dEq(d,ds[0])});
  txt="Todos os termos da fórmula têm as mesmas unidades, $"+dimTex(ds[0])+"$"+(ok?", por isso a fórmula é coerente e $"+symTex(f,K)+"$ sai em $"+(q.u?"\\mathrm{"+q.u+"}":"1")+"$ $\\checkmark$.":", mas não são todas iguais (falhou).");
 }
 return {ok:ok,txt:txt};
}
function testeReal(st){
 var f=st.f,K=st.K,cand=null,i;
 for(i=0;i<f.vars.length&&!cand;i++){var s=f.vars[i];if(s===K)continue;var e=st.vals[s];if(e&&e.src==="dado"&&f.isol[s])cand=s}
 if(!cand)return null;
 var v2=nums(st.vals);v2[K]=st.v;
 var r2;try{r2=f.isol[cand].f(v2)}catch(e){return null}
 var en=st.vals[cand],ok=isFinite(r2)&&Math.abs(r2-en.v)<=1e-6*(Math.abs(en.v)+Math.abs(r2))+1e-12;
 var vals2={};for(var z in st.vals)vals2[z]=st.vals[z];vals2[K]={k:chave(K),v:st.v};
 var rhs=rend(f.isol[cand].t,function(x){return valTex(x,vals2[x])}).replace(/\\cdot/g,"\\times");
 var line=symTex(f,cand)+" = "+rhs+(aprox(r2)?" \\approx ":" = ")+fmtNum(r2)+unRes(chave(cand));
 var txt="Com $"+linhaRes(st)+"$, recalculo o dado $"+symTex(f,cand)+"$ pela mesma fórmula:\n\n$$"+line+(ok?"\\ \\checkmark":"\\ \\text{(falhou)}")+"$$\n\n"+(ok?"É o valor que vinha no enunciado.":"Não é o valor do enunciado ("+fmtNum(en.v).replace(/\{,\}/g,",")+").");
 return {ok:ok,txt:txt,sym:Q[chave(cand)].p,res:Q[chave(K)].p};
}
function testes(p){
 try{
  var multi=p.alvos.length>1,ok=true,t1="**Teste 1: unidades (análise dimensional)**\n\n",t2="",r2=null;
  p.alvos.forEach(function(a){
   var st=a.passos[a.passos.length-1],u=testeUnid(st);if(!u.ok)ok=false;
   t1+=(multi?"Para $"+Q[a.K].tex+"$: ":"")+u.txt+"\n\n";
   var r=testeReal(st);if(r){if(!r.ok)ok=false;if(!r2){r2=r;t2="**Teste 2: prova real (recalcular um dado)**\n\n"}t2+=(multi?"Para $"+Q[a.K].tex+"$: ":"")+r.txt+"\n\n"}
  });
  var fim=ok?"Os testes deram o mesmo resultado que a fórmula, por isso a resposta está **correta** e podes usá-la com confiança.":"Algum teste não bateu, por isso **não te aconselho a usar esta resposta**.";
  var meio=t2?"conferir as unidades do resultado e recalcular um dos dados a partir dele":"conferir as unidades do resultado";
  var antes="Antes de te responder, deixa-me testar o resultado por dois caminhos diferentes: "+meio+".\n\n"+(ok?"Bom, os testes passaram e deram o mesmo resultado. Vou então mostrar-te os passos.":"Hmm, os testes não deram o mesmo resultado, por isso não te aconselho a usar esta resposta. Mesmo assim, aqui estão os passos para veres onde pode estar a diferença.")+"\n\n";
  var et=["A testar o resultado por dois caminhos","Teste 1: a conferir as unidades do resultado (análise dimensional)"];
  if(t2)et.push("Teste 2: a recalcular "+r2.sym+" a partir de "+r2.res+" (prova real)");
  et.push(ok?"Os testes passaram e deram o mesmo resultado":"Os testes não bateram: não recomendo esta resposta","A preparar a resposta com os cálculos");
  return {ok:ok,etapas:et,antes:antes,depois:"**Sobre os testes**\n\n"+t1+t2+fim};
 }catch(e){return null}
}
/* Lume X: autocritica do enunciado e do resultado */
function revisaoX(p){
 var al=[],NN={m:1,t:1,r:1,Per:1,Vol:1,A:1,k:1,rho:1,c:1,f:1,Fa:1,Fn:1};
 function nm(k){return Q[k]?Q[k].nome:k}
 if(p.nao&&p.nao.length)al.push("não consegui calcular "+p.nao.map(nm).join(", ")+": faltam dados no enunciado");
 if(p.nu&&p.nu.length){var u=p.nu.map(function(e){return Q[e.k]?nm(e.k):null}).filter(Boolean);if(u.length)al.push("dados que não usei: "+u.join(", ")+" (sobram no enunciado ou falta uma relação)")}
 p.alvos.forEach(function(a){var v=a.v,n=nm(a.K);
  if(!isFinite(v))al.push(n+" deu um valor indefinido");
  else if(NN[a.K]&&v<0)al.push(n+" deu negativo ("+v+"): isso não faz sentido físico, confere os dados");
  else if((a.K==="v"||a.K==="v0")&&Math.abs(v)>2.998e8)al.push("a "+n+" passa a velocidade da luz: resultado impossível");
  else if(a.K==="mu"&&v>1.5)al.push("coeficiente de atrito muito alto ("+v+"): confere os dados");
  else if(a.K==="Tk"&&v<0)al.push("temperatura abaixo do zero absoluto")});
 return "**Revisão do Lume X**\n\n- **Verifiquei:** substituí os valores, conferi as unidades e testei o resultado.\n- **Crítica ao meu trabalho:** "+(al.length?al.join("; ")+".":"não encontrei problemas no enunciado nem no resultado.")
}
function solucao(p){
 var t=testes(p),c=corpo(p),x="";
 try{if(window.lumeModeloAtual&&window.lumeModeloAtual()==="x")x="\n\n"+revisaoX(p)}catch(e){}
 return {texto:(t?t.antes+c+"\n\n"+t.depois:c)+x,etapas:t?t.etapas:[]};
}

/* ===== sondagem e passo a passo ===== */
function oferta(p){
 var al=p.alvos.map(function(a){return '<span class="lume-math" data-tex="'+esc(Q[a.K].tex)+'">'+esc(Q[a.K].p)+'</span>'}).join(", ");
 var html='<div class="ask-intro"><b>Boa!</b> Este é um exercício de Física ('+esc(p.area)+'): vamos calcular '+al+'.<br>Como preferes resolver este exercício?</div><div class="ask-opcoes"><div class="ask-opcao" role="button" data-botql-ask="Resolver juntos, passo a passo">Resolver juntos, passo a passo</div><div class="ask-opcao" role="button" data-botql-ask="O Lume resolve sozinho">O Lume resolve sozinho</div></div>';
 return {html:html,rac:"Reconheci um exercício de Física ("+p.area+") e fiz uma sondagem: resolver juntos ou eu resolver sozinho."};
}
function asc(s){return nz(s).toLowerCase().replace(/[\u2080-\u2089]/g,function(d){return String(d.charCodeAt(0)-0x2080)}).replace(/[^a-z0-9]/g,"")}
function lerNumero(txt,dim,abs){
 var s0=palavrasUnidades(nz(txt)),M=medidas(s0);
 if(!M.length)return null;
 var m=M[0];
 if(m.un){if(!dEq(m.un.d,dim))return {erroUn:true};return {v:abs&&m.un.off?m.v+m.un.off:m.v*m.un.f}}
 return {v:m.v};
}
function responder(T,txt,ctx){
 var p=T.fis,n=nz(txt).toLowerCase().replace(/[^a-z0-9=,.\-+*\/^ ]/g," ").replace(/\s+/g," ").trim(),palavras=n?n.split(" ").length:0;
 function fim(pref){var s=solucao(p);ctx.fim();return {texto:pref+"\n\n"+s.texto,rac:"Resolvi sozinho, com os mesmos passos e sem perguntas.",etapas:s.etapas}}
 if(/^(sair|cancelar|cancela|parar|para|esquece|esquece isso|deixa|deixa estar|chega|nao quero continuar)$/.test(n)){ctx.fim();return {texto:"Combinado, ficamos por aqui. Quando quiseres, escreve outro exercício."}}
 if(/^(resolve tu|resolve|resolve por mim|faz tu|mostra tudo|mostra a solucao|mostra a resolucao|diz a solucao|diz a resposta|resolve tudo)$/.test(n))return fim("Está bem, resolvo eu, com os mesmos passos.");
 var np=null;try{np=analisar(txt)}catch(e){}
 if(np){ctx.fim();return null}
 var naoSei=/^(nao sei|sei la|nao me lembro|nao lembro|ajuda|ajuda me|dica|nao faco ideia|nao consigo)$/.test(n);
 var al=p.alvos[0],st=al.passos[al.passos.length-1],f=st.f,K=al.K;
 if(T.etapa==="oferta"){
  if(/^(sim|s|claro|bora|vamos|ok|pode ser|quero|vamos la|vamos sim|bora la|vamos a isso|sim vamos|sim quero|ya|yes|resolver juntos|resolver juntos,? passo a passo|juntos|passo a passo|resolvemos juntos)$/.test(n)){
   if(!p.simples)return fim("Este exercício tem mais do que um cálculo, por isso resolvo-o eu, passo a passo e com os testes.");
   T.etapa="formula";T.erros=0;
   var lista=f.vars.filter(function(s){return Q[chave(s)].cte==null&&chave(s)!=="g"}).map(function(s){return "$"+symTex(f,s)+"$"}).join(", ");
   return {texto:dadosTexto(p)+"\n\n**Segundo passo: a fórmula.** Que fórmula liga "+lista+"? Escreve-a (por exemplo, $x = y \\cdot z$), ou diz «não sei» e eu mostro.",rac:"Passo 1: os dados e o que se pede."};
  }
  if(/^(nao|n|agora nao|nao quero|nao obrigado|diretamente|direto|o lume resolve sozinho|lume resolve sozinho|resolve sozinho|sozinho|resolve tu sozinho)$/.test(n))return fim("Está bem, resolvo eu, com os mesmos passos.");
  if(palavras>=3){ctx.fim();return null}
  return {texto:"Escolhe: **resolver juntos** ou **o Lume resolve sozinho**."};
 }
 if(T.etapa==="formula"){
  var need=f.vars.filter(function(s){return Q[chave(s)].cte==null&&chave(s)!=="g"}).map(function(s){return asc(Q[chave(s)].p)}),a=n.replace(/ /g,"");
  var ok=!naoSei&&/=/.test(a)&&need.every(function(x){return a.indexOf(x)>=0});
  if(!ok&&!naoSei&&T.erros<1){
   if(palavras>=8){ctx.fim();return null}
   T.erros++;
   return {texto:"Quase. A fórmula tem de ligar "+f.vars.filter(function(s){return Q[chave(s)].cte==null&&chave(s)!=="g"}).map(function(s){return "$"+symTex(f,s)+"$"}).join(", ")+", com um sinal de igual. Tenta outra vez, ou diz «não sei»."};
  }
  T.etapa="valor";T.erros=0;
  var pref=ok?"**Exatamente!** É essa a fórmula.":"Sem problema, a fórmula é esta.";
  return {texto:pref+"\n\n"+blocoFormula(st,"**Segundo passo: escolher a fórmula**")+"\n\n**Terceiro passo: substituir os valores.**\n\n$$"+linhaSubst(st)+"$$\n\nQual é o valor de $"+symTex(f,K)+"$? Escreve só o número (com a unidade, se quiseres).",rac:"Passo 2 e 3: a fórmula e a substituição."};
 }
 if(T.etapa==="valor"){
  if(naoSei)return fim("Sem problema, resolvo eu o resto, com os mesmos passos.");
  var got=lerNumero(txt,Q[chave(K)].dim,Q[chave(K)].abs);
  if(got===null){
   if(palavras>=6){ctx.fim();return null}
   return {texto:"Escreve só o valor numérico de $"+symTex(f,K)+"$ (com a unidade, se quiseres)."};
  }
  if(got.erroUn)return {texto:"A unidade não parece certa: $"+symTex(f,K)+"$ mede-se em $"+(Q[chave(K)].u?"\\mathrm{"+Q[chave(K)].u+"}":"1")+"$. Tenta outra vez."};
  if(Math.abs(got.v-al.v)<=Math.max(0.01*Math.abs(al.v),1e-9)){
   var tt=testes(p);ctx.fim();
   return {texto:"**Exatamente!** $"+linhaRes(st)+"$.\n\n**Resultado:** $"+linhaRes(st)+"$"+(tt?"\n\n"+tt.depois:""),rac:"Passo final: o valor certo.",etapas:tt?tt.etapas:null};
  }
  if(T.erros<1){
   T.erros++;
   return {texto:"Ainda não. Faz a conta da substituição com calma:\n\n$$"+linhaSubst(st)+"$$\n\nConfere também a unidade ("+(Q[chave(K)].u?"$\\mathrm{"+Q[chave(K)].u+"}$":"sem unidade")+"). Tenta outra vez."};
  }
  return fim("Sem problema, resolvo eu, com os mesmos passos.");
 }
 return null;
}
/* ===== problemas em etapas (plano com atrito + rampa), por energia e testados pela cinematica ===== */
function cenario(q){
 var t=nz(String(q||"")).toLowerCase().replace(/\u00b0/g," graus ").replace(/(\d),(\d)/g,"$1.$2");
 if(t.length>900||!/\b(rampa|plano inclinado)\b/.test(t))return null;
 function num(re){var m=re.exec(t);return m?parseFloat(m[1]):null}
 var G=num(/\bg\s*(?:=|\u2248|~|como|igual a)\s*(\d+(?:\.\d+)?)/)||num(/gravidade\s*(?:=|\u2248|~|de|como|igual a|vale)?\s*(\d+(?:\.\d+)?)\s*m/)||9.8,
  m=num(/(\d+(?:\.\d+)?)\s*kg/),
  v0=num(/(\d+(?:\.\d+)?)\s*m\s*\/\s*s/),
  ang=num(/(\d+(?:\.\d+)?)\s*(?:graus|grau)\b/),
  mu=num(/(?:coeficiente de atrito[^=\d]{0,25}|\bmu\s*)=?\s*(\d+(?:\.\d+)?)/),
  d=num(/(?:anda|percorre|desliza|desloca-?se|avanca|caminha)\s+(\d+(?:\.\d+)?)\s*m\b(?!\s*\/)/);
 if(d==null)d=num(/(\d+(?:\.\d+)?)\s*m\b(?!\s*\/)(?=[^.]{0,30}(?:com atrito|de atrito))/);
 if(v0==null||ang==null||ang<=0||ang>=90)return null;
 var temAtr=/com atrito/.test(t.split(/rampa|plano inclinado/)[0]),mu1=temAtr&&mu!=null?mu:0,
  mu2=/rampa[^.]{0,30}com atrito/.test(t)&&mu!=null&&!temAtr?mu:0;
 if(temAtr&&(mu==null||d==null))return null;
 var th=ang*Math.PI/180,sn=Math.sin(th),cs=Math.cos(th),
  F=function(x){return fmtNum(x)},
  v1sq=v0*v0-2*mu1*G*(d||0);
 var L=[],E=[];
 var dados="**Primeiro passo: os dados.**\n\n$$"+(m!=null?"m = "+F(m)+"\\,\\mathrm{kg},\\quad ":"")+"v_0 = "+F(v0)+"\\,\\mathrm{m/s},\\quad g = "+F(G)+"\\,\\mathrm{m/s^2}"+(temAtr?",\\quad \\mu = "+F(mu)+",\\quad d = "+F(d)+"\\,\\mathrm{m}":"")+",\\quad \\theta = "+F(ang)+"^\\circ$$";
 L.push(dados);
 if(G===9.8&&!/\bg\s*(=|como|igual)/.test(t))L.push("Usei $g = 9{,}8\\,\\mathrm{m/s^2}$ (valor da Terra). Se o teu exercício usa $g = 10\\,\\mathrm{m/s^2}$, escreve-o no enunciado e eu uso esse.");
 var v1=v0;
 if(temAtr){
  if(v1sq<=0){
   var dp=v0*v0/(2*mu1*G);
   L.push("**Depois: o atrito no plano.** O atrito faz perder energia:\n\n$$\\tfrac12 m v_0^2 = \\mu\\, m\\, g\\, d_{\\text{máx}} \\Rightarrow d_{\\text{máx}} = \\frac{v_0^2}{2\\mu g} = "+F(dp)+"\\,\\mathrm{m}$$\n\nComo $"+F(dp)+" < "+F(d)+"$, o corpo **para antes** de chegar à rampa: não há subida.");
   return {texto:L.join("\n\n"),etapas:["Li o problema como um plano com atrito seguido de rampa e apliquei o teorema do trabalho e energia no plano; o corpo para antes da rampa."]};
  }
  v1=Math.sqrt(v1sq);
  L.push("**Depois: o atrito no plano (trabalho e energia).** O trabalho do atrito é $W = -\\mu\\, m\\, g\\, d$, e igual à variação da energia cinética:\n\n$$\\tfrac12 m v^2 - \\tfrac12 m v_0^2 = -\\mu\\, m\\, g\\, d \\;\\Rightarrow\\; v = \\sqrt{v_0^2 - 2\\mu g d}$$\n\n$$v = \\sqrt{"+F(v0)+"^2 - 2\\times "+F(mu)+"\\times "+F(G)+"\\times "+F(d)+"} = \\sqrt{"+F(v1sq)+"} = "+F(v1)+"\\,\\mathrm{m/s}$$\n\nA massa corta-se, por isso não influencia.");
 }
 var a2=G*(sn+mu2*cs),s=v1*v1/(2*a2),h=s*sn;
 L.push("**Por fim: a rampa"+(mu2?" (com atrito)":" sem atrito")+".** "+(mu2?"Na subida, o peso e o atrito travam o corpo: $\\tfrac12 m v^2 = m g h + \\mu\\, m\\, g \\cos\\theta\\,\\dfrac{h}{\\sin\\theta}$, logo $h = \\dfrac{v^2}{2g\\,(1+\\mu\\cot\\theta)}$.":"Só o peso realiza trabalho, por isso a energia mecânica conserva-se: $\\tfrac12 m v^2 = m g h$, logo $h = \\dfrac{v^2}{2g}$.")+"\n\n$$h = "+(mu2?"\\frac{"+F(v1)+"^2}{2\\times "+F(G)+"\\times (1+"+F(mu2)+"\\cot "+F(ang)+"^\\circ)}":"\\frac{"+F(v1)+"^2}{2\\times "+F(G)+"}")+" = "+F(h)+"\\,\\mathrm{m}$$\n\nO corpo percorre na rampa $s = h/\\sin\\theta = "+F(s)+"\\,\\mathrm{m}$.");
 /* respostas pedidas */
 var qs=[],ps=String(q).split(/(?:^|\n|\s)\*?([a-d])\)\*?/i);
 if(ps.length>1)for(var i=1;i<ps.length;i+=2)qs.push(nz(ps[i+1]||"").toLowerCase());
 var resp=[];
 function a(txt){resp.push(txt)}
 qs.forEach(function(x,i){
  var l="**"+String.fromCharCode(97+i)+")** ";
  if(/altura/.test(x))a(l+"A altura máxima é $h = "+F(h)+"\\,\\mathrm{m}$.");
  else if(/distancia|quanto sobe|comprimento/.test(x)&&/rampa/.test(x))a(l+"Sobe $"+F(s)+"\\,\\mathrm{m}$ ao longo da rampa.");
  else if(/trabalho|energia (dissipada|perdida)/.test(x)&&temAtr)a(l+"O trabalho do atrito é $W = -\\mu m g d = "+(m!=null?F(-mu1*m*G*d)+"\\,\\mathrm{J}$.":"-\\mu m g d$ (precisa da massa)."));
  else if(/velocidade/.test(x))a(l+"A velocidade depois do plano é $v = "+F(v1)+"\\,\\mathrm{m/s}$.");
  else if(/tempo/.test(x)){var t1=temAtr?(v0-v1)/(mu1*G):0,t2=v1/a2;a(l+"Tempo no plano $"+F(t1)+"\\,\\mathrm{s}$, na subida $"+F(t2)+"\\,\\mathrm{s}$; total $"+F(t1+t2)+"\\,\\mathrm{s}$.")}
 });
 if(!resp.length)a("**Resultado:** velocidade no fim do plano $v = "+F(v1)+"\\,\\mathrm{m/s}$ e altura máxima $h = "+F(h)+"\\,\\mathrm{m}$.");
 /* testes por outro caminho: cinematica */
 var ok=true,T1="",T2="";
 if(temAtr){var a1=-mu1*G,vk=Math.sqrt(v0*v0+2*a1*d);ok=ok&&Math.abs(vk-v1)<1e-9*Math.max(1,v1);
  T1="**Teste 1: cinemática no plano**\n\nA desaceleração do atrito é $a = -\\mu g = "+F(a1)+"\\,\\mathrm{m/s^2}$, e $v^2 = v_0^2 + 2ad$ dá $v = "+F(vk)+"\\,\\mathrm{m/s}$, igual ao valor por energia "+(Math.abs(vk-v1)<1e-9*Math.max(1,v1)?"✓":"✗")+"."}
 var sk=v1*v1/(2*a2),hk=sk*sn,ok2=Math.abs(hk-h)<1e-9*Math.max(1,h);ok=ok&&ok2;
 T2="**Teste "+(temAtr?"2":"1")+": cinemática na rampa**\n\nNa subida a desaceleração é $a = g(\\sin\\theta"+(mu2?"+\\mu\\cos\\theta":"")+") = "+F(a2)+"\\,\\mathrm{m/s^2}$. Para parar: $s = \\dfrac{v^2}{2a} = "+F(sk)+"\\,\\mathrm{m}$ e $h = s\\sin\\theta = "+F(hk)+"\\,\\mathrm{m}$, igual ao valor por energia "+(ok2?"✓":"✗")+".";
 var T3="";
 if(!mu2){var ec=0.5*v1*v1,ep=G*h;var ok3=Math.abs(ec-ep)<1e-9*Math.max(1,ec);ok=ok&&ok3;T3="\n\n**Teste "+(temAtr?"3":"2")+": energia por unidade de massa**\n\nEm cima, toda a energia cinética virou potencial: $\\tfrac12 v^2 = "+F(ec)+"\\,\\mathrm{J/kg}$ e $g h = "+F(ep)+"\\,\\mathrm{J/kg}$ "+(ok3?"✓":"✗")+"."}
 var nT=temAtr?(mu2?2:3):(mu2?1:2);
 var tex="**Sobre os testes**\n\n"+(T1?T1+"\n\n":"")+T2+T3+"\n\n"+(ok?(nT===1?"O teste dá":"Os "+nT+" testes dão")+" o mesmo resultado que o método da energia, por isso a resposta está **correta**.":"Os testes não coincidem, por isso revê os dados.");
 var etapas=["Li o problema como um plano com atrito seguido de uma rampa e identifiquei dados e perguntas.","Resolvi pelo teorema do trabalho e energia (plano) e conservação da energia (rampa)."];
 if(T1)etapas.push("Teste 1: cinemática no plano, com a=-μg e v²=v0²+2ad.");
 etapas.push("Teste "+(temAtr?"2":"1")+": cinemática na rampa, com s=v²/2a e h=s·senθ.");
 return {texto:L.join("\n\n")+"\n\n"+resp.join("\n\n")+"\n\n"+tex,etapas:etapas,resumo:resp.join("\n\n"),esboco:esbocoPlanoRampa({m:m,v0:v0,ang:ang,mu:temAtr?mu:null,mu2:mu2,d:d})};
}
/* ===== esbocos do enunciado (SVG direto no chat) ===== */
function sx(n){return String(Number(Number(n).toPrecision(4))).replace(".",",")}
function sesc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function stx(x,y,t,o){o=o||{};return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" font-size="'+(o.s||11)+'" fill="'+(o.c||"currentColor")+'" text-anchor="'+(o.a||"middle")+'"'+(o.b?' font-weight="bold"':'')+'>'+sesc(t)+'</text>'}
function sln(x1,y1,x2,y2,o){o=o||{};return '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" stroke="'+(o.c||"currentColor")+'" stroke-width="'+(o.w||1.5)+'"'+(o.d?' stroke-dasharray="'+o.d+'"':'')+'/>'}
function sseta(x1,y1,x2,y2,c){
 var a=Math.atan2(y2-y1,x2-x1),L=7,w=3.2,bx=x2-L*Math.cos(a),by=y2-L*Math.sin(a);
 return sln(x1,y1,bx,by,{c:c,w:2})+'<polygon points="'+x2.toFixed(1)+','+y2.toFixed(1)+' '+(bx+w*Math.sin(a)).toFixed(1)+','+(by-w*Math.cos(a)).toFixed(1)+' '+(bx-w*Math.sin(a)).toFixed(1)+','+(by+w*Math.cos(a)).toFixed(1)+'" fill="'+(c||"currentColor")+'"/>';
}
function svgEnv(vb,corpo,desc){return '<svg viewBox="'+vb+'" style="width:100%;max-width:460px;height:auto;display:block" role="img" aria-label="'+sesc(desc)+'" fill="none">'+corpo+'</svg>'}
function esbocoPlanoRampa(o){
 var y0=150,xp=24,xr=200,th=o.ang*Math.PI/180,Lr=Math.min(140,115/Math.sin(th)),tx=xr+Lr*Math.cos(th),ty=y0-Lr*Math.sin(th),B="#1f6feb",R="#d1481f",G="#2e8b57",s="";
 s+=sln(xp,y0,xr,y0,{w:2.5})+sln(xr,y0,tx,ty,{w:2.5})+sln(tx,ty,tx,y0,{d:"4 3",w:1,c:G})+sln(xr,y0,tx+10,y0,{w:1,d:"2 3"});
 for(var i=xp+6;i<xr-4;i+=9)s+=sln(i,y0+1,i-6,y0+8,{w:1,c:R});
 s+=stx((xp+xr)/2+14,y0+22,o.mu!=null?"atrito  μ = "+sx(o.mu):"plano",{c:R,s:11});
 s+='<rect x="'+(xp+16)+'" y="'+(y0-22)+'" width="30" height="22" rx="2" fill="'+B+'" fill-opacity="0.25" stroke="'+B+'" stroke-width="1.8"/>';
 s+=stx(xp+31,y0-7,o.m!=null?sx(o.m)+" kg":"m",{s:10});
 s+=sseta(xp+50,y0-11,xp+92,y0-11,B)+stx(xp+72,y0-30,"v₀ = "+sx(o.v0)+" m/s",{c:B,b:1});
 if(o.d!=null){var yd=y0+36;s+=sln(xp+46,yd,xr,yd,{w:1})+sln(xp+46,yd-4,xp+46,yd+4,{w:1})+sln(xr,yd-4,xr,yd+4,{w:1})+stx((xp+46+xr)/2,yd+14,"d = "+sx(o.d)+" m")}
 var r=30;s+='<path d="M '+(xr+r)+' '+y0+' A '+r+' '+r+' 0 0 0 '+(xr+r*Math.cos(th)).toFixed(1)+' '+(y0-r*Math.sin(th)).toFixed(1)+'" stroke="'+G+'" stroke-width="1.6"/>';
 s+=stx(xr+r+22,y0-6,"θ = "+sx(o.ang)+"°",{c:G,b:1,a:"start",s:11});
 s+=stx(xr-34,y0-34,"v₁ = ?",{c:R,b:1})+sseta(xr-52,y0-24,xr-6,y0-24,R);
 s+=stx(tx+8,(ty+y0)/2,"h = ?",{c:R,b:1,a:"start"});
 s+=stx((xr+tx)/2-12,(y0+ty)/2-14,o.mu2?"rampa com atrito":"rampa sem atrito",{s:10,a:"end"});
 return svgEnv("0 0 360 205",s,"Esboço do enunciado: corpo com velocidade inicial num plano com atrito, seguido de uma rampa de "+sx(o.ang)+" graus");
}
function esbocoQueda(o){
 var s="",B="#1f6feb",R="#d1481f",y0=185,yb=38;
 s+=sln(40,y0,200,y0,{w:2.5});for(var i=44;i<196;i+=10)s+=sln(i,y0+1,i-6,y0+8,{w:1,c:R});
 s+='<circle cx="120" cy="'+yb+'" r="10" fill="'+B+'" fill-opacity="0.3" stroke="'+B+'" stroke-width="1.8"/>';
 s+=sseta(120,yb+14,120,y0-14,B)+stx(132,(yb+y0)/2,"g"+(o.g!=null?" = "+sx(o.g)+" m/s²":""),{c:B,b:1,a:"start"});
 s+=sln(70,yb,70,y0,{w:1})+sln(64,yb,76,yb,{w:1})+sln(64,y0,76,y0,{w:1})+stx(66,(yb+y0)/2,o.h!=null?"h = "+sx(o.h)+" m":"h",{a:"end"});
 s+=stx(120,yb-16,"v₀ = "+sx(o.v0||0)+" m/s",{b:1});
 if(o.alvos&&o.alvos.length)s+=stx(120,y0+24,o.alvos.join(",  ")+"  = ?",{c:R,b:1});
 return svgEnv("0 0 250 215",s,"Esboço do enunciado: corpo em queda livre desde uma altura");
}
function eLab(p,k,simb,un){
 var A=p.A||{},al=p.alvos.map(function(a){return a.K});
 if(A[k]&&A[k][0])return simb+" = "+sx(k==="ang"?(A[k][0].ov!=null?A[k][0].ov:A[k][0].v):A[k][0].v)+(un?" "+un:"");
 if(al.indexOf(k)>=0)return simb+" = ?";
 return null;
}
function eFundo(){return '<rect x="0" y="0" width="1" height="1" fill="none"/>'}
function esbocoRetilineo(p){
 var B="#1f6feb",R="#d1481f",G="#2e8b57",s="",y0=120;
 s+=sln(14,y0,346,y0,{w:2.5});for(var i=18;i<340;i+=10)s+=sln(i,y0+1,i-6,y0+7,{w:1,c:R});
 function car(x,fa,c){var st=fa?' stroke-dasharray="4 3"':'';return '<rect x="'+x+'" y="'+(y0-26)+'" width="46" height="18" rx="3" fill="'+c+'" fill-opacity="'+(fa?0.08:0.28)+'" stroke="'+c+'" stroke-width="1.8"'+st+'/><circle cx="'+(x+11)+'" cy="'+(y0-6)+'" r="6" fill="none" stroke="'+c+'" stroke-width="1.6"/><circle cx="'+(x+35)+'" cy="'+(y0-6)+'" r="6" fill="none" stroke="'+c+'" stroke-width="1.6"/>'}
 s+=car(40,false,B)+car(262,true,B);
 var v0=eLab(p,"v0","v₀","m/s"),v=eLab(p,"v","v","m/s"),a=eLab(p,"a","a","m/s²"),t=eLab(p,"t","t","s"),d=eLab(p,"d","d","m");
 if(v0){s+=sseta(90,y0-17,140,y0-17,B)+stx(115,y0-40,v0,{c:B,b:1})}
 if(v){s+=sseta(312,y0-17,340,y0-17,B)+stx(300,y0-40,v,{c:B,b:1})}
 if(d){var yd=y0+34;s+=sln(63,yd,285,yd,{w:1})+sln(63,yd-4,63,yd+4,{w:1})+sln(285,yd-4,285,yd+4,{w:1})+stx(174,yd+15,d)}
 var top=[a,t].filter(Boolean).join("      ");if(top)s+=stx(180,40,top,{c:R,b:1,s:12});
 return svgEnv("0 0 360 180",s,"Esboço do enunciado: corpo em movimento retilíneo com velocidades e distância");
}
function esbocoForcas(p){
 var B="#1f6feb",R="#d1481f",G="#2e8b57",s="",sl=p.sl||"",inc=/inclinad|rampa/.test(sl),A=p.A||{};
 var Fl=eLab(p,"F","F","N"),Fa=eLab(p,"Fa","Fₐ","N"),Fn=eLab(p,"Fn","N","N"),Pp=eLab(p,"Pp","P","N"),m=eLab(p,"m","m","kg"),mu=eLab(p,"mu","μ",""),a=eLab(p,"a","a","m/s²");
 if(inc&&A.ang&&A.ang[0]){
  var angG=A.ang[0].ov!=null?A.ang[0].ov:A.ang[0].v,th=angG*Math.PI/180,x0=30,y0=150,L=250,xe=x0+L*Math.cos(th),ye=y0-L*Math.sin(th);
  if(ye<20){L=130/Math.sin(th);xe=x0+L*Math.cos(th);ye=y0-L*Math.sin(th)}
  s+=sln(x0,y0,xe,y0,{w:1.5})+sln(x0,y0,xe,ye,{w:2.5})+sln(xe,ye,xe,y0,{w:1.5});
  var u=Math.cos(th),w=-Math.sin(th),nx=Math.sin(th),ny=Math.cos(th)*-1*-1,t=0.55,cx=x0+(xe-x0)*t,cy=y0+(ye-y0)*t;
  var bw=40,bh=26,bxc=cx+nx*-0,byc=cy;
  var ox=cx-Math.sin(th)*bh/2*-1,oy=cy-Math.cos(th)*bh/2;
  s+='<g transform="translate('+(cx-Math.sin(th)*bh/2).toFixed(1)+' '+(cy-Math.cos(th)*bh/2).toFixed(1)+') rotate('+(-th*180/Math.PI).toFixed(1)+')"><rect x="'+(-bw/2)+'" y="'+(-bh/2)+'" width="'+bw+'" height="'+bh+'" fill="'+B+'" fill-opacity="0.25" stroke="'+B+'" stroke-width="1.8"/></g>';
  var gx=cx-Math.sin(th)*bh/2,gy=cy-Math.cos(th)*bh/2;
  s+=sseta(gx,gy,gx,gy+55,R)+stx(gx+6,gy+58,Pp||"P",{c:R,b:1,a:"start"});
  s+=sseta(gx,gy,gx-Math.sin(th)*50,gy-Math.cos(th)*50,G)+stx(gx-Math.sin(th)*50-6,gy-Math.cos(th)*50,Fn||"N",{c:G,b:1,a:"end"});
  if(Fa||mu){s+=sseta(gx,gy,gx+Math.cos(th)*48,gy-Math.sin(th)*48,B)+stx(gx+Math.cos(th)*48+6,gy-Math.sin(th)*48-4,Fa||"Fₐ",{c:B,b:1,a:"start"})}
  var r=34;s+='<path d="M '+(x0+r)+' '+y0+' A '+r+' '+r+' 0 0 0 '+(x0+r*Math.cos(th)).toFixed(1)+' '+(y0-r*Math.sin(th)).toFixed(1)+'" stroke="'+G+'" stroke-width="1.6"/>'+stx(x0+r+22,y0-6,"θ = "+sx(angG)+"°",{c:G,b:1,a:"start"});
  var info=[m,mu,a].filter(Boolean).join("     ");if(info)s+=stx(20,16,info,{s:11,a:"start"});
  return svgEnv("0 0 360 175",s,"Esboço do enunciado: corpo num plano inclinado com as forças");
 }
 var y0=130,cx=180;
 s+=sln(40,y0,320,y0,{w:2.5});if(Fa||mu)for(var i=44;i<316;i+=10)s+=sln(i,y0+1,i-6,y0+8,{w:1,c:R});
 s+='<rect x="'+(cx-34)+'" y="'+(y0-44)+'" width="68" height="44" fill="'+B+'" fill-opacity="0.25" stroke="'+B+'" stroke-width="1.8"/>'+stx(cx,y0-18,m||"m",{s:11});
 if(Fl||/puxa|empurra|forca/.test(sl)){s+=sseta(cx+34,y0-22,cx+98,y0-22,B)+stx(cx+66,y0-30,Fl||"F",{c:B,b:1})}
 if(Fa||mu){s+=sseta(cx-34,y0-10,cx-90,y0-10,R)+stx(cx-62,y0-18,Fa||"Fₐ",{c:R,b:1})}
 s+=sseta(cx,y0-22,cx,y0+40,R)+stx(cx+6,y0+40,Pp||"P",{c:R,b:1,a:"start"});
 if(Fn||/normal|apoio/.test(sl)||Fa||mu)s+=sseta(cx,y0-44,cx,y0-96,G)+stx(cx+6,y0-92,Fn||"N",{c:G,b:1,a:"start"});
 var info=[mu,a].filter(Boolean).join("     ");if(info)s+=stx(cx,18,info,{c:R,b:1,s:12});
 return svgEnv("0 0 360 185",s,"Esboço do enunciado: corpo com as forças aplicadas");
}
function esbocoHidro(p){
 var B="#1f6feb",R="#d1481f",G="#2e8b57",s="",sl=p.sl||"";
 var rho=eLab(p,"rho","ρ","kg/m³")||(/\bagua\b/.test(sl)?"ρ = 1000 kg/m³ (água)":null),h=eLab(p,"h","h","m")||eLab(p,"d","h","m"),pr=eLab(p,"pres","p","Pa"),g=eLab(p,"g","g","m/s²"),Em=eLab(p,"Emp","E","N"),Vv=eLab(p,"Vol","V","m³"),Pp=eLab(p,"Pp","P","N");
 if(/vasos comunicantes|tubo em u|tubo u\b/.test(sl)){
  s+='<path d="M 110 30 L 110 140 Q 110 160 130 160 L 150 160 Q 170 160 170 140 L 170 30 M 210 30 L 210 140 Q 210 160 230 160 L 250 160 Q 270 160 270 140 L 270 30 M 170 140 L 210 140" stroke="currentColor" stroke-width="2.5"/>'.replace("M 170 140 L 210 140","");
  s+='<path d="M 110 80 L 110 140 Q 110 160 130 160 L 250 160 Q 270 160 270 140 L 270 55 L 210 55" fill="'+B+'" fill-opacity="0.25" stroke="none"/>';
  s+=sln(110,80,170,80,{c:B,w:2})+sln(210,55,270,55,{c:B,w:2})+sln(170,160,210,160,{w:1,d:"2 3"});
  s+=sln(88,80,88,160,{w:1})+sln(84,80,92,80,{w:1})+sln(84,160,92,160,{w:1})+stx(82,124,"h₁",{a:"end"});
  s+=sln(292,55,292,160,{w:1})+sln(288,55,296,55,{w:1})+sln(288,160,296,160,{w:1})+stx(300,112,"h₂",{a:"start"});
  var inf=[rho,h,pr].filter(Boolean).join("     ");s+=stx(190,18,inf||"vasos comunicantes",{c:R,b:1,s:11});
  return svgEnv("0 0 360 180",s,"Esboço do enunciado: vasos comunicantes com os níveis do líquido");
 }
 s+='<path d="M 110 30 L 110 150 L 250 150 L 250 30" stroke="currentColor" stroke-width="2.5"/><rect x="111" y="64" width="138" height="85" fill="'+B+'" fill-opacity="0.22"/>'+sln(111,64,249,64,{c:B,w:2});
 if(/empuxo|flutu|submers|arquimedes|impuls/.test(sl)||Em){
  s+='<rect x="158" y="86" width="44" height="34" fill="'+G+'" fill-opacity="0.3" stroke="'+G+'" stroke-width="1.8"/>'+sseta(180,86,180,40,B)+stx(186,50,Em||"E",{c:B,b:1,a:"start"})+sseta(180,120,180,152,R)+stx(186,146,Pp||"P",{c:R,b:1,a:"start"});
  var inf=[rho,Vv].filter(Boolean).join("     ");if(inf)s+=stx(180,18,inf,{c:R,b:1,s:11});
  return svgEnv("0 0 360 175",s,"Esboço do enunciado: corpo mergulhado num líquido com o empuxo e o peso");
 }
 s+=sln(86,64,86,150,{w:1})+sln(82,64,90,64,{w:1})+sln(82,150,90,150,{w:1})+stx(80,110,h||"h",{a:"end"})+'<circle cx="180" cy="148" r="3" fill="'+R+'"/>'+sseta(180,70,180,140,R)+stx(190,108,pr||"p = ?",{c:R,b:1,a:"start"});
 var inf=[rho,g].filter(Boolean).join("     ");if(inf)s+=stx(180,18,inf,{c:R,b:1,s:11});
 return svgEnv("0 0 360 175",s,"Esboço do enunciado: pressão no fundo de um líquido a uma profundidade h");
}
function esbocoGenerico(p){
 var R="#d1481f",s="",A=p.A||{},linhas=[];
 (p.dados||[]).forEach(function(e){if(e.impl||!Q[e.k])return;linhas.push(Q[e.k].p+" = "+sx(e.v)+(Q[e.k].u?" "+Q[e.k].u:""))});
 linhas=linhas.slice(0,6);
 var al=p.alvos.map(function(a){return Q[a.K].p+" = ?"});
 var H=40+linhas.length*17+al.length*17;
 s+='<rect x="30" y="10" width="300" height="'+(H-4)+'" rx="8" stroke="currentColor" stroke-width="1.6" fill="currentColor" fill-opacity="0.04"/>'+stx(48,32,"Dados",{a:"start",b:1,s:12});
 linhas.forEach(function(l,i){s+=stx(60,52+i*17,l,{a:"start"})});
 al.forEach(function(l,i){s+=stx(60,52+linhas.length*17+i*17,l,{a:"start",c:R,b:1})});
 return svgEnv("0 0 360 "+(H+14),s,"Esboço do enunciado: dados conhecidos e incógnitas");
}
function esboco(p){
 try{
  var K=p.alvos.map(function(a){return a.K}),f=p.alvos[0].passos[p.alvos[0].passos.length-1].f,A=p.A||{};
  if(f&&/^queda/.test(f.id)){
   var h=A.h&&A.h[0]?A.h[0].v:(A.d&&A.d[0]?A.d[0].v:null),g=A.g&&A.g[0]?A.g[0].v:null,nm={t:"t",v:"v",h:"h"};
   return {html:esbocoQueda({h:h,g:g,v0:A.v0&&A.v0[0]?A.v0[0].v:0,alvos:K.filter(function(k){return nm[k]}).map(function(k){return nm[k]})})};
  }
  if(f&&/^(mru|mruv_v|mruv_d|torricelli)$/.test(f.id))return {html:esbocoRetilineo(p)};
  if(f&&/^(newton|newton_atrito|atrito|peso)$/.test(f.id))return {html:esbocoForcas(p)};
  if(f&&/^(pres|hidro|empuxo)$/.test(f.id))return {html:esbocoHidro(p)};
  return {html:esbocoGenerico(p)};
 }catch(e){}
 return null;
}
window.LumeFisica={analisar:analisar,cenario:cenario,esboco:esboco,oferta:oferta,solucao:solucao,responder:responder,testes:testes,corpo:corpo};
})();
