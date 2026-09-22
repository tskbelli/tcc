const seletorEstrelas = document.querySelector('.star-rating');

if (seletorEstrelas) {
    const notas = [...seletorEstrelas.querySelectorAll('input[name="nota"]')];
    const saida = document.querySelector('#nota-selecionada');

    function mostrarNota() {
        const marcada = notas.find((campo) => campo.checked);
        saida.textContent = marcada
            ? 'Sua nota: ' + Number(marcada.value).toLocaleString('pt-BR') + ' / 5' : 'Escolha sua nota';
    }

    notas.forEach((campo) => {
        campo.addEventListener('change', mostrarNota);
        campo.addEventListener('keydown', (evento) => {
            // Os radios estão em ordem inversa para reaproveitar o preenchimento por CSS.
            // As setas seguem a ordem visual: direita aumenta; esquerda diminui.
            const diferenca = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[evento.key];
            if (diferenca === undefined && evento.key !== 'Home' && evento.key !== 'End') return;
            evento.preventDefault();
            const valor = evento.key === 'Home' ? 0.5 : evento.key === 'End' ? 5
                : Math.max(0.5, Math.min(5, Number(campo.value) + diferenca));
            const destino = notas.find((item) => Number(item.value) === valor);
            destino.checked = true;
            destino.focus();
            mostrarNota();
        });
    });
    mostrarNota();
}
