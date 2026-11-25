-- Lume Mat: contas, equacoes, graficos e passos em KaTeX.
-- Sem pesquisa na web; o que nao for matematica cai na resposta de reserva.
CREATE BOT "Lume"

CREATE TABLE Context() PREVENT DEFAULT

ON MESSAGE {
    INSERT INTO Context()

    WHEN CONTAINS KEYWORDS (calculo.txt) {
        WAITING("A executar o cálculo...")
        REPLY (rescalculo.txt, 1)
    }

    OTHERWISE {
        THINK(aprendido.txt) WAITING("A pensar...", 3) OR
        REPLY "Estou no modo Lume Mat: trato de contas, equações, gráficos e passos. Para outros assuntos, muda de modelo no botão ao lado do campo de escrita."
    }

    UPDATE Context
        SET reply = lastMsg
        WHERE id = LAST_INSERT_ID()
}

RUN BOT
