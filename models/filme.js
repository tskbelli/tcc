import conexao from '../config/conexao.js';

const Filme = conexao.Schema({
    titulo: { type: String, required: true, trim: true, maxlength: 150 },
    sinopse: { type: String, required: true, trim: true, maxlength: 2000 },
    genero: { type: String, required: true, trim: true, maxlength: 60 },
    ano: { type: Number, required: true, min: 1895, max: 2100 },
    duracao: { type: Number, min: 1, max: 5, default: 5 },
    diretor: { type: String, trim: true, maxlength: 120, default: '' },
    edicao: { type: String, trim: true, maxlength: 60, default: '' },
    link: { type: String, required: true, trim: true },
    capa: { type: Buffer, required: false },
    capaTipo: { type: String, required: false },
    capaExterna: { type: String, trim: true, default: '' },
    ativo: { type: Boolean, default: true },
    dataCadastro: { type: Date, default: Date.now }
});

Filme.virtual('capaUrl').get(function () {
    if (this.capa && this.capaTipo) {
        return `data:${this.capaTipo};base64,${this.capa.toString('base64')}`;
    }
    return this.capaExterna || null;
});

Filme.set('toJSON', { virtuals: true });
Filme.set('toObject', { virtuals: true });

export default conexao.model('Filme', Filme);
