// ========================================
// CONFIGURAÇÃO
// ========================================

const API_URL = "https://localhost:7063";

const TAMANHO_MAXIMO_DESCRICAO = 500;

let paginaAtual = 1;
let totalPaginas = 1;
let ordemAtual = "DataCadastro";
let direcaoAtual = "DESC";
let lembreteParaExcluir = null;


// ========================================
// ELEMENTOS DA PÁGINA
// ========================================

const formulario = document.getElementById("formulario");
const formLembrete = document.getElementById("formLembrete");

const lembreteId = document.getElementById("lembreteId");
const descricao = document.getElementById("descricao");
const erroDescricao = document.getElementById("erroDescricao");
const contadorCaracteres = document.getElementById("contadorCaracteres");

const listaLembretes = document.getElementById("listaLembretes");
const mensagemVazia = document.getElementById("mensagemVazia");
const mensagemErro = document.getElementById("mensagemErro");
const mensagemErroDetalhe = document.getElementById("mensagemErroDetalhe");
const estadoCarregando = document.getElementById("estadoCarregando");

const formFiltro = document.getElementById("formFiltro");
const filtroDescricao = document.getElementById("filtroDescricao");
const filtroDataCadastroInicial = document.getElementById("filtroDataCadastroInicial");
const filtroDataCadastroFinal = document.getElementById("filtroDataCadastroFinal");
const filtroDataAtualizacaoInicial = document.getElementById("filtroDataAtualizacaoInicial");
const filtroDataAtualizacaoFinal = document.getElementById("filtroDataAtualizacaoFinal");
const erroDataCadastro = document.getElementById("erroDataCadastro");
const erroDataAtualizacao = document.getElementById("erroDataAtualizacao");
const contadorFiltros = document.getElementById("contadorFiltros");
const tamanhoPagina = document.getElementById("tamanhoPagina");

const totalRegistros = document.getElementById("totalRegistros");
const paginaAtualElemento = document.getElementById("paginaAtual");
const numerosPagina = document.getElementById("numerosPagina");
const colunasOrdenaveis = document.querySelectorAll("th.ordenavel");

const btnTema = document.getElementById("btnTema");
const btnImprimir = document.getElementById("btnImprimir");
const btnNovo = document.getElementById("btnNovo");
const btnCancelar = document.getElementById("btnCancelar");
const btnFechar = document.getElementById("btnFechar");
const btnSalvar = document.getElementById("btnSalvar");
const btnLimpar = document.getElementById("btnLimpar");
const btnTentarNovamente = document.getElementById("btnTentarNovamente");

const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

const tituloFormulario = document.getElementById("tituloFormulario");

const modalConfirmacao = document.getElementById("modalConfirmacao");
const confirmacaoDescricao = document.getElementById("confirmacaoDescricao");
const btnConfirmacaoCancelar = document.getElementById("btnConfirmacaoCancelar");
const btnConfirmacaoExcluir = document.getElementById("btnConfirmacaoExcluir");


// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    aplicarTema(localStorage.getItem("tema") || "claro");
    atualizarIndicadoresOrdenacao();
    filtrarLembretes();
});


// ========================================
// PARÂMETROS DE CONSULTA (filtro + paginação + ordenação)
// ========================================
function montarParametros() {
    const params = new URLSearchParams();

    params.append("NumeroPagina", paginaAtual);
    params.append("TamanhoPagina", tamanhoPagina.value);
    params.append("Ordem", ordemAtual);
    params.append("Direcao", direcaoAtual);

    //filtros opcionais: só são enviados quando preenchidos
    const filtros = {
        Descricao: filtroDescricao.value.trim(),
        DataCadastroInicial: filtroDataCadastroInicial.value,
        DataCadastroFinal: filtroDataCadastroFinal.value,
        DataAtualizacaoInicial: filtroDataAtualizacaoInicial.value,
        DataAtualizacaoFinal: filtroDataAtualizacaoFinal.value
    };

    Object.entries(filtros).forEach(([chave, valor]) => {
        if (valor) {
            params.append(chave, valor);
        }
    });

    return params;
}


