# Memento — Lembretes (Programação III / UMFG 2026)

Atividade desenvolvida a partir dos projetos base do professor:

- API: [leicam/umfg-programacao-iii-minimal-api-2026](https://github.com/leicam/umfg-programacao-iii-minimal-api-2026)
- Front-end: [leicam/umfg-programacao-iii-front-end-2026](https://github.com/leicam/umfg-programacao-iii-front-end-2026)

```
api/         Minimal API .NET 8 + Entity Framework Core + MySQL + QuestPDF
front-end/   HTML + CSS + JavaScript puro (fetch)
```

## Como executar

### 1. Banco de dados (MySQL)

A connection string de desenvolvimento (`api/.../appsettings.Development.json`) aponta para `localhost:3306`, usuário `root`, senha `root`. Com Docker:

```bash
docker run -d --name umfg-mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 mysql:8.0
```

As migrations são aplicadas automaticamente no construtor do `MySqlContexto`.

### 2. API

Requer o .NET 8 SDK.

```bash
dotnet dev-certs https --trust
cd api/umfg.programacaoiii.minimalapi.2026
dotnet run --launch-profile https
```

A API fica disponível em `https://localhost:7063`. O arquivo `umfg.programacaoiii.minimalapi.2026.http` contém exemplos de todas as requisições.

### 3. Front-end

Sirva a pasta `front-end` em qualquer servidor estático (Live Server do VS Code ou):

```bash
cd front-end
npx http-server -p 5500 -c-1
```

Acesse `http://127.0.0.1:5500`.

## Endpoints da API

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/lembretes` | Lista todos os lembretes ativos |
| GET | `/lembretes/{id}` | Busca um lembrete pelo id |
| GET | `/lembretes/filtro` | Consulta com filtros, paginação e ordenação |
| GET | `/lembretes/imprimir` | Gera um PDF com os mesmos parâmetros do filtro |
| POST | `/lembretes` | Cadastra (`{ "descricao": "..." }`) |
| PUT | `/lembretes/{id}` | Atualiza a descrição |
| DELETE | `/lembretes/{id}` | Exclusão lógica (`IsAtivo = false`) |

Parâmetros de `/lembretes/filtro`: `NumeroPagina`, `TamanhoPagina`, `Ordem` (`Descricao`, `DataCadastro`, `DataAtualizacao`), `Direcao` (`ASC`/`DESC`), `Descricao`, `DataCadastroInicial`, `DataCadastroFinal`, `DataAtualizacaoInicial`, `DataAtualizacaoFinal`.

## Comunicação front-end e API

O `js/app.js` usa `fetch` com uma função por endpoint (`filtrarLembretes`, `buscarLembrete`, `criarLembrete`, `atualizarLembrete`, `excluirLembrete`, `imprimirLembretes`). Os parâmetros de filtro, paginação e ordenação são montados em um único lugar (`montarParametros`) com `URLSearchParams`; filtros vazios não são enviados. As respostas JSON são renderizadas na tabela, e os erros são exibidos em mensagens (toasts) e no estado da listagem.

## CORS

O front-end roda em uma origem (`http://127.0.0.1:5500`) e a API em outra (`https://localhost:7063`): esquema, host e porta são diferentes. Por segurança, o navegador aplica a *Same-Origin Policy* e bloqueia a leitura da resposta de uma requisição para outra origem, a não ser que o servidor autorize com o header `Access-Control-Allow-Origin`. Para requisições com `Content-Type: application/json` (POST/PUT) e para os métodos PUT/DELETE, o navegador ainda envia antes uma requisição *preflight* `OPTIONS`, que precisa ser respondida com `Access-Control-Allow-Methods` e `Access-Control-Allow-Headers`.

Na API, a política `Frontend` é registrada com `AddCors` e ativada com `app.UseCors("Frontend")`. Ela libera qualquer origem, header e método (`AllowAnyOrigin`, `AllowAnyHeader`, `AllowAnyMethod`), o que é adequado para desenvolvimento local. Em produção, o correto é restringir com `.WithOrigins("https://dominio-do-front")`.

## O que foi implementado

### Front-end

- **Interface própria (tema "Memento")**: paleta papel/verde-petróleo/mostarda, fontes Bricolage Grotesque e DM Sans, layout em duas colunas (filtros + listagem), formulário e confirmação de exclusão em modais (`<dialog>`), tema claro/escuro salvo no `localStorage` e layout responsivo (no celular a tabela vira uma lista de cartões).
- **Filtros**: descrição, data de cadastro inicial/final e data de atualização inicial/final, com botão para limpar, contador de filtros ativos e validação de período (data final maior ou igual à inicial).
- **Paginação**: seleção de registros por página (5, 10, 20, 50), botões anterior/próximo e números de página com reticências (ex.: `1 ... 4 5 6 ... 12`).
- **Ordenação**: clique no título das colunas Descrição, Cadastro e Atualização. Clicar de novo na mesma coluna inverte a direção, e uma seta indica a ordenação atual. Também funciona pelo teclado (Enter/Espaço).
- **Mensagens e usabilidade**: toasts de sucesso, erro e aviso; estados de carregando, nenhum registro encontrado e falha de comunicação com a API (com botão "Tentar novamente"); validação de campo obrigatório com mensagem no próprio campo; contador de caracteres; botões com indicador de carregamento; tratamento de 404 (registro excluído por outra pessoa).
- **Segurança**: a descrição é escapada antes de ser inserida no HTML, para evitar XSS.

### Correções e otimizações na API

- **Ordenação**: o código original fazia `OrderBy(x => dto.Ordem)`, ou seja, ordenava por uma constante e não pelo campo. Agora a ordenação é feita por uma lista de campos permitidos (`Descricao`, `DataCadastro`, `DataAtualizacao`), com `ThenBy(Id)` para manter a ordem estável entre as páginas.
- **Filtros opcionais**: com `[AsParameters]`, propriedades não anuláveis são tratadas como obrigatórias, e a API retornava 400 se alguma data não fosse enviada. Além disso, os valores padrão das datas estavam trocados (`DataCadastroFinal = MinValue`, `DataAtualizacaoInicial = MaxValue`). Os filtros passaram a ser anuláveis (`DateTime?`, `string?`) e só são aplicados quando informados.
- **Total**: calculado antes da paginação.
- **Validações**: ids inválidos retornam 400 em vez de exceção (`Guid.TryParse`); POST/PUT rejeitam descrição vazia com 400; PUT/DELETE retornam 404 para lembretes já excluídos.
- Remoção da validação duplicada em `/lembretes/imprimir` e dos avisos de método obsoleto do QuestPDF.

## Validação das requisições (DevTools)

Na aba **Network** do navegador (F12), com o filtro *Fetch/XHR*:

- `GET /lembretes/filtro?NumeroPagina=1&TamanhoPagina=10&Ordem=DataCadastro&Direcao=DESC`: status 200, resposta `{ lembretes, total, numeroPagina, tamanhoPagina }`. Ao aplicar filtros ou clicar nas colunas, a query string muda (`&Descricao=...&DataCadastroInicial=2026-11-20`, `Ordem=Descricao&Direcao=ASC`).
- `POST /lembretes`: header `Content-Type: application/json`, corpo `{"descricao":"..."}`, status 201. Antes dele aparece o preflight `OPTIONS` com status 204.
- `GET /lembretes/{id}`: status 200. `PUT /lembretes/{id}`: corpo JSON, status 200.
- `DELETE /lembretes/{id}`: status 204.
- Nas respostas, o header `Access-Control-Allow-Origin: *` confirma a política de CORS.
