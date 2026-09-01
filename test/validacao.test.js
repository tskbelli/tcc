import test from 'node:test';
import assert from 'node:assert/strict';
import { dadosFilmeValidos, emailValido, escaparRegex, urlValida } from '../utils/validacao.js';

test('valida e-mails básicos', () => {
    assert.equal(emailValido('aluna@ifsul.edu.br'), true);
    assert.equal(emailValido('email-invalido'), false);
});

test('aceita somente links HTTP e HTTPS', () => {
    assert.equal(urlValida('https://drive.google.com/arquivo'), true);
    assert.equal(urlValida('javascript:alert(1)'), false);
});

test('valida os dados obrigatórios do filme', () => {
    const erros = dadosFilmeValidos({
        titulo: 'Curta',
        sinopse: 'Uma sinopse com tamanho suficiente.',
        genero: 'Drama',
        ano: 2026,
        duracao: 5,
        link: 'https://example.com/filme',
        capaExterna: ''
    });
    assert.deepEqual(erros, []);
});

test('escapa caracteres especiais da pesquisa', () => {
    assert.equal(escaparRegex('filme.*'), 'filme\\.\\*');
});
