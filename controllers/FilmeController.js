import Filme from '../models/filme.js';
import Avaliacao from '../models/avaliacao.js';
import { dadosFilmeValidos, escaparRegex } from '../utils/validacao.js';

function prepararDados(body) {
    return {
        titulo: (body.titulo || '').trim(),
        sinopse: (body.sinopse || '').trim(),
        genero: (body.genero || '').trim(),
        ano: Number(body.ano),
        duracao: Number(body.duracao),
        diretor: (body.diretor || '').trim(),
        edicao: (body.edicao || '').trim(),
        link: (body.link || '').trim(),
        capaExterna: (body.capaExterna || '').trim(),
        ativo: body.ativo === 'on'
    };
}

export default class FilmeController {
    constructor(caminhoBase = 'adm/filme/') {
        this.caminhoBase = caminhoBase;

        this.openAdd = (req, res) => {
            res.render(caminhoBase + 'add', { filme: { ativo: true } });
        };

        this.add = async (req, res) => {
            try {
                const dados = prepararDados(req.body);
                const erros = dadosFilmeValidos(dados);

                if (erros.length) {
                    return res.status(400).render(caminhoBase + 'add', {
                        filme: dados,
                        mensagem: { tipo: 'danger', texto: erros.join(' ') }
                    });
                }

                if (req.file) {
                    dados.capa = req.file.buffer;
                    dados.capaTipo = req.file.mimetype;
                }

                await Filme.create(dados);
                req.session.mensagem = { tipo: 'success', texto: 'Filme cadastrado com sucesso.' };
                res.redirect('/adm/filme/lst');
            } catch (erro) {
                console.error(erro);
                res.status(500).render(caminhoBase + 'add', {
                    filme: req.body,
                    mensagem: { tipo: 'danger', texto: 'Não foi possível cadastrar o filme.' }
                });
            }
        };

        this.list = async (req, res) => {
            try {
                const filtro = (req.query.filtro || '').trim();
                const consulta = filtro
                    ? { titulo: { $regex: escaparRegex(filtro), $options: 'i' } }
                    : {};
                const filmes = await Filme.find(consulta).sort({ dataCadastro: -1 });
                res.render(caminhoBase + 'lst', { filmes, filtro });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro nos filmes', texto: 'Não foi possível carregar a lista.' });
            }
        };

        this.openEdt = async (req, res) => {
            try {
                const filme = await Filme.findById(req.params.id);
                if (!filme) return res.status(404).render('erro', { titulo: 'Filme não encontrado', texto: 'O registro não existe.' });
                res.render(caminhoBase + 'edt', { filme });
            } catch {
                res.status(404).render('erro', { titulo: 'Filme não encontrado', texto: 'O registro não existe.' });
            }
        };

        this.edt = async (req, res) => {
            try {
                const filme = await Filme.findById(req.params.id);
                if (!filme) return res.status(404).render('erro', { titulo: 'Filme não encontrado', texto: 'O registro não existe.' });

                const dados = prepararDados(req.body);
                const erros = dadosFilmeValidos(dados);
                if (erros.length) {
                    Object.assign(filme, dados);
                    return res.status(400).render(caminhoBase + 'edt', {
                        filme,
                        mensagem: { tipo: 'danger', texto: erros.join(' ') }
                    });
                }

                Object.assign(filme, dados);
                if (req.file) {
                    filme.capa = req.file.buffer;
                    filme.capaTipo = req.file.mimetype;
                }

                await filme.save();
                req.session.mensagem = { tipo: 'success', texto: 'Filme atualizado com sucesso.' };
                res.redirect('/adm/filme/lst');
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível atualizar o filme.' };
                res.redirect('/adm/filme/lst');
            }
        };

        this.alternar = async (req, res) => {
            try {
                const filme = await Filme.findById(req.params.id);
                if (filme) {
                    filme.ativo = !filme.ativo;
                    await filme.save();
                    req.session.mensagem = { tipo: 'success', texto: `Filme ${filme.ativo ? 'ativado' : 'desativado'}.` };
                }
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível alterar o filme.' };
            }
            res.redirect('/adm/filme/lst');
        };

        this.del = async (req, res) => {
            try {
                await Promise.all([
                    Filme.findByIdAndDelete(req.params.id),
                    Avaliacao.deleteMany({ filme: req.params.id })
                ]);
                req.session.mensagem = { tipo: 'success', texto: 'Filme e suas avaliações foram excluídos.' };
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível excluir o filme.' };
            }
            res.redirect('/adm/filme/lst');
        };
    }
}
