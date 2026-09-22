import express from 'express';
import multer from 'multer';
import { extname } from 'path';
import FilmeController from '../controllers/FilmeController.js';
import { somenteAdmin } from '../middlewares/auth.js';

const router = express.Router();
const controle = new FilmeController();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, arquivo, callback) => {
        const permitidos = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
        if (permitidos[extname(arquivo.originalname).toLowerCase()] === arquivo.mimetype) return callback(null, true);
        callback(new Error('Envie uma capa JPG, JPEG, PNG ou WebP.'));
    }
});

function validarImagem(req, res, next) {
    if (!req.file) return next();
    const buffer = req.file.buffer;
    const tipo = req.file.mimetype;
    const valida = (tipo === 'image/jpeg' && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
        || (tipo === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        || (tipo === 'image/webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP');
    if (!valida) return next(new Error('O arquivo enviado não corresponde a uma imagem JPG, PNG ou WebP.'));
    next();
}

router.get('/adm/filme/add', somenteAdmin, controle.openAdd);
router.post('/adm/filme/add', somenteAdmin, upload.single('capa'), validarImagem, controle.add);
router.get('/adm/filme/lst', somenteAdmin, controle.list);
router.get('/adm/filme/edt/:id', somenteAdmin, controle.openEdt);
router.post('/adm/filme/edt/:id', somenteAdmin, upload.single('capa'), validarImagem, controle.edt);
router.post('/adm/filme/ativo/:id', somenteAdmin, controle.alternar);
router.post('/adm/filme/del/:id', somenteAdmin, controle.del);

export default router;
