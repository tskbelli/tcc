import Filme from '../models/filme.js';
import Avaliacao from '../models/avaliacao.js';
import { escaparRegex } from '../utils/validacao.js';

export default class CatalogoController {
    constructor() {
        this.catalogo = async (req, res) => {
            try {
                const busca = (req.query.busca || '').trim();
                const genero = (req.query.genero || '').trim();
                const filtro = { ativo: true };

                if (busca) filtro.titulo = { $regex: escaparRegex(busca), $options: 'i' };
                if (genero) filtro.genero = genero;

                const [filmes, generos] = await Promise.all([
                    Filme.find(filtro).sort({ dataCadastro: -1 }),
                    Filme.distinct('genero', { ativo: true })
                ]);

                const resumos = filmes.length ? await Avaliacao.aggregate([
                    { $match: { filme: { $in: filmes.map((filme) => filme._id) }, ativo: true } },
                    { $group: { _id: '$filme', media: { $avg: '$nota' }, quantidade: { $sum: 1 } } }
                ]) : [];

                const avaliacoes = Object.fromEntries(resumos.map((item) => [item._id.toString(), item]));
                res.render('catalogo/index', { filmes, generos: generos.sort(), busca, genero, avaliacoes });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro no catálogo', texto: 'Não foi possível carregar os filmes.' });
            }
        };

        this.detalhes = async (req, res) => {
            try {
                const filme = await Filme.findOne({ _id: req.params.id, ativo: true });
                if (!filme) {
                    return res.status(404).render('erro', { titulo: 'Filme não encontrado', texto: 'O filme não existe ou está desativado.' });
                }

                const [avaliacoes, avaliacaoUsuario] = await Promise.all([
                    Avaliacao.find({ filme: filme._id, ativo: true })
                        .populate('usuario', 'nome')
                        .sort({ updatedAt: -1 }),
                    req.session.usuario
                        ? Avaliacao.findOne({ filme: filme._id, usuario: req.session.usuario.id })
                        : null
                ]);

                const avaliacoesValidas = avaliacoes.filter((avaliacao) => avaliacao.usuario);
                const quantidade = avaliacoesValidas.length;
                const media = quantidade
                    ? avaliacoesValidas.reduce((total, avaliacao) => total + avaliacao.nota, 0) / quantidade
                    : 0;

                res.render('catalogo/detalhes', {
                    filme,
                    avaliacoes: avaliacoesValidas,
                    avaliacaoUsuario,
                    media,
                    quantidade
                });
            } catch (erro) {
                console.error(erro);
                res.status(404).render('erro', { titulo: 'Filme não encontrado', texto: 'Não foi possível abrir esse filme.' });
            }
        };
    }
}
