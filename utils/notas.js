export function notaValida(nota) {
    return typeof nota === 'number' && Number.isFinite(nota)
        && nota >= 0.5 && nota <= 5 && Number.isInteger(nota * 2);
}

export function converterNota(valor) {
    if (typeof valor !== 'string' && typeof valor !== 'number') return NaN;
    const texto = String(valor).trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(texto)) return NaN;
    const nota = Number(texto.replace(',', '.'));
    return notaValida(nota) ? nota : NaN;
}

export function formatarNota(nota) {
    return typeof nota === 'number' && Number.isFinite(nota) && nota > 0
        ? nota.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—';
}

// Médias como 4,2 também são representadas proporcionalmente, sem perder a precisão.
export function preenchimentoEstrelas(nota) {
    const valor = Number.isFinite(nota) ? Math.max(0, Math.min(5, nota)) : 0;
    return [0, 1, 2, 3, 4].map((indice) => Math.round(Math.min(1, Math.max(0, valor - indice)) * 100));
}
