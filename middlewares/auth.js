export function somenteAutenticado(req, res, next) {
    if (!req.session.usuario) {
        req.session.mensagem = { tipo: 'warning', texto: 'Faça login para continuar.' };
        return res.redirect('/login');
    }
    next();
}

export function somenteAdmin(req, res, next) {
    if (!req.session.usuario) {
        req.session.mensagem = { tipo: 'warning', texto: 'Faça o login administrativo.' };
        return res.redirect('/adm/login');
    }

    if (req.session.usuario.tipo !== 'admin') {
        req.session.mensagem = { tipo: 'danger', texto: 'Você não tem permissão para acessar essa área.' };
        return res.redirect('/');
    }

    next();
}

export function somenteVisitante(req, res, next) {
    if (req.session.usuario) {
        return res.redirect(req.session.usuario.tipo === 'admin' ? '/adm' : '/');
    }
    next();
}
