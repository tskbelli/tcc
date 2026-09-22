import { formatarDuracao, separarDuracao } from '../utils/duracao.js';
import { GENEROS } from '../utils/validacao.js';
import { formatarNota, preenchimentoEstrelas } from '../utils/notas.js';

export default function variaveisLocais(req, res, next) {
    res.locals.formatarNota = formatarNota;
    res.locals.preenchimentoEstrelas = preenchimentoEstrelas;
    res.locals.formatarDuracao = formatarDuracao;
    res.locals.separarDuracao = separarDuracao;
    res.locals.generosPermitidos = GENEROS;
    res.locals.usuarioLogado = req.session.usuario || null;
    res.locals.mensagem = req.session.mensagem || null;
    delete req.session.mensagem;
    next();
}
