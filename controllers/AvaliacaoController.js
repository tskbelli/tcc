import Avaliacao from '../models/avaliacao.js';
import Filme from '../models/filme.js';
import { converterNota, notaValida } from '../utils/notas.js';
import { idValido, textoCampo } from '../utils/validacao.js';

export default class AvaliacaoController {
    constructor() {
        this.salvar = async (req, res) => {
            const filmeId = req.params.filmeId;

            try {
                if (!idValido(filmeId)) {
                    req.session.mensagem = { tipo: 'danger', texto: 'Filme inválido para avaliação.' };
                    return res.redirect('/');
                }
                const nota = converterNota(req.body.nota);
                const comentario = textoCampo(req.body.comentario);

                if (!notaValida(nota) || comentario.length > 800) {
                    req.session.mensagem = { tipo: 'danger', texto: 'Escolha de 0,5 a 5 estrelas, em intervalos de 0,5, e escreva no máximo 800 caracteres.' };
                    return res.redirect(`/filmes/${filmeId}`);
                }

                const filme = await Filme.findOne({ _id: filmeId, ativo: true });
                if (!filme) {
                    req.session.mensagem = { tipo: 'danger', texto: 'Esse filme não está disponível.' };
                    return res.redirect('/');
                }

                const filtro = { usuario: req.session.usuario.id, filme: filmeId, duplicadaDe: null };
                const alteracao = { $set: { nota, comentario, ativo: true } };
                let anterior;
                try {
                    // Uma única operação: atualiza a existente ou cria a primeira avaliação.
                    anterior = await Avaliacao.findOneAndUpdate(filtro, alteracao, {
                        upsert: true, new: false, runValidators: true, setDefaultsOnInsert: true
                    });
                } catch (erro) {
                    if (erro.code !== 11000) throw erro;
                    // Outro envio simultâneo pode ter criado o registro. Atualiza esse mesmo registro.
                    anterior = await Avaliacao.findOneAndUpdate(filtro, alteracao, { new: false, runValidators: true });
                    if (!anterior) throw erro;
                }

                req.session.mensagem = { tipo: 'success', texto: anterior
                    ? 'Sua avaliação foi atualizada. Continua sendo uma única avaliação para este filme.'
                    : 'Sua avaliação foi salva.' };
                res.redirect(`/filmes/${filmeId}`);
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível salvar sua avaliação.' };
                res.redirect(`/filmes/${filmeId}`);
            }
        };
    }
}
