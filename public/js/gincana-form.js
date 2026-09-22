const formularioGincana = document.querySelector('#form-gincana');

if (formularioGincana) {
    const ano = formularioGincana.querySelector('#ano-edicao');
    const campos = [...formularioGincana.querySelectorAll('[data-colocacao]')];
    const salvar = formularioGincana.querySelector('#salvar-edicao');
    const estado = formularioGincana.querySelector('#estado-filmes-ano');
    const aviso = document.querySelector('#aviso-filmes-ano');
    let buscaAtual = 0;

    function validarColocacoes() {
        for (const campo of campos) {
            const repetido = campo.value && campos.some((outro) => outro !== campo && outro.value === campo.value);
            campo.setCustomValidity(repetido ? 'Selecione três filmes diferentes para o pódio.' : '');
        }
    }

    async function atualizarFilmes() {
        const numeroBusca = ++buscaAtual;
        const selecionados = campos.map((campo) => campo.value);
        salvar.disabled = true;
        aviso.hidden = true;
        campos.forEach((campo) => {
            campo.replaceChildren(new Option('Selecione um filme', ''));
            campo.disabled = true;
            campo.setCustomValidity('');
        });
        if (!ano.value || !ano.validity.valid) {
            estado.textContent = 'Informe um ano válido para carregar os filmes.';
            return;
        }
        estado.textContent = 'Carregando filmes do ano selecionado…';
        try {
            const resposta = await fetch('/adm/gincana/filmes?ano=' + encodeURIComponent(ano.value), {
                headers: { Accept: 'application/json' }
            });
            if (resposta.redirected) throw new Error('Sua sessão expirou. Entre novamente na administração.');
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível carregar os filmes.');
            if (numeroBusca !== buscaAtual) return;
            campos.forEach((campo, indice) => {
                for (const filme of dados.filmes) {
                    const texto = `${filme.titulo} (${filme.ano})${filme.ativo ? '' : ' — desativado'}`;
                    campo.add(new Option(texto, filme.id));
                }
                if (dados.filmes.some((filme) => filme.id === selecionados[indice])) campo.value = selecionados[indice];
                campo.disabled = !dados.filmes.length;
            });
            salvar.disabled = dados.filmes.length < 3;
            aviso.hidden = dados.filmes.length >= 3;
            estado.textContent = dados.filmes.length ? `Mostrando filmes de ${ano.value}.` : `Nenhum filme cadastrado em ${ano.value}.`;
            validarColocacoes();
        } catch (erro) {
            if (numeroBusca !== buscaAtual) return;
            estado.textContent = erro.message || 'Não foi possível carregar os filmes. Altere o ano para tentar novamente.';
        }
    }

    // A sequência impede que uma resposta antiga substitua os filmes do ano atual.
    ano.addEventListener('input', atualizarFilmes);
    campos.forEach((campo) => campo.addEventListener('change', validarColocacoes));
    validarColocacoes();
}
