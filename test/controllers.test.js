import test from 'node:test';
import assert from 'node:assert/strict';
import Filme from '../models/filme.js';
import Avaliacao from '../models/avaliacao.js';
import Edicao from '../models/edicaoGincana.js';
import FilmeController from '../controllers/FilmeController.js';
import DestaquesController from '../controllers/DestaquesController.js';
import EdicaoGincanaController from '../controllers/EdicaoGincanaController.js';
import { somenteAdmin } from '../middlewares/auth.js';

function resposta() {
    return {
        codigo: 200,
        status(codigo) { this.codigo = codigo; return this; },
        render(view, dados) { this.view = view; this.dados = dados; return this; },
        redirect(url) { this.url = url; return this; }
    };
}

const ano = new Date().getFullYear();
const body = { titulo: 'Curta', sinopse: 'Uma sinopse completa para o filme.', genero: 'Drama', ano: String(ano), minutos: '4', segundos: '47', link: 'https://example.com/curta', ativo: 'on' };

test('Destaques ordena pela média exata, quantidade e título, sem incluir filmes sem notas', async (t) => {
    const filmes = ['Aurora', 'Bosque', 'Cinema', 'Deserto', 'Sem notas'].map((titulo) => new Filme({ ...body, titulo, duracaoSegundos: 287 }));
    const notas = [
        { _id: filmes[0]._id, media: 4.91, quantidade: 1 },
        { _id: filmes[1]._id, media: 4.94, quantidade: 1 },
        { _id: filmes[2]._id, media: 4.94, quantidade: 2 },
        { _id: filmes[3]._id, media: 4.94, quantidade: 2 }
    ];
    t.mock.method(Filme, 'find', (consulta) => consulta._id
        ? Promise.resolve(filmes.filter((filme) => consulta._id.$in.some((id) => id.equals(filme._id))))
        : { select: async () => filmes });
    t.mock.method(Avaliacao, 'aggregate', async () => notas);
    t.mock.method(Edicao, 'distinct', async () => [ano - 1, ano]);
    let consultaEdicao;
    t.mock.method(Edicao, 'findOne', (consulta) => {
        consultaEdicao = consulta;
        return { populate: async () => ({ ano: consulta.ano, primeiro: filmes[0], segundo: filmes[1], terceiro: filmes[2] }) };
    });
    const res = resposta();
    await new DestaquesController().index({ query: {} }, res);
    assert.equal(res.codigo, 200);
    assert.deepEqual(res.dados.ranking.map((item) => item.filme.titulo), ['Cinema', 'Deserto', 'Bosque']);
    assert.deepEqual(res.dados.ranking.map((item) => item.posicao), [1, 2, 3]);
    assert.equal(res.dados.ganhadores.length, 3);
    assert.equal(consultaEdicao.ano, ano);
    await new DestaquesController().index({ query: { ano: String(ano - 1) } }, res);
    assert.equal(consultaEdicao.ano, ano - 1);
});

test('edição inválida retorna o formulário com os valores e não grava', async (t) => {
    const filme = new Filme({ ...body, duracaoSegundos: 287 });
    t.mock.method(Filme, 'find', () => ({ select: () => ({ sort: async () => [filme] }) }));
    const gravar = t.mock.method(Edicao, 'create', async () => { throw new Error('Não deve gravar'); });
    const res = resposta();
    await new EdicaoGincanaController().add({ body: { ano: String(ano), primeiro: filme.id, segundo: filme.id, terceiro: filme.id }, params: {}, session: {} }, res);
    assert.equal(res.codigo, 400);
    assert.equal(res.view, 'adm/gincana/add');
    assert.equal(res.dados.edicao.primeiro, filme.id);
    assert.match(res.dados.mensagem.texto, /diferentes/);
    assert.equal(gravar.mock.callCount(), 0);
});

