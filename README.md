<p align="center">
  <img src="LUME/assets/logo.png" alt="Lume" width="160">
</p>

<h1 align="center">Lume</h1>

<p align="center"><b>Um BOT conversacional construído integralmente com BotQL.</b></p>

<p align="center">
  <a href="https://github.com/adilson889/lume/stargazers"><img src="https://img.shields.io/github/stars/adilson889/lume?style=flat-square&color=8b0000" alt="Estrelas"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/adilson889/lume?style=flat-square&color=8b0000" alt="Licença"></a>
  <a href="https://github.com/adilson889/lume/commits/main"><img src="https://img.shields.io/github/last-commit/adilson889/lume?style=flat-square&color=8b0000" alt="Último commit"></a>
  <img src="https://img.shields.io/badge/feito%20com-BotQL-8b0000?style=flat-square" alt="BotQL">
  <img src="https://img.shields.io/badge/inten%C3%A7%C3%A3o-NLP.js-8b0000?style=flat-square" alt="NLP.js">
  <img src="https://img.shields.io/badge/p%C3%A1gina-est%C3%A1tica-8b0000?style=flat-square" alt="Página estática">
</p>

<p align="center"><a href="README.md">Português</a> &nbsp;|&nbsp; <a href="README.en.md">English</a> &nbsp;|&nbsp; <a href="README.zh.md">中文</a></p>

---

## O que é o Lume?

O Lume é um **BOT conversacional**, desenvolvido integralmente com <a href="https://github.com/adilson889/botql">BotQL</a>, uma linguagem declarativa baseada em regras. Não é um modelo de linguagem treinado nem pretende ser apresentado como uma IA autónoma. É um bot que combina regras de conversa, ficheiros de conhecimento, conteúdos ensinados pelos utilizadores e pesquisa na web para interpretar mensagens e decidir como agir.

Mas a proposta do Lume vai além de responder a perguntas: **ele também pode pedir ajuda aos humanos**.

Quando não encontra uma resposta adequada, o Lume pode reconhecer essa limitação e abrir espaço para que alguém o ensine. O conhecimento recebido pode ser avaliado, corrigido e aprovado antes de passar a fazer parte da sua base de conhecimento. Assim, os humanos não são apenas pessoas que fazem perguntas: também participam no crescimento do bot.

> O Lume nasce sem saber tudo. Os humanos ajudam-no a crescer.

## Como funciona

Cada mensagem passa primeiro pelas regras de conversa (ajuda, saudações, despedidas, agradecimentos e estado). As restantes seguem uma cadeia de consulta:

1. **Base de conhecimento** (`conhecimento_programacao.txt`): procura uma resposta nos conteúdos preparados.
2. **Conhecimento aprendido** (`aprendido.txt`): consulta conteúdos que o Lume já aprendeu e que estão disponíveis para utilização.
3. **Pesquisa na web** (Wikipédia): é acionada quando a mensagem é identificada como uma questão de programação que a base ainda não cobre. O resultado pode ser guardado para utilização posterior.
4. **Sondagem**: quando existem várias respostas possíveis, o Lume pode apresentá-las para o utilizador escolher.
5. **Pedido de ajuda ou resposta de reserva**: quando não encontra informação suficiente, pode solicitar ajuda ou apresentar uma resposta de reserva.

A sondagem apresenta as opções numeradas e termina assim que o utilizador escolhe uma.

## Identificação da intenção

O chat utiliza <a href="https://github.com/axa-group/nlp.js">NLP.js</a>, incluído num único ficheiro (`LUME/vendor/nlp.min.js`, 127 KB), para classificar as mensagens. Entre as categorias estão temas conhecidos, conversa informal, mensagens fora do domínio e questões de programação ainda não cobertas pela base.

O classificador é treinado quando a página abre, utilizando os temas da base e os exemplos de `LUME/bot/intencoes.txt`. Isto ajuda, por exemplo, a evitar que uma pergunta fora do domínio de programação provoque uma pesquisa desnecessária.

Para ensinar uma intenção, acrescenta linhas no formato `intencao | frase de exemplo` ao ficheiro `intencoes.txt`.

## Ensinar e corrigir o Lume

Os utilizadores podem avaliar as respostas com votos positivos ou negativos. Quando uma resposta recebe uma avaliação negativa, podem ensinar uma resposta alternativa através de um editor com formatação, pré-visualização e validação.

Os conteúdos ensinados ou recolhidos podem passar por revisão no painel de gestão, onde podem ser aprovados ou removidos. **O conteúdo só deve ser tratado como conhecimento disponível depois de passar pelo processo de validação definido pelo sistema.**

Este mecanismo representa aprendizagem por recolha, validação e persistência de conhecimento. Não significa que o bot altere autonomamente os seus próprios parâmetros ou se treine como um modelo de linguagem.

## Estrutura do repositório

```text
index.html                      chat (página estática, sem compilação)
LUME/
  bot/                          main.sql e os ficheiros de texto utilizados
    arquivos.json               lista dos ficheiros carregados pelo chat
    conhecimento_programacao.txt
    intencoes.txt
    aprendido.txt
  vendor/nlp.min.js             NLP.js num único ficheiro
  assets/logo.png
  tests/casos_programacao.txt   casos de teste (pergunta | resposta esperada)
  CHANGELOG.txt
  VERSION
```

## Executar localmente

O Lume é uma página estática que carrega o motor do BotQL pela rede. É necessário servi-la por HTTP; abrir o ficheiro diretamente não funciona devido aos pedidos `fetch`.

```bash
git clone https://github.com/adilson889/lume.git
cd lume
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Acrescentar conhecimento

Cada tema da base é um bloco separado por uma linha em branco, no formato `Tema (sinónimos): texto da resposta`.

Ao criar um ficheiro novo, adiciona-o a `LUME/bot/arquivos.json`, porque o chat só carrega os ficheiros indicados nessa lista. Os nomes dos ficheiros utilizados pelo BotQL devem ser simples: letras, números e sublinhado, sem pastas.

## Versões

As alterações de cada versão estão em <a href="LUME/CHANGELOG.txt">LUME/CHANGELOG.txt</a>, e a versão atual em <a href="LUME/VERSION">LUME/VERSION</a>.

## Licença

Distribuído sob a licença Apache 2.0. Consulta <a href="LICENSE">LICENSE</a>. O NLP.js, incluído em `LUME/vendor`, é distribuído sob a licença MIT.
