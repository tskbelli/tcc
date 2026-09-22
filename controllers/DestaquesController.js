import Filme from '../models/filme.js';
import EdicaoGincana from '../models/edicaoGincana.js';
import { resumirAvaliacoes } from '../utils/avaliacoes.js';
import { anoValido, textoCampo } from '../utils/validacao.js';

export default class DestaquesController {
    constructor() {
        this.index = async (req, res) => {
            try {
                const filtroAno = textoCampo(req.query.ano);
                if (filtroAno && !anoValido(Number(filtroAno))) {
                    return res.status(400).render('erro', { titulo: 'Ano inválido', texto: 'Selecione um ano válido para a gincana.' });
                }

                const [filmesAtivos, anos] = await Promise.all([
                    Filme.find({ ativo: true }).select('titulo'),
                    EdicaoGincana.distinct('ano')
                ]);
                anos.sort((a, b) => b - a);
                const ano = filtroAno ? Number(filtroAno) : (anos[0] || null);
                const titulos = Object.fromEntries(filmesAtivos.map((filme) => [filme.id, filme.titulo]));
                const resumos = await resumirAvaliacoes(filmesAtivos.map((filme) => filme._id));
                // Usa a média sem arredondar. Empates: mais avaliações, título e ID.
                resumos.sort((a, b) => b.media - a.media || b.quantidade - a.quantidade
                    || titulos[a._id].localeCompare(titulos[b._id], 'pt-BR')
                    || String(a._id).localeCompare(String(b._id)));
                const melhores = resumos.slice(0, 3);

                const [filmes, edicao] = await Promise.all([
                    Filme.find({ _id: { $in: melhores.map((item) => item._id) }, ativo: true }),
                    ano ? EdicaoGincana.findOne({ ano }).populate({ path: 'primeiro segundo terceiro', match: { ativo: true, ano } }) : null
                ]);
                const porId = Object.fromEntries(filmes.map((filme) => [filme.id, filme]));
                const ranking = melhores.map((item, indice) => ({
                    posicao: indice + 1, filme: porId[item._id], media: item.media, quantidade: item.quantidade
                })).filter((item) => item.filme);
                const ganhadores = edicao ? ['primeiro', 'segundo', 'terceiro'].map((campo, indice) => ({
                    posicao: indice + 1, filme: edicao[campo]
                })) : [];

                res.render('catalogo/destaques', { ranking, ganhadores, anos, ano, edicao });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro nos destaques', texto: 'Não foi possível carregar os destaques.' });
            }
        };
    }
}
