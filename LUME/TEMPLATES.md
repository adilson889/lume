# Templates do Lume

Um template é uma resposta do bot que, em vez de texto, entrega uma página ou um pequeno programa. O Lume escolhe o template, preenche os valores do pedido e o chat mostra o resultado já a funcionar.

Existem três tipos de resposta, todos guardados em ficheiros `.txt` da pasta `LUME/bot/`:

| Tipo | Começa por | Onde corre | Para quê |
|---|---|---|---|
| Texto | qualquer texto | no chat | respostas normais |
| XLang | `<program>` | no chat, pelo interpretador HTMLx-lang | contas, cartões, botões simples |
| Página HTML/JS | `<!doctype html>` ou `<html>` | numa iframe isolada | sites, lojas, jogos, ferramentas |

## 1. Formato de uma entrada

Cada entrada tem um número e o conteúdo entre chaves. As chaves têm de estar equilibradas (cada `{` com o seu `}`), o que é normal em CSS e JavaScript.

```
1-{
conteúdo aqui
}

2-{
outro conteúdo
}
```

O número é o que o `main.sql` usa para escolher a entrada: `REPLY (templates.txt, 1)`.

Regras dos ficheiros:
- O nome só tem letras, números e sublinhado (`templates.txt`, `rescalculo.txt`).
- Todo o ficheiro novo tem de estar listado em `LUME/bot/arquivos.json`, senão o chat não o carrega.

## 2. Valores que o chat preenche

### Em páginas HTML/JS (interpolação com chavetas duplas)

| Marcador | Valor |
|---|---|
| `{{nome}}` | nome pedido, por exemplo "nome do site AX COMERCE" dá `AX COMERCE`. Sem nome, `Minha Loja` |
| `{{msg}}` | a pergunta completa do utilizador |

O nome é reconhecido depois de: "nome", "nome do site", "nome da loja", "chamado", "chamada", "intitulado". Os valores são escapados, por isso não podem injetar HTML.

Use `{{nome}}` só em texto HTML e no `<title>`. Dentro de strings JavaScript, leia o valor do DOM (por exemplo `document.getElementById("nome").textContent`).

### Em blocos XLang (variáveis)

| Variável | Valor |
|---|---|
| `msg` | a pergunta |
| `n` | quantos números a pergunta tem |
| `n1` a `n6` | os números por ordem (dígitos ou por extenso) |
| `nums` | lista com todos os números |
| `temconta`, `conta`, `formula` | quando a pergunta é uma conta só com símbolos |

## 3. Escolher o template no main.sql

Uma regra com palavras-chave num ficheiro e a resposta vinda do template:

```
WHEN CONTAINS KEYWORDS(palavras_loja.txt) {
 WAITING("A montar a loja")
    REPLY (templates.txt, 1)
}
```

`palavras_loja.txt` tem uma expressão por linha:

```
e-comerce
e-commerce
ecommerce
loja online
```

Atenção: `WHEN CONTAINS "sv"` apanha qualquer mensagem que contenha "sv" (por exemplo "svg"). Prefira expressões específicas.

Coloque as regras novas antes do `OTHERWISE`.

## 4. Exemplo completo: criar um template novo

Pedido: "cria uma página de contacto com nome do site Padaria Sol".

Passo 1. Acrescente a entrada ao fim de `LUME/bot/templates.txt`:

```
2-{
<!doctype html>
<html lang="pt"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{nome}}</title>
<style>
body{margin:0;font-family:Georgia,serif;background:#f6f7ee;color:#1d2410;padding:16px}
h1{color:#2f4a0a;margin:0 0 8px}
.card{background:#fff;border:1px solid #c9ceb8;border-radius:12px;padding:14px;margin-top:12px}
button{background:#2f4a0a;color:#fff;border:0;border-radius:8px;padding:9px 14px;font-family:inherit}
</style></head>
<body>
<h1 id="nome">{{nome}}</h1>
<p>Fale connosco. Respondemos no mesmo dia.</p>
<div class="card">
  <p id="estado">Toque no botão para ver o horário.</p>
  <button id="ver">Ver horário</button>
</div>
<script>
document.getElementById("ver").addEventListener("click",function(){
  document.getElementById("estado").textContent="Aberto das 8h às 18h.";
});
</script>
</body></html>
}
```

Passo 2. Crie `LUME/bot/palavras_contacto.txt`:

```
página de contacto
pagina de contacto
site de contacto
```

Passo 3. Acrescente os dois ficheiros a `LUME/bot/arquivos.json` (`templates.txt` já lá está, falta só `palavras_contacto.txt`).

Passo 4. Acrescente a regra ao `main.sql`, antes do `OTHERWISE`:

```
WHEN CONTAINS KEYWORDS(palavras_contacto.txt) {
 WAITING("A montar a página")
    REPLY (templates.txt, 2)
}
```

Passo 5. Faça push e teste no chat: "cria uma página de contacto com nome do site Padaria Sol".

## 5. Exemplo mínimo em XLang

```
3-{
<program>
<if condition="n >= 2">
  <print>O resultado é <b>{n1 + n2}</b>.</print>
</if>
<else>
  <print>Diz-me dois números, por exemplo: quanto é 4 mais 5?</print>
</else>
</program>
}
```

Num bloco `<program>` o chat injeta `msg`, `n`, `n1`..`n6` e `nums`. O XLang também pode ser escrito direto no `main.sql`, dentro de `REPLY ( ... )`.

## 6. Como as páginas HTML/JS são isoladas

As páginas correm numa iframe com `sandbox="allow-scripts"` e sem `allow-same-origin`. Além disso têm uma política de segurança (CSP) sem acesso à rede. Na prática:

- o JavaScript da página não lê o chat, as conversas, o localStorage nem as cookies do Lume;
- não consegue chamar a API do Lume nem outros sites;
- só pode carregar imagens `https:` e `data:`;
- não guarda nada entre aberturas (localStorage não existe dentro da iframe);
- a página ocupa toda a área do editor.

A resposta aparece como um cartão de ficheiro com o nome tirado do `<title>` (por exemplo `ax-comerce.html`). Ao tocar no cartão abre um editor em ecrã inteiro: os ícones do topo alternam entre **o site** e **o código fonte**, e o menu de três pontos tem Copiar código, Copiar como Markdown, Transferir como HTML (.html), Transferir como texto (.txt) e Recarregar o site.

Por isto, os templates podem vir de qualquer pessoa sem pôr em risco quem os abre. Já o XLang corre no chat, por isso só deve vir de ficheiros mantidos pela equipa (`main.sql` e `rescalculo.txt`).

## 7. Limites do HTML dentro de respostas normais

Fora de uma página (`<!doctype html>`), o HTML de uma resposta normal passa por um filtro: `<script>`, `<iframe>`, `<form>`, `<input>` e `<button>` são removidos. SVG, tabelas, `<style>` e texto formatado funcionam. Para interação, use XLang ou uma página HTML/JS.

## 8. Checklist para um template novo

- A entrada começa por `<!doctype html>` ou `<html>` (página) ou `<program>` (XLang).
- Todas as chaves `{` e `}` estão equilibradas.
- O ficheiro está em `arquivos.json`.
- A regra no `main.sql` está antes do `OTHERWISE` e usa palavras específicas.
- Os estilos usam classes próprias; numa página isolada isso é seguro, em respostas normais use um prefixo (por exemplo `.meusite-`).
- Testado no chat com um pedido real, incluindo um nome com acentos.
