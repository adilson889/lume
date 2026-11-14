

-- Lume: ponto de entrada do bot.
--
-- Regras desta estrutura:
-- 1. O BotQL so aceita nomes de ficheiro simples (sem pastas) em
--    KEYWORDS, REPLY, THINK, ASK, SEARCH e WAITING. Por isso este ficheiro
--    e todos os .txt que ele usa ficam juntos, nesta pasta (LUME/bot/).
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
-- 6. APRENDIZAGEM: tudo o que o SEARCH encontra na web e gravado em
--    aprendido.txt (separado do conhecimento escrito a mao). O chat
--    partilha esses blocos com os outros visitantes (ver o index e a API).
--    O ficheiro aprendido.txt tem de existir (pode estar vazio).

CREATE BOT "Lume"

CREATE TABLE Context() PREVENT DEFAULT

CONNECT SEARCH WIKI


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

    -- 6. Tudo o resto: se um passo falha, o seguinte atua.
    --    a) base escrita a mao (resposta direta)
    --    b) o que o Lume ja aprendeu (resposta direta)
    --    c) duvida no aprendido: mostra opcoes para escolher
    --    d) nao sabe: pesquisa na web, grava em aprendido.txt e repete b) e c)
    --       (se houver varias respostas, lanca a sondagem)
    --    e) duvida na base: mostra opcoes para escolher
    --    f) nada encontrado: resposta de reserva
    OTHERWISE {
        THINK(conhecimento_programacao.txt) WAITING("Pensando..", 3) OR
        THINK(aprendido.txt) OR
        ASK(aprendido.txt) AND REPLY "Escolha a possível resposta:" OR
        SEARCH message INTO aprendido.txt OR
        ASK(conhecimento_programacao.txt) AND REPLY "Escolha a possível resposta:" OR
        REPLY (respostas.txt, 7)
    }

UPDATE Context
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}

RUN BOT

