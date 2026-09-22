import test from 'node:test';
import assert from 'node:assert/strict';
import Filme from '../models/filme.js';
import Edicao from '../models/edicaoGincana.js';
import EdicaoGincanaController from '../controllers/EdicaoGincanaController.js';
import FilmeController from '../controllers/FilmeController.js';

const ano = new Date().getFullYear();
const filmes = [ano, ano, ano, ano - 1].map((anoFilme, indice) => new Filme({
    titulo: 'Filme ' + indice, sinopse: 'Sinopse completa de teste.', ano: anoFilme, genero: 'Drama',
    duracaoSegundos: 287, link: 'https://example.com/curta'
}));
function resposta() {
    return {
        codigo: 200,
        status(codigo) { this.codigo = codigo; return this; },
        render(view, dados) { this.view = view; this.dados = dados; },
        json(dados) { this.dados = dados; },
        redirect(url) { this.url = url; }
    };
}
function simularFilmes(t) {
    t.mock.method(Filme, 'find', (consulta) => ({ select: () => ({ sort: async () => filmes.filter((filme) => filme.ano === consulta.ano) }) }));
    t.mock.method(Filme, 'countDocuments', async (consulta) => filmes.filter((filme) => consulta._id.$in.includes(filme.id) && filme.ano === consulta.ano).length);
}

test('endpoint e formulário inicial retornam exclusivamente filmes do ano escolhido', async (t) => {
    simularFilmes(t);
    const controle = new EdicaoGincanaController();
    const res = resposta();
    await controle.filmesDoAno({ query: { ano: String(ano - 1) } }, res);
    assert.equal(res.codigo, 200);
    assert.deepEqual(res.dados.filmes.map((filme) => filme.id), [filmes[3].id]);
    await controle.openAdd({}, res);
    assert.deepEqual(res.dados.filmes.map((filme) => filme.id), filmes.slice(0, 3).map((filme) => filme.id));
    for (const invalido of ['', String(ano + 1), '2020.5', 'texto', ['2026']]) {
        const erro = resposta();
        await controle.filmesDoAno({ query: { ano: invalido } }, erro);
        assert.equal(erro.codigo, 400);
    }
});

test('backend rejeita ID de outro ano e mantém somente opções do ano no formulário com erro', async (t) => {
    simularFilmes(t);
    t.mock.method(Edicao, 'exists', async () => null);
    const gravar = t.mock.method(Edicao, 'create', async () => {});
    const req = { body: { ano: String(ano), primeiro: filmes[0].id, segundo: filmes[1].id, terceiro: filmes[3].id }, params: {}, session: {} };
    const res = resposta();
    await new EdicaoGincanaController().add(req, res);
    assert.equal(res.codigo, 400);
    assert.match(res.dados.mensagem.texto, /Filmes de outro ano/);
    assert.ok(res.dados.filmes.every((filme) => filme.ano === ano));
    assert.equal(gravar.mock.callCount(), 0);
});

test('backend cadastra três filmes diferentes do mesmo ano', async (t) => {
    simularFilmes(t);
    t.mock.method(Edicao, 'exists', async () => null);
    const gravar = t.mock.method(Edicao, 'create', async (dados) => new Edicao(dados).validate());
    const req = { body: { ano: String(ano), primeiro: filmes[0].id, segundo: filmes[1].id, terceiro: filmes[2].id }, params: {}, session: {} };
    const res = resposta();
    await new EdicaoGincanaController().add(req, res);
    assert.equal(res.url, '/adm/gincana/lst');
    assert.equal(gravar.mock.callCount(), 1);
});

test('edição antiga de outro ano exige a seleção de novos vencedores', async (t) => {
    simularFilmes(t);
    const edicao = new Edicao({ ano, primeiro: filmes[0]._id, segundo: filmes[1]._id, terceiro: filmes[2]._id });
    t.mock.method(Edicao, 'findById', async () => edicao);
    t.mock.method(Edicao, 'exists', async () => null);
    const gravar = t.mock.method(edicao, 'save', async () => {});
    const res = resposta();
    await new EdicaoGincanaController().edt({ params: { id: edicao.id }, session: {}, body: {
        ano: String(ano - 1), primeiro: filmes[0].id, segundo: filmes[1].id, terceiro: filmes[2].id
    } }, res);
    assert.equal(res.codigo, 400);
    assert.equal(gravar.mock.callCount(), 0);
    assert.equal(edicao.ano, ano);
});

test('alterar o ano de um filme premiado não pode invalidar o pódio existente', async (t) => {
    const filme = filmes[0];
    t.mock.method(Filme, 'findById', async () => filme);
    t.mock.method(Edicao, 'exists', async (consulta) => {
        assert.equal(consulta.ano.$ne, ano - 1);
        return { _id: filme._id };
    });
    const gravar = t.mock.method(filme, 'save', async () => {});
    const res = resposta();
    await new FilmeController().edt({ params: { id: filme.id }, session: {}, body: {
        titulo: filme.titulo, sinopse: filme.sinopse, genero: filme.genero, link: filme.link,
        ano: String(ano - 1), minutos: '4', segundos: '47', ativo: 'on'
    } }, res);
    assert.equal(res.codigo, 400);
    assert.match(res.dados.mensagem.texto, /Ajuste a edição/);
    assert.equal(gravar.mock.callCount(), 0);
    assert.equal(filme.ano, ano);
});
