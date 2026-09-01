import 'dotenv/config';
import mongoose from 'mongoose';

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ifcine';

let conexaoPendente;

export async function conectarBanco() {
    if (mongoose.connection.readyState === 1) return mongoose;

    if (!conexaoPendente) {
        conexaoPendente = mongoose.connect(MONGODB_URI).catch((erro) => {
            conexaoPendente = null;
            throw erro;
        });
    }

    await conexaoPendente;
    return mongoose;
}

export default mongoose;
