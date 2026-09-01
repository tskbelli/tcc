import Filme from '../models/filme.js';
import Usuario from '../models/usuario.js';
import Avaliacao from '../models/avaliacao.js';

export default class AdminController {
    constructor() {
        this.painel = async (req, res) => {
            try {
                const [filmes, filmesAtivos, usuarios, avaliacoes] = await Promise.all([
                    Filme.countDocuments(),
                    Filme.countDocuments({ ativo: true }),
                    Usuario.countDocuments(),
                    Avaliacao.countDocuments()
                ]);

                res.render('adm/index', { totais: { filmes, filmesAtivos, usuarios, avaliacoes } });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro no painel', texto: 'Não foi possível carregar os dados administrativos.' });
            }
        };
    }
}
