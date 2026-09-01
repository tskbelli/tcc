export function emailValido(email = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function urlValida(endereco = '') {
    try {
        const url = new URL(endereco);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export function escaparRegex(texto = '') {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function dadosFilmeValidos(dados) {
    const erros = [];
    const anoAtual = new Date().getFullYear() + 5;
    const ano = Number(dados.ano);
    const duracao = Number(dados.duracao);

    if (!dados.titulo || dados.titulo.trim().length < 2) erros.push('Informe um título válido.');
    if (!dados.sinopse || dados.sinopse.trim().length < 10) erros.push('A sinopse deve ter pelo menos 10 caracteres.');
    if (!dados.genero || dados.genero.trim().length < 2) erros.push('Informe o gênero.');
    if (!Number.isInteger(ano) || ano < 1895 || ano > anoAtual) erros.push('Informe um ano válido.');
    if (!Number.isInteger(duracao) || duracao < 1 || duracao > 600) erros.push('Informe uma duração entre 1 e 600 minutos.');
    if (!urlValida(dados.link)) erros.push('Informe um link válido, começando com http:// ou https://.');
    if (dados.capaExterna && !urlValida(dados.capaExterna)) erros.push('A URL da capa não é válida.');

    return erros;
}
