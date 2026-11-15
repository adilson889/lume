ON MESSAGE {

    WHEN CONTAINS "mmm" {
        REPLY (
            <program>
                <var name="m" value="lower(msg)"></var>
                <var name="gato" value="<svg viewBox='0 0 100 100' width='220' height='220'><rect x='0' y='85' width='100' height='15' fill='#7cb342'></rect><ellipse cx='50' cy='80' rx='20' ry='12' fill='#f39c12'></ellipse><circle cx='50' cy='60' r='14' fill='#f39c12'></circle><polygon points='38,52 44,38 50,52' fill='#f39c12'></polygon><polygon points='62,52 56,38 50,52' fill='#f39c12'></polygon><circle cx='45' cy='58' r='2' fill='#333'></circle><circle cx='55' cy='58' r='2' fill='#333'></circle><path d='M45,65 Q50,68 55,65' stroke='#333' stroke-width='1.5' fill='none'></path><path d='M30,80 Q15,70 20,60' stroke='#f39c12' stroke-width='4' stroke-linecap='round' fill='none'></path></svg>"></var>
                <var name="carro" value="<svg viewBox='0 0 100 100' width='220' height='220'><rect x='0' y='85' width='100' height='15' fill='#7cb342'></rect><rect x='20' y='60' width='60' height='20' rx='5' fill='#e74c3c'></rect><rect x='30' y='45' width='40' height='20' rx='5' fill='#c0392b'></rect><rect x='35' y='48' width='12' height='12' fill='#bde3ff'></rect><rect x='53' y='48' width='12' height='12' fill='#bde3ff'></rect><circle cx='35' cy='80' r='8' fill='#333'></circle><circle cx='65' cy='80' r='8' fill='#333'></circle></svg>"></var>
                <var name="arvore" value="<svg viewBox='0 0 100 100' width='220' height='220'><rect x='0' y='85' width='100' height='15' fill='#7cb342'></rect><rect x='46' y='50' width='8' height='35' fill='#8d6e3f'></rect><circle cx='50' cy='40' r='20' fill='#43a047'></circle><circle cx='35' cy='55' r='15' fill='#388e3c'></circle><circle cx='65' cy='55' r='15' fill='#388e3c'></circle></svg>"></var>

                <if condition="includes(m, 'gato')">
                    <print>{gato}</print>
                </if>
                <elseif condition="includes(m, 'carro')">
                    <print>{carro}</print>
                </elseif>
                <elseif condition="includes(m, 'arvore') || includes(m, 'árvore')">
                    <print>{arvore}</print>
                </elseif>
                <else>
                    <print>Ainda não sei desenhar isso. Tenta: gato, carro ou árvore.</print>
                </else>
            </program>
        )
    }

}