test('edição com ano repetido ou referência ausente é rejeitada pelo controller', async (t) => {
    const filmes = [1, 2, 3].map(() => new Filme({ ...body, duracaoSegundos: 287 }));
    t.mock.method(Filme, 'find', () => ({ select: () => ({ sort: async () => filmes }) }));
    const quantidade = t.mock.method(Filme, 'countDocuments', async () => 3);
    const repetida = t.mock.method(Edicao, 'exists', async () => ({ _id: filmes[0]._id }));
    const gravar = t.mock.method(Edicao, 'create', async () => {});
    const req = { body: { ano: String(ano), primeiro: filmes[0].id, segundo: filmes[1].id, terceiro: filmes[2].id }, params: {}, session: {} };
    let res = resposta();
    await new EdicaoGincanaController().add(req, res);
    assert.equal(res.codigo, 400);
    assert.match(res.dados.mensagem.texto, /Já existe/);
    repetida.mock.mockImplementation(async () => null);
    quantidade.mock.mockImplementation(async () => 2);
    res = resposta();
    await new EdicaoGincanaController().add(req, res);
    assert.equal(res.codigo, 400);
    assert.match(res.dados.mensagem.texto, /Filmes de outro ano/);
    assert.equal(gravar.mock.callCount(), 0);
});

test('editar sem arquivo preserva a capa antiga, ignora URL enviada e converte a duração', async (t) => {
    const filme = new Filme({ ...body, duracao: 4, capaExterna: 'https://example.com/antiga.jpg' });
    t.mock.method(Filme, 'findById', async () => filme);
    t.mock.method(filme, 'save', async () => filme.validate());
    const req = { params: { id: filme.id }, session: {}, body: { ...body, capaExterna: 'https://example.com/nova.jpg' } };
    const res = resposta();
    await new FilmeController().edt(req, res);
    assert.equal(res.url, '/adm/filme/lst');
    assert.equal(filme.capaExterna, 'https://example.com/antiga.jpg');
    assert.equal(filme.duracaoSegundos, 287);
    assert.equal(filme.duracao, undefined);
    req.file = { buffer: Buffer.from('imagem'), mimetype: 'image/png' };
    await new FilmeController().edt(req, resposta());
    assert.equal(filme.capaExterna, undefined);
    assert.equal(filme.capaTipo, 'image/png');
    assert.ok(filme.capa.equals(req.file.buffer));
});

test('erro de duração preserva a capa e o ID na edição, sem salvar', async (t) => {
    const filme = new Filme({ ...body, duracaoSegundos: 287, capa: Buffer.from('imagem'), capaTipo: 'image/png' });
    t.mock.method(Filme, 'findById', async () => filme);
    const gravar = t.mock.method(filme, 'save', async () => {});
    const res = resposta();
    await new FilmeController().edt({ body: { ...body, minutos: '5', segundos: '1' }, params: { id: filme.id }, session: {} }, res);
    assert.equal(res.codigo, 400);
    assert.equal(res.dados.filme.id, filme.id);
    assert.equal(res.dados.filme.capaSrc, filme.capaSrc);
    assert.equal(res.dados.filme.segundos, '1');
    assert.equal(filme.duracaoSegundos, 287);
    assert.equal(gravar.mock.callCount(), 0);
});

test('filme premiado não pode ser excluído junto com suas avaliações', async (t) => {
    t.mock.method(Edicao, 'exists', async () => ({ ano }));
    const excluirFilme = t.mock.method(Filme, 'findByIdAndDelete', async () => {});
    const excluirNotas = t.mock.method(Avaliacao, 'deleteMany', async () => {});
    const req = { params: { id: '507f1f77bcf86cd799439011' }, session: {} };
    const res = resposta();
    await new FilmeController().del(req, res);
    assert.match(req.session.mensagem.texto, /ganhador/);
    assert.equal(excluirFilme.mock.callCount(), 0);
    assert.equal(excluirNotas.mock.callCount(), 0);
});

test('somente administradores podem prosseguir nas rotas protegidas', () => {
    let autorizado = 0;
    for (const usuario of [undefined, { tipo: 'usuario' }, { tipo: 'admin' }]) {
        const req = { session: { usuario } };
        const res = resposta();
        somenteAdmin(req, res, () => autorizado++);
        if (!usuario) assert.equal(res.url, '/adm/login');
        else if (usuario.tipo === 'usuario') assert.equal(res.url, '/');
    }
    assert.equal(autorizado, 1);
});
