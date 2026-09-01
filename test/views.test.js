import test from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import { resolve } from 'path';

const views = resolve('views');
const filme = {
    id: '507f1f77bcf86cd799439011',
    titulo: 'Filme de Teste',
    sinopse: 'Sinopse utilizada para validar a página do filme.',
    genero: 'Drama',
    ano: 2026,
    duracao: 5,
    diretor: 'Equipe',
    edicao: 'Gincana 2026',
    link: 'https://example.com',
    capaUrl: null,
    capaExterna: '',
    ativo: true
};
const usuario = { id: '507f1f77bcf86cd799439012', nome: 'Usuária', email: 'usuario@example.com', tipo: 'admin' };
const avaliacao = { id: '1', nota: 5, comentario: 'Ótimo filme.', ativo: true, updatedAt: new Date(), usuario, filme };

async function renderizar(nome, dados = {}) {
    return ejs.renderFile(resolve(views, nome), {
        usuarioLogado: usuario,
        mensagem: null,
        ...dados
    });
}

test('renderiza as páginas do catálogo, autenticação e perfil', async () => {
    const paginas = await Promise.all([
        renderizar('catalogo/index.ejs', { filmes: [filme], generos: ['Drama'], busca: '', genero: '', avaliacoes: {} }),
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
        renderizar('adm/avaliacao/lst.ejs', { avaliacoes: [avaliacao] })
    ]);
    paginas.forEach((html) => assert.match(html, /Admin IFCine/));
});
