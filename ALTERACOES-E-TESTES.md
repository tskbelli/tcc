# IFCine — meias estrelas e Gincanas por ano

Atualização sobre a versão anterior do IFCine, mantendo Node.js, Express, EJS, JavaScript, CSS, MongoDB e Mongoose. Não foram adicionados frameworks ou dependências.

## Resultado

- A página inicial mostra **Filmes em cartaz**, sem a contagem de filmes encontrados, com o mesmo tipo de letra e tamanho médio responsivo.
- Os três selects de vencedores mostram apenas filmes do ano da edição. Ao mudar o ano, as opções são atualizadas automaticamente e seleções incompatíveis são limpas.
- O backend rejeita filmes de outro ano, posições repetidas, ano futuro e edição com ano já cadastrado.
- Avaliações aceitam 0,5; 1; 1,5; 2; 2,5; 3; 3,5; 4; 4,5 e 5.
- Cada usuário possui uma única avaliação atual por filme. Um novo envio atualiza sua nota e seu comentário.
- Notas e médias têm estrelas preenchidas proporcionalmente. Uma nota 4,5 preenche quatro estrelas e meia; uma média 4,2 preenche quatro estrelas e 20% da quinta.
- O ranking continua ordenando a média real, sem arredondar antes da comparação. Só a apresentação do número usa até uma casa decimal.

## Arquivos modificados e novos

Os caminhos abaixo são relativos à pasta `tcc-main` do ZIP. “Novo” indica um arquivo adicionado nesta atualização.

| Tipo | Arquivo | Alteração |
| --- | --- | --- |
| Model | `models/avaliacao.js` | `nota` continua como Number; passa a aceitar passos de 0,5 entre 0,5 e 5. Campo `duplicadaDe` para preservar duplicatas antigas. Declaração de índice composto único para avaliações atuais. |
| Controller | `controllers/AvaliacaoController.js` | Validação de meia estrela, identidade obtida da sessão, atualização da avaliação existente e tratamento de dois envios simultâneos. Ignora tentativas de mudar usuário ou marcar histórico pelo formulário. |
| Controller | `controllers/EdicaoGincanaController.js` | Consulta e validação dos filmes pelo ano; endpoint que retorna os filmes para atualizar os selects. |
| Controller | `controllers/FilmeController.js` | Impede mudar o ano de um filme premiado quando a mudança deixaria a edição incompatível. |
| Controller | `controllers/CatalogoController.js` | Reutiliza o mesmo cálculo de médias do catálogo/ranking nos detalhes. Exibe apenas a avaliação atual de cada usuário. |
| Controller | `controllers/DestaquesController.js` | Vencedores públicos também são filtrados pelo ano da edição. Mantém a ordenação da média real. |
| Controller | `controllers/UsuarioController.js` | Histórico do perfil mostra uma avaliação atual por filme. |
| Controller | `controllers/AdminAvaliacaoController.js` | Moderação lista e altera avaliações atuais; duplicatas antigas preservadas não entram na lista normal. |
| Controller | `controllers/AdminController.js` | Contagem administrativa não inclui duplicatas antigas preservadas como histórico. |
| Route | `routes/AdminRoutes.js` | Nova rota GET `/adm/gincana/filmes?ano=2026`, protegida por `somenteAdmin`. |
| View | `views/catalogo/index.ejs` | Título Filmes em cartaz e componente de estrelas para a média. |
| View | `views/catalogo/detalhes.ejs` | Dez opções de nota em cinco estrelas, nota já dada, aviso de avaliação existente, botão Atualizar avaliação e médias/resenhas com frações. |
| View | `views/adm/gincana/form.ejs` | Selects do ano escolhido; estados de carregamento, quantidade insuficiente e aviso para edições antigas incompatíveis. |
| View | `views/adm/avaliacao/lst.ejs` | Meias estrelas na moderação. |
| View | `views/usuario/perfil.ejs` | Meias estrelas no histórico do usuário. |
| View | `views/partials/podio.ejs` | Notas decimais com estrelas no ranking. |
| View — novo | `views/partials/estrelas.ejs` | Componente reutilizado para estrelas e valor numérico nos detalhes, catálogo, ranking, perfil e moderação. Reaproveita Bootstrap Icons. |
| CSS | `public/css/style.css` | Título médio, meias estrelas selecionáveis, preenchimento proporcional das médias e ajustes para acomodar o componente nos cards. |
| JavaScript do front-end | `public/js/gincana-form.js` | Busca dos filmes ao alterar o ano, proteção contra respostas antigas, limpeza de seleções inválidas e validação de posições diferentes. |
| JavaScript do front-end — novo | `public/js/avaliacao-form.js` | Mostra a nota selecionada e permite aumentar/diminuir de meia em meia estrela pelas setas do teclado. Home seleciona 0,5; End seleciona 5. |
| Helper — novo | `utils/notas.js` | Validação, conversão de entradas, formatação em português e porcentagens para preencher as estrelas. |
| Helper | `utils/avaliacoes.js` | Deduplicação por usuário/filme antes da média e reaproveitamento da seleção de avaliações atuais. |
| Middleware | `middlewares/variaveisLocais.js` | Disponibiliza os helpers de notas e estrelas para as views. |
| Configuração — novo | `config/avaliacoes.js` | Preserva duplicatas legadas e garante o índice de unicidade antes de receber avaliações. |
| Inicialização | `index.js` | Executa a preparação das avaliações após conectar ao banco e antes de atender requisições. |
| Testes — novo | `test/avaliacoes.test.js` | Notas válidas/adulteradas, atualização sem duplicar, concorrência simulada, estrelas, histórico e preservação de duplicatas. |
| Testes — novo | `test/gincana.test.js` | Filtro anual, rejeição de IDs de outro ano, cadastro válido e proteção do ano de filmes premiados. |
| Testes | `test/controllers.test.js` | Ajusta a expectativa de mensagem para filmes incompatíveis com o ano. Mantém os testes anteriores. |
| Testes | `test/views.test.js` | Título sem contagem, dez radios, recuperação da nota existente e estrelas fracionárias nas páginas. |
| Testes | `test/integracao.test.js` | Atualiza a suíte HTTP/MongoDB para testar meias estrelas, média, unicidade, pódios do ano e preservação de duplicatas. |
| Documentação | `README.md` | Atualiza as instruções e o resumo de funcionalidades. |
| Documentação — novo | `ALTERACOES-E-TESTES.md` | Este relatório, com arquivos, compatibilidade e roteiro de testes. |

