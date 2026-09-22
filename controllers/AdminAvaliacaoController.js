import Avaliacao from '../models/avaliacao.js';
import { avaliacoesUnicas, ordemAvaliacoes } from '../utils/avaliacoes.js';

export default class AdminAvaliacaoController {
    constructor(caminhoBase = 'adm/avaliacao/') {
        this.list = async (req, res) => {
            try {
                const avaliacoes = await Avaliacao.find({ duplicadaDe: null })
                    .populate('usuario', 'nome email')
                    .populate('filme', 'titulo')
                    .sort(ordemAvaliacoes);
                res.render(caminhoBase + 'lst', {
                    avaliacoes: avaliacoesUnicas(avaliacoes).filter((avaliacao) => avaliacao.usuario && avaliacao.filme)
                });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro nas avaliações', texto: 'Não foi possível carregar as avaliações.' });
            }
        };

        this.alternar = async (req, res) => {
            try {
                const avaliacao = await Avaliacao.findOne({ _id: req.params.id, duplicadaDe: null });
                if (avaliacao) {
                    avaliacao.ativo = !avaliacao.ativo;
                    await avaliacao.save();
                    req.session.mensagem = { tipo: 'success', texto: `Avaliação ${avaliacao.ativo ? 'publicada' : 'ocultada'}.` };
                }
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível moderar a avaliação.' };
            }
            res.redirect('/adm/avaliacao/lst');
        };

        this.del = async (req, res) => {
            try {
                await Avaliacao.findOneAndDelete({ _id: req.params.id, duplicadaDe: null });
                req.session.mensagem = { tipo: 'success', texto: 'Avaliação excluída.' };
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível excluir a avaliação.' };
            }
            res.redirect('/adm/avaliacao/lst');
        };
    }
}
