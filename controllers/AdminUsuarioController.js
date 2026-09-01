import Usuario from '../models/usuario.js';
import { escaparRegex } from '../utils/validacao.js';

export default class AdminUsuarioController {
    constructor(caminhoBase = 'adm/usuario/') {
        this.list = async (req, res) => {
            try {
                const filtro = (req.query.filtro || '').trim();
                const consulta = filtro ? {
                    $or: [
                        { nome: { $regex: escaparRegex(filtro), $options: 'i' } },
                        { email: { $regex: escaparRegex(filtro), $options: 'i' } }
                    ]
                } : {};
                const usuarios = await Usuario.find(consulta).sort({ dataCadastro: -1 });
                res.render(caminhoBase + 'lst', { usuarios, filtro });
            } catch (erro) {
                console.error(erro);
                res.status(500).render('erro', { titulo: 'Erro nos usuários', texto: 'Não foi possível carregar a lista.' });
            }
        };

        this.alternarAtivo = async (req, res) => {
            try {
                if (req.params.id === req.session.usuario.id) {
                    req.session.mensagem = { tipo: 'warning', texto: 'Você não pode desativar a própria conta.' };
                    return res.redirect('/adm/usuario/lst');
                }

                const usuario = await Usuario.findById(req.params.id);
                if (usuario) {
                    usuario.ativo = !usuario.ativo;
                    await usuario.save();
                    req.session.mensagem = { tipo: 'success', texto: `Usuário ${usuario.ativo ? 'ativado' : 'desativado'}.` };
                }
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível alterar o usuário.' };
            }
            res.redirect('/adm/usuario/lst');
        };

        this.alternarTipo = async (req, res) => {
            try {
                if (req.params.id === req.session.usuario.id) {
                    req.session.mensagem = { tipo: 'warning', texto: 'Você não pode alterar o próprio nível de acesso.' };
                    return res.redirect('/adm/usuario/lst');
                }

                const usuario = await Usuario.findById(req.params.id);
                if (usuario) {
                    usuario.tipo = usuario.tipo === 'admin' ? 'usuario' : 'admin';
                    await usuario.save();
                    req.session.mensagem = { tipo: 'success', texto: 'Nível de acesso atualizado.' };
                }
            } catch (erro) {
                console.error(erro);
                req.session.mensagem = { tipo: 'danger', texto: 'Não foi possível alterar o nível de acesso.' };
            }
            res.redirect('/adm/usuario/lst');
        };
    }
}