O único model modificado nesta etapa foi `Avaliacao`. As estruturas de `Filme`, `Usuario` e `EdicaoGincana` foram reaproveitadas. A rota POST `/filmes/:filmeId/avaliar` continua a mesma; não foi necessário modificar `routes/AvaliacaoRoutes.js`.

As configurações do `.env`, o `package.json`, o arquivo de dependências, autenticação, uploads, duração em segundos, fonte, cores e logos foram preservados.

## O que acontece no MongoDB

`nota` permanece como Number. Essa representação suporta 0,5 e outros valores decimais; avaliações inteiras antigas continuam válidas.

A preparação acontece automaticamente na inicialização do site:

1. Se o índice único completo de usuário + filme já existe, ele é mantido.
2. Se não existe um índice que garanta essa regra, o código procura duplicatas antigas.
3. A avaliação mais recente é considerada a atual, pela ordem `updatedAt`, `createdAt` e `_id` decrescentes.
4. As demais permanecem na mesma coleção, com o campo `duplicadaDe` apontando para a avaliação atual. Não são apagados documentos, notas, comentários, datas nem estados de moderação nessa preparação.
5. É criado o índice único parcial `usuario_filme_unico`, em `{ usuario: 1, filme: 1 }`, para os documentos com `duplicadaDe: null`. Documentos antigos sem esse campo também são considerados atuais. Os registros históricos ficam fora do índice e dos cálculos.

Uma avaliação oculta pela moderação continua ocupando a única avaliação daquele usuário para o filme. Atualizar uma avaliação reaproveita o mesmo documento. As rotas nunca aceitam `duplicadaDe`, usuário ou filme arbitrários pelo formulário de nota: a identidade vem da sessão e o filme vem da rota validada.

O histórico preservado pode ser consultado diretamente na coleção de avaliações pelo campo `duplicadaDe` preenchido. Ele não é republicado automaticamente se a avaliação atual for excluída.

Os resumos agrupam usuário + filme antes de calcular média e quantidade, como proteção adicional. Uma avaliação atual oculta não faz uma duplicata antiga publicada reaparecer.

A preparação automática não foi executada no seu banco nesta conversa. Ela ocorrerá quando você iniciar esta versão com o MongoDB configurado. Não é necessário apagar o banco, limpar as avaliações ou executar uma migração manual.

## Edições antigas com filmes de anos diferentes

As edições são preservadas. Filmes incompatíveis não são oferecidos nos selects e não aparecem como vencedores de outro ano na página pública. No formulário de edição aparece um aviso para escolher filmes do ano correto. A posição incompatível permanece como indisponível até a correção.

Para mudar o ano de um filme premiado, primeiro ajuste a edição correspondente. Isso impede invalidar um pódio já salvo.

## Executar e verificar

Na pasta `tcc-main`, com o `.env` e o MongoDB disponíveis:

```bash
npm install
npm start
```

A porta padrão continua sendo 3001. Use `/adm/login` para entrar como administrador. Os vencedores estão em **Administração → Gincanas**.

Testes sem banco:

```bash
npm run check
npm test
```

Nesta atualização, **39 testes passaram**. Eles verificam validações, models, controllers com respostas simuladas, preparação de duplicatas com coleção simulada e renderização EJS.

