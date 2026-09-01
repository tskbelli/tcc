export default function variaveisLocais(req, res, next) {
    res.locals.usuarioLogado = req.session.usuario || null;
    res.locals.mensagem = req.session.mensagem || null;
    delete req.session.mensagem;
    next();
}
