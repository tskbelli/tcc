# IFCine

Acervo de curtas acadêmicos com catálogo, avaliações, resenhas, Destaques e administração. O projeto mantém Node.js, Express, EJS, JavaScript, CSS, MongoDB e Mongoose, com a estrutura original de models, controllers e routes.

## Executar

Na pasta `tcc-main`, instale as dependências e inicie:

```bash
npm install
npm start
```

O MongoDB indicado em `MONGODB_URI` no seu `.env` precisa estar disponível. O endereço local padrão do site é **http://localhost:3001**, ou a porta configurada em `PORT`.

Para reiniciar automaticamente ao editar JavaScript:

```bash
npm run dev
```

Para criar um administrador, configure `ADMIN_NOME`, `ADMIN_EMAIL` e `ADMIN_SENHA` no `.env` e execute:

```bash
npm run criar-admin
```

O login administrativo continua em `/adm/login`, usando uma conta com tipo `admin`.

## O que mudou

A atualização de meias estrelas e pódios por ano está detalhada em [ALTERACOES-E-TESTES.md](ALTERACOES-E-TESTES.md), com a relação completa dos arquivos alterados e os testes manuais.

- A seção do catálogo mostra somente **Filmes em cartaz**, em tamanho médio, sem a contagem anterior.
- Notas de **0,5 a 5**, em passos de **0,5**, com seleção pela metade da estrela e exibição proporcional de notas e médias em todas as páginas.
- Cada usuário mantém uma avaliação por filme; novos envios atualizam a existente. Notas e comentários anteriores válidos são preservados.
- Nas Gincanas, o ano filtra os três campos de filmes automaticamente. O backend também exige que os três filmes sejam do ano da edição.

- Logo principal com largura máxima de 280 px no computador e 220 px em telas pequenas, proporcional e centralizada na sua coluna. A fonte, as cores e a logo do cabeçalho foram preservadas.
- Menu público **Destaques**, em `/destaques`, com pódio dos três filmes mais bem avaliados e seção **Ganhadores da Gincana**.
- O ranking utiliza a média exata das avaliações publicadas de filmes ativos. Não inclui filmes sem avaliações nem avaliações cujo autor foi removido. Empates usam quantidade de avaliações, título e, por último, ID. A média exibida usa até uma casa decimal, mas o cálculo não é arredondado antes de ordenar. Cada usuário é contabilizado uma única vez por filme.
- Com um ou dois filmes avaliados, aparecem apenas as posições disponíveis. Sem avaliações, aparece uma mensagem explicativa.
- Menu administrativo **Gincanas**, em `/adm/gincana/lst`, para cadastrar, editar e excluir edições. Cada edição exige ano válido e três filmes diferentes selecionados entre os cadastros do mesmo ano.
- Edições são salvas na coleção do model `EdicaoGincana`, com referências aos filmes e índice único para o ano. Não é necessário cadastrar coleções manualmente.
- O pódio público mostra por padrão a edição mais recente e permite escolher outro ano. Se um filme premiado for desativado, sua posição aparece como indisponível, sem expor os detalhes do filme. Para excluir um filme premiado, primeiro altere ou exclua a edição que o utiliza.
- Cadastro e edição de filmes aceitam capa somente por arquivo JPG, JPEG, PNG ou WebP, até 5 MB, com validação de extensão, MIME e assinatura do arquivo. O arquivo continua armazenado como Buffer no MongoDB.
- Duração dividida em **Minutos** e **Segundos**, salva em `duracaoSegundos`. São aceitos valores de 1 a 300 segundos, inclusive 5min00s. Os campos são obrigatórios e inteiros; segundos vão de 0 a 59 e, com 5 minutos, devem ser zero.
- Catálogo com busca por título e filtros combinados por gênero e ano.

## Compatibilidade com os dados existentes

Os filmes antigos continuam sendo lidos. Não é necessário apagar o banco ou executar uma migração em massa.

- O campo antigo `duracao` é interpretado como minutos quando `duracaoSegundos` ainda não existe. Ao editar o filme, a duração passa a ser salva em segundos e o campo antigo é removido desse registro.
- O campo antigo `capaExterna` permanece apenas para leitura de capas já cadastradas. Os formulários e controllers não aceitam novas URLs para capas. O virtual `capaSrc` fornece às views a imagem enviada ou a capa antiga.
- Editar sem enviar arquivo mantém a capa atual. Enviar um novo arquivo substitui a capa e remove a referência externa antiga. O formulário mostra a prévia atual e a imagem recém-selecionada.
- Se o formulário retornar um erro, selecione novamente o arquivo antes de reenviar; os demais campos e a prévia da capa já salva são preservados.
- Contas, senhas, sessões, links para assistir e avaliações existentes continuam usando os mesmos models e rotas.

## Arquivos principais

| Alteração | Arquivos |
| --- | --- |
| Logo e pódios | `public/css/style.css` |
| Duração | `utils/duracao.js`, `utils/validacao.js`, `models/filme.js`, `views/adm/filme/form.ejs`, `public/js/filme-form.js` |
| Upload e edição de filmes | `routes/FilmeRoutes.js`, `controllers/FilmeController.js` |
| Ranking | `utils/avaliacoes.js`, `controllers/DestaquesController.js` |
| Edições | `models/edicaoGincana.js`, `controllers/EdicaoGincanaController.js`, `routes/AdminRoutes.js`, `views/adm/gincana/` |
| Página pública | `routes/CatalogoRoutes.js`, `views/catalogo/destaques.ejs`, `views/partials/podio.ejs` |
| Filtros do catálogo | `controllers/CatalogoController.js`, `views/catalogo/index.ejs` |

## Verificações

```bash
npm run check
npm test
```

Na preparação desta versão, passaram **39 testes** de validação, models, controllers, preparação de duplicatas antigas e renderização de EJS. Os testes de controllers usam respostas de banco simuladas. A verificação de sintaxe cobre os arquivos JavaScript e as views.

O ambiente de preparação não permitiu iniciar um MongoDB temporário nem abrir a prévia local no navegador remoto. Portanto, a execução completa com banco e a inspeção visual no navegador ainda precisam ser verificadas no seu ambiente.

O teste de integração já está incluído em `test/integracao.test.js`. Para executá-lo com um MongoDB local disponível, em Linux/macOS:

```bash
IFCINE_TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm test
```

Esse teste cria um banco temporário com nome aleatório começando em `ifcine_test_` e o remove ao terminar. Ele não utiliza o banco do `.env`. Cobre cadastro, login, perfil, permissões, upload, substituição de capa, duração, filtros, avaliações, ranking e cadastro/edição/exclusão de edições. Sem `IFCINE_TEST_MONGODB_URI`, esse teste é marcado como ignorado.

## Conferência manual

1. Abra o catálogo no computador e no celular e confira a logo e os filtros.
2. Entre como administrador e cadastre um filme de 4min47s com capa por arquivo.
3. Edite sem escolher arquivo e confira se a capa permanece; depois envie outra imagem.
4. Tente salvar 5min01s, 0min00s e um ano futuro; o formulário deve impedir o envio.
5. Em Gincanas, escolha o ano e cadastre uma edição com três filmes diferentes desse mesmo ano. Visualize-a em Destaques.
6. Tente repetir um filme ou o ano de outra edição; o cadastro deve ser rejeitado.
7. Avalie com 4,5 estrelas e atualize para 3,5 com a mesma conta; a quantidade de avaliações não deve aumentar. Confira as médias e o ranking.
8. Edite e exclua uma edição; os filmes e as avaliações devem continuar cadastrados.
