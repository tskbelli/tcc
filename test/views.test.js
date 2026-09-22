import test from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import { resolve } from 'path';
import { formatarDuracao, separarDuracao } from '../utils/duracao.js';
import { GENEROS } from '../utils/validacao.js';
import { formatarNota, preenchimentoEstrelas } from '../utils/notas.js';

const views = resolve('views');
const filme = {
    id: '507f1f77bcf86cd799439011',
    titulo: 'Filme de Teste',
    sinopse: 'Sinopse utilizada para validar a página do filme.',
    genero: 'Drama',
    ano: 2026,
    duracaoSegundos: 287,
    diretor: 'Equipe',
    edicao: 'Gincana 2026',
    link: 'https://example.com',
    capaSrc: null,
    ativo: true
};
const usuario = { id: '507f1f77bcf86cd799439012', nome: 'Usuária', email: 'usuario@example.com', tipo: 'admin' };
const avaliacao = { id: '1', nota: 5, comentario: 'Ótimo filme.', ativo: true, updatedAt: new Date(), usuario, filme };

async function renderizar(nome, dados = {}) {
    return ejs.renderFile(resolve(views, nome), {
        usuarioLogado: usuario,
        mensagem: null,
        formatarDuracao, separarDuracao, generosPermitidos: GENEROS,
        formatarNota, preenchimentoEstrelas,
        ...dados
    });
}

test('renderiza as páginas do catálogo, autenticação e perfil', async () => {
    const paginas = await Promise.all([
        renderizar('catalogo/index.ejs', { filmes: [filme], generos: ['Drama'], anos: [2026], busca: '', genero: '', ano: '', avaliacoes: {} }),
        renderizar('catalogo/detalhes.ejs', { filme, avaliacoes: [avaliacao], avaliacaoUsuario: avaliacao, media: 5, quantidade: 1 }),
        renderizar('auth/login.ejs', { administrativo: false, dados: {} }),
        renderizar('auth/cadastro.ejs', { dados: {} }),
        renderizar('usuario/perfil.ejs', { perfil: { ...usuario, dataCadastro: new Date() }, avaliacoes: [avaliacao] }),
        renderizar('erro.ejs', { titulo: 'Erro', texto: 'Mensagem de teste.' })
    ]);
    paginas.forEach((html) => assert.match(html, /IFCine/));
});

test('renderiza todas as páginas administrativas', async () => {
    const paginas = await Promise.all([
        renderizar('adm/index.ejs', { totais: { filmes: 1, filmesAtivos: 1, usuarios: 1, avaliacoes: 1 } }),
        renderizar('adm/filme/add.ejs', { filme: { ativo: true } }),
        renderizar('adm/filme/edt.ejs', { filme }),
        renderizar('adm/filme/lst.ejs', { filmes: [filme], filtro: '' }),
        renderizar('adm/usuario/lst.ejs', { usuarios: [{ ...usuario, ativo: true, dataCadastro: new Date() }], filtro: '' }),
        renderizar('adm/avaliacao/lst.ejs', { avaliacoes: [avaliacao] }),
        renderizar('adm/gincana/add.ejs', { edicao: { ano: 2026 }, filmes: [] }),
        renderizar('adm/gincana/edt.ejs', { edicao: { id: 'edicao', ano: 2026, primeiro: filme.id }, filmes: [filme] }),
        renderizar('adm/gincana/lst.ejs', { edicoes: [{ id: 'edicao', ano: 2026, primeiro: filme, segundo: filme, terceiro: null }] })
    ]);
    paginas.forEach((html) => assert.match(html, /Admin IFCine/));
});

test('Destaques renderiza ranking vazio, incompleto e com três posições', async () => {
    const colocados = [1, 2, 3].map((posicao) => ({ posicao, filme, media: 4.5, quantidade: 2 }));
    for (const quantidade of [0, 1, 2, 3]) {
        const html = await renderizar('catalogo/destaques.ejs', {
            ranking: colocados.slice(0, quantidade), ganhadores: [], anos: [], ano: null, edicao: null
        });
        assert.match(html, /Ganhadores da Gincana/);
        assert.equal((html.match(/data-posicao=/g) || []).length, quantidade);
        if (quantidade) assert.match(html, /4min47s/);
    }
    const html = await renderizar('catalogo/destaques.ejs', {
        ranking: [], ganhadores: [{ posicao: 1, filme }, { posicao: 2, filme: null }, { posicao: 3, filme }],
        anos: [2026], ano: 2026, edicao: { ano: 2026 }
    });
    assert.match(html, /Filme indisponível/);
    assert.equal((html.match(/data-posicao=/g) || []).length, 3);
});

test('formulário mantém a prévia e não oferece entrada para URL da capa', async () => {
    const html = await renderizar('adm/filme/edt.ejs', { filme: { ...filme, capaSrc: 'https://example.com/antiga.jpg' } });
    assert.match(html, /name="capa"/);
    assert.doesNotMatch(html, /name="capa(?:Url|Externa)"/);
    assert.match(html, /id="minutos"[^>]+value="4"/);
    assert.match(html, /id="segundos"[^>]+value="47"/);
    assert.match(html, /https:\/\/example.com\/antiga.jpg/);
});

test('catálogo mostra somente Filmes em cartaz no título, mesmo ao filtrar', async () => {
    const html = await renderizar('catalogo/index.ejs', { filmes: [filme], generos: ['Drama'], anos: [2026], busca: 'Teste', genero: 'Drama', ano: '2026', avaliacoes: {} });
    assert.match(html, /<h2[^>]*>Filmes em cartaz<\/h2>/);
    assert.doesNotMatch(html, /filmes? encontrados?|>Em cartaz</i);
    assert.match(html, /Limpar filtros/);
});

test('formulário de avaliação tem dez radios e recupera a nota 4,5 existente', async () => {
    const html = await renderizar('catalogo/detalhes.ejs', { filme, avaliacoes: [{ ...avaliacao, nota: 4.5 }], avaliacaoUsuario: { ...avaliacao, nota: 4.5 }, media: 4.5, quantidade: 1 });
    assert.equal((html.match(/name="nota"/g) || []).length, 10);
    assert.match(html, /name="nota" value="4.5"[^>]*checked/);
    assert.match(html, /Você já avaliou este filme/);
    assert.match(html, /Atualizar avaliação/);
    assert.match(html, /width: 50%/);
    assert.match(html, /4,5 de 5 estrelas/);
});

test('catálogo, pódio, perfil e moderação mostram frações e números decimais', async () => {
    const nota = { ...avaliacao, nota: 3.5 };
    const paginas = await Promise.all([
        renderizar('catalogo/index.ejs', { filmes: [filme], generos: ['Drama'], anos: [2026], busca: '', genero: '', ano: '', avaliacoes: { [filme.id]: { media: 3.5, quantidade: 1 } } }),
        renderizar('partials/podio.ejs', { colocados: [{ posicao: 1, filme, media: 3.5, quantidade: 1 }], mostrarAvaliacoes: true }),
        renderizar('usuario/perfil.ejs', { perfil: { ...usuario, dataCadastro: new Date() }, avaliacoes: [nota] }),
        renderizar('adm/avaliacao/lst.ejs', { avaliacoes: [nota] })
    ]);
    paginas.forEach((html) => {
        assert.match(html, /3,5 de 5 estrelas/);
        assert.match(html, /width: 50%/);
    });
    const media = await renderizar('partials/estrelas.ejs', { valor: 4.2 });
    assert.match(media, /width: 20%/);
    assert.match(media, /4,2 \/ 5/);
});
