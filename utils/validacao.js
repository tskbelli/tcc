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

export const GENEROS = ['Ação', 'Comédia', 'Drama', 'Terror', 'Suspense', 'Romance', 'Ficção Científica', 'Animação'];

export function textoCampo(valor) {
    return typeof valor === 'string' ? valor.trim() : '';
}

export function idValido(valor) {
    return typeof valor === 'string' && /^[a-f\d]{24}$/i.test(valor);
}

export function anoValido(ano) {
    return Number.isInteger(ano) && ano >= 1895 && ano <= new Date().getFullYear();
}

export function dadosFilmeValidos(dados) {
    const erros = [];
    const ano = Number(dados.ano);
    const duracao = Number(dados.duracaoSegundos);

    if (!dados.titulo || dados.titulo.trim().length < 2) erros.push('Informe um título válido.');
    if (!dados.sinopse || dados.sinopse.trim().length < 10) erros.push('A sinopse deve ter pelo menos 10 caracteres.');
    if (!GENEROS.includes(dados.genero)) erros.push('Selecione um gênero válido.');
    if (!anoValido(ano)) erros.push('Informe um ano válido, sem ultrapassar o ano atual.');
    if (!Number.isInteger(duracao) || duracao < 1 || duracao > 300) {
        erros.push('Informe uma duração maior que zero e de até 5min00s, com minutos de 0 a 5 e segundos de 0 a 59.');
    }
    if (!urlValida(dados.link)) erros.push('Informe um link válido, começando com http:// ou https://.');

    return erros;
}

export function dadosEdicaoValidos(dados) {
    const erros = [];
    if (!anoValido(dados.ano)) erros.push('Informe o ano da edição, sem ultrapassar o ano atual.');
    const filmes = [dados.primeiro, dados.segundo, dados.terceiro];
    if (!filmes.every(idValido)) erros.push('Selecione um filme válido para cada uma das três posições.');
    if (filmes.every(idValido) && new Set(filmes.map((id) => id.toLowerCase())).size !== 3) {
        erros.push('Os três filmes da edição devem ser diferentes.');
    }
    return erros;
}
