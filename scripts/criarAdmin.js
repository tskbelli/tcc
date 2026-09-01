import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { conectarBanco } from '../config/conexao.js';
import Usuario from '../models/usuario.js';

const nome = (process.env.ADMIN_NOME || 'Administrador IFCine').trim();
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const senha = process.env.ADMIN_SENHA || '';

if (!email || senha.length < 8) {
    console.error('Defina ADMIN_EMAIL e uma ADMIN_SENHA com pelo menos 8 caracteres no arquivo .env.');
    process.exit(1);
}

await conectarBanco();
const senhaProtegida = await bcrypt.hash(senha, 12);

await Usuario.findOneAndUpdate(
    { email },
    { nome, email, senha: senhaProtegida, tipo: 'admin', ativo: true },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

console.log(`Administrador ${email} criado ou atualizado.`);
process.exit(0);
