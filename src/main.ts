import "./style.css";
import { carregarAvisos, carregarRamais } from "./data";
import { applyTheme, getStoredTheme, toggleTheme } from "./theme";
import { agruparPorSetor, escapeHtml, isAvisoAtivo } from "./utils";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Container principal não encontrado.");
}

const root = app;

let busca = "";
let setorSelecionado = "";

applyTheme(getStoredTheme());

function baixarPlanilha(rows: { nome: string; numero: string; cargo: string; setor: string }[]) {
  const csv = [
    ["Nome", "Numero", "Cargo", "Setor"].join(";"),
    ...rows.map((row) =>
      [row.nome, row.numero, row.cargo, row.setor]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(";")
    )
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ramais-odontoart.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function render() {
  const [ramais, avisos] = await Promise.all([
    carregarRamais({ fallbackOnMissing: true }),
    carregarAvisos({ fallbackOnMissing: true })
  ]);
  const avisosAtivos = avisos.filter(isAvisoAtivo);
  const setores = [...new Set(ramais.map((ramal) => ramal.setor.replace(/^\*\s*/, "")).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const filtro = busca.trim().toLowerCase();
  const grupos = agruparPorSetor(
    ramais.filter((ramal) => {
      const setorLimpo = ramal.setor.replace(/^\*\s*/, "");
      const matchBusca = filtro
        ? [ramal.nome, ramal.numero, ramal.cargo, setorLimpo]
            .join(" ")
            .toLowerCase()
            .includes(filtro)
        : true;
      const matchSetor = setorSelecionado ? setorLimpo === setorSelecionado : true;
      return matchBusca && matchSetor;
    })
  );

  root.innerHTML = `
    <div class="page-shell">
      <section class="legacy-shell">
        <header class="legacy-header">
          <div class="brand-mark" aria-label="Odontoart">
            <img src="/logo-removebg-preview.png" alt="Odontoart" class="brand-image" />
          </div>
          <div class="legacy-title-wrap">
            <h1>RAMAIS</h1>
            <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Alternar tema">
              <span class="theme-icon theme-sun" aria-hidden="true"></span>
              <span class="theme-icon theme-moon" aria-hidden="true"></span>
            </button>
          </div>
        </header>

        ${
          avisosAtivos.length
            ? `<section class="legacy-alerts">
                ${avisosAtivos
                  .map(
                    (aviso) => `
                      <article class="notice-strip ${aviso.destaque ? "is-highlight" : ""}">
                        <span class="notice-inline">
                          <strong>${escapeHtml(aviso.titulo)}</strong>
                          <span class="notice-separator">|</span>
                          <span>${escapeHtml(aviso.mensagem)}</span>
                        </span>
                      </article>
                    `
                  )
                  .join("")}
              </section>`
            : ""
        }

        <section class="search-area">
          <label for="search-ramal">Buscar por:</label>
          <div class="search-fields">
            <input
              id="search-ramal"
              class="legacy-input search-name"
              type="search"
              placeholder="Digite o nome"
              value="${escapeHtml(busca)}"
            />
            <select id="search-setor" class="legacy-input search-sector">
              <option value="">Todos os setores</option>
              ${setores
                .map(
                  (setor) => `
                    <option value="${escapeHtml(setor)}" ${setorSelecionado === setor ? "selected" : ""}>
                      ${escapeHtml(setor)}
                    </option>
                  `
                )
                .join("")}
            </select>
          </div>
          <div class="legacy-actions">
            <button id="search-button" class="legacy-button" type="button">Buscar</button>
            <button id="download-button" class="legacy-button" type="button">Baixar Planilha</button>
          </div>
        </section>

        <section class="listing-area">
          ${
            Object.entries(grupos).length
              ? Object.entries(grupos)
                  .map(
                    ([setor, lista]) => `
                      <section class="sector-table-block">
                        <hr />
                        <h2>*${escapeHtml(setor)}</h2>
                        <table class="legacy-table">
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>Número</th>
                              <th>Cargo</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${lista
                              .map(
                                (ramal) => `
                                  <tr>
                                    <td>${escapeHtml(ramal.nome)}</td>
                                    <td>${escapeHtml(ramal.numero)}</td>
                                    <td>${escapeHtml(ramal.cargo)}</td>
                                  </tr>
                                `
                              )
                              .join("")}
                          </tbody>
                        </table>
                      </section>
                    `
                  )
                  .join("")
              : `<section class="sector-table-block">
                  <hr />
                  <h2>Resultado</h2>
                  <p class="empty-copy">Nenhum ramal encontrado para a busca informada.</p>
                </section>`
          }
        </section>
      </section>
    </div>
  `;

  document.querySelector<HTMLInputElement>("#search-ramal")?.addEventListener("input", (event) => {
    busca = (event.currentTarget as HTMLInputElement).value;
  });

  document.querySelector<HTMLSelectElement>("#search-setor")?.addEventListener("change", (event) => {
    setorSelecionado = (event.currentTarget as HTMLSelectElement).value;
    void render();
  });

  document.querySelector<HTMLButtonElement>("#search-button")?.addEventListener("click", () => {
    busca = document.querySelector<HTMLInputElement>("#search-ramal")?.value ?? "";
    setorSelecionado = document.querySelector<HTMLSelectElement>("#search-setor")?.value ?? "";
    void render();
  });

  document.querySelector<HTMLInputElement>("#search-ramal")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    busca = (event.currentTarget as HTMLInputElement).value;
    void render();
  });

  document.querySelector<HTMLButtonElement>("#download-button")?.addEventListener("click", () => {
    baixarPlanilha(ramais.map(({ nome, numero, cargo, setor }) => ({ nome, numero, cargo, setor })));
  });

  document.querySelector<HTMLButtonElement>("#theme-toggle")?.addEventListener("click", () => {
    toggleTheme();
  });
}

void render();
