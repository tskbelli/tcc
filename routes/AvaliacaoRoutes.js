import express from 'express';
import AvaliacaoController from '../controllers/AvaliacaoController.js';
import { somenteAutenticado } from '../middlewares/auth.js';

const router = express.Router();
const controle = new AvaliacaoController();

router.post('/filmes/:filmeId/avaliar', somenteAutenticado, controle.salvar);

export default router;
