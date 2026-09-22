const formularioFilme = document.querySelector('#form-filme');

if (formularioFilme) {
    const minutos = formularioFilme.querySelector('#minutos');
    const segundos = formularioFilme.querySelector('#segundos');
    const capa = formularioFilme.querySelector('#capa');
    const previa = formularioFilme.querySelector('#capa-preview');
    const caixaPrevia = formularioFilme.querySelector('#capa-preview-container');
    const legendaPrevia = formularioFilme.querySelector('#capa-preview-label');
    let previaLocal;

    function validarDuracao() {
        segundos.setCustomValidity('');
        segundos.max = Number(minutos.value) === 5 ? '0' : '59';
        if (minutos.value === '' || segundos.value === '') return;
        const total = Number(minutos.value) * 60 + Number(segundos.value);
        if (total <= 0 || total > 300) {
            segundos.setCustomValidity('A duração deve ser maior que zero e não pode ultrapassar 5min00s.');
        }
    }

    minutos.addEventListener('input', validarDuracao);
    segundos.addEventListener('input', validarDuracao);
    validarDuracao();

    capa.addEventListener('change', () => {
        capa.setCustomValidity('');
        if (previaLocal) URL.revokeObjectURL(previaLocal);
        previaLocal = null;
        const arquivo = capa.files[0];
        if (arquivo && (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)
            || !/\.(jpe?g|png|webp)$/i.test(arquivo.name) || arquivo.size > 5 * 1024 * 1024)) {
            capa.setCustomValidity('Envie uma imagem JPG, JPEG, PNG ou WebP de até 5 MB.');
            capa.reportValidity();
        }
        const novaCapa = arquivo && capa.validity.valid;
        if (novaCapa) previaLocal = URL.createObjectURL(arquivo);
        const origem = previaLocal || previa.dataset.capaAtual;
        if (origem) previa.src = origem;
        else previa.removeAttribute('src');
        caixaPrevia.hidden = !origem;
        legendaPrevia.textContent = novaCapa ? 'Nova capa selecionada' : 'Capa atual';
    });
}
