-- Lume Desenho: desenhos em SVG e composicoes.
CREATE BOT "Lume"

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS KEYWORDS(pedidos_desenhos_compostos.txt) {
        WAITING("A juntar os desenhos num só SVG...", 2)
        REPLY (desenhos_compostos.txt, 1)
    }

    WHEN CONTAINS "svg" {
        WAITING("A desenhar...")
        REPLY (libdesenho.txt, 1)
    }

    WHEN CONTAINS KEYWORDS(palavras_desenho.txt) {
        WAITING("A desenhar", 2)
        REPLY (desenhos.txt, 1)
    }

    OTHERWISE {
        REPLY "Estou no modo Lume Desenho: pede uma coisa de cada vez, por exemplo «desenha uma casa» ou «desenha uma casa e duas árvores». Para outros assuntos, muda de modelo."
    }

    UPDATE Context
        SET reply = lastMsg
        WHERE id = LAST_INSERT_ID()
}

RUN BOT