// ========================================
// GET /lembretes/filtro
// ========================================
async function filtrarLembretes() {
    mostrarEstado("carregando");

    try {
        const params = montarParametros();

        const response = await fetch(
            `${API_URL}/lembretes/filtro?${params}`
        );

        if (!response.ok) {
            throw new Error(await lerMensagemErro(response, "Erro ao filtrar lembretes."));
        }

        const resultado = await response.json();

        totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.tamanhoPagina));

        //se a página atual deixou de existir (ex.: exclusão do último item), volta para a última válida
        if (paginaAtual > totalPaginas && resultado.total > 0) {
            paginaAtual = totalPaginas;
            return filtrarLembretes();
        }

        renderizarLembretes(resultado.lembretes);
        renderizarPaginacao(resultado.total);

    } catch (error) {

        console.error(error);

        const mensagem = traduzirErro(error, "Erro ao realizar o filtro.");

        mostrarEstado("erro", mensagem);
        renderizarPaginacao(0);
        mostrarToast(mensagem, "erro");
    }
}


// ========================================
// GET /lembretes/imprimir
// ========================================
async function imprimirLembretes() {
    definirCarregando(btnImprimir, true);

    try {
        const params = montarParametros();

        const response = await fetch(
            `${API_URL}/lembretes/imprimir?${params}`
        );

        if (!response.ok) {
            throw new Error(await lerMensagemErro(response, "Erro ao gerar o relatório."));
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio-lembretes.pdf";

        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 10000);

        mostrarToast("Relatório gerado com sucesso!", "sucesso");

    } catch (error) {

        console.error(error);

        mostrarToast(traduzirErro(error, "Não foi possível gerar o relatório."), "erro");

    } finally {
        definirCarregando(btnImprimir, false);
    }
}


// ========================================
// POST /lembretes
// ========================================
async function criarLembrete() {
    try {

        const dados = {
            descricao: descricao.value.trim()
        };

        const response = await fetch(
            `${API_URL}/lembretes`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            }
        );

        if (!response.ok) {
            throw new Error(await lerMensagemErro(response, "Erro ao criar lembrete."));
        }

        mostrarToast("Lembrete criado com sucesso!", "sucesso");

        fecharFormulario();

        //novo registro aparece no topo quando a ordenação é a padrão
        paginaAtual = 1;
        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(traduzirErro(error, "Não foi possível criar o lembrete."), "erro");
    }
}


// ========================================
// GET /lembretes/{id}
// ========================================
async function buscarLembrete(id) {

    try {

        const response = await fetch(
            `${API_URL}/lembretes/${id}`
        );

        if (response.status === 404) {
            throw new Error("Lembrete não encontrado. Ele pode ter sido excluído.");
        }

        if (!response.ok) {
            throw new Error(await lerMensagemErro(response, "Erro ao buscar lembrete."));
        }

        const lembrete = await response.json();

        abrirFormulario("Editar lembrete", lembrete.id, lembrete.descricao);

    } catch (error) {

        console.error(error);

        mostrarToast(traduzirErro(error, "Não foi possível buscar o lembrete."), "erro");
    }
}


// ========================================
// PUT /lembretes/{id}
// ========================================
async function atualizarLembrete() {

    try {

        const dados = {
            descricao: descricao.value.trim()
        };

        const response = await fetch(
            `${API_URL}/lembretes/${lembreteId.value}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(dados)
            }
        );

        if (response.status === 404) {
            throw new Error("Lembrete não encontrado. Ele pode ter sido excluído.");
        }

        if (!response.ok) {
            throw new Error(await lerMensagemErro(response, "Erro ao atualizar."));
        }

        mostrarToast("Lembrete atualizado com sucesso!", "sucesso");

        fecharFormulario();

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(traduzirErro(error, "Não foi possível atualizar o lembrete."), "erro");
    }
}


// ========================================
// DELETE /lembretes/{id}
// ========================================
function confirmarExclusao(id, textoDescricao) {
    lembreteParaExcluir = id;
    confirmacaoDescricao.textContent = `"${textoDescricao}"`;
    modalConfirmacao.showModal();
    btnConfirmacaoCancelar.focus();
}

async function excluirLembrete(id) {

    definirCarregando(btnConfirmacaoExcluir, true);

    try {

        const response = await fetch(
            `${API_URL}/lembretes/${id}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 404) {
            throw new Error("Lembrete não encontrado. Ele pode já ter sido excluído.");
        }

        if (!response.ok) {
            throw new Error(await lerMensagemErro(response, "Erro ao excluir."));
        }

        mostrarToast("Lembrete excluído com sucesso!", "sucesso");

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(traduzirErro(error, "Não foi possível excluir o lembrete."), "erro");

    } finally {
        definirCarregando(btnConfirmacaoExcluir, false);
        modalConfirmacao.close();
        lembreteParaExcluir = null;
    }
}


