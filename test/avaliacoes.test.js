import test from 'node:test';
import assert from 'node:assert/strict';
import Avaliacao from '../models/avaliacao.js';
import Filme from '../models/filme.js';
import AvaliacaoController from '../controllers/AvaliacaoController.js';
import { prepararAvaliacoes } from '../config/avaliacoes.js';
import { avaliacoesUnicas } from '../utils/avaliacoes.js';
import { converterNota, notaValida, formatarNota, preenchimentoEstrelas } from '../utils/notas.js';

const usuario = '507f1f77bcf86cd799439011';
const filme = '507f1f77bcf86cd799439012';

test('validação e Mongoose aceitam todas as meias estrelas e notas inteiras anteriores', async () => {
    for (let nota = 0.5; nota <= 5; nota += 0.5) {
        assert.equal(notaValida(nota), true);
        assert.equal(converterNota(String(nota)), nota);
        await new Avaliacao({ usuario, filme, nota }).validate();
    }
    assert.equal(converterNota('4,5'), 4.5);
    for (const nota of [0, 3.2, 4.7, 5.5, -1, NaN, Infinity]) {
        assert.equal(notaValida(nota), false);
        await assert.rejects(new Avaliacao({ usuario, filme, nota }).validate());
    }
    for (const nota of ['', null, true, ['4.5'], { $gt: 0 }, '0x5', '5e0', '4.5texto']) {
        assert.equal(Number.isNaN(converterNota(nota)), true);
    }
});

test('estrelas preenchem metades e médias sem converter para inteiro', () => {
    assert.deepEqual(preenchimentoEstrelas(0.5), [50, 0, 0, 0, 0]);
    assert.deepEqual(preenchimentoEstrelas(3), [100, 100, 100, 0, 0]);
    assert.deepEqual(preenchimentoEstrelas(3.5), [100, 100, 100, 50, 0]);
    assert.deepEqual(preenchimentoEstrelas(4.5), [100, 100, 100, 100, 50]);
    assert.deepEqual(preenchimentoEstrelas(4.8), [100, 100, 100, 100, 80]);
    assert.equal(formatarNota(4), '4');
    assert.equal(formatarNota(4.5), '4,5');
    assert.equal(formatarNota(4.833333), '4,8');
});

test('mesmo usuário atualiza a avaliação sem criar outra e não controla a identidade pelo body', async (t) => {
    t.mock.method(Filme, 'findOne', async () => ({ id: filme }));
    const registros = new Map();
    t.mock.method(Avaliacao, 'findOneAndUpdate', async (filtro, alteracao, opcoes) => {
        assert.equal(filtro.usuario, usuario);
        assert.equal(filtro.duplicadaDe, null);
        assert.equal(opcoes.runValidators, true);
        const chave = `${filtro.usuario}:${filtro.filme}`;
        const anterior = registros.get(chave) || null;
        const atual = new Avaliacao({ ...(anterior || filtro), ...alteracao.$set });
        await atual.validate();
        registros.set(chave, atual.toObject());
        return anterior;
    });
    const req = { params: { filmeId: filme }, session: { usuario: { id: usuario } }, body: { nota: '4.5', comentario: 'Primeiro comentário.', usuario: 'outro', duplicadaDe: filme } };
    const res = { redirect(url) { this.url = url; } };
    const controle = new AvaliacaoController();
    await controle.salvar(req, res);
    assert.equal(registros.size, 1);
    assert.equal([...registros.values()][0].nota, 4.5);
    assert.equal([...registros.values()][0].duplicadaDe, null);
    req.body = { nota: '3.5', comentario: 'Comentário atualizado.' };
    await controle.salvar(req, res);
    assert.equal(registros.size, 1);
    assert.equal([...registros.values()][0].nota, 3.5);
    assert.equal([...registros.values()][0].comentario, 'Comentário atualizado.');
    assert.match(req.session.mensagem.texto, /atualizada/);
    assert.equal(res.url, `/filmes/${filme}`);
});

