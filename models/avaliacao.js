import conexao from '../config/conexao.js';
import { notaValida } from '../utils/notas.js';

const Avaliacao = conexao.Schema({
    usuario: { type: conexao.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    filme: { type: conexao.Schema.Types.ObjectId, ref: 'Filme', required: true },
    nota: { type: Number, required: true, min: 0.5, max: 5, validate: { validator: notaValida, message: 'Escolha de 0,5 a 5 estrelas, em intervalos de 0,5.' } },
    comentario: { type: String, trim: true, maxlength: 800, default: '' },
    ativo: { type: Boolean, default: true },
    // Somente compatibilidade: preserva duplicatas antigas fora da avaliação atual.
    duplicadaDe: { type: conexao.Schema.Types.ObjectId, ref: 'Avaliacao', default: null }
}, { timestamps: true, autoIndex: false });

Avaliacao.index({ usuario: 1, filme: 1 }, {
    name: 'usuario_filme_unico', unique: true, partialFilterExpression: { duplicadaDe: null }
});

export default conexao.model('Avaliacao', Avaliacao);
