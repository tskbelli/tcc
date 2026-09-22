import express from 'express';
import AdminController from '../controllers/AdminController.js';
import AdminUsuarioController from '../controllers/AdminUsuarioController.js';
import AdminAvaliacaoController from '../controllers/AdminAvaliacaoController.js';
import EdicaoGincanaController from '../controllers/EdicaoGincanaController.js';
import { somenteAdmin } from '../middlewares/auth.js';

const router = express.Router();
const admin = new AdminController();
const usuarios = new AdminUsuarioController();
const avaliacoes = new AdminAvaliacaoController();
const gincanas = new EdicaoGincanaController();

router.get('/adm', somenteAdmin, admin.painel);
router.get('/adm/usuario/lst', somenteAdmin, usuarios.list);
router.post('/adm/usuario/ativo/:id', somenteAdmin, usuarios.alternarAtivo);
router.post('/adm/usuario/tipo/:id', somenteAdmin, usuarios.alternarTipo);
router.get('/adm/avaliacao/lst', somenteAdmin, avaliacoes.list);
router.post('/adm/avaliacao/ativo/:id', somenteAdmin, avaliacoes.alternar);
router.post('/adm/avaliacao/del/:id', somenteAdmin, avaliacoes.del);
router.get('/adm/gincana/lst', somenteAdmin, gincanas.list);
router.get('/adm/gincana/filmes', somenteAdmin, gincanas.filmesDoAno);
router.get('/adm/gincana/add', somenteAdmin, gincanas.openAdd);
router.post('/adm/gincana/add', somenteAdmin, gincanas.add);
router.get('/adm/gincana/edt/:id', somenteAdmin, gincanas.openEdt);
router.post('/adm/gincana/edt/:id', somenteAdmin, gincanas.edt);
router.post('/adm/gincana/del/:id', somenteAdmin, gincanas.del);

export default router;
