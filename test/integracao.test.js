import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Opcional: usa um banco descartável próprio, sem acessar o banco do .env.
test('fluxos HTTP e persistência no MongoDB', { skip: !process.env.IFCINE_TEST_MONGODB_URI, timeout: 60000 }, async (t) => {
    const uri = new URL(process.env.IFCINE_TEST_MONGODB_URI);
    uri.pathname = '/ifcine_test_' + randomUUID().replaceAll('-', '');
    process.env.MONGODB_URI = uri.toString();
    process.env.NODE_ENV = 'test';

    const { default: app } = await import('../index.js');
    const { default: mongoose } = await import('../config/conexao.js');
    const { default: Filme } = await import('../models/filme.js');
    const { default: Usuario } = await import('../models/usuario.js');
    const { default: Avaliacao } = await import('../models/avaliacao.js');
    const { default: Edicao } = await import('../models/edicaoGincana.js');
    const { default: bcrypt } = await import('bcryptjs');
    const { resumirAvaliacoes } = await import('../utils/avaliacoes.js');
    await Promise.all([Filme.init(), Usuario.init(), Avaliacao.init(), Edicao.init()]);
    const servidor = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => servidor.once('listening', resolve));
    const base = `http://127.0.0.1:${servidor.address().port}`;
    t.after(async () => {
        await new Promise((resolve) => servidor.close(resolve));
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });

    function cliente() {
        let cookie = '';
        return async (caminho, dados, arquivo) => {
            const opcoes = { redirect: 'manual', headers: { cookie } };
            if (dados) {
                opcoes.method = 'POST';
                if (arquivo) {
                    const form = new FormData();
                    for (const [nome, valor] of Object.entries(dados)) form.set(nome, String(valor));
                    form.set('capa', new Blob([arquivo.buffer], { type: arquivo.tipo }), arquivo.nome);
                    opcoes.body = form;
                } else {
                    opcoes.body = new URLSearchParams(dados);
                }
            }
            const resposta = await fetch(base + caminho, opcoes);
            const novaSessao = resposta.headers.getSetCookie().find((item) => item.startsWith('ifcine.sid='));
            if (novaSessao) cookie = novaSessao.split(';')[0];
            return { status: resposta.status, local: resposta.headers.get('location'), html: await resposta.text() };
        };
    }

    const visitante = cliente();
    const aluno = cliente();
    const admin = cliente();
    const ano = new Date().getFullYear();
    const senha = randomUUID();
    const administrador = await Usuario.create({ nome: 'Admin Teste', email: 'admin@example.test', senha: await bcrypt.hash(senha, 4), tipo: 'admin' });
    const baseFilme = { titulo: 'Aurora', sinopse: 'Uma produção acadêmica usada somente nos testes.', genero: 'Drama', ano: String(ano), minutos: '4', segundos: '47', link: 'https://example.com/curta', ativo: 'on' };
    let principal, segundo, terceiro, inativo, semNotas, alunoCadastrado, edicao;

    await t.test('cadastro, login, sessão, perfil e proteção administrativa', async () => {
        let resposta = await aluno('/cadastro', { nome: 'Aluno Teste', email: 'aluno@example.test', senha, confirmarSenha: senha });
        assert.equal(resposta.local, '/login');
        resposta = await aluno('/login', { email: 'aluno@example.test', senha });
        assert.equal(resposta.local, '/');
        alunoCadastrado = await Usuario.findOne({ email: 'aluno@example.test' });
        assert.equal((await aluno('/perfil')).status, 200);
        for (const rota of ['/adm/gincana/lst', '/adm/gincana/add', '/adm/gincana/filmes?ano=' + ano, '/adm/gincana/edt/507f1f77bcf86cd799439011']) {
            assert.equal((await visitante(rota)).local, '/adm/login');
            assert.equal((await aluno(rota)).local, '/');
        }
        for (const rota of ['/adm/gincana/add', '/adm/gincana/edt/507f1f77bcf86cd799439011', '/adm/gincana/del/507f1f77bcf86cd799439011']) {
            assert.equal((await visitante(rota, { ano })).local, '/adm/login');
            assert.equal((await aluno(rota, { ano })).local, '/');
        }
        assert.equal((await admin('/adm/login', { email: administrador.email, senha })).local, '/adm');
    });

    await t.test('upload, duração exata e rejeição dos limites inválidos', async () => {
        const capa = { buffer: await readFile(new URL('../public/img/logo-principal.jpg', import.meta.url)), tipo: 'image/jpeg', nome: 'capa.jpeg' };
        assert.equal((await admin('/adm/filme/add', baseFilme, capa)).local, '/adm/filme/lst');
        principal = await Filme.findOne({ titulo: 'Aurora' });
        assert.equal(principal.duracaoSegundos, 287);
        assert.equal(principal.capaTipo, 'image/jpeg');
        assert.ok(principal.capa.equals(capa.buffer));
        for (const alteracao of [{ minutos: '5', segundos: '1' }, { minutos: '0', segundos: '0' }, { segundos: '60' }, { minutos: '-1' }, { segundos: '1.5' }, { ano: String(ano + 1) }]) {
            assert.equal((await admin('/adm/filme/add', { ...baseFilme, ...alteracao })).status, 400);
        }
        assert.equal(await Filme.countDocuments(), 1);
        await admin('/adm/filme/add', { ...baseFilme, titulo: 'Sem notas', capaExterna: 'https://example.com/nao-permitida.jpg', capaUrl: 'https://example.com/nao-permitida.jpg' });
        semNotas = await Filme.findOne({ titulo: 'Sem notas' });
        assert.equal(semNotas.capaSrc, null);
        assert.equal(semNotas.capaExterna, undefined);
        const invalida = { buffer: Buffer.from('arquivo de texto'), tipo: 'image/jpeg', nome: 'falsa.jpg' };
        await admin('/adm/filme/add', { ...baseFilme, titulo: 'Imagem inválida' }, invalida);
        await admin('/adm/filme/add', { ...baseFilme, titulo: 'Imagem inválida' }, { ...invalida, nome: 'arquivo.svg', tipo: 'image/svg+xml' });
        await admin('/adm/filme/add', { ...baseFilme, titulo: 'Imagem inválida' }, { ...capa, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
        assert.equal(await Filme.countDocuments({ titulo: 'Imagem inválida' }), 0);
        const alteracao = await admin(`/adm/filme/edt/${principal.id}`, { ...baseFilme, minutos: '3', segundos: '15', capaExterna: 'https://example.com/troca.jpg' });
        assert.equal(alteracao.local, '/adm/filme/lst');
        principal = await Filme.findById(principal.id);
        assert.equal(principal.duracaoSegundos, 195);
        assert.ok(principal.capa.equals(capa.buffer));
        assert.equal(principal.capaExterna, undefined);
    });

    await t.test('filme antigo mantém capa e converte minutos na edição; substituição por arquivo', async () => {
        const legado = await Filme.collection.insertOne({ titulo: 'Legado', sinopse: baseFilme.sinopse, genero: 'Drama', ano: ano - 1, duracao: 4, link: baseFilme.link, ativo: true, capaExterna: 'https://example.com/legado.jpg' });
        let resposta = await admin(`/adm/filme/edt/${legado.insertedId}`);
        assert.match(resposta.html, /id="minutos"[^>]+value="4"/);
        assert.match(resposta.html, /https:\/\/example.com\/legado.jpg/);
        resposta = await admin(`/adm/filme/edt/${legado.insertedId}`, { ...baseFilme, titulo: 'Legado', minutos: '4', segundos: '0' });
        assert.equal(resposta.local, '/adm/filme/lst');
        let filme = await Filme.findById(legado.insertedId);
        assert.equal(filme.duracaoSegundos, 240);
        assert.equal(filme.duracao, undefined);
        assert.equal(filme.capaSrc, 'https://example.com/legado.jpg');
        const png = { buffer: await readFile(new URL('../public/img/logo-cabecalho.png', import.meta.url)), tipo: 'image/png', nome: 'nova.PNG' };
        await admin(`/adm/filme/edt/${filme.id}`, { ...baseFilme, titulo: 'Legado', minutos: '5', segundos: '0' }, png);
        filme = await Filme.findById(filme.id);
        assert.equal(filme.capaTipo, 'image/png');
        assert.equal(filme.capaExterna, undefined);
        assert.equal(filme.duracaoSegundos, 300);
        assert.ok(filme.capa.equals(png.buffer));
        segundo = filme;
        await admin('/adm/filme/add', { ...baseFilme, titulo: 'Caminhos', ano: String(ano - 1), genero: 'Comédia' });
        terceiro = await Filme.findOne({ titulo: 'Caminhos' });
        await admin('/adm/filme/add', { ...baseFilme, titulo: 'Inativo', ativo: '' });
        inativo = await Filme.findOne({ titulo: 'Inativo' });
    });

    await t.test('catálogo combina título, gênero e ano e conserva duração e botão Assistir', async () => {
        let resposta = await visitante(`/?busca=Caminhos&genero=Com%C3%A9dia&ano=${ano - 1}`);
        assert.equal(resposta.status, 200);
        assert.match(resposta.html, /Filmes em cartaz/);
        assert.doesNotMatch(resposta.html, /filmes? encontrados?/);
        assert.match(resposta.html, /4min47s/);
        resposta = await visitante(`/?busca=Caminhos&ano=${ano}`);
        assert.match(resposta.html, /Nenhum filme encontrado/);
        resposta = await visitante(`/filmes/${principal.id}`);
        assert.match(resposta.html, /3min15s/);
        assert.match(resposta.html, /href="https:\/\/example.com\/curta"/);
        assert.equal((await visitante(`/filmes/${inativo.id}`)).status, 404);
    });

    await t.test('avaliações, resenhas, média, desempate, moderação e filmes sem notas', async () => {
        assert.match((await visitante('/destaques')).html, /O ranking começa com a primeira avaliação/);
        const caminho = `/filmes/${principal.id}/avaliar`;
        assert.equal((await visitante(caminho, { nota: '5' })).local, '/login');
        await aluno(caminho, { nota: '5', comentario: 'Resenha de teste.' });
        assert.equal(await Avaliacao.countDocuments({ filme: principal._id }), 1);
        assert.match((await visitante(`/filmes/${principal.id}`)).html, /Resenha de teste/);
        await aluno(caminho, { nota: '4.5', comentario: 'Resenha atualizada.' });
        await aluno(caminho, { nota: '4.7' });
        assert.equal(await Avaliacao.countDocuments({ filme: principal._id }), 1);
        assert.equal((await Avaliacao.findOne({ filme: principal._id })).nota, 4.5);
        assert.match((await visitante(`/filmes/${principal.id}`)).html, /4,5 de 5 estrelas/);
        await aluno(caminho, { nota: '4', comentario: 'Resenha atualizada.' });
        let html = (await visitante('/destaques')).html;
        assert.equal((html.match(/data-posicao=/g) || []).length, 1);
        await Avaliacao.create([
            { usuario: administrador._id, filme: principal._id, nota: 5 },
            { usuario: administrador._id, filme: segundo._id, nota: 5 },
            { usuario: alunoCadastrado._id, filme: segundo._id, nota: 5 },
            { usuario: administrador._id, filme: terceiro._id, nota: 5 },
            { usuario: administrador._id, filme: inativo._id, nota: 5 }
        ]);
        html = (await visitante('/destaques')).html;
        const podio = html.split('<section id="gincana"')[0];
        assert.ok(podio.indexOf(`href="/filmes/${segundo.id}"`) < podio.indexOf(`href="/filmes/${terceiro.id}"`));
        assert.ok(podio.indexOf(`href="/filmes/${terceiro.id}"`) < podio.indexOf(`href="/filmes/${principal.id}"`));
        assert.match(podio, /4,5 \/ 5/);
        assert.match(podio, /2 avaliações/);
        assert.doesNotMatch(podio, /Sem notas|Inativo/);
        const nota = await Avaliacao.findOne({ filme: terceiro._id });
        await admin(`/adm/avaliacao/ativo/${nota.id}`, {});
        assert.doesNotMatch((await visitante('/destaques')).html, /Caminhos/);
        await admin(`/adm/avaliacao/ativo/${nota.id}`, {});
    });

    await t.test('média preserva casas decimais e atualizações mantêm um único registro', async () => {
        const terceiroUsuario = await Usuario.create({ nome: 'Terceiro Teste', email: 'terceiro@example.test', senha: await bcrypt.hash(senha, 4) });
        await Avaliacao.create([
            { usuario: administrador._id, filme: semNotas._id, nota: 4.5 },
            { usuario: alunoCadastrado._id, filme: semNotas._id, nota: 5 },
            { usuario: terceiroUsuario._id, filme: semNotas._id, nota: 4 }
        ]);
        let resumo = (await resumirAvaliacoes([semNotas._id]))[0];
        assert.equal(resumo.media, 4.5);
        assert.equal(resumo.quantidade, 3);
        await aluno(`/filmes/${semNotas.id}/avaliar`, { nota: '3.5' });
        resumo = (await resumirAvaliacoes([semNotas._id]))[0];
        assert.equal(resumo.media, 4);
        assert.equal(resumo.quantidade, 3);
        assert.equal(await Avaliacao.countDocuments({ usuario: alunoCadastrado._id, filme: semNotas._id, duplicadaDe: null }), 1);
        await assert.rejects(Avaliacao.create({ usuario: alunoCadastrado._id, filme: semNotas._id, nota: 5 }), (erro) => erro.code === 11000);
    });

    await t.test('edições exigem três referências válidas e ano único, inclusive no índice MongoDB', async () => {
        const lista = JSON.parse((await admin(`/adm/gincana/filmes?ano=${ano}`)).html).filmes;
        assert.ok(lista.every((filme) => filme.ano === ano));
        assert.ok(!lista.some((filme) => filme.id === terceiro.id));
        const dados = { ano: String(ano), primeiro: principal.id, segundo: segundo.id, terceiro: terceiro.id };
        for (const alteracao of [{ ano: '' }, { ano: String(ano + 1) }, { primeiro: '' }, { terceiro: principal.id }, { segundo: '507f1f77bcf86cd799439099' }, { segundo: 'inválido' }]) {
            assert.equal((await admin('/adm/gincana/add', { ...dados, ...alteracao })).status, 400);
        }
        assert.equal((await admin('/adm/gincana/add', dados)).status, 400);
        await admin(`/adm/filme/edt/${terceiro.id}`, { ...baseFilme, titulo: 'Caminhos', ano: String(ano) });
        assert.equal(await Edicao.countDocuments(), 0);
        assert.equal((await admin('/adm/gincana/add', dados)).local, '/adm/gincana/lst');
        edicao = await Edicao.findOne({ ano });
        assert.equal((await admin('/adm/gincana/add', dados)).status, 400);
        await assert.rejects(Edicao.create(dados), (erro) => erro.code === 11000);
        assert.equal(await Edicao.countDocuments(), 1);
        assert.match((await admin('/adm/gincana/lst')).html, /Aurora/);
        assert.match((await admin(`/adm/gincana/edt/${edicao.id}`)).html, new RegExp(`value="${principal.id}" selected`));
        let html = (await visitante(`/destaques?ano=${ano}`)).html;
        assert.equal((html.split('<section id="gincana"')[1].match(/data-posicao=/g) || []).length, 3);
        const filmesAnteriores = await Filme.create([1, 2, 3].map((numero) => ({
            titulo: 'Anterior ' + numero, sinopse: baseFilme.sinopse, genero: 'Drama', ano: ano - 1,
            duracaoSegundos: 287, link: baseFilme.link
        })));
        await admin('/adm/gincana/add', { ano: String(ano - 1), primeiro: filmesAnteriores[0].id, segundo: filmesAnteriores[1].id, terceiro: filmesAnteriores[2].id });
        assert.equal((await admin(`/adm/gincana/edt/${edicao.id}`, { ...dados, ano: String(ano - 1) })).status, 400);
        assert.equal((await admin(`/adm/gincana/edt/${edicao.id}`, { ...dados, primeiro: segundo.id, segundo: principal.id })).status, 302);
        html = (await visitante(`/destaques?ano=${ano - 1}`)).html.split('<section id="gincana"')[1];
        assert.ok(html.indexOf(`href="/filmes/${filmesAnteriores[0].id}"`) < html.indexOf(`href="/filmes/${filmesAnteriores[1].id}"`));
        assert.doesNotMatch(html, new RegExp(`href="/filmes/${principal.id}"`));
        assert.match((await visitante(`/destaques?ano=${ano - 2}`)).html, /Nenhuma edição encontrada/);
    });

    await t.test('protege filmes premiados; desativação não quebra o pódio; edição pode ser excluída', async () => {
        await admin(`/adm/filme/del/${principal.id}`, {});
        assert.ok(await Filme.exists({ _id: principal._id }));
        assert.equal(await Avaliacao.countDocuments({ filme: principal._id }), 2);
        await admin(`/adm/filme/ativo/${principal.id}`, {});
        assert.match((await visitante('/destaques')).html, /Filme indisponível/);
        await admin(`/adm/filme/ativo/${principal.id}`, {});
        assert.equal((await admin(`/adm/gincana/del/${edicao.id}`, {})).local, '/adm/gincana/lst');
        assert.equal(await Edicao.countDocuments({ _id: edicao._id }), 0);
        assert.ok(await Filme.exists({ _id: principal._id }));
        await admin(`/adm/filme/del/${semNotas.id}`, {});
        assert.equal(await Filme.countDocuments({ _id: semNotas._id }), 0);
        assert.equal((await aluno('/logout', {})).local, '/');
        assert.equal((await aluno('/perfil')).local, '/login');
    });

    await t.test('duplicatas antigas são preservadas e não afetam médias ou o índice novo', async () => {
        const { prepararAvaliacoes } = await import('../config/avaliacoes.js');
        // Exclusivamente neste banco temporário criado pelo teste.
        await Avaliacao.collection.dropIndex('usuario_filme_unico');
        const antigo = await Avaliacao.collection.insertOne({ usuario: alunoCadastrado._id, filme: principal._id, nota: 5, comentario: 'Comentário legado preservado.', ativo: true, createdAt: new Date(0), updatedAt: new Date(0) });
        const resumoAntes = (await resumirAvaliacoes([principal._id]))[0];
        assert.equal(resumoAntes.quantidade, 2);
        assert.equal(resumoAntes.media, 4.5);
        const totalAntes = await Avaliacao.countDocuments();
        const preparo = await prepararAvaliacoes();
        assert.equal(preparo.preservadas, 1);
        assert.equal(await Avaliacao.countDocuments(), totalAntes);
        const preservado = await Avaliacao.findById(antigo.insertedId);
        assert.ok(preservado.duplicadaDe);
        assert.equal(preservado.comentario, 'Comentário legado preservado.');
        assert.equal((await resumirAvaliacoes([principal._id]))[0].media, 4.5);
        assert.equal((await prepararAvaliacoes()).preservadas, 0);
        await assert.rejects(Avaliacao.create({ usuario: alunoCadastrado._id, filme: principal._id, nota: 4.5 }), (erro) => erro.code === 11000);
    });
});
