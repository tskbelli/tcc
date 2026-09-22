import Avaliacao from '../models/avaliacao.js';
import Usuario from '../models/usuario.js';

export const ordemAvaliacoes = { updatedAt: -1, createdAt: -1, _id: -1 };

// Recebe a lista já ordenada da mais recente para a mais antiga.
export function avaliacoesUnicas(avaliacoes) {
    const vistas = new Set();
    return avaliacoes.filter((avaliacao) => {
        if (avaliacao.duplicadaDe) return false;
        const usuario = String(avaliacao.usuario?._id || avaliacao.usuario);
        const filme = String(avaliacao.filme?._id || avaliacao.filme);
        const chave = `${usuario}:${filme}`;
        if (vistas.has(chave)) return false;
        vistas.add(chave);
        return true;
    });
}

export async function resumirAvaliacoes(filmeIds) {
    if (!filmeIds.length) return [];
    return Avaliacao.aggregate([
        { $match: { filme: { $in: filmeIds }, duplicadaDe: null } },
        { $sort: ordemAvaliacoes },
        // Defesa adicional: cada usuário é contado uma única vez por filme.
        { $group: { _id: { usuario: '$usuario', filme: '$filme' }, avaliacao: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$avaliacao' } },
        { $match: { ativo: true, nota: { $gte: 0.5, $lte: 5 }, $expr: { $eq: [{ $mod: ['$nota', 0.5] }, 0] } } },
        // Assim como nos detalhes, não contabiliza avaliações sem autor existente.
        { $lookup: { from: Usuario.collection.name, localField: 'usuario', foreignField: '_id', as: 'autor' } },
        { $match: { 'autor.0': { $exists: true } } },
        { $group: { _id: '$filme', media: { $avg: '$nota' }, quantidade: { $sum: 1 } } }
    ]);
}
