import express from 'express';
import CatalogoController from '../controllers/CatalogoController.js';
import DestaquesController from '../controllers/DestaquesController.js';

const router = express.Router();
const controle = new CatalogoController();
const destaques = new DestaquesController();

router.get('/', controle.catalogo);
router.get('/filmes', controle.catalogo);
router.get('/destaques', destaques.index);
router.get('/filmes/:id', controle.detalhes);

export default router;
