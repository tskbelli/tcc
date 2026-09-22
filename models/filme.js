import conexao from '../config/conexao.js';
import { anoValido, urlValida } from '../utils/validacao.js';
import { obterDuracaoSegundos } from '../utils/duracao.js';

const Filme = conexao.Schema({
    titulo: { type: String, required: true, trim: true, maxlength: 150 },
    sinopse: { type: String, required: true, trim: true, maxlength: 2000 },
    genero: { type: String, required: true, trim: true, maxlength: 60 },
    ano: { type: Number, required: true, validate: { validator: anoValido, message: 'Informe um ano válido, sem ultrapassar o ano atual.' } },
    duracaoSegundos: { type: Number, required: true, min: 1, max: 300, validate: { validator: Number.isInteger, message: 'A duração deve usar segundos inteiros.' } },
    // Somente leitura de registros antigos; os formulários salvam duracaoSegundos.
    duracao: { type: Number },
    diretor: { type: String, trim: true, maxlength: 120, default: '' },
    edicao: { type: String, trim: true, maxlength: 60, default: '' },
    link: { type: String, required: true, trim: true },
    capa: { type: Buffer, required: false },
    capaTipo: { type: String, required: false },
    // Mantido para exibir capas antigas. Nenhuma rota aceita uma nova URL.
    capaExterna: { type: String, trim: true },
    ativo: { type: Boolean, default: true },
    dataCadastro: { type: Date, default: Date.now }
});

Filme.pre('validate', function () {
    if (this.duracaoSegundos == null && this.duracao != null) {
        this.duracaoSegundos = obterDuracaoSegundos(this);
    }
});

Filme.virtual('capaSrc').get(function () {
    if (this.capa && this.capaTipo) {
        return `data:${this.capaTipo};base64,${this.capa.toString('base64')}`;
    }
    return this.capaExterna && urlValida(this.capaExterna) ? this.capaExterna : null;
});

Filme.set('toJSON', { virtuals: true });
Filme.set('toObject', { virtuals: true });

export default conexao.model('Filme', Filme);
