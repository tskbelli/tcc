import conexao from '../config/conexao.js';

const Avaliacao = conexao.Schema({
    usuario: { type: conexao.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    filme: { type: conexao.Schema.Types.ObjectId, ref: 'Filme', required: true },
    nota: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, trim: true, maxlength: 800, default: '' },
    ativo: { type: Boolean, default: true }
}, { timestamps: true });

Avaliacao.index({ usuario: 1, filme: 1 }, { unique: true });

export default conexao.model('Avaliacao', Avaliacao);
