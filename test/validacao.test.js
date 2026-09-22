import test from 'node:test';
import assert from 'node:assert/strict';
import { dadosEdicaoValidos, dadosFilmeValidos, emailValido, escaparRegex, urlValida } from '../utils/validacao.js';
import { converterDuracao, formatarDuracao, obterDuracaoSegundos, separarDuracao } from '../utils/duracao.js';

const filmeValido = {
    titulo: 'Curta', sinopse: 'Uma sinopse com tamanho suficiente.', genero: 'Drama',
    ano: new Date().getFullYear(), duracaoSegundos: 287, link: 'https://example.com/filme'
};

test('valida e-mails básicos', () => {
    assert.equal(emailValido('aluna@ifsul.edu.br'), true);
    assert.equal(emailValido('email-invalido'), false);
});

test('aceita somente links HTTP e HTTPS', () => {
    assert.equal(urlValida('https://drive.google.com/arquivo'), true);
    assert.equal(urlValida('javascript:alert(1)'), false);
});

test('valida os dados obrigatórios do filme', () => {
    const erros = dadosFilmeValidos(filmeValido);
    assert.deepEqual(erros, []);
});

test('converte minutos e segundos, incluindo os limites de 1s e 5min00s', () => {
    for (const [minutos, segundos, total] of [[4, 47, 287], [3, 15, 195], [5, 0, 300], [1, 30, 90], [0, 1, 1], [0, 59, 59]]) {
        assert.equal(converterDuracao(String(minutos), String(segundos)), total);
    }
});

test('rejeita duração zerada, incompleta, fracionária, adulterada ou acima de 5min', () => {
    for (const [minutos, segundos] of [[0, 0], [-1, 30], [1, -1], [4, 60], [5, 1], [6, 0], [4.5, 0], [4, 2.5], ['', ''], [undefined, 0], [1, ''], [['4'], '47'], ['4e0', '47']]) {
        assert.equal(Number.isNaN(converterDuracao(minutos, segundos)), true, `${minutos}:${segundos}`);
    }
    for (const total of [0, 301, -1, 1.5, NaN]) {
        assert.ok(dadosFilmeValidos({ ...filmeValido, duracaoSegundos: total }).length);
    }
});

test('formata duração nova e interpreta filmes antigos em minutos', () => {
    assert.equal(formatarDuracao(287), '4min47s');
    assert.equal(formatarDuracao({ duracaoSegundos: 300 }), '5min00s');
    assert.equal(formatarDuracao({ duracao: 4 }), '4min00s');
    assert.equal(obterDuracaoSegundos({ duracao: 3 }), 180);
    assert.equal(obterDuracaoSegundos({ duracao: 5, duracaoSegundos: 195 }), 195);
    assert.deepEqual(separarDuracao({ duracaoSegundos: 287 }), { minutos: 4, segundos: 47 });
    assert.deepEqual(separarDuracao({ duracao: 5 }), { minutos: 5, segundos: 0 });
});

test('filmes rejeitam ano futuro e gênero fora das opções', () => {
    assert.ok(dadosFilmeValidos({ ...filmeValido, ano: filmeValido.ano + 1 }).length);
    assert.ok(dadosFilmeValidos({ ...filmeValido, genero: 'Inventado' }).length);
});

test('edições exigem ano válido e três filmes diferentes', () => {
    const dados = { ano: new Date().getFullYear(), primeiro: '507f1f77bcf86cd799439011', segundo: '507f1f77bcf86cd799439012', terceiro: '507f1f77bcf86cd799439013' };
    assert.deepEqual(dadosEdicaoValidos(dados), []);
    for (const alteracao of [{ ano: undefined }, { ano: dados.ano + 1 }, { ano: 2020.5 }, { primeiro: '' }, { segundo: 'inexistente' }, { terceiro: dados.primeiro.toUpperCase() }]) {
        assert.ok(dadosEdicaoValidos({ ...dados, ...alteracao }).length);
    }
});

test('escapa caracteres especiais da pesquisa', () => {
    assert.equal(escaparRegex('filme.*'), 'filme\\.\\*');
});