// ========================================
// RENDERIZAÇÃO
// ========================================
function renderizarLembretes(lembretes) {
    listaLembretes.innerHTML = "";

    if (!lembretes || lembretes.length === 0) {
        mostrarEstado("vazio");

        return;
    }

    mostrarEstado("lista");

    lembretes.forEach(lembrete => {
        const tr = document.createElement("tr");
        const descricaoSegura = escaparHtml(lembrete.descricao);

        tr.innerHTML = `
            <td class="descricao" data-label="Descrição">
                ${descricaoSegura}
            </td>

            <td class="data" data-label="Cadastro">
                ${formatarData(lembrete.dataCadastro)}
            </td>

            <td class="data" data-label="Atualização">
                ${formatarData(lembrete.dataAtualizacao)}
            </td>

            <td data-label="Status">
                <span class="status ${
                    lembrete.isAtivo
                        ? "status-ativo"
                        : "status-inativo"
                }">
                    ${
                        lembrete.isAtivo
                            ? "Ativo"
                            : "Inativo"
                    }
                </span>
            </td>

            <td>
                <div class="actions">

                    <button
                        type="button"
                        class="btn btn-edit"
                        onclick="buscarLembrete('${lembrete.id}')">
                        Editar
                    </button>

                    <button
                        type="button"
                        class="btn btn-excluir"
                        data-descricao="${descricaoSegura}"
                        onclick="confirmarExclusao('${lembrete.id}', this.dataset.descricao)">
                        Excluir
                    </button>

                </div>
            </td>
        `;

        listaLembretes.appendChild(tr);
    });
}

function renderizarPaginacao(total) {
    totalRegistros.textContent =
        `${total} ${total === 1 ? "registro" : "registros"}`;

    paginaAtualElemento.textContent =
        `Página ${total === 0 ? 0 : paginaAtual} de ${total === 0 ? 0 : totalPaginas}`;

    btnAnterior.disabled =
        paginaAtual <= 1 || total === 0;

    btnProximo.disabled =
        paginaAtual >= totalPaginas || total === 0;

    numerosPagina.innerHTML = "";

    if (total === 0) {
        return;
    }

    calcularPaginasVisiveis().forEach(pagina => {
        if (pagina === "...") {
            const span = document.createElement("span");
            span.className = "reticencias";
            span.textContent = "...";
            numerosPagina.appendChild(span);

            return;
        }

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = `btn btn-page ${pagina === paginaAtual ? "ativa" : ""}`;
        botao.textContent = pagina;
        botao.setAttribute("aria-label", `Ir para a página ${pagina}`);

        if (pagina === paginaAtual) {
            botao.setAttribute("aria-current", "page");
        }

        botao.addEventListener("click", () => irParaPagina(pagina));

        numerosPagina.appendChild(botao);
    });
}

//exibe primeira, última e as vizinhas da atual. Ex.: 1 ... 4 5 6 ... 12
function calcularPaginasVisiveis() {
    const paginas = [];

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        const isExtremidade = pagina === 1 || pagina === totalPaginas;
        const isVizinha = Math.abs(pagina - paginaAtual) <= 1;

        if (isExtremidade || isVizinha) {
            paginas.push(pagina);
        } else if (paginas[paginas.length - 1] !== "...") {
            paginas.push("...");
        }
    }

    return paginas;
}

function mostrarEstado(estado, mensagem = "") {
    estadoCarregando.classList.toggle("hidden", estado !== "carregando");
    mensagemVazia.classList.toggle("hidden", estado !== "vazio");
    mensagemErro.classList.toggle("hidden", estado !== "erro");
    listaLembretes.classList.toggle("hidden", estado !== "lista");

    if (estado === "erro") {
        mensagemErroDetalhe.textContent = mensagem;
    }
}


// ========================================
// FORMULÁRIO
// ========================================
btnImprimir.addEventListener("click", () => {
    imprimirLembretes();
});

