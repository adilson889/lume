# Lume como PWA

O `index.html` do Lume instala-se como aplicação e abre sem ligação. O `mobile.html` não faz parte disto: é da app Android e não regista o service worker.

## Ficheiros

| Ficheiro | Para que serve |
|---|---|
| `manifest.webmanifest` | nome, ícones, cores, atalhos («Nova conversa», «Ensinar o Lume») e partilha para o Lume |
| `sw.js` | service worker: guarda a app e os ficheiros do bot e decide de onde vem cada pedido |
| `offline.html` | página mostrada quando não há ligação e a app ainda não ficou guardada |
| `LUME/assets/icons/` | ícones gerados a partir de `LUME/assets/logo.png` (normais, maskable, Apple e favicon) |
| `vercel.json` | cabeçalhos: `sw.js` e o manifest nunca ficam presos em cache, ícones ficam 1 dia |

## Como o service worker decide

| Pedido | Estratégia |
|---|---|
| Abrir a app (`index.html`) | rede primeiro (4 s); sem rede, a cópia guardada; sem cópia, `offline.html` |
| Código do site (js, html, css) | rede primeiro (4 s); sem rede, a cópia guardada |
| Ficheiros do bot (`LUME/bot/`, json, txt, sql) | rede primeiro (5 s); sem rede, a cópia guardada |
| Imagens, ícones, fontes, manifest | cópia guardada e atualiza em segundo plano |
| marked, DOMPurify, highlight.js e motor BotQL | cópia guardada e atualiza em segundo plano |
| API, pesquisa, POST, `mobile.html` | direto à rede, sem cache |

Com ligação, o Lume mostra sempre a versão mais recente. Sem ligação, usa o que guardou.

## Ao publicar uma versão nova

1. Se criares um ficheiro novo do site (um `.js`, por exemplo), acrescenta-o à lista `NUCLEO` em `sw.js`.
2. Os ficheiros do bot não precisam de nada: a lista vem de `LUME/bot/arquivos.json`.
3. Quem já tem a app aberta vê o aviso «Há uma nova versão do Lume» e atualiza com um toque. Se mudares `VERSAO` em `sw.js`, as cópias antigas são apagadas de uma vez.

## O que a página faz

- Aviso de atualização e verificação de versão nova de hora a hora e ao voltar à app.
- Convite para instalar 30 segundos depois de abrir, no máximo uma vez a cada 14 dias, e item «Instalar aplicação» no menu dos três pontos. No iPhone mostra as instruções do Safari.
- Faixa «Sem ligação» enquanto o dispositivo estiver offline.
- Atalhos do ícone e partilha: `?acao=nova`, `?acao=ensinar`, `?titulo=`, `?texto=`, `?link=`.
- Áreas seguras (notch e barra de início), `prefers-reduced-motion` e `noscript`.

## Como testar

1. Abre o Lume no Chrome por `https` e vai a DevTools, separador Application: Manifest (sem avisos), Service Workers (ativo) e Cache Storage (`lume-shell`, `lume-dados`, `lume-libs`, `lume-media`).
2. Coloca Network em Offline e recarrega: o Lume deve abrir.
3. Corre o Lighthouse na categoria PWA.

## O que ainda não está

- Capturas de ecrã no manifest (o Chrome usa-as no ecrã de instalação). Precisam de imagens reais do Lume em `1080x1920` e `1920x1080`.
- Notificações push e sincronização em segundo plano.
- O `viewport` mantém `user-scalable=no`, como estava, porque o layout depende do tamanho visível do ecrã. Para a auditoria de acessibilidade do Lighthouse convém retirá-lo e testar o teclado.
