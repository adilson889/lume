-- Lume Codigo: gera e explica codigo a partir de frases.
-- O gerador de codigo (gerar_codigo.txt) corre antes, pelo despachante; aqui ficam as paginas e a loja.
CREATE BOT "Lume"

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS KEYWORDS(palavras_loja.txt) {
        WAITING("A montar a loja")
        REPLY (templates.txt, 1)
    }

    OTHERWISE {
        THINK(aprendido.txt) WAITING("A pensar...", 3) OR
        REPLY "Estou no modo Lume Código: descreve o que queres em frases (por exemplo, «cria uma função que soma dois números») e eu gero e explico o código. Para outros assuntos, muda de modelo."
    }

    UPDATE Context
        SET reply = lastMsg
        WHERE id = LAST_INSERT_ID()
}

RUN BOT
