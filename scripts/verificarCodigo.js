import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';
import ejs from 'ejs';

const raiz = process.cwd();
const ignorados = new Set(['node_modules', '.git']);
const arquivosJs = [];
const arquivosEjs = [];

function percorrer(pasta) {
    for (const nome of readdirSync(pasta)) {
        if (ignorados.has(nome)) continue;
        const caminho = join(pasta, nome);
        const dados = statSync(caminho);
        if (dados.isDirectory()) percorrer(caminho);
        else if (nome.endsWith('.js')) arquivosJs.push(caminho);
        else if (nome.endsWith('.ejs')) arquivosEjs.push(caminho);
    }
}

percorrer(raiz);

for (const arquivo of arquivosJs) {
    const resultado = spawnSync(process.execPath, ['--check', arquivo], { encoding: 'utf8' });
    if (resultado.status !== 0) {
        console.error(resultado.stderr);
        process.exit(resultado.status || 1);
    }
}

for (const arquivo of arquivosEjs) {
    try {
        ejs.compile(readFileSync(arquivo, 'utf8'), { filename: arquivo });
    } catch (erro) {
        console.error(`Erro em ${relative(raiz, arquivo)}: ${erro.message}`);
        process.exit(1);
    }
}

console.log(`${arquivosJs.length} arquivos JavaScript e ${arquivosEjs.length} views EJS verificados.`);
