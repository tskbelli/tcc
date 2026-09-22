// Os formulários usam minutos e segundos; o banco recebe o total de segundos.
export function converterDuracao(minutos, segundos) {
    const inteiro = (valor) => (typeof valor === 'string' || typeof valor === 'number')
        && /^\d+$/.test(String(valor).trim());
    if (!inteiro(minutos) || !inteiro(segundos)) return NaN;

    minutos = Number(minutos);
    segundos = Number(segundos);
    const total = minutos * 60 + segundos;
    if (minutos > 5 || segundos > 59 || total < 1 || total > 300) return NaN;
    return total;
}

export function obterDuracaoSegundos(filme) {
    // Compatibilidade: o campo antigo "duracao" era armazenado em minutos.
    if (filme.duracaoSegundos != null) return Number(filme.duracaoSegundos);
    if (filme.duracao != null) return Math.round(Number(filme.duracao) * 60);
    return NaN;
}

export function separarDuracao(filme) {
    if (filme.minutos != null || filme.segundos != null) {
        return { minutos: filme.minutos ?? '', segundos: filme.segundos ?? '' };
    }
    const total = obterDuracaoSegundos(filme);
    return Number.isFinite(total)
        ? { minutos: Math.floor(total / 60), segundos: total % 60 }
        : { minutos: '', segundos: '' };
}

export function formatarDuracao(filmeOuSegundos) {
    const total = typeof filmeOuSegundos === 'object' && filmeOuSegundos
        ? obterDuracaoSegundos(filmeOuSegundos) : Number(filmeOuSegundos);
    if (!Number.isInteger(total) || total < 1) return 'Duração não informada';
    return `${Math.floor(total / 60)}min${String(total % 60).padStart(2, '0')}s`;
}
