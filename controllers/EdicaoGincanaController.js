import EdicaoGincana from '../models/edicaoGincana.js';
import Filme from '../models/filme.js';
import { anoValido, dadosEdicaoValidos, idValido, textoCampo } from '../utils/validacao.js';

function prepararDados(body) {
    return {
        ano: Number(textoCampo(body.ano)),
        primeiro: textoCampo(body.primeiro).toLowerCase(),
        segundo: textoCampo(body.segundo).toLowerCase(),
        terceiro: textoCampo(body.terceiro).toLowerCase()
    };
}

export default class EdicaoGincanaController {
    constructor(caminhoBase = 'adm/gincana/') {
        const formulario = async (res, edicao, status = 200, mensagem = null) => {
            const filmes = anoValido(Number(edicao.ano))
                ? await Filme.find({ ano: Number(edicao.ano) }).select('titulo ano ativo').sort({ titulo: 1, _id: 1 }) : [];
            const dados = { edicao, filmes };
            if (mensagem) dados.mensagem = { tipo: 'danger', texto: mensagem };
            return res.status(status).render(caminhoBase + (edicao.id ? 'edt' : 'add'), dados);
        };

        const naoEncontrada = (res) => res.status(404).render('erro', {
            titulo: 'Edição não encontrada', texto: 'A edição informada não existe.'
        });

        this.filmesDoAno = async (req, res) => {
            const ano = Number(textoCampo(req.query.ano));
            if (!anoValido(ano)) return res.status(400).json({ erro: 'Informe um ano válido, sem ultrapassar o ano atual.' });
            try {
                const filmes = await Filme.find({ ano }).select('titulo ano ativo').sort({ titulo: 1, _id: 1 });
                res.json({ filmes: filmes.map((filme) => ({ id: filme.id, titulo: filme.titulo, ano: filme.ano, ativo: filme.ativo })) });
            } catch (erro) {
                console.error(erro);
                res.status(500).json({ erro: 'Não foi possível carregar os filmes deste ano. Tente novamente.' });
            }
        };

        this.list = async (req, res) => {
            try {
                const edicoes = await EdicaoGincana.find().sort({ ano: -1 })
                    .populate('primeiro segundo terceiro', 'titulo ano ativo');
                res.render(caminhoBase + 'lst', { edicoes });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro nas gincanas', texto: 'Não foi possível carregar as edições.' });
            }
        };

        this.openAdd = async (req, res) => {
            try {
                await formulario(res, { ano: new Date().getFullYear() });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro nas gincanas', texto: 'Não foi possível carregar os filmes.' });
            }
        };

        this.openEdt = async (req, res) => {
            try {
                if (!idValido(req.params.id)) return naoEncontrada(res);
                const edicao = await EdicaoGincana.findById(req.params.id);
                if (!edicao) return naoEncontrada(res);
                await formulario(res, edicao);
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro na edição', texto: 'Não foi possível abrir esta edição.' });
            }
        };

        const salvar = async (req, res) => {
            const dados = prepararDados(req.body);
            let edicao;
            try {
                if (req.params.id) {
                    if (!idValido(req.params.id)) return naoEncontrada(res);
                    edicao = await EdicaoGincana.findById(req.params.id);
                    if (!edicao) return naoEncontrada(res);
                }

                const erros = dadosEdicaoValidos(dados);
                if (!erros.length) {
                    const [quantidade, repetida] = await Promise.all([
                        Filme.countDocuments({ _id: { $in: [dados.primeiro, dados.segundo, dados.terceiro] }, ano: dados.ano }),
                        EdicaoGincana.exists({ ano: dados.ano, ...(edicao ? { _id: { $ne: edicao._id } } : {}) })
                    ]);
                    if (quantidade !== 3) erros.push(`Selecione três filmes cadastrados no ano ${dados.ano}. Filmes de outro ano não podem participar deste pódio.`);
                    if (repetida) erros.push('Já existe uma edição cadastrada com esse ano.');
                }
                if (erros.length) {
                    return await formulario(res, { ...dados, id: edicao?.id }, 400, erros.join(' '));
                }

                if (edicao) {
                    Object.assign(edicao, dados);
                    await edicao.save();
                } else {
                    await EdicaoGincana.create(dados);
                }
                req.session.mensagem = { tipo: 'success', texto: `Edição ${edicao ? 'atualizada' : 'cadastrada'} com sucesso.` };
                res.redirect('/adm/gincana/lst');
            } catch (erro) {
                // O índice único também protege contra dois cadastros simultâneos.
                if (erro.code === 11000) {
                    return formulario(res, { ...dados, id: edicao?.id }, 400, 'Já existe uma edição cadastrada com esse ano.');
                }
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível salvar a edição.' };
                res.redirect('/adm/gincana/lst');
            }
        };

        this.add = salvar;
        this.edt = salvar;

        this.del = async (req, res) => {
            try {
                if (!idValido(req.params.id)) return naoEncontrada(res);
                const edicao = await EdicaoGincana.findByIdAndDelete(req.params.id);
                if (!edicao) return naoEncontrada(res);
                req.session.mensagem = { tipo: 'success', texto: 'Edição excluída. Os filmes continuam no catálogo.' };
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível excluir a edição.' };
            }
            res.redirect('/adm/gincana/lst');
        };
    }
}
