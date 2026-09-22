import Usuario from '../models/usuario.js';
import Avaliacao from '../models/avaliacao.js';
import { avaliacoesUnicas, ordemAvaliacoes } from '../utils/avaliacoes.js';

export default class UsuarioController {
    constructor() {
        this.perfil = async (req, res) => {
            try {
                const [usuario, avaliacoes] = await Promise.all([
                    Usuario.findById(req.session.usuario.id),
                    Avaliacao.find({ usuario: req.session.usuario.id, duplicadaDe: null })
                        .populate('filme')
                        .sort(ordemAvaliacoes)
                ]);

                if (!usuario) {
                    return req.session.destroy(() => res.redirect('/login'));
                }

                res.render('usuario/perfil', {
                    perfil: usuario,
                    avaliacoes: avaliacoesUnicas(avaliacoes).filter((avaliacao) => avaliacao.filme)
                });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro no perfil', texto: 'Não foi possível carregar seu histórico.' });
            }
        };
    }
}
