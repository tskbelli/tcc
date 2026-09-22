import Filme from '../models/filme.js';
import Avaliacao from '../models/avaliacao.js';
import EdicaoGincana from '../models/edicaoGincana.js';
import { dadosFilmeValidos, escaparRegex, textoCampo } from '../utils/validacao.js';
import { converterDuracao } from '../utils/duracao.js';

function prepararDados(body) {
    return {
        titulo: textoCampo(body.titulo),
        sinopse: textoCampo(body.sinopse),
        genero: textoCampo(body.genero),
        ano: Number(textoCampo(body.ano)),
        duracaoSegundos: converterDuracao(body.minutos, body.segundos),
        diretor: textoCampo(body.diretor),
        edicao: textoCampo(body.edicao),
        link: textoCampo(body.link),
        ativo: body.ativo === 'on'
    };
}

function dadosFormulario(body, filme = {}) {
    return {
        ...(filme.toObject ? filme.toObject() : filme),
        ...prepararDados(body),
        minutos: textoCampo(body.minutos),
        segundos: textoCampo(body.segundos)
    };
}

export default class FilmeController {
    constructor(caminhoBase = 'adm/filme/') {
        this.caminhoBase = caminhoBase;

        this.openAdd = (req, res) => {
            res.render(caminhoBase + 'add', { filme: { ativo: true, duracaoSegundos: 300 } });
        };

        this.add = async (req, res) => {
            try {
                const dados = prepararDados(req.body);
                const erros = dadosFilmeValidos(dados);

                if (erros.length) {
                    return res.status(400).render(caminhoBase + 'add', {
                        filme: dadosFormulario(req.body),
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
                    filme: dadosFormulario(req.body),
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
                    return res.status(400).render(caminhoBase + 'edt', {
                        filme: dadosFormulario(req.body, filme),
                        mensagem: { tipo: 'danger', texto: erros.join(' ') }
                    });
                }

                if (dados.ano !== filme.ano) {
                    const edicaoIncompativel = await EdicaoGincana.exists({ ano: { $ne: dados.ano }, $or: [
                        { primeiro: filme._id }, { segundo: filme._id }, { terceiro: filme._id }
                    ] });
                    if (edicaoIncompativel) {
                        return res.status(400).render(caminhoBase + 'edt', {
                            filme: dadosFormulario(req.body, filme),
                            mensagem: { tipo: 'danger', texto: 'Este filme é vencedor de uma gincana de outro ano. Ajuste a edição antes de alterar o ano do filme.' }
                        });
                    }
                }

                Object.assign(filme, dados);
                filme.duracao = undefined;
                if (req.file) {
                    filme.capa = req.file.buffer;
                    filme.capaTipo = req.file.mimetype;
                    filme.capaExterna = undefined;
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
                const edicao = await EdicaoGincana.exists({ $or: [
                    { primeiro: req.params.id }, { segundo: req.params.id }, { terceiro: req.params.id }
                ] });
                if (edicao) {
                    req.session.mensagem = { tipo: 'warning', texto: 'Este filme é ganhador de uma gincana. Edite ou exclua a edição antes de excluir o filme.' };
                    return res.redirect('/adm/filme/lst');
                }
                await Filme.findByIdAndDelete(req.params.id);
                await Avaliacao.deleteMany({ filme: req.params.id });
                req.session.mensagem = { tipo: 'success', texto: 'Filme e suas avaliações foram excluídos.' };
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível excluir o filme.' };
            }
            res.redirect('/adm/filme/lst');
        };
    }
}
