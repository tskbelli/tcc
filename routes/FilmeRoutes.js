import express from 'express';
import multer from 'multer';
import FilmeController from '../controllers/FilmeController.js';
import { somenteAdmin } from '../middlewares/auth.js';

const router = express.Router();
const controle = new FilmeController();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, arquivo, callback) => {
        const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (permitidos.includes(arquivo.mimetype)) return callback(null, true);
        callback(new Error('Envie uma capa JPG, PNG ou WEBP.'));
    }
});

router.get('/adm/filme/add', somenteAdmin, controle.openAdd);
router.post('/adm/filme/add', somenteAdmin, upload.single('capa'), controle.add);
router.get('/adm/filme/lst', somenteAdmin, controle.list);
router.get('/adm/filme/edt/:id', somenteAdmin, controle.openEdt);
router.post('/adm/filme/edt/:id', somenteAdmin, upload.single('capa'), controle.edt);
router.post('/adm/filme/ativo/:id', somenteAdmin, controle.alternar);
router.post('/adm/filme/del/:id', somenteAdmin, controle.del);

export default router;
