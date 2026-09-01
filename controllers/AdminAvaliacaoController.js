import Avaliacao from '../models/avaliacao.js';

export default class AdminAvaliacaoController {
    constructor(caminhoBase = 'adm/avaliacao/') {
        this.list = async (req, res) => {
            try {
                const avaliacoes = await Avaliacao.find()
                    .populate('usuario', 'nome email')
                    .populate('filme', 'titulo')
                    .sort({ updatedAt: -1 });
                res.render(caminhoBase + 'lst', {
                    avaliacoes: avaliacoes.filter((avaliacao) => avaliacao.usuario && avaliacao.filme)
                });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro nas avaliações', texto: 'Não foi possível carregar as avaliações.' });
            }
        };

        this.alternar = async (req, res) => {
            try {
                const avaliacao = await Avaliacao.findById(req.params.id);
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
                await Avaliacao.findByIdAndDelete(req.params.id);
                req.session.mensagem = { tipo: 'success', texto: 'Avaliação excluída.' };
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível excluir a avaliação.' };
            }
            res.redirect('/adm/avaliacao/lst');
        };
    }
}
