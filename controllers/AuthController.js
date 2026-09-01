import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario.js';
import { emailValido } from '../utils/validacao.js';

export default class AuthController {
    constructor() {
        this.abrirLogin = (req, res) => {
            res.render('auth/login', { administrativo: false, dados: {} });
        };

        this.abrirLoginAdmin = (req, res) => {
            res.render('auth/login', { administrativo: true, dados: {} });
        };

        this.abrirCadastro = (req, res) => {
            res.render('auth/cadastro', { dados: {} });
        };

        this.cadastrar = async (req, res) => {
            try {
                const nome = (req.body.nome || '').trim();
                const email = (req.body.email || '').trim().toLowerCase();
                const senha = req.body.senha || '';
                const confirmarSenha = req.body.confirmarSenha || '';

                if (nome.length < 2 || !emailValido(email) || senha.length < 6 || senha !== confirmarSenha) {
                    return res.status(400).render('auth/cadastro', {
                        dados: { nome, email },
                        mensagem: {
                            tipo: 'danger',
                            texto: 'Confira os dados. A senha deve ter 6 caracteres ou mais e as duas senhas devem ser iguais.'
                        }
                    });
                }

                const usuarioExistente = await Usuario.findOne({ email });
                if (usuarioExistente) {
                    return res.status(400).render('auth/cadastro', {
                        dados: { nome, email },
                        mensagem: { tipo: 'danger', texto: 'Já existe uma conta com esse e-mail.' }
                    });
                }

                const senhaProtegida = await bcrypt.hash(senha, 12);
                await Usuario.create({ nome, email, senha: senhaProtegida });

                req.session.mensagem = { tipo: 'success', texto: 'Cadastro realizado. Agora você pode entrar.' };
                res.redirect('/login');
            } catch (erro) {
                console.error(erro);
                res.status(500).render('auth/cadastro', {
                    dados: { nome: req.body.nome, email: req.body.email },
                    mensagem: { tipo: 'danger', texto: 'Não foi possível concluir o cadastro.' }
                });
            }
        };

        this.entrar = async (req, res) => {
            try {
                const email = (req.body.email || '').trim().toLowerCase();
                const senha = req.body.senha || '';
                const administrativo = req.path.startsWith('/adm');
                const usuario = await Usuario.findOne({ email }).select('+senha');
                const senhaCorreta = usuario ? await bcrypt.compare(senha, usuario.senha) : false;

                if (!usuario || !senhaCorreta || !usuario.ativo) {
                    return res.status(401).render('auth/login', {
                        administrativo,
                        dados: { email },
                        mensagem: { tipo: 'danger', texto: 'E-mail ou senha inválidos, ou conta desativada.' }
                    });
                }

                if (administrativo && usuario.tipo !== 'admin') {
                    return res.status(403).render('auth/login', {
                        administrativo: true,
                        dados: { email },
                        mensagem: { tipo: 'danger', texto: 'Esta conta não possui acesso administrativo.' }
                    });
                }

                await new Promise((resolve, reject) => {
                    req.session.regenerate((erro) => erro ? reject(erro) : resolve());
                });

                req.session.usuario = {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    tipo: usuario.tipo
                };

                req.session.mensagem = { tipo: 'success', texto: `Bem-vindo(a), ${usuario.nome}!` };
                res.redirect(usuario.tipo === 'admin' ? '/adm' : '/');
            } catch (erro) {
                console.error(erro);
                res.status(500).render('auth/login', {
                    administrativo: req.path.startsWith('/adm'),
                    dados: { email: req.body.email },
                    mensagem: { tipo: 'danger', texto: 'Não foi possível entrar agora.' }
                });
            }
        };

        this.sair = (req, res) => {
            req.session.destroy(() => {
                res.clearCookie('ifcine.sid');
                res.redirect('/');
            });
        };
    }
}
