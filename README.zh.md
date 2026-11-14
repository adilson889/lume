<p align="center">
  <img src="LUME/assets/logo.png" alt="Lume" width="160">
</p>

<h1 align="center">Lume</h1>

<p align="center"><b>完全使用 BotQL 构建的对话机器人。</b></p>

<p align="center">
  <a href="https://github.com/adilson889/lume/stargazers"><img src="https://img.shields.io/github/stars/adilson889/lume?style=flat-square&color=8b0000" alt="星标"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/adilson889/lume?style=flat-square&color=8b0000" alt="许可证"></a>
  <a href="https://github.com/adilson889/lume/commits/main"><img src="https://img.shields.io/github/last-commit/adilson889/lume?style=flat-square&color=8b0000" alt="最近提交"></a>
  <img src="https://img.shields.io/badge/feito%20com-BotQL-8b0000?style=flat-square" alt="BotQL">
  <img src="https://img.shields.io/badge/inten%C3%A7%C3%A3o-NLP.js-8b0000?style=flat-square" alt="NLP.js">
  <img src="https://img.shields.io/badge/p%C3%A1gina-est%C3%A1tica-8b0000?style=flat-square" alt="静态页面">
</p>

<p align="center"><a href="README.md">Português</a> &nbsp;|&nbsp; <a href="README.en.md">English</a> &nbsp;|&nbsp; <a href="README.zh.md">中文</a></p>

---

## 什么是 Lume？

Lume 是一个**对话机器人（BOT）**，完全使用 <a href="https://github.com/adilson889/botql">BotQL</a> 构建。BotQL 是一种基于规则的声明式语言。Lume 不是经过训练的语言模型，也不以自主人工智能的身份呈现。它结合对话规则、知识文件、用户教授的内容以及网络搜索，理解消息并决定如何处理。

但 Lume 的目标不只是回答问题：**它也可以向人类寻求帮助**。

当 Lume 找不到合适的答案时，它可以承认自己的不足，并让人类有机会教它。收到的内容可以先经过审核、纠正和批准，然后再加入知识库。因此，人类不只是提问者，也参与机器人的成长。

> Lume 并非一开始就无所不知。人类帮助它成长。

## 工作方式

每条消息首先经过对话规则处理（帮助、问候、告别、感谢和状态）。其余消息按照以下顺序查找：

1. **知识库**（`conhecimento_programacao.txt`）：在已有内容中寻找答案。
2. **已学习的知识**（`aprendido.txt`）：查找 Lume 已经学到并可供使用的内容。
3. **网络搜索**（维基百科）：当消息被识别为知识库尚未涵盖的编程问题时触发。搜索结果可以保存，以便以后使用。
4. **选项投票**：如果存在多个可能答案，Lume 可以展示这些答案并让用户选择。
5. **请求帮助或备用回答**：如果找不到足够的信息，Lume 可以向人类寻求帮助，或者给出备用回答。

投票会显示带编号的选项，用户作出选择后投票即结束。

## 消息意图识别

聊天页面使用 <a href="https://github.com/axa-group/nlp.js">NLP.js</a>，并将其打包在单个文件中（`LUME/vendor/nlp.min.js`，127 KB），用于对消息进行分类。类别包括已知主题、日常闲聊、无关内容，以及知识库尚未覆盖的编程问题。

页面打开时，分类器会使用知识库主题和 `LUME/bot/intencoes.txt` 中的示例进行训练。例如，这有助于避免无关问题触发不必要的网络搜索。

要教授新的意图，只需在 `intencoes.txt` 中添加格式为 `意图 | 示例句子` 的行。

## 教授和纠正 Lume

用户可以通过赞成或反对来评价回答。当回答收到负面评价时，用户可以通过带有格式、预览和验证功能的编辑器教授另一种答案。

教授或收集的内容可以在管理面板中审核、批准或删除。**只有通过系统规定的验证流程后，内容才应被视为可用知识。**

这种机制代表通过知识收集、验证和持久化来学习。这并不意味着机器人会自主修改自身参数，或像语言模型一样训练自己。

## 仓库结构

```text
index.html                      聊天页面（静态页面，无需构建）
LUME/
  bot/                          main.sql 及其使用的文本文件
    arquivos.json               聊天页面加载的文件列表
    conhecimento_programacao.txt
    intencoes.txt
    aprendido.txt
  vendor/nlp.min.js             单文件版 NLP.js
  assets/logo.png
  tests/casos_programacao.txt   测试用例（问题 | 预期答案）
  CHANGELOG.txt
  VERSION
```

## 本地运行

Lume 是一个静态页面，通过网络加载 BotQL 引擎。必须通过 HTTP 服务器运行；由于页面使用 `fetch` 请求，直接打开文件无法正常工作。

```bash
git clone https://github.com/adilson889/lume.git
cd lume
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 添加知识

知识库中的每个主题都是一个由空行分隔的内容块，格式为 `主题（同义词）：回答内容`。

创建新文件时，请将其添加到 `LUME/bot/arquivos.json`，因为聊天页面只会加载该列表中的文件。BotQL 文件名应保持简单：只使用字母、数字和下划线，不包含文件夹。

## 版本

各版本的变更记录见 <a href="LUME/CHANGELOG.txt">LUME/CHANGELOG.txt</a>，当前版本见 <a href="LUME/VERSION">LUME/VERSION</a>。

## 许可证

本项目基于 Apache 2.0 许可证发布，详见 <a href="LICENSE">LICENSE</a>。包含在 `LUME/vendor` 中的 NLP.js 基于 MIT 许可证发布。
