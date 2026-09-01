import Avaliacao from '../models/avaliacao.js';
import Filme from '../models/filme.js';

export default class AvaliacaoController {
    constructor() {
        this.salvar = async (req, res) => {
            const filmeId = req.params.filmeId;

            try {
                const nota = Number(req.body.nota);
                const comentario = (req.body.comentario || '').trim();

                if (!Number.isInteger(nota) || nota < 1 || nota > 5 || comentario.length > 800) {
                    req.session.mensagem = { tipo: 'danger', texto: 'Escolha de 1 a 5 estrelas e escreva no máximo 800 caracteres.' };
                    return res.redirect(`/filmes/${filmeId}`);
                }

                const filme = await Filme.findOne({ _id: filmeId, ativo: true });
                if (!filme) {
                    req.session.mensagem = { tipo: 'danger', texto: 'Esse filme não está disponível.' };
                    return res.redirect('/');
                }

                await Avaliacao.findOneAndUpdate(
                    { usuario: req.session.usuario.id, filme: filmeId },
                    { nota, comentario, ativo: true },
                    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
                );

                req.session.mensagem = { tipo: 'success', texto: 'Sua avaliação foi salva.' };
                res.redirect(`/filmes/${filmeId}`);
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível salvar sua avaliação.' };
                res.redirect(`/filmes/${filmeId}`);
            }
        };
    }
}
