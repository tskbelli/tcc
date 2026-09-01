import express from 'express';
import AdminController from '../controllers/AdminController.js';
import AdminUsuarioController from '../controllers/AdminUsuarioController.js';
import AdminAvaliacaoController from '../controllers/AdminAvaliacaoController.js';
import { somenteAdmin } from '../middlewares/auth.js';

const router = express.Router();
const admin = new AdminController();
const usuarios = new AdminUsuarioController();
const avaliacoes = new AdminAvaliacaoController();

router.get('/adm', somenteAdmin, admin.painel);
router.get('/adm/usuario/lst', somenteAdmin, usuarios.list);
router.post('/adm/usuario/ativo/:id', somenteAdmin, usuarios.alternarAtivo);
router.post('/adm/usuario/tipo/:id', somenteAdmin, usuarios.alternarTipo);
router.get('/adm/avaliacao/lst', somenteAdmin, avaliacoes.list);
router.post('/adm/avaliacao/ativo/:id', somenteAdmin, avaliacoes.alternar);
router.post('/adm/avaliacao/del/:id', somenteAdmin, avaliacoes.del);

export default router;
