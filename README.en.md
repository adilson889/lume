<p align="center">
  <img src="LUME/assets/logo.png" alt="Lume" width="160">
</p>

<h1 align="center">Lume</h1>

<p align="center"><b>A conversational BOT built entirely with BotQL.</b></p>

<p align="center">
  <a href="https://github.com/adilson889/lume/stargazers"><img src="https://img.shields.io/github/stars/adilson889/lume?style=flat-square&color=8b0000" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/adilson889/lume?style=flat-square&color=8b0000" alt="License"></a>
  <a href="https://github.com/adilson889/lume/commits/main"><img src="https://img.shields.io/github/last-commit/adilson889/lume?style=flat-square&color=8b0000" alt="Last commit"></a>
  <img src="https://img.shields.io/badge/feito%20com-BotQL-8b0000?style=flat-square" alt="BotQL">
  <img src="https://img.shields.io/badge/inten%C3%A7%C3%A3o-NLP.js-8b0000?style=flat-square" alt="NLP.js">
  <img src="https://img.shields.io/badge/p%C3%A1gina-est%C3%A1tica-8b0000?style=flat-square" alt="Static page">
</p>

<p align="center"><a href="README.md">Português</a> &nbsp;|&nbsp; <a href="README.en.md">English</a> &nbsp;|&nbsp; <a href="README.zh.md">中文</a></p>

---

## What is Lume?

Lume is a **conversational BOT**, built entirely with <a href="https://github.com/adilson889/botql">BotQL</a>, a declarative, rules-based language. It is not a trained language model, nor is it intended to be presented as an autonomous AI. It is a bot that combines conversation rules, knowledge files, content taught by users, and web search to interpret messages and decide what to do.

But Lume's purpose goes beyond answering questions: **it can also ask humans for help**.

When it cannot find a suitable answer, Lume can acknowledge that limitation and give someone the opportunity to teach it. The information it receives can be reviewed, corrected, and approved before becoming part of its knowledge base. Humans are therefore not just people who ask questions; they also take part in the bot's growth.

> Lume starts without knowing everything. Humans help it grow.

## How it works

Every message first goes through conversation rules (help, greetings, farewells, thanks, and status). The remaining messages follow a lookup sequence:

1. **Knowledge base** (`conhecimento_programacao.txt`): looks for an answer in the prepared content.
2. **Learned knowledge** (`aprendido.txt`): checks content Lume has already learned and that is available for use.
3. **Web search** (Wikipedia): triggered when a message is identified as a programming question not yet covered by the knowledge base. The result can be saved for later use.
4. **Poll**: when several answers are possible, Lume can show them and let the user choose.
5. **Request for help or fallback reply**: when it cannot find enough information, it can ask for help or provide a fallback response.

The poll displays numbered options and ends as soon as the user makes a choice.

## Message intent

The chat uses <a href="https://github.com/axa-group/nlp.js">NLP.js</a>, bundled into a single file (`LUME/vendor/nlp.min.js`, 127 KB), to classify messages. Categories include known topics, small talk, out-of-domain messages, and programming questions not yet covered by the knowledge base.

The classifier is trained when the page opens, using the knowledge-base topics and examples from `LUME/bot/intencoes.txt`. This helps, for example, prevent an unrelated question from triggering an unnecessary web search.

To teach an intent, add lines in the format `intent | example phrase` to `intencoes.txt`.

## Teaching and correcting Lume

Users can rate answers with positive or negative votes. When an answer receives a negative rating, they can teach an alternative through an editor with formatting, preview, and validation.

Taught or collected content can be reviewed in the management panel, where it can be approved or removed. **Content should only be treated as available knowledge after passing the validation process defined by the system.**

This mechanism represents learning through knowledge collection, validation, and persistence. It does not mean that the bot autonomously changes its own parameters or trains itself like a language model.

## Repository layout

```text
index.html                      chat (static page, no build step)
LUME/
  bot/                          main.sql and the text files it uses
    arquivos.json               list of files loaded by the chat
    conhecimento_programacao.txt
    intencoes.txt
    aprendido.txt
  vendor/nlp.min.js             NLP.js bundled as a single file
  assets/logo.png
  tests/casos_programacao.txt   test cases (question | expected answer)
  CHANGELOG.txt
  VERSION
```

## Run locally

Lume is a static page that loads the BotQL engine over the network. It must be served over HTTP; opening the file directly will not work because of the `fetch` requests.

```bash
git clone https://github.com/adilson889/lume.git
cd lume
python3 -m http.server 8000
# open http://localhost:8000
```

## Adding knowledge

Each knowledge-base topic is a block separated by a blank line, in the format `Topic (synonyms): answer text`.

When creating a new file, add it to `LUME/bot/arquivos.json`, because the chat only loads files listed there. BotQL file names should be simple: letters, numbers, and underscores, with no folders.

## Versions

Changes for each version are listed in <a href="LUME/CHANGELOG.txt">LUME/CHANGELOG.txt</a>, and the current version is in <a href="LUME/VERSION">LUME/VERSION</a>.

## License

Released under the Apache 2.0 license. See <a href="LICENSE">LICENSE</a>. NLP.js, included in `LUME/vendor`, is released under the MIT license.