btnNovo.addEventListener("click", () => {
    abrirFormulario("Novo lembrete", "", "");
});

btnCancelar.addEventListener("click", () => {
    fecharFormulario();
});

btnFechar.addEventListener("click", () => {
    fecharFormulario();
});

descricao.addEventListener("input", () => {
    atualizarContador();

    if (descricao.value.trim()) {
        limparErroCampo(descricao, erroDescricao);
    }
});

formLembrete.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validarFormulario()) {
        mostrarToast("Preencha os campos obrigatórios.", "aviso");
        descricao.focus();

        return;
    }

    definirCarregando(btnSalvar, true);

    if (lembreteId.value) {
        await atualizarLembrete();
    } else {
        await criarLembrete();
    }

    definirCarregando(btnSalvar, false);
});

function validarFormulario() {
    const texto = descricao.value.trim();

    if (!texto) {
        mostrarErroCampo(descricao, erroDescricao, "A descrição é obrigatória.");

        return false;
    }

    if (texto.length > TAMANHO_MAXIMO_DESCRICAO) {
        mostrarErroCampo(descricao, erroDescricao, `A descrição deve ter no máximo ${TAMANHO_MAXIMO_DESCRICAO} caracteres.`);

        return false;
    }

    limparErroCampo(descricao, erroDescricao);

    return true;
}

function abrirFormulario(titulo, id, texto) {
    lembreteId.value = id;
    descricao.value = texto;

    tituloFormulario.textContent = titulo;

    limparErroCampo(descricao, erroDescricao);
    atualizarContador();

    formulario.showModal();
    descricao.focus();
}

function fecharFormulario() {
    formulario.close();
    formLembrete.reset();
    lembreteId.value = "";
    limparErroCampo(descricao, erroDescricao);
}

function atualizarContador() {
    contadorCaracteres.textContent =
        `${descricao.value.length}/${TAMANHO_MAXIMO_DESCRICAO}`;
}


// ========================================
// CONFIRMAÇÃO DE EXCLUSÃO
// ========================================
btnConfirmacaoCancelar.addEventListener("click", () => {
    modalConfirmacao.close();
});

btnConfirmacaoExcluir.addEventListener("click", () => {
    if (lembreteParaExcluir) {
        excluirLembrete(lembreteParaExcluir);
    }
});


// ========================================
// FILTRO
// ========================================
formFiltro.addEventListener("submit", event => {
    event.preventDefault();

    if (!validarFiltros()) {
        mostrarToast("Verifique os períodos informados nos filtros.", "aviso");

        return;
    }

    paginaAtual = 1;
    atualizarContadorFiltros();
    filtrarLembretes();
});

btnLimpar.addEventListener("click", () => {
    formFiltro.reset();
    limparErroCampo(filtroDataCadastroFinal, erroDataCadastro);
    limparErroCampo(filtroDataAtualizacaoFinal, erroDataAtualizacao);

    paginaAtual = 1;
    atualizarContadorFiltros();
    filtrarLembretes();
});

btnTentarNovamente.addEventListener("click", () => {
    filtrarLembretes();
});

function validarFiltros() {
    const cadastroValido = validarPeriodo(
        filtroDataCadastroInicial, filtroDataCadastroFinal, erroDataCadastro);

    const atualizacaoValida = validarPeriodo(
        filtroDataAtualizacaoInicial, filtroDataAtualizacaoFinal, erroDataAtualizacao);

    return cadastroValido && atualizacaoValida;
}

function validarPeriodo(campoInicial, campoFinal, elementoErro) {
    //input date usa o formato yyyy-MM-dd, então a comparação de texto é suficiente
    if (campoInicial.value && campoFinal.value && campoInicial.value > campoFinal.value) {
        mostrarErroCampo(campoFinal, elementoErro, "A data final deve ser maior ou igual à inicial.");

        return false;
    }

    limparErroCampo(campoFinal, elementoErro);

    return true;
}

function atualizarContadorFiltros() {
    const quantidade = [
        filtroDescricao,
        filtroDataCadastroInicial,
        filtroDataCadastroFinal,
        filtroDataAtualizacaoInicial,
        filtroDataAtualizacaoFinal
    ].filter(campo => campo.value.trim()).length;

    contadorFiltros.textContent = quantidade;
    contadorFiltros.classList.toggle("hidden", quantidade === 0);
}


