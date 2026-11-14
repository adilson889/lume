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


--XLANG


WHEN CONTAINS KEYWORDS (calculo.txt) {
 WAITING("Calculando")
    REPLY (
        <if condition="n > 6">
    <print>Consigo fazer contas com até 6 números de cada vez.</print>
</if>
<elseif condition="n >= 2">
    <array name="nums" value="[n1, n2, n3, n4, n5, n6]"></array>
    <var name="op" value="'+'"></var>
    <if condition="includes(lower(msg), 'dividido')">
        <set name="op" value="'÷'"></set>
    </if>
    <elseif condition="includes(lower(msg), 'vezes')">
        <set name="op" value="'×'"></set>
    </elseif>
    <elseif condition="includes(lower(msg), 'menos')">
        <set name="op" value="'−'"></set>
    </elseif>
    <var name="total" value="nums[0]"></var>
    <var name="expr" value="'' + nums[0]"></var>
    <var name="erro" value="false"></var>
    <for var="i" from="1" to="n - 1">
        <set name="expr" value="expr + ' ' + op + ' ' + nums[i]"></set>
        <if condition="op == '+'">
            <set name="total" value="total + nums[i]"></set>
        </if>
        <elseif condition="op == '−'">
            <set name="total" value="total - nums[i]"></set>
        </elseif>
        <elseif condition="op == '×'">
            <set name="total" value="total * nums[i]"></set>
        </elseif>
        <else>
            <if condition="nums[i] == 0">
                <set name="erro" value="true"></set>
            </if>
            <else>
                <set name="total" value="total / nums[i]"></set>
            </else>
        </else>
    </for>
    <if condition="erro">
        <print>Não dá para dividir por zero.</print>
    </if>
    <else>
        <print>{expr} = {total}</print>
    </else>
</elseif>
<else>
    <print>Diz-me dois ou mais números, por exemplo: quanto é 4 mais 5?</print>
</else>
    )
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

