import conexao from '../config/conexao.js';

const Usuario = conexao.Schema({
    nome: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    senha: { type: String, required: true, select: false },
    tipo: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
    ativo: { type: Boolean, default: true },
    dataCadastro: { type: Date, default: Date.now }
});

export default conexao.model('Usuario', Usuario);
