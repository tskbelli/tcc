import Avaliacao from '../models/avaliacao.js';

export async function prepararAvaliacoes() {
    await Avaliacao.createCollection();
    const indices = await Avaliacao.collection.indexes();
    const indiceUnico = indices.find((indice) => indice.unique
        && Object.keys(indice.key).length === 2 && indice.key.usuario === 1 && indice.key.filme === 1
        && (!indice.partialFilterExpression || (
            Object.keys(indice.partialFilterExpression).length === 1
            && indice.partialFilterExpression.duplicadaDe === null
        )) && !indice.sparse);
    if (indiceUnico) return { preservadas: 0, indice: indiceUnico.name };

    // Não altera notas, comentários, datas ou moderação. Conserva todos os documentos.
    // A avaliação mais recente passa a representar cada par usuário + filme.
    const grupos = Avaliacao.collection.aggregate([
        { $match: { duplicadaDe: null } },
        { $sort: { updatedAt: -1, createdAt: -1, _id: -1 } },
        { $group: { _id: { usuario: '$usuario', filme: '$filme' }, ids: { $push: '$_id' }, quantidade: { $sum: 1 } } },
        { $match: { quantidade: { $gt: 1 } } }
    ]);
    let preservadas = 0;
    for await (const grupo of grupos) {
        const [atual, ...duplicadas] = grupo.ids;
        const resultado = await Avaliacao.collection.updateMany(
            { _id: { $in: duplicadas }, duplicadaDe: null },
            { $set: { duplicadaDe: atual } }
        );
        preservadas += resultado.modifiedCount;
    }

    // autoIndex está desativado somente neste model, para tratar o legado primeiro.
    const indice = await Avaliacao.collection.createIndex({ usuario: 1, filme: 1 }, {
        name: 'usuario_filme_unico', unique: true, partialFilterExpression: { duplicadaDe: null }
    });
    return { preservadas, indice };
}
