import 'dotenv/config';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { MONGODB_URI } from './conexao.js';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('Defina SESSION_SECRET nas variáveis de ambiente.');
}

const opcoes = {
    secret: process.env.SESSION_SECRET || 'ifcine-segredo-apenas-desenvolvimento',
    resave: false,
    saveUninitialized: false,
    name: 'ifcine.sid',
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8
    }
};

if (process.env.NODE_ENV !== 'test') {
    opcoes.store = MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessoes',
        ttl: 60 * 60 * 8
    });
}

export default session(opcoes);
