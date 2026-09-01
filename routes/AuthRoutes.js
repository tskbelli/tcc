import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { somenteVisitante } from '../middlewares/auth.js';

const router = express.Router();
const controle = new AuthController();

router.get('/login', somenteVisitante, controle.abrirLogin);
router.post('/login', somenteVisitante, controle.entrar);
router.get('/cadastro', somenteVisitante, controle.abrirCadastro);
router.post('/cadastro', somenteVisitante, controle.cadastrar);
router.get('/adm/login', somenteVisitante, controle.abrirLoginAdmin);
router.post('/adm/login', somenteVisitante, controle.entrar);
router.post('/logout', controle.sair);

export default router;
