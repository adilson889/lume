-- Lume: ponto de entrada do bot.
--
-- Regras desta estrutura:
-- 1. O BotQL so aceita nomes de ficheiro simples (sem pastas) em
--    KEYWORDS, REPLY, THINK e WAITING. Por isso este ficheiro e todos os
--    .txt que ele usa ficam juntos, nesta pasta (LUME/bot/).
-- 2. So existe UM bloco ON MESSAGE, aqui. O BotQL corre todos os blocos
--    ON MESSAGE em sequencia, por isso ficheiros importados nao devem ter
--    o seu proprio ON MESSAGE.
-- 3. O conteudo cresce nos ficheiros .txt (palavras-chave, respostas e
--    conhecimento), nao neste ficheiro.
-- 4. CONTAINS procura o texto dentro da mensagem, mesmo no meio de outra
--    palavra. Por isso as palavras-chave de conversa sao frases
--    especificas e nao palavras curtas como "oi" (que existe em "void").
-- 5. Toda a resposta mostra primeiro os 3 pontinhos de espera: WHEN usa
--    WAITING("texto") sozinho (texto diferente por assunto) e o THINK usa
--    WAITING acoplado. Todos levam o tempo minimo em segundos: WAITING("texto", segundos).

CREATE BOT "Lume"

CREATE TABLE Context() PREVENT DEFAULT
DEFAULT MESSAGE (respostas.txt, 1)

ON MESSAGE {
    INSERT INTO Context()

    -- 1. Ver o que o bot sabe fazer
    WHEN CONTAINS KEYWORDS(ajuda.txt) {
        WAITING("A ver o que sei fazer...", 2)
        REPLY (respostas.txt, 2)
    }

    -- 2. Despedidas
    WHEN CONTAINS KEYWORDS(despedidas.txt) {
        WAITING("A despedir-me...", 2)
        REPLY (respostas.txt, 4)
    }

    -- 3. Agradecimentos
    WHEN CONTAINS KEYWORDS(agradecimentos.txt) {
        WAITING("A responder...", 2)
        REPLY (respostas.txt, 5)
    }

    -- 4. Saudacoes
    WHEN CONTAINS KEYWORDS(saudacoes.txt) {
        WAITING("A cumprimentar...", 2)
        REPLY (respostas.txt, 3)
    }

    -- 5. Como estas
    WHEN CONTAINS KEYWORDS(estado.txt) {
        WAITING("A ver como estou...", 2)
        REPLY (respostas.txt, 6)
    }

    -- 6. Tudo o resto: procura na base de conhecimento de programacao
    OTHERWISE {
        THINK(conhecimento_programacao.txt) WAITING("A procurar na base de programacao...", 3) OR
        REPLY (respostas.txt, 7)
    }

UPDATE Context
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}

RUN BOT
