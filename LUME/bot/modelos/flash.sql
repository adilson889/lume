-- Lume Flash: respostas curtas, pesquisa na Wikipedia (resumida) e sem pausas de espera.
CREATE BOT "Lume"

CONNECT SEARCH WIKI

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS KEYWORDS (calculo.txt) {
        REPLY (rescalculo.txt, 1)
    }

    OTHERWISE {
        THINK(aprendido.txt) OR
        SEARCH message INTO aprendido.txt OR
        REPLY (respostas.txt, 7)
    }

    UPDATE Context
        SET reply = lastMsg
        WHERE id = LAST_INSERT_ID()
}

RUN BOT
