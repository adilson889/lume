

-- Lume X: o avancado. Todas as capacidades do Lume (pesquisa, calculo, desenho, codigo),
-- com uma pausa maior a pensar a fundo antes de responder. Ponto de partida para evoluir.
CREATE BOT "Lume"

CREATE TABLE Context() PREVENT DEFAULT

CONNECT SEARCH WIKI


ON MESSAGE {
    INSERT INTO Context()

    -- Conversa natural tratada pelo gerador de intenções do despachante.js.
    -- Saudações, estado, agradecimentos, despedidas e ajuda são compostos dinamicamente.

-- COMPOSIÇÃO DE VÁRIOS DESENHOS NUM ÚNICO SVG
WHEN CONTAINS KEYWORDS(pedidos_desenhos_compostos.txt) {
    WAITING("A juntar os desenhos num só SVG...", 2)
    REPLY (desenhos_compostos.txt, 1)
}

-- DESPACHANTE DE CAPACIDADES
-- Primeiro verifica se o pedido combina mais de uma capacidade.
WHEN CONTAINS KEYWORDS(pedidos_combinados.txt) {
    WAITING("A combinar as minhas capacidades...", 2)
    REPLY (combinacoes.txt, 1)
}

--XLANG CÁLCULOS 

WHEN CONTAINS KEYWORDS (calculo.txt) {
 WAITING("A executar o cálculo...")
    REPLY (rescalculo.txt, 1)
}

--TESTELIBDESENHO

WHEN CONTAINS "svg" {
    WAITING("A desenhar...")
    REPLY (libdesenho.txt, 1)

}

WHEN CONTAINS KEYWORDS(palavras_loja.txt) {
 WAITING("A montar a loja")
    REPLY (templates.txt, 1)
}

WHEN CONTAINS "pagina teste" {
 WAITING("A montar a página")
    REPLY (rescalculo.txt, 4)
}

WHEN CONTAINS KEYWORDS(palavras_desenho.txt) {
 WAITING("A desenhar", 2)
    REPLY (desenhos.txt, 1)
}

WHEN CONTAINS KEYWORDS(palavras_frases.txt) {
 WAITING("A inventar uma frase", 1)
    REPLY (frases.txt, 1)
}


    -- 6. Tudo o resto: se um passo falha, o seguinte atua.
    --    a) (desligado) base de programacao: conhecimento_programacao.txt
    --    b) o que o Lume ja aprendeu (resposta direta)
    --    c) duvida no aprendido: mostra opcoes para escolher
    --    d) (desligado) pesquisa na web: SEARCH message INTO aprendido.txt
    --    f) nada encontrado: resposta de reserva
    OTHERWISE {
        THINK(aprendido.txt) WAITING("A pensar a fundo...", 4) OR
        ASK(aprendido.txt) AND REPLY "Escolha a possível resposta:" OR
        REPLY (respostas.txt, 7)
    }

UPDATE Context
    SET reply = lastMsg
    WHERE id = LAST_INSERT_ID()
}

RUN BOT

