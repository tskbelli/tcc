import test from 'node:test';
import assert from 'node:assert/strict';
import Filme from '../models/filme.js';
import EdicaoGincana from '../models/edicaoGincana.js';

const dados = { titulo: 'Curta', sinopse: 'Uma sinopse para o curta.', genero: 'Drama', ano: new Date().getFullYear(), link: 'https://example.com/filme' };

test('model valida o limite exato de duração', async () => {
    await new Filme({ ...dados, duracaoSegundos: 300 }).validate();
    for (const total of [0, 301, 3.5]) {
        await assert.rejects(new Filme({ ...dados, duracaoSegundos: total }).validate());
    }
});

test('model adapta a duração antiga sem trocar a capa', async () => {
    const filme = Filme.hydrate({ ...dados, duracao: 4, capaExterna: 'https://example.com/capa.jpg' });
    assert.equal(filme.duracaoSegundos, undefined);
    await filme.validate();
    assert.equal(filme.duracaoSegundos, 240);
    assert.equal(filme.capaSrc, 'https://example.com/capa.jpg');
    filme.capa = Buffer.from('imagem');
    filme.capaTipo = 'image/png';
    assert.match(filme.capaSrc, /^data:image\/png;base64,/);
    assert.equal(new Filme({ ...dados, capaExterna: 'javascript:alert(1)' }).capaSrc, null);
});

test('model rejeita posições repetidas ou incompletas e ano futuro', async () => {
    const edicao = { ano: new Date().getFullYear(), primeiro: '507f1f77bcf86cd799439011', segundo: '507f1f77bcf86cd799439012', terceiro: '507f1f77bcf86cd799439013' };
    await new EdicaoGincana(edicao).validate();
    await assert.rejects(new EdicaoGincana({ ...edicao, terceiro: edicao.primeiro }).validate());
    await assert.rejects(new EdicaoGincana({ ...edicao, segundo: null }).validate());
    await assert.rejects(new EdicaoGincana({ ...edicao, ano: edicao.ano + 1 }).validate());
});