test('envio simultâneo protegido pelo índice atualiza o registro vencedor', async (t) => {
    t.mock.method(Filme, 'findOne', async () => ({ id: filme }));
    let chamadas = 0;
    t.mock.method(Avaliacao, 'findOneAndUpdate', async (filtro, alteracao, opcoes) => {
        chamadas++;
        if (chamadas === 1) throw Object.assign(new Error('Duplicate key'), { code: 11000 });
        assert.equal(opcoes.upsert, undefined);
        assert.equal(filtro.usuario, usuario);
        assert.equal(alteracao.$set.nota, 0.5);
        return { nota: 4 };
    });
    const req = { params: { filmeId: filme }, session: { usuario: { id: usuario } }, body: { nota: '0.5' } };
    await new AvaliacaoController().salvar(req, { redirect() {} });
    assert.equal(chamadas, 2);
    assert.equal(req.session.mensagem.tipo, 'success');
});

test('controller rejeita valores adulterados antes de gravar no banco', async (t) => {
    const gravar = t.mock.method(Avaliacao, 'findOneAndUpdate', async () => {});
    for (const nota of ['0', '3.2', '4.7', '5.5', '-1', ['4.5'], { nota: 5 }, '']) {
        const req = { params: { filmeId: filme }, session: { usuario: { id: usuario } }, body: { nota } };
        await new AvaliacaoController().salvar(req, { redirect() {} });
        assert.equal(req.session.mensagem.tipo, 'danger');
    }
    assert.equal(gravar.mock.callCount(), 0);
});

test('históricos usam somente a avaliação mais recente de cada usuário e filme', () => {
    const atual = { usuario, filme, nota: 4.5, ativo: false };
    const antiga = { usuario, filme, nota: 5, ativo: true };
    const outra = { usuario: filme, filme, nota: 3.5, ativo: true };
    const arquivada = { usuario, filme: 'outro', nota: 5, duplicadaDe: filme };
    const unicas = avaliacoesUnicas([atual, antiga, outra, arquivada]);
    assert.deepEqual(unicas, [atual, outra]);
    assert.equal(unicas.filter((item) => item.ativo).length, 1);
});

test('preparação preserva duplicatas e seus comentários antes de criar o índice, e pode ser repetida', async (t) => {
    const atual = new Avaliacao({ usuario, filme, nota: 4.5, comentario: 'Comentário atual.' }).toObject();
    const antiga = new Avaliacao({ usuario, filme, nota: 3, comentario: 'Comentário antigo.', ativo: false }).toObject();
    delete antiga.duplicadaDe;
    const copiaAntiga = { ...antiga };
    let indice;
    t.mock.method(Avaliacao, 'createCollection', async () => {});
    t.mock.method(Avaliacao.collection, 'indexes', async () => indice ? [indice] : [{ name: '_id_', key: { _id: 1 } }]);
    t.mock.method(Avaliacao.collection, 'aggregate', () => (async function* () {
        yield { ids: [atual._id, antiga._id] };
    })());
    t.mock.method(Avaliacao.collection, 'updateMany', async (filtro, alteracao) => {
        assert.deepEqual(filtro._id.$in, [antiga._id]);
        antiga.duplicadaDe = alteracao.$set.duplicadaDe;
        return { modifiedCount: 1 };
    });
    const apagar = t.mock.method(Avaliacao.collection, 'deleteMany', async () => { throw new Error('Não apagar'); });
    t.mock.method(Avaliacao.collection, 'createIndex', async (key, opcoes) => {
        assert.equal(String(antiga.duplicadaDe), String(atual._id));
        assert.equal(opcoes.unique, true);
        assert.deepEqual(opcoes.partialFilterExpression, { duplicadaDe: null });
        indice = { key, ...opcoes };
        return opcoes.name;
    });
    assert.equal((await prepararAvaliacoes()).preservadas, 1);
    const { duplicadaDe, ...conteudoAntigo } = antiga;
    assert.deepEqual(conteudoAntigo, copiaAntiga);
    assert.equal(apagar.mock.callCount(), 0);
    assert.equal((await prepararAvaliacoes()).preservadas, 0);
});

test('preserva o índice único completo que já existia no IFCine', async (t) => {
    t.mock.method(Avaliacao, 'createCollection', async () => {});
    t.mock.method(Avaliacao.collection, 'indexes', async () => [{ name: 'usuario_1_filme_1', unique: true, key: { usuario: 1, filme: 1 } }]);
    const criar = t.mock.method(Avaliacao.collection, 'createIndex', async () => {});
    assert.equal((await prepararAvaliacoes()).indice, 'usuario_1_filme_1');
    assert.equal(criar.mock.callCount(), 0);
});
