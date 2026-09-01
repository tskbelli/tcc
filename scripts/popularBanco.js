import { conectarBanco } from '../config/conexao.js';
import Filme from '../models/filme.js';

await conectarBanco();

const quantidade = await Filme.countDocuments();
if (quantidade > 0) {
    console.log('O banco já possui filmes. Nenhum exemplo foi adicionado.');
    process.exit(0);
}