A integração real com MongoDB e a conferência visual em navegador continuam pendentes neste ambiente: o MongoDB temporário não pôde ser iniciado e o navegador remoto bloqueou a prévia local na verificação anterior. Esses limites não foram contornados. Portanto, os resultados acima não representam uma execução completa do sistema com banco.

Para executar a suíte de integração em Linux/macOS, com MongoDB local disponível:

```bash
IFCINE_TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm test
```

Ela cria e remove somente um banco próprio, com nome aleatório começando em `ifcine_test_`. O banco do `.env` não é utilizado. Sem essa variável, a suíte de integração aparece como ignorada.

## Como testar pela interface

### 1. Meia estrela

1. Entre com uma conta de usuário e abra um filme ativo.
2. Toque/clique na metade esquerda da quinta estrela para selecionar **4,5**. O texto deve mostrar **Sua nota: 4,5 / 5**.
3. Salve e recarregue a página. A nota 4,5 deve continuar selecionada, acompanhada de quatro estrelas e meia.
4. Confira a mesma nota no perfil e na moderação administrativa.
5. Teste também 0,5 e 5. Pelo teclado, Tab chega ao grupo de notas; as setas alteram 0,5 por vez.

### 2. Uma avaliação por usuário e filme

1. Com a mesma conta, avalie um filme com **4,5** e um comentário.
2. Reabra o filme: devem aparecer o aviso **Você já avaliou este filme**, a nota existente e **Atualizar avaliação**.
3. Mude para **3,5**, altere o comentário e salve.
4. A nota e o comentário devem mudar; a quantidade de avaliações do filme deve permanecer igual.
5. Use outra conta para avaliar o mesmo filme: a quantidade aumenta em um. Use a primeira conta para avaliar outro filme: a operação deve ser permitida.

### 3. Filmes do mesmo ano da Gincana

1. Cadastre pelo menos três filmes com ano **2026** e três com ano **2025**.
2. Abra Gincanas → Nova edição e informe **2026**. Os três selects devem oferecer exclusivamente os filmes de 2026.
3. Mude para **2025**. As opções devem ser atualizadas e as seleções de 2026, removidas.
4. Com menos de três filmes no ano escolhido, deve aparecer um aviso e o botão Salvar edição fica indisponível.
5. Escolha o mesmo filme em duas posições: o envio deve ser impedido. Escolha três filmes distintos e salve.
6. Tente trocar o ano de um filme já premiado para outro ano: o backend deve pedir o ajuste da edição antes.

### 4. Médias

Use um filme de teste ainda sem avaliações e três contas diferentes:

| Conta | Nota |
| --- | ---: |
| Usuário 1 | 4,5 |
| Usuário 2 | 5 |
| Usuário 3 | 4 |

A média deve ser **4,5**, com **3 avaliações**, nos detalhes e no catálogo: `(4,5 + 5 + 4) / 3 = 4,5`.

Se o Usuário 2 alterar sua nota de 5 para 3,5, a média passa para **4**, ainda com **3 avaliações**. Isso verifica que o novo envio atualiza o registro existente.

### 5. Ranking de Destaques

Para testar o top 3, use uma base de testes em que estes sejam os únicos filmes ativos avaliados:

| Filme | Notas de usuários distintos | Média real | Exibição |
| --- | --- | ---: | ---: |
| A | 5; 5; 4,5 | 4,833… | 4,8 |
| B | 4,5; 4,5; 4,5 | 4,5 | 4,5 |
| C | 4; 4; 4,5 | 4,166… | 4,2 |

A ordem deve ser **A → B → C**. Filmes sem avaliações não participam. Alterar a nota de uma conta deve recalcular a média, mantendo a quantidade de avaliações. Em empate na média real, vence a maior quantidade; persistindo, o título e depois o ID determinam a ordem.

### 6. Validações do backend

Em sua cópia local de testes, use a opção de editar e reenviar uma requisição nas ferramentas do navegador:

- No POST de avaliação, envie `nota=3.2`, `nota=4.7`, `nota=0`, `nota=5.5` e `nota=-1`. Deve aparecer uma mensagem de erro, sem gravar ou modificar a nota anterior.
- No POST de cadastro/edição da Gincana, mantenha `ano=2026` e troque um vencedor por um ID real de filme de 2025. Deve retornar erro informando que os filmes precisam pertencer ao ano da edição.
- Reenvie uma avaliação válida com o mesmo usuário e filme: deve atualizar a existente, sem aumentar a quantidade.

## Referências técnicas consultadas

A unicidade parcial aplica-se aos documentos que atendem ao filtro, permitindo conservar o histórico fora do conjunto de avaliações atuais: [documentação de índices parciais do MongoDB](https://www.mongodb.com/docs/manual/core/index-partial/).

A atualização reutiliza `findOneAndUpdate`, que pode atualizar a avaliação existente ou inserir a primeira: [documentação do Mongoose](https://mongoosejs.com/docs/tutorials/findoneandupdate.html).
