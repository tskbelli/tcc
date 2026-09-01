import Usuario from '../models/usuario.js';
import Avaliacao from '../models/avaliacao.js';

export default class UsuarioController {
    constructor() {
        this.perfil = async (req, res) => {
            try {
                const [usuario, avaliacoes] = await Promise.all([
                    Usuario.findById(req.session.usuario.id),
                    Avaliacao.find({ usuario: req.session.usuario.id })
                        .populate('filme')
                        .sort({ updatedAt: -1 })
                ]);

                if (!usuario) {
                    return req.session.destroy(() => res.redirect('/login'));
                }

                res.render('usuario/perfil', {
                    perfil: usuario,
                    avaliacoes: avaliacoes.filter((avaliacao) => avaliacao.filme)
                });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro no perfil', texto: 'Não foi possível carregar seu histórico.' });
            }
        };
    }
}
