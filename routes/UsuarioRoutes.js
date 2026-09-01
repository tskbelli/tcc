import express from 'express';
import UsuarioController from '../controllers/UsuarioController.js';
import { somenteAutenticado } from '../middlewares/auth.js';

const router = express.Router();
const controle = new UsuarioController();

router.get('/perfil', somenteAutenticado, controle.perfil);

export default router;
