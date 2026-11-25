-- Lume Rapido: respostas curtas, sem pesquisa na web e sem pausas de espera.
-- (Sem CONNECT SEARCH WIKI e sem WAITING.)
CREATE BOT "Lume"

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS KEYWORDS (calculo.txt) {
        REPLY (rescalculo.txt, 1)
    }

    OTHERWISE {
        THINK(aprendido.txt) OR
        REPLY (respostas.txt, 7)
    }

    UPDATE Context
        SET reply = lastMsg
        WHERE id = LAST_INSERT_ID()
}

RUN BOT
