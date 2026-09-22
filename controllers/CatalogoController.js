import Filme from '../models/filme.js';
import Avaliacao from '../models/avaliacao.js';
import { escaparRegex, textoCampo, anoValido } from '../utils/validacao.js';
import { resumirAvaliacoes, avaliacoesUnicas, ordemAvaliacoes } from '../utils/avaliacoes.js';
import { notaValida } from '../utils/notas.js';

export default class CatalogoController {
    constructor() {
        this.catalogo = async (req, res) => {
            try {
                const busca = textoCampo(req.query.busca);
                const genero = textoCampo(req.query.genero);
                const ano = textoCampo(req.query.ano);
                const filtro = { ativo: true };

                if (ano && !anoValido(Number(ano))) {
                    return res.status(400).render('erro', { titulo: 'Ano inválido', texto: 'Selecione um ano válido para filtrar os filmes.' });
                }

                if (busca) filtro.titulo = { $regex: escaparRegex(busca), $options: 'i' };
                if (genero) filtro.genero = genero;
                if (ano) filtro.ano = Number(ano);

                const [filmes, generos, anos] = await Promise.all([
                    Filme.find(filtro).sort({ dataCadastro: -1 }),
                    Filme.distinct('genero', { ativo: true }),
                    Filme.distinct('ano', { ativo: true })
                ]);

                const resumos = await resumirAvaliacoes(filmes.map((filme) => filme._id));

                const avaliacoes = Object.fromEntries(resumos.map((item) => [item._id.toString(), item]));
                res.render('catalogo/index', { filmes, generos: generos.sort(), anos: anos.sort((a, b) => b - a), busca, genero, ano, avaliacoes });
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

                const [avaliacoes, avaliacaoUsuario, resumos] = await Promise.all([
                    Avaliacao.find({ filme: filme._id, duplicadaDe: null })
                        .populate('usuario', 'nome')
                        .sort(ordemAvaliacoes),
                    req.session.usuario
                        ? Avaliacao.findOne({ filme: filme._id, usuario: req.session.usuario.id, duplicadaDe: null }).sort(ordemAvaliacoes)
                        : null,
                    resumirAvaliacoes([filme._id])
                ]);

                const avaliacoesValidas = avaliacoesUnicas(avaliacoes).filter((avaliacao) => avaliacao.usuario && avaliacao.ativo && notaValida(avaliacao.nota));
                const quantidade = resumos[0]?.quantidade || 0;
                const media = resumos[0]?.media || 0;

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
