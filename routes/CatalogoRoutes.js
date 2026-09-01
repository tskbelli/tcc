import express from 'express';
import CatalogoController from '../controllers/CatalogoController.js';

const router = express.Router();
const controle = new CatalogoController();

router.get('/', controle.catalogo);
router.get('/filmes', controle.catalogo);
router.get('/filmes/:id', controle.detalhes);

export default router;
