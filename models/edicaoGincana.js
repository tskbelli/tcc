import conexao from '../config/conexao.js';
import { anoValido } from '../utils/validacao.js';

const EdicaoGincana = conexao.Schema({
    ano: { type: Number, required: true, unique: true, validate: { validator: anoValido, message: 'Informe um ano válido, sem ultrapassar o ano atual.' } },
    primeiro: { type: conexao.Schema.Types.ObjectId, ref: 'Filme', required: true },
    segundo: { type: conexao.Schema.Types.ObjectId, ref: 'Filme', required: true },
    terceiro: { type: conexao.Schema.Types.ObjectId, ref: 'Filme', required: true }
}, { timestamps: true });

EdicaoGincana.pre('validate', function () {
    const filmes = [this.primeiro, this.segundo, this.terceiro].filter(Boolean).map(String);
    if (new Set(filmes).size !== filmes.length) {
        this.invalidate('terceiro', 'Os três filmes da edição devem ser diferentes.');
    }
});

export default conexao.model('EdicaoGincana', EdicaoGincana);
