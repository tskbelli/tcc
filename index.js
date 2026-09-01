import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';

import { conectarBanco } from './config/conexao.js';
import sessao from './config/sessao.js';
import variaveisLocais from './middlewares/variaveisLocais.js';
import authRoutes from './routes/AuthRoutes.js';
import catalogoRoutes from './routes/CatalogoRoutes.js';
import avaliacaoRoutes from './routes/AvaliacaoRoutes.js';
import usuarioRoutes from './routes/UsuarioRoutes.js';
import filmeRoutes from './routes/FilmeRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';

await conectarBanco();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(join(__dirname, 'public')));
app.use(sessao);
app.use(variaveisLocais);

app.use(authRoutes);
app.use(avaliacaoRoutes);
app.use(usuarioRoutes);
app.use(filmeRoutes);
app.use(adminRoutes);
app.use(catalogoRoutes);

app.use((req, res) => {
    res.status(404).render('erro', { titulo: 'Página não encontrada', texto: 'O endereço informado não existe.' });
});

app.use((erro, req, res, next) => {
    console.error(erro);
    if (erro instanceof multer.MulterError && erro.code === 'LIMIT_FILE_SIZE') {
        req.session.mensagem = { tipo: 'danger', texto: 'A capa deve ter no máximo 5 MB.' };
    } else {
        req.session.mensagem = { tipo: 'danger', texto: erro.message || 'Ocorreu um erro inesperado.' };
    }

    if (req.originalUrl.startsWith('/adm/filme')) return res.redirect('/adm/filme/lst');
    res.status(500).render('erro', { titulo: 'Erro inesperado', texto: 'Não foi possível concluir a operação.' });
});

const executadoDiretamente = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (executadoDiretamente && !process.env.VERCEL) {
    const porta = process.env.PORT || 3001;
    app.listen(porta, () => console.log(`IFCine rodando em http://localhost:${porta}`));
}

export default app;
