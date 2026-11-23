# Do PWA do Lume para app Android (TWA)

Um TWA (Trusted Web Activity) e uma app Android que abre o PWA em ecra inteiro, sem barra do navegador, com o Chrome por baixo. Nao ha motor proprio: e o mesmo site, com cache e service worker do Chrome. O `mobile.html` (WebView) e outra coisa e nao entra aqui.

## O que ja existe
- HTTPS (Vercel), `manifest.webmanifest` com `start_url`, `scope`, `display: standalone`, ícones 192 e 512 (normais e maskable) e `sw.js`.
- `vercel.json` com cabeçalhos; falta apenas o ficheiro `assetlinks.json` (passo 4).

## Requisitos para abrir sem barra de endereço
1. Site em HTTPS, com manifest e service worker (feito).
2. Ligacao de confianca: `https://DOMINIO/.well-known/assetlinks.json` tem de devolver 200, `application/json`, sem redirecionamentos, com o package e a impressão digital SHA-256 da chave que assinou a app.
3. App assinada, instalada com o mesmo package indicado no ficheiro.

## Passos (tudo possivel no telemovel)
1. Abre pwabuilder.com no Chrome, cola o URL do Lume e corrige os avisos (ícone 512, `id`, `start_url`).
2. Escolhe Android. Define o package (por exemplo `co.adilson889.lume`), o nome, o URL e a versao. Deixa o PWABuilder criar a chave de assinatura e guarda: o ficheiro `.keystore`, o alias e as palavras-passe. Sem eles nao ha atualizações da mesma app.
3. Descarrega o pacote. Traz o APK (para instalar já), o AAB (para a Play Store) e um `assetlinks.json` de exemplo com o SHA-256.
4. Cria `.well-known/assetlinks.json` na raiz do projeto (pasta `.well-known` ao lado do `index.html`) com:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "co.adilson889.lume",
    "sha256_cert_fingerprints": ["AA:BB:CC:...:FF"]
  }
}]
```
5. Publica no Vercel e abre o URL do ficheiro no Chrome para confirmar que aparece o JSON.
6. Instala o APK. Se abrir sem barra de endereço, a ligação esta certa.

## Se aparecer a barra de endereço
- SHA-256 diferente do da chave que assinou o APK (copiar do pacote, nao de outra chave).
- Package diferente do que esta no ficheiro.
- `assetlinks.json` com redirecionamento, 404 ou tipo errado (`vercel.json` ja fixa `application/json`).
- Domínio do app diferente do do ficheiro (`www` contra sem `www`).
- Dados da app antigos: desinstala, reinstala e abre duas vezes.
- Depois de mudar o ficheiro, o Android pode demorar algum tempo a verificar; limpar os dados do Chrome ajuda.

## Play Store
- Usa o AAB. Com Play App Signing, a Google reassina a app: copia o SHA-256 de Play Console, Integridade da app, Assinatura, e acrescenta-o ao `assetlinks.json` (podem ficar os dois SHA-256 na lista).
- A Play exige política de privacidade, capturas e classificação de conteúdo.
- Conta de programador: taxa única; contas pessoais novas precisam de testes fechados antes da produção.

## Alternativas
- Kotlin com `androidx.browser` (`LauncherActivity` ou `TrustedWebActivityService`): mais controlo (notificações, ligações), mais trabalho.
- Bubblewrap (linha de comandos, precisa de Android SDK e JDK): é o que o PWABuilder usa por baixo.

## Cuidados
- Guarda a chave de assinatura fora do repositório e com cópia de segurança.
- O Lume ja decide o que guardar em cache (`PWA.md`); o TWA usa o mesmo `sw.js`.
- Cada nova versao da app: subir `versionCode` e assinar com a mesma chave.