// ========================================
// ORDENAÇÃO
// ========================================
colunasOrdenaveis.forEach(coluna => {
    coluna.addEventListener("click", () => {
        ordenarPor(coluna.dataset.ordem);
    });

    coluna.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            ordenarPor(coluna.dataset.ordem);
        }
    });
});

function ordenarPor(campo) {
    //mesma coluna inverte a direção; nova coluna começa em ASC
    if (ordemAtual === campo) {
        direcaoAtual = direcaoAtual === "ASC" ? "DESC" : "ASC";
    } else {
        ordemAtual = campo;
        direcaoAtual = "ASC";
    }

    paginaAtual = 1;
    atualizarIndicadoresOrdenacao();
    filtrarLembretes();
}

function atualizarIndicadoresOrdenacao() {
    colunasOrdenaveis.forEach(coluna => {
        const isAtiva = coluna.dataset.ordem === ordemAtual;

        coluna.setAttribute(
            "aria-sort",
            isAtiva ? (direcaoAtual === "ASC" ? "ascending" : "descending") : "none"
        );

        coluna.title = isAtiva
            ? `Ordenado ${direcaoAtual === "ASC" ? "crescente" : "decrescente"}. Clique para inverter.`
            : "Clique para ordenar";
    });
}


// ========================================
// PAGINAÇÃO
// ========================================
btnAnterior.addEventListener("click", () => {
    irParaPagina(paginaAtual - 1);
});

btnProximo.addEventListener("click", () => {
    irParaPagina(paginaAtual + 1);
});

tamanhoPagina.addEventListener("change", () => {
    paginaAtual = 1;
    filtrarLembretes();
});

function irParaPagina(pagina) {
    if (pagina < 1 || pagina > totalPaginas || pagina === paginaAtual) {
        return;
    }

    paginaAtual = pagina;
    filtrarLembretes();
}


// ========================================
// TEMA
// ========================================
btnTema.addEventListener("click", () => {
    const novoTema = document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro";

    aplicarTema(novoTema);
    localStorage.setItem("tema", novoTema);
});

function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
}


// ========================================
// UTILITÁRIOS
// ========================================
function formatarData(data) {

    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleString(
        "pt-BR",
        { dateStyle: "short", timeStyle: "short" }
    );
}

function escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";

    return div.innerHTML.replaceAll('"', "&quot;");
}

async function lerMensagemErro(response, mensagemPadrao) {
    try {
        const texto = (await response.text()).replace(/^"|"$/g, "");

        return texto || `${mensagemPadrao} (HTTP ${response.status})`;
    } catch {
        return `${mensagemPadrao} (HTTP ${response.status})`;
    }
}

//fetch lança TypeError quando não há resposta (API fora do ar, CORS, certificado)
function traduzirErro(error, mensagemPadrao) {
    if (error instanceof TypeError) {
        return "Não foi possível conectar à API. Verifique se ela está em execução.";
    }

    return error.message || mensagemPadrao;
}

function mostrarErroCampo(campo, elementoErro, mensagem) {
    campo.classList.add("campo-invalido");
    campo.setAttribute("aria-invalid", "true");
    elementoErro.textContent = mensagem;
    elementoErro.classList.remove("hidden");
}

function limparErroCampo(campo, elementoErro) {
    campo.classList.remove("campo-invalido");
    campo.removeAttribute("aria-invalid");
    elementoErro.textContent = "";
    elementoErro.classList.add("hidden");
}

function definirCarregando(botao, isCarregando) {
    botao.disabled = isCarregando;
    botao.classList.toggle("btn-carregando", isCarregando);
}

function mostrarToast(mensagem, tipo = "info") {
    const icones = { sucesso: "\u2713", erro: "\u2715", aviso: "!", info: "i" };

    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    toast.setAttribute("role", tipo === "erro" ? "alert" : "status");

    const icone = document.createElement("span");
    icone.className = "toast-icone";
    icone.textContent = icones[tipo] ?? icones.info;

    const texto = document.createElement("span");
    texto.textContent = mensagem;

    toast.append(icone, texto);
    document.getElementById("toasts").appendChild(toast);

    setTimeout(() => {
        toast.classList.add("saindo");
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}
